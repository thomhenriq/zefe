"use client";

import { useEffect, useState } from "react";

export type Resultado = {
  disciplinas: { codigo: string; nome: string; creditos: number | null }[];
  professores: { slug: string; nome: string }[];
  salas: string[];
};
type Estado = { q: string; r: Resultado | null; erro: boolean };

export const total = (r: Resultado | null) => (r ? r.disciplinas.length + r.professores.length + r.salas.length : 0);

/** Itens na ordem em que aparecem (disciplinas, professores, salas), com o destino de cada um. */
export const itensDe = (r: Resultado | null) =>
  r ? [
    ...r.disciplinas.map((d) => ({ id: `d-${d.codigo}`, href: `/disciplina/${d.codigo}` })),
    ...r.professores.map((p) => ({ id: `p-${p.slug}`, href: `/professor/${p.slug}` })),
    ...r.salas.map((s) => ({ id: `s-${s}`, href: `/sala/${encodeURIComponent(s)}` })),
  ] : [];

/**
 * Busca ao digitar: espera ~150 ms parado, cancela a requisição anterior (resposta velha nunca sobrescreve a nova)
 * e mantém o resultado anterior na tela enquanto carrega (sem piscar). `inicial` vem do servidor (sem requisição no primeiro quadro).
 */
export function useBusca(texto: string, limite: number, inicial?: { q: string; r: Resultado | null }) {
  const q = texto.trim();
  const [e, setE] = useState<Estado>({ q: inicial?.q ?? "", r: inicial?.r ?? null, erro: false });
  useEffect(() => {
    if (!q || (q === e.q && !e.erro)) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(q)}&n=${limite}`, { signal: ctl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setE({ q, r: (await res.json()) as Resultado, erro: false });
      } catch {
        if (!ctl.signal.aborted) setE((a) => ({ ...a, q, erro: true }));
      }
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagir só à consulta; `e` entra pelo atalho de "já tenho"
  }, [q, limite]);
  return {
    r: q ? e.r : null,
    /** o resultado na tela é de outra consulta (ainda carregando) */
    carregando: !!q && e.q !== q,
    erro: !!q && e.erro && e.q === q,
    qResultado: e.q,
  };
}
