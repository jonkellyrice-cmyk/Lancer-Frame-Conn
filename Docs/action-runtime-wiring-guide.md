# Frame Conn Action Runtime Wiring Guide

## Purpose

This document codifies the proven runtime path for wiring Frame Conn actions into the native Foundry Lancer system. It is the implementation companion to the action-flow research documents in `Docs/af-*.md`.

The `af-*` notes answer **what stock Lancer does**. This guide answers **how Frame Conn should carry a player command from its UI, through Turn commitment and runtime composition, into the native Lancer runtime without duplicating the native rules engine**.

The path validated end-to-end with **Improvised Attack** is:

```text
Frame Conn action selection
        ↓
canonical Actions registry entry
        ↓
Turn plan commitment
        ↓
canonical ui-turn committed-plan presentation
        ↓
Application Execute control
        ↓
Action Execution
        ↓
System Bridge
        ↓
Semantic Execution Context
        ↓
Execution Transaction
        ↓
Native Adapter
        ↓
stock Lancer actor/item entry point
        ↓
stock Lancer Flow/workflow
        ↓
native dialog / roll / chat / document effects
        ↓
successful transaction
        ↓
committed entry marked executed
        ↓
Frame Conn re-renders
```

The governing rule is:

> **Frame Conn owns player-facing command and presentation semantics. Native Lancer owns Lancer execution semantics whenever an authoritative native path exists.**

Frame Conn should not reimplement attack formulas, stat rolls, target modifiers, chat cards, heat application, status effects, weapon workflows, or other behavior already owned by the system.

---

## 1. Ownership boundary

### Frame Conn owns

- the universal action catalog;
- action categories and player-facing command UI;
- lazy turn-plan creation;
- action-economy commitment;
- committed-entry identity and execution state;
- committed-plan presentation;
- semantic execution intent;
- cross-feature orchestration;
- adapters that translate semantic intent into native execution.

### Native Lancer owns

- actor/item native execution entry points;
- native Flow construction;
- modifier and target dialogs;
- roll calculation;
- weapon/system selection where stock Lancer already provides it;
- chat output;
- Foundry document mutations;
- native status/resource effects;
- Lancer rules implementation.

Before wiring a new action, trace stock Lancer in this order:

```text
stock UI control
→ stock event handler
→ actor/item native entry point
→ Flow/workflow construction
→ ordered flow steps
→ dialogs / rolls / mutations / chat
```

Do not invent a native API because its name seems plausible. Use the actual entry point discovered by tracing the stock system.

---

## 2. Player selection and lazy Turn creation

The Application renders action choices from the canonical Actions registry. The selected action is identified by its canonical Frame Conn action ID, for example `full.improvised-attack`.

There is no manual **Begin Turn Plan** gate. Turn creation is lazy and idempotent:

```text
player enters a turn-economy path
        ↓
active Frame Conn Turn exists?
        ├── yes → preserve it
        └── no  → derive selected token/combat context and ensure one
```

Use the existing Turn manager's `ensureTurn()` lifecycle through the Application's `ensureTurnPlan()` boundary.

Reactions are different: they may occur during another character's turn and must not blindly create the controlled unit's ordinary turn plan merely because the Reactions category is opened.

---

## 3. Commitment and execution are separate

Committing an action spends Frame Conn turn economy and creates a committed entry. It does **not** imply that native execution has already happened.

For ordinary quick/full actions the commitment path is:

```text
Application commit command
        ↓
Turn API / Turn state
        ↓
FrameConnTurnState.useAction(...)
        ↓
canUseAction(...)
        ↓
spend action budget
        ↓
append usedActions entry
        ↓
record Turn history
        ↓
render Application
```

A committed action stores both the exact committed-entry ID and the semantic action ID:

```js
{
  id,
  actionId,
  duplicateKey,
  source,
  timestamp,
  executed: false,
  executedAt: null,
  executionMetadata: {},
  metadata: {}
}
```

These IDs are not interchangeable. `id` identifies **this exact committed occurrence**; `actionId` identifies the **semantic action definition**. The distinction matters because legal repetition, including Overcharge, can create multiple committed occurrences of the same semantic action.

---

## 4. Turn state is authoritative

`FrameConnTurnState` owns the mutable turn plan. Its snapshot includes action budget, protocol/reaction/overcharge state, `usedActions`, history, and execution state.

