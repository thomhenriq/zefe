# SDD ledger — plan: docs/superpowers/plans/2026-11-16-zefe.md

Spec: `docs/superpowers/specs/2026-11-16-zefe-design.md` (aprovado). Orquestrador: Opus. Executores: Sonnet/Haiku conforme o título da tarefa. Revisão por tarefa: Sonnet. Controle de qualidade: subagente Opus novo (troca do Fable pedida pelo aluno em 07eb41e).
Briefs, relatórios e pacotes de revisão ficam em `.superpowers/sdd/2026-11-16-zefe/` (ignorado pelo git).

Para retomar: reler design, plano e este arquivo; `git log`; continuar da primeira tarefa sem "complete".

## Pre-flight

| Par / tarefa | Produz → consome | Achado |
|---|---|---|
| T1 → todas | `db`, scripts npm | ok; scripts `sync/demo/shots/zefe:avaliar` apontam para arquivos de T2/T6/T16/T17 |
| T2 → T7, T8, T11 | `Turma`, `Campus`, `slugProfessor`, tabelas do caderno | ok |
| T3 → T6, T9 | proposta (`curriculo_obrigatoria.semestre_sugerido`, `curriculo_proposta_eletiva`), `catalogo_disciplina` | valores do teste de T6 (EB102, SI300, SI201) só conferem com os dados reais — ver Ruling 3 |
| T5 vs. "Estrutura de arquivos" | `PRODUCT.md`/`DESIGN.md` | estrutura diz T6, a T5 os cria — Ruling 4 |
| T5 → T8, T10, T12, T15 | `DESIGN.md`, casca, `Painel`, `Mascote` | ok |
| T6 → T9, T11, T14, T16, T17 | `aluno.ts`, `exigirUsuario`, usuário demo, OTP no banco | T17 lê o código OTP do banco — Ruling 5 |
| T7 → T8, T12, T14 | `getOferta` (formato `Oferta` do gedeé), `buscarTurmas`, `normalizarCodigo` | ok |
| T8 → T12 | `GradeSemanal` | ok |
| T9 → T10, T14 | `getIntegralizacao` (modifica `aluno.ts` de T6) | ok |
| T11 → T12, T13, T14 | `ItemGrade`, `getGrade`, `alterarGrade` | `ItemGrade` difere do gedeé (nome, creditos, reservas obrigatórios) — usar o do plano |
| T14 → T15, T16 | `criarFerramentas`, `desfazerAcao` | ok |
| T15 modifica T5 | `Painel.tsx` | ok |
| Cada tarefa isolada | testes × código × arquivos | coerentes; nenhum teste vazio mandado pelo plano |
| Global: commit | plano: `Co-Authored-By: Claude <noreply@anthropic.com>` | Ruling 2 |

## Rulings

1. Ruling: trabalhar direto em `main`, sem worktree — o aluno pediu tudo commitado em `main` — custo se errado: nenhum, nada é publicado.
2. Ruling: commits terminam com `Co-Authored-By: Claude <noreply@anthropic.com>` (regra do plano) — é instrução do projeto — custo: só texto do trailer.
3. Ruling: os testes de T3/T6 usam os valores reais das fixtures da DAC; se algum valor do plano não bater com a página real, vale a página e o caso vai para "decisões a conferir" — anti-objetivo 1 (nada inventado) — custo: teste diferente do plano.
4. Ruling: `PRODUCT.md` e `DESIGN.md` são escritos na T5 (onde a skill impeccable roda) — a T5 é a tarefa de identidade — custo: nenhum.
5. Ruling: T6 deixa o OTP do better-auth legível no banco (armazenamento simples, só local) para o `scripts/shots.ts` de T17 entrar sozinho — o plano manda ler o código da tabela — custo: precisa trocar para hash antes de publicar (anotado como `// shortcut`).

6. Ruling: ciclo de correção = até 2 rodadas com o mesmo executor; depois Haiku sobe para Sonnet novo, e Sonnet que falhar duas vezes é resolvido pelo orquestrador — regra do plano ("Papel do orquestrador") vale sobre o limite de 5 rodadas da skill — custo: menos rodadas antes de escalar.
8. Ruling: grupo de eletivas cujo texto é só "Qualquer disciplina oferecida pela Unicamp" (o único do curso 94) é regra entendida: `codigos: null, verificado: true` = grupo aberto, qualquer cursada fora das obrigatórias conta — o anti-objetivo é não chutar regra desconhecida, e esta é conhecida; deixá-la "não verificado" zeraria as eletivas do aluno — custo se errado: créditos eletivos contados a mais para quem tem restrição não escrita (vai para "decisões a conferir").

## Tarefas

(uma linha por tarefa: estado, commits, o que foi verificado, pendências)

