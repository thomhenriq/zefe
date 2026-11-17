import { parse, NodeType, type Node } from 'node-html-parser';

/** Texto decodificado de cada nó de texto não vazio do <body>, sem script/style. */
export function textLines(html: string): string[] {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const body = root.querySelector('body') ?? root;
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === NodeType.TEXT_NODE) {
      const t = n.text.replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
      return;
    }
    if (n.nodeType === NodeType.COMMENT_NODE) return;
    for (const c of n.childNodes) walk(c);
  };
  walk(body);
  return out;
}
