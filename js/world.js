/* ============================================================================
 * js/world.js — 3D 世界基礎：渲染器、場景、雙花園幾何
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・建立 WebGL 渲染器（R）與場景（scene、cam），沒有 WebGL 時 ok=false，其
 *     餘功能仍可使用（月曆等）。
 *   ・畫質偵測（gqNow）、地形高度函式 gh、雙花園的幾何（圓形花園 G1、不規則花
 *     園 G2、橋）、障礙物與是否可放花（legalSpot）、隨機取點與小動物走路路線
 *     （rndPt、planRoute）。
 *
 * 需要先載入：state.js
 * 提供給其他檔案：R、ok、gqNow、scene、cam、flowers、gh、G1R、BASE2、GAP、
 *   rho2、G2、MX、BA、BB、BW、STAR、HOMEP、PANX、WXB、inG1、inG2、onBridge、
 *   deckY、surf、walk、zoneAt、at2、WM、BN…等共 40 項
 * 載入順序：第 10 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- 3D ---------- */
let R, ok = true;
/* 畫質：使用者沒選過時，手機／小螢幕預設「中」，電腦預設「高」 */
function gqNow() {
  const q = S.gq;
  if (q === 'low' || q === 'mid' || q === 'high') return q;
  try {
    return (matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 700) ? 'mid' : 'high'
  } catch (e) {
    return 'high'
  }
}
window.GQaa0 = gqNow() === 'high';
try {
  R = new THREE.WebGLRenderer({
    canvas: $('c'),
    antialias: window.GQaa0,
    alpha: true,
    powerPreference: 'high-performance'
  })
} catch (e) {
  ok = false;
  $('fb').hidden = false
}
const scene = new THREE.Scene(),
  cam = new THREE.PerspectiveCamera(42, 1, .1, 220),
  flowers = {};
const gh = (x, z) => .22 * Math.sin(x * .55) * Math.cos(z * .45) + .12 * Math.sin(x * .9 + z * .7);
/* ---------- 雙花園幾何：圓形花園 G1 + 不規則花園 G2 + 橋 ----------
   G1 以原點為中心、半徑 8；G2 的邊界由 rho2(角度) 決定（有點像三葉草）。
   兩座花園沿 x 軸並排，中間隔著一段空隙，橋沿 z=0 跨過去。 */
const G1R = 8,
  BASE2 = 6.4,
  GAP = 4.4;
const rho2 = a => BASE2 * (1 + .14 * Math.sin(2 * a + .9) + .1 * Math.sin(3 * a + 2.2) + .07 * Math.sin(5 * a + .4));
const G2 = {
  x: G1R + GAP + rho2(Math.PI),
  z: 0
};
const MX = (-G1R + G2.x + rho2(0)) / 2; // 兩座花園的中央 x（相機、天氣、光源共用）
const BA = 6.7,
  BB = G2.x - .82 * rho2(Math.PI),
  BW = .75; // 橋面起訖 x 與半寬
