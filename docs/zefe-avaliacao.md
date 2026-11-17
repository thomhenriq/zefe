# Avaliação do assistente (Zefe)

Data: 2026-11-17. Comando: `bun run zefe:avaliar` (`--so <id>` roda um cenário; `--saida arquivo.json` grava o resultado). Roda os 27 cenários de `src/zefe/cenarios.ts` no Bedrock de verdade (us-east-1), com o prompt, as ferramentas e o harness reais (`responderCompleto`), no usuário `demo-zefe` e nos dados sincronizados (cadernos 2024/1 a 2026/2; 1S/2027 não publicado, então vira previsão). Cada cenário parte do estado do demo, usa uma conversa nova e restaura grade, bloqueios e histórico ao terminar.

Critérios: (a) ferramentas esperadas chamadas; (b) aterramento (todo `HH:MM`, sala e código no texto final aparece em algum resultado de ferramenta da execução ou na pergunta; o regex pega 1–3 letras + 2–3 dígitos, então cobre códigos e salas); (c) resultado vazio, resposta com "não encontrei" ou equivalente e sem horário; (d) alteração, banco mudou como esperado; (e) fora de escopo, nenhuma ferramenta de alteração; (f) informativo: previsão rotulada como "previsão". Meta: (b) 100%, demais 90% dos cenários aplicáveis.

## Resultado por rodada

| Rodada | Prompt | Modelo | (a) | (b) | (c) | (d) | (e) | (f, info) |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-17.3 | Nova 2 Lite | 20/24 83% | 27/27 100% | 3/3 | 7/10 70% | 3/3 | 2/2 |
| 2 | 2026-11-17.4 | Nova 2 Lite | 21/24 88% | 27/27 100% | 3/3 | 8/10 80% | 3/3 | 2/2 |
| 3 | 2026-11-17.5 | Nova 2 Lite | 22/24 92% | 27/27 100% | 3/3 | 9/10 90% | 3/3 | 2/2 |
| comparação | 2026-11-17.5 | Nova Pro | 24/24 100% | 27/27 100% | 3/3 | 9/10 90% | 3/3 | 2/2 |

A rodada 3 atingiu todas as metas (saída 0); a 4ª rodada não foi necessária. Passos de modelo por rodada: 65, 67, 68 e 63 (mais 6 em dois testes de desenvolvimento); latência mediana por cenário ~2,7 s (Lite) e ~3,2 s (Pro); nenhum erro do Bedrock.

## O que mudou entre rodadas
- 1 para 2 (prompt .4): pré-requisito faltando não impede pôr na grade (só avisar); "reprovei/não fiz" usa `marcar_historico` com `nao_fiz`; remover bloqueio pelo nome via `ver_grade` (sem pedir id); ver_grade antes de falar de conflito. `buscar_disciplinas` passou a devolver `noHistorico` (cursada/cursando) para escolher entre códigos de mesmo nome.
- 2 para 3 (prompt .5): só dizer que alterou depois de chamar a ferramenta (na rodada 2 o modelo disse "Adicionei SI702" sem chamar `alterar_grade`); tentar de novo a busca só com a palavra principal; descrições de `buscar_disciplinas` ("calculo", não "cálculo 1") e `ver_grade` (sempre que perguntarem de conflito).

## Tabela da rodada final (Nova 2 Lite, prompt 2026-11-17.5)

