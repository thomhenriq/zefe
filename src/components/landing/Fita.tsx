"use client";

import { corDe, estados, type EstadoDisciplina } from "@/components/ui/estado";
import { Mascote } from "@/components/zefe/Mascote";
import { cn } from "@/lib/utils";
import { fita, type Chip } from "./dados";
import { useHero } from "./Hero";

const legenda: EstadoDisciplina[] = ["cursada", "cursando", "planejada", "faltando", "travada"];

function ChipDisc({ chip, estado }: { chip: Chip; estado: EstadoDisciplina }) {
  const { Icone, rotulo } = estados[estado];
  return (
    <li
      title={`${chip.codigo}, ${chip.nome}: ${rotulo.toLowerCase()}`}
      className={cn(
        "flex items-center gap-1 rounded-lg border px-1.5 py-1 font-mono text-xs leading-none font-medium transition-colors duration-300",
        corDe(estado),
      )}
    >
      <Icone className="size-3.5 shrink-0" aria-hidden />
      <span>{chip.codigo}</span>
      <span className="sr-only">: {rotulo}</span>
    </li>
  );
}

/** A graduação numa régua horizontal: uma coluna por semestre, chips por estado. Estados são ilustrativos. */
export function Fita() {
  const hero = useHero();
  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-col gap-2 pb-3 lg:h-[4.75rem] lg:flex-row lg:items-start lg:justify-end lg:pb-0">
        <p className="font-mono text-xs text-muted-foreground lg:text-right">
          <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-foreground">exemplo</span>{" "}
          Sistemas de Informação · catálogo 2026. Os estados são ilustrativos.
        </p>
      </figcaption>
      <ol className="border-foreground lg:grid lg:grid-cols-7 lg:border-t-2" aria-label="Semestres sugeridos do curso, do 1º ao 8º">
        {fita.map((col, i) => (
          <li
            key={col.rotulo}
            style={{ animationDelay: `${0.25 + i * 0.07}s` }}
            className={cn(
              "anim-subir relative flex gap-3 border-t border-foreground py-3 first:border-t-2 lg:first:border-t-0 lg:block lg:border-t-0 lg:border-l-2 lg:px-2.5 lg:py-3",
              col.atual && "pb-[4.5rem] lg:pb-3",
            )}
          >
            <div className="w-16 shrink-0 lg:w-auto">
              <h3 className="font-heading text-2xl leading-none font-extrabold tracking-[-0.03em] lg:text-[1.75rem]">
                {col.rotulo}
              </h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground tabular">
                {col.creditos} cr
                {col.proximo && (
                  <span className="mt-1.5 block w-fit rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground">
                    próximo
                  </span>
                )}
              </p>
            </div>
            <ul className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5 lg:mt-2.5 lg:grid lg:grid-cols-2">
              {col.chips.map((chip, k) => (
                <ChipDisc
                  key={chip.codigo}
                  chip={chip}
                  // no 4º semestre o Zefe "arruma" os chips: faltando até a vez de cada um
                  estado={col.proximo && k >= hero.arrumados ? "faltando" : chip.estado}
                />
              ))}
              {col.eletivos && (
                <li className="rounded-lg border border-dashed border-border px-1.5 py-1 font-mono text-xs leading-none text-muted-foreground lg:col-span-2">
                  +{col.eletivos} cr eletivos
                </li>
              )}
            </ul>
            {col.atual && (
              <div className="pointer-events-none absolute bottom-2 left-[4.75rem] flex w-max items-center gap-2 lg:inset-x-0 lg:bottom-full lg:left-2.5 lg:items-end lg:pb-0">
                <Mascote estado={hero.humor} tamanho={72} decorativo className="size-12 lg:size-[4.5rem]" />
                <p className="rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold shadow-suave lg:mb-2 lg:rounded-2xl lg:py-2 lg:text-sm">
                  Você está aqui.
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Legenda">
        {legenda.map((e) => {
          const { Icone, rotulo } = estados[e];
          return (
            <li key={e} className="flex items-center gap-1.5">
              <span className={cn("inline-flex size-5 items-center justify-center rounded-md border", corDe(e))}>
                <Icone className="size-3.5" aria-hidden />
              </span>
              {rotulo}
            </li>
          );
        })}
        <li className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-7 items-center justify-center rounded-md border border-dashed border-border font-mono text-xs">+N</span>
          créditos eletivos
        </li>
      </ul>
    </figure>
  );
}
