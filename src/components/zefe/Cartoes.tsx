import { AlertTriangle, OctagonX } from "lucide-react";
import { AvisoBadge, EstadoBadge } from "@/components/ui/estado";
import type { Cartao } from "@/zefe/cartoes";
import { cn } from "@/lib/utils";

type Dados<T extends Cartao["tipo"]> = Extract<Cartao, { tipo: T }>["dados"];

const base = "rounded-xl border bg-card p-4 text-sm";
const dias: Record<string, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb" };
const codigo = "font-medium tabular-nums";

function Horarios({ h }: { h: { dia: string; inicio: string; fim: string; sala?: string | undefined }[] }) {
  if (!h.length) return <span className="text-muted-foreground">sem horário</span>;
  return (
    <span className="tabular-nums">
      {h.map((x, i) => (
        <span key={i} className="mr-2 whitespace-nowrap">
          {dias[x.dia] ?? x.dia} {x.inicio}–{x.fim}
          {x.sala ? <span className="text-muted-foreground"> · {x.sala}</span> : null}
        </span>
      ))}
    </span>
  );
}

function Titulo({ children, selo }: { children: React.ReactNode; selo?: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
      <h3 className="font-sans text-sm font-bold">{children}</h3>
      {selo}
    </div>
  );
}

function Oferta({ d }: { d: Dados<"oferta"> }) {
  const previsao = d.tipo === "previsao";
  return (
    <section className={cn(base, previsao && "border-dashed border-previsao-borda")} aria-label={`Turmas de ${d.codigo}`}>
      <Titulo selo={previsao ? <AvisoBadge nivel="previsao" /> : undefined}>
        <span className={codigo}>{d.codigo}</span> {d.nome}
      </Titulo>
      <p className="mb-2 text-muted-foreground">
        {d.semestre} · {d.creditos ?? "?"} créditos · {d.campus}
      </p>
      {previsao && d.aviso && <p className="mb-2 text-previsao">{d.aviso}</p>}
      {d.turmas.length === 0 ? <p className="text-muted-foreground">Nenhuma turma nos dados.</p> : (
        <ul className="divide-y">
          {d.turmas.map((t) => (
            <li key={t.turma} className="flex flex-col gap-0.5 py-1.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">Turma {t.turma}</span>
                {!previsao && t.vagas !== undefined && <span className="tabular-nums text-muted-foreground">{t.vagas === null ? "vagas ?" : `${t.matriculados ?? "?"}/${t.vagas} vagas`}</span>}
              </div>
              <Horarios h={t.horarios} />
              {t.horarioIncompleto && <AvisoBadge nivel="naoverificado" rotulo="Horário incompleto" className="self-start" />}
              {t.docentes.length > 0 && <span className="text-muted-foreground">{t.docentes.join(", ")}</span>}
            </li>
          ))}
        </ul>
      )}
      {!!d.turmasOmitidas && <p className="mt-1 text-muted-foreground">Mais {d.turmasOmitidas} turmas não mostradas.</p>}
      <a href={d.fonte.url} target="_blank" rel="noreferrer" className="mt-2 inline-block underline underline-offset-2">
        Fonte: DAC {d.fonte.semestre}
      </a>
    </section>
  );
}

function Turmas({ d }: { d: Dados<"turmas"> }) {
  const previsao = d.tipo === "previsao";
  return (
    <section className={cn(base, previsao && "border-dashed border-previsao-borda")} aria-label="Turmas que cabem">
      <Titulo selo={previsao ? <AvisoBadge nivel="previsao" /> : undefined}>{d.total} turmas em {d.semestre}</Titulo>
      {previsao && d.aviso && <p className="mb-2 text-previsao">{d.aviso}</p>}
      {d.turmas.length === 0 ? <p className="text-muted-foreground">Nada cabe nessas janelas.</p> : (
        <ul className="divide-y">
          {d.turmas.map((t) => (
            <li key={`${t.codigo}${t.turma}`} className="py-1.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span><span className={codigo}>{t.codigo}</span> {t.turma}</span>
                <span className="text-muted-foreground">{t.creditos ?? "?"} cr.</span>
              </div>
              <div className="truncate" title={t.nome}>{t.nome}</div>
              <Horarios h={t.horarios} />
            </li>
          ))}
        </ul>
      )}
      {!!d.turmasOmitidas && <p className="mt-1 text-muted-foreground">Mais {d.turmasOmitidas} não mostradas.</p>}
    </section>
  );
}

