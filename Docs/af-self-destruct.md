# Self Destruct
cat > docs/af-self-destruct.md <<‘EOF’
# AF — Self Destruct

## Status

**Native dedicated Self Destruct execution flow:** Not found.

**Native dedicated `beginSelfDestructFlow()`:** Not found.

**Native Self Destruct core macro:** Not found.

**Native runtime meltdown timer state:** Found.

**Native reactor meltdown status/icon:** Found.

**Native Overheat reactor-meltdown result handling:** Found.

**Native automatic Self Destruct countdown:** Not found.

**Native automatic Self Destruct detonation:** Not found.

**Native automatic Burst damage resolution for Self Destruct:** Not found.

**Native Full Repair meltdown cleanup:** Found.

**Official tabletop Self Destruct rules:** Confirmed.

**Frame Helm implementation status:** Frame Helm should own Self Destruct action economy, initiation, detonation-window state, end-of-turn timing, detonation choice, Burst target resolution, Agility saves, occupant destruction, and explosion orchestration while reusing native meltdown state/status and native damage/stat infrastructure where appropriate.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Self Destruct** Quick Action and combines them with the confirmed tabletop rules.

Repository investigation did not reveal a dedicated executable Self Destruct flow such as:

`SelfDestructFlow`

or:

`beginSelfDestructFlow()`

The native system does, however, contain useful reactor-meltdown primitives:

- `actor.system.meltdown_timer`;
- native `reactor_meltdown` status/icon;
- reactor-meltdown outcomes in `OverheatRollFlow`;
- Full Repair cleanup of `meltdown_timer`.

What the native system does not appear to provide is the actual universal Self Destruct lifecycle:

- initiate Self Destruct;
- track the allowed detonation window;
- let the player choose the detonation turn;
- force detonation by the final legal timing;
- resolve Burst 2;
- roll 4d6 Explosive damage;
- resolve Agility saves;
- halve damage on successful saves;
- annihilate the mech;
- kill occupants.

Therefore:

> Frame Helm should implement Self Destruct as a persistent delayed-action state machine over native meltdown primitives.

—

# 1. Self Destruct Classification

Self Destruct is a **Quick Action**.

When used:

- the mech initiates a reactor meltdown;
- the mech does not explode immediately;
- a future end-of-turn detonation window is established;
- the player chooses the detonation timing within that window.

This makes Self Destruct fundamentally different from an ordinary instant Quick Action.

It is:

Quick Action
→ persistent meltdown state
→ future end-of-turn choice
→ delayed catastrophic resolution.

—

# 2. Official Self Destruct Rule

The confirmed rule is:

When a character uses Self Destruct:

→ they overload their mech’s reactor;

→ as a Quick Action, they initiate a reactor meltdown;

→ the mech may explode:

- at the end of the character’s next turn;
- or at the end of one of their turns within the following two rounds;

→ the player chooses the detonation timing within that legal window.

When the mech explodes:

- it is annihilated;
- anyone inside is killed;
- the explosion is Burst 2;
- it deals 4d6 Explosive damage;
- affected characters make an Agility save;
- successful saves take half damage;
- failed saves take full damage.

—

# 3. Native Self Destruct Flow Search

Repository searching did not identify:

- `SelfDestructFlow`
- `beginSelfDestructFlow()`
- `selfDestruct()`
- `startSelfDestruct()`
- dedicated Self Destruct actor method
- dedicated Self Destruct sheet handler
- dedicated Self Destruct core macro
- dedicated Self Destruct flow file

Therefore Frame Helm cannot delegate complete Self Destruct execution to a native Self Destruct workflow.

—

# 4. Native Meltdown Timer

The current runtime actor model contains:

`actor.system.meltdown_timer`

This exists on relevant mech/NPC actor models as a nullable integer field.

Therefore native Lancer already has a persisted numeric representation for reactor-meltdown timing/state.

This is the strongest native state primitive relevant to Self Destruct.

—

# 5. Native Meltdown Timer Is Real Runtime State

The meltdown timer is not merely historical import data.

It is:

- defined in current actor schema;
- exposed as trackable actor state;
- explicitly cleared by Full Repair.

Therefore Frame Helm should strongly prefer using:

`actor.system.meltdown_timer`

rather than inventing a completely separate persistent countdown number.

—

# 6. Full Repair Cleanup

Native Full Repair behavior explicitly clears:

`meltdown_timer = null`

This is strong evidence that the field represents active reactor-meltdown state.

Frame Helm should preserve this native cleanup relationship.

If Full Repair legally occurs while a meltdown timer exists:

native Full Repair should remain capable of clearing the field.

