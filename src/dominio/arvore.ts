/** Colunas 1..N (sem buracos) pelo semestre da proposta; sem semestre vai para a coluna final (semestre null). */
export function agruparPorSemestre<T extends { semestreSugerido: number | null }>(ds: T[]): { semestre: number | null; itens: T[] }[] {
  const max = Math.max(0, ...ds.map((d) => d.semestreSugerido ?? 0));
  const cols: { semestre: number | null; itens: T[] }[] = Array.from({ length: max }, (_, i) => ({ semestre: i + 1, itens: ds.filter((d) => d.semestreSugerido === i + 1) }));
  const fora = ds.filter((d) => d.semestreSugerido === null);
  return fora.length ? [...cols, { semestre: null, itens: fora }] : cols;
}

/** Porcentagens de uma barra: feito e em andamento separados, andamento limitado ao que resta. */
export function barra(feitos: number, emAndamento: number, total: number): { feitoPct: number; andamentoPct: number } {
  if (total <= 0) return { feitoPct: 0, andamentoPct: 0 };
  const feito = Math.min(100, Math.round((feitos / total) * 100));
  return { feitoPct: feito, andamentoPct: Math.max(0, Math.min(100 - feito, Math.round((emAndamento / total) * 100))) };
}

/** Anos (crescentes) em que a disciplina apareceu no 1S e no 2S, nos anos carregados. Histórico observado, não promessa. */
export function observadoPorPeriodo(ofs: { ano: number; periodo: number }[]): { 1: number[]; 2: number[] } {
  const anos = (p: number) => [...new Set(ofs.filter((o) => o.periodo === p).map((o) => o.ano))].sort((a, b) => a - b);
  return { 1: anos(1), 2: anos(2) };
}
