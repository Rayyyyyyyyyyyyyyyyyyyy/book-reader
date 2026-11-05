## ADDED Requirements

### Requirement: 手機共用開書與全文閱讀

寬度 <640px 的網格封面與書架書脊 SHALL 進入同一閱讀器。開書 SHALL 從被點元素的實際位置與尺寸放大並打開，網格初始 pose MUST NOT 依賴書脊尺寸。之後 SHALL 顯示全螢幕原生捲動內容，順序為書籍資訊、摘要、心得；無摘要不留空段，無心得顯示整理中。正文 SHALL 約 17px 且至少 16px，不隨書本動畫幾何縮小，手機 MUST NOT 分頁翻書。載入中 SHALL 可辨識，失敗 SHALL 引導至正式書頁。桌機 3D 翻頁與 reader-back 修正 SHALL 保持原狀。

#### Scenario: 兩種開書來源

- **WHEN** 使用者點手機網格封面或書架書脊
- **THEN** 同一套動畫 SHALL 由該來源矩形開始，只有一本書開啟，完成後可捲動閱讀全文

#### Scenario: 開書期間操作

- **WHEN** 開書動畫中使用者重複啟動、返回或改變視窗
- **THEN** 系統 SHALL 忽略重複啟動，安全收回或完成當前動畫，不留下預覽、鎖定或無法操作的畫面

#### Scenario: 內容組合與失敗

- **WHEN** 書只有摘要、只有心得、兩者皆有、兩者皆無，或 fetch 失敗
- **THEN** 系統 SHALL 只顯示實際內容及對應狀態；兩者皆無不 fetch，失敗時提供到書頁閱讀的連結

### Requirement: 手機網址與返回恢復

手機開書 SHALL 以 pushState 將網址設為 `/book/<slug>`（含部署 base）。返回或回到書目 SHALL 消耗開書 entry，恢復來源捲動位置與焦點，MUST NOT 留下無效返回。若來源元素消失 SHALL 安全收回並聚焦搜尋框。重新整理 SHALL 留在該書靜態頁；Forward 與 pageshow 的 bfcache 還原 MUST NOT 留下已開啟的預覽。靜態書頁頂部回到書目 SHALL 在有開書來源時返回來源，直接分享進入則取代目前 entry 回書目，避免返回迴圈。

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

手機閱讀器 SHALL 使用模態 dialog 語意、將焦點移入並限制於閱讀器、提供文字收回控制與 Esc。互動目標 SHALL 至少 44×44px；頁面 SHALL 使用 viewport-fit=cover、safe area 與 dvh，直橫向皆可閱讀。減少動態時開書與收書 SHALL 立即完成。

#### Scenario: 鍵盤與螢幕閱讀器

- **WHEN** 使用者開書並以 Tab、Shift+Tab 或 Esc 操作
- **THEN** 焦點 SHALL 留在 dialog，全文以單份可讀語意呈現，Esc 收書後焦點回到來源

#### Scenario: 視窗與動態偏好

- **WHEN** 手機旋轉、動態網址列改變可視高度，或啟用減少動態
- **THEN** 控制與正文 SHALL 保持可用並避開 safe area；減少動態 SHALL 略過過場動畫
