# Full Tech
cat > docs/af-full-tech.md <<‘EOF’
# AF — Full Tech

## Status

**Native dedicated Full Tech orchestration:** Not currently established.

**Underlying Quick Tech execution strategies:** Established sufficiently for Frame Helm design.

**Frame Helm implementation status:** Requires Frame Helm-owned Full Tech orchestration over two Quick Tech executions OR delegation to a single native/system-owned Full Tech action.

## Purpose

This document defines the Frame Helm execution model for the **Full Tech** Full Action based on the already-established universal Quick Tech architecture and the Lancer rules for Full Tech.

Full Tech is structurally not one fixed mechanical action.

It is a higher-order action that allows the player to do one of two things:

1. perform two Quick Tech options; or
2. perform one system/tech action that explicitly requires Full Tech to activate.

Therefore Full Tech should be treated as an **orchestration action**, not as a single universal native flow.

The important architectural distinction is:

> Full Tech determines what combination of tech actions the player may perform.
>
> The selected underlying tech actions retain their own native or Frame Helm execution strategies.

This is analogous to how Barrage orchestrates native weapon attacks rather than replacing them.

—

# 1. Full Tech Rules Structure

Full Tech is a **Full Action**.

When the player uses Full Tech, they choose either:

## Option A — Two Quick Tech Actions

Choose two Quick Tech options.

The same Quick Tech option may be chosen twice.

Examples:

Bolster + Bolster

Bolster + Lock On

Scan + Invade

Lock On + Lock On

Invade + Invade

Scan + Scan

or any other legal combination of Quick Tech actions available to the character.

—

## Option B — One Full Tech System/Tech Action

Instead of choosing two Quick Tech options, the player may activate a single system or tech action whose activation type explicitly requires:

`Full Tech`

These actions are typically granted by actor-owned content such as:

- Mounted Systems
- Mech Core Powers
- possibly other actor-owned tech-capable features

The underlying action should retain its native action identity and native execution pathway wherever one exists.

—

# 2. Full Tech Is an Orchestration Layer

Full Tech should not be modeled as:

`Full Tech -> TechAttackFlow`

That would be incorrect.

Quick Tech itself is not synonymous with Tech Attack.

Likewise, Full Tech is not synonymous with one specific tech-resolution mechanism.

Instead:

Full Tech
→ choose execution mode
→ either:
  - two Quick Tech actions
  - one Full Tech action
→ execute selected underlying action(s) using their own strategies

Conceptually:

Full Tech
│
├── TWO QUICK TECH
│   │
│   ├── Quick Tech A
│   │   └── its own execution strategy
│   │
│   └── Quick Tech B
│       └── its own execution strategy
│
└── SINGLE FULL TECH ACTION
    └── native/system-owned execution strategy

Therefore Frame Helm should own the composition of Full Tech while delegating the actual mechanical execution of its selected sub-actions.

—

# 3. Relationship to Universal Quick Tech

The universal Quick Tech findings currently establish:

Bolster
→ Quick Tech
→ not a Tech Attack
→ no dedicated native flow found
→ Frame Helm-owned implementation required

Lock On
→ Quick Tech
→ not a Tech Attack
→ no native application flow found
→ Frame Helm applies native `lockon` condition
→ native attacks later consume it

Scan
→ Quick Tech
→ not a Tech Attack
→ native `ScanFlow`

Invade
→ Quick Tech
→ Tech Attack
→ native `TechAttackFlow`

Therefore Full Tech must be able to sequence heterogeneous execution strategies.

Example:

Full Tech
→ Lock On
→ Scan

becomes:

Full Tech orchestration
→ Frame Helm Lock On application strategy
→ native Scan execution strategy

Another example:

Full Tech
→ Invade
→ Bolster

becomes:

Full Tech orchestration
→ native `TechAttackFlow`
→ Frame Helm Bolster implementation

The fact that the two selected actions may use completely different execution mechanisms is expected.

—

# 4. Same Quick Tech May Be Chosen Twice

The Full Tech rules explicitly permit the same Quick Tech option to be selected multiple times.

