"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { exigirSessao } from "@/sessao";
import { perfilSchema, salvarPerfil } from "@/dados/aluno";
import { carregarProposta, listarModalidades } from "@/dados/proposta";

const consultaSchema = z.object({
  curso: z.number().int().positive(),
  catalogo: z.number().int().min(2020).max(2100),
  modalidade: z.string().min(1).nullable(),
});

export type InfoCurriculo = {
  carregado: boolean;
  modalidades: { sigla: string; nome: string | null }[];
  semestres: number; // N da proposta (0 se não carregado)
};

export async function consultarCurriculo(entrada: z.input<typeof consultaSchema>): Promise<InfoCurriculo> {
  await exigirSessao();
  const { curso, catalogo, modalidade } = consultaSchema.parse(entrada);
  const modalidades = await listarModalidades(curso, catalogo);
  // Com modalidades, só há proposta depois de escolher uma.
  if (modalidades.length > 0 && modalidade === null) return { carregado: true, modalidades, semestres: 0 };
  const proposta = await carregarProposta(curso, catalogo, modalidade);
  return {
    carregado: proposta !== null,
    modalidades,
    semestres: proposta ? Math.max(0, ...proposta.map((s) => s.semestre)) : 0,
  };
}

export async function concluirCadastro(entrada: z.input<typeof perfilSchema>): Promise<{ erro: string } | never> {
  const u = await exigirSessao();
  const dados = perfilSchema.safeParse(entrada);
  if (!dados.success) return { erro: "Confira os campos: ingresso e catálogo valem de 2020 em diante." };
  try {
    await salvarPerfil(u.id, dados.data);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  redirect("/planejador");
}
