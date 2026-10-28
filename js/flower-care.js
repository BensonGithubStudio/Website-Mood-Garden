/* ============================================================================
 * js/flower-care.js — 澆水、凋零動畫、鏟除與種花位置
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・口渴的小花苗頭上的水滴與澆水動畫（setThirst、waterFx、water）、凋零時的
 *     花瓣（witherFx、witherStep）、鏟除花朵（shovelFlower）。
 *   ・挑選新花的位置（pickPos）、花園是否已滿（gardenFull）、把一朵花加進場景
 *     （addFlower）與長大動畫（setGrow）。
 *
 * 需要先載入：audio.js、state.js、i18n.js、world.js、three-utils.js、
 *   flowers.js
 * 提供給其他檔案：setThirst、waterFx、water、DBR、SHV、WPAL、debris、
 *   witherFx、witherStep、shovelFlower、pickPos、gardenFull、addFlower、ez、
 *   setGrow
 * 載入順序：第 13 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

/* ---------- 澆水：口渴的小花苗頭上會浮出水滴，點花（或水滴）→ 詳情卡 → 按澆水鈕 ---------- */
function setThirst(f, on) {
  const u = f.userData;
  if (on && !u.dp && WDROP) {
    const s = new THREE.Sprite(own(new THREE.SpriteMaterial({
      map: WDROP,
      transparent: true,
      depthWrite: false
    })));
    s.scale.set(.4, .4, 1);
    s.position.set(0, 1.25, 0);
    f.add(s);
    u.dp = s
  }
  if (!on && u.dp) {
    f.remove(u.dp);
    u.dp.material.dispose();
    u.dp = null
  }
}

function waterFx(f) {
  const u = f.userData,
    p = {
      x: f.position.x,
      y: f.position.y + 1.3 * u.base,
      z: f.position.z
    };
  if (!PMS || !PMS.drop) return;
  if (S.rm) {
    burst('bubble', {
      x: p.x,
      y: f.position.y + .4 * u.base,
      z: p.z
    }, 3);
    return
  }
  const n0 = parts.length;
  burst('drop', p, 14);
  for (let i = n0; i < parts.length; i++) {
    const s = parts[i];
    s.position.y = p.y + Math.random() * .4;
    s.userData.v.set((Math.random() - .5) * .35, -1.8 - Math.random() * .8, (Math.random() - .5) * .35);
    s.userData.m = .8 + Math.random() * .4
  }
  setTimeout(() => burst('bubble', {
    x: p.x,
    y: f.position.y + .3 * u.base,
    z: p.z
  }, 5), 500)
}

function water(d) {
  const e = S.e[d];
  if (!e || withered(d, e) || !thirstyOf(e)) {
    sfx('deny');
    return false
  }
  e.wt = Date.now();
  save();
  const f = flowers[d];
  if (f) {
    setThirst(f, false);
    f.userData.th = false;
    waterFx(f)
  }
  sfx('water', 'plant');
  toast(tr('waterT'));
  return true
}
/* ---------- 凋零的小動畫與鏟除 ----------
   花瓣飄落、鏟土的小碎屑共用同一組「碎屑」；鏟除時花會往土裡縮下去，然後搬到凋零小島。 */
const DBR = [],
  SHV = [],
  WPAL = {
    happy: ['#C9A94F', '#A68A3A'],
    excited: ['#B5845A', '#9A6B45'],
    calm: ['#E4DECB', '#CFC8B0'],
    loved: ['#8B4A57', '#6A3440'],
    sad: ['#8D98B4', '#7C86A0'],
    anxious: ['#9A8E9B', '#7F7280']
  };

function debris(x, y, z, cols, n, o) {
  o = o || {};
  const cs = [].concat(cols);
  for (let i = 0; i < n; i++) {
    const s = (o.s || .05) * (.7 + Math.random() * .6),
      m = mk(SPH, cs[i % cs.length], [x, y, z], [s * 1.5, s * .45, s]);
    m.castShadow = false;
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    scene.add(m);
    const a = Math.random() * 6.283,
      v = (o.v || .5) * (.4 + Math.random() * .8);
    DBR.push({
      m,
      b: m.scale.clone(),
      vx: Math.cos(a) * v,
      vy: (o.up || .3) * (.3 + Math.random()),
      vz: Math.sin(a) * v,
      g: o.g || 1.6,
      t: 0,
      life: o.life || 2.6,
      sp: (Math.random() - .5) * 4,
      rest: false
    })
  }
}

function witherFx(f) {
  const u = f.userData,
    p = f.position;
  if (S.rm) return;
  debris(p.x, p.y + 1.0 * u.base, p.z, WPAL[u.mood] || WPAL.happy, 9, {
    s: .06,
    v: .35,
    up: .4,
    g: 1.5,
    life: 3
  })
}

