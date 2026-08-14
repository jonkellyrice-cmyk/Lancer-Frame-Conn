# Stabilize
# AF — Stabilize

## Status

**Native dedicated Stabilize execution flow:** Found.

**Native actor entry point:** Found.

**Native mech-sheet Stabilize button:** Found.

**Native Stabilize core macro:** Found.

**Native Stabilize prompt:** Found.

**Native Stabilize option handling:** Found.

**Native Stabilize document mutation:** Found.

**Native Stabilize chat output:** Found.

**Native Clear Own Condition automation:** Not implemented.

**Native Clear Ally Condition automation:** Not implemented.

**Native Stabilize semantic SynergyLocation:** Found.

**Frame Conn implementation status:** Frame Conn should delegate Stabilize directly to native `actor.beginStabilizeFlow(...)` for the first implementation, while owning Full Action expenditure and committed-plan execution. Later Frame Conn automation should extend only the missing condition-clearing branches rather than recreating the native Stabilize engine.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Stabilize** Full Action and defines the intended Frame Conn integration boundary.

Unlike many universal actions researched so far, Stabilize has a complete native Lancer execution flow.

The native system already provides:

- a dedicated `StabilizeFlow`;
- actor entry point;
- native Stabilize choice prompt;
- automatic Heat clearing;
- automatic Exposed removal;
- automatic HP restoration;
- automatic Repair expenditure;
- automatic weapon reloading;
- automatic Burn clearing;
- native actor/item document mutation;
- native chat output.

Therefore:

> Frame Conn should not recreate Stabilize mechanics.

The correct initial integration is:

Frame Conn
→ native-system adapter
→ `actor.beginStabilizeFlow(...)`

The only meaningful native automation gaps currently identified are:

- Clear Own Condition;
- Clear Ally Condition.

Those can be improved later without replacing the rest of the native flow.

—

# 1. Stabilize Classification

Stabilize is a **Full Action**.

The native Stabilize flow presents two choice groups.

The player selects:

one Option 1 choice

and:

one Option 2 choice.

The native system then performs the corresponding mechanical updates.

—

# 2. Native Stabilize Flow Exists

Repository investigation identified:

`StabilizeFlow`

in:

`src/module/flows/stabilize.ts`

This is a genuine dedicated native Flow.

Therefore Frame Conn should preserve it.

—

# 3. Native Actor Entry Point

The native actor exposes:

`actor.beginStabilizeFlow(title?)`

This is the authoritative high-level entry point.

Conceptually:

actor
→ `beginStabilizeFlow(...)`
→ `StabilizeFlow`
→ native prompt
→ native updates
→ native chat result

This should be called through Frame Conn’s native-system adapter.

—

# 4. Native Mech Sheet Path

The native mech sheet already launches Stabilize through the actor entry point.

Therefore Frame Conn can mirror the same native execution path used by the stock character sheet.

This satisfies the project’s preferred integration pattern:

stock UI
→ native actor entry point
→ native Flow
→ ordered Flow steps
→ native document mutations/chat output.

—

# 5. Native Core Macro

The repository also contains a stock core macro for Stabilize.

Conceptually, it executes:

`canvas.tokens.controlled[0].actor.beginStabilizeFlow()`

This independently confirms that `beginStabilizeFlow()` is intended as the public native execution entry point.

—

# 6. Native Stabilize Step Sequence

The native StabilizeFlow contains the ordered steps:

`initializeStabilize`

→

`renderStabilizePrompt`

→

`applyStabilizeUpdates`

→

`printStabilizeResult`

Frame Conn should not duplicate or reorder these steps.

—

# 7. Stabilize Initialization

The native flow initializes Stabilize data before presenting the prompt.

Relevant concepts include:

- title;
- description;
- Option 1;
- Option 2.

The initial native defaults correspond conceptually to:

Option 1:
`Cool`

Option 2:
`Reload`

The actual player selections are then handled by the prompt.

—

# 8. Native Stabilize Prompt

The native flow renders:

`public/templates/window/promptStabilize.hbs`

This is the native Lancer Stabilize interaction.

The first Frame Conn implementation should preserve this popup.

