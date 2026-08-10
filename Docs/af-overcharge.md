# AF — Overcharge

## Status

**Native dedicated Overcharge execution flow:** Found.

**Native actor entry point:** Found.

**Native `actor.beginOverchargeFlow()`:** Found.

**Native Overcharge mechanical resolution:** Found.

**Native escalating Overcharge Heat handling:** Found.

**Native actor-side Overcharge progression/state:** Found.

**Existing Frame Helm Overcharge implementation:** Found.

**Existing Frame Helm native Overcharge invocation:** Found.

**Frame Helm implementation status:** Frame Helm should preserve its existing player-facing Overcharge turn-economy and planning behavior while delegating the actual Overcharge mechanical resolution to native `actor.beginOverchargeFlow()`.

## Purpose

This document records the native Foundry Lancer findings relevant to **Overcharge** and defines the intended Frame Helm integration boundary.

Overcharge differs from ordinary Quick, Full, Free, and Reaction actions.

It is a special once-per-turn mechanic that allows the pilot to gain an additional Quick Action at the cost of Heat.

Frame Helm already implements Overcharge as part of its turn/action-planning model.

Repository investigation confirms that native Lancer also exposes an actual Overcharge execution entry point:

`actor.beginOverchargeFlow()`

Therefore:

> Frame Helm should retain ownership of Overcharge as a player-facing turn-economy operation.

while:

> Native Lancer should own the actor-side mechanical resolution of Overcharge, especially Heat and escalating Overcharge progression.

The goal is not to discard the existing Frame Helm implementation.

The goal is to move the mechanical portion behind the correct native boundary.

—

# 1. Overcharge Classification

Overcharge is a **special action-economy mechanic**.

It is not itself simply another ordinary Quick Action.

Once per turn, a pilot may Overcharge to gain:

**one additional Quick Action**

at the cost of Heat.

Therefore Overcharge has two distinct responsibilities:

1. modify the actor’s turn economy;
2. resolve the actor-side Overcharge cost.

These responsibilities belong to different architectural layers.

—

# 2. Official Turn-Economy Rule

The confirmed tabletop action-economy rule is:

Once per turn:

Overcharge for:

`Quick Action + Heat`

Conceptually:

normal turn
→ Standard Move
→ Full Action

or:

normal turn
→ Standard Move
→ Quick Action
→ Quick Action

and additionally:

once per turn
→ Overcharge
→ gain one additional Quick Action
→ suffer Overcharge Heat.

—

# 3. Overcharge Is Once Per Turn

The once-per-turn restriction is part of the player-facing turn economy.

Frame Helm already tracks the actor’s current turn and committed actions.

Therefore Frame Helm should remain responsible for:

`Has this actor already Overcharged this turn?`

Native actor Overcharge progression and Frame Helm per-turn Overcharge availability are related but not identical concepts.

—

# 4. Native Overcharge Entry Point

Repository findings confirm the native actor entry point:

`actor.beginOverchargeFlow()`

This is the correct native boundary for executing the actor-side Overcharge mechanics.

Conceptually:

actor
→ `beginOverchargeFlow()`
→ native Overcharge resolution
→ Heat/progression mutation
→ native output

Frame Helm should invoke this rather than independently reproducing Overcharge Heat mechanics.

—

# 5. Existing Frame Helm Native Invocation

Existing Frame Helm execution work already recognizes:

`special.overcharge`

and maps it to an Overcharge execution kind.

Conceptually:

`action.id === “special.overcharge”`
→ execution kind = `overcharge`

The executor then delegates to:

`actor.beginOverchargeFlow()`

This confirms that Frame Helm is already partially aligned with the desired native integration boundary.

—

# 6. Existing Frame Helm Overcharge Planning

Frame Helm also already understands Overcharge as a source of an additional Quick Action.

Committed actions can preserve an Overcharge source identity.

Conceptually:

Quick Action
→ source = normal

or:

Quick Action
→ source = overcharge

This distinction should remain.

The native Overcharge flow should not replace Frame Helm’s plan representation.

—

# 7. Native Overcharge Mechanical Ownership

Native Lancer should own the actual Overcharge mechanical cost.

This includes the escalating Heat progression associated with repeated Overcharges across the mission.

Frame Helm should not maintain a second independent implementation of this progression.

—

# 8. Overcharge Heat Progression

The normal Overcharge progression is:

First Overcharge:
→ 1 Heat

