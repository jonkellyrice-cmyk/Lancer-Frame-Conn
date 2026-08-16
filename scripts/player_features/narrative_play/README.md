# Frame Conn Narrative Play

This directory is reserved for the **Narrative Play** sub-family of `player_features/`.

## Gameplay identity

Narrative Play is a distinct Lancer gameplay phase from tactical mech combat. It should therefore have its own player-facing interaction mode rather than appearing as another panel inside Frame Conn or Hardsuit.

The three principal player interfaces are intended to represent different contexts:

- **Frame Conn** — mech cockpit instrumentation during tactical mech combat.
- **Hardsuit** — pilot helmet HUD while dismounted during tactical mech combat.
- **Narrative Play** — a lightweight interface for goals, skill checks, consequences, challenges, narrative combat, pilot harm/recovery, downtime, and reserves outside structured mech turns.

## Future responsibility

Narrative Play will eventually coordinate:

- goal declaration and GM-defined consequences before rolls;
- trigger/background selection and native pilot skill checks;
- ordinary, Difficult, Risky, and Heroic checks;
- Teamwork, pushing, and retry restrictions;
- consequence categories such as Harm, Time, Resources, Collateral, Position, and Effect;
- group and extended Skill Challenges;
- player initiative and NPC response in narrative scenes;
- narrative combat and pilot harm/recovery;
- Downtime and mission Reserves between missions.

## Package boundary

Narrative Play remains part of the broader **player feature package**. A future `narrative-play-feature-package.js` may aggregate its internal player-facing features for inclusion by `player-feature-registry.js`. It should reuse shared rules/services and should not create another application-wide feature registry.

## Current state

Scaffold only. Nothing in this directory is registered or executed yet.
