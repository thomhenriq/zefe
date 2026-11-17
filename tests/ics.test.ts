import { describe, expect, test } from 'bun:test';
import { datasPadrao, erroPeriodo, gerarIcs } from '../src/dominio/ics';
import type { ItemGrade } from '../src/dominio/grade';
import type { Campus, Dia } from '../src/dac/tipos';

const item = (codigo: string, horarios: { dia: Dia; inicio: string; fim: string; sala: string }[], extra: Partial<ItemGrade> = {}): ItemGrade => ({
  codigo, nome: `Nome ${codigo}`, turma: 'A', creditos: 4, campus: 'limeira' as Campus, tipo: 'oficial', reservas: [], horarios, ...extra,
});
const desdobrar = (s: string) => s.replace(/\r\n[ \t]/g, '');
const eventos = (s: string) => desdobrar(s).split('\r\n').reduce<string[][]>((acc, l) => {
  if (l === 'BEGIN:VEVENT') acc.push([]);
  else if (l !== 'END:VEVENT' && acc.length) acc[acc.length - 1]!.push(l);
  return acc;
}, []);
const campo = (ev: string[], nome: string) => ev.find((l) => l.startsWith(nome + ':') || l.startsWith(nome + ';'))!;
const UTC = (s: string) => new Date(`${s}T00:00:00Z`);

// Quinta 05/03/2026: a primeira segunda em ou depois é 09/03; a primeira terça, 10/03; a primeira quarta, 11/03.
const INICIO = UTC('2026-03-05');
const FIM = UTC('2026-07-03');

