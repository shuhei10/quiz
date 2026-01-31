type Props = {
  score: number;
  total: number;
  onRestart: () => void;
};

export default function Result({ score, total, onRestart }: Props) {
  return (
    <div style={{ padding: 16 }}>
      <h1>結果</h1>
      <p>
        スコア： <b>{score}</b> / {total}
      </p>
      <button onClick={onRestart}>ホームへ</button>
    </div>
  );
}
