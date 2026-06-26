import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = "/tmp/cov";
const ranks = fs.readdirSync(dir).filter((f) => /^\d+\.jpg$/.test(f)).map((f) => parseInt(f)).sort((a, b) => a - b);

const COLS = 8;
const CW = 180, CH = 290; // cell
const TW = 168, TH = 248; // thumb max
const PER = 32; // covers per sheet

async function buildSheet(list, idx) {
  const rows = Math.ceil(list.length / COLS);
  const W = COLS * CW, H = rows * CH;
  const base = sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } });

  const composites = [];
  const labels = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const col = i % COLS, row = Math.floor(i / COLS);
    const thumb = await sharp(path.join(dir, `${r}.jpg`))
      .resize(TW, TH, { fit: "contain", background: "#ffffff" })
      .toBuffer();
    composites.push({ input: thumb, left: col * CW + (CW - TW) / 2, top: row * CH + 6 });
    labels.push(`<text x="${col * CW + CW / 2}" y="${row * CH + CH - 14}" font-size="22" font-weight="bold" fill="#111" text-anchor="middle" font-family="Helvetica">${r}</text>`);
  }
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${labels.join("")}</svg>`;
  composites.push({ input: Buffer.from(svg), left: 0, top: 0 });

  const out = `/tmp/sheet${idx}.png`;
  await base.composite(composites).png().toFile(out);
  console.log(`${out}: ${list.length} covers (ranks ${list[0]}–${list[list.length - 1]})`);
}

let idx = 1;
for (let i = 0; i < ranks.length; i += PER) {
  await buildSheet(ranks.slice(i, i + PER), idx++);
}
