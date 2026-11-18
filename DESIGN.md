---
name: Zefe
description: Papel quente, tinta quente, verde "rio" como primário; capivara como mascote. App denso e legível, apresentação mais solta.
---

# Zefe: sistema visual

## Sistema v2 (landing e app)
Dono rejeitou a landing v1 ("fora da identidade, tipografia fora do padrão, AI Gen UI") e pediu algo macio, arredondado, próximo de abacatepay.com. Paleta: verde-petróleo + âmbar capivara. Vale na landing (`<div data-ds="v2">`) e, promovido para `:root`, no app inteiro (ver "Migração do app"). Tokens em `src/app/globals.css` (`--ds-*` no escopo, utilitários Tailwind `*-ds-*`); componentes em `src/components/ds/`. **Nada de cor, raio ou tamanho literal na landing.**

**Tipografia**: uma família só, **Fustat** (variável, `next/font/google`, `--font-fustat`), pesos 400/500/700. Sem monoespaçada: códigos em 500 com `tabular-nums` (`.ds-num`). Títulos 700, tracking -0.045em (display) a -0.03em (h3), entrelinha 1.05-1.2; corpo 400/500, entrelinha 1.5-1.55; frase simples sempre, sem caixa-alta espaçada, sem eyebrow.
| Token | px | Uso |
|---|---|---|
| `text-ds-display-xl` / `-lg` / `ds-display` | 72 / 64 / 56 | h1 (xl ≥1280, lg ≥1024, 56 ≥768); no celular o h1 usa `text-ds-h2` (40) |
| `text-ds-h2` | 40 | título de seção (e h1 no celular) |
| `text-ds-h3` | 24 | semestre, logo |
| `text-ds-lead` | 20 | frase de apoio |
| `text-ds-body` | 16 | texto, botões |
| `text-ds-small` | 14 | **conteúdo** dos demos (códigos, nomes de disciplina/turma, balões, chips) |
| `text-ds-caption` | 12 | só legendas e eixos (horas, dias); 12 é o piso e só entra no conteúdo onde 14 não cabe (blocos de grade estreitos) |
Como `cn()` usa twMerge, esses tamanhos estão registrados em `src/lib/utils.ts` (senão `text-ds-caption` some ao lado de `text-ds-*` de cor).

**Cores** (hex é a fonte da verdade): `ds-bg` #F4F7F8 gelo; `ds-surface` #FFFFFF; `ds-frame` #E6EDEF (anel da moldura); `ds-ink` #153F40 (títulos, texto forte); `ds-body` #3E5658 (7,8:1 no branco, 7,3:1 no gelo); `ds-link` #1F6F6B (5,9:1; foco, links, "libera"); `ds-line` #DDE6E8 (bordas 1px); `ds-amber` #F2B24A com texto `ds-ink` (6,2:1), hover #E9A535; `ds-amber-tint` #FDF0D6 (realce); `ds-band` #153F40 com texto branco (11,6:1).
Estados, chips suaves (texto sobre fundo, todos ≥ 5,3:1, sempre cor + ícone + texto): cursada #1E6B3A/#E3F4E8; cursando #1D5A9E/#E3EEFA; planejada #5B3FA0/#ECE6F8; travada #9A4A0C/#FCEBDA; faltando #4A5E60/#EDF1F2; conflito #A3261E/#FBE6E3; previsão #0F6577/#DFF1F5.
O âmbar faz **um trabalho**: a ação principal (Entrar com e-mail). Segundo uso explícito e único: o **tint âmbar** (`ds-amber-tint`) como realce de "aqui" (disciplina em foco na árvore, selo "próximo" na fita); nada além disso.

**Raios (escada fixa)**: 12 `rounded-ds-input` (blocos de grade, nós da árvore) · 20 `rounded-ds-card` (cartões, colunas, balões) · 32 `rounded-ds-panel` (painéis de seção, painel interno da moldura, faixa final) · 56 `rounded-ds-frame` (moldura do produto) · `rounded-full` (botões, nav, chips, selos, campo). Nenhum outro.

**Espaçamento**: 4/8/12/16/24/32/48/64/96 (escala do Tailwind). Seção `py-16` (64) no celular, `py-24` (96) de `lg`; Painel `p-4` celular / `p-12` (48) de `md`; Cartão `p-6` (24); Moldura `p-3`/`p-6` + painel interno `p-4`/`p-8`. Contêiner 1216px (`.ds-container`), gutter 24 / 48 (≥768) / 112 (≥1280).

