import { expect, test } from 'bun:test';
import { criarBaixar } from '@/dac/baixar';

const resp = (status: number, body = '', headers: Record<string, string> = {}) => new Response(body, { status, headers });

test('429 é repetido com espera e depois devolve o corpo', async () => {
  const seq = [resp(429, '', { 'Retry-After': '2' }), resp(200, 'ok')];
  const esperas: number[] = [];
  const baixar = criarBaixar((async () => seq.shift()!) as unknown as typeof fetch, { dormir: async (ms) => void esperas.push(ms) });
  expect(await baixar('https://x/a')).toBe('ok');
  expect(esperas).toEqual([2000]);
});

test('429 persistente vira erro com a URL depois das tentativas', async () => {
  const baixar = criarBaixar((async () => resp(429)) as unknown as typeof fetch, { dormir: async () => {} });
  expect(baixar('https://x/b')).rejects.toThrow('HTTP 429 em https://x/b');
});

test('404 falha na hora, sem repetir', async () => {
  let n = 0;
  const baixar = criarBaixar((async () => (n++, resp(404))) as unknown as typeof fetch, { dormir: async () => {} });
  expect(baixar('https://x/c')).rejects.toThrow('HTTP 404');
  await Bun.sleep(0);
  expect(n).toBe(1);
});

test('nunca passa de 2 requisições simultâneas', async () => {
  let ativos = 0, max = 0;
  const f = (async () => {
    max = Math.max(max, ++ativos);
    await Bun.sleep(5);
    ativos--;
    return resp(200, 'ok');
  }) as unknown as typeof fetch;
  const baixar = criarBaixar(f, { dormir: async () => {} });
  await Promise.all(Array.from({ length: 12 }, (_, i) => baixar(`https://x/${i}`)));
  expect(max).toBeLessThanOrEqual(2);
});
