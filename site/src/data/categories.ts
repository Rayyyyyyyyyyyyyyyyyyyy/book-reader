// Seven categories, in display order (from the prototype's cats[]).
export const CATEGORIES = [
  { key: "psych", zh: "大眾心理學", en: "Popular Psychology" },
  { key: "biz", zh: "商業管理", en: "Business & Management" },
  { key: "finance", zh: "財經與投資", en: "Finance & Investing" },
  { key: "growth", zh: "自我成長", en: "Self-Growth" },
  { key: "neuro", zh: "腦神經科學", en: "Brain & Neuroscience" },
  { key: "influence", zh: "暢銷與跨領域影響力", en: "Bestsellers & Beyond" },
  { key: "soul", zh: "心靈・人生", en: "Soul & Life" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as CategoryKey[];

export const CATEGORY_ZH: Record<CategoryKey, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.zh]),
) as Record<CategoryKey, string>;

export const CATEGORY_EN: Record<CategoryKey, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.en]),
) as Record<CategoryKey, string>;
