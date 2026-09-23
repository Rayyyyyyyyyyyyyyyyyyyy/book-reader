# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**與 `AGENTS.md` 的分工**：`AGENTS.md` 是 Claude 與 Codex 共用的規則層——目錄用途、npm 指令、程式風格與命名、測試與驗證、commit／PR 規範、寫作與生命素材規則，都以它為準，**先讀它**。本檔只補規則之外的架構與機制，不重複。

## 動 book-v2 正文之前（強制門檻）

直接修改 `book-reader/book-v2/*.md` 正文——包括只改幾句、依回饋補寫、套用作者裁定或潤飾——必須使用 `.agents/skills/rui-xuan-book-v2/SKILL.md`，並執行它的 `references/book-v2-direct-edit.md` 分支：在同一輪實際開原檔，先輸出附行號的逐字引文；**貼不出引文就是沒讀，沒讀不動筆。** 只讀不改不觸發，由 `codex exec` 執行的流水線步驟也不重跑這道門檻。

## 這個 repo 是兩個產品

1. **`site/`**：Astro 5 靜態網站「百冊 · One Hundred」，部署到 GitHub Pages。
2. **書稿流程**：`book-reader/` 的書稿與心得，加上 `docs/book-v2-pipeline.sh` 這條以 `codex exec` 驅動的逐章寫作流水線。兩者只透過建置腳本相接。

## 建置期產物（動手前先知道）

`predev` / `prebuild` 會先跑兩個腳本，三個目錄都是 gitignored、每次建置重生，不要手動編輯或提交：

| 腳本 | 來源 → 產物 |
|---|---|
| `site/scripts/covers.mjs` | `book-png/NNN_*.jpg` → `site/src/assets/covers/NNN.jpg`（只看三位數排名前綴；缺圖時前台退回排版式 placeholder） |
| `site/scripts/manuscript-reader.mjs --public` | `book-reader/book-v2/NN-*.md` + `site/scripts/manuscript-reader-template.html` → `site/public/manuscript/`（單一 HTML + service worker） |
| `site/scripts/manuscript-reader.mjs --serve` | 同上，輸出到 `site/.offline-reader/`，供 `npm run reader` 離線預覽 |

## 網站架構要點

- **「有心得」是算出來的**：Markdown body 非空 → `hasNote`，否則前台顯示「整理中」。邏輯集中在 `src/lib/books.ts` 的 `entryToMeta()`，頁面（`index.astro`、`pages/book/[...slug].astro`）與 React island `BookGrid.tsx` 都吃它產出的 `BookMeta`。
- **slug 就是檔名**：`entry.id` 直接當路由用，沒有另一層 slug 映射；封面依 `rank` 配對。
- **書稿閱讀器是獨立頁**：不在網站導覽裡，也不走 Astro content collection，網址是 `/manuscript`。2026-09-22 起發布的是 **book-v2**（`book-reader/book-v2/`，序章至後記十五篇，只吃 `NN-*.md`，`_continuity.md` 與 `_feedback/` 自動略過）。**註解功能暫時關閉**：開關是模板裡的 `NOTES_ENABLED`，設回 `true` 即恢復，既有註解仍留在讀者的 localStorage。
- **部署觸發有 path filter**：`.github/workflows/deploy.yml` 只在 `site/**`、`book-png/**`、`book-reader/book-v2/**`、workflow 本身變動時跑。改 `book-reader/book/`（v1）或 `docs/` 不會觸發部署。

## book-v2 寫作流水線

流程與理由見 `docs/book-v2-workflow.md`；章節腳本分檔在 `docs/chapter/`（`00-總則.md`、各章 `NN-章名.md`、`觀念核對.md`、`參考.md`），跨章事實與資訊邊界在 `book-reader/book-v2/_continuity.md`，每章回饋在 `_feedback/NN-{scenes,reader,editor,audit}.md`；臨時諮詢（例如把改寫提案送讀者與編輯判斷）另存成 `_feedback/NN-<議題>-{reader,editor}.md`。

```bash
docs/book-v2-pipeline.sh full   07 "住在一起以後" "第七章｜住在一起以後" "<目標字數>"
docs/book-v2-pipeline.sh expand 01 "十一點的電話" "第一章｜十一點的電話" "<目標字數>"
docs/book-v2-pipeline.sh review 07 "住在一起以後" "第七章｜住在一起以後" "<目標字數>"
docs/book-v2-pipeline.sh audit  06 "這一次，我們真的在一起了" "第六章｜這一次，我們真的在一起了"
```

