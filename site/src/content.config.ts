import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_KEYS } from "./data/categories";

// One markdown file per book. Frontmatter = metadata, body = reading note (optional).
const books = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
  schema: z.object({
    rank: z.number().int().positive(),
    cat: z.enum(CATEGORY_KEYS as [string, ...string[]]),
    zh: z.string(), // may be empty string (台灣尚未出版)
    en: z.string(), // may be empty string (中文原創,無英文書名)
    author: z.string(),
    desc: z.string(),
    cover: z.string().optional(), // filename under public/covers/, defaults by rank
  }),
});

export const collections = { books };
