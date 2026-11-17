import type { Baixar } from '@/dac/baixar';

const fx = (n: string) => Bun.file(`${import.meta.dir}/fixtures/caderno/${n}.html`).text();
const BASE = 'https://www.dac.unicamp.br/portal/caderno-de-horarios';

/** Caderno falso: 2026/1 e 2025/1 com só a FT oferecendo (EB101 incluída), 2027/1 vazio, 2024/1 fora do ar. */
export async function baixarFalso(): Promise<{ baixar: Baixar; pedidos: string[] }> {
  const [g1, ft, ft27, eb101] = await Promise.all([fx('g1'), fx('ft'), fx('ft27'), fx('eb101')]);
  const pedidos: string[] = [];
  const baixar: Baixar = async (url) => {
    pedidos.push(url);
    const m = url.match(/caderno-de-horarios\/(\d{4})\/(\d)\/S\/G(?:\/([A-Z]+))?(?:\/([A-Z]{2}\d{3}))?$/);
    if (!m) throw new Error(`url inesperada ${url}`);
    const [, ano, per, inst, cod] = m;
    const troca = (s: string) => s.replaceAll('/2026/1/', `/${ano}/${per}/`);
    if (ano === '2024') throw new Error(`HTTP 503 em ${url}`);
    if (!inst) return troca(g1);
    if (inst !== 'FT' || ano === '2027') return troca(ft27).replaceAll('/S/G/FT', `/S/G/${inst}`);
    if (!cod) return troca(ft);
    if (cod === 'EB101') return eb101;
    throw new Error(`404 ${url}`);
  };
  return { baixar, pedidos };
}

