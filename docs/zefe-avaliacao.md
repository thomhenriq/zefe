# Avaliação do assistente (Zefe)

Data: 2026-11-17. Comando: `bun run zefe:avaliar` (`--so <id>` roda um cenário; `--saida arquivo.json` grava o resultado). Roda os 27 cenários de `src/zefe/cenarios.ts` no Bedrock de verdade (us-east-1), com o prompt, as ferramentas e o harness reais (`responderCompleto`), no usuário `demo-zefe` e nos dados sincronizados (cadernos 2024/1 a 2026/2; 1S/2027 não publicado, então vira previsão). Cada cenário parte do estado do demo, usa uma conversa nova e restaura grade, bloqueios e histórico ao terminar.

Critérios: (a) ferramentas esperadas chamadas; (b) aterramento (todo horário, sala e código no texto final aparece em algum resultado de ferramenta da execução ou na pergunta; horários `HH:MM`, `19h` e `14h30`; códigos e salas de 1–3 letras + 2–3 dígitos, também como `SI 702`, `SI-702` e `SI702A`; texto vazio não conta; ver `src/zefe/aterramento.ts`. Nas rodadas 1 a 3 valia a versão antiga, só `HH:MM` e letras+dígitos colados); (c) resultado vazio, resposta com "não encontrei" ou equivalente e sem horário; (d) alteração, banco mudou como esperado; (e) fora de escopo, nenhuma ferramenta de alteração; (f) informativo: previsão rotulada como "previsão". Meta: (b) 100%, demais 90% dos cenários aplicáveis.

## Resultado por rodada

| Rodada | Prompt | Modelo | (a) | (b) | (c) | (d) | (e) | (f, info) |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-17.3 | Nova 2 Lite | 20/24 83% | 27/27 100% | 3/3 | 7/10 70% | 3/3 | 2/2 |
| 2 | 2026-11-17.4 | Nova 2 Lite | 21/24 88% | 27/27 100% | 3/3 | 8/10 80% | 3/3 | 2/2 |
| 3 | 2026-11-17.5 | Nova 2 Lite | 22/24 92% | 27/27 100% | 3/3 | 9/10 90% | 3/3 | 2/2 |
| 4 | 2026-11-17.6 | Nova 2 Lite | 22/24 92% | 27/27 100% (critério (b) mais estrito) | 3/3 | 9/10 90% | 3/3 | 2/2 |
| comparação | 2026-11-17.5 | Nova Pro | 24/24 100% | 27/27 100% | 3/3 | 9/10 90% | 3/3 | 2/2 |

As rodadas 3 e 4 atingiram todas as metas (saída 0). A rodada 4 foi a última permitida; Nova Pro rodou uma vez, na versão .5 do prompt e com o critério (b) antigo. Passos de modelo por rodada: 65, 67, 68 e 63 (mais 6 em dois testes de desenvolvimento); latência mediana por cenário ~2,7 s (Lite) e ~3,2 s (Pro); nenhum erro do Bedrock.

## O que mudou entre rodadas
- 1 para 2 (prompt .4): pré-requisito faltando não impede pôr na grade (só avisar); "reprovei/não fiz" usa `marcar_historico` com `nao_fiz`; remover bloqueio pelo nome via `ver_grade` (sem pedir id); ver_grade antes de falar de conflito. `buscar_disciplinas` passou a devolver `noHistorico` (cursada/cursando) para escolher entre códigos de mesmo nome.
- 2 para 3 (prompt .5): só dizer que alterou depois de chamar a ferramenta (na rodada 2 o modelo disse "Adicionei SI702" sem chamar `alterar_grade`); tentar de novo a busca só com a palavra principal; descrições de `buscar_disciplinas` ("calculo", não "cálculo 1") e `ver_grade` (sempre que perguntarem de conflito).

## Tabela da rodada 3 (Nova 2 Lite, prompt 2026-11-17.5), histórico

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
- (c) e (b) são verificações de texto: o aterramento não confere nomes de professor, nem afirmações sem dado (ex.: dizer que alterou sem chamar a ferramenta).
- Os cenários dependem de fatos do banco atual (SI703/SI704 com turmas A e B; nada no sábado às 22h; demo com EB101 cursada).

