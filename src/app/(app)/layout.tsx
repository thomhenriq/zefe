import { Casca } from "@/components/casca/Casca";
import { getUsuario } from "@/sessao";
import { emailLiberado } from "@/zefe/liberados";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const u = await getUsuario();
  // A lista de liberados é lida aqui, no servidor; só o resultado (3 valores) vai ao cliente.
  const acesso = !u ? "entrar" : emailLiberado(u.email) ? "liberado" : "embreve";
  return <Casca acesso={acesso}>{children}</Casca>;
}
