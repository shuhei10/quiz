type Props = {
  total: number;
  correct: number;
  wrongCount: number;
  onHome: () => void;
};

export default function Result({ total, correct, wrongCount, onHome }: Props) {
  return (
    <div className="screen">
      <div className="card">
        <div className="title">結果</div>

        <div className="resultRow">
          <div>
            <div className="muted">正解</div>
            <div className="resultNum">{correct}</div>
          </div>
          <div>
            <div className="muted">不正解</div>
            <div className="resultNum">{wrongCount}</div>
          </div>
          <div>
            <div className="muted">合計</div>
            <div className="resultNum">{total}</div>
          </div>
        </div>

        <button className="primary" onClick={onHome}>
          ホームへ
        </button>
      </div>
    </div>
  );
}
