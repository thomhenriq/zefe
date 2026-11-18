import type { Metadata, Viewport } from "next";
import { Fustat } from "next/font/google";
import "./globals.css";

const fustat = Fustat({ subsets: ["latin"], variable: "--font-fustat", display: "swap" }); // única fonte do app (sistema v2)

export const metadata: Metadata = {
  title: { default: "Zefe", template: "%s · Zefe" },
  description: "Planejador de grade e integralização para alunos da Unicamp, com um assistente. Projeto independente, não oficial.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f7f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fustat.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-6 focus:py-3 focus:font-medium focus:text-primary-foreground"
        >
          Ir para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