Second Overcharge:
→ 1d3 Heat

Third Overcharge:
→ 1d6 Heat

Fourth and subsequent Overcharges:
→ 1d6+4 Heat

The native Overcharge flow should be treated as authoritative for determining and applying the current Overcharge cost.

Frame Helm should not calculate this progression independently once native integration is active.

—

# 9. Why Native Ownership Matters

Overcharge progression is persistent actor/mech state.

It spans multiple turns.

It may interact with:

- Heat;
- Overheat;
- reactor state;
- actor repairs/full repair;
- native character-sheet behavior;
- special actor-owned effects.

If Frame Helm maintains a separate Overcharge progression, the two systems can drift.

Therefore:

native actor state
→ authoritative Overcharge progression

Frame Helm
→ authoritative current-turn Overcharge usage.

—

# 10. Two Different Overcharge States

It is important to distinguish:

**MISSION-SCALE OVERCHARGE PROGRESSION**

Example:

1 Heat
→ 1d3
→ 1d6
→ 1d6+4

from:

**TURN-SCALE OVERCHARGE AVAILABILITY**

Example:

not used this turn
→ available

used this turn
→ unavailable until next turn.

Native Lancer should own the first.

Frame Helm Turn state should own the second.

—

# 11. Frame Helm Should Not Replace Native Progression

If Frame Helm currently calculates:

`1`

`1d3`

`1d6`

`1d6+4`

it should eventually stop doing so as the authoritative mechanical path.

Instead:

Frame Helm
→ invoke native Overcharge

Native Lancer
→ determine current cost
→ roll cost where required
→ apply Heat
→ advance Overcharge progression.

—

# 12. Frame Helm Still Needs Overcharge Knowledge

Delegating mechanical resolution does not mean Frame Helm can treat Overcharge as an opaque button.

Frame Helm still needs to know:

- Overcharge exists;
- it is once per turn;
- it grants one additional Quick Action;
- whether it has already been used this turn;
- which committed Quick Action came from Overcharge;
- whether the Overcharge-granted action remains available.

Therefore the existing Frame Helm turn model remains necessary.

—

# 13. Proposed Responsibility Split

**FRAME HELM OWNS:**

- Overcharge player-facing control;
- once-per-turn legality;
- current-turn Overcharge-used state;
- additional Quick Action availability;
- committed-plan representation;
- Overcharge source identity on the granted Quick Action;
- authoritative actor resolution;
- native flow invocation;
- execution lifecycle;
- Turn/UI refresh.

**NATIVE LANCER OWNS:**

- Overcharge progression;
- current Overcharge Heat tier;
- Heat formula;
- Overcharge Heat roll;
- Heat application;
- actor-side Overcharge progression mutation;
- resulting native reactor/Heat behavior;
- native Overcharge chat/presentation behavior.

—

# 14. Overcharge Is Not the Granted Quick Action

The Overcharge operation and the Quick Action it grants are distinct.

Conceptually:

OVERCHARGE
→ pay Heat
→ gain Quick Action

then:

GRANTED QUICK ACTION
→ Boost
→ Skirmish
→ Quick Tech
→ Ram
→ Grapple
→ etc.

Therefore the plan should not collapse these into one action object.

—

# 15. Overcharge Parent / Granted Action Relationship

A useful conceptual relationship is:

Overcharge
→ grants action-economy resource
→ resource funds one Quick Action

The granted Quick Action should preserve:

`source = overcharge`

or equivalent structured metadata.

This lets Frame Helm distinguish it from the actor’s ordinary Quick Actions.

—

# 16. Overcharge Mechanical Execution Timing

Frame Helm should resolve native Overcharge before treating the extra Quick Action as mechanically available for execution.

Conceptually:

player chooses Overcharge
→ validate once-per-turn availability
→ invoke native `beginOverchargeFlow()`
→ native Heat/progression resolution succeeds
→ mark Overcharge used this turn
→ grant additional Quick Action
→ player may commit/execute that Quick Action

This prevents Frame Helm from granting the extra action if native Overcharge resolution fails or is cancelled.

—

# 17. Planning vs Mechanical Execution

Frame Helm may allow the player to plan:

Overcharge
→ Quick Action

before the native Overcharge mechanics have actually executed.

That is acceptable as planning state.

However, at execution time:

native Overcharge must resolve successfully before the granted Quick Action is treated as executable.

