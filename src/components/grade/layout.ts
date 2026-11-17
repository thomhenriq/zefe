export const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

/** Para itens de um mesmo dia: coluna de cada um e nº de colunas do grupo de sobreposição (mesma ordem da entrada). */
export function lado(itens: { inicio: string; fim: string }[]): { col: number; cols: number }[] {
  const ordem = itens.map((_, i) => i).sort((a, b) => minutos(itens[a]!.inicio) - minutos(itens[b]!.inicio) || minutos(itens[a]!.fim) - minutos(itens[b]!.fim));
  const out: { col: number; cols: number }[] = new Array(itens.length);
  let grupo: number[] = [];
  let fimGrupo = -1;
  const fecha = () => {
    const cols = Math.max(0, ...grupo.map((i) => out[i]!.col + 1));
    for (const i of grupo) out[i]!.cols = cols;
    grupo = [];
  };
  const fimsCol: number[] = [];
  for (const i of ordem) {
    const ini = minutos(itens[i]!.inicio);
    if (ini >= fimGrupo) { fecha(); fimsCol.length = 0; }
    let c = fimsCol.findIndex((f) => f <= ini);
    if (c < 0) c = fimsCol.length;
    fimsCol[c] = minutos(itens[i]!.fim);
    out[i] = { col: c, cols: 1 };
    grupo.push(i);
    fimGrupo = Math.max(grupo.length === 1 ? 0 : fimGrupo, minutos(itens[i]!.fim));
  }
  fecha();
  return out;
}
