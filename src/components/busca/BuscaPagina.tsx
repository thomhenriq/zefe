"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Resultados } from "./Resultados";
import { itensDe, total, useBusca, type Resultado } from "./useBusca";

/** Passo de seta: sem ativo, ↓ vai ao primeiro e ↑ ao último; nas pontas dá a volta. */
export const passo = (ids: string[], ativo: string | undefined, d: 1 | -1) => {
  const i = ids.indexOf(ativo ?? "");
  return ids[i < 0 ? (d > 0 ? 0 : ids.length - 1) : (i + d + ids.length) % ids.length];
};

/** Busca ao vivo da página /busca. Sem JS o formulário (GET) e o resultado do servidor continuam valendo. */
export function BuscaPagina({ q: q0, inicial }: { q: string; inicial: Resultado | null }) {
  const router = useRouter();
  const idBase = useId();
  const [texto, setTexto] = useState(q0);
  const [ativo, setAtivo] = useState<string>();
  const { r, carregando, erro, qResultado } = useBusca(texto, 20, { q: q0.trim(), r: inicial });
  const itens = itensDe(r);
  const ativoOk = itens.find((i) => i.id === ativo);
  const q = texto.trim();
  const n = total(r);

  useEffect(() => {
    if (ativoOk) document.getElementById(`${idBase}-${ativoOk.id}`)?.scrollIntoView({ block: "nearest" });
  }, [ativoOk, idBase]);

  const aoDigitar = (v: string) => {
    setTexto(v);
    window.history.replaceState(null, "", v.trim() ? `/busca?q=${encodeURIComponent(v.trim())}` : "/busca");
  };
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!itens.length) return;
      e.preventDefault();
      setAtivo(passo(itens.map((i) => i.id), ativoOk?.id, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" && ativoOk) {
      e.preventDefault();
      router.push(ativoOk.href);
    }
  };

  return (
    <>
      <form action="/busca" role="search" className="flex max-w-xl gap-2">
        <label className="flex-1">
          <span className="sr-only">Disciplina, professor ou sala</span>
          <input
            name="q" type="search" value={texto} onChange={(e) => aoDigitar(e.target.value)} onKeyDown={aoTeclar}
            placeholder="Disciplina, professor ou sala" autoComplete="off" autoCapitalize="off" spellCheck={false}
            role="combobox" aria-expanded={n > 0} aria-controls={`${idBase}-lista`} aria-autocomplete="list"
            aria-activedescendant={ativoOk ? `${idBase}-${ativoOk.id}` : undefined}
            className="h-12 w-full rounded-full border border-input bg-card px-5 text-base placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </label>
        <Button type="submit">Buscar</Button>
      </form>
      <p className="sr-only" aria-live="polite">{!q || carregando ? "" : erro ? "Não consegui buscar agora." : n === 0 ? "Nenhum resultado" : `${n} ${n === 1 ? "resultado" : "resultados"}`}</p>
      {!q && <p className="text-muted-foreground">Digite um código (SI702, ou só SI7), parte de um nome (cálculo, Ana Estela) ou uma sala (PA06). Os resultados aparecem enquanto você digita.</p>}
      {erro && <p>Não consegui buscar agora. Confira a conexão e tente de novo.</p>}
      {q && !erro && !carregando && n === 0 && <p>Não encontrei nada para <strong>“{q}”</strong>. Tente menos letras ou sem a turma.</p>}
      {n > 0 && (
        <div id={`${idBase}-lista`} role="listbox" aria-label="Resultados da busca" aria-busy={carregando} className={carregando ? "opacity-60 motion-safe:transition-opacity" : "motion-safe:transition-opacity"}>
          <Resultados r={r!} q={qResultado} ativo={ativoOk?.id} idBase={idBase} />
        </div>
      )}
    </>
  );
}
