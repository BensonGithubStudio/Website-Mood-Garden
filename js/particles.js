/* ============================================================================
 * js/particles.js — 粒子特效與小動物互動
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・愛心／星星／泡泡／火花等粒子（burst、partStep）、水滴貼圖 WDROP。
 *   ・點擊小動物的互動：pickCr（選取）、pokeG（戳一下）、actStep（各種動物的
 *     反應動畫）。
 *   ・平移手感常數（PAN_GAIN、panV…）與時鐘 clock。
 *
 * 需要先載入：audio.js、state.js、world.js、garden-scene.js、camera.js、
 *   creatures.js
 * 提供給其他檔案：parts、ACT、PMS、WDROP、burst、partStep、pickCr、pokeG、
 *   actStep、PAN_GAIN、panV、panT、panning、clock
 * 載入順序：第 18 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const parts = [],
  ACT = {
    bee: 1.3,
    butterfly: 1.5,
    bird: 1.3,
    ladybug: 1.5,
    snail: 1.8,
    frog: 1.2
  };
let PMS = null;
if (ok) {
  const mkT = fn => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    fn(c.getContext('2d'));
    return new THREE.CanvasTexture(c)
  };
  const TX = {
      heart: mkT(x => {
        x.fillStyle = '#F7849F';
        x.beginPath();
        x.moveTo(32, 56);
        x.bezierCurveTo(2, 34, 10, 6, 32, 22);
        x.bezierCurveTo(54, 6, 62, 34, 32, 56);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,.55)';
        x.beginPath();
        x.ellipse(21, 22, 6, 4, -.6, 0, 6.3);
        x.fill()
      }),
      star: mkT(x => {
        x.fillStyle = '#FFD54A';
        x.strokeStyle = '#FFD54A';
        x.lineJoin = 'round';
        x.lineWidth = 5;
        x.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 12 : 27,
            a = -Math.PI / 2 + i * Math.PI / 5;
          x[i ? 'lineTo' : 'moveTo'](32 + Math.cos(a) * r, 34 + Math.sin(a) * r)
        }
        x.closePath();
        x.fill();
        x.stroke()
      }),
      bubble: mkT(x => {
        x.strokeStyle = 'rgba(255,255,255,.95)';
        x.lineWidth = 3;
        x.fillStyle = 'rgba(190,225,250,.35)';
        x.beginPath();
        x.arc(32, 32, 24, 0, 6.3);
        x.fill();
        x.stroke();
        x.fillStyle = 'rgba(255,255,255,.9)';
        x.beginPath();
        x.ellipse(24, 23, 6, 3.5, -.6, 0, 6.3);
        x.fill()
      })
    },
    sm = m => new THREE.SpriteMaterial({
      map: m,
      transparent: true,
      depthWrite: false
    });
  PMS = {
    heart: sm(TX.heart),
    star: sm(TX.star),
    bubble: sm(TX.bubble),
    spark: new THREE.SpriteMaterial({
      map: GLOW,
      color: '#FFF1B0',
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
  }
}
let WDROP = null;
if (ok) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#6DB6EC';
  x.strokeStyle = '#fff';
  x.lineWidth = 4;
  x.lineJoin = 'round';
  x.beginPath();
  x.moveTo(32, 6);
  x.bezierCurveTo(26, 18, 12, 32, 12, 42);
  x.arc(32, 42, 20, Math.PI, 0, true);
  x.bezierCurveTo(52, 32, 38, 18, 32, 6);
  x.closePath();
  x.fill();
  x.stroke();
  x.fillStyle = 'rgba(255,255,255,.85)';
  x.beginPath();
  x.ellipse(24, 42, 4, 7, .35, 0, 6.3);
  x.fill();
  WDROP = new THREE.CanvasTexture(c);
  PMS.drop = new THREE.SpriteMaterial({
    map: WDROP,
    transparent: true,
    depthWrite: false
  })
}

function burst(type, p, n) {
  if (!PMS) return;
  const k = Math.max(1, rad / 13);
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(PMS[type].clone()),
      sc = (.2 + Math.random() * .12) * k;
    s.position.set(p.x + (Math.random() - .5) * .3, p.y + .2, p.z + (Math.random() - .5) * .3);
    s.scale.set(sc, sc, 1);
    s.userData = {
      v: new THREE.Vector3((Math.random() - .5) * .6, .5 + Math.random() * .6, (Math.random() - .5) * .6),
      l: 0,
      m: 1 + Math.random() * .7,
      sc
    };
    scene.add(s);
    parts.push(s)
  }
}

function partStep(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const s = parts[i],
      u = s.userData;
    u.l += dt;
    s.position.addScaledVector(u.v, dt);
    u.v.multiplyScalar(1 - dt * .8);
    const f = u.l / u.m;
    s.material.opacity = Math.min(1, (1 - f) * 1.6);
    const k = u.sc * (1 + f * .3);
    s.scale.set(k, k, 1);
    if (f >= 1) {
      scene.remove(s);
      s.material.dispose();
      parts.splice(i, 1)
    }
  }
  const hs = Math.max(1, rad / 13) * .38;
  cr.forEach(c => c.userData.hb.scale.setScalar(hs / c.scale.x));
  (window.FROGS || []).forEach(f => f.g.userData.hb.scale.setScalar(hs / f.g.scale.x))
}

function pickCr(e) {
  if (!ok) return null;
  mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mv, cam);
  const hb = cr.map(c => c.userData.hb);
  (window.FROGS || []).forEach(f => {
    if (f.g.visible) hb.push(f.g.userData.hb)
  });
  const h = ray.intersectObjects(hb, false)[0];
  return h ? h.object.userData.cr : null
}

function pokeG(c) {
  const F = (window.FROGS || []).find(f => f.g === c),
    u = F || c.userData,
    type = F ? 'frog' : u.type;
  if (u.act || (F && F.u < 1)) return;
  sfx('animal_' + type, 'animal');
  if (S.rm) {
    burst((type == 'bee' || type == 'bird') ? 'heart' : (type == 'snail' || type == 'frog') ? 'bubble' : 'spark', c.position, 3);
    return
  }
  u.act = {
    t: 0,
    p0: c.position.clone(),
    r0: c.rotation.y,
    s0: c.scale.x,
    f1: 0
  };
  burst({
    bee: 'heart',
    bird: 'heart',
    butterfly: 'spark',
    ladybug: 'spark',
    snail: 'bubble',
    frog: 'bubble'
  } [type], c.position, type == 'butterfly' ? 6 : 3)
}

function actStep(g, u, dt, t, type) {
  const a = u.act,
    P = g.position;
  a.t += dt;
  const f = Math.min(1, a.t / ACT[type]),
    ea = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3),
    s0 = a.s0,
    fl = (w, s) => {
      if (w) {
        w[0].rotation.z = s;
        w[1].rotation.z = -s
      }
    };
  if (type == 'bee') {
    const ph = f * 6.2832;
    P.set(a.p0.x + Math.sin(a.r0) * Math.sin(ph) * .55, a.p0.y + (1 - Math.cos(ph)) * .55, a.p0.z + Math.cos(a.r0) * Math.sin(ph) * .55);
    g.rotation.x = -ph;
    fl(u.w, Math.sin(t * 80) * .7);
    if (Math.random() < dt * 10) burst('heart', P, 1)
  } else if (type == 'butterfly') {
    const k = 1 - f * .5;
    P.set(a.p0.x + Math.cos(f * 12.5) * .35 * k, a.p0.y + Math.sin(f * Math.PI) * .9, a.p0.z + Math.sin(f * 12.5) * .35 * k);
    g.rotation.y = a.r0 + f * 12.5;
    fl(u.w, .3 + (Math.sin(t * 38) + 1) * .45);
    if (Math.random() < dt * 12) burst('spark', P, 1)
  } else if (type == 'bird') {
    const hop = Math.abs(Math.sin(f * Math.PI * 2)) * .3,
      sq = 1 + (1 - Math.min(1, hop * 6)) * .12;
    P.y = surf(P.x, P.z) + hop;
    g.rotation.y = a.r0 + ea(f) * 6.2832;
    g.scale.set(s0 * sq, s0 / sq, s0 * sq);
    fl(u.w, Math.sin(t * 30) * .8);
    if (!a.f1 && f > .5) {
      a.f1 = 1;
      burst('heart', P, 3)
    }
  } else if (type == 'ladybug') {
    const roll = f < .25 ? ea(f / .25) * Math.PI : f < .7 ? Math.PI + Math.sin((f - .25) * 70) * .15 : Math.PI * (1 - ea((f - .7) / .3));
    g.rotation.z = roll;
    g.rotation.x = (f > .25 && f < .7) ? Math.sin((f - .25) * 50) * .12 : 0;
    P.y = surf(P.x, P.z) + .1 * Math.sin(Math.min(roll, Math.PI));
    if (!a.f1 && f > .8) {
      a.f1 = 1;
      burst('spark', P, 4)
    }
  } else if (type == 'snail') {
    const zs = f < .25 ? 1 - .45 * (f / .25) : f < .65 ? .55 : .55 + .5 * ea((f - .65) / .35) - .05 * Math.sin((f - .65) / .35 * Math.PI);
    g.scale.set(s0, s0 * (.85 + .15 * zs), s0 * zs);
    g.rotation.x = f < .65 ? .3 * Math.min(1, f / .25) : .3 * (1 - ea((f - .65) / .35));
    if (!a.f1 && f > .65) {
      a.f1 = 1;
      burst('bubble', P, 4)
    }
  } else {
    const j = Math.max(0, (f - .2) / .8),
      pf = f < .2 ? f / .2 : 0,
      sx = f < .2 ? 1 + .25 * pf : 1 + .05 * Math.sin(j * Math.PI),
      sy = f < .2 ? 1 - .15 * pf : 1 + .12 * Math.sin(j * Math.PI);
    P.y = a.p0.y + Math.sin(j * Math.PI) * .9;
    g.rotation.y = a.r0 + j * Math.PI;
    g.scale.set(s0 * sx, s0 * sy, s0 * sx);
    if (!a.f1 && f > .9) {
      a.f1 = 1;
      burst('bubble', P, 5)
    }
  }
  if (f >= 1) {
    g.rotation.x = 0;
    g.rotation.z = 0;
    g.scale.setScalar(s0);
    if (type == 'bee' || type == 'butterfly') P.copy(a.p0);
    else P.y = surf(P.x, P.z) + (type == 'frog' ? .03 : 0);
    u.act = null;
    if (u.v) {
      u.v.set(0, 0, 0);
      u.hold = .6
    } else u.wait = .6;
    return false
  }
  return true
}
const PAN_GAIN = 1.6,
  panV = {
    x: 0,
    z: 0
  };
let panT = 0,
  panning = false; /* PAN_GAIN：平移增益，想再多一點就調大 */
const clock = new THREE.Clock();
