"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Crosshair } from "lucide-react";
import { construirGrafo, relacionadas } from "@/dominio/grafo";
import { cn } from "@/lib/utils";
import { foraDoTrecho, nos, prereqDoTrecho, type NoArvore } from "./dados";

const grafo = construirGrafo(nos.map((n) => n.codigo), prereqDoTrecho);
const porCodigo = new Map(nos.map((n) => [n.codigo, n]));
const arestas = grafo.arestas.filter((a) => porCodigo.has(a.de) && porCodigo.has(a.para));

const LARG = 14; // % da largura do quadro
const PASSO = 17.2;
const direita = (n: NoArvore) => n.col * PASSO + LARG;
const esquerda = (n: NoArvore) => n.col * PASSO;
const curva = (de: NoArvore, para: NoArvore) => {
  const [x1, y1, x2, y2] = [direita(de), de.y, esquerda(para), para.y];
  const d = (x2 - x1) / 2;
  return `M${x1} ${y1} C${x1 + d} ${y1} ${x2 - d} ${y2} ${x2} ${y2}`;
};
const nome = (c: string) => porCodigo.get(c)?.nome ?? c;
const semestres = [1, 2, 3, 4, 5, 6];

export function ArvoreAcende() {
  const [fixo, setFixo] = useState<string | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const ativo = previa ?? fixo;
  const rel = ativo ? relacionadas(grafo, ativo) : null;
  const papel = (c: string) =>
    !rel ? null : c === ativo ? "foco" : rel.ancestrais.has(c) ? "antes" : rel.descendentes.has(c) ? "depois" : "apagado";

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFixo(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const botao = (n: NoArvore, extra: string, conteudo: React.ReactNode) => {
    const p = papel(n.codigo);
    return (
      <button
        key={n.codigo}
        type="button"
        aria-pressed={fixo === n.codigo}
        onClick={() => setFixo(fixo === n.codigo ? null : n.codigo)}
        onMouseEnter={() => setPrevia(n.codigo)}
        onMouseLeave={() => setPrevia(null)}
        onFocus={() => setPrevia(n.codigo)}
        onBlur={() => setPrevia(null)}
        className={cn(
          "rounded-lg border bg-card px-2 py-1.5 text-left transition-[opacity,box-shadow,border-color,background-color] duration-200",
          p === "apagado" && "border-transparent bg-muted/60 text-muted-foreground",
          p === "foco" && "border-primary bg-accent ring-2 ring-primary",
          p === "antes" && "border-foreground ring-1 ring-foreground",
          p === "depois" && "border-primary ring-1 ring-primary",
          extra,
        )}
      >
        {conteudo}
      </button>
    );
  };

  const diretos = (c: string, mapa: Map<string, string[]>) => (mapa.get(c) ?? []).filter((x) => porCodigo.has(x));
  const pede = ativo ? diretos(ativo, grafo.pais) : [];
  const libera = ativo ? diretos(ativo, grafo.filhos) : [];

  return (
    <div className="min-w-0 space-y-4">
      <p className="font-mono text-xs text-muted-foreground md:text-right">trecho real · Sistemas de Informação · catálogo 2026</p>
      {/* Quadro: a partir de md */}
      <div
        className="relative hidden h-[26rem] md:block"
        onClick={(e) => e.target === e.currentTarget && setFixo(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          {arestas.map((a) => (
            <path
              key={`${a.de}-${a.para}`}
              d={curva(porCodigo.get(a.de)!, porCodigo.get(a.para)!)}
              fill="none"
              vectorEffect="non-scaling-stroke"
              className={cn("stroke-muted-foreground/45 transition-opacity", rel && "opacity-30")}
              strokeWidth={1.25}
            />
          ))}
          {rel?.arestas
            .filter((a) => porCodigo.has(a.de) && porCodigo.has(a.para))
            .map((a) => (
              <path
                key={`${ativo}-${a.de}-${a.para}`}
                d={curva(porCodigo.get(a.de)!, porCodigo.get(a.para)!)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={2.25}
                strokeLinecap="round"
                className={cn("arv-extra", a.lado === "antes" ? "stroke-foreground" : "stroke-primary", a.tipo === "ou" && "opacity-70")}
                style={{ "--ordem": a.ordem } as React.CSSProperties}
              />
            ))}
        </svg>
        {nos.map((n) =>
          botao(
            n,
            "w-full",
            <>
              <span className="block font-mono text-xs font-semibold">{n.codigo}</span>
              <span className="block text-xs leading-tight text-muted-foreground">{n.nome}</span>
            </>,
          ),
        ).map((el, i) => (
          <div
            key={nos[i].codigo}
            className="absolute -translate-y-1/2"
            style={{ left: `${esquerda(nos[i])}%`, top: `${nos[i].y}%`, width: `${LARG}%` }}
          >
            {el}
          </div>
        ))}
      </div>

      {/* Lista: abaixo de md, com a mesma iluminação e sem linhas */}
      <div className="space-y-4 md:hidden">
        {semestres.map((s) => (
          <section key={s} aria-label={`${s}º semestre`}>
            <h3 className="mb-1.5 font-heading text-lg font-extrabold tracking-[-0.02em]">{s}º semestre</h3>
            <ul className="grid gap-1.5">
              {nos
                .filter((n) => n.semestre === s)
                .map((n) => {
                  const p = papel(n.codigo);
                  return (
                    <li key={n.codigo}>
                      {botao(
                        n,
                        "flex w-full items-center gap-2",
                        <>
                          <span className="font-mono text-xs font-semibold">{n.codigo}</span>
                          <span className="min-w-0 flex-1 text-sm">{n.nome}</span>
                          {p === "antes" && <span className="flex items-center gap-1 text-xs font-medium"><ArrowLeft className="size-3.5" aria-hidden />pede</span>}
                          {p === "depois" && <span className="flex items-center gap-1 text-xs font-medium text-primary"><ArrowRight className="size-3.5" aria-hidden />libera</span>}
                          {p === "foco" && <span className="flex items-center gap-1 text-xs font-medium text-primary"><Crosshair className="size-3.5" aria-hidden />escolhida</span>}
                        </>,
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>

      <p className="min-h-[3.25rem] text-sm text-muted-foreground" aria-live="polite">
        {ativo ? (
          <>
            <strong className="font-semibold text-foreground">{ativo}, {nome(ativo)}.</strong>{" "}
            {pede.length ? <>Pede {pede.join(", ")}{ativo === "SI700" ? " (SI201 pode ser feita junto)" : ""}. </> : "Não pede nada no trecho. "}
            {libera.length ? <>Libera {libera.join(", ")}.</> : "Não libera nada neste trecho."}
            {foraDoTrecho[ativo] && <> No catálogo: {foraDoTrecho[ativo]}.</>}
          </>
        ) : (
          "Passe o mouse, toque ou use Tab em uma disciplina. Esc limpa a escolha."
        )}
      </p>
    </div>
  );
}
