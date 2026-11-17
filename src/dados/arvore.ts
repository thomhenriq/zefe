import { eq } from "drizzle-orm";
import { db, curso } from "@/db";

export async function nomeDoCurso(numero: number | null): Promise<string | null> {
  if (numero == null) return null;
  const [c] = await db.select({ nome: curso.nome }).from(curso).where(eq(curso.numero, numero));
  return c?.nome ?? null;
}
