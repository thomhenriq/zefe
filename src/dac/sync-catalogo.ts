import { and, eq, sql } from 'drizzle-orm';
import type { db as Db } from '@/db';
import { catalogoDisciplina, curriculo, curriculoEletiva, curriculoObrigatoria, curriculoPropostaEletiva, curso } from '@/db/schema';
import type { Baixar } from './baixar';
import { idsCoordenadorias2020, parseCatalogo, parseCatalogo2020, urlCatalogo, urlCoordenadoria2020, urlIndiceCoordenadorias2020 } from './catalogo';
import { parseCurriculoPleno, parseCursos, parseProposta, urlCurriculo, urlIndiceCatalogo, urlSugestao } from './curriculo';
import type { CurriculoPleno, EntradaCatalogo, Proposta } from './tipos';

const em = <T>(xs: T[], n = 500): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n));
const prefixo = (codigo: string) => /^[A-Z]+/.exec(codigo)![0];

/** Grava curso, currículos (por modalidade), proposta e as páginas de disciplina dos prefixos usados. ok = cursos gravados. */
export async function sincronizarCatalogo(
  db: typeof Db,
  baixar: Baixar,
  ano: number,
  opts: { cursos?: number[]; log?: (s: string) => void } = {},
): Promise<{ ok: number; erros: string[] }> {
  const log = opts.log ?? (() => {});
  const todos = parseCursos(await baixar(urlIndiceCatalogo(ano)));
  const cursos = opts.cursos ? todos.filter((c) => opts.cursos!.includes(c.numero)) : todos;
  const erros: string[] = [];
  for (const n of opts.cursos ?? []) if (!todos.some((c) => c.numero === n)) erros.push(`curso ${n}: não está no índice de ${ano}`);

  const coletados: { c: (typeof cursos)[number]; pleno: CurriculoPleno; propostas: Proposta[] }[] = [];
  await Promise.all(
    cursos.map(async (c) => {
      try {
        const [pleno, propostas] = [parseCurriculoPleno(await baixar(urlCurriculo(ano, c.numero)), c.numero), parseProposta(await baixar(urlSugestao(ano, c.numero)))];
        coletados.push({ c, pleno, propostas });
      } catch (e) {
        erros.push(`curso ${c.numero}: ${(e as Error).message}`);
      }
    }),
  );
  log(`${coletados.length}/${cursos.length} cursos lidos`);

  const prefixos = new Set<string>();
  for (const { pleno } of coletados)
    for (const m of pleno.modalidades) {
      for (const cod of [...m.obrigatorias, ...m.eletivas.flatMap((g) => g.codigos ?? [])]) prefixos.add(prefixo(cod));
    }
  const disciplinas = new Map<string, EntradaCatalogo>();
  if (ano === 2020) {
    // 2020: uma página por coordenadoria, com todas as disciplinas; falha de uma coordenadoria vira erro, não derruba o resto
    try {
      await Promise.all(
        idsCoordenadorias2020(await baixar(urlIndiceCoordenadorias2020)).map(async (id) => {
          try {
            for (const [k, v] of parseCatalogo2020(await baixar(urlCoordenadoria2020(id)))) disciplinas.set(k, v);
          } catch (e) {
            erros.push(`coordenadoria ${id}: ${(e as Error).message}`);
          }
        }),
      );
    } catch (e) {
      erros.push(`coordenadorias 2020: ${(e as Error).message}`);
    }
    if (!disciplinas.size) erros.push('catálogo 2020: nenhuma disciplina lida');
  } else
  await Promise.all(
    [...prefixos].map(async (p) => {
      try {
        for (const [k, v] of parseCatalogo(await baixar(urlCatalogo(ano, p)))) disciplinas.set(k, v);
      } catch (e) {
        erros.push(`disciplinas ${p}: ${(e as Error).message}`); // prefixo sem página não derruba o currículo
      }
    }),
  );
  log(`${disciplinas.size} disciplinas em ${prefixos.size} prefixos`);

  await db.transaction(async (tx) => {
    for (const { c, pleno, propostas } of coletados) {
      await tx.insert(curso).values({ numero: c.numero, nome: c.nome, turno: c.turno })
        .onConflictDoUpdate({ target: curso.numero, set: { nome: c.nome, turno: c.turno } });
      await tx.delete(curriculo).where(and(eq(curriculo.ano, ano), eq(curriculo.curso, c.numero))); // cascade
      for (const m of pleno.modalidades) {
        const proposta = propostas.find((p) => p.modalidade === m.sigla);
        if (!proposta) erros.push(`curso ${c.numero}${m.sigla ? ` ${m.sigla}` : ''}: sem proposta de currículo para a modalidade`);
        const [{ id }] = await tx.insert(curriculo).values({
          ano, curso: c.numero, modalidade: m.sigla, modalidade_nome: m.nome, url: urlCurriculo(ano, c.numero),
        }).returning({ id: curriculo.id });
        const sugerido = new Map<string, number>();
        for (const s of proposta?.semestres ?? []) for (const cod of s.codigos) if (!sugerido.has(cod)) sugerido.set(cod, s.semestre);
        await tx.insert(curriculoObrigatoria).values(m.obrigatorias.map((codigo) => ({ curriculo_id: id, codigo, semestre_sugerido: sugerido.get(codigo) ?? null })));
        if (m.eletivas.length)
          await tx.insert(curriculoEletiva).values(m.eletivas.map((g) => ({ curriculo_id: id, creditos: g.creditos, texto: g.texto, codigos: g.codigos, verificado: g.verificado })));
        const pe = (proposta?.semestres ?? []).filter((s) => s.creditosEletivos > 0);
        if (pe.length) await tx.insert(curriculoPropostaEletiva).values(pe.map((s) => ({ curriculo_id: id, semestre: s.semestre, creditos: s.creditosEletivos })));
      }
    }
    for (const lote of em([...disciplinas.values()]))
      await tx.insert(catalogoDisciplina).values(lote.map((d) => ({
        ano, codigo: d.codigo, nome: d.nome, creditos: d.creditos, ementa: d.ementa, prereq_texto: d.prereqTexto, alternativas: d.alternativas,
      }))).onConflictDoUpdate({
        target: [catalogoDisciplina.ano, catalogoDisciplina.codigo],
        set: { nome: sql`excluded.nome`, creditos: sql`excluded.creditos`, ementa: sql`excluded.ementa`, prereq_texto: sql`excluded.prereq_texto`, alternativas: sql`excluded.alternativas` },
      });
  });
  for (const e of erros) log(`  erro ${e}`);
  return { ok: coletados.length, erros };
}
