import type { BookMeta } from "./books";

export type SpineTone = "deep" | "accent" | "light" | "cream";

export type SpineLook = {
  width: number; // px on the shelf
  height: number; // fraction of the shelf row (0–1)
  tone: SpineTone;
};

const TONES: SpineTone[] = ["deep", "accent", "light", "cream"];

// Cheap integer hash so every book keeps the same spine across builds and filters.
const hash = (n: number, salt: number) => {
  let h = (n * 2654435761 + salt * 40503) >>> 0;
  h ^= h >>> 15;
  return Math.imul(h, 2246822519) >>> 0;
};

export function spineLook(book: Pick<BookMeta, "rank" | "dCover">): SpineLook {
  const long = book.dCover.length > 9;
  return {
    width: (long ? 34 : 28) + (hash(book.rank, 1) % 14),
    height: 0.8 + (hash(book.rank, 2) % 9) / 50,
    tone: TONES[hash(book.rank, 3) % TONES.length],
  };
}
