# Boot Up

# AF — Boot Up

## Status

**Native dedicated Boot Up execution flow:** Not found.

**Native Shutdown status representation:** Found.

**Native generic status/effect infrastructure:** Found.

**Frame Conn implementation status:** Implemented end to end through the canonical Frame Conn execution spine. Committed `full.boot-up` receives a non-roll Execute control; execution enters System Bridge → Semantic Execution Context → Execution Transaction → Native Adapter, removes authoritative native `shutdown` through `removeStatus()` / `Actor.toggleStatusEffect(..., { active: false })`, and only then allows the exact committed entry to be marked executed. Static/tool validation is complete; live Foundry validation remains required.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Boot Up** Full Action and defines the intended Frame Conn implementation boundary.

Repository investigation did not reveal a dedicated executable Boot Up flow such as:

`BootUpFlow`

or:

`beginBootUpFlow()`

The native Lancer system does, however, represent whether an actor is Shut Down and provides generic status/effect mutation infrastructure.

Therefore:

> Frame Conn should implement the universal Boot Up action itself.

while:

> Native Lancer should remain authoritative for the underlying Shutdown status representation and Foundry effect state.

Boot Up should be treated as the inverse state-transition partner of Shut Down.

## Implemented Frame Conn Path

The current implementation is intentionally:

```text
full.boot-up committed as a Full Action
        ↓
ui-turn exposes a non-roll Execute control
        ↓
Action Execution classifies executionKind = boot-up
        ↓
System Bridge
        ↓
Semantic Execution Context
        ↓
Execution Transaction
        ↓
Native Adapter removeStatus(actor, shutdown)
        ↓
native-status resolves the authoritative actor
        ↓
Actor.toggleStatusEffect(shutdown, { active: false })
        ↓
Native Adapter verifies shutdown is no longer active
        ↓
transaction succeeds
        ↓
Application marks only the exact committed entry executed
        ↓
Frame Conn re-renders from authoritative Turn/actor state
```

If `shutdown` was not active, or native removal does not produce a real state change, Boot Up fails through the execution transaction and the committed entry remains pending. Frame Conn does not create a separate Shutdown flag.

The native boundary is now persisted as `native.actor.shutdown-status-boundary` in the Native Contract Catalog for Lancer 3.1.3 with source and evidence hashes.

—

# 1. Boot Up Rules Role

Boot Up is a **Full Action** used to recover from the Shut Down state.

At the software architecture level, its core responsibility is:

`actor is Shut Down`
→ `Boot Up`
→ `actor is no longer Shut Down`

The exact tabletop consequences surrounding Boot Up should be implemented only after the complete action rules are confirmed.

The repository findings establish only the native software boundary:

- Shutdown state exists natively.
- Boot Up execution does not.

—

# 2. Native Repository Finding

A repository search did not identify:

- `BootUpFlow`
- `beginBootUpFlow()`
- `boot-up` flow implementation
- dedicated Boot Up actor method
- dedicated Boot Up sheet execution handler
- dedicated Boot Up app
- dedicated Boot Up template
- dedicated Boot Up flow step sequence

Therefore there is no known native high-level Boot Up action executor for Frame Conn to call.

—

# 3. Native Shutdown Representation

The repository does define Shutdown as native actor state.

Relevant native data includes:

`src/module/base-data.ts`

with:

`shutdown: boolean`

Relevant system template data includes:

`src/module/system-template.ts`

with:

`shutdown: boolean`

Relevant actor defaults include:

`src/module/actor/lancer-actor.ts`

with a default concept equivalent to:

`shutdown: false`

The native system therefore has an authoritative representation for:

`this actor is currently Shut Down`

—

# 4. Native Status Identity

The native status infrastructure recognizes the Shutdown status under the identity:

`shutdown`

Relevant status-icon infrastructure includes:

`src/module/status-icons.ts`

with a status entry equivalent to:

`id: “shutdown”`

and language/display infrastructure includes:

`public/lang/en.json`

with:

`”shutdown”: “Shut Down”`

Frame Conn should use this native status identity rather than inventing a second Frame Conn-only Shutdown flag.

—

# 5. No Native Boot Up Mutation Found

Repository searching did not reveal a universal action path equivalent to:

Boot Up
→ remove native Shutdown
→ complete action

No dedicated code was found using a Boot Up-specific flow to remove:

