import { cn } from "@/lib/utils";
import { corDe, estados, type EstadoDisciplina } from "@/components/ui/estado";

/**
 * Cartão de disciplina da árvore: 11rem de largura, plano (sem sombra), estado = cor + ícone + rótulo.
 * Medida fixa para as colunas de semestre alinharem e rolarem na horizontal (DESIGN.md, "Telas densas").
 */
export function CartaoDisciplina({ nome, estado, codigo, nota, className }: { nome: string; estado: EstadoDisciplina; codigo?: string; nota?: string; className?: string }) {
  const { Icone, rotulo } = estados[estado];
  return (
    <div className={cn("w-44 shrink-0 space-y-1 rounded-lg border p-2.5 text-sm leading-snug", corDe(estado), className)} data-estado={estado}>
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <Icone className="size-3.5 shrink-0" aria-hidden />
        {rotulo}
      </p>
      <p className="font-medium text-foreground">{nome}</p>
      {codigo && <p className="font-mono text-xs tabular opacity-80">{codigo}</p>}
      {nota && <p className="text-xs opacity-90">{nota}</p>}
    </div>
  );
}
