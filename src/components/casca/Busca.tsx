"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

/** Campo de busca do topo. `/` ou Ctrl+K focam o campo (sem roubar `/` de quem já está digitando). Envia por GET para /busca (funciona sem JS). */
export function Busca({ className }: { className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
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
  return (
    <form action="/busca" role="search" className={className}>
      <label className="relative block">
        <span className="sr-only">Buscar disciplina, professor ou sala</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Buscar disciplina, professor…"
          aria-keyshortcuts="/ Control+K"
          className="h-9 w-full rounded-lg border bg-card pr-9 pl-9 text-sm shadow-suave placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1.5 font-mono text-[0.65rem] text-muted-foreground lg:block" aria-hidden>/</kbd>
      </label>
    </form>
  );
}
