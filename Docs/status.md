# Lancer Status Effects and Conditions — Native Repository Integration Notes

## Status

**Native Foundry status registry:** Found.

**Native Lancer ActiveEffect integration:** Found.

**Native actor derived status booleans:** Found.

**Native canonical status application path:** Found.

**Native canonical status removal path:** Found.

**Native attack-side status consumers:** Found.

**Native damage-side status consumers:** Found.

**Native geometry-driven Engaged derivation:** Not found.

**Native geometry-driven Cover derivation:** Not found.

**Native complete Hidden rules engine:** Not found.

**Native complete Jammed legality engine:** Not found.

**Native complete Slowed legality engine:** Not found.

**Native complete Immobilized legality engine:** Not found.

**Native complete Stunned legality engine:** Not found.

**Native complete Shutdown transition engine:** Not found.

**Frame Conn implementation status:** Frame Conn should treat Lancer statuses and conditions as native Foundry/Lancer ActiveEffect state, reuse all native downstream consumers, and add only the missing application, lifecycle, spatial derivation, and legality orchestration.

## Purpose

This document records the native Foundry Lancer architecture for statuses and conditions and defines the intended Frame Conn integration boundary.

Statuses and conditions are not action Flows.

They are primarily represented through:

Foundry ActiveEffects
→ Lancer status identities
→ derived actor `system.statuses.*` fields
→ native combat consumers where implemented.

The native system already understands many important mechanical consequences once the proper status exists.

Examples include:

- Invisible attack miss chance;
- Soft Cover attack modifier;
- Hard Cover attack modifier;
- Engaged ranged-attack penalty;
- Prone attack bonus;
- Lock On attack Accuracy and consumption;
- Impaired attack/check Difficulty;
- Exposed damage doubling;
- Shredded Armor/Resistance bypass;
- Stunned Evasion override.

However, the native repository often does **not** determine when those statuses should be applied, removed, or derived from game state.

Therefore the critical architectural rule is:

> Frame Conn should own missing rules orchestration around native status state, not create a parallel status system.

—

# 1. Native Status Architecture

The native architecture is conceptually:

Status identity
→ `CONFIG.statusEffects`
→ Foundry ActiveEffect
→ ActiveEffect change
→ `system.statuses.<status>`
→ actor preparation
→ downstream native combat code may consume the derived boolean.

This means status state should be represented through native Foundry/Lancer effects rather than direct persistent writes to `system.statuses`.

—

# 2. Native Status Registry

The native status registry is built through source including:

`src/module/status-icons.ts`

`src/module/effects/lancer-active-effect.ts`

`src/module/effects/converter.ts`

`src/module/models/items/status.ts`

The registry is attached to:

`CONFIG.statusEffects`

Frame Conn should prefer reading/validating native status definitions from this registry instead of maintaining a duplicate hardcoded catalog where possible.

—

# 3. Canonical Native Status IDs

The repository exposes status/effect identities including:

`immobilized`

`impaired`

`jammed`

`lockon`

`shredded`

`slow`

`stunned`

`dangerzone`

`downandout`

`engaged`

`exposed`

`hidden`

`invisible`

`intangible`

`prone`

`shutdown`

`bolster`

`flying`

`cover_soft`

`cover_hard`

`resistance_burn`

`resistance_energy`

`resistance_explosive`

`resistance_heat`

`resistance_kinetic`

Other optional/NPC presentation statuses may also exist.

Frame Conn should not assume this list is permanently exhaustive.

—

# 4. Important `slow` / `slowed` Naming Difference

A native naming mismatch exists.

The status/config identity is:

`slow`

while the actor derived boolean is:

`system.statuses.slowed`

Therefore Frame Conn should not assume:

status ID
=
actor status property name

for every condition.

This mapping belongs in the native-system adapter.

—

# 5. Native Actor Derived Status Structure

During actor preparation, native Lancer initializes status booleans conceptually equivalent to:

`cover_hard`

`cover_soft`

`dangerzone`

`downandout`

`engaged`

`exposed`

`invisible`

`prone`

`shutdown`

`immobilized`

`impaired`

`jammed`

`lockon`

`shredded`

`slowed`

`stunned`

`hidden`

These fields are derived runtime state.

They should not be treated as the persistent storage authority.

—

# 6. Derived Status Fields Are Reset During Actor Preparation

Native actor preparation resets `system.statuses.*` values before ActiveEffects are applied.

Therefore code like:

`actor.update({ “system.statuses.prone”: true })`

is the wrong mutation layer.

Such a direct change may be overwritten during actor preparation.

Correct architecture:

Foundry/Lancer ActiveEffect
→ native status identity
→ derived actor boolean.

This should be a hard Frame Conn invariant.

—

# 7. Native Status ActiveEffect Conversion

Native Lancer status items/effects create ActiveEffect changes conceptually equivalent to:

`key: system.statuses.${status.system.lid}`

with an override mode.

Therefore the ActiveEffect is what causes:

`system.statuses.hidden = true`

or:

`system.statuses.prone = true`

during actor preparation.

Frame Conn should manipulate the effect/status, not the derived boolean.

—

# 8. Canonical Native Status Application

The native status model uses Foundry’s status API:

`actor.toggleStatusEffect(statusId, { active: true })`

This is the preferred general status application boundary.

Conceptually:

Frame Conn action
→ native status adapter
→ `toggleStatusEffect`
→ native ActiveEffect
→ native derived actor status.

—

# 9. Canonical Native Status Removal

The same Foundry API supports removal:

`actor.toggleStatusEffect(statusId, { active: false })`

This gives Frame Conn a symmetric general status adapter.

Native code also uses helpers such as:

`actor.effectHelper.removeActiveEffect(“exposed”)`

and:

`actor.effectHelper.removeActiveEffects(...)`

for targeted cleanup.

—

# 10. Proposed Native Status Adapter

A dedicated adapter should conceptually expose:

`hasStatus(actor, statusId)`

`applyStatus(actor, statusId)`

