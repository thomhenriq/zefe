import { Mascote, type EstadoMascote } from "./Mascote";

/** Conteúdo do painel do Zefe. A casca cuida de posição, recolher e gaveta. */
export function Painel({ estado = "parado" }: { estado?: EstadoMascote }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Mascote estado={estado} tamanho={160} />
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold">Zefe</h2>
        <p className="mx-auto max-w-[26ch] text-sm text-muted-foreground">
          O assistente chega em breve. Enquanto isso, todas as telas já funcionam sem ele.
        </p>
      </div>
      <span className="rounded-full border border-previsao-borda bg-previsao-bg px-3 py-1 text-xs font-medium text-previsao">
        Em breve
      </span>
    </div>
  );
}
