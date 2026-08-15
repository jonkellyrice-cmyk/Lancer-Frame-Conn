# Status-Effect Action and State Notes

## Purpose

This document records implementation-planning notes for universal actions and game states that apply, remove, or automatically derive Lancer status effects.

It complements `Docs/status.md`, which records the native Foundry Lancer status architecture and adapter boundary.

These notes are especially useful when deciding which action implementations need to call the native status adapter, which ones need lifecycle cleanup, and which statuses should be derived automatically from spatial/game state.

---

# Actions That Apply Status Effects

## Grapple

On a successful Grapple, apply the Grappled state/status to the target.

## Hide

Hide applies `hidden`.

## Quick Tech — Invade — Fragment Signal

Fragment Signal applies:

- `impaired`
- `slow` / derived `slowed`

These effects last until the end of the target's next turn.

## Ram

On a successful Ram:

- apply `prone`;
- the target may also be knocked back 1 space.

The knockback portion is movement/position resolution rather than status application and should remain separate from the native status mutation itself.

## Shut Down

Shut Down applies the native `shutdown` condition/status.

---

# Actions That Remove Status Effects

## End Grapple

Add/implement an End Grapple action.

The intended resolution is a contested HULL check used to try to end the Grapple condition.

## Search

On a successful contested SYSTEMS vs AGILITY check, Search removes `hidden`.

## Disengage

Disengage removes/prevents `engaged` for the relevant duration.

Movement performed while Disengaging should not provoke reactions until the end of the current turn.

## Stabilize

Depending on the selected Stabilize options, Stabilize may:

- clear all Heat and remove `exposed`;
- clear Burn;
- clear one condition affecting yourself that was not caused by one of your own systems;
- clear one condition affecting an ally that was not caused by one of that ally's own systems.

The native status/effect removal boundary should remain authoritative for the actual status mutation.

## Boot Up

Boot Up removes the native `shutdown` condition/status.

---

# Special Cases

## Mount / Dismount / Eject

Mounting and dismounting are not primarily status-effect actions.

Ejecting is relevant because it leaves the mech `impaired`, and the mech cannot Eject again until a Full Repair.

The one-Eject-until-Full-Repair restriction is persistent action/resource state rather than merely a status effect and should be modeled separately from native `impaired` status application.

---

# States That Automatically Apply or Remove Status Effects

## Engaged

When a PC or allied character is adjacent to an enemy, or becomes adjacent to an enemy, both characters gain `engaged` unless one of them is `hidden` or another special rule prevents engagement.

When a PC or allied character ceases to be adjacent to the enemy, the corresponding `engaged` state should be removed when no remaining qualifying engagement relationship exists.

This is a spatially derived condition and should therefore be driven by adjacency/state evaluation rather than manually persisted as Frame Conn-only state.

Conceptually:

```text
movement / token position change
        ↓
spatial adjacency evaluation
        ↓
qualifying hostile adjacency?
        │
        ├── yes → apply native engaged
        └── no  → remove native engaged when no other engagement remains
```

## Cover

Cover is also spatially/contextually derived.

When the appropriate environmental/terrain support is implemented, being adjacent to qualifying Hard or Soft Cover should establish the corresponding cover state/effect where appropriate.

Cover may be cancelled against particular attackers by flanking. In other words, cover should not be treated only as a permanent global boolean on the defender when attacker-relative geometry changes the result.

Conceptually:

```text
attacker + defender + cover geometry
        ↓
resolve qualifying soft/hard cover
        ↓
resolve flanking or other exceptions
        ↓
produce attacker-relative cover result
```

If a character moves away from the qualifying cover source, or the cover source is destroyed, the derived cover state should be removed/recomputed.

The exact cover implementation remains pending the necessary spatial/terrain feature support.

---

# Architectural Summary

These mechanics divide into three useful implementation groups:

### Action-applied native statuses

Examples:

- Hidden from Hide;
- Impaired/Slowed from Fragment Signal;
- Prone from Ram;
- Shutdown from Shut Down;
- Impaired from Eject.

Frame Conn owns the action rules and timing, while the native status adapter owns authoritative Foundry/Lancer status mutation.

### Action-removed native statuses

Examples:

- Hidden from Search;
- Shutdown from Boot Up;
- conditions removed through Stabilize;
- Grappled/engagement state ended by the appropriate action or state transition.

Frame Conn owns the removal trigger/legality, while native status/effect APIs own the mutation.

### Automatically derived spatial statuses

Examples:

- Engaged from qualifying hostile adjacency;
- Cover from attacker/defender/environment geometry.

These should be recalculated from authoritative scene state rather than maintained as independent Frame Conn shadow state.
