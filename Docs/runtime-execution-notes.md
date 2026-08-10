const fs = require(“fs”);

const content = String.raw`# Frame Helm Runtime Execution Notes

## Purpose

Classify Frame Helm mechanics by how much native Lancer runtime already exists.

Primary rule:

\`\`\`text
Use the highest native execution layer that actually works.
\`\`\`

Do not recreate native mechanics unnecessarily.

—

# 1. Runtime Classes

Every mechanic should first be classified as:

\`\`\`text
CLASS 1
Native Execution

CLASS 2
Native Substrate / Missing Orchestration

CLASS 3
Frame Helm-Owned Runtime
\`\`\`

Classify before implementation.

—

# 2. Class 1 — Native Execution

Use when Lancer already provides the required:

\`\`\`text
data
entry point
Flow
ordered steps
document mutations
roll/chat output
\`\`\`

Frame Helm should invoke the native pathway.

Pattern:

\`\`\`text
Frame Helm
→ resolve actor/item
→ validate Frame Helm context
→ native entry point
→ native Flow
→ native mutations/output
\`\`\`

Do not duplicate the Flow.

—

# 3. Class 1 Examples

Examples include:

\`\`\`text
Weapon attack
→ weapon.beginWeaponAttackFlow()
→ WeaponAttackFlow

Pilot Weapon attack
→ WeaponAttackFlow
→ Pilot GRIT

Basic attack
→ actor.beginBasicAttackFlow()
→ BasicAttackFlow

Tech attack
→ native TechAttackFlow

System activation
→ item.beginActivationFlow(...)
→ ActivationFlow

System use
→ item.beginSystemFlow()
→ SystemFlow

Core Power
→ native CoreActiveFlow

Stat/HASE/Trigger roll
→ native stat-roll machinery

Limited
→ native Limited check/use mutation

Loading
→ native loaded-state validation/mutation

Damage
→ native DamageRollFlow/damageCalc
\`\`\`

Use exact traced entry points from the relevant action notes.

—

# 4. Class 1 Responsibility

Frame Helm may still own:

\`\`\`text
command presentation
action-economy validation
target preparation
Range/LOS validation where native coverage is incomplete
resource orchestration around the Flow
planning/committed-action execution
post-execution extension hooks
\`\`\`

Native Flow remains authoritative for its implemented mechanic.

—

# 5. Class 1 Prohibition

Do not create parallel:

\`\`\`text
attack rollers
damage engines
Limited counters
Loading state
Core Energy
native stat calculators
\`\`\`

when the native pathway already owns them.

—

# 6. Class 2 — Native Substrate / Missing Orchestration

Use when Lancer contains substantial usable:

\`\`\`text
structured data
schemas
fields
native primitives
child Flows
partial parent Flow
trigger points
document state
\`\`\`

but does not execute the complete tabletop mechanic.

Frame Helm supplies only the missing orchestration/consequence.

—

# 7. Class 2A — Native Flow, Missing Consequence

Pattern:

\`\`\`text
native Flow
→ native result
→ Frame Helm extension
→ native/shared consequence primitives
\`\`\`

Use when native execution reaches the mechanical trigger but stops before completing the rule.

—

# 8. Class 2A Examples

Examples:

\`\`\`text
Weapon special effect
→ native WeaponAttackFlow
→ OnHit/OnCrit/etc.
→ Frame Helm effect strategy

Mounted System special effect
→ native ActivationFlow/TechAttackFlow
→ Frame Helm bespoke consequence

Core Active
→ native CoreActiveFlow
→ Frame Helm bridges missing persistent core_active state

Cascade
→ native Structure/Overheat hook + cascade primitives
→ Frame Helm corrects success gating
→ Frame Helm implements control consequences
\`\`\`

Preserve native execution before/after the missing bridge.

—

# 9. Class 2B — Native Data/Primitives, Missing Parent Action

Pattern:

\`\`\`text
Frame Helm semantic parent action
→ native structured data
→ native child primitive/Flow
→ Frame Helm sequencing/state
\`\`\`

Use when Lancer models the pieces but has no complete parent runtime.

—

# 10. Class 2B Examples

Examples:

\`\`\`text
Skirmish
→ native mount/loadout data
→ Frame Helm mount selection/grouping
→ native WeaponAttackFlow

Barrage
→ native mount/loadout data
→ Frame Helm two-mount orchestration
→ native WeaponAttackFlow per weapon

Pilot Fight
→ Frame Helm Fight parent
→ native Pilot WeaponAttackFlow

Pilot Reload
→ Frame Helm Quick Action
→ native Pilot Weapon loaded state

Everest Initiative
→ native Trait ActionData
→ Frame Helm frequency/granted-action runtime
→ existing Quick Action execution

Talent actions
→ native Talent rank/action/counter data
→ Frame Helm orchestration

Core Bonus actions/triggers
→ native Core Bonus data
→ Frame Helm trigger/frequency/granted-action runtime
\`\`\`

—

# 11. Class 2 Principle

Do not replace native substrate because the parent mechanic is incomplete.

Prefer:

\`\`\`text
missing parent
→ Frame Helm

existing child execution
→ native Lancer
\`\`\`

—

# 12. Class 3 — Frame Helm-Owned Runtime

Use when Lancer lacks a meaningful runtime representation for the mechanic.

Native primitives may still be reused.

Pattern:

\`\`\`text
Frame Helm domain state
→ Frame Helm state machine/orchestrator
→ native/shared low-level primitives
\`\`\`

Create new state only where native state is insufficient.

—

# 13. Class 3 Examples

## Jockey

Native reusable primitives:

\`\`\`text
Pilot actor
GRIT
Triggers
HULL
statuses
Heat
damage
token movement
\`\`\`

Frame Helm owns:

\`\`\`text
Jockey relationship
contested-check coordinator
movement following
Distract/Shred/Damage orchestration
Throw Off
cleanup
\`\`\`

## Voluntary NHP Control

Native reusable primitives:

\`\`\`text
AI tags
Mech actor
Pilot actor
normal Mech actions
\`\`\`

Frame Helm owns:

\`\`\`text
controllerMode
Hand Over Control
Take Control
separate AI action/reaction budget
Pilot-feature suppression
controller lifecycle
\`\`\`

## Pathfinder

Native/Foundry reusable primitives:

\`\`\`text
tokens
scene/grid
walls
movement mutation
actor movement data
\`\`\`

Frame Helm owns:

\`\`\`text
capability discovery
movement graph
weighted path search
semantic route
route scoring
special movement transitions
\`\`\`

—

# 14. Mixed Mechanics

One feature may contain multiple runtime classes.

Example:

\`\`\`text
NHP Cascade

native cascade trigger/roll
→ Class 2A

controller state/consequences
→ Class 3
\`\`\`

Example:

\`\`\`text
Talent

native static bonus
→ Class 1

native ActionData requiring frequency runtime
→ Class 2B

cross-actor transferred resource state
→ Class 3
\`\`\`

Classify at the smallest useful mechanical boundary.

—

# 15. Native Data Is Not Native Runtime

Presence of structured data does not prove execution.

Examples:

\`\`\`text
actions[]
effect
on_attack
on_hit
on_crit
frequency
counters[]
synergies[]
deployables[]
\`\`\`

Trace whether runtime consumes the field.

If runtime only renders semantic text:

\`\`\`text
treat execution as missing
\`\`\`

—

# 16. Native Flow Is Not Necessarily Complete

A named native Flow may still contain missing or incorrect behavior.

Examples:

\`\`\`text
CoreActiveFlow
→ does not fully establish persistent Core Active state

CascadeFlow
→ native cascading mutation is incorrectly unconditional
\`\`\`

Trace ordered Flow steps and mutations before delegating authority.

—

# 17. Native Bug Rule

Do not preserve a traced native bug merely because the pathway is native.

When native execution is structurally useful but mechanically incorrect:

\`\`\`text
reuse valid substrate
→ intercept/replace incorrect step
→ preserve remaining native behavior
\`\`\`

Document the deviation in the relevant integration note.

—

# 18. Native Adapter Boundary

Foundry/Lancer-specific execution should remain behind the native-system adapter.

Feature code should not invent native APIs.

Preferred dependency:

\`\`\`text
Frame Helm semantic action
→ native-system adapter
→ traced actor/item entry point
→ native Flow
\`\`\`

—

# 19. Native Trace Requirement

Before adding a runtime implementation:

\`\`\`text
1. find stock UI/button if present
2. trace event handler
3. trace actor/item entry point
4. trace Flow construction
5. trace ordered Flow steps
6. trace document mutations
7. trace chat/output
8. identify missing behavior
9. classify runtime
\`\`\`

Do not infer Flow names.

—

# 20. Execution Extension Points

Class 2A mechanics need semantic extension points such as:

\`\`\`text
BeforeExecute
AfterExecute
OnAttack
OnHit
OnMiss
OnCrit
OnSaveSuccess
OnSaveFailure
OnDamage
OnStructure
OnOverheat
OnCoreActivate
\`\`\`

Use only where required by automated feature semantics.

Do not replace native child execution.

—

# 21. Parent Action Orchestration

Class 2B parent actions may own:

\`\`\`text
source selection
target selection
child ordering
mount grouping
frequency validation
resource transaction
granted-action selection
conditional branching
result aggregation
\`\`\`

Child mechanics should use existing native/shared execution whenever available.

—

# 22. Resource Execution

Use \`resource-tracker.md\`.

Pattern:

\`\`\`text
precheck resources
→ execute mechanic
→ native resources mutate through native pathway
→ commit Frame Helm-owned resources
\`\`\`

Do not double-consume native resources.

—

# 23. Action Economy

Action economy is orchestration around execution.

Frame Helm may validate/spend:

\`\`\`text
Full
Quick
Reaction
Protocol
Free
Movement
\`\`\`

Do not assume native Flow invocation means the correct parent action cost was enforced.

—

# 24. Status / Effect Execution

When a Class 2/3 mechanic applies a native status:

\`\`\`text
Frame Helm semantic consequence
→ native/shared status infrastructure
\`\`\`

Do not create parallel status state.

Use supplemental state only for relationships/lifecycles not represented natively.

—

# 25. Damage Execution

When a Class 2/3 mechanic causes ordinary Lancer damage:

\`\`\`text
Frame Helm determines consequence
→ native/shared damage pathway
\`\`\`

Preserve:

\`\`\`text
Armor
Resistance
AP
damage type
other native damage rules
\`\`\`

Do not directly subtract HP unless no valid native/shared pathway exists.

—

# 26. Roll Execution

Reuse native rolls when the required roll primitive exists.

Examples:

\`\`\`text
WeaponAttackFlow
TechAttackFlow
StatRollFlow
save/check primitives
\`\`\`

Frame Helm may coordinate multiple native rolls.

Example:

\`\`\`text
Jockey
→ native attacker roll
→ native defender HULL roll
→ Frame Helm compares results
\`\`\`

—

# 27. Supplemental Runtime State

Create Frame Helm state only for concepts with no sufficient native representation.

Examples:

\`\`\`text
Jockey relationship
NHP controllerMode
action-frequency consumption
transferred resource instance
pathfinder planning state
\`\`\`

Do not duplicate:

\`\`\`text
HP
Heat
Core Energy
Limited uses
Loaded state
native Counters
native statuses
\`\`\`

—

# 28. Runtime Classification Matrix

\`\`\`text
Normal Weapon Attack
→ Class 1

Pilot Weapon Attack
→ Class 1

Tech Attack
→ Class 1

Native System Activation
→ Class 1

Core Power CP Spend
→ Class 1

Limited
→ Class 1

Loading
→ Class 1

Skirmish Parent
→ Class 2B

Barrage Parent
→ Class 2B

Weapon Special Effect
→ Class 2A

Mounted System Special Effect
→ Class 2A

Mech Trait Action/Frequency
→ Class 2B

Talent Action/Frequency
→ Class 2B

Core Bonus Trigger/Action
→ Class 2B

Core Active Persistent State
→ Class 2A

Pilot Fight Parent
→ Class 2B

Pilot Reload Parent
→ Class 2B

Cascade Native Skeleton
→ Class 2A

Cascade Control Consequences
→ Class 3

Jockey
→ Class 3

Voluntary NHP Control
→ Class 3

Movement Pathfinder
→ Class 3
\`\`\`

—

# 29. Classification Decision

Use:

\`\`\`text
Does a complete correct native execution chain exist?
│
├── YES
│   → Class 1
│
└── NO
    │
    ├── Does useful native runtime/data substrate exist?
    │   │
    │   ├── YES
    │   │   │
    │   │   ├── native Flow reaches trigger but consequence missing?
    │   │   │   → Class 2A
    │   │   │
    │   │   └── parent action/orchestration missing?
    │   │       → Class 2B
    │   │
    │   └── NO
    │       → Class 3
\`\`\`

—

# 30. Implementation Priority

Prefer implementation effort in this order:

\`\`\`text
1. delegate
2. extend
3. compose
4. create
\`\`\`

Meaning:

\`\`\`text
delegate to complete native Flow
→ extend incomplete native Flow
→ compose native primitives into missing parent action
→ create Frame Helm runtime only when required
\`\`\`

—

# 31. Core Invariants

**Invariant 1**

Use the highest correct native execution layer available.

**Invariant 2**

Do not create a second Lancer rules engine.

**Invariant 3**

Native structured data and native runtime are separate questions.

**Invariant 4**

Trace actual runtime consumers before assuming semantic fields execute.

**Invariant 5**

Class 1 delegates.

**Invariant 6**

Class 2 extends/composes.

**Invariant 7**

Class 3 creates only the missing semantic runtime.

**Invariant 8**

Class 2/3 mechanics still reuse native rolls, damage, statuses, resources, actors, and document state where available.

**Invariant 9**

Supplemental Frame Helm state exists only where native representation is insufficient.

**Invariant 10**

Native bugs may be corrected without replacing otherwise-valid native architecture.

—

# 32. Final Working Model

\`\`\`text
FRAME HELM MECHANIC
        │
        ▼
TRACE NATIVE LANCER
        │
        ▼
CLASSIFY
        │
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
CLASS 1                     NATIVE INCOMPLETE?
NATIVE EXECUTION                  │
        │                         ├───────────────┐
        ▼                         ▼               ▼
delegate                     CLASS 2          CLASS 3
to native                    SUBSTRATE         FH RUNTIME
Flow                         EXISTS            REQUIRED
                                │                 │
                        ┌───────┴───────┐         │
                        ▼               ▼         ▼
                      2A              2B       create missing
                  extend Flow     compose parent semantic runtime
                        │               │         │
                        └───────┬───────┴─────────┘
                                ▼
                     REUSE NATIVE PRIMITIVES
                     WHEREVER THEY EXIST
\`\`\`

Critical rule:

**Delegate when Lancer already executes the mechanic; extend or compose when Lancer provides the substrate; create Frame Helm runtime only for the mechanical state or orchestration that Lancer genuinely does not provide.**
`;

fs.writeFileSync(“runtime-execution-notes.md”, content, “utf8”);

console.log(
  `Wrote runtime-execution-notes.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);