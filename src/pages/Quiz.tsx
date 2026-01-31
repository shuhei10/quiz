import { useMemo, useState } from "react";
import type { Question } from "../types";

type Props = {
  quiz: Question[];
  onFinish: (result: { correct: number; wrongIds: string[]; correctIds: string[] }) => void;
};

export default function Quiz({ quiz, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [correctIds, setCorrectIds] = useState<string[]>([]);

  const q = quiz[index];
  const qType = q?.type ?? "choice";

  const progress = useMemo(() => {
    const total = quiz.length || 1;
    return Math.round(((index + 1) / total) * 100);
  }, [index, quiz.length]);

  if (!q) {
    return (
      <div className="screen">
        <div className="card">
          <div className="title">問題がありません</div>
          <button className="primary" onClick={() => onFinish({ correct: 0, wrongIds: [], correctIds: [] })}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selected === q.answerIndex;

  const choose = (i: number) => {
    if (showAnswer) return;
    setSelected(i);
    setShowAnswer(true);

    if (i === q.answerIndex) {
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

              {qType === "blank_choice" && <div className="badge">穴埋め</div>}
              {q.image && (<img src={q.image} alt="" className="qimg" loading="lazy"/>)}

        <div className="question">{q.text}</div>

        <div className="choices">
          {q.choices.map((c, i) => {
            const chosen = selected === i;
            const right = showAnswer && i === q.answerIndex;
            const wrong = showAnswer && chosen && i !== q.answerIndex;

            return (
              <button
                key={i}
                className={`choice ${chosen ? "choiceChosen" : ""} ${right ? "choiceRight" : ""} ${
                  wrong ? "choiceWrong" : ""
                }`}
                onClick={() => choose(i)}
              >
                <span className="choiceIndex">{i + 1}</span>
                <span className="choiceText">{c}</span>
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className={`answerBox ${isCorrect ? "ok" : "ng"}`}>
            <div className="answerTitle">{isCorrect ? "正解！" : "不正解"}</div>
            <div className="answerText">{q.explanation}</div>
          </div>
        )}

        <button className="primary" onClick={next} disabled={!showAnswer}>
          {index === quiz.length - 1 ? "結果へ" : "次へ"}
        </button>
      </div>
    </div>
  );
}
