# Repository Guidelines

本檔是 Claude Code 與 Codex 共用的規則層。**架構與機制細節在 `CLAUDE.md`**（建置期產物、書稿閱讀器管線、book-v2 流水線、skills 對應、openspec 檔案結構）——兩個 agent 都應一併讀取，本檔不重複那些內容。

## 專案結構與模組組織

- `site/` 是正式網站：Astro 頁面位於 `src/pages/`，React 互動元件位於 `src/components/`，共用邏輯放在 `src/lib/`，全域樣式放在 `src/styles/`。
- `site/src/content/books/` 是網站書籍資料與已發布讀書心得的單一真實來源；每本書使用一個 Markdown 檔，frontmatter 存放書目資料，正文存放心得。
- `book-png/` 保存原始封面；`site/scripts/covers.mjs` 依三位數排名產生網站封面。`book-reader/` 保存草稿與寫作材料，`docs/` 保存規格、v2 章節腳本與流程腳本。v1 書稿與章卡已移至獨立的 `book-v1` repo；本 repo 的 v2 章卡在 `docs/chapter-v2/`，`docs/chapter.md` 僅是舊路徑索引。
- `book-reader/讀書心得/` 保存心得稿，檔名即書名；`book-reader/is-me/` 保存私人生命素材與寫作參考，不直接發布到網站。
- 書稿分屬兩個 repo：v1 完稿與修訂規劃在獨立的 `book-v1` repo；此處的 `book-reader/book-v2/` 是持續修訂、也是網站書稿閱讀器目前實際發布的正文，一章一檔，另有 `_continuity.md` 與 `_feedback/`。不要把兩份稿件互相覆蓋。
- `openspec/` 保存功能規格、設計與變更紀錄；較大的功能調整應同步更新相關 change。

## 寫作與生命素材

- 撰寫、改寫 Rui-Xuan 讀書心得與反思隨筆、整理生命素材，或處理 `book-reader/book-v2/` 正文時，使用 [rui-xuan-book-v2](.agents/skills/rui-xuan-book-v2/SKILL.md)。先辨認使用者要整理素材、提供回饋，還是寫作；貼上隨筆不等於要求改寫。
- 同一份 skill 是聲音與 book-v2 直接修改流程的單一入口：流水線產出的整章與只修改幾句都要遵守它；`docs/book-v2-workflow.md` 的「使用者修稿偏好」與「一致性清單」按本次問題核對，不當成逐條否決表。
- 討論 book-v2 人物時，以「男主角／女主角」代稱，不自行替人物取名字；正文仍依敘事視角使用原有人稱。
- 直接修改 `book-reader/book-v2/*.md` 正文時，依該 skill 的 [正文直改分支](.agents/skills/rui-xuan-book-v2/references/book-v2-direct-edit.md) 執行；只改幾句、依回饋補寫、套用作者裁定或潤飾也會觸發。同輪讀當前正文與相關 diff，依問題範圍補讀章卡、回饋或跨章紀錄；不要求動筆前逐條貼引文。只讀不改不觸發，由 `codex exec` 執行的流水線步驟按其 prompt 取材。
- 作者自 2026-09-23 起取消「手改句一律不動」的限制。作者手改是重要的聲音與取捨證據，但可為整段閱讀體驗再修；改動時記錄可確認的原句、改後句、來源與理由，交作者人工校閱，不把未核准的修稿當定稿。
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

歷史提交採簡短、祈使語氣的英文主旨，例如 `Support searching books by catalog number`。每個 commit 聚焦一項變更，避免混入產生檔或無關重排。`book-reader/book-v2/` 的章節正文、`_continuity.md` 與該章回饋檔，要等作者明確確認整章 OK 後才 commit；未經同意的章節即使已寫完也留在工作區。作者人工潤稿時，先理解手改用意並依上下文協助修稿；說「第 N 章看完了／改完了／改好了」只啟動整章與 diff 評讀，客觀列出好、不好與更佳建議，不等於定稿或提交；若同時請求修稿，就直接處理可確認的問題。只有作者明確說「這章 OK／可以定稿／同意提交」，才照 `docs/book-v2-workflow.md`「作者確認這章 OK 後的七步」迭代正式紀錄並提交，其中第 3 步（修稿偏好）、第 4 步（手改來源）與第 5 步（交接字數與狀態）最常被跳過。

提交書稿時逐一指定檔案，不要用 `git add -A`，以免把尚未校閱的章節一起帶進去。若 commit 含作者親手修改的書稿句子，主旨含 `hand edit`（如 `Apply the author's hand edit and approve chapter 6`），但 `git log --grep="hand edit"` 抽出的新增行只是來源候選，不是禁改名單，也不保證整個 diff 都由作者親筆寫成；以 `_feedback/全書-手改對照.md` 與本輪手改紀錄核實。章節檔第一次進版控時不要寫 `hand edit`，避免把整章誤標成作者親筆。PR 應說明目的、影響範圍與驗證方式，連結相關 issue 或 OpenSpec change；若改動視覺或響應式行為，附上前後截圖。合併前確認 GitHub Pages 建置成功。

## 設定與資產注意事項

部署預設使用 `/book-reader` base path；本機或自訂網域可透過 `SITE_URL` 與 `BASE_PATH` 覆寫。請勿提交密鑰、`.env` 或 `site/dist/`。更新封面時保留 `NNN_*.jpg` 命名，使書目排名可穩定對應資產。