The committed plan must flow through:

```text
FrameConnTurnState
        ↓
Turn feature snapshot()
        ↓
ui-turn presentation
        ↓
Application renderer
```

The Application must not independently reconstruct committed actions from raw history or duplicate Turn rules. This is the architecture that replaced the old Application-side legacy path.

---

## 5. Prefer live API methods for mutable state

A major bug discovered during this work came from feature normalization. Feature API records are shallow-copied with object spread:

```js
Object.freeze({
  ...value
});
```

Object spread evaluates getters immediately. Compatibility getters such as `get current()` or `get state()` can therefore become static values at feature-definition time.

That produced a split-brain UI:

```text
Application budget → live getCurrent() → Full action used
ui-turn plan       → flattened .state → null / empty
```

For mutable runtime state, prefer live methods:

```js
turnApi.getCurrent?.()
turnApi.snapshot?.()
```

Use `.current` or `.state` only as compatibility fallbacks unless the feature-construction layer is later changed to preserve property descriptors. Treat this as a repo-wide rule, not a Turn-only exception.

---

## 6. Canonical committed-plan presentation

`ui-turn` converts the Turn snapshot into presentation-safe rows. It combines executable `usedActions` entries with selected history-only events such as Movement, Protocol, and Overcharge, orders them chronologically, and exposes execution metadata.

A committed row may include:

```text
committedActionId
actionId
label
detail
icon
cost
source
kind
executable
canRoll
showExecuteControl
requiresTarget
targetType
executeControl
executed
executedAt
state
classNames
```

The Application consumes this contract without reinterpretation. Plain JavaScript presentation records are still API contracts. A real bug found during this work was `producer: executeControl` versus `consumer: control`; the row could exist while its d20 button remained hidden. Keep producer and consumer field names synchronized.

---

## 7. Execute addresses the exact committed entry

The Execute control must carry both `committedActionId` and `actionId`. Execution should re-resolve and validate the entry instead of trusting stale DOM data.

Before native execution:

1. confirm the committed entry still exists;
2. reject an already-executed entry;
3. confirm its stored `actionId` matches the control;
4. resolve the canonical Actions registry entry;
5. resolve the actor/token used for execution;
6. satisfy any Frame Conn-level target prerequisite.

Only then enter Action Execution.

---

## 8. Targeting boundary

If an action requires a target, Frame Conn may ensure a valid target exists or prompt the player to select one. Once the native path starts, stock Lancer should continue to own target-sensitive modifier logic.

The validated Improvised Attack path is the desired model:

```text
Frame Conn Execute
        ↓
native Basic Attack
        ↓
stock Lancer Basic Attack dialog
        ↓
selected target shown
        ↓
Accuracy / Difficulty / cover / status modifiers
        ↓
native Roll
```

Do not duplicate that native modifier dialog in Frame Conn.

---

## 9. Canonical execution spine

The Application delegates to the registered **Action Execution** feature. It should know only that it wants to execute a semantic Frame Conn action for an actor. It should not construct Lancer Flow classes directly.

`scripts/runtime-orchestrator.js` is the composition root. The proven execution spine is:

```text
Action Execution
        ↓
System Bridge
        ↓
Semantic Execution Context
        ↓
Execution Transaction
        ↓
Native Adapter
```

Do not solve missing dependencies by importing sibling feature implementations directly. Instead:

```text
declare feature boundary
→ expose API
→ resolve API in orchestrator
→ configure narrow runtime binding
→ validate binding
```

This rule applies to UI features too. `ui-turn` and `ui-movement` both previously existed in the registry without having their required runtime bindings composed. Active runtime bindings should be fail-fast validated during startup.

---

## 10. System Bridge and Semantic Execution Context

System Bridge reconciles Frame Conn semantic action identity with available runtime/system support. Inputs may include actor scope, `actionId`, registry identity, action name, existing registry entry, and `executionKind`.

Before continuing, require successful composition with no blocking conflict. Fail before native mutation begins if semantic/system composition cannot be established.

After successful bridge composition, build a Semantic Execution Context containing stable execution facts rather than UI or DOM details. Typical facts include actor, semantic action definition, semantic action ID, execution kind, and bridge metadata.

---

## 11. Execution Transaction

