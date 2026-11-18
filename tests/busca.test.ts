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

test('prefixo de código encontra os três, em ordem de nome', async () => {
  const r = (await buscar('zy9')).disciplinas.map((d) => d.codigo);
  expect(r.slice(0, 3)).toEqual(['ZY902', 'ZY901', 'ZY903']);
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
