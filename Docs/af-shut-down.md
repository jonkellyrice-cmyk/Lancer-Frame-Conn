# Shut Down

# AF — Shut Down

## Status

**Native dedicated Shut Down execution flow:** Not found.

**Native dedicated `beginShutDownFlow()`:** Not found.

**Native Shutdown status representation:** Found.

**Native generic status/effect infrastructure:** Found.

**Native runtime universal Shut Down executor:** Not found.

**Native Boot Up executor:** Not found.

**Frame Conn implementation status:** Frame Conn should own Shut Down execution as a Full Action state transition that applies the native Lancer `shutdown` status and any additional confirmed Shut Down consequences, while native Lancer/Foundry remains authoritative for the underlying actor status/effect state.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Shut Down** Full Action and defines the intended Frame Conn integration boundary.

Repository investigation did not reveal a dedicated executable Shut Down flow such as:

`ShutDownFlow`

or:

`beginShutDownFlow()`

The native Lancer system does, however, contain a first-class Shutdown state and generic status/effect infrastructure.

Therefore:

> Frame Conn should implement the universal Shut Down action itself.

while:

> Native Lancer should remain authoritative for the actual `shutdown` condition/state.

Shut Down should be treated as the inverse state-transition partner of Boot Up.

—

# 1. Shut Down Classification

Shut Down is a **Full Action**.

At the software architecture level, its core state transition is:

actor operational
→ Shut Down
→ actor has native `shutdown` state

The exact tabletop consequences of entering Shutdown should be implemented only from confirmed rules.

The repository findings establish the software boundary:

- Shutdown state exists natively.
- Shut Down execution does not.

—

# 2. Native Shut Down Flow Search

Repository searching did not identify:

- `ShutDownFlow`
- `ShutdownFlow`
- `beginShutDownFlow()`
- `beginShutdownFlow()`
- dedicated Shut Down actor method
- dedicated Shut Down sheet action handler
- dedicated Shut Down Flow file
- dedicated Shut Down app
- dedicated universal Shut Down runtime executor

Therefore Frame Conn cannot delegate Shut Down to a native action flow.

—

# 3. Native Shutdown Representation

The repository defines Shutdown as native actor state.

Relevant native data includes:

`src/module/base-data.ts`

with:

`shutdown: boolean`

and corresponding system-model/template state.

Relevant actor defaults initialize the concept equivalent to:

`shutdown: false`

Therefore native Lancer has an authoritative representation for:

`this actor is currently Shut Down`

Frame Conn should use that state rather than inventing a duplicate Frame Conn-only Shutdown flag.

—

# 4. Native Shutdown Status Identity

The native status infrastructure recognizes:

`shutdown`

as the Shutdown status identity.

Relevant status-icon infrastructure includes a status entry conceptually equivalent to:

`id: “shutdown”`

and localization presents that status as:

`Shut Down`

Therefore Frame Conn can rely on the native status identity for actor/canvas presentation.

—

# 5. Shutdown Is a Native Mechanical State

Shutdown is not merely display text.

It is represented in the actor’s native status model.

Therefore Frame Conn should treat native Shutdown state as the authoritative answer to:

`Is this actor currently Shut Down?`

not:

- local UI state;
- committed-plan state;
- an independently persisted Frame Conn boolean.

—

# 6. No Native Shut Down Mutation Found

Repository searching did not reveal a universal runtime path equivalent to:

Shut Down
→ apply native `shutdown`
→ complete action

Therefore Frame Conn must perform this state transition explicitly using native status/effect infrastructure.

—

# 7. Generic Native Effect Infrastructure

The native actor system exposes generic effect/status machinery.

Relevant concepts found during Boot Up/Shut Down research include:

`effectHelper`

and helper methods conceptually like:

`removeActiveEffect(...)`

`removeActiveEffects(...)`

along with Foundry status APIs such as:

`toggleStatusEffect(...)`

The exact preferred method for **applying** `shutdown` should be traced before implementation.

Frame Conn should use the highest-level native status helper available rather than manually editing raw status data if possible.

—

# 8. Preferred Mutation Strategy

The preferred architecture is:

Frame Conn
→ native status adapter
→ apply native `shutdown`
→ await authoritative actor mutation
→ re-read actor state
→ refresh UI

