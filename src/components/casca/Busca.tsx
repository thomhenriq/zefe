"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Resultados } from "@/components/busca/Resultados";
import { passo } from "@/components/busca/BuscaPagina";
import { itensDe, total, useBusca } from "@/components/busca/useBusca";

/** Campo de busca do topo. `/` ou Ctrl+K focam o campo (sem roubar `/` de quem já está digitando). Envia por GET para /busca (funciona sem JS). */
export function Busca({ className }: { className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const idBase = useId();
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState<string>();
  const { r, carregando, erro, qResultado } = useBusca(texto, 6);
  const q = texto.trim();
  const n = total(r);
  const verTodos = `${idBase}-todos`;
  const itens = [...itensDe(r), ...(n > 0 ? [{ id: "todos", href: `/busca?q=${encodeURIComponent(q)}` }] : [])];
  const ativoOk = itens.find((i) => i.id === ativo);
  const mostrar = aberto && !!q;
  const fechar = () => { setAberto(false); setAtivo(undefined); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = !!alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName));
      const atalho = (e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !digitando && !e.ctrlKey && !e.metaKey && !e.altKey);
      if (!atalho) return;
      e.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && mostrar) { e.preventDefault(); fechar(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!itens.length) return;
      e.preventDefault();
      setAberto(true);
      setAtivo(passo(itens.map((i) => i.id), ativoOk?.id, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" && mostrar && ativoOk) { e.preventDefault(); fechar(); router.push(ativoOk.href); }
  };
  return (
    <form action="/busca" role="search" className={`${className ?? ""} relative`} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) fechar(); }}>
      <label className="relative block">
        <span className="sr-only">Buscar disciplina, professor ou sala</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          name="q"
          type="search"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setAberto(true); setAtivo(undefined); }}
          onFocus={() => setAberto(true)}
          onKeyDown={aoTeclar}
          role="combobox"
          aria-expanded={mostrar && (n > 0 || (!carregando && !!q))}
          aria-controls={`${idBase}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={ativoOk ? (ativoOk.id === "todos" ? verTodos : `${idBase}-${ativoOk.id}`) : undefined}
          placeholder="Buscar disciplina, professor…"
          aria-keyshortcuts="/ Control+K"
          className="h-10 w-full rounded-full border border-transparent bg-muted pr-9 pl-10 text-sm placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full border px-2 text-xs text-muted-foreground lg:block" aria-hidden>/</kbd>
      </label>
      <p className="sr-only" aria-live="polite">{!mostrar || !q || carregando ? "" : erro ? "Não consegui buscar agora." : n === 0 ? "Nenhum resultado" : `${n} ${n === 1 ? "resultado" : "resultados"}`}</p>
      {mostrar && (
        // mouseDown não tira o foco do campo, para o clique no item não ser perdido pelo blur
        <div id={`${idBase}-lista`} role="listbox" aria-label="Sugestões" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) fechar(); }}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70dvh] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-elevada">
          {n > 0 && (
            <>
              <div className={carregando ? "opacity-60 motion-safe:transition-opacity" : "motion-safe:transition-opacity"}>
                <Resultados r={r!} q={qResultado} ativo={ativoOk?.id} idBase={idBase} compacto />
              </div>
              <Link href={`/busca?q=${encodeURIComponent(q)}`} id={verTodos} role="option" aria-selected={ativoOk?.id === "todos"} onClick={fechar}
                className="block border-t px-4 py-3 text-sm font-medium text-link hover:bg-muted aria-selected:bg-muted">
                Ver todos os resultados
              </Link>
            </>
          )}
          {n === 0 && !carregando && <p className="px-4 py-3 text-sm text-muted-foreground">{erro ? "Não consegui buscar agora." : <>Não encontrei nada para “{q}”. Tente menos letras.</>}</p>}
          {n === 0 && carregando && <p className="px-4 py-3 text-sm text-muted-foreground">Buscando…</p>}
        </div>
      )}
    </form>
  );
}
