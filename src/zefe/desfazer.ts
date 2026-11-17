import { and, eq } from 'drizzle-orm';
import { acao, bloqueio as tBloqueio, db } from '@/db';
import { marcarHistorico, type Estado } from '@/dados/aluno';
import { alterarGrade, criarBloqueio, excluirBloqueio } from '@/dados/grades';

/**
 * Formatos de `acao.desfazer` (jsonb), um por `acao.tipo`:
 *  alterar_grade:    { gradeId, remover: string[] (códigos que não estavam), adicionar: {codigo,turma}[] (itens/turmas que estavam e foram removidos ou trocados), gradeCriada?: true }
 *  marcar_historico: { codigo, anterior: 'cursada'|'cursando'|null }
 *  criar_bloqueio:   { bloqueioId }
 *  remover_bloqueio: { bloqueio: { nome, dia, inicio, fim } }   (recriado com id novo)
 */
export type Desfazer =
  | { tipo: 'alterar_grade'; gradeId: string; remover: string[]; adicionar: { codigo: string; turma: string }[]; gradeCriada?: true }
  | { tipo: 'marcar_historico'; codigo: string; anterior: Estado | null }
  | { tipo: 'criar_bloqueio'; bloqueioId: string }
  | { tipo: 'remover_bloqueio'; bloqueio: { nome: string; dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'; inicio: string; fim: string } };

export const ACAO_NAO_ENCONTRADA = 'ação não encontrada';

async function aplicar(userId: string, d: Desfazer): Promise<void> {
  switch (d.tipo) {
    case 'alterar_grade': await alterarGrade(userId, d.gradeId, { remover: d.remover, adicionar: d.adicionar }); return;
    case 'marcar_historico': await marcarHistorico(userId, d.codigo, d.anterior); return;
    case 'criar_bloqueio': await excluirBloqueio(userId, d.bloqueioId); return;
    case 'remover_bloqueio': await criarBloqueio(userId, d.bloqueio); return;
  }
}

/**
 * Aplica o inverso guardado e marca `desfeita`. Não há transação única porque as funções de dados abrem a própria:
 * a ação é "reservada" antes (UPDATE condicional, atômico: dois cliques simultâneos não desfazem duas vezes) e a
 * reserva é devolvida se o inverso falhar. shortcut: queda do processo entre a reserva e o inverso deixa a ação marcada sem ter sido desfeita, passar a aceitar uma tx nas funções de dados se isso importar.
 */
export async function desfazerAcao(userId: string, acaoId: number | string): Promise<{ ok: boolean; motivo?: string }> {
  const id = Number(acaoId);
  if (!Number.isInteger(id)) return { ok: false, motivo: ACAO_NAO_ENCONTRADA };
  const [a] = await db.select().from(acao).where(and(eq(acao.id, id), eq(acao.user_id, userId)));
  if (!a) return { ok: false, motivo: ACAO_NAO_ENCONTRADA };
  const reservada = await db.update(acao).set({ desfeita: true }).where(and(eq(acao.id, id), eq(acao.desfeita, false))).returning({ id: acao.id });
  if (!reservada.length) return { ok: false, motivo: 'essa ação já foi desfeita' };
  try {
    if (!a.desfazer) throw new Error('essa ação não tem como ser desfeita');
    await aplicar(userId, a.desfazer as Desfazer);
    return { ok: true };
  } catch (e) {
    await db.update(acao).set({ desfeita: false }).where(eq(acao.id, id));
    return { ok: false, motivo: e instanceof Error ? e.message : 'não consegui desfazer' };
  }
}

export async function lerBloqueio(userId: string, id: string) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const [b] = await db.select().from(tBloqueio).where(and(eq(tBloqueio.id, n), eq(tBloqueio.user_id, userId)));
  return b ?? null;
}
