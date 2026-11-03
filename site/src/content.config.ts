import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_KEYS } from "./data/categories";

// Words as a reader counts them: each Han character is one, a run of Latin letters or digits is one, punctuation and spaces are none.
const WORDS = /\p{Script=Han}|(?:(?!\p{Script=Han})[\p{L}\p{N}])+/gu;
const wordCount = (s: string) => s.match(WORDS)?.length ?? 0;

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
    summary: z
      .string()
      .refine((s) => wordCount(s) >= 200 && wordCount(s) <= 300, "summary must be 200-300 words, excluding punctuation and spaces")
      .optional(), // kept out of the body: a non-empty body means "has a note"
    cover: z.string().optional(), // filename under public/covers/, defaults by rank
  }),
});

export const collections = { books };
