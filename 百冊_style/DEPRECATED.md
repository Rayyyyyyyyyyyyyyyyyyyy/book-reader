# ⚠️ 已退役 — 不再作為網站來源

這個資料夾是最初用 Claude Design 產出的原型(`百冊書選.dc.html` + `support.js` +
`book-notes.js`),已於遷移至 Astro 後**退役**,不再是網站的來源。

正式網站在 [`../site/`](../site/)。

保留此資料夾的原因:
- `notes/*.md` 是讀書心得的原始備份(已併入 `../site/src/content/books/*.md`)。
- `百冊書選.dc.html` 的 `books[]` 是一次性遷移腳本 `../site/scripts/migrate.mjs` 的來源,留作追溯。

**要新增或修改書目/心得,請直接編輯 `../site/src/content/books/*.md`,不要改這裡。**