This preserves the distinction between:

plan

and:

authoritative game state.

—

# 18. Native Flow Failure

If:

`actor.beginOverchargeFlow()`

fails, errors, or is cancelled:

Frame Helm should not falsely mark Overcharge mechanically complete.

Likewise, it should not permanently grant the additional Quick Action unless the Overcharge resolution succeeded.

Exact cancellation semantics should be confirmed from the native flow.

—

# 19. Heat Must Not Be Applied Twice

Once Frame Helm delegates to native Overcharge:

Frame Helm must not also apply its own Overcharge Heat.

Wrong:

Frame Helm calculates 1d6 Heat
→ applies Heat
→ calls native Overcharge
→ native applies 1d6 Heat again

Correct:

Frame Helm validates Overcharge
→ native Overcharge resolves Heat exactly once.

—

# 20. Progression Must Not Advance Twice

Likewise, Frame Helm must not independently increment native-equivalent Overcharge progression.

Native flow should be the sole actor-side authority.

Otherwise:

Frame Helm tier advances

and:

native tier advances

could cause the actor to skip Heat tiers.

—

# 21. Current-Turn Flag Is Different

Frame Helm’s:

`overchargeUsedThisTurn`

or equivalent

should remain.

That is not duplicate mission-scale progression.

It answers a different question:

`Can this actor Overcharge again during this turn?`

This state should reset according to the Turn lifecycle.

—

# 22. Turn Reset

At the appropriate start of the actor’s next turn:

Frame Helm should reset:

current-turn Overcharge availability

without resetting:

native Overcharge progression.

Example:

Turn 1:
→ Overcharge
→ native tier advances

Turn 2:
→ Frame Helm allows Overcharge again
→ native progression remains advanced
→ next native Overcharge uses next Heat tier.

—

# 23. Full Repair and Overcharge Progression

Overcharge progression may reset through Full Repair according to Lancer rules/native implementation.

Frame Helm should not independently reset mission-scale Overcharge progression.

If native Full Repair owns that mutation:

Frame Helm should simply re-read authoritative actor state afterward.

—

# 24. Heat and Overheat

Native Overcharge may push the mech above Heat Capacity.

That may trigger Overheat behavior.

This is another strong reason to delegate actor-side Overcharge mechanics to native Lancer.

Frame Helm should not independently implement:

Overcharge Heat
→ check Heat Capacity
→ Overheat

if native actor/flow infrastructure already handles that relationship.

—

# 25. Reactor Consequences

Overcharge may indirectly cause:

- Stress;
- Exposed;
- reactor instability;
- meltdown outcomes;

through Heat/Overheat rules.

These consequences belong downstream of native Heat resolution.

Frame Helm should not special-case them inside its Overcharge turn-economy code.

—

# 26. Overcharge Is Not a Quick Action Cost

Overcharge grants a Quick Action.

It is not itself the Quick Action being spent.

Therefore:

using Overcharge
→ should not consume one of the actor’s ordinary Quick Action slots

and then grant one back.

Instead:

Overcharge
→ creates one additional Quick Action opportunity.

This distinction should remain explicit in Frame Helm Turn state.

—

# 27. Overcharge and Full Action Turns

An actor may take:

Full Action

and:

Overcharge for an additional Quick Action

subject to normal rules.

Therefore Frame Helm’s turn model should allow:

Full
+
Overcharge Quick

without incorrectly requiring the actor to have selected the normal:

Quick + Quick

turn structure.

—

# 28. Overcharge and Quick + Quick Turns

Likewise:

Quick
+
Quick
+
Overcharge Quick

is a valid conceptual action-economy shape where otherwise legal.

Frame Helm should represent the Overcharge-granted Quick independently from the normal two Quick Actions.

—

# 29. Overcharge and Duplicate Actions

The Quick Action granted by Overcharge still follows ordinary duplicate-action restrictions unless a specific rule says otherwise.

For example:

if an actor has already taken a particular Quick Action that cannot normally be repeated:

Overcharge does not inherently override that restriction.

Central action legality should enforce this.

—

# 30. Overcharge and Free Actions

Free Actions do not consume the Overcharge-granted Quick Action.

The granted resource is specifically:

one Quick Action.

Frame Helm’s resource model should preserve that distinction.

—

# 31. Overcharge and Reactions

Overcharge does not inherently grant a Reaction.

Reaction economy remains separate.

No Overcharge-specific Reaction slot should be created.

