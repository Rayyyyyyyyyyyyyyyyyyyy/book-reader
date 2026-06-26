import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import fs from "node:fs";
import path from "node:path";

const entries = await getCollection("books");
const pages: Record<string, { rank: number; zh: string; en: string; author: string }> = Object.fromEntries(
  entries.map((e) => [e.id, e.data]),
);
pages.home = { rank: 0, zh: "影響一個世代的一百本書", en: "One Hundred · A Reading List", author: "選書清單與讀書心得" };

// Optional: drop a full CJK font (OTF/TTF) here to render Chinese titles in OG
// cards. Without it we fall back to the English title (bundled Latin font),
// which renders reliably for the ~106 books that have one.
const cjkFontPath = path.resolve("src/assets/fonts/NotoSerifTC.otf");
const hasCJK = fs.existsSync(cjkFontPath);

export const { getStaticPaths, GET } = OGImageRoute({
  param: "route",
  pages,
  getImageOptions: (id, page: (typeof pages)[string]) => {
    const title = hasCJK ? page.zh || page.en : page.en || page.zh;
    const desc =
      id === "home" ? page.author : `${page.author}　·　百冊 No.${String(page.rank).padStart(3, "0")}`;
    return {
      title: title || "百冊",
      description: desc,
      bgGradient: [[243, 237, 225]],
      border: { color: [44, 38, 32], width: 12, side: "inline-start" },
      padding: 64,
      // Only override fonts when a full CJK font is present; otherwise use the
      // library's bundled Latin font (avoids a null FontMgr).
      ...(hasCJK ? { fonts: [cjkFontPath] } : {}),
      font: {
        title: { color: [44, 38, 32], size: 64, weight: "Bold", lineHeight: 1.3 },
        description: { color: [122, 113, 99], size: 30 },
      },
    };
  },
});
