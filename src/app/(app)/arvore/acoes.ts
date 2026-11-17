"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirUsuario } from "@/sessao";
import { getHistorico, marcarHistorico } from "@/dados/aluno";
import { getDisciplina } from "@/dados/disciplinas";
import { observadoPorPeriodo } from "@/dominio/arvore";

const codigoSchema = z.string().regex(/^[A-Z]{1,2}\d{3}$/);
const marcaSchema = z.object({ codigo: codigoSchema, estado: z.enum(["cursada", "cursando"]).nullable() });

export type Detalhe = {
  alternativas: { codigo: string; parcial: boolean; marca: "cursada" | "cursando" | null }[][];
  prereqTexto: string | null;
  destrava: string[];
  observado: { 1: number[]; 2: number[] };
  catalogo: number | null;
};

/** Detalhe sob demanda (a árvore tem dezenas de disciplinas). Marca de cada pré-requisito vem do histórico do usuário da sessão. */
export async function detalhar(codigo: string): Promise<Detalhe | null> {
  const u = await exigirUsuario();
  const c = codigoSchema.parse(codigo);
  const d = await getDisciplina(c, u.perfil.catalogo ?? undefined);
  if (!d) return null;
  const hist = await getHistorico(u.id);
  return {
    alternativas: d.alternativas.map((alt) => alt.map((r) => ({ ...r, marca: hist.get(r.codigo) ?? null }))),
    prereqTexto: d.prereqTexto,
    destrava: d.destrava,
    observado: observadoPorPeriodo(d.oferecimentos),
    catalogo: d.catalogo,
  };
}

export async function marcarEstado(entrada: { codigo: string; estado: "cursada" | "cursando" | null }): Promise<void> {
  const u = await exigirUsuario();
  const { codigo, estado } = marcaSchema.parse(entrada);
  await marcarHistorico(u.id, codigo, estado);
  revalidatePath("/arvore");
}
