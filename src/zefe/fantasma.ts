/** Ferramentas que alteram dados do aluno; só elas devolvem `acaoId`. */
export const FERRAMENTAS_QUE_ALTERAM = ['alterar_grade', 'marcar_historico', 'criar_bloqueio', 'remover_bloqueio'];

export const AVISO_ACAO_FANTASMA = 'Atenção: eu não fiz essa alteração, nada mudou na sua grade nem no histórico. Peça de novo ou faça pela tela.';

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Primeira pessoa, passado. "incluí" e "excluí" só valem com acento (sem ele são o presente: "a grade inclui").
const VERBOS = /\b(adicionei|coloquei|removi|tirei|troquei|mudei|marquei|desmarquei|criei|bloqueei|apaguei|salvei|alterei|atualizei|inseri|retirei)\b/g;
const VERBOS_ACENTO = /(?<![\p{L}])(incluí|excluí)(?![\p{L}])/gu;
// Negação só vale colada ao verbo (no máximo uma palavra no meio): "não adicionei", "não ainda adicionei".
// shortcut: "Adicionei? Não." (negação depois do verbo) ainda conta como afirmação, trocar por análise de frase se aparecer.
const NEGACAO = /\b(nao|nunca|jamais|nem)\s+(\w+\s+)?$/;

function afirma(texto: string, re: RegExp): boolean {
  for (const m of texto.matchAll(re)) {
    const antes = texto.slice(Math.max(0, m.index - 30), m.index);
    if (!NEGACAO.test(semAcento(antes))) return true;
  }
  return false;
}

/** O texto diz, em primeira pessoa e no passado, que mexeu em algo (e não nega). */
export const afirmaAlteracao = (texto: string): boolean => afirma(semAcento(texto), VERBOS) || afirma(texto.toLowerCase(), VERBOS_ACENTO);

type Parte = { type: string; state?: string; output?: unknown };
const alterou = (p: Parte) => FERRAMENTAS_QUE_ALTERAM.some((n) => p.type === `tool-${n}`) && p.state === 'output-available' && !!p.output && typeof p.output === 'object' && 'acaoId' in p.output;

/** true = o modelo disse que alterou, mas nenhuma ferramenta de alteração teve sucesso neste turno. */
export const acaoFantasma = (texto: string, partes: Parte[]): boolean => afirmaAlteracao(texto) && !partes.some(alterou);
