"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvisoBadge, EstadoBadge, type EstadoDisciplina } from "@/components/ui/estado";
import { CartaoDisciplina } from "@/components/arvore/CartaoDisciplina";
import { agruparPorSemestre } from "@/dominio/arvore";
import { construirGrafo, relacionadas, type Grafo, type Relacionadas } from "@/dominio/grafo";
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

type Caixa = { x: number; y: number; w: number; h: number };
type Papel = "sel" | "antes" | "depois";

const PAPEL: Record<Papel, { rotulo: string; Icone: typeof Target; anel: string }> = {
  sel: { rotulo: "Selecionada", Icone: Target, anel: "ring-[3px] ring-primary" },
  antes: { rotulo: "Antes", Icone: ArrowLeft, anel: "ring-2 ring-foreground/70" },
  depois: { rotulo: "Depois", Icone: ArrowRight, anel: "ring-2 ring-primary/70" },
};

/** Curva da borda direita do pré-requisito até a borda esquerda de quem o exige; sem espaço à frente, contorna pela esquerda. */
function caminho(a: Caixa, b: Caixa) {
  const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2, x2 = b.x;
  const frente = b.x - (a.x + a.w) >= 16;
  const x1 = frente ? a.x + a.w : a.x;
  const dx = frente ? Math.max(28, (x2 - x1) / 2) : -36;
  const c1x = x1 + dx, c2x = frente ? x2 - dx : x2 - 36;
  return { d: `M${x1} ${y1} C${c1x} ${y1} ${c2x} ${y2} ${x2} ${y2}`, mx: (x1 + 3 * c1x + 3 * c2x + x2) / 8, my: (y1 + y2) / 2, x2, y2 };
}

