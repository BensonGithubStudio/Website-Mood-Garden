/* ============================================================================
 * js/audio.js — 音效與環境音系統
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・管理全站的聲音：點擊／種花／澆水等音效（sfx）、天氣與時段的環境音
 *     （ambient）、睡眠模式的長時間背景聲（slStart／slStop）。
 *   ・進站時預先載入音檔（sndPreload，並回報進度給載入畫面）；檔案不存在或無
 *     法解碼時不播放也不報錯，只在 console 印 [audio] 警告。
 *   ・也負責音量（SND.vol）、睡眠模式狀態與回呼（SLP）、瀏覽器 Media Session
 *     （鎖定畫面控制）。
 *
 * 需要先載入：log.js
 * 提供給其他檔案：SND、SNDS、SB、RAW、WB、SLP、AC、sndUnlocked、ambKey、
 *   ambCur、ambTok、sfxOn、ambOn、sndVolSync、acx、sndPreload、sfx、sndFade、
 *   wbGet、wbStart、elStart、ambApply、ambient、slA、slKey、slUrl、slStart、
 *   slStop
 * 載入順序：第 2 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 音效系統 =====
   進站時先預載全部音檔（見載入畫面）。檔案不存在或無法解碼時不播放、不報錯，
   只在主控台印出 [audio] 警告，方便找出是哪個檔案有問題。 */
