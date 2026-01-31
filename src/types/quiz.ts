// 画面状態
export type AppScreen = "home" | "quiz" | "result";

// モード
export type Mode = "normal" | "review";

// 級（※ 必ず Question より前に定義）
export type Grade = 1 | 2 | 3 | 4;

// 章（屋久島・奄美大島など）
export type Chapter = string;

// 選択肢（※ Question より前）
export type Choice = {
  id: string;   // "A" "B" "C" "D"
  text: string;
};

// 問題
export type Question = {
  id: string;
  grade: Grade;        // ← ここで使う
  chapter: Chapter;    // ← 章
  title: string;
  choices: Choice[];   // ← ここで使う
  answerId: string;
  explanation?: string;
  explanationEn?: string;
};
