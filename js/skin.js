/* ============================================================================
 * js/skin.js — 材質與貼圖層（只換外觀）
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・全部貼圖都用程式即時生成（可無縫平鋪的雜訊 noise／fbm，不需任何圖檔）：
 *     草地、泥土、樹皮、石頭、灰泥、木紋、布、土壤剖面、樹葉等，並提供地面
 *     shader（skinGround）。
 *   ・結果集中放在 window.SKIN，供各座小島與花園使用；只改外觀、不改功能，沒
 *     有 WebGL（ok 為 false）時整段跳過。
 *
 * 需要先載入：log.js、audio.js、state.js、world.js、three-utils.js、
 *   garden-scene.js、camera.js、creatures.js、weather.js
 * 提供給其他檔案：SKIN
 * 載入順序：第 25 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 材質與貼圖層：只替換外觀，不改任何功能（貼圖全部用程式即時生成，不需要額外檔案）===== */
(function(){
if(typeof ok==='undefined'||!ok)return;
try{
const T=THREE,AN=Math.min(8,R.capabilities.getMaxAnisotropy());
let sd=20261021;const rnd=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
/* --- 可無縫平鋪的雜訊 --- */
function noise(N,fx,fy){const L=new Float32Array(fx*fy),o=new Float32Array(N*N);for(let i=0;i<L.length;i++)L[i]=rnd();
 for(let y=0;y<N;y++){const v=y/N*fy,y0=Math.floor(v),ty=v-y0,sy=ty*ty*(3-2*ty),r0=(y0%fy)*fx,r1=((y0+1)%fy)*fx;
  for(let x=0;x<N;x++){const u=x/N*fx,x0=Math.floor(u),tx=u-x0,sx=tx*tx*(3-2*tx),xa=x0%fx,xb=(x0+1)%fx,a=L[r0+xa],b=L[r0+xb],c=L[r1+xa],d=L[r1+xb];
   o[y*N+x]=a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}}return o}
function fbm(N,f,w,an){const o=new Float32Array(N*N);f.forEach((q,i)=>{const a=noise(N,q,Math.max(1,Math.round(q*(an||1)))),k=w?w[i]:1/(i+1);for(let j=0;j<o.length;j++)o[j]+=a[j]*k});
 let mn=1e9,mx=-1e9;for(let j=0;j<o.length;j++){if(o[j]<mn)mn=o[j];if(o[j]>mx)mx=o[j]}const s=1/(mx-mn||1);for(let j=0;j<o.length;j++)o[j]=(o[j]-mn)*s;return o}
const fin=c=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=AN;return t},cv=N=>{const c=document.createElement('canvas');c.width=c.height=N;return c};
const pix=(N,fn)=>{const c=cv(N),g=c.getContext('2d'),im=g.createImageData(N,N),d=im.data;for(let i=0;i<N*N;i++){const p=fn(i);d[i*4]=p[0]*255;d[i*4+1]=p[1]*255;d[i*4+2]=p[2]*255;d[i*4+3]=255}g.putImageData(im,0,0);return fin(c)},gray=(N,a)=>pix(N,i=>[a[i],a[i],a[i]]);
const N=256;
/* 草地、泥土：RGB 打包（r=明暗 g=凹凸高度 b=大塊雜訊／卵石遮罩），由地面 shader 在世界座標上混合 */
const ga=fbm(N,[12,24,48],[1,.7,.5]),gb=fbm(N,[32,64,96],[1,.8,.6]),gc=fbm(N,[2,3,5,9],[1,.8,.5,.3]);
const TG=pix(N,i=>{const h=1-Math.abs(2*gb[i]-1);return[.55+.45*(ga[i]*.55+gb[i]*.45),h*.55+ga[i]*.45,gc[i]]});
const da=fbm(N,[6,12,24,48]),db=fbm(N,[10,20,40,80]),dc=fbm(N,[28,56]);
const TD=pix(N,i=>{const h=1-Math.abs(2*db[i]-1);return[.58+.42*da[i],h*.5+da[i]*.5,dc[i]]});
/* 樹皮（直條溝紋）、石頭、灰泥、木紋、布、土壤剖面 */
const TB=gray(N,fbm(N,[3,6,12],[1,.6,.4],.15).map(v=>.45+.55*v));
const sa=fbm(N,[3,6,12,24,48,96]),sb=fbm(N,[64,128]),sc=fbm(N,[3,6,12]);
const TS=gray(N,sa.map((v,i)=>{let l=.6+.4*v;if(sb[i]>.78)l*=.78;if(Math.abs(sc[i]-.5)<.018)l*=.55;return l}));
const pa=fbm(N,[32,64,128]),pb=fbm(N,[3,6],[1,.6],10),TP=gray(N,pa.map((v,i)=>.88+.12*(.6*v+.4*pb[i])));
const wa=fbm(N,[3,6,14],[1,.7,.5],14),wb=fbm(N,[2,4],[1,.5],30),TWh=gray(N,wa.map((v,i)=>.6+.4*(v*.7+wb[i]*.3)));
const TWv=TWh.clone();TWv.rotation=Math.PI/2;TWv.center.set(.5,.5);TWv.needsUpdate=true;
const TC=gray(128,Float32Array.from({length:16384},(_,i)=>{const x=i%128,y=i>>7;return .86+.1*(((x>>1)&1)^((y>>1)&1))-(x%32==0?.08:0)+rnd()*.04}));
const oa=fbm(N,[2,3,5],[1,.8,.6],40),TSo=(()=>{const c=cv(N),g=c.getContext('2d'),d=g.createImageData(N,N);for(let i=0;i<N*N;i++){const v=(.62+.38*oa[i])*255;d.data.set([v,v,v,255],i*4)}g.putImageData(d,0,0);
 for(let i=0;i<90;i++){const r=1.5+rnd()*4;g.fillStyle=rnd()<.5?'rgba(255,255,255,.55)':'rgba(70,60,50,.55)';g.beginPath();g.ellipse(rnd()*N,rnd()*N,r*1.3,r,0,0,6.283);g.fill()}return fin(c)})();
/* 樹葉：一片片葉子疊起來 */
const TL=(()=>{const c=cv(512),g=c.getContext('2d');g.fillStyle='#787878';g.fillRect(0,0,512,512);
 for(let i=0;i<650;i++){const x=rnd()*512,y=rnd()*512,a=rnd()*6.28,w=13+rnd()*10,h=6+rnd()*4,v=170+rnd()*85|0;
  for(const dx of[-512,0,512])for(const dy of[-512,0,512]){const X=x+dx,Y=y+dy;if(X<-30||X>542||Y<-30||Y>542)continue;g.save();g.translate(X,Y);g.rotate(a);g.fillStyle=`rgb(${v},${v},${v})`;g.beginPath();g.ellipse(0,0,w,h,0,0,6.283);g.fill();g.strokeStyle='rgba(90,90,90,.55)';g.lineWidth=1;g.beginPath();g.moveTo(-w,0);g.lineTo(w,0);g.stroke();g.restore()}}return fin(c)})();
/* 屋瓦：由下往上一排排魚鱗瓦 */
const TR=(()=>{const c=cv(256),g=c.getContext('2d');g.fillStyle='#666';g.fillRect(0,0,256,256);
 for(let r=7;r>=0;r--)for(let k=-1;k<9;k++){const x=k*32+(r%2?16:0),y=r*32,v=205+rnd()*50|0,q=f=>{const n=v*f|0;return`rgb(${n},${n},${n})`},gr=g.createLinearGradient(0,y,0,y+36);gr.addColorStop(0,q(.62));gr.addColorStop(.5,q(1));gr.addColorStop(1,q(.9));
  g.fillStyle=gr;g.beginPath();g.moveTo(x+1,y);g.lineTo(x+31,y);g.lineTo(x+31,y+22);g.quadraticCurveTo(x+31,y+34,x+16,y+34);g.quadraticCurveTo(x+1,y+34,x+1,y+22);g.closePath();g.fill();g.strokeStyle='rgba(50,50,50,.7)';g.lineWidth=1.5;g.stroke()}return fin(c)})();
/* 小草叢（透明底） */
const TFt=(()=>{const c=cv(128),g=c.getContext('2d');for(let i=0;i<9;i++){const x=10+i*13+rnd()*6,l=(rnd()-.5)*34,h=62+rnd()*60,w=4+rnd()*3,gr=g.createLinearGradient(0,128,0,128-h);gr.addColorStop(0,'#555');gr.addColorStop(1,'#fff');g.fillStyle=gr;g.beginPath();g.moveTo(x-w,128);g.quadraticCurveTo(x-w*.4+l*.3,128-h*.55,x+l,128-h);g.quadraticCurveTo(x+w*.4+l*.3,128-h*.55,x+w,128);g.fill()}
 const t=new T.CanvasTexture(c);t.anisotropy=AN;return t})();
const tv={},V=(t,k,rx,ry)=>{const q=k+rx+'x'+ry;return tv[q]||(tv[q]=(()=>{const c=t.clone();c.repeat.set(rx,ry);c.needsUpdate=true;return c})())};
/* 天空環境貼圖：只給水坑、玻璃、柵欄球使用，不影響整體打光 */
let ENV=null;try{const sg=new T.SphereGeometry(20,24,16),cc=[],p=sg.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/20,c=new T.Color(y>0?'#CFE3EF':'#9DBF9F').lerp(new T.Color(y>0?'#6FA6D6':'#7F9F8A'),Math.pow(Math.abs(y),.7));cc.push(c.r,c.g,c.b)}
 sg.setAttribute('color',new T.Float32BufferAttribute(cc,3));const es=new T.Scene();es.add(new T.Mesh(sg,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));ENV=new T.PMREMGenerator(R).fromScene(es).texture}catch(e){ENV=null}
/* --- 材質工廠（沿用原本的顏色與自發光，只加貼圖與粗糙度）--- */
const cache={},GLm=[];
function SM(old,key,tx,o){const k=key+old.color.getHexString()+(old.vertexColors?1:0);return cache[k]||(cache[k]=new T.MeshStandardMaterial(Object.assign({color:old.color.clone(),emissive:old.emissive.clone(),emissiveIntensity:old.emissiveIntensity,vertexColors:old.vertexColors,side:old.side,roughness:.85,map:tx||null,bumpMap:tx||null,bumpScale:1},o||{})))}
/* --- 新幾何：樹幹、蓬鬆樹冠、自然石頭 --- */
const bend=(g,fn)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=fn(x,y,z);p.setXYZ(i,x*k[0],y*k[1],z*k[0]*(k[2]||1))}};
const TRUNK=new T.CylinderGeometry(.72,1.1,1,12,5);bend(TRUNK,(x,y,z)=>{const a=Math.atan2(z,x),k=1+.1*Math.sin(a*5+y*3)+.05*Math.sin(a*9)+(y<-.3?(-.3-y)*.5:0);return[k,1]});shade(TRUNK,.7);
const CAN=(()=>{
 const g0=new T.IcosahedronGeometry(1,1).toNonIndexed(),bp=g0.attributes.position,P=[],C=[],
  h3=(x,y,z)=>{const q=Math.sin(Math.round(x*100)*12.9898+Math.round(y*100)*78.233+Math.round(z*100)*37.719)*43758.5453;return q-Math.floor(q)};
 for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),k=.86+.26*h3(x,y,z),ln=Math.hypot(x,y,z),lum=.6+.4*(y/ln*.5+.5);P.push(x*k,y*k,z*k);C.push(lum,lum,lum)}
 const NL=38,V3=T.Vector3,up=new V3(0,1,0);
 for(let j=0;j<NL;j++){
  const yy=1-(j+.5)/NL*2,rr=Math.sqrt(1-yy*yy),a=j*2.39996,d=new V3(Math.cos(a)*rr,yy,Math.sin(a)*rr),
   t1=new V3().crossVectors(d,Math.abs(d.y)>.95?new V3(1,0,0):up).normalize(),t2=new V3().crossVectors(d,t1),
   ang=rnd()*6.283,lv=t1.clone().multiplyScalar(Math.cos(ang)).addScaledVector(t2,Math.sin(ang)),w=new V3().crossVectors(d,lv),
   LL=.3+rnd()*.14,WW=.1+rnd()*.04,b=d.clone().multiplyScalar(.98+rnd()*.1),
   tip=b.clone().addScaledVector(lv,LL).addScaledVector(d,.1),mid=b.clone().addScaledVector(lv,LL*.5).addScaledVector(d,.09),
   le=mid.clone().addScaledVector(w,-WW),ri=mid.clone().addScaledVector(w,WW),
   lum=(.82+.3*rnd())*(.72+.28*(d.y*.5+.5));
  [b,le,mid,b,mid,ri,mid,le,tip,mid,ri,tip].forEach(q=>{P.push(q.x,q.y,q.z);C.push(lum,lum,lum)})}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();return g})();
