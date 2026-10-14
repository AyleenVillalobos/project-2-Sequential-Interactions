/* Step 1 — Trace the sneak route.
   Ported from studies/01-trace-the-sneak-route. Gestures, thresholds, sounds and failure
   behaviour are unchanged. Adaptations: the mouse already carries the letter overhead, the
   goal is an exit hole top-right (it glows as the route nears, as the letter did), the
   finale is the mouse diving into that hole, and the floor uses the shared light palette. */
Seq.scenes.route = (root, done) => {
  root.classList.add('sc-route');
  const HOLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
      <rect x="0" y="92" width="160" height="28" fill="#c6c6c6"/>
      <line x1="0" y1="92" x2="160" y2="92" stroke="#9a9a9a" stroke-width="2"/>
      <path d="M45 120 V72 A35 35 0 0 1 115 72 V120 Z" fill="#2e2e2e" stroke="#8a8a8a" stroke-width="4" stroke-linejoin="round"/>
    </svg>`;
  root.innerHTML = `
  <div class="actor hole start">${HOLE_SVG}</div>
  <div class="actor glow"></div>
  <div class="actor exit"><div class="pulse">${HOLE_SVG}</div></div>
  <canvas></canvas>
  <div class="actor dog">
    <div class="flip"><div class="snortwrap"><div class="breathe">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 145" class="dogsvg">
        <path d="M30 92 C 10 82, 12 60, 26 62" fill="none" stroke="#6a6a6a" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="100" cy="97" rx="75" ry="33" fill="#7a7a7a" stroke="#555" stroke-width="2"/>
        <ellipse cx="176" cy="124" rx="20" ry="9" fill="#8a8a8a" stroke="#555" stroke-width="2"/>
        <circle cx="170" cy="76" r="31" fill="#888" stroke="#555" stroke-width="2"/>
        <ellipse cx="198" cy="87" rx="17" ry="12" fill="#9a9a9a" stroke="#555" stroke-width="2"/>
        <circle cx="212" cy="82" r="5" fill="#222"/>
        <g class="dear"><path d="M154 54 C 138 60, 138 97, 152 102 C 161 86, 163 68, 166 54 Z" fill="#5e5e5e"/></g>
        <path d="M146 96 Q 160 108 178 104" fill="none" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
        <g><circle cx="174" cy="71" r="6" fill="#f2f2f2"/><circle cx="176" cy="71" r="3" fill="#222"/></g>
        <circle class="puff p1" cx="218" cy="84" r="4" fill="#bdbdbd"/>
        <circle class="puff p2" cx="216" cy="90" r="3" fill="#bdbdbd"/>
      </svg>
    </div></div></div>
  </div>
  <div class="actor mouse" style="z-index:5">
    <div class="mbody idle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 165">
        <path d="M60 126 C 62 145, 88 140, 80 160" fill="none" stroke="#777" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="60" cy="88" rx="30" ry="42" fill="#9a9a9a" stroke="#666" stroke-width="2"/>
        <g class="ear earL"><circle cx="40" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/><circle cx="40" cy="34" r="7" fill="#cfcfcf"/></g>
        <g class="ear earR"><circle cx="80" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/><circle cx="80" cy="34" r="7" fill="#cfcfcf"/></g>
        <ellipse cx="60" cy="46" rx="20" ry="25" fill="#a8a8a8" stroke="#666" stroke-width="2"/>
        <ellipse cx="60" cy="42" rx="18" ry="6.5" fill="#3a3a3a"/>
        <circle cx="52" cy="42" r="2.6" fill="#f2f2f2"/>
        <circle cx="68" cy="42" r="2.6" fill="#f2f2f2"/>
        <g class="nosegrp">
          <circle cx="60" cy="21" r="4" fill="#2e2e2e"/>
          <path d="M56 26 L40 22 M56 28 L40 30 M64 26 L80 22 M64 28 L80 30" stroke="#555" stroke-width="1.2" stroke-linecap="round"/>
        </g>
        <g transform="translate(60 -2) scale(.56) translate(-80 -55)"><use href="#letterArt"/></g>
        <ellipse cx="31" cy="14" rx="6" ry="4" fill="#bdbdbd" stroke="#777" stroke-width="1"/>
        <ellipse cx="89" cy="14" rx="6" ry="4" fill="#bdbdbd" stroke="#777" stroke-width="1"/>
      </svg>
    </div>
  </div>`;

  const q = s => root.querySelector(s);
  const cv = q('canvas'), ctx = cv.getContext('2d');
  const el = { hole: q('.start'), dog: q('.dog'), flip: q('.flip'), glow: q('.glow'), exit: q('.exit'), mouse: q('.mouse'), mbody: q('.mbody'), snortwrap: q('.snortwrap'), dogsvg: q('.dogsvg'), exitsvg: q('.exit svg') };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------- audio + haptics (Study 01's synth, on the shared context) ---------- */
  const AU = Seq.audio, out = Seq.sceneOut(.8);
  const sfx = f => { try { if (AU.ac && out.get()) f(); } catch (e) {} };
  const vib = Seq.vib;
  function tone(f0, dur, vol, f1, type, delay) {
    const ac = AU.ac, t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.015, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(out.get()); o.start(t); o.stop(t + dur + .03);
  }
  function puff(dur, vol, type, f0, f1, qq, delay) {
    const ac = AU.ac, t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = AU.nbuf; s.playbackRate.value = .8 + Math.random() * .4;
    f.type = type; f.Q.value = qq || 1; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1 || f0, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out.get()); s.start(t, Math.random() * .4, dur + .05);
  }
  const S = {
    squeak: () => sfx(() => { tone(1900, .08, .04, 2700); tone(2300, .06, .025, 3000, 'sine', .07); }),
    step: () => sfx(() => puff(.05, .05 * (.7 + Math.random() * .6), 'lowpass', 900 + Math.random() * 300, 500, .7)),
    pat: () => sfx(() => puff(.03, .022, 'bandpass', 2400, 1800, 1.5)),
    warn: () => sfx(() => tone(120, .16, .04, 90, 'triangle')),
    snap: () => sfx(() => tone(740, .09, .04, 1100)),
    crumble: () => sfx(() => puff(.35, .06, 'lowpass', 3200, 250, .8)),
    scurry: () => sfx(() => { for (let i = 0; i < 7; i++) puff(.03, .045, 'bandpass', 2000, 1500, 1.2, i * .045); }),
    snort: () => sfx(() => { puff(.24, .08, 'bandpass', 600, 220, .9); tone(95, .2, .025, 70, 'sawtooth'); }),
    bark: () => sfx(() => { tone(260, .09, .06, 170, 'sawtooth'); tone(240, .1, .05, 150, 'sawtooth', .13); puff(.2, .05, 'lowpass', 900, 300, .8); }),
    hug: () => sfx(() => tone(300, .2, .03, 260)),
    chime: () => sfx(() => { tone(659, .35, .035, 0, 'sine', 0); tone(880, .35, .03, 0, 'sine', .1); tone(1318, .4, .022, 0, 'sine', .2); })
  };

  /* ---------- layout ---------- */
  let L = {}, dpr = 1, prints = [];
  const D = { x: 0, y: 0, tx: 0, ty: 0, v: 0, pause: 1, dir: 1, dirS: 1, phase: 0, lastAlert: 0 };
  function mpos(x, y) { el.mouse.style.transform = `translate(${x - L.mw / 2}px,${y - .545 * L.mh}px)`; }
  function layout() {
    const r = root.getBoundingClientRect(), W = r.width, H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const u = Math.min(W, H * .56), k = u / 390;
    const holeW = u * .46, holeH = holeW * .75, archW = holeW * 70 / 160;
    const mw = archW * 1.12, mh = mw * 165 / 120;
    const dw = u * .46, dh = dw * 145 / 230;
    L = { W, H, u, k, holeW, holeH, archW, mw, mh, dw, dh, cx0: holeW / 2 };
    L.peek = { x: L.cx0, y: H - .075 * mh };
    L.P0 = { x: L.cx0, y: H - .56 * mh };
    L.rx = dw / 2 + u * .055; L.ry = dh / 2 + u * .055;
    // exit hole, top-right (where the study's letter sat)
    const cm = Math.max(10, u * .03), ex = W - cm - holeW, ey = Math.max(70, u * .2);
    L.exit = { x: ex, y: ey };
    L.goal = { cx: ex + holeW / 2, cy: ey + holeH * .72 };
    L.T = { x: L.goal.cx, y: ey + holeH - .455 * mh };
    L.band = { x0: Math.min(W / 2, L.rx + 4), x1: Math.max(W / 2, W - L.rx - 4), y0: Math.max(H * .36, ey + holeH + L.ry * .6), y1: H * .64 };
    if (L.band.y0 > L.band.y1 - 10) L.band.y0 = L.band.y1 - 10;
    const sz = (e, w, h, x, y) => { e.style.width = w + 'px'; e.style.height = h + 'px'; e.style.transform = `translate(${x}px,${y}px)`; };
    sz(el.hole, holeW, holeH, 0, H - holeH);
    sz(el.exit, holeW, holeH, ex, ey);
    el.dog.style.width = dw + 'px'; el.dog.style.height = dh + 'px';
    const gs = holeW * 1.7; sz(el.glow, gs, gs, L.goal.cx - gs / 2, L.goal.cy - gs / 2);
    el.mouse.style.width = mw + 'px'; el.mouse.style.height = mh + 'px';
    prints = [];
    const base = { x: L.cx0 + holeW * .26, y: H - holeH * .98 };
    const dx = .5, dy = -.866, step = u * .062, side = u * .016;
    for (let i = 0; i < 5; i++) {
      const s = i % 2 ? 1 : -1;
      prints.push({ x: base.x + dx * i * step - dy * s * side, y: base.y + dy * i * step + dx * s * side, a: Math.atan2(dy, dx), r: u * .013, al: 1 - i * .13 });
    }
  }

  /* ---------- state ---------- */
  let st = 'play';               // play | fin | done | home
  let mode = 'hole';             // hole | out
  let route = [], sM = 0, walkEnabled = false, final = false;
  let dots = [], crumbs = [];
  let pressed = false, strokeActive = false, strokeStart = 0, pressCrouch = false;
  let warn = false, flare = 0, g = 0, gT = 0, printsA = 1, printsT = 1, crouchAmt = 0;
  let sp = 0, lastDot = null, lastRaw = null, lastT = 0, dist0 = 1, lastPat = 0, lastWarn = 0;
  let tw = [], timers = [], fin = null, wk = { phase: 0, step: 0, near: 1 };
  let emerged = false, reported = false;
  const FAIL = .9, CAUGHT = .8;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const tween = (dur, fn, dn) => tw.push({ t0: performance.now(), dur, fn, done: dn });
  const dogC = () => ({ x: D.x, y: D.y + L.dh * .05 });
  const dogD = p => { const c = dogC(); return Math.hypot((p.x - c.x) / L.rx, (p.y - c.y) / L.ry); };
  const inGoal = p => Math.abs(p.x - L.goal.cx) < L.archW / 2 + 14 && p.y > L.exit.y + L.holeH * .25 && p.y < L.exit.y + L.holeH + 14;
  const local = e => { const r = root.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const restart = (elm, cls) => { elm.classList.remove(cls); void elm.getBoundingClientRect(); elm.classList.add(cls); };
  const goalPt = () => ({ x: L.goal.cx, y: L.goal.cy });

  /* ---------- route helpers ---------- */
  const total = () => route.length ? route[route.length - 1].s : 0;
  function pushPt(x, y) {
    const n = route.length, s = n ? route[n - 1].s + Math.hypot(x - route[n - 1].x, y - route[n - 1].y) : 0;
    route.push({ x, y, s }); return s;
  }
  function posAt(s) {
    const n = route.length; if (!n) return { ...L.peek }; if (n === 1) return route[0];
    s = clamp(s, 0, total());
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (route[m].s <= s) lo = m; else hi = m; }
    const a = route[lo], b = route[hi], f = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
  }
  function smoothPos(s) {
    if (s >= total() - .5) return posAt(total());
    let x = 0, y = 0; for (const o of [-9, -4.5, 0, 4.5, 9]) { const p = posAt(s + o * L.k); x += p.x; y += p.y; }
    return { x: x / 5, y: y / 5 };
  }
  function addCrumb(d) { crumbs.push({ x: d.x, y: d.y, vx: (Math.random() - .5) * 70, vy: -25 + Math.random() * 30, t0: performance.now() + Math.random() * 280, r: d.r || 2.4 }); }
  function truncate(sCut, quiet) {
    sCut = Math.max(sCut, sM);
    const keep = []; let any = false;
    for (const d of dots) { if (d.s > sCut) { any = true; if (!quiet) addCrumb(d); } else keep.push(d); }
    dots = keep;
    const p = posAt(sCut);
    while (route.length && route[route.length - 1].s > sCut) route.pop();
    route.push({ x: p.x, y: p.y, s: sCut });
    lastDot = { x: p.x, y: p.y }; final = false;
    if (any && !quiet) S.crumble();
    if (!emerged && sM < 1 && total() < L.mh * .6 + 2) { route = []; dots = []; sM = 0; printsT = 1; }
  }
  function endPoint() { return route.length ? route[route.length - 1] : L.P0; }

  /* ---------- dog ---------- */
  function pickTarget() {
    const b = L.band; let tx, ty;
    if (Math.random() < .5) { const E = emerged || route.length ? endPoint() : L.P0, f = .25 + Math.random() * .45; tx = lerp(E.x, L.goal.cx, f); ty = lerp(E.y, L.goal.cy, f); }
    else { tx = lerp(b.x0, b.x1, Math.random()); ty = lerp(b.y0, b.y1, Math.random()); }
    D.tx = clamp(tx, b.x0, b.x1); D.ty = clamp(ty, b.y0, b.y1);
    if (Math.hypot(D.tx - D.x, D.ty - D.y) < L.u * .18) { D.tx = clamp(L.W - D.x, b.x0, b.x1); D.ty = lerp(b.y0, b.y1, Math.random()); }
  }
  function updateDog(dt) {
    const k = L.k;
    if (D.pause > 0) { D.pause -= dt; D.v = lerp(D.v, 0, Math.min(1, dt * 6)); }
    else {
      const dx = D.tx - D.x, dy = D.ty - D.y, d = Math.hypot(dx, dy);
      if (d < 6 * k) { D.pause = .4 + Math.random() * .9; pickTarget(); }
      else {
        D.v = lerp(D.v, 54 * k, Math.min(1, dt * 3));
        D.x += dx / d * D.v * dt; D.y += dy / d * D.v * dt;
        if (Math.abs(dx) > 5) D.dir = dx > 0 ? 1 : -1;
      }
    }
    D.phase += D.v * dt / (24 * k);
    D.dirS = lerp(D.dirS, D.dir, Math.min(1, dt * 7));
    const lift = Math.abs(Math.sin(Math.PI * D.phase)) * Math.min(1, D.v / (30 * k)), sway = Math.sin(Math.PI * D.phase) * 1.8 * Math.min(1, D.v / (30 * k));
    el.dog.style.transform = `translate(${D.x - L.dw / 2}px,${D.y - L.dh / 2}px)`;
    el.flip.style.transform = `scaleX(${D.dirS}) translateY(${-lift * 2.6 * k}px) rotate(${sway}deg)`;
  }
  function dogAlert(bark) {
    const now = performance.now(); if (now - D.lastAlert < 700) return; D.lastAlert = now;
    restart(el.snortwrap, 'snort'); bark ? S.bark() : S.snort(); vib(bark ? [20, 40, 20] : 14);
    D.pause = bark ? 1.3 : .9;
  }

  /* ---------- input ---------- */
  function onDown(e) {
    Seq.audioInit();
    if (st !== 'play' || final || pressed) return;
    const p = local(e);
    let ok;
    if (!route.length) ok = p.x < L.holeW + 18 && p.y > L.H - L.holeH - L.mh * .6;
    else ok = dist(p, endPoint()) < Math.max(L.mw * 1.1, 58 * L.k);
    if (!ok) return;
    if (!route.length) {
      pushPt(L.peek.x, L.peek.y); pushPt(L.P0.x, L.P0.y);
      dots = [{ x: L.P0.x, y: L.P0.y, s: total(), r: 2.4 }]; lastDot = { ...L.P0 }; printsT = 0; dist0 = Math.max(1, dist(L.P0, goalPt()));
    }
    strokeStart = total(); strokeActive = true; pressed = true; sp = 0; lastRaw = p; lastT = e.timeStamp;
    pressCrouch = mode === 'hole' || total() - sM < 2;
    if (pressCrouch) { S.squeak(); vib(10); } else S.pat();
    try { root.setPointerCapture(e.pointerId); } catch (_) {}
    addPoint(p); e.preventDefault();
  }
  function onMove(e) {
    if (!pressed) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) {
      const p = local(ev), dt = Math.max(1, ev.timeStamp - lastT);
      sp = lerp(sp, dist(p, lastRaw) / dt, .3); lastRaw = p; lastT = ev.timeStamp;
      addPoint(p);
    }
    e.preventDefault();
  }
  function onUp() {
    if (!pressed) return;
    pressed = false;
    if (strokeActive) {
      strokeActive = false;
      if (total() - strokeStart < 18) truncate(strokeStart, true);
      else walkEnabled = true;
    }
  }
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);

  function addPoint(p) {
    if (!strokeActive) return;
    gT = Math.pow(clamp(1 - dist(p, goalPt()) / dist0, 0, 1), 1.6);
    const last = route[route.length - 1], dx = p.x - last.x, dy = p.y - last.y, dd = Math.hypot(dx, dy);
    if (dd < 1.5) return;
    const n = Math.ceil(dd / 4);
    for (let i = 1; i <= n; i++) {
      const qq = { x: last.x + dx * i / n, y: last.y + dy * i / n };
      if (dogD(qq) < FAIL) { strokeFail(); return; }
      if (inGoal(qq)) { snap(); return; }
      pushPt(qq.x, qq.y); maybeDot(qq);
    }
  }
  function maybeDot(p) {
    const jag = dogD(p) < 1;
    const spacing = jag ? 5 : lerp(5, 17, clamp(sp / .9, 0, 1));
    if (dist(p, lastDot) < spacing) return;
    dots.push({ x: p.x, y: p.y, s: total(), r: 2.2 + Math.random() * .5, jx: (Math.random() - .5) * 11, jy: (Math.random() - .5) * 11 });
    lastDot = p;
    const now = performance.now(); if (now - lastPat > 110) { lastPat = now; S.pat(); }
  }
  function strokeFail() {
    strokeActive = false; truncate(strokeStart); dogAlert(false); vib([16, 40, 16]);
  }
  function snap() {
    strokeActive = false; gT = 1; walkEnabled = true;
    const last = route[route.length - 1], T = L.T, n = Math.max(1, Math.ceil(dist(last, T) / 5));
    for (let i = 1; i <= n; i++) { const x = lerp(last.x, T.x, i / n), y = lerp(last.y, T.y, i / n); pushPt(x, y); dots.push({ x, y, s: total(), r: 2.4, jx: 0, jy: 0 }); }
    final = true; restart(el.exitsvg, 'wiggle'); S.snap(); vib([10, 30, 10]);
  }

  /* ---------- mouse ---------- */
  function updateMouse(dt, now) {
    const k = L.k;
    const moving = walkEnabled && route.length > 1 && total() - sM > .5;
    if (moving) {
      const w = wk;
      const probe = smoothPos(sM);
      w.near = lerp(w.near, dogD(probe) < 1.35 ? .55 : 1, Math.min(1, dt * 6));
      w.phase += dt * 7 * w.near;
      const pulse = .3 + .7 * (.5 - .5 * Math.cos(2 * Math.PI * w.phase));
      const edge = Math.min(1, sM / (36 * k) + .25, (total() - sM) / (46 * k) + .25);
      sM = Math.min(total(), sM + 140 * k * w.near * pulse * edge * dt);
      const fl = Math.floor(w.phase); if (fl !== w.step) { w.step = fl; S.step(); }
      mode = 'out'; if (sM > L.mh * .3) emerged = true;
    }
    const pos = mode === 'hole' ? L.peek : smoothPos(sM);
    const scared = mode === 'out' && dogD(pos) < 1.25;
    const target = (pressed && pressCrouch) ? 1 : scared ? .65 : 0;
    crouchAmt = lerp(crouchAmt, target, Math.min(1, dt * 12));
    el.mouse.classList.toggle('crouch', target > .4);
    mpos(pos.x, pos.y);
    const holeIdle = mode === 'hole' && crouchAmt < .02;
    if (holeIdle) { if (!el.mbody.classList.contains('idle')) el.mbody.classList.add('idle'); el.mbody.style.transform = ''; return pos; }
    el.mbody.classList.remove('idle');
    let ty = 0, rot = 0, sx = 1, sy = 1;
    if (moving) {
      const w = wk, lift = Math.abs(Math.sin(Math.PI * w.phase)), sway = Math.sin(Math.PI * w.phase) * 2.6;
      const a = posAt(sM - 8 * k), b = posAt(sM + 8 * k), tx = (b.x - a.x) / (Math.hypot(b.x - a.x, b.y - a.y) || 1);
      ty = -lift * 2.6 * k; rot = sway + tx * 3; sx = 1.03 - .03 * lift; sy = .93 + .05 * lift;
    } else { const br = Math.sin(now / 1000 * 2.2); sy = .97 + .012 * br; sx = 1.01 - .006 * br; }
    ty += crouchAmt * 9; sx *= 1 + .08 * crouchAmt; sy *= 1 - .22 * crouchAmt;
    el.mbody.style.transform = `translateY(${ty}px) rotate(${rot}deg) scale(${sx},${sy})`;
    return pos;
  }

  /* ---------- rules that tie dog and mouse together ---------- */
  function dogRules() {
    if (st !== 'play') { warn = false; return; }
    const mp = mode === 'out' ? smoothPos(sM) : null;
    if (mp && dogD(mp) < CAUGHT) { caught(mp); return; }
    let minD = 9, cut = -1;
    for (let i = 0; i < route.length; i++) {
      const p = route[i]; if (p.s <= sM + 1) continue;
      const d = dogD(p); if (d < minD) minD = d;
      if (d < FAIL && cut < 0) { cut = p.s - 6 * L.k; break; }
    }
    if (cut >= 0) { strokeActive = false; truncate(cut); dogAlert(false); vib([16, 40, 16]); minD = 1.01; }
    const w = minD < 1 || (mp && dogD(mp) < 1);
    if (w && !warn) { const now = performance.now(); if (now - lastWarn > 600) { lastWarn = now; restart(el.dogsvg, 'twitch'); S.warn(); vib(8); } }
    warn = !!w;
  }
  function caught(from) {
    st = 'home'; warn = false; strokeActive = false; final = false;
    dots.forEach(addCrumb); dots = []; route = []; walkEnabled = false; S.crumble();
    dogAlert(true); D.pause = 1.4; gT = 0;
    el.mouse.classList.add('crouch'); S.scurry();
    const home = { x: L.peek.x, y: L.peek.y + L.mh * .95 }, from0 = { ...from }, dur = Math.max(380, dist(from0, home) / (520 * L.k) * 1000);
    tween(dur, p => {
      const e = p * p; mpos(lerp(from0.x, home.x, e), lerp(from0.y, home.y, e));
      el.mbody.style.transform = `translateY(${(1 - p) * 6}px) rotate(${Math.sin(p * 40) * 3}deg) scale(1.03,.92)`;
    }, () => {
      later(() => {
        el.mouse.classList.remove('crouch'); sM = 0; mode = 'hole'; emerged = false; wk.phase = 0;
        tween(650, p => mpos(L.peek.x, L.peek.y + (1 - easeOut(p)) * L.mh * .95), () => { st = 'play'; printsT = 1; });
      }, 700);
    });
  }

  /* ---------- finale: squash, then dive into the exit hole with the letter ---------- */
  function finStep(now) {
    const t = now - fin.t0, T = L.T;
    let msx = 1, msy = 1, dy = 0, sc = 1, op = 1;
    if (t < 450) { const e = ease(t / 450); msx = 1 + .16 * e; msy = 1 - .1 * e; }
    else {
      if (!fin.chimed) { fin.chimed = true; S.chime(); vib([12, 40, 12]); el.exit.classList.add('calm'); }
      const p = clamp((t - 450) / 650, 0, 1), e = p * p;
      sc = 1 - .92 * e; dy = -L.mh * .25 * e; op = 1 - clamp((p - .55) / .45, 0, 1);
      msx = lerp(1.16, 1, Math.min(1, p * 3)); msy = lerp(.9, 1.06, Math.min(1, p * 3));
      if (p >= 1 && !reported) { st = 'done'; reported = true; done(goalPt()); }
    }
    el.mouse.classList.remove('crouch');
    mpos(T.x, T.y + dy);
    el.mouse.style.opacity = op;
    el.mbody.style.transform = `scale(${msx * sc},${msy * sc})`;
  }

  /* ---------- reset (used on start and resize) ---------- */
  function reset() {
    timers.forEach(clearTimeout); timers = []; tw = []; fin = null;
    route = []; dots = []; crumbs = []; sM = 0; walkEnabled = false; final = false; emerged = false; mode = 'hole';
    pressed = false; strokeActive = false; warn = false; g = gT = 0; flare = 0; printsT = 1; crouchAmt = 0; wk = { phase: 0, step: 0, near: 1 };
    el.exit.classList.remove('calm'); el.exitsvg.classList.remove('wiggle');
    el.snortwrap.classList.remove('snort'); el.dogsvg.classList.remove('twitch');
    el.mouse.classList.remove('crouch'); el.mouse.style.opacity = 1; el.mbody.style.transform = ''; el.mbody.classList.add('idle');
    mpos(L.peek.x, L.peek.y);
    D.x = L.W * .5; D.y = (L.band.y0 + L.band.y1) / 2; D.pause = 1.2; D.v = 0; D.dir = 1; D.dirS = 1; pickTarget();
    st = 'play';
  }

  /* ---------- drawing (colours flipped for the light floor) ---------- */
  function paw(x, y, r, ang, al) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.fillStyle = `rgba(60,60,60,${al})`;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .95, r * .75, 0, 0, 7); ctx.fill();
    for (const [tx, ty] of [[-.95, -1.1], [0, -1.5], [.95, -1.1]]) { ctx.beginPath(); ctx.arc(tx * r, ty * r, r * .36, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, L.W, L.H);
    const c = dogC(), br = Math.sin(now / 1000 * 2 * Math.PI / 4), s = 1 + .012 * br;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(c.x, c.y, L.rx * s, L.ry * s, 0, 0, 7);
    ctx.fillStyle = `rgba(40,40,40,${.04 + .07 * flare})`; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = `rgba(60,60,60,${.22 + .07 * br + .45 * flare})`;
    ctx.shadowColor = 'rgba(60,60,60,.35)'; ctx.shadowBlur = 8; ctx.stroke();
    ctx.restore();
    if (printsA > .02) prints.forEach(p => paw(p.x, p.y, p.r, p.a, .32 * p.al * printsA));
    ctx.fillStyle = 'rgb(64,64,64)'; ctx.strokeStyle = 'rgb(40,40,40)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    let run = [];
    const flush = () => {
      if (run.length > 1) { ctx.beginPath(); run.forEach((d, i) => i ? ctx.lineTo(d.x + d.jx, d.y + d.jy) : ctx.moveTo(d.x + d.jx, d.y + d.jy)); ctx.stroke(); }
      run = [];
    };
    for (const d of dots) {
      if (d.s < sM + 2 && mode === 'out') { flush(); continue; }
      const a = mode === 'out' ? clamp((d.s - sM) / 14, 0, 1) : 1;
      if (dogD(d) < 1) { run.push(d); continue; }
      flush(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    flush();
    ctx.fillStyle = 'rgb(64,64,64)';
    crumbs = crumbs.filter(p => {
      const t = (now - p.t0) / 1000; if (t > .8) return false; if (t < 0) { ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); return true; }
      const a = 1 - t / .75; if (a <= 0) return false;
      ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x + p.vx * t, p.y + p.vy * t + 380 * t * t, p.r * (1 - .4 * t), 0, 7); ctx.fill(); ctx.globalAlpha = 1; return true;
    });
  }

  let tPrev = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - tPrev) / 1000); tPrev = now;
    tw = tw.filter(o => { const p = clamp((now - o.t0) / o.dur, 0, 1); o.fn(p); if (p >= 1) { o.done && o.done(); return false; } return true; });
    updateDog(dt);
    if (st === 'play') {
      updateMouse(dt, now); dogRules();
      if (final && st === 'play' && sM >= total() - .5 && walkEnabled) { st = 'fin'; fin = { t0: now, chimed: false }; S.hug(); vib(12); gT = 1; }
      if (!pressed && !strokeActive) gT = Math.pow(clamp(1 - dist(endPoint(), goalPt()) / Math.max(1, dist(L.P0, goalPt())), 0, 1), 1.6) * (route.length ? 1 : 0);
    } else if (st === 'fin') finStep(now);
    g = lerp(g, gT, Math.min(1, dt * 6));
    root.style.setProperty('--g', g.toFixed(3)); root.style.setProperty('--b', (1 + g * .06).toFixed(3));
    flare = warn ? 1 : Math.max(0, flare - dt * 1.6);
    printsA = lerp(printsA, printsT, Math.min(1, dt * 4));
    draw(now);
  }

  layout(); reset();
  let rt = 0;
  const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (st === 'fin' || st === 'done') return; layout(); reset(); }, 80); });
  ro.observe(root);

  return {
    entry: { x: L.peek.x, y: L.H - L.holeH * .45 },
    frame,
    destroy() { ro.disconnect(); clearTimeout(rt); timers.forEach(clearTimeout); out.close(); }
  };
};
