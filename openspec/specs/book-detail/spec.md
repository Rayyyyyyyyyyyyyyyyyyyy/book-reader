# book-detail Specification

## Purpose

定義單本書的開啟體驗:點卡片開快速預覽彈窗(純預覽、不改網址),以及合併書籍資訊與心得的可分享靜態書頁。
## Requirements
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

### Requirement: 書本摘要

書籍有 `summary` 時，書頁 SHALL 在書籍資訊與讀書心得之間顯示標示為「書本摘要」的區塊；沒有 `summary` 時 MUST NOT 顯示空區塊。摘要 SHALL 與作者的讀書心得明確分開。

#### Scenario: 有摘要的書頁

- **WHEN** 使用者開啟有 `summary` 的書頁
- **THEN** 系統 SHALL 顯示「書本摘要」與摘要內容

### Requirement: 從書架抽書預覽

手機以外（手機見 `redesign-mobile`），在書架檢視中選擇書脊（點擊、觸控或 Enter／Space）時，系統 SHALL 顯示同一本書從該書脊的實際位置連續抽出、轉為正面、沿書脊打開封面的動畫，MUST NOT 以淡入另一個彈窗代替。預覽 SHALL 為 `role="dialog"` 的模態層：開啟期間頁面其餘部分不可操作，鍵盤焦點 SHALL 留在預覽內。開書 SHALL 新增一筆歷史紀錄且 MUST NOT 變更網址；直接前往下一本時 SHALL 重用該筆紀錄，讓一次瀏覽器返回即回到書架。預覽 SHALL 提供前往 `/book/<slug>` 的入口：有心得時為「閱讀我的讀書心得」，否則為「查看書頁 · 整理中」。

#### Scenario: 抽書

- **WHEN** 使用者選擇一根書脊
- **THEN** 3D 書 SHALL 自該書脊的位置與尺寸開始移動，書架上的原位保留空位而不重新排版

#### Scenario: 一次一本

- **WHEN** 預覽開啟或動畫進行中，使用者再次操作書架或篩選
- **THEN** 系統 SHALL 忽略該操作，畫面上只會有一本書

### Requirement: 翻頁

手機以外（手機見 `redesign-mobile`），開啟的書第一頁 SHALL 是書名頁（書名、原文書名、作者、一句話簡介），之後是心得頁；書頁以書脊為轉軸逐張翻動。使用者 SHALL 可用按鈕、左右方向鍵、滑動，或點右頁（下一頁）／左頁（上一頁）翻頁。點書頁 MUST NOT 關閉書本；翻頁進行中的新指令 SHALL 被忽略。底部計數器 SHALL 以頁表示（書名頁、頁碼範圍、完），並讓輔助技術唸出「頁」。書頁內容 SHALL 來自書籍後設資料與作者的讀書心得，MUST NOT 呈現原書內文。

#### Scenario: 翻到下一頁

- **WHEN** 使用者按下一頁或方向鍵右
- **THEN** 最上層未翻的書頁 SHALL 翻到左側，頁碼完成後才更新

### Requirement: 在書中閱讀心得

手機以外（手機見 `redesign-mobile`），有讀書心得的書打開後，系統 SHALL 從該書的 `/book/<slug>` 頁取得心得全文，依書頁大小分頁接在書目頁之後：以左右對頁閱讀。最後一頁 SHALL 標示結尾，並提供依書架順序的下一本有心得的書，選擇後直接開啟該書。心得載入中或載入失敗時，最後一頁 SHALL 說明狀態並保留前往書頁的連結；輔助技術 SHALL 能讀到一份完整、不重複的心得全文。

#### Scenario: 翻完一篇心得

- **WHEN** 使用者在有心得的書中一路翻頁
- **THEN** 心得 SHALL 依序逐頁出現，不漏字、不重複，最後一頁顯示「完」

#### Scenario: 心得載入失敗

- **WHEN** 心得頁無法取得
- **THEN** 書本 SHALL 仍可開啟與翻頁，最後一頁 SHALL 提示到書頁閱讀全文

### Requirement: 收書

手機以外（手機見 `redesign-mobile`），使用者按 Escape、瀏覽器返回、「收回書架」或點書本以外的背景時，系統 SHALL 先翻回已翻的書頁、合上封面，再讓書回到重新量測的原書脊位置；完成後 SHALL 移除預覽層、解除捲動鎖定與背景的不可操作狀態，並將焦點還給原書脊。動畫進行中關閉 SHALL 從目前狀態安全收回。

#### Scenario: 中途關閉

- **WHEN** 使用者在抽書動畫進行中按 Escape
- **THEN** 書 SHALL 從當下位置收回書架，且不殘留任何覆蓋層

#### Scenario: 瀏覽器返回

- **WHEN** 書開啟時使用者按瀏覽器返回
- **THEN** 系統 SHALL 收書並留在首頁，MUST NOT 離開網站

### Requirement: 減少動態

使用者開啟「減少動態效果」時，開書、翻頁與收書 SHALL 立即完成，所有操作仍可使用。

