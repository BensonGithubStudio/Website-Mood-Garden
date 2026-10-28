/* ============================================================================
 * js/flowers.js — 花朵模型、成長階段與凋零
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・六種心情各有一種花：成熟的花（flowerAdult）、剛種下的小花苗
 *     （flowerBaby）、凋零後的枯萎樣子（flowerWither），並組成一朵花
 *     （flower）。
 *   ・成長與凋零的時間規則：12 小時長大、需要澆水、放一段時間後凋零
 *     （matureOf、thirstyOf、withered、witherAt…）。
 *   ・setStage 切換小花苗／成熟／凋零並播放轉換動畫；stageStep 每一幀更新這些
 *     動畫。
 *
 * 需要先載入：log.js、audio.js、state.js、i18n.js、world.js、three-utils.js
 * 提供給其他檔案：addFace、faceUpdate、flowerAdult、GROW_MS、WATER_MS、
 *   WATER_EPOCH、matureOf、thirstyOf、hrsLeft、minsLeftW、WITHER_HOURS、
 *   WITHER_MS、witherAt、withered、shoveled、witherLeftTxt、flowerBaby、
 *   flowerWither、flower、setStage、matT、stageStep
 * 載入順序：第 12 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

function addFace(g, k, H) {
  const [R, dy, dz, c] = FS[k], P = new THREE.Group(), F = new THREE.Group(), ink = '#4A3535', zf = (x, y) => Math.sqrt(Math.max(.01, R * R - x * x - y * y)) * .97, E = [], C = [], cl = k == 'calm' || k == 'loved';
  P.position.set(0, H + dy, dz);
  P.add(F);
  F.add(mk(SPH, c, [0, 0, 0], [R, R, R]));
  [-1, 1].forEach(s => {
    const x = s * .4 * R,
      y = .14 * R;
    let e;
    if (cl) e = mk(TOR, ink, [x, y, zf(x, y)], [.2 * R, .2 * R, .2 * R], [0, 0, k == 'calm' ? Math.PI : 0]);
    else {
      e = mk(SPH, ink, [x, y, zf(x, y)], [.1 * R, .15 * R, .06 * R]);
      const h = mk(SPH, '#fff', [.3, .4, .8], [.35, .3, .3]);
      h.castShadow = false;
      e.add(h)
    }
    e.castShadow = false;
    e.userData.x0 = x;
    F.add(e);
    E.push(e);
    const cx = s * .68 * R,
      ck = mk(SPH, '#F59AB3', [cx, -.12 * R, zf(cx, -.12 * R) * .95], [.17 * R, .1 * R, .05 * R]);
    ck.castShadow = false;
    F.add(ck);
    C.push(ck)
  });
  const my = k == 'sad' ? -.28 : k == 'excited' ? -.24 : k == 'anxious' ? -.26 : -.2,
    zm = zf(0, my * R);
  const m = k == 'excited' ? mk(SPH, '#7A3040', [0, my * R, zm], [.2 * R, .14 * R, .06 * R]) : k == 'anxious' ? mk(SPH, ink, [0, my * R, zm], [.08 * R, .06 * R, .04 * R]) : mk(TOR, ink, [0, my * R, zm], k == 'sad' ? [.15 * R, .12 * R, .15 * R] : [.2 * R, .2 * R, .2 * R], [0, 0, k == 'sad' ? 0 : Math.PI]);
  m.castShadow = false;
  F.add(m);
  g.add(P);
  g.userData.P = P;
  g.userData.fx = {
    P,
    F,
    E,
    C,
    m,
    k,
    cl,
    nb: 1 + Math.random() * 3,
    bt: 0,
    ey: E[0].scale.y,
    mx: m.scale.x,
    my: m.scale.y,
    cx: C[0].scale.x
  }
}

function faceUpdate(f, t, dt) {
  const x = f.userData.fx;
  if (!x) return;
  const w = t + f.userData.ph,
    k = x.k;
  x.P.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z) - f.rotation.y;
  if (S.rm) return;
  x.F.scale.set(1 + Math.sin(w * 2) * .02, 1 + Math.sin(w * 2 + 1.5) * .035, 1);
  if (!x.cl) {
    x.nb -= dt;
    let b = 1;
    if (x.nb < 0) {
      x.bt += dt;
      b = 1 - Math.sin(Math.min(1, x.bt / .18) * Math.PI) * .92;
      if (x.bt > .18) {
        x.bt = 0;
        x.nb = (k == 'sad' ? 4.5 : 2) + Math.random() * 3
      }
    }
    x.E.forEach(e => e.scale.y = x.ey * b)
  }
  if (k == 'excited') x.m.scale.y = x.my * (.75 + Math.abs(Math.sin(w * 3)) * .6);
  if (k == 'anxious') {
    x.E.forEach(e => e.position.x = e.userData.x0 + Math.sin(w * 1.7) * .02);
    x.m.scale.x = x.mx * (1 + Math.sin(w * 9) * .25)
  }
  if (k == 'sad') x.m.scale.y = x.my * (1 + Math.sin(w * 6) * .12);
  if (x.cl) x.C.forEach(c => c.scale.x = x.cx * (1 + Math.sin(w * 2) * .14))
}

function flowerAdult(k) {
  const g = new THREE.Group(),
    H = {
      happy: 1.6,
      excited: 1.3,
      calm: .9,
      loved: 1.2,
      sad: 1.4,
      anxious: 1.5
    } [k],
    h = new THREE.Group();
  g.add(mk(CYL, '#7DB36F', [0, H / 2, 0], [.05, H, .05]));
  [1, -1].forEach((s, i) => g.add(mk(SPH, '#8CC27D', [s * .22, H * .28 + i * .18, 0], [.24, .04, .1], [0, 0, s * .45])));
  h.position.y = H;
  g.add(h);
  if (k == 'happy') {
    h.rotation.x = .45;
    ring(h, 16, .3, 0, [.2, .035, .075], 0, '#F5D04A');
    ring(h, 12, .24, .02, [.17, .035, .07], 0, '#F2B93B');
    h.add(mk(SPH, '#7A5236', [0, .03, 0], [.2, .07, .2]))
  }
  if (k == 'excited') {
    ring(h, 6, .1, .15, [.09, .22, .06], -.28, '#F6A35C');
    ring(h, 3, .05, .12, [.08, .2, .05], -.1, '#F9BE86')
  }
  if (k == 'calm') {
    h.rotation.x = .4;
    ring(h, 13, .2, 0, [.16, .025, .045], 0, '#FFFFFF');
    h.add(mk(SPH, '#F5D04A', [0, .02, 0], [.1, .07, .1]))
  }
  if (k == 'loved') {
    ring(h, 6, .2, .08, [.1, .14, .04], -.6, '#F29BB5');
    ring(h, 5, .13, .14, [.09, .13, .04], -.5, '#F5ABC2');
    ring(h, 4, .06, .18, [.07, .12, .04], -.3, '#F7C0D0');
    h.add(mk(SPH, '#E97C9C', [0, .15, 0], [.07, .1, .07]))
  }
  if (k == 'sad') {
    g.children[0].rotation.z = .12;
    for (let i = 0; i < 3; i++) {
      const b = mk(bellG, '#8DB9E8', [Math.cos(i * 2.1) * .2, -.02 - i * .15, Math.sin(i * 2.1) * .2], [1, 1, 1], null, own(new THREE.MeshStandardMaterial({
        color: i ? '#8DB9E8' : '#A3C8F0',
        side: 2,
        roughness: .85,
        vertexColors: true,
        emissive: new THREE.Color('#8DB9E8').multiplyScalar(.13)
      })));
      h.add(b)
    }
  }
  if (k == 'anxious') {
    for (let i = 0; i < 10; i++) h.add(mk(SPH, i % 2 ? '#B7A2E0' : '#9C86D4', [Math.cos(i * 2) * .06, -.5 + i * .09, Math.sin(i * 2) * .06], [.075 - i * .003, .09, .075 - i * .003]))
  }
  const dr = new THREE.Group();
  dr.visible = false;
  const DP = {
    happy: [.15, .15, .05, 0],
    excited: [.09, .05, .12, .1],
    calm: [.08, .14, .03, 0],
    loved: [.08, .1, .1, .08],
    sad: [.14, .04, -.08, -.25],
    anxious: [.07, .02, -.4, .6]
  } [k];
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + Math.random(),
      r = DP[0] + Math.random() * DP[1],
      d = mk(SPH, '#E6F4FF', [Math.cos(a) * r, DP[2] + Math.random() * DP[3], Math.sin(a) * r], [.028, .034, .028], null, DROPM);
    d.castShadow = false;
    dr.add(d)
  }
  h.add(dr);
  g.userData.dr = dr;
  g.userData.h = h;
  g.userData.ph = Math.random() * 6;
  g.userData.mood = k;
  return g
}

/* ---------- 兩種成長階段：剛種下是小花苗，過 12 小時長成成熟的花 ---------- */
const GROW_MS = 12 * 3600 * 1000;
/* 澆水規則：種下滿 12 小時後「口渴」，要澆水才會長大；沒澆水就一直是小花苗；澆水（e.wt）後再過 1 小時長成成熟的花 */
const WATER_MS = 3600 * 1000,
  WATER_EPOCH = 1792655736305; // WATER_EPOCH＝澆水功能上線時間；在這之前就已長成的舊花維持成熟，不會變回小花苗
