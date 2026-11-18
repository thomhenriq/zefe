import { buscar } from "@/dados/busca";
import { Pagina } from "@/components/consulta";
import { BuscaPagina } from "@/components/busca/BuscaPagina";

export const metadata = { title: "Busca" };
export const dynamic = "force-dynamic";

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 60) ?? "";
  const r = q ? await buscar(q) : null;
  return (
    <Pagina>
      <h1 className="text-ds-h2">Busca</h1>
      <BuscaPagina q={q} inicial={r} />
    </Pagina>
  );
}
