import { and, eq, sql } from 'drizzle-orm';
import type { Dia } from '@/dac/tipos';
import { db, horario, oferecimento, turma } from '@/db';

const ORDEM: Record<string, number> = { seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5 };

export async function getSala(sala: string, ano: number, periodo: 1 | 2) {
  const nome = sala.trim();
  if (!nome) return null;
  const rows = await db.select({ sala: horario.sala, dia: horario.dia, inicio: horario.inicio, fim: horario.fim, codigo: oferecimento.codigo, turma: turma.turma })
    .from(horario).innerJoin(turma, eq(horario.turma_id, turma.id)).innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id))
    .where(and(sql`upper(${horario.sala}) = upper(${nome})`, eq(oferecimento.ano, ano), eq(oferecimento.periodo, periodo)));
  if (!rows.length) return null;
  const ocupacao = rows.map((r) => ({ dia: r.dia as Dia, inicio: r.inicio, fim: r.fim, codigo: r.codigo, turma: r.turma }))
    .sort((a, b) => ORDEM[a.dia]! - ORDEM[b.dia]! || a.inicio.localeCompare(b.inicio));
  return { sala: rows[0]!.sala!, ocupacao };
}
