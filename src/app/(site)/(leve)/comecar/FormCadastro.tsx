"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { campo } from "../entrar/FormEntrar";
import { concluirCadastro, consultarCurriculo, type InfoCurriculo } from "./acoes";

type Curso = { numero: number; nome: string; turno: string | null };
type Inicial = { curso: number | null; catalogo: number | null; modalidade: string | null; ingresso: number | null; semestreAtual: number | null };

const ANOS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];
const semAcento = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function FormCadastro({ cursos, inicial }: { cursos: Curso[]; inicial: Inicial | null }) {
  const [busca, setBusca] = useState("");
  const [curso, setCurso] = useState<number | null>(inicial?.curso ?? null);
  const [ingresso, setIngresso] = useState<number>(inicial?.ingresso ?? 2026);
  const [catalogo, setCatalogo] = useState<number>(inicial?.catalogo ?? inicial?.ingresso ?? 2026);
  const [modalidade, setModalidade] = useState<string | null>(inicial?.modalidade ?? null);
  const [semestre, setSemestre] = useState<number | null>(inicial?.semestreAtual ?? null);
  const [lido, setLido] = useState<{ chave: string; info: InfoCurriculo | null } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const filtrados = useMemo(() => {
    const q = semAcento(busca.trim());
    return cursos.filter((c) => !q || semAcento(c.nome).includes(q) || String(c.numero).startsWith(q));
  }, [busca, cursos]);

  const escolhido = cursos.find((c) => c.numero === curso);
  const chave = `${curso}/${catalogo}/${modalidade}`;
  useEffect(() => {
    if (curso === null) return;
    let ativo = true;
    consultarCurriculo({ curso, catalogo, modalidade })
      .then((info) => ativo && setLido({ chave, info }))
      .catch(() => ativo && setLido({ chave, info: null })); // info null = consulta falhou
    return () => { ativo = false; };
  }, [curso, catalogo, modalidade, chave]);

  // Resposta de outra combinação (curso mudou há pouco) não vale: espera a atual.
  const carregando = curso !== null && lido?.chave !== chave;
  const falhou = !carregando && lido?.info === null;
  const info = carregando ? null : lido?.info ?? null;

  const precisaModalidade = modalidade !== null || (info?.modalidades.length ?? 0) > 0;
  const semProposta = info !== null && !info.carregado;
  const maxSem = info?.carregado ? info.semestres : 12; // sem proposta carregada o limite é livre; o servidor revalida
  const pronto = !carregando && !falhou && curso !== null && semestre !== null && (!precisaModalidade || modalidade !== null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pronto) return;
    setErro(null);
    iniciar(async () => {
      const r = await concluirCadastro({ curso, catalogo, modalidade: precisaModalidade ? modalidade : null, ingresso, semestreAtual: semestre });
      if (r?.erro) setErro(r.erro); // em sucesso o servidor redireciona
    });
  }

  const titulo = "text-xl font-bold";
  return (
    <form onSubmit={enviar} className="mt-10 space-y-10">
      <fieldset className="space-y-3">
        <legend className={titulo}>1. Qual é o seu curso?</legend>
        <label htmlFor="busca-curso" className="sr-only">Buscar curso por nome ou número</label>
        <input id="busca-curso" type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou número" className={campo} />
        {escolhido && (
          <p className="flex items-center gap-2 rounded-xl border border-link/40 bg-accent px-4 py-3 text-sm" aria-live="polite">
            <Check className="size-4 shrink-0 text-link" aria-hidden />
            <span>Curso escolhido: <span className="tabular-nums">{escolhido.numero}</span> <strong className="font-bold">{escolhido.nome}</strong></span>
          </p>
        )}
        <div role="radiogroup" aria-label="Cursos" className="max-h-64 divide-y overflow-y-auto rounded-xl border bg-card">
          {filtrados.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum curso encontrado.</p>}
          {filtrados.map((c) => (
            <label key={c.numero} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset">
              <input type="radio" name="curso" value={c.numero} checked={curso === c.numero}
                onChange={() => { setCurso(c.numero); setModalidade(null); setSemestre(null); }} className="accent-link" />
              <span className="tabular-nums text-muted-foreground">{c.numero}</span>
              <span className="flex-1">{c.nome}</span>
              {c.turno && <span className="text-xs text-muted-foreground">{c.turno}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="ingresso" className={titulo}>2. Ano de ingresso</label>
          <select id="ingresso" value={ingresso} className={campo}
            onChange={(e) => { const a = Number(e.target.value); setIngresso(a); setCatalogo(a); setModalidade(null); setSemestre(null); }}>
            {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <p className="text-sm text-muted-foreground">O Zefe atende quem entrou de 2020 em diante.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="catalogo" className={titulo}>Catálogo (currículo)</label>
          <select id="catalogo" value={catalogo} className={campo}
            onChange={(e) => { setCatalogo(Number(e.target.value)); setModalidade(null); setSemestre(null); }}>
            {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <p className="text-sm text-muted-foreground">Igual ao ingresso, salvo se você migrou de catálogo.</p>
        </div>
      </div>

      {falhou && (
        <p role="alert" className="text-sm text-destructive">Não foi possível consultar o currículo. Recarregue a página e tente de novo.</p>
      )}

      {curso !== null && semProposta && (
        <p role="status" className="flex gap-2 rounded-xl border border-dashed border-naoverificado-borda bg-naoverificado-bg p-4 text-sm text-naoverificado">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>O catálogo {catalogo} deste curso ainda não foi carregado. Você pode continuar, mas nada será pré-marcado como cursado.</span>
        </p>
      )}

      {curso !== null && precisaModalidade && (
        <div className="space-y-2">
          <label htmlFor="modalidade" className={titulo}>3. Modalidade</label>
          <select id="modalidade" value={modalidade ?? ""} className={campo}
            onChange={(e) => { setModalidade(e.target.value || null); setSemestre(null); }}>
            <option value="">Escolha…</option>
            {info?.modalidades.map((m) => <option key={m.sigla} value={m.sigla}>{m.sigla}{m.nome ? ` · ${m.nome}` : ""}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="semestre" className={titulo}>{precisaModalidade ? "4" : "3"}. Em que semestre do curso você está?</label>
        <select id="semestre" value={semestre ?? ""} className={campo} disabled={curso === null || carregando || falhou || (precisaModalidade && modalidade === null)}
          onChange={(e) => setSemestre(e.target.value === "" ? null : Number(e.target.value))}>
          <option value="">Escolha…</option>
          <option value={0}>Ainda não comecei</option>
          {Array.from({ length: maxSem }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}º semestre</option>)}
        </select>
      </div>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={!pronto || enviando} className="w-full sm:w-auto sm:px-8">
        {enviando ? "Salvando…" : "Concluir"}
      </Button>
    </form>
  );
}
