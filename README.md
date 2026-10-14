# project-2-Ayleen

Live site: https://ayleenvillalobos.github.io/project-2-Sequential-Interactions/

## Sequential interaction prototype — a love letter, carried by a mouse

One continuous, linear sequence built from the three interaction studies in `studies/`:

| | Scene | Gesture (from the study) | Completes when |
|---|---|---|---|
| Opening | The sender cat holds out the letter | Tap the letter | The mouse takes it and hops into the hole |
| 1 | Trace the sneak route (Study 01) | Draw a path from the hole, around the dog | The mouse walks the route into the exit hole |
| 2 | Freeze when the dog looks (Study 02) | Drag to sneak; hold **Hide** / Space / a second finger to freeze | The mouse slips into the hole on the right |
| 3 | Fling the cheese to your love (Study 03) | Pull back on the letter and release | The kitty catches the letter → hearts → **Play again** |

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
