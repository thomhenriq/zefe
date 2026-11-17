import { db, semestre } from "@/db";
import type { Sem } from "@/dominio/semestre";

/** Semestres que o banco conhece (publicados ou não). */
export async function listarSemestres(): Promise<(Sem & { publicado: boolean })[]> {
  const rows = await db.select().from(semestre);
  return rows.map((r) => ({ ano: r.ano, periodo: r.periodo as 1 | 2, publicado: r.publicado }));
}
