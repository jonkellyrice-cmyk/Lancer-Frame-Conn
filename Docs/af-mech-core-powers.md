# Mech Core Powers

# Lancer Core Powers and Core Systems — Native Repository Integration Notes

## Status

**Native Core System data on Frame items:** Found.

**Native persistent Core Power resource:** Found.

**Native `actor.system.core_energy`:** Found.

**Native `actor.system.core_active`:** Found.

**Native Core Active execution flow:** Found.

**Native `CoreActiveFlow`:** Found.

**Native Frame item entry point:** Found.

**Native `item.beginCoreActiveFlow(path)`:** Found.

**Native CP validation:** Found.

**Native CP consumption:** Found.

**Native Full Repair CP restoration:** Found.

**Native Full Repair Core Active reset:** Found.

**Native structured Core activation type:** Found.

**Native Core passive bonuses:** Found.

**Native Core active bonuses:** Found.

**Native Core passive actions:** Found.

**Native Core active actions:** Found.

**Native Core deployables/integrated content:** Found.

**Native Core Active bonus consumption through `core_active`:** Found.

**Native runtime `core_active = true` activation mutation:** Not found.

**Native general runtime expiration of `core_active`:** Not found.

**Native action-economy deduction in CoreActiveFlow:** Not implemented.

**Native generic AoE save orchestration:** Not implemented.

**Frame Conn implementation status:** Frame Conn should discover Core Systems from the equipped Frame, use native `CoreActiveFlow` for CP-spending Core Power execution, preserve native passive/active actions and bonuses, and bridge only the missing action-economy and persistent `core_active` lifecycle behavior.

## Purpose

This document records the native Foundry Lancer architecture for Frame Core Systems and Core Powers.

Core Systems are not merely one special button.

A Frame’s Core System can contain:

- passive effects;
- passive bonuses;
- passive actions;
- a CP-consuming active effect;
- active bonuses;
- active actions;
- deployables;
- integrated equipment;
- tags;
- structured activation timing.

Native Lancer already implements the critical CP resource lifecycle and provides a dedicated:

`CoreActiveFlow`

for spending Core Power.

Therefore:

> Frame Conn should not recreate Core Power resource mechanics.

Instead:

> Frame Conn should expose Core Systems as a first-class actor-owned feature source, route CP-consuming activation through native CoreActiveFlow, and add the runtime Core Active lifecycle behavior that the native repository leaves incomplete.

—

# 1. Core System Ownership

A mech’s Core System belongs to its equipped:

**Frame item**.

It is not represented as a standalone generic Core Power item.

The primary native structure is conceptually:

`frame.system.core_system`

Therefore Core System discovery should begin from:

mech
→ equipped Frame
→ `frame.system.core_system`.

Do not search the actor inventory for an item merely named “Core Power”.

—

# 2. Native Core System Structure

The Frame Core System contains structured data including concepts such as:

- name;
- description;
- passive name;
- passive effect;
- passive bonuses;
- passive actions;
- active name;
- active effect;
- active bonuses;
- active actions;
- activation;
- tags;
- deployables;
- integrated equipment.

This means Core Systems can participate in several Frame Conn subsystems beyond simple CP activation.

—

# 3. Core System Passive and Active Sides

Native Lancer distinguishes:

**Core Passive**

from:

**Core Active**.

Conceptually:

CORE SYSTEM
│
├── PASSIVE
│   ├── passive effect
│   ├── passive bonuses
│   └── passive actions
│
└── ACTIVE
    ├── active effect
    ├── active bonuses
    ├── active actions
    └── CP-consuming activation.

Frame Conn should preserve this structural distinction.

—

# 4. Core Power Resource

The mech actor has the native field:

`actor.system.core_energy`

This is the authoritative Core Power resource.

The default value is:

`1`

under normal mech state.

Conceptually:

`core_energy = 1`
→ CP available

`core_energy = 0`
→ CP spent.

Frame Conn should not create a duplicate CP counter.

—

# 5. Core Energy and Core Active Are Different

The actor also contains:

`actor.system.core_active`

These fields mean different things.

Conceptually:

`core_energy`
→ does the mech still have CP available to spend?

`core_active`
→ is the Frame’s persistent active Core System state currently enabled?

These must remain separate in Frame Conn.

—

# 6. Native Core Active Flow Exists

The repository contains:

`CoreActiveFlow`

in:

`src/module/flows/frame.ts`

This is a real dedicated native Flow.

It extends:

`ActivationFlow`.

Therefore CP-consuming Core Power execution should use this native Flow.

—

# 7. Native Frame Item Entry Point

The Frame item exposes:

`item.beginCoreActiveFlow(path)`

This is the correct high-level native execution boundary.

Conceptually:

Frame item
→ `beginCoreActiveFlow(...)`
→ `CoreActiveFlow`
→ native activation mechanics
→ CP validation
→ CP consumption.

Frame Conn should invoke this through its native-system adapter.

—

# 8. Default Core System Path

Core Active execution can use:

`system.core_system`

as the Core System action path.

This allows CoreActiveFlow to execute the Core System even when the Frame does not expose one conventional explicit `active_actions[]` entry for the primary Core activation.

—

# 9. Synthetic Core Action

When the whole Core System is activated, native Lancer can construct a synthetic `ActionData`-like object from the Core System itself.

Relevant source data includes:

- Frame/Core identity;
- Core Active name;
- `core_system.activation`;
- `core_system.active_effect`;
- Core tags/metadata.

Therefore Frame Conn should not require every Core Power to contain an explicit `active_actions[0]` before it is considered executable.