Exact tabletop legality should still be respected.

—

# 7. Native Reactor Meltdown Status

The native status/icon registry includes:

`reactor_meltdown`

Therefore the system has a first-class semantic/presentation identity for:

`this reactor is in meltdown`.

Frame Helm should use this native status where appropriate rather than inventing a duplicate visual condition.

—

# 8. Native Overheat Meltdown Outcomes

`OverheatRollFlow` contains reactor-meltdown-related outcomes.

Examples include concepts such as:

- Meltdown;
- Irreversible Meltdown;
- Destabilized;
- Power Plant Shunt.

This proves the native system already recognizes reactor meltdown as a rules concept.

However, no discovered code connects those outcomes into a complete `meltdown_timer` countdown/detonation engine.

—

# 9. Native Overheat and Self Destruct Are Related but Distinct

Self Destruct says the mech explodes:

`as though it suffered a reactor meltdown`.

Therefore the Self Destruct endpoint should align with reactor-meltdown consequences.

However:

Self Destruct initiation

is not the same event as:

rolling a reactor-meltdown result through Overheat.

Frame Helm should preserve the distinction between:

- meltdown caused by Self Destruct;
- meltdown caused by Overheat or another rule.

Shared detonation logic may still be appropriate.

—

# 10. No Native Countdown Engine

Repository searching did not reveal runtime code doing:

turn advances
→ decrement `meltdown_timer`

or:

timer reaches zero
→ explode actor

Therefore Frame Helm must own the lifecycle/timing system.

—

# 11. Self Destruct Is Not a Simple Countdown

The official rule creates a **detonation window**, not merely an automatic fixed countdown.

After initiation:

the earliest legal detonation is:

`end of your next turn`

Then the player may delay to:

`end of one of your turns within the following two rounds`

Therefore the action needs to represent:

- earliest legal detonation;
- latest legal detonation;
- current opportunity;
- whether player has chosen to detonate;
- whether final mandatory detonation has been reached.

A plain decrementing integer may be insufficient by itself.

—

# 12. Meltdown Timer vs Frame Helm Detonation Metadata

A useful ownership split is:

Native:

`actor.system.meltdown_timer`
→ persisted reactor meltdown timing indicator

Frame Helm:

supplemental Self Destruct metadata
→ source = self-destruct
→ initiation turn
→ earliest legal detonation
→ latest legal detonation
→ selected/declared detonation state
→ lifecycle status

Frame Helm should use the native timer where possible but may need additional metadata to represent the official timing window precisely.

—

# 13. Do Not Overload `meltdown_timer` With Unverified Meaning

Before implementation, trace exactly how the native field is intended to be interpreted.

Do not assume without verification that:

`3`
means:

`three turns until explosion`

or:

`round number 3`

or:

`three opportunities remaining`.

The repository establishes that the field exists.

The exact encoding still requires deliberate design if native runtime never consumes it.

—

# 14. Proposed Self Destruct State

Conceptually:

SelfDestructState
{
  actorId,
  tokenId,
  sceneId,

  source: “self-destruct”,

  initiatedRound,
  initiatedTurn,

  earliestDetonationTurn,
  latestDetonationTurn,

  status,
  detonationAvailable,
  detonationChosen
}

Exact names are illustrative only.

This metadata should supplement rather than replace native meltdown state.

—

# 15. Quick Action Expenditure

Self Destruct consumes:

**one Quick Action**

Frame Helm Turn state owns this expenditure.

The future explosion does not consume another Quick Action.

Conceptually:

Self Destruct initiation
→ spend Quick Action

future detonation
→ delayed resolution
→ no second action cost

—

# 16. Commit vs Execute

Self Destruct has two important execution phases.

Phase 1:

**Initiate Self Destruct**

→ spend Quick Action
→ create meltdown state
→ begin future detonation window

Phase 2:

**Detonate**

→ happens at a legal end-of-turn timing
→ no additional Quick Action
→ resolve reactor explosion

Therefore the original committed action may be considered mechanically executed once the meltdown is successfully initiated.

The later explosion is a consequence of that action.

—

# 17. Self Destruct Does Not Need a d20 Initiation Roll

The initiation itself does not require a roll.

Therefore the committed-plan UI should use a non-roll execution control.

Conceptually:

`SELF DESTRUCT                              [execute]`

The explosion later causes Agility saves, but that does not make the initiation a d20 attack/check.

—

# 18. Initiation Flow

Proposed initial flow:

Player commits Self Destruct
→ execute
→ resolve authoritative mech
→ validate active Turn
→ validate Quick Action
→ validate mech can initiate Self Destruct
→ spend Quick Action
→ create native meltdown state
→ set/update `actor.system.meltdown_timer` appropriately
→ apply native `reactor_meltdown` status if appropriate
→ create Frame Helm Self Destruct metadata
→ mark Self Destruct initiation complete
→ refresh authoritative state/UI

—

# 19. Self Destruct Source Identity

Frame Helm should preserve that this reactor meltdown was initiated by:

`Self Destruct`

rather than some other meltdown source.

This may matter for:

- timing;
- cancellation;
- UI;
- event history;
- future actor-owned effects.

Therefore source metadata is useful even if the native actor only exposes a generic meltdown timer.

—

# 20. Detonation Window

The official timing window is:

Earliest:
→ end of the user’s next turn

Latest:
→ end of one of the user’s turns within the following two rounds

Conceptually, after Self Destruct is initiated:

current turn:
→ no explosion from Self Destruct yet

next turn ends:
→ first detonation opportunity

following turn ends:
→ second opportunity

following turn ends:
→ final opportunity

At the final legal opportunity:

→ detonation can no longer be deferred.

Exact round indexing should be implemented carefully around Foundry combat turn state.

—

# 21. End-of-Turn Integration

Self Destruct requires a hook into:

**end of the Self Destructing actor’s turn**

not:

- start of turn;
- end of every combatant;
- end of round globally.

Frame Helm Turn/runtime architecture should emit a canonical actor-turn-end event.

Self Destruct should consume that event.

—

# 22. Detonation Opportunity

At a legal end-of-turn opportunity:

Frame Helm should present:

`DETONATE REACTOR?`

Conceptually:

[ Detonate ]

[ Delay ]

Delay should only be available while another legal detonation opportunity remains.

At the final legal opportunity:

Delay
→ unavailable

Detonation
→ mandatory.

—

# 23. Do Not Detonate Automatically Too Early

The player explicitly chooses when within the legal window to detonate.

Therefore Frame Helm must not:

initiate Self Destruct
→ automatically explode at end of next turn

unless the player has chosen that timing or the final deadline has been reached.

—

# 24. Mandatory Final Detonation

If the player reaches the final legal end-of-turn timing without detonating earlier:

→ the mech explodes.

Frame Helm should not allow the Self Destruct state to continue indefinitely.

—

# 25. Detonation Is Not a New Action

The end-of-turn detonation is the delayed consequence of Self Destruct.

It should not consume:

- Quick Action;
- Full Action;
- Reaction;
- Protocol.

The action economy was already paid at initiation.

—

# 26. Reactor Meltdown Resolution

At detonation:

→ the mech explodes as though it suffered reactor meltdown.

The official direct consequences given in Self Destruct are:

- mech annihilated;
- anyone inside killed;
- Burst 2 explosion;
- 4d6 Explosive damage;
- Agility save for half.

Frame Helm should implement these explicitly.

—

# 27. Burst 2

The explosion is:

`BURST 2`

centered on the exploding mech.

Therefore Frame Helm needs to identify all valid affected characters within Burst 2 using native Foundry/Lancer grid measurement.

Do not use raw pixel radius.

—

# 28. Explosion Center

The explosion center should be derived from the mech token’s authoritative scene position at the moment of detonation.

Do not store and reuse the token position from initiation.

The mech may have moved during the intervening turns.

—

# 29. Target Discovery

At detonation:

mech token
→ Burst 2 area
→ discover characters within area
→ create affected-character list

This list may include:

- hostile characters;
- allied characters;
- pilots;
- NPCs;
- potentially the exploding mech itself depending on destruction processing.

The explosion is not faction-selective.

—

# 30. No Manual Target Selection

Self Destruct’s Burst affects everyone in the area.

The player should not manually choose explosion targets.

Frame Helm should derive the affected set from scene geometry.

—

# 31. 4d6 Explosive Damage

The explosion deals:

`4d6 Explosive`

damage.

The damage roll should be rolled once or per target according to the exact Lancer area-damage convention.

Before final implementation, confirm whether one shared 4d6 roll applies to all affected characters or each target receives an independent roll.

Do not assume without checking the general rules.

—

# 32. Agility Save

Each character caught in the explosion makes:

an **Agility save**.

This is a save, not a contested check.

Therefore the execution architecture should use the native save/stat machinery appropriate to Agility saves where available.

Do not reuse Search’s Systems-vs-Agility contest logic.

—

# 33. Save Success

If the affected character succeeds on the Agility save:

→ they take half of the explosion damage.

Therefore the final damage multiplier is:

`0.5`

for successful saves.

This aligns well with the native damage multiplier primitive discovered during Brace research.

—

