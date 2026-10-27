/* ============================================================================
 * js/gifts.js — 小動物的禮物：紙條與裝飾品
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・系統每天抽 0–2 份禮物，由花園裡的小動物送來；打開可能是一張紙條
 *     （GNOTES，每種語言 50 張），也可能是一件小裝飾品。
 *   ・裝飾品（DECOR 登錄表）可放進花園、在「佈置花園」模式拖曳、收藏，並有圖
 *     鑑；3D 小模型全部用基本形狀拼成。
 *   ・資料存在 S.g（只存本機，不進 Google 雲端），對外以 window.GF 提供
 *     （step、pickGift、pickDecor、mrg…）。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、flower-care.js、garden-scene.js、camera.js、
 *   creatures.js、weather.js、particles.js
 * 提供給其他檔案：GF、DEC、GIFTP、giveGift
 * 載入順序：第 19 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- 小動物的禮物：紙條與裝飾品 ----------
   系統每天抽 0–2 份禮物，在花園裡有小動物時，由其中一隻「送」來（頻率與動物數量無關）。
   禮物是一份小盒子：點開可能是一張紙條，也可能是一件小裝飾品。
   裝飾品可以放進花園、用「佈置花園」拖曳移動，或隨時收藏起來。
   資料存在 S.g（只存在這台裝置的瀏覽器，不會進 Google 雲端同步）。 */
