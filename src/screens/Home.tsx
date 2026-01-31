import { useEffect, useState } from "react";
import type { Grade, Mode } from "../types/quiz";
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
  getReviewCount: (grade: Grade, chapter: string) => number;
  loading: boolean;
  loadError: string | null;
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
  loading,
  loadError,
}: Props) {
  const [grade] = useState<Grade>(4);
  const [tab, setTab] = useState<TabKey>("practice");

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

  const reviewCount = getReviewCount(grade, "");
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

  const startReview = () => {
    onStart({
      grade,
      chapter: "",
      count: reviewCount,
      mode: "review",
    });
  };

  const resetReview = () => {
    alert("復習リセット処理をここに実装してね（今はダミー）");
  };

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
          {reviewCount === 0 ? (
            <div className="msg">復習する問題がまだありません</div>
          ) : (
            <>
              <div className="reviewBox">
                <div className="reviewBox__row">
                  <span className="reviewBox__badge">↩︎</span>
                  <span className="reviewBox__text">
                    間違えた問題：{reviewCount}問
                  </span>
                </div>
              </div>

              <div className="stack">
                <PrimaryButton
                  label="復習を始める"
                  variant="green"
                  onClick={startReview}
                  disabled={disabled}
                />
                <PrimaryButton
                  label="間違えた問題をリセット"
                  variant="red"
                  onClick={resetReview}
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </ScreenShell>
      )}

      <BottomTabs active={tab} onChange={setTab} />
    </>
  );
}
