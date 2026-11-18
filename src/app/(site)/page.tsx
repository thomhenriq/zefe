import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarArrowDown, CheckCircle2 } from "lucide-react";
import { getUsuario } from "@/sessao";
import { Button } from "@/components/ui/button";
import { AvisoBadge } from "@/components/ui/estado";
import { ArvoreAcende } from "@/components/landing/ArvoreAcende";
import { Fita } from "@/components/landing/Fita";
import { PecaEVeja } from "@/components/landing/PecaEVeja";
import { perguntasCalouro } from "@/components/landing/dados";

const gutter = "mx-auto w-full max-w-[90rem] px-4 lg:px-6";
const h2 = "font-heading text-3xl leading-[1.02] font-extrabold tracking-[-0.035em] sm:text-4xl lg:text-5xl";
const secao = "border-t-2 border-foreground";
const exemplo = "rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-xs text-muted-foreground";

export default async function Apresentacao() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <>
      {/* Primeiro quadro: a graduação inteira numa fita */}
      <section aria-labelledby="titulo" className={`${gutter} flex flex-col pt-8 pb-10 lg:min-h-[calc(100dvh-var(--altura-barra))] lg:pt-10`}>
        <h1
          id="titulo"
          className="anim-subir max-w-[22ch] font-heading text-[clamp(2.5rem,min(7.4vw,10.5vh),5.25rem)] leading-[0.95] font-extrabold tracking-[-0.04em] lg:max-w-[17ch] xl:max-w-[24ch]"
        >
          Do 1º semestre ao diploma, <em className="text-primary not-italic">cada passo no lugar.</em>
        </h1>
        <p className="anim-subir anim-subir-2 mt-4 max-w-[46ch] text-lg text-muted-foreground lg:mt-5 lg:text-xl">
          O Zefe lê o catálogo da DAC, mostra o que falta e monta a grade de cada semestre sem conflito.
        </p>
        <div className="anim-subir anim-subir-3 order-3 mt-6 lg:order-4 lg:mt-5">
          <Link
            href="/entrar"
            className="flex max-w-[40rem] items-center gap-3 rounded-full border bg-card py-1.5 pr-1.5 pl-5 shadow-elevada transition-shadow hover:shadow-suave"
          >
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              Peça ao Zefe<span className="hidden sm:inline">: “monta meu 4º semestre”</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Entrar com e-mail <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
          <p className="mt-2 pl-5 text-sm text-muted-foreground">Só e-mail e um código, sem senha da DAC.</p>
        </div>
        <div className="order-4 mt-8 lg:order-3 lg:mt-auto lg:pt-6">
          <Fita />
        </div>
      </section>

      <section aria-labelledby="peca" className={secao}>
        <div className={`${gutter} py-16 lg:py-24`}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 lg:mb-12">
            <h2 id="peca" className={`${h2} max-w-[16ch]`}>Peça, e a grade se monta.</h2>
            <p className="flex max-w-[52ch] flex-col items-start gap-2 text-muted-foreground">
              <span className={exemplo}>exemplo · dados fictícios</span>
              Escolha um pedido. O Zefe pensa, coloca as turmas e, se der conflito, troca de turma até resolver.
            </p>
          </div>
          <PecaEVeja />
        </div>
      </section>

      <section aria-labelledby="arvore" className={secao}>
        <div className={`${gutter} py-16 lg:py-24`}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 lg:mb-12">
            <h2 id="arvore" className={`${h2} max-w-[18ch]`}>Toque numa disciplina e a árvore acende.</h2>
            <p className="flex max-w-[52ch] flex-col items-start gap-2 text-muted-foreground">
              <span className={exemplo}>trecho real · Sistemas de Informação · catálogo 2026</span>
              Em tinta, o que vem antes. Em verde, o que a disciplina libera. O resto fica em segundo plano.
            </p>
          </div>
          <ArvoreAcende />
        </div>
      </section>

      <section aria-labelledby="matricula" className={secao}>
        <div className={`${gutter} grid gap-10 py-16 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-20 lg:py-24`}>
          <div className="space-y-5">
            <h2 id="matricula" className={`${h2} max-w-[14ch]`}>Na semana de matrícula, a grade já está pensada.</h2>
            <p className="max-w-[56ch] text-lg text-muted-foreground">
              O Zefe junta as turmas do caderno de horários, mostra os conflitos antes de você chegar ao sistema e exporta a
              grade em .ics para o seu calendário.
            </p>
            <p className="max-w-[56ch] font-medium">
              O Zefe não faz a matrícula por você: ela continua no sistema da DAC.
            </p>
          </div>
          <div className="min-w-0 space-y-3">
            <p className="flex items-center gap-2"><span className={exemplo}>exemplo · dados fictícios</span></p>
            <ul className="divide-y rounded-2xl border bg-card">
              <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <span className="font-mono text-sm font-semibold">Turma A</span>
                <span className="font-mono text-sm text-muted-foreground tabular">ter 10h–12h</span>
                <AvisoBadge nivel="conflito" rotulo="Conflito com Estrutura de Dados I" className="ml-auto" />
              </li>
              <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <span className="font-mono text-sm font-semibold">Turma B</span>
                <span className="font-mono text-sm text-muted-foreground tabular">sex 8h–10h</span>
                <span className="ml-auto flex items-center gap-1.5 text-sm text-cursada">
                  <CheckCircle2 className="size-4" aria-hidden /> Sem conflito
                </span>
              </li>
            </ul>
            <div className="space-y-2 rounded-2xl border border-dashed border-previsao-borda bg-previsao-bg p-4 text-previsao">
              <AvisoBadge nivel="previsao" className="bg-card" />
              <p className="text-sm">
                O caderno do semestre ainda não saiu: estes horários foram estimados a partir de semestres anteriores e
                aparecem como previsão até a DAC publicar.
              </p>
            </div>
            <p className="flex items-center gap-2.5 rounded-2xl border bg-card p-4 text-sm font-medium">
              <CalendarArrowDown className="size-5 text-primary" aria-hidden />
              Exportar a grade em .ics
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="calouro" className={secao}>
        <div className={`${gutter} grid gap-10 py-16 lg:grid-cols-[1fr_minmax(0,40rem)] lg:gap-20 lg:py-24`}>
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <h2 id="calouro" className={`${h2} max-w-[14ch]`}>Primeiro mês de curso? Pergunte o básico.</h2>
            <p className="flex max-w-[44ch] flex-col items-start gap-2 text-muted-foreground">
              <span className={exemplo}>exemplo de conversa</span>
              Crédito, catálogo, eletiva: o Zefe explica em poucas palavras, sem presumir que você já saiba.
            </p>
          </div>
          <ol className="space-y-6" aria-label="Exemplo de conversa com o Zefe">
            {perguntasCalouro.map((q) => (
              <li key={q.p} className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{q.p}</p>
                <div className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border bg-painel font-heading text-sm font-bold">Z</span>
                  <p className="max-w-[60ch] rounded-2xl rounded-tl-sm border bg-painel px-4 py-2.5">{q.r}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="entrar" className="bg-primary text-primary-foreground">
        <div className={`${gutter} flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-24`}>
          <div className="space-y-3">
            <h2 id="entrar" className={`${h2} max-w-[16ch]`}>Comece pelo 4º semestre.</h2>
            <p className="max-w-[48ch] text-lg opacity-90">Entre com e-mail e um código, sem senha da DAC. A sua árvore já vem preenchida para você corrigir.</p>
          </div>
          <Button render={<Link href="/entrar" />} nativeButton={false} variant="secondary" className="h-14 rounded-full px-7 text-base font-semibold">
            Entrar com e-mail <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </>
  );
}
