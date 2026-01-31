export type AppScreen = "home" | "quiz" | "result";
export type Mode = "normal" | "review";

export type Grade = 1 | 2 | 3 | 4;

export type Choice = {
  id: string;     // "A" "B" "C" "D"
  text: string;
};

export type Question = {
  id: string;
  title: string;
  choices: Choice[];
  answerId: string;
  explanation?: string;
};
