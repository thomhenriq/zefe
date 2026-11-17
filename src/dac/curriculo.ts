import { parse, type HTMLElement } from 'node-html-parser';
import { textLines } from './html';
import { ErroParse, type CurriculoPleno, type GrupoEletiva, type Proposta, type PropostaSemestre } from './tipos';

const BASE = 'https://www.dac.unicamp.br/sistemas/catalogos/grad';
export const urlIndiceCatalogo = (ano: number) => `${BASE}/catalogo${ano}/index.html`;
export const urlCurriculo = (ano: number, curso: number) => `${BASE}/catalogo${ano}/cursos/${curso}g/curriculo.html`;
export const urlSugestao = (ano: number, curso: number) => `${BASE}/catalogo${ano}/cursos/${curso}g/sugestao.html`;

const RE_CODIGO = /^[A-Z]{1,2} ?\d{3}$/; // "F 128" tem espaço no catálogo; guardamos sem ele
const semEspaco = (s: string) => s.replace(/\s+/g, '');
const txt = (e: HTMLElement) => e.text.replace(/\s+/g, ' ').trim();

export function parseCursos(html: string): { numero: number; nome: string; turno: string | null }[] {
  const L = textLines(html);
  const out = L.flatMap((l, i) => {
    const m = /^(\d+) - (.+)$/.exec(l);
    if (!m || L[i + 1] !== 'Página do Curso') return [];
    const t = /^(.+) - (Integral|Noturno)$/.exec(m[2]!);
    return [{ numero: Number(m[1]), nome: t ? t[1]! : m[2]!, turno: t ? t[2]! : null }];
  });
  if (!out.length) throw new ErroParse('índice do catálogo sem cursos (layout mudou?)');
  return out;
}

export function parseProposta(html: string): Proposta[] {
  const L = textLines(html);
  const out: Proposta[] = [];
  let atual: PropostaSemestre | null = null;
  for (const l of L) {
    const mod = /^([A-Z]{2}) - /.exec(l);
    if (mod || /^\d+G - /.test(l)) {
      out.push({ modalidade: mod ? mod[1]! : null, semestres: [] });
      atual = null;
      continue;
    }
    const sem = /^(\d+)º Semestre - /.exec(l);
    if (sem) {
      if (!out.length) out.push({ modalidade: null, semestres: [] }); // sem cabeçalho de curso/modalidade
      atual = { semestre: Number(sem[1]), codigos: [], creditosEletivos: 0 };
      out.at(-1)!.semestres.push(atual);
      continue;
    }
    if (!atual) continue;
    if (/^©|^Observação/.test(l)) {
      atual = null;
      continue;
    }
    const cod = /^([A-Z]{1,2} ?\d{3}) \(\d+\)$/.exec(l);
    if (cod) atual.codigos.push(semEspaco(cod[1]!));
    const el = /^(\d+) créditos? eletivos?$/.exec(l);
    if (el) atual.creditosEletivos += Number(el[1]);
  }
  // modalidade só com observação (ex.: curso 7, AF) não tem proposta; o sync registra a falta
  const com = out.filter((p) => p.semestres.length);
  if (!com.length) throw new ErroParse('proposta sem semestres (layout mudou?)');
  return com;
}

const rotuloEletiva = /^Disciplinas eletivas [IVXL]+:\s*/;

/** Grupo só é "verificado" quando todas as linhas são códigos concretos e os créditos foram lidos. */
function fechar(g: { texto: string; creditos: number | null; linhas: { codigo: string; desc: string }[] }): GrupoEletiva {
  const concreto = g.linhas.length > 0 && g.linhas.every((l) => RE_CODIGO.test(l.codigo));
  const naoCodigos = g.linhas.filter((l) => !RE_CODIGO.test(l.codigo)).map((l) => l.desc || l.codigo);
  const ok = concreto && g.creditos != null;
  // shortcut: só esta redação exata de "aberto"; outras regras de qualquer-disciplina ficam não verificadas, ampliar com fixtures de outros cursos
  const aberto = g.creditos != null && g.linhas.length === 1 && g.linhas[0]!.codigo === '-----' && /^qualquer disciplina oferecida pela unicamp\.?$/.test(g.linhas[0]!.desc.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase());
  if (aberto) return { creditos: g.creditos!, texto: g.texto, codigos: null, verificado: true };
  return {
    creditos: g.creditos ?? 0,
    texto: ok ? g.texto : [g.texto, ...naoCodigos].filter(Boolean).join('\n'),
    codigos: ok ? g.linhas.map((l) => semEspaco(l.codigo)) : null,
    verificado: ok,
  };
}

