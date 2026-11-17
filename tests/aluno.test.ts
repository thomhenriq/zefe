import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db, perfil, historico } from "../src/db";
import { getHistorico, getPerfil, marcarHistorico, salvarPerfil } from "../src/dados/aluno";

const USER = "teste-aluno-t6";
const base = { curso: 94, catalogo: 2026, modalidade: null, ingresso: 2025, semestreAtual: 3 };
const limpar = async () => {
  await db.delete(historico).where(eq(historico.user_id, USER));
  await db.delete(perfil).where(eq(perfil.user_id, USER));
};

describe("dados do aluno (precisa do catálogo 2026 do curso 94 no banco)", () => {
  beforeAll(limpar);
  afterAll(limpar);

  test("primeiro cadastro pré-marca; segundo não duplica nem sobrescreve origem 'aluno'", async () => {
    await salvarPerfil(USER, base);
    const h1 = await getHistorico(USER);
    expect(h1.get("EB101")).toBe("cursada");
    expect(h1.get("SI300")).toBe("cursando");
    expect(h1.has("SI201")).toBe(false);

    await marcarHistorico(USER, "EB101", "cursando"); // aluno corrige
    await marcarHistorico(USER, "SI201", "cursada"); // e adiciona
    await salvarPerfil(USER, { ...base, semestreAtual: 5 });

    const rows = await db.select().from(historico).where(eq(historico.user_id, USER));
    expect(rows.length).toBe(h1.size + 1);
    expect(rows.find((r) => r.codigo === "EB101")).toMatchObject({ estado: "cursando", origem: "aluno" });
    expect(rows.find((r) => r.codigo === "SI300")?.origem).toBe("premarcada");
    expect((await getPerfil(USER))?.semestre_atual).toBe(5);

    await marcarHistorico(USER, "SI201", null);
    expect((await getHistorico(USER)).has("SI201")).toBe(false);
  });

  test("rejeita ingresso antes de 2020 e semestre fora da proposta", async () => {
    await expect(salvarPerfil(USER, { ...base, ingresso: 2019 })).rejects.toThrow();
    await expect(salvarPerfil(USER, { ...base, semestreAtual: 20 })).rejects.toThrow();
  });
});
