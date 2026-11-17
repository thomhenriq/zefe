// Cenários da avaliação do assistente (Task 16). Fatos conferidos no banco (SI703/SI704 têm turmas A e B em 1S/2026; SI702 só A; nada às 22h de sábado).
export const MUTANTES = ['alterar_grade', 'marcar_historico', 'criar_bloqueio', 'remover_bloqueio'];

export interface Estado { grade: Map<string, string>; bloqueios: { id: number; nome: string; dia: string; inicio: string; fim: string }[]; historico: Map<string, string> }

export interface Cenario {
  id: string;
  /** Uma pergunta por turno. */
  turnos: string[];
  /** (a) Cada grupo é "qualquer uma destas"; todos os grupos precisam ser satisfeitos. Vazio = nenhuma exigência. */
  esperadas?: string[][];
  /** (c) Resultado esperado vazio/erro: resposta precisa dizer "não encontrei" (ou equivalente) e não citar horário. */
  vazio?: boolean;
  /** (d) Confere o banco depois (recebe o estado preparado e o final). */
  banco?: (antes: Estado, depois: Estado) => boolean;
  /** (e) Fora de escopo: nenhuma ferramenta de alteração pode ser chamada. */
  fora?: boolean;
  /** (f, informativo) Semestre não publicado: texto deve dizer "previsão". */
  previsao?: boolean;
  /** Semente antes de rodar (além do estado do demo). */
  semente?: { grade?: [string, string][]; bloqueios?: { nome: string; dia: string; inicio: string; fim: string }[] };
}

const novoBloqueio = (a: Estado, d: Estado, f: (b: Estado['bloqueios'][number]) => boolean) => d.bloqueios.some((b) => !a.bloqueios.some((x) => x.id === b.id) && f(b));

export const CENARIOS: Cenario[] = [
  { id: 'horario-ia-2027', turnos: ['Que horas é a aula de SI702 no ano que vem?'], esperadas: [['oferta_disciplina']], previsao: true },
  { id: 'horario-nome', turnos: ['Qual o horário e a sala de Introdução a Interfaces Humano-Computador?'], esperadas: [['oferta_disciplina']] },
  { id: 'horario-ano-explicito', turnos: ['Que dia e hora é a turma B de SI405 em 2025, primeiro semestre?'], esperadas: [['oferta_disciplina']] },
  { id: 'janela-ter-noite', turnos: ['O que eu consigo cursar terça à noite, das 19:00 às 23:00?'], esperadas: [['buscar_turmas']] },
  { id: 'janela-sex-manha', turnos: ['Tem alguma turma sexta de manhã, das 08:00 às 12:00?'], esperadas: [['buscar_turmas']] },
  { id: 'janela-vazia', turnos: ['Tem alguma aula no sábado das 22:00 às 23:00?'], esperadas: [['buscar_turmas']], vazio: true },
  { id: 'prereq-codigo', turnos: ['Qual o pré-requisito de SI702?'], esperadas: [['prerequisitos']] },
  { id: 'prereq-nome', turnos: ['Eu já posso fazer Inteligência Artificial? Tenho os pré-requisitos?'], esperadas: [['prerequisitos']] },
  { id: 'progresso-falta', turnos: ['O que falta pra eu me formar?'], esperadas: [['meu_progresso']] },
  { id: 'progresso-creditos', turnos: ['Quantos créditos de obrigatórias eu já fiz?'], esperadas: [['meu_progresso']] },
  { id: 'grade-adicionar', turnos: ['Adiciona SI703 turma B na minha grade.'], esperadas: [['alterar_grade']], banco: (_a, d) => d.grade.get('SI703') === 'B' },
  { id: 'grade-adicionar-nome', turnos: ['Coloca Inteligência Artificial na minha grade.'], esperadas: [['alterar_grade']], banco: (_a, d) => d.grade.has('SI702') },
  { id: 'grade-remover', turnos: ['Tira SI704 da minha grade.'], esperadas: [['alterar_grade']], semente: { grade: [['SI704', 'B']] }, banco: (_a, d) => !d.grade.has('SI704') },
  { id: 'grade-trocar', turnos: ['Troca a turma de SI704 pra B.'], esperadas: [['alterar_grade']], semente: { grade: [['SI704', 'A']] }, banco: (_a, d) => d.grade.get('SI704') === 'B' },
  { id: 'historico-reprovei', turnos: ['Reprovei em cálculo 1.'], esperadas: [['marcar_historico']], banco: (_a, d) => !d.historico.has('EB101') },
  { id: 'historico-cursei', turnos: ['Já cursei SI405, marca aí.'], esperadas: [['marcar_historico']], banco: (_a, d) => d.historico.get('SI405') === 'cursada' },
  { id: 'bloqueio-criar', turnos: ['Tenho estágio toda tarde das 13:30 às 17:30.'], esperadas: [['criar_bloqueio']], banco: (a, d) => novoBloqueio(a, d, (b) => b.inicio === '13:30' && b.fim === '17:30') },
  { id: 'bloqueio-criar-dia', turnos: ['Bloqueia quinta das 08:00 às 10:00, tenho consulta fixa.'], esperadas: [['criar_bloqueio']], banco: (a, d) => novoBloqueio(a, d, (b) => b.dia === 'qui' && b.inicio === '08:00' && b.fim === '10:00') },
  { id: 'bloqueio-remover', turnos: ['Tira o bloqueio da academia.'], esperadas: [['remover_bloqueio']], semente: { bloqueios: [{ nome: 'Academia', dia: 'qua', inicio: '07:00', fim: '08:00' }] }, banco: (_a, d) => !d.bloqueios.some((b) => b.nome === 'Academia') },
  { id: 'inexistente-codigo', turnos: ['Quais são as turmas de XY999?'], esperadas: [['oferta_disciplina', 'buscar_disciplinas']], vazio: true },
  { id: 'inexistente-nome', turnos: ['Tem turma de Tecelagem Subaquática Avançada em 2027?'], esperadas: [['buscar_disciplinas', 'oferta_disciplina']], vazio: true },
  { id: 'nao-publicado', turnos: ['Quais turmas de SI702 vão ter em 2027?'], esperadas: [['oferta_disciplina']], previsao: true },
  { id: 'codigo-errado', turnos: ['Quando é a aula de S1702?'], esperadas: [['oferta_disciplina', 'buscar_disciplinas']] },
  { id: 'fora-matricula', turnos: ['Faz minha matrícula pra mim.'], fora: true },
  { id: 'fora-tcc', turnos: ['Escreve meu TCC sobre inteligência artificial.'], fora: true },
  { id: 'fora-receita', turnos: ['Me passa uma receita de bolo de cenoura.'], fora: true },
  {
    id: 'tres-turnos',
    turnos: ['Quais turmas de SI704 existem pra 2027?', 'Adiciona a turma B na minha grade.', 'E deu conflito com alguma coisa?'],
    esperadas: [['oferta_disciplina'], ['alterar_grade'], ['ver_grade']],
    banco: (_a, d) => d.grade.get('SI704') === 'B',
  },
];
