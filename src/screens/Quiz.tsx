import type { Question } from "../types/quiz";

type Props = {
  question: Question;
  index: number;
  total: number;
  selectedId?: string;
  onSelect: (choiceId: string) => void;
  onNext: () => void;
};

export default function Quiz({
  question,
  index,
  total,
  selectedId,
  onSelect,
  onNext,
}: Props) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <b>
          {index + 1} / {total}
        </b>
      </div>

      <h2 style={{ marginTop: 0 }}>{question.title}</h2>

      <div style={{ display: "grid", gap: 8 }}>
        {question.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: 12,
              border: "1px solid #ccc",
              background: selectedId === c.id ? "#e6ffe6" : "white",
              textAlign: "left",
            }}
          >
            {c.id}. {c.text}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={onNext} disabled={!selectedId}>
          次へ
        </button>
      </div>
    </div>
  );
}