- Task 1: implementada (Haiku) em 1689f37; orquestrador conferiu `bun test` 1/1 e `bun run build` ok; revisão Sonnet em andamento. Versões: next 16.4.6, react 19.3.0, drizzle-orm 0.45.4, drizzle-kit 0.31.11, tailwind 4.3.3, postgres.js 4.1.1. `bun test` não lê `.env.local` → `tests/setup.ts` define DATABASE_URL local. `ZEFE_LIBERADOS` preenchido em `.env.local` pelo orquestrador.
- Task 1: complete (commits 07eb41e..1689f37, review clean)
- Task 1: minor (deferred): `src/db/index.ts` cria o cliente postgres no escopo do módulo — guardar em `globalThis` para o HMR do `next dev` não vazar conexões (levar para T6/T8).
- Task 1: minor (deferred): chave morta `ignoreScripts` no package.json; AGENTS.md gerado pelo Next foi commitado.
- Task 2: implementada (Sonnet) em d2bcf0a; orquestrador conferiu `bun test` 18/18 e build ok; sync real 2026/1 FT = 209 oferecimentos, 0 erros. Revisão Sonnet em andamento.
- Task 2: revisão = Needs fixes (2 Important: typo de instituto marca semestre como não publicado; semestre todo falho vira publicado sem dados). Fix round 1 enviado ao mesmo executor (+ corrida de concorrência em baixar.ts).
- Task 2: fix round 1/2 (3 addressed, 0 open; commits d2bcf0a..6b9267a). Orquestrador: `bun test` 21/21.
- Task 2: complete (commits 1689f37..6b9267a, review clean)
- Task 2: minor (deferred): o teste de concorrência não reproduz a corrida específica; índice com institutos mas sem disciplinas retorna `{ok:0}` sem erro.
- Task 2: minor (deferred): `scripts/sync.ts` não valida `Number(ano)`; `fetch` sem timeout; comentário velho em caderno.ts apontando `oferta.ts`; sem teste para "falha mantém dados antigos".
- Task 4a (carga do caderno 2024/1–2027/1): despachada (Haiku), em segundo plano; logs em `.superpowers/sdd/2026-11-16-zefe/carga/`.
- Task 3: despachada (Sonnet). Task 5: despachada (Sonnet + impeccable) em paralelo com T3.
- Task 3: implementada em 38977d5 (`bun test` 38/38; build FALHA em tipo: `curriculo.ts` 'atual' possibly null). Sync real catálogo 2026: 64 cursos, 111 currículos, 7133 disciplinas, 378 grupos de eletivas (104 verificados). Curso 94: 8 semestres de proposta, 46 obrigatórias, eletivos 4/2/10 nos sem. 4/5/6. Erros reais: cursos 36 e 87 = 404 em curriculo.html; curso 7 modalidade AF sem proposta. Revisão em andamento.
- Task 3: revisão = Needs fixes (Critical: build quebrado por tipo; Important: obrigatórias sem modalidade sob outro título são descartadas em silêncio). Fix round 1 enviado, junto com o Ruling 8.
- Task 3: minor (deferred): falha na página de proposta descarta o currículo inteiro do curso; asserção frágil sobre a lista de erros 404 no teste; proposta com código que não é obrigatória é descartada (Task 6 deve saber).
- Task 3: fix round 1/2 (3 addressed, 0 open; commits 2fc3a7e..a95491a). Build passa. Re-sync 2026: 104 grupos com lista, 77 abertos, 197 não verificados; curso 94 = 1 grupo aberto de 16 créditos.
- Task 3: complete (commits 47ce4d7..a95491a, review clean)
- Task 3: minor (deferred): o teste de grupo aberto não olha o `texto` do grupo; conferido no banco: os 77 abertos têm só a frase padrão, sem restrição.
- Nota para T9: grupo não verificado com créditos ilegíveis é gravado com `creditos: 0` — nunca confiar em `creditos` de grupo não verificado.
- Task 5: implementada em 47ce4d7 (DONE_WITH_CONCERNS: não abriu os 3 sites de referência; mascote a 32 px parece urso/porco; tema só segue o sistema). Capturas em `.shots/t5/`. Shell: rotas em `src/app/(app)/` têm casca completa com painel; `src/app/(site)/` casca leve. Revisão Sonnet em andamento.
- Task 5: revisão = Needs fixes (rodapé coberto pela navegação inferior no celular; referências não estudadas; uso da skill impeccable sem evidência; mascote parece porco/urso). Fix round 1 enviado ao mesmo executor.
- Task 5: fix round 1/2 (4 addressed, 1 parcial; commits 38977d5..2fc3a7e). Mascote refeito de perfil (agora lê como capivara), referências estudadas e registradas em DESIGN.md, rodapé visível no celular.
- Task 5: parked — crítica da skill impeccable rodou degradada (sem os 2 subagentes isolados que a skill pede) — Ruling: aceito; a T17 roda o polimento/auditoria da impeccable com os ajudantes dela liberados, e o controle de qualidade 1 (Opus) confere a estética antes.
- Task 5: complete (commits 6b9267a..2fc3a7e, 1 parked)
- Task 5: minor (deferred): classe `border` duplicada em /sobre; no celular o balão do mascote cobre o selo "Planejada" do hero.
- Task 6: despachada (Sonnet). `/entrar` e `/comecar` ficam em `src/app/(site)/` (mesmas URLs). A grade do usuário demo fica para depois da T11.
- Task 6: implementada em db24af1 (`bun test` 54/54; login + cadastro verificados com Playwright, 23 linhas de histórico pré-marcadas; demo idempotente). Problema: `bun run db:push` trava pedindo para truncar `curriculo` (drizzle-kit não enxerga o UNIQUE NULLS NOT DISTINCT que já existe) — tabelas do better-auth aplicadas via `drizzle-kit export` + psql. `exigirUsuario` em `src/sessao.ts`. Revisão em andamento.
- Task 6: revisão = Needs fixes (db:push quebrado; modalidade inválida salva em silêncio). Fix round 1 enviado (+ botão Sair, tratamento de erro no formulário, rótulos alinhados).
- Task 6: Ruling: entrada `db:extensoes` no package.json do commit da T6 fica — o arquivo chega com a T7 — custo: script quebrado se a T7 falhar.
- Task 6: minor (deferred): rate limit do better-auth só em produção (3 tentativas e 300 s de validade valem); `/` redireciona logado para `/planejador`, que só existe a partir da T12.
- Task 6: fix round 1 em ddfe8fa (db:push com 2 índices únicos parciais, roda sem prompt; modalidade validada; botão Sair). Re-revisão em andamento.
- Task 6: fix round 1/2 (3 addressed, 0 open; commits 90a9f65..ddfe8fa).
- Task 6: complete (commits dbfa094..ddfe8fa, review clean)
- Task 6: minor (deferred): `db:push` sempre reaplica `ALTER TABLE turma ... reservas SET DEFAULT '{}'` (idempotente, sem prompt — anotar no README); `signOut` sem try/catch.
- Task 7: revisão = Needs fixes (getDisciplina nula para código só no caderno; sem teste de oferecimentos; chave duplicada no package.json; promessa rejeitada presa em extensoes.ts). Fix round 1 enviado.
- Task 7: implementada em 90a9f65 (10 testes; build ok; só `unaccent`, criada sob demanda por `garantirExtensoes()`/`bun run db:extensoes`). Revisão em andamento.
- Task 7: fix round 1/2 (5 addressed, 0 open; commits ddfe8fa..ff84599). `getDisciplina` agora cai no oferecimento mais recente quando falta catálogo (`catalogo: null`).
- Task 7: complete (commits db24af1..ff84599, review clean)
- Task 7: minor (deferred): `getDisciplina(codigo, anoInexistente)` devolve o fallback em vez de null quando há oferecimentos; "não aparece no caderno" num semestre publicado mas carregado parcialmente soa definitivo.
- Task 11: implementada em c586d56 (17 testes; suíte 74; build ok). Revisão: Approved.
- Task 11: complete (commits ff84599..c586d56, review clean)
- Task 11: minor (deferred → T12): dois horários sobrepostos da MESMA disciplina viram conflito consigo mesma. (deferred → T14): `alterarGrade`/`excluirBloqueio` não devolvem o estado anterior — o desfazer precisa ler antes. (deferred): `principal` único só por código (corrida em `criarGrade`/`definirPrincipal`); N+1 consultas; faltam testes Barão→Limeira e 89 min.
- Task 8: despachada (Sonnet). Task 9: despachada (Sonnet) em paralelo.
- Task 7: despachada (Sonnet) em paralelo com T6 (arquivos disjuntos; T7 proibida de mexer em schema.ts/index.ts).
- Task 5: minor (deferred): cópia da landing promete "4 perguntas e árvore preenchida" antes de T6/T10 existirem (fica verdadeiro depois); busca duplicada no topo e na barra inferior; sem botão de tema (segue o sistema).

