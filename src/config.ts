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
  foxSpeed: 270,
  foxRadius: 16,

  bear: { x: 640, y: 140 },
  den: { x: 640, y: 632, radius: 72 },
  food: { x: 640, y: 252 },

  // Vision cone (angles in degrees; converted to radians in the scene).
  coneRange: 470,
  coneHalfAngleDeg: 27,
  sweepBaseDeg: 90, // straight down toward the play area
  sweepAmplitudeDeg: 54,
  sweepPeriodMs: 3800, // one full left-right-left sweep

  // Detection: how long continuous sight takes to catch you (~half a second).
  detectTimeMs: 500,
  detectDecayMult: 1.8, // alarm cools this many times faster than it fills

  // Snow mounds that block line of sight: {x, y, r}.
  mounds: [
    { x: 430, y: 300, r: 58 },
    { x: 850, y: 300, r: 58 },
    { x: 600, y: 430, r: 66 },
    { x: 800, y: 520, r: 58 },
    { x: 410, y: 520, r: 58 },
    { x: 640, y: 600, r: 50 },
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
  runDurationMs: 30000, // survive this long to reach the colony

  // Hole spawning (interval shrinks over the run as it speeds up).
  spawnIntervalStartMs: 1250,
  spawnIntervalEndMs: 720,

  warnY: 300, // hole shows a ripple/telegraph here
  triggerY: 450, // seal lunges when a hole passes here
  sealLungeSpeed: 120, // added on top of scroll speed, aimed at the penguin
  sealRadius: 26,
  hitDistance: 38, // forgiving penguin-vs-seal overlap
} as const;
