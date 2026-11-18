// Avaliação do assistente contra o Bedrock de verdade (usuário próprio de avaliação, dados reais). Uso: bun run zefe:avaliar [--so <id>] [--grupo ajuste|validacao] [--rodada <rótulo>] [--saida <arquivo.json>]
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { writeFileSync } from 'node:fs';
import type { UIMessage } from 'ai';
import { bloqueio, conversa, db, grade, gradeItem, historico, perfil, user } from '@/db';
import { criarConversa, responderCompleto } from './responder';
import { orfaos } from './aterramento';
import { VERSAO_PROMPT } from './prompt';
import { CENARIOS, MUTANTES, type Cenario, type Estado } from './cenarios';

const USER = 'avaliacao-zefe'; // usuário só da avaliação: não mexe no demo (demo@zefe.local) nem em dados de outras pessoas
const SEMENTE = {
  perfil: { curso: 94, catalogo: 2026, modalidade: null, ingresso: 2025, semestre_atual: 3 },
  cursada: 'EB102 SI203 SI220 EB101 SI100 SI101 SI102 SI120 ST008 TT106 TT350 SI250 SI305 ST266 ST468'.split(' '),
  cursando: 'SI300 SI304 SI350 SI404 ST211 ST567 ST568 TT304'.split(' '),
  grade: [['SI405', 'A'], ['SI700', 'A'], ['SI701', 'A']] as const,
  bloqueio: { nome: 'Estágio', dia: 'ter', inicio: '13:30', fim: '17:30' },
};
// Cria o usuário de avaliação do zero se não existir (estado inicial fixo, copiado do demo na época das medições).
async function garantirUsuario() {
  if ((await db.select().from(user).where(eq(user.id, USER))).length) return;
  await db.insert(user).values({ id: USER, name: 'Avaliação Zefe', email: 'avaliacao@zefe.local', emailVerified: true });
  await db.insert(perfil).values({ user_id: USER, ...SEMENTE.perfil });
  await db.insert(historico).values([...SEMENTE.cursada.map((codigo) => ({ codigo, estado: 'cursada' })), ...SEMENTE.cursando.map((codigo) => ({ codigo, estado: 'cursando' }))].map((h) => ({ user_id: USER, origem: 'aluno', ...h })));
  const [g] = await db.insert(grade).values({ user_id: USER, ano: 2027, periodo: 1, nome: 'Minha grade', principal: true }).returning();
  await db.insert(gradeItem).values(SEMENTE.grade.map(([codigo, turma]) => ({ grade_id: g!.id, codigo, turma })));
  await db.insert(bloqueio).values({ user_id: USER, ...SEMENTE.bloqueio });
}
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };

// ---- estado do banco ----
async function lerEstado(): Promise<Estado> {
  const gs = await db.select().from(grade).where(eq(grade.user_id, USER));
  const itens = gs.length ? await db.select().from(gradeItem).where(inArray(gradeItem.grade_id, gs.map((g) => g.id))) : [];
  const principal = gs.find((g) => g.principal && g.ano === 2027 && g.periodo === 1) ?? gs[0];
  return {
    grade: new Map(itens.filter((i) => i.grade_id === principal?.id).map((i) => [i.codigo, i.turma])),
    bloqueios: await db.select().from(bloqueio).where(eq(bloqueio.user_id, USER)),
    historico: new Map((await db.select().from(historico).where(eq(historico.user_id, USER))).map((h) => [h.codigo, h.estado])),
  };
}
async function fotografar() {
  const grades = await db.select().from(grade).where(eq(grade.user_id, USER));
  const itens = grades.length ? await db.select().from(gradeItem).where(inArray(gradeItem.grade_id, grades.map((g) => g.id))) : [];
  return { grades, itens, bloqueios: await db.select().from(bloqueio).where(eq(bloqueio.user_id, USER)), historico: await db.select().from(historico).where(eq(historico.user_id, USER)) };
}
type Foto = Awaited<ReturnType<typeof fotografar>>;
async function restaurar(f: Foto) {
  const ids = f.grades.map((g) => g.id);
  await db.delete(grade).where(and(eq(grade.user_id, USER), ids.length ? notInArray(grade.id, ids) : undefined));
  if (ids.length) await db.delete(gradeItem).where(inArray(gradeItem.grade_id, ids));
  if (f.itens.length) await db.insert(gradeItem).values(f.itens);
  await db.delete(bloqueio).where(eq(bloqueio.user_id, USER));
  if (f.bloqueios.length) await db.insert(bloqueio).values(f.bloqueios);
  await db.delete(historico).where(eq(historico.user_id, USER));
  if (f.historico.length) await db.insert(historico).values(f.historico);
}
async function semear(c: Cenario, f: Foto) {
  const g = f.grades.find((x) => x.principal && x.ano === 2027 && x.periodo === 1) ?? f.grades[0];
  for (const [codigo, turma] of c.semente?.grade ?? []) await db.insert(gradeItem).values({ grade_id: g!.id, codigo, turma }).onConflictDoUpdate({ target: [gradeItem.grade_id, gradeItem.codigo], set: { turma } });
  for (const b of c.semente?.bloqueios ?? []) await db.insert(bloqueio).values({ user_id: USER, ...b });
}

