/* ============================================================================
 * js/nickname.js — 你的名字：載入畫面詢問、左上角問候、名字視窗
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・載入畫面（#ld）：如果「本機沒有存過名字」而且「Google 帳號也沒有名字（或沒
 *     登入）」，在「進入花園」按鈕上方多一個輸入欄詢問名字；可以留空略過。
 *   ・左上角 .logo 原本顯示「Mood Garden」；有名字時改成「Hi, 名字」／「哈囉~
 *     名字」（依語言），名字太長時只在文字內用 … 截斷，不會把元件拉長。
 *   ・點 .logo 會開啟名字視窗（#nmo）：顯示完整名字與「更改名字」按鈕；沒有名字
 *     時直接進入輸入狀態。視窗沿用 .scrim／.sheet 的 Liquid Glass 樣式。
 *   ・名字存在 S.nm = {v:名字, u:更新時間}。顯示優先順序：自己設定的名字（S.nm）
 *     → Google 帳號名稱 → 「Mood Garden」。
 *   ・雲端同步：存檔時 save() 會通知 cloud.dirty()；cloud.js 的 sync() 以「更新時
 *     間較新者勝」合併 garden.json 裡的 n 欄位（見 cloud.js 的「名字」區塊）。
 *
 * 需要先載入：state.js、icons.js、i18n.js（含 locales）、ui-shell.js、views.js、
 *   boot.js、cloud.js
 * 提供給其他檔案：NM（paint、name、open、isOpen）
 * 載入順序：第 32 個（共 33 個），在 animal-home.js 之後、pwa.js 之前。
 *   順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

window.NM = (() => {
  const MAX = 40,
    BRAND = 'Mood Garden';
  const logo = $('logo'),
    lgt = $('lgt');
  if (!logo || !lgt) return {
    paint() {},
    name: () => '',
    open() {},
    isOpen: () => false
  };

  /* ---------- 名字 ---------- */
  const clean = v => [...String(v || '').replace(/\s+/g, ' ').trim()].slice(0, MAX).join(''),
    own = () => (S.nm && S.nm.v) || '',
    gname = () => String((window.cloud && cloud.user && cloud.user.name) || '').trim(),
    name = () => own() || gname(),
    signed = () => !!(window.cloud && cloud.user);

  /* 寫入名字：回傳是否真的有變更；save() 會一併通知雲端同步 */
  function commit(v) {
    v = clean(v);
    if (!v || v === name()) return false;
    S.nm = {
      v,
      u: Date.now()
    };
    save();
    paint();
    return true
  }

  /* ---------- 名字視窗 ---------- */
  document.body.insertAdjacentHTML('beforeend', `<div class="scrim" id="nmo" hidden><div class="sheet nms" id="nmd" role="dialog" aria-modal="true" aria-labelledby="nmh"><h2 id="nmh"></h2><div class="nmv" id="nmv"></div><input class="nmi" id="nmi" type="text" maxlength="${MAX}" autocomplete="off" enterkeyhint="done" spellcheck="false" hidden><p class="nmn" id="nmn"></p><div class="nmf"><button class="btn p" id="nmc"></button><button class="btn" id="nmx"></button></div></div></div>`);
  const $o = $('nmo'),
    $h = $('nmh'),
    $v = $('nmv'),
    $i = $('nmi'),
    $n = $('nmn'),
    $c = $('nmc'),
    $x = $('nmx');
  let editing = false,
    prev = null;
  const isOpen = () => !$o.hidden;

  function render() {
    const n = name();
    $h.innerHTML = ic('account_circle') + ' ' + esc(editing ? tr(n ? 'nmChg' : 'nmAsk') : tr('nmT'));
    $v.hidden = editing || !n;
    $v.textContent = n;
    $i.hidden = !editing;
    $i.placeholder = tr('nmPh');
    $n.textContent = tr(signed() ? 'nmHintC' : 'nmHintL');
    $c.textContent = tr(editing ? 'nmSave' : 'nmChg');
    $c.disabled = editing && !clean($i.value);
    $x.textContent = tr(editing && n ? 'cancel' : 'close')
  }

  function startEdit() {
    editing = true;
    $i.value = name();
    render();
    $i.focus();
    $i.select()
  }

  function close() {
    if ($o.hidden) return;
    $o.hidden = true;
    editing = false;
    if (prev && prev.focus) prev.focus({
      preventScroll: true
    });
    prev = null
  }

  function open() {
    if (!$o.hidden) return;
    prev = document.activeElement;
    $o.hidden = false;
    if (name()) {
      editing = false;
      render();
      $c.focus({
        preventScroll: true
      })
    } else startEdit()
  }

  function save1() {
    if ($c.disabled) return;
    const ch = commit($i.value);
    if (ch) toast(esc(tr(signed() ? 'nmSavedC' : 'nmSaved')));
    editing = false;
    render();
    $c.focus({
      preventScroll: true
    })
  }
  $c.onclick = () => editing ? save1() : startEdit();
  $x.onclick = () => {
    if (editing && name()) {
      editing = false;
      render()
    } else close()
  };
  $i.addEventListener('input', () => {
    $c.disabled = !clean($i.value)
  });
  $i.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    save1()
  });
  $o.addEventListener('click', e => {
    if (e.target === $o) close()
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || $o.hidden) return;
    if (editing && name()) {
      editing = false;
      render()
    } else close()
  });

  /* ---------- 左上角 logo ---------- */
  logo.setAttribute('role', 'button');
  logo.tabIndex = 0;
  logo.addEventListener('click', open);
  logo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open()
    }
  });

  /* ---------- 載入畫面的詢問欄 ---------- */
  const lde = $('lde');
  let box = null,
    lin = null;
  if ($('ld') && lde && !name()) {
    box = document.createElement('div');
    box.id = 'ldn';
    box.innerHTML = `<label id="ldnl" for="ldni"></label><input id="ldni" type="text" maxlength="${MAX}" autocomplete="off" enterkeyhint="done" spellcheck="false">`;
    lde.parentNode.insertBefore(box, lde);
    lin = $('ldni');
    lin.addEventListener('change', () => commit(lin.value));
    lin.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      commit(lin.value);
      if (!lde.hidden) lde.click();
      else lin.blur()
    });
    lde.addEventListener('click', () => commit(lin.value));
    /* 載入完成時 boot.js 會把焦點移到「進入花園」；如果使用者正在打字，就把焦點還給輸入欄 */
    let bt = 0,
      bto = null;
    lin.addEventListener('blur', e => {
      bt = performance.now();
      bto = e.relatedTarget
    });
    new MutationObserver(() => {
      if (!lde.hidden && bto === lde && performance.now() - bt < 200) lin.focus({
        preventScroll: true
      });
      bto = null
    }).observe(lde, {
      attributes: true,
      attributeFilter: ['hidden']
    })
  }

  /* ---------- 重繪（語言、登入狀態、雲端來的新名字都會呼叫） ---------- */
  function paint() {
    const n = name(),
      t = n ? tr('nmHi', n) : BRAND;
    logo.classList.toggle('nm', !!n);
    if (lgt.textContent !== t) lgt.textContent = t;
    logo.title = n;
    logo.setAttribute('aria-label', n ? tr('nmT') + ': ' + n : tr('nmAsk'));
    if (box) {
      $('ldnl').textContent = tr('nmAsk');
      lin.placeholder = tr('nmPh');
      /* 雲端剛好帶來名字、而且使用者還沒打字：不用再問了 */
      if (S.nm && !lin.value) box.hidden = true
    }
    if (!$o.hidden) render()
  }

  /* 雲端狀態改變（登入、登出、同步完成）時，Google 名稱可能變了，跟著更新 */
  if (window.cloud && typeof cloud.paint === 'function') {
    const p0 = cloud.paint;
    cloud.paint = function() {
      const r = p0.apply(this, arguments);
      try {
        paint()
      } catch (e) {
        logErr(e)
      }
      return r
    }
  }
  paint();
  return {
    paint,
    name,
    open,
    isOpen
  }
})();
