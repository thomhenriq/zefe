export type Baixar = (url: string) => Promise<string>;

const BASE = 'https://www.dac.unicamp.br/portal/caderno-de-horarios';
export const urlIndice = (ano: number, periodo: number) => `${BASE}/${ano}/${periodo}/S/G`;
export const urlInstituto = (ano: number, periodo: number, sigla: string) => `${urlIndice(ano, periodo)}/${sigla}`;
export const urlDisciplina = (ano: number, periodo: number, sigla: string, codigo: string) => `${urlInstituto(ano, periodo, sigla)}/${codigo}`;

const LIMITE = 2; // a DAC responde 429 com 4 concorrentes
const TENTATIVAS = 5;

export function criarBaixar(fetchFn: typeof fetch = fetch, opts: { dormir?: (ms: number) => Promise<void> } = {}): Baixar {
  const dormir = opts.dormir ?? Bun.sleep;
  let ativos = 0;
  const fila: (() => void)[] = [];
  return async (url) => {
    if (ativos >= LIMITE) await new Promise<void>((r) => fila.push(r));
    ativos++;
    try {
      for (let i = 1; ; i++) {
        const res = await fetchFn(url, { headers: { 'User-Agent': 'zefe/0.1' } });
        if (res.status === 200) return await res.text();
        if ((res.status !== 429 && res.status < 500) || i >= TENTATIVAS) throw new Error(`HTTP ${res.status} em ${url}`);
        const ra = Number(res.headers.get('Retry-After'));
        await dormir(ra > 0 ? ra * 1000 : 1000 * 2 ** i);
      }
    } finally {
      ativos--;
      fila.shift()?.();
    }
  };
}
