"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mascote } from "@/components/zefe/Mascote";
import { Painel, type AcessoZefe } from "@/components/zefe/Painel";
import { useZefe } from "@/components/zefe/useZefe";
import { cn } from "@/lib/utils";
import { BarraSuperior } from "./BarraSuperior";
import { itensNav } from "./itens";
import { Rodape } from "./Rodape";

/**
 * Casca completa: barra superior, conteúdo, rodapé, painel do Zefe fixo à
 * direita (lg+, recolhível) e navegação inferior com gaveta do Zefe no celular.
 */
export function Casca({ children, acesso }: { children: React.ReactNode; acesso: AcessoZefe }) {
  const zefe = useZefe(acesso === "liberado");
  // null = ainda não escolheu: aberto só a partir de xl (80rem), recolhido entre lg e xl, decidido por CSS (sem piscar).
  // shortcut: a escolha não persiste entre visitas, quando houver conta guardar no perfil.
  const [escolha, setAberto] = useState<boolean | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const caminho = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
          <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Rodape />
        </div>

        <aside
          aria-label="Zefe, o assistente"
          className={cn(
            "sticky top-barra hidden h-[calc(100dvh-var(--altura-barra))] shrink-0 border-l bg-painel lg:block",
            escolha === null ? "w-14 xl:w-painel" : escolha ? "w-painel" : "w-14",
          )}
        >
          <div className={cn("relative h-full", escolha === null ? "hidden xl:block" : !escolha && "hidden")}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                aria-expanded
                aria-label="Recolher painel do Zefe"
                onClick={() => setAberto(false)}
              >
                <PanelRightClose />
              </Button>
              <Painel acesso={acesso} zefe={zefe} />
          </div>
          <button
              type="button"
              aria-expanded={false}
              aria-label="Abrir painel do Zefe"
              onClick={() => setAberto(true)}
              className={cn("h-full w-full flex-col items-center gap-2 pt-4 hover:bg-muted", escolha === null ? "flex xl:hidden" : escolha ? "hidden" : "flex")}
            >
              <Mascote estado={zefe.estado} tamanho={36} decorativo />
              <span className="text-xs font-medium [writing-mode:vertical-rl]">Zefe</span>
            </button>
        </aside>
      </div>

      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t bg-background/95 backdrop-blur lg:hidden"
      >
        {itensNav.map(({ href, rotulo, Icone }) => {
          const ativo = caminho === href || caminho.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground",
                ativo && "text-primary",
              )}
            >
              <Icone className="size-5" aria-hidden />
              {rotulo}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setGaveta(true)}
          aria-haspopup="dialog"
          aria-expanded={gaveta}
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground"
        >
          <Mascote estado={zefe.estado} tamanho={24} decorativo />
          Zefe
        </button>
      </nav>

      <Sheet open={gaveta} onOpenChange={setGaveta}>
        <SheetContent side="bottom" className="h-[70dvh] rounded-t-2xl bg-painel lg:hidden">
          <SheetTitle className="sr-only">Zefe, o assistente</SheetTitle>
          <SheetDescription className="sr-only">Painel do assistente</SheetDescription>
          <Painel acesso={acesso} zefe={zefe} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