`removeStatus(actor, statusId)`

`setStatus(actor, statusId, active)`

`listStatuses(actor)`

`removeEffectsByStatus(actor, statusId)`

Exact names are illustrative only.

UI and action-domain code should not directly manipulate ActiveEffects.

—

# 11. Status Adapter Is Not the Rules Engine

The native status adapter should answer:

`How do I represent this status in Foundry Lancer?`

It should not answer:

`When should this status exist?`

That belongs to a separate Frame Conn condition/rules layer.

—

# 12. Proposed Condition Rules Layer

Conceptually:

`frame-conn-condition-rules`

may own things like:

`deriveEngaged(...)`

`deriveCover(attacker, target)`

`canMove(...)`

`canTakeAction(...)`

`canTakeReaction(...)`

`canOvercharge(...)`

`shouldAutoFailCheck(...)`

`applyActionConsequence(...)`

This separates native document mechanics from Lancer rules orchestration.

—

# 13. Status Categories

The repository findings suggest three useful architectural categories.

Persistent/effect state:

- Exposed;
- Hidden;
- Invisible;
- Impaired;
- Jammed;
- Prone;
- Shredded;
- Slowed;
- Stunned;
- Shutdown;
- Lock On.

Spatially derived state:

- Engaged.

Attack-context-derived state:

- Soft Cover;
- Hard Cover.

These categories should not all be implemented the same way.

—

# 14. Impaired — Native Representation

Native actor field:

`system.statuses.impaired`

Native status identity:

`impaired`

The condition exists as a proper native Lancer/Foundry status.

—

# 15. Impaired — Native Attack Consumer

Native Accuracy/Difficulty calculation checks the attacking actor’s Impaired state.

If Impaired:

→ native attack total receives -1 Accuracy-equivalent.

This corresponds to:

`+1 Difficulty`

on attacks.

Frame Conn should not add an additional attack penalty.

—

# 16. Impaired — Native HASE Check/Save Consumer

Native `StatRollFlow` uses the shared Accuracy/Difficulty model.

That shared model reads Impaired.

Therefore native HASE checks/saves using StatRollFlow automatically receive:

`+1 Difficulty`

while Impaired.

Frame Conn should preserve this native behavior.

—

# 17. Impaired — Frame Conn Responsibility

Frame Conn should generally own only:

- application;
- removal;
- lifecycle;
- action/system effects that create or clear Impaired.

Native roll machinery already consumes the condition.

—

# 18. Engaged — Native Representation

Native actor field:

`system.statuses.engaged`

Native status identity:

`engaged`

Native attack code can consume it.

—

# 19. Engaged — Native Attack Consumer

Native attack Accuracy/Difficulty handling applies the Engaged penalty to appropriate ranged attacks.

The native attack code also handles the relevant weapon-range exceptions.

Therefore once Engaged is correctly represented:

→ native ranged attack handling applies the penalty.

Frame Conn should not manually add the attack Difficulty.

—

# 20. Engaged — Native Geometry Derivation Missing

No native runtime system was found that automatically performs:

hostile adjacency
+
size comparison
→ apply Engaged

or:

move away
→ remove Engaged.

Therefore Frame Conn needs to derive Engaged spatially if full automation is desired.

—

# 21. Engaged — Spatial Inputs

An Engaged evaluator will likely need:

- token adjacency;
- hostile/allied disposition;
- actor Size;
- movement start/end;
- any special effects modifying engagement.

The official Engaged rules should remain authoritative.

—

# 22. Engaged — Preferred Architecture

Conceptually:

token movement / scene change
→ spatial relationship evaluator
→ determine Engaged state
→ native status adapter
→ apply/remove native `engaged`
→ native attack machinery consumes it.

—

# 23. Exposed — Native Representation

Native actor field:

`system.statuses.exposed`

Native status identity:

`exposed`

Native Stabilize already removes it when Cool is chosen.

—

# 24. Exposed — Native Damage Consumer

Native `LancerActor.damageCalc(...)` checks:

`system.statuses.exposed`

When active, the native damage engine doubles relevant armored damage types.

Confirmed affected categories include:

- Kinetic;
- Energy;
- Explosive;
- Variable.

Therefore Exposed’s major damage consequence is already native.

—

# 25. Exposed — Frame Conn Responsibility

Frame Conn should only ensure native Exposed is correctly applied or removed when rules require.

Do not double damage in Frame Conn before calling `damageCalc()`.

That would cause double application.

—

# 26. Hidden — Native Representation

Native actor field:

`system.statuses.hidden`

Native status identity:

`hidden`

Native status icon/presentation exists.

—

# 27. Hidden — Native Rules Consumer Missing

No complete runtime consumer was found for:

- target prohibition;
- lack of engagement;
- approximate location;
- Hide legality;
- Hidden-breaking lifecycle;
- Search interaction.

Therefore native Hidden is primarily state representation.

Frame Conn must own Hidden’s missing rules behavior.

—

# 28. Hidden — Frame Conn Responsibilities

Frame Conn will likely own:

- Hide eligibility;
- visibility/observation logic;
- Hidden application;
- Hidden break conditions;
- targeting consequences;
- Sensors presentation;
- Search removal.

The native `hidden` status remains the authoritative state marker.

—

# 29. Invisible — Native Representation

Native actor field:

`system.statuses.invisible`

Native status identity:

`invisible`

Invisible is distinct from Hidden.

—

# 30. Invisible — Native Attack Consumer

Native attack code reads Invisible and modifies the final attack roll with the native invisibility miss-chance mechanic.

Therefore:

target Invisible
→ native attack flow automatically resolves the 50% miss chance.

Frame Conn should not duplicate it.

—

# 31. Invisible — Foundry Core Visibility Is Disabled

Native Lancer explicitly disables Foundry’s default special Invisible token behavior.

Therefore:

Lancer Invisible
≠ Foundry token hidden/invisible.

Applying Lancer Invisible should not automatically remove the token from normal Foundry vision.

