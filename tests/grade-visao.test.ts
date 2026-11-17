import { describe, expect, test } from "bun:test";
import { agruparAchados, itensSemanais, opcoesSemestre, resumoHorarios, semHorario } from "@/components/grade/visao";
import type { ItemGrade } from "@/dominio/grade";

const it = (codigo: string, horarios: ItemGrade["horarios"], extra: Partial<ItemGrade> = {}): ItemGrade =>
  ({ codigo, nome: codigo, turma: "A", creditos: 4, campus: "limeira", horarios, tipo: "oficial", reservas: [], ...extra });
const h = (dia: "seg" | "ter", inicio: string, fim: string) => ({ dia, inicio, fim, sala: "" });

describe("itensSemanais", () => {
  test("tons: planejada, previsão, conflito e bloqueio", () => {
    const itens = [it("A1", [h("seg", "08:00", "10:00")]), it("B1", [h("ter", "08:00", "10:00")], { tipo: "previsao" }), it("C1", [h("seg", "09:00", "11:00")])];
    const r = itensSemanais(itens, [{ id: "1", nome: "Estágio", dia: "ter", inicio: "13:30", fim: "17:30" }], [{ nivel: "conflito", dia: "seg", codigos: ["A1", "C1"], motivo: "x" }]);
    expect(r.map((x) => [x.rotulo, x.tom])).toEqual([["A1 A", "conflito"], ["B1 A", "previsao"], ["C1 A", "conflito"], ["Estágio", "travada"]]);
  });
  test("bloqueio sobreposto vira conflito", () => {
    const r = itensSemanais([it("A1", [h("ter", "14:00", "16:00")])], [{ id: "1", nome: "Estágio", dia: "ter", inicio: "13:30", fim: "17:30" }], [{ nivel: "conflito", dia: "ter", codigos: ["A1"], motivo: "x" }]);
    expect(r.map((x) => x.tom)).toEqual(["conflito", "conflito"]);
  });
});
test("semHorario inclui incompletos", () => {
  expect(semHorario([it("A", []), it("B", [h("seg", "08:00", "09:00")]), it("C", [h("seg", "08:00", "09:00")], { horarioIncompleto: true })]).map((i) => i.codigo)).toEqual(["A", "C"]);
});
test("agruparAchados", () => {
  const g = agruparAchados([{ nivel: "aviso", dia: null, codigos: [], motivo: "a" }, { nivel: "conflito", dia: "seg", codigos: [], motivo: "c" }]);
  expect([g.conflito.length, g.aviso.length]).toEqual([1, 1]);
});
test("resumoHorarios", () => {
  expect(resumoHorarios([{ dia: "qua", inicio: "08:00", fim: "10:00", sala: "PB01" }])).toBe("Qua 08:00–10:00 (PB01)");
  expect(resumoHorarios([])).toBe("sem horário");
});
test("opcoesSemestre: junta, dedup, ordena, corta antigos", () => {
  const r = opcoesSemestre([{ ano: 2018, periodo: 1 }, { ano: 2026, periodo: 1 }, { ano: 2025, periodo: 2 }], { ano: 2027, periodo: 1 }, { ano: 2026, periodo: 1 });
  expect(r).toEqual([{ ano: 2027, periodo: 1 }, { ano: 2026, periodo: 1 }, { ano: 2025, periodo: 2 }]);
});