| Cenário | a | b | c | d | e | passos | ms |
|---|---|---|---|---|---|---|---|
| horario-ia-2027 | ok | ok | - | - | - | 2 | 3088 |
| horario-nome | ok | ok | - | - | - | 4 | 4236 |
| horario-ano-explicito | ok | ok | - | - | - | 2 | 1855 |
| janela-ter-noite | ok | ok | - | - | - | 2 | 2786 |
| janela-sex-manha | ok | ok | - | - | - | 2 | 2196 |
| janela-vazia | ok | ok | ok | - | - | 2 | 2049 |
| prereq-codigo | ok | ok | - | - | - | 2 | 2586 |
| prereq-nome | ok | ok | - | - | - | 4 | 4766 |
| progresso-falta | ok | ok | - | - | - | 2 | 2346 |
| progresso-creditos | ok | ok | - | - | - | 2 | 2229 |
| grade-adicionar | ok | ok | - | ok | - | 4 | 4039 |
| grade-adicionar-nome | ok | ok | - | ok | - | 5 | 5758 |
| grade-remover | ok | ok | - | ok | - | 3 | 3171 |
| grade-trocar | ok | ok | - | ok | - | 4 | 4175 |
| historico-reprovei | FALHA | ok | - | FALHA | - | 2 | 1962 |
| historico-cursei | ok | ok | - | ok | - | 3 | 3353 |
| bloqueio-criar | ok | ok | - | ok | - | 2 | 2715 |
| bloqueio-criar-dia | ok | ok | - | ok | - | 2 | 1658 |
| bloqueio-remover | ok | ok | - | ok | - | 3 | 2757 |
| inexistente-codigo | ok | ok | ok | - | - | 2 | 1980 |
| inexistente-nome | ok | ok | ok | - | - | 2 | 2100 |
| nao-publicado | ok | ok | - | - | - | 2 | 2209 |
| codigo-errado | ok | ok | - | - | - | 2 | 1844 |
| fora-matricula | - | ok | - | - | ok | 1 | 962 |
| fora-tcc | - | ok | - | - | ok | 1 | 1331 |
| fora-receita | - | ok | - | - | ok | 1 | 957 |
| tres-turnos | FALHA | ok | - | ok | - | 5 | 5808 |

(nao-publicado e horario-ia-2027 também passaram em (f).)

## Cenários que ainda falham (sem maquiar)
- **historico-reprovei** ("Reprovei em cálculo 1."), Nova 2 Lite: só chamou `buscar_disciplinas` e respondeu: "Não encontrei "cálculo 1" no catálogo. Tente usar só "calculo" ou o código da disciplina, se você souber." Nenhuma alteração. Nas três rodadas o modelo não tenta de novo a busca com "calculo", apesar do prompt e da descrição. Nova Pro chamou `marcar_historico`, mas desmarcou o "Cálculo I" errado (outro código, não o EB101 do histórico do demo): "Removi a marca de "Cálculo I" do seu histórico." (falha (d)).
- **tres-turnos** (3º turno, "E deu conflito com alguma coisa?"), só Nova 2 Lite: não chamou `ver_grade`; respondeu a partir da checagem que `alterar_grade` já devolvera ("Sua grade tem conflitos de horário entre EB101 e EB203 (segunda das 19:00 às 23:00) e entre EB101 e EB204..."). A resposta está correta e aterrada; falha só (a), por não chamar a ferramenta esperada. Nova Pro passa.

## Comparação com Nova Pro
Nova Pro (1 rodada, prompt .5): (a) 100% contra 92%; mesmas taxas nos demais critérios; aterramento 100% nos dois. Mais lenta (mediana ~3,2 s contra ~2,7 s) e usou menos passos no total (63 contra 68). O único erro de Pro é de julgamento (desmarcou a disciplina errada de mesmo nome); o de Lite é de não persistir na busca. Nenhum dos dois citou horário, sala ou código sem fonte.

## Ressalvas
- 27 cenários, um modelo por vez, temperatura 0,2: taxas com amostra pequena (um cenário = 4% a 10%). Não foi medido o quanto os resultados variam entre execuções iguais.
- (c) e (b) são verificações de texto: o regex de aterramento não pega horários escritos como "14h" nem nomes de professor.
- Os cenários dependem de fatos do banco atual (SI703/SI704 com turmas A e B; nada no sábado às 22h; demo com EB101 cursada).
