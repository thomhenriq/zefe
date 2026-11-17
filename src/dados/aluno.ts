import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, perfil, historico } from "@/db";
import { premarcar } from "@/dominio/premarcar";
import { carregarProposta, listarModalidades } from "./proposta";

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
