// src/types/types.ts
export type AppScreen = "home" | "quiz" | "result";
export type Grade = 2 | 3 | 4;
export type Mode = "normal" | "review" | "test";

export type Choice = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  grade: Grade;
  chapter: string;

  title: string;          // ✅ 問題文はこれ
  choices: Choice[];

  answerId: string;

  explanation?: string;
  explanationEn?: string;
};
