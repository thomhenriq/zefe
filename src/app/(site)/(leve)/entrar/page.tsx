import { redirect } from "next/navigation";
import { getUsuario } from "@/sessao";
import { FormEntrar } from "./FormEntrar";

export const metadata = { title: "Entrar" };

export default async function Entrar() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 lg:py-20">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">Entrar</h1>
      <p className="mt-3 text-muted-foreground">
        Digite seu e-mail e enviamos um código de 6 dígitos. Sem senha para lembrar.
      </p>
      <FormEntrar />
    </div>
  );
}
