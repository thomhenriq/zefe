"use client";

import { useEffect, useRef, useState } from "react";
import { OctagonX } from "lucide-react";
import { Chip, Selo } from "@/components/ds/Blocos";
import { cn } from "@/lib/utils";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const diasLongos = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const H0 = 8;
const H1 = 16;
const horas = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

type B = { id: string; nome: string; turma: string; dia: number; ini: number; fim: number };
const fixos: B[] = [
  { id: "bd", nome: "Banco de Dados II", turma: "A", dia: 0, ini: 8, fim: 10 },
  { id: "ed", nome: "Estrutura de Dados I", turma: "B", dia: 1, ini: 10, fim: 12 },
  { id: "web", nome: "Programação para a Web", turma: "A", dia: 2, ini: 14, fim: 16 },
  { id: "so", nome: "Sistemas Operacionais", turma: "A", dia: 3, ini: 8, fim: 10 },
];
const turmaA: B = { id: "ia", nome: "Inteligência Artificial", turma: "A", dia: 1, ini: 10, fim: 12 };
const turmaB: B = { id: "ia", nome: "Inteligência Artificial", turma: "B", dia: 4, ini: 8, fim: 10 };

/** Etapa 0: só a grade. 1: a turma A de IA cai e conflita. 2: troca para a turma B, resolvido (estado final). */
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

  const blocos = etapa === 0 ? fixos : etapa === 1 ? [...fixos, turmaA] : [...fixos, turmaB];
  const choca = (b: B) => etapa === 1 && blocos.some((o) => o.id !== b.id && o.dia === b.dia && o.ini < b.fim && b.ini < o.fim);
  const tom = (b: B) => (choca(b) ? "bg-ds-conflito-bg text-ds-conflito" : b.id === "ia" ? "bg-ds-planejada-bg text-ds-planejada" : "border border-ds-line bg-ds-bg text-ds-ink");
  const rotulo = (b: B) => `${b.nome}, turma ${b.turma}, ${diasLongos[b.dia]} das ${b.ini}h às ${b.fim}h${choca(b) ? ", em conflito" : ""}`;

  return (
    <div ref={ref} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-ds-small" aria-live="polite">
        <Selo>Exemplo</Selo>
        {etapa === 1 ? (
          <>
            <Chip tom="conflito">Conflito</Chip> A turma A de Inteligência Artificial bate com Estrutura de Dados I na terça.
          </>
        ) : etapa === 2 ? (
          <>
            <Chip tom="cursada">Sem conflitos</Chip> Turma B de Inteligência Artificial, sexta cedo.
          </>
        ) : (
          <>Estrutura de Dados I já está na grade.</>
        )}
      </div>

      {/* Tela larga: semana com as turmas e os horários */}
      <div className="hidden gap-2 md:flex" role="group" aria-label="Semana de exemplo, segunda a sexta">
        <div className="w-8 shrink-0 pt-8" aria-hidden>
          {horas.map((h) => (
            <p key={h} className="h-12 -translate-y-2 text-right text-ds-caption ds-num">{h}h</p>
          ))}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-2">
          {dias.map((d, di) => (
            <div key={d} className="min-w-0">
              <p className="mb-2 h-6 text-center text-ds-caption">{d}</p>
              <div className="relative overflow-hidden rounded-ds-card border border-ds-line bg-ds-surface">
                {horas.map((h) => <div key={h} aria-hidden className="h-12 border-t border-ds-line first:border-t-0" />)}
                {blocos
                  .filter((b) => b.dia === di)
                  .map((b, k, arr) => (
                    <div
                      key={`${b.id}-${b.turma}`}
                      style={{
                        top: `${((b.ini - H0) / (H1 - H0)) * 100}%`,
                        height: `${((b.fim - b.ini) / (H1 - H0)) * 100}%`,
                        left: `${(k / arr.length) * 100}%`,
                        width: `${100 / arr.length}%`,
                      }}
                      aria-label={rotulo(b)}
                      className={cn("ds-bloco absolute overflow-hidden rounded-ds-input p-2 text-ds-small leading-tight [overflow-wrap:anywhere]", tom(b))}
                    >
                      <p className="flex items-start gap-1 font-medium">
                        {choca(b) && <OctagonX className="mt-1 size-3 shrink-0" aria-hidden />}
                        {b.nome}
                      </p>
                      <p className="text-ds-caption">turma {b.turma}, <span className="ds-num">{b.ini}h–{b.fim}h</span></p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Celular: agenda por dia, com o nome inteiro de cada turma */}
      <ul className="space-y-4 md:hidden" aria-label="Semana de exemplo, por dia">
        {dias.map((d, di) => {
          const doDia = blocos.filter((b) => b.dia === di).sort((a, b) => a.ini - b.ini);
          if (!doDia.length) return null;
          return (
            <li key={d}>
              <h4 className="mb-2 text-ds-body font-bold text-ds-ink">{diasLongos[di]}</h4>
              <ul className="space-y-2">
                {doDia.map((b) => (
                  <li key={`${b.id}-${b.turma}`} className={cn("ds-bloco flex items-start gap-2 rounded-ds-input px-4 py-2 text-ds-small", tom(b))}>
                    {choca(b) && <OctagonX className="mt-1 size-4 shrink-0" aria-hidden />}
                    <span className="ds-num whitespace-nowrap">{b.ini}h–{b.fim}h</span>
                    <span className="font-medium">{b.nome} · turma {b.turma}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