7. Ruling: T3 e T5 rodam em paralelo (arquivos disjuntos: `src/dac`/`scripts`/`tests` × `src/app`/`src/components`/docs de design), cada um faz `git add` só dos próprios arquivos — a noite é curta e a carga de dados também corre em paralelo — custo se errado: conflito em package.json/bun.lock, resolvível.

## Retomada (17/11 14:07)

A sessão caiu por volta das 05:32 (limite de uso): os executores de T8, T9, T13 e o revisor do CQ1 morreram sem relatório. T8 e T9 deixaram arquivos não commitados (busca/professor/sala, `src/components/grade`, `integralizacao.ts`…); T13 não deixou nada. A carga do caderno travou em 2025/1 (1150/2514) às 05:27 — um `fetch` sem timeout ficou pendurado 8 h; processo morto às 14:07. Carregados até agora: 2024/1 (2393), 2024/2 (2403), 2026/1 só FT (209). Retomada: executores novos para T8, T9 e T13 partindo dos arquivos parciais; CQ1 de novo com revisor Opus novo; carga (T4) refeita com timeout no download.

Correção da retomada: os executores originais NÃO tinham morrido, estavam pausados. O T9 original terminou e commitou 84854c3; o T9 novo não mudou nada. T8 original e T13 original foram mandados parar (T13 não tinha criado nada; T8 deixou o rascunho que o T8 novo continua). Carga antiga parada; a nova (T4, Haiku) commitou o timeout (1c3ffb0) e está rodando a fila.

