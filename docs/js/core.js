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
        const master = ac.createGain(); master.gain.value = 1;
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

  Seq.vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  document.addEventListener('visibilitychange', () => {
    if (!audio.ac) return;
    try { document.hidden ? audio.ac.suspend() : audio.ac.resume(); } catch (e) {}
  });

  return Seq;
})();