Frame Conn Sensors/visibility logic must account for this distinction.

—

# 32. Invisible — Frame Conn Responsibility

Frame Conn should own:

- application;
- removal;
- ability-specific lifecycle;
- Hide interaction;
- Sensors/visibility behavior where native Lancer does not.

Native attack resolution owns the miss chance.

—

# 33. Prone — Native Representation

Native actor field:

`system.statuses.prone`

Native status identity:

`prone`

Actions such as Ram may apply this native state.

—

# 34. Prone — Native Attack Consumer

Native attack target handling reads Prone.

Attacks against a Prone target receive:

`+1 Accuracy`

through the native Accuracy/Difficulty system.

Frame Conn should not duplicate this modifier.

—

# 35. Prone — Missing Movement/Lifecycle Rules

Native Lancer does not appear to fully automate:

- Prone causing Slowed;
- Prone counting as difficult terrain;
- standing up using standard movement;
- removing Prone on stand-up.

Frame Conn Movement should own those lifecycle behaviors where required.

—

# 36. Lock On — Native Representation

Native actor field:

`system.statuses.lockon`

Native status identity:

`lockon`

Lock On is a status with a consumable attack interaction.

—

# 37. Lock On — Native Attack Consumer

Native attack targeting detects Lock On.

The attack HUD defaults to consuming Lock On and grants:

`+1 Accuracy`

when consumed.

Native attack execution then removes the Lock On effect.

Therefore:

Lock On action
→ Frame Conn/native action applies `lockon`

later attack
→ native attack flow handles Accuracy + consumption.

—

# 38. Lock On — Frame Conn Responsibility

Frame Conn now owns the Lock On application side end to end:

- Quick Action commitment/economy;
- reusing an existing Foundry target when exactly one is selected;
- activating Foundry's native Token target tool when no target is selected;
- waiting for current-user target acquisition, with cancellation leaving execution pending;
- validating the selected token against the acting mech's Sensors;
- applying authoritative native `lockon` through Native Adapter `applyStatus`;
- marking the exact committed entry executed only after successful native status mutation.

Frame Conn does not create a parallel Lock On flag. Native attacks remain authoritative for Lock On Accuracy and consumption/removal.

The Foundry target-acquisition surface is intentionally reusable by other actions which require a target, including the canonical Improvised Attack path and future weapon/system execution.

—

# 39. Shredded — Native Representation

Native actor field:

`system.statuses.shredded`

Native status identity:

`shredded`

—

# 40. Shredded — Native Damage Consumer

Native `damageCalc(...)` skips the Armor/Resistance processing block when:

`system.statuses.shredded`

is active.

Therefore:

Shredded
→ Armor ignored
→ Resistance ignored

automatically in native damage resolution.

This is fully implemented natively.

—

# 41. Shredded — Frame Conn Responsibility

Frame Conn should only:

- apply native Shredded;
- remove it when its duration ends;
- track duration/source where native effects do not already encode it.

Do not manually bypass Armor or Resistance.

—

# 42. Slowed — Native Representation

Native actor derived field:

`system.statuses.slowed`

Native status/config identity:

`slow`

This mismatch should be normalized through the native adapter.

—

# 43. Slowed — Native Rules Consumer Missing

No runtime movement/action consumer was found automatically enforcing:

- no Boost;
- no special movement;
- standard movement only.

Therefore Frame Conn must enforce Slowed in central action/movement legality.

—

# 44. Slowed — Frame Conn Movement Behavior

Conceptually:

actor has Slowed
→ Standard Move remains legal
→ Boost unavailable
→ special movement modes granted by talents/systems/weapons unavailable

Exact rules and exceptions remain authoritative.

—

# 45. Immobilized — Native Representation

Native actor field:

`system.statuses.immobilized`

Native status identity:

`immobilized`

—

# 46. Immobilized — Native Movement Consumer Missing

No native runtime consumer was found that automatically blocks voluntary movement.

Therefore Frame Conn Movement must enforce the condition.

—

# 47. Immobilized — Voluntary vs Involuntary Movement

Officially, Immobilized blocks voluntary movement while involuntary movement remains unaffected.

Therefore the Movement system must distinguish movement context.

Conceptually:

standard / boost / jump / fly
→ voluntary
→ blocked

forced movement
→ involuntary
→ allowed.

This aligns with the movement-method architecture documented elsewhere.

—

# 48. Jammed — Native Representation

Native actor field:

`system.statuses.jammed`

Native status identity:

`jammed`

—

# 49. Jammed — Native Rules Consumer Missing

No complete native runtime consumer was found enforcing Jammed’s action restrictions.

Therefore applying native Jammed alone is insufficient.

—

# 50. Jammed — Official Restrictions

Jammed characters cannot:

- use comms to talk to other characters;
- make attacks other than Improvised Attack, Grapple, and Ram;
- take Reactions;
- take Tech Actions;
- benefit from Tech Actions.

Frame Conn must enforce the action-facing subset centrally.

—

# 51. Jammed — Central Legality Architecture

Rather than checking Jammed inside every action:

action requested
→ central legality service
→ actor Jammed?
→ action category/identity
→ allow/reject.

Examples:

Improvised Attack
→ allowed

Ram
→ allowed

Grapple
→ allowed

Skirmish
→ denied

Barrage
→ denied

Quick Tech
→ denied

Reaction
→ denied.

—

# 52. Jammed — Tech Benefit Restriction

The rule that Jammed characters cannot benefit from Tech Actions extends beyond simply pressing buttons.

This may require:

- effect application checks;
- target-benefit filters;
- action-result orchestration.

This should be treated as a broader condition-rule concern rather than only UI action disabling.

—

# 53. Stunned — Native Representation

Native actor field:

`system.statuses.stunned`

Native status identity:

`stunned`

Stunned has special native ActiveEffect behavior.

—

# 54. Stunned — Native Evasion Override

Native Stunned effect generation applies:

`system.evasion = 5`

through an ActiveEffect override.

Therefore:

Stunned mech
→ native Evasion maximum/effective value becomes 5.

Frame Conn should not manually overwrite Evasion.

—

# 55. Stunned — Missing Native Action Legality

No native runtime code was found fully enforcing that Stunned mechs cannot:

- Overcharge;
- move;
- take actions;
- take Free Actions;
- take Reactions.

Therefore Frame Conn must enforce these through central legality.

—

# 56. Stunned — Missing Native Auto-Fail Checks/Saves

No native `StatRollFlow` behavior was found automatically failing:

- Hull checks/saves;
- Agility checks/saves

while Stunned.

Therefore Frame Conn’s check/save adapter should detect this state.

—

# 57. Stunned — Proposed Check/Save Behavior

Conceptually:

HASE check/save requested
→ actor Stunned?
→ stat is Hull or Agility?
→ automatic failure
→ do not perform ordinary native roll

The exact chat/presentation behavior should be designed deliberately.

—

# 58. Stunned — Pilot Exception

Official rules state pilots can still:

- Mount;
- Dismount;
- Eject

from Stunned mechs and can otherwise act normally.

Therefore central legality must distinguish:

mech action

from:

pilot action.

Do not globally disable the linked Pilot actor because the mech is Stunned.

—

# 59. Shutdown — Native Representation

Native actor field:

`system.statuses.shutdown`

Native status identity:

`shutdown`

Native state representation exists.

—

# 60. Shutdown — Native Complete Rules Consumer Missing

No complete native engine was found implementing all official Shutdown consequences.

Therefore native Shutdown is primarily a state marker.

Frame Conn must orchestrate the transition and ongoing legality.

—

# 61. Shutdown — Official Entry Consequences

When a mech Shuts Down:

- all Heat is cleared;
- Exposed is removed;
- cascading NHPs are stabilized and stop cascading;
- statuses/conditions caused by Tech Actions, such as Lock On, immediately end.

These are deterministic transition effects.

Frame Conn’s Shut Down action should implement them through native mutation helpers.

—

# 62. Shutdown — Official Ongoing Consequences

While Shut Down:

- mech has Immunity to all Tech Actions and Tech Attacks;
- mech has Immunity to hacker damage;
- mech is Stunned indefinitely;
- Shutdown remains until Boot Up.

Frame Conn must enforce the missing legality/immunity behavior where native systems do not.

—

# 63. Shutdown — Apply Native Stunned

Because native Stunned already supplies Evasion 5:

Shut Down
→ apply native Shutdown
→ apply native Stunned

provides the native Evasion consequence automatically.

Frame Conn still needs to enforce Stunned’s missing action/check restrictions.

—

# 64. Shutdown — Tech-Created Effect Removal

Shut Down requires removal of statuses/conditions caused by Tech Actions.

This cannot safely be implemented as:

remove every negative condition

because only Tech-originated conditions are specified.

Frame Conn may need source metadata or native effect origin inspection to identify qualifying effects.

Lock On is a clear example.

—

# 65. Shutdown — NHP Cascade Stabilization

The Shut Down action also stabilizes cascading NHPs.

This should be implemented through the native NHP/item state model rather than a generic status clear.

The exact native cascade fields/helpers should be traced separately.

—

# 66. Soft Cover — Native Representation

Native actor/status identity:

`cover_soft`

Native attacks recognize it.

—

# 67. Soft Cover — Native Attack Consumer

Native attack Accuracy/Difficulty converts Soft Cover to:

`-1`

unless ignored by the relevant native attack exception.

Therefore Soft Cover attack math is already native.

—

# 68. Hard Cover — Native Representation

Native actor/status identity:

`cover_hard`

Native attacks recognize it.

—

# 69. Hard Cover — Native Attack Consumer

Native attack Accuracy/Difficulty converts Hard Cover to:

`-2`

unless ignored by native attack exceptions.

Therefore Hard Cover attack math is already native.

—

# 70. Native Cover Exceptions

Native attack handling already accounts for cover-ignoring situations such as:

- Seeking;
- Tech attacks;
- applicable non-thrown Melee attacks.

Frame Conn should not duplicate these exceptions.

—

# 71. Automatic Cover Geometry Is Missing

No general runtime geometry system was found assigning:

`cover_soft`

or:

`cover_hard`

based on scene walls, terrain, adjacent units, or line geometry.

Therefore native status representation should not be mistaken for automatic tactical cover detection.

—

# 72. Cover Is Attacker-Relative

Cover depends on the relationship between:

attacker

and:

target.

A target may have Hard Cover against one attacker and no Cover against another.

Therefore a globally persisted actor Cover status is inherently lossy for full automation.

—

# 73. Preferred Automated Cover Architecture

Conceptually:

attacker
→ target
→ spatial/LOS/terrain evaluator
→ None / Soft / Hard
→ feed cover value into native attack context
→ native attack flow applies modifier.

This is preferable to constantly toggling a permanent global cover status.

—

# 74. Native Cover Status Still Has Uses

Native `cover_soft` / `cover_hard` remain useful for:

- GM manual assignment;
- explicit abilities granting cover;
- fallback adjudication;
- cases where cover legitimately applies globally.

Frame Conn should preserve this manual/native pathway.

—

# 75. Cover Geometry Inputs

Future automated cover evaluation may need:

- attacker position;
- target position;
- token size;
- walls;
- terrain;
- allied/hostile units providing cover;
- line of sight;
- elevation;
- specific cover rules.

This belongs to a spatial/visibility service.

—

# 76. Line of Sight

The repository contains optional LOS integration, including terrain-height-tools support.

However, no complete native status engine uses that geometry to automatically determine Cover, Hidden, or Engaged.

Therefore Frame Conn may reuse the geometry primitives without assuming the native system already owns tactical legality.

—

# 77. Native Damage Pipeline Summary

Native `LancerActor.damageCalc(...)` already handles important defensive/damage state.

Confirmed native behavior includes:

- Armor;
- Resistance;
- Exposed;
- Shredded;
- AP;
- Paracausal handling;
- Overshield;
- damage multipliers such as half damage.

