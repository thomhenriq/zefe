import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { acao, bloqueio, catalogoDisciplina, conversa, db, grade, historico, horario, oferecimento, semestre, turma } from '../src/db';
import { criarGrade, getGrade } from '../src/dados/grades';
import { desfazerAcao } from '../src/zefe/desfazer';
import { criarFerramentas, resumirProgresso } from '../src/zefe/ferramentas';

const U = 'teste-t14-a';
const V = 'teste-t14-b';
const ANOS = [1995, 1996];
let conv = '';
const limpar = async () => {
  for (const u of [U, V]) {
    await db.delete(acao).where(eq(acao.user_id, u));
    await db.delete(conversa).where(eq(conversa.user_id, u));
    await db.delete(grade).where(eq(grade.user_id, u));
    await db.delete(bloqueio).where(eq(bloqueio.user_id, u));
    await db.delete(historico).where(eq(historico.user_id, u));
  }
  await db.delete(oferecimento).where(inArray(oferecimento.ano, ANOS));
  await db.delete(semestre).where(inArray(semestre.ano, ANOS));
  await db.delete(catalogoDisciplina).where(inArray(catalogoDisciplina.ano, ANOS));
};
async function oferta(ano: number, codigo: string, turmas: { t: string; h: [string, string, string][] }[]) {
  const [o] = await db.insert(oferecimento).values({ ano, periodo: 1, codigo, nome: `Disc ${codigo}`, creditos: 4, instituto: 'FT', campus: 'limeira', url: `https://dac.example/${ano}/${codigo}` }).returning();
  for (const x of turmas) {
    const [t] = await db.insert(turma).values({ oferecimento_id: o!.id, turma: x.t, reservas: [] }).returning();
    for (const [dia, inicio, fim] of x.h) await db.insert(horario).values({ turma_id: t!.id, dia, inicio, fim, sala: 'S1' });
  }
}
// Mesma forma que o SDK passa ao execute: (entrada, { toolCallId, messages }).
const opcoes = { toolCallId: 't1', messages: [] } as never;
type R = Record<string, any>;
const chamar = async (f: any, nome: string, entrada: unknown): Promise<R> => f[nome].execute(entrada, opcoes);

