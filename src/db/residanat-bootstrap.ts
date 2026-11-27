import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Kept alongside the Drizzle schema for deployments using runtime bootstrap.
const DDL = `
CREATE TABLE IF NOT EXISTS residanat_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL CONSTRAINT residanat_questions_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,
  specialty text NOT NULL,
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_option_ids jsonb NOT NULL,
  explanation text NOT NULL,
  source text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS residanat_questions_user_specialty_idx ON residanat_questions(user_id, specialty);
ALTER TABLE residanat_questions ADD COLUMN IF NOT EXISTS lesson text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS residanat_questions_user_lesson_idx ON residanat_questions(user_id, specialty, lesson);
ALTER TABLE residanat_questions ADD COLUMN IF NOT EXISTS document_key text;
ALTER TABLE residanat_questions ADD COLUMN IF NOT EXISTS source_number integer;
ALTER TABLE residanat_questions ADD COLUMN IF NOT EXISTS source_page integer;
CREATE UNIQUE INDEX IF NOT EXISTS residanat_questions_source_unique ON residanat_questions(user_id, document_key, source_number);
CREATE TABLE IF NOT EXISTS residanat_document_imports (
  user_id uuid NOT NULL CONSTRAINT residanat_document_imports_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,
  document_key text NOT NULL,
  title text NOT NULL,
  source_url text NOT NULL,
  source_sha256 text NOT NULL,
  question_count integer NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT residanat_document_imports_user_id_document_key_pk PRIMARY KEY (user_id, document_key)
);
CREATE TABLE IF NOT EXISTS residanat_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL CONSTRAINT residanat_attempts_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL CONSTRAINT residanat_attempts_question_id_residanat_questions_id_fk REFERENCES residanat_questions(id) ON DELETE CASCADE,
  question_version integer NOT NULL,
  selected_option_ids jsonb NOT NULL,
  is_correct boolean NOT NULL,
  feedback jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS residanat_attempts_user_date_idx ON residanat_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS residanat_attempts_question_idx ON residanat_attempts(question_id);
CREATE TABLE IF NOT EXISTS residanat_sample_imports (
  user_id uuid PRIMARY KEY CONSTRAINT residanat_sample_imports_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

let schemaReady: Promise<void> | null = null;

async function initializeSchema(): Promise<void> {
  await db.transaction(async (tx) => {
    // PostgreSQL transaction lock prevents concurrent serverless instances racing on DDL.
    await tx.execute(sql`select pg_advisory_xact_lock(81420933)`);
    await tx.execute(sql.raw(DDL));
  });
}

export function ensureResidanatSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initializeSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
