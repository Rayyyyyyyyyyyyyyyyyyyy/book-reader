# book-v2 交接（2026-09-18 19:35）

新 session 先讀：`docs/book-v2-workflow.md`（流程、偏好 25 條、一致性清單）、`docs/chapter.md`（章卡、篇幅、「章末回看拆解」）、本檔。流程腳本 `docs/book-v2-pipeline.sh`。

## 交接時仍在背景跑的兩條線

`/clear` 後不會收到完成通知，要自己查進度：

```bash
tail -3 /private/tmp/claude-502/-Users-ray-shao-book-reader/c3ac6f98-aa36-4abe-b552-f2c05b2e18d6/tasks/bads06ibt.output   # 第四章 reflect（=== [04] reflect done）
tail -3 /private/tmp/claude-502/-Users-ray-shao-book-reader/c3ac6f98-aa36-4abe-b552-f2c05b2e18d6/tasks/bin2n8zth.output   # 第五章修訂＋稽核（最後一行 === [05] audit done）
pgrep -fl "codex exec"                          # 還有沒有 codex 在跑
ls -t ~/.cache/book-v2-logs | head             # 各步 log 與 .last.md 回報
```

最後一行出現 `=== [05] pipeline done` 才算跑完。第五章已完成並 commit；第二章回頭看已重寫完成（8d07b01）；第三章回頭看已完成（567e2cd）。部稿已取消（作者決定），第一部部稿草稿已移出 repo。

## 各章狀態

| 章 | 故事 | 作者校閱 | `## 回頭看` |
|---|---|---|---|
| 序章 | 擴寫定稿 1,7xx 字 | 已校閱 | 不設 |
| 第一章 | 擴寫定稿約 6,400 | 已校閱 | 已完成並經作者手改（e344d10） |
| 第二章 | 擴寫定稿約 5,200 | 已校閱 | 已完成（8d07b01），待作者看 |
| 第三章 | 擴寫定稿約 8,400 | 已校閱 | 已完成（567e2cd），待作者看 |
| 第四章 | 擴寫定稿約 5,200 | 已校閱（2cf7fa2） | **跑中**（bads06ibt） |
| 第五章 | 作者校閱中（手改 97f146e）；依作者要求修訂中（bin2n8zth）：營區與她同城、他休假留在她的城市不回台北；多寫他被排在第二順位的場景；目標 8,500–9,000。修訂指示在 scratchpad `05-revise-prompt.md` | 校閱中 | 等作者校閱後 |
| 第六章 | 9,9xx 字（新篇幅寫的，未擴寫） | 讀過舊版 | 等第四、五章後 |
| 第七至十二章、結語 | 未寫 | | |
| 部稿 | **已取消**；書末是否附錄工具，寫到書末再討論 | | |

## 接下來要做的

**回頭看線**（只寫作者已校閱的章，追上正文就停）：第四章回頭看跑完 → 整節讀過、修掉抽象或重述 → commit → 停，等作者校閱第五章。

**故事線**：第五章已完成，等作者校閱。第六章已是新篇幅，接著請作者校閱；之後照 `full` 模式寫第七章起（目標見 `docs/chapter.md` 篇幅表，第七章 7,000–8,000）。

## 注意事項

- 兩條線可以並行，但故事章節之間照順序，一次一章
- 每次 commit 只 add 該單位的檔案。故事：`NN-*.md`、`_feedback/NN-*.md`（不含 reflect）、`_continuity.md`。回頭看：`NN-*.md` 與 `_feedback/NN-reflect-*.md`，不要把 `_continuity.md` 的故事線改動一起帶進去
- 作者請我「看看」手改時：用 `git diff --word-diff` 看，歸納成偏好寫進 workflow 文件，以 `Apply the author's hand edits…` 為訊息 commit（稽核靠這個辨認作者句子）
- 問號由作者決定，不增刪
- 回頭看與部稿的文字易變抽象，commit 前要讀過並改成人話（見偏好 16、25）
- 根目錄 `book-v2/` 是作者自己的東西，不要碰
- 交接時工作區：`02` 與 `05` 的正文、`_continuity.md`、`_feedback/05-*` 由兩條背景線修改中，不是作者手改；等各自跑完再分開 commit
