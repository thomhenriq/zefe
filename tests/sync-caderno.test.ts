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
  const { baixar: cheio } = await baixarFalso();
  const vazio = Bun.file(`${import.meta.dir}/fixtures/caderno/ft27.html`).text();
  const baixar = async (url: string) => (/\/S\/G\/[A-Z]+$/.test(url) ? (await vazio).replaceAll('/2027/1/', `/${ANO}/2/`).replaceAll('/S/G/FT', url.slice(url.indexOf('/S/G/'))) : cheio(url).then((h) => h.replaceAll('/2026/1/', `/${ANO}/2/`)));
  const r = await sincronizarCaderno(db, baixar, ANO, 2);
  expect(r).toEqual({ ok: 0, erros: [] });
  const [s] = await db.select().from(semestre).where(eq(semestre.ano, ANO));
  expect(s!.publicado).toBe(false);
  expect((await db.select().from(oferecimento).where(eq(oferecimento.ano, ANO))).length).toBe(0);
});
