import type { Campus, Dia, Horario } from '@/dac/tipos';

export interface ItemGrade { codigo: string; nome: string; turma: string; creditos: number | null; campus: Campus; horarios: Horario[]; tipo: 'oficial' | 'previsao'; horarioIncompleto?: boolean; reservas: string[] }
export interface Bloqueio { id: string; nome: string; dia: Dia; inicio: string; fim: string }
export interface Achado { nivel: 'conflito' | 'aviso'; dia: Dia | null; codigos: string[]; motivo: string }
export interface Checagem { ok: boolean; verificado: boolean; creditos: number; achados: Achado[] }
export interface OpcoesChecagem {
  curso?: number;
  /** Códigos de pré-requisito que faltam para `codigo` (vazio = cumprido). */
  faltamPrereq?: (codigo: string) => string[];
  /** true quando não dá para saber o pré-requisito (sem catálogo/entrada): vira aviso, nunca "cumprido". */
  prereqNaoVerificado?: (codigo: string) => boolean;
}
interface Evento { codigo: string; bloqueio: boolean; nome: string; inicio: number; fim: number; campus: Campus }

const DIAS: Dia[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const MARGEM_CAMPI_MIN = 90;
const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const NOME_CAMPUS: Record<Campus, string> = { limeira: 'Limeira', barao: 'Barão', piracicaba: 'Piracicaba', desconhecido: 'campus desconhecido' };

/**
 * ok = sem conflito. verificado = todos os horários e créditos foram lidos; sem isso, ok não garante nada.
 * Créditos null contam 0 e tornam verificado false (a soma seria um piso, não o total).
 * Reservas vêm do caderno como "89 - Engenharia Ambiental /2026"; o número antes do " - " é o código do curso.
 */
export function checarGrade(itens: ItemGrade[], bloqueios: Bloqueio[], opts: OpcoesChecagem = {}): Checagem {
  const achados: Achado[] = [];
  let verificado = true;
  let creditos = 0;
  const porDia = new Map<Dia, Evento[]>();
  const aviso = (it: ItemGrade, motivo: string) => achados.push({ nivel: 'aviso', dia: null, codigos: [it.codigo], motivo: `${it.codigo} ${it.turma}: ${motivo}` });

  for (const it of itens) {
    creditos += it.creditos ?? 0;
    if (it.creditos === null) { verificado = false; aviso(it, 'créditos não informados; contados como 0'); }
    if (it.tipo === 'previsao') aviso(it, 'horário previsto (semestre anterior), não oficial');

    if (it.reservas.length) {
      const lista = it.reservas.join('; ');
      const cursos = it.reservas.map((r) => r.match(/^\s*(\d+)\s*-/)?.[1]).filter((c): c is string => !!c).map(Number);
      if (opts.curso === undefined) aviso(it, `reservada para ${lista}; não sei seu curso para conferir`);
      else if (cursos.length === 0) aviso(it, `reservada para ${lista}; não consegui ler o código do curso na reserva`);
      else if (!cursos.includes(opts.curso)) aviso(it, `reservada para outro curso (${lista}); vaga para você (curso ${opts.curso}) incerta`);
    }

    const falta = opts.faltamPrereq?.(it.codigo) ?? [];
    if (falta.length) aviso(it, `pré-requisito não cumprido (falta ${falta.join(', ')})`);
    else if (opts.prereqNaoVerificado?.(it.codigo)) aviso(it, 'pré-requisito não verificado');

    if (it.horarioIncompleto) verificado = false;
    if (it.horarioIncompleto || !it.horarios.length) {
      verificado = false;
      aviso(it, it.horarioIncompleto ? 'horário não informado por inteiro (alguma linha do caderno não foi entendida); confira na fonte' : 'horário não informado no caderno; não dá para checar encaixe');
      if (!it.horarios.length) continue;
    }
    for (const h of it.horarios) porDia.set(h.dia, [...(porDia.get(h.dia) ?? []), { codigo: it.codigo, bloqueio: false, nome: it.nome, inicio: min(h.inicio), fim: min(h.fim), campus: it.campus }]);
  }
  for (const b of bloqueios) porDia.set(b.dia, [...(porDia.get(b.dia) ?? []), { codigo: b.nome, bloqueio: true, nome: b.nome, inicio: min(b.inicio), fim: min(b.fim), campus: 'desconhecido' }]);

  for (const dia of DIAS) {
    const evs = (porDia.get(dia) ?? []).sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);
    for (let i = 0; i < evs.length; i++) {
      for (let j = i + 1; j < evs.length; j++) {
        const a = evs[i]!, b = evs[j]!;
        if (a.bloqueio && b.bloqueio) continue; // bloqueios entre si não são problema da grade
        if (b.inicio < a.fim) {
          const quais = [a, b].map((e) => (e.bloqueio ? `o bloqueio "${e.nome}"` : e.codigo));
          achados.push({ nivel: 'conflito', dia, codigos: [a, b].filter((e) => !e.bloqueio).map((e) => e.codigo), motivo: `sobreposição ${hh(b.inicio)}–${hh(Math.min(a.fim, b.fim))} entre ${quais[0]} e ${quais[1]}` });
        } else if (!a.bloqueio && !b.bloqueio && a.campus !== b.campus && a.campus !== 'desconhecido' && b.campus !== 'desconhecido' && b.inicio - a.fim < MARGEM_CAMPI_MIN) {
          achados.push({ nivel: 'aviso', dia, codigos: [a.codigo, b.codigo], motivo: `${a.codigo} termina ${hh(a.fim)} em ${NOME_CAMPUS[a.campus]} e ${b.codigo} começa ${hh(b.inicio)} em ${NOME_CAMPUS[b.campus]}: menos de ${MARGEM_CAMPI_MIN} min entre campi diferentes` });
        }
      }
    }
  }
  return { ok: !achados.some((a) => a.nivel === 'conflito'), verificado, creditos, achados };
}
