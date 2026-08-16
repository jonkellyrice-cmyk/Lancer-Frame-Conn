# Frame Conn DM UI

This directory is reserved for a **separate GM-facing Foundry application**. It will not be a tab or mode inside the player Frame Conn cockpit.

## Future purpose

The DM application will present mission authoring and live mission-control tools such as Briefing, Preparation, Reserves, Boots on the Ground, and Debrief. It may later coordinate with Narrative Play and Downtime, but should remain optimized for GM workflow rather than player action selection.

## Shared architecture

The DM UI should consume DM feature APIs and shared system-bridge/services. It should not mutate Foundry documents directly when a shared/native execution boundary already exists.

## Current state

Scaffold only. No styles or application class are registered yet.