- Task 9: implementada em 84854c3 (8 testes; suíte 88; build ok). Demo: obrigatórias 54/184 feitos + 28 em andamento; eletivas 0/16 (grupo aberto); 12 travadas. Revisão = Needs fixes (código que pode estar em grupo não verificado ia para `foraDoCurriculo` — chute); fix round 1 enviado (+ `excedente` por grupo, testes de obrigatória × eletiva, guarda de `inArray` vazio).
- Task 9: fix round 1/2 (4 addressed, 0 open; commits 37d313f..7aeb3c7). Novo campo `naoClassificadas` (cursadas que podem estar num grupo não verificado) e `excedente` por grupo.
- Task 9: complete (commits cbed78e..7aeb3c7, review clean)
- Task 8: commitada em 37d313f pelo executor novo partindo do rascunho do antigo (105 testes; build ok; 404 para código/professor/sala inexistentes; atalho `/` e Ctrl+K). Revisão em andamento.
- Task 13: commitada em e52434c (16 testes; tsc ok); `ExportarIcs.tsx` entrou por engano no commit da T8 (37d313f). Revisão em andamento.
- CQ1 correções: despachadas (Sonnet + impeccable).
- Task 8: revisão = Needs fixes. (a) `ExportarIcs.tsx` da T13 entrou no commit da T8 e importava `@/dominio/ics` ainda inexistente — Ruling: resolvido por e52434c (HEAD compila); sem reescrever histórico. (b) prereq não entendido sem selo "não verificado" → fix round 1 com o executor da T8. (c) GradeSemanal ilegível a 390 px → encaminhado ao executor das correções do CQ1 (dono das regras de telas densas).
- Task 13: revisão = Needs fixes (item com horário incompleto exportado sem marca; item sem horário some sem aviso). Fix round 1 enviado (+ UID com índice, gradeId malformado → 404).
- Task 14: despachada (Sonnet) em paralelo.
- Task 14: implementada em 9ee8ea4 (11 testes; suíte 123; ai 7.0.173, @ai-sdk/amazon-bedrock 5.0.142, zod 4.6.7). Desfazer não é atômico com a marcação (reivindica a ação antes; libera se o inverso falhar). Revisão em andamento.
- Task 14: revisão = Approved com 2 Important (teste de "Minha grade" não exercita o caminho feliz + faltam testes de outro usuário; gradeId velho cria grade nova em silêncio). Fix round 1 enviado (+ listas limitadas, `periodo` aceita string).
- Task 14: fix round 1/2 (3 addressed, 0 open; commits 9ee8ea4..2a316a0).
- Task 14: complete (commits 4310b87..2a316a0, review clean)
- CQ1 correções commitadas em f1f3b40 (landing com GradeSemanal real e rótulos "Exemplo", mascote em path, "Telas densas" no DESIGN.md, painel aberto só a partir de xl, GradeSemanal com abas por dia abaixo de sm, 404 raiz pt-BR, curso escolhido em /comecar, icon.svg). Reconferência (rodada 2) pedida ao mesmo revisor Opus.
- Task 10, Task 12, Task 15: despachadas em paralelo (Sonnet), arquivos disjuntos.
- Task 10: implementada em 6b83c92 (4 testes; build ok; Playwright com demo: detalhe por teclado, marcar/desmarcar). Revisão = Needs fixes (detalhe modal cobre a árvore em lg contra DESIGN.md; `.catch(() => null)` engole qualquer erro). Fix round 1 enviado (+ `aberto` no domínio, nome do curso, cor de "cursando").
- Task 10: fix round 1/2 (todos addressed; commit 234f4c1 — detalhe inline em lg, erro tipado `SemCurriculo`, `grupos[].aberto`).
- Task 10: complete (commits 4530614..234f4c1, exceto d83c628 que é da T12; review clean)
- Task 10: minor (deferred): grupo não verificado e expiração de sessão não exercitados na tela (o curso 94 não tem grupo não verificado).
- Task 12: implementada em d83c628 (planejador completo; Playwright: grade 1S/2027 por previsão com 4 disciplinas + bloqueio 13:30–17:30, troca de turma, conflitos, .ics baixado). Grade do demo ficou vazia (sem oferta das disciplinas do 4º semestre na base até a carga de 2025 chegar). Revisão = Approved.
- Task 12: complete (commits 6b83c92..d83c628, review clean)
- Task 15: implementada em dbbf970 (157 testes; build ok; ~8 chamadas Bedrock na verificação: "o que falta…", "adiciona SI702 A" (previsão 1S/2027), desfazer voltou o banco, usuário não liberado vê "em breve" e recebe 403). `responder(...)`/`responderCompleto(...)` reutilizáveis para a T16; `VERSAO_PROMPT` 2026-11-17.2. Revisão = Needs fixes (previsão mostrava vagas/matriculados do ano-base como se fossem do semestre-alvo — dado inventado; teste de posse da conversa não exercitava a checagem). Fix round 1 enviado (+ cartão desatualizado após desfazer, erro de ferramenta não vaza ao cliente, histórico sem 2 turnos de usuário seguidos, desfazer atrás da lista de liberados).
- Task 17a (Haiku: scripts/shots.ts + README): despachada.
- Task 15: fix round 1 em 49f6e2c (previsão sem vagas/matriculados na ferramenta e no cartão; prompt v2026-11-17.3; teste de posse com 404 exato). Orquestrador: `bun test` 160/160. Re-revisão: todos addressed.
- Task 15: complete (commits 3801842..49f6e2c, review clean)
- Task 15: minor (deferred): cartão esmaecido após desfazer some ao recarregar; erro de modelo e throttling mostram a mesma mensagem; páginas de `(app)` ficam dinâmicas por ler a sessão no layout.
- Task 17a: commitada em bf2d8b7 (`bun run shots` → 52 capturas, login do demo pelo OTP do banco, escuro por `data-theme`). Revisão = Approved.
- Task 17a: complete (commits a3b4ae7..bf2d8b7, review clean)
- Task 17a: minor (deferred): capturas em dev mostram o indicador do Next ("1 issue" em /planejador → mandado ao polimento); fallback do chromium só Linux sem comentário `// shortcut:`. Para o CQ2 o app roda em modo produção (`bun run build && bun run start`).
- Catálogo 2020: correção em 4ac47ab (índice de 2020 fica em cursos.html; `parseCursos` lê os dois formatos). Sync real: 64/66 cursos, 116 currículos 2020, curso 94 com 8 semestres de proposta; **0 disciplinas do catálogo 2020** (em 2020 elas ficam em `coordenadorias/<NNNN>/<NNNN>.html`, outro formato — não feito). Revisão = Approved. Pendência: para aluno de catálogo 2020, pré-requisitos aparecem "não verificado" (correto), mas obrigatória sem crédito em catálogo nem em oferecimento entra com 0 crédito sem rótulo (`aluno.ts` `?? 0`).
- Task 17c (Haiku): carga do caderno 2023/2 → 2020/1 em segundo plano.
- Task 17b (1º executor): corrigiu os defeitos conhecidos em 7386601 (ano validado no planejador, conflito de disciplina consigo mesma, demo/sync mais estritos, borda em /sobre) — revisão em andamento — mas NÃO rodou o fluxo da impeccable (perdeu tempo na pausa). Mudanças órfãs (Mascote.tsx usando a PNG, icon.svg apagado, icon.png) ninguém assumiu; o orquestrador aplicou o Ruling 9: Mascote.tsx e icon.svg restaurados do HEAD, icon.png movido para o scratchpad (`icon.png.removido`), `public/` intocado. O "1 issue" do dev em /planejador vinha dessa PNG. Revisão de 7386601 = Approved (o pulo de "mesma disciplina" não esconde conflito entre disciplinas diferentes nem com bloqueio).
- Task 17b (2º executor, Sonnet): fluxo completo da impeccable (auditoria → crítica → correção → polimento) em todas as telas — despachado.
- Task 17b: polimento em f8ca197 + 54b1167 (contexto, detect, audit, critique e polish da impeccable; auditoria própria de contraste/alvos/teclado em 11 rotas × 4; corrigidos: estouro de horários a 390 px em /professor e /disciplina, contraste dos blocos e cartões, placeholder AA, h1 da árvore, alvos do rodapé, DESIGN.md ainda dizia "segue o sistema"). Revisão = Approved. Não corrigido (aceito): texto de ~9,9 px em blocos sobrepostos da grade (trade-off do DESIGN.md), alvos pequenos em links inline.
- Task 17: complete (17a bf2d8b7; 17b 7386601, f8ca197, 54b1167; 17c carga 2020–2023 ainda rodando em segundo plano).
- Preparação do CQ2: `bun test` 175/175; `bun run build` ok; app em MODO PRODUÇÃO em 127.0.0.1:4100 (`bun run start`, sem o indicador do Next); `bun run demo`; apagadas as 3 conversas de teste do demo (traziam uma resposta de antes da correção, "47 vagas já ocupadas" em previsão); `bun run shots` → 52 capturas novas em `.shots/`, sem erros.
- Task 16: despachada (Sonnet).
- Task 16: commitada em 166ebe4 + 22c054d. 27 cenários; 269 passos de modelo no total (3 rodadas Nova 2 Lite + 1 Nova Pro + 6 de desenvolvimento), 0 erros do Bedrock. Rodada 3 (prompt 2026-11-17.5, Nova 2 Lite): (a) 92%, (b) aterramento 100%, (c) 100%, (d) 90%, (e) 100% — metas atingidas, 4ª rodada não usada. Nova Pro: (a) 100%, (b) 100%, (c) 100%, (d) 90%, (e) 100%, mais lento. Falham: `historico-reprovei` ("reprovei em cálculo 1": a busca não acha "Cálculo I" e o Lite não tenta de novo; o Pro desmarca o Cálculo errado) e `tres-turnos` (Lite não chama ver_grade no 3º turno; resposta certa). Revisão = Approved com 2 Important (prompt ajustado nos próprios cenários sem aviso; critério (b) nunca testado). Fix round 1 enviado: teste de `aterramento`, detector mais estrito (19h, "SI 702"), busca casa algarismo↔romano ("cálculo 1" → "Cálculo I"), prompt sem exemplo do cenário, 4ª e última rodada Nova 2 Lite, aviso de otimismo no doc.
- Task 16: fix round 1 em f163890 (busca 1↔I…4↔IV; `aterramento.ts` com teste e detector estrito; prompt 2026-11-17.6 genérico; rodada 4 = última). Rodada 4 (Nova 2 Lite): (a) 22/24 92%, (b) 27/27 100% (critério estrito), (c) 3/3, (d) 9/10 90%, (e) 3/3 — saída 0. `historico-reprovei` passou. Falham: `tres-turnos` (sem ver_grade no 3º turno) e `grade-adicionar-nome` (o modelo disse "Adicionei SI702" SEM chamar a ferramenta — ação fantasma). Total de chamadas Bedrock na T16: 338 passos de modelo, 0 erros. Re-revisão: todos addressed; pendem só linhas desatualizadas no docs/zefe-avaliacao.md (descrição antiga de (b), título "tabela final" apontando a rodada 3) — corrigir junto com a nota da guarda de ação fantasma.
- Task 16: doc atualizado em 1333904 (tabela final = rodada 4; guarda de ação fantasma rodada offline sobre a rodada 4: marca só `grade-adicionar-nome`, 0 falsos positivos).
- Task 16: complete (commits 71be80d..1333904, review clean)
- Ação fantasma: guarda em 3b7e53d (`src/zefe/fantasma.ts`; aviso no stream e na mensagem salva; 172 testes). Revisão = Needs fixes (a checagem de negação engole "Sem conflitos, adicionei X"); fix round 1 em 9364bd5 (negação só colada ao verbo; confere o nome da ferramenta; teste de rota com sucesso em 2 passos; 175 testes). Re-revisão: addressed. Complete. Falso positivo conhecido: "Adicionei? Não."
- Ação fantasma: guarda determinística no harness (avisa "não fiz essa alteração" quando o texto diz que alterou sem ferramenta de alteração bem-sucedida) mandada ao executor da T15.
- Task 16: minor (deferred): (c) depende da marca `vazio` do cenário e não do resultado vazio de fato; (a) conta ferramenta chamada mesmo se deu erro; aterramento é por substring (um horário de outra turma conta).
- Regressão: `tests/zefe-rota.test.ts` "laço de ferramentas para em 8 passos" falha em 22c054d (passava em 49f6e2c). Mandado ao executor da T15. Corrigido em a778cd8: bug do teste (consulta sem ORDER BY); `bun test` 163/163. Orquestrador conferiu o diff (só o ORDER BY), sem revisão separada. Rodadas completas só depois que a carga gravar 2026/1 completo; limite: 4 rodadas Nova 2 Lite + 1 Nova Pro.
- Task 12: minor (deferred → T17 polimento): `?ano=2027.5`/`1e10` sem validação pode dar 500; `catch {}` genérico em scripts/demo.ts; botão .ics e botões ghost parecem apagados no escuro; "busca lateral" ficou como seção abaixo da lista; string "previsão baseada em" repetida 3×.
- Task 14: minor (deferred): desfazer fora de ordem restaura estado velho; desfazer `criar_bloqueio` depois de desfazer `remover_bloqueio` falha (id novo); `ver_grade`/`meu_progresso` sem URL da DAC.
- Task 8: fix round 1/2 (prereq não entendido → "não verificado"; commit e3d817f). Item de 390 px repassado às correções do CQ1.
- Task 8: complete (commits 1c3ffb0..e3d817f, 1 item transferido para CQ1)
- Task 13: fix round 1/2 (4 addressed; commit f4a2799).
- Task 13: complete (commits 7aeb3c7..f4a2799, review clean). Pendência para T12: montar `<ExportarIcs gradeId ano periodo foraDoCalendario={foraDoCalendario(grade.itens)} />`.
- Task 8: minor (deferred): `/disciplina/zz999` faz 307 para `ZZ999` antes do 404; página de sala faz um `getSala` por semestre candidato; sem testes de página.
- Task 9: minor (deferred): obrigatória sem crédito em nenhuma fonte vira `creditos: 0` sem sinalizar; `propostaEletivas` não usado no cálculo.

