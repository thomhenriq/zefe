"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/auth-client";

export const campo =
  "h-12 w-full rounded-lg border border-input bg-card px-4 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function FormEntrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setOcupado(false);
    if (error) return setErro(error.status === 429 ? "Muitos pedidos de código. Espere um minuto e tente de novo." : "Não foi possível enviar o código. Confira o e-mail e tente de novo.");
    setEtapa("codigo");
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro(null);
    const { error } = await authClient.signIn.emailOtp({ email, otp: codigo });
    if (error) {
      setOcupado(false);
      return setErro("Código incorreto ou expirado. Confira os 6 dígitos ou peça outro.");
    }
    router.push("/planejador");
    router.refresh();
  }

  return etapa === "email" ? (
    <form onSubmit={pedirCodigo} className="mt-8 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email"
          value={email} onChange={(e) => setEmail(e.target.value)} className={campo} placeholder="voce@exemplo.com" />
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={ocupado} className="w-full">Receber código</Button>
    </form>
  ) : (
    <form onSubmit={entrar} className="mt-8 space-y-4">
      <p className="text-sm text-muted-foreground">
        Código enviado para <strong className="text-foreground">{email}</strong>. Rodando local, ele aparece no
        terminal do servidor.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="codigo" className="text-sm font-medium">Código de 6 dígitos</label>
        <input id="codigo" name="codigo" required autoComplete="one-time-code" inputMode="numeric"
          pattern="[0-9]{6}" maxLength={6} value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          className={`${campo} text-xl font-medium tabular-nums tracking-[0.4em]`} />
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={ocupado || codigo.length !== 6} className="w-full">Entrar</Button>
      <Button type="button" variant="ghost" className="w-full" onClick={() => { setEtapa("email"); setCodigo(""); setErro(null); }}>
        Usar outro e-mail
      </Button>
    </form>
  );
}
