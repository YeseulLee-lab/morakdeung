'use strict';
/* =========================================================
   UI — React (via htm, no build step) + WebAudio sfx
   ========================================================= */
(function () {
  const { useState, useEffect, useRef } = React;
  const html = htm.bind(React.createElement);
  const A = window.ART;
  const { ING, ING_LIST, RANKS, UPG } = window.ENGINE;
  const E = window.ENGINE.createEngine();
  window.ENG = E;

  // ---------------- sound ----------------
  const SND = (() => {
    let ac = null, master = null, rainG = null, on = true;
    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = on ? 0.6 : 0; master.connect(ac.destination);
        const len = ac.sampleRate * 2, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
        let l = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; l = (l + 0.03 * w) / 1.03; d[i] = l * 2.5 + w * 0.1; }
        const src = ac.createBufferSource(); src.buffer = b; src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1700;
        rainG = ac.createGain(); rainG.gain.value = 0;
        src.connect(f); f.connect(rainG); rainG.connect(master); src.start();
      } catch (e) { ac = null; }
    }
    function tone(fr, dur, type = 'square', vol = 0.06, slide = 0, delay = 0) {
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(fr, t); if (slide) o.frequency.linearRampToValueAtTime(fr + slide, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, freq) {
      const len = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(); src.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
      const g = ac.createGain(); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(master); src.start();
    }
    const FX = {
      pick: () => tone(880, 0.06, 'square', 0.045, 220), back: () => tone(520, 0.07, 'square', 0.04, -180),
      coin: () => { tone(988, 0.07, 'square', 0.05); tone(1319, 0.16, 'square', 0.05, 0, 0.07); },
      serve: () => { tone(523, 0.08, 'triangle', 0.1); tone(659, 0.08, 'triangle', 0.1, 0, 0.08); tone(784, 0.14, 'triangle', 0.1, 0, 0.16); },
      bad: () => tone(180, 0.22, 'sawtooth', 0.04, -60),
      buy: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'square', 0.045, 0, i * 0.07)),
      jingle: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.05, 0, i * 0.11)),
      zoom: () => tone(240, 0.28, 'triangle', 0.08, 520), click: () => tone(1200, 0.03, 'square', 0.03),
      door: () => noise(0.3, 0.12, 1100), ding: () => tone(1568, 0.14, 'sine', 0.05), pour: () => noise(0.45, 0.1, 600),
    };
    return {
      init,
      play: k => { if (ac && on && FX[k]) try { FX[k](); } catch (e) { /* ignore */ } },
      setRain: v => { if (rainG) rainG.gain.setTargetAtTime(v, ac.currentTime, 0.4); },
      toggle: () => { on = !on; if (master) master.gain.value = on ? 0.6 : 0; return on; },
    };
  })();
  E.on('sfx', k => SND.play(k));

  // ---------------- helpers ----------------
  const px = n => `calc(var(--u) * ${n})`;
  const box = (x, y, w, h) => ({ left: px(x), top: px(y), width: w != null ? px(w) : undefined, height: h != null ? px(h) : undefined });
  const yen = n => '¥' + Math.round(n).toLocaleString();
  const Icon = ({ id, size = 12 }) => html`<img className="pxi" src=${A.iconURL(id)} alt="" style=${{ width: px(size), height: px(size) }} />`;
  function Stars({ v }) {
    const out = [];
    for (let i = 0; i < 5; i++) out.push(html`<i key=${i} className=${v >= i + 0.75 ? 'on' : v >= i + 0.25 ? 'half' : ''}>★</i>`);
    return html`<span className="stars">${out}</span>`;
  }

  // ---------------- HUD ----------------
  function HUD({ openShop, bump, sound, toggleSound }) {
    const P = E.P, s = E.s;
    const mref = useRef(P.money);
    mref.current += (P.money - mref.current) * 0.4; if (Math.abs(P.money - mref.current) < 1) mref.current = P.money;
    const mins = 18 * 60 + Math.floor(s.clock);
    const hh = String(Math.floor(mins / 60) % 24).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
    const inside = s.scene !== 'exterior';
    const busy = !!s.trans || !!s.demo;
    const [ask, setAsk] = useState(false);
    useEffect(() => { if (!ask) return; const tm = setTimeout(() => setAsk(false), 3000); return () => clearTimeout(tm); }, [ask]);
    const shut = s.closing || s.closed;
    return html`<div className="hud">
      <div className="plate"><b>모락등</b><small>${RANKS[P.rank].name}</small></div>
      <div className=${'money' + (bump ? ' bump' : '')} key=${'m' + bump}><${Icon} id="coin" size=${10} /><span>${yen(mref.current)}</span></div>
      <div className="meter"><label>인기</label><div className="bar"><i style=${{ width: Math.round(P.pop) + '%' }}></i></div></div>
      <div className="meter"><label>평판</label><${Stars} v=${P.rep} /></div>
      <div className="clock"><small>${P.day}일째 밤</small><b>${hh}:${mm}</b></div>
      <div className="hud-btns">
        <button className="btn small" disabled=${busy} onClick=${() => (inside ? E.exitShop() : E.enterShop())}>${inside ? '밖으로' : '가게로'}</button>
        <button className="btn small gold" disabled=${!!s.demo} onClick=${openShop}>장부</button>
        <button className=${'btn small' + (ask ? ' danger' : '')} disabled=${busy || shut} onClick=${() => { if (ask) { setAsk(false); E.closeShop(); } else setAsk(true); }}>${shut ? '마감 중' : ask ? '정말 닫을까요?' : '영업 종료'}</button>
        <button className="btn small ghost" disabled=${!!s.demo} onClick=${() => E.startDemo()}>데모</button>
        <button className="btn small ghost icon" aria-label="소리 켜기/끄기" onClick=${toggleSound}>${sound ? '♪' : '×'}</button>
      </div>
    </div>`;
  }

  // ---------------- order / pot view ----------------
  function OrderUI() {
    const s = E.s, P = E.P, o = s.order || { bowl: [], karashi: false, sake: false };
    const c = E.orderCustomer();
    const L = E.potLayout();
    const got = {}; o.bowl.forEach(id => (got[id] = (got[id] || 0) + 1));
    const plan = E.restockPlan();
    const small = L.cells.length === 12;
    let ticket;
    if (c) {
      const need = c.order.items;
      const extras = Object.keys(got).filter(id => !need[id]);
      const pr = Math.max(0, c.pat / c.patMax);
      const est = o.bowl.reduce((a, id) => a + ING[id].price, 0) + (o.sake ? 300 : 0);
      ticket = html`
        <div className="tk-who"><span>${c.look.name}</span><small>${c.seat.type === 'c' ? '카운터' : '테이블'}</small></div>
        <ul className="tk-list">
          ${Object.entries(need).map(([id, q]) => {
            const g = got[id] || 0;
            return html`<li key=${id} className=${g === q ? 'ok' : g > q ? 'over' : ''}><${Icon} id=${id} size=${10} /><span>${ING[id].name}</span><b>${g}/${q}</b></li>`;
          })}
          ${c.order.karashi ? html`<li className=${o.karashi ? 'ok' : ''}><${Icon} id="karashi" size=${10} /><span>겨자 듬뿍</span><b>${o.karashi ? '완' : '−'}</b></li>` : null}
          ${c.order.sake ? html`<li className=${o.sake ? 'ok' : ''}><${Icon} id="sake" size=${10} /><span>데운 사케</span><b>${o.sake ? '완' : '−'}</b></li>` : null}
        </ul>
        ${extras.length ? html`<div className="tk-extra">주문 외: ${extras.map(id => ING[id].name).join(', ')}</div>` : null}
        <div className="tk-pat"><label>대기 시간</label><div className="bar"><i className=${pr < 0.3 ? 'low' : pr < 0.55 ? 'mid' : ''} style=${{ width: pr * 100 + '%' }}></i></div></div>
        <div className="tk-sum"><span>계산</span><b>${yen(est)}</b></div>`;
    } else {
      ticket = html`<p className="tk-note">냄비 재고를 확인하고 재료를 준비할 수 있어요.<br />끓이는 데 시간이 조금 걸려요.</p>`;
    }
    return html`<${React.Fragment}>
      <div className="ticket" style=${box(6, 28, 114, 236)}>
        <div className="tk-head">${c ? '주문서' : '재료 준비'}</div>
        ${ticket}
        <button className="btn small tk-restock" disabled=${!plan.plan.length} onClick=${() => E.restock()}>${plan.plan.length ? `모두 준비 ${yen(plan.cost)}` : '냄비가 가득'}</button>
      </div>
      ${L.cells.map(cell => {
        if (!cell.id) return html`<div key=${cell.i} className="cell-label vacant" style=${box(cell.x + 3, cell.y + cell.h / 2 - 5, cell.w - 6)}>빈 칸</div>`;
        const n = P.stock[cell.id] || 0, sim = s.simmer[cell.id];
        return html`<div key=${cell.i} className=${'cell-label' + (n === 0 && !sim ? ' empty' : '') + (small ? ' sm' : '')} style=${box(cell.x + 3, cell.y + cell.h - (small ? 13 : 15), cell.w - 6)}>
          <span className="nm">${ING[cell.id].name}</span>
          <span className="ct">${sim ? '끓는 중' : n === 0 ? '품절' : '×' + n}</span>
          ${!sim && n < E.stockMax() ? html`<button className="mini" title=${'준비 ' + yen(E.restockPlan(cell.id).cost)} onClick=${() => E.restock(cell.id)}>준비</button>` : null}
        </div>`;
      })}
      <div className="pick-label" style=${box(380, 52, 88)}>접시 <small>(클릭하면 빼기)</small></div>
      <div className="pick-label" style=${box(376, 164, 40)}>겨자</div>
      ${P.up.sake ? html`<div className="pick-label" style=${box(432, 164, 40)}>사케</div>` : null}
      <div className="actions" style=${box(372, 184, 104, 80)}>
        <button className="btn primary big" data-demo="serve" disabled=${!c || !o.bowl.length} onClick=${() => E.serve()}>내놓기</button>
        <div className="row">
          <button className="btn small" disabled=${!o.bowl.length} onClick=${() => E.clearBowl()}>다시 담기</button>
          <button className="btn small ghost" onClick=${() => E.closeOrder()}>돌아가기</button>
        </div>
      </div>
    </${React.Fragment}>`;
  }

  // ---------------- shop / ledger ----------------
  function Shop({ tab, setTab, close }) {
    const P = E.P;
    const tabs = [['up', '설비'], ['menu', '메뉴'], ['info', '가게 현황']];
    let body;
    if (tab === 'up') {
      body = html`<div className="cards">${UPG.map(u => {
        const st = E.upgradeState(u);
        const note = st === 'rank' ? `「${RANKS[u.rank].name}」 달성 시 해금` : st === 'req' ? `필요: ${E.UPGM[u.req].name}` : '';
        return html`<div key=${u.id} className=${'card ' + st}>
          <${Icon} id=${u.icon} size=${18} />
          <div className="card-main"><b>${u.name}</b><p>${u.desc}</p>${note ? html`<em>${note}</em>` : null}</div>
          ${st === 'owned' ? html`<span className="badge">설치됨</span>` :
            html`<button className="btn small" data-demo=${'buy-' + u.id} disabled=${st !== 'ok'} onClick=${() => E.buyUpgrade(u.id)}>${yen(u.price)}</button>`}
        </div>`;
      })}</div>`;
    } else if (tab === 'menu') {
      body = html`<div>
        <p className="m-note">냄비 칸 ${P.menu.length} / ${E.slots()} · 준비 최대 ${E.stockMax()}개</p>
        <div className="cards">${ING_LIST.map(i => {
          const st = E.menuState(i);
          const note = st === 'rank' ? `「${RANKS[i.rank].name}」 달성 시 해금` : st === 'slots' ? '냄비 칸이 부족해요' : '';
          return html`<div key=${i.id} className=${'card ' + st}>
            <${Icon} id=${i.id} size=${18} />
            <div className="card-main"><b>${i.name}</b><p>1접시 ${yen(i.price)} · 재료비 ${yen(i.cost)}</p>${note ? html`<em>${note}</em>` : null}</div>
            ${st === 'owned' ? html`<span className="badge">판매 중</span>` :
              html`<button className="btn small" disabled=${st !== 'ok'} onClick=${() => E.devMenu(i.id)}>개발 ${yen(i.dev)}</button>`}
          </div>`;
        })}</div></div>`;
    } else {
      const nx = RANKS[P.rank + 1];
      body = html`<div className="info">
        <ol className="ranks">${RANKS.map((r, i) => html`<li key=${i} className=${i === P.rank ? 'now' : i < P.rank ? 'done' : ''}><span>${i + 1}</span>${r.name}</li>`)}</ol>
        <div className="next">
          ${nx ? html`
            <h3>다음 등급 「${nx.name}」까지</h3>
            <div className="prog"><label>누적 매출</label><div className="bar"><i style=${{ width: Math.min(100, (P.total / nx.sales) * 100) + '%' }}></i></div><b>${yen(P.total)} / ${yen(nx.sales)}</b></div>
            <div className="prog"><label>평판</label><div className="bar"><i style=${{ width: Math.min(100, (P.rep / nx.rep) * 100) + '%' }}></i></div><b>${P.rep.toFixed(1)} / ${nx.rep.toFixed(1)}</b></div>`
            : html`<h3>최고 등급 달성! 전설의 맛입니다.</h3>`}
          <dl>
            <dt>내놓은 접시</dt><dd>${P.served.toLocaleString()}</dd>
            <dt>하룻밤 최고 매출</dt><dd>${yen(P.best)}</dd>
            <dt>좌석 수</dt><dd>${E.seats.length}석</dd>
            <dt>냄비</dt><dd>${['사각 냄비', '큰 냄비', '특대 구리 냄비'][E.potLv()]}</dd>
          </dl>
        </div>
      </div>`;
    }
    return html`<div className="modal-back" onMouseDown=${e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal shop" role="dialog" aria-label="장부">
        <header>
          <h2>장부</h2>
          <nav>${tabs.map(([k, l]) => html`<button key=${k} className=${'tab' + (tab === k ? ' on' : '')} onClick=${() => setTab(k)}>${l}</button>`)}</nav>
          <div className="m-money"><${Icon} id="coin" size=${9} />${yen(P.money)}</div>
          <button className="btn small ghost x" aria-label="닫기" onClick=${close}>닫기</button>
        </header>
        <div className="m-body">${body}</div>
      </div>
    </div>`;
  }

  function Summary({ d, next }) {
    return html`<div className="modal-back">
      <div className="modal summary" role="dialog">
        <div className="sum-noren">오늘 영업 끝</div>
        <h2>${d.day}일째 밤 매출 장부</h2>
        ${d.early ? html`<p className="early">오늘은 일찍 문을 닫았어요</p>` : null}
        <dl>
          <dt>방문 손님</dt><dd>${d.cust}명</dd>
          <dt>판매</dt><dd>${d.n}접시</dd>
          <dt>화나서 떠난 손님</dt><dd className=${d.angry ? 'bad' : ''}>${d.angry}명</dd>
          <dt>평균 만족도</dt><dd><${Stars} v=${d.avg} /></dd>
          <dt className="total">매출</dt><dd className="total">${yen(d.sales)}</dd>
        </dl>
        <button className="btn primary big" onClick=${next}>다음 밤으로</button>
      </div>
    </div>`;
  }

  function Title({ start, cont, demo }) {
    const has = E.hasSave();
    return html`<div className="title">
      <div className="kanban">
        <div className="kb-top">오뎅</div>
        <h1>모락등</h1>
        <div className="kb-sub">모락모락 등불</div>
      </div>
      <div className="title-menu">
        <p className="tag">비 오는 밤의 오뎅집 경영</p>
        <button className="btn primary big" onClick=${start}>${has ? '처음부터' : '가게 문 열기'}</button>
        ${has ? html`<button className="btn big gold" onClick=${cont}>이어하기</button>` : null}
        <button className="btn ghost" onClick=${demo}>데모 보기 (30초)</button>
        <p className="foot">마우스로 플레이해요. 잠시 가만히 있으면 데모가 시작됩니다.</p>
      </div>
    </div>`;
  }

  function Hint() {
    const s = E.s, P = E.P;
    if (s.trans || s.demo) return null;
    let msg = '';
    if (s.scene === 'exterior') msg = '가게를 클릭해서 안으로 들어가요';
    else if (s.scene === 'interior') {
      const ordering = s.customers.filter(c => c.st === 'order').length;
      const out = P.menu.filter(id => !(P.stock[id] > 0) && !s.simmer[id]).map(id => ING[id].name);
      if (out.length) msg = `품절: ${out.join(', ')} — 오뎅 냄비를 클릭해서 재료 준비`;
      else if (ordering) msg = `주문 대기 ${ordering}명 — 말풍선을 클릭`;
      else msg = '손님을 기다리는 중… 오뎅 냄비를 클릭하면 재고 확인';
    } else if (s.scene === 'pot' && s.order && s.order.cid) msg = '냄비 속 재료를 클릭해서 접시에 담아요';
    if (s.closing && !s.closed && s.scene !== 'pot') msg = s.customers.length ? `영업 종료 중 — 남은 손님 ${s.customers.length}명을 마무리하면 오늘 장부가 나와요` : '문을 닫는 중…';
    if (!msg) return null;
    return html`<div className="hint">${msg}</div>`;
  }

  // ---------------- App ----------------
  function App() {
    const [, setTick] = useState(0);
    const canvasRef = useRef(null), cursorRef = useRef(null);
    const [u, setU] = useState(2);
    const [shop, setShop] = useState(null);
    const shopRef = useRef(null); shopRef.current = shop;
    const [summary, setSummary] = useState(null);
    const [banner, setBanner] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [sound, setSound] = useState(true);
    const [bump, setBump] = useState(0);

    useEffect(() => {
      E.attach(canvasRef.current, cursorRef.current);
      const offs = [
        E.on('toast', t => { const id = Math.random(); setToasts(a => [...a.slice(-2), { ...t, id }]); setTimeout(() => setToasts(a => a.filter(x => x.id !== id)), 2600); }),
        E.on('shop', v => setShop(v)),
        E.on('summary', v => setSummary(v)),
        E.on('rankup', v => { setBanner(v); setTimeout(() => setBanner(null), 3800); }),
        E.on('coin', () => setBump(b => b + 1)),
        E.on('demo', v => { if (!v) setSummary(null); }),
      ];
      const rs = () => setU(Math.max(0.5, Math.min(window.innerWidth / 480, window.innerHeight / 270)));
      rs(); window.addEventListener('resize', rs);
      const iv = setInterval(() => setTick(t => t + 1), 100);
      const key = e => {
        if (e.key !== 'Escape') return;
        if (E.s.demo) E.stopDemo();
        else if (shopRef.current) setShop(null);
        else if (E.s.scene === 'pot') E.closeOrder();
      };
      window.addEventListener('keydown', key);
      const unlock = () => SND.init();
      window.addEventListener('pointerdown', unlock);
      if (document.fonts && document.fonts.load) {
        Promise.all(['12px "Galmuri11"', '10px "Galmuri9"', '8px "Galmuri7"'].map(f => document.fonts.load(f, '가'))).then(() => { A.fontReady = true; A.clearText(); E.markDirty(); }).catch(() => {});
      }
      bootFromHash();
      return () => { offs.forEach(f => f()); clearInterval(iv); window.removeEventListener('resize', rs); window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', unlock); };
    }, []);

    const s = E.s;
    const screen = s.scene === 'title' ? 'title' : 'game';
    const demo = s.demo;
    SND.setRain(s.scene === 'exterior' || s.scene === 'title' ? 0.22 : 0.07);

    useEffect(() => {
      if (screen !== 'title' || demo) return;
      let t = setTimeout(() => E.startDemo(), 16000);
      const reset = () => { clearTimeout(t); t = setTimeout(() => E.startDemo(), 16000); };
      window.addEventListener('mousemove', reset); window.addEventListener('mousedown', reset);
      return () => { clearTimeout(t); window.removeEventListener('mousemove', reset); window.removeEventListener('mousedown', reset); };
    }, [screen, !!demo]);

    const toC = e => { const r = e.currentTarget.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 480, ((e.clientY - r.top) / r.height) * 270]; };

    return html`<div className="stage" style=${{ width: 480 * u + 'px', height: 270 * u + 'px', '--u': u + 'px' }}>
      <canvas ref=${canvasRef} width="480" height="270"
        onMouseMove=${e => E.pointer(...toC(e))}
        onMouseDown=${e => { if (e.button === 0) E.click(...toC(e)); }}
        onMouseLeave=${() => E.pointer(-1, -1)}></canvas>
      ${screen === 'title' && !demo ? html`<${Title} start=${() => { SND.init(); E.newGame(); }} cont=${() => { SND.init(); E.loadGame(); }} demo=${() => { SND.init(); E.startDemo(); }} />` : null}
      ${screen === 'game' ? html`<${HUD} openShop=${() => setShop('up')} bump=${bump} sound=${sound} toggleSound=${() => setSound(SND.toggle())} />` : null}
      ${screen === 'game' && s.scene === 'pot' ? html`<${OrderUI} />` : null}
      ${screen === 'game' && !shop && !summary ? html`<${Hint} />` : null}
      ${shop ? html`<${Shop} tab=${shop} setTab=${setShop} close=${() => setShop(null)} />` : null}
      ${summary && !demo ? html`<${Summary} d=${summary} next=${() => { setSummary(null); E.nextNight(); }} />` : null}
      ${banner ? html`<div className="rankup" key=${banner.rank}><div className="ru-top">등급 상승!</div><div className="ru-name">${banner.name}</div>${banner.unl.length ? html`<div className="ru-unl">해금: ${banner.unl.join(', ')}</div>` : null}</div>` : null}
      <div className="toasts">${toasts.map(t => html`<div key=${t.id} className=${'toast ' + (t.kind || '')}>${t.text}</div>`)}</div>
      ${demo ? html`<div className="demo-layer" onMouseDown=${() => E.stopDemo()}>
        <div className="demo-badge"><i></i>DEMO</div>
        <div className="demo-prog"><i style=${{ width: Math.min(100, (demo.t / 30) * 100) + '%' }}></i></div>
        ${demo.cap ? html`<div className="demo-cap" key=${demo.cap}>${demo.cap}</div>` : null}
        <div className="demo-skip">클릭 / Esc로 종료</div>
      </div>` : null}
      <div ref=${cursorRef} className="vcursor" style=${{ display: 'none' }} aria-hidden="true">
        <svg viewBox="0 0 12 16" shape-rendering="crispEdges"><path d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v2h1v2H7v-2H6v-2H5v1H4v1H3v1H1v-1H0z" fill="#1a1012"/><path d="M1 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v1h1v2h1v1H7v-2H6v-2H5v1H4v1H3v1H2v1H1z" fill="#fff8e8"/></svg>
      </div>
    </div>`;
  }

  // test hooks: #t-in / #t-pot / #t-shop / #t-demo
  function bootFromHash() {
    const h = location.hash;
    if (!h.startsWith('#t-')) return;
    E.newGame();
    if (h.startsWith('#t-demo')) { E.startDemo(); const n = +h.split('-')[2] || 0; if (n) E.ff(n); return; }
    E.P.money = 5000; E.P.up.table1 = true; E.P.up.sake = true; E.P.rank = 2; E.P.menu.push('hanpen', 'gyusuji'); E.P.stock.hanpen = 4; E.P.stock.gyusuji = 0;
    E.s.scene = 'interior';
    E.rebuild();
    const ens = window.ENG;
    ens.save();
    setTimeout(() => {
      const seatsWanted = ['c0', 'c1', 'c3', 'tAu0', 'tAd1'];
      seatsWanted.forEach((id, i) => {
        const se = ens.seats.find(x => x.id === id); if (!se) return;
        const c = ens.spawn({ prefer: [id] }); if (!c) return;
        c.x = se.x; c.y = se.y; c.pi = c.path.length; c.st = i === 4 ? 'eat' : 'order'; c.dir = se.dir; c.pat = c.patMax * (i === 1 ? 0.2 : 0.8);
        if (i === 4) { c.bowl = { items: ['daikon', 'tamago'], karashi: true }; c.sat = 0.9; }
      });
      if (h === '#t-pot') { const c = ens.s.customers.find(c => c.st === 'order'); ens.openOrder(c); ens.ff(1).then(() => { ens.pick('daikon'); ens.pick('tamago'); ens.toggleKarashi(); ens.ff(0.5); }); }
      if (h === '#t-ext') { ens.P.up.lantern1 = true; ens.P.up.lantern2 = true; ens.P.up.sign = true; ens.P.rank = 2; ens.s.scene = 'exterior'; ens.rebuild(); }
    }, 150);
    if (h === '#t-shop') setTimeout(() => ens.emit('shop', 'up'), 300);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})();
