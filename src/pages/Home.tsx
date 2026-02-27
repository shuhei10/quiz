import { useEffect, useState } from "react";
import type { Grade, Mode } from "../types/types";
import { getChaptersByGrade } from "../lib/questionsLoader";
import "./Home.css";
import "./GradeSelect.css"; // ✅ 作ったCSSを読み込む（パスは配置に合わせて調整）

// ✅ 章フィルタ（themes.json）関連
import ThemeFilter from "../components/ThemeFilter";
import {
  loadQuestionsWithCache,
  loadSelectedThemeSlugs,
  saveSelectedThemeSlugs,
  sortThemes,
  type Theme,
} from "../lib/questionsApi";

type TabKey = "practice" | "review" | "test";
type Variant = "blue" | "pink" | "purple" | "green" | "red";

type Props = {
  onStart: (opts: { grade: Grade; chapter: string; count: number; mode: Mode }) => void;

  getReviewCount: (grade: Grade, chapter: string) => number;
  getReviewCountAll: (grade: Grade) => number;

  loading: boolean;
  loadError: string | null;

  initialTab: TabKey;

  onResetReviewAll: (grade: Grade) => void;
  onResetReviewChapter: (grade: Grade, chapter: string) => void;

  reviewTick: number;
};

const GRAD: Record<Variant, string> = {
  blue: "linear-gradient(90deg,#2E7CF6,#19D3D1)",
  pink: "linear-gradient(90deg,#FF5AA5,#FF2E63)",
  purple: "linear-gradient(90deg,#7B61FF,#B04CFF)",
  green: "linear-gradient(90deg,#44C767,#2EAD5B)",
  red: "linear-gradient(90deg,#FF7A3D,#FF3D3D)",
};

const GRADE_META: Record<Grade, { label: string; variant: Variant; icon: string; desc: string }> = {
  4: { label: "4級", variant: "green", icon: "🧭", desc: "まずは基礎をサクッと固める" },
  3: { label: "3級", variant: "blue", icon: "🏛️", desc: "遺産数アップ、知識を広げる" },
  2: { label: "2級", variant: "red", icon: "🔥", desc: "本気モードで合格を狙う" },
};

const lastGradeKey = "whq:lastSelectedGrade";




function ScreenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="screen">
      <button className="settings" aria-label="settings" type="button">
        ⚙️
      </button>

      <header className="hero">
        <h1 className="hero__title">{title}</h1>
        {subtitle && <p className="hero__sub">{subtitle}</p>}
      </header>

      <main className="panel">{children}</main>
    </div>
  );
}

