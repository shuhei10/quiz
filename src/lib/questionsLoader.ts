import type { Grade, Question, QuestionType } from "../types";

export async function loadQuestionsByGrade(grade: Grade): Promise<Question[]> {
  const res = await fetch(`/questions/grade${grade}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load grade${grade}.json: ${res.status}`);

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];

  const safe: Question[] = data
    .filter((q) => q && typeof q === "object")
    .map((q: any) => ({
      id: String(q.id),
      grade: q.grade as Grade,
      type: ((q.type as QuestionType) ?? "choice"),
      text: String(q.text),
      choices: q.choices as [string, string, string, string],
      answerIndex: q.answerIndex as 0 | 1 | 2 | 3,
      explanation: String(q.explanation ?? ""),
      tags: Array.isArray(q.tags) ? q.tags.map(String) : undefined,
      image: typeof q.image === "string" ? q.image : undefined,
    }))
    .filter((q) => q.id && q.text && Array.isArray(q.choices) && q.choices.length === 4);

  return safe;
}
