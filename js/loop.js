/* ============================================================================
 * js/loop.js — 花朵拖曳、邊緣捲動與每幀主迴圈
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・「佈置」時拖曳花朵（flowerMove）與拖到畫面邊緣時視野自動跟著移動
 *     （edgeStep／edgeFollow）。
 *   ・frame()：每一幀的主迴圈，更新鏡頭、花朵、動物、粒子、天氣、禮物等並渲
 *     染；睡眠模式時會暫停，並依畫質限制幀率。檔案末尾啟動迴圈。
 *
 * 需要先載入：audio.js、state.js、i18n.js、world.js、three-utils.js、
 *   flowers.js、flower-care.js、garden-scene.js、camera.js、creatures.js、
 *   weather.js、particles.js、gifts.js
 * 提供給其他檔案：fh、flowerMove、lp、lp0、edgeT、camSig、edgeOn、tgG0、
 *   camBack、isDragging、edgeStep、edgeFollow、frame
 * 載入順序：第 20 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

let fh = false;
SLP.cbs.push(() => {
  if (fh) {
    fh = false;
    clock.getDelta();
    frame()
  }
});

function flowerMove(e, quiet) {
  const f = flowers[drag];
  if (f) {
    mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(mv, cam);
    const o = ray.ray.origin,
      dr = ray.ray.direction;
    let x = f.position.x,
      z = f.position.z,
      sky = true;
    if (dr.y < -.01) {
      const k = -o.y / dr.y;
      x = o.x + dr.x * k;
      z = o.z + dr.z * k;
      const k2 = (gh(x, z) - o.y) / dr.y;
      x = o.x + dr.x * k2;
      z = o.z + dr.z * k2;
      sky = false;
      const l = Math.hypot(x - MX, z);
      if (l > 40) {
        x = MX + (x - MX) * 40 / l;
        z *= 40 / l;
        sky = true
      }
    }
    dragOK = !sky && legalSpot(x, z, drag); /* 空中、橋上、柵欄外、障礙物、別朵花上都不行 */
    f.position.set(x, gh(x, z) + (dragOK ? 0 : .3), z);
    if (!quiet) dm++;
    selRing.position.set(x, gh(x, z) + .05, z);
    selRing.material.color.set(dragOK ? '#F29BB5' : '#E8685F')
  }
}

/* ---- 佈置時拖到畫面邊緣：視野跟著往那個方向移動（花朵、裝飾品、星願島的花都適用）----
   靠邊越近越快；要先停在邊緣一小段時間才會開始，避免誤觸；視野移動時被拖的東西會一直黏在手指／游標下。 */
let lp = null,
  lp0 = null,
  edgeT = 0,
  camSig = 0,
  edgeOn = false,
  tgG0 = null;

function camBack() {
  if (edgeOn && tgG0) {
    tgG.copy(tgG0);
    panV.x = panV.z = 0
  }
  edgeOn = false
}
const isDragging = () => !!drag || GF.active() || !!(window.SI && SI.dragging());

