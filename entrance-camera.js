// A deterministic camera storyboard, independent of the renderer. Tangents are
// world units per second, shared by adjacent shots so the flight does not stop
// at every phase boundary. The silence and completed identity are truly still.
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const mix = (a, b, t) => a + (b - a) * t;
const SHOTS = ['mystery', 'discovery', 'acceleration', 'scale-reveal', 'convergence', 'silence'];
const DURATIONS = [1.4, 1.8, 1.9, 1.7, 2, .7];

function hermite(from, to, outgoing, incoming, duration, t) {
  const t2 = t * t, t3 = t2 * t;
  return from.map((value, axis) => (2 * t3 - 3 * t2 + 1) * value
    + (t3 - 2 * t2 + t) * outgoing[axis] * duration
    + (-2 * t3 + 3 * t2) * to[axis]
    + (t3 - t2) * incoming[axis] * duration);
}

function framing(aspect) {
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const portrait = clamp((1.15 - ratio) / .6);
  const fov = 48 + 12 * portrait;
  const tangent = Math.tan(fov * Math.PI / 360);
  // The board is 49.6 × 27.2 units; this preserves a margin at every aspect.
  const finalDistance = Math.max(38, 54 / (2 * tangent * ratio), 30 / (2 * tangent));
  const revealDistance = Math.max(125, 76 / (2 * tangent * ratio));
  // A close final piece at z=7 must remain inside even a narrow phone frame.
  const closeDistance = Math.max(11, 7 + 6.8 / (2 * tangent * ratio));
  return { fov, portrait, finalDistance, revealDistance, closeDistance };
}

export function cameraPose(state = {}, aspect = 16 / 9, reduced = false) {
  const { fov, portrait, finalDistance, revealDistance, closeDistance } = framing(aspect);
  const final = { position: [0, 0, finalDistance], target: [0, 0, 0], roll: 0, fov };
  if (reduced || state.state === 'locked') return final;

  const phase = state.state || 'mystery';
  const t = Number.isFinite(state.phaseProgress) ? clamp(state.phaseProgress) : 0;
  const shot = SHOTS.indexOf(phase);
  if (shot !== -1) {
    const extra = 3 * portrait;
    const positions = [
      [1.4, .5, 15 + extra],
      [-1.8, -.6, 7 + extra],
      [-4, 1, -8 + extra],
      [5, -1, -26 + extra],
      [28, 18, revealDistance],
      [4, 2, Math.max(24, closeDistance + 13)],
      [0, .2, closeDistance],
    ];
    const velocities = [
      [-.4, -.3, -3.8], [-2, -.25, -7.2], [1.8, .15, -10.5],
      [8, 2, -2], [13, 0, 0], [-6, -4, -22], [0, 0, 0],
    ];
    const targets = [
      [-.8, 0, 2], [-4, 0, -15], [-4, 0, -24], [3, 0, -45],
      [0, 0, -10], [0, 0, 0], [0, 0, 0],
    ];
    const targetVelocities = [
      [-1.6, 0, -9], [-1.4, 0, -8.5], [2.5, 0, -10.5],
      [1, 0, 0], [-1, 0, 11], [0, 0, 0], [0, 0, 0],
    ];
    const rolls = [.025, -.10, .15, -.20, .11, -.035, 0];
    return {
      position: hermite(positions[shot], positions[shot + 1], velocities[shot], velocities[shot + 1], DURATIONS[shot], t),
      target: hermite(targets[shot], targets[shot + 1], targetVelocities[shot], targetVelocities[shot + 1], DURATIONS[shot], t),
      roll: mix(rolls[shot], rolls[shot + 1], smooth(t)),
      fov,
    };
  }

  if (phase === 'awaiting') return { position: [0, .2, closeDistance], target: [0, 0, 0], roll: 0, fov };
  if (phase === 'final-piece') {
    // Follow the last piece with a gentle arc; zero velocity at either end
    // preserves the quiet readiness hold and the precise stationary snap.
    const arc = Math.sin(Math.PI * t) ** 2;
    return {
      position: [1.1 * arc, mix(.2, 0, smooth(t)) - .25 * arc, closeDistance + .4 * arc],
      target: [.45 * arc * (1 - t), -.12 * arc, .45 * arc],
      roll: -.028 * arc,
      fov,
    };
  }
  if (phase === 'seating' || phase === 'settling') {
    return { position: [0, 0, closeDistance], target: [0, 0, 0], roll: 0, fov };
  }
  if (phase === 'identity') {
    return { position: [0, 0, mix(closeDistance, finalDistance, smooth(t))], target: [0, 0, 0], roll: 0, fov };
  }
  return final;
}
