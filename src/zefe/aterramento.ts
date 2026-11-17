// Critério (b) da avaliação: tudo que parece horário, sala ou código de disciplina no texto precisa estar nas fontes (resultados de ferramenta + pergunta).
const HORA = /\b(\d{1,2}):(\d{2})\b|\b(\d{1,2})h(\d{2})?\b/g; // 19:00, 19h, 14h30
const CODIGO = /\b[A-Z]{1,3}(?:\d{2,3}|[ -]\d{3})[A-Z]?(?![\w])/g; // PA06, SI702, "SI 702", "SI-702", SI702A

const hora = (m: RegExpMatchArray) => `${(m[1] ?? m[3])!.padStart(2, '0')}:${m[2] ?? m[4] ?? '00'}`;
const codigo = (s: string) => s.replace(/[ -]/g, '').replace(/^([A-Z]{1,3}\d{3})[A-Z]$/, '$1');

export const extrair = (texto: string) => ({
  horas: [...texto.matchAll(HORA)].map(hora),
  codigos: (texto.toUpperCase().match(CODIGO) ?? []).map(codigo),
});

/** Itens do texto que não aparecem em nenhuma fonte. Texto vazio conta como não aterrado. */
export function orfaos(textos: string[], fontes: string[]): string[] {
  if (textos.some((t) => !t.trim())) return ['(texto vazio)'];
  const f = extrair(fontes.join('\n'));
  const horas = new Set(f.horas); const codigos = new Set(f.codigos);
  const t = extrair(textos.join('\n'));
  return [...new Set([...t.horas.filter((h) => !horas.has(h)), ...t.codigos.filter((c) => !codigos.has(c))])];
}
