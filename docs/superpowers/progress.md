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

## Tarefas

(uma linha por tarefa: estado, commits, o que foi verificado, pendências)

- Task 1: implementada (Haiku) em 1689f37; orquestrador conferiu `bun test` 1/1 e `bun run build` ok; revisão Sonnet em andamento. Versões: next 16.4.6, react 19.3.0, drizzle-orm 0.45.4, drizzle-kit 0.31.11, tailwind 4.3.3, postgres.js 4.1.1. `bun test` não lê `.env.local` → `tests/setup.ts` define DATABASE_URL local. `ZEFE_LIBERADOS` preenchido em `.env.local` pelo orquestrador.
- Task 1: complete (commits 07eb41e..1689f37, review clean)
- Task 1: minor (deferred): `src/db/index.ts` cria o cliente postgres no escopo do módulo — guardar em `globalThis` para o HMR do `next dev` não vazar conexões (levar para T6/T8).
- Task 1: minor (deferred): chave morta `ignoreScripts` no package.json; AGENTS.md gerado pelo Next foi commitado.
- Task 2: implementada (Sonnet) em d2bcf0a; orquestrador conferiu `bun test` 18/18 e build ok; sync real 2026/1 FT = 209 oferecimentos, 0 erros. Revisão Sonnet em andamento.
- Task 4a (carga do caderno 2024/1–2027/1): despachada (Haiku), em segundo plano; logs em `.superpowers/sdd/2026-11-16-zefe/carga/`.
- Task 3: despachada (Sonnet). Task 5: despachada (Sonnet + impeccable) em paralelo com T3.

7. Ruling: T3 e T5 rodam em paralelo (arquivos disjuntos: `src/dac`/`scripts`/`tests` × `src/app`/`src/components`/docs de design), cada um faz `git add` só dos próprios arquivos — a noite é curta e a carga de dados também corre em paralelo — custo se errado: conflito em package.json/bun.lock, resolvível.

## Carga de dados (T4)

## Controle de qualidade

## Decisões a conferir

## Bloqueios
