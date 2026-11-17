import { expect, test } from 'bun:test';
import { parseCurriculoPleno, parseProposta } from '@/dac/curriculo';
import { parseCatalogo } from '@/dac/catalogo';
import type { Requisito } from '@/dac/tipos';
import { calcularIntegralizacao, type EntradaIntegralizacao } from '@/dominio/integralizacao';

const fx = (n: string) => Bun.file(`${import.meta.dir}/fixtures/catalogo/${n}.html`).text();

// Curso 94/2026 montado das fixtures; só o prefixo SI tem catálogo salvo (nome/créditos/pré-requisito).
async function base94(): Promise<EntradaIntegralizacao> {
  const pleno = parseCurriculoPleno(await fx('curriculo-94'), 94).modalidades[0]!;
  const proposta = parseProposta(await fx('sugestao-94'))[0]!;
  const cat = parseCatalogo(await fx('disciplinas-si'));
  const sem = new Map(proposta.semestres.flatMap((s) => s.codigos.map((c) => [c, s.semestre] as const)));
  return {
    obrigatorias: pleno.obrigatorias.map((codigo) => ({
      codigo,
      nome: cat.get(codigo)?.nome ?? codigo,
      creditos: cat.get(codigo)?.creditos ?? 4, // shortcut de teste: sem catálogo fora de SI, 4 créditos
      semestreSugerido: sem.get(codigo) ?? null,
    })),
    eletivas: pleno.eletivas,
    propostaEletivas: proposta.semestres.map((s) => ({ semestre: s.semestre, creditos: s.creditosEletivos })),
    historico: new Map(),
    planejadas: new Set(),
    creditosDe: (c) => cat.get(c)?.creditos ?? null,
    prereq: (c): Requisito[][] | null => (cat.has(c) ? cat.get(c)!.alternativas : null),
  };
}
const est = (r: ReturnType<typeof calcularIntegralizacao>, c: string) => r.disciplinas.find((d) => d.codigo === c)!;

test('fixture: SI203 tem SI100 como pré-requisito', async () => {
  expect((await base94()).prereq('SI203')).toEqual([[{ codigo: 'SI100', parcial: false }]]);
});

test('histórico vazio: SI203 travada, EB101 faltando', async () => {
  const r = calcularIntegralizacao(await base94());
  expect(est(r, 'SI203')).toMatchObject({ estado: 'travada', faltamPrereq: ['SI100'] });
  expect(est(r, 'EB101').estado).toBe('faltando');
  expect(r.creditos.obrigatorias.feitos).toBe(0);
});

test('SI100 cursando destrava SI203, mas não conta como feito', async () => {
  const e = await base94();
  e.historico.set('SI100', 'cursando');
  const r = calcularIntegralizacao(e);
  expect(est(r, 'SI100').estado).toBe('cursando');
  expect(est(r, 'SI203')).toMatchObject({ estado: 'faltando', faltamPrereq: [] });
  expect(r.creditos.obrigatorias.feitos).toBe(0);
  expect(r.creditos.obrigatorias.emAndamento).toBe(est(r, 'SI100').creditos);
});

test('créditos obrigatórios feitos = soma das cursadas; planejada; total', async () => {
  const e = await base94();
  e.historico.set('EB101', 'cursada');
  e.historico.set('SI100', 'cursada');
  e.planejadas.add('SI203');
  const r = calcularIntegralizacao(e);
  expect(r.creditos.obrigatorias.feitos).toBe(est(r, 'EB101').creditos + est(r, 'SI100').creditos);
  expect(est(r, 'SI203').estado).toBe('planejada');
  expect(r.creditos.obrigatorias.total).toBe(r.disciplinas.reduce((s, d) => s + d.creditos, 0));
});