export function Arvore({ disciplinas, grafo: dados }: { disciplinas: DisciplinaArvore[]; grafo: DadosGrafo }) {
  const [sel, setSel] = useState<string | null>(null);
  const [exibida, setExibida] = useState<string | null>(null); // as linhas ficam até a animação de saída acabar
  const [hover, setHover] = useState<string | null>(null);
  const [caixas, setCaixas] = useState<Map<string, Caixa>>(new Map());
  const roteiro = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLElement>(null);
  const cartoes = useRef(new Map<string, HTMLButtonElement>());
  const assinatura = useRef("");

  const colunas = agruparPorSemestre(disciplinas);
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

  const medir = useCallback(() => {
    const m = new Map<string, Caixa>();
    for (const [c, el] of cartoes.current) m.set(c, { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    const sig = [...m].map(([c, b]) => `${c}${b.x},${b.y},${b.w},${b.h}`).join("|");
    if (sig !== assinatura.current) { assinatura.current = sig; setCaixas(m); }
  }, []);
  useLayoutEffect(() => {
    medir();
    const ro = new ResizeObserver(medir);
    if (roteiro.current) ro.observe(roteiro.current);
    cartoes.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [medir, disciplinas]);

  // rola só o trilho horizontal (nunca a página) para o cartão escolhido ficar à vista
  useEffect(() => {
    const el = sel ? cartoes.current.get(sel) : null, t = trilho.current;
    if (!el || !t || (el.offsetLeft >= t.scrollLeft && el.offsetLeft + el.offsetWidth <= t.scrollLeft + t.clientWidth)) return;
    t.scrollTo({ left: Math.max(0, el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2), behavior: reduzido() ? "auto" : "smooth" });
  }, [sel]);

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

  return (
    <div className="space-y-3">
      <p role="status" aria-live="polite" className="sr-only">{aviso}</p>
      <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {!sel ? (
          <p className="text-muted-foreground">Toque ou clique numa disciplina para ver o que ela exige e o que ela libera. Esc limpa o destaque.</p>
        ) : (
          <>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Legenda do destaque">
              {(["sel", "antes", "depois"] as const).map((p) => {
                const { Icone, rotulo, anel } = PAPEL[p];
                const n = p === "antes" ? nAnc : p === "depois" ? nDesc : null;
                return (
                  <li key={p} className="flex items-center gap-1.5">
                    <span className={cn("grid size-5 place-items-center rounded bg-card", anel.replace("ring-[3px]", "ring-2"))}><Icone className="size-3" aria-hidden /></span>
                    <span>{p === "antes" ? "Precisam vir antes" : p === "depois" ? "Liberadas por ela" : rotulo}{n !== null && ` (${n})`}</span>
                  </li>
                );
              })}
              <li className="flex items-center gap-1.5" aria-hidden><svg width="26" height="6"><line x1="1" x2="25" y1="3" y2="3" className="stroke-foreground" strokeWidth="2" /></svg>e: todas</li>
              <li className="flex items-center gap-1.5" aria-hidden><svg width="26" height="6"><line x1="1" x2="25" y1="3" y2="3" className="stroke-foreground" strokeWidth="2" strokeDasharray="5 4" /></svg>ou: uma das alternativas</li>
            </ul>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => painel.current?.scrollIntoView({ behavior: reduzido() ? "auto" : "smooth", block: "start" })}>Ver detalhes</Button>
              <Button variant="outline" size="sm" onClick={limpar}><X aria-hidden /> Limpar destaque</Button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div ref={trilho} className="-mx-4 min-w-0 self-stretch overflow-x-auto px-4 pb-3 pt-2 lg:mx-0 lg:flex-1 lg:px-0" tabIndex={0} role="region" aria-label="Árvore de integralização, rola na horizontal"
          onClick={(e) => { if (!(e.target as HTMLElement).closest("button, a")) limpar(); }}>
          <div ref={roteiro} className="relative flex w-max gap-3">
            {colunas.map((c) => (
              <section key={c.semestre ?? "fora"} className="w-44 shrink-0 space-y-2" aria-label={c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}>
                <h3 className="font-sans text-xs font-semibold text-muted-foreground">{c.semestre ? `${c.semestre}º semestre` : "Fora da proposta"}</h3>
                {c.itens.length === 0 && <p className="text-xs text-muted-foreground">Sem disciplinas</p>}
                {c.itens.map((d) => {
                  const p = papelDe(d.codigo);
                  const apagada = !!sel && !p;
                  const externas = (g.pais.get(d.codigo) ?? []).filter((x) => !g.noCurriculo.has(x));
                  const Papel = p ? PAPEL[p] : null;
                  return (
                    <button key={d.codigo} type="button" ref={(el) => { if (el) cartoes.current.set(d.codigo, el); else cartoes.current.delete(d.codigo); }}
                      data-codigo={d.codigo} data-papel={p ?? undefined} data-apagada={apagada || undefined}
                      onClick={() => setSel(sel === d.codigo ? null : d.codigo)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(d.codigo)} onPointerLeave={() => setHover(null)}
                      onKeyDown={(e) => andar(e, d.codigo)}
                      aria-pressed={sel === d.codigo} aria-current={sel === d.codigo ? "true" : undefined}
                      className={cn("relative block rounded-lg text-left outline-offset-2 motion-safe:transition-[opacity,transform,filter,box-shadow] motion-safe:duration-300",
                        apagada ? "opacity-30 saturate-50" : "hover:brightness-95 dark:hover:brightness-110",
                        Papel?.anel, p === "sel" && "motion-safe:scale-[1.04]", previa.has(d.codigo) && "ring-1 ring-foreground/40")}>
                      {Papel && (
                        <span className="absolute -top-2 right-2 z-10 flex items-center gap-1 rounded-full border bg-card px-1.5 py-px text-[10px] font-semibold text-foreground">
                          <Papel.Icone className="size-3" aria-hidden />{Papel.rotulo}
                        </span>
                      )}
                      <CartaoDisciplina nome={d.nome} estado={d.estado} codigo={d.codigo} nota={nota(d)} externas={externas} />
                      {p === "antes" && <span className="sr-only">Precisa vir antes de {sel}</span>}
                      {p === "depois" && <span className="sr-only">Liberada por {sel}</span>}
                    </button>
                  );
                })}
              </section>
            ))}
            {relLinhas && <Linhas rel={relLinhas} caixas={caixas} saindo={!sel} />}
          </div>
        </div>
        {atual && rel && (
          <aside ref={painel} aria-label={`Detalhe de ${atual.nome}`} className="w-full shrink-0 rounded-xl border bg-card lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-80 lg:overflow-y-auto">
            <DetalheDisciplina key={atual.codigo} d={atual} g={g} rel={rel} porCodigo={porCodigo} externos={dados.externos} onSelecionar={setSel} onFechar={limpar} />
          </aside>
        )}
      </div>
    </div>
  );
}

/** Camada SVG decorativa: curvas com seta (antes em tinta, depois em verde), "ou" tracejado com selo. */
function Linhas({ rel, caixas, saindo }: { rel: Relacionadas; caixas: Map<string, Caixa>; saindo: boolean }) {
  const sai = saindo ? "" : undefined;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible" fill="none">
      <defs>
        {rel.arestas.map((a, i) => {
          const [de, para] = [caixas.get(a.de), caixas.get(a.para)];
          if (a.tipo !== "ou" || !de || !para) return null;
          return (
            <mask key={i} id={`arv-m-${i}`} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="20000" height="20000">
              <path d={caminho(de, para).d} stroke="white" strokeWidth="4" pathLength={1} className="arv-linha" data-saindo={sai} style={{ ["--ordem" as string]: a.ordem }} />
            </mask>
          );
        })}
      </defs>
      {rel.arestas.map((a, i) => {
        const [de, para] = [caixas.get(a.de), caixas.get(a.para)];
        if (!de || !para) return null;
        const c = caminho(de, para);
        const [traco, ponta] = a.lado === "antes" ? ["stroke-foreground/70", "fill-foreground/70"] : ["stroke-primary", "fill-primary"];
        const ordem = { ["--ordem" as string]: a.ordem };
        const marca = (a.tipo === "ou" ? "ou" : "") + (a.parcial ? "*" : "");
        return (
          <g key={`${a.de}>${a.para}`}>
            {a.tipo === "ou" ? (
              <g mask={`url(#arv-m-${i})`}><path d={c.d} strokeWidth="2" strokeDasharray="6 5" className={traco} /></g>
            ) : (
              <path d={c.d} strokeWidth="2" pathLength={1} className={cn("arv-linha", traco)} data-saindo={sai} style={ordem} />
            )}
            <path d={`M${c.x2} ${c.y2} l-8 -4.5 v9 z`} className={cn("arv-extra", ponta)} data-saindo={sai} style={ordem} />
            {marca && (
              <g className="arv-extra" data-saindo={sai} style={ordem}>
                <rect x={c.mx - 11} y={c.my - 8} width="22" height="16" rx="8" className="fill-card stroke-border" strokeWidth="1" />
                <text x={c.mx} y={c.my + 3.5} textAnchor="middle" className="fill-foreground font-sans text-[10px] font-semibold">{marca}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
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
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="space-y-0.5">
          <h3 className="font-heading text-base font-medium">{d.nome}</h3>
          <Resumo d={d} />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onFechar}><X aria-hidden /><span className="sr-only">Limpar destaque e fechar detalhe</span></Button>
      </div>
      <div className="space-y-5 px-4 pb-6 text-sm">
        <Relacoes d={d} g={g} rel={rel} porCodigo={porCodigo} externos={externos} onSelecionar={onSelecionar} />
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
          <h4 id="h-prereq" className="text-sm font-semibold">Pré-requisitos diretos, como no catálogo</h4>
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
              <h4 id="h-destrava" className="text-sm font-semibold">Destrava no catálogo todo</h4>
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

const nomeDe = (c: string, porCodigo: Map<string, DisciplinaArvore>, externos: DadosGrafo["externos"]) => porCodigo.get(c)?.nome ?? externos[c]?.nome ?? null;

function Item({ c, prof, g, porCodigo, externos, onSelecionar }: { c: string; prof: number; g: Grafo; porCodigo: Map<string, DisciplinaArvore>; externos: DadosGrafo["externos"]; onSelecionar: (c: string) => void }) {
  const dc = porCodigo.get(c);
  const estado: EstadoDisciplina = dc?.estado ?? externos[c]?.marca ?? "faltando";
  const nome = nomeDe(c, porCodigo, externos);
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {dc ? (
        <button type="button" onClick={() => onSelecionar(c)} className="rounded border px-1.5 py-0.5 font-mono text-xs tabular underline-offset-2 hover:bg-accent">{c}<span className="sr-only"> (destacar)</span></button>
      ) : (
        <Link href={`/disciplina/${c}`} className="rounded border border-dashed px-1.5 py-0.5 font-mono text-xs tabular">{c}</Link>
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
      <h4 id="h-rel" className="text-sm font-semibold">Pré-requisitos e o que {d.codigo} libera</h4>
      {nada && <p>Sem pré-requisitos e não libera outras disciplinas.</p>}
      {d.prereqDesconhecido && <AvisoBadge nivel="naoverificado" rotulo="Pré-requisito não verificado" />}
      {d.estado === "travada" && falta > 0 && (
        <p className="rounded-lg border border-travada-borda bg-travada-bg p-2 font-medium text-travada">
          Faltam {falta} para poder cursar: {d.faltamPrereq.join(", ")}.
          {naCadeia > falta && <span className="block text-xs font-normal">Somando toda a cadeia (todas as alternativas), {plural(naCadeia, "disciplina ainda não feita", "disciplinas ainda não feitas")}.</span>}
        </p>
      )}
      {d.estado !== "travada" && !d.prereqDesconhecido && antes.length > 0 && (d.estado === "faltando" || d.estado === "planejada") && <p className="text-muted-foreground">Pré-requisitos cumpridos ou em andamento: você já pode cursar.</p>}
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
          <p className="text-xs text-muted-foreground">Só disciplinas do seu currículo; a seção Destrava no catálogo todo, abaixo, inclui outros cursos.</p>
        </div>
      )}
    </section>
  );
}