rather than:

Frame Conn
→ directly set arbitrary raw document internals.

The exact helper signature must be confirmed from the native API.

Do not invent a helper call without tracing it.

—

# 9. Architectural Boundary

The intended responsibility split is:

**FRAME CONN OWNS:**

- Shut Down action commitment;
- Full Action expenditure;
- Shut Down legality;
- resolving the authoritative acting mech;
- applying Shutdown through native status infrastructure;
- any additional deterministic Shut Down consequences;
- committed-action execution state;
- authoritative refresh;
- Frame Conn presentation.

**NATIVE LANCER / FOUNDRY OWNS:**

- `shutdown` status identity;
- actor status/effect storage;
- Foundry ActiveEffect/status machinery;
- native status icon;
- native status presentation;
- generic status mutation primitives.

—

# 10. Proposed Initial Shut Down Flow

The initial Frame Conn execution should be:

Player commits Shut Down
→ Shut Down appears in Committed Plan
→ player executes Shut Down
→ Frame Conn resolves authoritative acting mech
→ validate active Turn
→ validate Full Action
→ confirm actor is not already Shut Down
→ apply native `shutdown` status
→ apply any additional confirmed Shut Down consequences
→ await authoritative actor mutation
→ re-read actor state
→ mark committed Shut Down executed
→ refresh Frame Conn presentation

No attack roll is inherently required.

No target is required.

—

# 11. Shut Down Does Not Need a d20 Roll

Shut Down is not an attack or check by default.

Therefore the committed-plan UI should use a non-roll execution control.

Conceptually:

`SHUT DOWN                                 [execute]`

rather than:

`SHUT DOWN                                 [d20]`

The exact icon belongs to the UI layer.

—

# 12. Shut Down Has No Target

The affected actor is the acting mech itself.

Therefore Shut Down should not:

- enter Foundry target-selection mode;
- require a selected hostile target;
- invoke Sensors targeting;
- invoke attack targeting.

The actor executing the action is implicitly the target of the state transition.

—

# 13. Shut Down Legality

At minimum:

if actor is already Shut Down:
→ attempting Shut Down again should fail cleanly or be disabled

if actor is operational:
→ Shut Down may proceed subject to normal Full Action legality

Additional legality may come from:

- Stunned;
- destroyed state;
- reactor state;
- actor-owned special rules.

These should come from confirmed rules rather than assumption.

—

# 14. Idempotence

Shut Down should be safe against duplicate execution.

If:

`shutdown` already active

then a second execution should not:

- create duplicate ActiveEffects;
- create multiple Shutdown icons;
- corrupt actor state.

Instead:

→ reject or report already Shut Down.

—

# 15. Boot Up Pair

Shut Down and Boot Up should share one lower-level native status adapter.

Conceptually:

Shut Down
→ set shutdown state ON

Boot Up
→ set shutdown state OFF

Possible conceptual helper:

`setShutdownState(actor, active)`

Exact names are illustrative only.

The important architectural rule is:

> use one canonical native mutation path for both directions.

—

# 16. Relationship to `af-boot-up.md`

The paired documents should remain separate because:

Shut Down:
→ Full Action
→ enters Shutdown

Boot Up:
→ Full Action
→ leaves Shutdown

However, implementation should share:

- authoritative actor resolution;
- native status helper;
- status verification;
- document mutation waiting;
- presentation refresh.

—

# 17. Turn Economy Ownership

Shut Down consumes:

**one Full Action**

Frame Conn Turn state should own that expenditure.

The native status application should not independently modify the Frame Conn Full Action budget.

Conceptually:

Turn
→ spend Full Action

then:

Shut Down execution
→ apply native status

These are separate responsibilities.

—

# 18. Commit vs Execute

If Frame Conn preserves planning/execution separation:

Commit Shut Down:
→ reserve/spend Full Action according to Turn rules
→ add action to Committed Plan

Execute Shut Down:
→ revalidate current state
→ apply native Shutdown
→ mark action executed

Merely planning the action should not immediately Shut Down the mech.

—

# 19. Revalidate at Execution Time

Between commitment and execution:

- actor may already become Shut Down;
- actor may be destroyed;
- actor/token may change;
- permission may change.

Therefore execution should resolve authoritative state again.

