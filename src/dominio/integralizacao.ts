import type { Estado, GrupoEletiva, Requisito } from '@/dac/tipos';

export interface EntradaIntegralizacao {
  obrigatorias: { codigo: string; nome: string; creditos: number; semestreSugerido: number | null }[];
  eletivas: GrupoEletiva[]; // ordem do catálogo
  propostaEletivas: { semestre: number; creditos: number }[];
  historico: Map<string, 'cursada' | 'cursando'>;
  planejadas: Set<string>;
  creditosDe: (codigo: string) => number | null;
  /** Alternativas de pré-requisito (vazio = sem pré-requisito); null = código sem entrada no catálogo (desconhecido). */
  prereq: (codigo: string) => Requisito[][] | null;
}

export interface Integralizacao {
  disciplinas: {
    codigo: string;
    nome: string;
    creditos: number;
    semestreSugerido: number | null;
    estado: Estado;
    faltamPrereq: string[]; // só quando travada: requisitos que faltam na alternativa mais próxima
    prereqDesconhecido: boolean; // sem catálogo: a tela diz "pré-requisito não verificado"; nunca fica travada por isso
  }[];
  /** `aberto`: grupo verificado sem lista de códigos (qualquer disciplina oferecida pela Unicamp). */
  grupos: { texto: string; creditos: number; feitos: number; emAndamento: number; excedente: number; verificado: boolean; aberto: boolean; codigosContados: string[] }[];
  /** Sem lista: não obrigatória e fora de qualquer grupo verificado, e não existe grupo não verificado que possa abrigá-la. */
  foraDoCurriculo: string[];
  /** Idem, mas existe grupo não verificado (conteúdo desconhecido): não dá para afirmar que está fora do currículo. */
  naoClassificadas: string[];
  creditos: {
    obrigatorias: { feitos: number; total: number; emAndamento: number };
    eletivas: { feitos: number; total: number; naoVerificado: number; emAndamento: number };
  };
}

/** `feitos` só soma `cursada`; `cursando` vai para `emAndamento` e nunca vira feito. */
export function calcularIntegralizacao(e: EntradaIntegralizacao): Integralizacao {
  const { historico } = e;
  const cumprido = (r: Requisito) => {
    const h = historico.get(r.codigo);
    return h === 'cursada' || h === 'cursando'; // cursando = "cumpre se aprovado"; vale também para parcial (*)
  };

  const disciplinas = e.obrigatorias.map((o) => {
    const h = historico.get(o.codigo);
    const alts = e.prereq(o.codigo);
    let estado: Estado = h ?? 'faltando';
    let faltamPrereq: string[] = [];
    if (!h && alts && alts.length > 0 && !alts.some((a) => a.every(cumprido))) {
      estado = 'travada';
      faltamPrereq = alts.map((a) => a.filter((r) => !cumprido(r)).map((r) => r.codigo)).sort((x, y) => x.length - y.length)[0]!;
    } else if (!h && e.planejadas.has(o.codigo)) estado = 'planejada';
    return { ...o, estado, faltamPrereq, prereqDesconhecido: alts === null };
  });

  const obrig = new Set(e.obrigatorias.map((o) => o.codigo));
  const grupos = e.eletivas.map((g) => ({
    texto: g.texto, creditos: g.creditos, verificado: g.verificado, aberto: g.verificado && g.codigos === null, feitos: 0, emAndamento: 0, excedente: 0, codigosContados: [] as string[],
  }));
  const foraDoCurriculo: string[] = [];
  const naoClassificadas: string[] = [];
  const haNaoVerificado = e.eletivas.some((g) => !g.verificado);
  // shortcut: cursada que cabe em mais de um grupo conta no primeiro (ordem do catálogo), sem otimizar a distribuição; melhorar se o grupo ficar cheio e o aluno perder crédito
  // shortcut: sem equivalências entre disciplinas na v1; quem cumpriu por equivalência marca a disciplina como cursada à mão
  for (const [codigo, h] of [...historico].sort(([a], [b]) => a.localeCompare(b))) {
    if (obrig.has(codigo)) continue;
    let i = e.eletivas.findIndex((g) => g.verificado && g.codigos?.includes(codigo));
    if (i < 0) i = e.eletivas.findIndex((g) => g.verificado && g.codigos === null); // grupo aberto
    if (i < 0) { (haNaoVerificado ? naoClassificadas : foraDoCurriculo).push(codigo); continue; }
    const cr = e.creditosDe(codigo) ?? 0; // crédito desconhecido não é inventado
    if (h === 'cursada') { grupos[i]!.feitos += cr; grupos[i]!.codigosContados.push(codigo); }
    else grupos[i]!.emAndamento += cr;
  }
  // excedente não conta além do grupo; fica visível em `excedente`. `emAndamento` não é limitado (é só informativo)
  for (const g of grupos) { g.excedente = Math.max(0, g.feitos - g.creditos); g.feitos -= g.excedente; }

  const soma = (xs: number[]) => xs.reduce((s, n) => s + n, 0);
  const ver = grupos.filter((g) => g.verificado);
  return {
    disciplinas,
    grupos,
    foraDoCurriculo,
    naoClassificadas,
    creditos: {
      obrigatorias: {
        feitos: soma(disciplinas.filter((d) => d.estado === 'cursada').map((d) => d.creditos)),
        total: soma(disciplinas.map((d) => d.creditos)),
        emAndamento: soma(disciplinas.filter((d) => d.estado === 'cursando').map((d) => d.creditos)),
      },
      eletivas: {
        feitos: soma(ver.map((g) => g.feitos)),
        total: soma(ver.map((g) => g.creditos)),
        naoVerificado: soma(grupos.filter((g) => !g.verificado).map((g) => g.creditos)),
        emAndamento: soma(ver.map((g) => g.emAndamento)),
      },
    },
  };
}