`shutdown`

Therefore Frame Conn will need to perform the state transition explicitly using the native status/effect infrastructure.

—

# 6. Generic Native Effect Infrastructure

Although no Boot Up action flow exists, the native actor system does expose generic effect/status machinery.

Relevant concepts include:

`effectHelper`

and helper methods such as:

`removeActiveEffect(...)`

and:

`removeActiveEffects(...)`

The preferred native mutation boundary has now been confirmed. Native Lancer status-item handling delegates status application through `Actor.toggleStatusEffect(...)`, and Frame Conn's existing `native-status.js` adapter mirrors that authoritative pathway for both application and removal. Boot Up therefore calls the registered Native Adapter `removeStatus(actor, "shutdown")`, which ultimately performs `Actor.toggleStatusEffect("shutdown", { active: false })` and verifies the resulting native status state.

Do not replace this with direct mutation of `system.statuses.shutdown`; that field is derived status state, not a second storage authority.

—

# 7. Architectural Boundary

The intended responsibility split is:

**FRAME CONN OWNS:**

- Boot Up action commitment
- Full Action expenditure
- Boot Up legality
- verification that the actor is currently Shut Down
- Boot Up execution
- removal of the Shutdown state through native status infrastructure
- any additional deterministic Boot Up consequences
- committed-action execution state
- Frame Conn presentation refresh

**NATIVE LANCER / FOUNDRY OWNS:**

- authoritative Shutdown status identity
- actor status/effect storage
- Foundry ActiveEffect/status infrastructure
- status icon
- status presentation
- generic status mutation helpers where available

—

# 8. Implemented Boot Up Flow

Frame Conn now executes:

Player commits Boot Up
→ Boot Up appears in Committed Plan with a plain Execute control
→ player executes Boot Up
→ Frame Conn re-resolves the authoritative actor
→ canonical execution spine composes the semantic action
→ Execution Transaction calls Native Adapter `removeStatus(actor, "shutdown")`
→ Native Adapter verifies Shutdown was active and is now inactive
→ transaction succeeds
→ exact committed Boot Up entry is marked executed
→ authoritative Turn/actor presentation refreshes

No attack roll is required.

No target is required.

—

# 9. Boot Up Does Not Need a d20 Roll

Boot Up does not inherently involve an attack or check.

Therefore the committed-plan UI should use a non-roll execution control.

Conceptually:

`BOOT UP                                   [execute]`

rather than:

`BOOT UP                                   [d20]`

The exact icon belongs to the UI layer.

—

# 10. Legality

Boot Up should ordinarily only be executable when the acting mech is currently Shut Down.

Conceptually:

if actor is Shut Down:
→ Boot Up legal

if actor is not Shut Down:
→ Boot Up not useful / not legal

Frame Conn should provide a clear legality reason rather than silently doing nothing.

Example presentation reason:

`This unit is not currently Shut Down.`

Exact wording can be determined during implementation.

—

# 11. Authoritative Status Check

Frame Conn should determine whether the actor is Shut Down from native authoritative state.

Preferred source:

native Lancer/Foundry status representation

not:

Frame Conn cached presentation state

and not:

a duplicated Frame Conn boolean.

The UI may cache/display the state, but execution should re-resolve the authoritative actor at the time Boot Up is performed.

—

# 12. Preferred Mutation Strategy

The implementation should prefer:

native actor/effect helper
→ remove `shutdown`

over:

manual raw document mutation

if the helper correctly preserves Foundry/Lancer effect semantics.

Conceptually:

actor
→ `effectHelper`
→ remove native active effect/status
→ `”shutdown”`

The exact method call must be confirmed from the native helper API before implementation.

Do not invent a helper signature without tracing it.

—

# 13. Boot Up and Shut Down Pair

Boot Up and Shut Down form a matched state-transition pair.

Conceptually:

Shut Down
→ apply native `shutdown`

Boot Up
→ remove native `shutdown`

Therefore they should probably share a lower-level status mutation adapter.

For example, conceptually:

`setShutdownState(actor, true)`

and:

`setShutdownState(actor, false)`

could both use the same native helper boundary.

Exact names are illustrative only.

The important goal is to avoid implementing two unrelated mutation mechanisms for the same status.

—

# 14. Relationship to `af-shut-down.md`

Boot Up and Shut Down should remain separate action-flow documents because they are separate universal actions with different legality and action semantics.