window.GF=(function(){
const GNOTES={
zh:[
'今天的風很舒服呢，你今天過得好嗎？',
'我剛剛在花園發現一朵新花，想跟你分享！',
'偷偷告訴你，今天的陽光暖暖的，很適合發呆一下。',
'你有喝水嗎？記得照顧好自己喔。',
'我在花瓣上躺了一會兒，覺得世界都慢下來了。',
'不管今天過得怎麼樣，花園都會在這裡等你。',
'剛剛有一朵雲長得像棉花糖，你有看到嗎？',
'你今天有吃到什麼好吃的東西嗎？',
'這座小小的花園，是因為有你才這麼漂亮。',
'先深呼吸一下，再慢慢吐氣。我在這裡陪你。',
'我今天走了好遠的路，終於回到這裡休息了。',
'如果今天有點累，讓自己慢一點也沒關係。',
'我聽到花朵們在小聲聊天，好像在說你的名字。',
'路邊的小草今天也很努力長高，你也是！',
'你知道嗎？每一朵花，都是從一個小小的心情長出來的。',
'今天有什麼小小的開心事嗎？我很想聽。',
'我撿到一顆圓圓的小石頭，它看起來好像在對我微笑。',
'今晚的星星，一定也會偷偷看著你的花園。',
'慢慢來，花也不是一天就長大的。',
'你今天有對自己溫柔一點嗎？',
'我在花園繞了一圈，大家都很平安喔！',
'空氣聞起來好清新，要不要出去走一走？',
'我今天學到一件事：發呆也是一種休息。',
'謝謝你每天來看我們，我們都很開心。',
'如果你現在心情不太好，我可以安靜地陪你坐一會兒。',
'我剛剛躲在花叢下面休息，涼涼的好舒服。',
'今天的你，已經做得很好了。',
'悄悄話：我最喜歡早晨的露珠了，亮晶晶的。',
'有空的話，也看一眼天空吧，雲正在慢慢散步呢。',
'我追著一片花瓣跑，結果一路跑到你的花園來了。',
'睡前把周圍的吵鬧調小一點，讓心也好好休息。',
'這裡的花都有自己的小脾氣，不過都很可愛。',
'今天有人對你笑了嗎？沒有的話，我先笑給你看。',
'我在籬笆旁看到彩虹的影子，說不定是為你出現的。',
'有時候什麼都不做，也是很棒的選擇。',
'我把今天的好心情，分一點給你。',
'你種下的每一朵花，我都記得。',
'外面的世界很大，但這座小花園永遠有你的位置。',
'你今天笑了幾次呢？我偷偷在數喔。',
'安靜聽一下，有沒有聽到風吹過花瓣的聲音？',
'下雨天也沒關係，花兒最喜歡被雨水親親了。',
'如果有煩惱，可以先放在花園裡，我們幫你看著。',
'我找到一個超舒服的小角落，下次帶你去看。',
'今天的你，比昨天多了一點點勇氣喔。',
'要不要伸個懶腰？我先來，呼～',
'我試著用花瓣寫字，可是風一吹就把字吹跑了。',
'外面有好多忙碌的事，但你停下來看花的樣子，真的很棒。',
'謝謝你，讓我今天有地方可以散步。',
'一天裡最棒的時刻，說不定就是現在。',
'送你一個看不見的擁抱，收到了嗎？',
'我在這裡等你的下一朵花，不急，慢慢來。',
'晚安先說在前面：今天辛苦了。',
'看著你的花園一天比一天熱鬧，我也覺得好幸福。',
'有些心情說不出口也沒關係，花會替你說。'
],
en:[
'The wind feels so nice today. How has your day been?',
'I just found a new flower in the garden and wanted to share it with you!',
'Secret: the sun is warm today. A perfect time for a little daydream.',
'Have you had some water? Take good care of yourself.',
'I lay on a petal for a while, and the whole world slowed down.',
'No matter how today goes, the garden will be here waiting for you.',
'One cloud looked just like a marshmallow. Did you see it?',
'Have you eaten something yummy today?',
'This little garden is so pretty because of you.',
'Take a deep breath, then let it out slowly. I\'m right here with you.',
'I walked a long way today and finally made it back here to rest.',
'If you\'re tired today, it\'s okay to go a little slower.',
'I heard the flowers whispering. I think they said your name.',
'The little grass is working hard to grow tall today. So are you!',
'Did you know? Every flower grows from one small feeling.',
'Anything small and happy today? I\'d love to hear it.',
'I found a perfectly round pebble. It looks like it\'s smiling at me.',
'The stars tonight will be peeking at your garden, I just know it.',
'Take your time. Flowers don\'t grow up in a day either.',
'Have you been gentle with yourself today?',
'I made a lap around the garden. Everyone is safe and sound!',
'The air smells so fresh. Maybe take a little walk outside?',
'I learned something new today: daydreaming counts as resting.',
'Thank you for visiting us every day. It makes us so happy.',
'If you\'re feeling down, I can sit quietly beside you for a while.',
'I hid under the flowers for a bit. It was cool and so comfy.',
'You\'ve already done well today.',
'A whisper: my favorite thing is the morning dew. It sparkles!',
'Take a peek at the sky if you can. The clouds are out for a stroll.',
'I chased a petal and ended up right here in your garden.',
'Before bed, turn down a little noise so your heart can rest too.',
'Every flower here has its own little temper, but they\'re all adorable.',
'Did anyone smile at you today? If not, I\'ll smile first.',
'I spotted the shadow of a rainbow by the fence. Maybe it came for you.',
'Sometimes doing nothing at all is a wonderful choice.',
'I\'m sharing a bit of my good mood with you.',
'I remember every flower you\'ve planted.',
'The world is big, but there\'s always a spot for you in this little garden.',
'How many times did you smile today? I\'ve been counting secretly.',
'Listen quietly. Can you hear the wind brushing the petals?',
'Rainy days are fine. Flowers love getting kissed by the rain.',
'If something is worrying you, leave it in the garden. We\'ll watch over it.',
'I found a very cozy corner. I\'ll show you next time.',
'You have a tiny bit more courage than yesterday.',
'Want to stretch? I\'ll go first. Hmmm~',
'I tried writing with a petal, but the wind blew my words away.',
'There\'s so much busyness out there, but you stopped to look at flowers. That\'s lovely.',
'Thank you for giving me a place to wander today.',
'Maybe the best moment of the day is this very one.',
'Here\'s an invisible hug. Did it arrive?',
'I\'ll be waiting for your next flower. No rush at all.',
'Good night, in advance: you did great today.',
'Watching your garden get livelier every day makes me happy too.',
'Some feelings are hard to say out loud. The flowers can say them for you.'
],
ja:[
'今日は風がとても気持ちいいね。今日はどんな一日だった？',
'さっき庭で新しいお花を見つけたよ。あなたにも教えたくて！',
'ひみつだけど、今日は日差しがぽかぽか。少しぼんやりするのにぴったりだよ。',
'お水は飲んだ？ 自分をいたわってね。',
'花びらの上でごろんとしたら、世界がゆっくりになったよ。',
'今日がどんな日でも、庭はここで待っているよ。',
'マシュマロみたいな雲があったよ。見た？',
'今日はおいしいものを食べた？',
'この小さな庭がきれいなのは、あなたがいるからだよ。',
'ゆっくり息を吸って、ゆっくり吐いてみて。そばにいるよ。',
'今日はたくさん歩いて、やっとここに帰ってきて休んでるところ。',
'疲れている日は、ゆっくりでも大丈夫だよ。',
'お花たちが小さな声でおしゃべりしてたよ。あなたの名前を呼んでいたみたい。',
'道ばたの草も、今日もがんばって背をのばしてるよ。あなたもね！',
'知ってる？ お花はぜんぶ、小さな気持ちから育つんだよ。',
'今日、ちいさなうれしいことはあった？ 聞かせてほしいな。',
'まんまるの小石を見つけたよ。にっこり笑っているみたい。',
'今夜は星たちも、あなたの庭をこっそりのぞいているはず。',
'ゆっくりでいいよ。お花だって一日では大きくならないもの。',
'今日は自分にやさしくできた？',
'庭をひとまわりしてきたよ。みんな元気だった！',
'空気がとてもすがすがしいよ。ちょっとお散歩してみない？',
'今日おぼえたこと：ぼんやりするのも、立派な休けいなんだって。',
'毎日会いに来てくれてありがとう。みんな、とってもうれしいよ。',
'気分が沈んでいるなら、しばらく静かにそばにいるね。',
'お花のかげで少し休んだよ。ひんやりして気持ちよかった。',
'今日のあなたは、もうじゅうぶんがんばってるよ。',
'こっそり教えるね。朝つゆがいちばん好き。きらきらしてるんだ。',
'できたら空もちょっと見てみて。雲がのんびりお散歩中だよ。',
'花びらを追いかけていたら、あなたの庭に来ちゃった。',
'寝る前は、すこしだけ静かにして、心も休ませてあげてね。',
'ここのお花はそれぞれ気まぐれだけど、みんなかわいいんだ。',
'今日、だれかに笑いかけてもらえた？ まだなら、わたしが先に笑うね。',
'柵のそばで虹のかげを見かけたよ。あなたのために出たのかも。',
'なにもしないのも、すてきな選択だよ。',
'今日のいい気分を、ちょっとだけおすそわけ。',
'あなたが植えたお花は、ぜんぶおぼえているよ。',
'世界は広いけれど、この小さな庭にはいつもあなたの場所があるよ。',
'今日は何回笑った？ こっそり数えてるんだ。',
'耳をすませてみて。風が花びらをなでる音が聞こえる？',
'雨の日もだいじょうぶ。お花は雨のキスが大好きなんだ。',
'心配ごとがあるなら、庭に置いていって。みんなで見ているから。',
'とても居心地のいい場所を見つけたよ。今度案内するね。',
'昨日のあなたより、ほんの少しだけ勇気が増えているよ。',
'のびをしてみない？ わたしが先にやるね。うーん～',
'花びらで文字を書いてみたけど、風にとばされちゃった。',
'世の中はいそがしいけど、立ち止まってお花を見るあなたはすてきだよ。',
'今日お散歩できる場所をくれて、ありがとう。',
'一日でいちばんいい時間は、きっと今この瞬間だよ。',
'見えないハグをおくるね。とどいたかな？',
'次のお花を待ってるよ。あせらなくていいからね。',
'おやすみの前に言っておくね。今日もおつかれさま。',
'あなたの庭が日ごとににぎやかになっていくのを見ると、わたしもうれしいよ。',
'言葉にできない気持ちは、お花が代わりに伝えてくれるよ。'
],
ko:[
'오늘은 바람이 참 기분 좋네요. 오늘 하루는 어땠어요?',
'방금 정원에서 새로운 꽃을 발견했어요. 같이 보고 싶었어요!',
'비밀인데요, 오늘은 햇살이 따뜻해요. 잠깐 멍 때리기 딱 좋아요.',
'물은 마셨어요? 스스로를 잘 챙겨 주세요.',
'꽃잎 위에 잠깐 누웠더니 세상이 천천히 흘러가는 것 같았어요.',
'오늘이 어떤 하루였든, 정원은 여기서 기다리고 있을게요.',
'마시멜로처럼 생긴 구름이 있었어요. 봤어요?',
'오늘 맛있는 거 먹었어요?',
'이 작은 정원이 예쁜 건 당신이 있기 때문이에요.',
'숨을 깊게 들이쉬고, 천천히 내쉬어 봐요. 옆에 있을게요.',
'오늘 먼 길을 걸어서 이제야 여기로 돌아와 쉬고 있어요.',
'오늘 피곤하다면 천천히 가도 괜찮아요.',
'꽃들이 작게 속닥이는 소리를 들었어요. 당신 이름을 말하는 것 같았어요.',
'길가의 풀도 오늘 열심히 키를 키우고 있어요. 당신도요!',
'알고 있나요? 꽃은 모두 작은 마음 하나에서 자라나요.',
'오늘 작고 기쁜 일이 있었나요? 듣고 싶어요.',
'동글동글한 조약돌을 주웠어요. 웃고 있는 것 같아요.',
'오늘 밤엔 별들도 몰래 당신의 정원을 들여다볼 거예요.',
'천천히 해도 돼요. 꽃도 하루 만에 크지는 않잖아요.',
'오늘은 스스로에게 다정했나요?',
'정원을 한 바퀴 돌고 왔어요. 다들 잘 지내고 있어요!',
'공기가 정말 상쾌해요. 잠깐 산책해 보는 건 어때요?',
'오늘 새로 배운 게 있어요. 멍하니 있는 것도 쉬는 거래요.',
'매일 찾아와 줘서 고마워요. 우리 모두 정말 기뻐요.',
'기분이 가라앉아 있다면, 잠시 조용히 곁에 앉아 있을게요.',
'꽃 그늘 아래에서 잠깐 쉬었어요. 시원하고 편안했어요.',
'오늘의 당신은 이미 충분히 잘했어요.',
'속닥속닥, 저는 아침 이슬이 제일 좋아요. 반짝반짝하거든요.',
'괜찮다면 하늘도 한 번 올려다봐요. 구름이 천천히 산책 중이에요.',
'꽃잎을 쫓아가다 보니 당신의 정원까지 오게 됐어요.',
'자기 전에는 소음을 조금 줄이고 마음도 쉬게 해 주세요.',
'여기 꽃들은 저마다 성격이 있지만 다 사랑스러워요.',
'오늘 누가 당신에게 웃어 줬나요? 아직이라면 제가 먼저 웃을게요.',
'울타리 옆에서 무지개 그림자를 봤어요. 당신을 위해 나타났을지도 몰라요.',
'아무것도 하지 않는 것도 멋진 선택이에요.',
'오늘의 좋은 기분을 조금 나눠 줄게요.',
'당신이 심은 꽃은 하나하나 다 기억하고 있어요.',
'세상은 넓지만, 이 작은 정원에는 언제나 당신 자리가 있어요.',
'오늘 몇 번 웃었어요? 몰래 세어 보고 있어요.',
'조용히 귀 기울여 봐요. 바람이 꽃잎을 스치는 소리가 들리나요?',
'비 오는 날도 괜찮아요. 꽃은 빗방울 뽀뽀를 좋아해요.',
'걱정거리가 있다면 정원에 두고 가요. 우리가 지켜볼게요.',
'아주 아늑한 구석을 찾았어요. 다음에 알려 줄게요.',
'어제의 당신보다 아주 조금 더 용기가 생겼어요.',
'기지개 켜 볼까요? 제가 먼저 할게요. 으음~',
'꽃잎으로 글씨를 써 봤는데 바람에 날아가 버렸어요.',
'세상엔 바쁜 일이 많지만, 멈춰서 꽃을 보는 당신이 참 좋아요.',
'오늘 산책할 곳이 되어 줘서 고마워요.',
'하루 중 가장 좋은 순간은 어쩌면 지금일지도 몰라요.',
'보이지 않는 포옹을 보낼게요. 받았나요?',
'다음 꽃을 기다리고 있을게요. 서두르지 않아도 돼요.',
'잘 자요, 미리 말해 둘게요. 오늘도 수고했어요.',
'당신의 정원이 날마다 북적여 가는 걸 보면 저도 행복해요.',
'말로 하기 어려운 마음은 꽃이 대신 전해 줄 거예요.'
]};
const T={
en:{gb:'Little gifts',gEmpty:'Animals sometimes leave little gifts in the garden. Decorations you receive will be kept here.',gIn:'In the garden',gKept:'Collected',gPick:'Collect',gPut:'Place',gOk:'Got it',gFrom:w=>'A note from '+w,
 gn:{bee:'a little bee',bird:'a little chick',ladybug:'a ladybug',butterfly:'a butterfly',snail:'a snail'},giftT:w=>'A gift from '+w+'!',
 gGot:n=>'You got: '+n+'!',gPlaceNow:'Place in garden',gKeepB:'Keep for later',gPlaced:'Placed in the garden',gStored:'Collected',gNoSpot:'No room to place it. Try collecting something first.',
 gDeco:'Garden decoration',gHint:'Collect it, rotate it, or use Arrange to drag it somewhere else.',gStoreB:'Collect',gMoveB:'Move',gRotB:'Rotate',gDex:'Gift Collection',gDexSum:(a,b)=>'Discovered '+a+' / '+b,gLocked:'Not found yet',gLockedHint:'Maybe an animal friend will bring it to the garden someday.',gNew:'NEW',gTotal:'Owned',gStoreOne:'Collect one',gBack:'Back to collection',gFirst:'New entry in your collection!',gHave:n=>'You now have '+n,
 },
zh:{gb:'小禮物',gEmpty:'小動物有時會在花園裡留下小禮物，收到的裝飾品會收在這裡。',gIn:'在花園裡',gKept:'收藏中',gPick:'收藏',gPut:'放置',gOk:'收下了',gFrom:w=>w+'送來的紙條',
 gn:{bee:'小蜜蜂',bird:'小雞',ladybug:'瓢蟲',butterfly:'蝴蝶',snail:'蝸牛'},giftT:w=>w+'在花園裡留下了一份小禮物！',
 gGot:n=>'收到了「'+n+'」！',gPlaceNow:'放進花園',gKeepB:'先收藏',gPlaced:'已放進花園',gStored:'已收藏',gNoSpot:'附近沒有空位可以放，先收藏幾個再試試吧。',
 gDeco:'花園裝飾',gHint:'可以收藏、旋轉，或進入佈置模式拖曳移動。',gStoreB:'收藏',gMoveB:'移動',gRotB:'旋轉',gDex:'禮物圖鑑',gDexSum:(a,b)=>'已發現 '+a+' / '+b+' 種',gLocked:'還沒收到過',gLockedHint:'也許哪天，某隻小動物會把它帶來花園。',gNew:'NEW',gTotal:'共擁有',gStoreOne:'收藏一個',gBack:'回到圖鑑',gFirst:'圖鑑新增一種！',gHave:n=>'你現在有 '+n+' 個了',
 },
ja:{gb:'小さなプレゼント',gEmpty:'動物たちが、ときどき庭に小さなプレゼントを置いていきます。もらった飾りはここに保管されます。',gIn:'庭に置いてある',gKept:'保管中',gPick:'しまう',gPut:'置く',gOk:'ありがとう',gFrom:w=>w+'からのメモ',
 gn:{bee:'ミツバチ',bird:'ひよこ',ladybug:'てんとう虫',butterfly:'チョウ',snail:'カタツムリ'},giftT:w=>w+'からの小さなプレゼントが届きました！',
 gGot:n=>'「'+n+'」をもらいました！',gPlaceNow:'庭に置く',gKeepB:'とっておく',gPlaced:'庭に置きました',gStored:'しまいました',gNoSpot:'置ける場所がありません。先にひとつしまってみてください。',
 gDeco:'庭の飾り',gHint:'しまう・回転するほか、配置モードでドラッグして動かせます。',gStoreB:'しまう',gMoveB:'動かす',gRotB:'回転',gDex:'プレゼント図鑑',gDexSum:(a,b)=>a+' / '+b+' 種類を発見',gLocked:'まだ見つけていません',gLockedHint:'いつか動物たちが庭に届けてくれるかもしれません。',gNew:'NEW',gTotal:'所持数',gStoreOne:'ひとつしまう',gBack:'図鑑にもどる',gFirst:'図鑑に新しく追加されました！',gHave:n=>'これで '+n+' 個になりました',
 },
ko:{gb:'작은 선물',gEmpty:'동물들이 가끔 정원에 작은 선물을 놓고 가요. 받은 장식은 여기에 보관돼요.',gIn:'정원에 있음',gKept:'보관 중',gPick:'보관',gPut:'놓기',gOk:'고마워요',gFrom:w=>w+'의 쪽지',
 gn:{bee:'꿀벌',bird:'병아리',ladybug:'무당벌레',butterfly:'나비',snail:'달팽이'},giftT:w=>w+'의 작은 선물이 도착했어요!',
 gGot:n=>'「'+n+'」을(를) 받았어요!',gPlaceNow:'정원에 놓기',gKeepB:'나중에',gPlaced:'정원에 놓았어요',gStored:'보관했어요',gNoSpot:'놓을 자리가 없어요. 먼저 하나를 보관해 보세요.',
 gDeco:'정원 장식',gHint:'보관하거나 돌릴 수 있고, 배치 모드에서 끌어 옮길 수도 있어요.',gStoreB:'보관',gMoveB:'옮기기',gRotB:'회전',gDex:'선물 도감',gDexSum:(a,b)=>a+' / '+b+'종 발견',gLocked:'아직 받지 못했어요',gLockedHint:'언젠가 동물 친구가 정원에 가져다줄지도 몰라요.',gNew:'NEW',gTotal:'보유',gStoreOne:'하나 보관',gBack:'도감으로',gFirst:'도감에 새로 추가됐어요!',gHave:n=>'이제 '+n+'개를 가지고 있어요',
 }};
for(const k in T)I18N.add(k,T[k]);

/* ---- 小圖示（跟花朵圖示一樣用 SVG 手繪） ---- */
const dIcon=(k,s)=>SV(s,ICO[k]||'');

/* ---- 3D 小模型（全部用基本形狀拼出來，每件都小小的） ---- */
const BOXG=shade(new THREE.BoxGeometry(1,1,1),.78),PYR=shade(new THREE.ConeGeometry(.7071,1,4),.8),TRI=shade(new THREE.CylinderGeometry(1,1,1,3),.85),CYLT=shade(new THREE.CylinderGeometry(.6,1,1,14),.8);
const WARM=new THREE.MeshStandardMaterial({color:'#FFD98A',emissive:new THREE.Color('#FFB84A'),emissiveIntensity:.8,roughness:.6});
const bx=(g,geo,c,x,y,z,sx,sy,sz,rx,ry,rz)=>{const m=mk(geo,c,[x,y,z],[sx,sy,sz],[rx||0,ry||0,rz||0]);g.add(m);return m};
/* ==========================================================================
   裝飾品登錄表（DECOR）——新增裝飾品只要在清單「最後面」貼一個區塊，其他地方都不用改
   圖鑑、進度條、抽禮物、放置、拖曳、旋轉、收藏、雲端同步都會自動跟著清單走。

   欄位：
     k    英文代號（小寫字母）。會存進使用者的存檔與雲端，上線後【不能改名、不能刪除、不能調換順序】
     r    佔地半徑（約 .2 小物件 ～ .5 大物件），用來避免和花、其他裝飾品重疊
     n    四種語言的名稱 { zh, en, ja, ko }
     ico  圖鑑用的圖示：40×40 的 SVG 內容（不含 <svg> 外框）
     m    3D 模型 m(g){…}：把基本形狀加進群組 g，底面貼在 y=0；常用工具：
            bx(g, 形狀, 顏色, x,y,z, 縮放x,y,z, 旋轉x,y,z)
            形狀：BOXG 方塊／CYL 圓柱（縮放 x、z 是半徑，y 是高度）／CYLT 錐柱／SPH 球／CONE 圓錐／PYR 四角錐／TRI 三角柱
     tick （選填）會動的裝飾品：tick(g,t,dt,o)，每一幀呼叫一次；t＝秒數、dt＝這一幀的時間、
            g＝這件裝飾品的 3D 群組（可先在 m 裡把會動的零件存到 g.userData，再於 tick 裡轉動）
            開了「減少動態」時不會呼叫。

   新增範例（貼在最後一個區塊的逗號後面）：
     {k:'teapot',r:.2,
       n:{zh:'小茶壺',en:'Teapot',ja:'ティーポット',ko:'찻주전자'},
       ico:'<ellipse cx="20" cy="24" rx="11" ry="9" fill="#E8685F"/><rect x="15" y="12" width="10" height="4" rx="2" fill="#C4604F"/>',
       m(g){bx(g,SPH,'#E8685F',0,.12,0,.14,.11,.14);bx(g,CYL,'#C4604F',0,.25,0,.05,.03,.05)}},
   ========================================================================== */
const DECOR=[
/* No.01 */ {k:'cabin',r:.5,
  n:{zh:'小木屋',en:'Little Cabin',ja:'小さなログハウス',ko:'작은 통나무집'},
  ico:'<path d="M6 20 20 8l14 12z" fill="#B8654A"/><rect x="9" y="20" width="22" height="14" rx="1" fill="#E3B98A"/><rect x="17" y="25" width="6" height="9" fill="#7A5236"/><rect x="11" y="23" width="5" height="5" fill="#FFF1B0"/><rect x="26" y="9" width="3" height="6" fill="#9A8F86"/>',
  m(g){const w='#E3B98A',r='#B8654A';bx(g,BOXG,w,0,.2,0,.55,.4,.45);bx(g,TRI,w,0,.48,0,.318,.47,.16,-Math.PI/2);bx(g,BOXG,r,-.16,.5,0,.4,.04,.58,0,0,.8);bx(g,BOXG,r,.16,.5,0,.4,.04,.58,0,0,-.8);bx(g,BOXG,'#7A5236',0,.12,.226,.12,.22,.02);bx(g,BOXG,'#FFF1B0',.18,.26,.226,.1,.1,.02);bx(g,BOXG,'#9A8F86',.15,.62,-.1,.07,.16,.07)}},
/* No.02 */ {k:'swing',r:.42,
  n:{zh:'迷你鞦韆',en:'Mini Swing',ja:'ミニブランコ',ko:'미니 그네'},
  ico:'<path d="M7 34 12 6M33 34 28 6" stroke="#8A5E3B" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M10 6h20" stroke="#8A5E3B" stroke-width="3" stroke-linecap="round"/><path d="M16 7v18M24 7v18" stroke="#6B5848" stroke-width="1.4"/><rect x="13" y="25" width="14" height="4" rx="1.5" fill="#C98F5B"/>',
  m(g){const wd='#8A5E3B';bx(g,CYL,wd,-.3,.28,0,.025,.56,.025);bx(g,CYL,wd,.3,.28,0,.025,.56,.025);bx(g,CYL,wd,0,.57,0,.025,.66,.025,0,0,Math.PI/2);
  const pv=new THREE.Group();pv.position.y=.56;g.add(pv);bx(pv,CYL,'#6B5848',-.1,-.2,0,.006,.4,.006);bx(pv,CYL,'#6B5848',.1,-.2,0,.006,.4,.006);bx(pv,BOXG,'#C98F5B',0,-.41,0,.26,.025,.1);g.userData.sw=pv},
  tick(g,t,dt,o){const pv=g.userData.sw;if(pv)pv.rotation.z=Math.sin(t*1.4+o.x)*.16}},
/* No.03 */ {k:'mushroom',r:.36,
  n:{zh:'蘑菇屋',en:'Mushroom House',ja:'キノコの家',ko:'버섯 집'},
  ico:'<rect x="15" y="20" width="10" height="14" rx="3" fill="#F6EBD9"/><path d="M5 22a15 13 0 0130 0z" fill="#E5574F"/><circle cx="13" cy="16" r="2.4" fill="#fff"/><circle cx="22" cy="12" r="2" fill="#fff"/><circle cx="28" cy="18" r="1.8" fill="#fff"/><rect x="18" y="27" width="4" height="7" rx="1.5" fill="#7A5236"/>',
  m(g){bx(g,CYL,'#F6EBD9',0,.17,0,.14,.34,.14);bx(g,SPH,'#E5574F',0,.38,0,.34,.2,.34);[[.14,.55,.08],[-.12,.545,.12],[.02,.565,-.1],[-.17,.535,-.1],[.2,.53,-.05]].forEach(p=>bx(g,SPH,'#FFFFFF',p[0],p[1],p[2],.05,.02,.05));bx(g,BOXG,'#7A5236',0,.12,.136,.09,.16,.02)}},
/* No.04 */ {k:'scarecrow',r:.22,
  n:{zh:'稻草人',en:'Scarecrow',ja:'かかし',ko:'허수아비'},
  ico:'<rect x="19" y="8" width="2.6" height="28" fill="#8A6A4A"/><rect x="6" y="17" width="28" height="2.6" rx="1.3" fill="#8A6A4A"/><path d="M13 16h14l-1.5 12h-11z" fill="#6E8FB5"/><circle cx="20" cy="11.5" r="5" fill="#E9D3A0"/><rect x="12" y="8.5" width="16" height="2" rx="1" fill="#8A6A4A"/><path d="M15 9 20 1l5 8z" fill="#A9794F"/><circle cx="18" cy="12.5" r=".9" fill="#4A3535"/><circle cx="22" cy="12.5" r=".9" fill="#4A3535"/><path d="M5 18 2 16M5 19l-3 3M35 18l3-2M35 19l3 3M16 28l-1 5M24 28l1 5" stroke="#E6C86E" stroke-width="1.6" stroke-linecap="round"/>',
  m(g){const w='#8A6A4A',sh='#6E8FB5',st='#E6C86E';bx(g,CYL,w,0,.4,0,.018,.8,.018);bx(g,CYL,w,0,.56,0,.014,.62,.014,0,0,Math.PI/2);bx(g,BOXG,sh,0,.5,0,.2,.26,.1);bx(g,BOXG,sh,-.2,.56,0,.12,.07,.07);bx(g,BOXG,sh,.2,.56,0,.12,.07,.07);
  bx(g,CONE,st,-.31,.56,0,.03,.07,.03,0,0,Math.PI/2);bx(g,CONE,st,.31,.56,0,.03,.07,.03,0,0,-Math.PI/2);bx(g,CONE,st,0,.34,0,.08,.1,.08,Math.PI);
  bx(g,SPH,'#E9D3A0',0,.7,0,.09,.09,.09);bx(g,SPH,'#4A3535',-.03,.72,.082,.012,.012,.012);bx(g,SPH,'#4A3535',.03,.72,.082,.012,.012,.012);bx(g,CYL,w,0,.77,0,.15,.014,.15);bx(g,CONE,'#A9794F',0,.85,0,.085,.14,.085)}},
/* No.05 */ {k:'bench',r:.38,
  n:{zh:'木頭椅子',en:'Wooden Bench',ja:'木のベンチ',ko:'나무 벤치'},
  ico:'<rect x="7" y="13" width="26" height="6" rx="1.5" fill="#B98A5B"/><rect x="5" y="21" width="30" height="5" rx="1.5" fill="#C99C6B"/><rect x="8" y="26" width="3.5" height="9" fill="#8A5E3B"/><rect x="28.5" y="26" width="3.5" height="9" fill="#8A5E3B"/>',
  m(g){bx(g,BOXG,'#B98A5B',0,.2,0,.5,.04,.2);bx(g,BOXG,'#C99C6B',0,.34,-.09,.5,.16,.03);[[-.2,.07],[.2,.07],[-.2,-.07],[.2,-.07]].forEach(p=>bx(g,BOXG,'#8A5E3B',p[0],.1,p[1],.04,.2,.04));bx(g,BOXG,'#8A5E3B',-.22,.28,-.09,.03,.3,.03);bx(g,BOXG,'#8A5E3B',.22,.28,-.09,.03,.3,.03)}},
/* No.06 */ {k:'stones',r:.42,
  n:{zh:'石頭小路',en:'Stepping Stones',ja:'飛び石の小道',ko:'징검돌 길'},
  ico:'<ellipse cx="10" cy="14" rx="6" ry="3.6" fill="#B9B2A6"/><ellipse cx="19" cy="21" rx="6.5" ry="3.8" fill="#C8C1B4"/><ellipse cx="28" cy="28" rx="6" ry="3.6" fill="#B9B2A6"/><ellipse cx="11" cy="31" rx="4.6" ry="2.8" fill="#C8C1B4"/>',
  m(g){[[-.3,-.1,.1,'#B9B2A6'],[-.08,.04,.12,'#C8C1B4'],[.14,-.03,.1,'#B9B2A6'],[.33,.12,.09,'#C8C1B4']].forEach((p,i)=>bx(g,CYL,p[3],p[0],.02,p[1],p[2],.04,p[2]*.85,0,i,0))}},
/* No.07 */ {k:'windmill',r:.34,
  n:{zh:'風車',en:'Windmill',ja:'風車',ko:'풍차'},
  ico:'<path d="M13 35 16 17h8l3 18z" fill="#F3E6CF"/><path d="M14 17 20 9l6 8z" fill="#C4604F"/><rect x="18" y="28" width="5" height="7" fill="#7A5236"/><g transform="translate(20 17)"><path d="M0 0-3-14h6zM0 0 3 14h-6zM0 0-14 3v-6zM0 0 14-3v6z" fill="#fff" stroke="#d9cfbe" stroke-width=".8"/></g><circle cx="20" cy="17" r="2" fill="#8A5E3B"/>',
  m(g){bx(g,CYLT,'#F3E6CF',0,.3,0,.17,.6,.17);bx(g,CONE,'#C4604F',0,.69,0,.2,.2,.2);bx(g,BOXG,'#7A5236',0,.1,.15,.09,.18,.02);
  const pv=new THREE.Group();pv.position.set(0,.55,.3);g.add(pv);bx(g,BOXG,'#8A5E3B',0,.55,.2,.03,.03,.2);bx(pv,SPH,'#8A5E3B',0,0,0,.035,.035,.035);for(let i=0;i<4;i++){const a=new THREE.Group();a.rotation.z=i*Math.PI/2;pv.add(a);bx(a,BOXG,'#8A5E3B',0,.16,0,.02,.32,.012);bx(a,BOXG,'#FFFFFF',.035,.18,.004,.06,.22,.008)}g.userData.bl=pv},
  tick(g,t,dt,o){const pv=g.userData.bl;if(pv)pv.rotation.z-=dt*(.35+(WX.wind||0)*1.1)}},
/* No.08 */ {k:'lantern',r:.2,
  n:{zh:'小燈籠',en:'Little Lantern',ja:'小さなランタン',ko:'작은 등불'},
  ico:'<rect x="19" y="4" width="2.6" height="32" rx="1" fill="#6B5848"/><path d="M21 7h8" stroke="#6B5848" stroke-width="2.4"/><rect x="25" y="9" width="9" height="12" rx="3.5" fill="#FFD27A" stroke="#E9A93E" stroke-width="1.2"/><rect x="26" y="7.6" width="7" height="2.4" rx="1" fill="#C4604F"/>',
  m(g){bx(g,CYL,'#6B5848',0,.3,0,.014,.6,.014);bx(g,BOXG,'#6B5848',.07,.58,0,.16,.014,.014);bx(g,CONE,'#C4604F',.14,.6,0,.065,.04,.065);const m=mk(SPH,'#FFD98A',[.14,.52,0],[.06,.08,.06],null,WARM);g.add(m);bx(g,CYL,'#6B5848',.14,.43,0,.03,.02,.03);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:'#FFD27A',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.15}));s.scale.set(.6,.6,1);s.position.set(.14,.52,0);g.add(s);g.userData.gl=s}},
