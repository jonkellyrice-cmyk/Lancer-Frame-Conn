# Frame Conn Development Roadmap

This document records the current development state of Frame Conn based on live Foundry playtesting. It is intended to be the concise working roadmap for universal actions and the next architecture milestones before deeper weapon, mount, system, trait, core-power, talent, and resource integration.

## Status legend

- **DONE** — live-tested and behaving correctly enough to treat as complete for the current milestone.
- **PARTIAL** — substantially implemented, but still has a known behavior gap or needs further live verification.
- **TODO** — execution shell may exist, but the mechanic is not yet implemented correctly.
- **CONTENT-DEPENDENT** — requires actor-owned weapons, mounts, systems, traits, talents, core powers, core bonuses, or similar content discovery before it can be considered complete.

---

## Universal actions — done

### Quick Tech — Lock On — DONE

Live-tested successfully.

Expected behavior:

- no roll;
- acquire exactly one valid target;
- target must be within Sensors;
- apply the native Lancer `lockon` status to the target;
- enemy/NPC mutation is GM-authoritative when required by Foundry permissions.

### Stabilize — DONE

Live-tested successfully through the native Lancer Stabilize workflow.

Keep native Lancer as the execution authority. Do not duplicate native cooling, repair, reload, Burn, Exposed, or related Stabilize behavior in Frame Conn unless a specific native omission needs an explicit Frame Conn interaction.

### Shut Down — DONE

Live-tested successfully.

Applies the native `shutdown` status.

### Boot Up — DONE

Live-tested successfully.

Removes the native `shutdown` status.

### Hide — DONE

Live-tested successfully for the current implementation scope.

Applies native Hidden state and uses Frame Conn status orchestration for the application side.

### Skill Check — DONE / DOCUMENTATION VERIFY

The mech-skill check path is functioning.

Verify that the implementation and documentation explicitly record this as an intentional supported state rather than an accidental consequence of the generic HULL / AGI / SYS / ENG execution path.

### Search — DONE

Live-tested successfully as far as current testing could determine.

A successful Search correctly removes the target's native Hidden condition.

---

## Universal actions — partial or incomplete

### Overcharge — PARTIAL

Overcharge substantially works, but Frame Conn's escalation state must not exist independently from the native Lancer actor state.

Required fix:

- use the same authoritative escalating Overcharge/Heat cost represented by the character sheet/native Lancer system;
- Frame Conn must read/delegate to native state rather than maintain a separate escalation counter.

### Grapple — TODO

The attack portion exists, but Grapple needs dedicated post-hit resolution instead of falling through the generic attack/damage workflow.

Required behavior after a successful Grapple attack includes the Grapple relationship and its specific status/rules consequences; it should not proceed as though it were an ordinary weapon attack that now needs a damage roll.

### Ram — TODO

The attack portion exists, but Ram needs dedicated post-hit resolution instead of falling through the generic attack/damage workflow.

Required behavior after a successful Ram attack includes Prone and any applicable forced-movement handling; it should not proceed as an ordinary attack awaiting generic damage resolution.

### Quick Tech — Invade — Fragment Signal — PARTIAL / EXPIRY TEST NEEDED

The action currently works and applies its intended statuses.

Still needs live verification that Impaired and Slowed expire at the correct rules timing: the end of the target's next turn.

### Quick Tech — Bolster — PARTIAL

The action executes, but the granted Accuracy is not currently represented as a durable, consumable game state.

Required work:

- record Bolster on the target;
- make the next applicable skill check or save consume/use that Accuracy according to Lancer rules;
- avoid a Frame Conn-only shadow value if an authoritative native representation can be used or extended safely.

### Quick Tech — Scan — TODO / TARGETING BUG

Current failure:

> You must target a token to scan.

This occurs even when a Foundry token is already targeted.

Required work:

- trace the native Scan target-input shape;
- adapt Frame Conn's selected-target representation to what the native Scan workflow actually expects;
- preserve the native Scan workflow as execution authority.

### Disengage — TODO / EXECUTION FAILURE

Current live error:

> Frame Conn canonical action execution did not succeed, fail

Required work:

- trace the transaction result and exact failure boundary;
- preserve Disengage's current intended status/reaction-suppression semantics once execution succeeds.

### Brace — TODO

Current failure: no Brace prompt appears when the relevant damage/reaction opportunity occurs.

Required work:

- verify the native damage/attack hook where the Brace opportunity should be surfaced;
- present a player prompt explaining the consequence;
- allow Brace / Do Not Brace;
- only spend the reaction and apply Brace state if accepted.

