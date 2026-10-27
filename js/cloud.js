/* ============================================================================
 * js/cloud.js — 雲端同步（Google 登入 + 雲端硬碟 App 資料夾）
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・把花園存成使用者自己的 Google 雲端硬碟「應用程式資料夾」裡的隱藏檔
 *     garden.json，沒有任何自己的伺服器；GOOGLE_CLIENT_ID 留空則整個雲端功能
 *     關閉。
 *   ・依「更新時間較新者勝」逐日合併花朵、墓碑與星願島的花（也合併禮物資料
 *     GF.mrg），並處理登入、登出、權杖過期、離線與錯誤狀態。
 *   ・對外以 window.cloud 提供（dirty、wake…），設定頁的同步區塊使用它。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、flower-care.js、creatures.js、weather.js、gifts.js、
 *   ui-shell.js、views.js、boot.js
 * 提供給其他檔案：GOOGLE_CLIENT_ID、cloud
 * 載入順序：第 26 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 雲端同步（Google 登入 + 使用者自己的 Google 雲端硬碟「應用程式資料夾」）=====
   花園會存成使用者雲端硬碟裡一個隱藏檔 garden.json：只有這個網站能讀寫，使用者在雲端硬碟介面看不到，
   開發者（你）也完全看不到任何人的內容。沒有任何自己的伺服器或資料庫。
   設定：Google Cloud Console → 建立專案 → 啟用 Google Drive API → OAuth 同意畫面（加入範圍 drive.appdata）
        → 建立「網頁應用程式」OAuth 用戶端 ID（已授權的 JavaScript 來源填你的網站網址）→ 把用戶端 ID 貼到下面。
   留空時雲端功能自動關閉，花園仍只存在這個瀏覽器（localStorage）。
   注意：Google 的存取權杖只有效約 1 小時（沒有後端就拿不到長效 refresh token），過期後下一次點擊畫面時會快速重新連線一次。 */
