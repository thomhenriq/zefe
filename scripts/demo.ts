// Cria (ou reaproveita) o usuário de demonstração. Idempotente. Uso: bun run demo
import { eq } from "drizzle-orm";
import { db, user } from "@/db";
import { salvarPerfil, getHistorico } from "@/dados/aluno";

const EMAIL = "demo@zefe.local";

// Insere direto na tabela do better-auth; o login dele é pelo código, como qualquer usuário.
await db
  .insert(user)
  .values({ id: "demo-zefe", name: "Aluna Demo", email: EMAIL, emailVerified: true })
  .onConflictDoNothing();
const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, EMAIL));

await salvarPerfil(u.id, { curso: 94, catalogo: 2026, modalidade: null, ingresso: 2025, semestreAtual: 3 });
const h = await getHistorico(u.id);
console.log(`demo pronto: ${EMAIL} (${u.id}), ${h.size} disciplinas no histórico`);
process.exit(0);
