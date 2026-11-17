import { getUsuario } from '@/sessao';
import { tratarPost } from '@/zefe/rota';

export const maxDuration = 60;

export async function POST(req: Request) {
  return tratarPost(await getUsuario(), await req.json().catch(() => null));
}