const matureOf = e => !e.pt || (e.wt ? Date.now() - e.wt >= WATER_MS : e.pt + GROW_MS <= WATER_EPOCH); // 沒有種植時間的舊花一律視為已成熟
const thirstyOf = e => !!e.pt && !e.wt && !matureOf(e) && Date.now() - e.pt >= GROW_MS; // 滿 12 小時、還沒澆水
const hrsLeft = e => Math.max(1, Math.ceil((e.pt + GROW_MS - Date.now()) / 36e5)); // 距離可以澆水還有幾小時
const minsLeftW = e => Math.max(1, Math.ceil((e.wt + WATER_MS - Date.now()) / 6e4)); // 澆水後距離長大還有幾分鐘
/* ---------- 凋零：花朵種下滿一段時間就會凋零 ----------
   ★ 想測試凋零，只要改下面這個數字（單位：小時）。預設 2400 小時 = 100 天。
     例：WITHER_HOURS=0.05 ≈ 3 分鐘。也可以不改檔案，直接在網址後面加 ?wither=0.05 臨時覆蓋。
   凋零時間從「種下的那一刻」(e.pt) 開始算；鏟除只是把花搬到凋零小島（e.sh），心情與文字都會留著。 */
const WITHER_HOURS = 2400;
const WITHER_MS = (() => {
  let q = NaN;
  try {
    q = parseFloat(new URLSearchParams(location.search).get('wither'))
  } catch (e) {
    logErr(e)
  }
  return (q > 0 ? q : WITHER_HOURS) * 3600 * 1000
})();
const witherAt = (d, e) => (e.pt || new Date(d + 'T12:00').getTime()) + WITHER_MS; // 沒有種植時間的舊花，用日期當作種下的時間
const withered = (d, e) => !!e && Date.now() >= witherAt(d, e); // 已進入凋零期（不論有沒有鏟除）
const shoveled = e => !!(e && e.sh); // 已鏟除（搬到凋零小島）
const witherLeftTxt = (d, e) => {
  const ms = Math.max(0, witherAt(d, e) - Date.now());
  return ms >= 864e5 ? tr('wDay', Math.ceil(ms / 864e5)) : ms >= 36e5 ? tr('wHr', Math.ceil(ms / 36e5)) : tr('wMin', Math.max(1, Math.ceil(ms / 6e4)))
};

