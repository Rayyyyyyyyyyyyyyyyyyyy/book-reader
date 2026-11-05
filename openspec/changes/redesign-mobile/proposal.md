## Why

手機的主要使用情境是作者快速找書、回查摘要及重讀心得。現有首屏與單頁翻書耗用空間，字級隨 3D 幾何縮小，且預覽網址無法直接分享。

## What Changes

- 僅在手機（寬度 <640px，或觸控且高度 ≤500px 的橫向手機）：單排 sticky 搜尋、分類與筆記篩選隨內容捲動，預設兩欄封面與書名，每分類有心得者優先。
- 用 head script 與響應式 SSR variants 在首屏決定檢視，避免 hydration 前閃書架；明確的 sessionStorage 選擇優先。
- 網格與書脊共用從實際來源位置開書的動畫，再進原生 dialog 的 17px 全文捲動閱讀；移除手機翻頁分支。
- 開書 pushState 到正式書頁網址；返回、收回、刷新、Forward 與 pageshow 維持可恢復的書目與乾淨的預覽狀態。
- 分享連結直接進入的靜態書頁也使用手機閱讀版式，回到書目不製造返回迴圈。
- 補 safe area、dvh、44px 目標、焦點與錯誤恢復，以及手機 e2e 規格。

## Capabilities

### New Capabilities

無；擴充現有能力。

### Modified Capabilities

- `book-catalog`: 手機預設檢視、SSR、搜尋、分類、文字與動態。
- `book-detail`: 手機全文閱讀、開合動畫、網址、返回與無障礙。

## Impact

影響 BookGrid、ImmersiveShelf、BookStage、Base、靜態書頁、樣式與 bookshelf e2e。新增 MobileReader；不新增依賴、不改書籍 Markdown、不改手機以外的既有書架、列表與 3D 翻頁流程（含 reader-back 修正）。

本 change 的手機規定優先於進行中的 `immersive-bookshelf` change 裡手機單頁翻頁與同網址預覽規定；該 change 的桌機規定完整保留。`immersive-bookshelf` 的相關條文已直接限定為手機以外，本 change 應在它封存之後才封存。瀏覽器與 Safari 驗收需由使用者另外授權，不在本次執行。
