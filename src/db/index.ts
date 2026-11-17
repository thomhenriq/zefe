import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida (veja .env.example)");

// Em dev o HMR reexecuta este módulo: guarda o cliente em globalThis para não vazar conexões.
const g = globalThis as unknown as { __zefePg?: ReturnType<typeof postgres> };
const client = g.__zefePg ?? postgres(url);
if (process.env.NODE_ENV !== "production") g.__zefePg = client;

export const db = drizzle(client, { schema });
export * from "./schema";
