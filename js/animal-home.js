/* ============================================================================
 * js/animal-home.js — 小動物之家（第五座小島）
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・花園右下方的小島，是所有小動物的家（鳥屋、蜂巢、洞穴）：點小島或首頁左
 *     上角的「狀態」標籤，出門前的視窗會顯示每隻動物的狀態。
 *   ・對外以 window.HOMEI 提供（refresh…）。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、camera.js、creatures.js、particles.js、ui-shell.js
 * 提供給其他檔案：HOMEI
 * 載入順序：第 31 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 小動物之家（第五座小島）=====
   第二座花園右下方的一座小島，是所有小動物的家：島上有鳥屋、蜂巢、洞穴。
   ・點小島（或首頁左上角的「狀態」小標籤）→ 出門前的視窗：
       1) 選現在的狀態（上課中／上班中／出去玩／運動中／外出辦事／回家了）；
       2) 看所在地的天氣、溫度、風速、濕度、紫外線、降雨機率，並由小動物們給你貼心提醒。
   ・選好狀態的瞬間，小動物們一起來送行（回家了則是迎接）：
       飛行的動物（蜜蜂、蝴蝶）飛到島上繞圈；走路的動物（小雞、瓢蟲、蝸牛）過不去，
       所以會（必要時過橋）走到第二座花園最靠近小島的岸邊排成一排，面向小島；
       島上的居民（鳥屋的小雞、蜂巢的蜜蜂、洞穴的蝸牛和瓢蟲）同時探出頭來；
       大家一起冒出對話框：「路上小心，期待你回家～」。結束後所有動物回到原本的遊走，邏輯完全沒動。
   ・狀態存在 S.out（{st,u}），跟花朵一樣會同步到 Google 雲端硬碟（以較新的為準）。
   ・天氣用 Open-Meteo（免金鑰）；位置只用來查天氣，只快取在這台裝置的 localStorage，不會上傳到雲端。
   ★ 想測試動畫：在主控台輸入 HOMEI.play('work')、HOMEI.play('home') 等。 */
