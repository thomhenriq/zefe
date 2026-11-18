"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvisoBadge, EstadoBadge, type EstadoDisciplina } from "@/components/ui/estado";
import { CartaoCompacto } from "@/components/arvore/CartaoDisciplina";
import { agruparPorSemestre } from "@/dominio/arvore";
import { construirGrafo, relacionadas, type Grafo, type Relacionadas } from "@/dominio/grafo";
import { caminhoArredondado, pontoDoSelo, rotear, type Retangulo } from "@/dominio/rotas-arvore";
import { detalhar, marcarEstado, type Detalhe } from "@/app/(app)/arvore/acoes";
import type { DadosGrafo } from "@/dados/aluno";
import { cn } from "@/lib/utils";

export type DisciplinaArvore = {
  codigo: string;
  nome: string;
  creditos: number;
  creditosDesconhecidos?: boolean;
  semestreSugerido: number | null;
  estado: EstadoDisciplina;
  faltamPrereq: string[];
  prereqDesconhecido: boolean;
};

const nota = (d: DisciplinaArvore) =>
  d.estado === "travada" && d.faltamPrereq.length ? `Pede ${d.faltamPrereq.join(", ")}` : d.prereqDesconhecido ? "Pré-requisito não verificado" : undefined;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Papel = "sel" | "antes" | "depois";

const PAPEL: Record<Papel, { rotulo: string; Icone: typeof Target; anel: string }> = {
  sel: { rotulo: "Selecionada", Icone: Target, anel: "ring-[3px] ring-link" },
  antes: { rotulo: "Antes", Icone: ArrowLeft, anel: "ring-2 ring-foreground/70" },
  depois: { rotulo: "Depois", Icone: ArrowRight, anel: "ring-2 ring-link/70" },
};

/*
 * Quadro x lista: o contêiner (`@container`) decide pela PRÓPRIA largura, não pela da janela, porque o painel do
 * Zefe tira 22.5rem do `main` em xl. A partir de 52rem (832 px) cabem 8 colunas de ~88 px + calhas de 24 px,
 * ainda legíveis (código mono 11 px, nome em 2 linhas); abaixo disso, semestres empilhados e sem linhas.
 * As classes `@min-[52rem]:` abaixo são esse limite; mudar um exige mudar todos.
 */

