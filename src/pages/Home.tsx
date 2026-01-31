import { useMemo, useState } from "react";
import type { Grade } from "../types/quiz";

type Props = {
  onStart: (opts: { grade: Grade; count: number; mode: "normal" | "review" }) => void | Promise<void>;
  getReviewCount: (grade: Grade) => number;
  loading: boolean;
  loadError: string | null;
};

export default function Home({ onStart, getReviewCount, loading, loadError }: Props) {
  const [grade, setGrade] = useState<Grade>(4);
  const [count, setCount] = useState(10);

  const reviewCount = useMemo(() => getReviewCount(grade), [getReviewCount, grade]);

  return (
    <div className="screen">
      <div className="card">
        <div className="title">世界遺産検定クイズ</div>
        <div className="muted">通勤中にサクッと。4択→解説→次へ。</div>

        <div className="section">
          <div className="label">級</div>
          <div className="row">
            {[4, 3, 2].map((g) => (
              <button
                key={g}
                className={`chip ${grade === g ? "chipActive" : ""}`}
                onClick={() => setGrade(g as Grade)}
                disabled={loading}
              >
                {g}級
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="label">出題数</div>
          <div className="row">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                className={`chip ${count === n ? "chipActive" : ""}`}
                onClick={() => setCount(n)}
                disabled={loading}
              >
                {n}問
              </button>
            ))}
          </div>
        </div>

        {loadError && <div className="answerBox ng">Error: {loadError}</div>}

        <button className="primary" onClick={() => onStart({ grade, count, mode: "normal" })} disabled={loading}>
          {loading ? "読み込み中..." : "スタート"}
        </button>

        <button
          className="secondary"
          onClick={() => onStart({ grade, count, mode: "review" })}
          disabled={loading || reviewCount === 0}
          style={{ marginTop: 10 }}
        >
          間違い復習（{reviewCount}）
        </button>
      </div>
    </div>
  );
}
