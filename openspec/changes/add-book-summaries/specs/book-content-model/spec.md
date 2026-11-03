## MODIFIED Requirements

### Requirement: frontmatter Schema 與驗證

每個書籍 Markdown 檔的 frontmatter SHALL 至少包含 `rank`(數字)、`cat`(分類鍵)、`zh`(中文書名,允許空字串)、`en`(英文書名)、`author`、`desc`(簡介),並 MAY 包含 `cover`(封面檔名)與 `summary`(書本摘要,200–300 字,不計標點與空白,連續英文或數字算 1 字)。系統 SHALL 在建置時對 frontmatter 進行型別驗證,欄位缺漏、型別錯誤或 `summary` 長度不符時建置 MUST 失敗並指出問題檔案。`summary` MUST NOT 影響該書是否有心得的判斷。

#### Scenario: 摘要長度不符

- **WHEN** 某書的 `summary` 少於 200 字或超過 300 字
- **THEN** 建置 MUST 失敗並指出問題檔案

#### Scenario: 只有摘要的書

- **WHEN** 某書有 `summary` 但正文為空
- **THEN** 系統 SHALL 視該書為沒有心得