function GradientCardButton({
  icon,
  title,
  subtitle,
  variant = "blue",
  onClick,
  disabled,
  rightSlot,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const iconEmpty = icon == null;

  return (
    <button
      className="gbtn"
      style={{ background: GRAD[variant], position: "relative" }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className={`gbtn__icon ${iconEmpty ? "is-empty" : ""}`}>{icon}</span>

      <span className="gbtn__text">
        <span className="gbtn__title">{title}</span>
        {subtitle && <span className="gbtn__sub">{subtitle}</span>}
      </span>

      <span className="gbtn__arrow">›</span>
      {rightSlot}
    </button>
  );
}

function PrimaryButton({
  label,
  variant,
  onClick,
  disabled,
  className,
}: {
  label: string;
  variant: "green" | "red";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const bg =
    variant === "green"
      ? "linear-gradient(90deg,#57C86C,#2EAD5B)"
      : "linear-gradient(90deg,#FF7A3D,#FF3D3D)";

  return (
    <button
      className={`pbtn ${className ?? ""}`}
      style={{ background: bg }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
}

function BottomTabs({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <nav className="tabs">
      <button
        className={`tabs__item ${active === "practice" ? "is-active" : ""}`}
        onClick={() => onChange("practice")}
        type="button"
      >
        <span className="tabs__icon">📖</span>
        <span className="tabs__label">問題演習</span>
      </button>

      <button
        className={`tabs__item ${active === "review" ? "is-active" : ""}`}
        onClick={() => onChange("review")}
        type="button"
      >
        <span className="tabs__icon">↻</span>
        <span className="tabs__label">復習</span>
      </button>

      <button
        className={`tabs__item ${active === "test" ? "is-active" : ""}`}
        onClick={() => onChange("test")}
        type="button"
      >
        <span className="tabs__icon">🧾</span>
        <span className="tabs__label">テスト</span>
      </button>
    </nav>
  );
}

function GradeBar({ grade, onBack }: { grade: Grade; onBack: () => void }) {
  const meta = GRADE_META[grade];
  return (
    <div className="gradeBar">
      <button className="backMini" type="button" onClick={onBack}>
        ← 級を選び直す
      </button>
      <div className="gradeBadge" data-grade={grade}>
        <span className="gradeBadge__icon" aria-hidden>
          {meta.icon}
        </span>
        <span className="gradeBadge__text">{meta.label}</span>
      </div>
    </div>
  );
}

function GradeSelectScreen({ onPick }: { onPick: (g: Grade) => void }) {
  return (
    <ScreenShell title="世界遺産クイズ" subtitle="級を選んでスタート">
      <div className="stack">
        <GradientCardButton
          variant={GRADE_META[4].variant}
          icon={<span aria-hidden>{GRADE_META[4].icon}</span>}
          title={GRADE_META[4].label}
          subtitle={GRADE_META[4].desc}
          onClick={() => onPick(4)}
        />
        <GradientCardButton
          variant={GRADE_META[3].variant}
          icon={<span aria-hidden>{GRADE_META[3].icon}</span>}
          title={GRADE_META[3].label}
          subtitle={GRADE_META[3].desc}
          onClick={() => onPick(3)}
        />
        <GradientCardButton
          variant={GRADE_META[2].variant}
          icon={<span aria-hidden>{GRADE_META[2].icon}</span>}
          title={GRADE_META[2].label}
          subtitle={GRADE_META[2].desc}
          onClick={() => onPick(2)}
        />
      </div>

      <div className="msg msg--hint" style={{ marginTop: 14 }}>
        選んだ級に合わせて、演習・復習・テストが切り替わります
      </div>
    </ScreenShell>
  );
}

function normalizeThemes(rawThemes: any[], grade: Grade): Theme[] {
  return (rawThemes ?? [])
    .map((t: any) => {
      // slugは localStorage の selectedSlugs と一致するキーになるので必須
      const slug = String(t.slug ?? t.key ?? "").trim();
      const title = String(t.title ?? t.label ?? "").trim();

      // chapter_id は number 必須。無い場合は order か連番で埋める
      const chapterIdRaw = t.chapter_id ?? t.chapterId ?? t.id ?? null;
      const chapter_id =
        typeof chapterIdRaw === "number"
          ? chapterIdRaw
          : Number.isFinite(Number(chapterIdRaw))
            ? Number(chapterIdRaw)
            : Number(t.sort_order ?? t.order ?? 0) || 0;

      const sort_order = Number(t.sort_order ?? t.order ?? 0) || 0;
      const count = Number(t.count ?? 0) || 0;

      return {
        grade: Number(t.grade ?? grade),
        chapter_id,
        slug: slug || null,
        title: title || null,
        sort_order,
        count,
      } satisfies Theme;
    })
    // slug/title が無いものはフィルタから除外
    .filter((t) => !!t.slug && !!t.title);
}

export default function Home({
  onStart,
  getReviewCount,
  getReviewCountAll,
  loading,
  loadError,
  initialTab,
  onResetReviewAll,
  onResetReviewChapter,
  reviewTick,
}: Props) {
  const [grade, setGrade] = useState<Grade | null>(() => {
  try {
    const raw = localStorage.getItem(lastGradeKey);
    const n = raw ? Number(raw) : NaN;
    return n === 4 || n === 3 || n === 2 ? (n as Grade) : null;
  } catch {
    return null;
  }
});

  const [tab, setTab] = useState<TabKey>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  // 章（カード表示用）
  const [chapters, setChapters] = useState<string[]>([]);

  // ✅ themes + フィルタの選択状態
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // ✅ grade が決まったら、保存済み slugs を復元
  useEffect(() => {
    if (!grade) return;
    setSelectedSlugs(loadSelectedThemeSlugs(grade));
  }, [grade]);

  // chapters をロード
  useEffect(() => {
    if (!grade) return;

    let mounted = true;

    (async () => {
      try {
        const list = await getChaptersByGrade(grade);
        if (mounted) setChapters(list);
      } catch (e) {
        console.error(e);
        if (mounted) setChapters([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [grade]);

  // ✅ themes をロード（キャッシュ付き）
  useEffect(() => {
    if (!grade) return;

    let mounted = true;

    (async () => {
      try {
        const r = await loadQuestionsWithCache(grade);

       const normalized = normalizeThemes((r as any).themes ?? [], grade);
      setThemes(sortThemes(normalized));

        if (!mounted) return;
        setThemes(sortThemes(normalized));
      } catch (e) {
        console.error(e);
        if (mounted) setThemes([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [grade]);

  // ✅ フィルタ選択を保存
  useEffect(() => {
    if (!grade) return;
    saveSelectedThemeSlugs(grade, selectedSlugs);
  }, [grade, selectedSlugs]);

  // ✅ grade 未選択は級選択へ
  if (!grade) {
    return <GradeSelectScreen onPick={(g) => {
  setGrade(g);
  localStorage.setItem(lastGradeKey, String(g));
}} />;
  }

  const disabled = loading || !!loadError;

  const canStartByFilter = !disabled && themes.length > 0;

  const startPractice = (chapter: string) => {
    onStart({ grade, chapter, count: 10, mode: "normal" });
  };

  const startPracticeByFilter = () => {
    // ✅ chapterは空（Quiz側で selectedSlugs を参照して絞り込む）
    onStart({ grade, chapter: "", count: 10, mode: "normal" });
  };

  const startTest = (count: number) => {
    onStart({ grade, chapter: "", count, mode: "normal" });
  };

  const startReviewAll = () => {
    const allCount = getReviewCountAll(grade);
    onStart({ grade, chapter: "", count: allCount, mode: "review" });
  };

  const startReviewChapter = (chapter: string) => {
    const cCount = getReviewCount(grade, chapter);
    onStart({ grade, chapter, count: cCount, mode: "review" });
  };

  const resetReviewAll = () => onResetReviewAll(grade);

  void reviewTick;
  const allReviewCount = getReviewCountAll(grade);

  const screenTitle =
    tab === "practice"
      ? `世界遺産検定${grade}級クイズ`
      : tab === "test"
        ? "実力テスト"
        : "復習";

  const screenSub =
    tab === "practice"
      ? "知識を深めて、世界の宝を発見しよう"
      : tab === "test"
        ? "問題数を選んで開始"
        : "間違えた問題を復習しよう";

  return (
    <>
      {tab === "practice" && (
        <ScreenShell title={screenTitle} subtitle={screenSub}>
          <GradeBar
  grade={grade}
  onBack={() => {
    setGrade(null);
    localStorage.removeItem(lastGradeKey);
  }}
/>

          <div className="panel__title">テーマを選んで開始</div>

          {loadError && <div className="msg msg--error">{loadError}</div>}
          {loading && <div className="msg">読み込み中...</div>}

          <div className="panel__title" style={{ marginTop: 10 }}>
            章フィルタ
          </div>

          {/* ✅ themes.json ベースの章フィルタ */}
          <ThemeFilter themes={themes} selectedSlugs={selectedSlugs} onChange={setSelectedSlugs} />

          <div className="centerWideWrap">
            <PrimaryButton
              label="フィルタで開始（10問）"
              variant="green"
              onClick={startPracticeByFilter}
              disabled={!canStartByFilter}
              className="pbtn--centerwide"
            />
          </div>

          {/* 読み込み終わってるのに themes が空ならメッセージ */}
          {!loading && !loadError && themes.length === 0 && (
            <div className="msg msg--error" style={{ marginTop: 10 }}>
              テーマが読み込めませんでした。themes.json の形式（key/label など）と読み込みを確認してください。
            </div>
          )}

          {/* ✅ 2列グリッド（既存の章カードは残す） */}
          <div className="grid2">
            {chapters.map((c, idx) => (
              <GradientCardButton
                key={c}
                variant={idx % 3 === 0 ? "blue" : idx % 3 === 1 ? "pink" : "purple"}
                icon={<></>}
                title={c}
                onClick={() => startPractice(c)}
                disabled={disabled}
              />
            ))}
          </div>
        </ScreenShell>
      )}

      {tab === "test" && (
        <ScreenShell title={screenTitle} subtitle={screenSub}>
          <GradeBar grade={grade} onBack={() => setGrade(null)} />

          <div className="stack">
            <GradientCardButton
              variant="blue"
              icon={<span>⏱️</span>}
              title="20問テスト"
              subtitle="約10分"
              onClick={() => startTest(20)}
              disabled={disabled}
            />
            <GradientCardButton
              variant="pink"
              icon={<span>⏱️</span>}
              title="50問テスト"
              subtitle="約25分"
              onClick={() => startTest(50)}
              disabled={disabled}
            />
            <GradientCardButton
              variant="purple"
              icon={<span>🕒</span>}
              title="100問テスト"
              subtitle="約50分"
              onClick={() => startTest(100)}
              disabled={disabled}
            />
          </div>
        </ScreenShell>
      )}

      {tab === "review" && (
        <ScreenShell title={screenTitle} subtitle={screenSub}>
          <GradeBar grade={grade} onBack={() => setGrade(null)} />

          {loadError && <div className="msg msg--error">{loadError}</div>}
          {loading && <div className="msg">読み込み中...</div>}

          {allReviewCount === 0 ? (
            <div className="msg">復習する問題がまだありません</div>
          ) : (
            <>
              <div className="reviewBox">
                <div className="reviewBox__row">
                  <span className="reviewBox__badge">🧠</span>
                  <span className="reviewBox__text">総まとめ：間違えた問題 {allReviewCount}問</span>
                </div>
              </div>

              <div className="stack" style={{ marginBottom: 14 }}>
                <PrimaryButton
                  label="総まとめで復習を始める"
                  variant="green"
                  onClick={startReviewAll}
                  disabled={disabled || allReviewCount === 0}
                />
              </div>
            </>
          )}

          <div className="panel__title">テーマ別に復習</div>

          <div className="grid2">
            {chapters.map((c, idx) => {
              const cCount = getReviewCount(grade, c);
              const canReset = cCount > 0;

              return (
                <GradientCardButton
                  key={c}
                  variant={idx % 3 === 0 ? "blue" : idx % 3 === 1 ? "pink" : "purple"}
                  icon={<span>↻</span>}
                  title={c}
                  subtitle={cCount === 0 ? "復習なし" : `間違えた問題：${cCount}問`}
                  onClick={() => startReviewChapter(c)}
                  disabled={disabled || cCount === 0}
                  rightSlot={
                    <button
                      type="button"
                      aria-label={`${c} をリセット`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetReviewChapter(grade, c);
                      }}
                      disabled={disabled || !canReset}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,.35)",
                        background: "rgba(0,0,0,.18)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: disabled || !canReset ? "not-allowed" : "pointer",
                      }}
                    >
                      🗑
                    </button>
                  }
                />
              );
            })}
          </div>

          <div className="stack" style={{ marginTop: 14 }}>
            <PrimaryButton
              label="間違えた問題をリセット（全テーマ）"
              variant="red"
              onClick={resetReviewAll}
              disabled={disabled}
            />
          </div>
        </ScreenShell>
      )}

      <BottomTabs active={tab} onChange={setTab} />
    </>
  );
}