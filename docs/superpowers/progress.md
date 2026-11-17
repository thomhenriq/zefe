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
- Task 5: minor (deferred): cópia da landing promete "4 perguntas e árvore preenchida" antes de T6/T10 existirem (fica verdadeiro depois); busca duplicada no topo e na barra inferior; sem botão de tema (segue o sistema).

7. Ruling: T3 e T5 rodam em paralelo (arquivos disjuntos: `src/dac`/`scripts`/`tests` × `src/app`/`src/components`/docs de design), cada um faz `git add` só dos próprios arquivos — a noite é curta e a carga de dados também corre em paralelo — custo se errado: conflito em package.json/bun.lock, resolvível.

## Carga de dados (T4)

- 2024/1: 2393 disciplinas salvas, 3 erros, todos HTTP 429 (AC221, MC920, CE113) por concorrência com o sync de catálogo da T3 — refazer `sync caderno 2024 1 IA,IC,IE` na T4b.
- Catálogo 2026 carregado pela T3 (64/66 cursos; 36 e 87 = 404 reais; curso 7 AF sem proposta).

## Controle de qualidade

## Decisões a conferir

- (T3) Curso 11 em 2026 não tem modalidades (o plano supunha que tinha); só o 34 (AA, AB, AX). Os testes seguem a página real.
- (T3) Grupo de eletivas só é "verificado" quando todas as linhas são códigos concretos. Padrões como `EX---` ficam "não verificado" com o texto original.
- (T3) Códigos guardados sem espaço (`F 128` → `F128`). Páginas de disciplina do catálogo sincronizadas só para os prefixos que aparecem nos currículos.
- (Ruling 8) "Qualquer disciplina oferecida pela Unicamp" conta como grupo aberto verificado: toda disciplina cursada fora das obrigatórias soma nas eletivas.
- (T3) Cursos 36 e 87 aparecem no índice do catálogo 2026 mas `curriculo.html` dá 404 — ficam de fora.

## Bloqueios