However, their implementation should share:

- Shutdown status resolution
- authoritative actor lookup
- native effect helper use
- presentation refresh
- status-change verification

The eventual `af-shut-down.md` should document the apply side of the same native status boundary.

—

# 15. Turn Economy Ownership

Boot Up consumes:

**one Full Action**

Frame Conn’s Turn feature should remain authoritative for that expenditure.

The native Lancer status mutation should not independently modify Frame Conn’s action budget.

Conceptually:

Frame Conn Turn
→ commit/use Full Action

then:

Boot Up execution strategy
→ remove Shutdown

These are separate responsibilities.

—

# 16. Commit vs Execute

If Frame Conn continues to distinguish committed planning from execution:

Commit Boot Up:
→ reserve/spend Full Action according to Turn rules
→ add Boot Up to Committed Plan

Execute Boot Up:
→ perform native Shutdown-state removal
→ mark committed action executed

This distinction is useful because merely selecting Boot Up in the plan should not necessarily mutate actor status before the player executes it.

—

# 17. Failure Cases

Boot Up execution should account for cases such as:

- actor no longer exists
- token changed
- actor is no longer Shut Down
- actor ownership/permission prevents mutation
- native status helper fails
- status mutation is rejected
- actor state changes between commit and execute

Frame Conn should revalidate state at execution time.

—

# 18. Idempotence

Boot Up should not create harmful duplicate effects if executed more than once accidentally.

If the actor no longer has `shutdown`, a second execution should fail cleanly or report that the actor is already operational.

It should not create a second inverse state or corrupt actor status.

—

# 19. Authoritative Refresh

After Boot Up executes, Frame Conn should refresh from the authoritative actor document.

Do not merely assume the status removal succeeded because the helper call returned.

Preferred flow:

request status removal
→ await native document mutation
→ re-read actor state
→ update Frame Conn presentation

This helps prevent stale UI state.

—

# 20. Status Presentation

Because the native system already owns Shutdown’s icon and effect representation, Frame Conn does not need to invent a separate presentation language for the underlying status.

Frame Conn may display:

`SHUT DOWN`

or related semantic state in its own UI, but that display should be derived from native actor state.

—

# 21. Boot Up and Native Sensors/Targeting

Boot Up requires no target.

Therefore it should not:

- enter target-selection mode
- inspect Sensors
- select self as a target
- invoke attack targeting infrastructure

The acting actor is implicitly the affected unit.

—

# 22. Boot Up and Action Discovery

Boot Up is a universal action rather than an actor-owned system action.

It should remain part of the universal Full Action catalog.

Its execution strategy can be Frame Conn-owned even though the state it manipulates is native.

Conceptually:

action:
`full.boot-up`

execution strategy:
Frame Conn status transition

Exact internal naming should follow the existing action registry.

—

# 23. No Native Flow to Preserve

Unlike:

- weapon attacks
- Scan
- Invade
- item activation

Boot Up has no discovered native Flow sequence.

Therefore Frame Conn should not add unnecessary indirection such as pretending to invoke:

`BootUpFlow`

No such flow was found.

The native integration boundary is the status/effect system.

—

# 24. Future Trigger Considerations

Actor-owned content may eventually contain effects triggered by:

- shutting down
- booting up
- becoming Shut Down
- ceasing to be Shut Down

If native structured data exposes such triggers, Frame Conn should preserve Boot Up as a meaningful semantic action/event.

The initial implementation need not solve all such triggers, but the action should not be reduced to an anonymous status toggle with no execution identity.

—

# 25. Possible Semantic Event

Conceptually, Frame Conn may eventually expose an event equivalent to:

`boot-up-executed`

or:

`shutdown-removed-by-boot-up`

This is conceptual only.

Do not invent a native hook with this name.

Any event system should belong to Frame Conn’s own action/trigger architecture.

—

# 26. Interaction With Other Statuses

Boot Up should not indiscriminately remove unrelated statuses or conditions.

The action’s state mutation should be narrowly scoped to:

`shutdown`

plus only those additional consequences explicitly required by the Boot Up rules.

Do not clear all negative conditions as a convenience.

—

# 27. Rules Completeness Caveat

The repository findings tell us:

- native Shutdown state exists
- no native Boot Up action flow exists

They do **not** by themselves prove that Boot Up’s complete tabletop behavior is simply:

