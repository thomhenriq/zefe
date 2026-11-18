import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, grade, user } from '../src/db';
import { criarGrade } from '../src/dados/grades';
import { descreverTela } from '../src/zefe/responder';
import { criarFerramentas } from '../src/zefe/ferramentas';
import { montarPrompt, semestresAnteriores } from '../src/zefe/prompt';

const U = 'teste-tela-a';
const HOJE = new Date(2026, 10, 18); // 18/11/2026: o semestre atual é 2S/2026, o próximo 1S/2027
let g26 = '', g27 = '';

beforeAll(async () => {
  await db.delete(user).where(eq(user.id, U));
  await db.insert(user).values({ id: U, name: 'T', email: 'tela@zefe.local', emailVerified: true });
  g26 = await criarGrade(U, 2026, 2, 'Atual');
  g27 = await criarGrade(U, 2027, 1, 'Próxima');
});
afterAll(async () => { await db.delete(grade).where(eq(grade.user_id, U)); await db.delete(user).where(eq(user.id, U)); });

describe('contexto de tela do Zefe', () => {
  test('?grade= de 2S/2026: a grade e o semestre da tela valem, não o próximo semestre', async () => {
    const t = await descreverTela(U, { rota: '/planejador', gradeId: g26 }, HOJE);
    expect(t).toMatchObject({ gradeId: g26, semestre: { ano: 2026, periodo: 2 } });
    expect(t.texto).toContain('2S/2026');
  });
  test('só ?ano=2026&periodo=2 (sem grade): usa a principal desse semestre', async () => {
    expect(await descreverTela(U, { rota: '/planejador', ano: 2026, periodo: 2 }, HOJE)).toMatchObject({ gradeId: g26, semestre: { ano: 2026, periodo: 2 } });
  });
  test('grade de outro semestre que o da URL é ignorada (como a página)', async () => {
    expect(await descreverTela(U, { rota: '/planejador', gradeId: g27, ano: 2026, periodo: 2 }, HOJE)).toMatchObject({ gradeId: g26 });
  });
  test('planejador sem parâmetros: próximo semestre (1S/2027), como a página', async () => {
    expect(await descreverTela(U, { rota: '/planejador' }, HOJE)).toMatchObject({ gradeId: g27, semestre: { ano: 2027, periodo: 1 } });
  });
  test('semestre sem grade: diz isso e não inventa grade; fora do planejador não há semestre', async () => {
    const t = await descreverTela(U, { rota: '/planejador', ano: 2025, periodo: 1 }, HOJE);
    expect(t.gradeId).toBeNull(); expect(t.texto).toContain('ainda sem grade');
    expect((await descreverTela(U, { rota: '/arvore' }, HOJE)).semestre).toBeNull();
  });
  test('grade de outro usuário é ignorada', async () => {
    expect((await descreverTela('outro-usuario', { rota: '/planejador', gradeId: g26 }, HOJE)).gradeId).not.toBe(g26);
  });
  test('ferramentas: ctx.semestre (2S/2026) vence o próximo semestre', async () => {
    const f = criarFerramentas({ userId: 'outro-usuario', conversaId: 'x', gradeId: null, semestre: { ano: 2026, periodo: 2 }, agora: HOJE });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- só a forma de chamada do SDK
    const r = await (f.ver_grade.execute as any)({}, { toolCallId: 't', messages: [] }) as { erro: string };
    expect(r.erro).toContain('2S/2026');
  });
  test('semestres anteriores ao atual, em ordem (inclusive virada de ano)', () => {
    expect(semestresAnteriores('2S/2026', 4)).toEqual(['1S/2026', '2S/2025', '1S/2025', '2S/2024']);
    expect(semestresAnteriores('1S/2027', 2)).toEqual(['2S/2026', '1S/2026']);
  });
  test('prompt: semestre da tela e semestre atual aparecem, com a regra do "passado"', () => {
    const p = montarPrompt({ nome: null, curso: 'SI', catalogo: 2026, semestreAtual: 3, semestreAlvo: '2S/2026', semestreCorrente: '2S/2026', naTela: true, tela: 'Planejador', hoje: '2026-11-18' });
    expect(p).toContain('Semestre da grade que está aberta na tela: 2S/2026');
    expect(p).toContain('2S/2026 nunca é "passado"');
  });
});