const RKG=new T.IcosahedronGeometry(1,2);{const p=RKG.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.16*Math.sin(x*3.1+1.3)*Math.sin(y*2.7+.4)+.09*Math.sin(z*6.3+x*2.2)+.04*Math.sin(x*13+z*11);p.setXYZ(i,x*k,y*k,z*k)}RKG.computeVertexNormals()}
/* --- 逐一替換場景裡的環境物件（花、動物、青蛙、雲不動）--- */
const skip=new Set([...Object.values(flowers),...cr,...cl,...bf,...(window.FROGS||[]).map(f=>f.g)]);
const hx=m=>m.material&&m.material.color?m.material.color.getHexString():'',isStd=m=>m.isMesh&&m.material&&m.material.isMeshStandardMaterial;
const DECK=new Set(['e8c99a','ddb98a','e3c28f','ebd3ac']),WOODC=new Set(['e8c99a','ddb98a','e3c28f','c79f72','e2c79b','ebd3ac','d9b88f','b58b66','e3c9a8']),CAPC=new Set(['f5c7d5','b9d8eb','f5dea0']);
const boxUV=(g0,sz,tile)=>{if(g0.type!=='BoxGeometry')return g0;const g=g0.clone(),uv=g.attributes.uv,ou=rnd(),ov=rnd(),D=[[sz[2],sz[1]],[sz[2],sz[1]],[sz[0],sz[2]],[sz[0],sz[2]],[sz[0],sz[1]],[sz[0],sz[1]]];
 for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*D[f][0]/tile+ou,uv.getY(k)*D[f][1]/tile+ov)}uv.needsUpdate=true;return g};
