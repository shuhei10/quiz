import type { Grade, Question } from "../types/types";

const base = import.meta.env.BASE_URL; 

async function fetchQuestionsByGrade(grade: Grade): Promise<Question[]> {
  const url = `${base}questions/grade${grade}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to load questions:", { grade, url, status: res.status });
    return [];
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    console.error("grade json is not array:", { grade, url, data });
    return [];
  }

  return data as Question[];
}

export async function loadQuestionsByGrade(grade: Grade): Promise<Question[]> {
  return await fetchQuestionsByGrade(grade);
}

export async function getChaptersByGrade(grade: Grade): Promise<string[]> {
  const qs = await fetchQuestionsByGrade(grade);

  const set = new Set<string>();
  for (const q of qs) {
    if (typeof (q as any).chapter === "string" && (q as any).chapter.trim()) {
      set.add((q as any).chapter.trim());
    }
  }
  return Array.from(set);
}

export async function loadQuestionsByGradeAndChapter(
  grade: Grade,
  chapter: string
): Promise<Question[]> {
  const qs = await fetchQuestionsByGrade(grade);

  // chapterなし = 全問題（テスト/総まとめ用）
  if (!chapter) return qs.filter((q) => q.grade === grade);

  return qs.filter((q) => q.grade === grade && q.chapter === chapter);
}
