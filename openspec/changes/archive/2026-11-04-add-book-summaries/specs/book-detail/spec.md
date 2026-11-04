## ADDED Requirements

### Requirement: 書本摘要

書籍有 `summary` 時，書頁 SHALL 在書籍資訊與讀書心得之間顯示標示為「書本摘要」的區塊；沒有 `summary` 時 MUST NOT 顯示空區塊。摘要 SHALL 與作者的讀書心得明確分開。

#### Scenario: 有摘要的書頁

- **WHEN** 使用者開啟有 `summary` 的書頁
- **THEN** 系統 SHALL 顯示「書本摘要」與摘要內容
