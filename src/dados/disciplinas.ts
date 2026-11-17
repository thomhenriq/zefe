import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { campusDoInstituto, type Campus, type Dia, type Disciplina, type Fonte, type Requisito, type Turma } from '@/dac/tipos';
import { catalogoDisciplina, db, horario, oferecimento, professor, semestre, turma, turmaProfessor } from '@/db';
import { normalizarCodigo } from '@/dominio/codigo';
import { preverOferta, type Oferta } from '@/dominio/oferta';

type Per = 1 | 2;
const rotulo = (ano: number, periodo: number) => `${periodo}S/${ano}`;

/** Disciplinas (com turmas, horários e docentes) dos oferecimentos que casam com `cond`. Só lê o banco. */
export async function carregarDisciplinas(cond: SQL): Promise<(Disciplina & { periodo: Per })[]> {
  const ofs = await db.select().from(oferecimento).where(cond);
  if (!ofs.length) return [];
  const ts = await db.select({ t: turma }).from(turma).innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id)).where(cond).orderBy(asc(turma.id));
  const hs = await db.select({ h: horario }).from(horario).innerJoin(turma, eq(horario.turma_id, turma.id)).innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id)).where(cond).orderBy(asc(horario.id));
  const ps = await db.select({ turma_id: turmaProfessor.turma_id, nome: professor.nome }).from(turmaProfessor)
    .innerJoin(professor, eq(turmaProfessor.professor_id, professor.id)).innerJoin(turma, eq(turmaProfessor.turma_id, turma.id))
    .innerJoin(oferecimento, eq(turma.oferecimento_id, oferecimento.id)).where(cond);

  const turmaPorId = new Map<number, Turma>();
  const turmasPorOf = new Map<number, Turma[]>();
  for (const { t } of ts) {
    const x: Turma = { turma: t.turma, vagas: t.vagas, matriculados: t.matriculados, horarios: [], docentes: [], reservas: t.reservas, ...(t.horario_incompleto ? { horarioIncompleto: true } : {}) };
    turmaPorId.set(t.id, x);
    (turmasPorOf.get(t.oferecimento_id) ?? turmasPorOf.set(t.oferecimento_id, []).get(t.oferecimento_id)!).push(x);
  }
  for (const { h } of hs) turmaPorId.get(h.turma_id)?.horarios.push({ dia: h.dia as Dia, inicio: h.inicio, fim: h.fim, sala: h.sala ?? '' });
  for (const p of ps) turmaPorId.get(p.turma_id)?.docentes.push(p.nome);

  return ofs.map((o) => {
    const fonte: Fonte = { url: o.url ?? '', ano: o.ano, periodo: o.periodo as Per, coletadoEm: o.coletado_em.toISOString() };
    return {
      codigo: o.codigo, nome: o.nome, creditos: o.creditos, instituto: o.instituto ?? '',
      campus: (o.campus as Campus | null) ?? campusDoInstituto(o.instituto ?? ''),
      turmas: turmasPorOf.get(o.id) ?? [], fonte, periodo: o.periodo as Per,
    };
  });
}

const doSemestre = (ano: number, periodo: Per) => and(eq(oferecimento.ano, ano), eq(oferecimento.periodo, periodo))!;
const tira = <T extends { periodo: Per }>({ periodo: _p, ...d }: T) => d;

async function semestreRow(ano: number, periodo: Per) {
  const [s] = await db.select().from(semestre).where(and(eq(semestre.ano, ano), eq(semestre.periodo, periodo)));
  return s ?? null;
}

export async function getDisciplina(codigoBruto: string, catalogo?: number) {
  const { codigo } = normalizarCodigo(codigoBruto);
  const [c] = await db.select().from(catalogoDisciplina)
    .where(and(eq(catalogoDisciplina.codigo, codigo), catalogo ? eq(catalogoDisciplina.ano, catalogo) : undefined))
    .orderBy(desc(catalogoDisciplina.ano)).limit(1);
  if (!c) return null;

  const destrava = (await db.select({ codigo: catalogoDisciplina.codigo }).from(catalogoDisciplina)
    .where(and(eq(catalogoDisciplina.ano, c.ano), sql`jsonb_path_exists(${catalogoDisciplina.alternativas}, '$[*][*] ? (@.codigo == $c)', jsonb_build_object('c', ${codigo}::text))`))
    .orderBy(asc(catalogoDisciplina.codigo))).map((r) => r.codigo);

  const ofs = (await carregarDisciplinas(eq(oferecimento.codigo, codigo)))
    .sort((a, b) => b.fonte.ano - a.fonte.ano || b.periodo - a.periodo)
    .map((d) => ({ ano: d.fonte.ano, periodo: d.periodo, url: d.fonte.url, turmas: d.turmas }));

  return {
    codigo: c.codigo, nome: c.nome, creditos: c.creditos, ementa: c.ementa, prereqTexto: c.prereq_texto,
    alternativas: (c.alternativas ?? []) as Requisito[][], destrava, oferecimentos: ofs,
  };
}

