# Product

<!-- impeccable:product-schema 1 -->

> Nota: sem humano disponível na sessão (dono dormindo); todos os fatos abaixo foram inferidos do briefing do aluno e de `docs/superpowers/specs/2026-11-16-zefe-design.md`, não de entrevista.

## Platform

web

## Stack

Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui, Bun. Decidido pelo dono no design.

## Users

Alunos de graduação da Unicamp, de qualquer curso e campus, muitos calouros no primeiro mês, com uso pesado no celular. Tarefa: entender o que falta para se formar e montar a grade do semestre sem conflitos.

## Product Purpose

Sucessor moderno do GDE (grade.daconline.unicamp.br): mesmas funções que as pessoas realmente usam (planejador, árvore de integralização, busca, páginas de disciplina/professor/sala, exportar .ics) em interface de 2026, mais Zefe, um assistente de IA integrado que enxerga a tela e age no rascunho do aluno. Sucesso: o aluno monta uma grade correta mais rápido e entende a integralização sem planilha.

## Positioning

O GDE com celular, integralização que se explica e um assistente que age na grade, sem pedir senha da DAC. Zefe é produto e mascote (capivara) ao mesmo tempo.

## Operating Context

Dados públicos da DAC (caderno de horários, catálogo) sincronizados para o banco; páginas nunca consultam a DAC. Telas densas (grade semanal seg-sáb, árvore por semestre) usadas em celular entre aulas e em computador na semana de matrícula. Roda só local (127.0.0.1:4100) na v1.

## Capabilities and Constraints

- Informação nunca inventada: horário, sala, vaga, crédito, pré-requisito e conflito vêm do banco/código. Previsão sempre rotulada "previsão"; regra não entendida = texto original + "não verificado".
- Estados de disciplina: cursada, cursando, planejada, faltando, travada.
- Painel do Zefe fixo à direita no computador, gaveta no celular; as telas funcionam inteiras sem o assistente.
- Fora da v1: avaliações, amigos, cardápio, mapa, calculadora de notas, pós-graduação, escrita em sistemas da Unicamp.
- Textos em pt-BR; claro e escuro; foco visível e teclado.

## Brand Commitments

- Nome Zefe (de Zeferino Vaz). Mascote: capivara chamada Zefe, desenhada em SVG no código, simpática sem ser infantil.
- Referências citadas pelo aluno (binding): stripe.com/br, sharpi.ai, restaurantes.toqan.com.br.
- Rodapé e /sobre dizem que o Zefe não é oficial da Unicamp nem da DAC. Nenhuma marca, brasão ou cor institucional da Unicamp usada como se fosse oficial.

## Evidence on Hand

Nenhum depoimento, número de usuários ou métrica; não inventar. Evidência real: o design aprovado e os dados públicos da DAC.

## Product Principles

1. Verdade antes de enfeite: dado calculado em código, incerteza sempre rotulada.
2. Legibilidade vence decoração nas telas densas; movimento parcimonioso.
3. Celular primeiro: calouro com uma mão, entre duas aulas.
4. O assistente ajuda, nunca é requisito: o site inteiro funciona sem ele.
5. Não parecer oficial.

## Accessibility & Inclusion

Foco visível, navegação por teclado, contraste AA nos dois temas, `prefers-reduced-motion` respeitado, estado nunca só por cor (sempre cor + ícone + texto).
