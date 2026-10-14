# Study 01 — Trace the Sneak Route

**Source artifact:** https://claude.ai/artifact/3YKw8kRhV65pzwbtZ4JzrM
**File:** `index.html` (single self-contained page, ~575 lines)

## What the study does
The mouse peeks out of its hole (bottom-left). The player draws a dotted route with their finger from the hole to the love letter (top-right) while a dog wanders the middle of the floor. The mouse walks the route behind the player's finger. If the route or the mouse gets too close to the dog, the trail crumbles or the mouse is chased home. Reaching the letter ends the study with the mouse lifting it overhead.

## Main visual and interactive components
| Component | Element / id | Notes |
|---|---|---|
| Floor / stage | `#stage` | Dark full-bleed portrait floor; `--g` CSS var drives the letter glow |
| Mouse hole | `#hole` (inline SVG) | Bottom-left; drawing must start here |
| Mouse | `#mouse` > `#mbody` | Idle hop, nose twitch, crouch (ears fold) via `.crouch` |
| Dog | `#dog` > `#flip` > `#snortwrap` > `.breathe` > `#dogsvg` | Wanders a band in the middle; ear twitch, snort puffs |
| Danger ring + trail + crumbs + paw hints | `#cv` (canvas) | Ellipse around dog, dotted route, crumble particles, 5 faint paw prints from the hole |
| Love letter ("cheese") | `#cheese`, `#cheesesvg`, `#cheeseGlow` | Envelope with cheese stamp; pulses, glows as the route gets closer, wiggles on snap |
| Reset | `#reset` | Top-left circular button |

## User actions → feedback → states
- **Press on the hole** → mouse crouches, squeak + haptic; a stroke begins.
- **Drag** → dots laid down (spacing grows with finger speed; jagged inside the ring), soft "pat" sounds; letter glow increases with proximity.
- **Release** (stroke ≥ 18px) → mouse starts walking the route, footstep sounds, slows when near the dog. Continue the route by pressing on its end.
- **Route enters dog's ring** (`FAIL = 0.9`) → stroke cut back, dots crumble, dog snorts.
- **Route ahead of mouse gets crossed by the wandering dog** → route truncated at that point.
- **Mouse/route near ring** → dog ear twitch + low warn tone; mouse half-crouches.
- **Mouse inside ring** (`CAUGHT = 0.8`) → dog barks, trail crumbles, mouse scurries back into the hole, re-emerges.
- **Route touches the letter** → snaps to the letter, letter wiggles, chime path armed.
- **Mouse arrives** → finale: squash, letter lifts overhead, chime, bounce.
- **Reset** → everything back to start.

State machine (`st`): `play` → `fin` → `done`; `play` → `home` (caught) → `play`.
Mouse sub-mode (`mode`): `hole` | `out`.

## Where it lives in `index.html`
| Lines | Section |
|---|---|
| 3–69 | CSS: theme tokens, keyframes (`cpulse`, `wiggle`, `breathe`, `snort`, `twitch`, `puff`, `hop`, `twitchnose`), crouch transforms |
| 71–153 | Markup: hole, canvas, dog, letter, mouse, reset (all inline SVG) |
| 168–209 | Web Audio synth (`tone`, `puff`) + sound map `S` + `vib()` haptics |
| 211–247 | `layout()` — responsive sizing, dog ring radii, letter target `L.T`, wander band, paw prints |
| 249–266 | State variables, thresholds `FAIL`/`CAUGHT`, `dogD()` normalized ring distance |
| 268–300 | Route helpers: `pushPt`, `posAt`, `smoothPos`, `truncate` |
| 302–332 | Dog wander AI: `pickTarget`, `updateDog`, `dogAlert` |
| 334–406 | Input: pointer down/move/up, `addPoint`, `maybeDot`, `strokeFail`, `snap` |
| 408–442 | `updateMouse` — walking the route, crouch, gait |
| 444–476 | `dogRules` (route cutting, warnings) and `caught` (scurry home) |
| 478–496 | `finStep` — finale animation |
| 498–509 | `reset()` |
| 511–549 | Canvas `draw()` — ring, paw prints, dotted trail, crumbs |
| 551–572 | Main loop `frame()`, tweens, resize handling |

## Dependencies and assets
None. All art is inline SVG, the trail is drawn on `<canvas>`, sound is synthesized with the Web Audio API, haptics use `navigator.vibrate` (silently ignored where unsupported). No network requests, fonts, or images.
Run by opening `index.html` in a browser (best in a mobile/portrait viewport with touch or pointer input).

## Hooks for connecting to the sequence
- **Entry:** starts with mouse in the hole, letter top-right.
- **Exit:** `st` becomes `'done'` inside `finStep()` (line ~491) — the natural place to emit a "complete" event to move to the next study.
