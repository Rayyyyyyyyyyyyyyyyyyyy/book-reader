## Why

首頁以網格加快速預覽彈窗呈現書目，能找書，卻少了實體書的探索感。交接規格（`docs/immersive-bookshelf/handoff.md`）要求：點哪本書，就看見**同一本**書從書架抽出、轉正、翻開、翻頁，關閉時回到原位；正式內容仍留在可分享的 `/book/<slug>` 書頁。

## What Changes

- 首頁預設改為書架檢視：每個分類一座木書架，書脊為輕量 CSS 按鈕；保留原網格為「列表」檢視，兩者共用同一組搜尋、分類與只看有心得篩選。
- 書脊外觀：依編號決定性的高度與厚度，每層由高到矮排列；顏色取封面中央主色（建置時以 sharp 計算）；書名完整顯示，依書脊大小調整字級，必要時依封面斷句分欄；直書標點使用全形。
- 選書後只掛載一本 CSS 3D 書（GSAP 時間軸）：從書脊實際座標抽出、轉正、沿書脊打開封面、可翻 2 張書頁（3 組跨頁），關閉時翻回書頁、合上封面並飛回重新量測的書脊位置。
- 3D 書封面改為排版式封面（書脊同色）；來源封面為出版社立體書影，改放在封面內頁。
- 封面斷句資料獨立存放於 `site/src/data/title-breaks.ts`，不寫入書目 Markdown。
- 手機：書架單排橫向捲動，開書為單頁並可滑動翻頁。
- 新增 `npm run test:e2e`（Playwright，Chromium）。

## Capabilities

### Modified Capabilities

- `book-catalog`：新增書架檢視、書脊外觀與檢視切換。
- `book-detail`：新增書架上的抽書預覽、翻頁與收書行為；網格檢視的快速預覽彈窗維持不變。

## Impact

- 新增：`site/src/components/shelf/`、`site/src/lib/spine.ts`、`site/src/lib/covers.ts`、`site/src/data/title-breaks.ts`、`site/src/styles/shelf.css`、`site/src/styles/stage.css`、`site/tests/`、`site/playwright.config.ts`。
- 修改：`BookGrid.tsx`（檢視切換）、`index.astro`、`books.ts`（`BookMeta.coverColor`）。
- 依賴：`gsap`、`@gsap/react`、`sharp`（原為 Astro 間接依賴，改為直接宣告）；開發依賴 `@playwright/test`、`@astrojs/check`、`typescript`。
- 書目資料：僅 111 號書名依封面更正為「蛤蟆先生去看心理師」；心得正文未改。
