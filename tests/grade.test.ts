import { describe, expect, test } from 'bun:test';
import { checarGrade, type Achado, type Bloqueio, type ItemGrade } from '../src/dominio/grade';
import type { Campus, Dia } from '../src/dac/tipos';

const item = (codigo: string, dia: Dia, inicio: string, fim: string, campus: Campus = 'limeira', extra: Partial<ItemGrade> = {}): ItemGrade => ({
  codigo, nome: codigo, turma: 'A', creditos: 4, campus, tipo: 'oficial', reservas: [],
  horarios: [{ dia, inicio, fim, sala: 'X' }], ...extra,
});
const de = (as: Achado[], nivel: Achado['nivel']) => as.filter((a) => a.nivel === nivel);

describe('checarGrade', () => {
  test('duas turmas ter 19:00–21:00 → um conflito', () => {
    const r = checarGrade([item('AA001', 'ter', '19:00', '21:00'), item('BB002', 'ter', '19:00', '21:00')], []);
    expect(de(r.achados, 'conflito')).toHaveLength(1);
    expect(r.ok).toBe(false);
    expect(r.achados[0]!.codigos.sort()).toEqual(['AA001', 'BB002']);
  });

  test('aulas coladas (fim = início) não conflitam', () => {
    const r = checarGrade([item('AA001', 'ter', '19:00', '21:00'), item('BB002', 'ter', '21:00', '23:00')], []);
    expect(r.achados).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test('aula dentro de um bloqueio → conflito citando o nome', () => {
    const b: Bloqueio = { id: '1', nome: 'Estágio', dia: 'seg', inicio: '08:00', fim: '12:00' };
    const r = checarGrade([item('AA001', 'seg', '10:00', '12:00')], [b]);
    const c = de(r.achados, 'conflito');
    expect(c).toHaveLength(1);
    expect(c[0]!.motivo).toContain('Estágio');
    expect(c[0]!.codigos).toEqual(['AA001']);
  });

  test('Limeira 19–21 e Barão 21–23 no mesmo dia → aviso (sem conflito)', () => {
    const r = checarGrade([item('AA001', 'qua', '19:00', '21:00', 'limeira'), item('BB002', 'qua', '21:00', '23:00', 'barao')], []);
    expect(de(r.achados, 'conflito')).toEqual([]);
    expect(de(r.achados, 'aviso').some((a) => a.motivo.includes('campi'))).toBe(true);
    expect(r.ok).toBe(true);
  });

  test('campi diferentes com 90 min de folga não avisa', () => {
    const r = checarGrade([item('AA001', 'qua', '08:00', '10:00', 'limeira'), item('BB002', 'qua', '11:30', '13:00', 'barao')], []);
    expect(r.achados).toEqual([]);
  });

  test('Review Focus 1: sem horários → verificado false, aviso, créditos somados, sem exceção', () => {
    const r = checarGrade([item('AA001', 'seg', '08:00', '10:00'), item('BB002', 'seg', '08:00', '10:00', 'limeira', { horarios: [], creditos: 6 })], []);
    expect(r.verificado).toBe(false);
    expect(r.creditos).toBe(10);
    expect(r.achados.some((a) => a.nivel === 'aviso' && a.motivo.includes('horário não informado'))).toBe(true);
    expect(r.ok).toBe(true);
  });

  test('horário incompleto → verificado false e aviso', () => {
    const r = checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { horarioIncompleto: true })], []);
    expect(r.verificado).toBe(false);
    expect(r.achados.some((a) => a.motivo.includes('horário não informado'))).toBe(true);
  });

  test('créditos null contam 0 e tornam verificado false', () => {
    const r = checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { creditos: null })], []);
    expect(r.creditos).toBe(0);
    expect(r.verificado).toBe(false);
    expect(r.achados.some((a) => a.motivo.includes('créditos não informados'))).toBe(true);
  });

  test('previsão → aviso "horário previsto"', () => {
    const r = checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { tipo: 'previsao' })], []);
    expect(r.achados.some((a) => a.nivel === 'aviso' && a.motivo.includes('horário previsto'))).toBe(true);
  });

  test('reserva: outro curso avisa, mesmo curso não, ilegível diz que não entendeu', () => {
    const res = ['89 - Engenharia Ambiental /2026', '111 - Engenharia de Transportes'];
    expect(checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { reservas: res })], [], { curso: 94 }).achados[0]!.motivo).toContain('outro curso');
    expect(checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { reservas: res })], [], { curso: 89 }).achados).toEqual([]);
    expect(checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { reservas: ['Calouros'] })], [], { curso: 94 }).achados[0]!.motivo).toContain('não consegui ler');
    expect(checarGrade([item('AA001', 'seg', '08:00', '10:00', 'limeira', { reservas: res })], []).achados[0]!.motivo).toContain('não sei seu curso');
  });

  test('pré-requisito: faltamPrereq e prereqNaoVerificado viram aviso', () => {
    const r = checarGrade([item('AA001', 'seg', '08:00', '10:00'), item('BB002', 'ter', '08:00', '10:00')], [], {
      faltamPrereq: (c) => (c === 'AA001' ? ['ZZ101'] : []),
      prereqNaoVerificado: (c) => c === 'BB002',
    });
    expect(r.achados.map((a) => a.motivo)).toEqual([
      expect.stringContaining('pré-requisito não cumprido (falta ZZ101)'),
      expect.stringContaining('pré-requisito não verificado'),
    ]);
  });
});

