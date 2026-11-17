import { cn } from "@/lib/utils";

export type EstadoMascote = "parado" | "pensando" | "feliz";

type Props = {
  estado?: EstadoMascote;
  /** Lado em px (o desenho é quadrado). Legível de 32 a 160+. */
  tamanho?: number;
  className?: string;
  /** true quando o nome "Zefe" já aparece em texto ao lado. */
  decorativo?: boolean;
};

const tinta = "oklch(0.24 0.03 50)";

/** Zefe, a capivara: SVG em código, cores vêm dos tokens --capi*. */
export function Mascote({ estado = "parado", tamanho = 160, className, decorativo }: Props) {
  const feliz = estado === "feliz";
  const pensando = estado === "pensando";
  // Pupila olha para cima e à direita quando pensa
  const dx = pensando ? 1.6 : 0;
  const dy = pensando ? -1.6 : 0;
  return (
    <svg
      viewBox="0 0 160 160"
      width={tamanho}
      height={tamanho}
      className={cn("shrink-0", className)}
      role={decorativo ? undefined : "img"}
      aria-label={decorativo ? undefined : `Zefe, a capivara (${estado})`}
      aria-hidden={decorativo ? true : undefined}
      data-estado={estado}
    >
      {/* ombros */}
      <ellipse cx="80" cy="152" rx="56" ry="30" fill="var(--capi-escuro)" />
      {/* orelhas: pequenas e baixas, como as de capivara */}
      <ellipse cx="38" cy="46" rx="9" ry="12" transform="rotate(-20 38 46)" fill="var(--capi-escuro)" />
      <ellipse cx="122" cy="46" rx="9" ry="12" transform="rotate(20 122 46)" fill="var(--capi-escuro)" />
      {/* cabeça larga e achatada */}
      <rect x="22" y="42" width="116" height="86" rx="34" fill="var(--capi)" />
      {/* focinho quadrado */}
      <rect x="38" y="70" width="84" height="58" rx="22" fill="var(--capi-claro)" />
      {/* nariz largo e escuro */}
      <rect x="50" y="68" width="60" height="26" rx="12" fill={tinta} />
      <path d="M68 80 v5 M92 80 v5" stroke="var(--capi-claro)" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />
      {/* olhos pequenos, bem afastados */}
      <g className="zefe-olhos">
        {feliz ? (
          <>
            <path d="M40 62 q7 -8 14 0" stroke={tinta} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M106 62 q7 -8 14 0" stroke={tinta} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx="47" cy="61" r="5.5" fill={tinta} />
            <circle cx="113" cy="61" r="5.5" fill={tinta} />
            <circle cx={48.8 + dx} cy={59.2 + dy} r="1.9" fill="#fff" />
            <circle cx={114.8 + dx} cy={59.2 + dy} r="1.9" fill="#fff" />
          </>
        )}
      </g>
      {/* sobrancelha levantada ao pensar */}
      {pensando && (
        <path d="M103 49 q9 -6 18 -1" stroke={tinta} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {/* bochechas */}
      {feliz && (
        <>
          <ellipse cx="40" cy="92" rx="8" ry="5" fill="oklch(0.72 0.12 30)" opacity="0.45" />
          <ellipse cx="120" cy="92" rx="8" ry="5" fill="oklch(0.72 0.12 30)" opacity="0.45" />
        </>
      )}
      {/* boca */}
      {feliz ? (
        <path d="M66 110 q14 13 28 0" stroke={tinta} strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : pensando ? (
        <path d="M72 113 h16" stroke={tinta} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M68 110 q12 8 24 0" stroke={tinta} strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
      {/* reticências de "pensando" */}
      {pensando && (
        <g fill="var(--capi-escuro)">
          <circle className="zefe-ponto" cx="122" cy="18" r="4" />
          <circle className="zefe-ponto" cx="134" cy="12" r="4" />
          <circle className="zefe-ponto" cx="146" cy="6" r="4" />
        </g>
      )}
    </svg>
  );
}
