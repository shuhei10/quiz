// grade4-import-safe.cjs
// 目的：public/questions/grade4.json を安全にDBへ投入する（重複は後勝ち、DBはUPSERT）
//
// 前提（あなたのDB定義）
// questions: external_id(UNI), chapter_id(NOT NULL), title, explanation, image_path, image_alt, answer_choice_label, difficulty, is_active
//
// chapters テーブル前提（無ければテーブル名/カラム名を合わせる必要あり）
//  - id (PK)
//  - slug (UNIQUE) 例: "basic", "amami-okinawa", "jomon" など
//  - name (表示名)
//
// env
// DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME

const fs = require("fs");
const mysql = require("mysql2/promise");

// ---- util ----
function pickId(q) {
  const id = q.external_id ?? q.id;
  return typeof id === "string" ? id : null;
}

// g4-basic-001 -> { slug:"basic", no:"001" }
// g4-amami-okinawa-002 -> { slug:"amami-okinawa", no:"002" }
// g4-001 -> { slug:"basic", no:"001" } みたいな救済も入れる
function parseSlugFromExternalId(externalId) {
  // 期待：g4-<slug>-<no>
  const parts = externalId.split("-");
  if (parts.length >= 3) {
    // g4 + slugParts + no
    const no = parts[parts.length - 1];
    const slug = parts.slice(1, parts.length - 1).join("-");
    return { slug, no };
  }
  // 例外：g4-001 みたいなやつ
  if (parts.length === 2) {
    return { slug: "basic", no: parts[1] };
  }
  return { slug: "basic", no: "" };
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: node grade4-import-safe.cjs public/questions/grade4.json");
    process.exit(1);
  }

  // ---- read json ----
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // g4-* だけ対象（必要なら条件変えてOK）
  const rowsAll = raw
    .map((q) => ({ q, external_id: pickId(q) }))
    .filter((x) => x.external_id && x.external_id.startsWith("g4-"));

  // ---- dedup (last wins) ----
  const map = new Map();
  for (const x of rowsAll) map.set(x.external_id, x.q);
  const deduped = [...map.entries()].map(([external_id, q]) => ({ external_id, q }));

  const dupCount = rowsAll.length - deduped.length;

  // ---- db connect ----
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "quiz",
    password: process.env.DB_PASS ?? "quizquiz",
    database: process.env.DB_NAME ?? "wh_quiz",
    multipleStatements: false,
  });

  // ---- load chapters cache ----
  // chapters テーブルの形： id, slug, name を想定
  const [chapRows] = await conn.query("SELECT id, slug, name FROM chapters");
  const chapterBySlug = new Map(chapRows.map((r) => [String(r.slug), Number(r.id)]));

  // slugが無い場合は作る（name はとりあえず slug を入れる）
  async function getOrCreateChapterId(slug) {
    if (chapterBySlug.has(slug)) return chapterBySlug.get(slug);

    // insert
    const name = slug; // 表示名が欲しければ後で整える
    const [res] = await conn.execute(
      "INSERT INTO chapters (slug, name) VALUES (?, ?)",
      [slug, name],
    );
    const id = Number(res.insertId);
    chapterBySlug.set(slug, id);
    return id;
  }

  // ---- upsert ----
  const sql = `
    INSERT INTO questions (
      external_id, chapter_id, title, explanation,
      image_path, image_alt, answer_choice_label, difficulty, is_active
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
      chapter_id = VALUES(chapter_id),
      title = VALUES(title),
      explanation = VALUES(explanation),
      image_path = VALUES(image_path),
      image_alt = VALUES(image_alt),
      answer_choice_label = VALUES(answer_choice_label),
      difficulty = VALUES(difficulty),
      is_active = VALUES(is_active),
      updated_at = CURRENT_TIMESTAMP
  `;

  let upserted = 0;

  // まとめて速くしたいけど、まずは確実に（463程度なら全然OK）
  await conn.beginTransaction();
  try {
    for (const { external_id, q } of deduped) {
      const { slug } = parseSlugFromExternalId(external_id);
      const chapter_id = await getOrCreateChapterId(slug);

      // JSON側のキーはプロジェクトによって違うので “ありそうな候補” で拾う
      const title =
        q.title ?? q.question ?? q.q ?? q.text ?? "";
      const explanation =
        q.explanation ?? q.answerExplanation ?? q.exp ?? null;

      const image_path = q.image_path ?? q.imagePath ?? null;
      const image_alt = q.image_alt ?? q.imageAlt ?? null;

      // 4択ラベルとか（無ければnull）
      const answer_choice_label =
        q.answer_choice_label ?? q.answerChoiceLabel ?? null;

      // 難易度（無ければnull）
      const difficulty =
        q.difficulty ?? q.level ?? null;

      const is_active =
        q.is_active ?? 1;

      await conn.execute(sql, [
        external_id,
        chapter_id,
        String(title),
        explanation == null ? null : String(explanation),
        image_path == null ? null : String(image_path),
        image_alt == null ? null : String(image_alt),
        answer_choice_label == null ? null : String(answer_choice_label),
        difficulty == null ? null : Number(difficulty),
        Number(is_active) ? 1 : 0,
      ]);

      upserted += 1;
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    await conn.end();
  }

  console.log("---- import summary ----");
  console.log("JSON g4 rows:", rowsAll.length);
  console.log("JSON g4 unique:", deduped.length);
  console.log("JSON duplicates removed:", dupCount);
  console.log("UPSERT processed:", upserted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});