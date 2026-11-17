/** Lista de e-mails com acesso ao Zefe (ZEFE_LIBERADOS, separada por vírgula). Lida a cada chamada, só no servidor. */
export const parseLiberados = (v: string | undefined): Set<string> =>
  new Set((v ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));

export const emailLiberado = (email: string, lista: string | undefined = process.env.ZEFE_LIBERADOS): boolean =>
  parseLiberados(lista).has(email.trim().toLowerCase());
