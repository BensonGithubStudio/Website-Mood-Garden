/* ============================================================================
 * js/views.js — 主要畫面：首頁、記錄視窗、月曆、統計與設定
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・refresh（首頁狀態）、detail（花朵詳情卡）、rotateFlower、openModal（記
 *     錄今天心情的視窗）。
 *   ・renderCal（月曆）、renderIns（統計）、renderSet（設定：語言選單由 LANGS
 *     產生、畫質、音量、同步、清除資料…）。
 *
 * 需要先載入：audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、flowers.js、flower-care.js、garden-scene.js、camera.js、
 *   creatures.js、weather.js、gifts.js、ui-shell.js
 * 提供給其他檔案：refresh、detail、rotateFlower、ed、sel、tg2、openModal、
 *   cm、renderCal、renderIns、renderSet
 * 載入順序：第 23 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

function refresh(){const n=new Date(),mk=dk(n).slice(0,7),en=ents(),mo=en.filter(([d])=>d.startsWith(mk)),c={};mo.forEach(([,e])=>c[e.mood]=(c[e.mood]||0)+1);
  $('date').textContent=n.toLocaleDateString(LC(),{weekday:'short',month:'short',day:'numeric'});
  $('hi').innerHTML=ic('local_florist')+(S.e[today()]?tr('hi1'):tr('hi0'));
  $('cnt').innerHTML=ic('eco')+' '+tr('cnt',en.filter(([,x])=>!x.sh).length);
  $('mon').innerHTML=mo.length?tr('mon')+' '+Object.entries(c).map(([k,v])=>flo(k,18)+'×'+v).join(' '):tr('monNone');
  $('fab').hidden=!!S.e[today()];$('fab').innerHTML=ic('local_florist');$('fab').setAttribute('aria-label',tr('rec'));$('fab').title=tr('rec');{const wi=Object.keys(M).indexOf(window.wxm);$('wxc').innerHTML=wi>=0?ic(['air','auto_awesome','air','filter_vintage','water_drop','cloud'][wi])+' '+tr('wxn')[wi]:''}$('arr').innerHTML=ic(arrange?'check_circle':'open_with');$('arr').setAttribute('aria-label',tr(arrange?'done':'arr'));$('arr').title=tr(arrange?'done':'arr');if(window.GF)GF.refresh()}
function detail(d){const e=S.e[d];if(!e)return;show('garden');const f=flowers[d];if(f){tgG.set(f.position.x,f.position.y+.8,f.position.z);radG=5}
  const m=M[e.mood],c=$('card'),sv=shoveled(e),wd=!sv&&withered(d,e);
  /* 同一行：成長提示（澆水／小花苗）＋凋零提示，放得下就並排，放不下才換行 */
  const rows=[];
  if(!sv&&!wd&&!matureOf(e))rows.push(e.wt?'💧 '+tr('wetNote',minsLeftW(e)):thirstyOf(e)?'💧 '+tr('thirsty'):'🌱 '+tr('sprout',hrsLeft(e)));
  if(sv||wd||matureOf(e))rows.push('🥀 '+(sv?tr('wMoved'):wd?tr('wNow'):witherLeftTxt(d,e)));   // 還沒長大（還沒澆水／成長中）時先不顯示凋零倒數
  const dim=(sv||wd)?'filter:grayscale(.75) sepia(.25);opacity:.85;':'';
  const SHOVEL='<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="currentColor" aria-hidden="true" style="vertical-align:-.25em;flex:none"><g transform="rotate(35 12 12)"><rect x="10.9" y="1.8" width="2.2" height="11" rx="1.1"/><rect x="8.2" y="1.8" width="7.6" height="2.3" rx="1.15"/><path d="M7.2 12.4h9.6v3.4c0 3.1-2.1 5.7-4.8 6.9-2.7-1.2-4.8-3.8-4.8-6.9z"/></g></svg>';
  const rot=`<button class="btn" id="cr" data-sfx="off" aria-label="${tr('gRotB')}" title="${tr('gRotB')}">${ic('rotate_right')}</button>`,
    cls=`<button class="btn" id="cx" style="margin-left:auto" aria-label="${tr('close')}" title="${tr('close')}">${ic('close')}</button>`;
  const btns=sv?`<button class="btn" id="cv" aria-label="${tr('wiT')}" title="${tr('wiT')}">${ic('yard')} ${tr('wiT')}</button>${cls}`
    :wd?`<button class="btn" id="cs" aria-label="${tr('wShovel')}" title="${tr('wShovel')}">${SHOVEL}</button>${rot}${cls}`
    :`${thirstyOf(e)?`<button class="btn w" id="cw" data-sfx="off" aria-label="${tr('waterB')}" title="${tr('waterB')}">${ic('water_drop')}</button>`:''}<button class="btn" id="ce" aria-label="${tr('edit')}" title="${tr('edit')}">${ic('edit')}</button>${rot}<button class="btn r" id="cd" aria-label="${tr('delete')}" title="${tr('delete')}">${ic('delete')}</button>${cls}`;
  c.hidden=false;
  c.innerHTML=`<div style="font-size:12px;opacity:.7">${fmt(d)}</div><h2 style="display:flex;align-items:center;gap:8px"><span style="display:inline-flex;${dim}">${flo(e.mood,36)}</span><span>${m.f}</span></h2><div style="display:flex;align-items:center;gap:6px">${face(e.mood,24)} ${m.n}</div><div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:12px;opacity:.75;margin-top:4px">${rows.map(x=>`<span>${x}</span>`).join('')}</div>${e.text?`<p>“${esc(e.text)}”</p>`:'<p style="opacity:.6">'+tr('noNote')+'</p>'}<div class="chips">${(e.tags||[]).map(t=>`<span>${esc(tr('tg')[TAGS.indexOf(t)]||t)}</span>`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px">${btns}</div>`;
  if($('ce'))$('ce').onclick=()=>openModal(d);if($('cr'))$('cr').onclick=()=>rotateFlower(d);if($('cw'))$('cw').onclick=()=>{if(water(d))detail(d)};$('cx').onclick=()=>{c.hidden=true};
  if($('cs'))$('cs').onclick=async()=>{if(await ask(tr('shovelQ'),tr('shovelB')))shovelFlower(d)};
  if($('cv'))$('cv').onclick=()=>{c.hidden=true;if(window.WI)WI.open()};
  if($('cd'))$('cd').onclick=async()=>{if(await ask(tr('delQ'),tr('delete'))){sfx('delete');if(flowers[d]){scene.remove(flowers[d]);freeObj(flowers[d]);delete flowers[d]}delete S.e[d];syncCr();save();c.hidden=true;home();refresh();toast(tr('removed'))}}}