const wood=(m,v)=>{m.geometry=boxUV(m.geometry,[m.scale.x,m.scale.y,m.scale.z],2.4);m.material=SM(m.material,v?'wv':'wh',v?V(TWv,'wv',1,1):V(TWh,'wh',1,1),{roughness:.78,bumpScale:.8})};
function part(m,house){if(!isStd(m))return;const h=hx(m),t=m.geometry.type,o=m.material;
 if(h==='fbefdd')m.material=SM(o,'pl',V(TP,'p',t=='BoxGeometry'?2:5,t=='BoxGeometry'?1.5:3),{roughness:.95,bumpScale:.7});
 else if(h==='f29bb5'&&t=='ConeGeometry')m.material=SM(o,'rf',V(TR,'r',4,3),{roughness:.7,bumpScale:2.5});
 else if(h==='b9d8eb'){const g=SM(o,'gl',null,{roughness:.08,metalness:.1,envMap:ENV,envMapIntensity:.9});if(GLm.indexOf(g)<0)GLm.push(g);m.material=g}
 else if(h==='ffffff'&&t=='BoxGeometry')m.material=SM(o,'cl',V(TC,'c',3,6),{roughness:.95,side:2,bumpScale:.8});
 else if(h==='e3c9a8'&&house)m.material=SM(o,'st',V(TS,'s',1,1),{roughness:.9,bumpScale:2});
 else if(WOODC.has(h)&&(t=='BoxGeometry'||t=='SphereGeometry'))wood(m,h==='b58b66'&&t=='BoxGeometry')}
