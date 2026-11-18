import Link from "next/link";
import { CascaLeve } from "@/components/casca/CascaLeve";
import { Pagina } from "@/components/consulta";
import { Button } from "@/components/ui/button";
import { Mascote } from "@/components/zefe/Mascote";

export const metadata = { title: "Página não encontrada" };

/** 404 da raiz (rotas que não existem), dentro da casca leve; o (app)/not-found.tsx cobre disciplina/professor/sala. */
export default function NaoAchou() {
  return (
    <CascaLeve>
      <Pagina>
        <div className="flex max-w-2xl flex-col items-start gap-6 py-8 sm:flex-row sm:items-center">
          <Mascote estado="pensando" tamanho={120} decorativo />
          <div className="space-y-4">
            <h1 className="text-ds-h2">Essa página não existe</h1>
            <p className="max-w-[52ch] text-muted-foreground">
              O endereço pode ter mudado ou ter um erro de digitação. Volte ao início ou procure uma disciplina, professor ou sala.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/" />} nativeButton={false}>Ir para o início</Button>
              <Button render={<Link href="/busca" />} nativeButton={false} variant="outline">Ir para a busca</Button>
            </div>
          </div>
        </div>
      </Pagina>
    </CascaLeve>
  );
}
