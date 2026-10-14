# Study 02 — Freeze When the Dog Looks

**Source artifact:** https://claude.ai/artifact/J2mDSxLpaaeXaRQi89fraL
**File:** `index.html` (single self-contained page, ~490 lines)

## What the study does
Carrying the love letter on its back, the mouse must cross the floor to a mouse hole on the right edge while a dog naps near the top. The dog periodically wakes and sweeps a vision cone. The player drags to move the mouse and holds a "Hide" button (or Space / a second finger) to freeze. Freezing too long makes the mouse panic and drop the letter. Getting spotted sends the mouse back to the start.

## Main visual and interactive components
| Component | Element / id | Notes |
|---|---|---|
| Stage | `#stage` | Portrait column (max width = 0.64 × height), centred; light/dark themes via CSS vars |
| Dog | `#dog` (`#ear`, `#eye-closed`, `#eye-open`, `#pupil`) | Sleeps (breathing), warns (ear flicks, eye peek), wakes and sweeps, wanders while awake |
| Vision cone | `#cone` / `#coneG` (`#c1–c3`, gradient `#cg`) | Three layered wedges from the dog's eye |
| Mouse | `#mBodyW` (body + `#tail`) and `#mHeadW` (`#head`) | Top-down mouse rotated 90°; split so head can glance and letter sits between layers |
| Letter | `#cheese` / `#cheeseS` | Rides on the mouse; trembles while hiding; falls/bounces on slip |
| Mouse hole (goal) | `#hole` | Right edge, mid-height |
| Danger rings | `#rings` (`#r0`, `#r1`) | Pulse around the mouse faster/stronger as the cone gets closer |
| "!" alert | `#bang` | Pops over the dog when the mouse is spotted |
| Vignette | `#vig` | Darkens the screen while hiding, tightening with tension |
| Hide button | `#hide` | Bottom-left; hold to freeze |
| Reset | `#reset` | Bottom-right; pulses after success |

## User actions → feedback → states
- **Drag anywhere** → mouse follows the finger (eased velocity), body bob, footstep ticks; starting to move starts the dog's cycle.
- **Hold Hide / Space / second finger** → mouse squashes flat and dims, vignette closes in, heartbeat sound + rising whine, letter trembles more over time.
- **Release hide** → exhale sound, springy un-squash.
- **Hold longer than `MAX_HOLD` (4.6s)** → *slip*: letter flies off and bounces, mouse scurries back to start, letter fades back on.
- **Dog cycle:** `sleep` → `warn` (ear/eye flick cues over `WARN` = 1.7s) → `awake` (growl, cone sweeps ±75°) → `settle` (sigh) → `sleep`.
- **In cone while not hiding for > 0.25s** → *spotted*: "!" pop, alarm sound, vibration, mouse leaps and scurries back to start.
- **Reach the hole** → mouse shrinks into it, chime, reset button pulses (`mode = 'done'`).

Mouse mode (`S.mode`): `walk` | `spotted` | `slipped` | `done`. Dog state (`S.dog`): `sleep` | `warn` | `awake` | `settle` | `alert`.

## Where it lives in `index.html`
| Lines | Section |
|---|---|
| 3–39 | CSS: theme tokens (light + dark), `#bang` pop keyframes, hide button active state, reset pulse |
| 40–93 | Markup: cone, dog, hole, mouse body, letter, mouse head, rings, bang, vignette, buttons (inline SVG) |
| 96–101 | Constants: cone half-angle, sweep speed, `SPEED`, `START_P/Q`, `WARN`, `MAX_HOLD` |
| 103–173 | Web Audio synth: `tone`, `noise`, `SFX` map, heartbeat whine (`whineStart/Set/Stop`), `vibrate` |
| 175–195 | `layout()` — responsive sizing of dog, mouse, letter, hole, cone gradient |
| 197–221 | Input: drag pointer vs. hide pointers, Space key, blur/visibility handling, reset |
| 223–244 | `resetState()`, `bearing()` (mouse angle from the dog's eye), `pickWaypoint()` |
| 246–290 | Dog state machine `updateDog()`, `startWake()`, `toSettle()` |
| 292–336 | Outcomes: `spot()`, `slip()`, `arrive()`, `updateSp()` (leap/fall/scurry sequences) |
| 338–414 | `update()` — hiding/tension, movement, cone detection, goal check, danger level, head glances |
| 416–476 | `render()` — all transforms for dog, cone wedges, mouse, letter, rings, vignette |
| 478–486 | Main loop and boot |

## Dependencies and assets
None. Inline SVG art, CSS animations, Web Audio synthesized sound, optional `navigator.vibrate`. Line 485 calls `window.claude.hot.ready` only if it exists (a Claude Artifact hot-reload hook); it is safely skipped in a normal browser.
Run by opening `index.html` in a browser. Multi-touch is used (one finger drags, another holds Hide); on desktop use mouse drag + Space.

## Hooks for connecting to the sequence
- **Entry:** mouse starts bottom-left (`START_P`, `START_Q`) already carrying the letter — matches the end of Study 01.
- **Exit:** `S.mode = 'done'` in `update()` (line ~380) when the mouse reaches the hole — emit "complete" here to hand off to Study 03, which opens with the mouse coming out of a hole.