# 34. Save Failure

If the character fails the Agility save:

→ they take full explosion damage.

Conceptually:

`multiple = 1`

when feeding the final damage into native damage resolution.

—

# 35. Native Half-Damage Primitive

Native `LancerActor.damageCalc(...)` supports a multiplier concept including:

`0.5`

Therefore successful Agility saves should preferably use the native half-damage path instead of manually dividing damage.

Conceptually:

save succeeds
→ `damageCalc(..., { multiple: 0.5 })`

save fails
→ `damageCalc(..., { multiple: 1 })`

Exact options must be confirmed against current native method signature.

—

# 36. Native Damage Boundary

The preferred explosion-damage endpoint is:

`LancerActor.damageCalc(...)`

This allows native Lancer to remain authoritative for downstream processing such as:

- Armor;
- Resistance;
- Overshield;
- HP;
- Burn if relevant;
- other native defenses.

Frame Helm should calculate the explosion and save result.

Native Lancer should apply final damage.

—

# 37. Explosive Damage Type

The raw damage must be represented as:

`Explosive`

using the native damage type representation.

Do not reduce the damage to an untyped numeric HP subtraction.

This allows native Resistance and other damage-type mechanics to function correctly.

—

# 38. Damage Rule Verification

Before implementation, confirm how reactor-meltdown Explosive damage interacts with:

- Armor;
- Resistance;
- AP;
- Paracausal;
- Overshield;
- other special defenses.

The Self Destruct wording gives the raw damage and save behavior.

Native damage handling should supply normal downstream rules unless reactor meltdown specifies exceptions elsewhere.

—

# 39. Mech Annihilation

The official rule says:

the explosion **annihilates your mech**.

This is stronger than:

reduce HP to 0

or:

take Structure damage.

Frame Helm needs to identify the correct native/Foundry representation of an annihilated/destroyed mech.

Do not implement annihilation as ordinary damage if the rules require unconditional destruction.

—

# 40. Destroyed Mech Research

Before implementation, trace native handling for:

- destroyed actors;
- destroyed tokens;
- mech destruction;
- Structure 0;
- wreck state;
- token removal;
- status application.

The Self Destruct endpoint should reuse the highest-level native destruction pathway available.

—

# 41. Occupants Are Killed

The rule explicitly says:

`killing anyone inside`

Therefore occupants do not make the Burst Agility save to survive being inside the mech.

The occupant consequence is direct.

Frame Helm must determine who is currently inside the mech.

—

# 42. Pilot Mounted State

The Mount/Dismount/Eject research established native:

`pilot.system.mounted`

and native mech↔pilot relationships.

Therefore Self Destruct should inspect this state to determine whether the assigned pilot is currently inside.

Conceptually:

mech.system.pilot
→ Pilot actor
→ pilot.system.mounted

If mounted:
→ pilot is an occupant
→ killed when mech detonates.

—

# 43. Other Occupants

If Lancer rules or actor state can represent passengers/other occupants, Frame Helm should include them.

Repository research so far has only established the pilot↔mech mounted relationship.

Do not assume no other occupants can ever exist if additional native/custom systems support them.

—

# 44. Eject Interaction

Because Self Destruct is delayed, the pilot may potentially have time to Eject/Dismount before detonation if rules permit.

This is a key interaction with:

`af-Mount-Dismount-Eject.md`

Conceptually:

Self Destruct initiated
→ pilot later Ejects
→ pilot.system.mounted = false
→ mech eventually detonates
→ pilot is no longer killed as occupant
→ pilot may still be caught in Burst 2 depending on position

This is an important reason to resolve occupant state at detonation time.

—

# 45. Do Not Snapshot Occupants at Initiation

The occupant list should be resolved when the mech explodes.

A pilot may:

- Eject;
- Dismount;
- Mount;
- otherwise change physical state.

Therefore:

detonation
→ resolve current occupants

not:

initiation
→ permanently remember occupant list.

—

# 46. Mech Movement During Countdown

Nothing in the provided rule says the mech becomes stationary merely because Self Destruct is active.

Therefore the explosion location must remain dynamic.

Frame Helm should not lock token movement unless another rule says so.

—

# 47. Self Destruct and Prepare

Self Destruct itself is a Quick Action and may interact with duplicate/action-order rules.

Whether Self Destruct can be Prepared depends on the ordinary Prepare rules and any Self Destruct-specific restriction.

If legal:

Prepare Self Destruct
→ child Quick Action eventually initiates meltdown

The later reactor explosion remains delayed normally.

This can reuse Prepare’s child-execution architecture.

—

# 48. Self Destruct and Duplicate Actions

