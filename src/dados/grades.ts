import { and, asc, eq, ne } from 'drizzle-orm';
import type { Dia, Disciplina, Requisito } from '@/dac/tipos';
import { bloqueio as tBloqueio, catalogoDisciplina, db, grade as tGrade, gradeItem } from '@/db';
import { normalizarCodigo } from '@/dominio/codigo';
import { checarGrade, type Bloqueio, type ItemGrade } from '@/dominio/grade';
import { getHistorico, getPerfil } from './aluno';
import { getOferta } from './disciplinas';

export type { Achado, Bloqueio, ItemGrade } from '@/dominio/grade';
type Per = 1 | 2;
export interface GradeResolvida { id: string; ano: number; periodo: Per; nome: string; principal: boolean; itens: ItemGrade[]; bloqueios: Bloqueio[]; checagem: ReturnType<typeof checarGrade> }

// Objeto inexistente ou de outro usuário: mesmo erro, para não revelar a existência. Nada é alterado.
const naoEncontrada = () => new Error('grade não encontrada');
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

async function minhaGrade(userId: string, gradeId: string) {
  const id = Number(gradeId);
  if (!Number.isInteger(id)) return null;
  const [g] = await db.select().from(tGrade).where(and(eq(tGrade.id, id), eq(tGrade.user_id, userId)));
  return g ?? null;
}

export async function listarGrades(userId: string, ano: number, periodo: Per) {
  const rows = await db.select().from(tGrade).where(and(eq(tGrade.user_id, userId), eq(tGrade.ano, ano), eq(tGrade.periodo, periodo))).orderBy(asc(tGrade.id));
  return rows.map((g) => ({ id: String(g.id), nome: g.nome, principal: g.principal }));
}

export async function criarGrade(userId: string, ano: number, periodo: Per, nome: string): Promise<string> {
  const n = nome.trim();
  if (!n) throw new Error('a grade precisa de um nome');
  return db.transaction(async (tx) => {
    const outras = await tx.select({ id: tGrade.id }).from(tGrade).where(and(eq(tGrade.user_id, userId), eq(tGrade.ano, ano), eq(tGrade.periodo, periodo)));
    const [g] = await tx.insert(tGrade).values({ user_id: userId, ano, periodo, nome: n, principal: outras.length === 0 }).returning({ id: tGrade.id });
    return String(g!.id);
  });
}

/** Resolve o item no semestre da grade; previsão usa a base. Não achou turma/disciplina: devolve null. */
async function resolverItem(codigo: string, turma: string, ano: number, periodo: Per): Promise<{ d: Disciplina; t: Disciplina['turmas'][number]; tipo: 'oficial' | 'previsao' } | null> {
  const o = await getOferta(codigo, ano, periodo);
  if (!o.encontrada) return null;
  const d = o.tipo === 'oficial' ? o.disciplina : o.base;
  const t = d.turmas.find((x) => x.turma.toUpperCase() === turma.toUpperCase());
  return t ? { d, t, tipo: o.tipo } : null;
}

/**
 * Pré-requisito (regra simples): catalogo_disciplina.alternativas do ano de catálogo do aluno é OU de E;
 * uma alternativa vale quando todos os códigos estão cursada/cursando (parcial não distingue).
 * Sem perfil, sem entrada no catálogo ou sem a coluna: não verificado (nunca "cumprido").
 * Falta = códigos que faltam na alternativa mais próxima de valer.
 */
async function prereqs(userId: string, codigos: string[]) {
  const perfil = await getPerfil(userId);
  const hist = await getHistorico(userId);
  const faltam = new Map<string, string[]>();
  const naoVerificado = new Set<string>();
  for (const codigo of codigos) {
    if (hist.has(codigo)) continue; // já cursada/cursando: o aluno só reproduz a grade, pré-requisito não se aplica
    const [c] = perfil?.catalogo ? await db.select().from(catalogoDisciplina).where(and(eq(catalogoDisciplina.ano, perfil.catalogo), eq(catalogoDisciplina.codigo, codigo))) : [];
    if (!c || !Array.isArray(c.alternativas)) { naoVerificado.add(codigo); continue; }
    const alts = c.alternativas as Requisito[][];
    if (alts.length === 0) continue;
    const faltas = alts.map((a) => a.map((r) => r.codigo).filter((x) => !hist.has(x)));
    if (faltas.some((f) => f.length === 0)) continue;
    faltam.set(codigo, faltas.sort((a, b) => a.length - b.length)[0]!);
  }
  return { perfil, faltam, naoVerificado };
}

async function listarBloqueios(userId: string): Promise<Bloqueio[]> {
  const rows = await db.select().from(tBloqueio).where(eq(tBloqueio.user_id, userId)).orderBy(asc(tBloqueio.dia), asc(tBloqueio.inicio), asc(tBloqueio.id));
  return rows.map((b) => ({ id: String(b.id), nome: b.nome, dia: b.dia as Dia, inicio: b.inicio, fim: b.fim }));
}