## Rodada 4 (correção após revisão)
- **Busca**: `buscar` agora trata número e romano como equivalentes (1/I, 2/II, 3/III, 4/IV, palavra inteira), então "cálculo 1" acha "Cálculo I" (testes em tests/busca.test.ts). Com isso o prompt (.6) e a descrição de `buscar_disciplinas` voltaram a ser genéricos ("se não achar, tente só a palavra principal"), sem exemplo ligado ao cenário. Resultado: **historico-reprovei passou** (marcou EB101 como não feito).
- **Critério (b) mais estrito** (`src/zefe/aterramento.ts`, com teste em tests/zefe-aterramento.test.ts, que cobre invenção e aterrado): também pega horários "19h" e "14h30", códigos "SI 702", "SI-702" e "SI702A" (normalizados antes de comparar) e texto vazio não conta como aterrado. Na rodada 4, (b) segue em 27/27 com o critério estrito. O JSON da rodada 3 não guardou os resultados das ferramentas, então não deu para repontuar a rodada 3 offline; só dá para dizer que, nos textos truncados dela, "21h/23h" e "14h/18h" apareceram em 2 cenários. O JSON da rodada 4 já guarda `fonte` e `textos` para repontuar. Na rodada 4, 1 texto usou formato "NNh" e nenhum usou "SI 702".
- **Falhas restantes (Nova 2 Lite, rodada 4)**:
  - **grade-adicionar-nome** ("Coloca Inteligência Artificial na minha grade."): voltou a falhar, embora tenha passado na rodada 3. O modelo não chamou `alterar_grade` e respondeu "Adicionei Inteligência Artificial (SI702) turma A na sua grade. Falta o pré-requisito SI201." Isso é afirmar uma ação que não fez, apesar da regra do prompt. O critério (b) não detecta isso; só (a)/(d).
  - **tres-turnos**: igual à rodada 3 (3º turno sem `ver_grade`).
- **Variância**: a mesma versão de prompt/modelo oscila de uma execução para outra (grade-adicionar-nome passou na rodada 3, falhou na 4), então diferenças de um cenário entre rodadas são ruído.

## Ressalva importante sobre as taxas
O prompt e as descrições foram ajustados olhando para estes mesmos 27 cenários, e os fatos dos cenários vieram do mesmo banco. Não há conjunto separado de validação: as taxas das rodadas 2 a 4 são otimistas e não estimam o desempenho com perguntas novas de alunos reais.

## Tabela da rodada final: rodada 4 (Nova 2 Lite, prompt 2026-11-17.6)

| Cenário | a | b | c | d | e | passos | ms |
|---|---|---|---|---|---|---|---|
| horario-ia-2027 | ok | ok | - | - | - | 2 | 3410 |
| horario-nome | ok | ok | - | - | - | 4 | 4285 |
| horario-ano-explicito | ok | ok | - | - | - | 2 | 2000 |
| janela-ter-noite | ok | ok | - | - | - | 2 | 2580 |
| janela-sex-manha | ok | ok | - | - | - | 2 | 2322 |
| janela-vazia | ok | ok | ok | - | - | 2 | 2353 |
| prereq-codigo | ok | ok | - | - | - | 2 | 2103 |
| prereq-nome | ok | ok | - | - | - | 4 | 4146 |
| progresso-falta | ok | ok | - | - | - | 2 | 2689 |
| progresso-creditos | ok | ok | - | - | - | 2 | 2168 |
| grade-adicionar | ok | ok | - | ok | - | 4 | 4049 |
| grade-adicionar-nome | FALHA | ok | - | FALHA | - | 5 | 5136 |
| grade-remover | ok | ok | - | ok | - | 3 | 2939 |
| grade-trocar | ok | ok | - | ok | - | 4 | 4392 |
| historico-reprovei | ok | ok | - | ok | - | 3 | 3445 |
| historico-cursei | ok | ok | - | ok | - | 3 | 2786 |
| bloqueio-criar | ok | ok | - | ok | - | 2 | 2703 |
| bloqueio-criar-dia | ok | ok | - | ok | - | 2 | 1901 |
| bloqueio-remover | ok | ok | - | ok | - | 3 | 2813 |
| inexistente-codigo | ok | ok | ok | - | - | 2 | 1885 |
| inexistente-nome | ok | ok | ok | - | - | 2 | 2196 |
| nao-publicado | ok | ok | - | - | - | 2 | 1908 |
| codigo-errado | ok | ok | - | - | - | 2 | 1936 |
| fora-matricula | - | ok | - | - | ok | 1 | 1001 |
| fora-tcc | - | ok | - | - | ok | 1 | 1334 |
| fora-receita | - | ok | - | - | ok | 1 | 1272 |
| tres-turnos | FALHA | ok | - | ok | - | 5 | 6298 |

(nao-publicado e horario-ia-2027 também passaram em (f).) Falhas: grade-adicionar-nome e tres-turnos, descritas acima.

## Guarda determinística contra "ação fantasma" (depois da rodada 4)
Depois da rodada 4 o harness ganhou uma guarda (commit 3b7e53d, `src/zefe/fantasma.ts`, `acaoFantasma`): se o texto diz em primeira pessoa e no passado que alterou algo ("adicionei", "removi"...) mas nenhuma ferramenta de alteração teve sucesso, acrescenta "Atenção: eu não fiz essa alteração...". Ela **não foi remedida com o Bedrock** (as rodadas acabaram). Rodada offline sobre o JSON da rodada 4 (textos e a lista de ferramentas; sucesso de alteração inferido pela presença de `acaoId` nos resultados): sinaliza exatamente 1 de 27 cenários, grade-adicionar-nome (o caso esperado), e nenhum falso positivo. Essa checagem é aproximada, porque o JSON não guarda as partes de ferramenta completas.
