---
name: rui-xuan-book-v2
description: 以 Rui-Xuan V2 規則撰寫或改寫繁體中文讀書心得、反思隨筆與改編敘事書稿，診斷 book-v2 的人物或跨章問題，依註解修稿，或整理生命素材；直接修改 book-v2 正文時也負責同輪取材與逐字引文門檻
---

# Rui-Xuan 正式寫作 V2

這是任務路由與不可省略的共用契約。詳細規則依文體放在 `references/`；只讀本次任務需要的檔案，不一次載入全部。

核心只有兩件事：

> 用 Rui-Xuan 的聲音，寫一篇會往前走的文章

Rui-Xuan 決定聲音；敘事推進決定文章怎麼思考。推進可以來自事件、資訊、選擇、代價、關係或理解的改變，不只來自反思。

## 先判斷任務

素材的內容不等於任務。先依使用者要求判斷要整理素材、提供回饋，還是寫作；貼上隨筆不等於要求改寫。

依註解修稿時，先讀目前版本與相關 diff，辨認使用者已手改的語氣和意思，再按引文與前後文定位，行號只作線索。已改過的句子不要重複套用，刪改後要接好相鄰段落。替換若改變原意、增加抽象度或把可能說成必然，先指出差異；討論中的候選句不自動成為定稿。

使用者給素材不自動代表准許改編。已明確授權改編後，可依作品設定合併、重排或創作，但新增內容不回填成作者真實經歷。

## 依任務載入 reference

| 任務 | 必讀 |
|---|---|
| 整理生命素材 | [life-material.md](references/life-material.md) |
| 讀書心得 | [source-grounding.md](references/source-grounding.md)、[common-voice.md](references/common-voice.md)、[structure-and-revision.md](references/structure-and-revision.md)、[book-review.md](references/book-review.md) |
| 反思隨筆 | [source-grounding.md](references/source-grounding.md)、[common-voice.md](references/common-voice.md)、[structure-and-revision.md](references/structure-and-revision.md)、[reflective-essay.md](references/reflective-essay.md) |
| 改編敘事書稿 | [source-grounding.md](references/source-grounding.md)、[common-voice.md](references/common-voice.md)、[structure-and-revision.md](references/structure-and-revision.md)、[adapted-narrative.md](references/adapted-narrative.md) |
| 只提供回饋、不動筆 | 讀對應文體 reference 與使用者指定材料；不自行改稿 |

### 直接修改 book-v2 正文

直接修改 `book-reader/book-v2/*.md` 正文時——包含只改幾句、依清單或回饋補寫、套用作者裁定、潤飾既有章節——除了「改編敘事書稿」的必讀檔，再完整讀取並執行 [book-v2-direct-edit.md](references/book-v2-direct-edit.md)。

這是同一個 skill 的正文直改分支，不是另一套聲音規則。只讀、診斷、統計或回報不觸發；由 `docs/book-v2-pipeline.sh` 啟動的步驟不重跑引文門檻，因為必讀材料已由 prompt 送入。

作者自 2026-09-23 起取消「手改句一律不動」的硬限制。手改是判讀聲音與取捨的高價值證據，不是逐字禁改名單；必要時可修，須保留原句／改後句／理由供作者校閱。章卡與舊回饋同樣是判斷材料，不自動凌駕作者本輪裁定。

## 文體判斷

- **讀書心得**：從書名、書中概念或閱讀感想進去，追到機制，再落回生活。
- **反思隨筆**：從經歷、感受、回憶、對話或念頭進去，追問理解如何改變。
- **現場檔**：事情仍在發生、還在痛或還沒有答案時使用；不要硬寫成已經想通。
- **改編敘事書稿**：以跨章事件與人物變化為主要推進單位。單章不必形成完整理解；當時的人物只能使用當時擁有的資訊，事後理解延後形成。章卡決定故事需要發生什麼，觀念核對只在初稿後驗收，不為補觀念反推額外場景、台詞或頓悟。

## 優先順序

讀書心得與紀實隨筆：

```text
真實 → 推進 → 準確 → 聲音 → 漂亮
```

改編敘事書稿：

```text
事件與人物狀態 → 當時能知道的資訊 → 敘事推進 → 必要反思 → 寫完後再用觀念表驗收
```

長篇敘事裡，人物還不知道答案時，就讓讀者先看見，不要求敘述者立刻解釋。最後只保留真正有工作的句子。

## 使用方式

$ARGUMENTS

依上表載入對應 reference 與使用者指定材料後再工作。reference 內的招式是判斷工具，不是每篇都要完成的 KPI。
