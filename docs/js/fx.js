/* Visual effects from the tool panel: floating things (snow, hearts, stars, fireflies, confetti), a sparkle trail,
   confetti bursts, scanlines and dark corners. Everything is drawn on top of the pixel canvas as real art pixels. */
Seq.fx = (() => {
  const T = k => Seq.tweaks.get(k);
  const amb = [], sp = [];
  let last = 0, lastEmit = 0;
  const COLORS = ['#ffd98a', '#ff7fa3', '#8fe0b4', '#b38ff0', '#ffffff', '#f4d35e', '#6c9cff'];
  const HEART = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];

  /* x, y in screen pixels (the scene's own coordinates) */
  function emit(x, y) {
    const a = T('trail'); if (a <= .02) return; const now = performance.now(); if (now - lastEmit < 36 / Math.min(2, a)) return; lastEmit = now;
    if (sp.length > 220) return;
    sp.push({ x: x + (Math.random() - .5) * 8, y: y + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 40, vy: -20 - Math.random() * 40, a: 0, life: .45 + Math.random() * .45, c: COLORS[(Math.random() * COLORS.length) | 0], star: Math.random() < .5, g: 30 });
  }
  function burst(x, y, n = 46) {
    n = Math.round(n * T('confetti')); for (let i = 0; i < n && sp.length < 400; i++) {
      const ang = Math.random() * 6.283, v = 120 + Math.random() * 300;
      sp.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 160, a: 0, life: 1.1 + Math.random() * .9, c: COLORS[(Math.random() * COLORS.length) | 0], rect: true, g: 520, sw: Math.random() * 6 });
    }
  }
  function spawnAmbient(kind, w, h, initial) {
    const p = { x: Math.random() * w, y: initial ? Math.random() * h : -4, z: Math.random(), ph: Math.random() * 6.28 };
    if (kind === 'snow') { p.vy = 8 + p.z * 16; p.vx = -2 + Math.random() * 4; }
    else if (kind === 'hearts') { p.y = initial ? p.y : h + 4; p.vy = -(7 + p.z * 12); p.vx = 0; }
    else if (kind === 'stars') { p.vy = 0; p.vx = 0; p.tw = 1 + Math.random() * 2; }
    else if (kind === 'fireflies') { p.vy = 0; p.vx = 0; p.tw = .6 + Math.random() * 1.2; p.cx = p.x; p.cy = p.y; }
    else { p.vy = 12 + p.z * 22; p.vx = 0; p.c = COLORS[(Math.random() * COLORS.length) | 0]; }
    amb.push(p);
  }
  function draw(ctx, info) {
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const k = info.k, w = info.w, h = info.h, t = now / 1000;
    const kind = T('ambient');
    if (kind !== 'none') {
      const want = Math.round(T('ambientAmt') * (kind === 'stars' || kind === 'fireflies' ? 28 : 40));
      if (amb.kind !== kind) { amb.length = 0; amb.kind = kind; }
      while (amb.length < want) spawnAmbient(kind, w, h, true);
      if (amb.length > want) amb.length = want;
      for (const p of amb) {
        if (kind === 'fireflies') { p.x = p.cx + Math.sin(t * .8 * p.tw + p.ph) * 9; p.y = p.cy + Math.cos(t * .6 * p.tw + p.ph * 2) * 6; }
        else { p.y += p.vy * dt; p.x += (p.vx + (kind === 'snow' || kind === 'confetti' ? Math.sin(t * 1.4 + p.ph) * 6 : Math.sin(t + p.ph) * 4)) * dt; }
        if (p.y > h + 4 || p.y < -8) { p.y = p.vy < 0 ? h + 4 : -4; p.x = Math.random() * w; }
        const x = Math.floor(p.x), y = Math.floor(p.y);
        if (kind === 'snow') { ctx.fillStyle = p.z > .6 ? '#ffffff' : '#cdc9f0'; ctx.fillRect(x, y, p.z > .8 ? 2 : 1, p.z > .8 ? 2 : 1); }
        else if (kind === 'hearts') { ctx.fillStyle = p.z > .5 ? '#ff7fa3' : '#ff9db9'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if (HEART[r][c] === 'X') ctx.fillRect(x + c, y + r, 1, 1); }
        else if (kind === 'stars') { const a = .35 + .65 * Math.max(0, Math.sin(t * p.tw + p.ph)); ctx.globalAlpha = a; ctx.fillStyle = '#fff1bd'; ctx.fillRect(x, y, 1, 1); if (a > .8) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); } ctx.globalAlpha = 1; }
        else if (kind === 'fireflies') { const a = .3 + .7 * Math.max(0, Math.sin(t * 2.2 * p.tw + p.ph)); ctx.globalAlpha = a * .45; ctx.fillStyle = '#f2ee8a'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); ctx.globalAlpha = a; ctx.fillStyle = '#fff6c8'; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1; }
        else { ctx.fillStyle = p.c; const flip = Math.sin(t * 5 + p.ph) > 0; ctx.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2); }
      }
    } else if (amb.length) amb.length = 0;
    // sparkles and confetti bursts (screen coordinates -> art pixels)
    for (let i = sp.length - 1; i >= 0; i--) {
      const p = sp[i]; p.a += dt; if (p.a >= p.life) { sp.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const x = Math.floor(p.x / k), y = Math.floor(p.y / k), f = 1 - p.a / p.life;
      ctx.globalAlpha = Math.min(1, f * 1.6); ctx.fillStyle = p.c;
      if (p.rect) { const flip = Math.sin(p.a * 14 + p.sw) > 0; ctx.fillRect(x, y, flip ? 3 : 1, flip ? 1 : 3); }
      else if (p.star) { ctx.fillRect(x, y, 1, 1); if (f > .45) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); } }
      else ctx.fillRect(x, y, 2, 2);
      ctx.globalAlpha = 1;
    }
    const scan = T('scan'); if (scan > .01) { ctx.fillStyle = `rgba(5,2,15,${(.34 * scan).toFixed(3)})`; for (let y = 1; y < h; y += 2) ctx.fillRect(0, y, w, 1); }
    const vig = T('vig'); if (vig > .01) { const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .72); g.addColorStop(0, 'rgba(5,2,15,0)'); g.addColorStop(1, `rgba(5,2,15,${(.85 * vig).toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  }
  return { emit, burst, draw };
})();