async function resolver(userId: string, g: typeof tGrade.$inferSelect): Promise<GradeResolvida> {
  const periodo = g.periodo as Per;
  const rows = await db.select().from(gradeItem).where(eq(gradeItem.grade_id, g.id)).orderBy(asc(gradeItem.codigo));
  const itens: ItemGrade[] = await Promise.all(rows.map(async (r) => {
    const x = await resolverItem(r.codigo, r.turma, g.ano, periodo);
    // Oferta sumiu (ex.: caderno recoletado sem a turma): mantém o item, sem horário, para o aviso aparecer.
    if (!x) return { codigo: r.codigo, nome: r.codigo, turma: r.turma, creditos: null, campus: 'desconhecido' as const, horarios: [], tipo: 'oficial' as const, reservas: [] };
    return { codigo: r.codigo, nome: x.d.nome, turma: x.t.turma, creditos: x.d.creditos, campus: x.d.campus, horarios: x.t.horarios, tipo: x.tipo, reservas: x.t.reservas, ...(x.t.horarioIncompleto ? { horarioIncompleto: true } : {}) };
  }));
  const bloqueios = await listarBloqueios(userId);
  const p = await prereqs(userId, itens.map((i) => i.codigo));
  const checagem = checarGrade(itens, bloqueios, {
    ...(p.perfil?.curso != null ? { curso: p.perfil.curso } : {}),
    faltamPrereq: (c) => p.faltam.get(c) ?? [],
    prereqNaoVerificado: (c) => p.naoVerificado.has(c),
  });
  return { id: String(g.id), ano: g.ano, periodo, nome: g.nome, principal: g.principal, itens, bloqueios, checagem };
}

export async function getGrade(userId: string, gradeId: string): Promise<GradeResolvida | null> {
  const g = await minhaGrade(userId, gradeId);
  return g ? resolver(userId, g) : null;
}

/** Tudo ou nada: se alguma turma não existir no semestre, lança antes de gravar. Mesma disciplina de novo troca a turma. */
export async function alterarGrade(userId: string, gradeId: string, m: { adicionar?: { codigo: string; turma: string }[]; remover?: string[] }): Promise<GradeResolvida> {
  const g = await minhaGrade(userId, gradeId);
  if (!g) throw naoEncontrada();
  const add = (m.adicionar ?? []).map((a) => ({ codigo: normalizarCodigo(a.codigo).codigo, turma: a.turma.trim().toUpperCase() }));
  for (const a of add) {
    if (!(await resolverItem(a.codigo, a.turma, g.ano, g.periodo as Per)))
      throw new Error(`a turma ${a.turma} de ${a.codigo} não existe em ${g.periodo}S/${g.ano} (nem na previsão)`);
  }
  await db.transaction(async (tx) => {
    for (const c of m.remover ?? []) await tx.delete(gradeItem).where(and(eq(gradeItem.grade_id, g.id), eq(gradeItem.codigo, normalizarCodigo(c).codigo)));
    for (const a of add) await tx.insert(gradeItem).values({ grade_id: g.id, ...a }).onConflictDoUpdate({ target: [gradeItem.grade_id, gradeItem.codigo], set: { turma: a.turma } });
  });
  return resolver(userId, g);
}

export async function definirPrincipal(userId: string, gradeId: string): Promise<void> {
  const g = await minhaGrade(userId, gradeId);
  if (!g) throw naoEncontrada();
  await db.transaction(async (tx) => {
    await tx.update(tGrade).set({ principal: false }).where(and(eq(tGrade.user_id, userId), eq(tGrade.ano, g.ano), eq(tGrade.periodo, g.periodo)));
    await tx.update(tGrade).set({ principal: true }).where(eq(tGrade.id, g.id));
  });
}

/** Excluir a principal promove a mais antiga das outras do mesmo semestre (ou nenhuma). */
export async function excluirGrade(userId: string, gradeId: string): Promise<void> {
  const g = await minhaGrade(userId, gradeId);
  if (!g) throw naoEncontrada();
  await db.transaction(async (tx) => {
    await tx.delete(tGrade).where(eq(tGrade.id, g.id));
    if (!g.principal) return;
    const [prox] = await tx.select({ id: tGrade.id }).from(tGrade)
      .where(and(eq(tGrade.user_id, userId), eq(tGrade.ano, g.ano), eq(tGrade.periodo, g.periodo), ne(tGrade.id, g.id))).orderBy(asc(tGrade.id)).limit(1);
    if (prox) await tx.update(tGrade).set({ principal: true }).where(eq(tGrade.id, prox.id));
  });
}

export async function criarBloqueio(userId: string, b: Omit<Bloqueio, 'id'>): Promise<Bloqueio> {
  const nome = b.nome.trim();
  if (!nome) throw new Error('o bloqueio precisa de um nome');
  if (!DIAS.includes(b.dia)) throw new Error(`dia inválido: ${b.dia}`);
  if (!HORA.test(b.inicio) || !HORA.test(b.fim)) throw new Error('horário inválido; use HH:MM');
  if (b.inicio >= b.fim) throw new Error('o bloqueio precisa terminar depois de começar');
  const [r] = await db.insert(tBloqueio).values({ user_id: userId, nome, dia: b.dia, inicio: b.inicio, fim: b.fim }).returning();
  return { id: String(r!.id), nome, dia: b.dia, inicio: b.inicio, fim: b.fim };
}

export async function excluirBloqueio(userId: string, id: string): Promise<void> {
  const n = Number(id);
  const apagadas = Number.isInteger(n) ? await db.delete(tBloqueio).where(and(eq(tBloqueio.id, n), eq(tBloqueio.user_id, userId))).returning({ id: tBloqueio.id }) : [];
  if (!apagadas.length) throw new Error('bloqueio não encontrado');
}
