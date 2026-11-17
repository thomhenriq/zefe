import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const mono = "font-mono tabular-nums";

export function Pagina({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 lg:px-6">{children}</div>;
}

export function NaoEncontrei({ o, dica }: { o: string; dica?: string }) {
  return (
    <Pagina>
      <div className="max-w-xl space-y-4 rounded-xl border bg-card p-6">
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-3xl">Não encontrei {o}</h1>
        <p className="text-muted-foreground">{dica ?? "Confira o que foi digitado ou tente buscar de outro jeito."}</p>
        <Button render={<Link href="/busca" />} nativeButton={false}>Ir para a busca</Button>
      </div>
    </Pagina>
  );
}
