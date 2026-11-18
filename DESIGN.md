---
name: Zefe
description: Papel quente, tinta quente, verde "rio" como primário; capivara como mascote. App denso e legível, apresentação mais solta.
---

# Zefe: sistema visual

Contrato de todas as telas. Valores vivem em `src/app/globals.css`; use os tokens, nunca cores literais. Modo: **Operate** nas telas do app (grade, árvore, busca), **Persuade** só em `/`. Nada de institucional: sem vermelho/brasão Unicamp, nada que pareça oficial.

## Tema
Claro é o padrão e o principal; o app não segue o tema do sistema (sem `prefers-color-scheme`). O escuro só vale com `<html data-theme="dark">` (variante Tailwind `dark:` = esse atributo); sem alternância na interface na v1. Todo token tem valor claro e escuro; teste os dois. `::placeholder` usa `muted-foreground` (AA).

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
- Computador: área principal flexível + **painel do Zefe à direita**, `w-painel` (22.5rem), altura `100dvh - barra`, sticky. **Aberto por padrão só a partir de `xl` (80rem)**; entre `lg` e `xl` começa recolhido na faixa de `w-14` com o mascote (a tela densa fica com a largura toda) e o aluno abre quando quiser; botão recolhe/reabre. O padrão vem de CSS (sem piscar); a escolha do aluno não persiste entre visitas na v1.
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

## Referências (vistas em 1440 e 390 px)
- **stripe.com/br**: título enorme com tracking apertado e hierarquia seca; fios finos estruturando a página; mostra interface de produto logo no primeiro quadro; CTA saturado e botões retangulares. Levado: `tracking-[-0.035em]` nos títulos da landing, grade ilustrada no hero, hairlines (`border-y`).
- **sharpi.ai**: atmosfera suave (gradiente difuso) atrás do hero, fragmentos de produto flutuando, navegação em pílula. Levado: fundo do hero com dois gradientes radiais suaves (tom de capivara e verde), mascote sobreposto ao cartão de produto.
- **restaurantes.toqan.com.br**: painel de hero grande, inset e muito arredondado, botões em pílula, títulos fortes. Levado: hero como painel `rounded-[2rem]` inset e botões `rounded-full` na landing.
- Nas telas densas do app nada disso se aplica: cartões planos, raio menor, sem gradiente.

## Mascote
**Fornecido pelo aluno (commit 02a7c8e, 2026-11-18): `public/mascote-zefe.png`, `public/mascotes-zefe-adesivos.png`, `public/favicon.png` e `src/app/icon.png`, usados por `src/components/zefe/Mascote.tsx`. Não reverter, redesenhar nem trocar de volta para o SVG.** O texto abaixo descreve o SVG anterior e fica só como histórico.

Capivara de perfil, olhando para a direita, desenhada em `path`: cabeça grande e rombuda ligada a um corpo de barril numa silhueta só, narina no alto da ponta do focinho, focinho claro, orelha pequena e alta atrás, olho pequeno e alto, patas curtas (as de lá mais escuras). Boca só como traço ao longo do focinho (nunca de frente). Legível de 24 a 160 px; o ícone do site (`src/app/icon.svg`) é a cabeça sobre o verde da marca, com cores literais porque o SVG é independente. Só tokens `--capi`, `--capi-claro`, `--capi-escuro`, `--capi-tinta`, `--capi-brilho`, `--capi-bochecha`. Estados: parado, pensando (olha para cima, sobrancelha, reticências), feliz (olho fechado sorrindo, bochecha).

## Evitar
Gradiente em texto, glass decorativo, borda lateral colorida, cartões iguais de ícone+título+texto como estrutura, estado só por cor, qualquer elemento que pareça oficial da Unicamp.

## Grade semanal (`GradeSemanal`)
Seg–sáb, 07h–23h, 44px por hora. Itens sobrepostos ficam lado a lado (colunas por grupo de sobreposição). Em 390 px a grade rola na horizontal (largura mínima 36rem); cada bloco tem `aria-label` com dia e horário, e `tom` usa os tokens de estado/aviso (`corDe`).

## Telas densas (grade semanal e árvore)
Regras do modo Operate: cartões planos, `text-sm`/`text-xs`, sem gradiente, sem sombra, sem animação. Estado e aviso sempre cor + ícone + texto. Largura útil do `main` com o painel aberto é pequena (1024 px com painel de 22.5rem dá ~664 px), por isso o painel só abre sozinho em `xl`.

**Grade semanal** (`GradeSemanal`, props `itens`/`className`, não mudam):
- Eixo de horas à esquerda (`2.75rem`, mono tabular, "08h"…), 07h–23h, **44 px por hora**, linha fina por hora; colunas Seg–Sáb de largura igual.
- Largura mínima da semana: **36rem**; de `sm` (640 px) em diante a semana inteira, rolando na horizontal se faltar espaço.
- **Abaixo de `sm` (390 px): seletor de dia** (abas Seg–Sáb, ponto marca dias com aula, abre no primeiro dia com aula) e uma coluna só, com largura legível. Escolhido em vez de rolagem horizontal porque Qui–Sáb ficavam fora da tela.
- Bloco: código em mono semibold + `início–fim` em tabular; turma e sala quando houver, em linhas seguintes (altura mínima 18 px). Nome completo sempre em `aria-label` e `title` ("código, dia, início às fim"). Cor = `tom` (estado/aviso).
- **Conflito**: blocos que se sobrepõem ficam lado a lado, cada um com metade da coluna, ambos com `tom` conflito (vermelho, borda sólida, ícone OctagonX no selo ao lado/abaixo da grade); com mais de uma coluna o texto diminui (0.62rem) e quebra em vez de cortar com reticências. Nunca um bloco por cima do outro.
- Aulas **sem horário** não entram na grade: lista "Sem horário" abaixo, com selo "não verificado" quando o dado vier incompleto.
- Em marketing, ilustração usa a mesma `GradeSemanal` com rótulos "Exemplo A…" (nunca código real).

**Árvore de integralização** (Task 10):
- Uma **coluna por semestre**, lado a lado, com a lista de cartões empilhada; o conjunto **rola na horizontal** (`overflow-x-auto`, rolagem por semestre, `snap-x` opcional) em qualquer largura que não caiba; cabeçalho do semestre (`text-xs`, "1º semestre") fica acima da coluna.
- Cartão: `CartaoDisciplina` (`src/components/arvore/`), **11rem de largura** (`w-44`), `rounded-lg border p-2.5`, altura pela altura do conteúdo (nome até 2 linhas, código mono, nota de trava). **Estado = cor (tokens X/X-bg/X-borda) + ícone + rótulo de texto** na primeira linha.
- Travada mostra o motivo em uma linha ("Pede o …"); regra não entendida mostra texto original + selo "não verificado" tracejado.
- Gaveta/painel de detalhe nunca cobre a árvore em `lg`; no celular detalhe abre em `Sheet`.

**Painel do Zefe**: aberto por padrão só a partir de `xl`; entre `lg` e `xl` recolhido (faixa `w-14`); abaixo de `lg` é a gaveta inferior. O mascote nunca fica sobre conteúdo.
