/* ============================================================================
 * js/weather.js — 天氣系統
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・依最近的心情決定天氣（WT 天氣表、curWx、setWeather）：雲量、下雨、彩
 *     虹、風、陽光、濕度等，並平滑過渡（WX 目前值、wxT 目標值）。
 *   ・包含彩虹、雨滴等天氣視覺效果的建立，與每一幀更新用的 wxFrame。
 *
 * 需要先載入：audio.js、state.js、world.js、three-utils.js、garden-scene.js
 * 提供給其他檔案：DROPM、WT、WXK、WX、wxT、curWx、setWeather、wxm、rbG、
 *   colorFlutter、FROGS、wxFrame
 * 載入順序：第 17 個（共 33 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const DROPM = new THREE.MeshStandardMaterial({
  color: '#E6F4FF',
  roughness: .05,
  metalness: .2,
  transparent: true,
  opacity: .85,
  emissive: new THREE.Color('#9CC8EE'),
  emissiveIntensity: .25
});
const WT = {
  none: {
    cover: 0,
    rain: 0,
    flt: 0,
    fx: .3,
    fy: .3,
    wind: .25,
    rb: 0,
    sun: 0,
    wet: 0,
    dark: 0,
    pink: 0
  }
};
Object.assign(WT, {
  happy: {
    flt: .35,
    fx: 1.4,
    fy: .2,
    wind: 1,
    fc: 'calm'
  },
  excited: {
    cover: .2,
    rb: 1,
    wind: .3
  },
  calm: {
    cover: .15,
    flt: .35,
    fx: 1.4,
    fy: .2,
    wind: 1,
    fc: 'calm'
  },
  loved: {
    cover: .15,
    flt: .8,
    fx: .3,
    fy: .5,
    wind: .35,
    pink: 1,
    fc: 'loved'
  },
  sad: {
    cover: .9,
    rain: .8,
    wet: 1,
    wind: .2
  },
  anxious: {
    cover: 1,
    dark: 1,
    flt: .5,
    fx: 2,
    fy: .15,
    wind: 1.5,
    fc: 'anx'
  }
});
const WXK = Object.keys(WT.none),
  WX = {
    ...WT.none
  };
let wxT = {
  ...WT.none
};

function curWx() {
  if (S.wx) return S.wx;
  const ks = Object.keys(S.e || {}).sort();
  for (let i = ks.length - 1; i >= 0; i--) {
    const e = S.e[ks[i]];
    if (e && e.mood) return e.mood
  }
  return null
}

function setWeather(m, now) {
  window.wxm = S.wxo ? null : m;
  ambient(window.wxm);
  wxT = {
    ...WT.none,
    ...(WT[window.wxm || 'none'] || {})
  };
  if (window.colorFlutter) colorFlutter(wxT.fc || 'loved');
  if (now) Object.assign(WX, wxT);
  if (window.applyTime) applyTime();
  refresh()
}
if (ok) {
  function rbGeo(r, c) {
    const T = 64,
      g = new THREE.TorusGeometry(r, .027, 8, T, Math.PI * .75),
      col = new Float32Array(g.attributes.position.count * 4),
      cc = new THREE.Color(c);
    for (let j = 0; j <= 8; j++)
      for (let i = 0; i <= T; i++) {
        const k = (j * (T + 1) + i) * 4,
          f = i / T;
        col[k] = cc.r;
        col[k + 1] = cc.g;
        col[k + 2] = cc.b;
        col[k + 3] = Math.min(1, f * 6 + .35) * Math.pow(1 - f, 1.4)
      }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g
  }
  scene.add(cam);
  const D = 70;
  const wcm = new THREE.MeshStandardMaterial({
      color: '#fff',
      roughness: 1,
      fog: false,
      emissive: new THREE.Color('#fff'),
      emissiveIntensity: .5
    }),
    wc = new THREE.Group(),
    wcl = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    [
      [0, 0, 1],
      [1, -.15, .78],
      [-1, -.15, .78],
      [.5, .35, .7],
      [-.45, .3, .62]
    ].forEach(([x, y, s]) => {
      const m = mk(SPH, '#fff', [x, y, 0], [s, s * .85, s * .8], null, wcm);
      m.castShadow = false;
      g.add(m)
    });
    wc.add(g);
    wcl.push({
      g,
      o: (i % 7) / 3.5 - 1 + (Math.random() - .5) * .15,
      h: i < 7 ? 0 : 1,
      s: .7 + Math.random() * .5,
      sp: .6 + Math.random() * .8
    })
  }
  cam.add(wc);
  const rb = new THREE.Group();
  ['#F6BDBD', '#F9D5B5', '#F8EBB8', '#CBE9C0', '#C3E1F3', '#CDC8F0', '#E4CBF0'].forEach((c, i) => rb.add(new THREE.Mesh(rbGeo(1 - i * .05, c), new THREE.MeshBasicMaterial({
    color: '#ffffff',
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    side: 2
  }))));
  scene.add(rb);
  const rbG = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW,
    color: '#FFF1F6',
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0
  }));
  rbG.visible = false;
  scene.add(rbG);
  window.rbG = rbG;
  const sunH = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW,
    color: '#FFE9A8',
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    fog: false,
    opacity: 0
  }));
  cam.add(sunH);
  const RN = 1000,
    rp = new Float32Array(RN * 6),
    rs = [];
  for (let i = 0; i < RN; i++) rs.push({
    x: WXB.x0 + Math.random() * (WXB.x1 - WXB.x0),
    y: Math.random() * 9,
    z: (Math.random() - .5) * WXB.z,
    v: 9 + Math.random() * 3
  });
  const rg2 = new THREE.BufferGeometry();
  rg2.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg2, new THREE.LineBasicMaterial({
    color: '#D9EAFB',
    transparent: true,
    opacity: .6,
    depthWrite: false
  }));
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  const FN = 180,
    fl = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({
      roughness: .7,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: .12
    }), FN),
    fs = [],
    dm2 = new THREE.Object3D();
  for (let i = 0; i < FN; i++) fs.push({
    x: WXB.x0 + Math.random() * (WXB.x1 - WXB.x0),
    y: Math.random() * 8,
    z: (Math.random() - .5) * WXB.z,
    ph: Math.random() * 6,
    v: .6 + Math.random() * .8,
    r: Math.random() * 6
  });
  fl.frustumCulled = false;
  fl.visible = false;
  scene.add(fl);
  const PAL = {
    loved: ['#F7B6CB', '#FBD3E1', '#FFFFFF', '#F29BB5'],
    calm: ['#FFFFFF', '#E8F4E0', '#F6F2E0'],
    anx: ['#8FBF7F', '#B5A6D8', '#C9B58A', '#A9D09A']
  };
  window.colorFlutter = fc => {
    const pl = PAL[fc] || PAL.loved;
    for (let i = 0; i < FN; i++) fl.setColorAt(i, new THREE.Color(pl[i % pl.length]).offsetHSL(0, 0, (Math.random() - .5) * .08));
    fl.instanceColor.needsUpdate = true
  };
  colorFlutter('loved');

  function pudGeo(cx, cz, r, sd, off) {
    const N = 32,
      R = [.4, .75, 1],
      pos = [cx, gh(cx, cz) + .03 + off, cz],
      idx = [],
      nf = a => 1 + .18 * Math.sin(2 * a + sd) + .1 * Math.sin(3 * a + sd * 2) + .06 * Math.sin(5 * a + sd * 3);
    R.forEach(q => {
      for (let i = 0; i < N; i++) {
        const a = i / N * 6.2832,
          rr = r * q * nf(a),
          x = cx + Math.cos(a) * rr,
          z = cz + Math.sin(a) * rr;
        pos.push(x, gh(x, z) + .03 + off, z)
      }
    });
    for (let i = 0; i < N; i++) idx.push(0, 1 + (i + 1) % N, 1 + i);
    for (let k = 0; k < 2; k++)
      for (let i = 0; i < N; i++) {
        const a = 1 + k * N + i,
          b = 1 + k * N + (i + 1) % N,
          c = a + N,
          d = b + N;
        idx.push(a, b, c, b, d, c)
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => i % 3 == 1 ? 1 : 0), 3));
    g.setIndex(idx);
    return g
  }
  const PD = [
      [2.9, 2.4, 1.5],
      [-3.3, -.9, 1.3],
      [4.6, -2.2, .9],
      [-1.2, 3.9, .8], ...PD2
    ],
    pud = new THREE.Group(),
    pm = PD.map(([x, z, r]) => {
      const m = new THREE.Mesh(pudGeo(x, z, r, x * 3 + z, 0), new THREE.MeshStandardMaterial({
        color: '#8DB8DA',
        roughness: .05,
        metalness: 0,
        transparent: true,
        opacity: 0,
        emissive: new THREE.Color('#7FB2E0'),
        emissiveIntensity: .35,
        side: 2,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2
      }));
      pud.add(m);
      const rim = new THREE.Mesh(pudGeo(x, z, r * 1.2, x * 3 + z, -.012), new THREE.MeshBasicMaterial({
          color: '#5F7A55',
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: 2,
          polygonOffset: true,
          polygonOffsetFactor: -1
        })),
        hi = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0,
          depthWrite: false
        }));
      hi.rotation.x = -Math.PI / 2;
      hi.position.set(x - r * .2, gh(x, z) + .07, z - r * .25);
      hi.scale.set(r * .5, r * .16, 1);
      pud.add(rim, hi);
      m.userData.ex = [rim, hi];
      const rr = [0, 1, 2].map(() => {
        const q = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 32), new THREE.MeshBasicMaterial({
          color: '#fff',
          transparent: true,
          opacity: 0,
          depthWrite: false
        }));
        q.rotation.x = -Math.PI / 2;
        q.position.set(x + (Math.random() - .5) * r * .8, gh(x, z) + .05, z + (Math.random() - .5) * r * .8);
        pud.add(q);
        return q
      });
      return {
        m,
        rr,
        r
      }
    });
  pud.visible = false;
  scene.add(pud);
  const mkFrog = () => {
      const fg = new THREE.Group(),
        FG = '#8FD18A';
      [mk(SPH, FG, [0, .1, 0], [.15, .1, .17]), mk(SPH, '#DDF5C8', [0, .07, .07], [.11, .07, .1]), mk(SPH, FG, [.08, .2, .1], [.05, .05, .05]), mk(SPH, FG, [-.08, .2, .1], [.05, .05, .05]), mk(SPH, '#fff', [.08, .21, .135], [.035, .035, .03]), mk(SPH, '#fff', [-.08, .21, .135], [.035, .035, .03]), mk(SPH, '#3A3A3A', [.08, .215, .16], [.018, .02, .012]), mk(SPH, '#3A3A3A', [-.08, .215, .16], [.018, .02, .012]), mk(SPH, '#F59AB3', [.1, .12, .15], [.03, .02, .01]), mk(SPH, '#F59AB3', [-.1, .12, .15], [.03, .02, .01]), mk(SPH, '#7CC47A', [.13, .05, -.07], [.06, .05, .1]), mk(SPH, '#7CC47A', [-.13, .05, -.07], [.06, .05, .1])].forEach(o => {
        o.castShadow = false;
        fg.add(o)
      });
      fg.scale.setScalar(1.4);
      const hb = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({
        visible: false
      }));
      hb.position.y = .12;
      fg.add(hb);
      fg.userData.hb = hb;
      hb.userData.cr = fg;
      fg.visible = false;
      scene.add(fg);
      return fg
    },
    frogs = [0, 1, 4, 5].map(i => ({
      g: mkFrog(),
      i,
      u: 1,
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      wait: 1 + i * .8
    }));
  frogs.forEach(f => f.g.position.set(PD[f.i][0], gh(PD[f.i][0], PD[f.i][1]) + .03, PD[f.i][1]));
  window.FROGS = frogs;
  window.wxFrame = function(dt, t, rm) {
    const k = 1 - Math.pow(.12, dt);
    let ch = 0;
    WXK.forEach(n => {
      const d = wxT[n] - WX[n];
      if (Math.abs(d) > .002) {
        WX[n] += d * k;
        ch = 1
      }
    });
    if (ch && window.applyTime) applyTime();
    const dfv = window.dfv == null ? 1 : window.dfv,
      vh = Math.tan(cam.fov * Math.PI / 360) * D,
      hw = vh * cam.aspect;
    wc.visible = WX.cover > .03;
    if (wc.visible) {
      const col = new THREE.Color('#FFFFFF').lerp(new THREE.Color('#9FAECB'), Math.min(1, WX.rain * 1.1)).lerp(new THREE.Color('#6F6A94'), WX.dark).multiplyScalar(.45 + .55 * dfv);
      wcm.color.copy(col);
      wcm.emissive.copy(col);
      wcl.forEach(c => {
        if (!rm) c.o += dt * (.012 + WX.wind * .02) * c.sp;
        if (c.o > 1.25) c.o -= 2.5;
        c.g.position.set(c.o * hw * 1.1, vh * (c.h ? .7 : .88), -D);
        c.g.scale.setScalar(vh * .2 * c.s * Math.min(1, WX.cover * 1.3))
      })
    }
    rb.visible = WX.rb > .02 && window.sunDir != null;
    if (rb.visible) {
      const sd = window.sunDir,
        dl = Math.hypot(sd.x, sd.z) || 1,
        dx = -sd.x / dl,
        dz = -sd.z / dl,
        H = Math.min(15.5, Math.max(9, 16.5 - 7.5 * Math.max(0, window.sunE || 0))),
        op = .38 * WX.rb * Math.min(1, dfv * 1.4),
        ext = 17.5 * Math.abs(dx) + 9 * Math.abs(dz);
      rb.position.set(MX + dx * (ext - 2.5 + H), -.3, dz * (ext - 2.5 + H));
      rb.rotation.y = Math.atan2(-dz, dx);
      rb.scale.set(-H, H, 1);
      rb.children.forEach(m => m.material.opacity = op);
      rbG.visible = true;
      rbG.position.set(MX + dx * (ext - 2.2), .8, dz * (ext - 2.2));
      rbG.scale.set(9, 4.5, 1);
      rbG.material.opacity = op * .7
    } else rbG.visible = false;
    sunH.visible = WX.sun > .02;
    if (sunH.visible) {
      sunH.position.set(hw * .62, vh * .74, -D);
      sunH.scale.set(vh * 1.5, vh * 1.5, 1);
      sunH.material.opacity = .75 * WX.sun * dfv
    }
    rain.visible = WX.rain > .02 && !rm;
    if (rain.visible) {
      const n = Math.floor(RN * Math.min(1, WX.rain));
      rg2.setDrawRange(0, n * 2);
      for (let i = 0; i < n; i++) {
        const d = rs[i];
        d.y -= d.v * dt;
        if (d.y < 0) {
          d.y = 8 + Math.random() * 2;
          d.x = WXB.x0 + Math.random() * (WXB.x1 - WXB.x0);
          d.z = (Math.random() - .5) * WXB.z
        }
        const o = i * 6;
        rp[o] = d.x;
        rp[o + 1] = d.y;
        rp[o + 2] = d.z;
        rp[o + 3] = d.x - .05 * (1 + WX.wind);
        rp[o + 4] = d.y + .5;
        rp[o + 5] = d.z
      }
      rg2.attributes.position.needsUpdate = true
    }
    fl.visible = WX.flt > .02 && !rm;
    if (fl.visible) {
      const n = Math.floor(FN * Math.min(1, WX.flt));
      fl.count = n;
      for (let i = 0; i < n; i++) {
        const s = fs[i];
        s.y -= WX.fy * s.v * dt;
        s.x += WX.fx * s.v * dt + Math.sin(t * 1.3 + s.ph) * .25 * dt;
        s.z += Math.sin(t * .9 + s.ph) * .2 * dt;
        if (s.y < .1 || s.x > WXB.x1) {
          s.y = 6 + Math.random() * 3;
          s.x = WX.fx > .8 ? WXB.x0 : WXB.x0 + Math.random() * (WXB.x1 - WXB.x0);
          s.z = (Math.random() - .5) * WXB.z
        }
        dm2.position.set(s.x, s.y, s.z);
        dm2.rotation.set(t * s.v + s.r, t * .7 + s.ph, Math.sin(t + s.ph) * .8);
        dm2.scale.set(.075, .015, .05);
        dm2.updateMatrix();
        fl.setMatrixAt(i, dm2.matrix)
      }
      fl.instanceMatrix.needsUpdate = true
    }
    // Hide the fixed puddle overlays; their underlying ground still uses the
    // usual soil-and-grass material, including wet-ground shading during rain.
    pud.visible = false;
    frogs.forEach(F => {
      const fg = F.g,
        fr = F;
      fg.visible = WX.wet > .35;
      if (F.act && actStep(fg, F, dt, t, 'frog')) return;
      if (fg.visible && !rm) {
        fr.wait -= dt;
        if (fr.u >= 1) {
          fg.scale.setScalar(1.4);
          if (fr.wait <= 0) {
            const P0 = PD[fr.i],
              a = Math.random() * 6.283,
              rr = P0[2] * .5 * Math.sqrt(Math.random());
            fr.from.copy(fg.position);
            fr.to.set(P0[0] + Math.cos(a) * rr, 0, P0[1] + Math.sin(a) * rr);
            fr.to.y = gh(fr.to.x, fr.to.z) + .03;
            fr.u = 0;
            fr.wait = 1.5 + Math.random() * 2.5;
            fg.rotation.y = Math.atan2(fr.to.x - fr.from.x, fr.to.z - fr.from.z)
          }
        } else {
          fr.u = Math.min(1, fr.u + dt / .55);
          const u = fr.u,
            sq = 1 + Math.sin(u * Math.PI) * .2;
          fg.position.lerpVectors(fr.from, fr.to, u);
          fg.position.y += Math.sin(u * Math.PI) * .3;
          fg.scale.set(1.4 / Math.sqrt(sq), 1.4 * sq, 1.4 / Math.sqrt(sq))
        }
      }
    });
    (window.GRS || []).forEach(g => {
      g.material.roughness = 1 - .5 * WX.wet;
      g.material.color.setScalar(1 - .16 * WX.wet)
    })
  }
}
