/* Pixel look.
   Every frame the live scene (inline SVG + absolutely positioned HTML) is drawn into a small
   canvas, every pixel is snapped to one shared palette (with a touch of ordered dithering so
   gradients turn into banded retro shading), and the result is scaled up with hard square
   edges. The scenes keep animating and playing exactly as before; only what you see changes.

   Seq.Pixel(root, opts)  -> { render(now), overlays: [fn(ctx, info)], destroy() }
   Elements inside `root` marked data-px-ui stay as normal crisp page UI (buttons, speech bubble). */
(() => {
  /* ---------- palette: dusky purples, lavender greys, warm window lights, a few pinks / greens ---------- */
  const HEX = [
    '#0b0624', '#120a30', '#1b1042', '#261758', '#33206e', '#432b88', '#5638a6', '#6f4ec4', '#8f68dc', '#b38ff0',
    '#7a4aa8', '#a266c8', '#d08fe0',
    '#14102e', '#1c1740', '#261f55', '#322a6b', '#413883', '#544b9c', '#6c63b6', '#8981cd', '#aaa4e0', '#cdc9f0',
    '#e6e3f7', '#f5f2fd', '#ffffff',
    '#2a2845', '#3a3860', '#4b4a78', '#5d5c8c', '#75749f', '#908fb5', '#aeadcb', '#c6c4dc', '#dedcf0',
    '#5a2f2a', '#8a4a30', '#c46a38', '#f0954a', '#ffbb62', '#ffd98a', '#fff1bd',
    '#5b1230', '#8c2447', '#b92a44', '#e5475c', '#c4577f', '#ff7fa3', '#ff9db9', '#ffc4d6',
    '#1d7c63', '#45b98d', '#8fe0b4', '#f4d35e',
    '#6b3a22', '#a8643a', '#d9965a', '#e8c08a', '#f7e3b0', '#2f5d4a', '#4f9a6a', '#b06a3c'
  ];
  const PAL = HEX.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const lut = new Int16Array(32768).fill(-1);
  function snap(r, g, b) {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let i = lut[k];
    if (i < 0) {
      const rr = (r & 248) | 4, gg = (g & 248) | 4, bb = (b & 248) | 4;
      let best = 1e9; i = 0;
      for (let j = 0; j < PAL.length; j++) {
        const p = PAL[j], dr = rr - p[0], dg = gg - p[1], db = bb - p[2], d = dr * dr * .9 + dg * dg * 1.2 + db * db * .8;
        if (d < best) { best = d; i = j; }
      }
      lut[k] = i;
    }
    return i;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);

  /* ---------- tiny SVG/HTML -> canvas rasterizer ---------- */
  const SKIP = new Set(['defs', 'clippath', 'mask', 'pattern', 'lineargradient', 'radialgradient', 'filter', 'style', 'title', 'desc', 'script', 'metadata', 'symbol', 'stop']);
  const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
  const geo = new WeakMap();

  function attrs(n, names) { return names.map(a => num(n.getAttribute(a))); }
  function pathOf(n, tag) {
    let key, build;
    if (tag === 'path') { key = n.getAttribute('d') || ''; build = () => new Path2D(key); }
    else if (tag === 'rect') {
      const [x, y, w, h, rx] = attrs(n, ['x', 'y', 'width', 'height', 'rx']); key = x + ',' + y + ',' + w + ',' + h + ',' + rx;
      build = () => { const p = new Path2D(); if (rx > 0 && p.roundRect) p.roundRect(x, y, w, h, rx); else p.rect(x, y, w, h); return p; };
    } else if (tag === 'circle') {
      const [cx, cy, r] = attrs(n, ['cx', 'cy', 'r']); key = cx + ',' + cy + ',' + r;
      build = () => { const p = new Path2D(); p.arc(cx, cy, Math.max(0, r), 0, 6.2832); return p; };
    } else if (tag === 'ellipse') {
      const [cx, cy, rx, ry] = attrs(n, ['cx', 'cy', 'rx', 'ry']); key = cx + ',' + cy + ',' + rx + ',' + ry;
      build = () => { const p = new Path2D(); p.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), 0, 0, 6.2832); return p; };
    } else if (tag === 'polygon' || tag === 'polyline') {
      key = n.getAttribute('points') || '';
      build = () => { const v = key.trim().split(/[\s,]+/).map(parseFloat), p = new Path2D(); for (let i = 0; i + 1 < v.length; i += 2) i ? p.lineTo(v[i], v[i + 1]) : p.moveTo(v[i], v[i + 1]); if (tag === 'polygon') p.closePath(); return p; };
    } else if (tag === 'line') {
      const [x1, y1, x2, y2] = attrs(n, ['x1', 'y1', 'x2', 'y2']); key = x1 + ',' + y1 + ',' + x2 + ',' + y2;
      build = () => { const p = new Path2D(); p.moveTo(x1, y1); p.lineTo(x2, y2); return p; };
    } else return null;
    let c = geo.get(n);
    if (!c || c.key !== key) { c = { key, path: build(), bbox: undefined }; geo.set(n, c); }
    return c;
  }
  function bboxOf(n, c) {
    if (c.bbox === undefined) { try { const b = n.getBBox(); c.bbox = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch (e) { c.bbox = null; } }
    return c.bbox;
  }

  function rgba(col, op) {
    const m = /rgba?\(([^)]+)\)/.exec(col); if (!m) return col;
    const p = m[1].split(',').map(parseFloat); return `rgba(${p[0]},${p[1]},${p[2]},${((p.length > 3 ? p[3] : 1) * op).toFixed(3)})`;
  }
  function gradStops(g, P) {
    let s = P.gradCache.get(g);
    if (!s) {
      s = [...g.querySelectorAll('stop')].map(st => {
        const o = st.getAttribute('offset') || '0', cs = getComputedStyle(st);
        return [Math.min(1, Math.max(0, o.endsWith('%') ? num(o) / 100 : num(o))), rgba(cs.stopColor, num(cs.stopOpacity, 1))];
      });
      P.gradCache.set(g, s);
    }
    return s;
  }
  const frac = (v, d) => { if (v == null || v === '') return d; return v.endsWith('%') ? num(v) / 100 : num(v); };
  function fillGradient(ctx, url, path, c, n, P, rule) {
    const id = (/#([^"')\s]+)/.exec(url) || [])[1], g = id && document.getElementById(id);
    if (!g) return false;
    const stops = gradStops(g, P); if (!stops.length) return false;
    const tag = g.localName, user = g.getAttribute('gradientUnits') === 'userSpaceOnUse';
    let b = null;
    if (!user) { b = bboxOf(n, c); if (!b || b.w <= 0 || b.h <= 0) { ctx.fillStyle = stops[Math.floor(stops.length / 2)][1]; ctx.fill(path, rule); return true; } }
    const mk = (u) => {
      let gr;
      if (tag === 'lineargradient') {
        const d = u ? 0 : 0; gr = ctx.createLinearGradient(frac(g.getAttribute('x1'), 0), frac(g.getAttribute('y1'), 0), frac(g.getAttribute('x2'), 1), frac(g.getAttribute('y2'), 0));
      } else {
        const cx = frac(g.getAttribute('cx'), .5), cy = frac(g.getAttribute('cy'), .5), r = frac(g.getAttribute('r'), .5);
        gr = ctx.createRadialGradient(frac(g.getAttribute('fx'), cx), frac(g.getAttribute('fy'), cy), 0, cx, cy, r);
      }
      for (const [o, col] of stops) gr.addColorStop(o, col);
      return gr;
    };
    if (user) { ctx.fillStyle = mk(true); ctx.fill(path, rule); return true; }
    ctx.save();
    ctx.translate(b.x, b.y); ctx.scale(b.w, b.h);
    const inv = new Path2D(); inv.addPath(path, new DOMMatrix([1 / b.w, 0, 0, 1 / b.h, -b.x / b.w, -b.y / b.h]));
    ctx.fillStyle = mk(false); ctx.fill(inv, rule);
    ctx.restore();
    return true;
  }

  function cssTransform(ctx, cs) {
    const tr = cs.transform; if (!tr || tr === 'none') return;
    const m = new DOMMatrix(tr), o = (cs.transformOrigin || '0 0').split(/\s+/), ox = num(o[0]), oy = num(o[1]);
    ctx.translate(ox, oy); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); ctx.translate(-ox, -oy);
  }
  function place(ctx, n, cs, svg, tag) {
    if (svg && tag !== 'svg') {
      const tl = n.transform && n.transform.baseVal;
      if (tl && tl.numberOfItems > 0) { for (let i = 0; i < tl.numberOfItems; i++) { const m = tl.getItem(i).matrix; ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); } }
      else cssTransform(ctx, cs);
      return;
    }
    if (cs.position === 'absolute') ctx.translate(num(cs.left), num(cs.top));
    cssTransform(ctx, cs);
    if (svg) {
      const vb = n.viewBox && n.viewBox.baseVal, w = num(cs.width), h = num(cs.height);
      if (vb && vb.width > 0 && vb.height > 0 && w > 0 && h > 0) {
        const s = Math.min(w / vb.width, h / vb.height);
        ctx.translate((w - vb.width * s) / 2 - vb.x * s, (h - vb.height * s) / 2 - vb.y * s); ctx.scale(s, s);
      }
    }
  }
  function clipTo(ctx, cp) {
    const id = (/#([^"')\s]+)/.exec(cp) || [])[1], el = id && document.getElementById(id); if (!el) return;
    const p = new Path2D(); let rule = 'nonzero';
    for (const ch of el.children) {
      const c = pathOf(ch, ch.localName.toLowerCase()); if (!c) continue;
      p.addPath(c.path); if (getComputedStyle(ch).clipRule === 'evenodd') rule = 'evenodd';
    }
    ctx.clip(p, rule);
  }

  function paint(ctx, n, tag, cs, a, P) {
    const c = pathOf(n, tag); if (!c || cs.visibility === 'hidden') return;
    const rule = cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero', fill = cs.fill;
    if (fill && fill !== 'none') {
      ctx.globalAlpha = a * num(cs.fillOpacity, 1);
      if (fill.startsWith('url(')) fillGradient(ctx, fill, c.path, c, n, P, rule);
      else { ctx.fillStyle = fill; ctx.fill(c.path, rule); }
    }
    const stroke = cs.stroke;
    if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) {
      const w = num(cs.strokeWidth); if (!(w > 0)) return;
      const t = ctx.getTransform(), sc = Math.hypot(t.a, t.b) || 1;
      ctx.globalAlpha = a * num(cs.strokeOpacity, 1);
      ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(w, 1 / sc);       // never thinner than one art pixel
      ctx.lineJoin = cs.strokeLinejoin === 'miter' ? 'miter' : (cs.strokeLinejoin || 'miter'); ctx.lineCap = cs.strokeLinecap || 'butt';
      const da = cs.strokeDasharray; ctx.setLineDash(da && da !== 'none' ? da.split(/[\s,]+/).map(parseFloat).filter(v => v >= 0) : []);
      ctx.stroke(c.path); ctx.setLineDash([]);
    }
  }
  function paintText(ctx, n, cs, a) {
    if (cs.visibility === 'hidden') return;
    const x = num(n.getAttribute('x')), y = num(n.getAttribute('y')), txt = n.textContent;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; ctx.textAlign = cs.textAnchor === 'middle' ? 'center' : cs.textAnchor === 'end' ? 'right' : 'left';
    const sw = num(cs.strokeWidth);
    if (cs.stroke !== 'none' && sw > 0) { ctx.globalAlpha = a; ctx.strokeStyle = cs.stroke; ctx.lineWidth = sw; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y); }
    if (cs.fill !== 'none') { ctx.globalAlpha = a * num(cs.fillOpacity, 1); ctx.fillStyle = cs.fill; ctx.fillText(txt, x, y); }
  }

  function drawNode(ctx, n, alpha, P) {
    if (n.nodeType !== 1) return;
    const svg = n instanceof SVGElement, tag = svg ? n.localName.toLowerCase() : n.localName;
    if (svg && SKIP.has(tag)) return;
    const cs = getComputedStyle(n);
    if (cs.display === 'none') return;
    const o = num(cs.opacity, 1), a = alpha * o;
    if (a < .004) return;
    ctx.save();
    place(ctx, n, cs, svg, tag);
    const cp = cs.clipPath; if (cp && cp.startsWith('url')) clipTo(ctx, cp);
    const fl = cs.filter;
    if (fl && fl !== 'none') { const m = /brightness\(([\d.]+)\)/.exec(fl); if (m && (+m[1] < .96 || +m[1] > 1.12)) { try { ctx.filter = fl; } catch (e) { /* not supported */ } } }

    if (!svg) {
      if (tag === 'canvas') {
        ctx.globalAlpha = a; ctx.imageSmoothingEnabled = true;
        const w = num(cs.width), h = num(cs.height); ctx.drawImage(n, 0, 0, w, h); ctx.drawImage(n, 0, 0, w, h);   // twice: keeps thin / faint marks alive
      } else {
        const mode = n.getAttribute('data-px');
        if (mode === 'glow') {
          const w = num(cs.width), h = num(cs.height), g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.48, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        } else if (mode === 'vignette' && n._pxVig) {
          const v = n._pxVig, g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.r2);
          g.addColorStop(0, `rgba(0,0,0,${v.cA})`); g.addColorStop(Math.min(.99, v.r1 / v.r2), `rgba(0,0,0,${v.cA})`); g.addColorStop(1, `rgba(0,0,0,${v.eA})`);
          ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(-4000, -4000, 8000, 8000);
        }
        for (const ch of n.children) drawNode(ctx, ch, a, P);
      }
    } else if (tag === 'g' || tag === 'svg' || tag === 'a') {
      for (const ch of n.children) drawNode(ctx, ch, a, P);
    } else if (tag === 'use') {
      const href = n.href && n.href.baseVal, ref = href && document.getElementById(href.slice(1));
      if (ref && cs.visibility !== 'hidden') { ctx.translate(num(n.getAttribute('x')), num(n.getAttribute('y'))); drawNode(ctx, ref, a, P); }
    } else if (tag === 'text') paintText(ctx, n, cs, a);
    else paint(ctx, n, tag, cs, a, P);
    ctx.restore();
  }

  /* ---------- the Pixel object ---------- */
  function Pixel(root, opts) {
    this.root = root;
    this.opts = Object.assign({ target: 170, fps: 30, dither: 11, bg: null }, opts || {});
    this.overlays = []; this.last = 0; this.gradCache = new Map();
    // move the scene art into a hidden wrapper (still laid out and animating, just not visible)
    this.wrap = document.createElement('div'); this.wrap.className = 'pxwrap';
    [...root.children].forEach(c => { if (!c.hasAttribute('data-px-ui')) this.wrap.appendChild(c); });
    root.insertBefore(this.wrap, root.firstChild);
    this.out = document.createElement('canvas'); this.out.className = 'pxcanvas'; root.insertBefore(this.out, this.wrap.nextSibling);
    this.work = document.createElement('canvas');
    this.octx = this.out.getContext('2d'); this.wctx = this.work.getContext('2d', { willReadFrequently: true });
    this.fit();
    this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(root);
  }
  Pixel.prototype.fit = function () {
    const W = this.root.clientWidth, H = this.root.clientHeight; if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3), k = Math.max(2, Math.round(W * dpr / this.opts.target));
    this.k = k / dpr;                                            // CSS px per art pixel (k device pixels)
    this.bw = Math.ceil(W / this.k); this.bh = Math.ceil(H / this.k);
    this.out.width = this.bw; this.out.height = this.bh; this.work.width = this.bw * 2; this.work.height = this.bh * 2;
    this.out.style.width = (this.bw * this.k) + 'px'; this.out.style.height = (this.bh * this.k) + 'px';
    this.img = this.octx.createImageData(this.bw, this.bh);
    this.last = 0;
  };
  Pixel.prototype.bgColor = function () {
    if (this.opts.bg) return this.opts.bg;
    let e = this.root;
    while (e) { const c = getComputedStyle(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; e = e.parentElement; }
    return '#e2e2e2';
  };
  Pixel.prototype.render = function (now) {
    if (!this.bw) return;
    // adaptive: never spend more than ~60% of a frame budget here, so slow phones drop to ~30 fps art instead of stuttering
    if (now - this.last < Math.max(this.opts.fps ? 1000 / this.opts.fps - 3 : 0, (this.cost || 0) * 1.6)) return;
    this.last = now;
    const tStart = performance.now();
    const w2 = this.work.width, h2 = this.work.height, ctx = this.wctx;
    this.gradCache.clear();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = this.bgColor(); ctx.fillRect(0, 0, w2, h2);
    const s = 2 / this.k; ctx.setTransform(s, 0, 0, s, 0, 0);
    for (const c of this.wrap.children) drawNode(ctx, c, 1, this);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // sample one sub-pixel per art pixel (keeps edges crisp), dither, snap to the palette
    const src = ctx.getImageData(0, 0, w2, h2).data, dst = this.img.data, bw = this.bw, bh = this.bh, dith = this.opts.dither;
    let o = 0;
    for (let y = 0; y < bh; y++) {
      const row = (y * 2 + 1) * w2;
      for (let x = 0; x < bw; x++, o += 4) {
        const i = (row + x * 2 + 1) * 4, d = BAYER[((y & 3) << 2) | (x & 3)] * dith;
        let r = src[i] + d, g = src[i + 1] + d, b = src[i + 2] + d;
        r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
        const p = PAL[snap(r | 0, g | 0, b | 0)];
        dst[o] = p[0]; dst[o + 1] = p[1]; dst[o + 2] = p[2]; dst[o + 3] = 255;
      }
    }
    this.octx.putImageData(this.img, 0, 0);
    const info = { k: this.k, w: bw, h: bh };
    for (const f of this.overlays) f(this.octx, info);
    const dur = performance.now() - tStart; this.cost = this.cost ? this.cost * .85 + dur * .15 : dur;
  };
  Pixel.prototype.destroy = function () { this.ro.disconnect(); };

  Seq.Pixel = Pixel;
})();
