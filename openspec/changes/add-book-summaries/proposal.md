## Why

每本書只有一句話簡介，沒有心得的書頁幾乎沒有內容。作者要為全部書目補上書本摘要；心得仍由作者親自撰寫，兩者不可混淆。

## What Changes

- 書目 frontmatter 新增選填的 `summary`，長度 200–300 字（不計標點與空白，連續英文或數字算 1 字），建置時驗證。
- 書頁在書籍資訊與讀書心得之間顯示「書本摘要」。
- 摘要不放正文，因為正文非空即代表「有心得」，會影響書籤記號、篩選與 RSS。

## Impact

- `site/src/content.config.ts`、`site/src/pages/book/[...slug].astro`、`site/src/content/books/*.md`。
- 首頁、書架預覽與 RSS 不變。
