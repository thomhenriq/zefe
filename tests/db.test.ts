import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { db, oferecimento, turma, horario } from "../src/db";

// Ano sentinela: nunca colide com dados reais de coleta.
const ANO = 9999;

async function limpar() {
  await db.delete(oferecimento).where(eq(oferecimento.ano, ANO));
}

describe("esquema do banco", () => {
  beforeAll(limpar);
  afterAll(limpar);

  test("insere e lê um oferecimento com turma e horário", async () => {
    const [of] = await db
      .insert(oferecimento)
      .values({ ano: ANO, periodo: 1, codigo: "TST000", nome: "Teste", creditos: 4 })
      .returning();
    const [t] = await db
      .insert(turma)
      .values({ oferecimento_id: of.id, turma: "A", vagas: 30, matriculados: 10, reservas: ["Calouros"] })
      .returning();
    await db.insert(horario).values({ turma_id: t.id, dia: "seg", inicio: "08:00", fim: "10:00", sala: "PB-01" });

    const [lido] = await db.select().from(oferecimento).where(eq(oferecimento.id, of.id));
    expect(lido.codigo).toBe("TST000");

    const turmas = await db.select().from(turma).where(eq(turma.oferecimento_id, of.id));
    expect(turmas).toHaveLength(1);
    expect(turmas[0].reservas).toEqual(["Calouros"]);

    const horarios = await db.select().from(horario).where(eq(horario.turma_id, t.id));
    expect(horarios).toEqual([expect.objectContaining({ dia: "seg", inicio: "08:00", fim: "10:00", sala: "PB-01" })]);
  });
});
