# Grapple ram
cat > docs/af-grapple-ram.md <<‘EOF’
# AF — Grapple / Ram

## Status

**Native dedicated Grapple execution flow:** Not found.

**Native dedicated Ram execution flow:** Not found.

**Reusable native basic attack flow:** Found.

**Native Grapple-specific flat bonus:** Found.

**Native Ram-specific flat bonus:** Found.

**Native Grappled status identity:** Found.

**Native Prone status identity:** Found.

**Native Knockback semantic/tag support:** Found.

**Frame Helm implementation status:** Grapple and Ram should share a Frame Helm-owned basic maneuver attack orchestration layer over native `BasicAttackFlow`, with action-specific targeting, legality, flat bonuses, and post-hit consequences.

## Purpose

This document consolidates the repository findings for the universal **Grapple** and **Ram** Quick Actions.

The native Lancer repository does not appear to implement either action through a dedicated:

`GrappleFlow`

or:

`RamFlow`

However, both actions share the same lower-level architecture.

The native system already provides:

- actor-based basic melee attack execution;
- normal attack target handling;
- Accuracy/Difficulty processing;
- attack rolls;
- actor Grit;
- structured Grapple-specific bonuses;
- structured Ram-specific bonuses;
- native Grappled and Prone condition identities;
- generic Knockback semantics.

Therefore:

> Frame Helm should not build separate Grapple and Ram attack engines.

Instead:

> Frame Helm should implement one shared basic maneuver attack adapter over native `BasicAttackFlow`, then supply action-specific configuration and post-hit behavior.

Conceptually:

Basic Maneuver Attack
│
├── Grapple
│   ├── native BasicAttackFlow
│   ├── Grapple-specific flat bonus
│   └── Grapple-specific post-hit relationship/state
│
└── Ram
    ├── native BasicAttackFlow
    ├── Ram-specific flat bonus
    └── Ram-specific Prone / forced-movement consequences

—

# 1. Shared Classification

Both Grapple and Ram are **Quick Actions**.

Both involve an actor performing a basic melee-style attack rather than attacking with an equipped weapon.

Therefore neither action should be routed through:

`WeaponAttackFlow`

The relevant reusable native flow is:

`BasicAttackFlow`

constructed through:

`actor.beginBasicAttackFlow(...)`

—

# 2. Native Grapple Flow Search

Repository searching did not identify:

- `GrappleFlow`
- `beginGrappleFlow()`
- dedicated Grapple flow file
- dedicated Grapple actor method
- dedicated Grapple sheet handler
- dedicated Grapple application
- dedicated Grapple runtime relationship engine

Therefore Frame Helm cannot delegate the complete Grapple action to a native Grapple workflow.

—

# 3. Native Ram Flow Search

Repository searching did not identify:

- `RamFlow`
- `beginRamFlow()`
- dedicated Ram flow file
- dedicated Ram actor method
- dedicated Ram sheet handler
- dedicated Ram application
- dedicated Ram post-hit executor

Therefore Frame Helm cannot delegate the complete Ram action to a native Ram workflow.

—

# 4. Shared Native Entry Point

The native actor exposes:

`actor.beginBasicAttackFlow(title?)`

This constructs:

`BasicAttackFlow`

and provides the native attack machinery suitable for actor-based attacks that do not originate from a weapon item.

Conceptually:

Frame Helm maneuver
→ authoritative actor
→ `actor.beginBasicAttackFlow(...)`
→ `BasicAttackFlow`
→ native attack handling

This should be the preferred native roll boundary for both Grapple and Ram.

—

# 5. Native `BasicAttackFlow`

The discovered native basic attack flow contains:

`initAttackData`
→ `setAttackTags`
→ `setAttackEffects`
→ `setAttackTargets`
→ `showAttackHUD`
→ `rollAttacks`
→ `applySelfHeat`
→ `printAttackCard`

This gives Frame Helm reusable native support for:

- attack target handling;
- Accuracy/Difficulty UI;
- attack modifier machinery;
- attack rolling;
- native attack-card output.

Frame Helm should reuse these pieces.

—

# 6. Default Basic Attack Configuration