—

# 32. Overcharge and Protocols

Protocols are separate from Overcharge.

Overcharging should not consume Protocol availability unless a specific rule says so.

Likewise, using a Protocol does not consume the Overcharge-granted Quick Action.

—

# 33. Overcharge and Movement

The ordinary Standard Move remains separate from Overcharge.

Overcharge grants a Quick Action, which could then be spent on:

Boost

but Overcharge itself does not directly grant movement.

—

# 34. Overcharge and Boost

A common sequence is:

Standard Move
→ Boost
→ Overcharge
→ Boost again

if duplicate-action rules or a special Free Action permit the relevant repetition.

Frame Helm should evaluate Boost legality through the normal action system.

Overcharge only supplies the additional Quick Action resource.

—

# 35. Overcharge and Prepare

If the Overcharge-granted Quick Action is spent on Prepare:

Prepare’s normal rules apply.

The granted action’s source remains:

Overcharge

but its mechanical identity remains:

Prepare.

—

# 36. Overcharge and Quick Tech

The Overcharge-granted Quick Action can fund Quick Tech where legal.

The Quick Tech flow remains responsible for:

- Bolster;
- Lock On;
- Scan;
- Invade;
- system-granted Quick Tech options.

Overcharge should not contain any tech-action logic.

—

# 37. Overcharge and Skirmish

If the granted action is Skirmish:

Skirmish owns:

- mount selection;
- target selection;
- attack execution.

Overcharge merely supplied the action slot.

—

# 38. Overcharge and Ram / Grapple

Likewise, Overcharge can fund Ram or Grapple where legal.

The Ram/Grapple flow owns those mechanics.

Do not special-case them inside Overcharge.

—

# 39. Overcharge and Stabilize

Stabilize is a Full Action.

Therefore the Quick Action granted by Overcharge cannot itself be spent on Stabilize.

The action catalog/legality layer should prevent Full Actions from occupying an Overcharge Quick slot.

—

# 40. Overcharge and Skill Check

Skill Check is a Full Action.

Therefore it cannot be selected as the Quick Action granted by Overcharge.

Again, this belongs to central action-type legality.

—

# 41. Overcharge and Self Destruct

Self Destruct is a Quick Action.

Therefore an Overcharge-granted Quick Action may potentially be spent on Self Destruct if otherwise legal.

The Self Destruct flow then owns reactor-meltdown initiation.

This creates a potentially dangerous Heat/reactor interaction, but each action should remain responsible for its own mechanics.

—

# 42. Overcharge and Shutdown

Whether a Shut Down mech can Overcharge should follow the tabletop rules and central Shutdown action-legality model.

Do not encode this only inside the Overcharge native adapter.

—

# 43. Native Semantic Identity

Frame Helm should preserve Overcharge as a distinct semantic action identity.

Relevant conceptual identity:

`overcharge`

This may matter for:

- Talents;
- Systems;
- Traits;
- Core Powers;
- Core Bonuses;
- telemetry/history;
- action triggers.

Where native structured synergy metadata exists, prefer it.

—

# 44. Granted Action Source Identity

The Quick Action granted by Overcharge should preserve its source structurally.

Conceptually:

{
  actionId: “quick.skirmish”,
  source: “overcharge”
}

Exact data shape should follow the Actions refactor.

Do not infer Overcharge origin later from display text.

—

# 45. Existing Frame Helm Logic Should Be Refactored, Not Deleted

Because Frame Helm already implements Overcharge, the integration task is primarily a responsibility refactor.

Keep:

- UI control;
- once-per-turn availability;
- plan representation;
- extra Quick Action;
- source tracking.

Replace/custom-remove:

- Heat formula;
- Heat rolling;
- Heat mutation;
- Overcharge progression mutation.

Those actor-side mechanics should go through native Overcharge.

—

# 46. Native-System Adapter

UI code should not call:

`actor.beginOverchargeFlow()`

directly.

Preferred dependency direction:

Overcharge UI
→ action execution service
→ native-system adapter
→ authoritative actor
→ `actor.beginOverchargeFlow()`

This isolates native Lancer API knowledge from Frame Helm presentation.

—

# 47. Suggested Adapter Capability

Conceptually, the native adapter may expose:

`executeOvercharge(actor)`

which internally delegates to:

`actor.beginOverchargeFlow()`

Exact naming is illustrative only.

