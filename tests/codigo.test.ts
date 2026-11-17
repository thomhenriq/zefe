import { expect, test } from 'bun:test';
import { normalizarCodigo } from '@/dominio/codigo';

test('espaços, caixa e turma colada', () => {
  expect(normalizarCodigo(' si 702 ')).toEqual({ codigo: 'SI702', turma: null });
  expect(normalizarCodigo('si702')).toEqual({ codigo: 'SI702', turma: null });
  expect(normalizarCodigo('SI702A')).toEqual({ codigo: 'SI702', turma: 'A' });
});
test('código de 1 letra: F128 não vira turma', () => {
  expect(normalizarCodigo('f128')).toEqual({ codigo: 'F128', turma: null });
  expect(normalizarCodigo('F128A')).toEqual({ codigo: 'F128', turma: 'A' });
});
test('lixo volta limpo, sem turma', () => {
  expect(normalizarCodigo(' x y ')).toEqual({ codigo: 'XY', turma: null });
});
