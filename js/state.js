/* ============================================================================
 * js/state.js — 全域狀態、心情定義與本機存檔
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・定義最基本的工具（$ 取元素、esc 跳脫 HTML）、六種心情 M（名稱／表情／顏
 *     色／對應的花）、標籤 TAGS，以及存檔的 KEY。
 *   ・從 localStorage 讀出整份狀態 S，並依 SCHEMA 做存檔版本遷移（升級前先備
 *     份到 KEY+".bak"）。
 *   ・提供 save()／persistState()：寫入本機並通知雲端同步；每朵花帶更新時間
 *     u、刪除記在墓碑 S.del／S.wdel（永久保留，確保已刪除的花不會復活）。
 *   ・星願島的花（S.w）使用同一套規則（wStamp／wApply／wDrop／wClear）。
 *
 * 需要先載入：log.js
 * 提供給其他檔案：$、esc、M、TAGS、KEY、S、SCHEMA、MIGRATIONS、wStamp、
 *   wApply、wDrop、wClear、persistState、save
 * 載入順序：第 3 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const $ = id => document.getElementById(id),
  esc = s => String(s).replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  } [c]));
const M = {
  happy: {
    n: 'Happy',
    e: '😊',
    c: '#F5D04A',
    f: 'Sunflower',
    i: '🌻'
  },
  excited: {
    n: 'Excited',
    e: '🤩',
    c: '#F6A35C',
    f: 'Tulip',
    i: '🌷'
  },
  calm: {
    n: 'Calm',
    e: '😌',
    c: '#A9D8A8',
    f: 'Daisy',
    i: '🌼'
  },
  loved: {
    n: 'Loved',
    e: '🥰',
    c: '#F29BB5',
    f: 'Rose',
    i: '🌹'
  },
  sad: {
    n: 'Sad',
    e: '😢',
    c: '#8DB9E8',
    f: 'Bluebell',
    i: '🔔'
  },
  anxious: {
    n: 'Anxious',
    e: '😰',
    c: '#B7A2E0',
    f: 'Lavender',
    i: '🪻'
  }
};
const TAGS = ['Work', 'Study', 'Friends', 'Family', 'Travel', 'Personal'],
  KEY = 'moodgarden.v1';
let S = {};
try {
  S = JSON.parse(localStorage.getItem(KEY)) || {}
} catch (e) {
  logErr(e)
}
/* ---------- 存檔版本與遷移 ----------
 * S.v 是存檔結構版本。日後要改資料結構時：SCHEMA 加 1，並在 MIGRATIONS 加一個「從舊版升上來」的函式（key = 舊版號）。
 * 沒有 v 的舊存檔視為 v1。升級前會先把原始資料備份到 KEY+'.bak'，出問題時可以還原。
 * 若讀到比本程式更新的版本（例如開了舊版頁面），不做降級也不改寫 v，只記錄警告。 */
const SCHEMA = 2,
  MIGRATIONS = {
    1: s => {
      s.e = s.e || {};
      s.del = s.del || {};
      s.w = s.w || {};
      s.wdel = s.wdel || {}
    } // v1→v2：補齊各容器（內容語意不變）
  };
(function migrate() {
  const cur = S.v || 1;
  if (cur > SCHEMA) {
    console.warn('[mg] 存檔版本 v' + cur + ' 比程式新（v' + SCHEMA + '），略過遷移');
    return
  }
  if (cur === SCHEMA) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && !localStorage.getItem(KEY + '.bak')) localStorage.setItem(KEY + '.bak', raw)
  } catch (e) {
    logErr(e)
  }
  try {
    for (let v = cur; v < SCHEMA; v++)
      if (MIGRATIONS[v]) MIGRATIONS[v](S);
    S.v = SCHEMA
  } catch (e) {
    logErr(e)
  }
})();
/* 墓碑（S.del / S.wdel 的刪除紀錄）永久保留、不清理：這樣不論其他裝置多久沒同步，已刪除的花都不會復活。
   每筆只有「日期→時間戳」，數量再多也只佔很小的空間。 */
S.e = S.e || {};
if (S.rm === undefined) S.rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
/* 每朵花記一個更新時間 u（跨裝置同步時以較新的為準）；刪除的花記在 S.del，讓其他裝置也能一起刪 */
const _sig = e => {
    const {
      u,
      ...r
    } = e;
    return JSON.stringify(r)
  },
  _bj = {};
S.del = S.del || {};
for (const d in S.e) _bj[d] = _sig(S.e[d]);
/* 星願島的花：S.w[id]（id→資料），刪除記在 S.wdel；每朵一樣有更新時間 u，同步時以較新的為準 */
S.w = S.w || {};
S.wdel = S.wdel || {};
const _wj = {};
for (const i in S.w) _wj[i] = _sig(S.w[i]);
const wStamp = n => {
  for (const i in S.w) {
    const g = _sig(S.w[i]);
    if (_wj[i] !== g) {
      S.w[i].u = n;
      _wj[i] = g;
      delete S.wdel[i]
    }
  }
  for (const i in _wj)
    if (!(i in S.w)) {
      S.wdel[i] = n;
      delete _wj[i]
    }
};

function wApply(id, o) {
  o = JSON.parse(JSON.stringify(o));
  const old = S.w[id];
  S.w[id] = o;
  _wj[id] = _sig(o);
  delete S.wdel[id];
  try {
    window.SI && SI.onApply(id, old, o)
  } catch (e) {
    logErr(e)
  }
} // 雲端來的新版本
function wDrop(id, u) {
  delete S.w[id];
  delete _wj[id];
  S.wdel[id] = u;
  try {
    window.SI && SI.onDrop(id)
  } catch (e) {
    logErr(e)
  }
} // 雲端說這朵已刪除
function wClear() {
  for (const i in S.w) delete S.w[i];
  try {
    window.SI && SI.clearVisual()
  } catch (e) {
    logErr(e)
  }
}
/* 寫入本機存檔；失敗（容量滿、隱私模式）時只提醒一次，避免使用者以為已存好 */
let _saveBad = 0;

function persistState() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    _saveBad = 0
  } catch (e) {
    logErr(e);
    if (!_saveBad) {
      _saveBad = 1;
      try {
        toast(tr('saveFail'))
      } catch (x) {
        logErr(x)
      }
    }
  }
}
const save = () => {
  const n = Date.now();
  for (const d in S.e) {
    const g = _sig(S.e[d]);
    if (_bj[d] !== g) {
      S.e[d].u = n;
      _bj[d] = g;
      delete S.del[d]
    }
  }
  for (const d in _bj)
    if (!(d in S.e)) {
      S.del[d] = n;
      delete _bj[d]
    }
  wStamp(n);
  persistState()
  try {
    window.cloud && cloud.dirty()
  } catch (e) {
    logErr(e)
  }
};
