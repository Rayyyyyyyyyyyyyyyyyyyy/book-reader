# manuscript-reader Specification

## ADDED Requirements

### Requirement: 單一來源與閱讀順序

系統 SHALL 在正式建置時直接讀取 `book-reader/book/` 的 18 份 Markdown，並將部引言置於各部章節之前、練習與小結置於各部章節之後，不維護書稿副本。GitHub Pages SHALL 提供 `/manuscript/` 閱讀頁，首次成功載入後 SHALL 可由快取離線開啟。

#### Scenario: 建置閱讀頁

- **WHEN** 執行正式網站建置或本機閱讀器產生指令
- **THEN** 閱讀頁 SHALL 包含序章、四部內容、十二章與結語，且來源為目前工作區稿件

### Requirement: 本機註解

讀者 SHALL 能對選取文字或段落建立、編輯及刪除註解。系統 SHALL 在同一瀏覽器保存註解，重新載入後仍可讀取。

#### Scenario: 新增註解

- **WHEN** 讀者選取原文或按下段落註解按鈕並儲存建議
- **THEN** 系統 SHALL 顯示該註解、標記來源段落並寫入本機儲存

### Requirement: 註解交換

系統 SHALL 提供 Markdown 與 JSON 匯出，並提供可直接貼入網頁版 ChatGPT 的交接稿。輸出 SHALL 保留章節、來源檔、原稿行號、定位 id、引用與時間資訊。系統 SHALL 能匯入同格式 JSON，格式錯誤時不得覆寫既有註解。

#### Scenario: 匯出修改建議

- **WHEN** 讀者按下 Markdown 或 JSON 匯出
- **THEN** 系統 SHALL 下載一份可交回進行後續優化的檔案

#### Scenario: 匯入失敗

- **WHEN** 讀者選擇無效或不相容的 JSON
- **THEN** 系統 SHALL 保留現有註解並顯示錯誤與重試方式

### Requirement: 可用的長文閱讀介面

閱讀頁 SHALL 提供章節導覽、閱讀進度與字級控制，並在桌面與窄螢幕維持主要閱讀及註解操作可用。互動控制 SHALL 有可辨識名稱、可見焦點與狀態訊息。

#### Scenario: 手機註解

- **WHEN** 讀者在窄螢幕選取文字或按下段落註解按鈕
- **THEN** 系統 SHALL 開啟可關閉的註解面板，保留引用與尚未儲存的輸入
