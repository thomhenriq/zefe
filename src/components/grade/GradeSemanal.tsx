"use client";

import { useState } from "react";
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
 * Grade semanal seg–sáb, 07h–23h. Itens sobrepostos ficam lado a lado. Abaixo de `sm` mostra um dia por vez
 * (seletor Seg–Sáb, começa no primeiro dia com aula) para os blocos terem largura legível; de `sm` em diante,
 * a semana inteira (rola na horizontal abaixo de 36rem). Cada bloco tem aria-label com dia e horário;
 * `tom` é um estado/aviso do DESIGN.md (cursada, conflito, previsao...).
 */
export function GradeSemanal({ itens, className }: { itens: ItemGrade[]; className?: string }) {
  const [sel, setSel] = useState<Dia>(() => DIAS.find((d) => itens.some((i) => i.dia === d.dia))?.dia ?? "seg");
  const colunas = "grid-cols-[2.75rem_minmax(0,1fr)] sm:grid-cols-[2.75rem_repeat(6,minmax(0,1fr))]";
  const oculta = (d: Dia) => (d === sel ? "" : "max-sm:hidden");
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)} role="group" aria-label="Grade semanal">
      <div role="tablist" aria-label="Dia da semana" className="grid grid-cols-6 border-b sm:hidden">
        {DIAS.map((d) => (
          <button key={d.dia} type="button" role="tab" aria-selected={d.dia === sel} onClick={() => setSel(d.dia)}
            className={cn("relative py-2.5 text-sm font-medium text-muted-foreground", d.dia === sel && "bg-accent text-accent-foreground")}>
            {d.curto}
            {itens.some((i) => i.dia === d.dia) && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="sm:min-w-[36rem]">
        <div className={cn("grid border-b text-xs font-medium text-muted-foreground", colunas)}>
          <span />
          {DIAS.map((d) => <span key={d.dia} className={cn("border-l px-1 py-1.5 text-center", oculta(d.dia))}>{d.curto}</span>)}
        </div>
        <div className={cn("grid", colunas)} style={{ height: horas.length * PX_H }}>
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
              <div key={dia} className={cn("relative border-l", oculta(dia))} style={{ backgroundImage: "linear-gradient(to bottom, var(--border) 1px, transparent 1px)", backgroundSize: `100% ${PX_H}px` }}>
                {doDia.map((it, i) => {
                  const topo = Math.max(0, (minutos(it.inicio) - H0 * 60) / 60) * PX_H;
                  const alto = Math.max(18, ((Math.min(minutos(it.fim), H1 * 60) - Math.max(minutos(it.inicio), H0 * 60)) / 60) * PX_H - 2);
                  const { col, cols } = pos[i]!;
                  const cls = cn("absolute overflow-hidden rounded-md border leading-tight", cols > 1 ? "px-0.5 py-0.5 text-[0.62rem] [overflow-wrap:anywhere]" : "px-1 py-0.5 text-[0.7rem]", cor(it.tom), it.href && "hover:brightness-95 dark:hover:brightness-110");
                  const estilo = { top: topo + 1, height: alto, left: `calc(${(col / cols) * 100}% + 1px)`, width: `calc(${100 / cols}% - 2px)` };
                  const rotuloAria = `${it.rotulo}, ${nome}, ${it.inicio} às ${it.fim}`;
                  const conteudo = (<><span className={cn("block font-mono font-semibold", cols === 1 && "max-sm:break-words sm:truncate")}>{it.rotulo}</span><span className={cn("tabular block opacity-80", cols === 1 && "sm:truncate")}>{it.inicio}–{it.fim}</span></>);
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
