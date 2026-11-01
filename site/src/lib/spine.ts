import type { BookMeta } from "./books";

export type SpineTone = "deep" | "accent" | "light" | "cream";

export type SpineLook = {
  width: number; // px on the shelf
  height: number; // fraction of the shelf row (0–1)
  tone: SpineTone; // fallback colour when the book has no cover colour
  fontSize: number; // px, chosen so the whole title fits
  cols: number; // vertical text columns (1 or 2)
};

export const SHELF_ROW = 228; // px, height of one shelf row
const TITLE_SPACE = 68; // px of the spine taken by head band, padding and the number
const MAX_FONT = 13.5;
const MIN_FONT = 8;

const TONES: SpineTone[] = ["deep", "accent", "light", "cream"];

// Cheap integer hash so every book keeps the same spine across builds and filters.
const hash = (n: number, salt: number) => {
  let h = (n * 2654435761 + salt * 40503) >>> 0;
  h ^= h >>> 15;
  return Math.imul(h, 2246822519) >>> 0;
};

// Length of a vertical title in em: CJK glyphs stand upright (1em + .12em tracking),
// Latin letters lie sideways and are narrower.
export function titleEm(title: string): number {
  let em = 0;
  for (const ch of title) em += /[⺀-￿]/.test(ch) ? 1.12 : 0.68;
  return em;
}

// Largest font that shows the whole title: one column first, then two columns if the spine is wide enough.
export function fitTitle(title: string, width: number, height: number): { fontSize: number; cols: number } {
  const room = height - TITLE_SPACE;
  const em = titleEm(title);
  for (const cols of [1, 2])
    for (let f = MAX_FONT; f >= (cols === 1 ? 11 : MIN_FONT); f -= 0.5)
      if (cols * f * 1.3 <= width - 6 && em * f <= room * cols * 0.92) return { fontSize: f, cols };
  return { fontSize: MIN_FONT, cols: 2 };
}

export function spineLook(book: Pick<BookMeta, "rank" | "dCover">): SpineLook {
  const long = titleEm(book.dCover) > 10;
  const width = (long ? 34 : 28) + (hash(book.rank, 1) % 14);
  const height = 0.8 + (hash(book.rank, 2) % 9) / 50;
  return {
    width,
    height,
    tone: TONES[hash(book.rank, 3) % TONES.length],
    ...fitTitle(book.dCover, width, SHELF_ROW * height),
  };
}

// Spine/cover colours from the cover's dominant colour; dark ink on light covers, paper ink on dark ones.
export function spineColors(hex: string): React.CSSProperties | undefined {
  if (!hex) return undefined;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
  const ink = light ? "#2c2620" : "#fbf7ee";
  return { "--sp-bg": hex, "--sp-ink": ink, "--sp-band": `color-mix(in srgb, ${ink} 45%, transparent)` } as React.CSSProperties;
}
