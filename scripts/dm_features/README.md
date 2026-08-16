# Frame Conn DM Features

This directory is reserved for **GM/DM-facing feature code**. It is intentionally separate from `player_features/` and `rules_features/`.

## Responsibility

DM features will own workflows where the GM authors, organizes, reveals, tracks, or operates campaign and mission information. They should not become a second rules engine and should not contain player-cockpit presentation code.

Examples include mission planning, objectives, briefing material, reserves organization, complications, scene/encounter notes, and mission debrief state.

## Future composition

`dm-feature-registry.js` will eventually declare the installed DM-facing feature package. `scripts/runtime-orchestrator.js` will remain the application-level composition root that combines player, rules, and DM feature families.

## Current state

Scaffold only. Nothing in this directory is registered or executed yet.
