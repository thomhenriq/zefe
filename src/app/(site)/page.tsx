import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getUsuario } from "@/sessao";
import { Pilula } from "@/components/ds/Pilula";
import { Moldura, Painel, Selo } from "@/components/ds/Blocos";
import { NavLanding } from "@/components/ds/NavLanding";
import { RodapeLanding } from "@/components/ds/RodapeLanding";
import { Mascote } from "@/components/zefe/Mascote";
import { ArvoreAcende } from "@/components/landing/ArvoreAcende";
import { Fita } from "@/components/landing/Fita";
import { HeroProvider, PedidoForm } from "@/components/landing/Hero";
import { PecaEVeja } from "@/components/landing/PecaEVeja";
import { SemanaMatricula } from "@/components/landing/SemanaMatricula";
import { fita, perguntasCalouro } from "@/components/landing/dados";

// Padrão único de seção: título (h2) + frase de apoio sobre o gelo, conteúdo num Painel branco de raio 32.
const secao = "ds-container py-16 lg:py-24";
const cabeca = "mb-8 flex max-w-[44rem] flex-col gap-4 lg:mb-12";
const h2 = "text-ds-display-sm md:text-ds-h2";
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
              <Selo className="pl-1.5">
                <Mascote tamanho={24} decorativo className="size-6" />
                Seu assistente de integralização
              </Selo>
            </div>
            <h1
              id="titulo"
              style={{ animationDelay: "0.06s" }}
              className="ds-subir mt-6 text-ds-display-sm md:text-ds-display lg:text-ds-display-lg xl:text-ds-display-xl"
            >
              Do 1º semestre ao diploma, <span className="md:block">cada passo no lugar.</span>
            </h1>
            <p style={{ animationDelay: "0.12s" }} className="ds-subir mt-6 max-w-[40rem] text-ds-lead">
              O Zefe lê o catálogo da DAC, mostra o que falta e monta a grade de cada semestre sem conflito.
            </p>
            <div style={{ animationDelay: "0.18s" }} className="ds-subir mt-8 flex flex-wrap gap-3">
              <Pilula href="/entrar">
                Entrar com e-mail <ArrowRight className="size-4" aria-hidden />
              </Pilula>
              <Pilula href="#peca" variante="secundaria">Como funciona</Pilula>
            </div>
            <Moldura style={{ animationDelay: "0.26s" }} className="ds-subir mt-16">
              <Fita />
              <div className="mt-8 border-t border-ds-line pt-8">
                <PedidoForm />
                <p className="mt-3 pl-6 text-ds-small">Só e-mail e um código, sem senha da DAC.</p>
              </div>
            </Moldura>
          </HeroProvider>
        </section>

        <section id="peca" aria-labelledby="t-peca" className={`${secao} scroll-mt-24`}>
          <div className={cabeca}>
            <h2 id="t-peca" className={h2}>Peça, e a grade se monta.</h2>
            <p className={lead}>Escolha um pedido. O Zefe pensa, coloca as turmas e, se der conflito, troca de turma até resolver.</p>
          </div>
          <Painel><PecaEVeja /></Painel>
        </section>

        <section aria-labelledby="t-arvore" className={secao}>
          <div className={cabeca}>
            <h2 id="t-arvore" className={h2}>Toque numa disciplina e a árvore acende.</h2>
            <p className={lead}>Em verde-petróleo escuro, o que vem antes. Em verde claro, o que a disciplina libera. O resto fica em segundo plano.</p>
          </div>
          <Painel><ArvoreAcende /></Painel>
        </section>

        <section aria-labelledby="t-matricula" className={secao}>
          <div className={cabeca}>
            <h2 id="t-matricula" className={h2}>Na semana de matrícula, a grade já está pensada.</h2>
          </div>
          <Painel className="grid gap-8 lg:grid-cols-[1fr_minmax(0,34rem)] lg:items-center lg:gap-12">
            <div className="space-y-4">
              <p className={lead}>
                O Zefe junta as turmas do caderno de horários, mostra os conflitos antes de você chegar ao sistema e exporta a
                grade em .ics para o seu calendário.
              </p>
              <p className="text-ds-body font-bold text-ds-ink">O Zefe não faz a matrícula por você: ela continua no sistema da DAC.</p>
            </div>
            <SemanaMatricula />
          </Painel>
        </section>

        <section aria-labelledby="t-calouro" className={secao}>
          <div className={cabeca}>
            <h2 id="t-calouro" className={h2}>Primeiro mês de curso? Pergunte o básico.</h2>
            <p className={lead}>Crédito, catálogo, eletiva: o Zefe explica em poucas palavras, sem presumir que você já saiba.</p>
          </div>
          <Painel>
            <ol className="mx-auto max-w-[44rem] space-y-6" aria-label="Exemplo de conversa com o Zefe">
              <li className="list-none"><Selo>Exemplo de conversa</Selo></li>
              {perguntasCalouro.map((q) => (
                <li key={q.p} className="space-y-2">
                  <p className="ml-auto w-fit max-w-[85%] rounded-ds-card bg-ds-ink px-4 py-2 text-ds-on-band">{q.p}</p>
                  <div className="flex items-start gap-3">
                    <Mascote tamanho={32} decorativo className="mt-1 size-8" />
                    <p className="max-w-[60ch] rounded-ds-card bg-ds-bg px-4 py-2">{q.r}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Painel>
        </section>

        <section aria-labelledby="t-entrar" className="ds-container pb-8">
          <div className="flex flex-col items-start gap-8 rounded-ds-panel bg-ds-band p-6 text-ds-on-band md:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[40rem] space-y-4">
              <h2 id="t-entrar" className="text-ds-display-sm text-ds-on-band! md:text-ds-h2">Comece pelo seu próximo semestre.</h2>
              <p className="text-ds-lead text-ds-on-band/85">Entre com e-mail e um código, sem senha da DAC. A sua árvore já vem preenchida para você corrigir.</p>
            </div>
            <Pilula href="/entrar">
              Entrar com e-mail <ArrowRight className="size-4" aria-hidden />
            </Pilula>
          </div>
        </section>
      </main>
      <RodapeLanding />
    </div>
  );
}
