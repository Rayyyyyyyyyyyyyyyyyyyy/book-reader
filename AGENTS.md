# Repository Guidelines

## 專案結構與模組組織

- `site/` 是正式網站：Astro 頁面位於 `src/pages/`，React 互動元件位於 `src/components/`，共用邏輯放在 `src/lib/`，全域樣式放在 `src/styles/`。
- `site/src/content/books/` 是書籍資料與讀書心得的單一真實來源；每本書使用一個 Markdown 檔，frontmatter 存放書目資料，正文存放心得。
- `book-png/` 保存原始封面；`site/scripts/covers.mjs` 依三位數排名產生網站封面。`book-reader/` 保存草稿與寫作材料，`research/books/` 保存書籍研究，`docs/` 保存規格與提示詞。
- `openspec/` 保存功能規格、設計與變更紀錄；較大的功能調整應同步更新相關 change。

## 建置、測試與開發指令

請在 `site/` 目錄執行：

```bash
npm install          # 安裝相依套件
npm run dev          # 產生封面並啟動本機開發伺服器
npm run build        # 建置靜態網站至 dist/，也是主要驗證指令
npm run preview      # 預覽已建置的網站
npm run covers       # 僅重新整理封面資產
```

## 程式風格與命名慣例

TypeScript、TSX 與 Astro 採兩格縮排、雙引號及分號，並維持現有 strict TypeScript 設定。React 元件使用 PascalCase（如 `BookGrid.tsx`），函式與變數使用 camelCase。書籍檔名採 `NNN-english-slug.md`；沒有英文書名時可只用排名，例如 `103.md`。Frontmatter 的 `rank`、`cat`、`zh`、`en`、`author`、`desc` 應符合 `src/content.config.ts` schema。

## 測試指南

目前未配置自動化測試框架或覆蓋率門檻。提交前至少執行 `npm run build`；介面變更另以 `npm run preview` 檢查首頁搜尋、分類、書籍詳情、RSS 與行動版版面。新增測試時，請將檔案與來源相鄰並命名為 `*.test.ts` 或 `*.test.tsx`。

## Commit 與 Pull Request

歷史提交採簡短、祈使語氣的英文主旨，例如 `Support searching books by catalog number`。每個 commit 聚焦一項變更，避免混入產生檔或無關重排。PR 應說明目的、影響範圍與驗證方式，連結相關 issue 或 OpenSpec change；若改動視覺或響應式行為，附上前後截圖。合併前確認 GitHub Pages 建置成功。

## 設定與資產注意事項

部署預設使用 `/book-reader` base path；本機或自訂網域可透過 `SITE_URL` 與 `BASE_PATH` 覆寫。請勿提交密鑰、`.env` 或 `site/dist/`。更新封面時保留 `NNN_*.jpg` 命名，使書目排名可穩定對應資產。
