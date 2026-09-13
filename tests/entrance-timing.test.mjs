import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../entrance-timing.js', import.meta.url), 'utf8');
const { createEntranceTimeline } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);
const channels = ['mystery', 'discovery', 'acceleration', 'scaleReveal', 'convergence', 'silence', 'finalPiece', 'seat', 'resonance', 'brand', 'reveal'];
const assembled = frame => {
  for (const channel of ['mystery', 'discovery', 'acceleration', 'scaleReveal', 'convergence', 'silence', 'reveal']) assert.equal(frame[channel], 1);
  for (const channel of ['finalPiece', 'seat', 'resonance', 'brand']) assert.equal(frame[channel], 0);
};

test('shots converge and fall silent before readiness, but elapsed time cannot admit the key', () => {
  const timeline = createEntranceTimeline();
  const frame = timeline.step(60000);
  assert.equal(frame.state, 'awaiting');
  assert.equal(frame.elapsed, 60000);
  assert.equal(frame.filmTime, 10.9);
  assert.equal(frame.phaseProgress, 0);
  assembled(frame);
  const hold = timeline.step(10000);
  assert.equal(hold.state, 'awaiting');
  assert.equal(hold.elapsed, 70000);
  assert.equal(hold.filmTime, frame.filmTime);
  assembled(hold);
});

test('the opening reveals over 350 ms within the mystery shot', () => {
  const timeline = createEntranceTimeline();
  assert.equal(timeline.step(0).reveal, 0);
  close(timeline.step(175).reveal, .5);
  const frame = timeline.step(175);
  assert.equal(frame.state, 'mystery');
  assert.equal(frame.reveal, 1);
  assert.equal(frame.discovery, 0);
  assert.equal(frame.phaseProgress, .25);
  assert.equal(frame.filmTime, .35);
});

test('ready-at-start boundaries retain every directed shot and total 14700 ms', () => {
  const timeline = createEntranceTimeline();
  timeline.ready();
  const boundaries = [
    [1400, 'discovery', 'mystery', 'discovery'],
    [1800, 'acceleration', 'discovery', 'acceleration'],
    [1900, 'scale-reveal', 'acceleration', 'scaleReveal'],
    [1700, 'convergence', 'scaleReveal', 'convergence'],
    [3400, 'silence', 'convergence', 'silence'],
    [700, 'final-piece', 'silence', 'finalPiece'],
    [1400, 'seating', 'finalPiece', 'seat'],
    [130, 'settling', 'seat', 'resonance'],
    [470, 'identity', 'resonance', 'brand'],
  ];
  let elapsed = 0;
  for (const [duration, state, completed, starting] of boundaries) {
    elapsed += duration;
    const frame = timeline.step(duration);
    assert.equal(frame.state, state);
    assert.equal(frame[completed], 1);
    assert.equal(frame[starting], 0);
    assert.equal(frame.elapsed, elapsed);
    assert.equal(frame.filmTime, elapsed / 1000);
    assert.equal(frame.phaseProgress, 0);
    assert.equal(frame.brand, 0);
  }
  close(timeline.step(900).brand, .5);
  const frame = timeline.step(900);
  assert.equal(frame.state, 'locked');
  assert.equal(frame.elapsed, 14700);
  assert.equal(frame.filmTime, 14.7);
  assert.equal(frame.phaseProgress, 1);
  for (const channel of channels) assert.equal(frame[channel], 1);
});

test('late readiness releases the gate at zero progress and preserves the complete ending', () => {
  const timeline = createEntranceTimeline();
  assert.equal(timeline.step(10900).state, 'awaiting');
  timeline.step(1000);
  timeline.ready();
  const frame = timeline.step(0);
  assert.equal(frame.state, 'final-piece');
  assert.equal(frame.finalPiece, 0);
  assert.equal(frame.phaseProgress, 0);
  assert.equal(frame.elapsed, 11900);
  assert.equal(frame.filmTime, 10.9);
  const locked = timeline.step(3800);
  assert.equal(locked.state, 'locked');
  assert.equal(locked.elapsed, 15700);
  assert.equal(locked.filmTime, 14.7);
});

test('readiness during convergence cannot shortcut convergence or the silence', () => {
  const timeline = createEntranceTimeline();
  timeline.step(8000);
  timeline.ready();
  assert.equal(timeline.step(2199).state, 'convergence');
  const silence = timeline.step(1);
  assert.equal(silence.state, 'silence');
  assert.equal(silence.silence, 0);
  assert.equal(silence.finalPiece, 0);
  assert.equal(timeline.step(699).state, 'silence');
  const frame = timeline.step(1);
  assert.equal(frame.state, 'final-piece');
  assert.equal(frame.finalPiece, 0);
});

test('shot progress exposes linear timing alongside eased motion and linear resonance', () => {
  const timeline = createEntranceTimeline();
  timeline.ready();
  const quarter = timeline.step(350);
  close(quarter.phaseProgress, .25);
  close(quarter.mystery, .103515625);
  const half = timeline.step(350);
  close(half.phaseProgress, .5);
  close(half.mystery, .5);
  timeline.step(11730);
  const ripple = timeline.step(117.5);
  assert.equal(ripple.state, 'settling');
  close(ripple.phaseProgress, .25);
  close(ripple.resonance, .25);
});