Native execution must run inside the Execution Transaction layer. The transaction is the success/failure boundary that prevents a click from being treated as a successful execution.

Required invariant:

```text
native execution succeeds
        ↓
transaction reports success
        ↓
only then mark committed entry executed
```

If native execution throws, aborts, or returns an unsuccessful state, the committed entry remains pending so the player can correct the problem and retry.

---

## 12. Native Adapter and stock Lancer

The Native Adapter is the concrete boundary to Foundry Lancer. Future actions should add or reuse narrow adapter operations derived from actual native traces, for example basic attack, stat flow, weapon attack, tech attack, or Stabilize entry points.

Do not call native Flow APIs or actor-native methods directly from Application UI code.

Once the adapter invokes the correct native entry point, Frame Conn should get out of the way unless another explicit semantic bridge is required. Native Lancer may then own dialog construction, target inspection, Accuracy/Difficulty, cover, status modifiers, weapon/system choice, roll formula, chat output, document mutation, resources, and effects.

The validated proof case is Improvised Attack opening stock Lancer's **Basic Attack** dialog from a Frame Conn committed action. That is the success criterion for native delegation.

### Known intentional transitional delegation: Stabilize

Stabilize is also runtime-confirmed from Frame Conn, but it currently reaches native Lancer through an older explicit compatibility path rather than the full canonical execution spine:

```text
committed full.stabilize
        ↓
Application Execute
        ↓
Action Execution
        ↓
executionKind = stabilize
        ↓
executeFrameConnStabilize(actor)
        ↓
actor.beginStabilizeFlow()
        ↓
stock StabilizeFlow
        ↓
committed entry marked executed after await succeeds
```

This works because `action-execution-feature.js` contains a dedicated Stabilize classifier and a dedicated `executeFrameConnStabilize()` actor-native delegation. It is **not** a generic fallback accidentally discovering Stabilize.

Treat this path as intentionally supported transitional behavior. It may later be migrated behind System Bridge → Semantic Execution Context → Execution Transaction → Native Adapter for architectural consistency, but migration is not required merely to make Stabilize functional. Any such migration must preserve the stock `actor.beginStabilizeFlow()` authority and the already-validated player behavior.

This distinction is useful when auditing action coverage:

- **canonical and runtime-proven:** Improvised Attack;
- **transitional native delegation and runtime-proven:** Stabilize;
- **not yet end-to-end proven:** evaluate individually from the corresponding action-flow notes.

---

## 13. Post-execution bookkeeping

After a successful Execution Transaction, mark the exact committed entry executed:

```text
executed = true
executedAt = timestamp
executionMetadata = {...}
```

Then re-render from authoritative Turn state through `ui-turn`. Do not directly mutate the rendered row.

```text
state first
→ presentation second
```

---

## 14. Wiring a new action

For every new native-backed action:

### A. Trace native Lancer

Use the relevant `Docs/af-*.md` file or perform a fresh trace:

```text
stock control
→ handler
→ actor/item entry point
→ Flow/workflow
→ flow steps
→ mutations/chat
```

### B. Confirm the semantic action

Verify the canonical Actions entry has the correct ID, cost, target requirement, target type, and repeat/Overcharge semantics. Do not create a second action definition just for execution.

### C. Confirm Turn commitment

Ensure committing the action goes through authoritative Turn mutation and creates a `usedActions` entry.

### D. Classify execution

Map the semantic action to an explicit `executionKind`. Example: `full.improvised-attack → basic-attack`.

### E. Implement or reuse a Native Adapter operation

Invoke only the stock entry point discovered during research.

### F. Compose the execution kind

Extend the canonical runtime executor so the new branch uses Semantic Execution Context, enters an Execution Transaction, calls the Native Adapter, validates transaction success, and fails clearly when unsupported.

### G. Preserve target semantics

Ensure required targets exist before execution, but leave native target modifiers to Lancer.

### H. Mark executed only on success

Never mark a committed action executed before transaction success.

### I. Test the full vertical path

```text
commit
→ row appears
→ Execute appears
→ click addresses exact entry
→ native Lancer workflow opens
→ native result occurs
→ committed row becomes executed
```

---

## 15. Runtime hazards discovered during implementation

### ES module namespace freezing

Do **not** do this:

```js
import * as contract from "./contract.js";
Object.freeze(contract);
```

