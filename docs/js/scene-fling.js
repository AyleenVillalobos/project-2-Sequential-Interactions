/* Step 3 — Fling the cheese to your love.
   Ported from studies/03-fling-the-cheese-to-your-love. The intro (mouse pops out of the hole,
   camera cuts to the kitty), walking, slingshot aim/prediction, physics, misses and the catch
   are unchanged. Adaptations: input and resize are scoped to this scene, the study's reset
   button is replaced by the sequence's, and a few seconds after the catch the scene reports
   that the sequence is finished (the hearts keep floating behind the "Play again" button). */
Seq.scenes.fling = (root, done) => {
  root.classList.add('sc-side');
  const NS = 'http://www.w3.org/2000/svg';
  root.innerHTML = `
  <svg class="scene-svg" xmlns="http://www.w3.org/2000/svg" aria-label="The mouse comes out of a hole with the love letter; far away, the kitty roams">
    <defs><clipPath id="flHoleClip"><path class="holeClipPath" d=""/></clipPath></defs>
    <g class="world">
      <g>
        <ellipse class="shMouse" cx="0" cy="0" rx="48" ry="7" fill="var(--shadow)"/>
        <ellipse class="shKitty" cx="0" cy="0" rx="66" ry="9" fill="var(--shadow)"/>
        <ellipse class="shLetter" cx="0" cy="0" rx="40" ry="6" fill="var(--shadow)"/>
      </g>
      <path class="hole" d="" fill="#3a3a3a" stroke="#8e8e8e" stroke-width="6" stroke-linejoin="round"/>
      <g class="arc"></g>
      <g class="mouseWrap"><g class="mouse">
        <g class="mBody">
          <path d="M60 126 C 62 145, 88 140, 80 160" fill="none" stroke="#777" stroke-width="4" stroke-linecap="round"/>
          <ellipse cx="60" cy="88" rx="30" ry="42" fill="#9a9a9a" stroke="#666" stroke-width="2"/>
          <g class="mHead">
            <circle cx="40" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/>
            <circle cx="40" cy="34" r="7" fill="#cfcfcf"/>
            <circle cx="80" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/>
            <circle cx="80" cy="34" r="7" fill="#cfcfcf"/>
            <ellipse cx="60" cy="46" rx="20" ry="25" fill="#a8a8a8" stroke="#666" stroke-width="2"/>
            <ellipse cx="60" cy="42" rx="18" ry="6.5" fill="#3a3a3a"/>
            <g class="mEyes"><circle cx="52" cy="42" r="2.6" fill="#f2f2f2"/><circle cx="68" cy="42" r="2.6" fill="#f2f2f2"/></g>
            <circle cx="60" cy="21" r="4" fill="#2e2e2e"/>
            <path d="M56 26 L40 22 M56 28 L40 30 M64 26 L80 22 M64 28 L80 30" stroke="#555" stroke-width="1.2" stroke-linecap="round"/>
          </g>
          <ellipse class="mPawL" cx="38" cy="70" rx="6" ry="4" fill="#bdbdbd"/>
          <ellipse class="mPawR" cx="82" cy="70" rx="6" ry="4" fill="#bdbdbd"/>
        </g>
      </g></g>
      <g class="kitty"><g class="kLean"><g class="kFlip"><g class="kBob"><g class="kSq">
        <g class="kTail"><path d="M108 142 C 136 136, 136 100, 120 94" fill="none" stroke="#9a9a9a" stroke-width="10" stroke-linecap="round"/></g>
        <ellipse cx="70" cy="122" rx="42" ry="45" fill="#b0b0b0" stroke="#777" stroke-width="2"/>
        <g class="kHead">
          <polygon points="38,42 42,8 66,32" fill="#bdbdbd" stroke="#777" stroke-width="2" stroke-linejoin="round"/>
          <polygon points="102,42 98,8 74,32" fill="#bdbdbd" stroke="#777" stroke-width="2" stroke-linejoin="round"/>
          <polygon points="45,35 46,17 58,31" fill="#e0e0e0"/>
          <polygon points="95,35 94,17 82,31" fill="#e0e0e0"/>
          <circle cx="70" cy="62" r="36" fill="#bdbdbd" stroke="#777" stroke-width="2"/>
          <g class="kEyes">
            <ellipse cx="56" cy="60" rx="5" ry="7" fill="#222"/>
            <ellipse cx="84" cy="60" rx="5" ry="7" fill="#222"/>
            <circle cx="57.5" cy="57" r="1.8" fill="#fff"/>
            <circle cx="85.5" cy="57" r="1.8" fill="#fff"/>
          </g>
          <circle cx="46" cy="75" r="6" fill="#d9d9d9"/>
          <circle cx="94" cy="75" r="6" fill="#d9d9d9"/>
          <polygon points="66,70 74,70 70,75" fill="#555"/>
          <path d="M70 75 q-5 6 -10 2 M70 75 q5 6 10 2" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"/>
          <path d="M42 70 L22 66 M42 75 L22 78 M98 70 L118 66 M98 75 L118 78" stroke="#777" stroke-width="1.3" stroke-linecap="round"/>
        </g>
        <ellipse class="kPawL" cx="55" cy="162" rx="13" ry="8" fill="#a0a0a0" stroke="#777" stroke-width="2"/>
        <ellipse class="kPawR" cx="85" cy="162" rx="13" ry="8" fill="#a0a0a0" stroke="#777" stroke-width="2"/>
        <g class="kHeld" visibility="hidden">
          <use class="kHeldLetter" href="#letterArt"/>
          <ellipse cx="44" cy="120" rx="8" ry="15" transform="rotate(-38 44 120)" fill="#b0b0b0" stroke="#777" stroke-width="2"/>
          <ellipse cx="96" cy="120" rx="8" ry="15" transform="rotate(38 96 120)" fill="#b0b0b0" stroke="#777" stroke-width="2"/>
        </g>
      </g></g></g></g></g>
      <use class="letter" href="#letterArt"/>
      <g class="hearts"></g>
    </g>
  </svg>`;
  const svg = root.querySelector('svg');
  const el = {};
  ['world', 'mouse', 'mBody', 'mHead', 'mEyes', 'mPawL', 'mPawR', 'kitty', 'kLean', 'kFlip', 'kBob', 'kSq', 'kTail', 'kHead', 'kEyes',
    'kPawL', 'kPawR', 'kHeld', 'kHeldLetter', 'letter', 'arc', 'hearts', 'shMouse', 'shKitty', 'shLetter', 'hole', 'mouseWrap', 'holeClipPath'].forEach(n => el[n] = root.querySelector('.' + n));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RM = reduce ? 0.35 : 1;

  // ---------- helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const easeSine = u => 0.5 - 0.5 * Math.cos(Math.PI * u);
  const easeOutBack = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const spring = v => ({ v, vel: 0 });
  function stepS(sp, target, kk, d, dt) { sp.vel += (-kk * (sp.v - target) - d * sp.vel) * dt; sp.v += sp.vel * dt; }
  const buzz = Seq.vib;

  // ---------- audio (Study 03's synth, on the shared context) ----------
  const AU = Seq.audio, out = Seq.sceneOut(.6);
  let tens = null;
  const ok = () => AU.ac && out.get();
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!ok()) return; const AC = AU.ac;
    const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(out.get()); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, vol, ftype, freq, qq = 1, delay = 0) {
    if (!ok()) return; const AC = AU.ac;
    const t0 = AC.currentTime + delay, src = AC.createBufferSource(); src.buffer = AU.nbuf;
    const f = AC.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = qq;
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(out.get()); src.start(t0); src.stop(t0 + dur + 0.03);
  }
  const snd = {
    grab() { tone('sine', 260, 170, 0.1, 0.25); noise(0.06, 0.07, 'highpass', 2500); },
    twang(p) { tone('triangle', 380 + 320 * p, 120, 0.38, 0.3); tone('sine', 760 + 600 * p, 240, 0.22, 0.12); noise(0.22, 0.12, 'bandpass', 1800, 0.8); },
    whoosh() { noise(0.5, 0.05, 'bandpass', 900, 0.7, 0.05); },
    plop(v) { tone('sine', 220, 70, 0.18, 0.3 * v); noise(0.1, 0.12 * v, 'highpass', 1800); },
    bonk() { tone('square', 150, 90, 0.12, 0.1); tone('sine', 300, 120, 0.12, 0.25); },
    slide(d) { noise(d, 0.05, 'bandpass', 2200, 0.6); },
    boop() { tone('sine', 420, 660, 0.11, 0.18); },
    lock() { tone('sine', 1046, 1046, 0.07, 0.07); },
    cancel() { tone('sine', 300, 380, 0.08, 0.12); },
    catch() {
      tone('sine', 300, 720, 0.12, 0.3); noise(0.07, 0.1, 'lowpass', 700);
      [1318, 1568, 1976, 2637].forEach((f, i) => tone('sine', f, f, 0.55, 0.09, 0.12 + i * 0.08));
    },
    purr() {
      if (!ok()) return; const AC = AU.ac;
      const t0 = AC.currentTime + 0.15;
      const src = AC.createBufferSource(); src.buffer = AU.nbuf; src.loop = true;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 2;
      const am = AC.createGain(); am.gain.value = 0.5;
      const lfo = AC.createOscillator(); lfo.frequency.value = 24;
      const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg).connect(am.gain);
      const hum = AC.createOscillator(); hum.type = 'sine'; hum.frequency.value = 52;
      const hg = AC.createGain(); hg.gain.value = 0.22;
      const env = AC.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(0.7, t0 + 0.35);
      env.gain.setValueAtTime(0.7, t0 + 1.6);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
      src.connect(lp).connect(am); hum.connect(hg).connect(am); am.connect(env).connect(out.get());
      [src, lfo, hum].forEach(n => { n.start(t0); n.stop(t0 + 2.7); });
    }
  };
  function tensionStart() {
    if (!ok() || tens) return; const AC = AU.ac;
    const o = AC.createOscillator(); o.type = 'sawtooth';
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    const g = AC.createGain(); g.gain.value = 0.0001;
    o.connect(f).connect(g).connect(out.get()); o.start();
    tens = { o, f, g };
  }
  function tensionSet(p) {
    if (!tens) return;
    const n = AU.ac.currentTime;
    tens.o.frequency.setTargetAtTime(70 + 170 * p, n, 0.03);
    tens.f.frequency.setTargetAtTime(300 + 900 * p, n, 0.03);
    tens.g.gain.setTargetAtTime(0.008 + 0.045 * p, n, 0.04);
  }
  function tensionStop() {
    if (!tens) return;
    const n = AU.ac.currentTime;
    tens.g.gain.setTargetAtTime(0.0001, n, 0.02); tens.o.stop(n + 0.2); tens = null;
  }

  // ---------- world (units; ground at y = 0, up is negative) ----------
  const KS = 1.15, LS = 0.7;
  const HALF_W = 70 * LS, HALF_H = 45 * LS;
  const CATCH_DY = (108 - 170) * KS;
  const CATCH_R = 40 * KS;
  const G = 1400, V_MAX = Math.sqrt(G * 900);
  const WALL_L = -165, WALL_R = 690;
  const HOLE_X = -112;
  const MOUSE_MIN = -95, MOUSE_MAX = 220, MOUSE_SPEED = 260;
  const CAT_MIN = 150, CAT_MAX = 615, GAP = 245;
  const SNAP = 0.07;

  const holePath = (() => {
    const w = 46, top = -64;
    return `M${HOLE_X - w} 0 L${HOLE_X - w} ${top} A${w} ${w} 0 0 1 ${HOLE_X + w} ${top} L${HOLE_X + w} 0 Z`;
  })();
  el.hole.setAttribute('d', holePath);
  el.holeClipPath.setAttribute('d', holePath);

  // Kitty roaming plan: seeded, so her position is a pure function of time.
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const PLAN = []; let PLAN_T = 0;
  (() => {
    const R = mulberry32(20261013); let x = 470, tt = 0;
    while (tt < 300) {
      const r = R();
      if (r < 0.26) {
        const d = 0.25 + R() * 0.8; PLAN.push({ t0: tt, dur: d, type: 0, x0: x, x1: x }); tt += d;
      } else if (r < 0.5) {
        let dx = (50 + R() * 120) * (R() < 0.5 ? -1 : 1); if (x + dx < CAT_MIN || x + dx > CAT_MAX) dx = -dx;
        const x1 = clamp(x + dx, CAT_MIN, CAT_MAX), d = 0.5 + R() * 0.15;
        PLAN.push({ t0: tt, dur: d, type: 2, x0: x, x1, h: 70 + R() * 70 }); x = x1; tt += d;
      } else {
        let x1 = CAT_MIN + R() * (CAT_MAX - CAT_MIN);
        if (Math.abs(x1 - x) < 80) x1 = clamp(x + (x1 < x ? -160 : 160), CAT_MIN, CAT_MAX);
        const d = Math.max(0.4, Math.abs(x1 - x) / (100 + R() * 140));
        PLAN.push({ t0: tt, dur: d, type: 1, x0: x, x1 }); x = x1; tt += d;
      }
    }
    const d = Math.max(0.4, Math.abs(470 - x) / 150);
    PLAN.push({ t0: tt, dur: d, type: 1, x0: x, x1: 470 }); tt += d;
    PLAN_T = tt;
  })();
  function catAt(T, mx) {
    const u = ((T % PLAN_T) + PLAN_T) % PLAN_T;
    let lo = 0, hi = PLAN.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (PLAN[m].t0 <= u) lo = m; else hi = m - 1; }
    const sg = PLAN[lo], kk = clamp((u - sg.t0) / sg.dur, 0, 1);
    let x = sg.x0, y = 0;
    if (sg.type === 1) x = lerp(sg.x0, sg.x1, easeSine(kk));
    else if (sg.type === 2) { x = lerp(sg.x0, sg.x1, kk); y = -sg.h * 4 * kk * (1 - kk); }
    x = Math.max(x, Math.min(mx + GAP, CAT_MAX));
    return { x, y };
  }

  // ---------- camera ----------
  let W, H, zReady, readyCam, maxPullPx;
  const cam = { x: spring(0), y: spring(0), z: spring(1) };
  function layout() {
    const r = root.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const span = WALL_R - WALL_L;
    zReady = Math.min(W / span, H / 640);
    readyCam = { x: (WALL_L + WALL_R) / 2, y: -(0.3 * H) / zReady, z: zReady };
    maxPullPx = clamp(Math.min(W, H) * 0.38, 110, 200);
  }
  const catShot = (cx, cy) => { const z = Math.min(zReady * 1.9, H * 0.42 / (200 * KS)); return { x: cx, y: -150 * KS + cy * 0.5, z }; };
  const holeShot = () => { const z = Math.min(zReady * 2.1, H * 0.4 / 175, W * 0.8 / 260); return { x: HOLE_X + 70, y: -105, z }; };
  const toWorld = (sx, sy) => ({ x: (sx - W / 2) / cam.z.v + cam.x.v, y: (sy - H / 2) / cam.z.v + cam.y.v });
  const toScreen = (wx, wy) => ({ x: (wx - cam.x.v) * cam.z.v + W / 2, y: (wy - cam.y.v) * cam.z.v + H / 2 });

  // ---------- state ----------
  const S = {
    chStretch: spring(1), chSq: spring(1), chPop: spring(1),
    mBrace: spring(0), mTilt: spring(0), mPaw: spring(1), mSalute: spring(0), mEx: spring(0), mEy: spring(0), mLean: spring(0),
    kLean: spring(0), kSq: spring(1), kEx: spring(0), kEy: spring(0), kEye: spring(1), kHead: spring(0), kHeldSq: spring(1),
    kFlip: spring(1), close: spring(0)
  };
  const mouse = { x: HOLE_X, target: 0, vx: 0, dist: 0, scale: 0.62, hopY: 0, bob: 0, clip: true, dim: 0.55 };
  const anchor = () => ({ x: mouse.x, y: -173 * mouse.scale - mouse.bob - mouse.hopY });
  const ch = { x: HOLE_X, y: -173, vx: 0, vy: 0, rot: 0, axis: 0 };
  let st = 'intro', stT = 0, t = 0, introT = 0, patrolT = 0.3, popped = false, reported = false;
  let cat = catAt(patrolT, mouse.x), catFrozen = false, catVx = 0, catDist = 0, catAir = false;
  let drag = null, walk = null, preview = null, onTarget = false, hitWall = false, tw = null;
  let hearts = [], heartClock = 0, lastStep = 0;
  const setState = n => { st = n; stT = 0; };
  const canWalk = () => st === 'ready' || st === 'rest' || st === 'slide' || st === 'hop' || (st === 'intro' && introT > 0.95);

  const DOTS = 46, dots = [];
  for (let i = 0; i < DOTS; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('visibility', 'hidden'); el.arc.appendChild(c); dots.push(c);
  }

  function simulate(x, y, vx, vy, T0) {
    const dt = 1 / 120, pts = [], spacing = 16 / zReady;
    let minD = Infinity, hit = false, acc = 0, px = x, py = y, tt = T0;
    for (let i = 0; i < 400; i++) {
      vy += G * dt; x += vx * dt; y += vy * dt; tt += dt;
      acc += Math.hypot(x - px, y - py); px = x; py = y;
      const c = catAt(tt, mouse.x), d = Math.hypot(x - c.x, y - (c.y + CATCH_DY));
      if (d < minD) minD = d;
      if (acc >= spacing) { acc = 0; pts.push([x, y]); if (pts.length >= DOTS) break; }
      if (d < CATCH_R) { hit = true; break; }
      if (vy > 0 && y + HALF_H >= 0) break;
      if (x + HALF_W > WALL_R || x - HALF_W < WALL_L) break;
    }
    return { pts, minD, hit };
  }
  const pullWorld = () => drag.dispPx * 0.45 / zReady;
  const launchVel = () => ({ vx: -drag.ux * drag.p * V_MAX, vy: -drag.uy * drag.p * V_MAX });

  // ---------- input ----------
  const pt = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  function skipIntro() {
    if (st !== 'intro') return;
    mouse.x = Math.max(mouse.x, HOLE_X + 30); mouse.scale = 1; mouse.hopY = 0; mouse.clip = false; mouse.dim = 1;
    if (!popped) { popped = true; S.chPop.v = 0.2; }
    introT = 99; setState('ready');
  }

  function onDown(e) {
    Seq.audioInit();
    if (st === 'intro') { skipIntro(); return; }
    if (introT < 3) introT = 99;
    if (drag || walk) return;
    const p = pt(e);
    if (st === 'ready') {
      const c = toScreen(ch.x, ch.y), z = cam.z.v, dx = p.x - c.x, dy = p.y - c.y;
      if (Math.abs(dx) < HALF_W * z + 24 && dy > -(HALF_H * z + 32) && dy < HALF_H * z + 8) {
        e.preventDefault();
        drag = { id: e.pointerId, sx: p.x, sy: p.y, ux: -0.7, uy: 0.7, dispPx: 0, p: 0 };
        try { root.setPointerCapture(e.pointerId); } catch (err) {}
        mouse.target = mouse.x;
        setState('drag');
        S.chSq.vel += 5; S.mBrace.vel += 4;
        snd.grab(); tensionStart();
        onTarget = false;
        return;
      }
    }
    if (st === 'caught') return;
    e.preventDefault();
    walk = { id: e.pointerId };
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
    mouse.target = clamp(toWorld(p.x, p.y).x, MOUSE_MIN, MOUSE_MAX);
  }
  function onMove(e) {
    if (walk && e.pointerId === walk.id) {
      const p = pt(e); mouse.target = clamp(toWorld(p.x, p.y).x, MOUSE_MIN, MOUSE_MAX); return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    const p = pt(e), dx = p.x - drag.sx, dy = p.y - drag.sy, len = Math.hypot(dx, dy);
    if (len > 0.5) { drag.ux = dx / len; drag.uy = dy / len; }
    drag.p = Math.min(len, maxPullPx) / maxPullPx;
    drag.dispPx = len <= maxPullPx ? len : maxPullPx + Math.min((len - maxPullPx) * 0.12, 14);
    tensionSet(drag.p);
  }
  function endPointer(e, cancelled) {
    if (walk && e.pointerId === walk.id) { walk = null; mouse.target = clamp(mouse.x + mouse.vx * 0.06, MOUSE_MIN, MOUSE_MAX); return; }
    if (!drag || e.pointerId !== drag.id) return;
    tensionStop();
    if (cancelled || drag.dispPx < 16) {
      tw = { x0: ch.x, y0: ch.y, dur: 0.3 }; drag = null; setState('settle'); snd.cancel(); return;
    }
    const v = launchVel(), a = anchor();
    ch.vx = v.vx; ch.vy = v.vy;
    tw = { x0: ch.x, y0: ch.y, ax: a.x, ay: a.y, dur: SNAP };
    snd.twang(drag.p); snd.whoosh(); buzz(14);
    S.mBrace.vel -= 6; hitWall = false; drag = null;
    setState('snap');
  }
  const onUp = e => endPointer(e, false), onCancel = e => endPointer(e, true);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onCancel);

  // ---------- hearts ----------
  const HEART = 'M0 0.42 C -1 -0.15 -0.55 -1 0 -0.5 C 0.55 -1 1 -0.15 0 0.42 Z';
  const FILLS = ['#6a6a6a', '#8c8c8c', '#a6a6a6', '#7c7c7c'];
  function spawnHeart(burst) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', HEART); p.setAttribute('fill', FILLS[(Math.random() * FILLS.length) | 0]);
    el.hearts.appendChild(p);
    const ox = cat.x, oy = cat.y + (30 - 170) * KS;
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
    const sp = burst ? 300 + Math.random() * 260 : 55;
    hearts.push({
      el: p, burst,
      x: ox + (burst ? 0 : (Math.random() - 0.5) * 80), y: burst ? oy : oy + 10,
      vx: Math.cos(a) * sp, vy: burst ? Math.sin(a) * sp : -sp,
      age: 0, life: burst ? 1.9 + Math.random() * 0.6 : 2.8,
      size: burst ? 13 + Math.random() * 11 : 14 + Math.random() * 8,
      rot: (Math.random() - 0.5) * 40, ph: Math.random() * 6
    });
  }

  function doCatch() {
    setState('caught'); catFrozen = true; walk = null; mouse.target = mouse.x;
    el.kHeld.setAttribute('visibility', 'visible');
    S.kHeldSq.v = 1.35; S.kHeldSq.vel = 0;
    S.kSq.v = 1.22; S.kSq.vel = 0; S.kLean.vel -= 60;
    snd.catch(); snd.purr(); buzz([18, 50, 30]);
    const n = reduce ? 5 : 11;
    for (let i = 0; i < n; i++) spawnHeart(true);
    heartClock = 0;
  }

  function landOrBounce() {
    const impact = ch.vy;
    ch.y = -HALF_H;
    if (impact > 150) snd.plop(clamp(impact / 900, 0.3, 1));
    S.chSq.vel += clamp(impact / 110, 0, 9);
    ch.vy = -impact * 0.3; ch.vx *= 0.5;
    if (Math.abs(ch.vy) < 95) { ch.vx = ch.vy = 0; return true; }
    return false;
  }
  function startSlide() {
    const x1 = mouse.x + 60, dist = Math.abs(x1 - ch.x);
    tw = { x0: ch.x, x1, r0: ch.rot, dur: clamp(dist / 380, 0.35, 1.8) };
    snd.slide(tw.dur * 0.9); setState('slide');
  }

  // ---------- update ----------
  function update(dt) {
    t += dt; stT += dt; introT += dt;
    const prevPatrol = patrolT;
    if (!catFrozen) patrolT += dt;
    let stretchT = 1, stretchK = 500, stretchD = 9, closeT = 0;

    if (st === 'intro') {
      const T = introT;
      if (T < 0.55) {
        mouse.x = HOLE_X; mouse.scale = 0.62; mouse.clip = true; mouse.dim = 0.55;
        mouse.hopY = Math.max(0, Math.sin(T * 11)) * 5;
      } else if (T < 0.95) {
        const kk = (T - 0.55) / 0.4;
        if (!popped) { popped = true; S.chPop.v = 0.2; snd.boop(); tone('sine', 520, 980, 0.12, 0.16); }
        mouse.clip = false; mouse.dim = 1;
        mouse.scale = lerp(0.62, 1, easeOutBack(kk));
        mouse.hopY = Math.sin(Math.PI * kk) * 60;
        mouse.x = lerp(HOLE_X, HOLE_X + 30, kk);
      } else {
        mouse.scale = 1; mouse.hopY = 0; mouse.target = 0;
        if (T > 1.75) setState('ready');
      }
    }

    if (canWalk()) {
      const dx = mouse.target - mouse.x;
      mouse.vx = clamp(dx * 9, -MOUSE_SPEED, MOUSE_SPEED);
      if (Math.abs(dx) < 0.5) mouse.vx = 0;
      mouse.x += mouse.vx * dt;
      mouse.dist += Math.abs(mouse.vx * dt);
    } else mouse.vx = 0;
    const mWalking = Math.abs(mouse.vx) > 12;
    mouse.bob = mWalking ? Math.abs(Math.sin(mouse.dist / 11)) * 6 : mouse.bob * 0.8;
    const stepIdx = Math.floor(mouse.dist / 34.5);
    if (mWalking && stepIdx !== lastStep) { lastStep = stepIdx; tone('sine', 1100, 700, 0.035, 0.035); }
    const A = anchor();

    if (st === 'intro') {
      ch.x = A.x; ch.y = A.y + Math.sin(t * 3.3) * 3 * RM; ch.rot = Math.sin(t * 1.7) * 2 * RM;
    } else if (st === 'ready') {
      ch.x = A.x; ch.y = A.y + Math.sin(t * 3.3) * 3 * RM;
      ch.rot = mWalking ? -mouse.vx / MOUSE_SPEED * 8 : Math.sin(t * 1.7) * 2 * RM;
    } else if (st === 'drag') {
      const d = pullWorld();
      ch.x = A.x + drag.ux * d; ch.y = A.y + drag.uy * d;
      ch.axis = Math.atan2(drag.uy, drag.ux) * 180 / Math.PI;
      ch.rot = lerp(ch.rot, 0, 0.2);
      stretchT = 1 + 0.6 * drag.p; stretchK = 420; stretchD = 32;
      if (drag.dispPx > 12) {
        const v = launchVel();
        preview = simulate(A.x, A.y, v.vx, v.vy, patrolT + SNAP);
        if (preview.hit && !onTarget) { snd.lock(); buzz(6); }
        onTarget = preview.hit;
        closeT = clamp(1 - (preview.minD - CATCH_R) / 160, 0, 1);
      } else { preview = null; onTarget = false; }
    } else if (st === 'settle') {
      const u = clamp(stT / tw.dur, 0, 1), e = easeOutBack(u);
      ch.x = lerp(tw.x0, A.x, e); ch.y = lerp(tw.y0, A.y, e);
      if (u >= 1) setState('ready');
    } else if (st === 'snap') {
      const u = clamp(stT / tw.dur, 0, 1);
      ch.x = lerp(tw.x0, tw.ax, u * u); ch.y = lerp(tw.y0, tw.ay, u * u);
      if (u >= 1) { ch.x = tw.ax; ch.y = tw.ay; setState('fly'); }
    } else if (st === 'fly') {
      const N = 4, h = dt / N;
      for (let i = 0; i < N && st === 'fly'; i++) {
        ch.vy += G * h; ch.x += ch.vx * h; ch.y += ch.vy * h;
        const c = catAt(prevPatrol + (i + 1) * h, mouse.x);
        if (Math.hypot(ch.x - c.x, ch.y - (c.y + CATCH_DY)) < CATCH_R) { patrolT = prevPatrol + (i + 1) * h; cat = c; doCatch(); break; }
        if (ch.x + HALF_W > WALL_R && ch.vx > 0) { ch.x = WALL_R - HALF_W; ch.vx = -ch.vx * 0.5; hitWall = true; snd.bonk(); S.chSq.vel -= 6; buzz(8); }
        if (ch.x - HALF_W < WALL_L && ch.vx < 0) { ch.x = WALL_L + HALF_W; ch.vx = -ch.vx * 0.5; hitWall = true; snd.bonk(); S.chSq.vel -= 6; }
        if (ch.vy > 0 && ch.y + HALF_H >= 0 && landOrBounce()) { setState('rest'); break; }
      }
      if (st === 'fly') {
        const sp = Math.hypot(ch.vx, ch.vy);
        ch.axis = Math.atan2(ch.vy, ch.vx) * 180 / Math.PI;
        stretchT = 1 + Math.min(sp / 2600, 0.3);
        ch.rot = clamp(ch.vy / 1000, -1, 1) * 14 * Math.sign(ch.vx || 1);
        const c = catAt(patrolT, mouse.x);
        closeT = clamp(1 - (Math.hypot(ch.x - c.x, ch.y - (c.y + CATCH_DY)) - CATCH_R) / 170, 0, 1);
        if (stT > 6) { ch.y = -HALF_H; setState('rest'); }
      }
    } else if (st === 'rest') {
      if (hitWall) startSlide();
      else { ch.rot = 16 * Math.exp(-5 * stT) * Math.sin(30 * stT); if (stT > 0.6) startSlide(); }
    } else if (st === 'slide') {
      const u = clamp(stT / tw.dur, 0, 1), x = lerp(tw.x0, tw.x1, easeInOut(u));
      if (hitWall) ch.rot = tw.r0 + ((x - tw.x0) / HALF_H) * 57.3 * 0.5;
      else ch.rot = -7 * Math.sin(Math.PI * u) * Math.sign(tw.x1 - tw.x0);
      ch.x = x; ch.y = -HALF_H - Math.abs(Math.sin(u * Math.PI * 3)) * (hitWall ? 0 : 4);
      if (u >= 1) { tw = { x0: ch.x, y0: ch.y, r0: ch.rot, dur: 0.4 }; setState('hop'); S.chSq.vel += 3; }
    } else if (st === 'hop') {
      const u = clamp(stT / tw.dur, 0, 1);
      ch.x = lerp(tw.x0, A.x, easeInOut(u));
      ch.y = lerp(tw.y0, A.y, u) - Math.sin(Math.PI * u) * 46;
      ch.rot = lerp(tw.r0 % 360, 0, u);
      if (u >= 1) { ch.rot = 0; S.chSq.vel += 5; snd.boop(); setState('ready'); }
    } else if (st === 'caught') {
      heartClock += dt;
      if (heartClock > (reduce ? 1.1 : 0.45)) { heartClock = 0; spawnHeart(false); }
      if (stT > 3 && !reported) { reported = true; done(null); }
    }

    if (!catFrozen) {
      const prev = cat; cat = catAt(patrolT, mouse.x);
      catVx = (cat.x - prev.x) / Math.max(dt, 1e-4);
      catDist += Math.abs(cat.x - prev.x);
      const air = cat.y < -0.5;
      if (catAir && !air) { S.kSq.v = 1.2; S.kSq.vel = 0; tone('sine', 180, 90, 0.08, 0.08); }
      catAir = air;
    } else { catVx = 0; catAir = false; }

    let target = readyCam;
    if (st === 'intro' || introT < 1.75) target = holeShot();
    else if (introT < 2.9) target = catShot(cat.x, cat.y);
    else if (st === 'caught' && stT < 1.8) target = catShot(cat.x, cat.y);
    else if (st === 'fly') target = { x: readyCam.x, y: Math.min(readyCam.y, ch.y + 0.32 * H / zReady), z: zReady };
    const ck = st === 'fly' ? 60 : 26, cd = 2 * Math.sqrt(ck);
    stepS(cam.x, target.x, ck, cd, dt); stepS(cam.y, target.y, ck, cd, dt); stepS(cam.z, target.z, ck, cd, dt);

    stepS(S.chStretch, stretchT, stretchK, stretchD, dt);
    stepS(S.chSq, 1, 520, 11, dt);
    stepS(S.chPop, 1, 300, 12, dt);
    stepS(S.close, closeT, 120, 18, dt);
    const close = clamp(S.close.v, 0, 1);

    const holding = st === 'intro' || st === 'ready' || st === 'drag' || st === 'settle' || (st === 'hop' && stT > tw.dur * 0.45);
    stepS(S.mPaw, holding ? 1 : 0, 360, 16, dt);
    stepS(S.mBrace, st === 'drag' ? 0.45 + 0.55 * drag.p : 0, 380, 13, dt);
    stepS(S.mSalute, st === 'caught' && stT > 0.35 ? 1 : 0, 330, 11, dt);
    stepS(S.mLean, mouse.vx / MOUSE_SPEED * 7, 200, 18, dt);
    const catChest = { x: cat.x, y: cat.y + CATCH_DY };
    let lookP, tiltT;
    if (st === 'intro') { lookP = { x: mouse.x + 200, y: -60 + Math.sin(t * 4) * 60 }; tiltT = Math.sin(t * 5) * 8; }
    else if (st === 'ready') {
      const atKitty = mWalking || (t % 3.4) < 1.3;
      lookP = atKitty ? catChest : { x: ch.x, y: ch.y - 40 }; tiltT = atKitty ? 10 : 0;
    } else if (st === 'drag') { lookP = ch; tiltT = -7; }
    else if (st === 'caught') { lookP = catChest; tiltT = 6 + 3 * Math.sin(t * 2); }
    else { lookP = ch; tiltT = clamp((ch.x - mouse.x) / 500, -1, 1) * 12; }
    const lx = lookP.x - mouse.x, ly = lookP.y + 118, ll = Math.hypot(lx, ly) || 1;
    stepS(S.mEx, lx / ll * 4, 300, 22, dt); stepS(S.mEy, ly / ll * 1.6, 300, 22, dt);
    stepS(S.mTilt, tiltT, 160, 14, dt);

    const caught = st === 'caught';
    const cWalking = !caught && Math.abs(catVx) > 12;
    const flipT = caught ? 1 : cWalking && catVx > 0 ? -1 : 1;
    stepS(S.kFlip, flipT, 260, 26, dt);
    const fs = S.kFlip.v >= 0 ? 1 : -1;
    const kl = caught ? { x: 70, y: 118 } : { x: (ch.x - cat.x) / KS * fs + 70, y: (ch.y - cat.y + 170 * KS) / KS };
    const evx = kl.x - 70, evy = kl.y - 60, en = Math.hypot(evx, evy) || 1, em = Math.min(en / 30, 1) * 3.6;
    stepS(S.kEx, caught ? 0 : evx / en * em, 260, 20, dt);
    stepS(S.kEy, caught ? 2 : evy / en * em * 0.8, 260, 20, dt);
    const blinking = !caught && (t % 3.9) < 0.13;
    stepS(S.kEye, caught ? 0.2 : blinking ? 0.1 : 1 + 0.15 * close, 700, 30, dt);
    const towardLetter = ch.x < cat.x ? -1 : 1;
    const leanT = caught ? Math.sin(t * 2.4) * 4 : clamp(catVx / 200, -1, 1) * 6 + towardLetter * 11 * close;
    stepS(S.kLean, leanT, 240, 13, dt);
    stepS(S.kSq, 1, 420, 9, dt);
    stepS(S.kHeldSq, 1, 380, 10, dt);
    stepS(S.kHead, caught ? Math.sin(t * 3) * 7 : Math.sin(t * 1.1) * 4 * RM - 5 * close, 160, 14, dt);

    for (let i = hearts.length - 1; i >= 0; i--) {
      const hh = hearts[i]; hh.age += dt;
      if (hh.burst) { hh.vx *= Math.exp(-2.6 * dt); hh.vy = hh.vy * Math.exp(-2.4 * dt) - 40 * dt; }
      else hh.vx = Math.sin(hh.age * 3 + hh.ph) * 26;
      hh.x += hh.vx * dt; hh.y += hh.vy * dt;
      if (hh.age >= hh.life) { hh.el.remove(); hearts.splice(i, 1); }
    }
  }

  // ---------- render ----------
  const f = n => n.toFixed(2);
  function render() {
    const z = cam.z.v;
    el.world.setAttribute('transform', `translate(${f(W / 2)} ${f(H / 2)}) scale(${z.toFixed(4)}) translate(${f(-cam.x.v)} ${f(-cam.y.v)})`);

    if (mouse.clip) el.mouseWrap.setAttribute('clip-path', 'url(#flHoleClip)'); else el.mouseWrap.removeAttribute('clip-path');
    el.mouseWrap.setAttribute('opacity', f(mouse.dim));
    el.mouse.setAttribute('transform', `translate(${f(mouse.x)} ${f(-mouse.bob - mouse.hopY)}) rotate(${f(S.mLean.v)}) scale(${f(mouse.scale)}) translate(-60 -160)`);
    const b = S.mBrace.v;
    el.mBody.setAttribute('transform', `translate(60 160) rotate(${f(-5 * b)}) scale(${f(1 + 0.06 * b)} ${f(1 - 0.08 * b)}) translate(-60 -160)`);
    el.mHead.setAttribute('transform', `rotate(${f(S.mTilt.v)} 60 70)`);
    el.mEyes.setAttribute('transform', `translate(${f(clamp(S.mEx.v, -4.5, 4.5))} ${f(clamp(S.mEy.v, -1.8, 1.8))})`);
    const up = clamp(S.mPaw.v, -0.2, 1.2), sal = S.mSalute.v;
    const bobU = (st === 'ready' || st === 'intro') ? (ch.y - anchor().y) / mouse.scale : 0;
    el.mPawL.setAttribute('transform', `translate(${f(-8 * up)} ${f((-58 + bobU) * up)})`);
    el.mPawR.setAttribute('transform', `translate(${f(8 * up - 4 * sal)} ${f((-58 + bobU) * up - 28 * sal)}) rotate(${f(-40 * sal)} 82 70)`);
    el.shMouse.setAttribute('cx', f(mouse.x));
    el.shMouse.setAttribute('visibility', mouse.clip ? 'hidden' : 'visible');
    el.shMouse.setAttribute('rx', f(48 * mouse.scale * (1 - Math.min(mouse.hopY / 150, 0.4))));

    const walking = st !== 'caught' && Math.abs(catVx) > 12 && !catAir;
    const stepPh = catDist / 15;
    const bob = walking ? Math.abs(Math.sin(stepPh)) * 6 : 0;
    el.kitty.setAttribute('transform', `translate(${f(cat.x)} ${f(cat.y)})`);
    el.kLean.setAttribute('transform', `rotate(${f(S.kLean.v)})`);
    let fx = S.kFlip.v; if (Math.abs(fx) < 0.06) fx = fx < 0 ? -0.06 : 0.06;
    el.kFlip.setAttribute('transform', `scale(${f(fx * KS)} ${KS}) translate(-70 -170)`);
    el.kBob.setAttribute('transform', `translate(0 ${f(-bob)})`);
    let kq = clamp(S.kSq.v, 0.7, 1.35); if (catAir) kq = Math.min(kq, 0.9);
    el.kSq.setAttribute('transform', `translate(70 170) scale(${f(kq)} ${f(2 - kq)}) translate(-70 -170)`);
    const tuck = catAir ? 6 : 0;
    el.kPawL.setAttribute('transform', `translate(0 ${f(walking ? -Math.max(0, Math.sin(stepPh)) * 7 : -tuck)})`);
    el.kPawR.setAttribute('transform', `translate(0 ${f(walking ? -Math.max(0, -Math.sin(stepPh)) * 7 : -tuck)})`);
    const close = clamp(S.close.v, 0, 1);
    const tailSpeed = st === 'caught' ? 5.2 : 2.3 + 4 * close;
    const tailAmp = (st === 'caught' ? 18 : 13 + 8 * close) * (reduce ? 0.5 : 1);
    el.kTail.setAttribute('transform', `rotate(${f(Math.sin(t * tailSpeed) * tailAmp)} 108 142)`);
    el.kHead.setAttribute('transform', `rotate(${f(S.kHead.v)} 70 98)`);
    el.kEyes.setAttribute('transform', `translate(${f(S.kEx.v)} ${f(S.kEy.v)}) translate(70 60) scale(1 ${f(Math.max(0.08, S.kEye.v))}) translate(-70 -60)`);
    if (st === 'caught') {
      const hq = clamp(S.kHeldSq.v, 0.7, 1.4);
      el.kHeldLetter.setAttribute('transform', `translate(70 120) scale(${f(hq)} ${f(2 - hq)}) scale(${(LS / KS).toFixed(4)}) translate(-80 -55)`);
    }

    const ch_ = Math.min(-cat.y / 200, 0.5);
    el.shKitty.setAttribute('cx', f(cat.x));
    el.shKitty.setAttribute('rx', f((66 - bob * 1.5) * (1 - ch_)));
    el.shKitty.setAttribute('opacity', f(1 - ch_));
    const letterHidden = st === 'caught' || (st === 'intro' && !popped);
    if (letterHidden) el.shLetter.setAttribute('visibility', 'hidden');
    else {
      const hgt = Math.max(0, -(ch.y + HALF_H));
      el.shLetter.setAttribute('visibility', 'visible');
      el.shLetter.setAttribute('cx', f(ch.x));
      el.shLetter.setAttribute('rx', f(HALF_W * (0.95 - Math.min(hgt / 700, 0.6))));
      el.shLetter.setAttribute('ry', f(6 * (1 - Math.min(hgt / 700, 0.6))));
      el.shLetter.setAttribute('opacity', f(1 - Math.min(hgt / 500, 0.8)));
    }

    if (letterHidden) el.letter.setAttribute('visibility', 'hidden');
    else {
      el.letter.setAttribute('visibility', 'visible');
      const sx = Math.max(0.5, S.chStretch.v), sy = 1 / Math.sqrt(sx);
      const qq = clamp(S.chSq.v, 0.65, 1.35), pop = Math.max(0.05, S.chPop.v) * (st === 'intro' ? mouse.scale : 1);
      el.letter.setAttribute('transform',
        `translate(${f(ch.x)} ${f(ch.y)}) rotate(${f(ch.axis)}) scale(${f(sx)} ${f(sy)}) rotate(${f(-ch.axis)}) rotate(${f(ch.rot)}) scale(${f(qq * pop)} ${f((2 - qq) * pop)}) scale(${LS}) translate(-80 -55)`);
    }

    const pts = st === 'drag' && preview ? preview.pts : [], n = pts.length;
    for (let i = 0; i < DOTS; i++) {
      const c = dots[i];
      if (i < n) {
        c.setAttribute('visibility', 'visible');
        c.setAttribute('cx', f(pts[i][0])); c.setAttribute('cy', f(pts[i][1]));
        c.setAttribute('r', f((onTarget ? 3.8 : 3) / z));
        c.setAttribute('fill', onTarget ? 'var(--dot-on)' : 'var(--dot)');
        c.setAttribute('opacity', f(1 - (i / Math.max(n, 1)) * 0.55));
      } else c.setAttribute('visibility', 'hidden');
    }

    for (const hh of hearts) {
      const u = hh.age / hh.life, sc = hh.size * easeOutBack(clamp(hh.age / 0.28, 0, 1));
      const op = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      hh.el.setAttribute('transform', `translate(${f(hh.x)} ${f(hh.y)}) rotate(${f(hh.rot + Math.sin(hh.age * 4 + hh.ph) * 8)}) scale(${f(Math.max(0.01, sc))})`);
      hh.el.setAttribute('opacity', f(clamp(op, 0, 1)));
    }
  }

  // ---------- boot ----------
  const px = new Seq.Pixel(root);
  layout();
  const start = holeShot();
  cam.x.v = start.x; cam.y.v = start.y; cam.z.v = start.z;
  const ro = new ResizeObserver(() => {
    layout();
    if (st === 'drag' || st === 'snap') { tensionStop(); drag = null; preview = null; const a = anchor(); ch.x = a.x; ch.y = a.y; setState('ready'); }
  });
  ro.observe(root);
  render();

  let last = performance.now();
  return {
    entry: toScreen(HOLE_X, -40),
    frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      update(dt); render(); px.render(now);
    },
    destroy() { tensionStop(); ro.disconnect(); px.destroy(); out.close(); }
  };
};
