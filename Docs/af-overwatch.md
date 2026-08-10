# Overwatch

# AF — Overwatch

## Status

**Native dedicated Overwatch execution flow:** Not found.

**Native automatic movement-trigger detection:** Not found.

**Native Threat representation:** Found.

**Native Reaction tracking:** Found.

**Native Reaction refresh behavior:** Found.

**Native Overwatch semantic identity:** Found.

**Native individual weapon attack execution:** Found.

**Frame Helm implementation status:** Frame Helm should own Overwatch opportunity generation, Threat-exit detection, Reaction legality, mount selection, triggering-target binding, and higher-order attack sequencing while delegating individual weapon attacks to native Lancer weapon execution.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Overwatch** Reaction and defines the intended Frame Helm implementation boundary.

Repository investigation did not reveal a dedicated executable Overwatch flow such as:

`OverwatchFlow`

or:

`beginOverwatchFlow()`

The native system does, however, already provide the important lower-level primitives needed to construct Overwatch correctly:

- weapon Threat ranges;
- Reaction availability;
- Reaction refresh behavior;
- Overwatch semantic identity;
- mounted weapon/loadout data;
- individual weapon attack execution through `WeaponAttackFlow`.

Therefore:

> Frame Helm should own the higher-order Overwatch reaction architecture.

while:

> Native Lancer should remain authoritative for individual weapon attack execution and weapon mechanics.

Overwatch should reuse the same mount-level attack structure established for Skirmish:

`one selected mount`
→ `one fixed target`
→ `one or two participating weapons`
→ `all participating weapons attack that same target`

The major difference is that the target is not freely chosen.

The target is the character whose movement triggered Overwatch.

—

# 1. Overwatch Classification

Overwatch is a **Reaction**.

Its execution depends on a triggering movement event.

Therefore Overwatch is not a normal free-standing attack action.

Its architecture requires:

- movement observation;
- Threat geometry;
- trigger qualification;
- Reaction availability;
- target binding;
- mount selection;
- attack sequencing.

This makes Overwatch inherently cross-domain.

Relevant Frame Helm domains include:

- Movement;
- Turn;
- Actions;
- targeting;
- weapon/mount resolution;
- reaction presentation.

—

# 2. Native Overwatch Flow Search

Repository searching did not identify:

- `OverwatchFlow`
- `beginOverwatchFlow()`
- dedicated Overwatch actor method
- dedicated Overwatch flow file
- dedicated Overwatch application
- dedicated Overwatch target-selection handler
- automatic movement-triggered Overwatch executor

Therefore Frame Helm cannot delegate the complete Overwatch action to a native flow.

—

# 3. Native Overwatch Semantic Identity

The repository recognizes:

`overwatch`

as a native synergy/action location.

This exists in the same semantic family as actions such as:

- `skirmish`
- `barrage`
- `boost`
- `disengage`
- `brace`

This means native actor-owned content may refer to Overwatch as a meaningful action/event location.

Therefore Frame Helm should preserve:

`Overwatch occurred`

as a semantic action event for future integration with:

- Mounted Systems;
- Mech Traits;
- Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

—

# 4. Native Reaction Tracking

The repository contains native action-tracker state equivalent to:

`actor.system.action_tracker.reaction`

and:

`actor.system.action_tracker.used_reactions`

The generic action tracker can spend and refresh Reaction availability.

Conceptually:

Reaction available
→ Reaction used
→ reaction = false

This native primitive may be reusable by Frame Helm.

However, Frame Helm already has its own Turn-level Reaction state.

The project should choose one authoritative reaction model or explicitly reconcile the two.

Do not allow two unsynchronized Reaction states to coexist indefinitely.

—

# 5. Native Reaction Refresh

Native combat automation refreshes Reactions when a new combatant begins a turn.

The discovered native behavior conceptually does:

new combatant turn begins
→ iterate combatants
→ refresh Reaction availability

This is important because Lancer’s reaction timing is broader than:

`refresh only on your own turn`

Frame Helm should preserve the native timing semantics.

—

# 6. Native `used_reactions`

