/* Step 1 — Sneak past the dogs (and hide from them).
   The mouse has just come in through a hole in the wall of a new house. Intro: the mouse gets
   in, we cut to the tabby cat waiting in a closed room (the goal), then cut back. Game: drag your
   finger (or mouse) anywhere and the mouse runs to it; two fast dogs patrol the living room.
   When a dog sees the mouse, red "!!" pops up, it barks and runs at it. Reach the glowing door
   and slip under it. Same mouse art as the opening; the dogs and the tabby are drawn like the cat. */
Seq.scenes.route = (root, done) => {
  root.classList.add('sc-room');
  root.innerHTML = `
  <svg class="scene-svg rm" xmlns="http://www.w3.org/2000/svg"></svg>
  <div class="flash" data-px-ui></div>
  <div class="hint" data-px-ui>Drag to move · tap a box or hole to hide</div>`;
  const rm = root.querySelector('svg.rm'), flash = root.querySelector('.flash'), hint = root.querySelector('.hint');
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
  const { mouseMarkup, tabbyMarkup } = Seq.art;
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

  /* ---------- geometry: a flat, top-down room (like Spy Mouse) ----------
     Ground position = (X, Z): X is -1..1 across the floor, Z runs from S0 (the top wall) down to 1 (the bottom wall). Everything is linear, no perspective. */
  const S0 = .45;
  let WIN = { x: 0, y: 0, w: 1, h: 1 };
  let W = 1, H = 1, sf = 1, bw = 20, ft = 100, fb = 700, fl = 20, fr = 370, hw = 175, fh = 600;
  const proj = (X, Z) => ({ x: (fl + fr) / 2 + X * hw, y: ft + (Z - S0) / (1 - S0) * fh });
  const unproj = (x, y) => ({ X: (x - (fl + fr) / 2) / hw, Z: S0 + (y - ft) / fh * (1 - S0) });
  const zScale = () => .66;
  const pts = a => a.map(p => `${f1(p.x)},${f1(p.y)}`).join(' ');
  const ROOMX = .3, ROOMZ = .8, EXIT = { X: .86 }, DOORX = .56;                          // the locked door on the right wall, and the mouse hole beside it (the way in)
  const BOXES = [{ X: -.55, Z: .7 }, { X: .22, Z: .93 }];                    // cardboard boxes the mouse can jump into
  const HOLES = [{ X: -.82 }];                                                // the mouse hole in the top wall (where the mouse came in; also a hiding place)
  // furniture and walls: solid for everybody and they block the dogs' sight. 'room' is the tabby's closed room: its locked door and the mouse hole beside it are in its bottom wall.
  const OBST = [
    { id: 'sofa', x0: -.55, x1: .12, z0: S0, z1: S0 + .15 },
    { id: 'room', x0: ROOMX, x1: 1.0, z0: S0, z1: ROOMZ },
    { id: 'table', x0: -.3, x1: .1, z0: .68, z1: .79 },
    { id: 'plant', x0: .72, x1: .9, z0: .9, z1: .99 },
    { id: 'shelf', x0: -.92, x1: -.8, z0: .6, z1: .84 },
    { id: 'chair', x0: -.92, x1: -.7, z0: .91, z1: .985 }
  ];
  const blockedAt = (X, Z, px = .018, pz = .014) => OBST.some(o => X > o.x0 - px && X < o.x1 + px && Z > o.z0 - pz && Z < o.z1 + pz);
  const losFree = (a, b) => { for (let i = 1; i < 14; i++) { const u = i / 14; if (blockedAt(a.X + (b.X - a.X) * u, a.Z + (b.Z - a.Z) * u, 0, 0)) return false; } return true; };
  let spots = [];

  function boxMarkup() {
    return `<g class="boxRoot" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="3" cy="2" rx="40" ry="8" fill="rgba(5,2,15,.45)"/>
      <path d="M-30 -36 L28 -36 L36 -47 L-22 -47Z" fill="#3a2418" stroke="${OL}" stroke-width="2.6"/>
      <g class="peek" opacity="0">
        <circle cx="-11" cy="-44" r="6.4" fill="#b6adcf" stroke="${OL}" stroke-width="2.4"/><circle cx="-11" cy="-44" r="3.6" fill="#f48fae"/>
        <circle cx="11" cy="-44" r="6.4" fill="#b6adcf" stroke="${OL}" stroke-width="2.4"/><circle cx="11" cy="-44" r="3.6" fill="#f48fae"/>
        <ellipse cx="0" cy="-38" rx="12" ry="6" fill="#b6adcf" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="-4.5" cy="-38" r="2.1" fill="#fff"/><circle cx="4.5" cy="-38" r="2.1" fill="#fff"/><circle cx="-4" cy="-37.6" r="1.1" fill="${OL}"/><circle cx="5" cy="-37.6" r="1.1" fill="${OL}"/>
      </g>
      <rect x="-30" y="-36" width="58" height="36" fill="#d9965a" stroke="${OL}" stroke-width="3"/>
      <path d="M28 -36 L36 -47 L36 -11 L28 0Z" fill="#b06a3c" stroke="${OL}" stroke-width="3"/>
      <rect x="-5" y="-36" width="11" height="15" fill="#e8c08a" stroke="${OL}" stroke-width="2"/>
      <path d="M-30 -36 L-37 -41 L-33 -30Z" fill="#e8c08a" stroke="${OL}" stroke-width="2.2"/>
      <path d="M-14 -13 q-6 -6 -8 -1 q0 5 8 9 q8 -4 8 -9 q-2 -5 -8 1z" fill="#ff7fa3" stroke="${OL}" stroke-width="1.6"/>
    </g>`;
  }

  function roomMarkup() {
    const cx = W / 2, R_ = (x0, z0, x1, z1) => { const a = proj(x0, z0), b = proj(x1, z1); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; };
    let planks = '', seams = '', paper = '';
    for (let x = fl + 38 * sf; x < fr; x += 38 * sf) planks += `M${f1(x)} ${f1(ft)}V${f1(fb)}`;
    for (let k = 0; k < 14; k++) { const y = ft + (k * 61 % 97) / 97 * fh; seams += `M${f1(fl + 38 * sf * (k % 3))} ${f1(y)}h${f1(38 * sf)}`; }
    for (let x = 14 * sf; x < W; x += 26 * sf) paper += `M${f1(x)} 4V${f1(ft - 14 * sf)}`;
    const wx = W * .28, wy = ft * .16, ww = W * .27, wh = ft * .52;
    WIN = { x: wx, y: wy, w: ww, h: wh };
    const hole0 = proj(HOLES[0].X, S0);
    const hx = hole0.x, hy = ft, hwd = 13 * sf, hhh = 30 * sf;
    const sofa = R_(OBST[0].x0, OBST[0].z0, OBST[0].x1, OBST[0].z1), room = R_(OBST[1].x0, OBST[1].z0, OBST[1].x1, OBST[1].z1), table = R_(OBST[2].x0, OBST[2].z0, OBST[2].x1, OBST[2].z1), plant = R_(OBST[3].x0, OBST[3].z0, OBST[3].x1, OBST[3].z1);
    const rug = R_(-.62, .6, .34, .92), pc = { x: plant.x + plant.w / 2, y: plant.y + plant.h / 2 + 4 };
    let stars = '';
    for (let i = 0; i < 6; i++) stars += `<circle cx="${f1(wx + 6 + (i * 37 % Math.max(8, ww - 12)))}" cy="${f1(wy + 6 + (i * 23 % Math.max(8, wh * .5)))}" r="1.4" fill="#fff"/>`;
    const tw = 14 * sf, rb = room.y + room.h, ix = room.x + tw, iw = fr - ix, ih = rb - tw - ft, dX = proj(DOORX, 0).x, dW = 30 * sf, eX = proj(EXIT.X, 0).x, tcx = ix + iw / 2, tcy = ft + ih * .62;
    return `
    <defs><clipPath id="rWinClip"><rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}"/></clipPath></defs>
    <g class="cam">
    <rect width="${W}" height="${H}" fill="#1c1740"/>
    <rect x="${f1(fl)}" y="${f1(ft)}" width="${f1(fr - fl)}" height="${f1(fb - ft)}" fill="#a8643a"/>
    ${(() => { let s = ''; let i = 0; for (let x = fl; x < fr; x += 38 * sf, i++) s += `<rect x="${f1(x)}" y="${f1(ft)}" width="${f1(Math.min(38 * sf, fr - x))}" height="${f1(fb - ft)}" fill="${i % 2 ? '#a35f37' : '#b06a3c'}"/>`; return s; })()}
    <path d="${planks}" stroke="rgba(30,12,8,.5)" stroke-width="2" fill="none"/>
    <path d="${seams}" stroke="rgba(30,12,8,.4)" stroke-width="2" fill="none"/>
    <rect x="0" y="0" width="${W}" height="${f1(ft)}" fill="#413883"/>
    <path d="${paper}" stroke="rgba(0,0,0,.16)" stroke-width="1.6" fill="none"/>
    <rect x="0" y="${f1(ft - 12 * sf)}" width="${W}" height="${f1(12 * sf)}" fill="#dedcf0"/><rect x="0" y="${f1(ft - 12 * sf)}" width="${W}" height="2" fill="#fff"/>
    <rect x="0" y="0" width="${W}" height="${f1(7 * sf)}" fill="#6c63b6"/>
    <g stroke-linejoin="round">
      <rect x="${f1(wx - 4)}" y="${f1(wy - 4)}" width="${f1(ww + 8)}" height="${f1(wh + 8)}" fill="#dedcf0" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" fill="#1d1049"/>
      ${stars}
      <circle cx="${f1(wx + ww * .68)}" cy="${f1(wy + wh * .26)}" r="${f1(ww * .13)}" fill="#f1e9ff"/><circle cx="${f1(wx + ww * .68 + ww * .07)}" cy="${f1(wy + wh * .26 - ww * .05)}" r="${f1(ww * .12)}" fill="#1d1049"/>
      <g clip-path="url(#rWinClip)"><g class="winRain"></g></g>
      <path d="M${f1(wx + ww / 2)} ${f1(wy)}V${f1(wy + wh)}M${f1(wx)} ${f1(wy + wh * .55)}H${f1(wx + ww)}" stroke="#dedcf0" stroke-width="2.6"/>
      <rect x="${f1(wx - 7)}" y="${f1(wy + wh + 2)}" width="${f1(ww + 14)}" height="6" fill="#dedcf0" stroke="${OL}" stroke-width="2"/>
      <path d="M${f1(wx - 6)} ${f1(wy - 6)}h${f1(ww * .2)}q-3 ${f1(wh * .5)} 1 ${f1(wh + 4)}h-${f1(ww * .2 - 3)}z" fill="#c4577f" stroke="${OL}" stroke-width="2"/>
      <path d="M${f1(wx + ww + 6)} ${f1(wy - 6)}h-${f1(ww * .2)}q3 ${f1(wh * .5)} -1 ${f1(wh + 4)}h${f1(ww * .2 - 3)}z" fill="#c4577f" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(W * .68)}" y="${f1(ft * .2)}" width="${f1(W * .2)}" height="${f1(ft * .44)}" fill="#8981cd" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${f1(W * .7)}" y="${f1(ft * .27)}" width="${f1(W * .16)}" height="${f1(ft * .3)}" fill="#ffc4d6"/>
      <path d="M${f1(W * .78)} ${f1(ft * .52)} q-8 -7 -10 -1 q0 7 10 12 q10 -5 10 -12 q-2 -6 -10 1z" fill="#e5475c"/>
      <!-- the mouse hole the mouse came in through (in the top wall) -->
      <path d="M${f1(hx - hwd - 3)} ${f1(hy)}V${f1(hy - hhh)}A${f1(hwd + 3)} ${f1(hwd + 3)} 0 0 1 ${f1(hx + hwd + 3)} ${f1(hy - hhh)}V${f1(hy)}Z" fill="#6c63b6" stroke="${OL}" stroke-width="2.6"/>
      <path d="M${f1(hx - hwd)} ${f1(hy)}V${f1(hy - hhh)}A${f1(hwd)} ${f1(hwd)} 0 0 1 ${f1(hx + hwd)} ${f1(hy - hhh)}V${f1(hy)}Z" fill="#0b0624"/>
      <g class="holeEyes" opacity="0"><circle cx="${f1(hx - 4.5)}" cy="${f1(hy - 13)}" r="2.6" fill="#fff"/><circle cx="${f1(hx + 4.5)}" cy="${f1(hy - 13)}" r="2.6" fill="#fff"/><circle cx="${f1(hx - 3.9)}" cy="${f1(hy - 12.6)}" r="1.3" fill="${OL}"/><circle cx="${f1(hx + 5.1)}" cy="${f1(hy - 12.6)}" r="1.3" fill="${OL}"/></g>
    </g>

    <g stroke-linejoin="round">
      <rect x="${f1(rug.x)}" y="${f1(rug.y)}" width="${f1(rug.w)}" height="${f1(rug.h)}" rx="${f1(14 * sf)}" fill="#8c2447" stroke="${OL}" stroke-width="2.6"/>
      <rect x="${f1(rug.x + 7 * sf)}" y="${f1(rug.y + 7 * sf)}" width="${f1(rug.w - 14 * sf)}" height="${f1(rug.h - 14 * sf)}" rx="${f1(10 * sf)}" fill="#c4577f"/>
      <rect x="${f1(rug.x + 18 * sf)}" y="${f1(rug.y + 18 * sf)}" width="${f1(rug.w - 36 * sf)}" height="${f1(rug.h - 36 * sf)}" rx="${f1(8 * sf)}" fill="#8c2447"/>
      <rect x="${f1(rug.x + 30 * sf)}" y="${f1(rug.y + 30 * sf)}" width="${f1(rug.w - 60 * sf)}" height="${f1(rug.h - 60 * sf)}" rx="${f1(6 * sf)}" fill="#ffc4d6"/>
    </g>
    <!-- the walls around the room are the borders -->
    <rect x="0" y="${f1(ft)}" width="${f1(fl)}" height="${f1(H - ft)}" fill="#2b2260"/><rect x="${f1(fr)}" y="${f1(ft)}" width="${f1(W - fr)}" height="${f1(H - ft)}" fill="#2b2260"/><rect x="0" y="${f1(fb)}" width="${W}" height="${f1(H - fb)}" fill="#2b2260"/>
    <path d="M${f1(fl)} ${f1(ft)}V${f1(fb)}H${f1(fr)}V${f1(ft)}" fill="none" stroke="#6c63b6" stroke-width="${f1(4 * sf)}"/>
    <path d="M${f1(fl - 1)} ${f1(ft)}V${f1(fb + 1)}H${f1(fr + 1)}V${f1(ft)}" fill="none" stroke="${OL}" stroke-width="2.6"/>
    <g stroke-linejoin="round">
      <!-- sofa -->
      <rect x="${f1(sofa.x + 3)}" y="${f1(sofa.y + sofa.h - 2)}" width="${f1(sofa.w)}" height="6" fill="rgba(5,2,15,.35)"/>
      <rect x="${f1(sofa.x)}" y="${f1(sofa.y)}" width="${f1(sofa.w)}" height="${f1(sofa.h)}" rx="7" fill="#6c63b6" stroke="${OL}" stroke-width="2.6"/>
      <rect x="${f1(sofa.x + 8)}" y="${f1(sofa.y)}" width="${f1(sofa.w - 16)}" height="${f1(sofa.h * .4)}" rx="5" fill="#8981cd" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(sofa.x + 14)}" y="${f1(sofa.y + sofa.h * .46)}" width="${f1(sofa.w / 2 - 17)}" height="${f1(sofa.h * .46)}" rx="5" fill="#aaa4e0" stroke="${OL}" stroke-width="2"/><rect x="${f1(sofa.x + sofa.w / 2 + 3)}" y="${f1(sofa.y + sofa.h * .46)}" width="${f1(sofa.w / 2 - 17)}" height="${f1(sofa.h * .46)}" rx="5" fill="#aaa4e0" stroke="${OL}" stroke-width="2"/>
      <rect x="${f1(sofa.x)}" y="${f1(sofa.y + sofa.h * .12)}" width="14" height="${f1(sofa.h * .82)}" rx="6" fill="#5638a6" stroke="${OL}" stroke-width="2.2"/><rect x="${f1(sofa.x + sofa.w - 14)}" y="${f1(sofa.y + sofa.h * .12)}" width="14" height="${f1(sofa.h * .82)}" rx="6" fill="#5638a6" stroke="${OL}" stroke-width="2.2"/>
      <rect x="${f1(sofa.x + sofa.w * .18)}" y="${f1(sofa.y + sofa.h * .5)}" width="15" height="15" rx="4" fill="#ff9db9" stroke="${OL}" stroke-width="2" transform="rotate(-10 ${f1(sofa.x + sofa.w * .18 + 7)} ${f1(sofa.y + sofa.h * .5 + 7)})"/>
      <!-- coffee table with a bit of cheese on it -->
      <rect x="${f1(table.x + 4)}" y="${f1(table.y + 6)}" width="${f1(table.w)}" height="${f1(table.h)}" rx="6" fill="rgba(5,2,15,.35)"/>
      <rect x="${f1(table.x)}" y="${f1(table.y)}" width="${f1(table.w)}" height="${f1(table.h)}" rx="6" fill="#d9965a" stroke="${OL}" stroke-width="2.6"/>
      <rect x="${f1(table.x + 5)}" y="${f1(table.y + 5)}" width="${f1(table.w - 10)}" height="${f1(table.h - 10)}" rx="4" fill="#e8c08a"/>
      <path d="M${f1(table.x + table.w * .6)} ${f1(table.y + table.h * .72)}h20l-3 -12h-15z" fill="#f4d35e" stroke="${OL}" stroke-width="2"/><circle cx="${f1(table.x + table.w * .6 + 8)}" cy="${f1(table.y + table.h * .72 - 5)}" r="2" fill="#c46a38"/>
      <!-- the tabby's closed room (seen from above): thick walls, a locked door and a gold mouse hole in the bottom wall -->
      <rect x="${f1(room.x + 4)}" y="${f1(room.y)}" width="${f1(room.w)}" height="${f1(room.h + 5)}" rx="4" fill="rgba(5,2,15,.35)"/>
      <rect x="${f1(room.x)}" y="${f1(room.y)}" width="${f1(room.w + 3)}" height="${f1(room.h)}" rx="4" fill="#2b2260" stroke="${OL}" stroke-width="2.8"/>
      <rect x="${f1(ix)}" y="${f1(ft)}" width="${f1(iw)}" height="${f1(ih)}" fill="#d9965a"/>
      <path d="M${f1(ix + 18 * sf)} ${f1(ft)}V${f1(ft + ih)}M${f1(ix + 54 * sf)} ${f1(ft)}V${f1(ft + ih)}M${f1(ix + 90 * sf)} ${f1(ft)}V${f1(ft + ih)}" stroke="rgba(30,12,8,.35)" stroke-width="2" fill="none"/>
      <path d="M${f1(ix)} ${f1(ft + ih)}H${f1(fr)}" stroke="${OL}" stroke-width="2.4"/>
      <ellipse cx="${f1(tcx)}" cy="${f1(tcy + 6 * sf)}" rx="${f1(iw * .42)}" ry="${f1(iw * .2)}" fill="#c4577f" stroke="${OL}" stroke-width="2.6"/><ellipse cx="${f1(tcx)}" cy="${f1(tcy + 3 * sf)}" rx="${f1(iw * .36)}" ry="${f1(iw * .15)}" fill="#ee86ab"/>
      <rect x="${f1(room.x + 3)}" y="${f1(room.y + 3)}" width="${f1(tw - 6)}" height="${f1(room.h - 6)}" fill="#6c63b6"/>
      <rect x="${f1(room.x + 3)}" y="${f1(rb - tw + 3)}" width="${f1(room.w - 6)}" height="${f1(tw - 8)}" fill="#6c63b6"/>
      <g class="tabbyRoom">
        <ellipse cx="${f1(tcx)}" cy="${f1(tcy)}" rx="${f1(iw * .3)}" ry="${f1(iw * .09)}" fill="rgba(5,2,15,.4)"/>
        <g class="tabby" transform="translate(${f1(tcx)} ${f1(tcy - 2 * sf)}) scale(${f2(iw / 175)})" stroke-linejoin="round" stroke-linecap="round">${tabbyMarkup()}</g>
        <g class="tHeart" transform="translate(${f1(tcx + iw * .2)} ${f1(tcy - iw * .95)}) scale(${f2(iw / 175 * 1.05)})" opacity="0">
          <circle cx="-26" cy="40" r="3.4" fill="#fff" stroke="${OL}" stroke-width="2"/><circle cx="-16" cy="30" r="5.4" fill="#fff" stroke="${OL}" stroke-width="2"/>
          <ellipse cx="6" cy="0" rx="32" ry="26" fill="#fff" stroke="${OL}" stroke-width="3"/>
          <path d="M6 12 q-17 -12 -15 -22 q1 -8 8 -8 q6 0 7 6 q1 -6 7 -6 q7 0 8 8 q2 10 -15 22z" fill="#ff7fa3" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
        </g>
      </g>
      <!-- the locked door -->
      <rect x="${f1(dX - dW / 2)}" y="${f1(rb - tw - 2)}" width="${f1(dW)}" height="${f1(tw + 5)}" rx="2" fill="#6b3a22" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${f1(dX - dW / 2 + 4)}" y="${f1(rb - tw + 1)}" width="${f1(dW - 8)}" height="${f1(tw - 3)}" fill="#a8643a"/>
      <circle cx="${f1(dX + dW * .3)}" cy="${f1(rb - tw / 2 + 1)}" r="${f1(2.2 * sf)}" fill="#f4d35e" stroke="${OL}" stroke-width="1.4"/>
      <!-- the gold mouse hole: the way in -->
      <ellipse class="exitRing" cx="${f1(eX)}" cy="${f1(rb - tw / 2)}" rx="${f1(19 * sf)}" ry="${f1(13 * sf)}" fill="#f4d35e" stroke="${OL}" stroke-width="2.6"/>
      <ellipse cx="${f1(eX)}" cy="${f1(rb - tw / 2 + 1)}" rx="${f1(14 * sf)}" ry="${f1(9 * sf)}" fill="#0b0624"/>
      <g class="exitCue"></g>
      <!-- bookshelf and armchair -->
      ${(() => { const sh = R_(OBST[4].x0, OBST[4].z0, OBST[4].x1, OBST[4].z1), ch = R_(OBST[5].x0, OBST[5].z0, OBST[5].x1, OBST[5].z1); let b = '';
        b += `<rect x="${f1(sh.x + 3)}" y="${f1(sh.y + 4)}" width="${f1(sh.w)}" height="${f1(sh.h)}" rx="3" fill="rgba(5,2,15,.35)"/><rect x="${f1(sh.x)}" y="${f1(sh.y)}" width="${f1(sh.w)}" height="${f1(sh.h)}" rx="3" fill="#6b3a22" stroke="${OL}" stroke-width="2.4"/>`;
        for (let k = 1; k < 6; k++) b += `<rect x="${f1(sh.x + 3)}" y="${f1(sh.y + sh.h * k / 6 - 4)}" width="${f1(sh.w - 6)}" height="7" fill="${['#e5475c', '#f4d35e', '#8981cd', '#4f9a6a', '#ff9db9'][k - 1]}"/>`;
        b += `<rect x="${f1(ch.x + 3)}" y="${f1(ch.y + 4)}" width="${f1(ch.w)}" height="${f1(ch.h)}" rx="8" fill="rgba(5,2,15,.35)"/><rect x="${f1(ch.x)}" y="${f1(ch.y)}" width="${f1(ch.w)}" height="${f1(ch.h)}" rx="8" fill="#5638a6" stroke="${OL}" stroke-width="2.4"/><rect x="${f1(ch.x + 5)}" y="${f1(ch.y + 5)}" width="${f1(ch.w - 10)}" height="${f1(ch.h - 10)}" rx="5" fill="#8981cd"/>`;
        return b; })()}
      <!-- plant (from above) -->
      <ellipse cx="${f1(pc.x + 3)}" cy="${f1(pc.y + 5)}" rx="${f1(plant.w * .56)}" ry="${f1(plant.w * .5)}" fill="rgba(5,2,15,.35)"/>
      <circle cx="${f1(pc.x)}" cy="${f1(pc.y)}" r="${f1(plant.w * .52)}" fill="#c46a38" stroke="${OL}" stroke-width="2.4"/>
      <circle cx="${f1(pc.x)}" cy="${f1(pc.y)}" r="${f1(plant.w * .38)}" fill="#2f5d4a"/>
      <ellipse cx="${f1(pc.x - 9)}" cy="${f1(pc.y - 2)}" rx="9" ry="5" fill="#4f9a6a" stroke="${OL}" stroke-width="1.8" transform="rotate(-30 ${f1(pc.x - 9)} ${f1(pc.y - 2)})"/>
      <ellipse cx="${f1(pc.x + 9)}" cy="${f1(pc.y - 2)}" rx="9" ry="5" fill="#4f9a6a" stroke="${OL}" stroke-width="1.8" transform="rotate(30 ${f1(pc.x + 9)} ${f1(pc.y - 2)})"/>
      <ellipse cx="${f1(pc.x)}" cy="${f1(pc.y + 7)}" rx="6" ry="9" fill="#4f9a6a" stroke="${OL}" stroke-width="1.8"/>
    </g>
    <g class="shadows"></g><g class="actors"></g><g class="fx"></g>
    </g>`;
  }

  /* ---------- state ---------- */
  const M = { X: 0, Z: 0, x: 0, y: 0, face: 1, phase: 0, sp: 0, walkAmt: 0, sq: 1, hop: 0, stand: 0, look: 0, ear: 0, s: 1, vis: 0, hidden: -1 };
  const target = { X: 0, Z: 0, spot: -1 };
  const mkDog = (pal, X, Z, pitch) => ({ pal, X, Z, x: 0, y: 0, dir: 1, st: 'patrol', t: 0, tX: X, tZ: Z, pause: 0, v: 0, phase: Math.random() * 6, cool: 0, mouth: 0, bang: -9, woof: -9, q: -9, barked: 0, pitch, ear: 0, spot: -1, ang: 0, scan: 0, stuck: 0, mvX: 0, mvZ: 0 });
  const dogs = [mkDog(DOG_A, .6, .86, 1), mkDog(DOG_B, -.4, .88, .9)];
  let st = 'intro1', stT = 0, t = 0, reported = false, hintOn = false, ev = {}, drops = [], lastStep = 0, houseT = 0, pressed = false, wantOut = false;
  const setState = n => { st = n; stT = 0; ev = {}; };
  const HOLE_FRONT = () => ({ X: HOLES[0].X, Z: S0 + .05 }), HOME = () => ({ X: -.68, Z: S0 + .13 });
  extra();
  function extra() {
    snd.hop = () => { tone('sine', 420, 700, .07, .07); };
    snd.sniff = () => { noise(.12, .05, 'bandpass', 900, 1); noise(.1, .05, 'bandpass', 900, 1, .17); };
  }

  /* ---------- rain on the window glass (so you can tell we are indoors now) ---------- */
  const winDrops = [];
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
  let rainNodes = null;
  function indoorRain() {
    if (!ok() || rainNodes) return; const ac = AU.ac;
    const src = ac.createBufferSource(); src.buffer = AU.nbuf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = .6;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.linearRampToValueAtTime(.045, ac.currentTime + 1.5);
    src.connect(lp).connect(g).connect(out.get()); src.start(); rainNodes = src;
  }

  /* ---------- scene elements ---------- */
  let el = {}, acts = [];
  function grab() {
    const q = s => rm.querySelector(s);
    el = { actors: q('.actors'), shadows: q('.shadows'), fx: q('.fx'), winRain: q('.winRain'), cam: q('.cam'), exitCue: q('.exitCue'), exitRing: q('.exitRing'), holeEyes: [...rm.querySelectorAll('.holeEyes')] };
    el.actors.innerHTML = `<g class="actor mouseA">${mouseMarkup}</g><g class="actor dogA0">${dogMarkup(DOG_A)}</g><g class="actor dogA1">${dogMarkup(DOG_B)}</g>` + BOXES.map((b, i) => `<g class="actor boxA${i}">${boxMarkup()}</g>`).join('');
    el.shadows.innerHTML = '<polygon class="cone0" points="0,0" fill="rgba(255,233,140,.2)"/><polygon class="cone1" points="0,0" fill="rgba(255,233,140,.2)"/><ellipse class="shM" rx="1" ry="1" fill="rgba(5,2,15,.5)"/><ellipse class="shD0" rx="1" ry="1" fill="rgba(5,2,15,.5)"/><ellipse class="shD1" rx="1" ry="1" fill="rgba(5,2,15,.5)"/>';
    const qm = `<text class="qm" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="800" font-size="30" fill="#ffe9a8" stroke="${OL}" stroke-width="3.4" paint-order="stroke" opacity="0">?</text>`;
    el.fx.innerHTML = `<g class="bangW0">${bangMarkup}</g><g class="bangW1">${bangMarkup}</g><g class="woofW0">${woofMarkup}</g><g class="woofW1">${woofMarkup}</g><g class="qW0">${qm}</g><g class="qW1">${qm}</g><g class="drops"></g>`;
    const A = el.actors;
    el.mouse = A.querySelector('.mouseA');
    const m = el.mouse.querySelector.bind(el.mouse);
    el.m = { root: m('.mRoot'), squash: m('.mSquash'), body: m('.mBody'), head: m('.mHead'), ear: m('.mEar'), tail: m('.mTail'), bn: m('.mLegBN'), bf: m('.mLegBF'), fn: m('.mLegFN'), ff: m('.mLegFF'), letter: m('.mLetter') };
    dogs.forEach((d, i) => {
      const g = A.querySelector('.dogA' + i);
      d.el = { g, root: g.querySelector('.dRoot'), head: g.querySelector('.dHead'), ear: g.querySelector('.dEar'), tail: g.querySelector('.dTail'), bn: g.querySelector('.dLegBN'), bf: g.querySelector('.dLegBF'), fn: g.querySelector('.dLegFN'), ff: g.querySelector('.dLegFF'),
        mo: g.querySelector('.dMouthOpen'), ms: g.querySelector('.dMouthShut'), bang: el.fx.querySelector('.bangW' + i + ' .bang'), bangW: el.fx.querySelector('.bangW' + i), woof: el.fx.querySelector('.woofW' + i + ' .woof'), qW: el.fx.querySelector('.qW' + i), qm: el.fx.querySelector('.qW' + i + ' .qm'), sh: el.shadows.querySelector('.shD' + i), cone: el.shadows.querySelector('.cone' + i) };
    });
    el.boxes = BOXES.map((b, i) => { const g = A.querySelector('.boxA' + i); return { g, peek: g.querySelector('.peek') }; });
    el.shM = el.shadows.querySelector('.shM'); el.drops = el.fx.querySelector('.drops');
    el.cut = { tabby: q('.tabby'), tail: q('.tabby .cTail'), body: q('.tabby .cBody'), head: q('.tabby .cHead'), eyes: [...rm.querySelectorAll('.tabby .cEyeScale')], pupils: [...rm.querySelectorAll('.tabby .cPupil')], heart: q('.tHeart') };
  }
  function place(o) { const p = proj(o.X, o.Z); o.x = p.x; o.y = p.y; }

  function layout() {
    const r = root.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height); sf = W / 390;
    rm.setAttribute('viewBox', `0 0 ${W} ${H}`);
    bw = 28 * sf; ft = Math.round(H * .19); fb = H - bw; fl = bw; fr = W - bw; hw = (fr - fl) / 2; fh = fb - ft;
    rm.innerHTML = roomMarkup();
    spots = [
      ...HOLES.map(h => { const c = proj(h.X, S0); return { type: 'hole', X: h.X, Z: S0 + .05, cx: c.x, cy: c.y - 6 * sf, r: 38 * sf }; }),
      ...BOXES.map(b => { const p = proj(b.X, b.Z), sc = zScale() * sf * .78; return { type: 'box', X: b.X, Z: b.Z, cx: p.x, cy: p.y - 22 * sc, r: 40 * sf }; })
    ];
    grab();
    seedRain(winDrops, WIN, Math.round(12 + WIN.w / 9));
    for (const o of [M, ...dogs]) place(o);
    if (!M.init) { M.init = true; M.X = HOLES[0].X; M.Z = S0 + .01; place(M); target.X = HOME().X; target.Z = HOME().Z; dogs.forEach(pickWaypoint); }
    dogs.forEach(d => { d.sx = d.x; d.sy = d.y; });
  }

  /* ---------- ground rules ---------- */
  const gd = (a, b) => Math.hypot((a.X - b.X) * hw, (a.Z - b.Z) * fh / (1 - S0));
  function clampG(o) { o.X = clamp(o.X, -.9, .9); o.Z = clamp(o.Z, S0 + .04, .97); }
  // move toward (tX,tZ) at `speed` px/s, sliding along furniture and walls; returns the distance left
  function stepG(o, tX, tZ, speed, dt) {
    const d = gd(o, { X: tX, Z: tZ });
    if (d < 1) { o.v = 0; return 0; }
    const step = Math.min(d, speed * dt), k = step / d, x0 = o.X, z0 = o.Z;
    const nX = o.X + (tX - o.X) * k, nZ = o.Z + (tZ - o.Z) * k;
    if (!blockedAt(nX, nZ)) { o.X = nX; o.Z = nZ; }
    else if (!blockedAt(nX, o.Z)) o.X = nX;
    else if (!blockedAt(o.X, nZ)) o.Z = nZ;
    clampG(o);
    const moved = gd({ X: x0, Z: z0 }, o); o.v = moved / Math.max(dt, 1e-4); o.mvX = o.X - x0; o.mvZ = o.Z - z0;
    return d - moved;
  }
  function pickWaypoint(d) {
    for (let tries = 0; tries < 14; tries++) {
      const r = Math.random();
      if (r < .3 && spots.length) { const s = spots[(Math.random() * spots.length) | 0]; d.tX = s.X + (Math.random() - .5) * .2; d.tZ = s.Z + .07 + Math.random() * .05; }
      else if (r < .5 && st === 'play') { d.tX = M.X + (Math.random() - .5) * .5; d.tZ = M.Z + (Math.random() - .5) * .3; }
      else { d.tX = -.9 + Math.random() * 1.8; d.tZ = S0 + .06 + Math.random() * (.96 - S0 - .06); }
      d.tX = clamp(d.tX, -.9, .9); d.tZ = clamp(d.tZ, S0 + .05, .97);
      if (!blockedAt(d.tX, d.tZ, .04, .03)) break;
    }
    d.stuck = 0;
  }

  /* ---------- input: finger / mouse anywhere moves the mouse there; tap a hole or box to hide in it ---------- */
  function setTarget(e) {
    const r = root.getBoundingClientRect(), px_ = e.clientX - r.left, py_ = e.clientY - r.top;
    let best = -1, bd = 1e9;
    spots.forEach((s, i) => { const d = Math.hypot(px_ - s.cx, py_ - s.cy); if (d < s.r && d < bd) { bd = d; best = i; } });
    if (best >= 0) { target.spot = best; target.X = spots[best].X; target.Z = spots[best].Z; return; }
    target.spot = -1;
    const g = unproj(px_, py_ - 12 * sf);
    target.X = g.X; target.Z = g.Z; clampG(target);
  }
  const onDown = e => {
    Seq.audioInit();
    if (st === 'cut' && stT > .9) { setState('back'); return; }
    if (st !== 'play' && st !== 'hidden') return;
    pressed = true; try { root.setPointerCapture(e.pointerId); } catch (_) {}
    setTarget(e); if (st === 'hidden' && target.spot !== M.hidden) wantOut = true; e.preventDefault();
  };
  const onMove = e => { if (pressed && (st === 'play' || st === 'hidden')) { setTarget(e); if (st === 'hidden' && target.spot !== M.hidden) wantOut = true; e.preventDefault(); } };
  const onUp = () => { pressed = false; };
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp);

  /* ---------- tuning ---------- */
  const MOUSE_V = () => W * .5, DOG_V = () => W * .2, CHASE_V = () => W * .3;
  const SIGHT = () => W * .42, CATCH = () => 17 * sf, CONE = 38 * Math.PI / 180;
  const exitHit = () => Math.abs(M.X - EXIT.X) < .08 && M.Z < ROOMZ + .045 && M.Z > ROOMZ;
  // can dog d see the mouse? it has to be inside the cone it is facing, in range, with no furniture in between
  function sees(d, k = 1) {
    const dx = M.x - d.x, dy = M.y - d.y, dist = Math.hypot(dx, dy);
    if (dist > SIGHT() * k) return false;
    if (dist < 15 * sf) return true;
    let da = Math.atan2(dy, dx) - d.ang - d.scan; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    return Math.abs(da) < CONE && losFree(d, M);
  }

  function doFlash() { flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 110); }
  
  /* ---------- update ---------- */
  function spawnDrops(n) { for (let i = 0; i < n; i++) drops.push({ x: M.x + (Math.random() - .5) * 30 * sf, y: M.y - 22 * sf * zScale(M.Z), vx: (Math.random() - .5) * 150, vy: -60 - Math.random() * 80, a: 0 }); }
  function alertDog(d) { d.st = 'alert'; d.t = 0; d.bang = t; d.barked = 0; d.dir = M.x > d.x ? 1 : -1; d.ang = Math.atan2(M.y - d.y, M.x - d.x); d.v = 0; snd.alarm(); }
  const turnTo = (d, a, k) => { let da = a - d.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; d.ang += da * k; };
  function updateDogs(dt) {
    const hid = M.hidden >= 0, seen = (st === 'play' || st === 'hide' || st === 'unhide') && M.vis > .5 && !hid;
    for (const d of dogs) {
      d.t += dt; d.cool = Math.max(0, d.cool - dt);
      d.scan = (d.st === 'patrol' || d.st === 'cool' || d.st === 'sniff') ? Math.sin(t * 1.9 + d.phase) * .55 : 0;
      if (d.st === 'patrol' || d.st === 'cool') {
        if (d.pause > 0) { d.pause -= dt; d.v = 0; }
        else {
          const left = stepG(d, d.tX, d.tZ, DOG_V(), dt);
          if (Math.abs(d.mvX) > 1e-4) d.dir = d.mvX > 0 ? 1 : -1;
          if (d.v > 4) turnTo(d, Math.atan2(d.mvZ * fh / (1 - S0), d.mvX * hw), Math.min(1, dt * 9));
          d.stuck = d.v < DOG_V() * .2 ? d.stuck + dt : 0;
          if (left < 6 || d.stuck > .3) { d.pause = left < 6 && Math.random() < .4 ? .2 + Math.random() * .5 : 0; pickWaypoint(d); }
        }
        if (d.st === 'cool' && d.cool <= 0) d.st = 'patrol';
        if (seen && d.st === 'patrol' && d.cool <= 0 && sees(d)) alertDog(d);
      } else if (d.st === 'alert') {
        d.v = 0; d.dir = M.x > d.x ? 1 : -1; turnTo(d, Math.atan2(M.y - d.y, M.x - d.x), Math.min(1, dt * 10));
        d.mouth = Math.sin(d.t * 5.2 * Math.PI) > .1 ? 1 : 0;
        if (d.barked < 2 && d.t > d.barked * .38 + .05) { d.barked++; d.woof = t; snd.bark(d.pitch); M.sq = Math.min(M.sq, .86); }
        if (d.t > .85) { d.st = 'chase'; d.t = 0; d.mouth = 0; }
      } else if (d.st === 'chase') {
        const tg = hid ? spots[M.hidden] : M;
        stepG(d, tg.X, tg.Z, CHASE_V(), dt);
        if (Math.abs(tg.X - d.X) > .01) d.dir = tg.X > d.X ? 1 : -1;
        turnTo(d, Math.atan2((tg.Z - d.Z) * fh / (1 - S0), (tg.X - d.X) * hw), Math.min(1, dt * 10));
        d.mouth = d.t % .24 < .12 ? 1 : 0;
        if (hid) { if (gd(d, tg) < 26 * sf) { d.st = 'sniff'; d.t = 0; d.q = t; d.mouth = 0; d.spot = M.hidden; snd.sniff(); } }
        else if (st === 'play' && M.vis > .5 && gd(d, M) < CATCH()) caught(d);
        if (d.st === 'chase' && d.t > 1.5) { d.st = 'cool'; d.cool = 2; d.mouth = 0; pickWaypoint(d); }
      } else if (d.st === 'sniff') {
        d.v = 0;
        if (d.t > 1.15 && d.t < 1.25 && !d.s2) { d.s2 = 1; snd.sniff(); }
        if (seen && sees(d, .7)) { d.s2 = 0; alertDog(d); }
        else if (d.t > 2.2) { d.s2 = 0; d.st = 'cool'; d.cool = 3; pickWaypoint(d); }
      }
      if (d.st !== 'alert' && d.st !== 'chase') d.mouth = 0;
      d.phase += dt * (d.v / Math.max(1, W * .5)) * 6 * (d.st === 'chase' ? 1.1 : 1);
      clampG(d); place(d);
    }
  }
  function caught(d) {
    if (st !== 'play') return;
    setState('home'); pressed = false; M.hidden = -1; snd.squeak(); Seq.vib([20, 40, 20]);
    for (const o of dogs) { o.st = 'cool'; o.cool = 2.8; o.mouth = 0; pickWaypoint(o); }
    M.sq = .8;
  }
  function moveMouse(dt, tg, vmax) {
    const d = gd(M, tg), want = d > 2 ? Math.min(vmax, d * 16) : 0;
    M.sp = lerp(M.sp, want, Math.min(1, dt * 20));
    if (d > 1) {
      const step = Math.min(d, M.sp * dt), k = step / d;
      if (Math.abs(tg.X - M.X) * hw > 5) M.face = tg.X > M.X ? 1 : -1;
      const nX = M.X + (tg.X - M.X) * k, nZ = M.Z + (tg.Z - M.Z) * k;
      if (!blockedAt(nX, nZ) || st !== 'play') { M.X = nX; M.Z = nZ; } else if (!blockedAt(nX, M.Z)) M.X = nX; else if (!blockedAt(M.X, nZ)) M.Z = nZ;
    }
    return d;
  }
  const emergeAt = (u, from, to) => { const e = easeInOut(u); M.X = lerp(from.X, to.X, e); M.Z = lerp(from.Z, to.Z, e); M.s = lerp(.55, 1, e); M.hop = Math.sin(Math.PI * u) * 10 * sf; M.face = to.X >= from.X ? 1 : -1; M.sp = 60; M.walkAmt = 1; };

  function update(dt) {
    t += dt; stT += dt; houseT += dt;
    updateDogs(dt);
    let standT = 0, lookT = 0, earT = 0, sqT = 1;
    if (st === 'intro1') {
      M.vis = stT > .3 ? 1 : 0;
      if (stT < 1.15) {
        const u = clamp((stT - .3) / .85, 0, 1); emergeAt(u, { X: HOLES[0].X, Z: S0 + .01 }, HOME()); M.phase += dt * 10;
        if (!ev.sq) { ev.sq = 1; snd.squeak(); }
      } else {
        M.sp = 0; M.walkAmt = 0; M.hop = 0; M.s = 1; M.face = 1;
        if (stT < 1.5) {
          const u = (stT - 1.15) / .35; sqT = 1 + Math.sin(u * 40) * .09; M.X += Math.sin(u * 44) * .0008;
          if (!ev.sh) { ev.sh = 1; snd.shake(); spawnDrops(8); } if (stT > 1.3 && !ev.sh2) { ev.sh2 = 1; spawnDrops(6); }
        } else { standT = .3; lookT = -18; earT = 1; }
      }
      if (stT > 1.75) { setState('cut'); snd.pop(); }
    } else if (st === 'cut') {
      M.vis = 1; M.sp = 0; M.walkAmt = 0;
      if (stT > .55 && !ev.h) { ev.h = 1; snd.chime(); }
      if (stT > .8 && !ev.m) { ev.m = 1; snd.mew(); }
      if (stT > 1.7) { setState('back'); }
      if (!ev.far) { ev.far = 1; dogs[0].X = .6; dogs[0].Z = .9; dogs[1].X = -.05; dogs[1].Z = .88; dogs.forEach(d => { d.tX = d.X; d.tZ = d.Z; d.pause = 0; pickWaypoint(d); }); }
    } else if (st === 'back') {
      M.vis = 1; if (stT > .45) { setState('play'); dogs.forEach(d => { d.cool = Math.max(d.cool, 2.5); }); hintOn = true; houseT = 0; target.X = M.X; target.Z = M.Z; target.spot = -1; hint.classList.add('on'); }
    } else if (st === 'play') {
      M.vis = 1;
      if (hintOn && (houseT > 6 || (pressed && houseT > 2))) { hintOn = false; hint.classList.remove('on'); }
      const tg = { X: target.X, Z: target.Z }; const d = moveMouse(dt, tg, MOUSE_V()); clampG(M);
      if (target.spot >= 0 && d < 7 * sf) { const sp = spots[target.spot]; setState('hide'); ev = { i: target.spot, X0: M.X, Z0: M.Z, box: sp.type === 'box' }; snd.hop(); }
      else if (exitHit()) { setState('enter'); pressed = false; ev = { X0: M.X, Z0: M.Z }; snd.slip(); Seq.vib([10, 30, 10]); for (const o of dogs) { o.st = 'cool'; o.cool = 5; o.mouth = 0; } }
    } else if (st === 'hide') {
      const sp = spots[ev.i], u = clamp(stT / .42, 0, 1), e = easeInOut(u); M.sp = 0; M.walkAmt = 0;
      if (ev.box) { M.X = lerp(ev.X0, sp.X, e); M.Z = lerp(ev.Z0, sp.Z, e); M.hop = Math.sin(Math.PI * u) * 22 * sf; M.s = lerp(1, .72, e); sqT = 1 - .18 * Math.sin(Math.PI * u); }
      else { M.X = sp.X; M.Z = lerp(ev.Z0, S0 + .012, e); M.s = lerp(1, .5, e); M.vis = 1 - clamp((u - .45) / .55, 0, 1); M.face = 1; }
      if (u >= 1) { M.hidden = ev.i; M.vis = 0; setState('hidden'); target.spot = ev.i; wantOut = false; }
    } else if (st === 'hidden') {
      M.vis = 0; M.sp = 0; M.walkAmt = 0;
      if (wantOut && (pressed || target.spot !== M.hidden)) { const sp = spots[M.hidden]; setState('unhide'); ev = { i: M.hidden, box: sp.type === 'box' }; M.hidden = -1; M.vis = 1; snd.hop(); }
    } else if (st === 'unhide') {
      const sp = spots[ev.i], u = clamp(stT / .38, 0, 1), e = easeInOut(u); M.sp = 0;
      if (ev.box) { M.X = sp.X; M.Z = sp.Z; M.hop = Math.sin(Math.PI * u) * 22 * sf; M.s = lerp(.72, 1, e); sqT = 1 - .14 * Math.sin(Math.PI * u); M.X += (clamp(target.X, sp.X - .25, sp.X + .25) - sp.X) * e * .6; }
      else { M.X = sp.X; M.Z = lerp(S0 + .012, S0 + .07, e); M.s = lerp(.5, 1, e); M.vis = clamp(u * 2, 0, 1); M.sp = 50; M.walkAmt = 1; M.phase += dt * 9; M.face = 1; }
      if (u >= 1) { M.hop = 0; M.s = 1; setState('play'); }
    } else if (st === 'home') {
      M.vis = 1; const hf = HOLE_FRONT(); const d = moveMouse(dt, hf, W * 1.2);
      if (d < 5 * sf) { setState('holeIn'); M.sp = 0; M.walkAmt = 0; M.face = 1; }
    } else if (st === 'holeIn') {
      const u = clamp(stT / .45, 0, 1), e = easeInOut(u); M.X = HOLES[0].X; M.Z = lerp(S0 + .05, S0 + .012, e); M.s = lerp(1, .5, e); M.vis = 1 - clamp((u - .45) / .55, 0, 1); M.sp = 40; M.walkAmt = 1; M.phase += dt * 9;
      if (u >= 1) { M.vis = 0; setState('holeWait'); }
    } else if (st === 'holeWait') {
      M.vis = 0; if (stT > .6) { setState('reemerge'); snd.squeak(); }
    } else if (st === 'reemerge') {
      const u = clamp(stT / .85, 0, 1); M.vis = 1; emergeAt(u, { X: HOLES[0].X, Z: S0 + .01 }, HOME());
      if (u >= 1) { M.hop = 0; M.s = 1; M.sp = 0; M.walkAmt = 0; target.X = M.X; target.Z = M.Z; target.spot = -1; setState('play'); snd.pop(); }
    } else if (st === 'enter') {
      const u = clamp(stT / .9, 0, 1), e = easeInOut(u);
      M.X = lerp(ev.X0, EXIT.X, e); M.Z = lerp(ev.Z0, ROOMZ - .012, e); M.sp = 70; M.walkAmt = 1; M.phase += dt * 9; M.face = M.X >= ev.X0 ? 1 : -1;
      M.s = lerp(1, .55, e); sqT = lerp(1, .22, easeInOut(clamp((u - .4) / .6, 0, 1))); M.vis = 1 - clamp((u - .8) / .2, 0, 1);
      if (u >= 1 && !reported) { reported = true; M.vis = 0; const p = proj(EXIT.X, ROOMZ); done({ x: p.x, y: p.y - 6 * sf }); }
    }
    if (st !== 'enter' && st !== 'hide' && st !== 'unhide' && st !== 'home' && st !== 'holeIn' && st !== 'reemerge' && st !== 'intro1') M.walkAmt = clamp(M.sp / (W * .22), 0, 1);
    else if (st === 'home') M.walkAmt = 1;
    if (M.sp > 6) { M.phase += dt * M.sp / Math.max(1, W * .5) * 13; const si = Math.floor(M.phase / Math.PI); if (si !== lastStep) { lastStep = si; snd.patter(); } }
    place(M);
    M.stand = lerp(M.stand, standT, Math.min(1, dt * 7)); M.look = lerp(M.look, lookT, Math.min(1, dt * 8)); M.ear = lerp(M.ear, earT, Math.min(1, dt * 10));
    M.sq = lerp(M.sq, sqT, Math.min(1, dt * 14));
    stepRain(winDrops, WIN, dt, sf);
    for (let i = drops.length - 1; i >= 0; i--) { const p = drops[i]; p.a += dt; p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.a > .7) drops.splice(i, 1); }
  }

  /* ---------- render ---------- */
  function renderMouse() {
    const sc = zScale(M.Z) * sf * .8 * M.s, th = M.stand * 55, ph = M.phase, sw = Math.sin(ph) * 30 * M.walkAmt;
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
  // the dog's field of view: a cone cut short by furniture and walls
  function coneMarkup(d) {
    const ox = d.x, oy = d.y - 5 * sf, R = SIGHT(); let p = `${f1(ox)},${f1(oy)}`;
    for (let k = -4; k <= 4; k++) {
      const a = d.ang + d.scan + CONE * k / 4, cx = Math.cos(a), cy = Math.sin(a); let r = 8 * sf;
      for (; r < R; r += 6 * sf) { const g = unproj(ox + cx * r, oy + cy * r); if (g.X < -.95 || g.X > .95 || g.Z < S0 || g.Z > 1 || blockedAt(g.X, g.Z, 0, 0)) break; }
      p += ` ${f1(ox + cx * r)},${f1(oy + cy * r)}`;
    }
    return p;
  }
  function renderDog(d, i) {
    const cn = d.el.cone, alarmed = d.st === 'alert' || d.st === 'chase';
    cn.setAttribute('points', coneMarkup(d)); cn.setAttribute('fill', alarmed ? 'rgba(229,71,92,.3)' : 'rgba(255,233,140,.2)');
    const sc = zScale(d.Z) * sf * .95, e = d.el, walk = clamp(d.v / (W * .3), 0, 1), sw = Math.sin(d.phase) * 36 * walk, bob = Math.abs(Math.sin(d.phase)) * 3 * walk;
    const barking = d.st === 'alert' || (d.st === 'chase' && d.mouth), sniff = d.st === 'sniff';
    e.root.setAttribute('transform', `translate(${f2(d.x)} ${f2(d.y - bob * sc)}) scale(${f2(d.dir * sc)} ${f2(sc)})`);
    e.bn.setAttribute('transform', `translate(-21 -16) rotate(${f2(sw)})`); e.bf.setAttribute('transform', `translate(-12 -16) rotate(${f2(-sw)})`);
    e.fn.setAttribute('transform', `translate(18 -16) rotate(${f2(-sw)})`); e.ff.setAttribute('transform', `translate(11 -16) rotate(${f2(sw)})`);
    e.tail.setAttribute('transform', `rotate(${f2(Math.sin(t * (barking ? 20 : 11) + i) * (barking ? 22 : 14))} -30 -34)`);
    d.ear = lerp(d.ear, -sw * .5 - walk * 8, .3);
    e.ear.setAttribute('transform', `rotate(${f2(d.ear)} 23 -56)`);
    e.head.setAttribute('transform', `rotate(${sniff ? f2(18 + Math.sin(t * 14) * 4) : barking ? (d.mouth ? -12 : -5) : f2(Math.sin(d.phase * 2) * 2 * walk)} 30 -34)`);
    e.mo.setAttribute('opacity', d.mouth ? 1 : 0); e.ms.setAttribute('opacity', d.mouth ? 0 : 1);
    e.sh.setAttribute('cx', f2(d.x)); e.sh.setAttribute('cy', f2(d.y + 1)); e.sh.setAttribute('rx', f2(40 * sc)); e.sh.setAttribute('ry', f2(7.5 * sc));
    const ba = t - d.bang, hx = d.x + d.dir * 26 * sc, hy = d.y - 86 * sc;
    if (ba >= 0 && ba < 1.5) {
      const pop = easeOutBack(clamp(ba / .22, 0, 1)), fade = 1 - clamp((ba - 1.2) / .3, 0, 1), jig = Math.sin(ba * 40) * (ba < .5 ? 3 : 0);
      e.bang.setAttribute('opacity', f2(fade));
      e.bangW.setAttribute('transform', `translate(${f2(hx + jig)} ${f2(hy)}) scale(${f2(Math.max(.01, pop) * sc * 2.4)})`);
    } else e.bang.setAttribute('opacity', 0);
    const wa = t - d.woof;
    if (wa >= 0 && wa < .55) {
      const pop = easeOutBack(clamp(wa / .12, 0, 1));
      e.woof.setAttribute('opacity', f2(1 - clamp((wa - .38) / .17, 0, 1)));
      e.woof.parentNode.setAttribute('transform', `translate(${f2(d.x + d.dir * 66 * sc)} ${f2(d.y - 36 * sc)}) scale(${f2(d.dir * Math.max(.01, pop) * sc * .9)} ${f2(Math.max(.01, pop) * sc * .9)})`);
    } else e.woof.setAttribute('opacity', 0);
    const qa = t - d.q;                                    // "?" while it sniffs at where the mouse hid
    if (sniff && qa >= 0 && qa < 2.3) {
      e.qm.setAttribute('opacity', f2(1 - clamp((qa - 2) / .3, 0, 1)));
      e.qW.setAttribute('transform', `translate(${f2(hx)} ${f2(hy + Math.sin(qa * 6) * 3)}) scale(${f2(Math.max(.01, easeOutBack(clamp(qa / .2, 0, 1))) * sc * 2.2)})`);
    } else e.qm.setAttribute('opacity', 0);
  }
  function renderRoom() {
    el.winRain.innerHTML = rainMarkup(winDrops, sf);
    renderMouse(); dogs.forEach(renderDog);
    BOXES.forEach((b, i) => {
      const p = proj(b.X, b.Z), sc = zScale() * sf * .78, g = el.boxes[i];
      g.g.setAttribute('transform', `translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(sc)})`);
      const on = M.hidden === HOLES.length + i;
      g.peek.setAttribute('opacity', on ? 1 : 0);
      if (on) g.peek.setAttribute('transform', `translate(0 ${f2(Math.sin(t * 5) * .8)})`);
    });
    el.holeEyes.forEach((g, i) => g.setAttribute('opacity', M.hidden === i && (t % 2.6) > .16 ? 1 : 0));
    // depth order: whoever is lower on the screen is drawn in front
    const order = [{ z: M.Z + (st === 'hide' || st === 'unhide' ? .004 : 0), n: el.mouse }, { z: dogs[0].Z, n: dogs[0].el.g }, { z: dogs[1].Z, n: dogs[1].el.g }, ...BOXES.map((b, i) => ({ z: b.Z, n: el.boxes[i].g }))].sort((a, b) => a.z - b.z);
    for (let i = 0; i < order.length; i++) if (el.actors.children[i] !== order[i].n) el.actors.appendChild(order[i].n);
    let dh = ''; for (const p of drops) dh += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(2.4 * sf)}" fill="#aaa4e0" opacity="${f2(1 - p.a / .7)}"/>`;
    el.drops.innerHTML = dh;
    // the gold hole pulses and little chevrons point up into it
    const rb = proj(0, ROOMZ).y, eX = proj(EXIT.X, 0).x, on = (st === 'play' || st === 'back' || st === 'hidden' || st === 'hide' || st === 'unhide') ? 1 : 0, pu = .5 + .5 * Math.sin(t * 5);
    el.exitRing.setAttribute('fill', pu > .5 ? '#fff1bd' : '#f4d35e');
    let cue = '';
    if (on) for (let k = 0; k < 3; k++) { const ph = (t * 1.6 - k * .22) % 1.0, y = rb + 14 * sf + k * 11 * sf, a = Math.max(0, Math.sin(Math.PI * clamp(ph, 0, 1))); cue += `<path d="M${f1(eX - 9 * sf)} ${f1(y + 4 * sf)}L${f1(eX)} ${f1(y - 4 * sf)}L${f1(eX + 9 * sf)} ${f1(y + 4 * sf)}" fill="none" stroke="#f4d35e" stroke-width="${f1(3.4 * sf)}" stroke-linecap="round" stroke-linejoin="round" opacity="${f2(.25 + .75 * a)}"/>`; }
    el.exitCue.innerHTML = cue;
  }
  // the tabby waiting in its closed room; the camera zooms in on it during the intro
  function renderTabby() {
    const c = el.cut, tt = t, blink = (tt % 3.1) < .13, look = clamp(((st === 'cut' ? stT : 9) - .3) / .5, 0, 1);
    c.tail.setAttribute('transform', `rotate(${f2(Math.sin(tt * 2.6) * 14)} 38 -8)`);
    c.body.setAttribute('transform', `scale(1 ${f2(1 + .012 * Math.sin(tt * 2.2))})`);
    c.head.setAttribute('transform', `translate(0 -66) rotate(${f2(look * 6 + Math.sin(tt * 1.1) * 1.5)} 0 22)`);
    c.eyes.forEach(e => e.setAttribute('transform', `scale(1 ${blink ? .1 : 1})`));
    c.pupils.forEach(p => p.setAttribute('transform', `translate(${f2(look * 3.4)} ${f2(look * -.4)})`));
    const hp = st === 'cut' ? clamp((stT - .45) / .35, 0, 1) : (st === 'intro1' ? 0 : 1);
    c.heart.setAttribute('opacity', hp > 0 ? 1 : 0);
  }
  // camera: zoom in on the closed room (intro), then back out
  function renderCam() {
    let e = 0;
    if (st === 'cut') e = stT < .5 ? easeInOut(stT / .5) : stT > 1.25 ? 1 - easeInOut(clamp((stT - 1.25) / .45, 0, 1)) : 1;
    const room = proj((ROOMX + 1) / 2, (S0 + ROOMZ) / 2), tcx = room.x, tcy = proj(0, S0 + (ROOMZ - S0) * .68).y, z = 1 + 1.3 * e;
    el.cam.setAttribute('transform', e < .001 ? '' : `translate(${f2(tcx + (W / 2 - tcx) * e)} ${f2(tcy + (H * .5 - tcy) * e)}) scale(${f2(z)}) translate(${f2(-tcx)} ${f2(-tcy)})`);
  }
  function render() { renderRoom(); renderTabby(); renderCam(); }

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
