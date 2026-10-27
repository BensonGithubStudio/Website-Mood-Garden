# 情緒花園 程式碼結構

所有 JS 都是「一般的 classic script」（不是 ES module），由 `index.html` 依下表順序載入。
它們**共用同一個全域範圍**，所以檔案之間可以直接呼叫對方的函式與變數（跟拆檔前放在同一個 `<script>` 裡完全一樣）。

## 載入順序

| # | 檔案 | 內容 |
|---|------|------|
| 1 | `log.js` | 統一錯誤記錄 |
| 2 | `audio.js` | 音效與環境音系統 |
| 3 | `state.js` | 全域狀態、心情定義與本機存檔 |
| 4 | `icons.js` | 日期工具與 SVG 圖示 |
| 5 | `i18n.js` | 多語系：語言註冊表與翻譯 API |
| 6 | `locales/en.js` | 語言字典：English 英文 |
| 7 | `locales/zh.js` | 語言字典：繁體中文（代碼 zh，既有存檔使用的代碼，請勿更名） |
| 8 | `locales/ja.js` | 語言字典：日本語 日文 |
| 9 | `locales/ko.js` | 語言字典：한국어 韓文 |
| 10 | `world.js` | 3D 世界基礎：渲染器、場景、雙花園幾何 |
| 11 | `three-utils.js` | three.js 小工具：共用材質與形狀 |
| 12 | `flowers.js` | 花朵模型、成長階段與凋零 |
| 13 | `flower-care.js` | 澆水、凋零動畫、鏟除與種花位置 |
| 14 | `garden-scene.js` | 建造花園場景 |
| 15 | `camera.js` | 鏡頭、畫質與首頁視角 |
| 16 | `creatures.js` | 花園裡的小動物與佈置模式的滑動 |
| 17 | `weather.js` | 天氣系統 |
| 18 | `particles.js` | 粒子特效與小動物互動 |
| 19 | `gifts.js` | 小動物的禮物：紙條與裝飾品 |
| 20 | `loop.js` | 花朵拖曳、邊緣捲動與每幀主迴圈 |
| 21 | `input.js` | 畫面操作：點選、拖曳、縮放、平移 |
| 22 | `ui-shell.js` | 介面骨架：提示、對話框、面板與睡眠模式 |
| 23 | `views.js` | 主要畫面：首頁、記錄視窗、月曆、統計與設定 |
| 24 | `boot.js` | 啟動：還原花朵、套用語言與載入畫面 |
| 25 | `skin.js` | 材質與貼圖層（只換外觀） |
| 26 | `cloud.js` | 雲端同步（Google 登入 + 雲端硬碟 App 資料夾） |
| 27 | `river.js` | 河流休息區（寫一片葉子放進河裡） |
| 28 | `memory.js` | 回憶小島與佈告欄 |
| 29 | `withered-island.js` | 凋零小島 |
| 30 | `wish.js` | 星願島 |
| 31 | `animal-home.js` | 小動物之家（第五座小島） |
| 32 | `pwa.js` | 註冊 Service Worker（離線與更新） |

每個檔案開頭的註解都寫了：這份檔案在做什麼、需要先載入哪些檔案、提供哪些函式給其他檔案。

## 修改時要注意

1. **不要調換 `index.html` 裡 script 的順序。** 前面的檔案在載入當下就會用到更前面檔案的內容；而核心檔案之間是刻意緊密相連的（互相呼叫的函式靠「載入完成後才執行」運作）。
2. **新增、改名或刪除 js 檔時**：同步修改 `index.html` 的 script 清單，以及 `sw.js` 的 `PRECACHE` 清單（沒列到也能運作，只是第一次離線開啟會缺檔）。
3. **新增語言**：
   - 在 `js/i18n.js` 的 `LANGS` 加一列（簡體中文 `zh-CN` 已預留，把 `enabled:false` 拿掉即可）。
   - 新增 `js/locales/xx.js`（照 `locales/en.js` 的格式，用 `I18N.add`）。
   - 各功能檔案裡的 `GNOTES`、裝飾品名稱（`DECOR` 的 `n`）、禮物文字也補上同一個代碼；沒補到的會依回退鏈顯示。
   - 在 `index.html` 的 locales 區加一行 script。
   - console 輸入 `I18N.audit()` 可檢查缺漏的 key。
4. **除錯**：console 輸入 `__errs` 可看到被記錄的錯誤（同一則只記一次）。
5. 瀏覽器裡的錯誤行號現在會對應到各自的檔案，比過去單一大檔好找。
