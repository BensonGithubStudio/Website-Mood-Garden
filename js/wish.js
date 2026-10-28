/* ============================================================================
 * js/wish.js — 星願島
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・第二座花園右上方的小島：寫下對未來的自己許的願，會種下一朵特別的「星願
 *     花」（幼苗期 → 成長期 → 盛開）。
 *   ・星願花的資料存在 S.w，與一般花朵一樣帶更新時間、刪除記在 S.wdel，並參與
 *     雲端同步；對外以 window.SI 提供。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、flower-care.js、camera.js、creatures.js、weather.js、
 *   particles.js、loop.js、ui-shell.js、withered-island.js
 * 提供給其他檔案：SI
 * 載入順序：第 30 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 星願島 =====
   第二座花園右上方的一座小島。點小島可以寫下「對未來的自己」許的願，寫完會在島上種下一朵特別的「星願花」。
   星願花有三個階段：幼苗期 → 成長期 → 盛開
     ・種下約 2 小時後花會口渴，澆水（並回答「有沒有朝著願望前進」）10 分鐘後長到第二階段；
     ・到了你設定的實現時間，花朵長大成熟（第三階段），並詢問願望有沒有實現。
   資訊框、澆水、成長、旋轉、移動都跟其他花一樣，但這裡的花只能在這座島上移動，其他島的花也不能搬來。
   星願花永遠不會凋零；隨時可以「刪除」（所有資料一起清除）或「鏟除」（搬到凋零小島，願望都還在）。
   資料存在 S.w（刪除記在 S.wdel），跟其他花一樣會同步到 Google 雲端硬碟。
   ★ 想測試時間流程：網址後面加 ?wishfast=1（2 小時 → 20 秒、10 分鐘 → 10 秒）。 */
