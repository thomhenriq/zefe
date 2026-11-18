import { afterAll, beforeAll, expect, test } from 'bun:test';
import { and, eq, like } from 'drizzle-orm';
import { catalogoDisciplina, db, horario, oferecimento, professor, semestre, turma } from '@/db';
import { buscar, buscarDisciplinas } from '@/dados/busca';

// sentinelas: ano 1992, catálogo 1992, códigos ZY…, slug zy-… (um job real grava no mesmo banco)
const limpar = async () => {
  await db.delete(oferecimento).where(and(eq(oferecimento.ano, 1992), like(oferecimento.codigo, 'ZY%')));
  await db.delete(semestre).where(eq(semestre.ano, 1992));
  await db.delete(professor).where(like(professor.slug, 'zy-%'));
  await db.delete(catalogoDisciplina).where(and(like(catalogoDisciplina.codigo, 'ZY%'), eq(catalogoDisciplina.ano, 1992)));
};
beforeAll(async () => {
  await limpar();
  await db.insert(catalogoDisciplina).values([
    { ano: 1992, codigo: 'ZY901', nome: 'Cálculo Sentinela', creditos: 6, ementa: null, prereq_texto: '', alternativas: [] },
    { ano: 1992, codigo: 'ZY904', nome: 'Termodinâmica Sentinela II', creditos: 4, ementa: null, prereq_texto: '', alternativas: [] },
    { ano: 1992, codigo: 'ZY903', nome: 'Outra Sentinela', creditos: 4, ementa: null, prereq_texto: '', alternativas: [] },
  ]);
  await db.insert(semestre).values({ ano: 1992, periodo: 1, publicado: true, coletado_em: new Date() });
  await db.insert(professor).values({ nome: 'José da Conceição ZY', slug: 'zy-jose-da-conceicao' });
  const [o] = await db.insert(oferecimento).values({ ano: 1992, periodo: 1, codigo: 'ZY902', nome: 'Álgebra Ímpar', instituto: 'FT' }).returning();
  const [t] = await db.insert(turma).values({ oferecimento_id: o!.id, turma: 'A' }).returning();
  await db.insert(horario).values({ turma_id: t!.id, dia: 'seg', inicio: '19:00', fim: '21:00', sala: 'ZYSALA1' });
});
afterAll(limpar);

test('sem acento, por pedaço do nome, código, professor e sala', async () => {
  expect((await buscar('calculo sentinela')).disciplinas.map((d) => d.codigo)).toContain('ZY901');
  expect((await buscar('CÁLCULO sent')).disciplinas.find((d) => d.codigo === 'ZY901')?.nome).toBe('Cálculo Sentinela');
  expect((await buscar('algebra impar')).disciplinas.map((d) => d.codigo)).toContain('ZY902'); // só no caderno
  expect((await buscar('zy 903')).disciplinas.map((d) => d.codigo)).toContain('ZY903');
  expect((await buscar('conceicao zy')).professores).toEqual([{ slug: 'zy-jose-da-conceicao', nome: 'José da Conceição ZY' }]);
  expect((await buscar('zysala')).salas).toEqual(['ZYSALA1']);
  expect(await buscar('   ')).toEqual({ disciplinas: [], professores: [], salas: [] });
  expect((await buscar('100%_')).disciplinas).toEqual([]); // curingas não vazam
});

test('código com letra de turma acha a disciplina; hífen não quebra', async () => {
  expect((await buscar('ZY901A')).disciplinas.map((d) => d.codigo)).toEqual(['ZY901']);
  expect((await buscar('zy 901 b')).disciplinas.map((d) => d.codigo)).toContain('ZY901');
  expect(await buscar('zy-901')).toEqual({ disciplinas: [], professores: [], salas: [] });
});

test('prefixo de código encontra os três, em ordem de código', async () => {
  const r = (await buscar('zy9')).disciplinas.map((d) => d.codigo);
  expect(r.slice(0, 3)).toEqual(['ZY901', 'ZY902', 'ZY903']);
});