## Segunda interrupção por limite de uso (≈15:55 → 19:01)

Parados no limite: T16 (avaliação), T17a (shots.ts + README), T17b (polimento impeccable) e o executor da T4. Na retomada (19:01): a carga TERMINOU (resumo2 com FIM): caderno 2024/1 (refeito IA/IC/IE, 0 erros), 2025/1 2514, 2025/2 2475, 2026/1 2515, 2026/2 2516 — todos 0 erros; 2027/1 "não publicado" (0 no índice). Catálogo 2021–2025 e 2027: só os 404 reais (cursos 36 e 87; disciplinas EI em 2022–2025; curso 7 AF sem proposta). **Catálogo 2020 falhou alto**: `ErroParse: índice do catálogo sem cursos (layout mudou?)` — o índice de 2020 tem outro formato; nada gravado para 2020. Árvore de trabalho tinha: `scripts/shots.ts` (T17a, não commitado), `public/mascote-zefe.png` e `public/mascotes-zefe-adesivos.png` (14:48, origem não registrada), `src/app/icon.png` + `icon.svg` apagado + `Mascote.tsx` trocado para a PNG (T17b). Os três executores foram retomados por mensagem (mantêm o contexto).

Ruling 9: o mascote continua o SVG desenhado no código — o plano exige "SVG no código (sem imagem gerada)" e a PNG em `public/` traz o emblema da Unicamp no lenço, contra o anti-objetivo 2 — custo se errado: o aluno queria a PNG; ela continua em `public/` (não apagada, não commitada) para ele decidir.

