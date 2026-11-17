import { textLines } from './html';
import { ErroParse, type EntradaCatalogo } from './tipos';

// prefixo de uma letra ("F 128") vive em f_.html
export const urlCatalogo = (ano: number, prefixo: string) =>
  `https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo${ano}/disciplinas/${prefixo.toLowerCase().padEnd(2, '_')}.html`;

// "F 128" (uma letra) existe no catálogo; o código sai sem espaço, como no caderno.
const RE_TITULO = /^([A-Z]{1,2}) ?(\d{3}) - (.+)$/;
const depois = (L: string[], rotulo: string, de: number, ate: number) => {
  const i = L.indexOf(rotulo, de);
  return i >= 0 && i < ate ? (L[i + 1] ?? null) : null;
};

export function parseCatalogo(html: string): Map<string, EntradaCatalogo> {
  const L = textLines(html);
  const inicios = L.flatMap((l, i) => (RE_TITULO.test(l) && L[i + 1] === 'Coordenadoria' ? [i] : []));
  if (!inicios.length) throw new ErroParse('página do catálogo sem disciplinas (layout mudou?)');
  const out = new Map<string, EntradaCatalogo>();
  inicios.forEach((ini, k) => {
    const fim = inicios[k + 1] ?? L.length;
    const [, letras, num, nome] = RE_TITULO.exec(L[ini]!)!;
    const codigo = letras! + num!;
    const pre = depois(L, 'Pré-requisitos', ini, fim) ?? '';
    const semPre = !pre || pre.startsWith('Não há');
    const iEm = L.indexOf('Ementa', ini);
    const iBib = L.indexOf('Bibliografia', iEm);
    const ementa = iEm >= 0 && iEm < fim ? L.slice(iEm + 1, iBib >= 0 && iBib < fim ? iBib : fim).join(' ') : '';
    out.set(codigo, {
      codigo,
      nome: nome!.trim(),
      creditos: Number(depois(L, 'Total de Créditos:', ini, fim)) || null,
      ementa: ementa || null,
      prereqTexto: pre,
      alternativas: semPre
        ? []
        : pre.split(/\s+ou\s+/).map((alt) =>
            alt.split('+').map((c) => ({ codigo: c.replace(/[\s*]/g, ''), parcial: c.trim().startsWith('*') })),
          ),
    });
  });
  return out;
}
