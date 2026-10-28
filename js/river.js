/* ============================================================================
 * js/river.js — 河流休息區（寫一片葉子放進河裡）
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・兩座花園之間的河與河中小島（長椅、燈籠、垂柳、碼頭）：點小島寫一句話，
 *     放進河裡，葉子順著河水漂走。
 *   ・對外以 window.RV 提供（pick、水面漣漪 addRip…）；沒有 WebGL 時整段跳
 *     過。
 *
 * 需要先載入：log.js、audio.js、state.js、icons.js、i18n.js、world.js、
 *   three-utils.js、garden-scene.js、camera.js、creatures.js、weather.js、
 *   particles.js、ui-shell.js
 * 提供給其他檔案：RV
 * 載入順序：第 27 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ===== 河流休息區 =====
   兩座花園之間的河從橋下流過，河中有一座小島（長椅、燈籠、垂柳、碼頭）。
   點小島 → 出現一片葉子形狀的輸入框 → 寫完按「放入河中」→ 葉子落在水面，順著河水漂過橋下、漂進遠方的霧裡。
   葉子上的字不會被儲存（也不會同步），放下就是放下。
   這個區塊獨立運作：沒有 WebGL 時整段跳過；不動花園、花朵、動物、天氣、同步等任何原有功能。 */
(function() {
  'use strict';
  if (typeof ok === 'undefined' || !ok || typeof scene === 'undefined' || typeof THREE === 'undefined') return;
  const T = THREE,
    clamp = (v, a, b) => Math.min(b, Math.max(a, v)),
    sstep = (a, b, v) => {
      const t = clamp((v - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t)
    };

  /* ---------- 文字（四種語言；缺的語言會自動退回英文） ---------- */
  try {
    I18N.add('en', {
      rvT: 'River rest',
      rvPh: 'Write down what you want to let go of…',
      rvGo: 'Set it afloat',
      rvNote: "This leaf isn’t saved anywhere. Only the river will know.",
      rvEmpty: 'Write a few words on the leaf first',
      rvDone: 'The river is carrying it away, gently',
      rvLeaf: ['Green', 'Gold', 'Pink', 'Lavender']
    });
    I18N.add('zh', {
      rvT: '河邊小憩',
      rvPh: '把想放下的心事，寫在葉子上…',
      rvGo: '放入河中',
      rvNote: '這片葉子不會被儲存，只有河水知道',
      rvEmpty: '先在葉子上寫幾個字吧',
      rvDone: '河水正溫柔地帶走它',
      rvLeaf: ['翠綠', '金黃', '粉紅', '淡紫']
    });
    I18N.add('ja', {
      rvT: '川辺のひと休み',
      rvPh: '手放したい気持ちを葉っぱに書いてみよう…',
      rvGo: '川に流す',
      rvNote: 'この葉っぱはどこにも保存されません。知っているのは川だけ。',
      rvEmpty: 'まず葉っぱに少し書いてみてね',
      rvDone: '川がやさしく運んでいくよ',
      rvLeaf: ['みどり', 'きいろ', 'ピンク', 'ラベンダー']
    });
    I18N.add('ko', {
      rvT: '강가의 쉼터',
      rvPh: '놓아주고 싶은 마음을 잎에 적어 보세요…',
      rvGo: '강에 띄우기',
      rvNote: '이 잎은 어디에도 저장되지 않아요. 아는 건 강물뿐이에요.',
      rvEmpty: '먼저 잎에 몇 글자 적어 주세요',
      rvDone: '강물이 살며시 데려가고 있어요',
      rvLeaf: ['초록', '노랑', '분홍', '라벤더']
    });
  } catch (e) {
    logErr(e)
  }

  /* ---------- 河的形狀 ---------- */
  const WY = -.55,
    RZ0 = -200,
    RZ1 = 130,
    LZ = -70; // 水面高度、河的起訖（z）
  const far = z => Math.min(1, Math.max(0, (Math.abs(z) - 12) / 25)); // 離花園越遠，河越能大幅彎曲、越寬
  const cx = z => 10.35 + .7 * Math.sin(z * .19 + .5) + far(z) * 4.5 * Math.sin(z * .032 + .8),
    hw = z => 3.5 + .5 * Math.sin(z * .31 + 1.2) + Math.max(0, Math.abs(z) - 18) * .04; // 中心線 x、半寬
  const IZ = 5,
    IX = cx(IZ) - .9,
    IR = 1.7; // 休息小島的位置與半徑

  const U = {
    uT: {
      value: 0
    },
    uDay: {
      value: 1
    },
    uNight: {
      value: 0
    },
    uRip: {
      value: Array.from({
        length: 8
      }, () => new T.Vector4(0, 0, 99, 0))
    },
    uG2: {
      value: new T.Vector2(G2.x, 0)
    }
  };
  {
    const NZ = Math.round(RZ1 - RZ0),
      NU = 18,
      pos = [],
      nor = [],
      aR = [],
      idx = [];
    for (let i = 0; i <= NZ; i++) {
      const z = RZ0 + (RZ1 - RZ0) * i / NZ;
      for (let j = 0; j <= NU; j++) {
        const u = j / NU * 2 - 1;
        pos.push(cx(z) + u * hw(z), WY, z);
        nor.push(0, 1, 0);
        aR.push(u, i / NZ)
      }
    }
    for (let i = 0; i < NZ; i++)
      for (let j = 0; j < NU; j++) {
        const a = i * (NU + 1) + j,
          b = a + 1,
          c = a + NU + 1,
          d = c + 1;
        idx.push(a, c, b, b, c, d)
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('aR', new T.Float32BufferAttribute(aR, 2));
    g.setIndex(idx);
    const FH = `#include <common>
uniform float uT,uDay,uNight;uniform vec4 uRip[8];uniform vec2 uG2;varying vec2 vR;varying vec3 vWp;
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return .55*vn(p)+.3*vn(p*2.1+5.7)+.15*vn(p*4.3+1.9);}
float rho2g(float a){return 6.4*(1.+.14*sin(2.*a+.9)+.1*sin(3.*a+2.2)+.07*sin(5.*a+.4));}
float Hh(vec2 p){return fbm(vec2(p.x*1.5,p.y*.75+uT*.42))+.6*fbm(vec2(p.x*3.2,p.y*1.5+uT*.8)+9.);}`;
    const FC = `vec2 pp=vWp.xz;float e=.07;float h0=Hh(pp),hx=Hh(pp+vec2(e,0.)),hz=Hh(pp+vec2(0.,e));
vec2 g=vec2(h0-hx,h0-hz)/e*.055;float rg=0.;
for(int i=0;i<8;i++){vec4 r=uRip[i];if(r.w>0.){float d=length(pp-r.xy);float R=r.z*.55;float q=(d-R)*5.;float w=exp(-q*q)*(1.-r.z/3.5)*r.w;vec2 dir=(pp-r.xy)/max(d,.001);g+=dir*w*.35*cos((d-R)*14.);rg+=w;}}
vec3 wn=normalize(vec3(g.x,1.,g.y));
float au=abs(vR.x);
float d1=length(pp)-7.79;vec2 q2=pp-vec2(uG2.x,0.);float d2=length(q2)-rho2g(atan(q2.y,q2.x))*.971;float dw=min(d1,d2);
float shore=1.-smoothstep(0.,1.2,dw);
float foam=(1.-smoothstep(.04,.45,dw))*(.5+.5*vn(vec2(pp.x*5.,pp.y*5.+uT*.8)));
vec3 deep=vec3(.22,.46,.60),mid=vec3(.36,.62,.70),shal=vec3(.62,.80,.76);
vec3 col=mix(mid,deep,smoothstep(.2,1.,1.-au)*.75);col=mix(col,shal,shore*.75);
float st=smoothstep(.55,.9,fbm(vec2(pp.x*2.4,pp.y*.7+uT*.6)+3.));col+=st*.09;
col=mix(col,vec3(.94,.98,.97),clamp(foam,0.,1.)*.55);col+=vec3(.9,.97,1.)*rg*.22;col*=mix(.34,.82,uDay);
float endF=smoothstep(${RZ0.toFixed(1)},${(RZ0+40).toFixed(1)},vWp.z)*(1.-smoothstep(${(RZ1-40).toFixed(1)},${RZ1.toFixed(1)},vWp.z));float edge=1.-smoothstep(.78,1.,au);
diffuseColor.rgb=col;diffuseColor.a=clamp(edge*endF,0.,1.)*.93;`;
    const FE = `float sp=smoothstep(.9,1.,vn(pp*7.5+vec2(0.,uT*1.1)))*smoothstep(.55,.95,vn(pp*3.1-uT*.35));
totalEmissiveRadiance+=vec3(1.,.97,.88)*sp*(.28*uDay+.1)*edge*endF+vec3(.1,.2,.36)*uNight*(.35+st)*.5*edge;`;
    const wm = new T.MeshStandardMaterial({
      color: '#ffffff',
      roughness: .34,
      metalness: 0,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide
    });
    wm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aR;varying vec2 vR;varying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvR=aR;vWp=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', FH).replace('#include <color_fragment>', '#include <color_fragment>\n' + FC).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=normalize((viewMatrix*vec4(wn,0.)).xyz);').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + FE)
    };
    wm.customProgramCacheKey = () => 'rv-water';
    const river = new T.Mesh(g, wm);
    river.frustumCulled = false;
    river.receiveShadow = false;
    river.castShadow = false;
    river.renderOrder = -1;
    scene.add(river);
  }

  /* ---------- 水波紋（落葉、漂流、下雨時用） ---------- */
  let ripI = 0;
  const rips = U.uRip.value;

  function addRip(x, z, amp) {
    rips[ripI++ % 8].set(x, z, 0, amp)
  }

  /* ---------- 河中的休息小島 ---------- */
  const isl = new T.Group();
  isl.position.set(IX, .2, IZ);
  scene.add(isl);
  const sway = []; // 隨風擺動的東西
  const wob = a => {
    const o = new T.Object3D();
    a.forEach(m => o.add(m));
    return o
  };

  function jitter(g, k) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        a = Math.atan2(z, x),
        s = 1 + k * Math.sin(3 * a + .6) + k * .6 * Math.sin(5 * a + 1.7);
      p.setX(i, x * s);
      p.setZ(i, z * s)
    }
    g.computeVertexNormals();
    return g
  }
  const BOX = new T.BoxGeometry(1, 1, 1),
    ICO = new T.IcosahedronGeometry(1, 0);
  /* 沿用兩座花園的材質與貼圖（草地、土壤、木紋、樹皮、樹葉、石頭、屋瓦），小島才會跟花園是同一種風格 */
  const K = window.SKIN || null;
  const mkW = (g, c, p, s, r) => {
    const m = mk(g, c, p, s, r);
    if (K) K.wood(m, K.DECK.has(m.material.color.getHexString()));
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
  const leafy = m => {
    if (K) {
      m.geometry = K.CAN;
      m.rotation.set(0, Math.random() * 6.28, 0);
      m.material = K.SM(m.material, 'lf', null, {
        roughness: .85,
        flatShading: true,
        side: 2
      })
    }
    return m
  };
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
  const roof = m => {
    if (K) m.material = K.SM(m.material, 'rf', K.V(K.TR, 'r', 4, 3), {
      roughness: .7,
      bumpScale: 2.5
    });
    return m
  };
  const lm = new T.MeshStandardMaterial({
      color: '#FFE3B0',
      roughness: .5,
      emissive: new T.Color('#FFC77A'),
      emissiveIntensity: .2
    }),
    lampW = new T.Vector3(IX + IR * .78 + 1.4, .96, IZ - .1);
  {
    const SG = 56,
      KR = 8,
      Rg = a => IR * (1 + .07 * Math.sin(3 * a + .6) + .042 * Math.sin(5 * a + 1.7));
    {
      const c1 = new T.Color('#98C281'),
        c2 = new T.Color('#B8D890'),
        cc = new T.Color(),
        pos = [0, -.06, 0],
        col = [],
        idx = [];
      const paint = (x, z, dirt) => {
        const n = (Math.sin(x * .9) * Math.cos(z * 1.1) + Math.sin(x * .3 + z * .5)) * .25 + .5;
        cc.copy(c1).lerp(c2, clamp(n, 0, 1));
        if (dirt) cc.set('#C9A97E');
        col.push(cc.r, cc.g, cc.b)
      };
      paint(IX, IZ, false);
      for (let k = 1; k <= KR; k++) {
        const f = k / KR;
        for (let i = 0; i < SG; i++) {
          const a = i / SG * 6.2832,
            r = Rg(a) * f,
            x = Math.cos(a) * r,
            z = Math.sin(a) * r;
          pos.push(x, k === KR ? -.2 : -.06 - .1 * f * f, z);
          paint(IX + x, IZ + z, f > .97)
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
    } {
      const sp = [],
        si = [],
        uv = [];
      for (let i = 0; i < SG; i++) {
        const a = i / SG * 6.2832,
          r = Rg(a),
          x = Math.cos(a),
          z = Math.sin(a);
        sp.push(x * r * 1.012, -.2, z * r * 1.012, x * r * .87, -1.3, z * r * .87);
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
      const cp = [0, -1.45, 0],
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
    /* 木頭長椅（面向河） */
    const bench = new T.Group();
    bench.position.set(-.3, -.07, -.05);
    bench.rotation.y = -.12;
    bench.add(mkW(BOX, '#E3C28F', [0, .34, 0], [.34, .05, .95]), mkW(BOX, '#E3C28F', [-.15, .6, 0], [.05, .4, .95]), mkW(BOX, '#C79F72', [.1, .17, .38], [.05, .34, .07]), mkW(BOX, '#C79F72', [.1, .17, -.38], [.05, .34, .07]), mkW(BOX, '#C79F72', [-.15, .3, .38], [.05, .6, .07]), mkW(BOX, '#C79F72', [-.15, .3, -.38], [.05, .6, .07]));
    isl.add(bench);
    /* 短碼頭：伸進河裡 */
    const pier = new T.Group();
    pier.position.set(IR * .78, -.08, .15);
    for (let i = 0; i < 5; i++) pier.add(mkW(BOX, ['#E8C99A', '#DDB98A', '#E3C28F'][i % 3], [i * .27 + .1, 0, 0], [.25, .05, .62]));
    [
      [.0, .3],
      [.0, -.3],
      [1.15, .3],
      [1.15, -.3]
    ].forEach(([x, z]) => pier.add(mkW(BOX, '#C79F72', [x + .1, -.38, z], [.07, .7, .07])));
    isl.add(pier);
    /* 燈籠柱（夜裡會亮） */
    const lam = new T.Group();
    lam.position.set(IR * .78 + 1.2, -.08, -.1);
    lam.add(mkW(BOX, '#B58B66', [0, .5, 0], [.06, 1, .06]), mkW(BOX, '#B58B66', [.12, .98, 0], [.26, .035, .035]));

    const lb = mk(new T.BoxGeometry(1, 1, 1), '#fff', [.2, .84, 0], [.15, .2, .15], null, lm);
    lb.castShadow = false;
    lam.add(lb, roof(mk(new T.ConeGeometry(1, 1, 4), '#F29BB5', [.2, .99, 0], [.12, .1, .12], [0, Math.PI / 4, 0])));
    isl.add(lam);
    /* 垂柳：樹幹 + 蓬蓬的樹冠 + 垂下的細條 */
    const tr2 = new T.Group();
    tr2.position.set(-.85, -.08, -.5);
    tr2.add(bark(mk(CYL, '#C9A27A', [0, .62, 0], [.1, 1.25, .1], [0, 0, -.1])));
    const can = new T.Group();
    can.position.set(-.1, 1.35, 0);
    [
      [0, 0, 0, .62, '#A8D5A2'],
      [.4, -.12, .1, .42, '#B9D9C2'],
      [-.38, -.1, -.1, .4, '#A8D5A2'],
      [.1, .22, -.2, .36, '#B9D9C2'],
      [-.1, -.02, .38, .32, '#F5C7D5']
    ].forEach(([x, y, z, s, c]) => can.add(leafy(mk(SPH, c, [x, y, z], [s, s * .8, s]))));
    tr2.add(can);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.283,
        r = .5 + (i % 2) * .08,
        len = .5 + (i % 3) * .16,
        pv = new T.Group();
      pv.position.set(-.1 + Math.cos(a) * r, 1.3, Math.sin(a) * r);
      pv.add(mk(CYL, i % 4 == 3 ? '#F5C7D5' : '#BFE0B0', [0, -len / 2, 0], [.014, len, .014]));
      tr2.add(pv);
      sway.push({
        o: pv,
        k: .16,
        p: i * .9,
        ax: 'z'
      })
    }
    isl.add(tr2);
    /* 蘆葦與香蒲、小石頭、小花 */
    function reeds(x, z, n, s) {
      const g = new T.Group();
      g.position.set(x, -.1, z);
      for (let i = 0; i < n; i++) {
        const h = (.55 + ((i * 37) % 10) / 16) * s,
          pv = new T.Group();
        pv.position.set((i % 3 - 1) * .07, 0, (i % 2 - .5) * .09);
        const cat = i % 3 == 0;
        pv.add(mk(CYL, '#8FBF7F', [0, h / 2, 0], [.016, h, .016]));
        if (cat) pv.add(mk(CYL, '#8B5A3C', [0, h + .02, 0], [.032, .16, .032]));
        pv.rotation.z = (i - n / 2) * .06;
        g.add(pv);
        sway.push({
          o: pv,
          k: .07,
          p: i * 1.3 + x,
          ax: 'x'
        })
      }
      return g
    }
    [
      [-1.55, .7, 6, 1],
      [-1.2, 1.3, 5, .9],
      [.2, 1.65, 5, 1],
      [-1.65, -.4, 5, 1.1],
      [1.1, -1.35, 5, .9],
      [.5, -1.6, 4, .8]
    ].forEach(([x, z, n, s]) => isl.add(reeds(x, z, n, s)));
    [
      [.9, .95, .22],
      [-.5, 1.25, .16],
      [1.35, -.7, .14]
    ].forEach(([x, z, s]) => isl.add(rock(mk(ICO, '#D9D2CE', [x, -.05, z], [s, s * .7, s * .85], [.3, .6, 0]))));
    if (K && K.tg && K.tm) {
      const n = 9,
        im = new T.InstancedMesh(K.tg, K.tm, n),
        o3 = new T.Object3D(),
        cA = new T.Color('#86B873'),
        cB = new T.Color('#B2D68A'),
        cq = new T.Color();
      let c = 0;
      for (let tr = 0; c < n && tr < 300; tr++) {
        const a = Math.random() * 6.283,
          r = Math.sqrt(Math.random()) * IR * .85,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        if (Math.hypot(x + .3, z) < .75 || (x > .7 && Math.abs(z - .15) < .55) || Math.hypot(x + .85, z + .5) < .5) continue;
        const sc = .14 + Math.random() * .12;
        o3.position.set(x, -.1, z);
        o3.rotation.set(0, Math.random() * 3.14, 0);
        o3.scale.set(sc * 1.5, sc, sc * 1.5);
        o3.updateMatrix();
        im.setMatrixAt(c, o3.matrix);
        im.setColorAt(c, cq.copy(cA).lerp(cB, Math.random()).multiplyScalar(.85 + Math.random() * .25));
        c++
      }
      im.count = c;
      im.frustumCulled = false;
      im.castShadow = false;
      im.receiveShadow = true;
      isl.add(im)
    }
    [
      [.5, .7, '#F5C7D5'],
      [.15, -1.0, '#fff'],
      [-.95, .55, '#F5DEA0'],
      [.85, -.5, '#B9D8EB'],
      [-.1, 1.0, '#F5C7D5']
    ].forEach(([x, z, c]) => {
      const g = new T.Group();
      g.position.set(x, -.07, z);
      g.add(mk(CYL, '#8FBF7F', [0, .09, 0], [.012, .18, .012]), mk(SPH, c, [0, .2, 0], [.05, .04, .05]));
      isl.add(g)
    });
  }
  /* 睡蓮葉（浮在水面，輕輕上下晃） */
  const pads = [];
  {
    const padG = new T.CircleGeometry(1, 14, .45, Math.PI * 2 - .9);
    padG.rotateX(-Math.PI / 2);
    [
      [-2.1, .4, .26],
      [-1.9, 2.2, .2],
      [2.5, -.9, .22],
      [-2.4, -1.2, .18],
      [2.8, 1.6, .2],
      [.6, -2.5, .22],
      [-.4, 2.6, .18],
      [1.7, -2.0, .16]
    ].forEach(([x, z, s], i) => {
      const g = new T.Group();
      g.position.set(IX + x, WY + .02, IZ + z);
      const p = new T.Mesh(padG, new T.MeshStandardMaterial({
        color: i % 2 ? '#8FC88A' : '#A5D6A0',
        roughness: .7,
        side: 2
      }));
      p.scale.setScalar(s);
      p.rotation.y = i * 1.7;
      g.add(p);
      if (i % 3 == 0) {
        const fl = new T.Group();
        for (let k = 0; k < 6; k++) {
          const pt = mk(ICO, '#F8C9DA', [Math.cos(k * 1.047) * s * .28, s * .1, Math.sin(k * 1.047) * s * .28], [s * .16, s * .2, s * .08], [0, -k * 1.047, .5]);
          pt.castShadow = false;
          fl.add(pt)
        }
        fl.add(mk(SPH, '#F5DEA0', [0, s * .1, 0], [s * .1, s * .08, s * .1]));
        g.add(fl)
      }
      scene.add(g);
      pads.push({
        g,
        p: i * 1.9,
        y: WY + .02
      })
    });
  }
  /* 提示用的小葉子（飄在長椅上方，點它或點小島都會打開） */
  const hint = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,255,255,.16)');
    gr.addColorStop(.6, 'rgba(255,255,255,.05)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 128, 128);
    x.save();
    x.translate(64, 66);
    x.rotate(.6);
    const lg = x.createLinearGradient(-30, -40, 30, 40);
    lg.addColorStop(0, '#9ED98F');
    lg.addColorStop(1, '#4FA46B');
    x.fillStyle = lg;
    x.beginPath();
    x.moveTo(0, -42);
    x.bezierCurveTo(34, -22, 36, 22, 0, 40);
    x.bezierCurveTo(-36, 22, -34, -22, 0, -42);
    x.fill();
    x.lineWidth = 4;
    x.strokeStyle = 'rgba(255,255,255,.95)';
    x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.9)';
    x.lineWidth = 2.6;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(0, 40);
    x.lineTo(0, -30);
    x.moveTo(0, 12);
    x.lineTo(14, -2);
    x.moveTo(0, 12);
    x.lineTo(-14, -2);
    x.moveTo(0, -8);
    x.lineTo(10, -18);
    x.moveTo(0, -8);
    x.lineTo(-10, -18);
    x.stroke();
    x.restore();
    const tex = new T.CanvasTexture(c),
      sp = new T.Sprite(new T.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false
      }));
    sp.scale.set(.8, .8, 1);
    sp.position.set(.55, 1.5, .1);
    isl.add(sp);
    const gl = new T.Sprite(new T.SpriteMaterial({
      map: GLOW,
      color: '#EFFFE0',
      blending: T.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: .06
    }));
    gl.scale.set(1.05, 1.05, 1);
    gl.position.copy(sp.position);
    gl.renderOrder = 1;
    sp.renderOrder = 2;
    isl.add(gl);
    return {
      sp,
      gl
    }
  })();
  const hit = new T.Mesh(new T.SphereGeometry(2.1, 10, 8), new T.MeshBasicMaterial({
    visible: false
  }));
  hit.position.set(.3, .4, 0);
  isl.add(hit);
  /* 燈籠光暈、螢火蟲、兩端的霧 */
  const lampGl = new T.Sprite(new T.SpriteMaterial({
    map: GLOW,
    color: '#FFD9A0',
    blending: T.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0
  }));
  lampGl.scale.set(1.5, 1.5, 1);
  lampGl.position.copy(lampW);
  scene.add(lampGl);
  const FF = 14,
    ffs = [],
    ffp = new Float32Array(FF * 3);
  for (let i = 0; i < FF; i++) ffs.push({
    a: Math.random() * 6.28,
    r: .8 + Math.random() * 2.6,
    y: .2 + Math.random() * 1.4,
    s: .15 + Math.random() * .25,
    p: Math.random() * 6
  });
  const ffg = new T.BufferGeometry();
  ffg.setAttribute('position', new T.BufferAttribute(ffp, 3));
  const ffm = new T.PointsMaterial({
    color: '#FFF3B0',
    size: .3,
    map: GLOW,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending
  });
  const fireflies = new T.Points(ffg, ffm);
  fireflies.frustumCulled = false;
  scene.add(fireflies);
  const WHITE = new T.Color('#ffffff'),
    mists = [];
  [
    [-32, 0],
    [-58, 1],
    [-95, 2],
    [34, 3],
    [62, 4]
  ].forEach(([z, i]) => {
    const m = new T.Sprite(new T.SpriteMaterial({
      map: GLOW,
      color: '#ffffff',
      transparent: true,
      depthWrite: false,
      opacity: .2,
      fog: false
    }));
    const s = 14 + i % 3 * 4;
    m.scale.set(s, s * .5, 1);
    m.position.set(cx(z) + (i % 2 ? 2 : -2), WY + 1.5, z);
    scene.add(m);
    mists.push({
      m,
      x: m.position.x,
      p: i * 1.7
    })
  });

  /* ---------- 夜晚的窗燈：房子與風車的窗戶，發光方式和燈籠一樣（自發光隨夜晚變亮 + 一圈柔光），只是更微弱 ---------- */
  const WINS = [];
  try {
    const sites = [
      [-2.7, -5.4],
      [WM[0], WM[1]]
    ];
    scene.children.forEach(g => {
      if (!g.isGroup || !sites.some(q => Math.hypot(g.position.x - q[0], g.position.z - q[1]) < .05)) return;
      g.updateMatrixWorld(true);
      g.children.forEach(m => {
        if (!m.isMesh || !m.material || !m.material.color || m.material.color.getHexString() !== 'b9d8eb') return;
        const mt = m.material.clone();
        mt.emissive = new T.Color('#FFC77A');
        mt.emissiveIntensity = 0;
        m.material = mt;
        const gl = new T.Sprite(new T.SpriteMaterial({
          map: GLOW,
          color: '#FFD9A0',
          blending: T.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0
        }));
        gl.scale.set(.9, .9, 1);
        gl.position.copy(m.localToWorld(new T.Vector3(0, 0, 3)));
        scene.add(gl);
        WINS.push({
          mt,
          gl,
          c0: mt.color.clone()
        })
      })
    });
  } catch (e) {
    logErr(e)
  }

  /* ---------- 漂流的葉子 ---------- */
  const LEAF_C = ['#9CD08F', '#F0CF7A', '#F4B3C9', '#C6B4EA'],
    leaves = [];
  const leafG = (() => {
    const N = 10,
      Ln = .7,
      pos = [],
      col = [],
      idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N,
        z = (t - .5) * Ln,
        b = Math.max(0, (t - .14) / .86),
        w = (t < .14 ? 0 : .16 * Math.pow(Math.sin(Math.PI * Math.pow(b, .72)), .85)) + .012;
      for (const u of [-1, 0, 1]) {
        pos.push(u * w, u ? w * .55 : 0, z);
        const s = u ? 1.05 : .6;
        col.push(s, s, s)
      }
    }
    for (let i = 0; i < N; i++) {
      const a = i * 3;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5)
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g
  })();

  function spawnLeaf(ci) {
    const c = new T.Color(LEAF_C[ci] || LEAF_C[0]),
      m = new T.MeshStandardMaterial({
        color: c,
        vertexColors: true,
        roughness: .6,
        side: 2,
        transparent: true,
        emissive: c.clone(),
        emissiveIntensity: .08
      });
    const mesh = new T.Mesh(leafG, m);
    mesh.rotation.order = 'YXZ';
    mesh.scale.setScalar(.01);
    mesh.castShadow = false;
    scene.add(mesh);
    if (leaves.length >= 14) {
      const o = leaves.shift();
      scene.remove(o.mesh);
      o.mesh.material.dispose()
    }
    const x0 = IX + 3.3,
      z0 = IZ + .95,
      L0 = {
        mesh,
        m,
        age: 0,
        z: z0,
        x0,
        off0: x0 - cx(z0),
        ph: Math.random() * 6,
        rt: 0,
        t: 0,
        landed: false
      };
    leaves.push(L0);
    return L0
  }

  /* ---------- 每一幀 ---------- */
  let T0 = performance.now(),
    rainT = 0,
    follow = null,
    touched = false,
    sh = false;
  SLP.cbs.push(() => {
    if (sh) {
      sh = false;
      T0 = performance.now();
      requestAnimationFrame(step)
    }
  });
  addEventListener('pointerdown', () => {
    touched = true
  }, true);

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
      day = 1,
      wind = .3,
      wet = 0;
    try {
      rm = !!S.rm;
      day = window.dfv == null ? 1 : window.dfv;
      wind = WX.wind || 0;
      wet = WX.wet || 0
    } catch (e) {
      logErr(e)
    }
    const t = now / 1000,
      night = 1 - day;
    U.uT.value += rm ? 0 : dt;
    U.uDay.value = day;
    U.uNight.value = night;
    for (const r of rips)
      if (r.w > 0) {
        r.z += dt;
        if (r.z > 3.5) r.w = 0
      }
    if (!rm && wet > .25) {
      rainT -= dt;
      if (rainT <= 0) {
        rainT = .16 - .1 * Math.min(1, wet);
        addRip(cx(-4) + (Math.random() - .5) * 6, -8 + Math.random() * 16, .35)
      }
    }
    /* 隨風擺動 */
    if (!rm) {
      const w = .5 + wind * 1.1;
      sway.forEach(s => {
        const v = Math.sin(t * (1 + w * .5) + s.p) * s.k * w;
        if (s.ax === 'z') s.o.rotation.z = v;
        else s.o.rotation.x = v
      });
      pads.forEach(d => {
        d.g.position.y = d.y + Math.sin(t * .9 + d.p) * .012;
        d.g.rotation.y = Math.sin(t * .25 + d.p) * .12
      });
      hint.sp.position.y = 1.5 + Math.sin(t * 1.5) * .06;
      hint.sp.material.rotation = Math.sin(t * .9) * .12
    }
    const hv = hint.hov ? 1.18 : 1;
    hint.sp.scale.x += (.8 * hv - hint.sp.scale.x) * .15;
    hint.sp.scale.y = hint.sp.scale.x;
    hint.gl.material.opacity = .06 + (rm ? 0 : .025 * Math.sin(t * 1.6)) + (hint.hov ? .05 : 0);
    hint.gl.position.y = hint.sp.position.y;
    /* 夜晚：燈籠亮、螢火蟲、霧的顏色 */
    lm.emissiveIntensity = .2 + 1.3 * night;
    lampGl.material.opacity = .06 + .55 * night;
    WINS.forEach(w => {
      w.mt.color.copy(w.c0).lerp(lm.color, night);
      w.mt.emissiveIntensity = 1.5 * night;
      w.mt.envMapIntensity = .1 + .9 * day;
      w.gl.material.opacity = .61 * night;
      w.gl.visible = night > .02
    })
    ffm.opacity = night * .9;
    fireflies.visible = night > .05;
    if (fireflies.visible) {
      const a = ffg.attributes.position;
      ffs.forEach((f, i) => {
        const q = rm ? 0 : t * f.s + f.a;
        a.setXYZ(i, IX + Math.cos(q) * f.r, f.y + Math.sin(t * .8 + f.p) * .15, IZ + Math.sin(q * 1.3) * f.r * .8)
      });
      a.needsUpdate = true
    }
    try {
      mists.forEach(o => {
        o.m.material.color.copy(scene.fog.color).lerp(WHITE, .35);
        o.m.material.opacity = .14 + .1 * day;
        if (!rm) o.m.position.x = o.x + Math.sin(t * .12 + o.p) * .8
      })
    } catch (e) {
      logErr(e)
    }
    /* 葉子 */
    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i];
      l.age += dt;
      if (!l.landed) { // 先從手上輕輕落到水面
        const k = clamp(l.age / .7, 0, 1);
        l.mesh.scale.setScalar((.01 + .99 * sstep(0, .6, k)) * 1.3);
        l.mesh.position.set(l.x0, WY + .04 + (1 - k) * (1 - k) * .55, l.z);
        l.mesh.rotation.set(.2 * (1 - k), 1.2, .3 * (1 - k));
        if (k >= 1) {
          l.landed = true;
          addRip(l.mesh.position.x, l.mesh.position.z, 1);
          try {
            sfx('leaf_float', 'water')
          } catch (e) {
            logErr(e)
          }
        }
        continue
      }
      l.t += dt;
      const sp = (.34 + .6 * sstep(0, 28, l.t)) * (rm ? 1.6 : 1);
      l.z -= sp * dt;
      const z = l.z,
        lat = Math.sin(l.t * .55 + l.ph) * .3,
        tx = cx(z) + lat + l.off0 * (1 - sstep(0, 7, l.t)); // 一開始在碼頭旁，慢慢匯入主流
      l.mesh.position.set(tx, WY + .025 + Math.sin(l.t * 2.1 + l.ph) * .01, z);
      const dxz = -(cx(z - .3) - cx(z + .3)) / .6; // 河道在這裡的走向
      const yaw = Math.atan2(dxz, -1) + Math.sin(l.t * .7 + l.ph) * .55 + (l.ph > 3 ? .4 : -.4);
      l.mesh.rotation.set(Math.sin(l.t * 1.7 + 1) * .06, yaw, Math.sin(l.t * 1.3 + l.ph) * .1);
      l.rt -= dt;
      if (l.rt <= 0) {
        l.rt = 1.1;
        addRip(l.mesh.position.x, l.mesh.position.z, .5)
      }
      l.m.emissiveIntensity = .08 + .45 * night;
      l.m.opacity = clamp((z - LZ) / 14, 0, 1);
      if (z < LZ) {
        scene.remove(l.mesh);
        l.m.dispose();
        leaves.splice(i, 1);
        if (follow === l) follow = null
      }
    }
    /* 放葉子之後，鏡頭輕輕跟著葉子看一小段，然後回到全景（只在使用者沒碰畫面時） */
    if (follow) {
      const l = follow;
      if (touched || !leaves.includes(l)) {
        if (!touched && typeof home === 'function') home();
        follow = null
      } else if (l.landed) {
        const pz = l.mesh.position.z;
        if (pz < -7) {
          follow = null;
          if (typeof home === 'function') home()
        } else if (!(typeof panning !== 'undefined' && panning)) {
          const k = Math.min(1, dt * 1.1);
          tgG.x += (l.mesh.position.x - tgG.x) * k;
          tgG.z += (Math.max(pz, -9) - tgG.z) * k
        }
      }
    }
  }
  requestAnimationFrame(step);

  /* ---------- 點擊偵測 ---------- */
  const rc = new T.Raycaster(),
    mv2 = new T.Vector2();
  hint.hov = false;

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
      return h ? r.distance : false
    } catch (err) {
      return false
    }
  }

  /* ---------- 葉子形狀的輸入框 ---------- */
  const css = document.createElement('style');
  css.textContent = `
#rvm{z-index:21;background:rgba(90,110,130,.22);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 10px)}
.lfcol{display:flex;flex-direction:column;align-items:center;gap:10px;max-height:100%;max-width:100%}
.lfw{position:relative;height:min(62vh,430px);aspect-ratio:300/420;max-width:88vw;animation:lfin .75s cubic-bezier(.2,.9,.3,1) both}
.lfw.go{animation:lfgo 1s cubic-bezier(.45,0,.75,.35) forwards;pointer-events:none}
.lfs{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 14px 22px rgba(60,80,70,.28));transform-origin:50% 100%;animation:lfsw 6s ease-in-out infinite;transition:filter .4s}
.lfw:focus-within .lfs{filter:drop-shadow(0 0 16px rgba(255,255,255,.75)) drop-shadow(0 14px 22px rgba(60,80,70,.25))}
#rvm .lfw textarea{position:absolute;left:18%;right:18%;top:35%;width:auto;height:36%;padding:2px 4px;border:0;border-radius:0;background:transparent;resize:none;outline:none;font:600 16px/1.65 Nunito,system-ui,sans-serif;color:#3F5A47;text-align:center}
#rvm .lfw textarea::placeholder{color:#3F5A47;opacity:.5}
.lfsw{display:flex;gap:12px;justify-content:center}
.lfsw button{width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.18);transition:transform .2s}
.lfsw button[aria-pressed=true]{transform:scale(1.22);box-shadow:0 0 0 3px rgba(255,255,255,.7),0 2px 8px rgba(0,0,0,.2)}
.lfa{display:flex;gap:10px;justify-content:center;transition:opacity .3s}.lfw.go~.lfa,.lfw.go~.lfsw,.lfw.go~.lfn{opacity:0}
.lfn{font-size:12.5px;opacity:.85;text-align:center;max-width:300px;color:#fff;text-shadow:0 1px 6px rgba(40,60,70,.55);transition:opacity .3s}
@media(max-height:560px){.lfn{display:none}.lfw{height:min(58vh,360px)}}
@keyframes lfin{0%{opacity:0;transform:translateY(-40px) rotate(-9deg) scale(.88)}60%{opacity:1}100%{opacity:1;transform:none}}
@keyframes lfsw{50%{transform:rotate(1.4deg)}0%,100%{transform:rotate(-1.4deg)}}
@keyframes lfgo{0%{transform:none;opacity:1}35%{transform:translateY(-12px) rotate(8deg) scale(.96);opacity:1}100%{transform:translate(8vw,22vh) rotate(38deg) scale(.1);opacity:0}}
@media(prefers-reduced-motion:reduce){.lfs{animation:none}.lfw{animation:none}.lfw.go{animation:lfgo .01s forwards}}
`;
  document.head.appendChild(css);
  const PAL = [
    ['#C6E7B4', '#8CCB86'],
    ['#FBE9B0', '#EBC76A'],
    ['#FBD3E0', '#F0A3BD'],
    ['#E4D9F6', '#B9A4E2']
  ];
  document.body.insertAdjacentHTML('beforeend', `<div class="scrim" id="rvm" hidden><div class="lfcol" role="dialog" aria-modal="true" id="rvd"><div class="lfw" id="lfw">
<svg class="lfs" viewBox="0 0 300 420" aria-hidden="true"><defs><linearGradient id="lfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--lf1)"/><stop offset="1" style="stop-color:var(--lf2)"/></linearGradient></defs>
<path d="M150 368C150 392 146 410 138 418" fill="none" stroke="#7DAA74" stroke-width="7" stroke-linecap="round"/>
<path d="M150 14C246 78 288 176 264 262C247 330 196 372 150 372C104 372 53 330 36 262C12 176 54 78 150 14Z" fill="url(#lfg)" stroke="rgba(60,90,60,.14)" stroke-width="2"/>
<path d="M150 372L150 50M150 300C185 280 215 255 238 214M150 300C115 280 85 255 62 214M150 232C178 215 200 195 218 160M150 232C122 215 100 195 82 160M150 168C168 156 182 142 192 120M150 168C132 156 118 142 108 120" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg>
<textarea id="lft" maxlength="200" rows="4"></textarea></div>
<div class="lfsw" id="lfsw"></div>
<div class="lfa"><button class="btn" id="lfx"></button><button class="btn w" id="lfgo" data-sfx="off"></button></div><p class="lfn" id="lfn"></p></div></div>`);
  const $m = document.getElementById('rvm'),
    $w = document.getElementById('lfw'),
    $t = document.getElementById('lft'),
    $sw = document.getElementById('lfsw');
  let ci = 0,
    busy = false;

  function setPal(i) {
    ci = i;
    $m.style.setProperty('--lf1', PAL[i][0]);
    $m.style.setProperty('--lf2', PAL[i][1]);
    $sw.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', k == i))
  }

  function paintTexts() {
    document.getElementById('rvd').setAttribute('aria-label', tr('rvT'));
    $t.placeholder = tr('rvPh');
    $t.setAttribute('aria-label', tr('rvT'));
    document.getElementById('lfn').textContent = tr('rvNote');
    document.getElementById('lfx').innerHTML = ic('close') + ' ' + esc(tr('cancel'));
    document.getElementById('lfgo').innerHTML = ic('eco') + ' ' + esc(tr('rvGo'));
    const nm = tr('rvLeaf');
    $sw.innerHTML = PAL.map((p, k) => `<button type="button" aria-label="${esc(nm[k]||'')}" title="${esc(nm[k]||'')}" style="background:linear-gradient(135deg,${p[0]},${p[1]})"></button>`).join('');
    $sw.querySelectorAll('button').forEach((b, k) => b.onclick = () => setPal(k));
    setPal(ci)
  }

  function openRest() {
    if (busy || !$m.hidden) return;
    try {
      sfx('island')
    } catch (e) {
      logErr(e)
    }
    paintTexts();
    $t.value = '';
    $w.classList.remove('go');
    $m.hidden = false;
    $('card').hidden = true;
    tgG.set(IX + .5, 0, IZ - .6);
    radG = Math.min(radG, 13); // 鏡頭靠近小島
    setTimeout(() => {
      try {
        $t.focus({
          preventScroll: true
        })
      } catch (e) {
        logErr(e)
      }
    }, 600)
  }

  function closeRest(goHome) {
    $m.hidden = true;
    if (goHome && typeof home === 'function')(typeof homeSoft === 'function' ? homeSoft() : home())
  }

  function release() {
    if (busy) return;
    const txt = $t.value.trim();
    if (!txt) {
      toast(tr('rvEmpty'));
      $t.focus();
      return
    }
    busy = true;
    let rm = false;
    try {
      rm = !!S.rm
    } catch (e) {
      logErr(e)
    }
    $w.classList.add('go');
    setTimeout(() => {
      $m.hidden = true;
      busy = false;
      $t.value = ''; // 文字到此為止：不存檔、不同步
      follow = spawnLeaf(ci);
      touched = false;
      radG = Math.max(radG, 12);
      toast(tr('rvDone'))
    }, rm ? 30 : 950)
  }
  document.getElementById('lfx').onclick = () => closeRest(true);
  document.getElementById('lfgo').onclick = release;
  $m.addEventListener('pointerdown', e => {
    if (e.target === $m && !$t.value.trim() && !busy) closeRest(true)
  });
  addEventListener('keydown', e => {
    if ($m.hidden) return;
    if (e.key === 'Escape' && !busy) {
      closeRest(true)
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      release()
    }
  });
  window.RV = {
    pick,
    open: openRest,
    addRip,
    spawn: spawnLeaf,
    cx,
    IX,
    IZ
  };
})();
