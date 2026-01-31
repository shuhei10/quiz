import { useMemo, useState } from "react";
import type { Question } from "../types/types";

type Props = {
  quiz: Question[];
  onFinish: (result: { correct: number; wrongIds: string[]; correctIds: string[] }) => void;
};

export default function Quiz({ quiz, onFinish }: Props) {
  const [index, setIndex] = useState(0);

  // ✅ 選択は choiceId(string) で保持
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [correctIds, setCorrectIds] = useState<string[]>([]);

  const q = quiz[index];

  const progress = useMemo(() => {
    const total = quiz.length || 1;
    return Math.round(((index + 1) / total) * 100);
  }, [index, quiz.length]);

  if (!q) {
    return (
      <div className="screen">
        <div className="card">
          <div className="title">問題がありません</div>
          <button
            className="primary"
            type="button"
            onClick={() => onFinish({ correct: 0, wrongIds: [], correctIds: [] })}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = !!selected && selected === q.answerId;

  const choose = (choiceId: string) => {
    if (showAnswer) return;

    setSelected(choiceId);
    setShowAnswer(true);

    if (choiceId === q.answerId) {
      setCorrectCount((c) => c + 1);
      setCorrectIds((ids) => [...ids, q.id]);
    } else {
      setWrongIds((w) => [...w, q.id]);
    }
  };

  const next = () => {
    const last = index >= quiz.length - 1;
    if (last) {
      onFinish({ correct: correctCount, wrongIds, correctIds });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setShowAnswer(false);
  };

  return (
    <div className="screen">
      <div className="card">
        <div className="topbar">
          <div className="muted">
            {index + 1} / {quiz.length}
          </div>
          <div className="bar">
            <div className="barFill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="question">{q.title}</div>

        <div className="choices">
          {q.choices.map((c, i) => {
            const chosen = selected === c.id;
            const right = showAnswer && c.id === q.answerId;
            const wrong = showAnswer && chosen && c.id !== q.answerId;

            return (
              <button
                key={c.id}
                type="button"
                className={`choice ${chosen ? "choiceChosen" : ""} ${right ? "choiceRight" : ""} ${
                  wrong ? "choiceWrong" : ""
                }`}
                onClick={() => choose(c.id)}
              >
                <span className="choiceIndex">{i + 1}</span>
                <span className="choiceText">{c.text}</span>
              </button>
            );
          })}
        </div>

        {showAnswer && (
  <div className={`answerBox ${isCorrect ? "ok" : "ng"}`}>
    <div className="answerTitle">{isCorrect ? "正解！" : "不正解"}</div>
    {q.explanation && <div className="answerText">{q.explanation}</div>}
  </div>
)}

        <button className="primary" type="button" onClick={next} disabled={!showAnswer}>
          {index === quiz.length - 1 ? "結果へ" : "次へ"}
        </button>
      </div>
    </div>
  );
}
