# Additional engine distributions

- `rapier-0.21.0.mjs`: `@dimforge/rapier3d-compat` 0.21.0, official npm distribution `dist/rapier.mjs`, Apache-2.0. Source: https://github.com/dimforge/rapier.js and https://rapier.rs/. License: `RAPIER-LICENSE.txt`.
- `three-pathfinding-1.3.0.js`: `three-pathfinding` 1.3.0, official npm distribution `dist/three-pathfinding.module.js`, MIT. The `three` import is redirected to `./three.module.js`; a source notice is prepended. Source: https://github.com/donmccurdy/three-pathfinding. License: `THREE-PATHFINDING-LICENSE.txt`.

These are client-side libraries, served locally with the game. No external CDN or remote computation is required. Their source maps are not needed for gameplay.