Therefore Frame Conn damage should terminate in `damageCalc(...)` whenever practical.

—

# 78. Exposed Damage Rule

Conceptually:

target has Exposed
→ Frame Conn sends ordinary typed damage
→ native `damageCalc(...)`
→ relevant damage doubled automatically.

Do not pre-double damage.

—

# 79. Shredded Damage Rule

Conceptually:

target has Shredded
→ Frame Conn sends ordinary typed damage
→ native `damageCalc(...)`
→ native Armor/Resistance block skipped.

Do not manually set Armor to zero or erase Resistance.

—

# 80. Attack Modifier Pipeline Summary

Native attack Accuracy/Difficulty handling currently consumes at least:

- Impaired;
- Engaged;
- Prone;
- Lock On;
- Invisible;
- Soft Cover;
- Hard Cover.

Therefore action flows that correctly apply these native states gain substantial automation automatically.

—

# 81. Search Integration

Search success should:

→ remove native `hidden`.

No custom revealed flag is required.

The Sensors/visibility presentation should then refresh from authoritative state.

—

# 82. Hide Integration

Hide should:

→ apply native `hidden`

after Frame Conn validates Hide legality.

Frame Conn then owns Hidden lifecycle and break conditions.

—

# 83. Ram Integration

Ram can apply:

`prone`

through the native status adapter.

Native future attacks then automatically gain the Prone attack benefit.

Frame Conn only needs to own the Ram resolution and Prone lifecycle.

—

# 84. Lock On Integration

Lock On Quick Tech should:

→ apply native `lockon`

to the target.

Native attack flow already handles:

- +1 Accuracy;
- consumption;
- removal.

This makes Lock On a particularly clean status integration.

—

# 85. Stabilize Integration

Native Stabilize already handles:

Cool
→ Heat 0
→ remove Exposed

and:

Clear Burn
→ Burn 0.

Future condition-clearing automation should use the same native status/effect mutation infrastructure.

—

# 86. Shut Down Integration

Shut Down should not merely toggle `shutdown`.

The action should orchestrate:

- Heat clearing;
- Exposed removal;
- tech-effect cleanup;
- NHP cascade stabilization;
- Shutdown;
- Stunned;
- ongoing tech immunity/action legality.

This should be added to the Shut Down action notes/implementation.

—

# 87. Boot Up Integration

Boot Up should reverse the persistent Shut Down state according to the official rules.

At minimum:

→ remove native Shutdown

and, if Stunned exists only because of Shutdown:

→ remove the Shutdown-caused Stunned effect.

Source-aware effect handling may be important if the mech is independently Stunned by another effect.

—

# 88. Source-Aware Effects

Some conditions can be caused by multiple sources.

Therefore a generic:

remove `stunned`

may be incorrect if one Stunned source remains after another ends.

Foundry ActiveEffect origin/source metadata should be preserved where possible.

This is especially important for:

- Shutdown-created Stunned;
- tech-created conditions;
- temporary system/talent effects.

—

# 89. Duration Handling

Many Lancer statuses/conditions have durations such as:

- until end of current turn;
- until end of target’s next turn;
- until start of source’s next turn;
- until cleared by an action.

Frame Conn should avoid storing duration only as display text.

Where native ActiveEffect duration/origin metadata can represent it, use that.

Otherwise Frame Conn may need supplemental lifecycle metadata.

—

# 90. Status Removal by Action

Actions that remove statuses should go through the native adapter.

Examples:

Search
→ remove Hidden

Boot Up
→ remove Shutdown

Stabilize
→ remove selected condition

standing up
→ remove Prone

Do not directly update `system.statuses.*`.

—

# 91. Status Application by Action

Actions that apply statuses should also go through the native adapter.

Examples:

Ram
→ Prone

Hide
→ Hidden

Lock On
→ Lock On

system/talent effect
→ relevant condition.

The action owns the rule.

Native Lancer owns the status representation and any implemented downstream mechanics.

—

# 92. Central Action Legality

The following conditions should feed a central action-legality service:

- Jammed;
- Stunned;
- Shutdown;
- Slowed;
- Immobilized;
- Prepare-held lock;
- other action-denying effects.

Do not scatter these checks across every action implementation.

—

# 93. Central Movement Legality

Movement should centrally inspect:

- Immobilized;
- Slowed;
- Stunned;
- Prone;
- Shutdown;
- Prepare-held state;
- movement method/context.

This allows one consistent answer for:

standard movement
vs
Boost
vs
Jump
vs
Fly
vs
Teleport
vs
Forced movement.

—

# 94. Central Reaction Legality

Reaction availability should centrally inspect:

- Jammed;
- Stunned;
- Shutdown;
- Prepare-held state;
- native Reaction availability;
- special multiple-Reaction effects.

This applies to:

- Brace;
- Overwatch;
- Prepared Actions;
- actor-owned Reactions.

—

# 95. Central Check/Save Legality

Checks/saves should centrally inspect status rules.

Example:

Stunned mech
+
Hull or Agility check/save
→ automatic failure.

Impaired:
→ native StatRollFlow handles +1 Difficulty.

This should be normalized through the check/save adapter.

—

# 96. Central Tech Legality

Tech actions should centrally inspect:

- Jammed source actor;
- Shutdown target;
- tech immunity;
- special actor effects.

This will matter for:

- Bolster;
- Lock On;
- Scan;
- Invade;
- Full Tech;
- system-granted Tech Actions.

—

# 97. Do Not Duplicate Native Roll Modifiers

If native attack/stat machinery already consumes a status:

Frame Conn should not also modify the roll.

Confirmed examples:

- Impaired;
- Engaged;
- Prone;
- Lock On;
- Invisible;
- Soft Cover;
- Hard Cover.

Status correctness is enough.

—

# 98. Do Not Duplicate Native Damage Modifiers

If native damageCalc already consumes a status:

Frame Conn should not manually alter the damage.