test('large deltas and ordinary frames reach equivalent shot positions', () => {
  for (const ready of [false, true]) {
    const large = createEntranceTimeline(), small = createEntranceTimeline();
    if (ready) { large.ready(); small.ready(); }
    const expected = large.step(11200);
    let actual;
    for (let i = 0; i < 112; i++) actual = small.step(100);
    assert.deepEqual(actual, expected);
    if (ready) assert.equal(large.step(100000).elapsed, 14700);
  }
});

test('reduced motion waits as a converged still with an empty center', () => {
  const timeline = createEntranceTimeline();
  const staticFrame = timeline.step(0, true);
  assert.equal(staticFrame.state, 'awaiting');
  assert.equal(staticFrame.elapsed, 0);
  assert.equal(staticFrame.filmTime, 10.9);
  assembled(staticFrame);
  const hold = timeline.step(5000, true);
  assembled(hold);
  assert.equal(hold.filmTime, staticFrame.filmTime);
  timeline.ready();
  const locked = timeline.step(0, true);
  assert.equal(locked.state, 'locked');
  assert.equal(locked.elapsed, hold.elapsed);
  assert.equal(locked.filmTime, 14.7);
  for (const channel of channels) assert.equal(locked[channel], 1);
});

test('changing to reduced motion midflight locks once when assets are ready', () => {
  const timeline = createEntranceTimeline();
  timeline.ready();
  assert.equal(timeline.step(3000).state, 'discovery');
  const locked = timeline.step(0, true);
  assert.equal(locked.state, 'locked');
  assert.deepEqual(timeline.step(100000, false), locked);
  assert.deepEqual(timeline.step(100000, true), locked);
});

test('leaving reduced motion preserves the assembled hold until readiness', () => {
  const timeline = createEntranceTimeline();
  timeline.step(0, true);
  const hold = timeline.step(100, false);
  assert.equal(hold.state, 'awaiting');
  assembled(hold);
  timeline.ready();
  const frame = timeline.step(0, false);
  assert.equal(frame.state, 'final-piece');
  assert.equal(frame.filmTime, 10.9);
});

test('replay restarts mystery while retaining an established readiness result', () => {
  const timeline = createEntranceTimeline();
  timeline.ready();
  timeline.step(14700);
  timeline.reset();
  const start = timeline.step(0);
  assert.equal(start.state, 'mystery');
  assert.equal(start.elapsed, 0);
  assert.equal(start.filmTime, 0);
  assert.equal(start.phaseProgress, 0);
  for (const channel of channels) assert.equal(start[channel], 0);
  assert.equal(timeline.step(10900).state, 'final-piece');
  timeline.reset();
  assert.equal(timeline.step(0, true).state, 'locked');
  const unready = createEntranceTimeline();
  unready.step(10900);
  unready.reset();
  assert.equal(unready.step(14700).state, 'awaiting');
});

test('negative and nonfinite deltas cannot reverse or corrupt progress', () => {
  const timeline = createEntranceTimeline();
  const frame = timeline.step(2300);
  for (const delta of [-10, NaN, Infinity, -Infinity, undefined]) assert.deepEqual(timeline.step(delta), frame);
});

test('even repeated enormous finite waiting deltas leave every numeric value finite', () => {
  const timeline = createEntranceTimeline();
  timeline.step(Number.MAX_VALUE);
  const frame = timeline.step(Number.MAX_VALUE);
  assert.equal(frame.state, 'awaiting');
  for (const [key, value] of Object.entries(frame)) {
    if (key !== 'state') assert.ok(Number.isFinite(value), `${key} must remain finite`);
  }
  timeline.ready();
  assert.equal(timeline.step(3800).state, 'locked');
});

test('normal frames preserve every shot, monotonic channels, and a stable final identity', () => {
  const timeline = createEntranceTimeline();
  const order = ['mystery', 'discovery', 'acceleration', 'scale-reveal', 'convergence', 'silence', 'awaiting', 'final-piece', 'seating', 'settling', 'identity', 'locked'];
  const seen = new Set();
  let previous = timeline.step(0);
  for (let i = 0; i < 500; i++) {
    if (i === 238) timeline.ready();
    const frame = timeline.step(50);
    seen.add(frame.state);
    assert.ok(order.indexOf(frame.state) >= order.indexOf(previous.state));
    assert.ok(frame.filmTime >= previous.filmTime);
    assert.ok(frame.phaseProgress >= 0 && frame.phaseProgress <= 1);
    if (frame.state === previous.state) assert.ok(frame.phaseProgress >= previous.phaseProgress);
    for (const channel of channels) {
      assert.ok(frame[channel] >= 0 && frame[channel] <= 1);
      assert.ok(frame[channel] >= previous[channel]);
    }
    if (order.indexOf(frame.state) < order.indexOf('identity')) assert.equal(frame.brand, 0);
    previous = frame;
  }
  assert.deepEqual([...seen], order);
  assert.equal(previous.elapsed, 15700);
  assert.equal(previous.filmTime, 14.7);
  assert.deepEqual(timeline.step(1000000), previous);
});
