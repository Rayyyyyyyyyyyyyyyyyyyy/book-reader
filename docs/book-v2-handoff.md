# book-v2 交接（2026-09-18 19:35）

新 session 先讀：`docs/book-v2-workflow.md`（流程、偏好 25 條、一致性清單）、`docs/chapter.md`（章卡、篇幅、「章末回看拆解」）、本檔。流程腳本 `docs/book-v2-pipeline.sh`。

## 交接時仍在背景跑的兩條線

`/clear` 後不會收到完成通知，要自己查進度：

```bash
tail -3 /private/tmp/claude-502/-Users-ray-shao-book-reader/c3ac6f98-aa36-4abe-b552-f2c05b2e18d6/tasks/bheet6ewz.output   # 第五章 expand
tail -3 /private/tmp/claude-502/-Users-ray-shao-book-reader/c3ac6f98-aa36-4abe-b552-f2c05b2e18d6/tasks/bnj1pbj2r.output   # 第二章 reflect
pgrep -fl "codex exec"                          # 還有沒有 codex 在跑
ls -t ~/.cache/book-v2-logs | head             # 各步 log 與 .last.md 回報
```

最後一行出現 `=== [05] pipeline done` 或 `=== [02] reflect done` 才算跑完。交接時：第五章在 reader 步驟（19:24 起，後面還有 editor、polish、audit），第二章回頭看第一版太像契約條文被退回，已收緊規則（0346044）後重跑（19:52 起）。

## 各章狀態

| 章 | 故事 | 作者校閱 | `## 回頭看` |
|---|---|---|---|
| 序章 | 擴寫定稿 1,7xx 字 | 已校閱 | 不設 |
| 第一章 | 擴寫定稿約 6,400 | 已校閱 | 已完成並經作者手改（e344d10） |
| 第二章 | 擴寫定稿約 5,200 | 已校閱 | **跑中**（bnj1pbj2r） |
| 第三章 | 擴寫定稿約 8,400 | 已校閱 | 待寫 |
| 第四章 | 擴寫定稿約 5,200 | 已校閱（2cf7fa2） | 待寫 |
| 第五章 | **擴寫跑中**（bheet6ewz），目標 8,000–9,000 | 未校閱 | 等作者校閱後 |
| 第六章 | 9,9xx 字（新篇幅寫的，未擴寫） | 讀過舊版 | 等第四、五章後 |
| 第七至十二章、結語 | 未寫 | | |
| 部稿 P1–P4 | 未寫 | | |

## 接下來要做的

**回頭看線**（只寫作者已校閱的章，追上正文就停）：第二章跑完 → 整節讀過、修掉抽象或後設句 → commit → `reflect 03` → `part P1 "第一部｜我們怎麼走到一起，又失去彼此" "第一部｜我們怎麼走到一起，又失去彼此" "4,000–5,000"`（檔名標題可再議）→ `reflect 04` → 停，等作者校閱第五章。

**故事線**：第五章跑完 → 整章讀過（照一致性清單，特別是擴寫殘留、同類場景重演、資訊邊界、跨章重複的梗）→ 修 → 在 `_feedback/05-audit.md` 末尾記「Claude 人工核對補修」→ commit → 請作者校閱第五章。第六章已是新篇幅，接著請作者校閱；之後照 `full` 模式寫第七章起（目標見 `docs/chapter.md` 篇幅表，第七章 7,000–8,000）。

## 注意事項

- 兩條線可以並行，但故事章節之間照順序，一次一章
- 每次 commit 只 add 該單位的檔案。故事：`NN-*.md`、`_feedback/NN-*.md`（不含 reflect）、`_continuity.md`。回頭看：`NN-*.md` 與 `_feedback/NN-reflect-*.md`，不要把 `_continuity.md` 的故事線改動一起帶進去
- 作者請我「看看」手改時：用 `git diff --word-diff` 看，歸納成偏好寫進 workflow 文件，以 `Apply the author's hand edits…` 為訊息 commit（稽核靠這個辨認作者句子）
- 問號由作者決定，不增刪
- 回頭看與部稿的文字易變抽象，commit 前要讀過並改成人話（見偏好 16、25）
- 根目錄 `book-v2/` 是作者自己的東西，不要碰
- 交接時工作區：`02` 與 `05` 的正文、`_continuity.md`、`_feedback/05-*` 由兩條背景線修改中，不是作者手改；等各自跑完再分開 commit
