"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileDown, OctagonX } from "lucide-react";
import { Chip, Selo } from "@/components/ds/Blocos";
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
    <div ref={ref} className="min-w-0 space-y-4 rounded-ds-card bg-ds-bg p-6">
      <p className="flex flex-wrap items-center justify-between gap-2 text-ds-caption">
        <Selo className="bg-ds-surface">Exemplo, dados fictícios</Selo>
        <span>Semana de matrícula</span>
      </p>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Semana de exemplo, segunda a sexta">
        {dias.map((d, di) => (
          <div key={d}>
            <p className="mb-1 text-center text-ds-caption">{d}</p>
            <div className="relative h-36 rounded-ds-input bg-ds-surface">
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
                        "ds-bloco absolute flex items-start gap-0.5 overflow-hidden rounded-ds-input p-1 text-ds-caption leading-tight font-medium",
                        bate ? "bg-ds-conflito-bg text-ds-conflito" : b.id === "t" ? "bg-ds-planejada-bg text-ds-planejada" : "bg-ds-cursando-bg text-ds-cursando",
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
      <p className="min-h-6 text-ds-small" aria-live="polite">
        {choca ? (
          <span className="flex flex-wrap items-center gap-2">
            <Chip tom="conflito">Conflito</Chip> A Turma A bate com Estrutura de Dados I na terça.
          </span>
        ) : etapa === 2 ? (
          <span className="flex items-center gap-1.5 text-ds-cursada">
            <CheckCircle2 className="size-4" aria-hidden /> Turma B, sexta cedo: sem conflito.
          </span>
        ) : (
          <span>Estrutura de Dados I já está na grade.</span>
        )}
      </p>
      <div className="space-y-2 rounded-ds-card bg-ds-previsao-bg p-4 text-ds-previsao">
        <Chip tom="previsao" className="bg-ds-surface">Previsão</Chip>
        <p className="text-ds-small">
          O caderno do semestre ainda não saiu: estes horários são estimados a partir de semestres anteriores e ficam como
          previsão até a DAC publicar.
        </p>
      </div>
      <p className="flex items-center gap-2 text-ds-small">
        <FileDown className="size-4 shrink-0" aria-hidden />
        Arquivo exportado: <span className="font-medium text-ds-ink">grade-2s-2027.ics</span>
      </p>
    </div>
  );
}
