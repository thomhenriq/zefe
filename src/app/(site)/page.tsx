import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario } from "@/sessao";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvisoBadge, type EstadoDisciplina } from "@/components/ui/estado";
import { Mascote } from "@/components/zefe/Mascote";
import { GradeSemanal, type ItemGrade } from "@/components/grade/GradeSemanal";
import { CartaoDisciplina } from "@/components/arvore/CartaoDisciplina";

// Dados fictícios só para ilustrar: nenhum código, horário ou disciplina real.
const exemplo: ItemGrade[] = [
  { rotulo: "Exemplo A", dia: "seg", inicio: "08:00", fim: "10:00", tom: "conflito" },
  { rotulo: "Exemplo B", dia: "seg", inicio: "09:00", fim: "11:00", tom: "conflito" },
  { rotulo: "Exemplo C", dia: "seg", inicio: "14:00", fim: "16:00", tom: "planejada" },
  { rotulo: "Exemplo D", dia: "qua", inicio: "10:00", fim: "12:00", tom: "planejada" },
  { rotulo: "Exemplo E", dia: "qui", inicio: "08:00", fim: "10:00", tom: "cursando" },
  { rotulo: "Exemplo F", dia: "sex", inicio: "13:00", fim: "15:00", tom: "planejada" },
  { rotulo: "Exemplo G", dia: "sab", inicio: "08:00", fim: "12:00", tom: "travada" },
];

const semestres: { n: string; itens: { nome: string; estado: EstadoDisciplina; nota?: string }[] }[] = [
  { n: "1º semestre", itens: [{ nome: "Exemplo 1", estado: "cursada" }, { nome: "Exemplo 2", estado: "cursada" }, { nome: "Exemplo 3", estado: "cursada" }] },
  { n: "2º semestre", itens: [{ nome: "Exemplo 4", estado: "cursada" }, { nome: "Exemplo 5", estado: "cursando" }, { nome: "Exemplo 6", estado: "cursando" }] },
  { n: "3º semestre", itens: [{ nome: "Exemplo 7", estado: "planejada" }, { nome: "Exemplo 8", estado: "faltando" }, { nome: "Exemplo 9", estado: "travada", nota: "Pede o Exemplo 5" }] },
  { n: "4º semestre", itens: [{ nome: "Exemplo 10", estado: "faltando" }, { nome: "Exemplo 11", estado: "travada", nota: "Pede o Exemplo 9" }] },
];


