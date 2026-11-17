import { and, asc, sql, type SQL } from 'drizzle-orm';
import { catalogoDisciplina, db, horario, oferecimento, professor } from '@/db';
import { normalizarCodigo } from '@/dominio/codigo';
import { garantirExtensoes } from './extensoes';

const esc = (t: string) => t.replace(/[\\%_]/g, '\\$&');
const semAcento = (c: unknown) => sql`unaccent(${c})`;
/** Todos os pedaços da consulta têm de aparecer (sem acento, sem caixa). */
// Número e romano se equivalem como palavra inteira: "cálculo 1" acha "Cálculo I" e vice-versa.
const NUMERAIS = [['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']] as const;
const variantes = (t: string) => NUMERAIS.find((p) => p.some((v) => v.toLowerCase() === t.toLowerCase()));
const contem = (col: unknown, tokens: string[]): SQL =>
  and(...tokens.map((t) => {
    const v = variantes(t);
    return v ? sql`${semAcento(col)} ~* ${`\\y(${v.join('|')})\\y`}` : sql`${semAcento(col)} ILIKE unaccent(${'%' + esc(t) + '%'})`;
  }))!;

export async function buscar(q: string, limite = 20) {
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { disciplinas: [], professores: [], salas: [] };
  await garantirExtensoes();
  const n = normalizarCodigo(q);
  const bruto = n.turma ? n.codigo : tokens.join(''); // 'SI702A' busca SI702
  const colado = esc(bruto);

  const [doCatalogo, doCaderno, profs, salas] = await Promise.all([
    db.selectDistinctOn([catalogoDisciplina.codigo], { codigo: catalogoDisciplina.codigo, nome: catalogoDisciplina.nome, creditos: catalogoDisciplina.creditos })
      .from(catalogoDisciplina)
      .where(sql`${contem(catalogoDisciplina.nome, tokens)} OR ${catalogoDisciplina.codigo} ILIKE ${colado + '%'}`)
      .orderBy(asc(catalogoDisciplina.codigo), sql`${catalogoDisciplina.ano} DESC`),
    db.selectDistinctOn([oferecimento.codigo], { codigo: oferecimento.codigo, nome: oferecimento.nome, creditos: oferecimento.creditos })
      .from(oferecimento)
      .where(sql`${contem(oferecimento.nome, tokens)} OR ${oferecimento.codigo} ILIKE ${colado + '%'}`)
      .orderBy(asc(oferecimento.codigo), sql`${oferecimento.ano} DESC, ${oferecimento.periodo} DESC`),
    db.select({ slug: professor.slug, nome: professor.nome }).from(professor).where(contem(professor.nome, tokens)).orderBy(asc(professor.nome)).limit(limite),
    db.selectDistinct({ sala: horario.sala }).from(horario).where(sql`${horario.sala} ILIKE ${'%' + colado + '%'}`).orderBy(asc(horario.sala)).limit(limite),
  ]);

  const porCodigo = new Map(doCatalogo.map((d) => [d.codigo, d]));
  for (const d of doCaderno) if (!porCodigo.has(d.codigo)) porCodigo.set(d.codigo, d);
  const cod = bruto.toUpperCase();
  // código começando pela consulta primeiro, depois nome começando pela consulta, depois o resto
  const rank = (d: { codigo: string; nome: string }) =>
    d.codigo.startsWith(cod) ? 0 : d.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().startsWith(tokens[0]!.toLowerCase()) ? 1 : 2;
  // shortcut: traz todas as disciplinas que casam e corta em JS (o rank mistura catálogo e caderno), mudar para LIMIT no SQL se a lista crescer muito
  const disciplinas = [...porCodigo.values()].sort((a, b) => rank(a) - rank(b) || a.nome.localeCompare(b.nome)).slice(0, limite);

  return { disciplinas, professores: profs, salas: salas.map((s) => s.sala!).filter(Boolean) };
}