export async function getOferta(codigoBruto: string, ano: number, periodo: Per): Promise<Oferta> {
  const { codigo } = normalizarCodigo(codigoBruto);
  const s = await semestreRow(ano, periodo);
  const indiceVerificadoEm = s?.coletado_em?.toISOString() ?? null;

  if (s?.publicado) {
    const [d] = await carregarDisciplinas(and(doSemestre(ano, periodo), eq(oferecimento.codigo, codigo))!);
    if (d) return { encontrada: true, tipo: 'oficial', disciplina: tira(d), indiceVerificadoEm };
    return { encontrada: false, tipo: 'oficial', motivo: `${codigo} não aparece no caderno de ${rotulo(ano, periodo)}`, indiceVerificadoEm };
  }

  // Semestre sem caderno publicado (ou nunca coletado): previsão pelos 3 anos anteriores de mesma paridade.
  const anos = [ano - 1, ano - 2, ano - 3];
  const pub = await db.select({ ano: semestre.ano }).from(semestre).where(and(eq(semestre.periodo, periodo), eq(semestre.publicado, true), inArray(semestre.ano, anos)));
  const publicados = new Set(pub.map((p) => p.ano));
  const ds = publicados.size ? await carregarDisciplinas(and(eq(oferecimento.codigo, codigo), eq(oferecimento.periodo, periodo), inArray(oferecimento.ano, [...publicados]))!) : [];
  const historico = ds.map((d) => ({ ano: d.fonte.ano, periodo, turmas: d.turmas, url: d.fonte.url, d }));
  const { confianca, evidencias } = preverOferta(historico, ano);
  if (confianca === 'sem_historico') {
    const consultados = anos.map((a) => rotulo(a, periodo)).join(', ');
    return { encontrada: false, tipo: 'previsao', motivo: `${rotulo(ano, periodo)} ainda não foi publicado e ${codigo} não aparece em ${consultados}`, indiceVerificadoEm };
  }
  return {
    encontrada: true, tipo: 'previsao', confianca, base: tira(evidencias[0]!.d),
    evidencias: evidencias.map(({ d: _d, ...e }) => e), indiceVerificadoEm,
  };
}

export interface Janela { dia: Dia; inicio: string; fim: string; campus?: Campus }

export async function buscarTurmas(ano: number, periodo: Per, janelas: Janela[], opts: { limite?: number } = {}) {
  const s = await semestreRow(ano, periodo);
  let tipo: 'oficial' | 'previsao' = 'oficial';
  let base = { ano, periodo };
  if (!s?.publicado) {
    tipo = 'previsao';
    const pub = await db.select({ ano: semestre.ano }).from(semestre)
      .where(and(eq(semestre.periodo, periodo), eq(semestre.publicado, true), inArray(semestre.ano, [ano - 1, ano - 2, ano - 3]))).orderBy(desc(semestre.ano)).limit(1);
    base = { ano: pub[0]?.ano ?? ano - 1, periodo };
  }
  const todas = await carregarDisciplinas(doSemestre(base.ano, base.periodo));
  if (!todas.length) return { tipo, resultados: [], aviso: `nada coletado para ${rotulo(base.ano, base.periodo)}; rode: bun run sync caderno ${base.ano} ${base.periodo}` };

  const cabe = (d: Disciplina, t: Turma) =>
    t.horarios.length > 0 && !t.horarioIncompleto &&
    t.horarios.every((h) => janelas.some((j) => j.dia === h.dia && j.inicio <= h.inicio && h.fim <= j.fim && (!j.campus || j.campus === d.campus)));
  const todos: { codigo: string; nome: string; creditos: number | null; campus: Campus; turma: Turma; fonte: Fonte }[] = [];
  for (const d of todas) for (const t of d.turmas) if (cabe(d, t)) todos.push({ codigo: d.codigo, nome: d.nome, creditos: d.creditos, campus: d.campus, turma: t, fonte: d.fonte });
  todos.sort((a, b) => a.codigo.localeCompare(b.codigo) || a.turma.turma.localeCompare(b.turma.turma));

  const limite = opts.limite ?? 200;
  const avisos: string[] = [];
  if (tipo === 'previsao') avisos.push(`${rotulo(ano, periodo)} não publicado; turmas de ${rotulo(base.ano, base.periodo)} usadas como previsão`);
  if (todos.length > limite) avisos.push(`mostrando ${limite} de ${todos.length} turmas`);
  return { tipo, resultados: todos.slice(0, limite), ...(avisos.length ? { aviso: avisos.join('; ') } : {}) };
}