Confirmed examples:

- Exposed;
- Shredded.

The correct architecture is:

apply status correctly
→ use native damageCalc later.

—

# 99. Manual Native Status UI Remains Useful

Because Foundry Lancer already exposes manual status selection in the token/UI, Frame Conn should coexist with manual GM/player adjudication.

If a GM manually applies:

Hard Cover

or:

Impaired

native combat code should continue to consume it.

Frame Conn should not overwrite manual states without a strong reason.

—

# 100. Automated vs Manual State Reconciliation

Derived automation such as Engaged should be careful not to fight manual effects.

Potential strategy:

- Frame Conn-created derived effects use a recognizable source/origin;
- Frame Conn removes only its own derived effect;
- manually applied native effects remain untouched.

This is preferable to blindly toggling all effects of the same status off.

—

# 101. Engaged Effect Ownership

If Frame Conn derives Engaged automatically:

apply Engaged with Frame Conn source metadata

then later:

no longer adjacent
→ remove only Frame Conn-derived Engaged.

If another effect independently grants Engaged:

that source should remain.

The exact ActiveEffect source/origin API should be traced before implementation.

—

# 102. Cover Should Prefer Context Over Persistent Effects

Because Cover is attacker-relative, full automation should prefer an attack-context value.

Persistent native Cover status should remain a manual/explicit-effect fallback.

This prevents one attacker’s geometry from incorrectly affecting another attack.

—

# 103. Hidden and Invisible Must Remain Distinct

Hidden:
→ observation/targeting state.

Invisible:
→ attack miss-chance state.

A character may possess both.

Frame Conn should never implement:

Hide
→ apply Invisible

unless a specific ability explicitly grants both.

—

# 104. Prone and Slowed Are Related but Distinct

Prone has its own native status.

The rules additionally make a Prone character Slowed.

Frame Conn should determine whether to:

- apply both native statuses;
- derive Slowed from Prone in legality;
- use source-aware effects.

The implementation should avoid accidentally removing an independently sourced Slowed effect when the actor stands.

—

# 105. Shutdown and Stunned Are Related but Distinct

Shutdown causes indefinite Stunned behavior.

A character may also be Stunned from another source.

Therefore Boot Up should not blindly remove every Stunned effect if another source remains.

Source-aware status/effect handling is recommended.

—

# 106. Native Effect Origins Are Important

For mature automation, Frame Conn should record enough source information to distinguish:

- Frame Conn-derived Engaged;
- Shutdown-caused Stunned;
- system-created Invisible;
- action-created Hidden;
- manually applied GM effect.

The native ActiveEffect `origin`/flags infrastructure should be investigated for this purpose.

—

# 107. Status Duration Architecture

A mature Frame Conn status mutation helper may need options conceptually like:

`source`

`duration`

`expiresAt`

`originActor`

`originItem`

`originAction`

Exact names depend on Foundry’s ActiveEffect model.

Do not bake duration logic into individual UI components.

—

# 108. Status Rules Matrix

Current confirmed matrix:

| Status / Condition | Native Representation | Native Rule Consumer | Frame Conn Responsibility |
|—|—|—|—|
| Impaired | Yes | Attacks + HASE checks/saves | Apply/remove/lifecycle |
| Engaged | Yes | Attack penalty | Spatial derivation/lifecycle |
| Prone | Yes | +1 Accuracy against target | Apply/remove/stand-up/movement effects |
| Lock On | Yes | +1 Accuracy + native consumption | Apply target condition |
| Invisible | Yes | Native attack miss chance | Apply/remove/lifecycle/visibility |
| Soft Cover | Yes | Native -1 attack modifier | Geometry/context |
| Hard Cover | Yes | Native -2 attack modifier | Geometry/context |
| Exposed | Yes | Native damage doubling | Apply/remove/lifecycle |
| Shredded | Yes | Native Armor/Resistance bypass | Apply/remove/lifecycle |
| Stunned | Yes | Native Evasion 5 | Legality + Hull/Agility auto-fail |
| Jammed | Yes | No complete consumer found | Action/Reaction/Tech legality |
| Slowed | Yes | No complete consumer found | Movement/action legality |
| Immobilized | Yes | No movement consumer found | Voluntary movement prohibition |
| Hidden | Yes | No complete consumer found | Hide/Search/targeting/lifecycle |
| Shutdown | Yes | No complete consumer found | Full Shut Down transition + ongoing rules |

—

# 109. Status Integration Principle

The correct general pattern is:

Rule/action determines that condition should change
→ Frame Conn native status adapter
→ Foundry/Lancer ActiveEffect state
→ native actor derived status
→ native downstream rule consumers
→ Frame Conn supplements only missing rule behavior.

This should replace ad hoc direct state mutation.

—

# 110. Status Consumer Principle

Before implementing a status consequence in Frame Conn:

1. search native attack/stat/damage/movement code;
2. determine whether native Lancer already consumes the status;
3. if yes, do not duplicate it;
4. if no, implement the missing rule at the appropriate Frame Conn domain layer.

This should be standard practice for future system/talent/core-power integration.

—

# 111. Immediate Native Adapter TODO

- [ ] Create canonical native status ID map.
- [ ] Handle `slow` ↔ `slowed` mismatch explicitly.
- [ ] Add `hasStatus`.
- [ ] Add `applyStatus`.
- [ ] Add `removeStatus`.
- [ ] Add `setStatus`.
- [ ] Add effect listing.
- [ ] Add source-aware effect removal.
- [ ] Validate against `CONFIG.statusEffects`.
- [ ] Await all native mutations.
- [ ] Re-read authoritative actor state after mutation.

—

# 112. Effect Source TODO

- [ ] Trace Foundry ActiveEffect `origin`.
- [ ] Trace native Lancer effect flags.
- [ ] Determine how status items encode source.
- [ ] Determine how manual status toggles differ from sourced effects.
- [ ] Add Frame Conn source marker for derived effects.
- [ ] Remove only effects owned by the relevant Frame Conn source when appropriate.