The actor action tracker also contains:

`used_reactions`

However, repository research has not yet established whether this is:

- currently authoritative;
- used only by named reactions;
- unfinished infrastructure;
- legacy state;
- consumed by other modules.

No Overwatch-specific runtime path was found populating it.

Therefore Frame Helm should not yet depend on this field for Overwatch identity/history.

—

# 7. Native Threat Representation

The native Lancer system represents weapon Threat using:

`RangeType.Threat`

Weapon data therefore already contains authoritative Threat information.

Frame Helm should not invent separate Threat values.

The Overwatch trigger engine should inspect native weapon/mount data.

Conceptually:

actor
→ loadout
→ mount
→ weapon
→ ranges
→ Threat

—

# 8. Native Threat Is a Weapon Property

Threat belongs to weapons rather than to the actor as one universal value.

Therefore an actor may have:

- multiple weapons;
- different Threat values;
- mounts with different eligible Overwatch ranges.

This means Overwatch trigger generation cannot simply ask:

`what is this actor’s Threat?`

It needs to inspect the actor’s actual mounted weapons and determine whether at least one legal Overwatch mount could threaten the mover.

—

# 9. Native Token Movement Does Not Generate Overwatch

The native repository’s token-update logic does not appear to evaluate movement for Overwatch.

The inspected `updateToken` hook effectively ignores ordinary X/Y movement for its Action Manager path.

Conceptually:

token X/Y changed
→ ordinary movement
→ return

No native logic was found performing:

token movement
→ inspect hostile Threat
→ detect leaving Threat
→ prompt Overwatch

Therefore Frame Helm must own the missing movement-trigger layer.

—

# 10. Frame Helm Movement Integration

Frame Helm’s Movement feature already interprets token movement.

Relevant existing concepts include:

- origin;
- destination;
- movement distance;
- movement method;
- movement IDs;
- movement segments;
- elevation movement;
- movement tracking.

Therefore Overwatch opportunity generation should plug into this existing movement pipeline.

Conceptually:

Foundry token moves
→ Frame Helm Movement interprets segment
→ record movement
→ evaluate reaction triggers
→ Overwatch opportunities generated if legal

—

# 11. Core Overwatch Trigger

The high-level trigger architecture should be:

movement segment occurs
→ resolve moving character
→ resolve hostile characters
→ for each hostile character:
   inspect Reaction availability
   inspect legal threatening weapon mounts
   determine whether mover exits relevant Threat
→ if qualifying Threat exit occurs:
   create Overwatch opportunity

The exact rule wording for what constitutes leaving Threat should remain authoritative.

Do not implement geometry solely from assumption.

—

# 12. Disengage Suppression

Disengage should be checked before Overwatch opportunity generation.

Conceptually:

movement segment occurs
→ is mover currently Disengaging?

YES
→ track movement normally
→ suppress Overwatch opportunity generation

NO
→ continue Threat evaluation

Therefore Disengage should not:

- remove native `engaged`;
- modify the eventual Overwatch attack;
- cancel damage after the attack.

It should prevent the reaction opportunity from being generated in the first place.

—

# 13. Preferred Trigger Pipeline

The preferred conceptual order is:

movement occurs
→ resolve mover
→ is mover Disengaging?
   ├── YES
   │   → no Overwatch evaluation
   │
   └── NO
       → identify hostile actors
       → resolve threatening mounts
       → evaluate Threat exit
       → check Reaction availability
       → create Overwatch opportunity

This keeps Disengage inexpensive and clean.

—

# 14. Threat Exit Geometry

Frame Helm will need a geometry service capable of determining whether a movement segment qualifies as leaving hostile Threat.

Conceptually:

origin
→ was mover within weapon Threat?

movement path
→ did mover leave that Threat?

destination
→ where did mover end?

The exact algorithm should account for:

- Foundry grid measurement;
- token size;
- scene scale;
- movement path;
- possibly elevation;
- weapon Threat values.

—

# 15. Endpoint Alone May Be Insufficient

Overwatch trigger logic should not assume only origin and destination matter.

Potential cases include:

