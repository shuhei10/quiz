import type { Question } from "../types/quiz";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "クロンボー城の建築様式として正しいものはどれ？",
    choices: [
      { id: "A", text: "ゴシック様式" },
      { id: "B", text: "ルネサンス様式" },
      { id: "C", text: "バロック様式" },
      { id: "D", text: "ロマネスク様式" },
    ],
    answerId: "B",
    explanation: "クロンボー城は主にルネサンス様式で知られます。",
  },
];
