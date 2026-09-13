import { fragments, fragmentPose, puzzleOutline, createField, CELL, compositionBounds as bounds } from './entrance-model.js';
import { cameraPose } from './entrance-camera.js';
import { createIdentity, createArtworkAtlas, createPuzzleMask } from './entrance-textures.js';
import { pieceVertex, pieceFragment } from './entrance-shaders.js';
export { createCanvasMontage } from './entrance-fallback.js';

export function createMontageRenderer({ THREE, mount, artwork, onLost, onInvalidate }) {
  const small = innerWidth < 700 || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x020405); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true'); mount.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48, 1, .12, 600);
  const resources = [], population = [], heroes = [];
  let alive = true, dpr = small ? 1.15 : 1.5, lastFrame = 0, slow = 0, samples = 0, degraded = false;
  const atlas = createArtworkAtlas(artwork, small ? 256 : 512), identity = createIdentity();
  const texture = (canvas, srgb = true) => {
    const map = new THREE.CanvasTexture(canvas);
    if (srgb) map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(small ? 2 : 4, renderer.capabilities.getMaxAnisotropy());
    resources.push(map); return map;
  };
  const atlasMap = texture(atlas.canvas), identityMap = texture(identity.canvas), maskMap = texture(createPuzzleMask(), false);
  const common = {
    uAtlas: { value: atlasMap }, uIdentity: { value: identityMap }, uMask: { value: maskMap },
    uConvergence: { value: 0 }, uTime: { value: 0 }, uAcceleration: { value: 0 },
    uBrand: { value: 0 }, uReveal: { value: 0 }, uResonance: { value: 0 }, uFieldReveal: { value: 0 },
  };
  function material(defines = {}, overrides = {}) {
    const result = new THREE.ShaderMaterial({ defines, uniforms: { ...common,
      uPopulation: { value: 0 }, uOpacity: { value: 1 },
      uRect: { value: new THREE.Vector4(...atlas.rect('earth')) }, uPatch: { value: new THREE.Vector4(0, 0, 1, 1) },
      uBoardCenter: { value: new THREE.Vector2() }, ...overrides },
      vertexShader: pieceVertex, fragmentShader: pieceFragment,
      side: THREE.DoubleSide, transparent: true, depthWrite: true });
    resources.push(result); return result;
  }
  function shape(samples) {
    const result = new THREE.Shape();
    puzzleOutline(samples).forEach(([x, y], i) => i ? result.lineTo(x, y) : result.moveTo(x, y));
    result.closePath(); return result;
  }
  // Hero pieces are actual beveled solids. All share the same geometry and image atlas.
  const solid = new THREE.ExtrudeGeometry(shape(5), { depth: .11, bevelEnabled: true,
    bevelThickness: .012, bevelSize: .014, bevelSegments: 1, steps: 1, curveSegments: 1 });
  solid.translate(0, 0, -.055); resources.push(solid);
  const flat = new THREE.ShapeGeometry(shape(3)); resources.push(flat);
  const impostor = new THREE.PlaneGeometry(CELL * 1.6, CELL * 1.6); resources.push(impostor);
  for (const fragment of fragments.filter(f => f.hero >= 0 || f.id === 'key')) {
    const patch = fragment.hero >= 18 && fragment.hero <= 20
      ? [ (fragment.hero - 18) / 3, 1 / 3, 1 / 3, 1 / 3 ] : [0, 0, 1, 1];
    const mat = material({}, { uRect: { value: new THREE.Vector4(...atlas.rect(fragment.content)) },
      uPatch: { value: new THREE.Vector4(...patch) }, uBoardCenter: { value: new THREE.Vector2(...fragment.center) } });
    const mesh = new THREE.Mesh(solid, mat); scene.add(mesh); heroes.push({ fragment, mesh, material: mat });
  }
  const vectorAttribute = (geometry, name, values, size) => geometry.setAttribute(name,
    new THREE.InstancedBufferAttribute(new Float32Array(values), size));
  function makePopulation(items, base, distant = false, field = false) {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    for (const [name, attribute] of Object.entries(base.attributes)) geometry.setAttribute(name, attribute);
    vectorAttribute(geometry, 'aOrigin', items.flatMap(p => p.station || p.position), 3);
    vectorAttribute(geometry, 'aTarget', items.flatMap(p => p.center ? [...p.center, 0] : p.target), 3);
    vectorAttribute(geometry, 'aTurn', items.flatMap(p => p.turn), 3);
    vectorAttribute(geometry, 'aMeta', items.flatMap(p => [p.scale, p.seed, p.index, 0]), 4);
    vectorAttribute(geometry, 'aRect', items.flatMap(p => atlas.rect(p.content)), 4);
    vectorAttribute(geometry, 'aPatch', items.flatMap(p => !field
      ? [p.column % 3 / 3, p.row % 3 / 3, 1 / 3, 1 / 3] : [0, 0, 1, 1]), 4);
    geometry.instanceCount = items.length;
    const mat = material({ POPULATION: 1, ...(distant ? { IMPOSTOR: 1 } : {}) }, { uPopulation: { value: field ? 1 : 0 } });
    if (field) mat.depthWrite = false;
    const mesh = new THREE.Mesh(geometry, mat);
    // Shader travel exceeds the untransformed base geometry's bounding sphere.
    mesh.frustumCulled = false;
    scene.add(mesh); resources.push(geometry);
    const result = { mesh, geometry, material: mat, max: items.length, field };
    population.push(result); return result;
  }
  makePopulation(fragments.filter(f => f.hero < 0 && f.id !== 'key'), flat);
  const middle = makePopulation(createField(small ? 850 : 2200), flat, false, true);
  const distant = makePopulation(createField(small ? 4500 : 16000, true), impostor, true, true);

  // A real open socket remains during silence and the asset-readiness hold.
  const socket = new THREE.BufferGeometry().setFromPoints(puzzleOutline(5).map(([x, y]) => new THREE.Vector3(x, y, -.07)));
  const socketMaterial = new THREE.LineBasicMaterial({ color: 0xa9c1cb, transparent: true, opacity: 0, depthWrite: false });
  const socketLine = new THREE.LineLoop(socket, socketMaterial); scene.add(socketLine); resources.push(socket, socketMaterial);

  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
    renderer.setSize(Math.max(1, innerWidth), Math.max(1, innerHeight));
    camera.aspect = innerWidth / Math.max(1, innerHeight); camera.updateProjectionMatrix();
  }
  resize();
  const lost = event => { event.preventDefault(); if (alive) onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.debug.onShaderError = () => { queueMicrotask(() => { if (alive) onLost(); }); };
  document.fonts.ready.then(() => { if (alive) { identity.paint(); identityMap.needsUpdate = true; onInvalidate(); } });
  return {
    resize,
    update(id) { atlas.update(id); atlasMap.needsUpdate = true; },
    draw(state, reduced) {
      const shot = cameraPose(state, camera.aspect, reduced);
      camera.fov = shot.fov; camera.position.set(...shot.position); camera.lookAt(...shot.target); camera.rotateZ(shot.roll);
      camera.updateProjectionMatrix();
      common.uConvergence.value = reduced ? 1 : state.convergence;
      common.uTime.value = reduced ? 0 : state.filmTime;
      common.uAcceleration.value = state.acceleration;
      common.uBrand.value = state.brand; common.uReveal.value = state.reveal;
      common.uResonance.value = reduced ? 0 : state.resonance;
      common.uFieldReveal.value = reduced ? 1 : .07 + .93 * state.discovery;
      for (const { fragment, mesh, material: mat } of heroes) {
        const pose = fragmentPose(fragment, state, reduced);
        mesh.position.set(...pose.position); mesh.rotation.set(...pose.rotation); mesh.scale.setScalar(pose.scale);
        mesh.visible = pose.opacity > .001;
        mat.uniforms.uOpacity.value = pose.opacity;
      }
      for (const item of population) item.mesh.visible = !item.field || (!reduced && state.convergence < .98 && state.brand === 0);
      socketMaterial.opacity = .6 * state.silence * (1 - state.seat) * (1 - state.brand);
      renderer.render(scene, camera);
      // Downgrade sustained slow presentation, without changing choreography.
      const now = performance.now();
      if (lastFrame && !reduced && state.state !== 'awaiting' && state.state !== 'locked') {
        const interval = now - lastFrame;
        if (interval < 150) { samples++; slow += interval > 27 ? 1 : 0; }
        if (!degraded && samples >= 45 && slow / samples > .45) {
          degraded = true; dpr = 1;
          middle.geometry.instanceCount = Math.floor(middle.max * .55);
          distant.geometry.instanceCount = Math.floor(distant.max * .5);
          resize();
        }
      }
      lastFrame = now;
    },
    dispose() {
      if (!alive) return; alive = false;
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      // Shared base attributes are disposed once after population buffers.
      for (const resource of new Set(resources)) resource.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
