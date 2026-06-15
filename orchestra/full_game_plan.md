# Life in the Freezers — Full Game Plan

A small 2D browser game to complement Moss's school project on the polar
regions. It will be reached by scanning a QR code on the final slide of the
*Life in the Freezers* presentation. The layout is **landscape-first**, and it must be **fully playable with either
keyboard or touch** — some kids will be on a computer, others on a touch-only
iPad or phone, and the game has to work completely on either.

> **Confirmed decisions:** TypeScript · simple programmer art first (upgrade
> later, possibly with Moss's own drawings) · landscape layout · **both keyboard
> and touch are first-class inputs**, supported throughout (not a later add-on).

---

## 1. Concept & goals

- **Theme:** "Life in the Freezers" — two polar mini-games plus an animated
  facts finale, drawn straight from Moss's slides.
- **Audience:** classmates, teachers, family — opened on phones via a QR code.
  Must load fast, run on a mid-range phone, and be playable with no instructions.
- **Tone:** cute, friendly, low-stakes. Quick to win, fun to retry.
- **Length:** ~30–90 seconds per stage. The whole thing is a 2–3 minute experience.

### Design pillars
1. **Plays on keyboard *or* touch — equally.** Both are first-class. Every action
   (move, confirm, retry) is reachable with arrow keys / WASD / space *and* with
   touch. Big readable tap targets so it works on an iPad or a laptop.
2. **Pick-up-and-play.** One clear goal per stage, shown with a one-line hint.
3. **Educational payoff.** Winning a stage rewards you with the animated facts screen.

---

## 2. Structure & flow

```
                 ┌─────────────┐
                 │  Title /    │   "Life in the Freezers — by Moss"
                 │  Main Menu  │   [ Arctic ] [ Antarctic ] [ Migratory ]
                 └──────┬──────┘
            ┌───────────┴───────────┐
            ▼                       ▼
     ┌─────────────┐         ┌──────────────┐
     │   ARCTIC    │         │  ANTARCTIC   │
     │ Fox vs Bear │         │ Penguin vs   │
     │ (stealth)   │         │ Leopard Seal │
     └──────┬──────┘         └──────┬───────┘
       win / lose                win / lose
            │                       │
   lose → Game Over          lose → Game Over
   (Retry / Menu)            (Retry / Menu)
            │                       │
            └──────────┬────────────┘
                  win  ▼
              ┌──────────────────┐
              │  FACTS / VICTORY │  animated polar facts, "by Moss"
              │   (Play again)   │
              └──────────────────┘
```

- Three entry points from the menu: **Arctic**, **Antarctic**, or **Migratory**.
- Clearing **any** stage leads to the animated **Facts** screen (the win
  ending). Players can return to the menu to try the other stages too.
- Losing shows a friendly **Game Over** with **Retry** and **Menu**.

---

## 3. Tech stack & rationale

**Recommendation: Phaser 3 + Vite + TypeScript, deployed to GitHub Pages via GitHub Actions.**

| Choice | Why |
| --- | --- |
| **Phaser 3** | Exactly the right tool for a 2D browser game: scenes, arcade physics, sprite/animation/tween/particle systems, input (keyboard + touch), and an asset loader — all batteries included. Your instinct was good. |
| **Vite** | Instant local dev server with hot reload (`npm run dev`), and a tiny optimised static build (`npm run build`) that drops straight onto GitHub Pages. |
| **TypeScript** | Catches typos and shape mistakes as you write — very helpful in a hobby project you'll dip in and out of. Phaser ships first-class types. *(If you'd rather keep it plain, we can do JavaScript — see Open Decisions.)* |
| **GitHub Actions → Pages** | Push to `main`, it builds and publishes automatically. No manual upload step. |

**Alternatives considered (and why not):**
- *Vanilla Canvas/JS* — total control but we'd hand-build scenes, input, physics,
  and the asset loader. Slower, more bugs, no real upside here.
- *Kaboom/kaplay, PixiJS, melonJS* — all capable, but Phaser has the largest
  tutorial/community footprint for exactly this kind of game, which matters when
  a parent + kid are learning it together.

**Deployed URL (QR target):** `https://mitchest.github.io/polar-game/`

---

## 4. Target platform & responsiveness

- **Two equally-supported setups:** (a) computer with a keyboard, (b) touch-only
  iPad / phone. The game is fully playable on either — no feature is keyboard-only
  or touch-only.
