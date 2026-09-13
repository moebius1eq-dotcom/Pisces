import { createExperienceTimeline } from './entrance-transition.js';
import { createMontageArtwork } from './entrance-artwork.js';
import { createMontageRenderer, createCanvasMontage } from './entrance-renderer.js';
import { createHub } from './hub.js';

const entrance = document.querySelector('.pisces-entrance');
const mount = entrance.querySelector('.entrance-scene');
const status = entrance.querySelector('.entrance-status');
const replay = entrance.querySelector('.entrance-replay');
const arrival = entrance.querySelector('.pisces-arrival');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const timeline = createExperienceTimeline();
const journeyTitle = 'Journey Through Scale — PISCES';
document.title = 'PISCES — Piece together the universe';
const background = [...document.querySelectorAll('.site-header, #scale-index, main')];
const priorInert = background.map(element => element.inert);
background.forEach(element => { element.inert = true; });

let frame = 0, previous = 0, dismissed = false, lastState = 'mystery';
let snapshot, presentation, readyResult, graphicsFallback = false;
let hubLight = 0;
const hub = createHub({ entrance, replay, onDirection() { if (snapshot?.state === 'arrived') requestFrame(); } });
const hubHash = () => ['#hub', '#learn', '#take-part'].includes(location.hash);
const hubDirection = () => location.hash === '#learn' ? 'learn' : location.hash === '#take-part' ? 'take-part' : 'explore';
const artwork = createMontageArtwork({ onUpdate(id) { presentation?.update(id); requestFrame(); } });
const canvasFallback = () => createCanvasMontage({ mount, artwork, onInvalidate: requestFrame });
let three;
try { three=await import('./vendor/three.module.js'); } catch { graphicsFallback=true; }
function buildPresentation() {
  graphicsFallback=!three;
  try {
    if (!three) return canvasFallback();
    return createMontageRenderer({THREE:three,mount,artwork,onInvalidate:requestFrame,
      onLost(){presentation.dispose();graphicsFallback=true;presentation=canvasFallback();requestFrame();}});
  } catch { graphicsFallback=true; return canvasFallback(); }
}
presentation=buildPresentation();

function tick(now) {
  frame = 0;
  if (dismissed || document.hidden || !presentation) return;
  const delta = previous ? Math.min(now - previous, 50) : 0;
  previous = now;
  snapshot = timeline.step(delta, reduced.matches);
  if (snapshot.state === 'arrived') hubLight = reduced.matches ? 1 : Math.min(1, hubLight + delta / 1200);
  snapshot.hubLight = hubLight;
  presentation.draw(snapshot, reduced.matches);
  entrance.dataset.state = snapshot.state;
  if (snapshot.state === 'arrived' && lastState !== 'arrived') {
    entrance.setAttribute('aria-busy', 'false');
    status.textContent = readyResult?.fallback || graphicsFallback
      ? 'Arrived inside PISCES. Simplified graphics. Replay entrance is available.'
      : 'Arrived inside PISCES. Replay entrance is available.';
    replay.hidden = false;
    replay.setAttribute('aria-disabled', 'false');
    hub.show(hubDirection());
    status.textContent = 'PISCES observatory ready. Explore, Learn, Take Part, and Begin the Journey are available.';
  }
  arrival.hidden = snapshot.state !== 'arrival' && snapshot.state !== 'arrived';
  arrival.style.opacity = snapshot.destination || 0;
  lastState = snapshot.state;
  // The destination rests after arrival; no expensive continuous background loop.
  if ((snapshot.state !== 'arrived' || hubLight < 1) && snapshot.state !== 'awaiting') requestFrame();
}
function requestFrame() {
  if (!frame && !dismissed && !document.hidden) frame = requestAnimationFrame(tick);
}

function dismissForJourney() {
  if (dismissed) return;
  dismissed = true;
  hub.hide();
  cancelAnimationFrame(frame);
  presentation.dispose(); artwork.dispose();
  entrance.hidden = true;
  document.title = journeyTitle;
  background.forEach((element, index) => { element.inert = priorInert[index]; });
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
  window.dispatchEvent(new Event('cosmos:entrance-dismissed'));
  window.restoreJourneyLocation?.('auto');
  requestAnimationFrame(() => {
    const control = document.querySelector('.flight-play') || document.querySelector('.burger');
    control?.focus({preventScroll:true});
  });
}
const journeyHash = () => /^#(departure|earth-system|inner-solar-system|solar-system|stellar-neighborhood|milky-way|local-group|cosmic-web|observable-universe|flight=)/.test(location.hash);
replay.addEventListener('click', () => {
  if (replay.getAttribute('aria-disabled') === 'true') return;
  presentation.dispose(); presentation=buildPresentation();
  timeline.reset(); lastState = 'mystery'; previous = 0;
  hub.hide(); hubLight=0;
  entrance.append(replay);
  arrival.hidden=true;
  entrance.dataset.state = 'mystery'; entrance.setAttribute('aria-busy', 'true');
  replay.setAttribute('aria-disabled', 'true');
  status.textContent = 'Replaying the PISCES entrance.';
  requestFrame();
});
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(frame); frame = 0; previous = 0;
  if (!document.hidden) requestFrame();
});
window.addEventListener('resize', () => {
  if (dismissed) return;
  presentation.resize();
  if (snapshot) presentation.draw(snapshot, reduced.matches);
});
reduced.addEventListener('change', () => { previous = 0; requestFrame(); });
window.addEventListener('hashchange', () => { if (readyResult && journeyHash()) dismissForJourney(); });
window.addEventListener('hashchange', () => {
  if (!hubHash()) return;
  if (dismissed) { location.reload(); return; }
  if (readyResult) { timeline.step(100000); hubLight=1; lastState='mystery'; requestFrame(); }
});
requestFrame();
Promise.all([window.cosmosAssetsReady, artwork.ready]).then(([journey, images]) => {
  readyResult = { fallback: journey.fallback || images.failedAssets.length > 0,
    failedAssets: [...journey.failedAssets, ...images.failedAssets] };
  timeline.ready();
  if (hubHash()) { timeline.step(100000); hubLight=1; }
  previous = 0;
  if (journeyHash()) dismissForJourney();
  else requestFrame();
});