The important part is that Frame Helm does not reproduce native Heat mechanics around that call.

—

# 48. Authoritative Actor Resolution

At execution time:

Frame Helm should resolve the current authoritative actor.

Do not rely solely on a stale actor object captured when Overcharge was planned.

This ensures native Overcharge operates on current:

- Heat;
- progression;
- Stress;
- reactor state.

—

# 49. Authoritative Refresh

After native Overcharge completes:

Frame Helm should re-read:

- Heat;
- Heat Capacity;
- Stress;
- Exposed/reactor status if changed;
- native Overcharge progression;
- other relevant actor state.

Then:

→ refresh telemetry/UI.

Do not manually predict the resulting Heat state.

—

# 50. Native Chat/Presentation

If the native Overcharge flow produces chat output or native UI:

preserve it initially.

Frame Helm does not need to duplicate the Overcharge Heat result in another chat card unless its own action-history presentation requires a concise summary.

—

# 51. Execution Ordering

The safest initial execution ordering is:

validate Frame Helm once-per-turn legality
→ resolve authoritative actor
→ call native Overcharge
→ await native resolution
→ confirm success
→ mark Overcharge used this turn
→ expose/grant additional Quick Action
→ refresh actor/Turn/UI state.

This prevents a failed native resolution from creating a phantom Quick Action.

—

# 52. Planning Ordering

Planning may be more permissive.

Conceptually:

player plans:
→ Overcharge
→ Skirmish

Frame Helm can represent this future sequence.

But execution dependency should remain:

Overcharge must resolve
before:
Overcharge-funded Skirmish executes.

—

# 53. Execution Dependency

An action with:

`source = overcharge`

should not execute before its parent Overcharge has successfully resolved.

This can be represented as a plan dependency.

Conceptually:

Overcharge
→ prerequisite for
→ Overcharge Quick Action.

—

# 54. Roll-Based Heat Cost

Some Overcharge tiers require a Heat roll.

That roll belongs to native OverchargeFlow.

The Overcharge control itself therefore may produce dice/chat behavior even though Overcharge is not an attack or Skill Check.

Do not route it through the generic d20 execution path.

—

# 55. Overcharge Execute Control

The committed-plan control should conceptually be:

`OVERCHARGE                                  [execute]`

not:

`OVERCHARGE                                  [d20]`

The native flow may roll d3/d6 internally.

The action does not use a d20 check.

—

# 56. No Target

Overcharge requires no target.

Frame Helm should not:

- enter target-selection mode;
- require selected token;
- validate Sensors;
- calculate range.

The acting mech is the only actor involved in Overcharge resolution.

—

# 57. Idempotence

Overcharge execution should be guarded against duplicate invocation.

If the committed Overcharge has already executed:

clicking execute again should not:

- call native Overcharge again;
- apply Heat again;
- advance progression again;
- grant another Quick Action.

This is particularly important because native execution has persistent mechanical consequences.

—

# 58. Race Conditions

Frame Helm should protect against:

double-click
→ two simultaneous `beginOverchargeFlow()` calls

A simple execution lock/pending state may be required.

Conceptually:

planned
→ executing
→ executed

While:

executing
→ disable execute control.

—

# 59. Native Flow Cancellation

Repository implementation should be traced to determine whether native OverchargeFlow can be cancelled before mutation.

Frame Helm should distinguish:

flow invoked

from:

flow successfully resolved.

Do not mark the parent action executed merely because the native method was called.

—

# 60. Full Repair Reconciliation

After a native Full Repair:

Frame Helm should not retain stale assumptions about Overcharge progression.

Re-read the actor.

Native Lancer should remain authoritative for mission-scale Overcharge state.

Frame Helm’s current-turn Overcharge flag is separate and should follow Turn lifecycle.

—

# 61. Actor Replacement / Rebind

If Frame Helm switches controlled mechs:

Overcharge progression must come from the newly authoritative actor.

Do not carry progression from the previous actor through UI-local state.

Likewise, current-turn availability should be associated with the correct actor/combatant.

—

# 62. Multiple Mechs

Each mech has its own native Overcharge progression.

Frame Helm should never maintain one global Overcharge tier for the client/player.

The native actor naturally solves this.

Current-turn Overcharge usage should likewise be keyed to the acting actor/combatant.

—

# 63. Combat Lifecycle

The once-per-turn Overcharge restriction depends on turn lifecycle.