目標字數以該章章卡（`docs/chapter/NN-*.md`）與 `00-總則.md` 的篇幅表為準，不沿用範例數字。

- 五步：寫作 → 讀者 → 編輯 → 潤飾 → 稽核。每一步都是**全新的 `codex exec` session**（`gpt-5.6-sol`，reasoning effort high），刻意不共用上下文；每步限時 30 分鐘（`STEP_TIMEOUT`）。
- `review` 模式用於作者已親手調整結構之後：正文現況優先於場景表與舊回饋，不得復原被刪場景，也不得把一句帶過的事展開成新場景。
- log 在 `~/.cache/book-v2-logs/`（`BOOK_V2_LOG` 可改），**不進 repo**。
- **作者手改來源候選**由腳本從含 `hand edit` 的 commit 抽成 `~/.cache/book-v2-logs/NN-author-lines.md`。這份清單可能混入首次入庫或模型撰寫的句子，只供核對，不再逐字鎖定；可信來源與本輪差異另記在 `_feedback/全書-手改對照.md` 及本輪紀錄。未 commit 的作者手改可用 `EXTRA_AUTHOR` 補入候選，但仍須核實來源。
- 腳本若警告檔案被寫到 repo 根目錄的 `book-v2/`，代表該步走錯路徑（已被移到 log 的 `stray/`），要回頭確認產出位置。
- 一章跑完由 Claude 整章讀過、核對後交作者校閱，作者同意才 commit；稽核若須修改可確認的作者手改句，記錄原句、改後句與理由，不因來源而停手。
- **作者校閱完成後不是只有 commit**：照 `docs/book-v2-workflow.md`「作者校閱完成後」**七步**做完。第 3 步（從本章手改迭代「使用者修稿偏好」）、第 4 步（核實作者手改與模型修稿的來源並更新紀錄）與第 5 步（更新 `docs/book-v2-handoff.md` 的字數與各章狀態）最常被跳過，收到核准時先把這三步排進去。

## Skills（`.agents/skills/`）

skill 放在 `.agents/skills/<name>/SKILL.md`，不是 `.claude/skills/`，因為同一份規則要給 Claude 與流水線裡的 Codex 共用。除了已註冊成 slash command 的 `opsx-*` 之外，其餘要自己讀路徑取用。

| Skill | 用在哪 |
|---|---|
| `rui-xuan-book-v2` | 寫作聲音與 book-v2 直接修改流程的單一真實來源，含讀書心得／反思隨筆／改編敘事書稿三個分流；正文直改的同輪取材、逐字引文門檻、衝突停手與作者校閱後七步收在它的 `references/book-v2-direct-edit.md`。流水線的寫作、擴寫、潤飾三步都指定它 |
| `ai-reader` | 流水線第 2 步，以「第一次讀到這章的讀者」回應。**刻意不讀 `docs/chapter/` 與場景表**，避免用作者意圖替原稿補完 |
| `ai-editor` | 流水線第 3 步，判讀讀者回饋並分級、建立章級人物基準、列修訂清單。只在明確要求時動筆 |
| `openspec-{propose,apply-change,archive-change,explore}` | openspec 官方 skill，需要 `openspec` CLI |
| `source-command-opsx-*` | 上列 openspec skill 遷移成 slash command 的包裝，對應 `/opsx-propose`、`/opsx-apply`、`/opsx-archive`、`/opsx-explore` |

第 5 步稽核刻意不掛 skill（純事實核對，不要寫作聲音介入）。`docs/book-v2-pipeline.sh` 以 `$skill-name（.agents/skills/.../SKILL.md）` 的寫法把 skill 注入 codex prompt——改 skill 檔名或路徑時，腳本裡的字串要一起改。

## OpenSpec 檔案結構

`openspec/specs/<capability>/spec.md` 是現況規格（`book-catalog`、`book-content-model`、`book-detail`、`site-delivery`）；`openspec/changes/<change-id>/` 放 `proposal.md`、`design.md`、`tasks.md`（必要時 `verification.md`）與 spec deltas，完成後移進 `changes/archive/<YYYY-MM-DD>-<id>/`。
