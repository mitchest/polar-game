# Life in the Freezers ❄️

A small 2D browser game that complements Moss's school project on the polar
regions. It's reached by scanning a QR code on the final slide of the *Life in
the Freezers* presentation, so it's designed to play equally well on a computer
(keyboard) and a touch-only iPad or phone.

### Live game URL:
**https://mitchest.github.io/polar-game/**  
> Pick a region, beat the challenge, and you're rewarded with an animated screen
> of polar facts (taken straight from Moss's slides).

## The game

| Region | You play | Goal | You lose if… |
| --- | --- | --- | --- |
| **Arctic** — *Sneaky Fox* | an Arctic fox | Steal the polar bear's fish and carry it back to your den | the bear's sweeping vision cone spots you (hide behind snow mounds!) |
| **Antarctic** — *Slippery Slide* | a gentoo penguin | Slide along the ice to the colony | a leopard seal lunging from an ice hole catches you |
| **Migratory** — *The Great Flight* | an Arctic tern | Fly the ocean from the South Pole to the North Pole (↑↓ height, → faster, ← slower) | an orca breaching from the sea — or a seabird hovering up high — catches you (climb over the orcas, dip under the birds!) |

After picking a region you choose **Easy** or **Hard**. Hard is the game as
designed; Easy is a gentler version (in the Arctic: a quicker fox, a slower bear
and more time before it spots you — in the Antarctic: slower seals and a shorter
slide — in the Migratory flight: a shorter trip, a faster tern and gentler orca
breaches). Clearing **any** region leads to the **Facts** finale. From there you
can play another region or return to the menu.

## Controls

Both input methods work everywhere, at the same time:

- **Keyboard:** arrow keys / WASD to move, **Space / Enter** to confirm, **Esc** to leave a stage.
- **Touch:** a virtual joystick appears where you press to move; tap buttons for menus.

## How this was made and works — a K-6 explanation

*A friendly walk-through you can read out loud to a class, or use as talking
points. Each idea has a simple picture to imagine — and the grown-up details are
all in the sections below this one.*

### What is a computer game, really? 🧑‍🍳

A game is a really, really long **list of instructions** that a computer follows
super fast — like the world's pickiest recipe. The computer does *exactly* what
the instructions say, even if it's silly. So our job was to write very clear
instructions: "draw a fox here," "when the player presses → move it right,"
"if the bear sees the fox, show GAME OVER." Writing those instructions is called
**coding**, and the instructions are called **code**.

### Our toolbox 🧰

We didn't build everything from scratch — we used some ready-made helpers, the
same way you'd use LEGO instead of carving every brick yourself:

- **TypeScript** — the *language* we wrote the instructions in. It's like writing
  with a built-in spell-checker that says "hey, did you mean this?" so we make
  fewer silly mistakes.
- **Phaser** — a giant **box of game LEGO**. It already knows how to draw
  pictures, move them around, listen for taps and key presses, and play
  animations. We just tell it *what* to do.
- **Vite** — a speedy **helper that builds the game**. While we work, it shows
  our changes on the screen almost instantly, so we can try an idea and see it
  right away.
- **SVG pictures** — the fox, polar bear, penguin and seal are drawn with **math
  shapes** instead of photos. That means they stay crisp and never get blurry, no
  matter how big the screen, and the files are tiny so the game loads fast.

### How we built it with an AI helper (agentic coding) 🤖

This game was made by a person working together with an **AI coding helper** (an
"LLM" — a computer program that's very good with language, like Claude). Here's
the fun part — instead of typing every line of code by hand, the person could ask
for things in **plain English**, like talking to a clever helper:

> "Make the fox move a little faster." · "Add more snow mounds so it's harder."
> · "If the fox touches the bear, it should get caught." · "Put a link to the
> code on the menu."

The AI helper then **does the actual work, step by step** — this is what
*"agentic"* means: the AI doesn't just *talk*, it *takes actions* to reach a
goal, like a helper that can use tools:

1. **Reads** the existing code to understand how the game works.
2. **Writes or changes** the instructions to add the new idea.
3. **Runs** the game to check it works and looks for mistakes (called *bugs*).
4. **Fixes** anything that broke, then shows the result.

And the **person is still the boss** 👑 — they decide what the game should be,
play-test it to make sure it's *fun*, correct, and kind, and give feedback like a
coach: "great, but make it 10% slower." Then the loop goes round again. It's
teamwork: the human has the ideas and the taste, the AI does a lot of the typing
and checking.

### How the game gets onto the internet 🌍

Writing the game on one computer isn't enough — your friends need to play it on
*their* phones and tablets. Here's how it travels:

- **GitHub** — a safe place on the internet to keep all the code, like a magic
  backpack that remembers *every* version. If something breaks, you can go back
  to how it was yesterday.
- **GitHub Actions** — a **robot assistant** that wakes up every time we save new
  code. It automatically builds the game and publishes the newest version — no
  buttons to push.
- **GitHub Pages** — turns our code into a **real website** anyone can visit at
  [the live URL](https://mitchest.github.io/polar-game/).
- **The QR code** — that little square of dots on the last slide of the
  presentation. A phone camera reads it like a secret code and jumps **straight
  to the game's web address** — no typing needed!

### Questions to ask the class 🙋

- A computer follows instructions *exactly*. Can you give me instructions to draw
  a square? What happens if you forget a step?
- Why is it handy to keep *every* old version of your work (like GitHub does)?
- The AI helper is great at typing code, but a *person* decides if the game is fun
  and fair. Why do you think the human part still really matters?
- What would *you* add to the game? (More animals? A new level? Sounds?) How would
  you describe it so a helper knew exactly what to build?

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

- `?scene=Arctic` (or `Antarctic` / `Migratory` / `Difficulty` / `Facts` / `GameOver` / `Menu`) — jump straight to a scene.
- `?renderer=canvas` — force Phaser's 2D canvas backend instead of WebGL.

## Project structure

```
public/assets/images/      # hand-authored SVG character sprites
src/
├─ main.ts                 # Phaser game config + scene registry
├─ config.ts               # tunable gameplay constants (speeds, ranges, layouts)
├─ input/InputController.ts # shared keyboard + touch input layer
├─ ui/                     # Button, ButtonMenu (keyboard+touch navigable)
├─ data/facts.ts           # polar facts shown on the win screen
└─ scenes/                 # Boot, Preload, Menu, Arctic, Antarctic, Migratory, Facts, GameOver
orchestra/
└─ full_game_plan.md       # the design + roadmap doc
```

Gameplay is deliberately tuned through constants in [`src/config.ts`](src/config.ts)
(`ARCTIC` and `ANTARCTIC` blocks), so difficulty can be adjusted without touching
game logic.

## Graphics

Characters (fox, polar bear, cod, penguin, leopard seal, Arctic tern, orca) and
the craggy ice holes are **hand-authored SVG sprites** in
[`public/assets/images/`](public/assets/images/). They're loaded in
[`PreloadScene`](src/scenes/PreloadScene.ts) at `scale: 2` (rasterised at 2× so
they stay crisp on high-DPI screens) and drawn at `setScale(0.5)`, so each
sprite renders at its authored size. Backgrounds, the vision cone, snow mounds,
and HUD bars are still drawn with Phaser `Graphics`.

SVGs are tiny (~28 KB total), scale cleanly, and are plain editable vector
files — so they can be tweaked, or swapped for nicer art (e.g. Moss's own
drawings) by dropping replacements into the same `load` slots, without touching
gameplay code.

## Deployment — GitHub Pages

Deployed automatically by **GitHub Actions**. The workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds the Vite
app and publishes `dist/` to GitHub Pages on every push to `main` — no build
output is committed to the repo. Vite's `base` is `'./'` (relative paths), so
assets resolve correctly under the Pages project subpath.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment
→ Source = GitHub Actions**. After that, each push to `main` rebuilds and
republishes the site (you can also trigger it manually from the **Actions** tab).

Live URL: **https://mitchest.github.io/polar-game/** — the address the
presentation's QR code points to.

## Credits

Game and polar facts by **Moss**. Built with Phaser, Vite and TypeScript.
