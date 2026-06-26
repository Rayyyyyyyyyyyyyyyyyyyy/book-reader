## 1. 專案骨架

- [ ] 1.1 在 `site/` 初始化 Astro 專案與 React 整合(`@astrojs/react`),設定 TypeScript
- [ ] 1.2 設定 `astro.config`:靜態輸出、`base:'/<repo>'`、`site` URL
- [ ] 1.3 加入依賴:`@astrojs/sitemap`、`@astrojs/rss`、OG 圖生成(satori 類)、字型套件(`@fontsource` Noto Serif TC / Cormorant Garamond)
- [ ] 1.4 建立基礎 layout 與全域樣式(自原型抽出米色襯線視覺),自架並子集化字型

## 2. 內容模型與資料遷移

- [ ] 2.1 定義 content collection schema(Zod):`rank/cat/zh(可空)/en/author/desc/cover?`,內文為心得
- [ ] 2.2 建立 `src/data/categories.ts`(沿用 `cats[7]` 鍵值與順序)
- [ ] 2.3 寫一次性遷移腳本:以 `百冊_style/百冊書選.dc.html` 的 `books[]` 為權威來源(`docs/書單與編號.md` 交叉比對)生成 111 個 `site/src/content/books/NNN-slug.md`
- [ ] 2.4 將 `百冊_style/notes/*.md` 與 `book-reader/*.md` 心得依 `noteKey` 併入對應書檔內文
- [ ] 2.5 封面正規化腳本(可參考 `scripts/*.py`):`book-png/001–111` → `site/public/covers/NNN.jpg`(對齊 rank、去除標題 slug、修正 `102` 檔名錯置)
- [ ] 2.6 驗證遷移:書籍總數=111(100 + 11 soul)、`noteKey`↔心得齊全、5 本空 `zh`(#31/#35/#53/#85/#86)正確、封面 001–111 對應無缺且 102 已修正

## 3. 書目首頁(React island)

- [ ] 3.1 Astro 讀 collection,將「後設資料 JSON」(不含心得全文)傳入 `BookGrid` island
- [ ] 3.2 移植 hero(統計數字:100 本選書 / 以內文計的心得篇數)與 footer
- [ ] 3.3 移植分類分區與書格(分類底色/版式),封面以 Astro `<Image>` 最佳化、缺檔退回佔位
- [ ] 3.4 移植分類 chips 篩選與選取狀態
- [ ] 3.5 移植即時搜尋(書名/作者比對)、命中數、清除搜尋、無結果提示
- [ ] 3.6 移植動畫:捲動滑入 + clip-path + 封面視差(`useEffect`/`reveal.ts`),維持 `prefers-reduced-motion` 停用
- [ ] 3.7 移除自訂滑輪平滑捲動劫持,改用原生捲動

## 4. 書籍詳情與心得頁

- [ ] 4.1 實作快速預覽彈窗(封面/分類/編號/書名/作者/簡介/心得入口),支援 Escape、遮罩、關閉鈕
- [ ] 4.2 彈窗同步 URL(`pushState`)、關閉還原、上一頁可關、直接造訪連結可呈現對應書
- [ ] 4.3 建立每本書的合併靜態頁,網址 `/book/<rank>-<英文slug>`(缺英文退回 `/book/<rank>`),書籍資訊 + 心得同頁、心得以 Markdown 原生渲染,心得段加 `#note` 錨點
- [ ] 4.4 無心得時顯示「整理中」狀態並停用心得連結;刪除原型 `parseNote`

## 5. 交付與 SEO

- [ ] 5.1 為首頁/書頁/心得加 OG meta 與 build 時 OG 圖生成
- [ ] 5.2 加入 `sitemap.xml` 與心得 RSS(RSS 項目連向 `/book/<slug>#note`)
- [ ] 5.3 建立 GitHub Actions workflow 自動 build 並發佈到 GitHub Pages
- [ ] 5.4 部署後實測:子路徑資源無 404、字型不打外部請求、分享連結預覽正常

## 6. 收尾

- [ ] 6.1 與原型並存比對(視覺/動畫/資料數量)確認對齊
- [ ] 6.2 將 `百冊_style/`(`.dc.html`/`support.js`/`book-notes.js`/`.thumbnail`)退役為非網站來源,保留原始心得 `.md` 備份
- [ ] 6.3 更新 README:本機開發、build、部署說明