/* 旋轉花朵：每按一次轉 45 度（帶緩動）；角度存在 S.e[d].r，save() 會偵測到變更並更新時間，因此會隨花朵一起同步到 Google 雲端 */
function rotateFlower(d){const e=S.e[d];if(!e)return;const f=flowers[d],TP=Math.PI*2,u=f&&f.userData;
  const cur=u?(u.ryT!=null?u.ryT:f.rotation.y):(e.r||0),nx=cur+Math.PI/4;
  if(u){u.ryT=nx;if(S.rm)f.rotation.y=nx}
  e.r=((nx%TP)+TP)%TP;save();sfx('rotate','click')}
let ed,sel,tg2=[];
function openModal(d){ed=d||today();const e=S.e[ed];sel=e?e.mood:null;tg2=e?[...(e.tags||[])]:[];
  $('mt').textContent=e?tr('editT',ed==today()?'':fmt(ed)):tr('hi0');$('ms').textContent=e?tr('save'):tr('plant');$('txt').value=e?e.text||'':'';
  $('moods').innerHTML=Object.entries(M).map(([k,m])=>`<button class="mc" data-k="${k}" style="--c:${m.c}" aria-pressed="${k==sel}"><b>${face(k,56)}</b><span>${m.n}</span><small>${flo(k,16)} ${m.f}</small></button>`).join('');
  $('tags').innerHTML=TAGS.map(t=>`<button class="tag" data-v="${t}" aria-pressed="${tg2.includes(t)}">${tr('tg')[TAGS.indexOf(t)]}</button>`).join('');
  $('moods').onclick=ev=>{const b=ev.target.closest('.mc');if(!b)return;sel=b.dataset.k;$('moods').querySelectorAll('.mc').forEach(x=>x.setAttribute('aria-pressed',x==b))};
  $('tags').onclick=ev=>{const b=ev.target.closest('.tag');if(!b)return;const t=b.dataset.v,i=tg2.indexOf(t);i<0?tg2.push(t):tg2.splice(i,1);b.setAttribute('aria-pressed',i<0)};
  const full=!e&&gardenFull();$('gfull').hidden=!full;$('gfull').innerHTML=full?'<b>'+esc(tr('gdFullT'))+'</b>'+esc(tr('gdFull')):'';$('ms').disabled=full;
  $('modal').hidden=false}
