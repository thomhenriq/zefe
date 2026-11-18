/**
 * Roteamento ortogonal das linhas de pré-requisito da árvore (puro, sem DOM).
 *
 * Entrada: retângulos dos cartões (coluna, linha, x, y, w, h) e arestas. Saída: polilinha por aresta.
 * Regras:
 *  - nada atravessa cartão: verticais correm nas calhas (espaço entre colunas), horizontais longas nos
 *    canais (espaço entre linhas); a aresta sai pela direita do pré-requisito e entra pela esquerda do alvo.
 *  - aresta que pula colunas sobe/desce na calha da origem até o canal junto da linha do alvo, corre pelo
 *    canal e desce na calha à esquerda do alvo.
 *  - cada tronco (vertical) tem sua faixa dentro da calha. Arestas com a mesma origem dividem o tronco da
 *    origem; arestas com o mesmo alvo dividem o tronco do alvo (feixe, depois ramifica). Troncos de
 *    origens/alvos diferentes cujos trechos se sobrepõem nunca dividem faixa.
 *  - heurística de faixas (menos cruzamentos): troncos mais curtos primeiro; os de origem pegam a faixa
 *    livre mais próxima do cartão de origem (esquerda), os de alvo a mais próxima do cartão do alvo
 *    (direita). Trechos aninhados ficam, assim, perto do cartão a que se ligam e não cruzam os externos.
 *  - nos canais, arestas do mesmo alvo dividem uma faixa (feixe) e as faixas vêm de coloração de intervalos
 *    (primeira livre, por início do trecho).
 *  - portas: saída a 38% da altura do cartão, entrada a 62%, para a linha que entra não coincidir com a
 *    que sai quando dois cartões estão na mesma linha.
 */
export interface Retangulo { id: string; col: number; row: number; x: number; y: number; w: number; h: number }
export interface ArestaEntrada { id: string; de: string; para: string }
export interface Ponto { x: number; y: number }
export interface Rota { id: string; de: string; para: string; pontos: Ponto[] }
export interface OpcoesRota {
  /** Largura (px) das calhas externas (antes da 1ª e depois da última coluna). */
  margem?: number;
  /** Distância máxima entre faixas de uma calha / de um canal. */
  passoCalha?: number;
  passoCanal?: number;
  /** Espaço reservado junto ao cartão do alvo para a ponta da seta. */
  folgaSeta?: number;
  saida?: number;
  entrada?: number;
}

type Tronco = { chave: string; tipo: "s" | "t"; lo: number; hi: number; pos: number; faixa: number };

const sobrepoe = (a: { lo: number; hi: number }, b: { lo: number; hi: number }) => a.lo <= b.hi && b.lo <= a.hi;

