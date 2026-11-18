"use client";

import { estados, type EstadoDisciplina } from "@/components/ui/estado";
import { Chip, Selo } from "@/components/ds/Blocos";
import { Mascote } from "@/components/zefe/Mascote";
import { fita, type Chip as ChipDados } from "./dados";
import { useHero } from "./Hero";

const legenda: EstadoDisciplina[] = ["cursada", "cursando", "planejada", "faltando", "travada"];

function ChipDisc({ chip, estado }: { chip: ChipDados; estado: EstadoDisciplina }) {
  return (
    <li title={`${chip.codigo}, ${chip.nome}: ${estados[estado].rotulo.toLowerCase()}`}>
      <Chip tom={estado} compacto className="transition-colors duration-300 ease-ds">{chip.codigo}</Chip>
    </li>
  );
}

/** A graduação numa régua: uma coluna por semestre (de lg; abaixo, linhas empilhadas), chips por estado. Estados são ilustrativos. */
export function Fita() {
  const hero = useHero();
  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-6 text-ds-small">
        <Selo>Exemplo</Selo>
        Sistemas de Informação, catálogo 2026. Os estados são ilustrativos.
      </figcaption>
      <ol className="grid gap-2 lg:grid-cols-7" aria-label="Semestres sugeridos do curso, do 1º ao 8º">
        {fita.map((col, i) => (
          <li
            key={col.rotulo}
            style={{ animationDelay: `${0.35 + i * 0.06}s` }}
            className="ds-subir flex gap-4 rounded-ds-card bg-ds-bg p-4 lg:flex-col lg:gap-3"
          >
            <div className="w-16 shrink-0 lg:w-auto">
              <h3 className="text-ds-h3">{col.rotulo}</h3>
              <p className="text-ds-caption ds-num">
                {col.creditos} cr
                {col.proximo && <span className="mt-1 block w-fit rounded-full bg-ds-amber-tint px-2 py-1 leading-none font-medium text-ds-ink">próximo</span>}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <ul className="flex flex-wrap content-start gap-1">
                {col.chips.map((chip, k) => (
                  <ChipDisc
                    key={chip.codigo}
                    chip={chip}
                    // no 4º semestre o Zefe "arruma" os chips: faltando até a vez de cada um
                    estado={col.proximo && k >= hero.arrumados ? "faltando" : chip.estado}
                  />
                ))}
                {col.eletivos && (
                  <li className="rounded-full border border-ds-line px-2 py-1 text-ds-caption leading-none ds-num">+{col.eletivos} cr eletivos</li>
                )}
              </ul>
              {col.atual && (
                <p className="mt-3 flex items-center gap-2 text-ds-caption font-medium text-ds-ink">
                  <Mascote estado={hero.humor} tamanho={40} decorativo className="size-10" />
                  Você está aqui
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <ul className="mt-6 flex flex-wrap items-center gap-2" aria-label="Legenda">
        {legenda.map((e) => (
          <li key={e}><Chip tom={e}>{estados[e].rotulo}</Chip></li>
        ))}
        <li className="text-ds-caption">+N cr: créditos eletivos</li>
      </ul>
    </figure>
  );
}
