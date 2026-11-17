import { eq } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';
import { acao, db } from '@/db';
import type { Fonte } from '@/dac/tipos';
import { getHistorico, getIntegralizacao, marcarHistorico, type Estado } from '@/dados/aluno';
import { buscar } from '@/dados/busca';
import { buscarTurmas, getDisciplina, getOferta } from '@/dados/disciplinas';
import { alterarGrade, criarBloqueio, criarGrade, excluirBloqueio, getGrade, listarGrades, type GradeResolvida } from '@/dados/grades';
import { normalizarCodigo } from '@/dominio/codigo';
import type { Integralizacao } from '@/dominio/integralizacao';
import { proximoSemestre } from '@/dominio/oferta';
import { lerBloqueio, type Desfazer } from './desfazer';

export interface Contexto { userId: string; conversaId: string; gradeId: string | null }
type Per = 1 | 2;

const MAX = 30; // itens por lista devolvida ao modelo
const rotulo = (ano: number, periodo: number) => `${periodo}S/${ano}`;
const fonteDe = (f: Pick<Fonte, 'url' | 'ano' | 'periodo'>) => ({ url: f.url, semestre: rotulo(f.ano, f.periodo) });
const corta = <T>(xs: T[]) => ({ itens: xs.slice(0, MAX), ...(xs.length > MAX ? { omitidos: xs.length - MAX } : {}) });
const codigoSchema = z.string().describe('Código da disciplina, pode vir solto: "si702", "SI 702", "SI702A".');
const anoSchema = z.number().int().optional().describe('Ano do semestre, ex.: 2027. Se faltar, usa o semestre da grade aberta (ou o próximo semestre).');
const periodoSchema = z.union([z.literal(1), z.literal(2)]).optional().describe('1 ou 2. Se faltar, usa o semestre da grade aberta (ou o próximo semestre).');
const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe('Horário no formato HH:MM, ex.: "08:00".');
const diaSchema = z.enum(['seg', 'ter', 'qua', 'qui', 'sex', 'sab']);

// Nunca lança para o modelo: qualquer falha vira { erro }.
const seguro = <I, O>(fn: (i: I) => Promise<O>) => async (i: I): Promise<O | { erro: string }> => {
  try { return await fn(i); } catch (e) { return { erro: e instanceof Error && e.message ? e.message : 'erro inesperado' }; }
};

export function resumirProgresso(i: Integralizacao) {
  const por = (estado: string) => i.disciplinas.filter((d) => d.estado === estado);
  const faltantes = corta(por('faltando').map((d) => ({ codigo: d.codigo, nome: d.nome, creditos: d.creditos, semestreSugerido: d.semestreSugerido })));
  return {
    creditos: i.creditos,
    faltantes: faltantes.itens, ...(faltantes.omitidos ? { faltantesOmitidos: faltantes.omitidos } : {}),
    travadas: por('travada').map((d) => ({ codigo: d.codigo, nome: d.nome, creditos: d.creditos, faltamPrereq: d.faltamPrereq })),
    planejadas: por('planejada').map((d) => d.codigo),
    grupos: i.grupos.map((g) => ({
      texto: g.texto, creditos: g.creditos, feitos: g.feitos, emAndamento: g.emAndamento, excedente: g.excedente, verificado: g.verificado,
      ...(g.verificado ? {} : { situacao: 'não verificado' as const }), // regra de catálogo não entendida: créditos não contam como cumpridos
    })),
    naoClassificadas: i.naoClassificadas, foraDoCurriculo: i.foraDoCurriculo,
  };
}

function descreverGrade(g: GradeResolvida) {
  return {
    tipo: g.itens.some((i) => i.tipo === 'previsao') ? 'previsao' as const : 'oficial' as const,
    grade: { id: g.id, nome: g.nome, semestre: rotulo(g.ano, g.periodo), principal: g.principal },
    itens: g.itens.map((i) => ({ codigo: i.codigo, nome: i.nome, turma: i.turma, creditos: i.creditos, campus: i.campus, tipo: i.tipo, horarios: i.horarios, semHorario: i.horarios.length === 0 || !!i.horarioIncompleto })),
    bloqueios: g.bloqueios,
    checagem: g.checagem,
  };
}

