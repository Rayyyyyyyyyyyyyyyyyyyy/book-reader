# CLAUDE.md

共用規則先讀 [AGENTS.md](AGENTS.md)。本 repo 的產品是「百冊 · One Hundred」讀書心得網站與其寫作材料。

## 建置期產物

`predev` / `prebuild` 執行 `site/scripts/covers.mjs`：`book-png/NNN_*.jpg` → `site/src/assets/covers/NNN.jpg`。來源只看三位數排名前綴；缺圖時前台使用排版式 placeholder。產生封面、Astro cache、`site/dist/` 都是 gitignored，不手動編輯或提交。

## 資料與網站

- Astro 5 靜態網站位於 `site/`，React island 負責搜尋、分類與互動。
- `site/src/content/books/` 是書目與發布心得的單一真實來源。`src/lib/books.ts` 的 `entryToMeta()` 依 Markdown body 是否非空計算 `hasNote`，空正文顯示「整理中」。
- `entry.id` 即路由 slug，封面按 `rank` 對應；不另維護 slug 映射。
- GitHub Actions 只在 `site/**`、`book-png/**` 或 workflow 本身變動時建置發布；只改心得草稿、文件與 skills 不會觸發。

## 寫作與 skills

草稿在 `book-reader/讀書心得/`，私人參考與生命素材在 `book-reader/is-me/`。它們不由網站自動發布；正式心得需更新對應的 content Markdown。

| Skill | 責任 |
|---|---|
| `rui-xuan-reading` | 讀書心得、反思隨筆、生命素材與局部修訂；按任務載入 references |
| `ai-reader` | 陪讀與心得／隨筆試讀，只提供原文有據的閱讀反應 |
| `ai-editor` | 判讀心得／隨筆回饋的採納價值、修訂方向與保留項目 |
| `openspec-*` | 規格提案、實作、探索與歸檔 |
| `source-command-opsx-*` | OpenSpec slash command 包裝 |

Skills 位於 `.agents/skills/`，供 Claude 與 Codex 共用。不要把其他作品的章卡、人物校閱或出版流程混入心得寫作規則。

## OpenSpec

現行規格是 `book-catalog`、`book-content-model`、`book-detail`、`site-delivery`。網站變更在 `openspec/changes/`，完成後放入 `archive/<YYYY-MM-DD>-<id>/`。
