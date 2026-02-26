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
  clearAllWrongIdsByGrade,
  clearWrongIds,
} from "./lib/storage";

// ✅ 章フィルタ（themes選択）を読む
import { loadSelectedThemeSlugs } from "./lib/questionsApi";

import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

type HomeTab = "practice" | "review" | "test";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [result, setResult] = useState<{ total: number; correct: number; wrongIds: string[] } | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(4);
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [mode, setMode] = useState<Mode>("normal");
  const [reviewCompleted, setReviewCompleted] = useState(false);

  const [homeTab, setHomeTab] = useState<HomeTab>("practice");

  // ★復習データが変わったことをHomeに伝える（再描画トリガ）
  const [reviewTick, setReviewTick] = useState(0);

  const getReviewCount = (grade: Grade, chapter: string) =>
    loadWrongIds(grade, chapter.trim()).length;

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

      setHomeTab(opts.mode === "review" ? "review" : "practice");

      // まず章（文字列）指定があればそれで絞る（従来通り）
      // chapterなし = 全問題（テスト/総まとめ/章フィルタ開始用）
      const all: Question[] = await loadQuestionsByGradeAndChapter(opts.grade, ch);

      // ✅ 章フィルタ（themes slug選択）を反映する
      // 条件：chapter が空（=章フィルタ開始/テスト/総まとめ）
      let pool: Question[] = all;

      if (!ch) {
        const selectedSlugs = loadSelectedThemeSlugs(opts.grade);

        // 未選択（[]）は全章
        if (selectedSlugs.length > 0) {
          const set = new Set(selectedSlugs);

          // Question に chapter_slug が入っている前提（入ってなければ filtered は 0 になりやすい）
          const filtered = all.filter((q: any) => q?.chapter_slug && set.has(q.chapter_slug));

          // 0件救済：chapter_slug が未整備等で0件なら全章に戻す
          pool = filtered.length > 0 ? filtered : all;
        }
      }

      // ✅ 復習モード：wrongIdsで絞る（poolに対して適用）
      if (opts.mode === "review") {
        if (ch) {
          const wrongSet = new Set(loadWrongIds(opts.grade, ch));
          pool = pool.filter((q) => wrongSet.has(q.id));
        } else {
          const wrongSet = new Set(loadAllWrongIdsByGrade(opts.grade));
          pool = pool.filter((q) => wrongSet.has(q.id));
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
      if (ch) {
        removeWrongIds(selectedGrade, ch, r.correctIds);
        const after = loadWrongIds(selectedGrade, ch);
        setReviewCompleted(after.length === 0);
      } else {
        removeWrongIdsFromAllChapters(selectedGrade, r.correctIds);
        const afterAll = loadAllWrongIdsByGrade(selectedGrade);
        setReviewCompleted(afterAll.length === 0);
      }

      setHomeTab("review");
      setReviewTick((v) => v + 1);
    } else {
      addWrongIds(selectedGrade, ch, r.wrongIds);
      setReviewCompleted(false);

      setHomeTab("practice");
      setReviewTick((v) => v + 1);
    }

    setResult({ total: quiz.length, correct: r.correct, wrongIds: r.wrongIds });
    setScreen("result");
  };

  // ★総まとめリセット
  const resetReviewAll = (grade: Grade) => {
    const ok = window.confirm("間違えた問題をすべてリセットします。よろしいですか？");
    if (!ok) return;

    clearAllWrongIdsByGrade(grade);

    setReviewCompleted(false);
    setHomeTab("review");
    setReviewTick((v) => v + 1);
  };

  // ★テーマ別リセット
  const resetReviewChapter = (grade: Grade, chapter: string) => {
    const ch = chapter.trim();
    if (!ch) return;

    const ok = window.confirm(`「${ch}」の間違えた問題をリセットします。よろしいですか？`);
    if (!ok) return;

    clearWrongIds(grade, ch);

    setReviewCompleted(false);
    setHomeTab("review");
    setReviewTick((v) => v + 1);
  };

  const goHome = () => {
    if (mode === "review") setHomeTab("review");
    setScreen("home");
    setQuiz([]);
  };

  if (screen === "quiz") {
    return <Quiz quiz={quiz} mode={mode} onFinish={finish} onHome={goHome} />;
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
      onResetReviewAll={resetReviewAll}
      onResetReviewChapter={resetReviewChapter}
      reviewTick={reviewTick}
    />
  );
}