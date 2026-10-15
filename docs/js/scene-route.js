/* Step 1 — Sneak past the dogs.
   The mouse has just come in through a hole in the wall of a new house. Intro: the mouse gets
   in, we cut to the tabby cat waiting in a closed room (the goal), then cut back. Game: drag your
   finger (or mouse) anywhere and the mouse runs to it; two fast dogs patrol the living room.
   When a dog sees the mouse, red "!!" pops up, it barks and runs at it. Reach the glowing door
   and slip under it. Same mouse art as the opening; the dogs and the tabby are drawn like the cat. */
Seq.scenes.route = (root, done) => {
  root.classList.add('sc-room');
  root.innerHTML = `
  <svg class="scene-svg rm" xmlns="http://www.w3.org/2000/svg"></svg>
  <svg class="scene-svg ct" xmlns="http://www.w3.org/2000/svg" style="display:none"></svg>
  <div class="flash" data-px-ui></div>
  <div class="hint" data-px-ui>Drag to guide the mouse</div>`;
  const rm = root.querySelector('svg.rm'), ct = root.querySelector('svg.ct'), flash = root.querySelector('.flash'), hint = root.querySelector('.hint');
  const px = new Seq.Pixel(root, { bg: '#14102e' });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const easeOut = u => 1 - Math.pow(1 - u, 3);
  const easeOutBack = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const f1 = n => n.toFixed(1), f2 = n => n.toFixed(2);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OL = '#0c0818';

  /* scalloped ellipse path (fur tufts) */
  function fluff(cx, cy, rx, ry, n, amp) {
    const P = (a, k) => { const r = a * Math.PI / 180; return [cx + Math.cos(r) * rx * k, cy + Math.sin(r) * ry * k]; };
    const step = 360 / n, kc = 1 + amp / ((rx + ry) / 2), p0 = P(0, 1);
    let d = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`;
    for (let i = 0; i < n; i++) { const c = P(i * step + step / 2, kc), q = P((i + 1) * step, 1); d += `Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }
    return d + 'Z';
  }

  /* ---------- sound (shared context; this scene's own bus) ---------- */
  const AU = Seq.audio, out = Seq.sceneOut(.85);
  const ok = () => AU.ac && out.get();
  function tone(type, f0, f1, dur, vol, delay = 0, lp) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
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
  const snd = {
    bark(p) { tone('sawtooth', 300 * p, 170 * p, .09, .12, 0, 1200); tone('sawtooth', 280 * p, 150 * p, .1, .1, .15, 1200); noise(.2, .05, 'lowpass', 900, .8); },
    squeak() { tone('sine', 1900, 2700, .07, .05); tone('sine', 2300, 3000, .06, .035, .07); },
    patter() { noise(.04, .045, 'bandpass', 1800 + Math.random() * 500, 1.3); },
    shake() { noise(.14, .05, 'bandpass', 2600, .8); },
    pop() { tone('sine', 380, 760, .08, .11); },
    chime() { tone('sine', 659, null, .3, .07); tone('sine', 880, null, .3, .06, .1); tone('sine', 1318, null, .4, .05, .2); },
    mew() { tone('sine', 620, 880, .12, .08); tone('sine', 880, 560, .18, .07, .1); },
    slip() { noise(.3, .06, 'bandpass', 1500, .8); tone('sine', 900, 300, .25, .06); },
    alarm() { tone('square', 880, 640, .12, .07, 0, 2400); }
  };

  /* ---------- art ---------- */
  const MOUSE = `<g class="mRoot" stroke-linejoin="round" stroke-linecap="round">
          <g class="mSquash">
            <g class="mTail"><path d="M-27 -16 C-42 -14 -48 0 -62 -3 C-70 -5 -72 -14 -68 -20" fill="none" stroke="#1b1033" stroke-width="5.6"/><path d="M-27 -16 C-42 -14 -48 0 -62 -3 C-70 -5 -72 -14 -68 -20" fill="none" stroke="#f4a6bd" stroke-width="2.8"/></g>
            <g class="mLegBF"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#9a90b8" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
            <g class="mBody">
              <g class="mLegFF"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#9a90b8" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
              <ellipse cx="-5" cy="-19" rx="25" ry="18" fill="#b6adcf" stroke="#1b1033" stroke-width="2.8"/>
              <path d="M-20 -9 Q-5 -2 14 -9 Q10 -4 -4 -2 Q-16 -3 -20 -9Z" fill="#9a90b8"/>
              <ellipse cx="-3" cy="-12" rx="17" ry="7" fill="#f8e9f0"/>
              <path d="M-24 -28 Q-10 -39 5 -35" fill="none" stroke="#dcd5ee" stroke-width="3"/>
              <g class="mLegFN"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#b6adcf" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
              <!-- messenger's red scarf -->
              <path d="M2 -21 Q14 -8 26 -17 L25 -9 Q12 0 1 -12Z" fill="#e5475c" stroke="#1b1033" stroke-width="2.2"/>
              <path d="M2 -14 Q12 -3 25 -11 L25 -9 Q12 0 1 -12Z" fill="#b92a44"/>
              <path d="M5 -10 L-6 -3 L-1 -14Z" fill="#e5475c" stroke="#1b1033" stroke-width="2"/>
              <g class="mHead">
                <path d="M4 -24 C4 -42 31 -44 38 -34 C43 -32 50 -28 50 -22.5 C50 -17.5 44 -14 38 -13 C31 -8 4 -8 4 -24Z" fill="#c9c0df" stroke="#1b1033" stroke-width="2.8"/>
                <path d="M9 -35 Q16 -40 25 -38" fill="none" stroke="#ece7f8" stroke-width="3"/>
                <g class="mEar"><circle cx="8" cy="-41" r="12.5" fill="#b6adcf" stroke="#1b1033" stroke-width="2.8"/><circle cx="8.5" cy="-40.5" r="8.4" fill="#f48fae"/><path d="M4 -45 q4 -4 9 -2" fill="none" stroke="#ffd0de" stroke-width="2"/></g>
                <ellipse class="mEyeOpen" cx="27" cy="-28.5" rx="5" ry="6" fill="#0d0a18"/>
                <circle class="mEyeShine" cx="29" cy="-31" r="2.3" fill="#fff"/>
                <circle class="mEyeShine" cx="25.2" cy="-25.4" r="1.1" fill="#fff"/>
                <path d="M21.5 -33.5 Q27 -38.5 32.5 -33.5" fill="none" stroke="#1b1033" stroke-width="1.8"/>
                <path class="mEyeHappy" d="M22 -28 Q27 -35 32 -28" fill="none" stroke="#1b1033" stroke-width="2.2" opacity="0"/>
                <ellipse class="mBlush" cx="28.5" cy="-19.5" rx="5" ry="3.2" fill="#ff7fa3" opacity=".6"/>
                <rect x="38" y="-17.2" width="3.4" height="4.4" rx="1.2" fill="#fffaf0" stroke="#1b1033" stroke-width="1.2"/><rect x="41.5" y="-17.4" width="3.4" height="4.4" rx="1.2" fill="#fffaf0" stroke="#1b1033" stroke-width="1.2"/>
                <circle cx="49" cy="-23" r="3.6" fill="#ff8fae" stroke="#1b1033" stroke-width="1.8"/><circle cx="48" cy="-24" r="1" fill="#fff"/>
                <path class="mSmile" d="M36 -17.5 Q40.5 -13.5 44.5 -18" fill="none" stroke="#1b1033" stroke-width="1.6" opacity="0"/>
                <g stroke="#fff" stroke-width="1" fill="none" opacity=".85"><path d="M40 -22 L55 -29 M41 -20.5 L57 -21.5 M40 -19 L55 -13"/></g>
              </g>
            </g>
            <g class="mLegBN"><g class="mLegS"><rect x="-3.4" y="0" width="6.8" height="13" rx="3.4" fill="#b6adcf" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.7" cy="14" rx="5.8" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
          </g>
        </g>`;
  const LETTER = '<g class="mLetter"><use href="#letterArt"/></g>';
  const mouseMarkup = MOUSE.replace(/<\/g>\s*$/, LETTER + '</g>');
  function dogMarkup(p) {
    const leg = (c) => `<g class="dLeg"><rect x="-4.5" y="0" width="9" height="17" rx="4.5" fill="${c}" stroke="${OL}" stroke-width="2.4"/><ellipse cx="0" cy="17.5" rx="6.6" ry="3.6" fill="${p.belly}" stroke="${OL}" stroke-width="2.2"/></g>`;
    return `<g class="dRoot" stroke-linejoin="round" stroke-linecap="round">
      <g class="dTail"><path d="M-30 -34 C-44 -38 -48 -56 -38 -62" fill="none" stroke="${OL}" stroke-width="9.5"/><path d="M-30 -34 C-44 -38 -48 -56 -38 -62" fill="none" stroke="${p.fur}" stroke-width="5.4"/></g>
      <g class="dLegBF">${leg(p.shade)}</g><g class="dLegFF">${leg(p.shade)}</g>
      <g class="dBody">
        <ellipse cx="0" cy="-28" rx="32" ry="22" fill="${p.fur}" stroke="${OL}" stroke-width="3"/>
        <path d="M-26 -42 Q-4 -54 22 -44 Q-2 -40 -26 -42Z" fill="${p.shade}"/>
        <ellipse cx="4" cy="-18" rx="22" ry="10.5" fill="${p.belly}"/>
        <path d="M18 -49 Q28 -34 19 -14" fill="none" stroke="${OL}" stroke-width="7.5"/><path d="M18 -49 Q28 -34 19 -14" fill="none" stroke="${p.collar}" stroke-width="4"/>
      </g>
      <g class="dLegBN">${leg(p.fur)}</g><g class="dLegFN">${leg(p.fur)}</g>
      <g class="dHead">
        <ellipse cx="30" cy="-42" rx="23" ry="20" fill="${p.fur}" stroke="${OL}" stroke-width="3"/>
        <ellipse cx="46" cy="-35" rx="13" ry="9.5" fill="${p.belly}" stroke="${OL}" stroke-width="2.6"/>
        <ellipse cx="32" cy="-35" rx="5.4" ry="3.4" fill="#ff7fa3" opacity=".6"/>
        <g class="dEar"><path d="M23 -57 C8 -59 1 -38 9 -25 C20 -27 29 -40 29 -55Z" fill="${p.ear}" stroke="${OL}" stroke-width="2.6"/></g>
        <ellipse cx="38" cy="-46" rx="4.7" ry="5.7" fill="${OL}"/><circle cx="39.8" cy="-48.5" r="2.1" fill="#fff"/><circle cx="36.2" cy="-43.2" r="1" fill="#fff"/>
        <path d="M33 -53 q5 -3 10 0" fill="none" stroke="${OL}" stroke-width="2"/>
        <ellipse cx="57" cy="-38" rx="4.6" ry="3.6" fill="${OL}"/><circle cx="55.6" cy="-39.3" r="1.2" fill="#fff"/>
        <path class="dMouthShut" d="M56 -34 Q52 -29 46 -31" fill="none" stroke="${OL}" stroke-width="1.9"/>
        <g class="dMouthOpen" opacity="0"><path d="M45 -33 Q56 -35 59 -30 Q57 -19 47 -22Z" fill="#5b1230" stroke="${OL}" stroke-width="2"/><ellipse cx="52.5" cy="-23.5" rx="4.6" ry="3" fill="#ff7f9a"/></g>
      </g>
    </g>`;
  }
  const DOG_A = { fur: '#a8643a', shade: '#8a4a30', belly: '#f7e3b0', ear: '#6b3a22', collar: '#e5475c' };
  const DOG_B = { fur: '#5d5c8c', shade: '#4b4a78', belly: '#dedcf0', ear: '#3a3860', collar: '#f4d35e' };
  const bangMarkup = `<g class="bang" opacity="0">
      <g transform="translate(-11 0) rotate(-8)"><path d="M-4 -26 h8 l-2 20 h-4Z" fill="#e5475c" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="3.8" fill="#e5475c" stroke="${OL}" stroke-width="2.4"/></g>
      <g transform="translate(11 -4) rotate(8) scale(1.2)"><path d="M-4 -26 h8 l-2 20 h-4Z" fill="#e5475c" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="3.8" fill="#e5475c" stroke="${OL}" stroke-width="2.4"/></g>
    </g>`;
  const woofMarkup = `<g class="woof" opacity="0" stroke-linecap="round" fill="none">
      <path d="M2 -9 Q9 0 2 9" stroke="${OL}" stroke-width="7"/><path d="M13 -15 Q24 0 13 15" stroke="${OL}" stroke-width="7"/><path d="M25 -21 Q40 0 25 21" stroke="${OL}" stroke-width="7"/>
      <path d="M2 -9 Q9 0 2 9" stroke="#fff" stroke-width="3.4"/><path d="M13 -15 Q24 0 13 15" stroke="#fff" stroke-width="3.4"/><path d="M25 -21 Q40 0 25 21" stroke="#fff" stroke-width="3.4"/></g>`;
  function tabbyMarkup() { return `        <g class="cTail">
          <path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#0c0818" stroke-width="17"/>
          <path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#f0954a" stroke-width="11"/><path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#8a4a30" stroke-width="11" stroke-dasharray="4 9"/>
          <path d="M42 -12 C 64 -12 70 -28 59 -38" fill="none" stroke="#ffbb62" stroke-width="3"/>
        </g>
        <g class="cBody">
          <path d="M-41 0 C-49 -20 -45 -52 -27 -62 L27 -62 C45 -52 49 -20 41 0 C21 6 -21 6 -41 0Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-41 -48 q10 3 18 -1 M-45 -36 q12 4 20 -1 M-46 -24 q10 3 16 -1 M41 -48 q-10 3 -18 -1 M45 -36 q-12 4 -20 -1 M46 -24 q-10 3 -16 -1" fill="none" stroke="#8a4a30" stroke-width="3.2" stroke-linecap="round"/><path d="M24 -58 C45 -50 47 -20 39 -2 C33 1 28 2 22 2 C35 -20 35 -44 24 -58Z" fill="#c46a38"/>
          <path d="M-33 -50 C-40 -40 -41 -28 -38 -18" fill="none" stroke="#ffbb62" stroke-width="3.4"/>
          <path d="${fluff(0, -28, 25, 28, 12, 2.8)}" fill="#ffffff" stroke="#0c0818" stroke-width="2.2"/>
          <path d="M14 -48 C27 -34 24 -12 12 -2 C19 -14 20 -34 14 -48Z" fill="#dedcf0"/>
          <ellipse cx="-37" cy="-3" rx="10" ry="6.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="37" cy="-3" rx="10" ry="6.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="-13" cy="-6" rx="11.5" ry="8.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="13" cy="-6" rx="11.5" ry="8.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <path d="M-17 -2 V-7 M-10 -2 V-7 M10 -2 V-7 M17 -2 V-7" stroke="#8d8bb5" stroke-width="1.4"/>
        </g>
        <g class="cHead" transform="translate(0 -66)">
          <path d="M-39 -12 Q-45 -42 -27 -47 Q-13 -39 -9 -27Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M39 -12 Q45 -42 27 -47 Q13 -39 9 -27Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-33 -16 Q-37 -36 -27 -40 Q-19 -35 -16 -27Z" fill="#ff9db9"/>
          <path d="M33 -16 Q37 -36 27 -40 Q19 -35 16 -27Z" fill="#ff9db9"/>
          <path d="M-30 -20 Q-31 -32 -27 -36" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>
          <path d="${fluff(-40, 12, 9, 7, 6, 2.4)}" fill="#fff" stroke="#0c0818" stroke-width="2"/>
          <path d="${fluff(40, 12, 9, 7, 6, 2.4)}" fill="#fff" stroke="#0c0818" stroke-width="2"/>
          <ellipse cx="0" cy="0" rx="44" ry="36" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-22 -27 Q-10 -34 4 -31" fill="none" stroke="#ffd98a" stroke-width="3.4"/>
          <path d="M-5 -34 Q0 -39 5 -34 L8 -6 L-8 -6Z" fill="#f0954a"/><path d="M-9 -28 l0 12 M0 -33 l0 14 M9 -28 l0 12" stroke="#8a4a30" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-41 4 l-9 -3 M-42 10 l-10 1 M41 4 l9 -3 M42 10 l10 1" stroke="#8a4a30" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <ellipse cx="-10" cy="12" rx="14" ry="11.5" fill="#fff"/><ellipse cx="10" cy="12" rx="14" ry="11.5" fill="#fff"/>
          <ellipse cx="0" cy="22" rx="11" ry="7" fill="#fff"/>
          <path d="M-22 20 Q0 34 22 20 Q18 30 0 31 Q-18 30 -22 20Z" fill="#dedcf0" opacity=".7"/>
          <ellipse cx="-30" cy="8" rx="8.5" ry="5.4" fill="#ff7fa3" opacity=".7"/><ellipse cx="30" cy="8" rx="8.5" ry="5.4" fill="#ff7fa3" opacity=".7"/>
          <g class="cEyeL" transform="translate(-19 -2)"><g class="cEyeScale"><ellipse rx="10.5" ry="12.5" fill="#0c0818"/><ellipse class="cPupil" rx="7.6" ry="9.4" fill="#f4d35e"/><path d="M-7 -4 Q0 -11 7 -4 Q0 -7 -7 -4Z" fill="#c46a38"/><ellipse rx="3.5" ry="4.8" fill="#0c0818" opacity=".85"/><circle cx="-3.8" cy="-4.8" r="3.8" fill="#fff"/><circle cx="3.8" cy="4.4" r="1.9" fill="#fff"/></g></g>
          <g class="cEyeR" transform="translate(19 -2)"><g class="cEyeScale"><ellipse rx="10.5" ry="12.5" fill="#0c0818"/><ellipse class="cPupil" rx="7.6" ry="9.4" fill="#f4d35e"/><path d="M-7 -4 Q0 -11 7 -4 Q0 -7 -7 -4Z" fill="#c46a38"/><ellipse rx="3.5" ry="4.8" fill="#0c0818" opacity=".85"/><circle cx="-3.8" cy="-4.8" r="3.8" fill="#fff"/><circle cx="3.8" cy="4.4" r="1.9" fill="#fff"/></g></g>
          <path d="M-3.8 7 Q0 4.6 3.8 7 Q2.8 11.4 0 12.4 Q-2.8 11.4 -3.8 7Z" fill="#ff8fae" stroke="#0c0818" stroke-width="1.5"/>
          <path class="cMouthShut" d="M0 12.4 Q-3 17.5 -7.4 14 M0 12.4 Q3 17.5 7.4 14" fill="none" stroke="#0c0818" stroke-width="1.9"/>
          <g class="cMouthOpen" opacity="0">
            <path d="M-8.5 14 Q0 11.5 8.5 14 Q8.5 28 0 29 Q-8.5 28 -8.5 14Z" fill="#5b1230" stroke="#0c0818" stroke-width="1.8"/>
            <path d="M-4.8 25 Q0 20 4.8 25 Q3.8 29 0 29 Q-3.8 29 -4.8 25Z" fill="#ff7f9a"/>
          </g>
          
          <g stroke="#fff" stroke-width="1.2" fill="none" opacity=".85">
            <path d="M-27 12 Q-39 8 -53 10 M-27 16 Q-40 16 -53 21"/><path d="M27 12 Q39 8 53 10 M27 16 Q40 16 53 21"/>
          </g>
        </g>
`; }

  /* ---------- layout (everything is built from the real width / height) ---------- */
  let WIN = { x: 0, y: 0, w: 1, h: 1 }, CWIN = { x: 0, y: 0, w: 1, h: 1 };
  let W = 1, H = 1, yW = 0, vp = { x: 0, y: 0 }, sf = 1, HOME = { x: 0, y: 0 }, HOLE = { x: 0, y: 0 }, DOOR = { x: 0, w: 0, y: 0 };
  const DEPTH = .55;
  const scaleAt = y => lerp(.62, 1.15, clamp((y - yW) / (H - yW), 0, 1));
  const wallBaseY = x => vp.y + (yW - vp.y) * (vp.x / (vp.x - x));
  const wallTopY = x => vp.y + (vp.y * -1 + 0) * 0 + (H * .03 - vp.y) * (vp.x / (vp.x - x));

  function roomMarkup() {
    const xl = W * .12, xr = W * .88, yt = H * .03, yE = wallBaseY(0), yTe = wallTopY(0);
    let planks = '';
    const dX = W * .1;
    for (let i = -16; i <= 16; i++) { const xi = vp.x + i * dX, xb = vp.x + (xi - vp.x) * (H - vp.y) / (yW - vp.y); planks += `M${f1(xi)} ${yW}L${f1(xb)} ${H}`; }
    let seams = '';
    for (let k = 1; k <= 7; k++) { const y = yW + (H - yW) * Math.pow(k / 7, 1.55); seams += `M0 ${f1(y)}H${W}`; }
    let paperB = '', paperL = '', paperR = '';
    for (let x = xl + 9; x < xr; x += 18) paperB += `M${f1(x)} ${f1(yt + 8)}V${f1(yW - 9)}`;
    for (let x = 6; x < xl; x += 12) { paperL += `M${x} ${f1(wallTopY(x))}V${f1(wallBaseY(x) - 12)}`; paperR += `M${W - x} ${f1(wallTopY(x))}V${f1(wallBaseY(x) - 12)}`; }
    const wx = W * .17, ww = W * .2, wy = yt + (yW - yt) * .16, wh = (yW - yt) * .5;
    WIN = { x: wx, y: wy, w: ww, h: wh };
    const dw = W * .13, dh = (yW - yt) * .78, dx0 = DOOR.x - dw / 2, dy0 = yW - dh;
    const sx = W * .25, sw = W * .34, sh = (yW - yt) * .46, sy = yW + 16 - sh;
    const lampX = W * .19, plantX = W * .655;
    const hx = HOLE.x, hb = HOLE.y;
    const rugY = yW + (H - yW) * .5, rugRX = W * .3, rugRY = (H - yW) * .11;
    let stars = '';
    for (let i = 0; i < 7; i++) stars += `<circle cx="${f1(wx + 8 + (i * 37 % (ww - 16)))}" cy="${f1(wy + 8 + (i * 23 % (wh * .5)))}" r="1.4" fill="#fff"/>`;
    return `
    <defs>
      <clipPath id="rWinClip"><rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}"/></clipPath>
      <radialGradient id="rLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset=".55" stop-color="#ffbb62" stop-opacity=".22"/><stop offset="1" stop-color="#ffbb62" stop-opacity="0"/></radialGradient>
      <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a22"/><stop offset="1" stop-color="#b06a3c"/></linearGradient>
      <linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2256"/><stop offset="1" stop-color="#413883"/></linearGradient>
    </defs>
    <polygon points="0,0 ${W},0 ${f1(xr)},${f1(yt)} ${f1(xl)},${f1(yt)}" fill="#1c1740"/>
    <polygon points="0,${f1(yE)} ${f1(xl)},${yW} ${f1(xr)},${yW} ${W},${f1(yE)} ${W},${H} 0,${H}" fill="url(#rFloor)"/>
    <path d="${planks}" stroke="rgba(30,12,8,.5)" stroke-width="2" fill="none"/>
    <path d="${seams}" stroke="rgba(30,12,8,.22)" stroke-width="1.4" fill="none"/>
    <polygon points="0,${f1(yTe)} ${f1(xl)},${f1(yt)} ${f1(xl)},${yW} 0,${f1(yE)}" fill="#261f55"/>
    <polygon points="${W},${f1(yTe)} ${f1(xr)},${f1(yt)} ${f1(xr)},${yW} ${W},${f1(yE)}" fill="#261f55"/>
    <path d="${paperL}${paperR}" stroke="rgba(0,0,0,.2)" stroke-width="1.4" fill="none"/>
    <rect x="${f1(xl)}" y="${f1(yt)}" width="${f1(xr - xl)}" height="${f1(yW - yt)}" fill="url(#rWall)"/>
    <path d="${paperB}" stroke="rgba(0,0,0,.16)" stroke-width="1.6" fill="none"/>
    <rect x="${f1(xl)}" y="${f1(yt)}" width="${f1(xr - xl)}" height="8" fill="#6c63b6"/><rect x="${f1(xl)}" y="${f1(yt + 8)}" width="${f1(xr - xl)}" height="2" fill="#1c1740"/>
    <polygon points="${f1(xl)},${yW - 10} ${f1(xl)},${yW} 0,${f1(yE)} 0,${f1(yE - 16)}" fill="#c6c4dc"/><polygon points="${f1(xr)},${yW - 10} ${f1(xr)},${yW} ${W},${f1(yE)} ${W},${f1(yE - 16)}" fill="#c6c4dc"/>
    <rect x="${f1(xl)}" y="${yW - 10}" width="${f1(xr - xl)}" height="10" fill="#dedcf0"/><rect x="${f1(xl)}" y="${yW - 10}" width="${f1(xr - xl)}" height="2" fill="#fff"/><rect x="${f1(xl)}" y="${yW - 1}" width="${f1(xr - xl)}" height="2" fill="#544b9c"/>

    <ellipse cx="${f1(lampX + W * .04)}" cy="${f1(yW - 56)}" rx="${f1(W * .14)}" ry="${f1(H * .1)}" fill="url(#rLamp)"/>
    <g stroke-linejoin="round">
      <rect x="${f1(wx - 5)}" y="${f1(wy - 5)}" width="${f1(ww + 10)}" height="${f1(wh + 10)}" fill="#dedcf0" stroke="${OL}" stroke-width="2.6"/>
      <rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" fill="#1d1049"/>
      ${stars}
      <circle cx="${f1(wx + ww * .7)}" cy="${f1(wy + wh * .28)}" r="${f1(wh * .13)}" fill="#f1e9ff"/><circle cx="${f1(wx + ww * .7 + wh * .07)}" cy="${f1(wy + wh * .28 - wh * .05)}" r="${f1(wh * .12)}" fill="#1d1049"/>
      <g clip-path="url(#rWinClip)"><g class="winRain"></g></g>
      <path d="M${f1(wx + ww / 2)} ${f1(wy)}V${f1(wy + wh)}M${f1(wx)} ${f1(wy + wh * .55)}H${f1(wx + ww)}" stroke="#dedcf0" stroke-width="3"/>
      <rect x="${f1(wx - 10)}" y="${f1(wy + wh + 3)}" width="${f1(ww + 20)}" height="7" fill="#dedcf0" stroke="${OL}" stroke-width="2.2"/>
      <path d="M${f1(wx - 8)} ${f1(wy - 8)}h${f1(ww * .2)}q-4 ${f1(wh * .5)} 2 ${f1(wh + 6)}h-${f1(ww * .2 - 4)}z" fill="#c4577f" stroke="${OL}" stroke-width="2.4"/>
      <path d="M${f1(wx + ww + 8)} ${f1(wy - 8)}h-${f1(ww * .2)}q4 ${f1(wh * .5)} -2 ${f1(wh + 6)}h${f1(ww * .2 - 4)}z" fill="#c4577f" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${f1(W * .44)}" y="${f1(yt + 24)}" width="${f1(W * .09)}" height="${f1(W * .11)}" fill="#8981cd" stroke="${OL}" stroke-width="2.6"/><rect x="${f1(W * .455)}" y="${f1(yt + 30)}" width="${f1(W * .06)}" height="${f1(W * .08)}" fill="#ffc4d6"/>
      <path d="M${f1(W * .485)} ${f1(yt + 56)} q-6 -6 -8 -1 q0 6 8 11 q8 -5 8 -11 q-2 -5 -8 1z" fill="#e5475c"/>
      <rect x="${f1(W * .56)}" y="${f1(yt + 18)}" width="${f1(W * .08)}" height="${f1(W * .07)}" fill="#cdc9f0" stroke="${OL}" stroke-width="2.6"/><rect x="${f1(W * .57)}" y="${f1(yt + 24)}" width="${f1(W * .06)}" height="${f1(W * .045)}" fill="#6c63b6"/>
    </g>
    <path d="M${f1(W * .06)} ${yW - 4}h${f1(W * .8)}" stroke="none"/>

    <polygon points="${f1(dx0 - W * .02)},${yW} ${f1(dx0 + dw + W * .02)},${yW} ${f1(dx0 + dw + W * .11)},${f1(yW + H * .17)} ${f1(dx0 - W * .11)},${f1(yW + H * .17)}" fill="rgba(255,217,138,.34)"/>
    <ellipse cx="${f1(plantX)}" cy="${yW + 14}" rx="22" ry="5" fill="rgba(5,2,15,.4)"/>
    <ellipse cx="${f1(lampX)}" cy="${yW + 12}" rx="24" ry="5" fill="rgba(5,2,15,.4)"/>
    <ellipse cx="${f1(W * .42)}" cy="${yW + 20}" rx="${f1(sw * .5)}" ry="6" fill="rgba(5,2,15,.4)"/>
    <ellipse cx="${f1(DOOR.x)}" cy="${yW + 1}" rx="${f1(dw * .55)}" ry="3" fill="rgba(5,2,15,.35)"/>
    <g stroke-linejoin="round">
      <rect x="${f1(dx0 - 5)}" y="${f1(dy0 - 5)}" width="${f1(dw + 10)}" height="${f1(dh + 5)}" fill="#6b3a22" stroke="${OL}" stroke-width="2.6"/>
      <rect x="${f1(dx0)}" y="${f1(dy0)}" width="${f1(dw)}" height="${f1(dh)}" fill="#a8643a" stroke="${OL}" stroke-width="2.2"/>
      <rect x="${f1(dx0 + dw * .14)}" y="${f1(dy0 + dh * .08)}" width="${f1(dw * .72)}" height="${f1(dh * .36)}" fill="#8a4a30" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(dx0 + dw * .14)}" y="${f1(dy0 + dh * .52)}" width="${f1(dw * .72)}" height="${f1(dh * .38)}" fill="#8a4a30" stroke="${OL}" stroke-width="2"/>
      <circle cx="${f1(dx0 + dw * .82)}" cy="${f1(dy0 + dh * .5)}" r="3.6" fill="#f4d35e" stroke="${OL}" stroke-width="1.8"/>
      <path class="doorHeartBase" d="M${f1(DOOR.x)} ${f1(dy0 + dh * .33)} q-9 -9 -12 -2 q0 8 12 15 q12 -7 12 -15 q-3 -7 -12 2z" fill="#ff7fa3" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(dx0 + 2)}" y="${yW - 5}" width="${f1(dw - 4)}" height="5" fill="#fff1bd"/>
    </g>
    <g stroke-linejoin="round">
      <rect x="${f1(lampX - 14)}" y="${f1(yW - 30)}" width="28" height="3" fill="#a8643a" stroke="${OL}" stroke-width="2"/>
      <path d="M${f1(lampX - 17)} ${yW - 4}h34v-26h-34z" fill="#8a4a30" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${f1(lampX - 3)}" y="${f1(yW - 62)}" width="6" height="32" fill="#6b3a22" stroke="${OL}" stroke-width="2"/>
      <path d="M${f1(lampX - 17)} ${yW - 60}l6 -22h22l6 22z" fill="#ffd98a" stroke="${OL}" stroke-width="2.4"/>
      <path d="M${f1(lampX - 2)} ${yW - 82}v22" stroke="rgba(255,255,255,.5)" stroke-width="3"/>

      <rect x="${f1(sx + 4)}" y="${f1(sy + sh - 6)}" width="9" height="10" fill="#6b3a22" stroke="${OL}" stroke-width="2"/><rect x="${f1(sx + sw - 13)}" y="${f1(sy + sh - 6)}" width="9" height="10" fill="#6b3a22" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(sx + 14)}" y="${f1(sy)}" width="${f1(sw - 28)}" height="${f1(sh * .6)}" rx="8" fill="#8981cd" stroke="${OL}" stroke-width="2.8"/>
      <rect x="${f1(sx)}" y="${f1(sy + sh * .42)}" width="${f1(sw)}" height="${f1(sh * .46)}" rx="7" fill="#6c63b6" stroke="${OL}" stroke-width="2.8"/>
      <rect x="${f1(sx + 8)}" y="${f1(sy + sh * .44)}" width="${f1(sw / 2 - 10)}" height="${f1(sh * .22)}" rx="5" fill="#aaa4e0" stroke="${OL}" stroke-width="2.2"/><rect x="${f1(sx + sw / 2 + 2)}" y="${f1(sy + sh * .44)}" width="${f1(sw / 2 - 10)}" height="${f1(sh * .22)}" rx="5" fill="#aaa4e0" stroke="${OL}" stroke-width="2.2"/>
      <rect x="${f1(sx - 10)}" y="${f1(sy + sh * .22)}" width="24" height="${f1(sh * .68)}" rx="9" fill="#5638a6" stroke="${OL}" stroke-width="2.8"/><rect x="${f1(sx + sw - 14)}" y="${f1(sy + sh * .22)}" width="24" height="${f1(sh * .68)}" rx="9" fill="#5638a6" stroke="${OL}" stroke-width="2.8"/>
      <rect x="${f1(sx + sw * .2)}" y="${f1(sy + sh * .1)}" width="22" height="22" rx="5" fill="#ff9db9" stroke="${OL}" stroke-width="2.2" transform="rotate(-10 ${f1(sx + sw * .2 + 11)} ${f1(sy + sh * .1 + 11)})"/>

      <path d="M${f1(plantX - 14)} ${yW + 10}h28l-4 -26h-20z" fill="#c46a38" stroke="${OL}" stroke-width="2.6"/><rect x="${f1(plantX - 16)}" y="${yW - 20}" width="32" height="6" fill="#d9965a" stroke="${OL}" stroke-width="2.2"/>
      <ellipse cx="${f1(plantX - 12)}" cy="${yW - 44}" rx="8" ry="20" fill="#4f9a6a" stroke="${OL}" stroke-width="2.4" transform="rotate(-24 ${f1(plantX - 12)} ${yW - 44})"/>
      <ellipse cx="${f1(plantX + 12)}" cy="${yW - 44}" rx="8" ry="20" fill="#4f9a6a" stroke="${OL}" stroke-width="2.4" transform="rotate(24 ${f1(plantX + 12)} ${yW - 44})"/>
      <ellipse cx="${f1(plantX)}" cy="${yW - 52}" rx="9" ry="24" fill="#2f5d4a" stroke="${OL}" stroke-width="2.4"/>
    </g>

    <g stroke-linejoin="round">
      <ellipse cx="${f1(W * .5)}" cy="${f1(rugY)}" rx="${f1(rugRX)}" ry="${f1(rugRY)}" fill="#8c2447" stroke="${OL}" stroke-width="2.6"/>
      <ellipse cx="${f1(W * .5)}" cy="${f1(rugY)}" rx="${f1(rugRX * .82)}" ry="${f1(rugRY * .8)}" fill="#c4577f"/>
      <ellipse cx="${f1(W * .5)}" cy="${f1(rugY)}" rx="${f1(rugRX * .56)}" ry="${f1(rugRY * .55)}" fill="#8c2447"/>
      <ellipse cx="${f1(W * .5)}" cy="${f1(rugY)}" rx="${f1(rugRX * .3)}" ry="${f1(rugRY * .3)}" fill="#ffc4d6"/>
    </g>
    <polygon points="${f1(W * .2)},${yW + 8} ${f1(W * .42)},${yW + 8} ${f1(W * .58)},${f1(yW + (H - yW) * .38)} ${f1(W * .24)},${f1(yW + (H - yW) * .38)}" fill="rgba(180,190,255,.1)"/>
    <g stroke-linejoin="round">
      <path d="M${f1(hx - 15)} ${f1(hb)}V${f1(hb - 22)}A15 15 0 0 1 ${f1(hx + 15)} ${f1(hb - 22)}V${f1(hb)}Z" fill="#6c63b6" stroke="${OL}" stroke-width="2.6"/>
      <path d="M${f1(hx - 10)} ${f1(hb)}V${f1(hb - 21)}A10 10 0 0 1 ${f1(hx + 10)} ${f1(hb - 21)}V${f1(hb)}Z" fill="#0b0624"/>
    </g>
    <g class="shadows"></g><g class="actors"></g><g class="fx"></g>`;
  }

  /* closed room with the tabby cat (the cut-away) */
  function cutMarkup() {
    const yw = H * .6, vx = W / 2, vy = H * .42;
    let planks = '';
    for (let i = -14; i <= 14; i++) { const xi = vx + i * W * .09, xb = vx + (xi - vx) * (H - vy) / (yw - vy); planks += `M${f1(xi)} ${f1(yw)}L${f1(xb)} ${H}`; }
    let paper = '';
    for (let x = 8; x < W; x += 18) paper += `M${x} 0V${f1(yw - 16)}`;
    const wx = W * .06, ww = W * .36, wy = H * .1, wh = H * .27;
    CWIN = { x: wx, y: wy, w: ww, h: wh };
    const dx = W * .66, dw = W * .24, dh = H * .46, dy = yw - dh;
    const cx = W * .36, cy = H * .88, cs = Math.min(W / 210, H / 520) * 1.55;
    return `<defs><clipPath id="cWinClip"><rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}"/></clipPath><radialGradient id="cLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffbb62" stop-opacity="0"/></radialGradient></defs>
    <g class="ctRoot">
      <rect x="0" y="0" width="${W}" height="${f1(yw)}" fill="#322a6b"/>
      <path d="${paper}" stroke="rgba(0,0,0,.18)" stroke-width="1.6" fill="none"/>
      <rect x="0" y="${f1(yw - H * .1)}" width="${W}" height="${f1(H * .1)}" fill="#413883"/><rect x="0" y="${f1(yw - H * .1)}" width="${W}" height="3" fill="#8981cd"/>
      <rect x="0" y="${f1(yw)}" width="${W}" height="${f1(H - yw)}" fill="url(#rFloor2)"/>
      <path d="${planks}" stroke="rgba(30,12,8,.5)" stroke-width="2" fill="none"/>
      <rect x="0" y="${f1(yw - 10)}" width="${W}" height="10" fill="#dedcf0"/><rect x="0" y="${f1(yw - 10)}" width="${W}" height="2" fill="#fff"/>
      <g stroke-linejoin="round">
        <rect x="${f1(wx - 6)}" y="${f1(wy - 6)}" width="${f1(ww + 12)}" height="${f1(wh + 12)}" fill="#dedcf0" stroke="${OL}" stroke-width="3"/>
        <rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" fill="#1d1049"/>
        <circle cx="${f1(wx + ww * .74)}" cy="${f1(wy + wh * .3)}" r="${f1(wh * .12)}" fill="#f1e9ff"/><circle cx="${f1(wx + ww * .74 + wh * .06)}" cy="${f1(wy + wh * .3 - wh * .05)}" r="${f1(wh * .11)}" fill="#1d1049"/>
        <g clip-path="url(#cWinClip)"><g class="ctRain"></g></g>
        <path d="M${f1(wx + ww / 2)} ${f1(wy)}V${f1(wy + wh)}M${f1(wx)} ${f1(wy + wh * .55)}H${f1(wx + ww)}" stroke="#dedcf0" stroke-width="3.4"/>
        <rect x="${f1(wx - 12)}" y="${f1(wy + wh + 4)}" width="${f1(ww + 24)}" height="8" fill="#dedcf0" stroke="${OL}" stroke-width="2.4"/>
      </g>
      <ellipse cx="${f1(W * .8)}" cy="${f1(H * .74)}" rx="${f1(W * .5)}" ry="${f1(H * .2)}" fill="url(#cLamp)"/>
      <polygon points="${f1(dx)},${f1(yw)} ${f1(dx + dw)},${f1(yw)} ${f1(dx + dw + W * .16)},${f1(yw + H * .2)} ${f1(dx - W * .16)},${f1(yw + H * .2)}" fill="rgba(255,217,138,.34)"/>
      <g stroke-linejoin="round">
        <rect x="${f1(dx - 8)}" y="${f1(dy - 8)}" width="${f1(dw + 16)}" height="${f1(dh + 8)}" fill="#6b3a22" stroke="${OL}" stroke-width="3"/>
        <rect x="${f1(dx)}" y="${f1(dy)}" width="${f1(dw)}" height="${f1(dh)}" fill="#a8643a" stroke="${OL}" stroke-width="2.6"/>
        <rect x="${f1(dx + dw * .14)}" y="${f1(dy + dh * .07)}" width="${f1(dw * .72)}" height="${f1(dh * .36)}" fill="#8a4a30" stroke="${OL}" stroke-width="2.2"/>
        <rect x="${f1(dx + dw * .14)}" y="${f1(dy + dh * .52)}" width="${f1(dw * .72)}" height="${f1(dh * .38)}" fill="#8a4a30" stroke="${OL}" stroke-width="2.2"/>
        <circle cx="${f1(dx + dw * .18)}" cy="${f1(dy + dh * .5)}" r="5" fill="#f4d35e" stroke="${OL}" stroke-width="2"/>
        <rect x="${f1(dx + 3)}" y="${f1(yw - 7)}" width="${f1(dw - 6)}" height="7" fill="#fff1bd"/>
      </g>
      <ellipse cx="${f1(cx)}" cy="${f1(cy - 4)}" rx="${f1(70 * cs)}" ry="${f1(15 * cs)}" fill="#c4577f" stroke="${OL}" stroke-width="3"/><ellipse cx="${f1(cx)}" cy="${f1(cy - 9)}" rx="${f1(62 * cs)}" ry="${f1(10 * cs)}" fill="#ee86ab"/>
      <ellipse cx="${f1(cx)}" cy="${f1(cy - 2)}" rx="${f1(48 * cs)}" ry="${f1(8 * cs)}" fill="rgba(5,2,15,.35)"/>
      <g class="tabby" transform="translate(${f1(cx)} ${f1(cy - 12)}) scale(${f2(cs)})" stroke-linejoin="round" stroke-linecap="round">${tabbyMarkup()}</g>
      <g class="tHeart" transform="translate(${f1(cx + 40 * cs)} ${f1(cy - 168 * cs)})" opacity="0">
        <circle cx="-26" cy="40" r="3.4" fill="#fff" stroke="${OL}" stroke-width="2"/><circle cx="-16" cy="30" r="5.4" fill="#fff" stroke="${OL}" stroke-width="2"/>
        <ellipse cx="6" cy="0" rx="32" ry="26" fill="#fff" stroke="${OL}" stroke-width="3"/>
        <path d="M6 12 q-17 -12 -15 -22 q1 -8 8 -8 q6 0 7 6 q1 -6 7 -6 q7 0 8 8 q2 10 -15 22z" fill="#ff7fa3" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      </g>
    </g>`;
  }

  /* ---------- state ---------- */
  const M = { x: 0, y: 0, face: 1, phase: 0, sp: 0, walkAmt: 0, sq: 1, hop: 0, stand: 0, paws: 0, look: 0, ear: 0, s: 1, vis: 0, shake: 0 };
  const target = { x: 0, y: 0 };
  const dogs = [mkDog(DOG_A, .72, .66, 1), mkDog(DOG_B, .26, .8, .9)];
  function mkDog(pal, fx, fy, pitch) { return { pal, x: fx, y: fy, fx, fy, dir: 1, st: 'patrol', t: 0, tx: 0, ty: 0, pause: 0, v: 0, phase: Math.random() * 6, cool: 0, mouth: 0, bang: -9, woof: -9, barked: 0, pitch, ear: 0, init: false }; }
  let st = 'intro1', stT = 0, t = 0, reported = false, hintOn = false, ev = {}, drops = [], lastStep = 0, houseT = 0;
  const setState = n => { st = n; stT = 0; ev = {}; };

  let el = {};
  function grab() {
    const q = s => rm.querySelector(s), qa = s => [...rm.querySelectorAll(s)];
    el = { actors: q('.actors'), shadows: q('.shadows'), fx: q('.fx') };
    el.actors.innerHTML = `<g class="actor mouseA">${mouseMarkup}</g><g class="actor dogA0">${dogMarkup(DOG_A)}</g><g class="actor dogA1">${dogMarkup(DOG_B)}</g>`;
    el.shadows.innerHTML = '<ellipse class="shM" rx="1" ry="1" fill="rgba(5,2,15,.5)"/><ellipse class="shD0" rx="1" ry="1" fill="rgba(5,2,15,.5)"/><ellipse class="shD1" rx="1" ry="1" fill="rgba(5,2,15,.5)"/>';
    el.fx.innerHTML = `<g class="bangW0">${bangMarkup}</g><g class="bangW1">${bangMarkup}</g><g class="woofW0">${woofMarkup}</g><g class="woofW1">${woofMarkup}</g><g class="drops"></g>
      <g class="goal" opacity="0"><path d="M0 8 q-11 -11 -15 -3 q0 10 15 19 q15 -9 15 -19 q-4 -8 -15 3z" fill="#ff7fa3" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/></g>`;
    const A = el.actors;
    el.mouse = A.querySelector('.mouseA');
    el.m = { root: el.mouse.querySelector('.mRoot'), squash: el.mouse.querySelector('.mSquash'), body: el.mouse.querySelector('.mBody'), head: el.mouse.querySelector('.mHead'), ear: el.mouse.querySelector('.mEar'), tail: el.mouse.querySelector('.mTail'),
      bn: el.mouse.querySelector('.mLegBN'), bf: el.mouse.querySelector('.mLegBF'), fn: el.mouse.querySelector('.mLegFN'), ff: el.mouse.querySelector('.mLegFF'), letter: el.mouse.querySelector('.mLetter') };
    dogs.forEach((d, i) => {
      const g = A.querySelector('.dogA' + i);
      d.el = { g, root: g.querySelector('.dRoot'), body: g.querySelector('.dBody'), head: g.querySelector('.dHead'), ear: g.querySelector('.dEar'), tail: g.querySelector('.dTail'),
        bn: g.querySelector('.dLegBN'), bf: g.querySelector('.dLegBF'), fn: g.querySelector('.dLegFN'), ff: g.querySelector('.dLegFF'), mo: g.querySelector('.dMouthOpen'), ms: g.querySelector('.dMouthShut'),
        bang: el.fx.querySelector('.bangW' + i + ' .bang'), bangW: el.fx.querySelector('.bangW' + i), woof: el.fx.querySelector('.woofW' + i + ' .woof'), sh: el.shadows.querySelector('.shD' + i) };
    });
    el.winRain = rm.querySelector('.winRain'); el.ctRain = ct.querySelector('.ctRain');
    el.shM = el.shadows.querySelector('.shM'); el.drops = el.fx.querySelector('.drops'); el.goal = el.fx.querySelector('.goal');
    // cut-away
    el.cut = { root: ct.querySelector('.ctRoot'), tabby: ct.querySelector('.tabby'), tail: ct.querySelector('.tabby .cTail'), body: ct.querySelector('.tabby .cBody'), head: ct.querySelector('.tabby .cHead'),
      eyes: [...ct.querySelectorAll('.tabby .cEyeScale')], pupils: [...ct.querySelectorAll('.tabby .cPupil')], heart: ct.querySelector('.tHeart') };
  }

  function layout() {
    const r = root.getBoundingClientRect(), nW = Math.max(1, r.width), nH = Math.max(1, r.height);
    const rx = W > 1 ? nW / W : 1, ry = H > 1 ? nH / H : 1;
    if (W > 1) for (const o of [M, target, ...dogs]) { o.x *= rx; o.y *= ry; o.tx = (o.tx || 0) * rx; o.ty = (o.ty || 0) * ry; }
    W = nW; H = nH; sf = W / 390;
    rm.setAttribute('viewBox', `0 0 ${W} ${H}`); ct.setAttribute('viewBox', `0 0 ${W} ${H}`);
    yW = Math.round(H * .37); vp = { x: W / 2, y: yW - H * .16 };
    DOOR = { x: W * .76, w: W * .13, y: yW };
    const hx = W * .045; HOLE = { x: hx, y: wallBaseY(hx) };
    HOME = { x: W * .1, y: HOLE.y + H * .035 };
    rm.innerHTML = roomMarkup();
    ct.innerHTML = `<defs><linearGradient id="rFloor2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a22"/><stop offset="1" stop-color="#b06a3c"/></linearGradient></defs>` + cutMarkup();
    grab();
    seedRain(winDrops, WIN, Math.round(12 + WIN.w / 9)); seedRain(ctDrops, CWIN, Math.round(10 + CWIN.w / 14));
    dogs.forEach(d => { if (!d.init) { d.x = d.fx * W; d.y = yW + (H - yW) * (d.fy - .2) / .8 + H * .05; d.init = true; pickWaypoint(d); } });
    if (!M.init) { M.init = true; M.x = HOLE.x; M.y = HOLE.y - 8; target.x = HOME.x; target.y = HOME.y; }
  }

  /* ---------- rain on the window glass (so you can tell we are indoors now) ---------- */
  const winDrops = [], ctDrops = [];
  function seedRain(arr, win, n) {
    arr.length = 0;
    for (let i = 0; i < n; i++) arr.push({ x: win.x + Math.random() * win.w, y: win.y + Math.random() * win.h, vy: 150 + Math.random() * 150, len: 7 + Math.random() * 9, slow: Math.random() < .28 });
  }
  function stepRain(arr, win, dt, k) {
    for (const d of arr) {
      const v = (d.slow ? d.vy * .22 : d.vy) * k;
      d.y += v * dt; d.x -= v * .14 * dt;
      if (d.y > win.y + win.h + 12) { d.y = win.y - 12; d.x = win.x + Math.random() * (win.w + 24); }
      if (d.x < win.x - 12) d.x += win.w + 24;
    }
  }
  function rainMarkup(arr, k) {
    let m = '';
    for (const d of arr) {
      if (d.slow) m += `<path d="M${f1(d.x)} ${f1(d.y)}l${f1(-.6 * k)} ${f1(-9 * k)}" stroke="#cdc9f0" stroke-width="${f1(1.8 * k)}" stroke-linecap="round"/><circle cx="${f1(d.x)}" cy="${f1(d.y)}" r="${f1(2.1 * k)}" fill="#cdc9f0"/>`;
      else m += `<path d="M${f1(d.x)} ${f1(d.y)}l${f1(-d.len * .14 * k)} ${f1(-d.len * k)}" stroke="#8981cd" stroke-width="${f1(1.7 * k)}" stroke-linecap="round"/>`;
    }
    return m;
  }
  /* very soft, muffled rain from outside (the opening's rain was loud; this is the same rain heard through a window) */
  let rainNodes = null;
  function indoorRain() {
    if (!ok() || rainNodes) return; const ac = AU.ac;
    const src = ac.createBufferSource(); src.buffer = AU.nbuf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = .6;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.linearRampToValueAtTime(.045, ac.currentTime + 1.5);
    src.connect(lp).connect(g).connect(out.get()); src.start(); rainNodes = src;
  }

  /* ---------- floor rules ---------- */
  function clampFloor(o) {
    const sofa = o.x > W * .22 && o.x < W * .6, minY = sofa ? yW + 26 : yW + 8;
    o.x = clamp(o.x, W * .03, W * .97); o.y = clamp(o.y, minY, H - 24);
  }
  function pickWaypoint(d) {
    const toward = Math.random() < .4 && st === 'play';
    let tx, ty;
    if (toward) { tx = M.x + (Math.random() - .5) * W * .3; ty = M.y + (Math.random() - .5) * H * .15; }
    else { tx = W * (.06 + Math.random() * .88); ty = yW + 30 + Math.random() * (H - yW - 60); }
    d.tx = tx; d.ty = ty; clampFloor(d.tx !== undefined ? { get x() { return d.tx; }, set x(v) { d.tx = v; }, get y() { return d.ty; }, set y(v) { d.ty = v; } } : d);
  }
  function stepToward(o, tx, ty, speed, dt) {
    const sc = scaleAt(o.y), dx = tx - o.x, dy = (ty - o.y) / DEPTH, d = Math.hypot(dx, dy);
    if (d < 1.5) { o.v = 0; return 0; }
    const step = Math.min(d, speed * sc * dt);
    o.x += dx / d * step; o.y += dy / d * step * DEPTH;
    o.v = step / Math.max(dt, 1e-4);
    return d - step;
  }
  const worldDist = (a, b) => { const sc = (scaleAt(a.y) + scaleAt(b.y)) / 2; return Math.hypot((a.x - b.x) / sc, (a.y - b.y) / DEPTH / sc); };

  /* ---------- input: finger / mouse anywhere moves the mouse there ---------- */
  let pressed = false;
  function setTarget(e) {
    const r = root.getBoundingClientRect();
    target.x = e.clientX - r.left; target.y = e.clientY - r.top - 14 * sf;       // a little above the finger so it stays visible
    clampFloor(target);
  }
  const onDown = e => {
    Seq.audioInit();
    if (st === 'cut' && stT > .8) { setState('back'); doFlash(); showRoom(); return; }     // tap skips the cut-away
    if (st !== 'play') return;
    pressed = true; try { root.setPointerCapture(e.pointerId); } catch (_) {}
    setTarget(e); e.preventDefault();
  };
  const onMove = e => { if (pressed && st === 'play') { setTarget(e); e.preventDefault(); } };
  const onUp = () => { pressed = false; };
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp);

  /* ---------- tuning ---------- */
  const MOUSE_V = () => W * .66, DOG_V = () => W * .5, CHASE_V = () => W * .6;
  const SIGHT = () => W * .34, CATCH = () => 30 * sf;
  const doorHit = () => Math.abs(M.x - DOOR.x) < DOOR.w * .62 && M.y < yW + 20;

  function doFlash() { flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 110); }
  function showCut() { rm.style.display = 'none'; ct.style.display = ''; }
  function showRoom() { ct.style.display = 'none'; rm.style.display = ''; }

  /* ---------- update ---------- */
  function spawnDrops(n) { for (let i = 0; i < n; i++) drops.push({ x: M.x + (Math.random() - .5) * 30 * sf, y: M.y - 22 * sf * scaleAt(M.y), vx: (Math.random() - .5) * 150, vy: -60 - Math.random() * 80, a: 0 }); }
  function updateDogs(dt) {
    for (const d of dogs) {
      d.t += dt; d.cool = Math.max(0, d.cool - dt);
      if (d.st === 'patrol' || d.st === 'cool') {
        if (d.pause > 0) { d.pause -= dt; d.v = 0; }
        else {
          const left = stepToward(d, d.tx, d.ty, DOG_V(), dt);
          if (Math.abs(d.tx - d.x) > 3) d.dir = d.tx > d.x ? 1 : -1;
          if (left < 4) { d.pause = Math.random() < .3 ? .18 + Math.random() * .3 : 0; pickWaypoint(d); }
        }
        if (d.st === 'cool' && d.cool <= 0) d.st = 'patrol';
        // sight
        if (st === 'play' && d.st === 'patrol' && d.cool <= 0 && M.vis > .5) {
          const front = (M.x - d.x) * d.dir > -W * .05;
          if (front && worldDist(d, M) < SIGHT() / sf) { d.st = 'alert'; d.t = 0; d.bang = t; d.barked = 0; d.dir = M.x > d.x ? 1 : -1; d.v = 0; snd.alarm(); }
        }
      } else if (d.st === 'alert') {
        d.v = 0; d.dir = M.x > d.x ? 1 : -1;
        const b = d.t * 5.2;
        d.mouth = Math.sin(b * Math.PI) > .1 ? 1 : 0;
        if (d.barked < 2 && d.t > d.barked * .38 + .05) { d.barked++; d.woof = t; snd.bark(d.pitch); M.sq = Math.min(M.sq, .86); }
        if (d.t > .85) { d.st = 'chase'; d.t = 0; d.mouth = 0; }
      } else if (d.st === 'chase') {
        const left = stepToward(d, M.x, M.y, CHASE_V(), dt);
        if (Math.abs(M.x - d.x) > 3) d.dir = M.x > d.x ? 1 : -1;
        d.mouth = d.t % .24 < .12 ? 1 : 0;
        if (st === 'play' && worldDist(d, M) < CATCH() / sf) caught(d);
        else if (d.t > 1.25) { d.st = 'cool'; d.cool = 2; d.mouth = 0; pickWaypoint(d); }
      }
      if (d.st !== 'alert' && d.st !== 'chase') d.mouth = 0;
      d.phase += dt * (d.v / Math.max(1, W * .5)) * 9.5 * (d.st === 'chase' ? 1.1 : 1);
      clampFloor(d);
    }
  }
  function caught(d) {
    if (st !== 'play') return;
    setState('home'); pressed = false; snd.squeak(); Seq.vib([20, 40, 20]);
    for (const o of dogs) { o.st = 'cool'; o.cool = 2.6; o.mouth = 0; pickWaypoint(o); }
    M.sq = .8;
  }
  function updateMouse(dt) {
    let want = 0, dx = 0, dy = 0, dist = 0;
    if (st === 'play' || st === 'home') {
      const tx = st === 'home' ? HOME.x : target.x, ty = st === 'home' ? HOME.y : target.y;
      dx = tx - M.x; dy = (ty - M.y) / DEPTH; dist = Math.hypot(dx, dy);
      const vmax = st === 'home' ? W * 1.15 : MOUSE_V();
      want = dist > 2 ? Math.min(vmax, dist * 16) : 0;
      M.sp = lerp(M.sp, want, Math.min(1, dt * 20));
      if (dist > 1) {
        const sc = scaleAt(M.y), step = Math.min(dist, M.sp * sc * dt);
        M.x += dx / dist * step; M.y += dy / dist * step * DEPTH;
        if (Math.abs(dx) > 5) M.face = dx > 0 ? 1 : -1;
      }
      clampFloor(M);
      if (st === 'home' && dist < 6) { setState('play'); target.x = M.x; target.y = M.y; M.face = 1; snd.pop(); }
    } else M.sp = lerp(M.sp, 0, Math.min(1, dt * 14));
    M.walkAmt = clamp(M.sp / (W * .22), 0, 1);
    if (M.sp > 6) { M.phase += dt * M.sp / Math.max(1, W * .5) * 13; const si = Math.floor(M.phase / Math.PI); if (si !== lastStep) { lastStep = si; snd.patter(); } }
  }

  function update(dt) {
    t += dt; stT += dt; houseT += dt;
    updateDogs(dt);
    let standT = 0, lookT = 0, earT = 0, pawsT = 0, sqT = 1;
    if (st === 'intro1') {
      M.vis = stT > .3 ? 1 : 0;
      if (stT < 1.15) {
        const u = clamp((stT - .3) / .85, 0, 1), e = easeInOut(u);
        M.x = lerp(HOLE.x + 6, HOME.x, e); M.y = lerp(HOLE.y - 6, HOME.y, e); M.s = lerp(.55, 1, e); M.hop = Math.sin(Math.PI * u) * 10 * sf; M.face = 1; M.sp = 60;
        M.walkAmt = 1; M.phase += dt * 10;
        if (!ev.sq) { ev.sq = 1; snd.squeak(); }
      } else {
        M.sp = 0; M.walkAmt = 0; M.hop = 0; M.s = 1;
        if (stT < 1.75) {                                          // shake off the rain
          const u = (stT - 1.15) / .6; sqT = 1 + Math.sin(u * 40) * .09; M.x += Math.sin(u * 44) * .35;
          if (!ev.sh) { ev.sh = 1; snd.shake(); spawnDrops(8); } if (stT > 1.4 && !ev.sh2) { ev.sh2 = 1; spawnDrops(6); }
        } else { standT = .3; lookT = -18; earT = 1; }              // look around the new house
      }
      if (stT > 2.55) { setState('cut'); doFlash(); showCut(); snd.pop(); }
    } else if (st === 'cut') {
      M.vis = 0;
      if (stT > .9 && !ev.h) { ev.h = 1; snd.chime(); }
      if (stT > 1.7 && !ev.m) { ev.m = 1; snd.mew(); }
      if (stT > 3.4) { setState('back'); doFlash(); showRoom(); }
    } else if (st === 'back') {
      M.vis = 1; if (stT > .45) { setState('play'); hintOn = true; houseT = 0; target.x = M.x; target.y = M.y; hint.classList.add('on'); }
    } else if (st === 'play') {
      M.vis = 1;
      if (hintOn && (houseT > 5 || (pressed && houseT > 1.2))) { hintOn = false; hint.classList.remove('on'); }
      if (doorHit()) { setState('enter'); pressed = false; ev.x0 = M.x; ev.y0 = M.y; snd.slip(); Seq.vib([10, 30, 10]); for (const o of dogs) { o.st = 'cool'; o.cool = 5; o.mouth = 0; } }
    } else if (st === 'enter') {
      const u = clamp(stT / .85, 0, 1), e = easeInOut(u);
      M.x = lerp(ev.x0, DOOR.x, e); M.y = lerp(ev.y0, yW + 3, e); M.sp = 70; M.walkAmt = 1; M.phase += dt * 9; M.face = M.x < DOOR.x ? 1 : (M.x > DOOR.x ? -1 : M.face);
      M.s = lerp(1, .7, e); sqT = lerp(1, .22, easeInOut(clamp((u - .45) / .55, 0, 1))); M.vis = 1 - clamp((u - .8) / .2, 0, 1);
      if (u >= 1 && !reported) { reported = true; M.vis = 0; done({ x: DOOR.x, y: yW - 4 }); }
    }
    updateMouse(dt);
    M.stand = lerp(M.stand, standT, Math.min(1, dt * 7)); M.look = lerp(M.look, lookT, Math.min(1, dt * 8)); M.ear = lerp(M.ear, earT, Math.min(1, dt * 10));
    M.sq = lerp(M.sq, sqT, Math.min(1, dt * 14));
    stepRain(winDrops, WIN, dt, sf); stepRain(ctDrops, CWIN, dt, sf * 1.6);
    for (let i = drops.length - 1; i >= 0; i--) { const p = drops[i]; p.a += dt; p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.a > .7) drops.splice(i, 1); }
  }

  /* ---------- render ---------- */
  function renderMouse() {
    const sc = scaleAt(M.y) * sf * .82 * M.s, th = M.stand * 55, ph = M.phase, sw = Math.sin(ph) * 30 * M.walkAmt;
    const sy = M.sq, sx = 1 / Math.sqrt(sy), bob = -Math.abs(Math.sin(ph)) * 2.4 * M.walkAmt, m = el.m;
    el.mouse.setAttribute('opacity', f2(M.vis));
    m.root.setAttribute('transform', `translate(${f2(M.x)} ${f2(M.y - M.hop + bob * sc)}) scale(${f2(M.face * sc)} ${f2(sc)})`);
    m.squash.setAttribute('transform', `scale(${f2(sx)} ${f2(sy)})`);
    m.body.setAttribute('transform', `rotate(${f2(-th)} -14 0)`);
    m.head.setAttribute('transform', `rotate(${f2(M.look)} 20 -22)`);
    m.ear.setAttribute('transform', `translate(8 -32) scale(${f2(1 + .14 * M.ear)} ${f2(1 + .26 * M.ear)}) rotate(${f2(-8 * M.ear)}) translate(-8 32)`);
    m.tail.setAttribute('transform', `rotate(${f2(Math.sin(t * 3.2) * 7 + Math.sin(ph) * 6 * M.walkAmt)} -30 -19)`);
    m.bn.setAttribute('transform', `translate(-14 -14) rotate(${f2(sw)})`); m.bf.setAttribute('transform', `translate(-8 -14) rotate(${f2(-sw)})`);
    m.fn.setAttribute('transform', `translate(20 -14) rotate(${f2(-sw)})`); m.ff.setAttribute('transform', `translate(16 -14) rotate(${f2(sw)})`);
    m.letter.setAttribute('transform', `translate(-6 ${f2(-50 - M.stand * 10)}) scale(${M.face} 1) rotate(-8) scale(.31) translate(-80 -55)`);
    el.shM.setAttribute('cx', f2(M.x)); el.shM.setAttribute('cy', f2(M.y + 1)); el.shM.setAttribute('rx', f2(30 * sc * 1.1 * (1 - Math.min(M.hop / 40, .3)))); el.shM.setAttribute('ry', f2(6.5 * sc * 1.1));
    el.shM.setAttribute('opacity', f2(M.vis * .9));
  }
  function renderDog(d, i) {
    const sc = scaleAt(d.y) * sf * .95, e = d.el, walk = clamp(d.v / (W * .3), 0, 1), sw = Math.sin(d.phase) * 36 * walk, bob = Math.abs(Math.sin(d.phase)) * 3 * walk;
    const barking = d.st === 'alert' || (d.st === 'chase' && d.mouth);
    e.root.setAttribute('transform', `translate(${f2(d.x)} ${f2(d.y - bob * sc)}) scale(${f2(d.dir * sc)} ${f2(sc)})`);
    e.bn.setAttribute('transform', `translate(-21 -16) rotate(${f2(sw)})`); e.bf.setAttribute('transform', `translate(-12 -16) rotate(${f2(-sw)})`);
    e.fn.setAttribute('transform', `translate(18 -16) rotate(${f2(-sw)})`); e.ff.setAttribute('transform', `translate(11 -16) rotate(${f2(sw)})`);
    e.tail.setAttribute('transform', `rotate(${f2(Math.sin(t * (barking ? 20 : 11) + i) * (barking ? 22 : 14))} -30 -34)`);
    d.ear = lerp(d.ear, -sw * .5 - walk * 8, .3);
    e.ear.setAttribute('transform', `rotate(${f2(d.ear)} 23 -56)`);
    e.head.setAttribute('transform', `rotate(${barking ? (d.mouth ? -12 : -5) : f2(Math.sin(d.phase * 2) * 2 * walk)} 30 -34)`);
    e.mo.setAttribute('opacity', d.mouth ? 1 : 0); e.ms.setAttribute('opacity', d.mouth ? 0 : 1);
    e.sh.setAttribute('cx', f2(d.x)); e.sh.setAttribute('cy', f2(d.y + 1)); e.sh.setAttribute('rx', f2(40 * sc)); e.sh.setAttribute('ry', f2(7.5 * sc));
    // red "!!" above the head, only for a moment
    const ba = t - d.bang, hx = d.x + d.dir * 26 * sc, hy = d.y - 86 * sc;
    if (ba >= 0 && ba < 1.5) {
      const pop = easeOutBack(clamp(ba / .22, 0, 1)), fade = 1 - clamp((ba - 1.2) / .3, 0, 1), jig = Math.sin(ba * 40) * (ba < .5 ? 3 : 0);
      e.bang.setAttribute('opacity', f2(fade));
      e.bangW.setAttribute('transform', `translate(${f2(hx + jig)} ${f2(hy)}) scale(${f2(Math.max(.01, pop) * sc * 1.6)})`);
    } else e.bang.setAttribute('opacity', 0);
    const wa = t - d.woof;
    if (wa >= 0 && wa < .55) {
      const pop = easeOutBack(clamp(wa / .12, 0, 1));
      e.woof.setAttribute('opacity', f2(1 - clamp((wa - .38) / .17, 0, 1)));
      e.woof.parentNode.setAttribute('transform', `translate(${f2(d.x + d.dir * 66 * sc)} ${f2(d.y - 36 * sc)}) scale(${f2(d.dir * Math.max(.01, pop) * sc * .9)} ${f2(Math.max(.01, pop) * sc * .9)})`);
    } else e.woof.setAttribute('opacity', 0);
  }
  function renderRoom() {
    el.winRain.innerHTML = rainMarkup(winDrops, sf);
    renderMouse(); dogs.forEach(renderDog);
    // depth order: whoever is lower on the screen is drawn in front
    const order = [{ y: M.y, n: el.mouse }, { y: dogs[0].y, n: dogs[0].el.g }, { y: dogs[1].y, n: dogs[1].el.g }].sort((a, b) => a.y - b.y);
    for (let i = 0; i < order.length; i++) if (el.actors.children[i] !== order[i].n) el.actors.appendChild(order[i].n);
    // falling raindrops shaken off the mouse
    let dh = ''; for (const p of drops) dh += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(2.4 * sf)}" fill="#aaa4e0" opacity="${f2(1 - p.a / .7)}"/>`;
    el.drops.innerHTML = dh;
    // the door's heart: bobs so the goal is easy to spot
    const gh = (st === 'play' || st === 'back' || st === 'home') ? 1 : 0;
    el.goal.setAttribute('opacity', gh);
    el.goal.setAttribute('transform', `translate(${f1(DOOR.x)} ${f1(yW - (yW - H * .03) * .78 - 20 + Math.sin(t * 4) * 4)}) scale(${f2(sf * (1 + .08 * Math.sin(t * 8)))})`);
    if (st === 'home') {} 
  }
  function renderCut() {
    el.ctRain.innerHTML = rainMarkup(ctDrops, Math.min(W / 210, H / 520) * 1.3);
    const c = el.cut, u = clamp(stT / 3.4, 0, 1), z = 1 + .12 * easeOut(u);
    c.root.setAttribute('transform', `translate(${f1(W * .42)} ${f1(H * .62)}) scale(${f2(z)}) translate(${f1(-W * .42)} ${f1(-H * .62)})`);
    const tt = ct.style.display === 'none' ? 0 : t;
    c.tail.setAttribute('transform', `rotate(${f2(Math.sin(tt * 2.6) * 14)} 38 -8)`);
    c.body.setAttribute('transform', `scale(1 ${f2(1 + .012 * Math.sin(tt * 2.2))})`);
    const blink = (tt % 3.1) < .13, look = clamp((stT - .5) / .5, 0, 1);
    c.head.setAttribute('transform', `translate(0 -66) rotate(${f2(look * 6 + Math.sin(tt * 1.1) * 1.5)} 0 22)`);
    c.eyes.forEach(e => e.setAttribute('transform', `scale(1 ${blink ? .1 : 1})`));
    c.pupils.forEach(p => p.setAttribute('transform', `translate(${f2(look * 3.4)} ${f2(look * -.4)})`));
    const hp = clamp((stT - .9) / .4, 0, 1);
    c.heart.setAttribute('opacity', hp > 0 ? 1 : 0);
    const k0 = Math.min(W / 210, H / 520) * 1.55, cx = W * .36, cy = H * .88;
    c.heart.setAttribute('transform', `translate(${f1(cx + 50 * k0)} ${f1(cy - 178 * k0 + Math.sin(tt * 3) * 3)}) scale(${f2(Math.max(.01, easeOutBack(hp)) * (1 + .06 * Math.sin(tt * 7)) * k0 * .75)})`);
  }
  function render() { if (st === 'cut') renderCut(); else renderRoom(); }

  /* ---------- go ---------- */
  layout(); indoorRain(); update(.016); render();
  const ro = new ResizeObserver(() => { layout(); }); ro.observe(root);
  let last = performance.now();
  return {
    entry: { x: W * .5, y: H * .5 },
    frame(now) { const dt = clamp((now - last) / 1000, 0, 1 / 30); last = now; update(dt); render(); px.render(now); },
    destroy() { ro.disconnect(); px.destroy(); if (rainNodes) { try { rainNodes.stop(); } catch (e) {} } out.close(); }
  };
};
