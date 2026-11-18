import { db, semestre } from "@/db";
import { rotuloSemestre, type Sem } from "@/dominio/semestre";
import { getOferta } from "@/dados/disciplinas";
import type { DisciplinaOferta } from "@/dominio/planejador";

/** Semestres que o banco conhece (publicados ou não). */
export async function listarSemestres(): Promise<(Sem & { publicado: boolean })[]> {
  const rows = await db.select().from(semestre);
  return rows.map((r) => ({ ano: r.ano, periodo: r.periodo as 1 | 2, publicado: r.publicado }));
}


export type OfertaPlanejador = { oferta: DisciplinaOferta; motivo?: undefined } | { oferta: null; motivo: string };

/** Oferta de uma disciplina no semestre para o planejador. Nunca devolve vagas/matriculados; previsão leva as evidências por extenso. */
export async function ofertaPlanejador(codigo: string, ano: number, periodo: 1 | 2): Promise<OfertaPlanejador> {
  const o = await getOferta(codigo, ano, periodo);
  if (!o.encontrada) return { oferta: null, motivo: o.motivo };
  const d = o.tipo === "oficial" ? o.disciplina : o.base;
  return {
    oferta: {
      codigo: d.codigo, nome: d.nome, creditos: d.creditos, campus: d.campus, tipo: o.tipo,
      ...(o.tipo === "previsao" ? { evidencias: o.evidencias.map((e) => rotuloSemestre(e.ano, e.periodo)).join(", ") } : {}),
      turmas: d.turmas.map((t) => ({ turma: t.turma, horarios: t.horarios, docentes: t.docentes, reservas: t.reservas, ...(t.horarioIncompleto ? { horarioIncompleto: true } : {}) })),
    },
  };
}
