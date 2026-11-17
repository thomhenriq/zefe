export type Sem = { ano: number; periodo: 1 | 2 };

export const rotuloSemestre = (ano: number, periodo: number) => `${periodo}S/${ano}`;

/** "2026-1" -> {ano, periodo}; qualquer outra coisa -> null. */
export function parseSemestre(s: string | undefined): Sem | null {
  const m = /^(\d{4})-([12])$/.exec(s ?? "");
  return m ? { ano: Number(m[1]), periodo: Number(m[2]) as 1 | 2 } : null;
}

/** De `de` para trás até `ate` (ano), mais recente primeiro. */
export function semestresDesde(de: Sem, ate: number): Sem[] {
  const out: Sem[] = [];
  for (let { ano, periodo } = de; ano >= ate; periodo === 1 ? (ano--, (periodo = 2)) : (periodo = 1)) out.push({ ano, periodo });
  return out;
}
