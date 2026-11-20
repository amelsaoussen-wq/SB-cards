import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  clinic: text("clinic").notNull().default(""),
  role: text("role").notNull().default("Concepteur de cartes"),
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

export type UserRow = typeof users.$inferSelect;
export type CardRow = typeof cards.$inferSelect;
export type ClueRow = typeof clues.$inferSelect;
export type AuthAttemptRow = typeof authAttempts.$inferSelect;
