"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mascote } from "@/components/zefe/Mascote";
import { Painel } from "@/components/zefe/Painel";
import { cn } from "@/lib/utils";
import { BarraSuperior } from "./BarraSuperior";
import { itensNav } from "./itens";
import { Rodape } from "./Rodape";

/**
 * Casca completa: barra superior, conteúdo, rodapé, painel do Zefe fixo à
 * direita (lg+, recolhível) e navegação inferior com gaveta do Zefe no celular.
 */
export function Casca({ children }: { children: React.ReactNode }) {
  // shortcut: o recolher não persiste entre visitas, quando houver conta guardar no perfil.
  const [aberto, setAberto] = useState(true);
  const [gaveta, setGaveta] = useState(false);
  const caminho = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="conteudo" tabIndex={-1} className="flex-1 pb-20 outline-none lg:pb-0">
            {children}
          </main>
          <Rodape />
        </div>

        <aside
          aria-label="Zefe, o assistente"
          className={cn(
            "sticky top-barra hidden h-[calc(100dvh-var(--altura-barra))] shrink-0 border-l bg-painel lg:block",
            aberto ? "w-painel" : "w-14",
          )}
        >
          {aberto ? (
            <div className="relative h-full">
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
              <Painel />
            </div>
          ) : (
            <button
              type="button"
              aria-expanded={false}
              aria-label="Abrir painel do Zefe"
              onClick={() => setAberto(true)}
              className="flex h-full w-full flex-col items-center gap-2 pt-4 hover:bg-muted"
            >
              <Mascote tamanho={36} decorativo />
              <span className="text-xs font-medium [writing-mode:vertical-rl]">Zefe</span>
            </button>
          )}
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
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground"
        >
          <Mascote tamanho={24} decorativo />
          Zefe
        </button>
      </nav>

      <Sheet open={gaveta} onOpenChange={setGaveta}>
        <SheetContent side="bottom" className="h-[70dvh] rounded-t-2xl bg-painel lg:hidden">
          <SheetTitle className="sr-only">Zefe, o assistente</SheetTitle>
          <SheetDescription className="sr-only">Painel do assistente</SheetDescription>
          <Painel />
        </SheetContent>
      </Sheet>
    </div>
  );
}
