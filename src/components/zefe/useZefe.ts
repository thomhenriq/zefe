"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { acaoDe } from "@/zefe/cartoes";
import type { EstadoMascote } from "./Mascote";

const CABECALHO = "x-zefe-conversa";

/** Tela atual para o assistente: rota, grade do planejador (?grade=) e código da disciplina (/disciplina/<codigo>). */
function telaAtual(caminho: string) {
  const grade = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("grade");
  const codigo = caminho.startsWith("/disciplina/") ? decodeURIComponent(caminho.split("/")[2] ?? "") : undefined;
  return { rota: caminho, ...(grade && caminho.startsWith("/planejador") ? { gradeId: grade } : {}), ...(codigo ? { codigo } : {}) };
}

/**
 * Estado único da conversa (a casca renderiza o painel em dois lugares: lateral e gaveta).
 * Só fala com o servidor se `ativo` (e-mail liberado).
 */
export function useZefe(ativo: boolean) {
  const router = useRouter();
  const caminho = usePathname();
  // Objeto mutável estável: o transporte lê rota e conversa atuais na hora de enviar, sem recriar o chat.
  const [est] = useState(() => {
    const e = { caminho, conversaId: null as number | null, definir(c: { caminho?: string; conversaId?: number | null }) { Object.assign(e, c); } };
    return e;
  });
  const [carregada, setCarregada] = useState(!ativo);
  const [feliz, setFeliz] = useState(false);
  const [desfeitas, setDesfeitas] = useState<number[]>([]);

  useEffect(() => { est.definir({ caminho }); }, [est, caminho]);

  const [transporte] = useState(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/zefe",
        fetch: (async (entrada: URL | RequestInfo, init?: RequestInit) => {
          const r = await fetch(entrada, init);
          const id = Number(r.headers.get(CABECALHO));
          if (id) est.definir({ conversaId: id });
          return r;
        }) as typeof fetch,
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { conversaId: est.conversaId ?? undefined, mensagens: messages.slice(-1), tela: telaAtual(est.caminho) },
        }),
      }),
  );
  const chat = useChat<UIMessage>({
    transport: transporte,
    // Ferramenta que alterou dados (tem acaoId): atualiza a página atrás do painel e deixa o Zefe feliz por um instante.
    onFinish: ({ message }) => {
      if (!message.parts.some((p) => isToolUIPart(p) && p.state === "output-available" && acaoDe(p.output))) return;
      router.refresh();
      setFeliz(true);
    },
  });
  const { messages, setMessages, status, stop } = chat;

  // Continua a última conversa ao abrir.
  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    fetch("/api/zefe/conversa")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { conversaId: number | null; mensagens: UIMessage[]; desfeitas?: number[] } | null) => {
        if (!vivo || !j) return;
        est.definir({ conversaId: j.conversaId });
        setDesfeitas(j.desfeitas ?? []);
        setMessages((atual) => (atual.length ? atual : j.mensagens));
      })
      .catch(() => {})
      .finally(() => vivo && setCarregada(true));
    return () => { vivo = false; };
  }, [ativo, est, setMessages]);

  useEffect(() => {
    if (!feliz) return;
    const t = setTimeout(() => setFeliz(false), 2500);
    return () => clearTimeout(t);
  }, [feliz]);

  const novaConversa = useCallback(() => {
    void stop();
    est.definir({ conversaId: null });
    setMessages([]);
    setDesfeitas([]);
    setFeliz(false);
  }, [stop, setMessages, est]);

  const ocupado = status === "submitted" || status === "streaming";
  const estado: EstadoMascote = ocupado ? "pensando" : feliz ? "feliz" : "parado";
  return { ...chat, messages, ocupado, estado, carregada, novaConversa, caminho, desfeitas };
}

export type ZefeChat = ReturnType<typeof useZefe>;
