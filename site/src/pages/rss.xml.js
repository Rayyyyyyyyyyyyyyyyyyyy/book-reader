import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const entries = await getCollection("books");
  const withNotes = entries
    .filter((e) => (e.body ?? "").trim().length > 0)
    .sort((a, b) => a.data.rank - b.data.rank);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return rss({
    title: "百冊 · 讀書筆記",
    description: "一份持續更新的選書清單與讀書心得。",
    site: context.site,
    items: withNotes.map((e) => ({
      title: e.data.zh || e.data.en,
      description: e.data.desc,
      link: `${base}/book/${e.id}#note`,
    })),
    customData: `<language>zh-Hant</language>`,
  });
}