function edgeStep(dt) {
  if (!lp || !isDragging()) {
    edgeT = 0;
    return
  }
  if (Math.hypot(lp.clientX - lp0.clientX, lp.clientY - lp0.clientY) < 10) {
    edgeT = 0;
    return
  } /* 還沒真的拖動就不捲 */
  const W = innerWidth,
    H = innerHeight,
    Z = Math.min(110, Math.max(48, Math.min(W, H) * .12));
  let bot = H;
  const nv = document.querySelector('nav');
  if (nv) {
    const r = nv.getBoundingClientRect();
    if (r.height > 0 && r.top > H * .5) bot = r.top
  }
  const ax = (v, lo, hi) => {
    const a = v < lo ? -(1 - v / lo) : v > hi ? (v - hi) / (W - hi) : 0;
    const m = Math.min(1, Math.abs(a));
    return Math.sign(a) * m * m * (3 - 2 * m)
  };
  const sx = ax(lp.clientX, Z, W - Z);
  /* 上方的觸發線＝上方 UI（logo、日期、「今天感覺如何」面板；電腦版還有頂端選單列）的下緣再往下一點點：
     使用者會直覺地把 UI 的下緣當成畫面上緣，所以手指／游標碰到那條線就開始捲動，越往上越快。 */
  let uiTop = 0;
  document.querySelectorAll('.logo,#date,nav,.hello').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0 || r.top >= H * .5) return;
    if (el.classList.contains('hello') && (lp.clientX < r.left - 16 || lp.clientX > r.right + 16)) return; /* 「今天感覺如何」面板在電腦版只佔左邊，手指不在它旁邊就不算 */
    uiTop = Math.max(uiTop, r.bottom)
  });
  const tTop = Math.min(H * .3, Math.max(Z, uiTop + 10)),
    tz = Math.max(24, Z * .6);
  const sy = (() => {
    const b = bot - Z;
    const a = lp.clientY < tTop ? -Math.min(1, (tTop - lp.clientY) / tz) : lp.clientY > b ? Math.min(1, (lp.clientY - b) / Z) : 0;
    const m = Math.min(1, Math.abs(a));
    return Math.sign(a) * m * m * (3 - 2 * m)
  })();
  if (!sx && !sy) {
    edgeT = 0;
    return
  }
  edgeT += dt;
  const g = Math.min(1, edgeT / .3);
  const SP = 560 * g,
    kk = 2 * Math.tan(cam.fov * Math.PI / 360) * Math.max(radG, 10) / H,
    s = Math.sin(th),
    c = Math.cos(th),
    px = sx * SP * dt,
    py = sy * SP * dt;
  edgeOn = true;
  tgG.x = Math.min(PANX, Math.max(-9, tgG.x + px * kk * c + py * kk * 1.2 * s));
  tgG.z = Math.min(15, Math.max(-19, tgG.z - px * kk * s + py * kk * 1.2 * c));
  panV.x = panV.z = 0
}

function edgeFollow() {
  if (!lp || !isDragging() || !edgeOn) return;
  const sig = cam.position.x * 1.3 + cam.position.y * 1.7 + cam.position.z * 2.1;
  if (Math.abs(sig - camSig) < 1e-6) return;
  camSig = sig;
  cam.updateMatrixWorld(true);
  if (drag) flowerMove(lp, true);
  else if (GF.active()) GF.move(lp, true);
  else if (window.SI && SI.dragging()) SI.move(lp, true)
}

