import { useMemo, useState } from "react";
import type { Question, AppScreen } from "../types/types";

type AnswerMap = Record<string, string>; // { [questionId]: choiceId }

export function pickRandomQuestions(pool: Question[], count: number): Question[] {
  const arr = [...pool];

  // Fisher–Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, Math.min(count, arr.length));
}

export function useQuizFlow(questions: Question[]) {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const current = questions[index];

  const score = useMemo(() => {
    let s = 0;
    for (const q of questions) {
      if (answers[q.id] && answers[q.id] === q.answerId) s++;
    }
    return s;
  }, [answers, questions]);

  const start = () => {
    setAnswers({});
    setIndex(0);
    setScreen("quiz");
  };

  const selectAnswer = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const next = () => {
    if (index >= questions.length - 1) {
      setScreen("result");
      return;
    }
    setIndex((v) => v + 1);
  };

  const restart = () => {
    setScreen("home");
  };

  return {
    screen,
    setScreen,
    index,
    current,
    questions,
    answers,
    score,
    start,
    selectAnswer,
    next,
    restart,
  };
}