// ---- dados (Postgres local; anos sentinela 1990–1993, nunca colidem com caderno real) ----
import { afterAll, beforeAll } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { bloqueio, catalogoDisciplina, db, grade, historico, horario, oferecimento, perfil, semestre, turma } from '../src/db';
import { alterarGrade, criarBloqueio, criarGrade, definirPrincipal, excluirBloqueio, excluirGrade, getGrade, listarGrades } from '../src/dados/grades';

const U = 'teste-grade-t11-a';
const V = 'teste-grade-t11-b';
const ANOS = [1990, 1991, 1992, 1993];
const limpar = async () => {
  for (const u of [U, V]) {
    await db.delete(grade).where(eq(grade.user_id, u));
    await db.delete(bloqueio).where(eq(bloqueio.user_id, u));
    await db.delete(historico).where(eq(historico.user_id, u));
    await db.delete(perfil).where(eq(perfil.user_id, u));
  }
  await db.delete(oferecimento).where(inArray(oferecimento.ano, ANOS)); // cascata leva turma e horario
  await db.delete(semestre).where(inArray(semestre.ano, ANOS));
  await db.delete(catalogoDisciplina).where(inArray(catalogoDisciplina.ano, ANOS));
};

async function oferta(ano: number, codigo: string, turmas: { t: string; h: [string, string, string][]; incompleto?: boolean; reservas?: string[] }[]) {
  const [o] = await db.insert(oferecimento).values({ ano, periodo: 1, codigo, nome: `Disc ${codigo}`, creditos: 4, instituto: 'FT', campus: 'limeira' }).returning();
  for (const x of turmas) {
    const [t] = await db.insert(turma).values({ oferecimento_id: o!.id, turma: x.t, horario_incompleto: !!x.incompleto, reservas: x.reservas ?? [] }).returning();
    for (const [dia, inicio, fim] of x.h) await db.insert(horario).values({ turma_id: t!.id, dia, inicio, fim, sala: 'S1' });
  }
}

