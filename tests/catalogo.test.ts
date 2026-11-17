import { expect, test } from 'bun:test';
import { parseCatalogo, urlCatalogo } from '@/dac/catalogo';
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
