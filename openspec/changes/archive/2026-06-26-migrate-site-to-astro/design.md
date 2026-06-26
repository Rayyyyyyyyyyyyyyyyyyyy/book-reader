## Context

現有「百冊」網站是 Claude Design 產出的單檔 `百冊_style/百冊書選.dc.html`,實際上是一個跑在 `support.js`(專屬 dc-runtime,內含 React)上的 React 元件:

- `class Component extends DCLogic` ≈ React 元件(`state`/`setState`/`componentDidMount`)。
- 模板語法 `{{ }}`、`<sc-for>`、`<sc-if>`、`<x-dc>`、`<helmet>` 由 runtime 解譯。
- 資料寫死於 `books[]`(111 筆,含手寫 `desc`、`cat`、`noteKey`)、分類 `cats[7]`;心得另存於 `百冊_style/book-notes.js`(`window.BOOK_NOTES`,以 `noteKey` 對應),其原始檔為 `百冊_style/notes/*.md` 與 `book-reader/*.md`(兩份同源)。另有 `docs/書單與編號.md`(乾淨的 111 編號/分類清單、★ 標示有筆記)與 `docs/bookList.md`(中/英/作者表)兩份平行清單。
- `componentDidMount` 內約 120 行原生 DOM/RAF:自訂滑輪平滑捲動劫持、捲動滑入 + clip-path、封面視差。
- 封面 `book-png/001–111`(已備齊)目前完全未被使用,畫面僅顯示「封面待補」佔位;其中 `102_The-Big-Five-for-Life.jpg` 檔名與書目(《你的人生,他們六個說了算》/ Habits of a Happy Brain)不符,需於遷移時修正。
- 既有 `scripts/{fetch,apple,google}_covers.py` 為封面抓取腳本;`gemini-books/` 另有 6 篇深度解析(對應書 1–6),屬本次範圍外的未來素材。

關鍵資料事實:`n:1–100` 為一般選書(故「百冊」= 100 本),`n:101–111` 為 soul 心靈類共 11 本;`#50`(die0)、`#66`(naval)雖非 soul 卻有 `noteKey`,因此舊版用 `cat === "soul"` 統計心得篇數會漏算。`#31/#35/#53/#85/#86` 的 `zh` 為空(台灣尚未出版)。

約束:最終須部署到 GitHub Pages(靜態、子路徑);需保留視覺與多數動畫;`docs/bookList.md`、`docs/書單與編號.md` 不含 `desc`,`noteKey` 對應僅存在於 HTML `books[]`,故權威來源為 HTML `books[]`,docs 兩份清單僅作交叉比對。

## Goals / Non-Goals

**Goals:**

- 以 Astro + React island 取代 dc-runtime,放在 `site/` 子資料夾,build 為靜態檔上 GitHub Pages。
- 將 HTML `books[]` + `docs/書單與編號.md` + `docs/bookList.md` + `book-notes.js` 收斂為單一 content collection(一書一檔)。
- 視覺與滑入/視差動畫對齊原型;移除自訂滑輪捲動劫持。
- 每本書與每篇心得有可分享網址;彈窗同步 URL;書頁與心得頁合併。
- 為分享/SEO 加上 OG 圖、sitemap、RSS;字型自架子集化;封面圖最佳化。

**Non-Goals:**

- 不做後台 CMS 或執行期 API(純靜態)。
- 不做真正的 i18n 切換(維持中英並陳的現狀)。
- 不重新設計視覺(沿用原型風格)。
- 不在本次調整書單內容或心得文字(僅遷移)。

## Decisions

### 決策 1:Astro + React island(而非純 Vite SPA 或 Next.js)

選 Astro:原型整頁是一個互動 app,但目標同時要「每本書/心得獨立網址 + SEO + 大量內容擴充」。Astro 的 content collections 天生適合 Markdown 心得,並能為每本書/心得預先產生靜態頁,同時把互動書目以 React island(`client:load`)載入。

- 替代:純 Vite + React SPA — 移植最快但無真網址/SEO、Markdown 需自理,與目標衝突。
- 替代:Next.js static export — 可行但較重,content collections 體驗不如 Astro。

### 決策 2:一書一 Markdown 檔的 content collection 為唯一來源

每本書 = `site/src/content/books/NNN-slug.md`,frontmatter 為後設資料、內文為心得(可空)。以 Zod schema 驗證。分類 `cats[7]` 另存 `site/src/data/categories.ts`。

- 「是否有心得」= body 是否非空 → 自動修正舊版漏算 die0/naval。
- 來源以 HTML 的 `books[]` 為準(取其 `desc`/`zh`/`author`/`cat`/`n`/`noteKey`),以 `docs/書單與編號.md` 交叉比對編號與分類,心得內文取自 `百冊_style/notes/*.md` 與 `book-reader/*.md`。
- 替代:沿用 CSV 或 JSON 單檔 — 但「一書一檔 + 內文即心得」對擴充與心得撰寫最友善,且 Markdown 可被 Astro 原生渲染(可刪除 `parseNote`)。