There is no need to immediately recreate the choice UI inside Frame Conn.

—

# 9. Option Group 1

The first native choice group contains:

`Cool Mech`

or:

`Restore HP`

The player selects one.

—

# 10. Option Group 2

The second native choice group contains:

- Reload;
- Clear Burn;
- Clear Own Condition;
- Clear Ally Condition.

The player selects one.

—

# 11. Native Mechanical Helper

The native flow delegates its actual Stabilize state changes through:

`state.actor.strussHelper.stabilize(option1, option2)`

located in:

`src/module/actor/struss-util.ts`

This helper is important because it performs real document mutation rather than merely producing chat text.

—

# 12. Cool Is Fully Native

For:

`Cool`

native Lancer performs:

`system.heat.value = 0`

and removes:

`exposed`

through the actor effect helper.

Conceptually:

Cool
→ Heat becomes 0
→ Exposed removed

This is already fully automated.

Frame Conn should not reproduce this behavior.

—

# 13. Exposed Removal

The native helper uses effect/status infrastructure to remove Exposed.

This means Stabilize already respects native status ownership.

Frame Conn should not separately clear a local Exposed state after native Stabilize runs.

Instead:

→ await native flow
→ re-read authoritative actor state.

—

# 14. Restore HP Is Fully Native

For:

`Restore HP`

the native helper validates available Repairs.

If no Repairs are available:

→ native warning
→ action branch fails/does not apply restoration.

If Repairs are available:

→ HP becomes maximum HP
→ Repairs decrease by 1

Therefore native Lancer already handles both the resource cost and HP restoration.

—

# 15. Repair Expenditure

Frame Conn should not manually decrement Repairs when native Restore HP is selected.

Native Stabilize already owns:

`Repairs -= 1`

This avoids double-spending Repairs.

—

# 16. NPC Support

The native helper also supports relevant NPC cases, including native content such as Veteran self-repair behavior.

Frame Conn’s player-facing universal Stabilize action is primarily mech-focused, but this confirms the native helper is broader than a hardcoded PC-only function.

—

# 17. Reload Is Fully Native

For:

`Reload`

the native helper calls:

`actor.loadoutHelper.reloadableItems()`

and applies resulting embedded item updates through:

`actor.updateEmbeddedDocuments(“Item”, item_changes)`

Therefore native Lancer already determines which items can be reloaded and mutates their loaded state.

Frame Conn should not manually enumerate/reload weapons.

—

# 18. Reloaded Weapon Reporting

The native Stabilize flow also builds chat/result text describing the reloaded weapons.

This native output should be preserved.

Frame Conn does not need a duplicate reload summary.

—

# 19. Clear Burn Is Fully Native

For:

`Clear Burn`

the native helper performs:

`system.burn = 0`

Therefore Burn clearing is already automated.

Frame Conn should not separately remove Burn.

—

# 20. Clear Own Condition Is Not Fully Automated

For:

`Clear Own Condition`

the native flow currently does not automatically select or remove a condition.

Instead, it prints guidance conceptually equivalent to:

`Mech has selected to clear own condition. Please clear manually.`

The helper contains a TODO rather than condition-selection/removal logic.

This is a genuine native automation gap.

—

# 21. Clear Ally Condition Is Not Fully Automated

Likewise, for:

`Clear Ally Condition`

the native flow currently does not:

- select an allied target;
- validate adjacency;
- select a condition;
- remove that condition.

Instead, it prints guidance conceptually equivalent to:

`Mech has selected to clear an allied condition. Please clear manually.`

This is the second meaningful native automation gap.

—

# 22. Native Coverage Matrix

Current native coverage:

Option 1:

Cool
→ fully automated

Restore HP
→ fully automated

Option 2:

Reload
→ fully automated

Clear Burn
→ fully automated

Clear Own Condition
→ not automated

Clear Ally Condition
→ not automated

This should guide Frame Conn’s implementation priorities.

—

# 23. Initial Frame Conn Strategy

The correct first implementation is:

Committed Stabilize
→ click execute
→ resolve authoritative mech
→ call native `actor.beginStabilizeFlow()`
→ native Stabilize prompt
→ native mutation
→ native chat result
→ Frame Conn marks action executed
→ refresh authoritative state/UI

