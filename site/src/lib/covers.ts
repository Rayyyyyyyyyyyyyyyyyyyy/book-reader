import { getImage } from "astro:assets";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const coverModules = import.meta.glob<{ default: ImageMetadata }>("../assets/covers/*.jpg", { eager: true });

// Optimized cover URL (modern format), sized for grid cards and the photo inside the 3D book's cover.
export async function coverUrl(file?: string): Promise<string> {
  if (!file) return "";
  const mod = coverModules[`../assets/covers/${file}`];
  if (!mod) return "";
  const img = await getImage({ src: mod.default, width: 420, format: "webp" });
  return img.src;
}

// Dominant colour of the cover's centre as "#rrggbb" ("" without a cover). The source covers are
// 3D mockup photos on white, so only the middle of the image counts; colours are binned 4 bits per channel.
export async function coverColor(file?: string): Promise<string> {
  if (!file) return "";
  const src = path.join(process.cwd(), "src/assets/covers", file); // build runs from site/
  if (!existsSync(src)) return "";
  const { data } = await sharp(src).resize(40, 60, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let y = 12; y < 48; y++)
    for (let x = 8; x < 32; x++) {
      const i = (y * 40 + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      bin.n++;
      bin.r += r;
      bin.g += g;
      bin.b += b;
      bins.set(key, bin);
    }
  const top = [...bins.values()].reduce((a, b) => (b.n > a.n ? b : a));
  return "#" + [top.r, top.g, top.b].map((v) => Math.round(v / top.n).toString(16).padStart(2, "0")).join("");
}
