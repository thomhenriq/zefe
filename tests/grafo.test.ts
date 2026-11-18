import { expect, test } from "bun:test";
import { ancestrais, construirGrafo, descendentes, relacionadas, type Prereq } from "@/dominio/grafo";

const r = (codigo: string, parcial = false) => ({ codigo, parcial });
// Recorte real do curso 94, catálogo 2026
const cat: Record<string, Prereq> = {
  SI100: [], SI201: [[r("SI100")]], SI203: [[r("SI100")]],
  SI300: [[r("SI100")]],
  ST266: [[r("SI100")], [r("TT130")]], // TT130 fora do currículo, sem entrada no catálogo
  SI304: [[r("SI206")], [r("ST266")]], // SI206 fora do currículo
  SI206: [],
  SI404: [[r("SI206")], [r("ST266")]],
  SI305: [[r("SI100")]],
  ST567: [[r("SI100")]], ST767: [[r("ST567")]],
  TT060: [[r("SI206")], [r("ST266")]],
  SI702: [[r("SI120"), r("SI201"), r("SI203")], [r("SI201"), r("SI204"), r("SI306")]],
  SI700: [[r("SI201", true), r("SI400")]], SI400: [[r("SI300")]],
  SI600: [[r("SI201"), r("SI300"), r("SI304"), r("SI305"), r("SI404"), r("ST767"), r("TT060")]],
  SI912: [[r("AA465")]], SI913: [[r("SI912")]],
};
const curriculo = Object.keys(cat).filter((c) => !["SI206"].includes(c));
const g = construirGrafo(curriculo, (c) => cat[c] ?? null);

test("sem pré-requisitos e sem filhos: nada relacionado", () => {
  const rel = relacionadas(g, "SI800");
  expect(rel.ancestrais.size + rel.descendentes.size + rel.arestas.length).toBe(0);
});

test("cadeia de 4 níveis com profundidade por distância", () => {
  const a = ancestrais(g, "SI600");
  expect(a.get("SI304")).toBe(1);
  expect(a.get("ST266")).toBe(2);
  expect(a.get("SI100")).toBe(2); // menor caminho (via SI305)
  expect(a.get("TT130")).toBe(3);
  expect(descendentes(g, "SI100").get("SI600")).toBe(2); // SI100 → SI305 → SI600
});

test("alternativas: 'ou' só no que não está em todas; 'e' no obrigatório", () => {
  const { arestas } = relacionadas(g, "SI702");
  const t = (de: string) => arestas.find((a) => a.de === de && a.para === "SI702")!.tipo;
  expect(t("SI201")).toBe("e"); // aparece nas duas alternativas
  expect(t("SI120")).toBe("ou");
  expect(t("SI204")).toBe("ou");
});

test("parcial (*) é preservado na aresta", () => {
  expect(g.arestas.find((a) => a.de === "SI201" && a.para === "SI700")!.parcial).toBe(true);
});

test("pré-requisito fora do currículo entra na cadeia e é marcado; sem catálogo = desconhecido", () => {
  const a = ancestrais(g, "SI304");
  expect(a.has("SI206")).toBe(true);
  expect(g.noCurriculo.has("SI206")).toBe(false);
  expect(g.noCurriculo.has("SI304")).toBe(true);
  expect(g.desconhecidos.has("TT130")).toBe(true);
  expect(g.desconhecidos.has("SI206")).toBe(false);
  expect(ancestrais(g, "SI913").has("AA465")).toBe(true);
});

test("arestas: antes → selecionada → depois, ordem cresce com a distância", () => {
  const rel = relacionadas(g, "SI304");
  const e = (de: string, para: string) => rel.arestas.find((a) => a.de === de && a.para === para)!;
  expect(e("ST266", "SI304").ordem).toBe(0);
  expect(e("SI100", "ST266").ordem).toBe(1);
  expect(e("SI304", "SI600").lado).toBe("depois");
  expect(e("SI304", "SI600").ordem).toBe(0);
  // nenhuma aresta que não passe pela selecionada
  expect(rel.arestas.some((a) => a.para === "SI404")).toBe(false);
});

test("ciclo (defensivo): termina, a selecionada não é ancestral de si mesma", () => {
  const ciclo: Record<string, Prereq> = { A: [[r("B")]], B: [[r("C")]], C: [[r("A")]], D: [[r("D")]] };
  const gc = construirGrafo(["A", "B", "C", "D"], (c) => ciclo[c] ?? null);
  const rel = relacionadas(gc, "A");
  expect([...rel.ancestrais.keys()].sort()).toEqual(["B", "C"]);
  expect(rel.ancestrais.has("A")).toBe(false);
  expect(rel.descendentes.size).toBe(2);
  expect(relacionadas(gc, "D").arestas.length).toBe(0); // auto-referência ignorada
});