// ---- critérios ----
const VAZIO = /n[ãa]o encontrei|n[ãa]o achei|n[ãa]o consegui encontrar|n[ãa]o existe|n[ãa]o h[áa] (nenhuma|turma|aula|disciplina)|nenhuma (turma|aula|disciplina)|n[ãa]o tem (nenhuma|turma|aula)/i;

interface Parte { type: string; state?: string; output?: unknown; errorText?: string; text?: string; input?: unknown }
const partesDe = (m: UIMessage | null) => (m?.parts ?? []) as Parte[];
const ferramentasDe = (ps: Parte[]) => ps.filter((p) => p.type.startsWith('tool-')).map((p) => p.type.slice(5));


const textoDe = (m: UIMessage | null) => partesDe(m).filter((p) => p.type === 'text').map((p) => p.text ?? '').join('\n').trim();

interface Resultado {
  id: string; grupo: string; tokens: { entrada: number; saida: number }; a: boolean | null; b: boolean; c: boolean | null; d: boolean | null; e: boolean | null; f: boolean | null;
  orfaos: string[]; fonte: string; textos: string[]; ferramentas: string[]; passos: number; ms: number; texto: string; erro: string | null;
}

async function rodar(c: Cenario, foto: Foto): Promise<Resultado> {
  await restaurar(foto); await semear(c, foto);
  const antes = await lerEstado();
  const conv = await criarConversa(USER, c.id);
  const msgs: UIMessage[] = [];
  const todas: Parte[] = [];
  const textos: string[] = [];
  let ultimas: string[] = [];
  const tokens = { entrada: 0, saida: 0 };
  const onUso = (u: { inputTokens?: number | undefined; outputTokens?: number | undefined }) => { tokens.entrada += u.inputTokens ?? 0; tokens.saida += u.outputTokens ?? 0; };
  let erro: string | null = null;
  const t0 = performance.now();
  for (const [i, q] of c.turnos.entries()) {
    msgs.push({ id: `u${i}`, role: 'user', parts: [{ type: 'text', text: q }] });
    let r = await responderCompleto({ userId: USER, conversaId: conv.id, mensagens: msgs, tela: { rota: '/planejador' }, salvar: false, onUso });
    for (let k = 0; k < 2 && r.erro; k++) { await new Promise((ok) => setTimeout(ok, 3000 * (k + 1))); r = await responderCompleto({ userId: USER, conversaId: conv.id, mensagens: msgs, tela: { rota: '/planejador' }, salvar: false, onUso }); }
    erro = r.erro;
    if (!r.mensagem) break;
    msgs.push({ ...r.mensagem, id: `a${i}` });
    todas.push(...partesDe(r.mensagem)); ultimas = ferramentasDe(partesDe(r.mensagem)); textos.push(textoDe(r.mensagem));
  }
  const ms = Math.round(performance.now() - t0);
  const depois = await lerEstado();
  await db.delete(conversa).where(eq(conversa.id, conv.id)); // apaga ações e mensagens ligadas
  await restaurar(foto);

  const usadas = new Set(ferramentasDe(todas));
  const ult = textos[textos.length - 1] ?? '';
  const fonte = [JSON.stringify(todas.filter((p) => p.type.startsWith('tool-')).map((p) => p.output ?? p.errorText ?? null)), ...c.turnos];
  const sem = orfaos(textos, fonte);
  const aplicavelC = c.vazio;
  return {
    id: c.id, grupo: c.grupo, tokens,
    a: c.esperadas ? c.esperadas.every((g) => g.some((t) => usadas.has(t))) && (!c.esperadasUltimo || c.esperadasUltimo.some((t) => ultimas.includes(t))) : null,
    b: !erro && textos.length === c.turnos.length && sem.length === 0,
    c: aplicavelC ? VAZIO.test(ult) && orfaos([ult], [c.turnos.join(' ')]).every((x) => !/^\d\d:\d\d$/.test(x)) : null,
    d: c.banco ? c.banco(antes, depois) : null,
    e: c.fora ? !ferramentasDe(todas).some((t) => MUTANTES.includes(t)) && !(c.proibido?.test(textos.join('\n'))) : null,
    f: c.previsao ? /previs[ãa]o/i.test(ult) : null,
    orfaos: sem, fonte: fonte.join('\n'), textos, ferramentas: ferramentasDe(todas), passos: todas.filter((p) => p.type === 'step-start').length, ms, texto: ult.slice(0, 600), erro,
  };
}

