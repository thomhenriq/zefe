import Image from "next/image";
import { cn } from "@/lib/utils";

export type EstadoMascote = "parado" | "pensando" | "feliz";

type Props = {
  estado?: EstadoMascote;
  /** Lado em px. */
  tamanho?: number;
  className?: string;
  /** true quando o nome "Zefe" já aparece em texto ao lado. */
  decorativo?: boolean;
};

export function Mascote({ estado = "parado", tamanho = 160, className, decorativo }: Props) {
  return (
    <Image
      src="/mascote-zefe.png"
      alt={decorativo ? "" : `Zefe, a capivara (${estado})`}
      width={tamanho}
      height={tamanho}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden={decorativo ? true : undefined}
      data-estado={estado}
    />
  );
}