The ordinary duplicate-action rules should apply to Self Destruct as a Quick Action.

Once reactor meltdown is already active:

Frame Helm should likely reject initiating Self Destruct again.

Even if duplicate-action exceptions exist, creating multiple simultaneous Self Destruct timers on one reactor would be nonsensical unless a specific rule explicitly allows it.

—

# 49. Existing Meltdown State

Before initiating Self Destruct:

Frame Helm should inspect:

`actor.system.meltdown_timer`

and relevant reactor-meltdown state.

If the reactor is already undergoing meltdown from another source:

Self Destruct legality needs to follow the actual rules.

Do not blindly overwrite an existing meltdown timer.

—

# 50. Overheat Meltdown Interaction

Possible scenario:

Self Destruct active
→ mech later suffers an Overheat meltdown result

or:

mech already has reactor-meltdown state
→ player attempts Self Destruct

The rule interaction should be researched explicitly.

Frame Helm should not maintain two independent reactor-meltdown engines.

A shared meltdown domain/service is preferable.

—

# 51. Shared Reactor Meltdown Service

A clean architecture may be:

Reactor Meltdown Service

Sources:
- Self Destruct;
- Overheat result;
- other features.

Owns:
- native meltdown timer reconciliation;
- reactor_meltdown status;
- detonation;
- explosion;
- destruction.

Then:

Self Destruct
→ configures the special player-chosen detonation window.

Overheat
→ configures whatever timing the overheat table requires.

Exact architecture should follow further native/rules research.

—

# 52. Meltdown Status Application

If the native `reactor_meltdown` status correctly represents an active meltdown:

Self Destruct initiation
→ apply native `reactor_meltdown`

Detonation/cancellation/repair
→ remove/update native status appropriately

Before implementation, confirm whether current native Overheat flows ever apply this status.

Do not assume status timing without tracing.

—

# 53. Cancellation

The provided Self Destruct rule does not describe voluntarily cancelling Self Destruct.

Therefore Frame Helm should not invent a Cancel Self Destruct button.

If another rule can cancel reactor meltdown:

that capability should enter through the appropriate repair/system/action flow.

—

# 54. Full Repair

Native Full Repair clears:

`meltdown_timer`

However, whether a Full Repair can actually be performed in the middle of an active Self Destruct countdown is a tabletop legality question.

Frame Helm should preserve native cleanup but not treat it as an always-available cancellation button.

—

# 55. Turn-End Presentation

While Self Destruct is active, Frame Helm should display:

- reactor meltdown active;
- earliest/legal detonation timing;
- remaining legal opportunities;
- whether detonation is currently available.

At a legal turn end:

surface the Detonate/Delay choice.

This state should be obvious to the player.

—

# 56. Visible Danger State

A mech with a reactor meltdown underway is a major battlefield state.

The native `reactor_meltdown` icon can provide canvas/status presentation.

Frame Helm may additionally show a prominent telemetry warning.

Presentation should derive from authoritative meltdown state.

—

# 57. Persistence

Self Destruct spans multiple turns and potentially multiple rounds.

Therefore Self Destruct state must survive:

- Frame Helm rerenders;
- application close/reopen;
- token selection changes;
- other actors’ turns;
- client reconnect/reload if practical.

UI-local state is insufficient.

Native `meltdown_timer` provides part of the persistent state.

Supplemental Frame Helm metadata should use durable Foundry state/flags if necessary.

—

# 58. Combat Lifecycle

Self Destruct timing depends on combat rounds/turns.

Frame Helm should use authoritative Foundry Combat state rather than locally incremented counters.

Potential inputs include:

- combat ID;
- round;
- turn;
- combatant identity.

This avoids timer drift.

—

# 59. Actor Turn Identity

The relevant end-of-turn event is specifically:

the Self Destructing actor’s turn.

Frame Helm should bind Self Destruct state to actor/combatant identity rather than merely a numeric turn index, because initiative ordering can change.

—

# 60. No Combat Case

If Self Destruct is used outside a Foundry Combat encounter, Frame Helm needs a policy for interpreting:

`your next turn`
and:
`following two rounds`.

Possible options include:

- require combat;
- use Frame Helm turn state;
- provide GM/manual resolution.

Do not silently invent real-time timing.

This should be designed explicitly.

—

# 61. Agility Save Native Entry Point

Repository research should trace the canonical native save/stat pathway for:

Agility save

rather than assuming a normal HASE check is identical.

Potentially reusable machinery may include:

`StatRollFlow`

but saves may have distinct bonuses/target numbers.

The actual native save implementation should be preferred if available.

—

# 62. Save Target

An Agility save requires a target number.

