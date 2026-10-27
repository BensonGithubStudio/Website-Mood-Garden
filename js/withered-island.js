/* ============================================================================
 * js/withered-island.js — 凋零小島
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・被鏟除的凋零花朵搬到這座小島，點小島可以翻看所有凋零花朵的心情與文字。
 *   ・建造方式與兩座花園相同（極座標地面、土壤側壁、柵欄）；對外以 window.WI
 *     提供（open、refresh、onApply…）。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、flowers.js、camera.js、creatures.js、weather.js
 * 提供給其他檔案：WI
 * 載入順序：第 29 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 凋零小島 =====
   凋零的花被鏟除後，會搬到這座小島上安靜地待著；點小島可以翻看所有凋零花朵的心情與文字。
   建造方式與兩座花園相同（極座標地面 + 土壤側壁 + 柵欄），形狀是一座偏圓的小島，放在花園後方。
   這個區塊獨立運作：沒有 WebGL 時整段跳過；不動花園、花朵、動物、天氣、同步等任何原有功能。 */
(function(){
'use strict';
if(typeof ok==='undefined'||!ok||typeof scene==='undefined'||typeof THREE==='undefined')return;
const T=THREE,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=s=>()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;

/* ---------- 位置與形狀 ---------- */
const RW=3.7,WIX=.5,WIZ=-14.3,MAXP=24;                                   // 島的半徑、位置；島上最多同時擺幾朵（更多的在視窗裡看得到）
const rho=a=>RW*(1+.1*Math.sin(2*a+.4)+.08*Math.sin(3*a+1.7)+.05*Math.sin(5*a+.9));
const hh=(x,z)=>.05*Math.sin(x*1.3+.4)*Math.cos(z*1.1);                 // 島上微微的起伏（相對於島的高度）
const isl=new T.Group();isl.position.set(WIX,.1,WIZ);scene.add(isl);
const K=window.SKIN||null;
const sway=[];
const rock=m=>{if(K){m.geometry=K.RKG;m.material=K.SM(m.material,'rk',K.V(K.TS,'s',2,2),{roughness:.92,bumpScale:3})}return m};
/* 樹皮：沿用花園的樹幹形狀與樹皮貼圖 */
const bark=m=>{if(K){m.geometry=K.TRUNK;m.material=K.SM(m.material,'bk',K.V(K.TB,'b',1,1),{roughness:.95,bumpScale:1.5})}return m};
/* 低多邊形的真葉片（沿用花園樹葉的做法：不貼圖、平面著色、雙面） */
const LEAF=(()=>{const V3=[[-1,0,0],[0,1,0],[1,.1,0],[-.15,-.5,-1],[-.15,-.5,1]],L=[.8,1,.9,.74,.74],T3=[[0,3,1],[0,1,4],[1,3,2],[1,4,2]],P=[],C=[];
  T3.forEach(t=>t.forEach(i=>{P.push(...V3[i]);C.push(L[i],L[i],L[i])}));
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();return g})();
const leafMat=o=>new T.MeshStandardMaterial(Object.assign({roughness:.85,flatShading:true,side:2},o||{}));
const leaf=m=>{if(K){m.geometry=LEAF;m.material=K.SM(m.material,'lf',null,{roughness:.85,flatShading:true,side:2})}return m};

/* 草地（整片都是乾裂的土地，沿用花園的地面材質） */
{const KR=22,SG=72,c1=new T.Color('#8F7352'),c2=new T.Color('#B09470'),cc=new T.Color(),pos=[0,hh(0,0),0],col=[],idx=[];
  const paint=(x,z,dirt)=>{const n=(Math.sin(x*.9)*Math.cos(z*1.1)+Math.sin(x*.3+z*.5))*.25+.5;cc.copy(c1).lerp(c2,clamp(n,0,1));if(dirt)cc.set('#B79B76');col.push(cc.r,cc.g,cc.b)};
  paint(WIX,WIZ,false);
  for(let k=1;k<=KR;k++){const f=k/KR;for(let i=0;i<SG;i++){const a=i/SG*6.2832,r=rho(a)*f,x=Math.cos(a)*r,z=Math.sin(a)*r;pos.push(x,k===KR?-.2:hh(x,z)-.1*f*f,z);paint(WIX+x,WIZ+z,f>.97)}}
  for(let i=0;i<SG;i++)idx.push(0,1+(i+1)%SG,1+i);
  for(let k=0;k<KR-1;k++)for(let i=0;i<SG;i++){const a=1+k*SG+i,b=1+k*SG+(i+1)%SG,c=a+SG,d=b+SG;idx.push(a,b,c,b,d,c)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const gm=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,vertexColors:true});if(K)K.skinGround(gm);
  const gr=new T.Mesh(g,gm);gr.receiveShadow=true;isl.add(gr)}
/* 島的側壁與底部 */
{const SG=72,sp=[],si=[],uv=[];
  for(let i=0;i<SG;i++){const a=i/SG*6.2832,r=rho(a),x=Math.cos(a),z=Math.sin(a);sp.push(x*r*1.012,-.2,z*r*1.012,x*r*.85,-1.6,z*r*.85);uv.push(i/SG*3,1,i/SG*3,0)}
  for(let i=0;i<SG;i++){const j=(i+1)%SG;si.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(sp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(si);g.computeVertexNormals();
  let m=new T.MeshStandardMaterial({color:'#E3C9A8',roughness:.88,side:2,emissive:new T.Color('#E3C9A8').multiplyScalar(.13)});
  if(K)m=K.SM(m,'so',K.V(K.TSo,'o',1,1),{roughness:.95,bumpScale:1.5});
  const sk=new T.Mesh(g,m);sk.castShadow=true;isl.add(sk);
  const cp=[0,-1.75,0],ci=[];for(let i=0;i<SG;i++)cp.push(sp[i*6+3],sp[i*6+4],sp[i*6+5]);for(let i=0;i<SG;i++)ci.push(0,1+i,1+(i+1)%SG);
  const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(cp,3));cg.setIndex(ci);cg.computeVertexNormals();isl.add(new T.Mesh(cg,new T.MeshStandardMaterial({color:'#D9BD98',roughness:.9,side:2})))}
/* 柵欄：沿著邊界等距放柱子，有幾段欄杆掉了，看起來舊舊的 */
{const M2=360,poly=[];for(let i=0;i<=M2;i++){const a=i/M2*6.2832,r=rho(a)*.93;poly.push([Math.cos(a)*r,Math.sin(a)*r])}
  const cum=[0];for(let i=1;i<=M2;i++)cum.push(cum[i-1]+Math.hypot(poly[i][0]-poly[i-1][0],poly[i][1]-poly[i-1][1]));
  const tot=cum[M2],n=Math.round(tot/.654),step=tot/n,P=[];let kq=1;
  for(let j=0;j<n;j++){const dd=j*step;while(kq<M2&&cum[kq]<dd)kq++;const t=(dd-cum[kq-1])/Math.max(1e-6,cum[kq]-cum[kq-1]);P.push([poly[kq-1][0]+(poly[kq][0]-poly[kq-1][0])*t,poly[kq-1][1]+(poly[kq][1]-poly[kq-1][1])*t])}
  /* 木紋貼圖沿用花園柵欄：柱子用直紋、欄杆用橫紋，tiling 一樣不要太密；柱頭小球跟花園一樣帶一點光澤 */
  const bx=new T.BoxGeometry(1,1,1),em=new T.Color('#CDBB9A'),KW=!!(K&&K.TWv&&K.TWh&&K.boxUV),
    txP=KW?K.V(K.TWv,'wv',1,1):null,txR=KW?K.V(K.TWh,'wh',1,1):null,
    wm=tx=>new T.MeshStandardMaterial(Object.assign({roughness:.9,emissive:em,emissiveIntensity:.1},tx?{roughness:.8,map:tx,bumpMap:tx,bumpScale:1.2}:{})),
    pg=KW?K.boxUV(bx,[.12,.66,.12],2.4):bx,rg=KW?K.boxUV(bx,[.67,.065,.045],2.4):bx,
    posts=new T.InstancedMesh(pg,wm(txP),n),caps=new T.InstancedMesh(SPH,new T.MeshStandardMaterial(KW?{roughness:.34,envMap:K.ENV||null,envMapIntensity:.35}:{roughness:.8}),n),rails=new T.InstancedMesh(rg,wm(txR),n*2),
    o=new T.Object3D(),c=new T.Color(),cap=['#D9B79A','#CDBF8F','#C9A9A5'];let ri=0;
  for(let i=0;i<n;i++){const x=P[i][0],z=P[i][1],y=hh(x,z)-.05;
    o.position.set(x,y+.33,z);o.rotation.set(0,0,0);o.scale.set(.12,.66,.12);o.updateMatrix();posts.setMatrixAt(i,o.matrix);posts.setColorAt(i,c.set('#CDBB9A').offsetHSL(0,0,(Math.random()-.5)*.06));
    o.position.set(x,y+.69,z);o.scale.setScalar(.075);o.updateMatrix();caps.setMatrixAt(i,o.matrix);caps.setColorAt(i,c.set(cap[i%3]));
    if(i%7===3)continue;
    const j=(i+1)%n,x2=P[j][0],z2=P[j][1],xm=(x+x2)/2,zm=(z+z2)/2,ym=hh(xm,zm)-.05,len=Math.hypot(x2-x,z2-z)*1.03,th=-Math.atan2(z2-z,x2-x);
    [.26,.48].forEach(h=>{o.position.set(xm,ym+h,zm);o.rotation.set(0,th,0);o.scale.set(len,.065,.045);o.updateMatrix();rails.setMatrixAt(ri,o.matrix);rails.setColorAt(ri,c.set('#BFAE8D').offsetHSL(0,0,(Math.random()-.5)*.04));ri++})}
  rails.count=ri;[posts,caps,rails].forEach(q=>{q.castShadow=true;q.receiveShadow=true;isl.add(q)})}
/* 一棵光禿禿的老樹（只剩幾片橘褐色的葉子）*/
const TREE=[-1.55,-1.35],CAIRN=[1.5,-.25];
{const t=new T.Group(),bk='#8E7357',lc=['#C98B4A','#B5703A','#D6A25A'];let li=0;
  t.add(bark(mk(CYL,bk,[0,.12,0],[.26,.25,.26])),bark(mk(CYL,bk,[0,.85,0],[.17,1.7,.17])));
  const br=(par,y,ay,tilt,len,r,dep)=>{const pv=new T.Group();pv.position.y=y;pv.rotation.set(0,ay,-tilt);par.add(pv);pv.add(bark(mk(CYL,bk,[0,len/2,0],[r,len,r])));
    if(dep>0){br(pv,len*.95,ay+1.2,.7,len*.62,r*.7,dep-1);br(pv,len*.6,ay-1.5,.8,len*.55,r*.7,dep-1)}
    else{pv.add(leaf(mk(SPH,lc[li++%3],[.04,len,0],[.14,.03,.08],[0,0,.5])));if(li%2)pv.add(leaf(mk(SPH,lc[li%3],[-.05,len*.7,.03],[.11,.025,.07],[0,0,-.6])))}};
  br(t,1.1,.3,.55,.95,.055,1);br(t,1.35,2.5,.7,.9,.05,1);br(t,1.55,4.4,.5,.8,.045,1);br(t,1.7,1.4,.2,.55,.04,0);
  t.position.set(TREE[0],hh(...TREE)-.05,TREE[1]);t.scale.setScalar(1.05);isl.add(t);sway.push({o:t,p:1.1,k:.012,ax:'z'})}
/* 小石堆：三顆疊起來的石頭 */
{const g=new T.Group(),I=new T.IcosahedronGeometry(1,0);
  g.add(rock(mk(I,'#CFC8C0',[0,.17,0],[.42,.3,.36],[.3,.6,0])),rock(mk(I,'#D9D2CE',[.08,.46,-.02],[.3,.22,.27],[.1,1.2,.2])),rock(mk(I,'#C4BDB5',[.02,.68,.0],[.18,.15,.17],[.4,.2,.1])));
  g.position.set(CAIRN[0],hh(...CAIRN),CAIRN[1]);isl.add(g)}
/* 地上的小石頭、枯草、落葉 */
{[[-.6,1.9,.22],[2.2,1.1,.17],[-2.3,.7,.2]].forEach(([x,z,s])=>isl.add(rock(mk(new T.IcosahedronGeometry(1,0),'#D4CEC8',[x,hh(x,z)+s*.35,z],[s,s*.7,s*.85],[.3,.6,0]))));
  const r=rng(77),n=26,tf=new T.InstancedMesh(LEAF,leafMat({roughness:.9}),n),o=new T.Object3D(),lc=['#C98B4A','#B5703A','#D6A25A','#A8642F'];
  for(let i=0;i<n;i++){const a=r()*6.283,d=Math.sqrt(r())*.86*rho(a),x=Math.cos(a)*d,z=Math.sin(a)*d;o.position.set(x,hh(x,z)+.03,z);o.rotation.set(0,r()*6.28,0);o.scale.set(.09+r()*.04,.03,.055);o.updateMatrix();tf.setMatrixAt(i,o.matrix);tf.setColorAt(i,new T.Color(lc[i%4]))}
  tf.receiveShadow=true;isl.add(tf)}
/* 飄落的葉子（動畫）*/
const FL=[];{const lc=['#C98B4A','#B5703A','#D6A25A','#A8642F'],r=rng(5);for(let i=0;i<9;i++){const m=leaf(mk(SPH,lc[i%4],[0,0,0],[.075,.025,.05]));m.castShadow=false;isl.add(m);FL.push({m,a:r()*6.28,d:r()*2.4,y:r()*2.4,sp:.18+r()*.14,ph:r()*6.28})}}

/* ---------- 島上的花：被鏟除的凋零花，最新的最多 MAXP 朵 ---------- */
const pile=new T.Group();isl.add(pile);
const shOf=k=>k.startsWith('w:')?(S.w[k.slice(2)]||{}).sh:(S.e[k]||{}).sh;   // 'w:' 開頭＝星願島的花
function gone(){const a=Object.keys(S.e).filter(d=>S.e[d]&&S.e[d].sh),b=Object.keys(S.w||{}).filter(i=>S.w[i]&&S.w[i].sh).map(i=>'w:'+i);return a.concat(b).sort((x,y)=>shOf(y)-shOf(x)||(x<y?1:-1))}
function rebuild(){
  while(pile.children.length)pile.remove(pile.children[0]);
  const placed=[[TREE[0],TREE[1],.75],[CAIRN[0],CAIRN[1],.7]];
  gone().slice(0,MAXP).forEach(d=>{const isW=d.startsWith('w:');if(isW&&!window.SI)return;const e=isW?S.w[d.slice(2)]:S.e[d],R=rng(hash(d));let x=0,z=0;
    for(let t=0;t<50;t++){const a=R()*6.283,q=Math.sqrt(R())*.76*rho(a);x=Math.cos(a)*q;z=Math.sin(a)*q;if(placed.every(p=>Math.hypot(p[0]-x,p[1]-z)>(p[2]||.58)))break}
    placed.push([x,z]);
    const w=isW?SI.witherModel():flowerWither(e.mood,true);w.position.set(x,hh(x,z),z);w.rotation.y=(e.r||0)+R()*.6;w.scale.setScalar(.72+R()*.16);pile.add(w)})}

/* ---------- 提示用的小圖示（飄在島上，點它或點小島都會打開）---------- */
const hint=(()=>{
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const gr=x.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(.6,'rgba(255,255,255,.05)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  x.fillStyle='rgba(255,247,226,.93)';x.beginPath();x.arc(64,66,43,0,6.283);x.fill();x.lineWidth=4;x.strokeStyle='rgba(255,255,255,.95)';x.stroke();
  x.lineCap='round';x.strokeStyle='#8E8556';x.lineWidth=5;x.beginPath();x.moveTo(50,100);x.bezierCurveTo(50,70,52,44,70,44);x.bezierCurveTo(84,44,90,54,88,66);x.stroke();
  x.fillStyle='#A08A52';x.beginPath();x.ellipse(43,86,11,4.5,-.7,0,6.283);x.fill();
  x.save();x.translate(88,76);x.rotate(.15);const pc=['#B9788A','#A8667A'];for(let i=0;i<6;i++){x.save();x.rotate(i*1.047);x.fillStyle=pc[i%2];x.beginPath();x.ellipse(0,-10,5.8,10,0,0,6.283);x.fill();x.restore()}x.fillStyle='#5A3A2E';x.beginPath();x.arc(0,0,5,0,6.283);x.fill();x.restore();
  x.fillStyle='#B9788A';x.beginPath();x.ellipse(68,96,6,3,.6,0,6.283);x.fill();
  const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(.85,.85,1);sp.position.set(0,2.5,0);isl.add(sp);
  const gl=new T.Sprite(new T.SpriteMaterial({map:window.GLOW,color:'#FFF0C0',blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:.06}));gl.scale.set(1.1,1.1,1);gl.position.copy(sp.position);gl.renderOrder=1;sp.renderOrder=2;isl.add(gl);
  return{sp,gl,hov:false,y:2.5}})();
const hit=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({visible:false}));hit.position.set(0,.7,0);hit.scale.set(RW*.92,1.9,RW*.92);isl.add(hit);

/* ---------- 每一幀 ---------- */
let T0=performance.now(),sh=false,hovT=0,sigT=0,sig='';
SLP.cbs.push(()=>{if(sh){sh=false;T0=performance.now();requestAnimationFrame(step)}});
const sigOf=()=>{let s='';for(const k in S.e)if(S.e[k]&&S.e[k].sh)s+='|'+k+S.e[k].sh+S.e[k].mood;for(const k in S.w)if(S.w[k]&&S.w[k].sh)s+='|w'+k+S.w[k].sh;return s};
function step(now){
  if(SLP.on){sh=true;return}
  requestAnimationFrame(step);
  const dt=Math.min(.05,(now-T0)/1000);T0=now;if(dt<=0)return;
  let rm=false,wind=.3;try{rm=!!S.rm;wind=WX.wind||0}catch(e){logErr(e)}
  const t=now/1000;
  sigT-=dt;if(sigT<=0){sigT=1;try{const g=sigOf();if(g!==sig){sig=g;rebuild();if(!$o.hidden)render()}}catch(e){logErr(e)}}
  if(!rm){const w=.5+wind*1.1;sway.forEach(s=>{const v=Math.sin(t*(1+w*.5)+s.p)*s.k*w;if(s.ax==='z')s.o.rotation.z=v;else s.o.rotation.x=v});
    hint.sp.position.y=hint.y+Math.sin(t*1.5+.4)*.06;hint.sp.material.rotation=Math.sin(t*.9)*.1;
    FL.forEach(l=>{l.y-=dt*l.sp;if(l.y<.05){l.y=2.4+Math.random()*.3;l.a=Math.random()*6.28;l.d=Math.random()*2.4}
      const q=l.a+Math.sin(t*.7+l.ph)*.35,x=Math.cos(q)*l.d+Math.sin(t*1.3+l.ph)*.25,z=Math.sin(q)*l.d;l.m.position.set(x,Math.max(hh(x,z)+.03,l.y),z);l.m.rotation.set(Math.sin(t*2+l.ph)*.8,t*.8+l.ph,Math.cos(t*1.7+l.ph)*.8)})}
  else FL.forEach(l=>{const x=Math.cos(l.a)*l.d,z=Math.sin(l.a)*l.d;l.m.position.set(x,hh(x,z)+.03,z);l.m.rotation.set(0,l.ph,0)});
  if(hint.hov&&now-hovT>400)hint.hov=false;
  const hv=hint.hov?1.18:1;hint.sp.scale.x+=(.85*hv-hint.sp.scale.x)*.15;hint.sp.scale.y=hint.sp.scale.x;
  hint.gl.material.opacity=.06+(rm?0:.02*Math.sin(t*1.6))+(hint.hov?.05:0);hint.gl.position.y=hint.sp.position.y}
requestAnimationFrame(step);

/* ---------- 點擊偵測 ---------- */
const rc=new T.Raycaster(),mv2=new T.Vector2();
function pick(e){
  try{
    if(typeof arrange!=='undefined'&&arrange){hint.hov=false;return false}
    mv2.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);rc.setFromCamera(mv2,cam);
    const h=rc.intersectObject(hit,false).length>0;hint.hov=h;hovT=performance.now();return h}
  catch(err){return false}
}

/* ---------- 凋零小島視窗：曾經凋零的花，心情與文字都在這裡 ---------- */
const css=document.createElement('style');css.textContent=`
#wio{z-index:21;background:rgba(95,100,85,.3);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px)}
.wis{width:min(660px,100%);max-height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);max-height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);display:flex;flex-direction:column;border-radius:26px;padding:12px;background:linear-gradient(#B9A482,#A8926F);box-shadow:0 18px 40px rgba(60,48,28,.38),inset 0 0 0 2px rgba(255,240,210,.3);animation:wiin .5s cubic-bezier(.2,.9,.3,1.1) both}
.wih{flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:4px 10px 10px;color:#FFF6E6;text-shadow:0 1px 3px rgba(60,48,28,.4)}
.wih h2{font-size:22px;display:flex;align-items:center;gap:6px}.wih span{font-size:13px;opacity:.92}
.wib{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:16px;padding:16px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;align-content:start;background:radial-gradient(rgba(110,90,60,.16) 1px,transparent 1.6px) 0 0/9px 9px,#E5D9BF;box-shadow:inset 0 3px 10px rgba(80,62,34,.32)}
.win{position:relative;display:flex;flex-direction:column;gap:7px;padding:14px 14px 12px;background:#FBF4E4;color:#5B4A4A;border-radius:6px 16px 6px 16px;box-shadow:0 6px 12px rgba(70,55,30,.2);border:2px dashed #DCCBA6;animation:wid .5s cubic-bezier(.2,.9,.3,1.15) backwards;animation-delay:calc(var(--i)*40ms)}
.wii{display:flex;align-items:center;gap:8px}.wii svg{filter:grayscale(.75) sepia(.25);opacity:.85}.wii small{display:block;font-size:12px;opacity:.72;line-height:1.4}.wii b{font-size:15px}
.wiq{font-style:italic;font-size:14.5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;word-break:break-word;-webkit-user-select:text;user-select:text}
.wiq.open{display:block}.wiq.no{opacity:.6;cursor:default;font-style:normal;font-size:13.5px}
.wit{display:flex;gap:4px;flex-wrap:wrap}.wit i{font-style:normal;font-size:11.5px;background:rgba(160,138,82,.2);border-radius:99px;padding:1px 8px}
.wid2{font-size:11.5px;opacity:.65;line-height:1.5;margin-top:auto;border-top:1px dashed #DCCBA6;padding-top:6px}
.wie{grid-column:1/-1;text-align:center;padding:26px 14px;color:#6B5A44}.wie h3{font:600 18px Fredoka,Nunito,sans-serif;margin-bottom:6px}.wie p{font-size:14px;line-height:1.6;opacity:.85}
.wif{flex:none;display:flex;justify-content:flex-end;gap:8px;padding:10px 6px 2px}
@keyframes wiin{from{opacity:0;transform:translateY(24px) scale(.94)}}@keyframes wid{from{opacity:0;transform:translateY(-12px) scale(.94)}}
@media(max-width:520px){.wib{grid-template-columns:1fr}.wis{padding:10px;border-radius:22px}}
@media(prefers-reduced-motion:reduce){.wis,.win{animation:none}}body.rm .wis,body.rm .win{animation:none}
/* ===== 液態玻璃改版 ===== */
#wio{background:rgba(70,62,50,.26);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.wis{width:min(680px,100%);border-radius:32px;padding:14px;background:radial-gradient(120% 80% at 8% 0%,rgba(255,255,255,.5),rgba(255,255,255,0) 55%),linear-gradient(rgba(238,226,203,.52),rgba(208,189,153,.44));-webkit-backdrop-filter:blur(26px) saturate(175%) brightness(1.05);backdrop-filter:blur(26px) saturate(175%) brightness(1.05);border:1px solid rgba(255,255,255,.62);box-shadow:0 20px 50px rgba(60,48,28,.30),0 2px 6px rgba(60,48,28,.12),inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 -1.5px 2px rgba(255,255,255,.28),inset 0 0 28px rgba(255,255,255,.14)}
.wih{align-items:center;padding:4px 6px 12px;color:#5A4A32;text-shadow:0 1px 0 rgba(255,255,255,.55)}
.wih h2{font-size:23px}.wih span{font-size:12.5px;padding:4px 12px;border-radius:99px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 1px 1px rgba(255,255,255,.9);opacity:1}
.wib{border-radius:22px;padding:16px 14px;gap:14px;overscroll-behavior:contain;background:linear-gradient(rgba(255,255,255,.34),rgba(255,255,255,.22));border:1px solid rgba(255,255,255,.5);box-shadow:inset 0 2px 8px rgba(90,70,40,.12),inset 0 1px 1px rgba(255,255,255,.7)}
.win{border-radius:20px;padding:14px 15px 12px;background:linear-gradient(rgba(255,255,255,.74),rgba(255,251,240,.58));border:1px solid rgba(255,255,255,.75);box-shadow:0 8px 20px rgba(70,55,30,.12),inset 0 1.5px 1px rgba(255,255,255,.95);transition:transform .25s,box-shadow .25s}
.win:hover{transform:translateY(-3px);box-shadow:0 14px 26px rgba(70,55,30,.16),inset 0 1.5px 1px rgba(255,255,255,.95)}
.wii{padding-bottom:8px;border-bottom:1px solid rgba(120,100,70,.14)}
.wit i{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.85)}
.wid2{border-top:1px solid rgba(120,100,70,.14);opacity:.7}
.wie{border-radius:20px;background:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.6)}
@media(max-width:520px){.wis{padding:10px;border-radius:26px}}
@media(prefers-reduced-motion:reduce){.win{transition:none}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.wis{background:#E6D8BC}}
@media(prefers-reduced-transparency:reduce){.wis{background:#EADFC6;-webkit-backdrop-filter:none;backdrop-filter:none}}
`;document.head.appendChild(css);
document.body.insertAdjacentHTML('beforeend',`<div class="scrim" id="wio" hidden><div class="wis" id="wid" role="dialog" aria-modal="true"><div class="wih"><h2 id="wih"></h2><span id="win"></span></div><div class="wib" id="wib"></div><div class="wif"><button class="btn p" id="wix"></button></div></div></div>`);
const $o=document.getElementById('wio'),$b=document.getElementById('wib'),$x=document.getElementById('wix');
const dfmt=ms=>new Date(ms).toLocaleDateString(LC(),{year:'numeric',month:'short',day:'numeric'});
function noteHTML(d,i){
  if(d.startsWith('w:'))return window.SI?SI.noteHTML(d.slice(2),i):'';
  const e=S.e[d];if(!e)return'';const mo=M[e.mood]||M.happy,tx=e.text&&e.text.trim();
  const tags=(e.tags||[]).map(g=>'<i>'+esc((tr('tg')||[])[TAGS.indexOf(g)]||g)+'</i>').join('');
  return `<article class="win" style="--i:${Math.min(i,12)}"><div class="wii">${flo(e.mood,38)}<span><b>${esc(mo.f)}</b><small>${esc(mo.n)} · ${esc(fmt(d))}</small></span></div>
${tx?`<p class="wiq" role="button" tabindex="0" aria-expanded="false">“${esc(tx)}”</p>`:`<p class="wiq no">${esc(tr('noNote'))}</p>`}
${tags?`<div class="wit">${tags}</div>`:''}
<div class="wid2">${esc(tr('wiPlant'))}　${esc(e.pt?dfmt(e.pt):fmt(d))}<br>${esc(tr('wiWither'))}　${esc(dfmt(witherAt(d,e)))}<br>${esc(tr('wiShov'))}　${esc(dfmt(e.sh))}</div></article>`}
function render(){
  const ls=gone();
  document.getElementById('wid').setAttribute('aria-label',tr('wiT'));
  document.getElementById('wih').innerHTML=ic('yard')+' '+esc(tr('wiT'));
  document.getElementById('win').textContent=tr('wiSub',ls.length);
  $x.innerHTML=ic('close')+' '+esc(tr('close'));
  $b.innerHTML=ls.length?ls.map(noteHTML).join(''):`<div class="wie"><h3>${esc(tr('wiE0'))}</h3><p>${esc(tr('wiE1'))}</p></div>`;
  $b.scrollTop=0}
$b.addEventListener('click',e=>{const q=e.target.closest('.wiq:not(.no)');if(q){const o=q.classList.toggle('open');q.setAttribute('aria-expanded',o)}});
$b.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.wiq:not(.no)')){e.preventDefault();e.target.click()}});
function open(){
  const lf=document.getElementById('rvm'),mb=document.getElementById('mbo');if(!$o.hidden||(lf&&!lf.hidden)||(mb&&!mb.hidden))return;
  render();$o.hidden=false;$('card').hidden=true;
  tgG.set(WIX,.4,WIZ+.2);radG=Math.min(radG,14);
  try{sfx('island')}catch(e){logErr(e)}
  setTimeout(()=>{try{$x.focus({preventScroll:true})}catch(e){logErr(e)}},350)}
function close(goHome){$o.hidden=true;if(goHome&&typeof home==='function')(typeof homeSoft==='function'?homeSoft():home())}
$x.onclick=()=>close(true);
$o.addEventListener('pointerdown',e=>{if(e.target===$o)close(true)});
addEventListener('keydown',e=>{if(!$o.hidden&&e.key==='Escape')close(true)});
window.WI={pick,open,close,refresh:()=>{try{sig=sigOf();rebuild();if(!$o.hidden)render()}catch(e){logErr(e)}}};
try{sig=sigOf();rebuild()}catch(e){logErr(e)}
})();
