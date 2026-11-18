import { z } from 'zod';
import { buscar } from '@/dados/busca';

const Consulta = z.object({
  q: z.string().trim().max(60).default(''),
  n: z.coerce.number().int().min(1).max(20).default(20),
});

/** Busca ao vivo (pública, como a página /busca). `q` até 60 caracteres, `n` resultados por grupo (1 a 20). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const p = Consulta.safeParse({ q: searchParams.get('q') ?? undefined, n: searchParams.get('n') ?? undefined });
  if (!p.success) return Response.json({ erro: 'Consulta inválida' }, { status: 400 });
  return Response.json(await buscar(p.data.q, p.data.n), { headers: { 'Cache-Control': 'no-store' } });
}
