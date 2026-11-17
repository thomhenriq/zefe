import { parse } from 'node-html-parser';
import { textLines } from './html';
import { campusDoInstituto, ErroParse, type Dia, type Disciplina, type Fonte, type Horario, type Turma } from './tipos';

const BASE = 'https://www.dac.unicamp.br/portal/caderno-de-horarios';

export function parseIndiceInstitutos(html: string, ano: number, periodo: number): string[] {
  const re = new RegExp(`${BASE}/${ano}/${periodo}/S/G/([A-Z]+)"`, 'g');
  const s = new Set<string>();
  for (const m of html.matchAll(re)) if (m[1] !== 'AM') s.add(m[1]!);
  // vazio é normal para semestre ainda não publicado; semestre passado vazio é tratado como erro em oferta.ts
  return [...s];
}

export function parseIndiceDisciplinas(html: string, ano: number, periodo: number, instituto: string): { codigo: string; nome: string }[] {
  const prefixo = `${BASE}/${ano}/${periodo}/S/G/${instituto}/`;
  const out: { codigo: string; nome: string }[] = [];
  for (const a of parse(html).querySelectorAll('.disciplina a')) {
    const href = a.getAttribute('href') ?? '';
    if (!href.startsWith(prefixo)) continue;
    const codigo = href.slice(prefixo.length);
    const label = a.querySelector('.label')?.text.trim() ?? '';
    const nome = a.text.trim().slice(label.length).trim();
    out.push({ codigo, nome });
  }
  if (!out.length && new RegExp(`/${ano}/${periodo}/S/G/${instituto}/[A-Z]{2}\\d{3}`).test(html))
    throw new ErroParse(`página do instituto ${instituto} (${periodo}S/${ano}) tem disciplinas que não consegui ler`);
  return out;
}

const DIAS: Record<string, Dia> = {
  segunda: 'seg', terca: 'ter', quarta: 'qua', quinta: 'qui', sexta: 'sex', sabado: 'sab',
};
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const diaDe = (s: string): Dia | undefined => DIAS[semAcento(s)];
const num = (s: string | undefined) => (s && /^\d+$/.test(s) ? Number(s) : null);
const RE_HORA = /^(\d{2}:\d{2}) - (\d{2}:\d{2})$/;
const ROTULOS = new Set(['Turma:', 'Vagas:', 'Número de alunos matriculados:', 'Idioma de oferecimento:', 'Horários/Salas:', 'Docentes:', 'Reservas:']);

export function parseDisciplina(html: string, meta: { codigo: string; instituto: string; fonte: Fonte }): Disciplina {
  const L = textLines(html);
  const iCred = L.indexOf('Créditos:');
  if (iCred < 0) throw new ErroParse(`página da disciplina ${meta.codigo} sem "Créditos:" (${meta.fonte.url})`);

  const titulo = L.find((l) => l.startsWith(`${meta.codigo} - `)) ?? '';
  const nome = titulo.replace(`${meta.codigo} - `, '').replace(/\s+-\s+\dS\/\d{4}$/, '').trim();

  const turmas = parse(html).querySelectorAll('.turma').map((el) => parseTurma(textLines(el.outerHTML)));
  if (!turmas.length) throw new ErroParse(`página da disciplina ${meta.codigo} sem nenhuma turma (${meta.fonte.url})`);

  return {
    codigo: meta.codigo,
    nome,
    creditos: num(L[iCred + 1]),
    instituto: meta.instituto,
    campus: campusDoInstituto(meta.instituto),
    turmas,
    fonte: meta.fonte,
  };
}

function parseTurma(L: string[]): Turma {
  const t: Turma = { turma: '', vagas: null, matriculados: null, horarios: [], docentes: [], reservas: [] };
  let modo = '';
  for (let i = 0; i < L.length; i++) {
    const l = L[i]!;
    if (ROTULOS.has(l)) {
      modo = l;
      if (l === 'Turma:') t.turma = L[++i] ?? '';
      else if (l === 'Vagas:') t.vagas = num(L[++i]);
      else if (l === 'Número de alunos matriculados:') t.matriculados = num(L[++i]);
      else if (l === 'Idioma de oferecimento:') i++;
      continue;
    }
    if (modo === 'Horários/Salas:') {
      const dia = diaDe(l);
      const h = RE_HORA.exec(L[i + 1] ?? '');
      if (dia && h) {
        const sala = L[i + 2] ?? '';
        const temSala = !diaDe(sala) && !ROTULOS.has(sala);
        const hr: Horario = { dia, inicio: h[1]!, fim: h[2]!, sala: temSala ? sala : '' };
        t.horarios.push(hr);
        i += temSala ? 2 : 1;
      } else if (l !== 'Não possui horários cadastrados.') t.horarioIncompleto = true;
    } else if (modo === 'Docentes:') t.docentes.push(l);
    else if (modo === 'Reservas:') t.reservas.push(l);
  }
  if (!t.turma) throw new ErroParse('bloco de turma sem letra');
  return t;
}
