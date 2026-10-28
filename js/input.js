/* ============================================================================
 * js/input.js — 畫面操作：點選、拖曳、縮放、平移
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・處理畫布上的指標事件：點選與懸停（花朵、動物、禮物、裝飾品、各座小
 *     島）、拖曳花朵／裝飾品／星願花、單指平移與慣性滑行、雙指縮放、滑鼠右鍵
 *     旋轉與滾輪縮放。
 *   ・命中判斷依序交給禮物（GF）與各座小島（RV、MB、WI、SI、HOMEI）；拖曳時畫
 *     面邊緣自動捲動的偵測（lpSet／lpEnd）也在這裡。
 *
 * 需要先載入：audio.js、state.js、i18n.js、world.js、garden-scene.js、
 *   camera.js、creatures.js、particles.js、gifts.js、loop.js
 * 提供給其他檔案：cv、pts、ray、mv、pd、moved、pinch、pick、lpSet、lpEnd、pan
 * 載入順序：第 21 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- camera input ---------- */
const cv = $('c'),
  pts = new Map(),
  ray = new THREE.Raycaster(),
  mv = new THREE.Vector2();
let pd = 0,
  moved = 0,
  pinch = 0;

function pickFlowerD(e) {
  mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mv, cam);
  const h = ray.intersectObjects(Object.values(flowers), true)[0];
  if (!h) return null;
  let o = h.object;
  while (o && !o.userData.date) o = o.parent;
  return o ? {
    date: o.userData.date,
    d: h.distance
  } : null
}

function pick(e) {
  const r = pickFlowerD(e);
  return r ? r.date : null
}
/* ---------- 命中判斷：點到什麼就是什麼（誰離鏡頭最近就是誰） ----------
   每個候選都回報「射線命中的距離」，分兩級：
   ・tight（精準）：花朵、禮物、裝飾品、星願花、小動物的本體附近。
   ・loose（寬鬆）：各座小島那種大範圍的隱形點擊區、小動物外圍比較大的點擊範圍。
   先比級別（精準的優先），同級別再比距離（近的優先）。
   所以花朵前面有小動物就點小動物、小動物在花朵後面就點花朵；島的大範圍不會搶走前景的東西。
   小動物的點擊球很大（為了好點），這裡用「球心離鏡頭的深度」比較，並要求射線離本體 CORE 以內才算精準。 */
const CORE = .45,
  _cv = new THREE.Vector3();

function crHit(e) {
  let cg = null;
  try {
    cg = pickCr(e)
  } catch (x) {
    return null
  }
  if (!cg) return null;
  ray.setFromCamera(mv, cam);
  const hb = (cg.userData && cg.userData.hb) || (cg.isObject3D ? cg : null);
  if (!hb) return {
    v: cg,
    d: 0,
    tight: true
  };
  hb.getWorldPosition(_cv);
  const o = ray.ray.origin,
    r = ray.ray.direction;
  const d = (_cv.x - o.x) * r.x + (_cv.y - o.y) * r.y + (_cv.z - o.z) * r.z;
  return {
    v: cg,
    d: d > 0 ? d : 0,
    tight: ray.ray.distanceSqToPoint(_cv) < CORE * CORE
  }
}

