import { describe, expect, test } from 'bun:test';
import { emailLiberado, parseLiberados } from '../src/zefe/liberados';
import { criarRemovedor, removerPensamento } from '../src/zefe/pensamento';
import { cartaoDe, validarCartao } from '../src/zefe/cartoes';
import { VERSAO_PROMPT, montarPrompt } from '../src/zefe/prompt';

describe('lista de liberados', () => {
  test('separa por vírgula, ignora espaços, caixa e vazios', () => {
    expect([...parseLiberados(' A@x.com, b@Y.com ,,')]).toEqual(['a@x.com', 'b@y.com']);
    expect(parseLiberados(undefined).size).toBe(0);
    expect(parseLiberados('').size).toBe(0);
  });
  test('emailLiberado', () => {
    expect(emailLiberado('Demo@Zefe.local', 'x@y.z, demo@zefe.local')).toBe(true);
    expect(emailLiberado('outro@zefe.local', 'demo@zefe.local')).toBe(false);
    expect(emailLiberado('demo@zefe.local', undefined)).toBe(false);
  });
});

describe('removedor de <thinking>', () => {
  test('bloco completo, com espaços depois', () => {
    expect(removerPensamento('<thinking>vou chamar</thinking>\n\nOi!')).toBe('Oi!');
    expect(removerPensamento('a<thinking>x</thinking>b<thinking>y</thinking>c')).toBe('abc');
  });
  test('bloco sem fechar some até o fim', () => {
    expect(removerPensamento('Oi <thinking>sem fim')).toBe('Oi ');
  });
  test('tags partidas entre pedaços do stream', () => {
    const r = criarRemovedor();
    const saida = ['Oi <thi', 'nking>segredo</thin', 'king>', ' tudo ', 'bem <', 'b>'].map((c) => r.push(c)).join('') + r.fim();
    expect(saida).toBe('Oi tudo bem <b>');
  });
  test('prefixo de tag que não vira tag é devolvido no fim', () => {
    const r = criarRemovedor();
    expect(r.push('1 <thi') + r.fim()).toBe('1 <thi');
  });
  test('pedaço pequeno nunca vaza conteúdo de pensamento', () => {
    const r = criarRemovedor();
    const texto = 'x<thinking>abc</thinking>y';
    let s = '';
    for (const ch of texto) s += r.push(ch);
    expect(s + r.fim()).toBe('xy');
  });
});

describe('cartões validados por zod', () => {
  test('oferta válida', () => {
    const c = cartaoDe('oferta_disciplina', { encontrada: true, tipo: 'oficial', codigo: 'SI702', nome: 'X', creditos: 4, campus: 'limeira', semestre: '1S/2027', fonte: { url: 'u', semestre: '1S/2026' }, turmas: [{ turma: 'A', horarios: [{ dia: 'seg', inicio: '08:00', fim: '10:00', sala: 'S1' }], docentes: ['Fulano'], vagas: 10, matriculados: 3, reservas: [] }] });
    expect(c?.tipo).toBe('oferta');
  });
  test('oferta em previsão sem vagas/matriculados é válida', () => {
    const r = validarCartao('oferta_disciplina', { encontrada: true, tipo: 'previsao', codigo: 'SI702', nome: 'X', creditos: 4, campus: 'limeira', semestre: '1S/2027', fonte: { url: 'u', semestre: '1S/2026' }, turmas: [{ turma: 'A', horarios: [], docentes: [] }] });
    expect(r.ok).toBe(true);
  });
  test('oferta não encontrada vira erro, não cartão', () => {
    expect(cartaoDe('oferta_disciplina', { erro: 'x', encontrada: false })).toBeNull();
  });
  test('forma errada falha na validação', () => {
    expect(validarCartao('oferta_disciplina', { encontrada: true, codigo: 7 }).ok).toBe(false);
    expect(validarCartao('meu_progresso', { creditos: 'muitos' }).ok).toBe(false);
  });
  test('ferramentas sem cartão (ações, busca) devolvem null', () => {
    expect(cartaoDe('buscar_disciplinas', { disciplinas: [] })).toBeNull();
    expect(cartaoDe('marcar_historico', { acaoId: 1, descricao: 'x' })).toBeNull();
  });
  test('grade, progresso e pré-requisitos válidos', () => {
    const g = { tipo: 'oficial', grade: { id: '1', nome: 'G', semestre: '1S/2027', principal: true }, itens: [{ codigo: 'SI702', nome: 'X', turma: 'A', creditos: 4, campus: 'limeira', tipo: 'oficial', horarios: [], semHorario: true }], bloqueios: [], checagem: { ok: true, verificado: true, creditos: 4, achados: [] } };
    expect(validarCartao('ver_grade', g).ok).toBe(true);
    expect(validarCartao('alterar_grade', { acaoId: 3, descricao: 'd', ...g }).ok).toBe(true);
    const p = { creditos: { obrigatorias: { feitos: 1, total: 2, emAndamento: 0 }, eletivas: { feitos: 0, total: 1, naoVerificado: 0, emAndamento: 0 } }, faltantes: [{ codigo: 'A', nome: 'B', creditos: 4, semestreSugerido: 1 }], travadas: [], planejadas: [], grupos: [] };
    expect(validarCartao('meu_progresso', p).ok).toBe(true);
    expect(validarCartao('prerequisitos', { codigo: 'SI702', nome: 'X', creditos: 4, prereqTexto: 'SI701', catalogo: 2026, verificado: true, satisfeito: false, alternativas: [[{ codigo: 'SI701', parcial: false, estado: 'nao_fiz' }]], destrava: [] }).ok).toBe(true);
  });
});

describe('prompt', () => {
  const ctx = { nome: null, curso: 'Sistemas de Informação', catalogo: 2026, semestreAtual: 5, semestreAlvo: '1S/2027', semestreCorrente: '2S/2026', naTela: false, tela: 'Planejador', hoje: '2026-11-17' };
  test('versionado e na ordem do brief', () => {
    expect(VERSAO_PROMPT).toMatch(/\S/);
    const p = montarPrompt(ctx);
    const pos = ['## Quem você é', '## Contexto', '## Regras de dados', '## Regras de ação', '## O que recusar', '## Formato'].map((t) => p.indexOf(t));
    expect(pos.every((x) => x >= 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
    for (const s of ['2026-11-17', '1S/2027', 'Sistemas de Informação', 'não encontrei', 'previsão', 'matrícula']) expect(p).toContain(s);
  });
});
