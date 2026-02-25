require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");

const DB = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "quiz",
  password: process.env.DB_PASS ?? "quizquiz",
  database: process.env.DB_NAME ?? "wh_quiz",
};

function makeSlug(grade, chapterTitle) {
  const base = String(chapterTitle ?? "").trim();
  return (`g${grade}-` + base)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ぁ-んァ-ヶ一-龠]/g, "");
}

async function main() {
  const jsonPath = process.argv[2] ?? "public/questions/grade4.json";
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items)) {
    throw new Error("grade4.json must be an array: [ {...}, {...} ]");
  }

  const conn = await mysql.createConnection(DB);
  await conn.beginTransaction();

  try {
    let ok = 0;

    for (const q of items) {
      const externalId = String(q.id ?? "").trim();
      const grade = Number(q.grade ?? 4) || 4;
      const chapterTitle = String(q.chapter ?? "").trim();
      const title = String(q.title ?? "").trim();
      const explanation = q.explanation != null ? String(q.explanation) : null;
      const imagePath = q.image != null ? String(q.image) : null;
      const imageAlt = q.imageAlt != null ? String(q.imageAlt) : null;
      const answerLabel = q.answerId != null ? String(q.answerId).trim() : null;

      if (!externalId || !chapterTitle || !title) continue;

      // Chapter upsert
      const slug = makeSlug(grade, chapterTitle);
      await conn.execute(
        `
        INSERT INTO chapters (slug, title, grade, sort_order)
        VALUES (?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE title=VALUES(title), grade=VALUES(grade)
        `,
        [slug, chapterTitle, grade]
      );

      const [chapterRows] = await conn.execute(
        `SELECT id FROM chapters WHERE slug=? LIMIT 1`,
        [slug]
      );
      const chapterId = chapterRows[0].id;

      // Question upsert
      await conn.execute(
        `
        INSERT INTO questions
          (external_id, chapter_id, title, explanation, image_path, image_alt, answer_choice_label, difficulty, is_active)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, NULL, 1)
        ON DUPLICATE KEY UPDATE
          chapter_id=VALUES(chapter_id),
          title=VALUES(title),
          explanation=VALUES(explanation),
          image_path=VALUES(image_path),
          image_alt=VALUES(image_alt),
          answer_choice_label=VALUES(answer_choice_label),
          is_active=1
        `,
        [externalId, chapterId, title, explanation, imagePath, imageAlt, answerLabel]
      );

      const [qRows] = await conn.execute(
        `SELECT id FROM questions WHERE external_id=? LIMIT 1`,
        [externalId]
      );
      const questionId = qRows[0].id;

      // Choices replace
      await conn.execute(`DELETE FROM choices WHERE question_id=?`, [questionId]);

      const choices = Array.isArray(q.choices) ? q.choices : [];
      let order = 1;
      for (const c of choices) {
        const label = String(c.id ?? "").trim();
        const text = String(c.text ?? "");
        if (!label || !text) continue;

        const isCorrect = answerLabel && label === answerLabel ? 1 : 0;

        await conn.execute(
          `
          INSERT INTO choices (question_id, choice_label, choice_text, is_correct, sort_order)
          VALUES (?, ?, ?, ?, ?)
          `,
          [questionId, label, text, isCorrect, order]
        );
        order++;
      }

      ok++;
    }

    await conn.commit();
    await conn.end();
    console.log(`Imported: ${ok}/${items.length}`);
  } catch (e) {
    await conn.rollback();
    await conn.end();
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});