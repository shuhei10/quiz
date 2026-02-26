export type Theme = {
  grade: number;
  chapter_id: number;
  slug: string | null;
  title: string | null;
  sort_order: number;
  count: number;
};

export type Question = {
  id: string; // external_id
  external_id: string;
  grade: number;
  chapter: string;
  chapter_slug: string | null;
  title: string;
  explanation: string | null;
  image_path: string | null;
  image_alt: string | null;
  answer_choice_label: string | null;
  difficulty: number | null;
  updated_at: string | null;
};

const cacheKey = (grade: number) => `whq_cache_g${grade}`;

type CachePayload = {
  savedAt: string;
  questions: Question[];
  themes: Theme[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${url} ${res.status}`);
  return res.json();
}

export async function loadQuestionsWithCache(grade: number) {
  const key = cacheKey(grade);

  const readCache = (): CachePayload | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CachePayload;
    } catch {
      return null;
    }
  };

  const writeCache = (payload: CachePayload) => {
    localStorage.setItem(key, JSON.stringify(payload));
  };

  try {
    const [questions, themesAll] = await Promise.all([
      fetchJson<Question[]>(`/questions/grade${grade}.json`),
      fetchJson<Theme[]>(`/questions/themes.json`),
    ]);

    const themes = themesAll.filter((t) => t.grade === grade);

    const payload: CachePayload = {
      savedAt: new Date().toISOString(),
      questions,
      themes,
    };
    writeCache(payload);
    return { ...payload, source: "network" as const };
  } catch (e) {
    const cached = readCache();
    if (cached) return { ...cached, source: "cache" as const };
    throw e;
  }
}

const themeSelKey = (grade: number) => `whq:selectedThemeSlugs:g${grade}`;

export function loadSelectedThemeSlugs(grade: number): string[] {
  try {
    const raw = localStorage.getItem(themeSelKey(grade));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveSelectedThemeSlugs(grade: number, slugs: string[]) {
  localStorage.setItem(themeSelKey(grade), JSON.stringify(slugs));
}

export function sortThemes(themes: Theme[]) {
  return [...themes].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function getAllThemeSlugs(themes: Theme[]) {
  return themes.map((t) => t.slug).filter((s): s is string => !!s);
}

export function filterQuestionsBySelectedSlugs(
  questions: { chapter_slug: string | null }[],
  selectedSlugs: string[],
) {
  if (selectedSlugs.length === 0) return questions;
  const set = new Set(selectedSlugs);
  return questions.filter((q) => !!q.chapter_slug && set.has(q.chapter_slug));
}

export function toggleSlug(selected: string[], slug: string) {
  const has = selected.includes(slug);
  return has ? selected.filter((s) => s !== slug) : [...selected, slug];
}