/* No.09 */ {k:'birdhouse',r:.22,
  n:{zh:'鳥屋',en:'Birdhouse',ja:'鳥の巣箱',ko:'새집'},
  ico:'<rect x="19" y="20" width="2.6" height="16" fill="#8A6A4A"/><rect x="10" y="14" width="20" height="14" rx="1" fill="#E9C58F"/><path d="M7 15 20 5l13 10z" fill="#C4604F"/><circle cx="20" cy="21" r="3" fill="#4A3535"/>',
  m(g){bx(g,CYL,'#8A6A4A',0,.3,0,.02,.6,.02);bx(g,BOXG,'#E9C58F',0,.66,0,.2,.18,.2);bx(g,PYR,'#C4604F',0,.82,0,.3,.14,.3,0,Math.PI/4);bx(g,SPH,'#4A3535',0,.67,.1,.04,.04,.012);bx(g,CYL,'#8A6A4A',0,.58,.12,.008,.06,.008,Math.PI/2)}},
/* No.10 */ {k:'fountain',r:.46,
  n:{zh:'噴水池',en:'Fountain',ja:'噴水',ko:'분수'},
  ico:'<path d="M5 28h30l-3 7H8z" fill="#CFC8BC"/><rect x="5" y="25" width="30" height="4" rx="2" fill="#E3DDD2"/><rect x="18.5" y="14" width="3" height="11" fill="#CFC8BC"/><path d="M12 14h16l-3 3H15z" fill="#E3DDD2"/><path d="M20 12v-3M16 13l-3-3M24 13l3-3" stroke="#8CC8E8" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="20" cy="27" rx="11" ry="1.6" fill="#8CC8E8"/>',
  m(g){const s='#CFC8BC';bx(g,CYL,s,0,.07,0,.42,.14,.42);bx(g,CYL,'#8CC8E8',0,.138,0,.36,.02,.36);bx(g,CYL,s,0,.24,0,.05,.2,.05);bx(g,CYL,s,0,.35,0,.16,.04,.16);bx(g,CYL,'#8CC8E8',0,.372,0,.13,.012,.13);
  g.userData.dr=[];for(let i=0;i<8;i++){const d=mk(SPH,'#CDEBFF',[0,.4,0],[.018,.022,.018],null,DROPM);d.castShadow=false;g.add(d);g.userData.dr.push(d)}},
  tick(g,t,dt,o){const dr=g.userData.dr;if(!dr)return;dr.forEach((d,i)=>{const ph=(t*.9+i/8)%1,a=i/8*6.283+ph*.8,rr=ph*.2;d.position.set(Math.cos(a)*rr,.42+.14*Math.sin(ph*Math.PI)-.3*ph*ph,Math.sin(a)*rr)})}},