—

# 10. Native Core Activation Type

The Core System contains structured:

`core_system.activation`

This determines the action timing/cost category of the Core activation.

Potential values may include normal native activation categories such as:

- Protocol;
- Quick;
- Full;
- Free;
- Reaction;
- other native activation types.

Frame Conn should use this structured value to place the Core Power into the correct action category.

Do not parse the action type from Core Power prose.

—

# 11. CoreActiveFlow Extends ActivationFlow

Because CoreActiveFlow extends ActivationFlow, it inherits the general actor-owned activation machinery.

This includes native handling for concepts such as:

- destroyed-item validation;
- Limited checks;
- Charged checks;
- self Heat;
- item updates;
- native activation/chat output.

Frame Conn should not reproduce these mechanics.

—

# 12. Native CoreActiveFlow Step Sequence

The discovered native CoreActiveFlow sequence is conceptually:

`initActivationData`

→

`checkItemDestroyed`

→

`checkItemLimited`

→

`checkItemCharged`

→

`checkCorePower`

→

`applySelfHeat`

→

`updateItemAfterAction`

→

`consumeCorePower`

→

`TODO: deduct action from actor action tracker`

→

`printActionUseCard`

This is the native mechanical execution path Frame Conn should preserve.

—

# 13. Native CP Validation

CoreActiveFlow explicitly validates Core Power availability.

It confirms:

- the actor is a Mech;
- Core Power remains available.

The relevant native state is:

`actor.system.core_energy`.

If no CP remains:

→ native flow warns;
→ flow stops.

Frame Conn may use CP state for presentation and early legality, but native CoreActiveFlow should remain the final execution-time validator.

—

# 14. Native CP Consumption

CoreActiveFlow consumes Core Power by updating:

`system.core_energy = 0`

after successful Core Active execution.

Therefore Frame Conn must not separately spend CP.

Correct:

Frame Conn
→ invoke CoreActiveFlow

Native Lancer
→ consume CP once.

—

# 15. Avoid Double CP Spending

Wrong:

Frame Conn:
`core_energy = 0`

then:

CoreActiveFlow
→ consumes Core Power again.

Correct:

Frame Conn:
→ action-economy validation only

Native CoreActiveFlow:
→ authoritative CP mutation.

This should be a hard integration invariant.

—

# 16. Native Full Repair Restores CP

Native Full Repair performs:

`system.core_energy = 1`

Therefore the Core Power resource lifecycle is already native.

Conceptually:

Full Repair
→ CP restored

CoreActiveFlow
→ CP spent

next Full Repair
→ CP restored.

Frame Conn should simply refresh from actor state after Full Repair.

—

# 17. Native Full Repair Also Clears Core Active

Full Repair also performs:

`system.core_active = false`

Therefore Full Repair resets both:

- CP resource;
- persistent Core Active state.

Conceptually:

Full Repair
→ `core_energy = 1`
→ `core_active = false`.

This is a useful native lifecycle endpoint.

—

# 18. `core_active` Has Real Mechanical Meaning

`core_active` is not merely a presentation flag.

Native Frame bonus resolution checks it.

When:

`core_active = false`

the Frame contributes:

`passive_bonuses`

only.

When:

`core_active = true`

the Frame contributes:

`passive_bonuses`
+
`active_bonuses`.

Therefore `core_active` controls native structured active Core bonuses.

—

# 19. Native Bonus Resolution

Conceptually:

Frame bonuses requested
→ actor has `core_active`?
│
├── NO
│   └── passive Core bonuses only
│
└── YES
    └── passive + active Core bonuses.

This means Frame Conn does not need to manually apply every structured active bonus.

It only needs to ensure persistent Core Active state is represented correctly.

—

# 20. Native `core_active = true` Runtime Mutation Is Missing

The full repository trace found no runtime code in:

- CoreActiveFlow;
- ActivationFlow;
- mech sheet;
- Frame item methods;
- generic action execution;

that performs:

`actor.update({ “system.core_active”: true })`

when CoreActiveFlow executes.

Therefore the native repository has:

- Core Active state;
- consumers of Core Active state;

but no complete runtime bridge turning that state on from Core Power execution.

This is a genuine native automation gap.

—

# 21. CoreActiveFlow Does Not Automatically Enable Active Bonuses

Because CoreActiveFlow does not set:

`core_active = true`

a Core Power with persistent:

`active_bonuses`

will not necessarily have those bonuses begin contributing merely because native CoreActiveFlow consumed CP.

Frame Conn may need to bridge this.

—

# 22. Do Not Set `core_active = true` Universally

Not every Core Power creates a persistent active mode.

Some Core Powers may be:

- instantaneous;
- one-time attacks;
- one-time repairs;
- immediate deployments;
- temporary effects represented another way.

Therefore the rule must not be:

every CoreActiveFlow
→ `core_active = true`.

Instead:

Core Active succeeds
→ determine whether the Core System requires persistent active state
→ enable `core_active` only when appropriate.

—

# 23. Persistent Core Active Detection

Potential evidence that a Core Power has a persistent mode may include:

- structured `active_bonuses`;
- active actions available only during the mode;
- active effect wording;
- native content-specific data;
- explicit lifecycle metadata if present.

Structured data should be preferred over prose parsing.

Exact classification requires Core System content research.

—

# 24. Core Active Lifecycle Is Incomplete Natively

The full source trace found no general runtime mechanism that turns:

`core_active`

back off before Full Repair.

Therefore if a Core Active lasts:

- for the rest of the scene;
- until end of encounter;
- until manually ended;
- until another condition;