const SND={
  vol:{sfx:.7,amb:.35},
  sfx:{
    click:'audio/sfx/click.wav',animal:'audio/sfx/animal.wav',flower:'audio/sfx/flower.wav',island:'audio/sfx/island.wav',sendoff:'audio/sfx/sendoff.wav',
    plant:'audio/sfx/plant.wav',water:'audio/sfx/water.wav',gift_drop:'audio/sfx/gift_drop.wav',gift_open:'audio/sfx/gift_open.wav',decor_place:'audio/sfx/decor_place.wav',delete:'audio/sfx/delete.wav',bloom:'audio/sfx/bloom.wav',move:'audio/sfx/move.wav',rotate:'audio/sfx/rotate.wav',deny:'audio/sfx/deny.wav',
    animal_bee:'audio/sfx/animal_bee.wav',animal_bird:'audio/sfx/animal_bird.wav',animal_ladybug:'audio/sfx/animal_ladybug.wav',
    animal_butterfly:'audio/sfx/animal_butterfly.wav',animal_snail:'audio/sfx/animal_snail.wav',animal_frog:'audio/sfx/animal_frog.wav',leaf_float:'audio/sfx/leaf_float.wav'
  },
  weather:{
    happy:'audio/weather/fresh-breeze.wav',excited:'audio/weather/rainbow.wav',calm:'audio/weather/breezy.wav',
    loved:'audio/weather/petal-rain.wav',sad:'audio/weather/light-rain.wav',anxious:'audio/weather/clouds-wind.wav'
  }
};
const SNDS={},SB={},RAW={},WB={};
const SLP={on:false,cbs:[]};   /* 睡眠模式旗標；cbs＝喚醒時要重新啟動的動畫迴圈 */
let AC=null,sndUnlocked=false,ambKey=null,ambCur=null,ambTok=0;
const sfxOn=()=>{try{return S.snd!==false}catch(e){return true}};
const ambOn=()=>{try{return S.amb!==false}catch(e){return true}};
function sndVolSync(){try{SND.vol.sfx=(S.vs==null?70:S.vs)/100;SND.vol.amb=(S.va==null?35:S.va)/100}catch(e){logErr(e)}}   /* 把設定裡的音量滑桿值（0–100）同步到播放用的音量 */
function acx(){
  try{
    if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}
    if(AC&&AC.state==='suspended'&&sndUnlocked)AC.resume();
    return AC;
  }catch(e){return null}
}
/* 預載：音效解碼成 AudioBuffer，背景音先存原始資料（用到時才解碼，省記憶體） */
function sndPreload(onTick){
  const items=[];
  for(const k in SND.sfx)items.push(['s',k,SND.sfx[k]]);
  for(const k in SND.weather)items.push(['w',k,SND.weather[k]]);
  let done=0;
  return Promise.all(items.map(([t,k,src])=>{
    const el=()=>{try{const a=new Audio(),r={a,bad:false};a.preload='auto';a.loop=t==='w';a.addEventListener('error',()=>{r.bad=true});a.src=src;SNDS[t+':'+k]=r}catch(e){logErr(e)}};
    return fetch(src)
      .then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()})
      .then(buf=>{
        if(t==='w'){RAW[k]=buf;return}
        const c=acx();if(!c)throw 0;
        return new Promise((ok,no)=>c.decodeAudioData(buf,x=>{SB[k]=x;ok()},no));
      })
      .catch(()=>{console.warn('[audio] 無法載入或解碼：'+src);el()})
      .then(()=>{done++;onTick&&onTick(done,items.length)});
  }));
}
function sfx(name,fallback){
  try{
    if(!sfxOn()||SLP.on)return;sndVolSync();
    const k=SB[name]?name:(fallback&&SB[fallback]?fallback:null);
    if(k&&acx()){
      const s=AC.createBufferSource(),g=AC.createGain();
      s.buffer=SB[k];g.gain.value=SND.vol.sfx;s.connect(g);g.connect(AC.destination);s.start();return;
    }
    let r=SNDS['s:'+name];if(!r||r.bad)r=fallback&&SNDS['s:'+fallback];if(!r||r.bad)return;
    const n=r.a.cloneNode();n.volume=SND.vol.sfx;const p=n.play();if(p&&p.catch)p.catch(()=>{});
  }catch(e){logErr(e)}
}
function sndFade(a,to,done){
  clearInterval(a._f);
  a._f=setInterval(()=>{
    const d=to-a.volume;
    if(Math.abs(d)<.02){a.volume=Math.max(0,Math.min(1,to));clearInterval(a._f);done&&done();return}
    a.volume=Math.max(0,Math.min(1,a.volume+Math.sign(d)*.02));
  },60);
}
function wbGet(k){
  if(!WB[k]){
    for(const o in WB)if(o!==k)delete WB[o];
    WB[k]=(RAW[k]?Promise.resolve(RAW[k].slice(0)):fetch(SND.weather[k]).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}))
      .then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no)))
      .catch(()=>null);
  }
  return WB[k];
}
function wbStart(k,buf){
  const g=AC.createGain();g.gain.value=0;g.connect(AC.destination);
  const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.connect(g);s.start();
  g.gain.setTargetAtTime(SND.vol.amb,AC.currentTime,.4);
  return{key:k,gain(v){try{g.gain.setTargetAtTime(v,AC.currentTime,.05)}catch(e){logErr(e)}},stop(now){
    try{if(now){s.stop()}else{g.gain.setTargetAtTime(0,AC.currentTime,.4);s.stop(AC.currentTime+2.5)}}catch(e){logErr(e)}
  }};
}
function elStart(k){
  const r=SNDS['w:'+k];if(!r||r.bad)return null;
  if(r.a.paused)r.a.volume=0;
  const p=r.a.play();if(p&&p.catch)p.catch(()=>{});
  sndFade(r.a,SND.vol.amb);
  const h={key:k,gain(v){clearInterval(r.a._f);r.a.volume=Math.max(0,Math.min(1,v))},stop(now){
    if(now)r.a.pause();
    else sndFade(r.a,0,()=>{if(ambCur!==h)r.a.pause()});
  }};
  return h;
}
function ambApply(){
  try{
    sndVolSync();
    if(SLP.on){   /* 睡眠模式：改用 HTMLAudio＋媒體工作階段播放，螢幕關閉後才不會被瀏覽器暫停 */
      if(ambCur){ambTok++;try{ambCur.stop(true)}catch(e){logErr(e)}ambCur=null}
      try{if(AC&&AC.state==='running')AC.suspend()}catch(e){logErr(e)}
      if(sndUnlocked)slStart();return}
    const want=(ambOn()&&sndUnlocked&&!document.hidden&&ambKey)?ambKey:null;
    if(ambCur&&ambCur.key===want)return;
    const my=++ambTok,old=ambCur;ambCur=null;
    if(old)old.stop(document.hidden);
    if(!want)return;
    if(acx()){
      wbGet(want).then(buf=>{if(my!==ambTok)return;ambCur=buf?wbStart(want,buf):elStart(want)});
    }else ambCur=elStart(want);
  }catch(e){logErr(e)}
}
function ambient(k){ambKey=k||null;ambApply()}
let slA=null,slKey=null;const slUrl={};
function slStart(){
  const k=ambKey||'calm';
  if(slA&&slKey===k){slA.volume=Math.max(0,Math.min(1,SND.vol.amb));return}
  slStop(true);
  let src=slUrl[k];
  if(!src){src=RAW[k]?URL.createObjectURL(new Blob([RAW[k]],{type:'audio/wav'})):SND.weather[k];slUrl[k]=src}
  const a=new Audio();a.loop=true;a.preload='auto';a.src=src;a.volume=Math.max(0,Math.min(1,SND.vol.amb));
  slA=a;slKey=k;const p=a.play();if(p&&p.catch)p.catch(()=>{});
  try{if('mediaSession' in navigator){const m=navigator.mediaSession;m.metadata=new MediaMetadata({title:document.title,artist:'Mood Garden'});m.playbackState='playing';
    m.setActionHandler('play',()=>{if(slA)slA.play().catch(()=>{})});m.setActionHandler('pause',()=>{if(slA)slA.pause()})}}catch(e){logErr(e)}}
function slStop(keep){
  const a=slA;slA=null;slKey=null;
  if(a){try{a.pause();a.removeAttribute('src');a.load()}catch(e){logErr(e)}}
  if(!keep)try{if('mediaSession' in navigator){const m=navigator.mediaSession;m.playbackState='none';m.metadata=null;m.setActionHandler('play',null);m.setActionHandler('pause',null)}}catch(e){logErr(e)}}
(function(){
  const ev=['pointerdown','click','touchend','keydown'];
  const un=()=>{sndUnlocked=true;ev.forEach(t=>removeEventListener(t,un,true));acx();ambApply()};
  ev.forEach(t=>addEventListener(t,un,true));
  document.addEventListener('visibilitychange',ambApply);
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('button,[role="button"],.d,.mc,.tag');
    if(!b||b.disabled||b.dataset.sfx==='off')return;
    sfx('click');
  },true);
})();
