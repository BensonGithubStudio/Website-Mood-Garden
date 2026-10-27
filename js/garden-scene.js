/* ============================================================================
 * js/garden-scene.js — 建造花園場景
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・一次性建造花園的所有 3D 物件：兩座花園的地面、柵欄、橋、樹、風車、長
 *     椅、蘑菇、石頭與小花點等。
 *   ・只在有 WebGL（ok）時執行；也宣告花園互動用的暫存變數（spare、bf、cl、
 *     sparkle、P、hover）。
 *
 * 需要先載入：state.js、world.js、three-utils.js
 * 提供給其他檔案：spare、bf、cl、sparkle、P、hover、HEMI、SUN、GR、GRS、WMB、
 *   GLOW、mts、MOON、glowF、applyTime、dfv、sunDir、sunE
 * 載入順序：第 14 個（共 32 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const spare = [],
  bf = [],
  cl = [];
let sparkle = null,
  P = null,
  hover = null;
if (ok) {
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.fog = new THREE.Fog('#C4D9E0', 46, 118);
  window.HEMI = new THREE.HemisphereLight(0xFFF1DC, 0xA9C9B2, .5);
  scene.add(HEMI);
  const sun = new THREE.DirectionalLight(0xFFE6C4, .7);
  sun.position.set(MX + 6, 11, 5);
  window.SUN = sun;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -19,
    right: 19,
    top: 19,
    bottom: -19
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0008;
  sun.target.position.set(MX, 0, 0);
  scene.add(sun, sun.target);
  const gg = new THREE.PlaneGeometry(17, 17, 56, 56);
  gg.rotateX(-Math.PI / 2);
  const pp = gg.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    let x = pp.getX(i),
      z = pp.getZ(i),
      r = Math.hypot(x, z);
    if (r > 8) {
      x *= 8 / r;
      z *= 8 / r
    }
    pp.setXYZ(i, x, r > 8 ? -.15 : gh(x, z), z)
  }
  gg.computeVertexNormals();
  const gr = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({
    color: '#9CC487',
    roughness: 1
  }));
  gr.receiveShadow = true;
  scene.add(gr);
  window.GR = gr;
  scene.add(mk(new THREE.CylinderGeometry(8.1, 7, 1.4, 64), '#E3C9A8', [0, -.85, 0], [1, 1, 1]));
  window.GRS = [gr];
  /* ===== 柵欄：通用建造器（posts 為封閉折線上的柱子座標，skip 判斷哪些柱子要拿掉＝橋口） ===== */
  const buildFence = (P, skip) => {
    const n = P.length,
      kp = P.map(p => !skip(p)),
      np = kp.filter(Boolean).length;
    let nr = 0;
    for (let i = 0; i < n; i++)
      if (kp[i] && kp[(i + 1) % n]) nr++;
    const bx = new THREE.BoxGeometry(1, 1, 1),
      pm2 = new THREE.MeshStandardMaterial({
        roughness: .85,
        emissive: new THREE.Color('#EBD3AC'),
        emissiveIntensity: .12
      }),
      posts = new THREE.InstancedMesh(bx, pm2, np),
      caps = new THREE.InstancedMesh(SPH, new THREE.MeshStandardMaterial({
        roughness: .8
      }), np),
      rails = new THREE.InstancedMesh(bx, pm2, nr * 2),
      o = new THREE.Object3D(),
      c = new THREE.Color(),
      cap = ['#F5C7D5', '#B9D8EB', '#F5DEA0'];
    let pi = 0,
      ri = 0;
    for (let i = 0; i < n; i++) {
      if (!kp[i]) continue;
      const x = P[i][0],
        z = P[i][1],
        y = gh(x, z) - .05;
      o.position.set(x, y + .37, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(.13, .74, .13);
      o.updateMatrix();
      posts.setMatrixAt(pi, o.matrix);
      posts.setColorAt(pi, c.set('#EBD3AC').offsetHSL(0, 0, (Math.random() - .5) * .05));
      o.position.set(x, y + .77, z);
      o.scale.setScalar(.085);
      o.updateMatrix();
      caps.setMatrixAt(pi, o.matrix);
      caps.setColorAt(pi, c.set(cap[pi % 3]));
      pi++;
      const j = (i + 1) % n;
      if (kp[j]) {
        const x2 = P[j][0],
          z2 = P[j][1],
          xm = (x + x2) / 2,
          zm = (z + z2) / 2,
          ym = gh(xm, zm) - .05,
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
    }
    [posts, caps, rails].forEach(q => {
      q.castShadow = true;
      q.receiveShadow = true;
      scene.add(q)
    })
  };

  /* ===== 第二座花園：地面（極座標網格，邊界跟著 rho2 起伏） ===== */
  {
    const K = 26,
      SG = 120,
      c1 = new THREE.Color('#98C281'),
      c2 = new THREE.Color('#B8D890'),
      cc = new THREE.Color(),
      pos = [G2.x, gh(G2.x, G2.z), G2.z],
      col = [],
      idx = [];
    const paint = (x, z, dirt) => {
      const n = (Math.sin(x * .9) * Math.cos(z * 1.1) + Math.sin(x * .3 + z * .5)) * .25 + .5;
      cc.copy(c1).lerp(c2, Math.min(1, Math.max(0, n)));
      if (dirt) cc.set('#C9A97E');
      col.push(cc.r, cc.g, cc.b)
    };
    paint(G2.x, G2.z, false);
    for (let k = 1; k <= K; k++) {
      const f = k / K;
      for (let i = 0; i < SG; i++) {
        const a = i / SG * 6.2832,
          r = rho2(a) * f,
          x = G2.x + Math.cos(a) * r,
          z = G2.z + Math.sin(a) * r;
        pos.push(x, k === K ? -.15 : gh(x, z), z);
        paint(x, z, f > .97)
      }
    }
    for (let i = 0; i < SG; i++) idx.push(0, 1 + (i + 1) % SG, 1 + i);
    for (let k = 0; k < K - 1; k++)
      for (let i = 0; i < SG; i++) {
        const a = 1 + k * SG + i,
          b = 1 + k * SG + (i + 1) % SG,
          c = a + SG,
          d = b + SG;
        idx.push(a, b, c, b, d, c)
      }
    const g2g = new THREE.BufferGeometry();
    g2g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g2g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g2g.setIndex(idx);
    g2g.computeVertexNormals();
    const gr2 = new THREE.Mesh(g2g, new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      vertexColors: true
    }));
    gr2.receiveShadow = true;
    scene.add(gr2);
    window.GRS.push(gr2);
    /* 土壤側面：跟著邊界往下縮一圈，和第一座花園的圓柱底座同色 */
    const SS = 96,
      sp = [],
      si = [];
    for (let i = 0; i < SS; i++) {
      const a = i / SS * 6.2832,
        r = rho2(a);
      sp.push(G2.x + Math.cos(a) * r * 1.012, -.15, G2.z + Math.sin(a) * r * 1.012, G2.x + Math.cos(a) * r * .87, -1.55, G2.z + Math.sin(a) * r * .87)
    }
    for (let i = 0; i < SS; i++) {
      const j = (i + 1) % SS;
      si.push(i * 2, j * 2, i * 2 + 1, j * 2, j * 2 + 1, i * 2 + 1)
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.setIndex(si);
    sg.computeVertexNormals();
    const sk = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({
      color: '#E3C9A8',
      roughness: .88,
      side: 2,
      emissive: new THREE.Color('#E3C9A8').multiplyScalar(.13)
    }));
    sk.castShadow = true;
    scene.add(sk);
    const cb = [G2.x, -1.55, G2.z],
      cp = [...cb],
      ci = [];
    for (let i = 0; i < SS; i++) {
      cp.push(sp[i * 6 + 3], sp[i * 6 + 4], sp[i * 6 + 5])
    }
    for (let i = 0; i < SS; i++) ci.push(0, 1 + i, 1 + (i + 1) % SS);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    cg.setIndex(ci);
    cg.computeVertexNormals();
    scene.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({
      color: '#D9BD98',
      roughness: .9,
      side: 2
    })));
  }
  /* ===== 第二座花園的柵欄：沿邊界等距放柱子，橋口那一段不放 ===== */
  {
    const M = 720,
      poly = [];
    for (let i = 0; i <= M; i++) {
      const a = i / M * 6.2832,
        r = rho2(a) * .93;
      poly.push([G2.x + Math.cos(a) * r, G2.z + Math.sin(a) * r])
    }
    const cum = [0];
    for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const tot = cum[M],
      n = Math.round(tot / .654),
      step = tot / n,
      P = [];
    let k = 1;
    for (let j = 0; j < n; j++) {
      const d = j * step;
      while (k < M && cum[k] < d) k++;
      const t = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
      P.push([poly[k - 1][0] + (poly[k][0] - poly[k - 1][0]) * t, poly[k - 1][1] + (poly[k][1] - poly[k - 1][1]) * t])
    }
    buildFence(P, p => p[0] < G2.x && Math.abs(p[1] - G2.z) < 1.05);
  }
  /* ===== 橋：微微拱起的木橋，兩側有欄杆 ===== */
  {
    const bx = new THREE.BoxGeometry(1, 1, 1),
      LB = BB - BA,
      V = THREE.Vector3,
      pw = ['#E8C99A', '#DDB98A', '#E3C28F'],
      np = Math.round(LB / .34),
      capc = ['#F5C7D5', '#B9D8EB', '#F5DEA0'];
    for (let i = 0; i < np; i++) {
      const x = BA + (i + .5) / np * LB,
        sl = Math.atan((deckY(x + .05) - deckY(x - .05)) / .1);
      scene.add(mk(bx, pw[i % 3], [x, deckY(x) - .045, 0], [LB / np * .88, .07, BW * 2 + .12], [0, 0, sl]))
    }
    const seg = (a, b, th, c) => {
      const d = new V().subVectors(b, a),
        len = d.length(),
        m = mk(bx, c, [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], [len * 1.02, th, th]);
      m.quaternion.setFromUnitVectors(new V(1, 0, 0), d.normalize());
      scene.add(m)
    };
    const pt = (u, z, h) => {
      const x = BA + u * LB;
      return new V(x, deckY(x) + h, z)
    };
    [-1, 1].forEach(sd => {
      for (let i = 0; i < 14; i++) {
        const u0 = i / 14,
          u1 = (i + 1) / 14;
        seg(pt(u0, sd * (BW - .04), -.17), pt(u1, sd * (BW - .04), -.17), .12, '#C79F72');
        seg(pt(u0, sd * BW, .6), pt(u1, sd * BW, .6), .065, '#E2C79B');
        seg(pt(u0, sd * BW, .32), pt(u1, sd * BW, .32), .05, '#E2C79B')
      }
      for (let k = 0; k <= 6; k++) {
        const x = BA + k / 6 * LB;
        scene.add(mk(bx, '#EBD3AC', [x, deckY(x) + .3, sd * BW], [.1, .62, .1]), mk(SPH, capc[k % 3], [x, deckY(x) + .66, sd * BW], [.075, .075, .075]))
      }
    });
  }
  /* ===== 第二座花園的裝飾：樹、風車、長椅、蘑菇、石頭、小花點 ===== */
  {
    const bx = new THREE.BoxGeometry(1, 1, 1),
      tc = ['#A8D5A2', '#F5C7D5', '#B9D9C2', '#F5DEA0', '#F5C7D5', '#A8D5A2'];
    [-2.5, -1.8, -.9, .5, 1.4, 2.3].forEach((a, i) => {
      const p = at2(.985, a),
        t = new THREE.Group(),
        c = tc[i];
      t.add(mk(CYL, '#C9A27A', [0, .55, 0], [.13, 1.1, .13]), mk(SPH, c, [0, 1.45, 0], [.8, .72, .8]), mk(SPH, c, [.4, 1.15, .2], [.5, .45, .5]), mk(SPH, c, [-.35, 1.85, -.1], [.5, .45, .5]));
      t.position.set(p[0], gh(p[0], p[1]) - .05, p[1]);
      t.scale.setScalar(.9 + i % 3 * .12);
      scene.add(t)
    });
    MU2.forEach(([x, z], i) => {
      const m = new THREE.Group();
      m.add(mk(CYL, '#FFF3E0', [0, .18, 0], [.07, .36, .07]), mk(SPH, ['#B9D8EB', '#F5DEA0', '#F29BB5'][i], [0, .38, 0], [.26, .17, .26]), mk(SPH, '#fff', [.1, .5, .1], [.05, .03, .05]));
      m.position.set(x, gh(x, z), z);
      m.scale.setScalar(1 + i * .15);
      scene.add(m)
    });
    RK2.forEach(([x, z, s]) => scene.add(mk(new THREE.IcosahedronGeometry(1, 0), '#D9D2CE', [x, gh(x, z) + s * .4, z], [s, s * .7, s * .85], [.3, .6, 0])));
    {
      const wm = new THREE.Group(),
        bl = new THREE.Group();
      wm.add(mk(shade(new THREE.CylinderGeometry(.5, .78, 1.9, 14), .8), '#FBEFDD', [0, .95, 0], [1, 1, 1]), mk(new THREE.ConeGeometry(.82, .95, 14), '#F29BB5', [0, 2.35, 0], [1, 1, 1]),
        mk(bx, '#B58B66', [0, .3, .74], [.3, .55, .1]), mk(bx, '#B9D8EB', [0, 1.2, .6], [.26, .26, .07]), mk(SPH, '#E3C9A8', [0, 1.75, .56], [.1, .1, .1]));
      bl.position.set(0, 1.75, 1.0);
      wm.add(mk(bx, '#B58B66', [0, 1.75, .76], [.09, .09, .56]), mk(SPH, '#E3C9A8', [0, 1.75, 1.0], [.12, .12, .12]));
      for (let k = 0; k < 4; k++) {
        const g = new THREE.Group();
        g.rotation.z = k * Math.PI / 2;
        g.add(mk(bx, '#E3C9A8', [0, .58, 0], [.07, 1.16, .05]), mk(bx, '#FFFFFF', [.17, .72, 0], [.3, .7, .02]));
        bl.add(g)
      }
      wm.add(bl);
      wm.position.set(WM[0], gh(WM[0], WM[1]) - .02, WM[1]);
      wm.rotation.y = .35;
      scene.add(wm);
      window.WMB = bl
    } {
      const bn = new THREE.Group();
      bn.add(mk(bx, '#D9B88F', [0, .34, 0], [.95, .07, .36]), mk(bx, '#D9B88F', [0, .62, -.17], [.95, .3, .05]), mk(bx, '#B58B66', [-.4, .17, 0], [.07, .34, .3]), mk(bx, '#B58B66', [.4, .17, 0], [.07, .34, .3]));
      bn.position.set(BN[0], gh(BN[0], BN[1]), BN[1]);
      bn.rotation.y = Math.atan2(G2.x - BN[0], G2.z - BN[1]);
      scene.add(bn)
    }
    const t2 = new THREE.InstancedMesh(SPH, new THREE.MeshStandardMaterial({
        roughness: .8
      }), 70),
      o2 = new THREE.Object3D(),
      pl2 = ['#F5C7D5', '#FFFFFF', '#F5DEA0', '#D4C7EA'];
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * 6.283,
        r = Math.sqrt(Math.random()) * .92 * rho2(a),
        x = G2.x + Math.cos(a) * r,
        z = G2.z + Math.sin(a) * r;
      o2.position.set(x, gh(x, z) + .08, z);
      o2.scale.setScalar(.07 + Math.random() * .04);
      o2.updateMatrix();
      t2.setMatrixAt(i, o2.matrix);
      t2.setColorAt(i, new THREE.Color(pl2[i % 4]))
    }
    scene.add(t2);
  }

  for (let i = 0; i < 10; i++) {
    const a = i * .63 + .4;
    scene.add(mk(SPH, ['#B9D9C2', '#A5CFB0', '#C6E2C8'][i % 3], [MX + Math.cos(a) * 40, -2, Math.sin(a) * 30 - 4], [8 + i % 3 * 2, 3.6 + i % 2 * 2, 6]))
  }
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    [
      [0, 0, 1.4],
      [1.3, -.2, 1.1],
      [-1.3, -.2, 1.1],
      [.5, .5, 1]
    ].forEach(p => c.add(mk(SPH, '#EAF0F4', [p[0], p[1], 0], [p[2], p[2] * .7, p[2] * .8])));
    c.children.forEach(m => m.castShadow = false);
    c.position.set(-30 + i * 9, 8 + i % 3 * 2, -16 - i % 2 * 6);
    c.userData.s = .4 + i * .05;
    scene.add(c);
    cl.push(c)
  }

  [
    [3.2, -5.2],
    [5.6, -1.5],
    [-2, -6]
  ].forEach(([x, z], i) => {
    const m = new THREE.Group();
    m.add(mk(CYL, '#FFF3E0', [0, .18, 0], [.07, .36, .07]), mk(SPH, '#F29BB5', [0, .38, 0], [.26, .17, .26]), mk(SPH, '#fff', [.1, .5, .1], [.05, .03, .05]));
    m.position.set(x, gh(x, z), z);
    m.scale.setScalar(1 + i * .2);
    scene.add(m)
  });
  [
    [-3.4, 4.9, .5],
    [6, 3, .35],
    [-6.2, -2.4, .45]
  ].forEach(([x, z, s]) => {
    const r = mk(new THREE.IcosahedronGeometry(1, 0), '#D9D2CE', [x, gh(x, z) + s * .4, z], [s, s * .7, s * .85], [.3, .6, 0]);
    scene.add(r)
  });
  for (let i = 0; i < 0; i++) {
    const a = 3.5 + i * .32,
      x = Math.cos(a) * 7.4,
      z = Math.sin(a) * 7.4;
    scene.add(mk(new THREE.BoxGeometry(1, 1, 1), '#EBD3AC', [x, gh(x, z) + .35, z], [.14, .7, .14], [0, -a, 0]));
    if (i < 7) {
      const b = a + .16;
      scene.add(mk(new THREE.BoxGeometry(1, 1, 1), '#E2C79B', [Math.cos(b) * 7.4, gh(x, z) + .5, Math.sin(b) * 7.4], [.06, .09, .8], [0, -b + 1.5708, 0]))
    }
  }
  buildFence(Array.from({
    length: 72
  }, (_, i) => {
    const a = i / 72 * 6.2832;
    return [Math.cos(a) * 7.5, Math.sin(a) * 7.5]
  }), p => p[0] > 0 && Math.abs(p[1]) < 1.05); // 橋口那一段不放柵欄
  const tiny = new THREE.InstancedMesh(SPH, new THREE.MeshStandardMaterial({
      roughness: .8
    }), 70),
    dm = new THREE.Object3D(),
    pal = ['#F5C7D5', '#FFFFFF', '#F5DEA0', '#D4C7EA'];
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 6.283,
      r = Math.sqrt(Math.random()) * 7.5,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    dm.position.set(x, gh(x, z) + .08, z);
    dm.scale.setScalar(.07 + Math.random() * .04);
    dm.updateMatrix();
    tiny.setMatrixAt(i, dm.matrix);
    tiny.setColorAt(i, new THREE.Color(pal[i % 4]))
  }
  scene.add(tiny);
  {
    const cols = new Float32Array(pp.count * 3),
      c1 = new THREE.Color('#98C281'),
      c2 = new THREE.Color('#B8D890'),
      cc = new THREE.Color();
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i),
        z = pp.getZ(i),
        n = (Math.sin(x * .9) * Math.cos(z * 1.1) + Math.sin(x * .3 + z * .5)) * .25 + .5;
      cc.copy(c1).lerp(c2, Math.min(1, Math.max(0, n)));
      if (Math.hypot(x, z) > 7.75) cc.set('#C9A97E');
      cols.set([cc.r, cc.g, cc.b], i * 3)
    }
    gg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    gr.material.vertexColors = true;
    gr.material.color.set('#ffffff');
    gr.material.needsUpdate = true
  } {
    const gi = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshStandardMaterial({
        roughness: 1
      }), 4),
      o = new THREE.Object3D();
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * 6.283,
        r = Math.sqrt(Math.random()) * 7.6,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      o.position.set(x, gh(x, z) + .14, z);
      o.rotation.set((Math.random() - .5) * .5, Math.random() * 6, (Math.random() - .5) * .5);
      {
        const q = .7 + Math.random() * .8;
        o.scale.set(q, q * 1.7, q)
      }
      o.updateMatrix();
      gi.setMatrixAt(i, o.matrix);
      gi.setColorAt(i, new THREE.Color().setHSL(.27 + Math.random() * .06, .45, .5 + Math.random() * .12))
    }
    scene.add(gi)
  }
  [
    [51, '#A9D3C2', 5, .55, 11],
    [69, '#B9CFE6', 7, .5, 13],
    [87, '#CFC6E8', 8, .6, 11]
  ].forEach(([r, c, n, sy, sz], j) => {
    for (let i = 0; i < n * 2; i++) {
      const a = i / (n * 2) * 6.283 + j,
        s = sz * (.8 + Math.random() * .6);
      scene.add(mk(SPH, c, [MX + Math.cos(a) * r, -3, Math.sin(a) * r], [s * 1.4, s * sy * 1.3, s]))
    }
  });
  for (let i = 0; i < 8; i++) {
    const a = i * .785 + .3,
      s = (10 + Math.random() * 6) * 1.35,
      x = MX + Math.cos(a) * 100,
      z = Math.sin(a) * 100,
      y = s * .4 - 3;
    scene.add(mk(new THREE.ConeGeometry(1, 1, 5), '#C6C2E4', [x, y, z], [s * .9, s, s * .9], [0, Math.random() * 3, 0]), mk(new THREE.ConeGeometry(1, 1, 5), '#FFFFFF', [x, y + s * .35, z], [s * .27, s * .3, s * .27]))
  }
  [3.2, 3.7, 4.2, 4.7, 5.3, 5.8].forEach((a, i) => {
    const x = Math.cos(a) * 7.9,
      z = Math.sin(a) * 7.9,
      t = new THREE.Group(),
      c = ['#A8D5A2', '#F5C7D5', '#B9D9C2', '#F5DEA0', '#F5C7D5', '#A8D5A2'][i];
    t.add(mk(CYL, '#C9A27A', [0, .55, 0], [.13, 1.1, .13]), mk(SPH, c, [0, 1.45, 0], [.8, .72, .8]), mk(SPH, c, [.4, 1.15, .2], [.5, .45, .5]), mk(SPH, c, [-.35, 1.85, -.1], [.5, .45, .5]));
    t.position.set(x, gh(x, z) - .05, z);
    t.scale.setScalar(.9 + i % 3 * .12);
    scene.add(t)
  });
  {
    const hs = new THREE.Group(),
      bx = new THREE.BoxGeometry(1, 1, 1);
    hs.add(mk(bx, '#FBEFDD', [0, .55, 0], [1.7, 1.1, 1.3]), mk(new THREE.ConeGeometry(1, 1, 4), '#F29BB5', [0, 1.55, 0], [1.6, .95, 1.3], [0, Math.PI / 4, 0]), mk(bx, '#B58B66', [0, .3, .66], [.34, .6, .06]), mk(bx, '#B9D8EB', [-.52, .65, .66], [.3, .3, .05]), mk(bx, '#B9D8EB', [.52, .65, .66], [.3, .3, .05]), mk(bx, '#E3C9A8', [.5, 1.55, -.2], [.18, .5, .18]));
    hs.position.set(-2.7, gh(-2.7, -5.4), -5.4);
    hs.rotation.y = .45;
    scene.add(hs)
  } {
    const rim = new THREE.DirectionalLight(0xFFC9DC, .35);
    rim.position.set(-6, 4, -8);
    scene.add(rim)
  } {
    const n = 45,
      ar = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283,
        r = Math.sqrt(Math.random()) * 8;
      ar.set([Math.cos(a) * r, .6 + Math.random() * 3, Math.sin(a) * r], i * 3)
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(ar, 3));
    /* 發光貼圖：改用 DataTexture 直接寫入像素（RGB 固定純白，只有 alpha 漸層）。
         原本用 canvas 畫的話，手機瀏覽器會把畫布存成「預乘 alpha」，邊緣 alpha 很低的地方顏色被量化，還原後就變成一圈彩色雜點。 */
    {
      const GS = 128,
        gd = new Uint8Array(GS * GS * 4),
        ST = [
          [0, 1],
          [.3, .6],
          [1, 0]
        ];
      for (let y = 0; y < GS; y++)
        for (let x = 0; x < GS; x++) {
          const d = Math.min(1, Math.hypot(x + .5 - GS / 2, y + .5 - GS / 2) / (GS / 2));
          let a = 0;
          for (let i = 0; i < 2; i++)
            if (d >= ST[i][0] && d <= ST[i + 1][0]) {
              const t = (d - ST[i][0]) / (ST[i + 1][0] - ST[i][0]);
              a = ST[i][1] + (ST[i + 1][1] - ST[i][1]) * t;
              break
            }
          a = a * a * (3 - 2 * a) * .35 + a * .65;
          const k = (y * GS + x) * 4;
          gd[k] = gd[k + 1] = gd[k + 2] = 255;
          gd[k + 3] = Math.round(Math.min(1, Math.max(0, a)) * 255)
        }
      const gt = new THREE.DataTexture(gd, GS, GS, THREE.RGBAFormat, THREE.UnsignedByteType);
      gt.minFilter = gt.magFilter = THREE.LinearFilter;
      gt.generateMipmaps = false;
      gt.needsUpdate = true;
      window.GLOW = gt
    }
    const mkPts = (c, s, k, gi) => {
      const a2 = new Float32Array(k * 3);
      for (let i = 0; i < k; i++) {
        const a = Math.random() * 6.283,
          r = Math.sqrt(Math.random()) * (gi ? .95 * rho2(a) : 8);
        a2.set([Math.cos(a) * r, .6 + Math.random() * 3, Math.sin(a) * r], i * 3)
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.BufferAttribute(a2, 3));
      const p = new THREE.Points(g2, new THREE.PointsMaterial({
        color: c,
        size: s,
        map: GLOW,
        transparent: true,
        opacity: .8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      if (gi) p.position.set(G2.x, 0, G2.z);
      scene.add(p);
      return p
    };
    window.mts = [mkPts('#FFD966', .42, 24, 0), mkPts('#FFFFFF', .3, 24, 0), mkPts('#FFD966', .42, 20, 1), mkPts('#FFFFFF', .3, 20, 1)]; // 兩座花園各一組
    window.MOON = new THREE.DirectionalLight(0xB7C8FF, 0);
    MOON.castShadow = true;
    MOON.shadow.mapSize.set(1024, 1024);
    Object.assign(MOON.shadow.camera, {
      left: -19,
      right: 19,
      top: 19,
      bottom: -19
    });
    MOON.shadow.camera.updateProjectionMatrix();
    MOON.shadow.bias = -.001;
    MOON.target.position.set(MX, 0, 0);
    scene.add(MOON, MOON.target);
    const stA = new Float32Array(900);
    for (let i = 0; i < 300; i++) {
      const a = Math.random() * 6.283,
        b = Math.random() * 1.3 + .1;
      stA.set([Math.cos(a) * Math.cos(b) * 85, Math.sin(b) * 85, Math.sin(a) * Math.cos(b) * 85], i * 3)
    }
    const stG = new THREE.BufferGeometry();
    stG.setAttribute('position', new THREE.BufferAttribute(stA, 3));
    const starsP = new THREE.Points(stG, new THREE.PointsMaterial({
      color: '#FFFFFF',
      size: 3,
      sizeAttenuation: false,
      map: GLOW,
      transparent: true,
      depthWrite: false,
      fog: false
    }));
    starsP.position.x = MX;
    scene.add(starsP);
    const halo = (c, s) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: GLOW,
        color: c,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        fog: false
      }));
      sp.scale.set(s, s, 1);
      return sp
    };
    const sunV = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 14), new THREE.MeshBasicMaterial({
        color: '#FFE8A8',
        fog: false
      })),
      moonV = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 14), new THREE.MeshBasicMaterial({
        color: '#FFF6DA',
        fog: false
      }));
    sunV.add(halo('#FFD79A', 16));
    moonV.add(halo('#B9CBFF', 11));
    scene.add(sunV, moonV);
    window.glowF = 1;
    window.applyTime = function() {
      const nw = new Date(),
        m = S.tm || 'auto',
        h = m == 'day' ? 12 : m == 'night' ? 0 : nw.getHours() + nw.getMinutes() / 60,
        A = (h - 6) / 24 * 6.2832,
        e = Math.sin(A),
        cl = (v, a, b) => Math.min(b, Math.max(a, v)),
        df = cl((e + .12) / .3, 0, 1),
        tw = cl(1 - Math.abs(e) / .28, 0, 1) * (m == 'auto' ? 1 : 0),
        C = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
      SUN.position.set(MX - Math.cos(A) * 10, Math.max(.5, Math.sin(A) * 11), 4);
      SUN.intensity = .75 * df * (1 + .2 * WX.sun) * (1 - .5 * WX.cover);
      SUN.color.copy(C('#FF9F5A', '#FFE6C4', cl(e * 2.5, 0, 1)));
      MOON.position.set(MX + Math.cos(A) * 10, Math.max(.5, -Math.sin(A) * 11), -4);
      MOON.intensity = .5 * (1 - df);
      if (window.GQsh) GQsh();
      HEMI.intensity = .22 + .3 * df + .12 * WX.cover * df;
      HEMI.color.copy(C('#8A97D0', '#FFF1DC', df).lerp(new THREE.Color('#FFD1E0'), WX.pink * .5 * df));
      HEMI.groundColor.copy(C('#3E4A6B', '#A9C9B2', df));
      const top = C('#0E1838', '#86B6DA', df).lerp(new THREE.Color('#6F7FB8'), tw * .7),
        mid = C('#26376C', '#B4D3E2', df).lerp(new THREE.Color('#F4B49C'), tw * .8),
        bot = C('#3C4C80', '#D6DDD0', df).lerp(new THREE.Color('#FADDB8'), tw * .8);
      {
        const k2 = WX.cover * .7,
          d2 = .3 + .7 * df;
        top.lerp(C('#9FB6CF', '#8F8ABD', WX.dark).multiplyScalar(d2), k2);
        mid.lerp(C('#B7C7DA', '#A9A3C9', WX.dark).multiplyScalar(d2), k2);
        bot.lerp(C('#D3DBE4', '#C7C3DC', WX.dark).multiplyScalar(d2), k2);
        const pk = WX.pink * .4 * df;
        top.lerp(new THREE.Color('#F6C6D8'), pk);
        mid.lerp(new THREE.Color('#FBD5E0'), pk)
      }
      document.body.style.background = 'linear-gradient(#' + top.getHexString() + ',#' + mid.getHexString() + ' 55%,#' + bot.getHexString() + ')';
      scene.fog.color.copy(mid);
      sunV.position.set(-Math.cos(A) * 10, Math.sin(A) * 11, 4).normalize().multiplyScalar(60);
      sunV.position.x += MX;
      sunV.visible = e > -.15 && WX.cover < .7;
      sunV.material.color.copy(C('#FF9F5A', '#FFF0BE', cl(e * 2.5, 0, 1)));
      moonV.position.set(Math.cos(A) * 10, -Math.sin(A) * 11, -4).normalize().multiplyScalar(60);
      moonV.position.x += MX;
      moonV.visible = e < .15;
      starsP.material.opacity = 1 - df;
      starsP.visible = df < .98;
      const cm = mat('#EAF0F4', true);
      cm.color.copy(C('#4A5580', '#EAF0F4', df).lerp(new THREE.Color('#8E94AE'), WX.cover * .5));
      cm.emissive.copy(cm.color).multiplyScalar(.13);
      window.glowF = .3 + .7 * (1 - df);
      window.dfv = df;
      window.sunDir = {
        x: -Math.cos(A) * 10,
        z: 4
      };
      window.sunE = e
    }
  }
  const wg = new THREE.PlaneGeometry(.34, .26);
  wg.translate(.17, 0, 0);
  for (let i = 0; i < 0; i++) {
    const b = new THREE.Group(),
      c = ['#F5C7D5', '#F5DEA0', '#B9D8EB', '#D4C7EA'][i],
      m = new THREE.MeshBasicMaterial({
        color: c,
        side: 2
      });
    const w1 = new THREE.Mesh(wg, m),
      w2 = new THREE.Mesh(wg, m);
    w2.rotation.y = Math.PI;
    b.add(w1, w2);
    b.userData = {
      w: [w1, w2],
      i,
      bee: false
    };
    scene.add(b);
    bf.push(b)
  }
  for (let i = 0; i < 0; i++) {
    const b = new THREE.Group();
    b.add(mk(SPH, '#F5D04A', [0, 0, 0], [.09, .08, .12]), mk(SPH, '#5B4A3A', [0, 0, -.07], [.085, .075, .04]));
    b.userData = {
      i: i + 5,
      bee: true
    };
    scene.add(b);
    bf.push(b)
  }
}
