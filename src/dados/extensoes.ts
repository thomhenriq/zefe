import { sql } from 'drizzle-orm';
import { db } from '@/db';

let pronto: Promise<void> | null = null;

/** Cria as extensões usadas pelas consultas (idempotente; uma vez por processo). Também roda em `bun run db:extensoes`. */
export function garantirExtensoes(): Promise<void> {
  pronto ??= (async () => {
    const existe = async () => (await db.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'unaccent'`)).length > 0;
    if (await existe()) return; // evita o NOTICE do CREATE ... IF NOT EXISTS a cada processo
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
    } catch (e) {
      // dois processos criando ao mesmo tempo podem colidir; se a extensão existe agora, está tudo certo
      if (!(await existe())) { pronto = null; throw e; }
    }
  })();
  return pronto;
}
