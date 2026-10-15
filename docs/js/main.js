/* Sequence controller: one linear path, no branching.
   opening → 1 trace the route → 2 freeze → 3 fling → ending ("Play again").
   A step only hands over when it reports success; failures inside a step are handled by the
   step itself (as in the studies). Between steps the mouse goes down a hole and an iris
   closes on it, then opens on the hole it comes out of in the next scene. */
(() => {
  const stage = document.getElementById('stage');
  const irisEl = document.getElementById('iris');
  const titleEl = document.getElementById('title');
  const replayBtn = document.getElementById('replay');
  const resetBtn = document.getElementById('reset');

  const ORDER = ['intro', 'route', 'freeze', 'fling'];
  const TITLES = {
    route: '1 · Sneak past the dogs',
    freeze: '2 · Freeze when the dog looks',
    fling: '3 · Fling the cheese to your love'
  };

  let idx = -1, scene = null, root = null, busy = false, titleTimer = 0, irisAnim = null;

  /* ---------- iris transition ---------- */
  const maxR = () => { const r = stage.getBoundingClientRect(); return Math.hypot(r.width, r.height) + 20; };
  const irisCv = document.createElement('canvas'); irisCv.className = 'iriscv'; irisEl.appendChild(irisCv);
  const ictx = irisCv.getContext('2d');
  let ik = 3, iw = 0, ih = 0;
  function irisFit() {
    const W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 3), kk = Math.max(2, Math.round(W * dpr / 170));
    ik = kk / dpr; iw = Math.ceil(W / ik); ih = Math.ceil(H / ik);
    irisCv.width = iw; irisCv.height = ih; irisCv.style.width = iw * ik + 'px'; irisCv.style.height = ih * ik + 'px';
  }
  irisFit(); addEventListener('resize', irisFit);
  function paintIris(x, y, r) {
    ictx.clearRect(0, 0, iw, ih);
    if (r >= maxR() - 1) return;
    ictx.fillStyle = '#0b0624';
    for (let j = 0; j < ih; j++) {
      const dy = (j + .5) * ik - y;
      if (Math.abs(dy) >= r) { ictx.fillRect(0, j, iw, 1); continue; }
      const half = Math.sqrt(r * r - dy * dy), l = Math.floor((x - half) / ik), rt = Math.ceil((x + half) / ik);
      if (l > 0) ictx.fillRect(0, j, l, 1);
      if (rt < iw) ictx.fillRect(rt, j, iw - rt, 1);
    }
  }
  function iris(pt, from, to, ms, cb) {
    const t0 = performance.now(), x = pt.x, y = pt.y;
    irisEl.classList.add('block');
    irisAnim = now => {
      const p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      paintIris(x, y, from + (to - from) * e);
      if (p >= 1) { irisAnim = null; if (to > 0) irisEl.classList.remove('block'); cb && cb(); }
    };
  }

  /* ---------- titles ---------- */
  function showTitle(name) {
    clearTimeout(titleTimer);
    titleEl.classList.remove('on');
    if (!TITLES[name]) return;
    titleEl.firstElementChild.textContent = TITLES[name];
    titleEl.classList.add('on');
    titleTimer = setTimeout(() => titleEl.classList.remove('on'), 2400);
  }

  /* ---------- scenes ---------- */
  function teardown() {
    if (scene) { try { scene.destroy(); } catch (e) {} }
    if (root) root.remove();
    scene = null; root = null;
  }
  function begin(i, irisFrom) {
    teardown();
    idx = i;
    root = document.createElement('div');
    root.className = 'scene';
    stage.insertBefore(root, stage.firstChild);
    let reportedHere = false;
    const name = ORDER[i];
    scene = Seq.scenes[name](root, pt => {
      if (reportedHere || busy) return;
      reportedHere = true;
      next(pt);
    });
    const open = scene.entry || { x: stage.clientWidth / 2, y: stage.clientHeight / 2 };
    busy = true;
    iris(open, irisFrom ? 0 : maxR() * .35, maxR(), irisFrom ? 650 : 450, () => { busy = false; showTitle(name); });
    if (irisFrom) paintIris(open.x, open.y, 0);
  }
  function next(pt) {
    if (idx >= ORDER.length - 1) { finish(); return; }
    busy = true;
    showTitle(null);
    iris(pt || { x: stage.clientWidth / 2, y: stage.clientHeight / 2 }, maxR(), 0, 600, () => {
      setTimeout(() => begin(idx + 1, true), 220);
    });
  }
  function finish() {
    replayBtn.classList.add('on');
    replayBtn.focus({ preventScroll: true });
  }
  function restart() {
    replayBtn.classList.remove('on');
    showTitle(null);
    busy = false; irisAnim = null; irisEl.classList.remove('block');
    begin(0, false);
  }

  replayBtn.addEventListener('click', () => { Seq.audioInit(); restart(); });
  resetBtn.addEventListener('click', () => { Seq.audioInit(); restart(); });
  // keep the sequence buttons from starting a gesture in the scene underneath
  for (const b of [replayBtn, resetBtn]) b.addEventListener('pointerdown', e => e.stopPropagation());

  function frame(now) {
    if (scene) scene.frame(now);
    if (irisAnim) irisAnim(now);
    requestAnimationFrame(frame);
  }
  // Review aid: ?step=1|2|3 opens directly on that step. Without it the sequence always starts at the opening.
  const jump = parseInt(new URLSearchParams(location.search).get('step'), 10);
  begin(jump >= 1 && jump <= 3 ? jump : 0, false);
  requestAnimationFrame(frame);
})();
