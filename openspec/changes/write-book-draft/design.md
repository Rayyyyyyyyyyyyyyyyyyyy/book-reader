# Design

## Context

書的規格（`docs/chapter.md`）與寫作聲音（`/rui-xuan-book` skill）皆已定案，本 change 只負責「按規格把書寫出來」的執行與追蹤。相關決策已在 explore 階段討論完畢，此處記錄結論。

## Goals / Non-Goals

**Goals:**
- 按章節順序產出全書初稿，每個 session 可用 `/opsx:apply` 接續
- 進度可見：哪些章完成、哪些未動

**Non-Goals:**
- 不在本 change 內調整書的架構（改架構 → 改 `docs/chapter.md`）
- 不動 `/rui-xuan-book` skill、不動讀書心得、不動網站
- 不含出版、排版、投稿等後續流程

## Decisions

- **單一事實來源**：`docs/chapter.md` 管「寫什麼」，skill 管「怎麼說」，本 change 的 artifacts 不複製兩者內容。避免改一處要同步三處
- **寫作順序照章節排**：序章起、結語收。曾考慮從素材最熟的第八章起筆建立手感，使用者拍板照章節順序（寫的時候仍可跳）
- **一章一檔，落在 `book-reader/book/`**：與讀書心得的最上層 `.md` 隔開，避免網站的 book-catalog 把書稿當成心得收錄
- **各部引言／練習／小結最後寫**：部引言需要回收被砍章節的素材（見 `docs/chapter.md` 不陪葬清單），等該部三章成形後寫最省力
- **固定流程：初稿 → 乾淨讀者 → 獨立編輯 → humanizer → 主 session 驗收**：適用於後續新寫或重寫的章節、序章、結語及各部引言／練習／小結，執行細節如下。讀者回饋是訊號不是命令，內容取捨由編輯判斷，最終由主 session 驗收

### 每份稿件的修訂流程

1. **初稿與自查**：主 session 完整寫稿，檢查章卡功能、相鄰章節內容邊界，記錄初稿非空白字數
2. **乾淨讀者**：以 `fork_turns:none` 開讀者子代理，只讀 `docs/ai-reader.md` 與該份稿件全文，不讀書規格、skill 或寫作過程，也不改稿
3. **獨立編輯**：另以 `fork_turns:none` 開編輯子代理，讀 `docs/ai-editor.md`、Rui 風格規範、該份稿件全文與讀者回饋摘要；逐條評斷必須處理／建議處理／暫時觀察／不建議修改，再直接修稿，不修改 `tasks.md`。主 session 記錄編輯後字數
4. **humanizer 潤飾**：主 session 使用 `humanizer` skill（目前路徑 `/Users/ray.shao/.codex/skills/humanizer/SKILL.md`），完整讀取編輯後稿件，再處理重複論證、制式轉折、過度整齊的句式、抽象空話與過度肯定的措辭。保留事實、核心句、概念邊界、案例功能及 Rui 聲音；不得為求流暢刪掉必要限制、引入新主張，或把現場檔的刻意重複磨平。原文已自然處只做輕修，記錄潤飾後字數
5. **主 session 驗收**：核對內容功能、核心句、聲音、相鄰章節銜接、字數與格式。維持繁體中文、短句呼吸、句末不加標點、不使用 `——` 與不加外顯來源引用。若潤飾發現實質內容問題，先分開處理並重新核對受影響段落；有爭議的內容回到編輯判斷，不以風格修改掩蓋。驗收未過，繼續修到通過
6. **更新與交接**：只有驗收通過才勾選任務，在 `tasks.md` 保留初稿 → 編輯後 → humanizer 後／最終驗收字數，並同步現有稿件字數盤點。執行 apply instructions 確認進度；若接棒新 session，交接訊息必須包含本流程及精確進度

此流程自加入後套用，不回溯宣稱舊稿已跑完新增步驟。既有潤飾紀錄以 `tasks.md` 的實際範圍為準；humanizer 是修訂階段，不另增章節任務或改變 19 項總數

## Risks / Trade-offs

- [12 萬字橫跨數十 session，聲音可能漂移] → 每章完成時對照 skill 與前章抽查；發現漂移先修 skill 再回頭修章
- [寫作過程中架構被推翻] → 允許。改 `docs/chapter.md` 後在 tasks.md 同步增刪任務，不視為 change 失敗
- [五件事 checklist 逐章打勾可能寫出公式化章節] → checklist 是驗收不是大綱，寫時以敘事為主、收尾時才核對

## Open Questions

- 現場檔第三個名額用不用、用在哪（見 `docs/chapter.md` 待決事項）
