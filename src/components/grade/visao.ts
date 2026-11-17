import type { Dia, Horario } from "@/dac/tipos";
import type { Achado, Bloqueio, ItemGrade } from "@/dominio/grade";
import type { Sem } from "@/dominio/semestre";
import type { ItemGrade as ItemSemanal } from "./GradeSemanal";

const NOME_DIA: Record<Dia, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb" };

/** Itens para a GradeSemanal: conflito vence previsão, que vence o tom de planejada; bloqueio usa "travada". */
export function itensSemanais(itens: ItemGrade[], bloqueios: Bloqueio[], achados: Achado[]): ItemSemanal[] {
  const emConflito = new Set<string>();
  const bloqueiosEmConflito = new Set<string>();
  for (const a of achados) {
    if (a.nivel !== "conflito" || !a.dia) continue;
    for (const c of a.codigos) emConflito.add(`${a.dia}|${c}`);
    // o achado só traz códigos de aulas: o bloqueio sobreposto é achado pela própria sobreposição de horários
    for (const b of bloqueios) if (b.dia === a.dia && a.codigos.some((c) => itens.some((i) => i.codigo === c && i.horarios.some((h) => h.dia === b.dia && h.inicio < b.fim && b.inicio < h.fim)))) bloqueiosEmConflito.add(b.id);
  }
  const aulas = itens.flatMap((it) =>
    it.horarios.map((h): ItemSemanal => ({
      rotulo: `${it.codigo} ${it.turma}`, dia: h.dia, inicio: h.inicio, fim: h.fim,
      tom: emConflito.has(`${h.dia}|${it.codigo}`) ? "conflito" : it.tipo === "previsao" ? "previsao" : "planejada",
      href: `/disciplina/${it.codigo}`,
    })),
  );
  const blocos = bloqueios.map((b): ItemSemanal => ({ rotulo: b.nome, dia: b.dia, inicio: b.inicio, fim: b.fim, tom: bloqueiosEmConflito.has(b.id) ? "conflito" : "travada" }));
  return [...aulas, ...blocos];
}

/** Itens que não aparecem (ou aparecem só em parte) na grade: sem horário ou com horário incompleto. */
export const semHorario = (itens: ItemGrade[]) => itens.filter((i) => i.horarios.length === 0 || i.horarioIncompleto);

export const agruparAchados = (achados: Achado[]) => ({
  conflito: achados.filter((a) => a.nivel === "conflito"),
  aviso: achados.filter((a) => a.nivel === "aviso"),
});

export const resumoHorarios = (hs: Horario[]) =>
  hs.length ? hs.map((h) => `${NOME_DIA[h.dia]} ${h.inicio}–${h.fim}${h.sala ? ` (${h.sala})` : ""}`).join(" · ") : "sem horário";

const chave = (s: Sem) => s.ano * 10 + s.periodo;
/** Semestres do banco desde dois anos antes do próximo, mais o próximo e o selecionado; mais recente primeiro, sem repetir. */
export function opcoesSemestre(noBanco: Sem[], proximo: Sem, selecionado: Sem): Sem[] {
  const todos = [...noBanco.filter((s) => s.ano >= proximo.ano - 2), proximo, selecionado];
  return [...new Map(todos.map((s) => [chave(s), s])).values()].sort((a, b) => chave(b) - chave(a));
}