describe('ferramentas do Zefe', () => {
  let gradeId = '';
  let f: ReturnType<typeof criarFerramentas>;
  beforeAll(async () => {
    await limpar();
    await db.insert(semestre).values({ ano: 1995, periodo: 1, publicado: true });
    await oferta(1995, 'ZZ201', [{ t: 'A', h: [['seg', '08:00', '10:00']] }, { t: 'B', h: [['ter', '08:00', '10:00']] }]);
    await oferta(1995, 'ZZ202', [{ t: 'A', h: [['qua', '14:00', '16:00']] }]);
    await db.insert(catalogoDisciplina).values([
      { ano: 1995, codigo: 'ZZ201', nome: 'Disc ZZ201', creditos: 4, alternativas: [] },
      { ano: 1995, codigo: 'ZZ202', nome: 'Disc ZZ202', creditos: 4, prereq_texto: 'ZZ201', alternativas: [[{ codigo: 'ZZ201', parcial: false }]] },
    ]);
    const [c] = await db.insert(conversa).values({ user_id: U, titulo: 't14' }).returning();
    conv = String(c!.id);
    gradeId = await criarGrade(U, 1995, 1, 'Plano T14');
    f = criarFerramentas({ userId: U, conversaId: conv, gradeId });
  });
  afterAll(limpar);

  test('exatamente as dez ferramentas', () => {
    expect(Object.keys(f).sort()).toEqual(['alterar_grade', 'buscar_disciplinas', 'buscar_turmas', 'criar_bloqueio', 'marcar_historico', 'meu_progresso', 'oferta_disciplina', 'prerequisitos', 'remover_bloqueio', 'ver_grade']);
  });

  test('alterar_grade adiciona, grava acao e desfazerAcao volta ao estado anterior (troca de turma inclusa)', async () => {
    const r = await chamar(f, 'alterar_grade', { adicionar: [{ codigo: 'zz201', turma: 'A' }] });
    expect(r.erro).toBeUndefined();
    expect(typeof r.acaoId).toBe('number');
    expect(r.descricao).toContain('ZZ201');
    expect(r.itens.map((i: R) => [i.codigo, i.turma])).toEqual([['ZZ201', 'A']]);
    const [row] = await db.select().from(acao).where(eq(acao.id, r.acaoId));
    expect(row!.user_id).toBe(U);
    expect(row!.tipo).toBe('alterar_grade');
    expect(row!.desfeita).toBe(false);
    expect(row!.conversa_id).toBe(Number(conv));

    const troca = await chamar(f, 'alterar_grade', { adicionar: [{ codigo: 'ZZ201', turma: 'B' }, { codigo: 'ZZ202', turma: 'A' }] });
    expect((await getGrade(U, gradeId))!.itens.map((i) => [i.codigo, i.turma])).toEqual([['ZZ201', 'B'], ['ZZ202', 'A']]);
    expect(await desfazerAcao(U, troca.acaoId)).toEqual({ ok: true });
    expect((await getGrade(U, gradeId))!.itens.map((i) => [i.codigo, i.turma])).toEqual([['ZZ201', 'A']]);
    expect(await desfazerAcao(U, r.acaoId)).toEqual({ ok: true });
    expect((await getGrade(U, gradeId))!.itens).toEqual([]);
    expect((await db.select().from(acao).where(eq(acao.id, r.acaoId)))[0]!.desfeita).toBe(true);
  });

  test('remover pela alterar_grade e desfazer re-adiciona a turma anterior', async () => {
    await chamar(f, 'alterar_grade', { adicionar: [{ codigo: 'ZZ201', turma: 'B' }] });
    const r = await chamar(f, 'alterar_grade', { remover: ['zz201'] });
    expect((await getGrade(U, gradeId))!.itens).toEqual([]);
    expect((await desfazerAcao(U, r.acaoId)).ok).toBe(true);
    expect((await getGrade(U, gradeId))!.itens.map((i) => [i.codigo, i.turma])).toEqual([['ZZ201', 'B']]);
  });

  test('desfazer duas vezes e ação de outro usuário → ok:false, sem efeito', async () => {
    const r = await chamar(f, 'marcar_historico', { codigo: 'ZZ201', estado: 'cursada' });
    expect((await desfazerAcao(V, r.acaoId)).ok).toBe(false);
    expect((await db.select().from(acao).where(eq(acao.id, r.acaoId)))[0]!.desfeita).toBe(false);
    expect((await desfazerAcao(U, r.acaoId)).ok).toBe(true);
    const de = await desfazerAcao(U, r.acaoId);
    expect(de.ok).toBe(false);
    expect(de.motivo).toContain('já foi desfeita');
    expect((await desfazerAcao(U, 999999999)).ok).toBe(false);
  });

  test('marcar_historico + desfazer restaura o estado anterior (inclusive "ausente")', async () => {
    const a = await chamar(f, 'marcar_historico', { codigo: 'zz202', estado: 'cursando' });
    expect(a.estado).toBe('cursando');
    const b = await chamar(f, 'marcar_historico', { codigo: 'ZZ202', estado: 'cursada' });
    const est = async () => (await db.select().from(historico).where(eq(historico.user_id, U))).filter((h) => h.codigo === 'ZZ202').map((h) => h.estado);
    expect(await est()).toEqual(['cursada']);
    await desfazerAcao(U, b.acaoId);
    expect(await est()).toEqual(['cursando']);
    await desfazerAcao(U, a.acaoId);
    expect(await est()).toEqual([]);
    const c = await chamar(f, 'marcar_historico', { codigo: 'ZZ202', estado: 'cursada' });
    const d = await chamar(f, 'marcar_historico', { codigo: 'ZZ202', estado: 'nao_fiz' });
    expect(await est()).toEqual([]);
    await desfazerAcao(U, d.acaoId);
    expect(await est()).toEqual(['cursada']);
    await desfazerAcao(U, c.acaoId);
  });

  test('criar_bloqueio + desfazer; remover_bloqueio + desfazer recria com os mesmos campos', async () => {
    const r = await chamar(f, 'criar_bloqueio', { nome: 'Estágio', dia: 'seg', inicio: '13:00', fim: '18:00' });
    expect(r.bloqueio).toMatchObject({ nome: 'Estágio', dia: 'seg' });
    expect(await db.select().from(bloqueio).where(eq(bloqueio.user_id, U))).toHaveLength(1);
    const rem = await chamar(f, 'remover_bloqueio', { id: r.bloqueio.id });
    expect(await db.select().from(bloqueio).where(eq(bloqueio.user_id, U))).toHaveLength(0);
    expect((await desfazerAcao(U, rem.acaoId)).ok).toBe(true);
    const [b] = await db.select().from(bloqueio).where(eq(bloqueio.user_id, U));
    expect([b!.nome, b!.dia, b!.inicio, b!.fim]).toEqual(['Estágio', 'seg', '13:00', '18:00']);
    expect((await desfazerAcao(U, r.acaoId)).ok).toBe(false); // o original já foi apagado (id antigo): motivo, sem exceção
    await db.delete(bloqueio).where(eq(bloqueio.user_id, U));
    const r2 = await chamar(f, 'criar_bloqueio', { nome: 'X', dia: 'ter', inicio: '08:00', fim: '09:00' });
    expect((await desfazerAcao(U, r2.acaoId)).ok).toBe(true);
    expect(await db.select().from(bloqueio).where(eq(bloqueio.user_id, U))).toHaveLength(0);
    expect((await chamar(f, 'remover_bloqueio', { id: '999999999' })).erro).toContain('bloqueio não encontrado');
  });

  test('código inexistente e entrada ruim devolvem { erro }, sem lançar', async () => {
    const antes = (await getGrade(U, gradeId))!.itens.map((i) => [i.codigo, i.turma]);
    for (const [nome, entrada] of [
      ['oferta_disciplina', { codigo: 'QQ999' }], ['prerequisitos', { codigo: 'QQ999' }], ['marcar_historico', { codigo: 'QQ999', estado: 'cursada' }],
      ['alterar_grade', { adicionar: [{ codigo: 'QQ999', turma: 'A' }] }], ['alterar_grade', {}], ['criar_bloqueio', { nome: 'x', dia: 'seg', inicio: '12:00', fim: '08:00' }],
      ['meu_progresso', {}],
    ] as const) {
      const r = await chamar(f, nome, entrada);
      expect(typeof r.erro).toBe('string');
      expect(r.acaoId).toBeUndefined();
    }
    expect((await getGrade(U, gradeId))!.itens.map((i) => [i.codigo, i.turma])).toEqual(antes);
  });

  test('buscar_turmas: janela vazia → resultado vazio, não erro; janela que cabe → turmas com fonte', async () => {
    const vazio = await chamar(f, 'buscar_turmas', { janelas: [] });
    expect(vazio.erro).toBeUndefined();
    expect(vazio.turmas).toEqual([]);
    const r = await chamar(f, 'buscar_turmas', { janelas: [{ dia: 'seg', inicio: '07:00', fim: '12:00' }] });
    expect(r.tipo).toBe('oficial');
    expect(r.turmas.map((t: R) => `${t.codigo}${t.turma}`)).toEqual(['ZZ201A']);
    expect(r.turmas[0].fonte).toEqual({ url: 'https://dac.example/1995/ZZ201', semestre: '1S/1995' });
  });

  test('oferta_disciplina, prerequisitos (com histórico) e ver_grade', async () => {
    const o = await chamar(f, 'oferta_disciplina', { codigo: ' zz 201 ' });
    expect(o).toMatchObject({ tipo: 'oficial', codigo: 'ZZ201', fonte: { semestre: '1S/1995' } });
    expect(o.turmas).toHaveLength(2);
    let p = await chamar(f, 'prerequisitos', { codigo: 'ZZ202' });
    expect(p.satisfeito).toBe(false);
    expect(p.alternativas).toEqual([[{ codigo: 'ZZ201', parcial: false, estado: 'nao_fiz' }]]);
    await db.insert(historico).values({ user_id: U, codigo: 'ZZ201', estado: 'cursada', origem: 'aluno' });
    p = await chamar(f, 'prerequisitos', { codigo: 'ZZ202' });
    expect(p.satisfeito).toBe(true);
    expect(p.alternativas[0][0].estado).toBe('cursada');
    const g = await chamar(f, 'ver_grade', {});
    expect(g.grade).toMatchObject({ id: gradeId, semestre: '1S/1995' });
    expect(g.checagem.ok).toBe(true);
  });

  test('ver_grade sem grade → { erro }; alterar_grade sem gradeId cria "Minha grade" e o desfazer só tira os itens', async () => {
    const sem = criarFerramentas({ userId: V, conversaId: conv, gradeId: null });
    const prox = (await chamar(sem, 'ver_grade', {})).erro;
    expect(prox).toContain('você ainda não tem grade para');
    // o semestre padrão (próximo) não tem oferta sentinela: a criação da grade acontece mas a turma não existe → erro e nada criado de item
    expect((await chamar(sem, 'alterar_grade', { adicionar: [{ codigo: 'ZZ201', turma: 'A' }] })).erro).toBeString();
  });

  test('resumirProgresso: créditos, faltantes, travadas e grupos "não verificado"', () => {
    const r = resumirProgresso({
      disciplinas: [
        { codigo: 'A1', nome: 'a', creditos: 4, semestreSugerido: 1, estado: 'cursada', faltamPrereq: [], prereqDesconhecido: false },
        { codigo: 'B1', nome: 'b', creditos: 4, semestreSugerido: 2, estado: 'faltando', faltamPrereq: [], prereqDesconhecido: false },
        { codigo: 'C1', nome: 'c', creditos: 2, semestreSugerido: 3, estado: 'travada', faltamPrereq: ['B1'], prereqDesconhecido: false },
      ],
      grupos: [{ texto: 'Eletivas X', creditos: 8, feitos: 0, emAndamento: 0, excedente: 0, verificado: false, codigosContados: [] }, { texto: 'Eletivas Y', creditos: 4, feitos: 4, emAndamento: 0, excedente: 0, verificado: true, codigosContados: ['Z1'] }],
      foraDoCurriculo: [], naoClassificadas: ['Q1'],
      creditos: { obrigatorias: { feitos: 4, total: 10, emAndamento: 0 }, eletivas: { feitos: 4, total: 12, naoVerificado: 8, emAndamento: 0 } },
    });
    expect(r.faltantes.map((d: R) => d.codigo)).toEqual(['B1']);
    expect(r.travadas).toEqual([{ codigo: 'C1', nome: 'c', creditos: 2, faltamPrereq: ['B1'] }]);
    expect(r.grupos[0]!.situacao).toBe('não verificado');
    expect(r.grupos[1]!.situacao).toBeUndefined();
    expect(r.creditos.obrigatorias.total).toBe(10);
  });
});
