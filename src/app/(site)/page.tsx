import { redirect } from "next/navigation";
import { ArrowRight, FileDown } from "lucide-react";
import { getUsuario } from "@/sessao";
import { Pilula } from "@/components/ds/Pilula";
import { Cartao, Chip, Moldura, Painel, Selo } from "@/components/ds/Blocos";
import { NavLanding } from "@/components/ds/NavLanding";
import { RodapeLanding } from "@/components/ds/RodapeLanding";
import { Mascote } from "@/components/zefe/Mascote";
import { ArvoreAcende } from "@/components/landing/ArvoreAcende";
import { Fita } from "@/components/landing/Fita";
import { HeroProvider, PedidoForm } from "@/components/landing/Hero";
import { PecaEVeja } from "@/components/landing/PecaEVeja";
import { SemanaMatricula } from "@/components/landing/SemanaMatricula";
import { fita, perguntasCalouro } from "@/components/landing/dados";

// Padrão: título (h2) + frase de apoio sobre o gelo; o conteúdo varia de arranjo (painel largo, moldura, painel + texto,
// conversa direto no fundo) mas só usa Painel, Moldura, Cartao e a faixa.
const secao = "ds-container py-16 lg:py-24";
const cabeca = "flex max-w-ds-prose flex-col gap-4";
const h2 = "text-ds-h2";
const lead = "text-ds-lead";