export function parseCurriculoPleno(html: string, curso: number): CurriculoPleno {
  const root = parse(html);
  const h2 = root.querySelector('h2');
  const nomeCurso = h2 ? (new RegExp(`^${curso} - (.+?) - Curr`).exec(txt(h2))?.[1] ?? '') : '';

  type Mod = { sigla: string | null; nome: string | null; obrigatorias: string[]; eletivas: GrupoEletiva[] };
  const comum = { obrig: [] as string[], eletivas: [] as GrupoEletiva[] };
  const mods: Mod[] = [];
  let secao: 'nucleo' | 'obrig' | 'eletivas' | null = null;
  let grupo: { texto: string; creditos: number | null; linhas: { codigo: string; desc: string }[] } | null = null;
  const alvo = () => mods.at(-1);
  const fecharGrupo = () => {
    if (grupo) (alvo()?.eletivas ?? comum.eletivas).push(fechar(grupo));
    grupo = null;
  };

  const walk = (n: HTMLElement) => {
    for (const e of n.childNodes as HTMLElement[]) {
      if (!e.tagName) continue;
      const tag = e.tagName.toLowerCase();
      if (tag === 'h2') {
        const m = /^([A-Z]{2}) - (.+)$/.exec(txt(e));
        if (m) {
          fecharGrupo();
          mods.push({ sigla: m[1]!, nome: m[2]!, obrigatorias: [], eletivas: [] });
          secao = null;
        }
      } else if (tag === 'h3') {
        fecharGrupo();
        const t = txt(e);
        secao = /^Núcleo Comum/.test(t) ? 'nucleo' : /^Disciplinas Obrigat/.test(t) ? 'obrig' : /^Disciplinas Eletivas/.test(t) ? 'eletivas' : null;
      } else if (tag === 'p' && secao === 'eletivas') {
        const t = txt(e);
        if (rotuloEletiva.test(t)) {
          fecharGrupo();
          const texto = t.replace(rotuloEletiva, '');
          grupo = { texto, creditos: Number(/(\d+) créditos/.exec(texto)?.[1]) || null, linhas: [] };
        } else if (grupo && t) grupo.texto += ` ${t}`; // observação do grupo
      } else if (tag === 'table') {
        const linhas = e.querySelectorAll('tr').flatMap((tr) => {
          const tds = tr.querySelectorAll('td');
          return tds.length ? [{ codigo: txt(tds[0]!), desc: tds.length > 3 ? txt(tds[3]!) : '' }] : [];
        });
        if (secao === 'eletivas' && grupo) grupo.linhas.push(...linhas);
        else if (secao === 'nucleo') comum.obrig.push(...linhas.map((l) => semEspaco(l.codigo)));
        else if (secao === 'obrig') (alvo()?.obrigatorias ?? comum.obrig).push(...linhas.map((l) => semEspaco(l.codigo)));
      } else walk(e);
    }
  };
  walk(root);
  fecharGrupo();

  const base: Mod[] = mods.length ? mods : [{ sigla: null, nome: null, obrigatorias: [], eletivas: [] }];
  const modalidades = base.map((m) => ({
    ...m,
    obrigatorias: [...new Set([...comum.obrig, ...m.obrigatorias])],
    eletivas: [...comum.eletivas, ...m.eletivas],
  }));
  for (const m of modalidades) {
    if (!m.obrigatorias.length) throw new ErroParse(`currículo ${curso}${m.sigla ? ` ${m.sigla}` : ''} sem obrigatórias (layout mudou?)`);
    for (const c of m.obrigatorias) if (!/^[A-Z]{1,2}\d{3}$/.test(c)) throw new ErroParse(`código inesperado em ${curso}: ${c}`);
  }
  return { curso, nomeCurso, modalidades };
}