/* No.11 */ {k:'mailbox',r:.2,
  n:{zh:'小郵筒',en:'Mailbox',ja:'ポスト',ko:'우체통'},
  ico:'<rect x="18" y="20" width="3" height="16" fill="#8A6A4A"/><rect x="9" y="11" width="22" height="12" rx="5" fill="#E86A5C"/><rect x="29" y="5" width="2.2" height="9" fill="#FFD54A"/><rect x="29" y="5" width="6" height="4" fill="#FFD54A"/><rect x="12" y="15" width="8" height="2" rx="1" fill="#fff" opacity=".7"/>',
  m(g){bx(g,BOXG,'#8A6A4A',0,.2,0,.04,.4,.04);bx(g,BOXG,'#E86A5C',0,.45,0,.16,.12,.24);bx(g,CYL,'#E86A5C',0,.51,0,.08,.24,.08,Math.PI/2);bx(g,BOXG,'#FFD54A',.095,.5,.02,.012,.1,.03)}},
/* No.12 */ {k:'beehive',r:.24,
  n:{zh:'小蜂箱',en:'Beehive',ja:'ミツバチの巣箱',ko:'벌집 상자'},
  ico:'<rect x="9" y="33" width="3" height="4" fill="#8A5E3B"/><rect x="28" y="33" width="3" height="4" fill="#8A5E3B"/><rect x="8" y="24" width="24" height="9" rx="1.5" fill="#E9C25A"/><rect x="8" y="16" width="24" height="8" rx="1.5" fill="#F6EBD9"/><rect x="8" y="9" width="24" height="7" rx="1.5" fill="#E9C25A"/><rect x="6" y="5" width="28" height="4.5" rx="1.5" fill="#C98F5B"/><rect x="16" y="28" width="8" height="2.5" rx="1.2" fill="#4A3535"/>',
  m(g){[[-.1,-.08],[.1,-.08],[-.1,.08],[.1,.08]].forEach(p=>bx(g,BOXG,'#8A5E3B',p[0],.05,p[1],.03,.1,.03));bx(g,BOXG,'#E9C25A',0,.15,0,.26,.1,.22);bx(g,BOXG,'#F6EBD9',0,.25,0,.26,.1,.22);bx(g,BOXG,'#E9C25A',0,.35,0,.26,.1,.22);bx(g,BOXG,'#C98F5B',0,.42,0,.3,.035,.26);bx(g,SPH,'#B9B2A6',0,.45,0,.045,.028,.045);bx(g,BOXG,'#4A3535',0,.14,.112,.1,.025,.01)}},
/* No.13 */ {k:'fence',r:.38,
  n:{zh:'小籬笆',en:'Picket Fence',ja:'小さな柵',ko:'작은 울타리'},
  ico:'<g fill="#F4EBDD" stroke="#D9CFBE" stroke-width="1"><path d="M6 34V15l3-4 3 4v19zM15 34V15l3-4 3 4v19zM24 34V15l3-4 3 4v19z"/></g><rect x="3" y="20" width="34" height="3" fill="#E7DCCB"/><rect x="3" y="28" width="34" height="3" fill="#E7DCCB"/>',
  m(g){[-.3,-.1,.1,.3].forEach(x=>{bx(g,BOXG,'#F4EBDD',x,.13,0,.05,.26,.04);bx(g,PYR,'#F4EBDD',x,.29,0,.05,.06,.05,0,Math.PI/4)});bx(g,BOXG,'#E7DCCB',0,.09,0,.7,.03,.025);bx(g,BOXG,'#E7DCCB',0,.19,0,.7,.03,.025)}},