Frame Conn may need to own that lifecycle.

—

# 25. Full Repair Is the Native Hard Reset

The only general runtime reset found is Full Repair:

`core_active = false`.

Therefore Frame Conn can safely rely on Full Repair as one endpoint.

Earlier expiration must be handled according to the individual Core Power.

—

# 26. Core Active Duration Must Be Source-Specific

Do not assume all Core Active states last:

until Full Repair.

The actual Core Power rules determine duration.

Possible lifecycles include:

- instantaneous;
- rest of current scene;
- rest of encounter;
- until a condition occurs;
- mission-long;
- manually ended.

Frame Conn should preserve source-specific duration.

—

# 27. Source-Aware Core Active State

A mature implementation may need metadata conceptually like:

CoreActiveState
{
  actorId,
  frameId,
  sourceCoreSystem,
  activatedRound,
  activatedTurn,
  lifecycle,
  expiresAt,
  status
}

Exact names are illustrative only.

The authoritative native bonus gate remains:

`actor.system.core_active`.

Supplemental metadata only explains when that gate should be turned on/off.

—

# 28. Core Active Actions

The Core System contains:

`active_actions`

These are structured actions associated with the active side of the Core System.

They may have normal action activation types.

Frame Conn should discover and normalize them.

—

# 29. Core Passive Actions

The Core System also contains:

`passive_actions`.

This means the passive side of a Core System may grant additional executable actions even when CP has not been spent.

Therefore:

Core System
≠ only one CP-spending action.

Frame Conn’s actor-owned action discovery must inspect both passive and active actions.

—

# 30. Primary Core Activation vs Active Sub-Actions

These should remain distinct.

Primary Core activation:

→ spends CP
→ executes through CoreActiveFlow.

Active sub-actions:

→ may become available through the active Core mode;
→ have their own activation type;
→ should execute through the appropriate native action machinery.

Do not charge CP again merely because a player uses an active sub-action after the Core Power has been activated.

—

# 31. Passive Actions Do Not Spend CP Merely Because They Belong to Core System

A passive Core System action belongs to the Frame Core System but is not automatically the CP-spending Core Active.

Its own structured action data determines action economy.

This distinction should be preserved in the action registry.

—

# 32. Suggested Core Action Source Identities

Conceptually, Frame Conn may normalize Core System sources such as:

`frame-core-primary-active`

`frame-core-active-action`

`frame-core-passive-action`

Exact identifiers are illustrative only.

The important part is preserving source kind.

—

# 33. Exact Action Path Preservation

Core System actions should preserve:

- Frame item UUID;
- exact action path;
- Core System side;
- action metadata.

Examples may conceptually resemble:

Primary active:
`system.core_system`

Active sub-action:
`system.core_system.active_actions.0`

Passive sub-action:
`system.core_system.passive_actions.0`

Do not reconstruct action identity from labels.

—

# 34. Core Passive Bonuses

The Core System contains structured:

`passive_bonuses`.

These contribute through native Frame bonus resolution regardless of Core Active state.

Frame Conn should not manually recreate these bonuses.

—

# 35. Core Active Bonuses

The Core System contains structured:

`active_bonuses`.

Native Frame bonus resolution includes these when:

`actor.system.core_active === true`.

Therefore correctly managing `core_active` can automatically activate these bonuses throughout the native rules engine.

—

# 36. Do Not Apply Structured Core Bonuses Twice

Wrong:

Frame Conn detects active bonus
→ manually modifies attack/check

and:

native Frame bonus resolver sees `core_active`
→ applies same bonus.

Correct:

Frame Conn manages Core Active state
→ native bonus resolver handles structured bonus.

—

# 37. Core Active State and Custom Prose Effects

Not every active Core effect can necessarily be represented through structured bonuses.

Some may require:

- statuses;
- movement changes;
- special attacks;
- transformations;
- triggered effects;
- AoEs;
- action grants.

Frame Conn will still need source-specific integration where the native system provides only descriptive text.

—

# 38. Core Deployables

Core Systems may contain structured:

`deployables`.

These should be researched as a separate native execution path.

Do not assume generic CoreActiveFlow automatically deploys all deployable objects.

—

# 39. Core Integrated Equipment

Core Systems may include structured:

`integrated`

equipment.

These may grant:

- weapons;
- systems;
- actions;
- bonuses.

Actor-owned feature discovery should preserve their relationship to the Frame/Core System.

—

# 40. Core Tags

The Core System also contains tags.

These may influence:

- attacks;
- Range;
- damage;
- action legality;
- interactions with other systems.

Frame Conn should preserve native tags rather than flatten Core Active into plain text.

—

# 41. Core Power Attacks

A Core Power may grant or perform an attack.

Where native action/weapon/attack metadata exists:

Frame Conn should route the attack through native attack machinery.

CoreActiveFlow handles the CP activation.

The attack itself may then delegate to:

- WeaponAttackFlow;
- TechAttackFlow;
- other native attack flow.

—

# 42. Core Power AoEs

Core Powers may include:

- Line;
- Cone;
- Blast;
- Burst.

These should reuse the shared architecture documented in:

`docs/aoe.md`.

Conceptually:

Core Power execution
→ structured AoE
→ native WeaponRangeTemplate
→ native target acquisition
→ attack/save/automatic resolver.

Do not create Core-specific AoE geometry.

—

# 43. Core Power Save AoEs

If a Core Power uses an AoE save:

native generic multi-target save automation is incomplete.

Therefore Frame Conn should use:

native AoE geometry
+
Frame Conn save orchestration.

