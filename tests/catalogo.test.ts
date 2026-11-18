import { expect, test } from 'bun:test';
import { idsCoordenadorias2020, parseCatalogo, parseCatalogo2020, urlCatalogo } from '@/dac/catalogo';
import { ErroParse } from '@/dac/tipos';

const si = Bun.file(`${import.meta.dir}/fixtures/catalogo/disciplinas-si.html`).text();

test('SI300: créditos, pré-requisito e ementa', async () => {
  const e = parseCatalogo(await si).get('SI300');
  expect(e).toMatchObject({ nome: 'Programação Orientada a Objetos I', creditos: 4, alternativas: [[{ codigo: 'SI100', parcial: false }]] });
  expect(e!.ementa?.length).toBeGreaterThan(20);
  expect(e!.ementa).not.toContain('Bibliografia');
});

test('formatos: sem pré-requisito, "ou", parcial "*"', async () => {
  const c = parseCatalogo(await si);
  expect(c.get('SI100')?.alternativas).toEqual([]);
  expect(c.get('SI202')?.alternativas).toEqual([[{ codigo: 'SI100', parcial: false }], [{ codigo: 'SI101', parcial: false }]]);
  expect(c.get('SI700')?.alternativas).toEqual([[{ codigo: 'SI201', parcial: true }, { codigo: 'SI400', parcial: false }]]);
});

test('página sem disciplinas → ErroParse', () => {
  expect(() => parseCatalogo('<html><body></body></html>')).toThrow(ErroParse);
});

test('urlCatalogo: prefixo de uma letra usa f_.html', () => {
  expect(urlCatalogo(2026, 'F')).toMatch(/\/catalogo2026\/disciplinas\/f_\.html$/);
  expect(urlCatalogo(2026, 'SI')).toMatch(/\/disciplinas\/si\.html$/);
});

// Catálogo 2020: uma página por coordenadoria (coordenadorias/NNNN/NNNN.html), fixtures reais.
const f2020 = (n: string) => Bun.file(`${import.meta.dir}/fixtures/catalogo/${n}-2020.html`).text();

test('2020: SI302 lê créditos e pré-requisito com parcial; "/" é ou', async () => {
  const c = parseCatalogo2020(await f2020('coordenadoria-0065'));
  expect(c.get('SI302')).toMatchObject({ nome: 'Resolução de Problemas II', creditos: 4, prereqTexto: 'SI101 *SI201', alternativas: [[{ codigo: 'SI101', parcial: false }, { codigo: 'SI201', parcial: true }]] });
  expect(c.get('SI202')?.alternativas).toEqual([[{ codigo: 'SI101', parcial: false }], [{ codigo: 'SI100', parcial: false }]]);
  expect(c.get('SI100')).toMatchObject({ creditos: 4, alternativas: [] });
  expect(c.get('SI100')!.ementa).toContain('Algoritmos');
  expect(c.get('SI100')!.ementa).not.toContain('Voltar');
});

test('2020: espaço liga mais forte que "/" (EB201 = EB101 ou ST101+ST201)', async () => {
  const e = parseCatalogo2020(await f2020('coordenadoria-0001')).get('EB201');
  expect(e).toMatchObject({ creditos: 6, alternativas: [[{ codigo: 'EB101', parcial: false }], [{ codigo: 'ST101', parcial: false }, { codigo: 'ST201', parcial: false }]] });
});

test('2020: coordenadoria vazia dá mapa vazio; layout estranho ou pré-requisito ilegível dá ErroParse', async () => {
  expect(parseCatalogo2020(await f2020('coordenadoria-0012')).size).toBe(0);
  expect(() => parseCatalogo2020('<body><a name="X1"></a>X</body>')).toThrow(ErroParse);
  const html = (pre: string) => `<body><div><a name="AB101">AB101 - X </a></div><p>OF:S-1 T:004 C:004 AV:N<br><strong>Pré-Req.: </strong> ${pre}<div><strong>Ementa: </strong><p>e</p></div></p></body>`;
  expect(() => parseCatalogo2020(html('ver texto (a combinar)'))).toThrow(ErroParse);
  expect(parseCatalogo2020(html('AB100')).get('AB101')!.alternativas).toEqual([[{ codigo: 'AB100', parcial: false }]]);
  expect(() => parseCatalogo2020(html('AB100').replace('C:004', ''))).toThrow(ErroParse);
});

test('2020: índice de coordenadorias', async () => {
  const ids = idsCoordenadorias2020(await Bun.file(`${import.meta.dir}/fixtures/catalogo/coordenadorias-2020.html`).text());
  expect(ids).toContain('0065');
  expect(ids.length).toBeGreaterThan(40);
  expect(() => idsCoordenadorias2020('<body></body>')).toThrow(ErroParse);
});
