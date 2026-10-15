# project-2-Ayleen

Live site: https://ayleenvillalobos.github.io/project-2-Sequential-Interactions/

## Mouse Messenger — a love letter, carried by a mouse

One continuous, linear sequence built from the three interaction studies in `studies/`:

| | Scene | Gesture (from the study) | Completes when |
|---|---|---|---|
| Opening | Rainy purple night: a small tuxedo cat on a second-floor balcony drops the letter to the mouse below | Tap to begin (also turns sound on), then watch | The mouse grabs the letter ("Got it!") and carries it into the drain tunnel |
| 1 | Sneak past the dogs (a flat, top-down living room, replaces the old trace-the-route and freeze pages) | Drag your finger anywhere and the mouse runs there; tap a cardboard box or the hole to hide in it | The mouse slips into the mouse hole beside the locked door on the far wall |
| 2 | Fling the cheese to your love (Study 03) | Pull back on the letter and release | The kitty catches the letter → hearts → **Play again** |

In page 1 the room is a flat top-down plan with walls as borders, furniture and a divider wall that block the way and the dogs' sight. Two fast dogs patrol, each with a visible vision cone (like Spy Mouse). When one sees the mouse, red "!!" pops up, it barks and chases; if it catches the mouse, the mouse runs back into the mouse hole and starts over. Hide in a box or hole and the dogs lose you and sniff around until they give up.

Every scene is drawn in a pixel-art look: `docs/js/pixel.js` rasterizes the live scene into a tiny canvas each frame, snaps it to one shared palette with a little dithering, and scales it up with hard edges.

The same letter travels through every scene. Failing inside a step only restarts that step
(as in the studies); the reset button (top-left) restarts the whole sequence.

### Files
- `docs/` — the publishable website (static HTML, CSS and JavaScript, no build step).
  `docs/index.html` is the entry point; `docs/js/scene-*.js` hold one scene each (opening, living room, fling) and
  `docs/js/main.js` links them in order. `docs/.nojekyll` is included.
- `studies/` — the original three studies (unzipped from `sequential_interactions.zip`) kept as reference.

### Publishing with GitHub Pages
In the repository's **Settings → Pages**, set the source to branch `main`, folder `/docs`.

### Running locally
Open `docs/index.html` in a browser, or serve the folder (`python3 -m http.server` inside `docs/`).
For review, `index.html?step=1`, `?step=2` or `?step=3` opens directly on that step.
