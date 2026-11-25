import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { cards, clues, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL CONSTRAINT users_email_unique UNIQUE,
  password_hash text NOT NULL,
  clinic text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Concepteur de cartes',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT '';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '';
UPDATE cards SET published_at = updated_at WHERE status = 'published' AND published_at IS NULL;
UPDATE users SET is_admin = true WHERE lower(email) = 'amelsaoussen@gmail.com';

-- Nettoyage des comptes de test créés lors des vérifications (idempotent).
DELETE FROM users WHERE
  email LIKE 'userA%@test.fr' OR email LIKE 'userB%@test.fr' OR
  email LIKE 'chA%@test.fr' OR email LIKE 'chB%@test.fr' OR
  email LIKE 'inter%@test.fr' OR email = 'verify-live@sb-cards.app';

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnosis text NOT NULL,
  question_label text NOT NULL DEFAULT 'Quel est le diagnostic ?',
  specialty text NOT NULL DEFAULT 'Médecine materno-fœtale',
  difficulty text NOT NULL DEFAULT 'Intermédiaire',
  status text NOT NULL DEFAULT 'draft',
  summary text NOT NULL DEFAULT '',
  share_code text NOT NULL CONSTRAINT cards_share_code_unique UNIQUE,
  logo_initials text NOT NULL DEFAULT 'SB',
  footer_label text NOT NULL DEFAULT 'Suivez notre page sur Facebook',
  social_url text NOT NULL DEFAULT 'https://www.facebook.com/sb.medical.cards',
  views integer NOT NULL DEFAULT 0,
  prints integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards(user_id);
CREATE INDEX IF NOT EXISTS cards_updated_at_idx ON cards(updated_at);

CREATE TABLE IF NOT EXISTS clues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  position integer NOT NULL,
  body text NOT NULL
);
CREATE INDEX IF NOT EXISTS clues_card_id_idx ON clues(card_id);

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_pair_unique UNIQUE (follower_id, channel_id)
);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_channel_idx ON follows(channel_id);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT likes_pair_unique UNIQUE (card_id, user_id)
);
CREATE INDEX IF NOT EXISTS likes_card_idx ON likes(card_id);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_card_idx ON comments(card_id);

CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_card_idx ON attempts(card_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT '',
  kind text NOT NULL,
  ok integer NOT NULL DEFAULT 0,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

export const DEMO_EMAIL = "demo@sb-cards.app";
export const DEMO_PASSWORD = "demo1234";
// La chaîne de démonstration porte la marque (pas un nom de personne).
export const DEMO_NAME = "SB Cards — Officiel";
export const DEMO_CLINIC = "La chaîne officielle de la marque SB Cards";
export const DEMO_ROLE = "Chaîne officielle";

type SeedCard = {
  diagnosis: string;
  specialty: string;
  difficulty: string;
  status: string;
  summary: string;
  shareCode: string;
  views: number;
  prints: number;
  daysAgo: number;
  clues: string[];
};

const SEED_CARDS: SeedCard[] = [
  {
    diagnosis:
      "Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure",
    specialty: "Médecine materno-fœtale",
    difficulty: "Expert",
    status: "published",
    summary:
      "Hydrops fœtal non immunologique révélant une alpha-thalassémie majeure chez un couple d’origine vietnamienne.",
    shareCode: "bart-hemoglobine-alpha-thalassemie",
    views: 1842,
    prints: 96,
    daysAgo: 1,
    clues: [
      "Une femme de 28 ans, enceinte de 24 semaines, est orientée vers le service de médecine materno-fœtale suite à des résultats anormaux lors d’une échographie de routine.",
      "Elle indique qu’on lui a diagnostiqué une anémie durant son enfance, mais elle n’a jamais bénéficié d’un suivi. Elle n’a pas d’autres antécédents médicaux.",
      "Elle et son compagnon sont tous deux originaires du Vietnam.",
      "Son hémogramme révèle une anémie microcytaire hypochrome avec un bilan martial normal.",
      "L’échographie fœtale révèle un œdème fœtal massif, une ascite et des épanchements pleuraux compatibles avec un hydrops fœtal.",
      "L’électrophorèse de l’hémoglobine de deux parents révèle un profil compatible avec le trait thalassémique alpha.",
    ],
  },
  {
    diagnosis: "Pré-éclampsie sévère compliquée d’un syndrome HELLP",
    specialty: "Obstétrique",
    difficulty: "Intermédiaire",
    status: "published",
    summary:
      "Céphalées et barre épigastrique au troisième trimestre : un tableau de pré-éclampsie sévère avec hémolyse et thrombopénie.",
    shareCode: "pre-eclampsie-hellp",
    views: 1260,
    prints: 74,
    daysAgo: 3,
    clues: [
      "Une femme de 33 ans, primipare, à 34 semaines d’aménorrhée, consulte aux urgences pour des céphalées persistantes.",
      "Elle présente une tension artérielle à 168/112 mmHg confirmée à deux reprises, associée à des acouphènes.",
      "Son bilan révèle une protéinurie à 4,2 g/24 h et une créatinine à 118 µmol/L.",
      "Les plaquettes sont à 82 000/mm³ et les ASAT à trois fois la limite supérieure de la normale.",
      "Elle rapporte une douleur épigastrique en barre et des vomissements depuis douze heures.",
      "L’échographie obstétricale objective un retard de croissance fœtale et un oligoamnios modéré.",
    ],
  },
  {
    diagnosis: "Grossesse extra-utérine rompue avec hémopéritoine",
    specialty: "Urgences gynécologiques",
    difficulty: "Urgence",
    status: "published",
    summary:
      "Douleur pelvienne aiguë et instabilité hémodynamique à 7 semaines d’aménorrhée : la rupture tubaire ne doit pas être retardée.",
    shareCode: "grossesse-extra-uterine-rompue",
    views: 986,
    prints: 52,
    daysAgo: 5,
    clues: [
      "Une femme de 26 ans, G2P1, consulte pour une douleur pelvienne aiguë à 7 semaines d’aménorrhée.",
      "Elle décrit des métrorragies brunâtres depuis cinq jours et des vertiges à l’orthostatisme.",
      "À l’examen : défense abdominale, douleur du cul-de-sac de Douglas et pouls à 118/min.",
      "La tension artérielle est à 88/54 mmHg avec une pâleur cutanéo-muqueuse marquée.",
      "L’échographie endovaginale ne retrouve aucune grossesse intra-utérine et un utérus vide.",
      "Le dosage des β-hCG est à 3 400 UI/L et l’hémoglobine à 7,8 g/dL.",
    ],
  },
  {
    diagnosis: "Diabète gestationnel déséquilibré au deuxième trimestre",
    specialty: "Endocrinologie",
    difficulty: "Débutant",
    status: "draft",
    summary:
      "Hyperglycémie dépistée à 26 semaines : place de la diététique, de l’autosurveillance et de l’insuline.",
    shareCode: "diabete-gestationnel-deséquilibre",
    views: 412,
    prints: 18,
    daysAgo: 8,
    clues: [
      "Une femme de 31 ans, à 26 semaines d’aménorrhée, consulte pour une prise de poids de 9 kg en deux mois.",
      "Elle a des antécédents familiaux de diabète de type 2 chez sa mère et sa grand-mère.",
      "La glycémie à jeun est à 1,12 g/L et le test de charge au glucose retrouve 1,94 g/L à deux heures.",
      "L’échographie montre une macrosomie fœtale avec un périmètre abdominal au 95ᵉ percentile.",
      "Elle rapporte des épisodes de soif intense et une nycturie inhabituelle depuis dix jours.",
      "L’hémoglobine glyquée est à 6,4 % et l’albuminurie est normale.",
    ],
  },
  {
    diagnosis: "Allo-immunisation Rhésus anti-D avec anémie fœtale",
    specialty: "Médecine materno-fœtale",
    difficulty: "Expert",
    status: "published",
    summary:
      "Une patiente Rhésus négatif non immunisée : suivi du titre d’anticorps et transfusion in utero.",
    shareCode: "allo-immunisation-rhesus-anti-d",
    views: 733,
    prints: 41,
    daysAgo: 12,
    clues: [
      "Une femme de 35 ans, G3P2, de groupe O négatif, est suivie à 26 semaines d’aménorrhée.",
      "Sa deuxième grossesse avait nécessité une photothérapie néonatale pour un ictère précoce.",
      "Le test de Coombs indirect révèle un titre d’anticorps anti-D à 1/32 en progression.",
      "L’échographie Doppler de l’artère cérébrale moyenne montre un pic systolique à 1,6 MoM.",
      "Le fœtus présente une hépatomégalie et une ascite débutante à l’échographie.",
      "Le bilan maternel retrouve une hémoglobine à 10,9 g/dL et un taux de réticulocytes augmenté.",
    ],
  },
  {
    diagnosis: "Stéatose hépatique aiguë gravidique",
    specialty: "Hépato-gastro-entérologie",
    difficulty: "Expert",
    status: "draft",
    summary:
      "Troisième trimestre, vomissements et cytolyse hépatique : une urgence rare à ne pas confondre avec un HELLP.",
    shareCode: "steatose-hepatique-aigue-gravidique",
    views: 298,
    prints: 9,
    daysAgo: 18,
    clues: [
      "Une femme de 29 ans, enceinte de 33 semaines, consulte pour vomissements incoercibles et douleur de l’hypocondre droit.",
      "Elle n’a pas d’antécédent d’hépatopathie ni de consommation d’alcool.",
      "La biologie retrouve une cytolyse à 8 N, une bilirubine à 78 µmol/L et un TP à 54 %.",
      "L’hypoglycémie est à 0,48 g/L et l’ammoniémie est discrètement augmentée.",
      "La pression artérielle est à 126/78 mmHg, sans protéinurie significative.",
      "L’échographie hépatique objective une stéatose diffuse avec une veine porte perméable.",
    ],
  },
];

let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap(): Promise<void> {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  } catch (error) {
    console.warn("[bootstrap] pgcrypto extension unavailable", error);
  }
  await pool.query(DDL);

  // Renomme l'ancienne persona de démo vers la marque officielle (idempotent).
  await db
    .update(users)
    .set({ name: DEMO_NAME, clinic: DEMO_CLINIC, role: DEMO_ROLE })
    .where(and(eq(users.email, DEMO_EMAIL), eq(users.name, "Dr Sarah Benali")));

  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const [demoUser] = await db
    .insert(users)
    .values({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      clinic: DEMO_CLINIC,
      role: DEMO_ROLE,
    })
    .returning({ id: users.id });

  if (!demoUser) return;

  for (const seed of SEED_CARDS) {
    const createdAt = new Date(Date.now() - seed.daysAgo * 86_400_000);
    const [card] = await db
      .insert(cards)
      .values({
        userId: demoUser.id,
        diagnosis: seed.diagnosis,
        specialty: seed.specialty,
        difficulty: seed.difficulty,
        status: seed.status,
        summary: seed.summary,
        shareCode: seed.shareCode,
        views: seed.views,
        prints: seed.prints,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: cards.id });

    if (!card) continue;

    await db.insert(clues).values(
      seed.clues.map((body, index) => ({
        cardId: card.id,
        position: index + 1,
        body,
      })),
    );
  }
}

/**
 * Creates the schema when missing and seeds the demo workspace exactly once.
 * Safe to call from any server component / route handler.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((error) => {
      bootstrapPromise = null;
      console.error("[bootstrap] failed", error);
      throw error;
    });
  }
  await bootstrapPromise;
}

export async function safeEnsureDatabaseReady(): Promise<boolean> {
  try {
    await ensureDatabaseReady();
    return true;
  } catch {
    return false;
  }
}

export const bootstrapSql = sql;
