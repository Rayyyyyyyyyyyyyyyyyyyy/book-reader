## Why

「百冊」選書網站目前是 Claude Design 產出的單一 `.dc.html` 原型(位於 `百冊_style/百冊書選.dc.html`),跑在專屬的 `support.js` runtime 上,而且同一份資料散落在 `百冊_style/百冊書選.dc.html` 的 `books[]`、`docs/書單與編號.md`、`docs/bookList.md`、`百冊_style/book-notes.js` 多處、彼此會逐漸走鐘。雖然能上 GitHub Pages,但無法用標準前端框架維護、每本書/每篇心得沒有獨立網址(不利分享與 SEO),也難以持續擴充內容。

目標是把它遷移到 Astro + React island 的標準前端框架:保留現有視覺與動畫、把資料收斂成單一來源、為每本書與心得提供可分享的網址,並建立可長期擴充的內容流程。

## What Changes

- 以 Astro + React island 重建網站,放在新子資料夾 `site/`,build 成靜態檔部署到 GitHub Pages。
- **BREAKING**:移除 Claude Design 專屬格式——刪除 `support.js` runtime、`.dc.html` 模板語法(`<x-dc>`/`<sc-for>`/`<sc-if>`/`{{ }}`)、以及 `book-notes.js` 那包手工 JS。
- 資料收斂為單一來源:每本書一個 Markdown 檔(frontmatter = 後設資料,內文 = 讀書心得),取代 `百冊_style/百冊書選.dc.html` 的 `books[]` + `docs/書單與編號.md` + `docs/bookList.md` + `百冊_style/book-notes.js` 的多方重複。
- 「有沒有心得」改由 Markdown 內文是否存在判斷,修掉舊版用 `cat === "soul"` 判斷而漏算 `die0`、`naval` 的計數瑕疵。
- 接上 111 張真實封面(`book-png/001–111` 已備齊),取代「封面待補」佔位;佔位邏輯僅作防呆 fallback(注意 `102_The-Big-Five-for-Life.jpg` 檔名與書目不符,遷移時需修正)。
- 導覽改為:點卡片開快速預覽彈窗並同步更新 URL(可分享、可用上一頁關閉);書頁與心得頁合併為同一頁,取消舊版「彈窗 → 再點閱讀心得 → 全螢幕」的兩段式流程。
- 保留米色襯線排版、滑入動畫與封面視差;**移除**脆弱的自訂滑輪平滑捲動劫持。
- 為「分享/SEO」新增:build 時為每本書/每篇心得生成 OG 分享圖、`sitemap.xml`、心得 RSS 訂閱;Noto Serif TC 字型自架並子集化;封面以 Astro `<Image>` 最佳化。

## Capabilities

### New Capabilities

- `book-content-model`: 單一來源的書籍內容模型——一書一個 Markdown 檔、frontmatter schema、封面對應規則、心得即內文。
- `book-catalog`: 可瀏覽/分類篩選/搜尋的書目首頁(React island),含分類 chips、搜尋、書格與滑入/視差動畫。
- `book-detail`: 開啟單本書的體驗——彈窗快速預覽並同步 URL、合併後的書籍/心得頁面(Markdown 渲染)。
- `site-delivery`: 靜態建置與交付——Astro 靜態輸出、GitHub Pages base path、OG 分享圖、sitemap、RSS、字型自架子集化、封面圖最佳化。

### Modified Capabilities

<!-- 無既有 spec。openspec/specs/ 目前為空,本次全為新建 capability。 -->

## Impact

- **新增**:`site/`(Astro 專案、`package.json`、`astro.config`、React 元件、content collection、`public/covers/`)、GitHub Pages 部署 workflow。
- **移除/取代**:`百冊_style/`(`百冊書選.dc.html`、`support.js`、`book-notes.js`、`.thumbnail`)在遷移完成後不再作為網站來源。
- **沿用為資料來源**:
  - `百冊_style/百冊書選.dc.html` 的 `books[]` — 提供一句話簡介 `desc`、`cat` 分類鍵與 `noteKey` 對應
  - `docs/書單與編號.md` — 乾淨的 111 本編號/分類權威清單(★ 標示有筆記)
  - `docs/bookList.md` — 中文/英文/作者對照(無 `desc`),僅作交叉比對
  - `百冊_style/notes/*.md` 與 `book-reader/*.md` — 讀書心得內文(兩份同源)
  - `book-png/001–111` — 封面圖
- **可選/未來素材**(本次不納入):`gemini-books/`(目前 6 篇深度解析,對應書 1–6)。
- **相關工具**:`scripts/{fetch,apple,google}_covers.py` 為既有封面抓取腳本,封面正規化可沿用或參考。
- **依賴**:新增 Astro、React、Astro 整合(image、sitemap、rss、OG 圖生成)、字型資源套件;需 Node 建置環境與 GitHub Actions。