- **Layout:** **landscape**, a fixed design resolution (e.g. **1280 × 720**) scaled
  with Phaser's `Scale.FIT` + `autoCenter`, so it letterboxes cleanly on any screen
  (laptop, iPad, or a phone held sideways). We'll show a gentle "rotate to landscape"
  hint if a phone is held in portrait.
- **Controls — both first-class:**
  - **Keyboard:** arrow keys / WASD to move; **space** (and Enter) to confirm /
    start / retry, and as the in-stage action button where a stage needs one.
  - **Touch:** an on-screen virtual joystick / drag-to-move for free movement, plus
    large tap buttons for menus, confirm, and any action.
  - Both feed **one shared input layer** (`InputController`) that exposes a simple
    intent — e.g. a movement vector + an "action" press — so gameplay code never
    cares whether it came from a key or a finger. This is built up front (M0), so
    every stage supports both inputs as it's made.
  - Auto-detect which control hints to show (key prompts vs. on-screen buttons)
    from whether touch is being used, but keep both live at all times (e.g. a
    touchscreen laptop works either way).
- **Performance budget:** keep total assets small (target < ~3 MB) so it loads in
  a few seconds, even on phone data. Prefer lightweight art over large photos.

---

## 5. Project structure (scaffold)

```
polar-game/
├─ index.html                  # mount point + meta viewport (mobile)
├─ package.json
├─ vite.config.ts              # base: './' (relative) so it works under the Pages subpath
├─ tsconfig.json
├─ .github/workflows/deploy.yml
├─ public/
│  └─ assets/
│     ├─ images/               # sprites, backgrounds, UI
│     └─ audio/                # sfx, ambience (optional)
├─ src/
│  ├─ main.ts                  # Phaser.Game config + scene registry
│  ├─ config.ts                # tunable constants (speeds, ranges, sizes)
│  ├─ scenes/
│  │  ├─ BootScene.ts          # set scale/input, hand to Preload
│  │  ├─ PreloadScene.ts       # load assets + loading bar
│  │  ├─ MenuScene.ts          # title + Arctic/Antarctic/Migratory buttons
│  │  ├─ ArcticScene.ts        # fox vs polar bear (stealth)
│  │  ├─ AntarcticScene.ts     # penguin vs leopard seals (dodge)
│  │  ├─ MigratoryScene.ts     # arctic tern flight, dodge breaching orcas (Issue #5)
│  │  ├─ FactsScene.ts         # animated win/facts ending
│  │  └─ GameOverScene.ts      # retry / menu
│  ├─ objects/
│  │  ├─ Fox.ts
│  │  ├─ PolarBear.ts          # + rotating vision cone
│  │  ├─ Penguin.ts
│  │  ├─ LeopardSeal.ts
│  │  └─ VisionCone.ts         # cone draw + line-of-sight test
│  ├─ ui/
│  │  ├─ Button.ts
│  │  └─ VirtualJoystick.ts
│  └─ data/
│     └─ facts.ts              # the polar facts content (from the slides)
├─ orchestra/                  # planning docs (this file)
└─ README.md
```

---

## 6. Gameplay design

### 6a. Arctic — "Sneaky Fox" (stealth / line-of-sight)

> An Arctic fox sneaks up on a polar bear to steal its food, hiding behind snow
> mounds. If the bear sees you, it's game over.

- **View:** top-down.
- **Player:** the fox, moved smoothly in any direction — **arrow keys / WASD** on a
  keyboard, or **virtual joystick / drag** on touch (both via the shared input layer).
- **The bear:** sits near its food (a fish). It has a **vision cone** that slowly
  **sweeps back and forth** (rotates). Telegraphed and predictable so it feels fair.
- **Snow mounds:** scattered obstacles that **block the bear's line of sight** — the
  fox is safe in their "shadow" even when the cone points its way.
- **Goal:** reach the food without being caught in the cone, grab it, and slip back
  to the start (a short there-and-back run).
- **Lose:** the fox is inside the cone, within range, and not hidden behind a mound
  → "The polar bear saw you!" → Game Over.
- **Win:** food retrieved and fox returns to the den → Facts screen.
- **How line-of-sight works (implementation):** each frame, check whether the fox is
  (a) within the bear's facing angle (± cone half-angle) and (b) within range, then
  (c) raycast from bear to fox and see if any snow mound (circle) blocks it. Only if
  all three are true is the fox "seen". This is cheap and easy to tune.
