import { getCollection, type CollectionEntry } from "astro:content";
import { CATEGORY_ZH, CATEGORY_KEYS, type CategoryKey } from "../data/categories";

export type BookMeta = {
  rank: number;
  cat: CategoryKey;
  catZh: string;
  zh: string;
  en: string;
  author: string;
  desc: string;
  slug: string;
  cover: string; // optimized cover URL (filled by the page)
  hasNote: boolean;
  dCover: string; // display title
  dCaption: string; // display caption
  numStr: string; // "No.066"
  tagStr: string;
};

const pad = (n: number) => String(n).padStart(3, "0");

export function entryToMeta(entry: CollectionEntry<"books">, cover = ""): BookMeta {
  const d = entry.data;
  const cat = d.cat as CategoryKey;
  const hasNote = (entry.body ?? "").trim().length > 0;
  return {
    rank: d.rank,
    cat,
    catZh: CATEGORY_ZH[cat],
    zh: d.zh,
    en: d.en,
    author: d.author,
    desc: d.desc,
    slug: entry.id,
    cover,
    hasNote,
    dCover: d.zh || d.en,
    dCaption: d.zh ? d.en : "台灣尚未出版",
    numStr: "No." + pad(d.rank),
    tagStr: "No." + pad(d.rank),
  };
}

export async function getBooksSorted(): Promise<CollectionEntry<"books">[]> {
  const all = await getCollection("books");
  return all.sort((a, b) => a.data.rank - b.data.rank);
}

export function catIndex(cat: string): number {
  return CATEGORY_KEYS.indexOf(cat as CategoryKey);
}
