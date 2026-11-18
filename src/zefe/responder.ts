import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { convertToModelMessages, isStepCount, readUIMessageStream, streamText, toUIMessageStream, type LanguageModel, type TextStreamPart, type ToolSet, type UIMessage, type UIMessageChunk } from 'ai';
import { z } from 'zod';
import { acao, conversa, curso, db, mensagem } from '@/db';
import { getPerfil } from '@/dados/aluno';
import { getGrade } from '@/dados/grades';
import { normalizarCodigo } from '@/dominio/codigo';
import { proximoSemestre } from '@/dominio/oferta';
import { criarFerramentas } from './ferramentas';
import { modelo as modeloBedrock } from './modelo';
import { AVISO_ACAO_FANTASMA, acaoFantasma } from './fantasma';
import { perguntaDeGrade } from './forcar';
import { criarRemovedor } from './pensamento';
import { montarPrompt } from './prompt';

export const FORA_DO_AR = 'O Zefe está fora do ar agora. Tente de novo daqui a pouco; o resto do site continua funcionando normalmente.';
export const MAX_PASSOS = 8; // passos de ferramenta por mensagem
export const MAX_HISTORICO = 20; // mensagens enviadas ao modelo
const TEMPERATURA = 0.2;

export const telaSchema = z.object({ rota: z.string().max(200).default('/'), gradeId: z.string().max(40).optional(), codigo: z.string().max(12).optional() });
export type Tela = z.infer<typeof telaSchema>;

export interface EntradaResposta {
  userId: string;
  /** Precisa existir em `conversa` e ser do usuário (as ferramentas gravam ações ligadas a ela). */
  conversaId: number;
  /** Histórico completo da conversa terminando na mensagem do usuário; só as últimas 20 vão ao modelo. */
  mensagens: UIMessage[];
  tela: Tela;
  /** Para testes e para o script de avaliação. Padrão: Bedrock. */
  modelo?: LanguageModel;
  agora?: Date;
  /** Grava a resposta do assistente em `mensagem` ao terminar. Padrão: true. */
  salvar?: boolean;
  /** Tokens gastos na resposta (para o script de avaliação). */
  onUso?: (u: { inputTokens?: number | undefined; outputTokens?: number | undefined }) => void;
}

const textoDoUsuario = (ms: UIMessage[]) => ms.findLast((m) => m.role === 'user')?.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ') ?? '';
const sanear = (s: string) => s.replace(/[^\w\-\/.]/g, '').slice(0, 80);

async function descreverTela(userId: string, tela: Tela): Promise<{ texto: string; gradeId: string | null }> {
  const rota = sanear(tela.rota) || '/';
  if (rota.startsWith('/planejador')) {
    const g = tela.gradeId ? await getGrade(userId, tela.gradeId).catch(() => null) : null; // só aceita grade do próprio aluno
    return { texto: g ? `Planejador, com a grade "${g.nome}" de ${g.periodo}S/${g.ano} aberta` : 'Planejador', gradeId: g?.id ?? null };
  }
  if (rota.startsWith('/arvore')) return { texto: 'Árvore de integralização (o que falta para se formar)', gradeId: null };
  if (rota.startsWith('/disciplina/')) {
    const c = normalizarCodigo(tela.codigo ?? rota.split('/')[2] ?? '').codigo;
    return { texto: `Página da disciplina ${c}`, gradeId: null };
  }
  return { texto: `Outra tela (${rota})`, gradeId: null };
}

const temTexto = (p: UIMessage['parts'][number]) => p.type !== 'text' || p.text.trim() !== '';

/** Últimas 20 mensagens, começando por uma do usuário, sem texto vazio e sem mensagem que ficou sem nada. */
export function historicoParaModelo(mensagens: UIMessage[]): UIMessage[] {
  const ultimas = mensagens
    .slice(-MAX_HISTORICO)
    .map((m) => ({ ...m, parts: m.parts.filter(temTexto) }))
    .filter((m) => m.parts.length > 0);
  // Pergunta sem resposta (a resposta falhou) seguida de outra pergunta: fica só a mais recente.
  const seguidas = ultimas.filter((m, k) => !(m.role === 'user' && ultimas[k + 1]?.role === 'user'));
  const i = seguidas.findIndex((m) => m.role === 'user');
  return i < 0 ? [] : seguidas.slice(i);
}

/** Tira <thinking> do texto que sai do modelo (exibido e salvo), mesmo partido entre pedaços. */
export function semPensamento<T extends ToolSet>() {
  const por = new Map<string, ReturnType<typeof criarRemovedor>>();
  let texto = '';
  const partes: { type: string; state: string; output: unknown }[] = [];
  return new TransformStream<TextStreamPart<T>, TextStreamPart<T>>({
    transform(p, ctl) {
      if (p.type === 'tool-result') partes.push({ type: `tool-${p.toolName}`, state: 'output-available', output: p.output });
      if (p.type === 'finish' && acaoFantasma(texto, partes)) {
        // O modelo disse que alterou algo sem ferramenta de alteração com sucesso: aviso fixo, visível e salvo.
        console.warn('[zefe] ação fantasma:', texto.slice(0, 200));
        ctl.enqueue({ type: 'text-start', id: 'fantasma' } as TextStreamPart<T>);
        ctl.enqueue({ type: 'text-delta', id: 'fantasma', text: AVISO_ACAO_FANTASMA } as TextStreamPart<T>);
        ctl.enqueue({ type: 'text-end', id: 'fantasma' } as TextStreamPart<T>);
      }
      if (p.type === 'text-start') por.set(p.id, criarRemovedor());
      if (p.type === 'text-delta') {
        const saida = (por.get(p.id) ?? por.set(p.id, criarRemovedor()).get(p.id)!).push(p.text);
        texto += saida;
        if (saida) ctl.enqueue({ ...p, text: saida });
        return;
      }
      if (p.type === 'text-end') {
        const resto = por.get(p.id)?.fim();
        por.delete(p.id);
        texto += resto ?? '';
        if (resto) ctl.enqueue({ type: 'text-delta', id: p.id, text: resto });
      }
      ctl.enqueue(p);
    },
  });
}