Therefore Frame Helm must NOT reuse the ordinary duplicate-action restriction that prevents a normal Quick Action from simply being repeated during the same turn.

A Full Tech sequence may legally contain:

Bolster + Bolster

Lock On + Lock On

Scan + Scan

Invade + Invade

This is not equivalent to spending two independent normal Quick Actions.

It is one Full Action whose internal rule explicitly permits duplicate Quick Tech selections.

Therefore:

`Full Tech duplicate Quick Tech selection`

must be treated as legal within the Full Tech execution context.

—

# 5. Turn Economy Ownership

Full Tech consumes:

**one Full Action**

If the player chooses the two-Quick-Tech mode, the two selected Quick Tech sub-actions do **not** independently spend Frame Helm’s normal Quick Action budget.

Conceptually:

Wrong:

Full Tech
→ spend Full Action
→ Quick Tech A spends Quick Action
→ Quick Tech B spends Quick Action

Correct:

Full Tech
→ spend one Full Action
→ execute Quick Tech A as Full Tech sub-action
→ execute Quick Tech B as Full Tech sub-action

The underlying sub-actions retain their mechanics but not their normal standalone action-budget expenditure.

This distinction is critical.

—

# 6. Full Tech Execution Context

Frame Helm should eventually provide an explicit execution context indicating that an underlying Quick Tech is being executed as part of Full Tech.

Conceptually:

FullTechExecutionContext

may need to express information such as:

- parent action = Full Tech
- sub-action index
- normal Quick Action budget should not be consumed
- duplicate Quick Tech restriction ignored
- target selection remains action-specific
- underlying native execution strategy remains unchanged

Exact names should be determined during implementation.

The important point is that action economy and mechanical resolution must remain separate.

—

# 7. Proposed Full Tech Selection Flow

The first user interaction should be:

Player commits Full Tech
→ Full Tech appears in Committed Plan
→ player presses execution control
→ Frame Helm opens Full Tech selector
→ choose:

[ TWO QUICK TECH OPTIONS ]

or:

[ FULL TECH SYSTEM / TECH ACTION ]

The available choices should come from authoritative actor data and Frame Helm action discovery.

—

# 8. Two Quick Tech Mode

If the player chooses:

`Two Quick Tech Options`

Frame Helm should present available Quick Tech actions.

At minimum, universal options include:

- Bolster
- Lock On
- Scan
- Invade

Actor-owned systems may also grant additional actions whose native activation is Quick Tech.

The player chooses:

Quick Tech A

and:

Quick Tech B

The same option may be selected twice.

Then Frame Helm executes the two sub-actions sequentially.

Conceptually:

Full Tech
→ choose Quick Tech A
→ choose Quick Tech B
→ execute Quick Tech A
→ resolve all required targets/choices
→ complete Quick Tech A
→ execute Quick Tech B
→ resolve all required targets/choices
→ complete Quick Tech B
→ complete Full Tech

—

# 9. Targeting

Targeting belongs to each selected sub-action.

Full Tech itself should not assume one global target.

Examples:

Lock On + Lock On

may target:

Target A
and:
Target B

or potentially the same target twice if legal under the underlying action’s rules.

Scan + Invade

may involve:

Scan -> Target A

Invade -> Target B

Bolster + Lock On

may involve:

Bolster -> allied Target A

Lock On -> hostile Target B

Therefore Full Tech target orchestration should operate per sub-action.

Conceptually:

Full Tech
→ Quick Tech A
   → acquire target required by A
   → execute A
→ Quick Tech B
   → acquire target required by B
   → execute B

Do not bind Full Tech to one universal target.

—

# 10. Sequential Resolution

The two Quick Tech options should normally resolve sequentially.

This matters because the first action may alter game state before the second begins.

Examples:

Lock On
→ applies Lock On

then:

Invade
→ may benefit from native Lock On consumption behavior

or:

Bolster
→ modifies the target’s next interaction

then:

some second tech action resolves

