import { and, eq, inArray, notInArray } from 'drizzle-orm';
import type { db as Db } from '@/db';
import { horario, oferecimento, professor, semestre, turma, turmaProfessor } from '@/db/schema';
import { urlDisciplina, urlIndice, urlInstituto, type Baixar } from './baixar';
import { parseDisciplina, parseIndiceDisciplinas, parseIndiceInstitutos } from './caderno';
import type { Disciplina } from './tipos';

export const slugProfessor = (nome: string): string =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const em = <T>(xs: T[], n = 1000): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n));

export async function sincronizarCaderno(
  db: typeof Db,
  baixar: Baixar,
  ano: number,
  periodo: 1 | 2,
  opts: { institutos?: string[]; log?: (s: string) => void } = {},
): Promise<{ ok: number; erros: string[] }> {
  const log = opts.log ?? (() => {});
  const todos = parseIndiceInstitutos(await baixar(urlIndice(ano, periodo)), ano, periodo);
  const institutos = opts.institutos ? todos.filter((i) => opts.institutos!.includes(i)) : todos;
  const indice = (
    await Promise.all(
      institutos.map(async (inst) =>
        parseIndiceDisciplinas(await baixar(urlInstituto(ano, periodo, inst)), ano, periodo, inst).map((d) => ({ ...d, instituto: inst })),
      ),
    )
  ).flat();
  log(`${indice.length} disciplinas no índice de ${periodo}S/${ano}`);

  const agora = new Date();
  if (!indice.length) {
    // índice vazio = semestre não publicado; não apaga o que já havia
    await db.insert(semestre).values({ ano, periodo, publicado: false, coletado_em: agora })
      .onConflictDoUpdate({ target: [semestre.ano, semestre.periodo], set: { publicado: false, coletado_em: agora } });
    return { ok: 0, erros: [] };
  }

  const coletadas: Disciplina[] = [];
  const erros: string[] = [];
  await Promise.all(
    indice.map(async ({ codigo, instituto }) => {
      const url = urlDisciplina(ano, periodo, instituto, codigo);
      try {
        coletadas.push(parseDisciplina(await baixar(url), { codigo, instituto, fonte: { url, ano, periodo, coletadoEm: agora.toISOString() } }));
        if (coletadas.length % 50 === 0) log(`${coletadas.length}/${indice.length}`);
      } catch (e) {
        erros.push(`${codigo}: ${(e as Error).message}`);
      }
    }),
  );
  // quem falhou mantém os dados antigos; o resto do escopo é substituído
  const falhos = indice.filter((d) => erros.some((e) => e.startsWith(`${d.codigo}:`))).map((d) => d.codigo);

  await db.transaction(async (tx) => {
    await tx.insert(semestre).values({ ano, periodo, publicado: true, coletado_em: agora })
      .onConflictDoUpdate({ target: [semestre.ano, semestre.periodo], set: { publicado: true, coletado_em: agora } });
    const escopo = [eq(oferecimento.ano, ano), eq(oferecimento.periodo, periodo)];
    if (opts.institutos) escopo.push(inArray(oferecimento.instituto, institutos));
    if (falhos.length) escopo.push(notInArray(oferecimento.codigo, falhos));
    await tx.delete(oferecimento).where(and(...escopo)); // cascade leva turma, horario, turma_professor

    const novas = coletadas.filter((d) => !falhos.includes(d.codigo));
    const slugs = new Map<string, string>();
    for (const d of novas) for (const t of d.turmas) for (const n of t.docentes) slugs.set(slugProfessor(n), n);
    for (const lote of em([...slugs])) await tx.insert(professor).values(lote.map(([slug, nome]) => ({ slug, nome }))).onConflictDoNothing();
    const profId = new Map<string, number>();
    if (slugs.size) for (const p of await tx.select().from(professor).where(inArray(professor.slug, [...slugs.keys()]))) profId.set(p.slug, p.id);

    for (const lote of em(novas, 200)) {
      const ofs = await tx.insert(oferecimento).values(lote.map((d) => ({
        ano, periodo, codigo: d.codigo, nome: d.nome, creditos: d.creditos, instituto: d.instituto, campus: d.campus, url: d.fonte.url, coletado_em: agora,
      }))).returning({ id: oferecimento.id });
      const linhas = lote.flatMap((d, i) => d.turmas.map((t) => ({ t, oferecimento_id: ofs[i]!.id })));
      const ts = await tx.insert(turma).values(linhas.map(({ t, oferecimento_id }) => ({
        oferecimento_id, turma: t.turma, vagas: t.vagas, matriculados: t.matriculados, horario_incompleto: !!t.horarioIncompleto, reservas: t.reservas,
      }))).returning({ id: turma.id });
      const hs = linhas.flatMap(({ t }, i) => t.horarios.map((h) => ({ turma_id: ts[i]!.id, dia: h.dia, inicio: h.inicio, fim: h.fim, sala: h.sala || null })));
      for (const l of em(hs)) await tx.insert(horario).values(l);
      const tp = linhas.flatMap(({ t }, i) => [...new Set(t.docentes.map(slugProfessor))].map((s) => ({ turma_id: ts[i]!.id, professor_id: profId.get(s)! })));
      for (const l of em(tp)) await tx.insert(turmaProfessor).values(l);
    }
  });
  log(`${coletadas.length} salvas, ${erros.length} erros`);
  for (const e of erros) log(`  erro ${e}`);
  return { ok: coletadas.length, erros };
}
