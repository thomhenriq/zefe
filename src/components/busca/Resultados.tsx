import Link from "next/link";
import { mono } from "@/components/consulta";
import type { Resultado } from "./useBusca";

const base = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Negrito nas partes que casaram, sem acento e sem caixa. Um termo por palavra digitada. */
export function Destaque({ texto, q }: { texto: string; q: string }) {
  const alvo = base(texto);
  const termos = [...new Set(q.trim().split(/\s+/).map(base))].filter(Boolean);
  const marca = new Array<boolean>(texto.length).fill(false);
  for (const t of [...termos, termos.join("")]) // o código colado ("si 70" -> "si70") também destaca
    for (let i = alvo.indexOf(t); i >= 0 && t; i = alvo.indexOf(t, i + t.length)) marca.fill(true, i, i + t.length);
  const partes: { t: string; m: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const u = partes[partes.length - 1];
    if (u && u.m === marca[i]) u.t += texto[i];
    else partes.push({ t: texto[i]!, m: marca[i]! });
  }
  return <>{partes.map((p, i) => (p.m ? <mark key={i} className="rounded-sm bg-ds-amber-tint px-px text-foreground">{p.t}</mark> : p.t))}</>;
}

/** Lista agrupada (disciplinas, professores, salas) no padrão listbox; `ativo` é o id da opção em foco (aria-activedescendant). */
export function Resultados({ r, q, ativo, idBase, compacto }: { r: Resultado; q: string; ativo?: string; idBase: string; compacto?: boolean }) {
  const linha = `flex items-baseline gap-3 text-sm hover:bg-muted ${compacto ? "px-4 py-2" : "px-4 py-3"}`;
  const opc = (id: string) => ({ id: `${idBase}-${id}`, role: "option" as const, "aria-selected": ativo === id, className: `${linha} aria-selected:bg-muted aria-selected:outline aria-selected:-outline-offset-2 aria-selected:outline-ring` });
  const grupo = (id: string, titulo: string, n: number, filhos: React.ReactNode, caixa = true) => (
    <div role="group" aria-labelledby={`${idBase}-h-${id}`} className="space-y-1">
      {compacto
        ? <div id={`${idBase}-h-${id}`} className="px-4 pt-3 text-xs font-medium text-muted-foreground">{titulo}</div>
        : <h2 id={`${idBase}-h-${id}`} className="text-xl">{titulo} <span className="text-sm font-normal text-muted-foreground">({n})</span></h2>}
      <div className={compacto || !caixa ? "" : "divide-y overflow-hidden rounded-xl border bg-card"}>{filhos}</div>
    </div>
  );
  return (
    <div className={compacto ? "space-y-1 pb-1" : "space-y-8"}>
      {r.disciplinas.length > 0 && grupo("d", "Disciplinas", r.disciplinas.length, r.disciplinas.map((d) => (
        <Link key={d.codigo} href={`/disciplina/${d.codigo}`} {...opc(`d-${d.codigo}`)}>
          <span className={`${mono} w-16 shrink-0 font-bold`}><Destaque texto={d.codigo} q={q} /></span>
          <span className="min-w-0 flex-1"><Destaque texto={d.nome} q={q} /></span>
          {d.creditos != null && <span className="shrink-0 text-xs text-muted-foreground">{d.creditos} cr.</span>}
        </Link>
      )))}
      {r.professores.length > 0 && grupo("p", "Professores", r.professores.length, r.professores.map((p) => (
        <Link key={p.slug} href={`/professor/${p.slug}`} {...opc(`p-${p.slug}`)}><span className="min-w-0 flex-1"><Destaque texto={p.nome} q={q} /></span></Link>
      )))}
      {r.salas.length > 0 && grupo("s", "Salas", r.salas.length, (
        <div className={compacto ? "flex flex-wrap gap-1 px-4 pb-2" : "flex flex-wrap gap-2"}>
          {r.salas.map((s) => (
            <Link key={s} href={`/sala/${encodeURIComponent(s)}`} id={`${idBase}-s-${s}`} role="option" aria-selected={ativo === `s-${s}`}
              className={`${mono} inline-block rounded-full border bg-card px-4 py-2 text-sm hover:bg-muted aria-selected:bg-muted aria-selected:outline aria-selected:outline-ring`}><Destaque texto={s} q={q} /></Link>
          ))}
        </div>
      ), false)}
    </div>
  );
}
