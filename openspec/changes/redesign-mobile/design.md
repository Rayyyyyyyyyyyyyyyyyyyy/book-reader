## Context

Astro 預先產生首頁與每本書的靜態頁，首頁為 client:load 的 React island。BookStage 負責桌機 3D；既有手機分支共享書頁幾何與分頁，無法維持舒適字級。寬度界線為 640px，使用既有紙色、墨色、分類 accent 與兩套 serif。

## Decisions

1. SSR 同時輸出受 CSS 隱藏的書架與手機網格；桌機網格只在 hydration 確認非手機後才渲染，因此桌機也只多一份網格。head 的同步 script 讀取 sessionStorage 與 matchMedia，在 body 繪製前決定顯示；React 初始 null 與 SSR 一致，hydration 後只保留所需 variant。代價是初始 HTML 較大，避免新依賴、重寫資料路徑與書架閃動。手機排序以 DOM 順序呈現，桌機維持原順序。
2. 手機選書由 BookGrid 統一管理；ImmersiveShelf 在手機轉交同一回呼。MobileReader 使用 showModal 的原生焦點封鎖、dialog 語意及 Esc，body fixed 鎖住 iOS 背景，保留並還原既有 inline styles。
3. 開書直接量測封面或書脊的 DOMRect，來源複本先吻合實際矩形，再擴大成封面並沿左緣打開。與桌機 spine geometry 分離。resize 直接完成當前動畫；減少動態立即完成。關閉重新量測來源；來源消失時安全淡出並聚焦搜尋框。
4. 開書前將 query、category、notesOnly、slug、scrollY 記於來源 history entry，另 push 正式書頁路由。收回只消耗自己建立的 entry；popstate 驅動收書。刷新可直接由 Astro 靜態頁接手。Forward 或 bfcache 若還停在 book entry，reload 該靜態路由，避免留下空的同文件預覽歷史。靜態書頁的手機回到書目在有有效來源 entry 時 back，分享直達時 replace 首頁。
5. 摘要與心得只 fetch 既有同源靜態頁，再解析 section.summary 與 #note.note，不將全文打包到首頁。失敗提供載入正式書頁的連結（reload 目前 book entry，避免額外 history）；兩者皆無則不 fetch。

6. 「手機」是同一個條件：寬度 <640px，或觸控且高度 ≤500px（橫向手機）。定義在 `lib/phone.ts`，CSS 無法 import，故相同條件寫在各樣式。平板與桌機不符合此條件。
7. 內容載入完成後，尾端提供下一本有心得的書，順序沿用目前檢視。前往下一本以 replaceState 取代書籍 entry，一次返回回到書目，焦點與捲動回到最初打開的那本。
8. 來源 entry 的 catalogReturn 只用一次；收書或還原後清除，之後重新整理不會回到舊篩選。

9. 重新整理後，靜態書頁與身後的書目 entry 在 Chromium 仍算同一文件，返回只會改網址、畫面停在書頁（e2e 實測）。靜態頁監聽 popstate，路徑改變就重新載入。

## Validation Limits

已執行 Astro check、covers、Astro build、OpenSpec validate，以及 Chromium 的 bookshelf e2e（31/31，`a7c9777`）。bfcache 只測合成事件；正式站的 301 未涵蓋。動畫連續性、sticky/display:contents、原生 dialog 的 VoiceOver、bfcache 真實事件順序、iOS Safari 的固定 body 與動態工具列，需真實瀏覽器確認。不得將原始碼推論視為瀏覽器通過證據。
