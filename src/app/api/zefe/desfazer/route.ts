import { z } from 'zod';
import { getUsuario } from '@/sessao';
import { ACAO_NAO_ENCONTRADA, desfazerAcao } from '@/zefe/desfazer';

const corpo = z.object({ acaoId: z.coerce.number().int().positive() });

export async function POST(req: Request) {
  const u = await getUsuario();
  if (!u) return Response.json({ ok: false, motivo: 'faça login' }, { status: 401 });
  const p = corpo.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ ok: false, motivo: 'acaoId inválido' }, { status: 400 });
  const r = await desfazerAcao(u.id, p.data.acaoId);
  return Response.json(r, { status: r.ok ? 200 : r.motivo === ACAO_NAO_ENCONTRADA ? 404 : 409 });
}
