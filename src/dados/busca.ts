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
const escRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Pedaço curto (1-2 letras) só casa começo de palavra ("m" não acha "Termodinâmica"); a partir de 3 letras, em qualquer ponto.
const contem = (col: unknown, tokens: string[]): SQL =>
  and(...tokens.map((t) => {
    const v = variantes(t);
    if (v) return sql`${semAcento(col)} ~* ${`\\y(${v.join('|')})\\y`}`;
    return t.length < 3 ? sql`${semAcento(col)} ~* unaccent(${'\\y' + escRe(t)})` : sql`${semAcento(col)} ILIKE unaccent(${'%' + esc(t) + '%'})`;
  }))!;
const semAcentoJs = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Só disciplinas (catálogo + caderno): não roda as consultas de professor e sala. */
export const buscarDisciplinas = async (q: string, limite = 20) => (await buscar(q, limite, true)).disciplinas;

export async function buscar(q: string, limite = 20, soDisciplinas = false) {
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
    // nome que começa pelo pedaço vem antes; depois ordem alfabética
    soDisciplinas ? [] : db.select({ slug: professor.slug, nome: professor.nome }).from(professor).where(contem(professor.nome, tokens))
      .orderBy(sql`(${semAcento(professor.nome)} ~* unaccent(${'\\y' + escRe(tokens[0]!)})) DESC`, asc(professor.nome)).limit(limite),
    soDisciplinas ? [] : db.select({ sala: horario.sala }).from(horario).where(sql`${horario.sala} ILIKE ${'%' + colado + '%'}`).groupBy(horario.sala)
      .orderBy(sql`(${horario.sala} ILIKE ${colado + '%'}) DESC`, asc(horario.sala)).limit(limite),
  ]);

  const porCodigo = new Map(doCatalogo.map((d) => [d.codigo, d]));
  for (const d of doCaderno) if (!porCodigo.has(d.codigo)) porCodigo.set(d.codigo, d);
  const cod = bruto.toUpperCase();
  const consulta = semAcentoJs(tokens.join(' '));
  const ts = tokens.map(semAcentoJs);
  // 0 código começa pela consulta (em ordem de código); 1 nome começa pela consulta; 2 todo pedaço começa uma palavra do nome; 3 o resto (contém)
  const rank = (d: { codigo: string; nome: string }) => {
    if (d.codigo.startsWith(cod)) return 0;
    const nome = semAcentoJs(d.nome);
    if (nome.startsWith(consulta)) return 1;
    return ts.every((t) => nome.split(/[^a-z0-9]+/).some((p) => p.startsWith(t))) ? 2 : 3;
  };
  // shortcut: traz todas as disciplinas que casam e corta em JS (o rank mistura catálogo e caderno), mudar para LIMIT no SQL se a lista crescer muito
  const disciplinas = [...porCodigo.values()].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? a.codigo.localeCompare(b.codigo) : a.nome.localeCompare(b.nome))).slice(0, limite);

  return { disciplinas, professores: profs, salas: salas.map((s) => s.sala!).filter(Boolean) };
}
