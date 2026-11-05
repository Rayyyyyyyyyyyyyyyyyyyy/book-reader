## MODIFIED Requirements

### Requirement: 保留視覺風格與動畫

系統 SHALL 保留原型的米色襯線視覺風格。在手機以外 SHALL 保留捲動滑入（含 clip-path）動畫與封面視差；手機（寬度 <640px，或觸控且高度 ≤500px，下同）MUST NOT 播放書卡滑入、視差與開書動畫。系統 MUST 移除原型的自訂滑輪平滑捲動劫持，改用瀏覽器原生捲動。動畫 SHALL 在使用者開啟 `prefers-reduced-motion` 時停用。

#### Scenario: 滑入動畫

- **WHEN** 書卡在手機以外的視窗進入畫面
- **THEN** 系統 SHALL 以滑入與 clip-path 揭示動畫呈現該卡

#### Scenario: 原生捲動

- **WHEN** 使用者以滑鼠滾輪或觸控板捲動頁面
- **THEN** 系統 SHALL 使用瀏覽器原生捲動，不攔截滾輪事件

#### Scenario: 尊重減少動態偏好

- **WHEN** 使用者系統開啟「減少動態效果」
- **THEN** 系統 SHALL 停用滑入與視差動畫

#### Scenario: 手機動態集中

- **WHEN** 使用者在手機的首頁捲動
- **THEN** 書卡 SHALL 立即可讀，不使用滑入、clip-path 揭示或封面視差

### Requirement: 翻書閱讀器顯示書本摘要

從書架打開書本時，閱讀器 SHALL 在書名資訊之後、心得之前顯示該書的書本摘要。沒有心得的書 SHALL 顯示摘要後再顯示心得整理中。手機以外保留翻頁；手機從網格或書架進入皆 SHALL 使用同一全文捲動閱讀器。

#### Scenario: 有摘要也有心得

- **WHEN** 使用者打開有摘要與心得的書並往後閱讀
- **THEN** 閱讀器 SHALL 先顯示書本摘要，再顯示心得

#### Scenario: 有摘要沒有心得

- **WHEN** 使用者打開只有摘要的書並讀到最後
- **THEN** 閱讀器 SHALL 顯示書本摘要，末尾 SHALL 顯示心得整理中

#### Scenario: 摘要載入失敗

- **WHEN** 只有摘要的書無法載入摘要
- **THEN** 閱讀器 SHALL 提示載入失敗並引導使用者到書頁閱讀

## ADDED Requirements

### Requirement: 手機首頁與檢視偏好

手機的首頁 SHALL 預設為兩欄封面與書名網格，每分類有心得的書優先，保留書籤等效文字與全書目數量。搜尋 SHALL 固定在唯一一排 sticky 頂列；分類、筆記篩選與檢視切換 SHALL 隨內容捲走，不顯示大段介紹。書架 SHALL 作為可切換的次要檢視。明確的 sessionStorage 選擇 SHALL 優先於裝置預設；SSR 首屏與 hydration SHALL 選擇同一可見檢視，不先閃書架。手機以外 SHALL 保留既有外觀與行為。

#### Scenario: 手機首次開啟

- **WHEN** 未選過檢視的使用者以手機開首頁
- **THEN** 首屏 SHALL 直接可見搜尋與兩欄書籍，SSR 與 hydration 前後皆不先顯示書架

#### Scenario: 記住書架選擇

- **WHEN** 使用者選擇書架再於同一分頁重新整理
- **THEN** 首次繪製及 hydration 後 SHALL 都保留書架

#### Scenario: 篩選與無結果

- **WHEN** 使用者搜尋、選擇分類或只看讀書筆記
- **THEN** 兩種檢視 SHALL 呈現同一組結果，無結果時提供可恢復操作並將焦點留在搜尋框

#### Scenario: 手機捲動首頁

- **WHEN** 使用者往下捲動書目
- **THEN** 搜尋 SHALL 隨時可用，分類與筆記篩選 SHALL 離開畫面
