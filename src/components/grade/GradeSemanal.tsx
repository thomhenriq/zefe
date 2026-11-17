import Link from "next/link";
import type { Dia } from "@/dac/tipos";
import { cn } from "@/lib/utils";
import { corDe } from "@/components/ui/estado";
import { lado, minutos } from "./layout";

export type ItemGrade = { rotulo: string; dia: Dia; inicio: string; fim: string; tom: string; href?: string };

const DIAS: { dia: Dia; nome: string; curto: string }[] = [
  { dia: "seg", nome: "segunda", curto: "Seg" }, { dia: "ter", nome: "terça", curto: "Ter" },
  { dia: "qua", nome: "quarta", curto: "Qua" }, { dia: "qui", nome: "quinta", curto: "Qui" },
  { dia: "sex", nome: "sexta", curto: "Sex" }, { dia: "sab", nome: "sábado", curto: "Sáb" },
];
const H0 = 7, H1 = 23, PX_H = 44; // 07h–23h, 44px por hora
const horas = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
const NEUTRO = "text-foreground bg-muted border-border";
const cor = (tom: string) => corDe(tom as never) ?? NEUTRO;

/**
 * Grade semanal seg–sáb, 07h–23h. Itens sobrepostos ficam lado a lado. Em telas estreitas a grade
 * rola na horizontal (largura mínima 36rem, cabeçalho de horas fixo). Cada bloco tem texto com dia e
 * horário (aria-label); `tom` é um estado/aviso do DESIGN.md (cursada, conflito, previsao...).
 */
export function GradeSemanal({ itens, className }: { itens: ItemGrade[]; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)} role="group" aria-label="Grade semanal">
      <div className="min-w-[36rem]">
        <div className="grid grid-cols-[2.75rem_repeat(6,minmax(0,1fr))] border-b text-xs font-medium text-muted-foreground">
          <span />
          {DIAS.map((d) => <span key={d.dia} className="border-l px-1 py-1.5 text-center">{d.curto}</span>)}
        </div>
        <div className="grid grid-cols-[2.75rem_repeat(6,minmax(0,1fr))]" style={{ height: horas.length * PX_H }}>
          <div className="relative">
            {horas.map((h) => (
              <span key={h} className="tabular absolute right-1.5 -translate-y-1/2 text-[0.7rem] text-muted-foreground" style={{ top: (h - H0) * PX_H, display: h === H0 ? "none" : undefined }}>
                {String(h).padStart(2, "0")}h
              </span>
            ))}
          </div>
          {DIAS.map(({ dia, nome }) => {
            const doDia = itens.filter((i) => i.dia === dia);
            const pos = lado(doDia);
            return (
              <div key={dia} className="relative border-l" style={{ backgroundImage: "linear-gradient(to bottom, var(--border) 1px, transparent 1px)", backgroundSize: `100% ${PX_H}px` }}>
                {doDia.map((it, i) => {
                  const topo = Math.max(0, (minutos(it.inicio) - H0 * 60) / 60) * PX_H;
                  const alto = Math.max(18, ((Math.min(minutos(it.fim), H1 * 60) - Math.max(minutos(it.inicio), H0 * 60)) / 60) * PX_H - 2);
                  const { col, cols } = pos[i]!;
                  const cls = cn("absolute overflow-hidden rounded-md border px-1 py-0.5 text-[0.7rem] leading-tight", cor(it.tom), it.href && "hover:brightness-95 dark:hover:brightness-110");
                  const estilo = { top: topo + 1, height: alto, left: `calc(${(col / cols) * 100}% + 1px)`, width: `calc(${100 / cols}% - 2px)` };
                  const rotuloAria = `${it.rotulo}, ${nome}, ${it.inicio} às ${it.fim}`;
                  const conteudo = (<><span className="block truncate font-mono font-semibold">{it.rotulo}</span><span className="tabular block truncate opacity-80">{it.inicio}–{it.fim}</span></>);
                  return it.href
                    ? <Link key={i} href={it.href} aria-label={rotuloAria} title={rotuloAria} className={cls} style={estilo}>{conteudo}</Link>
                    : <div key={i} role="group" aria-label={rotuloAria} title={rotuloAria} className={cls} style={estilo}>{conteudo}</div>;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
