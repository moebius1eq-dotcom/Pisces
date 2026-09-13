import { fragments, fragmentPose, puzzleOutline, CELL, compositionBounds as bounds, createField, surfaceDepth } from './entrance-model.js';
import { cameraPose } from './entrance-camera.js';
import { createIdentity } from './entrance-textures.js';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalized = vector => { const length = Math.hypot(...vector) || 1; return vector.map(value => value / length); };
const plus = (a, b) => a.map((value, axis) => value + b[axis]);

// Match the renderer's intrinsic XYZ Euler convention without loading Three.js.
function rotated(vector, rotation) {
  const [x, y, z] = rotation, [vx, vy, vz] = vector;
  const zx = vx * Math.cos(z) - vy * Math.sin(z), zy = vx * Math.sin(z) + vy * Math.cos(z);
  const yx = zx * Math.cos(y) + vz * Math.sin(y), yz = -zx * Math.sin(y) + vz * Math.cos(y);
  return [yx, zy * Math.cos(x) - yz * Math.sin(x), zy * Math.sin(x) + yz * Math.cos(x)];
}

function projector(view, width, height) {
  const forward = normalized(view.target.map((value, axis) => value - view.position[axis]));
  const baseRight = normalized(cross(forward, [0, 1, 0])), baseUp = cross(baseRight, forward);
  const cosine = Math.cos(view.roll), sine = Math.sin(view.roll);
  const right = baseRight.map((value, axis) => value * cosine + baseUp[axis] * sine);
  const up = baseUp.map((value, axis) => value * cosine - baseRight[axis] * sine);
  const focal = height / (2 * Math.tan(view.fov * Math.PI / 360));
  return point => {
    const offset = point.map((value, axis) => value - view.position[axis]), depth = dot(offset, forward);
    if (depth <= .18) return null;
    return { x: width / 2 + dot(offset, right) * focal / depth,
      y: height / 2 - dot(offset, up) * focal / depth, depth };
  };
}

function outlinePath() {
  const path = new Path2D();
  puzzleOutline(4).forEach(([x, y], index) => index ? path.lineTo(x, y) : path.moveTo(x, y));
  path.closePath();
  return path;
}