function flowerBaby(k) {
  const g = new THREE.Group(),
    H = {
      happy: .8,
      excited: .65,
      calm: .5,
      loved: .6,
      sad: .6,
      anxious: .55
    } [k],
    h = new THREE.Group();
  g.add(mk(CYL, '#8CC27D', [0, H / 2, 0], [.04, H, .04]));
  [1, -1].forEach((s, i) => g.add(mk(SPH, '#9BCF8A', [s * .13, H * .35 + i * .08, 0], [.14, .03, .07], [0, 0, s * .5])));
  h.position.y = H;
  g.add(h);
  if (k == 'happy') {
    h.rotation.x = .4;
    h.add(mk(SPH, '#A8D17A', [0, 0, 0], [.12, .1, .12]));
    ring(h, 8, .09, .03, [.07, .02, .035], .55, '#F5D04A');
    h.add(mk(SPH, '#7A5236', [0, .07, 0], [.07, .04, .07]))
  }
  if (k == 'excited') {
    h.add(mk(SPH, '#F6A35C', [0, .13, 0], [.1, .17, .1]), mk(SPH, '#F9BE86', [0, .26, 0], [.045, .07, .045]));
    ring(h, 3, .07, .02, [.07, .02, .035], .9, '#8CC27D')
  }
  if (k == 'calm') {
    h.rotation.x = .35;
    h.add(mk(SPH, '#8CC27D', [0, 0, 0], [.1, .07, .1]));
    ring(h, 8, .07, .03, [.09, .02, .04], .5, '#FFFFFF');
    h.add(mk(SPH, '#F5D04A', [0, .04, 0], [.06, .04, .06]))
  }
  if (k == 'loved') {
    h.add(mk(SPH, '#F29BB5', [0, .12, 0], [.1, .13, .1]), mk(SPH, '#E97C9C', [0, .17, 0], [.06, .08, .06]));
    ring(h, 3, .07, .02, [.1, .025, .04], .7, '#8CC27D')
  }
  /* 難過：莖尖彎成一個小彎鉤，尾端吊著一顆還沒打開的藍色小花苞（成熟後才會綻成鈴鐺） */
  if (k == 'sad') {
    g.children[0].rotation.z = .18;
    [
      [0, .02],
      [.05, .06],
      [.11, .075],
      [.16, .04],
      [.18, -.02]
    ].forEach(([x, y], i) => h.add(mk(SPH, '#8CC27D', [x, y, 0], [.04 - i * .003, .04 - i * .003, .04 - i * .003])));
    h.add(mk(SPH, '#A3C8F0', [.185, -.12, 0], [.05, .1, .05]), mk(SPH, '#8DB9E8', [.185, -.2, 0], [.03, .04, .03]))
  }
  /* 焦慮：像剛冒出的小草芽，四片細葉往外散開，葉尖點著小小的紫色圓點（成熟後才會長成一串花穗） */
  if (k == 'anxious') {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + .4,
        c = Math.cos(a),
        n = Math.sin(a);
      h.add(mk(SPH, '#9CCB8A', [c * .05, .08, n * .05], [.025, .15, .025], [n * .45, 0, -c * .45]), mk(SPH, i % 2 ? '#B7A2E0' : '#9C86D4', [c * .115, .2, n * .115], [.03, .03, .03]))
    }
    h.add(mk(SPH, '#9C86D4', [0, .1, 0], [.04, .06, .04]))
  }
  const dr = new THREE.Group();
  dr.visible = false;
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1,
      d = mk(SPH, '#E6F4FF', [Math.cos(a) * .1, Math.random() * .1, Math.sin(a) * .1], [.022, .028, .022], null, DROPM);
    d.castShadow = false;
    dr.add(d)
  }
  h.add(dr);
  const hb = new THREE.Mesh(own(new THREE.SphereGeometry(1, 8, 6)), own(new THREE.MeshBasicMaterial({
    visible: false
  })));
  hb.position.y = H * .55;
  hb.scale.set(.32, H * .55 + .1, .32);
  g.add(hb); // 小花苗比較小，加一個隱形觸控範圍方便點選
  g.userData.h = h;
  g.userData.dr = dr;
  return g
}
/* ---------- 凋零的樣子：6 種花各有自己的枯萎方式 ----------
   共通：莖乾枯變褐、頂端垂下去，葉子捲曲下垂，花瓣掉了一地。
   向日葵＝花瓣稀疏捲起、深褐花盤低頭；鬱金香＝花瓣向外鬆開、掉下一片；雛菊＝花瓣泛灰、只剩幾片；
   玫瑰＝深酒紅的花瓣層層萎縮、散落；風鈴草＝鈴鐺縮成灰藍、弓著身、掉了一顆；薰衣草＝花穗變灰褐、整串垂下。
   lite=true 是給凋零小島用的精簡版（少一點零件，島上才不會太吃效能）。 */
