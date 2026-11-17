import { desc, eq } from 'drizzle-orm';
import type { Dia, Horario } from '@/dac/tipos';
import { db, horario, oferecimento, professor, turma, turmaProfessor } from '@/db';

export async function getProfessor(slug: string) {
  const [p] = await db.select().from(professor).where(eq(professor.slug, slug));
  if (!p) return null;
  const ts = await db.select({ t: turma, o: oferecimento }).from(turmaProfessor)
    .innerJoin(turma, eq(turmaProfessor.turma_id, turma.id)).innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id))
    .where(eq(turmaProfessor.professor_id, p.id)).orderBy(desc(oferecimento.ano), desc(oferecimento.periodo), oferecimento.codigo, turma.turma);
  const hs = await db.select({ h: horario }).from(horario).innerJoin(turmaProfessor, eq(horario.turma_id, turmaProfessor.turma_id))
    .where(eq(turmaProfessor.professor_id, p.id)).orderBy(horario.id);
  const horarios = new Map<number, Horario[]>();
  for (const { h } of hs) (horarios.get(h.turma_id) ?? horarios.set(h.turma_id, []).get(h.turma_id)!).push({ dia: h.dia as Dia, inicio: h.inicio, fim: h.fim, sala: h.sala ?? '' });

  const semestres: { ano: number; periodo: 1 | 2; turmas: { codigo: string; nome: string; turma: string; horarios: Horario[] }[] }[] = [];
  for (const { t, o } of ts) {
    let s = semestres.find((x) => x.ano === o.ano && x.periodo === o.periodo);
    if (!s) semestres.push((s = { ano: o.ano, periodo: o.periodo as 1 | 2, turmas: [] }));
    s.turmas.push({ codigo: o.codigo, nome: o.nome, turma: t.turma, horarios: horarios.get(t.id) ?? [] });
  }
  return { nome: p.nome, slug: p.slug, semestres };
}