**Elevação**: plano; borda 1px `ds-line`; um único `shadow-ds-frame` (0 12 40 -16, verde-petróleo 18%) na moldura e na nav. Sem sombra dura, sem brilho.

**Componentes** (`src/components/ds/`): `Pilula` (botão/link, h 48, px 24, 500/16; `primaria` âmbar, `secundaria` branca com borda, `fantasma` texto; `pilula.base` para `<button>`) · `NavLanding` (pílula branca 80% + blur só aqui, borda 1px, altura 64, afastada 16px do topo, `sticky`; logo + Planejador, Árvore, Busca, Sobre, Entrar, Entrar com e-mail) · `Chip` (pílula 12px, tons de estado/aviso, ícone + texto) · `Cartao` (branco, r20, borda, p24; usado na matrícula, no painel de conversa do Peça e veja e nas notas, sempre p24, variantes só de cor de fundo) · `Painel` (r32) · `Moldura` (r56, anel `ds-frame`, painel branco r32 dentro) · `Selo` (pílula pequena, frase simples, só duas falas: **"Exemplo"** para tudo ilustrativo e **"Trecho do catálogo 2026"** para dado conferido com a DAC; o selo com o mascote no hero ("Seu assistente de integralização") é o único selo permitido acima de um título: pílula em frase simples, não um eyebrow em caixa-alta espaçada) · `RodapeLanding`.
**Padrão de seção**: h2 + frase de apoio (`max-w-ds-prose`, 40rem) sobre o gelo, com arranjos alternados: Peça e veja = painel largo com um h3 de afirmação; árvore = `Moldura` com o título dentro; matrícula = painel à esquerda, texto + `Cartao` à direita; calouro = conversa direto no fundo, sem painel; faixa final em `ds-band` r32 com botão âmbar e o mascote em 96/128px (`<Mascote tamanho decorativo>`). Hero alinhado à esquerda.
**Fontes (exceção temporária)**: a landing ainda carrega Bricolage, Hanken e JetBrains porque o layout raiz as carrega para o app; sai quando a migração do app para o v2 for mesclada.
**Navegação no celular**: abaixo de `lg` a nav mostra logo + "Menu" (folha r20 com Planejador, Árvore, Busca, Sobre, via `<details>` nativo) + "Entrar"; de `lg` os links ficam na pílula. No celular a fita mostra 1º-4º semestre e o resto abre por "Ver os outros semestres" (`aria-expanded`). Linhas da árvore: 1px e 2px.
**Movimento**: ease `cubic-bezier(.22,1,.36,1)`, 300-500 ms; uma orquestração de entrada (`.ds-subir` no hero, colunas da fita e moldura escalonadas); blocos dos demos `.ds-bloco`; demos tocam uma vez; tudo estático com `prefers-reduced-motion`.
**Regras anti "AI-gerado"**: sem texto em gradiente, sem blur/glass além da nav, sem blobs/glows, sem emoji, sem eyebrow em caixa-alta, sem fios de tinta 2px, sem mono, sem fileira de 3 cartões iguais como estrutura, sem hero centralizado, sem pseudo-3D, sem gradiente roxo-azul. Mesmo padding de cartão em todo lugar; tudo na escala de 8.
**Dados**: o trecho da árvore foi conferido com o catálogo 2026 do curso 94 (SI304 e TT060 também aceitam SI206, agora anotado). **Exemplos a trocar depois**: estados da fita, cenários do "Peça e veja", semana de matrícula, conversa do calouro, mascote (PNG do dono).

## App (Operate), sistema v2

Contrato das telas do app. Valores vivem em `src/app/globals.css` (bloco "PROMOÇÃO V2 → APP"); use os tokens, nunca cores literais. Modo: **Operate** nas telas do app (grade, árvore, busca), **Persuade** só em `/`. Nada de institucional: sem vermelho/brasão Unicamp, nada que pareça oficial.

## Tema
Claro é o padrão e o principal; o app não segue o tema do sistema (sem `prefers-color-scheme`). O escuro só vale com `<html data-theme="dark">` (variante Tailwind `dark:` = esse atributo); sem alternância na interface na v1. Todo token tem valor claro e escuro; teste os dois. `::placeholder` usa `muted-foreground` (AA).