$('fab').onclick=()=>openModal();$('mx').onclick=()=>$('modal').hidden=true;
$('ms').onclick=()=>{if(!sel){toast(tr('pick'));return}
  if(!S.e[ed]&&gardenFull()){toast(tr('gdFullT'));sfx('deny');return}sfx('plant');
  const e=S.e[ed],isNew=!e;S.e[ed]={...(e||{}),mood:sel,text:$('txt').value.trim(),tags:tg2,pt:isNew?Date.now():(e&&e.pt)};S.wx=sel;S.wxd=today();save();setWeather(sel);$('modal').hidden=true;$('card').hidden=true;show('garden');
  if(isNew){if(!ok){toast(tr('saved'));return}addFlower(ed,0);const f=flowers[ed],hole=mk(CYL,'#7A5A3A',[f.position.x,f.position.y+.01,f.position.z],[.3,.02,.3]),seed=mk(SPH,'#5B4A3A',[f.position.x,3,f.position.z],[.07,.09,.07]);scene.add(hole,seed);
    const n=30,ar=new Float32Array(n*3);for(let i=0;i<n;i++){ar[i*3]=f.position.x+(Math.random()-.5)*1.4;ar[i*3+1]=f.position.y+Math.random()*1.8;ar[i*3+2]=f.position.z+(Math.random()-.5)*1.4}
    const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(ar,3));sparkle=new THREE.Points(g,own(new THREE.PointsMaterial({color:'#FFE9A0',size:.4,map:window.GLOW,blending:THREE.AdditiveBlending,transparent:true,opacity:0,depthWrite:false})));scene.add(sparkle);
    P={d:ed,t:0,seed,hole};tgG.set(f.position.x,f.position.y+.6,f.position.z);radG=6;
  }else{const o=flowers[ed];if(o){scene.remove(o);freeObj(o);delete flowers[ed]}addFlower(ed,1);toast(tr('updated'))}
  refresh()};
let cm=new Date();cm.setDate(1);
function renderCal(){const y=cm.getFullYear(),m=cm.getMonth(),first=cm.getDay(),n=new Date(y,m+1,0).getDate(),t=today();
  let h=`<div class="mh"><button id="pv" aria-label="Previous month">${ic('chevron_left')}</button><h2 style="margin:0">${cm.toLocaleDateString(LC(),{month:'long',year:'numeric'})}</h2><button id="nx" aria-label="Next month">${ic('chevron_right')}</button></div><div class="cal">`+tr('wd').map(x=>`<div class="w">${x}</div>`).join('')+'<div></div>'.repeat(first);
  for(let d=1;d<=n;d++){const k=dk(new Date(y,m,d)),e=S.e[k];h+=`<button class="d ${e?'':'e'} ${k==t?'t':''}" data-k="${k}" aria-label="${k}">${d}<i>${e?flo(e.mood,24):''}</i></button>`}
  $('p-cal').innerHTML=h+'</div><p style="margin-top:12px;font-size:13px;opacity:.75">'+tr('calNote')+'</p>';
  $('pv').onclick=()=>{cm.setMonth(m-1);renderCal()};$('nx').onclick=()=>{cm.setMonth(m+1);renderCal()};
  $('p-cal').querySelectorAll('.d').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(S.e[k])detail(k);else if(k==t){show('garden');openModal()}else toast(tr('calHint'))})}
