# sequential_interactions

Three interaction studies (Claude Artifact prototypes) for the Project 2 sequential interaction: a mouse delivers a love letter to the kitty.

| # | Study | Interaction | Ends when |
|---|---|---|---|
| 01 | [Trace the Sneak Route](01-trace-the-sneak-route/) | Draw a path from the hole to the letter, avoiding the dog | Mouse reaches and lifts the letter |
| 02 | [Freeze When the Dog Looks](02-freeze-when-the-dog-looks/) | Drag to sneak, hold to freeze while the dog's gaze sweeps | Mouse slips into the hole with the letter |
| 03 | [Fling the Cheese to Your Love](03-fling-the-cheese-to-your-love/) | Walk, then slingshot the letter to the roaming kitty | Kitty catches the letter |

The numbering is a suggested A→B→C order; each study's `STUDY.md` notes its entry state and the exact line where it completes, for wiring them together.

## Running
Each study is a single, dependency-free `index.html` (inline SVG, Web Audio, no external files). Open it directly in a browser, or serve the folder:

```
npx serve .        # or: python3 -m http.server
```

Best viewed in a portrait / mobile viewport. Sound starts after the first tap (browser autoplay rules).
