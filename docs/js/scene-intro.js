/* Opening — the sender cat hands the mouse the love letter.
   Not in the studies; built from Study 03's side-view art, springs and sounds so it reads as
   the same world. The letter pulses in the cat's paws (Study 01's letter pulse); tapping it is
   the first gesture and also unlocks sound. The mouse takes the letter overhead (Study 03's
   holding pose), salutes, and hops into the mouse hole (Study 03's intro, reversed). */
Seq.scenes.intro = (root, done) => {
  root.classList.add('sc-side');
  root.innerHTML = `
  <svg class="scene-svg" xmlns="http://www.w3.org/2000/svg" aria-label="A cat holds out a love letter to a mouse standing by a mouse hole. Tap the letter.">
    <defs><clipPath id="inHoleClip"><path class="holeClipPath" d=""/></clipPath></defs>
    <g class="world">
      <ellipse class="shMouse" cx="0" cy="0" rx="48" ry="7" fill="var(--shadow)"/>
      <ellipse class="shKitty" cx="0" cy="0" rx="66" ry="9" fill="var(--shadow)"/>
      <path class="hole" d="" fill="#3a3a3a" stroke="#8e8e8e" stroke-width="6" stroke-linejoin="round"/>
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
      <!-- the sender: a darker tabby, so she reads as a different cat from the kitty at the end -->
      <g class="kitty"><g class="kSq">
        <g class="kTail"><path d="M108 142 C 136 136, 136 100, 120 94" fill="none" stroke="#7c7c7c" stroke-width="10" stroke-linecap="round"/></g>
        <ellipse cx="70" cy="122" rx="42" ry="45" fill="#8f8f8f" stroke="#5e5e5e" stroke-width="2"/>
        <g class="kHead">
          <polygon points="38,42 42,8 66,32" fill="#9a9a9a" stroke="#5e5e5e" stroke-width="2" stroke-linejoin="round"/>
          <polygon points="102,42 98,8 74,32" fill="#9a9a9a" stroke="#5e5e5e" stroke-width="2" stroke-linejoin="round"/>
          <polygon points="45,35 46,17 58,31" fill="#c4c4c4"/>
          <polygon points="95,35 94,17 82,31" fill="#c4c4c4"/>
          <circle cx="70" cy="62" r="36" fill="#9a9a9a" stroke="#5e5e5e" stroke-width="2"/>
          <path d="M62 30 l2 12 M70 28 v13 M78 30 l-2 12" stroke="#6e6e6e" stroke-width="3" stroke-linecap="round"/>
          <g class="kEyes">
            <ellipse cx="56" cy="60" rx="5" ry="7" fill="#222"/>
            <ellipse cx="84" cy="60" rx="5" ry="7" fill="#222"/>
            <circle cx="57.5" cy="57" r="1.8" fill="#fff"/>
            <circle cx="85.5" cy="57" r="1.8" fill="#fff"/>
          </g>
          <circle cx="46" cy="75" r="6" fill="#b8b8b8"/>
          <circle cx="94" cy="75" r="6" fill="#b8b8b8"/>
          <polygon points="66,70 74,70 70,75" fill="#444"/>
          <path d="M70 75 q-5 6 -10 2 M70 75 q5 6 10 2" fill="none" stroke="#444" stroke-width="2" stroke-linecap="round"/>
          <path d="M42 70 L22 66 M42 75 L22 78 M98 70 L118 66 M98 75 L118 78" stroke="#5e5e5e" stroke-width="1.3" stroke-linecap="round"/>
        </g>
        <ellipse cx="55" cy="162" rx="13" ry="8" fill="#828282" stroke="#5e5e5e" stroke-width="2"/>
        <ellipse cx="85" cy="162" rx="13" ry="8" fill="#828282" stroke="#5e5e5e" stroke-width="2"/>
        <g class="kHeld">
          <g class="kHeldPulse"><use href="#letterArt" transform="translate(70 120) scale(0.6087) translate(-80 -55)"/></g>
          <ellipse cx="44" cy="120" rx="8" ry="15" transform="rotate(-38 44 120)" fill="#8f8f8f" stroke="#5e5e5e" stroke-width="2"/>
          <ellipse cx="96" cy="120" rx="8" ry="15" transform="rotate(38 96 120)" fill="#8f8f8f" stroke="#5e5e5e" stroke-width="2"/>
        </g>
      </g></g>
      <g class="letterWrap"><use class="letter" href="#letterArt" visibility="hidden"/></g>
    </g>
  </svg>`;
  const svg = root.querySelector('svg');
  const el = {};
  ['world', 'mouse', 'mouseWrap', 'mBody', 'mHead', 'mEyes', 'mPawL', 'mPawR', 'kitty', 'kSq', 'kTail', 'kHead', 'kEyes', 'kHeld', 'kHeldPulse',
    'letter', 'letterWrap', 'shMouse', 'shKitty', 'hole', 'holeClipPath'].forEach(n => el[n] = root.querySelector('.' + n));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, RM = reduce ? .35 : 1;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const spring = v => ({ v, vel: 0 });
  function stepS(sp, target, kk, d, dt) { sp.vel += (-kk * (sp.v - target) - d * sp.vel) * dt; sp.v += sp.vel * dt; }

  /* sound: Study 03's grab / boop / purr voices */
  const AU = Seq.audio, out = Seq.sceneOut(.6);
  const ok = () => AU.ac && out.get();
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!ok()) return; const AC = AU.ac, t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(out.get()); o.start(t0); o.stop(t0 + dur + .03);
  }
  function noise(dur, vol, ftype, freq, qq = 1, delay = 0) {
    if (!ok()) return; const AC = AU.ac, t0 = AC.currentTime + delay, src = AC.createBufferSource(); src.buffer = AU.nbuf;
    const f = AC.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = qq;
    const g = AC.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(f).connect(g).connect(out.get()); src.start(t0); src.stop(t0 + dur + .03);
  }
  const snd = {
    grab() { tone('sine', 260, 170, .1, .25); noise(.06, .07, 'highpass', 2500); },
    boop() { tone('sine', 420, 660, .11, .18); },
    whoosh() { noise(.5, .05, 'bandpass', 900, .7, .05); },
    step() { tone('sine', 1100, 700, .035, .035); },
    dive() { tone('sine', 980, 420, .14, .14); },
    mew() { tone('sine', 620, 880, .12, .08); tone('sine', 880, 560, .18, .07, .1); }
  };

  /* world */
  const KS = 1.15, LS = .7, HOLE_X = -112, MOUSE_X = -18, CAT_X = 150;
  const holePath = (() => { const w = 46, top = -64; return `M${HOLE_X - w} 0 L${HOLE_X - w} ${top} A${w} ${w} 0 0 1 ${HOLE_X + w} ${top} L${HOLE_X + w} 0 Z`; })();
  el.hole.setAttribute('d', holePath); el.holeClipPath.setAttribute('d', holePath);
  const heldWorld = () => ({ x: CAT_X, y: (120 - 170) * KS });

  let W, H, cam;
  function layout() {
    const r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const z = Math.min(W / 430, H * .5 / 300);
    cam = { x: (HOLE_X - 60 + CAT_X + 90) / 2, y: -150, z };
  }
  const toScreen = (wx, wy) => ({ x: (wx - cam.x) * cam.z + W / 2, y: (wy - cam.y) * cam.z + H / 2 });

  const mouse = { x: MOUSE_X, scale: 1, hopY: 0, bob: 0, clip: false, dim: 1, dist: 0 };
  const anchor = () => ({ x: mouse.x, y: -173 * mouse.scale - mouse.bob - mouse.hopY });
  const S = { mPaw: spring(0), mSalute: spring(0), mTilt: spring(0), mEx: spring(0), mEy: spring(0), mSq: spring(1), chSq: spring(1), kHead: spring(0), kEye: spring(1), kSq: spring(1), wig: spring(0) };
  let st = 'wait', stT = 0, t = 0, reported = false, lastStep = 0;
  const lt = { x: 0, y: 0, rot: 0 };
  const setState = n => { st = n; stT = 0; };

  function give() {
    if (st !== 'wait') return;
    Seq.audioInit(); snd.grab(); Seq.vib(10);
    el.kHeld.setAttribute('visibility', 'hidden');
    S.kSq.vel += 3; setState('give');
  }
  function onDown(e) {
    Seq.audioInit();
    if (st !== 'wait') return;
    const r = svg.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const h = heldWorld(), c = toScreen(h.x, h.y), reach = Math.max(70, 75 * cam.z);
    if (Math.hypot(p.x - c.x, p.y - c.y) < reach) give();
    else { S.wig.vel += 60; snd.boop(); }
  }
  const onKey = e => { if ((e.code === 'Enter' || e.code === 'Space') && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); give(); } };
  root.addEventListener('pointerdown', onDown);
  addEventListener('keydown', onKey);
  const ro = new ResizeObserver(layout); ro.observe(root);

  function update(dt) {
    t += dt; stT += dt;
    let pawT = 0, salT = 0, lookP = heldWorld(), kEyeT = (t % 3.9) < .13 ? .1 : 1, kHeadT = Math.sin(t * 1.1) * 4 * RM;
    if (st === 'wait') {
      mouse.hopY = Math.max(0, Math.sin(t * 1.43 - 1)) ** 8 * 14 * RM; // little anticipatory hop, as in Study 01's idle
    } else if (st === 'give') {
      const u = clamp(stT / .7, 0, 1), e = easeInOut(u), h = heldWorld(), a = anchor();
      lt.x = lerp(h.x, a.x, e); lt.y = lerp(h.y, a.y, e) - Math.sin(Math.PI * u) * 70; lt.rot = Math.sin(Math.PI * u) * -14;
      pawT = u > .55 ? 1 : 0; lookP = lt; kHeadT = -6;
      if (u >= 1) { S.chSq.vel += 5; S.mSq.v = .82; snd.boop(); Seq.vib([10, 30, 10]); setState('thanks'); }
    } else if (st === 'thanks') {
      pawT = 1; salT = stT > .2 && stT < 1.1 ? 1 : 0; kEyeT = .2; kHeadT = Math.sin(t * 3) * 7;
      if (stT > .25 && stT - dt <= .25) snd.mew();
      if (stT > 1.3) { setState('go'); snd.whoosh(); }
    } else if (st === 'go') {
      pawT = 1; lookP = { x: HOLE_X, y: -60 };
      const walkEnd = .55;
      if (stT < walkEnd) {
        const u = stT / walkEnd; const nx = lerp(MOUSE_X, HOLE_X + 26, easeInOut(u));
        mouse.dist += Math.abs(nx - mouse.x); mouse.x = nx;
        mouse.bob = Math.abs(Math.sin(mouse.dist / 11)) * 6;
        const si = Math.floor(mouse.dist / 34.5); if (si !== lastStep) { lastStep = si; snd.step(); }
      } else {
        const u = clamp((stT - walkEnd) / .45, 0, 1);
        if (!mouse.clip && u > .45) { mouse.clip = true; snd.dive(); }
        mouse.bob = 0; mouse.x = lerp(HOLE_X + 26, HOLE_X, u);
        mouse.hopY = Math.sin(Math.PI * Math.min(1, u * 1.4)) * 50;
        mouse.scale = lerp(1, .62, u); mouse.dim = lerp(1, .55, u);
        if (u >= 1 && !reported) { reported = true; done(toScreen(HOLE_X, -40)); }
      }
    }
    stepS(S.mPaw, pawT, 360, 16, dt);
    stepS(S.mSalute, salT, 330, 11, dt);
    stepS(S.mSq, 1, 420, 10, dt);
    stepS(S.chSq, 1, 520, 11, dt);
    stepS(S.kHead, kHeadT, 160, 14, dt);
    stepS(S.kEye, kEyeT, 700, 30, dt);
    stepS(S.kSq, 1, 420, 9, dt);
    stepS(S.wig, 0, 220, 9, dt);
    const lx = lookP.x - mouse.x, ly = lookP.y + 118, ll = Math.hypot(lx, ly) || 1;
    stepS(S.mEx, lx / ll * 4, 300, 22, dt); stepS(S.mEy, ly / ll * 1.6, 300, 22, dt);
    stepS(S.mTilt, st === 'wait' ? 10 : st === 'thanks' ? 6 : 0, 160, 14, dt);
  }

  const f = n => n.toFixed(2);
  function render() {
    el.world.setAttribute('transform', `translate(${f(W / 2)} ${f(H / 2)}) scale(${cam.z.toFixed(4)}) translate(${f(-cam.x)} ${f(-cam.y)})`);
    if (mouse.clip) el.mouseWrap.setAttribute('clip-path', 'url(#inHoleClip)'); else el.mouseWrap.removeAttribute('clip-path');
    el.mouseWrap.setAttribute('opacity', f(mouse.dim));
    const sq = S.mSq.v;
    el.mouse.setAttribute('transform', `translate(${f(mouse.x)} ${f(-mouse.bob - mouse.hopY)}) scale(${f(mouse.scale)}) scale(${f(2 - sq)} ${f(sq)}) translate(-60 -160)`);
    el.mHead.setAttribute('transform', `rotate(${f(S.mTilt.v)} 60 70)`);
    el.mEyes.setAttribute('transform', `translate(${f(clamp(S.mEx.v, -4.5, 4.5))} ${f(clamp(S.mEy.v, -1.8, 1.8))})`);
    const up = clamp(S.mPaw.v, -.2, 1.2), sal = S.mSalute.v;
    el.mPawL.setAttribute('transform', `translate(${f(-8 * up)} ${f(-58 * up)})`);
    el.mPawR.setAttribute('transform', `translate(${f(8 * up - 4 * sal)} ${f(-58 * up - 28 * sal)}) rotate(${f(-40 * sal)} 82 70)`);
    el.shMouse.setAttribute('cx', f(mouse.x));
    el.shMouse.setAttribute('visibility', mouse.clip ? 'hidden' : 'visible');
    el.shMouse.setAttribute('rx', f(48 * mouse.scale * (1 - Math.min(mouse.hopY / 150, .4))));

    el.kitty.setAttribute('transform', `translate(${CAT_X} 0) scale(${KS}) translate(-70 -170)`);
    const kq = clamp(S.kSq.v, .7, 1.35);
    el.kSq.setAttribute('transform', `translate(70 170) scale(${f(kq)} ${f(2 - kq)}) translate(-70 -170)`);
    el.kTail.setAttribute('transform', `rotate(${f(Math.sin(t * (st === 'thanks' ? 5.2 : 2.3)) * (st === 'thanks' ? 18 : 13) * (reduce ? .5 : 1))} 108 142)`);
    el.kHead.setAttribute('transform', `rotate(${f(S.kHead.v)} 70 98)`);
    el.kEyes.setAttribute('transform', `translate(-2 1) translate(70 60) scale(1 ${f(Math.max(.08, S.kEye.v))}) translate(-70 -60)`);
    el.shKitty.setAttribute('cx', CAT_X);
    if (st === 'wait') {
      const pulse = 1 + .045 * (.5 - .5 * Math.cos(t * 2 * Math.PI / 2.6)) * (reduce ? .3 : 1);
      el.kHeldPulse.setAttribute('transform', `translate(70 120) rotate(${f(S.wig.v)}) scale(${f(pulse)}) translate(-70 -120)`);
    }

    if (st === 'wait') el.letter.setAttribute('visibility', 'hidden');
    else {
      if (st !== 'give') { const a = anchor(); lt.x = a.x; lt.y = a.y + Math.sin(t * 3.3) * 3 * RM; lt.rot = Math.sin(t * 1.7) * 2 * RM; }
      const qq = clamp(S.chSq.v, .65, 1.35), sc = LS * (st === 'go' ? mouse.scale : 1);
      el.letter.setAttribute('visibility', 'visible');
      el.letter.setAttribute('opacity', f(mouse.dim));
      if (mouse.clip) el.letterWrap.setAttribute('clip-path', 'url(#inHoleClip)');
      el.letter.setAttribute('transform', `translate(${f(lt.x)} ${f(lt.y)}) rotate(${f(lt.rot)}) scale(${f(qq * sc)} ${f((2 - qq) * sc)}) translate(-80 -55)`);
    }
  }

  layout(); render();
  let last = performance.now();
  return {
    entry: { x: W / 2, y: H / 2 },
    frame(now) { const dt = Math.min((now - last) / 1000, 1 / 30); last = now; update(dt); render(); },
    destroy() { ro.disconnect(); removeEventListener('keydown', onKey); out.close(); }
  };
};
