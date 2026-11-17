# Zefe — o sucessor do GDE, com um assistente dentro

Data: 2026-11-16 · Status: rascunho para aprovação · Pasta: `~/Documents/projects/zefe`

Marcação usada neste documento: **(dele)** = decidido pelo aluno na conversa; **(minha)** = decisão minha, a conferir.

## Intenção e porquê

O GDE (grade.daconline.unicamp.br) é muito bom e todo aluno da Unicamp usa desde os primeiros meses, mas é antigo: interface de 2010, nada de celular, e integralização/planejamento continuam sendo uma bagunça que cada aluno resolve na mão. **(dele)**

O aluno quer um produto novo, com identidade própria, que seja a evolução do GDE: as mesmas funções que as pessoas realmente usam, numa interface moderna, e **principalmente um assistente de IA integrado** que ajude a entender a integralização e a montar a grade. **(dele)**

O nome é **Zefe** (de Zeferino Vaz, fundador da Unicamp). Zefe é ao mesmo tempo o produto e o mascote/assistente. **(dele)**

## Para quem

Alunos de graduação da Unicamp, de qualquer curso e campus, inclusive calouros no primeiro mês. O primeiro usuário é o próprio aluno (Sistemas de Informação, curso 94, FT Limeira, catálogo 2026).

## Objetivos da v1

Funções do GDE que continuam **(dele)**:

1. **Planejador** — montar a grade de um semestre escolhendo turmas, com conflitos calculados.
2. **Árvore de integralização** — o que já foi cursado, o que falta, o que está travado por pré-requisito.
3. **Busca** — disciplinas, professores, salas, oferecimentos.
4. **Páginas** de disciplina, professor e sala.
5. **Avaliações** de professor/disciplina.
6. **Exportar a grade para o calendário**.

O que é novo:

7. **Zefe, o assistente**, num painel fixo à direita em todas as telas **(dele: escolheu "painel ao lado" entre três esboços)**. Ele enxerga a tela atual e age nela.
8. **Caderno de horários de vários anos** embutido (oferecimentos passados servem de base para previsão).
9. **Cadastro em menos de um minuto**, sem depender do GDE nem de senha da DAC.

## Não-objetivos da v1

- Amigos, cardápio, mapa **(dele: "nunca nem encostamos")**.
- Calculadora de notas, enquetes, eventos, chat **(minha: ele não citou)**.
- Pós-graduação **(minha)**.
- Qualquer escrita em sistema da Unicamp (matrícula, alteração). O Zefe só mexe no rascunho do próprio aluno **(minha)**.
- Importar histórico por PDF do SIGA ou por login no GDE **(minha: substituído pelo cadastro abaixo; pode voltar depois)**.
- Regras de fretado/deslocamento entre campi do projeto `gedeé`. A v1 tem só "horários bloqueados" genéricos (ver Planejador). O `gedeé` continua existindo para o caso pessoal dele **(minha)**.
- Publicação/hospedagem. A v1 roda no computador dele; nada no código deve prender a um provedor **(minha; ele escolhe banco e host depois)**.
- Planejamento arrastando disciplinas por vários semestres futuros. A árvore mostra a proposta por semestre, mas só um semestre é planejado com turmas **(minha)**.

## Anti-objetivos

1. **Informação errada ou inventada** (herdado do `gedeé`, continua sendo o principal). Horário, sala, vaga, crédito, pré-requisito e conflito vêm sempre do banco e de cálculo em código, nunca do texto do modelo. Previsão sempre rotulada como previsão. Regra de catálogo que o parser não entende aparece como texto original + "não verificado", nunca como palpite.
2. **Parecer oficial.** O Zefe não é da Unicamp nem da DAC; o rodapé e a tela "sobre" dizem isso.
3. **Guardar credenciais da Unicamp.** Nenhuma senha de SIGA/GDE passa pelo sistema.
4. **Virar um chat com um site em volta.** As telas funcionam inteiras sem o assistente; quem não tem acesso ao Zefe usa todo o resto.

## Como o GDE faz hoje (verificado no código, github.com/guaycuru/gde)

- Cadastro pede ano de ingresso, catálogo, curso e modalidade.
- A identidade vem de um token assinado com um segredo compartilhado entre DAC e GDE.
- As disciplinas em que o aluno se matriculou vêm de views do banco da DAC lidas direto pelo GDE; o código dos robôs não é público, a pedido da DAC.
- O GDE não sabe se o aluno foi aprovado: a tela "Eliminador" pergunta disciplina por disciplina.

Consequência: nada disso está disponível para um produto independente. O Zefe precisa obter o histórico de outro jeito (abaixo). O código do GDE é GPL-3 e **não deve ser copiado**; serve só como referência de comportamento.

## Dados (fontes públicas, verificadas em 2026-11-16)

