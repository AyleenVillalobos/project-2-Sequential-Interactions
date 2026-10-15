# project-2-Ayleen

Live site: https://ayleenvillalobos.github.io/project-2-Sequential-Interactions/

## Mouse Messenger — a love letter, carried by a mouse

One continuous, linear sequence built from the three interaction studies in `studies/`:

| | Scene | Gesture (from the study) | Completes when |
|---|---|---|---|
| Opening | Rainy purple night: a small tuxedo cat on a second-floor balcony drops the letter to the mouse below | Tap to begin (also turns sound on), then watch | The mouse grabs the letter ("Got it!") and carries it into the drain tunnel |
| 1 | Sneak past the dogs (new living-room scene) | Drag your finger anywhere and the mouse runs there; two fast dogs bark and chase when they see it | The mouse slips under the glowing door to the tabby's room |
| 2 | Freeze when the dog looks (Study 02) | Drag to sneak; hold **Hide** / Space / a second finger to freeze | The mouse slips into the hole on the right |
| 3 | Fling the cheese to your love (Study 03) | Pull back on the letter and release | The kitty catches the letter → hearts → **Play again** |

Every scene is drawn in a pixel-art look: `docs/js/pixel.js` rasterizes the live scene into a tiny canvas each frame, snaps it to one shared palette with a little dithering, and scales it up with hard edges.

The same letter travels through every scene. Failing inside a step only restarts that step
(as in the studies); the reset button (top-left) restarts the whole sequence.

### Files
- `docs/` — the publishable website (static HTML, CSS and JavaScript, no build step).
  `docs/index.html` is the entry point; `docs/js/scene-*.js` hold one scene each and
  `docs/js/main.js` links them in order. `docs/.nojekyll` is included.
- `studies/` — the original three studies (unzipped from `sequential_interactions.zip`) kept as reference.

### Publishing with GitHub Pages
In the repository's **Settings → Pages**, set the source to branch `main`, folder `/docs`.

### Running locally
Open `docs/index.html` in a browser, or serve the folder (`python3 -m http.server` inside `docs/`).
For review, `index.html?step=1`, `?step=2` or `?step=3` opens directly on that step.
