// Central tunables. Keep gameplay numbers here so they're easy to tweak later.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Colours used across scenes. Numeric (0x...) for Phaser fills, strings for CSS/text.
export const COLORS = {
  menuBg: 0x0e2233,
  menuBgCss: '#0e2233',

  arcticSnow: 0xeaf6fb,
  arcticShadow: 0xc8e4f2,

  antarcticIce: 0xd2effb,
  antarcticWater: 0x2f7bb0,

  fox: 0xe8a14b,
  penguin: 0x23262b,

  text: '#ffffff',
  textDark: '#0e2233',
  textMuted: '#9fc1d6',

  accent: 0x4aa3df,
  accentHi: 0x7fc4ef,
} as const;

// Placeholder player speed kept for any quick sandboxing (pixels/second).
export const PLAYER_SPEED = 320;

// --- Arctic: "Sneaky Fox" stealth tuning -----------------------------------
export const ARCTIC = {
  foxSpeed: 297, // 10% faster than the old 270
  foxRadius: 16,

  // Layout spread out from its old footprint (~10% each axis ≈ 20% more area)
  // so the run between the bear and the den feels more expansive. Bounded by the
  // fixed 1280×720 design canvas (the den now sits right at the bottom edge).
  bear: { x: 640, y: 124 },
  den: { x: 640, y: 648, radius: 72 },
  food: { x: 640, y: 240 },

  // Touch the bear and you're caught (radius around the bear's body, which is
  // ~180×160 px). Smaller than the visible body so grabbing the fish from below
  // stays safe — only walking into the bear catches you.
  bearCatchRadius: 70,

  // Vision cone (angles in degrees; converted to radians in the scene).
  coneRange: 900, // reaches the side edges / lower corners of the screen
  coneHalfAngleDeg: 27,
  sweepBaseDeg: 90, // straight down toward the play area
  sweepAmplitudeDeg: 68, // sweeps fully out to the left and right sides
  sweepPeriodMs: 3800, // one full left-right-left sweep

  // Detection: how long continuous sight takes to catch you (~a fifth of a second).
  detectTimeMs: 200,
  detectDecayMult: 1.8, // alarm cools this many times faster than it fills

  // Snow mounds that block line of sight AND block movement: {x, y, r}.
  // The central cluster, plus a ring of periphery mounds near the side/lower
  // edges so you can't just hug the outside wall to slip past the bear.
  // (All kept clear of the fox's start/den so the collision doesn't shove the
  // fox on spawn.)
  mounds: [
    { x: 410, y: 295, r: 58 },
    { x: 870, y: 295, r: 58 },
    { x: 595, y: 434, r: 66 },
    { x: 815, y: 532, r: 58 },
    { x: 410, y: 532, r: 58 },
    { x: 640, y: 562, r: 50 },
    // periphery ring
    { x: 160, y: 400, r: 56 },
    { x: 1120, y: 400, r: 56 },
    { x: 205, y: 618, r: 52 },
    { x: 1075, y: 618, r: 52 },
    // corners — cover so the now-wider cone can't pin you in an open corner.
    { x: 120, y: 150, r: 56 },
    { x: 1160, y: 150, r: 56 },
    { x: 120, y: 660, r: 54 },
    { x: 1160, y: 660, r: 54 },
  ],
} as const;

// --- Antarctic: "Slippery Slide" toboggan run tuning -----------------------
export const ANTARCTIC = {
  penguinStartX: 640,
  penguinStartY: 560,
  penguinMinY: 350, // ↑ = slide faster / push forward (riskier)
  penguinMaxY: 648, // ↓ = ease off / hang back (safer)
  penguinRadius: 22,
  edgeMargin: 90,

  steerAccel: 2400, // px/s^2 from input (both axes)
  steerMaxSpeed: 470,
  iceFriction: 2.6, // low = slidey glide when you let go

  scrollSpeedStart: 240,
  scrollSpeedEnd: 380,
  // Distance (px of ice) to the colony. Progress is distance-based, so holding
  // the forward boost actually gets you there sooner. ~6900 ≈ a 22.5 s run at
  // the base speed ramp with no boosting.
  runDistance: 6900,

  // Forward boost (hold ↑). Adds to the scroll speed while held, so the world
  // rushes past and you reach the colony faster — but it's metered: a full
  // meter is boostMaxMs of boosting, and it recharges boostRechargeMult× as
  // fast as it drains whenever you're not boosting.
  boostScrollBonus: 200,
  boostMaxMs: 5000,
  boostRechargeMult: 2,

  // Hole spawning (interval shrinks over the run as it speeds up).
  spawnIntervalStartMs: 1250,
  spawnIntervalEndMs: 720,

  warnY: 300, // seal head starts emerging from the hole here
  triggerY: 450, // seal lunges when a hole passes here
  sealLungeSpeed: 86.4, // added on top of scroll speed, aimed at the penguin (10% slower than the old 96)
  sealRadius: 26,
  hitDistance: 38, // forgiving penguin-vs-seal overlap
  // Charge forward (up) into a seal ahead of you at least this fast and you bonk
  // it spinning off-screen instead of being caught.
  chargeDeflectSpeed: 200,
} as const;

// --- Difficulty modes (Issue #3) -------------------------------------------
// Players pick Easy or Hard before each stage. **Hard = the base tuning above**
// (the game as originally designed). Easy derives a gentler version, changing
// only the few numbers below — everything else (layout, cone shape, hole timing)
// is identical in both modes.
export type Difficulty = 'easy' | 'hard';

/**
 * Arctic tuning for the chosen difficulty.
 * Easy: the fox is 10% faster, the bear's gaze sweeps 20% slower, and it takes
 * 20% longer caught in the cone before you're spotted.
 */
export function arcticTuning(difficulty: Difficulty) {
  const easy = difficulty === 'easy';
  return {
    foxSpeed: easy ? ARCTIC.foxSpeed * 1.1 : ARCTIC.foxSpeed,
    sweepPeriodMs: easy ? ARCTIC.sweepPeriodMs / 0.8 : ARCTIC.sweepPeriodMs, // 20% slower sweep
    detectTimeMs: easy ? ARCTIC.detectTimeMs * 1.2 : ARCTIC.detectTimeMs,
  };
}

/**
 * Antarctic tuning for the chosen difficulty.
 * Easy: seals lunge 30% slower and the slide to the colony is 30% shorter.
 * (The issue left the seal slowdown open; 30% mirrors the shorter track for a
 * consistent "about a third gentler" feel — tweak the 0.7 below to taste.)
 */
export function antarcticTuning(difficulty: Difficulty) {
  const easy = difficulty === 'easy';
  return {
    sealLungeSpeed: easy ? ANTARCTIC.sealLungeSpeed * 0.7 : ANTARCTIC.sealLungeSpeed,
    runDistance: easy ? ANTARCTIC.runDistance * 0.7 : ANTARCTIC.runDistance,
  };
}
