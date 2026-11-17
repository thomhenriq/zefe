import Link from "next/link";
import { Mascote } from "@/components/zefe/Mascote";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md font-heading text-lg font-semibold tracking-tight">
      <Mascote tamanho={32} decorativo />
      Zefe
    </Link>
  );
}