export default async function Apresentacao() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <div data-ds="v2" className="min-h-dvh">
      <NavLanding />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {/* Primeiro quadro: selo, título, apoio, dois botões; o produto sobe na moldura */}
        <section aria-labelledby="titulo" className="ds-container pt-12 pb-16 lg:pt-16 lg:pb-24">
          <HeroProvider total={fita.find((c) => c.proximo)!.chips.length}>
            <div className="ds-subir">
              <Selo className="pl-2">
                <Mascote tamanho={24} decorativo className="size-6" />
                Seu assistente de integralização
              </Selo>
            </div>
            <h1
              id="titulo"
              style={{ animationDelay: "0.06s" }}
              className="ds-subir mt-6 text-ds-h2 md:text-ds-display lg:text-ds-display-lg xl:text-ds-display-xl"
            >
              Do 1º semestre ao diploma, <span className="md:block">cada passo no lugar.</span>
            </h1>
            <p style={{ animationDelay: "0.12s" }} className="ds-subir mt-6 max-w-ds-prose text-ds-lead">
              O Zefe lê o catálogo da DAC, mostra o que falta e monta a grade de cada semestre sem conflito.
            </p>
            <div style={{ animationDelay: "0.18s" }} className="ds-subir mt-8 grid gap-2 sm:flex sm:gap-4">
              <Pilula href="/entrar" className="w-full sm:w-auto">
                Entrar com e-mail <ArrowRight className="size-4" aria-hidden />
              </Pilula>
              <Pilula href="#peca" variante="secundaria" className="w-full sm:w-auto">Como funciona</Pilula>
            </div>
            <Moldura style={{ animationDelay: "0.26s" }} className="ds-subir mt-16">
              <Fita />
              <div className="mt-8 border-t border-ds-line pt-8">
                <PedidoForm />
                <p className="mt-4 pl-6 text-ds-small">Só e-mail e um código, sem senha da DAC.</p>
              </div>
            </Moldura>
          </HeroProvider>
        </section>

        {/* 1. Painel largo: demo de conversa + grade */}
        <section id="peca" aria-labelledby="t-peca" className={`${secao} scroll-mt-24`}>
          <div className={`${cabeca} mb-8 lg:mb-12`}>
            <h2 id="t-peca" className={h2}>Peça, e a grade se monta.</h2>
            <p className={lead}>Escolha um pedido e veja a grade mudar.</p>
          </div>
          <Painel className="space-y-8">
            <h3 className="max-w-ds-prose text-ds-h3">O Zefe pensa, encaixa as turmas e troca a que der conflito.</h3>
            <PecaEVeja />
          </Painel>
        </section>

        {/* 2. Moldura: o trecho real do catálogo, com o título dentro */}
        <section aria-labelledby="t-arvore" className={secao}>
          <Moldura>
            <div className={`${cabeca} mb-8 lg:mb-12`}>
              <h2 id="t-arvore" className={h2}>Toque numa disciplina e a árvore acende.</h2>
              <p className={lead}>Ela mostra o que a disciplina pede antes e o que libera depois. O resto fica em segundo plano.</p>
            </div>
            <ArvoreAcende />
          </Moldura>
        </section>

        {/* 3. Painel à esquerda, texto à direita */}
        <section aria-labelledby="t-matricula" className={`${secao} grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:items-start xl:gap-12`}>
          <div className="flex flex-col gap-8 xl:order-2">
            <div className={cabeca}>
              <h2 id="t-matricula" className={h2}>Na semana de matrícula, a grade já está pensada.</h2>
              <p className={lead}>
                O Zefe junta as turmas do caderno de horários e mostra os conflitos antes de você chegar ao sistema.
              </p>
            </div>
            <Cartao className="space-y-4">
              <h3 className="text-ds-h3">A matrícula continua na DAC</h3>
              <p className="font-medium text-ds-ink">O Zefe não faz a matrícula por você: ela continua no sistema da DAC.</p>
              <p className="flex items-start gap-2 text-ds-small">
                <FileDown className="mt-1 size-4 shrink-0" aria-hidden />
                <span>Exporte a grade em .ics para o seu calendário: <span className="font-medium whitespace-nowrap text-ds-ink">grade-2s-2027.ics</span></span>
              </p>
            </Cartao>
            <Cartao className="space-y-4 border-transparent bg-ds-previsao-bg text-ds-previsao">
              <Chip tom="previsao" className="bg-ds-surface">Previsão</Chip>
              <p className="text-ds-small">
                O caderno do semestre ainda não saiu: estes horários são estimados a partir de semestres anteriores e ficam como
                previsão até a DAC publicar.
              </p>
            </Cartao>
          </div>
          <Painel className="xl:order-1"><SemanaMatricula /></Painel>
        </section>

        {/* 4. Conversa direto no fundo, sem painel */}
        <section aria-labelledby="t-calouro" className={`${secao} grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12`}>
          <div className={`${cabeca} lg:sticky lg:top-32 lg:self-start`}>
            <h2 id="t-calouro" className={h2}>Primeiro mês de curso? Pergunte o básico.</h2>
            <p className={lead}>Crédito, catálogo, eletiva: o Zefe explica em poucas palavras, sem presumir que você já saiba.</p>
          </div>
          <ol className="max-w-ds-prose space-y-8" aria-label="Exemplo de conversa com o Zefe">
            <li className="list-none"><Selo>Exemplo</Selo></li>
            {perguntasCalouro.map((q) => (
              <li key={q.p} className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-ds-card bg-ds-ink px-4 py-2 text-ds-on-band">{q.p}</p>
                <div className="flex items-start gap-3">
                  <Mascote tamanho={32} decorativo className="mt-1 size-8" />
                  <p className="rounded-ds-card border border-ds-line bg-ds-surface px-4 py-2">{q.r}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="t-entrar" className="ds-container pb-8">
          <div className="flex flex-col items-start gap-8 rounded-ds-panel bg-ds-band p-6 text-ds-on-band md:flex-row md:items-center md:p-12">
            <Mascote estado="feliz" tamanho={128} decorativo className="size-24 md:size-32" />
            <div className="max-w-ds-prose flex-1 space-y-4">
              <h2 id="t-entrar" className="text-ds-h2 text-ds-on-band!">Comece pelo seu próximo semestre.</h2>
              <p className="text-ds-lead text-ds-on-band/85">Entre com e-mail e um código, sem senha da DAC. A sua árvore já vem preenchida para você corrigir.</p>
            </div>
            <Pilula href="/entrar" className="w-full md:w-auto">
              Entrar com e-mail <ArrowRight className="size-4" aria-hidden />
            </Pilula>
          </div>
        </section>
      </main>
      <RodapeLanding />
    </div>
  );
}