export default async function Apresentacao() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <>
      <section className="px-3 pt-3 lg:px-4 lg:pt-4">
        <div className="mx-auto grid max-w-[88rem] items-center gap-10 overflow-hidden rounded-[2rem] border bg-[radial-gradient(ellipse_at_85%_10%,color-mix(in_oklch,var(--capi-claro)_38%,transparent),transparent_55%),radial-gradient(ellipse_at_10%_100%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_55%)] px-6 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:px-12 lg:py-20">
          <div className="space-y-6">
            <h1 className="anim-subir text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl lg:leading-[1.04]">
              Sua grade da Unicamp, sem tentativa e erro.
            </h1>
            <p className="anim-subir anim-subir-2 max-w-[52ch] text-lg text-muted-foreground">
              O Zefe mostra o que falta para você se formar, monta o semestre com os horários reais do caderno da DAC,
              avisa de conflito antes da matrícula e funciona direto no celular.
            </p>
            <div className="anim-subir anim-subir-3 flex flex-wrap items-center gap-3">
              <Button render={<Link href="/entrar" />} nativeButton={false} className="h-12 rounded-full px-6 text-base">
                Entrar com e-mail <ArrowRight data-icon="inline-end" />
              </Button>
              <Button render={<Link href="/sobre" />} nativeButton={false} variant="outline" className="h-12 rounded-full px-5 text-base">
                Como funciona
              </Button>
              <Button render={<Link href="/busca" />} nativeButton={false} variant="ghost" className="h-12 rounded-full px-5 text-base">
                Buscar disciplinas
              </Button>
            </div>
          </div>

          <div className="anim-subir anim-subir-2 min-w-0 space-y-4">
            <figure className="relative">
              <div className="[mask-image:linear-gradient(to_bottom,#000_82%,transparent)] max-h-[30rem] overflow-hidden rounded-2xl shadow-elevada">
                <GradeSemanal itens={exemplo} className="rounded-2xl" />
              </div>
              <div className="pointer-events-none absolute top-[calc(1.875rem+2*44px+2px)] left-[calc(2.75rem+(100%-2.75rem)/6+0.5rem)] hidden items-center gap-1 sm:flex">
                <ArrowLeft className="size-4 text-conflito" aria-hidden />
                <AvisoBadge nivel="conflito" className="bg-card shadow-suave" rotulo="Conflito: Exemplo A e B se sobrepõem" />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:hidden">
                <AvisoBadge nivel="conflito" /> Exemplo A e B se sobrepõem na segunda, das 9h às 10h.
              </figcaption>
            </figure>
            <div className="flex items-end justify-end gap-2">
              <p className="mb-8 rounded-2xl rounded-br-sm border bg-card px-3 py-2 text-sm shadow-suave">
                Oi, eu sou o Zefe. Os exemplos acima são fictícios.
              </p>
              <Mascote estado="feliz" tamanho={112} decorativo />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 border-y bg-card/50 lg:mt-20">
        <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 lg:px-6 lg:py-24">
          <Linha
            titulo="Uma grade semanal que avisa dos conflitos"
            texto="Escolha turmas do caderno de horários e veja a semana de segunda a sábado. Choque de horário, pré-requisito pendente e turma reservada para outro curso aparecem na hora, calculados a partir dos dados, nunca no palpite."
            visual={
              <ul className="divide-y rounded-2xl border bg-card shadow-suave">
                {([
                  ["conflito", "Duas turmas no mesmo horário."],
                  ["aviso", "Pré-requisito pendente, turma reservada a outro curso ou aulas seguidas em campi diferentes."],
                  ["previsao", "Oferta estimada a partir de semestres anteriores, com a evidência."],
                  ["naoverificado", "Regra do catálogo que o Zefe não entendeu, com o texto original."],
                ] as const).map(([n, t]) => (
                  <li key={n} className="flex items-start gap-3 p-4">
                    <AvisoBadge nivel={n} className="mt-0.5 w-32 shrink-0 justify-center" />
                    <span className="text-sm text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            }
          />
          <Linha
            inverter
            titulo="Integralização que se explica"
            texto="A árvore do seu curso mostra cada disciplina como cursada, cursando, planejada, faltando ou travada, sempre com cor, ícone e texto. Onde o catálogo tem uma regra que o Zefe não entende, ele mostra o texto original e marca como não verificado."
            visual={
              <figure className="min-w-0 space-y-3">
                <div className="flex gap-3 overflow-x-auto rounded-2xl border bg-card p-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)]">
                  {semestres.map((sem) => (
                    <div key={sem.n} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{sem.n}</p>
                      <div className="space-y-2">
                        {sem.itens.map((it) => <CartaoDisciplina key={it.nome} {...it} />)}
                      </div>
                    </div>
                  ))}
                </div>
                <figcaption className="text-sm text-muted-foreground">Exemplo ilustrativo, sem disciplinas reais. Role para ver os demais semestres.</figcaption>
              </figure>
            }
          />
          <Linha
            titulo="Um assistente que age na sua grade"
            texto="Zefe conversa em português, sabe em que tela você está e, no futuro, vai adicionar turmas e marcar disciplinas por você, com botão de desfazer. Por enquanto o acesso é restrito; todo o resto do site funciona sem ele."
            visual={
              <div className="flex items-center gap-4 rounded-2xl border bg-painel p-5 shadow-suave">
                <Mascote estado="pensando" tamanho={72} decorativo />
                <div>
                  <p className="font-heading font-semibold">Zefe</p>
                  <p className="text-sm text-muted-foreground">Assistente em breve</p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-primary p-8 text-primary-foreground lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-[48ch] space-y-2">
            <h2 className="text-3xl font-semibold">Entre em menos de um minuto.</h2>
            <p className="opacity-90">
              Só e-mail e um código, sem senha da DAC. Quatro perguntas e a sua árvore já vem preenchida para você
              corrigir.
            </p>
          </div>
          <Button
            render={<Link href="/entrar" />}
            nativeButton={false}
            variant="secondary"
            className="h-11 px-5 text-base"
          >
            Entrar <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </>
  );
}

function Linha({ titulo, texto, visual, inverter }: { titulo: string; texto: string; visual: React.ReactNode; inverter?: boolean }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={`min-w-0 space-y-3 ${inverter ? "lg:order-2" : ""}`}>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h2>
        <p className="max-w-[56ch] text-muted-foreground">{texto}</p>
      </div>
      <div className={`min-w-0 ${inverter ? "lg:order-1" : ""}`}>{visual}</div>
    </div>
  );
}
