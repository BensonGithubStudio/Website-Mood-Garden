/* ============================================================================
 * js/ui-shell.js — 介面骨架：提示、對話框、面板與睡眠模式
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・toast（提示訊息）、ask（確認對話框）、導覽列的動畫指示（movePill）、面
 *     板開關動畫（setPanel）。
 *   ・睡眠模式（sleepOn／sleepOff）：停用動畫、只留背景聲；切換主畫面（show）
 *     與導覽列按鈕行為。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、
 *   garden-scene.js、camera.js、creatures.js
 * 提供給其他檔案：toast、ask、movePill、setPanel、sleepOn、sleepOff、show
 * 載入順序：第 22 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- UI ---------- */
function toast(m) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = ic('local_florist') + ' ' + m;
  document.body.append(t);
  setTimeout(() => t.remove(), 3700)
}

function ask(msg, yes) {
  return new Promise(r => {
    $('dm').textContent = msg;
    $('dy').textContent = yes || tr('confirm');
    $('dlg').hidden = false;
    $('dy').onclick = () => {
      $('dlg').hidden = true;
      r(1)
    };
    $('dn').onclick = () => {
      $('dlg').hidden = true;
      r(0)
    }
  })
}

function movePill(anim) {
  const b = document.querySelector('nav button[aria-current=true]'),
    p = $('pill');
  if (!b) return;
  p.style.transition = anim ? '' : 'none';
  p.style.width = b.offsetWidth + 'px';
  p.style.transform = 'translateX(' + b.offsetLeft + 'px)'
}
addEventListener('resize', () => movePill(false));
if (document.fonts) document.fonts.ready.then(() => movePill(false));
/* 面板開關：進場先取消 hidden、強制重排後加上 .in 觸發過渡；離場先移除 .in，動畫結束才真正 hidden */
function setPanel(p, on, v) {
  clearTimeout(p._t);
  if (on) {
    if (!p.classList.contains('in')) {
      p.hidden = false;
      /* 先在「沒有任何變形」的狀態量出面板的版面位置，把縮放的原點設在被點的選單按鈕中心，面板就會從按鈕長出來、也縮回按鈕 */
      const s = p.style;
      s.transition = 'none';
      s.translate = 'none';
      s.scale = 'none';
      s.transform = 'none';
      const r = p.getBoundingClientRect(),
        b = document.querySelector('nav button[data-v=' + v + ']');
      if (b) {
        const q = b.getBoundingClientRect();
        s.setProperty('--ox', (q.left + q.width / 2 - r.left) + 'px');
        s.setProperty('--oy', (q.top + q.height / 2 - r.top) + 'px')
      }
      /* 還原變形時要先保持「無過渡」，否則 scale 會從 none 開始往 .12 過渡，之後的進場動畫就被它吃掉 */
      s.translate = s.scale = s.transform = '';
      void p.offsetWidth;
      s.transition = '';
      void p.offsetWidth
    }
    p.classList.add('in')
  } else {
    if (p.hidden) return;
    p.classList.remove('in');
    p._t = setTimeout(() => {
      p.hidden = true
    }, S.rm ? 170 : 300)
  }
}
/* ---------- 睡眠模式 ---------- */
function sleepOn() {
  if (SLP.on) return;
  SLP.on = true;
  $('card').hidden = true;
  document.body.classList.add('sleeping');
  $('sl').hidden = false;
  sndUnlocked = true;
  ambApply();
  $('slw').focus({
    preventScroll: true
  })
}

function sleepOff() {
  if (!SLP.on) return;
  SLP.on = false;
  document.body.classList.remove('sleeping');
  $('sl').hidden = true;
  slStop();
  try {
    if (AC && AC.state === 'suspended') AC.resume()
  } catch (e) {
    logErr(e)
  }
  ambApply();
  SLP.cbs.forEach(f => {
    try {
      f()
    } catch (e) {
      logErr(e)
    }
  });
  if (window.applyTime) applyTime();
  resize();
  movePill(false);
  refresh();
  try {
    cloud.wake()
  } catch (e) {
    logErr(e)
  }
}
$('slw').onclick = sleepOff;

function show(v) {
  if (v != 'garden' && arrange) setArrange(false);
  document.body.classList.toggle('rm', !!S.rm);
  document.body.dataset.v = v;
  document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-current', b.dataset.v == v));
  movePill(window.pillReady);
  ['cal', 'ins', 'set'].forEach(x => setPanel($('p-' + x), x == v, x));
  $('card').hidden = true;
  if (v == 'cal') renderCal();
  if (v == 'ins') renderIns();
  if (v == 'set') renderSet();
  if (v == 'garden') refresh()
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.v));
/* 選單 bar 彈跳動畫：只在使用者真正點選（按下並在同一顆按鈕上放開，觸發 click；鍵盤 Enter/Space 也算）後才播放，固定播完整段 */
(function() {
  const nv = document.querySelector('nav');
  if (!nv) return;
  /* 用 Web Animations API：每次點擊疊加一段新的動畫，既有動畫不會被取消或重置 */
  const T = 'translateX(-50%) ',
    mq = window.matchMedia ? matchMedia('(prefers-reduced-motion:reduce)') : null;

  function pop() {
    if (S.rm || (mq && mq.matches) || !nv.animate) return;
    /* 時長讀 CSS 的 --nav-pop-dur，與滑塊（#pill）的參數集中在 hud.css 一起調整 */
    const cs = getComputedStyle(nv),
      d = parseFloat(cs.getPropertyValue('--nav-pop-dur')) || 640;
    let cur = 1;
    try {
      cur = new DOMMatrix(cs.transform).a || 1
    } catch (e) {}
    /* 每一段各自指定緩動，峰值（36%）對上滑塊抵達目標的時刻；起點用「當下的縮放值」，快速連點不會跳回原點 */
    nv.animate([{
      transform: T + 'scale(' + cur + ')',
      offset: 0,
      easing: 'cubic-bezier(.2,.8,.3,1)'
    }, {
      transform: T + 'scale(1.04)',
      offset: .36,
      easing: 'cubic-bezier(.4,0,.3,1)'
    }, {
      transform: T + 'scale(.992)',
      offset: .68,
      easing: 'cubic-bezier(.4,0,.3,1)'
    }, {
      transform: T + 'scale(1)',
      offset: 1
    }], {
      duration: d,
      easing: 'linear'
    })
  }
  nv.addEventListener('click', e => {
    if (e.target.closest('button')) pop()
  })
})();

/* 觸控：iOS Safari 需要有 touchstart 監聽，按鈕的 :active（按壓動畫）才會在按下瞬間生效 */
document.addEventListener('touchstart', () => {}, {
  passive: true
});
