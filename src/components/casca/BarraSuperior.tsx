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

/** `leve`: variante da apresentação (sem painel): só Sobre + Entrar. */
export function BarraSuperior({ leve = false }: { leve?: boolean }) {
  const caminho = usePathname();
  const router = useRouter();
  const { data: sessao, isPending } = authClient.useSession();
  const itens = leve ? [itemSobre] : [...itensNav, itemSobre];
  return (
    <header className="sticky top-0 z-40 h-barra border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-full max-w-[90rem] items-center gap-4 px-4 lg:px-6">
        <Logo />
        <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 lg:flex">
          {itens.map(({ href, rotulo }) => {
            const ativo = caminho === href || caminho.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  ativo && "bg-accent text-accent-foreground",
                )}
              >
                {rotulo}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!leve && <Busca className="hidden w-80 md:block" />}
          {!leve && (
            <Link
              href="/busca"
              aria-label="Buscar"
              className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted md:hidden"
            >
              <Search className="size-5" aria-hidden />
            </Link>
          )}
          {sessao ? (
            <Button
              variant="outline"
              size="lg"
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
              <Button render={<Link href="/entrar" />} nativeButton={false} size="lg">
                Entrar
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
