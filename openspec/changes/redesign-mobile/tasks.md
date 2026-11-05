## 1. 首頁與檢視

- [x] 手機首屏、單排 sticky 搜尋、可捲走篩選與兩欄封面書名
- [x] SSR 與 hydration 初值一致，明確 sessionStorage 選擇優先
- [x] 手機每分類有心得者優先、書籤、111 本與空結果恢復

## 2. 閱讀與返回

- [x] 網格與書脊共用來源矩形開書動畫與全文捲動 dialog
- [x] 17px 正文、safe area、dvh、44px 目標、焦點與 Esc
- [x] pushState 正式書頁、返回與捲動焦點恢復、刷新與分享靜態書頁
- [x] 載入與失敗恢復、無內容狀態、resize、減少動態、pageshow 清理
- [x] 移除 BookStage 手機單頁翻頁死碼，保留桌機流程
- [x] 橫向手機沿用手機版面與閱讀器（`lib/phone.ts`）
- [x] 閱讀尾端前往下一本有心得的書
- [x] catalogReturn 只還原一次

## 3. 規格與驗證

- [x] 更新手機 e2e 原始碼，保留桌機測試
- [x] Astro check：0 errors / 0 warnings
- [x] 產生封面與 Astro build
- [x] openspec validate redesign-mobile
- [ ] 瀏覽器驗收：首頁首次繪製、動畫、返回、刷新、Forward、bfcache、焦點、字級與觸控目標
- [ ] iOS Safari 真機：直橫向、safe area、動態網址列、dialog / VoiceOver 與背景鎖定
