import Link from "next/link";
import { cn } from "@/lib/utils";

/** Botão do sistema v2: pílula de 48px, 500/16. `primaria` (âmbar) é a única ação principal; `secundaria` branca com borda; `fantasma` só texto. */
export const pilula = {
  base: "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-ds-body font-medium whitespace-nowrap transition-colors duration-300 ease-ds",
  primaria: "bg-ds-amber text-ds-ink hover:bg-ds-amber-hover",
  secundaria: "border border-ds-line bg-ds-surface text-ds-ink hover:bg-ds-bg",
  fantasma: "px-5 text-ds-ink hover:bg-ds-frame",
  noBand: "bg-ds-amber text-ds-ink hover:bg-ds-amber-hover",
};

type Variante = "primaria" | "secundaria" | "fantasma";

export function Pilula({ href, variante = "primaria", className, children }: { href: string; variante?: Variante; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(pilula.base, pilula[variante], className)}>
      {children}
    </Link>
  );
}
