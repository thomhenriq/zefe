import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, perfil, historico, curriculo, curriculoObrigatoria, curriculoEletiva, curriculoPropostaEletiva, catalogoDisciplina, oferecimento } from "@/db";
import { premarcar } from "@/dominio/premarcar";
import { carregarProposta, listarModalidades } from "./proposta";
import { calcularIntegralizacao, type Integralizacao } from "@/dominio/integralizacao";
import { proximoSemestre } from "@/dominio/oferta";
import { listarGrades, getGrade } from "./grades";
import type { Requisito } from "@/dac/tipos";

export type Perfil = typeof perfil.$inferSelect;
export type Estado = "cursada" | "cursando";

export const ANO_INGRESSO_MIN = 2020;

export const perfilSchema = z.object({
  curso: z.number().int().positive(),
  catalogo: z.number().int().min(ANO_INGRESSO_MIN).max(2100),
  modalidade: z.string().min(1).nullable(),
  ingresso: z.number().int().min(ANO_INGRESSO_MIN).max(2100),
  semestreAtual: z.number().int().min(0).max(30),
});
export type PerfilEntrada = z.infer<typeof perfilSchema>;

export async function getPerfil(userId: string): Promise<Perfil | null> {
  const [p] = await db.select().from(perfil).where(eq(perfil.user_id, userId));
  return p ?? null;
}

/**
 * Grava o perfil. Só no primeiro cadastro aplica `premarcar` (origem 'premarcada');
 * depois, trocar curso/catálogo preserva o histórico existente.
 * Catálogo ainda não carregado: salva o perfil sem pré-marcar.
 */
export async function salvarPerfil(userId: string, entrada: PerfilEntrada): Promise<void> {
  const e = perfilSchema.parse(entrada);
  const modalidades = await listarModalidades(e.curso, e.catalogo);
  if (modalidades.length > 0 && e.modalidade === null) throw new Error("este currículo exige modalidade");
  if (e.modalidade !== null && !modalidades.some((m) => m.sigla === e.modalidade)) {
    throw new Error(`modalidade ${e.modalidade} não existe neste currículo`);
  }
  const proposta = await carregarProposta(e.curso, e.catalogo, e.modalidade);
  if (proposta) {
    const n = Math.max(0, ...proposta.map((s) => s.semestre));
    if (e.semestreAtual > n) throw new Error(`semestre atual ${e.semestreAtual} fora da proposta (1 a ${n})`);
  }
  const dados = {
    curso: e.curso,
    catalogo: e.catalogo,
    modalidade: e.modalidade,
    ingresso: e.ingresso,
    semestre_atual: e.semestreAtual,
  };
  await db.transaction(async (tx) => {
    const [existente] = await tx.select({ id: perfil.user_id }).from(perfil).where(eq(perfil.user_id, userId));
    if (existente) {
      await tx.update(perfil).set(dados).where(eq(perfil.user_id, userId));
      return;
    }
    await tx.insert(perfil).values({ user_id: userId, ...dados });
    const marcas = proposta ? premarcar(proposta, e.semestreAtual) : [];
    if (marcas.length > 0) {
      await tx
        .insert(historico)
        .values(marcas.map((m) => ({ user_id: userId, codigo: m.codigo, estado: m.estado, origem: "premarcada" })))
        .onConflictDoNothing();
    }
  });
}

export async function getHistorico(userId: string): Promise<Map<string, Estado>> {
  const rows = await db.select().from(historico).where(eq(historico.user_id, userId));
  return new Map(rows.map((r) => [r.codigo, r.estado as Estado]));
}

/** estado null remove a marca. Qualquer mudança do aluno passa a ter origem 'aluno'. */
export async function marcarHistorico(userId: string, codigo: string, estado: Estado | null): Promise<void> {
  if (estado === null) {
    await db.delete(historico).where(and(eq(historico.user_id, userId), eq(historico.codigo, codigo)));
    return;
  }
  await db
    .insert(historico)
    .values({ user_id: userId, codigo, estado, origem: "aluno" })
    .onConflictDoUpdate({ target: [historico.user_id, historico.codigo], set: { estado, origem: "aluno" } });
}

/** Integralização do aluno com dados do banco; perfil ou currículo ausente → erro (o chamador já exige onboarding). */
export async function getIntegralizacao(userId: string): Promise<Integralizacao> {
  const p = await getPerfil(userId);
  if (!p || p.curso == null || p.catalogo == null) throw new Error("perfil incompleto");
  const [cur] = await db
    .select({ id: curriculo.id })
    .from(curriculo)
    .where(and(eq(curriculo.curso, p.curso), eq(curriculo.ano, p.catalogo), p.modalidade === null ? isNull(curriculo.modalidade) : eq(curriculo.modalidade, p.modalidade)));
  if (!cur) throw new Error("currículo não carregado");

  const [obrig, eletivas, propostaEletivas, hist, grades] = await Promise.all([
    db.select().from(curriculoObrigatoria).where(eq(curriculoObrigatoria.curriculo_id, cur.id)).orderBy(asc(curriculoObrigatoria.codigo)),
    db.select().from(curriculoEletiva).where(eq(curriculoEletiva.curriculo_id, cur.id)).orderBy(asc(curriculoEletiva.id)),
    db.select().from(curriculoPropostaEletiva).where(eq(curriculoPropostaEletiva.curriculo_id, cur.id)),
    getHistorico(userId),
    (async () => {
      const { ano, periodo } = proximoSemestre();
      const principal = (await listarGrades(userId, ano, periodo)).find((g) => g.principal);
      return principal ? ((await getGrade(userId, principal.id))?.itens ?? []) : [];
    })(),
  ]);

  const codigos = [...new Set([...obrig.map((o) => o.codigo), ...hist.keys()])];
  const cat = new Map(
    (await db.select().from(catalogoDisciplina).where(and(eq(catalogoDisciplina.ano, p.catalogo), inArray(catalogoDisciplina.codigo, codigos)))).map((c) => [c.codigo, c]),
  );
  // fallback de nome/créditos: oferecimento mais recente do código
  const faltam = codigos.filter((c) => !cat.get(c));
  const recente = new Map<string, { nome: string; creditos: number | null }>();
  if (faltam.length > 0) {
    for (const o of await db.select().from(oferecimento).where(inArray(oferecimento.codigo, faltam)).orderBy(desc(oferecimento.ano), desc(oferecimento.periodo))) {
      if (!recente.has(o.codigo)) recente.set(o.codigo, o);
    }
  }
  const creditosDe = (c: string) => cat.get(c)?.creditos ?? recente.get(c)?.creditos ?? null;

  return calcularIntegralizacao({
    obrigatorias: obrig.map((o) => ({
      codigo: o.codigo,
      nome: cat.get(o.codigo)?.nome ?? recente.get(o.codigo)?.nome ?? o.codigo,
      creditos: creditosDe(o.codigo) ?? 0,
      semestreSugerido: o.semestre_sugerido,
    })),
    eletivas: eletivas.map((g) => ({ creditos: g.creditos ?? 0, texto: g.texto, codigos: g.codigos, verificado: g.verificado })),
    propostaEletivas,
    historico: hist,
    planejadas: new Set(grades.map((i) => i.codigo)),
    creditosDe,
    prereq: (c) => {
      const e = cat.get(c);
      return e ? ((e.alternativas as Requisito[][] | null) ?? []) : null; // sem entrada no catálogo do aluno = desconhecido
    },
  });
}
