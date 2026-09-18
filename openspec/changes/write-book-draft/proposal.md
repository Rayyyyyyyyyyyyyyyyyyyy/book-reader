# 撰寫《把自己的部分做完》全書初稿

> 2026-09-18：本 change 已進入經授權的單一故事改編，保留初版觀念與 hook，現行內容標準以 `docs/chapter.md` 為準。下方 Why 保留初稿規劃背景；原字數配額、逐章五件事與核心句要求已取消。新任務與既有完成紀錄分開追蹤。

## Why

書的規格已完備（`docs/chapter.md`：四部十二章架構、字數配額、每章五件事 checklist、現場檔判準、引用策略「默默吸收」皆已定案），寫作聲音已封存於 `$rui-xuan-book-v2` skill。全書約 12 萬字、橫跨數十個寫作 session，需要一個進度追蹤機制讓每個 session 能一句話接續「寫下一章」。

## What Changes

- 依 `docs/chapter.md` 的架構，按章節順序產出全書初稿：序章 → 第一部（1–3 章）→ 第二部（4–6 章）→ 第三部（7–9 章）→ 第四部（10–12 章）→ 結語 → 各部引言／練習／小結
- 初稿檔案落在 `book-reader/book/` 目錄（新目錄，與讀書心得的最上層 `.md` 分開）
- 本 change 刻意薄：**單一事實來源是 `docs/chapter.md`**，本 change 的 artifacts 不複製其內容，只指向它。書的架構若調整，改 `docs/chapter.md`，不改這裡

## Capabilities

### New Capabilities

- `book-manuscript`: 全書稿件的驗收標準，以 `docs/chapter.md` 的現行故事進程、改編連續性、觀念承接、hook、篇幅、引用與原始現場檔規則驗收，聲音符合 `$rui-xuan-book-v2` skill

### Modified Capabilities

（無。既有 specs 為網站相關：book-catalog、book-content-model、book-detail、site-delivery，皆不受影響）

## Impact

- 新增 `book-reader/book/` 目錄與各章 `.md` 初稿
- 不動網站、不動讀書心得；本輪另依使用者授權迭代 skill，與正文完成紀錄分開追蹤
- 寫作依據：`docs/chapter.md`；寫作聲音：`.agents/skills/rui-xuan-book-v2/SKILL.md`
