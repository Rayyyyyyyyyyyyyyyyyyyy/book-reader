# Repository Guidelines

本檔是 Claude Code 與 Codex 共用的規則層。**架構與機制細節在 `CLAUDE.md`**（建置期產物、書稿閱讀器管線、book-v2 流水線、skills 對應、openspec 檔案結構）——兩個 agent 都應一併讀取，本檔不重複那些內容。

## 專案結構與模組組織

- `site/` 是正式網站：Astro 頁面位於 `src/pages/`，React 互動元件位於 `src/components/`，共用邏輯放在 `src/lib/`，全域樣式放在 `src/styles/`。
- `site/src/content/books/` 是網站書籍資料與已發布讀書心得的單一真實來源；每本書使用一個 Markdown 檔，frontmatter 存放書目資料，正文存放心得。
- `book-png/` 保存原始封面；`site/scripts/covers.mjs` 依三位數排名產生網站封面。`book-reader/` 保存草稿與寫作材料，`docs/` 保存規格、章節腳本與流程腳本。
- `book-reader/讀書心得/` 保存心得稿，檔名即書名；`book-reader/is-me/` 保存私人生命素材與寫作參考，不直接發布到網站。
- 書稿有兩份：`book-reader/book/` 是 v1 完稿，也是網站書稿閱讀器實際發布的內容；`book-reader/book-v2/` 是進行中的新版正文，一章一檔，另有 `_continuity.md` 與 `_feedback/`。兩份不互相覆蓋，改動前先確認在哪一份。
- `openspec/` 保存功能規格、設計與變更紀錄；較大的功能調整應同步更新相關 change。

## 寫作與生命素材

- 撰寫、改寫 Rui-Xuan 讀書心得與反思隨筆，或整理生命素材時，使用 [rui-xuan-book-v2](.agents/skills/rui-xuan-book-v2/SKILL.md)。先辨認使用者要整理素材、提供回饋，還是寫作；貼上隨筆不等於要求改寫。
- 同一份 skill 也適用於 `book-reader/book-v2/` 的正文：不論是流水線產出的整章，還是只手改幾句，都要照它的聲音規則，並遵守 `docs/book-v2-workflow.md` 的「使用者修稿偏好」與「一致性清單」。
- 直接修改 `book-reader/book-v2/*.md` 正文時，使用 [book-v2-direct-edit](.agents/skills/book-v2-direct-edit/SKILL.md)；只改幾句、依回饋補寫、套用作者裁定或潤飾也會觸發。它要求同一輪實際開原檔並先交出附行號的逐字引文；**貼不出引文就是沒讀，沒讀不動筆。** 只讀不改不觸發，由 `codex exec` 執行的流水線步驟不重跑。
- 更新 `book-reader/is-me/Rui-Xuan-生命素材.md` 時，沿用「主題（真實的事）／可接到的概念／落地句範例」三欄表格。
- **主題**只抓核心經歷、觀察或比喻，保留辨識所需的細節，不貼全文或寫成長摘要。
- **可接到的概念**需思考素材背後的機制、矛盾與適用條件，不能只摘關鍵字，也不推定未提供的心理動機。
- **落地句範例**需把概念轉成具體動作、情境或選擇，使用「你／我們」，句尾不留標點；不只替換原文人稱，也不虛構作者經歷。正式隨筆仍可使用「我」。
- 不同切入點可拆成獨立條目；與既有素材重疊時，優先補充或合併。引用生命素材或跨書串連時，以實際提供、讀過的內容為依據。

## 建置、測試與開發指令

請在 `site/` 目錄執行：

```bash
npm install          # 安裝相依套件
npm run dev          # 產生封面並啟動本機開發伺服器
npm run build        # 建置靜態網站至 dist/，也是主要驗證指令
npm run preview      # 預覽已建置的網站
npm run covers       # 僅重新整理封面資產
npm run reader       # 本機預覽書稿閱讀器（127.0.0.1:4178，READER_PORT 可改）
npm run reader:phone # 綁 0.0.0.0，手機同網段可連
```

`dev` 與 `build` 之前會自動產生封面與書稿閱讀器，細節見 `CLAUDE.md`。

## 程式風格與命名慣例

TypeScript、TSX 與 Astro 採兩格縮排、雙引號及分號，並維持現有 strict TypeScript 設定。React 元件使用 PascalCase（如 `BookGrid.tsx`），函式與變數使用 camelCase。書籍檔名採 `NNN-english-slug.md`；沒有英文書名時可只用排名，例如 `103.md`。Frontmatter 的 `rank`、`cat`、`zh`、`en`、`author`、`desc` 應符合 `src/content.config.ts` schema，其中 `cat` 必須是 `src/data/categories.ts` 的 key。

## 測試指南

目前未配置自動化測試框架或覆蓋率門檻。提交前至少執行 `npm run build`；介面變更另以 `npm run preview` 檢查首頁搜尋、分類、書籍詳情、RSS 與行動版版面。新增測試時，請將檔案與來源相鄰並命名為 `*.test.ts` 或 `*.test.tsx`。

## Commit 與 Pull Request

歷史提交採簡短、祈使語氣的英文主旨，例如 `Support searching books by catalog number`。每個 commit 聚焦一項變更，避免混入產生檔或無關重排。`book-reader/book-v2/` 的章節正文、`_continuity.md` 與該章回饋檔，要等作者人工校閱並明確同意後才 commit；未經同意的章節即使已寫完也留在工作區。提交書稿時逐一指定檔案，不要用 `git add -A`，以免把尚未校閱的章節一起帶進去。套用作者親手修改的書稿句子時，commit 主旨必須含 `hand edit`（如 `Apply the author's hand edit and approve chapter 6`）——`docs/book-v2-pipeline.sh` 以 `git log --grep="hand edit"` 抽出這些句子並要求後續步驟原樣保留，訊息漏字會讓下一輪把它們改掉；但一個章節檔**第一次進版控**時不要寫 `hand edit`，新檔案的 diff 每一行都是新增行，會把整章凍成不可改動，改用 `EXTRA_AUTHOR` 保護指定句子。作者說「第 N 章看完了／改好了」之後不是只有 commit：照 `docs/book-v2-workflow.md`「作者校閱完成後」七步做完，其中第 3 步（從本章手改迭代修稿偏好）、第 4 步（重新產生 `_feedback/全書-作者手改句.md`）與第 5 步（更新 `docs/book-v2-handoff.md` 的字數與狀態）最常被跳過。PR 應說明目的、影響範圍與驗證方式，連結相關 issue 或 OpenSpec change；若改動視覺或響應式行為，附上前後截圖。合併前確認 GitHub Pages 建置成功。

## 設定與資產注意事項

部署預設使用 `/book-reader` base path；本機或自訂網域可透過 `SITE_URL` 與 `BASE_PATH` 覆寫。請勿提交密鑰、`.env` 或 `site/dist/`。更新封面時保留 `NNN_*.jpg` 命名，使書目排名可穩定對應資產。
