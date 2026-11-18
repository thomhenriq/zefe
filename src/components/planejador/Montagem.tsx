"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { Accessibility, defaultPreset } from "@dnd-kit/dom";
import { pointerIntersection } from "@dnd-kit/collision";
import type { CollisionDetector } from "@dnd-kit/abstract";
import { CheckCircle2, ChevronDown, GripVertical, OctagonX, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvisoBadge, EstadoBadge } from "@/components/ui/estado";
import { GradeSemanal, type BaseBloco, type ItemGrade as ItemSemanal } from "@/components/grade/GradeSemanal";
import { resumoHorarios } from "@/components/grade/visao";
import type { Bloqueio, ItemGrade } from "@/dominio/grade";
import { encaixarTurmas, type CartaoComSituacao, type DisciplinaOferta, type Encaixe } from "@/dominio/planejador";
import { cn } from "@/lib/utils";
import { adicionarAcao, buscarAcao, ofertaAcao, removerAcao, type ResultadoBusca } from "@/app/(app)/planejador/acoes";

type Grupo = { semestre: number | null; cartoes: CartaoComSituacao[] };
export interface MontagemProps {
  gradeId: string; ano: number; periodo: 1 | 2; rotuloSem: string;
  itens: ItemGrade[]; bloqueios: Bloqueio[]; semanais: ItemSemanal[];
  grupos: Grupo[];
  /** Perfil sem currículo carregado: não há árvore para guiar, fica só a busca. */
  semArvore: boolean;
}

type Marca = { rotulo?: string };
type Ev = { operation: { source?: { id: unknown; data: Marca & Record<string, unknown> } | null; target?: { id: unknown; data: Record<string, unknown> } | null }; canceled?: boolean };
const falar = (m: Marca | undefined, resto: string) => `${m?.rotulo ?? "Item"} ${resto}`;
// Anúncios do leitor de tela em pt-BR (os padrões da biblioteca vêm em inglês).
const acessibilidade = Accessibility.configure({
  screenReaderInstructions: { draggable: "Para pegar, pressione espaço ou Enter. Use as setas para mover sobre a grade e espaço para soltar; Esc cancela. Há também o botão Adicionar." },
  announcements: {
    dragstart: ({ operation: { source } }: Ev) => (source ? falar(source.data, "pego. As turmas aparecem na grade.") : undefined),
    dragover: ({ operation: { source, target } }: Ev) => (source && target && source.id !== target.id ? falar(source.data, target.id === "remover" ? "sobre remover." : target.id === "grade" ? "sobre a grade." : `sobre a turma ${target.data?.turma}.`) : undefined),
    dragend: ({ operation: { source, target }, canceled }: Ev) => (source ? (canceled || !target ? falar(source.data, "solto sem alterar a grade.") : falar(source.data, "solto.")) : undefined),
  },
});
const plugins = (d: typeof defaultPreset.plugins) => d.map((p) => (p === Accessibility ? acessibilidade : p));

// Vale onde está o ponteiro (ou o cursor do teclado), não a área do cartão arrastado; o menor alvo (fantasma) vence a grade.
const porPonteiro: CollisionDetector = (a) => {
  const c = pointerIntersection(a);
  const id = String(a.droppable.id);
  return c && { ...c, priority: id.startsWith("fantasma") ? 3 : id === "remover" ? 2 : 1 };
};

const ordinal = (s: number | null) => (s === null ? "Sem semestre sugerido" : `${s}º semestre`);
const nomeDoItem = (it: ItemSemanal) => it.rotulo;

