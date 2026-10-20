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

  /* ---------- tool panel: live tweaks (numbers and colours), saved on this device ---------- */
  const tBtn = document.getElementById('tweakBtn'), tPanel = document.getElementById('tweaks'), tRows = tPanel.querySelector('.rows'), tTabs = tPanel.querySelector('.tabs');
  const fmt = v => '×' + Number(v).toFixed(2).replace(/\.?0+$/, '');
  const TABS = [{ id: 'game', label: 'Game' }, { id: 'colors', label: 'Colors' }, { id: 'fx', label: 'Effects' }, { id: 'audio', label: 'Audio' }];
  const sections = {};
  for (const t of TABS) { const sec = document.createElement('section'); sec.dataset.tab = t.id; sec.hidden = true; tRows.appendChild(sec); sections[t.id] = sec;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = t.label; b.dataset.tab = t.id; b.setAttribute('role', 'tab'); tTabs.appendChild(b); }
  const showTab = id => { for (const t of TABS) { sections[t.id].hidden = t.id !== id; const b = tTabs.querySelector(`[data-tab="${t.id}"]`); b.classList.toggle('on', t.id === id); b.setAttribute('aria-selected', t.id === id ? 'true' : 'false'); } try { localStorage.setItem('mm-tab', id); } catch (e) {} };
  tTabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
  const lastGroup = {};
  for (const d of Seq.tweaks.defs) {
    const sec = sections[d.t];
    if (lastGroup[d.t] !== d.g) { lastGroup[d.t] = d.g; const h = document.createElement('div'); h.className = 'grp'; h.textContent = d.g; sec.appendChild(h); }
    if (d.type === 'choice') {
      const row = document.createElement('div'); row.className = 'chrow'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', d.label);
      row.innerHTML = d.options.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('');
      const show = () => { for (const b of row.children) b.classList.toggle('on', b.dataset.v === String(Seq.tweaks.get(d.k))); };
      row.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { Seq.tweaks.set(d.k, b.dataset.v); show(); } });
      Seq.tweaks.onChange(show); show(); sec.appendChild(row); continue;
    }
    const row = document.createElement('label'); row.className = 'trow'; row.htmlFor = 'tw-' + d.k;
    row.innerHTML = `<span>${d.label}</span><output></output><input id="tw-${d.k}" type="range" min="${d.min}" max="${d.max}" step="${d.step}">`;
    const inp = row.querySelector('input'), out = row.querySelector('output');
    const show = () => { inp.value = Seq.tweaks.get(d.k); out.textContent = d.plain ? inp.value : fmt(inp.value); };
    inp.addEventListener('input', () => { Seq.tweaks.set(d.k, parseFloat(inp.value)); show(); });
    Seq.tweaks.onChange(show); show(); sec.appendChild(row);
  }
  { const h = document.createElement('div'); h.className = 'grp'; h.textContent = 'Pick a colour to recolour that part everywhere'; sections.colors.appendChild(h); }
  for (const g of Seq.tweaks.colorDefs) {
    const row = document.createElement('div'); row.className = 'crow';
    row.innerHTML = `<label for="tc-${g.k}">${g.label}</label><input id="tc-${g.k}" type="color"><button type="button" class="cr" aria-label="Reset ${g.label}" title="Reset">&#8634;</button>`;
    const inp = row.querySelector('input'), rb = row.querySelector('.cr');
    const show = () => { inp.value = Seq.tweaks.getColor(g.k); rb.hidden = !Seq.tweaks.isCustom(g.k); };
    inp.addEventListener('input', () => { Seq.tweaks.setColor(g.k, inp.value); rb.hidden = !Seq.tweaks.isCustom(g.k); });
    rb.addEventListener('click', () => Seq.tweaks.resetColor(g.k));
    Seq.tweaks.onChange(show); show(); sections.colors.appendChild(row);
  }
  let startTab = 'game'; try { startTab = localStorage.getItem('mm-tab') || 'game'; } catch (e) {} if (!sections[startTab]) startTab = 'game'; showTab(startTab);
  const setPanel = open => { tPanel.classList.toggle('open', open); tPanel.setAttribute('aria-hidden', open ? 'false' : 'true'); tBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) tTabs.querySelector('.on').focus({ preventScroll: true }); };
  tBtn.addEventListener('click', () => { Seq.audioInit(); setPanel(!tPanel.classList.contains('open')); });
  document.getElementById('tweakClose').addEventListener('click', () => { setPanel(false); tBtn.focus({ preventScroll: true }); });
  document.getElementById('tweakReset').addEventListener('click', () => { Seq.tweaks.reset(); say('Back to the starting settings.'); });
  const msg = document.getElementById('tweakMsg'), codeRow = document.getElementById('tweakCodeRow'), codeIn = document.getElementById('tweakCode'), baseMsg = msg.textContent;
  const say = t => { msg.textContent = t; clearTimeout(say.t); say.t = setTimeout(() => { msg.textContent = baseMsg; }, 4500); };
  document.getElementById('tweakShare').addEventListener('click', async () => {
    const code = Seq.tweaks.exportCode(), link = location.origin + location.pathname + '?s=' + code;
    try { await navigator.clipboard.writeText(link); say('Link copied. Open it on any device to get these settings.'); }
    catch (e) { codeRow.hidden = false; codeIn.value = link; codeIn.focus(); codeIn.select(); say('Copy this link and open it on another device.'); }
  });
  document.getElementById('tweakPaste').addEventListener('click', () => { codeRow.hidden = !codeRow.hidden; if (!codeRow.hidden) { codeIn.value = ''; codeIn.focus(); } });
  document.getElementById('tweakApply').addEventListener('click', () => { if (Seq.tweaks.importCode(codeIn.value)) { say('Settings applied.'); codeRow.hidden = true; } else say('That code did not work. Try copying it again.'); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setPanel(false); });
  for (const b of [tBtn, tPanel]) b.addEventListener('pointerdown', e => e.stopPropagation());

  /* colour look: CSS filter on the pixel canvas */
  const LOOKS = { normal: '', warm: 'sepia(.35) saturate(1.2) hue-rotate(-10deg)', cool: 'hue-rotate(25deg) saturate(1.1) brightness(1.03)', sepia: 'sepia(1)', mono: 'grayscale(1) contrast(1.1)', gameboy: 'grayscale(1) sepia(1) hue-rotate(35deg) saturate(2.2) contrast(1.15)', neon: 'saturate(1.9) contrast(1.2) brightness(1.05)' };
  const applyFilter = () => {
    const T = Seq.tweaks.get, parts = [LOOKS[T('look')] || ''];
    if (T('hue')) parts.push(`hue-rotate(${T('hue')}deg)`); if (T('sat') !== 1) parts.push(`saturate(${T('sat')})`); if (T('contrast') !== 1) parts.push(`contrast(${T('contrast')})`); if (T('bright') !== 1) parts.push(`brightness(${T('bright')})`);
    const f = parts.filter(Boolean).join(' '); stage.style.setProperty('--fx-filter', f || 'none');
  };
  Seq.tweaks.onChange(applyFilter); applyFilter();

  const ORDER = ['intro', 'route', 'fling'];
  const TITLES = {
    route: '1 · Sneak past the dogs',
    fling: '2 · Swipe the letter to your love'
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
