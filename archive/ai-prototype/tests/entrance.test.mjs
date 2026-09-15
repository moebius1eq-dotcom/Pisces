import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const load = async path => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};
const { CELL, COLS, ROWS, CONTENT, fragments, compositionBounds, puzzleOutline, fragmentPose, createField } = await load('../entrance-model.js');
const { createEntranceTimeline } = await load('../entrance-timing.js');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const outline = puzzleOutline(9);
const edgeLength = outline.length / 4;
const edges = Array.from({ length: 4 }, (_, i) => outline.slice(i * edgeLength, (i + 1) * edgeLength));
const completeTimeline = createEntranceTimeline();
completeTimeline.ready();
const complete = completeTimeline.step(14700);
const waiting = createEntranceTimeline().step(10900);
const key = fragments.find(fragment => fragment.id === 'key');
const cleanContour = outline.filter((point, i) => !i || distance(point, outline[i - 1]) > 1e-12);
if (distance(cleanContour[0], cleanContour.at(-1)) < 1e-12) cleanContour.pop();
const inside = (point, polygon) => {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
};

// These compare sampled physical boundaries after translation, so a tab that
// merely resembles its neighboring socket cannot silently pass.
test('all adjoining target pieces share the same reversed tab/socket seam', () => {
  assert.equal(CELL, 1.6);
  assert.equal(outline.length % 4, 0);
  let seams = 0;
  for (const fragment of fragments) {
    for (const [neighbor, ownEdge, otherEdge] of [
      [fragment.column < COLS - 1 ? fragments[fragment.index + 1] : null, 1, 3],
      [fragment.row < ROWS - 1 ? fragments[fragment.index + COLS] : null, 2, 0],
    ]) {
      if (!neighbor) continue;
      for (let i = 0; i < edgeLength; i++) {
        const a = edges[ownEdge][i], b = edges[otherEdge][edgeLength - i - 1];
        near(a[0] + fragment.center[0], b[0] + neighbor.center[0]);
        near(a[1] + fragment.center[1], b[1] + neighbor.center[1]);
      }
      seams++;
    }
  }
  assert.equal(seams, 1006);
});

test('the contour has real necks, outward tabs, inward sockets, and positive cell area', () => {
  assert.ok(outline.every(point => point.every(Number.isFinite)));
  assert.ok(edges[0].some(([x, y]) => y > -CELL / 2 + .2 * CELL));
  assert.ok(edges[1].some(([x]) => x > CELL / 2 + .2 * CELL));
  assert.ok(edges[2].some(([, y]) => y > CELL / 2 + .2 * CELL));
  assert.ok(edges[3].some(([x]) => x > -CELL / 2 + .2 * CELL));
  assert.ok(edges[0].some(([x], i) => i > 0 && x < edges[0][i - 1][0] - 1e-6));
  let twiceArea = 0;
  for (let i = 0; i < cleanContour.length; i++) {
    const a = cleanContour[i], b = cleanContour[(i + 1) % cleanContour.length];
    twiceArea += a[0] * b[1] - b[0] * a[1];
  }
  near(twiceArea / 2, CELL * CELL);
  assert.ok(inside([0, 0], cleanContour));
});

test('the sampled contour has no crossing edges or degenerate segments', () => {
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < cleanContour.length; i++) {
    const a = cleanContour[i], b = cleanContour[(i + 1) % cleanContour.length];
    assert.ok(distance(a, b) > 1e-8);
    for (let j = i + 2; j < cleanContour.length; j++) {
      if (i === 0 && j === cleanContour.length - 1) continue;
      const c = cleanContour[j], d = cleanContour[(j + 1) % cleanContour.length];
      const crosses = cross(a, b, c) * cross(a, b, d) < -1e-16 && cross(c, d, a) * cross(c, d, b) < -1e-16;
      assert.equal(crosses, false, `segments ${i} and ${j} cross`);
    }
  }
});

