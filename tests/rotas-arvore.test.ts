import { expect, test } from "bun:test";
import { caminhoArredondado, rotear, type ArestaEntrada, type Retangulo, type Rota } from "@/dominio/rotas-arvore";

const W = 90, H = 68, G = 24, V = 16;
/** Tabuleiro: `cols[c]` = códigos da coluna c, de cima para baixo. */
function tabuleiro(cols: string[][]): Retangulo[] {
  return cols.flatMap((cs, col) => cs.map((id, row) => ({ id, col, row, x: col * (W + G), y: row * (H + V), w: W, h: H })));
}
const ar = (...pares: [string, string][]): ArestaEntrada[] => pares.map(([de, para]) => ({ id: `${de}>${para}`, de, para }));

const cols = [
  ["A1", "A2", "A3", "A4"],
  ["B1", "B2", "B3"],
  ["C1", "C2", "C3", "C4"],
  ["D1", "D2"],
  ["E1", "E2", "E3"],
  ["F1", "F2", "F3"],
];
const cartoes = tabuleiro(cols);
const arestas = ar(["A1", "B1"], ["A1", "B2"], ["A1", "C3"], ["A1", "F1"], ["A2", "B2"], ["A3", "B2"], ["A4", "E3"], ["B1", "C1"], ["B2", "C1"], ["B3", "C4"], ["C1", "D1"], ["C3", "D2"], ["A2", "F3"], ["B1", "E1"], ["D2", "E2"], ["E3", "F2"], ["A3", "F2"]);
const rotas = rotear(cartoes, arestas);

const segs = (r: Rota) => r.pontos.slice(1).map((p, i) => ({ a: r.pontos[i]!, b: p, id: r.id, de: r.de, para: r.para }));

test("toda aresta vira rota ortogonal, da borda direita da origem à borda esquerda do alvo", () => {
  expect(rotas).toHaveLength(arestas.length);
  for (const r of rotas) {
    const a = cartoes.find((c) => c.id === r.de)!, b = cartoes.find((c) => c.id === r.para)!;
    for (const s of segs(r)) expect(s.a.x === s.b.x || s.a.y === s.b.y).toBe(true);
    expect(r.pontos[0]!.x).toBe(a.x + a.w);
    expect(r.pontos.at(-1)!.x).toBe(b.x);
    expect(r.pontos.at(-1)!.y).toBeGreaterThan(b.y);
    expect(r.pontos.at(-1)!.y).toBeLessThan(b.y + b.h);
  }
});

test("nenhum trecho atravessa o interior de um cartão (linhas só por calhas e canais)", () => {
  for (const r of rotas) for (const s of segs(r)) for (const c of cartoes) {
    const dentroX = Math.max(s.a.x, s.b.x) > c.x + 0.01 && Math.min(s.a.x, s.b.x) < c.x + c.w - 0.01;
    const dentroY = Math.max(s.a.y, s.b.y) > c.y + 0.01 && Math.min(s.a.y, s.b.y) < c.y + c.h - 0.01;
    expect(dentroX && dentroY).toBe(false);
  }
});

test("verticais paralelas na mesma calha só dividem faixa se forem do mesmo feixe (mesma origem ou mesmo alvo)", () => {
  const vs = rotas.flatMap(segs).filter((s) => s.a.x === s.b.x && s.a.y !== s.b.y);
  for (const p of vs) for (const q of vs) {
    if (p.id >= q.id || Math.abs(p.a.x - q.a.x) > 0.001) continue;
    const sobre = Math.min(Math.max(p.a.y, p.b.y), Math.max(q.a.y, q.b.y)) - Math.max(Math.min(p.a.y, p.b.y), Math.min(q.a.y, q.b.y));
    if (sobre > 0.5) expect(p.de === q.de || p.para === q.para).toBe(true);
  }
});

test("horizontais longas no mesmo canal não se sobrepõem em y, exceto no mesmo feixe", () => {
  const hs = rotas.flatMap(segs).filter((s) => s.a.y === s.b.y && Math.abs(s.a.x - s.b.x) > W);
  for (const p of hs) for (const q of hs) {
    if (p.id >= q.id || Math.abs(p.a.y - q.a.y) > 0.001) continue;
    const sobre = Math.min(Math.max(p.a.x, p.b.x), Math.max(q.a.x, q.b.x)) - Math.max(Math.min(p.a.x, p.b.x), Math.min(q.a.x, q.b.x));
    if (sobre > 0.5) expect(p.de === q.de || p.para === q.para).toBe(true);
  }
});

test("aresta que pula colunas (A1 → F1) corre por um canal entre linhas e entra pela calha à esquerda do alvo", () => {
  const r = rotas.find((x) => x.id === "A1>F1")!;
  const longa = segs(r).find((s) => s.a.y === s.b.y && Math.abs(s.a.x - s.b.x) > 3 * W)!;
  expect(longa).toBeDefined();
  // y dentro de um intervalo livre entre duas linhas de cartões
  const linhas = [...new Set(cartoes.map((c) => c.row))];
  expect(linhas.some((k) => longa.a.y > k * (H + V) + H && longa.a.y < (k + 1) * (H + V))).toBe(true);
  const f1 = cartoes.find((c) => c.id === "F1")!;
  const penult = r.pontos.at(-2)!;
  expect(penult.x).toBeLessThan(f1.x);
  expect(penult.x).toBeGreaterThan(cartoes.find((c) => c.id === "E1")!.x + W);
});

test("arestas da mesma origem partilham o tronco (mesma faixa) na calha da origem", () => {
  const xs = ["A1>B1", "A1>B2", "A1>C3", "A1>F1"].map((id) => rotas.find((r) => r.id === id)!.pontos[1]!.x);
  expect(new Set(xs).size).toBe(1);
});

test("arestas para trás e na mesma coluna também saem sem cruzar cartões", () => {
  const extra = rotear(cartoes, ar(["C1", "A2"], ["B1", "B3"], ["F1", "A1"]));
  expect(extra).toHaveLength(3);
  for (const r of extra) for (const s of segs(r)) for (const c of cartoes) {
    const dentroX = Math.max(s.a.x, s.b.x) > c.x + 0.01 && Math.min(s.a.x, s.b.x) < c.x + c.w - 0.01;
    const dentroY = Math.max(s.a.y, s.b.y) > c.y + 0.01 && Math.min(s.a.y, s.b.y) < c.y + c.h - 0.01;
    expect(dentroX && dentroY).toBe(false);
  }
});

test("caminhoArredondado: arredonda cantos sem passar do meio do trecho", () => {
  const d = caminhoArredondado([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }], 6);
  expect(d).toBe("M0 0 L8 0 Q10 0 10 2 L10 4");
});
