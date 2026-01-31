import { useState } from "react";
import type { Grade, Question } from "./types";
import { loadQuestionsByGrade } from "./lib/questionsLoader";
import { pickRandomQuestions } from "./lib/quiz";
import { addWrongIds, loadWrongIds, removeWrongIds } from "./lib/storage";

import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

type Screen = "home" | "quiz" | "result";
type Mode = "normal" | "review";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [result, setResult] = useState<{ total: number; correct: number; wrongIds: string[] } | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(4);
  const [mode, setMode] = useState<Mode>("normal");

  const getReviewCount = (grade: Grade) => loadWrongIds(grade).length;

  const start = async (opts: { grade: Grade; count: number; mode: Mode }) => {
    try {
      setLoading(true);
      setLoadError(null);

      setSelectedGrade(opts.grade);
      setMode(opts.mode);

      const all = await loadQuestionsByGrade(opts.grade);

      let pool = all;
      if (opts.mode === "review") {
        const wrongSet = new Set(loadWrongIds(opts.grade));
        pool = all.filter((q) => wrongSet.has(q.id));
      }

      const picked = pickRandomQuestions(pool, opts.count);

      setQuiz(picked);
      setResult(null);
      setScreen("quiz");
    } catch (e: any) {
      setLoadError(String(e?.message ?? e));
      setScreen("home");
    } finally {
      setLoading(false);
    }
  };

  const finish = (r: { correct: number; wrongIds: string[]; correctIds: string[] }) => {
    if (mode === "normal") {
      addWrongIds(selectedGrade, r.wrongIds);
    } else {
      // 復習：正解したら弱点から削除
      removeWrongIds(selectedGrade, r.correctIds);
    }

    setResult({ total: quiz.length, correct: r.correct, wrongIds: r.wrongIds });
    setScreen("result");
  };

  const goHome = () => {
    setScreen("home");
    setQuiz([]);
  };

  if (screen === "quiz") return <Quiz quiz={quiz} onFinish={finish} />;

  if (screen === "result" && result) {
    return <Result total={result.total} correct={result.correct} wrongCount={result.wrongIds.length} onHome={goHome} />;
  }

  return <Home onStart={start} getReviewCount={getReviewCount} loading={loading} loadError={loadError} />;
}
