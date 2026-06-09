# Life in the Freezers ❄️🐧

A small 2D browser game that complements Moss's school project on the polar
regions. It's reached by scanning a QR code on the final slide of the *Life in
the Freezers* presentation, so it's designed to play equally well on a computer
(keyboard) and a touch-only iPad or phone.

> Pick a region, beat the challenge, and you're rewarded with an animated screen
> of polar facts (taken straight from Moss's slides).

## The game

| Region | You play | Goal | You lose if… |
| --- | --- | --- | --- |
| 🦊 **Arctic** — *Sneaky Fox* | an Arctic fox | Steal the polar bear's fish and carry it back to your den | the bear's sweeping vision cone spots you (hide behind snow mounds!) |
| 🐧 **Antarctic** — *Slippery Slide* | a gentoo penguin | Slide along the ice to the colony | a leopard seal lunging from an ice hole catches you |

Clearing **either** region leads to the **Facts** finale. From there you can play
the other region or return to the menu.

## Controls

Both input methods work everywhere, at the same time:

- **Keyboard:** arrow keys / WASD to move, **Space / Enter** to confirm, **Esc** to leave a stage.
- **Touch:** a virtual joystick appears where you press to move; tap buttons for menus.

## Tech stack

- **[Phaser 3](https://phaser.io/)** — 2D game engine (scenes, input, tweens, particles).
- **[Vite](https://vitejs.dev/)** — dev server with hot reload + optimised static build.
- **TypeScript** — typed game code.

Rendered into a single `<canvas>`, scaled to fit any screen (landscape
1280×720 design resolution via Phaser's `Scale.FIT`). No backend — it's fully
static and runs entirely in the browser.

## Local development

Requires **Node 20+**.

```bash
npm install      # once
npm run dev      # start the dev server with hot reload
npm run build    # type-check (tsc) + production build into dist/
npm run preview  # serve the built dist/ locally to sanity-check
```

`npm run dev` prints a **Local** URL (http://localhost:5173) and a **Network**
URL (e.g. http://192.168.1.153:5173) — open the Network one on a phone/iPad on
the same Wi-Fi to test touch controls on a real device.

### Dev shortcuts (query params)

- `?scene=Arctic` (or `Antarctic` / `Facts` / `GameOver` / `Menu`) — jump straight to a scene.
- `?renderer=canvas` — force Phaser's 2D canvas backend instead of WebGL.

## Project structure

```
src/
├─ main.ts                 # Phaser game config + scene registry
├─ config.ts               # tunable gameplay constants (speeds, ranges, layouts)
├─ input/InputController.ts # shared keyboard + touch input layer
├─ ui/                     # Button, ButtonMenu (keyboard+touch navigable)
├─ data/facts.ts           # polar facts shown on the win screen
└─ scenes/                 # Boot, Preload, Menu, Arctic, Antarctic, Facts, GameOver
orchestra/
└─ full_game_plan.md       # the design + roadmap doc
```

Gameplay is deliberately tuned through constants in [`src/config.ts`](src/config.ts)
(`ARCTIC` and `ANTARCTIC` blocks), so difficulty can be adjusted without touching
game logic.

## Deployment — GitHub Pages

The project builds to a static `dist/` folder that GitHub Pages can serve
directly. Vite's `base` is set to `'./'` (relative paths) so assets resolve
correctly under the Pages project subpath.

Intended deploy style: a GitHub Actions workflow builds on every push to `main`
and publishes `dist/` to Pages.

1. In the repo: **Settings → Pages → Source = GitHub Actions**.
2. Add a workflow (`.github/workflows/deploy.yml`) that runs `npm ci && npm run build`
   and publishes `dist/` via `actions/upload-pages-artifact` + `actions/deploy-pages`.
3. Every push to `main` then republishes the site.

Target URL: **https://mitchest.github.io/polar-game/** — the address the
presentation's QR code points to.

> Status: deploy is set up to be enabled when the game is ready to share; until
> then, develop and play locally with `npm run dev`.

## Credits

Game and polar facts by **Moss**. Built with Phaser, Vite and TypeScript.