describe('gerarIcs', () => {
  test('2 itens com 3 horários no total → 3 VEVENT; cada um cai no primeiro dia da semana em ou depois de inicio', () => {
    const itens = [
      item('AA001', [{ dia: 'seg', inicio: '19:00', fim: '21:00', sala: 'B1' }, { dia: 'qua', inicio: '19:00', fim: '21:00', sala: 'B1' }]),
      item('BB002', [{ dia: 'ter', inicio: '08:00', fim: '10:00', sala: 'C2' }]),
    ];
    const s = gerarIcs(itens, INICIO, FIM);
    const evs = eventos(s);
    expect(evs).toHaveLength(3);
    const inicios = evs.map((ev) => campo(ev, 'DTSTART'));
    expect(inicios).toContain('DTSTART;TZID=America/Sao_Paulo:20260309T190000'); // seg
    expect(inicios).toContain('DTSTART;TZID=America/Sao_Paulo:20260311T190000'); // qua
    expect(inicios).toContain('DTSTART;TZID=America/Sao_Paulo:20260310T080000'); // ter
  });

  test('item sem horários fica de fora', () => {
    const s = gerarIcs([item('AA001', []), item('BB002', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: '' }])], INICIO, FIM);
    const evs = eventos(s);
    expect(evs).toHaveLength(1);
    expect(campo(evs[0]!, 'SUMMARY')).toBe('SUMMARY:BB002 Nome BB002');
  });

  test('escapa vírgula, ponto e vírgula, barra invertida e quebra de linha', () => {
    const s = gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'Sala 1\nfundos' }], { nome: 'Cálculo, I; \\ teste' })], INICIO, FIM);
    const ev = eventos(s)[0]!;
    expect(campo(ev, 'SUMMARY')).toBe('SUMMARY:AA001 Cálculo\\, I\\; \\\\ teste');
    expect(campo(ev, 'LOCATION')).toBe('LOCATION:Sala 1\\nfundos');
  });

  test('sala vazia: LOCATION omitido', () => {
    const ev = eventos(gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: '' }])], INICIO, FIM))[0]!;
    expect(ev.some((l) => l.startsWith('LOCATION'))).toBe(false);
  });

  test('linhas terminam em CRLF, sem LF solto', () => {
    const s = gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }])], INICIO, FIM);
    expect(s.endsWith('\r\n')).toBe(true);
    expect(s.replace(/\r\n/g, '')).not.toContain('\n');
  });

  test('linhas longas são dobradas em até 75 octetos, sem quebrar caractere UTF-8', () => {
    const nome = 'Introdução às Ciências da Computação e Algoritmos Avançados para Engenharia de Dados';
    const s = gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }], { nome })], INICIO, FIM);
    for (const l of s.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(desdobrar(s)).toContain(`SUMMARY:AA001 ${nome}`);
  });

  test('previsão ganha " (previsão)" no SUMMARY; oficial não', () => {
    const s = gerarIcs([
      item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }], { tipo: 'previsao' }),
      item('BB002', [{ dia: 'ter', inicio: '08:00', fim: '10:00', sala: 'X' }]),
    ], INICIO, FIM);
    const sums = eventos(s).map((ev) => campo(ev, 'SUMMARY'));
    expect(sums).toContain('SUMMARY:AA001 Nome AA001 (previsão)');
    expect(sums).toContain('SUMMARY:BB002 Nome BB002');
  });

  test('BEGIN/END balanceados e VTIMEZONE de São Paulo com -0300', () => {
    const s = gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }])], INICIO, FIM);
    const linhas = s.split('\r\n');
    for (const nome of ['VCALENDAR', 'VTIMEZONE', 'STANDARD', 'VEVENT']) {
      expect(linhas.filter((l) => l === `BEGIN:${nome}`)).toHaveLength(linhas.filter((l) => l === `END:${nome}`).length);
    }
    expect(linhas.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(linhas).toContain('TZID:America/Sao_Paulo');
    expect(linhas.filter((l) => l === 'TZOFFSETTO:-0300')).toHaveLength(1);
  });

  test('RRULE com UNTIL = fim do dia fim em São Paulo, em UTC (23:59:59 -03 = 02:59:59 do dia seguinte)', () => {
    const ev = eventos(gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }])], INICIO, FIM))[0]!;
    expect(campo(ev, 'RRULE')).toBe('RRULE:FREQ=WEEKLY;UNTIL=20260704T025959Z');
    expect(campo(ev, 'DTEND')).toBe('DTEND;TZID=America/Sao_Paulo:20260309T100000');
  });

  test('horário cuja primeira aula é depois de fim não gera evento', () => {
    const s = gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }])], INICIO, UTC('2026-03-06'));
    expect(eventos(s)).toHaveLength(0);
  });

  test('UID estável por item+horário e DTSTAMP em UTC', () => {
    const agora = new Date('2026-03-01T12:00:00Z');
    const ev = eventos(gerarIcs([item('AA001', [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'X' }])], INICIO, FIM, agora))[0]!;
    expect(campo(ev, 'UID')).toBe('UID:AA001-A-seg-08:00@zefe.local');
    expect(campo(ev, 'DTSTAMP')).toBe('DTSTAMP:20260301T120000Z');
  });
});

describe('datasPadrao', () => {
  test('1º semestre: primeira segunda de março até o sábado da 16ª semana', () => {
    expect(datasPadrao(2026, 1)).toEqual({ inicio: '2026-03-02', fim: '2026-06-20' });
  });
  test('2º semestre: primeira segunda de agosto até o sábado da 16ª semana', () => {
    expect(datasPadrao(2026, 2)).toEqual({ inicio: '2026-08-03', fim: '2026-11-21' });
  });
});

describe('erroPeriodo', () => {
  test('aceita intervalo válido', () => {
    expect(erroPeriodo('2026-03-02', '2026-06-20')).toBeNull();
  });
  test('início depois do fim', () => {
    expect(erroPeriodo('2026-06-20', '2026-03-02')).toContain('depois');
  });
  test('mais de ~30 semanas', () => {
    expect(erroPeriodo('2026-01-01', '2027-06-01')).toContain('semanas');
  });
});
