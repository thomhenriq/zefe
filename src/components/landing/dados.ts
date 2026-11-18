import type { EstadoDisciplina } from "@/components/ui/estado";
import type { Requisito } from "@/dac/tipos";

/**
 * Dados da landing. Reais: códigos, nomes, créditos por semestre sugerido e pré-requisitos do curso 94
 * (Sistemas de Informação, catálogo 2026, páginas públicas da DAC). Ilustrativo: o ESTADO de cada
 * disciplina (cursada, cursando...) e tudo do mini demo, rotulados "exemplo" na tela.
 */

export type Chip = { codigo: string; nome: string; estado: EstadoDisciplina };
export type ColunaFita = {
  rotulo: string;
  creditos: number;
  chips: Chip[];
  /** Créditos eletivos do semestre sugerido (o catálogo não dá códigos). */
  eletivos?: number;
  atual?: boolean;
  proximo?: boolean;
};

const c = (codigo: string, nome: string, estado: EstadoDisciplina): Chip => ({ codigo, nome, estado });

export const fita: ColunaFita[] = [
  {
    rotulo: "1º", creditos: 28,
    chips: [
      c("EB101", "Cálculo I", "cursada"), c("SI100", "Algoritmos e Programação de Computadores I", "cursada"),
      c("SI101", "Fundamentos de Sistemas de Informação", "cursada"), c("SI102", "Seminários I", "cursada"),
      c("SI120", "Lógica Matemática", "cursada"), c("ST008", "Metodologia do Trabalho Científico", "cursada"),
      c("TT106", "Organização e Arquitetura de Computadores", "cursada"), c("TT350", "Administração de Empresas", "cursada"),
    ],
  },
  {
    rotulo: "2º", creditos: 26,
    chips: [
      c("EB102", "Geometria Analítica e Álgebra Linear", "cursada"), c("SI203", "Algoritmos e Programação de Computadores II", "cursada"),
      c("SI220", "Matemática Discreta", "cursada"), c("SI250", "Economia e Finanças", "cursada"),
      c("SI305", "Análise de Sistemas de Informação I", "cursada"), c("ST266", "Engenharia de Software I", "cursada"),
      c("ST468", "Cálculo Numérico", "cursada"),
    ],
  },
  {
    rotulo: "3º", creditos: 28, atual: true,
    chips: [
      c("SI300", "Programação Orientada a Objetos I", "cursando"), c("SI304", "Engenharia de Software II", "cursando"),
      c("SI350", "Teoria Geral de Sistemas", "cursando"), c("SI404", "Introdução a Interfaces Humano-Computador", "faltando"),
      c("ST211", "Estatística", "cursando"), c("ST567", "Banco de Dados I", "cursando"),
      c("ST568", "Redes de Comunicação I", "cursando"), c("TT304", "Sistemas Operacionais", "cursando"),
    ],
  },
  {
    rotulo: "4º", creditos: 28, proximo: true, eletivos: 4,
    chips: [
      c("SI201", "Estrutura de Dados I", "planejada"), c("SI400", "Programação Orientada a Objetos II", "planejada"),
      c("SI401", "Programação para a Web", "planejada"), c("SI406", "Atividades práticas em Interação Humano-Computador", "travada"),
      c("SI450", "Administração da Produção", "planejada"), c("ST767", "Banco de Dados II", "planejada"),
      c("TT050", "Sistemas de Apoio à Decisão", "planejada"),
    ],
  },
  {
    rotulo: "5º", creditos: 24, eletivos: 2,
    chips: [
      c("SI405", "Análise de Sistemas de Informação II", "planejada"), c("SI700", "Programação para Dispositivos Móveis", "travada"),
      c("SI701", "Introdução a Multimídia", "faltando"), c("SI702", "Inteligência Artificial", "travada"),
      c("SI703", "Governança e Planejamento Estratégico de TI", "faltando"), c("SI704", "Seminários II", "faltando"),
      c("TT060", "Gestão de Projetos", "planejada"),
    ],
  },
  {
    rotulo: "6º", creditos: 18, eletivos: 10,
    chips: [
      c("SI600", "Projeto Integrador", "travada"), c("SI601", "Estruturas de Arquivos", "faltando"),
      c("SI800", "Empreendedorismo e Inovação", "faltando"), c("SI801", "Introdução a Auditoria e Segurança de Sistemas", "faltando"),
    ],
  },
  {
    rotulo: "7º · 8º", creditos: 48,
    chips: [
      c("SI912", "Trabalho de Conclusão de Curso I", "faltando"), c("SI916", "Estágio em Computação", "faltando"),
      c("SI913", "Trabalho de Conclusão de Curso II", "travada"), c("SI919", "Atividades Complementares de Extensão", "faltando"),
      c("SI920", "Atividades Complementares", "faltando"),
    ],
  },
];

