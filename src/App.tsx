import Home from "./screens/Home";
import Quiz from "./screens/Quiz";
import Result from "./screens/Result";
import { QUESTIONS } from "./data/questions";
import { useQuizFlow } from "./state/quiz";

export default function App() {
  const q = useQuizFlow(QUESTIONS);

  if (q.screen === "home") {
    return <Home onStart={q.start} />;
  }

  if (q.screen === "quiz") {
    if (!q.current) return <div style={{ padding: 16 }}>問題がありません</div>;

    return (
      <Quiz
        question={q.current}
        index={q.index}
        total={q.questions.length}
        selectedId={q.answers[q.current.id]}
        onSelect={(choiceId) => q.selectAnswer(q.current!.id, choiceId)}
        onNext={q.next}
      />
    );
  }

  return <Result score={q.score} total={q.questions.length} onRestart={q.restart} />;
}
