import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario } from "@/sessao";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoBadge, AvisoBadge, type EstadoDisciplina } from "@/components/ui/estado";
import { Mascote } from "@/components/zefe/Mascote";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
// Ilustração abstrata da grade (sem disciplinas reais): [dia, linha, altura, estilo]
const blocos: [number, number, number, string][] = [
  [0, 1, 2, "bg-planejada-bg border-planejada-borda"],
  [1, 3, 2, "bg-planejada-bg border-planejada-borda"],
  [2, 1, 2, "bg-conflito-bg border-conflito-borda"],
  [2, 2, 2, "bg-planejada-bg border-planejada-borda"],
  [3, 3, 2, "bg-planejada-bg border-planejada-borda"],
  [4, 0, 2, "bg-planejada-bg border-planejada-borda"],
  [4, 4, 1, "bg-travada-bg border-travada-borda"],
];

const estados: EstadoDisciplina[] = ["cursada", "cursando", "planejada", "faltando", "travada"];

export default async function Apresentacao() {
  if (await getUsuario()) redirect("/planejador");
  return (
    <>
      <section className="px-3 pt-3 lg:px-4 lg:pt-4">
        <div className="mx-auto grid max-w-[88rem] items-center gap-10 overflow-hidden rounded-[2rem] border bg-[radial-gradient(ellipse_at_85%_10%,color-mix(in_oklch,var(--capi-claro)_38%,transparent),transparent_55%),radial-gradient(ellipse_at_10%_100%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_55%)] px-6 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-16 lg:py-24">
          <div className="space-y-6">
            <h1 className="anim-subir text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-7xl lg:leading-[1.02]">
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
            </div>
          </div>

          <div className="anim-subir anim-subir-2 relative mx-auto w-full max-w-md pb-16 lg:pb-0">
            <GradeIlustrada className="relative z-0 w-[88%] shadow-elevada" />
            <div className="absolute right-0 bottom-0 z-10 flex max-w-[16rem] items-end gap-2 lg:-bottom-12 lg:-right-4">
              <Mascote estado="feliz" tamanho={132} />
              <p className="mb-6 rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-sm shadow-suave">
                Oi, eu sou o Zefe.
              </p>
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
              <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-suave">
                <div className="flex flex-wrap gap-2">
                  {estados.map((e) => (
                    <EstadoBadge key={e} estado={e} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <AvisoBadge nivel="aviso" />
                  <AvisoBadge nivel="previsao" />
                  <AvisoBadge nivel="naoverificado" />
                </div>
              </div>
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
      <div className={`space-y-3 ${inverter ? "lg:order-2" : ""}`}>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h2>
        <p className="max-w-[56ch] text-muted-foreground">{texto}</p>
      </div>
      <div className={inverter ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

function GradeIlustrada({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-6 gap-1.5 rounded-2xl border bg-card p-4 shadow-suave ${className}`} role="img" aria-label="Ilustração de uma grade semanal com um conflito de horário destacado">
      {dias.map((d, i) => (
        <div key={d} className="space-y-1.5">
          <p className="text-center text-xs font-medium text-muted-foreground">{d}</p>
          <div className="relative h-40">
            {blocos
              .filter(([dia]) => dia === i)
              .map(([, linha, alt, estilo], k) => (
                <div
                  key={k}
                  className={`absolute inset-x-0 rounded-md border ${estilo}`}
                  style={{ top: `${linha * 20}%`, height: `${alt * 20 - 3}%` }}
                />
              ))}
          </div>
        </div>
      ))}
      <div className="col-span-6 flex flex-wrap gap-2 pt-1">
        <AvisoBadge nivel="conflito" />
        <EstadoBadge estado="planejada" />
      </div>
    </div>
  );
}
