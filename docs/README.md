# docs 文件索引

這裡保存《喔！這裡還有一點》book-v2 的章卡、寫作流程、提案、研究與決策。book-v1 書稿與章卡已移至獨立 repo。共用規則見 [AGENTS.md](../AGENTS.md)，網站架構、建置與流水線機制見 [CLAUDE.md](../CLAUDE.md)。

## 從任務找入口

| 任務 | 先讀什麼 |
|---|---|
| 接手工作、查稿件狀態與下一步 | [book-v2-handoff.md](book-v2-handoff.md)；字數與狀態按檔首更新日期解讀，再核對工作區 |
| 修改或潤飾正文 | [rui-xuan-book-v2 skill](../.agents/skills/rui-xuan-book-v2/SKILL.md) 的 [正文直改分支](../.agents/skills/rui-xuan-book-v2/references/book-v2-direct-edit.md)，再按問題讀現稿、diff 與相關材料 |
| 執行逐章流水線 | [book-v2-workflow.md](book-v2-workflow.md) 與 [book-v2-pipeline.sh](book-v2-pipeline.sh) |
| 查某章設定、篇幅與跨章事實 | [chapter-v2 總則](chapter-v2/00-總則.md)、該章章卡與 [正文連續性](../book-reader/book-v2/_continuity.md) |
| 查作者校閱、試改、人物診斷與舊回饋 | [回饋索引](../book-reader/book-v2/_feedback/README.md) |
| 討論書名與篇章名 | [book-v2-titles.md](book-v2-titles.md)，先查正式書名定案，再依輪次辨認篇章名候選與作者回饋 |
| 找原始素材、研究依據或機制由來 | 下方「素材、研究與決策」 |

正文直改須同輪讀當前正文與相關 diff，按問題範圍補讀必要材料；現行流程不要求動筆前逐條貼引文。作者確認整章 OK 後，依 workflow 的「作者確認這章 OK 後的七步」更新紀錄並提交。一般評讀或局部採納的狀態另依各輪紀錄確認。

## 章卡、正文與回饋

現行 book-v2 共十六篇：序章 `00`、第一至十三章 `01–13`、結語 `14`、後記 `15`。2026-09-25 拆章前文件保留舊章號；找舊回饋時使用 [新舊章號對照](../book-reader/book-v2/_feedback/history/README.md#拆章前後的查找對照)。

| 位置 | 責任 |
|---|---|
| [chapter-v2/00-總則.md](chapter-v2/00-總則.md) | 全書定位、敘事進程、寫作總則與篇幅尺度 |
| [chapter-v2/](chapter-v2/) 的 `NN-章名.md` | 各章事件、人物狀態與篇章功能 |
| [chapter-v2/觀念核對.md](chapter-v2/觀念核對.md) | 初稿後核對觀念與適用條件，不據此反推新場景 |
| [chapter-v2/參考.md](chapter-v2/參考.md) | 稿件、註解承接與腳本層參考 |
| [book-reader/book-v2/](../book-reader/book-v2/) | 持續修訂的正文，也是網站 `/manuscript` 閱讀器的建置來源 |
| [book-v2/_continuity.md](../book-reader/book-v2/_continuity.md) | 跨章事實、時序、物件歸屬與資訊邊界 |
| [book-v2/_feedback/README.md](../book-reader/book-v2/_feedback/README.md) | 場景表、流程回饋、作者校閱、局部修訂與全書診斷的導航 |
| [author-review/README.md](../book-reader/book-v2/_feedback/author-review/README.md) | 按日期查作者核准範圍、字數、指紋與親筆來源 |
| [revisions/README.md](../book-reader/book-v2/_feedback/revisions/README.md) | 按單章或跨章查原句、改後句、取捨與採納過程 |
| [diagnostics/README.md](../book-reader/book-v2/_feedback/diagnostics/README.md) | 全書／跨章掃描、通讀研究與讀者、編輯諮詢 |
| [history/README.md](../book-reader/book-v2/_feedback/history/README.md) | 被取代或機制已取消的流程回饋，以及新舊章號對照 |
| [chapter.md](chapter.md) | 舊連結相容索引；現行流水線從 `chapter-v2/` 取章卡 |

2026-10-05 回饋目錄依用途整理：日期紀錄分存 `author-review/`、`revisions/`，11 份全書／跨章報告集中於 `diagnostics/`，歷史流程批次仍在 `history/`。流水線的 `NN-{scenes,reader,editor,audit}.md` 與五份人物、手改固定來源檔留在 `_feedback/` 本層，名稱與使用邊界見 [固定來源檔](../book-reader/book-v2/_feedback/README.md#固定來源檔)。

整理日期不等於稿件核准日期。報告與修訂中的行號、字數及待校閱狀態按產出當時版本解讀；現稿核准查 [最新核准入口](../book-reader/book-v2/_feedback/README.md#最新核准入口)，不因存檔或分類而推定所有建議均已採納。

## 素材、研究與決策

| 位置 | 內容與用途 |
|---|---|
| [my-story/](my-story/) | 原始故事敘述、早期專案說明與藍圖；其章號與規劃屬原始素材版本，現行書稿設定由 `chapter-v2/` 與 `_continuity.md` 維護 |
| [book-reader/is-me/](../book-reader/is-me/) | 私人生命素材與人物參考；依寫作 skill 的範圍取材，引用須有實際讀過的來源 |
| [日劇金句脈絡](research/日劇金句脈絡-冬のなんかさ春のなんかね.md) | 金句、命名與代價測試的來源研究 |
| [橘子角色對話研究](research/橘子-角色對話研究.md) | 從可驗證訪談觀察人物說話方式 |
| [曖昧甜寵寫作技法](research/曖昧甜寵-寫作技法研究.md) | 現行第六章〈第二順位〉的曖昧、親密與人物代價參考 |
| [小說人物互動寫法](research/小說人物互動寫法-研究資料.md) | 遠距離相處、難得見面與失約的一手來源分析 |
| [book-v2 動筆前規範的決策紀錄](decisions/book-v2-動筆前規範.md) | 早期引文門檻的失敗分析與設計理由；目前取材與修改流程從 skill 的正文直改分支進入 |

研究供查證與判讀，決策檔供理解機制沿革；現行操作依 workflow 與 skill，引用作品的分析不當成作者真實經歷或自動改稿指令。

## 維護方式

- `handoff` 保存有日期的現況快照；舊進度與字數回查 Git history，逐輪校閱與試改另存 `_feedback/`。
- `workflow` 與 skill references 維護現行規則；規則改變時同步修正索引，避免舊決策文字被當成現行要求。
- `chapter-v2/` 與 `_continuity.md` 維護章節設定及事實；handoff、研究、提案與相容索引只導航與引用。
- `research/` 保存來源、查證與推導；`decisions/` 保存機制理由，檔首標示文件性質。
- 日期回饋保留當輪確認範圍與來源；新增紀錄更新所屬目錄 README，總索引保留現況與導航。搬移時搜尋並更新相關文件的引用；被取代的版本歸檔時保留內容與舊章號。
