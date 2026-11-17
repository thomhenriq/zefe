import type { PropostaSemestre } from "@/dac/tipos";

// Créditos eletivos da proposta não entram: o aluno diz quais cursou.
export function premarcar(
  proposta: PropostaSemestre[],
  semestreAtual: number,
): { codigo: string; estado: "cursada" | "cursando" }[] {
  return proposta.flatMap((s) =>
    s.semestre > semestreAtual
      ? []
      : s.codigos.map((codigo) => ({
          codigo,
          estado: s.semestre < semestreAtual ? ("cursada" as const) : ("cursando" as const),
        })),
  );
}
