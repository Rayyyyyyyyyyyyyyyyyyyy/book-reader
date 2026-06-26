# book-detail Specification

## Purpose

定義單本書的開啟體驗:點卡片開快速預覽彈窗(純預覽、不改網址),以及合併書籍資訊與心得的可分享靜態書頁。

## Requirements

### Requirement: 點卡片開啟快速預覽彈窗

系統 SHALL 在使用者點選書卡時開啟快速預覽彈窗,顯示封面、分類、編號、書名、作者、簡介,以及前往完整書頁/心得的入口。彈窗 SHALL 可由關閉鈕、點背景遮罩、按 Escape 關閉。

#### Scenario: 開啟彈窗

- **WHEN** 使用者點選一張書卡
- **THEN** 系統 SHALL 開啟該書的快速預覽彈窗

#### Scenario: 關閉彈窗

- **WHEN** 使用者按 Escape、點關閉鈕或點背景遮罩
- **THEN** 系統 SHALL 關閉彈窗並回到書目

### Requirement: 彈窗為純預覽,書頁為正式可分享網址

快速預覽彈窗 SHALL 為短暫的預覽層,MUST NOT 變更瀏覽器網址或新增歷史紀錄;每本書的完整頁 `/book/<slug>` SHALL 作為其正式、可分享的網址。彈窗 SHALL 提供前往該書完整頁的連結。從書籍完整頁按瀏覽器「上一頁」SHALL 乾淨地回到來源頁(自書目進入時即回到書目),不得殘留已開啟的彈窗。

#### Scenario: 彈窗不改變網址

- **WHEN** 使用者於書目開啟某書彈窗
- **THEN** 瀏覽器網址 SHALL 維持書目網址,且不新增可被「上一頁」觸發的歷史紀錄

#### Scenario: 書頁可分享

- **WHEN** 使用者直接造訪某書的完整頁網址 `/book/<slug>`
- **THEN** 系統 SHALL 顯示該書完整內容(書籍資訊與心得)

#### Scenario: 書頁上一頁回到目錄

- **WHEN** 使用者自書目經彈窗進入某書完整頁後,按瀏覽器上一頁
- **THEN** 系統 SHALL 回到書目,且不顯示殘留的彈窗

### Requirement: 合併的書籍/心得頁

系統 SHALL 為每本書提供一個靜態頁面作為其完整頁,並將讀書心得直接渲染於同一頁,取消原型「彈窗 → 再點閱讀心得 → 全螢幕」的兩段式流程。心得內文 SHALL 由 Markdown 原生渲染,MUST NOT 使用原型的自訂 `parseNote` 解析。

#### Scenario: 有心得的書頁

- **WHEN** 使用者進入一本有心得的書頁
- **THEN** 系統 SHALL 在同一頁顯示書籍資訊與完整心得(由 Markdown 渲染)

#### Scenario: 無心得的書頁

- **WHEN** 使用者進入一本無心得的書頁
- **THEN** 系統 SHALL 顯示書籍資訊與「讀書心得整理中」狀態,不顯示空白心得區

#### Scenario: 每本書皆有靜態頁

- **WHEN** 建置網站
- **THEN** 系統 SHALL 為 collection 中每本書產生一個可直接造訪的靜態頁
