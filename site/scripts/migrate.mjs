// One-time migration: build the books content collection from the prototype.
// Source of truth: 百冊_style/百冊書選.dc.html  books[]  (desc, cat, noteKey, n)
// Note bodies:     百冊_style/notes/<noteKey>.md
// Cross-check:     docs/書單與編號.md (count + numbering)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "..", "..");
const htmlPath = path.join(repo, "百冊_style", "百冊書選.dc.html");
const notesDir = path.join(repo, "百冊_style", "notes");
const outDir = path.join(__dirname, "..", "src", "content", "books");

const html = fs.readFileSync(htmlPath, "utf8");

// Extract the `books = [ ... ];` JS array literal and evaluate it.
const start = html.indexOf("books = [");
if (start === -1) throw new Error("books[] not found in prototype HTML");
const arrStart = html.indexOf("[", start);
let depth = 0,
  end = -1;
for (let i = arrStart; i < html.length; i++) {
  if (html[i] === "[") depth++;
  else if (html[i] === "]") {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
const literal = html.slice(arrStart, end + 1);
// eslint-disable-next-line no-new-func
const books = new Function(`return ${literal}`)();
console.log(`Parsed ${books.length} books from prototype.`);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad(n) {
  return String(n).padStart(3, "0");
}

// Read + clean a note body: strip a leading H1 (page renders its own title).
function readNote(key) {
  const p = path.join(notesDir, `${key}.md`);
  if (!fs.existsSync(p)) return null;
  let md = fs.readFileSync(p, "utf8").replace(/\r/g, "").trim();
  md = md.replace(/^#\s+.*\n+/, ""); // drop leading "# Title"
  return md.trim();
}

function yamlString(s) {
  // Quote and escape for YAML double-quoted scalar.
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

fs.mkdirSync(outDir, { recursive: true });
// Clear previously generated files (idempotent re-runs).
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith(".md")) fs.rmSync(path.join(outDir, f));
}

let withNote = 0;
for (const b of books) {
  const enSlug = b.en ? slugify(b.en) : "";
  const base = enSlug ? `${pad(b.n)}-${enSlug}` : `${pad(b.n)}`;
  const note = b.noteKey ? readNote(b.noteKey) : null;
  if (note) withNote++;

  const fm = [
    "---",
    `rank: ${b.n}`,
    `cat: ${b.cat}`,
    `zh: ${yamlString(b.zh ?? "")}`,
    `en: ${yamlString(b.en ?? "")}`,
    `author: ${yamlString(b.author ?? "")}`,
    `desc: ${yamlString(b.desc ?? "")}`,
    `cover: ${yamlString(`${pad(b.n)}.jpg`)}`,
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(outDir, `${base}.md`), fm + (note ? note + "\n" : ""));
}

console.log(`Wrote ${books.length} files to src/content/books (${withNote} with notes).`);

// Sanity checks.
const nonSoul = books.filter((b) => b.cat !== "soul").length;
const soul = books.filter((b) => b.cat === "soul").length;
console.log(`  non-soul: ${nonSoul} (expect 100), soul: ${soul} (expect 11)`);
const emptyZh = books.filter((b) => !b.zh).map((b) => b.n);
console.log(`  empty zh ranks: ${emptyZh.join(", ")}`);
const noteKeys = books.filter((b) => b.noteKey);
const missing = noteKeys.filter((b) => !readNote(b.noteKey)).map((b) => b.noteKey);
console.log(`  noteKey books: ${noteKeys.length}, missing note files: ${missing.join(", ") || "none"}`);