// ---- main ----
const so = arg('so');
const grupoArg = arg('grupo');
const lista = so ? CENARIOS.filter((c) => c.id === so) : grupoArg ? CENARIOS.filter((c) => c.grupo === grupoArg) : CENARIOS;
if (!lista.length) { console.error(`cenário ${so} não existe`); process.exit(2); }
await garantirUsuario();
const foto = await fotografar();
const resultados: Resultado[] = [];
try {
  for (const c of lista) {
    const r = await rodar(c, foto);
    resultados.push(r);
    console.log(`${r.id}: ${JSON.stringify({ a: r.a, b: r.b, c: r.c, d: r.d, e: r.e, f: r.f })} ${r.ferramentas.join(',')} ${r.ms}ms${r.orfaos.length ? ` ÓRFÃOS ${r.orfaos}` : ''}${r.erro ? ` ERRO ${r.erro}` : ''}\n   ${r.texto.replace(/\n/g, ' ')}`);
  }
} finally { await restaurar(foto); }

const mk = (v: boolean | null) => (v === null ? '-' : v ? 'ok' : 'FALHA');
console.log(`\nprompt ${VERSAO_PROMPT}, modelo ${process.env.ZEFE_MODELO || 'us.amazon.nova-2-lite-v1:0'}\n`);
console.log('cenário'.padEnd(24), 'a'.padEnd(6), 'b'.padEnd(6), 'c'.padEnd(6), 'd'.padEnd(6), 'e'.padEnd(6), 'f*'.padEnd(6), 'passos', 'ms'.padEnd(7), 'ferramentas');
for (const r of resultados) console.log(`${r.grupo[0]} ${r.id}`.padEnd(24), ...[r.a, r.b, r.c, r.d, r.e, r.f].map((v) => mk(v).padEnd(6)), String(r.passos).padEnd(6), String(r.ms).padEnd(7), r.ferramentas.join(','));
const taxa = (rs: Resultado[], k: 'a' | 'b' | 'c' | 'd' | 'e' | 'f') => { const x = rs.filter((r) => r[k] !== null); return { ok: x.filter((r) => r[k]).length, n: x.length }; };
let falhou = false;
const resumo: Record<string, Record<string, { ok: number; n: number }>> = {};
for (const grupo of ['ajuste', 'validacao']) {
  const rs = resultados.filter((r) => r.grupo === grupo);
  if (!rs.length) continue;
  resumo[grupo] = {};
  console.log(`\n== ${grupo} (${rs.length} cenários) ==`);
  for (const k of ['a', 'b', 'c', 'd', 'e', 'f'] as const) {
    const t = taxa(rs, k); resumo[grupo]![k] = t;
    const p = t.n ? t.ok / t.n : 1;
    console.log(`(${k}) ${t.ok}/${t.n} = ${(p * 100).toFixed(0)}%${k === 'f' ? ' (informativo)' : ''}`);
    if (k !== 'f' && p < (k === 'b' ? 1 : 0.9)) falhou = true;
  }
}
const tot = resultados.reduce((s, r) => ({ entrada: s.entrada + r.tokens.entrada, saida: s.saida + r.tokens.saida, passos: s.passos + r.passos }), { entrada: 0, saida: 0, passos: 0 });
console.log(`\ncusto: ${tot.entrada} tokens de entrada, ${tot.saida} de saída, ${tot.passos} passos`);
const saida = arg('saida');
if (saida) writeFileSync(saida, JSON.stringify({ prompt: VERSAO_PROMPT, modelo: process.env.ZEFE_MODELO || 'us.amazon.nova-2-lite-v1:0', data: new Date().toISOString(), resumo, custo: tot, resultados }, null, 1));
process.exit(falhou ? 1 : 0);
