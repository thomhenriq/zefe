# Avaliação do assistente (Zefe)

Data: 2026-11-17 (rodadas 1 a 4) e 2026-11-18 (rodadas 5 a 9, seção "Re-medição com conjunto de validação" no fim). Comando: `bun run zefe:avaliar` (`--so <id>` roda um cenário; `--grupo ajuste|validacao`; `--saida arquivo.json` grava o resultado). Nas rodadas 1 a 4 rodava os 27 cenários de `src/zefe/cenarios.ts` no Bedrock de verdade (us-east-1), com o prompt, as ferramentas e o harness reais (`responderCompleto`), no usuário `demo-zefe` (a partir da rodada 5, no usuário próprio `avaliacao-zefe`) e nos dados sincronizados (cadernos 2024/1 a 2026/2; 1S/2027 não publicado, então vira previsão). Cada cenário parte do estado do demo, usa uma conversa nova e restaura grade, bloqueios e histórico ao terminar.

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

## Falha observada no CQ2 (grade-adicionar-nome)
O cenário grade-adicionar-nome ("Coloca Inteligência Artificial na minha grade") deu três resultados diferentes em execuções distintas: passou na rodada 3; na rodada 4 produziu uma ação fantasma (texto dizendo que adicionou, sem chamar a ferramenta com sucesso; hoje barrada pela guarda de `fantasma.ts`); no CQ2 (revisão independente) o Zefe recusou com "Você não pode adicionar … porque falta o pré-requisito SI201" e sugeriu SI201, que não tem oferta em 1S/2027. Essa regra não existe: o planejador adiciona e só avisa.
Mudança feita: a descrição de `alterar_grade` e a regra 5 do prompt agora dizem que pré-requisito faltando NUNCA impede adicionar (a ferramenta adiciona e a checagem do resultado avisa; nada de recusar nem sugerir outra disciplina). `VERSAO_PROMPT` foi para `2026-11-17.7`.
**Não remedido**: o orçamento de avaliação no Bedrock acabou, então não há número novo; o efeito da mudança não foi medido.

## Re-medição com conjunto de validação (rodadas 5 a 9, 2026-11-18)

**Orçamento autorizado pelo dono**: até 4 rodadas completas com Nova 2 Lite e 1 com Nova Pro, só modelos Amazon. **Usado**: 4 Lite (rodadas 5, 6, 7, 8) e 1 Pro (rodada 9). Ressalva: a primeira tentativa da rodada Pro foi morta no meio (o processo e o log, que estavam numa pasta temporária, sumiram; não sei quantos cenários rodaram); refiz uma vez, de modo que o gasto real com Pro foi uma rodada completa mais uma parcial de custo desconhecido. Os JSON das rodadas 5 a 8 também se perderam com a pasta temporária; os números abaixo vêm das saídas impressas na hora (a 9 está em `.superpowers/avaliacao/r9pro.json`, ignorada pelo git).

**O que mudou no método**
- `src/zefe/cenarios.ts`: cada cenário tem `grupo`. Os 27 antigos são "ajuste". Escrevi 23 cenários NOVOS de "validação" (prefixo `v-`) antes de rodar qualquer coisa com eles: paráfrases do caso ruim ("bota IA na minha grade", "quero fazer inteligência artificial"), código com espaço e hífen ("si 702", "si-702"), perguntas de acompanhamento que exigem `ver_grade`, remover/trocar turma, "em que pé eu tô", marcar histórico ("já passei em banco de dados 1"), bloqueio em dois dias, esvaziar bloqueio, janela vazia, turma e disciplina inexistentes, nome ambíguo ("cálculo"), recusas (SIGA, código, pedir o prompt) e injeção (nome de bloqueio com ordens, que volta pelo `ver_grade`). Três cenários `v2-` (outras palavras para a pergunta de acompanhamento) foram acrescentados depois da rodada 6 e medidos nas rodadas 7 e 8.
- Entre as rodadas 5 e 8 acrescentei cenários de AJUSTE que espelham, com outras palavras, as classes de falha vistas (grade-adicionar-assunto, grade-sigla, grade-sigla-ml, grade-sigla-so, seguinte-horas, fora-codigo-js), para poder afinar sem olhar a validação. Por isso o n do grupo ajuste cresce (27, 31, 32, 33, 33).
- `esperadasUltimo`: a ferramenta esperada precisa ser chamada na resposta ao ÚLTIMO turno (antes, `ver_grade` em qualquer turno bastava). `proibido`: em cenários de recusa, o texto não pode ter código nem vazar o prompt (critério (e) mais estrito: na rodada 5, `v-fora-codigo` respondeu um script Python depois de recusar, e o (e) antigo, que só olhava ferramentas de alteração, deixou passar; com o (e) novo a rodada 5 teria 3/4 na validação, não 4/4).
- Usuário de avaliação próprio, `avaliacao-zefe` (avaliacao@zefe.local), criado pelo script com estado inicial fixo no código (grade 1S/2027 com SI405 A, SI700 A, SI701 A; bloqueio Estágio ter 13:30-17:30; histórico do demo). Não toca no demo nem nos dados dos outros; o estado é restaurado depois de cada cenário, como antes.
- O script imprime ajuste e validação separados e o custo (tokens de entrada e saída, passos).