For an actor-only basic attack, the native flow defaults to a **Melee** attack.

For mechs, it uses the actor’s:

`system.grit`

as the ordinary attack basis.

Conceptually:

BasicAttackFlow
→ attack type = Melee
→ base attack bonus = mech Grit

This is useful for Grapple and Ram because both are actor-based melee maneuvers.

—

# 7. Important Native Limitation

The repository contains a TODO around actor-only basic attack flat bonuses.

The default `BasicAttackFlow` does not appear to automatically determine:

`this is Grapple`

or:

`this is Ram`

and therefore does not automatically add:

`system.bonuses.flat.grapple`

or:

`system.bonuses.flat.ram`

Simply calling:

`actor.beginBasicAttackFlow(“GRAPPLE”)`

or:

`actor.beginBasicAttackFlow(“RAM”)`

would therefore provide native attack machinery but may omit the action-specific flat bonus.

Frame Helm must account for this explicitly.

—

# 8. Native Grapple Bonus

The native actor bonus model contains:

`system.bonuses.flat.grapple`

This appears in the structured roll-bonus target model alongside other bonus categories such as:

- ranged attack;
- melee attack;
- tech attack;
- Ram;
- Hull;
- Agility;
- Systems;
- Engineering.

Native effect conversion also supports Grapple bonuses by mapping them into:

`system.bonuses.flat.grapple`

Therefore actor-owned systems, talents, and other native effects may mechanically grant Grapple bonuses through structured data.

Frame Helm should use this native field.

—

# 9. Native Ram Bonus

Likewise, the native actor bonus model contains:

`system.bonuses.flat.ram`

Native effect conversion can map a Ram-specific bonus into:

`system.bonuses.flat.ram`

Therefore Frame Helm should use the native structured Ram bonus rather than parsing actor feature text.

—

# 10. Shared Basic Maneuver Attack Adapter

The findings suggest a shared Frame Helm execution primitive.

Conceptually:

Basic Maneuver Attack
→ resolve actor
→ resolve target
→ validate maneuver-specific legality
→ construct/configure `BasicAttackFlow`
→ base attack = actor Grit
→ action-specific flat bonus
→ native Accuracy/Difficulty processing
→ native attack roll
→ determine success
→ action-specific post-hit effect

Then:

Grapple:

action-specific flat bonus =
`actor.system.bonuses.flat.grapple`

Ram:

action-specific flat bonus =
`actor.system.bonuses.flat.ram`

This avoids duplicating attack machinery.

—

# 11. Recommended Shared Responsibility Boundary

**FRAME HELM OWNS:**

- maneuver identity;
- Quick Action expenditure;
- target acquisition;
- adjacency validation;
- size/eligibility validation;
- action-specific flat bonus injection;
- interpretation of attack result;
- Grapple post-hit relationship/state;
- Ram post-hit Prone/forced movement;
- execution state;
- presentation refresh.

**NATIVE LANCER OWNS:**

- actor Grit;
- structured Grapple/Ram bonus storage;
- BasicAttackFlow;
- Accuracy/Difficulty;
- attack roll;
- native attack card;
- native status identities;
- generic effect/status infrastructure;
- generic Knockback semantics where useful.

—

# 12. Shared Targeting

Both Grapple and Ram require a target.

The likely Frame Helm execution pattern is:

Committed maneuver
→ click execute/d20
→ existing valid target?
   ├── YES
   │   → validate
   └── NO
       → switch Foundry to target-selection mode
       → player selects target
       → validate
→ execute maneuver

These actions should use Frame Helm’s general target acquisition architecture.

—

# 13. Adjacency

Grapple and Ram both depend on close-range positioning.

Frame Helm should validate the exact range/adjacency rule before launching the attack.

Conceptually:

acting token
→ target token
→ measure native/Foundry distance
→ confirm legal maneuver range
→ continue

The exact adjacency/Threat rule should come from confirmed Lancer rules.

Do not rely on visual proximity alone.

—

# 14. Size Legality

Both Grapple and Ram have size-related rules.

Frame Helm should validate these before rolling where possible.

The native basic attack flow does not appear to own Grapple/Ram-specific size legality.

