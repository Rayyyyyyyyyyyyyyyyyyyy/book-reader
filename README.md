# 百冊 · One Hundred

一份持續更新的選書清單與讀書心得。這個 repo 維護「百冊」網站、已發布心得、心得草稿，以及 Rui-Xuan 的私人寫作參考與生命素材。

[瀏覽網站](https://rayyyyyyyyyyyyyyyyyyyy.github.io/book-reader/) · [訂閱心得 RSS](https://rayyyyyyyyyyyyyyyyyyyy.github.io/book-reader/rss.xml) · [文件入口](docs/README.md)

## 網站功能

- 依七個主題分類瀏覽書籍，搜尋中文／英文書名、作者或書籍編號。
- 篩選已有心得的書籍，透過快速預覽或獨立書頁閱讀書目與心得。
- 提供心得 RSS、sitemap 與首頁／書頁的 OG 分享圖。
- 以 Astro 5 產生靜態頁面，React 負責搜尋與互動；封面由 Astro 最佳化，字型由站內提供。

## Repo 結構

| 路徑 | 用途 |
|---|---|
| [`site/`](site/) | Astro 網站，包含頁面、React 元件、樣式與建置腳本 |
| [`site/src/content/books/`](site/src/content/books/) | 書目與已發布心得的單一真實來源，每本書一個 Markdown 檔 |
| [`book-reader/讀書心得/`](book-reader/讀書心得/) | 心得草稿，檔名即書名 |
| [`book-reader/is-me/`](book-reader/is-me/) | 私人生命素材、聲音參考與心得寫作計畫，不直接發布至網站 |
| [`book-png/`](book-png/) | 原始書籍封面 |
| [`openspec/specs/`](openspec/specs/) | 現行網站規格 |
| [`openspec/changes/archive/`](openspec/changes/archive/) | 已完成的網站變更紀錄 |
| [`.agents/skills/`](.agents/skills/) | 寫作、陪讀、編輯判讀與 OpenSpec 工作流程 |
| [`docs/`](docs/) | 文件導覽 |

出版作品的書稿、閱讀器與專用流程已移至獨立 repo；本網站可獨立建置。原 Git 歷史保留供查核搬移前的紀錄。

## 本機開發

使用 Node.js 22 與 npm，與 GitHub Actions 建置環境一致。從 repo 根目錄執行：

```bash
cd site
npm install
npm run dev
```

開啟終端顯示的本機網址；預設網站路徑為 `/book-reader/`。

以下指令皆在 `site/` 執行：

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動開發伺服器，啟動前自動產生封面 |
| `npm run build` | 自動產生封面並建置靜態網站至 `dist/` |
| `npm run preview` | 預覽已建置的網站，需先執行 build |
| `npm run covers` | 單獨從原始封面產生網站封面資產 |

## 更新書目與心得

1. 在 `book-reader/讀書心得/` 撰寫或整理草稿。
2. 準備發布時，更新 `site/src/content/books/` 中對應書籍的 Markdown；frontmatter 保存書目，正文保存心得。草稿不會自動同步至網站。
3. 新增書籍時，使用 `NNN-english-slug.md` 檔名；沒有英文名時可只用三位數排名，例如 `103.md`。檔名去除副檔名後即為書頁路由 `/book/<slug>`。
4. 有封面時，將原圖放入 `book-png/NNN_書名.jpg`，並將書籍的 `cover` 設為 `NNN.jpg`。建置腳本依三位數排名複製至 `site/src/assets/covers/`；缺圖時顯示排版式替代封面。
5. 執行 `npm run build`，並以 `npm run preview` 確認結果。

書籍 frontmatter 範例：

```yaml
---
rank: 55
cat: growth
zh: "原子習慣"
en: "Atomic Habits"
author: "James Clear"
desc: "微小的改變，如何累積成巨大的成果。"
cover: "055.jpg"
---
```

`rank`、`cat`、`zh`、`en`、`author`、`desc` 為必要欄位，`cover` 為選填。`zh` 或 `en` 可依書籍情況填入空字串。正文非空的書籍會顯示為已有心得並納入 RSS；空正文顯示「整理中」。完整欄位定義見 [`content.config.ts`](site/src/content.config.ts)。

`cat` 可使用 `psych`、`biz`、`finance`、`growth`、`neuro`、`influence`、`soul`，對應名稱見 [`categories.ts`](site/src/data/categories.ts)。

## 建置與部署

網站透過 [GitHub Actions](.github/workflows/deploy.yml) 發布至 GitHub Pages。推送至 `main` 且變更包含 `site/**`、`book-png/**` 或部署 workflow 時會觸發；也可手動執行 workflow。只修改草稿、文件或 skills 不會自動部署。

首次設定需在 repo 的 **Settings → Pages → Source** 選擇 **GitHub Actions**。

預設站點為 `https://rayyyyyyyyyyyyyyyyyyyy.github.io`，部署路徑為 `/book-reader`。自訂網域或部署路徑可在建置時覆寫：

```bash
SITE_URL=https://example.com BASE_PATH=/ npm run build
```

提交前至少執行 `npm run build`；介面變更另檢查首頁搜尋、分類、書籍詳情、RSS 與行動版。不提交 `site/dist/`、產生的封面或密鑰。

## 相關文件

- [網站開發細節](site/README.md)：資料模型、OG 字型與部署設定。
- [Repo 工作規則](AGENTS.md)：內容格式、寫作素材與驗證要求。
- [架構與建置機制](CLAUDE.md)：資料來源、建置邊界與 skills 分工。
- [文件入口](docs/README.md)：寫作計畫、素材與規格的完整導覽。
