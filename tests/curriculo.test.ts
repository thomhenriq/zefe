import { expect, test } from 'bun:test';
import { parseCurriculoPleno, parseCursos, parseProposta } from '@/dac/curriculo';
import { ErroParse } from '@/dac/tipos';

const fx = (n: string) => Bun.file(`${import.meta.dir}/fixtures/catalogo/${n}.html`).text();

test('parseCursos: índice 2026', async () => {
  const cs = parseCursos(await fx('index-2026'));
  expect(cs.length).toBeGreaterThan(60);
  expect(cs.find((c) => c.numero === 94)).toEqual({ numero: 94, nome: 'Sistemas de Informação', turno: 'Integral' });
  expect(cs.find((c) => c.numero === 64)).toEqual({ numero: 64, nome: 'Comunicação Social - Midialogia', turno: 'Integral' });
  expect(cs.find((c) => c.numero === 42)?.turno).toBe('Noturno');
});

test('proposta do curso 94: 8 semestres', async () => {
  const [p, ...resto] = parseProposta(await fx('sugestao-94'));
  expect(resto).toEqual([]);
  expect(p!.modalidade).toBeNull();
  expect(p!.semestres.length).toBe(8);
  expect(p!.semestres[0]).toEqual({ semestre: 1, codigos: ['EB101', 'SI100', 'SI101', 'SI102', 'SI120', 'ST008', 'TT106', 'TT350'], creditosEletivos: 0 });
  expect(p!.semestres.map((s) => s.creditosEletivos)).toEqual([0, 0, 0, 4, 2, 10, 0, 0]);
  expect(p!.semestres[3]!.codigos).toContain('SI201');
});

test('proposta do curso 34: uma por modalidade', async () => {
  const ps = parseProposta(await fx('sugestao-34'));
  expect(ps.map((p) => p.modalidade)).toEqual(['AA', 'AB', 'AX']);
  expect(ps[0]!.semestres.length).toBe(10);
  expect(ps[0]!.semestres[6]!.creditosEletivos).toBe(12);
});

test('proposta sem semestres → ErroParse', () => {
  expect(() => parseProposta('<html><body><h2>x</h2></body></html>')).toThrow(ErroParse);
});

test('currículo pleno do 94: sem modalidade, SI916 obrigatória', async () => {
  const c = parseCurriculoPleno(await fx('curriculo-94'), 94);
  expect(c).toMatchObject({ curso: 94, nomeCurso: 'Sistemas de Informação' });
  expect(c.modalidades.length).toBe(1);
  const m = c.modalidades[0]!;
  expect(m.sigla).toBeNull();
  expect(m.obrigatorias).toContain('SI916');
  expect(m.obrigatorias).toContain('EB101');
  expect(m.obrigatorias.length).toBe(46);
  // "Qualquer disciplina oferecida pela Unicamp" não é lista de códigos
  expect(m.eletivas).toEqual([{ creditos: 16, codigos: null, verificado: false, texto: expect.stringContaining('Qualquer disciplina oferecida pela Unicamp') }]);
});

test('curso 34: mais de uma modalidade; núcleo comum + própria; grupos com lista concreta ou padrão', async () => {
  const c = parseCurriculoPleno(await fx('curriculo-34'), 34);
  expect(c.modalidades.map((m) => m.sigla)).toEqual(['AA', 'AB', 'AX']);
  expect(c.modalidades[0]!.nome).toBe('Sistemas de Computação');
  for (const m of c.modalidades) {
    expect(m.obrigatorias).toContain('BE310'); // núcleo comum
    expect(m.obrigatorias).toContain('F128'); // código "F 128" sem espaço
  }
  expect(c.modalidades[0]!.obrigatorias).toContain('MC202');
  const [e1, e2] = c.modalidades[0]!.eletivas;
  expect(e1).toMatchObject({ creditos: 13, codigos: null, verificado: false });
  expect(e1!.texto).toContain('EX---');
  expect(e2!.creditos).toBe(12);
  expect(e2!.verificado).toBe(true);
  expect(e2!.codigos).toContain('MC019');
});

test('curso 11 em 2026: sem modalidade, nunca lista vazia', async () => {
  const c = parseCurriculoPleno(await fx('curriculo-11'), 11);
  expect(c.modalidades.length).toBe(1);
  expect(c.modalidades[0]!.sigla).toBeNull();
  expect(c.modalidades[0]!.obrigatorias.length).toBeGreaterThan(20);
  expect(c.modalidades[0]!.eletivas.length).toBe(4);
});

test('grupo de eletivas que o parser não reconhece → codigos null, não verificado, texto original', () => {
  const html = `<html><body><h2>9 - Curso Teste - Currículo Pleno</h2>
  <h3>Núcleo Comum ao Curso</h3><table class="curriculo"><tr><td><a>AB100</a></td><td>30</td><td>2</td><td>X</td></tr></table>
  <h3>Disciplinas Eletivas</h3>
  <p><strong>Disciplinas eletivas I: </strong> O aluno deve obter 8 créditos dentre as disciplinas listadas abaixo.</p>
  <table class="curriculo"><tr><td><a>AB200</a></td><td>30</td><td>2</td><td>Y</td></tr><tr><td>SI5xx</td><td></td><td></td><td>Quaisquer do grupo SI5xx exceto estágios</td></tr></table>
  <p><strong>Disciplinas eletivas II: </strong> Cumprir a regra especial da coordenação.</p></body></html>`;
  const [a, b] = parseCurriculoPleno(html, 9).modalidades[0]!.eletivas;
  expect(a).toMatchObject({ creditos: 8, codigos: null, verificado: false });
  expect(a!.texto).toContain('SI5xx');
  expect(b).toMatchObject({ creditos: 0, codigos: null, verificado: false });
  expect(b!.texto).toBe('Cumprir a regra especial da coordenação.');
});

test('página sem obrigatórias → ErroParse', () => {
  expect(() => parseCurriculoPleno('<html><body><h2>9 - X - Currículo Pleno</h2></body></html>', 9)).toThrow(ErroParse);
});

test('proposta: modalidade só com observação é omitida', () => {
  const html = '<html><body><h2>AE - A</h2><h3>1º Semestre - 4 créditos</h3><p><strong><a>HL121 (4)</a></strong></p><h2>AF - B</h2><p>Embora conste...</p></body></html>';
  expect(parseProposta(html).map((p) => p.modalidade)).toEqual(['AE']);
});
