import type { Requisito } from "@/dac/tipos";

/** Pré-requisito já resolvido: `null` = código sem entrada no catálogo (desconhecido); `[]` = sem pré-requisito. */
export type Prereq = Requisito[][] | null;

export interface Aresta {
  de: string; // pré-requisito
  para: string; // disciplina que o exige
  /** 'e': obrigatório em qualquer caminho (alternativa única, ou presente em todas); 'ou': só vale numa das alternativas. */
  tipo: "e" | "ou";
  parcial: boolean;
}

export interface Grafo {
  /** Currículo do aluno + qualquer código citado como pré-requisito (a origem do dado está em `prereq`). */
  nos: Set<string>;
  noCurriculo: Set<string>;
  alternativas: Map<string, Requisito[][]>;
  /** Pré-requisito não verificado: sem entrada no catálogo. */
  desconhecidos: Set<string>;
  arestas: Aresta[];
  pais: Map<string, string[]>;
  filhos: Map<string, string[]>;
}

/** Fecha o grafo a partir do currículo, seguindo pré-requisitos para fora dele (outros cursos, eletivas). */
export function construirGrafo(codigos: string[], prereq: (codigo: string) => Prereq): Grafo {
  const noCurriculo = new Set(codigos);
  const nos = new Set<string>();
  const alternativas = new Map<string, Requisito[][]>();
  const desconhecidos = new Set<string>();
  const arestas: Aresta[] = [];
  const pais = new Map<string, string[]>();
  const filhos = new Map<string, string[]>();
  const fila = [...codigos];
  while (fila.length) {
    const c = fila.shift()!;
    if (nos.has(c)) continue;
    nos.add(c);
    const alts = prereq(c);
    if (alts === null) { desconhecidos.add(c); continue; }
    alternativas.set(c, alts);
    const vistos = new Map<string, Aresta>();
    for (const alt of alts) {
      for (const r of alt) {
        const a = vistos.get(r.codigo);
        if (a) { a.parcial ||= r.parcial; continue; }
        vistos.set(r.codigo, { de: r.codigo, para: c, tipo: "e", parcial: r.parcial });
        fila.push(r.codigo);
      }
    }
    for (const a of vistos.values()) {
      if (a.de === c) continue; // auto-referência: ignorada
      a.tipo = alts.every((alt) => alt.some((r) => r.codigo === a.de)) ? "e" : "ou";
      arestas.push(a);
      pais.set(c, [...(pais.get(c) ?? []), a.de]);
      filhos.set(a.de, [...(filhos.get(a.de) ?? []), c]);
    }
  }
  return { nos, noCurriculo, alternativas, desconhecidos, arestas, pais, filhos };
}

/** Busca em largura (seguro contra ciclos): código → distância ao ponto de partida (1 = direto). */
function alcance(vizinhos: Map<string, string[]>, origem: string): Map<string, number> {
  const prof = new Map<string, number>();
  let nivel = [origem];
  for (let d = 1; nivel.length; d++) {
    const prox: string[] = [];
    for (const c of nivel) for (const v of vizinhos.get(c) ?? []) {
      if (v === origem || prof.has(v)) continue;
      prof.set(v, d);
      prox.push(v);
    }
    nivel = prox;
  }
  return prof;
}

export const ancestrais = (g: Grafo, codigo: string) => alcance(g.pais, codigo);
export const descendentes = (g: Grafo, codigo: string) => alcance(g.filhos, codigo);

export interface Relacionadas {
  ancestrais: Map<string, number>;
  descendentes: Map<string, number>;
  /** Só o que liga ancestrais → selecionada → descendentes. `ordem` escalona a animação (0 = encosta na selecionada). */
  arestas: (Aresta & { lado: "antes" | "depois"; ordem: number })[];
}

export function relacionadas(g: Grafo, codigo: string): Relacionadas {
  const anc = ancestrais(g, codigo);
  const desc = descendentes(g, codigo);
  const arestas: Relacionadas["arestas"] = [];
  for (const a of g.arestas) {
    if (a.para === codigo || anc.has(a.para)) {
      if (a.de !== codigo && anc.has(a.de)) arestas.push({ ...a, lado: "antes", ordem: anc.get(a.para) ?? 0 });
    } else if ((a.de === codigo || desc.has(a.de)) && desc.has(a.para)) {
      arestas.push({ ...a, lado: "depois", ordem: desc.get(a.de) ?? 0 });
    }
  }
  return { ancestrais: anc, descendentes: desc, arestas };
}
