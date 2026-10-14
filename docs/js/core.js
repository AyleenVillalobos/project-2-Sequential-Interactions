/* Shared runtime for the sequence: one audio context, haptics, and the scene registry.
   Each scene file registers a factory on Seq.scenes: (root, done) => { entry, frame(now), destroy() }. */
window.Seq = (() => {
  const Seq = { scenes: {} };

  const audio = { ac: null, master: null, nbuf: null };
  Seq.audio = audio;

  Seq.audioInit = () => {
    try {
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

  Seq.vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  document.addEventListener('visibilitychange', () => {
    if (!audio.ac) return;
    try { document.hidden ? audio.ac.suspend() : audio.ac.resume(); } catch (e) {}
  });

  return Seq;
})();