Frame Helm should reset current-turn Overcharge availability when the relevant actor begins a new turn.

Do not reset mission-scale progression.

—

# 64. Outside Combat

If Frame Helm supports action planning outside Foundry Combat:

Overcharge once-per-turn semantics need a clear Frame Helm Turn boundary.

Do not use real-world time.

The existing Frame Helm Turn model should remain the authority for the player-facing once-per-turn restriction.

—

# 65. Native-System Boundary

The desired architecture is:

OVERCHARGE
│
├── Frame Helm Turn system
│   ├── once-per-turn legality
│   ├── plan representation
│   ├── execution dependency
│   └── additional Quick Action
│
└── Native Lancer actor system
    ├── `beginOverchargeFlow()`
    ├── current Heat tier
    ├── Heat formula/roll
    ├── Heat application
    ├── Overcharge progression
    └── downstream actor consequences

This is the critical ownership split.

—

# 66. Do Not Create a Parallel Overcharge Engine

Because native `beginOverchargeFlow()` exists:

Frame Helm should not retain a second authoritative implementation of:

- Overcharge tier;
- Heat formula;
- Heat roll;
- progression increment.

Any remaining custom implementation should be treated as transitional code to remove/refactor.

—

# 67. Proposed Initial Integrated Flow

OVERCHARGE
→ player commits/plans Overcharge
→ Frame Helm verifies not already used this turn
→ resolve authoritative mech
→ execute
→ lock execution
→ native-system adapter calls:
  `actor.beginOverchargeFlow()`
→ native Overcharge resolution
→ determine native current tier
→ roll/apply Heat
→ advance native progression
→ resolve native downstream consequences
→ await completion
→ Frame Helm re-reads actor
→ mark Overcharge used this turn
→ grant one additional Quick Action
→ mark committed Overcharge executed
→ unlock execution
→ refresh telemetry/Turn/UI

Then:

OVERCHARGE QUICK ACTION
→ select/execute any legal Quick Action
→ preserve `source = overcharge`
→ normal child action flow resolves mechanics.

—

# 68. Existing Implementation Refactor TODO

- [ ] Locate all current Frame Helm Overcharge state.
- [ ] Separate current-turn usage from mission-scale progression.
- [ ] Keep current-turn `used` state.
- [ ] Keep additional Quick Action resource.
- [ ] Keep Overcharge source metadata.
- [ ] Keep committed-plan representation.
- [ ] Remove custom authoritative Heat-tier calculation.
- [ ] Remove custom authoritative Heat roll.
- [ ] Remove custom Heat mutation.
- [ ] Remove custom Overcharge progression mutation.
- [ ] Route actor-side mechanics through native `beginOverchargeFlow()`.
- [ ] Prevent duplicate native execution.

—

# 69. Immediate Repository Research TODO

- [ ] Trace `actor.beginOverchargeFlow()` completely.
- [ ] Identify native OverchargeFlow class/file.
- [ ] Record native ordered flow steps.
- [ ] Trace current Overcharge progression field.
- [ ] Trace Heat-tier calculation.
- [ ] Trace Heat roll construction.
- [ ] Trace Heat application.
- [ ] Trace progression advancement.
- [ ] Trace Overheat interaction.
- [ ] Trace Full Repair reset behavior.
- [ ] Trace native Overcharge chat output.
- [ ] Determine native flow return value.
- [ ] Determine cancellation behavior.
- [ ] Determine whether flow can fail before mutation.
- [ ] Confirm native Overcharge semantic SynergyLocation if present.
- [ ] Confirm special actor-owned Overcharge modifiers.

—

# 70. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Preserve Overcharge as a special action-economy operation.
- [ ] Preserve once-per-turn legality.
- [ ] Preserve additional Quick Action resource.
- [ ] Preserve `source = overcharge`.
- [ ] Add/retain non-d20 execute control.
- [ ] Resolve authoritative actor at execution.
- [ ] Invoke native Overcharge through native-system adapter.
- [ ] Await native resolution.
- [ ] Re-read Heat.
- [ ] Re-read Stress/reactor state.
- [ ] Re-read native Overcharge progression.
- [ ] Mark Overcharge used this turn only after successful resolution.
- [ ] Grant additional Quick Action only after successful resolution.
- [ ] Mark committed Overcharge executed.
- [ ] Prevent duplicate execution.
- [ ] Add parent/child dependency for Overcharge-funded Quick Action.
- [ ] Refresh Frame Helm telemetry and Turn UI.

