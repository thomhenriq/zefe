import { createUIMessageStreamResponse, type LanguageModel, type UIMessage } from 'ai';
import { z } from 'zod';
import { getPerfil } from '@/dados/aluno';
import { emailLiberado } from './liberados';
import { FORA_DO_AR, carregarMensagens, conversaDoUsuario, criarConversa, responder, salvarMensagem, telaSchema } from './responder';

const corpoSchema = z.object({
  conversaId: z.coerce.number().int().positive().optional(),
  // O cliente manda só a mensagem nova; o histórico vem do banco (o cliente não pode forjar resultado de ferramenta).
  mensagens: z.array(z.object({ role: z.string(), parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) }).loose()).min(1),
  tela: telaSchema.default({ rota: '/' }),
});

export const CABECALHO_CONVERSA = 'x-zefe-conversa';
const json = (corpo: object, status: number) => Response.json(corpo, { status });

/** Lógica da rota POST /api/zefe, separada para teste (injeta usuário, modelo e lista de liberados). */
export async function tratarPost(usuario: { id: string; email: string } | null, corpo: unknown, opcoes: { modelo?: LanguageModel; liberados?: string | undefined } = {}): Promise<Response> {
  if (!usuario) return json({ erro: 'faça login para falar com o Zefe' }, 401);
  if (!emailLiberado(usuario.email, 'liberados' in opcoes ? opcoes.liberados : process.env.ZEFE_LIBERADOS)) return json({ erro: 'O Zefe ainda não está liberado para a sua conta (em breve).' }, 403);
  const p = corpoSchema.safeParse(corpo);
  const nova = p.success ? [...p.data.mensagens].reverse().find((m) => m.role === 'user') : undefined;
  const texto = nova?.parts.map((x) => (x.type === 'text' ? (x.text ?? '') : '')).join('').trim();
  if (!p.success || !texto || texto.length > 2000) return json({ erro: 'mensagem inválida' }, 400);
  if (!(await getPerfil(usuario.id))) return json({ erro: 'termine o cadastro antes de falar com o Zefe' }, 409);

  try {
    let conversaId = p.data.conversaId;
    if (conversaId !== undefined) {
      if (!(await conversaDoUsuario(usuario.id, conversaId))) return json({ erro: 'conversa não encontrada' }, 404);
    } else conversaId = (await criarConversa(usuario.id, texto)).id;

    const historico = await carregarMensagens(conversaId);
    const msg: UIMessage = { id: `u${Date.now()}`, role: 'user', parts: [{ type: 'text', text: texto }] };
    await salvarMensagem(conversaId, 'user', msg.parts);
    const stream = await responder({ userId: usuario.id, conversaId, mensagens: [...historico, msg], tela: p.data.tela, ...(opcoes.modelo ? { modelo: opcoes.modelo } : {}) });
    return createUIMessageStreamResponse({ stream, headers: { [CABECALHO_CONVERSA]: String(conversaId) } });
  } catch (e) {
    console.error('[zefe] falha antes de responder:', e);
    return json({ erro: FORA_DO_AR }, 503);
  }
}