The Core Power remains the source of:

- save type;
- Save Target;
- consequence.

—

# 44. Core Power Status Effects

Core Powers may apply/remove statuses or conditions.

These should use the shared native status architecture documented in:

`docs/lancer-status-effects.md`.

Conceptually:

Core effect
→ Frame Conn/source rules
→ native status adapter
→ Foundry/Lancer ActiveEffect.

—

# 45. Core Power Movement Effects

Core Powers may grant:

- Boost-like movement;
- Teleport;
- Fly;
- special movement.

These should reuse the shared movement architecture rather than Core-specific token mutation.

—

# 46. Core Power Reactions

A Core System may grant a Reaction.

Its action should be normalized through the same actor-owned action discovery used for other Reaction sources.

Reaction timing/legality belongs to the central Reaction system.

—

# 47. Core Power Protocols

A Core System may grant a Protocol.

If the Core action has:

`activation = Protocol`

Frame Conn should expose it during the start-of-turn Protocol window.

The mechanical activation should use the appropriate native entry point.

Do not create a Core-specific Protocol engine.

—

# 48. Core Power Quick Actions

Core System passive/active actions may use:

`Quick`

or:

`Quick Tech`.

These should appear in the corresponding Frame Conn action categories.

Their source remains the Frame/Core System.

—

# 49. Core Power Full Actions

Core System actions may use:

`Full`

or:

`Full Tech`.

Frame Conn should spend the appropriate action budget while preserving exact source identity.

—

# 50. Core Power Free Actions

Free actions granted by Core Systems should use Frame Conn’s shared Free Action architecture.

They should not consume ordinary Quick/Full budget.

—

# 51. Core Power Special Actions

Some Core content may not fit ordinary activation types.

Frame Conn should preserve the native activation metadata and create source-specific orchestration only where necessary.

Do not force every Core action into a weapon-shaped execution path.

—

# 52. Core Active and Action Availability

Some `active_actions` may logically be available only while:

`core_active = true`.

Frame Conn should research whether native sheet/action rendering automatically filters these.

If not:

Frame Conn’s actor-owned action registry may need to conditionally expose active actions based on Core Active state.

—

# 53. Passive Action Availability

Passive actions should generally be discoverable whenever the Frame/Core System is equipped and otherwise legal.

They should not depend on remaining CP unless their own rules say so.

—

# 54. CP Availability UI

Frame Conn can read:

`actor.system.core_energy`

for presentation.

Conceptually:

CP 1
→ Core Active available

CP 0
→ Core Active spent.

However, execution should still delegate to native CoreActiveFlow for authoritative validation.

—

# 55. Do Not Trust UI CP State Alone

Between rendering and execution:

- CP may be spent elsewhere;
- actor may change;
- Full Repair may occur;
- Frame may change.

Therefore Frame Conn should re-resolve the actor and Frame before executing CoreActiveFlow.

—

# 56. Core Active Execution Button

The primary CP-spending Core Power should use a non-d20 execute control unless its specific mechanical resolution requires a roll.

Conceptually:

`CORE POWER                                 [execute]`

CoreActiveFlow may then lead to:

- attack;
- save;
- deployment;
- mode activation;

depending on the Frame.

—

# 57. Action Economy Is Not Fully Native

CoreActiveFlow contains the same familiar TODO around deducting action economy from the actor tracker.

Therefore Frame Conn must own:

- Protocol/Quick/Full/etc. expenditure;
- duplicate-action legality;
- timing;
- committed-plan state.

Native CoreActiveFlow owns CP and action-specific item mechanics.

—

# 58. Core Power Ownership Split

**FRAME CONN OWNS:**

- Core System discovery;
- player-facing Core Power UI;
- current actor/Frame resolution;
- action-category placement;
- action-economy legality;
- committed-plan state;
- exact source/action-path identity;
- invocation of native CoreActiveFlow;
- persistent Core Active lifecycle when native runtime is incomplete;
- active-action availability;
- source-specific missing automation;
- presentation refresh.

**NATIVE LANCER OWNS:**

- Frame Core System data;
- `core_energy`;
- `core_active` data field;
- CoreActiveFlow;
- CP validation;
- CP consumption;
- generic ActivationFlow mechanics;
- passive bonus resolution;
- active bonus resolution while `core_active`;
- Full Repair CP restoration;
- Full Repair `core_active` reset;
- native chat/item mutation.

—

# 59. Proposed Primary Core Activation Flow

CORE POWER
→ Frame Conn resolves authoritative mech
→ resolve equipped Frame
→ resolve `frame.system.core_system`
→ read structured activation type
→ validate Frame Conn action economy
→ verify presentation CP state
→ preserve exact Frame + Core path
→ execute
→ native-system adapter calls:
  `frame.beginCoreActiveFlow(“system.core_system”)`
→ native CoreActiveFlow
→ native CP validation
→ generic activation checks
→ self Heat/item mutation where applicable
→ CP consumed
→ native chat output
→ await native completion
→ Frame Conn re-reads actor/Frame state
→ determine whether persistent Core Active state is required
→ if required:
   enable `system.core_active`
→ refresh actor bonuses/actions/UI.

—

# 60. Persistent Core Active Enabling

If the Core Power establishes a persistent active mode:

Frame Conn may need to perform:

`actor.update({ “system.core_active”: true })`

after successful CoreActiveFlow.

This should happen only after:

- native activation succeeds;
- CP is consumed;
- the source Core Power is confirmed to require persistent active state.

—

# 61. Persistent Core Active Must Not Precede Native Success

Wrong:

set `core_active = true`
→ call CoreActiveFlow
→ CoreActiveFlow fails because no CP.

Correct:

CoreActiveFlow succeeds
→ then enable persistent Core Active state if applicable.

This prevents native bonuses from turning on after failed activation.

—

# 62. Core Active Expiration

When the Core Active’s actual duration ends:

Frame Conn should perform:

`core_active = false`

if no other rule requires the active Core state to remain enabled.

This should cause native Frame bonus resolution to stop including active bonuses.

—

# 63. Core Active Expiration Must Be Source-Specific

Potential expiration triggers include:

- end of scene;
- end of combat;
- end of turn;
- manual termination;
- special condition;
- Full Repair.

Do not use one universal timer for every Frame.

—

# 64. Full Repair Reconciliation

Native Full Repair already performs:

`core_energy = 1`

and:

`core_active = false`.

After Full Repair:

Frame Conn should re-read actor state.

Do not independently duplicate those mutations unless needed for synchronization.

—

# 65. Frame Replacement

If the mech’s equipped Frame changes:

Core System discovery must update.

Do not keep Core actions from the previous Frame in the action registry.

The authoritative source is the currently equipped Frame item.

—

# 66. Core Active State and Frame Replacement

If `core_active = true` and the Frame changes through unusual editing:

Frame Conn should reconcile the state safely.

Do not assume a Core Active from Frame A should apply Frame B’s active bonuses.

This is an edge case worth guarding.

—

# 67. Actor Rebind

If Frame Conn opens for a different mech:

Core Power state must derive from that mech’s:

- equipped Frame;
- `core_energy`;
- `core_active`.

Do not carry local Core state between actors.

—

# 68. Passive Bonus Discovery

Native Frame bonus resolution already exposes passive Core bonuses.

Frame Conn does not need a separate passive-bonus engine merely to display/use them.

However, future UI may inspect them for explanation.

—

# 69. Active Bonus Discovery

When `core_active = true`, native Frame bonus resolution includes active bonuses.

This can automatically affect native:

- attack calculations;
- HASE checks;
- other structured bonus consumers;

depending on the bonus definitions.

This is a major reason to use the native state rather than manually applying individual bonuses.

—

# 70. Structured Bonus First Principle

For Core Systems:

1. prefer native passive/active bonuses;
2. prefer structured actions;
3. prefer native tags/ranges/effects;
4. add explicit Frame Conn adapters for missing behavior;
5. parse prose only as a last resort.

This should be the general actor-owned feature integration principle.

—

# 71. Core Actions and Generic Actor-Owned Action Registry

Core System actions should feed the same normalized action registry as:

- Mounted Systems;
- Mech Traits;
- Pilot Talents;
- Manufacturer Core Bonuses.

This prevents Core Power integration from becoming a separate monolithic feature.

—

# 72. Suggested Normalized Core Action Record

Conceptually:

{
  sourceKind,
  sourceItemUuid,
  actionPath,
  label,
  activationType,
  sourceCoreSide,
  requiresCoreActive,
  spendsCorePower,
  executionStrategy
}

Exact schema belongs to the Actions refactor.

The key requirement is preserving enough identity to execute the native action later.

—

# 73. Primary Active Has Special Execution Strategy

The primary CP-spending Core activation should use:

`CoreActiveFlow`

rather than generic ActivationFlow.

Therefore normalized action discovery must distinguish:

primary Core Active

from:

ordinary Core sub-action.

—

# 74. Core Sub-Actions May Use Generic ActivationFlow

Where a passive/active Core sub-action is ordinary native `ActionData`, the appropriate execution path may be:

`item.beginActivationFlow(actionPath)`

rather than:

`beginCoreActiveFlow`.

Do not consume CP for every Core System action merely because its source is the Frame.

—

# 75. Core Actions May Use Other Native Flows

Some Core actions may ultimately resolve through:

- WeaponAttackFlow;
- TechAttackFlow;
- StatRollFlow;
- SystemFlow;
- ActivationFlow;
- AoE adapters.

The normalized action’s execution strategy should determine the downstream native route.

—

# 76. Core Power and Damage

If a Core Power causes damage:

Frame Conn should route final typed damage through native:

`LancerActor.damageCalc(...)`

where practical.

This preserves:

- Armor;
- Resistance;
- Exposed;
- Shredded;
- Overshield;
- other native damage logic.

—

# 77. Core Power and Statuses

If a Core Power applies:

- Invisible;
- Shredded;
- Slowed;
- Jammed;
- etc.

Frame Conn should apply native statuses through the shared status adapter.

Native downstream consumers then work automatically where implemented.

—

# 78. Core Power and Friendly Fire

If a Core Power creates an AoE:

friendly fire should remain the default unless the Core Power explicitly excludes allies.

Use the shared AoE exclusion architecture.

—

# 79. Core Power and Target Selection

Core actions may require:

- no target;
- self;
- one target;
- multiple targets;
- template placement.

Targeting should belong to the action’s structured/mechanical execution strategy.

Do not impose one universal Core Power target model.

—

# 80. Core Power and Save Effects

If Core action data contains a save:

Frame Conn may need to orchestrate the save if native ActivationFlow does not.

This is especially relevant to:

- Burst;
- Blast;
- Line;
- Cone;

save effects.

Reuse the shared save/AoE subsystem.

—

# 81. Core Power and Persistent Transformations

Some Core Actives may substantially alter the mech for the rest of a scene.

These are prime consumers of:

`core_active`.

Frame Conn should turn on the native state and allow:

`active_bonuses`

to enter native bonus calculation automatically.

