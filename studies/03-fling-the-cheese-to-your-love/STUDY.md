# Study 03 — Fling the Cheese to Your Love

**Source artifact:** https://claude.ai/artifact/34M2fQfsTFD9ki7kBYYjYg
**File:** `index.html` (single self-contained page, ~780 lines)

## What the study does
A side-view scene seen through a panning, zooming camera. The mouse ("Agent Mouse") pops out of its hole holding the love letter overhead, and the camera cuts to the kitty roaming on the far right. The player can walk the mouse left/right, then pull back on the letter like a slingshot. A dotted arc predicts the flight (accounting for where the kitty will be), and releasing flings it. If the kitty catches it she hugs the letter, purrs, and hearts burst out; misses bounce, slide and hop back to the mouse.

## Main visual and interactive components
| Component | Element / id | Notes |
|---|---|---|
| Scene / camera | `#scene` > `#world` | One SVG; camera is a spring-driven translate/scale on `#world` |
| Mouse hole | `#hole`, `#holeClip` | Mouse is clipped to the hole during the intro |
| Mouse | `#mouseWrap` > `#mouse` (`#mBody`, `#mHead`, `#mEyes`, `#mPawL`, `#mPawR`) | Holds letter overhead, braces while pulling, eyes track kitty/letter, salutes on catch |
| Kitty | `#kitty` > `#kLean` > `#kFlip` > `#kBob` > `#kSq` (`#kTail`, `#kHead`, `#kEyes`, paws, `#kHeld`) | Seeded deterministic patrol (walks, pauses, hops); leans/stares as the letter nears |
| Letter | `#letter` (uses `#letterArt` symbol) | Stretch/squash springs, flight rotation |
| Aim arc | `#arc` (46 pooled `<circle>` dots) | Predicted trajectory; darkens when it will hit |
| Shadows | `#shMouse`, `#shKitty`, `#shLetter` | Scale/fade with height |
| Hearts | `#hearts` | Burst on catch, then gentle floating hearts |
| Reset | `#reset` | Top-right |

## User actions → feedback → states
- **Tap during intro** → skips the intro.
- **Press + drag on empty space** → mouse walks to that x (step ticks, lean).
- **Press on the letter and pull** → grab sound, rising tension tone, letter stretches, mouse braces, aim arc appears; a "lock" ping + tiny vibration when the arc will hit the kitty; kitty leans and widens eyes as the arc gets close.
- **Release (pull ≥ 16px)** → twang + whoosh, letter snaps to the mouse then flies under gravity; camera follows upward.
- **Release (short / cancelled)** → letter springs back.
- **Hits a wall** → bonk, bounces back. **Lands** → plop, then slides and hops back to the mouse.
- **Kitty catches it** → catch chime + purr, kitty hugs the letter (`#kHeld`), hearts burst, camera zooms to her, mouse salutes.
- **Reset** → letter back to the mouse, `ready`.

State machine (`st`): `intro` → `ready` ⇄ `drag` → (`settle` back to `ready`) | `snap` → `fly` → `rest` → `slide` → `hop` → `ready`; `fly` → `caught` (end).

## Where it lives in `index.html`
| Lines | Section |
|---|---|
| 3–38 | CSS: grey palette tokens, stage, reset button |
| 40–136 | Markup: `#letterArt` symbol, world groups, hole, mouse, kitty, letter, hearts, reset (inline SVG) |
| 149–157 | Helpers: easing, spring stepper `stepS`, `buzz` haptics |
| 159–243 | Web Audio synth: `tone`, `noise`, `snd` map (grab, twang, plop, bonk, catch, purr…), slingshot tension drone |
| 245–301 | World constants (gravity `G`, walls, catch radius) and the seeded kitty patrol `PLAN` / `catAt(T)` |
| 303–318 | Camera: `layout()`, `catShot`, `holeShot`, `toWorld` / `toScreen` |
| 320–359 | State: springs `S`, `mouse`, `ch` (letter), `st`; aim `simulate()`, `launchVel()` |
| 361–440 | Input: `skipIntro`, pointer down/move/up (walk vs. slingshot), `endPointer`, `doReset` |
| 442–486 | `spawnHeart`, `doCatch`, `landOrBounce`, `startSlide` |
| 488–665 | `update()` — intro, walking, per-state letter motion and physics, kitty, camera targets, springs |
| 667–760 | `render()` — camera, mouse, kitty, shadows, letter, aim arc, hearts |
| 762–778 | Boot, `ResizeObserver`, main loop |

## Dependencies and assets
None. Inline SVG art, Web Audio synthesized sound, optional `navigator.vibrate`, `ResizeObserver` (all modern browsers). No network requests, fonts, or images.
Run by opening `index.html` in a browser; works with mouse or touch.

## Hooks for connecting to the sequence
- **Entry:** intro begins with the mouse inside a hole — continues naturally from Study 02 ending with the mouse entering its hole.
- **Exit / finale:** `doCatch()` (line ~462) sets `st = 'caught'` — the end of the sequence.
