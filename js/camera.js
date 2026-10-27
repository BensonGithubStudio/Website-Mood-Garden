/* ============================================================================
 * js/camera.js — 鏡頭、畫質與首頁視角
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・軌道鏡頭的狀態（旋轉 th／ph、距離 rad 與其目標值）、視窗縮放
 *     （resize）。
 *   ・畫質三檔（低／中／高）的套用 applyGQ：解析度、陰影、幀率上限、地面凹凸
 *     與雨滴漣漪。
 *   ・首頁視角計算（homeCalc／home／homeSoft）：依視窗大小算出剛好看到兩座花
 *     園的距離，以及關閉小島介面時的小幅拉遠。
 *
 * 需要先載入：world.js、garden-scene.js
 * 提供給其他檔案：th、ph、thG、phG、rad、radG、tg、tgG、resize、GQP、
 *   homeCalc、homeRad、home、homeSoft、GQU、GQmin、GQrip、GQsh、applyGQ
 * 載入順序：第 15 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

let th=.75,ph=1,thG=.75,phG=1,rad=innerWidth<760?28:14,radG=rad;/* thG/phG：旋轉的目標角度，th/ph 會慢慢追上去 */const tg=new THREE.Vector3(0,.4,0),tgG=tg.clone();
function resize(){if(!ok)return;R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.fov=innerWidth<innerHeight?58:42;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
/* ===== 畫質套用（低／中／高）：解析度、陰影、幀率上限、地面凹凸與雨滴漣漪 ===== */
const GQP={low:{pr:1,sh:0,ms:0,fps:30,bump:0,rip:0},mid:{pr:1.5,sh:1,ms:1024,fps:60,bump:1,rip:1},high:{pr:2,sh:1,ms:2048,fps:0,bump:1,rip:1}};
window.GQU={uBmp:{value:1}};window.GQmin=0;window.GQrip=1;
window.GQsh=function(){if(!ok||!window.SUN||!window.MOON)return;const c=GQP[gqNow()];[SUN,MOON].forEach(l=>{l.castShadow=!!c.sh;l.shadow.autoUpdate=l.intensity>.02})};
window.applyGQ=function(){if(!ok)return;const q=gqNow(),c=GQP[q];document.body.dataset.gq=q;
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,c.pr));resize();
  [[window.SUN,c.ms],[window.MOON,Math.min(c.ms,1024)]].forEach(([l,ms])=>{if(!l||!ms)return;if(l.shadow.mapSize.x!==ms){l.shadow.mapSize.set(ms,ms);if(l.shadow.map){l.shadow.map.dispose();l.shadow.map=null}}});
  GQsh();GQU.uBmp.value=c.bump;window.GQrip=c.rip;window.GQmin=c.fps?1000/c.fps:0};
applyGQ();
/* 預設視角：橫向螢幕沿著兩座花園的連線看；偏方形或直向螢幕改成從 G1 往 G2 看過去，這樣兩座花園都在畫面裡 */
const homeCalc=()=>{const t=Math.tan(cam.fov*Math.PI/360),as=innerWidth/innerHeight,dh=19.2*.93/(t*as),dr=Math.max(10.8/(t*as),19.3*.54/t);return{h:dh<=dr,d:Math.min(60,Math.max(18,Math.min(dh,dr)))}};
const homeRad=()=>homeCalc().d,home=()=>{tgG.set(MX,.4,0);radG=homeRad()};
/* 關閉小島介面：不回 home 視角，鏡頭維持在目前看的位置，只小幅拉遠（最多拉到 home 的距離，已經比較遠就不動） */
const homeSoft=()=>{radG=Math.max(radG,Math.min(radG*1.5,homeRad()))};
if(ok){const hc=homeCalc();th=thG=hc.h?.4:-1.15;phG=ph;tg.set(MX,.4,0);tgG.copy(tg);rad=radG=hc.d}
