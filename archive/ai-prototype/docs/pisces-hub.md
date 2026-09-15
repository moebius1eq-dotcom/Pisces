# PISCES hub foundation — Phase 1

Checkpoint: `6316ec5`, annotated tag `pisces-before-hub-2026-09-13`.

The approved entrance timeline, puzzle choreography and passage are retained.
After arrival the existing scene remains mounted, its lighting settles over 1.2 seconds,
and semantic HTML introduces the observatory hub. The arrival wordmark moves toward
the persistent header. Reduced motion immediately reveals the interface.

`hub.js` owns the semantic navigation and three direction panels; `hub.css` provides
the responsive typography, orbital study and layout. Explore links to existing
functionality. Learn and Take Part disclose their planned scope without fake listings,
dead lesson links or new major features. The globe uses the existing Earth atlas image.
The orbital diagram is decorative and is not a measured ephemeris.

The scene becomes idle after settling. Direction selection changes the foreground
astronomical study through CSS, without starting a permanent WebGL render loop.
The Canvas fallback receives the same HTML navigation. No new dependencies were added.

## Routes and return behavior

- `index.html`: approved entrance, passage, hub.
- `index.html#hub`: direct hub after real asset readiness, without replaying the film.
- `index.html#learn` / `#take-part`: direct corresponding hub direction.
- `index.html#departure`: existing Journey begins at its first camera frame.
- Existing scale and `#flight=…` fragments still dismiss the entrance into the Journey.
- `planets.html#earth` and every other existing object hash remain unchanged.
- `deep-space.html#andromeda` and the other deep-space hashes remain unchanged.
- PISCES header marks and the shared menu's Home link return to `index.html#hub`.

Journey stays in its original document for Phase 1. Entering it disposes entrance
resources and releases the existing background controls. Returning from that disposed
scene reloads `#hub`, which skips the film. A dedicated Journey page is Phase 2 work.
Atlas selection, images, facts, dialogs and renderer are preserved.

## Verification and local review

Controller integration tests cover fresh entrance → hub, idle rendering, Journey
dismissal, hub return, direct hub visits, Replay, reduced motion, WebGL fallback,
and saved Journey fragments. These use a simulated DOM/renderer and do not verify pixels.
The existing 44 entrance tests remain applicable.

The local HTTP server serves the page and route resources. Automated browser interaction
is blocked by the saved localhost browser permission. Visual layout, actual GPU output,
and full mouse/keyboard interactions still require local review.

Review at `http://127.0.0.1:8767/index.html`: let the entrance finish, choose Begin the
Journey, return using the PISCES mark, open Worlds, use its menu for Deep Sky, and return
home again. Check keyboard focus, menu Escape, phone layout, reduced motion and Replay.
Only Phase 1 has been implemented; no Journey renderer rewrite or atlas redesign.