#### Scenario: 減少動態

- **WHEN** 使用者系統開啟「減少動態效果」並選擇一本書
- **THEN** 書 SHALL 直接呈現打開狀態，關閉時直接回到書架

### Requirement: 書頁為正式可分享網址

每本書的完整頁 `/book/<slug>` SHALL 作為其正式、可分享的網址，書架預覽與列表卡片 SHALL 都能前往該頁。從完整頁按瀏覽器返回 SHALL 回到來源頁，MUST NOT 殘留已開啟的預覽。

#### Scenario: 從列表進入後返回

- **WHEN** 使用者自列表卡片進入某書完整頁後按瀏覽器返回
- **THEN** 系統 SHALL 回到首頁且維持列表檢視

### Requirement: 手機共用開書與全文閱讀

手機（寬度 <640px，或觸控且高度 ≤500px）的網格封面與書架書脊 SHALL 進入同一閱讀器。點選後 SHALL 立即顯示全螢幕原生捲動內容，MUST NOT 播放開書或收書動畫，順序為書籍資訊、摘要、心得；無摘要不留空段，無心得顯示整理中。正文 SHALL 約 17px 且至少 16px，手機 MUST NOT 分頁翻書。載入中 SHALL 可辨識，失敗 SHALL 引導至正式書頁。桌機 3D 翻頁與 reader-back 修正 SHALL 保持原狀。

#### Scenario: 兩種開書來源

- **WHEN** 使用者點手機網格封面或書架書脊
- **THEN** 系統 SHALL 立即進入同一閱讀器，只有一本書開啟，可捲動閱讀全文

#### Scenario: 開書期間操作

- **WHEN** 使用者連續點選、開書後立刻返回或改變視窗
- **THEN** 系統 SHALL 忽略重複啟動，不留下鎖定或無法操作的畫面

#### Scenario: 內容組合與失敗

- **WHEN** 書只有摘要、只有心得、兩者皆有、兩者皆無，或 fetch 失敗
- **THEN** 系統 SHALL 只顯示實際內容及對應狀態；兩者皆無不 fetch，失敗時提供到書頁閱讀的連結

#### Scenario: 前往下一本

- **WHEN** 使用者讀到書本尾端，且還有其他有心得的書
- **THEN** 系統 SHALL 提供前往下一本的按鈕；前往後從該書開頭閱讀，一次返回 SHALL 回到書目與最初打開的那本

### Requirement: 手機網址與返回恢復

手機開書 SHALL 以 pushState 將網址設為 `/book/<slug>/`（含部署 base，結尾斜線避開 GitHub Pages 的 301）。返回或回到書目 SHALL 消耗開書 entry，恢復來源捲動位置與焦點，MUST NOT 留下無效返回。若來源元素消失 SHALL 安全收回並聚焦搜尋框。重新整理 SHALL 留在該書靜態頁；Forward 與 pageshow 的 bfcache 還原 MUST NOT 留下已開啟的預覽。靜態書頁頂部回到書目 SHALL 在有開書來源時返回來源，直接分享進入則取代目前 entry 回書目，避免返回迴圈。

#### Scenario: 收書恢復

- **WHEN** 使用者以瀏覽器返回、Esc 或回到書目收書
- **THEN** 系統 SHALL 回到原書目與捲動位置，焦點回到原封面或書脊，下一次返回不會遇到相同書目的無效 entry

#### Scenario: 刷新後返回

- **WHEN** 使用者開書後重新整理再回到書目
- **THEN** 系統 SHALL 顯示該書靜態頁後返回原搜尋與篩選結果，不殘留預覽

#### Scenario: 分享直達

- **WHEN** 使用者直接開啟分享書頁再點回到書目
- **THEN** 系統 SHALL 顯示手機靜態閱讀版式，回書目後不新增來回書頁的循環

#### Scenario: bfcache 與 Forward

- **WHEN** 使用者透過 pageshow 還原或 Forward 回到書籍 entry
- **THEN** 系統 SHALL 載入實際靜態書頁；若還原書目 entry SHALL 清除預覽、捲動鎖定並恢復來源

### Requirement: 手機閱讀基本可用性

手機閱讀器 SHALL 使用模態 dialog 語意、將焦點移入閱讀器且不進入背景頁面、提供文字收回控制與 Esc。互動目標 SHALL 至少 44×44px；頁面 SHALL 使用 viewport-fit=cover、safe area 與 dvh，直橫向皆可閱讀。開書與收書 SHALL 立即完成。

#### Scenario: 鍵盤與螢幕閱讀器

- **WHEN** 使用者開書並以 Tab、Shift+Tab 或 Esc 操作
- **THEN** 焦點 MUST NOT 進入背景頁面，全文以單份可讀語意呈現，Esc 收書後焦點回到來源

#### Scenario: 視窗與動態偏好

- **WHEN** 手機旋轉或動態網址列改變可視高度
- **THEN** 控制與正文 SHALL 保持可用並避開 safe area

