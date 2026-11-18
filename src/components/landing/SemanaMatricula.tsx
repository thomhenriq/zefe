"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileDown, OctagonX } from "lucide-react";
import { AvisoBadge, corDe } from "@/components/ui/estado";
import { cn } from "@/lib/utils";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const H0 = 8;
const H1 = 14;
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

type B = { id: string; nome: string; dia: number; ini: number; fim: number };
const ed: B = { id: "ed", nome: "Estrutura de Dados I", dia: 1, ini: 10, fim: 12 };
const turmaA: B = { id: "t", nome: "Turma A", dia: 1, ini: 10, fim: 12 };
const turmaB: B = { id: "t", nome: "Turma B", dia: 4, ini: 8, fim: 10 };

/** Etapa 0: só a grade. 1: a Turma A cai e conflita. 2: troca para a Turma B, resolvido (estado final). */
export function SemanaMatricula() {
  const [etapa, setEtapa] = useState(2);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let vivo = true;
    const io = new IntersectionObserver(
      ([x]) => {
        if (!x.isIntersecting) return;
        io.disconnect();
        (async () => {
          setEtapa(0);
          await pausa(700);
          if (vivo) setEtapa(1);
          await pausa(1700);
          if (vivo) setEtapa(2);
        })();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      vivo = false;
      io.disconnect();
    };
  }, []);

  const blocos = etapa === 0 ? [ed] : etapa === 1 ? [ed, turmaA] : [ed, turmaB];
  const choca = etapa === 1;

  return (
    <div ref={ref} className="min-w-0 space-y-4 rounded-2xl border bg-card p-4">
      <p className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
        <span>exemplo · dados fictícios</span>
        <span>semana de matrícula</span>
      </p>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Semana de exemplo, segunda a sexta">
        {dias.map((d, di) => (
          <div key={d}>
            <p className="mb-1 text-center font-mono text-xs text-muted-foreground">{d}</p>
            <div className="relative h-36 rounded-md bg-muted/60">
              {blocos
                .filter((b) => b.dia === di)
                .map((b, k, arr) => {
                  const bate = choca && arr.length > 1;
                  return (
                    <div
                      key={`${b.id}-${b.nome}`}
                      style={{
                        top: `${((b.ini - H0) / (H1 - H0)) * 100}%`,
                        height: `${((b.fim - b.ini) / (H1 - H0)) * 100}%`,
                        left: `${(k / arr.length) * 100}%`,
                        width: `${100 / arr.length}%`,
                      }}
                      aria-label={`${b.nome}, ${d} das ${b.ini}h às ${b.fim}h${bate ? ", em conflito" : ""}`}
                      className={cn(
                        "anim-bloco absolute flex items-start gap-0.5 overflow-hidden rounded-md border p-1 text-xs leading-tight font-semibold",
                        corDe(bate ? "conflito" : b.id === "t" ? "planejada" : "cursando"),
                      )}
                    >
                      {bate && <OctagonX className="mt-px size-3 shrink-0" aria-hidden />}
                      {b.id === "t" ? b.nome.replace("Turma ", "") : "ED"}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <p className="min-h-6 text-sm" aria-live="polite">
        {choca ? (
          <span className="flex flex-wrap items-center gap-2">
            <AvisoBadge nivel="conflito" /> A Turma A bate com Estrutura de Dados I na terça.
          </span>
        ) : etapa === 2 ? (
          <span className="flex items-center gap-1.5 text-cursada">
            <CheckCircle2 className="size-4" aria-hidden /> Turma B, sexta cedo: sem conflito.
          </span>
        ) : (
          <span className="text-muted-foreground">Estrutura de Dados I já está na grade.</span>
        )}
      </p>
      <div className="space-y-2 rounded-xl border border-dashed border-previsao-borda bg-previsao-bg p-3 text-previsao">
        <AvisoBadge nivel="previsao" className="bg-card" />
        <p className="text-sm">
          O caderno do semestre ainda não saiu: estes horários são estimados a partir de semestres anteriores e ficam como
          previsão até a DAC publicar.
        </p>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileDown className="size-4 shrink-0" aria-hidden />
        Arquivo exportado: <code className="font-mono text-foreground">grade-2s-2027.ics</code>
      </p>
    </div>
  );
}