(function() {
  'use strict';
  if (typeof ok === 'undefined' || !ok || typeof scene === 'undefined' || typeof THREE === 'undefined' || typeof HOMEP === 'undefined' || typeof makeCr === 'undefined') return;
  const T = THREE,
    clamp = (v, a, b) => Math.min(b, Math.max(a, v)),
    sm = x => {
      x = clamp(x, 0, 1);
      return x * x * (3 - 2 * x)
    };

  /* ---------- 文字（四種語言） ---------- */
  I18N.add('en', {
    hmT: 'Critter Home',
    hmSubNone: 'Tell everyone what you’re up to',
    hmSubNow: (s, t) => `${s} · since ${t}`,
    hmAskT: 'Where are you headed?',
    hmAskD: 'Pick your status. Before you go, the little animals will come to see you off.',
    hmS_class: 'In class',
    hmS_work: 'At work',
    hmS_play: 'Out having fun',
    hmS_move: 'Exercising',
    hmS_errand: 'Running errands',
    hmS_home: 'I’m home',
    hmWxT: 'Weather before you head out',
    hmLoadPos: 'Finding where you are…',
    hmLoadWx: 'Asking the sky…',
    hmNoPos: 'Couldn’t get your location. Allow location access, or try again in a moment.',
    hmNoWx: 'Couldn’t reach the weather service. Try again in a moment.',
    hmRetry: 'Try again',
    hmFeels: 'Feels like',
    hmWind: 'Wind',
    hmHum: 'Humidity',
    hmUv: 'UV',
    hmRainP: 'Chance of rain',
    hmToday: (a, b) => `Today ${b}° – ${a}°`,
    hmUpd: t => `Updated ${t}`,
    hmApprox: '(approximate)',
    hmW0: 'Light air',
    hmW1: 'Breezy',
    hmW2: 'Strong wind',
    hmW3: 'Very strong wind',
    hmU0: 'Low',
    hmU1: 'Moderate',
    hmU2: 'High',
    hmU3: 'Very high',
    hmU4: 'Extreme',
    hmC0: 'Clear',
    hmC1: 'Mostly clear',
    hmC2: 'Partly cloudy',
    hmC3: 'Overcast',
    hmC4: 'Foggy',
    hmC5: 'Drizzle',
    hmC6: 'Rain',
    hmC7: 'Snow',
    hmC8: 'Showers',
    hmC9: 'Thunderstorm',
    hmTpStorm: 'Thunderstorms may be around. Stay safe, and come home early if you can.',
    hmTpRain: 'It might rain today. Bring an umbrella so you don’t get soaked!',
    hmTpWind: 'It’s windy today. Don’t forget to bring a jacket.',
    hmTpUv: 'The sun is strong today. Sunscreen and a hat, please!',
    hmTpCold: 'It’s chilly out there. Bundle up before you go.',
    hmTpHot: 'It’s hot today. Drink plenty of water and rest in the shade.',
    hmTpHumid: 'It’s muggy and damp today. Pick something light and airy to wear.',
    hmTpNice: 'What lovely weather. Just like you right now.',
    hmTpDef: 'Have a safe trip. We’ll be waiting for you at home.',
    hmPriv: 'Your location is only used to look up the weather and stays on this device. Weather data by Open-Meteo.',
    hmL0: 'Stay safe out there. We can’t wait for you to come home~',
    hmL1: 'Do your best today!',
    hmL2: 'We’ll be home waiting for you 💛',
    hmL3: 'Remember to drink water~',
    hmL4: 'Come back soon and play with us!',
    hmX_class: 'Listen well in class, no napping~',
    hmX_work: 'Don’t overwork. Take it easy!',
    hmX_play: 'Have fun, and tell us everything later!',
    hmX_move: 'Go at your own pace and stay safe!',
    hmX_errand: 'Hope everything goes smoothly~',
    hmH0: 'Welcome home~!',
    hmH1: 'You worked hard today!',
    hmH2: 'We missed you so much!',
    hmH3: 'Take a good rest now.',
    hmH4: 'How was your day?'
  });
  I18N.add('zh', {
    hmT: '小動物之家',
    hmSubNone: '告訴大家你現在的狀態吧',
    hmSubNow: (s, t) => `${s}・${t} 起`,
    hmAskT: '你現在要去哪裡？',
    hmAskD: '選一個狀態。出門前，小動物們會一起來送你。',
    hmS_class: '上課中',
    hmS_work: '上班中',
    hmS_play: '出去玩',
    hmS_move: '運動中',
    hmS_errand: '外出辦事',
    hmS_home: '回家了',
    hmWxT: '出門前看看天氣',
    hmLoadPos: '正在找你在哪裡…',
    hmLoadWx: '正在向天空問候…',
    hmNoPos: '拿不到你的位置。請允許定位，或稍後再試一次。',
    hmNoWx: '連不上天氣服務，請稍後再試一次。',
    hmRetry: '再試一次',
    hmFeels: '體感',
    hmWind: '風速',
    hmHum: '濕度',
    hmUv: '紫外線',
    hmRainP: '降雨機率',
    hmToday: (a, b) => `今日 ${b}° – ${a}°`,
    hmUpd: t => `${t} 更新`,
    hmApprox: '（大約位置）',
    hmW0: '微風',
    hmW1: '和風',
    hmW2: '強風',
    hmW3: '狂風',
    hmU0: '低',
    hmU1: '中等',
    hmU2: '偏高',
    hmU3: '很高',
    hmU4: '極高',
    hmC0: '晴朗',
    hmC1: '大致晴朗',
    hmC2: '多雲時晴',
    hmC3: '陰天',
    hmC4: '有霧',
    hmC5: '毛毛雨',
    hmC6: '下雨',
    hmC7: '下雪',
    hmC8: '陣雨',
    hmC9: '雷雨',
    hmTpStorm: '可能有雷雨，注意安全，能早點回來就早點回來。',
    hmTpRain: '今天可能會下雨，記得帶把傘，別被淋成落湯雞了！',
    hmTpWind: '今天風大，出門別忘了帶件衣服。',
    hmTpUv: '今天太陽很大，記得擦防曬、戴頂帽子喔！',
    hmTpCold: '今天有點冷，多穿一點再出門。',
    hmTpHot: '今天很熱，記得多喝水，累了就找個陰涼的地方休息。',
    hmTpHumid: '今天又悶又濕，穿件輕薄透氣的衣服吧。',
    hmTpNice: '今天天氣真好，就像現在的你一樣。',
    hmTpDef: '出門平安，我們在家等你。',
    hmPriv: '定位只用來查天氣，而且只留在這台裝置上。天氣資料來自 Open-Meteo。',
    hmL0: '路上小心，期待你回家～',
    hmL1: '今天也要加油喔！',
    hmL2: '我們在家等你 💛',
    hmL3: '記得多喝水～',
    hmL4: '早點回來陪我們玩！',
    hmX_class: '上課專心聽，不要打瞌睡喔～',
    hmX_work: '工作辛苦了，不要太勉強自己！',
    hmX_play: '玩得開心，回來講給我們聽！',
    hmX_move: '量力而為，注意安全喔！',
    hmX_errand: '事情都順順利利的～',
    hmH0: '歡迎回家～！',
    hmH1: '今天辛苦了！',
    hmH2: '我們好想你！',
    hmH3: '先好好休息一下吧。',
    hmH4: '今天過得怎麼樣呀？'
  });
  I18N.add('ja', {
    hmT: 'どうぶつのおうち',
    hmSubNone: '今の状態をみんなに教えてね',
    hmSubNow: (s, t) => `${s}・${t}から`,
    hmAskT: 'これからどこへ行く？',
    hmAskD: '状態を選んでね。出かける前に、どうぶつたちがお見送りに来るよ。',
    hmS_class: '授業中',
    hmS_work: '仕事中',
    hmS_play: 'おでかけ中',
    hmS_move: '運動中',
    hmS_errand: '用事で外出',
    hmS_home: 'ただいま',
    hmWxT: '出かける前のお天気',
    hmLoadPos: '居場所をさがしています…',
    hmLoadWx: '空にたずねています…',
    hmNoPos: '位置情報を取得できませんでした。位置情報を許可するか、あとでもう一度お試しください。',
    hmNoWx: '天気サービスにつながりません。あとでもう一度お試しください。',
    hmRetry: 'もう一度',
    hmFeels: '体感',
    hmWind: '風速',
    hmHum: '湿度',
    hmUv: '紫外線',
    hmRainP: '降水確率',
    hmToday: (a, b) => `今日 ${b}°〜${a}°`,
    hmUpd: t => `${t} 更新`,
    hmApprox: '（おおよその位置）',
    hmW0: 'そよ風',
    hmW1: 'やや風あり',
    hmW2: '強い風',
    hmW3: 'とても強い風',
    hmU0: '弱い',
    hmU1: '中程度',
    hmU2: '強い',
    hmU3: '非常に強い',
    hmU4: '極端に強い',
    hmC0: '快晴',
    hmC1: '晴れ',
    hmC2: 'くもり時々晴れ',
    hmC3: 'くもり',
    hmC4: '霧',
    hmC5: '霧雨',
    hmC6: '雨',
    hmC7: '雪',
    hmC8: 'にわか雨',
    hmC9: '雷雨',
    hmTpStorm: '雷雨になりそう。無理せず、早めに帰ってきてね。',
    hmTpRain: '今日は雨が降るかも。傘を持っていってね、ずぶ濡れにならないように！',
    hmTpWind: '今日は風が強いよ。上着を忘れずにね。',
    hmTpUv: '日差しが強いよ。日焼け止めと帽子を忘れずに！',
    hmTpCold: '肌寒いよ。あったかくして出かけてね。',
    hmTpHot: '今日は暑いよ。水分をこまめにとって、日陰で休んでね。',
    hmTpHumid: 'じめじめした日だよ。風通しのよい服がおすすめ。',
    hmTpNice: 'いいお天気だね、今のあなたみたい。',
    hmTpDef: '気をつけて行ってらっしゃい。おうちで待ってるよ。',
    hmPriv: '位置情報は天気の取得だけに使い、この端末にだけ保存されます。天気データ：Open-Meteo。',
    hmL0: '行ってらっしゃい、帰りを待ってるよ〜',
    hmL1: '今日もがんばってね！',
    hmL2: 'おうちで待ってるよ 💛',
    hmL3: '水分補給も忘れずにね〜',
    hmL4: '早く帰ってきて一緒に遊ぼうね！',
    hmX_class: '授業、しっかり聞いてね。居眠りはだめだよ〜',
    hmX_work: '無理しすぎないでね！',
    hmX_play: '楽しんできてね。あとで聞かせて！',
    hmX_move: '無理せず、気をつけてね！',
    hmX_errand: '用事がうまくいきますように〜',
    hmH0: 'おかえり〜！',
    hmH1: '今日もおつかれさま！',
    hmH2: '会いたかったよ！',
    hmH3: 'まずはゆっくり休んでね。',
    hmH4: '今日はどんな一日だった？'
  });
  I18N.add('ko', {
    hmT: '동물들의 집',
    hmSubNone: '지금 상태를 친구들에게 알려 주세요',
    hmSubNow: (s, t) => `${s} · ${t}부터`,
    hmAskT: '지금 어디로 가나요?',
    hmAskD: '상태를 골라 주세요. 나가기 전에 동물 친구들이 배웅하러 와요.',
    hmS_class: '수업 중',
    hmS_work: '근무 중',
    hmS_play: '놀러 나감',
    hmS_move: '운동 중',
    hmS_errand: '볼일 보는 중',
    hmS_home: '집에 왔어요',
    hmWxT: '나가기 전 날씨',
    hmLoadPos: '위치를 찾는 중…',
    hmLoadWx: '하늘에 물어보는 중…',
    hmNoPos: '위치를 가져오지 못했어요. 위치 접근을 허용하거나 잠시 후 다시 시도해 주세요.',
    hmNoWx: '날씨 서비스에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.',
    hmRetry: '다시 시도',
    hmFeels: '체감',
    hmWind: '풍속',
    hmHum: '습도',
    hmUv: '자외선',
    hmRainP: '강수 확률',
    hmToday: (a, b) => `오늘 ${b}° ~ ${a}°`,
    hmUpd: t => `${t} 업데이트`,
    hmApprox: '(대략적인 위치)',
    hmW0: '산들바람',
    hmW1: '선선한 바람',
    hmW2: '강한 바람',
    hmW3: '매우 강한 바람',
    hmU0: '낮음',
    hmU1: '보통',
    hmU2: '높음',
    hmU3: '매우 높음',
    hmU4: '위험',
    hmC0: '맑음',
    hmC1: '대체로 맑음',
    hmC2: '구름 조금',
    hmC3: '흐림',
    hmC4: '안개',
    hmC5: '이슬비',
    hmC6: '비',
    hmC7: '눈',
    hmC8: '소나기',
    hmC9: '천둥번개',
    hmTpStorm: '천둥번개가 칠 수 있어요. 안전하게, 가능하면 일찍 돌아오세요.',
    hmTpRain: '오늘 비가 올 수도 있어요. 우산을 챙겨서 흠뻑 젖지 않게 하세요!',
    hmTpWind: '오늘은 바람이 세요. 겉옷 챙기는 것 잊지 마세요.',
    hmTpUv: '햇볕이 강해요. 선크림과 모자를 챙기세요!',
    hmTpCold: '쌀쌀해요. 따뜻하게 입고 나가세요.',
    hmTpHot: '오늘은 더워요. 물을 자주 마시고 그늘에서 쉬세요.',
    hmTpHumid: '눅눅하고 습한 날이에요. 통풍 잘되는 옷이 좋아요.',
    hmTpNice: '날씨가 정말 좋아요, 지금의 당신처럼요.',
    hmTpDef: '조심해서 다녀오세요. 집에서 기다릴게요.',
    hmPriv: '위치는 날씨를 조회하는 데만 쓰이고 이 기기에만 저장돼요. 날씨 데이터: Open-Meteo.',
    hmL0: '조심히 다녀와요, 돌아오길 기다릴게요~',
    hmL1: '오늘도 힘내요!',
    hmL2: '집에서 기다릴게요 💛',
    hmL3: '물 많이 마시는 거 잊지 마요~',
    hmL4: '얼른 돌아와서 같이 놀아요!',
    hmX_class: '수업 잘 듣고, 졸지 마요~',
    hmX_work: '너무 무리하지 마요!',
    hmX_play: '재미있게 놀고, 이따 얘기해 줘요!',
    hmX_move: '무리하지 말고 안전하게!',
    hmX_errand: '일이 잘 풀리길~',
    hmH0: '어서 와요~!',
    hmH1: '오늘도 고생했어요!',
    hmH2: '보고 싶었어요!',
    hmH3: '이제 푹 쉬어요.',
    hmH4: '오늘 하루는 어땠어요?'
  });

  /* ---------- 狀態 ---------- */
  const STSK = ['class', 'work', 'play', 'move', 'errand', 'home'],
    STS = STSK.map(k => [k]);
  /* 狀態圖示：跟花朵、表情同一套畫法（淡色圓底 + 白邊 + 圓角的咖啡色線條） */
  function stIcon(k, s) {
    const I = '#5B4A4A',
      st = `stroke="${I}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`,
      bg = {
        class: '#B9D8EB',
        work: '#D4C7EA',
        play: '#F8B9CC',
        move: '#B9D9C2',
        errand: '#F5DEA0',
        home: '#F6C9B0'
      } [k],
      g = {
        class: `<path d="M10 14q5-2.5 10 1 5-3.5 10-1v14q-5-2.5-10 1-5-3.5-10-1z" fill="#fff" ${st}/><path d="M20 15v14" fill="none" ${st}/><path d="M13 19q2-.8 4 0M23 19q2-.8 4 0" fill="none" stroke="#B9D8EB" stroke-width="1.6" stroke-linecap="round"/>`,
        work: `<path d="M16 16v-2.5a2 2 0 012-2h4a2 2 0 012 2V16" fill="none" ${st}/><rect x="9.5" y="16" width="21" height="13" rx="3.2" fill="#fff" ${st}/><path d="M9.5 22h21" fill="none" ${st}/><rect x="18" y="20.2" width="4" height="3.6" rx="1.2" fill="#F5D04A" ${st}/>`,
        play: `<ellipse cx="20" cy="17" rx="7.2" ry="8.6" fill="#FFE08A" ${st}/><path d="M20 25.6l-2 2.4h4z" fill="#FFE08A" ${st}/><path d="M20 28q-3.5 2.5 0 6" fill="none" ${st}/><path d="M16 12.5q1.2-2 3.2-2.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
        move: `<rect x="8" y="16" width="4" height="8" rx="1.8" fill="#fff" ${st}/><rect x="12" y="13.5" width="3.6" height="13" rx="1.8" fill="#fff" ${st}/><path d="M15.6 20h8.8" fill="none" ${st}/><rect x="24.4" y="13.5" width="3.6" height="13" rx="1.8" fill="#fff" ${st}/><rect x="28" y="16" width="4" height="8" rx="1.8" fill="#fff" ${st}/>`,
        errand: `<path d="M16 15v-1.5a4 4 0 018 0V15" fill="none" ${st}/><path d="M11 15h18l-1.4 14.2H12.4z" fill="#fff" ${st}/><path d="M17 21.5q3 2.8 6 0" fill="none" ${st}/>`,
        home: `<path d="M20 10.5l11 9h-3V30H12V19.5H9z" fill="#fff" ${st}/><path d="M20 27.5l-3.2-3.2a1.9 1.9 0 012.7-2.7l.5.5.5-.5a1.9 1.9 0 012.7 2.7z" fill="#E4577E"/>`
      } [k];
    return SV(s, `<circle cx="20" cy="20" r="17" fill="${bg}"/><circle cx="20" cy="20" r="17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>${g}`)
  }
  const curOut = () => S.out && STSK.includes(S.out.st) ? S.out : null;
  const sameDay = ms => new Date(ms).toDateString() === new Date().toDateString();
  const sinceTxt = ms => sameDay(ms) ? new Date(ms).toLocaleTimeString(LC(), {
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date(ms).toLocaleString(LC(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  /* ---------- 位置、形狀 ---------- */
  const SX = HOMEP.x,
    SZ = HOMEP.z,
    RW = HOMEP.R,
    ISY = .1;
  const rho = a => RW * (1 + .08 * Math.sin(2 * a + 2.1) + .07 * Math.sin(3 * a + 1.2) + .05 * Math.sin(5 * a + .6));
  const hh = (x, z) => .05 * Math.sin(x * 1.1 + .4) * Math.cos(z * 1.2 + .7);
  const isl = new T.Group();
  isl.position.set(SX, ISY, SZ);
  scene.add(isl);
  const K = window.SKIN || null,
    BOXG = new T.BoxGeometry(1, 1, 1),
    ICO = new T.IcosahedronGeometry(1, 0);
  const rock = m => {
    if (K) {
      m.geometry = K.RKG;
      m.material = K.SM(m.material, 'rk', K.V(K.TS, 's', 2, 2), {
        roughness: .92,
        bumpScale: 3
      })
    }
    return m
  };
  const bark = m => {
    if (K) {
      m.geometry = K.TRUNK;
      m.material = K.SM(m.material, 'bk', K.V(K.TB, 'b', 1, 1), {
        roughness: .95,
        bumpScale: 1.5
      })
    }
    return m
  };
  const halo = (c, s, o) => {
    const sp = new T.Sprite(new T.SpriteMaterial({
      map: window.GLOW,
      color: c,
      blending: T.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: o
    }));
    sp.scale.set(s, s, 1);
    return sp
  };
  const seeded = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;

  /* 草地：暖一點的黃綠色，邊緣一圈泥土 */
  {
    const KR = 22,
      SG = 72,
      c1 = new T.Color('#9CCB86'),
      c2 = new T.Color('#C6DE98'),
      cc = new T.Color(),
      pos = [0, hh(0, 0), 0],
      col = [],
      idx = [];
    const paint = (x, z, dirt) => {
      const n = (Math.sin(x * .9) * Math.cos(z * 1.1) + Math.sin(x * .3 + z * .5)) * .25 + .5;
      cc.copy(c1).lerp(c2, clamp(n, 0, 1));
      if (dirt) cc.set('#C9A97E');
      col.push(cc.r, cc.g, cc.b)
    };
    paint(SX, SZ, false);
    for (let k = 1; k <= KR; k++) {
      const f = k / KR;
      for (let i = 0; i < SG; i++) {
        const a = i / SG * 6.2832,
          r = rho(a) * f,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        pos.push(x, k === KR ? -.2 : hh(x, z) - .1 * f * f, z);
        paint(SX + x, SZ + z, f > .97)
      }
    }
    for (let i = 0; i < SG; i++) idx.push(0, 1 + (i + 1) % SG, 1 + i);
    for (let k = 0; k < KR - 1; k++)
      for (let i = 0; i < SG; i++) {
        const a = 1 + k * SG + i,
          b = 1 + k * SG + (i + 1) % SG,
          c = a + SG,
          d = b + SG;
        idx.push(a, b, c, b, d, c)
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const gm = new T.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      vertexColors: true
    });
    if (K) K.skinGround(gm);
    const gr = new T.Mesh(g, gm);
    gr.receiveShadow = true;
    isl.add(gr)
  }
  /* 側壁與底部 */
  {
    const SG = 72,
      sp = [],
      si = [],
      uv = [];
    for (let i = 0; i < SG; i++) {
      const a = i / SG * 6.2832,
        r = rho(a),
        x = Math.cos(a),
        z = Math.sin(a);
      sp.push(x * r * 1.012, -.2, z * r * 1.012, x * r * .85, -1.6, z * r * .85);
      uv.push(i / SG * 3, 1, i / SG * 3, 0)
    }
    for (let i = 0; i < SG; i++) {
      const j = (i + 1) % SG;
      si.push(i * 2, j * 2, i * 2 + 1, j * 2, j * 2 + 1, i * 2 + 1)
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(si);
    g.computeVertexNormals();
    let m = new T.MeshStandardMaterial({
      color: '#E3C9A8',
      roughness: .88,
      side: 2,
      emissive: new T.Color('#E3C9A8').multiplyScalar(.13)
    });
    if (K) m = K.SM(m, 'so', K.V(K.TSo, 'o', 1, 1), {
      roughness: .95,
      bumpScale: 1.5
    });
    const sk = new T.Mesh(g, m);
    sk.castShadow = true;
    isl.add(sk);
    const cp = [0, -1.75, 0],
      ci = [];
    for (let i = 0; i < SG; i++) cp.push(sp[i * 6 + 3], sp[i * 6 + 4], sp[i * 6 + 5]);
    for (let i = 0; i < SG; i++) ci.push(0, 1 + i, 1 + (i + 1) % SG);
    const cg = new T.BufferGeometry();
    cg.setAttribute('position', new T.Float32BufferAttribute(cp, 3));
    cg.setIndex(ci);
    cg.computeVertexNormals();
    isl.add(new T.Mesh(cg, new T.MeshStandardMaterial({
      color: '#D9BD98',
      roughness: .9,
      side: 2
    })))
  }
  /* 柵欄：跟其他小島同款的木柵欄，柱頭是暖黃色的小球 */
  {
    const M2 = 360,
      poly = [];
    for (let i = 0; i <= M2; i++) {
      const a = i / M2 * 6.2832,
        r = rho(a) * .93;
      poly.push([Math.cos(a) * r, Math.sin(a) * r])
    }
    const cum = [0];
    for (let i = 1; i <= M2; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const tot = cum[M2],
      n = Math.round(tot / .654),
      step = tot / n,
      P = [];
    let kq = 1;
    for (let j = 0; j < n; j++) {
      const dd = j * step;
      while (kq < M2 && cum[kq] < dd) kq++;
      const t = (dd - cum[kq - 1]) / Math.max(1e-6, cum[kq] - cum[kq - 1]);
      P.push([poly[kq - 1][0] + (poly[kq][0] - poly[kq - 1][0]) * t, poly[kq - 1][1] + (poly[kq][1] - poly[kq - 1][1]) * t])
    }
    const bx = new T.BoxGeometry(1, 1, 1),
      KW = !!(K && K.TWv && K.TWh && K.boxUV),
      txP = KW ? K.V(K.TWv, 'wv', 1, 1) : null,
      txR = KW ? K.V(K.TWh, 'wh', 1, 1) : null,
      wm = tx => new T.MeshStandardMaterial(Object.assign({
        roughness: .85,
        emissive: new T.Color('#EBD3AC'),
        emissiveIntensity: .12
      }, tx ? {
        roughness: .78,
        map: tx,
        bumpMap: tx,
        bumpScale: 1.2
      } : {})),
      pg = KW ? K.boxUV(bx, [.13, .74, .13], 2.4) : bx,
      rg = KW ? K.boxUV(bx, [.67, .07, .05], 2.4) : bx,
      capM = new T.MeshStandardMaterial({
        roughness: .4,
        emissive: new T.Color('#FFE0A0'),
        emissiveIntensity: .35
      }),
      posts = new T.InstancedMesh(pg, wm(txP), n),
      caps = new T.InstancedMesh(SPH, capM, n),
      rails = new T.InstancedMesh(rg, wm(txR), n * 2),
      o = new T.Object3D(),
      c = new T.Color(),
      cap = ['#FFE0A0', '#F8D3B5', '#FFF0B8'];
    let ri = 0;
    for (let i = 0; i < n; i++) {
      const x = P[i][0],
        z = P[i][1],
        y = hh(x, z) - .05;
      o.position.set(x, y + .37, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(.13, .74, .13);
      o.updateMatrix();
      posts.setMatrixAt(i, o.matrix);
      posts.setColorAt(i, c.set('#EBD3AC').offsetHSL(0, 0, (Math.random() - .5) * .05));
      o.position.set(x, y + .77, z);
      o.scale.setScalar(.085);
      o.updateMatrix();
      caps.setMatrixAt(i, o.matrix);
      caps.setColorAt(i, c.set(cap[i % 3]));
      const j = (i + 1) % n,
        x2 = P[j][0],
        z2 = P[j][1],
        xm = (x + x2) / 2,
        zm = (z + z2) / 2,
        ym = hh(xm, zm) - .05,
        len = Math.hypot(x2 - x, z2 - z) * 1.03,
        th = -Math.atan2(z2 - z, x2 - x);
      [.28, .52].forEach(h => {
        o.position.set(xm, ym + h, zm);
        o.rotation.set(0, th, 0);
        o.scale.set(len, .07, .05);
        o.updateMatrix();
        rails.setMatrixAt(ri, o.matrix);
        rails.setColorAt(ri, c.set('#E2C79B').offsetHSL(0, 0, (Math.random() - .5) * .04));
        ri++
      })
    }
    rails.count = ri;
    [posts, caps, rails].forEach(q => {
      q.castShadow = true;
      q.receiveShadow = true;
      isl.add(q)
    })
  }

  /* ---------- 島上的東西（位置是島上座標；+z 朝向畫面下方） ---------- */
  const BHP = [-1.3, -.7],
    HVP = [1.35, -.85],
    CVP = [0, -1.6],
    SGP = [-.15, 1.6];
  /* 鳥屋：細細的木柱，頂上一間小木屋，紅屋頂、圓圓的門洞，門前有一根小橫桿 */
  const bh = new T.Group();
  bh.position.set(BHP[0], hh(...BHP), BHP[1]);
  isl.add(bh);
  {
    bh.add(bark(mk(CYL, '#A98563', [0, .95, 0], [.075, 1.9, .075])));
    bh.add(mk(BOXG, '#F3DDB8', [0, 2.05, 0], [.64, .52, .56]));
    const roof = mk(new T.ConeGeometry(1, 1, 4), '#D9786A', [0, 2.5, 0], [.56, .4, .5]);
    roof.rotation.y = Math.PI / 4;
    bh.add(roof);
    const hole = new T.Mesh(new T.CircleGeometry(.12, 18), new T.MeshBasicMaterial({
      color: '#3A2A22'
    }));
    hole.position.set(0, 2.07, .282);
    bh.add(hole);
    bh.add(mk(CYL, '#8A6A4A', [0, 1.86, .36], [.025, .2, .025], [Math.PI / 2, 0, 0]));
    bh.add(mk(SPH, '#F29BB5', [.2, 2.22, .285], [.045, .045, .02]), mk(SPH, '#F5D04A', [-.2, 2.2, .285], [.04, .04, .02]))
  }
  /* 蜂巢：樹墩上一個一圈一圈的稻草蜂巢，門口有個小洞 */
  const hv = new T.Group();
  hv.position.set(HVP[0], hh(...HVP), HVP[1]);
  isl.add(hv);
  {
    hv.add(bark(mk(CYL, '#A98563', [0, .2, 0], [.38, .4, .38])));
    const pr = [
        [0, 0],
        [.43, 0],
        [.45, .1],
        [.37, .13],
        [.4, .24],
        [.32, .27],
        [.35, .38],
        [.27, .41],
        [.29, .52],
        [.2, .55],
        [.21, .62],
        [.1, .67],
        [0, .69]
      ].map(p => new T.Vector2(p[0], p[1])),
      sk = new T.Mesh(new T.LatheGeometry(pr, 20), new T.MeshStandardMaterial({
        color: '#E9B949',
        roughness: .88,
        side: 2,
        emissive: new T.Color('#E9B949').multiplyScalar(.13)
      }));
    sk.position.y = .4;
    sk.scale.setScalar(1.15);
    sk.castShadow = true;
    hv.add(sk);
    hv.add(mk(SPH, '#4B3520', [0, .62, .42], [.11, .07, .05]), mk(BOXG, '#A98563', [0, .42, .5], [.3, .03, .16]), mk(SPH, '#F5D04A', [.07, .7, .2], [.03, .03, .03]))
  }
  /* 洞穴：兩根石柱撐著橫石，後面是圓圓的大岩石，中間是黑黑的洞口；晚上洞裡會透出暖暖的光 */
  const cv = new T.Group();
  cv.position.set(CVP[0], hh(...CVP), CVP[1]);
  isl.add(cv);
  const cvGlow = halo('#FFC980', 1.5, .1);
  {
    cv.add(rock(mk(ICO, '#C4BBAE', [0, .55, -.4], [1.35, .95, .7], [.1, .3, 0])),
      rock(mk(ICO, '#CFC6B8', [-.8, .4, .1], [.38, .7, .44], [.2, .5, .1])), rock(mk(ICO, '#CFC6B8', [.8, .36, .08], [.36, .66, .42], [.1, -.4, .2])),
      rock(mk(ICO, '#BDB4A6', [0, 1.0, .02], [.92, .3, .5], [.05, .1, 0])),
      rock(mk(ICO, '#D6CEC2', [-1.15, .12, .62], [.22, .15, .2], [.3, .2, .1])), rock(mk(ICO, '#D6CEC2', [1.12, .1, .66], [.2, .14, .18], [.1, .5, .2])));
    const dk = mk(BOXG, '#2B2019', [0, .4, -.2], [.9, .8, .5]);
    dk.castShadow = false;
    cv.add(dk);
    cvGlow.position.set(0, .48, .2);
    cv.add(cvGlow);
    [
      [-.5, 1.12, .3],
      [.45, 1.08, .28]
    ].forEach(p => cv.add(mk(SPH, '#8CC27D', p, [.18, .07, .14])))
  } // 洞頂上長了幾叢小草
  /* 歡迎牌：木牌上畫著一間有愛心的小房子，兩面都看得到 */
  const sgn = new T.Group();
  sgn.position.set(SGP[0], hh(...SGP), SGP[1]);
  isl.add(sgn);
  {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 140;
    const x = c.getContext('2d');
    if (x) {
      x.fillStyle = '#E9CFA4';
      x.fillRect(0, 0, 256, 140);
      x.strokeStyle = '#B58B66';
      x.lineWidth = 10;
      x.strokeRect(5, 5, 246, 130);
      x.fillStyle = '#FFF6E2';
      x.beginPath();
      x.moveTo(128, 24);
      x.lineTo(190, 70);
      x.lineTo(172, 70);
      x.lineTo(172, 112);
      x.lineTo(84, 112);
      x.lineTo(84, 70);
      x.lineTo(66, 70);
      x.closePath();
      x.fill();
      x.fillStyle = '#D9786A';
      x.beginPath();
      x.moveTo(128, 18);
      x.lineTo(202, 74);
      x.lineTo(186, 78);
      x.lineTo(128, 34);
      x.lineTo(70, 78);
      x.lineTo(54, 74);
      x.closePath();
      x.fill();
      x.fillStyle = '#F29BB5';
      x.beginPath();
      x.moveTo(128, 106);
      x.bezierCurveTo(100, 86, 108, 64, 128, 76);
      x.bezierCurveTo(148, 64, 156, 86, 128, 106);
      x.fill()
    }
    const tx = new T.CanvasTexture(c);
    if (T.sRGBEncoding) tx.encoding = T.sRGBEncoding;
    sgn.add(mk(CYL, '#A98563', [0, .55, 0], [.045, 1.1, .045]));
    const bd = new T.Mesh(BOXG, new T.MeshStandardMaterial({
      map: tx,
      roughness: .8
    }));
    bd.position.set(0, 1.1, 0);
    bd.scale.set(.98, .54, .06);
    bd.rotation.z = .04;
    bd.castShadow = true;
    sgn.add(bd)
  }
  /* 小石頭步道：從歡迎牌通往洞穴 */
  for (let i = 0; i < 5; i++) {
    const x = -.1 + .22 * Math.sin(i * 1.7 + .5),
      z = 1.05 - i * .52;
    isl.add(mk(CYL, '#D5CEC2', [x, hh(x, z) + .02, z], [.2 + .03 * (i % 2), .045, .18]))
  }
  /* 地上的小花（一把粉黃白的小點點） */
  {
    const r = seeded(77),
      OB = [
        [BHP[0], BHP[1], .6],
        [HVP[0], HVP[1], .7],
        [CVP[0], CVP[1], 1.6],
        [SGP[0], SGP[1], .6],
        [-.1, .3, 1.15]
      ],
      n = 44,
      tf = new T.InstancedMesh(SPH, new T.MeshStandardMaterial({
        roughness: .8,
        emissive: new T.Color('#ffffff'),
        emissiveIntensity: .12
      }), n),
      o = new T.Object3D(),
      pl = ['#FFF3B0', '#FFFFFF', '#F8C9D8', '#FDE08A'];
    let k = 0;
    for (let t = 0; t < 400 && k < n; t++) {
      const a = r() * 6.283,
        d = Math.sqrt(r()) * .86 * rho(a),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d;
      if (OB.some(q => Math.hypot(x - q[0], z - q[1]) < q[2])) continue;
      o.position.set(x, hh(x, z) + .06, z);
      o.scale.setScalar(.055 + r() * .035);
      o.updateMatrix();
      tf.setMatrixAt(k, o.matrix);
      tf.setColorAt(k, new T.Color(pl[k % 4]));
      k++
    }
    tf.count = k;
    isl.add(tf)
  }

  /* ---------- 島上的居民：平常躲在家裡（蜂巢口有兩隻小蜜蜂在忙），送行時全部探出頭來 ---------- */
  const chick = makeCr('excited'),
    snail = makeCr('sad'),
    lady = makeCr('calm'),
    BEES = [0, 1, 2, 3, 4].map(() => makeCr('happy'));
  [chick, snail, lady, ...BEES].forEach(g => {
    g.userData.hb.visible = false;
    g.visible = false
  });
  bh.add(chick);
  isl.add(snail, lady, ...BEES);
  BEES.forEach((b, i) => {
    b.scale.setScalar(.8);
    b.userData.ph = i * 1.3 + .4
  });
  let ev = 0; // 居民露臉程度（0＝躲著，1＝全出來）
  const wing = (g, s) => {
    const w = g.userData.w;
    if (w) {
      w[0].rotation.z = s;
      w[1].rotation.z = -s
    }
  };

  function residents(t, dt, rm) {
    const e = sm(ev);
    /* 小雞：從門洞跳到橫桿上 */
    chick.visible = e > .03;
    if (chick.visible) {
      chick.position.set(0, 2.0 - .1 * e + (rm ? 0 : Math.abs(Math.sin(t * 5)) * .035 * e), .14 + .28 * e);
      chick.scale.setScalar(Math.max(.01, e) * .95);
      wing(chick, rm ? 0 : Math.sin(t * (e < .98 ? 22 : 9)) * .5 * e)
    }
    /* 蜜蜂：平常 2 隻在蜂巢口繞，送行時 5 隻一起繞大圈 */
    BEES.forEach((b, i) => {
      const idle = i < 2,
        vis = idle || e > .08;
      b.visible = vis;
      if (!vis) return;
      const k = idle ? 1 : e,
        ph = b.userData.ph,
        sp = 1.4 + i * .18,
        a = (rm ? ph : t * sp + ph),
        r = (.5 + .3 * e + i * .04) * (idle && e < .05 ? .9 : 1),
        cy = .95 + .12 * e + (i % 3) * .18 * e;
      b.position.set(HVP[0] + Math.cos(a) * r, hh(...HVP) + cy + (rm ? 0 : Math.sin(t * 2.3 + ph) * .1), HVP[1] + Math.sin(a) * r);
      b.rotation.y = -a;
      b.scale.setScalar(.8 * Math.max(.01, k));
      wing(b, rm ? 0 : Math.sin(t * 50 + i) * .7)
    });
    /* 蝸牛與瓢蟲：從洞口慢慢探出來 */
    [
      [snail, -.24, .8],
      [lady, .26, .95]
    ].forEach(([g, dx, dz], i) => {
      g.visible = e > .04;
      if (!g.visible) return;
      const k = sm(e * 1.2 - .1 * i),
        x = CVP[0] + dx * k,
        z = CVP[1] - .25 + (dz + .25) * k;
      g.position.set(x, hh(x, z), z);
      g.scale.setScalar(Math.max(.01, k) * 1.15);
      g.rotation.y = rm ? 0 : Math.sin(t * 1.3 + i * 2) * .25
    })
  }

  /* ---------- 提示用的小圖示（飄在島上，點它或點小島都會打開）---------- */
  const hint = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    if (x) {
      const gr = x.createRadialGradient(64, 64, 6, 64, 64, 62);
      gr.addColorStop(0, 'rgba(255,255,255,.18)');
      gr.addColorStop(.6, 'rgba(255,255,255,.06)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr;
      x.fillRect(0, 0, 128, 128);
      x.fillStyle = 'rgba(255,250,236,.95)';
      x.beginPath();
      x.arc(64, 66, 43, 0, 6.283);
      x.fill();
      x.lineWidth = 4;
      x.strokeStyle = 'rgba(255,255,255,.95)';
      x.stroke();
      x.fillStyle = '#FBE7C2';
      x.strokeStyle = '#C99A5C';
      x.lineWidth = 3;
      x.lineJoin = 'round';
      x.beginPath();
      x.moveTo(46, 92);
      x.lineTo(46, 64);
      x.lineTo(82, 64);
      x.lineTo(82, 92);
      x.closePath();
      x.fill();
      x.stroke();
      x.fillStyle = '#E4806E';
      x.beginPath();
      x.moveTo(40, 66);
      x.lineTo(64, 40);
      x.lineTo(88, 66);
      x.closePath();
      x.fill();
      x.stroke();
      x.fillStyle = '#F29BB5';
      x.beginPath();
      x.moveTo(64, 88);
      x.bezierCurveTo(52, 78, 56, 68, 64, 74);
      x.bezierCurveTo(72, 68, 76, 78, 64, 88);
      x.fill()
    }
    const sp = new T.Sprite(new T.SpriteMaterial({
      map: new T.CanvasTexture(c),
      transparent: true,
      depthWrite: false
    }));
    sp.scale.set(.85, .85, 1);
    sp.position.set(0, 2.95, 0);
    isl.add(sp);
    const gl = halo('#FFF0C0', 1.1, .07);
    gl.position.copy(sp.position);
    gl.renderOrder = 1;
    sp.renderOrder = 2;
    isl.add(gl);
    return {
      sp,
      gl,
      hov: false,
      y: 2.95
    }
  })();
  const hit = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshBasicMaterial({
    visible: false
  }));
  hit.position.set(0, .8, 0);
  hit.scale.set(RW * .92, 2.1, RW * .92);
  isl.add(hit);

  /* ---------- 視窗 ---------- */
  const css = document.createElement('style');
  css.textContent = `
#hmo{z-index:21;background:rgba(80,105,70,.28);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px)}
/* 液態玻璃外框：半透明＋模糊＋高光邊緣 */
.hms{width:min(560px,100%);max-height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);max-height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);display:flex;flex-direction:column;border-radius:30px;padding:12px;background:radial-gradient(120% 80% at 10% 0%,rgba(255,255,255,.55),rgba(255,255,255,0) 55%),linear-gradient(rgba(205,228,185,.46),rgba(165,205,150,.40));-webkit-backdrop-filter:blur(24px) saturate(185%) brightness(1.05);backdrop-filter:blur(24px) saturate(185%) brightness(1.05);border:1px solid rgba(255,255,255,.62);box-shadow:0 18px 46px rgba(40,70,40,.28),0 2px 6px rgba(40,70,40,.12),inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 -1.5px 2px rgba(255,255,255,.3),inset 0 0 28px rgba(255,255,255,.16);animation:hmin .5s cubic-bezier(.2,.9,.3,1.1) both}
.hmh{flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:4px 10px 10px;color:#3C5A36;text-shadow:0 1px 0 rgba(255,255,255,.55)}
.hmh h2{font-size:22px;display:flex;align-items:center;gap:6px}.hmh span{font-size:13px;opacity:.95;text-align:right}
.hmbd{flex:1;min-height:0;overflow:hidden;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(rgba(255,255,255,.62),rgba(255,252,243,.50));border:1px solid rgba(255,255,255,.65);color:#5B4A4A;box-shadow:inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 -1px 2px rgba(255,255,255,.35),inset 0 0 20px rgba(255,255,255,.18)}
/* 上半（你現在要去哪裡）固定；下半（出門前看看天氣）內容過長時，只有天氣卡自己上下滑動 */
.hmbd>section{flex:none}.hmbd>.hmwx{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}.hmwx>h3{flex:none}
.hmbd>.hmpv{flex:none}
.hmbd h3{font:600 16px Fredoka,Nunito,sans-serif;margin-bottom:2px}.hmbd .hmd{font-size:13px;opacity:.75;line-height:1.5;margin-bottom:8px}
.hmg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hmq{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border-radius:16px;background:rgba(255,255,255,.72);border:2px solid transparent;box-shadow:0 3px 8px rgba(90,80,50,.10),inset 0 1.5px 1px rgba(255,255,255,.95);font:600 13.5px Fredoka,Nunito,sans-serif;color:#5B4A4A;cursor:pointer;transition:transform .15s,border-color .15s,background .15s}
.hmq svg{display:block}.hmt>i .ms{font-size:24px;color:#7FA8C9}.hmq:hover{transform:translateY(-2px)}.hmq:active{transform:scale(.96)}.hmq[aria-pressed=true]{border-color:#8BB77B;background:#EEF7E6}
.hmw{flex:1 1 auto;min-height:130px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;border-radius:18px;padding:14px;background:linear-gradient(rgba(214,236,250,.66),rgba(246,250,236,.58));box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.8),inset 0 2px 6px rgba(80,110,130,.10),0 3px 10px rgba(80,100,80,.10)}
.hmw .hmn{padding:18px 6px;text-align:center;font-size:14px;line-height:1.6;opacity:.85}.hmw .hmn .btn{margin-top:10px}
.hmwh{display:flex;align-items:center;gap:12px}.hmwi{font-size:44px;line-height:1}.hmwh>div{flex:1;min-width:0}.hmwh b{font:600 34px/1 Fredoka,Nunito,sans-serif}.hmwh small{display:block;font-size:13px;opacity:.78;line-height:1.5;margin-top:3px}
.hmwh button{flex:none;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 2px 6px #0002;display:grid;place-items:center;cursor:pointer}.hmwh button .ms{font-size:20px}
.hmwh button.sp .ms{animation:hmsp 1s linear infinite}
.hmm{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}
.hmt{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:14px;background:rgba(255,255,255,.62);box-shadow:inset 0 1px 1px rgba(255,255,255,.9)}.hmt>i{font-style:normal;font-size:22px}.hmt small{display:block;font-size:11.5px;opacity:.7;line-height:1.3}.hmt b{font-size:15px}
.hmp{display:flex;flex-direction:column;gap:8px}
.hmpr{display:flex;align-items:flex-start;gap:9px;animation:hmtp .5s cubic-bezier(.2,.9,.3,1.15) backwards;animation-delay:calc(var(--i)*90ms)}
.hmpr>i{flex:none;font-style:normal;font-size:24px;line-height:1.1}
.hmpr>p{position:relative;background:rgba(255,255,255,.78);border-radius:6px 16px 16px 16px;padding:8px 12px;font-size:14px;line-height:1.55;box-shadow:0 2px 6px rgba(90,80,50,.12)}
.hmpv{font-size:11.5px;opacity:.6;line-height:1.5;text-align:center}
.hmf{flex:none;display:flex;justify-content:flex-end;gap:8px;padding:10px 6px 2px}
#hmbs{position:fixed;inset:0;z-index:12;pointer-events:none;overflow:hidden}
.hmbw{position:absolute;left:0;top:0;will-change:transform}
.hmbub{position:relative;max-width:150px;padding:7px 12px;border-radius:16px;background:#fff;color:#5B4A4A;font:600 13.5px/1.4 Fredoka,Nunito,sans-serif;text-align:center;box-shadow:0 4px 12px rgba(60,60,50,.22);transform-origin:50% 100%;animation:hmpop .45s cubic-bezier(.2,.9,.3,1.3) both;transition:opacity .5s}
.hmbub::after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:7px solid transparent;border-bottom:0;border-top-color:#fff}
.hmbub.out{opacity:0}
#hoc{cursor:pointer}
@keyframes hmin{from{opacity:0;transform:translateY(24px) scale(.94)}}@keyframes hmtp{from{opacity:0;transform:translateY(8px) scale(.96)}}@keyframes hmpop{from{opacity:0;transform:scale(.3)}}@keyframes hmsp{to{transform:rotate(360deg)}}
@media(max-width:420px){.hmg{gap:6px}.hmq{font-size:12.5px;padding:10px 2px}.hmwh b{font-size:30px}}
@media(max-height:680px){.hmbd{padding:10px;gap:10px}.hmbd .hmd{display:none}.hmq{padding:8px 2px;gap:2px}.hmq svg{width:34px;height:34px}}
@media(max-height:500px){.hmg{grid-template-columns:repeat(6,1fr);gap:4px}.hmq{font-size:11px;padding:6px 1px}.hmq svg{width:28px;height:28px}.hmbd>.hmpv{display:none}.hmw{min-height:96px}}
@media(max-height:360px){.hmbd{overflow:auto}.hmw{overflow:visible;min-height:0}}
@media(prefers-reduced-motion:reduce){.hms,.hmpr,.hmbub{animation:none}}body.rm .hms,body.rm .hmpr,body.rm .hmbub{animation:none}
`;
  document.head.appendChild(css);
  document.body.insertAdjacentHTML('beforeend', `<div class="scrim" id="hmo" hidden><div class="hms" id="hmd" role="dialog" aria-modal="true"><div class="hmh"><h2 id="hmh"></h2><span id="hms2"></span></div><div class="hmbd" id="hmbd"></div><div class="hmf"><button class="btn p" id="hmx"></button></div></div></div><div id="hmbs" aria-hidden="true"></div>`);
  const $o = document.getElementById('hmo'),
    $b = document.getElementById('hmbd'),
    $x = document.getElementById('hmx'),
    $bs = document.getElementById('hmbs'),
    chip = $('hoc');
  const ovl = () => ['rvm', 'mbo', 'wio', 'swo', 'swq', 'modal', 'dlg', 'gmod', 'hmo', 'nmo'].some(k => {
    const el = document.getElementById(k);
    return el && !el.hidden
  });

  /* ---------- 天氣：位置 → Open-Meteo ---------- */
  const LK = 'moodgarden.loc';
  let WC = null,
    wst = 'idle',
    wtok = 0; // WC＝{pos,w,t}（記憶體快取）；wst＝畫面狀態
  const lget = () => {
    try {
      const j = JSON.parse(localStorage.getItem(LK));
      return j && typeof j.lat === 'number' ? j : null
    } catch (e) {
      return null
    }
  };
  const lput = o => {
    try {
      localStorage.setItem(LK, JSON.stringify(o))
    } catch (e) {
      logErr(e)
    }
    return o
  };

  function getPos() {
    return new Promise((res, rej) => {
      const c = lget();
      if (c && Date.now() - c.t < 3 * 36e5) return res(c);
      const ip = () => fetch('https://ipwho.is/').then(r => r.json()).then(j => {
        if (!j || j.success === false || typeof j.latitude !== 'number') throw 0;
        res(lput({
          lat: j.latitude,
          lon: j.longitude,
          t: Date.now(),
          ip: 1,
          name: j.city || ''
        }))
      }).catch(() => c ? res(c) : rej());
      if (!navigator.geolocation) return ip();
      navigator.geolocation.getCurrentPosition(p => res(lput({
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        t: Date.now(),
        name: c && Math.hypot(c.lat - p.coords.latitude, c.lon - p.coords.longitude) < .05 ? c.name : '',
        nl: c && c.nl
      })), () => ip(), {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 6e5
      })
    })
  }
  async function placeName(p) {
    if (p.name && p.nl === S.lang) return p.name;
    try {
      const j = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}&localityLanguage=${I18N.info(S.lang).geo}`)).json();
      const n = j.city || j.locality || j.principalSubdivision || '';
      if (n) {
        p.name = n;
        p.nl = S.lang;
        lput(p)
      }
      return n || p.name || ''
    } catch (e) {
      return p.name || ''
    }
  }
  async function fetchWx(p) {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=uv_index,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto&forecast_days=1&wind_speed_unit=kmh`;
    const j = await (await fetch(u)).json();
    if (!j || !j.current) throw 0;
    const c = j.current,
      H = j.hourly || {},
      D = j.daily || {},
      hi = (H.time || []).indexOf(String(c.time).slice(0, 13) + ':00'),
      pick = a => a && hi >= 0 && a[hi] != null ? a[hi] : null;
    return {
      t: c.temperature_2m,
      fl: c.apparent_temperature,
      h: c.relative_humidity_2m,
      w: c.wind_speed_10m || 0,
      g: c.wind_gusts_10m || 0,
      code: c.weather_code,
      day: !!c.is_day,
      pr: c.precipitation || 0,
      uv: pick(H.uv_index),
      pp: pick(H.precipitation_probability),
      uvMax: D.uv_index_max ? D.uv_index_max[0] : null,
      ppMax: D.precipitation_probability_max ? D.precipitation_probability_max[0] : null,
      hi: D.temperature_2m_max ? D.temperature_2m_max[0] : null,
      lo: D.temperature_2m_min ? D.temperature_2m_min[0] : null
    }
  }
  async function loadWx(force) {
    const my = ++wtok;
    if (!force && WC && Date.now() - WC.t < 10 * 6e4) {
      wst = 'ok';
      paintWx();
      return
    }
    wst = WC ? 'ok' : 'pos';
    paintWx(true);
    let pos;
    try {
      pos = await getPos()
    } catch (e) {
      if (my === wtok) {
        wst = 'nopos';
        paintWx()
      }
      return
    }
    if (my !== wtok) return;
    if (!WC) wst = 'wx';
    paintWx(true);
    try {
      const [w, name] = await Promise.all([fetchWx(pos), placeName(pos)]);
      if (my !== wtok) return;
      WC = {
        pos,
        w,
        name,
        t: Date.now()
      };
      wst = 'ok'
    } catch (e) {
      if (my !== wtok) return;
      if (!WC) wst = 'nowx'
    }
    paintWx()
  }
  const grp = c => c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : (c === 45 || c === 48) ? 4 : (c >= 51 && c <= 57) ? 5 : (c >= 61 && c <= 67) ? 6 : ((c >= 71 && c <= 77) || c === 85 || c === 86) ? 7 : (c >= 80 && c <= 82) ? 8 : c >= 95 ? 9 : 3;
  const CE = ['☀️', '🌤️', '⛅', '☁️', '🌫️', '🌦️', '🌧️', '🌨️', '🌦️', '⛈️'];
  const windK = v => v < 12 ? 0 : v < 30 ? 1 : v < 50 ? 2 : 3,
    uvK = v => v < 3 ? 0 : v < 6 ? 1 : v < 8 ? 2 : v < 11 ? 3 : 4;
  /* 小動物們給的提醒：最多三則，越要緊的越前面 */
  function tips(w) {
    const o = [],
      add = (e, k) => {
        if (o.length < 3) o.push([e, k])
      },
      g = grp(w.code),
      T0 = w.t,
      F0 = w.fl != null ? w.fl : w.t;
    const storm = g === 9,
      rain = g === 5 || g === 6 || g === 8 || w.pr > .1 || (w.pp != null && w.pp >= 50) || (w.ppMax != null && w.ppMax >= 60),
      wind = w.w >= 30 || w.g >= 45,
      uv = (w.uv != null && w.uv >= 6) || (w.uvMax >= 8 && w.uv != null && w.uv >= 3),
      hot = F0 >= 33 || T0 >= 32,
      cold = F0 <= 15 || g === 7,
      humid = w.h >= 85 && !rain && T0 >= 24;
    if (storm) add('🐸', 'hmTpStorm');
    if (rain && !storm) add('🐥', 'hmTpRain');
    if (wind) add('🦋', 'hmTpWind');
    if (uv) add('🐝', 'hmTpUv');
    if (hot) add('🐞', 'hmTpHot');
    if (cold) add('🐌', 'hmTpCold');
    if (humid) add('🐸', 'hmTpHumid');
    if (!o.length && g <= 2 && w.day && T0 >= 18 && T0 <= 30) add('🐝', 'hmTpNice');
    if (!o.length) add('🐥', 'hmTpDef');
    return o
  }
  const num = v => v == null ? '—' : Math.round(v);

  function wxHTML() {
    const {
      w,
      pos,
      name
    } = WC, g = grp(w.code), ico = (!w.day && g <= 1) ? '🌙' : CE[g], place = name ? `📍 ${esc(name)}${pos.ip?' '+esc(tr('hmApprox')):''} · ` : '',
      t = new Date(WC.t).toLocaleTimeString(LC(), {
        hour: '2-digit',
        minute: '2-digit'
      }), uv = w.uv != null ? w.uv : null, pp = w.pp != null ? w.pp : w.ppMax;
    return `<div class="hmwh"><span class="hmwi" aria-hidden="true">${ico}</span><div><b>${num(w.t)}°C</b><small>${esc(tr('hmC'+g))} · ${esc(tr('hmFeels'))} ${num(w.fl)}°${w.hi!=null?`<br>${esc(tr('hmToday',num(w.hi),num(w.lo)))}`:''}</small></div><button data-a="rf" aria-label="${esc(tr('hmRetry'))}" title="${esc(tr('hmRetry'))}">${ic('refresh')}</button></div>
<div class="hmm"><div class="hmt"><i aria-hidden="true">${ic('air')}</i><span><small>${esc(tr('hmWind'))}</small><b>${num(w.w)} km/h</b> <small style="display:inline">${esc(tr('hmW'+windK(w.w)))}</small></span></div>
<div class="hmt"><i aria-hidden="true">${ic('water_drop')}</i><span><small>${esc(tr('hmHum'))}</small><b>${num(w.h)}%</b></span></div>
<div class="hmt"><i aria-hidden="true">${ic('light_mode')}</i><span><small>${esc(tr('hmUv'))}</small><b>${uv==null?'—':uv.toFixed(1)}</b> <small style="display:inline">${uv==null?'':esc(tr('hmU'+uvK(uv)))}</small></span></div>
<div class="hmt"><i aria-hidden="true">${ic('umbrella')}</i><span><small>${esc(tr('hmRainP'))}</small><b>${num(pp)}%</b></span></div></div>
<div class="hmp">${tips(w).map(([e,k],i)=>`<div class="hmpr" style="--i:${i}"><i aria-hidden="true">${e}</i><p>${esc(tr(k))}</p></div>`).join('')}</div>
<div class="hmpv" style="margin-top:10px">${place}${esc(tr('hmUpd',t))}</div>`
  }

  function paintWx(spin) {
    const el = document.getElementById('hmw');
    if (!el) return;
    if (wst === 'ok' && WC) {
      el.innerHTML = wxHTML();
      const b = el.querySelector('[data-a=rf]');
      if (b && spin) b.classList.add('sp');
      return
    }
    const m = {
        pos: 'hmLoadPos',
        wx: 'hmLoadWx',
        nopos: 'hmNoPos',
        nowx: 'hmNoWx'
      } [wst] || 'hmLoadWx',
      err = wst === 'nopos' || wst === 'nowx';
    el.innerHTML = `<div class="hmn">${err?'':'<div style="font-size:30px;margin-bottom:4px" aria-hidden="true">🌤️</div>'}${esc(tr(m))}${err?`<br><button class="btn" data-a="rf">${ic('refresh')} ${esc(tr('hmRetry'))}</button>`:''}</div>`
  }

  /* ---------- 視窗內容 ---------- */
  function render() {
    const o = curOut();
    document.getElementById('hmd').setAttribute('aria-label', tr('hmT'));
    document.getElementById('hmh').innerHTML = ic('pets') + ' ' + esc(tr('hmT'));
    document.getElementById('hms2').textContent = o ? tr('hmSubNow', tr('hmS_' + o.st), sinceTxt(o.u)) : tr('hmSubNone');
    $x.innerHTML = ic('close') + ' ' + esc(tr('close'));
    $b.innerHTML = `<section><h3>${esc(tr('hmAskT'))}</h3><p class="hmd">${esc(tr('hmAskD'))}</p><div class="hmg">${STS.map(([k])=>`<button class="hmq" data-k="${k}" aria-pressed="${!!o&&o.st===k}">${stIcon(k,44)}${esc(tr('hmS_'+k))}</button>`).join('')}</div></section>
<section class="hmwx"><h3>${esc(tr('hmWxT'))}</h3><div class="hmw" id="hmw"></div></section><p class="hmpv">${esc(tr('hmPriv'))}</p>`;
    paintWx()
  }
  $b.addEventListener('click', e => {
    const q = e.target.closest('.hmq');
    if (q) {
      choose(q.dataset.k);
      return
    }
    const r = e.target.closest('[data-a=rf]');
    if (r) loadWx(true)
  });

  function open() {
    if (!$o.hidden || ovl()) return;
    try {
      if (typeof arrange !== 'undefined' && arrange) return
    } catch (e) {
      logErr(e)
    }
    stop(true);
    render();
    $o.hidden = false;
    $('card').hidden = true;
    tgG.set(SX, .4, SZ + .2);
    radG = Math.min(radG, 14);
    try {
      sfx('island')
    } catch (e) {
      logErr(e)
    }
    loadWx(false);
    setTimeout(() => {
      try {
        $x.focus({
          preventScroll: true
        })
      } catch (e) {
        logErr(e)
      }
    }, 350)
  }

  function close(goHome) {
    $o.hidden = true;
    wtok++;
    if (goHome && typeof home === 'function')(typeof homeSoft === 'function' ? homeSoft() : home())
  }
  $x.onclick = () => close(true);
  $o.addEventListener('pointerdown', e => {
    if (e.target === $o) close(true)
  });
  addEventListener('keydown', e => {
    if (!$o.hidden && e.key === 'Escape') close(true)
  });
  chip.addEventListener('click', open);
  chip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open()
    }
  });

  function paintChip() {
    const o = curOut();
    chip.hidden = !o;
    if (o) {
      chip.innerHTML = stIcon(o.st, 18) + ' ' + esc(tr('hmS_' + o.st));
      chip.title = chip.ariaLabel = tr('hmT')
    }
  }

  function choose(k) {
    if (!STSK.includes(k)) return;
    S.out = {
      st: k,
      u: Date.now()
    };
    save(); // 存本機，並通知雲端同步
    close(false);
    paintChip();
    play(k)
  }

  /* ---------- 送行（回家了＝迎接） ---------- */
  const A0 = Math.atan2(SZ - G2.z, SX - G2.x); // 從第二座花園中心看向小島的方向
  const GP = (f, a) => at2(f, a); // 花園邊上的集合點
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  };
  let so = null;
  const wv = new T.Vector3();
  const scr = (o, dy) => {
    o.getWorldPosition(wv);
    wv.y += dy;
    const p = wv.clone().project(cam);
    return {
      x: (p.x * .5 + .5) * innerWidth,
      y: (-p.y * .5 + .5) * innerHeight,
      v: p.z < 1
    }
  };

  function play(k) {
    if (!STSK.includes(k)) return;
    stop(true);
    const rm = !!S.rm,
      home_ = k === 'home',
      ws = [],
      fs = [];
    cr.forEach(c => {
      (CT[c.userData.type].fly ? fs : ws).push(c)
    });
    so = {
      k,
      home: home_,
      rm,
      t: 0,
      ph: 0,
      tSay: 0,
      out: 0,
      bub: [],
      n: 0,
      cam: null
    };
    /* 走路的：排在花園靠小島那一側的岸邊，面向小島；必要時先過橋 */
    if (!rm) {
      ws.forEach((c, i) => {
        const u = c.userData,
          row = Math.floor(i / 6),
          idx = i % 6,
          cnt = Math.min(6, ws.length - row * 6),
          a = A0 + (idx - (cnt - 1) / 2) * .2,
          q = GP(.76 - row * .12, a),
          p = c.position;
        u.tg.set(q[0], 0, q[1]);
        planRoute(u, p);
        let pl = 0,
          px = p.x,
          pz = p.z;
        (u.wp || []).concat([u.tg]).forEach(w => {
          pl += Math.hypot(w.x - px, w.z - pz);
          px = w.x;
          pz = w.z
        });
        u.go = {
          m: 'w',
          arr: 0,
          pl,
          sp: clamp(pl / 5.5, Math.max(.9, CT[u.type].sp * 1.6), 4.6)
        };
        u.v.set(0, 0, 0);
        so.n++
      });
      fs.forEach(c => {
        const u = c.userData,
          p = c.position,
          d = Math.hypot(SX - p.x, SZ - p.z);
        u.go = {
          m: 'f',
          arr: 0,
          a: Math.random() * 6.283,
          w: (.5 + Math.random() * .4) * (Math.random() < .5 ? 1 : -1),
          r: 1.1 + Math.random() * 1.4,
          y: 1.3 + Math.random() * 1.1,
          sp: clamp(d / 5.5, 2.2, 6)
        };
        u.v.set(0, 0, 0);
        so.n++
      })
    }
    /* 鏡頭：拉到「岸邊的動物」和「小島」之間 */
    const g = GP(.76, A0);
    so.cam = {
      x: (g[0] + SX) / 2,
      z: (g[1] + SZ) / 2
    };
    tgG.set(so.cam.x, .4, so.cam.z);
    radG = innerWidth < 760 ? 21 : 15;
    so.tg0 = tgG.clone();
    paintChip();
    say(1)
  } // 一選好狀態，大家馬上開口祝福，不用等動物走到
  function say(round) {
    so.bub.forEach(b => b.el.remove());
    so.bub = [];
    const home_ = so.home,
      main = tr(home_ ? 'hmH0' : 'hmL0'),
      pool = shuffle((home_ ? ['hmH1', 'hmH2', 'hmH3', 'hmH4'] : ['hmL1', 'hmL2', 'hmL3', 'hmL4', 'hmX_' + so.k]).map(k => tr(k)));
    const cand = [{
      o: chick,
      dy: .55,
      f: round === 1
    }, {
      o: snail,
      dy: .55,
      f: round === 1
    }];
    shuffle(cr.filter(c => c.userData.go || so.rm)).forEach(c => cand.push({
      o: c,
      dy: CT[c.userData.type].fly ? .5 : .6
    }));
    (window.FROGS || []).forEach(f => {
      if (f.g.visible) cand.push({
        o: f.g,
        dy: .6
      })
    });
    cand.push({
      o: lady,
      dy: .45
    });
    const gap = clamp(Math.min(innerWidth, innerHeight) * .17, 84, 140),
      pk = [],
      M = 40;
    cand.forEach(c => {
      if (c.f) {
        pk.push({
          ...c,
          x: -999,
          y: -999
        });
        return
      }
      if (pk.length >= 5 || !c.o.visible && c.o !== chick && round !== 1) return;
      const s = scr(c.o, c.dy);
      if (!s.v || s.x < M || s.x > innerWidth - M || s.y < M + 60 || s.y > innerHeight - M) return;
      if (pk.some(q => Math.hypot(q.x - s.x, q.y - s.y) < gap)) return;
      pk.push({
        ...c,
        x: s.x,
        y: s.y
      })
    });
    pk.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'hmbw';
      el.innerHTML = `<div class="hmbub" style="animation-delay:${i*130}ms">${esc(round===1?(i===0?main:pool[(i-1)%pool.length]):pool[i%pool.length])}</div>`;
      $bs.appendChild(el);
      so.bub.push({
        el,
        o: c.o,
        dy: c.dy
      });
      if (!so.rm && typeof burst === 'function' && c.o !== chick) {
        try {
          burst('heart', c.o.getWorldPosition(new T.Vector3()), 2)
        } catch (e) {
          logErr(e)
        }
      }
    });
    if (round === 1) {
      try {
        sfx('sendoff', 'island')
      } catch (e) {
        logErr(e)
      }
      try {
        toast(esc(main))
      } catch (e) {
        logErr(e)
      }
    }
    /* 每隻動物各自做牠們被點到時的招牌動作（蜜蜂轉圈、蝴蝶盤旋、小雞轉身、瓢蟲翻滾…）當作揮手 */
    if (round !== 1 && !so.rm) cr.forEach(c => {
      const u = c.userData;
      if (u.go) u.go.actAt = so.t + Math.random() * .9
    })
  }

  function release() {
    cr.forEach(c => {
      const u = c.userData;
      if (!u.go) return;
      u.go = null;
      u.v.set(0, 0, 0);
      u.wp = null;
      u.fl = 0;
      u.pick = 1;
      u.hold = .3 + Math.random() * .6;
      if (CT[u.type].fly) u.tg.copy(c.position)
    })
  }

  function stop(now) {
    if (!so) return;
    release();
    so.bub.forEach(b => b.el.remove());
    $bs.innerHTML = '';
    so = null;
    if (now) ev = 0
  }
  /* 這隻動物的送行腳步（由 crStep 開頭的小掛鉤呼叫；回傳 true＝這一幀由這裡接管） */
  function moveStep(c, dt, t) {
    const u = c.userData,
      g = u.go,
      p = c.position,
      fly = g.m === 'f';
    if (!so) {
      u.go = null;
      return false
    }
    if (g.actAt != null && so.t >= g.actAt) {
      g.actAt = null;
      if (!u.act) u.act = {
        t: 0,
        p0: p.clone(),
        r0: c.rotation.y,
        s0: c.scale.x,
        f1: 0
      }
    }
    if (u.act && actStep(c, u, dt, t, u.type)) return true;
    if (!fly) {
      if (g.arr) {
        const da = Math.atan2(SX - p.x, SZ - p.z) - c.rotation.y;
        c.rotation.y += Math.atan2(Math.sin(da), Math.cos(da)) * Math.min(1, dt * 6);
        p.y = surf(p.x, p.z);
        return true
      }
      if (u.wp && u.wp.length && Math.hypot(u.wp[0].x - p.x, u.wp[0].z - p.z) < .25) u.wp.shift();
      const aim = (u.wp && u.wp.length) ? u.wp[0] : u.tg,
        dx = aim.x - p.x,
        dz = aim.z - p.z,
        d = Math.hypot(dx, dz);
      if (!(u.wp && u.wp.length) && d < .12) {
        g.arr = 1;
        return true
      }
      const s = Math.min(d, g.sp * dt),
        nx = p.x + dx / d * s,
        nz = p.z + dz / d * s;
      if (walk(nx, nz) || !walk(p.x, p.z)) {
        p.x = nx;
        p.z = nz
      } else if (walk(nx, p.z)) p.x = nx;
      else if (walk(p.x, nz)) p.z = nz;
      p.y = surf(p.x, p.z) + Math.abs(Math.sin(t * (u.type === 'bird' ? 10 : 8) + u.i)) * .06;
      let a = Math.atan2(dx, dz) - c.rotation.y;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      c.rotation.y += a * Math.min(1, dt * 8);
      return true
    }
    /* 飛的：直線飛向小島，到了就繞著小島飛圈 */
    g.a += dt * g.w;
    const ty = ISY + g.y + Math.sin(t * 1.6 + u.i) * .15,
      tx = SX + Math.cos(g.a) * g.r,
      tz = SZ + Math.sin(g.a) * g.r,
      dx = tx - p.x,
      dy = ty - p.y,
      dz = tz - p.z,
      d = Math.hypot(dx, dy, dz);
    if (!g.arr && d < 1.4) g.arr = 1;
    if (g.arr) {
      const k = 1 - Math.pow(.02, dt);
      p.x += dx * k;
      p.y += dy * k;
      p.z += dz * k;
      const a = Math.atan2(-Math.sin(g.a) * g.w, Math.cos(g.a) * g.w) - c.rotation.y;
      c.rotation.y += Math.atan2(Math.sin(a), Math.cos(a)) * Math.min(1, dt * 6)
    } else {
      const s = Math.min(d, g.sp * dt);
      p.x += dx / d * s;
      p.y += dy / d * s;
      p.z += dz / d * s;
      let a = Math.atan2(dx, dz) - c.rotation.y;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      c.rotation.y += a * Math.min(1, dt * 6)
    }
    wing(c, u.type === 'bee' ? Math.sin(t * 50 + u.i) * .7 : .3 + (Math.sin(t * 11 + u.i) + 1) * .45);
    return true
  }

  function soStep(dt) {
    if (!so) return;
    so.t += dt;
    if (so.ph === 0) {
      let arr = 0,
        tot = 0;
      cr.forEach(c => {
        const g = c.userData.go;
        if (g) {
          tot++;
          if (g.arr) arr++
        }
      });
      if ((so.rm && so.t > .6) || (so.t > 1.8 && arr >= tot) || so.t > 9) {
        so.ph = 1;
        so.tSay = so.t;
        say(2)
      } else if (so.t > 5.5 && so.bub.length && !so.f1) {
        so.f1 = 1;
        const bs = so.bub;
        bs.forEach(b => b.el.firstChild.classList.add('out'));
        setTimeout(() => {
          bs.forEach(b => b.el.remove());
          so.bub = so.bub.filter(b => !bs.includes(b))
        }, 600)
      }
    } else if (so.ph === 1) {
      if (so.t - so.tSay > (so.rm ? 3.2 : 3.8)) {
        so.ph = 2;
        so.tOut = so.t;
        so.bub.forEach(b => b.el.firstChild.classList.add('out'));
        release();
        so.out = 1
      }
    } else if (so.ph === 2) {
      if (so.t - so.tOut > .6 && so.cam && !so.back) {
        so.back = 1;
        if (!ovl() && $('card').hidden && tgG.distanceTo(so.tg0) < .6) home()
      }
      if (so.t - so.tOut > .55 && so.bub.length) {
        so.bub.forEach(b => b.el.remove());
        so.bub = []
      }
      if (so.t - so.tOut > 1.6 && ev < .03) {
        so = null
      }
    }
  }

  function bubStep() {
    if (!so || !so.bub.length) return;
    const vis = document.body.dataset.v === 'garden';
    so.bub.forEach(b => {
      const s = scr(b.o, b.dy);
      b.el.style.display = vis && s.v ? '' : 'none';
      b.el.style.transform = `translate(${(s.x).toFixed(1)}px,${(s.y).toFixed(1)}px) translate(-50%,-100%)`
    })
  }

  /* ---------- 每一幀 ---------- */
  let T0 = performance.now(),
    sh = false,
    hovT = 0,
    sigT = 0,
    sig = '';
  SLP.cbs.push(() => {
    if (sh) {
      sh = false;
      T0 = performance.now();
      requestAnimationFrame(step)
    }
  });

  function step(now) {
    if (SLP.on) {
      sh = true;
      return
    }
    requestAnimationFrame(step);
    const dt = Math.min(.05, (now - T0) / 1000);
    T0 = now;
    if (dt <= 0) return;
    let rm = false;
    try {
      rm = !!S.rm
    } catch (e) {
      logErr(e)
    }
    const t = now / 1000,
      night = 1 - (window.dfv == null ? 1 : window.dfv);
    sigT -= dt;
    if (sigT <= 0) {
      sigT = 1;
      const o = curOut(),
        g = (o ? o.st + o.u : '') + S.lang;
      if (g !== sig) {
        sig = g;
        paintChip();
        if (!$o.hidden) {
          render();
          if (WC || wst !== 'idle') paintWx()
        }
      }
    }
    ev += (((so && !so.out) ? 1 : 0) - ev) * Math.min(1, dt * (rm ? 20 : 2.2));
    if (ev < .002) ev = 0;
    residents(t, dt, rm);
    soStep(dt);
    bubStep();
    cvGlow.material.opacity = .1 + .4 * night + (rm ? 0 : .04 * Math.sin(t * 3.1)) + .25 * sm(ev);
    const need = !curOut() || Date.now() - curOut().u > 12 * 36e5;
    if (!rm) {
      hint.sp.position.y = hint.y + Math.sin(t * 1.5 + .9) * .06;
      hint.sp.material.rotation = Math.sin(t * .9 + 1) * .1;
      sgn.rotation.z = Math.sin(t * 1.1) * .012
    }
    if (hint.hov && now - hovT > 400) hint.hov = false;
    const hv = hint.hov ? 1.18 : 1;
    hint.sp.scale.x += (.85 * hv - hint.sp.scale.x) * .15;
    hint.sp.scale.y = hint.sp.scale.x;
    hint.gl.material.opacity = .07 + (need ? .05 + (rm ? 0 : .04 * Math.sin(t * 2.2)) : 0) + (hint.hov ? .05 : 0);
    hint.gl.position.y = hint.sp.position.y
  }
  requestAnimationFrame(step);

  /* ---------- 點擊偵測 ---------- */
  const rc = new T.Raycaster(),
    mv2 = new T.Vector2();

  function pick(e) {
    try {
      if (typeof arrange !== 'undefined' && arrange) {
        hint.hov = false;
        return false
      }
      mv2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      rc.setFromCamera(mv2, cam);
      const r = rc.intersectObject(hit, false)[0],
        h = !!r;
      hint.hov = h;
      hovT = performance.now();
      return h ? r.distance : false
    } catch (err) {
      return false
    }
  }

  /* ---------- 對外的小介面 ---------- */
  window.HOMEI = {
    pick,
    open,
    close,
    play,
    stop: () => stop(true),
    step: moveStep,
    refresh() {
      try {
        sig = '';
        paintChip();
        if (!$o.hidden) render()
      } catch (e) {
        logErr(e)
      }
    }
  };
  paintChip();
})();
