import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { exigirUsuario } from "@/sessao";
import { listarGrades, getGrade } from "@/dados/grades";
import { getOferta } from "@/dados/disciplinas";
import { getIntegralizacao, SemCurriculo } from "@/dados/aluno";
import { listarSemestres, ofertaPlanejador } from "@/dados/planejador";
import { proximoSemestre } from "@/dominio/oferta";
import { rotuloSemestre } from "@/dominio/semestre";
import { foraDoCalendario } from "@/dominio/ics";
import { Montagem } from "@/components/planejador/Montagem";
import { agruparCandidatos, type Cartao } from "@/dominio/planejador";
import { ExportarIcs } from "@/components/grade/ExportarIcs";
import { FormAcao } from "@/components/grade/FormAcao";
import { agruparAchados, itensSemanais, opcoesSemestre, resumoHorarios, semHorario } from "@/components/grade/visao";
import { AvisoBadge } from "@/components/ui/estado";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adicionarAcao, criarBloqueioAcao, criarGradeAcao, excluirBloqueioAcao, excluirGradeAcao, principalAcao, removerAcao } from "./acoes";

export const metadata = { title: "Planejador" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const CAMPO = "h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const H2 = "font-heading text-lg font-semibold";
const rotulosEvidencias = (evs: { ano: number; periodo: number }[]) => evs.map((e) => rotuloSemestre(e.ano, e.periodo)).join(", ");
const SECAO = "space-y-3 rounded-xl border bg-card p-4";
const DIAS = [["seg", "Segunda"], ["ter", "Terça"], ["qua", "Quarta"], ["qui", "Quinta"], ["sex", "Sexta"], ["sab", "Sábado"]] as const;

export default async function Planejador({ searchParams }: { searchParams: Promise<Params> }) {
  const u = await exigirUsuario();
  const sp = await searchParams;
  const prox = proximoSemestre();
  const anoQ = Number(um(sp.ano));
  const ano = Number.isInteger(anoQ) && anoQ >= 1990 && anoQ <= 2100 ? anoQ : prox.ano;
  const periodo = (Number(um(sp.periodo)) === 2 ? 2 : Number(um(sp.periodo)) === 1 ? 1 : ano === prox.ano ? prox.periodo : 1) as 1 | 2;
  const sem = { ano, periodo };
  const [semestres, grades] = await Promise.all([listarSemestres(), listarGrades(u.id, ano, periodo)]);
  const opcoes = opcoesSemestre(semestres, prox, sem);
  const publicado = semestres.some((s) => s.ano === ano && s.periodo === periodo && s.publicado);
  const escolhida = grades.find((g) => g.id === um(sp.grade)) ?? grades.find((g) => g.principal) ?? grades[0];
  const grade = escolhida ? await getGrade(u.id, escolhida.id) : null;
  const href = (o: { ano?: number; periodo?: number; grade?: string }) => {
    const p = new URLSearchParams({ ano: String(o.ano ?? ano), periodo: String(o.periodo ?? periodo) });
    if (o.grade) p.set("grade", o.grade);
    return `/planejador?${p}`;
  };

  // Oferta de cada disciplina da grade: turmas para trocar e evidências da previsão.
  const ofertas: Map<string, Awaited<ReturnType<typeof getOferta>>> = grade ? new Map(await Promise.all(grade.itens.map(async (i) => [i.codigo, await getOferta(i.codigo, ano, periodo)] as const))) : new Map();
  const evidencias = [...new Set(grade?.itens.flatMap((i) => { const o = ofertas.get(i.codigo); return o?.encontrada && o.tipo === "previsao" ? o.evidencias.map((e) => rotuloSemestre(e.ano, e.periodo)) : []; }) ?? [])];
  // Semestre atual ou passado: o que o aluno cursa/cursou também vira cartão, para montar a grade real.
  const feitas = ano * 2 + periodo <= prox.ano * 2 + prox.periodo - 1;
  // Cartões da árvore do aluno: o que ainda pode/deve cursar, com a oferta do semestre escolhido (travadas não precisam de oferta).
  const arvore = grade ? await getIntegralizacao(u.id).catch((e) => { if (e instanceof SemCurriculo) return null; throw e; }) : null;
  const cartoes: Cartao[] = arvore ? await Promise.all(arvore.disciplinas.filter((x) => feitas || (x.estado !== "cursada" && x.estado !== "cursando")).map(async (x) => {
    const o = x.estado === "travada" ? null : await ofertaPlanejador(x.codigo, ano, periodo);
    return { codigo: x.codigo, nome: x.nome, creditos: x.creditos, semestre: x.semestreSugerido, estado: x.estado, faltamPrereq: x.faltamPrereq, prereqDesconhecido: x.prereqDesconhecido, oferta: o?.oferta ?? null, ...(o?.oferta === null ? { semOfertaMotivo: o.motivo } : {}) };
  })) : [];
  const achados = grade ? agruparAchados(grade.checagem.achados) : null;
  const sem_h = grade ? semHorario(grade.itens) : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-6">
      <header className="space-y-3">
        <h1 className="text-4xl">Planejador</h1>
        <nav aria-label="Semestre" className="flex flex-wrap gap-1.5">
          {opcoes.map((s) => {
            const atual = s.ano === ano && s.periodo === periodo;
            return <Link key={`${s.ano}${s.periodo}`} href={href({ ano: s.ano, periodo: s.periodo })} aria-current={atual ? "page" : undefined}
              className={cn("tabular rounded-full border px-3 py-1 text-sm", atual ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{rotuloSemestre(s.ano, s.periodo)}</Link>;
          })}
        </nav>
        <nav aria-label="Opções de grade" className="flex flex-wrap items-center gap-1.5">
          {grades.map((g) => (
            <Link key={g.id} href={href({ grade: g.id })} aria-current={g.id === grade?.id ? "page" : undefined}
              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm", g.id === grade?.id ? "border-foreground/40 bg-accent font-medium" : "bg-card hover:bg-muted")}>
              {g.nome}{g.principal && <span className="inline-flex items-center gap-0.5 text-xs text-primary"><Star className="size-3" aria-hidden />principal</span>}
            </Link>
          ))}
          <FormAcao acao={criarGradeAcao} className="flex flex-wrap items-center gap-1.5">
            <input type="hidden" name="ano" value={ano} /><input type="hidden" name="periodo" value={periodo} />
            <label className="sr-only" htmlFor="nova-grade">Nome da nova opção</label>
            <input id="nova-grade" name="nome" required maxLength={60} placeholder={grades.length ? "Nova opção" : "Nome da grade"} defaultValue={grades.length ? "" : "Minha grade"} className={cn(CAMPO, "w-36")} />
            <Button type="submit" variant="outline">Criar</Button>
          </FormAcao>
        </nav>
      </header>

      {!publicado && (
        <p className="rounded-xl border border-dashed border-previsao-borda bg-previsao-bg p-3 text-sm text-previsao" role="note">
          <AvisoBadge nivel="previsao" className="mr-2" />
          {rotuloSemestre(ano, periodo)} ainda não tem caderno publicado: horários e turmas são previsão
          {evidencias.length ? <> baseada em <strong>{evidencias.join(", ")}</strong></> : <> (as evidências aparecem quando há disciplinas na grade)</>}. Confira quando a DAC publicar.
        </p>
      )}

      {!grade ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Nenhuma grade em {rotuloSemestre(ano, periodo)}. Dê um nome acima e crie a primeira opção.</p>
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="h-grade">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="h-grade" className={H2}>{grade.nome}</h2>
              {grade.principal ? <span className="inline-flex items-center gap-1 text-sm text-primary"><Star className="size-3.5" aria-hidden />principal</span> : (
                <FormAcao acao={principalAcao} className="flex"><input type="hidden" name="grade" value={grade.id} /><Button type="submit" size="sm" variant="outline">Tornar principal</Button></FormAcao>
              )}
              <details className="ml-auto">
                <summary className="cursor-pointer rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted">Excluir esta opção</summary>
                <FormAcao acao={excluirGradeAcao} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
                  <input type="hidden" name="grade" value={grade.id} /><input type="hidden" name="ano" value={ano} /><input type="hidden" name="periodo" value={periodo} />
                  Excluir “{grade.nome}” e suas turmas?<Button type="submit" size="sm" variant="destructive"><Trash2 aria-hidden />Excluir</Button>
                </FormAcao>
              </details>
            </div>
            <Montagem gradeId={grade.id} ano={ano} periodo={periodo} rotuloSem={rotuloSemestre(ano, periodo)} itens={grade.itens} bloqueios={grade.bloqueios}
              semanais={itensSemanais(grade.itens, grade.bloqueios, grade.checagem.achados)} grupos={agruparCandidatos(cartoes, feitas)} semArvore={!arvore} publicado={publicado} {...(u.perfil.curso != null ? { curso: u.perfil.curso } : {})} />
          </section>

          <section className={SECAO} aria-labelledby="h-resumo">
            <h2 id="h-resumo" className={H2}>Resumo</h2>
            <p className="text-sm"><strong className="tabular text-base">{grade.checagem.creditos}</strong> créditos em {grade.itens.length} {grade.itens.length === 1 ? "disciplina" : "disciplinas"}
              {grade.checagem.ok && grade.checagem.achados.length === 0 && grade.itens.length > 0 ? <span className="text-muted-foreground"> · sem conflitos nem avisos</span> : null}</p>
            {!grade.checagem.verificado && <p className="flex items-start gap-2 text-sm"><AvisoBadge nivel="naoverificado" />Há horário ou crédito não lido por inteiro: a conferência não garante que a grade cabe.</p>}
            {achados && (["conflito", "aviso"] as const).map((n) => achados[n].length > 0 && (
              <div key={n} className="space-y-1.5">
                <AvisoBadge nivel={n} rotulo={`${n === "conflito" ? "Conflitos" : "Avisos"} (${achados[n].length})`} />
                <ul className="space-y-1 text-sm">{achados[n].map((a, i) => <li key={i} className="max-w-[80ch]">{a.motivo}</li>)}</ul>
              </div>
            ))}
          </section>

          <section className={SECAO} aria-labelledby="h-turmas">
            <h2 id="h-turmas" className={H2}>Turmas escolhidas</h2>
            {grade.itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma disciplina ainda. Arraste um cartão para a grade.</p> : (
              <ul className="divide-y">
                {grade.itens.map((i) => {
                  const o = ofertas.get(i.codigo);
                  const turmas = o?.encontrada ? (o.tipo === "oficial" ? o.disciplina : o.base).turmas.filter((t) => t.turma !== i.turma) : [];
                  const ev = o?.encontrada && o.tipo === "previsao" ? rotulosEvidencias(o.evidencias) : "";
                  return (
                    <li key={i.codigo} className="space-y-1.5 py-3 text-sm first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link href={`/disciplina/${i.codigo}`} className="font-mono font-semibold hover:underline">{i.codigo}</Link>
                        <span className="min-w-0 flex-1">{i.nome}</span>
                        {i.tipo === "previsao" && <AvisoBadge nivel="previsao" />}
                        {(i.horarios.length === 0 || i.horarioIncompleto) && <AvisoBadge nivel="naoverificado" rotulo={i.horarioIncompleto ? "horário incompleto" : "sem horário"} />}
                      </div>
                      <p className="text-muted-foreground">Turma <strong className="text-foreground">{i.turma}</strong> · {i.creditos ?? "?"} cr. · {i.campus} · <span className="tabular">{resumoHorarios(i.horarios)}</span>{ev && <> · previsão baseada em {ev}</>}</p>
                      <div className="flex flex-wrap items-start gap-2">
                        {turmas.length > 0 && (
                          <details className="min-w-0">
                            <summary className="cursor-pointer rounded-lg border px-2.5 py-1 text-[0.8rem] hover:bg-muted">Trocar turma ({turmas.length})</summary>
                            <ul className="mt-2 space-y-1">
                              {turmas.map((t) => (
                                <li key={t.turma}><FormAcao acao={adicionarAcao} className="flex flex-wrap items-center gap-2">
                                  <input type="hidden" name="grade" value={grade.id} /><input type="hidden" name="codigo" value={i.codigo} /><input type="hidden" name="turma" value={t.turma} />
                                  <Button type="submit" size="sm" variant="outline">Turma {t.turma}</Button><span className="tabular text-muted-foreground">{resumoHorarios(t.horarios)}</span>
                                </FormAcao></li>
                              ))}
                            </ul>
                          </details>
                        )}
                        <FormAcao acao={removerAcao} className="flex"><input type="hidden" name="grade" value={grade.id} /><input type="hidden" name="codigo" value={i.codigo} />
                          <Button type="submit" size="sm" variant="ghost"><Trash2 aria-hidden />Remover<span className="sr-only"> {i.codigo}</span></Button></FormAcao>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {sem_h.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <h3 className="text-sm font-semibold">Sem horário</h3>
                <p className="text-sm text-muted-foreground">Não aparecem na grade semanal, mas contam nos créditos: {sem_h.map((i) => `${i.codigo} ${i.turma}${i.horarioIncompleto ? " (horário incompleto)" : ""}`).join(", ")}.</p>
              </div>
            )}
          </section>

          <section className={SECAO} aria-labelledby="h-bloq">
            <h2 id="h-bloq" className={H2}>Horários bloqueados</h2>
            <p className="max-w-[68ch] text-sm text-muted-foreground">Estágio, trabalho: janelas fixas que valem em todas as suas grades e contam como conflito.</p>
            {grade.bloqueios.length > 0 && (
              <ul className="divide-y text-sm">
                {grade.bloqueios.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-2 py-1.5">
                    <span className="font-medium">{b.nome}</span><span className="tabular text-muted-foreground">{DIAS.find(([k]) => k === b.dia)![1]} {b.inicio}–{b.fim}</span>
                    <FormAcao acao={excluirBloqueioAcao} className="ml-auto flex"><input type="hidden" name="id" value={b.id} /><Button type="submit" size="sm" variant="ghost"><Trash2 aria-hidden />Excluir<span className="sr-only"> {b.nome}</span></Button></FormAcao>
                  </li>
                ))}
              </ul>
            )}
            <FormAcao acao={criarBloqueioAcao} className="flex flex-wrap items-end gap-2 text-sm">
              <label className="space-y-1"><span className="block font-medium">Nome</span><input name="nome" required maxLength={60} placeholder="Estágio" className={cn(CAMPO, "w-36")} /></label>
              <label className="space-y-1"><span className="block font-medium">Dia</span><select name="dia" className={CAMPO}>{DIAS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
              <label className="space-y-1"><span className="block font-medium">Início</span><input name="inicio" type="time" required defaultValue="13:30" className={cn(CAMPO, "tabular")} /></label>
              <label className="space-y-1"><span className="block font-medium">Fim</span><input name="fim" type="time" required defaultValue="17:30" className={cn(CAMPO, "tabular")} /></label>
              <Button type="submit" size="lg">Bloquear</Button>
            </FormAcao>
          </section>

          <ExportarIcs gradeId={grade.id} ano={ano} periodo={periodo} foraDoCalendario={foraDoCalendario(grade.itens)} />
        </>
      )}
    </div>
  );
}