/* ---------------- Árvore que acende (trecho real do curso 94) ---------------- */

export type NoArvore = { codigo: string; nome: string; semestre: number; col: number; y: number };

/** `col` 0..5 e `y` em % da altura do quadro; centro do cartão. */
export const nos: NoArvore[] = [
  { codigo: "SI100", nome: "Algoritmos e Programação I", semestre: 1, col: 0, y: 50 },
  { codigo: "SI203", nome: "Algoritmos e Programação II", semestre: 2, col: 1, y: 9 },
  { codigo: "SI305", nome: "Análise de Sistemas de Informação I", semestre: 2, col: 1, y: 68 },
  { codigo: "ST266", nome: "Engenharia de Software I", semestre: 2, col: 1, y: 85 },
  { codigo: "SI300", nome: "Programação Orientada a Objetos I", semestre: 3, col: 2, y: 50 },
  { codigo: "SI304", nome: "Engenharia de Software II", semestre: 3, col: 2, y: 85 },
  { codigo: "SI201", nome: "Estrutura de Dados I", semestre: 4, col: 3, y: 9 },
  { codigo: "SI400", nome: "Programação Orientada a Objetos II", semestre: 4, col: 3, y: 29 },
  { codigo: "SI401", nome: "Programação para a Web", semestre: 4, col: 3, y: 50 },
  { codigo: "SI700", nome: "Programação para Dispositivos Móveis", semestre: 5, col: 4, y: 24 },
  { codigo: "TT060", nome: "Gestão de Projetos", semestre: 5, col: 4, y: 85 },
  { codigo: "SI600", nome: "Projeto Integrador", semestre: 6, col: 5, y: 62 },
];

/** Pré-requisito → disciplina, conferido com o catálogo 2026 (curso 94). "ou" = alternativa; SI206 e TT130 ficam fora do trecho. */
const prereqs: Record<string, Requisito[][]> = {
  SI100: [[]],
  SI203: [[{ codigo: "SI100", parcial: false }]],
  SI305: [[{ codigo: "SI100", parcial: false }]],
  ST266: [[{ codigo: "SI100", parcial: false }], [{ codigo: "TT130", parcial: false }]],
  SI300: [[{ codigo: "SI100", parcial: false }]],
  SI304: [[{ codigo: "ST266", parcial: false }], [{ codigo: "SI206", parcial: false }]],
  SI201: [[{ codigo: "SI100", parcial: false }]],
  SI400: [[{ codigo: "SI300", parcial: false }]],
  SI401: [[{ codigo: "SI300", parcial: false }]],
  SI700: [[{ codigo: "SI201", parcial: true }, { codigo: "SI400", parcial: false }]],
  TT060: [[{ codigo: "ST266", parcial: false }], [{ codigo: "SI206", parcial: false }]],
  SI600: [[
    { codigo: "SI201", parcial: false }, { codigo: "SI300", parcial: false }, { codigo: "SI304", parcial: false },
    { codigo: "SI305", parcial: false }, { codigo: "TT060", parcial: false },
  ]],
};
export const prereqDoTrecho = (codigo: string) => prereqs[codigo] ?? null;

/** SI600 também pede SI404 e ST767 (fora do trecho). */
export const foraDoTrecho: Record<string, string> = { SI600: "+2 fora do trecho (SI404, ST767)", ST266: "ou TT130 (fora do trecho)", SI304: "ou SI206 (fora do trecho)", TT060: "ou SI206 (fora do trecho)" };

/* ---------------- Peça e veja (tudo fictício) ---------------- */

export type Dia = 0 | 1 | 2 | 3 | 4 | 5; // seg..sáb
export type Bloco = { id: string; nome: string; sigla: string; dia: Dia; ini: number; fim: number; turma: string };

export type Passo =
  | { t: "usuario"; texto: string }
  | { t: "pensar" }
  | { t: "zefe"; texto: string }
  | { t: "add"; bloco: Bloco }
  | { t: "trocar"; id: string; para: Bloco };

