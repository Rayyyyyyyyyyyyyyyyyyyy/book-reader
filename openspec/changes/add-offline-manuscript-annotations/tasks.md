# Tasks

- [x] 1. 建立依正確章序渲染 18 份來源稿件的靜態閱讀頁
- [x] 2. 完成本機註解的新增、編輯、刪除與定位
- [x] 3. 完成 JSON／Markdown 匯出、ChatGPT 交接稿與 JSON 匯入／錯誤復原
- [x] 4. 完成章節導覽、閱讀進度、離線快取及桌面／手機版互動
- [x] 5. 完成靜態建置與 390 × 844 手機瀏覽器驗證，準備 GitHub Pages 部署

驗證紀錄（2026-09-09）：正式 `npm run build` 通過，產出 `/manuscript/index.html` 與 `sw.js`；22 個閱讀區段、4,520 個可註解區塊均有來源行號。手機寬度實測註解新增、儲存、重新載入保留及 ChatGPT 交接稿，交接稿包含來源檔、行號、定位 id 與引用原文。service worker 顯示已可離線閱讀，瀏覽器無 error／warning。OpenSpec strict validation 通過。
