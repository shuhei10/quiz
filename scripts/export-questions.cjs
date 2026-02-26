// scripts/export-questions.cjs
// DB（questions / chapters）から public/questions/*.json を生成する
//
// 使い方：
// DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=quiz DB_PASS=quizquiz DB_NAME=wh_quiz \
// node scripts/export-questions.cjs g3
//
// 出力：
// public/questions/grade3.json
// public/questions/themes.json（章一覧＋件数）
//
// あなたのchapters定義：id, slug, title, grade, sort_order

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function gradeNumberFromPrefix(prefix) {
  const m = /^g(\d+)$/.exec(prefix);
  return m ? Number(m[1]) : null;
}

async function main() {
  const prefix = (process.argv[2] || "").trim(); // "g3"
  if (!/^g\d+$/.test(prefix)) {
    console.error("Usage: node scripts/export-questions.cjs g3");
    process.exit(1);
  }

  const gradeNo = gradeNumberFromPrefix(prefix);
  const outDir = path.join(process.cwd(), "public", "questions");
  ensureDir(outDir);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "quiz",
    password: process.env.DB_PASS ?? "quizquiz",
    database: process.env.DB_NAME ?? "wh_quiz",
  });

  // chapters は title カラム
  // grade が NULL の章もあるかもしれないので、その場合は学年問わず使える扱いにする
  const [chapters] = await conn.query(
    `
    SELECT id, slug, title, grade, sort_order
    FROM chapters
    WHERE grade = ? OR grade IS NULL
    ORDER BY sort_order, id
    `,
    [gradeNo],
  );

  const chapterById = new Map(chapters.map((c) => [Number(c.id), c]));

  // questions（学年は external_id の prefix で判定）
  const like = `${prefix}-%`;

  const [rows] = await conn.query(
    `
    SELECT
      id, external_id, chapter_id,
      title, explanation, image_path, image_alt,
      answer_choice_label, difficulty, is_active,
      created_at, updated_at
    FROM questions
    WHERE external_id LIKE ?
      AND is_active = 1
    ORDER BY external_id
    `,
    [like],
  );

  await conn.end();

  // PWA用の questions JSON
  const questions = rows.map((r) => {
    const chap = chapterById.get(Number(r.chapter_id));

    return {
      id: r.external_id,
      external_id: r.external_id,
      grade: gradeNo,
      chapter: chap?.title ?? chap?.slug ?? "unknown",
      chapter_slug: chap?.slug ?? null,
      title: r.title,
      explanation: r.explanation ?? null,
      image_path: r.image_path ?? null,
      image_alt: r.image_alt ?? null,
      answer_choice_label: r.answer_choice_label ?? null,
      difficulty: r.difficulty ?? null,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    };
  });

  const gradeFile = path.join(outDir, `grade${gradeNo}.json`);
  fs.writeFileSync(gradeFile, JSON.stringify(questions, null, 2), "utf8");

  // themes.json（章一覧＋件数＋並び順）
  const cntByChapterId = new Map();
  for (const r of rows) {
    const cid = Number(r.chapter_id);
    cntByChapterId.set(cid, (cntByChapterId.get(cid) ?? 0) + 1);
  }

  const themes = [...cntByChapterId.entries()]
    .map(([chapter_id, count]) => {
      const chap = chapterById.get(chapter_id);
      return {
        grade: gradeNo,
        chapter_id,
        slug: chap?.slug ?? null,
        title: chap?.title ?? null,
        sort_order: chap?.sort_order ?? 9999,
        count,
      };
    })
    .sort((a, b) => (a.sort_order - b.sort_order) || (b.count - a.count));

  const themesFile = path.join(outDir, "themes.json");
  fs.writeFileSync(themesFile, JSON.stringify(themes, null, 2), "utf8");

  console.log("---- export summary ----");
  console.log("prefix:", prefix);
  console.log("exported questions:", questions.length);
  console.log("wrote:", gradeFile);
  console.log("wrote:", themesFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});