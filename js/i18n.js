/* ============================================================================
 * js/i18n.js — 多語系：語言註冊表與翻譯 API
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・LANGS 是語言註冊表：每種語言一列（代碼、選單顯示名稱、日期 locale、
 *     <html lang>、地名查詢語言、瀏覽器語言偵測規則、回退順序、是否啟用）。
 *   ・新增語言（例如簡體中文 zh-CN，已預留但停用）只需：1) 把 LANGS 對應列的
 *     enabled:false 拿掉  2) 新增 js/locales/xx.js  3) 在 index.html 加一行載
 *     入。
 *   ・I18N 提供 add（登錄翻譯）、tr（取文字，缺漏時依回退鏈 zh-CN→zh→en 並
 *     警告一次）、pick（挑選 {語言:資料} 物件）、detect（偵測瀏覽器語言）、
 *     audit（對照英文找缺漏）。
 *   ・tr／LC／applyLang 是全站使用的三個入口：翻譯、日期 locale、把畫面上所有
 *     data-t 文字換成目前語言。
 *   ・字典本身放在 js/locales/；各功能自己的文字（禮物、星願島…）仍放在該功
 *     能的檔案裡，靠 I18N.add 併入。
 *
 * 需要先載入：log.js、state.js、icons.js
 * 提供給其他檔案：L、LANGS、I18N、tr、LC、applyLang
 * 載入順序：第 5 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const L = {}; /* 各語言的字典由 js/locales/*.js 填入（見 I18N.add） */
/* ---------- 語言註冊表 / I18N ----------
 * 新增語言：1) 在 LANGS 加一列（enabled:true 才會出現在選單與自動偵測）
 *          2) 補齊翻譯：I18N.add('代碼',{...})、GNOTES / DECOR 的 n 欄位加同代碼
 * 缺漏的 key 會依 fb 順序回退（例：zh-CN → zh → en），並在 console 警告一次。
 * 注意：'zh' 是繁體中文，也是既有存檔使用的代碼，請勿更名。 */
const LANGS = [{
    code: 'en',
    label: 'English',
    locale: 'en',
    html: 'en',
    geo: 'en',
    match: /^en/i,
    fb: []
  },
  {
    code: 'zh-CN',
    label: '简体中文',
    locale: 'zh-CN',
    html: 'zh-Hans',
    geo: 'zh',
    match: /^zh(-cn|-sg|-hans)/i,
    fb: ['zh'],
    enabled: false
  }, /* 預留：尚未提供翻譯 */
  {
    code: 'zh',
    label: '繁體中文',
    locale: 'zh-TW',
    html: 'zh-Hant',
    geo: 'zh',
    match: /^zh/i,
    fb: []
  },
  {
    code: 'ja',
    label: '日本語',
    locale: 'ja',
    html: 'ja',
    geo: 'ja',
    match: /^ja/i,
    fb: []
  },
  {
    code: 'ko',
    label: '한국어',
    locale: 'ko',
    html: 'ko',
    geo: 'ko',
    match: /^ko/i,
    fb: []
  }
];
const I18N = (() => {
  const on = () => LANGS.filter(l => l.enabled !== false),
    info = c => LANGS.find(l => l.code === c) || LANGS[0],
    warned = new Set(),
    warn = (c, k) => {
      const id = c + ':' + k;
      if (!warned.has(id)) {
        warned.add(id);
        console.warn('[i18n] missing "' + k + '" for ' + c)
      }
    },
    chain = c => [c, ...info(c).fb, 'en'].filter((x, i, a) => a.indexOf(x) == i);
  return {
    list: on,
    info,
    add(c, o) {
      L[c] = Object.assign(L[c] || {}, o)
    },
    detect() {
      const n = (navigator.language || 'en').toLowerCase(),
        l = on().find(l => l.match.test(n));
      return (l || LANGS[0]).code
    },
    /* 取得 {code:value} 形式的資料（GNOTES、DECOR.n 等），依回退鏈挑選 */
    pick(o) {
      for (const c of chain(S.lang))
        if (o && o[c] != null) return o[c];
      return undefined
    },
    tr(k, ...a) {
      let v;
      for (const c of chain(S.lang)) {
        v = L[c] && L[c][k];
        if (v !== undefined) {
          if (c !== S.lang && S.lang in L) warn(S.lang, k);
          break
        }
      }
      return typeof v == 'function' ? v(...a) : v
    },
    /* 對照 en 找出各語言缺少的 key（開發用：console 輸入 I18N.audit()） */
    audit() {
      const r = {};
      on().forEach(l => {
        if (l.code == 'en') return;
        const m = Object.keys(L.en).filter(k => !(k in (L[l.code] || {})));
        if (m.length) {
          r[l.code] = m;
          console.warn('[i18n] ' + l.code + ' 缺少 ' + m.length + ' 個 key', m)
        }
      });
      return r
    }
  }
})();
if (!S.lang || !I18N.list().some(l => l.code === S.lang)) S.lang = I18N.detect();

function tr(k, ...a) {
  return I18N.tr(k, ...a)
}

function LC() {
  return I18N.info(S.lang).locale
}

function applyLang() {
  document.documentElement.lang = I18N.info(S.lang).html;
  Object.keys(M).forEach((k, i) => {
    M[k].n = tr('m')[i];
    M[k].f = tr('f')[i]
  });
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = tr(e.dataset.t));
  document.querySelectorAll('nav button').forEach(b => {
    const n = tr('n_' + b.dataset.v);
    b.lastChild.textContent = ' ' + n;
    b.setAttribute('aria-label', n);
    b.title = n
  });
  $('txt').placeholder = tr('ph');
  $('obc').innerHTML = ['happy', 'calm', 'loved', 'sad'].map(k => `<span>${face(k,22)} ${M[k].n}</span>`).join('');
  refresh();
  const v = document.body.dataset.v;
  if (v == 'cal') renderCal();
  if (v == 'ins') renderIns();
  if (v == 'set') renderSet();
  movePill(false)
}

/* 開發用：頁面載入後對照英文找出各語言缺漏的 key（會印在 console） */
window.addEventListener('load', () => {
  try {
    I18N.audit()
  } catch (e) {
    logErr(e)
  }
});
