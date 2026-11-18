import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "Sobre" };

export default function Sobre() {
  return (
    <article className="mx-auto max-w-[68ch] space-y-8 px-4 py-10 lg:px-6 lg:py-16">
      <header className="space-y-3">
        <h1 className="text-ds-h2">Sobre o Zefe</h1>
        <p className="text-xl text-muted-foreground">
          Uma evolução do GDE: as mesmas funções que os alunos usam, numa interface feita para o celular, com um
          assistente dentro.
        </p>
      </header>

      <aside className="flex gap-3 rounded-xl border border-border bg-accent p-4 text-accent-foreground" role="note">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-sm">
          <strong className="font-bold">O Zefe não é oficial.</strong> Não é um produto da Unicamp nem da DAC, e
          não tem vínculo com eles. Para matrícula e dados acadêmicos valem sempre os sistemas oficiais.
        </p>
      </aside>

      <Secao titulo="O nome">
        Zefe vem de Zeferino Vaz, fundador da Unicamp. É o nome do produto e da capivara que acompanha você pelas telas.
      </Secao>
      <Secao titulo="De onde vêm os dados">
        Horários, salas, vagas e professores vêm do caderno de horários público da DAC; ementas, créditos e
        pré-requisitos, do catálogo público. Tudo é sincronizado antes e guardado; as páginas nunca consultam a DAC na
        hora. Horário, crédito, pré-requisito e conflito são calculados a partir desses dados, nunca escritos por um
        modelo de linguagem.
      </Secao>
      <Secao titulo="Previsão e dúvida">
        Quando o caderno de um semestre ainda não saiu, o Zefe mostra a oferta provável com base em semestres
        anteriores, sempre com a etiqueta &ldquo;previsão&rdquo; e a evidência. Regras do catálogo que o Zefe não
        entende aparecem com o texto original e a marca &ldquo;não verificado&rdquo;, nunca como palpite.
      </Secao>
      <Secao titulo="Senha e privacidade">
        Nenhuma senha de SIGA, GDE ou da DAC passa pelo Zefe. Você entra com e-mail e um código, e seus dados e grades
        são só seus.
      </Secao>
      <Secao titulo="O assistente">
        O Zefe, o assistente, está em preparação e por enquanto só funciona para uma lista restrita. Todas as outras
        telas funcionam sem ele.
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}
