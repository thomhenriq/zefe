import { estados, type EstadoDisciplina } from "@/components/ui/estado";
import { AlertTriangle, Telescope, OctagonX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cartão: branco, raio 20, borda 1px, padding 24. */
export function Cartao({ className, ...p }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-ds-card border border-ds-line bg-ds-surface p-6", className)} {...p} />;
}

/** Painel de seção: raio 32, branco sobre o gelo. Padding 24 no celular, 48 de `md`. */
export function Painel({ className, ...p }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-ds-panel border border-ds-line bg-ds-surface p-4 md:p-12", className)} {...p} />;
}

/** Moldura do produto: raio 56, anel gelo-escuro, painel branco (raio 32) por dentro. */
export function Moldura({ className, children, ...p }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-ds-frame border border-ds-line bg-ds-frame p-3 shadow-ds-frame md:p-6", className)} {...p}>
      <div className="rounded-ds-panel bg-ds-surface p-4 md:p-8">{children}</div>
    </div>
  );
}

/** Selo: pílula pequena, frase simples. Usado para "Exemplo" e rótulos curtos. */
export function Selo({ className, ...p }: React.ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center gap-2 rounded-full border border-ds-line bg-ds-bg px-3 py-1 text-ds-small font-medium text-ds-ink", className)} {...p} />;
}

const tons = {
  cursada: "bg-ds-cursada-bg text-ds-cursada",
  cursando: "bg-ds-cursando-bg text-ds-cursando",
  planejada: "bg-ds-planejada-bg text-ds-planejada",
  travada: "bg-ds-travada-bg text-ds-travada",
  faltando: "bg-ds-faltando-bg text-ds-faltando",
  conflito: "bg-ds-conflito-bg text-ds-conflito",
  previsao: "bg-ds-previsao-bg text-ds-previsao",
  aviso: "bg-ds-amber-tint text-ds-ink",
} as const;
export type TomChip = keyof typeof tons;

const iconesAviso: Record<string, LucideIcon> = { conflito: OctagonX, previsao: Telescope, aviso: AlertTriangle };

/** Chip: pílula 12-14px, cor + ícone + texto (estado nunca só por cor). `rotulo` fica só para leitor de tela quando `compacto`. */
export function Chip({ tom, children, compacto, className }: { tom: TomChip; children?: React.ReactNode; compacto?: boolean; className?: string }) {
  const Icone = tom in estados ? estados[tom as EstadoDisciplina].Icone : iconesAviso[tom];
  const rotulo = tom in estados ? estados[tom as EstadoDisciplina].rotulo : tom === "conflito" ? "Conflito" : tom === "previsao" ? "Previsão" : "Aviso";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-ds-small leading-none font-medium whitespace-nowrap", tons[tom], className)}>
      <Icone className="size-4 shrink-0" aria-hidden />
      {children}
      {compacto ? <span className="sr-only">: {rotulo}</span> : null}
    </span>
  );
}
export const rotuloTom = (t: TomChip) => (t in estados ? estados[t as EstadoDisciplina].rotulo : t === "conflito" ? "Conflito" : t === "previsao" ? "Previsão" : "Aviso");
