# Frame Conn Foundry Features

This directory is reserved for **Foundry VTT-wide features and modifications** that are useful to Frame Conn but are not specifically part of the Lancer game-system rules or native Lancer integration.

## Use this folder for

Examples include behavior involving generic Foundry concepts such as:

- Scene and Token presentation/interaction;
- generic canvas overlays or controls;
- Foundry window/application ergonomics;
- generic targeting or selection UX that is not Lancer-rule-specific;
- chat/UI enhancements that operate at the Foundry platform level;
- generic document or hook coordination that would remain meaningful even outside the Lancer system.

## Do not use this folder for

- native Lancer Actor/Item/Flow integration — that belongs in the system bridge/native adapter;
- automatic Lancer rules consequences — those belong in `rules_features/`;
- player gameplay commands — those belong in `player_features/`;
- GM mission/SITREP authoring — those belong in `dm_features/`.

## Architectural rule

The boundary should answer: **is this modifying Foundry as a platform, or implementing Lancer as a game?**

If it is platform-level, it belongs here. If it depends on Lancer-specific actors, stats, actions, statuses, tables, flows, or rules semantics, it belongs elsewhere.

## Current state

Scaffold only. No Foundry-wide feature package is registered with runtime yet.
