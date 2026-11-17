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

const tinta = "var(--capi-tinta)";

/** Zefe, a capivara, de perfil: corpo de barril, focinho longo e rombudo. Cores vêm dos tokens --capi*. */
export function Mascote({ estado = "parado", tamanho = 160, className, decorativo }: Props) {
  const feliz = estado === "feliz";
  const pensando = estado === "pensando";
  const dx = pensando ? 1.4 : 0;
  const dy = pensando ? -1.8 : 0;
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
      {/* patas */}
      <rect x="26" y="126" width="18" height="22" rx="7" fill="var(--capi-escuro)" />
      <rect x="78" y="126" width="18" height="22" rx="7" fill="var(--capi-escuro)" />
      {/* corpo de barril */}
      <ellipse cx="62" cy="108" rx="56" ry="34" fill="var(--capi)" />
      {/* cabeça com focinho longo e rombudo */}
      <rect x="64" y="38" width="92" height="62" rx="24" fill="var(--capi)" />
      <rect x="108" y="58" width="48" height="42" rx="16" fill="var(--capi-claro)" />
      {/* nariz: ponta escura do focinho */}
      <rect x="143" y="56" width="13" height="26" rx="6.5" fill={tinta} />
      {/* orelha pequena, alta */}
      <circle cx="84" cy="42" r="9" fill="var(--capi-escuro)" />
      <circle cx="84" cy="43" r="4" fill="var(--capi)" opacity="0.6" />
      {/* olho pequeno, alto */}
      <g className="zefe-olhos">
        {feliz ? (
          <path d="M101 58 q6 -8 12 0" stroke={tinta} strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : (
          <>
            <circle cx="107" cy="57" r="5.2" fill={tinta} />
            <circle cx={108.7 + dx} cy={55.4 + dy} r="1.8" fill="var(--capi-brilho)" />
          </>
        )}
      </g>
      {pensando && <path d="M99 44 q8 -6 17 -2" stroke={tinta} strokeWidth="3.5" strokeLinecap="round" fill="none" />}
      {feliz && <ellipse cx="122" cy="79" rx="7" ry="4.5" fill="var(--capi-bochecha)" opacity="0.5" />}
      {/* boca */}
      {feliz ? (
        <path d="M114 92 q14 12 28 -1" stroke={tinta} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      ) : pensando ? (
        <path d="M118 93 h22" stroke={tinta} strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M116 92 q12 7 26 0" stroke={tinta} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {pensando && (
        <g fill="var(--capi-escuro)">
          <circle className="zefe-ponto" cx="112" cy="20" r="4" />
          <circle className="zefe-ponto" cx="126" cy="14" r="4" />
          <circle className="zefe-ponto" cx="140" cy="8" r="4" />
        </g>
      )}
    </svg>
  );
}
