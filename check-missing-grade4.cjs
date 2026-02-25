// check-missing-grade4.cjs
const fs = require("fs");
const mysql = require("mysql2/promise");

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: node check-missing-grade4.cjs public/questions/grade4.json");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const jsonIds = data
    .map((q) => q.external_id ?? q.id)
    .filter((v) => typeof v === "string" && v.startsWith("g4-"));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "wh_quiz",
  });

  const [rows] = await conn.query(
    "SELECT external_id FROM questions WHERE external_id LIKE 'g4-%'"
  );
  await conn.end();

  const dbIds = rows.map((r) => r.external_id);

  const jsonSet = new Set(jsonIds);
  const dbSet = new Set(dbIds);

  // JSON duplicates
  const cnt = new Map();
  for (const id of jsonIds) cnt.set(id, (cnt.get(id) || 0) + 1);
  const dups = [...cnt.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

  // Diffs
  const missingInDb = jsonIds.filter((id) => !dbSet.has(id));
  const extraInDb = dbIds.filter((id) => !jsonSet.has(id));

  console.log("JSON g4 count:", jsonIds.length);
  console.log("JSON g4 unique:", jsonSet.size);
  console.log("DB g4 count:", dbIds.length);
  console.log("Missing in DB:", missingInDb.length);
  console.log("Extra in DB:", extraInDb.length);
  console.log("Duplicate kinds in JSON:", dups.length);

  if (dups.length) {
    console.log("---- JSON duplicates (top 30) ----");
    for (const [id, c] of dups.slice(0, 30)) console.log(c, id);
  }
  if (missingInDb.length) {
    console.log("---- Missing in DB (all) ----");
    missingInDb.forEach((id) => console.log(id));
  }
  if (extraInDb.length) {
    console.log("---- Extra in DB (all) ----");
    extraInDb.forEach((id) => console.log(id));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});