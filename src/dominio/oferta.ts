import type { Disciplina, Turma } from '@/dac/tipos';
import { semestreDe } from '@/dac/tipos';

export type Confianca = 'provavel' | 'incerto' | 'sem_historico';
export type Evidencia = { ano: number; periodo: 1 | 2; turmas: Turma[]; url: string };

export type Oferta =
  | { encontrada: true; tipo: 'oficial'; disciplina: Disciplina; indiceVerificadoEm: string | null }
  | {
      encontrada: true;
      tipo: 'previsao';
      confianca: Exclude<Confianca, 'sem_historico'>;
      base: Disciplina;
      evidencias: Evidencia[];
      indiceVerificadoEm: string | null;
    }
  | { encontrada: false; tipo: 'oficial' | 'previsao'; motivo: string; indiceVerificadoEm: string | null };

/** Semestre seguinte ao que está em curso em `agora`. */
export function proximoSemestre(agora: Date = new Date()): { ano: number; periodo: 1 | 2 } {
  const { ano, periodo } = semestreDe(agora);
  return periodo === 1 ? { ano, periodo: 2 } : { ano: ano + 1, periodo: 1 };
}

/**
 * Regra do gedeé: olha os 3 anos anteriores (mesma paridade; o chamador passa só o mesmo período).
 * `provavel` se apareceu no ano imediatamente anterior e em pelo menos 2 dos 3.
 * Evidências: só as entradas dentro da janela, da mais recente para a mais antiga.
 */
export function preverOferta<T extends { ano: number; turmas: Turma[]; url: string }>(
  historico: T[],
  ano: number,
): { confianca: Confianca; evidencias: T[] } {
  const evidencias = historico.filter((h) => h.ano >= ano - 3 && h.ano < ano).sort((a, b) => b.ano - a.ano);
  if (!evidencias.length) return { confianca: 'sem_historico', evidencias };
  const noAnoAnterior = evidencias[0]!.ano === ano - 1;
  return { confianca: noAnoAnterior && evidencias.length >= 2 ? 'provavel' : 'incerto', evidencias };
}
