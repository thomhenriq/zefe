import { CalendarDays, Info, ListTree, Search, type LucideIcon } from "lucide-react";

export type ItemNav = { href: string; rotulo: string; Icone: LucideIcon };

/** Destinos principais; as páginas são construídas por tarefas posteriores. */
export const itensNav: ItemNav[] = [
  { href: "/planejador", rotulo: "Planejador", Icone: CalendarDays },
  { href: "/arvore", rotulo: "Árvore", Icone: ListTree },
  { href: "/busca", rotulo: "Busca", Icone: Search },
];
export const itemSobre: ItemNav = { href: "/sobre", rotulo: "Sobre", Icone: Info };
