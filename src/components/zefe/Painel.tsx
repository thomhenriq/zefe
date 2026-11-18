"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Conversa } from "./Conversa";
import { Mascote } from "./Mascote";
import type { ZefeChat } from "./useZefe";

export type AcessoZefe = "entrar" | "liberado" | "embreve";

function Aviso({ titulo, texto, acao }: { titulo: string; texto: string; acao?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Mascote estado="parado" tamanho={160} />
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">{titulo}</h2>
        <p className="mx-auto max-w-[28ch] text-sm text-muted-foreground">{texto}</p>
      </div>
      {acao}
    </div>
  );
}

/** Conteúdo do painel do Zefe. A casca cuida de posição, recolher e gaveta. */
export function Painel({ acesso, zefe }: { acesso: AcessoZefe; zefe: ZefeChat }) {
  if (acesso === "liberado") return <Conversa zefe={zefe} />;
  if (acesso === "entrar") {
    return (
      <Aviso
        titulo="Zefe"
        texto="Entre para conversar com o assistente. Enquanto isso, todas as telas funcionam sem ele."
        acao={<Button render={<Link href="/entrar" />} nativeButton={false}>Entrar</Button>}
      />
    );
  }
  return (
    <Aviso
      titulo="Zefe"
      texto="O assistente chega em breve. Enquanto isso, todas as telas já funcionam sem ele."
      acao={<span className="rounded-full border border-dashed border-previsao-borda bg-previsao-bg px-3 py-1 text-xs font-medium text-previsao">Em breve</span>}
    />
  );
}
