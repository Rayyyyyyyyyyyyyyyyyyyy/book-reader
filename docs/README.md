# docs 索引

這裡只放 book-v2 的現行入口、章節腳本，以及可追溯的研究與決策。Repo 架構與建置機制見 `../CLAUDE.md`，共用規則見 `../AGENTS.md`。

## 現行入口

| 檔案 | 責任 |
|---|---|
| [book-v2-handoff.md](book-v2-handoff.md) | **現在快照**：目前稿件、發布狀態、已知風險與下一步；不保存逐輪日誌 |
| [book-v2-workflow.md](book-v2-workflow.md) | **現行操作規格**：五步流程、一致性清單、作者修稿偏好、校閱與 commit 規則 |
| [book-v2-pipeline.sh](book-v2-pipeline.sh) | `full`／`expand`／`review`／`audit` 的實際執行腳本 |
| [book-v2-titles.md](book-v2-titles.md) | 書名與篇章名的提案紀錄；目前所有候選仍未採納 |
| [rui-xuan-book-v2](../.agents/skills/rui-xuan-book-v2/SKILL.md) | Rui-Xuan 寫作與 book-v2 正文修改的單一 skill 入口 |

直接修改 `book-reader/book-v2/*.md` 正文前，不論範圍大小，都要依 skill 的 [正文直改分支](../.agents/skills/rui-xuan-book-v2/references/book-v2-direct-edit.md) 完成同輪取材與逐字引文門檻。門檻的由來另見 [決策紀錄](decisions/book-v2-動筆前規範.md)。

## 章節腳本

`chapter/` 才是現行章節腳本：`00-總則.md`、各章 `NN-章名.md`、`觀念核對.md` 與 `參考.md`。正文層的跨章事實與資訊邊界在 `../book-reader/book-v2/_continuity.md`。

[chapter.md](chapter.md) 只為舊連結保留相容索引，不承載設定或要求；流水線不讀它。

## 研究與決策

| 目錄／檔案 | 性質 |
|---|---|
| `my-story/` | 作者原始敘述，改編素材來源 |
| [research/日劇金句脈絡-冬のなんかさ春のなんかね.md](research/日劇金句脈絡-冬のなんかさ春のなんかね.md) | 金句、命名與代價測試的研究來源；不是現行規格 |
| [research/橘子-角色對話研究.md](research/橘子-角色對話研究.md) | 可驗證訪談的對白研究；不是仿寫指南 |
| [decisions/book-v2-動筆前規範.md](decisions/book-v2-動筆前規範.md) | 正文直改門檻的失敗分析與設計理由 |

## 分析與回饋

全書級診斷、章級回饋與逐處清單放在 `../book-reader/book-v2/_feedback/`，索引見該目錄的 `README.md`。它們是工作證據，不是另一套高於 workflow 的規格。

## 文件生命週期

- `handoff` 只保留此刻仍成立的狀態；舊進度、舊字數與已結束工作交給 Git history，不往下堆日誌。
- `workflow` 與 skill references 保存仍要執行的規則；規則改變時直接更新，不在研究檔複製第二份。
- `research/` 保存材料、查證與推導；`decisions/` 保存一項機制為何存在。兩者都要在檔首標明不是現行操作規格。
- 章節事實只在章卡與 `_continuity.md` 維護；`chapter.md`、handoff 與研究檔不再複製一份。