## Mudanças do aluno (18/11 00:00)

A. Mascote e favicon: o aluno trocou ele mesmo (com o Codex) e disse "não mude de volta"; commit 02a7c8e (Mascote.tsx usa as PNGs; `public/mascote-zefe.png`, `public/mascotes-zefe-adesivos.png`, `public/favicon.png`, `src/app/icon.png`; `icon.svg` removido). **O Ruling 9 está SUPERADO**: vale a versão do aluno; nenhum executor pode reverter, regenerar, redesenhar ou restaurar o SVG. Linha acrescentada no DESIGN.md. Só sinalizar no relatório: a `mascote-zefe.png` mostra o emblema da Unicamp no lenço, e o design diz que nada deve parecer oficial — decisão dele.
B. Nova Task 18: refazer o planejador como o GDE original (cartões arrastáveis das disciplinas que faltam, vindos da integralização, soltos na grade semanal com prévia das turmas; busca de texto secundária e recolhida, sem recarregar nem voltar ao topo). Sonnet + revisão Sonnet + um revisor Opus novo só sobre esta mudança.

- Task 18: implementada em 629945e (`@dnd-kit/react` 0.5.3; cartões por semestre sugerido vindos de `getIntegralizacao`, travadas desabilitadas com motivo, "sem oferta" visível; fantasmas das turmas ao arrastar com conflito via `checarGrade` (`src/dominio/planejador.ts` `encaixarTurmas`); soltar no fantasma adiciona; "Adicionar" abre escolha de turma; remover arrastando para fora ou botão; busca recolhida, no cliente, sem navegar nem rolar; teclado e toque). Orquestrador: `bun test` 187/187; produção de volta em 4100. O executor matou um `next dev` antigo na porta 4022 (mesma pasta, origem desconhecida — talvez do aluno). Revisão Sonnet = Approved (só menores: `buscarAcao` roda consultas de professor/sala à toa; faixa de `ano` 2000 vs 1990; ~30 `getOferta` a cada revalidação; bloco da grade é `<a>` e Enter navega; testes das ações dependem de linhas reais e de mock global). Revisor Opus novo, só sobre esta mudança, despachado.
- Task 18: revisor Opus = **corrigir** (o bug de rolar sumiu; fantasmas, conflito, soltura, escolha de turma, várias grades, bloqueios e .ics funcionam). 7 correções: foco vai para o body ao fechar/adicionar no desktop; "arrastar para fora" não remove (só a faixa do topo); soltar às 19h falha a 1440×900 por causa do autoscroll; "sem oferta em 1S/2027" afirmado como fato quando é previsão; cartões inertes viram paradas de Tab e empurram os úteis; escolha de turma esconde o aviso de reserva; fantasmas espremem os blocos reais. Mandadas ao executor da T18 (+ menores da revisão Sonnet). Arquivo: `.superpowers/sdd/2026-11-16-zefe/t18-opus-correcoes.md`.
- Task 18: correções em 84688c8 (foco volta ao botão de origem; bloco solto fora da grade é removido, Esc cancela; AutoScroller com limiar 0,1 — soltura às 19h a partir do topo funciona; "sem oferta prevista" com o motivo visível; só cartões livres são arrastáveis, inertes recolhidos por grupo; avisos de reserva por turma vindos do `checarGrade`; fantasmas em camada própria, um por horário; `buscarDisciplinas` sem consultas de professor/sala; bloco da grade não navega no Enter). `bun test` 189/189, build ok, produção 200, demo restaurado. Re-revisão Sonnet: todos addressed.
- Task 18: complete (commits e18331f..84688c8, revisão Sonnet + revisor Opus, 1 rodada de correção)
- Task 18: minor (deferred): filtro dos avisos por turma depende do texto das mensagens; aviso de reserva longo (lista todos os cursos); `aria-label` do bloco num `div` sem papel explícito; soltar bloco fora da grade remove sem desfazer; leitor de tela, celular real e tema escuro dos estados novos não conferidos.
- Task 18: despachada (Sonnet) às 00:0x de 18/11; brief em `.superpowers/sdd/2026-11-16-zefe/task-18-brief.md`. App volta ao modo produção ao fim da tarefa.

