import { afterAll, beforeAll, expect, test } from 'bun:test';
import { and, eq, inArray, like } from 'drizzle-orm';
import { catalogoDisciplina, db, horario, oferecimento, professor, semestre, turma, turmaProfessor } from '@/db';
import { preverOferta, proximoSemestre } from '@/dominio/oferta';
import { buscarTurmas, getDisciplina, getOferta } from '@/dados/disciplinas';
import { getProfessor } from '@/dados/professores';
import { getSala } from '@/dados/salas';

const h = (ano: number) => ({ ano, turmas: [], url: `u${ano}` });

test('proximoSemestre', () => {
  expect(proximoSemestre(new Date(2026, 10, 17))).toEqual({ ano: 2027, periodo: 1 });
  expect(proximoSemestre(new Date(2026, 2, 1))).toEqual({ ano: 2026, periodo: 2 });
  expect(proximoSemestre(new Date(2027, 0, 10))).toEqual({ ano: 2027, periodo: 1 });
});

test('preverOferta: provável, incerto, sem histórico', () => {
  expect(preverOferta([h(2026), h(2025)], 2027).confianca).toBe('provavel');
  expect(preverOferta([h(2026)], 2027).confianca).toBe('incerto');
  expect(preverOferta([h(2025), h(2024)], 2027).confianca).toBe('incerto'); // faltou o ano imediatamente anterior
  expect(preverOferta([h(2020)], 2027)).toMatchObject({ confianca: 'sem_historico', evidencias: [] });
  expect(preverOferta([h(2024), h(2026), h(2025)], 2027).evidencias.map((e) => e.ano)).toEqual([2026, 2025, 2024]);
});

// ---- banco: só anos 1990-1999, códigos ZQ… e slugs zq-… (um job real grava no mesmo banco) ----
const limpar = async () => {
  await db.delete(oferecimento).where(and(inArray(oferecimento.ano, [1993, 1994, 1995, 1996]), like(oferecimento.codigo, 'ZQ%')));
  await db.delete(semestre).where(inArray(semestre.ano, [1993, 1994, 1995, 1996]));
  await db.delete(professor).where(like(professor.slug, 'zq-%'));
  await db.delete(catalogoDisciplina).where(and(like(catalogoDisciplina.codigo, 'ZQ%'), inArray(catalogoDisciplina.ano, [1990, 1991])));
};
beforeAll(async () => {
  await limpar();
  await db.insert(catalogoDisciplina).values([
    { ano: 1990, codigo: 'ZQ901', nome: 'Antigo Sentinela', creditos: 4, ementa: 'e', prereq_texto: '', alternativas: [] },
    { ano: 1991, codigo: 'ZQ901', nome: 'Cálculo Sentinela', creditos: 6, ementa: 'e91', prereq_texto: '', alternativas: [] },
    { ano: 1991, codigo: 'ZQ903', nome: 'Depende Sentinela', creditos: 4, ementa: null, prereq_texto: 'ZQ901', alternativas: [[{ codigo: 'ZQ901', parcial: false }]] },
    { ano: 1991, codigo: 'ZQ906', nome: 'Com Ambos', creditos: 2, ementa: null, prereq_texto: '', alternativas: [] },
    { ano: 1990, codigo: 'ZQ904', nome: 'Só 1990', creditos: 4, ementa: null, prereq_texto: 'ZQ901', alternativas: [[{ codigo: 'ZQ901', parcial: false }]] },
  ]);
  await db.insert(semestre).values([
    { ano: 1993, periodo: 1, publicado: true, coletado_em: new Date() },
    { ano: 1994, periodo: 1, publicado: true, coletado_em: new Date() },
    { ano: 1995, periodo: 1, publicado: true, coletado_em: new Date('2026-01-02T00:00:00Z') },
    { ano: 1996, periodo: 1, publicado: false, coletado_em: new Date() },
  ]);
  const [p] = await db.insert(professor).values({ nome: 'José da Conceição ZQ', slug: 'zq-jose-da-conceicao' }).returning();
  for (const ano of [1993, 1994, 1995]) {
    const [o] = await db.insert(oferecimento).values({ ano, periodo: 1, codigo: 'ZQ902', nome: 'Álgebra Ímpar', creditos: 4, instituto: 'FT', campus: 'limeira', url: `http://x/${ano}` }).returning();
    const [t] = await db.insert(turma).values({ oferecimento_id: o!.id, turma: 'A', vagas: 10, matriculados: 1 }).returning();
    await db.insert(horario).values({ turma_id: t!.id, dia: 'seg', inicio: '19:00', fim: '21:00', sala: 'ZQSALA1' });
    await db.insert(turmaProfessor).values({ turma_id: t!.id, professor_id: p!.id });
  }
  for (const [ano, url] of [[1995, 'http://x/6'], [1994, 'http://x/6b']] as const) {
    const [o6] = await db.insert(oferecimento).values({ ano, periodo: 1, codigo: 'ZQ906', nome: 'Com Ambos', url }).returning();
    await db.insert(turma).values({ oferecimento_id: o6!.id, turma: 'A' });
  }
  const [o2] = await db.insert(oferecimento).values({ ano: 1995, periodo: 1, codigo: 'ZQ905', nome: 'Incompleta', instituto: 'FT', campus: 'limeira' }).returning();
  await db.insert(turma).values({ oferecimento_id: o2!.id, turma: 'A', horario_incompleto: true });
});
afterAll(limpar);

