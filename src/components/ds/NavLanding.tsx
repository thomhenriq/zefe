import Link from "next/link";
import { Mascote } from "@/components/zefe/Mascote";
import { cn } from "@/lib/utils";
import { Pilula, pilula } from "./Pilula";

const itens = [
  { href: "/planejador", rotulo: "Planejador" },
  { href: "/arvore", rotulo: "Árvore" },
  { href: "/busca", rotulo: "Busca" },
  { href: "/sobre", rotulo: "Sobre" },
];

/** Nav flutuante em pílula: branca a ~80%, borda 1px, afastada das bordas da janela. Abaixo de lg, "Menu" abre uma folha arredondada (details nativo, sem JS). */
export function NavLanding() {
  return (
    <header className="sticky top-0 z-40 pt-4">
      <div className="ds-container">
        <div className="relative flex h-16 items-center gap-2 rounded-full border border-ds-line bg-ds-surface/80 pr-2 pl-4 shadow-ds-frame backdrop-blur-md md:pl-6">
          <Link href="/" className="flex items-center gap-2 rounded-full text-ds-h3 font-bold text-ds-ink">
            <Mascote tamanho={32} decorativo className="size-8" />
            Zefe
          </Link>
          <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
            {itens.map((i) => (
              <Link key={i.href} href={i.href} className="rounded-full px-4 py-2 text-ds-body font-medium text-ds-body transition-colors duration-300 ease-ds hover:bg-ds-bg hover:text-ds-ink">
                {i.rotulo}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <details className="group lg:hidden">
              <summary className={cn(pilula.base, pilula.fantasma, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>Menu</summary>
              <div className="absolute top-full right-0 left-0 mt-2 rounded-ds-card border border-ds-line bg-ds-surface p-2 shadow-ds-frame">
                <nav aria-label="Menu" className="flex flex-col">
                  {itens.map((i) => (
                    <Link key={i.href} href={i.href} className="rounded-full px-4 py-3 text-ds-body font-medium text-ds-ink transition-colors duration-300 ease-ds hover:bg-ds-bg">
                      {i.rotulo}
                    </Link>
                  ))}
                </nav>
              </div>
            </details>
            <Pilula href="/entrar" variante="fantasma" className="hidden lg:inline-flex">Entrar</Pilula>
            <Pilula href="/entrar" className="px-5 md:px-6">
              <span className="md:hidden">Entrar</span>
              <span className="hidden md:inline">Entrar com e-mail</span>
            </Pilula>
          </div>
        </div>
      </div>
    </header>
  );
}
