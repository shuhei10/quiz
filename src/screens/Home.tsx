type Props = {
  onStart: () => void;
};

export default function Home({ onStart }: Props) {
  return (
    <div style={{ padding: 16 }}>
      <h1>世界遺産クイズ</h1>
      <p>出題を開始します。</p>
      <button onClick={onStart}>スタート</button>
    </div>
  );
}
