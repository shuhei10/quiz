import { useState } from "react";
import type { AppScreen, Grade, Mode, Question } from "./types/types";
import { loadQuestionsByGradeAndChapter } from "./lib/questionsLoader";
import { pickRandomQuestions } from "./lib/quizUtils";
import { addWrongIds, loadWrongIds, removeWrongIds } from "./lib/storage";

import Home from "./_screens_unused/Home";
import Quiz from "./_screens_unused/Quiz";
import Result from "./_screens_unused/Result";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [result, setResult] = useState<{ total: number; correct: number; wrongIds: string[] } | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(4);
  const [selectedChapter, setSelectedChapter] = useState<string>(""); // ★追加
  const [mode, setMode] = useState<Mode>("normal");
  const [reviewCompleted, setReviewCompleted] = useState(false);

  // ★grade×chapterで復習数を出す
  const getReviewCount = (grade: Grade, chapter: string) => loadWrongIds(grade, chapter).length;

  // ★chapterを受け取る
  const start = async (opts: { grade: Grade; chapter: string; count: number; mode: Mode }) => {
    try {
      setLoading(true);
      setLoadError(null);

      setSelectedGrade(opts.grade);
      setSelectedChapter(opts.chapter);
      setMode(opts.mode);
      setReviewCompleted(false);

      const all: Question[] = await loadQuestionsByGradeAndChapter(opts.grade, opts.chapter);

      let pool: Question[] = all;
      if (opts.mode === "review") {
        const wrongSet = new Set(loadWrongIds(opts.grade, opts.chapter));
        pool = all.filter((q: Question) => wrongSet.has(q.id));
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
      addWrongIds(selectedGrade, selectedChapter, r.wrongIds);
      setReviewCompleted(false);
    } else {
      removeWrongIds(selectedGrade, selectedChapter, r.correctIds);
      const after = loadWrongIds(selectedGrade, selectedChapter);
      setReviewCompleted(after.length === 0);
    }

    setResult({ total: quiz.length, correct: r.correct, wrongIds: r.wrongIds });
    setScreen("result");
  };

  const goHome = () => {
    setScreen("home");
    setQuiz([]);
  };

  if (screen === "quiz") {
    return <Quiz quiz={quiz} mode={mode} onFinish={finish} />;
  }

  if (screen === "result" && result) {
    return (
      <Result
        total={result.total}
        correct={result.correct}
        wrongCount={result.wrongIds.length}
        mode={mode}
        reviewCompleted={reviewCompleted}
        onHome={goHome}
      />
    );
  }

  return (
    <Home
      onStart={start}
      getReviewCount={getReviewCount}
      loading={loading}
      loadError={loadError}
    />
  );
}
