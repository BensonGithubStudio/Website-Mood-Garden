/* ============================================================================
 * js/hello-card.js — 手機版問候面板（.hello）的展開／收合控制
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼（只在手機版寬度 759px 以下有作用，樣式見 css/hello.css）：
 *   ・預設收合，只顯示標題一行。
 *   ・面板內容有變動（標題、花朵數、本月心情、天氣、小動物之家狀態）時自動展開，
 *     5 秒後自動收合。進站載入畫面還在的時候不算變動。
 *   ・點擊面板：收合 → 展開並固定；自動展開中 → 固定（不再自動收合）；
 *     已固定 → 收合。
 *   ・固定展開後，使用者操作面板以外的任何東西（點花園、按鈕、選單…）或按 Esc，
 *     就會收合；不操作就一直展開。
 *   ・用 MutationObserver 監看內容，不需要改動 refresh() 或其他模組。
 *
 * 需要先載入：boot.js（#ld）、views.js（refresh）
 * 載入順序：第 33 個（共 34 個），在 nickname.js 之後、pwa.js 之前。
 *   順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

(() => {
  const el = document.querySelector('.hello'),
    h = $('hi');
  if (!el || !h) return;
  const mq = matchMedia('(max-width:759px)'),
    AUTO = 5000;
  let sig = '',
    timer = 0,
    pinned = false;
  const isEx = () => el.classList.contains('ex'),
    sigOf = () => ['hi', 'cnt', 'mon', 'wxc', 'hoc'].map(id => {
      const n = $(id);
      return !n || n.hidden ? '' : n.textContent
    }).join('|'),
    loading = () => {
      const ld = $('ld');
      return !!ld && !ld.hidden && !ld.classList.contains('out')
    },
    a11y = () => {
      if (mq.matches) {
        h.setAttribute('role', 'button');
        h.tabIndex = 0;
        h.setAttribute('aria-expanded', String(isEx()))
      } else {
        h.removeAttribute('role');
        h.removeAttribute('tabindex');
        h.removeAttribute('aria-expanded')
      }
    };

  function expand() {
    el.classList.add('ex');
    a11y()
  }

  function collapse() {
    clearTimeout(timer);
    pinned = false;
    el.classList.remove('ex');
    a11y()
  }

  /* 內容變動：展開，5 秒後收合（已固定展開的話就維持展開） */
  new MutationObserver(() => {
    const s = sigOf();
    if (s === sig) return;
    const first = !sig;
    sig = s;
    if (first || loading() || document.body.dataset.v !== 'garden') return;
    expand();
    if (!pinned) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!pinned) collapse()
      }, AUTO)
    }
  }).observe(el, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['hidden']
  });

  function toggle() {
    if (!mq.matches) return;
    if (isEx() && pinned) collapse();
    else {
      clearTimeout(timer);
      pinned = true;
      expand()
    }
  }
  el.addEventListener('click', e => {
    if (e.target.closest('#hoc')) return;
    toggle()
  });
  h.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle()
    }
  });

  /* 固定展開後：操作面板以外的任何東西就收合（點小動物之家標籤也算操作） */
  document.addEventListener('pointerdown', e => {
    if (!pinned) return;
    if (el.contains(e.target) && !e.target.closest('#hoc')) return;
    collapse()
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pinned) collapse()
  });
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => {
    if (!mq.matches) collapse();
    a11y()
  });
  sig = sigOf();
  a11y()
})();