Therefore the maneuver adapter should inspect authoritative actor/token Size data.

Before implementation, trace the native size field and any available helpers rather than hard-coding actor type assumptions.

—

# 15. Action Budget Ownership

Both actions consume:

**one Quick Action**

Frame Helm Turn state should remain authoritative for that expenditure.

The underlying `BasicAttackFlow` should not independently consume another Frame Helm Quick Action.

Conceptually:

Grapple parent
→ spend one Quick Action
→ BasicAttackFlow = mechanical roll only

Ram parent
→ spend one Quick Action
→ BasicAttackFlow = mechanical roll only

—

# 16. Committed Plan Integration

Both actions should appear as one committed Quick Action.

Conceptually:

`GRAPPLE                                     [d20]`

or:

`RAM                                         [d20]`

Clicking the d20 execution control should begin target acquisition and the corresponding basic maneuver attack flow.

Because these actions involve attack rolls, the d20 execution affordance is appropriate.

—

# 17. Shared Native Roll Sequence

For either maneuver:

Committed action
→ target resolved
→ maneuver legality validated
→ native BasicAttackFlow configured
→ native Accuracy/Difficulty HUD
→ native attack roll
→ result available
→ Frame Helm applies maneuver-specific consequence

This gives Frame Helm a functioning intermediate architecture before attack automation is expanded.

—

# 18. Future Automated Roll Architecture

Eventually Frame Helm may bypass the native Accuracy/Difficulty popup.

The desired later sequence is:

Committed maneuver
→ click d20
→ target selected
→ Frame Helm derives Accuracy
→ Frame Helm derives Difficulty
→ Frame Helm derives flat modifiers
→ include maneuver-specific native flat bonus
→ automatically roll
→ determine hit
→ automatically apply maneuver-specific consequence
→ refresh authoritative state

The native system should still supply authoritative actor stats and structured bonuses.

—

# 19. Grapple Classification

Grapple is:

- a Quick Action;
- an actor-based melee maneuver;
- not a weapon attack;
- not a Tech Attack.

Its roll architecture should therefore use:

`BasicAttackFlow`

rather than:

`WeaponAttackFlow`

or:

`TechAttackFlow`.

—

# 20. Grapple Native Status Identity

The repository contains the native status identity:

`grappled`

in status-icon infrastructure.

Therefore the native system understands Grappled as a status/condition concept.

Frame Helm should use the native Grappled identity where appropriate rather than inventing a separate visual status.

—

# 21. Grapple Relationship Problem

A successful Grapple cannot necessarily be modeled only as:

`target.grappled = true`

The rules interaction depends on a relationship between specific characters.

Conceptually:

Actor A
→ grapples
→ Actor B

Future mechanics may need to know:

- who is grappling whom;
- whether the grapple is mutual in any sense;
- who controls movement;
- what happens when one character moves;
- what happens when one character breaks the Grapple;
- when the relationship ends.

Repository searching did not reveal a current runtime relationship model equivalent to:

`grappledByActorId`

or:

`grapplingActorId`

Therefore Frame Helm will likely need to own this relationship state.

—

# 22. Native Grappled Status vs Grapple Relationship

These should be treated as separate concepts.

Native status:

`grappled`

provides a game/UI condition identity.

Frame Helm relationship state:

Actor A ↔ Actor B

provides the structural relationship required for movement and later action logic.

Conceptually:

successful Grapple
→ establish Frame Helm Grapple relationship
→ apply native `grappled` status as required

Do not assume the native status alone stores the entire relationship.

—

# 23. Grapple Post-Hit Architecture

Likely initial architecture:

Grapple attack hits
→ Frame Helm determines Grapple success
→ establish relationship between acting actor and target
→ apply native Grappled status where appropriate
→ record relationship metadata
→ refresh actor/Frame Helm presentation

The exact relationship and which actors receive which condition should come from confirmed Grapple rules.

—

# 24. Grapple Movement Integration

Grapple will eventually interact directly with Frame Helm Movement.

Possible requirements include:

- moving a grappled target;
- movement limitations;
- preserving adjacency;
- determining which participant moves;
- movement cost changes;
- breaking the Grapple due to position changes.