// Canvas receives the same camera, puzzle poses and readiness states as WebGL.
// Affine face projection and a smaller distant field keep the fallback cheaper.
export function createCanvasMontage({ mount, artwork, onInvalidate = () => {} }) {
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('A Canvas 2D context is required for the PISCES fallback.');
  canvas.setAttribute('aria-hidden', 'true');
  mount.replaceChildren(canvas);
  const path = outlinePath(), identity = createIdentity(), field = createField(180, true);
  let alive = true, width = 1, height = 1, density = 1;

  function resize() {
    if (!alive) return;
    width = Math.max(1, mount.clientWidth || window.innerWidth || 1);
    height = Math.max(1, mount.clientHeight || window.innerHeight || 1);
    density = Math.min(1.25, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    onInvalidate();
  }

  function face(piece, pose, project, view) {
    if (!(pose.opacity > .005)) return null;
    const center = project(pose.position);
    if (!center) return null;
    const horizontal = project(plus(pose.position, rotated([pose.scale, 0, 0], pose.rotation)));
    const vertical = project(plus(pose.position, rotated([0, pose.scale, 0], pose.rotation)));
    if (!horizontal || !vertical) return null;
    const a = horizontal.x - center.x, b = horizontal.y - center.y;
    const c = vertical.x - center.x, d = vertical.y - center.y;
    const radiusX = (Math.abs(a) + Math.abs(c)) * CELL * .81;
    const radiusY = (Math.abs(b) + Math.abs(d)) * CELL * .81;
    if (radiusX < .35 || radiusY < .35 || Math.abs(a * d - b * c) < .04
      || center.x + radiusX < -4 || center.x - radiusX > width + 4
      || center.y + radiusY < -4 || center.y - radiusY > height + 4) return null;
    const back = project(plus(pose.position, rotated([0, 0, -.14 * pose.scale], pose.rotation))) || center;
    const facing = dot(rotated([0, 0, 1], pose.rotation),
      normalized(view.position.map((value, axis) => value - pose.position[axis])));
    return { piece, pose, center, a, b, c, d, back, facing, size: Math.max(radiusX, radiusY) };
  }

  function setFaceTransform(face, offsetX = 0, offsetY = 0) {
    context.setTransform(face.a * density, face.b * density, face.c * density, face.d * density,
      (face.center.x + offsetX) * density, (face.center.y + offsetY) * density);
  }

  function paintArtwork(piece, tile) {
    context.save();
    context.scale(1, -1);
    // Each physical piece keeps its own complete study from flight to seating.
    context.drawImage(tile, -.8 * CELL, -.8 * CELL, CELL * 1.6, CELL * 1.6);
    context.restore();
  }

  function paint(face, brand, reveal) {
    const { piece, pose, facing, size } = face;
    const alpha = pose.opacity * reveal, imageAlpha = alpha * (1 - brand);
    if (alpha <= .005) return;
    if (imageAlpha > .005) {
      setFaceTransform(face, face.back.x - face.center.x, face.back.y - face.center.y);
      context.globalAlpha = imageAlpha;
      context.fillStyle = '#34404a'; context.fill(path);
      setFaceTransform(face);
      context.fillStyle = '#15202a'; context.fill(path);
    }
    context.save();
    setFaceTransform(face);
    context.clip(path);
    if (imageAlpha > .005) {
      context.globalAlpha = imageAlpha;
      const tile = artwork.tiles.get(piece.content) || artwork.tiles.get('stars');
      if (tile) paintArtwork(piece, tile);
      // A darker back surface makes page flips read as physical rotation.
      const shade = facing < 0 ? .42 : .12 * (1 - facing);
      if (shade > .005) {
        context.globalAlpha = imageAlpha * shade;
        context.fillStyle = '#030609'; context.fillRect(-CELL, -CELL, CELL * 2, CELL * 2);
      }
      if (pose.wave > .005) {
        context.globalAlpha = imageAlpha * pose.wave * .18;
        context.fillStyle = '#dbe9ef'; context.fillRect(-CELL, -CELL, CELL * 2, CELL * 2);
      }
    }
    if (brand > 0 && piece.center) {
      context.globalAlpha = alpha * brand;
      context.scale(1, -1);
      context.drawImage(identity.canvas, bounds.left - piece.center[0], piece.center[1] - bounds.top,
        bounds.right - bounds.left, bounds.top - bounds.bottom);
    }
    context.restore();
    if (imageAlpha > .005 && size > 2) {
      setFaceTransform(face);
      context.globalAlpha = imageAlpha * (piece.hero >= 0 || piece.id === 'key' ? .58 : .3);
      context.strokeStyle = facing < 0 ? '#768694' : '#c5d7df';
      context.lineWidth = Math.min(.025, .85 / Math.max(1, Math.hypot(face.a, face.b)));
      context.stroke(path);
    }
  }

  function draw(state, reduced = false) {
    if (!alive) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = '#020405'; context.fillRect(0, 0, canvas.width, canvas.height);
    const view = cameraPose(state, width / height, reduced), project = projector(view, width, height);
    const brand = Number.isFinite(state.brand) ? clamp(state.brand) : 0;
    const reveal = reduced ? 1 : Number.isFinite(state.reveal) ? clamp(state.reveal) : 1;
    const faces = [];
    const convergence = ease(state.convergence || 0);
    for (const piece of [...field, ...fragments]) {
      const pose = fragmentPose(piece, state, reduced);
      pose.position[2] += surfaceDepth(...piece.center) * convergence;
      const projected = face(piece, pose, project, view);
      if (projected) faces.push(projected);
    }
    faces.sort((a, b) => b.center.depth - a.center.depth);
    for (const entry of faces) paint(entry, entry.piece.center ? brand : 0, reveal);
    context.globalAlpha = 1;
  }

  if (document.fonts?.ready) document.fonts.ready.then(() => {
    if (!alive) return;
    identity.paint(); onInvalidate();
  });
  resize();
  return {
    resize,
    update() { if (alive) onInvalidate(); },
    draw,
    dispose() {
      if (!alive) return;
      alive = false; field.length = 0;
      canvas.remove(); canvas.width = 1; canvas.height = 1;
      identity.canvas.width = 1; identity.canvas.height = 1;
    },
  };
}