test('getDisciplina: normaliza, usa catálogo mais recente, destrava, oferecimentos', async () => {
  expect(await getDisciplina('ZZ999')).toBeNull();
  const d = (await getDisciplina(' zq 901 '))!;
  expect(d).toMatchObject({ codigo: 'ZQ901', nome: 'Cálculo Sentinela', creditos: 6, ementa: 'e91' });
  expect(d.destrava).toEqual(['ZQ903']); // ZQ904 é do catálogo 1990, não do 1991
  expect((await getDisciplina('ZQ901', 1990))!.destrava).toEqual(['ZQ904']);
  expect(await getDisciplina('ZQ901', 1985)).toBeNull();
  const o = (await getDisciplina('zq903'))!;
  expect(o.alternativas).toEqual([[{ codigo: 'ZQ901', parcial: false }]]);
  expect(d.catalogo).toBe(1991);
  // com catálogo e oferecimentos: mais novo primeiro, com url e turmas
  expect(d.oferecimentos).toEqual([]);
  // só caderno (sem catálogo): usa o oferecimento mais recente e avisa que não há catálogo
  const so = (await getDisciplina('zq902'))!;
  expect(so).toMatchObject({ codigo: 'ZQ902', nome: 'Álgebra Ímpar', creditos: 4, ementa: null, prereqTexto: null, alternativas: [], destrava: [], catalogo: null });
  expect(so.oferecimentos.map((o) => [o.ano, o.periodo, o.url])).toEqual([[1995, 1, 'http://x/1995'], [1994, 1, 'http://x/1994'], [1993, 1, 'http://x/1993']]);
  expect(so.oferecimentos[0]!.turmas[0]).toMatchObject({ turma: 'A', docentes: ['José da Conceição ZQ'] });
  // catálogo + caderno
  const ambos = (await getDisciplina('zq906'))!;
  expect(ambos.catalogo).toBe(1991);
  expect(ambos.oferecimentos.map((o) => [o.ano, o.periodo, o.url])).toEqual([[1995, 1, 'http://x/6'], [1994, 1, 'http://x/6b']]);
  expect(ambos.oferecimentos[0]!.turmas.map((x) => x.turma)).toEqual(['A']);
});

