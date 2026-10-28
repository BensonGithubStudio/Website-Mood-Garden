/* ============================================================================
 * js/creatures.js — 花園裡的小動物與佈置模式的滑動
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・依心情對應的小動物（蜜蜂、小鳥、瓢蟲、蝴蝶、蝸牛）：建立（makeCr）、依
 *     花朵數量同步（syncCr）、每一幀的移動（crStep），以及蜜蜂的飛行
 *     （beeStep）。
 *   ・「佈置花園」模式的狀態（arrange、drag…）、花朵被放開後滑回原位的動畫
 *     （slideBack／slideDrop／slideStep）、選取圈 selRing、setArrange。
 *
 * 需要先載入：state.js、i18n.js、world.js、three-utils.js、camera.js
 * 提供給其他檔案：beeStep、cr、CONE、CT、CM、arrange、drag、dm、dragOK、
 *   dragO、slides、selRing、flowersOf、makeCr、syncCr、crStep、slideBack、
 *   slideDrop、slideStep、setArrange
 * 載入順序：第 16 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

function beeStep(b, dt, t) {
  const u = b.userData,
    p = b.position;
  if (!u.tg) {
    u.tg = new THREE.Vector3();
    u.v = new THREE.Vector3();
    u.hold = 0;
    u.pick = 1;
    p.set((Math.random() - .5) * 10, 1.2, (Math.random() - .5) * 10)
  }
  if (u.hold > 0) {
    u.hold -= dt;
    u.v.multiplyScalar(.9)
  } else {
    if (u.pick || p.distanceTo(u.tg) < .3) {
      if (!u.pick && u.fl) {
        u.hold = .5 + Math.random() * 1.5;
        u.fl = 0
      } else {
        u.pick = 0;
        const ks = Object.values(flowers);
        if (ks.length && Math.random() < .5) {
          const f = ks[Math.random() * ks.length | 0];
          u.tg.set(f.position.x + (Math.random() - .5) * .4, f.position.y + 1.2 * f.userData.base + Math.random() * .5, f.position.z + (Math.random() - .5) * .4);
          u.fl = 1
        } else {
          const a = Math.random() * 6.283,
            r = Math.random() * 6.5;
          u.tg.set(Math.cos(a) * r, .8 + Math.random() * 1.8, Math.sin(a) * r);
          u.fl = 0
        }
      }
    }
    const d = u.tg.clone().sub(p).normalize().multiplyScalar(1.4 + Math.random() * .02 + Math.sin(t * 2 + u.i) * .4);
    u.v.lerp(d, 1 - Math.pow(.03, dt));
    p.addScaledVector(u.v, dt)
  }
  p.y += Math.sin(t * 14 + u.i) * .004;
  p.x += Math.sin(t * 7 + u.i * 3) * .003;
  if (u.v.length() > .15) {
    let a = Math.atan2(u.v.x, u.v.z) - b.rotation.y;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    b.rotation.y += a * Math.min(1, dt * 6)
  }
}
const cr = [],
  CONE = new THREE.ConeGeometry(1, 1, 8),
  CT = {
    bee: {
      sp: 1.5,
      fly: 1,
      h: .5
    },
    butterfly: {
      sp: .85,
      fly: 1,
      h: .9
    },
    ladybug: {
      sp: .28
    },
    snail: {
      sp: .1
    },
    bird: {
      sp: .8
    }
  },
  CM = {
    happy: 'bee',
    excited: 'bird',
    calm: 'ladybug',
    loved: 'butterfly',
    sad: 'snail',
    anxious: 'butterfly'
  };
let arrange = false,
  drag = null,
  dm = 0,
  dragOK = true,
  dragO = null;
const slides = [];
const selRing = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 8, 32), new THREE.MeshBasicMaterial({
  color: '#F29BB5'
}));
selRing.rotation.x = Math.PI / 2;
selRing.visible = false;
scene.add(selRing);

function flowersOf(m) {
  return Object.values(flowers).filter(f => f.userData.mood == m)
}

function makeCr(m) {
  const type = CM[m],
    g = new THREE.Group(),
    ns = o => {
      o.castShadow = false;
      return o
    },
    a = (...o) => o.forEach(x => {
      ns(x);
      g.add(x)
    }),
    pv = (x, y, z) => {
      const p = new THREE.Group();
      p.position.set(x, y, z);
      g.add(p);
      return p
    };
  if (type == 'bee') {
    a(mk(SPH, '#F5D04A', [0, 0, 0], [.09, .08, .12]), mk(SPH, '#5B4A3A', [0, .01, -.06], [.085, .075, .035]), mk(SPH, '#5B4A3A', [0, 0, .1], [.055, .05, .045]));
    const l = pv(.04, .07, 0),
      r = pv(-.04, .07, 0);
    l.add(ns(mk(SPH, '#EAF6FF', [.05, 0, 0], [.06, .012, .04])));
    r.add(ns(mk(SPH, '#EAF6FF', [-.05, 0, 0], [.06, .012, .04])));
    g.userData.w = [l, r]
  } else if (type == 'butterfly') {
    const c = m == 'loved' ? '#F5A8C4' : '#B7A2E0',
      c2 = m == 'loved' ? '#FBD3E1' : '#D9CDF2';
    a(mk(SPH, '#5B4A3A', [0, 0, 0], [.025, .025, .09]));
    const l = pv(.01, .02, 0),
      r = pv(-.01, .02, 0);
    [
      [l, 1],
      [r, -1]
    ].forEach(([p, s]) => {
      p.add(ns(mk(SPH, c, [s * .11, 0, .03], [.12, .012, .09])), ns(mk(SPH, c2, [s * .08, 0, -.06], [.08, .012, .06])))
    });
    g.userData.w = [l, r]
  } else if (type == 'ladybug') {
    a(mk(SPH, '#F26B6B', [0, .045, 0], [.075, .055, .09]), mk(SPH, '#3D3333', [0, .035, .085], [.045, .04, .035]), mk(SPH, '#3D3333', [.03, .092, .01], [.018, .012, .018]), mk(SPH, '#3D3333', [-.03, .092, .01], [.018, .012, .018]), mk(SPH, '#3D3333', [0, .098, -.04], [.018, .012, .018]))
  } else if (type == 'snail') {
    a(mk(SPH, '#F3E3CF', [0, .03, 0], [.055, .035, .16]), mk(SPH, '#F3E3CF', [0, .07, .14], [.045, .05, .045]), mk(SPH, '#9FC3EA', [0, .12, -.03], [.1, .1, .1]), mk(SPH, '#7FA8D8', [0, .125, -.03], [.06, .06, .105]), mk(SPH, '#4A3535', [.02, .1, .18], [.01, .012, .01]), mk(SPH, '#4A3535', [-.02, .1, .18], [.01, .012, .01]))
  } else {
    a(mk(SPH, '#F9C77A', [0, .13, 0], [.13, .12, .13]), mk(CONE, '#F08A4B', [0, .12, .14], [.03, .06, .03], [Math.PI / 2, 0, 0]), mk(SPH, '#4A3535', [.05, .16, .1], [.018, .026, .015]), mk(SPH, '#4A3535', [-.05, .16, .1], [.018, .026, .015]), mk(SPH, '#F59AB3', [.08, .12, .09], [.025, .018, .01]), mk(SPH, '#F59AB3', [-.08, .12, .09], [.025, .018, .01]), mk(SPH, '#F2B25F', [0, .1, -.13], [.05, .05, .04]));
    const l = pv(.12, .13, 0),
      r = pv(-.12, .13, 0);
    l.add(ns(mk(SPH, '#F2B25F', [.04, -.02, 0], [.05, .07, .04])));
    r.add(ns(mk(SPH, '#F2B25F', [-.04, -.02, 0], [.05, .07, .04])));
    g.userData.w = [l, r]
  }
  const hb = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({
    visible: false
  }));
  hb.position.y = (type == 'bee' || type == 'butterfly') ? 0 : .1;
  g.add(hb);
  g.userData.hb = hb;
  hb.userData.cr = g;
  g.rotation.order = 'YXZ';
  g.userData.type = type;
  g.userData.mood = m;
  g.userData.i = Math.random() * 9;
  g.scale.setScalar(type == 'butterfly' ? 1.3 : type == 'bee' ? 1.2 : 1.15);
  return g
}

function syncCr() {
  Object.keys(M).forEach(m => {
    const L = flowersOf(m),
      n = Math.min(3, Math.ceil(L.length / 2)),
      cur = cr.filter(c => c.userData.mood == m);
    while (cur.length > n) {
      const c = cur.pop();
      scene.remove(c);
      cr.splice(cr.indexOf(c), 1)
    }
    while (cur.length < n) {
      const c = makeCr(m),
        f = L[Math.random() * L.length | 0],
        u = c.userData,
        fl = CT[u.type].fly;
      let px = f.position.x + (Math.random() - .5) * 1.2,
        pz = f.position.z + (Math.random() - .5) * 1.2;
      if (!fl && !walk(px, pz)) {
        px = f.position.x;
        pz = f.position.z
      }
      c.position.set(px, fl ? f.position.y + 1.6 : f.position.y, pz);
      u.tg = c.position.clone();
      u.v = new THREE.Vector3();
      u.hold = 0;
      u.pick = 1;
      scene.add(c);
      cr.push(c);
      cur.push(c)
    }
  })
}

function crStep(c, dt, t) {
  const u = c.userData,
    T = CT[u.type],
    p = c.position,
    fly = T.fly,
    L = flowersOf(u.mood);
  if (u.go && window.HOMEI && HOMEI.step(c, dt, t)) return;
  if (u.act && actStep(c, u, dt, t, u.type)) return;
  if (u.hold > 0) {
    u.hold -= dt;
    u.v.multiplyScalar(.85)
  } else {
    if (!fly && u.wp && u.wp.length && Math.hypot(u.wp[0].x - p.x, u.wp[0].z - p.z) < .22) u.wp.shift();
    const rt = !fly && u.wp && u.wp.length,
      dxz = Math.hypot(u.tg.x - p.x, u.tg.z - p.z);
    if (!rt && (u.pick || (fly ? p.distanceTo(u.tg) : dxz) < .25)) {
      if (!u.pick && u.fl) {
        u.hold = (fly ? .6 : 1.5) + Math.random() * 2;
        u.fl = 0
      } else {
        u.pick = 0;
        if (L.length && Math.random() < .85) {
          const f = L[Math.random() * L.length | 0],
            a = Math.random() * 6.283,
            r = .3 + Math.random() * .5;
          u.tg.set(f.position.x + Math.cos(a) * r, f.position.y + (fly ? 1 + Math.random() * T.h : 0), f.position.z + Math.sin(a) * r);
          if (!fly && !walk(u.tg.x, u.tg.z)) u.tg.set(f.position.x, 0, f.position.z);
          u.fl = 1
        } else {
          const q = rndPt();
          u.tg.set(q[0], fly ? .8 + Math.random() * 1.5 : 0, q[1]);
          u.fl = 0
        }
        if (!fly) planRoute(u, p)
      }
    } /* 目標在另一座花園：走路的小動物會先排好「橋頭 → 橋 → 目標」的路線 */
    const aim = (!fly && u.wp && u.wp.length) ? u.wp[0] : u.tg,
      d = new THREE.Vector3(aim.x - p.x, fly ? aim.y - p.y : 0, aim.z - p.z).normalize().multiplyScalar(T.sp * (1 + Math.sin(t * (fly ? 2 : 1) + u.i) * .25));
    u.v.lerp(d, 1 - Math.pow(.05, dt));
    if (fly) p.addScaledVector(u.v, dt);
    else {
      const nx = p.x + u.v.x * dt,
        nz = p.z + u.v.z * dt;
      if (walk(nx, nz) || !walk(p.x, p.z)) {
        p.x = nx;
        p.z = nz
      } /* 前面不是地面（空隙、柵欄外）就停下來重新選目標 */
      else {
        u.v.set(0, 0, 0);
        u.pick = 1;
        u.fl = 0;
        u.wp = null
      }
    }
  }
  const sp = u.v.length();
  if (!fly) p.y = surf(p.x, p.z) + (u.type == 'bird' ? Math.abs(Math.sin(t * 9 + u.i)) * .12 * Math.min(1, sp / .4) : 0);
  else p.y += Math.sin(t * (u.type == 'bee' ? 18 : 6) + u.i) * (u.type == 'bee' ? .004 : .006);
  if (sp > .04) {
    let a = Math.atan2(u.v.x, u.v.z) - c.rotation.y;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    c.rotation.y += a * Math.min(1, dt * 6)
  }
  const w = u.w;
  if (w) {
    const s = u.type == 'bee' ? Math.sin(t * 50 + u.i) * .7 : u.type == 'butterfly' ? (.3 + (Math.sin(t * 11 + u.i) + 1) * .45) : Math.sin(t * 14 + u.i) * .5 * Math.min(1, sp / .3);
    w[0].rotation.z = s;
    w[1].rotation.z = -s
  }
}

