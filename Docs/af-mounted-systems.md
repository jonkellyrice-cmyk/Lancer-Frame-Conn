# Mounted Systems
const fs = require(“fs”);

const content = String.raw`# Lancer Mounted Systems — Native Repository Integration Guide

## Native Authority

Mounted systems are native Mech System Items referenced through:

\`\`\`text
mech.system.loadout.systems[]
\`\`\`

Primary system data includes:

\`\`\`text
effect
description
sp
type
destroyed
uses
bonuses[]
actions[]
synergies[]
counters[]
deployables[]
integrated[]
tags[]
\`\`\`

Use native system Items as authority.

—

# 1. Native Loadout / SP

Mounted systems are real embedded Items.

Native mech loadout tracks:

\`\`\`text
system.loadout.systems[]
system.loadout.sp
system.loadout.ai_cap
\`\`\`

Native system SP contributes to equipped SP total.

AI-tagged systems contribute to AI capacity.

Do not recreate SP or AI counting.

—

# 2. Native System Execution Paths

Two distinct native paths exist.

Generic system effect:

\`\`\`text
item.beginSystemFlow()
→ SystemFlow
\`\`\`

Structured system action:

\`\`\`text
item.beginActivationFlow(actionPath)
→ ActivationFlow
\`\`\`

Keep these separate.

—

# 3. SystemFlow

Native SystemFlow sequence:

\`\`\`text
initSystemUseData
checkItemDestroyed
checkItemLimited
checkItemCharged
applySelfHeat
updateItemAfterAction
printSystemCard
\`\`\`

Generic effect mechanics are not interpreted.

Native behavior is mainly:

\`\`\`text
validate resources
consume resources
apply Self Heat
print effect text
\`\`\`

—

# 4. ActivationFlow

Structured \`actions[]\` use generic ActivationFlow.

Native sequence:

\`\`\`text
initActivationData
checkItemDestroyed
checkItemLimited
checkItemCharged
applySelfHeat
updateItemAfterAction
printActionUseCard
\`\`\`

Missing generic behavior includes:

\`\`\`text
action economy
save orchestration
grenade template placement
mine/grenade damage
arbitrary effect execution
\`\`\`

—

# 5. Structured ActionData

System actions may contain:

\`\`\`text
name
activation
cost
frequency
trigger
detail
pilot
mech
tech_attack
heat_cost
damage[]
range[]
synergy_locations[]
\`\`\`

Use structured fields.

Do not parse activation/range/damage from prose when data exists.

—

# 6. Tech Attack Delegation

If:

\`\`\`text
action.tech_attack == true
\`\`\`

or:

\`\`\`text
action.activation == Invade
\`\`\`

ActivationFlow delegates to:

\`\`\`text
TechAttackFlow
\`\`\`

Preserve this native path.

—

# 7. Native System Tech Attacks

Native TechAttackFlow handles:

\`\`\`text
attack HUD
Accuracy/Difficulty
E-Defense
targets
attack rolls
Lock On interaction
hit/crit result
chat output
\`\`\`

Tech range uses mech:

\`\`\`text
system.sensor_range
\`\`\`

unless a specific mechanic overrides it elsewhere.

—

# 8. Tech Attack Special Effects

Native TechAttackFlow does not generically execute bespoke system consequences.

Example:

\`\`\`text
On Hit:
target becomes Jammed
and moves 3 spaces
\`\`\`

requires Frame Helm orchestration unless represented by another native mechanic.

Use native attack resolution, then apply special consequence.

—

# 9. Destroyed Systems

Native state:

\`\`\`text
system.destroyed
\`\`\`

SystemFlow and ActivationFlow both reject destroyed systems.

Frame Helm may disable UI early, but native execution remains final validator.

—

# 10. Limited

Native system Limited state uses:

\`\`\`text
system.uses.value
system.uses.max
\`\`\`

Native flows validate and consume uses.

Structured action cost may consume multiple uses:

\`\`\`text
action.cost
\`\`\`

Do not create duplicate Limited tracking.

—

# 11. Charged

\`checkItemCharged\` exists but is effectively NPC-only in the traced implementation.

For Mech Systems:

\`\`\`text
checkItemCharged
→ no-op
\`\`\`

Do not assume native PC Charged tracking exists.

—

# 12. Self Heat

\`\`\`text
HEAT X (SELF)
\`\`\`

is handled natively through:

\`\`\`text
applySelfHeat()
\`\`\`

Do not duplicate unless a special action explicitly suppresses/modifies it.

—

# 13. Structured Bonuses

Systems may contain:

\`\`\`text
bonuses[]
\`\`\`

These enter native bonus/effect machinery.

Do not manually reapply static structured bonuses.

—

# 14. Counters

Systems may contain native:

\`\`\`text
counters[]
\`\`\`

Counter storage is native.

Counter semantics are not generic.

Use shared native CounterData adapter when the system actually defines a counter.

—

# 15. Synergies

Systems may contain:

\`\`\`text
synergies[]
\`\`\`

and actions may contain:

\`\`\`text
synergy_locations[]
\`\`\`

Preserve them for shared modifier/trigger logic.

Do not assume native generic execution.

—

# 16. Integrated Items

Systems may contain:

\`\`\`text
integrated[]
\`\`\`

Resolve native integrated equipment rather than inventing duplicates.

Preserve source lineage.

—

# 17. Deployables

Systems may contain:

\`\`\`text
deployables[]
\`\`\`

Deployables resolve to native Deployable Actors.

Native deployable data exists.

Generic deployment/use automation does not.

—

# 18. Native Deployable Tags

Native deployable data can identify:

\`\`\`text
Deployable
Drone
Mine
\`\`\`

through standard tags.

Preserve these native classifications.

—

# 19. Deployable Runtime Gap

Native sheet exposes deployable-style controls, but generic click execution is incomplete.

Missing generic behavior:

\`\`\`text
placement
Range/Sensors validation
free-space validation
drone placement
mine placement
grenade template placement
recall
redeploy
deployable action execution
mine damage
\`\`\`

Frame Helm must supply this layer.

—

# 20. Deployable Authority

Do not create a second deployable model.

Use:

\`\`\`text
system deployable definition
→ native Deployable Actor
→ Frame Helm placement/operation
\`\`\`

—

# 21. Generic System Effect

\`\`\`text
system.effect
\`\`\`

is primarily semantic text.

SystemFlow prints it.

No generic parser/interpreter was found.

Bespoke system effects require source-specific automation.

—

# 22. Special System Strategy

Do not parse system prose live.

Prefer:

\`\`\`text
system LID
+ action path/LID
→ MountedSystemStrategy
\`\`\`

Strategy should compose shared primitives.

Examples:

\`\`\`text
Tech Attack
save
status
AoE
movement
deployable
Heat
counter
temporary effect
reaction
protocol
\`\`\`

—

# 23. Unknown/LCP System Fallback

If no special strategy exists:

\`\`\`text
native Limited/Self Heat still works
native Tech Attack still works if structured
native ActivationFlow still works
effect text still posts to chat
\`\`\`

Never block unknown systems solely because bespoke automation is absent.

—

# 24. System Actions in Actor-Owned Registry

A mounted system can grant multiple actions.

Normalize each structured ActionData separately.

Example:

\`\`\`text
SYSTEM
├── passive effect
├── Quick Action
├── Protocol
├── Reaction
└── Deployable
\`\`\`

Do not model one system as one action.

—

# 25. Activation Type

Use structured:

\`\`\`text
action.activation
\`\`\`

to register actions into:

\`\`\`text
Protocol
Quick
Full
Free
Reaction
Invade / Tech
\`\`\`

Action economy remains Frame Helm-owned.

—

# 26. Frequency

ActionData may include:

\`\`\`text
frequency
\`\`\`

Generic runtime tracking is not provided by ActivationFlow.

Use the shared actor-owned frequency tracker.

Do not create a system-specific frequency implementation.

—

# 27. Save-Based Systems

Native SystemFlow contains explicit TODOs for save targets/rolls.

Frame Helm must handle:

\`\`\`text
target acquisition
save type
Save Target
one save per target
success/failure
effect consequence
\`\`\`

Reuse shared save infrastructure.

—

# 28. AoE Systems

If structured range/effect uses:

\`\`\`text
Line
Cone
Blast
Burst
\`\`\`

reuse \`aoe.md\`.

Do not recreate template geometry.

For save AoEs:

\`\`\`text
native template/targeting
+
Frame Helm save loop
\`\`\`

—

# 29. Grenades

Generic grenade placement/damage is not complete natively.

Use:

\`\`\`text
structured range/AoE
→ native template
→ target acquisition
→ attack/save/automatic resolver
\`\`\`

Do not rely on ActivationFlow TODOs.

—

# 30. Mines

Generic mine placement/trigger/damage is not complete natively.

Frame Helm must provide:

\`\`\`text
placement
armed state
trigger condition
target acquisition
resolution
cleanup
\`\`\`

Use native deployable/system data where possible.

—

# 31. Status Effects

System-specific statuses should use:

\`\`\`text
lancer-status-effects.md
\`\`\`

Do not directly write derived:

\`\`\`text
system.statuses.*
\`\`\`

Use native status/effect mutation.

—

# 32. Movement Effects

System-granted movement should use shared Movement architecture.

Examples:

\`\`\`text
teleport
forced movement
fly
special move
boost-like move
\`\`\`

Do not mutate token coordinates inside system-specific UI code.

—

# 33. Reactions

System-granted Reactions should use shared Reaction architecture.

Preserve:

\`\`\`text
trigger
frequency
resource cost
source system
\`\`\`

—

# 34. Protocols

System-granted Protocols should use shared Protocol timing.

Native ActivationFlow handles item/resource mechanics.

Frame Helm handles timing/action economy.

—

# 35. System Range / Sensors

Tech attacks generally use:

\`\`\`text
mech.system.sensor_range
\`\`\`

Other structured actions may have their own:

\`\`\`text
range[]
\`\`\`

Use structured data.

Targeting legality remains Frame Helm-owned where native Flow does not enforce it.

—

# 36. Targeting / LOS

Frame Helm must validate where required:

\`\`\`text
Range
Sensors
LOS
adjacency
valid target type
free placement space
special source rules
\`\`\`

Do not assume SystemFlow/ActivationFlow fully enforce these.

—

# 37. Action Context

Mounted-system execution context should preserve:

\`\`\`text
mech actor
pilot actor if relevant
system Item UUID
action path
action data
activation type
frequency
counter refs
deployable refs
target(s)
template if any
execution strategy
\`\`\`

—

# 38. Generic Structured Action Pipeline

\`\`\`text
resolve system
→ resolve action
→ central legality
→ action economy
→ frequency
→ native resource availability
→ targeting
→ choose native execution route
→ native flow
→ special consequence strategy
→ consume Frame Helm frequency if applicable
→ refresh
\`\`\`

—

# 39. Execution Route Selection

Use:

\`\`\`text
Tech Attack / Invade
→ native TechAttackFlow

ordinary structured action
→ native ActivationFlow

generic USE effect
→ native SystemFlow

deployable
→ Frame Helm deployable layer + native Deployable Actor
\`\`\`

—

# 40. Native vs Frame Helm Ownership

## Native Lancer

\`\`\`text
Mech System Item
loadout reference
SP
AI count
destroyed state
Limited state
Limited action cost
Self Heat
structured ActionData
static structured bonuses
CounterData storage
SynergyData storage
TechAttackFlow
native attack HUD/roll
Deployable definitions
Deployable Actors
chat presentation
\`\`\`

## Frame Helm

\`\`\`text
action economy
ActionData frequency
generic saves
AoE save orchestration
targeting legality
LOS/Sensors placement validation
deployable placement/use
grenades
mines
counter semantics
triggered effects
temporary lifecycle
bespoke system effect execution
\`\`\`

—

# 41. Implementation TODO

- [ ] Discover mounted systems from native loadout.
- [ ] Normalize all structured actions.
- [ ] Preserve exact action paths.
- [ ] Preserve activation type.
- [ ] Preserve frequency.
- [ ] Use native Limited.
- [ ] Use native Self Heat.
- [ ] Use native destroyed state.
- [ ] Use native CounterData.
- [ ] Delegate Tech Attacks natively.
- [ ] Add save resolver.
- [ ] Add deployable placement layer.
- [ ] Add grenade/mine resolver.
- [ ] Add system strategy registry.
- [ ] Add shared trigger/lifecycle integration.
- [ ] Preserve unknown-system fallback.

—

# 42. Smoke Tests

- [ ] mounted system discovered from loadout.
- [ ] SP remains native.
- [ ] AI count remains native.
- [ ] destroyed system rejected.
- [ ] Limited use consumed natively.
- [ ] multi-use action cost consumed correctly.
- [ ] Self Heat applied natively.
- [ ] structured Quick Action registered.
- [ ] structured Protocol registered.
- [ ] structured Reaction registered.
- [ ] Tech Attack delegates to TechAttackFlow.
- [ ] Tech Attack uses E-Defense.
- [ ] system frequency enforced by Frame Helm.
- [ ] native Counter value persists.
- [ ] generic effect still prints to chat.
- [ ] unknown system remains usable natively.

—

# 43. Deployable Smoke Tests

- [ ] system deployable discovered.
- [ ] native Deployable Actor resolved.
- [ ] placement validates Range/Sensors.
- [ ] placement validates free space.
- [ ] Drone classification preserved.
- [ ] Mine classification preserved.
- [ ] deployable actions execute through shared action system.
- [ ] recall/redeploy lifecycle works.
- [ ] removal/destruction refreshes source UI.

—

# 44. Core Invariants

**Invariant 1**

Mounted systems are native Mech System Items in the mech loadout.

**Invariant 2**

Do not duplicate native SP, AI, destroyed, Limited, or Self Heat state.

**Invariant 3**

Structured system actions are distinct from the generic system effect USE path.

**Invariant 4**

Tech Attack/Invade actions should delegate to native TechAttackFlow.

**Invariant 5**

Generic system effect text is not a mechanical interpreter.

**Invariant 6**

ActionData frequency requires shared Frame Helm runtime tracking.

**Invariant 7**

Native counters are storage; Frame Helm supplies missing counter semantics.

**Invariant 8**

Deployable definitions/Actors are native, but placement and operation are largely Frame Helm responsibilities.

**Invariant 9**

Unknown/custom systems must gracefully fall back to native resource handling and chat presentation.

**Invariant 10**

Bespoke system automation should use source strategies keyed by stable system/action identity, not runtime prose parsing.

—

# 45. Final Working Model

\`\`\`text
NATIVE MECH SYSTEM
│
├── effect
├── actions[]
├── bonuses[]
├── counters[]
├── synergies[]
├── deployables[]
├── integrated[]
├── Limited / Self Heat / destroyed
│
├── GENERIC EFFECT
│   └── native SystemFlow
│       ├── validate
│       ├── consume resources
│       ├── Self Heat
│       └── chat
│
├── STRUCTURED ACTION
│   │
│   ├── Tech Attack / Invade
│   │   └── native TechAttackFlow
│   │
│   └── Other Action
│       └── native ActivationFlow
│
├── DEPLOYABLE
│   └── Frame Helm placement/operation
│       └── native Deployable Actor
│
└── FRAME HELM RUNTIME
    ├── action economy
    ├── frequency
    ├── targeting
    ├── saves
    ├── AoE
    ├── statuses
    ├── movement
    ├── triggers/lifecycle
    └── bespoke system strategies
\`\`\`

Critical rule:

**Use native Lancer for mounted-system data, SP/AI accounting, destroyed/Limited/Self-Heat state, structured actions, and Tech Attack execution. Frame Helm fills the missing runtime: action economy, frequency, targeting, saves, deployables, and bespoke system effects.**
`;

fs.writeFileSync(“mounted-systems.md”, content, “utf8”);

console.log(
  `Wrote mounted-systems.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);