This delivers correct behavior immediately without recreating native mechanics.

—

# 24. Do Not Replace Native Prompt Initially

The first Frame Conn implementation should not build a custom:

- Cool selector;
- Repair selector;
- Reload selector;
- Burn selector.

The native prompt already works.

Replacing it before condition automation is ready would create more code without adding meaningful functionality.

—

# 25. Full Action Expenditure

Stabilize consumes:

**one Full Action**

Frame Conn Turn state should own this expenditure.

The native StabilizeFlow does not need to be treated as a second Full Action.

Conceptually:

Frame Conn parent action
→ spend Full Action

Native StabilizeFlow
→ mechanical resolution only.

—

# 26. Committed Plan Integration

Stabilize should appear as one committed Full Action.

Conceptually:

`STABILIZE                                  [execute]`

Clicking execute launches the native Stabilize flow.

It should not use a d20 icon because Stabilize itself does not inherently require an attack/check roll.

—

# 27. No Target Initially

Most Stabilize branches require no hostile target.

The current native flow opens its own prompt and manages its own branch decisions.

Therefore Frame Conn should not enter target-selection mode before launching Stabilize.

Only the future automated:

`Clear Ally Condition`

branch will need target selection.

—

# 28. Native Flow Owns Choice State

Frame Conn does not need to know the selected Stabilize options in order to execute the first implementation.

It can simply delegate to native StabilizeFlow.

Later, if Frame Conn needs:

- detailed execution history;
- automatic condition clearing;
- custom Stabilize UI;

it may need to inspect/capture native selection state.

That can be added incrementally.

—

# 29. Await Native Flow Completion

Frame Conn should await the native flow before marking the committed action fully executed.

Conceptually:

`await actor.beginStabilizeFlow(...)`

then:

→ re-read actor/item state
→ mark action executed
→ refresh UI.

Do not mark Stabilize complete merely because the native prompt opened.

—

# 30. Prompt Cancellation

The native prompt may potentially be cancelled.

Frame Conn needs to distinguish:

flow opened

from:

flow actually resolved.

Before implementation, trace the return/cancellation behavior of `beginStabilizeFlow()` / StabilizeFlow.

If cancelled:

→ do not falsely mark mechanical execution complete.

The general committed-action cancellation policy should determine whether action expenditure remains committed.

—

# 31. Native Semantic Identity

The repository contains:

`stabilize`

as a native SynergyLocation.

Therefore structured actor-owned content may be able to reference Stabilize semantically.

Frame Conn should preserve this identity for future integration with:

- Mounted Systems;
- Mech Traits;
- Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

—

# 32. Future Stabilize Trigger Events

Frame Conn may eventually expose semantic events such as:

- Stabilize executed;
- Cool selected;
- Restore HP selected;
- Reload selected;
- Burn cleared;
- condition cleared.

Exact event names are conceptual only.

Do not invent native hooks.

Where native structured synergy data already references `stabilize`, preserve that context.

—

# 33. Future Clear Own Condition Automation

A mature Frame Conn enhancement for:

`Clear Own Condition`

should conceptually be:

native Stabilize choice = Clear Own Condition
→ resolve acting mech’s removable conditions
→ present legal condition selector
→ player chooses one
→ remove native condition/status
→ continue/finalize Stabilize result

The exact eligible condition set should come from the tabletop rules.

—

# 34. Native Condition Removal

When Frame Conn automates Clear Own Condition:

use native Foundry/Lancer status/effect infrastructure.

Do not directly mutate raw status booleans where a proper status helper exists.

The same status adapter used by:

- Boot Up;
- Shut Down;
- Hide;
- Search;

may be reusable.

—

# 35. Future Clear Ally Condition Automation

A mature Frame Conn enhancement for:

`Clear Ally Condition`

should conceptually be:

Stabilize selects Clear Ally Condition
→ enter Foundry target-selection mode
→ choose legal adjacent allied character
→ validate range/ally relationship
→ inspect removable target conditions
→ choose one
→ remove native condition
→ finalize Stabilize

This is higher-level orchestration absent from native StabilizeFlow.