Therefore Grapple relationship state should be designed for Movement consumption, not merely for UI display.

—

# 25. Grapple Break/Cleanup

Frame Helm needs explicit conditions for ending a Grapple.

Potential causes may include:

- successful opposing action;
- movement/position invalidation;
- destruction;
- Shutdown;
- scene/token removal;
- rules-defined release.

Exact rules must be confirmed.

When the relationship ends:

Frame Helm relationship state
→ clear

and:

native Grappled status
→ remove as appropriate

—

# 26. Grapple Target Acquisition

Grapple should target the character selected by the player.

General flow:

Commit Grapple
→ execute
→ select target if none exists
→ validate adjacency
→ validate size
→ configure BasicAttackFlow
→ roll
→ apply Grapple consequences on success

Unlike Overwatch, the target is not fixed by an external trigger.

—

# 27. Grapple Flat Bonus

Frame Helm should include:

`actor.system.bonuses.flat.grapple`

in the Grapple roll.

This should be additive to whatever generic native melee/basic attack modifiers apply.

The exact insertion point into `BasicAttackFlow`/Accuracy-Difficulty data needs tracing.

Do not manually add the bonus twice if native flow behavior changes in future versions.

—

# 28. Grapple Semantic Identity

The native system also recognizes Grapple as a semantic action/synergy location.

Therefore future actor-owned content may reference:

- when you Grapple;
- after you Grapple;
- when you become Grappled;
- bonuses to Grapple.

Frame Helm should preserve Grapple action identity for future trigger integration.

—

# 29. Ram Classification

Ram is:

- a Quick Action;
- an actor-based melee maneuver;
- not a weapon attack;
- not a Tech Attack.

Its attack roll should likewise use:

`BasicAttackFlow`.

—

# 30. Native Ram Flat Bonus

Frame Helm should include:

`actor.system.bonuses.flat.ram`

when executing Ram.

As with Grapple, native structured effect data may modify this field.

Therefore this should remain the authoritative Ram-specific bonus source.

—

# 31. Native Prone Condition

The repository contains:

`actor.system.statuses.prone`

and the native status identity:

`prone`

The native attack system already cares about Prone when calculating attack modifiers.

Therefore when Ram successfully inflicts Prone:

> Frame Helm should apply the native `prone` condition.

Do not create a Frame Helm-only Prone flag.

—

# 32. Native Knockback Concept

The repository contains generic Knockback semantic/tag support.

Relevant concepts include:

`Tag.is_knockback`

and:

`tg_knockback`

Therefore the native rules data model recognizes Knockback.

However, no dedicated Ram executor was found that performs Ram-specific forced movement automatically.

So generic Knockback recognition does not eliminate the need for Frame Helm Ram orchestration.

—

# 33. Ram Post-Hit Architecture

Likely initial architecture:

Ram attack hits
→ Frame Helm determines success
→ apply native `prone` condition as required
→ perform Ram-specific forced movement / Knockback as allowed
→ record movement through Movement feature
→ refresh authoritative state

The exact order and optional choices should come from confirmed Ram rules.

—

# 34. Ram Forced Movement

Ram’s movement consequence should integrate with the Movement feature rather than directly mutating token coordinates from the Actions layer.

Preferred conceptual flow:

Ram success
→ determine legal forced-movement distance/direction
→ Movement integration receives forced-movement command
→ token moves
→ movement classified as forced
→ movement triggers handled according to forced-movement rules

This is important for interactions with:

- Overwatch;
- Disengage;
- terrain;
- Grapple;
- elevation;
- other movement-triggered effects.

—

# 35. Forced Movement Classification

Frame Helm should distinguish:

voluntary movement

from:

forced movement

The Movement feature should receive context identifying the movement as Ram/Knockback forced movement.

This allows downstream reaction logic to determine whether Overwatch or other triggers are legal.

Do not represent Ram forced movement as ordinary user movement with no context.

—

# 36. Ram and Prone

If Ram’s rules allow choices between or combinations of:

- Knockback;
- Prone;
- other consequences;

Frame Helm should expose those choices explicitly.

Do not assume every successful Ram automatically applies every possible consequence until the rule text is confirmed.

