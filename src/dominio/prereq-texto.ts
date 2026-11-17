/** Sem alternativas lidas: "nenhum" só se o catálogo diz isso ("Não há pré-requisitos…"); texto com conteúdo é regra não entendida. */
export function situacaoPrereq(texto: string | null | undefined, nAlternativas: number): "lidos" | "nenhum" | "naoverificado" {
  if (nAlternativas > 0) return "lidos";
  const t = (texto ?? "").trim();
  return !t || /^n[aã]o h[aá]\s|^sem pr[eé]-?requisito/i.test(t) ? "nenhum" : "naoverificado";
}
