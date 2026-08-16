# Frame Conn Hardsuit

This directory is reserved for the **dismounted pilot combat** sub-family of `player_features/`.

## Fictional identity

**Frame Conn** is the mech cockpit instrumentation and command interface.

**Hardsuit** is the pilot's personal helmet HUD and tactical interface when they are physically outside the mech during mech combat.

That fiction should remain visible in the software architecture: Hardsuit is player-facing, but it is not merely another panel inside the mech cockpit. It should have its own smaller and simpler Foundry application window.

## Future responsibility

Hardsuit will eventually coordinate:

- pilot/mech occupancy and control handoff after Mount, Dismount, and Eject;
- pilot combat statistics and telemetry;
- the shared pilot/mech activation budget;
- pilot-legal universal actions;
- pilot-specific actions such as Fight, Jockey, and Reload;
- pilot weapons and gear;
- pilot Overwatch and reactions;
- handoff back to Frame Conn when the pilot mounts a mech.

## Package boundary

Hardsuit remains part of the broader **player feature package**. A future `hardsuit-feature-package.js` may aggregate its internal features for inclusion by `player-feature-registry.js`; it should not create another application-wide registry.

## Current state

Scaffold only. Nothing in this directory is registered or executed yet.
