import { cn } from "@/lib/utils";

export type EstadoMascote = "parado" | "pensando" | "feliz";

type Props = {
  estado?: EstadoMascote;
  /** Lado em px (o desenho é quadrado). Legível de 24 a 160+. */
  tamanho?: number;
  className?: string;
  /** true quando o nome "Zefe" já aparece em texto ao lado. */
  decorativo?: boolean;
};

const tinta = "var(--capi-tinta)";

/**
 * Zefe, a capivara, de perfil olhando para a direita: cabeça grande e rombuda ligada a um corpo de barril,
 * narina no alto da ponta do focinho, orelha pequena e alta atrás, olho pequeno e alto, patas curtas.
 * Cores só dos tokens --capi*.
 */
export function Mascote({ estado = "parado", tamanho = 160, className, decorativo }: Props) {
  const feliz = estado === "feliz";
  const pensando = estado === "pensando";
  const dx = pensando ? 1.6 : 0;
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
      {/* patas do lado de lá (mais escuras) */}
      <path d="M34 112 h16 v28 q0 6 -6 6 h-8 q-6 0 -6 -6 z" fill="var(--capi-escuro)" />
      <path d="M92 112 h14 v28 q0 6 -6 6 h-6 q-6 0 -6 -6 z" fill="var(--capi-escuro)" />
      {/* silhueta: corpo de barril + cabeça rombuda numa peça só */}
      <path
        d="M22 116 C6 108 5 80 24 70 C46 60 76 62 96 54 C104 44 120 40 134 43 C148 46 155 53 155 64 L155 82 C155 92 149 97 139 97 L120 97 C112 98 108 105 106 116 C104 126 98 128 88 128 L44 128 C32 128 26 122 22 116 Z"
        fill="var(--capi)"
      />
      {/* focinho claro */}
      <path d="M155 70 L155 82 C155 92 149 97 139 97 L124 97 C128 88 136 80 146 74 Z" fill="var(--capi-claro)" opacity="0.9" />
      {/* patas do lado de cá */}
      <path d="M22 116 h22 v24 q0 6 -6 6 h-10 q-6 0 -6 -6 z" fill="var(--capi)" />
      <path d="M22 140 h22 v2 q0 4 -6 4 h-10 q-6 0 -6 -4 z" fill="var(--capi-escuro)" />
      <path d="M82 118 h20 v22 q0 6 -6 6 h-8 q-6 0 -6 -6 z" fill="var(--capi)" />
      <path d="M82 140 h20 v2 q0 4 -6 4 h-8 q-6 0 -6 -4 z" fill="var(--capi-escuro)" />
      {/* orelha pequena, alta, atrás */}
      <path d="M96 52 C94 42 100 36 107 38 C112 40 112 48 108 52 Z" fill="var(--capi-escuro)" />
      {/* narina no alto da ponta do focinho */}
      <ellipse cx="148.5" cy="57" rx="3" ry="4.2" transform="rotate(-18 148.5 57)" fill={tinta} />
      {/* olho pequeno e alto */}
      <g className="zefe-olhos">
        {feliz ? (
          <path d="M115 58 q5 -7 10 0" stroke={tinta} strokeWidth="3.6" strokeLinecap="round" fill="none" />
        ) : (
          <>
            <circle cx="120" cy="58" r="4.4" fill={tinta} />
            <circle cx={121.4 + dx} cy={56.6 + dy} r="1.4" fill="var(--capi-brilho)" />
          </>
        )}
      </g>
      {pensando && <path d="M112 47 q8 -5 16 -1" stroke={tinta} strokeWidth="3" strokeLinecap="round" fill="none" />}
      {feliz && <ellipse cx="128" cy="76" rx="6" ry="4" fill="var(--capi-bochecha)" opacity="0.55" />}
      {/* boca de perfil, ao longo do focinho */}
      {feliz ? (
        <path d="M150 88 q-8 7 -20 3" stroke={tinta} strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : pensando ? (
        <path d="M148 89 h-14" stroke={tinta} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M150 88 q-9 4 -18 2" stroke={tinta} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {pensando && (
        <g fill="var(--capi-escuro)">
          <circle className="zefe-ponto" cx="112" cy="22" r="4" />
          <circle className="zefe-ponto" cx="126" cy="15" r="4" />
          <circle className="zefe-ponto" cx="140" cy="8" r="4" />
        </g>
      )}
    </svg>
  );
}
