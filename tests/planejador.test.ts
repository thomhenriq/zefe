import { describe, expect, test } from 'bun:test';
import type { Bloqueio, ItemGrade } from '../src/dominio/grade';
import { agruparCandidatos, encaixarTurmas, type Cartao, type DisciplinaOferta } from '../src/dominio/planejador';

const h = (dia: 'seg' | 'ter' | 'qua', inicio: string, fim: string) => ({ dia, inicio, fim, sala: 'CB01' });
const noGrade = (codigo: string, dia: 'seg' | 'ter' | 'qua', inicio: string, fim: string): ItemGrade =>
  ({ codigo, nome: codigo, turma: 'A', creditos: 4, campus: 'limeira', tipo: 'oficial', reservas: [], horarios: [h(dia, inicio, fim)] });
const disc = (turmas: DisciplinaOferta['turmas']): DisciplinaOferta =>
  ({ codigo: 'SI500', nome: 'Teste', creditos: 4, campus: 'limeira', tipo: 'oficial', turmas });
const turma = (t: string, ...horarios: ReturnType<typeof h>[]) => ({ turma: t, horarios, docentes: [], reservas: [] });

describe('encaixarTurmas', () => {
  const grade = [noGrade('AA001', 'seg', '08:00', '10:00')];
  const bloq: Bloqueio[] = [{ id: '1', nome: 'Estágio', dia: 'ter', inicio: '13:00', fim: '17:00' }];

  test('separa as que cabem das que conflitam, com o motivo do checarGrade', () => {
    const r = encaixarTurmas(disc([turma('A', h('seg', '09:00', '11:00')), turma('B', h('seg', '10:00', '12:00')), turma('C', h('ter', '14:00', '16:00'))]), grade, bloq);
    expect(r.map((x) => [x.turma, x.cabe])).toEqual([['A', false], ['B', true], ['C', false]]);
    expect(r[0]!.conflitos[0]).toContain('AA001');
    expect(r[2]!.conflitos[0]).toContain('Estágio');
  });

  test('conflito que já existia na grade e não envolve a disciplina não conta', () => {
    const g = [noGrade('AA001', 'seg', '08:00', '10:00'), noGrade('BB002', 'seg', '09:00', '11:00')];
    expect(encaixarTurmas(disc([turma('A', h('qua', '08:00', '10:00'))]), g, [])[0]!.cabe).toBe(true);
  });

  test('a mesma disciplina já na grade não conflita consigo (trocar de turma)', () => {
    const g = [{ ...noGrade('SI500', 'seg', '08:00', '10:00'), turma: 'A' }];
    expect(encaixarTurmas(disc([turma('B', h('seg', '09:00', '11:00'))]), g, [])[0]!.cabe).toBe(true);
  });

  test('turma sem horário cabe, mas fica marcada', () => {
    const r = encaixarTurmas(disc([turma('A')]), grade, [])[0]!;
    expect(r.cabe).toBe(true);
    expect(r.semHorario).toBe(true);
  });

  test('previsão: aviso de campus entre aulas vem como aviso, não conflito', () => {
    const g = [{ ...noGrade('AA001', 'seg', '08:00', '10:00'), campus: 'barao' as const }];
    const r = encaixarTurmas(disc([turma('A', h('seg', '10:30', '12:00'))]), g, [])[0]!;
    expect(r.cabe).toBe(true);
    expect(r.avisos[0]).toContain('campi');
  });
});

describe('avisos por turma', () => {
  test('reserva de outro curso aparece só na turma reservada; previsão e pré-requisito ficam de fora', () => {
    const d = { ...disc([{ ...turma('A', h('seg', '14:00', '16:00')), reservas: ['36 - Sistemas /2026'] }, turma('B', h('seg', '16:00', '18:00'))]), tipo: 'previsao' as const };
    const r = encaixarTurmas(d, [], [], { curso: 94, faltamPrereq: () => ['SI100'] });
    expect(r[0]!.cabe).toBe(true);
    expect(r[0]!.avisos).toHaveLength(1);
    expect(r[0]!.avisos[0]).toContain('reservada para outro curso');
    expect(r[1]!.avisos).toEqual([]);
  });
});

describe('agruparCandidatos', () => {
  const c = (codigo: string, estado: Cartao['estado'], semestre: number | null, extra: Partial<Cartao> = {}): Cartao =>
    ({ codigo, nome: codigo, creditos: 4, semestre, estado, faltamPrereq: [], prereqDesconhecido: false, oferta: disc([turma('A', h('seg', '08:00', '10:00'))]), ...extra });

  test('só faltando/planejada/travada; agrupa por semestre sugerido, sem semestre por último', () => {
    const g = agruparCandidatos([c('Z1', 'faltando', 3), c('A1', 'cursada', 1), c('B1', 'faltando', 1), c('N1', 'faltando', null), c('C1', 'cursando', 1), c('A2', 'planejada', 1)]);
    expect(g.map((x) => [x.semestre, x.cartoes.map((k) => k.codigo)])).toEqual([[1, ['A2', 'B1']], [3, ['Z1']], [null, ['N1']]]);
  });

  test('situação: travada com motivo, sem oferta nunca escondida, arrastável', () => {
    const g = agruparCandidatos([
      c('T1', 'travada', 2, { faltamPrereq: ['SI100', 'MA111'], oferta: null }),
      c('S1', 'faltando', 2, { oferta: null, semOfertaMotivo: 'não aparece' }),
      c('F1', 'faltando', 2),
    ])[0]!.cartoes;
    const por = Object.fromEntries(g.map((k) => [k.codigo, k.situacao]));
    expect(por.T1).toEqual({ tipo: 'travada', motivo: 'falta SI100, MA111' });
    expect(por.S1).toEqual({ tipo: 'sem-oferta', motivo: 'não aparece' });
    expect(por.F1).toEqual({ tipo: 'livre' });
  });
});

test('dentro do semestre, o que dá para arrastar vem antes de travada e sem oferta', () => {
  const k = (codigo: string, extra: Partial<Cartao>): Cartao => ({ codigo, nome: codigo, creditos: 4, semestre: 1, estado: 'faltando', faltamPrereq: [], prereqDesconhecido: false, oferta: disc([]), ...extra });
  const g = agruparCandidatos([k('A', { oferta: null }), k('B', { estado: 'travada', faltamPrereq: ['X'] }), k('C', {})]);
  expect(g[0]!.cartoes.map((x) => x.codigo)).toEqual(['C', 'A', 'B']);
});
