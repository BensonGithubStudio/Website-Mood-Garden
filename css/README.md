# 情緒花園 樣式結構

原本寫在 `index.html` 裡的單一 `<style>`（約 2,100 行）依**原本的順序**拆成下列檔案，由 `index.html` 的 `<link rel="stylesheet">` 依序載入。
CSS 的規則是「同權重時，後面的蓋過前面的」，所以拆檔時完全沒有調動任何規則的順序，只是在規則之間切開。

| # | 檔案 | 內容 |
|---|------|------|
| 1 | `base.css` | 基礎：色彩變數、重設、字型與畫布 |
| 2 | `hud.css` | 首頁介面：毛玻璃底、頂部列、問候卡、按鈕與底部選單 |
| 3 | `panel.css` | 分頁面板：月曆／統計／設定共用的浮出面板 |
| 4 | `components.css` | 共用元件：月曆、統計長條、列、按鈕 |
| 5 | `modal.css` | 對話框：遮罩、記錄心情視窗、心情選擇與標籤 |
| 6 | `card-toast.css` | 花朵詳情卡與提示訊息 |
| 7 | `onboarding.css` | 首次進站的歡迎畫面與無 WebGL 備援 |
| 8 | `icons-touch.css` | 圖示字型、觸控與選取行為、緊湊選單 |
| 9 | `loader.css` | 載入畫面 |
| 10 | `settings.css` | 設定面板 |
| 11 | `sync-gifts.css` | 帳號與雲端同步按鈕、禮物紙條視窗 |
| 12 | `gift-dex.css` | 小禮物圖鑑 |
| 13 | `bottom-buttons.css` | 底部按鈕版位（記錄心情／佈置花園／小禮物） |
| 14 | `sleep.css` | 睡眠模式畫面與手機問候卡微調 |
| 15 | `liquid-glass.css` | Liquid Glass 主題（毛玻璃質感與詳情卡尺寸） |
| 16 | `quality.css` | 畫質檔位覆蓋（中／低） |

每個檔案開頭的註解寫了：這份檔案在做什麼、哪些程式會用到這裡的 class／id、有哪些選擇器覆蓋了前面檔案的設定。

## 修改時要注意

1. **不要調換 `index.html` 裡 link 的順序**。後面的檔案（尤其是 `liquid-glass.css`、`quality.css`）是刻意放後面來覆蓋前面的。
2. 同一個元件的規則可能分散在多個檔案（例如底部選單 `nav` 在 `hud.css`、`icons-touch.css`、`bottom-buttons.css` 都有調整）。要改外觀時，請搜尋該選擇器出現的所有檔案，最後一個定義通常才是實際生效的。
3. 新增、改名或刪除 css 檔時，同步修改 `index.html` 的 link 清單與 `sw.js` 的 `PRECACHE` 清單。
4. 小島（河流、回憶、凋零、星願、小動物之家）各自的樣式仍寫在對應的 `js/*.js` 裡（由程式在載入時注入），沒有搬到這裡；上面的 `quality.css` 只負責覆蓋它們在不同畫質下的毛玻璃。
