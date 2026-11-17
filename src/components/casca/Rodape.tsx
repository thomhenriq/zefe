import Link from "next/link";

export function Rodape() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-8 text-sm text-muted-foreground lg:flex-row lg:items-start lg:justify-between lg:px-6">
        <p className="max-w-[60ch]">
          <strong className="font-semibold text-foreground">O Zefe não é oficial.</strong> É um projeto independente,
          sem vínculo com a Unicamp nem com a DAC. Os dados vêm de páginas públicas da DAC e podem ter diferenças em
          relação ao sistema oficial: confira sempre antes de se matricular.
        </p>
        <nav aria-label="Rodapé" className="flex gap-4">
          <Link href="/sobre" className="underline-offset-4 hover:text-foreground hover:underline">
            Sobre
          </Link>
          <Link href="/entrar" className="underline-offset-4 hover:text-foreground hover:underline">
            Entrar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