/* No.14 */ {k:'planter',r:.22,
  n:{zh:'花盆',en:'Flower Pot',ja:'植木鉢',ko:'화분'},
  ico:'<path d="M12 22h16l-2 12H14z" fill="#D98B6A"/><rect x="11" y="19" width="18" height="4" rx="1.5" fill="#E39C7C"/><path d="M20 19V11M14 19l-2-6M26 19l2-6" stroke="#7DBB78" stroke-width="1.8"/><circle cx="20" cy="9" r="3.6" fill="#F29BB5"/><circle cx="12" cy="11" r="3" fill="#FFD54A"/><circle cx="28" cy="11" r="3" fill="#fff" stroke="#e9dccb"/>',
  m(g){bx(g,CYLT,'#D98B6A',0,.1,0,.13,.2,.13,Math.PI);bx(g,CYL,'#5B4A3A',0,.2,0,.12,.012,.12);[[0,.34,0,'#F29BB5'],[-.09,.3,.02,'#FFD54A'],[.09,.31,-.02,'#FFFFFF']].forEach(p=>{bx(g,CYL,'#7DBB78',p[0],(p[1]+.2)/2,p[2],.008,p[1]-.2,.008);bx(g,SPH,p[3],p[0],p[1],p[2],.05,.04,.05)})}},
/* No.15 */ {k:'well',r:.4,
  n:{zh:'小水井',en:'Wishing Well',ja:'小さな井戸',ko:'작은 우물'},
  ico:'<rect x="9" y="22" width="22" height="13" rx="2" fill="#CFC8BC"/><rect x="9" y="22" width="22" height="3.2" rx="1.2" fill="#E3DDD2"/><rect x="11" y="10" width="2.6" height="13" fill="#8A5E3B"/><rect x="26.4" y="10" width="2.6" height="13" fill="#8A5E3B"/><path d="M7 11 20 3l13 8z" fill="#C4604F"/><path d="M20 11v8" stroke="#6B5848" stroke-width="1.2"/><rect x="17.2" y="18" width="5.6" height="4.6" rx="1.2" fill="#B98A5B"/>',
  m(g){bx(g,CYL,'#CFC8BC',0,.1,0,.25,.2,.25);bx(g,CYL,'#7FBFE2',0,.205,0,.17,.012,.17);for(let i=0;i<10;i++){const a=i/10*6.283;bx(g,SPH,i%2?'#E3DDD2':'#C8C1B4',Math.cos(a)*.21,.21,Math.sin(a)*.21,.045,.035,.045)}
  bx(g,BOXG,'#8A5E3B',-.2,.38,0,.035,.36,.035);bx(g,BOXG,'#8A5E3B',.2,.38,0,.035,.36,.035);bx(g,CYL,'#6B5848',0,.52,0,.012,.4,.012,0,0,Math.PI/2);bx(g,PYR,'#C4604F',0,.66,0,.56,.2,.4,0,Math.PI/2);
  bx(g,CYL,'#6B5848',0,.46,0,.006,.1,.006);bx(g,CYL,'#B98A5B',0,.4,0,.04,.07,.04)}},
/* No.16 */ {k:'signpost',r:.22,
  n:{zh:'小路標',en:'Signpost',ja:'道しるべ',ko:'이정표'},
  ico:'<rect x="18.5" y="6" width="3" height="30" rx="1" fill="#8A6A4A"/><path d="M8 8h20l4 3.5-4 3.5H8z" fill="#E9C58F" stroke="#B98A5B" stroke-width="1"/><path d="M32 18H12l-4 3.5 4 3.5h20z" fill="#F4EBDD" stroke="#D9CFBE" stroke-width="1"/><ellipse cx="20" cy="36" rx="6" ry="1.8" fill="#B9B2A6"/>',
  m(g){bx(g,CYL,'#B9B2A6',0,.02,0,.09,.04,.09);bx(g,BOXG,'#8A6A4A',0,.3,0,.05,.6,.05);bx(g,BOXG,'#E9C58F',.09,.5,.03,.3,.09,.02);bx(g,BOXG,'#E9C58F',.255,.5,.03,.065,.065,.02,0,0,Math.PI/4);
  bx(g,BOXG,'#F4EBDD',-.09,.38,-.03,.3,.09,.02);bx(g,BOXG,'#F4EBDD',-.255,.38,-.03,.065,.065,.02,0,0,Math.PI/4);bx(g,SPH,'#8A6A4A',0,.61,0,.04,.04,.04)}},
/* No.17 */ {k:'windchime',r:.26,
  n:{zh:'彩虹風鈴',en:'Rainbow Wind Chime',ja:'虹色の風鈴',ko:'무지개 풍경'},
  ico:'<rect x="7" y="6" width="2.8" height="30" rx="1" fill="#8A6A4A"/><rect x="7" y="6" width="22" height="2.8" rx="1.2" fill="#8A6A4A"/><path d="M27 8v3" stroke="#6B5848" stroke-width="1.2"/><ellipse cx="27" cy="12" rx="6" ry="1.8" fill="#C98F5B"/><g stroke-linecap="round" stroke-width="2.6"><path d="M22 13v13" stroke="#F29BB5"/><path d="M25 13v18" stroke="#FFD54A"/><path d="M28 13v15" stroke="#8FD3B6"/><path d="M31 13v19" stroke="#8CC8E8"/><path d="M34 13v12" stroke="#C3A6E8"/></g><rect x="25" y="34" width="5" height="3.4" rx="1" fill="#F4EBDD" stroke="#D9CFBE" stroke-width=".8"/><ellipse cx="14" cy="36" rx="5" ry="1.6" fill="#B9B2A6"/>',
  m(g){const wd='#8A6A4A';bx(g,CYL,'#B9B2A6',0,.02,0,.09,.04,.09);bx(g,CYL,wd,0,.37,0,.022,.7,.022);bx(g,CYL,wd,.11,.72,0,.016,.24,.016,0,0,Math.PI/2);
  const pv=new THREE.Group();pv.position.set(.22,.72,0);g.add(pv);bx(pv,CYL,'#6B5848',0,-.025,0,.006,.05,.006);bx(pv,CYL,'#C98F5B',0,-.055,0,.08,.016,.08);
  const cols=['#F29BB5','#FFD54A','#8FD3B6','#8CC8E8','#C3A6E8'],lens=[.17,.24,.2,.27,.15],tubes=[];
  cols.forEach((c,i)=>{const a=i/5*6.283,tg=new THREE.Group();tg.position.set(Math.cos(a)*.045,-.065,Math.sin(a)*.045);pv.add(tg);bx(tg,CYL,c,0,-lens[i]/2,0,.014,lens[i],.014);bx(tg,CYL,'#FFFFFF',0,-lens[i],0,.014,.01,.014);tubes.push(tg)});
  bx(pv,CYL,'#6B5848',0,-.17,0,.004,.2,.004);bx(pv,SPH,'#6B5848',0,-.27,0,.014,.014,.014);bx(pv,BOXG,'#F4EBDD',0,-.33,0,.075,.075,.008,0,.5,0);
  g.userData.wc=pv;g.userData.wt=tubes},
  tick(g,t,dt,o){const u=g.userData,wd=(typeof WX!=='undefined'&&WX.wind)||0,am=.05+wd*.28;
    if(u.wc){u.wc.rotation.z=Math.sin(t*1.3+o.x)*am*.55;u.wc.rotation.x=Math.cos(t*1.05+o.z)*am*.4}
    if(u.wt)u.wt.forEach((tg,i)=>{tg.rotation.x=Math.sin(t*2.2+i*1.3+o.x)*am;tg.rotation.z=Math.cos(t*1.9+i*1.1+o.z)*am})}},
/* No.18 */ {k:'fireflyjar',r:.18,
  n:{zh:'螢火蟲罐',en:'Firefly Jar',ja:'ホタルのびん',ko:'반딧불이 병'},
  ico:'<ellipse cx="20" cy="35" rx="11" ry="3" fill="#9A7B5A"/><rect x="10" y="30" width="20" height="5" rx="2" fill="#B98A5B"/><rect x="12" y="12" width="16" height="19" rx="5" fill="#DDF3F0" fill-opacity=".7" stroke="#A9D8D2" stroke-width="1.4"/><rect x="14" y="7" width="12" height="5" rx="2" fill="#C98F5B"/><circle cx="18" cy="19" r="2.2" fill="#FFE27A"/><circle cx="24" cy="23" r="1.8" fill="#FFD54A"/><circle cx="20" cy="27" r="1.6" fill="#FFE9A0"/><circle cx="18" cy="19" r="4.6" fill="#FFE27A" opacity=".25"/><circle cx="24" cy="23" r="4" fill="#FFD54A" opacity=".25"/>',
  m(g){bx(g,CYL,'#9A7B5A',0,.06,0,.15,.12,.15);bx(g,CYL,'#B98A5B',0,.121,0,.12,.012,.12);
  bx(g,CYL,'#7DBB78',.08,.14,.05,.03,.02,.03,0,.4,0);bx(g,SPH,'#7DBB78',.1,.15,.07,.025,.012,.04,0,.6,0);
  const gm=new THREE.MeshStandardMaterial({color:'#E3F6F3',transparent:true,opacity:.38,roughness:.08,metalness:.1,depthWrite:false});
  g.add(mk(CYL,'#E3F6F3',[0,.24,0],[.095,.2,.095],null,gm));g.add(mk(CYL,'#E3F6F3',[0,.355,0],[.06,.03,.06],null,gm));bx(g,CYL,'#C98F5B',0,.385,0,.07,.03,.07);bx(g,SPH,'#8A5E3B',0,.405,0,.018,.014,.018);
  g.userData.ff=[];for(let i=0;i<5;i++){const f=mk(SPH,'#FFE9A0',[0,.24,0],[.014,.014,.014],null,WARM);f.castShadow=false;g.add(f);g.userData.ff.push(f)}
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:'#FFE27A',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.15}));s.scale.set(.55,.55,1);s.position.set(0,.25,0);g.add(s);g.userData.gl=s},
  tick(g,t,dt,o){const ff=g.userData.ff;if(!ff)return;ff.forEach((f,i)=>{const a=t*(.55+i*.14)+i*1.7,r=.04+.015*Math.sin(t*.8+i),p=.5+.5*Math.sin(t*2.4+i*1.9),sc=.009+.01*p;
    f.position.set(Math.cos(a)*r,.2+.07*(.5+.5*Math.sin(t*.9+i*2.1)),Math.sin(a*1.3)*r);f.scale.set(sc,sc,sc)})}},
