import { z } from 'zod';

// Cartões do painel: montados SÓ a partir do resultado das ferramentas e validados aqui; nunca a partir de texto do modelo.
const horario = z.object({ dia: z.string(), inicio: z.string(), fim: z.string(), sala: z.string().optional() });
const nulavel = z.number().nullable();

const oferta = z.object({
  encontrada: z.literal(true), tipo: z.enum(['oficial', 'previsao']), codigo: z.string(), nome: z.string(), creditos: nulavel, campus: z.string(), semestre: z.string(),
  aviso: z.string().optional(), fonte: z.object({ url: z.string(), semestre: z.string() }),
  turmas: z.array(z.object({ turma: z.string(), horarios: z.array(horario), docentes: z.array(z.string()), vagas: nulavel.optional(), matriculados: nulavel.optional(), horarioIncompleto: z.boolean().optional() })),
  turmasOmitidas: z.number().optional(),
});

const turmas = z.object({
  tipo: z.enum(['oficial', 'previsao']), semestre: z.string(), total: z.number(), aviso: z.string().optional(), turmasOmitidas: z.number().optional(),
  turmas: z.array(z.object({ codigo: z.string(), nome: z.string(), creditos: nulavel, campus: z.string(), turma: z.string(), horarios: z.array(horario), vagas: nulavel.optional() })),
});

const grade = z.object({
  tipo: z.enum(['oficial', 'previsao']),
  grade: z.object({ id: z.string(), nome: z.string(), semestre: z.string(), principal: z.boolean() }),
  itens: z.array(z.object({ codigo: z.string(), nome: z.string(), turma: z.string(), creditos: nulavel, campus: z.string(), tipo: z.enum(['oficial', 'previsao']), horarios: z.array(horario), semHorario: z.boolean() })),
  bloqueios: z.array(z.object({ id: z.string(), nome: z.string(), dia: z.string(), inicio: z.string(), fim: z.string() })),
  checagem: z.object({
    ok: z.boolean(), verificado: z.boolean(), creditos: z.number(), achadosOmitidos: z.number().optional(),
    achados: z.array(z.object({ nivel: z.enum(['conflito', 'aviso']), motivo: z.string(), codigos: z.array(z.string()) })),
  }),
});

const parte = z.object({ feitos: z.number(), total: z.number(), emAndamento: z.number() });
const progresso = z.object({
  creditos: z.object({ obrigatorias: parte, eletivas: parte.extend({ naoVerificado: z.number() }) }),
  faltantes: z.array(z.object({ codigo: z.string(), nome: z.string(), creditos: z.number(), semestreSugerido: nulavel })),
  faltantesOmitidos: z.number().optional(),
  travadas: z.array(z.object({ codigo: z.string(), nome: z.string(), creditos: z.number(), faltamPrereq: z.array(z.string()) })),
  grupos: z.array(z.object({ texto: z.string(), creditos: z.number(), feitos: z.number(), emAndamento: z.number(), verificado: z.boolean() })),
});

const prereq = z.object({
  codigo: z.string(), nome: z.string(), prereqTexto: z.string().nullable(), verificado: z.boolean(), aviso: z.string().optional(), satisfeito: z.boolean().optional(),
  alternativas: z.array(z.array(z.object({ codigo: z.string(), parcial: z.boolean(), estado: z.string() }))).optional(),
  destrava: z.array(z.string()),
});

const esquemas = { oferta_disciplina: ['oferta', oferta], buscar_turmas: ['turmas', turmas], ver_grade: ['grade', grade], alterar_grade: ['grade', grade], meu_progresso: ['progresso', progresso], prerequisitos: ['prereq', prereq] } as const;

export type Cartao =
  | { tipo: 'oferta'; dados: z.infer<typeof oferta> }
  | { tipo: 'turmas'; dados: z.infer<typeof turmas> }
  | { tipo: 'grade'; dados: z.infer<typeof grade> }
  | { tipo: 'progresso'; dados: z.infer<typeof progresso> }
  | { tipo: 'prereq'; dados: z.infer<typeof prereq> };

export type ResultadoCartao = { ok: true; cartao: Cartao | null } | { ok: false; erro: string };

/** Sem cartão para a ferramenta (ou resultado com `erro`): ok com null. Forma inesperada: ok false (a tela mostra "não consegui exibir"). */
export function validarCartao(ferramenta: string, saida: unknown): ResultadoCartao {
  const e = (esquemas as Record<string, readonly [string, z.ZodType]>)[ferramenta];
  if (!e) return { ok: true, cartao: null };
  if (saida && typeof saida === 'object' && 'erro' in saida) return { ok: true, cartao: null };
  const r = e[1].safeParse(saida);
  return r.success ? { ok: true, cartao: { tipo: e[0], dados: r.data } as Cartao } : { ok: false, erro: z.prettifyError(r.error) };
}

export const cartaoDe = (ferramenta: string, saida: unknown): Cartao | null => {
  const r = validarCartao(ferramenta, saida);
  return r.ok ? r.cartao : null;
};

/** Item de ação: só quando a ferramenta devolveu acaoId e descricao. */
export const acaoDe = (saida: unknown): { acaoId: number; descricao: string } | null => {
  const r = z.object({ acaoId: z.number(), descricao: z.string() }).safeParse(saida);
  return r.success ? r.data : null;
};
