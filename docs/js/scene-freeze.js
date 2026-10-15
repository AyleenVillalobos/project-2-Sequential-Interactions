/* Step 2 — Freeze when the dog looks.
   Ported from studies/02-freeze-when-the-dog-looks. The dog cycle, cone detection, hide /
   panic timings, sounds and send-back-to-start outcomes are unchanged. Adaptations: input is
   scoped to this scene, the letter is the shared letter art, the mouse comes out of a small
   hole at its start point, it uses the light palette only, and reaching the hole completes the step. */
Seq.scenes.freeze = (root, done) => {
  root.classList.add('sc-freeze');
  const HOLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 70"><path d="M4 70V36A36 36 0 0 1 76 36V70Z" fill="var(--hole-rim)"/><path d="M12 70V38A28 28 0 0 1 68 38V70Z" fill="var(--hole)"/></svg>`;
  root.innerHTML = `
  <svg class="lay cone" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="frCg" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--cone);stop-opacity:var(--cone-a)"/><stop offset="1" style="stop-color:var(--cone);stop-opacity:.05"/></radialGradient></defs>
    <g class="coneG" opacity="0"><polygon class="c3" fill="url(#frCg)" fill-opacity=".35"/><polygon class="c2" fill="url(#frCg)" fill-opacity=".55"/><polygon class="c1" fill="url(#frCg)"/></g>
  </svg>
  <div class="dog">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 145">
      <path d="M30 92 C 10 82, 12 60, 26 62" fill="none" stroke="#6a6a6a" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="100" cy="97" rx="75" ry="33" fill="#7a7a7a" stroke="#555" stroke-width="2"/>
      <ellipse cx="176" cy="124" rx="20" ry="9" fill="#8a8a8a" stroke="#555" stroke-width="2"/>
      <circle cx="170" cy="76" r="31" fill="#888" stroke="#555" stroke-width="2"/>
      <ellipse cx="198" cy="87" rx="17" ry="12" fill="#9a9a9a" stroke="#555" stroke-width="2"/>
      <circle cx="212" cy="82" r="5" fill="#222"/>
      <g class="fear"><path d="M154 54 C 138 60, 138 97, 152 102 C 161 86, 163 68, 166 54 Z" fill="#5e5e5e"/></g>
      <path d="M146 96 Q 160 108 178 104" fill="none" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
      <path class="eye-closed" d="M168 72 q6 5 12 0" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>
      <g class="eye-open" opacity="0"><circle cx="174" cy="71" r="6" fill="#f2f2f2"/><circle class="pupil" cx="176" cy="71" r="3" fill="#222"/></g>
    </svg>
  </div>
  <div class="hole entry">${HOLE}</div>
  <div class="hole goal">${HOLE}</div>
  <div class="mw mBodyW"><svg class="mBodyS" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 165">
    <g class="tail"><path d="M60 126 C 62 145, 88 140, 80 160" fill="none" stroke="#777" stroke-width="4" stroke-linecap="round"/></g>
    <ellipse cx="60" cy="88" rx="30" ry="42" fill="#9a9a9a" stroke="#666" stroke-width="2"/>
    <ellipse cx="38" cy="70" rx="6" ry="4" fill="#bdbdbd"/><ellipse cx="82" cy="70" rx="6" ry="4" fill="#bdbdbd"/>
  </svg></div>
  <div class="mw cheese"><svg class="cheeseS" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110"><use href="#letterArt"/></svg></div>
  <div class="mw mHeadW"><svg class="mHeadS" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 165">
    <g class="head">
      <circle cx="40" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/><circle cx="40" cy="34" r="7" fill="#cfcfcf"/>
      <circle cx="80" cy="34" r="13" fill="#8a8a8a" stroke="#666" stroke-width="2"/><circle cx="80" cy="34" r="7" fill="#cfcfcf"/>
      <ellipse cx="60" cy="46" rx="20" ry="25" fill="#a8a8a8" stroke="#666" stroke-width="2"/>
      <ellipse cx="60" cy="42" rx="18" ry="6.5" fill="#3a3a3a"/><circle cx="52" cy="42" r="2.6" fill="#f2f2f2"/><circle cx="68" cy="42" r="2.6" fill="#f2f2f2"/>
      <circle cx="60" cy="21" r="4" fill="#2e2e2e"/>
      <path d="M56 26 L40 22 M56 28 L40 30 M64 26 L80 22 M64 28 L80 30" stroke="#555" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    </g>
  </svg></div>
  <svg class="lay rings" xmlns="http://www.w3.org/2000/svg"><ellipse class="r0" fill="none" stroke="var(--ring)" opacity="0"/><ellipse class="r1" fill="none" stroke="var(--ring)" opacity="0"/></svg>
  <div class="bang"><svg viewBox="0 0 60 80" style="width:100%;height:100%"><path d="M22 6h16l-3 42H25z" fill="#f4f4f4" stroke="#1f1f1f" stroke-width="3.5" stroke-linejoin="round"/><circle cx="30" cy="63" r="7.5" fill="#f4f4f4" stroke="#1f1f1f" stroke-width="3.5"/></svg></div>
  <div class="vig" data-px="vignette"></div>
  <button class="hide" type="button" aria-label="Hide (hold)" data-px-ui><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7l6 5 6-5M5 18h14"/></svg></button>`;

  const q = s => root.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const D2R = Math.PI / 180, CONE_H = 11 * D2R, OMEGA = 28 * D2R;
  const SPEED = 0.24, START_P = 0.12, START_Q = 0.80, WARN = 1.7, MAX_HOLD = 4.6;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- audio (Study 02's synth, on the shared context) ---------- */
  const AU = Seq.audio, out = Seq.sceneOut(.85);
  let whine = null;
  const ok = () => AU.ac && out.get();
  function tone(type, f1, f2, dur, peak, o) {
    if (!ok()) return; const ac = AU.ac; o = o || {}; const t = ac.currentTime + (o.d || 0), a = o.a || .006;
    const osc = ac.createOscillator(), g = ac.createGain(); osc.type = type;
    osc.frequency.setValueAtTime(f1, t); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dur);
    let n = osc; if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); n = f; }
    n.connect(g); g.connect(out.get()); osc.start(t); osc.stop(t + a + dur + .05);
  }
  function noise(dur, peak, o) {
    if (!ok()) return; const ac = AU.ac; o = o || {}; const t = ac.currentTime + (o.d || 0), a = o.a || .006;
    const src = ac.createBufferSource(); src.buffer = AU.nbuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f1 || 1000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dur);
    src.connect(f); f.connect(g); g.connect(out.get()); src.start(t); src.stop(t + a + dur + .05);
  }
  const SFX = {
    squash() { tone('sine', 140, 60, .09, .35, { lp: 400 }); noise(.05, .12, { type: 'lowpass', f1: 500 }); },
    heart(tr) { const v = .5 + .25 * tr; tone('sine', 64, 38, .2, v, { lp: 160 }); tone('sine', 74, 44, .17, v * .7, { d: .17, lp: 160 }); },
    exhale(v) { noise(.5 + .3 * v, .1 + .12 * v, { f1: 900, f2: 260, q: .7, a: .08 }); tone('sine', 200, 110, .35, .03 + .05 * v, { lp: 300, a: .08 }); },
    step() { noise(.03, .03, { f1: 1400 + Math.random() * 500, q: 2 }); },
    ear() { noise(.035, .1, { type: 'highpass', f1: 3500 }); noise(.035, .1, { type: 'highpass', f1: 3500, d: .07 }); },
    flick() { tone('sine', 900, 1300, .04, .05); },
    growl() {
      if (!ok()) return; const ac = AU.ac, t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(52, t + .9);
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 17; lg.gain.value = 7; l.connect(lg); lg.connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.3, t + .12); g.gain.exponentialRampToValueAtTime(.0001, t + .95);
      o.connect(f); f.connect(g); g.connect(out.get()); o.start(t); l.start(t); o.stop(t + 1); l.stop(t + 1);
    },
    sigh() { noise(.75, .1, { type: 'lowpass', f1: 700, f2: 180, a: .12 }); tone('sine', 110, 70, .5, .08, { lp: 240, a: .1 }); },
    spot() { tone('square', 880, 640, .14, .12, { lp: 2400 }); tone('square', 1100, 820, .14, .1, { d: .12, lp: 2400 }); noise(.18, .4, { f1: 1400, f2: 600, q: .8 }); tone('sawtooth', 230, 110, .35, .22, { lp: 900, d: .05 }); },
    slip() { noise(.3, .08, { f1: 1100, f2: 300, q: .8 }); tone('sine', 95, 45, .25, .55, { d: .26, lp: 200 }); tone('sine', 90, 50, .15, .3, { d: .5, lp: 200 }); },
    whoosh() { noise(.35, .1, { f1: 400, f2: 1800, q: .9, a: .05 }); },
    chime() { [523.25, 659.25, 783.99].forEach((f, i) => tone('sine', f, null, 1.1, .07, { d: i * .18, a: .02 })); }
  };
  function whineStart() {
    if (!ok() || whine) return; const ac = AU.ac;
    const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.value = 420; g.gain.value = 0; l.frequency.value = 7; lg.gain.value = 0;
    l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(out.get()); o.start(); l.start();
    whine = { o, g, l, lg };
  }
  function whineSet(tr) {
    if (!whine) return; const t = AU.ac.currentTime, v = .04 * Math.pow(tr, 1.4);
    whine.o.frequency.setTargetAtTime(380 + 700 * tr, t, .05);
    whine.g.gain.setTargetAtTime(v, t, .08);
    whine.l.frequency.setTargetAtTime(6 + 16 * tr, t, .1);
    whine.lg.gain.setTargetAtTime(v * .5, t, .1);
  }
  function whineStop() {
    if (!whine) return; const w = whine; whine = null;
    try { w.g.gain.setTargetAtTime(0, AU.ac.currentTime, .04); } catch (e) {}
    setTimeout(() => { try { w.o.stop(); w.l.stop(); } catch (e) {} }, 400);
  }
  const vibrate = Seq.vib;

  /* ---------- elements + layout ---------- */
  const coneG = q('.coneG'), c1 = q('.c1'), c2 = q('.c2'), c3 = q('.c3'), cg = q('#frCg'), coneSvg = q('.cone'), ringsSvg = q('.rings'),
    dogEl = q('.dog'), earEl = q('.fear'), eyeC = q('.eye-closed'), eyeO = q('.eye-open'), pupil = q('.pupil'),
    bW = q('.mBodyW'), hW = q('.mHeadW'), bS = q('.mBodyS'), hS = q('.mHeadS'), cheeseEl = q('.cheese'), cheeseS = q('.cheeseS'),
    headEl = q('.head'), tailEl = q('.tail'), bang = q('.bang'), vig = q('.vig'), holeEl = q('.goal'), entryEl = q('.entry'), goBtn = q('.hide'), r0 = q('.r0'), r1 = q('.r1');
  let bangH = 50, holeY = 0, stageL = 0, stageT = 0, dogCx = 0, eyeOff = 0, bangBW = 40, holeX = 0, holeHH = 0, W = 0, H = 0, k = .5, eyeX = 0, eyeY = 0, dogLeft = 0, dogTop = 0, dogW = 0, dogH = 0, cx0 = 0, cy0 = 0;
  const LH = 110; // letter art height
  function layout() {
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height; stageL = r.left; stageT = r.top;
    k = clamp(W / 390 * .66, .34, .8);
    dogW = W * .46; dogH = dogW * 145 / 230; dogLeft = W * .5 - dogW / 2; dogTop = Math.max(H * .08, 70);
    dogCx = dogLeft + dogW / 2; eyeOff = dogW * 59 / 230; eyeX = dogCx + eyeOff; eyeY = dogTop + dogH * 71 / 145;
    dogEl.style.cssText = `left:${dogLeft}px;top:${dogTop}px;width:${dogW}px;height:${dogH}px`;
    for (const s of [bS, hS]) s.style.cssText = `left:${-60 * k}px;top:${-142.5 * k}px;width:${120 * k}px;height:${165 * k}px;transform:rotate(90deg)`;
    const cw = 160 * k * .98, ch = LH * k * .98; cheeseS.style.cssText = `left:${-cw / 2}px;top:${-ch / 2}px;width:${cw}px;height:${ch}px`;
    cx0 = -10 * k; cy0 = -80 * k;
    for (const s of [coneSvg, ringsSvg]) s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    cg.setAttribute('cx', eyeX); cg.setAttribute('cy', eyeY); cg.setAttribute('r', H * 1.1);
    bangBW = Math.max(34, W * .12); bangH = bangBW * 80 / 60; bang.style.cssText = `width:${bangBW}px;height:${bangH}px`;
    const hw = 90 * k, hh = hw * 70 / 80; holeHH = hh; holeY = H * .5;
    holeEl.style.cssText = `left:${W - hw - 4}px;top:${holeY - hh}px;width:${hw}px;height:${hh}px`; holeX = W - hw / 2 - 4;
    entryEl.style.cssText = `left:${START_P * W - hw / 2}px;top:${START_Q * H - hh * 1.05}px;width:${hw}px;height:${hh}px`;
  }

  /* ---------- input (scoped to this scene) ---------- */
  const down = new Set(); let dragId = null, dragX = 0, dragY = 0, keyHeld = false;
  const hideUI = () => goBtn.classList.toggle('active', down.size > 0 || keyHeld);
  const setDrag = e => { dragX = e.clientX - stageL; dragY = e.clientY - stageT; };
  function onDown(e) {
    const t = e.target && e.target.closest ? e.target : null;
    e.preventDefault(); Seq.audioInit();
    try { root.setPointerCapture(e.pointerId); } catch (_) {}
    if (t && t.closest('.hide')) { down.add(e.pointerId); hideUI(); return; }
    if (dragId === null) { dragId = e.pointerId; setDrag(e); } else { down.add(e.pointerId); hideUI(); }
  }
  const onMove = e => { if (e.pointerId === dragId) setDrag(e); };
  const rel = e => { if (e.pointerId === dragId) dragId = null; down.delete(e.pointerId); hideUI(); };
  const onCtx = e => e.preventDefault();
  const onKeyDown = e => {
    if (e.target.closest && e.target.closest('button')) return;
    if (e.code === 'Space') { e.preventDefault(); Seq.audioInit(); keyHeld = true; hideUI(); }
  };
  const onKeyUp = e => { if (e.code === 'Space') { keyHeld = false; hideUI(); } };
  const letGo = () => { down.clear(); dragId = null; keyHeld = false; hideUI(); };
  root.addEventListener('pointerdown', onDown, { passive: false });
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', rel); root.addEventListener('pointercancel', rel);
  root.addEventListener('contextmenu', onCtx);
  addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp);
  addEventListener('blur', letGo); document.addEventListener('visibilitychange', letGo);
  const ro = new ResizeObserver(layout); ro.observe(root);

  /* ---------- state ---------- */
  const S = {};
  let reported = false;
  function resetState() {
    whineStop(); bang.classList.remove('on');
    Object.assign(S, { dx: 0, dy: 0, dv: 1, dface: 1, wx: dogCx, wy: dogTop, dogMv: false, started: false, flipDone: false, doneT: 0, mode: 'walk', p: START_P, q: START_Q, vx: 0, vy: 0, vp: 0, face: 1, held: false, hold: 0, tr: 0, sy: 1, vsy: 0,
      dog: 'sleep', dogT: 0, sleepDur: 3.6, warnIdx: 0, sweepDir: -1, th: 0, thFrom: 0, thTo: 0, thT: 0, thTot: 1, coneA: 0,
      exposure: 0, danger: 0, ringP: 0, hAmt: 0, beat: 0, beatT: 0, dubT: -1, eo: 0, eyeWide: 0, lift: 0, earEnv: 0,
      glanceT: 2, glanceU: -1, glanceA: 0, head: 0, bobPh: 0, t: S.t || 0, sp: null, jumpY: 0,
      cheese: { state: 'on', x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, op: 1, pop: 1, popT: 1, wx: 0, wy: 0, rest: 0 } }); syncEye();
  }
  function syncEye() { eyeX = dogCx + S.dx + S.dface * eyeOff; eyeY = dogTop + S.dy + dogH * 71 / 145; }
  const WARN_EV = [[.15, 'ear'], [.5, 'flick'], [.95, 'ear'], [1.25, 'flick']];
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  function bearing() {
    const dx = S.p * W - eyeX, dy = S.q * H - 60 * k - eyeY, dist = Math.max(20, Math.hypot(dx, dy));
    return { phi: Math.atan2(dy, dx), ang: Math.atan(42 * k * .8 / dist) };
  }
  function pickWaypoint() {
    const lo = .04 * H + 50, hi = .84 * H - dogH;
    if (Math.random() < .45) { S.wx = clamp(S.p * W + (Math.random() - .5) * .3 * W, .15 * W, .85 * W); S.wy = clamp(S.q * H - dogH * 1.2 + (Math.random() - .5) * .2 * H, lo, hi); }
    else { S.wx = .15 * W + Math.random() * .7 * W; S.wy = lo + Math.random() * (hi - lo); }
  }

  /* ---------- dog ---------- */
  function startWake() {
    S.dog = 'awake'; S.dogT = 0; S.thT = 0; SFX.growl();
    const b = bearing(), A = 75 * D2R, dir = S.sweepDir; S.sweepDir = -dir;
    S.thFrom = b.phi - dir * A; S.thTo = b.phi + dir * A; S.thTot = 2 * A / OMEGA; S.th = S.thFrom;
  }
  function toSettle() { S.dog = 'settle'; S.dogT = 0; SFX.sigh(); }
  function updateDog(dt) {
    const lifts = { sleep: 0, warn: .25, awake: 1, alert: 1, settle: 0 };
    S.lift += (lifts[S.dog] - S.lift) * Math.min(1, dt * 6);
    const dsp = S.mode === 'walk' ? ({ sleep: 0, warn: .07, awake: .14, settle: .07, alert: 0 }[S.dog] || 0) : 0;
    S.dogMv = false;
    if (dsp > 0) {
      const ddx = S.wx - (dogCx + S.dx), ddy = S.wy - (dogTop + S.dy), dd = Math.hypot(ddx, ddy);
      if (dd < 14) pickWaypoint();
      else { const stp = dsp * W * dt; S.dx += ddx / dd * stp; S.dy += ddy / dd * stp; S.dogMv = true; if (Math.abs(ddx) > 8) S.dface = ddx > 0 ? 1 : -1; }
    }
    syncEye();
    if (S.dog === 'awake') S.eo = Math.min(1, S.eo + dt * 14);
    else if (S.dog === 'alert') S.eo = 1;
    else if (S.dog === 'settle') S.eo = Math.max(0, S.eo - dt * 3.2);
    else S.eo *= Math.exp(-dt * 10);
    S.earEnv *= Math.exp(-dt * 8);
    S.eyeWide = S.dog === 'alert' ? 1 : Math.max(0, S.eyeWide - dt * 2.5);
    const wantCone = S.dog === 'awake' && S.thT < S.thTot * .97 ? 1 : 0;
    S.coneA += (wantCone - S.coneA) * Math.min(1, dt * (wantCone ? 9 : 5));
    if (S.mode !== 'walk') { if (S.dog === 'warn' || S.dog === 'awake') { S.dog = 'settle'; S.dogT = .2; } return; }
    if (!S.started) return;
    S.dogT += dt;
    if (S.dog === 'sleep') { if (S.dogT >= S.sleepDur) { S.dog = 'warn'; S.dogT = 0; S.warnIdx = 0; S.flipDone = false; pickWaypoint(); } }
    else if (S.dog === 'warn') {
      while (S.warnIdx < WARN_EV.length && S.dogT >= WARN_EV[S.warnIdx][0]) {
        const ty = WARN_EV[S.warnIdx++][1];
        if (ty === 'ear') { S.earEnv = 1; SFX.ear(); } else { S.eo = .45; SFX.flick(); }
      }
      if (S.dogT >= WARN) startWake();
    } else if (S.dog === 'awake') {
      S.thT += dt; const u = Math.min(1, S.thT / S.thTot), e = u * .75 + .25 * u * u * (3 - 2 * u);
      S.th = S.thFrom + (S.thTo - S.thFrom) * e;
      if (!S.flipDone && u > .5) { S.flipDone = true; pickWaypoint(); }
      if (u >= 1) toSettle();
    } else if (S.dog === 'settle') {
      if (S.dogT >= .8) { S.dog = 'sleep'; S.dogT = 0; S.sleepDur = 2.4 + Math.random() * 1.4; }
    }
  }

  /* ---------- outcomes ---------- */
  function popBang() { bang.classList.remove('on'); void bang.offsetWidth; bang.classList.add('on'); }
  function spot() {
    S.mode = 'spotted'; whineStop(); S.held = false; S.hold = 0; S.tr = 0; S.vp = 0; S.exposure = 0;
    S.dog = 'alert'; S.dogT = 0; S.sp = { t: 0, phase: 'leap', cause: 'spot', v: 0 };
    popBang(); SFX.spot(); vibrate([70, 40, 110]);
  }
  function slip() {
    S.mode = 'slipped'; whineStop(); S.held = false; S.hold = 0; S.tr = 0; S.vp = 0;
    const c = S.cheese; c.state = 'fall'; c.x = S.p * W + S.face * cx0; c.y = S.q * H + cy0 * S.sy;
    c.vx = 75 * S.face * k / .55; c.vy = -210; c.vr = 260; c.rot = 0; c.rest = 0;
    S.sp = { t: 0, phase: 'fall', cause: 'slip', v: 0 }; SFX.slip();
  }
  function arrive() {
    const c = S.cheese;
    S.p = START_P; S.q = START_Q; S.face = 1; S.vp = 0; S.mode = 'walk'; S.sp = null; S.jumpY = 0; S.sy = .8; S.vsy = 1.5; S.exposure = 0;
    c.state = 'on'; c.x = c.y = 0; c.op = 1; c.popT = 0; c.pop = 0;
    if (S.dog === 'alert') toSettle();
    S.glanceT = 1.2;
  }
  function updateSp(dt) {
    const sp = S.sp; sp.t += dt; const c = S.cheese;
    if (sp.phase === 'leap') {
      const u = Math.min(1, sp.t / .42);
      S.jumpY = 4 * u * (1 - u) * 95 * k; S.sy = 1 + .22 * Math.sin(Math.PI * u);
      if (sp.t > .2) S.face = START_P < S.p ? -1 : 1;
      if (u >= 1) { sp.phase = 'scurry'; sp.t = 0; sp.v = 0; S.jumpY = 0; S.sy = 1; SFX.whoosh(); }
    } else if (sp.phase === 'fall') {
      if (sp.t < .35) S.jumpY = 4 * (sp.t / .35) * (1 - sp.t / .35) * 26 * k;
      const ch = LH * k * .98, ground = S.q * H - .387 * ch;
      if (c.state === 'fall') {
        c.vy += 1500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
        if (c.y >= ground) {
          c.y = ground; if (Math.abs(c.vy) > 150) { c.vy *= -.38; c.vx *= .6; c.vr *= .5; } else { c.vy = 0; c.vx *= .8; c.vr *= .7; }
          if (Math.abs(c.vy) < 1 && Math.abs(c.vx) < 6) { c.state = 'rest'; c.vr = 0; }
        }
      }
      if (c.state === 'rest') { c.rest += dt; c.rot += (Math.round(c.rot / 360) * 360 + 14 - c.rot) * Math.min(1, dt * 8); S.sy += (1 - S.sy) * Math.min(1, dt * 8); if (c.rest > 1.1) { sp.phase = 'scurry'; sp.t = 0; sp.v = 0; S.face = START_P < S.p ? -1 : 1; SFX.whoosh(); } }
    } else if (sp.phase === 'scurry') {
      sp.v = Math.min(1.9, sp.v + dt * 14); S.bobPh += dt * 12;
      if (sp.cause === 'slip') { c.op = Math.max(0, c.op - dt * 2); }
      const ex = START_P - S.p, ey = (START_Q - S.q) * H / W, en = Math.hypot(ex, ey), stp = sp.v * dt;
      if (en <= stp) arrive(); else { S.p += ex / en * stp; S.q += ey / en * stp * W / H; S.face = ex < 0 ? -1 : 1; }
    }
  }

  /* ---------- main update ---------- */
  function update(dt) {
    S.t += dt;
    const want = down.size > 0 || keyHeld, held = want && S.mode === 'walk';
    if (held && !S.held) { S.held = true; S.hold = 0; S.sy = Math.min(S.sy, .8); S.beatT = .1; S.dubT = -1; SFX.squash(); whineStart(); }
    else if (!held && S.held) { S.held = false; const hv = Math.min(1, S.hold / 3); S.hold = 0; whineStop(); SFX.exhale(hv); S.vsy = 1.3; }
    if (S.held) S.hold += dt;
    S.tr = S.held ? Math.min(1, S.hold / MAX_HOLD) : 0;
    const trf = Math.pow(S.tr, 1.25);
    if (S.held && S.hold >= MAX_HOLD) slip();

    if (S.held) {
      S.beatT -= dt; if (S.beatT <= 0) { S.beat = 1; SFX.heart(S.tr); S.dubT = .17; S.beatT = 1.3 - .6 * S.tr; }
      if (S.dubT >= 0) { S.dubT -= dt; if (S.dubT < 0) S.beat = Math.max(S.beat, .55); }
      whineSet(trf);
    }
    S.beat *= Math.exp(-dt * 8);

    if (S.held) { S.sy += (.5 - S.sy) * Math.min(1, dt * 45); S.vsy = 0; }
    else if (S.mode === 'walk' || (S.mode === 'slipped' && S.sp && S.sp.phase !== 'fall')) {
      const a = 85 * (1 - S.sy) - 7.2 * S.vsy; S.vsy += a * dt; S.sy += S.vsy * dt;
    }

    updateDog(dt);

    if (S.mode === 'walk') {
      if (dragId !== null && !S.held) {
        S.started = true;
        const tx = clamp(dragX, .04 * W, .97 * W), ty = clamp(dragY + 10, .14 * H, .95 * H);
        const ex = tx - S.p * W, ey = ty - S.q * H, ed = Math.hypot(ex, ey), spd = Math.min(SPEED * W, ed * 6);
        const tvx = ed > 1 ? ex / ed * spd : 0, tvy = ed > 1 ? ey / ed * spd : 0;
        S.vx += (tvx - S.vx) * Math.min(1, dt * 10); S.vy += (tvy - S.vy) * Math.min(1, dt * 10);
      } else { const f = Math.min(1, dt * (S.held ? 80 : 12)); S.vx -= S.vx * f; S.vy -= S.vy * f; }
      S.p += S.vx * dt / W; S.q += S.vy * dt / H; S.vp = Math.hypot(S.vx, S.vy) / W;
      if (Math.abs(S.vx) > 10) S.face = S.vx > 0 ? 1 : -1;
      if (!S.held) { const ph = S.bobPh; S.bobPh += dt * 3.4 * (S.vp / SPEED); if (Math.floor(S.bobPh) !== Math.floor(ph) && S.vp > SPEED * .3) SFX.step(); }
      if (S.dog === 'awake' && S.coneA > .6) {
        const bb = bearing(), inC = Math.abs(angDiff(S.th, bb.phi)) < CONE_H + bb.ang;
        if (inC && !S.held) S.exposure += dt; else S.exposure = Math.max(0, S.exposure - dt * 2.5);
        if (S.exposure > .25) spot();
      } else S.exposure = Math.max(0, S.exposure - dt * 3);
      if (S.mode === 'walk' && S.p * W >= holeX - 12 * k && Math.abs(S.q * H - holeY) < 34 * k) {
        S.mode = 'done'; S.vp = 0; S.doneT = 0; if (S.held) { S.held = false; whineStop(); } SFX.chime(); vibrate([12, 40, 12]);
        if (S.dog === 'warn' || S.dog === 'awake') toSettle();
      }
    } else if (S.mode === 'done') {
      S.doneT += dt; S.p += (holeX / W - S.p) * Math.min(1, dt * 5); S.q += (holeY / H - S.q) * Math.min(1, dt * 5);
      if (S.doneT > .9 && !reported) { reported = true; done({ x: holeX, y: holeY - holeHH * .45 }); }
    }
    else if (S.sp) updateSp(dt);

    let dt_ = 0;
    if (S.mode === 'walk') {
      if (S.dog === 'warn') dt_ = .25 + .3 * (S.dogT / WARN);
      else if (S.dog === 'awake') {
        const bb = bearing(), gap = Math.max(0, Math.abs(angDiff(S.th, bb.phi)) - CONE_H - bb.ang);
        dt_ = .4 + .6 * Math.pow(1 - clamp(gap / .55, 0, 1), 1.2);
      } else if (S.dog === 'settle') dt_ = .15;
    }
    S.danger += (dt_ - S.danger) * Math.min(1, dt * 6);
    S.ringP = (S.ringP + dt * (.55 + 1.9 * S.danger)) % 1;
    S.hAmt += ((S.held ? 1 : 0) - S.hAmt) * Math.min(1, dt * (S.held ? 30 : 3));

    S.glanceT -= dt;
    if (S.mode === 'walk' && !S.held && S.glanceU < 0 && S.glanceT <= 0) { S.glanceU = 0; S.glanceA = -(S.danger > .3 ? 38 : 26) * (.85 + Math.random() * .3); }
    let tgt = 0;
    if (S.glanceU >= 0) {
      S.glanceU += dt / .95; const u = S.glanceU, b = u < .2 ? u / .2 : u > .75 ? (1 - u) / .25 : 1;
      tgt = S.glanceA * (Math.max(0, b) ** 2 * (3 - 2 * Math.max(0, b)));
      if (u >= 1) { S.glanceU = -1; S.glanceT = S.danger > .3 ? .8 + Math.random() * .9 : 2.2 + Math.random() * 2.2; }
    }
    if (S.held) tgt = -20 + (Math.random() - .5) * trf * 10;
    else if (S.mode === 'slipped') tgt = -32;
    S.head += (tgt - S.head) * Math.min(1, dt * 14);

    const c = S.cheese; if (c.popT < 1) { c.popT = Math.min(1, c.popT + dt / .35); const qq = c.popT - 1; c.pop = 1 + 2.2 * qq * qq * qq + 1.2 * qq * qq; }
  }

  /* ---------- render ---------- */
  const f2 = n => n.toFixed(2);
  function wedge(el, h, Ln) {
    const a = S.th - h, b = S.th + h;
    el.setAttribute('points', `${f2(eyeX)},${f2(eyeY)} ${f2(eyeX + Ln * Math.cos(a))},${f2(eyeY + Ln * Math.sin(a))} ${f2(eyeX + Ln * Math.cos(b))},${f2(eyeY + Ln * Math.sin(b))}`);
  }
  function render() {
    const tr = S.tr, trf = Math.pow(tr, 1.25), amp = RM ? .5 : 1;
    const breathe = S.dog === 'sleep' ? 1 + .012 * Math.sin(S.t * 1.6) : 1;
    dogEl.style.transform = `translate(${f2(S.dx)}px,${f2(S.dy - 4 * S.lift - (S.dogMv ? Math.abs(Math.sin(S.t * 9)) * 3 : 0))}px) rotate(${f2(S.dogMv ? Math.sin(S.t * 9) * 1.6 * S.dface : 0)}deg) scale(${f2(S.dface * (1 + .025 * S.lift))},${f2((1 + .025 * S.lift) * breathe)})`;
    bang.style.left = (dogCx + S.dx + S.dface * dogW * 55 / 230 - bangBW / 2) + 'px'; bang.style.top = Math.max(4, dogTop + S.dy + dogH * 45 / 145 - bangH - 4) + 'px';
    earEl.style.transform = `rotate(${S.earEnv * 14 * Math.sin(S.t * 60)}deg)`;
    const open = S.eo > .08; eyeC.style.opacity = open ? 0 : 1; eyeO.setAttribute('opacity', open ? 1 : 0);
    const sc = 1 + .6 * S.eyeWide; eyeO.style.transform = `scale(${sc},${sc * Math.max(.15, S.eo)})`;
    const gx = (S.dog === 'alert' ? -1.5 : clamp(Math.cos(S.th), -1, 1) * 2.6) * S.dface;
    pupil.style.transform = `translate(${gx}px,${f2(1 + clamp(Math.sin(S.th), -1, 1) * 1.2)}px) scale(${1 - .35 * S.eyeWide})`;
    coneG.setAttribute('opacity', f2(S.coneA));
    if (S.coneA > .01) { cg.setAttribute('cx', f2(eyeX)); cg.setAttribute('cy', f2(eyeY)); const Ln = H * 1.6; wedge(c1, CONE_H, Ln); wedge(c2, CONE_H * 1.15, Ln); wedge(c3, CONE_H * 1.35, Ln); }
    const x = S.p * W, gy = S.q * H;
    const jit = S.held ? (trf * 3.6 * (k / .66) + .15) * amp : 0;
    const jx = (Math.random() - .5) * 2 * jit, jy = (Math.random() - .5) * jit * .5;
    const pulse = 1 + S.beat * (.03 + .04 * trf);
    const sx = clamp(1 / Math.sqrt(S.sy), .85, 1.38);
    const sprint = S.mode === 'spotted' || (S.mode === 'slipped' && S.sp && S.sp.phase === 'scurry');
    const spdR = sprint ? 2.2 : (S.mode === 'walk' && !S.held ? S.vp / SPEED : 0);
    const bob = Math.abs(Math.sin(S.bobPh * Math.PI)) * (sprint ? 3.2 : 2.2) * k * spdR / (sprint ? 2.2 : 1);
    const rock = Math.sin(S.bobPh * Math.PI) * 2.2 * Math.min(1, spdR);
    const ds = S.mode === 'done' ? Math.max(.03, 1 - S.doneT / .8) : 1, op = ds < 1 ? ds : 1;
    const fx = S.face * sx * pulse * ds, fy = S.sy * pulse * ds;
    const mtf = `translate(${f2(x + jx)}px,${f2(gy - bob - S.jumpY + jy)}px) rotate(${f2(rock)}deg) scale(${f2(fx)},${f2(fy)})`;
    bW.style.transform = mtf; hW.style.transform = mtf; bW.style.opacity = op; hW.style.opacity = op;
    const dim = S.held; bW.classList.toggle('dim', dim); hW.classList.toggle('dim', dim); cheeseEl.classList.toggle('dim', dim);
    const nerv = S.exposure > 0 ? S.exposure * 40 : 0;
    headEl.style.transform = `rotate(${f2(S.head + Math.sin(S.t * 45) * nerv)}deg)`;
    tailEl.style.transform = `rotate(${f2(Math.sin(S.t * (S.held ? 30 : 5)) * (S.held ? 2 + 6 * tr : 10))}deg)`;
    const c = S.cheese; cheeseEl.style.opacity = c.state === 'gone' ? 0 : c.op * op;
    if (c.state === 'on') {
      const w = S.held ? trf : 0, drift = Math.max(0, tr - .6) / .4 * 7 * k;
      const rot = Math.sin(S.t * (14 + 24 * w)) * (2 + 18 * w) * amp * (S.held ? 1 : 0) + Math.sin(S.bobPh * Math.PI) * 2 + (Math.random() - .5) * w * 5 * amp;
      const lx = cx0 + drift + Math.sin(S.t * (9 + 10 * w) + 1) * (S.held ? (1 + 5 * w) * k : 0), ly = cy0 - (S.held ? w * 5 * k : 0);
      cheeseEl.style.transform = `${mtf} translate(${f2(lx)}px,${f2(ly)}px) scale(${f2(1 / fx)},${f2(1 / fy)}) rotate(${f2(rot)}deg) scale(${f2(c.pop)})`;
    } else {
      cheeseEl.style.transform = `translate(${f2(c.x)}px,${f2(c.y)}px) rotate(${f2(c.rot)}deg)`;
    }
    const ringStr = S.danger, rcx = x, rcy = gy - 60 * k * S.sy, R0 = 50 * k;
    [r0, r1].forEach((el, i) => {
      const p = (S.ringP + i * .5) % 1, r = R0 * (.85 + 1.25 * (1 - (1 - p) * (1 - p)));
      el.setAttribute('cx', f2(rcx)); el.setAttribute('cy', f2(rcy)); el.setAttribute('rx', f2(r * 1.45)); el.setAttribute('ry', f2(r * .95));
      el.setAttribute('stroke-width', f2(1.5 + 2 * S.danger)); el.setAttribute('opacity', f2(ringStr * .85 * Math.pow(1 - p, 1.4)));
    });
    if (S.hAmt > .003) {
      const h = S.hAmt, cA = .1 * h, eA = (.2 + .5 * trf) * h, rr = Math.max(W, H) * (1.05 - .5 * trf);
      vig._pxVig = { x: rcx, y: rcy, cA, eA, r1: 60 * k, r2: rr };
    } else vig._pxVig = null;
  }

  const px = new Seq.Pixel(root);
  let last = performance.now();
  layout(); resetState();
  return {
    entry: { x: START_P * W, y: START_Q * H - 40 * k },
    frame(now) {
      const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      update(dt); render(); px.render(now);
    },
    destroy() {
      whineStop(); ro.disconnect(); px.destroy(); out.close();
      removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', letGo); document.removeEventListener('visibilitychange', letGo);
    }
  };
};
