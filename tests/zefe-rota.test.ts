import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { asc, eq } from 'drizzle-orm';
import { MockLanguageModelV4 } from 'ai/test';
import { conversa, db, historico, mensagem, perfil } from '../src/db';
import { FORA_DO_AR, MAX_HISTORICO, MAX_PASSOS, historicoParaModelo } from '../src/zefe/responder';
import { tratarPost } from '../src/zefe/rota';

const U = { id: 'teste-t15-a', email: 'liberado-t15@zefe.local' };
const LISTA = ' Liberado-T15@zefe.local , outro@x.y';
const corpo = (texto: string, conversaId?: number) => ({ conversaId, mensagens: [{ role: 'user', parts: [{ type: 'text', text: texto }] }], tela: { rota: '/planejador' } });

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };
const fluxo = (partes: object[]) => ({ stream: new ReadableStream({ start(c) { for (const p of [{ type: 'stream-start', warnings: [] }, ...partes]) c.enqueue(p); c.close(); } }) }) as never;
const texto = (...deltas: string[]) => fluxo([{ type: 'text-start', id: 't' }, ...deltas.map((delta) => ({ type: 'text-delta', id: 't', delta })), { type: 'text-end', id: 't' }, { type: 'finish', finishReason: { unified: 'stop', raw: 'stop' }, usage }]);
let n = 0;
const chamarFerramenta = () => fluxo([{ type: 'tool-call', toolCallId: `c${n++}`, toolName: 'buscar_disciplinas', input: '{"texto":"calculo"}' }, { type: 'finish', finishReason: { unified: 'tool-calls', raw: 'tool_use' }, usage }]);

const limpar = async () => { await db.delete(historico).where(eq(historico.user_id, U.id)); await db.delete(conversa).where(eq(conversa.user_id, U.id)); await db.delete(perfil).where(eq(perfil.user_id, U.id)); };
const msgs = async () => (await db.select().from(mensagem).innerJoin(conversa, eq(mensagem.conversa_id, conversa.id)).where(eq(conversa.user_id, U.id)).orderBy(asc(mensagem.id))).map((r) => r.mensagem); // sem ORDER BY o .at(-1) dos testes é arbitrário

beforeAll(async () => { await limpar(); await db.insert(perfil).values({ user_id: U.id, curso: 94, catalogo: 2026, modalidade: null, ingresso: 2024, semestre_atual: 5 }); });
afterAll(limpar);

