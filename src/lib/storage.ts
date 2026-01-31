import type { Grade } from "../types/types";

const norm = (s: string) => s.trim();
const key = (grade: Grade, chapter: string) => `wh-quiz-wrong-${grade}-${norm(chapter)}`;

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
  const ch = norm(chapter);
  if (!ch) return; // ★ 空chapterは保存しない（変なキー防止）

  const prev = new Set(loadWrongIds(grade, ch));
  for (const id of ids) prev.add(id);
  localStorage.setItem(key(grade, ch), JSON.stringify([...prev]));
}

export function removeWrongIds(grade: Grade, chapter: string, ids: string[]) {
  const ch = norm(chapter);
  if (!ch) return;

  const prev = new Set(loadWrongIds(grade, ch));
  for (const id of ids) prev.delete(id);
  localStorage.setItem(key(grade, ch), JSON.stringify([...prev]));
}

/**
 * ★総まとめ用：そのgradeの全chapter分のwrongIdsをユニークに集計
 */
export function loadAllWrongIdsByGrade(grade: Grade): string[] {
  const prefix = `wh-quiz-wrong-${grade}-`;
  const all = new Set<string>();

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith(prefix)) continue;

    try {
      const raw = localStorage.getItem(k);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(arr)) for (const id of arr) all.add(id);
    } catch {
      // ignore broken entry
    }
  }

  return [...all];
}

/**
 * ★総まとめ復習で正解した問題を、全chapterのwrongリストから削除する
 */
export function removeWrongIdsFromAllChapters(grade: Grade, ids: string[]) {
  const prefix = `wh-quiz-wrong-${grade}-`;
  const target = new Set(ids);

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith(prefix)) continue;

    try {
      const raw = localStorage.getItem(k);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (!Array.isArray(arr)) continue;

      const next = arr.filter((id) => !target.has(id));
      localStorage.setItem(k, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
}

/**
 * ★指定chapterの復習データを削除（テーマ別リセット）
 */
export function clearWrongIds(grade: Grade, chapter: string) {
  const ch = norm(chapter);
  if (!ch) return;
  localStorage.removeItem(key(grade, ch));
}

/**
 * ★指定gradeの復習データを全部削除（総まとめリセット）
 */
export function clearAllWrongIdsByGrade(grade: Grade) {
  const prefix = `wh-quiz-wrong-${grade}-`;

  // 先に消すキー一覧を作る（remove中にlengthが変わるのを避ける）
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keysToRemove.push(k);
  }

  for (const k of keysToRemove) localStorage.removeItem(k);
}