- starting inside Threat and exiting;
- crossing through Threat;
- moving along the edge of Threat;
- moving through multiple hostile Threat areas;
- movement split into multiple segments.

The exact tabletop trigger should determine which of these qualify.

Frame Helm’s Movement feature should preserve enough path/segment information for the Overwatch evaluator.

—

# 16. Elevation

Because Frame Helm is tracking elevation movement as movement expenditure, Overwatch geometry may eventually need to account for vertical separation where relevant.

The Threat model should remain consistent with Foundry/Lancer distance measurement.

Do not hard-code purely two-dimensional Threat if the native game state and scene geometry require otherwise.

—

# 17. Hostile Character Discovery

Overwatch opportunity generation must identify relevant hostile actors.

Potential inputs include:

- token disposition;
- actor identity;
- scene presence;
- target ownership;
- defeated state;
- Shutdown state;
- reaction availability;
- weapon loadout.

The exact hostility helper should prefer native Foundry/Lancer relationships where available.

Do not infer hostility solely from token color if a stronger native source exists.

—

# 18. Reaction Availability Check

A hostile character without an available Reaction should not receive a usable Overwatch opportunity.

Conceptually:

Threat exit detected
→ hostile actor has Reaction?

NO
→ discard opportunity

YES
→ continue

This should occur before presenting Overwatch UI.

—

# 19. Overwatch and Shutdown

A Shut Down character may not be eligible to Overwatch depending on confirmed Lancer rules.

That legality belongs to the Overwatch evaluator.

Before implementation, confirm:

- whether Shut Down units can react;
- whether other statuses prevent Overwatch;
- whether destroyed/disabled weapon states affect eligibility.

Native weapon attack flow can handle some weapon-specific invalidity, but parent-level Overwatch legality should avoid presenting impossible choices where practical.

—

# 20. Overwatch Uses One Mount

Overwatch uses the same attack structure as Skirmish:

`one mount`

That selected mount may contain:

- one participating weapon;
- two participating weapons.

Superheavy weapons cannot Skirmish and therefore should not normally be legal Overwatch mount choices.

This should reuse the Skirmish mount-eligibility logic rather than duplicating it.

—

# 21. Overwatch Targeting Rule

The Overwatch target is fixed:

`the character whose movement triggered the reaction`

The player should not be asked to select an arbitrary target.

Conceptually:

Mover triggers Overwatch
→ mover becomes Overwatch target
→ choose mount
→ all participating weapons attack mover

This is a key difference from ordinary Skirmish.

—

# 22. Same-Target Mount Rule

If the selected Overwatch mount contains two participating weapons, both attack the triggering mover.

Examples:

Main/Aux:

Main Weapon
+
Auxiliary Weapon
→ same triggering target

Aux/Aux:

Auxiliary Weapon A
+
Auxiliary Weapon B
→ same triggering target

Flexible with two Auxiliary weapons:

both
→ same triggering target

This matches the mount-level targeting invariant established in `af-skirmish.md`.

—

# 23. Shared Mount Attack Group

Overwatch should reuse the shared Mount Attack Group concept.

Conceptually:

MountAttackGroup
→ selected mount
→ participating weapons
→ one target
→ execution progress

For Overwatch:

target =
triggering mover

For Skirmish:

target =
player-selected character

The lower-level attack grouping is otherwise substantially the same.

—

# 24. Native Weapon Execution

The native individual weapon attack entry point remains:

`weapon.beginWeaponAttackFlow()`

which constructs:

`WeaponAttackFlow`

This flow already handles important native weapon concerns including:

- destroyed weapon validation;
- Loading;
- Limited;
- charged state;
- attack tags;
- attack effects;
- targeting;
- Accuracy/Difficulty;
- attack modifiers;
- self Heat;
- post-action weapon mutation;
- native chat output.

Frame Helm should reuse this native attack machinery.

—

# 25. Native `WeaponAttackFlow`

The previously traced native weapon attack sequence includes:

