# Frame Conn Hardsuit UI

This directory is reserved for a **separate, smaller player-facing Foundry application** representing the pilot's hardsuit/helmet HUD while they are outside their mech in tactical combat.

## Relationship to Frame Conn

Frame Conn and Hardsuit represent two different fictional interfaces:

- **Frame Conn** — mech cockpit instrumentation and command surface.
- **Hardsuit** — personal helmet HUD and on-foot tactical controls.

Hardsuit should therefore not be implemented as a tab inside the existing Frame Conn cockpit window. The runtime may switch which window is relevant based on pilot/mech occupancy while preserving the same underlying activation state.

## Presentation goal

Hardsuit should be deliberately smaller and simpler than Frame Conn. It will eventually emphasize pilot telemetry, remaining action/movement budget, pilot weapons/gear, nearby tactical information, and a compact action surface.

## Current state

Scaffold only. No application class, styles, imports, or runtime registration are active yet.
