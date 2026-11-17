"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AvisoBadge, EstadoBadge, type EstadoDisciplina } from "@/components/ui/estado";
import { CartaoDisciplina } from "@/components/arvore/CartaoDisciplina";
import { agruparPorSemestre } from "@/dominio/arvore";
import { detalhar, marcarEstado, type Detalhe } from "@/app/(app)/arvore/acoes";
import { cn } from "@/lib/utils";

export type DisciplinaArvore = {
  codigo: string;
  nome: string;
  creditos: number;
  semestreSugerido: number | null;
  estado: EstadoDisciplina;
  faltamPrereq: string[];
  prereqDesconhecido: boolean;
};

const nota = (d: DisciplinaArvore) =>
  d.estado === "travada" && d.faltamPrereq.length ? `Pede ${d.faltamPrereq.join(", ")}` : d.prereqDesconhecido ? "Pré-requisito não verificado" : undefined;

const LG = "(min-width: 1024px)";
const useLg = () =>
  useSyncExternalStore(
    (cb) => { const m = window.matchMedia(LG); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(LG).matches,
    () => false,
  );

export function Arvore({ disciplinas }: { disciplinas: DisciplinaArvore[] }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const lg = useLg();
  const colunas = agruparPorSemestre(disciplinas);
  const atual = disciplinas.find((d) => d.codigo === aberta) ?? null;
  const fechar = () => { setAberta(null); setTimeout(() => opener.current?.focus(), 0); };

  return (
    <div className="flex items-start gap-4">
      <div className="-mx-4 min-w-0 flex-1 overflow-x-auto px-4 pb-3 lg:mx-0 lg:px-0" tabIndex={0} role="region" aria-label="Árvore de integralização, rola na horizontal">
        <div className="flex w-max gap-3">
          {colunas.map((c) => (
            <section key={c.semestre ?? "fora"} className="w-44 shrink-0 space-y-2" aria-label={c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}>
              <h3 className="font-sans text-xs font-semibold text-muted-foreground">{c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}</h3>
              {c.itens.length === 0 && <p className="text-xs text-muted-foreground">Sem disciplinas</p>}
              {c.itens.map((d) => (
                <button key={d.codigo} type="button" onClick={(e) => { opener.current = e.currentTarget; setAberta(d.codigo); }} className={cn("block rounded-lg text-left transition-colors hover:brightness-95 dark:hover:brightness-110", d.codigo === aberta && "ring-2 ring-ring")} aria-haspopup="dialog" aria-expanded={d.codigo === aberta}>
                  <CartaoDisciplina nome={d.nome} estado={d.estado} codigo={d.codigo} nota={nota(d)} />
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
      {lg && atual && (
        <aside aria-label={`Detalhe de ${atual.nome}`} className="sticky top-20 max-h-[calc(100dvh-6rem)] w-80 shrink-0 overflow-y-auto rounded-xl border bg-card" onKeyDown={(e) => e.key === "Escape" && fechar()}>
          <DetalheDisciplina key={atual.codigo} d={atual} onFechar={fechar} />
        </aside>
      )}
      {!lg && (
        <Sheet open={!!atual} onOpenChange={(o) => !o && setAberta(null)}>
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
            {atual && <DetalheDisciplina key={atual.codigo} d={atual} />}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

const OPCOES: { rotulo: string; valor: "cursada" | "cursando" | null }[] = [
  { rotulo: "Cursada", valor: "cursada" },
  { rotulo: "Cursando", valor: "cursando" },
  { rotulo: "Não fiz", valor: null },
];

const Resumo = ({ d }: { d: DisciplinaArvore }) => (
  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
    <span className="font-mono tabular">{d.codigo}</span>
    <span>{d.creditos} créditos</span>
    <EstadoBadge estado={d.estado} />
  </span>
);

function DetalheDisciplina({ d, onFechar }: { d: DisciplinaArvore; onFechar?: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (onFechar) titulo.current?.focus(); }, [onFechar, d.codigo]);
  const [det, setDet] = useState<Detalhe | null | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  useEffect(() => {
    let vivo = true;
    detalhar(d.codigo).then((r) => vivo && setDet(r), () => vivo && setDet(null));
    return () => { vivo = false; };
  }, [d.codigo, d.estado]);

  const marcaAtual = d.estado === "cursada" || d.estado === "cursando" ? d.estado : null;
  const trocar = (valor: "cursada" | "cursando" | null) =>
    iniciar(async () => {
      setErro(null);
      try { await marcarEstado({ codigo: d.codigo, estado: valor }); } catch (e) { if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e; setErro("Não consegui salvar. Tente de novo."); }
    });

  return (
    <>
      {onFechar ? (
        <div className="flex items-start justify-between gap-2 p-4 pb-2">
          <div className="space-y-0.5">
            <h3 ref={titulo} tabIndex={-1} className="font-heading text-base font-medium outline-none">{d.nome}</h3>
            <Resumo d={d} />
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onFechar}><X aria-hidden /><span className="sr-only">Fechar detalhe</span></Button>
        </div>
      ) : (
        <SheetHeader className="pr-12">
          <SheetTitle>{d.nome}</SheetTitle>
          <SheetDescription render={<div />} className="flex flex-wrap items-center gap-2"><Resumo d={d} /></SheetDescription>
        </SheetHeader>
      )}
      <div className="space-y-5 px-4 pb-6 text-sm">
        <section aria-labelledby="h-estado" className="space-y-2">
          <h4 id="h-estado" className="text-sm font-semibold">Marcar no seu histórico</h4>
          <div role="group" aria-label="Estado da disciplina" className="flex flex-wrap gap-2">
            {OPCOES.map((o) => (
              <Button key={o.rotulo} variant={marcaAtual === o.valor ? "default" : "outline"} aria-pressed={marcaAtual === o.valor} disabled={pendente} onClick={() => trocar(o.valor)}>
                {o.rotulo}
              </Button>
            ))}
          </div>
          {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
          <p className="text-xs text-muted-foreground">Equivalências não são calculadas: se cumpriu por equivalência, marque como cursada.</p>
        </section>

        <section aria-labelledby="h-prereq" className="space-y-2">
          <h4 id="h-prereq" className="text-sm font-semibold">Pré-requisitos</h4>
          {d.prereqDesconhecido && <AvisoBadge nivel="naoverificado" rotulo="Pré-requisito não verificado" />}
          {det === undefined && <p className="text-muted-foreground">Carregando…</p>}
          {det === null && <p className="text-muted-foreground">Não consegui carregar o detalhe.</p>}
          {det && det.alternativas.length === 0 && !d.prereqDesconhecido && <p className="text-muted-foreground">Sem pré-requisito.</p>}
          {det && det.alternativas.length > 0 && (
            <ul className="space-y-1.5">
              {det.alternativas.map((alt, i) => (
                <li key={i}>
                  {i > 0 && <p className="mb-1 text-xs font-semibold text-muted-foreground">ou</p>}
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {alt.map((r, j) => (
                      <span key={r.codigo} className="inline-flex items-center gap-1.5">
                        {j > 0 && <span className="text-xs text-muted-foreground">e</span>}
                        <Link href={`/disciplina/${r.codigo}`} className={cn("rounded border px-1.5 py-0.5 font-mono text-xs tabular", r.marca === "cursada" ? "border-cursada-borda bg-cursada-bg text-cursada" : r.marca === "cursando" ? "border-cursando-borda bg-cursando-bg text-cursando" : "border-travada-borda bg-travada-bg text-travada")}>
                          {r.codigo}{r.parcial ? " (parcial)" : ""}
                          <span className="sr-only">{r.marca === "cursada" ? ", cursada" : r.marca === "cursando" ? ", cursando" : ", falta"}</span>
                        </Link>
                        <span className="text-xs text-muted-foreground" aria-hidden>{r.marca === "cursada" ? "feita" : r.marca === "cursando" ? "cursando" : "falta"}</span>
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {det?.prereqTexto && <p className="text-xs text-muted-foreground">Texto do catálogo: {det.prereqTexto}</p>}
        </section>

        {det && (
          <>
            <section aria-labelledby="h-destrava" className="space-y-2">
              <h4 id="h-destrava" className="text-sm font-semibold">Destrava</h4>
              {det.destrava.length === 0 ? <p className="text-muted-foreground">Nenhuma disciplina do catálogo pede esta.</p> : (
                <p className="flex flex-wrap gap-1.5">
                  {det.destrava.map((c) => <Link key={c} href={`/disciplina/${c}`} className="rounded border px-1.5 py-0.5 font-mono text-xs tabular">{c}</Link>)}
                </p>
              )}
            </section>
            <section aria-labelledby="h-oferta" className="space-y-1">
              <h4 id="h-oferta" className="text-sm font-semibold">Quando costuma ser oferecida</h4>
              {det.observado[1].length + det.observado[2].length === 0 ? <p className="text-muted-foreground">Sem oferecimento nos anos carregados.</p> : (
                <ul className="tabular">
                  {([1, 2] as const).map((p) => <li key={p}>{p}º semestre: {det.observado[p].length ? det.observado[p].join(", ") : "não apareceu"}</li>)}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Histórico observado nos anos carregados, não uma promessa de oferta.</p>
            </section>
          </>
        )}
        <Button variant="outline" render={<Link href={`/disciplina/${d.codigo}`} />} nativeButton={false}>
          Ver página da disciplina <ExternalLink aria-hidden />
        </Button>
      </div>
    </>
  );
}
