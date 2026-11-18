"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, OctagonX } from "lucide-react";
import { Chip, Selo } from "@/components/ds/Blocos";
import { Mascote } from "@/components/zefe/Mascote";
import { cn } from "@/lib/utils";
import { cenarios, type Bloco, type Cenario } from "./dados";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HORA0 = 8;
const HORA1 = 22;
const horas = Array.from({ length: HORA1 - HORA0 }, (_, i) => HORA0 + i);
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Fala = { de: "usuario" | "zefe"; texto: string };

/** Aplica os `n` primeiros passos: o que a conversa disse e como a grade ficou. */
function ate(c: Cenario, n: number) {
  let grade = [...c.inicial];
  const falas: Fala[] = [];
  let pensando = false;
  for (const p of c.passos.slice(0, n)) {
    pensando = p.t === "pensar";
    if (p.t === "usuario") falas.push({ de: "usuario", texto: p.texto });
    if (p.t === "zefe") falas.push({ de: "zefe", texto: p.texto });
    if (p.t === "add") grade = [...grade, p.bloco];
    if (p.t === "trocar") grade = grade.map((b) => (b.id === p.id ? p.para : b));
  }
  return { grade, falas, pensando };
}

const choca = (a: Bloco, b: Bloco) => a.id !== b.id && a.dia === b.dia && a.ini < b.fim && b.ini < a.fim;