/* No.19 */ {k:'balloon',r:.28,
  n:{zh:'小熱氣球',en:'Little Hot Air Balloon',ja:'小さな熱気球',ko:'작은 열기구'},
  ico:'<ellipse cx="20" cy="15" rx="11" ry="12" fill="#F29BB5"/><path d="M20 3c-5 3-6 20 0 24 6-4 5-21 0-24z" fill="#FFF1B0"/><path d="M10 20q10 4 20 0" stroke="#8CC8E8" stroke-width="2.6" fill="none"/><path d="M13 26 17 31M27 26 23 31" stroke="#6B5848" stroke-width="1.2"/><rect x="15.5" y="31" width="9" height="6" rx="1.4" fill="#C98F5B"/><path d="M15.5 33.5h9" stroke="#A9794F" stroke-width="1"/>',
  m(g){bx(g,CYL,'#8A6A4A',.14,.03,0,.012,.06,.012);bx(g,BOXG,'#C98F5B',.14,.065,0,.035,.012,.035);
  bx(g,CYL,'#E9D3A0',.07,.16,0,.004,.33,.004,0,0,.43);
  const pv=new THREE.Group();pv.position.set(0,.3,0);g.add(pv);
  bx(pv,BOXG,'#C98F5B',0,.035,0,.11,.07,.11);bx(pv,BOXG,'#A9794F',0,.052,0,.115,.012,.115);bx(pv,BOXG,'#E3B98A',0,.074,0,.12,.01,.12);
  [[-.045,-.045],[.045,-.045],[-.045,.045],[.045,.045]].forEach(p=>bx(pv,CYL,'#6B5848',p[0],.17,p[1],.004,.2,.004,-p[1]*2.2,0,p[0]*2.2));
  bx(pv,SPH,'#F29BB5',0,.4,0,.17,.195,.17);bx(pv,SPH,'#FFF1B0',0,.4,0,.173,.19,.058);bx(pv,SPH,'#FFF1B0',0,.4,0,.058,.19,.173);
  bx(pv,SPH,'#8CC8E8',0,.4,0,.178,.03,.178);bx(pv,SPH,'#8CC8E8',0,.5,0,.15,.024,.15);bx(pv,SPH,'#8CC8E8',0,.3,0,.15,.024,.15);
  bx(pv,CONE,'#F29BB5',0,.235,0,.05,.07,.05,Math.PI);bx(pv,SPH,'#E86A5C',0,.6,0,.02,.02,.02);
  g.userData.bp=pv},
  tick(g,t,dt,o){const pv=g.userData.bp;if(!pv)return;pv.position.y=.3+Math.sin(t*1.1+o.x)*.022;pv.rotation.z=Math.sin(t*.8+o.z)*.05;pv.rotation.x=Math.cos(t*.65+o.x)*.04;pv.rotation.y=Math.sin(t*.3+o.x)*.25}}
];
const DK=DECOR.map(d=>d.k),DR={},ICO={},DM={},DBY={};
DECOR.forEach(d=>{if(DBY[d.k])console.warn('[decor] 代號重複：'+d.k);DBY[d.k]=d;DR[d.k]=d.r;ICO[d.k]=d.ico;DM[d.k]=d.m;
  if(!(d.r>0)||!d.n||!d.n.en||!d.ico||typeof d.m!=='function')console.warn('[decor] 欄位不完整：'+d.k)});
function buildDecor(k){const g=new THREE.Group();DM[k](g);g.userData.k=k;const hb=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({visible:false}));hb.position.y=.28;hb.scale.setScalar(Math.max(.3,DR[k]));g.add(hb);return g}

/* ---- 資料 ---- */
const DEC=window.DEC=[],GIFTS=window.GIFTP=[];
const MIG={pond:'scarecrow',picnic:'beehive'};   // 舊版的平面裝飾品（小池塘、野餐墊）改成站得住的新裝飾品
const G=()=>{const g=S.g||(S.g={});g.pend=g.pend||[];g.decor=g.decor||[];g.rec=g.rec||[];g.gone=g.gone||{};
  g.decor.forEach(o=>{if(MIG[o.k]){o.k=MIG[o.k];o.u=Date.now()}});g.pend.forEach(p=>{if(p.k==='d'&&MIG[p.i]){p.i=MIG[p.i];p.u=Date.now()}});return g};
const gsave=()=>{persistState();try{window.cloud&&cloud.dirty()}catch(e){logErr(e)}};   // 存本機，同時通知雲端同步
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nameOf=k=>{const d=DBY[k];return d?I18N.pick(d.n):k};

function spawnDecor(o,anim){removeDecorObj(o.id);const g=buildDecor(o.k);g.position.set(o.x,gh(o.x,o.z),o.z);g.rotation.y=o.ry||0;g.userData.did=o.id;
  if(anim&&!S.rm){g.userData.pop=0;g.scale.setScalar(.001)}scene.add(g);DEC.push({id:o.id,k:o.k,x:o.x,z:o.z,r:DR[o.k],g})}
function removeDecorObj(id){slideDrop('dec:'+id);const i=DEC.findIndex(d=>d.id===id);if(i>=0){scene.remove(DEC[i].g);freeObj(DEC[i].g);DEC.splice(i,1)}}
function removeGiftObj(id){const j=GIFTS.findIndex(o=>o.id===id);if(j>=0){scene.remove(GIFTS[j].g);freeObj(GIFTS[j].g);GIFTS.splice(j,1)}}

/* 裝飾品能不能放在這裡：花園柵欄內、不擋橋頭通道與障礙物、不壓到花、別的裝飾品和還沒拆的禮物 */
function decorSpotOK(x,z,self,r){
  if(!(inG1(x,z,6.9-r*.3)||inG2(x,z,.84)))return false;
  if(Math.abs(z)<1.3+r*.4&&((x>4.9&&x<8)||(x>BB-.5&&x<BB+2)))return false;
  if(OBS.some(o=>Math.hypot(x-o[0],z-o[1])<o[2]+r*.5))return false;
  for(const d in flowers){const f=flowers[d];if(Math.hypot(f.position.x-x,f.position.z-z)<.4+r)return false}
  if(DEC.some(o=>o.id!==self&&Math.hypot(o.x-x,o.z-z)<o.r+r-.05))return false;
  if(GIFTS.some(o=>Math.hypot(o.to.x-x,o.to.z-z)<.45))return false;
  return true}
function findSpot(cx,cz,r,self){
  for(let i=0;i<70;i++){const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*(1.2+i*.06),x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;if(decorSpotOK(x,z,self,r))return[x,z]}
  for(let i=0;i<150;i++){const q=rndPt();if(decorSpotOK(q[0],q[1],self,r))return q}
  return null}
function putDecor(o,cx,cz){const r=DR[o.k],sp=findSpot(cx==null?tgG.x:cx,cz==null?tgG.z:cz,r,o.id);
  if(!sp){toast(tr('gNoSpot'));sfx('deny');return false}
  o.x=sp[0];o.z=sp[1];o.ry=Math.random()*6.283;o.p=1;o.nw=0;o.u=Date.now();spawnDecor(o,true);gsave();
  tgG.set(o.x,gh(o.x,o.z)+.3,o.z);if(radG>14)radG=12;sfx('decor_place','plant');burst('spark',{x:o.x,y:gh(o.x,o.z)+.3,z:o.z},6);toast(tr('gPlaced'));gbRefresh();return true}
function storeDecor(id){const o=G().decor.find(x=>x.id===id);if(!o)return;removeDecorObj(id);o.p=0;o.u=Date.now();gsave();sfx('move');toast(tr('gStored'));gbRefresh()}
/* 旋轉裝飾品：每按一次轉 45 度（帶緩動）；角度存在 ry，更新時間 u 一起更新，雲端逐項比較時較新的贏，所以會同步到其他裝置 */
function rotateDecor(id){const d=DEC.find(o=>o.id===id),s=G().decor.find(o=>o.id===id);if(!d||!s)return;const u=d.g.userData,TP=Math.PI*2;
  u.ryT=(u.ryT!=null?u.ryT:d.g.rotation.y)+Math.PI/4;if(S.rm)d.g.rotation.y=u.ryT;
  s.ry=((u.ryT%TP)+TP)%TP;s.u=Date.now();gsave();sfx('rotate','click')}
/* 把裝飾品轉到指定角度（走最短的路；其他裝置同步過來時也用這個） */
function setDecorRy(d,ry){const g=d.g,u=g.userData,TP=Math.PI*2,cur=u.ryT!=null?u.ryT:g.rotation.y;let df=(((ry-cur)%TP)+TP)%TP;if(df>Math.PI)df-=TP;u.ryT=cur+df;if(S.rm)g.rotation.y=u.ryT}

/* ---- 小視窗：紙條 / 收到裝飾品 / 我的小禮物 ---- */
const gOpen=h=>{$('gsh').innerHTML=h;$('gmod').hidden=false},gClose=()=>{$('gmod').hidden=true};
$('gmod').onclick=e=>{if(e.target===$('gmod'))gClose()};
function showNote(p){const notes=I18N.pick(GNOTES),em={bee:'🐝',bird:'🐥',ladybug:'🐞',butterfly:'🦋',snail:'🐌'}[p.ty]||'🌼';
  gOpen(`<div class="paper"><div style="font-size:13px;opacity:.75">${em} ${esc(tr('gFrom',tr('gn')[p.ty]))}</div><p class="gt">“${esc(notes[p.i]||'')}”</p></div><div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn p" id="gok">${esc(tr('gOk'))}</button></div>`);
  $('gok').onclick=gClose}
function showDecorGot(o,gx,gz){const cnt=G().decor.filter(x=>x.k===o.k).length;
  gOpen(`<div class="gpop">${dIcon(o.k,84)}</div><h2 style="text-align:center;font-size:22px">${esc(tr('gGot',nameOf(o.k)))}</h2><p class="dx-got${cnt<=1?' new':''}">${esc(cnt<=1?tr('gFirst'):tr('gHave',cnt))}</p><div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap"><button class="btn" id="gk">${esc(tr('gKeepB'))}</button><button class="btn p" id="gp">${esc(tr('gPlaceNow'))}</button></div>`);
  $('gk').onclick=gClose;$('gp').onclick=()=>{if(putDecor(o,gx,gz))gClose()}}