The repository findings establish only that native Prone and Knockback concepts exist.

—

# 37. Ram Target Acquisition

Ram follows the same basic target flow as Grapple:

Commit Ram
→ execute
→ select target if none exists
→ validate adjacency
→ validate size
→ configure BasicAttackFlow
→ roll
→ apply Ram consequences on success

—

# 38. Shared Target Validation Adapter

Because Grapple and Ram share much of their target legality, Frame Helm should probably reuse a basic maneuver target validator.

Potential shared checks:

- acting actor exists;
- target exists;
- target is another valid character;
- scene/token available;
- adjacency/range;
- size restrictions;
- action-specific status restrictions.

Then:

Grapple
→ additional Grapple legality

Ram
→ additional Ram legality

—

# 39. Shared Native Flow Configuration

The shared maneuver adapter should conceptually configure:

title

attack type

base attack bonus

action-specific flat bonus

target

Then launch native `BasicAttackFlow`.

Conceptually:

`executeBasicManeuverAttack({
  actor,
  target,
  title,
  flatBonus,
  maneuverId
})`

Exact API names are illustrative only.

Do not introduce this exact signature until the Actions feature decomposition is finalized.

—

# 40. Shared Action Identity

Even though Grapple and Ram share the lower-level attack adapter, they must remain distinct action identities.

Why:

- different flat bonus fields;
- different post-hit consequences;
- different semantic trigger locations;
- potentially different legality;
- different actor-owned bonuses.

Therefore:

shared execution primitive
≠ merged action identity.

—

# 41. BasicAttackFlow Is Not the Whole Action

The architectural rule for both maneuvers is:

`BasicAttackFlow`

owns:

**the attack roll**

It does not own:

**the complete maneuver**

Therefore:

Grapple
≠ BasicAttackFlow

Ram
≠ BasicAttackFlow

Instead:

Grapple
→ BasicAttackFlow
→ Grapple consequence

Ram
→ BasicAttackFlow
→ Ram consequence

—

# 42. Native Status Mutation

For native conditions such as:

`grappled`

and:

`prone`

Frame Helm should use native Foundry/Lancer status/effect helpers where possible.

Do not manually mutate raw status data unless native helpers prove inadequate.

Research the preferred status helper before implementation.

—

# 43. Authoritative Refresh

After applying Grapple or Ram consequences:

→ await native document/token mutation
→ re-read authoritative actor/token state
→ refresh Frame Helm presentation

Do not assume success based only on local state.

—

# 44. Damage

Neither Grapple nor Ram should be assumed to deal damage unless the confirmed rules or an actor-owned modifier says so.

Do not route these maneuvers through the native damage pipeline merely because they use an attack roll.

If a talent/system adds damage to one of these maneuvers later, that consequence should be resolved through the appropriate effect/trigger architecture.

—

# 45. Lock On Interaction

Because these maneuvers use an attack-roll flow, research should determine whether native BasicAttackFlow recognizes Lock On in the same manner as other attacks.

If native Accuracy/Difficulty infrastructure already does so correctly, Frame Helm should preserve that behavior.

Do not implement separate Lock On logic for Grapple/Ram unless necessary.

—

# 46. Engaged Interaction

Because the native flow is a Melee attack, ordinary ranged Engaged penalties should not be relevant in the same way they are for ranged weapon attacks.

Native Accuracy/Difficulty processing should remain authoritative for applicable general attack modifiers.

—

# 47. Accuracy and Difficulty

The initial version should preserve the native Attack HUD.

That allows native handling of:

- Accuracy;
- Difficulty;
- situational modifiers;
- attacker/target effects.

Frame Helm’s action-specific contribution should be:

Grapple:
`flat.grapple`

Ram:
`flat.ram`

Later automation can derive all modifiers directly.

—

# 48. Future Automatic Attack Resolution

Eventually:

Grapple/Ram
→ target selected
→ Frame Helm derives:
   Grit
   action-specific flat bonus
   Accuracy
   Difficulty
   other relevant modifiers
→ roll automatically
→ determine hit
→ apply maneuver consequence
→ update actor/token state

But the native `BasicAttackFlow` provides a safer first-stage implementation.