test('grupo aberto do 94: eletiva cursada conta; ordem; fora do currículo', async () => {
  const e = await base94();
  e.historico.set('XX999', 'cursada');
  e.creditosDe = (c) => (c === 'XX999' ? 4 : null);
  const r = calcularIntegralizacao(e);
  expect(r.grupos[0]).toMatchObject({ verificado: true, aberto: true, feitos: 4, codigosContados: ['XX999'] });
  expect(r.creditos.eletivas).toMatchObject({ feitos: 4, total: 16, naoVerificado: 0 });
  e.eletivas = [];
  expect(calcularIntegralizacao(e).foraDoCurriculo).toEqual(['XX999']);
});

test('lista fechada tem precedência sobre grupo aberto, primeiro grupo vence', async () => {
  const e = await base94();
  e.eletivas = [
    { creditos: 8, texto: 'aberto', codigos: null, verificado: true },
    { creditos: 4, texto: 'A', codigos: ['AA1'], verificado: true },
    { creditos: 4, texto: 'B', codigos: ['AA1', 'BB1'], verificado: true },
  ];
  e.historico = new Map([['AA1', 'cursada'], ['BB1', 'cursada'], ['CC1', 'cursada']]);
  e.creditosDe = () => 4;
  const r = calcularIntegralizacao(e);
  expect(r.grupos.map((g) => g.codigosContados)).toEqual([['CC1'], ['AA1'], ['BB1']]);
});

test('Review Focus 3: grupo não verificado não soma em feitos', async () => {
  const e = await base94();
  e.eletivas = [{ creditos: 12, texto: 'regra que o parser não entendeu', codigos: ['AA1'], verificado: false }];
  e.historico.set('AA1', 'cursada');
  e.creditosDe = () => 4;
  const r = calcularIntegralizacao(e);
  expect(r.grupos[0]).toMatchObject({ verificado: false, aberto: false, feitos: 0 });
  expect(r.creditos.eletivas.feitos).toBe(0);
  expect(r.creditos.eletivas.naoVerificado).toBeGreaterThan(0);
  expect(r.foraDoCurriculo).toEqual([]);
  expect(r.naoClassificadas).toEqual(['AA1']); // grupo desconhecido: não afirmar "fora do currículo"
});

test('pré-requisito: parcial por cursando, alternativas OU, desconhecido não trava', async () => {
  const e = await base94();
  const alt: Record<string, Requisito[][]> = { SI203: [[{ codigo: 'AA', parcial: false }], [{ codigo: 'BB', parcial: true }, { codigo: 'CC', parcial: false }]] };
  e.prereq = (c) => (c === 'SI201' ? null : (alt[c] ?? []));
  e.historico = new Map([['BB', 'cursando'], ['CC', 'cursada']]);
  const r = calcularIntegralizacao(e);
  expect(est(r, 'SI203').estado).toBe('faltando');
  expect(est(r, 'SI201')).toMatchObject({ estado: 'faltando', prereqDesconhecido: true });
  expect(est(r, 'SI100').prereqDesconhecido).toBe(false);
});

test('excedente de grupo fechado: feitos limitado, excedente visível', async () => {
  const e = await base94();
  e.eletivas = [{ creditos: 4, texto: 'A', codigos: ['AA1', 'BB1'], verificado: true }];
  e.historico = new Map([['AA1', 'cursada'], ['BB1', 'cursada']]);
  e.creditosDe = () => 4;
  const r = calcularIntegralizacao(e);
  expect(r.grupos[0]).toMatchObject({ feitos: 4, excedente: 4, codigosContados: ['AA1', 'BB1'] });
  expect(r.creditos.eletivas.feitos).toBe(4);
});

test('obrigatória também em lista de eletiva conta só como obrigatória', async () => {
  const e = await base94();
  e.eletivas = [{ creditos: 4, texto: 'A', codigos: ['EB101'], verificado: true }];
  e.historico = new Map([['EB101', 'cursada']]);
  const r = calcularIntegralizacao(e);
  expect(r.grupos[0]).toMatchObject({ feitos: 0, codigosContados: [] });
  expect(est(r, 'EB101').estado).toBe('cursada');
  expect(r.foraDoCurriculo).toEqual([]);
});
