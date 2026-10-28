/* ============================================================================
 * js/boot.js — 啟動：還原花朵、套用語言與載入畫面
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・依存檔把已有的花種回花園、套用語言（applyLang）、顯示首頁、設定天氣與日
 *     夜（applyTime）。
 *   ・載入畫面：預先載入音檔並顯示進度，完成後出現「進入花園」按鈕（點擊同時
 *     取得瀏覽器允許播放聲音的使用者手勢）。
 *   ・這是核心功能的最後一個檔案；之後載入的是各座小島與雲端同步等獨立功能。
 *
 * 需要先載入：audio.js、state.js、icons.js、i18n.js、world.js、
 *   flower-care.js、garden-scene.js、weather.js、ui-shell.js、views.js
 * 提供給其他檔案：closeOb、pillReady
 * 載入順序：第 24 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- boot ---------- */
if (ok) ents().forEach(([d]) => addFlower(d, 1));
$('obc').innerHTML = ['happy', 'calm', 'loved', 'sad'].map(k => `<span>${face(k,22)} ${M[k].n}</span>`).join('');
document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-label', b.lastChild.textContent.trim()));
const closeOb = () => {
  $('ob').hidden = true;
  S.ob = 1;
  save()
};
$('go').onclick = () => {
  closeOb();
  openModal()
};
$('skip').onclick = closeOb;
if (S.ob) $('ob').hidden = true;
applyLang();
show('garden');
window.pillReady = true;
setWeather(curWx(), true);
if (window.applyTime) {
  applyTime();
  setInterval(() => {
    if (!SLP.on) applyTime()
  }, 30000)
}
(() => {
  const ld = $('ld'),
    m = $('ldm'),
    bar = document.querySelector('.ldb'),
    msgs = tr('ld'),
    t0 = Date.now();
  let i = 0,
    ready = false,
    gone = false;
  const say = () => {
    m.textContent = msgs[i++ % msgs.length]
  };
  say();
  const tm = setInterval(say, 2600),
    sk = setTimeout(() => done(), 20000); /* 音檔載入太久也不要卡住：20 秒後直接顯示「進入花園」 */
  /* 點擊「進入花園」= 使用者手勢，瀏覽器才允許播放音效與背景音 */
  const enter = () => {
    if (gone) return;
    gone = true;
    clearInterval(tm);
    clearTimeout(sk);
    ld.classList.add('out');
    setTimeout(() => {
      ld.hidden = true
    }, 500)
  };
  const done = () => {
    if (ready || gone) return;
    ready = true;
    clearInterval(tm);
    clearTimeout(sk);
    setTimeout(() => {
      if (gone) return;
      m.textContent = tr('ldReady');
      bar.hidden = true;
      $('lde').hidden = false;
      $('lde').focus({
        preventScroll: true
      })
    }, Math.max(0, 900 - (Date.now() - t0)))
  };
  $('lde').onclick = enter;
  sndPreload((d, n) => {
    bar.firstElementChild.style.width = (d / n * 100) + '%'
  }).then(done, done);
})();
