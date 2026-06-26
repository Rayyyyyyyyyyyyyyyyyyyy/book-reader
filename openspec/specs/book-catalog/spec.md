# book-catalog Specification

## Purpose

定義「百冊」書目首頁的瀏覽體驗:分類分區、分類篩選、即時搜尋,以及保留的視覺風格與動畫。

## Requirements

### Requirement: 書目首頁與分類分區

系統 SHALL 在首頁以分類分區呈現全部書籍,每區顯示分類中文名、英文名與本區數量。分類順序與鍵值 SHALL 沿用原型的七大分類(psych、biz、finance、growth、neuro、influence、soul)。

#### Scenario: 預設瀏覽

- **WHEN** 使用者開啟首頁且未篩選或搜尋
- **THEN** 系統 SHALL 依分類順序顯示所有分區與其書卡

#### Scenario: 統計數字

- **WHEN** 顯示首頁 hero 區
- **THEN** 系統 SHALL 顯示一般選書本數(非 soul,共 100)與讀書心得篇數(以有內文者計)

### Requirement: 分類篩選

系統 SHALL 提供分類 chips(含「全部」),使用者點選後 SHALL 只顯示該分類的書籍,並標示目前選取的分類。

#### Scenario: 篩選單一分類

- **WHEN** 使用者點選某分類 chip
- **THEN** 系統 SHALL 只顯示該分類書籍,其餘分區隱藏,該 chip 標示為選取狀態

#### Scenario: 回到全部

- **WHEN** 使用者點選「全部」chip
- **THEN** 系統 SHALL 顯示所有分類書籍

### Requirement: 搜尋

系統 SHALL 提供即時搜尋,依中文書名、英文書名與作者比對。搜尋資料來源 SHALL 僅為書籍後設資料,MUST NOT 將全部心得內文打包進前端 island。

#### Scenario: 命中

- **WHEN** 使用者輸入關鍵字且有符合的書
- **THEN** 系統 SHALL 即時顯示符合的書,並顯示命中數量與「清除搜尋」

#### Scenario: 無結果

- **WHEN** 使用者輸入關鍵字但無符合的書
- **THEN** 系統 SHALL 顯示無結果提示與所輸入的關鍵字

#### Scenario: 不打包心得內文

- **WHEN** 建置首頁 island
- **THEN** 傳入 island 的資料 SHALL 僅含後設資料(書名、作者、分類、簡介、封面、是否有心得、slug),不含心得全文

### Requirement: 保留視覺風格與動畫

系統 SHALL 保留原型的米色襯線視覺風格、捲動滑入(含 clip-path)動畫與封面視差。系統 MUST 移除原型的自訂滑輪平滑捲動劫持,改用瀏覽器原生捲動。動畫 SHALL 在使用者開啟 `prefers-reduced-motion` 時停用。

#### Scenario: 滑入動畫

- **WHEN** 書卡進入視窗
- **THEN** 系統 SHALL 以滑入與 clip-path 揭示動畫呈現該卡

#### Scenario: 原生捲動

- **WHEN** 使用者以滑鼠滾輪或觸控板捲動頁面
- **THEN** 系統 SHALL 使用瀏覽器原生捲動,不攔截滾輪事件

#### Scenario: 尊重減少動態偏好

- **WHEN** 使用者系統開啟「減少動態效果」
- **THEN** 系統 SHALL 停用滑入與視差動畫