test('getOferta: oficial, não aparece, previsão com evidências', async () => {
  const of = await getOferta('zq902', 1995, 1);
  if (!of.encontrada || of.tipo !== 'oficial') throw new Error('esperava oficial');
  expect(of.disciplina.turmas[0]).toMatchObject({ turma: 'A', docentes: ['José da Conceição ZQ'], horarios: [{ dia: 'seg', inicio: '19:00', fim: '21:00', sala: 'ZQSALA1' }] });
  expect(of.disciplina.fonte).toMatchObject({ url: 'http://x/1995', ano: 1995, periodo: 1 });
  expect(of.indiceVerificadoEm).toBe('2026-01-02T00:00:00.000Z');

  const ausente = await getOferta('ZQ999', 1995, 1);
  expect(ausente).toMatchObject({ encontrada: false, tipo: 'oficial' });
  if (!ausente.encontrada) expect(ausente.motivo).toContain('não aparece');

  const p = await getOferta('ZQ902', 1996, 1); // semestre não publicado
  expect(p).toMatchObject({ encontrada: true, tipo: 'previsao', confianca: 'provavel' });
  if (!p.encontrada || p.tipo !== 'previsao') throw new Error();
  expect(p.evidencias.map((e) => e.ano)).toEqual([1995, 1994, 1993]);
  expect(p.base.codigo).toBe('ZQ902');

  const nunca = await getOferta('ZQ999', 1996, 1);
  expect(nunca).toMatchObject({ encontrada: false, tipo: 'previsao' });
  if (!nunca.encontrada) expect(nunca.motivo).toContain('não aparece');
  // semestre nunca coletado também é previsão, não erro
  expect((await getOferta('ZQ902', 1997, 1)).tipo).toBe('previsao');
});

test('buscarTurmas: janela, horário incompleto e previsão', async () => {
  const ok = await buscarTurmas(1995, 1, [{ dia: 'seg', inicio: '18:00', fim: '22:00' }]);
  expect(ok.tipo).toBe('oficial');
  const meus = ok.resultados.filter((r) => r.codigo.startsWith('ZQ'));
  expect(meus.map((r) => r.codigo)).toEqual(['ZQ902']); // ZQ905 tem horário incompleto
  expect((await buscarTurmas(1995, 1, [{ dia: 'seg', inicio: '18:00', fim: '22:00', campus: 'barao' }])).resultados.filter((r) => r.codigo.startsWith('ZQ'))).toEqual([]);
  expect((await buscarTurmas(1995, 1, [{ dia: 'ter', inicio: '18:00', fim: '22:00' }])).resultados.filter((r) => r.codigo.startsWith('ZQ'))).toEqual([]);
  const prev = await buscarTurmas(1996, 1, [{ dia: 'seg', inicio: '18:00', fim: '22:00' }]);
  expect(prev.tipo).toBe('previsao');
  expect(prev.aviso).toContain('previsão');
  expect(prev.resultados.some((r) => r.codigo === 'ZQ902' && r.fonte.ano === 1995)).toBe(true);
});

test('getProfessor e getSala', async () => {
  expect(await getProfessor('nao-existe-zq')).toBeNull();
  const p = (await getProfessor('zq-jose-da-conceicao'))!;
  expect(p.semestres.map((s) => s.ano)).toEqual([1995, 1994, 1993]);
  expect(p.semestres[0]!.turmas[0]).toMatchObject({ codigo: 'ZQ902', nome: 'Álgebra Ímpar', turma: 'A' });
  expect(p.semestres[0]!.turmas[0]!.horarios[0]!.sala).toBe('ZQSALA1');

  expect(await getSala('zqsala9', 1995, 1)).toBeNull();
  expect(await getSala('zqsala1', 1996, 1)).toBeNull();
  expect(await getSala(' zqsala1 ', 1995, 1)).toEqual({ sala: 'ZQSALA1', ocupacao: [{ dia: 'seg', inicio: '19:00', fim: '21:00', codigo: 'ZQ902', turma: 'A' }] });
});
