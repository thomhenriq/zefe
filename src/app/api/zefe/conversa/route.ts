import { getUsuario } from '@/sessao';
import { emailLiberado } from '@/zefe/liberados';
import { carregarMensagens, ultimaConversa } from '@/zefe/responder';

/** Última conversa do usuário (para continuar ao abrir o painel). */
export async function GET() {
  const u = await getUsuario();
  if (!u) return Response.json({ erro: 'faça login' }, { status: 401 });
  if (!emailLiberado(u.email)) return Response.json({ erro: 'em breve' }, { status: 403 });
  const c = await ultimaConversa(u.id);
  return Response.json({ conversaId: c?.id ?? null, mensagens: c ? await carregarMensagens(c.id) : [] });
}
