import type { Mode } from "../types/types";
import "./Result.css";

type Props = {
  total: number;
  correct: number;
  wrongCount: number;
  mode: Mode;
  reviewCompleted: boolean;
  onHome: () => void;
};

export default function Result({
  total,
  correct,
  wrongCount,
  mode,
  reviewCompleted,
  onHome,
}: Props) {
  const rate = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="result">
      <h1 className="result__title">結果</h1>

      {/* スコア */}
      <div className="result__score">
        <div className="result__rate">{rate}%</div>
        <div className="result__detail">
          <span>
            スコア <b>{correct}</b> / {total}
          </span>
          <span>間違い：{wrongCount}問</span>
        </div>
      </div>

      {/* 復習完了 */}
      {mode === "review" && reviewCompleted && (
        <div className="result__card">
          <div className="result__cardTitle">🎉 復習完了！</div>
          <div className="result__cardText">
            弱点リストが空になりました。<br />
            必要なら通常モードで再チェックしよう。
          </div>
        </div>
      )}

      {/* ボタン */}
      <button className="result__homeBtn" onClick={onHome} type="button">
        ホームへ
      </button>
    </div>
  );
}