describe('POST /api/zefe (tratarPost)', () => {
  test('sem login: 401', async () => {
    expect((await tratarPost(null, corpo('oi'), { liberados: LISTA })).status).toBe(401);
  });

  test('e-mail fora de ZEFE_LIBERADOS: 403 e nada é gravado', async () => {
    const r = await tratarPost({ id: U.id, email: 'intruso@zefe.local' }, corpo('oi'), { liberados: LISTA });
    expect(r.status).toBe(403);
    expect(await db.select().from(conversa).where(eq(conversa.user_id, U.id))).toHaveLength(0);
    expect((await tratarPost(U, corpo('oi'), { liberados: undefined })).status).toBe(403); // lista vazia: ninguém
  });

  test('sem credencial AWS: mensagem "fora do ar" no stream, sem derrubar nada', async () => {
    const antes = { ...process.env };
    Object.assign(process.env, { AWS_PROFILE: 'zefe-perfil-inexistente', AWS_CONFIG_FILE: '/dev/null', AWS_SHARED_CREDENTIALS_FILE: '/dev/null', AWS_EC2_METADATA_DISABLED: 'true' });
    for (const k of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_BEARER_TOKEN_BEDROCK', 'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI', 'AWS_WEB_IDENTITY_TOKEN_FILE']) delete process.env[k];
    try {
      const r = await tratarPost(U, corpo('oi'), { liberados: LISTA });
      expect(r.status).toBe(200);
      expect(await r.text()).toContain(FORA_DO_AR);
    } finally { process.env = antes; }
  });

  test('erro do modelo (throttling etc.): mesma mensagem, resposta não é salva', async () => {
    const modelo = new MockLanguageModelV4({ doStream: async () => { throw new Error('ThrottlingException: Too many requests'); } });
    const r = await tratarPost(U, corpo('de novo'), { liberados: LISTA, modelo });
    expect(await r.text()).toContain(FORA_DO_AR);
    expect((await msgs()).filter((m) => m.papel === 'assistant')).toHaveLength(0);
  });

  test('<thinking> não aparece no stream nem no banco, mesmo partido em pedaços', async () => {
    const modelo = new MockLanguageModelV4({ doStream: async () => texto('<thi', 'nking>plano secreto</thin', 'king>\n\nOi, ', 'tudo bem?') });
    const r = await tratarPost(U, corpo('oi'), { liberados: LISTA, modelo });
    const corpoSse = await r.text();
    expect(corpoSse).not.toContain('thinking');
    expect(corpoSse).not.toContain('plano secreto');
    expect(corpoSse).toContain('Oi, ');
    const ass = (await msgs()).filter((m) => m.papel === 'assistant').at(-1)!;
    expect(JSON.stringify(ass.partes)).not.toContain('thinking');
    expect((ass.partes as { type: string; text?: string }[]).filter((x) => x.type === 'text').map((x) => x.text)).toEqual(['Oi, tudo bem?']);
  });

  test('laço de ferramentas para em 8 passos; só 20 mensagens vão ao modelo; conversa continua', async () => {
    const modelo = new MockLanguageModelV4({ doStream: async () => chamarFerramenta() });
    const [c] = await db.select().from(conversa).where(eq(conversa.user_id, U.id));
    for (let i = 0; i < 12; i++) await db.insert(mensagem).values({ conversa_id: c!.id, papel: i % 2 ? 'assistant' : 'user', partes: [{ type: 'text', text: `m${i}` }] });
    const r = await tratarPost(U, corpo('procure cálculo', c!.id), { liberados: LISTA, modelo });
    await r.text();
    expect(modelo.doStreamCalls).toHaveLength(MAX_PASSOS);
    const prompt = modelo.doStreamCalls[0]!.prompt;
    expect(prompt[0]!.role).toBe('system');
    expect(prompt.length - 1).toBeLessThanOrEqual(MAX_HISTORICO);
    expect(r.headers.get('x-zefe-conversa')).toBe(String(c!.id));
    const salvos = (await msgs()).filter((m) => m.papel === 'assistant').at(-1)!;
    expect(JSON.stringify(salvos.partes)).toContain('buscar_disciplinas'); // chamadas e resultados de ferramenta ficam salvos
  });

  test('modelo diz que adicionou sem chamar ferramenta: aviso no stream e no banco', async () => {
    const modelo = new MockLanguageModelV4({ doStream: async () => texto('Adicionei SI702 na sua grade.') });
    const r = await tratarPost(U, corpo('adiciona SI702'), { liberados: LISTA, modelo });
    expect(await r.text()).toContain('não fiz essa alteração');
    const ass = (await msgs()).filter((m) => m.papel === 'assistant').at(-1)!;
    expect(JSON.stringify(ass.partes)).toContain('não fiz essa alteração');
  });

  test('ferramenta de alteração com sucesso no passo 1 e "Adicionei" no passo 2: sem aviso', async () => {
    let passo = 0;
    const modelo = new MockLanguageModelV4({ doStream: async () => (passo++ === 0
      ? fluxo([{ type: 'tool-call', toolCallId: 'm1', toolName: 'marcar_historico', input: '{"codigo":"SI100","estado":"cursada"}' }, { type: 'finish', finishReason: { unified: 'tool-calls', raw: 'tool_use' }, usage }])
      : texto('Marquei SI100 como cursada.')) });
    const r = await tratarPost(U, corpo('marca SI100 como cursada'), { liberados: LISTA, modelo });
    const corpoSse = await r.text();
    expect(corpoSse).toContain('"acaoId"');
    expect(corpoSse).not.toContain('não fiz essa alteração');
  });

  test('conversa de outro usuário: 404 exato e nada é gravado na conversa alheia', async () => {
    const O = { id: 'teste-t15-b', email: 'outro@x.y' };
    await db.delete(perfil).where(eq(perfil.user_id, O.id));
    await db.insert(perfil).values({ user_id: O.id, curso: 94, catalogo: 2026, modalidade: null, ingresso: 2024, semestre_atual: 5 });
    try {
      const [c] = await db.select().from(conversa).where(eq(conversa.user_id, U.id));
      const antes = (await msgs()).length;
      const r = await tratarPost(O, corpo('oi', c!.id), { liberados: LISTA });
      expect(r.status).toBe(404);
      expect((await msgs()).length).toBe(antes);
    } finally { await db.delete(perfil).where(eq(perfil.user_id, O.id)); }
  });

  test('histórico: pergunta sem resposta seguida de outra não gera dois turnos de usuário seguidos', () => {
    const m = (id: string, role: 'user' | 'assistant', text: string) => ({ id, role, parts: [{ type: 'text' as const, text }] });
    const h = historicoParaModelo([m('1', 'user', 'a'), m('2', 'user', 'b'), m('3', 'assistant', 'r'), m('4', 'user', 'c')]);
    expect(h.map((x) => x.id)).toEqual(['2', '3', '4']);
  });
});