function flowerWither(k, lite) {
  const g = new THREE.Group(),
    rn = (a, b) => a + Math.random() * (b - a);
  const H = {
      happy: 1.6,
      excited: 1.3,
      calm: .9,
      loved: 1.2,
      sad: 1.4,
      anxious: 1.5
    } [k],
    bd = {
      happy: .7,
      excited: .42,
      calm: .36,
      loved: .55,
      sad: .8,
      anxious: .95
    } [k],
    ST = {
      happy: '#8E8556',
      excited: '#8D8A58',
      calm: '#919060',
      loved: '#7B6B45',
      sad: '#8A8A5E',
      anxious: '#868356'
    } [k];
  /* 莖：三次貝茲曲線，頂端垂下去 */
  const P0 = [0, 0],
    P1 = [0, H * .85],
    P2 = [bd * .5, H * 1.12],
    P3 = [bd, H * .7],
    N = lite ? 5 : 8;
  const pt = t => {
    const u = 1 - t;
    return [u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]
  };
  for (let i = 0; i < N; i++) {
    const a = pt(i / N),
      b = pt((i + 1) / N),
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      L = Math.hypot(dx, dy),
      r = .05 - i * (lite ? .004 : .0025);
    g.add(mk(CYL, ST, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], [r, L * 1.08, r], [0, 0, -Math.atan2(dx, dy)]))
  }
  /* 乾枯的葉子：垂下去、顏色變褐 */
  [1, -1].forEach((s, i) => g.add(mk(SPH, i ? '#A08A52' : '#8F7A48', [s * .2, H * .22 + i * .16, 0], [.24, .035, .1], [0, 0, -s * .75])));
  /* 掉在地上的花瓣 */
  const fall = (c, n, r, s) => {
    n = lite ? Math.ceil(n / 3) : n;
    for (let i = 0; i < n; i++) {
      const a = rn(0, 6.28),
        d = rn(.15, r);
      g.add(mk(SPH, c, [Math.cos(a) * d + bd * .3, .025, Math.sin(a) * d], [s[0], s[1], s[2]], [0, rn(0, 3), rn(-.15, .15)]))
    }
  };
  /* 頭部：+y 軸對準莖尖方向，所以整朵花是低垂的 */
  const T = [P3[0] - P2[0], P3[1] - P2[1]],
    hd = new THREE.Group();
  hd.position.set(P3[0], P3[1], 0);
  hd.rotation.z = -Math.atan2(T[0], T[1]);
  g.add(hd);
  const bellM = c => own(new THREE.MeshStandardMaterial({
    color: c,
    side: 2,
    roughness: .9,
    vertexColors: true,
    emissive: new THREE.Color(c).multiplyScalar(.13)
  }));
  if (k == 'happy') {
    /* 向日葵：花瓣稀疏、往內捲，深褐色花盤低著頭 */
    hd.add(mk(SPH, '#4E3A2A', [0, 0, 0], [.2, .07, .2]));
    hd.add(mk(SPH, '#3B2B20', [0, .04, 0], [.11, .04, .11]));
    ring(hd, 9, .28, -.02, [.17, .03, .065], .9, '#B59A45');
    ring(hd, lite ? 3 : 5, .22, .0, [.14, .03, .06], 1.15, '#9C8238');
    fall('#C9A94F', 5, .7, [.14, .025, .06]);
    fall('#A68A3A', 3, .5, [.12, .022, .05])
  }
  if (k == 'excited') {
    /* 鬱金香：花瓣向外鬆開、顏色變褐，掉下一兩片 */
    hd.add(mk(SPH, '#5A4A35', [0, .1, 0], [.04, .1, .04]));
    ring(hd, 5, .13, .1, [.08, .19, .05], -.75, '#A87650');
    ring(hd, 3, .06, .08, [.07, .16, .045], -.4, '#C29A6C');
    fall('#A87650', 2, .55, [.07, .02, .16])
  }
  if (k == 'calm') {
    /* 雛菊：花瓣泛灰、稀疏，花心變暗黃 */
    hd.add(mk(SPH, '#B79B45', [0, .02, 0], [.1, .07, .1]));
    ring(hd, 8, .19, 0, [.15, .022, .04], .7, '#D9D3C0');
    ring(hd, lite ? 2 : 4, .14, .012, [.12, .02, .035], 1.0, '#BDB59C');
    fall('#E4DECB', 6, .55, [.15, .018, .04])
  }
  if (k == 'loved') {
    /* 玫瑰：酒紅色花瓣一層層萎縮，散落一地 */
    hd.add(mk(SPH, '#4F2A32', [0, .12, 0], [.07, .1, .07]));
    ring(hd, 6, .2, .06, [.1, .14, .04], .15, '#7D3F4C');
    ring(hd, 5, .13, .1, [.09, .13, .04], .3, '#6A3440');
    ring(hd, 4, .06, .14, [.07, .12, .04], .45, '#8B4A57');
    fall('#7D3F4C', 6, .7, [.1, .018, .06]);
    fall('#5A2D37', 3, .5, [.09, .016, .05])
  }
  if (k == 'sad') {
    /* 風鈴草：鈴鐺縮小、變成灰藍，弓著身垂下，還有一顆掉在地上 */
    for (let i = 0; i < 3; i++) g.add(mk(bellG, '#7C86A0', [P3[0] + Math.cos(i * 2.1) * .17, P3[1] - .02 - i * .13, Math.sin(i * 2.1) * .17], [.85, .85, .85], null, bellM(i ? '#7C86A0' : '#8D98B4')));
    if (!lite) g.add(mk(bellG, '#7C86A0', [.5, .07, .32], [.8, .8, .8], [0, .5, 1.5], bellM('#7C86A0')));
    fall('#8D98B4', 2, .6, [.06, .02, .09])
  }
  if (k == 'anxious') {
    /* 薰衣草：花穗變成灰褐色、稀稀落落地垂在尖端 */
    for (let i = 0; i < 9; i++) {
      if (i % 4 == 3) continue;
      g.add(mk(SPH, i % 2 ? '#8E7F8F' : '#7A6C7D', [P3[0] + Math.sin(i * 1.7) * .045, P3[1] - .03 - i * .085, Math.cos(i * 1.7) * .045], [.062 - i * .003, .08, .062 - i * .003]))
    }
    fall('#8E7F8F', 7, .8, [.045, .045, .045])
  }
  /* 隱形的觸控範圍（跟小花苗一樣），方便點選 */
  const hb = new THREE.Mesh(own(new THREE.SphereGeometry(1, 8, 6)), own(new THREE.MeshBasicMaterial({
    visible: false
  })));
  hb.position.set(bd * .5, H * .5, 0);
  hb.scale.set(Math.max(.4, bd * .75), H * .55 + .1, .4);
  g.add(hb);
  if (lite) g.traverse(o => {
    if (o.isMesh) o.castShadow = false
  });
  g.userData.wk = k;
  return g
}

