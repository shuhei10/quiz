export type Grade = 4 | 3 | 2;
export type QuestionType = "choice" | "blank_choice";

export type Question = {
  id: string;
  grade: Grade;
  type?: QuestionType; // 省略時はchoice扱い
  text: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  image?: string;  
  tags?: string[];
};