—

# 49. Actor-Owned Modifiers

Future research must account for action modifiers granted by:

- Mounted Systems;
- Mech Traits;
- Mech Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

These may modify:

- Grapple rolls;
- Ram rolls;
- size limits;
- range;
- post-hit effects;
- movement;
- damage;
- statuses;
- action economy.

Where native structured bonus fields exist, Frame Helm should consume those rather than parse prose.

—

# 50. Grapple Relationship Is Frame Helm-Specific Until Proven Otherwise

No native runtime relationship structure was found during the repository search.

Therefore Frame Helm will probably need a canonical relationship model.

A conceptual relationship record might include:

- grappler actor/token;
- grappled actor/token;
- scene ID;
- created turn;
- status;
- movement ownership;
- termination metadata.

This is conceptual only.

The exact structure should wait for full Grapple rule research.

—

# 51. Relationship Storage Location

Potential storage choices include:

- Frame Helm runtime state;
- Foundry document flags;
- ActiveEffect metadata;
- another durable Frame Helm domain.

The relationship may need to survive:

- UI rerenders;
- token movement;
- turn changes;
- application close/reopen;
- possibly Foundry reload.

Therefore ephemeral UI-only state is not sufficient.

The final storage strategy should be chosen deliberately.

—

# 52. Grapple Status Synchronization

If Frame Helm owns Grapple relationship state while native Lancer owns the `grappled` condition:

relationship created
→ apply native condition

relationship removed
→ remove native condition when appropriate

The synchronization must account for a target potentially participating in multiple unusual Grapple effects if rules allow such cases.

Do not blindly remove `grappled` if another valid Grapple relationship still exists.

—

# 53. Ram Forced Movement and Trigger Engine

Ram’s forced movement must feed into the same general movement-trigger architecture being developed for Overwatch and Disengage.

Conceptually:

Ram
→ forced token movement
→ Movement feature
→ movement classification = forced / Ram
→ trigger evaluator
→ rules determine which reactions/effects apply

This is preferable to bypassing Movement state.

—

# 54. Shared Interaction With Turn State

Frame Helm Turn owns:

- Quick Action legality;
- Quick Action expenditure;
- duplicate-action restrictions;
- action history;
- committed action state.

The Grapple/Ram maneuver adapter should not duplicate those concerns.

—

# 55. Duplicate Action Rules

Under ordinary action economy, Grapple and Ram are separate Quick Action identities.

Using Grapple does not inherently count as using Ram.

Frame Helm’s duplicate-action mechanism should preserve distinct IDs such as:

`quick.grapple`

and:

`quick.ram`

Exact existing IDs should remain authoritative.

—

# 56. Overcharge

A repeated Grapple or Ram may potentially be performed through Overcharge where otherwise legal.

The maneuver adapter should not need its own Overcharge system.

Turn state should supply the action-budget context.

The attack mechanics remain the same.

—

# 57. Full Tech

Grapple and Ram are not Quick Tech actions.

Therefore Full Tech’s rule allowing two Quick Tech options does not apply to them.

—

# 58. Prepare

Grapple or Ram may potentially be Prepared if allowed under Prepare rules.

If so, the same maneuver execution adapter should be reusable from a prepared Reaction context.

This reinforces the need to separate:

action-budget commitment

from:

mechanical maneuver execution.

—

# 59. Semantic Trigger Architecture

Native structured data recognizes Grapple and Ram as meaningful bonus/action categories.

Future Frame Helm trigger events may need concepts like:

- before Grapple;
- after Grapple;
- Grapple succeeded;
- when you Ram;
- Ram succeeded;
- target became Prone;
- target was moved by Ram.

Exact event names are conceptual only.

Do not invent native hooks.

—

# 60. Do Not Parse Text First

Where native structured data exists:

Grapple bonus:
`system.bonuses.flat.grapple`

Ram bonus:
`system.bonuses.flat.ram`

Prone:
native status

Grappled:
native status identity

Knockback:
native semantic/tag data

Frame Helm should use these structures before attempting rules-text parsing.

—

# 61. Native-System Boundary

The intended dependency direction is:

Committed Action
→ Grapple/Ram Execution Service
→ Shared Basic Maneuver Adapter
→ Native Lancer Adapter
→ `BasicAttackFlow`
→ native attack resolution
→ Frame Helm post-hit consequence
→ native status helper / Movement feature
→ authoritative mutation
→ presentation refresh

UI code should not directly understand native attack internals.

—

# 62. Do Not Invent `GrappleFlow` or `RamFlow`

No dedicated native flows were found.

Frame Helm may internally expose:

Grapple execution

and:

Ram execution

but these should explicitly be Frame Helm orchestration over:

`BasicAttackFlow`

not pretend native flows.

—

# 63. Immediate Repository Research TODO

- [ ] Trace `actor.beginBasicAttackFlow(...)` completely.
- [ ] Trace `BasicAttackFlow` constructor arguments.
- [ ] Trace `initAttackData` for actor-only attacks.
- [ ] Determine exact attack-data field for flat bonus.
- [ ] Determine how Frame Helm can inject `flat.grapple`.
- [ ] Determine how Frame Helm can inject `flat.ram`.
- [ ] Determine whether native generic melee bonuses are already applied elsewhere.
- [ ] Avoid double-applying generic melee modifiers.
- [ ] Trace `system.bonuses.flat.grapple` consumers.
- [ ] Trace `system.bonuses.flat.ram` consumers.
- [ ] Trace native size representation.
- [ ] Locate native actor/token distance helpers.
- [ ] Trace native `grappled` status helper path.
- [ ] Trace native `prone` status helper path.
- [ ] Trace Knockback tag utilities.
- [ ] Search for native forced-movement helpers.
- [ ] Search for any native grapple relationship structure under alternate terminology.

—

# 64. Grapple Rules Research TODO

Before final Grapple implementation:

- [ ] Confirm exact attack roll formula.
- [ ] Confirm exact target range.
- [ ] Confirm size restrictions.
- [ ] Confirm what happens on hit.
- [ ] Confirm which participant becomes Grappled.
- [ ] Confirm movement rules while Grappling.
- [ ] Confirm which participant controls movement.
- [ ] Confirm how Grapple breaks.
- [ ] Confirm Grapple interaction with involuntary movement.
- [ ] Confirm Grapple interaction with larger/smaller characters.
- [ ] Confirm Grapple interaction with Prone.
- [ ] Confirm Grapple interaction with Shutdown.
- [ ] Confirm Grapple interaction with teleportation.
- [ ] Confirm whether Grapple relationship survives turn changes.
- [ ] Confirm whether more than two characters can participate in connected Grapples.

—

# 65. Ram Rules Research TODO

Before final Ram implementation:

- [ ] Confirm exact attack roll formula.
- [ ] Confirm exact target range.
- [ ] Confirm size restrictions.
- [ ] Confirm exact post-hit options.
- [ ] Confirm Prone application rules.
- [ ] Confirm forced-movement distance.
- [ ] Confirm who chooses movement direction.
- [ ] Confirm whether Prone and Knockback are alternatives or simultaneous.
- [ ] Confirm forced movement interaction with terrain.
- [ ] Confirm forced movement interaction with Overwatch.
- [ ] Confirm forced movement interaction with Disengage.
- [ ] Confirm forced movement interaction with Grapple.
- [ ] Confirm forced movement interaction with elevation.
- [ ] Confirm whether special Ram bonuses can increase Knockback.

—

# 66. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add shared basic maneuver attack adapter.
- [ ] Keep Grapple and Ram as separate action definitions.
- [ ] Reuse target-selection infrastructure.
- [ ] Add adjacency validation.
- [ ] Add size validation.
- [ ] Resolve authoritative actor and target.
- [ ] Configure native BasicAttackFlow.
- [ ] Supply actor Grit.
- [ ] Supply Grapple-specific flat bonus.
- [ ] Supply Ram-specific flat bonus.
- [ ] Preserve native Accuracy/Difficulty HUD initially.
- [ ] Capture attack result.
- [ ] Implement Grapple success consequences.
- [ ] Implement canonical Grapple relationship state.
- [ ] Apply native Grappled condition as required.
- [ ] Implement Grapple cleanup.
- [ ] Implement Ram success consequences.
- [ ] Apply native Prone status as required.
- [ ] Route Ram forced movement through Movement feature.
- [ ] Classify Ram movement as forced.
- [ ] Preserve Quick Action expenditure in Turn feature.
- [ ] Mark committed actions executed.
- [ ] Refresh authoritative actor/token state.
- [ ] Refresh Frame Helm presentation.
- [ ] Emit semantic Grapple/Ram events for later trigger integration.