—

# 36. Clear Ally Targeting

The exact tabletop rule should determine:

- adjacency/range;
- valid allied actor types;
- which conditions may be cleared;
- whether statuses are included;
- whether target must be willing/conscious.

Do not hard-code these assumptions from the native TODO.

—

# 37. Extending vs Replacing StabilizeFlow

There are two possible future architectures.

Option A:

wrap/extend native StabilizeFlow

or:

Option B:

reproduce the same high-level choice orchestration in Frame Conn while still using native low-level mutation helpers.

The preferred direction should be whichever preserves the most native behavior with the least duplication.

Do not replace the flow simply because two branches are incomplete.

—

# 38. Preferred Long-Term Principle

Even after Frame Conn automates the missing condition branches:

native Lancer should remain authoritative for:

- Cool;
- Exposed removal;
- HP restoration;
- Repair expenditure;
- Reload;
- Burn removal.

Frame Conn should own only the missing orchestration needed to complete the condition branches.

—

# 39. Avoid Reimplementing Repair Logic

Restore HP may interact with:

- max HP;
- Repair capacity;
- NPC features;
- custom effects.

Native `strussHelper.stabilize(...)` already handles this.

Frame Conn should not duplicate:

if Repairs > 0
→ heal
→ decrement

unless native architecture changes.

—

# 40. Avoid Reimplementing Reload Logic

Reloadable-item discovery is already owned by:

`actor.loadoutHelper.reloadableItems()`

Frame Conn should not scan weapon names/tags itself.

This is a strong native integration boundary.

—

# 41. Avoid Reimplementing Cool Logic

Native Stabilize already owns:

- Heat to 0;
- Exposed removal.

Frame Conn should not add a second cooling mutation after flow completion.

—

# 42. Avoid Reimplementing Burn Logic

Native Stabilize already owns:

`system.burn = 0`

Frame Conn should not duplicate Burn clearing.

—

# 43. Authoritative Refresh

After native Stabilize completes:

Frame Conn should re-read:

- actor Heat;
- Exposed state;
- HP;
- Repairs;
- Burn;
- item loaded state;
- any condition state;

from authoritative native documents.

This ensures telemetry/UI reflects actual native results.

—

# 44. Native Chat Output

The native flow prints a Stabilize result.

Frame Conn should preserve this rather than creating a duplicate generic message.

If Frame Conn later adds automated condition clearing, it may append concise supplemental output where native chat does not reflect that added mutation.

—

# 45. Stabilize and Shutdown

Whether a Shut Down mech can Stabilize should be handled by central action legality according to the tabletop rules.

Do not embed broad actor-state legality into the Stabilize native adapter itself unless necessary.

—

# 46. Stabilize and Self Destruct / Meltdown

Stabilize may interact with:

- reactor state;
- Heat;
- Exposed;
- meltdown.

The native helper handles Cooling but the relationship to an active Self Destruct/meltdown timer must follow the rules.

Do not assume Cooling cancels reactor meltdown.

—

# 47. Stabilize and Prepare

Stabilize is a Full Action.

Under the confirmed Prepare rules, only Quick Actions can be Prepared.

Therefore ordinary Stabilize cannot be Prepared.

No special Prepare handling is needed.

—

# 48. Stabilize and Full Action Economy

Because Stabilize is itself Full:

taking it consumes the actor’s Full Action.

Frame Conn Turn legality should block combining it with another Full Action unless a special rule grants that ability.

The native flow should remain mechanically independent of this parent action-budget logic.

—

# 49. Native-System Boundary

The intended ownership split is:

**FRAME CONN OWNS:**

- universal Stabilize Full Action;
- Full Action expenditure;
- committed-plan state;
- authoritative actor resolution;
- execute control;
- native flow invocation;
- execution completion tracking;
- future condition-clearing orchestration;
- presentation refresh.

**NATIVE LANCER OWNS:**

- `actor.beginStabilizeFlow(...)`;
- `StabilizeFlow`;
- native Stabilize prompt;
- `strussHelper.stabilize(...)`;
- Cool;
- Heat clearing;
- Exposed removal;
- Restore HP;
- Repair expenditure;
- Reload;
- reloadable-item discovery;
- embedded item updates;
- Clear Burn;
- Burn mutation;
- native Stabilize chat output.

