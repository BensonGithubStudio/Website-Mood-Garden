/* ============================================================================
 * js/three-utils.js — three.js 小工具：共用材質與形狀
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・shade（幫幾何加上由上到下的明暗頂點色）、共用的球／圓柱幾何（SPH、
 *     CYL）、材質快取 mat、mk（建立網格）、ring。
 *   ・own／freeObj：只標記並釋放「某個物件專屬」的幾何與材質（共用的不會被動
 *     到），避免移除花朵／裝飾後顯存累積。
 *
 * 需要先載入：log.js
 * 提供給其他檔案：shade、SPH、CYL、mc、mat、own、freeObj、mk、ring、bellG、
 *   TOR、FS
 * 載入順序：第 11 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

function shade(g, lo = .72) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const v = lo + (1 - lo) * (n.getY(i) * .5 + .5);
    a[i * 3] = a[i * 3 + 1] = a[i * 3 + 2] = v
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g
}
const SPH = shade(new THREE.SphereGeometry(1, 28, 18)),
  CYL = shade(new THREE.CylinderGeometry(1, 1, 1, 14), .8),
  mc = {};
const mat = (c, vc) => {
  const k = c + (vc ? 1 : 0);
  return mc[k] || (mc[k] = new THREE.MeshStandardMaterial({
    color: c,
    roughness: .88,
    vertexColors: !!vc,
    emissive: new THREE.Color(c).multiplyScalar(.13)
  }))
};
/* 釋放顯存：只處理用 own() 標記的「這個物件專屬」的幾何/材質；共用的（快取材質 mat()、共用幾何）不會被動到 */
const own = x => {
  x.userData = x.userData || {};
  x.userData.own = true;
  return x
};

function freeObj(o) {
  if (!o) return;
  try {
    o.traverse(n => {
      const g = n.geometry;
      if (g && g.userData && g.userData.own) g.dispose();
      const m = n.material;
      (Array.isArray(m) ? m : [m]).forEach(x => {
        if (x && x.userData && x.userData.own) x.dispose()
      })
    })
  } catch (e) {
    logErr(e)
  }
}

function mk(g, c, p, s, r, m) {
  const o = new THREE.Mesh(g, m || mat(c, !!g.attributes.color));
  o.position.set(...p);
  o.scale.set(...s);
  if (r) o.rotation.set(...r);
  o.castShadow = true;
  return o
}

function ring(h, n, r, y, s, tilt, c) {
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283,
      pv = new THREE.Group();
    pv.rotation.y = a;
    pv.position.y = y;
    pv.add(mk(SPH, c, [r, 0, 0], s, [0, 0, tilt]));
    h.add(pv)
  }
}
const bellG = shade(new THREE.LatheGeometry([
  [.02, 0],
  [.09, -.05],
  [.14, -.14],
  [.2, -.26],
  [.17, -.28]
].map(p => new THREE.Vector2(...p)), 22));
const TOR = new THREE.TorusGeometry(1, .22, 8, 18, Math.PI),
  FS = {
    happy: [.21, .07, .1, '#FFE08A'],
    excited: [.15, .14, .02, '#FFD6AE'],
    calm: [.15, .04, .07, '#FFF0B0'],
    loved: [.14, .17, .02, '#FFCADB'],
    sad: [.14, 0, .02, '#D8E8FA'],
    anxious: [.13, .38, .02, '#E9E0F8']
  };
