import { useEffect, useState } from "react";
import type { Grade, Mode } from "../types/types";
import { getChaptersByGrade } from "../lib/questionsLoader";
import "./Home.css";

/* =========================
   Props
========================= */
type Props = {
  onStart: (opts: {
    grade: Grade;
    chapter: string;
    count: number;
    mode: Mode;
  }) => void;

  // テーマ別復習数
  getReviewCount: (grade: Grade, chapter: string) => number;

  // 総まとめ復習数
  getReviewCountAll: (grade: Grade) => number;

  loading: boolean;
  loadError: string | null;

  // ★ホーム表示時の初期タブ（復習から戻ったらreviewに固定など）
  initialTab: TabKey;
};

type TabKey = "practice" | "review" | "test";
type Variant = "blue" | "pink" | "purple" | "green" | "red";

/* =========================
   UI constants
========================= */
const GRAD: Record<Variant, string> = {
  blue: "linear-gradient(90deg,#2E7CF6,#19D3D1)",
  pink: "linear-gradient(90deg,#FF5AA5,#FF2E63)",
  purple: "linear-gradient(90deg,#7B61FF,#B04CFF)",
  green: "linear-gradient(90deg,#44C767,#2EAD5B)",
  red: "linear-gradient(90deg,#FF7A3D,#FF3D3D)",
};

/* =========================
   UI components
========================= */
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
      <button className="settings" aria-label="settings">
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="gbtn"
      style={{ background: GRAD[variant] }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="gbtn__icon">{icon}</span>

      <span className="gbtn__text">
        <span className="gbtn__title">{title}</span>
        {subtitle && <span className="gbtn__sub">{subtitle}</span>}
      </span>

      <span className="gbtn__arrow">›</span>
    </button>
  );
}

function PrimaryButton({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "green" | "red";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const bg =
    variant === "green"
      ? "linear-gradient(90deg,#57C86C,#2EAD5B)"
      : "linear-gradient(90deg,#FF7A3D,#FF3D3D)";

  return (
    <button
      className="pbtn"
      style={{ background: bg }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
}

function BottomTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
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

/* =========================
   Home
========================= */
export default function Home({
  onStart,
  getReviewCount,
  getReviewCountAll,
  loading,
  loadError,
  initialTab,
}: Props) {
  const [grade] = useState<Grade>(4);

  // ★initialTab を初期値にする（Appから渡される）
  const [tab, setTab] = useState<TabKey>(initialTab);

  // ★Homeへ戻ってきたときも initialTab を反映（復習から戻ったらreview固定）
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const [chapters, setChapters] = useState<string[]>([]);

  useEffect(() => {
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

  const disabled = loading || !!loadError;

  /* ===== handlers ===== */

  const startPractice = (chapter: string) => {
    onStart({
      grade,
      chapter,
      count: 10,
      mode: "normal",
    });
  };

  const startTest = (count: number) => {
    onStart({
      grade,
      chapter: "",
      count,
      mode: "normal",
    });
  };

  const startReviewAll = () => {
    const allCount = getReviewCountAll(grade);
    onStart({
      grade,
      chapter: "",
      count: allCount,
      mode: "review",
    });
  };

  const startReviewChapter = (chapter: string) => {
    const cCount = getReviewCount(grade, chapter);
    onStart({
      grade,
      chapter,
      count: cCount,
      mode: "review",
    });
  };

  const resetReview = () => {
    alert("復習リセット処理をここに実装してね（今はダミー）");
  };

  const allReviewCount = getReviewCountAll(grade);

  /* ========================= */

  return (
    <>
      {tab === "practice" && (
        <ScreenShell
          title="世界遺産検定4級クイズ"
          subtitle="知識を深めて、世界の宝を発見しよう"
        >
          <div className="panel__title">テーマを選んで開始</div>

          {loadError && <div className="msg msg--error">{loadError}</div>}
          {loading && <div className="msg">読み込み中...</div>}

          <div className="stack">
            {chapters.map((c, idx) => (
              <GradientCardButton
                key={c}
                variant={idx % 3 === 0 ? "blue" : idx % 3 === 1 ? "pink" : "purple"}
                icon={<span>{idx % 3 === 0 ? "🎓" : idx % 3 === 1 ? "📍" : "🌍"}</span>}
                title={c}
                subtitle="このテーマの問題を解く"
                onClick={() => startPractice(c)}
                disabled={disabled}
              />
            ))}
          </div>
        </ScreenShell>
      )}

      {tab === "test" && (
        <ScreenShell title="実力テスト" subtitle="問題数を選んで開始">
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
        <ScreenShell title="復習" subtitle="間違えた問題を復習しよう">
          {loadError && <div className="msg msg--error">{loadError}</div>}
          {loading && <div className="msg">読み込み中...</div>}

          {/* 総まとめ */}
          {allReviewCount === 0 ? (
            <div className="msg">復習する問題がまだありません</div>
          ) : (
            <>
              <div className="reviewBox">
                <div className="reviewBox__row">
                  <span className="reviewBox__badge">🧠</span>
                  <span className="reviewBox__text">
                    総まとめ：間違えた問題 {allReviewCount}問
                  </span>
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

          {/* テーマ別 */}
          <div className="panel__title">テーマ別に復習</div>

          <div className="stack">
            {chapters.map((c, idx) => {
              const cCount = getReviewCount(grade, c);
              return (
                <GradientCardButton
                  key={c}
                  variant={idx % 3 === 0 ? "blue" : idx % 3 === 1 ? "pink" : "purple"}
                  icon={<span>↻</span>}
                  title={c}
                  subtitle={cCount === 0 ? "復習なし" : `間違えた問題：${cCount}問`}
                  onClick={() => startReviewChapter(c)}
                  disabled={disabled || cCount === 0}
                />
              );
            })}
          </div>

          <div className="stack" style={{ marginTop: 14 }}>
            <PrimaryButton
              label="間違えた問題をリセット"
              variant="red"
              onClick={resetReview}
              disabled={disabled}
            />
          </div>
        </ScreenShell>
      )}

      <BottomTabs active={tab} onChange={setTab} />
    </>
  );
}