### Mount / Dismount / Eject — TODO

The action currently executes as a no-roll shell but has no meaningful gameplay effect.

Desired pilot/mech state model:

- Frame Conn must know whether the pilot is currently inside/piloting the mech;
- if piloting, execution should offer **Dismount** or **Eject**;
- Dismount should place/show the pilot token in the mech's current space;
- Eject should use its separate rules consequences and should not simply behave as Dismount;
- if the pilot token is already outside the mech in the appropriate space, execution should allow **Mount**;
- mounting should remove/hide the pilot token from the map and mark the mech as occupied/piloted;
- Foundry Lancer does not appear to expose a complete native occupied/unoccupied mech state, so Frame Conn may need to own this narrow relationship state while continuing to use native Actors/Tokens as authority for actual documents.

This should be modeled as a pilot↔mech relationship, not as a generic status icon.

### Prepare — TODO

Prepare needs a real delayed-action/reaction model.

Required work:

- choose the action being prepared;
- declare/store its trigger;
- reserve/track the prepared action appropriately;
- execute it later as the relevant reaction when the trigger occurs;
- the prepared action itself may still require a roll, target, weapon, system, or other execution workflow when ultimately fired.

### Self-Destruct — TODO

The no-roll action shell currently executes but has no mechanical effect.

Required implementation includes the actual Self-Destruct state/workflow, including the mech being reduced to the appropriate destroyed state and the resulting area damage/explosion rules. The exact timing/countdown/native behavior should be verified against authoritative Lancer rules/native implementation before coding rather than approximated.

---

## Content-dependent action infrastructure

The following should not be completed by inventing generic effects. They need actor-owned content discovery and execution routing first.

### Activate — CONTENT-DEPENDENT

Activate must discover and present valid activations supplied by the actor's actual content, including as applicable:

- mounted systems;
- mech/frame traits;
- core powers;
- weapons;
- core bonuses;
- pilot talents;
- other actor-owned features that expose Quick or Full activations.

Frame Conn should be the command/presentation layer; native Lancer/content-specific execution remains authoritative where available.

### Protocol — CONTENT-DEPENDENT

Protocols must be discovered from actor-owned content rather than represented as a fixed universal list.

Potential sources include:

- mounted systems;
- mech/frame traits;
- core powers;
- weapons;
- core bonuses;
- pilot talents;
- other actor-owned features with Protocol timing.

### Skirmish — CONTENT-DEPENDENT

Must become mount- and weapon-aware.

Required direction:

- discover the actor's actual mounts and weapons;
- select the legal weapon/mount configuration;
- delegate the attack to native Lancer weapon execution;
- preserve target selection and action economy through Frame Conn.

### Barrage — CONTENT-DEPENDENT

Must become mount- and weapon-aware and honor Barrage-specific multi-mount/multi-weapon rules rather than using the generic Basic Attack shell.

### Overwatch — CONTENT-DEPENDENT

Must become weapon-, mount-, Threat-, and reaction-aware.

The reaction trigger and legal weapon selection should use the same future weapon/mount discovery layer used by Skirmish and Barrage.

### Mounted systems — CONTENT-DEPENDENT

Mounted-system discovery and execution is a major next-stage dependency for Activate, Protocol, Full Tech choices, resources, and numerous frame/system-specific actions.

---

## Non-action infrastructure

### Rest — TODO / NATIVE CAPABILITY AUDIT

Determine whether native Foundry Lancer exposes a Rest workflow or macro. It is not currently obvious on the standard character sheet.

If native support exists, Frame Conn should delegate to it. If not, implement Rest from authoritative Lancer rules through a dedicated non-combat-maintenance boundary rather than pretending it is a combat action.

### Full Repair — TODO

Native Foundry Lancer exposes Full Repair through a character-sheet macro, so Frame Conn should wire that existing native capability into the UI.

Full Repair is not a combat action and should probably appear as its own maintenance/control command rather than consume the turn action economy.

---

## Movement policy change

### Remove movement policing / automatic Boost behavior

Player feedback from live VTT play: Frame Conn should **not police physical token movement**.

Maps frequently require tokens to be repositioned around walls, terrain, templates, mistakes, scene setup, and other VTT concerns that do not correspond one-to-one with rules movement.

Required change:

- stop automatically triggering or spending **Boost** because a token moved beyond its standard movement allowance;
- stop automatically triggering an **Overcharge → Boost** path because a token continued moving;
- remove warnings for moving "too far";
- do not constrain or reject token dragging based on tracked movement allowance.

