import { cn } from "@/lib/utils";
import { corDe, estados, type EstadoDisciplina } from "@/components/ui/estado";

/**
 * Cartão de disciplina da árvore: 11rem de largura, plano (sem sombra), estado = cor + ícone + rótulo.
 * Medida fixa para as colunas de semestre alinharem e rolarem na horizontal (DESIGN.md, "Telas densas").
 */
export function CartaoDisciplina({ nome, estado, codigo, nota, externas, className }: { nome: string; estado: EstadoDisciplina; codigo?: string; nota?: string; externas?: string[]; className?: string }) {
  const { Icone, rotulo } = estados[estado];
  return (
    <div className={cn("w-44 shrink-0 space-y-1 rounded-lg border p-2.5 text-sm leading-snug", corDe(estado), className)} data-estado={estado}>
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <Icone className="size-3.5 shrink-0" aria-hidden />
        {rotulo}
      </p>
      <p className="font-medium text-foreground">{nome}</p>
      {codigo && <p className="font-mono text-xs tabular opacity-90">{codigo}</p>}
      {nota && <p className="text-xs opacity-90">{nota}</p>}
      {externas && externas.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-[11px] leading-tight">
          <span>Pede, fora do seu currículo:</span>
          {externas.map((c) => <span key={c} className="rounded border border-dashed border-current px-1 font-mono tabular">{c}</span>)}
        </p>
      )}
    </div>
  );
}

/**
 * Cartão compacto da árvore (quadro de 8 colunas): código mono em negrito, créditos, nome em até 2 linhas
 * (nome completo em `title`, no botão que o envolve, e no painel). Estado = cor + ícone (+ rótulo para leitor de tela).
 * Fora do quadro (lista vertical) mostra também a nota de trava.
 */
export function CartaoCompacto({ nome, estado, codigo, creditos, creditosDesconhecidos, nota, externas }: { nome: string; estado: EstadoDisciplina; codigo: string; creditos: number; creditosDesconhecidos?: boolean; nota?: string; externas?: string[] }) {
  const { Icone, rotulo } = estados[estado];
  const fora = externas && externas.length > 0 ? externas : null;
  return (
    <div className={cn("flex size-full min-h-[4.75rem] flex-col gap-0.5 rounded-md border px-2 py-1.5 leading-tight", corDe(estado))} data-estado={estado}>
      <p className="flex items-center gap-1 text-xs font-semibold @min-[52rem]:text-[11px]">
        <Icone className="size-3.5 shrink-0 @min-[52rem]:size-3" aria-hidden />
        <span className="font-mono tabular">{codigo}</span>
      </p>
      <p className="line-clamp-2 text-xs font-medium leading-[1.2] text-foreground @min-[52rem]:text-[11px]">{nome}</p>
      {nota && <p className="text-xs opacity-90 @min-[52rem]:hidden">{nota}</p>}
      <p className="mt-auto flex items-end justify-between gap-1 text-[10px] leading-none">
        {fora ? (
          <span className="whitespace-nowrap rounded border border-dashed border-current px-1 py-px font-mono tabular" title={`Pede, fora do seu currículo: ${fora.join(", ")}`} aria-hidden>{fora.length === 1 ? `+${fora[0]}` : `+${fora.length} fora`}</span>
        ) : <span />}
        <span className="whitespace-nowrap tabular opacity-90">{creditosDesconhecidos ? "? cr" : `${creditos} cr`}</span>
      </p>
      <span className="sr-only">{rotulo}{fora ? `. Pede, fora do seu currículo: ${fora.join(", ")}` : ""}</span>
    </div>
  );
}
