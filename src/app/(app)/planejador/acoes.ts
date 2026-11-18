"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/sessao";
import { buscarDisciplinas } from "@/dados/busca";
import { ofertaPlanejador } from "@/dados/planejador";
import { alterarGrade, criarBloqueio, criarGrade, definirPrincipal, excluirBloqueio, excluirGrade } from "@/dados/grades";

export type Estado = { erro: string } | null;
const id = z.string().regex(/^\d+$/);
const sem = { ano: z.coerce.number().int().min(2000).max(2100), periodo: z.coerce.number().int().min(1).max(2) };
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "horário inválido; use HH:MM");
const url = (ano: number, periodo: number, grade?: string) => `/planejador?ano=${ano}&periodo=${periodo}${grade ? `&grade=${grade}` : ""}`;

/** Valida o FormData, roda `fn` com o usuário da sessão e devolve o erro em pt-BR; o redirect fica fora do try. */
async function rodar<T extends z.ZodRawShape>(fd: FormData, forma: T, fn: (u: string, d: z.infer<z.ZodObject<T>>) => Promise<string | void>): Promise<Estado> {
  const u = await exigirUsuario();
  const p = z.object(forma).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "dados inválidos" };
  let destino: string | void;
  try { destino = await fn(u.id, p.data); } catch (e) { return { erro: e instanceof Error ? e.message : "não foi possível concluir" }; }
  revalidatePath("/planejador");
  if (destino) redirect(destino);
  return null;
}

export const criarGradeAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { ...sem, nome: z.string().trim().min(1, "dê um nome à grade").max(60) }, async (u, d) => url(d.ano, d.periodo, await criarGrade(u, d.ano, d.periodo as 1 | 2, d.nome)));

export const principalAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { grade: id }, (u, d) => definirPrincipal(u, d.grade));

export const excluirGradeAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { ...sem, grade: id }, async (u, d) => { await excluirGrade(u, d.grade); return url(d.ano, d.periodo); });

/** Adicionar e trocar de turma são a mesma operação: a mesma disciplina de novo troca a turma. */
export const adicionarAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { grade: id, codigo: z.string().trim().min(1).max(20), turma: z.string().trim().min(1).max(10) }, async (u, d) => { await alterarGrade(u, d.grade, { adicionar: [{ codigo: d.codigo, turma: d.turma }] }); });

export const removerAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { grade: id, codigo: z.string().trim().min(1).max(20) }, async (u, d) => { await alterarGrade(u, d.grade, { remover: [d.codigo] }); });

export const criarBloqueioAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { nome: z.string().trim().min(1, "dê um nome ao bloqueio").max(60), dia: z.enum(["seg", "ter", "qua", "qui", "sex", "sab"]), inicio: hora, fim: hora }, async (u, d) => { await criarBloqueio(u, d); });

export const excluirBloqueioAcao = async (_: Estado, fd: FormData) =>
  rodar(fd, { id }, async (u, d) => { await excluirBloqueio(u, d.id); });

// Consultas do planejador (busca e turmas de uma disciplina): só leem, e só para quem está logado.
const consulta = z.object;
export type ResultadoBusca = { erro: string } | { disciplinas: { codigo: string; nome: string; creditos: number | null }[] };
export type ResultadoOferta = { erro: string } | Awaited<ReturnType<typeof ofertaPlanejador>>;

export async function buscarAcao(entrada: unknown): Promise<ResultadoBusca> {
  await exigirUsuario();
  const p = consulta({ q: z.string().trim().min(1, "digite um código ou nome").max(80) }).safeParse(entrada);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "busca inválida" };
  try { return { disciplinas: await buscarDisciplinas(p.data.q, 12) }; } catch { return { erro: "não foi possível buscar agora" }; }
}

export async function ofertaAcao(entrada: unknown): Promise<ResultadoOferta> {
  await exigirUsuario();
  const p = consulta({ codigo: z.string().trim().min(1).max(20), ano: z.coerce.number().int().min(1990).max(2100), periodo: sem.periodo }).safeParse(entrada);
  if (!p.success) return { erro: "disciplina ou semestre inválido" };
  try { return await ofertaPlanejador(p.data.codigo, p.data.ano, p.data.periodo as 1 | 2); } catch { return { erro: "não foi possível carregar as turmas agora" }; }
}