function grp(g){const f=g.children[0];if(!f||!isStd(f))return;const h=hx(f),gt=f.geometry.type;
 if(h==='c9a27a'&&gt=='CylinderGeometry')g.children.forEach(m=>{if(!isStd(m))return;if(m.geometry===CYL){m.geometry=TRUNK;m.material=SM(m.material,'bk',V(TB,'b',1,1),{roughness:.95,bumpScale:1.5})}
  else{m.geometry=CAN;m.rotation.set(0,rnd()*6.28,0);m.material=SM(m.material,'lf',null,{roughness:.85,flatShading:true,side:2})}});
 else if(h==='fff3e0')g.children.forEach((m,i)=>{if(!isStd(m))return;m.material=i==0?SM(m.material,'sm',V(TP,'p',1,1),{roughness:.85,bumpScale:.8}):SM(m.material,'cp',null,{roughness:.36})});
 else if(h==='fbefdd'||h==='d9b88f')g.children.forEach(m=>part(m,gt=='BoxGeometry'&&h==='fbefdd'))}
function single(c){const h=hx(c),t=c.geometry.type,o=c.material;
 if(t=='IcosahedronGeometry'&&h==='d9d2ce'){c.geometry=RKG;c.material=SM(o,'rk',V(TS,'s',2,2),{roughness:.92,bumpScale:3})}
 else if(t=='BoxGeometry'&&WOODC.has(h))wood(c,DECK.has(h));
 else if(t=='ConeGeometry'&&h==='c6c2e4')c.material=SM(o,'mt',V(TS,'s',2,2),{roughness:.95,bumpScale:2});
 else if(t=='CylinderGeometry'&&h==='e3c9a8')c.material=SM(o,'so',V(TSo,'o',6,1),{roughness:.95,bumpScale:1.5});
 else if(t=='BufferGeometry'&&h==='e3c9a8'&&o.side===2){const p=c.geometry.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(i>>1)/96*6;uv[i*2+1]=i%2?0:1}c.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));c.material=SM(o,'so',V(TSo,'o',1,1),{roughness:.95,bumpScale:1.5})}
 else if(t=='SphereGeometry'&&CAPC.has(h)&&c.scale.x<.1&&c.position.y>-1)c.material=SM(o,'cap',null,{roughness:.38})}