export const baseGrade: Bloco[] = [
  { id: "bd", nome: "Banco de Dados II", sigla: "BD II", dia: 0, ini: 8, fim: 10, turma: "A" },
  { id: "web", nome: "Programação para a Web", sigla: "Web", dia: 2, ini: 14, fim: 16, turma: "A" },
  { id: "est", nome: "Estrutura de Dados I", sigla: "ED I", dia: 1, ini: 10, fim: 12, turma: "B" },
  { id: "noite", nome: "Gestão de Projetos", sigla: "GP", dia: 3, ini: 16, fim: 18, turma: "A" },
  { id: "so", nome: "Sistemas Operacionais", sigla: "SO", dia: 3, ini: 8, fim: 10, turma: "A" },
  { id: "redes", nome: "Redes de Comunicação I", sigla: "Redes", dia: 0, ini: 14, fim: 16, turma: "C" },
  { id: "estat", nome: "Estatística", sigla: "Est", dia: 2, ini: 8, fim: 10, turma: "A" },
];

const ia: Bloco = { id: "ia", nome: "Inteligência Artificial", sigla: "IA", dia: 1, ini: 10, fim: 12, turma: "A" };
const iaB: Bloco = { id: "ia", nome: "Inteligência Artificial", sigla: "IA", dia: 4, ini: 8, fim: 10, turma: "B" };
const noiteB: Bloco = { id: "noite", nome: "Gestão de Projetos", sigla: "GP", dia: 5, ini: 8, fim: 10, turma: "B" };

export type Cenario = { id: string; pedido: string; inicial: Bloco[]; passos: Passo[] };

export const cenarios: Cenario[] = [
  {
    id: "ia", pedido: "coloca IA na minha grade", inicial: baseGrade.filter((b) => b.id !== "noite"),
    passos: [
      { t: "usuario", texto: "coloca IA na minha grade" },
      { t: "pensar" },
      { t: "zefe", texto: "Achei Inteligência Artificial. Vou começar pela turma A, terça das 10h às 12h." },
      { t: "add", bloco: ia },
      { t: "zefe", texto: "Choca com Estrutura de Dados I. A turma B é na sexta cedo e não conflita com nada. Troquei." },
      { t: "trocar", id: "ia", para: iaB },
      { t: "zefe", texto: "Pronto, sem conflitos. Se não gostar, é só pedir para desfazer." },
    ],
  },
  {
    id: "falta", pedido: "o que falta pra eu me formar?", inicial: [],
    passos: [
      { t: "usuario", texto: "o que falta pra eu me formar?" },
      { t: "pensar" },
      { t: "zefe", texto: "Faltam do 4º ao 8º semestre, mais os créditos eletivos. O que já dá para fazer agora entrou na grade ao lado." },
      { t: "add", bloco: baseGrade[0] },
      { t: "add", bloco: baseGrade[2] },
      { t: "add", bloco: baseGrade[1] },
      { t: "zefe", texto: "Inteligência Artificial ainda está travada: pede Estrutura de Dados I. Quando ela for cursada, o Zefe libera." },
    ],
  },
  {
    id: "quinta", pedido: "libera a quinta à tarde", inicial: baseGrade,
    passos: [
      { t: "usuario", texto: "libera a quinta à tarde" },
      { t: "pensar" },
      { t: "zefe", texto: "Só Gestão de Projetos cai na quinta à tarde. Existe a turma B, no sábado de manhã." },
      { t: "trocar", id: "noite", para: noiteB },
      { t: "zefe", texto: "Quinta à tarde livre. Confira se o sábado de manhã serve para você." },
    ],
  },
];

/* ---------------- Calouro ---------------- */

export const perguntasCalouro: { p: string; r: string }[] = [
  {
    p: "O que é crédito?",
    r: "É a medida de carga de uma disciplina. Em geral, 1 crédito são 15 horas no semestre: uma disciplina de 4 créditos tem 60 horas.",
  },
  {
    p: "O que é catálogo?",
    r: "É o conjunto de regras do curso: o que é obrigatório, em que semestre a proposta sugere cada disciplina e quantos créditos eletivos faltam. Costuma valer o do ano em que você ingressou.",
  },
  {
    p: "O que é eletiva?",
    r: "É uma disciplina que você escolhe para completar créditos do currículo. No catálogo ela aparece como “4 créditos eletivos”, sem código fixo.",
  },
  {
    p: "O que preciso cursar este semestre?",
    r: "O catálogo traz uma proposta de cumprimento, semestre a semestre. O Zefe parte dela, tira o que você já cursou e mostra o que já está liberado. É sugestão: quem decide é você.",
  },
];
