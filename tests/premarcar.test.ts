import { describe, test, expect } from "bun:test";
import { premarcar } from "../src/dominio/premarcar";
import type { PropostaSemestre } from "../src/dac/tipos";

// Início real da proposta do curso 94 / catálogo 2026.
const proposta: PropostaSemestre[] = [
  { semestre: 1, codigos: ["EB101", "SI100", "SI101", "SI102", "SI120", "ST008", "TT106", "TT350"], creditosEletivos: 0 },
  { semestre: 2, codigos: ["EB102", "SI203", "SI220", "SI250", "SI305", "ST266", "ST468"], creditosEletivos: 4 },
  { semestre: 3, codigos: ["SI300", "SI304", "SI350", "SI404", "ST211", "ST567", "ST568", "TT304"], creditosEletivos: 0 },
  { semestre: 4, codigos: ["SI201"], creditosEletivos: 8 },
];

describe("premarcar", () => {
  test("semestre 3: anteriores cursadas, atual cursando, futuros ausentes", () => {
    const r = premarcar(proposta, 3);
    const m = new Map(r.map((x) => [x.codigo, x.estado]));
    expect(m.get("EB101")).toBe("cursada");
    expect(m.get("EB102")).toBe("cursada");
    expect(m.get("SI300")).toBe("cursando");
    expect(m.has("SI201")).toBe(false);
    expect(r).toHaveLength(8 + 7 + 8);
  });
  test("semestre 0 (ainda não comecei): vazio", () => {
    expect(premarcar(proposta, 0)).toEqual([]);
  });
});
