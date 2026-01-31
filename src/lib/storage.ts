import type { Grade } from "../types/quiz";

const key = (grade: Grade, chapter: string) => `wh-quiz-wrong-${grade}-${chapter}`;

export function loadWrongIds(grade: Grade, chapter: string): string[] {
  try {
    const raw = localStorage.getItem(key(grade, chapter));
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addWrongIds(grade: Grade, chapter: string, ids: string[]) {
  const prev = new Set(loadWrongIds(grade, chapter));
  for (const id of ids) prev.add(id);
  localStorage.setItem(key(grade, chapter), JSON.stringify([...prev]));
}

export function removeWrongIds(grade: Grade, chapter: string, ids: string[]) {
  const prev = new Set(loadWrongIds(grade, chapter));
  for (const id of ids) prev.delete(id);
  localStorage.setItem(key(grade, chapter), JSON.stringify([...prev]));
}