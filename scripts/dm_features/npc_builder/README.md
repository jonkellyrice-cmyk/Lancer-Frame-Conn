# Frame Conn DM Features — NPC Builder

This directory is reserved for a GM-facing **NPC Builder**.

## Future responsibility

The NPC Builder should help the GM create and customize Lancer NPC combatants using native NPC classes, templates, optional systems/features, tiers, statistics, weapons, and other supported NPC content.

The builder should understand native Foundry Lancer NPC Actor/Item structure and write to that structure directly through an appropriate adapter/service boundary. It must not invent a second Frame Conn NPC schema when native Lancer already has one.

## Relationship to Encounter Builder

NPC Builder creates or edits reusable NPC actors. Encounter Builder consumes those actors to assemble a specific encounter. Keeping those responsibilities distinct allows the same NPC definition to be reused across encounters and missions.

## Current state

Scaffold only. Nothing in this directory is registered or executed yet.
