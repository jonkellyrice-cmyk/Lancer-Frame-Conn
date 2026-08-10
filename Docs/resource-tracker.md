const fs = require(“fs”);

const content = String.raw`# Frame Helm Resource Tracker — Native-First Integration Guide

## Purpose

Generalize the native Lancer Limited-resource pathway into a shared Frame Helm resource orchestration layer.

Core rule:

\`\`\`text
Frame Helm owns resource orchestration.
Native Lancer remains authoritative for native resource mutation where that pathway already exists.
\`\`\`

—

# 1. Native Limited Pattern

Native Limited execution already follows the desired model:

\`\`\`text
source action/item
→ determine cost
→ check resource
→ reject if insufficient
→ execute
→ mutate authoritative state
→ refresh/output
\`\`\`

Relevant native state:

\`\`\`text
system.uses.value
system.uses.max
\`\`\`

Relevant native checks:

\`\`\`text
item.isLimited()
checkItemLimited(...)
\`\`\`

Relevant native mutation:

\`\`\`text
updateItemAfterAction(...)
→ system.uses.value -= cost
\`\`\`

Use this as the architectural template.

—

# 2. Resource Service Responsibility

The shared resource service should support:

\`\`\`text
resolve resource
read availability
determine cost
validate spend
execute dependent mechanic
commit spend
reset/recover by lifecycle
\`\`\`

Do not implement resource logic independently inside feature buttons.

—

# 3. Resource Types

Minimum supported resource kinds:

\`\`\`text
native-limited
native-counter
action-frequency
core-power
supplemental
\`\`\`

Additional resource kinds may be added only when native state is insufficient.

—

# 4. Native Limited Adapter

Source:

\`\`\`text
Item.system.uses.value
Item.system.uses.max
\`\`\`

Behavior:

\`\`\`text
validate through native Limited state
native Flow consumes resource
Frame Helm does not decrement again
\`\`\`

Applicable to:

\`\`\`text
Mech Weapons
Pilot Weapons
Mech Systems
other native Limited items
\`\`\`

—

# 5. Native Counter Adapter

Source:

\`\`\`text
CounterData
├── value
├── min
├── max
├── default_value
└── lid/name
\`\`\`

Used by:

\`\`\`text
Talents
Core Bonuses
Mech Traits
Weapons
Mounted Systems
other structured feature sources
\`\`\`

Frame Helm may mutate native counter state when source semantics require it.

Do not create duplicate counter state.

—

# 6. Action Frequency Adapter

Source:

\`\`\`text
ActionData.frequency
\`\`\`

Supported scopes:

\`\`\`text
Unlimited
1/Turn
1/Round
1/Scene
1/Encounter
1/Mission
\`\`\`

Native runtime tracking was not found.

Frame Helm owns:

\`\`\`text
availability
consumption
reset
persistence
\`\`\`

—

# 7. Core Power Adapter

Source:

\`\`\`text
actor.system.core_energy
\`\`\`

Native Core Power flows already consume CP.

Frame Helm should:

\`\`\`text
validate state
delegate native Core Power execution
avoid duplicate decrement
observe resulting state
\`\`\`

—

# 8. Supplemental Resources

Use only when no native storage exists.

Examples may include:

\`\`\`text
temporary transferred resource instances
Jockey relationship state
controller-mode runtime state
special per-scene feature state not represented natively
\`\`\`

Do not use supplemental state if native Limited/Counter/item state already exists.

—

# 9. Resource Descriptor

Suggested normalized shape:

\`\`\`text
ResourceDescriptor
{
  kind,
  sourceActorUuid,
  sourceItemUuid,
  sourcePath,
  resourceKey,
  current,
  max,
  cost,
  scope,
  nativeConsumption
}
\`\`\`

Exact schema is implementation-specific.

—

# 10. Resource Identity

Resource identity must preserve source.

Prefer:

\`\`\`text
actor UUID
+ item UUID
+ action/counter/resource path
\`\`\`

Do not key resources only by display name.

—

# 11. Precheck Phase

Before execution:

\`\`\`text
resolve all required resources
→ read current authoritative values
→ determine costs
→ validate every requirement
\`\`\`

If any requirement fails:

\`\`\`text
do not execute
do not consume any Frame Helm-owned resource
\`\`\`

—

# 12. Execute Phase

After all prechecks pass:

\`\`\`text
invoke native/shared mechanical execution
\`\`\`

Examples:

\`\`\`text
WeaponAttackFlow
ActivationFlow
SystemFlow
TechAttackFlow
CoreActiveFlow
shared status/movement/save resolver
\`\`\`

Do not spend Frame Helm-owned resources merely because the UI opened.

—

# 13. Commit Phase

Only after successful execution:

\`\`\`text
commit resources not already consumed natively
\`\`\`

Examples:

\`\`\`text
ActionData frequency
native CounterData
supplemental resource
\`\`\`

Native Limited/Core Power should normally already be consumed by native execution.

—

# 14. Cancellation Rule

Do not consume Frame Helm-owned resources if execution is cancelled before successful resolution.

Examples:

\`\`\`text
target selection cancelled
attack flow cancelled
save prompt cancelled
placement cancelled
native validation rejects source
\`\`\`

—

# 15. Native Failure Rule

If native execution rejects due to:

\`\`\`text
destroyed
unloaded
insufficient Limited
invalid target
other native validation
\`\`\`

Frame Helm-owned frequency/counters should remain unspent unless the rule explicitly says otherwise.

—

# 16. Multi-Resource Actions

One action may require multiple independent resources.

Example:

\`\`\`text
Quick Action
1/Round
Limited 2
spend 1 Counter
\`\`\`

Precheck:

\`\`\`text
Quick budget available
frequency available
Limited >= 2
Counter >= 1
\`\`\`

Execute:

\`\`\`text
native action flow
\`\`\`

Commit:

\`\`\`text
Limited → consumed natively
frequency → Frame Helm
Counter → native Counter adapter
\`\`\`

—

# 17. Action Economy Is Not a Resource Adapter

Keep action economy separate from feature resources.

Examples:

\`\`\`text
Quick
Full
Reaction
Protocol
Free
\`\`\`

Resource tracker may participate in a shared transaction, but action budget belongs to action-economy service.

—

# 18. Limited and Frequency Are Separate

Do not map:

\`\`\`text
1/Scene
\`\`\`

to:

\`\`\`text
Limited 1
\`\`\`

Limited uses and ActionData frequency have different:

\`\`\`text
storage
recovery
scope
native pathways
\`\`\`

—

# 19. Counter and Frequency Are Separate

An action may have both:

\`\`\`text
frequency = 1/Round
counter cost = 1
\`\`\`

Validate and consume independently.

—

# 20. Recovery / Reset

Each adapter owns its reset semantics.

\`\`\`text
native-limited
→ native Rest/Full Repair/item-specific recovery

native-counter
→ source-specific recovery

1/Turn
→ turn lifecycle

1/Round
→ round lifecycle

1/Scene
→ scene lifecycle

1/Encounter
→ encounter lifecycle

1/Mission
→ mission/full-repair lifecycle as rules require

core-power
→ native Full Repair
\`\`\`

Do not globally reset all resources at one boundary.

—

# 21. Persistence

Longer-scope Frame Helm resources must survive:

\`\`\`text
UI rerender
Frame Helm close/reopen
browser refresh
ordinary Foundry document rerender
\`\`\`

Do not store scene/mission usage only in component-local state.

—

# 22. Frequency State

Suggested frequency record:

\`\`\`text
{
  actorUuid,
  sourceItemUuid,
  actionPath,
  frequency,
  scopeIdentity,
  usesConsumed
}
\`\`\`

Exact schema is implementation-specific.

—

# 23. Frequency Reset

\`\`\`text
1/Turn
→ reset at applicable new turn

1/Round
→ reset on next round

1/Scene
→ reset at authoritative scene boundary

1/Encounter
→ reset at authoritative encounter boundary

1/Mission
→ reset at mission/full-repair boundary
\`\`\`

Do not infer Scene solely from Foundry Scene-document switching unless explicitly chosen as project policy.

—

# 24. Unlimited

\`\`\`text
frequency = Unlimited
\`\`\`

requires no usage record.

Ordinary action economy/resources still apply.

—

# 25. Native Counter Mutation

Counter adapter should provide operations conceptually equivalent to:

\`\`\`text
read
canSpend
increment
decrement
set
reset
\`\`\`

Preserve native:

\`\`\`text
min
max
default_value
\`\`\`

—

# 26. Counter Atomicity

For an action using a Counter:

\`\`\`text
precheck value
→ execute
→ decrement after success
\`\`\`

Avoid:

\`\`\`text
decrement
→ later execution fails
\`\`\`

unless rollback is guaranteed.

—

# 27. Cross-Actor Resources

Some resources may transfer between actors.

Example:

\`\`\`text
Leadership Die
\`\`\`

Model:

\`\`\`text
source native Counter
+
supplemental transferred-instance state
\`\`\`

Source counter remains authoritative for available pool.

Transferred instance preserves:

\`\`\`text
source actor
source item
recipient
lifecycle
spent/returned state
\`\`\`

—

# 28. Native Limited Verification

For native-consumed resources, Frame Helm may verify post-execution state.

Example:

\`\`\`text
before:
uses.value = 3

cost = 1

native execution succeeds

after:
uses.value = 2
\`\`\`

Do not perform a second decrement.

—

# 29. Native Consumption Flag

Resource descriptor should distinguish:

\`\`\`text
nativeConsumption = true
\`\`\`

from:

\`\`\`text
nativeConsumption = false
\`\`\`

Examples:

\`\`\`text
Limited → true
Core Power → true
Action frequency → false
Talent Counter → usually false unless source flow already mutates it
\`\`\`

—

# 30. Resource Transaction

Suggested high-level transaction:

\`\`\`text
prepare
→ validate action economy
→ validate resources
→ execute
→ determine success
→ commit Frame Helm-owned resources
→ verify native-consumed resources
→ emit result
→ refresh
\`\`\`

—

# 31. Resource Transaction Result

Useful result states:

\`\`\`text
blocked
cancelled
failed
succeeded
partially-resolved
\`\`\`

Only \`succeeded\` should normally commit deferred resources.

Define explicit handling for partial-resolution actions.

—

# 32. Parent / Child Actions

Granted actions may have parent and child resources.

Example:

\`\`\`text
Everest Initiative
parent:
  1/Scene

child:
  selected Quick Action
  may have Limited/Counter/frequency
\`\`\`

Precheck both parent and child requirements before execution where possible.

Commit both according to successful resolution semantics.

—

# 33. Overcharge Example

\`\`\`text
Overcharge
→ native Heat/progression
→ grants Quick Action
\`\`\`

Do not represent Overcharge Heat as generic Limited.

Use native Overcharge pathway.

Resource service may coordinate but should not replace native Overcharge mechanics.

—

# 34. Trait Example

\`\`\`text
Everest Initiative
frequency = 1/Scene
\`\`\`

Resource adapter:

\`\`\`text
action-frequency
\`\`\`

Native action execution remains separate.

—

# 35. Talent Example

\`\`\`text
Leader
Leadership Dice
\`\`\`

If encoded as CounterData:

\`\`\`text
native-counter
\`\`\`

Transfer state may require supplemental resource instances.

—

# 36. Core Bonus Example

\`\`\`text
Titanomachy Mesh
1/Round
\`\`\`

Use:

\`\`\`text
action-frequency
\`\`\`

The granted Ram/Grapple child retains its own resources.

—

# 37. Weapon Example

\`\`\`text
Limited weapon
\`\`\`

Use native Limited adapter.

WeaponAttackFlow consumes the charge.

Do not add Frame Helm Limited consumption.

—

# 38. Mounted System Example

\`\`\`text
Limited 2 system action
\`\`\`

Action cost:

\`\`\`text
action.cost = 2
\`\`\`

Native ActivationFlow consumes two native uses.

Frame Helm only coordinates surrounding frequency/action economy.

—

# 39. UI Resource State

Feature UI may display:

\`\`\`text
current / max
USED
available
insufficient
refresh scope
\`\`\`

Presentation must derive from authoritative adapter state.

Do not mutate source descriptions to show usage.

—

# 40. Execution Revalidation

Immediately before execution:

\`\`\`text
re-resolve actor
re-resolve source item/action
re-read resource state
re-check action economy
re-check frequency
re-check counters
\`\`\`

Do not trust stale planned/UI snapshots.

—

# 41. Concurrency Guard

While execution is active:

\`\`\`text
disable duplicate resource-spending execution
\`\`\`

Prevent double-click from consuming:

\`\`\`text
Limited twice
frequency twice
Counter twice
\`\`\`

—

# 42. Native-First Adapter Order

When discovering a resource:

\`\`\`text
1. native item state?
2. native CounterData?
3. native ActionData frequency?
4. native actor field?
5. supplemental Frame Helm state?
\`\`\`

Choose the highest native authority available.

—

# 43. Do Not Create Parallel State

Avoid:

\`\`\`text
Frame Helm limitedUses
Frame Helm coreEnergy
Frame Helm weaponLoaded
\`\`\`

when native fields already exist.

Frame Helm should read/mutate through native adapters.

—

# 44. Suggested Service Boundary

Conceptually:

\`\`\`text
resource-service
├── resolveResources(actionContext)
├── validateResources(resources)
├── commitResources(resources, executionResult)
├── resetResourceScope(scope)
└── adapters/
    ├── native-limited
    ├── native-counter
    ├── action-frequency
    ├── core-power
    └── supplemental
\`\`\`

Exact file/API names are implementation-specific.

—

# 45. Native Adapter Boundary

Native adapters should know native paths/API details.

Feature logic should ask generic questions:

\`\`\`text
canUse?
cost?
current?
max?
commit?
reset?
\`\`\`

Do not scatter:

\`\`\`text
system.uses.value
system.core_energy
counter.value
\`\`\`

through feature UI code.

—

# 46. Resource Events

Useful semantic events:

\`\`\`text
resourceChecked
resourceBlocked
resourceConsumed
resourceRestored
resourceReset
\`\`\`

These may support UI refresh/debugging.

Do not make source-specific mechanics depend on DOM events.

—

# 47. Implementation TODO

- [ ] Create generalized resource-service.
- [ ] Add native Limited adapter.
- [ ] Add native Counter adapter.
- [ ] Add ActionData frequency adapter.
- [ ] Add Core Power adapter.
- [ ] Add supplemental adapter.
- [ ] Separate precheck from commit.
- [ ] Support native-consumed flag.
- [ ] Support multi-resource transactions.
- [ ] Support reset scopes.
- [ ] Persist scene/mission frequency state.
- [ ] Add execution revalidation.
- [ ] Add concurrency guard.
- [ ] Integrate with actor-owned action registry.
- [ ] Integrate with action economy.

—

# 48. Smoke Tests — Native Limited

- [ ] current/max read correctly.
- [ ] insufficient uses block native execution.
- [ ] successful native execution consumes once.
- [ ] Frame Helm does not double-consume.
- [ ] multi-cost action consumes correct amount.
- [ ] Full Repair/native recovery remains authoritative.

—

# 49. Smoke Tests — Frequency

- [ ] 1/Turn blocks second same-turn use.
- [ ] 1/Round blocks second same-round use.
- [ ] 1/Scene persists across rounds.
- [ ] 1/Mission persists across scenes.
- [ ] cancelled action does not consume frequency.
- [ ] successful action consumes once.
- [ ] correct lifecycle resets each scope.

—

# 50. Smoke Tests — Counter

- [ ] native Counter value read.
- [ ] insufficient Counter blocks action.
- [ ] successful action decrements once.
- [ ] failed/cancelled action does not decrement.
- [ ] min/max enforced.
- [ ] recovery strategy restores correct value.

—

# 51. Smoke Tests — Multi-Resource

- [ ] action economy available.
- [ ] frequency available.
- [ ] Limited available.
- [ ] Counter available.
- [ ] all prechecks pass before execution.
- [ ] native Limited consumed once.
- [ ] frequency committed once.
- [ ] Counter committed once.
- [ ] any failed precheck causes zero consumption.
- [ ] cancelled execution preserves deferred resources.

—

# 52. Core Invariants

**Invariant 1**

Use native Limited execution as the model for generalized resource orchestration.

**Invariant 2**

Frame Helm owns orchestration, not every underlying resource mutation.

**Invariant 3**

Native resource pathways remain authoritative where they exist.

**Invariant 4**

Validate before execution; commit deferred resources after successful execution.

**Invariant 5**

Limited, Counter, Frequency, Core Power, and action economy are distinct systems.

**Invariant 6**

Do not duplicate native resource state.

**Invariant 7**

Resource identity must preserve exact source actor/item/action.

**Invariant 8**

Reset semantics are adapter-specific.

**Invariant 9**

Unknown/custom feature resources should use native structured state first and supplemental state only when necessary.

—

# 53. Final Working Model

\`\`\`text
ACTION / FEATURE
│
├── ACTION ECONOMY
│   └── separate service
│
└── RESOURCE SERVICE
    │
    ├── PRECHECK
    │   ├── Native Limited
    │   ├── Native Counter
    │   ├── Action Frequency
    │   ├── Core Power
    │   └── Supplemental
    │
    ├── EXECUTE
    │   └── native/shared mechanical flow
    │
    └── COMMIT
        ├── native-consumed resources
        │   └── verify only
        │
        └── Frame Helm-consumed resources
            ├── frequency
            ├── counters
            └── supplemental state
\`\`\`

Critical rule:

**Expand the native Limited check/consume pattern into a generic resource transaction layer. Preserve native mutation for native resources; Frame Helm supplies orchestration, frequency tracking, counter semantics, persistence, and lifecycle resets only where the native runtime is incomplete.**
`;

fs.writeFileSync(“resource-tracker.md”, content, “utf8”);

console.log(
  `Wrote resource-tracker.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);