### 決策 3:島嶼只接收後設資料,心得內文留在各自頁

Astro 於 build 時讀 collection,將「後設資料 JSON」(書名/作者/分類/簡介/封面/slug/hasNote)作為 props 傳給書目 island 供搜尋與篩選;心得全文不打包進 island,改由各書的靜態頁渲染。避免把 111 篇心得塞進首屏 bundle。

### 決策 4:彈窗 + URL 同步,書頁/心得頁合併

點卡片開快速預覽彈窗,同時 `history.pushState` 將網址改為該書連結;關閉還原,瀏覽器上一頁可關彈窗;直接造訪該連結則呈現對應書籍。每本書另有合併的靜態頁(書籍資訊 + 心得同頁),取消兩段式 reader。

- 替代:純導頁(View Transitions)— 最乾淨但需重調動效;純彈窗(無 URL)— 無法分享。折衷取「彈窗即時 + URL 可分享 + 靜態頁保底」。

### 決策 5:動畫照搬,移除滑輪劫持

滑入 + clip-path + 視差為純 RAF/DOM,移入 island 的 `useEffect`(或 `reveal.ts` 由 `client:load` 載入),逐行照搬並維持 `prefers-reduced-motion` 關閉。移除 `_onWheel`/`_onExtScroll` 的滑輪平滑捲動劫持(對 trackpad、無障礙、跨頁導覽脆弱)。

### 決策 6:交付與 SEO

`astro.config` 設 `base:'/<repo>'`、靜態輸出;GitHub Actions 部署。整合 `@astrojs/sitemap`、`@astrojs/rss`、build 時 OG 圖生成(satori 類),字型以 `@fontsource` 等自架子集化,封面用 Astro `<Image>`。

### 決策 7:網址、slug 與 soul 用語

- **網址結構**:每本書單一 `/book/<slug>`,書籍資訊與心得同頁;心得以 `#note` 錨點供深連結與分享,RSS 心得項目指向 `/book/<slug>#note`。不另設 `/note/` 路由(與合併頁一致)。
- **slug 規則**:`rank`(三位補零)+ 英文書名 slug,例 `/book/055-atomic-habits`。保證唯一與穩定;缺英文書名者退回純 `rank`——#103《別人怎麼對你,都是你教的》(黃啟團,寶瓶文化)為中文原創書、無官方英文書名,slug 定為 `/book/103`。
- **soul 用語**:soul 心靈類(101–111)沿用原型的 `No.101–111` 連號顯示,與一般選書一致;hero 仍維持「100 本選書 · 11 篇讀書筆記」的區分。

## Risks / Trade-offs

- [GitHub Pages base 路徑設錯導致資源 404] → 以 `import.meta.env.BASE_URL`/Astro 內建處理連結與資源,部署後實測子路徑。
- [封面 `book-png` 檔名帶標題 slug、與 rank 對應需對齊,且 `102` 檔名錯置] → 建置前以腳本依 rank 正規化為 `site/public/covers/NNN.jpg`、修正 102、保留缺檔的佔位 fallback。
- [資料遷移自多份來源(HTML `books[]`、`docs/書單與編號.md`、`docs/bookList.md`、心得檔)易出錯/漏書] → 以 `books[]` 為權威、`docs/書單與編號.md` 交叉比對,寫一次性遷移腳本生成 111 檔,並驗證數量(100 + 11)與 `noteKey`↔心得檔對應齊全。
- [Noto Serif TC 子集化可能漏字(書名含罕用字)] → 子集涵蓋全站實際用字或採動態子集,build 後抽查書名渲染。
- [彈窗 URL 同步與瀏覽器歷史互動複雜] → 以單一 popstate 來源管理彈窗開關狀態,直接造訪連結走靜態頁保底。
- [整頁為單一大 island,Astro 的「零 JS」效益有限] → 可接受;互動本就是首頁核心,心得頁仍維持近零 JS。

## Migration Plan

1. 在 `site/` 建立 Astro 專案與依賴(不動既有檔案)。
2. 寫遷移腳本:讀 `百冊_style/百冊書選.dc.html` 的 `books[]`(以 `docs/書單與編號.md` 比對)與 `百冊_style/notes/`、`book-reader/` 心得,生成 `site/src/content/books/*.md`;正規化封面 `book-png/001–111` 到 `site/public/covers/`(修正 102 檔名)。
3. 移植元件(版式、分類、搜尋、書格、動畫)與彈窗 + URL、合併書頁。
4. 加交付/SEO(base、sitemap、RSS、OG、字型、圖片最佳化)與 GitHub Actions。
5. 與原型並存比對(視覺/動畫/資料數量)通過後,將 `百冊_style/` 退役為非網站來源(保留原始 `.md` 心得作備份)。

回滾:遷移前的 `.dc.html` 原型保留於 git 歷史與 `百冊_style/`,部署有問題可暫時改回原型上 Pages。

## Open Questions

(無——原先三項網址/slug/soul 用語已於決策 7 定案。)
