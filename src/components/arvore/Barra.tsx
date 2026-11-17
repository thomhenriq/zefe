import { barra } from "@/dominio/arvore";

/** Barra de créditos: feito (verde) e em andamento (azul) separados; cursando nunca entra em "feito". */
export function Barra({ titulo, feitos, emAndamento, total, extra }: { titulo: React.ReactNode; feitos: number; emAndamento: number; total: number; extra?: string }) {
  const { feitoPct, andamentoPct } = barra(feitos, emAndamento, total);
  const resumo = `${feitos} de ${total} créditos feitos${emAndamento > 0 ? `, ${emAndamento} em andamento` : ""}`;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium">{titulo}</span>
        <span className="tabular text-xs text-muted-foreground">{resumo}</span>
      </div>
      <div role="img" aria-label={resumo} className="flex h-2.5 overflow-hidden rounded-full border bg-muted">
        <div className="bg-cursada" style={{ width: `${feitoPct}%` }} />
        <div className="bg-cursando" style={{ width: `${andamentoPct}%` }} />
      </div>
      {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
    </div>
  );
}
