# Frame Conn DM UI

`styles/ui_dm/` owns the separate **GM-facing Frame Conn // Mission application**. It is not a tab or mode inside the player cockpit.

## Current SITREP surface

SITREP Assimilation Phase 6 provides:

- setup/configuration for Gauntlet, Control, Holdout, Escort, Extraction, and Recon;
- Scene Region and Combatant selection through the registered Foundry integration API;
- live mission title, objective, status, round, score, control, and scenario-state presentation;
- GM pause/resume/end/manual-result controls;
- Recon scan controls with true-zone knowledge retained on the GM surface;
- Escort and Extraction objective outcome controls;
- automatic rerendering while the Mission window is open when Combat state changes.

## Architecture

The application is decomposed into:

- `ui-dm-application.js` — Foundry Application lifecycle and feature contract;
- `components/dm-sitrep-view-model.js` — registered API → presentation model;
- `components/dm-sitrep-presentation.js` — HTML presentation only;
- `components/dm-sitrep-listeners.js` — DOM intent → canonical SITREP commands;
- `ui-dm-application.css` — DM Mission styling.

The UI consumes the registered `dm.sitreps` and `foundry.integration` APIs through `runtime-orchestrator.js`. It does not read SITREP flags directly, import the legacy HUD/DSL, or own its own Foundry startup shell.

The legacy movable-HUD `localStorage` position/minimized state is intentionally not carried forward because Frame Conn // Mission is a proper Foundry Application.

Future mission stages such as Briefing, Preparation, Reserves, Boots on the Ground, and Debrief should compose around this application boundary.
