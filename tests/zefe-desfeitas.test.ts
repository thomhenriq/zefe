import { afterAll, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { acao, db } from '../src/db';
import { acoesDesfeitas } from '../src/zefe/responder';

const U = 'teste-desfeitas';
afterAll(async () => { await db.delete(acao).where(eq(acao.user_id, U)); });

test('histórico salvo: só as ações desfeitas do próprio usuário voltam marcadas', async () => {
  const [a, b] = await db.insert(acao).values([{ user_id: U, tipo: 't', descricao: 'a', desfeita: true }, { user_id: U, tipo: 't', descricao: 'b' }]).returning({ id: acao.id });
  const m = (id: number) => ({ id: `m${id}`, role: 'assistant' as const, parts: [{ type: 'tool-alterar_grade', state: 'output-available', output: { acaoId: id, descricao: 'x' } }] }) as never;
  expect(await acoesDesfeitas(U, [m(a.id), m(b.id)])).toEqual([a.id]);
  expect(await acoesDesfeitas('outro', [m(a.id)])).toEqual([]);
  expect(await acoesDesfeitas(U, [])).toEqual([]);
});
