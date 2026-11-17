---
name: Zefe
description: Papel quente, tinta quente, verde "rio" como primário; capivara como mascote. App denso e legível, apresentação mais solta.
---

# Zefe: sistema visual

Contrato de todas as telas. Valores vivem em `src/app/globals.css`; use os tokens, nunca cores literais. Modo: **Operate** nas telas do app (grade, árvore, busca), **Persuade** só em `/`. Nada de institucional: sem vermelho/brasão Unicamp, nada que pareça oficial.

## Tema
Segue o sistema (`prefers-color-scheme`); sem alternância manual na v1. Variantes Tailwind: `dark:` = media query. Todo token tem valor claro e escuro; teste os dois.

## Tokens
Cores (Tailwind: `bg-background`, `text-muted-foreground`...), em OKLCH:
- Superfícies: `background` (papel quente), `card`, `popover`, `painel` (fundo do painel do Zefe), `muted`, `secondary`, `accent` (tinta verde clara).
- Texto: `foreground`, `muted-foreground` (≥ 4.5:1 sobre background), `primary-foreground`.
- Marca: `primary` (verde "rio", L 0.42 claro / 0.78 escuro), `ring` (foco), `border`, `input`, `destructive`.
- Mascote: `capi`, `capi-claro`, `capi-escuro` (tons de capivara).
Tipografia (self-hosted via `next/font/google`): `font-heading` Bricolage Grotesque (títulos, h1-h3 já aplicam), `font-sans` Hanken Grotesk (texto/UI), `font-mono` JetBrains Mono (códigos de disciplina, horários; use `tabular-nums`/classe `.tabular` em colunas numéricas). Escala: texto base 16px, UI densa `text-sm`/`text-xs`; h1 de página `text-4xl` (landing até `lg:text-6xl`), h2 `text-xl`-`text-3xl`. Medida de leitura ≤ 68ch.
Espaçamento: escala padrão do Tailwind (4px); gutter de página `px-4` celular, `lg:px-6`; seções da landing `py-16 lg:py-24`. `h-barra` = 3.5rem (barra superior), `w-painel` = 22.5rem (painel).
Raio: `--radius` 0.75rem; `rounded-lg` controles, `rounded-xl/2xl` cartões, `rounded-full` selos.
Sombra: `shadow-suave` (cartões em repouso), `shadow-elevada` (destaque/painéis flutuantes). Sempre com offset e blur; sem sombra dura.

## Estados de disciplina (cor + ícone + texto, nunca só cor)
Cada estado tem tokens `X` (texto/ícone), `X-bg`, `X-borda` (ex.: `text-cursada bg-cursada-bg border-cursada-borda`). Use `<EstadoBadge>` ou `corDe()` de `@/components/ui/estado`.
| Estado | Cor | Ícone (lucide) |
|---|---|---|
| cursada | verde (h150) | CheckCircle2 |
| cursando | azul (h250) | Clock |
| planejada | violeta (h300) | CalendarCheck |
| faltando | neutro quente | CircleDashed |
| travada | laranja (h45) | Lock |

## Níveis de aviso
| Nível | Cor | Ícone | Borda |
|---|---|---|---|
| conflito | vermelho (h27) | OctagonX | sólida |
| aviso | âmbar (h85) | AlertTriangle | sólida |
| previsão | ciano (h215) | Telescope | **tracejada** |
| não verificado | cinza frio (h270) | HelpCircle | **tracejada** |
Tracejado = "informação incerta/derivada": previsão e não verificado nunca parecem fato. `<AvisoBadge nivel>`.

## Casca (layout)
- Barra superior sticky (`h-barra`): logo + nome, navegação (Planejador, Árvore, Busca, Sobre), busca (campo-link para `/busca`), Entrar.
- Computador (`lg`+): área principal flexível + **painel do Zefe fixo à direita**, `w-painel` fixo, altura `100dvh - barra`, sticky; botão recolhe para uma faixa de `w-14` com o mascote (reabre). Não persiste entre visitas na v1.
- Celular: navegação inferior fixa (`h-16`: Planejador, Árvore, Busca, Zefe); "Zefe" abre **gaveta inferior** (`Sheet side="bottom"`, 70dvh). O `main` tem `pb-20` para não ficar sob a barra.
- Rodapé sempre: aviso de que o Zefe não é oficial da Unicamp nem da DAC.
- Duas variantes por grupo de rotas: `src/app/(app)/` usa `Casca` (com painel; páginas logadas e públicas de consulta: planejador, árvore, busca, disciplina, professor, sala, sobre). `src/app/(site)/` usa `CascaLeve` (sem painel; apresentação `/`, e `/entrar`, `/comecar`).
- Link "Ir para o conteúdo" no início; o conteúdo é `<main id="conteudo">`.

## Componentes
Base shadcn (estilo base-nova, Base UI) em `src/components/ui/`: `button`, `card`, `badge`, `separator`, `sheet`, `tooltip`, mais `estado.tsx`. Botão de link: `<Button render={<Link href=…/>} nativeButton={false}>`. Telas densas: cartões planos (`border` + `bg-card`, sem sombra), `text-sm`, sem cartões aninhados. Ícones: só lucide, `size-4`/`size-5`, `aria-hidden` quando há rótulo. Mascote: `<Mascote estado="parado|pensando|feliz" tamanho={px} />`; 24-36px em navegação (decorativo), 160px no painel.

## Foco, navegação, seleção
Foco visível global (`:focus-visible` 2px `ring`, offset 2px). Seleção de texto e cursor em verde da marca. Barras de rolagem finas na paleta.

## Movimento
Esparso. Um momento por tela: entrada `anim-subir` (12px, 0.6s, ease-out exponencial) no topo da landing. Mascote: piscar lento (parado/feliz) e reticências pulsando (pensando). Telas densas: sem animação além de transições de cor (150ms). Tudo dentro de `@media (prefers-reduced-motion: no-preference)`; com redução, nada se move.

## Evitar
Gradiente em texto, glass decorativo, borda lateral colorida, cartões iguais de ícone+título+texto como estrutura, estado só por cor, qualquer elemento que pareça oficial da Unicamp.
