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
- **每章寫完跑「讀者→編輯」修訂迴圈**：主 session 寫完一章後，(1) 開一個乾淨的子代理，只給 `docs/ai-reader.md` 角色與該章全文（不給書規格、skill 與寫作過程），產出讀者回饋；(2) 把回饋交給另一個子代理，以 `docs/ai-editor.md` 角色逐條評斷（必須處理／建議處理／暫時觀察／不建議修改），並在不破壞聲音與字數配額的前提下直接修稿。讀者回饋是訊號不是命令，取捨由編輯代理判斷、主 session 驗收

## Risks / Trade-offs

- [12 萬字橫跨數十 session，聲音可能漂移] → 每章完成時對照 skill 與前章抽查；發現漂移先修 skill 再回頭修章
- [寫作過程中架構被推翻] → 允許。改 `docs/chapter.md` 後在 tasks.md 同步增刪任務，不視為 change 失敗
- [五件事 checklist 逐章打勾可能寫出公式化章節] → checklist 是驗收不是大綱，寫時以敘事為主、收尾時才核對

## Open Questions

- 現場檔第三個名額用不用、用在哪（見 `docs/chapter.md` 待決事項）