Therefore Frame Helm should not precompute both actions from stale state and then resolve them simultaneously.

Preferred flow:

resolve Quick Tech A completely
→ refresh/read authoritative state
→ resolve Quick Tech B

This preserves emergent interactions.

—

# 11. Order Matters

The player should be allowed to choose the execution order of the two Quick Tech actions.

Because state may change between them:

A then B

may differ mechanically from:

B then A

Therefore the Full Tech selector should preserve explicit order.

Conceptually:

Slot 1:
Quick Tech A

Slot 2:
Quick Tech B

Execute in that order.

—

# 12. Universal Quick Tech Dispatch Within Full Tech

Each universal Quick Tech retains its established execution strategy.

## Bolster

Full Tech sub-action:

Bolster
→ Frame Helm-owned Bolster implementation

No Tech Attack roll.

—

## Lock On

Full Tech sub-action:

Lock On
→ target acquisition
→ apply native Lancer `lockon` condition

Native Lancer later owns its attack interaction/consumption.

—

## Scan

Full Tech sub-action:

Scan
→ native Scan entry point
→ `ScanFlow`

—

## Invade

Full Tech sub-action:

Invade
→ native Invade/Tech Attack entry point
→ `TechAttackFlow`

This reinforces that Full Tech is a dispatcher/orchestrator, not a unified roll workflow.

—

# 13. Actor-Owned Quick Tech Options

Full Tech should not be permanently hardcoded to only the four universal Quick Tech options.

Mounted Systems and other actor-owned features may grant actions with native activation type:

`Quick Tech`

Therefore the eventual Full Tech selector should gather Quick Tech options from the same action-discovery architecture used elsewhere in Frame Helm.

Conceptually:

Available Quick Tech Options
=
Universal Quick Tech
+
Actor-Owned Quick Tech Actions

Each discovered action should carry enough identity to resolve its own execution strategy.

—

# 14. Full Tech System/Tech Actions

The second Full Tech mode is:

`one system or tech option that requires Full Tech to activate`

These actions are typically granted through actor-owned content.

Relevant sources may include:

- Mounted Systems
- Mech Core Powers
- possibly other features that expose Full Tech actions

Frame Helm should discover these from authoritative actor/native action data.

The action’s native activation classification should identify it as:

`Full Tech`

where the native data model exposes that information.

—

# 15. ActionData Relevance

The Activate research established that native `ActionData` may expose an activation field with values including:

- Quick
- Quick Tech
- Invade
- Full
- Full Tech
- Reaction
- Protocol
- Free
- Other

Therefore actor-owned Full Tech actions should eventually be discoverable from structured native action data where those sources use `ActionData`.

Preferred discovery principle:

native structured action data
→ read activation
→ if `Full Tech`
→ expose as Full Tech system option

Do not rely on parsing action descriptions when native structured activation metadata exists.

—

# 16. Single Full Tech Action Mode

If the player chooses one actor-owned Full Tech action:

Full Tech
→ choose eligible Full Tech action
→ resolve exact native source/action identity
→ execute using that action’s native or Frame Helm strategy
→ complete Full Tech

The action should not also attempt to perform two Quick Tech options.

The modes are mutually exclusive.

Conceptually:

Full Tech
├── Mode A: two Quick Tech
└── Mode B: one Full Tech action

not:

Full Tech
→ Full Tech action
→ plus two Quick Tech

unless a specific rule explicitly says otherwise.

—

# 17. Native Execution for Full Tech System Actions

The underlying native route may vary.

An actor-owned Full Tech action could potentially use:

`LancerItem.beginActivationFlow(actionPath)`

or:

another native action-specific entry point

depending on its source and mechanical type.

The Activate research established that item-owned actions can dispatch according to their native action data, including delegation into `TechAttackFlow` where appropriate.

Therefore Frame Helm should not assume that every Full Tech system action resolves the same way.

Instead:

Full Tech system action
→ action identity
→ execution strategy
→ appropriate native/system entry point

—

# 18. Full Tech and `ActivationFlow`

For item-based Full Tech actions using native `ActionData`, a likely route may be:

Frame Helm
→ resolve item
→ resolve `actionPath`
→ `item.beginActivationFlow(actionPath)`
→ `ActivationFlow`
→ native action-specific delegation

where appropriate.

However this should be confirmed per source type before implementation.

Do not invent a `FullTechFlow` merely to wrap actions already understood by native activation machinery.

—

# 19. Proposed Frame Helm Full Tech Flow

The overall player-facing flow should eventually be:

Committed Full Tech
→ click execution control
→ choose execution mode

If Two Quick Tech:

→ choose Quick Tech slot 1
→ choose Quick Tech slot 2
→ duplicates allowed
→ execute slot 1
→ resolve target/choice
→ complete slot 1
→ refresh authoritative state
→ execute slot 2
→ resolve target/choice
→ complete slot 2
→ complete Full Tech

If Full Tech Action:

→ choose eligible actor-owned Full Tech action
→ resolve its exact source identity
→ execute through appropriate strategy/native entry point
→ complete Full Tech

—

# 20. Committed Plan Representation

Full Tech remains one committed Full Action.

Conceptually:

`FULL TECH                                     [execute]`

The committed action may internally contain selection/execution metadata.

For two-Quick-Tech mode:

Full Tech
- Slot 1: Lock On
- Slot 2: Invade

For system mode:

Full Tech
- System Action: [action name]

The two sub-actions should not appear as separately committed normal actions unless the UI deliberately displays them as nested substeps.

—

# 21. Suggested Nested Presentation

A useful presentation could eventually be:

FULL TECH

1. LOCK ON
2. INVADE

[ Execute ]

During execution:

FULL TECH

✓ 1. LOCK ON
▶ 2. INVADE

This would make partial execution understandable without falsely representing the sub-actions as independent turn-budget commitments.

The exact visual design belongs to the UI layer.

—

# 22. Partial Execution

Two-action Full Tech creates a natural partial-resolution state.

Example:

Quick Tech A completes successfully.

Quick Tech B is cancelled.

Frame Helm must not lose track of the fact that the first sub-action already occurred.

Possible execution states:

- not started
- first action pending
- first action completed
- second action pending
- completed
- cancelled
- failed

A resumable Full Tech sequence may be valuable.

Exact policy should be determined during implementation.

—

# 23. Cancellation and Rollback

Frame Helm should not assume that it can roll back Quick Tech A merely because Quick Tech B was cancelled.

The first action may already have:

- applied a condition
- consumed a native resource
- generated a journal/chat entry
- altered an actor
- completed a Tech Attack

Therefore Full Tech should behave transactionally only if the underlying native system provides a reliable transaction mechanism.

Otherwise:

completed sub-actions remain completed

and:

remaining sub-actions may need to be resumed or abandoned explicitly.

—

# 24. Duplicate Quick Tech Legality

The Full Tech execution context must explicitly allow repeated Quick Tech options.

This should not depend on hacks such as temporarily deleting duplicate-action history.

Instead, the legality layer should understand:

`duplicate restriction does not apply between Full Tech sub-actions`

because the Full Tech rules explicitly permit choosing the same Quick Tech option multiple times.

This is a parent-action-specific legality rule.

—

# 25. Interaction With Frame Helm Turn State

Frame Helm’s Turn feature should own the overall Full Tech action expenditure.

Conceptually:

Turn State
→ commit Full Tech
→ `fullActionAvailable = false`
→ `quickActionsRemaining = 0`

Then Full Tech’s internal sub-actions resolve without touching the normal action budget.

The internal execution context must therefore prevent:

Bolster sub-action
→ spending another Quick Action

or:

Invade sub-action
→ spending another Quick Action

when those actions are being performed as Full Tech children.

—

# 26. Quick Tech Sub-Actions Are Not Independent Turn Actions

A useful architectural distinction is:

Standalone Quick Tech:

Quick Tech
→ consumes one Quick Action

Full Tech Child Quick Tech:

Full Tech
→ already consumed Full Action
→ child Quick Tech performs mechanics only

