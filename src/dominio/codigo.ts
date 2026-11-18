/** Aceita `si702`, `SI702A`, ` si 702 `, `SI-702`, `F128`. Código = 1 ou 2 letras + 3 dígitos; letra depois dos dígitos é a turma. */
export function normalizarCodigo(s: string): { codigo: string; turma: string | null } {
  const limpo = s.replace(/[\s\-_.]+/g, '').toUpperCase();
  const m = limpo.match(/^([A-Z]{1,2}\d{3})([A-Z])?$/);
  if (!m) return { codigo: limpo, turma: null };
  return { codigo: m[1]!, turma: m[2] ?? null };
}