`initAttackData`
→ `checkItemDestroyed`
→ `checkWeaponLoaded`
→ `checkItemLimited`
→ `checkItemCharged`
→ `setAttackTags`
→ `setAttackEffects`
→ `setAttackTargets`
→ `showAttackHUD`
→ `rollAttacks`
→ `applySelfHeat`
→ `updateItemAfterAction`
→ `printAttackCard`

Overwatch should not reimplement these lower-level steps.

—

# 26. Target Injection

Because the Overwatch target is fixed by the trigger, Frame Helm should eventually supply that target directly to the native weapon flow if the native API permits it.

Research is still required to determine:

- whether `WeaponAttackFlow` accepts initial target data;
- whether `setAttackTargets` reads `game.user.targets`;
- whether Frame Helm can prepopulate target state;
- whether the native attack HUD may alter the target.

Until that is confirmed, the first implementation may use Foundry target state as an adapter.

—

# 27. Do Not Prompt for Target

Overwatch should not perform the normal Frame Helm target-selection interaction.

Wrong:

Overwatch triggers
→ choose mount
→ switch to target tool
→ choose arbitrary target

Correct:

Overwatch triggers
→ triggering mover already is target
→ choose mount
→ attack triggering mover

The trigger itself resolves the target.

—

# 28. Proposed Initial Overwatch Flow

The initial Frame Helm execution should be:

token movement occurs
→ Frame Helm Movement records movement segment
→ confirm mover is not Disengaging
→ discover hostile characters
→ inspect hostile Threat
→ detect qualifying Threat exit
→ verify hostile Reaction availability
→ create Overwatch opportunity
→ player chooses whether to react
→ if declined:
   dismiss opportunity
→ if accepted:
   resolve hostile acting actor
   choose one legal Overwatch mount
   bind triggering mover as target
   spend Reaction
   resolve participating weapon(s)
   execute first weapon through native WeaponAttackFlow
   execute second weapon if present against same target
→ complete Overwatch reaction
→ refresh Frame Helm state/presentation

—

# 29. Opportunity vs Execution

Overwatch should distinguish:

`opportunity generated`

from:

`reaction accepted`

An opportunity should not spend the Reaction merely because movement created it.

Conceptually:

Threat exit
→ Overwatch available
→ player chooses:

[ Overwatch ]
or
[ Decline ]

Only accepting the reaction should spend the Reaction.

—

# 30. Opportunity State

A Frame Helm Overwatch opportunity may need to contain:

- triggering movement ID;
- mover token/actor ID;
- reacting actor/token ID;
- qualifying threatening mount IDs;
- relevant Threat values;
- origin;
- destination;
- movement timestamp;
- expiration state.

This is conceptual only.

The exact shape should be designed during implementation.

—

# 31. Opportunity Expiration

Overwatch opportunities should not remain valid indefinitely.

Potential expiration boundaries include:

- after the triggering movement resolves;
- after another action advances game state;
- after the reacting player declines;
- after Reaction is spent elsewhere;
- after combat turn changes.

The exact rules/UI behavior should be determined before implementation.

—

# 32. Multiple Hostile Overwatch Opportunities

One movement event may potentially trigger multiple hostile characters.

Frame Helm should support:

one mover
→ multiple hostile Overwatch opportunities

Each reacting hostile actor independently checks:

- Threat;
- Reaction availability;
- mount eligibility.

Disengage suppresses all qualifying movement-triggered opportunities for the mover while active.

—

# 33. Multiple Threatening Mounts

A hostile actor may have more than one mount capable of Overwatching the mover.

The opportunity should therefore present legal mount choices.

Conceptually:

OVERWATCH

Trigger:
Enemy left your Threat.

Choose mount:

[ Main/Aux ]
  Main Weapon
  Auxiliary Weapon

[ Heavy ]
  Heavy Weapon

[ Aux/Aux ]
  Aux Weapon A
  Aux Weapon B

The selector should reuse Skirmish mount presentation infrastructure.

—

# 34. Threat Value Per Mount

Because weapons may have different Threat ranges, the mount resolver needs to know whether the selected mount actually threatened the mover at the relevant trigger point.

