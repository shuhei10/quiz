import { useState } from "react";
import type { AppScreen, Grade, Mode, Question } from "./types/types";
import { loadQuestionsByGradeAndChapter } from "./lib/questionsLoader";
import { pickRandomQuestions } from "./lib/quizUtils";
import {
  addWrongIds,
  loadWrongIds,
  removeWrongIds,
  loadAllWrongIdsByGrade,
  removeWrongIdsFromAllChapters,
} from "./lib/storage";

import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

// Home のタブ型（Home.tsx と揃える）
type HomeTab = "practice" | "review" | "test";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [result, setResult] = useState<{ total: number; correct: number; wrongIds: string[] } | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(4);
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [mode, setMode] = useState<Mode>("normal");
  const [reviewCompleted, setReviewCompleted] = useState(false);

  // ★ホームへ戻ったときに表示したいタブ（復習ならreviewのまま等）
  const [homeTab, setHomeTab] = useState<HomeTab>("practice");

  // ★テーマ別復習数
  const getReviewCount = (grade: Grade, chapter: string) =>
    loadWrongIds(grade, chapter.trim()).length;

  // ★総まとめ復習数
  const getReviewCountAll = (grade: Grade) => loadAllWrongIdsByGrade(grade).length;

  const start = async (opts: { grade: Grade; chapter: string; count: number; mode: Mode }) => {
    try {
      setLoading(true);
      setLoadError(null);

      const ch = opts.chapter.trim();

      setSelectedGrade(opts.grade);
      setSelectedChapter(ch);
      setMode(opts.mode);
      setReviewCompleted(false);

      // ★どのタブから開始したかを記憶（復習開始ならreviewへ戻す）
      setHomeTab(opts.mode === "review" ? "review" : "practice");

      const all: Question[] = await loadQuestionsByGradeAndChapter(opts.grade, ch);

      let pool: Question[] = all;

      if (opts.mode === "review") {
        if (ch) {
          // テーマ別復習
          const wrongSet = new Set(loadWrongIds(opts.grade, ch));
          pool = all.filter((q) => wrongSet.has(q.id));
        } else {
          // 総まとめ復習（全テーマ横断）
          const wrongSet = new Set(loadAllWrongIdsByGrade(opts.grade));
          pool = all.filter((q) => wrongSet.has(q.id));
        }
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
    const ch = selectedChapter.trim();

    if (mode === "review") {
      // 復習モード：正解した分を弱点リストから削除
      if (ch) {
        // テーマ別復習
        removeWrongIds(selectedGrade, ch, r.correctIds);
        const after = loadWrongIds(selectedGrade, ch);
        setReviewCompleted(after.length === 0);
      } else {
        // 総まとめ復習
        removeWrongIdsFromAllChapters(selectedGrade, r.correctIds);
        const afterAll = loadAllWrongIdsByGrade(selectedGrade);
        setReviewCompleted(afterAll.length === 0);
      }

      // ★復習終了後も、ホームでは復習タブのままにする
      setHomeTab("review");
    } else {
      // 通常モード：間違えた分を弱点リストへ追加（chapter必須）
      addWrongIds(selectedGrade, ch, r.wrongIds);
      setReviewCompleted(false);

      // ★通常は問題演習へ戻す
      setHomeTab("practice");
    }

    setResult({ total: quiz.length, correct: r.correct, wrongIds: r.wrongIds });
    setScreen("result");
  };

  const goHome = () => {
    // ★押下時点の mode を尊重（念押し）
    if (mode === "review") setHomeTab("review");
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
      getReviewCountAll={getReviewCountAll}
      loading={loading}
      loadError={loadError}
      initialTab={homeTab}
    />
  );
}
