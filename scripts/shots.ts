// Captura as telas do Zefe (1440 e 390 px, claro e escuro) em .shots/. Uso: bun run shots, com o app rodando.
import { chromium, type Browser, type BrowserContext } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { and, eq, isNotNull, gte } from "drizzle-orm";
import { db, horario, oferecimento, professor, turma, turmaProfessor, user, verification } from "@/db";

const BASE = process.env.ZEFE_URL ?? "http://127.0.0.1:4100";
const EMAIL = "demo@zefe.local";
const SAIDA = resolve(".shots");
const LARGURAS = [
  { largura: 1440, altura: 900 },
  { largura: 390, altura: 844 },
] as const;
const TEMAS = ["claro", "escuro"] as const;

type Alvo = { rota: string; nome: string; publica?: boolean };

function sair(msg: string): never {
  console.error(msg);
  process.exit(1);
}

// Escuro só com data-theme="dark" no <html> (sem seguir o sistema). O script roda antes do <html> existir, então espera por ele.
function temaEscuro() {
  const aplicar = () => document.documentElement.setAttribute("data-theme", "dark");
  if (document.documentElement) aplicar();
  else
    new MutationObserver((_, o) => {
      if (document.documentElement) {
        aplicar();
        o.disconnect();
      }
    }).observe(document, { childList: true });
}

// Playwright pede um chromium de outra revisão: usa o que já está em ~/.cache/ms-playwright.
async function chromeInstalado(): Promise<string | undefined> {
  const base = join(homedir(), ".cache", "ms-playwright");
  const pastas = (await readdir(base).catch(() => [] as string[]))
    .filter((p) => /^chromium-\d+$/.test(p))
    .sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)));
  for (const p of pastas) {
    const caminho = join(base, p, "chrome-linux64", "chrome");
    if (await Bun.file(caminho).exists()) return caminho;
  }
  return undefined;
}

async function abrirNavegador(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (erro) {
    const caminho = await chromeInstalado();
    if (!caminho) throw erro;
    return chromium.launch({ executablePath: caminho });
  }
}

// Código direto da tabela verification (OTP guardado em texto puro localmente): identificador "sign-in-otp-<email>", valor "<código>:<tentativas>".
async function entrarComoDemo(browser: Browser) {
  const ctx = await browser.newContext();
  try {
    const cabecalhos = { Origin: BASE, "Content-Type": "application/json" };
    const envio = await ctx.request.post(`${BASE}/api/auth/email-otp/send-verification-otp`, {
      headers: cabecalhos,
      data: { email: EMAIL, type: "sign-in" },
    });
    if (!envio.ok()) sair(`Envio do código falhou: HTTP ${envio.status()} ${await envio.text()}`);

    const [linha] = await db
      .select({ valor: verification.value })
      .from(verification)
      .where(eq(verification.identifier, `sign-in-otp-${EMAIL}`));
    if (!linha) sair("Código não apareceu na tabela verification.");
    const otp = linha.valor.slice(0, linha.valor.lastIndexOf(":"));

    const login = await ctx.request.post(`${BASE}/api/auth/sign-in/email-otp`, {
      headers: cabecalhos,
      data: { email: EMAIL, otp },
    });
    if (!login.ok()) sair(`Login falhou: HTTP ${login.status()} ${await login.text()}`);

    const sessao = await (await ctx.request.get(`${BASE}/api/auth/get-session`)).json();
    if (sessao?.user?.email !== EMAIL) sair("Login não criou sessão para o usuário demo.");
    return await ctx.storageState();
  } finally {
    await ctx.close();
  }
}

// Professor e sala reais: preferir o que aparece em SI702 e em semestres que o app mostra (2024 em diante).
async function dadosReais() {
  const [prof] = await db
    .select({ slug: professor.slug })
    .from(professor)
    .innerJoin(turmaProfessor, eq(turmaProfessor.professor_id, professor.id))
    .innerJoin(turma, eq(turma.id, turmaProfessor.turma_id))
    .innerJoin(oferecimento, eq(oferecimento.id, turma.oferecimento_id))
    .where(and(eq(oferecimento.codigo, "SI702"), gte(oferecimento.ano, 2024)))
    .limit(1);
  const [sala] = await db
    .select({ sala: horario.sala })
    .from(horario)
    .innerJoin(turma, eq(turma.id, horario.turma_id))
    .innerJoin(oferecimento, eq(oferecimento.id, turma.oferecimento_id))
    .where(and(eq(oferecimento.codigo, "SI702"), gte(oferecimento.ano, 2024), isNotNull(horario.sala)))
    .limit(1);
  const profSlug = prof?.slug ?? (await db.select({ slug: professor.slug }).from(professor).limit(1))[0]?.slug;
  const salaNome =
    sala?.sala ??
    (
      await db
        .select({ sala: horario.sala })
        .from(horario)
        .innerJoin(turma, eq(turma.id, horario.turma_id))
        .innerJoin(oferecimento, eq(oferecimento.id, turma.oferecimento_id))
        .where(and(gte(oferecimento.ano, 2024), isNotNull(horario.sala)))
        .limit(1)
    )[0]?.sala;
  if (!profSlug) sair("Nenhum professor no banco. Rode `bun run sync caderno <ano> <periodo>`.");
  if (!salaNome) sair("Nenhuma sala no banco. Rode `bun run sync caderno <ano> <periodo>`.");
  return { profSlug, salaNome };
}

