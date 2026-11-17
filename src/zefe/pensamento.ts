// O Nova às vezes escreve o raciocínio entre <thinking>…</thinking>; isso nunca vai para a tela nem para o banco.
const ABRE = '<thinking>';
const FECHA = '</thinking>';

/** Tamanho do maior sufixo de `s` que é prefixo próprio de `tag` (pode ser o começo de uma tag partida entre pedaços). */
const sufixoDeTag = (s: string, tag: string) => {
  for (let n = Math.min(tag.length - 1, s.length); n > 0; n--) if (tag.startsWith(s.slice(-n))) return n;
  return 0;
};

/** Removedor com estado, para texto em pedaços. `push` devolve o que já é seguro mostrar; `fim` devolve o resto. */
export function criarRemovedor() {
  let dentro = false;
  let pular = false; // logo depois de um bloco removido, descarta espaços/quebras de linha
  let buf = '';
  return {
    push(pedaco: string): string {
      buf += pedaco;
      let saida = '';
      for (;;) {
        if (dentro) {
          const i = buf.indexOf(FECHA);
          if (i < 0) { buf = buf.slice(buf.length - sufixoDeTag(buf, FECHA)); break; }
          buf = buf.slice(i + FECHA.length);
          dentro = false;
          pular = true;
          continue;
        }
        if (pular) { buf = buf.trimStart(); if (!buf) break; pular = false; }
        const i = buf.indexOf(ABRE);
        if (i < 0) {
          const n = sufixoDeTag(buf, ABRE);
          saida += buf.slice(0, buf.length - n);
          buf = buf.slice(buf.length - n);
          break;
        }
        saida += buf.slice(0, i);
        buf = buf.slice(i + ABRE.length);
        dentro = true;
      }
      return saida;
    },
    /** Fim do texto: bloco aberto e sem fechar é descartado; um começo de tag que não virou tag volta como texto. */
    fim(): string {
      const resto = dentro ? '' : buf;
      buf = '';
      dentro = false;
      return resto;
    },
  };
}

export function removerPensamento(texto: string): string {
  const r = criarRemovedor();
  return r.push(texto) + r.fim();
}
