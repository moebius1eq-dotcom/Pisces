import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../entrance-camera.js', import.meta.url), 'utf8');
const { cameraPose } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const phases = ['mystery', 'discovery', 'acceleration', 'scale-reveal', 'convergence', 'silence',
  'awaiting', 'final-piece', 'seating', 'settling', 'identity', 'locked'];
const durations = [1.4, 1.8, 1.9, 1.7, 3.4, .7];
const pose = (state, phaseProgress = 0, aspect = 16 / 9, reduced = false) => cameraPose({ state, phaseProgress }, aspect, reduced);
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
const same = (a, b, tolerance) => {
  for (const key of ['position', 'target']) a[key].forEach((value, axis) => close(value, b[key][axis], tolerance));
  close(a.roll, b.roll, tolerance);
  close(a.fov, b.fov, tolerance);
};

test('every camera shot remains finite and looks toward a distinct point', () => {
  for (const aspect of [16 / 9, 1, 9 / 16, .3, 4, NaN, 0, -1]) {
    for (const phase of phases) for (let frame = 0; frame <= 100; frame++) {
      const view = pose(phase, frame / 100, aspect);
      assert.ok([...view.position, ...view.target, view.roll, view.fov].every(Number.isFinite));
      assert.ok(Math.hypot(...view.position.map((value, axis) => value - view.target[axis])) > 1);
      assert.ok(view.fov >= 48 && view.fov <= 60);
      assert.ok(Math.abs(view.roll) <= .201);
    }
  }
});

test('all phase boundaries share exact camera position, target, roll and FOV', () => {
  for (const aspect of [16 / 9, 1, 9 / 16, .3]) {
    for (let index = 0; index < phases.length - 1; index++) {
      same(pose(phases[index], 1, aspect), pose(phases[index + 1], 0, aspect));
    }
  }
});

test('moving shots preserve velocity across their boundaries instead of stopping each time', () => {
  const seconds = 1e-5;
  for (const aspect of [16 / 9, 9 / 16]) for (let index = 0; index < 5; index++) {
    const boundary = pose(phases[index], 1, aspect);
    const before = pose(phases[index], 1 - seconds / durations[index], aspect);
    const after = pose(phases[index + 1], seconds / durations[index + 1], aspect);
    for (const field of ['position', 'target']) for (let axis = 0; axis < 3; axis++) {
      close((boundary[field][axis] - before[field][axis]) / seconds,
        (after[field][axis] - boundary[field][axis]) / seconds, .006);
    }
    assert.ok(Math.hypot(...boundary.position.map((value, axis) => (value - before.position[axis]) / seconds)) > 1);
  }
});

test('the reveal pulls back over 150 world units and convergence includes a lateral orbit', () => {
  const before = pose('scale-reveal', 0), reveal = pose('scale-reveal', 1);
  assert.ok(reveal.position[2] - before.position[2] >= 150);
  const arc = pose('convergence', .18);
  assert.ok(arc.position[0] > reveal.position[0], 'the camera continues around the field before closing in');
  assert.ok(pose('convergence', 1).position[2] < reveal.position[2] / 4);
});

test('silence settles to a stationary readiness hold with no drift or roll', () => {
  const end = pose('silence', 1), near = pose('silence', 1 - 1e-5);
  assert.ok(Math.hypot(...end.position.map((value, axis) => value - near.position[axis])) < 1e-7);
  for (const progress of [0, .5, 1]) same(end, pose('awaiting', progress));
  same(end, pose('final-piece', 0));
});

test('final-piece follow is purposeful, bounded, and lands without a positional jump', () => {
  const mid = pose('final-piece', .5);
  assert.ok(mid.position[0] > .8 && mid.position[0] < 1.5);
  assert.ok(mid.target[0] > 0);
  same(pose('final-piece', 1), pose('seating', 0));
  same(pose('settling', 1), pose('identity', 0));
});

test('completed framing contains the central identity region at phone and desktop aspects', () => {
  for (const aspect of [16 / 9, 1, 9 / 16, .3, 4]) {
    const view = pose('locked', 1, aspect);
    const halfHeight = view.position[2] * Math.tan(view.fov * Math.PI / 360);
    assert.ok(halfHeight >= 15);
    assert.ok(halfHeight * aspect >= 27 - 1e-9);
    assert.deepEqual(view.target, [0, 0, 0]);
    same(pose('identity', 1, aspect), view);
    const closeView = pose('awaiting', 0, aspect);
    const keyHalfWidth = (closeView.position[2] - 7) * Math.tan(closeView.fov * Math.PI / 360) * aspect;
    assert.ok(keyHalfWidth >= 3.4 - 1e-9);
  }
});

test('reduced motion keeps the same full-composition camera for the entire entrance', () => {
  for (const aspect of [16 / 9, 9 / 16]) {
    const reference = pose('locked', 1, aspect, true);
    for (const phase of phases) for (const progress of [0, .5, 1]) same(pose(phase, progress, aspect, true), reference);
  }
});

test('camera evaluation is deterministic, clamps progress, and handles incomplete snapshots', () => {
  assert.deepEqual(cameraPose(), cameraPose({ state: 'mystery', phaseProgress: 0 }));
  same(pose('discovery', -1), pose('discovery', 0));
  same(pose('discovery', 2), pose('discovery', 1));
  same(pose('discovery', NaN), pose('discovery', 0));
  assert.deepEqual(pose('acceleration', .417), pose('acceleration', .417));
});