/* ---- 小禮物圖鑑：全部裝飾品排成圖鑑，沒拿過的顯示剪影，拿過的顯示數量；點進去可放進花園或收藏 ---- */
const dxStat=k=>{const a=G().decor.filter(o=>o.k===k),n=a.filter(o=>o.p).length;return{all:a.length,in:n,kept:a.length-n}};
let dxFresh=new Set(),dxY=0;
const dxNo=k=>String(DK.indexOf(k)+1).padStart(2,'0');
function openGifts(){const g=G();dxFresh=new Set(g.decor.filter(o=>o.nw).map(o=>o.k));g.decor.forEach(o=>o.nw=0);gsave();gbRefresh();dxY=0;dexGrid()}
function dexGrid(){const own=DK.filter(k=>dxStat(k).all>0).length,pct=own/DK.length*100;
  const cards=DK.map(k=>{const s=dxStat(k),has=s.all>0;
    return `<button class="dx-c${has?'':' no'}" data-k="${k}" aria-label="${esc(has?nameOf(k):tr('gLocked'))}">${has&&dxFresh.has(k)?`<span class="dx-new">${esc(tr('gNew'))}</span>`:''}${has?`<span class="dx-x">×${s.all}</span>`:''}<span class="dx-n">No.${dxNo(k)}</span>${dIcon(k,52)}<span class="dx-t">${has?esc(nameOf(k)):'???'}</span><span class="dx-s">${has?`<span title="${esc(tr('gIn'))}">${ic('yard')} ${s.in}</span><span title="${esc(tr('gKept'))}">${ic('inventory_2')} ${s.kept}</span>`:esc(tr('gLocked'))}</span></button>`}).join('');
  gOpen(`<div class="dx-view"><div class="dx-hd"><h2 class="gsh-h">${ic('redeem')} ${esc(tr('gDex'))}</h2><div class="dx-sum"><span>${esc(tr('gDexSum',own,DK.length))}</span><div class="dx-bar"><i></i></div></div></div><div class="dx-body"><div class="dx-g">${cards}</div></div><div class="dx-ft"><button class="btn" id="gcl">${esc(tr('close'))}</button></div></div>`);
  const bd=$('gsh').querySelector('.dx-body');if(bd)bd.scrollTop=dxY;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const i=$('gsh').querySelector('.dx-bar i');if(i)i.style.width=pct+'%'}));
  $('gcl').onclick=gClose;
  $('gsh').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const bd=$('gsh').querySelector('.dx-body');dxY=bd?bd.scrollTop:0;dexDetail(b.dataset.k)})}
function dexDetail(k){const s=dxStat(k),has=s.all>0,nm=has?nameOf(k):'???';
  const body=has?`<div class="dx-st"><div><b>${s.in}</b><small>${esc(tr('gIn'))}</small></div><div><b>${s.kept}</b><small>${esc(tr('gKept'))}</small></div><div><b>${s.all}</b><small>${esc(tr('gTotal'))}</small></div></div><div class="dx-act"><button class="btn" id="dxs"${s.in?'':' disabled'}>${ic('inventory_2')} ${esc(tr('gStoreOne'))}</button><button class="btn p" id="dxp"${s.kept?'':' disabled'}>${ic('yard')} ${esc(tr('gPlaceNow'))}</button></div>`
    :`<p class="dx-lock">${esc(tr('gLockedHint'))}</p>`;
  gOpen(`<div class="dx-top"><button id="dxb" aria-label="${esc(tr('gBack'))}" title="${esc(tr('gBack'))}">${ic('arrow_back')}</button><span class="dx-n">No.${dxNo(k)}</span><button id="dxc" aria-label="${esc(tr('close'))}" title="${esc(tr('close'))}">${ic('close')}</button></div><div class="dx-d"><div class="dx-hero${has?'':' no'}">${dIcon(k,84)}</div><h2>${esc(nm)}</h2>${has?'':`<small>${esc(tr('gLocked'))}</small>`}${body}</div>`);
  $('dxb').onclick=()=>dexGrid();$('dxc').onclick=gClose;
  if(!has)return;
  $('dxs').onclick=()=>{const o=[...G().decor].reverse().find(x=>x.k===k&&x.p);if(!o)return;storeDecor(o.id);dexDetail(k)};
  $('dxp').onclick=()=>{const o=G().decor.find(x=>x.k===k&&!x.p);if(!o)return;if(putDecor(o))gClose()}}
$('gb').onclick=openGifts;
function gbRefresh(){const b=$('gb');if(!b)return;const n=G().decor.filter(o=>o.nw).length;b.innerHTML=ic('redeem')+(n?`<span class="gbd">${n}</span>`:'');b.setAttribute('aria-label',tr('gb'));b.title=tr('gb')}

/* ---- 點花園裡的裝飾品：小卡片（收藏 / 移動） ---- */
function decorCard(did){const d=DEC.find(o=>o.id===did);if(!d)return;const c=$('card');c.hidden=false;
  c.innerHTML=`<div style="font-size:12px;opacity:.7">${esc(tr('gDeco'))}</div><h2 style="display:flex;align-items:center;gap:8px">${dIcon(d.k,36)}<span>${esc(nameOf(d.k))}</span></h2><p>${esc(tr('gHint'))}</p><div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="gst" aria-label="${esc(tr('gStoreB'))}" title="${esc(tr('gStoreB'))}">${ic('inventory_2')}</button><button class="btn" id="grt" data-sfx="off" aria-label="${esc(tr('gRotB'))}" title="${esc(tr('gRotB'))}">${ic('rotate_right')}</button><button class="btn" id="gcx" style="margin-left:auto" aria-label="${esc(tr('close'))}" title="${esc(tr('close'))}">${ic('close')}</button></div>`;
  $('gst').onclick=()=>{storeDecor(did);c.hidden=true};
  $('grt').onclick=()=>rotateDecor(did);
  $('gcx').onclick=()=>{c.hidden=true}}

/* ---- 禮物盒（3D） ---- */
function spawnGift(p,from){const g=new THREE.Group(),pal=['#F5C7D5','#B9D8EB','#F5DEA0','#D4C7EA','#B9D9C2'],c=pal[(parseInt(p.id.slice(-2),36)||0)%5];
  bx(g,BOXG,c,0,.09,0,.2,.16,.2);bx(g,BOXG,'#FFFFFF',0,.09,0,.215,.165,.04);bx(g,BOXG,'#FFFFFF',0,.09,0,.04,.165,.215);bx(g,SPH,'#FFFFFF',-.035,.2,0,.05,.032,.035);bx(g,SPH,'#FFFFFF',.035,.2,0,.05,.032,.035);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:'#FFE9A8',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.4}));gl.scale.set(.75,.75,1);gl.position.y=.2;g.add(gl);
  const hb=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({visible:false}));hb.position.y=.15;hb.scale.setScalar(.38);hb.userData.gid=p.id;g.add(hb);
  const to={x:p.x,y:gh(p.x,p.z),z:p.z};g.position.set(from.x,from.y,from.z);g.scale.setScalar(.4);scene.add(g);
  GIFTS.push({id:p.id,g,gl,hb,from:{x:from.x,y:from.y+.2,z:from.z},to,t:S.rm?9:0,i:Math.random()*6})}
function pickGift(e){if(!GIFTS.length)return null;mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,cam);const h=ray.intersectObjects(GIFTS.map(o=>o.hb),false)[0];return h?h.object.userData.gid:null}
function pickDecor(e){if(!DEC.length)return null;mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,cam);const h=ray.intersectObjects(DEC.map(o=>o.g),true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.did)o=o.parent;return o?o.userData.did:null}
function openGift(gid){const g=G(),i=g.pend.findIndex(p=>p.id===gid);if(i<0)return;const p=g.pend[i];g.pend.splice(i,1);
  const j=GIFTS.findIndex(o=>o.id===gid);if(j>=0){const o=GIFTS[j],q={x:o.to.x,y:o.to.y+.2,z:o.to.z};burst('spark',q,6);burst('heart',q,3);scene.remove(o.g);GIFTS.splice(j,1)}
  sfx('gift_open','bloom');
  if(p.k==='n'){g.gone[p.id]=Date.now();gsave();showNote(p)}
  else{const o={id:p.id,k:p.i,x:p.x,z:p.z,p:0,nw:1,u:Date.now()};g.decor.push(o);gsave();gbRefresh();showDecorGot(o,p.x,p.z)}}

/* ---- 拖曳裝飾品（在「佈置花園」模式裡）：邏輯與動畫跟花朵完全一樣 ----
   點住拖曳＝移動；拖到不能放的地方（空中、橋上、柵欄外、障礙物、花或別的裝飾品上）放開 → 滑回原位並提示；
   佈置模式裡不會跳出資訊卡。 */
let dd=null;
function groundAt(e,d){mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,cam);const o=ray.ray.origin,dr=ray.ray.direction;let x=d.g.position.x,z=d.g.position.z,sky=true;
  if(dr.y<-.01){const k=-o.y/dr.y;x=o.x+dr.x*k;z=o.z+dr.z*k;const k2=(gh(x,z)-o.y)/dr.y;x=o.x+dr.x*k2;z=o.z+dr.z*k2;sky=false;const l=Math.hypot(x-MX,z);if(l>40){x=MX+(x-MX)*40/l;z*=40/l;sky=true}}
  return{x,z,sky}}
function dragDown(did){const d=DEC.find(o=>o.id===did);if(!d)return;slideDrop('dec:'+did);hover=null;dd={id:did,ok:true,dm:0,o:{x:d.x,z:d.z}};selRing.material.color.set('#F29BB5');selRing.visible=true;selRing.position.set(d.g.position.x,d.g.position.y+.05,d.g.position.z)}
function slideBackD(d){const T=new THREE.Vector3(d.x,gh(d.x,d.z),d.z);slideDrop('dec:'+d.id);if(S.rm){d.g.position.copy(T);return}slides.push({d:'dec:'+d.id,o:d.g,fr:d.g.position.clone(),to:T,t:0})}
function dragMove(e,quiet){const d=DEC.find(o=>o.id===dd.id);if(!d)return;const q=groundAt(e,d);
  dd.ok=!q.sky&&decorSpotOK(q.x,q.z,dd.id,d.r);dd.cx=q.x;dd.cz=q.z;
  d.g.position.set(q.x,gh(q.x,q.z)+(dd.ok?0:.3),q.z);if(!quiet)dd.dm++;selRing.position.set(q.x,gh(q.x,q.z)+.05,q.z);selRing.material.color.set(dd.ok?'#F29BB5':'#E8685F')}
function dragUp(){const x=dd;dd=null;selRing.visible=false;const d=DEC.find(o=>o.id===x.id),s=G().decor.find(o=>o.id===x.id);if(!d||!s)return;
  if(x.dm>2&&x.ok){d.x=x.cx;d.z=x.cz;d.g.position.set(d.x,gh(d.x,d.z),d.z);s.x=d.x;s.z=d.z;s.u=Date.now();gsave();sfx('move');toast(tr('moved'))}
  else{slideBackD(d);camBack();if(x.dm>2){sfx('deny');toast(tr('badSpot'))}}}      /* 不合法：滑回原本的位置，並提示 */
function dragCancel(){const x=dd;dd=null;selRing.visible=false;if(!x)return;const d=DEC.find(o=>o.id===x.id);if(d)slideBackD(d)}

