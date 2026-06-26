# book-content-model Specification

## Purpose

定義「百冊」網站的書籍內容模型:以一書一個 Markdown 檔作為書目與心得的唯一資料來源,規範 frontmatter schema、心得判定與封面對應規則。

## Requirements

### Requirement: 單一來源的書籍內容集合

系統 SHALL 以一本書一個 Markdown 檔的方式,在 Astro content collection 中管理所有書籍,作為書目與心得的唯一資料來源。書名、作者、分類、簡介等後設資料 MUST 存於檔案 frontmatter,讀書心得 MUST 為檔案內文。系統 MUST NOT 另外維護重複的書籍清單(例如寫死在元件中的陣列或獨立的 notes JS 包)。

#### Scenario: 新增一本書

- **WHEN** 維護者在 collection 目錄新增一個含合法 frontmatter 的 Markdown 檔
- **THEN** 該書 SHALL 自動出現在書目中,無需修改任何元件程式碼

#### Scenario: 唯一來源

- **WHEN** 建置網站
- **THEN** 所有書籍後設資料與心得 SHALL 僅來自此 collection,不依賴 `book-notes.js` 或寫死的 `books[]` 陣列

### Requirement: frontmatter Schema 與驗證

每個書籍 Markdown 檔的 frontmatter SHALL 至少包含 `rank`(數字)、`cat`(分類鍵)、`zh`(中文書名,允許空字串)、`en`(英文書名)、`author`、`desc`(簡介),並 MAY 包含 `cover`(封面檔名)。系統 SHALL 在建置時對 frontmatter 進行型別驗證,欄位缺漏或型別錯誤時建置 MUST 失敗並指出問題檔案。

#### Scenario: 合法 frontmatter 通過驗證

- **WHEN** 一個書籍檔的 frontmatter 含全部必填欄位且型別正確
- **THEN** 建置 SHALL 成功並將其納入 collection

#### Scenario: 缺欄位導致建置失敗

- **WHEN** 某書籍檔缺少必填欄位或 `rank` 非數字
- **THEN** 建置 SHALL 失敗並明確指出該檔案與問題欄位

#### Scenario: 未在台灣出版的書

- **WHEN** 某書 `zh` 為空字串
- **THEN** 系統 SHALL 視為合法,並在顯示時以英文書名為主標、副標呈現「台灣尚未出版」

### Requirement: 心得即內文

系統 SHALL 以 Markdown 檔是否有內文(非空 body)判斷一本書「是否有讀書心得」,取代以分類判斷的舊邏輯。

#### Scenario: 有內文視為有心得

- **WHEN** 某書 Markdown 檔含非空內文
- **THEN** 系統 SHALL 標記其為「有讀書心得」,不論其分類為何(包含 finance 的《別把你的錢留到死》與 growth 的《納瓦爾寶典》)

#### Scenario: 空內文視為整理中

- **WHEN** 某書 Markdown 檔內文為空
- **THEN** 系統 SHALL 標記其為「讀書心得整理中」並停用心得連結

### Requirement: 封面對應

系統 SHALL 依書籍 `rank`(或 frontmatter 的 `cover` 欄位)對應到 `public/covers/` 下的封面圖檔;當對應封面不存在時 MUST 退回原型的版式佔位封面。

#### Scenario: 有封面

- **WHEN** 某書對應的封面圖檔存在
- **THEN** 系統 SHALL 顯示該封面圖

#### Scenario: 缺封面退回佔位

- **WHEN** 某書對應的封面圖檔不存在
- **THEN** 系統 SHALL 顯示版式佔位封面(分類底色 + 書名),不得出現破圖
