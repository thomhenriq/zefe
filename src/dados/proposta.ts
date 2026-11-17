import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { db, curso, curriculo, curriculoObrigatoria, curriculoPropostaEletiva } from "@/db";
import type { PropostaSemestre } from "@/dac/tipos";

export const listarCursos = () =>
  db.select({ numero: curso.numero, nome: curso.nome, turno: curso.turno }).from(curso).orderBy(asc(curso.nome));

/** Modalidades do curso naquele catálogo; vazio se o currículo não tem modalidade. */
export async function listarModalidades(cursoNumero: number, catalogo: number) {
  return db
    .selectDistinct({ sigla: curriculo.modalidade, nome: curriculo.modalidade_nome })
    .from(curriculo)
    .where(and(eq(curriculo.curso, cursoNumero), eq(curriculo.ano, catalogo), isNotNull(curriculo.modalidade)))
    .orderBy(asc(curriculo.modalidade_nome)) as Promise<{ sigla: string; nome: string | null }[]>;
}

/** Proposta do currículo reconstruída do banco; null se o catálogo/currículo ainda não foi carregado. */
export async function carregarProposta(
  cursoNumero: number,
  catalogo: number,
  modalidade: string | null,
): Promise<PropostaSemestre[] | null> {
  const [cur] = await db
    .select({ id: curriculo.id })
    .from(curriculo)
    .where(
      and(
        eq(curriculo.curso, cursoNumero),
        eq(curriculo.ano, catalogo),
        modalidade === null ? isNull(curriculo.modalidade) : eq(curriculo.modalidade, modalidade),
      ),
    );
  if (!cur) return null;
  const obrig = await db
    .select({ codigo: curriculoObrigatoria.codigo, semestre: curriculoObrigatoria.semestre_sugerido })
    .from(curriculoObrigatoria)
    .where(eq(curriculoObrigatoria.curriculo_id, cur.id))
    .orderBy(asc(curriculoObrigatoria.codigo));
  const eletivas = await db
    .select({ semestre: curriculoPropostaEletiva.semestre, creditos: curriculoPropostaEletiva.creditos })
    .from(curriculoPropostaEletiva)
    .where(eq(curriculoPropostaEletiva.curriculo_id, cur.id));

  const porSemestre = new Map<number, PropostaSemestre>();
  const ref = (n: number) => {
    let s = porSemestre.get(n);
    if (!s) porSemestre.set(n, (s = { semestre: n, codigos: [], creditosEletivos: 0 }));
    return s;
  };
  for (const o of obrig) if (o.semestre != null) ref(o.semestre).codigos.push(o.codigo);
  for (const e of eletivas) ref(e.semestre).creditosEletivos += e.creditos;
  return [...porSemestre.values()].sort((a, b) => a.semestre - b.semestre);
}
