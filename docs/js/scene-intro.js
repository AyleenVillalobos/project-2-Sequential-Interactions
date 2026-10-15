/* Opening — a rainy night. A tuxedo cat on a second-floor balcony drops a love letter to a
   mouse on the sidewalk below.

   Cutscene order: tap to begin (this also unlocks sound) -> the mouse comes out of the drain
   tunnel -> it hears muffled meows from above and question marks appear -> the cat opens its
   mouth and the letter flutters down -> the mouse picks it up (camera closes in: "Got it!") ->
   the cat meows again -> the mouse carries the letter back into the tunnel. */
Seq.scenes.intro = (root, done) => {
  root.classList.add('sc-night');

  /* ---------- world layout (units; the wall base is y = 0, up is negative) ---------- */
  const TUN_X = -140, TUN_Y = 6, WALK_Y = 28;        // tunnel mouth, its floor, the mouse's walking line
  const CAT_X = 58, SLAB_Y = -250, CAT_Y = SLAB_Y - 8, CAT_S = .95;   // the cat is small and chonky
  const MK = .85;                                                    // mouse art scale
  const LAND_X = 16, STOP_X = -26;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const easeOut = u => 1 - Math.pow(1 - u, 3);
  const easeOutBack = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const spring = v => ({ v, vel: 0 });
  function stepS(sp, target, k, d, dt) { sp.vel += (-k * (sp.v - target) - d * sp.vel) * dt; sp.v += sp.vel * dt; }
  function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, RM = reduce ? .4 : 1;
  const f2 = n => n.toFixed(2);

  /* ---------- stars (seeded, so they never jump around) ---------- */
  const R = rng(7), stars = [];
  for (let i = 0; i < 110; i++) {
    const x = -260 + R() * 520, y = -980 + R() * 520, r = .7 + R() * 1.5, d = (R() * 4).toFixed(1), du = (2.4 + R() * 3).toFixed(1);
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" class="twk" style="animation-delay:-${d}s;animation-duration:${du}s"/>`);
  }
  for (let i = 0; i < 9; i++) {
    const x = -230 + R() * 460, y = -900 + R() * 380, s = 3 + R() * 3.2, d = (R() * 4).toFixed(1);
    stars.push(`<path d="M${x} ${y - s * 2} Q${x} ${y} ${x + s * 2} ${y} Q${x} ${y} ${x} ${y + s * 2} Q${x} ${y} ${x - s * 2} ${y} Q${x} ${y} ${x} ${y - s * 2}Z" fill="#fff6d8" class="twk" style="animation-delay:-${d}s;animation-duration:3.4s"/>`);
  }

  /* ---------- siding / stone / voussoir details ---------- */
  let vouss = '';
  for (let a = 180; a <= 360; a += 22.5) {
    const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    vouss += `<path d="M${f2(c * 28)} ${f2(-30 + s * 28)} L${f2(c * 44)} ${f2(-30 + s * 44)}" stroke="rgba(10,6,30,.55)" stroke-width="1.6"/>`;
  }
  let bars = '';
  for (let x = -44; x <= 160; x += 11.2) bars += `<rect x="${x}" y="-282" width="3.6" height="30" rx="1" fill="url(#nBaluster)"/>`;
  let joints = '';
  for (let x = -380; x <= 380; x += 96) joints += `<path d="M${x} 0 L${x - 14} 50" stroke="rgba(10,6,30,.45)" stroke-width="1.4"/>`;

  root.innerHTML = `
  <svg class="scene-svg" xmlns="http://www.w3.org/2000/svg" role="img"
       aria-label="A rainy night. A black and white cat on a second-floor balcony holds a love letter in its mouth. A mouse waits on the sidewalk below.">
    <defs>
      <linearGradient id="nSky" gradientUnits="userSpaceOnUse" x1="0" y1="-1100" x2="0" y2="-470">
        <stop offset="0" stop-color="#0b0624"/><stop offset=".55" stop-color="#1d1049"/><stop offset="1" stop-color="#3d2678"/>
      </linearGradient>
      <radialGradient id="nHorizon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9a62c8" stop-opacity=".55"/><stop offset="1" stop-color="#9a62c8" stop-opacity="0"/></radialGradient>
      <linearGradient id="nWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2256"/><stop offset="1" stop-color="#1d1745"/></linearGradient>
      <pattern id="nSiding" width="12" height="14" patternUnits="userSpaceOnUse"><rect width="12" height="14" fill="none"/><path d="M0 13.2 H12" stroke="rgba(8,4,28,.35)" stroke-width="1.6"/><path d="M0 .6 H12" stroke="rgba(255,255,255,.035)" stroke-width="1"/></pattern>
      <radialGradient id="nWarm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".85"/><stop offset=".5" stop-color="#ffb35c" stop-opacity=".25"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
      <linearGradient id="nGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#f3a35a"/></linearGradient>
      <linearGradient id="nGlassDim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c887"/><stop offset="1" stop-color="#c9884e"/></linearGradient>
      <linearGradient id="nSlab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4f92"/><stop offset="1" stop-color="#2f2862"/></linearGradient>
      <linearGradient id="nUnder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05020f" stop-opacity=".55"/><stop offset="1" stop-color="#05020f" stop-opacity="0"/></linearGradient>
      <linearGradient id="nBaluster" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a5fa8"/><stop offset=".5" stop-color="#2a2358"/><stop offset="1" stop-color="#150f35"/></linearGradient>
      <linearGradient id="nWalk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4678"/><stop offset="1" stop-color="#383363"/></linearGradient>
      <linearGradient id="nRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#201b40"/><stop offset="1" stop-color="#120e2a"/></linearGradient>
      <linearGradient id="nReflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc16a" stop-opacity=".30"/><stop offset="1" stop-color="#ffc16a" stop-opacity="0"/></linearGradient>
      <linearGradient id="nStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e679c"/><stop offset="1" stop-color="#453f74"/></linearGradient>
      <linearGradient id="nTunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05020f"/><stop offset="1" stop-color="#171034"/></linearGradient>
      <radialGradient id="nPuddle" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7c63c4" stop-opacity=".55"/><stop offset="1" stop-color="#5d4aa0" stop-opacity=".25"/></radialGradient>

      <!-- tuxedo cat -->
      <radialGradient id="nCatBlack" cx=".35" cy=".25" r=".85"><stop offset="0" stop-color="#4a4a58"/><stop offset=".45" stop-color="#1c1c25"/><stop offset="1" stop-color="#07070b"/></radialGradient>
      <radialGradient id="nCatHead" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#4d4d5c"/><stop offset=".5" stop-color="#1e1e27"/><stop offset="1" stop-color="#08080c"/></radialGradient>
      <radialGradient id="nCatWhite" cx=".42" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ebedf7"/><stop offset="1" stop-color="#aeb2c9"/></radialGradient>
      <radialGradient id="nCatEye" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#f2ee8a"/><stop offset=".55" stop-color="#a6d65c"/><stop offset="1" stop-color="#3f8c3c"/></radialGradient>
      <radialGradient id="nEar" cx=".5" cy=".8" r=".8"><stop offset="0" stop-color="#e89bb0"/><stop offset="1" stop-color="#9c5b79"/></radialGradient>
      <linearGradient id="nCatTail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#15151c"/><stop offset="1" stop-color="#30303c"/></linearGradient>
      <radialGradient id="nSheen" cx=".3" cy=".18" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>

      <!-- mouse -->
      <radialGradient id="nMouse" cx=".38" cy=".25" r=".85"><stop offset="0" stop-color="#d4cdd9"/><stop offset=".5" stop-color="#9d96a8"/><stop offset="1" stop-color="#5d566b"/></radialGradient>
      <radialGradient id="nMouseHead" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ddd6e2"/><stop offset=".55" stop-color="#a8a1b3"/><stop offset="1" stop-color="#6a6378"/></radialGradient>
      <linearGradient id="nLeg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b3acbd"/><stop offset="1" stop-color="#6f6880"/></linearGradient>
      <radialGradient id="nMouseEar" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#f1b4c6"/><stop offset="1" stop-color="#c47d96"/></radialGradient>

      <clipPath id="nHoleClip"><path d="M${TUN_X - 28} ${TUN_Y} V-30 A28 28 0 0 1 ${TUN_X + 28} -30 V${TUN_Y} Z"/></clipPath>
    </defs>

    <g class="world">
      <!-- sky -->
      <rect x="-2400" y="-2600" width="4800" height="2400" fill="url(#nSky)"/>
      <ellipse cx="0" cy="-470" rx="700" ry="240" fill="url(#nHorizon)"/>
      <g class="stars">${stars.join('')}</g>
      <g class="moon">
        <circle cx="-132" cy="-612" r="40" fill="#b9a3ff" opacity=".1"/>
        <mask id="nMoonMask"><rect x="-200" y="-680" width="140" height="140" fill="#000"/><circle cx="-132" cy="-612" r="22" fill="#fff"/><circle cx="-121" cy="-620" r="20" fill="#000"/></mask>
        <circle cx="-132" cy="-612" r="22" fill="#f1e9ff" mask="url(#nMoonMask)"/>
      </g>
      <g class="clouds">
        <g class="cloud" data-s="9" data-a="22"><ellipse cx="-60" cy="-640" rx="120" ry="22" fill="#2b1a63" opacity=".55"/><ellipse cx="-10" cy="-652" rx="80" ry="20" fill="#34207a" opacity=".5"/></g>
        <g class="cloud" data-s="12" data-a="-30"><ellipse cx="150" cy="-760" rx="150" ry="26" fill="#2b1a63" opacity=".5"/><ellipse cx="90" cy="-772" rx="90" ry="22" fill="#3a2480" opacity=".45"/></g>
        <g class="cloud" data-s="15" data-a="26"><ellipse cx="-150" cy="-830" rx="170" ry="28" fill="#2b1a63" opacity=".45"/></g>
      </g>

      <!-- house -->
      <g class="house">
        <rect x="-320" y="-486" width="640" height="486" fill="url(#nWall)"/>
        <rect x="-320" y="-486" width="640" height="486" fill="url(#nSiding)"/>
        <!-- roof -->
        <polygon points="-340,-474 -70,-566 70,-566 340,-474" fill="#120b2b"/>
        <polygon points="-340,-474 -70,-566 -60,-562 -326,-474" fill="#241a4d" opacity=".7"/>
        <path d="M-300 -492 L-90 -560 M-240 -480 L-110 -526 M240 -480 L110 -526 M300 -492 L90 -560" stroke="rgba(255,255,255,.05)" stroke-width="1.4"/>
        <rect x="150" y="-566" width="40" height="86" fill="#1a1238"/><rect x="146" y="-572" width="48" height="9" fill="#2b2056"/>
        <rect x="-330" y="-478" width="660" height="14" fill="#171034"/>
        <rect x="-330" y="-466" width="660" height="3" fill="#05020f" opacity=".55"/>
        <!-- downpipe -->
        <rect x="216" y="-466" width="9" height="466" fill="#241c52"/><rect x="216" y="-466" width="2.5" height="466" fill="rgba(255,255,255,.12)"/>

        <!-- window glow on the wall -->
        <ellipse cx="58" cy="-340" rx="170" ry="150" fill="url(#nWarm)" opacity=".55"/>
        <!-- upper left window -->
        <rect x="-214" y="-408" width="86" height="104" rx="3" fill="#170f38"/>
        <rect x="-208" y="-402" width="74" height="92" fill="url(#nGlassDim)"/>
        <path d="M-171 -402 V-310 M-208 -356 H-134" stroke="#170f38" stroke-width="4"/>
        <path d="M-208 -402 H-134 L-208 -340Z" fill="#fff" opacity=".06"/>
        <rect x="-220" y="-304" width="98" height="7" fill="#2a2058"/>
        <!-- upper right window (dark) -->
        <rect x="178" y="-408" width="86" height="104" rx="3" fill="#170f38"/>
        <rect x="184" y="-402" width="74" height="92" fill="#120b2c"/>
        <path d="M221 -402 V-310 M184 -356 H258" stroke="#170f38" stroke-width="4"/>
        <path d="M184 -402 H258 L184 -340Z" fill="#8a76d8" opacity=".12"/>
        <rect x="172" y="-304" width="98" height="7" fill="#2a2058"/>

        <!-- balcony door (lit from inside) -->
        <rect x="2" y="-446" width="112" height="196" rx="4" fill="#170f38"/>
        <rect x="9" y="-439" width="98" height="189" fill="url(#nGlass)"/>
        <path d="M58 -439 V-250 M9 -400 H107 M9 -330 H107" stroke="#170f38" stroke-width="4.5"/>
        <path d="M9 -439 H20 V-250 H9Z M96 -439 H107 V-250 H96Z" fill="#3a1f55" opacity=".6"/>
        <path d="M9 -439 L58 -439 L9 -330Z" fill="#fff" opacity=".12"/>

        <!-- balcony slab + shadow under it -->
        <rect x="-56" y="-236" width="228" height="48" fill="url(#nUnder)"/>
        <rect x="-56" y="-250" width="228" height="15" rx="2" fill="url(#nSlab)"/>
        <rect x="-56" y="-250" width="228" height="2.5" fill="rgba(255,255,255,.22)"/>
        <path d="M-30 -235 L-30 -212 L-8 -235Z M138 -235 L138 -212 L116 -235Z" fill="#2a2358"/>

        <!-- first floor -->
        <rect x="-82" y="-170" width="64" height="170" rx="3" fill="#150e32"/>
        <rect x="-74" y="-162" width="48" height="162" fill="#251a52"/>
        <rect x="-68" y="-152" width="36" height="42" fill="#1a1240"/>
        <circle cx="-34" cy="-70" r="3" fill="#d8bf7a"/>
        <rect x="76" y="-176" width="104" height="94" rx="3" fill="#170f38"/>
        <rect x="82" y="-170" width="92" height="82" fill="url(#nGlassDim)" opacity=".9"/>
        <path d="M128 -170 V-88 M82 -129 H174" stroke="#170f38" stroke-width="4"/>
        <rect x="70" y="-82" width="116" height="7" fill="#2a2058"/>
        <rect x="-320" y="-24" width="640" height="24" fill="#241c52"/>
        <path d="M-320 -24 H320" stroke="rgba(255,255,255,.07)" stroke-width="2"/>
      </g>

      <!-- the cat: small, chonky, tuxedo -->
      <g class="cat" transform="translate(${CAT_X} ${CAT_Y}) scale(${CAT_S})">
        <ellipse cx="0" cy="3" rx="60" ry="7" fill="rgba(5,2,15,.5)"/>
        <g class="cTail">
          <path d="M40 -8 C 68 -8 78 -34 62 -46" fill="none" stroke="url(#nCatTail)" stroke-width="14" stroke-linecap="round"/>
          <path d="M40 -12 C 64 -12 72 -32 60 -43" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3" stroke-linecap="round"/>
        </g>
        <g class="cBody">
          <ellipse cx="-37" cy="-15" rx="17" ry="15" fill="url(#nCatBlack)"/>
          <ellipse cx="37" cy="-15" rx="17" ry="15" fill="url(#nCatBlack)"/>
          <ellipse cx="0" cy="-32" rx="47" ry="35" fill="url(#nCatBlack)"/>
          <ellipse cx="-22" cy="-50" rx="20" ry="11" fill="url(#nSheen)"/>
          <ellipse cx="0" cy="-26" rx="27" ry="26" fill="url(#nCatWhite)"/>
          <path d="M-20 -40 q-3 5 0 9 M3 -43 q3 6 0 11 M19 -36 q-3 5 -1 9" fill="none" stroke="rgba(120,125,170,.28)" stroke-width="1.3" stroke-linecap="round"/>
          <ellipse cx="-45" cy="-4" rx="10" ry="5.5" fill="url(#nCatWhite)"/><ellipse cx="45" cy="-4" rx="10" ry="5.5" fill="url(#nCatWhite)"/>
          <ellipse cx="-14" cy="-6" rx="12.5" ry="8.5" fill="url(#nCatWhite)"/><ellipse cx="14" cy="-6" rx="12.5" ry="8.5" fill="url(#nCatWhite)"/>
          <path d="M-18 -2 V-8 M-11 -2 V-8 M11 -2 V-8 M18 -2 V-8" stroke="rgba(90,95,140,.4)" stroke-width="1.2" stroke-linecap="round"/>
        </g>
        <g class="cHead" transform="translate(0 -76)">
          <path d="M-37 -8 Q-44 -38 -27 -44 Q-14 -36 -10 -25Z" fill="url(#nCatHead)"/>
          <path d="M37 -8 Q44 -38 27 -44 Q14 -36 10 -25Z" fill="url(#nCatHead)"/>
          <path d="M-32 -13 Q-36 -33 -27 -37 Q-19 -32 -16 -25Z" fill="url(#nEar)"/>
          <path d="M32 -13 Q36 -33 27 -37 Q19 -32 16 -25Z" fill="url(#nEar)"/>
          <ellipse cx="0" cy="0" rx="42" ry="34" fill="url(#nCatHead)"/>
          <ellipse cx="-31" cy="10" rx="13" ry="11" fill="url(#nCatHead)"/><ellipse cx="31" cy="10" rx="13" ry="11" fill="url(#nCatHead)"/>
          <ellipse cx="-12" cy="-16" rx="24" ry="11" fill="url(#nSheen)"/>
          <path d="M-4.5 -27 Q0 -33 4.5 -27 L7.5 -5 L-7.5 -5Z" fill="url(#nCatWhite)"/>
          <ellipse cx="-9.5" cy="10" rx="12.5" ry="10.5" fill="url(#nCatWhite)"/><ellipse cx="9.5" cy="10" rx="12.5" ry="10.5" fill="url(#nCatWhite)"/>
          <ellipse cx="0" cy="19" rx="10" ry="7" fill="url(#nCatWhite)"/>
          <path d="M-38 12 L-47 14 L-39 18 L-45 23 L-35 21Z M38 12 L47 14 L39 18 L45 23 L35 21Z" fill="url(#nCatWhite)"/>
          <ellipse cx="-27" cy="7" rx="7.5" ry="4.4" fill="#ff8fae" opacity=".5"/><ellipse cx="27" cy="7" rx="7.5" ry="4.4" fill="#ff8fae" opacity=".5"/>
          <g class="cEyeL" transform="translate(-17 -3)"><g class="cEyeScale"><ellipse rx="10" ry="11" fill="#101a12"/><ellipse rx="8.6" ry="9.6" fill="url(#nCatEye)"/><ellipse class="cPupil" rx="5.6" ry="7" fill="#06070a"/><circle cx="-3.2" cy="-3.8" r="3.1" fill="#fff"/><circle cx="3.4" cy="3.6" r="1.5" fill="#fff" opacity=".9"/></g></g>
          <g class="cEyeR" transform="translate(17 -3)"><g class="cEyeScale"><ellipse rx="10" ry="11" fill="#101a12"/><ellipse rx="8.6" ry="9.6" fill="url(#nCatEye)"/><ellipse class="cPupil" rx="5.6" ry="7" fill="#06070a"/><circle cx="-3.2" cy="-3.8" r="3.1" fill="#fff"/><circle cx="3.4" cy="3.6" r="1.5" fill="#fff" opacity=".9"/></g></g>
          <path d="M-3.6 6.5 Q0 4.2 3.6 6.5 Q2.7 11 0 12 Q-2.7 11 -3.6 6.5Z" fill="#f09bb0"/>
          <path class="cMouthShut" d="M0 12 Q-2.6 17 -7.5 14 M0 12 Q2.6 17 7.5 14" fill="none" stroke="#4a2c3a" stroke-width="1.5" stroke-linecap="round"/>
          <g class="cMouthOpen" opacity="0">
            <path d="M-8 14 Q0 11.5 8 14 Q8 28 0 29 Q-8 28 -8 14Z" fill="#4a0f2a"/>
            <path d="M-4.6 25 Q0 20 4.6 25 Q3.6 29 0 29 Q-3.6 29 -4.6 25Z" fill="#ec7f96"/>
          </g>
          <g class="cLetter"><g transform="translate(0 22) rotate(-6) scale(.2) translate(-80 -55)"><use href="#letterArt"/></g>
            <path d="M-9 25 Q0 33 9 25 Q7.5 32 0 33 Q-7.5 32 -9 25Z" fill="url(#nCatWhite)"/></g>
          <g stroke="rgba(235,235,255,.6)" stroke-width="1" stroke-linecap="round" fill="none">
            <path d="M-26 10 Q-38 6 -52 8 M-26 14 Q-39 14 -52 19"/><path d="M26 10 Q38 6 52 8 M26 14 Q39 14 52 19"/>
          </g>
        </g>
      </g>

      <!-- railing (in front of the cat) -->
      <g class="rail">
        <rect x="-50" y="-262" width="224" height="9" fill="#241c52"/>
        ${bars}
        <rect x="-54" y="-292" width="232" height="9" rx="2" fill="#3a3070"/>
        <rect x="-54" y="-292" width="232" height="2.4" rx="1" fill="rgba(255,255,255,.3)"/>
        <rect x="-56" y="-288" width="9" height="40" rx="2" fill="url(#nBaluster)"/>
        <rect x="165" y="-288" width="9" height="40" rx="2" fill="url(#nBaluster)"/>
        <rect x="-58" y="-296" width="13" height="7" rx="2" fill="#4a3f88"/><rect x="163" y="-296" width="13" height="7" rx="2" fill="#4a3f88"/>
        <path d="M-52 -290 H172" stroke="rgba(255,255,255,.14)" stroke-width="1.2"/>
      </g>

      <!-- sidewalk, curb, road -->
      <g class="street">
        <rect x="-2400" y="0" width="4800" height="50" fill="url(#nWalk)"/>
        <g>${joints}</g>
        <rect x="-2400" y="0" width="4800" height="3" fill="rgba(0,0,0,.35)"/>
        <rect x="0" y="0" width="130" height="50" fill="url(#nReflect)"/>
        <rect x="-70" y="0" width="52" height="50" fill="url(#nReflect)" opacity=".55"/>
        <rect x="-2400" y="50" width="4800" height="15" fill="#2a2552"/>
        <rect x="-2400" y="50" width="4800" height="2.4" fill="rgba(255,255,255,.2)"/>
        <rect x="-2400" y="65" width="4800" height="2400" fill="url(#nRoad)"/>
        <rect x="-2400" y="65" width="4800" height="3" fill="rgba(0,0,0,.4)"/>
        <path d="M-420 100 H420" stroke="rgba(255,235,190,.32)" stroke-width="3.5" stroke-dasharray="30 26"/>
        <ellipse cx="-30" cy="84" rx="64" ry="7" fill="url(#nPuddle)"/>
        <ellipse cx="150" cy="112" rx="80" ry="8" fill="url(#nPuddle)"/>
        <ellipse cx="86" cy="39" rx="46" ry="5" fill="url(#nPuddle)" opacity=".8"/>
        <path d="M-52 82 H-12 M130 110 H170 M70 38 H100" stroke="rgba(255,255,255,.3)" stroke-width="1.4" stroke-linecap="round"/>
      </g>

      <!-- tunnel (small culvert in the wall base) -->
      <g class="tunnel" transform="translate(${TUN_X} 0)">
        <ellipse cx="0" cy="36" rx="46" ry="7" fill="url(#nPuddle)"/>
        <path d="M-44 8 V-30 A44 44 0 0 1 44 -30 V8Z" fill="url(#nStone)"/>
        <path d="M-44 -30 A44 44 0 0 1 -30 -61" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
        <g transform="translate(0 0)">${vouss}</g>
        <path d="M-28 8 V-30 A28 28 0 0 1 28 -30 V8Z" fill="url(#nTunnel)"/>
        <path d="M-28 8 V-30 A28 28 0 0 1 28 -30" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="3"/>
        <path d="M-44 8 H44" stroke="rgba(0,0,0,.45)" stroke-width="3"/>
        <path d="M-20 9 Q-6 20 14 14 Q30 12 44 26" fill="none" stroke="rgba(160,140,230,.45)" stroke-width="2" stroke-linecap="round"/>
        <path class="trickle" d="M-12 10 Q-10 24 -18 34" fill="none" stroke="rgba(190,170,255,.5)" stroke-width="1.6" stroke-linecap="round"/>
      </g>

      <!-- mouse + letter, clipped to the tunnel while the mouse is inside it -->
      <ellipse class="mShadow" cx="0" cy="0" rx="30" ry="5" fill="rgba(5,2,15,.5)"/>
      <g class="mClip">
        <g class="mRoot">
          <g class="mSquash">
            <g class="mTail"><path d="M-27 -16 C-42 -14 -48 0 -62 -3 C-70 -5 -72 -14 -68 -20" fill="none" stroke="#e4a9b8" stroke-width="3" stroke-linecap="round"/></g>
            <g class="mLegBF"><g class="mLegS"><rect x="-3" y="0" width="6" height="14" rx="3" fill="#7a7389"/><ellipse cx="1.5" cy="14.5" rx="5.2" ry="2.8" fill="#d99aad"/></g></g>
            <g class="mBody">
              <g class="mLegFF"><g class="mLegS"><rect x="-3" y="0" width="6" height="14" rx="3" fill="#7a7389"/><ellipse cx="1.5" cy="14.5" rx="5.2" ry="2.8" fill="#d99aad"/></g></g>
              <ellipse cx="-5" cy="-19" rx="25" ry="18" fill="url(#nMouse)"/>
              <ellipse cx="-3" cy="-11" rx="19" ry="8" fill="#f1e9f1" opacity=".55"/>
              <path d="M-24 -29 Q-10 -40 6 -35" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-linecap="round"/>
              <g class="mLegFN"><g class="mLegS"><rect x="-3" y="0" width="6" height="14" rx="3" fill="url(#nLeg)"/><ellipse cx="1.5" cy="14.5" rx="5.2" ry="2.8" fill="#e8a9b9"/></g></g>
              <g class="mHead">
                <ellipse cx="33" cy="-22" rx="9" ry="6.4" fill="url(#nMouseHead)"/>
                <ellipse cx="19" cy="-26" rx="17.5" ry="15.5" fill="url(#nMouseHead)"/>
                <g class="mEar"><circle cx="8" cy="-41" r="11.5" fill="#8d869a"/><circle cx="8.5" cy="-40.5" r="8" fill="url(#nMouseEar)"/></g>
                <ellipse class="mEyeOpen" cx="25" cy="-29" rx="4.3" ry="5" fill="#0d0a14"/>
                <circle class="mEyeShine" cx="26.7" cy="-31.2" r="1.9" fill="#fff"/>
                <circle class="mEyeShine" cx="23.6" cy="-26.8" r=".9" fill="#fff" opacity=".85"/>
                <path class="mEyeHappy" d="M20.8 -28.5 Q25 -34.5 29.2 -28.5" fill="none" stroke="#0d0a14" stroke-width="1.9" stroke-linecap="round" opacity="0"/>
                <ellipse class="mBlush" cx="27.5" cy="-20.5" rx="4.6" ry="3" fill="#f58fae" opacity=".4"/>
                <circle cx="39.2" cy="-23" r="3.3" fill="#e9879f"/><circle cx="38.3" cy="-24" r="1" fill="#fff" opacity=".75"/>
                <path class="mSmile" d="M31.5 -16.5 Q36 -12.5 39.5 -17" fill="none" stroke="#3a2536" stroke-width="1.3" stroke-linecap="round" opacity="0"/>
                <g stroke="rgba(255,255,255,.6)" stroke-width=".9" stroke-linecap="round" fill="none"><path d="M36 -21 L50 -28 M37 -20 L52 -21 M36 -19 L50 -14"/></g>
              </g>
            </g>
            <g class="mLegBN"><g class="mLegS"><rect x="-3" y="0" width="6.4" height="14" rx="3" fill="url(#nLeg)"/><ellipse cx="1.8" cy="14.5" rx="5.6" ry="2.8" fill="#e8a9b9"/></g></g>
          </g>
        </g>
        <g class="letterW" visibility="hidden"><g class="letterG"><use href="#letterArt"/></g></g>
      </g>

      <!-- question marks, sparkles -->
      <g class="qm">
        <text class="q q0" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="800" font-size="28" fill="#ffe9a8" stroke="#2a1458" stroke-width="3" paint-order="stroke">?</text>
        <text class="q q1" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="800" font-size="22" fill="#ffe9a8" stroke="#2a1458" stroke-width="3" paint-order="stroke">?</text>
        <text class="q q2" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="800" font-size="25" fill="#ffe9a8" stroke="#2a1458" stroke-width="3" paint-order="stroke">?</text>
      </g>
      <g class="sparks"></g>
    </g>
  </svg>
  <canvas class="rain"></canvas>
  <div class="bubble">Got it!</div>
  <div class="hint">Tap to begin · sound on</div>`;

  const svg = root.querySelector('svg'), cvs = root.querySelector('canvas'), ctx = cvs.getContext('2d');
  const bubble = root.querySelector('.bubble'), hint = root.querySelector('.hint');
  const q = s => root.querySelector(s), qa = s => [...root.querySelectorAll(s)];
  const el = {
    world: q('.world'), cat: q('.cat'), cTail: q('.cTail'), cBody: q('.cBody'), cHead: q('.cHead'), cLetter: q('.cLetter'),
    cMouthShut: q('.cMouthShut'), cMouthOpen: q('.cMouthOpen'), cEyes: qa('.cEyeScale'), cPupils: qa('.cPupil'),
    mShadow: q('.mShadow'), mClip: q('.mClip'), mRoot: q('.mRoot'), mSquash: q('.mSquash'), mBody: q('.mBody'), mHead: q('.mHead'), mEar: q('.mEar'), mTail: q('.mTail'),
    legBN: q('.mLegBN'), legBF: q('.mLegBF'), legFN: q('.mLegFN'), legFF: q('.mLegFF'),
    eyeOpen: q('.mEyeOpen'), eyeShine: q('.mEyeShine'), eyeHappy: q('.mEyeHappy'), blush: q('.mBlush'), smile: q('.mSmile'),
    letterW: q('.letterW'), letterG: q('.letterG'), qs: qa('.q'), sparks: q('.sparks'), clouds: qa('.cloud'), trickle: q('.trickle')
  };
  const SP = [];
  for (let i = 0; i < 7; i++) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7Z'); p.setAttribute('fill', '#fff6c8'); p.setAttribute('opacity', '0'); el.sparks.appendChild(p); SP.push(p); }

  /* ---------- sound (shared context, this scene's own bus) ---------- */
  const AU = Seq.audio, out = Seq.sceneOut(.85);
  const ok = () => AU.ac && out.get();
  function tone(type, f0, f1, dur, vol, delay = 0, lp) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(.012, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = o; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    n.connect(g); g.connect(out.get()); o.start(t0); o.stop(t0 + dur + .03);
  }
  function noise(dur, vol, ftype, freq, qq = 1, delay = 0) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay, src = ac.createBufferSource(); src.buffer = AU.nbuf;
    const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = qq;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(f).connect(g).connect(out.get()); src.start(t0, Math.random() * .5, dur + .05);
  }
  /* a meow: a gliding saw through two vowel-like formants; "muffled" = the letter is in its mouth */
  function meow(pitch, dur, muffled, delay = 0) {
    if (!ok()) return; const ac = AU.ac, t0 = ac.currentTime + delay;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(pitch * .85, t0); o.frequency.linearRampToValueAtTime(pitch * 1.32, t0 + dur * .32); o.frequency.linearRampToValueAtTime(pitch * .72, t0 + dur);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5; vg.gain.value = pitch * .018; vib.connect(vg).connect(o.frequency);
    const mix = ac.createGain(), g = ac.createGain();
    const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
    f1.type = f2.type = 'bandpass'; f1.Q.value = 4; f2.Q.value = 6;
    f1.frequency.setValueAtTime(muffled ? 520 : 650, t0); f1.frequency.linearRampToValueAtTime(muffled ? 640 : 1000, t0 + dur * .4); f1.frequency.linearRampToValueAtTime(muffled ? 480 : 640, t0 + dur);
    f2.frequency.setValueAtTime(muffled ? 1200 : 1700, t0); f2.frequency.linearRampToValueAtTime(muffled ? 1500 : 2500, t0 + dur * .4); f2.frequency.linearRampToValueAtTime(muffled ? 1100 : 1800, t0 + dur);
    const peak = muffled ? .07 : .15;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + .05); g.gain.setValueAtTime(peak, t0 + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.gain.value = 1; mix.connect(g);
    if (muffled) { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; g.connect(lp); lp.connect(out.get()); } else g.connect(out.get());
    o.start(t0); vib.start(t0); o.stop(t0 + dur + .05); vib.stop(t0 + dur + .05);
  }
  const snd = {
    squeak() { tone('sine', 1900, 2700, .07, .035); tone('sine', 2300, 3000, .06, .022, .07); },
    patter() { noise(.04, .05, 'bandpass', 1800 + Math.random() * 500, 1.3); },
    splash() { noise(.1, .04, 'highpass', 2200); },
    hmm() { tone('sine', 420, 540, .16, .06, 0, 1400); tone('sine', 540, 700, .14, .05, .14, 1400); },
    rustle() { noise(.16, .1, 'bandpass', 3200, .8); noise(.1, .07, 'bandpass', 2400, .8, .09); },
    gotit() { tone('sine', 740, 1250, .1, .13); tone('sine', 988, 1568, .12, .11, .1); tone('sine', 1318, 2093, .22, .09, .2); },
    pop() { tone('sine', 380, 760, .08, .1); }
  };
  let rainNodes = null, dripT = 0, thunderT = 0;
  function drip() {
    if (!rainNodes) return;
    const f = 1500 + Math.random() * 1900; tone('sine', f, f * .55, .05, .03);
    if (Math.random() < .25) noise(.05, .03, 'bandpass', 3000, 2);
    dripT = setTimeout(drip, 110 + Math.random() * 380);
  }
  function thunder() {
    if (!ok() || !rainNodes) return; const ac = AU.ac, t0 = ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = AU.nbuf; src.playbackRate.value = .35;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t0); lp.frequency.exponentialRampToValueAtTime(70, t0 + 3);
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.3, t0 + .6); g.gain.exponentialRampToValueAtTime(.0001, t0 + 3.2);
    src.connect(lp).connect(g).connect(out.get()); src.start(t0, Math.random(), 3.4);
    thunderT = setTimeout(thunder, 9000 + Math.random() * 7000);
  }
  function rainStart() {
    if (!ok() || rainNodes) return; const ac = AU.ac;
    const src = ac.createBufferSource(); src.buffer = AU.nbuf; src.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.linearRampToValueAtTime(.2, ac.currentTime + 1.2);
    const src2 = ac.createBufferSource(); src2.buffer = AU.nbuf; src2.loop = true; src2.playbackRate.value = .5;
    const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 420;
    const g2 = ac.createGain(); g2.gain.value = .11;
    src.connect(hp).connect(lp).connect(g).connect(out.get()); src2.connect(lp2).connect(g2).connect(out.get());
    src.start(); src2.start(); rainNodes = [src, src2];
    drip(); thunderT = setTimeout(thunder, 5500);
  }

  /* ---------- camera ---------- */
  let W = 1, H = 1, z0 = 1, wide = { x: 0, y: 0, z: 1 };
  const cam = { x: spring(0), y: spring(0), z: spring(1) };
  function layout() {
    const r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    z0 = Math.min(W / 430, H / 760);
    wide = { x: 0, y: 122 - (H / 2) / z0, z: z0 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr); cvs.style.width = W + 'px'; cvs.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const toScreen = (wx, wy) => ({ x: (wx - cam.x.v) * cam.z.v + W / 2, y: (wy - cam.y.v) * cam.z.v + H / 2 });
  const closeCam = () => { const z = z0 * 2.35; return { x: M.x + 6, y: WALK_Y - .17 * H / z, z }; };

  /* ---------- actors ---------- */
  const M = { x: TUN_X - 4, y: TUN_Y, s: .55, face: 1, stand: 0, paws: 0, look: 0, v: 0, phase: 0, sq: 1, hop: 0, clip: true, dim: .5, happy: 0, ear: 0, held: false };
  const LET = { state: 'cat', x: 0, y: 0, rot: 0, sy: 1, s: .3, fallT: 0, x0: 0, y0: 0 };
  const C = { mew: 0, mewT: -9, kind: 'clear', tilt: 0, bob: 0, look: { x: -2, y: 3 }, blinkT: 2.2, lean: 0, letterIn: true, jig: 0 };
  const S = { sqv: spring(1) };
  let st = 'wait', stT = 0, t = 0, reported = false, lastStep = 0, ev = {};
  const setState = n => { st = n; stT = 0; ev = {}; };

  function headWorld() {
    const th = M.stand * 55 * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), px = 33, py = -26;
    const x = px * c + py * s, y = -px * s + py * c;
    return { x: M.x + M.face * (-14 + x) * M.s * MK, y: M.y + y * M.s * MK - M.hop };
  }
  function catMouth() { return { x: CAT_X, y: CAT_Y - (76 - 20) * CAT_S + C.bob * CAT_S }; }
  function catMeow(kind) { C.kind = kind; C.mewT = t; }

  /* ---------- input: only the first tap does anything ---------- */
  function begin() {
    if (st !== 'wait') return;
    Seq.audioInit(); rainStart(); setState('emerge'); hint.classList.remove('on');
  }
  const onDown = e => { Seq.audioInit(); e.preventDefault(); begin(); };
  const onKey = e => { if ((e.code === 'Enter' || e.code === 'Space') && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); begin(); } };
  root.addEventListener('pointerdown', onDown);
  addEventListener('keydown', onKey);

  /* ---------- rain ---------- */
  let drops = [], splashes = [];
  function newDrop(initial) {
    const near = Math.random() < .42;
    return { x: Math.random() * (W + 160) - 20, y: initial ? Math.random() * H : -30 - Math.random() * 120, vy: (near ? 1150 : 800) * (.9 + Math.random() * .2), len: near ? 22 : 12, near, land: H * (.68 + Math.random() * .34) };
  }
  function seedRain() { drops = []; const n = reduce ? 80 : 170; for (let i = 0; i < n; i++) drops.push(newDrop(true)); }
  const WIND = -.14;
  function drawRain(dt) {
    ctx.clearRect(0, 0, W, H);
    for (const pass of [false, true]) {
      ctx.beginPath(); ctx.lineWidth = pass ? 1.5 : 1; ctx.strokeStyle = pass ? 'rgba(220,208,255,.45)' : 'rgba(190,176,245,.24)';
      for (const d of drops) if (d.near === pass) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - WIND * d.len * -1, d.y - d.len); }
      ctx.stroke();
    }
    for (const d of drops) {
      d.y += d.vy * dt; d.x += WIND * d.vy * dt;
      if (d.y >= d.land) { if (splashes.length < 60) splashes.push({ x: d.x, y: d.land, a: 0, near: d.near }); Object.assign(d, newDrop(false), { x: Math.random() * (W + 160) - 20 }); }
    }
    ctx.lineWidth = 1;
    for (let i = splashes.length - 1; i >= 0; i--) {
      const sp = splashes[i]; sp.a += dt * 3.2;
      if (sp.a >= 1) { splashes.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(215,200,255,${(.5 * (1 - sp.a)).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(sp.x, sp.y, 2 + sp.a * (sp.near ? 11 : 7), .8 + sp.a * (sp.near ? 3.4 : 2.2), 0, 0, 6.3); ctx.stroke();
    }
  }

  /* ---------- update ---------- */
  function walkTo(tx, speed, dt) {
    const dx = tx - M.x, step = Math.min(Math.abs(dx), speed * M.s * dt); M.x += Math.sign(dx) * step; M.v = step > 0 ? speed : 0; return Math.abs(tx - M.x) < .5;
  }
  function update(dt) {
    t += dt; stT += dt;
    let camT = wide, mouseSeen = st !== 'wait', pawsT = 0, standT = 0, lookT = 0, earT = 0, happyT = 0, qShow = 0, sqT = 1;
    M.v = 0;

    if (st === 'emerge') {
      const u = clamp(stT / 1.15, 0, 1), e = easeInOut(u);
      M.x = lerp(TUN_X - 4, TUN_X + 20, e); M.y = lerp(TUN_Y, WALK_Y, e); M.s = lerp(.55, 1, e); M.dim = lerp(.45, 1, clamp(u * 1.6, 0, 1));
      M.clip = u < .42; M.v = 56; M.hop = Math.sin(Math.PI * clamp((u - .45) / .55, 0, 1)) * 5;
      if (u >= 1) { M.hop = 0; setState('walk'); }
    } else if (st === 'walk') {
      if (walkTo(STOP_X, 58, dt)) setState('listen');
    } else if (st === 'listen') {
      // timeline: sniff, muffled meows from above, ears up, question marks
      if (stT > .55 && !ev.m1) { ev.m1 = 1; catMeow('muffled'); meow(430, .34, true); }
      if (stT > 1.15) { standT = .3; earT = 1; lookT = -22; }
      if (stT > 1.15 && !ev.h1) { ev.h1 = 1; snd.hmm(); }
      if (stT > 1.75 && !ev.m2) { ev.m2 = 1; catMeow('muffled'); meow(480, .38, true); }
      if (stT > 1.7) { standT = .62; lookT = -34; }
      qShow = stT > 1.45 ? 1 : 0;
      if (stT > 1.45 && !ev.q0) { ev.q0 = 1; snd.pop(); }
      if (stT > 1.95 && !ev.q1) { ev.q1 = 1; snd.pop(); }
      if (stT > 2.4 && !ev.q2) { ev.q2 = 1; snd.pop(); }
      if (stT > 3.1) setState('drop');
    } else if (st === 'drop') {
      standT = .72; lookT = -36; earT = 1; qShow = stT < .5 ? 1 : 0;
      if (!ev.m) { ev.m = 1; catMeow('clear'); meow(560, .62, false); }
      if (stT > .16 && LET.state === 'cat') {
        const m = catMouth(); LET.state = 'fall'; LET.fallT = 0; LET.x0 = m.x; LET.y0 = m.y; C.letterIn = false;
        LET.x = m.x; LET.y = m.y; LET.rot = -7; LET.s = .17; LET.sy = 1; setState('fall');
      }
    } else if (st === 'fall') {
      LET.fallT += dt; const TF = 2.05, u = clamp(LET.fallT / TF, 0, 1), landY = WALK_Y - 4;
      const p = .45 * u + .55 * u * u;
      LET.x = lerp(LET.x0, LAND_X, u) + Math.sin(u * Math.PI * 3.3) * 34 * (1 - u * .75);
      LET.y = lerp(LET.y0, landY, p);
      LET.rot = Math.cos(u * Math.PI * 3.3) * 30 * (1 - u * .55) - 7 * u;
      LET.s = lerp(.17, .25, u); LET.sy = lerp(1, .55, clamp((u - .85) / .15, 0, 1));
      standT = u < .75 ? .72 : .1; lookT = u < .75 ? -36 : -8; earT = 1;
      if (u > .6) camT = closeCam();
      if (u > .72) { M.face = 1; walkTo(LAND_X - 24, 70, dt); }
      if (u >= 1) { LET.state = 'ground'; LET.y = landY; LET.rot = -8; setState('pickup'); snd.splash(); }
    } else if (st === 'pickup') {
      camT = closeCam();
      if (stT < .4) { standT = 0; lookT = 16; sqT = .88; if (stT > .08 && !ev.a) { ev.a = 1; snd.squeak(); } walkTo(LAND_X - 22, 40, dt); }
      else {
        if (!ev.g) { ev.g = 1; LET.state = 'held'; M.held = true; snd.rustle(); Seq.vib(10); S.sqv.v = .8; }
        const u = clamp((stT - .4) / .6, 0, 1);
        standT = easeOutBack(u) * 1; pawsT = easeOut(u); lookT = lerp(16, -12, u);
      }
      if (stT > 1.1) setState('gotit');
    } else if (st === 'gotit') {
      camT = closeCam(); standT = 1; pawsT = 1; lookT = -14; happyT = 1;
      if (!ev.s) { ev.s = 1; snd.gotit(); Seq.vib([12, 40, 12]); S.sqv.v = .85; ev.sp = t; }
      const b = Math.sin(clamp((stT - .5) / .5, 0, 1) * Math.PI);
      M.hop = b * 7; if (stT > .5 && !ev.s2) { ev.s2 = 1; S.sqv.v = .88; }
      if (stT > .7 && !ev.m) { ev.m = 1; catMeow('clear'); meow(520, .7, false); }
      if (stT > 2.2) setState('leave');
    } else if (st === 'leave') {
      standT = 0; pawsT = 0; happyT = stT < .8 ? 1 - stT / .8 : 0; lookT = 0; camT = wide; M.hop = 0;
      M.face = -1;
      if (stT > .35) { if (walkTo(TUN_X + 26, 64, dt)) setState('enter'); }
    } else if (st === 'enter') {
      const u = clamp(stT / .95, 0, 1), e = easeInOut(u);
      if (!ev.a) { ev = { a: 1, x0: M.x }; }
      M.x = lerp(ev.x0, TUN_X, e); M.y = lerp(WALK_Y, TUN_Y, e); M.s = lerp(1, .55, e); M.dim = lerp(1, .4, e); M.clip = u > .3; M.v = 52;
      M.hop = Math.sin(Math.PI * clamp(u * 1.4, 0, 1)) * 4;
      if (u >= 1 && !reported) { reported = true; M.v = 0; done(toScreen(TUN_X, -14)); }
    }

    // mouse pose smoothing
    M.stand = lerp(M.stand, standT, Math.min(1, dt * 7)); M.paws = lerp(M.paws, pawsT, Math.min(1, dt * 9));
    M.look = lerp(M.look, lookT, Math.min(1, dt * 8)); M.ear = lerp(M.ear, earT, Math.min(1, dt * 10)); M.happy = lerp(M.happy, happyT, Math.min(1, dt * 10));
    stepS(S.sqv, sqT, 420, 11, dt); M.sq = S.sqv.v;
    const walking = M.v > 1 && M.stand < .3;
    if (M.v > 1) { M.phase += dt * M.v * .17; const si = Math.floor(M.phase / Math.PI); if (si !== lastStep) { lastStep = si; snd.patter(); } }
    M.walkAmt = walking ? clamp(M.v / 58, 0, 1) : 0;

    // camera
    const k = camT === wide ? 22 : 34;
    stepS(cam.x, camT.x, k, 2 * Math.sqrt(k), dt); stepS(cam.y, camT.y, k, 2 * Math.sqrt(k), dt); stepS(cam.z, camT.z, k, 2 * Math.sqrt(k), dt);

    // cat
    C.blinkT -= dt; const blink = C.blinkT < 0 && C.blinkT > -.14; if (C.blinkT < -.14) C.blinkT = 2.4 + Math.random() * 2.4;
    const since = t - C.mewT;
    let open = 0, tilt = Math.sin(t * .9) * 1.6 * RM, bob = Math.sin(t * 2.1) * .8 * RM, jig = 0, lean = 0;
    if (since >= 0 && C.kind === 'clear' && since < .9) { const u = since / .9; open = Math.sin(Math.PI * clamp(u * 1.1, 0, 1)) ** .6; tilt += -6 * Math.sin(Math.PI * u); bob -= 3 * Math.sin(Math.PI * u); lean = 1; }
    if (since >= 0 && C.kind === 'muffled' && since < .5) { const u = since / .5; jig = Math.sin(u * Math.PI * 4) * (1 - u); tilt += Math.sin(u * Math.PI * 2) * -4; bob -= 2.2 * Math.sin(Math.PI * u); }
    if (st === 'gotit' || st === 'pickup') lean = Math.max(lean, .6);
    C.mew = open; C.tilt = lerp(C.tilt, tilt, Math.min(1, dt * 14)); C.bob = lerp(C.bob, bob, Math.min(1, dt * 14)); C.jig = jig; C.lean = lerp(C.lean, lean, Math.min(1, dt * 6)); C.blink = blink;
    C.eyeOn = !(open > .4);

    // letter transform in world space
    if (LET.state === 'held') {
      const pawsAmt = M.paws, f = M.face, s = M.s;
      const lx = lerp(-6, 14, pawsAmt) * f * s * MK, ly = lerp(-50, -76, M.stand) * s * MK;
      LET.x = M.x + lx; LET.y = M.y - M.hop + ly * 1; LET.rot = (f > 0 ? -8 : 8) * (1 - M.stand * .5) + Math.sin(t * 7) * 1.6 * M.happy; LET.s = .26 * s; LET.sy = 1;
    }
    // question marks
    el.qs.forEach((e, i) => { e._on = e._on || 0; e._on = lerp(e._on, qShow && (st !== 'listen' || ev['q' + i]) ? 1 : 0, Math.min(1, dt * (qShow ? 14 : 8))); });
    // sparkles
    SP.forEach((p, i) => { const age = (st === 'gotit' ? stT : (st === 'leave' ? stT + 2.2 : -1)) - i * .09; p._a = age; });
    // clouds drift
    el.clouds.forEach(c => { c._p = (c._p || 0) + dt; });
    // trickle
    el.trickle.setAttribute('stroke-dashoffset', f2(-t * 10));
    drawRain(dt);
  }

  /* ---------- render ---------- */
  function renderMouse() {
    const s = M.s, th = M.stand * 55, ph = M.phase, sw = Math.sin(ph) * 30 * M.walkAmt;
    const sy = M.sq, sx = 1 / Math.sqrt(sy);
    const bob = -Math.abs(Math.sin(ph)) * 2.4 * M.walkAmt;
    el.mClip.setAttribute('clip-path', M.clip ? 'url(#nHoleClip)' : '');
    if (!M.clip) el.mClip.removeAttribute('clip-path');
    el.mClip.setAttribute('opacity', st === 'wait' ? 0 : f2(M.dim));
    el.mRoot.setAttribute('transform', `translate(${f2(M.x)} ${f2(M.y - M.hop + bob * s)}) scale(${f2(M.face * s * MK)} ${f2(s * MK)})`);
    el.mSquash.setAttribute('transform', `scale(${f2(sx)} ${f2(sy)})`);
    el.mBody.setAttribute('transform', `rotate(${f2(-th)} -14 0)`);
    el.mHead.setAttribute('transform', `rotate(${f2(M.look)} 20 -22)`);
    el.mEar.setAttribute('transform', `translate(8 -32) scale(${f2(1 + .14 * M.ear)} ${f2(1 + .26 * M.ear)}) rotate(${f2(-8 * M.ear)}) translate(-8 32)`);
    el.mTail.setAttribute('transform', `rotate(${f2(Math.sin(t * 3.2) * 7 + Math.sin(ph) * 6 * M.walkAmt)} -30 -19)`);
    const arm = (-100 * M.paws), reach = 1 + .75 * M.paws;
    el.legBN.setAttribute('transform', `translate(-14 -14) rotate(${f2(sw)})`);
    el.legBF.setAttribute('transform', `translate(-8 -14) rotate(${f2(-sw)})`);
    el.legFN.setAttribute('transform', `translate(20 -14) rotate(${f2(M.paws > .02 ? arm - sw * (1 - M.paws) : -sw)}) scale(1 ${f2(reach)})`);
    el.legFF.setAttribute('transform', `translate(16 -14) rotate(${f2(M.paws > .02 ? arm + 14 * M.paws + sw * (1 - M.paws) : sw)}) scale(1 ${f2(reach)})`);
    el.eyeOpen.setAttribute('opacity', f2(1 - M.happy)); el.eyeShine.setAttribute('opacity', f2(1 - M.happy));
    el.eyeHappy.setAttribute('opacity', f2(M.happy)); el.blush.setAttribute('opacity', f2(.4 + M.happy * .5)); el.smile.setAttribute('opacity', f2(M.happy));
    el.mShadow.setAttribute('cx', f2(M.x)); el.mShadow.setAttribute('cy', f2(M.y + 1)); el.mShadow.setAttribute('rx', f2(30 * s * MK * (1 - Math.min(M.hop / 40, .3))));
    el.mShadow.setAttribute('opacity', M.clip ? 0 : f2(.9 * M.dim));
  }
  function renderLetter() {
    if (LET.state === 'cat') { el.letterW.setAttribute('visibility', 'hidden'); return; }
    el.letterW.setAttribute('visibility', 'visible');
    el.letterG.setAttribute('transform', `translate(${f2(LET.x)} ${f2(LET.y)}) rotate(${f2(LET.rot)}) scale(${f2(LET.s)} ${f2(LET.s * LET.sy)}) translate(-80 -55)`);
  }
  function render() {
    const z = cam.z.v;
    el.world.setAttribute('transform', `translate(${f2(W / 2)} ${f2(H / 2)}) scale(${z.toFixed(4)}) translate(${f2(-cam.x.v)} ${f2(-cam.y.v)})`);
    // clouds
    el.clouds.forEach(c => c.setAttribute('transform', `translate(${f2(Math.sin(c._p / (+c.dataset.s) ) * +c.dataset.a)} 0)`));
    // cat
    el.cTail.setAttribute('transform', `rotate(${f2(Math.sin(t * 1.5) * 6 * RM + (C.kind === 'clear' ? C.mew * 6 : 0))} 40 -8)`);
    el.cBody.setAttribute('transform', `scale(1 ${f2(1 + .012 * Math.sin(t * 2.1) * RM)})`);
    el.cHead.setAttribute('transform', `translate(${f2(C.jig * 1.6)} ${f2(-76 + C.bob + C.lean * 3)}) rotate(${f2(C.tilt + C.lean * 4)} 0 22)`);
    const blinkS = C.blink ? .1 : (C.mew > .4 ? .5 : 1);
    el.cEyes.forEach(e => e.setAttribute('transform', `scale(1 ${f2(blinkS)})`));
    // pupils look at the mouse
    const tgt = st === 'wait' ? { x: -40, y: 140 } : { x: M.x, y: M.y - 12 };
    const dx = tgt.x - CAT_X, dy = tgt.y - (CAT_Y - 76 * CAT_S), dl = Math.hypot(dx, dy) || 1;
    el.cPupils.forEach(p => p.setAttribute('transform', `translate(${f2(dx / dl * 2.2)} ${f2(dy / dl * 1.8)})`));
    el.cMouthOpen.setAttribute('opacity', f2(clamp(C.mew * 1.4, 0, 1)));
    el.cMouthOpen.setAttribute('transform', `translate(0 12) scale(1 ${f2(clamp(C.mew, .1, 1))}) translate(0 -12)`);
    el.cMouthShut.setAttribute('opacity', C.mew > .15 ? 0 : (C.letterIn ? 0 : 1));
    el.cLetter.setAttribute('opacity', C.letterIn ? 1 : 0);
    el.cLetter.setAttribute('transform', `translate(${f2(C.jig * 1.2)} ${f2(C.jig * .8)}) rotate(${f2(C.jig * 4)} 0 22)`);
    renderMouse(); renderLetter();
    // question marks
    const h = headWorld(), rel = [[-26, -52, -12], [22, -60, 10], [-2, -78, 0]];
    el.qs.forEach((e, i) => {
      const on = e._on || 0, pop = on < .01 ? 0 : easeOutBack(clamp(on, 0, 1)), bobY = Math.sin(t * 3.4 + i * 1.7) * 3, rot = rel[i][2] + Math.sin(t * 2.6 + i) * 7;
      e.setAttribute('opacity', f2(clamp(on * 1.3, 0, 1)));
      e.setAttribute('transform', `translate(${f2(h.x + rel[i][0] * M.s * MK)} ${f2(h.y + (rel[i][1] + bobY) * M.s * MK)}) rotate(${f2(rot)}) scale(${f2(Math.max(.01, pop))})`);
    });
    // sparkles around the letter
    SP.forEach((p, i) => {
      const age = p._a; if (age === undefined || age < 0 || age > 1.3) { p.setAttribute('opacity', 0); return; }
      const a = i / SP.length * Math.PI * 2 + 1, r = 26 + age * 26 + i * 2, sc = Math.sin(clamp(age / 1.3, 0, 1) * Math.PI) * (1.1 + (i % 3) * .3);
      p.setAttribute('opacity', f2(clamp(sc, 0, 1)));
      p.setAttribute('transform', `translate(${f2(LET.x + Math.cos(a) * r * M.s * MK)} ${f2(LET.y - 6 + Math.sin(a) * r * .8 * M.s * MK)}) rotate(${f2(age * 120)}) scale(${f2(Math.max(.01, sc))})`);
    });
    // "Got it!" bubble (screen space, so it stays crisp when the camera zooms in)
    if (st === 'gotit' || (st === 'pickup' && stT > .9)) {
      const pop = st === 'gotit' ? easeOutBack(clamp((stT - .05) / .35, 0, 1)) : 0, fade = st === 'gotit' ? 1 - clamp((stT - 1.9) / .3, 0, 1) : 0;
      const bp = toScreen(M.x + 6, M.y - 98 * M.s * MK);
      bubble.style.opacity = f2(clamp(pop * fade, 0, 1));
      bubble.style.transform = `translate(${f2(bp.x)}px,${f2(bp.y)}px) translate(-50%,-100%) rotate(-4deg) scale(${f2(Math.max(.01, pop))})`;
    } else bubble.style.opacity = 0;
    if (st === 'wait') hint.classList.add('on');
  }

  layout(); seedRain();
  cam.x.v = wide.x; cam.y.v = wide.y; cam.z.v = wide.z;
  const ro = new ResizeObserver(() => { layout(); if (st === 'wait' || (cam.z.v === cam.z.v && !['pickup', 'gotit', 'fall'].includes(st))) { cam.x.v = wide.x; cam.y.v = wide.y; cam.z.v = wide.z; cam.x.vel = cam.y.vel = cam.z.vel = 0; } });
  ro.observe(root);
  update(.016); render();

  let last = performance.now();
  return {
    entry: { x: W / 2, y: H / 2 },
    frame(now) { const dt = clamp((now - last) / 1000, 0, 1 / 30); last = now; update(dt); render(); },
    destroy() {
      ro.disconnect(); removeEventListener('keydown', onKey);
      clearTimeout(dripT); clearTimeout(thunderT);
      if (rainNodes) rainNodes.forEach(n => { try { n.stop(); } catch (e) {} });
      rainNodes = null;
      out.close();
    }
  };
};
