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

### Requirement: 書架檢視

手機以外（手機見 `redesign-mobile`），系統 SHALL 在首頁預設以書架檢視呈現書目：每個分類一座書架，每本書以可聚焦的書脊按鈕呈現。系統 SHALL 提供「書架／列表」切換，列表檢視沿用原有網格，卡片直接連到 `/book/<slug>`；兩種檢視 SHALL 使用同一組搜尋、分類與只看有心得的篩選結果。

#### Scenario: 預設書架

- **WHEN** 使用者開啟首頁
- **THEN** 系統 SHALL 以書架呈現所有分類的書脊

#### Scenario: 篩選作用於書架

- **WHEN** 使用者在書架檢視中搜尋、選擇分類或切換只看有心得
- **THEN** 書架 SHALL 只顯示符合條件的書脊，結果與列表檢視一致

#### Scenario: 切換回列表

- **WHEN** 使用者點選「列表」
- **THEN** 系統 SHALL 以原網格呈現同一組結果

### Requirement: 書脊外觀

每根書脊的高度與厚度 SHALL 由書籍編號決定，跨建置與篩選保持不變；同一座書架 SHALL 將有心得的書排在前面，兩組各自由高到矮排列。書脊與 3D 封面的底色 SHALL 取自該書封面的主色，缺封面時使用分類色。書脊 SHALL 完整顯示書名：依書脊大小調整字級，必要時依封面上的斷句分為多欄；中文直書的半形標點 SHALL 以全形呈現。

#### Scenario: 長書名

- **WHEN** 書名在單欄放不下
- **THEN** 系統 SHALL 縮小字級或依封面斷句分欄，書名 MUST NOT 被截斷

#### Scenario: 封面主色

- **WHEN** 書籍有封面
- **THEN** 書脊底色 SHALL 為封面中央區域的主色，文字依明暗選用深色或淺色

### Requirement: 手機書架

在手機的書架檢視中，每座書架 SHALL 為單排、可左右滑動的原生捲動區，末端以漸隱提示還有更多書，頁面本身 MUST NOT 出現橫向捲動。

#### Scenario: 手機瀏覽

- **WHEN** 使用者在手機上瀏覽書架
- **THEN** 每座書架 SHALL 可橫向滑動，且不劫持滾輪或整頁捲動

### Requirement: 心得標示

有心得的書 SHALL 在書脊與列表卡片顯示書籤記號；「讀書筆記」篩選 SHALL 顯示同一記號作為圖例。記號 SHALL 提供輔助技術可讀的等效資訊，且 SHALL 只由該書是否有心得決定。

#### Scenario: 辨識有心得的書

- **WHEN** 使用者瀏覽書架或列表
- **THEN** 有心得的書 SHALL 帶書籤記號，沒有心得的書 MUST NOT 帶記號

### Requirement: 首屏與篩選集中

桌機 1280×860 的首屏 SHALL 可見第一層書架的書脊；「讀書筆記」篩選、書架／列表切換與分類 SHALL 集中在篩選區。只看有心得時，書架 MUST NOT 留下大片空木格。

#### Scenario: 開啟首頁

- **WHEN** 使用者以上述尺寸開啟首頁
- **THEN** 不捲動即可看到第一層書架的書脊

### Requirement: 空結果可復原

篩選沒有結果時，系統 SHALL 以中文說明原因，並依造成原因提供清除搜尋、看全部分類或顯示沒有心得的書等操作；操作後焦點 SHALL 留在搜尋框。

#### Scenario: 搜尋無結果

- **WHEN** 使用者的搜尋沒有符合的書
- **THEN** 系統 SHALL 顯示找不到該關鍵字的說明與「清除搜尋」

### Requirement: 文字對比

首頁、書架、預覽與書頁的內容文字 SHALL 達 WCAG AA（一般文字 4.5:1，大字 3:1）；書脊 3D 面與紙紋等裝飾不在此限。

#### Scenario: 小字對比

- **WHEN** 檢查書架數量、作者、頁碼等小字
- **THEN** 其與背景的對比 SHALL 不低於 4.5:1

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