—

# 113. Engaged Automation TODO

- [ ] Confirm exact adjacency rule.
- [ ] Confirm Size exception.
- [ ] Determine hostility/disposition mapping.
- [ ] Recompute on movement.
- [ ] Recompute on token creation/deletion.
- [ ] Recompute on Size change.
- [ ] Apply native Engaged status.
- [ ] Avoid deleting independent/manual Engaged sources.
- [ ] Feed native Engaged to attack pipeline.

—

# 114. Cover Automation TODO

- [ ] Trace Foundry LOS primitives.
- [ ] Trace terrain-height-tools integration.
- [ ] Define attacker-target cover query.
- [ ] Account for token Size.
- [ ] Account for structures.
- [ ] Account for units granting cover.
- [ ] Account for elevation.
- [ ] Return None/Soft/Hard.
- [ ] Inject into attack context.
- [ ] Preserve manual native Cover status as fallback.
- [ ] Do not persist attacker-relative cover globally unless necessary.

—

# 115. Hidden Automation TODO

- [ ] Implement Hide legality.
- [ ] Implement observation/Sensors interaction.
- [ ] Apply native Hidden.
- [ ] Implement Hidden break conditions.
- [ ] Implement targeting consequences.
- [ ] Implement Search removal.
- [ ] Preserve Invisible separately.
- [ ] Do not use Foundry token hidden as a substitute.

—

# 116. Prone Automation TODO

- [ ] Apply native Prone from Ram and other effects.
- [ ] Implement stand-up movement behavior.
- [ ] Remove Prone on standing.
- [ ] Enforce Slowed behavior while Prone.
- [ ] Enforce difficult-terrain behavior.
- [ ] Preserve independently sourced Slowed.
- [ ] Let native attacks consume Prone.

—

# 117. Jammed Automation TODO

- [ ] Deny ordinary attacks.
- [ ] Allow Improvised Attack.
- [ ] Allow Grapple.
- [ ] Allow Ram.
- [ ] Deny Reactions.
- [ ] Deny Tech Actions.
- [ ] Prevent benefiting from Tech Actions where applicable.
- [ ] Integrate comms restriction if Frame Conn ever controls comms.
- [ ] Centralize in action legality.

—

# 118. Slowed Automation TODO

- [ ] Permit Standard Move.
- [ ] Deny Boost.
- [ ] Deny special movement.
- [ ] Integrate Jump/Fly/Teleport rules according to source.
- [ ] Preserve forced movement.
- [ ] Centralize in movement/action legality.

—

# 119. Immobilized Automation TODO

- [ ] Deny voluntary Standard Move.
- [ ] Deny voluntary Boost.
- [ ] Deny voluntary special movement.
- [ ] Allow involuntary/forced movement.
- [ ] Centralize in Movement feature.
- [ ] Preserve movement source/method context.

—

# 120. Stunned Automation TODO

- [ ] Deny Overcharge.
- [ ] Deny voluntary movement.
- [ ] Deny actions.
- [ ] Deny Free Actions.
- [ ] Deny Reactions.
- [ ] Preserve Pilot Mount/Dismount/Eject exception.
- [ ] Auto-fail Hull checks.
- [ ] Auto-fail Agility checks.
- [ ] Auto-fail Hull saves.
- [ ] Auto-fail Agility saves.
- [ ] Let native Stunned effect own Evasion 5.

—

# 121. Shutdown Automation TODO

- [ ] Clear Heat.
- [ ] Remove Exposed.
- [ ] Stabilize cascading NHPs.
- [ ] Remove tech-created conditions/statuses.
- [ ] Apply native Shutdown.
- [ ] Apply source-aware Stunned.
- [ ] Enforce Tech Action immunity.
- [ ] Enforce Tech Attack immunity.
- [ ] Enforce hacker-damage immunity.
- [ ] Preserve Shutdown until Boot Up.
- [ ] Make Boot Up remove only Shutdown-caused effects where appropriate.

—

# 122. Damage Pipeline TODO

- [ ] Route Frame Conn damage through native `damageCalc(...)`.
- [ ] Preserve typed damage.
- [ ] Preserve AP.
- [ ] Preserve Paracausal.
- [ ] Preserve half-damage multiplier.
- [ ] Let native Exposed double damage.
- [ ] Let native Shredded bypass Armor/Resistance.
- [ ] Do not reimplement native defensive math.

—

# 123. Attack Pipeline TODO

- [ ] Let native Impaired modify attacks.
- [ ] Let native Engaged modify ranged attacks.
- [ ] Let native Prone modify attacks.
- [ ] Let native Lock On grant Accuracy.
- [ ] Let native Lock On consume/remove itself.
- [ ] Let native Invisible resolve miss chance.
- [ ] Feed automated Cover into native AccDiff context.
- [ ] Avoid duplicate attack modifiers.

—

# 124. Check/Save Pipeline TODO

- [ ] Let native Impaired modify StatRollFlow.
- [ ] Intercept Stunned Hull/Agility checks.
- [ ] Intercept Stunned Hull/Agility saves.
- [ ] Preserve native HASE roll paths.
- [ ] Preserve native Accuracy/Difficulty handling.
- [ ] Add generic automatic-failure result path.

—

# 125. Action Legality TODO

- [ ] Create central condition-aware action legality service.
- [ ] Integrate Jammed.
- [ ] Integrate Stunned.
- [ ] Integrate Shutdown.
- [ ] Integrate Prepare lock.
- [ ] Integrate Slowed where action type matters.
- [ ] Integrate Immobilized where movement action matters.
- [ ] Return explicit legality reason.
- [ ] Use same service for UI availability and execution revalidation.

—

# 126. Movement Legality TODO

- [ ] Create central condition-aware movement legality.
- [ ] Distinguish voluntary vs forced.
- [ ] Integrate Immobilized.
- [ ] Integrate Slowed.
- [ ] Integrate Stunned.
- [ ] Integrate Shutdown.
- [ ] Integrate Prone.
- [ ] Integrate Prepare lock.
- [ ] Preserve movement method IDs.

