import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDisciplina, getOferta } from "@/dados/disciplinas";
import { normalizarCodigo } from "@/dominio/codigo";
import { proximoSemestre } from "@/dominio/oferta";
import { situacaoPrereq } from "@/dominio/prereq-texto";
import { rotuloSemestre } from "@/dominio/semestre";
import { slugProfessor } from "@/dac/sync-caderno";
import type { Turma } from "@/dac/tipos";
import { AvisoBadge } from "@/components/ui/estado";
import { Pagina, mono } from "@/components/consulta";

export const dynamic = "force-dynamic";

const LinkCod = ({ c, parcial }: { c: string; parcial?: boolean }) => (
  <span className="whitespace-nowrap">
    <Link href={`/disciplina/${c}`} className={`${mono} font-bold underline underline-offset-4`}>{c}</Link>
    {parcial && <span className="text-xs text-muted-foreground"> (parcial)</span>}
  </span>
);

// Na previsão vagas/matriculados são do semestre-base: nunca mostrar como se fossem do futuro.
function Turmas({ turmas, previsao }: { turmas: Turma[]; previsao?: boolean }) {
  return (
    <ul className="divide-y">
      {turmas.map((t) => (
        <li key={t.turma} className="space-y-1 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className={`${mono} font-bold`}>Turma {t.turma}</span>
            {!previsao && (
              <span className="text-muted-foreground">
                {t.vagas != null ? `${t.matriculados ?? "?"}/${t.vagas} vagas ocupadas` : "vagas não informadas"}
              </span>
            )}
          </div>
          <p className={`${mono} flex flex-wrap gap-x-3 text-sm`}>
            {t.horarios.length ? t.horarios.map((h, i) => (
              <span key={i} className="whitespace-nowrap">{h.dia} {h.inicio}–{h.fim}{h.sala && <> <Link href={`/sala/${encodeURIComponent(h.sala)}`} className="underline underline-offset-2">{h.sala}</Link></>}</span>
            )) : "sem horário informado"}
            {t.horarioIncompleto && <span className="text-muted-foreground"> (horário incompleto na fonte)</span>}
          </p>
          {t.docentes.length > 0 && (
            <p>{t.docentes.map((d, i) => <span key={d}>{i > 0 && ", "}<Link href={`/professor/${slugProfessor(d)}`} className="underline underline-offset-2">{d}</Link></span>)}</p>
          )}
          {t.reservas.length > 0 && <p className="text-xs text-muted-foreground">Reservas: {t.reservas.join("; ")}</p>}
        </li>
      ))}
    </ul>
  );
}

export default async function PaginaDisciplina({ params }: { params: Promise<{ codigo: string }> }) {
  const bruto = decodeURIComponent((await params).codigo);
  const { codigo } = normalizarCodigo(bruto);
  if (codigo !== bruto) redirect(`/disciplina/${codigo}`);
  const d = await getDisciplina(codigo);
  if (!d) notFound();
  const situacao = situacaoPrereq(d.prereqTexto, d.alternativas.length);
  const prox = proximoSemestre();
  const jaTem = d.oferecimentos.some((o) => o.ano === prox.ano && o.periodo === prox.periodo);
  const oferta = jaTem ? null : await getOferta(codigo, prox.ano, prox.periodo);

  return (
    <Pagina>
      <header className="space-y-1">
        <p className={`${mono} text-xl font-bold text-link`}>{d.codigo}</p>
        <h1 className="text-ds-h2">{d.nome}</h1>
        <p className="text-muted-foreground">{d.creditos != null ? `${d.creditos} créditos` : "créditos não informados"}</p>
      </header>

      <section aria-labelledby="h-pre" className="space-y-3 rounded-xl border bg-card p-6">
        <h2 id="h-pre" className="text-xl">Pré-requisitos</h2>
        {d.catalogo == null ? (
          <p className="flex items-center gap-2 text-sm"><AvisoBadge nivel="naoverificado" rotulo="Sem dados do catálogo" /> Não sei os pré-requisitos desta disciplina.</p>
        ) : situacao === "nenhum" ? (
          <p className="text-sm">Nenhum pré-requisito no catálogo {d.catalogo}.</p>
        ) : situacao === "naoverificado" ? (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2"><AvisoBadge nivel="naoverificado" /> Não entendi esta regra do catálogo {d.catalogo}.</p>
            <p>Texto original: {d.prereqTexto}</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p>
              {d.alternativas.map((g, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted-foreground"> ou </span>}
                  {g.map((r, j) => <span key={r.codigo}>{j > 0 && " e "}<LinkCod c={r.codigo} parcial={r.parcial} /></span>)}
                </span>
              ))}
            </p>
            <p className="text-sm text-muted-foreground">Basta cumprir um dos grupos. Catálogo {d.catalogo}.</p>
          </div>
        )}
        {d.prereqTexto && d.alternativas.length > 0 && <p className="text-xs text-muted-foreground">Texto original: {d.prereqTexto}</p>}
      </section>

      {d.destrava.length > 0 && (
        <section aria-labelledby="h-dest" className="space-y-3 rounded-xl border bg-card p-6">
          <h2 id="h-dest" className="text-xl">Destrava</h2>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">{d.destrava.map((c) => <LinkCod key={c} c={c} />)}</p>
        </section>
      )}

      {d.ementa && (
        <section aria-labelledby="h-em" className="space-y-3 rounded-xl border bg-card p-6">
          <h2 id="h-em" className="text-xl">Ementa</h2>
          <p className="max-w-[68ch] text-sm leading-relaxed">{d.ementa}</p>
        </section>
      )}

      <section aria-labelledby="h-of" className="space-y-4">
        <h2 id="h-of" className="text-xl">Oferecimentos</h2>
        {oferta && (
          <article className="overflow-hidden rounded-xl border border-dashed border-previsao-borda bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-previsao-borda px-4 py-3">
              <h3 className="text-base font-bold">{rotuloSemestre(prox.ano, prox.periodo)}</h3>
              <AvisoBadge nivel="previsao" />
              {oferta.encontrada && oferta.tipo === "previsao" && (
                <span className="text-sm">confiança {oferta.confianca === "provavel" ? "provável" : "incerta"}; baseada em {oferta.evidencias.map((e) => rotuloSemestre(e.ano, e.periodo)).join(", ")}</span>
              )}
            </div>
            {oferta.encontrada && oferta.tipo === "previsao" ? <Turmas turmas={oferta.base.turmas} previsao />
              : oferta.encontrada ? <Turmas turmas={oferta.disciplina.turmas} />
              : <p className="px-4 py-3 text-sm">Sem histórico: {oferta.motivo}.</p>}
            {oferta.encontrada && oferta.tipo === "previsao" && <p className="border-t border-dashed border-previsao-borda px-4 py-2 text-xs text-muted-foreground">Previsão, não é o caderno oficial. Horários e salas podem mudar.</p>}
          </article>
        )}
        {d.oferecimentos.length === 0 && <p className="text-sm text-muted-foreground">Sem oferecimentos nos cadernos coletados.</p>}
        {d.oferecimentos.map((o) => (
          <article key={`${o.ano}-${o.periodo}`} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <h3 className="text-base font-bold">{rotuloSemestre(o.ano, o.periodo)}</h3>
              <a href={o.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Fonte na DAC <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
            <Turmas turmas={o.turmas} />
          </article>
        ))}
      </section>
    </Pagina>
  );
}
