# PISCES entrance: cinematic jigsaw universe

Scope: the entrance ends at **PISCES / PIECE TOGETHER THE UNIVERSE**. There is no homepage/pass-through transition. The existing Cosmos Explorer Journey, camera controls, navigation and atlas remain available at their existing URLs.

## Recovery and local review

The pre-refinement cinematic entrance is committed and pushed at `71f9aa6`, tag `pisces-before-continuity-2026-09-13`. The previous astronomy montage is committed and pushed at `01931b9`, annotated tag `pisces-entrance-montage-2026-09-12`. Earlier recovery points remain: `pisces-entrance-sculptural-2026-09-12` (`38fb0e0`), `pisces-entrance-initial-2026-09-12` (`c6587a0`), and `pre-pisces-2026-09-12` / `codex/pre-pisces` (`bc5c693`).

Serve this same repository using VS Code Live Server or a local HTTP server. Hard-refresh `index.html` without a Journey fragment to review the entrance. **Replay entrance** repeats the film using prepared assets. A direct `index.html#departure` or saved Journey scale/progress fragment restores the preserved Journey after preparation. The redesign remains local for visual review before its milestone commit.

## Storyboard

| Shot | Duration | Purpose |
| --- | --- | --- |
| Mystery | 1.4 s | Camera already moving; a large Earth piece and close silhouettes introduce the jigsaw language. |
| Discovery | 1.8 s | Fly toward Saturn, diagrams, galaxies and other imagery at different depths. |
| Acceleration | 1.9 s | Arc between pieces with controlled roll, page flips and independent studies travelling in loose groups. |
| Scale reveal | 1.7 s | Pull back more than 150 world units to reveal the deep population. |
| Convergence | 3.4 s | Orbit around staggered streams as the same pieces align into an irregular, gently curved, connected structure. |
| Silence | 0.7 s | Ease into a still close view of the one empty central socket. |
| Readiness hold | As needed | Camera and pieces remain still until actual assets settle. |
| Final piece | 1.4 s | Follow the detailed piece into the opening. |
| Seating / response | 0.6 s | Precise 130 ms seating and 470 ms restrained outward alignment/light response. |
| Identity | 1.8 s | Pull back as imagery resolves into the shared PISCES wordmark and tagline. |

The ready-at-start film lasts **14.7 seconds**. Camera position and viewing target use continuous authored paths. There is no random shake. A shared identity texture is mapped across the actual assembled pieces, so the lettering emerges from their surface instead of appearing as an unrelated caption.

## Rendering and density

- 24 foreground pieces (including the key) use shared beveled, extruded jigsaw geometry with visible sides and restrained lighting.
- The central identity region has 527 pieces. Its 503 non-hero pieces form one instanced batch. Every mid-distance and distant piece has a unique adjoining slot outside that region; none fade out or get replaced during convergence. The full tier assembles 18,727 physical identities; the smaller tier assembles 5,877.
- The standard tier adds 2,200 mid-distance jigsaw silhouettes and 16,000 distant masked impostors. Both populations animate in their vertex shaders. These are bounded seeded populations, not unique meshes or millions of objects.
- Smaller screens and lower reported memory/core counts start at 850 mid-distance and 4,500 distant pieces with a smaller texture atlas. Sustained slow frame intervals reduce pixel ratio. The population is selected once at startup and remains intact throughout the film.
- A padded shared atlas holds the 29 astronomy studies. Physical colors remain readable independently of a dark environment. Each piece samples its own complete image or diagram throughout the flight and assembly. There are no shared-photo crops across neighboring pieces.
- No per-frame image generation, particle bloom or expensive post-processing. The entrance pauses while hidden and at the readiness hold, then stops drawing after the final identity. The preserved Journey does not render behind it.

The layer density and camera scale are artistic compositions, not an astronomical distance model. Device performance still needs local browser review; population counts are not an FPS claim.

## Modules

