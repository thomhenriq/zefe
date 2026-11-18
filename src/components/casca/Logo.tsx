import Link from "next/link";
import { Mascote } from "@/components/zefe/Mascote";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-full font-heading text-xl font-bold tracking-[-0.03em]">
      <Mascote tamanho={32} decorativo />
      Zefe
    </Link>
  );
}
