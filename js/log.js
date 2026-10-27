/* ============================================================================
 * js/log.js — 統一錯誤記錄
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・提供 logErr(e)：取代過去「catch(e){}」把錯誤吞掉的寫法。
 *   ・同一則錯誤訊息只會印一次、最多記 40 則（避免每一幀重複洗版）；在
 *     console 輸入 __errs 可查看。
 *   ・這是最先載入的檔案，其他所有檔案都可以直接呼叫 logErr。
 *
 * 需要先載入：（無，獨立檔案）
 * 提供給其他檔案：logErr
 * 載入順序：第 1 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* 統一錯誤記錄：原本許多空的 catch 會把錯誤吞掉。現在改記到 console（同一則訊息只印一次，最多 40 則，避免每幀重複洗版）。
   可在 console 輸入 __errs 查看累積的錯誤。 */
const __errs = [];

function logErr(e) {
  try {
    const m = String(e && e.stack || e).split('\n').slice(0, 2).join(' @ ');
    if (__errs.includes(m) || __errs.length >= 40) return;
    __errs.push(m);
    console.warn('[mg]', m)
  } catch (_) {}
}
/* 停用整頁縮放（花園本身的縮放不受影響） */
(function() {
  const stop = e => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, stop, {
    passive: false
  }));
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 1) e.preventDefault()
  }, {
    passive: false
  });
  document.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault()
  }, {
    passive: false,
    capture: true
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault()
  }, true);
  document.addEventListener('dblclick', e => {
    if (!/^(TEXTAREA|INPUT)$/.test(e.target.tagName)) e.preventDefault()
  }, true);
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!/^(TEXTAREA|INPUT)$/.test((document.activeElement || {}).tagName)) scrollTo(0, 0)
  }, 60));
})();
