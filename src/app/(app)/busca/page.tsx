import Link from "next/link";
import { buscar } from "@/dados/busca";
import { Pagina, mono } from "@/components/consulta";

export const metadata = { title: "Busca" };
export const dynamic = "force-dynamic";

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const r = q ? await buscar(q) : null;
  const total = r ? r.disciplinas.length + r.professores.length + r.salas.length : 0;
  return (
    <Pagina>
      <h1 className="text-4xl">Busca</h1>
      <form action="/busca" role="search" className="flex max-w-xl gap-2">
        <label className="flex-1">
          <span className="sr-only">Disciplina, professor ou sala</span>
          <input name="q" type="search" defaultValue={q} placeholder="Disciplina, professor ou sala" autoComplete="off" className="h-10 w-full rounded-lg border bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring" />
        </label>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Buscar</button>
      </form>
      {!r && <p className="text-muted-foreground">Digite um código (SI702), parte de um nome (cálculo, Ana Estela) ou uma sala (PA06).</p>}
      {r && total === 0 && <p role="status">Nada encontrado para <strong>“{q}”</strong>. Tente menos letras ou sem a turma.</p>}
      {r && total > 0 && (
        <div className="space-y-8">
          {r.disciplinas.length > 0 && (
            <section aria-labelledby="h-disc" className="space-y-2">
              <h2 id="h-disc" className="text-xl">Disciplinas <span className="text-sm font-normal text-muted-foreground">({r.disciplinas.length})</span></h2>
              <ul className="divide-y rounded-xl border bg-card">
                {r.disciplinas.map((d) => (
                  <li key={d.codigo}>
                    <Link href={`/disciplina/${d.codigo}`} className="flex items-baseline gap-3 px-4 py-2.5 text-sm hover:bg-muted">
                      <span className={`${mono} w-20 shrink-0 font-semibold`}>{d.codigo}</span>
                      <span className="min-w-0 flex-1">{d.nome}</span>
                      {d.creditos != null && <span className="text-xs text-muted-foreground">{d.creditos} cr.</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {r.professores.length > 0 && (
            <section aria-labelledby="h-prof" className="space-y-2">
              <h2 id="h-prof" className="text-xl">Professores <span className="text-sm font-normal text-muted-foreground">({r.professores.length})</span></h2>
              <ul className="divide-y rounded-xl border bg-card">
                {r.professores.map((p) => (
                  <li key={p.slug}><Link href={`/professor/${p.slug}`} className="block px-4 py-2.5 text-sm hover:bg-muted">{p.nome}</Link></li>
                ))}
              </ul>
            </section>
          )}
          {r.salas.length > 0 && (
            <section aria-labelledby="h-sala" className="space-y-2">
              <h2 id="h-sala" className="text-xl">Salas <span className="text-sm font-normal text-muted-foreground">({r.salas.length})</span></h2>
              <ul className="flex flex-wrap gap-2">
                {r.salas.map((s) => (
                  <li key={s}><Link href={`/sala/${encodeURIComponent(s)}`} className={`${mono} inline-block rounded-lg border bg-card px-3 py-1.5 text-sm hover:bg-muted`}>{s}</Link></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Pagina>
  );
}