test('527 unique pieces occupy a 31 by 17 lattice with exactly one central key', () => {
  assert.equal(COLS, 31);
  assert.equal(ROWS, 17);
  assert.equal(fragments.length, 527);
  assert.equal(new Set(fragments.map(fragment => fragment.id)).size, fragments.length);
  assert.equal(new Set(fragments.map(fragment => fragment.center.join(','))).size, fragments.length);
  assert.equal(fragments.filter(fragment => fragment.id === 'key').length, 1);
  assert.deepEqual(key.center, [0, 0]);
  assert.equal(key.content, 'key');
  for (const fragment of fragments) {
    near(fragment.center[0], (fragment.column - 15) * CELL);
    near(fragment.center[1], (fragment.row - 8) * CELL);
    assert.ok(fragment.center[0] > compositionBounds.left && fragment.center[0] < compositionBounds.right);
    assert.ok(fragment.center[1] > compositionBounds.bottom && fragment.center[1] < compositionBounds.top);
  }
  near(compositionBounds.right - compositionBounds.left, 49.6);
  near(compositionBounds.top - compositionBounds.bottom, 27.2);
});

test('authored encounters retain readable astronomy content at multiple depths', () => {
  const heroes = fragments.filter(fragment => fragment.hero >= 0);
  assert.equal(heroes.length, 23);
  assert.equal(new Set(heroes.map(fragment => fragment.hero)).size, 23);
  const content = new Set(heroes.map(fragment => fragment.content));
  for (const name of ['earth', 'enceladus', 'saturn', 'galaxy', 'nebula', 'blackhole', 'telescope', 'cosmicweb', 'coordinates']) assert.ok(content.has(name));
  assert.ok(Math.max(...heroes.map(fragment => fragment.station[2])) - Math.min(...heroes.map(fragment => fragment.station[2])) > 50);
  assert.ok(heroes.every(fragment => fragment.id !== 'key'));
});

test('the readiness hold leaves an actual empty center with every other piece aligned', () => {
  assert.equal(waiting.state, 'awaiting');
  let hidden = 0;
  for (const fragment of fragments) {
    const pose = fragmentPose(fragment, waiting);
    if (pose.opacity === 0) hidden++;
    if (fragment.id === 'key') {
      assert.equal(pose.opacity, 1);
      assert.ok(pose.position[2] > 5);
      assert.ok(pose.position[0] > 2);
      continue;
    }
    assert.equal(pose.opacity, 1);
    near(pose.position[0], fragment.center[0]);
    near(pose.position[1], fragment.center[1]);
    near(pose.position[2], 0);
    pose.rotation.forEach(value => near(value, 0));
    const translated = cleanContour.map(([x, y]) => [x + pose.position[0], y + pose.position[1]]);
    assert.equal(inside([0, 0], translated), false, `${fragment.id} occludes the central gap`);
  }
  assert.equal(hidden, 0);
});

test('final identity has exactly aligned targets without residual rotations or scale', () => {
  assert.equal(complete.state, 'locked');
  for (const fragment of fragments) {
    const pose = fragmentPose(fragment, complete);
    near(pose.position[0], fragment.center[0]);
    near(pose.position[1], fragment.center[1]);
    near(pose.position[2], 0);
    pose.rotation.forEach(value => near(value, 0));
    near(pose.scale, 1);
    near(pose.opacity, 1);
    near(pose.wave, 0);
  }
});