function renderIns(){const en=ents(),mk=today().slice(0,7),mo=en.filter(([d])=>d.startsWith(mk)),c={};mo.forEach(([,e])=>c[e.mood]=(c[e.mood]||0)+1);
  if(!en.length){$('p-ins').innerHTML='<h2>'+tr('n_ins')+'</h2><p>'+tr('insEmpty')+'</p>';return}
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0],mx=Math.max(1,...Object.values(c));
  let h=`<h2>${tr('insM')}</h2><p>${top?tr('common',flo(top[0],20)+' '+M[top[0]].n,Math.round(top[1]/mo.length*100),mo.length):tr('insNone')}</p>`;
  h+=Object.entries(M).map(([k,m])=>{const v=c[k]||0;return`<div class="bar"><b>${flo(k,20)} ${m.n}</b><div style="width:${v/mx*55+3}%;background:${m.c}"></div><span>${v}</span></div>`}).join('');
  h+='<h2 style="margin-top:18px">'+tr('l7')+'</h2><div class="wk">';
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dk(d),e=S.e[k];h+=`<div><i style="${e?'background:'+M[e.mood].c+'55':''}">${e?face(e.mood,28):''}</i>${d.toLocaleDateString(LC(),{weekday:'short'})}</div>`}
  $('p-ins').innerHTML=h+`</div><p style="margin-top:16px">${ic('eco')} ${tr('total',en.length)}</p><h2 style="margin-top:18px">${tr('friendsT')}</h2><p style="font-size:13px;opacity:.75">${tr('friendsD')}</p>${Object.keys(M).map((k,i)=>`<div class="bar" style="margin:5px 0"><b style="flex:0 0 112px">${flo(k,20)} ${M[k].f}</b><span>→ ${tr('crn')[i]} ×${cr.filter(c=>c.userData.mood==k).length}</span></div>`).join('')}`}
