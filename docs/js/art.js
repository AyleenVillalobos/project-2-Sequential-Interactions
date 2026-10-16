/* Shared character art (drawn once, used by several scenes): the messenger mouse and the tabby cat. */
Seq.art = (() => {
  const OL = '#0c0818';
  const LETTER = '<g class="mLetter"><use href="#letterArt"/></g>';
  function fluff(cx, cy, rx, ry, n, amp) {
    const P = (a, k) => { const r = a * Math.PI / 180; return [cx + Math.cos(r) * rx * k, cy + Math.sin(r) * ry * k]; };
    const step = 360 / n, kc = 1 + amp / ((rx + ry) / 2), p0 = P(0, 1);
    let d = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`;
    for (let i = 0; i < n; i++) { const c = P(i * step + step / 2, kc), q = P((i + 1) * step, 1); d += `Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }
    return d + 'Z';
  }

  const MOUSE = `<g class="mRoot" stroke-linejoin="round" stroke-linecap="round">
          <g class="mSquash">
            <g class="mTail"><path d="M-27 -16 C-42 -14 -48 0 -62 -3 C-70 -5 -72 -14 -68 -20" fill="none" stroke="#1b1033" stroke-width="5.6"/><path d="M-27 -16 C-42 -14 -48 0 -62 -3 C-70 -5 -72 -14 -68 -20" fill="none" stroke="#f4a6bd" stroke-width="2.8"/></g>
            <g class="mLegBF"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#9a90b8" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
            <g class="mBody">
              <g class="mLegFF"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#9a90b8" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
              <ellipse cx="-5" cy="-19" rx="25" ry="18" fill="#b6adcf" stroke="#1b1033" stroke-width="2.8"/>
              <path d="M-20 -9 Q-5 -2 14 -9 Q10 -4 -4 -2 Q-16 -3 -20 -9Z" fill="#9a90b8"/>
              <ellipse cx="-3" cy="-12" rx="17" ry="7" fill="#f8e9f0"/>
              <path d="M-24 -28 Q-10 -39 5 -35" fill="none" stroke="#dcd5ee" stroke-width="3"/>
              <g class="mLegFN"><g class="mLegS"><rect x="-3.2" y="0" width="6.4" height="13" rx="3.2" fill="#b6adcf" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.6" cy="14" rx="5.6" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
              <!-- messenger's red scarf -->
              <path d="M2 -21 Q14 -8 26 -17 L25 -9 Q12 0 1 -12Z" fill="#e5475c" stroke="#1b1033" stroke-width="2.2"/>
              <path d="M2 -14 Q12 -3 25 -11 L25 -9 Q12 0 1 -12Z" fill="#b92a44"/>
              <path d="M5 -10 L-6 -3 L-1 -14Z" fill="#e5475c" stroke="#1b1033" stroke-width="2"/>
              <g class="mHead">
                <path d="M4 -24 C4 -42 31 -44 38 -34 C43 -32 50 -28 50 -22.5 C50 -17.5 44 -14 38 -13 C31 -8 4 -8 4 -24Z" fill="#c9c0df" stroke="#1b1033" stroke-width="2.8"/>
                <path d="M9 -35 Q16 -40 25 -38" fill="none" stroke="#ece7f8" stroke-width="3"/>
                <g class="mEar"><circle cx="8" cy="-41" r="12.5" fill="#b6adcf" stroke="#1b1033" stroke-width="2.8"/><circle cx="8.5" cy="-40.5" r="8.4" fill="#f48fae"/><path d="M4 -45 q4 -4 9 -2" fill="none" stroke="#ffd0de" stroke-width="2"/></g>
                <ellipse class="mEyeOpen" cx="27" cy="-28.5" rx="5" ry="6" fill="#0d0a18"/>
                <circle class="mEyeShine" cx="29" cy="-31" r="2.3" fill="#fff"/>
                <circle class="mEyeShine" cx="25.2" cy="-25.4" r="1.1" fill="#fff"/>
                <path d="M21.5 -33.5 Q27 -38.5 32.5 -33.5" fill="none" stroke="#1b1033" stroke-width="1.8"/>
                <path class="mEyeHappy" d="M22 -28 Q27 -35 32 -28" fill="none" stroke="#1b1033" stroke-width="2.2" opacity="0"/>
                <ellipse class="mBlush" cx="28.5" cy="-19.5" rx="5" ry="3.2" fill="#ff7fa3" opacity=".6"/>
                <rect x="38" y="-17.2" width="3.4" height="4.4" rx="1.2" fill="#fffaf0" stroke="#1b1033" stroke-width="1.2"/><rect x="41.5" y="-17.4" width="3.4" height="4.4" rx="1.2" fill="#fffaf0" stroke="#1b1033" stroke-width="1.2"/>
                <circle cx="49" cy="-23" r="3.6" fill="#ff8fae" stroke="#1b1033" stroke-width="1.8"/><circle cx="48" cy="-24" r="1" fill="#fff"/>
                <path class="mSmile" d="M36 -17.5 Q40.5 -13.5 44.5 -18" fill="none" stroke="#1b1033" stroke-width="1.6" opacity="0"/>
                <g stroke="#fff" stroke-width="1" fill="none" opacity=".85"><path d="M40 -22 L55 -29 M41 -20.5 L57 -21.5 M40 -19 L55 -13"/></g>
              </g>
            </g>
            <g class="mLegBN"><g class="mLegS"><rect x="-3.4" y="0" width="6.8" height="13" rx="3.4" fill="#b6adcf" stroke="#1b1033" stroke-width="2"/><ellipse cx="1.7" cy="14" rx="5.8" ry="3.2" fill="#f4a6bd" stroke="#1b1033" stroke-width="2"/></g></g>
          </g>
        </g>`;
  const mouseMarkup = MOUSE.replace(/<\/g>\s*$/, LETTER + '</g>');
  function tabbyMarkup() { return `        <g class="cTail">
          <path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#0c0818" stroke-width="17"/>
          <path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#f0954a" stroke-width="11"/><path d="M38 -8 C 66 -8 76 -32 60 -44" fill="none" stroke="#8a4a30" stroke-width="11" stroke-dasharray="4 9"/>
          <path d="M42 -12 C 64 -12 70 -28 59 -38" fill="none" stroke="#ffbb62" stroke-width="3"/>
        </g>
        <g class="cBody">
          <path d="M-41 0 C-49 -20 -45 -52 -27 -62 L27 -62 C45 -52 49 -20 41 0 C21 6 -21 6 -41 0Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-41 -48 q10 3 18 -1 M-45 -36 q12 4 20 -1 M-46 -24 q10 3 16 -1 M41 -48 q-10 3 -18 -1 M45 -36 q-12 4 -20 -1 M46 -24 q-10 3 -16 -1" fill="none" stroke="#8a4a30" stroke-width="3.2" stroke-linecap="round"/><path d="M24 -58 C45 -50 47 -20 39 -2 C33 1 28 2 22 2 C35 -20 35 -44 24 -58Z" fill="#c46a38"/>
          <path d="M-33 -50 C-40 -40 -41 -28 -38 -18" fill="none" stroke="#ffbb62" stroke-width="3.4"/>
          <path d="${fluff(0, -28, 25, 28, 12, 2.8)}" fill="#ffffff" stroke="#0c0818" stroke-width="2.2"/>
          <path d="M14 -48 C27 -34 24 -12 12 -2 C19 -14 20 -34 14 -48Z" fill="#dedcf0"/>
          <ellipse cx="-37" cy="-3" rx="10" ry="6.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="37" cy="-3" rx="10" ry="6.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="-13" cy="-6" rx="11.5" ry="8.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <ellipse cx="13" cy="-6" rx="11.5" ry="8.5" fill="#fff" stroke="#0c0818" stroke-width="2.4"/>
          <path d="M-17 -2 V-7 M-10 -2 V-7 M10 -2 V-7 M17 -2 V-7" stroke="#8d8bb5" stroke-width="1.4"/>
        </g>
        <g class="cHead" transform="translate(0 -66)">
          <path d="M-39 -12 Q-45 -42 -27 -47 Q-13 -39 -9 -27Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M39 -12 Q45 -42 27 -47 Q13 -39 9 -27Z" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-33 -16 Q-37 -36 -27 -40 Q-19 -35 -16 -27Z" fill="#ff9db9"/>
          <path d="M33 -16 Q37 -36 27 -40 Q19 -35 16 -27Z" fill="#ff9db9"/>
          <path d="M-30 -20 Q-31 -32 -27 -36" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>
          <path d="${fluff(-40, 12, 9, 7, 6, 2.4)}" fill="#fff" stroke="#0c0818" stroke-width="2"/>
          <path d="${fluff(40, 12, 9, 7, 6, 2.4)}" fill="#fff" stroke="#0c0818" stroke-width="2"/>
          <ellipse cx="0" cy="0" rx="44" ry="36" fill="#f0954a" stroke="#0c0818" stroke-width="3"/>
          <path d="M-22 -27 Q-10 -34 4 -31" fill="none" stroke="#ffd98a" stroke-width="3.4"/>
          <path d="M-5 -34 Q0 -39 5 -34 L8 -6 L-8 -6Z" fill="#f0954a"/><path d="M-9 -28 l0 12 M0 -33 l0 14 M9 -28 l0 12" stroke="#8a4a30" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-41 4 l-9 -3 M-42 10 l-10 1 M41 4 l9 -3 M42 10 l10 1" stroke="#8a4a30" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <ellipse cx="-10" cy="12" rx="14" ry="11.5" fill="#fff"/><ellipse cx="10" cy="12" rx="14" ry="11.5" fill="#fff"/>
          <ellipse cx="0" cy="22" rx="11" ry="7" fill="#fff"/>
          <path d="M-22 20 Q0 34 22 20 Q18 30 0 31 Q-18 30 -22 20Z" fill="#dedcf0" opacity=".7"/>
          <ellipse cx="-30" cy="8" rx="8.5" ry="5.4" fill="#ff7fa3" opacity=".7"/><ellipse cx="30" cy="8" rx="8.5" ry="5.4" fill="#ff7fa3" opacity=".7"/>
          <g class="cEyeL" transform="translate(-19 -2)"><g class="cEyeScale"><ellipse rx="10.5" ry="12.5" fill="#0c0818"/><ellipse class="cPupil" rx="7.6" ry="9.4" fill="#45b98d"/><path d="M-7 -4 Q0 -11 7 -4 Q0 -7 -7 -4Z" fill="#1d7c63"/><ellipse rx="3.5" ry="4.8" fill="#0c0818" opacity=".85"/><circle cx="-3.8" cy="-4.8" r="3.8" fill="#fff"/><circle cx="3.8" cy="4.4" r="1.9" fill="#fff"/></g></g>
          <g class="cEyeR" transform="translate(19 -2)"><g class="cEyeScale"><ellipse rx="10.5" ry="12.5" fill="#0c0818"/><ellipse class="cPupil" rx="7.6" ry="9.4" fill="#45b98d"/><path d="M-7 -4 Q0 -11 7 -4 Q0 -7 -7 -4Z" fill="#1d7c63"/><ellipse rx="3.5" ry="4.8" fill="#0c0818" opacity=".85"/><circle cx="-3.8" cy="-4.8" r="3.8" fill="#fff"/><circle cx="3.8" cy="4.4" r="1.9" fill="#fff"/></g></g>
          <path d="M-3.8 7 Q0 4.6 3.8 7 Q2.8 11.4 0 12.4 Q-2.8 11.4 -3.8 7Z" fill="#ff8fae" stroke="#0c0818" stroke-width="1.5"/>
          <path class="cMouthShut" d="M0 12.4 Q-3 17.5 -7.4 14 M0 12.4 Q3 17.5 7.4 14" fill="none" stroke="#0c0818" stroke-width="1.9"/>
          <g class="cMouthOpen" opacity="0">
            <path d="M-8.5 14 Q0 11.5 8.5 14 Q8.5 28 0 29 Q-8.5 28 -8.5 14Z" fill="#5b1230" stroke="#0c0818" stroke-width="1.8"/>
            <path d="M-4.8 25 Q0 20 4.8 25 Q3.8 29 0 29 Q-3.8 29 -4.8 25Z" fill="#ff7f9a"/>
          </g>
          
          <g stroke="#fff" stroke-width="1.2" fill="none" opacity=".85">
            <path d="M-27 12 Q-39 8 -53 10 M-27 16 Q-40 16 -53 21"/><path d="M27 12 Q39 8 53 10 M27 16 Q40 16 53 21"/>
          </g>
        </g>
`; }
  return { OL, MOUSE, mouseMarkup, tabbyMarkup, LETTER };
})();