Do not rely solely on committed-plan snapshot data.

—

# 20. Authoritative Status Check

Frame Conn should determine Shutdown from native actor state.

Preferred source:

native status/effect representation

not:

presentation CSS classes

and not:

cached Turn state.

The UI may derive semantic classes from Shutdown, but execution should use authoritative actor data.

—

# 21. Authoritative Refresh

After applying Shutdown:

→ await the native mutation
→ re-read actor state
→ verify `shutdown` active
→ update Frame Conn

Do not simply assume the state transition succeeded.

—

# 22. Failure Cases

Shut Down execution should handle:

- actor missing;
- token missing where needed;
- actor already Shut Down;
- permission denied;
- status helper unavailable;
- ActiveEffect creation fails;
- actor update rejected;
- actor state changes during execution.

The committed action should not be marked fully executed unless the required mutation succeeds.

—

# 23. Native Status Presentation

Because native Lancer already owns the Shutdown icon/state identity, Frame Conn does not need to fabricate a separate canvas condition.

Frame Conn can derive its UI from:

native Shutdown active
→ display Shut Down semantic state

This keeps character sheet, token icon, and Frame Conn aligned.

—

# 24. Do Not Duplicate Shutdown State

Avoid maintaining:

native:
`shutdown = true`

plus:

Frame Conn:
`isShutdown = true`

as separate persistent authorities.

If Frame Conn needs cached presentation state, it should always be derived/reconciled from native Shutdown.

—

# 25. Shutdown and Action Legality

Once an actor is Shut Down, other actions may become unavailable or behave differently.

This is not merely a cosmetic status.

Therefore Frame Conn’s general action-legality layer should eventually consume:

native Shutdown state

when deciding which actions can be committed/executed.

Do not bury all Shutdown consequences inside the Shut Down action itself.

—

# 26. Shutdown and Boot Up Availability

If actor has native `shutdown`:

Boot Up
→ should become relevant/legal

If actor does not have native `shutdown`:

Boot Up
→ should be disabled/rejected

This relationship should be derived directly from native actor state.

—

# 27. Shutdown and Protocol

If an actor is Shut Down at the start of its turn, whether Protocols are available depends on the confirmed tabletop rules.

Frame Conn should not assume ordinary start-of-turn Protocol availability ignores Shutdown.

This interaction should be encoded in central action legality.

—

# 28. Shutdown and Movement

A Shut Down mech may have movement restrictions or prohibition.

Frame Conn’s Movement feature should eventually consult native Shutdown state before allowing voluntary movement.

Do not implement movement blocking solely through UI disabling if token movement can still occur manually.

—

# 29. Shutdown and Reactions

Shut Down may affect Reaction availability.

If the rules prohibit reactions while Shut Down:

the central Reaction legality layer should inspect native Shutdown state.

This impacts:

- Brace;
- Overwatch;
- Prepared Actions;
- actor-owned reactions.

Do not special-case every Reaction individually.

—

# 30. Shutdown and Grapple / Ram / Search

Actions such as:

- Grapple;
- Ram;
- Search;

may become unavailable while Shut Down.

Again, this should be handled through central action legality based on native status.

The Shut Down action itself only creates the state.

—

# 31. Shutdown and Self Destruct

Self Destruct interacts conceptually with reactor state.

Whether a Shut Down mech may:

- initiate Self Destruct;
- continue an existing Self Destruct;
- detonate;

must come from the rules.

Do not assume Shutdown automatically cancels reactor meltdown.

This interaction belongs to action legality / reactor-meltdown architecture.

—

# 32. Shutdown and Mounted Pilot

Shut Down affects the mech, not necessarily the pilot’s physical mounted state.

Therefore do not automatically modify:

`pilot.system.mounted`

when Shut Down occurs.

The pilot remains inside unless they Dismount/Eject under applicable rules.

—

# 33. Shutdown Is Not Ejection

Do not conflate:

Shut Down
→ mech inactive

with:

Eject
→ pilot leaves mech

These are orthogonal states.

A mech may be Shut Down while its pilot remains mounted.

—

# 34. Shutdown and Hidden / Invisible

Shut Down should not automatically remove:

- Hidden;
- Invisible;
- Cover;

unless the actual rules say so.

Status transitions should remain narrowly scoped.

—

