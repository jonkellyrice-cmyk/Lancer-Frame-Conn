# Frame Conn Narrative Play UI

This directory is reserved for a **separate, very lightweight player-facing Foundry application** used during Narrative Play and Downtime.

## Relationship to the other player interfaces

Frame Conn now anticipates three distinct player-facing interface contexts:

- **Frame Conn** — full mech cockpit instrumentation for tactical mech combat.
- **Hardsuit** — smaller helmet HUD for a dismounted pilot during tactical mech combat.
- **Narrative Play** — the simplest interface, focused on narrative intent, rolls, consequences, challenges, and between-mission choices rather than tactical telemetry.

Narrative Play should not be implemented as a tab inside either combat interface because it represents a different gameplay phase and interaction model.

## Presentation goal

Keep the window minimal. Likely persistent information includes the current goal/stakes, chosen trigger/roll mode, challenge progress when applicable, important pilot condition/harm state, and compact access to Downtime/Reserves when between missions. Most interaction should occur through focused prompts and concise result cards rather than a dense dashboard.

## Current state

Scaffold only. No application class, styles, imports, or runtime registration are active yet.
