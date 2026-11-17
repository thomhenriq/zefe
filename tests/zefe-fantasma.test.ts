import { describe, expect, test } from 'bun:test';
import { acaoFantasma, afirmaAlteracao } from '../src/zefe/fantasma';

const ok = [{ type: 'tool-alterar_grade', state: 'output-available', output: { acaoId: 3, descricao: 'd' } }];
const leitura = [{ type: 'tool-ver_grade', state: 'output-available', output: { grade: {} } }];

describe('ação fantasma', () => {
  test('afirma alteração em 1ª pessoa, sem acento e com', () => {
    for (const t of ['Adicionei SI702 na sua grade.', 'ADICIONEI', 'Coloquei a turma A.', 'Incluí SI702.', 'Excluí o bloqueio.', 'Removi EB101 e troquei a turma.', 'Pronto! Marquei como cursada.']) expect(afirmaAlteracao(t)).toBe(true);
  });
  test('negação, presente e pergunta não disparam', () => {
    for (const t of ['Não adicionei nada ainda.', 'Eu não consegui, então não troquei a turma.', 'A grade inclui SI702.', 'Quer que eu adicione SI702?', 'Posso remover se você pedir.', 'Nunca removi nada.']) expect(afirmaAlteracao(t)).toBe(false);
  });
  test('negação de outra frase não vale', () => {
    expect(afirmaAlteracao('Não achei conflito. Adicionei SI702.')).toBe(true);
  });
  test('sem ferramenta de alteração: fantasma; com sucesso: não', () => {
    expect(acaoFantasma('Adicionei SI702 na sua grade', [])).toBe(true);
    expect(acaoFantasma('Adicionei SI702 na sua grade', leitura)).toBe(true);
    expect(acaoFantasma('Adicionei SI702 na sua grade', [{ type: 'tool-alterar_grade', state: 'output-available', output: { erro: 'x' } }])).toBe(true);
    expect(acaoFantasma('Adicionei SI702 na sua grade', ok)).toBe(false);
    expect(acaoFantasma('Você tem 3 conflitos.', [])).toBe(false);
  });
});
