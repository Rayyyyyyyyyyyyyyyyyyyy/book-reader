# 新增離線手稿閱讀與註解頁

## Why

全書稿件已完成一輪 V2 修訂，需要一個不依賴網路、可以連續閱讀並留下修改建議的介面。註解還要能帶回工作區，讓後續優化可定位到章節與原文。

## What Changes

- 新增 GitHub Pages 手稿閱讀器產生器，建置時直接讀取 `book-reader/book/` 的 18 份 Markdown
- 依實際閱讀順序，把每部的引言放在章前、練習與小結放在章後
- 支援選取原文或以段落為單位新增、編輯及刪除註解
- 註解與閱讀位置儲存在瀏覽器本機，提供 Markdown 與 JSON 匯出，以及 JSON 匯入
- 保留現有「百冊」書目與內容模型，不把全書稿件複製進書目 collection

## Impact

- 新增 `site/scripts/manuscript-reader.mjs` 與獨立頁面模板
- 正式建置時產生 `/manuscript/`，並以 service worker 保存可離線使用的單頁內容
- 本機預覽產物仍寫入被 Git 忽略的 `site/.offline-reader/`
- 新增本地註解資料格式與閱讀頁樣式／互動
- 不新增後端、帳號、雲端同步或第三方服務