A mount should not appear as a legal Overwatch option merely because another weapon on the actor had sufficient Threat.

Frame Helm should preserve the relationship:

qualifying Threat
→ eligible mount

rather than:

actor has any Threat
→ all mounts legal.

—

# 35. Mixed-Weapon Mount Threat

A mount containing two weapons may have different Threat values.

Research is required to determine the exact Lancer rule for mount-level Overwatch eligibility when:

Weapon A Threat = X

Weapon B Threat = Y

Questions include:

- does the mount qualify if either weapon threatened the mover?
- may only the threatening weapon attack?
- do both weapons attack if the mount is selected?
- does auxiliary weapon participation depend on its own Threat?

These should be confirmed from rules before final implementation.

Do not infer from Skirmish alone.

—

# 36. Superheavy Exclusion

Superheavy weapons cannot Skirmish and therefore should not normally appear as legal Overwatch choices.

Preferred filtering should use native weapon size/type data.

Do not filter by displayed weapon name.

The same shared legality resolver used by Skirmish should handle this.

—

# 37. Action Economy Ownership

Overwatch consumes:

**one Reaction**

It does not consume a Quick Action.

The individual weapon attacks performed as part of Overwatch do not independently spend Turn action budget.

Conceptually:

Overwatch parent
→ spend Reaction

WeaponAttackFlow A
→ mechanical attack execution only

WeaponAttackFlow B
→ mechanical attack execution only

Do not allow native sub-attacks to create additional Frame Helm action expenditure.

—

# 38. Reaction Expenditure Timing

The exact point at which Reaction is spent should be deliberate.

Potential policy:

player accepts Overwatch
→ spend Reaction immediately
→ then select/execute mount

This prevents the user from accepting multiple concurrent reactions with the same Reaction resource.

However, cancellation semantics need consideration.

If the user accepts but then cancels mount selection, should the Reaction remain spent?

The tabletop rules and intended UX should guide this.

—

# 39. Cancellation

Possible interruption cases include:

- player declines Overwatch;
- player accepts then cancels;
- no legal mount remains;
- selected weapon is destroyed;
- Loading prevents attack;
- Limited resources unavailable;
- target disappears;
- combat advances;
- native attack flow aborts.

Frame Helm should distinguish:

opportunity declined

from:

accepted reaction failed

from:

partially executed reaction

The exact Reaction refund policy should be explicit.

—

# 40. Partial Execution

A two-weapon Overwatch mount can partially execute.

Example:

Weapon A resolves
→ Weapon B is cancelled

Frame Helm should not assume Weapon A can be rolled back.

Potential Overwatch execution states include:

- offered;
- declined;
- accepted;
- first weapon pending;
- first weapon completed;
- second weapon pending;
- completed;
- cancelled;
- failed.

This can reuse the same compound execution model considered for Skirmish/Barrage.

—

# 41. Committed Plan Relationship

Overwatch is not normally a player-planned action in the same sense as a Quick or Full Action.

It arises reactively.

Therefore it may not belong in the ordinary Committed Plan before its trigger exists.

Instead, Frame Helm may expose reaction opportunities through a dedicated reaction UI.

Conceptually:

MOVEMENT TRIGGER

`OVERWATCH AVAILABLE                     [React]`

After acceptance, the reaction may appear in turn history/execution history.

The exact presentation belongs to `UI_turn` / reaction UI architecture.

—

# 42. Prepare Interaction

Prepare may create reactions with their own triggers.

Therefore Overwatch should be implemented within a generic enough Reaction opportunity architecture that future prepared actions can coexist with it.

Do not hard-code the entire reaction system around Overwatch only.

Potential generic concept:

ReactionOpportunity

with fields such as:

- trigger;
- reacting actor;
- action identity;
- target/context;
- expiration;
- legality.

Exact names are illustrative only.

—

# 43. Brace Interaction

Brace is another universal Reaction.

Therefore Overwatch and Brace should share:

- canonical Reaction availability;
- reaction expenditure;
- reaction history;
- reaction opportunity UI infrastructure.

They should not share attack-specific mechanics.

