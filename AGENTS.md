# Repository Guidelines

本 repo 維護讀書心得、閱讀素材與「百冊 · One Hundred」網站。架構與建置機制見 [CLAUDE.md](CLAUDE.md)，文件入口見 [docs/README.md](docs/README.md)。

## 結構與資料來源

- `site/` 是 Astro 靜態網站：頁面在 `src/pages/`，React 互動元件在 `src/components/`，共用邏輯在 `src/lib/`，全域樣式在 `src/styles/`。
- `site/src/content/books/` 是書籍資料與已發布讀書心得的單一真實來源。每本書一個 Markdown 檔；frontmatter 是書目，正文是心得。
- `book-reader/讀書心得/` 保存心得草稿，檔名即書名；`book-reader/is-me/` 保存私人生命素材、聲音參考與心得寫作計畫，不直接發布。
- `book-png/` 保存原始封面；`site/scripts/covers.mjs` 按三位數排名產生網站資產。
- `openspec/specs/` 保存現行網站規格，`openspec/changes/archive/` 保存網站變更紀錄。較大的功能調整同步相關規格與 change。

## 心得、隨筆與生命素材

撰寫、改寫 Rui-Xuan 讀書心得、反思隨筆或整理生命素材，使用 [rui-xuan-reading](.agents/skills/rui-xuan-reading/SKILL.md)。先辨認任務是整理素材、提供回饋，還是寫作；貼上隨筆不等於要求改寫。陪讀與閱讀反應使用 [ai-reader](.agents/skills/ai-reader/SKILL.md)，判讀回饋採納價值使用 [ai-editor](.agents/skills/ai-editor/SKILL.md)。

更新 `book-reader/is-me/Rui-Xuan-生命素材.md` 時，沿用「主題（真實的事）／可接到的概念／落地句範例」三欄表格：

- 主題抓核心經歷、觀察或比喻，保留辨識細節，不貼全文或長摘要。
- 概念說清機制、矛盾與適用條件，不只摘關鍵字，也不推定未提供的心理動機。
- 落地句轉成具體動作、情境或選擇，使用「你／我們」，句尾不留標點，不虛構作者經歷。正式隨筆仍可使用「我」。

素材重疊時優先補充或合併；跨書串連與素材引用限實際提供、存在且讀過的內容。

## 建置與驗證

在 `site/` 執行：

```bash
npm install
npm run dev
npm run build
npm run preview
npm run covers
```

`dev` 與 `build` 前自動產生封面。提交前至少跑 `npm run build`；介面變更再檢查首頁搜尋、分類、書籍詳情、RSS 與行動版。尚未配置自動化測試框架，新增測試與來源相鄰，使用 `*.test.ts` 或 `*.test.tsx`。

## 程式與內容格式

TypeScript、TSX、Astro 使用兩格縮排、雙引號及分號，保持 strict TypeScript。React 元件 PascalCase，函式與變數 camelCase。

書籍檔名為 `NNN-english-slug.md`，沒有英文名時可只用排名。Frontmatter 的 `rank`、`cat`、`zh`、`en`、`author`、`desc` 遵守 `src/content.config.ts`；`cat` 使用 `src/data/categories.ts` 的 key。

## Git 與資產

Commit 使用簡短、祈使語氣的英文主旨，每筆聚焦一項變更。逐一指定相關檔案，避免夾帶未確認內容或產生檔。PR 說明目的、影響與驗證，附相關 OpenSpec change；視覺或響應式修改附前後截圖，合併前確認 Pages 建置成功。

部署預設 `/book-reader`，可用 `SITE_URL`、`BASE_PATH` 覆寫。不提交密鑰、`.env`、`site/dist/` 或產生的封面。原始封面維持 `NNN_*.jpg` 命名。
