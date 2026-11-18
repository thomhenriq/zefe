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

**Árvore de integralização** (Task 10, layout v2):
- **Sem rolagem lateral em nenhuma largura.** A seção do quadro sai do `max-w-5xl` da página e usa até `90rem`. O contêiner (`@container`) decide pela *própria* largura (o painel do Zefe tira 22.5rem do `main` em `xl`): a partir de **52rem (832 px)** é o **quadro**, abaixo é a **lista**. Limite escolhido por teste: em 832 px as 8 colunas ficam com ~88 px de cartão e 24 px de calha (código mono 11 px inteiro, nome em 2 linhas); 1280 px com painel aberto dá 872 px (cabe), 768 px dá 736 (lista). Todas as classes `@min-[52rem]:` são esse limite.
- **Quadro**: CSS grid, `repeat(N, minmax(0,1fr))`, colunas de semestre, linhas de **4.75rem** fixas (linhas alinhadas entre colunas), `gap-x-6` (calha de 24 px) e `gap-y-6` (canal de 24 px entre linhas). Cartão compacto `CartaoCompacto`: ícone de estado + código mono em negrito, nome em até 2 linhas (nome completo no `title` do botão e no painel), créditos ("4 cr") e chip tracejado "+SI206"/"+2 fora" para pré-requisito fora do currículo; estado = cor + ícone + rótulo só para leitor de tela. Sem escala no selecionado (não cria overflow).
- **Lista** (celular/tablet): cada semestre é um grupo com título e cartões em grade de 2 (3 a partir de `sm`) colunas; nota de trava visível no cartão; selecionada mostra "← pré-requisitos / → libera" e botões Detalhes/Limpar logo abaixo; sem linhas SVG.
- **Painel de detalhe**: abaixo do quadro, em largura total (3 colunas em `lg`: relações em 2, o resto em 1), aparece ao selecionar sem mexer no quadro; barra de seleção (código, nome, legenda, "Ver detalhes", "Limpar destaque") fica sticky sob a barra superior no quadro.
- **Linhas** (`src/dominio/rotas-arvore.ts`, puro e testado): ortogonais com cantos arredondados, só por calhas (verticais) e canais entre linhas (horizontais), nunca por cima de cartão. Saem da direita do pré-requisito (38% da altura) e entram pela esquerda do alvo (62%). Arestas da mesma origem dividem um tronco na calha; da mesma entrada, um tronco na calha do alvo; no canal, do mesmo alvo dividem uma faixa. Faixas: troncos curtos primeiro, os de origem do lado do cartão de origem, os de alvo do lado do alvo (menos cruzamentos). Arestas que pulam colunas sobem/descem na calha da origem até o canal junto da linha do alvo. Cada linha tem halo da cor do fundo (folga nos cruzamentos); camadas: cartões apagados < linhas < cartões destacados < selos "ou". Diretas (encostam na selecionada) a 2.25 px; indiretas a 1.25 px e 60%.
- Cartão: **estado = cor (tokens X/X-bg/X-borda) + ícone**. Travada mostra o motivo no painel e no `title`; regra não entendida mostra selo "não verificado".
- **Destaque por clique** (exceção deliberada a "sem animação", pedido do aluno): clicar/tocar/Enter escurece o resto (opacidade ~30%) e desenha as linhas em 340 ms escalonadas por distância. "Antes" = anel tinta + seta esquerda, "Depois" = anel verde + seta direita, "Selecionada" = anel grosso e alvo; "e" = contínua, "ou" = tracejada com selo "ou" ("*" = parcial). Esc, clique no vazio ou "Limpar destaque" desfazem; setas ←/→ andam entre relacionadas diretas. Com `prefers-reduced-motion`: sem traçado, o escurecimento continua. Lógica em `src/dominio/grafo.ts`.

**Painel do Zefe**: aberto por padrão só a partir de `xl`; entre `lg` e `xl` recolhido (faixa `w-14`); abaixo de `lg` é a gaveta inferior. O mascote nunca fica sobre conteúdo.