—

# 127. Reaction Legality TODO

- [ ] Integrate Jammed.
- [ ] Integrate Stunned.
- [ ] Integrate Shutdown.
- [ ] Integrate Prepare-held state.
- [ ] Preserve native Reaction availability.
- [ ] Support Brace.
- [ ] Support Overwatch.
- [ ] Support Prepared Actions.
- [ ] Support actor-owned Reactions.

—

# 128. Smoke Test — Native Status Mutation

- [ ] Apply Prone through native adapter.
- [ ] Native icon appears.
- [ ] `system.statuses.prone` becomes true after actor preparation.
- [ ] Remove Prone through native adapter.
- [ ] derived field returns false.
- [ ] no direct `system.statuses.*` persistence used.
- [ ] duplicate application does not corrupt state.
- [ ] manual GM-applied status remains compatible.

—

# 129. Smoke Test — Native Attack Consumers

- [ ] Impaired attacker receives native penalty.
- [ ] Engaged ranged attacker receives native penalty.
- [ ] Prone target grants native Accuracy.
- [ ] Lock On grants native Accuracy.
- [ ] Lock On consumed natively.
- [ ] Invisible performs native miss chance.
- [ ] Soft Cover applies native modifier.
- [ ] Hard Cover applies native modifier.
- [ ] Seeking ignores Cover appropriately.
- [ ] Tech attacks ignore Cover appropriately.
- [ ] applicable Melee attacks ignore Cover appropriately.

—

# 130. Smoke Test — Native Damage Consumers

- [ ] Exposed doubles Kinetic damage once.
- [ ] Exposed doubles Energy damage once.
- [ ] Exposed doubles Explosive damage once.
- [ ] Frame Conn does not double it again.
- [ ] Shredded ignores Armor.
- [ ] Shredded ignores Resistance.
- [ ] AP works natively.
- [ ] Overshield works natively.
- [ ] half-damage multiplier works natively.

—

# 131. Smoke Test — Missing Rule Enforcement

- [ ] Jammed blocks Skirmish.
- [ ] Jammed allows Ram.
- [ ] Jammed allows Grapple.
- [ ] Jammed blocks Reactions.
- [ ] Jammed blocks Tech Actions.
- [ ] Slowed blocks Boost.
- [ ] Slowed permits Standard Move.
- [ ] Immobilized blocks voluntary movement.
- [ ] Immobilized permits forced movement.
- [ ] Stunned blocks Overcharge.
- [ ] Stunned blocks actions.
- [ ] Stunned blocks Reactions.
- [ ] Stunned blocks movement.
- [ ] Stunned Hull/Agility checks auto-fail.
- [ ] Shutdown transition applies all official consequences.

—

# 132. Important Invariants

**Invariant 1**

Statuses and conditions are native Foundry/Lancer ActiveEffect state, not Frame Conn-local booleans.

**Invariant 2**

`system.statuses.*` values are derived runtime fields and should not be directly persisted.

**Invariant 3**

Ordinary native status mutation should use `toggleStatusEffect(...)` or an equivalent native effect helper.

**Invariant 4**

Frame Conn should reuse native downstream status consumers wherever they already exist.

**Invariant 5**

Impaired attack/check Difficulty is native.

**Invariant 6**

Engaged attack penalty is native, but Engaged spatial derivation is not.

**Invariant 7**

Prone attack Accuracy is native, but Prone movement/lifecycle rules are not complete.

**Invariant 8**

Lock On Accuracy and consumption are native.

**Invariant 9**

Invisible attack miss chance is native.

**Invariant 10**

Soft and Hard Cover attack modifiers are native, but automated attacker-relative geometry is not.

**Invariant 11**

Exposed damage doubling is native.

**Invariant 12**

Shredded Armor/Resistance bypass is native.

**Invariant 13**

Stunned Evasion 5 is native, but its action/movement/reaction restrictions and Hull/Agility auto-fail behavior are not.

**Invariant 14**

Jammed, Slowed, Immobilized, Hidden, and Shutdown require significant Frame Conn rules orchestration.

**Invariant 15**

All Frame Conn damage should use native `damageCalc(...)` whenever possible.

**Invariant 16**

Status rules should be centralized in legality/spatial/check services rather than duplicated across every action.

—

# 133. Final Working Model

LANCER STATUS / CONDITION
│
├── Native Foundry/Lancer representation
│   │
│   ├── CONFIG.statusEffects
│   ├── ActiveEffect
│   ├── native status ID
│   └── derived `system.statuses.*`
│
├── Native downstream consumers
│   │
│   ├── ATTACK
│   │   ├── Impaired
│   │   ├── Engaged
│   │   ├── Prone
│   │   ├── Lock On
│   │   ├── Invisible
│   │   ├── Soft Cover
│   │   └── Hard Cover
│   │
│   ├── CHECK / SAVE
│   │   └── Impaired
│   │
│   └── DAMAGE
│       ├── Exposed
│       └── Shredded
│
├── Frame Conn missing-rule layer
│   │
│   ├── Engaged spatial derivation
│   ├── Cover geometry
│   ├── Hidden lifecycle
│   ├── Jammed legality
│   ├── Slowed legality
│   ├── Immobilized movement legality
│   ├── Stunned legality / auto-fail
│   └── Shutdown orchestration
│
└── Shared action integration
    ├── Hide → apply Hidden
    ├── Search → remove Hidden
    ├── Ram → apply Prone
    ├── Lock On → apply Lock On
    ├── Stabilize → native Exposed/Burn removal
    ├── Shut Down → orchestrate Shutdown + related effects
    └── systems/talents/core powers → native status adapter

The critical architectural rule is:

**Frame Conn should decide when a status applies; native Lancer should represent it and consume it wherever the native system already knows what it does.**

Where native Lancer does not enforce the rule, Frame Conn should add that missing behavior at the correct centralized rules layer rather than creating a second status engine.
