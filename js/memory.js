/* ============================================================================
 * js/memory.js — 回憶小島與佈告欄
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・河下游的第二座小島與佈告欄：把過去記錄的花朵變成軟木板上的紙條（「一週
 *     前的今天…」「開心往事…」等）。
 *   ・全部從現有花朵紀錄（S.e）即時算出，不新增任何要儲存或同步的資料；對外以
 *     window.MB 提供。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、camera.js、creatures.js、weather.js、views.js、river.js
 * 提供給其他檔案：MB
 * 載入順序：第 28 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 回憶小島 + 佈告欄 =====
   河的下游（橋的後方）有第二座小島，島上立著一塊佈告欄。
   點小島或佈告欄 → 打開「回憶佈告欄」：把你記錄在花朵上的過去，變成一張張貼在軟木板上的紙條，例如
   「一週前的今天…」「一個月前的今天…」「一年前的今天…」「開心往事…」「幸福往事…」「你曾經焦慮過…現在好些了嗎？」。
   回憶全部從現有的花朵紀錄（S.e）即時算出來：不新增任何要儲存或同步的資料，也不動花園、花朵、動物、天氣、同步等原有功能。
   沒有 WebGL 時整段跳過。 */
(function(){
'use strict';
if(typeof ok==='undefined'||!ok||typeof scene==='undefined'||typeof THREE==='undefined')return;
const T=THREE,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/* ---------- 文字（四種語言；缺的語言會自動退回英文） ---------- */
try{
I18N.add('en',{
  mbT:'Memory board',mbSub:n=>n?(n+(n>1?' memories':' memory')+' pinned up'):'',mbMore:'Shuffle',mbVisit:'Visit that flower',mbInWi:'On the Withered Isle',
  mbE0:'The board is still empty',mbE1:'Plant a few flowers. As time goes by, memories will be pinned up here one by one.',
  mbSoon:n=>'In '+n+(n>1?' days':' day')+', your first “one week ago today” will show up here.',
  mbAgo:n=>n<2?'yesterday':n<14?n+' days ago':n<60?Math.round(n/7)+' weeks ago':n<365?Math.round(n/30)+' months ago':(Math.round(n/365)>1?Math.round(n/365)+' years ago':'1 year ago'),
  mbCare:'Feeling a little better now?',mbBetter:'Much better',mbSlow:'Still taking it slow',
  mbBetterR:'I’m glad. You got here one step at a time.',mbSlowR:'That’s okay. Take your time. You’re doing enough today.',
  mt_w:'One week ago today…',mt_wa:'About a week ago…',mt_m:'One month ago today…',mt_ma:'About a month ago…',
  mt_m3:'Three months ago today…',mt_m3a:'About three months ago…',mt_m6:'Half a year ago today…',mt_m6a:'About half a year ago…',
  mt_y:'One year ago today…',mt_ya:'About a year ago…',mt_y2:'Two years ago today…',mt_y2a:'About two years ago…',
  mf_h:'A happy memory…',mf_l:'A memory of feeling loved…',mf_c:'A calm moment…',mf_e:'A day you were excited…',
  mf_s:'You were sad once…',mf_a:'You were anxious once…',mf_f:'The first flower you planted…'});
I18N.add('zh',{
  mbT:'回憶佈告欄',mbSub:n=>n?'翻出了 '+n+' 則回憶':'',mbMore:'換一批',mbVisit:'看看那朵花',mbInWi:'在凋零小島',
  mbE0:'佈告欄還空空的',mbE1:'先種下幾朵花吧。時間過去之後，回憶會一則一則貼到這裡。',
  mbSoon:n=>'再過 '+n+' 天，就會貼上第一則「一週前的今天」。',
  mbAgo:n=>n<2?'昨天':n<14?n+' 天前':n<60?Math.round(n/7)+' 週前':n<365?Math.round(n/30)+' 個月前':Math.round(n/365)+' 年前',
  mbCare:'現在好些了嗎？',mbBetter:'好多了',mbSlow:'還在慢慢來',
  mbBetterR:'太好了。你是一步一步走過來的。',mbSlowR:'沒關係，慢慢來。今天的你已經很努力了。',
  mt_w:'一週前的今天…',mt_wa:'大約一週前…',mt_m:'一個月前的今天…',mt_ma:'大約一個月前…',
  mt_m3:'三個月前的今天…',mt_m3a:'大約三個月前…',mt_m6:'半年前的今天…',mt_m6a:'大約半年前…',
  mt_y:'一年前的今天…',mt_ya:'大約一年前…',mt_y2:'兩年前的今天…',mt_y2a:'大約兩年前…',
  mf_h:'開心往事…',mf_l:'幸福往事…',mf_c:'平靜的時光…',mf_e:'興奮的那一天…',
  mf_s:'你曾經難過過…',mf_a:'你曾經焦慮過…',mf_f:'你種下的第一朵花…'});
I18N.add('ja',{
  mbT:'思い出の掲示板',mbSub:n=>n?n+'件の思い出':'',mbMore:'シャッフル',mbVisit:'その花を見に行く',mbInWi:'枯れ花の島にあります',
  mbE0:'掲示板はまだ空っぽです',mbE1:'まずは花を何輪か植えてみましょう。時間がたつと、思い出がひとつずつ貼られていきます。',
  mbSoon:n=>'あと'+n+'日で、最初の「1週間前の今日」が貼られます。',
  mbAgo:n=>n<2?'昨日':n<14?n+'日前':n<60?Math.round(n/7)+'週間前':n<365?Math.round(n/30)+'か月前':Math.round(n/365)+'年前',
  mbCare:'今は少し楽になった？',mbBetter:'だいぶ楽になった',mbSlow:'まだゆっくり中',
  mbBetterR:'よかった。ちょっとずつ、ここまで来たんだね。',mbSlowR:'だいじょうぶ、ゆっくりで。今日もよくがんばってるよ。',
  mt_w:'1週間前の今日…',mt_wa:'だいたい1週間前…',mt_m:'1か月前の今日…',mt_ma:'だいたい1か月前…',
  mt_m3:'3か月前の今日…',mt_m3a:'だいたい3か月前…',mt_m6:'半年前の今日…',mt_m6a:'だいたい半年前…',
  mt_y:'1年前の今日…',mt_ya:'だいたい1年前…',mt_y2:'2年前の今日…',mt_y2a:'だいたい2年前…',
  mf_h:'うれしかった思い出…',mf_l:'しあわせな思い出…',mf_c:'おだやかなひととき…',mf_e:'わくわくした日…',
  mf_s:'悲しかったことがあったね…',mf_a:'不安だったことがあったね…',mf_f:'最初に植えた花…'});
I18N.add('ko',{
  mbT:'추억 게시판',mbSub:n=>n?'추억 '+n+'개':'',mbMore:'다시 섞기',mbVisit:'그 꽃 보러 가기',mbInWi:'시든 꽃의 섬에 있어요',
  mbE0:'게시판이 아직 비어 있어요',mbE1:'먼저 꽃을 몇 송이 심어 보세요. 시간이 지나면 추억이 하나씩 붙어요.',
  mbSoon:n=>n+'일 뒤에 첫 번째 “일주일 전 오늘”이 붙어요.',
  mbAgo:n=>n<2?'어제':n<14?n+'일 전':n<60?Math.round(n/7)+'주 전':n<365?Math.round(n/30)+'개월 전':Math.round(n/365)+'년 전',
  mbCare:'지금은 좀 괜찮아졌나요?',mbBetter:'많이 나아졌어요',mbSlow:'아직 천천히 가는 중',
  mbBetterR:'다행이에요. 한 걸음씩 여기까지 왔네요.',mbSlowR:'괜찮아요, 천천히 해요. 오늘도 충분히 잘하고 있어요.',
  mt_w:'일주일 전 오늘…',mt_wa:'대략 일주일 전…',mt_m:'한 달 전 오늘…',mt_ma:'대략 한 달 전…',
  mt_m3:'석 달 전 오늘…',mt_m3a:'대략 석 달 전…',mt_m6:'반년 전 오늘…',mt_m6a:'대략 반년 전…',
  mt_y:'일 년 전 오늘…',mt_ya:'대략 일 년 전…',mt_y2:'이 년 전 오늘…',mt_y2a:'대략 이 년 전…',
  mf_h:'기뻤던 기억…',mf_l:'행복했던 기억…',mf_c:'평온했던 순간…',mf_e:'설렜던 그날…',
  mf_s:'슬펐던 적이 있었죠…',mf_a:'불안했던 적이 있었죠…',mf_f:'처음 심은 꽃…'});
}catch(e){logErr(e)}

/* ---------- 回憶怎麼挑 ----------
   時光回顧：一週／一個月／三個月／半年／一年／兩年前的今天（那天沒記的話，往前後找幾天，標成「大約…」）。
   心情往事：開心、幸福（被愛）、平靜、興奮、第一朵花；難過、焦慮（至少三天前的，一次最多一則，並附上「現在好些了嗎？」）。
   用「今天的日期＋花朵數量」當亂數種子：同一天看到的是同一批，按「換一批」才會重抽。 */
const DAYMS=864e5;
const noon=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
const addD=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n,12);
const addM=(d,n)=>{const y=d.getFullYear(),m=d.getMonth()+n,last=new Date(y,m+1,0).getDate();return new Date(y,m,Math.min(d.getDate(),last),12)};
const ageOf=k=>Math.round((noon(new Date())-new Date(k+'T12:00'))/DAYMS);
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const lite=(h,a)=>{const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,m=v=>Math.round(v+(255-v)*a);return'rgb('+m(r)+','+m(g)+','+m(b)+')'};
const TIME=[['mt_w',t=>addD(t,-7),1],['mt_m',t=>addM(t,-1),2],['mt_m3',t=>addM(t,-3),3],['mt_m6',t=>addM(t,-6),3],['mt_y',t=>addM(t,-12),3],['mt_y2',t=>addM(t,-24),3]];
const FEEL=[['happy','mf_h',0],['loved','mf_l',0],['calm','mf_c',0],['excited','mf_e',0],['sad','mf_s',1],['anxious','mf_a',1]];
function near(t0,tol,tk){
  for(let o=0;o<=tol;o++)for(const s of(o?[-1,1]:[0])){const k=dk(addD(t0,s*o));if(k<tk&&S.e[k])return{d:k,exact:!o}}
  return null}
function build(seed){
  const tk=today(),t0=noon(new Date()),out=[],used=new Set();
  TIME.forEach(([id,f,tol])=>{const r=near(f(t0),tol,tk);if(r&&!used.has(r.d)){used.add(r.d);out.push({d:r.d,t:id+(r.exact?'':'a'),care:0})}});
  const R=rng(seed),all=ents().filter(([d])=>d<tk),by={};
  all.forEach(([d,e])=>{(by[e.mood]=by[e.mood]||[]).push([d,e])});
  const cand=[];
  FEEL.forEach(([m,t,care])=>{let a=by[m]||[];if(care)a=a.filter(([d])=>ageOf(d)>=3);if(a.length)cand.push({t,care,a})});
  if(all.length)cand.push({t:'mf_f',care:0,a:[all[0]]});
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
  const pickOf=a=>{a=a.filter(([d])=>!used.has(d));if(!a.length)return null;const w=a.filter(([,e])=>e.text&&e.text.trim());const s=w.length?w:a;return s[Math.floor(R()*s.length)][0]};
  let cares=0,n=0;
  for(const c of cand){if(n>=3)break;if(c.care&&cares)continue;const d=pickOf(c.a);if(!d)continue;used.add(d);out.push({d,t:c.t,care:c.care});cares+=c.care;n++}
  const pw=window.SI?SI.past():[];if(pw.length){const id=pw[Math.floor(R()*pw.length)];out.splice(Math.min(2,out.length),0,{w:id,t:R()<.5?'mw_a':'mw_b',care:0})}   // 星願島：曾經的願望
  return{list:out,more:cand.length>3||cand.some(c=>c.a.length>1)||pw.length>1};
}
const seedOf=k=>hash(today()+':'+Object.keys(S.e).length)+k*7919;

/* ---------- 河與小島的位置（公式和河流區塊一致；放在橋的後方、河的東岸，避開漂流葉子走的河心） ---------- */
const WY=-.55;
const far=z=>Math.min(1,Math.max(0,(Math.abs(z)-12)/25));
const cx=z=>10.35+.7*Math.sin(z*.19+.5)+far(z)*4.5*Math.sin(z*.032+.8),hw=z=>3.5+.5*Math.sin(z*.31+1.2)+Math.max(0,Math.abs(z)-18)*.04;
const IZ=8,IR=1.5,IX=cx(IZ)-18.05;

const isl=new T.Group();isl.position.set(IX,.2,IZ);scene.add(isl);
const sway=[];
const BOX=new T.BoxGeometry(1,1,1),ICO=new T.IcosahedronGeometry(1,0);
const K=window.SKIN||null;
const mkW=(g,c,p,s,r)=>{const m=mk(g,c,p,s,r);if(K)K.wood(m,K.DECK.has(m.material.color.getHexString()));return m};
const bark=m=>{if(K){m.geometry=K.TRUNK;m.material=K.SM(m.material,'bk',K.V(K.TB,'b',1,1),{roughness:.95,bumpScale:1.5})}return m};
const leafy=m=>{if(K){m.geometry=K.CAN;m.rotation.set(0,Math.random()*6.28,0);m.material=K.SM(m.material,'lf',null,{roughness:.85,flatShading:true,side:2})}return m};
const rock=m=>{if(K){m.geometry=K.RKG;m.material=K.SM(m.material,'rk',K.V(K.TS,'s',2,2),{roughness:.92,bumpScale:3})}return m};
const roof=m=>{if(K)m.material=K.SM(m.material,'rf',K.V(K.TR,'r',4,3),{roughness:.7,bumpScale:2.5});return m};
{
  const SG=48,KR=7,Rg=a=>IR*(1+.07*Math.sin(3*a+1.9)+.042*Math.sin(5*a+.4));
  /* 草地（沿用花園的地面材質） */
  {const c1=new T.Color('#98C281'),c2=new T.Color('#B8D890'),cc=new T.Color(),pos=[0,-.06,0],col=[],idx=[];
    const paint=(x,z,dirt)=>{const n=(Math.sin(x*.9)*Math.cos(z*1.1)+Math.sin(x*.3+z*.5))*.25+.5;cc.copy(c1).lerp(c2,clamp(n,0,1));if(dirt)cc.set('#C9A97E');col.push(cc.r,cc.g,cc.b)};
    paint(IX,IZ,false);
    for(let k=1;k<=KR;k++){const f=k/KR;for(let i=0;i<SG;i++){const a=i/SG*6.2832,r=Rg(a)*f,x=Math.cos(a)*r,z=Math.sin(a)*r;pos.push(x,k===KR?-.2:-.06-.1*f*f,z);paint(IX+x,IZ+z,f>.97)}}
    for(let i=0;i<SG;i++)idx.push(0,1+(i+1)%SG,1+i);
    for(let k=0;k<KR-1;k++)for(let i=0;i<SG;i++){const a=1+k*SG+i,b=1+k*SG+(i+1)%SG,c=a+SG,d=b+SG;idx.push(a,b,c,b,d,c)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
    const gm=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,vertexColors:true});if(K)K.skinGround(gm);
    const gr=new T.Mesh(g,gm);gr.receiveShadow=true;isl.add(gr)}
  /* 島的側壁與底部 */
  {const sp=[],si=[],uv=[];
    for(let i=0;i<SG;i++){const a=i/SG*6.2832,r=Rg(a),x=Math.cos(a),z=Math.sin(a);sp.push(x*r*1.012,-.2,z*r*1.012,x*r*.87,-1.3,z*r*.87);uv.push(i/SG*3,1,i/SG*3,0)}
    for(let i=0;i<SG;i++){const j=(i+1)%SG;si.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(sp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(si);g.computeVertexNormals();
    let m=new T.MeshStandardMaterial({color:'#E3C9A8',roughness:.88,side:2,emissive:new T.Color('#E3C9A8').multiplyScalar(.13)});
    if(K)m=K.SM(m,'so',K.V(K.TSo,'o',1,1),{roughness:.95,bumpScale:1.5});
    const sk=new T.Mesh(g,m);sk.castShadow=true;isl.add(sk);
    const cp=[0,-1.45,0],ci=[];for(let i=0;i<SG;i++)cp.push(sp[i*6+3],sp[i*6+4],sp[i*6+5]);for(let i=0;i<SG;i++)ci.push(0,1+i,1+(i+1)%SG);
    const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(cp,3));cg.setIndex(ci);cg.computeVertexNormals();isl.add(new T.Mesh(cg,new T.MeshStandardMaterial({color:'#D9BD98',roughness:.9,side:2})))}
}

/* ---------- 佈告欄（兩面都有軟木板，從哪個角度看都看得到） ---------- */
const brd=new T.Group();brd.position.set(.05,-.07,-.05);brd.rotation.y=.3;isl.add(brd);
[-.56,.56].forEach(x=>brd.add(mkW(BOX,'#C79F72',[x,.75,0],[.08,1.5,.08])));
brd.add(mkW(BOX,'#C79F72',[0,.92,0],[1.36,.86,.07]));
const bc=document.createElement('canvas');bc.width=512;bc.height=336;const bx=bc.getContext('2d');
const btex=new T.CanvasTexture(bc);btex.anisotropy=4;
const bm=new T.MeshStandardMaterial({map:btex,roughness:.95,emissive:new T.Color('#ffffff'),emissiveMap:btex,emissiveIntensity:.2});
const bpl=new T.PlaneGeometry(1.2,.7);
const bf=new T.Mesh(bpl,bm);bf.position.set(0,.92,.037);brd.add(bf);
const bb=new T.Mesh(bpl,bm);bb.position.set(0,.92,-.037);bb.rotation.y=Math.PI;brd.add(bb);
/* 小屋頂 */
[1,-1].forEach(s=>brd.add(roof(mk(BOX,'#F29BB5',[0,1.58,s*.22],[1.62,.05,.5],[s*.55,0,0]))));
brd.add(mkW(BOX,'#B58B66',[0,1.72,0],[1.64,.05,.06]));
/* 掛在右邊柱子上的小燈籠（夜裡會亮） */
const lm2=new T.MeshStandardMaterial({color:'#FFE3B0',roughness:.5,emissive:new T.Color('#FFC77A'),emissiveIntensity:.2});
brd.add(mkW(BOX,'#B58B66',[.64,1.25,.06],[.18,.03,.03]));
const lan=mk(BOX,'#fff',[.7,1.1,.06],[.13,.18,.13],null,lm2);lan.castShadow=false;brd.add(lan);
const lanGl=new T.Sprite(new T.SpriteMaterial({map:window.GLOW,color:'#FFD9A0',blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));lanGl.scale.set(1.4,1.4,1);lanGl.position.set(.7,1.1,.06);brd.add(lanGl);

/* 櫻花樹、石頭、蘆葦、小花、草叢 */
{
  const tr2=new T.Group();tr2.position.set(-.72,-.08,.5);
  tr2.add(bark(mk(CYL,'#C9A27A',[0,.5,0],[.08,1,.08],[0,0,.08])));
  const can=new T.Group();can.position.set(0,1.08,0);
  [[0,0,0,.5,'#F5C7D5'],[.32,-.1,.08,.34,'#F8D8E3'],[-.3,-.08,-.08,.34,'#F5C7D5'],[.05,.2,-.15,.3,'#F8D8E3'],[-.05,-.04,.32,.28,'#F5C7D5']].forEach(([x,y,z,s,c])=>can.add(leafy(mk(SPH,c,[x,y,z],[s,s*.8,s]))));
  tr2.add(can);isl.add(tr2);sway.push({o:can,k:.03,p:1.3,ax:'z'});
  function reeds(x,z,n,s){const g=new T.Group();g.position.set(x,-.1,z);for(let i=0;i<n;i++){const h=(.5+((i*37)%10)/16)*s,pv=new T.Group();pv.position.set((i%3-1)*.07,0,(i%2-.5)*.09);pv.add(mk(CYL,'#8FBF7F',[0,h/2,0],[.016,h,.016]));if(i%3==0)pv.add(mk(CYL,'#8A5A3C',[0,h+.02,0],[.035,.14,.035]));g.add(pv);sway.push({o:pv,k:.07,p:i*.8+x,ax:i%2?'x':'z'})}return g}
  [[-1.0,-.35,5,.9],[.95,-.7,5,1],[.55,.9,4,.8]].forEach(([x,z,n,s])=>isl.add(reeds(x,z,n,s)));
  [[.85,.5,.2],[-.4,-.85,.15],[1.0,.1,.13]].forEach(([x,z,s])=>isl.add(rock(mk(ICO,'#D9D2CE',[x,-.05,z],[s,s*.7,s*.85],[.3,.6,0]))));
  [[.4,.6,'#F5C7D5'],[-.2,.8,'#fff'],[-.85,-.1,'#F5DEA0'],[.2,-.75,'#B9D8EB'],[.75,-.1,'#F5C7D5'],[-.5,-.55,'#fff']].forEach(([x,z,c])=>{const g=new T.Group();g.position.set(x,-.07,z);g.add(mk(CYL,'#8FBF7F',[0,.09,0],[.012,.18,.012]),mk(SPH,c,[0,.2,0],[.05,.04,.05]));isl.add(g)});
  if(K&&K.tg&&K.tm){const n=7,im=new T.InstancedMesh(K.tg,K.tm,n),o3=new T.Object3D(),cA=new T.Color('#86B873'),cB=new T.Color('#B2D68A'),cq=new T.Color();let c=0;
    for(let t=0;c<n&&t<300;t++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*IR*.85,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(Math.abs(x)<.85&&Math.abs(z)<.4)continue;if(Math.hypot(x+.72,z-.5)<.4)continue;
      const sc=.14+Math.random()*.12;o3.position.set(x,-.1,z);o3.rotation.set(0,Math.random()*3.14,0);o3.scale.set(sc*1.5,sc,sc*1.5);o3.updateMatrix();im.setMatrixAt(c,o3.matrix);im.setColorAt(c,cq.copy(cA).lerp(cB,Math.random()).multiplyScalar(.85+Math.random()*.25));c++}
    im.count=c;im.frustumCulled=false;im.castShadow=false;im.receiveShadow=true;isl.add(im)}
}

/* ---------- 板子上貼的紙條（畫在軟木板貼圖上；顏色就是目前回憶的心情顏色） ---------- */
const SLOT=[[86,84,-.08],[256,70,.05],[426,90,-.04],[100,236,.06],[262,248,-.05],[420,230,.08]];
function paintBoard(list){
  let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  bx.fillStyle='#CDA470';bx.fillRect(0,0,512,336);
  for(let i=0;i<1100;i++){bx.fillStyle=r()<.5?'rgba(120,80,40,.2)':'rgba(255,232,185,.2)';bx.fillRect(r()*512,r()*336,1.5+r()*3,1.5+r()*3)}
  bx.strokeStyle='rgba(110,70,30,.35)';bx.lineWidth=6;bx.strokeRect(3,3,506,330);
  const draw=(x,y,rot,fill,mood)=>{
    bx.save();bx.translate(x,y);bx.rotate(rot);
    bx.shadowColor='rgba(60,35,10,.35)';bx.shadowBlur=8;bx.shadowOffsetY=4;
    bx.fillStyle=fill;bx.fillRect(-56,-48,112,98);bx.shadowColor='transparent';
    bx.fillStyle='rgba(0,0,0,.08)';bx.beginPath();bx.moveTo(56,50);bx.lineTo(56,28);bx.lineTo(34,50);bx.closePath();bx.fill();
    bx.fillStyle='rgba(90,70,60,.28)';[-22,-6,10].forEach((yy,i)=>{bx.fillRect(-42,yy,84-i*16,5)});
    if(mood){bx.fillStyle=mood;bx.beginPath();bx.moveTo(-34,40);bx.bezierCurveTo(-48,28,-40,18,-34,26);bx.bezierCurveTo(-28,18,-20,28,-34,40);bx.fill()}
    bx.fillStyle='#E9686F';bx.beginPath();bx.arc(0,-46,7,0,6.283);bx.fill();
    bx.fillStyle='rgba(255,255,255,.7)';bx.beginPath();bx.arc(-2,-48,2.4,0,6.283);bx.fill();
    bx.restore()};
  if(!list.length){[0,1,2].forEach(i=>draw(SLOT[i*2][0],SLOT[i*2][1],SLOT[i*2][2],'rgba(255,248,228,.62)',null))}
  else list.slice(0,6).forEach((m,i)=>{const e=m.w?S.w[m.w]:S.e[m.d];if(!e)return;const c=m.w?'#F2B93B':(M[e.mood]||M.happy).c;draw(SLOT[i][0],SLOT[i][1],SLOT[i][2],lite(c,.6),c)});
  btex.needsUpdate=true}

/* ---------- 提示用的小便條紙（飄在屋頂上方，點它或點小島都會打開） ---------- */
const hint=(()=>{
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const gr=x.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(.6,'rgba(255,255,255,.05)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  x.save();x.translate(64,68);x.rotate(-.12);
  const lg=x.createLinearGradient(-30,-34,30,34);lg.addColorStop(0,'#FFF0AE');lg.addColorStop(1,'#F6CF62');
  x.fillStyle=lg;x.beginPath();x.moveTo(-30,-32);x.lineTo(30,-32);x.lineTo(30,18);x.lineTo(18,30);x.lineTo(-30,30);x.closePath();x.fill();x.lineWidth=4;x.strokeStyle='rgba(255,255,255,.95)';x.lineJoin='round';x.stroke();
  x.fillStyle='rgba(0,0,0,.12)';x.beginPath();x.moveTo(18,30);x.lineTo(30,18);x.lineTo(18,18);x.closePath();x.fill();
  x.fillStyle='#F29BB5';x.beginPath();x.moveTo(0,12);x.bezierCurveTo(-19,-3,-11,-21,0,-9);x.bezierCurveTo(11,-21,19,-3,0,12);x.fill();
  x.fillStyle='#E9686F';x.beginPath();x.arc(0,-32,6.5,0,6.283);x.fill();x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(-2,-34,2.2,0,6.283);x.fill();
  x.restore();
  const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(.8,.8,1);sp.position.set(0,2.2,0);isl.add(sp);
  const gl=new T.Sprite(new T.SpriteMaterial({map:window.GLOW,color:'#FFF0C0',blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:.06}));gl.scale.set(1.05,1.05,1);gl.position.copy(sp.position);gl.renderOrder=1;sp.renderOrder=2;isl.add(gl);
  return{sp,gl,hov:false,y:2.2}})();
const hit=new T.Mesh(new T.SphereGeometry(1.9,10,8),new T.MeshBasicMaterial({visible:false}));hit.position.set(0,.8,0);isl.add(hit);

/* 夜晚的螢火蟲 */
const FF=8,ffs=[],ffp=new Float32Array(FF*3);for(let i=0;i<FF;i++)ffs.push({a:Math.random()*6.28,r:.6+Math.random()*1.6,y:.2+Math.random()*1.3,s:.15+Math.random()*.25,p:Math.random()*6});
const ffg=new T.BufferGeometry();ffg.setAttribute('position',new T.BufferAttribute(ffp,3));
const ffm=new T.PointsMaterial({color:'#FFF3B0',size:.28,map:window.GLOW,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const fireflies=new T.Points(ffg,ffm);fireflies.frustumCulled=false;scene.add(fireflies);

/* ---------- 每一幀 ---------- */
let T0=performance.now(),sh=false,hovT=0,sigT=0,sig='',hasTime=false,ripT=2,tmr=null;
SLP.cbs.push(()=>{if(sh){sh=false;T0=performance.now();requestAnimationFrame(step)}});
function sigOf(){let s=today();for(const k in S.e)s+='|'+k+S.e[k].mood;if(window.SI)s+=SI.sig();return s}
function repaint(){const r=build(seedOf(0)).list;paintBoard(r);hasTime=r.some(x=>x.t.charAt(1)==='t')}
function step(now){
  if(SLP.on){sh=true;return}
  requestAnimationFrame(step);
  const dt=Math.min(.05,(now-T0)/1000);T0=now;if(dt<=0)return;
  let rm=false,day=1,wind=.3;try{rm=!!S.rm;day=window.dfv==null?1:window.dfv;wind=WX.wind||0}catch(e){logErr(e)}
  const t=now/1000,night=1-day;
  sigT-=dt;if(sigT<=0){sigT=1;try{const g=sigOf();if(g!==sig){sig=g;repaint()}}catch(e){logErr(e)}}
  if(!rm){const w=.5+wind*1.1;sway.forEach(s=>{const v=Math.sin(t*(1+w*.5)+s.p)*s.k*w;if(s.ax==='z')s.o.rotation.z=v;else s.o.rotation.x=v});
    hint.sp.position.y=hint.y+Math.sin(t*1.5+.8)*.06;hint.sp.material.rotation=Math.sin(t*.9)*.12;
    ripT-=dt;if(ripT<=0){ripT=3.2+Math.random()*2.5;try{const a=Math.PI*(.6+Math.random()*.8);RV.addRip(IX+Math.cos(a)*IR*1.3,IZ+Math.sin(a)*IR*1.3,.3)}catch(e){logErr(e)}}}
  if(hint.hov&&now-hovT>400)hint.hov=false;
  const hv=hint.hov?1.18:1;hint.sp.scale.x+=(.8*hv-hint.sp.scale.x)*.15;hint.sp.scale.y=hint.sp.scale.x;
  hint.gl.material.opacity=.06+(hasTime?.03:0)+(rm?0:(hasTime?.03:.02)*Math.sin(t*1.6))+(hint.hov?.05:0);hint.gl.position.y=hint.sp.position.y;
  lm2.emissiveIntensity=.2+1.3*night;lanGl.material.opacity=.06+.55*night;
  ffm.opacity=night*.9;fireflies.visible=night>.05;
  if(fireflies.visible){const a=ffg.attributes.position;ffs.forEach((f,i)=>{const q=rm?0:t*f.s+f.a;a.setXYZ(i,IX+Math.cos(q)*f.r,f.y+Math.sin(t*.8+f.p)*.15,IZ+Math.sin(q*1.3)*f.r*.8)});a.needsUpdate=true}
}
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

/* ---------- 佈告欄視窗 ---------- */
const css=document.createElement('style');css.textContent=`
#mbo{z-index:21;background:rgba(90,110,130,.28);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px)}
.mbs{width:min(660px,100%);max-height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);max-height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);display:flex;flex-direction:column;border-radius:26px;padding:12px;background:linear-gradient(#C99B67,#B98B58);box-shadow:0 18px 40px rgba(70,45,20,.38),inset 0 0 0 2px rgba(255,235,200,.35);animation:mbin .5s cubic-bezier(.2,.9,.3,1.1) both}
.mbh{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:4px 10px 10px;color:#FFF6E6;text-shadow:0 1px 3px rgba(70,45,20,.4)}
.mbh h2{font-size:22px;display:flex;align-items:center;gap:6px}.mbh span{font-size:13px;opacity:.92}
.mbb{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:16px;padding:24px 14px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:26px 16px;align-content:start;
  background:radial-gradient(rgba(120,75,35,.22) 1px,transparent 1.6px) 0 0/9px 9px,radial-gradient(rgba(255,240,205,.38) 1px,transparent 1.6px) 4px 5px/11px 11px,#D8B07A;box-shadow:inset 0 3px 10px rgba(90,55,20,.38)}
.mbn{position:relative;display:flex;flex-direction:column;gap:7px;padding:18px 14px 12px;background:var(--pc);color:#5B4A4A;border-radius:3px 3px 14px 3px;box-shadow:0 7px 14px rgba(70,45,20,.28);transform:rotate(var(--r));transition:transform .4s cubic-bezier(.2,.9,.3,1.25),box-shadow .4s ease;animation:mbd .55s cubic-bezier(.2,.9,.3,1.15) backwards;animation-delay:calc(var(--i)*70ms)}
.mbn:hover{transform:rotate(0) translateY(-6px) scale(1.03);box-shadow:0 18px 28px rgba(70,45,20,.34);z-index:1}
.mbn::before{transition:transform .4s cubic-bezier(.2,.9,.3,1.4)}.mbn:hover::before{transform:translateY(-2px) scale(1.12)}
.mbn::before{content:"";position:absolute;top:-9px;left:50%;margin-left:-9px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.8) 0 14%,var(--pin) 17%);box-shadow:0 3px 5px rgba(0,0,0,.3)}
.mbn::after{content:"";position:absolute;right:0;bottom:0;width:22px;height:22px;background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,.09) 50%);border-radius:0 0 14px 0;pointer-events:none}
.mbn h3{font:600 17px/1.3 Fredoka,Nunito,sans-serif;margin-top:2px}
.mbi{display:flex;align-items:center;gap:8px}.mbi small{display:block;font-size:12px;opacity:.72;line-height:1.35}.mbi b{font-size:14px}
.mbq{font-style:italic;font-size:14.5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;word-break:break-word;-webkit-user-select:text;user-select:text}
.mbq.open{display:block}.mbq.no{opacity:.6;cursor:default;font-style:normal;font-size:13.5px}
.mbt{display:flex;gap:4px;flex-wrap:wrap}.mbt i{font-style:normal;font-size:11.5px;background:rgba(255,255,255,.6);border-radius:99px;padding:1px 8px}
.mbc{background:rgba(255,255,255,.55);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.mbc b{font-size:14px}.mbk{display:flex;gap:6px;flex-wrap:wrap}.mbk button{background:#fff;border-radius:99px;padding:4px 12px;font-size:13px;box-shadow:0 2px 6px #0001}
.mbr{font-size:13.5px;line-height:1.5}
.mbv{align-self:flex-start;margin-top:auto;background:rgba(255,255,255,.7);border-radius:99px;padding:5px 12px;font-size:13px;display:inline-flex;align-items:center;gap:4px}.mbv .ms{font-size:18px}.mbv.wi{background:rgba(226,214,186,.78);color:#6B5A44}
.mbf{flex:none;display:flex;justify-content:space-between;gap:8px;padding:10px 6px 2px}.mbh{flex:none}
@keyframes mbin{from{opacity:0;transform:translateY(24px) scale(.94)}}
@keyframes mbd{from{opacity:0;transform:translateY(-16px) rotate(calc(var(--r) - 7deg)) scale(.92)}}
@media(max-width:520px){.mbb{grid-template-columns:1fr;padding:22px 12px 14px;gap:24px}.mbs{padding:10px;border-radius:22px}}
@media(prefers-reduced-motion:reduce){.mbs,.mbn{animation:none}.mbn,.mbn::before{transition:none}}body.rm .mbs,body.rm .mbn{animation:none}
`;document.head.appendChild(css);
document.body.insertAdjacentHTML('beforeend',`<div class="scrim" id="mbo" hidden><div class="mbs" id="mbd" role="dialog" aria-modal="true"><div class="mbh"><h2 id="mbh"></h2><span id="mbn"></span></div><div class="mbb" id="mbb"></div><div class="mbf"><button class="btn" id="mbsh"></button><button class="btn p" id="mbx"></button></div></div></div>`);
const $o=document.getElementById('mbo'),$b=document.getElementById('mbb'),$x=document.getElementById('mbx'),$sh=document.getElementById('mbsh');
const PINS=['#E9686F','#5FA8D3','#F2B93B','#7DB36F','#B7A2E0'];
let shuf=0;
function noteHTML(m,i){
  if(m.w){const w=S.w[m.w];if(!w)return'';const rot=((hash(m.w+m.t)%70)-35)/10;
    return `<article class="mbn" style="--r:${rot}deg;--pc:#FFF1BF;--pin:${PINS[i%PINS.length]};--i:${i}"><h3>${esc(tr(m.t))}</h3>
<div class="mbi">${SI.icon(38,2)}<span><b>${esc(tr('swName'))}</b><small>${esc(tr('swTargetL'))} · ${esc(SI.dfmt(w.tt))}</small><small>${esc(tr('wiPlant'))} ${esc(SI.dfmt(w.pt))}</small></span></div>
<p class="mbq" role="button" tabindex="0" aria-expanded="false">“${esc(w.tx)}”</p>
<button class="mbv${w.sh?' wi':''}" data-w="${m.w}">${ic(w.sh?'yard':'local_florist')} ${esc(tr(w.sh?'mbInWi':'mbVisit'))}</button></article>`}
  const e=S.e[m.d];if(!e)return'';
  const mo=M[e.mood]||M.happy,ag=ageOf(m.d),rot=((hash(m.d+m.t)%70)-35)/10,tx=e.text&&e.text.trim();
  const tags=(e.tags||[]).map(g=>'<i>'+esc((tr('tg')||[])[TAGS.indexOf(g)]||g)+'</i>').join('');
  return `<article class="mbn" style="--r:${rot}deg;--pc:${lite(mo.c,.62)};--pin:${PINS[i%PINS.length]};--i:${i}"><h3>${esc(tr(m.t))}</h3>
<div class="mbi">${flo(e.mood,38)}<span><b>${esc(mo.f)}</b><small>${esc(mo.n)} · ${esc(fmt(m.d))}</small><small>${esc(tr('mbAgo',ag))}</small></span></div>
${tx?`<p class="mbq" role="button" tabindex="0" aria-expanded="false">“${esc(tx)}”</p>`:`<p class="mbq no">${esc(tr('noNote'))}</p>`}
${tags?`<div class="mbt">${tags}</div>`:''}
${m.care?`<div class="mbc"><b>${esc(tr('mbCare'))}</b><div class="mbk"><button data-a="b">${esc(tr('mbBetter'))}</button><button data-a="s">${esc(tr('mbSlow'))}</button></div><p class="mbr" hidden></p></div>`:''}
<button class="mbv${e.sh?' wi':''}" ${e.sh?'data-wi="1"':`data-v="${m.d}"`}>${ic(e.sh?'yard':'local_florist')} ${esc(tr(e.sh?'mbInWi':'mbVisit'))}</button></article>`}
function render(){
  const r=build(seedOf(shuf));
  document.getElementById('mbd').setAttribute('aria-label',tr('mbT'));
  document.getElementById('mbh').innerHTML=ic('push_pin')+' '+esc(tr('mbT'));
  document.getElementById('mbn').textContent=tr('mbSub',r.list.length);
  $x.innerHTML=ic('close')+' '+esc(tr('close'));
  $sh.innerHTML=ic('shuffle')+' '+esc(tr('mbMore'));$sh.style.visibility=r.more?'visible':'hidden';
  if(r.list.length)$b.innerHTML=r.list.map(noteHTML).join('');
  else{
    const ks=Object.keys(S.e).sort(),dd=ks.length?7-ageOf(ks[0]):0;
    $b.innerHTML=`<article class="mbn" style="--r:-1.5deg;--pc:#FFF8E4;--pin:#F29BB5;--i:0"><h3>${esc(tr('mbE0'))}</h3><p class="mbq no">${esc(tr('mbE1'))}</p>${dd>0?`<p class="mbq no">${esc(tr('mbSoon',dd))}</p>`:''}</article>`}
  $b.scrollTop=0}
$b.addEventListener('click',e=>{
  const v=e.target.closest('.mbv');if(v){if(v.dataset.wi){toWither();return}if(v.dataset.w){close(false);try{SI.visit(v.dataset.w)}catch(x){logErr(x)}}else visit(v.dataset.v);return}
  const a=e.target.closest('.mbk button');if(a){const c=a.closest('.mbc'),p=c.querySelector('.mbr');p.textContent=tr(a.dataset.a==='b'?'mbBetterR':'mbSlowR');p.hidden=false;c.querySelector('.mbk').hidden=true;return}
  const q=e.target.closest('.mbq:not(.no)');if(q){const o=q.classList.toggle('open');q.setAttribute('aria-expanded',o)}});
$b.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.mbq:not(.no)')){e.preventDefault();e.target.click()}});
function open(){
  const lf=document.getElementById('rvm');if(!$o.hidden||(lf&&!lf.hidden))return;
  shuf=0;render();$o.hidden=false;$('card').hidden=true;
  tgG.set(IX,.4,IZ+.2);radG=Math.min(radG,14);
  try{sfx('island')}catch(e){logErr(e)}
  setTimeout(()=>{try{$x.focus({preventScroll:true})}catch(e){logErr(e)}},350)}
function close(goHome){$o.hidden=true;if(goHome&&typeof home==='function')(typeof homeSoft==='function'?homeSoft():home())}
function toWither(){close(false);try{if(window.WI)WI.open();else if(typeof home==='function')(typeof homeSoft==='function'?homeSoft():home())}catch(e){logErr(e)}}
function visit(d){if(!S.e[d])return;if(S.e[d].sh){toWither();return}close(false);try{detail(d)}catch(e){logErr(e)}}
$x.onclick=()=>close(true);
$sh.onclick=()=>{shuf++;render()};
$o.addEventListener('pointerdown',e=>{if(e.target===$o)close(true)});
addEventListener('keydown',e=>{if(!$o.hidden&&e.key==='Escape')close(true)});
window.MB={pick,open,close};
try{sig=sigOf();repaint()}catch(e){paintBoard([])}
})();
