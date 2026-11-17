import { afterAll, beforeEach, expect, test } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { db, horario, oferecimento, semestre, turma, turmaProfessor } from '@/db';
import { slugProfessor, sincronizarCaderno } from '@/dac/sync-caderno';
import { baixarFalso } from './caderno-falso';

const ANO = 1999; // nenhum semestre real usa este ano
const limpar = async () => {
  await db.delete(oferecimento).where(eq(oferecimento.ano, ANO));
  await db.delete(semestre).where(eq(semestre.ano, ANO));
};
beforeEach(limpar);
afterAll(async () => {
  await limpar();
});

const turmas = async () => (await db.select().from(turma).innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id)).where(eq(oferecimento.ano, ANO))).length;

test('slugProfessor', () => expect(slugProfessor('José  D\'Ávila Neto')).toBe('jose-davila-neto'));

test('sincroniza duas vezes sem duplicar; páginas que não parseiam vão para erros', async () => {
  const { baixar } = await baixarFalso();
  const r1 = await sincronizarCaderno(db, baixar, ANO, 1, { institutos: ['FT'] });
  expect(r1.ok).toBe(1); // só EB101 existe no caderno falso
  expect(r1.erros.length).toBe(208);
  const n = await turmas();
  expect(n).toBeGreaterThan(0);
  await sincronizarCaderno(db, baixar, ANO, 1, { institutos: ['FT'] });
  expect(await turmas()).toBe(n);
  const [of] = await db.select().from(oferecimento).where(and(eq(oferecimento.ano, ANO), eq(oferecimento.codigo, 'EB101')));
  expect(of).toMatchObject({ nome: 'Cálculo I', creditos: 6, instituto: 'FT', campus: 'limeira' });
  expect((await db.select().from(oferecimento).where(eq(oferecimento.ano, ANO))).length).toBe(1);
  expect((await db.select().from(horario).innerJoin(turma, eq(horario.turma_id, turma.id)).where(eq(turma.oferecimento_id, of!.id))).length).toBeGreaterThan(0);
  expect((await db.select().from(turmaProfessor).innerJoin(turma, eq(turmaProfessor.turma_id, turma.id)).where(eq(turma.oferecimento_id, of!.id))).length).toBeGreaterThan(0);
  const [s] = await db.select().from(semestre).where(eq(semestre.ano, ANO));
  expect(s!.publicado).toBe(true);
});

test('índice vazio grava publicado=false e nenhum oferecimento', async () => {
  const baixar = async () => '<html><body></body></html>'; // índice sem institutos, como 1S/2027 real
  const r = await sincronizarCaderno(db, baixar, ANO, 2);
  expect(r).toEqual({ ok: 0, erros: [] });
  const [s] = await db.select().from(semestre).where(eq(semestre.ano, ANO));
  expect(s!.publicado).toBe(false);
  expect((await db.select().from(oferecimento).where(eq(oferecimento.ano, ANO))).length).toBe(0);
});

test('instituto desconhecido vai para erros e não toca no semestre', async () => {
  const { baixar } = await baixarFalso();
  await db.insert(semestre).values({ ano: ANO, periodo: 1, publicado: true });
  const r = await sincronizarCaderno(db, baixar, ANO, 1, { institutos: ['XX'] });
  expect(r.ok).toBe(0);
  expect(r.erros[0]).toContain('XX');
  const [s] = await db.select().from(semestre).where(eq(semestre.ano, ANO));
  expect(s!.publicado).toBe(true);
});

test('tudo falhando não marca publicado', async () => {
  const { baixar } = await baixarFalso();
  const quebrado = (url: string) => (/\/[A-Z]{2}\d{3}$/.test(url) ? Promise.reject(new Error('HTTP 503')) : baixar(url));
  const r = await sincronizarCaderno(db, quebrado, ANO, 1, { institutos: ['FT'] });
  expect(r.ok).toBe(0);
  expect(r.erros.length).toBe(209);
  expect(await db.select().from(semestre).where(eq(semestre.ano, ANO))).toEqual([]);
});
