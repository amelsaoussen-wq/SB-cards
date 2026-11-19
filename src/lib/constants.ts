export const SPECIALTIES = [
  "Médecine materno-fœtale",
  "Obstétrique",
  "Urgences gynécologiques",
  "Endocrinologie",
  "Hépato-gastro-entérologie",
  "Cardiologie",
  "Hématologie",
  "Pédiatrie",
  "Infectiologie",
  "Néphrologie",
] as const;

export const DIFFICULTIES = ["Débutant", "Intermédiaire", "Expert", "Urgence"] as const;

export type CardStatus = "draft" | "published";

export const STATUS_LABELS: Record<CardStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
};

/** Fixed clue palette — the design language of the card never changes. */
export const CLUE_TONES = [
  {
    name: "Rose",
    card: "#fbe1ee",
    border: "#f08ec1",
    circle: "#ef5da0",
  },
  {
    name: "Vert",
    card: "#ddf5e5",
    border: "#83d0a2",
    circle: "#2f9f5c",
  },
  {
    name: "Bleu",
    card: "#dbeafb",
    border: "#7db6ea",
    circle: "#2f80d2",
  },
  {
    name: "Orange",
    card: "#fdebd5",
    border: "#f0b169",
    circle: "#e8881c",
  },
  {
    name: "Violet",
    card: "#ece1fb",
    border: "#b895e7",
    circle: "#8647d0",
  },
  {
    name: "Turquoise",
    card: "#d8f4ec",
    border: "#79ceb7",
    circle: "#1d9d7d",
  },
] as const;

export const TONE_COUNT = CLUE_TONES.length;
