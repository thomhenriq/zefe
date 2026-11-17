"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";

type Estado = { erro: string } | null;

/** Formulário ligado a uma server action; o erro (pt-BR) aparece embaixo, no lugar. */
export function FormAcao({ acao, className, children }: { acao: (p: Estado, fd: FormData) => Promise<Estado>; className?: string; children: React.ReactNode }) {
  const [estado, enviar, pendente] = useActionState(acao, null);
  return (
    <form action={enviar} className={className} aria-busy={pendente}>
      <fieldset disabled={pendente} className={cn("contents")}>{children}</fieldset>
      {estado?.erro ? <p role="alert" className="basis-full text-sm text-conflito">{estado.erro}</p> : null}
    </form>
  );
}
