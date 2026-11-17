// Cria (ou reaproveita) o usuário de demonstração. Idempotente. Uso: bun run demo
import { eq } from "drizzle-orm";
import { db, user } from "@/db";
import { salvarPerfil, getHistorico } from "@/dados/aluno";
import { alterarGrade, criarGrade, listarGrades } from "@/dados/grades";
import { carregarProposta } from "@/dados/proposta";
import { getOferta } from "@/dados/disciplinas";
import { proximoSemestre } from "@/dominio/oferta";

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

// Grade "Minha grade" no próximo semestre, com até 3 disciplinas do 4º semestre da proposta que têm oferta (oficial ou previsão).
const { ano, periodo } = proximoSemestre();
const existente = (await listarGrades(u.id, ano, periodo)).find((g) => g.nome === "Minha grade");
const gradeId = existente?.id ?? (await criarGrade(u.id, ano, periodo, "Minha grade"));
const proposta = await carregarProposta(94, 2026, null);
const adicionadas: string[] = [];
for (const codigo of proposta?.find((p) => p.semestre === 4)?.codigos ?? []) {
  if (adicionadas.length === 3) break;
  const o = await getOferta(codigo, ano, periodo);
  if (!o.encontrada) continue;
  const turma = (o.tipo === "oficial" ? o.disciplina : o.base).turmas[0]?.turma;
  if (!turma) continue;
  try { await alterarGrade(u.id, gradeId, { adicionar: [{ codigo, turma }] }); adicionadas.push(`${codigo} ${turma}`); } catch (e) { if (!(e instanceof Error && e.message.includes("não existe"))) throw e; /* turma sem oferta válida: pula */ }
}
console.log(`grade "Minha grade" ${periodo}S/${ano} (${gradeId}): ${adicionadas.join(", ") || "nenhuma disciplina com oferta"}`);
process.exit(0);