# 35. Shutdown and Heat / Reactor State

The Shut Down action may have heat/reactor consequences in the tabletop rules.

Those should be implemented explicitly once confirmed.

Do not infer from the name that Shutdown:

- clears all Heat;
- prevents Overheat;
- resets reactor state;
- cancels meltdown.

The repository search establishes only the native status primitive.

—

# 36. Additional Shut Down Rules Must Be Confirmed

The repository findings tell us:

- native Shutdown state exists;
- no native Shut Down action executor exists.

They do **not** prove that the entire action is:

`apply shutdown`

Therefore before final code implementation, confirm the complete official Shut Down rule text.

Any additional deterministic consequences should then be added to this flow.

—

# 37. Do Not Over-Implement From Assumption

Until the exact rule text is confirmed, do not assume Shut Down:

- clears Heat;
- clears Lock On;
- removes Hidden;
- removes Grapple;
- disables all statuses;
- reloads weapons;
- resets Limited resources;
- heals HP;
- restores Structure;
- ends reactor meltdown;
- ejects pilot.

Only implement confirmed rules.

—

# 38. Native Status Helper Research

Before implementation:

- [ ] Trace `effectHelper`.
- [ ] Confirm exact native actor effect-helper type.
- [ ] Confirm preferred method for applying one named status.
- [ ] Confirm whether `toggleStatusEffect(“shutdown”, { active: true })` is appropriate.
- [ ] Confirm whether status IDs map directly to ActiveEffects.
- [ ] Confirm required permissions.
- [ ] Confirm player-owned actor mutation behavior.
- [ ] Confirm whether GM mediation is needed.
- [ ] Confirm how native `system.statuses.shutdown` is derived.
- [ ] Confirm status icon refresh behavior.
- [ ] Confirm how duplicate status application is prevented.

—

# 39. Boot Up Companion Research

Before final implementation:

- [ ] Ensure Shut Down and Boot Up use the same status adapter.
- [ ] Confirm exact Boot Up tabletop consequences.
- [ ] Confirm exact Shut Down tabletop consequences.
- [ ] Confirm transition timing.
- [ ] Confirm interaction with turn/action state.
- [ ] Confirm whether any actor-owned effects trigger when entering/leaving Shutdown.

—

# 40. Action-Legality Integration TODO

Because Shutdown likely affects more than this action:

- [ ] Add canonical `isShutdown(actor)` native adapter.
- [ ] Feed Shutdown state into action legality.
- [ ] Feed Shutdown state into Movement legality.
- [ ] Feed Shutdown state into Reaction legality.
- [ ] Feed Shutdown state into Protocol legality.
- [ ] Feed Shutdown state into Self Destruct legality as rules require.
- [ ] Feed Shutdown state into mounted-system activation legality where required.

This should be centralized rather than repeated across every action implementation.

—

# 41. Semantic Event Architecture

Frame Conn may eventually preserve events conceptually like:

- Shut Down executed;
- actor entered Shutdown;
- actor left Shutdown.

These may matter for:

- Mounted Systems;
- Traits;
- Talents;
- Core Powers;
- Core Bonuses.

Exact internal event names are conceptual only.

Do not invent native hooks.

—

# 42. Native-System Boundary

The intended dependency direction is:

Committed Shut Down
→ Frame Conn execution strategy
→ authoritative actor resolution
→ Full Action validation
→ native status adapter
→ apply `shutdown`
→ await Foundry/Lancer mutation
→ re-read actor state
→ semantic event / presentation refresh

There is no native ShutDownFlow in the middle.

—

# 43. Do Not Invent `ShutDownFlow`

No native dedicated Shut Down Flow was found.

Frame Conn may have an internal Shut Down execution service, but documentation/code should clearly identify it as Frame Conn-owned orchestration.

The native boundary is:

`shutdown` status + generic effect infrastructure.

—

# 44. Proposed Initial Implementation

Initial implementation should be deliberately small:

1. Resolve authoritative mech.
2. Validate active turn and Full Action.
3. Confirm mech is not already Shut Down.
4. Spend/commit Full Action through Turn state.
5. Apply native `shutdown`.
6. Await mutation.
7. Verify native Shutdown active.
8. Mark committed action executed.
9. Refresh Frame Conn.
10. Let central legality systems respond to native Shutdown.

