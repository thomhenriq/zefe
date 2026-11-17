import Link from "next/link";
import { Info } from "lucide-react";
import { exigirUsuario } from "@/sessao";
import { getIntegralizacao } from "@/dados/aluno";
import { gruposAbertos } from "@/dados/arvore";
import { Pagina } from "@/components/consulta";
import { Button } from "@/components/ui/button";
import { AvisoBadge } from "@/components/ui/estado";
import { Barra } from "@/components/arvore/Barra";
import { Arvore } from "@/components/arvore/Arvore";

export const dynamic = "force-dynamic";
export const metadata = { title: "Árvore de integralização" };

const Codigos = ({ cs }: { cs: string[] }) => cs.map((c, i) => <span key={c}>{i > 0 && ", "}<Link href={`/disciplina/${c}`} className="font-mono underline underline-offset-2">{c}</Link></span>);

export default async function PaginaArvore() {
  const u = await exigirUsuario();
  const integ = await getIntegralizacao(u.id).catch(() => null);
  if (!integ) {
    return (
      <Pagina>
        <div className="max-w-xl space-y-4 rounded-xl border bg-card p-6">
          <h1 className="text-3xl">Árvore de integralização</h1>
          <p className="text-muted-foreground">Ainda não tenho o currículo do seu curso e catálogo carregado, então não consigo montar a árvore. Confira o curso e o catálogo no seu cadastro.</p>
          <Button render={<Link href="/comecar" />} nativeButton={false}>Revisar cadastro</Button>
        </div>
      </Pagina>
    );
  }
  const abertos = await gruposAbertos(u.perfil);
  const { creditos: c, grupos } = integ;
  const totalFeitos = c.obrigatorias.feitos + c.eletivas.feitos;
  const totalAndamento = c.obrigatorias.emAndamento + c.eletivas.emAndamento;
  const totalCreditos = c.obrigatorias.total + c.eletivas.total;

  return (
    <Pagina>
      <header className="space-y-2">
        <h1>Árvore de integralização</h1>
        <p className="text-sm text-muted-foreground">Curso {u.perfil.curso}{u.perfil.modalidade ? `, modalidade ${u.perfil.modalidade}` : ""} · catálogo {u.perfil.catalogo}</p>
        <p className="flex max-w-prose items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span><strong>Histórico declarado por você.</strong> Equivalências não são calculadas: se cumpriu por equivalência, marque como cursada. Clique numa disciplina para corrigir.</span>
        </p>
      </header>

      <section aria-labelledby="h-progresso" className="space-y-4 rounded-xl border bg-card p-4">
        <h2 id="h-progresso" className="text-xl">Progresso</h2>
        <Barra titulo={<strong>Total</strong>} feitos={totalFeitos} emAndamento={totalAndamento} total={totalCreditos} extra={c.eletivas.naoVerificado > 0 ? `Não inclui ${c.eletivas.naoVerificado} créditos de grupos de eletivas não verificados.` : undefined} />
        <Barra titulo="Obrigatórias" feitos={c.obrigatorias.feitos} emAndamento={c.obrigatorias.emAndamento} total={c.obrigatorias.total} />
        <div className="space-y-4">
          <h3 className="text-base">Grupos de eletivas</h3>
          {grupos.map((g, i) => {
            const aberto = abertos[i];
            const rotulo = `Grupo ${i + 1}`;
            if (!g.verificado) {
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{rotulo}</span><AvisoBadge nivel="naoverificado" /></div>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Texto do catálogo; os créditos deste grupo não entram na conta</summary>
                    <p className="mt-1 max-w-prose whitespace-pre-line">{g.texto}</p>
                  </details>
                </div>
              );
            }
            return (
              <Barra key={i} titulo={<>{rotulo} <span className="font-normal text-muted-foreground">· {aberto ? "aberto, qualquer disciplina oferecida pela Unicamp" : "fechado, lista do catálogo"}</span></>}
                feitos={g.feitos} emAndamento={g.emAndamento} total={g.creditos}
                extra={g.excedente > 0 ? `${g.excedente} créditos além do exigido não contam aqui.` : undefined} />
            );
          })}
        </div>
        {integ.naoClassificadas.length > 0 && (
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><AvisoBadge nivel="naoverificado" rotulo="Não classificadas" /> Cursadas que podem caber em um grupo não verificado: <Codigos cs={integ.naoClassificadas} />.</p>
        )}
        {integ.foraDoCurriculo.length > 0 && (
          <p className="text-xs text-muted-foreground">Marcadas no histórico, mas fora das obrigatórias e dos grupos verificados: <Codigos cs={integ.foraDoCurriculo} />.</p>
        )}
      </section>

      <section aria-labelledby="h-arvore" className="space-y-3">
        <h2 id="h-arvore" className="text-xl">Disciplinas por semestre da proposta</h2>
        <Arvore disciplinas={integ.disciplinas} />
      </section>
    </Pagina>
  );
}