Any non-bonus transformation rules still need source-specific handling.

—

# 82. Core Power and Temporary Weapons

Some Core Systems may create or enable integrated weapons.

Trace whether these are represented through:

- `integrated`;
- active actions;
- active bonuses;
- temporary item state.

Do not manufacture duplicate weapons until native representation is understood.

—

# 83. Core Power and Deployables

If the Core Active creates a deployable:

CoreActiveFlow may not automatically handle placement.

The deployable’s native representation and placement flow should be traced separately.

Frame Conn can then call the correct native deployable entry point.

—

# 84. Core Power and Limited / Charged

Because CoreActiveFlow inherits ActivationFlow:

native Limited/Charged checks may participate where applicable.

Frame Conn should not pre-decrement or pre-toggle those resources.

—

# 85. Core Power and Self Heat

CoreActiveFlow inherits native self-Heat processing.

Therefore if the Core action has structured Heat cost:

native flow should own that mutation.

Frame Conn must not apply it a second time.

—

# 86. Core Power and Destroyed Source

CoreActiveFlow inherits source-item destruction checks.

Therefore Frame Conn can use source state for UI hints but should rely on native execution-time revalidation.

—

# 87. Core Power and Protocol Timing

If:

`core_system.activation === Protocol`

Frame Conn should:

- expose the Core Active during Protocol window;
- validate start-of-turn timing;
- spend/close Protocol state;
- execute native CoreActiveFlow.

Native CoreActiveFlow still owns CP.

—

# 88. Core Power and Quick Action Timing

If the Core Active is Quick:

Frame Conn spends one Quick Action.

Native flow spends CP.

Do not let native action tracker TODO lead to untracked Frame Conn action economy.

—

# 89. Core Power and Full Action Timing

If the Core Active is Full:

Frame Conn spends the Full Action.

Native flow spends CP.

The same separation applies.

—

# 90. Core Power and Free Action Timing

If the Core Active is Free:

Frame Conn should treat it as a Free Action under central legality.

Native flow still performs CP validation/consumption.

—

# 91. Core Power and Reaction Timing

If a Core action is a Reaction:

the shared Reaction architecture should determine trigger and Reaction legality.

The Core System remains merely the source.

—

# 92. Core Power and Prepare

Only legal Quick Actions can ordinarily be Prepared.

If a Core sub-action is Quick and otherwise legal:

Prepare may store it as a child action.

If it is the CP-spending primary Core Active:

the delayed child execution must preserve the CoreActiveFlow strategy so CP is spent when the prepared action actually resolves according to the rules.

This interaction should be verified carefully.

—

# 93. Core Power and Overcharge

An Overcharge-granted Quick Action can fund a Quick Core action where legal.

Overcharge owns the extra Quick slot.

CoreActiveFlow owns CP.

These resources must remain independent.

—

# 94. Core Power and Shutdown/Stunned/Jammed

Core action legality should use central condition rules.

Examples:

Stunned mech
→ cannot activate Core actions.

Jammed mech
→ Tech-type Core actions may be prohibited.

Shutdown
→ action availability follows Shutdown/Stunned state.

Do not code these separately inside CorePower UI.

—

# 95. Native Core Active Bonus Consumer Is Valuable

The central advantage of `core_active` is:

Frame Conn does not need to know every bonus mechanically.

If the Frame defines them structurally:

`core_active = true`
→ native bonus resolver sees them.

This is precisely the kind of native-system leverage Frame Conn should prefer.

—

# 96. `core_active` Should Be Treated as Native State

Unlike `system.statuses.*`, `core_active` is an actual persistent actor schema field.

Therefore it can legitimately be updated with:

`actor.update(...)`

when the Core Active lifecycle requires it.

This is different from derived ActiveEffect-driven status booleans.

—

# 97. Do Not Represent Core Active as a Fake Status

Core Active state already has:

`actor.system.core_active`.

Do not create a synthetic:

`core_active`

Foundry status solely to track mechanics.

A visual marker could exist separately if desired, but native actor state should remain authoritative.

—

# 98. Core Active Presentation

Frame Conn can derive UI such as:

CP AVAILABLE

CORE ACTIVE

CORE SPENT

from:

`core_energy`
+
`core_active`.

These are separate display dimensions.

Possible states include:

CP 1 / inactive

CP 0 / inactive

CP 0 / active.

Do not assume CP spent always means `core_active = true`.

—

# 99. Instantaneous Core Power Example State

Conceptually:

before:
CP = 1
core_active = false

activate instantaneous Core Power:
→ CoreActiveFlow
→ CP = 0

after:
CP = 0
core_active = false.

This is valid.

—

# 100. Persistent Core Power Example State

Conceptually:

before:
CP = 1
core_active = false

activate persistent Core Power:
→ CoreActiveFlow
→ CP = 0
→ Frame Conn sets core_active = true

during mode:
CP = 0
core_active = true

expiration:
→ core_active = false

CP remains:
0

until Full Repair.

This distinction is fundamental.

—

# 101. Full Repair Example State

Regardless of prior persistent state:

Full Repair
→ CP = 1
→ core_active = false.

Frame Conn should refresh and clear any supplemental Core Active lifecycle metadata accordingly.

—

# 102. Native Chat Output

CoreActiveFlow prints native action-use output.

Frame Conn should preserve that in the first implementation.

Do not emit duplicate generic Core Power chat output unless supplemental automation needs an additional concise result.

—

# 103. Execution Completion

Frame Conn should mark the committed Core Power executed only after native CoreActiveFlow resolves successfully.

If the flow fails because CP is unavailable:

→ do not falsely complete mechanical execution.

—

# 104. Execution Guard

CP-consuming Core Active execution should be protected against double-click/race conditions.

Otherwise two simultaneous calls could potentially produce inconsistent state.

Conceptually:

planned
→ executing
→ executed.

Disable execute while native flow is pending.

—

# 105. Revalidation at Execution

Before execution:

- re-resolve actor;
- re-resolve equipped Frame;
- re-resolve Core System;
- confirm action path;
- confirm action activation;
- confirm legal action economy.

Then invoke native CoreActiveFlow.

Do not trust stale UI snapshots.

—

# 106. Native CP Revalidation Remains Final

Even after Frame Conn checks:

`core_energy > 0`

native CoreActiveFlow should still perform its own CP validation.

This gives us defense against stale state.

—

# 107. Immediate Repository Research TODO

- [ ] Trace `CoreActiveFlow` return/cancellation behavior.
- [ ] Trace all Core System `active_actions` rendering/execution.
- [ ] Trace all Core System `passive_actions` rendering/execution.
- [ ] Determine whether active actions are automatically hidden when `core_active` is false.
- [ ] Trace Core System deployables.
- [ ] Trace Core System integrated equipment.
- [ ] Trace Core-specific attack helpers.
- [ ] Trace Core-specific tech helpers.
- [ ] Trace structured save data in Core actions.
- [ ] Trace structured AoE data in Core actions.
- [ ] Trace effect duration metadata useful for Core Active lifecycle.

—

# 108. Core Active Classification TODO

- [ ] Survey stock Frame Core Systems.
- [ ] Identify instantaneous Core Actives.
- [ ] Identify persistent Core Actives.
- [ ] Determine whether persistent examples always have `active_bonuses`.
- [ ] Determine whether `active_actions` imply persistent active mode.
- [ ] Determine whether lifecycle is structured anywhere.
- [ ] Avoid prose classification if structured metadata is sufficient.
- [ ] Define explicit per-Core adapter only where necessary.

—

# 109. Action Discovery TODO

- [ ] Add equipped Frame as actor-owned action source.
- [ ] Discover primary Core Active.
- [ ] Discover passive actions.
- [ ] Discover active actions.
- [ ] Preserve exact action paths.
- [ ] Preserve activation types.
- [ ] Preserve Core passive/active side.
- [ ] Preserve whether CP is spent.
- [ ] Preserve whether `core_active` is required.
- [ ] Refresh discovery when Frame changes.
- [ ] Refresh active actions when `core_active` changes.

—

# 110. Native Adapter TODO

- [ ] Add Core System discovery helper.
- [ ] Add `getCoreEnergy(actor)`.
- [ ] Add `isCoreActive(actor)`.
- [ ] Add primary Core Active executor.
- [ ] Wrap `frame.beginCoreActiveFlow(...)`.
- [ ] Add `setCoreActive(actor, active)`.
- [ ] Re-read actor after mutation.
- [ ] Avoid duplicate CP mutation.
- [ ] Keep action-economy handling outside adapter.

—

# 111. Persistent Core Active TODO

- [ ] Define persistent Core Active metadata.
- [ ] Enable `core_active` after successful applicable activation.
- [ ] Disable on correct lifecycle event.
- [ ] Reconcile Full Repair.
- [ ] Reconcile actor/frame replacement.
- [ ] Preserve native active bonus calculation.
- [ ] Avoid enabling for instantaneous Core Powers.
- [ ] Avoid removing unrelated source effects when active mode ends.

—

# 112. Action Economy TODO

- [ ] Use `core_system.activation`.
- [ ] Route Protocol Core Active through Protocol window.
- [ ] Route Quick Core Active through Quick budget.
- [ ] Route Full Core Active through Full budget.
- [ ] Route Free Core Active through Free Action rules.
- [ ] Route Reaction Core actions through Reaction system.
- [ ] Do not rely on CoreActiveFlow’s unimplemented action-tracker deduction.
- [ ] Revalidate action legality before native execution.

—

# 113. AoE Integration TODO

- [ ] Reuse `docs/aoe.md`.
- [ ] Discover structured Core AoE geometry.
- [ ] Use native WeaponRangeTemplate.
- [ ] Preserve friendly fire by default.
- [ ] Resolve attack AoEs through native multi-target attack flow.
- [ ] Resolve save AoEs through Frame Conn save resolver.
- [ ] Resolve automatic AoEs through native status/damage adapters.
- [ ] Apply Core-specific ally exemptions only where stated.

—

# 114. Status Integration TODO

- [ ] Reuse `docs/lancer-status-effects.md`.
- [ ] Apply native statuses for Core effects.
- [ ] Preserve native downstream consumers.
- [ ] Add missing lifecycle rules.
- [ ] Preserve source/origin metadata.
- [ ] Avoid direct mutation of derived `system.statuses.*`.

—

# 115. Damage Integration TODO

- [ ] Route Core damage through native `damageCalc(...)`.
- [ ] Preserve damage types.
- [ ] Preserve AP/Paracausal.
- [ ] Preserve Exposed/Shredded native behavior.
- [ ] Avoid duplicate damage modifiers.
- [ ] Handle shared AoE damage rules correctly.

—

# 116. Smoke Test — CP Resource

- [ ] fresh/full-repaired mech has CP = 1.
- [ ] Core Active succeeds with CP available.
- [ ] native CoreActiveFlow consumes CP.
- [ ] CP becomes 0 exactly once.
- [ ] second CP activation rejected natively.
- [ ] Frame Conn displays spent state.
- [ ] Full Repair restores CP to 1.