function flower(k) {
  const W = new THREE.Group(),
    A = flowerAdult(k),
    Y = flowerBaby(k);
  W.add(A, Y);
  Object.assign(W.userData, {
    h: A.userData.h,
    dr: A.userData.dr,
    hy: Y.userData.h,
    dry: Y.userData.dr,
    ph: A.userData.ph,
    mood: k,
    A,
    Y,
    st: 1,
    mo: null
  });
  return W
}
/* 切換階段：anim=true 時，小花苗縮回去、成熟的花彈出來（還會有星星和愛心） */
function setStage(f, st, anim) {
  const u = f.userData,
    was = u.st;
  u.st = st;
  /* 凋零：用 6 種各自的枯萎模型；anim=true 時，原本的花（或小花苗）會慢慢縮回去、枯萎的樣子浮現，並飄下花瓣 */
  if (st === 2) {
    if (!u.Wt) {
      u.Wt = flowerWither(u.mood);
      f.add(u.Wt)
    }
    u.Wt.visible = true;
    u.mo = null;
    setThirst(f, false);
    u.th = false;
    if (anim) {
      u.wsrc = was === 0 ? u.Y : u.A;
      u.wsrc.visible = true;
      u.Wt.scale.setScalar(.001);
      u.wm = 0;
      witherFx(f)
    } else {
      u.wm = null;
      u.wsrc = null;
      u.A.visible = false;
      u.Y.visible = false;
      u.A.scale.setScalar(.001);
      u.Y.scale.setScalar(.001);
      u.Wt.scale.setScalar(1)
    }
    return
  }
  if (u.Wt) {
    u.Wt.visible = false;
    u.wm = null
  }
  if (anim && st === 1) {
    u.mo = 0;
    u.A.visible = true;
    u.Y.visible = true;
    u.A.scale.setScalar(.001);
    const p = {
      x: f.position.x,
      y: f.position.y + .5 * u.base,
      z: f.position.z
    };
    burst('spark', p, 6);
    burst('heart', p, 3);
    sfx('bloom');
    toast(tr('grown'));
    return
  }
  u.mo = null;
  u.A.visible = st === 1;
  u.Y.visible = st === 0;
  u.A.scale.setScalar(st === 1 ? 1 : .001);
  u.Y.scale.setScalar(st === 0 ? 1 : .001)
}
let matT = 0;

