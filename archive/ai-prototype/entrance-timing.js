const PHASES = [
  'mystery', 'discovery', 'acceleration', 'scale-reveal', 'convergence',
  'silence', 'awaiting', 'final-piece', 'seating', 'settling', 'identity', 'locked',
];
const DURATION = {
  mystery: 1400,
  discovery: 1800,
  acceleration: 1900,
  'scale-reveal': 1700,
  convergence: 3400,
  silence: 700,
  'final-piece': 1400,
  seating: 130,
  settling: 470,
  identity: 1800,
};
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const PHASE_START = {};
let runningTime = 0;
for (const phase of PHASES) {
  PHASE_START[phase] = runningTime;
  runningTime += DURATION[phase] || 0;
}

// The directed shots can run while assets load. The silence ends at a real
// readiness gate: waiting never substitutes for the ready() signal.
export function createEntranceTimeline() {
  let elapsed = 0, phaseElapsed = 0, resourcesReady = false, state = 'mystery';

  function snapshot() {
    const index = PHASES.indexOf(state);
    const progress = (phase, curve = ease) => {
      const target = PHASES.indexOf(phase);
      if (index < target) return 0;
      if (index > target) return 1;
      return curve(clamp(phaseElapsed / DURATION[phase]));
    };
    return {
      state,
      elapsed,
      phaseProgress: state === 'locked' ? 1 : DURATION[state] ? clamp(phaseElapsed / DURATION[state]) : 0,
      // Camera time excludes loading holds and stops at the final identity.
      filmTime: (PHASE_START[state] + phaseElapsed) / 1000,
      mystery: progress('mystery'),
      discovery: progress('discovery'),
      acceleration: progress('acceleration'),
      scaleReveal: progress('scale-reveal'),
      convergence: progress('convergence'),
      silence: progress('silence'),
      finalPiece: progress('final-piece'),
      seat: progress('seating'),
      resonance: progress('settling', t => t),
      brand: progress('identity'),
      reveal: state === 'mystery' ? ease(phaseElapsed / 350) : 1,
    };
  }

  function consumeTime(delta) {
    elapsed = Math.min(Number.MAX_SAFE_INTEGER, elapsed + delta);
  }

  return {
    ready() { resourcesReady = true; },
    reset() {
      elapsed = 0;
      phaseElapsed = 0;
      state = 'mystery';
    },
    step(delta, reduced = false) {
      if (state === 'locked') return snapshot();
      let remaining = Number.isFinite(delta) ? Math.max(0, delta) : 0;
      if (reduced) {
        state = resourcesReady ? 'locked' : 'awaiting';
        phaseElapsed = 0;
        if (state === 'locked') return snapshot();
      }

      // Carry excess delta through exact boundaries. A waiting gate consumes
      // visible elapsed time only; a final lock consumes no additional time.
      while (state !== 'locked') {
        if (state === 'awaiting') {
          if (!resourcesReady) {
            consumeTime(remaining);
            break;
          }
          state = 'final-piece';
        }
        const duration = DURATION[state];
        const consumed = Math.min(remaining, duration - phaseElapsed);
        phaseElapsed += consumed;
        consumeTime(consumed);
        remaining -= consumed;
        if (phaseElapsed < duration) break;
        state = PHASES[PHASES.indexOf(state) + 1];
        phaseElapsed = 0;
      }
      return snapshot();
    },
  };
}