Brace:
→ incoming attack/effect trigger
→ defensive consequence

Overwatch:
→ hostile movement trigger
→ offensive mount attack

—

# 44. Disengage Interaction

Disengage exists specifically in the movement-trigger boundary.

Conceptually:

movement
→ Disengage active?
   YES
   → suppress Overwatch opportunity
   NO
   → evaluate Threat

Therefore `af-disengage.md` and `af-overwatch.md` should be implemented as complementary pieces of the same Movement/Reaction integration.

—

# 45. Grapple / Forced Movement Considerations

Research is required for movement that is not ordinary voluntary movement.

Examples:

- Grapple movement;
- Knockback;
- involuntary movement;
- repositioning effects;
- teleportation.

Questions include:

- can they trigger Overwatch?
- does Disengage suppress them?
- is the mover considered to have voluntarily left Threat?

The Movement feature should classify movement method/context so the Overwatch evaluator can apply correct rules.

—

# 46. Teleportation

Teleportation often has special movement-trigger rules.

This should be resolved through the movement-variant architecture documented separately.

Overwatch should consume an interpreted movement classification rather than infer trigger legality solely from coordinate change.

—

# 47. Native Engaged Status

Overwatch should not depend exclusively on:

`actor.system.statuses.engaged`

to determine Threat.

Engaged and Threat are related but not identical concepts.

Threat should come from native weapon range data.

A character can have different Threat ranges across weapons.

Therefore Overwatch geometry should be weapon/mount-aware.

—

# 48. Native Attack Engaged Penalty

The native attack Accuracy/Difficulty system already knows how to apply the Engaged penalty to relevant ranged attacks.

If an Overwatch weapon attack occurs while the reacting character is Engaged, native `WeaponAttackFlow` should remain authoritative for that attack modifier.

Frame Helm should not duplicate this calculation.

—

# 49. Lock On Interaction

Native WeaponAttackFlow already participates in native Lock On consumption behavior.

Therefore an Overwatch attack against a target with Lock On should preserve that native behavior where allowed by the rules.

Frame Helm should not special-case Lock On inside Overwatch unless needed.

—

# 50. Weapon Resource Handling

Native weapon execution should continue to own:

- Loading;
- Limited;
- Charged;
- destroyed state;
- self Heat;
- weapon item mutation.

Overwatch orchestration should not manually consume those resources.

—

# 51. Future Damage Automation

In the first implementation, Overwatch weapon attacks can reuse native attack HUD/flow.

Eventually Frame Helm may automate:

target fixed by trigger
→ derive Accuracy/Difficulty
→ roll attack
→ determine hit
→ roll damage
→ apply damage
→ apply deterministic effects

When that happens, the native damage endpoint discovered during Brace research should remain preferred:

`LancerActor.damageCalc(...)`

Frame Helm should not recreate Armor/Resistance/etc.

—

# 52. Semantic Trigger Integration

Because native Lancer recognizes:

`overwatch`

as a synergy location, Frame Helm should eventually emit/expose an Overwatch semantic event.

Conceptually:

Overwatch accepted
→ Overwatch executed
→ trigger system inspects actor-owned content

Possible effects may reference:

- when you Overwatch;
- after you Overwatch;
- when you attack as a Reaction;
- when an enemy leaves your Threat.

The exact native structured metadata should be researched later.

—

# 53. Do Not Parse Text First

If native content exposes structured synergy/action metadata for Overwatch, use that.

Preferred hierarchy:

1. native structured synergy/action metadata;
2. native weapon/action metadata;
3. explicit Frame Helm adapter;
4. prose parsing only when unavoidable.

—

# 54. Native-System Boundary

The intended responsibility split is:

**FRAME HELM OWNS:**

- movement-trigger observation;
- Disengage suppression;
- hostile actor discovery;
- Threat-exit evaluation;
- Overwatch opportunity creation;
- opportunity expiration;
- Reaction legality;
- Reaction expenditure;
- Overwatch mount selection;
- triggering-target binding;
- mount attack sequencing;
- Overwatch execution state;
- reaction presentation;
- semantic Overwatch event.