ES module namespace objects have special immutable/non-configurable semantics. Freezing them caused import-time `Cannot redefine property` errors. Freeze the outer façade if desired, not the imported namespace object.

### Registered does not mean composed

For active features:

```text
register
→ resolve API
→ configureRuntime
→ validate bindings
→ consume
```

### Getter flattening

Dynamic runtime state should be exposed and consumed through live methods.

### Producer/consumer contract drift

Field names must match across feature boundaries.

### Downstream startup symptoms

An error such as `lancer-frame-conn.enabled is not a registered game setting` did not mean settings registration was the root problem. The module graph had already failed during import, so Foundry never reached `init`.

When startup dies before normal Frame Conn initialization logs, use a cache-busting import probe:

```js
import(`/modules/lancer-frame-conn/scripts/runtime-orchestrator.js?debug=${Date.now()}`)
  .then(() => console.log("FRAME CONN IMPORT OK"))
  .catch(error => console.error("FRAME CONN IMPORT FAILURE:", error));
```

Fix the first import-time exception before treating lifecycle symptoms as separate defects.

---

## 16. New-action checklist

### Native research

- [ ] Stock Lancer UI path traced.
- [ ] Exact actor/item native entry point identified.
- [ ] Native Flow/workflow identified where applicable.
- [ ] Expected dialog, roll, chat, and document effects documented.

### Semantic and Turn layers

- [ ] Canonical Actions entry exists.
- [ ] Cost and target semantics are correct.
- [ ] Execution kind is explicit.
- [ ] Turn is lazily ensured where appropriate.
- [ ] Commitment creates an exact `usedActions` entry.
- [ ] Budget and repeat state update correctly.

### Presentation

- [ ] `ui-turn` reads live Turn state through callable methods.
- [ ] Canonical committed row appears.
- [ ] Execute-control field names match producer and consumer.
- [ ] Exact committed-entry ID is preserved.
- [ ] Pending/executed state comes from Turn state.

### Execution spine

- [ ] Application delegates to Action Execution.
- [ ] System Bridge composes successfully.
- [ ] Semantic Execution Context contains required facts.
- [ ] Execution Transaction wraps native work.
- [ ] Native Adapter invokes the traced stock entry point.
- [ ] Native workflow logic has not leaked into Application UI.

### Runtime safety

- [ ] New runtime bindings are configured in the orchestrator.
- [ ] Required active bindings are included in composition validation.
- [ ] No imported module namespace is passed to `Object.freeze()`.
- [ ] Mutable state does not primarily depend on flattened getters.
- [ ] Contract field names match across boundaries.

### Foundry validation

- [ ] Module imports cleanly.
- [ ] Frame Conn opens.
- [ ] Action commits.
- [ ] Committed row appears.
- [ ] Execute launches stock Lancer workflow.
- [ ] Native target/modifier UI is correct.
- [ ] Native roll/chat/effects match the stock sheet.
- [ ] Success marks the exact entry executed.
- [ ] Failure leaves it pending.

---

## 17. Golden path

```text
PLAYER
  ↓
Frame Conn Application
  ↓
Actions Registry
  ↓
Turn State
  ↓
Turn Snapshot
  ↓
ui-turn
  ↓
Committed-plan Execute control
  ↓
Action Execution
  ↓
System Bridge
  ↓
Semantic Execution Context
  ↓
Execution Transaction
  ↓
Native Adapter
  ↓
Stock Lancer Actor / Item Entry Point
  ↓
Native Lancer Flow / Workflow
  ├── targeting
  ├── modifiers
  ├── rolls
  ├── chat
  └── document mutations
  ↓
Transaction success
  ↓
Turn State marks exact committed entry executed
  ↓
ui-turn rebuilds presentation
  ↓
Frame Conn Application re-renders
```

If a future implementation bypasses several boxes in this diagram, treat that as a design warning and justify it explicitly.

---

## Final principle

The goal is not to make Frame Conn imitate the Lancer character sheet. The goal is to provide a different player-facing command interface while still arriving at the same authoritative native Lancer execution machinery.

A successfully wired action therefore satisfies both conditions:

1. **Frame Conn owns the plan and the player's semantic command.**
2. **Lancer owns the Lancer rules execution.**

Preserve that boundary as the remaining actions are wired in.