let st=0;
scene.children.slice().forEach(c=>{if(skip.has(c))return;
 if(c.isInstancedMesh){const t=c.geometry.type,o=c.material;
  if(t=='BoxGeometry'&&(st==0||st==2)){const post=st==0,tx=post?V(TWv,'wv',1,1):V(TWh,'wh',1,1);c.geometry=boxUV(c.geometry,post?[.13,.74,.13]:[.68,.07,.05],2.4);c.material=new T.MeshStandardMaterial({roughness:.8,emissive:o.emissive,emissiveIntensity:o.emissiveIntensity,map:tx,bumpMap:tx,bumpScale:1.2});st=post?1:0}
  else if(t=='SphereGeometry'&&st==1){c.material=new T.MeshStandardMaterial({roughness:.34,envMap:ENV,envMapIntensity:.35});st=2}
  return}
 if(c.isGroup)grp(c);else if(isStd(c))single(c)});
/* --- 水坑：天空倒影＋依畫面明暗調整；順便取得水坑位置給地面做泥濘 --- */
const PW=[],PDs=[];scene.traverse(m=>{if(isStd(m)&&m.material.roughness===.05&&m.material.transparent){m.material.envMap=ENV;m.material.envMapIntensity=1.2;m.material.needsUpdate=true;PW.push(m.material);m.geometry.computeBoundingSphere();const p=m.geometry.attributes.position;PDs.push([p.getX(0),p.getZ(0),m.geometry.boundingSphere.radius/1.2])}});
/* --- 地面：世界座標混合草地／泥土貼圖，水坑周圍變泥濘、下雨時更濕更亮 --- */
const U={tGr:{value:TG},tDt:{value:TD},uWet:{value:0},uRip:{value:0},uT:{value:0},uW:{value:.5},uPD:{value:Array.from({length:8},(_,i)=>PDs[i]?new T.Vector3(...PDs[i]):new T.Vector3(1e4,1e4,1))}};
const GR2=[];function skinGround(m){GR2.push(m);m.customProgramCacheKey=()=>'xgr';m.extensions=m.extensions||{};m.extensions.derivatives=true;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.uniforms.uBmp=GQU.uBmp;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 xWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nxWP=(modelMatrix*vec4(transformed,1.0)).xz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 xWP;uniform sampler2D tGr,tDt;uniform float uWet,uT,uRip,uBmp;uniform vec3 uPD[8];
float xH1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 xBump(vec3 sp,vec3 sn,vec2 dh,float fd){vec3 sx=dFdx(sp),sy=dFdy(sp),r1=cross(sy,sn),r2=cross(sn,sx);float dt=dot(sx,r1)*fd;vec3 g=sign(dt)*(dh.x*r1+dh.y*r2);return normalize(abs(dt)*sn-g);}`)
 .replace('#include <color_fragment>',`#include <color_fragment>
 vec4 xg1=texture2D(tGr,xWP*.55),xg2=texture2D(tGr,xWP*.11+vec2(.37,.11)),xgl=texture2D(tGr,xWP*.025),xd1=texture2D(tDt,xWP*.7),xd2=texture2D(tDt,xWP*.13);
 float xed=smoothstep(-.02,.08,diffuseColor.r-diffuseColor.g),xpt=smoothstep(.68,.84,xgl.b)*.9,xmud=0.;
 for(int i=0;i<8;i++){xmud=max(xmud,1.-smoothstep(.55,1.15,length(xWP-uPD[i].xy)/(uPD[i].z*1.25)));}
 xmud*=uWet;
 /* 雨滴落在水漥上的漣漪：水漥裡持續有雨滴落下，圈圈向外擴散並漸漸淡去 */
 float xrpL=0.,xrpH=0.;
 if(uRip>.02){
  for(int i=0;i<8;i++){
   vec3 xpd=uPD[i];
   float xdn=length(xWP-xpd.xy)/xpd.z;
   if(xdn<1.){
    float xmk=1.-smoothstep(.5,.85,xdn);
    /* 連續落雨：每 0.3~0.6 秒（平均約 0.45 秒）就在水漥裡落下一滴，漣漪各自擴散、互相重疊，
       不再是固定 3 個的循環。每一滴的位置、大小、壽命都不同。 */
    float xP=.45,xtq=uT+xH1(vec2(float(i)*7.31,2.7))*60.,xn0=floor(xtq/xP);
    for(int k=0;k<5;k++){
     float xn=xn0-float(k),xsd=float(i)*7.31;
     float xst=xn*xP+xH1(vec2(xn,xsd+1.3))*.15;
     float xdur=1.1+xH1(vec2(xn+8.1,xsd))*.7,xage=xtq-xst;
     if(xage>0.&&xage<xdur){
      float xph=xage/xdur,xsz=.75+xH1(vec2(xn+2.9,xsd+4.4))*.5;
      vec2 xc=xpd.xy+(vec2(xH1(vec2(xn,xsd+9.1)),xH1(vec2(xn+3.7,xsd+6.2)))-.5)*xpd.z*.9;
      float xd=length(xWP-xc),xR=xph*xpd.z*.5*xsz,xw=.03+.035*xph,xfd=(1.-xph)*(1.-xph)*smoothstep(0.,.08,xph);
      float xa=(xd-xR)/xw,xb2=(xd-xR*.62)/xw;
      float xr1=exp(-xa*xa),xr2=.55*exp(-xb2*xb2);
      xrpL+=(xr1+xr2)*xfd*xmk;
      xrpH+=(sin((xd-xR)*55.)*exp(-xa*xa*.12)+.5*sin((xd-xR*.62)*55.)*exp(-xb2*xb2*.12))*xfd*xmk;
     }
    }
   }
  }
  float xrg=smoothstep(.2,.7,uRip);
  xrpL*=xrg;xrpH*=xrg;
 }
 float xdt=clamp(max(xed,xpt),0.,1.);
 vec3 xb=mix(diffuseColor.rgb,vec3(.56,.43,.30),xpt*(1.-xed));
 xb*=mix(mix(vec3(.94,1.,.84),vec3(1.04,1.,.98),xgl.r),vec3(1.),xdt);
 xb=mix(xb,vec3(.30,.22,.15),xmud*.85);
 xb=mix(xb,vec3(.66,.62,.58),step(.87,xd1.b)*xdt*.9);
 diffuseColor.rgb=xb*mix((xg1.r*.6+xg2.r*.55)*(.8+.4*xd1.g),xd1.r*.6+xd2.r*.55,xdt)*1.1*mix(1.,.75,xmud);
 diffuseColor.rgb+=vec3(.72,.86,1.)*min(xrpL,1.2)*.38;`)
 .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,.25,xmud);')
 .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 {float xgh=xg1.g*.3+xg2.g*.15+xd1.g*.4+xd2.g*.15,xh=mix(xgh,xd1.g*.7+xd2.g*.3,xdt);xh=mix(xh,.5,xmud)+xrpH*.05;if(uBmp>.5)normal=xBump(-vViewPosition,normal,vec2(dFdx(xh),dFdy(xh))*mix(2.2,2.5,xdt),gl_FrontFacing?1.0:-1.0);}`);};m.needsUpdate=true}
