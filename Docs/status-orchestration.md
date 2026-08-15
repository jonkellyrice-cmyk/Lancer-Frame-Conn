# Frame Conn Status Orchestration

## Purpose

This document records the implemented Frame Conn layer that decides **when** native Lancer statuses should be applied or removed. Native Adapter remains authoritative for **how** those statuses are represented and mutated in Foundry.

The implementation lives in `scripts/feature_status_orchestration/status-orchestration-feature.js`.

## Architectural boundary

```text
action / combat / token-position event
        ↓
Frame Conn Status Orchestration
        ↓
rule determines desired native status transition
        ↓
Native Adapter applyStatus/removeStatus
        ↓
Foundry/Lancer ActiveEffect
        ↓
authoritative system.statuses.* derived state
```

Frame Conn does not create parallel persistent status booleans. Lifecycle records such as timed Fragment Signal effects and Grapple relationships may use Frame Conn state/flags because the native status icon alone does not encode their source, duration, or relationship semantics.

## Implemented action consequences

### Hide

`quick.hide` is a canonical non-roll Execute action. It applies native `hidden`. The current execution prevents hiding while already Hidden or Engaged. Full cover/invisibility/observer legality and every Hidden-breaking condition still require the later visibility/cover rules layer.

### Fragment Signal

`quick.quick-tech.invade.fragment-signal` executes the native Tech Attack. Only after a normalized native hit does Frame Conn apply native `impaired` and `slow`. The timed record lasts through the end of the target's next turn. Cleanup owns only statuses that Frame Conn actually introduced, so a pre-existing unrelated Impaired/Slowed effect is not removed. Reapplication refreshes Frame Conn-owned duration.

### Ram

`quick.ram` executes the native basic attack. Only on a normalized native hit is native `prone` applied. The optional one-space push is forced movement and remains outside status orchestration.

### Grapple

`quick.grapple` executes the native basic attack. On a hit, Frame Conn records the specific Grapple relationship, makes both participants Engaged, and applies native Immobilized to the smaller participant. If the installed Lancer status registry exposes a `grappled` presentation status, Frame Conn may mirror the relationship with that status, but the relationship record remains semantic authority. Breaking adjacency ends the tracked Grapple and removes Grapple-owned status effects.

`quick.end-grapple` is now a separate Quick Action. It resolves a native HULL-vs-HULL contested check against the selected tracked Grapple opponent and ends only that relationship on success.

### Search

`quick.search` resolves native Systems and Agility stat flows as a contested check. It does not inspect/reveal whether the target is Hidden before resolving. On success it removes native `hidden`.

### Disengage

`full.disengage` is a canonical non-roll Execute action. It removes current native `engaged` and records suppression through the end of the current turn so the derived Engaged evaluator does not immediately reapply it. The same state is available to the future Overwatch/reaction trigger system; Overwatch itself is not yet implemented.

### Shut Down / Boot Up / Lock On

These previously implemented actions continue through Native Adapter status application/removal:

- Shut Down → apply `shutdown`;
- Boot Up → remove `shutdown`;
- Lock On → apply `lockon` to the acquired target.

## Derived Engaged state

Status Orchestration listens to token/combat/canvas lifecycle events and derives Engaged from hostile adjacency using the existing Sensors distance measurement. Hidden participants are excluded unless a tracked Grapple explicitly forces the relationship. Shared Engaged mutation is GM-only to reduce multi-client write races. Disengage suppresses reapplication for its current-turn duration.

## Lifecycle persistence

Timed Fragment Signal records and Grapple relationships are stored in memory and best-effort actor flags. On canvas/combat/token events, Frame Conn rehydrates valid records from those flags before synchronization. This protects ordinary reload/scene re-entry where the current user has permission to read/write those flags.

Enemy-document mutation still depends on Foundry permissions. Live group testing should specifically verify player-applied enemy statuses and may reveal the need for a GM-authoritative socket service.

## Deliberate non-implementations

### Stabilize condition clearing

Native Stabilize already automates Cool/Exposed, Burn, Reload, HP/Repair, and chat. Its Clear Own Condition and Clear Ally Condition branches explicitly leave condition selection/removal manual. Frame Conn will not guess which condition should be cleared. A future enhancement needs a condition picker or a deliberate native Flow extension.

### Cover

Cover is attacker-relative: flanking or geometry can negate cover against one attacker while preserving it against another. Therefore Frame Conn does **not** persist one global `cover_soft` or `cover_hard` truth from terrain adjacency. Cover belongs in attack-context geometry once terrain/cover support exists.

### Eject

Eject shares the current `full.mount-dismount` action with Mount and Dismount. Applying `impaired` at that undifferentiated action boundary would incorrectly affect ordinary Mount/Dismount. Eject automation is deferred until Eject has its own semantic execution mode; the once-per-Full-Repair restriction also requires persistent action/resource state.

### Ram push

The optional one-space displacement from Ram is forced movement, not a status effect, and belongs to Movement.

### Complete Grapple rules

This pass automates status/relationship application and cleanup. Controller contests, dragging/mirroring movement, reaction/Boost restrictions, and free release are broader Grapple-rule work rather than status mutation.

## Live validation status

All source-side changes pass the permanent FilePatcher/toolchain gates. These new status interactions remain queued for the planned grouped Foundry live test.