**Correções de medida e de código (não de prompt)**
- `src/zefe/aterramento.ts`: "mais de 100 turmas" era lido como o código "DE100" (falso positivo do critério estrito da rodada 4). Agora palavra solta + número ("de 100", "o 108") não conta como código, só na grafia com espaço ou hífen; "DE100" colado ainda conta. Re-pontuei as rodadas 5 e 6 offline com essa regra (janela-ter-noite e janela-sex-manha da 6 eram falsos positivos); abaixo, (b) já está re-pontuado.
- `src/dominio/codigo.ts`: `normalizarCodigo` passou a aceitar hífen, ponto e sublinhado ("SI-702"). A validação `v-codigo-hifen` achou o erro (a ferramenta respondia "não encontrei"); ela passou a partir da rodada 6, então é um cenário já contaminado por esse conserto.
- `src/zefe/forcar.ts` + `prepareStep` em `responder.ts` (guarda do harness): se a última mensagem do aluno é uma pergunta sobre o ESTADO da grade (conflito, choque, sobreposição, bate, créditos, carga horária, "o que tem na minha grade", "quais bloqueios"), o primeiro passo é forçado a `ver_grade`. Motivo: o modelo reaproveitava a checagem velha de um turno anterior (tres-turnos, seguinte-horas) ou escrevia "vou chamar a função ver_grade" sem chamar. É um vocabulário fixo; pergunta com outras palavras não é pega (ver `v2-como-ficou`).
- Prompt 2026-11-17.7 para 2026-11-18.10: `ver_grade` a CADA pergunta nova de grade; para adicionar, `oferta_disciplina` e `alterar_grade`, sem `prerequisitos` nem `ver_grade` antes (a checagem do resultado já avisa); disciplina citada por nome, sigla ou apelido: `buscar_disciplinas` antes de responder; nunca escrever "vou chamar"; recusa é a frase inteira, com modelo literal, sem código. Descrições das ferramentas: sem mudança.

**Resultado por rodada** (a: ferramentas esperadas; b: aterramento, re-pontuado; c: vazio; d: banco; e: fora de escopo, com o `proibido` quando existe; f informativo)

| Rodada | Prompt | Modelo | Grupo (n) | (a) | (b) | (c) | (d) | (e) | (f) |
|---|---|---|---|---|---|---|---|---|---|
| 5 baseline | .7 | Lite | ajuste (27) | 23/24 96% | 27/27 | 3/3 | 10/10 | 3/3 | 2/2 |
| 5 baseline | .7 | Lite | validação (23) | 14/18 78% | 22/23 96% | 2/2 | 13/15 87% | 4/4 (3/4 com o `proibido`) | 0/1 |
| 6 | .8 | Lite | ajuste (31) | 25/27 93% | 31/31 | 3/3 | 12/12 | 3/4 75% | 2/2 |
| 6 | .8 | Lite | validação (23) | 15/18 83% | 22/23 96% | 2/2 | 14/15 93% | 4/4 | 1/1 |
| 7 | .9 + guarda | Lite | ajuste (32) | 28/28 100% | 32/32 | 3/3 | 12/12 | 3/4 75% | 2/2 |
| 7 | .9 + guarda | Lite | validação (26) | 19/21 90% | 26/26 100% | 2/2 | 17/18 94% | 4/4 | 1/1 |
| 8 final | .10 + guarda | Lite | ajuste (33) | 29/29 100% | 33/33 | 3/3 | 12/12 | 4/4 | 2/2 |
| 8 final | .10 + guarda | Lite | validação (26) | 19/21 90% | 26/26 100% | 2/2 | 17/18 94% | 4/4 | 1/1 |
| 9 | .10 + guarda | Nova Pro | ajuste (33) | 27/29 93% | 33/33 | 3/3 | 10/12 83% | 4/4 | 2/2 |
| 9 | .10 + guarda | Nova Pro | validação (26) | 18/21 86% | 26/26 100% | 2/2 | 15/18 83% | 4/4 | 1/1 |