| Dado | Fonte | Anos |
|---|---|---|
| Turmas, horários, salas, docentes, vagas, reservas | Caderno de horários DAC: `/portal/caderno-de-horarios/{ano}/{periodo}/S/G/{INSTITUTO}/{CODIGO}` | 2018 em diante (2027 ainda vazio) |
| Ementa, créditos, pré-requisitos | Catálogo DAC: `/sistemas/catalogos/grad/catalogo{ano}/disciplinas/{prefixo}.html` | — |
| Currículo pleno do curso (obrigatórias, eletivas, modalidades) | `.../catalogo{ano}/cursos/{curso}g/curriculo.html` | conferido só em 2026 (curso 94) |
| Proposta de currículo por semestre | `.../catalogo{ano}/cursos/{curso}g/sugestao.html` | 2020 a 2027 respondem para o curso 94; 2018 e anteriores não |

Alunos com ingresso anterior a 2020 ficam sem pré-marcação automática (marcam à mão) **(minha)**.

O projeto `gedeé` já tem, com testes, os parsers do caderno e de pré-requisitos, a sincronização e a previsão de oferta por semestres de mesma paridade. Esse código é levado para o Zefe. Os parsers de currículo pleno e de proposta são novos.

Coleta educada: poucas requisições simultâneas, User-Agent genérico, tudo guardado no banco; as páginas do site nunca consultam a DAC na hora.

## Como cada parte se comporta

### Entrada e cadastro

1. Entrar com a conta Google `@dac.unicamp.br` (prova que é aluno, sem senha nossa). **(minha — depende de confirmação, ver "Em aberto")**
2. Quatro perguntas: curso, ano de ingresso (define o catálogo, editável), modalidade se o curso tiver, e em que semestre do curso está.
3. O Zefe pré-marca como cursadas todas as disciplinas da proposta de currículo até o semestre anterior, e como "cursando" as do semestre atual. Créditos eletivos da proposta ("4 créditos eletivos") não são pré-marcados: o aluno diz quais fez. Calouro antes do início das aulas: nada marcado, cadastro acabou. **(minha)**
4. O aluno corrige as exceções: clicando na árvore ou falando com o Zefe ("reprovei Cálculo II", "adiantei SI400").

Estados de uma disciplina para o aluno: cursada · cursando · planejada · faltando · travada (pré-requisito não cumprido). "Cursando" conta nos pré-requisitos como "cumpre se aprovado".

### Árvore de integralização

- Colunas por semestre da proposta; cada disciplina é um cartão com o estado em cor e ícone.
- Barras de progresso: obrigatórias, cada grupo de eletivas, total de créditos.
- Clique numa disciplina mostra pré-requisitos, o que ela destrava e quando costuma ser oferecida.
- Grupo de eletivas cuja regra o parser não entende: mostra o texto do catálogo e marca "não verificado".

### Planejador

- Um semestre por vez (padrão: o próximo semestre letivo; o aluno pode trocar); várias opções de grade para o mesmo semestre, uma marcada como principal.
- Grades são privadas; não há compartilhamento na v1 **(minha)**.
- Grade semanal (seg–sáb) + lista de turmas escolhidas + total de créditos.
- Adicionar pela busca lateral ou pelo Zefe; trocar de turma num clique.
- **Horários bloqueados**: o aluno cadastra janelas fixas (estágio, trabalho) que entram na grade e contam como conflito.
- Avisos calculados em código: conflito de horário, pré-requisito não cumprido, turma reservada para outro curso, aulas seguidas em campi diferentes.
- Semestre sem caderno publicado: mostra a oferta prevista a partir de semestres de mesma paridade, com etiqueta "previsão" e a evidência.

### Busca e páginas

- Busca única (campo no topo, atalho de teclado) por código, nome, professor ou sala.
- **Disciplina**: ementa, créditos, pré-requisitos, o que destrava, oferecimentos por semestre, avaliações.
- **Professor**: disciplinas e turmas por semestre, avaliações. Professor é identificado pelo nome como aparece no caderno **(minha: a DAC não publica identificador)**.
- **Sala**: ocupação semanal no semestre.
- Essas páginas são públicas (sem login) **(minha)**.

### Avaliações

- Começam vazias; as do GDE não podem ser importadas.
- Só usuário logado; uma avaliação por (aluno, professor, disciplina), editável.
- **Só notas de 1 a 5 em poucos critérios fixos, sem texto livre** **(minha: comentário aberto sobre pessoa exige moderação, que a v1 não tem)**.
- Exibe média e número de avaliações; abaixo de um mínimo, mostra "poucas avaliações".

### Calendário

Botão que baixa um arquivo `.ics` da grade principal, com as aulas repetindo semanalmente até o fim do semestre. Abre em Google, Apple e Outlook sem pedir acesso à conta **(minha: mais simples que integrar com a API do Google)**.

### Zefe, o assistente

