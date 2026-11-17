"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Situacao = { tipo: "pronta" } | { tipo: "enviando" } | { tipo: "desfeita" } | { tipo: "erro"; motivo: string };

/** Item de ação no chat: o que o Zefe mudou, com botão desfazer. A tela atrás é atualizada depois de desfazer. */
export function Acao({ acaoId, descricao }: { acaoId: number; descricao: string }) {
  const router = useRouter();
  const [s, setS] = useState<Situacao>({ tipo: "pronta" });

  async function desfazer() {
    setS({ tipo: "enviando" });
    try {
      const r = await fetch("/api/zefe/desfazer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acaoId }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; motivo?: string };
      if (j.ok || j.motivo === "essa ação já foi desfeita") setS({ tipo: "desfeita" });
      else setS({ tipo: "erro", motivo: j.motivo ?? "não consegui desfazer" });
      router.refresh();
    } catch {
      setS({ tipo: "erro", motivo: "não consegui desfazer agora" });
    }
  }

  const desfeita = s.tipo === "desfeita";
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2 text-sm" data-acao={acaoId}>
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cursada" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={desfeita ? "text-muted-foreground line-through" : undefined}>{descricao}</p>
        {desfeita && <p className="text-xs font-medium text-muted-foreground">Desfeito</p>}
        {s.tipo === "erro" && <p role="alert" className="text-xs text-destructive">{s.motivo}</p>}
      </div>
      {!desfeita && (
        <Button variant="outline" size="xs" onClick={desfazer} disabled={s.tipo === "enviando"} className="shrink-0">
          <Undo2 aria-hidden />
          {s.tipo === "enviando" ? "Desfazendo" : "Desfazer"}
        </Button>
      )}
    </div>
  );
}