## Tokens
Os `--ds-*` valem em `:root`; os semânticos do shadcn derivam deles (Tailwind: `bg-background`, `text-muted-foreground`...).
- Superfícies: `background` gelo #F4F7F8, `card`/`popover`/`painel` branco, `muted` #EDF2F3 (hover), `secondary` #E6EDEF, `accent` #E4F0EF (item ativo de menu, linha marcada).
- Texto: `foreground` tinta #153F40, `muted-foreground` #3E5658 (7:1), `link` #1F6F6B (`text-link`; foco, links, "libera").
- Ação: `primary` âmbar #F2B24A com `primary-foreground` tinta: **só a ação principal** (botão `default`). Seleção (aba de semestre, estado marcado) usa tinta: `bg-foreground text-background`. Nunca `text-primary` (âmbar não passa em texto).
- Bordas: `border` #DDE6E8 (decorativa, 1px); `input` #7D9A9C (contorno de campo, ≥ 3:1); `ring` = link. `destructive` = conflito.
- Escuro (`<html data-theme="dark">`): superfícies verde-petróleo profundo (#0C1F20/#132B2C), tinta clara #EBF4F4, link #7FD0C8, âmbar igual; estados com texto claro sobre fundo profundo. Não segue o sistema.
Tipografia: **Fustat** é a única fonte (`font-sans`, `font-heading` e `font-mono` apontam para ela); pesos 400/500/700; sem monoespaçada: código de disciplina em 500 + `tabular-nums`. h1 de página `text-ds-h2` (40), h2 `text-xl` (20) ou `text-ds-h3` (24), corpo 14-16, legenda/chip 12 (mínimo). Entradas de formulário 16px (sem zoom no iOS).
Espaçamento: escala 4/8/12/16/24/32/48; cartão 24 (16 em lista densa); gutter `px-4 lg:px-6`. `h-barra` = 4.5rem (pílula de 56 + 12 de respiro), `w-painel` = 24rem.
Raio (escada): 12 `rounded-lg` (campos, blocos de grade, cartões da árvore) · 20 `rounded-xl` (cartões) · 32 `rounded-3xl` (painel do Zefe, gaveta, cartão de login, rodapé) · pílula `rounded-full` (botões, nav, chips, abas). `rounded-md/sm/2xl` caem num degrau da escada.
Sombra: nenhuma nos cartões; `shadow-elevada` (0 12 40 -16, tinta 18%) só nas peças flutuantes (barra superior, navegação inferior, dropdown, escolha de turma no celular).

## Estados de disciplina (cor + ícone + texto, nunca só cor)
Chips v2 são pílulas 12px sem contorno (só previsão e não verificado têm borda tracejada). Cada estado tem tokens `X` (texto/ícone), `X-bg`, `X-borda` (mistura de X no bg, usada nos cartões densos da árvore e da grade) (ex.: `text-cursada bg-cursada-bg border-cursada-borda`). Use `<EstadoBadge>` ou `corDe()` de `@/components/ui/estado`.
| Estado | Cor | Ícone (lucide) |
|---|---|---|
| cursada | verde #1E6B3A | CheckCircle2 |
| cursando | azul #1D5A9E | Clock |
| planejada | violeta #5B3FA0 | CalendarCheck |
| faltando | cinza-petróleo | CircleDashed |
| travada | laranja #9A4A0C | Lock |

## Níveis de aviso
| Nível | Cor | Ícone | Borda |
|---|---|---|---|
| conflito | vermelho #A3261E | OctagonX | sem borda (chip) |
| aviso | âmbar escuro #7A4F00 sobre tint âmbar | AlertTriangle | sem borda (chip) |
| previsão | petróleo #0F6577 | Telescope | **tracejada** |
| não verificado | cinza #4F5B66 | HelpCircle | **tracejada** |
Tracejado = "informação incerta/derivada": previsão e não verificado nunca parecem fato. `<AvisoBadge nivel>`.

## Casca (layout)
Dashboard macio e arredondado, como o produto da landing (referência: painel do AbacatePay).
- **Barra superior**: pílula branca flutuante (`h-14`, borda 1px, `shadow-elevada`, blur só nela), mesma da landing, dentro de um header sticky `h-barra`: logo + nome, navegação em pílulas (ativa em `accent`), busca em pílula `muted`, Entrar (âmbar) / Sair (contorno), botões `size="sm"` (40).
- Computador: área principal + **painel do Zefe** à direita, `w-painel` (24rem) + 16px de respiro, altura `100dvh - barra`, sticky; painel branco de raio 32 com borda. **Aberto por padrão só a partir de `xl`**; entre `lg` e `xl` recolhido numa faixa de `w-20` com o mascote; botão recolhe/reabre. O padrão vem de CSS (sem piscar).
- Celular: navegação inferior **flutuante em pílula** (`fixed inset-x-3 bottom-3`, `h-16`, item ativo em `accent` arredondado: Planejador, Árvore, Busca, Zefe); "Zefe" abre **gaveta inferior** (`Sheet side="bottom"`, 70dvh, raio 32 no topo). O conteúdo tem `pb-24`.
- Rodapé sempre: cartão branco r32 com o aviso de que o Zefe não é oficial.
- Duas variantes por grupo de rotas: `src/app/(app)/` usa `Casca` (com painel: planejador, árvore, busca, disciplina, professor, sala, sobre). `src/app/(site)/` usa `CascaLeve` (sem painel; `/`, `/entrar`, `/comecar`, que ficam num cartão r32 sobre o gelo).
- Link "Ir para o conteúdo" no início; o conteúdo é `<main id="conteudo">`.

## Componentes
Base shadcn (estilo base-nova, Base UI) em `src/components/ui/`, restilizada para o v2: `button` (pílula; 48 padrão, `size="sm"` 40 nas telas densas, `xs` 32 dentro de cartão; `default` = âmbar, uma ação principal por tela; `outline` branco com borda), `card` (r20, p24, `size="sm"` p16), `badge` (pílula), `sheet` (r32 no lado aberto), `tooltip`, mais `estado.tsx`. Campos: `h-10`/`h-12`, r12, borda `input`, texto 16px. Botão de link: `<Button render={<Link href=…/>} nativeButton={false}>`. Telas densas: cartões planos (`border` + `bg-card` r20, sem sombra), conteúdo `text-sm` (14), legenda `text-xs` (12), sem cartões aninhados. Ícones: só lucide, `size-4`/`size-5`, `aria-hidden` quando há rótulo. Mascote: `<Mascote estado="parado|pensando|feliz" tamanho={px} />`; 24-36px em navegação (decorativo), 160px no painel.

## Foco, navegação, seleção
Foco visível global (`:focus-visible` 2px `ring`, offset 2px). Seleção de texto em tint âmbar, cursor em `link`. Barras de rolagem finas na paleta.

## Movimento
Esparso. Telas densas: sem animação além de transições de cor (150ms). Mascote: piscar lento (parado/feliz) e reticências pulsando (pensando). Tudo em CSS dentro de `@media (prefers-reduced-motion: no-preference)`; com redução, nada se move.
- `anim-subir` (`zefe-subir`: 12px, 0.6s, ease-out exponencial `cubic-bezier(0.16,1,0.3,1)`; atrasos `-2`/`-3` de 0.08s/0.16s): entrada do título, subtítulo e pedido na landing; as colunas da fita usam o mesmo com atraso inline (0.25s + 0.07s por coluna).
- `anim-bloco` (`zefe-bloco`: 0.5s, mesma curva; revela o bloco de cima para baixo com `clip-path: inset(0 0 100% 0)` → `inset(0)` e 4px de deslocamento): bloco que entra na grade dos demos da landing (`PecaEVeja`, `SemanaMatricula`). Só opacidade/clip/transform.
- Landing: cada demo toca **uma vez**, sozinho, e depois só por clique do visitante. Hero: ao carregar (1,5s), o pedido "monta meu 4º semestre" é digitado, o Zefe passa a `pensando`, os chips do 4º semestre saem de `faltando` para o estado final um a um (260ms) e o Zefe termina `feliz`; digitar no campo interrompe tudo. `PecaEVeja` e `SemanaMatricula` começam ao entrar na tela (`IntersectionObserver`, limiar 0.5 e 0.6). Estados temporais vêm de React (`setTimeout`), não de keyframes.
- **Redução de movimento**: os keyframes nem existem; os componentes da landing leem `prefers-reduced-motion: reduce` e começam já no **estado final** (pedido digitado, chips arrumados, grade montada, conflito resolvido). Sem JS: também estado final. Nada depende da animação para ser compreendido.
- Exceção deliberada ao "sem animação" das telas densas: o traçado das linhas da árvore (ver Telas densas) e o realce da mini árvore da landing (transição de opacidade/borda 200ms).

## Referências da landing anterior (histórico; vistas em 1440 e 390 px)
Superadas na landing atual pelas referências Hatche/Blup/Forky (seção Landing). Hero em painel `rounded-[2rem]`, gradientes difusos e navegação em pílula **não existem mais no build**; não herdar.
- **stripe.com/br**: título enorme com tracking apertado e hierarquia seca; fios finos estruturando a página; mostra interface de produto logo no primeiro quadro; CTA saturado e botões retangulares. Levado: `tracking-[-0.035em]` nos títulos da landing, grade ilustrada no hero, hairlines (`border-y`).
- **sharpi.ai**: atmosfera suave (gradiente difuso) atrás do hero, fragmentos de produto flutuando, navegação em pílula. Levado: fundo do hero com dois gradientes radiais suaves (tom de capivara e verde), mascote sobreposto ao cartão de produto.
- **restaurantes.toqan.com.br**: painel de hero grande, inset e muito arredondado, botões em pílula, títulos fortes. Levado: hero como painel `rounded-[2rem]` inset e botões `rounded-full` na landing.
- Nas telas densas do app nada disso se aplica: cartões planos, raio menor, sem gradiente.

## Landing `/` (Persuade)
Mantém o mundo (papel quente, tinta, verde rio, Bricolage/Hanken/JetBrains Mono, tokens de estado); muda o arranjo. Fonte: `src/app/(site)/page.tsx` e `src/components/landing/*`. Tese: a graduação inteira numa **fita** horizontal; o visitante vê o curso de verdade e o pedido virando bloco.
- **Estrutura**: gutter `max-w-[90rem] px-4 lg:px-6`; seções separadas por **fio de tinta** `border-t-2 border-foreground` (sem cartões de ícone+título+texto); `py-16 lg:py-24`. Títulos de seção (h2) `font-heading font-extrabold`, `text-3xl sm:text-4xl lg:text-5xl`, `leading-[1.02]`, `tracking-[-0.035em]`. Hero h1 `clamp(2.5rem, min(7.4vw,10.5vh), 5.25rem)`, `leading-[0.95]`, `tracking-[-0.04em]`, com a frase final em `text-primary`. Ordem: hero com fita → "Peça e veja" → mini árvore → semana de matrícula → conversa do calouro → faixa de fechamento `bg-primary text-primary-foreground` com um único CTA.
- **Fita** (`Fita`): `ol` de 7 colunas de semestre (de `lg`; abaixo, linhas empilhadas com o rótulo à esquerda), fio de tinta de 2px no topo e `border-l-2` entre colunas; rótulo do semestre em Bricolage 800, créditos em mono tabular; chips `rounded-lg border font-mono text-xs` com `corDe(estado)` + ícone + texto para leitor de tela; "próximo" como selo `rounded-full bg-primary`; eletivos como chip tracejado "+N cr eletivos"; legenda dos 5 estados abaixo. Zefe (balão "Você está aqui.", `shadow-suave`) fica sobre a coluna do semestre atual, em espaço reservado (nunca cobre chip).
- **Pedido** (`PedidoForm`): campo em pílula `rounded-full border bg-card shadow-elevada` com botão primário `rounded-full` "Entrar com e-mail"; é formulário real (`action=/entrar`). Mesmo CTA na barra superior (`leve`) e na faixa final.
- **Peça e veja** (`PecaEVeja`): painel do Zefe (`bg-painel`, `rounded-2xl border`) com conversa em balões (usuário `bg-primary`, Zefe `bg-card border`, cantos `rounded-2xl` com um canto reto), pedidos clicáveis como pílulas (`aria-pressed`), e grade semanal (Seg-Sáb, 08h-22h) com blocos `planejada`; conflito vira bloco `conflito` com OctagonX + `AvisoBadge` e some com troca de turma. Abaixo de `lg` a grade vem acima do painel.
- **Mini árvore** (`ArvoreAcende`): trecho real do curso, nós `rounded-lg border bg-card`; em foco, "antes" em tinta, "depois" e foco em verde, resto apagado (`bg-muted/60`); linhas como curvas SVG; de `md` quadro, abaixo lista por semestre com rótulos "pede/libera/escolhida" (cor nunca é o único canal). Passa o mouse/Tab/toque; Esc limpa.
- **Semana de matrícula** (`SemanaMatricula`): grade Seg-Sex em cartão, três etapas (só a aula; Turma A em conflito; Turma B resolve), aviso de **previsão** em tracejado (`previsao`) e linha de exportação `.ics`; o texto afirma que a matrícula continua no sistema da DAC.
- **Calouro**: fio de conversa (pergunta em `bg-primary` à direita, resposta em `bg-painel` com avatar "Z" tipográfico) com título sticky em `lg`.
- **Rótulo "exemplo"** (regra): todo dado ilustrativo é rotulado na própria superfície com uma pílula tracejada mono (`rounded-full border border-dashed`, `font-mono text-xs`): "exemplo", "exemplo · dados fictícios", "exemplo de conversa". Dado real é dito como tal ("trecho real · catálogo 2026"). Códigos, nomes, créditos e pré-requisitos são reais (`dados.ts`); estados de disciplina, grades e conversas são fictícios. Sem número, depoimento ou claim inventado.
- **Slot do mascote** (regra): o personagem entra por `<Mascote estado="parado|pensando|feliz" tamanho={px} decorativo />` e por nenhum outro caminho; o estado vem do que a página faz (hero: parado → pensando → feliz). Layout reserva caixa por `tamanho`/`className`, sem depender de silhueta, proporção ou fundo da arte, que o dono vai refazer. Não editar os arquivos do mascote/favicon nas telas.
- **Referências carregadas** (Hatche, Blup, Forky; princípios, não aparência): mascote como personagem com estado; produto funcionando no primeiro quadro (a fita e o pedido, não uma ilustração); fio de conversa com o agente como forma de prova. Não foi copiado layout, cor, ilustração nem texto de nenhuma delas.

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
- Eixo de horas à esquerda (`2.75rem`, tabular, "08h"…), 07h–23h, **44 px por hora**, linha fina por hora; colunas Seg–Sáb de largura igual.
- Largura mínima da semana: **36rem**; de `sm` (640 px) em diante a semana inteira, rolando na horizontal se faltar espaço.
- **Abaixo de `sm` (390 px): seletor de dia** (abas Seg–Sáb, ponto marca dias com aula, abre no primeiro dia com aula) e uma coluna só, com largura legível. Escolhido em vez de rolagem horizontal porque Qui–Sáb ficavam fora da tela.
- Bloco: código em mono semibold + `início–fim` em tabular; turma e sala quando houver, em linhas seguintes (altura mínima 18 px). Nome completo sempre em `aria-label` e `title` ("código, dia, início às fim"). Cor = `tom` (estado/aviso).
- **Conflito**: blocos que se sobrepõem ficam lado a lado, cada um com metade da coluna, ambos com `tom` conflito (vermelho, borda sólida, ícone OctagonX no selo ao lado/abaixo da grade); com mais de uma coluna o texto diminui (0.62rem) e quebra em vez de cortar com reticências. Nunca um bloco por cima do outro.
- Aulas **sem horário** não entram na grade: lista "Sem horário" abaixo, com selo "não verificado" quando o dado vier incompleto.
- Em marketing, ilustração usa a mesma `GradeSemanal` com rótulos "Exemplo A…" (nunca código real).

**Árvore de integralização** :
- **Sem rolagem lateral em nenhuma largura.** A seção do quadro sai do `max-w-5xl` da página e usa até `90rem`. O contêiner (`@container`) decide pela *própria* largura (o painel do Zefe tira 22.5rem do `main` em `xl`): a partir de **52rem (832 px)** é o **quadro**, abaixo é a **lista**. Limite escolhido por teste: em 832 px as 8 colunas ficam com ~88 px de cartão e 24 px de calha (código 12 px inteiro, nome em 2 linhas); 1280 px com painel aberto dá 872 px (cabe), 768 px dá 736 (lista). Todas as classes `@min-[52rem]:` são esse limite.
- **Quadro**: CSS grid, `repeat(N, minmax(0,1fr))`, colunas de semestre, linhas de **4.75rem** fixas (linhas alinhadas entre colunas), `gap-x-6` (calha de 24 px) e `gap-y-6` (canal de 24 px entre linhas). Cartão compacto `CartaoCompacto`: ícone de estado + código mono em negrito, nome em até 2 linhas (nome completo no `title` do botão e no painel), créditos ("4 cr") e chip tracejado "+SI206"/"+2 fora" para pré-requisito fora do currículo; estado = cor + ícone + rótulo só para leitor de tela. Sem escala no selecionado (não cria overflow).
- **Lista** (celular/tablet): cada semestre é um grupo com título e cartões em grade de 2 (3 a partir de `sm`) colunas; nota de trava visível no cartão; selecionada mostra "← pré-requisitos / → libera" e botões Detalhes/Limpar logo abaixo; sem linhas SVG.
- **Painel de detalhe**: abaixo do quadro, em largura total (3 colunas em `lg`: relações em 2, o resto em 1), aparece ao selecionar sem mexer no quadro; barra de seleção (código, nome, legenda, "Ver detalhes", "Limpar destaque") fica sticky sob a barra superior no quadro.
- **Linhas** (`src/dominio/rotas-arvore.ts`, puro e testado): ortogonais com cantos arredondados, só por calhas (verticais) e canais entre linhas (horizontais), nunca por cima de cartão. Saem da direita do pré-requisito (38% da altura) e entram pela esquerda do alvo (62%). Arestas da mesma origem dividem um tronco na calha; da mesma entrada, um tronco na calha do alvo; no canal, do mesmo alvo dividem uma faixa. Faixas: troncos curtos primeiro, os de origem do lado do cartão de origem, os de alvo do lado do alvo (menos cruzamentos). Arestas que pulam colunas sobem/descem na calha da origem até o canal junto da linha do alvo. Cada linha tem halo da cor do fundo (folga nos cruzamentos); camadas: cartões apagados < linhas < cartões destacados < selos "ou". Diretas (encostam na selecionada) a 2.25 px; indiretas a 1.25 px e 60%.
- Cartão: **estado = cor (tokens X/X-bg/X-borda) + ícone**. Travada mostra o motivo no painel e no `title`; regra não entendida mostra selo "não verificado".
- **Destaque por clique** (exceção deliberada a "sem animação", pedido do aluno): clicar/tocar/Enter escurece o resto (opacidade ~30%) e desenha as linhas em 340 ms escalonadas por distância. "Antes" = anel tinta + seta esquerda, "Depois" = anel verde + seta direita, "Selecionada" = anel grosso e alvo; "e" = contínua, "ou" = tracejada com selo "ou" ("*" = parcial). Esc, clique no vazio ou "Limpar destaque" desfazem; setas ←/→ andam entre relacionadas diretas. Com `prefers-reduced-motion`: sem traçado, o escurecimento continua. Lógica em `src/dominio/grafo.ts`.

**Painel do Zefe**: aberto por padrão só a partir de `xl`; entre `lg` e `xl` recolhido (faixa `w-14`); abaixo de `lg` é a gaveta inferior. O mascote nunca fica sobre conteúdo.


## Migração do app
- `globals.css`: bloco único "PROMOÇÃO V2 → APP" (`:root` com os `--ds-*` + tokens semânticos + estados; `:root[data-theme="dark"]`). O bloco `[data-ds="v2"]` da landing não foi alterado e continua valendo (mesmos valores, a landing fica idêntica). Radii do shadcn mapeados na escada 12/20/32/56.
- `layout.tsx`: só Fustat. Bricolage, Hanken e JetBrains Mono saíram; `font-mono` aponta para Fustat (rede de segurança).
- Telas densas em v2: cartão da árvore com texto mínimo de 12px (linhas do quadro 5rem em vez de 4.75rem); as linhas de "antes" (tinta) e "depois" (`link`, petróleo) são parecidas em matiz, então o papel é lido também por seta, anel e tracejado; chips de estado sem contorno, com borda `X-borda` só nos cartões.
- Seleção usa tinta, não âmbar: âmbar é só a ação principal.
