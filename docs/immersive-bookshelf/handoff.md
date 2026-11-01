# 百冊 · One Hundred｜沉浸式 3D 書架改造交接規格

> 交給 Claude Code 的實作任務。參考圖 `book-reader-reference-storyboard.jpg` 是使用者提供錄影的逐格擷取；不是 UI mockup，也不是要複製其中的品牌、配色或書籍內容。

## 1. 任務目標

把現有「書籍網格 → 快速預覽 Modal」升級為「實體書架 → 書脊互動 → 抽出書籍 → 封面展開 → 翻頁式預覽 → 前往正式心得頁 → 收書返回」的連續動畫體驗。**主要由滑鼠、觸控和鍵盤互動觸發，不是捲動驅動的整頁動畫。**

優先還原**連續的物件身分與空間位置感**：使用者點哪本書，就應該看見**同一本**書由原始書架位置移動到中央，再打開；不得先淡出書脊、直接顯示另一個無關的 Modal，假裝完成抽書動畫。

影片展示的具體行為可以看出，但無法從影像確定原作者使用的 JS/3D 函式庫。技術選擇由本專案條件出發，勿將推測視為既有事實。

## 2. 目前程式碼與不可破壞的契約（已查閱 main）

- Repo：`Rayyyyyyyyyyyyyyyyyyyy/book-reader`，`main`。
- `site/` 是 Astro 5 靜態網站 + React 19 island，部署 GitHub Pages，base path 預設 `/book-reader`。
- `site/src/pages/index.astro`：讀取 content collection、產生最佳化封面，將 `books` / `cats` / `base` 傳給 `BookGrid client:load`。
- `site/src/components/BookGrid.tsx`：現有搜尋、分類 chips、只看有心得、書籍卡片、Reveal、快速預覽 Modal，包含 Escape 關閉。這是主要重構入口。
- `site/src/lib/books.ts`：`BookMeta` 已含 `rank`, `cat`, `catZh`, `zh`, `en`, `author`, `desc`, `slug`, `cover`, `hasNote`, `dCover`, `dCaption`, `numStr`, `tagStr`。
- `site/src/content/books/*.md`：書籍 metadata 與已發布心得的**單一真實來源**。首頁不能打包所有 Markdown 心得全文。
- `site/src/pages/book/[...slug].astro`：每本書的正式靜態書頁，原生 Markdown render，分享網址 `/book/<slug>`。務必保留。
- `site/src/styles/global.css`：既有米色紙張、襯線文字、七類色彩、reveal + reduced-motion 設定。
- `site/astro.config.mjs`：static output，預設 BASE `/book-reader`，可由 `BASE_PATH` 覆寫。
- 先讀 `AGENTS.md`、`CLAUDE.md`、`openspec/specs/book-catalog/spec.md` 與 `openspec/specs/book-detail/spec.md`；大型變更更新 OpenSpec。
- 保留 RSS、sitemap、OG 圖、SEO、圖片最佳化、封面佔位、內容 schema、搜尋（含書籍編號）、七分類篩選、只看有心得、既有書頁分享網址與上一頁行為。

## 3. UX 狀態機

| 狀態 | 輸入/行為 | 視覺回饋 | 下一狀態 |
|---|---|---|---|
| idle | 展示書架 | 不同高度、厚度、材質的書脊，木架陰影和層次；具可讀標籤 | previewing |
| previewing | hover / focus 書脊 | 輕微前移、抬升、光影強調、可讀書名提示 | idle / extracting |
| extracting | click / Enter 書脊 | 保留原位置錨點；選書從原座標向前抽出、旋轉至封面正對觀眾，背景變暗 | cover-opening |
| cover-opening | 抽書完成 | 封面沿書脊轉軸旋開，書背和頁塊有厚度 | opened |
| opened | 翻頁控制 / swipe | 書本維持中央且有紙張陰影，展示 metadata/簡介/心得入口 | flipping / closing / detail |
| flipping | 下一頁/上一頁 | 單張紙正反面變化、正確遮擋與陰影，完成後更新頁數 | opened |
| closing | Escape / close / backdrop | 依合理順序合頁、轉向、回到**原書脊座標**；完成後解除滾動鎖定，焦點回原書脊 | idle |
| detail | 點「閱讀完整心得／查看書頁」 | 到既有 `/book/<slug>` 靜態頁，正式內容可直接分享 | 新頁 |

**防競態**：動畫中重複點擊、換書、快速關閉、切換分類，必須不會發生雙書、殘影、卡死、錯誤書籍資料。狀態轉移具單一來源。Open/close 可 reverse 或安全地中止並清理。