**NATIVE LANCER OWNS:**

- weapon Threat values;
- weapon range types;
- weapon loadout data;
- individual weapon attack execution;
- Accuracy/Difficulty;
- Lock On consumption;
- Engaged attack penalties;
- weapon resources/state;
- self Heat;
- native attack chat output;
- downstream damage machinery where used.

—

# 55. Shared Skirmish Infrastructure

Overwatch should reuse as much Skirmish infrastructure as possible.

Shared:

- mount enumeration;
- mount legality;
- Superheavy exclusion;
- participating weapon resolution;
- one-target-per-mount invariant;
- sequential native weapon execution;
- partial execution tracking.

Different:

Skirmish:
→ Quick Action
→ target chosen by player

Overwatch:
→ Reaction
→ target fixed by movement trigger

Therefore the relationship is:

Overwatch
≈ reaction-triggered Skirmish orchestration

but Overwatch should still have its own parent action identity and rules.

—

# 56. Suggested Shared Architecture

Conceptually:

Movement Feature
→ Reaction Trigger Evaluator
→ Overwatch Opportunity

then:

Overwatch Execution Service
→ Mount Resolver
→ Mount Attack Group
→ Native Lancer Adapter
→ `WeaponAttackFlow`

This avoids embedding weapon attack logic directly into Movement.

Movement should detect the trigger.

Actions/Reaction execution should perform the attack.

—

# 57. Dependency Direction

Preferred dependency direction:

Foundry token movement
→ Movement interpretation
→ Overwatch trigger evaluation
→ Reaction opportunity state
→ UI reaction presentation
→ Overwatch execution service
→ mount resolver
→ native-system adapter
→ WeaponAttackFlow

This keeps geometry, presentation, and native execution separated.

—

# 58. Do Not Invent `OverwatchFlow`

No native `OverwatchFlow` was found.

Frame Helm may have an internal Overwatch execution service, but it should not pretend to call a nonexistent native Lancer workflow.

The native boundary is:

weapon data
+
Reaction primitives
+
WeaponAttackFlow

not:

OverwatchFlow.

—

# 59. Immediate Repository Research TODO

- [ ] Trace `RangeType.Threat` completely.
- [ ] Trace native weapon range structures.
- [ ] Determine how Threat values are resolved from equipped weapons.
- [ ] Determine whether native helpers already compute maximum Threat.
- [ ] Determine whether native helpers already test range between tokens.
- [ ] Trace actor token-size/range utilities.
- [ ] Trace reaction action-tracker state completely.
- [ ] Trace `used_reactions`.
- [ ] Determine whether Frame Helm should synchronize native `reaction`.
- [ ] Trace native Reaction refresh hook completely.
- [ ] Trace `WeaponAttackFlow` target initialization.
- [ ] Determine whether target can be injected directly.
- [ ] Determine whether global Foundry target state is required.
- [ ] Determine cancellation behavior of WeaponAttackFlow.
- [ ] Determine whether native mount helpers expose Overwatch-eligible weapons.
- [ ] Determine how native weapon size identifies Superheavy.
- [ ] Determine whether destroyed/disabled mounts can be filtered before flow launch.

—

# 60. Rules Research TODO

Before final Overwatch implementation:

- [ ] Confirm exact Overwatch trigger wording.
- [ ] Confirm whether trigger is specifically leaving Threat.
- [ ] Confirm whether crossing Threat without starting inside triggers.
- [ ] Confirm whether involuntary movement triggers.
- [ ] Confirm whether Teleport triggers.
- [ ] Confirm whether Grapple movement triggers.
- [ ] Confirm whether Knockback triggers.
- [ ] Confirm interaction with Disengage.
- [ ] Confirm eligible weapon/mount rules.
- [ ] Confirm mixed-Threat mount behavior.
- [ ] Confirm whether all weapons on selected mount attack if only one weapon threatened.
- [ ] Confirm interaction with special weapon ranges.
- [ ] Confirm exact Reaction refresh timing.
- [ ] Confirm whether a character can Overwatch more than once during another character’s turn via special rules.
- [ ] Confirm how special reaction-granting talents/systems interact.