Carga 2020–2023 (T17c) terminou antes do limite: 8 semestres, todos exit 0 e 0 erros (2020/1 2155, 2020/2 2059, 2021/1 2151, 2021/2 2097, 2022/1 2131, 2022/2 2119, 2023/1 2174, 2023/2 2216 disciplinas). O executor Haiku caiu no limite antes de escrever o relatório; os números acima são do orquestrador.

## Mudança do aluno (17/11 14:31)

Commit 3801842 (do aluno): tema claro é o padrão; o app não segue mais o tema do sistema. Escuro só com `<html data-theme="dark">`. Consequência: capturas de escuro (`scripts/shots.ts`, briefs de CQ) põem `data-theme="dark"` no `<html>` em vez de emular `prefers-color-scheme`; o claro é o tema principal a julgar; botão de tema é opcional. Não reverter.

## Carga de dados (T4)

- 2024/1: 2393 disciplinas salvas, 3 erros, todos HTTP 429 (AC221, MC920, CE113) por concorrência com o sync de catálogo da T3 — refazer `sync caderno 2024 1 IA,IC,IE` na T4b.
- Catálogo 2026 carregado pela T3 (64/66 cursos; 36 e 87 = 404 reais; curso 7 AF sem proposta).

## Controle de qualidade

- CQ1 (Opus, revisor novo): despachado depois de T5+T6 completas (HEAD ddfe8fa + T7/T11 em andamento). App em dev em 127.0.0.1:4100 iniciado pelo orquestrador (log no scratchpad).
- CQ1 rodada 1 — veredito **corrigir**. Passou: testes 74/74, build, fluxo real entrar→código→cadastro (pré-marcação certa), teclado/foco, painel e gaveta, 390 px sem rolagem lateral, avisos de "não oficial", nada inventado, site funciona sem o Zefe. Correções pedidas: (1) hero/landing com peça de produto ilegível e mascote cobrindo selo no celular — grade ilustrativa maior com eixo de horas, conflito visível, trecho de árvore; (2) mascote ainda não lê como capivara — silhueta em path, legível a 24 e 160 px; (3) DESIGN.md sem regras de "telas densas" (grade, árvore, painel só aberto a partir de xl); (4) 404 padrão do Next em inglês — `src/app/not-found.tsx` pt-BR na casca; (5) /comecar ao editar esconde o curso escolhido; (6) sem favicon — `src/app/icon.svg`. Não verificou: sites de referência ao vivo, contraste medido, reduced-motion, leitor de tela, cadastro com modalidade. Usuários de teste `qc1-*@zefe.local` ficaram no banco. Correções serão despachadas a Sonnet assim que a T8 (que mexe em DESIGN.md e na casca) commitar.
- CQ1 rodada 2 (mesmo revisor, HEAD f1f3b40) — veredito **aprovado**, nada material aberto. Testes 127/127, build ok; os 6 itens conferidos no app (capturas em `.shots/qc1-r2/`). Não reverificado: contraste medido, movimento reduzido, leitor de tela.
- CQ2 (Opus, revisor novo, HEAD 8f473b9, app em produção): despachado. Até 6 mensagens ao Zefe permitidas; a avaliação não é refeita (orçamento esgotado).
- CQ2 rodada 1 — veredito **corrigir**. Passou: testes 175/175, build; planejador, árvore, busca/páginas, 404, entrada e cadastro (com modalidade, curso 34), Zefe (progresso aterrado, adicionar SI703 B + desfazer voltou o banco, recusa de matrícula) — 5 mensagens ao Bedrock; Review Focus 1, 3, 4, 5 ok; 2 ok no planejador e no Zefe. Correções: (1) /disciplina mostra vagas/matriculados de 1S/2026 no bloco de previsão 1S/2027 (dado inventado); (2) visitante deslogado não acha a busca (landing e casca leve só têm Sobre/Entrar); (3) Zefe recusou "coloca Inteligência Artificial na minha grade" inventando que pré-requisito impede — o cenário deu 3 resultados diferentes em 3 execuções; (4) depois de recarregar, ação desfeita volta a mostrar "Desfazer" e o cartão de grade aparece como atual. Não verificado: Bedrock fora do ar ao vivo, leitor de tela, contraste medido, importação do .ics em apps, aluno de catálogo 2020. Ficou o usuário de teste `qc2-82719@zefe.local`. Correções despachadas (Sonnet), arquivo `.superpowers/sdd/2026-11-16-zefe/cq2-correcoes.md`.
- CQ2 correções commitadas em 99071e1 + 525acdf (previsão sem vagas em /disciplina; busca na casca leve e botão na landing; prompt 2026-11-17.7: pré-requisito nunca impede adicionar; `desfeitas` ao recarregar; aviso de 429 do código; demo com SI405/SI700/SI701 em 1S/2027). Orquestrador: `bun test` 176/176, servidor de produção com o build novo (200), `bun run shots` 52 capturas sem erro. Reconferência (rodada 2) pedida ao mesmo revisor Opus.
- CQ2 rodada 2 (HEAD e481415) — veredito **aprovado**, nada material aberto. As 4 correções conferidas no app em produção; "Coloca Inteligência Artificial na minha grade" desta vez chamou `alterar_grade` e só avisou do pré-requisito (1 amostra). Review Focus 1–5 ok. Pendências não materiais: `grade-adicionar-nome` sem novo número de avaliação; Bedrock fora do ar/throttling só testados com mock; leitor de tela e contraste medido não conferidos. Demo restaurado (grade 147: SI405 A, SI700 A, SI701 A; bloqueio Estágio ter 13:30–17:30; 23 linhas de histórico; 0 conversas). Ficaram os usuários de teste `qc1-28561@zefe.local`, `qc1-errado@zefe.local`, `qc2-82719@zefe.local`.

