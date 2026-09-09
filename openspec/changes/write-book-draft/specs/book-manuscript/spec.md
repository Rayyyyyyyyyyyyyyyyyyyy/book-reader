# book-manuscript

> 本 spec 刻意薄：內容標準的單一事實來源是 `docs/chapter.md`，此處只定義驗收行為，不複製架構細節。

## ADDED Requirements

### Requirement: 每章符合寫書依據
每章初稿 MUST 對照 `docs/chapter.md` 該章的規格完成：核心句到位、五件事 checklist（真實場景、常見誤解、判斷界線、反例、行動問題）全數回答、字數落在配額附近（正文章節約 8,500 字，序章 5,000、結語 4,000）。

#### Scenario: 一章初稿完成時的驗收
- **WHEN** 任一章初稿寫完
- **THEN** 逐項核對 `docs/chapter.md` 該章的核心句、五件事與字數配額，缺項需補齊或在 tasks 註記偏離原因

### Requirement: 聲音與引用策略一致
全書 MUST 以 `/rui-xuan-book` skill 的正式寫作聲音書寫，並遵守「默默吸收」引用策略：不明引作者與書名、不搬原句與實驗數據當背書，機制用自己的場景與比喻扛。

#### Scenario: 章節中出現吸收來源的觀念
- **WHEN** 章節內容用到讀過的書的觀念（如課題分離、系統一）
- **THEN** 以日常語彙或自己的話重講，不出現「某某作者說」「某書指出」式的明引

### Requirement: 修訂流程包含 humanizer
後續新寫或重寫的稿件 MUST 依 `design.md` 執行初稿、乾淨讀者、獨立編輯、humanizer 潤飾及主 session 驗收，適用於章節、序章、結語及各部引言／練習／小結。humanizer MUST 保留事實、核心句、必要限制、章節功能、Rui 聲音與現場檔刻意保留的節奏。

#### Scenario: 編輯修訂完成後
- **WHEN** 獨立編輯完成修稿
- **THEN** 主 session 使用 humanizer 完整回看稿件並潤飾，再驗收內容、聲音、字數、格式與跨章銜接；通過後才勾選任務，記錄各階段字數並同步最新盤點

### Requirement: 現場檔限額
現場檔片段 MUST 只出現在「讀者需要先看到現場，才會相信後面分析」的章，全書至多 3 處；目前已指定第一章與第十二章，第三個名額未定。

#### Scenario: 某章想嵌入現場檔
- **WHEN** 撰寫時想在已指定之外的章嵌入現場檔
- **THEN** 先確認全書總數未超過 3 處，並回 `docs/chapter.md` 更新「現場檔使用判準」的指定清單

### Requirement: 初稿檔案結構
初稿 MUST 落在 `book-reader/book/` 目錄，一章一檔，檔名含章序與章名（如 `07-知道卻不改，也是他的選擇.md`），與最上層的讀書心得 `.md` 分開。

#### Scenario: 新章初稿建檔
- **WHEN** 開始寫某一章
- **THEN** 在 `book-reader/book/` 建立對應章序與章名的 `.md`，不放進讀書心得所在的最上層目錄
