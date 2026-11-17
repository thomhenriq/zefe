import { afterAll, beforeEach, expect, test } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { catalogoDisciplina, curriculo, curriculoEletiva, curriculoObrigatoria, curriculoPropostaEletiva, db } from '@/db';
import type { Baixar } from '@/dac/baixar';
import { sincronizarCatalogo } from '@/dac/sync-catalogo';

const ANO = 1999; // nenhum catálogo real usa este ano
const fx = (n: string) => Bun.file(`${import.meta.dir}/fixtures/catalogo/${n}.html`).text();
const limpar = async () => {
  await db.delete(curriculo).where(eq(curriculo.ano, ANO)); // cascade
  await db.delete(catalogoDisciplina).where(eq(catalogoDisciplina.ano, ANO));
};
beforeEach(limpar);
afterAll(limpar);

/** Serve o índice, os cursos 94 e 34 e só a página "si" de disciplinas; o curso 11 e os outros prefixos dão 404. */
async function falso(): Promise<{ baixar: Baixar; pedidos: string[] }> {
  const arq = Object.fromEntries(await Promise.all(['index-2026', 'curriculo-94', 'sugestao-94', 'curriculo-34', 'sugestao-34', 'disciplinas-si'].map(async (n) => [n, await fx(n)])));
  const pedidos: string[] = [];
  const baixar: Baixar = async (url) => {
    pedidos.push(url);
    const m = /catalogo1999\/(index\.html|cursos\/(\d+)g\/(curriculo|sugestao)\.html|disciplinas\/([a-z]+)\.html)$/.exec(url);
    if (!m) throw new Error(`url inesperada ${url}`);
    if (m[1] === 'index.html') return arq['index-2026']!;
    if (m[2]) {
      const f = arq[`${m[3]}-${m[2]}`];
      if (!f) throw new Error(`HTTP 404 em ${url}`);
      return f;
    }
    if (m[4] === 'si') return arq['disciplinas-si']!;
    throw new Error(`HTTP 404 em ${url}`);
  };
  return { baixar, pedidos };
}

const contar = async (id: number) => ({
  ob: (await db.select().from(curriculoObrigatoria).where(eq(curriculoObrigatoria.curriculo_id, id))).length,
  el: (await db.select().from(curriculoEletiva).where(eq(curriculoEletiva.curriculo_id, id))).length,
});

test('curso 94: grava currículo, semestre sugerido, eletivas da proposta e catálogo; repetir não duplica', async () => {
  const { baixar } = await falso();
  const r = await sincronizarCatalogo(db, baixar, ANO, { cursos: [94] });
  expect(r.ok).toBe(1);
  expect(r.erros.sort()).toEqual(['disciplinas EB: HTTP 404 em ' + 'https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo1999/disciplinas/eb.html', 'disciplinas ST: HTTP 404 em https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo1999/disciplinas/st.html', 'disciplinas TT: HTTP 404 em https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo1999/disciplinas/tt.html'].sort());

  const [c] = await db.select().from(curriculo).where(and(eq(curriculo.ano, ANO), eq(curriculo.curso, 94)));
  expect(c).toMatchObject({ modalidade: null, modalidade_nome: null });
  const ob = await db.select().from(curriculoObrigatoria).where(eq(curriculoObrigatoria.curriculo_id, c!.id));
  const sem = (cod: string) => ob.find((o) => o.codigo === cod)?.semestre_sugerido;
  expect(sem('EB101')).toBe(1);
  expect(sem('SI201')).toBe(4);
  expect(sem('SI916')).toBe(7);
  expect(sem('NAOEXISTE')).toBeUndefined();
  const pe = await db.select().from(curriculoPropostaEletiva).where(eq(curriculoPropostaEletiva.curriculo_id, c!.id));
  expect(pe.map((p) => [p.semestre, p.creditos]).sort()).toEqual([[4, 4], [5, 2], [6, 10]]);
  const [g] = await db.select().from(curriculoEletiva).where(eq(curriculoEletiva.curriculo_id, c!.id));
  expect(g).toMatchObject({ creditos: 16, codigos: null, verificado: true });
  const [si300] = await db.select().from(catalogoDisciplina).where(and(eq(catalogoDisciplina.ano, ANO), eq(catalogoDisciplina.codigo, 'SI300')));
  expect(si300).toMatchObject({ nome: 'Programação Orientada a Objetos I', creditos: 4, alternativas: [[{ codigo: 'SI100', parcial: false }]] });
  expect(si300!.ementa).toBeTruthy();

  const antes = await contar(c!.id);
  const n = (await db.select().from(catalogoDisciplina).where(eq(catalogoDisciplina.ano, ANO))).length;
  await sincronizarCatalogo(db, baixar, ANO, { cursos: [94] });
  expect((await db.select().from(curriculo).where(eq(curriculo.ano, ANO))).length).toBe(1);
  const [c2] = await db.select().from(curriculo).where(eq(curriculo.ano, ANO));
  expect(await contar(c2!.id)).toEqual(antes);
  expect((await db.select().from(catalogoDisciplina).where(eq(catalogoDisciplina.ano, ANO))).length).toBe(n);
});

test('curso 34: um currículo por modalidade, cada um com a sua proposta', async () => {
  const { baixar } = await falso();
  await sincronizarCatalogo(db, baixar, ANO, { cursos: [34] });
  const cs = await db.select().from(curriculo).where(and(eq(curriculo.ano, ANO), eq(curriculo.curso, 34)));
  expect(cs.map((c) => c.modalidade).sort()).toEqual(['AA', 'AB', 'AX']);
  const aa = cs.find((c) => c.modalidade === 'AA')!;
  expect(aa.modalidade_nome).toBe('Sistemas de Computação');
  const pe = await db.select().from(curriculoPropostaEletiva).where(eq(curriculoPropostaEletiva.curriculo_id, aa.id));
  expect(pe.find((p) => p.semestre === 7)?.creditos).toBe(12);
});

test('curso que falha vai para erros e não grava nada; curso fora do índice também', async () => {
  const { baixar } = await falso();
  const r = await sincronizarCatalogo(db, baixar, ANO, { cursos: [11, 9999] });
  expect(r.ok).toBe(0);
  expect(r.erros.some((e) => e.startsWith('curso 11:'))).toBe(true);
  expect(r.erros.some((e) => e.startsWith('curso 9999:'))).toBe(true);
  expect((await db.select().from(curriculo).where(eq(curriculo.ano, ANO))).length).toBe(0);
});