test('the arriving key seats completely before the restrained neighbor response', () => {
  const timeline = createEntranceTimeline();
  timeline.ready();
  timeline.step(10900);
  assert.equal(fragmentPose(key, timeline.step(0)).opacity, 1);
  const arriving = fragmentPose(key, timeline.step(700));
  assert.equal(arriving.opacity, 1);
  assert.ok(arriving.position[2] > 1);
  const hovering = fragmentPose(key, timeline.step(700));
  near(hovering.position[0], 0);
  near(hovering.position[1], 0);
  near(hovering.position[2], .08);
  const seated = timeline.step(130);
  near(fragmentPose(key, seated).position[2], 0);
  const response = timeline.step(100);
  const poses = fragments.filter(fragment => fragment.id !== 'key').map(fragment => fragmentPose(fragment, response));
  assert.ok(poses.some(pose => pose.wave > .1));
  assert.ok(poses.every(pose => Math.abs(pose.position[2]) <= .045 + 1e-10));
  assert.ok(poses.every(pose => pose.wave >= 0 && pose.wave <= 1));
});

test('reduced motion holds a motionless assembled gap and then resolves the identity', () => {
  const timeline = createEntranceTimeline();
  const reducedWaiting = timeline.step(0, true);
  for (const fragment of fragments) {
    const pose = fragmentPose(fragment, reducedWaiting, true);
    if (fragment.id === 'key') assert.equal(pose.opacity, 0);
    else {
      assert.deepEqual(pose.position, [...fragment.center, 0]);
      assert.deepEqual(pose.rotation, [0, 0, 0]);
      assert.equal(pose.scale, 1);
    }
    assert.deepEqual(fragmentPose(fragment, timeline.step(500, true), true), pose);
  }
  timeline.ready();
  const reducedComplete = timeline.step(0, true);
  for (const fragment of fragments) {
    const pose = fragmentPose(fragment, reducedComplete, true);
    near(pose.position[0], fragment.center[0]);
    near(pose.position[1], fragment.center[1]);
    near(pose.position[2], 0);
    near(pose.opacity, 1);
  }
});

test('all piece transforms remain finite across actual timeline phases and the loading hold', () => {
  const timeline = createEntranceTimeline();
  const seen = new Set();
  for (let i = 0; i < 680; i++) {
    if (i === 480) timeline.ready();
    const frame = timeline.step(25);
    seen.add(frame.state);
    for (const fragment of fragments) {
      const pose = fragmentPose(fragment, frame);
      assert.ok([...pose.position, ...pose.rotation, pose.scale, pose.opacity, pose.wave].every(Number.isFinite));
      assert.ok(pose.scale > 0 && pose.scale <= 5);
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      assert.ok(pose.position.every(value => Math.abs(value) < 120));
    }
  }
  assert.ok(seen.has('mystery'));
  assert.ok(seen.has('scale-reveal'));
  assert.ok(seen.has('awaiting'));
  assert.ok(seen.has('seating'));
  assert.ok(seen.has('locked'));
});

test('near and far fields are reproducible, distinct, varied in depth, and tied to assembly targets', () => {
  const nearField = createField(1400);
  const farField = createField(1800, true);
  assert.deepEqual(createField(1400), nearField);
  assert.deepEqual(createField(1800, true), farField);
  assert.notDeepEqual(nearField[0], farField[0]);
  assert.deepEqual(createField(0), []);
  for (const field of [nearField, farField]) {
    assert.equal(new Set(field.map(item => item.position.join(','))).size, field.length);
    assert.ok(new Set(field.map(item => item.content)).size >= 15);
    assert.ok(Math.max(...field.map(item => item.position[2])) - Math.min(...field.map(item => item.position[2])) > 130);
    for (const item of field) {
      assert.ok([...item.position, ...item.target, ...item.turn, item.scale, item.seed].every(Number.isFinite));
      assert.ok(item.scale > 0 && item.seed >= 0 && item.seed < 1);
      assert.ok(CONTENT.includes(item.content));
      assert.deepEqual(item.target, [...item.center, 0]);
      assert.ok(Math.abs(item.center[0]) > 24 || Math.abs(item.center[1]) > 12.8);
    }
  }
  assert.ok(Math.min(...farField.map(item => item.position[2])) < -190);
  assert.ok(farField.every(item => item.scale <= .95));
  assert.ok(nearField.some(item => item.scale > 1));
});
