const fs = require(“fs”);

const content = String.raw`# Lancer Pilot Talents — Native Repository Integration Notes

## Status

**Native Talent item model:** Found.

**Native Talent rank structure:** Found.

**Native current Talent rank:** Found.

**Native unlocked-rank aggregation:** Found.

**Native structured Talent actions:** Found.

**Native structured Talent bonuses:** Found.

**Native structured Talent counters:** Found.

**Native structured Talent synergies:** Found.

**Native structured Talent deployables:** Found per rank.

**Native structured Talent integrated equipment:** Found per rank.

**Native TalentFlow:** Found.

**Native TalentFlow mechanical execution:** Not found — chat presentation only.

**Native generic ActivationFlow for Talent actions:** Found.

**Native automatic Talent bonus consumption:** Found.

**Native mutable Talent counters:** Found.

**Native ActionData frequency metadata:** Found.

**Native ActionData frequency tracking:** Not found.

**Native generic Talent resource semantics:** Not found.

**Native generic cross-actor Talent resource transfer:** Not found.

**Native automatic Talent trigger engine:** Not found.

**Native automatic conditional Talent effect lifecycle:** Not found.

**Native unlocked-rank deployable flattening:** Not found.

**Native unlocked-rank integrated-equipment flattening:** Not found.

**Frame Conn requirement:** Treat Pilot Talents as structured actor-owned feature sources. Reuse native rank data, bonuses, actions, counters, and generic ActivationFlow where appropriate. Add the missing generalized frequency tracking, counter-resource orchestration, trigger/effect lifecycle, cross-actor resource behavior, and source-specific Talent mechanics.

—

# 1. Purpose

This document records the native Foundry Lancer architecture for Pilot Talents and identifies the runtime behavior Frame Conn must provide.

Pilot Talents are not merely descriptive rank text.

Each Talent rank can contain structured:

- actions;
- bonuses;
- counters;
- synergies;
- deployables;
- integrated equipment.

Native Lancer also tracks the current unlocked Talent rank and automatically aggregates several mechanical structures from all unlocked ranks.

However:

> Native Lancer does not provide a complete generic Talent-use engine.

The native TalentFlow is presentation-only.

Structured Talent actions can use generic ActivationFlow, but ordinary Talent frequency, trigger, counter-resource, transfer, and effect-duration behavior is not comprehensively enforced.

Therefore:

> Frame Conn should treat Talents as first-class actor-owned feature definitions over shared action, resource, frequency, trigger, and lifecycle infrastructure.

—

# 2. Talent Ownership

Pilot Talents belong to the Pilot actor.

Conceptually:

PILOT
└── TALENT items

The Pilot’s Talent rank and Talent item data are authoritative.

Frame Conn should not copy Talent definitions into separate module-owned content.

—

# 3. Native Talent Model

The native Talent item schema is defined in:

\`src/module/models/items/talent.ts\`.

Conceptually:

TALENT
├── curr_rank
├── description
├── terse
└── ranks[]
    ├── name
    ├── description
    ├── exclusive
    ├── actions[]
    ├── bonuses[]
    ├── synergies[]
    ├── deployables[]
    ├── counters[]
    └── integrated[]

This is a rich mechanical definition.

—

# 4. Native Current Rank

The Talent item contains:

\`system.curr_rank\`

with a native rank range of:

1 through 3.

Conceptually:

\`\`\`ts
curr_rank: new fields.NumberField({
  initial: 1,
  min: 1,
  max: 3
})
\`\`\`

This is the authoritative unlocked Talent rank.

—

# 5. Talent Rank Progression

A rank-2 Talent includes the mechanical content of:

- Rank 1;
- Rank 2.

A rank-3 Talent includes:

- Rank 1;
- Rank 2;
- Rank 3.

Native runtime preparation reflects this.

—

# 6. Native Unlocked-Rank Aggregation

Native Lancer slices the Talent’s ranks up to:

\`system.curr_rank\`

and aggregates unlocked mechanical data.

Conceptually:

\`\`\`ts
if (this.is_talent()) {
  const unlockedRanks =
    this.system.ranks.slice(0, this.system.curr_rank);

  this.system.actions =
    unlockedRanks.flatMap(rank => rank.actions);

  this.system.bonuses =
    unlockedRanks.flatMap(rank => rank.bonuses);

  this.system.counters =
    unlockedRanks.flatMap(rank => rank.counters);

  this.system.synergies =
    unlockedRanks.flatMap(rank => rank.synergies);
}
\`\`\`

This is extremely useful to Frame Conn.

—

# 7. Native Aggregated Talent Actions

All unlocked rank:

\`actions[]\`

are aggregated into the Talent runtime action collection.

Therefore Frame Conn can discover the Talent’s currently unlocked structured actions without manually interpreting rank prose.

—

# 8. Native Aggregated Talent Bonuses

All unlocked rank:

\`bonuses[]\`

are aggregated.

These native bonuses can then feed the normal Lancer bonus system.

Frame Conn should not duplicate them.

—

# 9. Native Aggregated Talent Counters

All unlocked rank:

\`counters[]\`

are aggregated.

This provides a native structured mechanism for Talent-specific mutable resources.

This is one of the most important Talent findings.

—

# 10. Native Aggregated Talent Synergies

All unlocked rank:

\`synergies[]\`

are aggregated.

These may encode context-sensitive interactions with actions, attacks, movement, or other game events.

Frame Conn should preserve them for future trigger/modifier integration.

—

# 11. Integrated and Deployable Aggregation Gap

Talent ranks also contain:

- \`integrated[]\`;
- \`deployables[]\`.

However, the unlocked-rank aggregation block traced in the repository does not similarly flatten them into top-level Talent runtime fields.

Therefore Frame Conn should not assume:

\`talent.system.integrated\`

or:

\`talent.system.deployables\`

contains every unlocked rank grant.

When necessary:

→ inspect unlocked ranks directly.

—

# 12. Talent Rank Source Preservation

When discovering actions or resources, preserve which rank supplied them.

Conceptually:

Talent
→ Rank 2
→ action

rather than flattening source identity to:

Talent action.

This matters for:

- presentation;
- debugging;
- future rank changes;
- exact source paths.

—

# 13. Native Talent Bonus Consumer

Native bonus aggregation explicitly includes Talent bonuses.

Conceptually:

\`\`\`ts
case EntryType.TALENT:
  bonus_groups.push({
    bonuses: this.system.bonuses
  });
\`\`\`

Therefore structured Talent bonuses are mechanically native.

—

# 14. Do Not Duplicate Talent Bonuses

Wrong:

Frame Conn reads Talent bonus
→ manually adds Accuracy

while:

native bonus engine
→ applies the same Talent bonus.

Correct:

Frame Conn preserves native Talent item
→ native bonus engine remains authoritative.

Only supplement rules not represented by structured native bonus data.

—

# 15. Native Talent Sheet Rank Rendering

The Pilot sheet renders unlocked Talent ranks individually.

Conceptually:

Talent
├── Rank 1
│   ├── description
│   └── structured actions
├── Rank 2
│   ├── description
│   └── structured actions
└── Rank 3
    ├── description
    └── structured actions

only through:

\`curr_rank\`.

—

# 16. Native Structured Talent Action Paths

The Talent sheet can render actions from exact rank paths such as:

\`system.ranks.0.actions.0\`

\`system.ranks.1.actions.0\`

\`system.ranks.2.actions.0\`.

Frame Conn should preserve these exact paths.

Do not reconstruct the action later by name.

—

# 17. Native TalentFlow Exists

The repository contains:

\`src/module/flows/talent.ts\`.

However, this is not a Talent mechanical execution engine.

Its step sequence is essentially:

\`\`\`ts
static steps = [
  “printTalentCard”
];
\`\`\`

Therefore native TalentFlow is primarily presentation.

—

# 18. Native TalentFlow Chat Card

TalentFlow renders:

\`public/templates/chat/talent-card.hbs\`

with rank content such as:

- Talent name;
- rank name;
- rank description.

The template itself contains unfinished action presentation.

This confirms TalentFlow does not execute general Talent mechanics.

—

# 19. Talent Chat vs Talent Execution

There are two native paths.

Rank chat:

Talent rank button
→ TalentFlow
→ print rank text.

Structured action:

Talent rank action
→ generic ActivationFlow
→ generic mechanical activation where supported.

Frame Conn should preserve the distinction.

—

# 20. Native Generic Talent Action Execution

A structured Talent action can execute through:

\`item.beginActivationFlow(path)\`.

Conceptually:

Talent item
→ exact rank action path
→ ActivationFlow
→ generic native activation mechanics.

This should be reused where the Talent action fits native ActivationFlow behavior.

—

# 21. ActivationFlow Is Not a Talent Rules Engine

Generic ActivationFlow does not understand arbitrary Talent semantics.

It can handle generic activation concerns, but not rules such as:

- gain Leadership Dice;
- transfer a die to an ally;
- first attack this turn while in Danger Zone;
- special reaction timing;
- custom per-scene resources.

Frame Conn must add those higher-order mechanics.

—

# 22. Native ActionData Structure

Talent actions use the shared ActionData model.

Relevant fields include concepts such as:

- activation;
- cost;
- frequency;
- trigger;
- detail;
- heat_cost;
- damage;
- range;
- pilot;
- mech;
- tech_attack;
- synergy locations.

This allows Frame Conn to normalize Talent actions alongside other actor-owned actions.

—

# 23. Talent Action Activation

Structured Talent actions may be:

- Protocol;
- Quick;
- Full;
- Free;
- Reaction;
- other native activation types.

Frame Conn should use the structured activation value for action-category placement and action economy.

Do not infer this from Talent prose when structured data exists.

—

# 24. Native Talent Action Frequency

Talent ActionData uses the same native frequency model as other actor-owned actions.

Conceptually:

- Unlimited;
- 1/Turn;
- 1/Round;
- 1/Scene;
- 1/Encounter;
- 1/Mission.

This should feed the same generalized Frame Conn frequency tracker used for Mech Traits.

—

# 25. Native Frequency Parsing Is Not Runtime Tracking

The native repository understands and validates ActionData frequency.

It does not generally consume and refresh those uses during ordinary Talent execution.

Therefore:

\`frequency = 1/scene\`

is useful structured metadata

but not:

automatic native scene-use state.

—

# 26. Generic Frequency Tracker

Frame Conn should use one shared actor-owned ActionData frequency tracker across:

- Pilot Talents;
- Frame Traits;
- Core sub-actions;
- Core Bonuses;
- Mounted System actions where native Limited is not the resource;
- other ActionData sources.

Do not implement a Talent-only frequency system.

—

# 27. Frequency and Native Counters Are Different

Talent:

\`frequency\`

and:

Talent:

\`counters[]\`

are different resource concepts.

Frequency answers:

How often may this action execute?

Counter answers:

What mutable numeric resource does this Talent currently own?

Both may exist simultaneously.

—

# 28. Native Talent Counter Model

A Talent Counter is structured state conceptually containing:

\`\`\`ts
{
  lid,
  name,
  min,
  max,
  default_value,
  value
}
\`\`\`

This makes counters suitable for resources such as:

- dice;
- charges;
- tokens;
- accumulated points;
- rank-dependent pools.

—

# 29. Native Counter Initialization

Counter import initializes:

\`value\`

from:

\`default_value\`.

The native field also preserves:

- minimum;
- maximum.

Therefore Frame Conn should strongly prefer native counters where the Talent LCP already defines the resource.

—

# 30. Do Not Invent Duplicate Counter Resources

If a Talent already contains:

Leadership Dice counter

then wrong architecture is:

native counter
+
Frame Conn leadershipDiceCount.

Correct architecture:

native Talent counter
→ authoritative numeric state
→ Frame Conn resource adapter reads/mutates it.

—

# 31. Counter Resource Adapter

Frame Conn should provide a generic native counter adapter.

Conceptually:

\`getCounter(source, counterId)\`

\`setCounterValue(source, counterId, value)\`

\`incrementCounter(...)\`

\`decrementCounter(...)\`

\`resetCounter(...)\`

Exact APIs are illustrative only.

The adapter should preserve native min/max boundaries.

—

# 32. Counter Source Identity

A counter should be addressed by stable Talent/source information.

Prefer:

- Talent item UUID;
- counter LID;
- rank/source metadata.

Do not identify a resource only by display label.

—

# 33. Counter Recovery Rules Are Not Generic

Native counter state does not inherently know:

- when it replenishes;
- who may spend it;
- whether it transfers;
- whether it expires.

Those rules belong to Talent-specific orchestration or shared lifecycle services.

—

# 34. Talent Resource Hierarchy

For any Talent mechanic:

First ask:

1. Is the resource a native Limited item?
2. Is it a native Talent Counter?
3. Is it an ActionData frequency?
4. Is some other native state present?
5. Only then invent supplemental Frame Conn runtime state.

This minimizes duplicate authorities.

—

# 35. Talent Integrated Equipment

Each rank can structurally grant:

\`integrated[]\`.

This is important for Talent-granted weapons and systems.

Frame Conn should inspect unlocked ranks directly if native runtime aggregation does not flatten these grants.

—

# 36. Nuclear Cavalier — Integrated Weapon Pattern

Nuclear Cavalier rank 3 grants an integrated weapon:

Fuel Rod Gun.

This is exactly the kind of mechanic that should preferably be represented through:

Talent rank
→ integrated weapon LID
→ native weapon item
→ ordinary weapon attack/loadout mechanics.

Frame Conn should not create a fake Talent-specific attack implementation if the integrated weapon already exists natively.

—

# 37. Nuclear Cavalier — Limited Weapon Resource

Fuel Rod Gun is:

Limited 3.

If the integrated weapon item carries native Limited state:

native Limited tracking should remain authoritative.

Frame Conn should not create:

Fuel Rod shots remaining

as a Talent-specific counter unless the source data actually requires that.

—

# 38. Talent Integrated Discovery Gap

Because Talent unlocked-rank aggregation does not flatten integrated gear in the traced runtime block:

Frame Conn may need:

Talent
→ unlocked ranks
→ integrated[]
→ resolve granted equipment.

This should be centralized in Talent feature discovery.

—

# 39. Talent Deployables

Each rank may contain:

\`deployables[]\`.

As with integrated gear:

Frame Conn should inspect unlocked ranks directly.

Deployment should reuse native deployable machinery once traced.

—

# 40. Talent Synergies

Talent ranks contain structured:

\`synergies[]\`.

These can express relationships to other action/mechanical contexts.

Frame Conn should preserve them in actor-owned feature normalization.

Do not flatten Talent functionality to just actions and text.

—

# 41. Conditional Talent Effects

Many Talents are conditional.

Examples include:

- first attack this turn;
- while in Danger Zone;
- after entering Danger Zone;
- when an ally takes damage;
- when making a certain action;
- once per round when X happens.

These require trigger/event state beyond generic ActivationFlow.

—

# 42. Native Generic Trigger Engine Is Missing

The repository trace did not find a general Talent engine that automatically recognizes arbitrary Talent prose triggers.

Therefore Frame Conn will need:

- structured synergy/event matching where available;
- explicit source adapters where necessary.

—

# 43. Shared Trigger Architecture

Do not create a Talent-only trigger engine.

The same trigger/event framework will be needed for:

- Frame Traits;
- Talents;
- Systems;
- Core Bonuses;
- Reactions;
- statuses;
- Core Powers.

Talent-specific logic should subscribe to shared semantic events.

—

# 44. Useful Semantic Events

Potential shared events include:

- turn started;
- turn ended;
- round started;
- attack declared;
- attack rolled;
- attack hit;
- damage dealt;
- damage received;
- entered Danger Zone;
- exited Danger Zone;
- Boost used;
- Stabilize used;
- Tech Action used;
- ally affected;
- resource spent.

Exact event names are architectural, not native API claims.

—

# 45. Nuclear Cavalier — Rank 1 Pattern

Aggressive Heat Bleed conceptually says:

first attack roll on your turn while in Danger Zone
→ gain Accuracy.

This requires at least:

- Danger Zone state;
- current actor turn;
- whether first qualifying attack has already occurred;
- attack event integration.

If structured Talent bonuses/synergies encode enough of this, prefer them.

Otherwise Frame Conn needs a small source-specific trigger strategy.

—

# 46. Nuclear Cavalier — Entering Danger Zone

The rule includes:

if you enter Danger Zone during your turn,
the Talent takes effect on your next attack.

This means eligibility state can change during the turn.

A robust implementation should respond to:

Heat change
→ actor crosses Danger Zone threshold
→ update qualifying Talent state.

Do not simply check Danger Zone once at turn start.

—

# 47. Nuclear Cavalier — Rank 2 Pattern

Fusion Hemorrhage conceptually modifies:

the first ranged or melee attack roll while in Danger Zone.

Its effect includes:

- damage-type modification;
- bonus damage.

This likely requires:

- attack semantic hook;
- qualifying weapon/attack classification;
- first-attack tracker;
- Danger Zone state.

Again, structured synergies should be checked first.

—

# 48. Nuclear Cavalier — Rank 3 Pattern

Fuel Rod Gun is different.

It is primarily:

Talent grants integrated weapon
→ weapon attacks normally
→ native Limited 3
→ on attack clear Heat.

The integrated weapon architecture should own most of this.

Any on-attack Heat clear not represented structurally may require an attack event adapter.

—

# 49. Leader — Custom Talent Resource

Leader introduces:

Leadership Dice.

The Talent defines a resource that:

- has rank-dependent capacity;
- can be spent;
- can be transferred;
- can be returned;
- can be used by allies;
- refreshes through specific rest/repair rules.

This is much more than ordinary action frequency.

—

# 50. Leadership Dice and Native Counters

The native Talent Counter model is a likely authoritative storage mechanism if Leader’s imported Talent data encodes Leadership Dice as a counter.

Frame Conn should inspect actual Leader content before inventing a separate resource field.

—

# 51. Leader Content Trace Requirement

Before implementing Leader:

- inspect rank counters;
- inspect actions;
- inspect synergies;
- inspect any integrated data.

If Leadership Dice are represented as native counters:

reuse them.

If not:

add the smallest supplemental runtime state necessary.

—

# 52. Leader Rank-Dependent Capacity

Leader rank progression changes the Leadership Dice pool.

Because Talent ranks are structured:

capacity may be represented by:

- different unlocked Counter definitions;
- changed Counter max;
- prose only.

This must be determined from actual Talent content before implementation.

—

# 53. Leadership Dice Gain

Field Commander begins with a number of Leadership Dice.

The resource may also be regained through:

- Rest;
- Full Repair.

Frame Conn needs to connect the resource to appropriate lifecycle events.

Do not reset it at every turn.

—

# 54. Leadership Dice Spend

A Leader Talent action may consume one Leadership Die.

If native counter exists:

→ decrement native counter.

This spend is separate from:

- action frequency;
- Reaction economy;
- Quick/Free action economy.

All relevant constraints must be validated independently.

—

# 55. Leadership Dice Transfer

Leader allows giving a Leadership Die to an allied character.

This requires cross-actor state.

Conceptually:

Leader counter
→ decrement
→ create held Leadership Die state on recipient
→ preserve source Leader identity.

Native generic Talent counters do not by themselves model:

counter value temporarily held by another actor.

Frame Conn must orchestrate this.

—

# 56. Held Leadership Die State

A transferred Leadership Die needs metadata such as:

- source Leader;
- recipient;
- scene/expiration context;
- whether spent;
- whether returned.

This is likely supplemental Frame Conn state unless the native content exposes a reusable structure.

—

# 57. Leadership Die Return

The recipient may return the die according to the Talent rules.

Conceptually:

held die
→ remove recipient state
→ increment source Leader counter
→ respect maximum capacity.

This should be one atomic cross-actor operation.

—

# 58. Leadership Die Ally Spend

At higher rank, allies may spend held dice for effects such as:

- damage reduction;
- bonus damage.

This requires:

- target ally state;
- trigger;
- die consumption;
- effect resolution.

The shared trigger/resource architecture should support this.

—

# 59. Leadership Die Scene Lifetime

Transferred Leadership Dice may persist only for a defined duration.

If rules say they last until:

- used;
- returned;
- end of scene;

Frame Conn needs lifecycle cleanup.

This should use the shared effect-lifecycle system.

—

# 60. Leader Reaction Upgrade

Open Channels allows command use as a Reaction under particular timing.

This does not require a separate Leader Reaction engine.

Instead:

Leader rank unlock
→ normalize an eligible Reaction action/override
→ shared Reaction subsystem handles trigger/timing
→ Leadership Die resource handles spend.

—

# 61. Leader Free Action Return

Field Commander allows an ally to return a Leadership Die as a Free Action.

This is an actor-owned action available to the recipient because of a transferred resource.

Frame Conn may need to surface temporary actions granted by foreign-source state.

This is a useful general architectural capability beyond Leader.

—

# 62. Temporary Granted Actions

A held resource or effect may temporarily grant an action to another actor.

Conceptually:

source feature
→ target receives temporary capability
→ capability appears in actor-owned action registry
→ source metadata preserved
→ disappears on use/expiration.

Leader is a strong use case.

—

# 63. Talent Counters and Cross-Actor State Are Separate

Source Talent counter:

Leadership Dice remaining on Leader.

Recipient state:

Leadership Die held by Ally.

Do not conflate these into one counter.

The counter tracks source inventory.

The transferred instance tracks ownership in the field.

—

# 64. Talent Resource Recovery

Different Talent resources may recover on:

- turn;
- round;
- scene;
- Rest;
- Full Repair;
- mission reset;
- special conditions.

The resource adapter needs source-specific recovery rules.

ActionData frequency alone is insufficient.

—

# 65. Rest and Full Repair Hooks

Leader explicitly interacts with Rest/Full Repair.

Other Talents may also recover counters during repair lifecycle.

Frame Conn should expose semantic lifecycle hooks such as:

- Rest completed;
- Full Repair completed.

Then Talent resource strategies can refresh native counters appropriately.

—

# 66. Do Not Reimplement Native Full Repair Mechanics

If native Full Repair already mutates a Talent resource through structured/native state:

reuse it.

Only add Talent counter refresh where the native system does not already do so.

—

# 67. Talent Actions and Action Economy

Frame Conn owns action economy for structured Talent actions.

The Talent action’s native activation type determines whether it is:

- Protocol;
- Quick;
- Full;
- Free;
- Reaction.

Generic ActivationFlow does not fully deduct the actor action tracker.

—

# 68. Talent Frequency and Action Economy

A Talent action can be:

Free
+
1/turn.

Both must be checked.

Action economy says:

does this action consume normal Quick/Full/etc. budget?

Frequency says:

has this Talent source already used its allowed use?

Do not combine them into one flag.

—

# 69. Talent Counter and Action Frequency

A Talent action may also consume a counter.

Then it has three independent legality dimensions:

- action cost;
- frequency;
- resource availability.

Example:

Reaction
+
1/round
+
spend 1 Leadership Die.

All three must pass.

—

# 70. Generic Talent Execution Pipeline

Conceptually:

Talent action selected
→ resolve Pilot/Talent/rank/action
→ check unlocked rank
→ central actor/action legality
→ check activation timing
→ check ActionData frequency
→ check required native counter/resource
→ select execution strategy
→ execute native/shared mechanics
→ confirm success
→ consume resource/frequency
→ create temporary effects if needed
→ refresh Talent/action UI.

—

# 71. Normal Native Talent Action Strategy

For an ordinary structured Talent action adequately handled by ActivationFlow:

Frame Conn
→ validate action economy
→ validate frequency
→ validate counter/resource
→ invoke:
  \`talent.beginActivationFlow(actionPath)\`
→ await resolution
→ consume frequency
→ consume external counter only if not natively handled
→ refresh.

—

# 72. Talent-Specific Strategy

For actions with custom semantics:

Frame Conn
→ use shared primitives
→ add only the unique rule.

Examples:

Leader
→ counter transfer / granted action.

Nuclear Cavalier
→ attack-event/Danger Zone trigger.

Do not reimplement generic attacks, saves, statuses, or movement.

—

# 73. Talent Actions and Attacks

Talent-granted attacks should use shared/native attack architecture.

Potential paths include:

- integrated weapon;
- WeaponAttackFlow;
- TechAttackFlow;
- generic action triggering an attack.

Talent only provides the source/rule.

—

# 74. Talent Actions and AoE

If a Talent grants:

- Line;
- Cone;
- Blast;
- Burst;

reuse:

\`aoe.md\`.

Do not create Talent-specific template geometry.

—

# 75. Talent Actions and Statuses

If a Talent applies/removes:

- Impaired;
- Jammed;
- Shredded;
- Invisible;
- etc.

reuse:

\`lancer-status-effects.md\`.

Use native ActiveEffects/status representation.

—

# 76. Talent Actions and Saves

If a Talent causes saves:

reuse the shared check/save infrastructure.

If multi-target AoE save:

use the Frame Conn save-AoE resolver.

—

# 77. Talent Actions and Movement

Talent-granted movement should reuse the shared movement architecture.

The Talent strategy should describe:

- movement grant;
- action cost;
- frequency;
- exceptions.

The movement subsystem should move the token.

—

# 78. Talent Actions and Reactions

Reaction Talents should use the shared Reaction subsystem.

Frame Conn must preserve:

- trigger;
- frequency;
- resource cost;
- reaction legality.

Do not encode reaction timing inside Talent UI alone.

—

# 79. Talent Actions and Protocols

Protocol Talents should use the shared Protocol architecture.

The Talent remains the source.

The Protocol system owns:

- start-of-turn window;
- timing;
- normal Protocol rules.

—

# 80. Talent Actions and Prepare

If a Talent grants an ordinary legal Quick Action:

it may interact with Prepare according to normal rules.

Prepared execution must preserve:

- exact Talent action path;
- source Talent;
- frequency;
- counter/resource cost.

—

# 81. Talent Actions and Overcharge

An Overcharge-granted Quick Action can potentially execute a Talent Quick Action.

Overcharge owns:

extra Quick action.

Talent owns:

frequency/resource/special rules.

These must remain independent.

—

# 82. Talent Actions and Initiative-Like Grants

A Talent may itself alter action economy.

Reuse the same granted-action/cost-override architecture proposed for Mech Traits rather than creating Talent-specific child action execution.

—

# 83. Pilot vs Mech Context

Some Talent actions affect:

- Pilot;
- Mech;
- both.

ActionData contains relevant pilot/mech applicability metadata.

Frame Conn should preserve this distinction.

—

# 84. Linked Pilot and Mech Context

Many Pilot Talents mechanically affect the linked Mech while the Pilot is piloting it.

Frame Conn must resolve:

Pilot Talent source
→ linked/controlled Mech execution context

where appropriate.

Do not assume every Talent effect modifies the Pilot actor document directly.

—

# 85. Talent Bonus Propagation

Native Lancer already incorporates structured Talent bonuses into relevant actor calculations.

This indicates the native system already understands the Pilot-to-Mech bonus relationship where designed.

Frame Conn should rely on the native bonus engine.

—

# 86. Talent Action Source Actor

For a Talent action executed while piloting:

source feature actor:
Pilot

mechanical actor may be:
Mech.

The normalized execution context should preserve both.

This will matter for:

- resource ownership;
- chat attribution;
- action economy;
- target Save Target;
- status/source metadata.

—

# 87. Suggested Talent Action Context

Conceptually:

\`\`\`text
TalentActionContext
{
  pilotActor,
  mechActor,
  talentItem,
  rankIndex,
  actionPath,
  activationType,
  frequency,
  counters,
  executionStrategy
}
\`\`\`

Exact schema is illustrative.

—

# 88. Talent Source Identity

Preserve:

- Pilot actor UUID;
- Talent item UUID;
- rank index;
- action path.

This ensures the action can be re-resolved authoritatively at execution.

—

# 89. Do Not Store Rank Description as Authority

Talent prose is useful for presentation and fallback interpretation.

Mechanical identity should prefer:

- ActionData;
- BonusData;
- CounterData;
- SynergyData;
- Integrated LIDs;
- Deployable data.

—

# 90. Talent Rank Changes

If:

\`curr_rank\`

changes:

Frame Conn should refresh:

- actions;
- counters;
- bonuses presentation;
- synergies;
- integrated equipment;
- deployables;
- source-specific mechanics.

Do not retain rank-3 actions after reducing to rank 2.

—

# 91. Counter State on Rank Change

If a higher-rank Counter disappears due to rank reduction:

Frame Conn should reconcile usage state safely.

Do not keep an orphan runtime resource associated with a no-longer-unlocked rank.

—

# 92. Integrated Gear on Rank Change

If integrated equipment is only granted by a higher rank:

availability should follow current Talent rank.

This requires direct unlocked-rank inspection if native flattening is incomplete.

—

# 93. Deployables on Rank Change

Same principle:

deployable access should follow current unlocked rank.

—

# 94. Talent Chat Presentation

Frame Conn may preserve a:

Show Talent in Chat

control using native TalentFlow.

This is separate from mechanical execution.

Do not force every Talent rank card to become an action.

—

# 95. Passive Talents

A passive Talent rank with only bonuses/synergies needs no Execute button.

Frame Conn should let native bonus machinery handle structured passive effects.

—

# 96. Triggered Passive Talents

A passive Talent may still require runtime response to an event.

These should enter the trigger/event subsystem rather than appear as ordinary buttons unless a player choice is required.

—

# 97. Automatic vs Prompted Talent Triggers

Some Talent triggers may be:

automatic.

Others may be:

optional.

The source-specific strategy should identify whether Frame Conn:

- applies automatically;
- prompts the player;
- surfaces a Reaction button;
- waits for manual activation.

—

# 98. Talent Trigger Frequency

Triggered effects may also have:

1/turn
or
1/round.

The shared frequency tracker should be queried during event handling.

Do not create a second trigger-specific use tracker.

—

# 99. Counter Spend Atomicity

When a Talent action consumes a counter:

resource decrement and mechanical effect should be coordinated.

Avoid:

counter decremented
→ execution errors
→ resource permanently lost unintentionally.

Use execution transactions or explicit rollback where practical.

—

# 100. Cross-Actor Resource Atomicity

For Leader-style transfers:

source counter decrement
+
recipient temporary state creation

should behave atomically where possible.

Do not leave:

die removed from Leader
but never granted to ally

if the second mutation fails.

—

# 101. Resource Source Metadata

Transferred or granted Talent resources should preserve:

- source Talent;
- source Pilot;
- recipient;
- lifecycle;
- unique instance identity.

This allows:

- return;
- spend;
- expiration;
- cleanup.

—

# 102. Talent Resource Presentation

Frame Conn should present native Talent counters when they are player-relevant.

Example:

Leadership Dice: 2 / 3

rather than hiding mutable resources in Talent prose.

The exact UI belongs to feature presentation.

—

# 103. Frequency Presentation

Structured frequency should also be visible.

Example:

FIELD COMMANDER
Free Action • 1/Turn
Leadership Dice: 2/3

This helps the player understand both legality dimensions.

—

# 104. Temporary Foreign Talent Effects

If another Pilot’s Talent grants this actor a temporary resource or action:

Frame Conn should be capable of showing that effect on the recipient.

Leader is a canonical example.

This should be generalized rather than implemented as a special hidden Leader-only UI.

—

# 105. Actor-Owned Feature Registry

Talents should enter the same generalized actor-owned feature registry as:

- Mech Traits;
- Core System actions;
- Mounted Systems;
- Core Bonuses.

The registry should normalize:

- source;
- rank;
- action;
- activation;
- frequency;
- resource references;
- execution strategy.

—

# 106. Suggested Normalized Talent Action

Conceptually:

\`\`\`text
ActorOwnedAction
{
  sourceKind: pilot-talent,
  sourceActorUuid,
  sourceItemUuid,
  rankIndex,
  actionPath,
  label,
  activationType,
  frequency,
  counterRefs,
  executionStrategy
}
\`\`\`

Exact schema belongs to the Actions refactor.

—

# 107. Shared Frequency Tracker

Talent ActionData frequency should reuse the generalized tracker.

Required scopes include:

- Unlimited;
- Turn;
- Round;
- Scene;
- Encounter;
- Mission.

Usage must persist for the appropriate scope.

—

# 108. Shared Counter Adapter

Talent counters should use a native counter adapter.

The Talent feature layer should not directly edit random nested paths throughout UI code.

—

# 109. Shared Trigger/Event System

Talents should subscribe to semantic events through a shared trigger layer.

Potential consumers include:

- Nuclear Cavalier;
- Leader;
- Duelist;
- Combined Arms;
- other conditional Talents.

—

# 110. Shared Effect Lifecycle

Temporary Talent effects should use the same lifecycle framework as:

- Mech Traits;
- Core Powers;
- systems;
- statuses.

Possible durations include:

- current turn;
- next turn;
- round;
- scene;
- mission;
- until used.

—

# 111. Shared Granted-Action Infrastructure

Talents that grant:

- temporary Free Actions;
- Reactions;
- extra Quick Actions;
- recipient actions;

should use a common granted-action architecture.

Do not duplicate child-action execution per Talent.

—

# 112. Native State First Principle

Before adding Frame Conn state for any Talent:

search for:

- native Talent Counter;
- native Limited item;
- ActionData frequency;
- native status;
- native item charge;
- native integrated gear.

Only supplement where native state is absent.

—

# 113. Content-Specific Talent Traces

Before implementing complicated Talents:

trace their actual LCP/native encoding.

High-value examples include:

- Leader;
- Nuclear Cavalier;
- Technophile;
- Black Thumb;
- Drone Commander;
- Gunslinger;
- Duelist;
- Combined Arms.

This reveals whether their mechanics use:

- actions;
- counters;
- bonuses;
- synergies;
- integrated gear;
- prose only.

—

# 114. Leader Follow-Up Trace TODO

- [ ] Inspect native Leader Talent item.
- [ ] Inspect rank 1 counters.
- [ ] Inspect rank 2 counters.
- [ ] Inspect rank 3 counters.
- [ ] Determine whether Leadership Dice are native CounterData.
- [ ] Inspect structured actions.
- [ ] Inspect synergies.
- [ ] Determine rank-dependent max pool representation.
- [ ] Determine whether transfer actions are structured.
- [ ] Determine whether recovery is structured or prose only.

—

# 115. Nuclear Cavalier Follow-Up Trace TODO

- [ ] Inspect rank 1 bonuses.
- [ ] Inspect rank 1 synergies.
- [ ] Inspect rank 2 bonuses.
- [ ] Inspect rank 2 synergies.
- [ ] Inspect rank 3 integrated entries.
- [ ] Resolve Fuel Rod Gun native item.
- [ ] Confirm Limited 3 native state.
- [ ] Confirm on-attack Heat clear representation.
- [ ] Determine whether Danger Zone conditionality is structured.

—

# 116. Frequency Tracker TODO

- [ ] Support Talent Unlimited.
- [ ] Support 1/Turn.
- [ ] Support 1/Round.
- [ ] Support 1/Scene.
- [ ] Support 1/Encounter.
- [ ] Support 1/Mission.
- [ ] Persist correct scopes.
- [ ] Reset on correct lifecycle.
- [ ] Consume only after successful execution.
- [ ] Preserve exact Talent/rank/action source.
- [ ] Share implementation with Mech Traits.

—

# 117. Counter Adapter TODO

- [ ] Enumerate Talent counters.
- [ ] Read current value.
- [ ] Read min/max.
- [ ] Increment.
- [ ] Decrement.
- [ ] Reset to default.
- [ ] Reconcile rank changes.
- [ ] Preserve native CounterData.
- [ ] Surface player-relevant counters in UI.

—

# 118. Cross-Actor Talent Resource TODO

- [ ] Define transferable resource instance.
- [ ] Preserve source Talent/Pilot.
- [ ] Preserve recipient.
- [ ] Support transfer.
- [ ] Support return.
- [ ] Support spend.
- [ ] Support expiration.
- [ ] Reconcile source/recipient deletion.
- [ ] Prevent duplicate use.
- [ ] Use for Leader-like mechanics.

—

# 119. Talent Discovery TODO

- [ ] Resolve linked Pilot.
- [ ] Enumerate Talent items.
- [ ] Read \`curr_rank\`.
- [ ] Enumerate unlocked ranks.
- [ ] Read actions.
- [ ] Read bonuses.
- [ ] Read counters.
- [ ] Read synergies.
- [ ] Read integrated entries directly from unlocked ranks.
- [ ] Read deployables directly from unlocked ranks.
- [ ] Normalize executable actions.
- [ ] Register triggered passive mechanics separately.

—

# 120. Action Economy TODO

- [ ] Use structured Talent activation type.
- [ ] Protocol → shared Protocol rules.
- [ ] Quick → shared Quick budget.
- [ ] Full → shared Full budget.
- [ ] Free → shared Free Action rules.
- [ ] Reaction → shared Reaction rules.
- [ ] Keep action economy separate from frequency/counters.
- [ ] Revalidate at execution.

—

# 121. Trigger System TODO

- [ ] Define semantic event bus.
- [ ] Detect Danger Zone entry.
- [ ] Detect first qualifying attack.
- [ ] Detect attack hit.
- [ ] Detect damage dealt.
- [ ] Detect damage received.
- [ ] Detect ally events.
- [ ] Query Talent synergies.
- [ ] Query frequency tracker.
- [ ] Prompt/auto-resolve according to source.
- [ ] Consume trigger use only when resolved.

—

# 122. Effect Lifecycle TODO

- [ ] Support until next attack.
- [ ] Support until used.
- [ ] Support end of turn.
- [ ] Support end of next turn.
- [ ] Support end of round.
- [ ] Support end of scene.
- [ ] Support Rest.
- [ ] Support Full Repair.
- [ ] Remove only effects owned by the Talent source.

—

# 123. Integrated Equipment TODO

- [ ] Walk unlocked rank \`integrated[]\`.
- [ ] Resolve native equipment by LID.
- [ ] Determine whether native actor already embeds it.
- [ ] Avoid duplicate equipment creation.
- [ ] Preserve Talent source lineage.
- [ ] Refresh on rank change.
- [ ] Route attacks through normal weapon architecture.

—

# 124. Deployable TODO

- [ ] Walk unlocked rank \`deployables[]\`.
- [ ] Resolve native deployable data.
- [ ] Trace placement flow.
- [ ] Preserve Talent source.
- [ ] Respect rank availability.
- [ ] Reuse common deployable subsystem.

—

# 125. Smoke Test — Talent Rank Aggregation

- [ ] rank 1 Talent exposes rank 1 actions.
- [ ] rank 2 exposes rank 1 + rank 2 actions.
- [ ] rank 3 exposes all actions.
- [ ] bonuses aggregate correctly.
- [ ] counters aggregate correctly.
- [ ] synergies aggregate correctly.
- [ ] Frame Conn does not show locked-rank actions.

—

# 126. Smoke Test — Native Talent Bonus

- [ ] structured Talent bonus applies natively.
- [ ] Frame Conn does not duplicate bonus.
- [ ] rank increase activates newly unlocked bonus.
- [ ] rank decrease removes no-longer-unlocked bonus.

—

# 127. Smoke Test — Generic Talent Action

- [ ] exact Talent/rank action path preserved.
- [ ] correct action category shown.
- [ ] correct frequency shown.
- [ ] generic ActivationFlow launches.
- [ ] action economy spent exactly once.
- [ ] frequency consumed exactly once.
- [ ] failed/cancelled native flow does not falsely consume use.
- [ ] native chat output preserved.

—

# 128. Smoke Test — Talent Counter

- [ ] native counter discovered.
- [ ] current/min/max values correct.
- [ ] decrement persists.
- [ ] increment persists.
- [ ] max respected.
- [ ] min respected.
- [ ] rank change reconciles resource.
- [ ] Frame Conn rerender preserves state.

—

# 129. Smoke Test — 1/Turn Talent

- [ ] first use succeeds.
- [ ] second use same turn blocked.
- [ ] next valid turn restores availability.
- [ ] counter state remains independent.
- [ ] other Talent frequencies remain independent.

—

# 130. Smoke Test — 1/Round Talent

- [ ] first use succeeds.
- [ ] another actor turn does not reset it.
- [ ] next round resets it.
- [ ] scene/mission state unaffected.

—

# 131. Smoke Test — 1/Scene Talent

- [ ] first use succeeds.
- [ ] turn/round changes do not reset it.
- [ ] same-scene second use blocked.
- [ ] correct scene lifecycle restores it.
- [ ] state persists through UI reopen.

—

# 132. Smoke Test — Integrated Talent Weapon

- [ ] unlocked Talent grants integrated weapon.
- [ ] locked rank does not grant weapon.
- [ ] native weapon data used.
- [ ] native Limited resource used.
- [ ] Frame Conn does not duplicate Limited tracking.
- [ ] weapon attacks through normal attack flow.

—

# 133. Smoke Test — Nuclear Cavalier

- [ ] Danger Zone detected correctly.
- [ ] first qualifying attack state tracked.
- [ ] entering Danger Zone mid-turn affects next qualifying attack.
- [ ] Rank 1 modifier applied once.
- [ ] Rank 2 modifier applied correctly.
- [ ] Fuel Rod Gun appears at Rank 3.
- [ ] Fuel Rod Gun Limited 3 uses native item state.
- [ ] on-attack Heat clearing resolves correctly.

—

# 134. Smoke Test — Leader

- [ ] Leadership Dice authoritative resource identified.
- [ ] rank-dependent capacity correct.
- [ ] initial/current pool correct.
- [ ] spend decrements source pool.
- [ ] transfer decrements source and grants recipient state.
- [ ] recipient can return die.
- [ ] return restores source pool.
- [ ] recipient can spend die when rank permits.
- [ ] transferred die expires correctly.
- [ ] Rest recovery correct.
- [ ] Full Repair recovery correct.
- [ ] Reaction upgrade uses shared Reaction subsystem.

—

# 135. Important Invariants

**Invariant 1**

Pilot Talents are native structured items with ranks, not merely prose.

**Invariant 2**

\`system.curr_rank\` is the authoritative unlocked Talent rank.

**Invariant 3**

Native runtime aggregates unlocked Talent actions, bonuses, counters, and synergies.

**Invariant 4**

Structured Talent bonuses should remain native-authoritative.

**Invariant 5**

Native TalentFlow is chat/presentation only.

**Invariant 6**

Structured Talent actions may execute through generic ActivationFlow.

**Invariant 7**

Generic ActivationFlow does not enforce ordinary Talent ActionData frequency.

**Invariant 8**

Talent frequency should use the shared actor-owned frequency tracker.

**Invariant 9**

Native Talent Counters should be reused as authoritative mutable resources where present.

**Invariant 10**

Counters, frequency, action economy, and Limited resources are separate mechanics.

**Invariant 11**

Talent integrated equipment and deployables may need direct unlocked-rank discovery because runtime flattening is incomplete.

**Invariant 12**

Conditional Talent effects require shared trigger/event handling where native synergies do not fully automate them.

**Invariant 13**

Cross-actor Talent resource transfer requires Frame Conn orchestration.

**Invariant 14**

Talent-specific mechanics should compose shared attack, status, AoE, movement, save, Reaction, Protocol, frequency, counter, and lifecycle subsystems.

**Invariant 15**

Frame Conn should add only the missing runtime layer rather than recreating native Talent definitions or structured bonuses.

—

# 136. Final Working Model

PILOT
│
└── TALENTS
    │
    ├── TALENT ITEM
    │   ├── curr_rank
    │   └── ranks[]
    │       ├── name
    │       ├── description
    │       ├── actions[]
    │       ├── bonuses[]
    │       ├── counters[]
    │       ├── synergies[]
    │       ├── integrated[]
    │       └── deployables[]
    │
    ├── NATIVE UNLOCKED-RANK AGGREGATION
    │   ├── actions
    │   ├── bonuses
    │   ├── counters
    │   └── synergies
    │
    ├── NATIVE AUTOMATION
    │   ├── structured Talent bonuses
    │   ├── native mutable CounterData
    │   ├── generic ActivationFlow
    │   └── TalentFlow for chat presentation
    │
    ├── FRAME CONN ACTOR-OWNED REGISTRY
    │   ├── preserve Pilot source
    │   ├── preserve Talent UUID
    │   ├── preserve rank
    │   ├── preserve exact action path
    │   ├── preserve activation
    │   ├── preserve frequency
    │   ├── preserve counter references
    │   └── choose execution strategy
    │
    ├── SHARED FREQUENCY TRACKER
    │   ├── unlimited
    │   ├── 1/turn
    │   ├── 1/round
    │   ├── 1/scene
    │   ├── 1/encounter
    │   └── 1/mission
    │
    ├── SHARED COUNTER RESOURCE ADAPTER
    │   ├── read
    │   ├── spend
    │   ├── restore
    │   └── enforce min/max
    │
    ├── SHARED TRIGGER / EFFECT LIFECYCLE
    │   ├── turn/round events
    │   ├── attack events
    │   ├── Danger Zone events
    │   ├── damage events
    │   ├── Rest
    │   ├── Full Repair
    │   └── scene expiration
    │
    └── SOURCE-SPECIFIC TALENT STRATEGIES
        │
        ├── NUCLEAR CAVALIER
        │   ├── Danger Zone conditional attack state
        │   ├── first qualifying attack tracking
        │   └── integrated Fuel Rod Gun
        │
        └── LEADER
            ├── Leadership Dice resource
            ├── spend
            ├── transfer
            ├── return
            ├── ally use
            ├── Reaction upgrade
            └── Rest / Full Repair recovery

The critical architectural rule is:

**Native Lancer already provides the Talent definitions, unlocked-rank structure, structured bonuses, structured actions, mutable counters, synergies, and much of the underlying item machinery. Frame Conn should supply the runtime layer the native system lacks: generalized frequency tracking, counter-resource semantics, triggers, temporary effect lifecycle, cross-actor resource transfer, action-economy integration, and source-specific orchestration for complex Talents such as Leader and Nuclear Cavalier.**
`;

fs.writeFileSync(“talents.md”, content, “utf8”);

console.log(
  `Wrote talents.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);