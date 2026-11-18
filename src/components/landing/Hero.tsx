"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { EstadoMascote } from "@/components/zefe/Mascote";

const PEDIDO = "monta meu 4º semestre";
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Estado = { texto: string; /** quantos chips do 4º já foram arrumados */ arrumados: number; humor: EstadoMascote };
const FINAL: Estado = { texto: PEDIDO, arrumados: 99, humor: "parado" };

const Ctx = createContext<{ e: Estado; digitar: (t: string) => void }>({ e: FINAL, digitar: () => {} });
export const useHero = () => useContext(Ctx).e;

/**
 * Uma vez, depois da entrada: o pedido é digitado, o Zefe "pensa" e os chips do 4º semestre
 * passam de faltando para o estado final, um a um. Sem JS ou com movimento reduzido: estado final.
 */
export function HeroProvider({ children, total }: { children: React.ReactNode; total: number }) {
  const [e, setE] = useState<Estado>(FINAL);
  const rodada = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = ++rodada.current;
    const vivo = () => rodada.current === id;
    (async () => {
      setE({ texto: "", arrumados: 0, humor: "parado" });
      await pausa(1500);
      for (let i = 1; i <= PEDIDO.length && vivo(); i++) {
        setE((s) => ({ ...s, texto: PEDIDO.slice(0, i), humor: "pensando" }));
        await pausa(45);
      }
      await pausa(600);
      for (let i = 1; i <= total && vivo(); i++) {
        setE((s) => ({ ...s, arrumados: i }));
        await pausa(260);
      }
      if (vivo()) setE(FINAL);
      if (vivo()) setE({ ...FINAL, humor: "feliz" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contador, não nó do DOM
    return () => void rodada.current++;
  }, [total]);

  // quem digita assume o campo: a animação para
  const digitar = (t: string) => {
    rodada.current++;
    setE({ ...FINAL, texto: t });
  };
  return <Ctx.Provider value={{ e, digitar }}>{children}</Ctx.Provider>;
}

/** Formulário de verdade: o envio vai para /entrar (o pedido digitado ainda não é levado). */
export function PedidoForm() {
  const { e, digitar } = useContext(Ctx);
  return (
    <form action="/entrar" className="flex max-w-[40rem] items-center gap-3 rounded-full border bg-card py-1.5 pr-1.5 pl-5 shadow-elevada focus-within:ring-2 focus-within:ring-ring">
      <label className="sr-only" htmlFor="pedido">Peça ao Zefe</label>
      <input
        id="pedido"
        name="pedido"
        value={e.texto}
        onChange={(ev) => digitar(ev.target.value)}
        placeholder="Peça ao Zefe…"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
      >
        Entrar com e-mail <ArrowRight className="hidden size-4 sm:block" aria-hidden />
      </button>
    </form>
  );
}
