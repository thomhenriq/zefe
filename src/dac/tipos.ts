export type Dia = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
export type Campus = 'limeira' | 'barao' | 'piracicaba' | 'desconhecido';

export interface Horario { dia: Dia; inicio: string; fim: string; sala: string } // "HH:MM"
export interface Turma {
  turma: string;
  vagas: number | null;
  matriculados: number | null;
  horarios: Horario[];
  docentes: string[];
  reservas: string[];
  horarioIncompleto?: boolean; // alguma linha de horário não foi entendida
}
export interface Fonte { url: string; ano: number; periodo: 1 | 2; coletadoEm: string }
export interface Disciplina {
  codigo: string;
  nome: string;
  creditos: number | null;
  instituto: string;
  campus: Campus;
  turmas: Turma[];
  fonte: Fonte;
}

export class ErroParse extends Error {
  override name = 'ErroParse';
}

/** Semestre letivo em curso numa data: fev–jul = 1º, ago–dez = 2º, jan = 2º do ano anterior. */
export function semestreDe(d: Date): { ano: number; periodo: 1 | 2 } {
  const m = d.getMonth();
  if (m === 0) return { ano: d.getFullYear() - 1, periodo: 2 };
  return { ano: d.getFullYear(), periodo: m <= 6 ? 1 : 2 };
}

const LIMEIRA = new Set(['FT', 'FCA']);

// shortcut: campus pelo instituto; CEL e REIT existem nos dois campi, tratados como Barão
export function campusDoInstituto(sigla: string): Campus {
  if (!sigla) return 'desconhecido';
  if (LIMEIRA.has(sigla)) return 'limeira';
  if (sigla === 'FOP') return 'piracicaba';
  return 'barao';
}

export interface Requisito { codigo: string; parcial: boolean }
export interface EntradaCatalogo { codigo: string; nome: string; creditos: number | null; ementa: string | null; prereqTexto: string; alternativas: Requisito[][] }
export interface GrupoEletiva { creditos: number; texto: string; codigos: string[] | null; verificado: boolean }
export interface CurriculoPleno {
  curso: number;
  nomeCurso: string;
  modalidades: { sigla: string | null; nome: string | null; obrigatorias: string[]; eletivas: GrupoEletiva[] }[];
}
export interface PropostaSemestre { semestre: number; codigos: string[]; creditosEletivos: number }
export interface Proposta { modalidade: string | null; semestres: PropostaSemestre[] }
export type Estado = 'cursada' | 'cursando' | 'planejada' | 'faltando' | 'travada';
