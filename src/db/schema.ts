import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  uniqueIndex,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { QcmOption, QcmFeedback } from "@/lib/residanat-model";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  clinic: text("clinic").notNull().default(""),
  role: text("role").notNull().default("Concepteur de cartes"),
  isAdmin: boolean("is_admin").notNull().default(false),
  avatar: text("avatar").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    diagnosis: text("diagnosis").notNull(),
    questionLabel: text("question_label")
      .notNull()
      .default("Quel est le diagnostic ?"),
    specialty: text("specialty").notNull().default("Médecine materno-fœtale"),
    difficulty: text("difficulty").notNull().default("Intermédiaire"),
    status: text("status").notNull().default("draft"),
    summary: text("summary").notNull().default(""),
  explanation: text("explanation").notNull().default(""),
    shareCode: text("share_code").notNull().unique(),
    logoInitials: text("logo_initials").notNull().default("SB"),
    footerLabel: text("footer_label")
      .notNull()
      .default("Suivez notre page sur Facebook"),
    socialUrl: text("social_url")
      .notNull()
      .default("https://www.facebook.com/sb.medical.cards"),
  views: integer("views").notNull().default(0),
  prints: integer("prints").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cards_user_id_idx").on(table.userId),
    index("cards_updated_at_idx").on(table.updatedAt),
  ],
);

export const clues = pgTable(
  "clues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    body: text("body").notNull(),
  },
  (table) => [index("clues_card_id_idx").on(table.cardId)],
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("follows_follower_idx").on(table.followerId),
    index("follows_channel_idx").on(table.channelId),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("likes_card_idx").on(table.cardId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("comments_card_idx").on(table.cardId)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    correct: boolean("correct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("attempts_card_idx").on(table.cardId)],
);

export const passwordResets = pgTable("password_resets", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authAttempts = pgTable("auth_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().default(""),
  kind: text("kind").notNull(),
  ok: integer("ok").notNull().default(0),
  userAgent: text("user_agent").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const residanatQuestions = pgTable("residanat_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  specialty: text("specialty").notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<QcmOption[]>().notNull(),
  correctOptionIds: jsonb("correct_option_ids").$type<string[]>().notNull(),
  explanation: text("explanation").notNull(),
  source: text("source").notNull().default(""),
  documentKey: text("document_key"),
  sourceNumber: integer("source_number"),
  sourcePage: integer("source_page"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("residanat_questions_user_specialty_idx").on(table.userId, table.specialty),
  uniqueIndex("residanat_questions_source_unique").on(table.userId, table.documentKey, table.sourceNumber),
]);

export const residanatDocumentImports = pgTable("residanat_document_imports", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentKey: text("document_key").notNull(),
  title: text("title").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceSha256: text("source_sha256").notNull(),
  questionCount: integer("question_count").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.documentKey] })]);

export const residanatAttempts = pgTable("residanat_attempts", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => residanatQuestions.id, { onDelete: "cascade" }),
  questionVersion: integer("question_version").notNull(),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().notNull(),
  isCorrect: boolean("is_correct").notNull(),
  feedback: jsonb("feedback").$type<QcmFeedback>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("residanat_attempts_user_date_idx").on(table.userId, table.createdAt),
  index("residanat_attempts_question_idx").on(table.questionId),
]);

export const residanatSampleImports = pgTable("residanat_sample_imports", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type CardRow = typeof cards.$inferSelect;
export type ClueRow = typeof clues.$inferSelect;
export type AuthAttemptRow = typeof authAttempts.$inferSelect;
