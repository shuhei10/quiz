import type { Grade, Question } from "../types/types";
import { QUESTIONS } from "../data/questions";

export async function loadQuestionsByGrade(grade: Grade): Promise<Question[]> {
  return QUESTIONS.filter((q) => q.grade === grade);
}

export async function getChaptersByGrade(grade: Grade): Promise<string[]> {
  const set = new Set<string>();
  for (const q of QUESTIONS) {
    if (q.grade === grade) set.add(q.chapter);
  }
  return Array.from(set);
}

export async function loadQuestionsByGradeAndChapter(
  grade: Grade,
  chapter: string
): Promise<Question[]> {
  return QUESTIONS.filter((q) => q.grade === grade && q.chapter === chapter);
}