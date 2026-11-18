import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessor } from "@/dados/professores";
import { GradeSemanal } from "@/components/grade/GradeSemanal";
import { rotuloSemestre } from "@/dominio/semestre";
import { Pagina, mono } from "@/components/consulta";

export const dynamic = "force-dynamic";

export default async function PaginaProfessor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProfessor(decodeURIComponent(slug));
  if (!p) notFound();
  const [atual] = p.semestres;
  return (
    <Pagina>
      <h1 className="text-ds-h2">{p.nome}</h1>
      {p.semestres.length === 0 && <p className="text-muted-foreground">Sem turmas nos cadernos coletados.</p>}
      {atual && (
        <section className="space-y-2" aria-labelledby="h-grade">
          <h2 id="h-grade" className="text-xl">Semana em {rotuloSemestre(atual.ano, atual.periodo)}</h2>
          <GradeSemanal itens={atual.turmas.flatMap((t) => t.horarios.map((h) => ({ rotulo: `${t.codigo} ${t.turma}`, dia: h.dia, inicio: h.inicio, fim: h.fim, tom: "cursando", href: `/disciplina/${t.codigo}` })))} />
        </section>
      )}
      {p.semestres.map((s) => (
        <section key={`${s.ano}-${s.periodo}`} className="space-y-2" aria-labelledby={`s-${s.ano}-${s.periodo}`}>
          <h2 id={`s-${s.ano}-${s.periodo}`} className="text-xl">{rotuloSemestre(s.ano, s.periodo)}</h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {s.turmas.map((t) => (
              <li key={t.codigo + t.turma} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <Link href={`/disciplina/${t.codigo}`} className={`${mono} font-bold underline-offset-4 hover:underline`}>{t.codigo} {t.turma}</Link>
                <span className="min-w-0 flex-1">{t.nome}</span>
                <span className={`${mono} flex flex-wrap gap-x-3 text-sm text-muted-foreground`}>
                  {t.horarios.length ? t.horarios.map((h, i) => (
                    <span key={i} className="whitespace-nowrap">{h.dia} {h.inicio}–{h.fim}{h.sala && <> <Link href={`/sala/${encodeURIComponent(h.sala)}`} className="underline underline-offset-2">{h.sala}</Link></>}</span>
                  )) : "sem horário informado"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Pagina>
  );
}
