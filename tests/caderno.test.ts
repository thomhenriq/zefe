import { describe, expect, test } from 'bun:test';
import { parseDisciplina, parseIndiceDisciplinas, parseIndiceInstitutos } from '@/dac/caderno';
import { ErroParse, type Fonte } from '@/dac/tipos';

const fx = (n: string) => Bun.file(`${import.meta.dir}/fixtures/caderno/${n}.html`).text();
const fonte: Fonte = { url: 'https://www.dac.unicamp.br/portal/caderno-de-horarios/2026/1/S/G/FT/EB101', ano: 2026, periodo: 1, coletadoEm: '2026-11-10T00:00:00Z' };

describe('índices', () => {
  test('institutos de 1S/2026 incluem Limeira e Barão, sem AM', async () => {
    const s = parseIndiceInstitutos(await fx('g1'), 2026, 1);
    expect(s).toEqual(expect.arrayContaining(['FT', 'FCA', 'IC', 'IMECC']));
    expect(s).not.toContain('AM');
  });

  test('disciplinas da FT em 1S/2026', async () => {
    const d = parseIndiceDisciplinas(await fx('ft'), 2026, 1, 'FT');
    expect(d.length).toBe(209);
    expect(d).toContainEqual({ codigo: 'EB101', nome: 'Cálculo I' });
  });

  test('1S/2027 ainda vazio', async () => {
    expect(parseIndiceDisciplinas(await fx('ft27'), 2027, 1, 'FT')).toEqual([]);
  });
});

describe('parseDisciplina', () => {
  test('EB101 1S/2026', async () => {
    const d = parseDisciplina(await fx('eb101'), { codigo: 'EB101', instituto: 'FT', fonte });
    expect(d.creditos).toBe(6);
    expect(d.campus).toBe('limeira');
    expect(d.nome).toBe('Cálculo I');
    const a = d.turmas.find((t) => t.turma === 'A');
    expect(a).toEqual({
      turma: 'A',
      vagas: 125,
      matriculados: 81,
      horarios: [
        { dia: 'seg', inicio: '19:00', fim: '23:00', sala: 'PA03' },
        { dia: 'qua', inicio: '19:00', fim: '21:00', sala: 'PA03' },
      ],
      docentes: ['Elaine Cristina Catapani Poletti'],
      reservas: ['89 - Engenharia Ambiental /2026', '111 - Engenharia de Transportes'],
    });
    const c = d.turmas.find((t) => t.turma === 'C');
    expect(c?.horarios[0]).toMatchObject({ dia: 'seg', inicio: '09:00', fim: '12:00' });
  });

  test('última turma sem reservas não engole o rodapé como docente', async () => {
    const html = await fx('eb101');
    const i = html.lastIndexOf('<p>Reservas:</p>');
    const semReserva = html.slice(0, i) + html.slice(html.indexOf('</ul>', i) + 5);
    const d = parseDisciplina(semReserva, { codigo: 'EB101', instituto: 'FT', fonte });
    expect(d.turmas.at(-1)).toMatchObject({ turma: 'D', docentes: ['Marli De Freitas Gomes Hernandez'], reservas: [] });
  });

  test('página sem estrutura lança ErroParse', () => {
    expect(() => parseDisciplina('<html><body>nada</body></html>', { codigo: 'X', instituto: 'FT', fonte })).toThrow(ErroParse);
  });
});

describe('revisão: falhar alto', () => {
  const eb = () => fx('eb101');
  test('horário ilegível marca a turma como incompleta', async () => {
    const html = (await eb()).replace('19:00 - 21:00', 'A definir');
    const a = parseDisciplina(html, { codigo: 'EB101', instituto: 'FT', fonte }).turmas.find((t) => t.turma === 'A')!;
    expect(a.horarios.length).toBe(1);
    expect(a.horarioIncompleto).toBe(true);
  });
  test('"Não possui horários cadastrados" não é incompleto', async () => {
    const html = (await eb()).replace(/<p>Hor[^<]*Salas:<\/p>[\s\S]*?<p>Docentes/, '<p>Horários/Salas:</p><p>Não possui horários cadastrados.</p><p>Docentes');
    const a = parseDisciplina(html, { codigo: 'EB101', instituto: 'FT', fonte }).turmas[0]!;
    expect(a.horarios).toEqual([]);
    expect(a.horarioIncompleto).toBeFalsy();
  });
  test('disciplina sem nenhuma turma → ErroParse', () => {
    expect(() => parseDisciplina('<html><body><p>Créditos:</p><p>4</p></body></html>', { codigo: 'X', instituto: 'FT', fonte })).toThrow(ErroParse);
  });
  test('índice sem institutos (semestre não publicado, como 1S/2027 real) → []', () => {
    expect(parseIndiceInstitutos('<html><body></body></html>', 2027, 1)).toEqual([]);
  });
  test('links de disciplina presentes mas não lidos → ErroParse', () => {
    const html = `<html><body><a href="${'https://www.dac.unicamp.br/portal/caderno-de-horarios'}/2026/1/S/G/FT/EB101">EB101</a></body></html>`;
    expect(() => parseIndiceDisciplinas(html, 2026, 1, 'FT')).toThrow(ErroParse);
  });
});