## 4. 畫面與內容設計

- 書架為新首頁的主要書籍瀏覽模式；可保留現有網格作「列表檢視」切換/無動態降級，不能犧牲原有尋書效率。
- 100+ 書籍不應同時建立完整 3D DOM 書模型：**書架階段是輕量 CSS 書脊**；選中後才 mount 具有 `perspective`, `transform-style: preserve-3d`, `backface-visibility`, `transform-origin` 的中央 3D 書本。
- 書脊不能只把正面封面等比例縮窄。使用 CSS 產生實際書脊：書名、作者/編號（空間不足時用 tooltip），色彩可由分類、rank 決定，厚度與高度有適度、**決定性**變化；缺封面依原有 fallback。
- 挑書轉場應使用書脊 `getBoundingClientRect()` 或等效測量取得起點、中央舞台作終點，維持正確的起點與角度。選中書位佔位保持，避免書架重新排版。捲動/尺寸變化時能安全處理。
- 展開後是 **2–4 組內容頁的精緻預覽**：封面/書名、作者和分類、書籍簡介、是否有心得與 CTA。所有內容來自 `BookMeta`，**不捏造原書頁面，不假裝是整本書內容**。
- `hasNote=true` 顯示「閱讀我的讀書心得」，false 顯示「查看書頁 · 整理中」；兩者都連結正確的 `base + book/<slug>`。
- 保留網站「百冊」品牌與內容層級，既有米色/襯線風格可與木材場景融合。參考影片是**互動與動態節奏**參考，不是要求完全複製暗色木紋或對方書目。

## 5. 技術路線（優先順序）

1. 保留 Astro 靜態輸出、React island 與內容資料模型。適度拆分 `BookGrid`：可考慮 `BookCatalog`（搜尋/篩選/檢視模式）、`BookShelf`、`BookSpine`、`SelectedBookStage`、`BookPreviewPages`、動畫 orchestration hooks 和 scoped CSS。避免在單一元件繼續堆大量 inline style。
2. **優先 CSS 3D + GSAP timelines + `@gsap/react`**：GSAP 負責抽書、旋轉、開合時間線、背景/遮罩過渡；選中書舞台有實際 CSS 3D 書脊/封面/頁塊。React 端使用 `useGSAP` scope / cleanup / `contextSafe`，防止 unmount 後 timeline 更新。小規模可先用 CSS transforms 做驗證。
3. 真正的柔軟紙張翻頁若 CSS `rotateY()` 不足，再評估 `page-flip` / StPageFlip（支援 HTML 頁面與 mobile），**先驗證 React 19 與 Astro island 的整合、觸控衝突、destroy cleanup**，不要直接套用不相容 wrapper。不要在沒必要時把整站換成 Three.js 或 WebGL。
4. 如果 `page-flip` 的 DOM 管理會和 React ownership 發生衝突，使用純 JS adapter 在 ref 容器內初始化/銷毀，或使用有限張 CSS 3D 翻頁。交代取捨，不要硬接。
5. 不強迫加入 Astro ClientRouter；`/book/<slug>` 仍是標準可直接存取的靜態頁。如有需要，可另評估 View Transitions，但不能破壞書頁 history/分享行為。
6. 優先 `transform` / `opacity`，避免動態 layout thrash；動畫期間才有 RAF（若需）。尤其避免為每本書建立獨立 render loop。

## 6. 動畫目標參數（可微調）

- hover/focus：160–260ms，小幅 `translateZ` 或 `translateY`，hover out 可逆。
- 抽書：550–850ms，先脫離書架、再走向舞台，明顯的旋轉與陰影改變。
- 開封面：450–750ms，軸心貼書脊，封面不應像一片從中央旋轉的卡片。
- 翻頁：450–800ms，頁正反面與前後層次正確；避免全部頁一起旋轉。
- 關閉：完整收束回原位，不用簡單 fade-out 代替。
- 一次只選一本；動畫期間禁止重入；支援 ESC 與操作中斷清理。

## 7. 響應式、無障礙與退化策略

