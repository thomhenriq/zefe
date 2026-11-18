import { exigirSessao } from "@/sessao";
import { getPerfil } from "@/dados/aluno";
import { listarCursos } from "@/dados/proposta";
import { FormCadastro } from "./FormCadastro";

export const metadata = { title: "Começar" };

export default async function Comecar() {
  const u = await exigirSessao();
  const [cursos, perfil] = await Promise.all([listarCursos(), getPerfil(u.id)]);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 lg:py-16">
      <div className="rounded-3xl border bg-card p-6 sm:p-12">
      <h1 className="text-ds-h2">
        {perfil ? "Seus dados" : "Quatro perguntas e pronto"}
      </h1>
      <p className="mt-3 max-w-[60ch] text-muted-foreground">
        Com as respostas, o Zefe marca o que você já cursou segundo a proposta de currículo. Você corrige as exceções
        depois.
      </p>
      <FormCadastro
        cursos={cursos}
        inicial={perfil ? {
          curso: perfil.curso, catalogo: perfil.catalogo, modalidade: perfil.modalidade,
          ingresso: perfil.ingresso, semestreAtual: perfil.semestre_atual,
        } : null}
      />
      </div>
    </div>
  );
}