test('número e romano se equivalem (1 e I, 2 e II) sem casar letra solta', async () => {
  expect((await buscar('termodinamica sentinela 2')).disciplinas.map((d) => d.codigo)).toContain('ZY904');
  expect((await buscar('termodinamica sentinela ii')).disciplinas.map((d) => d.codigo)).toContain('ZY904');
  expect((await buscar('termodinamica sentinela 1')).disciplinas.map((d) => d.codigo)).not.toContain('ZY904');
  expect((await buscar('termodinamica sentinela i')).disciplinas.map((d) => d.codigo)).not.toContain('ZY904');
});

test('buscarDisciplinas devolve só disciplinas, mesmo critério de buscar', async () => {
  expect((await buscarDisciplinas('calculo sentinela')).map((d) => d.codigo)).toContain('ZY901');
  expect(await buscarDisciplinas('   ')).toEqual([]);
  expect(await buscarDisciplinas('zysala')).toEqual([]); // sala não vira disciplina
});

test('entrada parcial: nome sem acento, pedaço curto só no começo de palavra, limite', async () => {
  expect((await buscar('calc', 5000)).disciplinas.map((d) => d.codigo)).toContain('ZY901');
  expect((await buscar('te', 5000)).disciplinas.map((d) => d.codigo)).toContain('ZY904'); // Termodinâmica começa com "te"
  expect((await buscar('rmo', 5000)).disciplinas.map((d) => d.codigo)).toContain('ZY904'); // 3+ letras casa no meio
  expect((await buscar('mo', 5000)).disciplinas.map((d) => d.codigo)).not.toContain('ZY904'); // 2 letras só no começo de palavra
  expect((await buscar('zysa')).salas).toEqual(['ZYSALA1']);
  expect((await buscar('josé conc zy')).professores.length).toBe(1);
  expect((await buscar('zy', 2)).disciplinas.length).toBe(2);
  expect(await buscar('zyxwv')).toEqual({ disciplinas: [], professores: [], salas: [] });
  expect((await buscar('zy 90')).disciplinas.map((d) => d.codigo)).toEqual((await buscar('ZY90')).disciplinas.map((d) => d.codigo));
});

test('ranking: código, depois nome que começa, depois começo de palavra, depois contém', async () => {
  // ZY905 (código fora do prefixo) com nomes de cada tipo para a consulta "sent"
  await db.insert(catalogoDisciplina).values([
    { ano: 1992, codigo: 'ZY911', nome: 'Pré-sentimento', creditos: 2, ementa: null, prereq_texto: '', alternativas: [] },
    { ano: 1992, codigo: 'ZY912', nome: 'Sentido Único', creditos: 2, ementa: null, prereq_texto: '', alternativas: [] },
    { ano: 1992, codigo: 'ZY913', nome: 'Ressentir', creditos: 2, ementa: null, prereq_texto: '', alternativas: [] },
  ]);
  const r = (await buscar('sent', 50)).disciplinas.map((d) => d.codigo).filter((c) => /^ZY9(1[123]|01|03)$/.test(c));
  expect(r).toEqual(['ZY912', 'ZY901', 'ZY903', 'ZY911', 'ZY913']); // nome começa; começo de palavra (por nome); contém
});

// dados reais carregados no banco local (catálogo 2026): vale como regressão do que o aluno digita
test('dados reais: si7, si 70, mc9, calc, inteligencia', async () => {
  const cods = async (q: string) => (await buscar(q, 50, true)).disciplinas.map((d) => d.codigo);
  const si7 = await cods('si7');
  expect(si7.length).toBeGreaterThan(0);
  expect(si7.every((c) => c.startsWith('SI7'))).toBe(true);
  expect((await cods('si 70')).slice(0, 2).every((c) => c.startsWith('SI70'))).toBe(true);
  expect((await cods('mc9'))[0]!.startsWith('MC9')).toBe(true);
  expect((await buscar('calc', 50, true)).disciplinas.some((d) => /^C[áa]lculo/i.test(d.nome))).toBe(true);
  expect(await cods('inteligencia')).toContain('MC906');
  expect(await cods('qqqqzzzz')).toEqual([]);
});
