/* Step 2 — Swipe the letter to your love (the last scene).
   The tabby's owner carries it up the stairs and shuts it in behind a baby gate at the top. The mouse
   pops out of its hole at the bottom with the love letter. Basketball-style: put a finger on the screen,
   swipe up and let go; the letter flies from your finger. It has to get through the gate and reach the
   kitty, who is excited and keeps running and jumping around on the landing. When it catches the letter
   the hearts come out, and a few seconds later the scene reports that the sequence is finished. */
Seq.scenes.fling = (root, done) => {
  root.classList.add('sc-toss');
  root.innerHTML = `
  <svg class="scene-svg sv" xmlns="http://www.w3.org/2000/svg" aria-label="A kitty is shut in behind a baby gate at the top of the stairs; swipe the love letter up to it"></svg>
  <div class="hint" data-px-ui>Swipe the letter up to your love</div>`;
  const sv = root.querySelector('svg.sv'), hint = root.querySelector('.hint');
  const px = new Seq.Pixel(root, { bg: '#14102e' });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const easeOut = u => 1 - Math.pow(1 - u, 3);
  const easeOutBack = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const f1 = n => n.toFixed(1), f2 = n => n.toFixed(2);
  const { OL, mouseMarkup, tabbyMarkup } = Seq.art;

  /* ---------- sound ---------- */
  const AU = Seq.audio, out = Seq.sceneOut(.85);
  const ok = () => AU.ac && out.get();
  function tone(type, f0, f1_, dur, vol, delay = 0, lp) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1_) o.frequency.exponentialRampToValueAtTime(f1_, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(.012, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = o; if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
    n.connect(g); g.connect(out.get()); o.start(t0); o.stop(t0 + dur + .03);
  }
  function noise(dur, vol, ftype, freq, qq = 1, delay = 0) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay, src = ac.createBufferSource(); src.buffer = AU.nbuf;
    const fl = ac.createBiquadFilter(); fl.type = ftype; fl.frequency.value = freq; fl.Q.value = qq;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(fl).connect(g).connect(out.get()); src.start(t0, Math.random() * .5, dur + .05);
  }
  /* ---------- music: a loop that builds with every throw, then a happy tune when the kitty catches the letter ---------- */
  const MU = { on: false, timer: 0, next: 0, step: 0, level: 0, bus: null };
  const CH = [{ r: 110, t: [220, 261.6, 329.6] }, { r: 87.3, t: [174.6, 220, 261.6] }, { r: 130.8, t: [261.6, 329.6, 392] }, { r: 98, t: [196, 246.9, 293.7] }];
  function mtone(type, f, t0, dur, vol, f2) {
    const ac = AU.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(MU.bus); o.start(t0); o.stop(t0 + dur + .03);
  }
  function mhat(t0, vol) {
    const ac = AU.ac, n = ac.createBufferSource(); n.buffer = AU.nbuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + .04); n.connect(f).connect(g).connect(MU.bus); n.start(t0, Math.random(), .06);
  }
  Seq.tweaks.onChange(() => { if (MU.on) musicLevel(MU.level); });
  function musicTick() {
    const ac = AU.ac; if (!ac || !MU.on) return;
    const lv = MU.level, bpm = 96 + 8 * Math.min(lv, 8), sd = 60 / bpm / 2;
    while (MU.next < ac.currentTime + .18) {
      const i = MU.step, bar = (i >> 4) & 3, j = i & 15, c = CH[bar], t0 = MU.next;
      if (j % 4 === 0) { mtone('triangle', c.r, t0, sd * 3.4, .5); if (lv >= 2) mtone('sine', 120, t0, .12, .5, 45); }
      if (lv >= 1 || j % 2 === 0) { const nt = c.t[[0, 1, 2, 1, 0, 1, 2, 1][j % 8]] * (lv >= 4 && j % 8 > 3 ? 2 : 1); mtone('square', nt, t0, sd * .8, lv >= 1 ? .09 : .05); }
      if (lv >= 3 && j % 2 === 1) mhat(t0, .12);
      if (lv >= 5 && j % 8 === 0) { mtone('sawtooth', c.t[2] * 2, t0, sd * 7, .07); mtone('sawtooth', c.t[0] * 4, t0, sd * 7, .04); }
      if (lv >= 7 && j % 2 === 0) mtone('triangle', c.t[(j >> 1) % 3] * 4, t0, sd * .6, .06);
      MU.next += sd; MU.step++;
    }
  }
  function musicLevel(n) {
    MU.level = n; if (!MU.bus) return; const ac = AU.ac;
    MU.bus.gain.cancelScheduledValues(ac.currentTime); MU.bus.gain.linearRampToValueAtTime((.16 + .05 * Math.min(n, 8)) * Seq.tweaks.get('music'), ac.currentTime + .5);
  }
  function musicStart() {
    if (!ok() || MU.on) return; const ac = AU.ac;
    MU.bus = ac.createGain(); MU.bus.gain.value = .0001; MU.bus.connect(out.get()); MU.on = true; MU.next = ac.currentTime + .05; MU.step = 0;
    musicLevel(Lt.tries || 0); MU.timer = setInterval(musicTick, 40);
  }
  function musicStop(fade = .25) {
    clearInterval(MU.timer); MU.on = false; if (!MU.bus || !AU.ac) return; const b = MU.bus; MU.bus = null;
    try { b.gain.cancelScheduledValues(AU.ac.currentTime); b.gain.linearRampToValueAtTime(.0001, AU.ac.currentTime + fade); } catch (e) {}
    setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 600);
  }
  // the happy tune (C major, bouncy): melody, bass and a sparkle on top
  function happySong() {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + .05, B = .15;
    const mel = [[523, 1], [659, 1], [784, 1], [1047, 2], [988, 1], [1047, 1], [1175, 2], [1319, 2], [1175, 1], [1047, 1], [988, 1], [784, 1], [880, 2], [1047, 1], [1319, 1], [1568, 4]];
    let at = 0; const bus = ac.createGain(); bus.gain.value = .9 * Seq.tweaks.get('music'); bus.connect(out.get());
    const mt = (type, f, w, d, v) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t0 + w); g.gain.exponentialRampToValueAtTime(v, t0 + w + .015); g.gain.exponentialRampToValueAtTime(.0001, t0 + w + d); o.connect(g); g.connect(bus); o.start(t0 + w); o.stop(t0 + w + d + .03); };
    for (const [f, n] of mel) { mt('triangle', f, at * B, n * B * .95, .16); mt('sine', f * 2, at * B, n * B * .6, .05); at += n; }
    [[130.8, 0], [196, 4], [174.6, 8], [196, 12], [130.8, 16]].forEach(([f, st_]) => { mt('triangle', f, st_ * B, 4 * B, .22); mt('sine', f * 2, st_ * B + B, 3 * B, .06); });
    [[261.6, 329.6, 392, 0], [220, 261.6, 349.2, 8], [261.6, 329.6, 392, 16]].forEach(([a, b2, c, st_]) => [a, b2, c].forEach(f => mt('square', f, st_ * B, 7 * B, .035)));
    for (let k = 0; k < 10; k++) mt('sine', 2093 + (k % 3) * 523, (14 + k * .55) * B, .1, .035);
    setTimeout(() => { try { bus.disconnect(); } catch (e) {} }, (at * B + 1.5) * 1000);
  }
  const snd = {
    mew(p = 1) { Seq.meow(out.get(), 600 * p, .4, .2); },
    mewBig() { Seq.meow(out.get(), 680, .6, .26); Seq.meow(out.get(), 740, .4, .2, .7); },
    squeak() { tone('sine', 1900, 2700, .07, .05); tone('sine', 2300, 3000, .06, .035, .07); },
    step() { noise(.05, .05, 'lowpass', 700, .8); },
    patter() { noise(.04, .04, 'bandpass', 1800 + Math.random() * 500, 1.3); },
    latch() { tone('square', 520, 380, .05, .05, 0, 1800); tone('square', 760, 600, .06, .04, .09, 1800); },
    whoosh() { noise(.28, .07, 'bandpass', 1400, .7); tone('sine', 500, 1200, .22, .035); },
    clank() { tone('triangle', 900, 520, .18, .09); tone('triangle', 1340, 800, .14, .05, .01); noise(.08, .05, 'bandpass', 2400, 1); },
    thud() { noise(.09, .06, 'lowpass', 500, .8); },
    pop() { tone('sine', 380, 760, .08, .11); },
    catchS() { tone('sine', 659, null, .3, .08); tone('sine', 880, null, .3, .07, .1); tone('sine', 1318, null, .5, .06, .2); tone('sine', 1760, null, .5, .04, .32); }
  };

  /* ---------- art ---------- */
  /* the owner: a Tomodachi-Life style character: big round head, tiny features, cool outfit */
  function ownerMarkup() {
    const SK = '#c98f5e', SKD = '#a8703f', PINK = '#ff7fa3', PINK2 = '#e0608a', PANT = '#1c1a26', HAIR = '#15101c', HAIR2 = '#4b4466';
    const leg = (cls, x) => `<g class="${cls}"><rect x="${x}" y="-42" width="15" height="40" rx="7" fill="${PANT}" stroke="${OL}" stroke-width="3"/><path d="M${x + 7.5} -38 V-10" stroke="#f1ece0" stroke-width="2.4"/><path d="M${x - 3} -19 h19 v10 q10 1 12 8 v3 h-31z" fill="#1a1620" stroke="${OL}" stroke-width="3"/><rect x="${x - 4}" y="-5" width="35" height="7" rx="2.5" fill="#f1ece0" stroke="${OL}" stroke-width="2.6"/><path d="M${x - 2} -7 h31" stroke="#f4d35e" stroke-width="2"/><path d="M${x + 1} -16 h13 M${x + 1} -12 h13" stroke="#f4d35e" stroke-width="1.6"/></g>`;
    const arm = cls => `<g class="${cls}" transform="translate(4 -84)"><path d="M0 0 L0 15" stroke="${OL}" stroke-width="19" fill="none"/><path d="M0 0 L0 15" stroke="${PINK}" stroke-width="13" fill="none"/><path d="M0 14 L0 36" stroke="${OL}" stroke-width="14" fill="none"/><path d="M0 14 L0 36" stroke="${SK}" stroke-width="8" fill="none"/><circle cx="0" cy="39" r="7" fill="${SK}" stroke="${OL}" stroke-width="2.6"/></g>`;
    const back = `<g class="oRoot" stroke-linejoin="round" stroke-linecap="round">
      ${leg('oLegB', -8)}
      ${arm('oArmB')}
      <g class="oBody">
        <rect x="-25" y="-92" width="50" height="56" rx="17" fill="${PINK}" stroke="${OL}" stroke-width="3"/>
        <path d="M-17 -88 Q0 -76 19 -88" fill="none" stroke="${PINK2}" stroke-width="3.4"/>
        <path d="M-12 -82 Q2 -62 16 -82" fill="none" stroke="#f4d35e" stroke-width="2.2"/><circle cx="2" cy="-63" r="3" fill="#f4d35e" stroke="${OL}" stroke-width="1.6"/>
        <path d="M-8 -60 q-6 -7 0 -10 q4 -2 6 2 q2 -4 6 -2 q6 3 0 10 q-3 4 -6 7 q-3 -3 -6 -7z" fill="#fff" opacity=".9" transform="translate(5 -1) scale(.8)"/>
        <path d="M-25 -44 Q0 -34 25 -44" fill="none" stroke="${PINK2}" stroke-width="3"/>
        <g class="oHead" transform="translate(2 -92)">
          <path d="M-40 -50 C-56 -20 -50 12 -30 18 C-22 6 -32 -16 -30 -44Z" fill="${HAIR}" stroke="${OL}" stroke-width="3"/>
          <circle cx="-24" cy="-90" r="13" fill="${HAIR}" stroke="${OL}" stroke-width="3"/><path d="M-34 -84 q10 8 20 0" fill="none" stroke="#ff7fa3" stroke-width="4.4"/>
          <ellipse cx="0" cy="-33" rx="39" ry="35" fill="${SK}" stroke="${OL}" stroke-width="3.2"/>
          <circle cx="-34" cy="-28" r="8.5" fill="${SK}" stroke="${OL}" stroke-width="2.8"/><circle cx="-34" cy="-27" r="3.6" fill="${SKD}"/>
          <circle cx="-34" cy="-14" r="5.2" fill="none" stroke="#f4d35e" stroke-width="2.4"/>
          <path d="M-42 -34 C-52 -64 -30 -88 4 -86 C34 -88 52 -62 41 -40 C37 -52 32 -56 22 -56 C26 -48 12 -52 4 -46 C-4 -58 -22 -54 -30 -38 C-32 -32 -37 -28 -42 -34Z" fill="${HAIR}" stroke="${OL}" stroke-width="3"/>
          <path d="M-12 -80 C-6 -100 26 -98 30 -80 C18 -88 4 -86 -12 -80Z" fill="${HAIR}" stroke="${OL}" stroke-width="3"/>
          <path d="M-6 -84 q10 -6 20 -3 M14 -66 q10 4 16 12" fill="none" stroke="${HAIR2}" stroke-width="2.6"/>
          <ellipse cx="12" cy="-30" rx="4.4" ry="6.8" fill="${OL}"/><circle cx="13.6" cy="-33" r="1.9" fill="#fff"/><circle cx="11" cy="-26.5" r="1" fill="#fff"/>
          <ellipse cx="31" cy="-30" rx="4.4" ry="6.8" fill="${OL}"/><circle cx="32.6" cy="-33" r="1.9" fill="#fff"/><circle cx="30" cy="-26.5" r="1" fill="#fff"/>
          <path d="M7 -26 l-5 -3 M7 -32 l-5 -5 M26 -26 l-5 -3 M26 -32 l-5 -5 M37 -34 l4 -4 M37 -28 l5 -2" fill="none" stroke="${OL}" stroke-width="2"/>
          <path d="M5 -44 q7 -3 14 0 M24 -44 q7 -3 14 0" fill="none" stroke="${OL}" stroke-width="2"/>
          <circle cx="12" cy="-30" r="12.5" fill="rgba(255,255,255,.2)" stroke="${OL}" stroke-width="2.8"/><circle cx="31" cy="-30" r="12.5" fill="rgba(255,255,255,.2)" stroke="${OL}" stroke-width="2.8"/>
          <path d="M24 -32 q-.5 -2 -1 0 M-.5 -31 L-30 -30" fill="none" stroke="${OL}" stroke-width="2.4"/>
          <path d="M5 -37 q3 -4 7 -4" fill="none" stroke="#fff" stroke-width="1.8" opacity=".8"/>
          <ellipse cx="7" cy="-17" rx="5" ry="3.2" fill="#ff7fa3" opacity=".55"/><ellipse cx="36" cy="-17" rx="4" ry="3" fill="#ff7fa3" opacity=".55"/>
          <path d="M19 -21 q3 3 6 0" fill="none" stroke="${SKD}" stroke-width="2.2"/>
          <path d="M14 -12 Q22 -5 30 -12" fill="#7a2c3c" stroke="${OL}" stroke-width="2.2"/><path d="M17 -11 Q22 -8 27 -11" fill="#fff" />
        </g>
      </g>
      ${leg('oLegF', 2)}
    </g>`;
    return { back, front: `<g class="oFront" stroke-linejoin="round" stroke-linecap="round">${arm('oArmF')}</g>` };
  }
  const OWN = ownerMarkup();
  const BANG = `<g transform="translate(-11 0) rotate(-8)"><path d="M-4 -26 h8 l-2 20 h-4Z" fill="#e5475c" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="3.8" fill="#e5475c" stroke="${OL}" stroke-width="2.2"/></g><g transform="translate(11 -4) rotate(8) scale(1.2)"><path d="M-4 -26 h8 l-2 20 h-4Z" fill="#e5475c" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="3.8" fill="#e5475c" stroke="${OL}" stroke-width="2.2"/></g>`;
  const heartPath = '<path d="M0 6 q-10 -10 -12 -3 q0 7 12 14 q12 -7 12 -14 q-2 -7 -12 3z" fill="#ff7fa3" stroke="#0c0818" stroke-width="2.2" stroke-linejoin="round"/>';

  /* ---------- geometry ---------- */
  let W = 1, H = 1, sf = 1, yG = 1, yU = 1, fx = 0, tx = 0, nSt = 9, rise = 1, run = 1, gx = 0, gw = 30, gH = 130, kMin = 0, kMax = 0, mx = 0, hx = 0, kStart = 0, G = 1250;
  const stairY = x => x < fx ? yG : x >= tx ? yU : yG - (Math.min(nSt - 1, Math.floor((x - fx) / run)) + 1) * rise;
  let rails = [];                                     // rail centres (screen y) of the gate that the letter can hit

  function bgMarkup() {
    const w = W, h = H, slab = 16 * sf;
    // the roof: a gable over the whole house, so the wall stops at the ceiling instead of running off the top
    const yC = yU - 230 * sf, rh = Math.min(210 * sf, yC - 70), yT = yC - rh;
    let roof = `<rect x="0" y="0" width="${w}" height="${f1(yC)}" fill="#1d1049"/>`;
    for (let i = 0; i < 14; i++) roof += `<circle cx="${f1((i * 97 % 390) * sf)}" cy="${f1(8 + (i * 53 % Math.max(10, yT - 10)))}" r="${i % 3 ? 1.3 : 1.9}" fill="#fff"/>`;
    roof += `<circle cx="${f1(w * .13)}" cy="${f1(Math.max(26, yT * .5))}" r="${f1(15 * sf)}" fill="#f1e9ff"/><circle cx="${f1(w * .13 + 7 * sf)}" cy="${f1(Math.max(26, yT * .5) - 5 * sf)}" r="${f1(14 * sf)}" fill="#1d1049"/>`;
    roof += `<rect x="${f1(w * .74)}" y="${f1(yT + rh * .1)}" width="${f1(34 * sf)}" height="${f1(rh * .6)}" fill="#6b3a22" stroke="${OL}" stroke-width="2.8"/><rect x="${f1(w * .74 - 4 * sf)}" y="${f1(yT + rh * .1)}" width="${f1(42 * sf)}" height="${f1(8 * sf)}" fill="#8a4a30" stroke="${OL}" stroke-width="2.6"/>`;
    roof += `<polygon points="${f1(-6 * sf)},${f1(yC + 2)} ${f1(w / 2)},${f1(yT)} ${f1(w + 6 * sf)},${f1(yC + 2)}" fill="#5638a6" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>`;
    const rows = 7;
    for (let i = 0; i < rows; i++) {
      const ya = yT + rh * (i / rows), yb = yT + rh * ((i + 1) / rows), xa = w / 2 - (w / 2 + 6 * sf) * (i / rows), xb = w / 2 - (w / 2 + 6 * sf) * ((i + 1) / rows);
      roof += `<polygon points="${f1(xa)},${f1(ya)} ${f1(w - xa)},${f1(ya)} ${f1(w - xb)},${f1(yb)} ${f1(xb)},${f1(yb)}" fill="${i % 2 ? '#6c63b6' : '#5638a6'}" stroke="${OL}" stroke-width="2"/>`;
      let sh = ''; for (let x = xb + (i % 2 ? 0 : 12 * sf); x < w - xb; x += 24 * sf) sh += `M${f1(x)} ${f1(ya)}V${f1(yb)}`;
      roof += `<path d="${sh}" stroke="rgba(12,8,24,.45)" stroke-width="1.6"/>`;
    }
    roof += `<rect x="${f1(-6 * sf)}" y="${f1(yC - 2)}" width="${f1(w + 12 * sf)}" height="${f1(12 * sf)}" fill="#2b2260" stroke="${OL}" stroke-width="2.8"/><rect x="0" y="${f1(yC + 10 * sf)}" width="${w}" height="${f1(4 * sf)}" fill="rgba(0,0,0,.3)"/>`;
    roof += `<circle cx="${f1(w / 2)}" cy="${f1(yT + rh * .42)}" r="${f1(20 * sf)}" fill="#1d1049" stroke="${OL}" stroke-width="3"/><circle cx="${f1(w / 2)}" cy="${f1(yT + rh * .42)}" r="${f1(14 * sf)}" fill="#ffd98a"/><path d="M${f1(w / 2 - 14 * sf)} ${f1(yT + rh * .42)}h${f1(28 * sf)}M${f1(w / 2)} ${f1(yT + rh * .42 - 14 * sf)}v${f1(28 * sf)}" stroke="${OL}" stroke-width="2.4"/>`;
    let paper = '', planks = '', steps = '', posts = '';
    for (let x = 10 * sf; x < w; x += 24 * sf) paper += `M${f1(x)} 0V${f1(yG)}`;
    for (let x = 0; x < w; x += 58 * sf) planks += `M${f1(x)} ${f1(yG)}V${h}`;
    for (let i = 0; i < nSt; i++) {
      const x0 = fx + i * run, yt = yG - (i + 1) * rise;
      steps += `<rect x="${f1(x0)}" y="${f1(yt)}" width="${f1(tx - x0 + 2)}" height="${f1(yG - yt + 1)}" fill="${i % 2 ? '#8a4a30' : '#9a5632'}" stroke="${OL}" stroke-width="2.4"/><rect x="${f1(x0)}" y="${f1(yt)}" width="${f1(run + 3)}" height="${f1(5 * sf)}" fill="#e8c08a"/>`;
      posts += `<rect x="${f1(x0 + run * .35)}" y="${f1(yt - 62 * sf)}" width="${f1(5 * sf)}" height="${f1(62 * sf)}" fill="#dedcf0" stroke="${OL}" stroke-width="2"/>`;
    }
    const lx = W * .78, lamp = `<line x1="${f1(lx)}" y1="${f1(yU + slab)}" x2="${f1(lx)}" y2="${f1(yU + 70 * sf)}" stroke="${OL}" stroke-width="3"/><path d="M${f1(lx - 26 * sf)} ${f1(yU + 106 * sf)} L${f1(lx - 12 * sf)} ${f1(yU + 70 * sf)} H${f1(lx + 12 * sf)} L${f1(lx + 26 * sf)} ${f1(yU + 106 * sf)}Z" fill="#ffd98a" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="${f1(lx)}" cy="${f1(yU + 150 * sf)}" rx="${f1(70 * sf)}" ry="${f1(60 * sf)}" fill="rgba(255,217,138,.16)"/>`;
    const px0 = W * .82, plant = `<path d="M${f1(px0 - 16 * sf)} ${f1(yG)}h${f1(32 * sf)}l${f1(-5 * sf)} ${f1(-30 * sf)}h${f1(-22 * sf)}z" fill="#c46a38" stroke="${OL}" stroke-width="2.4"/><ellipse cx="${f1(px0 - 10 * sf)}" cy="${f1(yG - 56 * sf)}" rx="${f1(8 * sf)}" ry="${f1(26 * sf)}" fill="#4f9a6a" stroke="${OL}" stroke-width="2" transform="rotate(-22 ${f1(px0 - 10 * sf)} ${f1(yG - 56 * sf)})"/><ellipse cx="${f1(px0 + 10 * sf)}" cy="${f1(yG - 56 * sf)}" rx="${f1(8 * sf)}" ry="${f1(26 * sf)}" fill="#4f9a6a" stroke="${OL}" stroke-width="2" transform="rotate(22 ${f1(px0 + 10 * sf)} ${f1(yG - 56 * sf)})"/><ellipse cx="${f1(px0)}" cy="${f1(yG - 64 * sf)}" rx="${f1(9 * sf)}" ry="${f1(30 * sf)}" fill="#2f5d4a" stroke="${OL}" stroke-width="2"/>`;
    // the landing room (upper floor)
    const rx0 = tx, rw = W - tx, rt = yU - 230 * sf;
    const win = { x: W * .66, y: yU - 205 * sf, w: 64 * sf, h: 84 * sf };
    const room = `<rect x="${f1(rx0)}" y="${f1(rt)}" width="${f1(rw)}" height="${f1(yU - rt)}" fill="#3a3178"/>`
      + `<path d="${(() => { let p = ''; for (let x = rx0 + 12 * sf; x < W; x += 20 * sf) p += `M${f1(x)} ${f1(rt)}V${f1(yU)}`; return p; })()}" stroke="rgba(0,0,0,.16)" stroke-width="1.6"/>`
      + `<rect x="${f1(rx0)}" y="${f1(rt)}" width="${f1(rw)}" height="${f1(7 * sf)}" fill="#6c63b6"/>`
      + `<rect x="${f1(rx0)}" y="${f1(yU - 12 * sf)}" width="${f1(rw)}" height="${f1(12 * sf)}" fill="#dedcf0"/>`
      + `<rect x="${f1(win.x - 4)}" y="${f1(win.y - 4)}" width="${f1(win.w + 8)}" height="${f1(win.h + 8)}" fill="#dedcf0" stroke="${OL}" stroke-width="2.4"/><rect x="${f1(win.x)}" y="${f1(win.y)}" width="${f1(win.w)}" height="${f1(win.h)}" fill="#1d1049"/>`
      + `<circle cx="${f1(win.x + win.w * .68)}" cy="${f1(win.y + win.h * .3)}" r="${f1(win.w * .13)}" fill="#f1e9ff"/><circle cx="${f1(win.x + win.w * .68 + win.w * .07)}" cy="${f1(win.y + win.h * .3 - win.w * .05)}" r="${f1(win.w * .12)}" fill="#1d1049"/>`
      + `<path d="M${f1(win.x + win.w / 2)} ${f1(win.y)}V${f1(win.y + win.h)}M${f1(win.x)} ${f1(win.y + win.h * .55)}H${f1(win.x + win.w)}" stroke="#dedcf0" stroke-width="2.6"/>`
      + `<rect x="${f1(W * .88)}" y="${f1(yU - 150 * sf)}" width="${f1(34 * sf)}" height="${f1(44 * sf)}" fill="#8981cd" stroke="${OL}" stroke-width="2.4"/><rect x="${f1(W * .88 + 5 * sf)}" y="${f1(yU - 145 * sf)}" width="${f1(24 * sf)}" height="${f1(34 * sf)}" fill="#ffc4d6"/>`
      + `<ellipse cx="${f1(W * .82)}" cy="${f1(yU - 4 * sf)}" rx="${f1(40 * sf)}" ry="${f1(8 * sf)}" fill="#c4577f" stroke="${OL}" stroke-width="2.4"/>`;
    return `
    <rect width="${w}" height="${h}" fill="#322a6b"/>
    <path d="${paper}" stroke="rgba(0,0,0,.16)" stroke-width="1.6" fill="none"/>
    ${roof}
    <rect x="0" y="${f1(yG - 12 * sf)}" width="${w}" height="${f1(12 * sf)}" fill="#dedcf0"/>
    <rect x="0" y="${f1(yG)}" width="${w}" height="${f1(h - yG)}" fill="#a8643a"/><path d="${planks}" stroke="rgba(30,12,8,.45)" stroke-width="2" fill="none"/>
    <rect x="0" y="${f1(yG)}" width="${w}" height="3" fill="${OL}"/>
    ${room}
    <rect x="${f1(tx)}" y="${f1(yU)}" width="${f1(W - tx)}" height="${f1(slab)}" fill="#8a4a30" stroke="${OL}" stroke-width="2.6"/><rect x="${f1(tx)}" y="${f1(yU)}" width="${f1(W - tx)}" height="${f1(5 * sf)}" fill="#e8c08a"/>
    ${lamp}${plant}
    <g stroke-linejoin="round">${steps}</g>
    <path d="M${f1(fx + run * .5)} ${f1(yG - rise - 62 * sf)} L${f1(tx)} ${f1(yU - 62 * sf)}" stroke="${OL}" stroke-width="${f1(9 * sf)}" stroke-linecap="round"/><path d="M${f1(fx + run * .5)} ${f1(yG - rise - 62 * sf)} L${f1(tx)} ${f1(yU - 62 * sf)}" stroke="#ffc4d6" stroke-width="${f1(5 * sf)}" stroke-linecap="round"/>
    <g stroke-linejoin="round">${posts}</g>
    <!-- the mouse hole -->
    <path d="M${f1(hx - 22 * sf)} ${f1(yG)}V${f1(yG - 30 * sf)}A${f1(22 * sf)} ${f1(22 * sf)} 0 0 1 ${f1(hx + 22 * sf)} ${f1(yG - 30 * sf)}V${f1(yG)}Z" fill="#6c63b6" stroke="${OL}" stroke-width="2.6"/>
    <path d="M${f1(hx - 17 * sf)} ${f1(yG)}V${f1(yG - 30 * sf)}A${f1(17 * sf)} ${f1(17 * sf)} 0 0 1 ${f1(hx + 17 * sf)} ${f1(yG - 30 * sf)}V${f1(yG)}Z" fill="#0b0624"/>
    <g class="hEyes" opacity="0"><circle cx="${f1(hx - 6 * sf)}" cy="${f1(yG - 16 * sf)}" r="${f1(3 * sf)}" fill="#fff"/><circle cx="${f1(hx + 6 * sf)}" cy="${f1(yG - 16 * sf)}" r="${f1(3 * sf)}" fill="#fff"/></g>
    <g class="shadows"><ellipse class="shO" rx="1" ry="1" fill="rgba(5,2,15,.45)"/><ellipse class="shM" rx="1" ry="1" fill="rgba(5,2,15,.45)"/><ellipse class="shK" rx="1" ry="1" fill="rgba(5,2,15,.45)"/><ellipse class="shL" rx="1" ry="1" fill="rgba(5,2,15,.4)"/></g>
    <g class="mouseA">${mouseMarkup}</g>
    <g class="ownerA">${OWN.back}</g>
    <g class="kitA"><g class="kitS" stroke-linejoin="round" stroke-linecap="round">${tabbyMarkup()}</g></g>
    <g class="gate"></g>
    <g class="ownerF">${OWN.front}</g>
    <g class="ghost"></g>
    <g class="lt"><use href="#letterArt" transform="translate(-80 -55)"/></g>
    <g class="fx"></g>
    <g class="bangK" opacity="0">${BANG}</g>`;
  }
  function gateMarkup() {
    const bw = 6 * sf, rt = 7 * sf, o = `stroke="${OL}" stroke-width="2.4"`;
    let m = `<rect x="0" y="${f1(-gH)}" width="${f1(bw)}" height="${f1(gH)}" fill="#ffc4d6" ${o}/><rect x="${f1(gw - bw)}" y="${f1(-gH)}" width="${f1(bw)}" height="${f1(gH)}" fill="#ffc4d6" ${o}/>`;
    m += `<rect x="0" y="${f1(-gH)}" width="${f1(gw)}" height="${f1(rt + 1)}" fill="#ffc4d6" ${o}/><rect x="0" y="${f1(-rt - 1)}" width="${f1(gw)}" height="${f1(rt + 1)}" fill="#ffc4d6" ${o}/>`;
    for (const r of RAILF) m += `<rect x="0" y="${f1(-gH * r - rt / 2)}" width="${f1(gw)}" height="${f1(rt)}" fill="#ffc4d6" ${o}/>`;
    m += `<circle cx="${f1(gw - bw / 2)}" cy="${f1(-gH * .5)}" r="${f1(4.2 * sf)}" fill="#f4d35e" ${o}/>`;
    return m;
  }
  const RAILF = [.4, .74];                            // middle rails (fractions of the gate height)

  /* ---------- state ---------- */
  const M = { x: 0, y: 0, face: 1, phase: 0, sp: 0, walkAmt: 0, sq: 1, hop: 0, stand: 0, look: 0, ear: 0, s: 1, vis: 0, joy: 0 };
  const K = { x: 0, y: 0, h: 0, vh: 0, mode: 'held', tx: 0, speed: 0, pt: 0, jt: 1, mewT: 1, face: 1, lean: 0, sqx: 1, sqy: 1, look: 0 };
  const Lt = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, mode: 'hand', restT: 0, bounced: false, trail: [], ghost: [] };
  const O = { x: -999, y: 0, face: 1, walk: 0, phase: 0, hold: 1, vis: 1 };
  let st = 'intro', stT = 0, t = 0, shake = 0, gateOpen = 0.12, hintOn = false, lastStep = 0, hearts = [], reported = false, drag = null, tries = 0;
  const setState = n => { st = n; stT = 0; };
  let el = {};

  /* the owner's trip: a list of segments (walk from -> to, or stand still) */
  let seg = [], segTotal = 0;
  function buildTrip() {
    const P = (x, y) => ({ x, y }), floorTo = P(fx - 6 * sf, yG), top = P(tx - 10 * sf, yU), place = P(kStart - 26 * sf, yU), gate = P(tx - 4 * sf, yU);
    seg = []; let c = 0;
    const add = (kind, from, to, dur, extra) => { seg.push(Object.assign({ kind, from, to, t0: c, dur }, extra)); c += dur; };
    add('walk', P(-70 * sf, yG), floorTo, 1.0, { hold: 1, face: 1 });
    add('walk', floorTo, top, 2.0, { hold: 1, face: 1, stairs: 1 });
    add('walk', top, place, .65, { hold: 1, face: 1 });
    add('stand', place, place, .8, { hold: 1, face: 1, putdown: 1 });
    add('walk', place, gate, .6, { hold: 0, face: -1 });
    add('stand', gate, gate, .4, { hold: 0, face: -1, closing: 1 });
    add('walk', gate, floorTo, 1.0, { hold: 0, face: -1, stairs: 1 });
    add('walk', floorTo, P(-90 * sf, yG), .7, { hold: 0, face: -1 });
    segTotal = c;
  }
  const segAt = T => seg.find(s => T >= s.t0 && T < s.t0 + s.dur) || seg[seg.length - 1];

  function layout() {
    const r = root.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height); sf = W / 390;
    sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
    yG = H * .88; yU = H * .62; fx = W * .2; tx = W * .5; rise = (yG - yU) / nSt; run = (tx - fx) / nSt;
    gx = tx + 2 * sf; gw = 24 * sf; gH = 128 * sf * Seq.tweaks.get('gateHeight'); kMin = gx + gw + 30 * sf; kMax = W - 30 * sf; hx = W * .045; mx = W * .1; kStart = W * .8; G = 1250 * sf;
    rails = [gH * RAILF[0], gH * RAILF[1], gH].map(v => yU - v);
    sv.innerHTML = bgMarkup();
    const q = s => sv.querySelector(s);
    el = { gate: q('.gate'), shO: q('.shO'), shM: q('.shM'), shK: q('.shK'), shL: q('.shL'), mouse: q('.mouseA'), owner: q('.ownerA'), ownerF: q('.ownerF'), kit: q('.kitA'), kitS: q('.kitS'), ghost: q('.ghost'), lt: q('.lt'), fx: q('.fx'), bang: q('.bangK'), hEyes: q('.hEyes') };
    el.gate.innerHTML = gateMarkup();
    const m = s => el.mouse.querySelector(s);
    el.m = { root: m('.mRoot'), squash: m('.mSquash'), body: m('.mBody'), head: m('.mHead'), ear: m('.mEar'), tail: m('.mTail'), bn: m('.mLegBN'), bf: m('.mLegBF'), fn: m('.mLegFN'), ff: m('.mLegFF'), letter: m('.mLetter') };
    const o = s => el.owner.querySelector(s), of = s => el.ownerF.querySelector(s);
    el.o = { root: o('.oRoot'), legA: o('.oLegF'), legB: o('.oLegB'), armB: o('.oArmB'), body: o('.oBody'), head: o('.oHead'), armF: of('.oArmF') };
    const k = s => el.kit.querySelector(s);
    el.k = { tail: k('.cTail'), body: k('.cBody'), head: k('.cHead'), eyes: [...el.kit.querySelectorAll('.cEyeScale')], pupils: [...el.kit.querySelectorAll('.cPupil')] };
    buildTrip();
    if (!M.init) { M.init = true; M.x = hx; M.y = yG + 6 * sf; Lt.x = mx; Lt.y = yG - 50 * sf; }
    M.y = yG + 6 * sf; K.y = yU;
  }

  /* ---------- kitty: excited, runs and jumps around the landing ---------- */
  function pickRun() {
    let nx = lerp(kMin, kMax, Math.random());
    for (let i = 0; i < 12 && Math.abs(nx - K.x) < 50 * sf; i++) nx = lerp(kMin, kMax, Math.random());
    K.tx = nx; K.speed = (240 + Math.random() * 140) * sf * Seq.tweaks.get('kitty'); K.mode = 'run'; K.jt = Math.min(K.jt, (.25 + Math.random() * .6) / Seq.tweaks.get('kitty'));
  }
  function startJump(big) { if (K.h > 1) return; K.vh = (big ? 560 : 380 + Math.random() * 140) * sf; K.jt = (.4 + Math.random() * .8) / Seq.tweaks.get('kitty'); K.sqy = 1.18; }
  function updateKitty(dt) {
    if (K.mode === 'held' || K.mode === 'hop') return;
    K.mewT -= dt; if (K.mewT < 0) { K.mewT = 1.5 + Math.random() * 1.5; if (st === 'game' && K.mode !== 'catch') snd.mew(.95 + Math.random() * .25); }
    if (K.mode === 'catch') { K.h = Math.max(0, K.h + K.vh * dt); K.vh -= 1700 * sf * dt; if (K.h <= 0) { K.h = 0; if (stT < 1.6) K.vh = 330 * sf; else K.vh = 0; } return; }
    if (K.mode === 'pause') { K.pt -= dt; if (K.pt <= 0) pickRun(); }
    else {
      const d = K.tx - K.x, dir = Math.sign(d) || 1, step = Math.min(Math.abs(d), K.speed * dt);
      K.x += dir * step; K.face = dir;
      if (Math.abs(K.tx - K.x) < 4) { K.mode = 'pause'; K.pt = .05 + Math.random() * .22; if (Math.random() < .5) startJump(true); }
    }
    K.jt -= dt; if (K.jt <= 0) startJump(false);
    if (K.h > 0 || K.vh > 0) {
      K.h += K.vh * dt; K.vh -= 1700 * sf * dt;
      if (K.h <= 0) { K.h = 0; K.vh = 0; K.sqy = .82; K.sqx = 1.14; }
    }
    K.lean = lerp(K.lean, (K.mode === 'run' ? K.face * 9 : 0) - K.vh * .004 * K.face, Math.min(1, dt * 12));
    K.sqx = lerp(K.sqx, 1, Math.min(1, dt * 10)); K.sqy = lerp(K.sqy, 1, Math.min(1, dt * 10));
  }
  const kitCenter = () => ({ x: K.x, y: yU - K.h - 40 * sf });

  /* ---------- the letter ---------- */
  const LH = 9 * sf;
  const handPos = () => { const sc = .75 * sf * M.s * Seq.tweaks.get('mouseSize'); return { x: M.x + M.face * -6 * sc, y: M.y + sc * (-50 - M.stand * 10) }; };
  function launch(x, y, vx, vy) {
    Object.assign(Lt, { mode: 'fly', x, y, vx, vy, vr: (vx >= 0 ? 1 : -1) * 6, rot: 0, bounced: false, restT: 0 });
    Lt.ghost = Lt.trail; Lt.trail = []; tries++; Lt.tries = tries; musicLevel(tries);
    snd.whoosh(); M.stand = .3; M.hop = 10 * sf;
  }
  function resetLetter() { Lt.mode = 'hand'; Lt.rot = 0; Lt.vx = Lt.vy = 0; Lt.bounced = false; M.joy = 0; }
  function bounceOff(dir) { Lt.vx = dir * Math.abs(Lt.vx) * .4 + dir * 60 * sf; Lt.vy = Math.abs(Lt.vy) * .15; Lt.vr = dir * 9; Lt.bounced = true; snd.clank(); shake = .35; }
  function catchIt() {
    Lt.mode = 'caught'; K.mode = 'catch'; K.vh = 380 * sf; setState('win'); musicStop(.15); happySong(); snd.catchS(); snd.mewBig(); Seq.vib([20, 40, 20]);
    for (let i = 0; i < 16; i++) hearts.push({ x: K.x + (Math.random() - .5) * 40 * sf, y: yU - 60 * sf, vx: (Math.random() - .5) * 220 * sf, vy: -(120 + Math.random() * 220) * sf, a: 0, s: .8 + Math.random() * .8, life: 1.6 + Math.random() });
  }
  function updateLetter(dt) {
    if (Lt.mode === 'hand') { const p = handPos(); Lt.x = p.x; Lt.y = p.y; return; }
    if (Lt.mode === 'drag') { Lt.rot = lerp(Lt.rot, 0, Math.min(1, dt * 8)); return; }
    if (Lt.mode === 'caught') { const c = kitCenter(); Lt.x = lerp(Lt.x, c.x, Math.min(1, dt * 14)); Lt.y = lerp(Lt.y, c.y + 8 * sf, Math.min(1, dt * 14)); Lt.rot = lerp(Lt.rot, 0, Math.min(1, dt * 8)); return; }
    if (Lt.mode === 'fly') {
      const px_ = Lt.x; Lt.vy += G * Seq.tweaks.get('gravity') * dt; Lt.x += Lt.vx * dt; Lt.y += Lt.vy * dt; Lt.rot += Lt.vr * dt;
      if (Lt.trail.length < 90 && (Lt.trail.length === 0 || Math.hypot(Lt.x - Lt.trail[Lt.trail.length - 1].x, Lt.y - Lt.trail[Lt.trail.length - 1].y) > 14 * sf)) Lt.trail.push({ x: Lt.x, y: Lt.y });
      // the landing's edge and the underside of the upper floor
      if (!Lt.bounced && Lt.x > tx - 2 && px_ <= tx - 2 && Lt.y > yU + 2 * sf) {
        if (Lt.y < yU + 34 * sf) { Lt.y = yU - 12 * sf; Lt.vy = Math.min(Lt.vy, -120 * sf); }   // just clipped the edge: it scrapes up onto the landing
        else bounceOff(-1);
      }
      // the baby gate: the letter has to pass between the rails (or over the top)
      if (!Lt.bounced && Lt.x > gx - 4 * sf && Lt.x < gx + gw + 4 * sf && Lt.vx > 0) {
        if (Lt.y > yU - gH - 6 * sf && Lt.y < yU + 4 * sf && rails.some(ry => Math.abs(Lt.y - ry) < 3.5 * sf + LH * .5 + 1 * sf)) bounceOff(-1);
      }
      // the kitty is quick: close enough while it is passing by and it snatches the letter
      if (Lt.x > gx + gw * .5) { const c = kitCenter(); if (Math.hypot(Lt.x - c.x, Lt.y - c.y) < (K.h > 4 ? 52 : 42) * sf * Seq.tweaks.get('kittyCatch')) { catchIt(); return; } }
      const sy = stairY(Lt.x);
      if (Lt.vy > 0 && Lt.y + LH > sy && !(Lt.x > tx && Lt.y > yU + 6 * sf)) {
        Lt.y = sy - LH; Lt.vy *= -.28; Lt.vx *= .55; Lt.vr *= .4; snd.thud();
        if (Math.abs(Lt.vy) < 90 * sf) { Lt.vy = 0; Lt.vx = 0; Lt.vr = 0; Lt.mode = 'rest'; Lt.restT = Lt.x > tx ? 3.5 : 1.0; }
      }
      if (Lt.x < -40 || Lt.x > W + 40 || Lt.y > H + 60) resetLetter();
    } else if (Lt.mode === 'rest') {
      Lt.restT -= dt; const c = kitCenter();
      if (Lt.x > gx + gw && Math.abs(Lt.x - c.x) < 34 * sf * Seq.tweaks.get('kittyCatch') && K.h < 40 * sf) { catchIt(); return; }
      if (Lt.restT <= 0) resetLetter();
    }
  }

  /* ---------- input: put a finger down, swipe up, let go ---------- */
  const samples = [];
  function pt(e) { const r = root.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  const onDown = e => {
    Seq.audioInit();
    if (st === 'intro' && stT > 1.2) { skipIntro(); return; }
    if (st !== 'game') return;
    const p = pt(e); if (p.y < yU - 40 * sf && p.x > tx) return;
    try { root.setPointerCapture(e.pointerId); } catch (_) {}
    drag = e.pointerId; samples.length = 0; samples.push({ x: p.x, y: p.y, t: performance.now() });
    Lt.mode = 'drag'; Lt.x = p.x; Lt.y = p.y; Lt.rot = 0; M.stand = .55; e.preventDefault();
    hint.classList.remove('on'); hintOn = false;
  };
  const onMove = e => {
    if (drag !== e.pointerId || Lt.mode !== 'drag') return;
    const p = pt(e); Lt.x = p.x; Lt.y = p.y; samples.push({ x: p.x, y: p.y, t: performance.now() }); if (samples.length > 16) samples.shift(); e.preventDefault();
  };
  const onUp = e => {
    if (drag !== e.pointerId) return; drag = null;
    if (Lt.mode !== 'drag') return;
    const now = performance.now(), last = samples[samples.length - 1];
    // the fastest stretch of the last ~170 ms counts, so a flick that slows down as the finger lifts still throws
    let vx = 0, vy = 0, sp = 0, dtm = 0;
    for (const f of samples) {
      if (now - f.t > 170 || last.t - f.t < 20) continue;
      const d_ = (last.t - f.t) / 1000, ax = (last.x - f.x) / d_, ay = (last.y - f.y) / d_, s_ = Math.hypot(ax, ay);
      if (s_ > sp) { sp = s_; vx = ax; vy = ay; dtm = d_; }
    }
    M.stand = 0;
    if (sp > 240 && vy < -70 && dtm > .015) {
      const k = clamp(sp * .62 * Seq.tweaks.get('power'), 480 * sf, 1500 * sf) / sp;
      // a bit of aim-assist: a mostly upward swipe keeps its sideways part but never flips backwards
      if (vx < -60) { vx = -60; }
      launch(last.x, last.y, vx * k, vy * k);
    } else Lt.mode = 'back';
  };
  root.addEventListener('pointerdown', onDown); root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp);
  // test hook: throw the letter from the mouse with a given launch velocity (px/s at 390 wide)
  root.__toss = (vx, vy) => { const p = handPos(); launch(p.x, p.y, vx * sf, vy * sf); };
  root.__info = () => ({ st, tries, b: Lt.bounced, mode: Lt.mode, kx: K.x, kh: K.h, lx: Lt.x, ly: Lt.y });

  function skipIntro() { O.vis = 0; K.mode = 'hop'; K.x = kStart; K.h = 0; K.hopT = 9; gateOpen = 1; startGame(); }
  function startGame() {
    setState('game'); musicStart(); M.vis = 1; M.x = mx; M.face = 1; resetLetter(); pickRun(); K.mode = 'run'; K.x = clamp(K.x || kStart, kMin, kMax);
    hint.classList.add('on'); hintOn = true; snd.pop();
  }

  /* ---------- update ---------- */
  function updateOwner(dt, T) {
    const s = segAt(T), u = clamp((T - s.t0) / s.dur, 0, 1), e = s.kind === 'walk' ? u : 0;
    O.x = lerp(s.from.x, s.to.x, e); O.y = lerp(s.from.y, s.to.y, e); O.face = s.face; O.hold = s.hold; O.walk = s.kind === 'walk' ? 1 : 0;
    O.phase += dt * (s.stairs ? 9 : 11) * O.walk;
    O.bob = s.stairs ? Math.abs(Math.sin(O.phase)) * 6 * sf : Math.abs(Math.sin(O.phase)) * 3 * sf;
    const si = Math.floor(O.phase / Math.PI); if (O.walk && si !== lastStep) { lastStep = si; snd.step(); }
    return s;
  }
  function update(dt) {
    t += dt; stT += dt;
    updateKitty(dt); updateLetter(dt);
    if (st === 'intro') {
      const T = stT + .25, s = updateOwner(dt, T);
      M.vis = 0;
      // the kitty rides in the owner's arms, then hops out onto the landing
      if (s.hold && !s.putdown) { K.mode = 'held'; if (!K.pm) { K.pm = 1; snd.mewBig(); } }
      if (s.putdown) {
        const u = clamp((T - s.t0 - .2) / .5, 0, 1);
        if (u <= 0) K.mode = 'held';
        else { if (K.mode === 'held') { K.mode = 'hop'; snd.pop(); } K.hopU = u; }
      }
      if (K.mode === 'held') { K.x = O.x + O.face * 40 * sf; K.heldY = O.y - 40 * sf - O.bob; }
      else if (K.mode === 'hop') {
        const u = K.hopU, a = { x: O.x + O.face * 40 * sf, y: O.y - 40 * sf }, b = { x: kStart, y: yU };
        K.x = lerp(a.x, b.x, u); K.heldY = lerp(a.y, b.y, u) - Math.sin(Math.PI * u) * 50 * sf; if (u >= 1) { K.mode = 'pause'; K.pt = .3; K.x = b.x; K.h = 0; K.heldY = null; K.jt = .3; }
      }
      if (s.closing) { const u = clamp((T - s.t0) / s.dur, 0, 1); gateOpen = lerp(.12, 1, easeInOut(u)); if (u > .8 && !K.latched) { K.latched = 1; snd.latch(); } }
      else if (seg.indexOf(s) > 5) gateOpen = 1;
      if (T > segTotal - .35 && !M.emerged) { M.emerged = 1; M.vis = 1; }
      if (T >= segTotal + .6) { M.vis = 1; M.x = mx; M.face = 1; startGame(); }
      // the mouse peeks out when the coast is clear
      el.hEyes.setAttribute('opacity', (T > seg[5].t0 && T < segTotal) ? 1 : 0);
    } else if (st === 'game' || st === 'win') {
      O.vis = 0;
      if (M.vis < 1) M.vis = Math.min(1, M.vis + dt * 4);
      if (Lt.mode === 'back') { const p = handPos(); Lt.x = lerp(Lt.x, p.x, Math.min(1, dt * 14)); Lt.y = lerp(Lt.y, p.y, Math.min(1, dt * 14)); if (Math.hypot(Lt.x - p.x, Lt.y - p.y) < 6) resetLetter(); }
      if (hintOn && stT > 7) { hint.classList.remove('on'); hintOn = false; }
      if (st === 'win') {
        M.joy = Math.min(1, M.joy + dt * 3); M.hop = Math.abs(Math.sin(t * 9)) * 16 * sf * M.joy; M.stand = .35;
        if (stT > 3.1 && !reported) { reported = true; done(null); }
      } else { M.hop = lerp(M.hop, 0, Math.min(1, dt * 10)); if (Lt.mode !== 'drag') M.stand = lerp(M.stand, 0, Math.min(1, dt * 8)); }
    }
    M.ear = lerp(M.ear, st === 'game' ? 1 : 0, Math.min(1, dt * 8));
    M.look = lerp(M.look, -18, Math.min(1, dt * 6));
    shake = Math.max(0, shake - dt);
    for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.a += dt; h.vy += 90 * sf * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.vx *= .99; if (h.a > h.life) hearts.splice(i, 1); }
    if (st === 'win' && stT > .3 && Math.random() < dt * 6) hearts.push({ x: K.x + (Math.random() - .5) * 60 * sf, y: yU - 70 * sf, vx: (Math.random() - .5) * 60 * sf, vy: -(60 + Math.random() * 90) * sf, a: 0, s: .6 + Math.random() * .6, life: 1.8 });
  }

  /* ---------- render ---------- */
  function renderMouse() {
    const m = el.m, sc = .75 * sf * M.s * Seq.tweaks.get('mouseSize'), ph = M.phase, sy = M.sq, sx = 1 / Math.sqrt(sy), th = M.stand * 55;
    el.mouse.setAttribute('opacity', f2(M.vis));
    m.root.setAttribute('transform', `translate(${f2(M.x)} ${f2(M.y - M.hop)}) scale(${f2(M.face * sc)} ${f2(sc)})`);
    m.squash.setAttribute('transform', `scale(${f2(sx)} ${f2(sy)})`);
    m.body.setAttribute('transform', `rotate(${f2(-th)} -14 0)`);
    m.head.setAttribute('transform', `rotate(${f2(M.look)} 20 -22)`);
    m.ear.setAttribute('transform', `translate(8 -32) scale(${f2(1 + .14 * M.ear)} ${f2(1 + .26 * M.ear)}) rotate(${f2(-8 * M.ear)}) translate(-8 32)`);
    m.tail.setAttribute('transform', `rotate(${f2(Math.sin(t * 3.2) * 7)} -30 -19)`);
    const sw = 0; m.bn.setAttribute('transform', `translate(-14 -14) rotate(${sw})`); m.bf.setAttribute('transform', `translate(-8 -14) rotate(${-sw})`); m.fn.setAttribute('transform', `translate(20 -14) rotate(${-sw})`); m.ff.setAttribute('transform', `translate(16 -14) rotate(${sw})`);
    m.letter.setAttribute('transform', `translate(-6 ${f2(-50 - M.stand * 10)}) rotate(-8) scale(.31) translate(-80 -55)`);
    m.letter.setAttribute('opacity', Lt.mode === 'hand' ? 1 : 0);
    el.shM.setAttribute('cx', f2(M.x)); el.shM.setAttribute('cy', f2(M.y + 1)); el.shM.setAttribute('rx', f2(36 * sc * (1 - Math.min(M.hop / 60, .3)))); el.shM.setAttribute('ry', f2(6 * sc)); el.shM.setAttribute('opacity', f2(M.vis * .9));
  }
  function renderOwner() {
    const o = el.o, sc = .58 * sf, vis = st === 'intro' ? 1 : 0, sw = Math.sin(O.phase) * 28 * O.walk;
    el.owner.setAttribute('opacity', vis); el.ownerF.setAttribute('opacity', vis);
    const tr = `translate(${f2(O.x)} ${f2(O.y - (O.bob || 0))}) scale(${f2(O.face * sc)} ${f2(sc)})`;
    o.root.setAttribute('transform', tr); el.ownerF.firstElementChild.setAttribute('transform', tr);
    o.legA.setAttribute('transform', `rotate(${f2(sw)} 10 -40)`); o.legB.setAttribute('transform', `rotate(${f2(-sw)} 0 -40)`);
    o.body.setAttribute('transform', `translate(0 ${f2(Math.sin(O.phase * 2) * 1.2 * O.walk)})`);
    o.head.setAttribute('transform', `translate(2 -92) rotate(${f2(Math.sin(O.phase) * 3 * O.walk)})`);
    const holdAng = O.hold ? -80 : 0; const swing = O.hold ? 0 : -sw * .9;
    o.armB.setAttribute('transform', `translate(4 -84) rotate(${f2(holdAng + swing)})`); o.armF.setAttribute('transform', `translate(4 -84) rotate(${f2(holdAng + (O.hold ? -4 : sw * .9))})`);
    el.shO.setAttribute('cx', f2(O.x)); el.shO.setAttribute('cy', f2(O.y + 1)); el.shO.setAttribute('rx', f2(30 * sc)); el.shO.setAttribute('ry', f2(6 * sc)); el.shO.setAttribute('opacity', vis);
  }
  function renderKitty() {
    const ks = (K.mode === 'held' ? .36 : .44) * sf * Seq.tweaks.get('kittySize'), c = el.k, held = K.mode === 'held' || (K.mode === 'hop' && K.heldY != null), jump = K.h > 2;
    const ky = held ? K.heldY : yU - K.h;
    const wob = K.mode === 'run' && !jump ? Math.sin(t * 22) * 2.2 : 0, bob = K.mode === 'run' && !jump ? Math.abs(Math.sin(t * 15)) * 3 * sf : 0;
    const kx = held ? K.x : K.x;
    el.kit.setAttribute('opacity', 1);
    el.kitS.setAttribute('transform', `translate(${f2(kx)} ${f2(ky - bob)}) rotate(${f2(held ? -8 * O.face : K.lean + wob)}) scale(${f2(ks * (K.sqx || 1))} ${f2(ks * (K.sqy || 1))})`);
    const excited = !held;
    c.tail.setAttribute('transform', `rotate(${f2(Math.sin(t * (excited ? 14 : 3)) * (excited ? 22 : 8))} 38 -8)`);
    c.body.setAttribute('transform', `scale(1 ${f2(1 + .012 * Math.sin(t * 2.2))})`);
    const lookx = st === 'game' ? clamp((M.x - K.x) / W, -1, 1) : 0;
    c.head.setAttribute('transform', `translate(0 -66) rotate(${f2((excited ? Math.sin(t * 9) * 3 : 0) + (K.mode === 'catch' ? -4 : 0))} 0 22)`);
    const blink = (t % 2.6) < .11 && !excited;
    c.eyes.forEach(e => e.setAttribute('transform', `scale(${excited || held ? 1.12 : 1} ${blink ? .1 : (excited || held) ? 1.12 : 1})`));
    c.pupils.forEach(p => p.setAttribute('transform', `translate(${f2(lookx * 3.2)} ${f2(-.4)})`));
    el.shK.setAttribute('cx', f2(kx)); el.shK.setAttribute('cy', f2((held ? yU : yU) + 2)); el.shK.setAttribute('rx', f2(34 * sf * (1 - Math.min(K.h / (220 * sf), .4)))); el.shK.setAttribute('ry', f2(6 * sf)); el.shK.setAttribute('opacity', held ? 0 : .8);
  }
  function renderBang() {
    const on = K.mode === 'held' && st === 'intro', k = el.bang;
    if (on) { K.bt = (K.bt || 0) + 1 / 60; } else K.bt = 0;
    const pop = on ? easeOutBack(clamp(K.bt / .25, 0, 1)) : 0, jig = Math.sin(t * 26) * 2.2 * sf;
    k.setAttribute('opacity', on ? 1 : 0);
    k.setAttribute('transform', `translate(${f2(K.x + jig + O.face * 6 * sf)} ${f2((K.heldY || yU) - 62 * sf - Math.abs(Math.sin(t * 9)) * 4 * sf)}) scale(${f2(Math.max(.01, pop) * sf * 1.15)})`);
  }
  function renderGate() {
    const sx = Math.max(.05, gateOpen), shk = shake > 0 ? Math.sin(t * 60) * 3 * sf * shake : 0;
    el.gate.setAttribute('transform', `translate(${f2(gx + shk)} ${f2(yU)}) scale(${f2(sx)} 1)`);
  }
  function renderLetter() {
    const vis = Lt.mode !== 'hand', sc = .33 * sf * (Lt.mode === 'drag' ? 1.15 : 1);
    el.lt.setAttribute('opacity', vis ? 1 : 0);
    el.lt.setAttribute('transform', `translate(${f2(Lt.x)} ${f2(Lt.y)}) rotate(${f2(Lt.rot * 57.3)}) scale(${f2(sc)})`);
    el.shL.setAttribute('opacity', 0);
    // ghost of the last throw, so you can adjust
    let g = '';
    if (st === 'game' && Lt.ghost.length > 1 && (Lt.mode !== 'fly')) for (let i = 0; i < Lt.ghost.length; i += 1) { const p = Lt.ghost[i]; g += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(3 * sf)}" fill="#fff1bd" opacity=".5"/>`; }
    el.ghost.innerHTML = g;
    let h = ''; for (const p of hearts) { const s = p.s * sf * (1 + .1 * Math.sin(p.a * 8)); h += `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${f2(s)})" opacity="${f2(1 - clamp((p.a - p.life * .6) / (p.life * .4), 0, 1))}">${heartPath}</g>`; }
    el.fx.innerHTML = h;
  }
  function render() { renderMouse(); renderOwner(); renderKitty(); renderBang(); renderGate(); renderLetter(); }

  /* ---------- go ---------- */
  layout(); K.x = kStart; update(.016); render();
  const offGate = Seq.tweaks.onChange(k => { if (k === 'gateHeight') layout(); });
  const ro = new ResizeObserver(() => { layout(); }); ro.observe(root);
  let last = performance.now();
  return {
    entry: { x: W * .1, y: yG - 20 },
    frame(now) { const dt = clamp((now - last) / 1000, 0, 1 / 30) * Seq.tweaks.get('gameSpeed'); last = now; update(dt); render(); px.render(now); },
    destroy() { ro.disconnect(); offGate(); px.destroy(); musicStop(.05); out.close(); }
  };
};
