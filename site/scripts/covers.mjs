// Normalize covers: book-png/NNN_<title>.jpg  ->  site/src/assets/covers/NNN.jpg
// Maps purely by the numeric rank prefix, so the mislabeled
// "102_The-Big-Five-for-Life.jpg" becomes "102.jpg" like the rest.
// NOTE: verify the 102 image is actually 《你的人生,他們六個說了算》's cover.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "..", "..");
const srcDir = path.join(repo, "book-png");
const outDir = path.join(__dirname, "..", "src", "assets", "covers");

fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
const seen = new Set();
for (const f of fs.readdirSync(srcDir)) {
  const m = f.match(/^(\d{3})_.*\.jpg$/i);
  if (!m) continue;
  const rank = m[1];
  if (seen.has(rank)) {
    console.warn(`  ! duplicate rank ${rank}: ${f}`);
    continue;
  }
  seen.add(rank);
  fs.copyFileSync(path.join(srcDir, f), path.join(outDir, `${rank}.jpg`));
  copied++;
}

console.log(`Copied ${copied} covers to src/assets/covers/.`);
const ranks = [...seen].sort();
const missing = [];
for (let i = 1; i <= 111; i++) {
  const r = String(i).padStart(3, "0");
  if (!seen.has(r)) missing.push(r);
}
console.log(`  ranks present: ${ranks.length}/111, missing: ${missing.join(", ") || "none"}`);
