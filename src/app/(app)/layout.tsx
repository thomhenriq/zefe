import { cookies } from "next/headers";
import { Casca } from "@/components/casca/Casca";
import { getUsuario } from "@/sessao";
import { emailLiberado } from "@/zefe/liberados";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const u = await getUsuario();
  // A lista de liberados é lida aqui, no servidor; só o resultado (3 valores) vai ao cliente.
  const acesso = !u ? "entrar" : emailLiberado(u.email) ? "liberado" : "embreve";
  const painel = (await cookies()).get("zefe-painel")?.value;
  return <Casca acesso={acesso} painelInicial={painel === "aberto" ? true : painel === "fechado" ? false : null}>{children}</Casca>;
}
