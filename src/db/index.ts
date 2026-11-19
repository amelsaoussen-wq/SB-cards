import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Accepte plusieurs noms de variables selon l'hébergeur :
 * - DATABASE_URL (manuel / Neon / local)
 * - POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING
 *   (intégration Postgres de Vercel)
 */
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    undefined
  );
}

const databaseUrl = resolveDatabaseUrl();
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// À l'exécution, une URL est obligatoire. Pendant `next build`, on tolère son
// absence (placeholder) pour que la compilation réussisse ; la connexion
// réelle n'est établie qu'à la première requête.
if (!databaseUrl && !isBuildPhase) {
  throw new Error(
    "DATABASE_URL (ou POSTGRES_URL) est requis. Ajoutez-le dans les variables d'environnement.",
  );
}

const effectiveUrl =
  databaseUrl ?? "postgresql://build:build@127.0.0.1:5432/build";

// SSL requis pour les bases distantes (Neon, Supabase…), pas en local.
const isLocal = /@(localhost|127\.0\.0\.1)/.test(effectiveUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: effectiveUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production" && databaseUrl) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