- **Tuning knobs (`config.ts` → `ARCTIC`):** sweep speed, cone angle, cone range, fox
  speed, number/placement of mounds, and the spotting timer.
- **As built (M1):** a "!" alert + a **detection meter** fills while you're seen and
  cools while you hide. Spotting timer is **~0.5 s** of continuous sight to be caught
  (tuned up from a gentler default — the stage was too easy). Cone ≈ 27° half-angle,
  ~620 px range, slow back-and-forth sweep, 10 snow mounds (a central cluster plus a
  periphery ring so you can't just hug the outside wall). **Touching the bear itself is
  also an instant catch.**
- **Polish later:** footprints in the snow; nicer bear/fox art.

### 6b. Antarctic — "Slippery Slide" (dodge / runner)

> A gentoo penguin toboggans along the ice. Leopard seals burst out of holes and
> lunge at it. If a seal catches you, it's game over.

- **View:** top-down; the ice **scrolls past** beneath the penguin (which sells the
  forward slide) and speeds up over the run. A progress bar shows how close the colony is.
- **Player:** steer the penguin across the ice with **slippery ice momentum**:
  **←/→ (or A/D)** to move sideways, and **↑/↓ (or W/S)** to slide **faster/forward** or
  **ease back/slower** — a second dodge axis. On touch, the virtual joystick handles all
  directions. The slidey momentum makes it feel like tobogganing without being frustrating.
- **Hazards:** **holes** scroll in, pulse a warning, then a **leopard seal lunges out**
  toward where the penguin is, then carries on past. Spacing ramps up gently.
- **Goal:** survive the run — reach the colony (the progress bar fills).
- **Lose:** a seal's lunge overlaps the penguin → "A leopard seal caught you!" → Game Over.
- **Win:** progress bar full → Facts screen.
- **Tuning knobs (`config.ts` → `ANTARCTIC`):** scroll speed ramp, steer speed,
  slipperiness, hole frequency, seal lunge speed, telegraph timing, run length, the
  penguin's vertical range, and hitbox forgiveness.
- **As built (M2):** seals lunge **gently** (lunge speed tuned down — the stage was too
  hard), gradual speed ramp, ~22 s run, forgiving hitbox. Up/down speed control
  was added in response to playtesting.
- **Polish later:** belly-slide animation, splash particles, fish to collect for score.

### 6c. Migratory — "The Great Flight" (side-on flyer, Issues #5, #6)

> An Arctic tern flies the open ocean from the South Pole to the North Pole —
> the longest migration of any animal. Orcas below and seabirds above try to stop it.

- **View:** side-on. Sky above, ocean below; the tern holds a fixed spot on
  screen while the sea (waves, parallax clouds and distant ice) scrolls past.
- **Player:** the tern. **↑ fly higher / ↓ fly lower** — a gentle constant glide-
  sink means staying high takes a little ongoing flapping — and **→ faster / ←
  slower** for forward speed (Issue #6 swapped these and widened the swing 50%).
  Keyboard arrows/WASD or the touch joystick.
- **Hazards (they alternate):** **orcas** breach **straight up** out of the tern's
  column — a boil of bubbles warns you, then the orca rises through every height
  there, so the only way past is to **climb above its peak**. **Seabirds**
  (albatrosses & petrels, Issue #6) **hover up high** and *don't* chase — they
  just block the ceiling so you **dip back down** under them. Orca and bird are
  spaced **by distance**, so they never share your column: there's always a safe
  gap, but you can camp at neither the water nor the sky. Touch either = caught.
- **Goal:** reach the North Pole — a distance-based progress bar fills, S → N.
- **Lose:** an orca or a seabird overlaps the tern → Game Over.
- **Win:** progress bar full → Facts screen.
- **Track length:** the base run equals the penguin track (6900 px); **Hard
  stretches it 20% longer** (Issue #6).
- **Tuning knobs (`config.ts` → `MIGRATORY`):** flight speeds, gravity/flap/dive,
  run distance, hazard spacing, orca breach height + variation, the seabird band, hitboxes.
- **Difficulty:** Easy shortens the flight, speeds the tern ~10%, weakens orca
  breaches and has ~10% more hazards; Hard is the base tuning but 20% longer with
  ~69% more orcas + seabirds (two +30% bumps) — picked on the same Easy/Hard
  screen as the others.
- **Art:** hand-authored SVG **Arctic tern** (white/pale-grey, black cap, red bill,
  forked tail), **orca** (black, white belly/eye-patch, tall dorsal fin), and a
  gliding **albatross/petrel** seabird (long dark wings, hooked pale bill).

### 6d. Facts / Victory ending (the educational payoff)

- Triggered on winning **any** stage. Celebratory but calm.
- **Animation:** snow/particle backdrop, fact cards that fade/slide in one at a time,
  small icons per fact, a gentle title reveal, and a "by Moss" credit.
- **Buttons:** "Play the other stage" and "Back to menu" / "Play again".
- **Content** (pulled directly from the slides — see `src/data/facts.ts`):

  **Arctic**
  - The Arctic sits at the very top of the planet, above an imaginary line called the *Arctic Circle*.
  - It's made of the Arctic Ocean plus parts of Canada, Russia, the USA, Greenland, Norway, Finland, Sweden and Iceland.
  - Because Earth tilts, each year the Arctic gets at least one full day of darkness — *and* one full day of sunshine!
  - Arctic wildlife includes polar bears, Arctic foxes, walruses, seals and whales.
  - The narwhal is the "sea unicorn" — male narwhals have a tusk that can grow **over 3 metres** long.

  **Antarctic**
  - Penguins are Antarctica's most famous animals — flightless birds, well adapted but not very adaptable.
  - Tiny microbes near the surface of the Southern Ocean power the food chain, carrying food from the sunlit surface down to animals in the dark depths.
  - Coelacanths — a rare fish thought to have lived in the same form for **400 million years** — can be found in Antarctic waters.
  - Antarctica is fragile but mighty: huge landscapes and teeming wildlife colonies.

  **Migratory (Arctic tern)**
  - The Arctic tern makes the longest migration of any animal — Arctic to Antarctic and back, every year.
  - That round trip can be about **70,000 km** — like flying nearly twice around the world a year.
  - Chasing summer at both ends of the Earth, it sees more daylight than almost any animal.
  - Over its life it can fly roughly the distance to the **Moon and back — three times**.

---

## 7. Art & audio

- **Art direction:** friendly and readable on a small screen, now with a touch of
  realism — recognisable animals rather than abstract shapes.
- **Started as:** **programmer art** drawn with Phaser graphics primitives (circles,
  ellipses, triangles assembled into containers), so the whole game was playable
  end-to-end before polishing visuals.
- **Now (first art upgrade):** characters are **hand-authored SVG sprites** in
  `public/assets/images/` — an Arctic fox (white/light-blue), a full-body cream polar
  bear, a cod, a belly-sliding gentoo penguin, and an angry leopard seal — plus craggy
  SVG ice holes. They're loaded in `PreloadScene` at `scale: 2` (rasterised at 2× for
  crispness) and drawn at `setScale(0.5)`. Backgrounds, the vision cone, snow mounds and
  HUD bars stay as Phaser `Graphics`. SVGs are tiny (~28 KB total), scale cleanly, and
  keep gameplay code, hitboxes and `config.ts` untouched — only the `makeX` sprite
  factories changed. **Why SVG over raster PNG:** authored entirely in-repo (no external
  asset pipeline), tiny for fast phone loading, crisp at any scale, and still tweakable.
- **Upgrade path:** the SVGs are plain editable vector files; nicer art — *possibly
  drawings Moss makes*, or CC0 packs (e.g. Kenney.nl) — can drop into the same `load`
  slots without touching gameplay code. (We will **not** ship the photos from the
  PowerPoint as game art — they're great references but the wrong style/licensing for
  sprites.)
- **Audio (optional / stretch):** a soft wind ambience, plus short SFX for "caught"
  and "win". CC0 sources only. Muted by default with a tap-to-enable toggle (phones
  block autoplay audio anyway).
- **Licensing rule:** only CC0 / original art and audio ship in the repo, tracked in a
  short `CREDITS.md`.

---

## 8. Deployment & local dev

### Local
- `npm install` — once.
- `npm run dev` — local dev server with hot reload (test in your laptop browser; also
  reachable from your phone on the same Wi-Fi via the network URL Vite prints).
- `npm run build` — production build into `dist/`.
- `npm run preview` — serve the built `dist/` locally to sanity-check before pushing.

### GitHub Pages (automatic, via GitHub Actions — chosen approach)
- **Why Actions, not plain branch-deploy:** Pages' "deploy from a branch" serves files
  *as-is* and does **not** run a build, so it can't serve this Vite/TypeScript app
  directly. A small Action builds it for us and keeps build output out of git.
- `vite.config.ts` sets `base: './'` (relative paths), which resolves correctly under
  the Pages project subpath without hard-coding the repo name.
- `.github/workflows/deploy.yml`: on push to `main` (or a manual run), runs `npm ci` +
  `npm run build`, then publishes `dist/` via `actions/configure-pages` +
  `actions/upload-pages-artifact` + `actions/deploy-pages`.
- One-time: in the repo, **Settings → Pages → Build and deployment → Source = GitHub Actions**.
- Result: every push to `main` republishes `https://mitchest.github.io/polar-game/`.
- **QR code:** generate one pointing at that URL and drop it on slide 4 of the deck.

---

## 9. Milestones / roadmap

Each milestone is a working, playable build. (We chose to develop locally first and
wire up deploy once a prototype was working, rather than deploy-first.)

- **M0 — Scaffold & input layer.** ✅ **Done.** Vite + Phaser + TS skeleton,
  Boot/Preload/Menu scenes, the **shared keyboard+touch `InputController`** (so every
  later stage gets both inputs for free). Menu drivable by both keyboard and tap; verified
  on desktop and a phone via the dev server.
- **M1 — Arctic.** ✅ **Done.** Fox movement, bear with sweeping vision cone, snow-mound
  line-of-sight occlusion, detection meter, win/lose, hint text. Tuned harder (0.5 s spotting).
- **M2 — Antarctic.** ✅ **Done.** Sliding penguin with ←→/↑↓ control, seal holes + lunges,
  progress bar, win/lose. Tuned easier (slower seals) + added vertical speed control.
- **Deploy pipeline.** ✅ **Done (workflow added).** GitHub Actions builds + publishes on
  push to `main`; remaining one-time step is flipping **Settings → Pages → Source = GitHub Actions**.
- **M3 — Facts ending.** *Next.* A first version exists (fact cards + falling snow + nav);
  M3 gives it the full animated treatment.
- **M4 — Polish.** Transitions, difficulty tuning from real playtests, optional audio +
  mute toggle, control-hint glyphs, real-device checks on a keyboard machine and a
  touch-only iPad/phone.
- **M6 — Migratory region (Issues #5, #6).** ✅ **Done.** A third stage: a side-on
  Arctic-tern flight from the South Pole to the North Pole. Two alternating hazards
  — orcas breaching straight up from the sea (climb over them) and seabirds hovering
  up high (dip under them) — so you can camp at neither extreme; spaced by distance
  so they never pinch you. ↑↓ height / →← speed (→ faster), Easy/Hard with a 20%
  longer Hard run, and a new Arctic-tern facts finale. Hand-authored tern, orca and
  albatross/petrel SVGs in the existing style.
- **M5 — Art pass & ship.** *In progress.* First art upgrade done — programmer-art
  characters replaced with hand-authored **SVG sprites** (Arctic fox, full-body polar
  bear, cod, belly-sliding penguin, angry leopard seal, craggy ice holes). Remaining:
  final tuning, generate the QR code, final deploy. (Optional: drop in Moss's own
  drawings via the same `load` slots.)

---

## 10. Risks & mitigations

- **Mobile input feel** is the biggest risk — get the joystick/steering feeling good
  early (M1) rather than at the end.
- **GitHub Pages base-path gotchas** (broken asset URLs) — solved by setting `base`
  correctly and verified in M0 before any gameplay exists.
- **Scope creep** — mechanics are deliberately minimal; score, audio, and fancy art
  are all explicitly "later / optional".
- **Difficulty** — start everything forgiving; it's a fun complement to a school
  project, not a challenge game.

---

## 11. Decisions (confirmed)

1. **Language:** TypeScript.
2. **Art:** started with simple programmer art; **first upgrade now done** — characters
   are hand-authored **SVG sprites** (loaded at `scale: 2`, drawn at `0.5`). Can be
   swapped again later — possibly with Moss's own drawings of the fox / penguin / etc.
3. **Layout & input:** **landscape** (1280 × 720). **Keyboard and touch are both
   first-class**, supported in every scene from M0 onward via one shared input layer —
   the game is fully playable on a keyboard computer *or* a touch-only iPad/phone.

Next step on your go-ahead: **M0** — scaffold the project (Vite + Phaser + TS) and get
a live "hello" build on GitHub Pages before building any gameplay.
