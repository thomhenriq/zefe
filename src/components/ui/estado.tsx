import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  Clock,
  HelpCircle,
  Lock,
  OctagonX,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EstadoDisciplina = "cursada" | "cursando" | "planejada" | "faltando" | "travada";
export type NivelAviso = "conflito" | "aviso" | "previsao" | "naoverificado";

type Meta = { rotulo: string; Icone: LucideIcon; tracejado?: boolean };

/** Cor (token com mesmo nome) + ícone + rótulo: estado nunca é só cor. */
export const estados: Record<EstadoDisciplina, Meta> = {
  cursada: { rotulo: "Cursada", Icone: CheckCircle2 },
  cursando: { rotulo: "Cursando", Icone: Clock },
  planejada: { rotulo: "Planejada", Icone: CalendarCheck },
  faltando: { rotulo: "Faltando", Icone: CircleDashed },
  travada: { rotulo: "Travada", Icone: Lock },
};

export const avisos: Record<NivelAviso, Meta> = {
  conflito: { rotulo: "Conflito", Icone: OctagonX },
  aviso: { rotulo: "Aviso", Icone: AlertTriangle },
  previsao: { rotulo: "Previsão", Icone: Telescope, tracejado: true },
  naoverificado: { rotulo: "Não verificado", Icone: HelpCircle, tracejado: true },
};

// Classes literais para o Tailwind enxergar cada token
const cores: Record<EstadoDisciplina | NivelAviso, string> = {
  cursada: "text-cursada bg-cursada-bg border-cursada-borda",
  cursando: "text-cursando bg-cursando-bg border-cursando-borda",
  planejada: "text-planejada bg-planejada-bg border-planejada-borda",
  faltando: "text-faltando bg-faltando-bg border-faltando-borda",
  travada: "text-travada bg-travada-bg border-travada-borda",
  conflito: "text-conflito bg-conflito-bg border-conflito-borda",
  aviso: "text-aviso bg-aviso-bg border-aviso-borda",
  previsao: "text-previsao bg-previsao-bg border-previsao-borda",
  naoverificado: "text-naoverificado bg-naoverificado-bg border-naoverificado-borda",
};

type Props = { className?: string; rotulo?: string; compacto?: boolean };

function Selo({ chave, meta, className, rotulo, compacto }: Props & { chave: keyof typeof cores; meta: Meta }) {
  const { Icone } = meta;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.tracejado && "border-dashed",
        cores[chave],
        className,
      )}
      data-estado={chave}
    >
      <Icone className="size-3.5 shrink-0" aria-hidden />
      {compacto ? <span className="sr-only">{rotulo ?? meta.rotulo}</span> : (rotulo ?? meta.rotulo)}
    </span>
  );
}

export function EstadoBadge({ estado, ...p }: Props & { estado: EstadoDisciplina }) {
  return <Selo chave={estado} meta={estados[estado]} {...p} />;
}

export function AvisoBadge({ nivel, ...p }: Props & { nivel: NivelAviso }) {
  return <Selo chave={nivel} meta={avisos[nivel]} {...p} />;
}

/** Classes de cor de um estado/aviso, para cartões da árvore e blocos da grade. */
export const corDe = (k: EstadoDisciplina | NivelAviso) => cores[k];