describe('dados da grade', () => {
  beforeAll(async () => {
    await limpar();
    await db.insert(semestre).values([{ ano: 1991, periodo: 1, publicado: true }, { ano: 1992, periodo: 1, publicado: true }]);
    await oferta(1991, 'ZZ101', [{ t: 'A', h: [['seg', '08:00', '10:00']] }, { t: 'B', h: [['ter', '08:00', '10:00']], reservas: ['89 - Outro curso'] }]);
    await oferta(1991, 'ZZ102', [{ t: 'A', h: [['seg', '09:00', '11:00']] }, { t: 'B', h: [], }, { t: 'C', h: [['qua', '08:00', '09:00']], incompleto: true }]);
    await oferta(1992, 'ZZ103', [{ t: 'A', h: [['sex', '14:00', '16:00']] }]); // base da previsão de 1993
    await db.insert(catalogoDisciplina).values([
      { ano: 1991, codigo: 'ZZ102', nome: 'Disc ZZ102', alternativas: [[{ codigo: 'ZZ101', parcial: false }]] },
      { ano: 1991, codigo: 'ZZ101', nome: 'Disc ZZ101', alternativas: [] },
    ]);
    await db.insert(perfil).values({ user_id: U, curso: 94, catalogo: 1991, ingresso: 2020, semestre_atual: 1 });
  });
  afterAll(limpar);

  test('outro usuário: getGrade null; alterar/principal/excluir lançam e não mexem', async () => {
    const id = await criarGrade(U, 1991, 1, 'Plano A');
    expect(await getGrade(V, id)).toBeNull();
    await expect(alterarGrade(V, id, { adicionar: [{ codigo: 'ZZ101', turma: 'A' }] })).rejects.toThrow('grade não encontrada');
    await expect(definirPrincipal(V, id)).rejects.toThrow('grade não encontrada');
    await expect(excluirGrade(V, id)).rejects.toThrow('grade não encontrada');
    const g = await getGrade(U, id);
    expect(g?.itens).toEqual([]);
    expect(g?.id).toBe(id);
  });

  test('turma inexistente: erro em pt-BR e nada gravado; código é normalizado', async () => {
    const id = await criarGrade(U, 1991, 1, 'Plano B');
    await expect(alterarGrade(U, id, { adicionar: [{ codigo: 'zz101', turma: 'A' }, { codigo: 'ZZ101', turma: 'Z' }] })).rejects.toThrow('a turma Z de ZZ101 não existe em 1S/1991');
    expect((await getGrade(U, id))!.itens).toEqual([]);
    const g = await alterarGrade(U, id, { adicionar: [{ codigo: 'zz101', turma: 'a' }] });
    expect(g.itens.map((i) => [i.codigo, i.turma, i.tipo])).toEqual([['ZZ101', 'A', 'oficial']]);
    await expect(alterarGrade(U, id, { adicionar: [{ codigo: 'QQ999', turma: 'A' }] })).rejects.toThrow('não existe');
  });

  test('principal: primeira é principal, excluir promove outra, definirPrincipal troca', async () => {
    const [a, b, c] = [await criarGrade(U, 1992, 1, 'a'), await criarGrade(U, 1992, 1, 'b'), await criarGrade(U, 1992, 1, 'c')];
    expect((await listarGrades(U, 1992, 1)).map((g) => g.principal)).toEqual([true, false, false]);
    await definirPrincipal(U, c!);
    expect((await listarGrades(U, 1992, 1)).map((g) => g.principal)).toEqual([false, false, true]);
    await excluirGrade(U, c!);
    expect((await listarGrades(U, 1992, 1)).map((g) => g.principal)).toEqual([true, false]);
    await excluirGrade(U, a!); await excluirGrade(U, b!);
    expect(await listarGrades(U, 1992, 1)).toEqual([]);
  });

  test('bloqueios por usuário entram em toda grade e geram conflito; excluir de outro usuário lança', async () => {
    const id = await criarGrade(U, 1991, 1, 'Plano C');
    const bl = await criarBloqueio(U, { nome: 'Estágio', dia: 'seg', inicio: '07:00', fim: '12:00' });
    await expect(criarBloqueio(U, { nome: 'x', dia: 'seg', inicio: '12:00', fim: '07:00' })).rejects.toThrow();
    const g = await alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ101', turma: 'A' }] });
    expect(g.bloqueios.map((b) => b.nome)).toEqual(['Estágio']);
    expect(g.checagem.ok).toBe(false);
    expect(g.checagem.achados.find((a) => a.nivel === 'conflito')!.motivo).toContain('Estágio');
    await expect(excluirBloqueio(V, bl.id)).rejects.toThrow('bloqueio não encontrado');
    expect((await getGrade(U, id))!.bloqueios).toHaveLength(1);
    await excluirBloqueio(U, bl.id);
    expect((await getGrade(U, id))!.bloqueios).toEqual([]);
  });

  test('pré-requisito, reserva, sem horário e horário incompleto vindos do banco', async () => {
    const id = await criarGrade(U, 1991, 1, 'Plano D');
    let g = await alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ102', turma: 'B' }, { codigo: 'ZZ101', turma: 'B' }] });
    const m = g.checagem.achados.map((a) => a.motivo).join('\n');
    expect(m).toContain('ZZ102 B: pré-requisito não cumprido (falta ZZ101)');
    expect(m).toContain('reservada para outro curso');
    expect(m).toContain('horário não informado');
    expect(g.checagem.verificado).toBe(false);
    expect(g.checagem.creditos).toBe(8);
    await db.insert(historico).values({ user_id: U, codigo: 'ZZ101', estado: 'cursando', origem: 'aluno' });
    g = await alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ102', turma: 'C' }], remover: ['zz101'] });
    expect(g.checagem.achados.map((a) => a.motivo).join('\n')).not.toContain('pré-requisito');
    expect(g.checagem.achados.some((a) => a.motivo.includes('horário não informado'))).toBe(true);
    expect(g.itens[0]!.horarioIncompleto).toBe(true);
    g = await alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ101', turma: 'A' }] });
    expect(g.checagem.achados.some((a) => a.motivo.includes('pré-requisito não verificado'))).toBe(false); // ZZ101 tem catálogo (sem pré)
  });

  test('semestre não publicado: itens resolvem pela base da previsão com tipo previsao', async () => {
    const id = await criarGrade(U, 1993, 1, 'Futuro');
    await expect(alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ103', turma: 'Q' }] })).rejects.toThrow('não existe');
    const g = await alterarGrade(U, id, { adicionar: [{ codigo: 'ZZ103', turma: 'A' }] });
    expect(g.itens[0]).toMatchObject({ codigo: 'ZZ103', tipo: 'previsao' });
    expect(g.checagem.achados.some((a) => a.motivo.includes('horário previsto'))).toBe(true);
    expect(g.checagem.achados.some((a) => a.motivo.includes('pré-requisito não verificado'))).toBe(true); // sem entrada no catálogo
  });
});
