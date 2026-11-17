import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getGrade } from '@/dados/grades';
import { erroPeriodo, gerarIcs } from '@/dominio/ics';
import { getUsuario } from '@/sessao';

const consulta = z.object({
  inicio: z.iso.date({ error: 'informe o primeiro dia de aula (AAAA-MM-DD)' }),
  fim: z.iso.date({ error: 'informe o último dia de aula (AAAA-MM-DD)' }),
});

const erro = (mensagem: string, status: number) => Response.json({ erro: mensagem }, { status });

export async function GET(request: NextRequest, { params }: { params: Promise<{ gradeId: string }> }) {
  const usuario = await getUsuario();
  if (!usuario) return erro('entre na sua conta para exportar a grade', 401);

  const q = consulta.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return erro(q.error.issues[0]!.message, 400);
  const { inicio, fim } = q.data;
  const motivo = erroPeriodo(inicio, fim);
  if (motivo) return erro(motivo, 400);

  const { gradeId } = await params;
  // id é serial (int4): fora dessa faixa o Postgres falharia com 500 em vez de 404.
  if (!/^[1-9]\d{0,9}$/.test(gradeId) || Number(gradeId) > 2147483647) return erro('grade não encontrada', 404);
  const grade = await getGrade(usuario.id, gradeId);
  if (!grade) return erro('grade não encontrada', 404);

  return new Response(gerarIcs(grade.itens, new Date(inicio), new Date(fim)), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="zefe-${grade.ano}-${grade.periodo}.ics"`,
      // Grade pessoal: nunca em cache compartilhado.
      'Cache-Control': 'private, no-store',
    },
  });
}