—

# 67. Smoke Test TODO

Grapple:

- [ ] valid adjacent target.
- [ ] invalid distant target.
- [ ] invalid size relationship.
- [ ] Grapple native flat bonus applied.
- [ ] generic Accuracy/Difficulty preserved.
- [ ] successful Grapple creates relationship.
- [ ] native Grappled status appears.
- [ ] failed Grapple creates no relationship.
- [ ] Grapple relationship survives UI rerender.
- [ ] Grapple cleanup removes appropriate state.

Ram:

- [ ] valid adjacent target.
- [ ] invalid distant target.
- [ ] invalid size relationship.
- [ ] Ram native flat bonus applied.
- [ ] successful Ram applies correct consequence.
- [ ] native Prone status works.
- [ ] forced movement uses Movement feature.
- [ ] forced movement classified correctly.
- [ ] failed Ram applies no consequence.
- [ ] Overwatch interaction behaves correctly for forced movement.

Shared:

- [ ] native BasicAttackFlow opens correctly.
- [ ] attack modifiers are not double-counted.
- [ ] Quick Action spent exactly once.
- [ ] Overcharge repeat works where legal.
- [ ] Frame Helm telemetry refreshes after mutation.

—

# 68. Important Invariants

**Invariant 1**

Grapple and Ram are separate Quick Actions.

**Invariant 2**

Neither has a dedicated native execution flow in the repository.

**Invariant 3**

Both should reuse native `BasicAttackFlow`.

**Invariant 4**

Both are actor-based Melee maneuver attacks rather than weapon attacks.

**Invariant 5**

Mech Grit remains the native basic attack basis.

**Invariant 6**

Grapple uses native `system.bonuses.flat.grapple`.

**Invariant 7**

Ram uses native `system.bonuses.flat.ram`.

**Invariant 8**

Frame Helm must ensure those maneuver-specific bonuses reach the roll because BasicAttackFlow does not appear to apply them automatically.

**Invariant 9**

Grapple’s complete relationship cannot be represented solely by a generic Grappled status.

**Invariant 10**

Ram should use native Prone status rather than duplicating Prone state.

**Invariant 11**

Ram forced movement should go through Frame Helm Movement.

**Invariant 12**

The native basic attack flow owns roll resolution; Frame Helm owns maneuver-specific post-hit consequences.

—

# 69. Final Working Model

BASIC MANEUVER ATTACK
│
├── Frame Helm
│   ├── Quick Action legality
│   ├── target acquisition
│   ├── adjacency
│   ├── size legality
│   ├── maneuver identity
│   └── action-specific flat bonus
│
├── Native Lancer
│   └── BasicAttackFlow
│       ├── Melee attack
│       ├── actor Grit
│       ├── target handling
│       ├── Accuracy/Difficulty
│       ├── attack roll
│       └── attack card
│
├── GRAPPLE
│   │
│   ├── flat bonus:
│   │   └── `system.bonuses.flat.grapple`
│   │
│   └── Frame Helm post-hit
│       ├── establish Grapple relationship
│       ├── apply native `grappled` state as required
│       ├── integrate with Movement
│       └── manage relationship cleanup
│
└── RAM
    │
    ├── flat bonus:
    │   └── `system.bonuses.flat.ram`
    │
    └── Frame Helm post-hit
        ├── apply native `prone` as required
        ├── resolve Ram forced movement
        ├── route movement through Movement feature
        └── preserve forced-movement context

The critical architectural rule is:

**Grapple and Ram share the roll engine, not the entire action.**

Frame Helm supplies the maneuver-specific legality and consequences.

Native Lancer supplies the reusable basic attack roll infrastructure.
EOF