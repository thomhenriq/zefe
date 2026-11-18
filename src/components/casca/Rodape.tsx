"use client";

import Link from "next/link";
import { authClient } from "@/auth-client";
import { itensNav } from "./itens";

export function Rodape() {
  const { data: sessao, isPending } = authClient.useSession();
  return (
    <footer className="px-4 pb-4 lg:px-6">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-4 rounded-3xl border bg-card p-6 text-sm text-muted-foreground lg:flex-row lg:items-start lg:justify-between">
        <p className="max-w-[60ch]">
          <strong className="font-bold text-foreground">O Zefe não é oficial.</strong> É um projeto independente,
          sem vínculo com a Unicamp nem com a DAC. Os dados vêm de páginas públicas da DAC e podem ter diferenças em
          relação ao sistema oficial: confira sempre antes de se matricular.
        </p>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-4 gap-y-1">
          {itensNav.map(({ href, rotulo }) => (
            <Link key={href} href={href} className="-my-2 py-2 underline-offset-4 hover:text-foreground hover:underline">
              {rotulo}
            </Link>
          ))}
          <Link href="/sobre" className="-my-2 py-2 underline-offset-4 hover:text-foreground hover:underline">
            Sobre
          </Link>
          {!sessao && !isPending && (
            <Link href="/entrar" className="-my-2 py-2 underline-offset-4 hover:text-foreground hover:underline">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