The Self Destruct rule excerpt does not specify the save target because Lancer’s general save rules determine it.

Frame Helm needs to resolve the correct Save Target from the exploding mech/character according to the general rules.

This is a critical implementation detail.

Do not assume a fixed TN.

—

# 63. Save Target Research

Before implementation:

- trace native `save_target`;
- determine whether mech actor exposes Save Target directly;
- determine whether Self Destruct uses the exploding mech’s Save Target;
- determine how NPC/PC sources differ.

This should be resolved before automating the Agility save.

—

# 64. Shared Damage Roll

The explosion’s 4d6 should be represented in chat/history.

Potential first implementation:

→ roll 4d6 once;
→ display explosion damage;
→ each target rolls Agility save;
→ apply full/half shared result.

But verify the general area-damage convention before finalizing.

—

# 65. Damage Application Ordering

Conceptually:

Detonation
→ roll explosion damage
→ identify targets
→ each target rolls Agility save
→ assign multiplier:
   success = 0.5
   failure = 1
→ native `damageCalc(...)`
→ authoritative actor updates

Whether saves are rolled before or after the shared damage roll is mostly presentation unless rules specify otherwise.

The final mechanical result must remain correct.

—

# 66. Burst Geometry and Token Size

Burst 2 geometry should use native Foundry/Lancer distance/area measurement.

Frame Helm should account for:

- token size;
- grid type;
- scene distance;
- elevation if relevant.

Do not manually draw a fixed pixel circle and assume correctness.

—

# 67. Elevation

Research is needed for whether Burst 2 explosion range is:

- purely planar;
- true 3D distance;
- otherwise handled by Foundry/Lancer area templates.

Prefer native template/area geometry if the system already provides it.

—

# 68. Native Template Reuse

The native Lancer system has WeaponRangeTemplate infrastructure used elsewhere.

Self Destruct may be able to use:

Burst 2 template geometry

for visualization and target discovery.

Before implementing custom Burst geometry, trace existing native Burst template helpers.

—

# 69. Explosion Visualization

A useful first-stage UX may:

- place/display Burst 2 template centered on mech;
- highlight affected tokens;
- roll damage/save results;
- remove template after resolution.

This should use native template utilities where practical.

—

# 70. Mech Destruction Timing

The mech should be annihilated as part of the explosion.

Implementation ordering must ensure:

- explosion center remains known;
- source Save Target remains known;
- occupant relationships remain resolvable;
- damage can still be attributed correctly.

Therefore do not delete/destroy the actor/token before capturing all source data required for resolution.

—

# 71. Suggested Detonation Transaction

Conceptually:

capture source actor/token state
→ capture Save Target
→ capture position
→ capture current occupants
→ derive Burst targets
→ roll explosion damage
→ roll target saves
→ apply target damage
→ kill occupants
→ annihilate mech
→ clear meltdown state
→ finalize history/presentation

Exact destruction timing may be adjusted based on native APIs.

—

# 72. Occupant Kill vs Explosion Damage

Anyone inside is killed because of reactor annihilation.

They should not be processed merely as ordinary Burst targets with 4d6 damage.

If an occupant also happens to be represented by a separate token within Burst 2 due to inconsistent Foundry state, Frame Helm must avoid double-processing.

Mounted-state reconciliation is important.

—

# 73. Pilot Token Consistency

If:

`pilot.system.mounted = true`

there ideally should not be an external active Pilot token representing the same physical pilot.

If such inconsistent state exists, Self Destruct should use authoritative mounted state and avoid applying both:

occupant death

and:

external Burst damage

to the same individual twice.

—

# 74. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- Self Destruct Quick Action;
- action expenditure;
- initiation legality;
- detonation-window calculation;
- player detonation choice;
- end-of-turn monitoring;
- final mandatory detonation;
- Burst target discovery;
- Agility-save orchestration;
- half/full damage decision;
- occupant resolution;
- annihilation orchestration;
- Self Destruct source metadata;
- execution history;
- player-facing warnings/UI.

**NATIVE LANCER / FOUNDRY OWNS:**

- `actor.system.meltdown_timer`;
- native `reactor_meltdown` status;
- actor Save Target where available;
- native Agility/stat/save data;
- native damage type representation;
- `LancerActor.damageCalc(...)`;
- actor/token document mutation;
- native template/grid geometry;
- native Full Repair meltdown cleanup.

—

# 75. Do Not Invent `SelfDestructFlow`

No native SelfDestructFlow was found.

Frame Helm may implement an internal Self Destruct state machine/service, but it should clearly be Frame Helm-owned.

The reusable native boundaries are:

- meltdown actor state;
- native status;
- save/stat infrastructure;
- native damage resolution;
- actor/token destruction infrastructure.

—

# 76. Proposed Initial Self Destruct Flow

SELF DESTRUCT
→ Frame Helm validates active mech/Turn
→ spend Quick Action
→ initiate native meltdown state
→ persist Frame Helm detonation-window metadata
→ apply native reactor-meltdown presentation
→ action initiation complete

END OF NEXT TURN
→ detonation becomes available

Player chooses:
→ DETONATE
or
→ DELAY if another legal turn remains

If delayed:
→ repeat opportunity at next legal turn end

At final legal turn end:
→ mandatory detonation

DETONATION
→ capture authoritative mech state
→ resolve current occupants
→ resolve mech position
→ Burst 2 target discovery
→ roll 4d6 Explosive
→ each target Agility save
→ success = half damage
→ failure = full damage
→ native damageCalc(...) per affected character
→ kill occupants
→ annihilate mech
→ clear/finalize meltdown state
→ refresh scene/Frame Helm
→ write execution history/chat output

—

# 77. Immediate Repository Research TODO

- [ ] Trace current `meltdown_timer` schema completely.
- [ ] Trace all runtime consumers of `meltdown_timer`.
- [ ] Confirm Full Repair mutation path.
- [ ] Trace native `reactor_meltdown` status completely.
- [ ] Determine whether Overheat flow applies reactor-meltdown status.
- [ ] Trace Overheat meltdown results.
- [ ] Search for any hidden/alternate reactor-meltdown helper.
- [ ] Trace native actor destruction/wreck handling.
- [ ] Trace native Save Target representation.
- [ ] Trace native Agility save flow.
- [ ] Determine whether StatRollFlow is appropriate for saves.
- [ ] Trace native Burst template geometry.
- [ ] Trace native area target discovery.
- [ ] Trace `LancerActor.damageCalc(...)` Explosive input shape.
- [ ] Confirm half-damage option signature.
- [ ] Trace pilot mounted state for occupant resolution.
- [ ] Search for passenger/occupant state beyond pilot.
- [ ] Determine best persistence mechanism for supplemental Self Destruct metadata.

—

# 78. Rules Research TODO

- [ ] Confirm general reactor-meltdown rules referenced by “as though it suffered a reactor meltdown.”
- [ ] Confirm exact Save Target source.
- [ ] Confirm area-damage roll convention: one 4d6 roll or per-target.
- [ ] Confirm Armor interaction.
- [ ] Confirm Resistance interaction.
- [ ] Confirm whether damage is AP.
- [ ] Confirm Overshield interaction.
- [ ] Confirm elevation/Burst geometry.
- [ ] Confirm exact meaning of annihilated in Foundry terms.
- [ ] Confirm whether wreck/token remains.
- [ ] Confirm whether Self Destruct can be cancelled by any rule.
- [ ] Confirm interaction with Full Repair.
- [ ] Confirm interaction with Overheat meltdown.
- [ ] Confirm whether Self Destruct can be initiated while already melting down.
- [ ] Confirm Eject/Dismount legality during countdown.
- [ ] Confirm Self Destruct behavior outside combat.
- [ ] Confirm whether Prepared Self Destruct is legal.

—

# 79. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Self Destruct execution strategy.
- [ ] Keep Self Destruct in universal Quick Action catalog.
- [ ] Validate reactor/meltdown state.
- [ ] Spend Quick Action exactly once.
- [ ] Add native meltdown-state adapter.
- [ ] Set/update `meltdown_timer`.
- [ ] Apply native `reactor_meltdown` status where appropriate.
- [ ] Add durable Self Destruct metadata.
- [ ] Record initiation combat round/turn.
- [ ] Calculate earliest detonation opportunity.
- [ ] Calculate latest detonation opportunity.
- [ ] Hook actor turn-end lifecycle.
- [ ] Show Detonate/Delay control at legal timing.
- [ ] Disable Delay at final opportunity.
- [ ] Resolve authoritative position at detonation.
- [ ] Resolve current occupants.
- [ ] Build Burst 2 area.
- [ ] Discover affected characters automatically.
- [ ] Roll 4d6 Explosive.
- [ ] Resolve Agility saves.
- [ ] Apply 0.5 multiplier on successful save.
- [ ] Apply full damage on failure.
- [ ] Use native `damageCalc(...)`.
- [ ] Kill current occupants.
- [ ] Annihilate mech through native/Foundry destruction path.
- [ ] Clear/finalize meltdown state.
- [ ] Refresh scene and Frame Helm UI.
- [ ] Produce clear chat/history output.
- [ ] Avoid duplicate execution after detonation.

