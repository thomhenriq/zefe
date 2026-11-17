"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { ArrowUp, Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acaoDe, validarCartao } from "@/zefe/cartoes";
import { cn } from "@/lib/utils";
import { Acao } from "./Acao";
import { CartaoFalha, CartaoZefe } from "./Cartoes";
import { Mascote } from "./Mascote";
import type { ZefeChat } from "./useZefe";

const FORA_DO_AR = "O Zefe está fora do ar agora. Tente de novo daqui a pouco; o resto do site continua funcionando normalmente.";

const rotuloFerramenta: Record<string, string> = {
  buscar_disciplinas: "Procurando disciplinas",
  oferta_disciplina: "Vendo as turmas",
  buscar_turmas: "Procurando turmas que cabem",
  prerequisitos: "Conferindo pré-requisitos",
  meu_progresso: "Olhando seu progresso",
  ver_grade: "Olhando sua grade",
  alterar_grade: "Mexendo na grade",
  marcar_historico: "Marcando no histórico",
  criar_bloqueio: "Criando o bloqueio",
  remover_bloqueio: "Removendo o bloqueio",
};

/** Sugestões curtas por tela. */
export function sugestoes(caminho: string): string[] {
  if (caminho.startsWith("/planejador")) return ["Tem conflito na minha grade?", "O que posso cursar na terça à noite?", "Quais turmas de SI702 existem?"];
  if (caminho.startsWith("/arvore")) return ["O que falta pra eu me formar?", "O que está travado por pré-requisito?", "Quanto já fiz de eletivas?"];
  if (caminho.startsWith("/disciplina/")) return ["Quais as turmas dessa disciplina?", "Tenho o pré-requisito dela?", "Adiciona na minha grade"];
  return ["O que falta pra eu me formar?", "Que disciplinas cabem na minha grade?", "Tem conflito na minha grade?"];
}

/** O modelo às vezes escreve markdown mesmo sem ser pedido: negrito vira negrito, marcas de título somem; o resto fica texto. */
function Texto({ t }: { t: string }) {
  return (
    <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap">
      {t.replace(/^#{1,6}\s+/gm, "").split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <strong key={i}>{x}</strong> : x))}
    </p>
  );
}

function Resultado({ acao, v, saida, desfeitaInicial }: { acao: ReturnType<typeof acaoDe>; v: ReturnType<typeof validarCartao>; saida: unknown; desfeitaInicial: boolean }) {
  const [desfeita, setDesfeita] = useState(desfeitaInicial);
  return (
    <div className="flex flex-col gap-2">
      {acao && <Acao acaoId={acao.acaoId} descricao={acao.descricao} desfeitaInicial={desfeitaInicial} aoDesfazer={() => setDesfeita(true)} />}
      {v.ok ? v.cartao && <CartaoZefe cartao={v.cartao} desatualizado={desfeita && v.cartao.tipo === "grade"} /> : <CartaoFalha saida={saida} />}
    </div>
  );
}

function Partes({ m, desfeitas }: { m: UIMessage; desfeitas: number[] }) {
  if (m.role === "user") {
    return <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3 py-2 text-sm whitespace-pre-wrap">{m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {m.parts.map((p, i) => {
        if (p.type === "text") return p.text.trim() ? <Texto key={i} t={p.text} /> : null;
        if (!isToolUIPart(p)) return null;
        const nome = getToolName(p);
        if (p.state === "output-available") {
          const v = validarCartao(nome, p.output);
          const acao = acaoDe(p.output);
          return <Resultado key={i} acao={acao} v={v} saida={p.output} desfeitaInicial={!!acao && desfeitas.includes(acao.acaoId)} />;
        }
        if (p.state === "output-error") return <p key={i} className="text-xs text-muted-foreground">Uma consulta não deu certo; o Zefe vai tentar de outro jeito.</p>;
        return (
          <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden />
            {rotuloFerramenta[nome] ?? "Consultando"}…
          </p>
        );
      })}
    </div>
  );
}

export function Conversa({ zefe }: { zefe: ZefeChat }) {
  const { messages, sendMessage, ocupado, estado, error, novaConversa, carregada, caminho, desfeitas } = zefe;
  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);
  const idTexto = useId(); // o painel existe na lateral e na gaveta: id próprio por instância

  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [messages, error]);

  function enviar(t: string) {
    const limpo = t.trim();
    if (!limpo || ocupado) return;
    setTexto("");
    void sendMessage({ text: limpo });
  }

  const vazia = messages.length === 0;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b py-2 pr-12 pl-4">
        <Mascote estado={estado} tamanho={32} decorativo />
        <h2 className="font-heading text-base font-semibold">Zefe</h2>
        <Button variant="ghost" size="xs" className="ml-auto" onClick={novaConversa} disabled={vazia && !ocupado} aria-label="Nova conversa">
          <MessageSquarePlus aria-hidden /> Nova conversa
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" role="log" aria-live="polite" aria-label="Conversa com o Zefe">
        {vazia && carregada ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Mascote estado={estado} tamanho={96} />
            <p className="max-w-[28ch] text-sm text-muted-foreground">Oi! Eu ajudo com a grade, os pré-requisitos e o que falta pra você se formar.</p>
            <ul className="flex w-full flex-col gap-1.5">
              {sugestoes(caminho).map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => enviar(s)} className="w-full rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => <Partes key={m.id} m={m} desfeitas={desfeitas} />)}
            {ocupado && messages.at(-1)?.role === "user" && <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status"><Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden />Pensando…</p>}
            {error && <p role="alert" className="rounded-lg border border-aviso-borda bg-aviso-bg px-3 py-2 text-sm text-aviso">{FORA_DO_AR}</p>}
          </div>
        )}
        <div ref={fim} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex items-end gap-2 border-t p-3">
        <label htmlFor={idTexto} className="sr-only">Pergunte ao Zefe</label>
        <textarea
          id={idTexto}
          value={texto}
          rows={1}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(texto); } }}
          placeholder="Pergunte ao Zefe…"
          className={cn("max-h-28 min-h-9 flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none", "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50")}
        />
        <Button type="submit" size="icon" disabled={ocupado || !texto.trim()} aria-label="Enviar">
          <ArrowUp aria-hidden />
        </Button>
      </form>
    </div>
  );
}