(window.GRS||[]).forEach(g=>skinGround(g.material));
/* --- 草叢：兩片交叉的草葉面片，隨風輕搖 --- */
const tg=new T.BufferGeometry(),ps=[],uvs=[],ix=[],nm=[];[0,Math.PI/2].forEach((a,k)=>{const c=Math.cos(a),s=Math.sin(a);ps.push(-.5*c,0,-.5*s,.5*c,0,.5*s,.5*c,1,.5*s,-.5*c,1,-.5*s);uvs.push(0,0,1,0,1,1,0,1);nm.push(0,1,0,0,1,0,0,1,0,0,1,0);const b=k*4;ix.push(b,b+1,b+2,b,b+2,b+3)});
tg.setAttribute('position',new T.Float32BufferAttribute(ps,3));tg.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));tg.setAttribute('normal',new T.Float32BufferAttribute(nm,3));tg.setIndex(ix);
const tm=new T.MeshStandardMaterial({map:TFt,alphaTest:.45,side:2,roughness:1});tm.customProgramCacheKey=()=>'xtf';
tm.onBeforeCompile=sh=>{sh.uniforms.uT=U.uT;sh.uniforms.uW=U.uW;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uW;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat xs=sin(uT*1.7+instanceMatrix[3].x*.9+instanceMatrix[3].z*.7)*uW*.14*position.y*position.y;transformed.x+=xs;transformed.z+=xs*.6;')};
const NT=50,TF=new T.InstancedMesh(tg,tm,NT),o3=new T.Object3D(),c1=new T.Color('#86B873'),c2=new T.Color('#B2D68A'),cq=new T.Color();let n=0;
for(let tr=0;n<NT&&tr<9000;tr++){const a=rnd()*6.283;let x,z;if(rnd()<.6){const r=Math.sqrt(rnd())*7.3;x=Math.cos(a)*r;z=Math.sin(a)*r}else{const r=Math.sqrt(rnd())*.9*rho2(a);x=G2.x+Math.cos(a)*r;z=G2.z+Math.sin(a)*r}
 if(Math.abs(z)<1.2&&((x>4.8&&x<8.4)||(x>BB-.7&&x<BB+2.2)))continue;if(OBS.some(q=>Math.hypot(x-q[0],z-q[1])<q[2]+.12))continue;if(Object.values(flowers).some(f=>Math.hypot(f.position.x-x,f.position.z-z)<.8))continue;
 const s=.22+rnd()*.2;o3.position.set(x,gh(x,z)-.02,z);o3.rotation.set(0,rnd()*3.14,0);o3.scale.set(s*1.5,s,s*1.5);o3.updateMatrix();TF.setMatrixAt(n,o3.matrix);TF.setColorAt(n,cq.copy(c1).lerp(c2,rnd()).multiplyScalar(.85+rnd()*.25));n++}
TF.count=n;TF.frustumCulled=false;TF.castShadow=false;TF.receiveShadow=true;scene.add(TF);
/* --- 編譯檢查：萬一 shader 在某些裝置失敗，退回原本的地面／草叢，場景不會壞 --- */
const gl=R.getContext(),chk=m=>{try{const p=R.properties.get(m).currentProgram;return!p||gl.getProgramParameter(p.program,gl.LINK_STATUS)}catch(e){return true}};
R.compile(scene,cam);
[...GR2,tm].forEach(m=>{if(!chk(m)){console.warn('texture shader fallback');m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=>'x0';m.needsUpdate=true}});
/* --- 每幀同步：濕度、風、日夜對倒影的影響 --- */
let lh=false;function lp(t){if(SLP.on){lh=true;return}requestAnimationFrame(lp);try{const w=WX.wet||0,d=window.dfv==null?1:window.dfv;U.uWet.value=w;U.uRip.value=(S.rm||!window.GQrip)?0:w;U.uT.value=S.rm?0:t/1000;U.uW.value=S.rm?0:.5+WX.wind*1.1;PW.forEach(m=>m.envMapIntensity=.12+1.5*d);GLm.forEach(m=>m.envMapIntensity=.1+.9*d);tm.color.setScalar(1-.16*w)}catch(e){logErr(e)}}
SLP.cbs.push(()=>{if(lh){lh=false;requestAnimationFrame(lp)}});lp(0);
window.SKIN={V,SM,TB,TS,TSo,TR,wood,skinGround,TRUNK,CAN,RKG,tg,tm,DECK,boxUV,TWv,TWh,ENV};
}catch(e){console.warn('skin layer skipped',e)}
})();
