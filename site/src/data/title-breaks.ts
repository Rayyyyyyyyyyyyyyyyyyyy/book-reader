// Line breaks as printed on each book's cover, keyed by rank. "\n" marks a break (replacing the space
// in Latin titles); undoing it must give back the display title exactly, otherwise the entry is ignored.
// Titles that sit on one line on the cover are left out.
const TITLE_BREAKS: Record<number, string> = {
  4: "情緒\n跟你以為的\n不一樣",
  5: "好人總是\n自以為是",
  6: "快樂\n為什麼不幸福?",
  7: "推出你的\n影響力",
  10: "安靜,\n就是力量",
  16: "強大內心的\n自我對話習慣",
  18: "修復關係的\n正向衝突",
  24: "葛洛夫\n給經理人的\n第一課",
  26: "OKR:\n做最重要\n的事",
  28: "什麼才是\n經營最難的事?",
  31: "The Great\nCEO\nWithin",
  32: "亞馬遜\n逆向\n工作法",
  34: "超乎\n常理的\n款待",
  39: "智慧型\n股票投資人",
  40: "彼得林區\n選股戰略",
  41: "原則:\n生活和工作",
  43: "約翰柏格\n投資常識",
  44: "投資\n最重要的事",
  47: "股票作手\n回憶錄",
  48: "為投資人\n賺錢的CEO\n長怎樣?",
  52: "矽谷創投\n啟示錄",
  53: "In This\nEconomy?",
  54: "更富有、\n更睿智、\n更快樂",
  71: "打造\n你要的人生",
  72: "10倍\n成長思維",
  78: "千腦智能\n新理論",
  81: "錯把太太\n當帽子的人",
  82: "躲在\n我腦中的\n陌生人",
  85: "The\nHidden Spring",
  86: "How to\nChange a\nMemory",
  90: "槍炮、\n病菌與\n鋼鐵",
  97: "3.3秒的\n呼吸奧祕",
  99: "命定:\n沒有自由意志的科學",
  100: "五感之外的\n世界",
  102: "你的人生,\n他們六個說了算",
  103: "別人怎麼對你,\n都是你教的",
  106: "最後一次相遇,\n我們只談喜悅",
  107: "死過一次\n才學會愛",
  108: "當呼吸\n化為空氣",
  109: "Rewire－\n神經可塑性",
  111: "蛤蟆先生\n去看心理醫生",
};

// Display title with the cover's line breaks, or the plain title when none are recorded.
export function coverTitle(book: { rank: number; dCover: string }): string {
  const broken = TITLE_BREAKS[book.rank];
  const matches = broken && [broken.replaceAll("\n", ""), broken.replaceAll("\n", " ")].includes(book.dCover);
  return matches ? broken : book.dCover;
}