const STAR = {
  x: G2.x + 8.6,
  z: -9.6,
  R: 3.3
};
const HOMEP = {
  x: G2.x + 8.6,
  z: 9.6,
  R: 3.3
}; // 小動物之家：第二座花園的右下方（+z＝下）                   // 星願島：第二座花園的右上方（+x＝右、-z＝上）
const PANX = Math.max(G2.x + rho2(0) + 1, STAR.x + 1); // 鏡頭可以平移到的最右邊
const WXB = {
  x0: -9.5,
  x1: Math.max(G2.x + rho2(0) + 1.5, STAR.x + STAR.R + 1),
  z: 27
}; // 雨、花瓣的範圍：涵蓋兩座花園與星願島
const inG1 = (x, z, r) => Math.hypot(x, z) <= r;
const inG2 = (x, z, f) => Math.hypot(x - G2.x, z - G2.z) <= rho2(Math.atan2(z - G2.z, x - G2.x)) * f;
const onBridge = (x, z, w) => Math.abs(z) < w && x > BA && x < BB;
const deckY = x => {
  const u = Math.min(1, Math.max(0, (x - BA) / (BB - BA)));
  return gh(BA, 0) * (1 - u) + gh(BB, 0) * u + .03 + .3 * Math.sin(Math.PI * u)
};
const surf = (x, z) => onBridge(x, z, .8) ? deckY(x) : gh(x, z); // 走路的小動物踩的高度（橋面或地面）
const walk = (x, z) => inG1(x, z, 7.15) || inG2(x, z, .9) || onBridge(x, z, .58); // 小動物可以走的地方
const zoneAt = (x, z) => inG1(x, z, 7.15) ? 1 : inG2(x, z, .9) ? 2 : onBridge(x, z, .8) ? 3 : 0;
const at2 = (f, a) => {
  const r = rho2(a) * f;
  return [G2.x + Math.cos(a) * r, G2.z + Math.sin(a) * r]
};
const WM = at2(.64, -1),
  BN = at2(.7, 1.55),
  MU2 = [at2(.8, 1.0), at2(.74, -.8), at2(.8, -2.0)],
  RK2 = [
    [...at2(.8, -2.8), .5],
    [...at2(.78, 2.0), .4],
    [...at2(.74, -.3), .45]
  ],
  PD2 = [
    [...at2(.42, .6), 1.3],
    [...at2(.48, -2.45), 1.0],
    [...at2(.58, 2.35), .85]
  ];
/* 不能放花的障礙物（圓形）：x, z, 半徑 */
const OBS = [
  [-2.7, -5.4, 1.5],
  [3.2, -5.2, .45],
  [5.6, -1.5, .45],
  [-2, -6, .5],
  [-3.4, 4.9, .6],
  [6, 3, .45],
  [-6.2, -2.4, .55],
  [WM[0], WM[1], 1.3],
  [BN[0], BN[1], .9], ...MU2.map(p => [p[0], p[1], .45]), ...RK2
];
/* 這個位置可不可以放花：必須在某座花園的柵欄內側，且不在橋頭通道、障礙物或別朵花上 */
function legalSpot(x, z, self) {
  if (!(inG1(x, z, 6.9) || inG2(x, z, .84))) return false; // 空中、橋上、柵欄外
  if (Math.abs(z) < 1.3 && ((x > 4.9 && x < 8) || (x > BB - .5 && x < BB + 2))) return false; // 橋頭通道要保持暢通
  if (OBS.some(o => Math.hypot(x - o[0], z - o[1]) < o[2])) return false;
  for (const d in flowers) {
    if (d === self) continue;
    const f = flowers[d];
    if (Math.hypot(f.position.x - x, f.position.z - z) < .55) return false
  }
  if ((window.GIFTP || []).some(o => Math.hypot(o.to.x - x, o.to.z - z) < .45)) return false; // 別壓到還沒拆的禮物
  if ((window.DEC || []).some(o => Math.hypot(x - o.x, z - o.z) < o.r + .3)) return false; // 別壓到裝飾品
  return true
}
/* 隨機挑一個兩座花園內的點（約 58% 在 G1） */
function rndPt() {
  const a = Math.random() * 6.283;
  if (Math.random() < .58) {
    const r = Math.sqrt(Math.random()) * 6.2;
    return [Math.cos(a) * r, Math.sin(a) * r]
  }
  const r = Math.sqrt(Math.random()) * .82 * rho2(a);
  return [G2.x + Math.cos(a) * r, G2.z + Math.sin(a) * r]
}
/* 走路的小動物要換花園時，先走到橋頭，過橋，再去目標 */
const E1 = new THREE.Vector3(6.4, 0, 0),
  E2 = new THREE.Vector3(BB - .25, 0, 0);

function planRoute(u, p) {
  const a = zoneAt(p.x, p.z),
    b = zoneAt(u.tg.x, u.tg.z);
  u.wp = null;
  if (!a || !b || a === b || b === 3) return;
  if (a === 3) u.wp = [(b === 1 ? E1 : E2).clone()];
  else u.wp = a === 1 ? [E1.clone(), E2.clone()] : [E2.clone(), E1.clone()]
}