Then add any additional confirmed tabletop consequences.

—

# 45. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Shut Down execution strategy.
- [ ] Keep Shut Down in universal Full Action catalog.
- [ ] Validate active Turn.
- [ ] Validate Full Action availability/commitment.
- [ ] Resolve authoritative actor.
- [ ] Detect existing native Shutdown.
- [ ] Use native status helper to apply `shutdown`.
- [ ] Await document/effect mutation.
- [ ] Re-read actor state.
- [ ] Verify Shutdown active.
- [ ] Apply additional confirmed Shut Down consequences.
- [ ] Mark committed Shut Down executed.
- [ ] Refresh Frame Conn presentation.
- [ ] Feed Shutdown state into central action legality.
- [ ] Feed Shutdown state into Movement legality.
- [ ] Feed Shutdown state into Reaction legality.
- [ ] Ensure Boot Up becomes available appropriately.
- [ ] Emit semantic Shutdown event if useful.

—

# 46. Smoke Test TODO

Basic execution:

- [ ] Shut Down spends one Full Action.
- [ ] no d20 roll required.
- [ ] no target required.
- [ ] native Shutdown status applied.
- [ ] native status icon appears.
- [ ] Frame Conn updates from authoritative state.
- [ ] action marked executed exactly once.

Invalid cases:

- [ ] already Shut Down actor rejected cleanly.
- [ ] missing actor fails safely.
- [ ] permission failure handled.
- [ ] duplicate status not created.
- [ ] cancelled/failed mutation does not falsely complete action.

Interaction:

- [ ] Boot Up becomes legal while Shut Down.
- [ ] Boot Up removes same native status.
- [ ] Movement legality updates.
- [ ] Reaction legality updates.
- [ ] Protocol legality updates as rules require.
- [ ] Self Destruct interaction behaves according to confirmed rules.
- [ ] pilot mounted state remains unchanged.
- [ ] unrelated statuses remain unchanged.

Persistence:

- [ ] Shutdown survives Frame Conn rerender.
- [ ] Shutdown survives application close/reopen.
- [ ] native character sheet and Frame Conn agree on state.

—

# 47. Important Invariants

**Invariant 1**

Shut Down is a Full Action.

**Invariant 2**

Shut Down does not inherently require a roll.

**Invariant 3**

Shut Down does not require a target.

**Invariant 4**

No dedicated native Shut Down Flow was found.

**Invariant 5**

Native Lancer already owns the `shutdown` status/state.

**Invariant 6**

Frame Conn should apply native Shutdown rather than create a duplicate persistent state.

**Invariant 7**

Turn Full Action expenditure remains owned by Frame Conn Turn state.

**Invariant 8**

Shutdown mutation should use native Foundry/Lancer status infrastructure.

**Invariant 9**

Boot Up and Shut Down should share the same lower-level Shutdown-state adapter.

**Invariant 10**

Frame Conn should re-read authoritative actor state after mutation.

**Invariant 11**

Shutdown consequences beyond the status transition must come from confirmed tabletop rules.

**Invariant 12**

Central action/movement/reaction legality should consume native Shutdown state rather than duplicating Shutdown checks in every individual action.

—

# 48. Final Working Model

SHUT DOWN
│
├── Full Action
│
├── no target
│
├── no roll
│
├── no native ShutDownFlow found
│
├── Frame Conn owns:
│   ├── Full Action expenditure
│   ├── legality
│   ├── authoritative actor resolution
│   ├── execution orchestration
│   └── presentation refresh
│
├── Native Lancer / Foundry owns:
│   ├── `shutdown` status identity
│   ├── actor status/effect storage
│   ├── native status icon
│   └── generic effect/status mutation
│
├── EXECUTION
│   ├── validate actor operational
│   ├── apply native `shutdown`
│   ├── await mutation
│   ├── verify authoritative state
│   └── mark action executed
│
└── LATER
    ├── central action legality sees Shutdown
    ├── Movement legality sees Shutdown
    ├── Reaction legality sees Shutdown
    └── Boot Up removes same native status

The critical architectural rule is:

**Shut Down is a Frame Conn-owned action that transitions the actor into a native Lancer-owned Shutdown state.**

Frame Conn should own the action.

Native Lancer should own the condition.
