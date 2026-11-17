import { expect, test } from 'bun:test';
import { agruparPorSemestre, barra, observadoPorPeriodo } from '@/dominio/arvore';

const d = (codigo: string, semestreSugerido: number | null) => ({ codigo, semestreSugerido });

test('agruparPorSemestre: colunas 1..N sem buracos e "fora da proposta" por último', () => {
  const r = agruparPorSemestre([d('A', 2), d('B', null), d('C', 2), d('D', 4)]);
  expect(r.map((c) => c.semestre)).toEqual([1, 2, 3, 4, null]);
  expect(r[1]!.itens.map((i) => i.codigo)).toEqual(['A', 'C']);
  expect(r[0]!.itens).toEqual([]);
  expect(r[4]!.itens.map((i) => i.codigo)).toEqual(['B']);
});

test('agruparPorSemestre: sem disciplinas ou sem "fora" não cria coluna vazia extra', () => {
  expect(agruparPorSemestre([])).toEqual([]);
  expect(agruparPorSemestre([d('A', 1)]).map((c) => c.semestre)).toEqual([1]);
});

test('barra: feito e andamento em % do total, andamento nunca passa do que resta', () => {
  expect(barra(10, 5, 20)).toEqual({ feitoPct: 50, andamentoPct: 25 });
  expect(barra(18, 10, 20)).toEqual({ feitoPct: 90, andamentoPct: 10 });
  expect(barra(0, 0, 0)).toEqual({ feitoPct: 0, andamentoPct: 0 });
  expect(barra(30, 0, 20)).toEqual({ feitoPct: 100, andamentoPct: 0 });
});

test('observadoPorPeriodo: só 1S/2S em que apareceu, com anos', () => {
  expect(observadoPorPeriodo([{ ano: 2025, periodo: 2 }, { ano: 2024, periodo: 2 }, { ano: 2025, periodo: 2 }])).toEqual({ 1: [], 2: [2024, 2025] });
  expect(observadoPorPeriodo([])).toEqual({ 1: [], 2: [] });
});