export function rotear(cartoes: Retangulo[], arestas: ArestaEntrada[], opc: OpcoesRota = {}): Rota[] {
  const { margem = 12, passoCalha = 5, passoCanal = 4, folgaSeta = 9, saida = 0.38, entrada = 0.62 } = opc;
  const por = new Map(cartoes.map((c) => [c.id, c]));
  const nCol = Math.max(0, ...cartoes.map((c) => c.col + 1));
  const nLin = Math.max(0, ...cartoes.map((c) => c.row + 1));
  const esq = Array<number>(nCol).fill(Infinity), dir = Array<number>(nCol).fill(-Infinity);
  const topo = Array<number>(nLin).fill(Infinity), base = Array<number>(nLin).fill(-Infinity);
  for (const c of cartoes) {
    esq[c.col] = Math.min(esq[c.col]!, c.x); dir[c.col] = Math.max(dir[c.col]!, c.x + c.w);
    topo[c.row] = Math.min(topo[c.row]!, c.y); base[c.row] = Math.max(base[c.row]!, c.y + c.h);
  }
  // calha g = entre a coluna g e a g+1 (g = -1 e nCol-1: margens externas)
  const calha = (g: number): [number, number] => (g < 0 ? [esq[0]! - margem, esq[0]!] : g >= nCol - 1 ? [dir[nCol - 1]!, dir[nCol - 1]! + margem] : [dir[g]!, esq[g + 1]!]);
  const folgaLinha = nLin > 1 ? topo[1]! - base[0]! : 16;
  // canal k = acima da linha k (k = nLin: abaixo da última)
  const canal = (k: number): [number, number] => (k >= nLin ? [base[nLin - 1]!, base[nLin - 1]! + folgaLinha] : [base[k - 1]!, topo[k]!]);

  type Plano = { a: Retangulo; b: Retangulo; id: string; de: string; para: string; gs: number; gt: number; yo: number; yi: number; k: number; yc: number };
  const planos: Plano[] = [];
  for (const e of arestas) {
    const a = por.get(e.de), b = por.get(e.para);
    if (!a || !b || a === b) continue;
    const gs = a.col, gt = b.col - 1;
    const k = gs === gt ? -1 : a.row < b.row ? b.row : b.row + 1;
    const [c0, c1] = k < 0 ? [0, 0] : canal(k);
    planos.push({ a, b, id: e.id, de: e.de, para: e.para, gs, gt, yo: a.y + a.h * saida, yi: b.y + b.h * entrada, k, yc: (c0 + c1) / 2 });
  }

  // troncos por calha; o extremo no canal pode deslizar até meia altura do canal, então o trecho é alargado ali
  const troncos = new Map<number, Map<string, Tronco>>();
  const juntar = (g: number, chave: string, tipo: "s" | "t", lo: number, hi: number) => {
    const m = troncos.get(g) ?? troncos.set(g, new Map()).get(g)!;
    const t = m.get(chave) ?? { chave, tipo, lo: Infinity, hi: -Infinity, pos: -1, faixa: 0 };
    m.set(chave, t);
    t.lo = Math.min(t.lo, lo - 3); t.hi = Math.max(t.hi, hi + 3);
  };
  const ate = (yFixo: number, yc: number, meio: number): [number, number] => (yc >= yFixo ? [yFixo, yc + meio] : [yc - meio, yFixo]);
  for (const p of planos) {
    if (p.k < 0) juntar(p.gs, `s:${p.de}`, "s", Math.min(p.yo, p.yi), Math.max(p.yo, p.yi));
    else {
      const meio = (canal(p.k)[1] - canal(p.k)[0]) / 2;
      juntar(p.gs, `s:${p.de}`, "s", ...ate(p.yo, p.yc, meio));
      juntar(p.gt, `t:${p.para}`, "t", ...ate(p.yi, p.yc, meio));
    }
  }

  // faixas: curtos primeiro; origem da esquerda para a direita, alvo da direita para a esquerda
  const xFaixa = new Map<string, number>(); // `${g}|${chave}`
  for (const [g, m] of troncos) {
    const lista = [...m.values()].sort((a, b) => a.hi - a.lo - (b.hi - b.lo) || a.lo - b.lo || a.chave.localeCompare(b.chave));
    const feitos: Tronco[] = [];
    for (const t of lista) {
      const livre = (p: number) => !feitos.some((o) => o.pos === p && sobrepoe(o, t));
      let p = t.tipo === "s" ? 0 : lista.length - 1;
      while (!livre(p)) p += t.tipo === "s" ? 1 : -1;
      t.pos = p; feitos.push(t);
    }
    const posicoes = [...new Set(lista.map((t) => t.pos))].sort((a, b) => a - b);
    const [g0, g1] = calha(g);
    const ini = g0 + 3, fim = Math.max(ini + 2, g1 - folgaSeta);
    const n = posicoes.length;
    const passo = n > 1 ? Math.min(passoCalha, (fim - ini) / (n - 1)) : 0;
    const x0 = n > 1 ? (ini + fim) / 2 - (passo * (n - 1)) / 2 : (ini + fim) / 2;
    for (const t of lista) { t.faixa = posicoes.indexOf(t.pos); xFaixa.set(`${g}|${t.chave}`, x0 + t.faixa * passo); }
  }

  // faixas nos canais (y) por coloração de intervalos
  const yCanal = new Map<string, number>(); // id da aresta → y
  const porCanal = new Map<number, Plano[]>();
  for (const p of planos) if (p.k >= 0) (porCanal.get(p.k) ?? porCanal.set(p.k, []).get(p.k)!).push(p);
  for (const [k, lista] of porCanal) {
    // arestas com o mesmo alvo no mesmo canal viram um feixe: uma só faixa (cobrindo a união dos trechos)
    const grupos = new Map<string, { lo: number; hi: number; ids: string[]; linha: number }>();
    for (const p of lista) {
      const a = xFaixa.get(`${p.gs}|s:${p.de}`)!, b = xFaixa.get(`${p.gt}|t:${p.para}`)!;
      const g = grupos.get(p.para) ?? grupos.set(p.para, { lo: Infinity, hi: -Infinity, ids: [], linha: p.b.row }).get(p.para)!;
      g.lo = Math.min(g.lo, a, b) - 2; g.hi = Math.max(g.hi, a, b) + 2; g.ids.push(p.id);
    }
    const ordem = [...grupos.entries()].sort(([ka, x], [kb, y]) => x.lo - y.lo || x.linha - y.linha || ka.localeCompare(kb));
    const faixas: { lo: number; hi: number }[][] = [];
    const idx = new Map<string, number>();
    for (const [, g] of ordem) {
      let i = faixas.findIndex((f) => !f.some((o) => sobrepoe(o, g)));
      if (i < 0) { faixas.push([]); i = faixas.length - 1; }
      faixas[i]!.push(g);
      for (const id of g.ids) idx.set(id, i);
    }
    const [c0, c1] = canal(k);
    const n = faixas.length, passo = n > 1 ? Math.min(passoCanal, (c1 - c0 - 4) / (n - 1)) : 0;
    for (const p of lista) yCanal.set(p.id, (c0 + c1) / 2 + (idx.get(p.id)! - (n - 1) / 2) * passo);
  }

  return planos.map((p) => {
    const xo = p.a.x + p.a.w, xi = p.b.x;
    const xs = xFaixa.get(`${p.gs}|s:${p.de}`)!;
    const pts: Ponto[] = p.k < 0
      ? [{ x: xo, y: p.yo }, { x: xs, y: p.yo }, { x: xs, y: p.yi }, { x: xi, y: p.yi }]
      : (() => {
        const xe = xFaixa.get(`${p.gt}|t:${p.para}`)!, y = yCanal.get(p.id)!;
        return [{ x: xo, y: p.yo }, { x: xs, y: p.yo }, { x: xs, y }, { x: xe, y }, { x: xe, y: p.yi }, { x: xi, y: p.yi }];
      })();
    return { id: p.id, de: p.de, para: p.para, pontos: enxugar(pts) };
  });
}

