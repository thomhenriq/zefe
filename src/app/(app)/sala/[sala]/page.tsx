import Link from "next/link";
import { notFound } from "next/navigation";
import { getSala } from "@/dados/salas";
import { GradeSemanal } from "@/components/grade/GradeSemanal";
import { parseSemestre, rotuloSemestre, semestresDesde } from "@/dominio/semestre";
import { proximoSemestre } from "@/dominio/oferta";
import { Pagina } from "@/components/consulta";

export const dynamic = "force-dynamic";

export default async function PaginaSala({ params, searchParams }: { params: Promise<{ sala: string }>; searchParams: Promise<{ s?: string }> }) {
  const nome = decodeURIComponent((await params).sala);
  const pedido = parseSemestre((await searchParams).s);
  // shortcut: um getSala por semestre candidato (até 2024), trocar por uma consulta de semestres da sala se ficar lento
  const candidatos = semestresDesde(proximoSemestre(), 2024);
  const resultados = await Promise.all(candidatos.map((c) => getSala(nome, c.ano, c.periodo)));
  const com = candidatos.filter((_, i) => resultados[i]);
  if (!com.length) notFound();
  const escolhido = (pedido && com.find((c) => c.ano === pedido.ano && c.periodo === pedido.periodo)) || com[0]!;
  const sala = resultados[candidatos.indexOf(escolhido)]!;
  return (
    <Pagina>
      <div>
        <h1 className="font-mono text-4xl">{sala.sala}</h1>
        <p className="text-muted-foreground">Ocupação semanal em {rotuloSemestre(escolhido.ano, escolhido.periodo)}, segundo o caderno da DAC.</p>
      </div>
      <nav aria-label="Semestre" className="flex flex-wrap gap-2">
        {com.map((c) => {
          const ativo = c === escolhido;
          return (
            <Link key={`${c.ano}-${c.periodo}`} href={`?s=${c.ano}-${c.periodo}`} aria-current={ativo ? "true" : undefined} className={`rounded-full border px-3 py-1 text-sm ${ativo ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
              {rotuloSemestre(c.ano, c.periodo)}
            </Link>
          );
        })}
      </nav>
      <GradeSemanal itens={sala.ocupacao.map((o) => ({ rotulo: `${o.codigo} ${o.turma}`, dia: o.dia, inicio: o.inicio, fim: o.fim, tom: "cursando", href: `/disciplina/${o.codigo}` }))} />
    </Pagina>
  );
}