const GOOGLE_CLIENT_ID = '907010287253-i85fg9k699sibjc375d0fti7eink03uk.apps.googleusercontent.com';
window.cloud = (() => {
  const SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.appdata',
    DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata',
    FN = 'garden.json',
    TK = 'moodgarden.g';
  const D = 'https://www.googleapis.com/drive/v3/files',
    U = 'https://www.googleapis.com/upload/drive/v3/files',
    cfgOK = !!GOOGLE_CLIENT_ID;
  let user = null,
    tok = null,
    client = null,
    st = 'off',
    busy = false,
    again = false,
    timer = 0,
    lastOk = 0,
    lastVer = null,
    localDirty = false,
    manual = false,
    armed = false;
  const api = {
    user: null,
    state: 'off'
  };
  const tokOK = () => !!(tok && Date.now() < tok.exp - 60000);
  try {
    const g = JSON.parse(localStorage.getItem(TK));
    if (g && g.sub) {
      user = {
        sub: g.sub,
        email: g.email,
        name: g.name
      };
      tok = g.t ? {
        t: g.t,
        exp: g.exp
      } : null
    }
  } catch (e) {
    logErr(e)
  }
  api.user = user;
  st = !cfgOK ? 'off' : user ? (tokOK() ? 'syncing' : 'reauth') : 'out';
  api.state = st;
  const persist = () => {
    try {
      user ? localStorage.setItem(TK, JSON.stringify({
        ...user,
        t: tok && tok.t,
        exp: tok && tok.exp
      })) : localStorage.removeItem(TK)
    } catch (e) {
      logErr(e)
    }
  };
  const askX = (m, y, n) => {
    const p = ask(m, y);
    $('dn').textContent = n;
    return p.then(v => {
      $('dn').textContent = tr('keep');
      return v
    })
  };
  const rmFlower = d => {
    if (flowers[d]) {
      scene.remove(flowers[d]);
      freeObj(flowers[d]);
      delete flowers[d]
    }
  };
  const setSt = s => {
    st = s;
    api.state = s;
    api.paint()
  };
  const ts = e => e ? (e.u || e.pt || 0) : 0;

  /* ---- Drive REST ---- */
  async function gx(url, opt = {}) {
    const r = await fetch(url, {
      ...opt,
      headers: {
        Authorization: 'Bearer ' + tok.t,
        ...(opt.headers || {})
      }
    });
    if (!r.ok) {
      const e = new Error('http ' + r.status);
      e.status = r.status;
      throw e
    }
    return r
  }
  const list = async () => (await (await gx(D + '?spaces=appDataFolder&orderBy=createdTime&fields=' + encodeURIComponent('files(id,version)') + '&q=' + encodeURIComponent("name='" + FN + "' and trashed=false"))).json()).files || [];
  const dl = async id => {
    const t = await (await gx(D + '/' + id + '?alt=media')).text();
    try {
      return JSON.parse(t) || {}
    } catch (e) {
      return {}
    }
  };
  async function create(body) {
    const b = 'gdn' + Date.now(),
      meta = JSON.stringify({
        name: FN,
        parents: ['appDataFolder'],
        mimeType: 'application/json'
      });
    return (await gx(U + '?uploadType=multipart&fields=id,version', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/related; boundary=' + b
      },
      body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`
    })).json()
  }
  const update = async (id, body) => (await gx(U + '/' + id + '?uploadType=media&fields=id,version', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  })).json();

  /* ---- 設定頁的「帳號與同步」區塊 ---- */
  const paint0 = () => {
    const el = $('acc');
    if (!el) return;
    if (st === 'off') {
      el.innerHTML = `<div class="si"><span class="sic ms">cloud_off</span><span class="sx"><b>${tr('cNoT')}</b><small>${tr('cNo')}</small></span></div>`;
      return
    }
    if (!user) {
      el.innerHTML = `<div class="si col"><span class="sx"><small style="margin-bottom:10px">${tr('accD')}</small></span>
<button class="ab" data-a="google" ${client?'':'disabled'}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>${tr('gIn')}</button></div>`;
      return
    }
    const ico = {
        ok: 'cloud_done',
        offline: 'cloud_off',
        err: 'error',
        reauth: 'lock'
      } [st] || 'cloud_sync',
      re = st === 'reauth';
    const t = new Date(lastOk || Date.now()).toLocaleTimeString(LC(), {
      hour: '2-digit',
      minute: '2-digit'
    });
    const msg = {
      ok: tr('stOk') + ' · ' + t,
      offline: tr('stOff'),
      err: tr('stErr'),
      reauth: tr('stRe')
    } [st] || tr('stSync');
    el.innerHTML = `<div class="si"><span class="sic ms">account_circle</span><span class="sx"><b>${esc(user.name||user.email||'Google')}</b><small>Google${user.email?' · '+esc(user.email):''}</small></span></div>
<div class="si"><span class="sic ms" style="background:${st==='err'?'#fbe0e0':'#DDEFE0'}">${ico}</span><span class="sx"><small style="opacity:.85;font-size:13px">${msg}</small></span><button class="btn" data-a="${re?'re':'sync'}">${tr(re?'cRe':'sNow')}</button></div>
<div class="si"><span class="sx"></span><button class="btn r" data-a="out">${tr('sOut')}</button></div>`
  };
  api.paint = () => {
    paint0();
    const el = $('acc');
    if (el) el.onclick = e => {
      const b = e.target.closest('[data-a]');
      if (!b || b.disabled) return;
      const a = b.dataset.a;
      if (a === 'google') signIn();
      else if (a === 're') reauth();
      else if (a === 'sync') tokOK() ? sync() : reauth();
      else if (a === 'out') signOut()
    }
  };

  /* ---- 登入 / 權杖 ---- */
  function signIn() {
    if (!client) return;
    manual = true;
    client.requestAccessToken({
      prompt: 'select_account'
    })
  }

  function reauth() {
    if (!client) return;
    client.requestAccessToken({
      prompt: '',
      hint: user && user.email
    })
  }

  function arm() {
    if (armed || !user) return;
    armed = true;
    addEventListener('click', () => {
      armed = false;
      if (user && !tokOK() && !SLP.on) reauth()
    }, {
      once: true,
      capture: true
    })
  }

  function signOut() {
    tok = null;
    user = null;
    api.user = null;
    persist();
    setSt('out');
    toast(tr('cOut'))
  }

  function wipeLocal() {
    try {
      GF.wipe()
    } catch (e) {
      logErr(e)
    }
    for (const d in flowers) rmFlower(d);
    S.e = {};
    S.del = {};
    wClear();
    S.wdel = {};
    for (const i in _wj) delete _wj[i];
    for (const d in _bj) delete _bj[d];
    S.wx = null;
    S.wxd = null;
    S.out = null;
    try {
      window.HOMEI && HOMEI.refresh()
    } catch (e) {
      logErr(e)
    }
    setWeather(null);
    try {
      syncCr()
    } catch (e) {
      logErr(e)
    }
  }
  async function onTok(r) {
    if (r.error) {
      if (manual) toast(esc(tr('cFail') + ' (' + r.error + ')'));
      manual = false;
      return
    }
    if (!google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)) {
      manual = false;
      toast(tr('cScope'));
      return
    }
    tok = {
      t: r.access_token,
      exp: Date.now() + (+r.expires_in || 3600) * 1000
    };
    try {
      const p = await (await gx('https://www.googleapis.com/oauth2/v3/userinfo')).json(),
        nu = {
          sub: p.sub,
          email: p.email,
          name: p.name
        };
      if (S.uid && S.uid !== nu.sub && Object.keys(S.e).length) {
        if (!await askX(tr('cMixQ'), tr('cMixY'), tr('cMixN'))) wipeLocal()
      }
      user = nu;
      api.user = nu;
      S.uid = nu.sub;
      save();
      persist();
      if (manual) {
        toast(tr('cIn'));
        manual = false
      }
      lastVer = null;
      sync()
    } catch (e) {
      tok = null;
      manual = false;
      setSt('err')
    }
  }

  /* ---- 同步：讀雲端檔 → 逐日比較更新時間（較新的贏）→ 必要時寫回 ---- */
  function applyE(d, o) {
    o = JSON.parse(JSON.stringify(o));
    const old = S.e[d],
      f = flowers[d];
    /* 只有旋轉角度不同（其餘欄位都一樣）：不重建花朵，改成順著最短方向平滑轉過去，跟裝飾品的同步動畫一致 */
    const same = !!(old && f && f.userData && (() => {
      const ks = new Set([...Object.keys(old), ...Object.keys(o)]);
      ks.delete('r');
      ks.delete('u');
      for (const k of ks)
        if (JSON.stringify(old[k]) !== JSON.stringify(o[k])) return false;
      return true
    })());
    S.e[d] = o;
    _bj[d] = _sig(o);
    delete S.del[d];
    if (!ok) return;
    if (same) {
      const u = f.userData,
        TP = Math.PI * 2,
        cur = u.ryT != null ? u.ryT : f.rotation.y;
      let df = ((((o.r || 0) - cur) % TP) + TP) % TP;
      if (df > Math.PI) df -= TP;
      u.ryT = cur + df;
      if (S.rm) f.rotation.y = u.ryT
    } else {
      rmFlower(d);
      addFlower(d, 1)
    }
  }

  function applyD(d, u) {
    rmFlower(d);
    delete S.e[d];
    delete _bj[d];
    S.del[d] = u
  }
  async function sync() {
    if (!user) return;
    if (SLP.on) {
      localDirty = true;
      return
    }
    if (busy) {
      again = true;
      return
    }
    if (!tokOK()) {
      setSt('reauth');
      arm();
      return
    }
    busy = true;
    const wasDirty = localDirty;
    localDirty = false;
    if (st !== 'ok') setSt('syncing');
    try {
      const fs = await list();
      if (fs.length === 1 && fs[0].version === lastVer && !wasDirty) {
        lastOk = Date.now();
        setSt('ok');
        busy = false;
        return
      }
      const R = {
        e: {},
        del: {},
        w: {},
        wdel: {}
      };
      for (const f of fs) {
        const j = await dl(f.id);
        for (const d in j.e || {})
          if (!(d in R.e) || ts(j.e[d]) > ts(R.e[d])) R.e[d] = j.e[d];
        for (const d in j.del || {}) R.del[d] = Math.max(R.del[d] || 0, j.del[d]);
        if (j.g) R.g = GF.mrg(R.g, j.g);
        for (const d in j.w || {})
          if (!(d in R.w) || ts(j.w[d]) > ts(R.w[d])) R.w[d] = j.w[d];
        for (const d in j.wdel || {}) R.wdel[d] = Math.max(R.wdel[d] || 0, j.wdel[d]);
        if (j.o && (!R.o || (j.o.u || 0) > (R.o.u || 0))) R.o = j.o
      }
      const out = {
        v: 1,
        e: {},
        del: {},
        w: {},
        wdel: {}
      };
      let touched = false,
        dirty = fs.length > 1;
      const dates = new Set([...Object.keys(S.e), ...Object.keys(S.del), ...Object.keys(R.e), ...Object.keys(R.del)]);
      dates.forEach(d => {
        const le = S.e[d],
          lts = le ? ts(le) : (S.del[d] || 0),
          a = ts(R.e[d]),
          b = R.del[d] || 0,
          rts = Math.max(a, b),
          rIsE = a > b;
        if (rts > lts) {
          touched = true;
          if (rIsE) {
            applyE(d, R.e[d]);
            out.e[d] = R.e[d]
          } else {
            applyD(d, b);
            out.del[d] = b
          }
        } else if (lts > rts) {
          dirty = true;
          if (le) {
            if (!le.u) le.u = le.pt || Date.now();
            out.e[d] = le
          } else if (rts > 0) out.del[d] = lts
        } else if (rts > 0) {
          if (rIsE) out.e[d] = R.e[d];
          else out.del[d] = b
        } else if (le) {
          le.u = Date.now();
          out.e[d] = le;
          dirty = true
        }
      }); // 沒有任何時間資訊的舊花：補上時間後上傳
      /* 星願島的花：跟逐日的花同樣的規則，逐朵比較更新時間（較新的贏），刪除也會同步 */
      {
        const ws = new Set([...Object.keys(S.w), ...Object.keys(S.wdel), ...Object.keys(R.w), ...Object.keys(R.wdel)]);
        ws.forEach(id => {
          const le = S.w[id],
            lts = le ? ts(le) : (S.wdel[id] || 0),
            a = ts(R.w[id]),
            b = R.wdel[id] || 0,
            rts = Math.max(a, b),
            rIsE = a > b;
          if (rts > lts) {
            touched = true;
            if (rIsE) {
              wApply(id, R.w[id]);
              out.w[id] = R.w[id]
            } else {
              wDrop(id, b);
              out.wdel[id] = b
            }
          } else if (lts > rts) {
            dirty = true;
            if (le) {
              if (!le.u) le.u = le.pt || Date.now();
              out.w[id] = le
            } else if (rts > 0) out.wdel[id] = lts
          } else if (rts > 0) {
            if (rIsE) out.w[id] = R.w[id];
            else out.wdel[id] = b
          } else if (le) {
            le.u = Date.now();
            out.w[id] = le;
            dirty = true
          }
        })
      }
      /* 出門狀態：只有一筆，比較更新時間，較新的贏 */
      {
        const lo = S.out,
          ro = R.o,
          lu = lo ? lo.u || 0 : 0,
          ru = ro ? ro.u || 0 : 0;
        if (ru > lu) {
          touched = true;
          S.out = JSON.parse(JSON.stringify(ro));
          out.o = ro
        } else if (lu > ru) {
          dirty = true;
          out.o = lo
        } else if (ro) out.o = ro
      } {
        const gr = GF.sync(R.g);
        if (gr.g) out.g = gr.g;
        if (gr.dirty) dirty = true;
        if (gr.touched) touched = true
      } // 禮物與裝飾品
      if (dirty || !fs.length) {
        const body = JSON.stringify(out),
          r = fs.length ? await update(fs[0].id, body) : await create(body);
        lastVer = r.version;
        for (const f of fs.slice(1)) gx(D + '/' + f.id, {
          method: 'DELETE'
        }).catch(() => {})
      } else lastVer = fs[0].version;
      if (touched) afterApply();
      else save();
      lastOk = Date.now();
      setSt('ok')
    } catch (e) {
      if (e.status === 401) {
        tok = null;
        persist();
        setSt('reauth');
        arm()
      } else setSt(navigator.onLine ? 'err' : 'offline')
    }
    busy = false;
    if (again) {
      again = false;
      sync()
    }
  }

  function afterApply() {
    try {
      if (ok) syncCr()
    } catch (e) {
      logErr(e)
    }
    try {
      window.SI && SI.refresh()
    } catch (e) {
      logErr(e)
    }
    try {
      window.HOMEI && HOMEI.refresh()
    } catch (e) {
      logErr(e)
    }
    const t = S.e[today()];
    if (t && (S.wxd !== today() || S.wx !== t.mood)) {
      S.wx = t.mood;
      S.wxd = today();
      setWeather(t.mood)
    } else if (!t && !window.wxm && !S.wxo) {
      const w = curWx();
      if (w) setWeather(w)
    }
    if (Object.keys(S.e).length && !$('ob').hidden) closeOb();
    save();
    refresh();
    if (!$('p-cal').hidden) renderCal();
    if (!$('p-ins').hidden) renderIns();
    if (!$('p-set').hidden) renderSet()
  }
  api.sync = sync;
  api.wake = () => {
    if (user)(tokOK() ? sync() : (setSt('reauth'), arm()))
  };
  api.dirty = () => {
    if (user) {
      localDirty = true;
      clearTimeout(timer);
      timer = setTimeout(sync, 1500)
    }
  };

  /* ---- 啟動 ---- */
  function init() {
    if (!cfgOK) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => {
      client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPE,
        callback: onTok,
        error_callback: e => {
          if (manual && !/popup_closed/.test((e && e.type) || '')) toast(esc(tr('cFail') + ' (' + ((e && e.type) || '') + ')'));
          manual = false
        }
      });
      api.paint()
    };
    document.head.append(s);
    if (user) {
      tokOK() ? sync() : arm()
    }
    setInterval(() => {
      if (user && document.visibilityState === 'visible' && navigator.onLine && tokOK()) sync()
    }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !user) return;
      tokOK() ? sync() : (setSt('reauth'), arm())
    });
    addEventListener('online', () => {
      if (user && tokOK()) sync()
    });
    addEventListener('offline', () => {
      if (user) setSt('offline')
    })
  }
  init();
  return api
})();
