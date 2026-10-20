/* Shared runtime for the sequence: one audio context, haptics, and the scene registry.
   Each scene file registers a factory on Seq.scenes: (root, done) => { entry, frame(now), destroy() }. */
window.Seq = (() => {
  const Seq = { scenes: {} };

  const audio = { ac: null, master: null, nbuf: null };
  Seq.audio = audio;

  Seq.audioInit = () => {
    try {
      // iPhones mute Web Audio when the ringer switch is off; asking for "playback" (and looping a silent clip) makes the sounds play anyway
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      if (!audio.keep) {
        try { const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='); a.loop = true; a.volume = .01; a.setAttribute('playsinline', ''); a.play().catch(() => {}); audio.keep = a; } catch (e) {}
      }
      if (!audio.ac) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
        const ac = new C();
        const comp = ac.createDynamicsCompressor();
        const master = ac.createGain(); master.gain.value = Seq.tweaks ? Seq.tweaks.get('vol') : 1;
        master.connect(comp); comp.connect(ac.destination);
        const nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        Object.assign(audio, { ac, master, nbuf });
      }
      if (audio.ac.state !== 'running') audio.ac.resume();
    } catch (e) {}
  };

  /* Every scene sends its sound through its own gain node, so tearing a scene down
     silences anything it left running (the freeze whine, the slingshot drone, a purr). */
  Seq.sceneOut = (level) => {
    let node = null;
    return {
      get() {
        if (!node && audio.ac) { node = audio.ac.createGain(); node.gain.value = level; node.connect(audio.master); }
        return node;
      },
      close() {
        if (!node) return;
        const n = node; node = null;
        try { n.gain.setTargetAtTime(0, audio.ac.currentTime, .03); } catch (e) {}
        setTimeout(() => { try { n.disconnect(); } catch (e) {} }, 300);
      }
    };
  };

  /* a meow: a gliding saw through two vowel-like formants, played into `dest` (a scene's output node) */
  Seq.meow = (dest, pitch, dur, peak = .2, delay = 0) => {
    const ac = audio.ac; if (!ac || !dest) return; const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(pitch * .85, t0); o.frequency.linearRampToValueAtTime(pitch * 1.32, t0 + dur * .32); o.frequency.linearRampToValueAtTime(pitch * .72, t0 + dur);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5; vg.gain.value = pitch * .018; vib.connect(vg).connect(o.frequency);
    const mix = ac.createGain(), g = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
    f1.type = f2.type = 'bandpass'; f1.Q.value = 4; f2.Q.value = 6;
    f1.frequency.setValueAtTime(650, t0); f1.frequency.linearRampToValueAtTime(1000, t0 + dur * .4); f1.frequency.linearRampToValueAtTime(640, t0 + dur);
    f2.frequency.setValueAtTime(1700, t0); f2.frequency.linearRampToValueAtTime(2500, t0 + dur * .4); f2.frequency.linearRampToValueAtTime(1800, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + .05); g.gain.setValueAtTime(peak, t0 + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g); g.connect(dest);
    o.start(t0); vib.start(t0); o.stop(t0 + dur + .05); vib.stop(t0 + dur + .05);
  };

  /* a dog's bark: a short noise snap plus a saw that drops in pitch through two formants, twice ("wuf-wuf") */
  Seq.bark = (dest, pitch = 1, vol = 1, delay = 0) => {
    const ac = audio.ac; if (!ac || !dest) return;
    const one = (t0, k) => {
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(380 * pitch * k, t0); o.frequency.exponentialRampToValueAtTime(175 * pitch * k, t0 + .13);
      const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), mix = ac.createGain(), g = ac.createGain();
      f1.type = f2.type = 'bandpass'; f1.Q.value = 3; f2.Q.value = 4;
      f1.frequency.setValueAtTime(720, t0); f1.frequency.linearRampToValueAtTime(480, t0 + .13);
      f2.frequency.setValueAtTime(1350, t0); f2.frequency.linearRampToValueAtTime(950, t0 + .13);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.55 * vol * k, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + .16);
      o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + .2);
      const n = ac.createBufferSource(); n.buffer = audio.nbuf; const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1000 * pitch; nf.Q.value = .8;
      const ng = ac.createGain(); ng.gain.setValueAtTime(.0001, t0); ng.gain.exponentialRampToValueAtTime(.3 * vol * k, t0 + .006); ng.gain.exponentialRampToValueAtTime(.0001, t0 + .09);
      n.connect(nf).connect(ng).connect(dest); n.start(t0, Math.random() * .5, .12);
    };
    one(ac.currentTime + delay, 1); one(ac.currentTime + delay + .19, .85);
  };

  /* Tweaks: values the tool panel changes live (numbers and colours). Saved on this device. */
  const recolor = Seq.recolor = { map: new Map(), list: [], sync: null };
  Seq.tweaks = (() => {
    const defs = [
      // tab: game
      { t: 'game', k: 'gameSpeed', g: 'Game', label: 'Game speed', min: .4, max: 1.6, step: .05, def: 1 },
      { t: 'game', k: 'mouseSpeed', g: 'Mouse', label: 'Mouse speed', min: .5, max: 1.6, step: .05, def: 1 },
      { t: 'game', k: 'mouseSize', g: 'Mouse', label: 'Mouse size', min: .6, max: 1.8, step: .05, def: 1 },
      { t: 'game', k: 'dogSpeed', g: 'Dogs', label: 'Dog speed', min: .3, max: 2, step: .05, def: 1 },
      { t: 'game', k: 'dogSight', g: 'Dogs', label: 'Dog sight range', min: .5, max: 1.6, step: .05, def: 1 },
      { t: 'game', k: 'dogCatch', g: 'Dogs', label: 'Dog catch reach', min: .5, max: 2, step: .05, def: 1 },
      { t: 'game', k: 'dogSize', g: 'Dogs', label: 'Dog size', min: .6, max: 1.8, step: .05, def: 1 },
      { t: 'game', k: 'kitty', g: 'Kitty and throw', label: 'Kitty speed and jumps', min: .3, max: 2, step: .05, def: 1 },
      { t: 'game', k: 'kittySize', g: 'Kitty and throw', label: 'Kitty size', min: .6, max: 1.8, step: .05, def: 1 },
      { t: 'game', k: 'kittyCatch', g: 'Kitty and throw', label: 'Kitty catch reach', min: .6, max: 2, step: .05, def: 1 },
      { t: 'game', k: 'power', g: 'Kitty and throw', label: 'Throw power', min: .6, max: 1.5, step: .05, def: 1 },
      { t: 'game', k: 'gravity', g: 'Kitty and throw', label: 'Throw gravity', min: .6, max: 1.6, step: .05, def: 1 },
      { t: 'game', k: 'gateHeight', g: 'Kitty and throw', label: 'Baby gate height', min: .3, max: 1.4, step: .05, def: 1 },
      // tab: audio
      { t: 'audio', k: 'vol', g: 'Volume', label: 'Master volume', min: 0, max: 1.5, step: .05, def: 1 },
      { t: 'audio', k: 'music', g: 'Volume', label: 'Throw-game music', min: 0, max: 1.5, step: .05, def: 1 },
      { t: 'audio', k: 'dogBark', g: 'Volume', label: 'Bark volume', min: 0, max: 2, step: .05, def: 1 },
      // tab: effects (visual)
      { t: 'fx', k: 'look', g: 'Colour look', type: 'choice', label: 'Look', options: [['normal', 'Normal'], ['warm', 'Warm'], ['cool', 'Cool'], ['sepia', 'Sepia'], ['mono', 'Black & white'], ['gameboy', 'Game Boy'], ['neon', 'Neon']], def: 'normal' },
      { t: 'fx', k: 'hue', g: 'Colour look', label: 'Hue shift', min: -180, max: 180, step: 5, def: 0, plain: 1 },
      { t: 'fx', k: 'sat', g: 'Colour look', label: 'Saturation', min: 0, max: 2, step: .05, def: 1 },
      { t: 'fx', k: 'contrast', g: 'Colour look', label: 'Contrast', min: .6, max: 1.6, step: .05, def: 1 },
      { t: 'fx', k: 'bright', g: 'Colour look', label: 'Brightness', min: .6, max: 1.4, step: .05, def: 1 },
      { t: 'fx', k: 'scan', g: 'Screen', label: 'Scanlines', min: 0, max: 1, step: .05, def: 0 },
      { t: 'fx', k: 'vig', g: 'Screen', label: 'Dark corners', min: 0, max: 1, step: .05, def: 0 },
      { t: 'fx', k: 'pixel', g: 'Screen', label: 'Pixel size', min: .5, max: 2.5, step: .05, def: 1 },
      { t: 'fx', k: 'dither', g: 'Screen', label: 'Shading grain', min: 0, max: 30, step: 1, def: 11, plain: 1 },
      { t: 'fx', k: 'ambient', g: 'Floating things', type: 'choice', label: 'Floating', options: [['none', 'None'], ['snow', 'Snow'], ['hearts', 'Hearts'], ['stars', 'Stars'], ['fireflies', 'Fireflies'], ['confetti', 'Confetti']], def: 'none' },
      { t: 'fx', k: 'ambientAmt', g: 'Floating things', label: 'How many', min: .2, max: 3, step: .1, def: 1 },
      { t: 'fx', k: 'trail', g: 'Sparkles', label: 'Sparkle trail', min: 0, max: 2, step: .1, def: 0 },
      { t: 'fx', k: 'confetti', g: 'Sparkles', label: 'Confetti burst on a catch', min: 0, max: 2, step: .1, def: 1 },
      { t: 'fx', k: 'rain', g: 'Opening scene', label: 'Rain amount', min: 0, max: 3, step: .1, def: 1 }
    ];
    // colour groups: every member is a colour used in the art; picking a new base colour recolours the whole group, keeping the light/dark shading
    const colorDefs = [
      { k: 'mouse', label: 'Mouse fur', base: '#b6adcf', members: ['#b6adcf', '#c9c0df', '#9a90b8', '#dcd5ee', '#ece7f8'] },
      { k: 'mouseEar', label: 'Mouse ears and nose', base: '#f4a6bd', members: ['#f4a6bd', '#f48fae', '#ffd0de', '#ff8fae'] },
      { k: 'red', label: 'Red (scarf, heart seal, alerts)', base: '#e5475c', members: ['#e5475c', '#b92a44'] },
      { k: 'tabby', label: 'Tabby fur', base: '#f0954a', members: ['#f0954a', '#ffbb62'] },
      { k: 'tabbyEyes', label: 'Tabby eyes', base: '#45b98d', members: ['#45b98d', '#1d7c63'] },
      { k: 'dogA', label: 'Brown dog', base: '#a9653b', members: ['#a9653b', '#8b4b31', '#6c3b23', '#f8e4b1'] },
      { k: 'dogB', label: 'Blue dog', base: '#5e5c8d', members: ['#5e5c8d', '#4c4a79', '#3b3861', '#dfddf1'] },
      { k: 'pink', label: 'Pink (her shirt, hearts, blush)', base: '#ff7fa3', members: ['#ff7fa3', '#e0608a'] },
      { k: 'hair', label: 'Her hair', base: '#15101c', members: ['#15101c', '#4b4466'] },
      { k: 'skin', label: 'Her skin', base: '#c98f5e', members: ['#c98f5e', '#a8703f'] },
      { k: 'pants', label: 'Her sweatpants', base: '#1c1a26', members: ['#1c1a26'] },
      { k: 'walls', label: 'Walls, roof and night', base: '#322a6b', members: ['#14102e', '#1c1740', '#261f55', '#2b2260', '#322a6b', '#3a3178', '#413883', '#5638a6', '#6c63b6', '#8981cd'] },
      { k: 'wood', label: 'Wood floors and boxes', base: '#a8643a', members: ['#6b3a22', '#8a4a30', '#9a5632', '#a35f37', '#a8643a', '#b06a3c', '#d9965a', '#e8c08a'] },
      { k: 'rug', label: 'Rug, gate and banister', base: '#c4577f', members: ['#8c2447', '#c4577f', '#ee86ab', '#ffc4d6'] },
      { k: 'plant', label: 'Plants', base: '#4f9a6a', members: ['#2f5d4a', '#4f9a6a'] }
    ];
    const KEY = 'mouse-messenger-tweaks'; let vals = {}, cols = {}; const subs = [];
    const SITE = (typeof window !== 'undefined' && window.MM_DEFAULTS) || {};
    const fromObj = o => { o = Object.assign({}, o || {}); const c = Object.assign({}, o.__colors || {}); delete o.__colors; return [o, c]; };
    try { const raw = localStorage.getItem(KEY); [vals, cols] = fromObj(raw ? JSON.parse(raw) : SITE); } catch (e) { [vals, cols] = fromObj(SITE); }
    const save = () => { try { const o = Object.assign({}, vals); if (Object.keys(cols).length) o.__colors = cols; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
    const def = k => defs.find(d => d.k === k);
    const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
    const fromHsl = ([h, s, l]) => { const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; if (s === 0) return [l, l, l].map(v => Math.round(v * 255)); const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(v => Math.round(v * 255)); };
    const shade = (target, base, member) => {         // the member's light/dark offset from the base, applied to the new colour
      const B = hsl(rgb(base)), M = hsl(rgb(member)), T = hsl(rgb(target));
      const l = Math.min(.97, Math.max(.03, T[2] + (M[2] - B[2]))), s = Math.min(1, T[1] * (B[1] > .02 ? Math.min(1.6, M[1] / B[1]) : 1));
      return fromHsl([T[0], s, l]);
    };
    const rebuild = () => {
      recolor.map.clear(); recolor.list = [];
      for (const g of colorDefs) { const v = cols[g.k]; if (!v) continue; for (const m of g.members) { const t = m === g.base ? rgb(v) : shade(v, g.base, m); recolor.map.set(rgb(m).join(','), t); recolor.list.push(t); } }
      if (recolor.sync) recolor.sync();
    };
    const api = {
      defs, colorDefs,
      get: k => { const v = vals[k]; return v !== undefined && v !== null ? v : (def(k) ? def(k).def : 1); },
      set(k, v) { vals[k] = v; save(); api.apply(); subs.forEach(f => f(k, v)); },
      getColor: k => cols[k] || colorDefs.find(g => g.k === k).base,
      isCustom: k => !!cols[k],
      setColor(k, hex) { const g = colorDefs.find(x => x.k === k); if (hex.toLowerCase() === g.base.toLowerCase()) delete cols[k]; else cols[k] = hex.toLowerCase(); save(); rebuild(); subs.forEach(f => f('color:' + k, hex)); },
      resetColor(k) { delete cols[k]; save(); rebuild(); subs.forEach(f => f('color:' + k)); },
      reset() { [vals, cols] = fromObj(SITE); try { localStorage.removeItem(KEY); } catch (e) {} rebuild(); api.apply(); subs.forEach(f => f()); },
      // a settings code carries every change in one short string (the share link is the page address plus ?s=code)
      exportCode() { const o = Object.assign({}, vals); if (Object.keys(cols).length) o.__colors = cols; return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
      importCode(code) {
        try {
          const j = decodeURIComponent(escape(atob(String(code).trim().replace(/^.*[?&]s=/, '').replace(/-/g, '+').replace(/_/g, '/'))));
          const o = JSON.parse(j); if (!o || typeof o !== 'object') return false;
          [vals, cols] = fromObj(o); save(); rebuild(); api.apply(); subs.forEach(f => f()); return true;
        } catch (e) { return false; }
      },
      apply() { if (audio.master) { try { audio.master.gain.value = api.get('vol'); } catch (e) {} } },
      onChange(f) { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; }
    };
    rebuild();
    try { const q = new URLSearchParams(location.search).get('s'); if (q && api.importCode(q)) { const u = new URL(location.href); u.searchParams.delete('s'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); } } catch (e) {}
    return api;
  })();

  Seq.vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  document.addEventListener('visibilitychange', () => {
    if (!audio.ac) return;
    try { document.hidden ? audio.ac.suspend() : audio.ac.resume(); } catch (e) {}
  });

  return Seq;
})();