- Desktop：書架可多層排列，書脊 hover 可辨識；書本展開視窗大小合理，CTA 清楚。
- 手機觸控：不能依賴 hover；第一下觸控選書，左右手勢/按鈕翻頁；小螢幕可呈現單頁，不可被雙頁書壓成難以閱讀的微字；書架可水平捲動而不錯誤觸發全頁滾動。
- 鍵盤：書脊是 `button` 或等價語意，Tab 可到、Enter/Space 可選，左右鍵可翻頁，Escape 關閉；關閉後 focus 回到先前書脊，模態舞台 `role=dialog`、`aria-modal`、適當 label 和 focus trap。
- 使用者 `prefers-reduced-motion: reduce` 時，改成可用的無動畫預覽；關閉仍可操作。
- 失敗退化：CSS 3D 不可用或低效能裝置仍能選書、讀簡介、連結正式心得頁。
- 不阻斷瀏覽器原生 scroll、不劫持 wheel；防止 `overflow: hidden` 導致 3D flatten、Safari backface 顛倒、點不到連結、背景滾動未恢復。

## 8. 分階段交付，別一次寫成動畫巨獸

**Phase A — 程式盤點與低保真驗證**
- 讀現有 repo / OpenSpec，先列出改動檔案和理由，指出既有行為/風險。
- 做最小可用樣本：只以 3 本真實書籍為代表，展示「書脊 → 抽出 → 開書 → 關閉回原位」的完整可逆鏈；先驗證座標、state、CSS 3D、Safari 概念。

**Phase B — 完整書架 + 資料整合**
- 所有書目接現有 `BookMeta`，支持分類/搜尋/只看有心得，保留網格視圖切換；封面缺圖降級；選中書狀態與 URL 正確。
- 暗背景與 focus/scroll 管理、手機版預覽。

**Phase C — 進階翻頁與品質門檻**
- 增加真正的逐張翻頁、紙張厚度/陰影/背面、觸控與鍵盤支援。
- 動畫中斷、視窗尺寸變化、切換搜尋、重複操作、Safari 與 Chrome 測試；文件與 OpenSpec 更新。

每 Phase 要有可建置、可瀏覽的成果，不得只輸出 demo GIF 或純概念稿。

## 9. 驗收條件

- 點第 N 本書，抽出來的封面與 `BookMeta` 是**同一本**，有連續抽出動畫；不是 dissolve 到 Modal。
- 書本打開可翻 2 頁以上，有旋轉軸、頁面遮擋和反面表現；翻頁完成才可進下一個狀態。
- Escape/關閉可逆回到**原書脊位置**，不留下 duplicate 或無法點擊的 overlay。
- 搜尋（中/英文書名、作者、編號）、七分類、只看有心得都可以運作，包含搜尋結果變化時不能卡選書狀態。
- 已發布心得/未發布心得按既有 `hasNote` 顯示正確 CTA；所有 `/book/<slug>` 連結都帶正確 `/book-reader/` base。
- 直接進入正式靜態書頁、刷新、返回、OG/RSS/sitemap 都正常。
- 手機單頁/可觸控；reduce motion 無動畫但完整可操作。
- 不新增不必要的大型 3D 引擎；沒有 100+ 完整 3D 模型常駐；動畫清理避免記憶體洩漏。
- `cd site && npm run build` 成功；用本機瀏覽器實測桌面與手機，截圖/錄影回報；輸出變更清單、風險、未完成項、實測結果。

## 10. 實作執行規則（給 Claude Code）

1. 從最新主分支開 `feat/immersive-bookshelf`；若已有未提交更動，先說明並勿覆蓋。未取得允許不要直接 push / merge 到 main。
2. 先讀相關 `AGENTS.md`、`CLAUDE.md`、OpenSpec 與 UI 程式碼。**不修改書目 Markdown/心得原文/私人素材**。
3. 給出簡短的風險與檔案改動計畫後，開始實作，不要只停留在規劃文件。
4. 保留現有 grid 作可切換的退路。因為 `BookGrid.tsx` 已相當集中，優先重構共享 filter/state；避免複製兩套搜尋邏輯。
5. 增加必要的 UI 測試；如需新增測試套件，保持最小依賴與合理範圍。
6. 完成每個 Phase 都做 build/驗證並簡述結果；執行中任何視覺錯誤先用真實瀏覽器測試修正，不要只以 typecheck 宣告完成。
7. 不要冒充有測過 Safari/手機；有測才記錄，沒測要列在未驗證項。

## 11. 提供給 Claude 的參考材料

- 本檔：`CLAUDE_BOOK_READER_MOTION_HANDOFF.md`
- 影片：`ScreenRecording_11-01-2026 08-03-46_1.mp4`（若 Claude 介面可接收）
- 從影片擷取：`book-reader-reference-storyboard.jpg`
- Repo：`https://github.com/Rayyyyyyyyyyyyyyyyyyyy/book-reader`

核心原則：**前台用實體書的探索感，內容依然用適合閱讀與可分享的正式書頁。**
