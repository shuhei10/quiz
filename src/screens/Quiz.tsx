import { useMemo, useState, useEffect } from "react";
import type { Mode, Question } from "../types/quiz";

type FinishPayload = {
  correct: number;
  wrongIds: string[];
  correctIds: string[];
};

type Props = {
  quiz: Question[];
  mode: Mode;
  onFinish: (r: FinishPayload) => void;
};

type AnswerLog = {
  questionId: string;
  selectedId: string;
  isCorrect: boolean;
};

export default function Quiz({ quiz, mode, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const current = quiz[index];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  const total = quiz.length;
  const remaining = total - (index + 1);

  useEffect(() => {
    // 次の問題に行ったら回答状態をリセット
    setSelectedId(null);
    setAnswered(false);
  }, [index]);

  const isCorrect = useMemo(() => {
    if (!current || !selectedId) return false;
    return selectedId === current.answerId;
  }, [current, selectedId]);

  const correctChoiceText = useMemo(() => {
    if (!current) return "";
    const c = current.choices.find((x) => x.id === current.answerId);
    return c ? c.text : "";
  }, [current]);

  const handleSelect = (choiceId: string) => {
    if (!current) return;
    if (answered) return;

    const ok = choiceId === current.answerId;
    setSelectedId(choiceId);
    setAnswered(true);

    setLogs((prev) => [
      ...prev,
      { questionId: current.id, selectedId: choiceId, isCorrect: ok },
    ]);
  };

  const handleNext = () => {
    const next = index + 1;

    if (next >= total) {
      const correctIds: string[] = [];
      const wrongIds: string[] = [];
      for (const l of logs) (l.isCorrect ? correctIds : wrongIds).push(l.questionId);
      onFinish({ correct: correctIds.length, wrongIds, correctIds });
      return;
    }

    setIndex(next);
  };

  if (!quiz.length) return <div style={{ padding: 16 }}>問題がありません</div>;
  if (!current) return <div style={{ padding: 16 }}>問題が読み込めませんでした</div>;

  return (
    <div style={{ padding: 16, paddingBottom: 140 /* sticky分の余白 */ }}>
      {/* 上部：進捗 */}
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <b>
          {index + 1} / {total}
        </b>
        {mode === "review" ? (
          <span style={{ color: "#666" }}>復習モード：残り {remaining} 問</span>
        ) : (
          <span style={{ color: "#666" }}>通常モード</span>
        )}
      </div>

      <h2 style={{ marginTop: 10 }}>{current.title}</h2>

      {/* 選択肢 */}
      <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
        {current.choices.map((c) => {
          const isSelected = selectedId === c.id;
          const isAnswer = c.id === current.answerId;

          let background = "white";
          let border = "1px solid #ccc";
          let opacity = 1;

          if (answered) {
            if (isAnswer) {
              background = "#e6ffe6";
              border = "2px solid #2e7d32";
              opacity = 1;
            } else if (isSelected && !isCorrect) {
              background = "#ffe6e6";
              border = "2px solid #c62828";
              opacity = 1;
            } else {
              opacity = 0.6;
            }
          } else if (isSelected) {
            background = "#f5f5f5";
          }

          return (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              disabled={answered}
              style={{
                padding: 12,
                textAlign: "left",
                background,
                border,
                borderRadius: 12,
                opacity,
                cursor: answered ? "default" : "pointer",
              }}
            >
              <b style={{ marginRight: 8 }}>{c.id}.</b>
              {c.text}
              {answered && isAnswer && (
                <span style={{ marginLeft: 10, fontWeight: 700 }}>（正解）</span>
              )}
              {answered && isSelected && !isAnswer && (
                <span style={{ marginLeft: 10, fontWeight: 700 }}>（あなたの回答）</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ①② sticky：正誤＋解説（日本語＋英語） */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          background: "white",
          borderTop: "1px solid #ddd",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {!answered ? (
            <div style={{ color: "#666" }}>選択すると、ここに正誤と解説が表示されます。</div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {isCorrect ? "✅ 正解！" : "❌ 不正解"}
              </div>

              <div>
                正解： <b>{current.answerId}</b>（{correctChoiceText}）
              </div>

              {current.explanation && (
                <div style={{ lineHeight: 1.7 }}>
                  <b>解説：</b>
                  {current.explanation}
                </div>
              )}

              {current.explanationEn && (
                <div style={{ lineHeight: 1.7 }}>
                  <b>Explain in English：</b>
                  {current.explanationEn}
                </div>
              )}

              <div>
                <button onClick={handleNext} style={{ padding: "10px 14px", borderRadius: 10 }}>
                  {index + 1 >= total ? "結果へ" : "次へ"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