export function Arvore({ disciplinas, grafo: dados }: { disciplinas: DisciplinaArvore[]; grafo: DadosGrafo }) {
  const [sel, setSel] = useState<string | null>(null);
  const [exibida, setExibida] = useState<string | null>(null); // as linhas ficam até a animação de saída acabar
  const [hover, setHover] = useState<string | null>(null);
  const [caixas, setCaixas] = useState<Map<string, Retangulo>>(new Map());
  const roteiro = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLElement>(null);
  const cartoes = useRef(new Map<string, HTMLButtonElement>());
  const assinatura = useRef("");

  const colunas = agruparPorSemestre(disciplinas);
  const posicao = useMemo(() => new Map(colunas.flatMap((c, col) => c.itens.map((d, row) => [d.codigo, { col, row }] as const))), [colunas]);
  const porCodigo = useMemo(() => new Map(disciplinas.map((d) => [d.codigo, d])), [disciplinas]);
  const g = useMemo(() => construirGrafo(disciplinas.map((d) => d.codigo), (c) => dados.prereqs[c] ?? null), [disciplinas, dados]);
  const rel = useMemo(() => (sel ? relacionadas(g, sel) : null), [g, sel]);
  const relLinhas = useMemo(() => (exibida ? relacionadas(g, exibida) : null), [g, exibida]);
  const atual = (sel && porCodigo.get(sel)) || null;

  if (sel && sel !== exibida) setExibida(sel);
  useEffect(() => {
    if (sel || !exibida) return;
    const t = setTimeout(() => setExibida(null), reduzido() ? 0 : 260);
    return () => clearTimeout(t);
  }, [sel, exibida]);

  const limpar = useCallback(() => { setSel(null); setHover(null); }, []);
  useEffect(() => {
    if (!sel) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) limpar(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [sel, limpar]);

  // Mede os cartões (só no quadro: na lista as linhas nem existem). Refaz ao redimensionar, ao mudar de fonte e ao mudar a lista.
  const medir = useCallback(() => {
    const m = new Map<string, Retangulo>();
    const raiz = roteiro.current;
    if (raiz && getComputedStyle(raiz).gridTemplateColumns.split(" ").length > 1) {
      for (const [c, el] of cartoes.current) {
        const p = posicao.get(c);
        if (p) m.set(c, { id: c, ...p, x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
      }
    }
    const sig = [...m.values()].map((b) => `${b.id}${b.x},${b.y},${b.w},${b.h}`).join("|");
    if (sig !== assinatura.current) { assinatura.current = sig; setCaixas(m); }
  }, [posicao]);
  useLayoutEffect(() => {
    medir();
    const ro = new ResizeObserver(medir);
    if (roteiro.current) ro.observe(roteiro.current);
    cartoes.current.forEach((el) => ro.observe(el));
    document.fonts?.ready.then(medir);
    return () => ro.disconnect();
  }, [medir, disciplinas]);

  const rotas = useMemo(() => {
    if (!relLinhas || caixas.size === 0) return [];
    const arestas = relLinhas.arestas.filter((a) => caixas.has(a.de) && caixas.has(a.para));
    const rs = rotear([...caixas.values()], arestas.map((a) => ({ id: `${a.de}>${a.para}`, de: a.de, para: a.para })));
    const por = new Map(arestas.map((a) => [`${a.de}>${a.para}`, a]));
    // indiretas primeiro: as diretas ficam por cima
    return rs.map((r) => ({ r, a: por.get(r.id)!, direta: r.de === exibida || r.para === exibida })).sort((x, y) => Number(x.direta) - Number(y.direta));
  }, [relLinhas, caixas, exibida]);

  const papelDe = (c: string): Papel | null => (c === sel ? "sel" : rel?.ancestrais.has(c) ? "antes" : rel?.descendentes.has(c) ? "depois" : null);
  const previa = new Set(sel || !hover ? [] : [...(g.pais.get(hover) ?? []), ...(g.filhos.get(hover) ?? [])]);
  const andar = (e: React.KeyboardEvent, c: string) => {
    if (c !== sel || !rel || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const lado = e.key === "ArrowLeft" ? rel.ancestrais : rel.descendentes;
    const alvo = [...lado].filter(([k, p]) => p === 1 && cartoes.current.has(k)).map(([k]) => k)[0];
    if (alvo) { e.preventDefault(); cartoes.current.get(alvo)?.focus(); }
  };

  const nAnc = rel?.ancestrais.size ?? 0, nDesc = rel?.descendentes.size ?? 0;
  const aviso = sel ? `${sel}: ${plural(nAnc, "pré-requisito", "pré-requisitos")}, libera ${plural(nDesc, "disciplina", "disciplinas")}` : "";
  const nLinhas = Math.max(1, ...colunas.map((c) => c.itens.length));

  return (
    <div className="@container space-y-3">
      <p role="status" aria-live="polite" className="sr-only">{aviso}</p>
      <div className={cn("flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 text-sm", sel && "@min-[52rem]:sticky @min-[52rem]:top-barra @min-[52rem]:z-30 rounded-xl border bg-card px-4 py-2")}>
        {!sel || !atual ? (
          <p className="text-muted-foreground">Toque ou clique numa disciplina para ver o que ela exige e o que ela libera. Esc limpa o destaque.</p>
        ) : (
          <>
            <p className="min-w-0 max-w-full truncate text-sm"><strong className="font-medium tabular-nums">{atual.codigo}</strong> <span className="text-muted-foreground">{atual.nome}</span></p>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Legenda do destaque">
              {(["antes", "depois"] as const).map((p) => {
                const { Icone, anel } = PAPEL[p];
                const n = p === "antes" ? nAnc : nDesc;
                return (
                  <li key={p} className="flex items-center gap-1.5">
                    <span className={cn("grid size-5 place-items-center rounded-lg bg-card", anel)}><Icone className="size-3" aria-hidden /></span>
                    <span>{p === "antes" ? "Precisam vir antes" : "Liberadas por ela"} ({n})</span>
                  </li>
                );
              })}
              <li className="hidden items-center gap-1.5 @min-[52rem]:flex" aria-hidden><svg width="26" height="6"><line x1="1" x2="25" y1="3" y2="3" className="stroke-foreground" strokeWidth="2.5" /></svg>e: todas</li>
              <li className="hidden items-center gap-1.5 @min-[52rem]:flex" aria-hidden><svg width="26" height="6"><line x1="1" x2="25" y1="3" y2="3" className="stroke-foreground" strokeWidth="2.5" strokeDasharray="5 4" /></svg>ou: uma das alternativas</li>
              <li className="hidden items-center gap-1.5 @min-[52rem]:flex" aria-hidden><svg width="26" height="6"><line x1="1" x2="25" y1="3" y2="3" className="stroke-foreground/50" strokeWidth="1.25" /></svg>indireta</li>
            </ul>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => painel.current?.scrollIntoView({ behavior: reduzido() ? "auto" : "smooth", block: "start" })}>Ver detalhes</Button>
              <Button variant="outline" size="sm" onClick={limpar}><X aria-hidden /> Limpar destaque</Button>
            </div>
          </>
        )}
      </div>

      <div ref={roteiro} role="group" aria-label="Árvore de integralização"
        onClick={(e) => { if (!(e.target as HTMLElement).closest("button, a")) limpar(); }}
        style={{ ["--n" as string]: colunas.length, ["--lin" as string]: nLinhas }}
        className="relative grid grid-cols-1 gap-y-5 @min-[52rem]:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] @min-[52rem]:[grid-template-rows:auto_repeat(var(--lin),5rem)] @min-[52rem]:gap-x-6 @min-[52rem]:gap-y-6 @min-[52rem]:pb-3">
        {colunas.map((c, i) => (
          <section key={c.semestre ?? "fora"} style={{ ["--c" as string]: i + 1 }} className="space-y-2 @min-[52rem]:contents" aria-label={c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}>
            <h3 className="font-sans text-sm font-bold text-muted-foreground @min-[52rem]:col-(--c) @min-[52rem]:row-1">{c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}</h3>
            {c.itens.length === 0 && <p className="text-xs text-muted-foreground @min-[52rem]:col-(--c) @min-[52rem]:row-2">Sem disciplinas</p>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 @min-[52rem]:contents">
              {c.itens.map((d, r) => {
                const p = papelDe(d.codigo);
                const apagada = !!sel && !p;
                const externas = (g.pais.get(d.codigo) ?? []).filter((x) => !g.noCurriculo.has(x));
                const Papel = p ? PAPEL[p] : null;
                const aviso = nota(d);
                const direto = (l: string[] | undefined) => (l ?? []).join(", ");
                return (
                  <div key={d.codigo} className="flex flex-col gap-1 @min-[52rem]:contents">
                    <button type="button" ref={(el) => { if (el) cartoes.current.set(d.codigo, el); else cartoes.current.delete(d.codigo); }}
                      style={{ ["--r" as string]: r + 2 }}
                      data-codigo={d.codigo} data-papel={p ?? undefined} data-apagada={apagada || undefined}
                      title={`${d.codigo} ${d.nome}, ${d.creditosDesconhecidos ? "créditos desconhecidos" : `${d.creditos} créditos`}${aviso ? `. ${aviso}` : ""}${externas.length ? `. Pede, fora do seu currículo: ${externas.join(", ")}` : ""}`}
                      onClick={() => setSel(sel === d.codigo ? null : d.codigo)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(d.codigo)} onPointerLeave={() => setHover(null)}
                      onKeyDown={(e) => andar(e, d.codigo)}
                      aria-pressed={sel === d.codigo} aria-current={sel === d.codigo ? "true" : undefined}
                      className={cn("relative block flex-1 rounded-lg text-left outline-offset-2 @min-[52rem]:col-(--c) @min-[52rem]:row-(--r) motion-safe:transition-[opacity,transform,filter,box-shadow] motion-safe:duration-300",
                        apagada ? "z-0 opacity-30 saturate-50" : "hover:brightness-95 dark:hover:brightness-110", p && "z-20",
                        Papel?.anel, previa.has(d.codigo) && "ring-1 ring-foreground/40")}>
                      {Papel && (
                        <span className="absolute -top-2 right-1 z-10 grid size-5 place-items-center rounded-full border bg-card text-foreground" aria-hidden title={Papel.rotulo}>
                          <Papel.Icone className="size-3" />
                        </span>
                      )}
                      <CartaoCompacto nome={d.nome} estado={d.estado} codigo={d.codigo} creditos={d.creditos} creditosDesconhecidos={d.creditosDesconhecidos} nota={aviso} externas={externas} />
                      {p === "sel" && <span className="sr-only">Selecionada</span>}
                      {p === "antes" && <span className="sr-only">Precisa vir antes de {sel}</span>}
                      {p === "depois" && <span className="sr-only">Liberada por {sel}</span>}
                    </button>
                    {sel === d.codigo && (
                      <div className="space-y-1 text-xs leading-snug text-muted-foreground @min-[52rem]:hidden">
                        {(g.pais.get(d.codigo)?.length ?? 0) > 0 && <p><span aria-hidden>←</span> <span className="sr-only">Pede </span>{direto(g.pais.get(d.codigo))}</p>}
                        {(g.filhos.get(d.codigo)?.length ?? 0) > 0 && <p><span aria-hidden>→</span> <span className="sr-only">Libera </span>{direto(g.filhos.get(d.codigo))}</p>}
                        <p className="flex gap-1.5">
                          <Button variant="outline" size="xs" onClick={() => painel.current?.scrollIntoView({ behavior: reduzido() ? "auto" : "smooth", block: "start" })}>Detalhes</Button>
                          <Button variant="outline" size="xs" onClick={limpar}><X aria-hidden /> Limpar</Button>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {relLinhas && rotas.length > 0 && <Linhas rotas={rotas} saindo={!sel} />}
      </div>

      {atual && rel && (
        <aside ref={painel} aria-label={`Detalhe de ${atual.nome}`} className="scroll-mt-28 rounded-xl border bg-card">
          <DetalheDisciplina key={atual.codigo} d={atual} g={g} rel={rel} porCodigo={porCodigo} externos={dados.externos} onSelecionar={setSel} onFechar={limpar} />
        </aside>
      )}
    </div>
  );
}

type RotaDesenho = { r: ReturnType<typeof rotear>[number]; a: Relacionadas["arestas"][number]; direta: boolean };

/**
 * Camada SVG decorativa (só no quadro): rotas ortogonais com cantos arredondados, seta no alvo.
 * Antes em tinta, depois em verde; "ou" tracejado com selo; indiretas mais finas e claras, diretas por cima.
 * Cada linha leva um halo da cor do fundo por baixo: onde cruza outra linha ou um texto, abre uma folga.
 */
function Linhas({ rotas, saindo }: { rotas: RotaDesenho[]; saindo: boolean }) {
  const sai = saindo ? "" : undefined;
  return (
    <>
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden size-full overflow-visible @min-[52rem]:block" fill="none">
      <defs>
        {rotas.map(({ r, a }, i) => a.tipo === "ou" && (
          <mask key={r.id} id={`arv-m-${i}`} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="20000" height="20000">
            <path d={caminhoArredondado(r.pontos)} stroke="white" strokeWidth="6" pathLength={1} className="arv-linha" data-saindo={sai} style={{ ["--ordem" as string]: a.ordem }} />
          </mask>
        ))}
      </defs>
      {rotas.map(({ r, a, direta }, i) => {
        const d = caminhoArredondado(r.pontos);
        const fim = r.pontos.at(-1)!;
        const [traco, ponta] = a.lado === "antes" ? ["stroke-foreground/70", "fill-foreground/70"] : ["stroke-link", "fill-link"];
        const ordem = { ["--ordem" as string]: a.ordem };
        const w = direta ? 2.25 : 1.25;
        return (
          <g key={r.id} opacity={direta ? 1 : 0.6}>
            {a.tipo === "ou" ? (
              <g mask={`url(#arv-m-${i})`}>
                <path d={d} strokeWidth={w + 3} className="stroke-background" />
                <path d={d} strokeWidth={w} strokeDasharray="6 4" className={traco} />
              </g>
            ) : (
              <>
                <path d={d} strokeWidth={w + 3} pathLength={1} className="arv-linha stroke-background" data-saindo={sai} style={ordem} />
                <path d={d} strokeWidth={w} pathLength={1} className={cn("arv-linha", traco)} data-saindo={sai} style={ordem} />
              </>
            )}
            <path d={`M${fim.x} ${fim.y} l-7 -4 v8 z`} className={cn("arv-extra", ponta)} data-saindo={sai} style={ordem} />
          </g>
        );
      })}
    </svg>
    {/* selos numa camada acima dos cartões: numa calha estreita não podem ficar cortados */}
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-30 hidden size-full overflow-visible @min-[52rem]:block" fill="none">
      {rotas.map(({ r, a }) => {
        const marca = (a.tipo === "ou" ? "ou" : "") + (a.parcial ? "*" : "");
        if (!marca) return null;
        const selo = pontoDoSelo(r.pontos);
        const ordem = { ["--ordem" as string]: a.ordem };
        return (
          <g key={r.id} className="arv-extra" data-saindo={sai} style={ordem}>
            <rect x={selo.x - 11} y={selo.y - 8} width="22" height="16" rx="8" className="fill-card stroke-border" strokeWidth="1" />
            <text x={selo.x} y={selo.y + 4} textAnchor="middle" className="fill-foreground font-sans text-xs font-bold">{marca}</text>
          </g>
        );
      })}
    </svg>
    </>
  );
}

const OPCOES: { rotulo: string; valor: "cursada" | "cursando" | null }[] = [
  { rotulo: "Cursada", valor: "cursada" },
  { rotulo: "Cursando", valor: "cursando" },
  { rotulo: "Não fiz", valor: null },
];

const Resumo = ({ d }: { d: DisciplinaArvore }) => (
  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
    <span className="font-medium tabular-nums">{d.codigo}</span>
    <span>{d.creditosDesconhecidos ? "créditos desconhecidos" : `${d.creditos} créditos`}</span>
    <EstadoBadge estado={d.estado} />
  </span>
);

type PropsDetalhe = { d: DisciplinaArvore; g: Grafo; rel: Relacionadas; porCodigo: Map<string, DisciplinaArvore>; externos: DadosGrafo["externos"]; onSelecionar: (c: string) => void; onFechar: () => void };

function DetalheDisciplina({ d, g, rel, porCodigo, externos, onSelecionar, onFechar }: PropsDetalhe) {
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
      <div className="flex items-start justify-between gap-2 p-6 pb-2">
        <div className="space-y-0.5">
          <h3 className="font-heading text-xl font-bold">{d.nome}</h3>
          <Resumo d={d} />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onFechar}><X aria-hidden /><span className="sr-only">Limpar destaque e fechar detalhe</span></Button>
      </div>
      <div className="grid gap-x-8 gap-y-5 px-6 pb-6 text-sm lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Relacoes d={d} g={g} rel={rel} porCodigo={porCodigo} externos={externos} onSelecionar={onSelecionar} />
        </div>
        <div className="space-y-5">
        <section aria-labelledby="h-estado" className="space-y-2">
          <h4 id="h-estado" className="text-sm font-bold">Marcar no seu histórico</h4>
          <div role="group" aria-label="Estado da disciplina" className="flex flex-wrap gap-2">
            {OPCOES.map((o) => (
              <Button key={o.rotulo} variant="outline" className={marcaAtual === o.valor ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : undefined} aria-pressed={marcaAtual === o.valor} disabled={pendente} onClick={() => trocar(o.valor)}>
                {o.rotulo}
              </Button>
            ))}
          </div>
          {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
          <p className="text-xs text-muted-foreground">Equivalências não são calculadas: se cumpriu por equivalência, marque como cursada.</p>
        </section>

        <section aria-labelledby="h-prereq" className="space-y-2">
          <h4 id="h-prereq" className="text-sm font-bold">Pré-requisitos diretos, como no catálogo</h4>
          {d.prereqDesconhecido && <AvisoBadge nivel="naoverificado" rotulo="Pré-requisito não verificado" />}
          {det === undefined && <p className="text-muted-foreground">Carregando…</p>}
          {det === null && <p className="text-muted-foreground">Não consegui carregar o detalhe.</p>}
          {det && det.alternativas.length === 0 && !d.prereqDesconhecido && <p className="text-muted-foreground">Sem pré-requisito.</p>}
          {det && det.alternativas.length > 0 && (
            <ul className="space-y-1.5">
              {det.alternativas.map((alt, i) => (
                <li key={i}>
                  {i > 0 && <p className="mb-1 text-xs font-bold text-muted-foreground">ou</p>}
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {alt.map((r, j) => (
                      <span key={r.codigo} className="inline-flex items-center gap-1.5">
                        {j > 0 && <span className="text-xs text-muted-foreground">e</span>}
                        <Link href={`/disciplina/${r.codigo}`} className={cn("rounded-full border px-1.5 py-0.5 font-medium tabular-nums text-xs tabular-nums", r.marca === "cursada" ? "border-cursada-borda bg-cursada-bg text-cursada" : r.marca === "cursando" ? "border-cursando-borda bg-cursando-bg text-cursando" : "border-travada-borda bg-travada-bg text-travada")}>
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
              <h4 id="h-destrava" className="text-sm font-bold">Destrava no catálogo todo</h4>
              {det.destrava.length === 0 ? <p className="text-muted-foreground">Nenhuma disciplina do catálogo pede esta.</p> : (
                <p className="flex flex-wrap gap-1.5">
                  {det.destrava.map((c) => <Link key={c} href={`/disciplina/${c}`} className="rounded-full border px-1.5 py-0.5 font-medium tabular-nums text-xs tabular-nums">{c}</Link>)}
                </p>
              )}
            </section>
            <section aria-labelledby="h-oferta" className="space-y-1">
              <h4 id="h-oferta" className="text-sm font-bold">Quando costuma ser oferecida</h4>
              {det.observado[1].length + det.observado[2].length === 0 ? <p className="text-muted-foreground">Sem oferecimento nos anos carregados.</p> : (
                <ul className="tabular-nums">
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
      </div>
    </>
  );
}

const nomeDe = (c: string, porCodigo: Map<string, DisciplinaArvore>, externos: DadosGrafo["externos"]) => porCodigo.get(c)?.nome ?? externos[c]?.nome ?? null;

function Item({ c, prof, g, porCodigo, externos, onSelecionar }: { c: string; prof: number; g: Grafo; porCodigo: Map<string, DisciplinaArvore>; externos: DadosGrafo["externos"]; onSelecionar: (c: string) => void }) {
  const dc = porCodigo.get(c);
  const estado: EstadoDisciplina = dc?.estado ?? externos[c]?.marca ?? "faltando";
  const nome = nomeDe(c, porCodigo, externos);
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {dc ? (
        <button type="button" onClick={() => onSelecionar(c)} className="rounded-full border px-1.5 py-0.5 font-medium tabular-nums text-xs tabular-nums underline-offset-2 hover:bg-accent">{c}<span className="sr-only"> (destacar)</span></button>
      ) : (
        <Link href={`/disciplina/${c}`} className="rounded-full border border-dashed px-1.5 py-0.5 font-medium tabular-nums text-xs tabular-nums">{c}</Link>
      )}
      <span className="min-w-0 flex-1 basis-24">{nome ?? "nome desconhecido"}</span>
      <EstadoBadge estado={estado} />
      {!dc && <AvisoBadge nivel="naoverificado" rotulo="fora do seu currículo" className="border-dashed" />}
      {g.desconhecidos.has(c) && !dc && <span className="text-xs text-muted-foreground">pré-requisitos dela: não verificado</span>}
      {prof > 1 && <span className="text-xs text-muted-foreground">{prof} níveis</span>}
    </li>
  );
}

/** Texto das alternativas em palavras: "e" dentro de uma alternativa, "ou" entre alternativas. */
function Alternativas({ alts }: { alts: { codigo: string; parcial: boolean }[][] }) {
  const cod = (r: { codigo: string; parcial: boolean }) => `${r.codigo}${r.parcial ? " (parcial)" : ""}`;
  if (alts.length === 0) return null;
  const parcial = alts.flat().some((r) => r.parcial);
  return (
    <p className="text-xs text-muted-foreground">
      {alts.length === 1
        ? `Precisa de todas: ${alts[0]!.map(cod).join(" e ")}.`
        : `Basta cumprir uma destas alternativas: ${alts.map((a) => (a.length > 1 ? `(${a.map(cod).join(" e ")})` : cod(a[0]!))).join(" ou ")}. No mapa, linha tracejada com "ou" é uma alternativa; linha contínua vale para qualquer caminho.`}
      {parcial && " Parcial (*): pode ser cursada junto, o requisito vale em parte."}
    </p>
  );
}

function Relacoes({ d, g, rel, porCodigo, externos, onSelecionar }: Pick<PropsDetalhe, "d" | "g" | "rel" | "porCodigo" | "externos" | "onSelecionar">) {
  const ordenar = (m: Map<string, number>) => [...m].sort(([a, x], [b, y]) => x - y || a.localeCompare(b));
  const antes = ordenar(rel.ancestrais), depois = ordenar(rel.descendentes);
  const feita = (c: string) => { const e = porCodigo.get(c)?.estado ?? externos[c]?.marca; return e === "cursada" || e === "cursando"; };
  const naCadeia = antes.filter(([c]) => !feita(c)).length;
  const item = (c: string, p: number) => <Item key={c} c={c} prof={p} g={g} porCodigo={porCodigo} externos={externos} onSelecionar={onSelecionar} />;
  const alts = g.alternativas.get(d.codigo) ?? [];
  const nada = antes.length === 0 && depois.length === 0 && !d.prereqDesconhecido;
  const falta = d.faltamPrereq.length;
  return (
    <section aria-labelledby="h-rel" className="space-y-3">
      <h4 id="h-rel" className="text-sm font-bold">Pré-requisitos e o que {d.codigo} libera</h4>
      {nada && <p>Sem pré-requisitos e não libera outras disciplinas.</p>}
      {d.prereqDesconhecido && <AvisoBadge nivel="naoverificado" rotulo="Pré-requisito não verificado" />}
      {d.estado === "travada" && falta > 0 && (
        <p className="rounded-xl border border-travada-borda bg-travada-bg p-4 font-medium text-travada">
          Faltam {falta} para poder cursar: {d.faltamPrereq.join(", ")}.
          {naCadeia > falta && <span className="block text-xs font-normal">Somando toda a cadeia (todas as alternativas), {plural(naCadeia, "disciplina ainda não feita", "disciplinas ainda não feitas")}.</span>}
        </p>
      )}
      {d.estado !== "travada" && !d.prereqDesconhecido && antes.length > 0 && (d.estado === "faltando" || d.estado === "planejada") && <p className="text-muted-foreground">Pré-requisitos cumpridos ou em andamento: você já pode cursar.</p>}
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      {antes.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium">Para cursar {d.codigo} você precisa de:</p>
          <ul className="space-y-1.5">{antes.map(([c, p]) => item(c, p))}</ul>
          <Alternativas alts={alts} />
        </div>
      )}
      {depois.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium">{d.codigo} libera:</p>
          <ul className="space-y-1.5">{depois.map(([c, p]) => item(c, p))}</ul>
          <p className="text-xs text-muted-foreground">Só disciplinas do seu currículo; a seção Destrava no catálogo todo inclui outros cursos.</p>
        </div>
      )}
      </div>
    </section>
  );
}