export function Montagem(p: MontagemProps) {
  const [arrastando, setArrastando] = useState<{ tipo: "cartao" | "item"; disc: DisciplinaOferta | null } | null>(null);
  const [escolha, setEscolha] = useState<DisciplinaOferta | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [pendente, comecar] = useTransition();
  const gatilho = useRef<HTMLElement | null>(null);

  const porCodigo = useMemo(() => new Map(p.grupos.flatMap((g) => g.cartoes).map((c) => [c.codigo, c] as const)), [p.grupos]);
  const foco = escolha ?? (arrastando?.tipo === "cartao" ? arrastando.disc : null);
  const encaixes = useMemo(() => (foco ? encaixarTurmas(foco, p.itens, p.bloqueios) : []), [foco, p.itens, p.bloqueios]);
  const fantasmas: ItemSemanal[] = useMemo(() => !foco ? [] : foco.turmas.flatMap((t) => t.horarios.map((h, i): ItemSemanal => ({
    rotulo: `${foco.codigo} ${t.turma}`, dia: h.dia, inicio: h.inicio, fim: h.fim, id: `fantasma:${t.turma}:${i}`, fantasma: true, codigo: foco.codigo,
    tom: encaixes.find((e) => e.turma === t.turma)?.cabe === false ? "conflito" : "planejada",
  }))), [foco, encaixes]);

  function aplicar(acao: typeof adicionarAcao, campos: Record<string, string>, ok: string) {
    const fd = new FormData();
    fd.set("grade", p.gradeId);
    for (const [k, v] of Object.entries(campos)) fd.set(k, v);
    setErro(null);
    comecar(async () => {
      const r = await acao(null, fd);
      if (r?.erro) setErro(r.erro); else setAviso(ok);
    });
  }
  const adicionar = (codigo: string, turma: string) => { setEscolha(null); setPrevia(null); gatilho.current?.focus(); aplicar(adicionarAcao, { codigo, turma }, `${codigo} turma ${turma} na grade.`); };
  const remover = (codigo: string) => aplicar(removerAcao, { codigo }, `${codigo} removida da grade.`);
  const abrir = (disc: DisciplinaOferta, de?: HTMLElement | null) => { gatilho.current = de ?? (document.activeElement as HTMLElement | null); setErro(null); setEscolha(disc); setPrevia(null); };
  const fechar = () => { setEscolha(null); setPrevia(null); gatilho.current?.focus(); };

  const bloco = (it: ItemSemanal, base: BaseBloco): ReactNode => {
    if (it.fantasma) {
      const e = encaixes.find((x) => x.turma === it.id!.split(":")[1]);
      return <BlocoFantasma it={it} base={base} conflita={e?.cabe === false} apagado={previa !== null && previa !== e?.turma} />;
    }
    return it.codigo ? <BlocoItem it={it} base={base} /> : null;
  };
  const semanais = useMemo(() => [...p.semanais, ...fantasmas], [p.semanais, fantasmas]);
  // bloqueios e itens sem `id` continuam como a GradeSemanal já os desenhava; só os com código viram arrastáveis
  const comId = useMemo(() => semanais.map((i, n) => (i.fantasma || !i.codigo ? i : { ...i, id: `item:${i.codigo}:${n}` })), [semanais]);

  return (
    <DragDropProvider
      plugins={plugins}
      onDragStart={(e) => {
        const d = e.operation.source?.data;
        if (d?.tipo === "cartao") setArrastando({ disc: porCodigo.get(d.codigo)?.oferta ?? null, tipo: "cartao" });
        else if (d?.tipo === "item") setArrastando({ disc: null, tipo: "item" });
        setEscolha(null);
      }}
      onDragEnd={(e) => {
        const antes = arrastando;
        setArrastando(null);
        if (e.canceled) return;
        const src = e.operation.source?.data, alvo = e.operation.target;
        if (!src || !alvo) return;
        if (src.tipo === "item" && alvo.id === "remover") return remover(src.codigo);
        if (src.tipo !== "cartao" || antes?.tipo !== "cartao" || !antes.disc) return;
        if (alvo.data?.tipo === "fantasma") return adicionar(antes.disc.codigo, alvo.data.turma);
        if (alvo.id === "grade") {
          const unica = encaixarTurmas(antes.disc, p.itens, p.bloqueios);
          if (unica.length === 1 && unica[0]!.cabe) return adicionar(antes.disc.codigo, unica[0]!.turma);
          abrir(antes.disc, null);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-3 max-lg:order-2 lg:sticky lg:top-[calc(var(--spacing-barra,3.5rem)+0.75rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          {escolha && <Escolha disc={escolha} encaixes={encaixes} naGrade={p.itens.find((i) => i.codigo === escolha.codigo)?.turma} rotuloSem={p.rotuloSem} previa={previa} setPrevia={setPrevia} onAdicionar={(t) => adicionar(escolha.codigo, t)} onFechar={fechar} />}
          <div className={cn(escolha && "lg:hidden", "space-y-3")}>
            {p.semArvore
              ? <p className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">Sem currículo carregado para o seu perfil, não há proposta para mostrar. Use a busca abaixo.</p>
              : <Candidatos grupos={p.grupos} itens={p.itens} rotuloSem={p.rotuloSem} onAdicionar={(c, el) => c.oferta && abrir(c.oferta, el)} />}
            <Busca ano={p.ano} periodo={p.periodo} rotuloSem={p.rotuloSem} onEscolher={(d, el) => abrir(d, el)} />
          </div>
        </div>

        <div className="space-y-2 max-lg:order-1">
          <AlvoGrade removendo={arrastando?.tipo === "item"}>
            <GradeSemanal itens={comId} bloco={bloco} />
          </AlvoGrade>
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{pendente ? "Atualizando a grade…" : aviso}</p>
          {erro && <p role="alert" className="text-sm text-conflito">{erro}</p>}
          <p className="text-xs text-muted-foreground">Arraste uma disciplina para a grade e solte numa turma. Para tirar, arraste o bloco para fora da grade ou use Remover. No celular, segure o dedo no cartão por um instante, ou use Adicionar.</p>
        </div>
      </div>
    </DragDropProvider>
  );
}

function AlvoGrade({ removendo, children }: { removendo: boolean; children: ReactNode }) {
  const { ref: refGrade } = useDroppable({ id: "grade", collisionDetector: porPonteiro, collisionPriority: 1 });
  const { ref: refFora, isDropTarget } = useDroppable({ id: "remover", disabled: !removendo, collisionDetector: porPonteiro, collisionPriority: 2 });
  return (
    <div ref={refGrade} className="relative">
      {children}
      {removendo && (
        <div ref={refFora} className={cn("absolute inset-x-0 top-0 z-20 flex h-10 items-center justify-center gap-2 rounded-t-xl border-2 border-dashed text-sm font-medium", isDropTarget ? "border-conflito bg-conflito-bg text-conflito" : "border-conflito-borda bg-card text-conflito")}>
          <Trash2 className="size-4" aria-hidden />Solte aqui para remover da grade
        </div>
      )}
    </div>
  );
}

function BlocoFantasma({ it, base, conflita, apagado }: { it: ItemSemanal; base: BaseBloco; conflita: boolean; apagado: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: it.id!, data: { tipo: "fantasma", turma: it.id!.split(":")[1] }, collisionDetector: porPonteiro, collisionPriority: 3 });
  return (
    <div ref={ref} role="group" aria-label={`Pré-visualização: ${base.aria}${conflita ? ", conflita" : ", cabe"}`} title={base.aria}
      className={cn(base.cls, "z-10 border-2", conflita ? "border-solid" : "border-dashed", apagado && "opacity-45", isDropTarget && "ring-3 ring-ring")} style={base.estilo}>
      <span className="flex items-center gap-0.5 font-mono font-semibold">
        {conflita ? <OctagonX className="size-3 shrink-0" aria-hidden /> : <Plus className="size-3 shrink-0" aria-hidden />}
        <span className="min-w-0 break-words">{nomeDoItem(it)}</span>
      </span>
      <span className="tabular block opacity-90">{it.inicio}–{it.fim}</span>
    </div>
  );
}

function BlocoItem({ it, base }: { it: ItemSemanal; base: BaseBloco }) {
  const { ref } = useDraggable({ id: it.id!, data: { tipo: "item", codigo: it.codigo, rotulo: nomeDoItem(it) } });
  return <Link ref={ref} href={it.href ?? "#"} draggable={false} aria-label={`${base.aria}. Arraste para fora da grade para remover.`} title={base.aria} className={cn(base.cls, "touch-manipulation")} style={base.estilo}>{base.conteudo}</Link>;
}

function Candidatos({ grupos, itens, rotuloSem, onAdicionar }: { grupos: Grupo[]; itens: ItemGrade[]; rotuloSem: string; onAdicionar: (c: CartaoComSituacao, el: HTMLElement) => void }) {
  if (grupos.length === 0) return <p className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">Nada faltando na sua árvore.</p>;
  return (
    <section aria-labelledby="h-prop" className="space-y-3">
      <h2 id="h-prop" className="font-heading text-lg font-semibold">Pode cursar em {rotuloSem}</h2>
      {grupos.map((g) => (
        <div key={String(g.semestre)} className="space-y-1.5">
          <h3 className="sticky top-0 z-10 bg-background py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{ordinal(g.semestre)}</h3>
          <ul className="space-y-1.5">{g.cartoes.map((c) => <li key={c.codigo}><CartaoCand c={c} naGrade={itens.find((i) => i.codigo === c.codigo)} rotuloSem={rotuloSem} onAdicionar={onAdicionar} /></li>)}</ul>
        </div>
      ))}
    </section>
  );
}

function CartaoCand({ c, naGrade, rotuloSem, onAdicionar }: { c: CartaoComSituacao; naGrade?: ItemGrade; rotuloSem: string; onAdicionar: (c: CartaoComSituacao, el: HTMLElement) => void }) {
  const livre = c.situacao.tipo === "livre";
  const { ref, handleRef, isDragSource } = useDraggable({ id: `cartao:${c.codigo}`, data: { tipo: "cartao", codigo: c.codigo, rotulo: c.codigo }, disabled: !livre });
  return (
    <div ref={ref} className={cn("flex items-start gap-1.5 rounded-lg border bg-card p-2 text-sm", !livre && "bg-muted/40 text-muted-foreground", isDragSource && "opacity-60", livre && "touch-manipulation")}>
      {livre
        ? <button ref={handleRef} type="button" className="mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing" aria-label={`Arrastar ${c.codigo} ${c.nome} para a grade`}><GripVertical className="size-4" aria-hidden /></button>
        : <span className="mt-0.5 size-5 shrink-0" aria-hidden />}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-mono font-semibold">{c.codigo}</span><span className="tabular text-xs text-muted-foreground">{c.creditos} cr.</span></p>
        <p className="leading-snug [overflow-wrap:anywhere]">{c.nome}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {c.situacao.tipo === "travada" && <><EstadoBadge estado="travada" /><span className="text-xs">{c.situacao.motivo}</span></>}
          {c.situacao.tipo === "sem-oferta" && <span className="text-xs" title={c.situacao.motivo}>sem oferta em {rotuloSem}</span>}
          {livre && naGrade && <EstadoBadge estado="planejada" rotulo={`Na grade · turma ${naGrade.turma}`} />}
          {livre && c.oferta?.tipo === "previsao" && <AvisoBadge nivel="previsao" />}
          {c.prereqDesconhecido && <AvisoBadge nivel="naoverificado" rotulo="pré-requisito não verificado" />}
        </div>
      </div>
      {livre && <Button type="button" size="sm" variant="outline" onClick={(e) => onAdicionar(c, e.currentTarget)} aria-label={`${naGrade ? "Trocar turma de" : "Adicionar"} ${c.codigo}`}>{naGrade ? "Trocar" : "Adicionar"}</Button>}
    </div>
  );
}

function Escolha({ disc, encaixes, naGrade, rotuloSem, previa, setPrevia, onAdicionar, onFechar }: { disc: DisciplinaOferta; encaixes: Encaixe[]; naGrade?: string; rotuloSem: string; previa: string | null; setPrevia: (t: string | null) => void; onAdicionar: (t: string) => void; onFechar: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), [disc.codigo]);
  return (
    <section aria-labelledby="h-escolha" onKeyDown={(e) => e.key === "Escape" && onFechar()}
      className="space-y-2 rounded-xl border bg-card p-3 text-sm max-lg:fixed max-lg:inset-x-2 max-lg:bottom-[4.5rem] max-lg:z-40 max-lg:max-h-[55dvh] max-lg:overflow-y-auto max-lg:shadow-elevada">
      <div className="flex items-start gap-2">
        <h2 id="h-escolha" ref={titulo} tabIndex={-1} className="min-w-0 flex-1 text-base font-semibold outline-none"><span className="font-mono">{disc.codigo}</span> {disc.nome}</h2>
        <Button type="button" size="icon-sm" variant="ghost" onClick={onFechar}><X aria-hidden /><span className="sr-only">Fechar escolha de turma</span></Button>
      </div>
      {disc.tipo === "previsao" && <p className="flex flex-wrap items-center gap-1.5 text-xs"><AvisoBadge nivel="previsao" /><span>horários de {rotuloSem} previstos a partir de {disc.evidencias}</span></p>}
      {disc.turmas.length === 0 && <p className="text-muted-foreground">Nenhuma turma em {rotuloSem}.</p>}
      <ul className="space-y-1.5">
        {disc.turmas.map((t) => {
          const e = encaixes.find((x) => x.turma === t.turma);
          const atual = naGrade === t.turma;
          return (
            <li key={t.turma} onMouseEnter={() => setPrevia(t.turma)} onMouseLeave={() => setPrevia(null)} onFocus={() => setPrevia(t.turma)} onBlur={() => setPrevia(null)}
              className={cn("space-y-1 rounded-lg border p-2", previa === t.turma && "border-foreground/40 bg-accent")}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>Turma {t.turma}</strong>
                {e?.cabe ? <span className="inline-flex items-center gap-1 text-xs text-cursada"><CheckCircle2 className="size-3.5" aria-hidden />cabe</span> : <AvisoBadge nivel="conflito" rotulo="conflita" />}
                {e?.semHorario && <AvisoBadge nivel="naoverificado" rotulo="sem horário" />}
                {t.horarioIncompleto && <AvisoBadge nivel="naoverificado" rotulo="horário incompleto" />}
                <Button type="button" size="sm" variant={e?.cabe ? "default" : "outline"} className="ml-auto" disabled={atual} onClick={() => onAdicionar(t.turma)}>{atual ? "Na grade" : naGrade ? "Trocar para esta" : "Adicionar"}<span className="sr-only"> turma {t.turma}</span></Button>
              </div>
              <p className="tabular text-xs text-muted-foreground">{resumoHorarios(t.horarios)}</p>
              {t.docentes.length > 0 && <p className="text-xs text-muted-foreground">{t.docentes.join(", ")}</p>}
              {e?.conflitos.map((m, i) => <p key={i} className="text-xs text-conflito">{m}</p>)}
              {e?.avisos.map((m, i) => <p key={i} className="text-xs text-aviso">{m}</p>)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Busca recolhida, só para o que está fora da proposta. Tudo no cliente: server action, sem navegação, sem tocar na rolagem. */
function Busca({ ano, periodo, rotuloSem, onEscolher }: { ano: number; periodo: 1 | 2; rotuloSem: string; onEscolher: (d: DisciplinaOferta, el: HTMLElement) => void }) {
  const [q, setQ] = useState("");
  const [resBruto, setRes] = useState<ResultadoBusca | null>(null);
  const [msg, setMsg] = useState("");
  const res = q.trim() ? resBruto : null;
  const seq = useRef(0);
  useEffect(() => {
    const termo = q.trim();
    const n = ++seq.current;
    if (!termo) return;
    const t = setTimeout(async () => { const r = await buscarAcao({ q: termo }); if (n === seq.current) setRes(r); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  async function escolher(codigo: string, el: HTMLElement) {
    setMsg("");
    const r = await ofertaAcao({ codigo, ano, periodo });
    if ("erro" in r) setMsg(r.erro);
    else if (!r.oferta) setMsg(`${codigo}: ${r.motivo}.`);
    else onEscolher(r.oferta, el);
  }
  return (
    <details className="group rounded-xl border bg-card p-3 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 font-medium"><Search className="size-4" aria-hidden />Adicionar disciplina fora da proposta<ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden /></summary>
      <div className="mt-3 space-y-2">
        <label className="block"><span className="sr-only">Código ou nome da disciplina</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código ou nome (MC102, cálculo)" autoComplete="off" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" /></label>
        <div role="status" aria-live="polite">
          {res && "erro" in res && <p className="text-conflito">{res.erro}</p>}
          {res && "disciplinas" in res && res.disciplinas.length === 0 && <p className="text-muted-foreground">Nada encontrado para “{q.trim()}”.</p>}
          {msg && <p className="text-muted-foreground">{msg}</p>}
        </div>
        {res && "disciplinas" in res && res.disciplinas.length > 0 && (
          <ul className="divide-y">
            {res.disciplinas.map((d) => (
              <li key={d.codigo} className="flex items-center gap-2 py-1.5">
                <span className="min-w-0 flex-1"><span className="font-mono font-semibold">{d.codigo}</span> <span className="[overflow-wrap:anywhere]">{d.nome}</span></span>
                <Button type="button" size="sm" variant="outline" onClick={(e) => escolher(d.codigo, e.currentTarget)}>Turmas em {rotuloSem}<span className="sr-only"> de {d.codigo}</span></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
