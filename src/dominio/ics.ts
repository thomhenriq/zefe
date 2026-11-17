import type { Dia } from '@/dac/tipos';
import type { ItemGrade } from '@/dominio/grade';

// São Paulo sem horário de verão desde 2019: sempre -03:00.
const TZ = 'America/Sao_Paulo';
const DIA_MS = 86_400_000;
const NUM_DIA: Record<Dia, number> = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const ajuste = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 §3.1: no máximo 75 octetos por linha; a continuação começa com espaço e não quebra caractere UTF-8. */
function dobrar(linha: string): string {
  const partes: string[] = [];
  const enc = new TextEncoder();
  let atual = '', bytes = 0, limite = 75;
  for (const ch of linha) {
    const n = enc.encode(ch).length;
    if (bytes + n > limite) { partes.push(atual); atual = ''; bytes = 0; limite = 74; }
    atual += ch; bytes += n;
  }
  partes.push(atual);
  return partes.join('\r\n ');
}

/**
 * Um VEVENT por horário, repetindo semanalmente de `inicio` a `fim` (inclusive).
 * `inicio` e `fim` são datas de calendário: usa a parte UTC (ex.: new Date('2026-03-02')).
 */
export function gerarIcs(itens: ItemGrade[], inicio: Date, fim: Date, agora: Date = new Date()): string {
  const linhas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zefe//Grade//PT-BR', 'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE', `TZID:${TZ}`, 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0300', 'TZOFFSETTO:-0300', 'TZNAME:-03', 'END:STANDARD', 'END:VTIMEZONE',
  ];
  // UNTIL: fim do dia `fim` em São Paulo (23:59:59 -03:00) convertido para UTC.
  const until = stamp(new Date(fim.getTime() + (23 * 3600 + 59 * 60 + 59 + 3 * 3600) * 1000));
  const dtstamp = stamp(agora);
  const fimYmd = ymd(fim);

  for (const it of itens) {
    const sumario = `${it.codigo} ${it.nome}${it.tipo === 'previsao' ? ' (previsão)' : ''}${it.horarioIncompleto ? ' (horário incompleto)' : ''}`;
    for (const [i, h] of it.horarios.entries()) {
      // Primeira ocorrência do dia da semana em ou depois de `inicio`.
      const primeiro = new Date(inicio.getTime() + ((NUM_DIA[h.dia] - inicio.getUTCDay() + 7) % 7) * DIA_MS);
      if (ymd(primeiro) > fimYmd) continue;
      const dia = ymd(primeiro).replace(/-/g, '');
      const ev = [
        'BEGIN:VEVENT',
        `UID:${ajuste(`${it.codigo}-${it.turma}-${h.dia}-${h.inicio}-${i}@zefe.local`)}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=${TZ}:${dia}T${h.inicio.replace(':', '')}00`,
        `DTEND;TZID=${TZ}:${dia}T${h.fim.replace(':', '')}00`,
        `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
        `SUMMARY:${ajuste(sumario)}`,
      ];
      if (h.sala) ev.push(`LOCATION:${ajuste(h.sala)}`);
      ev.push('END:VEVENT');
      linhas.push(...ev);
    }
  }
  linhas.push('END:VCALENDAR');
  return linhas.map(dobrar).join('\r\n') + '\r\n';
}

/** Códigos que não entram no arquivo por não terem horário (para avisar o aluno). */
export function foraDoCalendario(itens: ItemGrade[]): string[] {
  return [...new Set(itens.filter((it) => it.horarios.length === 0).map((it) => it.codigo))];
}

/** Primeira segunda de março (1º) ou agosto (2º) até o sábado da 16ª semana. */
export function datasPadrao(ano: number, periodo: 1 | 2): { inicio: string; fim: string } {
  const d = new Date(Date.UTC(ano, periodo === 1 ? 2 : 7, 1));
  const inicio = new Date(d.getTime() + ((1 - d.getUTCDay() + 7) % 7) * DIA_MS);
  return { inicio: ymd(inicio), fim: ymd(new Date(inicio.getTime() + (16 * 7 - 2) * DIA_MS)) };
}

/** Mensagem pt-BR para um intervalo inválido, ou null se estiver ok. Datas no formato AAAA-MM-DD. */
export function erroPeriodo(inicio: string, fim: string): string | null {
  if (!DATA.test(inicio) || !DATA.test(fim)) return 'informe as duas datas (AAAA-MM-DD)';
  const a = Date.parse(`${inicio}T00:00:00Z`), b = Date.parse(`${fim}T00:00:00Z`);
  if (a > b) return 'o último dia precisa ser o mesmo ou vir depois do primeiro';
  if (b - a > 30 * 7 * DIA_MS) return 'o intervalo não pode passar de 30 semanas';
  return null;
}