function renderSet(){
  const y=($('p-set').querySelector('.sbody')||{}).scrollTop||0;
  const sw=(k,on)=>`<button class="sw" role="switch" data-k="${k}" aria-checked="${on}" aria-label="${tr(k+'T')}"></button>`;
  const row=(ic,k,on)=>`<div class="si"><span class="sic ms">${ic}</span><span class="sx"><b>${tr(k+'T')}</b><small>${tr(k+'D')}</small></span>${sw(k,on)}</div>`;
  const vol=(k,on)=>{const v=k=='sfx'?(S.vs==null?70:S.vs):(S.va==null?35:S.va);return`<div class="si vol"><span class="ms vi">volume_down</span><input type="range" class="vr" min="0" max="100" step="1" value="${v}" data-v="${k}" ${on?'':'disabled'} aria-label="${tr(k+'T')}"><span class="ms vi">volume_up</span><output class="vo">${v}</output></div>`};
  const seg=(id,at,list,cur)=>`<div class="tags" id="${id}">${list.map(([c,n])=>`<button class="tag" ${at}="${c}" aria-pressed="${cur==c}">${n}</button>`).join('')}</div>`;
  $('p-set').innerHTML=`<h2>${tr('setT')}</h2><div class="sbody">
<div class="sg">${tr('lang')}</div><div class="sc"><div class="si col">${seg('lg','data-l',I18N.list().map(l=>[l.code,l.label]),S.lang)}</div></div>
<div class="sg">${tr('secLook')}</div><div class="sc"><div class="si col"><span class="sx"><b>${tr('tmT')}</b><small>${tr('tmD')}</small></span>${seg('tm','data-m',[['auto',tr('tmA')],['day',tr('tmDay')],['night',tr('tmN')]],S.tm||'auto')}</div>${row('partly_cloudy_day','wx',!S.wxo)}${row('motion_photos_off','rm',!!S.rm)}</div>
${ok?`<div class="sg">${tr('secGfx')}</div><div class="sc"><div class="si col"><span class="sx"><b>${tr('gqT')}</b><small>${tr('gqD')}</small></span>${seg('gq','data-g',[['low',tr('gqL')],['mid',tr('gqM')],['high',tr('gqH')]],gqNow())}<span class="gqd"><span class="gqt">${tr('gq_'+gqNow())}</span>${(gqNow()==='high')!==window.GQaa0?`<span class="gqn">${tr('gqN')}</span>`:''}</span></div></div>`:''}
<div class="sg">${tr('secSnd')}</div><div class="sc">${row('touch_app','sfx',S.snd!==false)}${vol('sfx',S.snd!==false)}${row('music_note','amb',S.amb!==false)}${vol('amb',S.amb!==false)}<div class="si"><span class="sic ms">bedtime</span><span class="sx"><b>${tr('slT')}</b><small>${tr('slD')}</small></span><button class="btn w" id="slb" data-sfx="off">${tr('slB')}</button></div></div>
<div class="sg">${tr('secAcc')}</div><div class="sc" id="acc"></div>
<div class="sg">${tr('secData')}</div><div class="sc"><div class="si"><span class="sic ms" style="background:#fbe0e0;color:#b5484f">delete_sweep</span><span class="sx"><b>${tr('rsT')}</b><small>${tr('rsD')}${window.cloud&&cloud.user?' '+tr('cRs'):''}</small></span><button class="btn r" id="rs">${tr('rsB')}</button></div></div>
<p class="sn">${tr(window.cloud&&cloud.user?'cloudNote':'local')}</p></div>`;window.cloud&&cloud.paint();
  $('p-set').querySelector('.sbody').scrollTop=y;
  {const g=$('gq');if(g)g.onclick=e=>{const b=e.target.closest('[data-g]');if(b&&b.dataset.g!==gqNow()){S.gq=b.dataset.g;save();applyGQ();renderSet()}}}
  $('lg').onclick=e=>{const b=e.target.closest('[data-l]');if(b){S.lang=b.dataset.l;save();applyLang()}};
  $('p-set').querySelectorAll('.vr').forEach(r=>{const k=r.dataset.v,o=r.parentNode.querySelector('.vo'),show=()=>{r.style.setProperty('--p',r.value+'%');o.textContent=r.value};
    r.oninput=()=>{const v=+r.value;show();if(k=='sfx')S.vs=v;else S.va=v;sndVolSync();if(k=='amb'&&ambCur&&ambCur.gain)ambCur.gain(SND.vol.amb)};   // 背景音：拖曳時即時跟著變大小聲
    r.onchange=()=>{save();if(k=='sfx')sfx('click')};show()});   // 音效：放開時播一聲讓你聽聽看
  $('slb').onclick=sleepOn;
  $('tm').onclick=e=>{const b=e.target.closest('[data-m]');if(b){S.tm=b.dataset.m;save();if(window.applyTime)applyTime();renderSet()}};
  $('p-set').querySelectorAll('.sw').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k;
    if(k=='wx'){S.wxo=!S.wxo;save();setWeather(curWx())}
    else if(k=='rm'){S.rm=!S.rm;document.body.classList.toggle('rm',!!S.rm)}
    else if(k=='sfx')S.snd=S.snd===false;
    else if(k=='amb')S.amb=S.amb===false;
    save();ambApply();
    b.setAttribute('aria-checked',String({wx:!S.wxo,rm:!!S.rm,sfx:S.snd!==false,amb:S.amb!==false}[k]));
    $('p-set').querySelectorAll('.vr').forEach(r=>r.disabled=r.dataset.v=='sfx'?S.snd===false:S.amb===false);
  });
  $('rs').onclick=async()=>{if(await ask(tr('rs1'),tr('rs1y'))&&await ask(tr('rs2'),tr('rs2y'))){sfx('delete');for(const d in flowers){scene.remove(flowers[d]);freeObj(flowers[d])};for(const d in flowers)delete flowers[d];S.e={};wClear();syncCr();S.wx=null;setWeather(null);save();show('garden');toast(tr('resetDone'))}}}