export function criarFerramentas(ctx: Contexto) {
  const { userId } = ctx;
  const conversaId = Number.isInteger(Number(ctx.conversaId)) ? Number(ctx.conversaId) : null; // conversa.id é serial

  async function semestreDe(ano?: number, periodo?: Per): Promise<{ ano: number; periodo: Per }> {
    const g = ano && periodo ? null : ctx.gradeId ? await getGrade(userId, ctx.gradeId) : null;
    const base = g ?? proximoSemestre();
    return { ano: ano ?? base.ano, periodo: periodo ?? base.periodo };
  }

  async function gradeAberta(): Promise<GradeResolvida | null> {
    if (ctx.gradeId) return getGrade(userId, ctx.gradeId);
    const { ano, periodo } = proximoSemestre();
    const p = (await listarGrades(userId, ano, periodo)).find((g) => g.principal);
    return p ? getGrade(userId, p.id) : null;
  }

  // Grava a ação ANTES de mexer nos dados (falhou ao gravar: nada mudou); se a mudança falhar, apaga o registro.
  async function comAcao<T>(tipo: string, descricao: string, desfazer: Desfazer, mudar: () => Promise<T>) {
    const [a] = await db.insert(acao).values({ user_id: userId, conversa_id: conversaId, tipo, descricao, desfazer }).returning({ id: acao.id });
    try { return { acaoId: a!.id, descricao, resultado: await mudar() }; }
    catch (e) { await db.delete(acao).where(eq(acao.id, a!.id)); throw e; }
  }

  return {
    buscar_disciplinas: tool({
      description: 'Procura disciplinas, professores e salas pelo nome ou pelo código. Use quando o aluno citar uma disciplina pelo nome ou quando você não souber o código. Devolve até 10 disciplinas (codigo, nome, creditos), professores e salas. O texto pode ter qualquer caixa e não precisa de acento.',
      inputSchema: z.object({ texto: z.string().describe('Nome, pedaço do nome ou código, ex.: "calculo", "si702".') }),
      execute: seguro(async ({ texto }: { texto: string }) => {
        const r = await buscar(texto, 10);
        return { disciplinas: r.disciplinas, professores: r.professores.map((p) => p.nome), salas: r.salas };
      }),
    }),

    oferta_disciplina: tool({
      description: 'Mostra as turmas, horários, salas, docentes e vagas de UMA disciplina em um semestre. Use para "tem turma de X?", "que horas é X?". Devolve tipo "oficial" (caderno publicado) ou "previsao" (semestre ainda não publicado, baseado em anos anteriores: diga sempre que é previsão). Inclui fonte (link da DAC e semestre). O código pode ser digitado de qualquer jeito.',
      inputSchema: z.object({ codigo: codigoSchema, ano: anoSchema, periodo: periodoSchema }),
      execute: seguro(async ({ codigo, ano, periodo }: { codigo: string; ano?: number | undefined; periodo?: Per | undefined }) => {
        const s = await semestreDe(ano, periodo);
        const o = await getOferta(codigo, s.ano, s.periodo);
        const sem = rotulo(s.ano, s.periodo);
        if (!o.encontrada) return { erro: o.motivo, encontrada: false, tipo: o.tipo, semestre: sem };
        const d = o.tipo === 'oficial' ? o.disciplina : o.base;
        const t = corta(d.turmas.map((x) => ({ turma: x.turma, horarios: x.horarios, docentes: x.docentes, vagas: x.vagas, matriculados: x.matriculados, reservas: x.reservas, ...(x.horarioIncompleto ? { horarioIncompleto: true } : {}) })));
        return {
          encontrada: true, tipo: o.tipo, codigo: d.codigo, nome: d.nome, creditos: d.creditos, campus: d.campus, semestre: sem,
          ...(o.tipo === 'previsao' ? { confianca: o.confianca, aviso: `previsão para ${sem}, baseada em ${o.evidencias.map((e) => rotulo(e.ano, e.periodo)).join(', ')}; ainda não é oficial`, evidencias: o.evidencias.map((e) => ({ semestre: rotulo(e.ano, e.periodo), url: e.url })) } : {}),
          fonte: fonteDe(d.fonte), turmas: t.itens, ...(t.omitidos ? { turmasOmitidas: t.omitidos } : {}),
        };
      }),
    }),

    buscar_turmas: tool({
      description: 'Acha turmas cujos horários cabem inteiros dentro das janelas livres do aluno (útil para "o que posso cursar terça à noite?"). Cada janela tem dia (seg, ter, qua, qui, sex, sab), inicio e fim em HH:MM e, se quiser, campus (limeira, barao, piracicaba). Devolve tipo "oficial" ou "previsao", até 30 turmas (com codigo, nome, creditos, turma, horarios e fonte) e quantas foram omitidas. Lista vazia significa que nada cabe.',
      inputSchema: z.object({
        janelas: z.array(z.object({ dia: diaSchema, inicio: horaSchema, fim: horaSchema, campus: z.enum(['limeira', 'barao', 'piracicaba']).optional() })).describe('Janelas em que o aluno pode ter aula.'),
        ano: anoSchema, periodo: periodoSchema,
      }),
      execute: seguro(async ({ janelas, ano, periodo }: { janelas: { dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'; inicio: string; fim: string; campus?: 'limeira' | 'barao' | 'piracicaba' | undefined }[]; ano?: number | undefined; periodo?: Per | undefined }) => {
        const s = await semestreDe(ano, periodo);
        const r = await buscarTurmas(s.ano, s.periodo, janelas.map((j) => ({ dia: j.dia, inicio: j.inicio, fim: j.fim, ...(j.campus ? { campus: j.campus } : {}) })));
        const c = corta(r.resultados.map((x) => ({ codigo: x.codigo, nome: x.nome, creditos: x.creditos, campus: x.campus, turma: x.turma.turma, horarios: x.turma.horarios, vagas: x.turma.vagas, fonte: fonteDe(x.fonte) })));
        return { tipo: r.tipo, semestre: rotulo(s.ano, s.periodo), total: r.resultados.length, turmas: c.itens, ...(c.omitidos ? { turmasOmitidas: c.omitidos } : {}), ...(r.aviso ? { aviso: r.aviso } : {}) };
      }),
    }),

    prerequisitos: tool({
      description: 'Mostra o pré-requisito de uma disciplina e, para cada código exigido, se o aluno já cursou, está cursando ou não fez. Use antes de sugerir uma disciplina. "alternativas" é uma lista de opções (basta cumprir UMA opção inteira); "satisfeito" é true quando alguma opção está completa (cursando conta como cumprido se for aprovado). Se o catálogo da disciplina não for conhecido, "verificado" é false: não afirme nada. Também lista o que a disciplina destrava.',
      inputSchema: z.object({ codigo: codigoSchema }),
      execute: seguro(async ({ codigo }: { codigo: string }) => {
        const d = await getDisciplina(codigo);
        if (!d) return { erro: `não encontrei a disciplina ${normalizarCodigo(codigo).codigo}` };
        const h = await getHistorico(userId);
        const alternativas = d.alternativas.map((a) => a.map((r) => ({ codigo: r.codigo, parcial: r.parcial, estado: h.get(r.codigo) ?? 'nao_fiz' })));
        const verificado = d.catalogo !== null;
        const satisfeito = alternativas.length === 0 || alternativas.some((a) => a.every((r) => r.estado !== 'nao_fiz'));
        const dest = corta(d.destrava);
        return {
          codigo: d.codigo, nome: d.nome, creditos: d.creditos, prereqTexto: d.prereqTexto, catalogo: d.catalogo, verificado,
          ...(verificado ? { satisfeito, alternativas } : { aviso: 'catálogo não encontrado: pré-requisito não verificado' }),
          destrava: dest.itens, ...(dest.omitidos ? { destravaOmitidas: dest.omitidos } : {}),
        };
      }),
    }),

    meu_progresso: tool({
      description: 'Resumo da integralização do aluno: créditos feitos/total de obrigatórias e eletivas, disciplinas obrigatórias que faltam, as travadas por pré-requisito (com o que falta) e os grupos de eletivas. Grupos com situacao "não verificado" têm regra que o sistema não entendeu: diga isso e não conte os créditos deles. Use para "o que falta?", "quanto já fiz?".',
      inputSchema: z.object({}),
      execute: seguro(async () => resumirProgresso(await getIntegralizacao(userId))),
    }),

    ver_grade: tool({
      description: 'Mostra a grade que o aluno está montando: turmas escolhidas (com horários), bloqueios, créditos e a checagem (conflitos e avisos, calculados pelo sistema). Use antes de sugerir mudanças e depois de alterar. Se checagem.verificado for false, diga que a checagem está incompleta.',
      inputSchema: z.object({}),
      execute: seguro(async () => {
        const g = await gradeAberta();
        if (!g) {
          const p = proximoSemestre();
          return { erro: `você ainda não tem grade para ${rotulo(p.ano, p.periodo)}` };
        }
        return descreverGrade(g);
      }),
    }),

    alterar_grade: tool({
      description: 'Adiciona e/ou remove turmas na grade do aluno, direto no rascunho (o aluno pode desfazer). "adicionar" recebe pares codigo+turma (ex.: SI702, turma "A"); adicionar uma disciplina que já está na grade troca a turma. "remover" recebe códigos. Só use turmas que vieram de oferta_disciplina ou buscar_turmas. Devolve a grade nova com a checagem, acaoId e descricao; se der erro nada é alterado.',
      inputSchema: z.object({
        adicionar: z.array(z.object({ codigo: codigoSchema, turma: z.string().describe('Letra da turma, ex.: "A".') })).optional(),
        remover: z.array(codigoSchema).optional(),
      }),
      execute: seguro(async ({ adicionar, remover }: { adicionar?: { codigo: string; turma: string }[] | undefined; remover?: string[] | undefined }) => {
        if (!adicionar?.length && !remover?.length) throw new Error('nada a alterar: informe adicionar ou remover');
        let g = await gradeAberta();
        let gradeCriada = false;
        if (!g) {
          const { ano, periodo } = proximoSemestre();
          g = (await getGrade(userId, await criarGrade(userId, ano, periodo, 'Minha grade')))!;
          gradeCriada = true;
        }
        const antes = new Map(g.itens.map((i) => [i.codigo, i.turma]));
        const novos: string[] = [];
        const anterior = new Map<string, string>();
        const nc = (c: string) => normalizarCodigo(c).codigo;
        for (const c of (remover ?? []).map(nc)) if (antes.has(c)) anterior.set(c, antes.get(c)!);
        for (const a of adicionar ?? []) {
          const c = nc(a.codigo);
          if (antes.has(c)) anterior.set(c, antes.get(c)!); else if (!novos.includes(c)) novos.push(c);
        }
        const partes = [
          ...(adicionar ?? []).map((a) => `${antes.has(nc(a.codigo)) ? 'troquei para' : 'adicionei'} ${nc(a.codigo)} turma ${a.turma.trim().toUpperCase()}`),
          ...(remover ?? []).map((c) => `removi ${nc(c)}`),
        ];
        const descricao = `Grade "${g.nome}": ${partes.join('; ')}`;
        const gid = g.id;
        const r = await comAcao('alterar_grade', descricao, { tipo: 'alterar_grade', gradeId: gid, remover: novos, adicionar: [...anterior].map(([codigo, turma]) => ({ codigo, turma })), ...(gradeCriada ? { gradeCriada: true as const } : {}) },
          () => alterarGrade(userId, gid, { ...(adicionar ? { adicionar } : {}), ...(remover ? { remover } : {}) }));
        return { acaoId: r.acaoId, descricao, ...descreverGrade(r.resultado) };
      }),
    }),

    marcar_historico: tool({
      description: 'Marca no histórico do aluno que uma disciplina foi cursada (já passou), está sendo cursada, ou que ele não fez ("nao_fiz", remove a marca). Use só quando o aluno disser isso. Devolve acaoId e descricao; o aluno pode desfazer.',
      inputSchema: z.object({ codigo: codigoSchema, estado: z.enum(['cursada', 'cursando', 'nao_fiz']) }),
      execute: seguro(async ({ codigo, estado }: { codigo: string; estado: 'cursada' | 'cursando' | 'nao_fiz' }) => {
        const d = await getDisciplina(codigo);
        if (!d) throw new Error(`não encontrei a disciplina ${normalizarCodigo(codigo).codigo}`);
        const novo: Estado | null = estado === 'nao_fiz' ? null : estado;
        const anterior = (await getHistorico(userId)).get(d.codigo) ?? null;
        const descricao = `${d.codigo} ${d.nome}: ${novo === null ? 'tirei a marca do histórico' : `marquei como ${novo}`}`;
        const r = await comAcao('marcar_historico', descricao, { tipo: 'marcar_historico', codigo: d.codigo, anterior }, () => marcarHistorico(userId, d.codigo, novo));
        return { acaoId: r.acaoId, descricao, codigo: d.codigo, estado: novo ?? 'nao_fiz' };
      }),
    }),

    criar_bloqueio: tool({
      description: 'Cria um horário bloqueado (estágio, trabalho, compromisso) que o aluno não pode ter aula. Vale para todas as grades dele. Dia: seg, ter, qua, qui, sex ou sab; inicio e fim em HH:MM. Devolve o bloqueio (com id), acaoId e descricao; o aluno pode desfazer.',
      inputSchema: z.object({ nome: z.string().describe('Nome do compromisso, ex.: "Estágio".'), dia: diaSchema, inicio: horaSchema, fim: horaSchema }),
      execute: seguro(async (b: { nome: string; dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'; inicio: string; fim: string }) => {
        const criado = await criarBloqueio(userId, b);
        const descricao = `Bloqueio "${criado.nome}": ${criado.dia} ${criado.inicio}–${criado.fim}`;
        try {
          const r = await comAcao('criar_bloqueio', descricao, { tipo: 'criar_bloqueio', bloqueioId: criado.id }, async () => undefined);
          return { acaoId: r.acaoId, descricao, bloqueio: criado };
        } catch (e) { await excluirBloqueio(userId, criado.id); throw e; } // sem registro de ação não deixa mudança órfã
      }),
    }),

    remover_bloqueio: tool({
      description: 'Remove um horário bloqueado pelo id (o id aparece em ver_grade, em "bloqueios", ou na resposta de criar_bloqueio). Devolve acaoId e descricao; o aluno pode desfazer.',
      inputSchema: z.object({ id: z.string().describe('Id do bloqueio.') }),
      execute: seguro(async ({ id }: { id: string }) => {
        const b = await lerBloqueio(userId, id);
        if (!b) throw new Error('bloqueio não encontrado');
        const descricao = `Removi o bloqueio "${b.nome}": ${b.dia} ${b.inicio}–${b.fim}`;
        const r = await comAcao('remover_bloqueio', descricao, { tipo: 'remover_bloqueio', bloqueio: { nome: b.nome, dia: b.dia as 'seg', inicio: b.inicio, fim: b.fim } }, () => excluirBloqueio(userId, id));
        return { acaoId: r.acaoId, descricao };
      }),
    }),
  };
}