/* 花朵滑回原位：從目前位置用緩動滑回去，中間微微抬起 */
function slideBack(d, to) {
  const f = flowers[d];
  if (!f || !to) return;
  slideDrop(d);
  const T = new THREE.Vector3(to.x, gh(to.x, to.z), to.z);
  if (S.rm) {
    f.position.copy(T);
    return
  }
  slides.push({
    d,
    fr: f.position.clone(),
    to: T,
    t: 0
  })
}

function slideDrop(d) {
  for (let i = slides.length - 1; i >= 0; i--)
    if (slides[i].d === d) slides.splice(i, 1)
}

function slideStep(dt) {
  for (let i = slides.length - 1; i >= 0; i--) {
    const q = slides[i],
      f = q.o || flowers[q.d];
    if (!f) {
      slides.splice(i, 1);
      continue
    }
    q.t += dt / .55;
    const u = Math.min(1, q.t),
      e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    f.position.lerpVectors(q.fr, q.to, e);
    f.position.y += Math.sin(u * Math.PI) * .35;
    if (u >= 1) {
      f.position.copy(q.to);
      slides.splice(i, 1)
    }
  }
}

function setArrange(on) {
  arrange = on;
  document.body.classList.toggle('arr', on);
  $('card').hidden = true;
  if (on) {
    toast(tr('hintArr'))
  } else {
    selRing.visible = false;
    drag = null
  }
  refresh()
}
$('arr').onclick = () => {
  const wasOn = arrange;
  setArrange(!arrange);
  if (wasOn) homeSoft()
}; /* 按「完成」離開佈置模式時，鏡頭也拉遠 1.5 倍 */
