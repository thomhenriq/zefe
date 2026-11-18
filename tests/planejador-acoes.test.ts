import { describe, expect, mock, test } from 'bun:test';

let logado = true;
mock.module('../src/sessao', () => ({
  exigirUsuario: async () => { if (!logado) throw new Error('NEXT_REDIRECT /entrar'); return { id: 'teste-t18', email: 'x@zefe.local', perfil: {} }; },
}));
const { buscarAcao, ofertaAcao } = await import('../src/app/(app)/planejador/acoes');

describe('consultas do planejador', () => {
  test('sem sessão, nenhuma consulta roda', async () => {
    logado = false;
    await expect(buscarAcao({ q: 'cálculo' })).rejects.toThrow('/entrar');
    await expect(ofertaAcao({ codigo: 'SI702', ano: 2026, periodo: 1 })).rejects.toThrow('/entrar');
    logado = true;
  });

  test('zod rejeita busca vazia/enorme e semestre fora da faixa, em pt-BR', async () => {
    expect(await buscarAcao({ q: '   ' })).toEqual({ erro: 'digite um código ou nome' });
    expect('erro' in (await buscarAcao({ q: 'a'.repeat(200) }))).toBe(true);
    expect('erro' in (await buscarAcao(null))).toBe(true);
    expect(await ofertaAcao({ codigo: '', ano: 2026, periodo: 1 })).toEqual({ erro: 'disciplina ou semestre inválido' });
    expect('erro' in (await ofertaAcao({ codigo: 'SI702', ano: 1900, periodo: 1 }))).toBe(true);
    expect('erro' in (await ofertaAcao({ codigo: 'SI702', ano: 2026, periodo: 3 }))).toBe(true);
  });

  test('busca devolve disciplinas; oferta sem a turma devolve motivo e nunca vagas', async () => {
    const b = await buscarAcao({ q: 'SI70' });
    expect('disciplinas' in b && b.disciplinas.length > 0).toBe(true);
    const o = await ofertaAcao({ codigo: 'ZZ999', ano: 2026, periodo: 1 });
    expect('oferta' in o && o.oferta === null && typeof o.motivo === 'string').toBe(true);
    const ok = await ofertaAcao({ codigo: 'SI702', ano: 2026, periodo: 1 });
    expect(JSON.stringify(ok)).not.toMatch(/vagas|matriculados/);
  });
});