Therefore execution APIs may eventually need to separate:

`commit action cost`

from:

`execute action mechanics`

This distinction will likely benefit other compound actions too.

—

# 27. Possible Shared Compound-Action Architecture

Full Tech and Barrage both reveal the need for higher-order actions composed of lower-level executions.

Conceptually:

Compound Action
→ parent action expenditure
→ child execution steps
→ child execution strategies
→ parent completion state

Examples:

Barrage
→ Mount Attack Group A
→ Mount Attack Group B

Full Tech
→ Quick Tech A
→ Quick Tech B

This suggests Frame Helm may benefit from a reusable compound-action execution model.

Exact names and abstractions should wait until the organizational refactor is complete.

—

# 28. Important Difference From Barrage

Barrage’s child executions are weapon attacks belonging to selected mounts.

Full Tech’s child executions are complete Quick Tech actions.

Therefore Full Tech children may have completely different mechanical types.

For example:

Full Tech
→ Scan
→ Lock On

combines:

native `ScanFlow`

with:

Frame Helm native-condition application

Another:

Full Tech
→ Invade
→ Invade

combines:

native `TechAttackFlow`

with:

another native `TechAttackFlow`

Therefore Full Tech sequencing must be execution-strategy agnostic.

—

# 29. Full Tech System Action Discovery

Before implementation, Frame Helm must research how Full Tech actions granted by actor-owned content are represented.

Relevant research sources:

Mounted Systems

Mech Core Powers

possibly:

Mech Traits
Pilot Talents
Manufacturer Core Bonuses

if any of those can expose a Full Tech activation.

For each source determine:

- where actions are stored
- whether they use native `ActionData`
- how `activation = Full Tech` is represented
- how exact action identity is preserved
- what native entry point executes it

—

# 30. Targeting Architecture

Full Tech should reuse Frame Helm’s general action-specific targeting system.

Each child action independently declares/derives:

- whether it needs a target
- what target types are valid
- range requirements
- Sensors requirements
- ally/enemy/self restrictions
- whether target selection can be skipped

Full Tech should not attempt to impose one universal targeting policy.

—

# 31. Future Automation

As Frame Helm becomes more automated:

Bolster
→ automated effect application

Lock On
→ automated native condition application

Scan
→ native or automated Scan behavior

Invade
→ automatic Accuracy/Difficulty
→ automatic attack roll
→ automatic effect resolution

Full Tech then simply sequences the fully automated children.

The Full Tech layer should not itself need to know the low-level mechanics of each option.

—

# 32. Deterministic Effects

Frame Helm’s wider deterministic-consequence rule applies to Full Tech children.

If a selected Quick Tech or Full Tech action deterministically:

- applies a status
- removes a status
- applies a condition
- removes a condition
- changes Heat
- changes another resource
- deals damage
- creates another structured consequence

Frame Helm should carry that through automatically where native Lancer does not already do so.

The parent Full Tech layer should delegate these mechanics to the child action execution strategy.

—

# 33. Native-System Boundary

Frame Helm should follow the same native-system-first architecture established elsewhere:

Frame Helm Full Tech UI
→ Full Tech execution service
→ child action dispatcher
→ native-system adapter or Frame Helm implementation
→ native Lancer entry point where available
→ native flow
→ authoritative Foundry mutations
→ Frame Helm reconciliation

Do not place direct native Lancer flow knowledge into the UI selector.

—

# 34. Do Not Invent a Universal `FullTechFlow`

Unless repository research later reveals an actual native Full Tech flow, Frame Helm should not pretend one exists.

The logical Frame Helm abstraction may be called a Full Tech execution service internally, but its role is orchestration.

It should not recreate the lower-level mechanics of:

- Bolster
- Lock On
- Scan
- Invade
- system-owned Full Tech actions

—

# 35. Immediate Research TODO

