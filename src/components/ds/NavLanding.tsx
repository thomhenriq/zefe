import Link from "next/link";
import { Mascote } from "@/components/zefe/Mascote";
import { Pilula } from "./Pilula";

const itens = [
  { href: "/planejador", rotulo: "Planejador" },
  { href: "/arvore", rotulo: "Árvore" },
  { href: "/busca", rotulo: "Busca" },
  { href: "/sobre", rotulo: "Sobre" },
];

/** Nav flutuante em pílula: branca a ~80%, borda 1px, afastada das bordas da janela. */
export function NavLanding() {
  return (
    <header className="sticky top-0 z-40 pt-4">
      <div className="ds-container">
        <div className="flex h-16 items-center gap-2 rounded-full border border-ds-line bg-ds-surface/80 pr-2 pl-5 shadow-ds-frame backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2 rounded-full text-ds-h3 font-bold tracking-[-0.03em] text-ds-ink">
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
            <Pilula href="/entrar" variante="fantasma" className="hidden md:inline-flex">Entrar</Pilula>
            <Pilula href="/entrar">Entrar com e-mail</Pilula>
          </div>
        </div>
      </div>
    </header>
  );
}