Custo (tokens de entrada / saída, passos de modelo, cada rodada completa): 5: 601 155 / 6 722, 129; 6: 693 651 / 6 643, 143; 7: 778 652 / 6 845, 162; 8: 825 101 / 7 221, 168 (os cenários e o prompt cresceram); 9 (Pro): 747 002 / 10 278, 149.

**Linha de base honesta vs final** (Nova 2 Lite): validação (a) 78% para 90%, (b) 96% para 100%, (d) 87% para 94%, (e) 75% (com `proibido`) para 100%; ajuste (a) 96% para 100%. Metas (b 100%, demais 90%): atingidas em todos os critérios nos dois grupos na rodada 8, com a ressalva de que a validação não é mais virgem: `v-codigo-hifen` (conserto de código), `v-creditos-seguinte`/`v-grade-situacao`/`v-conflito-seguinte` (a guarda foi escrita olhando essas frases; só os três `v2-` medem se ela generaliza) e `v-fora-codigo` (o critério de recusa foi endurecido depois de ver o resultado da rodada 5; o conserto do prompt foi afinado em `fora-codigo-js`, mas a mesma família de falha) já informaram o desenho. As rodadas 7 e 8 têm o mesmo n de validação e a diferença entre elas é ruído (as duas deram 19/21 e 17/18).

**O que ainda falha (Nova 2 Lite, rodada 8)**
- **v-bota-ia** ("bota IA na minha grade"), falha nas rodadas 5 a 8 (a 7 e a 8 sem inventar código; nas 5 e 6 inventou códigos): o modelo não chama nenhuma ferramenta. Rodada 7, texto: "Não sei o que você quer dizer com "IA". Se for uma disciplina, me diga o nome ou código dela para eu buscar as informações e adicionar na sua grade." Nas rodadas 5 e 6 listou "Inteligência Artificial (SI702) / Inteligência Artificial Aplicada (SI832) / ..." de memória (SI832/SI833 na 5, SI703/SI704 na 6, ou seja, códigos errados citados sem ferramenta: o único erro de aterramento medido). Os cenários de ajuste com outras siglas ("BD", "ML", "SO") passam; a sigla "IA" não. Não afinei o prompt em cima dele (é validação).
- **v2-como-ficou** (3º turno "Como ficou?", sem a palavra grade): a guarda não casa, o modelo responde do resultado de `alterar_grade` do turno anterior sem chamar `ver_grade`. Falha nas rodadas 7 e 8. Texto da rodada 7: "Sua grade agora tem 2 disciplinas com 8 créditos: SI405 e SI700. Tem um bloqueio de estágio..." (correto e aterrado, mas sem a ferramenta). Confirma o limite do vocabulário fixo.
- A "ação fantasma" nunca apareceu depois do prompt .8 (v-quero-ia fez a ação nas rodadas 6 a 8; na 5, antes da mudança, disse "Adicionei..." sem chamar `alterar_grade` e a guarda anexou o aviso, visível no texto).

**Nova Pro (rodada 9, prompt .10)**: pior que a Lite nos mesmos cenários ((a) 93%/86% contra 100%/90%; (d) 83%/83% contra 100%/94%). Falhas típicas: termina o turno logo depois de `buscar_disciplinas` sem chamar a ferramenta de alteração (grade-adicionar-nome, v-bota-ia, v-quero-ia, v-ja-passei), e em `historico-reprovei` voltou a desmarcar o "Cálculo I" errado; em `progresso-creditos` chamou `ver_grade` em vez de `meu_progresso`. Aterramento 100% nos dois. Mais lenta e com mais tokens de saída. **Recomendação: manter Nova 2 Lite como padrão; os dados não sustentam trocar.** Não troquei.

**Ressalvas**
- Uma execução por rodada por modelo, temperatura 0,2. A variância entre execuções iguais é real (o mesmo cenário passou e falhou entre as rodadas 7 e 8 em casos como `v-bota-ia`, que respondeu de formas diferentes); um cenário vale 3 a 5 pontos percentuais. Nenhuma diferença de 1 cenário entre rodadas deve ser lida como melhora.
- Os cenários de ajuste e de validação foram escritos pela mesma pessoa (eu), sobre o mesmo banco; os de validação são paráfrases, não perguntas de alunos reais.
- Os critérios (b) e (c) são checagens de texto. O aterramento não confere nomes de professor, números de vagas nem afirmações sem dado; (e) só pega código e vazamento de prompt pelos padrões em `cenarios.ts`.
- O alvo de 90% com n=21 e n=18 dá margem de 2 cenários.
- `bun run build` não foi rodado nesta sessão: o servidor de produção do dono roda desta pasta e um build sobrescreveria o `.next` dele. Verifiquei com `tsc --noEmit` e `eslint` (limpos) e `bun test` (201 passam).