function stageStep(t, dt) {
  witherStep(t, dt);
  if (t - matT > 3) {
    matT = t;
    let nt = 0,
      nw = 0;
    for (const d in flowers) {
      const f = flowers[d],
        u = f.userData,
        e = S.e[d];
      if (!e) continue;
      if (u.st !== 2 && withered(d, e) && !(P && P.d === d)) {
        setStage(f, 2, true);
        nw++;
        continue
      }
      if (u.st === 2) continue;
      if (u.st === 0 && matureOf(e) && !(P && P.d === d)) setStage(f, 1, true);
      const th = u.st === 0 && thirstyOf(e);
      setThirst(f, th);
      if (th && !u.th) nt++;
      u.th = th
    }
    if (nw && !P) toast(tr('withToast', nw));
    if (nt && !P) toast(tr('thirstT', nt))
  }
  if (!S.rm)
    for (const d in flowers) {
      const u = flowers[d].userData;
      if (u.dp) u.dp.position.y = 1.25 + .07 * Math.sin(t * 3 + u.ph)
    }
  for (const d in flowers) {
    const f = flowers[d],
      u = f.userData;
    if (u.mo == null) continue;
    u.mo += S.rm ? dt * 8 : dt / 1.5;
    const x = Math.min(1, u.mo),
      xa = Math.max(0, (x - .2) / .8),
      ob = 1 + 2.70158 * Math.pow(xa - 1, 3) + 1.70158 * Math.pow(xa - 1, 2);
    u.Y.scale.setScalar(Math.max(.001, 1 - ez(Math.min(1, x * 3))));
    u.A.scale.setScalar(Math.max(.001, xa > 0 ? ob : .001));
    if (x >= 1) {
      u.mo = null;
      u.Y.visible = false;
      u.Y.scale.setScalar(.001);
      u.A.scale.setScalar(1)
    }
  }
}