—

# 117. Smoke Test — Core Active State

- [ ] instantaneous Core Active leaves `core_active` false.
- [ ] persistent Core Active sets `core_active` true.
- [ ] active bonuses become available natively.
- [ ] passive bonuses remain active throughout.
- [ ] expiration sets `core_active` false.
- [ ] active bonuses cease afterward.
- [ ] Full Repair sets `core_active` false.
- [ ] no persistent mode survives incorrectly.

—

# 118. Smoke Test — Action Economy

- [ ] Protocol Core Power respects Protocol timing.
- [ ] Quick Core Power spends correct Quick slot.
- [ ] Full Core Power spends Full Action.
- [ ] Free Core action does not spend Quick/Full.
- [ ] CoreActiveFlow does not create duplicate action expenditure.
- [ ] CP expenditure and action expenditure remain independent.

—

# 119. Smoke Test — Actor-Owned Actions

- [ ] passive actions discovered.
- [ ] active actions discovered.
- [ ] action path preserved.
- [ ] primary Core Active distinguished from sub-actions.
- [ ] passive action does not spend CP accidentally.
- [ ] active sub-action does not spend CP again accidentally.
- [ ] active-only action availability tracks `core_active`.
- [ ] Frame replacement refreshes action set.

—

# 120. Smoke Test — Native Integration

- [ ] CoreActiveFlow native chat output appears.
- [ ] self Heat handled natively.
- [ ] Limited/Charged checks remain native.
- [ ] source destroyed validation remains native.
- [ ] actor refreshed after execution.
- [ ] double-click cannot consume CP twice.
- [ ] failed native flow does not enable persistent Core Active state.

—

# 121. Important Invariants

**Invariant 1**

Core Systems belong to the equipped Frame item.

**Invariant 2**

Native CP authority is `actor.system.core_energy`.

**Invariant 3**

Native persistent Core Active authority is `actor.system.core_active`.

**Invariant 4**

`core_energy` and `core_active` represent different concepts.

**Invariant 5**

A native `CoreActiveFlow` exists.

**Invariant 6**

Primary CP-spending Core activation should use `item.beginCoreActiveFlow(...)`.

**Invariant 7**

Native CoreActiveFlow validates and consumes CP.

**Invariant 8**

Frame Conn must not duplicate CP consumption.

**Invariant 9**

Native Full Repair restores CP and clears `core_active`.

**Invariant 10**

Native Frame bonus resolution automatically includes active bonuses while `core_active` is true.

**Invariant 11**

CoreActiveFlow does not currently set `core_active = true`.

**Invariant 12**

Frame Conn should bridge persistent Core Active state only for Core Powers that actually establish an ongoing active mode.

**Invariant 13**

Instantaneous Core Powers may spend CP while leaving `core_active` false.

**Invariant 14**

Action economy remains Frame Conn-owned because CoreActiveFlow does not deduct it completely.

**Invariant 15**

Core passive and active actions should feed the shared actor-owned action registry.

**Invariant 16**

Core AoEs, statuses, attacks, saves, movement, and reactions should reuse shared Frame Conn/native subsystems rather than Core-specific duplicates.

—

# 122. Final Working Model

FRAME CORE SYSTEM
│
├── Native Frame Item
│   └── `frame.system.core_system`
│
├── PASSIVE
│   │
│   ├── passive effect
│   ├── passive bonuses
│   │   └── native bonus engine always includes
│   └── passive actions
│       └── shared actor-owned action registry
│
├── CORE POWER RESOURCE
│   │
│   └── `actor.system.core_energy`
│       ├── 1 = available
│       └── 0 = spent
│
├── PRIMARY CORE ACTIVE
│   │
│   ├── structured activation type
│   ├── Frame Conn action-economy validation
│   └── Native:
│       └── `frame.beginCoreActiveFlow(“system.core_system”)`
│           ├── initialize activation
│           ├── destroyed check
│           ├── Limited check
│           ├── Charged check
│           ├── CP check
│           ├── self Heat
│           ├── item mutation
│           ├── consume CP
│           └── native chat output
│
├── PERSISTENT CORE ACTIVE
│   │
│   ├── native field:
│   │   └── `actor.system.core_active`
│   │
│   ├── native CoreActiveFlow does NOT enable it
│   │
│   ├── Frame Conn determines whether active mode persists
│   │
│   ├── if persistent:
│   │   └── `core_active = true`
│   │
│   └── native bonus engine then includes:
│       ├── passive bonuses
│       └── active bonuses
│
├── ACTIVE SUB-ACTIONS
│   │
│   └── `core_system.active_actions`
│       ├── preserve activation type
│       ├── preserve exact action path
│       └── shared actor-owned execution architecture
│
├── SHARED MECHANICAL SUBSYSTEMS
│   │
│   ├── attacks → native attack flows
│   ├── AoE → `docs/aoe.md`
│   ├── statuses → `docs/lancer-status-effects.md`
│   ├── saves → shared Frame Conn save resolver
│   ├── movement → shared Movement feature
│   └── reactions/protocols → shared action architecture
│
└── FULL REPAIR
    └── Native Lancer
        ├── `core_energy = 1`
        └── `core_active = false`

The critical architectural rule is:

**Native Lancer already owns Core Power data, CP spending, CP restoration, and the mechanical consumption of persistent Core Active bonuses. Frame Conn should own the missing orchestration: action economy, actor-owned action presentation, and the runtime lifecycle that turns `core_active` on and off when a particular Core Power actually establishes an ongoing active mode.**
