import type { Mode } from "../types/types";

type Props = {
  total: number;
  correct: number;
  wrongCount: number;
  mode: Mode;
  reviewCompleted: boolean;
  onHome: () => void;
};

export default function Result({ total, correct, wrongCount, mode, reviewCompleted, onHome }: Props) {
  const rate = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>結果</h1>

      <p>
        スコア： <b>{correct}</b> / {total}（{rate}%）
      </p>
      <p>間違い： {wrongCount} 問</p>

      {mode === "review" && reviewCompleted && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <b>🎉 復習完了！</b>
          <div style={{ color: "#666", marginTop: 6 }}>
            弱点リストが空になりました。必要なら通常モードで再チェックしよう。
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={onHome}>ホームへ</button>
      </div>
    </div>
  );
}
