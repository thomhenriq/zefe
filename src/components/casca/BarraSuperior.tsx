"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/auth-client";
import { cn } from "@/lib/utils";
import { Busca } from "./Busca";
import { Logo } from "./Logo";
import { itemSobre, itensNav } from "./itens";

/** `leve`: variante da apresentação (sem painel): mesma navegação, CTA "Entrar com e-mail". */
export function BarraSuperior({ leve = false }: { leve?: boolean }) {
  const caminho = usePathname();
  const router = useRouter();
  const { data: sessao, isPending } = authClient.useSession();
  const itens = [...itensNav, itemSobre];
  return (
    // Pílula flutuante (mesma da landing): o header é só o espaço sticky; o fundo é o gelo da página
    <header className="sticky top-0 z-40 h-barra px-4 pt-3 lg:px-6">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 rounded-full border bg-card/85 pr-2 pl-4 shadow-elevada backdrop-blur-md">
        <Logo />
        <nav aria-label="Principal" className="ml-2 hidden items-center gap-1 lg:flex">
          {itens.map(({ href, rotulo }) => {
            const ativo = caminho === href || caminho.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  ativo && "bg-accent text-accent-foreground",
                )}
              >
                {rotulo}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Busca className="hidden w-72 md:block" />
          <Link
            href="/busca"
            aria-label="Buscar"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted md:hidden"
          >
            <Search className="size-5" aria-hidden />
          </Link>
          {sessao ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await authClient.signOut();
                router.push("/");
                router.refresh();
              }}
            >
              Sair
            </Button>
          ) : (
            !isPending && (
              <Button render={<Link href="/entrar" />} nativeButton={false} size="sm">
                {leve ? "Entrar com e-mail" : "Entrar"}
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