`entrance.js` retains readiness, replay, accessibility, visibility and direct-Journey handling. `entrance-timing.js` owns shot timing and the real readiness gate. `entrance-camera.js` owns the camera storyboard and responsive framing. `entrance-model.js` defines matching silhouettes, the complete puzzle, authored close encounters and seeded fields. `entrance-renderer.js`, `entrance-shaders.js` and `entrance-textures.js` provide the GPU batches, physical foreground pieces and shared artwork. `entrance-fallback.js` presents the same concept with Canvas 2D. `entrance-artwork.js` prepares real local imagery and schematic fallbacks.

## Loading, reduced motion and fallback

The existing `window.cosmosAssetsReady` signal still combines Earth/Moon surface preparation and actual Three.js texture results. The entrance also waits for its own images to decode. Its shots may run using immediate schematic studies while imagery loads. The final piece is present in the field and moves into a near-camera holding position during convergence; it cannot enter its slot until the combined readiness result arrives.

Failed or stalled images retain populated schematic content. The existing 15-second deadline selects a real fallback; late image callbacks are ignored. Drawing/update exceptions and disposal cannot leave image readiness pending. A failed WebGL setup, shader compilation or context loss selects Canvas 2D. That version retains recognizable jigsaw clipping, depth sorting, camera motion, the central region and 180 cheaper distant pieces, each retained with its own adjoining target.

Reduced motion uses a stable, fully framed assembled puzzle with its center absent until readiness, then displays the identity without travel or flips. Status is exposed to assistive technology without visible loading copy. Replay retains asset readiness. The finished reveal never automatically opens a new homepage.

## Imagery and credits

The previous seven optimized WebP files total approximately 594 KiB. This pass adds ten further local studies (about 1.27 MiB): Webb Carina and Southern Ring, Chandra Cassiopeia A, Enceladus, Europa surface observations, Titan radar mapping, a Juno illustration, IC 4499, Horsehead and the WISE Eagle Nebula. They include Earth/Moon derivatives and official NASA imagery of the Crab Nebula, the Whirlpool Galaxy, the Sun's corona, a modeled black-hole accretion disk, and Hubble above Earth. Existing Saturn/Jupiter/Mars assets are reused. All imagery is hosted locally.

Exact source pages, original image URLs, credits and processing notes are in [assets/entrance-sources.json](../assets/entrance-sources.json). Existing planet credits remain in [assets/atlas-sources.json](../assets/atlas-sources.json). The Sun image is assigned-color extreme ultraviolet; the black hole is explicitly a scientific visualization. Original coordinate, spectral, orbit, geometry, star and cosmic-web studies are schematic rather than measured datasets.

## Validation

Run `node --test tests/entrance.test.mjs tests/entrance-timing.test.mjs tests/entrance-camera.test.mjs tests/entrance-continuity.test.mjs tests/entrance-renderer.test.mjs`.

39 checks cover actual complementary contour seams, contour integrity, complete assembly, the central gap, finite transforms, reproducible field depth, camera continuity and framing, the complete film duration, real-readiness gating, reduced motion and replay. Syntax checks cover every entrance module. Geometry was also constructed against the local Three.js version, and camera projection was sampled without a browser. Artwork contract checks exercised all 29 synchronous canvases, 20 image requests, successful decode, failure, disposal, and throwing draw/update callbacks.

A fresh browser visual/GPU check remains for local review. The previously denied browser preview has not been retried or bypassed.

## Continuity architecture

Every record has a persistent ID, assigned content, origin, rotation, scale, final slot and target. The render batches and per-instance texture coordinates are allocated once. GPU trajectories interpolate those records along cluster-coordinated arcs; the same objects become the assembled structure. The outer slots are ordered expanding lattice rings with an asymmetric boundary. A shared shallow surface deformation preserves matching seams while giving the object depth. Only the post-lock identity response dims the artwork.

The regression tests verify unique slots across both complete density tiers, edge connectivity, unchanged instance buffers/content through assembly, a visible near-camera key during the readiness hold, and continuous trajectories. The renderer test constructs real Three.js scene geometry and substitutes only the GPU endpoint; it does not claim shader compilation or browser visual verification.