export function PecaEVeja() {
  const [cen, setCen] = useState(0);
  const [n, setN] = useState(cenarios[0].passos.length); // padrão: estado final (sem JS e com movimento reduzido)
  const [dig, setDig] = useState(Infinity); // caracteres já digitados da última fala do Zefe
  const rodada = useRef(0);
  const pedirRef = useRef<(i: number) => Promise<void>>(async () => {});
  const fio = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const gradeRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => void rodada.current++, []);

  async function pedir(i: number) {
    const id = ++rodada.current;
    const c = cenarios[i];
    setCen(i);
    // em telas estreitas a grade fica acima do painel: traz para a vista
    if (window.matchMedia("(max-width: 1023px)").matches) gradeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(c.passos.length);
      setDig(Infinity);
      return;
    }
    setN(0);
    setDig(Infinity);
    for (let k = 0; k < c.passos.length; k++) {
      if (rodada.current !== id) return;
      const p = c.passos[k];
      await pausa(p.t === "pensar" ? 250 : p.t === "usuario" ? 350 : 650);
      if (rodada.current !== id) return;
      setN(k + 1);
      if (p.t === "pensar") await pausa(1100);
      if (p.t === "zefe") {
        for (let ch = 0; ch <= p.texto.length; ch += 2) {
          if (rodada.current !== id) return;
          setDig(ch);
          await pausa(16);
        }
        setDig(Infinity);
      }
    }
  }

  const c = cenarios[cen];
  const { grade, falas, pensando } = ate(c, n);
  const conflitos = new Set(grade.filter((b) => grade.some((o) => choca(b, o))).map((b) => b.id));
  const nomes = grade.filter((b) => conflitos.has(b.id)).map((b) => b.nome);

  useEffect(() => {
    pedirRef.current = pedir;
  });

  // primeira vez que a seção entra na tela: toca o primeiro pedido sozinho
  useEffect(() => {
    const el = raiz.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([x]) => {
      if (!x.isIntersecting) return;
      io.disconnect();
      void pedirRef.current(0);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    fio.current?.scrollTo({ top: fio.current.scrollHeight });
  }, [n, dig]);

  return (
    <div ref={raiz} className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12">
      <div className="flex min-w-0 flex-col rounded-ds-card bg-ds-bg lg:order-1">
        <div className="flex items-center justify-between gap-2 px-6 pt-6 pb-2">
          <p className="flex items-center gap-2 text-ds-body font-bold text-ds-ink">
            <Mascote estado={pensando ? "pensando" : "feliz"} tamanho={32} decorativo className="size-8" />
            Zefe
          </p>
          <p className="text-ds-caption" aria-live="polite">
            {pensando ? "pensando…" : "acordado"}
          </p>
        </div>
        <p className="px-6 pb-2"><Selo className="bg-ds-surface">Exemplo, dados fictícios</Selo></p>
        <div ref={fio} className="flex h-72 flex-col gap-2 overflow-y-auto px-6 py-2" role="log" aria-label="Conversa de exemplo com o Zefe">
          {falas.map((f, i) => {
            const ultima = i === falas.length - 1 && f.de === "zefe";
            const texto = ultima ? f.texto.slice(0, dig) : f.texto;
            return (
              <p
                key={`${cen}-${i}`}
                className={cn(
                  "max-w-[85%] rounded-ds-card px-4 py-2 text-ds-small",
                  f.de === "usuario" ? "self-end bg-ds-ink text-ds-on-band" : "self-start bg-ds-surface text-ds-body",
                )}
              >
                {texto}
              </p>
            );
          })}
          {pensando && (
            <p className="flex items-center gap-1 self-start rounded-ds-card bg-ds-surface px-4 py-3" aria-hidden>
              <span className="zefe-ponto size-1.5 rounded-full bg-current" />
              <span className="zefe-ponto size-1.5 rounded-full bg-current" />
              <span className="zefe-ponto size-1.5 rounded-full bg-current" />
            </p>
          )}
        </div>
        <div className="px-6 pt-2 pb-6">
          <p className="mb-2 text-ds-caption">Clique num pedido</p>
          <ul className="flex flex-wrap gap-2">
            {cenarios.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={i === cen}
                  onClick={() => pedir(i)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-ds-small font-medium transition-colors duration-300 ease-ds",
                    i === cen ? "border-ds-ink bg-ds-ink text-ds-on-band" : "border-ds-line bg-ds-surface text-ds-ink hover:bg-ds-frame",
                  )}
                >
                  {s.pedido}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div ref={gradeRef} className="order-first min-w-0 scroll-mt-24 space-y-4 lg:order-2">
        <div className="flex gap-1.5 pl-9 sm:pl-11" aria-hidden={false}>
          {dias.map((d) => (
            <p key={d} className="min-w-0 flex-1 text-center text-ds-caption">{d}</p>
          ))}
        </div>
        <div className="flex gap-1.5">
          <div className="w-7 shrink-0 sm:w-9" aria-hidden>
            {horas.map((h) => (
              <p key={h} className="h-[2rem] -translate-y-1.5 text-right text-ds-caption ds-num">{h}h</p>
            ))}
          </div>
          <div
            className="grid min-w-0 flex-1 grid-cols-6 gap-1.5 rounded-ds-card border border-ds-line bg-ds-surface [background-image:repeating-linear-gradient(to_bottom,var(--ds-line)_0,var(--ds-line)_1px,transparent_1px,transparent_2rem)]"
            role="group"
            aria-label="Grade semanal de exemplo, segunda a sábado"
          >
            {dias.map((d, di) => (
              <div key={d} className="relative h-[28rem] min-w-0">
                {grade
                  .filter((b) => b.dia === di)
                  .map((b) => {
                    const par = grade.filter((o) => o.dia === di && (o.id === b.id || choca(b, o)));
                    const k = par.findIndex((o) => o.id === b.id);
                    const bate = conflitos.has(b.id);
                    return (
                      <div
                        key={`${b.id}-${b.dia}-${b.turma}`}
                        style={{
                          top: `${((b.ini - HORA0) / (HORA1 - HORA0)) * 100}%`,
                          height: `${((b.fim - b.ini) / (HORA1 - HORA0)) * 100}%`,
                          left: `${(k / par.length) * 100}%`,
                          width: `${100 / par.length}%`,
                        }}
                        aria-label={`${b.nome}, turma ${b.turma}, ${dias[b.dia]} das ${b.ini}h às ${b.fim}h${bate ? ", em conflito" : ""}`}
                        className={cn(
                          "ds-bloco absolute overflow-hidden rounded-ds-input px-1.5 py-1 text-ds-caption leading-tight [overflow-wrap:anywhere]",
                          bate ? "bg-ds-conflito-bg text-ds-conflito" : "bg-ds-planejada-bg text-ds-planejada",
                        )}
                      >
                        <p className="flex items-start gap-0.5 font-semibold">
                          {bate && <OctagonX className="mt-px size-3 shrink-0" aria-hidden />}
                          <span className="sm:hidden">{b.sigla}</span>
                          <span className="hidden sm:inline">{b.nome}</span>
                        </p>
                        <p className="hidden text-ds-caption sm:block">turma {b.turma}</p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-9 text-ds-small sm:pl-11" aria-live="polite">
          {conflitos.size ? (
            <>
              <Chip tom="conflito">Conflito</Chip>
              <span>{nomes.join(" e ")} no mesmo horário.</span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-ds-cursada">
              <CheckCircle2 className="size-4" aria-hidden /> Sem conflitos nesta grade.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
