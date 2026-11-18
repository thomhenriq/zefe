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

// Catálogo 2020: todas as disciplinas de uma coordenadoria numa página só (coordenadorias/NNNN/NNNN.html).
export const urlCoordenadoria2020 = (id: string) =>
  `https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo2020/coordenadorias/${id}/${id}.html`;
export const urlIndiceCoordenadorias2020 = 'https://www.dac.unicamp.br/sistemas/catalogos/grad/catalogo2020/coordenadorias.html';

export const idsCoordenadorias2020 = (html: string): string[] => {
  const ids = [...new Set([...html.matchAll(/coordenadorias\/(\d+)\.html/g)].map((m) => m[1]!))];
  if (!ids.length) throw new ErroParse('índice de coordenadorias 2020 sem links (layout mudou?)');
  return ids;
};

// Legenda da DAC: "/" = ou, espaço = e, "*" na frente = parcial. O espaço liga mais forte: "A B/ C" = (A e B) ou C
// (os dados trazem o produto já expandido, ex. QF331 "MA111 QG101/ MS380 QG101/ ..."), igual à forma ou-de-es de 2021+.
export const alternativas2020 = (pre: string): EntradaCatalogo['alternativas'] =>
  pre.split('/').map((alt) =>
    alt.trim().split(/\s+/).map((c) => ({ codigo: c.replace('*', ''), parcial: c.startsWith('*') })),
  );

export function parseCatalogo2020(html: string): Map<string, EntradaCatalogo> {
  const L = textLines(html);
  const inicios = L.flatMap((l, i) => (RE_TITULO.test(l) && L[i + 1]?.startsWith('OF:') ? [i] : []));
  const out = new Map<string, EntradaCatalogo>();
  // coordenadorias sem disciplinas existem (0012, 0074...): página só com <h1>, sem âncoras; âncora sem título lido = layout mudou
  if (!inicios.length) {
    if (/<a name=/i.test(html)) throw new ErroParse('página de coordenadoria 2020 com âncoras mas sem disciplinas lidas (layout mudou?)');
    return out;
  }
  inicios.forEach((ini, k) => {
    const fim = inicios[k + 1] ?? L.length;
    const [, letras, num, nome] = RE_TITULO.exec(L[ini]!)!;
    const codigo = letras! + num!;
    const bloco = L.slice(ini + 1, fim);
    const iPre = bloco.findIndex((l) => l.startsWith('Pré-Req.:'));
    if (iPre < 0) throw new ErroParse(`${codigo}: sem linha de pré-requisitos (layout mudou?)`);
    const iEm = bloco.findIndex((l) => l.startsWith('Ementa:'));
    // o texto do pré-requisito pode vir na mesma linha ou na seguinte, até a Ementa
    const pre = [bloco[iPre]!.slice('Pré-Req.:'.length), ...bloco.slice(iPre + 1, iEm > iPre ? iEm : bloco.length)].join(' ').trim();
    const cred = /\bC:(\d+)/.exec(bloco[0]!);
    if (!cred) throw new ErroParse(`${codigo}: sem créditos (C:nnn) na linha de carga`);
    const ementa = iEm >= 0 ? bloco.slice(iEm + 1).filter((l) => l !== 'Voltar').join(' ').replace(/^Ementa:\s*/, '') : '';
    const semPre = !pre || pre.startsWith('Não há');
    if (!semPre && !/^[*A-Z0-9\s/]+$/.test(pre)) throw new ErroParse(`${codigo}: pré-requisito ilegível: ${pre}`);
    out.set(codigo, {
      codigo,
      nome: nome!.trim(),
      creditos: Number(cred[1]),
      ementa: ementa || null,
      prereqTexto: pre,
      alternativas: semPre ? [] : alternativas2020(pre),
    });
  });
  return out;
}
