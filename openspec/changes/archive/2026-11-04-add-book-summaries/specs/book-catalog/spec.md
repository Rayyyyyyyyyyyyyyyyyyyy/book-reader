## ADDED Requirements

### Requirement: 翻書閱讀器顯示書本摘要

從書架打開書本時,閱讀器 SHALL 在書名頁之後、心得之前顯示該書的書本摘要。沒有心得的書 SHALL 顯示摘要後再顯示心得整理中。

#### Scenario: 有摘要也有心得

- **WHEN** 使用者打開有摘要與心得的書並翻頁
- **THEN** 閱讀器 SHALL 先顯示書本摘要,再顯示心得

#### Scenario: 有摘要沒有心得

- **WHEN** 使用者打開只有摘要的書並翻到最後
- **THEN** 閱讀器 SHALL 顯示書本摘要,最後一頁 SHALL 顯示心得整理中

#### Scenario: 摘要載入失敗

- **WHEN** 只有摘要的書無法載入摘要
- **THEN** 閱讀器 SHALL 提示載入失敗並引導使用者到書頁閱讀
