import type { CardStatus } from "@/lib/constants";

export type CardInput = {
  id?: string;
  diagnosis: string;
  questionLabel: string;
  specialty: string;
  difficulty: string;
  status: CardStatus;
  summary: string;
  explanation: string;
  logoInitials: string;
  footerLabel: string;
  socialUrl: string;
  clues: string[];
};
