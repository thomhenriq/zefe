import { expect, test } from 'bun:test';
import { orfaos } from '@/zefe/aterramento';

const fonte = JSON.stringify({ codigo: 'SI702', turmas: [{ turma: 'A', horarios: [{ dia: 'seg', inicio: '14:00', fim: '18:00', sala: 'PA06' }] }] });

test('aterrado passa, em qualquer grafia', () => {
  expect(orfaos(['SI702 turma A é segunda, 14:00 às 18:00 na PA06.'], [fonte])).toEqual([]);
  expect(orfaos(['A si 702 é às 14h, até as 18h, sala PA06; SI-702A também.'], [fonte])).toEqual([]);
  expect(orfaos(['Você pediu 13h30 e SI 704.'], [fonte, 'Quero SI704 às 13:30'])).toEqual([]);
});
test('inventado é pego', () => {
  expect(orfaos(['A aula é às 15:30.'], [fonte])).toEqual(['15:30']);
  expect(orfaos(['A aula é às 15h.'], [fonte])).toEqual(['15:00']);
  expect(orfaos(['É na sala PA07.'], [fonte])).toEqual(['PA07']);
  expect(orfaos(['Veja SI 703 e SI-705A.'], [fonte])).toEqual(['SI703', 'SI705']);
});
test('"de 100 turmas" não é código, mas DE100 colado é', () => {
  expect(orfaos(['São mais de 100 turmas, só 108 vagas.'], [fonte])).toEqual([]);
  expect(orfaos(['Veja DE100.'], [fonte])).toEqual(['DE100']);
});
test('texto vazio não conta como aterrado', () => {
  expect(orfaos([''], [fonte])).toEqual(['(texto vazio)']);
  expect(orfaos(['ok', '  '], [fonte])).toEqual(['(texto vazio)']);
});
