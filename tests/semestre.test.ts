import { expect, test } from "bun:test";
import { parseSemestre, rotuloSemestre, semestresDesde } from "@/dominio/semestre";

test("rótulo e parse", () => {
  expect(rotuloSemestre(2026, 1)).toBe("1S/2026");
  expect(parseSemestre("2026-2")).toEqual({ ano: 2026, periodo: 2 });
  expect(parseSemestre("lixo")).toBeNull();
  expect(parseSemestre("2026-3")).toBeNull();
});
test("semestresDesde desce de 2S para 1S e vira o ano", () => {
  expect(semestresDesde({ ano: 2027, periodo: 1 }, 2024)).toEqual([
    { ano: 2027, periodo: 1 }, { ano: 2026, periodo: 2 }, { ano: 2026, periodo: 1 }, { ano: 2025, periodo: 2 }, { ano: 2025, periodo: 1 }, { ano: 2024, periodo: 2 }, { ano: 2024, periodo: 1 },
  ]);
});
