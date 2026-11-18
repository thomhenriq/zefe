import type { Campus, Horario } from '@/dac/tipos';
import { checarGrade, type Bloqueio, type ItemGrade, type OpcoesChecagem } from './grade';

/** Turma como o planejador a enxerga: sem vagas nem matriculados (previsão nunca mostra, oficial não é preciso aqui). */
export interface TurmaOferta { turma: string; horarios: Horario[]; docentes: string[]; reservas: string[]; horarioIncompleto?: boolean }
export interface DisciplinaOferta { codigo: string; nome: string; creditos: number | null; campus: Campus; tipo: 'oficial' | 'previsao'; evidencias?: string; turmas: TurmaOferta[] }
export interface Encaixe { turma: string; cabe: boolean; semHorario: boolean; conflitos: string[]; avisos: string[] }

/**
 * Para cada turma da disciplina: cabe na grade atual (+ bloqueios)? A regra é a do `checarGrade`, a mesma que a
 * página usa depois de gravar; aqui só se olha o que envolve a disciplina (conflitos antigos da grade não contam).
 * A mesma disciplina já na grade sai da conta: adicionar de novo troca a turma.
 */
export function encaixarTurmas(d: DisciplinaOferta, itens: ItemGrade[], bloqueios: Bloqueio[], opts: OpcoesChecagem = {}): Encaixe[] {
  const base = itens.filter((i) => i.codigo !== d.codigo);
  return d.turmas.map((t) => {
    const cand: ItemGrade = { codigo: d.codigo, nome: d.nome, turma: t.turma, creditos: d.creditos, campus: d.campus, horarios: t.horarios, tipo: d.tipo, reservas: t.reservas, ...(t.horarioIncompleto ? { horarioIncompleto: true } : {}) };
    const meus = checarGrade([...base, cand], bloqueios, { ...(opts.curso !== undefined ? { curso: opts.curso } : {}) }).achados.filter((a) => a.codigos.includes(d.codigo));
    const conflitos = meus.filter((a) => a.nivel === 'conflito').map((a) => a.motivo);
    // avisos específicos da turma (margem entre campi, reserva, créditos, horário incompleto); previsão e pré-requisito valem para a disciplina e a página já mostra
    const avisos = meus.filter((a) => a.nivel === 'aviso' && !/horário previsto|pré-requisito/.test(a.motivo)).map((a) => a.motivo);
    return { turma: t.turma, cabe: conflitos.length === 0, semHorario: t.horarios.length === 0, conflitos, avisos };
  });
}

export interface Cartao {
  codigo: string; nome: string; creditos: number; semestre: number | null;
  estado: 'cursada' | 'cursando' | 'planejada' | 'faltando' | 'travada';
  faltamPrereq: string[]; prereqDesconhecido: boolean;
  oferta: DisciplinaOferta | null; semOfertaMotivo?: string;
}
export type Situacao = { tipo: 'livre' } | { tipo: 'travada'; motivo: string } | { tipo: 'sem-oferta'; motivo: string };
export type CartaoComSituacao = Cartao & { situacao: Situacao };

/**
 * Cartões do planejador por semestre sugerido (sem semestre por último); dentro do semestre, o que dá para arrastar vem primeiro.
 * `feitas`: semestre atual ou passado, em que cursando/cursada também viram cartões (reproduzir a grade que o aluno tem/teve); com oferta são arrastáveis, sem oferta ficam recolhidos com o motivo.
 */
export function agruparCandidatos(cartoes: Cartao[], feitas = false): { semestre: number | null; cartoes: CartaoComSituacao[] }[] {
  const grupos = new Map<number | null, CartaoComSituacao[]>();
  for (const c of cartoes) {
    if (!feitas && (c.estado === 'cursada' || c.estado === 'cursando')) continue;
    const situacao: Situacao = c.estado === 'travada' ? { tipo: 'travada', motivo: c.faltamPrereq.length ? `falta ${c.faltamPrereq.join(', ')}` : 'pré-requisito não cumprido' }
      : !c.oferta ? { tipo: 'sem-oferta', motivo: c.semOfertaMotivo ?? 'sem oferta' } : { tipo: 'livre' };
    grupos.set(c.semestre, [...(grupos.get(c.semestre) ?? []), { ...c, situacao }]);
  }
  return [...grupos].sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity)).map(([semestre, l]) => ({ semestre, cartoes: l.sort((a, b) => Number(a.situacao.tipo !== 'livre') - Number(b.situacao.tipo !== 'livre') || a.codigo.localeCompare(b.codigo)) }));
}