—

# 80. Smoke Test TODO

Initiation:

- [ ] Self Destruct spends one Quick Action.
- [ ] no d20 roll required.
- [ ] meltdown state persists.
- [ ] native reactor-meltdown presentation appears.
- [ ] duplicate Self Destruct rejected.
- [ ] pre-existing meltdown handled safely.

Timing:

- [ ] cannot detonate immediately on initiation turn.
- [ ] first opportunity appears at end of next turn.
- [ ] player can detonate at first opportunity.
- [ ] player can delay legally.
- [ ] second opportunity appears correctly.
- [ ] third/final opportunity appears correctly.
- [ ] final opportunity forces detonation.
- [ ] turn-order changes do not break timing.
- [ ] state survives other combatants’ turns.
- [ ] state survives UI rerender/reopen.

Explosion:

- [ ] Burst 2 centered on current mech position.
- [ ] allies included.
- [ ] hostiles included.
- [ ] all valid affected characters discovered.
- [ ] 4d6 Explosive rolled correctly.
- [ ] Agility save requested for each target.
- [ ] successful save takes half.
- [ ] failed save takes full.
- [ ] native Armor/Resistance behavior correct.
- [ ] native damage application used.

Occupants:

- [ ] mounted pilot killed.
- [ ] ejected/dismounted pilot not treated as occupant.
- [ ] ejected pilot can still be caught in Burst normally.
- [ ] no occupant double-processing.
- [ ] duplicate Pilot token inconsistency handled safely.

Mech:

- [ ] mech annihilated.
- [ ] destruction represented correctly in Foundry.
- [ ] meltdown state finalized.
- [ ] detonation cannot occur twice.
- [ ] Frame Helm refreshes after source mech destruction.

—

# 81. Important Invariants

**Invariant 1**

Self Destruct is a Quick Action.

**Invariant 2**

No dedicated native Self Destruct Flow was found.

**Invariant 3**

Native Lancer already provides `actor.system.meltdown_timer`.

**Invariant 4**

Native Lancer already provides a `reactor_meltdown` status identity.

**Invariant 5**

Self Destruct does not explode immediately.

**Invariant 6**

Earliest detonation is the end of the user’s next turn.

**Invariant 7**

The player may delay detonation through the following two rounds within the official window.

**Invariant 8**

The final legal detonation opportunity cannot be delayed further.

**Invariant 9**

Future detonation does not consume another action.

**Invariant 10**

Explosion is Burst 2 and deals 4d6 Explosive damage.

**Invariant 11**

Affected characters make Agility saves.

**Invariant 12**

Successful saves take half damage.

**Invariant 13**

Native half-damage and `damageCalc(...)` should be reused rather than reimplementing downstream damage math.

**Invariant 14**

The mech is annihilated regardless of ordinary HP/Structure damage.

**Invariant 15**

Anyone inside the mech is killed.

**Invariant 16**

Occupant state and explosion position must be resolved at detonation time, not snapshotted at initiation.

—

# 82. Final Working Model

SELF DESTRUCT
│
├── Quick Action
│
├── no native SelfDestructFlow
│
├── INITIATION
│   │
│   ├── spend Quick Action
│   ├── initiate reactor meltdown
│   ├── native:
│   │   ├── `meltdown_timer`
│   │   └── `reactor_meltdown`
│   └── Frame Helm:
│       └── persist legal detonation window
│
├── WAIT
│   │
│   └── monitor end of this actor’s future turns
│
├── END OF NEXT TURN
│   └── first legal detonation opportunity
│
├── FOLLOWING TWO ROUNDS
│   └── later legal end-of-turn opportunities
│
├── PLAYER CHOICE
│   │
│   ├── DETONATE
│   └── DELAY
│       └── only while another legal opportunity remains
│
└── DETONATION
    │
    ├── capture current mech position
    ├── resolve current occupants
    ├── BURST 2
    ├── roll 4d6 EXPLOSIVE
    ├── each affected character:
    │   └── AGILITY SAVE
    │       ├── success
    │       │   └── half damage
    │       └── failure
    │           └── full damage
    ├── native `damageCalc(...)`
    ├── kill anyone inside
    ├── annihilate mech
    ├── finalize meltdown state
    └── refresh Foundry / Frame Helm

The critical architectural rule is:

**Self Destruct is a delayed reactor-meltdown state machine, not an immediate attack.**

Native Lancer already supplies the reactor-meltdown state and downstream damage primitives.

Frame Helm must supply the missing timing, choice, Burst/save orchestration, occupant handling, and annihilation lifecycle.
EOF