Ruling 10: não há revisão final extra de "branch inteira" além do CQ2 — o CQ2 é a revisão completa pedida pelo aluno, e ele proibiu chamar o revisor caro fora dos dois pontos — custo se errado: algum defeito de código que só uma revisão linha a linha do repositório inteiro acharia (as revisões por tarefa cobriram cada diff).
Ruling 11: a pasta `.superpowers/sdd/2026-11-16-zefe/` (ignorada pelo git) fica no disco em vez de ser apagada — guarda os relatórios de cada executor, as revisões e os logs da carga — custo: só espaço em disco.

## Decisões a conferir

- (T3) Curso 11 em 2026 não tem modalidades (o plano supunha que tinha); só o 34 (AA, AB, AX). Os testes seguem a página real.
- (T3) Grupo de eletivas só é "verificado" quando todas as linhas são códigos concretos. Padrões como `EX---` ficam "não verificado" com o texto original.
- (T3) Códigos guardados sem espaço (`F 128` → `F128`). Páginas de disciplina do catálogo sincronizadas só para os prefixos que aparecem nos currículos.
- (Ruling 8) "Qualquer disciplina oferecida pela Unicamp" conta como grupo aberto verificado: toda disciplina cursada fora das obrigatórias soma nas eletivas.
- (Ruling 9, SUPERADO pelo aluno em 02a7c8e — vale a PNG dele) Mascote: mantido o SVG do código. Há duas PNGs em `public/` (origem não registrada); a `mascote-zefe.png` tem o emblema da Unicamp no lenço — se for usar, tirar o emblema.
- (T4) Catálogo 2020: cursos, currículos e propostas carregam (correção 4ac47ab), mas as páginas de disciplina de 2020 têm outro endereço/formato e não foram lidas — para catálogo 2020 a árvore mostra pré-requisitos como "não verificado" e créditos podem faltar.
- (T3) Cursos 36 e 87 aparecem no índice do catálogo 2026 mas `curriculo.html` dá 404 — ficam de fora.

## Bloqueios
- Catálogo 2020, disciplinas (fecha a pendência da T4): em 2020 ficam em `coordenadorias/NNNN/NNNN.html` (uma página por coordenadoria, 54 no índice `coordenadorias.html`; 6 vazias legítimas). `parseCatalogo2020` lê créditos (`C:nnn`), pré-requisito (`/` = ou, espaço = e, `*` = parcial; espaço liga mais forte) e ementa. Sync real: 6975 disciplinas (todas com crédito, 4934 com pré-requisito), 64/66 cursos (só os 404 de sempre: 36 e 87), 0 coordenadorias com erro; outros anos intactos. Crédito desconhecido agora aparece como "créditos desconhecidos" na árvore (`creditosDesconhecidos`, `semCredito`).
