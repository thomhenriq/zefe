import { expect, test } from 'bun:test';
import { perguntaDeGrade } from '@/zefe/forcar';

test('pergunta sobre o estado da grade força ver_grade; pedido de alteração e outros assuntos não', () => {
  for (const q of ['E deu conflito com alguma coisa?', 'Quantos créditos tem minha grade?', 'Algum horário bate?', 'O que eu tenho na minha grade?']) expect(perguntaDeGrade(q)).toBe(true);
  for (const q of ['Adiciona SI703 turma B na minha grade.', 'Qual o pré-requisito de SI702?', 'Faz minha matrícula.']) expect(perguntaDeGrade(q)).toBe(false);
});
