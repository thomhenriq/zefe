import Link from "next/link";

const itens = [
  { href: "/planejador", rotulo: "Planejador" },
  { href: "/arvore", rotulo: "Árvore" },
  { href: "/busca", rotulo: "Busca" },
  { href: "/sobre", rotulo: "Sobre" },
  { href: "/entrar", rotulo: "Entrar" },
];

export function RodapeLanding() {
  return (
    <footer className="ds-container flex flex-col gap-6 pt-16 pb-12 text-ds-small lg:flex-row lg:items-start lg:justify-between">
      <p className="max-w-[60ch]">
        <strong className="font-bold text-ds-ink">O Zefe não é oficial.</strong> É um projeto independente, sem vínculo com a Unicamp
        nem com a DAC. Os dados vêm de páginas públicas da DAC e podem ter diferenças em relação ao sistema oficial: confira sempre
        antes de se matricular.
      </p>
      <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-1">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className="-my-2 rounded-full py-2 text-ds-link underline-offset-4 hover:underline">
            {i.rotulo}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
