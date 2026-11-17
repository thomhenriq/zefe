import { and, asc, eq, isNull } from "drizzle-orm";
import { db, curriculo, curriculoEletiva } from "@/db";
import type { Perfil } from "./aluno";

/** Para cada grupo de eletivas (mesma ordem de `getIntegralizacao().grupos`): true se aberto (`codigos` nulo = qualquer disciplina). */
export async function gruposAbertos(p: Perfil): Promise<boolean[]> {
  if (p.curso == null || p.catalogo == null) return [];
  const rows = await db
    .select({ codigos: curriculoEletiva.codigos })
    .from(curriculoEletiva)
    .innerJoin(curriculo, eq(curriculo.id, curriculoEletiva.curriculo_id))
    .where(and(eq(curriculo.curso, p.curso), eq(curriculo.ano, p.catalogo), p.modalidade === null ? isNull(curriculo.modalidade) : eq(curriculo.modalidade, p.modalidade)))
    .orderBy(asc(curriculoEletiva.id));
  return rows.map((r) => r.codigos === null);
}