—

# 71. Smoke Test TODO

Basic:

- [ ] Overcharge available once per turn.
- [ ] Overcharge requires no target.
- [ ] Overcharge does not use d20 execution.
- [ ] native Overcharge flow launches.
- [ ] native Heat applied exactly once.
- [ ] native progression advances exactly once.
- [ ] Frame Helm grants exactly one Quick Action.
- [ ] Overcharge becomes unavailable for remainder of turn.

Progression:

- [ ] first Overcharge uses native 1 Heat tier.
- [ ] second mission Overcharge uses native 1d3 tier.
- [ ] third uses native 1d6 tier.
- [ ] fourth+ uses native 1d6+4 tier.
- [ ] Frame Helm does not independently advance tiers.
- [ ] Full Repair/native reset reconciles correctly.

Turn lifecycle:

- [ ] next turn allows Overcharge again.
- [ ] next turn does not reset native progression.
- [ ] different actor has independent Overcharge state.
- [ ] current-turn usage keyed to correct actor/combatant.

Granted Quick Action:

- [ ] additional Quick Action appears only after successful Overcharge.
- [ ] granted action preserves Overcharge source.
- [ ] granted Quick Action can execute normal Quick flows.
- [ ] Full Actions cannot occupy Overcharge Quick slot.
- [ ] duplicate-action restrictions remain active.
- [ ] child action cannot execute before parent Overcharge.

Failure:

- [ ] double-click cannot invoke native flow twice.
- [ ] native failure does not grant Quick Action.
- [ ] native cancellation does not falsely mark execution complete.
- [ ] missing actor fails safely.
- [ ] stale actor is re-resolved.

Heat/reactor:

- [ ] native Heat telemetry refreshes.
- [ ] Overheat interaction remains native.
- [ ] Stress/reactor consequences refresh correctly.
- [ ] no Frame Helm double-Heat occurs.

—

# 72. Important Invariants

**Invariant 1**

Overcharge may be used once per turn.

**Invariant 2**

Overcharge grants one additional Quick Action.

**Invariant 3**

Overcharge itself is not the granted Quick Action.

**Invariant 4**

A native `actor.beginOverchargeFlow()` entry point exists.

**Invariant 5**

Native Lancer should own mission-scale Overcharge progression.

**Invariant 6**

Native Lancer should own Overcharge Heat formula, roll, and mutation.

**Invariant 7**

Frame Helm should own current-turn Overcharge availability.

**Invariant 8**

Frame Helm should own the additional Quick Action resource.

**Invariant 9**

Mission-scale progression and current-turn usage are separate states.

**Invariant 10**

Frame Helm must not apply Heat in addition to native Overcharge.

**Invariant 11**

Frame Helm must not advance native-equivalent Overcharge progression independently.

**Invariant 12**

The Overcharge-granted Quick Action should preserve `source = overcharge`.

**Invariant 13**

The granted Quick Action cannot execute until Overcharge has successfully resolved.

**Invariant 14**

Native Overcharge execution must be idempotently guarded against duplicate invocation.

—

# 73. Final Working Model

OVERCHARGE
│
├── SPECIAL ACTION-ECONOMY OPERATION
│
├── once per turn
│
├── no target
│
├── no d20 check
│
├── Frame Helm
│   │
│   ├── current-turn availability
│   ├── plan/commitment
│   ├── authoritative actor resolution
│   ├── execution guard
│   └── invoke native Overcharge
│
├── Native Lancer
│   │
│   └── `actor.beginOverchargeFlow()`
│       ├── resolve current Overcharge tier
│       ├── determine Heat formula
│       ├── roll Heat where necessary
│       ├── apply Heat
│       ├── advance native progression
│       └── resolve downstream actor consequences
│
├── Frame Helm refresh
│   ├── authoritative Heat
│   ├── Stress/reactor state
│   └── native Overcharge progression
│
└── SUCCESS
    │
    ├── mark Overcharge used this turn
    ├── grant one additional Quick Action
    └── preserve child source:
        `overcharge`
        │
        └── QUICK ACTION
            └── normal action flow

The critical architectural rule is:

**Frame Helm owns what Overcharge does to the player’s turn; native Lancer owns what Overcharge does to the mech.**

The existing Frame Helm Overcharge implementation should therefore be refactored around the native flow rather than discarded.