—

# 50. Native Gaps Owned by Future Frame Conn Extension

The two identified native gaps are:

`Clear Own Condition`

and:

`Clear Ally Condition`

Frame Conn may eventually own:

- condition enumeration;
- target selection;
- legality validation;
- native condition removal.

These should be implemented as additions around the native Stabilize architecture, not justification for replacing the entire flow.

—

# 51. Do Not Invent Another `StabilizeFlow`

A native StabilizeFlow already exists.

Frame Conn should not create a parallel custom flow with the same responsibility unless a future architectural need makes replacement unavoidable.

The initial adapter should call the native actor entry point directly.

—

# 52. Proposed Initial Stabilize Flow

STABILIZE
→ Frame Conn validates active Turn
→ validate Full Action
→ resolve authoritative mech
→ spend/commit Full Action
→ native-system adapter calls:
  `actor.beginStabilizeFlow()`
→ native StabilizeFlow
→ `initializeStabilize`
→ `renderStabilizePrompt`
→ player chooses Option 1
→ player chooses Option 2
→ `applyStabilizeUpdates`
→ native `strussHelper.stabilize(...)`
→ actor/item mutations
→ `printStabilizeResult`
→ await flow completion
→ Frame Conn re-reads authoritative actor/items
→ mark committed Stabilize executed
→ refresh telemetry/Turn/UI

—

# 53. Native Option Resolution Model

Conceptually:

OPTION 1
│
├── COOL
│   ├── Heat = 0
│   └── remove Exposed
│
└── RESTORE HP
    ├── require Repair
    ├── HP = max
    └── Repairs -= 1

OPTION 2
│
├── RELOAD
│   ├── identify reloadable items
│   └── native embedded Item updates
│
├── CLEAR BURN
│   └── Burn = 0
│
├── CLEAR OWN CONDITION
│   └── native TODO / manual
│
└── CLEAR ALLY CONDITION
    └── native TODO / manual

This is the core native behavior Frame Conn should preserve.

—

# 54. Immediate Repository Research TODO

- [ ] Trace `actor.beginStabilizeFlow(...)` completely.
- [ ] Trace `StabilizeFlow` constructor/return value.
- [ ] Trace `initializeStabilize`.
- [ ] Trace `renderStabilizePrompt`.
- [ ] Trace exact prompt option values.
- [ ] Trace cancellation behavior.
- [ ] Trace `applyStabilizeUpdates`.
- [ ] Trace `printStabilizeResult`.
- [ ] Trace `strussHelper.stabilize(...)` completely.
- [ ] Trace native Cool implementation.
- [ ] Trace native Restore HP implementation.
- [ ] Trace Repair validation.
- [ ] Trace native Reload implementation.
- [ ] Trace `loadoutHelper.reloadableItems()`.
- [ ] Trace native Clear Burn implementation.
- [ ] Trace TODOs for condition clearing.
- [ ] Trace `SynergyLocation.stabilize`.
- [ ] Determine whether flow result exposes selected options programmatically.

—

# 55. Condition Automation Research TODO

- [ ] Confirm exact conditions eligible for Clear Own Condition.
- [ ] Confirm exact statuses eligible if any.
- [ ] Confirm exact conditions eligible for Clear Ally Condition.
- [ ] Confirm ally range/adjacency.
- [ ] Define native condition enumeration helper.
- [ ] Define status/condition filtering.
- [ ] Reuse native status/effect removal adapter.
- [ ] Define target-selection behavior.
- [ ] Preserve native Stabilize result output.
- [ ] Decide whether to patch/wrap native StabilizeFlow or intercept selected branch.

—

