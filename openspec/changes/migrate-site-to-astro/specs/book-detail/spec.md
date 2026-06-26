## ADDED Requirements

### Requirement: 點卡片開啟快速預覽彈窗

系統 SHALL 在使用者點選書卡時開啟快速預覽彈窗,顯示封面、分類、編號、書名、作者、簡介,以及前往完整書頁/心得的入口。彈窗 SHALL 可由關閉鈕、點背景遮罩、按 Escape 關閉。

#### Scenario: 開啟彈窗

- **WHEN** 使用者點選一張書卡
- **THEN** 系統 SHALL 開啟該書的快速預覽彈窗

#### Scenario: 關閉彈窗

- **WHEN** 使用者按 Escape、點關閉鈕或點背景遮罩
- **THEN** 系統 SHALL 關閉彈窗並回到書目

### Requirement: 彈窗同步 URL 且可分享

開啟彈窗時系統 SHALL 同步更新瀏覽器網址為該書的可分享連結;關閉時 SHALL 還原網址。使用者按瀏覽器「上一頁」SHALL 關閉彈窗。直接以該連結開啟頁面時,系統 SHALL 呈現對應書籍的內容。

#### Scenario: 開啟同步網址

- **WHEN** 使用者開啟某書彈窗
- **THEN** 瀏覽器網址 SHALL 更新為該書的可分享連結

#### Scenario: 上一頁關閉彈窗

- **WHEN** 彈窗開啟中,使用者按瀏覽器上一頁
- **THEN** 系統 SHALL 關閉彈窗並還原先前網址

#### Scenario: 直接開啟分享連結

- **WHEN** 使用者直接造訪某書的分享連結
- **THEN** 系統 SHALL 顯示該書內容(完整頁或聚焦該書的書目)

### Requirement: 合併的書籍/心得頁

系統 SHALL 為每本書提供一個靜態頁面作為其完整頁,並將讀書心得直接渲染於同一頁,取消原型「彈窗 → 再點閱讀心得 → 全螢幕」的兩段式流程。心得內文 SHALL 由 Markdown 原生渲染,MUST NOT 使用原型的自訂 `parseNote` 解析。

#### Scenario: 有心得的書頁

- **WHEN** 使用者進入一本有心得的書頁
- **THEN** 系統 SHALL 在同一頁顯示書籍資訊與完整心得(由 Markdown 渲染)

#### Scenario: 無心得的書頁

- **WHEN** 使用者進入一本無心得的書頁
- **THEN** 系統 SHALL 顯示書籍資訊與「讀書心得整理中」狀態,不顯示空白心得區

#### Scenario: 每本書皆有靜態頁

- **WHEN** 建置網站
- **THEN** 系統 SHALL 為 collection 中每本書產生一個可直接造訪的靜態頁
