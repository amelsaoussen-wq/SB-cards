import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// À l'exécution, DATABASE_URL est obligatoire. Pendant `next build`, on tolère
// son absence (placeholder) afin que la compilation réussisse même si la
// variable n'est pas encore définie sur l'hébergeur ; la connexion réelle
// n'est établie qu'à la première requête.
if (!databaseUrl && !isBuildPhase) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString:
      databaseUrl ?? "postgresql://build:build@127.0.0.1:5432/build",
  });

if (process.env.NODE_ENV !== "production" && databaseUrl) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