function Grade({ d }: { d: Dados<"grade"> }) {
  const c = d.checagem;
  const conflitos = c.achados.filter((a) => a.nivel === "conflito");
  const avisos = c.achados.filter((a) => a.nivel === "aviso");
  return (
    <section className={cn(base, d.tipo === "previsao" && "border-dashed border-previsao-borda")} aria-label={`Grade ${d.grade.nome}`}>
      <Titulo selo={d.tipo === "previsao" ? <AvisoBadge nivel="previsao" /> : undefined}>{d.grade.nome} · {d.grade.semestre}</Titulo>
      <p className="mb-2 tabular-nums text-muted-foreground">{c.creditos} créditos</p>
      {d.itens.length === 0 ? <p className="text-muted-foreground">Nenhuma turma na grade ainda.</p> : (
        <ul className="divide-y">
          {d.itens.map((i) => (
            <li key={i.codigo} className="py-1.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span><span className={codigo}>{i.codigo}</span> {i.turma}</span>
                <span className="text-muted-foreground">{i.creditos ?? "?"} cr.</span>
              </div>
              <div className="truncate" title={i.nome}>{i.nome}</div>
              <Horarios h={i.horarios} />
              {i.semHorario && <AvisoBadge nivel="naoverificado" rotulo="Sem horário" className="mt-0.5" />}
            </li>
          ))}
        </ul>
      )}
      {d.bloqueios.length > 0 && (
        <p className="mt-2 text-muted-foreground">
          Bloqueios: {d.bloqueios.map((b) => `${b.nome} (${dias[b.dia] ?? b.dia} ${b.inicio}–${b.fim})`).join("; ")}
        </p>
      )}
      <ul className="mt-2 space-y-1">
        {conflitos.map((a, i) => (
          <li key={i} className="flex items-start gap-1.5 rounded-lg border border-conflito-borda bg-conflito-bg px-3 py-2 text-conflito">
            <OctagonX className="mt-px size-3.5 shrink-0" aria-hidden />
            <span><span className="font-medium">Conflito:</span> {a.motivo}</span>
          </li>
        ))}
        {conflitos.length === 0 && c.verificado && <li className="text-muted-foreground">Sem conflitos.</li>}
        {!c.verificado && <li><AvisoBadge nivel="naoverificado" rotulo="Checagem incompleta" /></li>}
      </ul>
      {avisos.length > 0 && (
        <details className="mt-2 rounded-lg border border-aviso-borda bg-aviso-bg text-aviso">
          <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 font-medium"><AlertTriangle className="size-3.5 shrink-0" aria-hidden />{avisos.length} {avisos.length === 1 ? "aviso" : "avisos"}</summary>
          <ul className="space-y-1 px-3 pb-3">
            {avisos.map((a, i) => <li key={i}>{a.motivo}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

function Progresso({ d }: { d: Dados<"progresso"> }) {
  const { obrigatorias: o, eletivas: e } = d.creditos;
  return (
    <section className={base} aria-label="Progresso">
      <Titulo>Onde você está</Titulo>
      <dl className="mb-2 grid grid-cols-2 gap-2 tabular-nums">
        <div><dt className="text-muted-foreground">Obrigatórias</dt><dd className="text-sm font-bold">{o.feitos}/{o.total}{o.emAndamento ? <span className="font-normal text-muted-foreground"> (+{o.emAndamento} cursando)</span> : null}</dd></div>
        <div><dt className="text-muted-foreground">Eletivas</dt><dd className="text-sm font-bold">{e.feitos}/{e.total}{e.naoVerificado ? <span className="font-normal text-muted-foreground"> ({e.naoVerificado} não verif.)</span> : null}</dd></div>
      </dl>
      {d.faltantes.length > 0 && (
        <>
          <h4 className="mb-1 font-medium">Faltam ({d.faltantes.length}{d.faltantesOmitidos ? `+${d.faltantesOmitidos}` : ""})</h4>
          <ul className="mb-2 space-y-0.5">
            {d.faltantes.map((f) => (
              <li key={f.codigo} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate"><span className={codigo}>{f.codigo}</span> {f.nome}</span>
                <span className="shrink-0 text-muted-foreground">{f.semestreSugerido ? `${f.semestreSugerido}º sem.` : "—"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {d.travadas.length > 0 && (
        <>
          <h4 className="mb-1 flex items-center gap-1.5 font-medium"><EstadoBadge estado="travada" compacto /> Travadas por pré-requisito</h4>
          <ul className="mb-2 space-y-0.5">
            {d.travadas.map((t) => (
              <li key={t.codigo}><span className={codigo}>{t.codigo}</span> {t.nome} <span className="text-muted-foreground">· falta {t.faltamPrereq.join(", ")}</span></li>
            ))}
          </ul>
        </>
      )}
      {d.grupos.length > 0 && (
        <ul className="space-y-1">
          {d.grupos.map((g, i) => (
            <li key={i} className={cn("rounded-lg border px-3 py-2", !g.verificado && "border-dashed border-naoverificado-borda bg-naoverificado-bg text-naoverificado")}>
              {g.texto} <span className="tabular-nums">{g.verificado ? `${g.feitos}/${g.creditos} cr.` : "não verificado"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Prereq({ d }: { d: Dados<"prereq"> }) {
  return (
    <section className={cn(base, !d.verificado && "border-dashed border-naoverificado-borda")} aria-label={`Pré-requisitos de ${d.codigo}`}>
      <Titulo selo={!d.verificado ? <AvisoBadge nivel="naoverificado" /> : undefined}><span className={codigo}>{d.codigo}</span> {d.nome}</Titulo>
      {d.prereqTexto ? <p className="mb-2 text-muted-foreground">Catálogo: {d.prereqTexto}</p> : <p className="mb-2 text-muted-foreground">Sem pré-requisito no catálogo.</p>}
      {d.aviso && <p className="mb-2 text-naoverificado">{d.aviso}</p>}
      {d.verificado && d.alternativas && d.alternativas.length > 0 && (
        <ul className="space-y-1">
          {d.alternativas.map((alt, i) => (
            <li key={i} className="flex flex-wrap items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground">ou</span>}
              {alt.map((r) => (
                <span key={r.codigo} className="inline-flex items-center gap-1">
                  <span className={codigo}>{r.codigo}{r.parcial ? "*" : ""}</span>
                  {r.estado === "cursada" ? <EstadoBadge estado="cursada" compacto /> : r.estado === "cursando" ? <EstadoBadge estado="cursando" compacto /> : <EstadoBadge estado="faltando" compacto />}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
      {d.verificado && d.satisfeito !== undefined && <p className="mt-2 font-medium">{d.satisfeito ? "Você cumpre o pré-requisito." : "Ainda falta pré-requisito."}</p>}
      {d.destrava.length > 0 && <p className="mt-2 text-muted-foreground">Destrava: {d.destrava.join(", ")}</p>}
    </section>
  );
}

export function CartaoZefe({ cartao, desatualizado }: { cartao: Cartao; desatualizado?: boolean }) {
  if (desatualizado) {
    return (
      <div className="opacity-60" data-desatualizado>
        <CartaoZefe cartao={cartao} />
        <p className="mt-1 text-xs text-muted-foreground">Estado antes de desfazer.</p>
      </div>
    );
  }
  switch (cartao.tipo) {
    case "oferta": return <Oferta d={cartao.dados} />;
    case "turmas": return <Turmas d={cartao.dados} />;
    case "grade": return <Grade d={cartao.dados} />;
    case "progresso": return <Progresso d={cartao.dados} />;
    case "prereq": return <Prereq d={cartao.dados} />;
  }
}

/** Resultado que não bate com o esquema: nada inventado, só o aviso e o JSON recolhido. */
export function CartaoFalha({ saida }: { saida: unknown }) {
  return (
    <details className={cn(base, "border-dashed border-naoverificado-borda")}>
      <summary className="cursor-pointer font-medium">Não consegui exibir este resultado</summary>
      <pre className="mt-2 max-h-48 overflow-auto text-xs whitespace-pre-wrap">{JSON.stringify(saida, null, 2)}</pre>
    </details>
  );
}