function hitTest(e) {
  const c = [],
    add = (k, v, d, tight) => {
      if (d != null && isFinite(d)) c.push({
        k,
        v,
        d,
        t: tight ? 0 : 1
      })
    };
  mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mv, cam);
  const cg = crHit(e);
  ray.setFromCamera(mv, cam); /* pickCr 可能動過射線，重設一次 */
  if (cg) add('cr', cg.v, cg.d, cg.tight);
  const g = GF.hitGift(e);
  if (g) add('gift', g.id, g.d, true);
  const dc = GF.hitDecor(e);
  if (dc) add('decor', dc.id, dc.d, true);
  const f = pickFlowerD(e);
  if (f) add('flower', f.date, f.d, true);
  if (window.SI) {
    SI.pick(e);
    const s = SI.dist(e);
    if (s) add('si', null, s.d, s.tight)
  } /* SI.pick 順便更新島上提示的懸停光暈 */
  [
    ['rv', window.RV],
    ['mb', window.MB],
    ['wi', window.WI],
    ['home', window.HOMEI]
  ].forEach(([k, m]) => {
    if (!m) return;
    const d = m.pick(e);
    if (typeof d == 'number') add(k, null, d, false)
  });
  c.sort((a, b) => a.t - b.t || a.d - b.d);
  return c[0] || null
}
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, e);
  moved = 0;
  panV.x = panV.z = 0;
  panning = true;
  panT = performance.now();
  const lb = e.pointerType != 'mouse' || e.button == 0;
  if (arrange && lb && pts.size == 1) {
    const b = hitTest(e);
    if (b && b.k == 'si' && SI.down(e)) return;
    if (b && b.k == 'decor') {
      GF.down(b.v);
      return
    }
    const d = b && b.k == 'flower' ? b.v : null;
    if (d) {
      slideDrop(d);
      drag = d;
      dm = 0;
      hover = null;
      const f0 = flowers[d];
      dragO = {
        x: f0.position.x,
        z: f0.position.z
      };
      dragOK = true;
      selRing.material.color.set('#F29BB5');
      selRing.visible = true;
      selRing.position.set(f0.position.x, f0.position.y + .05, f0.position.z);
      return
    }
  }
  if (pts.size == 2) {
    const [a, b] = [...pts.values()];
    pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }
});
cv.addEventListener('pointermove', e => {
  const p = pts.get(e.pointerId);
  if (!p) {
    const b = hitTest(e);
    hover = b && b.k == 'flower' ? b.v : null;
    cv.style.cursor = b ? 'pointer' : 'grab';
    return
  }
  if (GF.active()) {
    GF.move(e);
    pts.set(e.pointerId, e);
    return
  }
  if (window.SI && SI.dragging()) {
    SI.move(e);
    pts.set(e.pointerId, e);
    return
  }
  if (drag) {
    flowerMove(e);
    pts.set(e.pointerId, e);
    return
  }
  if (pts.size == 2) {
    const [a, b] = [...pts.values()], ox = (a.clientX + b.clientX) / 2, oy = (a.clientY + b.clientY) / 2, od = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pts.set(e.pointerId, e);
    const [c, d] = [...pts.values()], nd = Math.hypot(c.clientX - d.clientX, c.clientY - d.clientY);
    thG -= ((c.clientX + d.clientX) / 2 - ox) * .006;
    phG = Math.min(1.4, Math.max(.35, phG - ((c.clientY + d.clientY) / 2 - oy) * .005));
    if (nd > 8 && od > 8) radG = Math.min(64, Math.max(4.5, radG * od / nd));
    moved = 99;
    panV.x = panV.z = 0;
    return
  }
  const dx = e.clientX - p.clientX,
    dy = e.clientY - p.clientY;
  moved += Math.abs(dx) + Math.abs(dy);
  if (e.pointerType == 'mouse' && e.buttons & 2) {
    thG -= dx * .006;
    phG = Math.min(1.4, Math.max(.35, phG - dy * .005))
  } else pan(dx, dy, e.pointerType == 'mouse');
  pts.set(e.pointerId, e)
});
cv.addEventListener('pointerup', e => {
  pts.delete(e.pointerId);
  if (!pts.size) {
    panning = false;
    if (performance.now() - panT > 90 || moved < 6 || drag) panV.x = panV.z = 0
  }
  if (GF.active()) {
    panV.x = panV.z = 0;
    GF.up();
    return
  }
  if (window.SI && SI.dragging()) {
    panV.x = panV.z = 0;
    SI.up();
    return
  }
  if (drag) {
    const d = drag,
      f = flowers[d],
      en = S.e[d];
    drag = null;
    selRing.visible = false;
    if (f && en) {
      if (dm > 2 && dragOK) {
        en.x = f.position.x;
        en.z = f.position.z;
        f.position.y = gh(en.x, en.z);
        save();
        sfx('move');
        toast(tr('moved'))
      } else {
        slideBack(d, dragO);
        camBack();
        if (dm > 2) {
          sfx('deny');
          toast(tr('badSpot'))
        }
      }
    } /* 不合法：滑回原本的位置，並提示 */
    return
  }
  if (moved < 6 && !pts.size && (e.pointerType != 'mouse' || e.button == 0)) {
    const b = hitTest(e);
    let hd = false;
    if (b) {
      hd = true;
      switch (b.k) {
        case 'gift':
          GF.openGift(b.v);
          break;
        case 'decor':
          GF.decorCard(b.v);
          break;
        case 'cr':
          pokeG(b.v);
          break;
        case 'flower':
          sfx('flower');
          detail(b.v);
          break;
        case 'si':
          hd = !!SI.click(e);
          break;
        case 'rv':
          RV.open();
          break;
        case 'mb':
          MB.open();
          break;
        case 'wi':
          WI.open();
          break;
        case 'home':
          HOMEI.open();
          break
      }
    }
    if (!hd) $('card').hidden = true
  }
});
cv.addEventListener('pointercancel', e => {
  pts.delete(e.pointerId);
  if (!pts.size) {
    panning = false;
    panV.x = panV.z = 0
  }
  if (drag) {
    const d = drag;
    drag = null;
    selRing.visible = false;
    slideBack(d, dragO);
    camBack()
  }
  if (GF.active()) {
    GF.cancel();
    camBack()
  }
  if (window.SI && SI.dragging()) {
    SI.cancel();
    camBack()
  }
});
cv.addEventListener('contextmenu', e => e.preventDefault());
const lpSet = e => ({
  clientX: e.clientX,
  clientY: e.clientY,
  pointerId: e.pointerId,
  pointerType: e.pointerType
});
cv.addEventListener('pointerdown', e => {
  if (isDragging()) {
    lp = lpSet(e);
    lp0 = lp;
    edgeT = 0;
    edgeOn = false;
    tgG0 = tgG.clone()
  }
});
cv.addEventListener('pointermove', e => {
  if (lp && isDragging()) lp = lpSet(e)
});
const lpEnd = () => {
  lp = lp0 = null;
  edgeT = 0;
  edgeOn = false
};
cv.addEventListener('pointerup', lpEnd);
cv.addEventListener('pointercancel', lpEnd);
cv.addEventListener('mousedown', e => {
  if (e.button == 1) e.preventDefault()
});
/* 平移：手指移動量乘上增益；滑得越快放大越多；拉近時也不會變得太慢（距離下限 12） */
function pan(dx, dy, mouse) {
  if (mouse) {
    /* 電腦滑鼠：維持原本靈敏度，不加速、不慣性 */
    const k = 2 * Math.tan(cam.fov * Math.PI / 360) * rad / innerHeight,
      s = Math.sin(th),
      c = Math.cos(th),
      mx = -dx * k * c - dy * k * 1.2 * s,
      mz = dx * k * s - dy * k * 1.2 * c;
    tgG.x = Math.min(PANX, Math.max(-9, tgG.x + mx));
    tgG.z = Math.min(15, Math.max(-19, tgG.z + mz));
    panV.x = panV.z = 0;
    return
  }
  const now = performance.now(),
    dt = Math.max(8, Math.min(100, now - panT)) / 1000;
  panT = now;
  const boost = 1 + Math.min(.6, Math.hypot(dx, dy) / dt / 2500),
    k = 2 * Math.tan(cam.fov * Math.PI / 360) * Math.max(rad, 10) / innerHeight * PAN_GAIN * boost,
    s = Math.sin(th),
    c = Math.cos(th),
    mx = -dx * k * c - dy * k * 1.2 * s,
    mz = dx * k * s - dy * k * 1.2 * c;
  tgG.x = Math.min(PANX, Math.max(-9, tgG.x + mx));
  tgG.z = Math.min(15, Math.max(-19, tgG.z + mz));
  panV.x = Math.max(-40, Math.min(40, panV.x * .5 + mx / dt * .5));
  panV.z = Math.max(-40, Math.min(40, panV.z * .5 + mz / dt * .5))
}
cv.addEventListener('wheel', e => {
  e.preventDefault();
  radG = Math.min(64, Math.max(4.5, radG * (1 + e.deltaY * .001)))
}, {
  passive: false
});