/* ---- 送禮物：每天抽 0–2 份，有小動物才送，由其中一隻「送來」 ---- */
let FORCE=/[?&]gift=1/.test(location.search)?1:0;
function giftReady(){const ld=$('ld');return !!ld&&(ld.hidden||ld.classList.contains('out'))&&$('ob').hidden&&$('modal').hidden&&$('dlg').hidden&&$('gmod').hidden&&document.body.dataset.v==='garden'&&!arrange&&!drag&&!dd&&!P&&!document.hidden}
function giftSpotOK(x,z){return legalSpot(x,z,'\u0000')&&!GIFTS.some(o=>Math.hypot(o.to.x-x,o.to.z-z)<.5)}
function pickKind(){const g=G(),w=DK.map(k=>1/(1+g.decor.filter(o=>o.k===k).length)),sum=w.reduce((a,b)=>a+b,0);let r=Math.random()*sum;for(let i=0;i<DK.length;i++){r-=w[i];if(r<=0)return DK[i]}return DK[0]}
function pickNote(){const g=G(),n=GNOTES.zh.length;let i,t=0;do{i=Math.random()*n|0}while(g.rec.includes(i)&&++t<40);g.rec.push(i);if(g.rec.length>14)g.rec.shift();return i}
function giftDeliver(force,kind){const g=G();if(!cr.length||g.pend.length>=3)return false;
  const c=cr[Math.random()*cr.length|0],u=c.userData;let sp=null;
  for(let i=0;i<30&&!sp;i++){const a=Math.random()*6.283,r=.45+Math.random()*1.1,x=c.position.x+Math.cos(a)*r,z=c.position.z+Math.sin(a)*r;if(giftSpotOK(x,z))sp=[x,z]}
  for(let i=0;i<40&&!sp;i++){const q=rndPt();if(giftSpotOK(q[0],q[1]))sp=q}
  if(!sp)return false;
  const isDecor=kind?kind==='decor':Math.random()<.4,p={id:newId(),ty:u.type,x:sp[0],z:sp[1],k:isDecor?'d':'n',i:isDecor?pickKind():pickNote(),u:Date.now()};
  g.pend.push(p);if(!force)g.n=(g.n||0)+1;g.last=Date.now();gsave();
  spawnGift(p,c.position.clone());
  if(!S.rm&&!u.act)u.act={t:0,p0:c.position.clone(),r0:c.rotation.y,s0:c.scale.x,f1:0};
  burst('heart',{x:c.position.x,y:c.position.y+.1,z:c.position.z},3);sfx('gift_drop','animal_'+u.type);
  toast(tr('giftT',tr('gn')[u.type]));
  tgG.set(p.x,gh(p.x,p.z)+.3,p.z);if(radG>11)radG=9;
  return true}
function giftTick(){const g=G(),td=today();
  if(window.cloud&&cloud.user&&performance.now()<8000)return;   // 已登入雲端：先等第一次同步，才知道今天在別台裝置是否已領過
  if(g.day!==td){g.day=td;g.rt=Date.now();g.n=0;const r=Math.random();g.q=r<.3?0:r<.78?1:2;const d1=Date.now()+(Math.random()<.6?30e3+Math.random()*120e3:(20+Math.random()*220)*6e4);g.due=[d1,d1+(30+Math.random()*270)*6e4];gsave()}
  if(!giftReady())return;
  if(FORCE){if(giftDeliver(1))FORCE=0;return}
  if(g.n>=g.q||Date.now()<g.due[g.n]||Date.now()-(g.last||0)<60e3)return;
  giftDeliver()}

/* ---- 每一幀：禮物落地與漂浮、裝飾品的小動作 ---- */
let gT=0,gWarn=0;
function step(t,dt,rm){try{
  for(const o of GIFTS){o.t+=dt;const f=Math.min(1,o.t/.85),b=o.g;
    if(f<1&&!rm){const e=ez(f);b.position.set(o.from.x+(o.to.x-o.from.x)*e,o.from.y+(o.to.y-o.from.y)*e+Math.sin(f*Math.PI)*.55,o.from.z+(o.to.z-o.from.z)*e);b.scale.setScalar(.4+.6*e)}
    else{b.scale.setScalar(1);b.position.set(o.to.x,o.to.y+(rm?0:.035+.03*Math.sin(t*2.2+o.i)),o.to.z);if(!rm)b.rotation.y=t*.5+o.i}
    o.gl.material.opacity=rm?.45:.35+.2*Math.sin(t*3+o.i)}
  for(const o of DEC){const u=o.g.userData;
    if(u.ryT!=null){const df=u.ryT-o.g.rotation.y;if(rm||Math.abs(df)<.002)o.g.rotation.y=u.ryT;else o.g.rotation.y+=df*Math.min(1,dt*12)}
    if(u.pop!=null){u.pop+=dt/.6;const x=Math.min(1,u.pop),ob=1+2.70158*Math.pow(x-1,3)+1.70158*Math.pow(x-1,2);o.g.scale.setScalar(Math.max(.001,ob));if(x>=1){u.pop=null;o.g.scale.setScalar(1)}}
    {const d0=DBY[o.k];if(!rm&&d0&&d0.tick)d0.tick(o.g,t,dt,o)}
    if(u.gl){const dv=window.dfv==null?1:window.dfv;u.gl.material.opacity=.1+.5*(1-dv)}}
  if(t-gT>2){gT=t;giftTick()}
}catch(e){if(!gWarn){gWarn=1;console.warn('[gift]',e)}}}

/* ---- 雲端同步：今天領過幾份、禮物（未拆）、裝飾品庫存與在花園的位置／狀態 ----
   雲端檔多一個 g 欄位：{d:今天的領取狀態, i:{id:項目}}；每個項目有更新時間 u，逐項比較，較新的贏（跟花朵一樣）。
   項目狀態 s：'p'＝還沒拆的禮物、'd'＝裝飾品（p=1 放在花園、p=0 收藏中）、'x'＝已拆開的紙條（墓碑，讓其他裝置也一起消失）。 */
const WEEK45=45*864e5;
function localItems(){const g=G(),m={},now=Date.now();
  g.pend.forEach(p=>{if(!p.u)p.u=now;m[p.id]={id:p.id,s:'p',ty:p.ty,x:p.x,z:p.z,k:p.k,i:p.i,u:p.u}});
  g.decor.forEach(o=>{if(!o.u)o.u=now;m[o.id]={id:o.id,s:'d',k:o.k,x:o.x,z:o.z,ry:o.ry||0,p:o.p?1:0,nw:o.nw?1:0,u:o.u}});
  for(const id in g.gone){if(now-g.gone[id]>WEEK45){delete g.gone[id];continue}m[id]={id,s:'x',u:g.gone[id]}}
  return m}
function mrgDay(a,b){if(!a||!b)return a||b||null;if(a.day>b.day)return a;if(b.day>a.day)return b;const base=(a.rt&&b.rt&&b.rt<a.rt)?b:a;return{...base,n:Math.max(a.n||0,b.n||0),last:Math.max(a.last||0,b.last||0)}}
function mrgRemote(a,b){a=a||{};b=b||{};const o={d:mrgDay(a.d,b.d),i:{...(a.i||{})}};for(const id in (b.i||{}))if(!o.i[id]||b.i[id].u>o.i[id].u)o.i[id]=b.i[id];return o}
function applyItem(r){const g=G(),pi=g.pend.findIndex(p=>p.id===r.id),di=g.decor.findIndex(o=>o.id===r.id);
  if(r.s==='p'){if(r.k==='d'&&MIG[r.i])r.i=MIG[r.i];if(di>=0||pi>=0||g.gone[r.id])return;const p={id:r.id,ty:r.ty,x:r.x,z:r.z,k:r.k,i:r.i,u:r.u};g.pend.push(p);if(ok)spawnGift(p,{x:p.x,y:gh(p.x,p.z),z:p.z})}
  else if(r.s==='d'){if(MIG[r.k])r.k=MIG[r.k];if(pi>=0){g.pend.splice(pi,1);removeGiftObj(r.id)}
    const o={id:r.id,k:r.k,x:r.x,z:r.z,ry:r.ry||0,p:r.p?1:0,nw:r.nw?1:0,u:r.u},old=g.decor[di];
    if(di>=0)g.decor[di]=o;else g.decor.push(o);
    if(ok){const cur=DEC.find(d=>d.id===o.id);if(!o.p)removeDecorObj(o.id);else if(!cur||cur.x!==o.x||cur.z!==o.z)spawnDecor(o,false);else setDecorRy(cur,o.ry||0)}}
  else if(r.s==='x'){if(pi>=0){g.pend.splice(pi,1);removeGiftObj(r.id)}g.gone[r.id]=r.u}}
function syncG(R){R=R||{};const g=G(),Li=localItems(),Ri=R.i||{},out={};let touched=false,dirty=false;
  new Set([...Object.keys(Li),...Object.keys(Ri)]).forEach(id=>{const l=Li[id],r=Ri[id];
    if(l&&!r){out[id]=l;dirty=true}
    else if(r&&!l){if(Date.now()-r.u<=(r.s==='x'?WEEK45:1/0)){applyItem(r);out[id]=r;touched=true}}
    else if(r.u>l.u){applyItem(r);out[id]=r;touched=true}
    else{out[id]=l;if(l.u>r.u)dirty=true}});
  const a=g.day?{day:g.day,q:g.q,n:g.n||0,due:g.due,last:g.last||0,rt:g.rt||0}:null,b=R.d||null,d=mrgDay(a,b);
  if(d&&(!a||JSON.stringify(d)!==JSON.stringify(a))){g.day=d.day;g.q=d.q;g.n=d.n;g.due=d.due;g.last=d.last;g.rt=d.rt}
  if(d&&(!b||JSON.stringify(d)!==JSON.stringify(b)))dirty=true;
  if(touched)gsave2();
  return{g:(d||Object.keys(out).length)?{d:d||undefined,i:out}:undefined,touched,dirty}}
const gsave2=()=>{persistState()};   // 同步途中只存本機（不再觸發一次同步）
function wipe(){while(DEC.length)removeDecorObj(DEC[0].id);while(GIFTS.length)removeGiftObj(GIFTS[0].id);S.g=null;G()}

/* 手動測試：在瀏覽器主控台輸入 giveGift() / giveGift('note') / giveGift('decor')；或在網址後面加 ?gift=1 */
window.giveGift=k=>giftDeliver(1,k);

/* ---- 開站時還原：已放在花園裡的裝飾品、還沒拆的禮物 ---- */
if(ok){const g=G();g.decor.forEach(o=>{if(o.p)spawnDecor(o,false)});g.pend.forEach(p=>spawnGift(p,{x:p.x,y:gh(p.x,p.z),z:p.z}))}
return{step,refresh:gbRefresh,pickGift,openGift,pickDecor,decorCard,down:dragDown,move:dragMove,up:dragUp,cancel:dragCancel,active:()=>!!dd,sync:syncG,mrg:mrgRemote,wipe}
})();