—

# 61. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add generic Reaction opportunity infrastructure.
- [ ] Add Overwatch trigger evaluator.
- [ ] Integrate with Movement segments.
- [ ] Check Disengage before evaluating Threat.
- [ ] Discover hostile actors.
- [ ] Resolve threatening mounts.
- [ ] Evaluate Threat exits.
- [ ] Check Reaction availability.
- [ ] Create Overwatch opportunity.
- [ ] Add reaction opportunity UI.
- [ ] Allow player to accept or decline.
- [ ] Bind triggering mover as target.
- [ ] Reuse Skirmish mount selector.
- [ ] Filter to Overwatch-legal mounts.
- [ ] Spend Reaction through canonical state.
- [ ] Resolve participating weapons.
- [ ] Execute first weapon through native adapter.
- [ ] Execute second weapon if applicable.
- [ ] Preserve same triggering target.
- [ ] Track partial execution.
- [ ] Handle cancellation/failure.
- [ ] Expire opportunity correctly.
- [ ] Emit semantic Overwatch event.
- [ ] Refresh Frame Helm state/presentation.
- [ ] Reconcile native Reaction state if used.
- [ ] Smoke-test single hostile Threat.
- [ ] Smoke-test multiple hostile Threats.
- [ ] Smoke-test multiple threatening mounts.
- [ ] Smoke-test Disengage suppression.
- [ ] Smoke-test Reaction already spent.
- [ ] Smoke-test two-weapon mount.
- [ ] Smoke-test Superheavy exclusion.
- [ ] Smoke-test Loading/Limited weapon.
- [ ] Smoke-test movement variants.
- [ ] Smoke-test opportunity expiration.

—

# 62. Important Invariants

**Invariant 1**

Overwatch is a Reaction.

**Invariant 2**

No dedicated native `OverwatchFlow` was found.

**Invariant 3**

Native Lancer does not appear to automatically generate Overwatch from token movement.

**Invariant 4**

Native weapon Threat data should remain authoritative.

**Invariant 5**

Frame Helm Movement should own trigger detection.

**Invariant 6**

Disengage suppresses Overwatch opportunity generation before the reaction is offered.

**Invariant 7**

Overwatch selects one eligible mount.

**Invariant 8**

The triggering mover is the fixed target.

**Invariant 9**

All participating weapons on the selected mount attack that same target.

**Invariant 10**

Individual weapon attacks should reuse native `WeaponAttackFlow` wherever practical.

**Invariant 11**

Overwatch consumes one Reaction, not a Quick Action.

**Invariant 12**

The individual weapon attacks do not independently consume Frame Helm action budget.

—

# 63. Final Working Model

OVERWATCH
│
├── Reaction
│
├── no native OverwatchFlow found
│
├── no native automatic movement trigger found
│
├── native semantic identity:
│   └── `overwatch`
│
├── native primitives:
│   ├── `RangeType.Threat`
│   ├── weapon Threat values
│   ├── Reaction availability
│   ├── Reaction refresh
│   └── `WeaponAttackFlow`
│
├── Frame Helm trigger layer:
│   ├── token movement
│   ├── mover identification
│   ├── Disengage check
│   ├── hostile discovery
│   ├── Threat-exit geometry
│   ├── Reaction legality
│   └── opportunity creation
│
├── Frame Helm execution layer:
│   ├── accept / decline
│   ├── choose one legal mount
│   ├── triggering mover fixed as target
│   ├── resolve 1–2 participating weapons
│   ├── spend Reaction
│   └── sequence attacks
│
└── Native Lancer execution:
    ├── WeaponAttackFlow A
    ├── WeaponAttackFlow B if applicable
    ├── same triggering target
    ├── native modifiers
    ├── native weapon state/resources
    └── native chat/damage pipeline

The critical architectural relationship is:

movement
→ Threat-exit detection
→ Overwatch opportunity
→ one-mount Skirmish-like attack
→ native individual weapon execution

with:

Disengage
→ suppress opportunity generation before Overwatch begins.
