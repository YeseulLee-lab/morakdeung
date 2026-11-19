'use strict';
/* =========================================================
   ENGINE — simulation, rendering orchestration, input, demo
   ========================================================= */
(function () {
  const A = window.ART, W = 480, H = 270, INK = A.INK;
  const { R, disc, glow, ptext, num, spr, chibi, bubble, dish, lantern } = A;

  // ---------------- DATA ----------------
  const ING_LIST = [
    { id: 'daikon', name: '무', price: 120, cost: 35, rank: 0, dev: 0 },
    { id: 'tamago', name: '달걀', price: 100, cost: 30, rank: 0, dev: 0 },
    { id: 'konnyaku', name: '곤약', price: 80, cost: 20, rank: 0, dev: 0 },
    { id: 'chikuwa', name: '치쿠와', price: 90, cost: 25, rank: 0, dev: 0 },
    { id: 'kombu', name: '다시마', price: 90, cost: 25, rank: 1, dev: 400 },
    { id: 'hanpen', name: '한펜', price: 110, cost: 35, rank: 1, dev: 600 },
    { id: 'ganmo', name: '두부튀김', price: 130, cost: 40, rank: 1, dev: 900 },
    { id: 'mochikin', name: '떡주머니', price: 160, cost: 50, rank: 2, dev: 1500 },
    { id: 'gyusuji', name: '소힘줄', price: 220, cost: 80, rank: 2, dev: 2200 },
    { id: 'tsukune', name: '닭완자', price: 180, cost: 60, rank: 3, dev: 2800 },
    { id: 'roll', name: '양배추롤', price: 250, cost: 90, rank: 3, dev: 3600 },
    { id: 'tako', name: '문어', price: 280, cost: 100, rank: 4, dev: 5000 },
  ];
  const ING = {}; ING_LIST.forEach(i => (ING[i.id] = i));
  const RANKS = [
    { name: '골목 안 작은 가게', sales: 0, rep: 0 },
    { name: '동네 오뎅집', sales: 3000, rep: 2.5 },
    { name: '소문난 맛집', sales: 10000, rep: 3.2 },
    { name: '줄 서는 가게', sales: 25000, rep: 3.7 },
    { name: '전설의 오뎅집', sales: 60000, rep: 4.2 },
  ];
  const UPG = [
    { id: 'lantern1', name: '홍등 늘리기', desc: '가게 앞과 안에 등불을 2개 추가. 인기와 손님 증가', price: 500, rank: 0, icon: 'u_lantern' },
    { id: 'seat1', name: '카운터석 +2', desc: '카운터를 6석으로 넓힌다', price: 900, rank: 0, icon: 'u_seat' },
    { id: 'pot1', name: '큰 냄비', desc: '칸 9개 · 준비 최대 8개 · 끓이는 시간 단축', price: 1200, rank: 0, icon: 'u_pot' },
    { id: 'sign', name: '입간판', desc: '지나가는 사람 눈에 띄어 손님 증가', price: 1000, rank: 1, icon: 'u_sign' },
    { id: 'sake', name: '데운 사케 세트', desc: '데운 사케(¥300) 주문이 들어온다', price: 1600, rank: 1, icon: 'sake' },
    { id: 'table1', name: '테이블석 A', desc: '4인용 테이블 설치', price: 1800, rank: 1, icon: 'u_table' },
    { id: 'seat2', name: '카운터석 +2', desc: '카운터를 8석으로 넓힌다', price: 2400, rank: 2, icon: 'u_seat', req: 'seat1' },
    { id: 'lantern2', name: '등불 장식 줄', desc: '처마와 천장에 작은 등불을 줄줄이. 인기 증가', price: 2000, rank: 2, icon: 'u_lantern', req: 'lantern1' },
    { id: 'dashi', name: '비법 육수', desc: '모든 손님의 만족도 증가', price: 3500, rank: 2, icon: 'u_dashi' },
    { id: 'pot2', name: '특대 구리 냄비', desc: '칸 12개 · 준비 최대 10개 · 더 빨리 끓는다', price: 5000, rank: 2, icon: 'u_pot', req: 'pot1' },
    { id: 'table2', name: '테이블석 B', desc: '두 번째 4인용 테이블', price: 4500, rank: 3, icon: 'u_table', req: 'table1' },
    { id: 'staff', name: '알바생 고용', desc: '기다리는 주문을 자동으로 서빙해 준다', price: 7000, rank: 3, icon: 'u_staff' },
  ];
  const UPGM = {}; UPG.forEach(u => (UPGM[u.id] = u));
  const LOOKS = [
    { id: 'sala', name: '회사원', skin: '#f2c79a', hair: '#2a2220', hs: 'short', top: '#38425e', bottom: '#2a3044', tie: '#c8323a', pat: 34, tip: 1.0 },
    { id: 'sala2', name: '과장님', skin: '#eab88a', hair: '#4a4440', hs: 'short', top: '#4a4a50', bottom: '#33333a', tie: '#3a6ac8', pat: 30, tip: 1.2 },
    { id: 'ol', name: '커리어우먼', skin: '#f6d0a8', hair: '#7a4a2a', hs: 'long', top: '#e0809a', bottom: '#4a3a5a', pat: 38, tip: 1.0 },
    { id: 'oji', name: '단골 아저씨', skin: '#e8b88a', hair: '#9a9a9a', hs: 'bald', top: '#7a5a3a', bottom: '#4a3a2a', pat: 50, tip: 1.3 },
    { id: 'stu', name: '학생', skin: '#f2c79a', hair: '#1e1a1a', hs: 'short', top: '#1e2230', bottom: '#1e2230', btn: '#e0c050', pat: 28, tip: 0.6 },
    { id: 'girl', name: '멋쟁이', skin: '#f6d0a8', hair: '#3a2a24', hs: 'bob', top: '#5aa060', bottom: '#3a4050', pat: 32, tip: 1.0 },
    { id: 'work', name: '목수 아저씨', skin: '#d8a070', hair: '#2a2220', hs: 'band', band: '#e8e8e8', top: '#d87a2a', bottom: '#4a4a5a', pat: 42, tip: 1.1 },
    { id: 'gran', name: '할머니', skin: '#f0c8a0', hair: '#d8d8d8', hs: 'bun', top: '#8a5a8a', bottom: '#5a4a5a', pat: 55, tip: 1.4 },
  ];
  const CHEF = { skin: '#eab88a', hair: '#2a2220', hs: 'chef', band: '#f4f4f0', top: '#f4f4f0', bottom: '#3a3a4a', apron: '#2a3a6a' };
  const STAFF = { skin: '#f6d0a8', hair: '#3a2420', hs: 'bun', top: '#d86a8a', bottom: '#5a3a4a', apron: '#f4f0e8' };
  const UMB = [['#3a5aa8', '#6a8ad8'], ['#c84a4a', '#f08080'], ['#e8e4dc', '#ffffff'], ['#2a2a30', '#5a5a66'], ['#3a8a5a', '#6ac08a'], ['#d8a030', '#ffd070']];
  // ---- quarter-view interior layout (world tiles → A.iso) ----
  const IS = A.iso, IL = A.IL;
  const KX = [3, 4, 2, 5, 1, 6, 0, 7];            // counter seats fill from the pot outward
  const DOOR = [10.55, -0.35], AIS_C = 0.95, AIS_A = 5.45, AIS_B = 8.7, HUBX = 9.75, CTR_GY = 2.25;
  const S_IDLE = [9.95, 4.05], S_PASS = [9.35, 2.85], CHEF_AT = [3.7, 3.7];
  const TABLES = { A: [3.0, 7.0], B: [7.2, 7.0] };
  const worldGy = (x, y) => ((y - IL.OY) / IL.HH - (x - IL.OX) / IL.HW) / 2;
  const POT = (() => {
    const [a, b, c, d] = IL.POT, pts = [];
    [IL.CH, IL.CH + 5].forEach(h => [[a, b], [c, b], [c, d], [a, d]].forEach(([x, y]) => pts.push(IS(x, y, h))));
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const ctr = IS((a + c) / 2, (b + d) / 2, IL.CH + 5);
    return { x0: Math.min(...xs) - 2, x1: Math.max(...xs) + 2, y0: Math.min(...ys) - 2, y1: Math.max(...ys) + 2, cx: ctr[0], cy: ctr[1], in: [a + 0.1, b + 0.07, c - 0.1, d - 0.07] };
  })();
  const dirOf = (dx, dy) => (dy < -0.01 ? 'up' : dx < 0 ? 'left' : 'right');
  // ---- quarter-view street (A.isoE) ----
  const IE = A.isoE;
  const PUDDLES = A.PUD.map(([gx, gy, r]) => { const q = IE(gx, gy); return [q[0], q[1], r * 18, r * 8]; });
  const groundY = x => A.EX.OY + (x - A.EX.OX) / 2 + 6 * A.EX.HH; // street level just in front of the facades
  const DOOR_PT = IE(7, 3, 20);
  const SHOP_POLY = [IE(4, 3, 0), IE(10, 3, 0), IE(10.25, 3.45, 97), IE(10.25, 1.4, 118), IE(3.75, 1.4, 118), IE(3.75, 3.45, 97)];
  const inPoly = (x, y, P) => { let k = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k; } return k; };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // Korean particle by final consonant: josa('학생','이','가') -> '이'
  const josa = (w, withF, noF) => { const k = w.charCodeAt(w.length - 1) - 0xac00; return k >= 0 && k < 11172 && k % 28 ? withF : noF; };
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function createEngine() {
    const E = { ING, ING_LIST, RANKS, UPG, UPGM };
    const LS = {};
    E.on = (k, f) => { (LS[k] || (LS[k] = [])).push(f); return () => { LS[k] = LS[k].filter(x => x !== f); }; };
    E.emit = (k, v) => (LS[k] || []).forEach(f => f(v));
    const sfx = k => E.emit('sfx', k);
    const toast = (text, kind) => E.emit('toast', { text, kind });

    const SAVE_KEY = 'oden-yugeakari-v1';
    const fresh = () => ({ money: 800, total: 0, pop: 10, rep: 3, rank: 0, served: 0, day: 1, best: 0, menu: ['daikon', 'tamago', 'konnyaku', 'chikuwa'], stock: { daikon: 6, tamago: 6, konnyaku: 6, chikuwa: 6 }, up: {} });
    let P = fresh();
    Object.defineProperty(E, 'P', { get: () => P });
    const s = {
      scene: 'title', t: 0, clock: 0, customers: [], fx: [], steam: [], peds: [], drops: [], splash: [], ripples: [],
      order: null, trans: null, spawnT: 2, day: null, closed: false, staff: null, chef: { serve: 0 }, simmer: {},
      hover: null, hoverShop: false, demo: null, pedT: 0.5, saveT: 0, lastOrderToast: false,
    };
    E.s = s;
    let uid = 0;
    const freshDay = () => ({ sales: 0, cust: 0, angry: 0, stars: 0, n: 0 });
    s.day = freshDay();

    // ---------------- derived ----------------
    E.counterSeats = () => 4 + (P.up.seat1 ? 2 : 0) + (P.up.seat2 ? 2 : 0);
    E.potLv = () => (P.up.pot2 ? 2 : P.up.pot1 ? 1 : 0);
    E.slots = () => [6, 9, 12][E.potLv()];
    E.stockMax = () => [6, 8, 10][E.potLv()];
    E.simmerT = () => [5, 3.5, 2.2][E.potLv()];
    E.lanternN = () => 2 + (P.up.lantern1 ? 2 : 0);

    function buildSeats() {
      const seats = [], door = IS(DOOR[0], DOOR[1]);
      const pt = (gx, gy, lift) => { const q = IS(gx, gy); return [q[0], q[1] - lift]; };
      for (let i = 0; i < E.counterSeats(); i++) {
        const gx = 1.5 + KX[i], gy = 1.75, [x, y] = pt(gx, gy, 3), b = IS(gx - 0.05, 2.52, IL.CH);
        seats.push({ id: 'c' + i, type: 'c', gx, gy, x, y, dir: 'down', bowl: { x: b[0], y: b[1] },
          path: [door, IS(DOOR[0], AIS_C), IS(gx, AIS_C), [x, y]], appr: { to: [gx + 0.5, AIS_C + 0.1], aisle: AIS_C } });
      }
      const tables = [];
      if (P.up.table1) tables.push({ id: 'A' });
      if (P.up.table2) tables.push({ id: 'B' });
      tables.forEach(t => {
        const [cx, cy] = TABLES[t.id]; t.gx = cx; t.gy = cy; [t.x, t.y] = IS(cx, cy);
        [-0.48, 0.48].forEach((dx, i) => {
          const gx = cx + dx, side = dx < 0 ? -1 : 1;
          let [x, y] = pt(gx, cy - 1.0, 1), b = IS(gx, cy - 0.28, IL.TH);
          seats.push({ id: 't' + t.id + 'u' + i, type: 'tt', table: t.id, gx, gy: cy - 1.0, x, y, dir: 'down', bowl: { x: b[0], y: b[1] },
            path: [door, IS(DOOR[0], AIS_A), IS(gx, AIS_A), [x, y]], appr: { to: [gx + side * 0.55, AIS_A + 0.1], aisle: AIS_A } });
          [x, y] = pt(gx, cy + 1.05, 1); b = IS(gx, cy + 0.28, IL.TH);
          seats.push({ id: 't' + t.id + 'd' + i, type: 'tb', table: t.id, gx, gy: cy + 1.05, x, y, dir: 'up', bowl: { x: b[0], y: b[1] },
            path: [door, IS(DOOR[0], AIS_B), IS(gx, AIS_B), [x, y]], appr: { to: [gx + side * 0.55, AIS_B - 0.25], aisle: AIS_B } });
        });
      });
      E.seats = seats; E.tables = tables;
      dirty = true;
    }

    // ---------------- persistence ----------------
    E.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
    function save() {
      if (s.demo || s.scene === 'title') return;
      try {
        const p = JSON.parse(JSON.stringify(P));
        Object.keys(s.simmer).forEach(id => { p.stock[id] = (p.stock[id] || 0) + s.simmer[id].n; });
        if (s.order) s.order.bowl.forEach(id => { p.stock[id] = (p.stock[id] || 0) + 1; });
        localStorage.setItem(SAVE_KEY, JSON.stringify({ P: p, clock: s.clock, day: s.day }));
      } catch (e) { /* storage unavailable */ }
    }
    E.save = save;
    function resetTransient() {
      s.customers = []; s.fx = []; s.order = null; s.trans = null; s.staff = null; s.simmer = {};
      s.closed = false; s.spawnT = 2; s.day = freshDay(); s.hover = null; s.hoverShop = false; s.lastOrderToast = false;
    }
    E.newGame = function () {
      P = fresh(); resetTransient(); s.clock = 0; s.scene = 'exterior'; buildSeats();
      toast('가게를 클릭해서 들어가 보세요'); save();
    };
    E.loadGame = function () {
      try {
        const d = JSON.parse(localStorage.getItem(SAVE_KEY));
        P = Object.assign(fresh(), d.P); resetTransient(); s.clock = d.clock || 0; if (d.day) s.day = d.day;
      } catch (e) { P = fresh(); resetTransient(); s.clock = 0; }
      s.scene = 'exterior'; buildSeats(); toast(`${P.day}일째 밤 영업 재개`);
    };
    E.toTitle = function () { save(); resetTransient(); s.scene = 'title'; };

    // ---------------- canvas setup ----------------
    let canvas, ctx, buf, bctx, bgExt, bgIn, bgCtr, bgFr, dirty = true, raf = 0, last = 0;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; };
    E.attach = function (cv, cursorEl) {
      canvas = cv; E.canvas = cv; E.cursorEl = cursorEl;
      cv.width = W; cv.height = H; ctx = cv.getContext('2d');
      buf = mk(); bctx = buf.getContext('2d'); bgExt = mk(); bgIn = mk(); bgCtr = mk(); bgFr = mk();
      [ctx, bctx].forEach(c => (c.imageSmoothingEnabled = false));
      buildSeats();
      for (let i = 0; i < 240; i++) s.drops.push(newDrop(true));
      last = performance.now();
      cancelAnimationFrame(raf);
      const loop = now => { const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; try { update(dt); render(); } catch (e) { console.error(e); } raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    };
    E.markDirty = () => { dirty = true; };
    E.rebuild = () => buildSeats();
    E.ff = async function (sec) { for (let i = 0; i < sec * 10; i++) { for (let k = 0; k < 6; k++) update(1 / 60); await new Promise(r => setTimeout(r, 20)); } };
    function repaintStatic() {
      const opt = { sign: !!P.up.sign, rank: P.rank, seats: E.seats };
      let c = bgExt.getContext('2d'); c.clearRect(0, 0, W, H); A.paintExteriorBG(c, opt);
      c = bgIn.getContext('2d'); c.clearRect(0, 0, W, H); A.paintInteriorBG(c, opt);
      c = bgCtr.getContext('2d'); c.clearRect(0, 0, W, H); A.paintCounter(c, opt);
      c = bgFr.getContext('2d'); c.clearRect(0, 0, W, H); A.paintPartition(c, opt);
      dirty = false;
    }

    // ---------------- weather / ambient ----------------
    function newDrop(anyY) { const x = rnd(-10, 540), g = groundY(x - 40) + 4; return { x, y: anyY ? rnd(-20, 270) : rnd(-40, -5), v: rnd(250, 330), gy: g < 274 ? rnd(g, 276) : 300 }; }
    function updAmbient(dt) {
      for (const d of s.drops) {
        d.y += d.v * dt; d.x -= d.v * dt * 0.22;
        if (d.y >= d.gy) {
          if (d.gy < 270) {
            s.splash.push({ x: d.x, y: d.gy, t: 0 });
            for (const p of PUDDLES) if (((d.x - p[0]) / p[2]) ** 2 + ((d.gy - p[1]) / (p[3] + 1)) ** 2 < 1) { s.ripples.push({ x: d.x, y: p[1], t: 0 }); break; }
          }
          Object.assign(d, newDrop(false));
        }
      }
      s.splash = s.splash.filter(p => (p.t += dt) < 0.18);
      s.ripples = s.ripples.filter(p => (p.t += dt) < 0.7);
      // steam
      const sc = s.scene;
      if (sc === 'exterior' || sc === 'title') {
        if (Math.random() < dt * 9) s.steam.push({ ...(([x, y]) => ({ x, y }))(IE(rnd(6.4, 7.6), 3.3, 47)), vx: rnd(-4, 6), vy: rnd(-14, -9), r: rnd(1.5, 3), t: 0, life: rnd(1.6, 2.6), w: 'ext' });
        if (Math.random() < dt * 6) s.steam.push({ ...(([x, y]) => ({ x: x + rnd(-1, 1), y }))(IE(9.15, 1.05, 132)), vx: rnd(2, 8), vy: rnd(-8, -4), r: rnd(1.5, 3), t: 0, life: rnd(1, 1.6), w: 'ext' });
      } else if (sc === 'interior') {
        if (Math.random() < dt * 14) { const q = IS(rnd(POT.in[0], POT.in[2]), rnd(POT.in[1], POT.in[3]), IL.CH + 5); s.steam.push({ x: q[0], y: q[1] - 2, vx: rnd(-3, 3), vy: rnd(-16, -9), r: rnd(1.5, 3.5), t: 0, life: rnd(1.4, 2.4), w: 'in' }); }
      } else if (sc === 'pot') {
        if (Math.random() < dt * 22) s.steam.push({ x: rnd(140, 350), y: rnd(60, 240), vx: rnd(-6, 6), vy: rnd(-26, -14), r: rnd(4, 9), t: 0, life: rnd(1.2, 2.2), w: 'pot' });
      }
      s.steam = s.steam.filter(p => { p.t += dt; p.x += p.vx * dt + Math.sin(p.t * 3 + p.y) * 0.1; p.y += p.vy * dt; p.r += dt * 2.2; return p.t < p.life; });
      // pedestrians
      s.pedT -= dt;
      if (s.pedT <= 0) { s.pedT = rnd(1.3, 3.4); addPed(false); }
      s.peds = s.peds.filter(p => {
        p.ft += dt; if (p.ft > 0.16) { p.ft = 0; p.f++; }
        if (p.toDoor && p.phase === 0) {
          const dx = 7 - p.gx; p.gx += Math.sign(dx) * Math.min(Math.abs(dx), Math.abs(p.v) * dt); p.dir = dx < 0 ? 'left' : 'right';
          if (p.gy > 3.7) p.gy -= dt * 0.4;
          if (Math.abs(dx) < 0.05) { p.phase = 1; p.dir = 'up'; }
        } else if (p.toDoor) { p.gy -= 0.75 * dt; if (p.gy < 3.05) return false; }
        else p.gx += p.v * dt;
        [p.x, p.y] = IE(p.gx, p.gy);
        return p.gx - p.gy > -A.EX.OX / A.EX.HW - 1.6 && p.gx - p.gy < (W - A.EX.OX) / A.EX.HW + 1.6;
      });
    }
    function addPed(toDoor) {
      const fromLeft = Math.random() < 0.5, u = pick(UMB), lane = Math.random(), EW = A.EX;
      const gy = toDoor ? rnd(3.45, 3.95) : lane < 0.45 ? rnd(3.4, 4.1) : lane < 0.7 ? rnd(5.0, 9.0) : rnd(9.75, 10.5);
      const p = { gx: fromLeft ? gy - EW.OX / EW.HW - 1.2 : gy + (W - EW.OX) / EW.HW + 1.2, gy, v: (fromLeft ? 1 : -1) * rnd(0.9, 1.4), dir: fromLeft ? 'right' : 'left', look: pick(LOOKS), umb: u[0], umbHi: u[1], f: 0, ft: Math.random() * 0.2, toDoor, phase: 0 };
      if (toDoor) p.gx = fromLeft ? rnd(-6, 2) : rnd(12, 20);
      [p.x, p.y] = IE(p.gx, p.gy); s.peds.push(p);
    }

    // ---------------- customers ----------------
    function makeOrder() {
      const menu = shuffle(P.menu.slice());
      const r = Math.random();
      const kinds = Math.min(menu.length, r < 0.4 ? 1 : r < 0.8 ? 2 : 3);
      const items = {}; let total = 0;
      menu.slice(0, kinds).forEach(id => { const q = Math.random() < 0.25 && total < 3 ? 2 : 1; items[id] = q; total += q; });
      return { items, karashi: Math.random() < 0.3, sake: !!P.up.sake && Math.random() < 0.4 };
    }
    function spawn(opts) {
      opts = opts || {};
      const free = E.seats.filter(se => !s.customers.some(c => c.seat.id === se.id));
      if (!free.length) return null;
      let pool = free;
      if (opts.prefer) { const p = free.filter(se => opts.prefer.includes(se.id)); if (p.length) pool = p; }
      else { const cs = free.filter(se => se.type === 'c'); if (cs.length && Math.random() < 0.6) pool = cs; }
      const seat = opts.prefer ? pool[0] : pick(pool);
      const look = pick(LOOKS);
      const c = { id: ++uid, look, seat, st: 'walk', path: seat.path.map(p => p.slice()), pi: 1, x: seat.path[0][0], y: seat.path[0][1], dir: 'left', f: 0, ft: 0, t: 0, order: makeOrder(), pat: 0, patMax: look.pat * (1 + P.rep * 0.05), bowl: null };
      s.customers.push(c); s.day.cust++;
      if (s.scene === 'exterior') addPed(true);
      sfx('door');
      return c;
    }
    E.spawn = spawn;
    function leave(c) { c.st = 'leave'; c.path = c.seat.path.slice().reverse().map(p => p.slice()); c.pi = 1; c.t = 0; }
    const getC = id => s.customers.find(c => c.id === id);
    E.orderCustomer = () => (s.order && s.order.cid ? getC(s.order.cid) : null);

    function updCustomer(c, dt) {
      c.t += dt; c.ft += dt;
      const spd = s.demo ? 80 : 46;
      if (c.st === 'walk' || c.st === 'leave') {
        if (c.ft > 0.14) { c.ft = 0; c.f++; }
        const tg = c.path[c.pi]; const dx = tg[0] - c.x, dy = tg[1] - c.y, d = Math.hypot(dx, dy);
        if (d <= spd * dt) {
          c.x = tg[0]; c.y = tg[1]; c.pi++;
          if (c.pi >= c.path.length) {
            if (c.st === 'walk') { c.st = 'sit'; c.t = 0; c.dir = c.seat.dir; } else c.dead = true;
          }
        } else {
          c.x += (dx / d) * spd * dt; c.y += (dy / d) * spd * dt;
          c.dir = dirOf(dx, dy);
        }
        return;
      }
      if (c.st === 'sit' && c.t > 0.35) { c.st = 'think'; c.t = 0; c.thinkT = s.demo ? 0.4 : rnd(1.1, 2.2); }
      else if (c.st === 'think' && c.t > c.thinkT) { c.st = 'order'; c.t = 0; c.pat = c.patMax; sfx('ding'); }
      else if (c.st === 'order') {
        const open = s.order && s.order.cid === c.id;
        c.pat -= dt * (open ? 0.35 : 1) * (s.demo ? 0.3 : 1);
        if (c.pat <= 0) {
          c.st = 'angry'; c.t = 0; s.day.angry++;
          P.pop = clamp(P.pop - 4, 0, 100); P.rep = clamp(P.rep * 0.9 + 0.1, 0, 5);
          if (open) { closeOrder(true); }
          toast(`${c.look.name}${josa(c.look.name, '이', '가')} 화가 나서 돌아갔어요…`, 'bad'); sfx('bad');
          s.fx.push({ k: 'emote', e: 'anger', x: c.x, y: c.y - 30, t: 0, life: 1.4 });
          if (c.claimed && s.staff) { c.claimed = false; }
        }
      } else if (c.st === 'eat') {
        if (c.ft > 0.32) { c.ft = 0; c.f++; }
        if (c.t > (s.demo ? 3 : 6.5)) { c.st = 'done'; c.t = 0; s.fx.push({ k: 'emote', e: c.sat > 0.7 ? 'heart' : c.sat > 0.4 ? 'note' : 'sweat', x: c.x, y: c.y - 30, t: 0, life: 1.2 }); }
      } else if (c.st === 'done' && c.t > 1.0) leave(c);
      else if (c.st === 'angry' && c.t > 1.3) leave(c);
    }

    // ---------------- serving & scoring ----------------
    function score(c, items, karashi, sake) {
      const need = c.order.items, got = {};
      items.forEach(id => (got[id] = (got[id] || 0) + 1));
      let needN = 0, correct = 0, extra = 0;
      for (const id in need) { needN += need[id]; correct += Math.min(need[id], got[id] || 0); }
      for (const id in got) extra += Math.max(0, got[id] - (need[id] || 0));
      let acc = correct / needN - extra * 0.12;
      if (c.order.karashi && !karashi) acc -= 0.12;
      if (!c.order.karashi && karashi) acc -= 0.05;
      if (c.order.sake && !sake) acc -= 0.15;
      const perfect = correct === needN && extra === 0 && c.order.karashi === !!karashi && (!!c.order.sake === !!sake);
      const speed = clamp(c.pat / c.patMax, 0, 1);
      let sat = Math.max(0, acc) * 0.72 + speed * 0.28 + (P.up.dashi ? 0.1 : 0) + (perfect ? 0.06 : 0);
      sat = clamp(sat, 0, 1);
      const pay = items.reduce((a, id) => a + ING[id].price, 0) + (sake ? 300 : 0);
      const tip = sat >= 0.8 ? Math.round(pay * (0.1 + (sat - 0.8)) * c.look.tip / 10) * 10 : 0;
      const stars = clamp(Math.round(1 + sat * 4), 1, 5);
      return { sat, pay, tip, stars, perfect };
    }
    function applyServe(c, res, items, karashi, sake) {
      c.st = 'eat'; c.t = 0; c.f = 0; c.bowl = { items, karashi, sake }; c.sat = res.sat;
      const total = res.pay + res.tip;
      P.money += total; P.total += total; P.served++;
      s.day.sales += total; s.day.n++; s.day.stars += res.stars;
      P.pop = clamp(P.pop + (res.sat - 0.45) * 5, 0, 100);
      P.rep = clamp(P.rep * 0.88 + res.stars * 0.12, 0, 5);
      const x = c.x, y = c.y - 34;
      const word = res.perfect && res.sat > 0.85 ? '최고야!' : res.sat >= 0.8 ? '맛있다!' : res.sat >= 0.55 ? '맛있어' : res.sat >= 0.35 ? '그럭저럭' : '으음…';
      s.fx.push({ k: 'jp', str: word, x, y: y - 10, col: res.sat >= 0.55 ? '#ffe7a0' : '#d8d0c8', t: 0, life: 1.6 });
      s.fx.push({ k: 'num', str: '¥+' + total, x, y: y, col: '#ffd24a', t: 0, life: 1.8, s: 1 });
      s.fx.push({ k: 'stars', n: res.stars, x, y: y + 8, t: 0, life: 1.8 });
      if (res.tip) s.fx.push({ k: 'jp', str: '팁 ¥' + res.tip, x: x, y: y - 20, col: '#9ff0b0', t: -0.25, life: 1.6, size: 8 });
      const n = Math.min(8, 2 + Math.floor(total / 150));
      for (let i = 0; i < n; i++) s.fx.push({ k: 'coin', x0: x + rnd(-6, 6), y0: y + 10, t: -i * 0.06, dur: 0.75 });
      sfx('coin');
      E.emit('sale', total);
      checkRank(); save();
    }
    function checkRank() {
      const nx = RANKS[P.rank + 1]; if (!nx) return;
      if (P.total >= nx.sales && P.rep >= nx.rep) {
        P.rank++;
        const unl = [...ING_LIST.filter(i => i.rank === P.rank).map(i => i.name), ...UPG.filter(u => u.rank === P.rank).map(u => u.name)];
        P.pop = clamp(P.pop + 8, 0, 100); dirty = true;
        E.emit('rankup', { rank: P.rank, name: RANKS[P.rank].name, unl }); sfx('jingle');
      }
    }

    // ---------------- staff (part-timer) ----------------
    function updStaff(dt) {
      if (!P.up.staff) { s.staff = null; return; }
      let st = s.staff;
      if (!st) { const q = IS(S_IDLE[0], S_IDLE[1]); st = s.staff = { x: q[0], y: q[1], dir: 'down', f: 0, ft: 0, st: 'idle', t: 0, path: null, pi: 0, target: null, dish: null, appr: null }; }
      st.t += dt; st.ft += dt;
      const walkW = pts => { st.path = [[st.x, st.y], ...pts.map(q => IS(q[0], q[1]))]; st.pi = 1; };
      const goBack = () => { st.st = 'back'; const a = st.appr; walkW(a ? [[a.to[0], a.aisle], [HUBX, a.aisle], S_IDLE] : [S_IDLE]); st.appr = null; };
      if (st.path) {
        if (st.ft > 0.14) { st.ft = 0; st.f++; }
        const spd = 52, tg = st.path[st.pi]; const dx = tg[0] - st.x, dy = tg[1] - st.y, d = Math.hypot(dx, dy);
        if (d <= spd * dt) { st.x = tg[0]; st.y = tg[1]; st.pi++; if (st.pi >= st.path.length) { st.path = null; st.t = 0; arrived(); } }
        else { st.x += (dx / d) * spd * dt; st.y += (dy / d) * spd * dt; st.dir = dirOf(dx, dy); }
        return;
      }
      function arrived() {
        if (st.st === 'toPass') { st.st = 'pick'; st.dir = 'left'; }
        else if (st.st === 'toCust') {
          const c = getC(st.target);
          if (c && c.st === 'order') { const res = score(c, st.dish.items, st.dish.karashi, st.dish.sake); res.sat = clamp(res.sat * 0.92, 0, 1); applyServe(c, res, st.dish.items, st.dish.karashi, st.dish.sake); }
          else st.dish.items.forEach(id => (P.stock[id] = (P.stock[id] || 0) + 1));
          st.dish = null; goBack();
        } else if (st.st === 'back') { st.st = 'idle'; st.dir = 'down'; }
      }
      if (st.st === 'idle' && st.t > 1.2) {
        const c = s.customers.find(c => c.st === 'order' && !(s.order && s.order.cid === c.id) && c.t > 4 && !c.claimed);
        if (c) { c.claimed = true; st.target = c.id; st.st = 'toPass'; walkW([S_PASS]); }
      } else if (st.st === 'pick' && st.t > 1.4) {
        const c = getC(st.target);
        if (!c || c.st !== 'order') { goBack(); return; }
        const items = []; let ok = true;
        for (const id in c.order.items) { if ((P.stock[id] || 0) < c.order.items[id]) ok = false; }
        if (!ok) { c.claimed = false; goBack(); toast('품절이라 서빙할 수 없어요. 재료를 준비하세요!', 'bad'); return; }
        for (const id in c.order.items) for (let i = 0; i < c.order.items[id]; i++) { P.stock[id]--; items.push(id); }
        st.dish = { items, karashi: c.order.karashi, sake: c.order.sake }; s.chef.serve = 0.6;
        st.st = 'toCust'; const a = c.seat.appr; st.appr = a; walkW([[HUBX, a.aisle], [a.to[0], a.aisle], a.to]);
      }
    }

    // ---------------- main update ----------------
    function update(dt) {
      s.t += dt;
      updAmbient(dt);
      const playing = s.scene !== 'title';
      if (playing) {
        if (!s.demo && !s.closed) {
          s.clock = Math.min(480, s.clock + dt * 2);
          if (s.clock >= 450 && !s.lastOrderToast) { s.lastOrderToast = true; toast('마지막 주문! 이제 새 손님은 오지 않아요'); }
          if (s.clock >= 480 && s.customers.length === 0 && !s.order) {
            s.closed = true; P.best = Math.max(P.best, s.day.sales);
            E.emit('summary', { day: P.day, ...s.day, avg: s.day.n ? s.day.stars / s.day.n : 0 }); save();
          }
        }
        if (!s.closed && (s.demo || s.clock < 450)) {
          s.spawnT -= dt;
          if (s.spawnT <= 0) {
            spawn();
            const base = 10.5 - P.pop * 0.055 - (E.lanternN() - 2) * 0.5 - (P.up.lantern2 ? 0.6 : 0) - (P.up.sign ? 1.2 : 0) - P.rank * 0.5;
            s.spawnT = (s.demo ? 3.4 : clamp(base, 2.4, 12)) * rnd(0.75, 1.25);
          }
        }
        s.customers.forEach(c => updCustomer(c, dt));
        s.customers = s.customers.filter(c => !c.dead);
        updStaff(dt);
        for (const id in s.simmer) { const m = s.simmer[id]; m.t -= dt; if (m.t <= 0) { P.stock[id] = (P.stock[id] || 0) + m.n; delete s.simmer[id]; } }
        s.chef.serve = Math.max(0, s.chef.serve - dt);
        s.saveT += dt; if (s.saveT > 5) { s.saveT = 0; save(); }
      }
      // fx
      s.fx = s.fx.filter(f => {
        if (f.delay > 0) { f.delay -= dt; return true; }
        f.t += dt;
        if (f.k === 'dish' && f.t >= f.dur) { const c = getC(f.cid); if (c) applyServe(c, f.res, f.items, f.karashi, f.sake); return false; }
        if (f.k === 'coin' && f.t >= f.dur) { E.emit('coin'); return false; }
        if (f.k === 'fly' && f.t >= f.dur) return false;
        return f.t < (f.life || f.dur || 1);
      });
      // transitions
      const tr = s.trans;
      if (tr) {
        tr.t += dt;
        if (!tr.switched && tr.t >= tr.dur * tr.mid) { tr.switched = true; tr.onMid && tr.onMid(); }
        if (tr.t >= tr.dur) { s.trans = null; tr.onDone && tr.onDone(); }
      }
      if (s.demo) updDemo(dt);
    }

    // =====================================================
    // RENDER
    // =====================================================
    function render() {
      if (dirty) repaintStatic();
      const tr = s.trans;
      let z = 1, fx = 240, fy = 135, black = 0, white = 0;
      if (tr) {
        const k = clamp(tr.t / tr.dur, 0, 1);
        if (tr.kind === 'enter' || tr.kind === 'exit') {
          if (k < 0.5) { black = k / 0.5; if (tr.kind === 'enter') { z = 1 + ease(k / 0.5) * 1.6; fx = DOOR_PT[0]; fy = DOOR_PT[1]; } }
          else { black = 1 - (k - 0.5) / 0.5; if (tr.kind === 'exit') { z = 1 + (1 - ease((k - 0.5) / 0.5)) * 0.8; fx = DOOR_PT[0]; fy = DOOR_PT[1]; } }
        } else if (tr.kind === 'potIn') {
          if (k < tr.mid) { z = 1 + ease(k / tr.mid) * 2.6; fx = POT.cx; fy = POT.cy; }
          else white = (1 - (k - tr.mid) / (1 - tr.mid)) * 0.75;
        } else if (tr.kind === 'potOut') { z = 1 + (1 - ease(k)) * 2.2; fx = POT.cx; fy = POT.cy; }
      }
      const c = bctx;
      c.save();
      const sc = s.scene;
      if (sc === 'exterior' || sc === 'title') drawExterior(c);
      else if (sc === 'interior') drawInterior(c);
      else if (sc === 'pot') drawPot(c);
      c.restore();
      ctx.save();
      if (z !== 1) {
        const sw = W / z, sh = H / z;
        const sx = clamp(fx - sw / 2, 0, W - sw), sy = clamp(fy - sh / 2, 0, H - sh);
        ctx.drawImage(buf, sx, sy, sw, sh, 0, 0, W, H);
      } else ctx.drawImage(buf, 0, 0);
      if (black > 0) { ctx.fillStyle = `rgba(6,4,10,${clamp(black, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
      if (white > 0) { ctx.fillStyle = `rgba(255,236,200,${clamp(white, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      // demo cursor
      if (E.cursorEl) {
        const el = E.cursorEl;
        if (s.demo) {
          const sc2 = canvas.clientWidth / W;
          el.style.display = 'block';
          el.style.transform = `translate(${s.demo.cx * sc2}px, ${s.demo.cy * sc2}px)`;
        } else if (el.style.display !== 'none') el.style.display = 'none';
      }
    }

    function drawRain(c, x0, y0, x1, y1, alpha) {
      c.save(); c.globalAlpha = alpha; c.fillStyle = '#9fb4ea';
      for (const d of s.drops) {
        if (d.x < x0 - 4 || d.x > x1 + 4 || d.y < y0 || d.y > y1 + 6) continue;
        for (let k = 0; k < 5; k++) c.fillRect(Math.round(d.x + k * 0.22), Math.round(d.y - k), 1, 1);
      }
      c.restore();
    }

    // ---------- exterior ----------
    function extLanterns() {
      const L = [{ w: [5.95, 3.62, 52], size: 1, text: '오뎅' }, { w: [8.05, 3.62, 52], size: 1, text: '오뎅' }];
      if (P.up.lantern1) L.push({ w: [4.55, 3.5, 95], size: 1 }, { w: [9.45, 3.5, 95], size: 1 });
      if (P.up.lantern2) for (let i = 0; i < 9; i++) L.push({ w: [4.1 + i * 0.725, 3.8, 53], size: 0 });
      L.forEach(l => { const q = IE(l.w[0], l.w[1], l.w[2]); l.x = q[0]; l.y = q[1]; });
      return L;
    }
    function drawExterior(c) {
      const t = s.t;
      c.drawImage(bgExt, 0, 0);
      A.proj(A.EX);
      // flickering windows in the skyline
      [[262, 40], [318, 26], [400, 50], [438, 70]].forEach(([x, y], i) => { if (Math.sin(t * 0.7 + i * 2.3) > -0.2) R(c, x, y, 3, 3, '#e8c060'); });
      // window glows
      const G = (w, r, col, a) => { const q = IE(...w); glow(c, q[0], q[1], r, col, a); };
      G([7, 3, 82], 50, '#ffb040', 0.36 + Math.sin(t * 2.1) * 0.03);
      G([5.1, 3, 28], 30, '#ffa040', 0.3);
      G([7, 3, 22], 56, '#ffa040', 0.42 + Math.sin(t * 3.3) * 0.03);
      G([1.8, 3, 18], 36, '#ffa040', 0.3); G([-1.5, 3, 21], 24, '#ffa040', 0.25); G([-1, 3, 59], 20, '#ffb050', 0.22);
      // izakaya neon — a panel sticking out of the facade
      const nOn = !(Math.sin(t * 13) > 0.96 || t % 6.3 < 0.12);
      A.fX(c, 3.0, 3.8, 42, 78, INK, 3.25); A.fX(c, 3.05, 3.75, 43, 77, '#1a1020', 3.25);
      { const q = IE(3.25, 3.4, 74); if (nOn) { glow(c, q[0], q[1] + 16, 32, '#ff3f8f', 0.55); A.vtext(c, '선술집', q[0], q[1], '#ffe0f0', 10, '#ff4fa0', 10); } else A.vtext(c, '선술집', q[0], q[1], '#5a2a40', 10, null, 10); }
      // snack bar neon on the right building
      const n2 = !(Math.sin(t * 9 + 2) > 0.97);
      { const q = IE(12.7, 3, 79); if (n2) { glow(c, q[0], q[1] + 4, 34, '#30c8ff', 0.5); ptext(c, '스낵바', q[0], q[1], '#e0fbff', 12, 'center', '#20a8ff'); } else ptext(c, '스낵바', q[0], q[1], '#20404a', 12, 'center'); }
      G([14.1, 3.55, 30], 28, '#6a9aff', 0.45);
      if (P.up.sign) G([10.45, 3.55, 16], 24, '#ffe070', 0.35);
      // street lamp cone
      const lp = IE(...A.XS.lampAt), lg = IE(A.XS.lampAt[0], A.XS.lampAt[1], 0);
      glow(c, lp[0], lp[1], 22, '#dfefff', 0.5);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.05; c.fillStyle = '#cfe4ff';
      for (let y = lp[1] + 2; y < lg[1] + 8; y++) { const k = (y - lp[1]) / (lg[1] - lp[1]); const hw = 3 + k * 30; c.fillRect(Math.round(lp[0] - hw), y, Math.round(hw * 2), 1); }
      c.restore();
      // noren over the door (sways)
      const [d0, d1] = A.XS.door, nw = (d1 - d0) / 4;
      for (let i = 0; i < 4; i++) {
        const g0 = d0 + i * nw, off = Math.round(Math.sin(t * 2 + i * 1.3));
        A.fF(c, g0, g0 + nw - 0.03, 30 - off, 47, '#141a40'); A.fF(c, g0 + 0.03, g0 + nw - 0.06, 31 - off, 47, '#22306a'); A.fF(c, g0 + 0.03, g0 + nw - 0.06, 44, 47, '#30418a');
      }
      { const q = IE((d0 + d1) / 2, 3, 43); ptext(c, '오뎅', q[0], q[1], '#f4ecd8', 12, 'center'); }
      // lanterns
      const LT = extLanterns();
      if (P.up.lantern2) { const a = IE(4.0, 3.78, 54), b = IE(10.0, 3.78, 54); A.line(c, a[0], a[1], b[0], b[1], INK); }
      LT.forEach((l, i) => lantern(c, l.x, l.y, t, i, l.size, l.text));
      // steam
      s.steam.forEach(p => { if (p.w !== 'ext') return; c.globalAlpha = (1 - p.t / p.life) * 0.33; disc(c, p.x, p.y, p.r, p.r * 0.8, '#efe6d6'); });
      c.globalAlpha = 1;
      // reflections on the wet street: a light at height h mirrors h px below its ground point
      const lights = [[[7, 3, 22], 26, '#ffb050', 0.5], [[5.1, 3, 28], 14, '#ffa040', 0.32], [[7, 3, 82], 18, '#ffb040', 0.25], [[1.8, 3, 18], 20, '#ffa040', 0.3],
        [[3.25, 3.4, 60], 8, '#ff4f9f', nOn ? 0.5 : 0], [[12.7, 3, 74], 20, '#30c8ff', n2 ? 0.35 : 0], [[14.1, 3.55, 30], 12, '#6a9aff', 0.45], [A.XS.lampAt, 10, '#d8ecff', 0.4]];
      LT.forEach(l => lights.push([l.w, l.size === 2 ? 10 : 5, '#ff5a30', l.size === 2 ? 0.55 : 0.3]));
      c.save(); c.globalCompositeOperation = 'lighter';
      lights.forEach(([w, ww0, col, a], i) => {
        if (a <= 0) return;
        const base = IE(w[0], w[1], 0), ry = base[1] + w[2] * A.EX.HS;
        c.fillStyle = col;
        for (let y = base[1] + 3; y < Math.min(H, ry + 26); y++) {
          if ((y + Math.floor(t * 10 + i * 3)) % 3 === 0) continue;
          const d = Math.abs(y - ry) / 30, fall = Math.max(0, 1 - d);
          if (fall <= 0) continue;
          c.globalAlpha = a * 0.33 * fall * (0.6 + 0.4 * Math.sin(t * 5 + y * 1.3 + i));
          const off = Math.round(Math.sin(t * 2.4 + y * 0.6 + i) * 1.5);
          const ww = Math.max(1, Math.round(ww0 * (0.5 + 0.5 * fall)));
          c.fillRect(Math.round(base[0] - ww / 2 + off), y, ww, 1);
        }
      });
      c.restore();
      s.ripples.forEach(p => { c.globalAlpha = 1 - p.t / 0.7; A.ellipseLine(c, p.x, p.y, 1 + p.t * 8, 0.5 + p.t * 1.6, '#6a78b0'); });
      c.globalAlpha = 1;
      // pedestrians + the pole, depth sorted
      const list = s.peds.map(p => ({ y: p.y, draw: () => {
        c.globalAlpha = p.toDoor && p.phase === 1 ? clamp((p.gy - 3.05) / 0.35, 0, 1) : 1;
        chibi(c, p.x, p.y, p.look, { dir: p.dir, pose: 'walk', f: p.f, umb: p.umb, umbHi: p.umbHi });
        c.globalAlpha = 1;
      } }));
      list.push({ y: IE(A.XS.pole[0], A.XS.pole[1])[1], draw: () => A.polePainter(c) });
      list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
      A.proj(A.EX);
      // hover indicator
      if (s.hoverShop && s.scene === 'exterior' && !s.trans) {
        const blink = Math.sin(t * 8) > 0 ? '#ffe080' : '#ffb040';
        const Q = [IE(d0 - 0.1, 3.02, 49), IE(d1 + 0.1, 3.02, 49), IE(d1 + 0.1, 3.02, 0), IE(d0 - 0.1, 3.02, 0)];
        Q.forEach((q, i) => A.isoLine(c, q, Q[(i + 1) % 4], blink));
        const q = DOOR_PT;
        R(c, q[0] - 42, q[1] - 6, 84, 16, 'rgba(24,12,8,0.88)'); R(c, q[0] - 41, q[1] - 5, 82, 1, '#ffd27a');
        ptext(c, '▶ 가게로 들어가기', q[0], q[1] - 3, '#ffe8b0', 12, 'center');
      }
      A.proj();
      // rain + splashes
      drawRain(c, 0, -10, W, H, 0.5);
      c.fillStyle = '#b8c8f0';
      s.splash.forEach(p => { const d = Math.round(p.t * 14); c.fillRect(Math.round(p.x - 1 - d), Math.round(p.y - 1 - d * 0.5), 1, 1); c.fillRect(Math.round(p.x + 1 + d), Math.round(p.y - 1 - d * 0.5), 1, 1); });
      c.fillStyle = 'rgba(120,130,190,0.05)'; c.fillRect(0, 150, W, 120);
      vignette(c, 0.55);
    }

    function vignette(c, a) {
      c.save();
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(4,2,10,${a})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    }

    // ---------- interior ----------
    function custPose(cu) {
      if (cu.st === 'walk' || cu.st === 'leave') return { pose: 'walk', mood: '' };
      if (cu.st === 'eat') return { pose: 'eat', mood: cu.sat > 0.7 && (cu.t % 2) > 1.4 ? 'happy' : '' };
      if (cu.st === 'done') return { pose: 'sit', mood: cu.sat > 0.4 ? 'happy' : '' };
      if (cu.st === 'angry') return { pose: 'sit', mood: 'angry' };
      if (cu.st === 'order' && cu.pat / cu.patMax < 0.25) return { pose: 'sit', mood: 'angry' };
      return { pose: 'sit', mood: '' };
    }
    function intLanterns() {
      const L = [[...IS(2.6, 0.3, IL.WH - 3), 1], [...IS(7.4, 0.3, IL.WH - 3), 1]];
      if (P.up.lantern1) L.push([...IS(0.3, 1.9, IL.WH - 3), 1], [...IS(0.3, 8.3, IL.WH - 3), 1]);
      return L;
    }
    function drawInterior(c) {
      const t = s.t;
      c.drawImage(bgIn, 0, 0);
      // window view (live rain) — clipped to the slanted window on the left wall
      const [w0, w1, wh0, wh1] = IL.WIN;
      const wp = [IS(0, w0, wh1), IS(0, w1, wh1), IS(0, w1, wh0), IS(0, w0, wh0)];
      const wx0 = Math.min(...wp.map(q => q[0])), wx1 = Math.max(...wp.map(q => q[0])), wy0 = Math.min(...wp.map(q => q[1])), wy1 = Math.max(...wp.map(q => q[1]));
      c.save(); c.beginPath(); wp.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.clip();
      R(c, wx0, wy0, wx1 - wx0, wy1 - wy0, '#0e1226');
      R(c, wx0, wy1 - 22, wx1 - wx0, 22, '#161a30'); R(c, wx0 + 6, wy1 - 34, 12, 34, '#1e2240'); R(c, wx0 + 30, wy1 - 40, 14, 40, '#1e2240');
      R(c, wx0 + 9, wy1 - 28, 2, 2, '#e8c060'); R(c, wx0 + 35, wy1 - 33, 2, 2, '#e8c060');
      glow(c, wx0 + 34, wy0 + 20, 14, '#ff3f8f', 0.3 + (Math.sin(t * 13) > 0.9 ? -0.2 : 0));
      drawRain(c, wx0, wy0, wx1, wy1, 0.55);
      c.restore();
      [1 / 3, 2 / 3].forEach(k => A.wL(c, w0 + (w1 - w0) * k - 0.04, w0 + (w1 - w0) * k + 0.04, wh0, wh1, '#4a2a16'));
      A.wL(c, w0, w1, (wh0 + wh1) / 2 - 1, (wh0 + wh1) / 2 + 1, '#4a2a16');
      // clock hands (game clock 18:00 + minutes)
      const ck = IS(0, 1.25, 46), mins = 18 * 60 + s.clock;
      const ha = ((mins / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (mins % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      A.line(c, ck[0], ck[1], ck[0] + Math.cos(ha) * 3, ck[1] + Math.sin(ha) * 3, INK); A.line(c, ck[0], ck[1], ck[0] + Math.cos(ma) * 5, ck[1] + Math.sin(ma) * 5, '#8a2a20');
      // guests behind the counter (counter seats, back aisle) — the counter is drawn over them
      const actors = [];
      s.customers.forEach(cu => actors.push({ y: cu.y, gy: worldGy(cu.x, cu.y), draw: () => { const pm = custPose(cu); chibi(c, cu.x, cu.y, cu.look, { dir: cu.dir, pose: pm.pose, f: cu.f, mood: pm.mood }); } }));
      if (s.staff) { const st = s.staff; actors.push({ y: st.y, gy: worldGy(st.x, st.y), draw: () => { chibi(c, st.x, st.y, STAFF, { dir: st.dir, pose: st.path ? 'walk' : 'stand', f: st.f, hold: !!st.dish }); if (st.dish) dish(c, st.x, st.y - 14, st.dish.items, st.dish.karashi); } }); }
      actors.filter(o => o.gy < CTR_GY).sort((a, b) => a.y - b.y).forEach(o => o.draw());
      // counter (+ pot body, counter stools)
      c.drawImage(bgCtr, 0, 0);
      // pot contents: slots laid out on the iso broth surface
      const [ia, ib, ic, id] = POT.in, hb = IL.CH + 4;
      A.flr(c, ia, ib, ic, id, hb, '#a86c28');
      const nSlots = E.slots(), cols = Math.ceil(nSlots / 2), cw = (ic - ia) / cols, rh = (id - ib) / 2;
      for (let i = 0; i < nSlots; i++) {
        const col = i % cols, row = (i / cols) | 0, g0 = ia + col * cw, r0 = ib + row * rh;
        A.flr(c, g0, r0, g0 + cw, r0 + rh, hb, row ? '#b67a2c' : '#c08634');
        const iid = P.menu[i];
        if (iid) {
          const n = Math.min(3, P.stock[iid] || 0), q = IS(g0 + cw / 2, r0 + rh / 2, hb);
          for (let k = 0; k < n; k++) { const x = q[0] - 5 + k * 3, y = q[1] - 2 + (k % 2) - 1; R(c, x, y, 3, 3, A.BLOB[iid]); R(c, x, y + 2, 3, 1, 'rgba(0,0,0,.3)'); }
        }
      }
      for (let k = 1; k < cols; k++) A.isoLine(c, IS(ia + k * cw, ib, hb), IS(ia + k * cw, id, hb), '#8a8e9a');
      A.isoLine(c, IS(ia, ib + rh, hb), IS(ic, ib + rh, hb), '#8a8e9a');
      for (let i = 0; i < 4; i++) { const q = IS(ia + ((i * 0.43 + t * 0.25) % (ic - ia)), ib + (i % 2 ? 0.1 : 0.4), hb); R(c, q[0], q[1], 1, 1, '#ffe0a0'); }
      if (s.hover === 'pot' && !s.trans) {
        const b = Math.sin(t * 8) > 0 ? '#ffe080' : '#ffb040', [a1, b1, c1, d1] = IL.POT, h1 = IL.CH + 6;
        const Q = [IS(a1 - 0.08, b1 - 0.08, h1), IS(c1 + 0.08, b1 - 0.08, h1), IS(c1 + 0.08, d1 + 0.08, h1), IS(a1 - 0.08, d1 + 0.08, h1)];
        Q.forEach((q, i) => A.isoLine(c, q, Q[(i + 1) % 4], b));
      }
      // counter bowls
      const eatLeft = cu => (cu.st === 'done' ? 0 : Math.max(1, Math.ceil(cu.bowl.items.length * (1 - cu.t / (s.demo ? 3 : 6.5)))));
      s.customers.forEach(cu => {
        if ((cu.st === 'eat' || cu.st === 'done') && cu.seat.type === 'c' && cu.bowl) {
          const bw = cu.seat.bowl; dish(c, bw.x, bw.y, cu.bowl.items.slice(0, eatLeft(cu)), cu.bowl.karashi);
          if (cu.bowl.sake) { R(c, bw.x + 9, bw.y - 7, 4, 7, INK); R(c, bw.x + 10, bw.y - 6, 2, 6, '#f2eee2'); }
        }
      });
      // the chef — that's you — working the pot with your back to the camera
      const serve = s.chef.serve > 0, cf = Math.floor(t * 3) % 2, ch = IS(CHEF_AT[0], CHEF_AT[1]);
      chibi(c, ch[0], ch[1], CHEF, { dir: 'up', pose: 'stand', f: 0, hold: serve });
      if (!serve) { const lx = ch[0] + 5 + cf, ly = ch[1] - 14 - cf; A.line(c, lx, ly, lx + 6, ly - 4, '#c8c8d0'); R(c, lx - 1, ly, 2, 2, '#eab88a'); disc(c, lx + 7, ly - 4, 2, 1, '#c8c8d0'); }
      else { R(c, ch[0] - 5, ch[1] - 13, 10, 3, INK); R(c, ch[0] - 4, ch[1] - 14, 8, 2, '#f0ece0'); }
      c.drawImage(bgFr, 0, 0);
      // depth-sorted floor things in the dining area (iso: screen y == gx + gy)
      const list = actors.filter(o => o.gy >= CTR_GY);
      E.tables.forEach(tb => list.push({ y: tb.y, draw: () => {
        A.table(c, tb.gx, tb.gy);
        s.customers.forEach(cu => { if ((cu.st === 'eat' || cu.st === 'done') && cu.seat.table === tb.id && cu.bowl) dish(c, cu.seat.bowl.x, cu.seat.bowl.y, cu.bowl.items.slice(0, eatLeft(cu)), cu.bowl.karashi); });
      } }));
      E.seats.forEach(se => { if (se.type !== 'c') list.push({ y: se.y - 0.5, draw: () => A.stool(c, se.gx, se.gy, '#8a5530', '#5a3420', '#b07040', 7) }); });
      list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
      // lanterns hung along the wall tops
      const IL2 = intLanterns();
      IL2.forEach(([x, y, sz], i) => lantern(c, x, y, t, i + 3, sz, null));
      if (P.up.lantern2) {
        const pts = [];
        for (let g = 8.5; g >= 0.5; g -= 1) pts.push(IS(0.2, g, IL.WH - 2));
        for (let g = 0.6; g <= 11.6; g += 1) pts.push(IS(g, 0.2, IL.WH - 2));
        for (let i = 1; i < pts.length; i++) A.line(c, pts[i - 1][0], pts[i - 1][1] + 2, pts[i][0], pts[i][1] + 2, INK);
        pts.forEach((q, i) => lantern(c, q[0], q[1], t, i, 0, null));
      }
      // steam
      s.steam.forEach(p => { if (p.w !== 'in') return; c.globalAlpha = (1 - p.t / p.life) * 0.3; disc(c, p.x, p.y, p.r, p.r * 0.8, '#fff6e6'); });
      c.globalAlpha = 1;
      // speech bubbles — laid out so neighbours on the diagonal counter never overlap
      const placed = [];
      s.customers.filter(cu => cu.st === 'think' || cu.st === 'order').sort((a, b) => b.y - a.y || a.x - b.x).forEach(cu => {
        const hx = Math.round(cu.x), head = Math.round(cu.y) - 26;
        let w, h;
        if (cu.st === 'think') { w = 17; h = 9; }
        else { const n = Object.keys(cu.order.items).length + (cu.order.sake ? 1 : 0) + (cu.order.karashi ? 1 : 0); w = n * 13 + 3; h = 16; }
        const x0 = hx - w / 2 - 1, x1 = hx + w / 2 + 6;
        let yb = head, moved = true, guard = 0;
        while (moved && guard++ < 12) {
          moved = false;
          for (const p of placed) {
            const ry0 = yb - h - 8, ry1 = yb + 3;
            if (x0 < p.x1 && x1 > p.x0 && ry0 < p.y1 && ry1 > p.y0) { yb = p.y0 - 4; moved = true; }
          }
        }
        cu.bub = cu.bub == null || Math.abs(cu.bub - yb) > 40 ? yb : cu.bub + (yb - cu.bub) * 0.25;
        const yy = Math.round(cu.bub);
        placed.push({ x0, x1, y0: yb - h - 8, y1: yb + 3 });
        cu.layout = { hx, yy, w, h, head };
      });
      s.customers.forEach(cu => {
        cu.hit = null;
        if (cu.st !== 'think' && cu.st !== 'order') { cu.bub = null; return; }
        const { hx, yy, w, head } = cu.layout;
        if (head - yy > 6) for (let y = yy + 4; y < head - 1; y += 3) R(c, hx, y, 1, 2, '#fff8ea');
        if (cu.st === 'think') {
          const { bx, by } = bubble(c, hx, yy, 17, 9);
          for (let i = 0; i < 3; i++) if ((t * 3) % 4 > i) R(c, bx + 4 + i * 4, by + 4, 2, 2, '#5a4a40');
          return;
        }
        const ents = Object.entries(cu.order.items), hov = s.hover === cu.id;
        const low = cu.pat / cu.patMax < 0.3, lift = low ? Math.round(Math.abs(Math.sin(t * 10)) * 2) : 0;
        const { bx, by } = bubble(c, hx, yy - lift, w, 16, hov ? '#fff2c0' : '#fff8ea', hov ? '#c83a1a' : INK);
        let ix = bx + 2;
        ents.forEach(([iid, q]) => { spr(c, iid, ix, by + 2, 1); if (q > 1) num(c, String(q), ix + 11, by + 9, '#ffffff', 'center', '#c83a1a'); ix += 13; });
        if (cu.order.karashi) { spr(c, 'karashi', ix, by + 2, 1); ix += 13; }
        if (cu.order.sake) { spr(c, 'sake', ix, by + 2, 1); ix += 13; }
        const pr = clamp(cu.pat / cu.patMax, 0, 1);
        R(c, bx, by - 4, w, 3, INK); R(c, bx + 1, by - 3, Math.max(0, Math.round((w - 2) * pr)), 1, pr > 0.5 ? '#6ad06a' : pr > 0.25 ? '#f0c040' : '#f04a3a');
        if (hov || Math.sin(t * 6) > 0.3) num(c, '!', bx + w + 2, by + 1, '#ffd24a', 'left', INK, 1);
        cu.hit = [Math.min(bx - 2, hx - 8), by - 6, Math.max(w + 4, 16), Math.round(cu.y) - by + 6];
      });
      drawFx(c);
      // warm light & vignette
      IL2.forEach(([x, y]) => glow(c, x, y + 20, 64, '#ff9040', 0.12));
      glow(c, POT.cx, POT.cy, 80, '#ffb050', 0.1);
      vignette(c, 0.4);
    }

    function drawFx(c) {
      s.fx.forEach(f => {
        if (f.delay > 0 || f.t < 0) return;
        const k = f.life ? f.t / f.life : f.t / f.dur;
        const a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        if (f.k === 'num') { c.globalAlpha = a; num(c, f.str, f.x, f.y - k * 16, f.col, 'center', INK, f.s || 1); }
        else if (f.k === 'jp') { c.globalAlpha = a; ptext(c, f.str, f.x, f.y - Math.min(1, k * 3) * 6 - k * 8, f.col, f.size || 10, 'center', INK); }
        else if (f.k === 'stars') { c.globalAlpha = a; const pop = Math.min(1, k * 5); const n = Math.ceil(f.n * pop); let str = ''; for (let i = 0; i < 5; i++) str += i < n ? '★' : ''; num(c, str, f.x, f.y - k * 12, '#ffd24a', 'center', INK); }
        else if (f.k === 'emote') {
          c.globalAlpha = a; const y = f.y - k * 10;
          if (f.e === 'heart') num(c, '♥', f.x, y, '#ff6a8a', 'center', INK, 2);
          else if (f.e === 'note') ptext(c, '♪', f.x, y - 4, '#ffe080', 12, 'center', INK);
          else if (f.e === 'sweat') ptext(c, '…', f.x, y - 4, '#a0c8f0', 12, 'center', INK);
          else { R(c, f.x - 4, y - 4, 9, 9, INK); R(c, f.x - 3, y - 3, 7, 7, '#e83a2a'); R(c, f.x - 1, y - 3, 1, 7, '#ffd0c0'); R(c, f.x - 3, y - 1, 7, 1, '#ffd0c0'); }
        } else if (f.k === 'coin') {
          const kk = ease(clamp(f.t / f.dur, 0, 1));
          const tx = 70, ty = 4;
          const x = f.x0 + (tx - f.x0) * kk, y = f.y0 + (ty - f.y0) * kk - Math.sin(kk * Math.PI) * 30;
          c.globalAlpha = 1; spr(c, 'coin', x - 6, y - 6, 1);
        } else if (f.k === 'dish') {
          const kk = clamp(f.t / f.dur, 0, 1);
          const x = f.x0 + (f.x1 - f.x0) * kk, y = f.y0 + (f.y1 - f.y0) * kk - Math.sin(kk * Math.PI) * 26;
          c.globalAlpha = 1; dish(c, x, y, f.items, f.karashi);
          s.steam.length < 200 && Math.random() < 0.4 && s.steam.push({ x, y: y - 4, vx: 0, vy: -10, r: 1.5, t: 0, life: 0.6, w: 'in' });
        } else if (f.k === 'spark') {
          c.globalAlpha = a; const r = k * 18;
          for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + f.t; R(c, f.x + Math.cos(an) * r, f.y + Math.sin(an) * r * 0.7, 2, 2, i % 2 ? '#ffe070' : '#ffffff'); }
        }
      });
      c.globalAlpha = 1;
    }

    // ---------- pot view ----------
    E.potLayout = function () {
      const n = E.slots(), cols = n === 12 ? 4 : 3, rows = n / cols;
      const px = 128, py = 40, pw = 228, ph = 208, cw = pw / cols, chh = ph / rows;
      const cells = [];
      for (let i = 0; i < n; i++) cells.push({ i, id: P.menu[i] || null, x: px + (i % cols) * cw, y: py + ((i / cols) | 0) * chh, w: cw, h: chh });
      return { pot: { x: px, y: py, w: pw, h: ph }, cells, plate: { x: 424, y: 90, rx: 44, ry: 26 }, karashi: { x: 384, y: 136 }, sake: { x: 440, y: 136 } };
    };
    const PLATE_SLOTS = [[-26, -8], [0, -10], [26, -8], [-22, 8], [0, 8], [22, 8]];
    E.plateSlot = i => { const L = E.potLayout(); return [L.plate.x + PLATE_SLOTS[i][0], L.plate.y + PLATE_SLOTS[i][1]]; };
    function drawPot(c) {
      const t = s.t, Lp = E.potLayout(), o = s.order;
      // counter surface
      for (let y = 0; y < H; y += 14) { R(c, 0, y, W, 14, ((y / 14) | 0) % 2 ? '#7a4626' : '#844c2a'); R(c, 0, y, W, 1, '#5a321a'); }
      R(c, 0, 0, W, 22, '#2a1a14');
      const { x: px, y: py, w: pw, h: ph } = Lp.pot;
      R(c, px - 4, py + 8, pw + 16, ph + 8, 'rgba(0,0,0,0.35)');
      R(c, px - 8, py - 8, pw + 16, ph + 16, INK);
      R(c, px - 7, py - 7, pw + 14, ph + 14, '#b8642e'); R(c, px - 7, py - 7, pw + 14, 2, '#f0a060'); R(c, px - 7, py + ph + 5, pw + 14, 2, '#6e3418');
      R(c, px - 2, py - 2, pw + 4, ph + 4, '#5a2a12');
      R(c, px, py, pw, ph, '#b0742a');
      for (let i = 0; i < 26; i++) {
        const yy = py + ((i * 37 + t * 8) % ph), xx = px + ((i * 53) % pw);
        R(c, xx, yy, 6 + (i % 4) * 3, 1, i % 3 ? '#c8903a' : '#d8a44a');
      }
      // cells
      Lp.cells.forEach(cell => {
        const cx = cell.x + cell.w / 2, cy = cell.y + cell.h / 2 - 6;
        if (!cell.id) { R(c, cell.x + 2, cell.y + 2, cell.w - 4, cell.h - 4, 'rgba(60,24,8,0.35)'); return; }
        const n = P.stock[cell.id] || 0, sim = s.simmer[cell.id];
        const offs = [[0, 0], [-10, 7], [10, 7]];
        const copies = Math.min(3, n);
        for (let k = copies - 1; k >= 0; k--) {
          const bob = Math.round(Math.sin(t * 2.2 + cell.i + k) * 1);
          spr(c, cell.id, cx - 12 + offs[k][0], cy - 12 + offs[k][1] + bob, 2);
        }
        if (sim) {
          const pr = 1 - sim.t / sim.T;
          if (!copies) spr(c, cell.id, cx - 12, cy - 12 + Math.round(Math.sin(t * 6) * 1), 2, 0.45);
          for (let k = 0; k < 4; k++) { const bx = cx - 14 + ((k * 9 + t * 20) % 28); disc(c, bx, cy + 14 - ((t * 10 + k * 5) % 10), 1, 1, '#ffe8b0'); }
          R(c, cx - 16, cell.y + cell.h - 22, 32, 4, INK); R(c, cx - 15, cell.y + cell.h - 21, Math.round(30 * pr), 2, '#ffd24a');
        }
        if (s.hover === 'cell' + cell.i && !s.trans) {
          const col = Math.sin(t * 10) > 0 ? '#ffe080' : '#ffffff';
          c.fillStyle = col; c.fillRect(cell.x + 3, cell.y + 3, cell.w - 6, 1); c.fillRect(cell.x + 3, cell.y + cell.h - 4, cell.w - 6, 1); c.fillRect(cell.x + 3, cell.y + 3, 1, cell.h - 6); c.fillRect(cell.x + cell.w - 4, cell.y + 3, 1, cell.h - 6);
        }
      });
      // dividers
      const cols = Lp.cells.length === 12 ? 4 : 3, rows = Lp.cells.length / cols;
      for (let i = 1; i < cols; i++) { const x = Math.round(px + i * pw / cols); R(c, x - 1, py, 3, ph, '#6a6e7a'); R(c, x - 1, py, 1, ph, '#c8ccd6'); }
      for (let j = 1; j < rows; j++) { const y = Math.round(py + j * ph / rows); R(c, px, y - 1, pw, 3, '#6a6e7a'); R(c, px, y - 1, pw, 1, '#c8ccd6'); }
      // plate
      const pl = Lp.plate;
      disc(c, pl.x + 2, pl.y + 5, pl.rx + 2, pl.ry + 2, 'rgba(0,0,0,0.35)');
      disc(c, pl.x, pl.y, pl.rx + 1, pl.ry + 1, INK); disc(c, pl.x, pl.y, pl.rx, pl.ry, '#2c3c78');
      disc(c, pl.x, pl.y - 1, pl.rx - 4, pl.ry - 4, '#f0ead8'); disc(c, pl.x, pl.y, pl.rx - 10, pl.ry - 9, '#d8a050');
      for (let k = 0; k < 10; k++) R(c, pl.x - pl.rx + 6 + k * 8, pl.y - pl.ry + 2 + (k % 2), 3, 1, '#5a70c0');
      if (o) {
        const flying = new Set(s.fx.filter(f => f.k === 'fly').map(f => f.slot));
        o.bowl.forEach((id, i) => {
          if (flying.has(i) || i > 5) return;
          const [sx, sy] = E.plateSlot(i);
          spr(c, id, sx - 12, sy - 12, 2);
          if (s.hover === 'plate' + i) { R(c, sx - 3, sy - 15, 7, 7, INK); R(c, sx - 2, sy - 14, 5, 5, '#e83a2a'); R(c, sx - 1, sy - 12, 3, 1, '#ffffff'); }
        });
        if (o.karashi) { disc(c, pl.x + 30, pl.y + 12, 5, 3, '#c89010'); disc(c, pl.x + 30, pl.y + 11, 4, 2, '#f0c020'); R(c, pl.x + 29, pl.y + 10, 2, 1, '#fff080'); }
      }
      // karashi & sake pickups
      const kHover = s.hover === 'karashi', sHover = s.hover === 'sake';
      R(c, Lp.karashi.x - 2, Lp.karashi.y - 2, 28, 28, kHover ? '#ffe080' : 'rgba(0,0,0,0.25)');
      spr(c, 'karashi', Lp.karashi.x, Lp.karashi.y, 2);
      if (o && o.karashi) num(c, '!', Lp.karashi.x + 24, Lp.karashi.y, '#6ad06a', 'left');
      if (P.up.sake) {
        R(c, Lp.sake.x - 2, Lp.sake.y - 2, 28, 28, sHover ? '#ffe080' : o && o.sake ? '#6ad06a' : 'rgba(0,0,0,0.25)');
        spr(c, 'sake', Lp.sake.x, Lp.sake.y, 2);
      }
      // flying items
      s.fx.forEach(f => {
        if (f.k !== 'fly') return;
        const k = ease(clamp(f.t / f.dur, 0, 1));
        const x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * 22;
        spr(c, f.id, x - 12, y - 12, 2);
      });
      // steam
      s.steam.forEach(p => { if (p.w !== 'pot') return; c.globalAlpha = (1 - p.t / p.life) * 0.22; disc(c, p.x, p.y, p.r, p.r * 0.8, '#fff6e6'); });
      c.globalAlpha = 1;
      glow(c, 242, 140, 120, '#ffb050', 0.08);
      vignette(c, 0.5);
    }

    // =====================================================
    // INPUT
    // =====================================================
    function hitShop(x, y) { return inPoly(x, y, SHOP_POLY); }
    function hitPot(x, y) { return x >= POT.x0 && x <= POT.x1 && y >= POT.y0 && y <= POT.y1; }
    function custAt(x, y) {
      for (let i = s.customers.length - 1; i >= 0; i--) {
        const c = s.customers[i];
        if (c.st !== 'order') continue;
        if (c.hit && x >= c.hit[0] && x <= c.hit[0] + c.hit[2] && y >= c.hit[1] && y <= c.hit[1] + c.hit[3]) return c;
        if (Math.abs(x - c.x) <= 8 && y <= c.y && y >= c.y - 26) return c;
      }
      return null;
    }
    function potHit(x, y) {
      const L = E.potLayout();
      if (s.order) for (let i = 0; i < Math.min(6, s.order.bowl.length); i++) { const [sx, sy] = E.plateSlot(i); if (Math.abs(x - sx) <= 12 && Math.abs(y - sy) <= 12) return 'plate' + i; }
      for (const cell of L.cells) if (cell.id && x >= cell.x && x < cell.x + cell.w && y >= cell.y && y < cell.y + cell.h) return 'cell' + cell.i;
      if (x >= L.karashi.x - 2 && x <= L.karashi.x + 26 && y >= L.karashi.y - 2 && y <= L.karashi.y + 26) return 'karashi';
      if (P.up.sake && x >= L.sake.x - 2 && x <= L.sake.x + 26 && y >= L.sake.y - 2 && y <= L.sake.y + 26) return 'sake';
      return null;
    }
    E.pointer = function (x, y) {
      if (s.demo) return;
      s.hoverShop = false; s.hover = null;
      if (s.trans || x < 0) { setCursor(false); return; }
      if (s.scene === 'exterior') s.hoverShop = hitShop(x, y);
      else if (s.scene === 'interior') { const c = custAt(x, y); if (c) s.hover = c.id; else if (hitPot(x, y)) s.hover = 'pot'; }
      else if (s.scene === 'pot') s.hover = potHit(x, y);
      setCursor(!!(s.hoverShop || s.hover));
    };
    function setCursor(on) { if (canvas) canvas.style.cursor = on ? 'pointer' : 'default'; }
    E.click = function (x, y) {
      if (s.demo || s.trans) return;
      if (s.scene === 'exterior') { if (hitShop(x, y)) E.enterShop(); }
      else if (s.scene === 'interior') {
        const c = custAt(x, y);
        if (c) E.openOrder(c);
        else if (hitPot(x, y)) E.openOrder(null);
      } else if (s.scene === 'pot') {
        const h = potHit(x, y);
        if (!h) return;
        if (h.startsWith('plate')) E.unpick(+h.slice(5));
        else if (h.startsWith('cell')) { const cell = E.potLayout().cells[+h.slice(4)]; if (cell && cell.id) E.pick(cell.id); }
        else if (h === 'karashi') E.toggleKarashi();
        else if (h === 'sake') E.toggleSake();
      }
      E.pointer(x, y);
    };

    // =====================================================
    // ACTIONS
    // =====================================================
    E.enterShop = function () {
      if (s.trans || s.scene !== 'exterior') return;
      sfx('door');
      s.trans = { kind: 'enter', t: 0, dur: 1.1, mid: 0.5, onMid: () => { s.scene = 'interior'; E.emit('scene'); } };
    };
    E.exitShop = function () {
      if (s.trans) return;
      if (s.scene === 'pot') closeOrder(true);
      sfx('door');
      s.trans = { kind: 'exit', t: 0, dur: 1.0, mid: 0.5, onMid: () => { s.scene = 'exterior'; E.emit('scene'); } };
    };
    E.openOrder = function (c) {
      if (s.trans || s.scene !== 'interior') return;
      if (c && c.st !== 'order') return;
      if (c && c.claimed) { toast('알바생이 서빙하는 중이에요'); return; }
      s.order = { cid: c ? c.id : null, bowl: [], karashi: false, sake: false };
      sfx('zoom');
      s.trans = { kind: 'potIn', t: 0, dur: 0.6, mid: 0.55, onMid: () => { s.scene = 'pot'; E.emit('scene'); } };
    };
    function closeOrder(returnItems) {
      if (!s.order) return;
      if (returnItems) s.order.bowl.forEach(id => (P.stock[id] = (P.stock[id] || 0) + 1));
      s.order = null;
      s.fx = s.fx.filter(f => f.k !== 'fly');
      if (s.scene === 'pot') s.trans = { kind: 'potOut', t: 0, dur: 0.4, mid: 0, onMid: () => { s.scene = 'interior'; E.emit('scene'); } };
    }
    E.closeOrder = () => { if (!s.trans) closeOrder(true); };
    E.pick = function (id) {
      const o = s.order; if (!o) return;
      if (!o.cid) { toast('주문을 받은 다음에 담아요 (재료 준비는 아래 버튼)'); return; }
      if (!((P.stock[id] || 0) > 0)) { toast(s.simmer[id] ? '끓이는 중이에요. 조금만 기다려요' : `${ING[id].name} 품절! 재료를 준비하세요`, 'bad'); sfx('bad'); return; }
      if (o.bowl.length >= 6) { toast('접시가 가득 찼어요'); return; }
      P.stock[id]--; o.bowl.push(id);
      const cell = E.potLayout().cells.find(cc => cc.id === id);
      const [x1, y1] = E.plateSlot(o.bowl.length - 1);
      s.fx.push({ k: 'fly', id, x0: cell.x + cell.w / 2, y0: cell.y + cell.h / 2 - 6, x1, y1, t: 0, dur: 0.24, slot: o.bowl.length - 1 });
      sfx('pick');
    };
    E.unpick = function (i) {
      const o = s.order; if (!o || i >= o.bowl.length) return;
      const id = o.bowl.splice(i, 1)[0]; P.stock[id] = (P.stock[id] || 0) + 1; sfx('back');
    };
    E.clearBowl = function () { const o = s.order; if (!o) return; o.bowl.forEach(id => (P.stock[id] = (P.stock[id] || 0) + 1)); o.bowl = []; o.karashi = false; o.sake = false; sfx('back'); };
    E.toggleKarashi = function () { const o = s.order; if (!o || !o.cid) return; o.karashi = !o.karashi; sfx('pick'); };
    E.toggleSake = function () { const o = s.order; if (!o || !o.cid || !P.up.sake) return; o.sake = !o.sake; sfx('pick'); };
    E.serve = function () {
      const o = s.order; if (!o || s.trans) return;
      const c = getC(o.cid);
      if (!c || c.st !== 'order') { toast('주문한 손님이 없어요'); return; }
      if (!o.bowl.length) { toast('재료를 담은 다음에 내놓아요', 'bad'); sfx('bad'); return; }
      const res = score(c, o.bowl, o.karashi, o.sake);
      const items = o.bowl.slice(), karashi = o.karashi, sake = o.sake;
      o.bowl = [];
      c.st = 'wait';
      closeOrder(false);
      s.fx.push({ k: 'dish', delay: 0.4, t: 0, dur: 0.5, x0: POT.cx, y0: POT.cy - 4, x1: c.seat.bowl.x, y1: c.seat.bowl.y, items, karashi, sake, cid: c.id, res });
      s.chef.serve = 1.0; sfx('serve');
    };
    E.restockPlan = function (id) {
      const ids = id ? [id] : P.menu; let cost = 0; const plan = [];
      ids.forEach(i => { const n = E.stockMax() - (P.stock[i] || 0) - (s.simmer[i] ? s.simmer[i].n : 0); if (n > 0) { cost += n * ING[i].cost; plan.push([i, n]); } });
      return { cost, plan };
    };
    E.restock = function (id) {
      const { cost, plan } = E.restockPlan(id);
      if (!plan.length) { toast('냄비가 이미 가득해요'); return; }
      if (P.money < cost) { toast('돈이 부족해요', 'bad'); sfx('bad'); return; }
      P.money -= cost;
      plan.forEach(([i, n]) => { const sm = s.simmer[i]; s.simmer[i] = { n: (sm ? sm.n : 0) + n, t: E.simmerT(), T: E.simmerT() }; });
      toast(`재료 준비 시작 −¥${cost.toLocaleString()}`); sfx('pour');
    };
    E.upgradeState = function (u) {
      if (P.up[u.id]) return 'owned';
      if (P.rank < u.rank) return 'rank';
      if (u.req && !P.up[u.req]) return 'req';
      if (P.money < u.price) return 'money';
      return 'ok';
    };
    E.buyUpgrade = function (id) {
      const u = UPGM[id]; const st = E.upgradeState(u);
      if (st === 'owned') return;
      if (st === 'rank') { toast(`「${RANKS[u.rank].name}」 등급이 되면 해금돼요`); return; }
      if (st === 'req') { toast(`먼저 「${UPGM[u.req].name}」 설치가 필요해요`); return; }
      if (st === 'money') { toast('돈이 부족해요', 'bad'); sfx('bad'); return; }
      P.money -= u.price; P.up[id] = true; buildSeats();
      if (id.startsWith('lantern') || id === 'sign') P.pop = clamp(P.pop + 6, 0, 100);
      toast(`${u.name} 설치 완료!`, 'good'); sfx('buy');
      for (let i = 0; i < 3; i++) s.fx.push({ k: 'spark', x: 240 + rnd(-80, 80), y: 120 + rnd(-30, 40), t: -i * 0.15, life: 0.8 });
      save(); E.emit('changed');
    };
    E.menuState = function (ing) {
      if (P.menu.includes(ing.id)) return 'owned';
      if (P.rank < ing.rank) return 'rank';
      if (P.menu.length >= E.slots()) return 'slots';
      if (P.money < ing.dev) return 'money';
      return 'ok';
    };
    E.devMenu = function (id) {
      const ing = ING[id]; const st = E.menuState(ing);
      if (st === 'owned') return;
      if (st === 'rank') { toast(`「${RANKS[ing.rank].name}」 등급이 되면 해금돼요`); return; }
      if (st === 'slots') { toast('냄비 칸이 부족해요. 더 큰 냄비를 설치하세요', 'bad'); return; }
      if (st === 'money') { toast('돈이 부족해요', 'bad'); sfx('bad'); return; }
      P.money -= ing.dev; P.menu.push(id); P.stock[id] = 0;
      s.simmer[id] = { n: E.stockMax(), t: E.simmerT(), T: E.simmerT() };
      toast(`새 메뉴 「${ing.name}」${josa(ing.name, '이', '가')} 냄비에 들어갔어요!`, 'good'); sfx('buy'); save(); E.emit('changed');
    };
    E.nextNight = function () {
      P.day++; s.clock = 0; s.day = freshDay(); s.closed = false; s.spawnT = 2; s.lastOrderToast = false; save();
      toast(`${P.day}일째 밤 개점!`);
    };

    // =====================================================
    // DEMO (≈30s scripted autoplay)
    // =====================================================
    const DEMO_LEN = 30;
    function* waitT(T) { let t = 0; while (t < T) t += yield; }
    function* waitUntil(fn, T) { let t = 0; while (t < T && !fn()) t += yield; }
    function* moveTo(x, y, dur) {
      const d = s.demo, x0 = d.cx, y0 = d.cy; let t = 0;
      while (t < dur) { t += yield; const k = ease(Math.min(1, t / dur)); d.cx = x0 + (x - x0) * k; d.cy = y0 + (y - y0) * k; }
    }
    function tap() {
      if (E.cursorEl) { E.cursorEl.classList.remove('tap'); void E.cursorEl.offsetWidth; E.cursorEl.classList.add('tap'); }
      sfx('click');
    }
    function domTarget(name) {
      const el = document.querySelector(`[data-demo="${name}"]`);
      if (!el || !canvas) return null;
      const r = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      return [((r.left + r.width / 2 - cr.left) / cr.width) * W, ((r.top + r.height / 2 - cr.top) / cr.height) * H];
    }
    const cap = txt => { s.demo.cap = txt; };
    const orderingC = () => s.customers.find(c => c.st === 'order');
    function* demoScript() {
      cap('비 내리는 골목에 불 밝힌 오뎅집 「모락등」');
      yield* moveTo(DOOR_PT[0] + 6, DOOR_PT[1] + 6, 1.6);
      yield* waitT(0.3);
      tap(); E.enterShop();
      cap('가게를 클릭하면 안으로 들어가요');
      yield* waitT(1.3);
      cap('손님 입장! 자리에 앉아 메뉴를 고르는 중…');
      for (let k = 0; k < 3; k++) {
        yield* waitUntil(() => orderingC(), 6);
        const c = orderingC(); if (!c) break;
        cap(k === 0 ? '말풍선을 클릭해서 주문 받기' : k === 1 ? '다음 주문도 재빠르게!' : '겨자 듬뿍 요청도 문제없어요');
        const hc = c.hit ? [c.hit[0] + c.hit[2] / 2, c.hit[1] + 10] : [c.x + 2, c.y - 34];
        yield* moveTo(hc[0], hc[1], 0.55);
        tap(); E.openOrder(c);
        yield* waitT(0.75);
        cap('오뎅 냄비로 줌! 주문대로 재료를 담아요');
        for (const [id, q] of Object.entries(c.order.items)) {
          for (let i = 0; i < q; i++) {
            const cell = E.potLayout().cells.find(x => x.id === id); if (!cell) continue;
            if ((P.stock[id] || 0) < 1) P.stock[id] = 3;
            yield* moveTo(cell.x + cell.w / 2, cell.y + cell.h / 2 - 4, 0.3);
            tap(); E.pick(id);
            yield* waitT(0.1);
          }
        }
        if (c.order.karashi) { const L = E.potLayout(); yield* moveTo(L.karashi.x + 12, L.karashi.y + 12, 0.3); tap(); E.toggleKarashi(); yield* waitT(0.1); }
        if (c.order.sake && P.up.sake) { const L = E.potLayout(); yield* moveTo(L.sake.x + 12, L.sake.y + 12, 0.3); tap(); E.toggleSake(); }
        const b = domTarget('serve') || [424, 214];
        yield* moveTo(b[0], b[1], 0.35);
        tap(); E.serve();
        cap(k === 0 ? '서빙! 매출과 만족도가 쑥쑥 올라가요' : k === 1 ? '매출·인기·평판이 쌓이면 가게 등급 상승' : '손님들이 맛있게 먹어요');
        yield* waitT(k === 2 ? 1.2 : 1.6);
      }
      cap('번 돈으로 설비와 새 메뉴를 해금해요');
      E.emit('shop', 'up');
      yield* waitT(0.8);
      const bt = domTarget('buy-lantern1');
      if (bt) { yield* moveTo(bt[0], bt[1], 0.6); tap(); E.buyUpgrade('lantern1'); }
      yield* waitT(1.1);
      E.emit('shop', null);
      cap('등불이 늘어나 가게가 북적북적');
      yield* waitT(0.6);
      E.exitShop();
      yield* moveTo(330, 60, 1.6);
      yield* waitT(1.4);
      cap('자, 나만의 오뎅집을 키워 보세요');
      yield* waitT(20);
    }
    function updDemo(dt) {
      const d = s.demo; d.t += dt;
      if (d.t >= DEMO_LEN) { E.stopDemo(); return; }
      try { const r = d.gen.next(dt); if (r.done) d.gen = (function* () { while (true) yield; })(); } catch (e) { console.error(e); E.stopDemo(); }
    }
    E.startDemo = function () {
      if (s.demo) return;
      const snap = { P: JSON.parse(JSON.stringify(P)), scene: s.scene === 'pot' ? 'interior' : s.scene, clock: s.clock, day: s.day, simmer: s.simmer };
      if (s.scene !== 'title') save();
      resetTransient();
      P = Object.assign(fresh(), { money: 1400, total: 2650, pop: 45, rep: 3.6, menu: ['daikon', 'tamago', 'konnyaku', 'chikuwa'], stock: { daikon: 8, tamago: 8, konnyaku: 8, chikuwa: 8 } });
      s.scene = 'exterior'; s.clock = 90; buildSeats();
      s.demo = { t: 0, cx: 300, cy: 40, cap: '', snap, gen: null };
      s.demo.gen = demoScript();
      const c1 = spawn({ prefer: ['c0'] }), c2 = spawn({ prefer: ['c1'] }), c3 = spawn({ prefer: ['c2'] });
      [c1, c2, c3].forEach((c, i) => { if (!c) return; const q = c.path, k = 0.1 + i * 0.3; c.x = q[1][0] + (q[2][0] - q[1][0]) * k; c.y = q[1][1] + (q[2][1] - q[1][1]) * k; c.pi = 2; if (i === 2) c.order.karashi = true; if (i === 0) c.order = { items: { daikon: 1, tamago: 1, chikuwa: 1 }, karashi: false, sake: false }; });
      s.spawnT = 99;
      E.emit('demo', true);
    };
    E.stopDemo = function () {
      const d = s.demo; if (!d) return;
      s.demo = null; resetTransient();
      P = d.snap.P; s.scene = d.snap.scene; s.clock = d.snap.clock; s.day = d.snap.day; s.simmer = d.snap.simmer || {};
      buildSeats();
      E.emit('shop', null); E.emit('demo', false);
    };

    return E;
  }

  window.ENGINE = { createEngine, ING, ING_LIST, RANKS, UPG };
})();