- Painel fixo à direita no computador; gaveta que sobe de baixo no celular. **(dele)**
- Sabe em que tela o aluno está e qual grade/disciplina está aberta.
- **Age direto no rascunho**: adiciona/remove/troca turmas, marca disciplina como cursada, cria bloqueios. Cada ação aparece no chat como um item com botão **desfazer**. **(minha)**
- Responde com cartões montados a partir dos resultados das ferramentas (turmas, grade, progresso), não de tabela escrita pelo modelo.
- Ferramentas previstas: buscar disciplinas/turmas (inclusive por janela livre), ver oferta e previsão, ver progresso e pré-requisitos, ver e alterar a grade, checar a grade, alterar o histórico.
- **Acesso na v1: lista de e-mails liberados**, começando só por ele; quem não está na lista vê o painel com um aviso de "em breve". **(dele: "só eu por enquanto")**
- Usa chave de API da Anthropic do aluno, no servidor; modelo configurável por variável de ambiente.
- Conversas ficam salvas por usuário; há um botão "nova conversa" **(minha)**.

### Identidade e interface

- Identidade nova, "evolução do GDE"; mascote Zefe (proposta: capivara) **(minha, a decidir na etapa de design)**.
- Referências de visual e padrões **(dele)**: stripe.com/br, sharpi.ai, restaurantes.toqan.com.br.
- A interface é desenhada com a skill `/impeccable` **(dele)**, usando componentes das bibliotecas que ele listou (reactbits, cult-ui, componentry, 21st.dev, uiverse, motion-primitives, magicui e o diretório do shadcn).
- Textos em pt-BR. Funciona no celular. Claro e escuro.

## Restrições

- **Tudo em Next.js** **(dele)**; autenticação com **better-auth** **(dele: "se quiser")**.
- PostgreSQL, com docker-compose no desenvolvimento **(preferência registrada dele)**.
- Bun como gerenciador de pacotes e executor de scripts **(minha, pela preferência registrada)**.
- Sem código copiado do GDE (GPL-3).
- Dados de um aluno nunca aparecem para outro; avaliações são exibidas só agregadas.

## Abordagens consideradas

1. **Um aplicativo Next.js só, com banco próprio (escolhida).** Os dados da DAC são sincronizados para o Postgres por um script; telas e Zefe usam as mesmas funções de servidor. O Zefe roda dentro do app com a API da Anthropic e ferramentas que chamam essas funções. Vantagem: uma coisa só para rodar, o assistente e as telas nunca discordam. Custo: migrar o cache SQLite do `gedeé` para Postgres.
2. **Next.js na frente + o servidor MCP do `gedeé` atrás.** Reaproveita o MCP como está. Descartada: são dois serviços, o MCP foi feito para um aluno só (perfil e senha em arquivo) e as telas precisariam de um caminho de dados separado do assistente.
3. **Sem banco de disciplinas, consultando a DAC na hora.** Descartada: lenta, frágil, e sem histórico de vários anos não há busca nem previsão.

Ele passou as escolhas de tecnologia para mim além de Next.js e better-auth; a abordagem 1 é minha escolha.

## Ordem de entrega **(minha)**

Cada etapa deixa algo usável e tem seu próprio plano:

1. **Base**: projeto Next.js, banco, sincronização de caderno e catálogo (incluindo os dois parsers novos).
2. **Identidade e casca**: `/impeccable`, layout com o painel do Zefe (ainda sem IA), login, cadastro.
3. **Busca e páginas** de disciplina, professor e sala.
4. **Árvore** de integralização.
5. **Planejador** + exportar `.ics`.
6. **Zefe**: assistente com ferramentas e desfazer.
7. **Avaliações**.

## Deixado para o builder

- Esquema do banco, ORM, estrutura de pastas, nomes de rotas.
- Biblioteca para o chat com streaming e ferramentas; modelo padrão (conferir preço e ids atuais antes de escolher).
- Quais componentes de quais bibliotecas; animações.
- Formato exato dos critérios de avaliação e o mínimo para exibir média.
- Como identificar o mesmo professor escrito de formas diferentes no caderno.
- Quantos anos de caderno sincronizar por padrão.
- Equivalências entre disciplinas: usar as que a DAC publica; caso não tratado aparece como "não verificado", nunca como cumprido.
- Onde fica a lista de e-mails liberados para o Zefe.
- Testes: no mínimo parsers contra HTML salvo, motor de conflitos, cálculo de integralização para o curso 94/2026, e a regra de pré-marcação do cadastro.

## Em aberto (precisa dele)

1. A conta `@dac.unicamp.br` dele entra com "Login com Google" em sites de terceiros? Se não, o plano B é um código enviado por e-mail para o endereço `@dac.unicamp.br`.

## Riscos conhecidos

- **Regras de eletivas variam muito entre cursos.** O cálculo sai certo para o curso 94 primeiro; outros cursos podem cair em "não verificado" até o parser cobrir o formato deles.
- **Pré-marcação pelo semestre atual erra** para quem reprovou ou adiantou; por isso a correção de exceções faz parte do cadastro, e a árvore mostra que os dados são declarados pelo aluno.
- **HTML da DAC muda.** Parsers falham alto na sincronização, nunca gravam vazio em silêncio.
- **Professores só por nome**: homônimos e grafias diferentes podem misturar ou dividir páginas e avaliações.
- **Avaliações vazias no início** tornam essa parte pouco útil até haver uso.
- **Custo do assistente** quando abrir para mais gente; a lista de liberados é o freio da v1.
