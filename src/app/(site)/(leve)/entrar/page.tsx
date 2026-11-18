import { redirect } from "next/navigation";
import { getUsuario } from "@/sessao";
import { FormEntrar } from "./FormEntrar";

export const metadata = { title: "Entrar" };

export default async function Entrar() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 lg:py-16">
      <div className="rounded-3xl border bg-card p-6 sm:p-12">
      <h1 className="text-ds-h2">Entrar</h1>
      <p className="mt-3 text-muted-foreground">
        Digite seu e-mail e enviamos um código de 6 dígitos. Sem senha para lembrar.
      </p>
      <FormEntrar />
      </div>
    </div>
  );
}