`remove shutdown`

Therefore before final implementation, confirm the full Lancer Boot Up rules and identify any additional consequences beyond removal of Shutdown.

Those consequences should then be added explicitly.

—

# 28. Do Not Over-Implement From Assumption

Until the full rule text is confirmed, do not assume Boot Up:

- restores HP
- restores Structure
- clears Heat
- clears statuses
- reloads weapons
- refreshes resources
- moves the unit
- grants actions

Only implement consequences actually required by the rules.

—

# 29. Native Status Helper Research

Before implementation:

- [ ] Trace `effectHelper`.
- [ ] Confirm the helper class/type used by Lancer actors.
- [ ] Confirm the preferred method for removing one named status.
- [ ] Confirm whether `”shutdown”` is represented as an ActiveEffect ID, status ID, or another semantic identifier.
- [ ] Confirm whether `removeActiveEffect(“shutdown”)` is valid for this exact status.
- [ ] Confirm whether `toggleStatusEffect(“shutdown”, { active: false })` or an equivalent Foundry API is preferred.
- [ ] Confirm required actor permissions.
- [ ] Confirm whether GM mediation is necessary for player-owned actor status mutation.
- [ ] Confirm how native status removal updates `actor.system.statuses.shutdown`.
- [ ] Confirm how native status icons refresh after mutation.

—

# 30. Shut Down Companion Research

Before finalizing both actions:

- [ ] Write/complete `af-shut-down.md`.
- [ ] Confirm the preferred native status application helper.
- [ ] Ensure Boot Up and Shut Down use symmetrical status mutation infrastructure.
- [ ] Confirm the full tabletop consequences of Shut Down.
- [ ] Confirm the full tabletop consequences of Boot Up.
- [ ] Identify any triggers associated with entering/leaving Shutdown.

—

# 31. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Boot Up execution strategy.
- [ ] Keep Boot Up in the universal Full Action catalog.
- [ ] Validate active Turn.
- [ ] Validate Full Action availability/commitment.
- [ ] Resolve authoritative actor.
- [ ] Confirm native Shutdown status is active.
- [ ] Use native effect/status helper to remove `shutdown`.
- [ ] Await authoritative document mutation.
- [ ] Re-read actor status.
- [ ] Apply any additional confirmed Boot Up consequences.
- [ ] Mark committed Boot Up action executed.
- [ ] Refresh Frame Conn presentation.
- [ ] Add clear failure message if actor is not Shut Down.
- [ ] Smoke-test Boot Up from a Shut Down actor.
- [ ] Smoke-test invalid Boot Up while not Shut Down.
- [ ] Smoke-test status icon removal.
- [ ] Smoke-test Frame Conn telemetry/state refresh.
- [ ] Smoke-test player permissions.

—

# 32. Important Invariants

**Invariant 1**

Boot Up is a Full Action.

**Invariant 2**

Boot Up does not require a roll.

**Invariant 3**

Boot Up does not require a target.

**Invariant 4**

No dedicated native Boot Up Flow was found.

**Invariant 5**

Native Lancer already represents Shutdown.

**Invariant 6**

Frame Conn should remove the native Shutdown state rather than create a duplicate state model.

**Invariant 7**

Turn expenditure remains owned by Frame Conn’s Turn feature.

**Invariant 8**

Status mutation should use native Foundry/Lancer effect infrastructure.

**Invariant 9**

Execution should revalidate authoritative actor state.

**Invariant 10**

Additional Boot Up consequences should only be implemented from confirmed rules.

—

# 33. Final Working Model

BOOT UP
│
├── Full Action
│
├── no target
│
├── no roll
│
├── no native BootUpFlow found
│
├── requires actor to currently be Shut Down
│
├── Frame Conn-owned action execution
│   │
│   ├── validate actor
│   ├── validate Shutdown state
│   ├── remove native `shutdown`
│   ├── apply any additional confirmed Boot Up consequences
│   └── mark action executed
│
└── Native Lancer / Foundry
    │
    ├── owns `shutdown` status identity
    ├── owns actor status/effect storage
    ├── owns status icon
    └── provides generic status/effect mutation infrastructure

This is the current working architecture for Boot Up in Frame Conn.

The critical native integration boundary is not a Boot Up Flow.

It is the native Lancer/Foundry Shutdown status system.