/**
 * O "harness": prompt versionado + ferramentas + laço de até 8 passos + temperatura baixa + <thinking> removido
 * + erro do modelo/Bedrock vira FORA_DO_AR no stream. Usada pela rota e pelo script de avaliação.
 */
export async function responder(e: EntradaResposta): Promise<ReadableStream<UIMessageChunk>> {
  const perfil = await getPerfil(e.userId);
  if (!perfil) throw new Error('perfil não encontrado');
  const [c] = perfil.curso ? await db.select({ nome: curso.nome }).from(curso).where(eq(curso.numero, perfil.curso)) : [];
  const agora = e.agora ?? new Date();
  const alvo = proximoSemestre(agora);
  const tela = await descreverTela(e.userId, e.tela);
  const tools = criarFerramentas({ userId: e.userId, conversaId: String(e.conversaId), gradeId: tela.gradeId, agora });
  const instructions = montarPrompt({
    nome: null, curso: c?.nome ?? `curso ${perfil.curso ?? '?'}`, catalogo: perfil.catalogo ?? 0, semestreAtual: perfil.semestre_atual ?? 0,
    semestreAlvo: `${alvo.periodo}S/${alvo.ano}`, tela: tela.texto, hoje: agora.toISOString().slice(0, 10),
  });

  const r = streamText({
    model: e.modelo ?? modeloBedrock(),
    instructions,
    messages: await convertToModelMessages(historicoParaModelo(e.mensagens), { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(MAX_PASSOS),
    temperature: TEMPERATURA,
    prepareStep: ({ stepNumber }) => (stepNumber === 0 && perguntaDeGrade(textoDoUsuario(e.mensagens)) ? { toolChoice: { type: 'tool' as const, toolName: 'ver_grade' as const } } : undefined),
    onFinish: ({ totalUsage }) => e.onUso?.(totalUsage),
    onError: ({ error }) => console.error('[zefe] erro do modelo:', error instanceof Error ? `${error.name}: ${error.message}` : error),
  });

  return toUIMessageStream({
    stream: r.stream.pipeThrough(semPensamento<typeof tools>()),
    tools,
    originalMessages: e.mensagens,
    // Erro de ferramenta volta ao modelo como resultado (dentro do laço, com o texto real); ao cliente e ao banco vai só texto genérico.
    onError: (erro) => (erro instanceof Error && /tool/i.test(erro.name) ? 'Uma consulta não deu certo.' : FORA_DO_AR),
    redactToolErrors: true,
    onEnd: async ({ responseMessage, outcome }) => {
      if (e.salvar === false || outcome.status === 'failed') return;
      const partes = responseMessage.parts.filter(temTexto);
      if (partes.length) await db.insert(mensagem).values({ conversa_id: e.conversaId, papel: 'assistant', partes });
    },
  });
}

/** Consome o stream e devolve a mensagem final do assistente (ou o erro). Para o script de avaliação. */
export async function responderCompleto(e: EntradaResposta): Promise<{ mensagem: UIMessage | null; erro: string | null }> {
  let msg: UIMessage | null = null;
  let erro: string | null = null;
  const stream = await responder(e);
  for await (const m of readUIMessageStream({ stream, onError: (x) => { erro = x instanceof Error ? x.message : String(x); } })) msg = m;
  return { mensagem: msg, erro };
}

// ---- conversas ----
export async function criarConversa(userId: string, titulo: string) {
  const [c] = await db.insert(conversa).values({ user_id: userId, titulo: titulo.slice(0, 60) || 'Conversa' }).returning();
  return c!;
}
export async function conversaDoUsuario(userId: string, id: number) {
  const [c] = await db.select().from(conversa).where(and(eq(conversa.id, id), eq(conversa.user_id, userId)));
  return c ?? null;
}
export async function salvarMensagem(conversaId: number, papel: 'user' | 'assistant', partes: UIMessage['parts']) {
  await db.insert(mensagem).values({ conversa_id: conversaId, papel, partes });
}
export async function carregarMensagens(conversaId: number): Promise<UIMessage[]> {
  const ms = await db.select().from(mensagem).where(eq(mensagem.conversa_id, conversaId)).orderBy(asc(mensagem.id));
  return ms.map((m) => ({ id: `m${m.id}`, role: m.papel as 'user' | 'assistant', parts: m.partes as UIMessage['parts'] }));
}
/** Ids das ações (com acaoId nos resultados de ferramenta salvos) que o usuário já desfez: o painel recarregado mostra como desfeitas. */
export async function acoesDesfeitas(userId: string, mensagens: UIMessage[]): Promise<number[]> {
  const ids = new Set<number>();
  for (const m of mensagens) for (const p of m.parts) {
    const id = (p as { output?: { acaoId?: unknown } }).output?.acaoId;
    if (typeof id === 'number') ids.add(id);
  }
  if (!ids.size) return [];
  const r = await db.select({ id: acao.id }).from(acao).where(and(eq(acao.user_id, userId), eq(acao.desfeita, true), inArray(acao.id, [...ids])));
  return r.map((x) => x.id);
}
export async function ultimaConversa(userId: string) {
  const [c] = await db.select().from(conversa).where(eq(conversa.user_id, userId)).orderBy(desc(conversa.id)).limit(1);
  return c ?? null;
}