async function capturar(
  browser: Browser,
  alvo: Alvo,
  { largura, altura }: (typeof LARGURAS)[number],
  tema: (typeof TEMAS)[number],
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>> | undefined,
  sufixo: string,
) {
  const ctx = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 1,
    storageState,
  });
  try {
    if (tema === "escuro") await ctx.addInitScript(temaEscuro);
    const page = await ctx.newPage();
    const resposta = await page.goto(BASE + alvo.rota, { waitUntil: "load", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    if (tema === "escuro") {
      const attr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      if (attr !== "dark") throw new Error(`data-theme ausente em ${alvo.rota}`);
    }
    const arquivo = `${alvo.nome}${sufixo}-${largura}-${tema}.png`;
    await page.screenshot({ path: join(SAIDA, arquivo), fullPage: true });
    return { arquivo, status: resposta?.status() ?? 0 };
  } finally {
    await ctx.close();
  }
}

async function main() {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(5000) });
  } catch {
    sair(`O app não responde em ${BASE}. Suba com \`bun run dev\` antes de capturar.`);
  }
  const [demo] = await db.select({ id: user.id }).from(user).where(eq(user.email, EMAIL));
  if (!demo) sair(`Usuário ${EMAIL} não existe. Rode \`bun run demo\` antes de capturar.`);

  const { profSlug, salaNome } = await dadosReais();
  const alvos: Alvo[] = [
    { rota: "/", nome: "inicio", publica: true },
    { rota: "/sobre", nome: "sobre" },
    { rota: "/entrar", nome: "entrar", publica: true },
    { rota: "/comecar", nome: "comecar" },
    { rota: "/planejador", nome: "planejador" },
    { rota: "/arvore", nome: "arvore" },
    { rota: "/busca?q=calculo", nome: "busca-calculo" },
    { rota: "/disciplina/SI702", nome: "disciplina-SI702" },
    { rota: `/professor/${profSlug}`, nome: `professor-${profSlug}` },
    { rota: `/sala/${encodeURIComponent(salaNome)}`, nome: `sala-${salaNome}` },
    { rota: "/rota-que-nao-existe", nome: "404" },
  ];

  await mkdir(SAIDA, { recursive: true });
  const browser = await abrirNavegador();
  const erros: string[] = [];
  let total = 0;
  let falhou = false;
  try {
    const sessao = await entrarComoDemo(browser);
    const execucoes: [Alvo, Awaited<ReturnType<BrowserContext["storageState"]>> | undefined, string][] = [
      ...alvos.map((a): [Alvo, typeof sessao, string] => [a, sessao, ""]),
      ...alvos.filter((a) => a.publica).map((a): [Alvo, undefined, string] => [a, undefined, "-sem-login"]),
    ];
    for (const [alvo, estado, sufixo] of execucoes) {
      for (const larg of LARGURAS) {
        for (const tema of TEMAS) {
          const rotulo = `${alvo.rota} (${larg.largura}, ${tema}${sufixo})`;
          try {
            const { status } = await capturar(browser, alvo, larg, tema, estado, sufixo);
            total++;
            if (status >= 500) {
              falhou = true;
              erros.push(`HTTP ${status} em ${rotulo}`);
            } else if (status >= 400 && alvo.nome !== "404") {
              erros.push(`HTTP ${status} em ${rotulo}`);
            }
          } catch (erro) {
            falhou = true;
            erros.push(`falha em ${rotulo}: ${(erro as Error).message}`);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`${total} capturas em ${SAIDA}`);
  for (const e of erros) console.log(`  ! ${e}`);
  if (!erros.length) console.log("  sem erros de status");
  process.exit(falhou ? 1 : 0);
}

await main();
