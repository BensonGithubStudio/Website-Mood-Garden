/* ============================================================================
 * js/pwa.js — 註冊 Service Worker（離線與更新）
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・網頁載入完成後註冊 sw.js；每次頁面重新可見時檢查有沒有新版本。快取策略
 *     寫在 sw.js。
 *
 * 需要先載入：（無，獨立檔案）
 * 載入順序：第 32 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update();
        });
      })
      .catch(() => {});
  });
}
