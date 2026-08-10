# Mech Traits
const fs = require(“fs”);

const content = String.raw`# Lancer Mech Frame Traits — Native Repository Integration Notes

## Status

**Native Frame trait data:** Found.

**Native structured trait bonuses:** Found.

**Native structured trait counters:** Found.

**Native structured trait integrated equipment:** Found.

**Native structured trait deployables:** Found.

**Native structured trait actions:** Found.

**Native structured trait synergies:** Found.

**Native trait \`use\` field:** Found.

**Native ActionData activation type:** Found.

**Native ActionData frequency field:** Found.

**Native frequency enums:** Found.

**Native FrameEffectUse duration enum:** Found.

**Native Frame trait chat presentation:** Found.

**Native generic ActivationFlow for structured trait actions:** Found.

**Native automatic trait bonus consumption:** Found.

**Native dedicated TraitFlow:** Not found.

**Native generic ActionData frequency tracking:** Not found.

**Native 1/turn tracking for trait actions:** Not found.

**Native 1/round tracking for trait actions:** Not found.

**Native 1/scene tracking for trait actions:** Not found.

**Native 1/mission tracking for trait actions:** Not found.

**Native trait effect-duration lifecycle tracking:** Not found.

**Native special-rule execution for arbitrary trait prose:** Not found.

**Native action-economy deduction through ActivationFlow:** Not implemented.

**Frame Helm requirement:** Discover structured Frame traits and their actions from the equipped Frame, preserve native bonuses and generic ActivationFlow execution where useful, and provide the missing generalized usage-frequency, action-economy, effect-lifecycle, and special-rule orchestration.

—

# 1. Purpose

This document records the native Foundry Lancer architecture for mech Frame traits and identifies the mechanical gaps Frame Helm must fill.

Frame traits are not merely descriptive text.

The native Frame schema allows traits to contain structured:

- bonuses;
- counters;
- integrated equipment;
- deployables;
- actions;
- synergies;
- usage/duration metadata.

Therefore Frame Helm should treat mech traits as a first-class actor-owned feature source.

The central finding is:

> Native Lancer models Frame traits richly, but does not provide a dedicated TraitFlow or a general runtime tracker for ActionData frequency.

This means traits such as the Everest’s Initiative can already tell Frame Helm that they grant a Free Action with a 1/scene frequency, but native Foundry does not appear to remember that the action has already been used.

—

# 2. Frame Trait Ownership

Mech traits belong to the equipped Frame item.

The native structure is conceptually:

\`frame.system.traits[]\`

Therefore trait discovery should begin from:

mech
→ equipped Frame
→ \`frame.system.traits[]\`.

Do not create duplicate actor items merely to represent Frame traits.

—

# 3. Native Frame Trait Schema

Each Frame trait structurally contains fields equivalent to:

\`\`\`ts
traits: new fields.ArrayField(
  new fields.SchemaField({
    name: new fields.StringField(),
    description: new fields.HTMLField(),
    bonuses: new fields.ArrayField(new BonusField()),
    counters: new fields.ArrayField(new CounterField()),
    integrated: new fields.ArrayField(new LIDField()),
    deployables: new fields.ArrayField(new LIDField()),
    actions: new fields.ArrayField(new ActionField()),
    synergies: new fields.ArrayField(new SynergyField()),
    use: new fields.StringField({
      nullable: true,
      initial: null
    }),
  })
)
\`\`\`

This establishes that Frame traits are intended to participate in native mechanical systems.

—

# 4. Imported Trait Data Preserves Structure

LCP import preserves the trait’s structured content.

Conceptually:

\`\`\`ts
traits: data.traits?.map(t => ({
  actions: t.actions?.map(unpackAction) ?? [],
  bonuses: t.bonuses?.map(unpackBonus) ?? [],
  counters: t.counters?.map(unpackCounter) ?? [],
  deployables:
    t.deployables?.map(d => unpackDeployable(d, context)) ?? [],
  description: t.description,
  integrated: t.integrated ?? [],
  name: t.name,
  synergies: t.synergies?.map(unpackSynergy) ?? [],
  use: restrict_enum(
    FrameEffectUse,
    FrameEffectUse.Unknown,
    t.use
  ),
}))
\`\`\`

Therefore Frame Helm should prefer structured trait data over parsing trait prose.

—

# 5. Trait Data Categories

A Frame trait can conceptually provide:

FRAME TRAIT
│
├── descriptive rules text
├── bonuses[]
├── counters[]
├── integrated[]
├── deployables[]
├── actions[]
├── synergies[]
└── use

These categories should remain distinct.

A trait may use one or several of them.

—

# 6. Native Trait Bonuses

Frame trait bonuses are already consumed by native Lancer bonus machinery.

The Frame item collects structured:

\`trait.bonuses\`

from its traits.

Therefore Frame Helm should not manually reproduce structured trait bonuses.

Correct:

trait defines structured bonus
→ native Frame bonus machinery consumes bonus
→ native rolls/checks receive it where supported.

—

# 7. Avoid Double Trait Bonuses

Wrong:

Frame Helm manually applies trait bonus
+
native Frame bonus machinery applies same structured bonus.

Correct:

Frame Helm preserves native trait state
→ native bonus machinery remains authoritative.

Only add custom automation where the trait’s effect is not represented structurally.

—

# 8. Structured Trait Actions

Frame traits may contain:

\`actions[]\`.

These are native structured ActionData entries.

Therefore some trait-granted actions can be discovered without parsing their descriptions.

Conceptually:

Frame
→ trait
→ actions[]
→ ActionData
→ activation/frequency/mechanical metadata.

—

# 9. Native ActionData Frequency

ActionData includes a structured:

\`frequency\`

field.

The native frequency model recognizes concepts including:

- unlimited;
- 1/turn;
- 1/round;
- 1/scene;
- 1/encounter;
- 1/mission.

Conceptually:

\`\`\`ts
enum Frequency {
  Unlimited = “unlimited”,
  Round = “1/round”,
  Turn = “1/turn”,
  Scene = “1/scene”,
  Encounter = “1/encounter”,
  Mission = “1/mission”,
}
\`\`\`

This is highly valuable for Frame Helm.

—

# 10. Frequency Should Remain Structured

If a trait action says:

\`1/scene\`

and its ActionData frequency is:

\`Frequency.Scene\`

Frame Helm should use the structured frequency.

Do not derive frequency by searching the description for:

“1/scene”.

Prose parsing should be a fallback only when structured data is absent.

—

# 11. Native Frequency Tracking Is Missing

The repository trace found no general runtime consumer that turns:

\`action.frequency\`

into persistent usage state for ordinary Frame trait actions.

In particular, generic ActivationFlow does not contain steps equivalent to:

- checkActionFrequency;
- consumeActionFrequency;
- resetTurnFrequency;
- resetRoundFrequency;
- resetSceneFrequency;
- resetMissionFrequency.

Therefore the existence of:

\`frequency = 1/scene\`

does not itself prevent repeated native activation.

—

# 12. Generic ActivationFlow Does Not Enforce Frequency

The generic ActivationFlow sequence is conceptually:

\`initActivationData\`

→

\`checkItemDestroyed\`

→

\`checkItemLimited\`

→

\`checkItemCharged\`

→

\`applySelfHeat\`

→

\`updateItemAfterAction\`

→

\`printActionUseCard\`.

There is no general:

\`checkActionFrequency\`

or:

\`consumeActionFrequency\`

step.

This is a central native automation gap.

—

# 13. Limited and Frequency Are Different Systems

Do not confuse:

Limited item uses

with:

ActionData frequency.

A Limited system may have persistent native item-use state.

An action with:

\`frequency = 1/scene\`

does not appear to receive equivalent native runtime tracking.

Frame Helm needs to preserve this distinction.

—

# 14. No Dedicated TraitFlow Found

The trace found no native:

\`TraitFlow\`

equivalent to:

- CoreActiveFlow;
- WeaponAttackFlow;
- TechAttackFlow;
- other specialized native flows.

Frame traits instead use a combination of:

- native passive bonus machinery;
- simple trait chat presentation;
- generic ActivationFlow for structured actions;
- structured data not fully consumed at runtime.

—

# 15. Native Trait Chat Path

The Frame trait chat button follows a presentation-oriented path conceptually equivalent to:

Frame Trait chat button
→ \`beginItemChatFlow(frame, { type: “trait”, index })\`
→ SimpleTextFlow
→ trait name and description
→ chat.

This is not mechanical trait execution.

It does not:

- consume frequency;
- track scene usage;
- grant special action economy;
- execute arbitrary trait rules.

—

# 16. Trait Chat Is Not Trait Execution

Frame Helm should not treat:

SimpleTextFlow

as the authoritative mechanical execution flow for a trait.

It is useful for native presentation/chat output.

Mechanical trait actions require additional orchestration.

—

# 17. Structured Trait Action Rendering

The native mech sheet separately renders trait:

\`actions[]\`

using the normal action-array infrastructure.

Conceptually:

\`\`\`ts
buildActionArrayHTML(
  frame,
  \`system.traits.\${index}.actions\`
)
\`\`\`

These actions can therefore participate in generic native activation.

—

# 18. Native Structured Trait Action Path

A trait action can conceptually have an exact path such as:

\`system.traits.0.actions.0\`

Frame Helm should preserve that exact path.

Do not reconstruct trait action identity from:

- displayed label;
- trait name;
- action name alone.

—

# 19. Generic Trait Action Execution

Where appropriate, a structured trait action may execute through:

\`frame.beginActivationFlow(actionPath)\`.

Conceptually:

Frame trait
→ structured action
→ exact action path
→ generic ActivationFlow
→ native checks/mutations/chat where supported.

Frame Helm should reuse this native path rather than replacing it unnecessarily.

—

# 20. Generic ActivationFlow Is Only Partial Execution

Using ActivationFlow does not mean all trait mechanics are implemented.

It can provide generic activation behavior, but it does not inherently understand arbitrary rules such as:

“Take any Quick Action as a Free Action.”

Therefore Frame Helm needs source-specific execution strategies for special trait semantics.

—

# 21. Trait Activation Type

Structured trait ActionData includes its activation type.

This may identify the action as:

- Protocol;
- Quick;
- Full;
- Free;
- Reaction;
- other native categories.

Frame Helm should use the structured activation type for action-category placement.

Do not parse it from prose where structured data exists.

—

# 22. Native FrameEffectUse

Frame traits also contain a separate:

\`use\`

field based on:

\`FrameEffectUse\`.

The enum includes concepts equivalent to:

\`\`\`ts
enum FrameEffectUse {
  Turn = “Turn”,
  NextTurn = “Next Turn”,
  Round = “Round”,
  NextRound = “Next Round”,
  Scene = “Scene”,
  Encounter = “Encounter”,
  Mission = “Mission”,
  Unknown = “?”,
}
\`\`\`

Repository comments associate this concept with Core/trait usage duration.

—

# 23. Frequency and Use Must Not Be Conflated

These fields represent different concepts.

Conceptually:

ACTION FREQUENCY
\`action.frequency\`
→ how often may this action be activated?

TRAIT EFFECT USE/DURATION
\`trait.use\`
→ lifecycle/duration associated with the trait effect.

Frame Helm should model these separately.

—

# 24. Native Trait Use Lifecycle Is Missing

The repository trace found no general runtime consumer that turns:

\`trait.use\`

into automatic effect lifecycle management.

Therefore values such as:

- Turn;
- Round;
- Scene;
- Mission;

are useful structured information, but do not appear to provide complete runtime automation by themselves.

—

# 25. Generalized Actor-Owned Usage Tracking

Frame Helm should not create a separate frequency engine solely for Frame traits.

ActionData frequency is shared across actor-owned feature sources.

A generalized tracker can support:

- Frame Traits;
- Pilot Talents;
- Core System sub-actions;
- Core Bonuses;
- Mounted System actions not represented by native Limited;
- other structured ActionData sources.

—

# 26. Suggested Usage Identity

Usage should be tied to exact action/source identity.

Conceptually:

ActorOwnedActionUsage
{
  actorId,
  sourceItemUuid,
  actionPath,
  frequency,
  usesConsumed,
  scopeIdentity
}

Exact schema is implementation-specific.

The important invariant is:

usage belongs to the exact actor-owned action.

—

# 27. Why Exact Action Identity Matters

Two actions can have identical names while belonging to different sources.

Therefore do not track usage merely as:

\`”Initiative”: used\`.

Prefer:

actor
+
Frame UUID
+
trait index/source identity
+
action path
+
frequency.

—

# 28. Turn Frequency

For:

\`1/turn\`

Frame Helm should prevent additional uses during the same applicable turn after successful consumption.

The use becomes available again according to Lancer turn semantics.

Exact reset timing should be centralized in the usage tracker.

—

# 29. Round Frequency

For:

\`1/round\`

Frame Helm should prevent additional uses during the current round.

The use becomes available when the next round begins.

This should use Foundry combat round state where possible.

—

# 30. Scene Frequency

For:

\`1/scene\`

Frame Helm must persist the consumed state for the current scene/encounter scope.

The action should remain unavailable until the relevant scene lifecycle resets it.

The exact definition of scene reset must follow Lancer rules and campaign workflow rather than assuming Foundry Scene document switching is always equivalent.

—

# 31. Encounter Frequency

The native enum also recognizes:

\`1/encounter\`.

Frame Helm should preserve it as its own frequency value even if scene and encounter often coincide operationally.

Do not collapse distinct native values prematurely.

—

# 32. Mission Frequency

For:

\`1/mission\`

usage persists across turns, rounds, and scenes until the appropriate mission reset.

Full Repair is a likely important lifecycle boundary for many mission resources, but exact Lancer semantics should remain authoritative.

—

# 33. Unlimited Frequency

For:

\`unlimited\`

the usage tracker should not create an artificial consumption lock.

Ordinary action economy and other legality still apply.

—

# 34. Frequency Consumption Timing

A frequency use should be consumed when the trait action successfully executes according to its semantics.

Do not consume merely because:

- the player opens a tray;
- selects the action;
- begins targeting;
- cancels execution.

This mirrors the committed-action execution principles used elsewhere in Frame Helm.

—

# 35. Failed Native Execution

If a trait delegates to a native Flow and that Flow fails or is cancelled before mechanical resolution:

Frame Helm should not falsely consume the frequency use.

Execution completion should be explicit.

—

# 36. Usage State Is Separate From Action Economy

A trait action can simultaneously have:

- activation type;
- frequency.

For example:

Free
+
1/scene.

These answer different questions.

Activation:

What action budget does this use?

Frequency:

How often may this source be used?

Both must be validated.

—

# 37. Usage State Is Separate From Limited

A trait action may be:

Free
+
1/scene

without being:

Limited 1.

Do not manufacture Limited item state merely to track frequency.

Use the generalized action-frequency tracker.

—

# 38. Trait Counters

Frame traits can contain structured:

\`counters[]\`.

These should be traced separately before inventing duplicate Frame Helm counter state.

If native counters already provide persistent mutable state, Frame Helm should reuse them where they match the trait mechanic.

—

# 39. Counters May Solve Some Trait Mechanics

Not every trait with internal state requires the generalized frequency tracker.

If a trait explicitly contains a native counter representing its mechanic:

prefer the native counter.

The frequency tracker should own ActionData frequency, not replace every source-specific state mechanism.

—

# 40. Trait Integrated Equipment

Frame traits may contain:

\`integrated[]\`.

These may grant weapons, systems, or other equipment.

Frame Helm’s actor-owned feature discovery should preserve the trait as the source of that integrated equipment.

Do not create disconnected duplicate equipment semantics.

—

# 41. Trait Deployables

Frame traits may contain:

\`deployables[]\`.

These should use the shared deployable architecture once the native deployable execution path is traced.

Do not create trait-specific token placement if a native deployable path exists.

—

# 42. Trait Synergies

Frame traits may contain:

\`synergies[]\`.

These may encode structured interactions with:

- actions;
- attacks;
- movement;
- other systems.

Frame Helm should preserve these structures for later rules integration.

—

# 43. Trait Special Rules

Some Frame traits cannot be fully expressed by:

- bonuses;
- frequency;
- generic ActionData;
- counters.

These require explicit semantic adapters.

The Everest Initiative is a clear example.

—

# 44. Everest Initiative

The Everest trait reads conceptually:

INITIATIVE

1/scene, the Everest may take any Quick Action as a Free Action.

The important mechanical pieces are:

- source: Everest Frame trait;
- frequency: 1/scene;
- granted action economy: Free;
- child action: any otherwise-legal Quick Action;
- child action does not consume the normal Quick Action budget.

—

# 45. Initiative Is Not Just a Free Action Button

Initiative does not itself perform one fixed effect.

It grants a temporary execution privilege:

choose any Quick Action
→ execute it as a Free Action.

Therefore its Frame Helm flow must support a child-action selection.

—

# 46. Initiative Proposed Flow

INITIATIVE
→ resolve Everest Frame trait
→ resolve structured action/frequency
→ check 1/scene usage
→ validate actor can act
→ begin Initiative execution
→ grant temporary:
  “choose one legal Quick Action”
→ display/select Quick Action
→ resolve selected action normally
→ override parent action-cost payment:
  selected Quick Action is Free
→ preserve all other selected-action restrictions
→ selected action succeeds
→ consume Initiative’s 1/scene use
→ refresh Frame Helm.

—

# 47. Initiative Does Not Change the Child Action’s Identity

If Initiative is used to Skirmish:

the child action is still:

Skirmish.

If Initiative is used to Boost:

the child action is still:

Boost.

If Initiative is used to use a Quick System:

the child action remains that system action.

Only its action-economy payment changes.

—

# 48. Initiative Must Preserve Child Restrictions

“Take any Quick Action as a Free Action” does not mean:

ignore all rules of that Quick Action.

The selected child action must still satisfy its ordinary restrictions unless Initiative explicitly overrides them.

Examples include:

- valid targets;
- weapon eligibility;
- Jammed restrictions;
- source charges;
- Limited uses;
- frequency restrictions;
- targeting;
- line of sight;
- Range;
- other action-specific rules.

—

# 49. Initiative and Duplicate Actions

The child Quick Action remains the underlying action for ordinary duplicate-action restrictions unless the trait explicitly says otherwise.

The Free Action conversion changes action cost, not action identity.

This should use Frame Helm’s centralized action-legality system.

—

# 50. Initiative and Skirmish

Conceptually:

Initiative
→ choose Skirmish
→ Skirmish executes through normal af-skirmish architecture
→ no ordinary Quick Action slot spent
→ Initiative scene use consumed.

Do not implement a second trait-specific weapon attack engine.

—

# 51. Initiative and Boost

Conceptually:

Initiative
→ choose Boost
→ Boost executes through native/shared Boost architecture
→ no ordinary Quick Action slot spent
→ Initiative scene use consumed.

—

# 52. Initiative and Quick Tech

Conceptually:

Initiative
→ choose Quick Tech option
→ selected Quick Tech executes through shared Quick Tech architecture
→ no ordinary Quick Action slot spent
→ Initiative scene use consumed.

All ordinary Quick Tech restrictions remain.

—

# 53. Initiative and Other Trait Actions

If another actor-owned Quick Action is selected through Initiative:

that child’s own frequency/resource rules still apply.

Example:

Initiative
→ choose another 1/scene Quick Action
→ that child must still have its own use available.

The two usage resources remain independent.

—

# 54. Initiative and Overcharge

Initiative and Overcharge both create access to additional action execution, but they are not the same mechanic.

OVERCHARGE
→ native Heat/resource progression
→ grants additional Quick Action.

INITIATIVE
→ 1/scene trait use
→ allows a Quick Action as a Free Action.

Their state must remain separate.

—

# 55. Generalized Granted-Action Architecture

Initiative suggests Frame Helm should support an execution concept such as:

GrantedActionWindow

where one feature temporarily grants:

- an action category;
- a cost override;
- possibly other restrictions.

Conceptually:

grant source
→ eligible child action filter
→ child execution
→ cost override
→ source consumption.

Exact implementation naming is not prescribed here.

—

# 56. Do Not Hardcode Initiative Into Quick Actions

Wrong:

every Quick Action checks:
“is Everest Initiative active?”

Correct:

Initiative creates an explicit granted-action execution context
→ selected child Quick Action receives Free cost override.

This keeps Quick Action implementations reusable.

—

# 57. Trait Frequency UI

Frame Helm should expose frequency clearly.

Examples:

INITIATIVE
1/scene
[Execute]

after use:

INITIATIVE
1/scene — USED
[Unavailable]

The exact UI belongs to presentation configuration.

—

# 58. Usage UI Must Derive From Tracker State

Do not mutate the trait description to indicate:

USED.

The trait source data should remain unchanged.

Frame Helm usage state should be separate runtime state keyed to the action/source.

—

# 59. Scene Reset

When a valid scene/encounter lifecycle reset occurs:

Frame Helm should clear consumed:

1/scene

trait actions.

Initiative then becomes available again.

This should be handled by the generalized tracker, not Everest-specific code.

—

# 60. Round Reset

At a new combat round:

clear applicable:

1/round

usage records.

Do not clear:

1/scene
or
1/mission

records.

—

# 61. Turn Reset

At the appropriate new-turn boundary:

clear applicable:

1/turn

usage records.

Do not clear longer-frequency records.

—

# 62. Mission Reset

At the appropriate mission reset:

clear:

1/mission

usage records.

This lifecycle should be coordinated with the same authoritative mission/full-repair architecture used elsewhere.

—

# 63. Frequency Hierarchy Must Not Be Assumed

Do not implement reset logic as:

new turn clears everything.

Each frequency has its own scope.

Conceptually:

turn reset
→ turn only

round reset
→ round only

scene reset
→ scene/encounter as rules specify

mission reset
→ mission.

—

# 64. Trait Effect Lifecycle

A trait may also create an effect lasting:

- Turn;
- Next Turn;
- Round;
- Next Round;
- Scene;
- Encounter;
- Mission.

This is separate from frequency.

Frame Helm should use a generalized effect-lifecycle subsystem rather than embedding timers into every trait adapter.

—

# 65. Frequency and Duration Example

A hypothetical trait could be:

1/scene:
as a Free Action, gain +1 Accuracy until the end of your next turn.

This contains:

frequency:
1/scene

activation:
Free

effect duration:
Next Turn.

Frame Helm must track both:

scene use consumed
+
temporary effect expiration.

—

# 66. Trait Bonuses vs Temporary Trait Effects

Static structured:

\`trait.bonuses\`

may already be native and continuously active.

Do not automatically treat every trait bonus as something that needs activation.

A temporary activated bonus requires source-specific structured evidence or an explicit adapter.

—

# 67. Trait Action Discovery

Frame Helm should inspect every equipped Frame trait.

For each trait:

- preserve trait identity;
- inspect actions[];
- inspect action activation;
- inspect action frequency;
- inspect counters;
- inspect use;
- inspect deployables/integrated/synergies as relevant.

—

# 68. Suggested Normalized Trait Action

Conceptually:

\`\`\`text
ActorOwnedAction
{
  sourceKind: frame-trait,
  sourceItemUuid,
  sourcePath,
  traitPath,
  actionPath,
  label,
  activationType,
  frequency,
  effectUse,
  executionStrategy
}
\`\`\`

Exact schema belongs to the actor-owned action framework.

—

# 69. Trait Source Path

Preserve enough information to return to:

\`system.traits[index]\`

and:

\`system.traits[index].actions[actionIndex]\`.

This allows execution against the current authoritative Frame item.

—

# 70. Do Not Store Trait Index Alone

Trait indices can potentially change if Frame data is edited/reimported.

Where possible preserve:

- Frame UUID;
- trait identifying metadata;
- exact path;
- action identifying metadata.

At execution, re-resolve against current Frame state.

—

# 71. Actor Rebind

When Frame Helm changes controlled mech:

trait discovery and usage presentation must rebind to the new actor.

Do not carry Everest Initiative usage from one mech to another.

—

# 72. Frame Replacement

If the actor changes equipped Frame:

trait actions should refresh.

Old Frame trait actions must disappear.

New Frame trait actions must appear.

Usage state tied to the old Frame should not accidentally attach to the new Frame.

—

# 73. Native Trait Bonus Refresh

Changing Frame naturally changes native trait bonuses through the Frame item.

Frame Helm should refresh actor state rather than manually attempting to transfer trait bonuses.

—

# 74. Trait Action Economy

Frame Helm owns action-economy expenditure because generic ActivationFlow does not fully deduct actions.

Therefore a normal trait action must validate/spend:

- Protocol;
- Quick;
- Full;
- Free;
- Reaction;

according to its activation type.

—

# 75. Special Cost Overrides

Some traits alter the cost of another action rather than performing an ordinary action themselves.

Initiative:

Quick Action
→ treated as Free for this granted execution.

These require explicit action-cost override context.

—

# 76. Trait Actions and Prepare

A trait-granted Quick Action may potentially be Prepared if otherwise legal.

The Prepare subsystem must preserve:

- source action identity;
- trait frequency;
- native execution strategy.

Frequency should be consumed according to the actual rules of Prepare and successful action commitment/execution.

This interaction should be verified carefully.

—

# 77. Trait Actions and Reactions

A trait may grant a Reaction.

The shared Reaction subsystem should own:

- trigger;
- timing;
- reaction legality.

The trait remains the source.

Frequency tracking remains independent.

—

# 78. Trait Actions and Protocols

A trait may grant a Protocol.

The shared Protocol architecture should own start-of-turn timing.

Trait frequency tracking still applies if the action is limited by frequency.

—

# 79. Trait Actions and Tech

A trait may grant a Quick Tech or other tech-related action.

Reuse the shared tech architecture.

Do not create trait-specific tech attack/check resolution.

—

# 80. Trait Actions and Attacks

A trait may grant an attack.

Reuse:

- Skirmish/Barrage architecture where appropriate;
- native WeaponAttackFlow;
- native TechAttackFlow;
- shared attack target handling.

The trait should grant/modify the attack, not duplicate attack mechanics.

—

# 81. Trait AoEs

If a trait action produces:

- Line;
- Cone;
- Blast;
- Burst;

reuse:

\`aoe.md\`.

Do not create trait-specific measured-template geometry.

—

# 82. Trait Status Effects

If a trait applies/removes statuses or conditions:

reuse the native status architecture documented in:

\`lancer-status-effects.md\`.

Do not directly mutate derived status booleans.

—

# 83. Trait Movement

If a trait grants or modifies movement:

reuse the shared Movement architecture.

Trait logic should specify the exception/modifier while movement execution remains centralized.

—

# 84. Trait Damage

If a trait directly causes damage:

route final damage through native Lancer damage calculation where practical.

Preserve:

- Armor;
- Resistance;
- Shredded;
- Exposed;
- Overshield;
- typed damage.

—

# 85. Trait Counters and UI

If native trait counters are mutable and player-facing, Frame Helm may expose them.

However, first trace:

- where counters are stored;
- how native sheet mutates them;
- whether they persist on the Frame item;
- whether reset semantics exist.

Do not duplicate counter state before this trace.

—

# 86. Trait Deployables and UI

Trait-granted deployables should appear in the appropriate action presentation when executable.

Their placement/execution should use native deployable machinery if available.

—

# 87. Trait Integrated Weapons

If a trait integrates a weapon:

weapon use should remain part of the shared weapon/mount/attack architecture.

Preserve source lineage to the trait.

—

# 88. Trait Synergy Effects

Synergies may modify actions under specific contexts.

These should eventually feed the same action-resolution context used by:

- weapons;
- systems;
- talents;
- traits;
- core bonuses.

Avoid implementing isolated synergy checks in individual buttons.

—

# 89. Generic Frequency Tracker Ownership

A central Frame Helm service should own:

- frequency availability;
- consumption;
- reset;
- persistence;
- source identity.

Individual trait adapters should ask the tracker rather than implement their own booleans.

—

# 90. Suggested Frequency API

Conceptually:

\`\`\`text
canUseAction(actor, sourceAction)

consumeActionUse(actor, sourceAction)

getActionUseState(actor, sourceAction)

resetFrequencyScope(scope)
\`\`\`

Names are illustrative only.

The architecture matters more than exact API names.

—

# 91. Frequency Tracker Inputs

The tracker needs enough context to distinguish:

- actor;
- source;
- action;
- frequency;
- current turn;
- current round;
- current scene/encounter;
- current mission.

Do not rely solely on elapsed time.

—

# 92. Combat-Scoped Frequency

For turn/round actions, Foundry Combat state is a natural authoritative timing source.

The tracker should react to actual:

- combatant turn changes;
- round changes;

rather than maintaining an unrelated local counter.

—

# 93. Non-Combat Usage

Some 1/scene or 1/mission trait actions may be usable outside combat.

Therefore the tracker cannot depend exclusively on an active Combat document.

Scene/mission scopes need broader lifecycle handling.

—

# 94. Persistence

Usage state should survive:

- Frame Helm closing/reopening;
- browser refresh;
- ordinary Foundry rerenders.

Pure ephemeral component state is insufficient for 1/scene or 1/mission resources.

Exact storage location should be chosen deliberately.

—

# 95. Do Not Modify Compendium Source Data

Frequency usage should not mutate the original Frame definition or compendium content.

Runtime usage belongs to the actor/session/module state associated with that actor’s feature.

—

# 96. Native vs Frame Helm State

Use native state whenever native state already exists.

Examples:

Limited item uses
→ native item state.

Core Energy
→ native \`actor.system.core_energy\`.

Core Active
→ native \`actor.system.core_active\`.

ActionData 1/scene usage
→ Frame Helm tracker because equivalent native runtime state was not found.

—

# 97. Trait-Specific Adapters

The generic tracker solves:

“May this action be used again?”

It does not solve:

“What does this trait actually do?”

Special traits still need execution strategies where native structured mechanics are incomplete.

Initiative is one such strategy.

—

# 98. Prefer Composable Trait Strategies

A trait strategy should compose shared primitives.

Initiative should compose:

- frequency tracker;
- granted-action selector;
- action-cost override;
- existing Quick Action execution.

It should not recreate:

- Skirmish;
- Boost;
- Quick Tech;
- systems;
- targeting.

—

# 99. Trait Execution Pipeline

A generalized pipeline can conceptually be:

trait action selected
→ resolve current actor/frame/trait/action
→ validate status/action legality
→ validate activation timing
→ validate frequency
→ determine execution strategy
→ execute native/shared mechanics
→ confirm success
→ consume frequency
→ create temporary lifecycle state if required
→ native/supplemental chat output
→ refresh Frame Helm.

—

# 100. Native ActivationFlow Strategy

For an ordinary structured trait action whose mechanics are adequately handled by native ActivationFlow:

Frame Helm
→ validate action economy
→ validate frequency
→ invoke:
  \`frame.beginActivationFlow(actionPath)\`
→ await success
→ consume frequency
→ refresh.

This maximizes native-system reuse.

—

# 101. Custom Trait Strategy

For a trait whose rules are not implemented by ActivationFlow:

Frame Helm
→ validate action economy
→ validate frequency
→ execute source-specific composition of shared mechanics
→ consume frequency after successful resolution
→ refresh.

Native chat presentation may still be reused where helpful.

—

# 102. Trait Chat Strategy

For a purely passive/descriptive trait:

Frame Helm may expose:

“Show in Chat”

through native SimpleTextFlow.

This should remain separate from:

“Execute”

for mechanically actionable trait features.

—

# 103. Action Presentation

Trait actions should appear in Frame Helm alongside other actions according to their activation category.

The user should not need to remember that an action originated in:

Frame → Trait → ActionData.

Frame Helm can show the source while placing the action where it is usable.

—

# 104. Source Labeling

Useful presentation may include:

INITIATIVE
Everest — Frame Trait
Free • 1/scene

This keeps source identity visible without requiring navigation back to the character sheet.

—

# 105. Passive Trait Presentation

Passive traits without executable actions should not clutter the action list as fake actions.

They may belong in:

- actor details;
- passive effects;
- contextual rule explanation.

Only executable/granted actions should enter action execution UI.

—

# 106. Automatic Passive Effects

A passive trait whose structured bonuses are already native should require no Frame Helm execution button.

Frame Helm should not force active interaction for mechanics native Lancer already applies automatically.

—

# 107. Triggered Passive Traits

Some passive traits may trigger automatically when a condition occurs.

These are distinct from manually activated actions.

Frame Helm may eventually need:

- trigger detection;
- prompt;
- automatic resolution;

depending on the trait.

Do not misclassify every triggered trait as a normal action.

—

# 108. Trait Trigger Architecture

Potential triggered trait behavior should reuse the same future trigger/event architecture needed for:

- reactions;
- talents;
- systems;
- statuses.

Avoid building a Frame-trait-only event listener framework.

—

# 109. Trait Frequency and Triggered Effects

A triggered trait may also have a frequency.

Example:

1/round, when X happens, do Y.

The generalized tracker should still own frequency.

The trigger subsystem should ask:

\`canUseAction(...)\`

before offering/resolving the effect.

—

# 110. Trait Usage and Undo

If Frame Helm eventually supports undo/reversal:

frequency restoration must be coordinated with mechanical rollback.

Do not simply toggle the usage state independently from the action’s actual effects.

—

# 111. Concurrency Guard

Trait actions should have an execution state such as:

planned
→ executing
→ executed.

Disable duplicate execution while the action is resolving.

This is especially important for 1/scene or 1/mission effects.

—

# 112. Revalidation

Before executing a trait action:

- re-resolve actor;
- re-resolve equipped Frame;
- re-resolve trait;
- re-resolve ActionData;
- re-read frequency;
- re-check usage;
- re-check action economy;
- re-check statuses/conditions.

Do not trust stale UI state.

—

# 113. Import/Reimport Reconciliation

If Frame data is reimported:

trait indices or metadata may change.

Usage records should avoid silently attaching to the wrong action.

Stable source identifiers should be preferred wherever available.

—

# 114. Generic Actor-Owned Feature Principle

Frame traits reinforce a broader Frame Helm architecture:

actor-owned features
→ normalize structured actions
→ preserve source identity
→ preserve activation
→ preserve frequency
→ select execution strategy
→ use native Flow when available
→ fill only missing runtime mechanics.

This should also apply to:

- Talents;
- Core Bonuses;
- Core Systems;
- Mounted Systems.

—

# 115. Immediate Repository Research TODO

- [ ] Trace native CounterField runtime behavior.
- [ ] Trace trait counter mutation UI.
- [ ] Trace trait deployable execution.
- [ ] Trace trait integrated equipment resolution.
- [ ] Trace trait synergy runtime consumers.
- [ ] Survey stock Frame trait ActionData.
- [ ] Confirm Initiative’s imported structured ActionData.
- [ ] Survey use of \`FrameEffectUse\` across stock Frames.
- [ ] Confirm whether any non-Bond code consumes ActionData frequency indirectly.
- [ ] Trace ActivationFlow completion/cancellation result semantics.

—

# 116. Usage Tracker TODO

- [ ] Define normalized action-use identity.
- [ ] Support Unlimited.
- [ ] Support 1/turn.
- [ ] Support 1/round.
- [ ] Support 1/scene.
- [ ] Support 1/encounter.
- [ ] Support 1/mission.
- [ ] Persist longer-scope usage.
- [ ] Reset scopes correctly.
- [ ] Expose availability to action UI.
- [ ] Consume only on successful execution.
- [ ] Prevent duplicate concurrent execution.
- [ ] Reconcile actor/frame/source changes.

—

# 117. Trait Discovery TODO

- [ ] Read equipped Frame.
- [ ] Enumerate \`system.traits[]\`.
- [ ] Preserve trait identity.
- [ ] Read \`actions[]\`.
- [ ] Read ActionData activation.
- [ ] Read ActionData frequency.
- [ ] Read trait \`use\`.
- [ ] Read counters.
- [ ] Read deployables.
- [ ] Read integrated equipment.
- [ ] Read synergies.
- [ ] Normalize executable actions into actor-owned registry.

—

# 118. Initiative Adapter TODO

- [ ] Confirm exact native Initiative ActionData.
- [ ] Register Initiative as Free.
- [ ] Register 1/scene frequency.
- [ ] Add “choose any Quick Action” child selector.
- [ ] Filter child actions for current legality.
- [ ] Preserve child action identity.
- [ ] Override child action cost to Free.
- [ ] Do not consume ordinary Quick slot.
- [ ] Preserve child’s own resources/frequency.
- [ ] Consume Initiative only after successful child execution.
- [ ] Reset Initiative at correct scene boundary.
- [ ] Show USED state in Frame Helm.

—

# 119. Effect Lifecycle TODO

- [ ] Define lifecycle abstraction separate from frequency.
- [ ] Support Turn.
- [ ] Support Next Turn.
- [ ] Support Round.
- [ ] Support Next Round.
- [ ] Support Scene.
- [ ] Support Encounter.
- [ ] Support Mission.
- [ ] Use native statuses/bonuses where possible.
- [ ] Remove only effects owned by the expiring source.

—

# 120. Smoke Test — Passive Trait

- [ ] equip Frame with passive structured trait bonus.
- [ ] native bonus applies.
- [ ] Frame Helm does not duplicate it.
- [ ] trait description remains viewable.
- [ ] no unnecessary execute button appears.

—

# 121. Smoke Test — Generic Trait Action

- [ ] structured trait action discovered.
- [ ] correct activation category shown.
- [ ] correct frequency shown.
- [ ] exact source/action path preserved.
- [ ] native ActivationFlow invoked where appropriate.
- [ ] action economy spent once.
- [ ] frequency consumed once.
- [ ] native chat output appears.
- [ ] failed/cancelled execution does not consume use.

—

# 122. Smoke Test — 1/Turn

- [ ] action available at beginning of eligible turn.
- [ ] first use succeeds.
- [ ] second same-turn use blocked.
- [ ] next valid turn restores availability.
- [ ] longer-frequency resources unaffected.

—

# 123. Smoke Test — 1/Round

- [ ] first use succeeds.
- [ ] additional use same round blocked.
- [ ] another actor’s turn does not reset it.
- [ ] next round restores it.
- [ ] scene/mission usage unaffected.

—

# 124. Smoke Test — 1/Scene

- [ ] first use succeeds.
- [ ] subsequent use same scene blocked.
- [ ] turn change does not restore it.
- [ ] round change does not restore it.
- [ ] correct scene lifecycle restores it.
- [ ] UI accurately displays USED state.

—

# 125. Smoke Test — 1/Mission

- [ ] first use succeeds.
- [ ] turn does not restore it.
- [ ] round does not restore it.
- [ ] scene does not restore it.
- [ ] appropriate mission reset restores it.
- [ ] state survives Frame Helm rerender/reopen.

—

# 126. Smoke Test — Everest Initiative

- [ ] Initiative discovered from Everest Frame trait.
- [ ] shown as Free / 1 scene.
- [ ] player executes Initiative.
- [ ] legal Quick Actions presented.
- [ ] player selects Skirmish.
- [ ] normal Skirmish flow executes.
- [ ] no normal Quick Action slot consumed.
- [ ] Initiative marked used.
- [ ] Initiative cannot be used again same scene.
- [ ] normal Skirmish restrictions still apply.
- [ ] scene reset restores Initiative.

—

# 127. Smoke Test — Initiative Child Resources

- [ ] Initiative → Limited Quick System consumes native Limited use.
- [ ] Initiative itself consumes its own 1/scene use.
- [ ] no ordinary Quick slot consumed.
- [ ] Limited system cannot bypass native availability.
- [ ] Initiative does not restore child’s frequency/resource.
- [ ] child failure does not leave inconsistent parent usage state.

—

# 128. Important Invariants

**Invariant 1**

Frame traits belong to the equipped Frame item.

**Invariant 2**

Frame traits are structured mechanical data, not merely prose.

**Invariant 3**

Native structured trait bonuses should remain native-authoritative.

**Invariant 4**

Trait actions may exist as real ActionData.

**Invariant 5**

ActionData contains structured activation and frequency.

**Invariant 6**

Generic ActivationFlow does not enforce ordinary ActionData frequency.

**Invariant 7**

No dedicated native TraitFlow was found.

**Invariant 8**

Native trait chat presentation is not mechanical trait execution.

**Invariant 9**

Frame Helm should provide generalized ActionData frequency tracking rather than one tracker per feature family.

**Invariant 10**

Frequency and action economy are separate constraints.

**Invariant 11**

Frequency and Limited uses are separate resource systems.

**Invariant 12**

ActionData frequency and trait FrameEffectUse are separate concepts.

**Invariant 13**

Usage frequency and effect duration require separate lifecycle handling.

**Invariant 14**

Special trait mechanics should compose shared Frame Helm/native action systems.

**Invariant 15**

Everest Initiative should grant an existing legal Quick Action with a Free cost override, not recreate Quick Action mechanics.

**Invariant 16**

Trait usage should be consumed only after successful mechanical execution according to the action’s semantics.

**Invariant 17**

Native state should be reused wherever it already exists; Frame Helm tracking should fill only the missing runtime state.

—

# 129. Final Working Model

MECH
│
└── EQUIPPED FRAME
    │
    └── TRAITS[]
        │
        ├── PASSIVE STRUCTURE
        │   ├── description
        │   ├── bonuses[]
        │   │   └── native Lancer bonus machinery
        │   ├── counters[]
        │   ├── integrated[]
        │   ├── deployables[]
        │   └── synergies[]
        │
        ├── ACTIONS[]
        │   │
        │   ├── ActionData
        │   │   ├── activation
        │   │   ├── frequency
        │   │   ├── trigger
        │   │   ├── detail
        │   │   └── other structured mechanics
        │   │
        │   └── FRAME HELM ACTOR-OWNED ACTION REGISTRY
        │       ├── preserve source Frame
        │       ├── preserve trait identity
        │       ├── preserve exact action path
        │       ├── preserve activation
        │       ├── preserve frequency
        │       └── select execution strategy
        │
        ├── GENERIC NATIVE EXECUTION
        │   └── frame.beginActivationFlow(actionPath)
        │       ├── native generic checks
        │       ├── native resource behavior where implemented
        │       └── native chat output
        │
        ├── FRAME HELM FREQUENCY TRACKER
        │   ├── unlimited
        │   ├── 1/turn
        │   ├── 1/round
        │   ├── 1/scene
        │   ├── 1/encounter
        │   └── 1/mission
        │
        ├── FRAME HELM EFFECT LIFECYCLE
        │   ├── Turn
        │   ├── Next Turn
        │   ├── Round
        │   ├── Next Round
        │   ├── Scene
        │   ├── Encounter
        │   └── Mission
        │
        └── SOURCE-SPECIFIC TRAIT STRATEGIES
            │
            └── EVEREST INITIATIVE
                ├── Free Action
                ├── 1/scene
                ├── choose legal Quick Action
                ├── execute child through normal architecture
                ├── override child action cost → Free
                ├── preserve child’s restrictions/resources
                └── consume Initiative scene use

The critical architectural rule is:

**Native Lancer already gives Frame Helm the authoritative Frame trait definitions, structured bonuses, structured actions, activation types, frequency metadata, counters, deployables, integrated equipment, and synergies. Frame Helm should not recreate those definitions. Its job is to supply the runtime layer the native repository lacks: generalized frequency tracking, effect lifecycle, action-economy integration, and source-specific orchestration for traits such as Everest Initiative.**
`;

fs.writeFileSync(“mech-traits.md”, content, “utf8”);

console.log(
  `Wrote mech-traits.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);