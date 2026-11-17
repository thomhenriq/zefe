import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPerfil, type Perfil } from "@/dados/aluno";

export type Usuario = { id: string; email: string };

/** Sessão atual ou null (não redireciona). Só no servidor. */
export async function getUsuario(): Promise<Usuario | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  return s ? { id: s.user.id, email: s.user.email } : null;
}

/** Sem sessão vai para /entrar. Para o próprio /comecar, que ainda não tem perfil. */
export async function exigirSessao(): Promise<Usuario> {
  const u = await getUsuario();
  if (!u) redirect("/entrar");
  return u;
}

/** Páginas e rotas protegidas: sem sessão -> /entrar; sem perfil -> /comecar. */
export async function exigirUsuario(): Promise<Usuario & { perfil: Perfil }> {
  const u = await exigirSessao();
  const perfil = await getPerfil(u.id);
  if (!perfil) redirect("/comecar");
  return { ...u, perfil };
}