function witherStep(t, dt) {
  for (let i = DBR.length - 1; i >= 0; i--) {
    const q = DBR[i],
      m = q.m;
    q.t += dt;
    if (!q.rest) {
      q.vy -= q.g * dt;
      m.position.x += q.vx * dt;
      m.position.y += q.vy * dt;
      m.position.z += q.vz * dt;
      m.rotation.y += q.sp * dt;
      m.rotation.x += q.sp * dt * .6;
      const gy = gh(m.position.x, m.position.z) + .03;
      if (m.position.y <= gy && q.vy < 0) {
        m.position.y = gy;
        q.rest = true
      }
    }
    const k = q.t > q.life - .5 ? Math.max(.001, (q.life - q.t) / .5) : 1;
    m.scale.copy(q.b).multiplyScalar(k);
    if (q.t >= q.life) {
      scene.remove(m);
      DBR.splice(i, 1)
    }
  }
  /* 花從「盛開 / 小花苗」慢慢枯成凋零的樣子 */
  for (const d in flowers) {
    const f = flowers[d],
      u = f.userData;
    if (u.wm == null) continue;
    u.wm += S.rm ? dt * 8 : dt / 1.8;
    const x = Math.min(1, u.wm),
      out = Math.max(.001, 1 - ez(Math.min(1, x * 1.5))),
      inn = Math.max(.001, ez((x - .2) / .8));
    if (u.wsrc) u.wsrc.scale.setScalar(out);
    u.Wt.scale.setScalar(inn);
    if (x >= 1) {
      u.wm = null;
      if (u.wsrc) {
        u.wsrc.visible = false;
        u.wsrc.scale.setScalar(.001)
      }
      u.Wt.scale.setScalar(1)
    }
  }
  /* 被鏟除的花：往土裡縮下去 */
  for (let i = SHV.length - 1; i >= 0; i--) {
    const q = SHV[i],
      f = q.f;
    q.t += S.rm ? dt * 8 : dt / .55;
    const x = Math.min(1, q.t);
    f.position.y = q.y0 - .55 * ez(x);
    f.scale.setScalar(Math.max(.001, q.s0 * (1 - ez(x))));
    if (x >= 1) {
      scene.remove(f);
      freeObj(f);
      SHV.splice(i, 1)
    }
  }
}
/* 鏟除：只是把花從花園搬走（e.sh＝搬走的時間）。心情、文字、標籤、種下的時間全部保留，所以月曆、統計、回憶都還在。 */
function shovelFlower(d) {
  const e = S.e[d];
  if (!e || e.sh) return;
  const f = flowers[d];
  e.sh = Date.now();
  save();
  if (f) {
    const p = f.position;
    delete flowers[d];
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
  syncCr();
  $('card').hidden = true;
  home();
  refresh();
  toast(tr('shoveled'));
  if (window.WI) WI.refresh()
}

function pickPos(d) {
  let s = 0;
  for (const c of d) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296,
    ex = Object.values(S.e).filter(e => e.x !== undefined && !e.sh);
  const n2 = ex.filter(e => inG2(e.x, e.z, 1.1)).length,
    g = n2 < ex.length - n2 ? 2 : 1;
  let best = null,
    fb = null; // 新花種在花朵比較少的那座花園
  const far = (x, z) => ex.every(e => Math.hypot(e.x - x, e.z - z) > 1);
  for (let t = 0; t < 120; t++) {
    let x, z;
    if (g == 1) {
      const r = 1 + Math.sqrt(rnd()) * 5.6,
        a = rnd() * 6.283;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r
    } else {
      const a = rnd() * 6.283,
        r = (.12 + Math.sqrt(rnd()) * .7) * rho2(a);
      x = G2.x + Math.cos(a) * r;
      z = G2.z + Math.sin(a) * r
    }
    if (!legalSpot(x, z)) continue;
    if (!fb) fb = {
      x,
      z
    };
    if (far(x, z)) {
      best = {
        x,
        z
      };
      break
    }
  }
  if (!best) { // 隨機找不到：掃描兩座花園的每個角落，優先找離其他花夠遠的位置
    const c1 = [],
      c2 = [];
    for (let x = -7; x <= G2.x + 7; x += .3)
      for (let z = -7; z <= 7; z += .3) {
        if (!legalSpot(x, z)) continue;
        (far(x, z) ? c1 : c2).push({
          x,
          z
        })
      }
    const c = c1.length ? c1 : c2;
    if (c.length) best = c[Math.floor(rnd() * c.length)]
  }
  if (!best) best = fb;
  if (!best) return null; // 兩座花園都沒有空位了
  return {
    x: best.x,
    z: best.z,
    s: .85 + rnd() * .5,
    r: rnd() * 6.28
  }
}
const gardenFull = () => ok && !pickPos('__probe__');

function addFlower(d, grow) {
  const e = S.e[d];
  if (e.sh) {
    if (window.WI) WI.refresh();
    return
  } // 已鏟除的花不在花園裡，住在凋零小島上
  if (e.x === undefined) {
    Object.assign(e, pickPos(d) || {
      x: G2.x,
      z: 0,
      s: 1,
      r: 0
    });
    save()
  } // 新花會先檢查有沒有空位；這裡只是雲端同步來的舊花的保險
  const f = flower(e.mood);
  f.position.set(e.x, gh(e.x, e.z), e.z);
  f.rotation.y = e.r;
  Object.assign(f.userData, {
    date: d,
    base: e.s,
    grow
  });
  scene.add(f);
  flowers[d] = f;
  setStage(f, withered(d, e) ? 2 : matureOf(e) ? 1 : 0, false);
  setGrow(f, grow);
  syncCr()
}
const ez = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function setGrow(f, g) {
  const b = f.userData.base,
    a = Math.max(.001, ez(g * 2)) * b;
  f.scale.set(a, a, a);
  const h = Math.max(.001, ez((g - .4) / .6));
  f.userData.h.scale.setScalar(h);
  if (f.userData.hy) f.userData.hy.scale.setScalar(h)
}
