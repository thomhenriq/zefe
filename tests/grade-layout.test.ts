import { describe, expect, test } from "bun:test";
import { lado, minutos } from "@/components/grade/layout";

const it = (inicio: string, fim: string) => ({ inicio, fim });

describe("lado", () => {
  test("minutos", () => expect(minutos("08:30")).toBe(510));
  test("sem sobreposição: coluna cheia", () => {
    expect(lado([it("08:00", "10:00"), it("10:00", "12:00")])).toEqual([{ col: 0, cols: 1 }, { col: 0, cols: 1 }]);
  });
  test("sobrepostos ficam lado a lado, na ordem original", () => {
    expect(lado([it("10:00", "12:00"), it("08:00", "11:00")])).toEqual([{ col: 1, cols: 2 }, { col: 0, cols: 2 }]);
  });
  test("três em cadeia reaproveitam coluna dentro do mesmo grupo", () => {
    const r = lado([it("08:00", "10:00"), it("09:00", "11:00"), it("10:00", "12:00")]);
    expect(r.map((x) => x.col)).toEqual([0, 1, 0]);
    expect(r.every((x) => x.cols === 2)).toBe(true);
  });
});
