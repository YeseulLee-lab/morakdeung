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
  // text painted onto an iso wall: each pixel column is shifted by `slope` so the letters lie on the wall
  // (+0.5 = walls/facades running down-right, -0.5 = walls running down-left)
  function stext(c, str, x, y, col, size = 12, align = 'center', ol = null, slope = 0.5) {
    const cv = txt(str, size, col, ol), w = cv.width;
    const x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x), mid = align === 'center' ? w / 2 : align === 'right' ? w : 0;
    for (let i = 0; i < w; i++) c.drawImage(cv, i, 0, 1, cv.height, x0 + i, Math.round(y) - 2 + Math.round((i - mid) * slope), 1, cv.height);
  }
  function svtext(c, str, x, y, col, size = 10, ol = null, lh, slope = 0.5) {
    lh = lh || size;
    [...str].forEach((ch, i) => stext(c, ch, x, y + i * lh, col, size, 'center', ol, slope));
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
    u_expand: [['............', '.....kk.....', '....kRRk....', '...kRrRRk...', '..kRRRRRRk..', '.kkkkkkkkkk.', '.kWWWWWWWWk.', '.kWkkWWkkWk.', '.kWkYWWkYWk.', '.kWWWWWWWWk.', '.kkkkkkkkkk.', '............'],
      { k: INK, R: '#c03a3a', r: '#ff7a5a', W: '#e8cc90', Y: '#ffd27a' }],
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

  // ---------- exterior: a rainy back street in quarter view ----------
  // world (EX projection): buildings gy 0..3 (facades on gy=3), sidewalk 3..4.3, road 4.3..9.5,
  // far sidewalk 9.5..10.8, parapet, then a canal. The shop is gx 4..10.
  const XS = { shop: [4, 10], door: [6.15, 7.85], pole: [12.5, 4.05], lampAt: [12.5, 4.95, 116], vend: [13.7, 14.5, 3.0, 3.55] };
  function fF(c, gx0, gx1, h0, h1, col, gy = 3) { poly(c, [iso(gx0, gy, h1), iso(gx1, gy, h1), iso(gx1, gy, h0), iso(gx0, gy, h0)], col); }
  function fX(c, gy0, gy1, h0, h1, col, gx) { poly(c, [iso(gx, gy0, h1), iso(gx, gy1, h1), iso(gx, gy1, h0), iso(gx, gy0, h0)], col); }
  function lattice(c, gx0, gx1, h0, h1, step, hs, col, gy = 3) {
    for (let g = gx0 + step; g < gx1 - 0.01; g += step) isoLine(c, iso(g, gy, h0), iso(g, gy, h1), col);
    for (let h = h0 + hs; h < h1; h += hs) isoLine(c, iso(gx0, gy, h), iso(gx1, gy, h), col);
  }
  function tiles(c, gx0, gx1, gyA, hA, gyB, hB, base, line, hi) {
    poly(c, [iso(gx0, gyA, hA), iso(gx1, gyA, hA), iso(gx1, gyB, hB), iso(gx0, gyB, hB)], base);
    const n = Math.max(2, Math.round(Math.abs(gyB - gyA) / 0.28));
    for (let i = 1; i < n; i++) { const k = i / n; const gy = gyA + (gyB - gyA) * k, h = hA + (hB - hA) * k; isoLine(c, iso(gx0, gy, h), iso(gx1, gy, h), i % 2 ? line : hi); }
    isoLine(c, iso(gx0, gyB, hB), iso(gx1, gyB, hB), hi);
  }

  function paintExteriorBG(c, o) {
    proj(EX);
    const r = srand(11);
    // sky
    const sky = ['#080a16', '#0b0e1e', '#0e1226', '#11162e', '#141a36'];
    for (let i = 0; i < 5; i++) R(c, 0, i * 30, W, 30, sky[i]);
    R(c, 0, 150, W, 120, sky[4]);
    for (let i = 1; i < 5; i++) for (let x = 0; x < W; x += 2) R(c, x + (i % 2), i * 30 - 1, 1, 1, sky[i]);
    disc(c, 330, 16, 90, 6, '#121832'); disc(c, 440, 34, 60, 5, '#121832');
    // far skyline (upper right, behind the street)
    [[250, 6, 30], [282, 22, 26], [312, 0, 34], [350, 18, 40], [392, 4, 28], [424, 30, 56]].forEach(([x, t, w]) => {
      R(c, x, t, w, 200, '#161a31'); R(c, x, t, w, 1, '#22284a');
      for (let yy = t + 6; yy < 160; yy += 8) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (r() < 0.3) R(c, xx, yy, 3, 3, r() < 0.45 ? '#6a5a32' : '#33364e');
    });
    // ---- ground ----
    // canal (front-left)
    flr(c, -14, 11.1, 30, 22, 0, '#0a0e1c');
    for (let i = 0; i < 70; i++) { const p = iso(-8 + r() * 30, 11.6 + r() * 9); R(c, p[0], p[1], 3 + r() * 6, 1, r() < 0.5 ? '#141a32' : '#10152a'); }
    // far sidewalk + parapet with rail
    flr(c, -14, 9.5, 30, 10.8, 0, '#2c2f44');
    for (let g = -14; g < 30; g += 0.7) isoLine(c, iso(g, 9.5), iso(g, 10.8), '#24273a');
    box(c, -14, 10.8, 30, 11.1, 0, 8, '#5a5c6e', '#44465a', '#3a3c50');
    for (let g = -13; g < 30; g += 1.2) { const p = iso(g, 10.95, 8); R(c, p[0], p[1] - 9, 1, 9, '#6a6e82'); }
    isoLine(c, iso(-14, 10.95, 17), iso(30, 10.95, 17), '#7a7e92'); isoLine(c, iso(-14, 10.95, 16), iso(30, 10.95, 16), '#3a3c50');
    // road
    flr(c, -14, 4.3, 30, 9.5, 0, '#1e2034');
    for (let i = 0; i < 520; i++) { const p = iso(-10 + r() * 34, 4.4 + r() * 5); R(c, p[0], p[1], 1, 1, r() < 0.5 ? '#262940' : '#191b2c'); }
    for (let g = -14; g < 30; g += 2) isoLine(c, iso(g, 6.9), iso(g + 1.1, 6.9), '#3a3d56');
    isoLine(c, iso(-14, 9.45), iso(30, 9.45), '#2a2d42');
    { const p = iso(9.6, 7.9); disc(c, p[0], p[1], 9, 4, '#141626'); A.ellipseLine(c, p[0], p[1], 9, 4, '#2a2d44'); } // manhole
    // near sidewalk + curb
    flr(c, -14, 3, 30, 4.3, 0, '#34374e');
    for (let g = -14; g < 30; g += 0.65) isoLine(c, iso(g, 3), iso(g, 4.3), '#2a2d42');
    isoLine(c, iso(-14, 3.65), iso(30, 3.65), '#2e3146');
    box(c, -14, 4.18, 30, 4.32, 0, 2, '#4c506a', '#3a3d56', '#2a2d42', null);
    // puddles (reflective)
    PUD.forEach(([gx, gy, rr]) => { const p = iso(gx, gy); disc(c, p[0], p[1], rr * 18, rr * 8, '#121426'); R(c, p[0] - rr * 12, p[1] - rr * 6, rr * 14, 1, '#2a3050'); });

    // ---- buildings, left to right (each one covers its left neighbour's hidden side) ----
    // far left block
    box(c, -10, 0, -3, 3, 0, 112, '#20243c', '#262a46', '#1e2238');
    for (let h = 20; h < 104; h += 16) for (let g = -9.4; g < -3.6; g += 1.1) { const lit = r() < 0.3; fF(c, g, g + 0.6, h, h + 9, lit ? '#6a5a32' : '#1a1e34'); }
    // izakaya (left neighbour)
    box(c, -3, 0.4, 4, 3, 0, 72, '#20243c', '#2a2e4a', '#20243c');
    fF(c, -3, 4, 0, 40, '#4a2e1e'); for (let g = -2.8; g < 4; g += 0.3) isoLine(c, iso(g, 3, 0), iso(g, 3, 40), '#3a2216');
    fF(c, -2.5, -0.6, 10, 32, '#20120a'); fF(c, -2.4, -0.7, 11, 31, '#f2b860'); lattice(c, -2.4, -0.7, 11, 31, 0.42, 5, '#9a6030');
    fF(c, 0.3, 3.3, 0, 36, '#20120a'); fF(c, 0.4, 3.2, 0, 35, '#f2b860'); lattice(c, 0.4, 3.2, 0, 35, 0.4, 6, '#9a6030'); fF(c, 0.4, 3.2, 0, 10, '#5e3820');
    fF(c, 0.2, 3.4, 22, 40, '#26357a'); [1.0, 2.6].forEach(g => isoLine(c, iso(g, 3, 22), iso(g, 3, 40), '#141c48'));
    { const p = iso(1.8, 3, 31); ptext(c, '선술집', p[0], p[1] - 4, '#f2ead6', 8, 'center'); }
    tiles(c, -3.2, 4.0, 3, 44, 3.6, 38, '#2c3246', '#232838', '#3a4260');
    fF(c, -2.2, 0.2, 52, 66, '#121424'); fF(c, -2.1, 0.1, 53, 65, '#f6c46e'); fF(c, -2.1, -1.5, 53, 65, '#c0703e'); fF(c, -0.5, 0.1, 53, 65, '#c0703e');
    fF(c, 1.2, 3.4, 52, 66, '#121424'); fF(c, 1.3, 3.3, 53, 65, '#2a3456');
    tiles(c, -3.2, 4.0, 1.2, 84, 3.2, 70, '#262c40', '#1c2030', '#343c56');
    // bicycle + crates
    { const p = iso(0.0, 3.75); const bc = '#b83a3a';
      A.ellipseLine(c, p[0] - 6, p[1] - 3, 5, 5, '#1a1a22'); A.ellipseLine(c, p[0] + 10, p[1] + 5, 5, 5, '#1a1a22');
      line(c, p[0] - 6, p[1] - 3, p[0] + 1, p[1] - 9, bc); line(c, p[0] + 1, p[1] - 9, p[0] + 9, p[1] - 5, bc); line(c, p[0] + 9, p[1] - 5, p[0] + 10, p[1] + 5, bc); line(c, p[0] + 1, p[1] - 9, p[0] + 2, p[1] + 1, bc); line(c, p[0] + 2, p[1] + 1, p[0] - 6, p[1] - 3, bc);
      R(c, p[0] - 1, p[1] - 11, 4, 2, INK); R(c, p[0] + 8, p[1] - 9, 4, 1, '#888'); }

    // ---- MAIN SHOP ----
    const [s0, s1] = XS.shop, [d0, d1] = XS.door;
    box(c, s0, 0.2, s1, 3, 0, 100, '#2a3044', '#5e3820', '#46281a');
    // ground floor
    fF(c, s0, s1, 0, 58, '#5e3820'); for (let g = s0 + 0.1; g < s1; g += 0.28) isoLine(c, iso(g, 3, 4), iso(g, 3, 58), '#46281a');
    fF(c, s0, s1, 0, 4, '#56586a'); for (let g = s0; g < s1; g += 0.66) isoLine(c, iso(g, 3, 0), iso(g, 3, 4), '#44465a');
    // window (left)
    fF(c, 4.35, 5.85, 13, 43, '#2a160c'); fF(c, 4.45, 5.75, 14, 42, '#ffcf78');
    { const p = iso(4.85, 3, 14), q = iso(5.35, 3, 14); disc(c, p[0], p[1] - 17, 4, 4, '#e2a858'); R(c, p[0] - 5, p[1] - 13, 10, 13, '#e2a858'); disc(c, q[0], q[1] - 19, 4, 4, '#e2a858'); R(c, q[0] - 5, q[1] - 15, 10, 15, '#e2a858'); }
    lattice(c, 4.45, 5.75, 14, 42, 0.33, 6, '#9a6634');
    fF(c, 4.3, 5.9, 11, 13, '#3a2014');
    // door (two glowing shoji leaves)
    fF(c, d0 - 0.08, d1 + 0.08, 0, 47, '#2a160c');
    [[d0, (d0 + d1) / 2 - 0.03], [(d0 + d1) / 2 + 0.03, d1]].forEach(([a, b]) => {
      fF(c, a, b, 0, 45, '#ffd27a'); fF(c, a, b, 42, 45, '#ffe6a8');
      lattice(c, a, b, 10, 45, 0.27, 7, '#a06a30');
      fF(c, a, b, 0, 10, '#6e4224'); isoLine(c, iso(a, 3, 10), iso(b, 3, 10), '#8a5530');
    });
    // blackboard menu
    fF(c, 8.25, 9.65, 14, 38, '#3a2014'); fF(c, 8.3, 9.6, 15, 37, '#ffcf78'); lattice(c, 8.3, 9.6, 15, 37, 0.33, 6, '#9a6634'); // small side window
    { const p = iso(9.0, 3.45); // standing menu board facing the street
      R(c, p[0] - 13, p[1] - 38, 27, 34, '#5e3820'); R(c, p[0] - 12, p[1] - 37, 25, 32, '#8a5530'); R(c, p[0] - 10, p[1] - 35, 21, 28, '#22342a');
      R(c, p[0] - 11, p[1] - 4, 2, 5, '#3a2014'); R(c, p[0] + 10, p[1] - 4, 2, 5, '#3a2014');
      ptext(c, '추천', p[0], p[1] - 34, '#ffe08a', 10, 'center'); ptext(c, '무', p[0], p[1] - 23, '#f4f0e0', 8, 'center'); ptext(c, '소힘줄', p[0], p[1] - 15, '#ffb0a0', 8, 'center'); }
    // eave (hisashi) over the ground floor
    tiles(c, s0 - 0.2, s1 + 0.2, 3, 62, 3.75, 54, '#2a3044', '#1c2030', '#48526f');
    box(c, s0 - 0.2, 3.7, s1 + 0.2, 3.8, 52, 54, '#5a6488', '#141826', '#141826', null);
    // upper floor
    fF(c, s0, s1, 62, 100, '#a8916a');
    for (let h = 64; h < 100; h += 2) for (let g = s0 + (h % 4 ? 0 : 0.1); g < s1; g += 0.5) { const p = iso(g, 3, h); R(c, p[0], p[1], 1, 1, '#9a845e'); }
    [[s0, 0.25], [5.2, 0.18], [8.8, 0.18], [s1 - 0.25, 0.25]].forEach(([g, w]) => fF(c, g, g + w, 62, 100, '#5e3820'));
    fF(c, s0, s1, 96, 100, '#3a2014'); fF(c, s0, s1, 62, 65, '#5e3820');
    fF(c, 5.6, 8.4, 70, 95, '#3a2014'); fF(c, 5.7, 8.3, 71, 94, '#ffd98c'); fF(c, 5.7, 8.3, 71, 74, '#f0c070');
    { const p = iso(6.4, 3, 71); disc(c, p[0], p[1] - 14, 4, 4, '#e8b468'); R(c, p[0] - 6, p[1] - 10, 12, 10, '#e8b468'); }
    lattice(c, 5.7, 8.3, 71, 94, 0.43, 8, '#a8743a'); fF(c, 6.97, 7.03, 71, 94, '#3a2014');
    fF(c, 8.95, 9.75, 74, 86, '#80848e'); for (let g = 9.05; g < 9.7; g += 0.12) isoLine(c, iso(g, 3, 76), iso(g, 3, 84), '#5a5e68');
    if (o.rank >= 1) { const p = iso(7, 3.05, 66); R(c, p[0] - 24, p[1] - 7, 48, 13, INK); R(c, p[0] - 23, p[1] - 6, 46, 11, '#6e4224'); R(c, p[0] - 21, p[1] - 4, 42, 7, '#d8a860'); ptext(c, '오뎅 모락등', p[0], p[1] - 4, '#2a1408', 8, 'center'); }
    // pitched roof
    tiles(c, s0 - 0.25, s1 + 0.25, 1.4, 118, 3.45, 97, '#30374e', '#232838', '#454e6e');
    poly(c, [iso(s1 + 0.25, 1.4, 118), iso(s1 + 0.25, 3.45, 97), iso(s1 + 0.25, 1.4, 97)], '#262c40');
    box(c, s0 - 0.25, 1.32, s1 + 0.25, 1.5, 116, 121, '#454e6e', '#2a3044', '#1c2030');
    box(c, 9.0, 0.9, 9.3, 1.2, 116, 132, '#6a6e80', '#5a5e70', '#44485a'); // chimney pipe

    // ---- right building (snack bar) ----
    box(c, 10, 0, 15, 3, 0, 130, '#22263e', '#262a46', '#1e2238');
    for (let h = 92; h < 124; h += 16) for (let g = 10.5; g < 14.5; g += 1.3) { const lit = r() < 0.35; fF(c, g, g + 0.8, h, h + 10, '#121424'); fF(c, g + 0.06, g + 0.74, h + 1, h + 9, lit ? '#8aa8d8' : '#2c3658'); }
    fF(c, 10.6, 14.6, 40, 46, '#d0d0d8'); for (let g = 10.6; g < 14.6; g += 0.5) fF(c, g, g + 0.25, 40, 46, '#c03a3a');
    tiles(c, 10.6, 14.6, 3, 40, 3.45, 35, '#c03a3a', '#a02a2a', '#e05a5a');
    fF(c, 10.8, 13.4, 0, 36, '#4a4e62'); for (let h = 2; h < 36; h += 3) isoLine(c, iso(10.8, 3, h), iso(13.4, 3, h), '#3a3e50');
    fF(c, 13.6, 14.8, 0, 30, '#121424'); fF(c, 13.7, 14.7, 0, 29, '#2a3048');
    // far right block
    box(c, 15, 0.3, 22, 3, 0, 96, '#20243c', '#2a2e4a', '#1e2238');
    for (let h = 18; h < 90; h += 16) for (let g = 15.5; g < 21; g += 1.2) { const lit = r() < 0.25; fF(c, g, g + 0.6, h, h + 9, lit ? '#6a5a32' : '#1a1e34'); }
    // vending machine
    { const [v0, v1, w0, w1] = XS.vend; box(c, v0, w0, v1, w1, 0, 44, '#2a3488', '#3a48a8', '#2a3480');
      fF(c, v0 + 0.08, v1 - 0.08, 22, 42, '#d8ecff', w1);
      ['#e84a4a', '#4ac0e8', '#f0c040', '#5ad070', '#f08ad0', '#ffffff'].forEach((col, i) => { const g = v0 + 0.14 + (i % 3) * 0.2, h = 38 - ((i / 3) | 0) * 9; fF(c, g, g + 0.13, h - 6, h, col, w1); });
      fF(c, v0 + 0.15, v1 - 0.15, 12, 16, '#141826', w1); fF(c, v0 + 0.15, v1 - 0.15, 3, 9, '#232a6a', w1); }
    // standing sign (upgrade)
    if (o.sign) { const p = iso(10.45, 3.55); R(c, p[0] - 5, p[1] - 30, 11, 30, INK); R(c, p[0] - 4, p[1] - 29, 9, 24, '#ffe38a'); vtext(c, '오뎅', p[0], p[1] - 27, '#b82a1a', 9, null, 9); R(c, p[0] - 5, p[1] - 4, 2, 4, INK); R(c, p[0] + 3, p[1] - 4, 2, 4, INK); }
    // crates by the shop
    box(c, 4.15, 3.05, 4.75, 3.45, 0, 12, '#d0a848', '#b08830', '#987428'); box(c, 4.85, 3.1, 5.3, 3.45, 0, 8, '#a88040', '#906830', '#705020');
    // overhead wires (from the pole, top)
    const pt = iso(XS.pole[0], XS.pole[1], 150);
    wire(c, pt[0], pt[1], 500, 70, 10, '#0a0a12'); wire(c, pt[0], pt[1] + 4, 500, 92, 12, '#0a0a12');
    proj();
  }
  const PUD = [[6.6, 5.7, 1.0], [13.2, 7.6, 1.2], [1.4, 7.0, 0.8], [17.2, 5.3, 0.8], [8.6, 9.9, 0.6], [-2.5, 5.6, 0.9]];
  // utility pole + street lamp (drawn live so walkers can pass behind it)
  function polePainter(c) {
    proj(EX);
    const [pg, py] = XS.pole, b = iso(pg, py), t = iso(pg, py, 150);
    R(c, b[0] - 3, t[1], 6, b[1] - t[1], '#3a3e50'); R(c, b[0] - 3, t[1], 1, b[1] - t[1], '#5a5e76'); R(c, b[0] + 2, t[1], 1, b[1] - t[1], '#26283a');
    for (let h = 2; h < 32; h += 6) { const q = iso(pg, py, h); R(c, q[0] - 3, q[1] - 3, 6, 3, '#e8c020'); R(c, q[0] - 3, q[1], 6, 3, '#1a1a1a'); }
    const cb = iso(pg, py, 140); R(c, cb[0] - 16, cb[1], 32, 3, '#3a3e50'); R(c, cb[0] - 14, cb[1] - 3, 2, 3, '#c8c8d0'); R(c, cb[0] + 12, cb[1] - 3, 2, 3, '#c8c8d0');
    const tr = iso(pg, py, 112); R(c, tr[0] + 3, tr[1] - 14, 10, 18, '#5a5e70'); R(c, tr[0] + 3, tr[1] - 14, 10, 2, '#7a7e90');
    const la = iso(XS.lampAt[0], XS.lampAt[1], XS.lampAt[2]), lb = iso(pg, py, 120);
    line(c, lb[0], lb[1], la[0], la[1] - 2, '#3a3e50'); line(c, lb[0], lb[1] + 1, la[0], la[1] - 1, '#2a2e40');
    R(c, la[0] - 4, la[1] - 2, 8, 3, '#2a2e40'); R(c, la[0] - 3, la[1] + 1, 6, 1, '#f4faff');
    proj();
  }

  // =====================================================
  // ISOMETRIC (quarter view) helpers — 2:1 pixel iso
  // world: gx runs to screen down-right, gy to screen down-left, h is height in px
  // =====================================================
  const IL = { GX: 12, GY: 7.7, HW: 20, HH: 10, OX: 197, OY: 70, WH: 64, CH: 18, TH: 14, POT: [0.95, 2.18, 2.7, 2.87] };
  const EX = { GX: 0, GY: 0, HW: 22, HH: 11, HS: 1.22, OX: 152, OY: 84 };
  let PJ = IL; // projection used by the drawing helpers below (interior by default)
  function iso(gx, gy, h) { return [PJ.OX + (gx - gy) * PJ.HW, PJ.OY + (gx + gy) * PJ.HH - (h || 0) * (PJ.HS || 1)]; }
  const isoI = (gx, gy, h) => [IL.OX + (gx - gy) * IL.HW, IL.OY + (gx + gy) * IL.HH - (h || 0)];
  const isoE = (gx, gy, h) => [EX.OX + (gx - gy) * EX.HW, EX.OY + (gx + gy) * EX.HH - (h || 0) * EX.HS];
  function proj(p) { PJ = p || IL; }
  // convex polygon scanline fill — crisp, no anti-aliasing, shared edges never gap
  function poly(c, pts, col) {
    if (col) c.fillStyle = col;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const n = pts.length;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      const sy = y + 0.5; let a = Infinity, b = -Infinity;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        if ((p[1] <= sy && q[1] > sy) || (q[1] <= sy && p[1] > sy)) {
          const x = p[0] + (sy - p[1]) / (q[1] - p[1]) * (q[0] - p[0]);
          if (x < a) a = x; if (x > b) b = x;
        }
      }
      if (a < b) { const xs = Math.round(a), xe = Math.round(b); if (xe > xs) c.fillRect(xs, y, xe - xs, 1); }
    }
  }
  const quadF = (gx0, gy0, gx1, gy1, h) => [iso(gx0, gy0, h), iso(gx1, gy0, h), iso(gx1, gy1, h), iso(gx0, gy1, h)];
  function flr(c, gx0, gy0, gx1, gy1, h, col) { poly(c, quadF(gx0, gy0, gx1, gy1, h), col); }
  // wall faces: R = plane gy=const (back-right wall), L = plane gx=const (back-left wall)
  function wR(c, gx0, gx1, h0, h1, col, gy = 0) { poly(c, [iso(gx0, gy, h1), iso(gx1, gy, h1), iso(gx1, gy, h0), iso(gx0, gy, h0)], col); }
  function wL(c, gy0, gy1, h0, h1, col, gx = 0) { poly(c, [iso(gx, gy0, h1), iso(gx, gy1, h1), iso(gx, gy1, h0), iso(gx, gy0, h0)], col); }
  function isoLine(c, a, b, col) { line(c, a[0], a[1], b[0], b[1], col); }
  // a box resting at height h0 with top at h1; faces: top, left (gy=gy1) and right (gx=gx1)
  function box(c, gx0, gy0, gx1, gy1, h0, h1, top, left, right, ol = INK) {
    if (ol) {
      const sil = [iso(gx0, gy0, h1), iso(gx1, gy0, h1), iso(gx1, gy0, h0), iso(gx1, gy1, h0), iso(gx0, gy1, h0), iso(gx0, gy1, h1)];
      c.fillStyle = ol;
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => poly(c, sil.map(p => [p[0] + dx, p[1] + dy])));
    }
    poly(c, [iso(gx0, gy1, h1), iso(gx1, gy1, h1), iso(gx1, gy1, h0), iso(gx0, gy1, h0)], left);
    poly(c, [iso(gx1, gy0, h1), iso(gx1, gy1, h1), iso(gx1, gy1, h0), iso(gx1, gy0, h0)], right);
    poly(c, quadF(gx0, gy0, gx1, gy1, h1), top);
  }
  // upright sprite helpers anchored on an iso point (things that stand on surfaces)
  function upR(c, p, dx, dy, w, h, col) { R(c, p[0] + dx, p[1] + dy, w, h, col); }
  function stool(c, gx, gy, top = '#a83a2a', side = '#6e2218', hi = '#d85a40', hs = 9) {
    const [x, y] = iso(gx, gy);
    disc(c, x, y, 6, 2, 'rgba(30,12,4,0.32)');
    R(c, x - 1, y - hs + 2, 2, hs - 2, INK); R(c, x - 1, y - hs + 2, 1, hs - 3, '#5a4a40');
    R(c, x - 3, y - 1, 6, 1, '#3a2a20');
    disc(c, x, y - hs + 1, 6, 3, INK); disc(c, x, y - hs + 1, 5, 2, side); disc(c, x, y - hs, 5, 2, top); R(c, x - 3, y - hs - 1, 4, 1, hi);
  }

  function paintInteriorBG(c, o) {
    const r = srand(5), { GX, GY, WH } = IL;
    R(c, 0, 0, W, H, '#0c0a12');
    for (let i = 0; i < 140; i++) R(c, r() * W, r() * H, 1, 1, r() < 0.5 ? '#14111c' : '#100d16');
    poly(c, [iso(0, GY, 0), iso(GX, GY, 0), iso(GX, GY, -8), iso(0, GY, -8)], '#3a2216');
    poly(c, [iso(GX, -0.3, 0), iso(GX, GY, 0), iso(GX, GY, -8), iso(GX, -0.3, -8)], '#24140c');
    isoLine(c, iso(0, GY, -1), iso(GX, GY, -1), '#5e3820'); isoLine(c, iso(GX, GY, -1), iso(GX, -0.3, -1), '#3a2216');
    // ---- floor: wooden hall, tiled kitchen behind the counter ----
    for (let g = 0, k = 0; g < GY; g += 0.5, k++) {
      flr(c, 0, g, GX, g + 0.5, 0, k % 2 ? '#9a6436' : '#a66c3a');
      isoLine(c, iso(0, g), iso(GX, g), '#6e4224');
      isoLine(c, iso(0, g + 0.06), iso(GX, g + 0.06), k % 2 ? '#a8703e' : '#b47842');
      let x = (k * 1.7) % 3.1;
      while (x < GX) { isoLine(c, iso(x, g), iso(x, g + 0.5), '#6e4224'); x += 2.6 + ((k * 7) % 5) * 0.35; }
      for (let q = 0; q < 10; q++) { const p = iso(r() * GX, g + 0.12 + r() * 0.3); R(c, p[0], p[1], 2, 1, '#8e5a30'); }
    }
    flr(c, 0, 0, GX, 2.1, 0, '#4c4656');
    for (let g = 0.5; g < 2.1; g += 0.5) isoLine(c, iso(0, g), iso(GX, g), '#3e3848');
    for (let g = 0.5; g < GX; g += 0.5) isoLine(c, iso(g, 0), iso(g, 2.1), '#3e3848');
    isoLine(c, iso(0, 2.1), iso(GX, 2.1), '#2c2836');
    const mE = Math.min(10.4, IL.CTR[1]); flr(c, 0.4, 1.05, mE, 1.75, 0, '#2a2630'); for (let g = 0.7; g < mE; g += 0.3) isoLine(c, iso(g, 1.05), iso(g, 1.75), '#22202a'); // anti-fatigue mat
    c.fillStyle = 'rgba(40,16,6,0.30)'; poly(c, quadF(0, 0, GX, 0.22, 0)); poly(c, quadF(0, 0.22, 0.22, GY, 0));

    // ---- back-right wall (behind the kitchen): white tiles + plaster ----
    wR(c, 0, GX, 0, WH, '#dcc08a');
    for (let h = 44; h < 58; h += 3) for (let g = (h % 2) * 0.17; g < GX; g += 0.45) { const p = iso(g, 0, h); R(c, p[0], p[1], 1, 1, '#cfb27c'); }
    wR(c, 0, GX, 0, 42, '#e8e2d4');
    for (let h = 7; h < 42; h += 7) isoLine(c, iso(0, 0, h), iso(GX, 0, h), '#c8c0b0');
    for (let g = 0.4; g < GX; g += 0.4) isoLine(c, iso(g, 0, 0), iso(g, 0, 42), '#d4ccbc');
    wR(c, 0, GX, 42, 44, '#8a8478');
    wR(c, 0, GX, 57, WH, '#3a2014'); isoLine(c, iso(0, 0, 57), iso(GX, 0, 57), '#24120a');
    // ---- back-left wall: kitchen tiles at the back, wood + plaster along the hall ----
    wL(c, 0, GY, 0, WH, '#c9ab76');
    for (let h = 18; h < 58; h += 3) for (let g = (h % 2) * 0.17; g < GY; g += 0.45) { const p = iso(0, g, h); R(c, p[0], p[1], 1, 1, '#bb9e6a'); }
    wL(c, 2.1, GY, 0, 16, '#6a3e22');
    for (let g = 2.3; g < GY; g += 0.5) isoLine(c, iso(0, g, 0), iso(0, g, 16), '#4e2c18');
    wL(c, 2.1, GY, 16, 18, '#40240f');
    wL(c, 0, 2.1, 0, 42, '#d4cebf');
    for (let h = 7; h < 42; h += 7) isoLine(c, iso(0, 0, h), iso(0, 2.1, h), '#b8b0a0');
    for (let g = 0.4; g < 2.1; g += 0.4) isoLine(c, iso(0, g, 0), iso(0, g, 42), '#c4bcac');
    wL(c, 0, GY, 57, WH, '#30190f'); isoLine(c, iso(0, 0, 57), iso(0, GY, 57), '#1e0e08');
    [0.0, 2.05, GY - 0.12].forEach(g => wL(c, g, g + 0.12, 0, 57, '#5e3820'));
    [GX - 0.12].forEach(g => wR(c, g, g + 0.12, 0, 57, '#6e4224'));
    isoLine(c, iso(0, 0, 0), iso(0, 0, WH), '#4a2a16');
    poly(c, [iso(-0.3, -0.3, WH), iso(GX, -0.3, WH), iso(GX, 0, WH), iso(0, 0, WH)], '#24120a');
    poly(c, [iso(-0.3, -0.3, WH), iso(0, 0, WH), iso(0, GY, WH), iso(-0.3, GY, WH)], '#1e0e08');
    poly(c, [iso(GX, -0.3, WH), iso(GX, 0, WH), iso(GX, 0, -8), iso(GX, -0.3, -8)], '#4a2a16');
    poly(c, [iso(-0.3, GY, WH), iso(0, GY, WH), iso(0, GY, -8), iso(-0.3, GY, -8)], '#5e3820');
    isoLine(c, iso(GX, 0, WH), iso(GX, 0, -8), '#2a160c'); isoLine(c, iso(0, GY, WH), iso(0, GY, -8), '#2a160c');

    // ================= KITCHEN EQUIPMENT along the back wall =================
    // back-room doorway with a short noren
    wR(c, 0.35, 1.7, 0, 46, '#2a160c'); wR(c, 0.45, 1.6, 0, 44, '#3a2a24');
    for (let i = 0; i < 3; i++) { const g0 = 0.45 + i * 0.385; wR(c, g0, g0 + 0.35, 26, 44, '#6a2420'); wR(c, g0 + 0.03, g0 + 0.32, 27, 44, '#a8342a'); }
    // gas range + two simmering stock pots, exhaust hood above
    const RG = [2.0, 3.8];
    box(c, RG[0], 0.05, RG[1], 0.9, 0, 18, '#3a3e4a', '#8a8e9a', '#6a6e7a');
    for (let g = RG[0] + 0.15; g < RG[1] - 0.1; g += 0.42) isoLine(c, iso(g, 0.9, 3), iso(g, 0.9, 15), '#5a5e6a');
    [[2.15, 2.85], [3.0, 3.65]].forEach(([a, b], i) => {
      const p = iso((a + b) / 2, 0.47, 18); glow(c, p[0], p[1], 7, '#4a8aff', 0.5);
      box(c, a, 0.12, b, 0.82, 18, i ? 30 : 34, '#b8bcc8', '#8a8e9c', '#6a6e7a'); flr(c, a + 0.08, 0.2, b - 0.08, 0.74, i ? 30 : 34, '#5a4030');
    });
    box(c, 1.9, 0.0, 3.9, 0.95, 46, 54, '#9a9eaa', '#7a7e8a', '#5a5e6a'); isoLine(c, iso(1.9, 0.95, 46), iso(3.9, 0.95, 46), '#4a4e5a');
    wR(c, 2.6, 3.2, 54, 64, '#7a7e8a');
    // stainless prep table with board + knife
    box(c, 4.0, 0.05, 5.6, 0.85, 0, 18, '#c8ccd6', '#9a9eaa', '#7a7e8a');
    isoLine(c, iso(4.0, 0.85, 8), iso(5.6, 0.85, 8), '#7a7e8a');
    box(c, 4.25, 0.2, 5.0, 0.65, 18, 20, '#d8b070', '#b08850', '#906838');
    { const p = iso(5.3, 0.4, 18); R(c, p[0] - 4, p[1] - 2, 7, 1, '#d8dce4'); R(c, p[0] + 3, p[1] - 2, 3, 1, '#3a2014'); }
    // sink with faucet and dish rack
    box(c, 5.8, 0.05, 7.3, 0.85, 0, 18, '#c8ccd6', '#9a9eaa', '#7a7e8a');
    flr(c, 6.0, 0.2, 6.9, 0.7, 18, '#6a6e7a'); flr(c, 6.08, 0.26, 6.82, 0.64, 18, '#4a4e5a');
    { const p = iso(6.45, 0.12, 18); R(c, p[0], p[1] - 10, 2, 10, '#b8bcc8'); R(c, p[0] - 3, p[1] - 10, 6, 2, '#b8bcc8'); }
    for (let k = 0; k < 4; k++) { const p = iso(7.0, 0.25 + k * 0.13, 18); R(c, p[0] - 2, p[1] - 8, 1, 8, '#f0ece0'); R(c, p[0] - 1, p[1] - 8, 3, 8, '#e0d8c8'); }
    // big double-door fridge
    box(c, 7.5, 0.05, 8.75, 0.9, 0, 52, '#b0b4c0', '#d8dce4', '#a8acb8');
    isoLine(c, iso(8.12, 0.9, 1), iso(8.12, 0.9, 51), '#8a8e9a');
    { const a = iso(8.02, 0.9, 32), b = iso(8.22, 0.9, 32); R(c, a[0], a[1] - 10, 1, 10, '#6a6e7a'); R(c, b[0], b[1] - 10, 1, 10, '#6a6e7a'); }
    { const p = iso(8.12, 0.9, 46); R(c, p[0] - 6, p[1] - 3, 12, 3, '#3a6ac8'); }
    if (GX >= 10.5) {
    // cabinet with microwave + rice cooker
    box(c, 8.95, 0.05, 10.2, 0.85, 0, 18, '#8a5530', '#6e4224', '#5a341c');
    box(c, 9.05, 0.1, 9.85, 0.75, 18, 28, '#e0e0e6', '#c8c8d0', '#a8a8b4');
    { wR(c, 9.15, 9.6, 20, 26, '#2a2e3a', 0.75); const q = iso(9.75, 0.75, 24); R(c, q[0], q[1] - 1, 2, 2, '#6ad06a'); }
    box(c, 9.95, 0.25, 10.15, 0.6, 18, 24, '#f0ece0', '#d8d0c0', '#c0b8a8');
    }
    if (GX >= 11.2) {
    // water / ice dispenser
    box(c, 10.45, 0.05, 11.15, 0.75, 0, 34, '#d8dce4', '#e8ecf2', '#b8bcc8');
    { const p = iso(10.8, 0.75, 22); R(c, p[0] - 4, p[1] - 8, 8, 8, '#2a2e3a'); R(c, p[0] - 1, p[1] - 8, 2, 3, '#b8bcc8'); R(c, p[0] - 4, p[1] - 14, 8, 3, '#3a8ad8'); }
    box(c, 10.5, 0.1, 11.1, 0.7, 34, 46, '#c8e8ff', '#a8d0f0', '#88b0d8');
    }
    // air conditioner high on the wall
    box(c, 7.6, 0.0, 9.0, 0.35, 54, 61, '#f0f0f4', '#d8d8e0', '#c0c0c8'); isoLine(c, iso(7.7, 0.35, 55), iso(8.9, 0.35, 55), '#9a9aa8');
    // menu board + hanging tags (above the prep table / sink)
    wR(c, 4.95, 6.35, 41, 63, '#2a160c'); wR(c, 5.0, 6.3, 42, 62, '#c8944e'); wR(c, 5.0, 6.3, 61, 62, '#e4b470');
    { const p = iso(5.65, 0, 52); ptext(c, '오뎅', p[0], p[1] - 5, '#2a1408', 10, 'center'); }
    const tags = [['무', 4.06], ['달걀', 4.6], ['곤약', 6.42], ['어묵', 6.96]];
    tags.forEach(([tg, g0]) => {
      wR(c, g0, g0 + 0.5, 15, 40, '#2a160c'); wR(c, g0 + 0.05, g0 + 0.45, 16, 39, '#e8cc90');
      const p = iso(g0 + 0.25, 0, 27.5), n = [...tg].length;
      vtext(c, tg, p[0], p[1] - (n * 9) / 2 + 1, '#3a1a0a', 8, null, 9);
    });
    // bottle shelves over the cabinet
    const sE = Math.min(11.6, GX - 0.3);
    if (sE > 9.6) [38, 50].forEach(h => { wR(c, 9.0, sE, h - 2, h, '#5e3820'); wR(c, 9.0, sE, h - 3, h - 2, '#3a2014'); });
    let g = 9.1;
    while (g < sE - 0.2) {
      const kind = r(), p = iso(g, 0.08, 50);
      if (kind < 0.35) { R(c, p[0] - 2, p[1] - 12, 5, 12, INK); R(c, p[0] - 1, p[1] - 11, 3, 11, '#2e6a3a'); R(c, p[0] - 1, p[1] - 9, 3, 3, '#f4ead0'); R(c, p[0], p[1] - 15, 1, 3, INK); }
      else if (kind < 0.65) { R(c, p[0] - 2, p[1] - 9, 6, 9, INK); R(c, p[0] - 1, p[1] - 8, 4, 8, '#f2eee2'); R(c, p[0] - 1, p[1] - 5, 4, 1, '#3a5aa8'); }
      else { R(c, p[0] - 2, p[1] - 14, 6, 14, INK); R(c, p[0] - 1, p[1] - 13, 4, 13, '#7a3a1a'); R(c, p[0] - 1, p[1] - 9, 4, 4, '#e8d8a0'); }
      g += 0.42;
    }
    // left wall (kitchen part): dish shelves, ladle rack, clock
    [28, 40].forEach(h => { wL(c, 0.25, 1.95, h - 2, h, '#5e3820'); wL(c, 0.25, 1.95, h - 3, h - 2, '#3a2014'); });
    for (let gg = 0.4; gg < 1.9; gg += 0.45) { const p = iso(0.06, gg, 28); R(c, p[0] - 3, p[1] - 6, 7, 6, INK); R(c, p[0] - 2, p[1] - 5, 5, 5, '#f0ece0'); R(c, p[0] - 2, p[1] - 3, 5, 1, '#2c3c78'); }
    for (let gg = 0.45; gg < 1.9; gg += 0.5) { const p = iso(0.06, gg, 40); R(c, p[0] - 3, p[1] - 9, 7, 9, INK); R(c, p[0] - 2, p[1] - 8, 5, 8, '#c8a060'); }
    { const p = iso(0, 1.1, 52); disc(c, p[0], p[1], 7, 7, '#3a2014'); disc(c, p[0], p[1], 5, 5, '#f4ead0'); }
    // ---- hall side of the left wall: window (view painted live), poster, entrance ----
    if (IL.WIN) wL(c, IL.WIN[0] - 0.1, IL.WIN[1] + 0.1, IL.WIN[2] - 3, IL.WIN[3] + 3, '#4a2a16');
    const [po0, po1] = IL.POSTER || [2.4, 3.1];
    wL(c, po0, po1, 23, 53, '#2a160c'); wL(c, po0 + 0.05, po1 - 0.05, 24, 52, '#f4ead0'); wL(c, po0 + 0.05, po1 - 0.05, 44, 52, '#c8322a');
    { const p = iso(0, (po0 + po1) / 2, 34); vtext(c, '사케', p[0] + 0.5, p[1] - 10, '#3a1a0a', 10, null, 10); }
    const [e0, e1] = IL.ENT;
    wL(c, e0 - 0.15, e1 + 0.15, 0, 49, '#2a160c');
    wL(c, e0, e1, 0, 46, '#101222');
    for (let k = 0; k < 14; k++) { const p = iso(0, e0 + 0.05 + r() * (e1 - e0 - 0.1), 3 + r() * 40); R(c, p[0], p[1], 1, 3, '#3a4468'); }
    for (let i = 0; i < 3; i++) { const g0 = e0 + i * (e1 - e0) / 3, g1 = g0 + (e1 - e0) / 3 - 0.03; wL(c, g0, g1, 26, 46, '#141a40'); wL(c, g0 + 0.03, g1 - 0.03, 27, 46, '#22306a'); wL(c, g0 + 0.03, g1 - 0.03, 43, 46, '#30418a'); }
    { const p = iso(0, (e0 + e1) / 2, 36); ptext(c, '오뎅', p[0], p[1] - 4, '#f4ecd8', 8, 'center'); }
    flr(c, -0.06, e0 - 0.05, 0.12, e1 + 0.05, 0, '#8a8478');
    flr(c, 0.3, e0 + 0.05, 1.3, e1 - 0.05, 0, '#3a2a20'); flr(c, 0.35, e0 + 0.1, 1.25, e1 - 0.1, 0, '#5a4a6a');
    for (let gg = e0 + 0.25; gg < e1 - 0.1; gg += 0.18) isoLine(c, iso(0.35, gg), iso(1.25, gg), '#4a3a5a');
    const ub = e1 + 0.6 < GY ? e1 + 0.2 : e0 - 0.55;
    box(c, 0.15, ub, 0.5, ub + 0.35, 0, 12, '#3a2014', '#5e3820', '#4a2a16');
    { const p = iso(0.32, ub + 0.17, 12); line(c, p[0] - 2, p[1], p[0] - 3, p[1] - 12, '#2a4a8a'); line(c, p[0], p[1], p[0] + 1, p[1] - 14, '#a83a2a'); line(c, p[0] + 2, p[1], p[0] + 4, p[1] - 10, '#2a6a4a'); }
    // plant in the front-right corner
    { const pg = GX - 0.45, pq = GY - 0.4, p = iso(pg, pq); box(c, pg - 0.22, pq - 0.22, pg + 0.22, pq + 0.22, 0, 11, '#3a2a1a', '#8a5530', '#6a3e22');
      disc(c, p[0], p[1] - 20, 9, 8, '#2e5a2e'); disc(c, p[0] - 3, p[1] - 24, 5, 5, '#3e7a3a'); disc(c, p[0] + 4, p[1] - 18, 4, 4, '#3e7a3a'); disc(c, p[0] + 1, p[1] - 27, 3, 3, '#5a9a4a'); }
  }

  function paintCounter(c, o) {
    const { CH } = IL, [px0, py0, px1, py1] = IL.POT, [c0, c1, d0, d1] = IL.CTR;
    c.fillStyle = 'rgba(30,12,4,0.32)'; poly(c, quadF(c0, d1, c1, d1 + 0.3, 0)); poly(c, quadF(c1, d0, c1 + 0.3, d1 + 0.3, 0));
    box(c, c0, d0, c1, d1, 0, CH, '#c8884a', '#7a4626', '#5a321a');
    for (let gg = c0 + 0.9; gg < c1; gg += 0.92) { isoLine(c, iso(gg, d1, 1), iso(gg, d1, CH - 3), '#5a321a'); isoLine(c, iso(gg + 0.06, d1, 1), iso(gg + 0.06, d1, CH - 3), '#8a5430'); }
    isoLine(c, iso(c0, d1, CH - 2), iso(c1, d1, CH - 2), '#3a1e10');
    isoLine(c, iso(c0, d1, CH), iso(c1, d1, CH), '#e0a462'); isoLine(c, iso(c1, d0, CH), iso(c1, d1, CH), '#d09050');
    for (let gg = 3.2; gg < c1 - 0.6; gg += 1.3) isoLine(c, iso(gg, 2.45, CH), iso(gg + 0.5, 2.45, CH), '#b67a40');
    // the chef's copper oden pot, sunk into the counter
    box(c, px0, py0, px1, py1, CH, CH + 5, '#a86c28', '#b8642e', '#8a4a22');
    isoLine(c, iso(px0, py1, CH + 5), iso(px1, py1, CH + 5), '#f0a060'); isoLine(c, iso(px1, py0, CH + 5), iso(px1, py1, CH + 5), '#d88a4a');
    // sake warmer (kanzake machine) with a tokkuri inside
    box(c, 2.95, 2.2, 3.45, 2.6, CH, CH + 11, '#c8ccd6', '#9a9eaa', '#7a7e8a');
    { const p = iso(3.2, 2.4, CH + 11); R(c, p[0] - 2, p[1] - 5, 4, 5, INK); R(c, p[0] - 1, p[1] - 4, 2, 4, '#f2eee2'); const q = iso(3.45, 2.6, CH + 6); R(c, q[0] - 3, q[1] - 2, 2, 2, '#f04a3a'); }
    // karashi + soy
    let p = iso(3.0, 2.8, CH); R(c, p[0] - 2, p[1] - 10, 5, 10, INK); R(c, p[0] - 1, p[1] - 9, 3, 9, '#2a1410'); R(c, p[0] - 1, p[1] - 9, 3, 2, '#c82a2a');
    p = iso(3.45, 2.85, CH); R(c, p[0] - 3, p[1] - 7, 7, 7, INK); R(c, p[0] - 2, p[1] - 4, 5, 3, '#d0a010'); R(c, p[0] - 2, p[1] - 6, 5, 2, '#fff080');
    // every counter seat gets its own little cup of hot broth
    (o.seats || []).forEach(se => {
      if (se.type !== 'c') return;
      const g = se.gx - 0.15;
      box(c, g - 0.17, 2.56, g + 0.17, 2.86, CH, CH + 5, '#f2eee2', '#2c3c78', '#1e2a5a');
      flr(c, g - 0.12, 2.6, g + 0.12, 2.82, CH + 5, '#b8742e'); flr(c, g - 0.08, 2.63, g + 0.02, 2.72, CH + 5, '#d89a4a');
      isoLine(c, iso(g - 0.17, 2.86, CH + 3), iso(g + 0.17, 2.86, CH + 3), '#f2eee2');
    });
    // draft-beer server: tower with two taps + drip tray
    box(c, c1 - 1.2, 2.25, c1 - 0.6, 2.55, CH, CH + 2, '#8a8e9a', '#6a6e7a', '#4a4e5a');
    { const q = iso(c1 - 0.9, 2.35, CH + 2); R(c, q[0] - 1, q[1] - 14, 3, 14, '#c8ccd6'); R(c, q[0] - 4, q[1] - 15, 9, 3, '#b8bcc8'); R(c, q[0] - 4, q[1] - 21, 2, 6, '#2a2a30'); R(c, q[0] + 3, q[1] - 21, 2, 6, '#c8322a'); R(c, q[0] - 1, q[1] - 12, 3, 4, '#e8b030'); }
    // cash register
    box(c, c1 - 0.52, 2.2, c1 - 0.04, 2.65, CH, CH + 6, '#3a3e4a', '#2a2e3a', '#1e2230');
    { const q = iso(c1 - 0.28, 2.3, CH + 6); R(c, q[0] - 4, q[1] - 7, 8, 6, '#1e2230'); R(c, q[0] - 3, q[1] - 6, 6, 4, '#5ad0a0'); }
  }

  function paintPartition(c) { /* the kitchen sits behind the counter now — nothing in front */ }

  function table(c, cx, cy) {
    const { TH } = IL, x0 = cx - 0.9, x1 = cx + 0.9, y0 = cy - 0.5, y1 = cy + 0.5;
    c.fillStyle = 'rgba(30,12,4,0.3)'; poly(c, quadF(x0 + 0.1, y0 + 0.2, x1 + 0.25, y1 + 0.25, 0));
    [[x0 + 0.1, y1 - 0.1], [x1 - 0.1, y1 - 0.1], [x1 - 0.1, y0 + 0.1]].forEach(([a, b]) => { const p = iso(a, b); R(c, p[0] - 1, p[1] - TH, 3, TH, INK); R(c, p[0], p[1] - TH, 1, TH - 1, '#5a321a'); });
    box(c, x0, y0, x1, y1, TH - 3, TH, '#c08048', '#7a4626', '#5a321a');
    isoLine(c, iso(x0, y1, TH), iso(x1, y1, TH), '#e0a468'); isoLine(c, iso(x0, y0, TH), iso(x0, y1, TH), '#d0925a');
    const p = iso(cx, cy, TH); R(c, p[0] - 3, p[1] - 7, 6, 7, INK); R(c, p[0] - 2, p[1] - 6, 4, 2, '#ffffff'); R(c, p[0] - 2, p[1] - 4, 4, 3, '#e0d8c8'); R(c, p[0] - 2, p[1] - 6, 4, 1, '#c8322a');
  }
  // shop size levels — 0: small counter shop, 1: 가게 확장 (hall + longer counter), 2: 가게 확장 2
  const LV = [
    { GX: 9.6, GY: 4.7, cEnd: 8.8, ENT: [3.45, 4.55], WIN: null, POSTER: null },
    { GX: 11.2, GY: 7.5, cEnd: 10.35, ENT: [5.45, 6.65], WIN: [2.5, 4.2, 26, 50], POSTER: [4.45, 5.15] },
    { GX: 12.6, GY: 7.8, cEnd: 10.35, ENT: [5.75, 6.95], WIN: [2.5, 4.2, 26, 50], POSTER: [4.45, 5.15] },
  ];
  function setLayout(lv) {
    const L = LV[lv];
    Object.assign(IL, { LV: lv, GX: L.GX, GY: L.GY, ENT: L.ENT, WIN: L.WIN, POSTER: L.POSTER, CTR: [0.5, L.cEnd, 2.1, 2.95] });
    IL.OX = Math.round(240 - (IL.GX - IL.GY) * IL.HW / 2);
    IL.OY = Math.max(64, Math.round((326 - (IL.GX + IL.GY) * IL.HH) / 2));
  }
  setLayout(0);

  Object.assign(A, {
    R, disc, ellipseLine, line, glow, ptext, vtext, stext, svtext, num, numW, spr, SPR, iconURL, BLOB, chibi, bubble, dish, lantern,
    paintExteriorBG, paintInteriorBG, paintCounter, paintPartition, table, srand,
    IL, EX, XS, PUD, setLayout, iso: isoI, isoE, proj, fF, fX, polePainter, poly, flr, wR, wL, box, stool, isoLine, quadF,
    clearText() { TXT.clear(); },
  });
  window.ART = A;
})();
