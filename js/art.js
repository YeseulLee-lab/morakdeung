'use strict';
/* =========================================================
   ART — pixel primitives, sprites, chibi characters, static scene painters
   All drawing happens on a 480x270 logical canvas.
   ========================================================= */
(function () {
  const W = 480, H = 270, INK = '#1a1012';
  const A = { W, H, INK, fontReady: false };

  // ---------- primitives ----------
  function R(c, x, y, w, h, col) {
    if (col) c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function disc(c, cx, cy, rx, ry, col) {
    c.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy);
    rx = Math.max(0, Math.round(rx)); ry = Math.max(0, Math.round(ry));
    if (ry === 0) { c.fillRect(cx - rx, cy, rx * 2 + 1, 1); return; }
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function ellipseLine(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    const n = Math.max(12, Math.round((rx + ry) * 1.6));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      c.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
    }
  }
  function line(c, x0, y0, x1, y1, col) {
    c.fillStyle = col; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 2000; i++) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function glow(c, cx, cy, r, col, a) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, a) * 0.22;
    for (let i = 0; i < 4; i++) { const k = 1 - i * 0.23; disc(c, cx, cy, r * k, r * k * 0.82, col); }
    c.restore();
  }
  function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function srand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  // ---------- crisp pixel text (Galmuri bitmap fonts at native sizes, alpha-thresholded) ----------
  const TXT = new Map();
  function txt(str, size, col, ol) {
    const key = str + '|' + size + '|' + col + '|' + ol + '|' + A.fontReady;
    let cv = TXT.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); const x = cv.getContext('2d');
    const font = (size <= 8 ? '8px "Galmuri7"' : size <= 11 ? '10px "Galmuri9"' : '12px "Galmuri11"') + ', "Apple SD Gothic Neo", "Malgun Gothic", monospace';
    x.font = font; const w = Math.ceil(x.measureText(str).width) + 4, h = size + 6;
    cv.width = w; cv.height = h; x.font = font; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(str, 2, 2);
    const src = x.getImageData(0, 0, w, h).data; const img = x.createImageData(w, h); const d = img.data;
    const m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = src[i * 4 + 3] > 110 ? 1 : 0;
    const fc = hexRGB(col), oc = ol ? hexRGB(ol) : null;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx; let cc = null;
      if (m[i]) cc = fc;
      else if (oc && ((xx > 0 && m[i - 1]) || (xx < w - 1 && m[i + 1]) || (yy > 0 && m[i - w]) || (yy < h - 1 && m[i + w]))) cc = oc;
      if (cc) { d[i * 4] = cc[0]; d[i * 4 + 1] = cc[1]; d[i * 4 + 2] = cc[2]; d[i * 4 + 3] = 255; }
    }
    x.clearRect(0, 0, w, h); x.putImageData(img, 0, 0);
    if (TXT.size > 800) TXT.clear();
    TXT.set(key, cv); return cv;
  }
  function ptext(c, str, x, y, col, size = 12, align = 'left', ol = null) {
    const cv = txt(str, size, col, ol);
    const dx = align === 'center' ? x - cv.width / 2 : align === 'right' ? x - cv.width : x;
    c.drawImage(cv, Math.round(dx), Math.round(y) - 2);
  }
  function vtext(c, str, x, y, col, size = 10, ol = null, lh) {
    lh = lh || size;
    [...str].forEach((ch, i) => ptext(c, ch, x, y + i * lh, col, size, 'center', ol));
  }

  // ---------- 3x5 digit font for floating numbers ----------
  const F3 = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'], '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
    '¥': ['101', '101', '010', '111', '010'], ',': ['000', '000', '000', '010', '100'], 'x': ['000', '101', '010', '101', '000'],
    '♥': ['01010', '11111', '11111', '01110', '00100'], '★': ['00100', '01110', '11111', '01110', '01010'],
    ' ': ['00', '00', '00', '00', '00'], '!': ['1', '1', '1', '0', '1'], '?': ['111', '001', '010', '000', '010'],
    '.': ['0', '0', '0', '0', '1'], ':': ['0', '1', '0', '1', '0'],
  };
  function numW(str) { let w = 0; for (const ch of str) { const g = F3[ch]; if (g) w += g[0].length + 1; } return Math.max(0, w - 1); }
  function num(c, str, x, y, col, align = 'center', ol = INK, s = 1) {
    str = String(str); const w = numW(str) * s;
    let px = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x); y = Math.round(y);
    const cells = [];
    for (const ch of str) {
      const g = F3[ch]; if (!g) continue;
      g.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === '1') cells.push([px + rx * s, y + ry * s]); });
      px += (g[0].length + 1) * s;
    }
    if (ol) { c.fillStyle = ol; cells.forEach(([a, b]) => c.fillRect(a - 1, b - 1, s + 2, s + 2)); }
    c.fillStyle = col; cells.forEach(([a, b]) => c.fillRect(a, b, s, s));
  }

  // ---------- 12x12 sprite maps ----------
  const K = '#2a1810';
  const MAPS = {
    daikon: [['............', '...kkkkkk...', '..kWWWWWWk..', '.kWWwwwwWWk.', '.kWwwwwwwWk.', '.kWwwwwwwWk.', '.kWWwwwwWWk.', '.kSWWWWWWSk.', '.kSSSSSSSSk.', '..kSSSSSSk..', '...kkkkkk...', '............'],
      { k: K, W: '#f6dfa8', w: '#e6b968', S: '#c98a48' }],
    tamago: [['............', '....kkkk....', '...kEEEEk...', '..kEeeEEEk..', '..kEeEEEEk..', '.kEEEEEEEEk.', '.kEEEEEEEEk.', '.kEEEEEEEDk.', '.kDEEEEEDDk.', '..kDDDDDDk..', '...kkkkkk...', '............'],
      { k: K, E: '#e2ad62', e: '#fff0c8', D: '#b2743a' }],
    konnyaku: [['............', '.....kk.....', '....kGGk....', '....kGgGk...', '...kGGGGGk..', '...kGgGGgk..', '..kGGGGGGGk.', '..kGgGGgGGk.', '.kGGGGGGGGGk', '.kHHHHHHHHHk', '.kkkkkkkkkkk', '............'],
      { k: K, G: '#8e887a', g: '#5c584f', H: '#6a655b' }],
    chikuwa: [['............', '............', '..kkkkkkkk..', '.kBbBBbBBkkk', '.kBBBbBBkOOk', '.kBbBBBbkOhk', '.kTTTTTTkOOk', '.kTTTTTTTkkk', '..kkkkkkkk..', '............', '............', '............'],
      { k: K, B: '#b8763a', b: '#8a5226', T: '#f0d6a0', O: '#e8c890', h: '#5a3a20' }],
    kombu: [['............', '..kkk..kkk..', '.kKhKk.kKKk.', '.kKKKKkKhKk.', '..kKKKKKkk..', '...kKhKKk...', '..kKKKKKKk..', '.kKKk.kKhKk.', '.kKk...kKKk.', '..kk....kk..', '............', '............'],
      { k: '#142014', K: '#3e5a3a', h: '#6e8e5a' }],
    hanpen: [['............', '..kkkkkkkk..', '.kWWWWWWWWk.', '.kWwwWWWWWk.', '.kWwWWWWWWk.', '.kWWWWWWWWk.', '.kWWWWWWWWk.', '.kSSSSSSSSk.', '.kSSSSSSSSk.', '..kkkkkkkk..', '............', '............'],
      { k: K, W: '#fbf2dc', w: '#ffffff', S: '#d8c8a8' }],
    ganmo: [['............', '...kkkkkk...', '..kGGgGGGk..', '.kGgGGGrGGk.', '.kGGGGgGGGk.', '.kGrGGGGgGk.', '.kGGgGGGGGk.', '.kDGGGrGGDk.', '..kDDDDDDk..', '...kkkkkk...', '............', '............'],
      { k: K, G: '#c8873e', g: '#e6ae60', r: '#e0603a', D: '#8e5a2a' }],
    mochikin: [['.....kk.....', '....kTTk....', '.....kk.....', '....kPPk....', '...kPPpPk...', '..kPPPPpPk..', '.kPpPPPPPPk.', '.kPPPPPPpPk.', '.kPPPpPPPPk.', '.kDPPPPPPDk.', '..kDDDDDDk..', '...kkkkkk...'],
      { k: K, P: '#d8a050', p: '#f0c878', D: '#a06a2a', T: '#7a8a3a' }],
    gyusuji: [['..........kS', '.........kSk', '..kkkkk.kSk.', '.kMMmMMkSk..', '.kMmMMMSk...', '..kMMMkSkkk.', '...kkSkMMmk.', '...kSkMmMMMk', '..kSk.kMMMk.', '.kSk...kkk..', 'kSk.........', 'Sk..........'],
      { k: K, S: '#dcc490', M: '#8a4a2a', m: '#b8703e' }],
    tsukune: [['.....kk.....', '....kBBk....', '...kBbBBk...', '...kBBBBk...', '....kBBk....', '...kBbBBk...', '...kBBBBk...', '....kBBk....', '...kBbBBk...', '...kBBBBk...', '....kSSk....', '.....kk.....'],
      { k: K, B: '#9a5a32', b: '#cc8452', S: '#e0c890' }],
    roll: [['............', '............', '..kkkkkkkk..', '.kCcCCCCcCk.', 'kCCCCYYCCCCk', 'kcCCCYYCCcCk', 'kCCCCYYCCCCk', '.kDCCCCCCDk.', '..kkkkkkkk..', '............', '............', '............'],
      { k: '#1e2a12', C: '#8ab84a', c: '#c0dc78', Y: '#d8b060', D: '#5a8a3a' }],
    tako: [['.....kk.....', '....kRRk....', '...kRrRRk...', '..kRRRRrRk..', '..kRrRRRRk..', '...kRRrRk...', '..kRRRRRRk..', '..kRrRRrRk..', '...kRRRRk...', '....kkkk....', '.....kSk....', '.....kSk....'],
      { k: '#2a0e0e', R: '#c84848', r: '#f4b8a8', S: '#e0c890' }],
    sake: [['....kkkk....', '....kWWk....', '.....kk.....', '....kWWk....', '...kWWWWk...', '..kWWWWWWk..', '..kBBBBBBk..', '..kWWWWWWk..', '..kWWWWWwk..', '..kWWWWWWk..', '...kWWWWk...', '....kkkk....'],
      { k: '#1e1a22', W: '#f2eee2', w: '#c8c0b0', B: '#3a5aa8' }],
    karashi: [['............', '............', '............', '....kkkk....', '...kYYYYk...', '..kYyYYYYk..', '..kYYYYYYk..', '.kkkkkkkkkk.', 'kPPPPPPPPPPk', '.kkkkkkkkkk.', '............', '............'],
      { k: '#2a2010', Y: '#f0c020', y: '#fff080', P: '#e8e8f0' }],
    // upgrade icons
    u_seat: [['............', '............', '...kkkkkk...', '..kRRRRRRk..', '..kRrRRRRk..', '...kkkkkk...', '....kWWk....', '....kWWk....', '....kWWk....', '...kWWWWk...', '...kkkkkk...', '............'],
      { k: INK, R: '#b83a2a', r: '#e86a4a', W: '#8a5530' }],
    u_table: [['............', '............', '.kkkkkkkkkk.', 'kTTTTTTTTTTk', 'kTtTTTTTTTTk', 'kkkkkkkkkkkk', '.kDk....kDk.', '.kDk....kDk.', '.kDk....kDk.', '.kkk....kkk.', '............', '............'],
      { k: INK, T: '#c8884a', t: '#eeb070', D: '#7a4626' }],
    u_pot: [['............', '............', 'kkkkkkkkkkkk', 'kCCCCCCCCCCk', 'kCkBBkBBkBCk', 'kCkBBkBBkBCk', 'kCCCCCCCCCCk', 'kDDDDDDDDDDk', '.kkkkkkkkkk.', '............', '............', '............'],
      { k: INK, C: '#d07a3a', B: '#c99038', D: '#7a3418' }],
    u_lantern: [['....kkkk....', '...kRRRRk...', '..kRrRRRRk..', '..kkkkkkkk..', '..kRRRRRRk..', '..kRrRRRRk..', '..kkkkkkkk..', '..kRRRRRRk..', '...kRRRRk...', '....kkkk....', '.....kk.....', '............'],
      { k: INK, R: '#d8402c', r: '#ff8a5a' }],
    u_sign: [['..kkkkkkkk..', '..kYYYYYYk..', '..kYkkYYYk..', '..kYYYYYYk..', '..kYYkkYYk..', '..kYYYYYYk..', '..kYkkYYYk..', '..kYYYYYYk..', '..kkkkkkkk..', '...kk..kk...', '..kk....kk..', '............'],
      { k: INK, Y: '#ffe38a' }],
    u_dashi: [['...s..s.....', '....s..s....', '...s..s.....', '............', 'kkkkkkkkkkkk', 'kBBBBBBBBBBk', 'kBbBBBBBBBBk', '.kBBBBBBBBk.', '..kBBBBBBk..', '...kkkkkk...', '............', '............'],
      { k: INK, s: '#f4ead8', B: '#2c3c78', b: '#5a70c0' }],
    u_staff: [['...kkkkk....', '..kHHHHHk...', '.kHHHHHHHk..', '.kHFFFFFHk..', '.kFkFFFkFk..', '.kFFFFFFFk..', '.kFpFFFpFk..', '..kFFFFFk...', '...kPPPk....', '..kPWWWPk...', '..kPWWWPk...', '............'],
      { k: INK, H: '#3a2420', F: '#f6d0a8', p: '#f08a8a', P: '#d86a8a', W: '#f4f0e8' }],
    coin: [['............', '...kkkkkk...', '..kYYYYYYk..', '.kYyyYYYYOk.', '.kYyYkkYYOk.', '.kYYYkkYYOk.', '.kYYYYYYYOk.', '.kYYYYYYOOk.', '..kOOOOOOk..', '...kkkkkk...', '............', '............'],
      { k: '#3a2408', Y: '#f2c040', y: '#fff2a0', O: '#c08020' }],
  };
  const SPR = {};
  function mkSprite(map, pal) {
    const cv = document.createElement('canvas'); cv.width = 12; cv.height = 12; const x = cv.getContext('2d');
    map.forEach((row, yy) => {
      row = (row + '............').slice(0, 12);
      for (let xx = 0; xx < 12; xx++) { const ch = row[xx]; if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(xx, yy, 1, 1); } }
    });
    return cv;
  }
  Object.keys(MAPS).forEach(k => { SPR[k] = mkSprite(MAPS[k][0], MAPS[k][1]); });
  function spr(c, id, x, y, s = 1, alpha = 1) {
    const cv = SPR[id]; if (!cv) return;
    if (alpha < 1) { c.save(); c.globalAlpha = alpha; }
    c.drawImage(cv, Math.round(x), Math.round(y), 12 * s, 12 * s);
    if (alpha < 1) c.restore();
  }
  const ICON = {};
  function iconURL(id) {
    if (ICON[id]) return ICON[id];
    const cv = SPR[id]; if (!cv) return '';
    try { ICON[id] = cv.toDataURL(); } catch (e) { ICON[id] = ''; }
    return ICON[id];
  }
  const BLOB = { daikon: '#f0d090', tamago: '#e2ad62', konnyaku: '#7c776c', chikuwa: '#c08040', kombu: '#3e5a3a', hanpen: '#fbf2dc', ganmo: '#c8873e', mochikin: '#d8a050', gyusuji: '#8a4a2a', tsukune: '#9a5a32', roll: '#8ab84a', tako: '#c84848' };

  // ---------- chibi characters ----------
  function chibi(c, x, y, L, o) {
    o = o || {};
    const dir = o.dir || 'down', pose = o.pose || 'stand', f = o.f | 0, mood = o.mood || '';
    x = Math.round(x); y = Math.round(y);
    const sit = pose === 'sit' || pose === 'eat';
    const walk = pose === 'walk';
    const bob = walk && (f % 2 === 1) ? -1 : 0;
    const by = sit ? y - 2 : y + bob;
    const side = dir === 'left' || dir === 'right', fl = dir === 'left' ? -1 : 1;
    const sx = (dx, w) => (side && fl < 0 ? x - dx - w : x + dx);
    const P = [], D = [];
    // legs
    if (!sit) {
      const lt = by - 4, lh = y - lt;
      if (side) {
        const sw = walk ? (f % 2 ? 1 : -1) : 0;
        const a = sx(-1 + sw * 2, 2), b = sx(-1 - sw * 2, 2);
        P.push([b, lt, 2, lh, L.bottom], [a, lt, 2, lh, L.bottom]);
        D.push([a, y - 1, 2, 1, '#141010'], [b, y - 1, 2, 1, '#141010']);
      } else {
        const h1 = lh - (walk && f % 2 === 0 ? 1 : 0), h2 = lh - (walk && f % 2 === 1 ? 1 : 0);
        P.push([x - 3, lt, 2, h1, L.bottom], [x + 1, lt, 2, h2, L.bottom]);
        D.push([x - 3, lt + h1 - 1, 2, 1, '#141010'], [x + 1, lt + h2 - 1, 2, 1, '#141010']);
      }
    } else if (dir === 'down') P.push([x - 3, by - 4, 6, 2, L.bottom]);
    else if (side) P.push([sx(-2, 6), by - 4, 6, 2, L.bottom]);
    // body
    P.push([x - 4, by - 10, 8, 6, L.top]);
    // arms
    if (!side) {
      const sw = walk ? (f % 2 ? 1 : -1) : 0;
      if (pose === 'eat' && dir === 'down') {
        const up = f % 2;
        P.push([x - 5, by - 10, 1, 5, L.top], [x + 4, by - 12 - up, 1, 4, L.top]);
        D.push([x + 3, by - 13 - up, 1, 1, L.skin], [x + 2, by - 16 - up, 1, 3, '#d8b070'], [x + 1, by - 16 - up, 1, 3, '#d8b070']);
      } else if (pose === 'eat') {
        P.push([x - 5, by - 10, 1, 4, L.top], [x + 4, by - 11 - (f % 2), 1, 4, L.top]);
      } else if (o.hold) {
        P.push([x - 5, by - 9, 2, 3, L.top], [x + 3, by - 9, 2, 3, L.top]);
      } else {
        P.push([x - 5, by - 10 + sw, 1, 5, L.top], [x + 4, by - 10 - sw, 1, 5, L.top]);
        D.push([x - 5, by - 6 + sw, 1, 1, L.skin], [x + 4, by - 6 - sw, 1, 1, L.skin]);
      }
    } else {
      const sw = walk ? (f % 2 ? 1 : -1) : 0;
      if (o.hold) P.push([sx(1, 3), by - 9, 3, 2, L.top]);
      else { P.push([sx(-1 + sw, 2), by - 9, 2, 4, L.top]); D.push([sx(-1 + sw, 2), by - 6, 2, 1, L.skin]); }
      if (pose === 'eat') D.push([sx(3, 1), by - 14 + (f % 2), 1, 4, '#d8b070']);
    }
    // head
    const hy = by - 21;
    P.push([x - 4, hy, 8, 1, L.skin], [x - 5, hy + 1, 10, 9, L.skin], [x - 4, hy + 10, 8, 1, L.skin]);
    const hc = L.hair, band = L.band || '#f4f4f0';
    if (dir === 'up') {
      if (L.hs === 'bald') D.push([x - 5, hy + 5, 10, 3, hc]);
      else {
        D.push([x - 4, hy, 8, 1, hc], [x - 5, hy + 1, 10, L.hs === 'long' || L.hs === 'bob' ? 9 : 8, hc]);
        if (L.hs === 'long') P.push([x - 5, hy + 9, 10, 4, hc]);
      }
      if (L.hs === 'bun') P.push([x - 2, hy - 3, 4, 3, hc]);
      if (L.hs === 'band' || L.hs === 'chef') D.push([x - 5, hy + 3, 10, 2, band]);
    } else if (dir === 'down') {
      switch (L.hs) {
        case 'bald': D.push([x - 5, hy + 4, 1, 3, hc], [x + 4, hy + 4, 1, 3, hc], [x - 2, hy + 1, 2, 1, '#fff3e0']); break;
        case 'long': D.push([x - 4, hy, 8, 1, hc], [x - 5, hy + 1, 10, 2, hc], [x - 5, hy + 3, 2, 2, hc], [x + 3, hy + 3, 2, 2, hc]); P.push([x - 6, hy + 2, 2, 10, hc], [x + 4, hy + 2, 2, 10, hc]); break;
        case 'bob': D.push([x - 4, hy, 8, 1, hc], [x - 5, hy + 1, 10, 3, hc]); P.push([x - 6, hy + 2, 2, 7, hc], [x + 4, hy + 2, 2, 7, hc]); break;
        default: D.push([x - 4, hy, 8, 1, hc], [x - 5, hy + 1, 10, 2, hc], [x - 5, hy + 3, 2, 2, hc], [x + 3, hy + 3, 2, 2, hc], [x - 1, hy + 3, 3, 1, hc]);
      }
      if (L.hs === 'bun') P.push([x - 2, hy - 3, 4, 3, hc]);
      if (L.hs === 'band' || L.hs === 'chef') { D.push([x - 5, hy + 2, 10, 2, band]); P.push([x + 5, hy + 2, 2, 2, band]); }
    } else {
      if (L.hs === 'bald') D.push([sx(-5, 3), hy + 4, 3, 3, hc]);
      else {
        D.push([sx(-4, 8), hy, 8, 1, hc], [sx(-5, 10), hy + 1, 10, 2, hc], [sx(-5, 5), hy + 3, 5, 4, hc]);
        if (L.hs === 'long') P.push([sx(-6, 4), hy + 3, 4, 10, hc]);
        if (L.hs === 'bob') P.push([sx(-6, 4), hy + 3, 4, 6, hc]);
      }
      if (L.hs === 'bun') P.push([sx(-4, 4), hy - 2, 4, 3, hc]);
      if (L.hs === 'band' || L.hs === 'chef') D.push([sx(-5, 10), hy + 2, 10, 2, band]);
    }
    // face
    const ey = hy + 5;
    if (dir === 'down') {
      if (mood === 'happy') D.push([x - 4, ey + 1, 1, 1, INK], [x - 3, ey, 1, 1, INK], [x - 2, ey + 1, 1, 1, INK], [x + 1, ey + 1, 1, 1, INK], [x + 2, ey, 1, 1, INK], [x + 3, ey + 1, 1, 1, INK]);
      else if (mood === 'angry') D.push([x - 3, ey, 1, 2, INK], [x + 2, ey, 1, 2, INK], [x - 4, ey - 2, 1, 1, INK], [x - 3, ey - 1, 1, 1, INK], [x + 3, ey - 2, 1, 1, INK], [x + 2, ey - 1, 1, 1, INK]);
      else D.push([x - 3, ey, 1, 2, INK], [x + 2, ey, 1, 2, INK]);
      D.push([x - 4, ey + 2, 1, 1, '#f08a8a'], [x + 3, ey + 2, 1, 1, '#f08a8a']);
      if (pose === 'eat' && f % 2) D.push([x - 1, ey + 3, 2, 2, '#7a2a20']);
      else if (mood === 'angry') D.push([x - 1, ey + 4, 3, 1, '#7a2a20']);
      else if (mood === 'happy') D.push([x - 1, ey + 3, 3, 1, '#b0503a'], [x, ey + 4, 1, 1, '#b0503a']);
      else D.push([x - 1, ey + 3, 2, 1, '#b0503a']);
      // details on torso
      if (L.tie) D.push([x, by - 10, 1, 4, L.tie], [x - 1, by - 10, 1, 1, '#f4f4f0'], [x + 1, by - 10, 1, 1, '#f4f4f0']);
      if (L.apron) D.push([x - 3, by - 8, 6, 4, L.apron]);
      if (L.btn) D.push([x, by - 9, 1, 1, L.btn], [x, by - 7, 1, 1, L.btn]);
    } else if (side) {
      D.push([sx(2, 1), ey, 1, 2, mood === 'happy' ? L.skin : INK], [sx(2, 1), ey + 2, 1, 1, '#f08a8a']);
      if (mood === 'happy') D.push([sx(1, 3), ey + 1, 3, 1, INK]);
      if (L.apron) D.push([sx(1, 3), by - 8, 3, 4, L.apron]);
    }
    c.fillStyle = o.outline || INK;
    for (const r of P) c.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2);
    for (const r of P) { c.fillStyle = r[4]; c.fillRect(r[0], r[1], r[2], r[3]); }
    for (const r of D) { c.fillStyle = r[4]; c.fillRect(r[0], r[1], r[2], r[3]); }
    if (o.umb) {
      const top = hy - 7;
      for (let i = 0; i < 5; i++) {
        const w = Math.round(Math.sqrt(1 - Math.pow((4 - i) / 5, 2)) * 11) + 1;
        R(c, x - w - 1, top + i, w * 2 + 3, 1, INK);
      }
      for (let i = 0; i < 5; i++) {
        const w = Math.round(Math.sqrt(1 - Math.pow((4 - i) / 5, 2)) * 11);
        R(c, x - w, top + i, w * 2 + 1, 1, i === 0 ? o.umbHi || o.umb : o.umb);
      }
      R(c, x - 12, top + 5, 25, 1, INK);
      for (let k = -11; k <= 11; k += 4) R(c, x + k, top + 4, 1, 1, o.umbHi || '#ffffff');
      R(c, x, top - 2, 1, 2, INK);
      R(c, x + (side ? fl : 1) * 1, top + 5, 1, 12, '#3a2a20');
    }
  }

  // ---------- speech bubble ----------
  function bubble(c, x, yb, w, h, fill = '#fff8ea', ol = INK) {
    const bx = Math.round(x - w / 2), by = Math.round(yb - h - 3);
    R(c, bx + 1, by, w - 2, h, ol); R(c, bx, by + 1, w, h - 2, ol);
    R(c, bx + 1, by + 1, w - 2, h - 2, fill);
    R(c, x - 3, by + h - 1, 7, 1, fill); R(c, x - 4, by + h - 1, 1, 1, ol); R(c, x + 4, by + h - 1, 1, 1, ol);
    R(c, x - 2, by + h, 5, 1, fill); R(c, x - 3, by + h, 1, 1, ol); R(c, x + 3, by + h, 1, 1, ol);
    R(c, x - 1, by + h + 1, 3, 1, fill); R(c, x - 2, by + h + 1, 1, 1, ol); R(c, x + 2, by + h + 1, 1, 1, ol);
    R(c, x, by + h + 2, 1, 1, ol);
    return { bx, by };
  }

  // ---------- oden bowl (small, on counter / table) ----------
  function dish(c, x, y, items, karashi) {
    disc(c, x, y + 1, 8, 3, 'rgba(0,0,0,0.3)');
    disc(c, x, y, 8, 3, INK); disc(c, x, y, 7, 2, '#2c3c78'); disc(c, x, y - 1, 5, 1, '#d8a050');
    (items || []).slice(0, 5).forEach((id, i) => {
      const ox = [-3, 2, -1, 4, -5][i], oy = [-2, -2, -3, -1, -1][i];
      R(c, x + ox, y + oy, 3, 2, BLOB[id] || '#ccc'); R(c, x + ox, y + oy + 2, 3, 1, 'rgba(0,0,0,0.35)');
    });
    if (karashi) R(c, x + 5, y - 2, 2, 1, '#f0c020');
  }

  // ---------- lantern ----------
  function lantern(c, x, y, t, i, size, text) {
    const sw = Math.round(Math.sin(t * 1.5 + i * 1.7) * (size > 1 ? 1.2 : 1));
    const w = size === 2 ? 18 : size === 1 ? 12 : 7, h = size === 2 ? 40 : size === 1 ? 18 : 9;
    const cx = x + sw, lx = Math.round(cx - w / 2), ly = y + (size === 0 ? 1 : 4);
    if (size > 0) R(c, x, y, 1, 4, INK);
    glow(c, cx, ly + h / 2, size === 2 ? 34 : size === 1 ? 20 : 10, '#ff6a30', size === 0 ? 0.45 : 0.6 + Math.sin(t * 7 + i) * 0.05);
    R(c, lx + 1, ly + 1, w - 2, h - 2, INK); R(c, lx, ly + 3, w, h - 6, INK);
    R(c, lx + 2, ly + 2, w - 4, h - 4, '#d83a2a'); R(c, lx + 1, ly + 4, w - 2, h - 8, '#d83a2a');
    if (size > 0) for (let yy = ly + 5; yy < ly + h - 3; yy += 3) R(c, lx + 1, yy, w - 2, 1, '#a82a22');
    R(c, lx + 2, ly + 4, 1, h - 8, '#ff8a5a');
    R(c, lx + 2, ly, w - 4, 2, INK); R(c, lx + 2, ly + h - 2, w - 4, 2, INK);
    if (size > 0) R(c, cx, ly + h, 1, 3, INK);
    if (text) vtext(c, text, cx + 1, ly + 5, '#1a0806', size === 2 ? 10 : 8, null, size === 2 ? 10 : 8);
  }

  // =====================================================
  // STATIC PAINTERS
  // =====================================================
  function wire(c, x0, y0, x1, y1, sag, col) {
    const n = Math.abs(x1 - x0);
    for (let i = 0; i <= n; i++) {
      const t = i / n; R(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t), 1, 1, col);
    }
  }

  function paintExteriorBG(c, o) {
    const r = srand(11);
    const sky = ['#080a16', '#0b0e1e', '#0e1226', '#11162e', '#141a36'];
    for (let i = 0; i < 5; i++) R(c, 0, i * 24, W, 24, sky[i]);
    R(c, 0, 120, W, 150, sky[4]);
    for (let i = 1; i < 5; i++) for (let x = 0; x < W; x += 2) R(c, x + (i % 2), i * 24 - 1, 1, 1, sky[i]);
    disc(c, 90, 22, 70, 6, '#121832'); disc(c, 400, 30, 90, 7, '#121832'); disc(c, 250, 8, 60, 4, '#10152c');
    // far skyline
    [[0, 58, 46], [40, 34, 34], [74, 64, 40], [350, 40, 30], [376, 16, 42], [414, 50, 30], [440, 26, 40]].forEach(([x, t, w]) => {
      R(c, x, t, w, 200, '#161a31'); R(c, x, t, w, 1, '#22284a');
      for (let yy = t + 6; yy < 200; yy += 8) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (r() < 0.3) R(c, xx, yy, 3, 3, r() < 0.45 ? '#6a5a32' : '#33364e');
    });
    // ---- left neighbour (izakaya) ----
    R(c, 0, 70, 120, 158, '#2a2e4a'); R(c, 0, 70, 120, 2, '#3e4468');
    [[8, 84, true], [54, 84, false]].forEach(([x, y, lit]) => {
      R(c, x, y, 36, 26, '#121424'); R(c, x + 2, y + 2, 32, 22, lit ? '#f6c46e' : '#2a3456');
      if (lit) { R(c, x + 2, y + 2, 9, 22, '#c0703e'); R(c, x + 25, y + 2, 9, 22, '#c0703e'); R(c, x + 12, y + 8, 4, 6, '#a45a30'); }
      else { R(c, x + 3, y + 3, 10, 2, '#3a4670'); }
      R(c, x + 17, y + 2, 2, 22, '#121424'); R(c, x - 2, y + 26, 40, 2, '#555a72');
      for (let k = 0; k < 40; k += 4) R(c, x - 2 + k, y + 22, 1, 5, '#555a72');
    });
    for (let i = 0; i < 4; i++) R(c, 0, 136 + i * 3, 124 + i * 2, 3, i % 2 ? '#2c3246' : '#373f5a');
    R(c, 0, 148, 130, 2, '#0e0c18');
    R(c, 0, 150, 120, 76, '#4a2e1e');
    for (let x = 0; x < 120; x += 5) R(c, x, 150, 1, 76, '#3a2216');
    R(c, 28, 164, 56, 62, '#20120a'); R(c, 31, 167, 50, 59, '#f2b860');
    for (let x = 31; x < 81; x += 7) R(c, x, 167, 1, 59, '#9a6030');
    for (let y = 167; y < 226; y += 9) R(c, 31, y, 50, 1, '#9a6030');
    R(c, 55, 167, 2, 59, '#20120a'); R(c, 31, 206, 50, 20, '#5e3820');
    R(c, 26, 152, 60, 18, '#26357a');
    [41, 56, 71].forEach(x => R(c, x, 152, 1, 18, '#141c48'));
    ptext(c, '선술집', 56, 155, '#f2ead6', 10, 'center');
    // bicycle
    const bc = '#b83a3a';
    ellipseLine(c, 74, 219, 6, 6, '#1a1a22'); ellipseLine(c, 98, 219, 6, 6, '#1a1a22');
    ellipseLine(c, 74, 219, 5, 5, '#5a5a66'); ellipseLine(c, 98, 219, 5, 5, '#5a5a66');
    line(c, 74, 219, 84, 210, bc); line(c, 84, 210, 96, 210, bc); line(c, 96, 210, 98, 219, bc); line(c, 84, 210, 86, 219, bc); line(c, 86, 219, 74, 219, bc);
    R(c, 81, 207, 5, 2, INK); R(c, 95, 206, 1, 4, '#888'); R(c, 93, 205, 5, 1, '#888');
    // ---- right building ----
    R(c, 362, 56, 118, 172, '#262a46'); R(c, 362, 56, 118, 2, '#383e64');
    R(c, 374, 68, 32, 22, '#121424'); R(c, 376, 70, 28, 18, '#8aa8d8'); R(c, 376, 70, 28, 6, '#a8c4ec'); R(c, 389, 70, 2, 18, '#121424');
    R(c, 428, 68, 32, 22, '#121424'); R(c, 430, 70, 28, 18, '#2c3658');
    R(c, 364, 142, 64, 8, '#d0d0d8'); for (let x = 364; x < 428; x += 8) R(c, x, 142, 4, 8, '#c03a3a');
    R(c, 364, 150, 64, 2, '#802020');
    R(c, 368, 152, 56, 74, '#4a4e62'); for (let y = 154; y < 226; y += 3) R(c, 368, y, 56, 1, '#3a3e50');
    // pole + wires (in front of right bldg)
    R(c, 390, 0, 6, 228, '#3a3e50'); R(c, 390, 0, 1, 228, '#5a5e76'); R(c, 395, 0, 1, 228, '#26283a');
    R(c, 376, 24, 34, 3, '#3a3e50'); R(c, 378, 21, 2, 3, '#c8c8d0'); R(c, 405, 21, 2, 3, '#c8c8d0');
    R(c, 397, 40, 11, 20, '#5a5e70'); R(c, 397, 40, 11, 2, '#7a7e90'); R(c, 397, 58, 11, 2, '#3a3e50');
    R(c, 372, 60, 18, 2, '#3a3e50'); R(c, 366, 60, 10, 4, '#24283a');
    // yellow/black stripe pole guard
    for (let y = 196; y < 226; y += 6) { R(c, 390, y, 6, 3, '#e8c020'); R(c, 390, y + 3, 6, 3, '#1a1a1a'); }

    // ---- MAIN SHOP ----
    // roof
    R(c, 138, 12, 204, 4, '#1c2030'); R(c, 136, 11, 4, 6, '#1c2030'); R(c, 340, 11, 4, 6, '#1c2030');
    R(c, 318, 0, 6, 13, '#5a5e70'); R(c, 316, 0, 10, 2, '#6a6e80');
    for (let rr = 0; rr < 9; rr++) {
      const y = 16 + rr * 3, x0 = Math.round(138 - rr * 2.4), x1 = Math.round(342 + rr * 2.4);
      R(c, x0, y, x1 - x0, 3, rr % 2 ? '#2a3044' : '#30374e'); R(c, x0, y, x1 - x0, 1, '#454e6e');
      for (let sx = x0 + (rr % 2) * 3; sx < x1; sx += 7) R(c, sx, y + 1, 1, 2, '#1c2030');
    }
    R(c, 116, 43, 248, 2, '#5a6488'); R(c, 116, 45, 248, 2, '#141826');
    // upper wall
    R(c, 128, 47, 224, 57, '#a8916a');
    for (let y = 47; y < 104; y += 2) for (let x = 128 + (y % 4 ? 0 : 1); x < 352; x += 9) R(c, x, y, 1, 1, '#9a845e');
    [[128, 5], [184, 4], [292, 4], [347, 5]].forEach(([x, w]) => R(c, x, 47, w, 57, '#5e3820'));
    R(c, 128, 47, 224, 4, '#3a2014'); R(c, 128, 100, 224, 4, '#5e3820');
    R(c, 196, 56, 92, 38, '#3a2014'); R(c, 199, 59, 86, 32, '#ffd98c');
    R(c, 199, 59, 86, 3, '#ffe8b0'); R(c, 199, 86, 86, 5, '#f0c070');
    for (let x = 199; x < 285; x += 11) R(c, x, 59, 1, 32, '#a8743a');
    for (let y = 67; y < 91; y += 8) R(c, 199, y, 86, 1, '#a8743a');
    R(c, 241, 59, 2, 32, '#3a2014');
    disc(c, 222, 80, 5, 5, '#e8b468'); R(c, 216, 84, 13, 7, '#e8b468'); // silhouette
    R(c, 142, 62, 34, 24, '#3a2014'); R(c, 144, 64, 30, 20, '#d8a858');
    for (let y = 65; y < 84; y += 3) R(c, 144, y, 30, 1, '#b8884a');
    R(c, 300, 70, 34, 16, '#80848e'); R(c, 300, 70, 34, 1, '#a0a4ae'); for (let x = 303; x < 332; x += 3) R(c, x, 73, 1, 10, '#5a5e68'); R(c, 302, 86, 30, 2, '#3a3a44');
    // eave (hisashi)
    for (let rr = 0; rr < 6; rr++) {
      const y = 104 + rr * 3, x0 = 118 - rr, x1 = 362 + rr;
      R(c, x0, y, x1 - x0, 3, rr % 2 ? '#2a3044' : '#323a52'); R(c, x0, y, x1 - x0, 1, '#48526f');
      for (let sx = x0 + (rr % 2) * 3; sx < x1; sx += 7) R(c, sx, y + 1, 1, 2, '#1c2030');
    }
    R(c, 112, 122, 256, 2, '#5a6488'); R(c, 114, 124, 252, 2, '#100c14');
    // ground floor
    R(c, 124, 126, 232, 96, '#5e3820');
    for (let x = 124; x < 356; x += 5) R(c, x, 126, 1, 96, '#46281a');
    R(c, 130, 138, 52, 52, '#2a160c'); R(c, 133, 141, 46, 46, '#ffcf78');
    disc(c, 146, 168, 5, 5, '#e2a858'); R(c, 140, 172, 13, 15, '#e2a858'); disc(c, 166, 166, 5, 5, '#e2a858'); R(c, 160, 170, 13, 17, '#e2a858');
    for (let x = 133; x < 179; x += 6) R(c, x, 141, 1, 46, '#9a6634');
    for (let y = 141; y < 187; y += 6) R(c, 133, y, 46, 1, '#9a6634');
    R(c, 128, 190, 56, 3, '#3a2014');
    // door
    R(c, 194, 132, 92, 90, '#2a160c');
    [197, 241].forEach(dx => {
      R(c, dx, 135, 42, 87, '#ffd27a'); R(c, dx, 135, 42, 4, '#ffe6a8');
      for (let x = dx; x < dx + 42; x += 7) R(c, x, 135, 1, 65, '#a06a30');
      for (let y = 145; y < 200; y += 10) R(c, dx, y, 42, 1, '#a06a30');
      R(c, dx, 200, 42, 22, '#6e4224'); R(c, dx, 200, 42, 1, '#8a5530');
      R(c, dx + 2, 204, 38, 1, '#5a3420'); R(c, dx + 2, 212, 38, 1, '#5a3420');
    });
    R(c, 239, 135, 2, 87, '#2a160c');
    // blackboard
    R(c, 296, 134, 54, 54, '#8a5530'); R(c, 299, 137, 48, 48, '#22342a');
    ptext(c, '오늘의', 323, 139, '#f4f0e0', 10, 'center');
    ptext(c, '추천', 323, 151, '#ffe08a', 10, 'center');
    ptext(c, '무', 323, 163, '#f4f0e0', 10, 'center');
    ptext(c, '소힘줄', 323, 174, '#ffb0a0', 10, 'center');
    R(c, 300, 188, 46, 2, '#5e3820');
    // stone base & step
    R(c, 120, 218, 240, 8, '#56586a'); for (let x = 120; x < 360; x += 12) R(c, x, 218, 1, 8, '#44465a'); R(c, 120, 218, 240, 1, '#6c6e82');
    R(c, 190, 222, 100, 4, '#6a6c7e');
    // crates
    R(c, 133, 202, 24, 18, INK); R(c, 134, 203, 22, 16, '#d0a848'); for (let x = 134; x < 156; x += 5) R(c, x, 203, 1, 16, '#987428'); R(c, 134, 209, 22, 1, '#987428');
    R(c, 158, 207, 18, 13, INK); R(c, 159, 208, 16, 11, '#a88040'); R(c, 159, 212, 16, 1, '#705020');
    // standing sign (upgrade)
    if (o.sign) {
      R(c, 359, 186, 22, 36, INK); R(c, 361, 188, 18, 30, '#ffe38a');
      vtext(c, '오뎅', 370, 190, '#b82a1a', 9, null, 9);
      R(c, 362, 218, 2, 6, INK); R(c, 376, 218, 2, 6, INK);
    }
    // ---- ground ----
    R(c, 0, 226, W, 12, '#34374e'); for (let x = 0; x < W; x += 16) R(c, x, 226, 1, 12, '#2a2d42'); R(c, 0, 231, W, 1, '#2e3146');
    R(c, 0, 237, W, 2, '#4c506a');
    R(c, 0, 239, W, 31, '#1e2034');
    for (let i = 0; i < 260; i++) R(c, r() * W, 240 + r() * 30, 1, 1, r() < 0.5 ? '#262940' : '#191b2c');
    for (let x = 10; x < W; x += 44) R(c, x, 256, 22, 1, '#3a3d56');
    [[170, 250, 26, 3], [330, 262, 32, 3], [56, 246, 18, 2], [430, 254, 22, 3], [250, 232, 14, 1]].forEach(([x, y, rx, ry]) => {
      disc(c, x, y, rx, ry, '#121426'); R(c, x - rx + 3, y - ry, rx, 1, '#2a3050');
    });
    // wires (front)
    wire(c, 0, 28, 378, 24, 12, '#0a0a12'); wire(c, 0, 34, 378, 26, 16, '#0a0a12'); wire(c, 408, 24, 480, 38, 4, '#0a0a12'); wire(c, 408, 26, 480, 50, 6, '#0a0a12');
    wire(c, 396, 50, 480, 100, 8, '#0a0a12');
  }

  function paintInteriorBG(c, o) {
    const r = srand(5);
    // floor: planks run away from the viewer (3/4 top-down)
    for (let x = 0, col = 0; x < W; x += 12, col++) {
      R(c, x, 100, 12, H - 100, col % 2 ? '#9a6436' : '#a66c3a'); R(c, x, 100, 1, H - 100, '#6e4224');
      R(c, x + 1, 100, 1, H - 100, col % 2 ? '#a8703e' : '#b47842');
      let y = 100 + (col * 29) % 56; while (y < H) { R(c, x, y, 12, 1, '#6e4224'); R(c, x, y + 1, 12, 1, '#b47c46'); y += 56 + (col * 17) % 30; }
      for (let k = 0; k < 9; k++) R(c, x + 3 + r() * 7, 104 + r() * (H - 108), 1, 3, '#8e5a30');
    }
    // soft occlusion where floor meets the side walls
    c.fillStyle = 'rgba(40,16,6,0.28)'; c.fillRect(8, 100, 6, H - 100); c.fillRect(W - 14, 100, 6, H - 100);
    // back wall
    R(c, 0, 0, W, 72, '#dcc08a');
    for (let y = 8; y < 54; y += 2) for (let x = (y % 4 ? 0 : 3); x < W; x += 7) R(c, x, y, 1, 1, '#cfb27c');
    R(c, 0, 54, W, 18, '#7a4a28'); for (let x = 0; x < W; x += 16) R(c, x, 54, 1, 18, '#5a341c'); R(c, 0, 54, W, 2, '#4a2a16');
    R(c, 0, 0, W, 7, '#3a2014'); R(c, 0, 7, W, 1, '#24120a');
    [[0, 6], [156, 4], [320, 4], [474, 6]].forEach(([x, w]) => { R(c, x, 7, w, 65, '#5e3820'); R(c, x, 7, 1, 65, '#7a4a2a'); });
    // window frame (inside drawn dynamically)
    R(c, 16, 12, 74, 40, '#4a2a16'); R(c, 14, 50, 78, 3, '#5e3820');
    // signboard + menu tags
    R(c, 194, 9, 92, 17, '#2a160c'); R(c, 196, 11, 88, 13, '#c8944e'); R(c, 196, 11, 88, 1, '#e4b470');
    ptext(c, '오뎅', 240, 12, '#2a1408', 12, 'center');
    const tags = ['무', '달걀', '곤약', '어묵', '유부', '떡', '한펜', '완자', '힘줄', '문어'];
    tags.forEach((tg, i) => {
      const x = 170 + i * 14;
      R(c, x, 28, 12, 25, '#2a160c'); R(c, x + 1, 29, 10, 23, '#e8cc90');
      vtext(c, tg, x + 6.5, 30, '#3a1a0a', 10, null, 10);
    });
    // poster
    R(c, 96, 14, 20, 34, '#2a160c'); R(c, 97, 15, 18, 32, '#f4ead0'); R(c, 97, 15, 18, 8, '#c8322a');
    vtext(c, '사케', 106, 25, '#3a1a0a', 10, null, 10);
    // clock face
    disc(c, 136, 28, 9, 9, '#3a2014'); disc(c, 136, 28, 7, 7, '#f4ead0');
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; R(c, 136 + Math.cos(a) * 6, 28 + Math.sin(a) * 6, 1, 1, '#8a6a4a'); }
    // shelves
    [24, 46].forEach(y => { R(c, 330, y, 132, 3, '#5e3820'); R(c, 330, y + 3, 132, 1, '#3a2014'); });
    let bx = 334;
    while (bx < 456) {
      const kind = r();
      if (kind < 0.35) { R(c, bx, 12, 5, 12, INK); R(c, bx + 1, 13, 3, 11, '#2e6a3a'); R(c, bx + 1, 15, 3, 3, '#f4ead0'); R(c, bx + 2, 9, 1, 3, INK); bx += 8; }
      else if (kind < 0.65) { R(c, bx, 15, 6, 9, INK); R(c, bx + 1, 16, 4, 8, '#f2eee2'); R(c, bx + 1, 19, 4, 1, '#3a5aa8'); bx += 8; }
      else { R(c, bx, 10, 6, 14, INK); R(c, bx + 1, 11, 4, 13, '#7a3a1a'); R(c, bx + 1, 15, 4, 4, '#e8d8a0'); bx += 9; }
    }
    bx = 334;
    while (bx < 456) {
      const kind = r();
      if (kind < 0.5) { R(c, bx, 37, 8, 9, INK); R(c, bx + 1, 38, 6, 8, kind < 0.25 ? '#c8a060' : '#8a8e9a'); bx += 11; }
      else { R(c, bx, 39, 10, 7, INK); R(c, bx + 1, 40, 8, 6, '#e0d8c0'); R(c, bx + 1, 42, 8, 1, '#2c3c78'); bx += 12; }
    }
    // kitchen floor
    R(c, 0, 72, W, 28, '#4c4656');
    for (let x = 0; x < W; x += 10) R(c, x, 72, 1, 28, '#3e3848');
    for (let y = 72; y < 100; y += 7) R(c, 0, y, W, 1, '#3e3848');
    // back prep counter
    R(c, 96, 62, 288, 12, '#b4bac6'); R(c, 96, 62, 288, 1, '#e0e4ec'); R(c, 96, 73, 288, 1, '#8a909c'); R(c, 96, 74, 288, 8, '#646876');
    for (let x = 96; x < 384; x += 32) R(c, x, 74, 1, 8, '#4a4e5a');
    R(c, 112, 54, 22, 11, INK); R(c, 113, 55, 20, 10, '#8a8e9c'); R(c, 113, 55, 20, 2, '#b8bcc8'); // stock pot
    R(c, 150, 58, 16, 7, INK); R(c, 151, 59, 14, 6, '#f0ece0'); // dish stack
    R(c, 151, 61, 14, 1, '#2c3c78');
    R(c, 330, 56, 14, 9, INK); R(c, 331, 57, 12, 8, '#c8a060'); // board
    R(c, 352, 57, 18, 8, INK); R(c, 353, 58, 16, 7, '#d8d8e0'); // rice cooker
    [292, 298, 304].forEach(x => { R(c, x, 40, 1, 20, '#8a8e9a'); disc(c, x, 60, 2, 1, '#8a8e9a'); });
    // side walls seen from above (wall tops frame the room)
    const sideWall = (x0, gaps) => {
      let y = 0;
      const seg = (y0, y1) => { R(c, x0, y0, 8, y1 - y0, '#2a160c'); R(c, x0 + 1, y0, 6, y1 - y0, '#5e3820'); R(c, x0 + 2, y0, 4, y1 - y0, '#7a4a2a'); R(c, x0 + 3, y0, 1, y1 - y0, '#9a6438'); };
      gaps.forEach(([g0, g1]) => { seg(y, g0); R(c, x0, g0 - 2, 8, 2, '#2a160c'); R(c, x0, g1, 8, 2, '#2a160c'); y = g1; });
      seg(y, H);
    };
    sideWall(0, []);
    // entrance: an opening in the right wall, night outside
    sideWall(W - 8, [[200, 256]]);
    R(c, W - 8, 200, 8, 56, '#101222');
    for (let k = 0; k < 10; k++) R(c, W - 7 + r() * 6, 202 + r() * 50, 1, 3, '#3a4468');
    R(c, W - 9, 200, 2, 56, '#8a8478'); R(c, W - 9, 200, 1, 56, '#b0a898'); // stone sill
    for (let k = 0; k < 4; k++) { R(c, W - 12, 202 + k * 13, 4, 11, '#23305e'); R(c, W - 12, 202 + k * 13, 1, 11, '#3a4a8a'); } // noren seen edge-on
    R(c, 440, 234, 30, 18, '#3a2a20'); R(c, 441, 235, 28, 16, '#5a4a6a'); for (let y = 237; y < 250; y += 3) R(c, 442, y, 26, 1, '#4a3a5a'); // mat
    // umbrella stand (top + front)
    R(c, 450, 118, 12, 16, INK); R(c, 451, 122, 10, 11, '#5e3820'); disc(c, 456, 120, 5, 2, '#3a2014');
    R(c, 452, 108, 1, 12, '#2a4a8a'); R(c, 455, 106, 1, 14, '#a83a2a'); R(c, 458, 110, 1, 10, '#2a6a4a');
    // plant left (pot rim from above)
    R(c, 14, 238, 14, 14, INK); R(c, 15, 239, 12, 12, '#8a5530'); disc(c, 21, 239, 7, 3, INK); disc(c, 21, 239, 6, 2, '#3a2a1a');
    disc(c, 21, 230, 9, 8, '#2e5a2e'); disc(c, 18, 226, 5, 5, '#3e7a3a'); disc(c, 25, 232, 4, 4, '#3e7a3a');
  }

  function paintCounter(c, o) {
    c.fillStyle = 'rgba(30,12,4,0.35)'; c.fillRect(90, 132, 300, 8); c.fillStyle = 'rgba(30,12,4,0.2)'; c.fillRect(88, 140, 304, 3);
    // front face
    R(c, 93, 117, 294, 16, INK); R(c, 94, 117, 292, 15, '#7a4626');
    for (let x = 94; x < 386; x += 24) { R(c, x, 118, 1, 14, '#5a321a'); R(c, x + 1, 118, 1, 14, '#8a5430'); }
    R(c, 94, 131, 292, 1, '#3a1e10');
    // top surface (seen from above)
    R(c, 91, 88, 298, 30, INK);
    R(c, 92, 89, 296, 25, '#c8884a'); R(c, 92, 89, 296, 2, '#a86c38'); R(c, 92, 91, 296, 1, '#e8aa66');
    for (let x = 100; x < 384; x += 37) { R(c, x, 96, 12, 1, '#b67a40'); R(c, x + 17, 106, 9, 1, '#b67a40'); }
    R(c, 92, 114, 296, 2, '#e0a462'); R(c, 92, 116, 296, 1, '#8a5430'); // rounded front lip
    // pot
    R(c, 190, 94, 100, 23, 'rgba(60,24,8,0.35)');
    R(c, 192, 96, 96, 19, INK); R(c, 193, 97, 94, 17, '#b8642e'); R(c, 193, 97, 94, 1, '#f0a060'); R(c, 193, 113, 94, 1, '#6e3418');
    // items standing on the counter top (top + front faces)
    R(c, 104, 92, 5, 10, INK); R(c, 105, 93, 3, 9, '#2a1410'); R(c, 105, 93, 3, 2, '#c82a2a'); R(c, 103, 101, 7, 2, 'rgba(60,24,8,0.35)');
    R(c, 112, 96, 7, 7, INK); R(c, 113, 99, 5, 3, '#d0a010'); R(c, 113, 97, 5, 2, '#fff080'); R(c, 111, 102, 9, 2, 'rgba(60,24,8,0.35)');
    R(c, 360, 94, 15, 10, INK); R(c, 361, 95, 13, 4, '#7a5430'); R(c, 361, 99, 13, 4, '#5a3a20'); for (let x = 362; x < 373; x += 2) R(c, x, 95, 1, 3, '#e0c890');
    R(c, 345, 97, 9, 7, INK); R(c, 346, 98, 7, 3, '#ffffff'); R(c, 346, 101, 7, 2, '#d8d0c0');
    (o.seats || []).forEach(se => {
      const stool = (y, top, side, hi, leg) => {
        disc(c, se.x, y + leg + 1, 6, 2, 'rgba(30,12,4,0.3)'); R(c, se.x - 1, y + 2, 2, leg, '#3a2a20');
        disc(c, se.x, y + 1, 6, 3, INK); disc(c, se.x, y + 1, 5, 2, side); disc(c, se.x, y, 5, 2, top); R(c, se.x - 3, y - 1, 5, 1, hi);
      };
      if (se.type === 'c') stool(135, '#a83a2a', '#6e2218', '#d85a40', 10);
      else stool(se.type === 'tt' ? 188 : 221, '#8a5530', '#5a3420', '#b07040', 7);
    });
  }

  function table(c, cx, cy) {
    c.fillStyle = 'rgba(30,12,4,0.3)'; c.fillRect(cx - 30, 216, 60, 8);
    R(c, cx - 25, 214, 3, 9, INK); R(c, cx + 22, 214, 3, 9, INK); R(c, cx - 24, 214, 1, 8, '#5a321a'); R(c, cx + 23, 214, 1, 8, '#5a321a');
    R(c, cx - 28, 190, 56, 26, INK);
    R(c, cx - 27, 191, 54, 19, '#c08048'); R(c, cx - 27, 191, 54, 1, '#e0a468'); R(c, cx - 27, 191, 1, 19, '#d0925a');
    R(c, cx - 20, 197, 14, 1, '#b07038'); R(c, cx + 6, 204, 12, 1, '#b07038');
    R(c, cx - 27, 209, 54, 1, '#e0a468'); R(c, cx - 27, 210, 54, 5, '#7a4626'); R(c, cx - 27, 214, 54, 1, '#5a321a');
    R(c, cx - 3, 197, 6, 6, INK); R(c, cx - 2, 197, 4, 2, '#ffffff'); R(c, cx - 2, 199, 4, 3, '#e0d8c8'); R(c, cx - 2, 197, 4, 1, '#c8322a'); // menu stand
  }

  Object.assign(A, {
    R, disc, ellipseLine, line, glow, ptext, vtext, num, numW, spr, SPR, iconURL, BLOB, chibi, bubble, dish, lantern,
    paintExteriorBG, paintInteriorBG, paintCounter, table, srand,
    clearText() { TXT.clear(); },
  });
  window.ART = A;
})();
