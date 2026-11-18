"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { estados, type EstadoDisciplina } from "@/components/ui/estado";
import { Chip, Selo } from "@/components/ds/Blocos";
import { pilula } from "@/components/ds/Pilula";
import { Mascote } from "@/components/zefe/Mascote";
import { cn } from "@/lib/utils";
import { fita, type Chip as ChipDados } from "./dados";
import { useHero } from "./Hero";

const legenda: EstadoDisciplina[] = ["cursada", "cursando", "planejada", "faltando", "travada"];
const VISIVEIS_NO_CELULAR = 4;

function ChipDisc({ chip, estado }: { chip: ChipDados; estado: EstadoDisciplina }) {
  return (
    <li title={`${chip.codigo}, ${chip.nome}: ${estados[estado].rotulo.toLowerCase()}`}>
      <Chip tom={estado} compacto className="transition-colors duration-300 ease-ds"><span className="ds-num">{chip.codigo}</span></Chip>
    </li>
  );
}

/** A graduação numa régua: uma coluna por semestre (de lg; abaixo, linhas empilhadas, do 5º em diante recolhidas no celular), chips por estado. Estados são ilustrativos. */
export function Fita() {
  const hero = useHero();
  const [aberto, setAberto] = useState(false);
  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-6 text-ds-small">
        <Selo>Exemplo</Selo>
        Sistemas de Informação, catálogo 2026. Os estados são ilustrativos.
      </figcaption>
      <ol id="fita-semestres" className="grid gap-2 lg:grid-cols-7" aria-label="Semestres sugeridos do curso, do 1º ao 8º">
        {fita.map((col, i) => (
          <li
            key={col.rotulo}
            style={{ animationDelay: `${0.35 + i * 0.06}s` }}
            className={cn(
              "ds-subir gap-4 rounded-ds-card bg-ds-bg p-4 lg:flex lg:flex-col lg:gap-3 lg:p-3",
              i >= VISIVEIS_NO_CELULAR && !aberto ? "hidden" : "flex",
            )}
          >
            <div className="w-16 shrink-0 lg:w-auto">
              <h3 className="text-ds-h3">{col.rotulo}</h3>
              <p className="text-ds-caption">
                <span className="ds-num">{col.creditos}</span> cr
                {col.proximo && <span className="mt-1 block w-fit rounded-full bg-ds-amber-tint px-2 py-1 leading-none font-medium text-ds-ink">próximo</span>}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <ul className="flex flex-wrap content-start gap-2">
                {col.chips.map((chip, k) => (
                  <ChipDisc
                    key={chip.codigo}
                    chip={chip}
                    // no 4º semestre o Zefe "arruma" os chips: faltando até a vez de cada um
                    estado={col.proximo && k >= hero.arrumados ? "faltando" : chip.estado}
                  />
                ))}
                {col.eletivos && (
                  <li className="rounded-full border border-ds-line px-2 py-1 text-ds-small leading-none"><span className="ds-num">+{col.eletivos}</span> cr eletivos</li>
                )}
              </ul>
              {col.atual && (
                <p className="mt-3 flex items-center gap-2 text-ds-small font-medium text-ds-ink">
                  <Mascote estado={hero.humor} tamanho={40} decorativo className="size-10" />
                  Você está aqui
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="fita-semestres"
        onClick={() => setAberto(!aberto)}
        className={cn(pilula.base, pilula.secundaria, "mt-2 w-full lg:hidden")}
      >
        {aberto ? "Mostrar só os 4 primeiros" : "Ver os outros semestres"}
        <ChevronDown className={cn("size-4 transition-transform duration-300 ease-ds", aberto && "rotate-180")} aria-hidden />
      </button>
      <ul className="mt-6 flex flex-wrap items-center gap-2" aria-label="Legenda">
        {legenda.map((e) => (
          <li key={e}><Chip tom={e}>{estados[e].rotulo}</Chip></li>
        ))}
        <li className="text-ds-small"><span className="ds-num">+N</span> cr: créditos eletivos</li>
      </ul>
    </figure>
  );
}