- [ ] Trace actor-owned `Full Tech` actions from native `ActionData`.
- [ ] Determine which actor-owned source types can expose Full Tech actions.
- [ ] Trace Mounted System Full Tech execution.
- [ ] Trace Mech Core Power Full Tech execution.
- [ ] Determine whether Mech Traits can expose Full Tech actions.
- [ ] Determine whether Pilot Talents can expose Full Tech actions.
- [ ] Determine whether Manufacturer Core Bonuses can expose Full Tech actions.
- [ ] Determine the native execution entry point for each source.
- [ ] Determine whether `ActivationFlow` handles ordinary Full Tech item actions.
- [ ] Determine whether some Full Tech actions dispatch into `TechAttackFlow`.
- [ ] Determine target/range metadata available from native structured data.
- [ ] Determine how Full Tech system actions with multiple internal choices are represented.
- [ ] Determine how action resource costs are consumed natively.

—

# 36. Quick Tech Research Dependencies

The Full Tech implementation depends directly on the universal Quick Tech execution architecture documented in:

`docs/af-quick-tech.md`

That document should remain the authoritative flow note for:

- Bolster
- Lock On
- Scan
- Invade

Full Tech should reference/reuse those child execution strategies rather than duplicating their rules.

—

# 37. Implementation TODO

Implementation should begin after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Full Tech execution service.
- [ ] Add Full Tech mode selector.
- [ ] Add two-Quick-Tech selection mode.
- [ ] Allow duplicate Quick Tech selection.
- [ ] Preserve explicit Quick Tech execution order.
- [ ] Discover actor-owned Quick Tech actions.
- [ ] Discover actor-owned Full Tech actions.
- [ ] Add exact child action identity.
- [ ] Execute Quick Tech child A without spending normal Quick budget.
- [ ] Refresh authoritative state.
- [ ] Execute Quick Tech child B without spending normal Quick budget.
- [ ] Support action-specific targeting for each child.
- [ ] Add single Full Tech system-action mode.
- [ ] Route system action through appropriate native/Frame Helm strategy.
- [ ] Track partial execution state.
- [ ] Handle cancellation.
- [ ] Prevent duplicate parent action expenditure.
- [ ] Mark parent Full Tech complete according to child completion state.
- [ ] Refresh Frame Helm presentation after each child and after parent completion.
- [ ] Compare child executions against equivalent standalone/native executions.

—

# 38. Important Invariants

**Invariant 1**

Full Tech consumes one Full Action.

**Invariant 2**

Full Tech chooses either two Quick Tech options or one Full Tech action.

**Invariant 3**

The two Quick Tech options may be the same.

**Invariant 4**

Quick Tech children do not consume normal Quick Action budget.

**Invariant 5**

Each Quick Tech child retains its own execution strategy.

**Invariant 6**

Each child may have its own target.

**Invariant 7**

Child actions resolve sequentially.

**Invariant 8**

The player controls child execution order.

**Invariant 9**

Actor-owned Quick Tech and Full Tech options should be discovered from authoritative actor/native data.

**Invariant 10**

Native Lancer execution should be reused wherever available.

—

# 39. Final Working Model

FULL TECH
│
├── MODE A — TWO QUICK TECH
│   │
│   ├── Quick Tech Slot 1
│   │   │
│   │   ├── Bolster
│   │   │   └── Frame Helm implementation
│   │   │
│   │   ├── Lock On
│   │   │   └── native condition application
│   │   │
│   │   ├── Scan
│   │   │   └── ScanFlow
│   │   │
│   │   ├── Invade
│   │   │   └── TechAttackFlow
│   │   │
│   │   └── actor-owned Quick Tech
│   │       └── action-specific strategy
│   │
│   └── Quick Tech Slot 2
│       └── same option set
│
└── MODE B — ONE FULL TECH ACTION
    │
    ├── Mounted System Full Tech
    ├── Core Power Full Tech
    └── other discovered Full Tech action
        ↓
    action-specific native/Frame Helm execution strategy

This is the current working architecture for Full Tech in Frame Helm.

The Full Tech layer should own:

- selection
- composition
- sequence
- parent action expenditure
- child execution state

while the underlying selected actions continue to own their individual mechanical resolution.
EOF