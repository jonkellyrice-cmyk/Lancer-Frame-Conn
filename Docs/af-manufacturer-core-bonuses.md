# Manufacturer Core Bonuses
const fs = require(“fs”);

const content = String.raw`# Lancer Core Bonuses — Native Repository Integration Notes

## Status

**Native Core Bonus item type:** Found.

**Native Core Bonus ownership on Pilot actor:** Found.

**Native Core Bonus manufacturer metadata:** Found.

**Native Core Bonus description/effect fields:** Found.

**Native Core Bonus mounted_effect field:** Found.

**Native structured Core Bonus bonuses:** Found.

**Native structured Core Bonus actions:** Found.

**Native structured Core Bonus synergies:** Found.

**Native structured Core Bonus counters:** Found.

**Native structured Core Bonus deployables:** Found.

**Native structured Core Bonus integrated items:** Found.

**Native structured Core Bonus tags:** Found.

**Native Core Bonus BonusData consumption:** Found.

**Native generic ActivationFlow support for structured Core Bonus actions:** Found.

**Native generic integrated/deployable dependency plumbing:** Found.

**Native dedicated CoreBonusFlow:** Not found.

**Native mechanical Core Bonus chat execution:** Not found — SimpleTextFlow only.

**Native generic ActionData frequency tracking:** Not found.

**Native generic Core Bonus trigger engine:** Not found.

**Native generic temporary-effect lifecycle:** Not found.

**Native mounted_effect runtime consumer:** Not found.

**Native persistent chosen-mount / chosen-weapon configuration engine:** Not generally found.

**Native conditional Core Bonus execution:** Not generally found.

**Potential bespoke native representation for some loadout-altering Core Bonuses:** Found in surrounding loadout/import architecture and requires source-specific tracing.

**Frame Helm requirement:** Treat Core Bonuses as first-class Pilot-owned feature sources. Preserve all native structured bonuses/actions/counters/synergies/integrated/deployable data, reuse native bonus and ActivationFlow infrastructure where it works, and supply the missing generalized frequency, trigger, lifecycle, granted-action, persistent configuration, and source-specific runtime behavior.

—

# 1. Purpose

This document records the native Foundry Lancer architecture for Pilot Core Bonuses and defines the intended Frame Helm integration boundary.

Core Bonuses are not merely passive text.

The native Core Bonus item structure can contain:

- static bonuses;
- structured actions;
- synergies;
- counters;
- deployables;
- integrated equipment;
- tags;
- mounted-effect metadata;
- manufacturer/source information.

The normal Foundry Pilot sheet exposes only a small portion of this structure.

The central finding is:

> Native Lancer stores Core Bonuses as rich mechanical data and automatically consumes many static BonusData effects, but there is no complete Core Bonus runtime engine for triggers, action frequency, temporary effects, persistent mount/weapon choices, granted actions, or arbitrary conditional mechanics.

Therefore:

> Frame Helm should not recreate Core Bonus definitions. It should operationalize the structured data the native system already has and supply only the missing runtime layer.

—

# 2. Core Bonus Ownership

Core Bonuses are owned by the Pilot actor.

Conceptually:

PILOT
└── CORE_BONUS items

The Pilot actor’s actual Core Bonus items are authoritative.

Frame Helm should not create duplicate module-local Core Bonus definitions.

—

# 3. Native Core Bonus Item Type

The native item system includes:

\`EntryType.CORE_BONUS\`

as a first-class item type.

The Pilot sheet accesses owned Core Bonuses through the actor’s Core Bonus item collection.

This confirms Core Bonuses are normal native actor-owned feature items.

—

# 4. Native Core Bonus Schema

The Core Bonus model directly contains fields conceptually equivalent to:

- description;
- effect;
- mounted_effect;
- manufacturer.

It also inherits the shared BASCDT-style mechanical template containing:

- bonuses[];
- actions[];
- synergies[];
- counters[];
- deployables[];
- integrated[];
- tags[].

Therefore the real native shape is conceptually:

CORE BONUS
├── name
├── lid
├── manufacturer
├── description
├── effect
├── mounted_effect
├── bonuses[]
├── actions[]
├── synergies[]
├── counters[]
├── deployables[]
├── integrated[]
└── tags[]

—

# 5. Imported Core Bonus Data Preserves Structure

LCP/native import preserves the mechanical arrays.

Conceptually:

\`\`\`ts
system: {
  actions: data.actions?.map(unpackAction) ?? [],
  bonuses: data.bonuses?.map(unpackBonus) ?? [],
  counters: data.counters?.map(unpackCounter) ?? [],
  deployables:
    data.deployables?.map(d =>
      unpackDeployable(d, context)
    ) ?? [],
  description: data.description,
  effect: data.effect,
  integrated: data.integrated,
  lid: data.id,
  manufacturer: data.source,
  mounted_effect: data.mounted_effect,
  synergies: data.synergies?.map(unpackSynergy),
  tags: [],
}
\`\`\`

Frame Helm should strongly prefer this structured data over prose parsing.

—

# 6. Native Static Bonus Consumption

Core Bonuses participate in the native bonus engine.

Core Bonus:

\`system.bonuses[]\`

is included in native bonus/effect generation.

Therefore many static numerical Core Bonus effects can already function automatically.

—

# 7. Static Core Bonus Examples

Examples that are good candidates for native structured BonusData include:

Reinforced Frame
→ +5 HP

Sloped Plating
→ +1 Armor

Gyges Frame
→ +1 Accuracy on Hull checks and saves
→ +1 Threat with melee weapons

Lesson of Disbelief
→ +1 Accuracy on Systems checks and saves
→ +2 E-Defense

Full Subjectivity Sync
→ +2 Evasion

Neurolink Targeting
→ +3 Range to ranged weapons.

If the imported Core Bonus encodes these as BonusData:

Frame Helm should not manually reproduce them.

—

# 8. Do Not Double-Apply Native Core Bonuses

Wrong:

Frame Helm reads:
“+2 Evasion”

→ manually alters Evasion

while:

native Core Bonus BonusData
→ already alters Evasion.

Correct:

native BonusData remains authoritative.

Frame Helm only supplements rules not already represented/consumed structurally.

—

# 9. Native Core Bonus Sheet Contains Rich Editors

The dedicated Core Bonus item sheet exposes editors for:

- actions;
- bonuses;
- synergies;
- deployables;
- counters;
- integrated items.

Conceptually:

\`\`\`hbs
item-edit-arrayed-actions
item-edit-arrayed-bonuses
item-edit-arrayed-synergies
item-edit-arrayed-deployables
counter-array
item-edit-arrayed-integrated
\`\`\`

This confirms complex Core Bonus mechanics were intentionally modeled structurally.

—

# 10. Normal Pilot Sheet Hides Most Core Bonus Mechanics

The ordinary Pilot-sheet Core Bonus presentation largely displays:

- name;
- description;
- effect;
- chat button.

It does not normally expose the rich underlying:

- actions;
- counters;
- synergies;
- deployables;
- integrated items.

Frame Helm can substantially improve usability merely by surfacing the already-existing structured mechanics.

—

# 11. No Dedicated CoreBonusFlow Found

The repository trace found no native:

\`CoreBonusFlow\`.

Core Bonuses do not have a specialized mechanical execution Flow comparable to:

- CoreActiveFlow;
- WeaponAttackFlow;
- StabilizeFlow.

—

# 12. Native Core Bonus Chat Path

The normal Core Bonus chat interaction uses:

\`SimpleTextFlow\`.

Conceptually:

Core Bonus
→ click chat
→ SimpleTextFlow
→ print Core Bonus effect text.

This is presentation only.

It does not:

- track frequency;
- execute a custom action;
- resolve triggers;
- modify chosen mounts;
- spend counters;
- grant temporary effects.

—

# 13. Core Bonus Chat Is Not Core Bonus Execution

Frame Helm should preserve the distinction between:

Show in Chat

and:

Execute Mechanical Feature.

A passive descriptive Core Bonus may only need chat/reference presentation.

An actionable Core Bonus should enter the actor-owned feature/action runtime.

—

# 14. Structured Core Bonus Actions

Core Bonuses can contain:

\`system.actions[]\`.

These use normal native ActionData.

Therefore a Core Bonus can structurally grant:

- Quick Actions;
- Full Actions;
- Free Actions;
- Reactions;
- Protocols;
- Tech actions;
- other supported activation types.

Frame Helm should discover these actions.

—

# 15. Generic Core Bonus Action Execution

Where a structured Core Bonus action is adequately handled by generic native ActivationFlow:

Frame Helm can conceptually invoke:

\`coreBonus.beginActivationFlow(“system.actions.0”)\`.

This preserves native generic checks and chat behavior.

—

# 16. ActivationFlow Is Still Partial

Generic ActivationFlow does not automatically implement:

- arbitrary Core Bonus trigger conditions;
- ordinary ActionData frequency tracking;
- source-specific custom mechanics;
- persistent mount/weapon configuration;
- cross-action conditional state.

Therefore generic ActivationFlow is a useful execution primitive, not a complete Core Bonus runtime.

—

# 17. Native ActionData Frequency

Core Bonus actions use the shared ActionData frequency model.

Possible structured values include:

- Unlimited;
- 1/Turn;
- 1/Round;
- 1/Scene;
- 1/Encounter;
- 1/Mission.

This should feed the same generalized Frame Helm frequency tracker used by:

- Frame Traits;
- Talents;
- Core System sub-actions;
- other actor-owned features.

—

# 18. Native Frequency Runtime Is Missing

The repository trace found no generic runtime enforcement for Core Bonus ActionData frequency.

Therefore:

\`frequency = 1/round\`

does not itself guarantee that native Foundry prevents a second activation in the same round.

Frame Helm must supply that missing use-tracking layer.

—

# 19. Frequency and Action Economy Are Separate

A Core Bonus action may be:

Reaction
+
1/round.

These mean different things.

Reaction:
→ action/timing category.

1/round:
→ source-use limitation.

Frame Helm must validate both independently.

—

# 20. Frequency and Native Counters Are Separate

A Core Bonus may also own:

\`counters[]\`.

A counter is not equivalent to ActionData frequency.

Potential action legality may require:

action category
+
frequency available
+
counter resource available.

These should remain independent systems.

—

# 21. Native Core Bonus Counters

Because Core Bonuses inherit the shared mechanical item template, they can own mutable:

\`counters[]\`.

These use the same native CounterData concept traced for Talents.

Frame Helm should reuse the shared native counter adapter where Core Bonus content uses counters.

—

# 22. Native Counter First Principle

If a Core Bonus defines a native counter:

use it.

Do not create duplicate Frame Helm state merely because the Core Bonus needs a resource.

Suggested resource hierarchy:

1. native item state;
2. native CounterData;
3. ActionData frequency;
4. native status/effect;
5. supplemental Frame Helm state only when none of those model the mechanic.

—

# 23. Native Core Bonus Synergies

Core Bonuses contain:

\`system.synergies[]\`.

These may encode structured interaction with:

- attacks;
- Tech Attacks;
- saves;
- Stabilize;
- Overcharge;
- movement;
- other semantic locations.

Frame Helm should preserve synergies in feature normalization.

—

# 24. Synergy Data Is Not a Complete Trigger Engine

Structured SynergyData is useful evidence of mechanical intent.

However, the trace found no generic Core Bonus runtime engine automatically orchestrating every conditional effect described by a Core Bonus.

Therefore:

structured synergy
→ consume natively where an existing native subsystem already recognizes it

otherwise:
→ Frame Helm trigger/event layer supplies missing orchestration.

—

# 25. Core Bonus Integrated Items

Core Bonuses can contain:

\`system.integrated[]\`.

Unlike Talent integrated entries, these are top-level Core Bonus data and therefore easier to discover directly.

Frame Helm should preserve source lineage when exposing integrated equipment.

—

# 26. Native Integrated Dependency Plumbing

Generic native document utilities inspect integrated item references.

Therefore Core Bonus-integrated equipment has meaningful native plumbing.

Frame Helm should not automatically duplicate integrated gear.

First resolve whether the native actor/loadout already contains or derives it.

—

# 27. Core Bonus Deployables

Core Bonuses can contain:

\`system.deployables[]\`.

Frame Helm should reuse native deployable representation and eventual deployable placement flows where available.

Do not create Core Bonus-specific token-placement mechanics.

—

# 28. Core Bonus Tags

Core Bonuses can contain structured tags.

These should remain available to native or Frame Helm rules resolution where relevant.

Do not discard tags during normalization.

—

# 29. mounted_effect Exists

The native Core Bonus schema includes:

\`mounted_effect\`.

Import preserves this field.

This is clearly intended for Core Bonuses that modify a selected:

- mount;
- weapon;
- loadout element.

—

# 30. mounted_effect Runtime Consumer Not Found

The repository trace found no general runtime consumer for:

\`CoreBonus.system.mounted_effect\`.

It appears primarily as:

- schema data;
- import data;
- source metadata.

Therefore Core Bonuses requiring persistent mount/weapon selection are not fully operationalized natively.

—

# 31. Persistent Configuration Is a New Shared Concern

Some Core Bonuses require the player to choose a persistent object during build/loadout configuration.

Examples include:

- choose one mount;
- choose one weapon;
- replace a mount;
- add an integrated weapon.

These are different from normal combat-time action execution.

Frame Helm needs a reusable feature-configuration layer.

—

# 32. Suggested Persistent Core Bonus Configuration

Conceptually:

CoreBonusConfiguration
{
  actorId,
  coreBonusItemUuid,
  selectionType,
  selectedTargetUuidOrMountId,
  configurationData
}

Exact schema is illustrative.

The important point is preserving the player’s persistent Core Bonus choice.

—

# 33. Do Not Key Persistent Choice by Display Name

Wrong:

\`”Overpower Caliber” -> “Heavy Machine Gun”\`

Correct:

Core Bonus item UUID
+
selected native weapon/item UUID or stable mount identity.

This prevents breakage from renaming.

—

# 34. Auto-Stabilizing Hardpoints

Rule concept:

choose one mount;
weapons attached to that mount gain +1 Accuracy.

This requires:

- persistent mount selection;
- attack source mount identity;
- attack modifier injection.

The Core Bonus’s \`mounted_effect\` data may describe this, but no generic runtime consumer was found.

—

# 35. Auto-Stabilizing Hardpoints Architecture

Conceptually:

Core Bonus owned
→ choose mount during configuration
→ store stable selected mount identity

later attack
→ weapon belongs to selected mount?
→ +1 Accuracy
→ native attack flow receives modifier.

Do not create a second attack roller.

—

# 36. Overpower Caliber

Rule concept:

choose one weapon;
1/round, when it hits,
deal +1d6 bonus damage.

This combines:

- persistent weapon selection;
- attack-hit trigger;
- 1/round frequency;
- damage injection.

It should compose shared subsystems.

—

# 37. Overpower Caliber Architecture

Conceptually:

configuration:
→ choose weapon

combat:
→ selected weapon attack hits
→ frequency tracker checks 1/round
→ optional/automatic bonus damage according to rules
→ roll/add +1d6 bonus damage
→ consume 1/round use
→ downstream damage uses native damage architecture.

—

# 38. Improved Armament

Improved Armament changes the mech’s mount configuration.

The native loadout/import architecture contains concepts related to special mount alterations.

Therefore this Core Bonus should receive a dedicated source-level trace before Frame Helm attempts to implement it independently.

—

# 39. Integrated Weapon

Integrated Weapon grants a new integrated mount/weapon capacity.

Again, the surrounding native loadout model already contains bespoke concepts for some loadout-changing bonuses.

Do not assume this is purely inert Core Bonus prose.

Trace native loadout representation first.

—

# 40. Mount Retrofitting

Mount Retrofitting changes one mount into a Main/Aux mount.

This is persistent loadout configuration.

It should operate through the native loadout model rather than a combat-time temporary effect.

—

# 41. Loadout-Altering Core Bonus Principle

For Core Bonuses that change:

- mount count;
- mount type;
- integrated mount;
- weapon installation;

Frame Helm should prefer native loadout fields/helpers if they exist.

Do not model these as combat-time status effects.

—

# 42. Adaptive Reactor

Rule concept:

when Stabilizing and choosing Cool,
you may spend 2 Repairs to clear 1 Stress.

This is a conditional extension of the existing Stabilize flow.

Native Stabilize should remain authoritative for Stabilize itself.

—

# 43. Adaptive Reactor Architecture

Conceptually:

native StabilizeFlow resolves
→ selected Option 1 = Cool
→ actor owns Adaptive Reactor
→ player has at least 2 Repairs
→ prompt optional Core Bonus effect
→ if accepted:
   Repairs -= 2
   Stress -= 1
→ refresh actor.

Do not recreate Stabilize.

—

# 44. Adaptive Reactor Requires Flow Result Context

Frame Helm needs enough semantic information from Stabilize to know:

- Stabilize executed;
- Cool selected;
- actor/mech source;
- execution completed.

This reinforces the value of semantic action events.

—

# 45. Armory-Sculpted Chassis

Rule concept:

- +1 Accuracy on Engineering checks and saves;
- when Overcharging, gain Soft Cover until start of next turn.

These two halves belong to different subsystems.

—

# 46. Armory-Sculpted Static Half

The Engineering Accuracy portion should use native BonusData if encoded structurally.

Frame Helm should not duplicate it.

—

# 47. Armory-Sculpted Triggered Half

The Soft Cover portion requires:

Overcharge successfully resolves
→ apply temporary cover effect
→ expire at start of next turn.

This should use:

- native Overcharge;
- shared trigger/event layer;
- shared effect lifecycle;
- native Cover/status/attack context where appropriate.

—

# 48. Soft Cover Source Semantics

Because ordinary geometric Cover is attacker-relative, a Core Bonus that directly grants Soft Cover is different.

This is a legitimate persistent/temporary rule effect granting cover generally.

Native \`cover_soft\` status/effect may therefore be appropriate here.

Do not confuse this with geometry-derived Cover.

—

# 49. Heatfall Coolant System

Rule concept:

Overcharge Heat cost never progresses beyond 1d6.

Native OverchargeFlow should remain the authority for actual Overcharge Heat/progression.

The Core Bonus should modify that native calculation rather than replace it.

—

# 50. Heatfall Follow-Up Trace

Before implementation:

- search Core Bonus structured bonuses/synergies;
- search OverchargeFlow consumers;
- determine whether native Overcharge already recognizes this bonus.

If yes:
→ Frame Helm does nothing beyond preserving native data.

If no:
→ supplement native Overcharge adapter with Core Bonus-derived cap.

—

# 51. Integrated Ammo Feeds

Rule concept:

all Limited systems and weapons gain +2 charges.

This may be representable as native structured BonusData affecting Limited maximums.

A source-specific trace is required.

—

# 52. Integrated Ammo Feeds Principle

If native Limited max computation already reads this Core Bonus:

do not manually alter item maxima.

If it does not:

Frame Helm should modify effective Limited maximum through the native item/loadout adapter, not create a parallel charge counter.

—

# 53. Stasis Shielding

Rule concept:

when taking Stress damage,
gain Resistance to all damage until start of next turn.

This is a triggered temporary defensive effect.

—

# 54. Stasis Shielding Architecture

Conceptually:

Stress damage event
→ actor owns Stasis Shielding
→ apply temporary all-damage Resistance
→ source-aware effect lifecycle
→ remove at start of next turn.

Damage itself should remain native.

—

# 55. Native Resistance Integration

Where possible, use native Resistance/effect representation so:

\`damageCalc(...)\`

automatically consumes it.

Do not manually halve damage separately if native Resistance state can represent the effect.

—

# 56. Superior by Design

Rule concept:

- Immunity to Impaired;
- +2 Heat Cap.

These again belong to different layers.

—

# 57. Superior by Design Heat Cap

The Heat Cap increase should be native BonusData if structurally encoded.

Frame Helm should leave it alone if native bonus machinery already applies it.

—

# 58. Superior by Design Impaired Immunity

Immunity requires intercepting attempts to apply the Impaired condition unless native effect machinery already has a structured immunity consumer.

This deserves a dedicated native immunity trace.

—

# 59. Condition Immunity Architecture

Conceptually:

attempt to apply native status
→ condition rules layer checks immunities
→ immunity source includes Core Bonus?
→ reject effect
→ preserve source-specific feedback.

This should be centralized for all status immunities.

—

# 60. Lesson of the Open Door

Rule concept:

- Save Target +2;
- 1/round when a character fails a save against you, they take 2 Heat.

Static Save Target bonus may be native.

Triggered Heat effect requires runtime orchestration.

—

# 61. Open Door Trigger Architecture

Conceptually:

save resolved
→ source actor caused save
→ target failed
→ source owns Lesson of Open Door
→ 1/round use available
→ target takes 2 Heat
→ consume frequency.

This requires a semantic save-result event.

—

# 62. Lesson of the Held Image

Rule concept:

1/round, as a Reaction at start of an allied character’s turn,
make a Lock On Tech Action against a character within LOS and Sensors.

This is a structured actor-owned Reaction pattern.

—

# 63. Held Image Architecture

Conceptually:

allied turn begins
→ source owns Held Image
→ frequency available
→ prompt Reaction
→ select legal Sensors/LOS target
→ apply/execute Lock On through shared Quick Tech machinery
→ consume Reaction
→ consume 1/round frequency.

Do not reimplement Lock On.

—

# 64. Held Image Demonstrates Shared Reaction Registry

Core Bonus actions should feed the same Reaction registry as:

- Talents;
- Frame Traits;
- systems;
- universal Reactions.

The Core Bonus is only the source.

—

# 65. Lesson of Thinking-Tomorrow’s-Thought

Rule concept:

after hitting with a Tech Attack,
the next melee attack against that same target gains Accuracy and its damage cannot be reduced.

This requires source-target-specific temporary state.

—

# 66. Thinking-Tomorrow State

Conceptually:

Tech Attack hits Target X
→ create temporary effect:
   source actor
   target X
   next qualifying melee attack
→ qualifying melee attack occurs
→ apply Accuracy
→ mark damage unreducible/paracausal-like according to exact rule
→ consume effect.

This is not ordinary static BonusData.

—

# 67. Lesson of Transubstantiation

Rule concept:

when taking Structure damage:
disappear;
at start of next turn reappear in same or nearby valid space.

This is a complex triggered movement/visibility lifecycle.

—

# 68. Transubstantiation Architecture

Conceptually:

Structure damage event
→ mark actor temporarily non-targetable/non-space
→ preserve original position
→ wait until start of next turn
→ choose same or nearest valid free space
→ restore token/actor presence.

This requires dedicated source strategy composed from shared:

- trigger;
- lifecycle;
- token positioning;
- targeting/visibility.

—

# 69. Lesson of Shaping

Rule concept:

install an additional AI;
special cascade interaction.

This modifies loadout/AI capability and cascade rules.

It should be traced against native AI/NHP representation before implementation.

Do not create a generic counter from prose.

—

# 70. All-Theater Movement Suite

Rule concept:

choose to count movement as Flying;
if used, take Heat at end of each turn in which it was used.

This requires:

- movement-mode choice;
- current-turn usage state;
- end-of-turn trigger;
- Heat application.

—

# 71. All-Theater Movement Architecture

Conceptually:

movement requested
→ actor owns ATMS
→ player may opt into Flying
→ mark ATMS used this turn
→ movement resolves through shared Fly/movement architecture
→ end of turn
→ if used:
   take native Heat
→ clear turn flag.

—

# 72. Full Subjectivity Sync

Rule concept:

+2 Evasion.

This is the easy case:

native BonusData.

No active Frame Helm behavior should be added if already structured.

—

# 73. Ghostweave

Rule concept:

during your turn you are Invisible;
if you take only Standard Move, Hide, Boost, remain Invisible until next turn;
taking a Reaction ends it immediately.

This is a lifecycle/action-history mechanic.

—

# 74. Ghostweave Architecture

Conceptually:

turn begins
→ actor owns Ghostweave
→ apply native Invisible

during turn:
→ observe actions
→ if forbidden action:
   remove extended eligibility

Reaction taken:
→ remove Invisible immediately

turn ends:
→ if only allowed actions used:
   retain until next turn
else:
   remove

next turn start:
→ expire prior extension / begin new state according to rule.

Native Invisible handles attack miss chance.

Frame Helm owns lifecycle.

—

# 75. Integrated Nerveweave

Rule concept:

when Boosting, move an additional 2 spaces.

This should hook into shared Boost movement calculation.

If native structured Synergy/BonusData already handles it:

reuse native.

Otherwise Frame Helm supplies a Boost modifier.

—

# 76. Kai Bioplating

Rule concept includes:

- +1 Accuracy Agility checks and saves;
- climb/swim at normal speed;
- ignore difficult terrain;
- special vertical movement during Standard Move.

This mixes native BonusData with movement exceptions.

—

# 77. Kai Bioplating Movement Architecture

Movement rules layer should inspect the Core Bonus and alter:

- terrain cost;
- climb/swim treatment;
- vertical movement allowance.

Do not implement these inside UI components.

—

# 78. Fomorian Frame

Rule concept:

- increase Size by 1 to maximum 3;
- cannot be knocked Prone;
- cannot be pulled/knocked back by smaller characters.

This affects:

- actor Size;
- status immunity;
- forced movement.

Native bonus/loadout data may cover Size.

Frame Helm rules layer may need to enforce the immunity/forced-movement components.

—

# 79. Briareros Frame

Rule concept:

while at 1 Structure:
Resistance to all damage;
special destruction/repair behavior.

This is highly conditional actor-state logic.

It likely requires:

- Structure-state trigger;
- native Resistance;
- destruction override;
- HP recovery restriction;
- Repair/Full Repair lifecycle.

This should receive a dedicated source-specific strategy if not natively implemented elsewhere.

—

# 80. Titanomachy Mesh

Rule concept:

1/round,
after successfully Ram or Grapple,
Ram or Grapple again as a Free Action.

This is an ideal consumer of shared:

- semantic action-success event;
- frequency tracker;
- granted-action window;
- cost override.

—

# 81. Titanomachy Mesh Architecture

Conceptually:

Ram or Grapple succeeds
→ actor owns Titanomachy Mesh
→ 1/round available
→ grant temporary choice:
   Ram
   or Grapple
→ selected action executes normally
→ cost override = Free
→ consume Titanomachy frequency.

—

# 82. Titanomachy and Everest Initiative Share Infrastructure

EVEREST INITIATIVE
→ 1/scene
→ choose legal Quick
→ execute as Free.

TITANOMACHY MESH
→ 1/round
→ after successful Ram/Grapple
→ choose Ram or Grapple
→ execute as Free.

These should share generalized granted-action infrastructure.

—

# 83. Universal Compatibility

Rule concept:

when spending CP to activate a Core System,
may take a Free Action to:
- restore all HP;
- clear all Heat;
- roll d20;
- on 20 regain CP.

This should hook into successful native CoreActiveFlow completion.

—

# 84. Universal Compatibility Architecture

Conceptually:

CoreActiveFlow succeeds
→ CP has been consumed natively
→ actor owns Universal Compatibility
→ offer Free Action
→ if accepted:
   HP = max
   Heat = 0
   native d20 roll
   if 20:
      core_energy = 1
→ native/Frame Helm chat result.

Do not replace CoreActiveFlow.

—

# 85. Core Bonus Event Hooks

The examples establish several high-value semantic events Frame Helm should eventually expose:

- Overcharge completed;
- Stabilize completed with selected option;
- Stress damage suffered;
- save failed against actor;
- allied turn started;
- Tech Attack hit;
- Structure damage suffered;
- Boost used;
- Ram succeeded;
- Grapple succeeded;
- Core Power spent;
- attack hit with selected weapon;
- turn started;
- turn ended.

Core Bonuses can subscribe to these shared events.

—

# 86. Core Bonus Trigger Engine Should Be Shared

Do not create a Core Bonus-only event bus.

The same semantic event layer is needed by:

- Talents;
- Frame Traits;
- systems;
- Core Powers;
- Reactions;
- statuses.

Core Bonuses should register rules against the shared event stream.

—

# 87. Core Bonus Effect Lifecycle Should Be Shared

Temporary Core Bonus effects may last:

- until next attack;
- until start of next turn;
- until end of turn;
- until end of scene;
- until condition;
- until used.

Use the generalized lifecycle subsystem also used by Traits/Talents/Core Powers.

—

# 88. Core Bonus Frequency Tracker Should Be Shared

ActionData frequency and triggered-feature frequency should use the same centralized usage tracker.

Scopes include:

- Turn;
- Round;
- Scene;
- Encounter;
- Mission.

—

# 89. Triggered Feature Usage Identity

For a Core Bonus with an implicit triggered feature not represented as a direct ActionData entry, Frame Helm may need a stable synthetic runtime key.

Conceptually:

Pilot UUID
+
Core Bonus item UUID
+
feature semantic key
+
frequency scope.

Do not key merely by display string.

—

# 90. Core Bonus Action Discovery

Frame Helm should inspect every owned Core Bonus for:

- actions[];
- bonuses[];
- counters[];
- synergies[];
- integrated[];
- deployables[];
- mounted_effect;
- tags;
- effect text.

Only executable mechanics should enter the action list.

Passive/triggered mechanics should register in their appropriate subsystems.

—

# 91. Suggested Normalized Core Bonus Action

Conceptually:

\`\`\`text
ActorOwnedAction
{
  sourceKind: core-bonus,
  sourceActorUuid,
  sourceItemUuid,
  actionPath,
  label,
  activationType,
  frequency,
  counterRefs,
  executionStrategy
}
\`\`\`

Exact schema belongs to the shared actor-owned action framework.

—

# 92. Suggested Normalized Triggered Core Bonus Feature

Conceptually:

\`\`\`text
TriggeredFeature
{
  sourceKind: core-bonus,
  sourceActorUuid,
  sourceItemUuid,
  trigger,
  frequency,
  optional,
  effectStrategy
}
\`\`\`

This should reuse shared trigger/lifecycle infrastructure.

—

# 93. Core Bonus Actions and Protocols

A Core Bonus may grant a Protocol.

If structured ActionData says Protocol:

use shared Protocol timing and action economy.

The Core Bonus remains the source.

—

# 94. Core Bonus Actions and Reactions

A Core Bonus may grant a Reaction.

Use the shared Reaction subsystem.

Frequency remains independent.

Held Image is the canonical example.

—

# 95. Core Bonus Actions and Attacks

Core Bonus-granted attacks should use native/shared attack flows.

Do not create Core Bonus-specific attack math.

—

# 96. Core Bonus Actions and Tech

Tech actions should reuse Quick Tech / Full Tech / TechAttackFlow infrastructure.

Held Image should ultimately reuse Lock On rather than create its own tech implementation.

—

# 97. Core Bonus Actions and AoE

If a Core Bonus produces:

- Line;
- Cone;
- Blast;
- Burst;

reuse:

\`aoe.md\`.

Do not create Core Bonus-specific measured-template geometry.

—

# 98. Core Bonus Actions and Statuses

If a Core Bonus grants:

- Invisible;
- Cover;
- Resistance;
- status immunity;
- other conditions;

reuse:

\`lancer-status-effects.md\`

and the centralized condition rules layer.

—

# 99. Core Bonus Actions and Damage

Core Bonus damage should use native damage calculation where practical.

This preserves:

- Armor;
- Resistance;
- Exposed;
- Shredded;
- Overshield;
- AP;
- other native damage mechanics.

—

# 100. Core Bonus Actions and Movement

Movement-related Core Bonuses should modify the shared Movement subsystem.

Examples:

- ATMS;
- Integrated Nerveweave;
- Kai Bioplating;
- Fomorian forced-movement immunity.

Do not directly manipulate tokens independently.

—

# 101. Core Bonus Actions and Saves

Save-related Core Bonuses should hook into shared save events and save-resolution context.

Examples:

- Lesson of Open Door;
- Save Target bonuses.

—

# 102. Core Bonus Actions and Full Repair

Some Core Bonus configuration/resource effects may need reset or recovery during Full Repair.

Use native Full Repair state where it already exists.

Supplement only missing source-specific reset behavior.

—

# 103. Native Loadout Interaction

Certain Core Bonuses alter mount/loadout structure.

The repository contains related loadout fields for some special Core Bonus-derived configurations.

Therefore loadout-changing Core Bonuses should be traced individually before generic implementation.

—

# 104. Do Not Assume Core Bonus Item Is Sole Mechanical State

A Core Bonus definition may describe a mechanic whose resulting configuration is stored elsewhere on the actor/loadout.

Examples may include:

- extra mount;
- integrated weapon;
- superheavy mounting;
- mount replacement.

Frame Helm must distinguish:

definition source

from:

resulting native configuration state.

—

# 105. Configuration-Time vs Combat-Time Core Bonuses

Core Bonuses fall into at least two runtime categories.

CONFIGURATION-TIME:
- choose mount;
- choose weapon;
- alter loadout;
- integrated equipment.

COMBAT-TIME:
- triggered bonuses;
- Reactions;
- temporary effects;
- 1/round grants;
- CP hooks.

These should not be handled by one monolithic executor.

—

# 106. Passive Core Bonuses

Pure static structured bonuses need no execute button.

Examples:

+HP
+Armor
+Evasion
+Range
+Heat Cap
+Save Target.

If native BonusData works:

Frame Helm should merely present/reference them.

—

# 107. Triggered Passive Core Bonuses

Triggered Core Bonuses may not be manually activated until their trigger occurs.

They should register with the semantic event layer.

Examples:

Stasis Shielding
Open Door
Thinking-Tomorrow
Transubstantiation.

—

# 108. Optional Triggered Core Bonuses

Some triggered bonuses are optional.

Example:

Adaptive Reactor:
“you may spend 2 Repairs...”

Frame Helm should prompt rather than automatically spend resources.

—

# 109. Automatic Triggered Core Bonuses

Some triggered effects may be mandatory.

Those can resolve automatically when legality is unambiguous.

Source-specific rule determines optional vs automatic.

—

# 110. Persistent Configured Core Bonuses

Selected-mount/weapon effects should be visible in Frame Helm configuration/state.

Example:

Auto-Stabilizing Hardpoints
Selected Mount: Heavy

Overpower Caliber
Selected Weapon: Heavy Machine Gun.

This choice should persist with the actor.

—

# 111. Core Bonus Configuration Revalidation

If loadout changes:

- selected mount may disappear;
- selected weapon may be removed;
- selected item UUID may become invalid.

Frame Helm should revalidate configured Core Bonus targets.

Do not silently apply a bonus to the wrong replacement item.

—

# 112. Pilot-to-Mech Context

Core Bonuses belong to the Pilot but usually affect the linked Mech.

Therefore normalized execution context should preserve both:

- source Pilot;
- mechanical Mech.

This is the same dual-context issue found with Talents.

—

# 113. Suggested Core Bonus Context

Conceptually:

\`\`\`text
CoreBonusContext
{
  pilotActor,
  mechActor,
  coreBonusItem,
  actionPath,
  configuration,
  frequencyState,
  executionStrategy
}
\`\`\`

Exact schema is illustrative.

—

# 114. Native Bonus Propagation to Mech

The native bonus engine already understands how Pilot-owned Core Bonus BonusData affects the relevant Mech calculations.

Frame Helm should leverage that rather than copying bonus values onto the Mech document.

—

# 115. Core Bonus Rank/License Unlocking

Core Bonuses are acquired through Pilot advancement/license rules.

The owned Core Bonus item is sufficient runtime evidence that the Pilot has the feature.

Frame Helm does not need to revalidate manufacturer-license eligibility during ordinary combat use.

—

# 116. Actor-Owned Feature Runtime

Core Bonuses reinforce the common actor-owned feature architecture:

SOURCE ITEM
→ structured actions
→ bonuses
→ synergies
→ counters
→ frequency
→ triggers
→ integrated/deployables
→ configuration
→ source-specific strategy.

This same runtime should serve:

- Core Bonuses;
- Talents;
- Frame Traits;
- Core System sub-actions.

—

# 117. Native State First Principle

Before adding Frame Helm state for a Core Bonus mechanic, search for:

- native BonusData;
- native CounterData;
- native ActionData frequency;
- native loadout field;
- native integrated item;
- native Limited item;
- native status/effect.

Only create supplemental state where native state does not exist.

—

# 118. Immediate Repository Research TODO

- [ ] Trace actual stock Core Bonus LCP encodings.
- [ ] Trace Auto-Stabilizing Hardpoints data.
- [ ] Trace Overpower Caliber data.
- [ ] Trace Integrated Ammo Feeds data.
- [ ] Trace Heatfall Coolant System data.
- [ ] Trace Superior by Design immunity representation.
- [ ] Trace Lesson of Held Image ActionData.
- [ ] Trace Lesson of Open Door synergies/actions.
- [ ] Trace Titanomachy Mesh data.
- [ ] Trace Universal Compatibility data.
- [ ] Trace native loadout fields associated with mount-changing Core Bonuses.
- [ ] Trace native immunity bonus/effect machinery.

—

# 119. mounted_effect TODO

- [ ] Confirm all stock Core Bonuses using mounted_effect.
- [ ] Determine expected selected mount/weapon semantics.
- [ ] Define persistent Core Bonus configuration state.
- [ ] Preserve stable mount/weapon identity.
- [ ] Apply configured modifier in attack/loadout context.
- [ ] Revalidate after loadout changes.
- [ ] Do not parse mounted_effect prose at runtime if structured configuration mapping can be defined.

—

# 120. Frequency Tracker TODO

- [ ] Reuse generalized actor-owned frequency tracker.
- [ ] Support 1/Turn.
- [ ] Support 1/Round.
- [ ] Support 1/Scene.
- [ ] Support 1/Encounter.
- [ ] Support 1/Mission.
- [ ] Preserve source Core Bonus UUID.
- [ ] Consume only after successful effect/action resolution.
- [ ] Reset at correct lifecycle boundary.
- [ ] Support triggered implicit features as well as ActionData.

—

# 121. Counter Adapter TODO

- [ ] Discover Core Bonus counters.
- [ ] Read current/min/max values.
- [ ] Mutate through native item state.
- [ ] Reset according to source rules.
- [ ] Surface relevant resources in UI.
- [ ] Do not duplicate native counters.

—

# 122. Trigger/Event TODO

- [ ] Subscribe Core Bonuses to shared semantic events.
- [ ] Overcharge completed.
- [ ] Stabilize completed and option selected.
- [ ] Stress damage taken.
- [ ] save failed against actor.
- [ ] allied turn started.
- [ ] Tech Attack hit.
- [ ] Structure damage taken.
- [ ] Boost used.
- [ ] Ram succeeded.
- [ ] Grapple succeeded.
- [ ] Core Power spent.
- [ ] selected weapon attack hit.
- [ ] turn start/end.

—

# 123. Effect Lifecycle TODO

- [ ] Support start of next turn expiry.
- [ ] Support end of next turn expiry.
- [ ] Support until next qualifying attack.
- [ ] Support until used.
- [ ] Support scene duration.
- [ ] Preserve source metadata.
- [ ] Remove only the effect created by the expiring Core Bonus rule.

—

# 124. Granted Action TODO

- [ ] Reuse generalized GrantedActionWindow.
- [ ] Support action filters.
- [ ] Support cost override to Free.
- [ ] Preserve child action identity.
- [ ] Preserve child restrictions/resources.
- [ ] Support Titanomachy Mesh.
- [ ] Support other Core Bonuses with extra/replacement actions.

—

# 125. Configuration TODO

- [ ] Define persistent selected mount state.
- [ ] Define persistent selected weapon state.
- [ ] Resolve current valid target object.
- [ ] Revalidate when loadout changes.
- [ ] Surface configuration in UI.
- [ ] Support reconfiguration only when tabletop rules permit.
- [ ] Preserve native loadout configuration where it already exists.

—

# 126. Loadout Core Bonus TODO

- [ ] Trace Improved Armament.
- [ ] Trace Integrated Weapon.
- [ ] Trace Mount Retrofitting.
- [ ] Trace Superheavy Mounting if applicable.
- [ ] Use native mount/loadout fields.
- [ ] Avoid combat-time fake effects for permanent loadout changes.
- [ ] Reconcile import/COMP/CON state.

—

# 127. Status/Immunity TODO

- [ ] Trace native condition immunity machinery.
- [ ] Implement Superior by Design Impaired immunity if native system lacks it.
- [ ] Use native Invisible for Ghostweave.
- [ ] Use native temporary Resistance for Stasis Shielding.
- [ ] Use native granted Cover where appropriate.
- [ ] Distinguish effect-granted Cover from geometric Cover.

—

# 128. Overcharge Integration TODO

- [ ] Trace Heatfall structured encoding.
- [ ] Trace Armory-Sculpted Overcharge trigger.
- [ ] Hook Core Bonus logic after native Overcharge resolution.
- [ ] Preserve native Overcharge progression/Heat mutation.
- [ ] Do not create a parallel Overcharge engine.

—

# 129. Stabilize Integration TODO

- [ ] Detect successful native Stabilize.
- [ ] Capture selected Stabilize choices.
- [ ] Trigger Adaptive Reactor only after Cool.
- [ ] Check Repairs.
- [ ] Prompt optional spend.
- [ ] Mutate Repairs/Stress natively.
- [ ] Preserve native Stabilize result.

—

# 130. Core Power Integration TODO

- [ ] Listen for successful CoreActiveFlow completion.
- [ ] Offer Universal Compatibility Free Action.
- [ ] Restore HP.
- [ ] clear Heat.
- [ ] roll d20.
- [ ] restore native core_energy on natural 20.
- [ ] do not consume CP twice.

—

# 131. Movement Integration TODO

- [ ] ATMS optional Flying mode.
- [ ] end-of-turn Heat if used.
- [ ] Integrated Nerveweave Boost bonus.
- [ ] Kai Bioplating terrain/climb/swim rules.
- [ ] Fomorian forced-movement immunity.
- [ ] share movement method/context infrastructure.

—

# 132. Attack Integration TODO

- [ ] Auto-Stabilizing selected-mount Accuracy.
- [ ] Overpower selected-weapon trigger.
- [ ] Thinking-Tomorrow next-melee effect.
- [ ] preserve native per-target modifiers.
- [ ] inject only missing Core Bonus modifiers.

—

# 133. Save Integration TODO

- [ ] Lesson of Open Door Save Target bonus should remain native if structured.
- [ ] emit semantic save-failure events.
- [ ] apply triggered target Heat.
- [ ] use 1/round tracker.
- [ ] preserve source actor identity.

—

# 134. Reaction Integration TODO

- [ ] register Held Image Reaction.
- [ ] detect allied turn start.
- [ ] enforce 1/round frequency.
- [ ] validate LOS/Sensors.
- [ ] reuse Lock On.
- [ ] consume Reaction normally.

—

# 135. Smoke Test — Static Core Bonus

- [ ] owned Core Bonus discovered.
- [ ] static BonusData applies natively.
- [ ] Frame Helm does not duplicate it.
- [ ] Core Bonus appears in feature presentation.
- [ ] Show in Chat uses native SimpleTextFlow if desired.

—

# 136. Smoke Test — Structured Core Bonus Action

- [ ] action discovered from system.actions.
- [ ] correct activation type shown.
- [ ] correct frequency shown.
- [ ] exact action path preserved.
- [ ] generic ActivationFlow launches where appropriate.
- [ ] action economy spent once.
- [ ] frequency consumed once.
- [ ] cancellation/failure does not falsely consume frequency.

—

# 137. Smoke Test — Core Bonus Counter

- [ ] counter discovered.
- [ ] current/min/max values correct.
- [ ] mutation persists.
- [ ] UI refreshes.
- [ ] no duplicate Frame Helm resource created.

—

# 138. Smoke Test — Auto-Stabilizing Hardpoints

- [ ] Core Bonus configuration requires mount selection.
- [ ] selected mount persists.
- [ ] attacks from selected mount gain +1 Accuracy.
- [ ] other mounts do not.
- [ ] loadout change invalidates/revalidates selection.
- [ ] no duplicate native attack roll implementation.

—

# 139. Smoke Test — Overpower Caliber

- [ ] selected weapon persists.
- [ ] first eligible hit in round can add +1d6.
- [ ] unrelated weapon does not trigger.
- [ ] second same-round use blocked.
- [ ] next round refreshes use.
- [ ] bonus damage enters shared/native damage pipeline.

—

# 140. Smoke Test — Titanomachy Mesh

- [ ] successful Ram triggers availability.
- [ ] successful Grapple triggers availability.
- [ ] failure does not trigger.
- [ ] 1/round enforced.
- [ ] player can choose Ram or Grapple.
- [ ] child action executes as Free.
- [ ] child action retains normal target/rule restrictions.
- [ ] next round refreshes.

—

# 141. Smoke Test — Held Image

- [ ] allied turn start detected.
- [ ] Reaction offered.
- [ ] 1/round enforced.
- [ ] target must satisfy Sensors/LOS.
- [ ] Lock On applied through shared native status/tech logic.
- [ ] Reaction consumed.
- [ ] no duplicate Lock On implementation.

—

# 142. Smoke Test — Adaptive Reactor

- [ ] Stabilize Cool detected.
- [ ] Core Bonus prompt appears only when legal.
- [ ] requires 2 Repairs.
- [ ] Repairs spent exactly once.
- [ ] Stress cleared exactly once.
- [ ] non-Cool Stabilize does not trigger.
- [ ] native Stabilize remains authoritative.

—

# 143. Smoke Test — Universal Compatibility

- [ ] Core Power successfully spends CP.
- [ ] Free Action offered.
- [ ] HP fully restored.
- [ ] Heat cleared.
- [ ] d20 rolled.
- [ ] natural 20 restores CP.
- [ ] non-20 leaves CP spent.
- [ ] native CoreActiveFlow remains authoritative.

—

# 144. Smoke Test — Ghostweave

- [ ] native Invisible applied at correct time.
- [ ] allowed action history tracked.
- [ ] forbidden action ends extension.
- [ ] Reaction removes Invisible immediately.
- [ ] correct next-turn expiry.
- [ ] native attack miss chance works automatically.

—

# 145. Smoke Test — Stasis Shielding

- [ ] Stress damage event detected.
- [ ] temporary Resistance applied.
- [ ] native damageCalc consumes Resistance.
- [ ] effect expires at start of next turn.
- [ ] repeated triggers do not corrupt effect state.

—

# 146. Important Invariants

**Invariant 1**

Core Bonuses are first-class native Pilot-owned items.

**Invariant 2**

Core Bonuses contain rich structured mechanical data beyond displayed prose.

**Invariant 3**

Static structured Core Bonus BonusData should remain native-authoritative.

**Invariant 4**

No dedicated native CoreBonusFlow was found.

**Invariant 5**

The normal Core Bonus chat path is SimpleTextFlow and is presentation-only.

**Invariant 6**

Structured Core Bonus actions may execute through generic ActivationFlow.

**Invariant 7**

Generic ActionData frequency is not automatically tracked natively.

**Invariant 8**

Core Bonus frequency should use the shared actor-owned frequency tracker.

**Invariant 9**

Native Core Bonus CounterData should be reused where present.

**Invariant 10**

Core Bonus integrated items and deployables should reuse native dependent-content plumbing.

**Invariant 11**

mounted_effect exists as structured data but no general runtime consumer was found.

**Invariant 12**

Persistent mount/weapon choice requires dedicated configuration state where native loadout state does not already represent it.

**Invariant 13**

Triggered Core Bonuses should use a shared semantic event system rather than Core Bonus-specific hooks everywhere.

**Invariant 14**

Temporary Core Bonus effects should use the shared lifecycle/status infrastructure.

**Invariant 15**

Granted extra/free actions should use the same generalized granted-action system as Frame Traits and Talents.

**Invariant 16**

Loadout-altering Core Bonuses require native loadout tracing before custom implementation.

**Invariant 17**

Core Bonus source data, action economy, frequency, resources, configuration, and effect lifecycle are separate concerns.

**Invariant 18**

Frame Helm should operationalize native Core Bonus data, not create a parallel Core Bonus rules database.

—

# 147. Final Working Model

PILOT
│
└── CORE BONUSES
    │
    ├── NATIVE CORE BONUS ITEM
    │   ├── description
    │   ├── effect
    │   ├── manufacturer
    │   ├── mounted_effect
    │   ├── bonuses[]
    │   ├── actions[]
    │   ├── synergies[]
    │   ├── counters[]
    │   ├── integrated[]
    │   ├── deployables[]
    │   └── tags[]
    │
    ├── NATIVE AUTOMATION
    │   ├── structured static BonusData
    │   ├── generic ActivationFlow
    │   ├── native CounterData storage
    │   └── dependent integrated/deployable plumbing
    │
    ├── NATIVE PRESENTATION
    │   └── SimpleTextFlow
    │       └── effect text only
    │
    ├── FRAME HELM ACTOR-OWNED FEATURE REGISTRY
    │   ├── source Pilot
    │   ├── Core Bonus UUID
    │   ├── structured actions
    │   ├── frequency
    │   ├── counters
    │   ├── synergies
    │   ├── integrated/deployables
    │   └── execution strategy
    │
    ├── FRAME HELM SHARED RUNTIME
    │   ├── frequency tracker
    │   │   ├── 1/turn
    │   │   ├── 1/round
    │   │   ├── 1/scene
    │   │   └── 1/mission
    │   │
    │   ├── counter adapter
    │   ├── trigger/event system
    │   ├── effect lifecycle
    │   ├── granted-action windows
    │   ├── persistent feature configuration
    │   └── central status/action/movement rules
    │
    └── SOURCE-SPECIFIC STRATEGIES
        │
        ├── Auto-Stabilizing Hardpoints
        │   └── configured mount → attack Accuracy
        │
        ├── Overpower Caliber
        │   └── configured weapon + 1/round hit bonus
        │
        ├── Adaptive Reactor
        │   └── Stabilize/Cool → optional Repairs for Stress
        │
        ├── Armory-Sculpted Chassis
        │   └── Overcharge → temporary Soft Cover
        │
        ├── Heatfall Coolant System
        │   └── native Overcharge cost cap
        │
        ├── Stasis Shielding
        │   └── Stress event → temporary Resistance
        │
        ├── Superior by Design
        │   └── native Heat Cap + Impaired immunity
        │
        ├── Lesson of the Open Door
        │   └── failed enemy save → 2 Heat, 1/round
        │
        ├── Lesson of the Held Image
        │   └── allied turn Reaction → Lock On, 1/round
        │
        ├── Lesson of Thinking-Tomorrow’s-Thought
        │   └── Tech hit → next melee against same target
        │
        ├── Lesson of Transubstantiation
        │   └── Structure event → temporary disappearance/reposition
        │
        ├── All-Theater Movement Suite
        │   └── optional Fly movement → end-turn Heat
        │
        ├── Ghostweave
        │   └── native Invisible + action-history lifecycle
        │
        ├── Integrated Nerveweave
        │   └── Boost movement modifier
        │
        ├── Kai Bioplating
        │   └── native Agility bonus + movement exceptions
        │
        ├── Titanomachy Mesh
        │   └── 1/round successful Ram/Grapple → Free child action
        │
        └── Universal Compatibility
            └── successful CP spend → optional Free recovery action

The critical architectural rule is:

**Core Bonuses are not missing from native Lancer; their definitions and much of their structured mechanical data are already there. What is missing is the generalized runtime that makes the conditional parts come alive. Frame Helm should preserve native static bonuses and item state, then supply frequency tracking, semantic triggers, temporary-effect lifecycle, persistent configuration, granted actions, and source-specific orchestration using the same shared actor-owned feature framework already needed by Mech Traits and Pilot Talents.**
`;

fs.writeFileSync(“core-bonuses.md”, content, “utf8”);

console.log(
  `Wrote core-bonuses.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);