"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/auth-client";

export const campo =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

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
    if (error) return setErro("Não foi possível enviar o código. Confira o e-mail e tente de novo.");
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
      <Button type="submit" disabled={ocupado} className="h-11 w-full text-base">Receber código</Button>
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
          className={`${campo} font-mono text-xl tracking-[0.4em] tabular`} />
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={ocupado || codigo.length !== 6} className="h-11 w-full text-base">Entrar</Button>
      <Button type="button" variant="ghost" onClick={() => { setEtapa("email"); setCodigo(""); setErro(null); }}>
        Usar outro e-mail
      </Button>
    </form>
  );
}