Do **not** delete movement measurement/tracking entirely. Movement distance remains useful for presentation, effects that genuinely depend on distance traveled, and future rules calculations. The change is specifically:

> observe movement; do not police token movement.

Frame Conn action buttons should remain the authoritative way the player declares that they used Boost/Overcharge for action-economy purposes.

---

## Status and condition architecture

Statuses/conditions need two distinct execution streams.

### 1. Player-facing action consequences

Actions that explicitly apply or remove statuses may continue through the normal action execution spine.

Examples:

- Lock On → apply Lock On;
- Hide → apply Hidden;
- Search → remove Hidden on success;
- Ram → apply Prone on success;
- Fragment Signal → apply Impaired/Slowed;
- Shut Down / Boot Up → apply/remove Shutdown.

### 2. Rules-driven status orchestration

Statuses and conditions that arise indirectly from state, geometry, timing, damage, heat, or other circumstances should be handled by a separate rules/runtime stream rather than mixed into player-facing UI code.

Examples include:

- Danger Zone derived from Heat;
- Exposed from Thermal Runaway;
- Engaged derived from spatial relationships;
- timed status expiration;
- other conditions created or removed because of rules state rather than a player pressing a status button.

Architectural rule:

```text
Player-facing command/presentation
        ↓ only when an action explicitly causes an effect
Action Execution
        ↓
Status Orchestration / Native Adapter

Rules state / geometry / timing / native events
        ↓
Rules-side Status Orchestration
        ↓
Native Adapter
```

Frame Conn can grow beyond a cockpit UI, but pure rules automation should remain architecturally separate from the player-facing command flow except at deliberate interaction boundaries.

Native Lancer ActiveEffects/status state remains authoritative; do not create a parallel Frame Conn status system.

---

## Resource management roadmap

Frame Conn needs an actor-owned resource layer that is aware of the character's actual build.

Resource discovery must include, as applicable:

- mounted systems;
- weapons;
- mech/frame traits;
- core powers;
- pilot talents;
- core bonuses;
- other actor-owned features exposing charges, Limited uses, counters, per-scene/per-round resources, or similar state.

### Resources UI

Add a dedicated **Resources** tab/panel to Frame Conn showing relevant current/max state.

Examples of useful representations:

- current / maximum uses;
- Limited charges;
- counters/stacks;
- scene/mission/rest-refresh state;
- core-power availability;
- other native resource fields discoverable from actor-owned content.

### Resource execution

Some resources are consumed by ordinary actions and should update through native execution automatically.

Others behave more like free activations and may have no clean universal action category. For those, the Resources UI may expose an **Execute / Use** control when appropriate.

Rules:

- prefer native Lancer resource state and execution when available;
- do not create independent Frame Conn counters for resources already represented by the native actor/item;
- Frame Conn-owned state should be reserved for genuinely missing orchestration concepts, not duplication.

---

## Recommended next implementation order

Before deep weapon/mount integration, close the remaining universal-action/runtime defects that do not depend heavily on equipment:

1. Scan targeting bug.
2. Disengage execution failure.
3. Brace prompt/runtime trigger.
4. Overcharge native escalation-state convergence.
5. Grapple dedicated post-hit handling.
6. Ram dedicated post-hit handling.
7. Bolster persistent/consumable Accuracy state.
8. Fragment Signal expiry live verification/fix if needed.
9. Movement-policy change: observe but stop policing/auto-Boost behavior.
10. Mount/Dismount/Eject pilot↔mech relationship model.
11. Prepare delayed-action infrastructure.
12. Self-Destruct authoritative workflow.
13. Rest / Full Repair non-action maintenance commands.

Then begin the major actor-owned-content phase:

1. mount and weapon discovery;
2. Skirmish;
3. Barrage;
4. Overwatch;
5. mounted-system discovery;
6. Activate and Protocol discovery;
7. shared resource discovery/service;
8. Resources UI;
9. expansion to frame traits, core powers, talents, core bonuses, and other owned features.

---

## Guiding architectural boundary

Frame Conn should continue converging on this division of responsibility:

```text
PLAYER-FACING FRAME CONN
command selection
planning
presentation
target acquisition
semantic intent
        ↓
CANONICAL EXECUTION / RULES SERVICES
action economy
status orchestration
resource orchestration
lifecycle
spatial/rules evaluation
        ↓
NATIVE ADAPTER
        ↓
FOUNDRY LANCER
Actors / Items / Flows / ActiveEffects / rolls / chat / document mutation
```

The player-facing cockpit should not become the rules engine, and the rules engine should not require the player-facing cockpit to function.