function frame() {
  if (SLP.on) {
    fh = true;
    return
  }
  requestAnimationFrame(frame);
  /* 幀率上限：iPhone Pro 是 120Hz，不限制的話每秒要畫 120 次；低＝30、中＝60、高＝不限制 */
  {
    const _n = performance.now(),
      _m = window.GQmin || 0;
    if (_m && _n - (window._lr || 0) < _m * .9) return;
    window._lr = _n
  }
  const dt = Math.min(clock.getDelta(), .05),
    t = clock.elapsedTime,
    rm = S.rm,
    k = rm ? 1 : 1 - Math.pow(.003, dt);
  /* 放開手指後的慣性滑行 */
  if (!panning && (Math.abs(panV.x) > .1 || Math.abs(panV.z) > .1)) {
    if (S.rm) panV.x = panV.z = 0;
    else {
      tgG.x = Math.min(PANX, Math.max(-9, tgG.x + panV.x * dt));
      tgG.z = Math.min(15, Math.max(-19, tgG.z + panV.z * dt));
      const d = Math.pow(.015, dt);
      panV.x *= d;
      panV.z *= d
    }
  }
  edgeStep(dt);
  tg.lerp(tgG, k);
  rad += (radG - rad) * k;
  th += (thG - th) * k;
  ph += (phG - ph) * k;
  cam.position.set(tg.x + rad * Math.sin(ph) * Math.sin(th), tg.y + rad * Math.cos(ph), tg.z + rad * Math.sin(ph) * Math.cos(th));
  cam.lookAt(tg);
  edgeFollow();
  for (const d in flowers) {
    const f = flowers[d],
      u = f.userData;
    if (u.ryT != null) {
      const df = u.ryT - f.rotation.y;
      if (rm || Math.abs(df) < .002) f.rotation.y = u.ryT;
      else f.rotation.y += df * Math.min(1, dt * 12)
    }
    faceUpdate(f, t, dt);
    if (u.dr) u.dr.visible = WX.wet > .25 && u.st === 1;
    if (u.dry) u.dry.visible = WX.wet > .25 && u.st === 0;
    if (!rm) {
      const w = .5 + WX.wind * 1.1;
      f.rotation.z = Math.sin(t * (1 + w * .5) + u.ph) * .03 * w;
      u.h.rotation.z = u.hy.rotation.z = Math.sin(t * (1.4 + w * .6) + u.ph) * .045 * w
    }
    if (!P || P.d !== d) {
      const s = u.base * (hover === d ? 1.12 : 1);
      f.scale.x += (s - f.scale.x) * .15;
      f.scale.y += (s - f.scale.y) * .15;
      f.scale.z = f.scale.x
    }
  }
  if (!rm) {
    if (window.mts) mts.forEach((p, j) => {
      p.rotation.y += dt * (.03 + j * .02);
      p.position.y = Math.sin(t * .5 + j * 2) * .15;
      p.material.opacity = window.glowF * (.55 + Math.sin(t * 1.7 + j * 2.4) * .35)
    });
    cr.forEach(c => crStep(c, dt, t));
    cl.forEach(c => {
      c.position.x += dt * c.userData.s;
      if (c.position.x > 50) c.position.x = -32
    });
    bf.forEach(b => {
      const u = b.userData;
      if (u.bee) {
        beeStep(b, dt, t);
        return
      }
      const s = .28,
        a = t * s + u.i * 2,
        x = Math.cos(a) * 5.2 * (u.bee ? .8 : 1),
        z = Math.sin(a * 1.3) * 4.4,
        y = (u.bee ? 1 : 1.5) + Math.sin(t * 1.1 + u.i) * .35;
      b.position.set(x, y, z);
      b.rotation.y = -Math.atan2(-Math.sin(a * 1.3) * 1.3 * 4.4, -Math.sin(a) * 5.2) + Math.PI / 2;
      if (!u.bee) {
        const w = Math.sin(t * 16 + u.i) * .9;
        u.w[0].rotation.z = w;
        u.w[1].rotation.z = -w
      }
    })
  }
  partStep(dt);
  wxFrame(dt, t, rm);
  slideStep(dt);
  stageStep(t, dt);
  GF.step(t, dt, rm);
  if (window.WMB && !rm) WMB.rotation.z -= dt * (.4 + WX.wind * 1.3);
  if (P) {
    P.t += rm ? dt * 8 : dt;
    const f = flowers[P.d];
    setGrow(f, Math.min(1, (P.t - 1.2) / 3));
    P.seed.visible = P.t < 1.1;
    P.seed.position.y = Math.max(.05, 2 - P.t * 2.2) + f.position.y;
    if (sparkle) {
      const a = sparkle.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) a.setY(i, a.getY(i) + dt * .4);
      a.needsUpdate = true;
      sparkle.material.opacity = Math.max(0, Math.min(1, (P.t - .9) * 2, (5 - P.t)))
    }
    if (P.t > 3.9 && !P.toast) {
      P.toast = 1;
      sfx('bloom');
      toast(tr('bloomed'))
    }
    if (P.t > 5) {
      scene.remove(P.seed, P.hole, sparkle);
      freeObj(sparkle);
      sparkle = null;
      setGrow(f, 1);
      P = null;
      radG = Math.min(64, radG * 1.75)
    }
  }
  if (ok) R.render(scene, cam)
}
if (ok) frame();
