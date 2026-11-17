import { BarraSuperior } from "./BarraSuperior";
import { Rodape } from "./Rodape";

/** Variante sem painel, para a apresentação e telas de entrada (deslogado). */
export function CascaLeve({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior leve />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Rodape />
    </div>
  );
}