/** Tira pontos repetidos e colineares. */
function enxugar(pts: Ponto[]): Ponto[] {
  const r: Ponto[] = [];
  for (const p of pts) {
    const u = r[r.length - 1];
    if (u && u.x === p.x && u.y === p.y) continue;
    const a = r[r.length - 2];
    if (a && u && ((a.x === u.x && u.x === p.x) || (a.y === u.y && u.y === p.y))) r.pop();
    r.push(p);
  }
  return r;
}

/** Path SVG com cantos arredondados (raio limitado à metade dos trechos vizinhos). */
export function caminhoArredondado(pts: Ponto[], raio = 6): string {
  if (pts.length === 0) return "";
  let d = `M${f(pts[0]!.x)} ${f(pts[0]!.y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!, p = pts[i]!, b = pts[i + 1]!;
    const d1 = Math.hypot(p.x - a.x, p.y - a.y), d2 = Math.hypot(b.x - p.x, b.y - p.y);
    const r = Math.min(raio, d1 / 2, d2 / 2);
    d += ` L${f(p.x - ((p.x - a.x) / d1) * r)} ${f(p.y - ((p.y - a.y) / d1) * r)} Q${f(p.x)} ${f(p.y)} ${f(p.x + ((b.x - p.x) / d2) * r)} ${f(p.y + ((b.y - p.y) / d2) * r)}`;
  }
  const u = pts[pts.length - 1]!;
  return pts.length > 1 ? `${d} L${f(u.x)} ${f(u.y)}` : d;
}
const f = (n: number) => Math.round(n * 100) / 100;

/** Meio do trecho horizontal mais longo (>= 30 px: cabe o selo "ou"); sem ele, o do trecho mais longo. */
export function pontoDoSelo(pts: Ponto[]): Ponto {
  let melhor = { d: -1, h: false, x: pts[0]?.x ?? 0, y: pts[0]?.y ?? 0 };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!, d = Math.hypot(b.x - a.x, b.y - a.y), h = a.y === b.y && d >= 30;
    if ((h && !melhor.h) || (h === melhor.h && d > melhor.d)) melhor = { d, h, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  return { x: melhor.x, y: melhor.y };
}
