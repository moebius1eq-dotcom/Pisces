// Shared jigsaw profile for physical pieces and GPU impostors.
export const CELL = 1.6, COLS = 31, ROWS = 17;
export const clamp = n => Math.max(0, Math.min(1, n));
export const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const compositionBounds = { left: -COLS * CELL / 2, right: COLS * CELL / 2,
  bottom: -ROWS * CELL / 2, top: ROWS * CELL / 2 };
export const CONTENT = ['earth', 'moon', 'saturn', 'jupiter', 'mars', 'coordinates', 'sphere',
  'orbit', 'parallax', 'spectrum', 'stars', 'solar', 'galaxy', 'geometry', 'nebula', 'blackhole', 'telescope', 'cosmicweb'];
export function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
// CCW: top/right tabs match bottom/left sockets. The neck folds back before
// the rounded cap, making a genuine jigsaw contour instead of a wavy square.
export function puzzleOutline(samples = 5) {
  const path = [], corners = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], signs = [-1, 1, 1, -1];
  const curves = [
    [[.35, 0], [.44, 0], [.43, .035], [.39, .09]],
    [[.39, .09], [.29, .22], [.39, .28], [.5, .28]],
    [[.5, .28], [.61, .28], [.71, .22], [.61, .09]],
    [[.61, .09], [.57, .035], [.56, 0], [.65, 0]],
  ];
  for (let edge = 0; edge < 4; edge++) {
    const a = corners[edge], b = corners[(edge + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1];
    const point = (t, v) => path.push([(a[0] + dx * t + dy * v * signs[edge]) * CELL,
      (a[1] + dy * t - dx * v * signs[edge]) * CELL]);
    point(0, 0); point(.35, 0);
    for (const c of curves) for (let j = 1; j <= samples; j++) {
      const t = j / samples, q = 1 - t;
      point(q ** 3 * c[0][0] + 3 * q * q * t * c[1][0] + 3 * q * t * t * c[2][0] + t ** 3 * c[3][0],
        q ** 3 * c[0][1] + 3 * q * q * t * c[1][1] + 3 * q * t * t * c[2][1] + t ** 3 * c[3][1]);
    }
    point(1, 0);
  }
  return path;
}
// Authored close encounters on the camera flight. Background locations are seeded.
const encounters = [
  ['earth', [.2, .5, 11], [0, .16, .12], 2.4],
  ['moon', [3.4, 2.6, 5], [.2, -.3, -.25], 2.5],
  ['coordinates', [-3.7, -1.8, 0], [-.25, .2, -.25], 2.2],
  ['saturn', [-6.2, .6, -12], [.1, -.15, .18], 3.8],
  ['sphere', [-.4, 3.8, -14], [-.3, .5, .15], 2.5],
  ['galaxy', [3, -1.3, -22], [.1, .15, -.3], 3.5],
  ['nebula', [7.5, 3.4, -32], [-.12, -.3, .3], 4.3],
  ['blackhole', [-2.2, -3.8, -34], [.25, .25, -.25], 3.2],
  ['telescope', [-7.6, 5, -26], [.1, .3, .2], 2.7],
  ['solar', [8.4, -4, -18], [-.4, -.15, -.2], 3],
  ['jupiter', [-12, -5, -5], [.2, -.4, .3], 3],
  ['spectrum', [2, 5, -5], [.15, -.2, -.15], 2.4],
  ['orbit', [11, 4, -3], [.3, -.4, .2], 2.2],
  ['geometry', [-9, -2, -22], [-.2, .2, -.2], 2.6],
  ['parallax', [9, 2, -42], [.1, .5, -.3], 3.5],
  ['cosmicweb', [-8, 7, -45], [-.2, -.3, .25], 4],
  ['stars', [15, 10, -16], [.4, -.3, .2], 2.4],
  ['mars', [-16, 9, -30], [.2, .1, -.2], 2.8],
  ['galaxy', [-3.4, 2.7, -21], [0, 0, 0], 1.5],
  ['galaxy', [-1, 2.7, -21], [0, 0, 0], 1.5],
  ['galaxy', [1.4, 2.7, -21], [0, 0, 0], 1.5],
  ['coordinates', [4, -4, -8], [.6, .3, -.2], 2],
  ['nebula', [-15, 1, -40], [.2, -.4, .5], 3],
];
const rng = random(813);
const heroCells = encounters.map((_, i) => (5 + Math.floor(i / 8) * 3) * COLS + 5 + (i % 8) * 3);
const keyIndex = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
export const fragments = Array.from({ length: COLS * ROWS }, (_, index) => {
  const column = index % COLS, row = Math.floor(index / COLS), hero = heroCells.indexOf(index), encounter = encounters[hero];
  const center = [(column - (COLS - 1) / 2) * CELL, (row - (ROWS - 1) / 2) * CELL];
  return { id: index === keyIndex ? 'key' : `piece-${index}`, index, column, row, center, hero,
    content: index === keyIndex ? 'key' : encounter?.[0] || CONTENT[(Math.floor(column / 3) + Math.floor(row / 3) * 7) % CONTENT.length],
    station: encounter?.[1] || [(rng() - .5) * 100, (rng() - .5) * 65, 25 - rng() * 115],
    turn: encounter?.[2] || [(rng() - .5) * 2.2, (rng() - .5) * 3.8, (rng() - .5) * 2],
    scale: encounter?.[3] || .8 + rng() * .75, seed: rng() };
});
export function fragmentPose(fragment, state, reduced = false) {
  const { center, station, turn, index } = fragment;
  if (fragment.id === 'key') {
    const t = smooth(state.finalPiece), visible = state.finalPiece > 0 || state.seat > 0 || state.state === 'locked';
    return { position: [2.8 * (1 - t), -.8 * (1 - t) + .48 * Math.sin(t * Math.PI),
      7 * (1 - t) + .08 * t * (1 - state.seat)],
      rotation: [.25 * (1 - t), -.65 * (1 - t), -.4 * (1 - t)], scale: 1,
      opacity: visible ? (reduced ? 1 : smooth(state.finalPiece / .045)) : 0, wave: 0 };
  }
  if (reduced) return { position: [...center, 0], rotation: [0, 0, 0], scale: 1, opacity: 1, wave: 0 };
  const t = smooth((state.convergence - fragment.seed * .12) / .88), time = state.filmTime || 0;
  const wave = Math.sin(Math.PI * state.resonance) * Math.exp(-(((state.resonance * 31 - Math.hypot(...center)) / 3) ** 2));
  const position = [0, 1, 2].map(axis => mix(station[axis], axis < 2 ? center[axis] : 0, t)
    + Math.sin(t * Math.PI) * Math.sin(index * 2.3 + axis) * [7, 5, 12][axis]);
  position[2] -= wave * .045;
  const rotation = turn.map((angle, axis) => (angle + Math.sin(time * .23 + index) * .055
    + (fragment.hero === 12 || fragment.hero === 21 ? state.acceleration * Math.PI * (axis === 1 ? 1 : 0) : 0)) * (1 - t));
  if (fragment.hero >= 18 && fragment.hero <= 20) {
    const aligned = Math.sin(Math.PI * clamp((state.acceleration - .06) / .84)) ** 2;
    position[0] += (fragment.hero - 19) * (1 - aligned) * 1.6 * (1 - t);
    rotation[1] += (fragment.hero - 19) * (1 - aligned) * .5 * (1 - t);
  }
  return { position, rotation, scale: mix(fragment.scale, 1, t), opacity: 1, wave };
}
export function createField(count, far = false) {
  const rng = random(far ? 9064 : 1987);
  return Array.from({ length: count }, (_, index) => {
    const angle = rng() * Math.PI * 2, radius = (far ? 26 : 6) + rng() ** .7 * (far ? 120 : 68);
    const position = [Math.cos(angle) * radius, Math.sin(angle) * radius * .62, (far ? 5 : 30) - rng() * (far ? 200 : 140)];
    const target = fragments[index % fragments.length].center;
    return { index, position, target: [target[0], target[1], -2 - rng() * 10],
      turn: [(rng() - .5) * 2, (rng() - .5) * 2.8, rng() * Math.PI * 2],
      scale: far ? .25 + rng() * .7 : .55 + rng() * 1.2, seed: rng(),
      content: CONTENT[Math.floor(rng() * CONTENT.length)] };
  });
}
