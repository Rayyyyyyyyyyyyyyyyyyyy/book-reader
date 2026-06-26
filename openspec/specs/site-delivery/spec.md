# site-delivery Specification

## Purpose

定義「百冊」網站的靜態建置與交付:GitHub Pages 部署、OG 分享圖、sitemap、心得 RSS、字型自架子集化與封面圖最佳化。

## Requirements

### Requirement: 靜態建置與 GitHub Pages 部署

系統 SHALL 以 Astro 靜態輸出建置成可部署到 GitHub Pages 的靜態檔。設定 SHALL 正確指定 `base` 路徑,使所有資源(JS、封面、字型)在子路徑下不致 404。部署 SHALL 由 GitHub Actions workflow 自動完成。

#### Scenario: 子路徑資源正確

- **WHEN** 網站部署於 GitHub Pages 子路徑並被造訪
- **THEN** 所有資源 SHALL 以正確 base 路徑載入,不出現 404

#### Scenario: 自動部署

- **WHEN** 變更推送至預設分支
- **THEN** GitHub Actions SHALL 建置並發佈網站

### Requirement: OG 分享圖與社群預覽

系統 SHALL 在建置時為首頁、每本書與每篇心得產生 Open Graph 預覽圖與對應 meta 標籤,使連結在社群平台分享時顯示標題與預覽圖。

#### Scenario: 分享書頁

- **WHEN** 使用者於社群平台貼出某書頁連結
- **THEN** 該連結 SHALL 顯示對應的標題與 OG 預覽圖

### Requirement: Sitemap 與心得 RSS

系統 SHALL 產生 `sitemap.xml` 涵蓋所有頁面,並提供讀書心得的 RSS 訂閱來源。

#### Scenario: sitemap 涵蓋頁面

- **WHEN** 建置完成
- **THEN** `sitemap.xml` SHALL 列出首頁與所有書頁

#### Scenario: 心得 RSS

- **WHEN** 使用者訂閱心得 RSS
- **THEN** RSS SHALL 列出有心得的書籍項目

### Requirement: 字型自架與子集化

系統 SHALL 自架 Noto Serif TC 與 Cormorant Garamond 字型並進行子集化,MUST NOT 於執行期依賴 Google Fonts 外部請求,以降低首屏字型閃動並加快載入。

#### Scenario: 不依賴外部字型服務

- **WHEN** 載入任一頁面
- **THEN** 字型 SHALL 由站內資源提供,不發出對 Google Fonts 的外部請求

### Requirement: 封面圖最佳化

系統 SHALL 以 Astro 的圖片最佳化(現代格式與延遲載入)處理書籍封面。

#### Scenario: 最佳化封面

- **WHEN** 頁面顯示封面圖
- **THEN** 系統 SHALL 提供經最佳化的圖片(現代格式、適當尺寸、延遲載入)
