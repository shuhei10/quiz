import type { Grade } from "../types";

function keyWrong(grade: Grade) {
  return `wh_quiz_wrong_ids_grade_${grade}_v1`;
}

export function loadWrongIds(grade: Grade): string[] {
  try {
    const raw = localStorage.getItem(keyWrong(grade));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveWrongIds(grade: Grade, ids: string[]) {
  const uniq = Array.from(new Set(ids));
  localStorage.setItem(keyWrong(grade), JSON.stringify(uniq));
}

export function addWrongIds(grade: Grade, newIds: string[]) {
  const current = loadWrongIds(grade);
  saveWrongIds(grade, [...current, ...newIds]);
}

// 復習で正解したらweakから消す
export function removeWrongIds(grade: Grade, idsToRemove: string[]) {
  const removeSet = new Set(idsToRemove);
  const current = loadWrongIds(grade);
  const next = current.filter((id) => !removeSet.has(id));
  saveWrongIds(grade, next);
}

export function clearWrongIds(grade: Grade) {
  localStorage.removeItem(keyWrong(grade));
}