(function() {
  'use strict';
  if (typeof ok === 'undefined' || !ok || typeof scene === 'undefined' || typeof THREE === 'undefined' || typeof STAR === 'undefined') return;
  const T = THREE,
    clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- 文字（四種語言） ---------- */
  I18N.add('en', {
    swT: 'Wishing Isle',
    swSub: n => `${n} wish ${n==1?'flower':'flowers'} here`,
    swHint: 'Write a wish to your future self. A special flower will be planted here for it.',
    swTooSoon: 'Set a goal a little further ahead',
    swTabNow: 'Wishes on the isle',
    swTabPast: 'Past wishes',
    swNonePast: 'No past wishes yet. Wishes whose day has come, or that you dug up, are kept here.',
    swDug: 'Dug up',
    mw_a: 'A wish you once made…',
    mw_b: 'Something you once wanted…',
    swEditD: 'Change the words of your wish or the day you hope it comes true.',
    swPh: 'Dear future me, I hope you…',
    swWhen: 'When do you hope it comes true?',
    swP1w: 'In a week',
    swP1m: 'In a month',
    swP3m: 'In 3 months',
    swP6m: 'In 6 months',
    swP1y: 'In a year',
    swPlantB: 'Plant my wish',
    swSaveB: 'Save changes',
    swNeedTx: 'Write your wish first',
    swNeedTm: 'Pick a time in the future',
    swLockT: 'The time has arrived, so it can’t be changed anymore.',
    swAt: (a, b) => `${a} · ${b}`,
    swFullT: 'The isle is full',
    swFull: 'There is no room left to plant on the isle. Clear some flowers (delete or dig them up) before making a new wish.',
    swPlanted: 'Your wish is planted. The stars will help it grow ✨',
    swListT: 'Wishes on the isle',
    swNone: 'No wish flowers yet',
    swName: 'Wish Flower',
    swS0: 'Seedling',
    swS1: 'Growing',
    swS2: 'In bloom',
    swSproutH: h => `Still a seedling. Ready to water in about ${h}h`,
    swSproutM: m => `Still a seedling. Ready to water in about ${m} min`,
    swThirst: 'It’s thirsty. Water it so it can grow',
    swWet: m => `Watered. Grows up in about ${m} min`,
    swGrowing: 'Growing slowly, waiting for the day your wish is due',
    swBloom: 'Your wish flower is in full bloom',
    swTargetL: 'Due',
    swInM: m => `in about ${m} min`,
    swInH: h => `in about ${h}h`,
    swInD: d => `in ${d} ${d==1?'day':'days'}`,
    swArrived: 'time’s up',
    swQ1T: 'Have you been moving toward your wish?',
    swQ1a: 'Yes, I’m working on it',
    swQ1b: 'A little progress',
    swQ1c: 'Not yet, but I want to start again',
    swLater: 'Maybe later',
    swR1a: 'Wonderful! The stars can see your effort ✨',
    swR1b: 'Every small step counts. Keep going gently.',
    swR1c: 'That’s okay. Starting now is still starting 🌱',
    swQ2T: 'Did your wish come true?',
    swQ2a: 'Yes, it came true 🎉',
    swQ2b: 'Not completely, but I tried my best',
    swQ2c: 'Not this time',
    swR2a: 'Congratulations! Your wish came true 🎉',
    swR2b: 'You’ve come a long way. Be proud of yourself.',
    swR2c: 'That’s okay. Your future self will be proud of you for trying.',
    swRes1: 'Wish came true',
    swRes2: 'Did my best',
    swRes3: 'Not yet',
    swPg2: 'Working on it',
    swPg1: 'A little progress',
    swPg0: 'Starting again',
    swAnsB: 'Did it come true?',
    swAnsAgain: 'Change answer',
    swDelQ: 'Delete this wish flower? Its wish and all its data will be erased for good.',
    swShovelQ: 'Dig up this wish flower? It will move to the Withered Isle, and your wish stays.',
    swShoveled: 'Moved to the Withered Isle',
    swThirstT: n => n == 1 ? 'A wish flower is thirsty' : `${n} wish flowers are thirsty`,
    swG1: 'Your wish flower grew a little!',
    swG2: 'Your wish flower is in bloom!'
  });
  I18N.add('zh', {
    swT: '星願島',
    swSub: n => `島上有 ${n} 朵星願花`,
    swHint: '寫下對未來的自己想說的話，許一個願望。寫完後，會在這裡種下一朵特別的花。',
    swTooSoon: '加入更久以後的目標吧',
    swTabNow: '島上的願望',
    swTabPast: '曾經的願望',
    swNonePast: '還沒有曾經的願望。實現時間到了的願望，或是被鏟除的花，都會收在這裡。',
    swDug: '已鏟除',
    mw_a: '曾經的願望…',
    mw_b: '曾經想要…',
    swEditD: '可以修改願望的內容，或是希望實現的時間。',
    swPh: '親愛的未來的我，我希望你…',
    swWhen: '希望願望實現的時間',
    swP1w: '一週後',
    swP1m: '一個月後',
    swP3m: '三個月後',
    swP6m: '半年後',
    swP1y: '一年後',
    swPlantB: '種下願望',
    swSaveB: '儲存變更',
    swNeedTx: '先寫下你的願望吧',
    swNeedTm: '請選一個還沒到的時間',
    swLockT: '已經到了實現的時間，不能再修改囉。',
    swAt: (a, b) => `${a}（${b}）`,
    swFullT: '星願島已經滿了',
    swFull: '島上已經沒有可以種花的地方了。請先清理一些花朵（刪除或鏟除），再來許願。',
    swPlanted: '願望已經種下，星星會陪它慢慢長大 ✨',
    swListT: '島上的願望',
    swNone: '島上還沒有星願花',
    swName: '星願花',
    swS0: '幼苗期',
    swS1: '成長期',
    swS2: '盛開',
    swSproutH: h => `還是幼苗，約 ${h} 小時後可以澆水`,
    swSproutM: m => `還是幼苗，約 ${m} 分鐘後可以澆水`,
    swThirst: '花兒口渴了，澆水讓它長大',
    swWet: m => `已澆水，約 ${m} 分鐘後長大`,
    swGrowing: '正在慢慢長大，等待願望實現的那一天',
    swBloom: '願望花盛開了',
    swTargetL: '實現時間',
    swInM: m => `約 ${m} 分鐘後`,
    swInH: h => `約 ${h} 小時後`,
    swInD: d => `${d} 天後`,
    swArrived: '時間到了',
    swQ1T: '你有好好朝著願望前進嗎？',
    swQ1a: '有，我正在努力',
    swQ1b: '有一點點進展',
    swQ1c: '還沒有，但我想重新出發',
    swLater: '稍後再說',
    swR1a: '太棒了！星星都看見你的努力了 ✨',
    swR1b: '每一小步都算數，慢慢走就好。',
    swR1c: '沒關係，從現在開始也不遲 🌱',
    swQ2T: '你的願望實現了嗎？',
    swQ2a: '實現了 🎉',
    swQ2b: '還沒完全，但我盡力了',
    swQ2c: '這次沒有實現',
    swR2a: '恭喜你！願望成真了 🎉',
    swR2b: '你已經走了很遠，替自己感到驕傲吧。',
    swR2c: '沒關係，未來的你會為努力過的今天感到驕傲。',
    swRes1: '願望實現了',
    swRes2: '盡力了',
    swRes3: '尚未實現',
    swPg2: '正在努力',
    swPg1: '有一點進展',
    swPg0: '重新出發',
    swAnsB: '願望實現了嗎？',
    swAnsAgain: '更改答案',
    swDelQ: '要刪除這朵星願花嗎？願望和所有資料都會被永久清除，無法復原。',
    swShovelQ: '要鏟除這朵星願花嗎？它會搬到凋零小島，你寫下的願望都會保留。',
    swShoveled: '已搬到凋零小島',
    swThirstT: n => `有 ${n} 朵星願花口渴了`,
    swG1: '星願花長大了一點！',
    swG2: '星願花盛開了！'
  });
  I18N.add('ja', {
    swT: 'ねがいの島',
    swSub: n => `${n}輪の願いの花があります`,
    swHint: '未来の自分へ向けて願いごとを書きましょう。書き終えると、特別なお花が植わります。',
    swTooSoon: 'もう少し先の目標にしてみよう',
    swTabNow: '島の願い',
    swTabPast: 'かつての願い',
    swNonePast: 'かつての願いはまだありません。叶える日が来た願いや、掘り起こした花がここに残ります。',
    swDug: '掘り起こし済み',
    mw_a: 'かつての願い…',
    mw_b: 'かつて望んだこと…',
    swEditD: '願いの言葉や、叶えたい日を変えられます。',
    swPh: '未来のわたしへ、あなたがこうなっていますように…',
    swWhen: 'いつ叶えたい？',
    swP1w: '1週間後',
    swP1m: '1か月後',
    swP3m: '3か月後',
    swP6m: '半年後',
    swP1y: '1年後',
    swPlantB: '願いを植える',
    swSaveB: '変更を保存',
    swNeedTx: 'まず願いごとを書いてね',
    swNeedTm: 'これから先の日時を選んでね',
    swLockT: '叶える日が来たので、もう変えられません。',
    swAt: (a, b) => `${a}（${b}）`,
    swFullT: '島がいっぱいです',
    swFull: '島にはもう植える場所がありません。お花を整理（削除または掘り起こし）してから願いごとをしてね。',
    swPlanted: '願いを植えました。星が育ててくれます ✨',
    swListT: '島の願い',
    swNone: 'まだ願いの花はありません',
    swName: 'ねがいの花',
    swS0: '芽',
    swS1: '成長中',
    swS2: '満開',
    swSproutH: h => `まだ芽です。あと約${h}時間で水やりできます`,
    swSproutM: m => `まだ芽です。あと約${m}分で水やりできます`,
    swThirst: 'のどが渇いています。水をあげて育てましょう',
    swWet: m => `水やり済み。あと約${m}分で育ちます`,
    swGrowing: 'ゆっくり育っています。願いの日を待っています',
    swBloom: '願いの花が満開です',
    swTargetL: '叶えたい日',
    swInM: m => `あと約${m}分`,
    swInH: h => `あと約${h}時間`,
    swInD: d => `あと${d}日`,
    swArrived: 'その日になりました',
    swQ1T: '願いに向かって進めていますか？',
    swQ1a: 'はい、がんばっています',
    swQ1b: '少しだけ進みました',
    swQ1c: 'まだだけど、また始めたい',
    swLater: 'あとで',
    swR1a: 'すばらしい！星があなたの努力を見ています ✨',
    swR1b: '小さな一歩も大事。ゆっくり進もう。',
    swR1c: '大丈夫。今から始めても遅くないよ 🌱',
    swQ2T: '願いは叶いましたか？',
    swQ2a: '叶いました 🎉',
    swQ2b: '完全ではないけど、がんばった',
    swQ2c: '今回は叶わなかった',
    swR2a: 'おめでとう！願いが叶いました 🎉',
    swR2b: 'ここまでよくがんばりました。自分を誇ってね。',
    swR2c: '大丈夫。挑戦した今日を、未来のあなたが誇りに思います。',
    swRes1: '願いが叶った',
    swRes2: 'がんばった',
    swRes3: 'これから',
    swPg2: 'がんばり中',
    swPg1: '少し前進',
    swPg0: '再スタート',
    swAnsB: '願いは叶った？',
    swAnsAgain: '答えを変える',
    swDelQ: 'この願いの花を削除しますか？願いごとも含めすべてのデータが消え、元に戻せません。',
    swShovelQ: 'この願いの花を掘り起こしますか？「枯れ花の島」に移り、願いごとは残ります。',
    swShoveled: '枯れ花の島に移しました',
    swThirstT: n => `${n}輪の願いの花がのどを渇かせています`,
    swG1: '願いの花が少し育ちました！',
    swG2: '願いの花が満開です！'
  });
  I18N.add('ko', {
    swT: '소원의 섬',
    swSub: n => `소원꽃 ${n}송이가 있어요`,
    swHint: '미래의 나에게 소원을 적어 보세요. 다 쓰면 특별한 꽃이 심어져요.',
    swTooSoon: '조금 더 먼 목표를 넣어 보세요',
    swTabNow: '섬의 소원',
    swTabPast: '지난 소원',
    swNonePast: '아직 지난 소원이 없어요. 이룰 날이 된 소원이나 파낸 꽃이 여기에 남아요.',
    swDug: '파냄',
    mw_a: '예전에 빌었던 소원…',
    mw_b: '예전에 바랐던 것…',
    swEditD: '소원의 내용이나 이루고 싶은 날을 바꿀 수 있어요.',
    swPh: '미래의 나에게, 네가 이렇게 되기를…',
    swWhen: '언제 이뤄지길 바라나요?',
    swP1w: '일주일 뒤',
    swP1m: '한 달 뒤',
    swP3m: '세 달 뒤',
    swP6m: '반년 뒤',
    swP1y: '1년 뒤',
    swPlantB: '소원 심기',
    swSaveB: '변경 저장',
    swNeedTx: '먼저 소원을 적어 주세요',
    swNeedTm: '앞으로의 시간을 골라 주세요',
    swLockT: '이루고 싶은 날이 되어서 더는 바꿀 수 없어요.',
    swAt: (a, b) => `${a} (${b})`,
    swFullT: '섬이 가득 찼어요',
    swFull: '섬에 더 심을 자리가 없어요. 꽃을 정리(삭제 또는 파내기)한 뒤에 소원을 빌어 주세요.',
    swPlanted: '소원을 심었어요. 별이 함께 키워 줄 거예요 ✨',
    swListT: '섬의 소원',
    swNone: '아직 소원꽃이 없어요',
    swName: '소원꽃',
    swS0: '새싹',
    swS1: '자라는 중',
    swS2: '활짝 핌',
    swSproutH: h => `아직 새싹이에요. 약 ${h}시간 뒤에 물을 줄 수 있어요`,
    swSproutM: m => `아직 새싹이에요. 약 ${m}분 뒤에 물을 줄 수 있어요`,
    swThirst: '목이 말라요. 물을 주어 키워 주세요',
    swWet: m => `물을 줬어요. 약 ${m}분 뒤에 자라요`,
    swGrowing: '천천히 자라는 중, 소원이 이뤄질 날을 기다려요',
    swBloom: '소원꽃이 활짝 피었어요',
    swTargetL: '이루고 싶은 날',
    swInM: m => `약 ${m}분 뒤`,
    swInH: h => `약 ${h}시간 뒤`,
    swInD: d => `${d}일 뒤`,
    swArrived: '그 날이 되었어요',
    swQ1T: '소원을 향해 잘 나아가고 있나요?',
    swQ1a: '네, 노력하고 있어요',
    swQ1b: '조금씩 나아가고 있어요',
    swQ1c: '아직이지만 다시 시작하고 싶어요',
    swLater: '나중에',
    swR1a: '멋져요! 별이 당신의 노력을 보고 있어요 ✨',
    swR1b: '작은 한 걸음도 소중해요. 천천히 가요.',
    swR1c: '괜찮아요. 지금 시작해도 늦지 않아요 🌱',
    swQ2T: '소원이 이뤄졌나요?',
    swQ2a: '이뤄졌어요 🎉',
    swQ2b: '완전하진 않지만 최선을 다했어요',
    swQ2c: '이번에는 이뤄지지 않았어요',
    swR2a: '축하해요! 소원이 이뤄졌어요 🎉',
    swR2b: '정말 멀리 왔어요. 스스로를 자랑스러워해요.',
    swR2c: '괜찮아요. 노력한 오늘을 미래의 당신이 자랑스러워할 거예요.',
    swRes1: '소원 성취',
    swRes2: '최선을 다함',
    swRes3: '아직',
    swPg2: '노력 중',
    swPg1: '조금 진전',
    swPg0: '다시 시작',
    swAnsB: '소원이 이뤄졌나요?',
    swAnsAgain: '답 바꾸기',
    swDelQ: '이 소원꽃을 삭제할까요? 소원과 모든 데이터가 영구히 지워지며 되돌릴 수 없어요.',
    swShovelQ: '이 소원꽃을 파낼까요? 「시든 꽃의 섬」으로 옮겨지고, 적어 둔 소원은 그대로 남아요.',
    swShoveled: '시든 꽃의 섬으로 옮겼어요',
    swThirstT: n => `소원꽃 ${n}송이가 목말라해요`,
    swG1: '소원꽃이 조금 자랐어요!',
    swG2: '소원꽃이 활짝 피었어요!'
  });

  /* ---------- 位置、形狀與時間規則 ---------- */
  const FAST = /[?&]wishfast=1/.test(location.search),
    WAIT_MS = FAST ? 20e3 : 2 * 36e5, // 種下後多久可以澆水（約 2 小時）
    GROW2_MS = FAST ? 10e3 : 10 * 6e4,
    MIN_MS = FAST ? 6e4 : 3 * 36e5; // 目標至少要在 3 小時之後（要留給「2 小時 + 10 分鐘」的成長時間）         // 澆水後多久長到第二階段（10 分鐘）
  const SX = STAR.x,
    SZ = STAR.z,
    RW = STAR.R,
    ISY = .1,
    FR = .8; // 島的位置、半徑、離地高度；FR＝可以種花的範圍（柵欄內側）
  const rho = a => RW * (1 + .09 * Math.sin(2 * a + 1.1) + .07 * Math.sin(3 * a + .3) + .05 * Math.sin(5 * a + 2.2));
  const hh = (x, z) => .05 * Math.sin(x * 1.2 + .9) * Math.cos(z * 1.05); // 島上微微的起伏（相對於島）
  const gy = (wx, wz) => ISY + hh(wx - SX, wz - SZ); // 世界座標的地面高度
  const OBS = [
    [-1.35, -1.55, .65],
    [1.45, -1.5, .45]
  ]; // 許願石、星星燈柱（不能種花）
  const stageOf = e => {
    const n = Date.now();
    if (!e.wt) return 0;
    return n >= e.tt ? 2 : (n - e.wt >= GROW2_MS) ? 1 : 0
  }; // 沒澆水就一直是幼苗；澆水後，到了實現時間（或已過）才盛開
  const thirstyOf = e => !e.wt && Date.now() - e.pt >= WAIT_MS;
  const waitLeft = e => Math.max(0, e.pt + WAIT_MS - Date.now()),
    growLeft = e => Math.max(0, Math.min(e.wt + GROW2_MS, Math.max(e.tt, e.wt)) - Date.now()); // 澆水後：10 分鐘，或距離實現時間更近就等到那時
  const wids = () => Object.keys(S.w).filter(i => S.w[i] && !S.w[i].sh);
  const wid = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fmtDT = ms => new Date(ms).toLocaleString(LC(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const dfmt = ms => new Date(ms).toLocaleDateString(LC(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const leftTxt = ms => {
    if (ms <= 0) return tr('swArrived');
    const m = Math.ceil(ms / 6e4);
    if (m < 60) return tr('swInM', m);
    const h = Math.ceil(ms / 36e5);
    if (h < 48) return tr('swInH', h);
    return tr('swInD', Math.ceil(ms / 864e5))
  };
  const clip = (s, n) => {
    s = String(s || '');
    return s.length > n ? s.slice(0, n) + '…' : s
  };

  /* 這個位置（島上座標）能不能放花：要在柵欄內側，避開石頭和燈柱，且離別朵花夠遠 */
  function legal(x, z, self, gap) {
    const r = Math.hypot(x, z),
      a = Math.atan2(z, x);
    if (r > rho(a) * FR) return false;
    if (OBS.some(o => Math.hypot(x - o[0], z - o[1]) < o[2])) return false;
    for (const id in S.w) {
      if (id === self) continue;
      const e = S.w[id];
      if (!e || e.sh || e.x === undefined) continue;
      if (Math.hypot(e.x - x, e.z - z) < gap) return false
    }
    return true
  }
  /* 找一個空位來種新花；找不到就回傳 null（＝島上滿了） */
  function freeSpot() {
    const c = [];
    for (let k = 0; k < 44; k++) {
      const a = k / 44 * 6.2832;
      for (let f = .05; f <= 1.001; f += .06) {
        const r = rho(a) * FR * f,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        if (legal(x, z, null, .85)) c.push([x, z])
      }
    }
    if (!c.length) return null;
    const q = c[Math.floor(Math.random() * c.length)];
    return {
      x: q[0],
      z: q[1]
    }
  }

  /* ---------- 小島本體 ---------- */
  const isl = new T.Group();
  isl.position.set(SX, ISY, SZ);
  scene.add(isl);
  const K = window.SKIN || null,
    sway = [];
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
  /* 草地：偏藍綠的柔和草色，邊緣一圈泥土 */
  {
    const KR = 22,
      SG = 72,
      c1 = new T.Color('#8FC4A0'),
      c2 = new T.Color('#B6DCA6'),
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
  /* 柵欄：跟花園同款的木柵欄，柱頭是微微發光的小球（夜裡像一圈小星星） */
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
        emissive: new T.Color('#FFE9A0'),
        emissiveIntensity: .4
      }),
      posts = new T.InstancedMesh(pg, wm(txP), n),
      caps = new T.InstancedMesh(SPH, capM, n),
      rails = new T.InstancedMesh(rg, wm(txR), n * 2),
      o = new T.Object3D(),
      c = new T.Color(),
      cap = ['#FFE9A0', '#F5C7D5', '#D4C7EA'];
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
  /* 五角星的形狀（許願石的星星、燈柱頂端的星星、花朵上空飄的小星星共用） */
  const starShape = (ro, ri) => {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? ri : ro,
        a = Math.PI / 2 + i * Math.PI / 5,
        x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      i ? s.lineTo(x, y) : s.moveTo(x, y)
    }
    s.closePath();
    return s
  };
  const STARG = new T.ExtrudeGeometry(starShape(1, .46), {
    depth: .3,
    bevelEnabled: false
  });
  STARG.translate(0, 0, -.15);
  const STARM = new T.MeshStandardMaterial({
    color: '#FFD866',
    roughness: .45,
    emissive: new T.Color('#FFC53D'),
    emissiveIntensity: .7
  });
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
  /* 許願石：一顆圓潤的大石頭，正面刻著發光的小星星 */
  {
    const g = new T.Group(),
      I = new T.IcosahedronGeometry(1, 0);
    g.add(rock(mk(I, '#D9D2E0', [0, .32, 0], [.58, .44, .5], [.2, .7, 0])), rock(mk(I, '#CFC8D8', [.5, .14, .28], [.26, .18, .22], [.3, .2, .1])));
    const st = new T.Mesh(STARG, STARM);
    st.scale.set(.15, .15, .15);
    st.position.set(0, .38, .46);
    g.add(st);
    g.position.set(OBS[0][0], hh(OBS[0][0], OBS[0][1]), OBS[0][1]);
    g.rotation.y = .25;
    isl.add(g)
  }
  /* 星星燈柱：細細的木柱，頂端有一顆緩緩旋轉、發光的星星 */
  const lamp = {
    star: null,
    gl: null,
    y: 1.72
  };
  {
    const g = new T.Group();
    g.add(rock(mk(new T.IcosahedronGeometry(1, 0), '#CFC8D8', [0, .08, 0], [.2, .12, .2])), mk(CYL, '#C9A27A', [0, .72, 0], [.055, 1.44, .055]), mk(new T.BoxGeometry(1, 1, 1), '#B58B66', [0, 1.2, 0], [.34, .05, .05]));
    const st = new T.Mesh(STARG, STARM);
    st.scale.set(.2, .2, .2);
    st.position.y = lamp.y;
    g.add(st);
    lamp.star = st;
    const gl = halo('#FFE3A0', 1.6, .3);
    gl.position.y = lamp.y;
    g.add(gl);
    lamp.gl = gl;
    g.position.set(OBS[1][0], hh(OBS[1][0], OBS[1][1]), OBS[1][1]);
    isl.add(g);
    sway.push({
      o: g,
      p: .6,
      k: .01,
      ax: 'z'
    })
  }
  /* 地上的小點點（像撒了一把小星星） */
  {
    const r = (s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)(31),
      n = 42,
      tf = new T.InstancedMesh(SPH, new T.MeshStandardMaterial({
        roughness: .8,
        emissive: new T.Color('#ffffff'),
        emissiveIntensity: .15
      }), n),
      o = new T.Object3D(),
      pl = ['#FFF3B0', '#FFFFFF', '#E4D9F6', '#F5C7D5'];
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283,
        d = Math.sqrt(r()) * .9 * rho(a),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d;
      o.position.set(x, hh(x, z) + .07, z);
      o.scale.setScalar(.06 + r() * .04);
      o.updateMatrix();
      tf.setMatrixAt(i, o.matrix);
      tf.setColorAt(i, new T.Color(pl[i % 4]))
    }
    isl.add(tf)
  }
  /* 飄在島上的小光點 */
  const NP = 18,
    tp = new Float32Array(NP * 3),
    tps = [];
  for (let i = 0; i < NP; i++) tps.push({
    a: Math.random() * 6.28,
    r: .3 + Math.random() * 2.7,
    y: Math.random() * 2.4,
    s: .1 + Math.random() * .16,
    p: Math.random() * 6
  });
  const tpg = new T.BufferGeometry();
  tpg.setAttribute('position', new T.BufferAttribute(tp, 3));
  const tpm = new T.PointsMaterial({
    color: '#FFF1B0',
    size: .34,
    map: window.GLOW,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending
  });
  const twk = new T.Points(tpg, tpm);
  twk.frustumCulled = false;
  isl.add(twk);

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
      x.fillStyle = '#F5C542';
      x.strokeStyle = '#E9A92A';
      x.lineWidth = 3;
      x.lineJoin = 'round';
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 13 : 30,
          a = -Math.PI / 2 + i * Math.PI / 5;
        x[i ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * r, 69 + Math.sin(a) * r)
      }
      x.closePath();
      x.fill();
      x.stroke();
      x.fillStyle = '#F5C542';
      [
        [96, 38, 7],
        [34, 44, 5]
      ].forEach(([px, py, s]) => {
        x.beginPath();
        x.moveTo(px, py - s);
        x.lineTo(px + s * .28, py - s * .28);
        x.lineTo(px + s, py);
        x.lineTo(px + s * .28, py + s * .28);
        x.lineTo(px, py + s);
        x.lineTo(px - s * .28, py + s * .28);
        x.lineTo(px - s, py);
        x.lineTo(px - s * .28, py - s * .28);
        x.closePath();
        x.fill()
      })
    }
    const sp = new T.Sprite(new T.SpriteMaterial({
      map: new T.CanvasTexture(c),
      transparent: true,
      depthWrite: false
    }));
    sp.scale.set(.85, .85, 1);
    sp.position.set(0, 2.55, 0);
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
      y: 2.55
    }
  })();
  const hit = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshBasicMaterial({
    visible: false
  }));
  hit.position.set(0, .7, 0);
  hit.scale.set(RW * .92, 1.9, RW * .92);
  isl.add(hit);

  /* ---------- 星願花：三個階段 ---------- */
  const GOLD = new T.MeshStandardMaterial({
      color: '#FFD76A',
      roughness: .5,
      vertexColors: true,
      emissive: new T.Color('#FFB830'),
      emissiveIntensity: .3
    }),
    LAV = new T.MeshStandardMaterial({
      color: '#CDB8F5',
      roughness: .55,
      vertexColors: true,
      emissive: new T.Color('#8F78D6'),
      emissiveIntensity: .22
    }),
    CORE = new T.MeshStandardMaterial({
      color: '#FFF3C0',
      roughness: .4,
      vertexColors: true,
      emissive: new T.Color('#FFD060'),
      emissiveIntensity: .8
    });
  const HH = [.55, .95, 1.45],
    HIT = [
      [.3, .3],
      [.36, .55],
      [.55, .85]
    ]; // 三個階段的莖高、觸控範圍（半徑、高度）
  function petals(h, n, r, y, s, tilt, m, off) {
    for (let i = 0; i < n; i++) {
      const pv = new T.Group();
      pv.rotation.y = i / n * 6.283 + (off || 0);
      pv.position.y = y;
      pv.add(mk(SPH, '#ffffff', [r, 0, 0], s, [0, 0, tilt], m));
      h.add(pv)
    }
  }

  function wishFlower() {
    const W = new T.Group(),
      G = [],
      Hs = [],
      u = W.userData;
    /* 第一階段：幼苗，頂端一顆小小的黃綠色芽 */
    {
      const g = new T.Group(),
        H = HH[0],
        h = new T.Group();
      g.add(mk(CYL, '#8CC27D', [0, H / 2, 0], [.04, H, .04]));
      [1, -1].forEach((s, i) => g.add(mk(SPH, '#9BCF8A', [s * .13, H * .38 + i * .07, 0], [.14, .03, .07], [0, 0, s * .5])));
      h.position.y = H;
      g.add(h);
      h.add(mk(SPH, '#BFE39A', [0, .05, 0], [.1, .13, .1]), mk(SPH, '#FFE9A0', [0, .16, 0], [.045, .06, .045]));
      ring(h, 3, .06, 0, [.08, .02, .035], .8, '#8CC27D');
      G.push(g);
      Hs.push(h)
    }
    /* 第二階段：長高了，頂端是一顆金色的花苞，帶一點淡紫色的尖 */
    {
      const g = new T.Group(),
        H = HH[1],
        h = new T.Group();
      g.add(mk(CYL, '#7DB36F', [0, H / 2, 0], [.05, H, .05]));
      [
        [1, .3],
        [-1, .45],
        [1, .62],
        [-1, .76]
      ].forEach(([s, f], i) => g.add(mk(SPH, '#8CC27D', [s * .2, H * f, 0], [.2, .035, .09], [0, i * 1.2, s * .5])));
      h.position.y = H;
      g.add(h);
      h.add(mk(SPH, '#FFD76A', [0, .15, 0], [.1, .19, .1], null, GOLD), mk(SPH, '#CDB8F5', [0, .33, 0], [.04, .07, .04], null, LAV));
      ring(h, 4, .07, .02, [.06, .17, .04], -.25, '#8CC27D');
      const hl = halo('#FFE9A0', .7, .22);
      hl.position.y = .15;
      h.add(hl);
      u.hl1 = hl;
      G.push(g);
      Hs.push(h)
    }
    /* 第三階段：盛開，五角星形的金色花瓣、淡紫色內瓣、發亮的花心，頭上還飄著一顆小星星 */
    {
      const g = new T.Group(),
        H = HH[2],
        h = new T.Group();
      g.add(mk(CYL, '#7DB36F', [0, H / 2, 0], [.055, H, .055]));
      [
        [1, .22],
        [-1, .34],
        [1, .5],
        [-1, .62]
      ].forEach(([s, f], i) => g.add(mk(SPH, '#8CC27D', [s * .24, H * f, 0], [.26, .04, .1], [0, i * 1.1, s * .45])));
      h.position.y = H;
      h.rotation.x = .5;
      g.add(h);
      petals(h, 5, .25, 0, [.33, .04, .1], 0, GOLD);
      petals(h, 5, .15, .025, [.2, .04, .085], 0, LAV, .628);
      h.add(mk(SPH, '#FFF3C0', [0, .06, 0], [.12, .08, .12], null, CORE));
      const st = new T.Mesh(STARG, STARM);
      st.scale.set(.1, .1, .1);
      st.position.set(0, H + .62, 0);
      g.add(st);
      u.fs = st;
      const hl = halo('#FFE9A0', 1.5, .3);
      hl.position.set(0, H + .04, .02);
      g.add(hl);
      u.hl2 = hl;
      G.push(g);
      Hs.push(h)
    }
    G.forEach(g => W.add(g));
    const hb = new T.Mesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial({
      visible: false
    }));
    W.add(hb);
    Object.assign(u, {
      G,
      Hs,
      hb,
      ph: Math.random() * 6,
      st: 0,
      mo: null
    });
    return W
  }
  /* 凋零小島上的樣子（星願花被鏟除後）：莖垂下去、花瓣變成灰褐色，掉了幾片在地上 */
  function wishWither() {
    const g = new T.Group(),
      H = 1.3,
      bd = .75,
      P0 = [0, 0],
      P1 = [0, H * .85],
      P2 = [bd * .5, H * 1.12],
      P3 = [bd, H * .7],
      N = 5,
      ST = '#8E8556';
    const pt = t => {
      const u = 1 - t;
      return [u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]
    };
    for (let i = 0; i < N; i++) {
      const a = pt(i / N),
        b = pt((i + 1) / N),
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        L = Math.hypot(dx, dy),
        r = .05 - i * .004;
      g.add(mk(CYL, ST, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], [r, L * 1.08, r], [0, 0, -Math.atan2(dx, dy)]))
    }
    [1, -1].forEach((s, i) => g.add(mk(SPH, i ? '#A08A52' : '#8F7A48', [s * .2, H * .22 + i * .16, 0], [.24, .035, .1], [0, 0, -s * .75])));
    const hd = new T.Group();
    hd.position.set(P3[0], P3[1], 0);
    hd.rotation.z = -Math.atan2(P3[0] - P2[0], P3[1] - P2[1]);
    g.add(hd);
    hd.add(mk(SPH, '#7A6A3A', [0, .03, 0], [.1, .06, .1]));
    petals(hd, 5, .2, 0, [.24, .03, .08], .9, null);
    hd.children.forEach((c, i) => {
      if (i) c.children.forEach(m => {
        m.material = mat(i % 2 ? '#B9A86A' : '#A99A5C', true)
      })
    });
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + .5,
        d = .2 + i * .13;
      g.add(mk(SPH, '#B9A86A', [Math.cos(a) * d + bd * .3, .025, Math.sin(a) * d], [.12, .022, .05], [0, i * 1.3, 0]))
    }
    const hb = new T.Mesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial({
      visible: false
    }));
    hb.position.set(bd * .5, H * .5, 0);
    hb.scale.set(.5, H * .55 + .1, .4);
    g.add(hb);
    g.traverse(o => {
      if (o.isMesh) o.castShadow = false
    });
    return g
  }
  /* 小圖示（資訊框、列表、凋零小島的卡片用）：0 幼苗、1 花苞、2 盛開 */
  function wfIcon(s, st) {
    if (st === 0) return SV(s, '<path d="M20 36V22" stroke="#7DB36F" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="13.5" cy="28" rx="6.5" ry="3" fill="#9BCF8A" transform="rotate(-28 13.5 28)"/><ellipse cx="26.5" cy="25" rx="6.5" ry="3" fill="#9BCF8A" transform="rotate(28 26.5 25)"/><ellipse cx="20" cy="17.5" rx="5" ry="6" fill="#BFE39A"/><circle cx="20" cy="13" r="2.2" fill="#FFE9A0"/>');
    if (st === 1) return SV(s, '<path d="M20 37V19" stroke="#7DB36F" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="12.5" cy="30" rx="7" ry="3" fill="#8CC27D" transform="rotate(-30 12.5 30)"/><ellipse cx="27.5" cy="26" rx="7" ry="3" fill="#8CC27D" transform="rotate(30 27.5 26)"/><ellipse cx="20" cy="13" rx="5.6" ry="8.6" fill="#FFD76A"/><path d="M20 4.6l1.6 3.4h-3.2z" fill="#CDB8F5"/><path d="M14.6 17c0-4 2-8 5.4-9.6-1 3-1 7 .4 10.6z" fill="#8CC27D" opacity=".9"/>');
    const pt = Array.from({
      length: 10
    }, (_, i) => {
      const r = i % 2 ? 9 : 17,
        a = -Math.PI / 2 + i * Math.PI / 5;
      return (20 + Math.cos(a) * r).toFixed(1) + ',' + (18 + Math.sin(a) * r).toFixed(1)
    }).join(' ');
    return SV(s, `<path d="M20 36V24" stroke="#7DB36F" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="13" cy="31" rx="6" ry="2.6" fill="#8CC27D" transform="rotate(-28 13 31)"/><ellipse cx="27" cy="30" rx="6" ry="2.6" fill="#8CC27D" transform="rotate(28 27 30)"/><polygon points="${pt}" fill="#FFD76A" stroke="#F0B33A" stroke-width="1.4" stroke-linejoin="round"/><circle cx="20" cy="18" r="4.2" fill="#CDB8F5"/><circle cx="20" cy="18" r="2.2" fill="#FFF3C0"/>`)
  }

  /* ---------- 島上的花 ---------- */
  const wf = {};
  let hovId = null,
    sd = null,
    cardId = null;
  const wpos = e => ({
    x: SX + e.x,
    z: SZ + e.z
  });

  function setGrowW(f, g) {
    const u = f.userData,
      b = u.base,
      a = Math.max(.001, ez(g * 2)) * b;
    f.scale.set(a, a, a);
    const h = Math.max(.001, ez((g - .4) / .6));
    u.Hs.forEach(x => x.scale.setScalar(h))
  }

  function hitFor(f, st) {
    const u = f.userData,
      [r, y] = HIT[st];
    u.hb.position.set(0, y, 0);
    u.hb.scale.set(r, y + .1, r)
  }
  /* 切換階段：anim=true 時，舊階段縮回去、新階段彈出來（還會有星星和小光點） */
  function wStage(f, st, anim) {
    const u = f.userData,
      was = u.st;
    u.st = st;
    hitFor(f, st);
    if (anim && was !== st) {
      u.mo = {
        from: was,
        t: 0
      };
      u.G[st].visible = true;
      u.G[st].scale.setScalar(.001);
      u.G[was].visible = true;
      const p = {
        x: f.position.x,
        y: f.position.y + .6 * u.base,
        z: f.position.z
      };
      burst('spark', p, 6);
      burst('star', p, st === 2 ? 5 : 2);
      sfx('bloom');
      return
    }
    u.mo = null;
    u.G.forEach((g, i) => {
      g.visible = i === st;
      g.scale.setScalar(i === st ? 1 : .001)
    })
  }

  function removeNow(id) {
    const f = wf[id];
    if (!f) return;
    slideDrop('wish:' + id);
    scene.remove(f);
    freeObj(f);
    delete wf[id];
    if (cardId === id && !$('card').hidden) $('card').hidden = true
  }

  function addFlower(id, grow) {
    const e = S.w[id];
    if (!e || e.sh) return;
    if (e.x === undefined) {
      const p = freeSpot() || {
        x: 0,
        z: .4
      };
      e.x = p.x;
      e.z = p.z;
      save()
    }
    if (wf[id]) removeNow(id);
    const f = wishFlower(),
      w = wpos(e);
    f.position.set(w.x, gy(w.x, w.z), w.z);
    f.rotation.y = e.r || 0;
    Object.assign(f.userData, {
      wid: id,
      base: e.s || 1,
      gr: grow ? 1 : 0
    });
    scene.add(f);
    wf[id] = f;
    wStage(f, stageOf(e), false);
    setGrowW(f, grow ? 1 : 0);
    const th = stageOf(e) === 0 && thirstyOf(e);
    setThirst(f, th);
    f.userData.th = th;
    return f
  }
  /* 種下的小動畫：種子落下 → 土洞 → 小光點往上飄 → 花慢慢長出來 */
  const plants = [];

  function plantFx(id) {
    const f = wf[id];
    if (!f) return;
    const hole = mk(CYL, '#7A5A3A', [f.position.x, f.position.y + .01, f.position.z], [.3, .02, .3]),
      seed = mk(SPH, '#5B4A3A', [f.position.x, 3, f.position.z], [.07, .09, .07]);
    scene.add(hole, seed);
    const n = 30,
      ar = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      ar[i * 3] = f.position.x + (Math.random() - .5) * 1.4;
      ar[i * 3 + 1] = f.position.y + Math.random() * 1.8;
      ar[i * 3 + 2] = f.position.z + (Math.random() - .5) * 1.4
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(ar, 3));
    const sp = new T.Points(g, new T.PointsMaterial({
      color: '#FFE9A0',
      size: .4,
      map: window.GLOW,
      blending: T.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    scene.add(sp);
    plants.push({
      id,
      t: 0,
      hole,
      seed,
      sp,
      y: f.position.y,
      bloom: false
    });
    tgG.set(f.position.x, f.position.y + .6, f.position.z);
    radG = 6
  }

  /* ---------- 澆水、提問 ---------- */
  function water(id) {
    const e = S.w[id];
    if (!e || e.sh || !thirstyOf(e)) {
      sfx('deny');
      return false
    }
    e.wt = Date.now();
    save();
    const f = wf[id];
    if (f) {
      setThirst(f, false);
      f.userData.th = false;
      waterFx(f)
    }
    sfx('water', 'plant');
    if (Date.now() < e.tt) toast(tr('swWet', Math.max(1, Math.ceil(growLeft(e) / 6e4))));
    try {
      tick()
    } catch (x) {
      logErr(x)
    }
    if (Date.now() < e.tt) setTimeout(() => askProgress(id), 1500);
    return true
  } // 已過實現時間：澆水後直接盛開，改問「願望實現了嗎」
  /* 簡單的選擇視窗：回傳被選中的選項編號，關掉或選「稍後」則回傳 -1 */
  let qRes = null;

  function choose(o) {
    return new Promise(res => {
      if (qRes) qClose(-1);
      qRes = res;
      $('swqi').innerHTML = o.ic;
      $('swqt').textContent = o.t;
      $('swqd').textContent = o.d || '';
      $('swqo').innerHTML = o.opts.map((x, i) => `<button class="swqb" data-i="${i}">${esc(x)}</button>`).join('');
      $('swql').textContent = o.later;
      $('swq').hidden = false;
      $('card').hidden = true;
      setTimeout(() => {
        try {
          $('swqo').firstChild.focus({
            preventScroll: true
          })
        } catch (e) {
          logErr(e)
        }
      }, 250)
    })
  }

  function qClose(v) {
    if ($('swq').hidden && !qRes) return;
    $('swq').hidden = true;
    const r = qRes;
    qRes = null;
    if (r) r(v)
  }
  async function askProgress(id) {
    const e = S.w[id];
    if (!e || e.sh) return;
    const i = await choose({
      ic: wfIcon(56, 0),
      t: tr('swQ1T'),
      d: '“' + clip(e.tx, 80) + '”',
      opts: [tr('swQ1a'), tr('swQ1b'), tr('swQ1c')],
      later: tr('swLater')
    });
    const e2 = S.w[id];
    if (i < 0 || !e2) return;
    e2.pg = [2, 1, 0][i];
    e2.pgt = Date.now();
    save();
    toast(tr(['swR1a', 'swR1b', 'swR1c'][i]));
    sfx('flower');
    if (cardId === id) card(id)
  }
  async function askAchieve(id) {
    const e = S.w[id];
    if (!e || e.sh) return;
    const i = await choose({
      ic: wfIcon(56, 2),
      t: tr('swQ2T'),
      d: '“' + clip(e.tx, 80) + '”',
      opts: [tr('swQ2a'), tr('swQ2b'), tr('swQ2c')],
      later: tr('swLater')
    });
    const e2 = S.w[id];
    if (i < 0 || !e2) return;
    e2.ach = i + 1;
    e2.at = Date.now();
    save();
    toast(tr(['swR2a', 'swR2b', 'swR2c'][i]));
    const f = wf[id];
    if (f && i < 2) {
      const p = {
        x: f.position.x,
        y: f.position.y + 1.1 * f.userData.base,
        z: f.position.z
      };
      burst('star', p, i === 0 ? 10 : 4);
      burst('heart', p, i === 0 ? 5 : 2);
      burst('spark', p, 6)
    }
    sfx(i === 0 ? 'bloom' : 'flower');
    if (cardId === id && !$('card').hidden) card(id)
  }

  /* ---------- 資訊框（跟其他花共用同一個卡片） ---------- */
  const SHOVEL = '<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="currentColor" aria-hidden="true" style="vertical-align:-.25em;flex:none"><g transform="rotate(35 12 12)"><rect x="10.9" y="1.8" width="2.2" height="11" rx="1.1"/><rect x="8.2" y="1.8" width="7.6" height="2.3" rx="1.15"/><path d="M7.2 12.4h9.6v3.4c0 3.1-2.1 5.7-4.8 6.9-2.7-1.2-4.8-3.8-4.8-6.9z"/></g></svg>';
  const resChip = e => e.ach ? `<span>${['🎉','💪','🌱'][e.ach-1]} ${esc(tr('swRes'+e.ach))}</span>` : '',
    pgChip = e => e.pg != null ? `<span>💧 ${esc(tr('swPg'+e.pg))}</span>` : '';

  function card(id) {
    const e = S.w[id];
    if (!e || e.sh) return;
    show('garden');
    cardId = id;
    const f = wf[id];
    if (f) {
      tgG.set(f.position.x, f.position.y + .8, f.position.z);
      radG = 5
    }
    const st = stageOf(e),
      c = $('card'),
      n = Date.now(),
      rows = [];
    if (st === 0) rows.push(e.wt ? '💧 ' + tr('swWet', Math.max(1, Math.ceil(growLeft(e) / 6e4))) : thirstyOf(e) ? '💧 ' + tr('swThirst') : '🌱 ' + (waitLeft(e) >= 36e5 ? tr('swSproutH', Math.ceil(waitLeft(e) / 36e5)) : tr('swSproutM', Math.max(1, Math.ceil(waitLeft(e) / 6e4)))));
    else if (st === 1) rows.push('🌿 ' + tr('swGrowing'));
    else rows.push('🌟 ' + tr('swBloom'));
    rows.push('⏳ ' + tr('swTargetL') + ' · ' + fmtDT(e.tt) + (st < 2 ? ' (' + leftTxt(e.tt - n) + ')' : ''));
    const bt = (i, cls, ico, lb) => `<button class="btn${cls?' '+cls:''}" id="${i}" aria-label="${esc(lb)}" title="${esc(lb)}">${ico}</button>`;
    c.hidden = false;
    c.innerHTML = `<div style="font-size:12px;opacity:.7">${esc(tr('wiPlant'))} ${esc(fmt(dk(new Date(e.pt))))}</div>
<h2 style="display:flex;align-items:center;gap:8px"><span style="display:inline-flex">${wfIcon(36,st)}</span><span>${esc(tr('swName'))}</span></h2>
<div style="font-size:13px;opacity:.8">${esc(tr('swS'+st))}</div>
<div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:12px;opacity:.75;margin-top:4px">${rows.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
<p>“${esc(e.tx)}”</p><div class="chips">${resChip(e)}${pgChip(e)}</div>
<div style="display:flex;gap:8px;margin-top:12px">${st===0&&thirstyOf(e)?bt('wcw','w',ic('water_drop'),tr('waterB')):''}${st===2?(e.ach?bt('wca','p',ic('published_with_changes'),tr('swAnsAgain')):`<button class="btn p" id="wca">${ic('stars')} ${esc(tr('swAnsB'))}</button>`):''}${bt('wce','',ic('edit'),tr('edit'))}${bt('wcr','',ic('rotate_right'),tr('gRotB'))}${bt('wcs','',SHOVEL,tr('wShovel'))}${bt('wcd','r',ic('delete'),tr('delete'))}<button class="btn" id="wcx" style="margin-left:auto" aria-label="${esc(tr('close'))}" title="${esc(tr('close'))}">${ic('close')}</button></div>`;
    $('wcx').onclick = () => {
      c.hidden = true
    };
    if ($('wcw')) $('wcw').onclick = () => {
      if (water(id)) card(id)
    };
    if ($('wca')) $('wca').onclick = () => askAchieve(id);
    $('wce').onclick = () => openPanel(id);
    $('wcr').onclick = () => rotate(id);
    $('wcs').onclick = async () => {
      if (await ask(tr('swShovelQ'), tr('shovelB'))) shovel(id)
    };
    $('wcd').onclick = async () => {
      if (await ask(tr('swDelQ'), tr('delete'))) del(id)
    }
  }
  /* 旋轉：每按一次轉 45 度（帶緩動），角度存在 S.w[id].r，會隨花一起同步 */
  function rotate(id) {
    const e = S.w[id];
    if (!e) return;
    const f = wf[id],
      TP = Math.PI * 2,
      u = f && f.userData,
      cur = u ? (u.ryT != null ? u.ryT : f.rotation.y) : (e.r || 0),
      nx = cur + Math.PI / 4;
    if (u) {
      u.ryT = nx;
      if (S.rm) f.rotation.y = nx
    }
    e.r = ((nx % TP) + TP) % TP;
    save();
    sfx('rotate', 'click')
  }
  /* 刪除：這朵花的願望和所有資料一起清除（也會同步刪除雲端的） */
  function del(id) {
    sfx('delete');
    removeNow(id);
    delete S.w[id];
    save();
    $('card').hidden = true;
    home();
    toast(tr('removed'));
    if (!$o.hidden) renderPanel()
  }
  /* 鏟除：跟其他凋零的花一樣，只是把花搬到凋零小島，願望都還在 */
  function shovel(id) {
    const e = S.w[id];
    if (!e || e.sh) return;
    const f = wf[id];
    e.sh = Date.now();
    save();
    if (f) {
      const p = f.position;
      delete wf[id];
      slideDrop('wish:' + id);
      if (S.rm) {
        scene.remove(f);
        freeObj(f)
      } else {
        SHV.push({
          f,
          t: 0,
          y0: p.y,
          s0: f.scale.x
        });
        debris(p.x, p.y + .05, p.z, ['#8A6A47', '#6F5238', '#9B7B55'], 12, {
          s: .045,
          v: .7,
          up: 2.2,
          g: 7,
          life: 1.4
        })
      }
    }
    sfx('delete', 'move');
    $('card').hidden = true;
    home();
    toast(tr('swShoveled'));
    try {
      window.WI && WI.refresh()
    } catch (x) {
      logErr(x)
    }
  }

  /* ---------- 移動（佈置花園模式）：只能在這座島上 ---------- */
  const rc = new T.Raycaster(),
    mv2 = new T.Vector2();

  function ray(e) {
    mv2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rc.setFromCamera(mv2, cam)
  }
  let pdist = Infinity;

  function pickId(e) {
    pdist = Infinity;
    const list = [];
    for (const id in wf) {
      const u = wf[id].userData;
      list.push(u.hb);
      if (u.dp) list.push(u.dp)
    }
    if (!list.length) return null;
    ray(e);
    const h = rc.intersectObjects(list, false)[0];
    if (!h) return null;
    pdist = h.distance;
    let o = h.object;
    while (o && !(o.userData && o.userData.wid)) o = o.parent;
    return o ? o.userData.wid : null
  }

  function ground(e) {
    ray(e);
    const o = rc.ray.origin,
      d = rc.ray.direction;
    if (d.y > -.01) return null;
    let k = -(o.y - ISY) / d.y,
      x = o.x + d.x * k,
      z = o.z + d.z * k;
    const k2 = (gy(x, z) - o.y) / d.y;
    return {
      x: o.x + d.x * k2,
      z: o.z + d.z * k2
    }
  }

  function back(id, o) {
    const f = wf[id];
    if (!f || !o) return;
    slideDrop('wish:' + id);
    const to = new T.Vector3(SX + o.x, gy(SX + o.x, SZ + o.z), SZ + o.z);
    if (S.rm) {
      f.position.copy(to);
      return
    }
    slides.push({
      d: 'wish:' + id,
      o: f,
      fr: f.position.clone(),
      to,
      t: 0
    })
  }

  function down(e) {
    if (!arrange) return false;
    const id = pickId(e),
      f = id && wf[id],
      en = id && S.w[id];
    if (!f || !en) return false;
    slideDrop('wish:' + id);
    hovId = null;
    sd = {
      id,
      dm: 0,
      ok: true,
      o: {
        x: en.x,
        z: en.z
      }
    };
    selRing.material.color.set('#F29BB5');
    selRing.visible = true;
    selRing.position.set(f.position.x, f.position.y + .05, f.position.z);
    return true
  }

  function move(e, quiet) {
    if (!sd) return;
    const f = wf[sd.id];
    if (!f) return;
    const q = ground(e);
    let x = f.position.x - SX,
      z = f.position.z - SZ,
      sky = true;
    if (q) {
      x = q.x - SX;
      z = q.z - SZ;
      sky = false
    }
    sd.ok = !sky && legal(x, z, sd.id, .6); /* 島外、石頭或燈柱上、別朵花上都不行 */
    const y = gy(SX + x, SZ + z);
    f.position.set(SX + x, y + (sd.ok ? 0 : .3), SZ + z);
    if (!quiet) sd.dm++;
    sd.x = x;
    sd.z = z;
    selRing.position.set(SX + x, y + .05, SZ + z);
    selRing.material.color.set(sd.ok ? '#F29BB5' : '#E8685F')
  }

  function up() {
    const x = sd;
    sd = null;
    selRing.visible = false;
    if (!x) return;
    const f = wf[x.id],
      e = S.w[x.id];
    if (!f || !e) return;
    if (x.dm > 2 && x.ok) {
      e.x = x.x;
      e.z = x.z;
      f.position.y = gy(SX + e.x, SZ + e.z);
      save();
      sfx('move');
      toast(tr('moved'))
    } else {
      back(x.id, x.o);
      camBack();
      if (x.dm > 2) {
        sfx('deny');
        toast(tr('badSpot'))
      }
    }
  }

  function cancel() {
    const x = sd;
    sd = null;
    selRing.visible = false;
    if (x) back(x.id, x.o)
  }

  /* ---------- 寫願望的視窗 ---------- */
  const css = document.createElement('style');
  css.textContent = `
#swo{z-index:21;background:rgba(70,72,120,.34);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px)}
.sws{width:min(560px,100%);max-height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);max-height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 20px);display:flex;flex-direction:column;border-radius:26px;padding:12px;background:linear-gradient(#8C93D2,#A89BD8);box-shadow:0 18px 40px rgba(48,44,100,.4),inset 0 0 0 2px rgba(255,255,255,.3);animation:swin .5s cubic-bezier(.2,.9,.3,1.1) both}
.swh{flex:none;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:2px 10px;padding:4px 10px 10px;color:#fff;text-shadow:0 1px 3px rgba(40,36,90,.4)}
.swh h2{font-size:22px;display:flex;align-items:center;gap:6px}.swh span{font-size:13px;opacity:.92}
.swb{flex:1;min-height:0;display:flex;flex-direction:column;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:18px;padding:16px 16px 8px;background:#FBF8FF;box-shadow:inset 0 3px 10px rgba(60,50,120,.22);color:#5B4A6A}
.swd{font-size:14px;line-height:1.55;opacity:.85;margin-bottom:10px}
.swb textarea{height:88px;border-color:#DDD3F0;display:block;max-width:100%}
.sws,.swb,.swb *{min-width:0}.swb{overflow-x:hidden;overflow-wrap:anywhere}
.swin{display:block;max-width:100%;-webkit-appearance:none;appearance:none;min-height:42px}.swin::-webkit-date-and-time-value{text-align:left}
.swb .tags{max-width:100%}
.swtab{min-width:0;flex-wrap:wrap;gap:2px 4px;line-height:1.25;text-align:center;white-space:normal}
@media(max-width:420px){.sws{padding:8px;border-radius:22px}.swb{padding:12px 12px 6px}.swtab{font-size:12.5px;padding:7px 4px}.swtab>.ms{display:none}.swh h2{font-size:19px}}
.swtop{flex:none}
.swtabs{flex:none;display:flex;gap:4px;background:#EEE8FA;border-radius:99px;padding:3px;margin:12px 0 8px}
.swtab{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 6px;border-radius:99px;font-size:13.5px;font-weight:700;transition:background .25s,box-shadow .25s}
.swtab .ms{font-size:18px;vertical-align:0}.swtab span:last-child{font-size:11.5px;opacity:.6}
.swtab[aria-pressed=true]{background:#fff;box-shadow:0 2px 8px rgba(60,50,120,.16)}
.swlw{flex:1 1 auto;min-height:150px;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;margin:0 -8px;padding:2px 8px 10px}
.swp{display:block;cursor:pointer}.swp .swr{display:flex;align-items:center;gap:10px}.swp .swr>span:first-child{flex:none;display:inline-flex}.swp .swr>span:nth-child(2){flex:1;min-width:0}
.swpd{display:none;margin-top:8px;padding-top:8px;border-top:1px dashed #E4DAF5}.swp.open .swpd{display:grid;gap:6px}.swpd small{font-size:12px;opacity:.7;line-height:1.5}.swpd .chips{display:flex;gap:6px;flex-wrap:wrap}.swgo{justify-self:start;padding:6px 12px;font-size:13px}
.swp.open b{white-space:normal;word-break:break-word}
.swl{display:flex;align-items:center;gap:6px;font-weight:700;font-size:14px;margin:12px 0 6px}
.swb .tags{margin:4px 0 8px}.swb .tag[aria-pressed=true]{background:#F6E7A8;border-color:#E9C75A}
.swin{width:100%;border:2px solid #DDD3F0;border-radius:16px;padding:9px 12px;font:inherit;font-size:16px;color:inherit;background:#fff}.swin:disabled{opacity:.55}
.swdd{display:block;margin-top:6px;font-size:12.5px;opacity:.7;min-height:1.4em}.swdd.bad{opacity:1;color:#C0564B;font-weight:700}
.swfull{text-align:center;padding:22px 12px;background:#FFF4DC;border-radius:16px;border:2px dashed #EBCB7A}.swfull b{display:block;font:600 18px Fredoka,Nunito,sans-serif;margin-bottom:6px}.swfull p{font-size:14px;line-height:1.6}
.swlist{display:grid;gap:8px}.swnone{font-size:13px;opacity:.6;text-align:center;padding:8px}
.swi{display:flex;align-items:center;gap:10px;text-align:left;padding:9px 12px;background:#fff;border-radius:16px;box-shadow:0 3px 10px rgba(60,50,120,.1);transition:transform .2s}.swi:hover{transform:translateY(-1px)}
.swi>span:first-child{flex:none;display:inline-flex}.swi>span:nth-child(2){flex:1;min-width:0}.swi b{display:block;font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.swi small{display:block;font-size:12px;opacity:.65}
.swi i{flex:none;font-style:normal;font-size:11.5px;background:#F6E7A8;border-radius:99px;padding:2px 9px}
.swf{flex:none;display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:10px 6px 2px}.swf .btn.p{background:#F2B93B}
#swq{z-index:22;background:rgba(70,72,120,.38)}
.swqs{width:min(380px,100%);text-align:center;background:#FBF8FF;border-radius:28px;padding:22px 20px 16px;box-shadow:var(--sh);animation:swin .4s cubic-bezier(.2,.9,.3,1.1) both}
.swqs h2{font-size:21px;margin:8px 0 4px}.swqs p{font-size:14px;opacity:.75;line-height:1.5;font-style:italic;margin-bottom:12px;word-break:break-word}
.swqo{display:grid;gap:8px}.swqb{padding:11px 14px;border-radius:99px;background:#fff;border:2px solid #E4DAF5;font-weight:700;font-size:15px;transition:transform .2s,background .2s}.swqb:hover{background:#F6E7A8;border-color:#E9C75A;transform:translateY(-1px)}
#swql{margin-top:10px;font-size:13px;opacity:.65;padding:6px 12px}
@keyframes swin{from{opacity:0;transform:translateY(24px) scale(.94)}}
@media(prefers-reduced-motion:reduce){.sws,.swqs{animation:none}}body.rm .sws,body.rm .swqs{animation:none}
/* ===== 液態玻璃改版 ===== */
#swo,#swq{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}#swo{background:rgba(70,72,120,.28)}
.sws{border-radius:32px;padding:14px;background:radial-gradient(120% 80% at 8% 0%,rgba(255,255,255,.5),rgba(255,255,255,0) 55%),linear-gradient(rgba(192,196,240,.52),rgba(208,192,238,.44));-webkit-backdrop-filter:blur(26px) saturate(175%) brightness(1.05);backdrop-filter:blur(26px) saturate(175%) brightness(1.05);border:1px solid rgba(255,255,255,.62);box-shadow:0 20px 50px rgba(48,44,100,.32),0 2px 6px rgba(48,44,100,.12),inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 -1.5px 2px rgba(255,255,255,.28),inset 0 0 28px rgba(255,255,255,.14)}
.swh{align-items:center;padding:4px 6px 8px;color:#403A78;text-shadow:0 1px 0 rgba(255,255,255,.55)}
.swh h2{font-size:23px}.swh span{font-size:12.5px;padding:4px 12px;border-radius:99px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 1px 1px rgba(255,255,255,.9);opacity:1}
.swb{border-radius:24px;padding:16px 16px 8px;color:#4F4570;background:linear-gradient(rgba(255,255,255,.64),rgba(250,246,255,.50));border:1px solid rgba(255,255,255,.65);box-shadow:inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 0 20px rgba(255,255,255,.16)}
.swtabs{background:rgba(255,255,255,.36);border:1px solid rgba(255,255,255,.6);box-shadow:inset 0 2px 5px rgba(80,70,140,.12)}
.swtab[aria-pressed=true]{background:rgba(255,255,255,.9);box-shadow:0 3px 10px rgba(60,50,120,.18),inset 0 1.5px 1px #fff}
.swi{border-radius:18px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.85);box-shadow:0 4px 14px rgba(60,50,120,.10),inset 0 1.5px 1px rgba(255,255,255,.95)}
.swin,.swb textarea{background:rgba(255,255,255,.78);border-color:rgba(200,190,235,.7)}
.swb .tag{background:rgba(255,255,255,.72);border-color:rgba(255,255,255,.85)}
.swfull{background:rgba(255,244,220,.72);border:1px solid rgba(235,203,122,.6)}
.swpd{border-top:1px solid rgba(150,130,200,.22)}
#swq{background:rgba(70,72,120,.34)}
.swqs{border-radius:30px;background:radial-gradient(120% 80% at 8% 0%,rgba(255,255,255,.5),rgba(255,255,255,0) 55%),rgba(255,255,255,.68);-webkit-backdrop-filter:blur(26px) saturate(175%) brightness(1.05);backdrop-filter:blur(26px) saturate(175%) brightness(1.05);border:1px solid rgba(255,255,255,.7);box-shadow:0 18px 44px rgba(48,44,100,.28),inset 0 1.5px 1px rgba(255,255,255,.95),inset 0 -1.5px 2px rgba(255,255,255,.28),inset 0 0 28px rgba(255,255,255,.14)}
.swqb{background:rgba(255,255,255,.78);border-color:rgba(255,255,255,.9)}
.swf .btn.p{background:rgba(242,185,59,.95)}
@media(max-width:420px){.sws{padding:10px;border-radius:26px}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.sws{background:#C9C6EC}.swqs{background:#FBF8FF}}
@media(prefers-reduced-transparency:reduce){.sws{background:#D2CEF0;-webkit-backdrop-filter:none;backdrop-filter:none}.swqs{background:#FBF8FF;-webkit-backdrop-filter:none;backdrop-filter:none}}
`;
  document.head.appendChild(css);
  document.body.insertAdjacentHTML('beforeend', `<div class="scrim" id="swo" hidden><div class="sws" role="dialog" aria-modal="true" id="sws"><div class="swh"><h2 id="swh"></h2><span id="swn"></span></div><div class="swb" id="swb"></div><div class="swf"><button class="btn" id="swx"></button><button class="btn p" id="swp" data-sfx="off"></button></div></div></div>
<div class="scrim" id="swq" hidden><div class="swqs" role="dialog" aria-modal="true"><div id="swqi" style="display:grid;place-items:center"></div><h2 id="swqt"></h2><p id="swqd"></p><div class="swqo" id="swqo"></div><button class="btn" id="swql" style="box-shadow:none;background:none"></button></div></div>`);
  const $o = $('swo'),
    $b = $('swb'),
    $p = $('swp'),
    $x = $('swx');
  $('swq').addEventListener('click', e => {
    const b = e.target.closest('.swqb');
    if (b) {
      qClose(+b.dataset.i);
      return
    }
    if (e.target === $('swq') || e.target.closest('#swql')) qClose(-1)
  });
  let mode = null,
    presetK = null,
    tab = 'now';
  const PRESETS = [
    ['swP1w', n => {
      n.setDate(n.getDate() + 7)
    }],
    ['swP1m', n => {
      n.setMonth(n.getMonth() + 1)
    }],
    ['swP3m', n => {
      n.setMonth(n.getMonth() + 3)
    }],
    ['swP6m', n => {
      n.setMonth(n.getMonth() + 6)
    }],
    ['swP1y', n => {
      n.setFullYear(n.getFullYear() + 1)
    }]
  ];
  const loc = d => {
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes())
  };
  const isPast = e => !!(e && (e.sh || Date.now() >= e.tt));
  const pastIds = () => Object.keys(S.w).filter(i => isPast(S.w[i])).sort((a, b) => (S.w[b].sh || S.w[b].tt) - (S.w[a].sh || S.w[a].tt));

  function activeItem(id) {
    const e = S.w[id],
      st = stageOf(e);
    return `<button class="swi" data-id="${id}"><span>${wfIcon(30,st)}</span><span><b>${esc(e.tx)}</b><small>${esc(tr('swS'+st))} · ${esc(tr('swTargetL'))} ${esc(dfmt(e.tt))}</small></span>${e.ach?`<i>${esc(tr('swRes'+e.ach))}</i>`:''}</button>`
  }

  function pastItem(id) {
    const e = S.w[id],
      chips = resChip(e) + pgChip(e);
    return `<div class="swi swp" data-id="${id}" role="button" tabindex="0" aria-expanded="false"><div class="swr"><span>${wfIcon(30,2)}</span><span><b>${esc(e.tx)}</b><small>${esc(tr('swTargetL'))} · ${esc(dfmt(e.tt))}</small></span>${e.sh?`<i>${esc(tr('swDug'))}</i>`:e.ach?`<i>${esc(tr('swRes'+e.ach))}</i>`:''}</div>
<div class="swpd">${chips?`<div class="chips">${chips}</div>`:''}<small>${esc(tr('wiPlant'))} ${esc(dfmt(e.pt))}　${esc(tr('swTargetL'))} ${esc(dfmt(e.tt))}${e.sh?'　'+esc(tr('wiShov'))+' '+esc(dfmt(e.sh)):''}</small>${e.sh?'':`<button class="btn swgo" data-id="${id}">${ic('local_florist')} ${esc(tr('mbVisit'))}</button>`}</div></div>`
  }
  /* 兩個列表一次只顯示一個：「島上的願望」（還在島上的花）、「曾經的願望」（實現時間到了的，以及被鏟除的，鏟除後也還在） */
  function listHTML() {
    if (tab === 'past') {
      const ids = pastIds();
      return ids.length ? `<div class="swlist">${ids.map(pastItem).join('')}</div>` : `<p class="swnone">${esc(tr('swNonePast'))}</p>`
    }
    const ids = wids().sort((a, b) => S.w[a].pt - S.w[b].pt);
    return ids.length ? `<div class="swlist">${ids.map(activeItem).join('')}</div>` : `<p class="swnone">${esc(tr('swNone'))}</p>`
  }

  function renderPanel(fresh) {
    const edit = mode && S.w[mode] && !S.w[mode].sh ? S.w[mode] : null,
      full = !edit && !freeSpot(),
      lock = !!edit && Date.now() >= edit.tt,
      nAct = wids().length,
      keepTx = !fresh && $('swt') ? $('swt').value : null,
      keepDt = !fresh && $('swdt') ? $('swdt').value : null,
      sc = !fresh && $('swlw') ? $('swlw').scrollTop : 0;
    $('sws').setAttribute('aria-label', tr('swT'));
    $('swh').innerHTML = ic('auto_awesome') + ' ' + esc(tr(edit ? 'swEditT0' : 'swT'));
    $('swn').textContent = tr('swSub', nAct);
    $x.innerHTML = ic('close') + ' ' + esc(tr('close'));
    $p.innerHTML = ic('star') + ' ' + esc(tr(edit ? 'swSaveB' : 'swPlantB'));
    $p.hidden = full;
    let h = '<div class="swtop">';
    if (full) h += `<div class="swfull"><b>${esc(tr('swFullT'))}</b><p>${esc(tr('swFull'))}</p></div>`;
    else h += `<p class="swd">${esc(tr(edit?'swEditD':'swHint'))}</p><textarea id="swt" maxlength="300" placeholder="${esc(tr('swPh'))}"></textarea>
<div class="swl">${ic('schedule')} ${esc(tr('swWhen'))}</div>${lock?`<p class="swd">${esc(tr('swLockT'))}</p>`:`<div class="tags" id="swc">${PRESETS.map(([k])=>`<button class="tag" data-k="${k}" aria-pressed="${presetK===k}">${esc(tr(k))}</button>`).join('')}</div>`}
<input type="datetime-local" class="swin" id="swdt" ${lock?'disabled':''}><small class="swdd" id="swdd"></small>`;
    h += '</div>';
    if (!edit) h += `<div class="swtabs" role="tablist"><button class="swtab" data-tab="now" role="tab" aria-pressed="${tab==='now'}">${ic('local_florist')} ${esc(tr('swTabNow'))} <span>${nAct}</span></button><button class="swtab" data-tab="past" role="tab" aria-pressed="${tab==='past'}">${ic('history')} ${esc(tr('swTabPast'))} <span>${pastIds().length}</span></button></div><div class="swlw" id="swlw">${listHTML()}</div>`;
    $b.innerHTML = h;
    if ($('swlw')) $('swlw').scrollTop = sc;
    if (!full) {
      const t = $('swt'),
        d = $('swdt');
      t.value = keepTx != null ? keepTx : (edit ? edit.tx : '');
      d.min = loc(new Date(Date.now() + MIN_MS));
      if (keepDt) d.value = keepDt;
      else if (edit) d.value = loc(new Date(edit.tt));
      else {
        const q = new Date();
        q.setMonth(q.getMonth() + 1);
        d.value = loc(q)
      }
      const cap = () => {
        const ms = new Date(d.value).getTime(),
          bad = !isNaN(ms) && !lock && ms < Date.now() + MIN_MS && !(edit && ms === edit.tt);
        $('swdd').textContent = isNaN(ms) ? '' : bad ? tr('swTooSoon') : tr('swAt', fmtDT(ms), leftTxt(ms - Date.now()));
        $('swdd').classList.toggle('bad', bad)
      };
      cap();
      d.oninput = () => {
        presetK = null;
        $b.querySelectorAll('#swc .tag').forEach(b => b.setAttribute('aria-pressed', 'false'));
        cap()
      };
      if ($('swc')) $('swc').onclick = ev => {
        const b = ev.target.closest('.tag');
        if (!b) return;
        const p = PRESETS.find(x => x[0] === b.dataset.k),
          q = new Date();
        p[1](q);
        presetK = b.dataset.k;
        d.value = loc(q);
        $b.querySelectorAll('#swc .tag').forEach(x => x.setAttribute('aria-pressed', x === b));
        cap()
      }
    }
    if (fresh) $b.scrollTop = 0
  }
  I18N.add('en', {
    swEditT0: 'Edit wish'
  });
  I18N.add('zh', {
    swEditT0: '編輯願望'
  });
  I18N.add('ja', {
    swEditT0: '願いを編集'
  });
  I18N.add('ko', {
    swEditT0: '소원 수정'
  });
  $b.addEventListener('click', e => {
    const tb = e.target.closest('.swtab');
    if (tb) {
      tab = tb.dataset.tab;
      $b.querySelectorAll('.swtab').forEach(x => x.setAttribute('aria-pressed', x === tb));
      $('swlw').innerHTML = listHTML();
      $('swlw').scrollTop = 0;
      sfx('click');
      return
    }
    const go = e.target.closest('.swgo');
    if (go) {
      visit(go.dataset.id);
      return
    }
    const pp = e.target.closest('.swp');
    if (pp) {
      const o = pp.classList.toggle('open');
      pp.setAttribute('aria-expanded', o);
      return
    }
    const b = e.target.closest('.swi');
    if (b) visit(b.dataset.id)
  });
  $b.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.swp')) {
      e.preventDefault();
      e.target.click()
    }
  });

  function visit(id) {
    const e = S.w[id];
    if (!e) return;
    closePanel(false);
    if (e.sh) {
      try {
        WI.open()
      } catch (x) {
        logErr(x)
      }
    } else card(id)
  }

  function submit() {
    const edit = mode && S.w[mode] && !S.w[mode].sh ? S.w[mode] : null,
      t = $('swt'),
      d = $('swdt');
    if (!t || !d) return;
    const tx = t.value.trim();
    if (!tx) {
      toast(tr('swNeedTx'));
      sfx('deny');
      return
    }
    let tt = new Date(d.value).getTime();
    if (edit && (Date.now() >= edit.tt || tt === edit.tt)) tt = edit.tt;
    else if (isNaN(tt)) {
      toast(tr('swNeedTm'));
      sfx('deny');
      return
    } else if (tt < Date.now() + MIN_MS) {
      toast(tr('swTooSoon'));
      sfx('deny');
      return
    } // 3 小時內的目標不行：花要先經過 2 小時 + 10 分鐘才會長大
    if (edit) {
      edit.tx = tx;
      edit.tt = tt;
      save();
      closePanel(false);
      card(mode);
      toast(tr('updated'));
      return
    }
    const sp = freeSpot();
    if (!sp) {
      renderPanel();
      sfx('deny');
      toast(tr('swFull'));
      return
    }
    const id = wid();
    S.w[id] = {
      id,
      tx,
      pt: Date.now(),
      tt,
      x: sp.x,
      z: sp.z,
      s: +(.95 + Math.random() * .2).toFixed(3),
      r: +(Math.random() * 6.28).toFixed(3)
    };
    save();
    sfx('plant');
    closePanel(false);
    show('garden');
    addFlower(id, 0);
    plantFx(id);
    toast(tr('swPlanted'))
  }
  $p.onclick = submit;
  const anyOverlay = () => ['rvm', 'mbo', 'wio', 'swo', 'swq', 'modal', 'dlg', 'gmod', 'hmo', 'nmo'].some(k => {
    const el = document.getElementById(k);
    return el && !el.hidden
  });

  function openPanel(editId) {
    if (anyOverlay() && $o.hidden) return;
    mode = editId || null;
    presetK = null;
    tab = 'now';
    renderPanel(true);
    $o.hidden = false;
    $('card').hidden = true;
    tgG.set(SX, .4, SZ + .2);
    radG = Math.min(radG, 14);
    try {
      sfx('island')
    } catch (e) {
      logErr(e)
    }
    setTimeout(() => {
      try {
        ($('swt') || $x).focus({
          preventScroll: true
        })
      } catch (e) {
        logErr(e)
      }
    }, 350)
  }

  function closePanel(goHome) {
    $o.hidden = true;
    if (goHome && typeof home === 'function')(typeof homeSoft === 'function' ? homeSoft() : home())
  }
  $x.onclick = () => closePanel(true);
  $o.addEventListener('pointerdown', e => {
    if (e.target === $o) closePanel(true)
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('swq').hidden) qClose(-1);
    else if (!$o.hidden) closePanel(true)
  });

  /* ---------- 點擊偵測 ---------- */
  function pick(e) {
    try {
      if (pickId(e)) return true;
      if (typeof arrange !== 'undefined' && arrange) {
        hint.hov = false;
        return false
      }
      ray(e);
      const h = rc.intersectObject(hit, false).length > 0;
      hint.hov = h;
      hovT = performance.now();
      return h
    } catch (err) {
      return false
    }
  }

  function click(e) {
    try {
      const id = pickId(e);
      if (id) {
        sfx('flower');
        card(id);
        return true
      }
      if (typeof arrange !== 'undefined' && arrange) return false;
      ray(e);
      if (rc.intersectObject(hit, false).length) {
        openPanel();
        return true
      }
    } catch (err) {
      logErr(err)
    }
    return false
  }
  /* 回報命中距離給 input.js 比較：星願花 tight（精準）、島的大範圍 loose（寬鬆），沒點到回傳 null */
  function dist(e) {
    try {
      if (pickId(e)) return {
        d: pdist,
        tight: true
      };
      if (typeof arrange !== 'undefined' && arrange) return null;
      ray(e);
      const r = rc.intersectObject(hit, false)[0];
      return r ? {
        d: r.distance,
        tight: false
      } : null
    } catch (err) {
      return null
    }
  }
  const cv0 = $('c');
  cv0.addEventListener('pointermove', e => {
    if (e.buttons || sd) return;
    try {
      hovId = pickId(e)
    } catch (x) {
      hovId = null
    }
  });
  cv0.addEventListener('pointerleave', () => {
    hovId = null
  });

  /* ---------- 每一幀 ---------- */
  let T0 = performance.now(),
    sh = false,
    hovT = 0,
    tickT = 0,
    promptT = 6,
    asked = new Set();
  SLP.cbs.push(() => {
    if (sh) {
      sh = false;
      T0 = performance.now();
      requestAnimationFrame(step)
    }
  });
  /* 沒有其他視窗開著、也沒有在拖東西的時候，才會主動跳出問題 */
  const idle = () => {
    try {
      if (typeof giftReady === 'function' && !giftReady()) return false
    } catch (e) {
      logErr(e)
    }
    return !anyOverlay() && $('card').hidden && !sd
  };

  function tick() {
    let nt = 0;
    for (const id in wf) {
      const f = wf[id],
        u = f.userData,
        e = S.w[id];
      if (!e || e.sh) continue;
      const st = stageOf(e);
      if (st !== u.st && !u.mo && !plants.some(q => q.id === id)) {
        wStage(f, st, true);
        if (!anyOverlay()) toast(tr(st === 2 ? 'swG2' : 'swG1'))
      }
      const th = st === 0 && thirstyOf(e);
      setThirst(f, th);
      if (th && !u.th) nt++;
      u.th = th
    }
    if (nt && !anyOverlay()) toast(tr('swThirstT', nt))
  }

  function promptTick() {
    if (!idle()) return;
    for (const id of wids()) {
      const e = S.w[id];
      if (stageOf(e) === 2 && !e.ach && !asked.has(id)) {
        asked.add(id);
        const f = wf[id];
        if (f) {
          tgG.set(f.position.x, f.position.y + .8, f.position.z);
          radG = 5
        }
        askAchieve(id).then(() => {
          if ($('card').hidden && $o.hidden && !sd) home()
        });
        return
      }
    }
  }

  function step(now) {
    if (SLP.on) {
      sh = true;
      return
    }
    requestAnimationFrame(step);
    const dt = Math.min(.05, (now - T0) / 1000);
    T0 = now;
    if (dt <= 0) return;
    let rm = false,
      wind = .3;
    try {
      rm = !!S.rm;
      wind = WX.wind || 0
    } catch (e) {
      logErr(e)
    }
    const t = now / 1000,
      w = .5 + wind * 1.1,
      night = 1 - (window.dfv == null ? 1 : window.dfv);
    tickT -= dt;
    if (tickT <= 0) {
      tickT = 2.5;
      try {
        tick()
      } catch (e) {
        logErr(e)
      }
    }
    promptT -= dt;
    if (promptT <= 0) {
      promptT = 3;
      try {
        promptTick()
      } catch (e) {
        logErr(e)
      }
    }
    /* 星星燈柱、發光的小東西 */
    CORE.emissiveIntensity = .7 + .2 * Math.sin(t * 2.1) + .25 * night;
    GOLD.emissiveIntensity = .28 + .25 * night;
    LAV.emissiveIntensity = .2 + .2 * night;
    STARM.emissiveIntensity = .6 + .35 * night + (rm ? 0 : .12 * Math.sin(t * 2.4));
    lamp.gl.material.opacity = .2 + .3 * night + (rm ? 0 : .05 * Math.sin(t * 2.4));
    if (!rm) {
      sway.forEach(s => {
        const v = Math.sin(t * (1 + w * .5) + s.p) * s.k * w;
        if (s.ax === 'z') s.o.rotation.z = v;
        else s.o.rotation.x = v
      });
      lamp.star.rotation.y = t * .8;
      lamp.star.position.y = lamp.y + Math.sin(t * 1.6) * .05;
      hint.sp.position.y = hint.y + Math.sin(t * 1.5 + .4) * .06;
      hint.sp.material.rotation = Math.sin(t * .9) * .1
    }
    for (let i = 0; i < NP; i++) {
      const p = tps[i];
      if (!rm) p.y += dt * p.s;
      if (p.y > 2.7) {
        p.y = .05;
        p.a = Math.random() * 6.28;
        p.r = .3 + Math.random() * 2.7
      }
      const q = p.a + Math.sin(t * .5 + p.p) * .3,
        x = Math.cos(q) * p.r + (rm ? 0 : Math.sin(t * 1.1 + p.p) * .18),
        z = Math.sin(q) * p.r;
      tp[i * 3] = x;
      tp[i * 3 + 1] = Math.max(hh(x, z) + .05, p.y);
      tp[i * 3 + 2] = z
    }
    tpg.attributes.position.needsUpdate = true;
    tpm.opacity = (.3 + .45 * night) * (rm ? .85 : .8 + .2 * Math.sin(t * 1.7));
    if (hint.hov && now - hovT > 400) hint.hov = false;
    const hv = hint.hov ? 1.18 : 1;
    hint.sp.scale.x += (.85 * hv - hint.sp.scale.x) * .15;
    hint.sp.scale.y = hint.sp.scale.x;
    hint.gl.material.opacity = .07 + (rm ? 0 : .02 * Math.sin(t * 1.6)) + (hint.hov ? .05 : 0);
    hint.gl.position.y = hint.sp.position.y;
    /* 種花動畫 */
    for (let i = plants.length - 1; i >= 0; i--) {
      const q = plants[i],
        f = wf[q.id];
      if (!f) {
        scene.remove(q.hole, q.seed, q.sp);
        plants.splice(i, 1);
        continue
      }
      q.t += rm ? dt * 8 : dt;
      f.userData.gr = Math.min(1, Math.max(0, (q.t - 1.2) / 3));
      setGrowW(f, f.userData.gr);
      q.seed.visible = q.t < 1.1;
      q.seed.position.y = Math.max(.05, 2 - q.t * 2.2) + q.y;
      const a = q.sp.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) a.setY(k, a.getY(k) + dt * .4);
      a.needsUpdate = true;
      q.sp.material.opacity = Math.max(0, Math.min(1, (q.t - .9) * 2, (5 - q.t)));
      if (q.t > 3.9 && !q.bloom) {
        q.bloom = true;
        sfx('bloom')
      }
      if (q.t > 5) {
        scene.remove(q.hole, q.seed, q.sp);
        plants.splice(i, 1);
        setGrowW(f, 1);
        f.userData.gr = 1;
        if (!sd && !anyOverlay() && $('card').hidden) radG = Math.min(64, radG * 1.75)
      }
    }
    /* 每朵花 */
    for (const id in wf) {
      const f = wf[id],
        u = f.userData;
      if (u.ryT != null) {
        const df = u.ryT - f.rotation.y;
        if (rm || Math.abs(df) < .002) f.rotation.y = u.ryT;
        else f.rotation.y += df * Math.min(1, dt * 12)
      }
      if (u.mo) {
        u.mo.t += rm ? dt * 8 : dt / 1.5;
        const x = Math.min(1, u.mo.t),
          xa = Math.max(0, (x - .2) / .8),
          ob = 1 + 2.70158 * Math.pow(xa - 1, 3) + 1.70158 * Math.pow(xa - 1, 2);
        u.G[u.mo.from].scale.setScalar(Math.max(.001, 1 - ez(Math.min(1, x * 3))));
        u.G[u.st].scale.setScalar(Math.max(.001, xa > 0 ? ob : .001));
        if (x >= 1) {
          u.G[u.mo.from].visible = false;
          u.G[u.mo.from].scale.setScalar(.001);
          u.G[u.st].scale.setScalar(1);
          u.mo = null
        }
      }
      if (!rm) {
        f.rotation.z = Math.sin(t * (1 + w * .5) + u.ph) * .03 * w;
        u.Hs.forEach((h, i) => {
          h.rotation.z = Math.sin(t * (1.4 + w * .6) + u.ph) * .045 * w
        });
        if (u.fs) {
          u.fs.rotation.y = t * 1.1 + u.ph;
          u.fs.position.y = HH[2] + .62 + Math.sin(t * 1.8 + u.ph) * .06
        }
        if (u.dp) u.dp.position.y = 1.25 + .07 * Math.sin(t * 3 + u.ph)
      }
      const pulse = rm ? 1 : .9 + .1 * Math.sin(t * 2 + u.ph);
      if (u.hl1) u.hl1.material.opacity = (.18 + .2 * night) * pulse;
      if (u.hl2) u.hl2.material.opacity = (.26 + .3 * night) * pulse;
      if (u.gr >= 1 && !(sd && sd.id === id) && !plants.some(q => q.id === id)) {
        const s = u.base * (hovId === id ? 1.12 : 1);
        f.scale.x += (s - f.scale.x) * .15;
        f.scale.y += (s - f.scale.y) * .15;
        f.scale.z = f.scale.x
      }
    }
  }
  requestAnimationFrame(step);

  /* ---------- 對外的小介面（主程式、同步、凋零小島會用到） ---------- */
  function syncFlowers() {
    for (const id in wf) {
      const e = S.w[id];
      if (!e || e.sh) removeNow(id)
    }
    for (const id of wids())
      if (!wf[id]) addFlower(id, 1)
  }
  window.SI = {
    pick,
    click,
    dist,
    down,
    move,
    up,
    cancel,
    dragging: () => !!sd,
    visit,
    icon: wfIcon,
    dfmt,
    past: pastIds,
    /* 曾經的願望（回憶佈告欄也用這份） */
    sig() {
      return pastIds().map(i => '|w' + i + (S.w[i].sh || 0) + (S.w[i].ach || 0) + (S.w[i].pg == null ? '' : S.w[i].pg)).join('')
    },
    /* 同步：雲端傳來一朵花的新狀態 */
    onApply(id, old, o) {
      if (o.sh) {
        removeNow(id);
        try {
          WI.refresh()
        } catch (e) {
          logErr(e)
        }
        return
      }
      if (old && old.sh) {
        addFlower(id, 1);
        try {
          WI.refresh()
        } catch (e) {
          logErr(e)
        }
        return
      }
      const f = wf[id];
      if (f && old) {
        const ks = new Set([...Object.keys(old), ...Object.keys(o)]);
        ks.delete('r');
        ks.delete('u');
        let same = true;
        for (const k of ks)
          if (JSON.stringify(old[k]) !== JSON.stringify(o[k])) {
            same = false;
            break
          }
        if (same) {
          const u = f.userData,
            TP = Math.PI * 2,
            cur = u.ryT != null ? u.ryT : f.rotation.y;
          let df = ((((o.r || 0) - cur) % TP) + TP) % TP;
          if (df > Math.PI) df -= TP;
          u.ryT = cur + df;
          if (S.rm) f.rotation.y = u.ryT;
          return
        }
      }
      addFlower(id, 1)
    },
    onDrop(id) {
      removeNow(id)
    },
    refresh() {
      try {
        syncFlowers();
        if (!$o.hidden) renderPanel()
      } catch (e) {
        logErr(e)
      }
    },
    clearVisual() {
      for (const id in wf) removeNow(id);
      try {
        WI.refresh()
      } catch (e) {
        logErr(e)
      }
      if (!$o.hidden) renderPanel()
    },
    /* 凋零小島上的星願花 */
    witherModel: () => wishWither(),
    noteHTML(id, i) {
      const e = S.w[id];
      if (!e) return '';
      const chips = [resChip(e), pgChip(e)].join('');
      return `<article class="win" style="--i:${Math.min(i,12)}"><div class="wii">${wfIcon(38,2)}<span><b>${esc(tr('swName'))}</b><small>${esc(tr('swTargetL'))} · ${esc(fmtDT(e.tt))}</small></span></div>
<p class="wiq" role="button" tabindex="0" aria-expanded="false">“${esc(e.tx)}”</p>${chips?`<div class="wit">${chips.replace(/<span>/g,'<i>').replace(/<\/span>/g,'</i>')}</div>`:''}
<div class="wid2">${esc(tr('wiPlant'))}　${esc(dfmt(e.pt))}<br>${esc(tr('swTargetL'))}　${esc(dfmt(e.tt))}<br>${esc(tr('wiShov'))}　${esc(dfmt(e.sh))}</div></article>`
    }
  };
  /* 開機：把資料裡的星願花擺到島上，再請凋零小島重新整理（裡面可能有被鏟除的星願花） */
  try {
    syncFlowers()
  } catch (e) {
    logErr(e)
  }
  try {
    window.WI && WI.refresh()
  } catch (e) {
    logErr(e)
  }
})();