# 56. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Keep Stabilize in universal Full Action catalog.
- [ ] Add non-roll execute control.
- [ ] Resolve authoritative actor.
- [ ] Validate Full Action.
- [ ] Delegate to native-system adapter.
- [ ] Call `actor.beginStabilizeFlow()`.
- [ ] Await native flow completion.
- [ ] Handle native prompt cancellation correctly.
- [ ] Mark Full Action spent exactly once.
- [ ] Mark committed Stabilize executed after actual resolution.
- [ ] Re-read actor state.
- [ ] Re-read loadout/item state.
- [ ] Refresh telemetry.
- [ ] Preserve native chat output.
- [ ] Preserve `stabilize` semantic identity.
- [ ] Add future own-condition automation.
- [ ] Add future ally-condition automation without duplicating other native branches.

—

# 57. Smoke Test TODO

Base flow:

- [ ] Stabilize launches native prompt.
- [ ] Full Action spent exactly once.
- [ ] no d20 roll required.
- [ ] native chat result appears.
- [ ] Frame Conn marks execution correctly.

Cool:

- [ ] Heat becomes 0.
- [ ] Exposed removed.
- [ ] Frame Conn telemetry refreshes.

Restore HP:

- [ ] HP restored to max.
- [ ] one Repair spent.
- [ ] no Repairs case warns/fails correctly.
- [ ] Repairs not double-spent.

Reload:

- [ ] reloadable weapons identified natively.
- [ ] Loading state updated.
- [ ] multiple reloadable items handled.
- [ ] native chat lists reloaded items.
- [ ] Frame Conn does not duplicate item updates.

Clear Burn:

- [ ] Burn becomes 0.
- [ ] Frame Conn refreshes correctly.

Condition branches:

- [ ] Clear Own Condition currently shows native manual behavior.
- [ ] Clear Ally Condition currently shows native manual behavior.
- [ ] future Frame Conn automation removes exactly one legal condition.
- [ ] unrelated statuses remain untouched.

Cancellation/failure:

- [ ] native prompt cancellation does not falsely complete action.
- [ ] missing actor fails safely.
- [ ] flow error does not produce duplicate mutations.

—

# 58. Important Invariants

**Invariant 1**

Stabilize is a Full Action.

**Invariant 2**

A dedicated native `StabilizeFlow` exists.

**Invariant 3**

The authoritative native entry point is `actor.beginStabilizeFlow(...)`.

**Invariant 4**

Frame Conn should delegate to native StabilizeFlow rather than recreate it.

**Invariant 5**

Native Cool fully clears Heat and removes Exposed.

**Invariant 6**

Native Restore HP fully restores HP and spends a Repair.

**Invariant 7**

Native Reload fully mutates reloadable item state.

**Invariant 8**

Native Clear Burn fully clears Burn.

**Invariant 9**

Clear Own Condition is not currently automated natively.

**Invariant 10**

Clear Ally Condition is not currently automated natively.

**Invariant 11**

Frame Conn owns the parent Full Action expenditure; native Stabilize owns mechanical branch resolution.

**Invariant 12**

Future condition automation should extend the native flow rather than replace already-correct native Stabilize mechanics.

—

# 59. Final Working Model

STABILIZE
│
├── Full Action
│
├── Frame Conn
│   ├── validate Full Action
│   ├── spend/commit Full Action
│   ├── resolve authoritative mech
│   └── call native entry point
│
└── Native Lancer
    │
    ├── `actor.beginStabilizeFlow()`
    │
    └── `StabilizeFlow`
        │
        ├── initializeStabilize
        │
        ├── renderStabilizePrompt
        │
        ├── OPTION 1
        │   ├── COOL
        │   │   ├── Heat = 0
        │   │   └── remove Exposed
        │   │
        │   └── RESTORE HP
        │       ├── HP = max
        │       └── Repairs -= 1
        │
        ├── OPTION 2
        │   ├── RELOAD
        │   │   └── native reloadable item updates
        │   │
        │   ├── CLEAR BURN
        │   │   └── Burn = 0
        │   │
        │   ├── CLEAR OWN CONDITION
        │   │   └── native manual/TODO
        │   │
        │   └── CLEAR ALLY CONDITION
        │       └── native manual/TODO
        │
        ├── applyStabilizeUpdates
        └── printStabilizeResult

The critical architectural rule is:

**Stabilize is already a real native Lancer workflow.**

Frame Conn should be the player-facing command surface over that workflow.

The only identified pieces worth adding ourselves are the two condition-clearing branches that the native developers left manual.