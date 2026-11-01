## 架構

- `BookGrid`（既有）負責搜尋、分類、只看有心得與檢視切換，並把篩選後的分區交給 `ImmersiveShelf` 或原網格。
- `ImmersiveShelf` 持有「目前選中的書」這一個狀態，並鎖定捲動；`BookStage` 以 portal 掛到 `body`，開啟期間將其他 `body` 子元素設為 `inert`（同時達成焦點限制與防止背景操作）。
- 書架階段只有 CSS 書脊；`BookStage` 是唯一的 3D 物件，不為每本書建立 3D 模型或 render loop。

## 連續抽書的關鍵

- 3D 書的 transform-origin 放在書脊平面。`rotateY(90deg)` 時書脊面恰好落在螢幕平面上，以書脊的 `getBoundingClientRect()` 換算位置與縮放 `s`，厚度取 `T = 書脊寬 / s`，因此起始畫面與書架上的書脊逐像素重合，不需要淡入替換。
- GSAP 沒有 `scaleZ`，所以位置、旋轉、縮放都寫成 CSS 變數（`--x --y --z --ry --s --open --f`），由 GSAP 補間變數，transform 的順序由 CSS 控制。
- 關閉時重新量測書脊並建立新的時間軸，所以抽到一半就關、視窗改變大小都會回到正確位置；書脊若已被篩掉，改為原地沉沒消失。

## 翻頁

- 2 張書頁，各有正反兩面（`backface-visibility: hidden`）。未翻的頁疊在封面下、翻過的頁蓋在打開的封面上，`translateZ` 隨翻頁進度從 `t/2` 以下移到以上，確保遮擋順序正確。
- 頁面立起時以 `sin()` 加深陰影。翻頁中忽略新的翻頁指令，確保每次翻頁完整結束。
- 所有實質資訊都放在右頁，手機單頁模式也看得到。

## 取捨

- 未採用 `page-flip`／StPageFlip：2 張 CSS 3D 書頁已滿足需求，避免與 React 搶 DOM 所有權。
- 連結與按鈕放在 2D 控制列，不放在 3D 頁面中，避免各引擎在 3D 命中測試上的差異。
- Playwright 內建 WebKit 不渲染 CSS 3D，Safari 只能手動驗收。
