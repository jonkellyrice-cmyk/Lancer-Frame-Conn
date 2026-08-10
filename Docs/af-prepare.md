# Prepare
cat > docs/af-prepare.md <<‘EOF’
# AF — Prepare

## Status

**Native dedicated Prepare execution flow:** Not found.

**Native current Prepared Action state:** Not found.

**Native legacy/packed Prepare state:** Found.

**Native generic Reaction tracking:** Found.

**Native Reaction refresh behavior:** Found.

**Native `used_reactions` storage:** Found.

**Native Prepare semantic SynergyLocation:** Not found.

**Official tabletop Prepare rules:** Confirmed.

**Frame Helm implementation status:** Frame Helm should own the complete Prepare state machine, trigger definition, action locking, Prepared Action lifecycle, reaction opportunity generation, child-action execution, expiration, and cancellation while delegating the prepared child action to its normal Frame Helm/native execution strategy.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Prepare** Quick Action and combines them with the confirmed tabletop rules.

Repository investigation did not reveal a dedicated executable Prepare flow such as:

`PrepareFlow`

or:

`beginPrepareFlow()`

The current native action tracker does not contain a Prepared Action structure.

The repository does contain an old packed-state field:

`prepare: boolean`

and it provides generic Reaction availability and Reaction refresh infrastructure.

However, native Lancer does not appear to implement the complete rules state required for:

- selecting another Quick Action;
- specifying a trigger;
- prohibiting further movement/actions/reactions;
- executing the prepared action later as a Reaction;
- dropping the prepared action;
- expiring it at the start of the pilot’s next turn.

Therefore:

> Frame Helm should own Prepare as a higher-order action/state machine.

The prepared child action should retain its ordinary mechanical execution strategy.

—

# 1. Prepare Classification

Prepare is a **Quick Action**.

When a character uses Prepare:

1. they choose another Quick Action;
2. they specify a valid trigger;
3. the preparation itself counts as taking that chosen action;
4. the prepared action is held until its trigger occurs or until the start of the character’s next turn;
5. when triggered, the chosen action may be executed as a Reaction.

Prepare therefore separates:

**action commitment**

from:

**mechanical execution**

This is a critical architectural distinction.

—

# 2. Official Prepare Rule

The confirmed rule is:

> As a Quick Action, Prepare any other Quick Action and specify a trigger.

Until the start of the character’s next turn:

- when the trigger occurs;
- the prepared action may be taken as a Reaction.

If the trigger never occurs:

- the prepared action is lost.

This establishes Prepare as temporary persistent action state.

—

# 3. Trigger Grammar

The Prepare trigger must be phrased in the form:

`When X, then Y`

Where:

`X`

is:

- a Reaction;
- an Action;
- or a Move;

taken by:

- a hostile character;
- or an allied character.

And:

`Y`

is the prepared Quick Action.

Examples:

`When an allied character moves adjacent to me, then I throw a smoke grenade.`

`When a hostile character moves adjacent to me, then I Ram them.`

Therefore Frame Helm should represent the trigger structurally rather than merely storing arbitrary prose wherever practical.

—

# 4. Native Prepare Flow Search

Repository searching did not identify:

- `PrepareFlow`
- `beginPrepareFlow()`
- dedicated Prepare actor method
- dedicated Prepare sheet handler
- dedicated Prepared Action app
- dedicated trigger engine
- current Prepared Action runtime object
- current Prepared Action execution service

Therefore there is no native high-level Prepare flow for Frame Helm to preserve.

—

# 5. Legacy Packed Prepare State

The repository contains a packed mech-state structure with:

`prepare: boolean`

alongside fields such as:

- `braced`;
- `overcharged`;
- `bracedCooldown`;
- `mounted`.

This proves a Prepared-state concept existed in the packed/Comp/Con model.

However, repository searching did not identify current runtime code consuming that field.

Therefore:

`prepare: boolean`

is historical/structural evidence.

It is not sufficient to represent the actual current Prepare rules.

—

# 6. Why a Boolean Is Not Enough

Prepare requires substantially more information than:

`prepare = true`

Frame Helm must know:

- which action was prepared;
- who prepared it;
- when it was prepared;
- which turn created it;
- what trigger was specified;
- which character’s move/action/reaction can trigger it;
- whether the trigger occurred;
- whether the prepared action has been dropped;
- whether it expired;
- whether it has already executed.

Therefore Prepare requires a real state object.

—

# 7. Current Native Action Tracker

The native current action tracker contains concepts equivalent to:

- `protocol`;
- `move`;
- `full`;
- `quick`;
- `reaction`;
- `free`;
- `used_reactions`.

It does **not** contain:

`prepare`

or:

`preparedAction`

as current canonical action state.

Frame Helm should not invent writes to:

`actor.system.action_tracker.prepare`

because no such current runtime field was found.

—

# 8. Native Reaction Primitive

The native system tracks Reaction availability through:

`actor.system.action_tracker.reaction`

and generic action tracking can spend or refresh the Reaction.

This is useful for the later execution of a Prepared Action.

However, Prepare itself has additional restrictions that generic Reaction state does not represent.

—

# 9. Native Reaction Refresh

The native system refreshes Reaction availability through combat automation.

This behavior should remain relevant when Frame Helm determines whether the prepared action can be executed as a Reaction.

However, Prepare explicitly prevents other Reactions while the Prepared Action is being held.

Therefore generic Reaction availability alone is insufficient.

—

# 10. Native `used_reactions`

The current actor action tracker also contains:

`used_reactions`

but repository research has not established it as a complete Prepared Action mechanism.

No Prepare-specific runtime consumer was found.

Frame Helm should not store the entire Prepare state there unless future research proves that is its intended role.

—

# 11. No Native Prepare SynergyLocation

The inspected native `SynergyLocation` list includes concepts such as:

- move;
- boost;
- ram;
- grapple;
- overwatch;
- skirmish;
- barrage;
- improvised_attack;
- disengage;
- stabilize;
- tech;
- lock_on;
- bolster;
- brace;
- mount.

But:

`prepare`

was not found.

Therefore Frame Helm should not expect the native synergy system to provide a universal:

`when you Prepare`

semantic hook.

Prepare should still have its own Frame Helm semantic action identity.

—

# 12. Prepare Selects Another Quick Action

Prepare does not itself define the later mechanical effect.

Instead, it selects:

**another Quick Action**

Examples may include:

- Ram;
- Grapple;
- Lock On;
- Scan;
- Bolster;
- Skirmish;
- Hide;
- Activate action with Quick cost;
- actor-owned Quick Actions.

The selected child action must retain its own execution strategy.

—

# 13. Prepared Child Action

The architectural model should be:

Prepare
→ parent action/state

Prepared Action
→ child Quick Action

The child may use very different execution mechanisms.

Examples:

Prepare Ram
→ later `BasicAttackFlow`
→ Ram post-hit consequence

Prepare Lock On
→ later native condition application

Prepare Scan
→ later `ScanFlow`

Prepare Skirmish
→ later mount selection
→ WeaponAttackFlow(s)

Prepare actor-owned Quick Action
→ later native ActivationFlow or other action-specific strategy

Therefore Prepare must be execution-strategy agnostic.

—

# 14. Preparation Counts as Taking the Child Action

This is one of the most important rules.

The official rule says:

> Your preparation counts as taking the action.

Therefore when Prepare is committed:

Frame Helm must treat the chosen Quick Action as having been taken for purposes of:

- duplicate-action restrictions;
- action-order restrictions;
- Ordnance restrictions;
- other “when you take X” legality constraints.

The child action is **not** a fresh action when later triggered.

It is the delayed execution of an action already taken.

—

# 15. Duplicate Action Restriction

Official example:

A character cannot:

Skirmish

and then:

Prepare Skirmish

because the preparation counts as taking Skirmish again.

Therefore Frame Helm should validate the child action during Prepare commitment using ordinary duplicate-action legality.

Conceptually:

Prepare requested
→ child = Skirmish
→ has Skirmish already been used?
→ YES
→ Prepare Skirmish illegal

The same applies to other non-repeatable Quick Actions.

—

# 16. Prepare Itself vs Child Duplicate Identity

Prepare consumes one Quick Action as the parent action.

But for duplicate-action rules, the selected child action also counts as having been taken.

Therefore Turn state may need to record both concepts:

parent action:
`quick.prepare`

and:

prepared child duplicate identity:
e.g. `quick.skirmish`

Do not spend two Quick Actions.

This is action-legality metadata, not double action expenditure.

—

# 17. Action Budget

Prepare consumes:

**one Quick Action**

The prepared child action does **not** consume another Quick Action when it later executes.

Later execution instead consumes:

**one Reaction**

Conceptually:

Prepare now:
→ spend Quick Action

Trigger later:
→ spend Reaction
→ execute child mechanics

This is central to the implementation.

—

# 18. Prepared Action Execution Does Not Spend Quick Action Again

Wrong:

Prepare
→ spend Quick Action

trigger
→ execute Ram
→ spend another Quick Action
→ spend Reaction

Correct:

Prepare
→ spend Quick Action
→ child counted as taken

trigger
→ spend Reaction
→ execute Ram mechanics
→ no additional Quick Action expenditure

The execution API must therefore support:

`execute mechanics without normal action-cost expenditure`

This same separation is useful for Full Tech, Overwatch, and other compound actions.

—

# 19. Trigger Source

The trigger X must be an:

- Action;
- Reaction;
- or Move;

taken by another hostile or allied character.

Therefore a prepared trigger should not be an arbitrary environmental condition unless allowed by some specific rule modification.

Examples of invalid generic trigger shapes would include:

`when it becomes noon`

or:

`when I feel like firing`

under the ordinary Prepare rule.

Frame Helm should help constrain the trigger definition to legal event categories.

—

# 20. Trigger Actor

The trigger is caused by:

- a hostile character;
- or an allied character.

Frame Helm should therefore likely store a trigger relation such as:

- any hostile;
- any ally;
- specific hostile;
- specific ally;

depending on the player’s declaration and what the rules permit.

The exact UI should allow meaningful specificity without forcing raw scripting.

—

# 21. Trigger Event Categories

A reusable event vocabulary should eventually support at minimum:

`move`

`action`

`reaction`

with action-specific subtypes where possible.

Examples:

move adjacent

leaves area

Skirmishes

Boosts

attacks

Rams

uses a system

takes a Reaction

Frame Helm should consume its existing action and movement event architecture rather than build Prepare-only observers.

—

# 22. Prepare and Generic Event Architecture

Prepare benefits strongly from the semantic action/event work being done elsewhere.

Potential event sources already relevant include:

- Movement feature;
- Overwatch opportunities;
- action execution;
- reaction execution;
- Boost;
- Ram;
- Grapple;
- Skirmish;
- Full Tech children;
- system activation.

Therefore the long-term architecture should be:

game event occurs
→ event bus / trigger evaluator
→ Prepared Action trigger matcher
→ opportunity created

rather than:

Prepare individually installs ad hoc Foundry hooks for every possible trigger.

—

# 23. Prepared State Lifetime

A Prepared Action remains valid:

until the start of the preparing character’s next turn

unless earlier:

- triggered and executed;
- dropped;
- otherwise invalidated by rules.

At the start of that next turn:

if the trigger was not met:
→ Prepared Action is lost.

Therefore Prepared Action state must have a clear expiration lifecycle.

—

# 24. Expiration Boundary

The canonical expiration should be tied to:

**start of preparing character’s next turn**

not merely:

- end of current turn;
- end of round;
- next combatant;
- arbitrary timeout.

This matters because other characters may act between preparation and expiration.

—

# 25. Prepared Action Triggering

When the trigger condition is met:

the character **can** take the prepared action as a Reaction.

The wording is permissive.

Therefore trigger occurrence should create an opportunity.

It should not automatically execute the action without player choice unless Frame Helm later offers an explicit automation setting.

Conceptually:

trigger occurs
→ Prepared Action opportunity
→ player chooses:
   [Execute]
   [Decline / Drop / keep? according to rules]

The exact decline behavior should follow confirmed interpretation.

—

# 26. Generic Reaction Opportunity Architecture

Prepare should reuse the same general reaction-opportunity infrastructure as:

Overwatch

and:

Brace

Conceptually:

ReactionOpportunity
→ reacting actor
→ trigger event
→ action identity
→ execution context
→ expiration

Then:

Overwatch:
movement Threat event

Brace:
incoming attack/effect event

Prepared Action:
stored custom trigger

This avoids three separate reaction systems.

—

# 27. Cannot Take Reactions While Holding Prepared Action

This is a major Prepare rule.

After Prepare is taken:

the character cannot take any other Reactions

until:

- the Prepared Action is triggered;
- or the Prepared Action is dropped;
- or the state expires at the start of the next turn.

Therefore Frame Helm needs a stronger concept than ordinary:

`reaction available`

It needs:

`reaction locked by Prepare`

or equivalent legality state.

—

# 28. Reaction Lock

Conceptually:

Prepared Action active
→ ordinary Reaction opportunities rejected

This affects:

- Brace;
- Overwatch;
- actor-owned reactions;
- other Prepared Actions if any;
- system/talent reactions.

The Reaction availability UI should clearly communicate why Reactions are unavailable.

Example reason:

`Reactions unavailable while holding a Prepared Action.`

—

# 29. Reaction Availability After Trigger

The official rule says:

> Although you can’t take reactions while holding a prepared action, you can take them normally after it has been triggered.

Therefore once the Prepared Action is triggered and resolved:

the Prepare reaction lock ends.

Ordinary Reaction behavior resumes according to the character’s remaining Reaction availability and native/Frame Helm rules.

—

# 30. Prepared Action Uses Reaction

When the trigger occurs and the character takes the prepared action:

that action is taken as a Reaction.

Therefore it should consume the character’s Reaction according to the normal Reaction economy.

Conceptually:

Prepared trigger
→ accept execution
→ spend Reaction
→ execute child mechanics

Afterward:

Prepared state cleared.

—

# 31. Drop Prepared Action

The character may voluntarily:

**drop the prepared action**

Doing so:

- removes the prepared action;
- restores the ability to take Reactions normally;
- does not refund the Quick Action already spent.

Frame Helm should provide an explicit:

`Drop Prepared Action`

control while one is being held.

—

# 32. Drop Does Not Refund Quick Action

The Quick Action was already spent when Prepare was taken.

Dropping the Prepared Action should therefore:

clear Prepared state

but not:

restore Quick Action budget.

This should remain explicit in Turn state.

—

# 33. Action Lock After Prepare

This is perhaps the most unusual Prepare rule.

After preparing an action, the character cannot:

- move;
- take another action;
- take another Reaction;

until:

- the Prepared Action is triggered;
- or the start of the character’s next turn;

with the additional option to drop the Prepared Action to regain Reaction access.

Therefore Prepare creates a comprehensive action lock.

—

# 34. Movement Lock

While a Prepared Action is being held:

the character cannot move.

Frame Helm’s Movement feature should check Prepared state before accepting ordinary voluntary movement.

Conceptually:

token movement detected
→ actor has active Prepared Action?
→ YES
→ movement illegal

Depending on implementation constraints, Frame Helm may:

- prevent the move;
- revert it;
- warn before movement;
- otherwise reconcile illegal movement.

The exact UX should be decided during implementation.

—

# 35. Action Lock

While Prepared Action state is active:

the character cannot take any other action.

This includes ordinary:

- Quick Actions;
- Full Actions;
- Protocols if timing somehow applies;
- Free Actions where rules classify them as actions;
- actor-owned actions.

Exact interaction with special/free actions should follow the official rules and exceptions.

Frame Helm’s central action legality layer should inspect Prepare lock state.

—

# 36. Reaction Lock

While Prepared Action state is active:

the character cannot take other Reactions.

The Prepared Action itself is not yet being executed.

Therefore Brace or Overwatch opportunities should be disabled while the preparation is being held.

—

# 37. What Unlocks the Character

The action/movement/reaction lock ends when:

1. the Prepared Action is triggered;
2. or the start of the character’s next turn occurs.

Dropping the Prepared Action explicitly restores Reaction access but does not necessarily retroactively permit actions on the prior turn, because the character’s current turn has normally already progressed past Prepare.

The exact interaction with remaining same-turn budget should follow the rule timing.

—

# 38. Prepare Is Effectively Turn-Ending

Because after Prepare the character cannot:

- move;
- take actions;
- take reactions;

the action effectively ends the character’s active decision-making for that turn.

Frame Helm should reflect this strongly in presentation.

However:

Prepare is not literally the `End Turn` action.

Combat turn advancement should remain under player/GM control unless explicitly automated.

—

# 39. Prepare and Ordnance

The official rules explicitly cite Ordnance.

Example:

A character cannot:

move

then:

Prepare to Skirmish with an Ordnance weapon

if that weapon normally must be fired before moving or doing anything else on the turn.

This confirms again:

> Prepare counts as taking the child action at preparation time for legality.

Therefore action-order restrictions must be checked when Prepare is created, not only when it triggers.

—

# 40. Child Action Precondition Validation

When Prepare is committed, Frame Helm should validate all restrictions that apply to:

`taking the chosen action now`

Examples may include:

- duplicate action restriction;
- Ordnance;
- start-of-turn restrictions;
- weapon loading;
- action sequencing;
- target-independent legality;
- system resources.

Target-dependent or future-state-dependent legality may need revalidation later as well.

—

# 41. Validation at Preparation Time

Prepare commitment should validate:

- child is a Quick Action;
- child is legal to take now;
- duplicate restrictions;
- action-order restrictions;
- parent Quick Action availability;
- character not already holding Prepared Action;
- any source/resource restrictions that must be committed now.

If invalid:

Prepare should not be created.

—

# 42. Revalidation at Trigger Time

The prepared child may also need to be revalidated when triggered.

Examples:

- target no longer exists;
- weapon destroyed;
- Limited charge gone;
- system unavailable;
- target moved out of range;
- actor became Shut Down;
- Grapple legality changed.

However, revalidation should not reapply restrictions already satisfied solely by “taking the action” at preparation time in a way that incorrectly invalidates it.

The action execution context needs to distinguish:

`already committed legality`

from:

`current execution legality`.

—

# 43. Resource Timing

Some actions may consume resources when taken.

Prepare creates a design question:

Should that resource be consumed:

- when Prepare is declared;
- when the child executes;
- or according to the native action’s specific rules?

The official Prepare rule says the preparation counts as taking the action, which suggests many action-cost restrictions apply immediately.

But item/resource mutation may need action-specific tracing.

Frame Helm should not adopt one global answer without research.

—

# 44. Target Timing

Prepared actions may refer to a future target determined by the trigger.

Example:

`When a hostile character moves adjacent to me, then I Ram them.`

The target is not necessarily known when Prepare is created.

Therefore Frame Helm should support target resolution from trigger context.

Conceptually:

Trigger event
→ hostile actor moves adjacent
→ event actor becomes prepared Ram target

This is extremely useful for automation.

—

# 45. Trigger-Bound Targeting

Where the trigger clearly defines the target:

Frame Helm should bind that target automatically.

Example:

`When hostile X moves adjacent, Ram X.`

No separate target-selection prompt should be required.

For prepared actions whose target is not determined by the trigger:

Frame Helm may need to prompt at execution time.

—

# 46. Prepared Skirmish

Example architecture:

Prepare Skirmish
→ choose eligible mount/weapon restrictions as needed
→ define trigger
→ hold Prepared state

Trigger occurs
→ spend Reaction
→ resolve target from trigger or prompt
→ execute Skirmish mechanics
→ native WeaponAttackFlow(s)
→ clear Prepared state

The child action must not spend another Quick Action.

—

# 47. Prepared Ram

Prepare Ram
→ child action recorded as `quick.ram`
→ Ram duplicate identity counts as used
→ trigger stored

Trigger:
hostile moves adjacent
→ prepared opportunity
→ target = triggering hostile
→ spend Reaction
→ shared Basic Maneuver Attack adapter
→ BasicAttackFlow
→ Ram consequence
→ clear Prepared state

—

# 48. Prepared Grapple

Likewise:

Prepare Grapple
→ later trigger
→ triggering actor may become target
→ BasicAttackFlow
→ Grapple consequence

The same child execution strategy documented in `af-grapple-ram.md` should be reused.

—

# 49. Prepared Quick Tech

Prepare may select a Quick Tech action because Quick Tech actions are Quick Actions.

Examples:

- Bolster;
- Lock On;
- Scan;
- Invade;
- actor-owned Quick Tech.

At trigger time, each uses its normal mechanical execution strategy.

Prepare itself does not convert these into a new tech flow.

—

# 50. Prepared Activate

An actor-owned system action with Quick activation may be prepared if otherwise legal.

At trigger time:

Prepared Action
→ resolve original item/action identity
→ execute through native ActivationFlow or the action-specific adapter

Therefore exact item/action identity must survive in Prepared state.

—

# 51. Prepared Action Must Preserve Source Identity

A Prepared Action should store enough information to resolve:

- universal action ID;
- or item UUID;
- action path;
- source actor;
- execution strategy;
- selected mount if committed early;
- other action-specific configuration.

Do not store only the display label.

—

# 52. Proposed Prepared Action State

Conceptually:

PreparedActionState
{
  actorId,
  tokenId,
  sceneId,

  parentActionId,
  childActionId,

  childSource,
  executionStrategy,

  trigger,

  createdRound,
  createdTurn,

  expiresAtTurnStart,

  status,

  executionContext
}

Exact names are illustrative only.

The important requirement is enough state to reconstruct the child action later.

—

# 53. Trigger Definition State

Conceptually:

trigger:
{
  actorRelation,
  eventType,
  actionType,
  spatialCondition,
  specificActorId,
  parameters
}

Example:

When hostile character moves adjacent

could become:

actorRelation:
`hostile`

eventType:
`move`

spatialCondition:
`becomes-adjacent`

This is preferable to relying solely on raw English text.

—

# 54. Human-Readable Trigger

Even with a structured trigger, Frame Helm should retain/display the player’s human-readable declaration.

Example:

`WHEN a hostile character moves adjacent to me, THEN Ram them.`

This is useful for:

- transparency;
- debugging;
- GM adjudication;
- cases automation cannot fully interpret.

—

# 55. Trigger Complexity

The tabletop rule allows natural-language triggers, which means not every legal trigger will be easy to automate perfectly.

Frame Helm should therefore support a layered model:

1. structured triggers it can automate;
2. manually acknowledged triggers it can store and present;
3. GM/player adjudication where automation is ambiguous.

This matches Frame Helm’s player-first scope without trying to become the arbiter of every rule.

—

# 56. Trigger Detection

For automatable triggers:

game event occurs
→ Prepared trigger evaluator runs
→ candidate Prepared Actions identified
→ conditions tested
→ matching Prepared Reaction opportunities generated

This should happen through central event surfaces rather than polling actor state constantly.

—

# 57. Trigger Event Sources

Useful event sources may include:

Movement:
→ move events

Actions:
→ Quick/Full/Free actions

Reactions:
→ reaction executions

Native adapters:
→ weapon attacks
→ tech actions
→ activation actions

These events can support both Prepare and future talent/system trigger automation.

—

# 58. Prepare Visibility

The official rule says Prepare is visible to casual observers.

Examples include:

- taking aim;
- cycling systems.

Therefore Frame Helm should not treat a Prepared Action as secret state by default.

Presentation may expose that a character is:

`PREPARED`

and potentially the declared trigger/action depending on game information policy.

The exact UI visibility to opposing players should be decided deliberately.

—

# 59. Native Status for Prepared State

No current native Prepared status was found.

Therefore Frame Helm should not invent a fake native Lancer status unless one is needed for canvas/UI presentation.

The authoritative Prepare state should probably remain Frame Helm-owned.

A Foundry flag or Frame Helm document state may be appropriate if persistence across reloads is needed.

—

# 60. Persistence

Prepared state may need to survive:

- Frame Helm application rerenders;
- application close/reopen;
- token selection changes;
- turn changes involving other actors;
- possibly client reconnect/reload.

Therefore UI-local memory is insufficient.

The exact persistence strategy should be designed during implementation.

—

# 61. Start-of-Next-Turn Cleanup

When the preparing actor’s next turn begins:

if Prepared Action remains held:
→ expire it
→ clear Prepared state
→ clear movement/action/reaction lock
→ action is lost
→ Reaction availability follows normal turn/combat rules

This cleanup should occur before the actor begins making new-turn decisions.

—

# 62. Triggered Cleanup

When Prepared Action executes:

→ mark Prepared Action triggered
→ spend Reaction
→ execute child mechanics
→ clear Prepared state
→ release Prepare locks
→ ordinary Reaction legality resumes afterward

History should preserve that Prepare existed and executed.

—

# 63. Dropped Cleanup

When player chooses Drop:

→ mark Prepared state dropped
→ clear active Prepared Action
→ release Reaction lock
→ preserve Quick Action expenditure/history
→ do not execute child action

This should be an explicit state transition.

—

# 64. Failed Triggered Execution

Possible case:

trigger occurs
→ player attempts Prepared Action
→ execution becomes impossible

Examples:

- target invalid;
- item destroyed;
- actor Shut Down;
- target out of range.

Frame Helm needs a policy for whether the Prepared Action is:

- lost;
- remains held;
- considered triggered;
- can be declined.

This should be resolved from rules/GM intent where not explicit.

Do not silently invent a favorable retry mechanic.

—

# 65. Prepare and Movement Feature

While Prepared Action is active:

voluntary movement should be prohibited.

Movement feature should therefore consult active Prepared state before accepting/recording actor-initiated movement.

Forced movement may be different because the character is not choosing to move.

The exact rule interaction should be confirmed.

—

# 66. Forced Movement While Prepared

The rule says:

`you can’t move`

which may refer to voluntary movement rather than being forcibly moved.

Frame Helm should research whether:

- Knockback;
- Ram;
- Grapple drag;
- teleport by another effect

breaks or invalidates Prepare.

Do not equate every token coordinate change with voluntarily moving.

Movement method context from `af-Movement-variants.md` will matter.

—

# 67. Prepare and Reactions

Reaction engine should consult Prepare state globally.

Conceptually:

Reaction opportunity arrives
→ actor holding Prepared Action?

YES:
→ is this the Prepared Action’s trigger opportunity?
   YES → may execute Prepared Action
   NO → reject ordinary Reaction

NO:
→ normal Reaction legality

This is the cleanest central rule.

—

# 68. Prepare and Overwatch

If actor holds a Prepared Action:

ordinary Overwatch should be unavailable.

If the prepared child itself is some attack triggered by movement:

that Prepared Action can execute when its own trigger occurs.

After the Prepared Action is triggered/resolved:

ordinary Reactions become available normally again, subject to Reaction expenditure.

—

# 69. Prepare and Brace

Likewise, while holding a Prepared Action:

Brace is unavailable.

If the Prepared Action is triggered and resolved:

the Prepare lock ends.

Future Brace opportunities then follow ordinary Reaction availability.

—

# 70. Prepare and Protocol

Because Protocol must occur at the start of the actor’s turn, ordinary action ordering should naturally mean Protocol has already been used or lost before Prepare is taken.

The central action legality layer should preserve all normal ordering restrictions.

Prepare should not special-case Protocol unless a specific rule requires it.

—

# 71. Prepare and End Turn

After Prepare, the player is effectively unable to voluntarily do more.

Frame Helm may make the End Turn control prominent.

However, Prepare itself should not automatically advance combat unless that becomes an explicit UX preference.

—

# 72. Prepare and Duplicate Keys

Frame Helm’s duplicate-action tracking should account for the prepared child.

Conceptually:

Prepare Ram
→ used action includes Prepare
→ used duplicate keys should also reflect Ram as taken

This prevents:

Ram
→ Prepare Ram

and:

Prepare Ram
→ later normal Ram in same turn

when ordinary duplicate rules prohibit it.

—

# 73. Child Action History

Turn history should preserve both:

Prepare declaration

and:

child execution

Example:

use-action:
`quick.prepare`

prepared-child:
`quick.ram`

later:

execute-prepared-action:
`quick.ram`

This provides useful debugging and UI history.

Exact event names are illustrative only.

—

# 74. Parent / Child Execution Context

The prepared child should execute with context conceptually equivalent to:

source:
`prepared`

parentAction:
`quick.prepare`

spendNormalActionCost:
`false`

spendReaction:
`true`

alreadyCountedAsTaken:
`true`

Exact API names should be designed during Actions refactor.

The concepts are more important than the names.

—

# 75. Shared Compound Action Architecture

Prepare reinforces the need for a shared execution architecture also useful for:

- Full Tech;
- Barrage;
- Skirmish;
- Overwatch.

Common pattern:

parent action
→ owns action economy / orchestration

child execution
→ owns mechanics

Prepare is special because the child executes later and through a Reaction.

—

# 76. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- Prepare Quick Action;
- child Quick Action selection;
- child-action legality;
- duplicate tracking;
- Ordnance/order validation;
- trigger definition;
- trigger storage;
- trigger matching;
- Prepared Action persistence;
- movement/action/reaction lock;
- Drop behavior;
- expiration;
- Prepared Reaction opportunity;
- child execution context;
- cleanup;
- presentation.

**NATIVE LANCER OWNS:**

- native actor/item data;
- generic Reaction state where integrated;
- Reaction refresh;
- native execution flows for child actions;
- native action/resource mechanics downstream;
- actor/item document mutation.

—

# 77. Do Not Invent `PrepareFlow`

No native `PrepareFlow` was found.

Frame Helm may implement a Prepare service/state machine, but it should be clearly Frame Helm-owned.

Native child action flows remain reusable where they actually exist.

—

# 78. Initial Frame Helm Prepare Flow

The initial implementation should conceptually be:

Player selects Prepare
→ choose another legal Quick Action
→ define `When X, then Y` trigger
→ validate child action as if taken now
→ spend one Quick Action
→ mark child duplicate/action identity as taken
→ create Prepared Action state
→ lock voluntary movement
→ lock other actions
→ lock other Reactions
→ show Prepared state
→ end/continue current turn only through legal controls

Then later:

qualifying game event occurs
→ match trigger
→ create Prepared Reaction opportunity
→ player accepts
→ validate current execution conditions
→ spend Reaction
→ execute stored child mechanics without Quick Action cost
→ clear Prepared state
→ release locks
→ refresh state/UI

Or:

player drops Prepared Action
→ clear Prepared state
→ restore ordinary Reaction access
→ Quick Action remains spent

Or:

start of actor’s next turn
→ Prepared Action expires
→ clear state
→ release locks
→ action is lost

—

# 79. Immediate Repository Research TODO

- [ ] Trace legacy `IMechState.prepare` fully.
- [ ] Confirm no current runtime consumer exists.
- [ ] Trace native Reaction state completely.
- [ ] Trace native Reaction refresh completely.
- [ ] Trace `used_reactions`.
- [ ] Determine whether native action_tracker reaction state should remain synchronized with Frame Helm.
- [ ] Search for current native prepared-action terminology under alternate names.
- [ ] Search for delayed-action / held-action helpers.
- [ ] Search for combat hooks useful for start-of-next-turn expiration.
- [ ] Trace native action events/hooks suitable for trigger monitoring.
- [ ] Trace native movement hooks suitable for trigger monitoring.
- [ ] Trace item activation events suitable for trigger monitoring.
- [ ] Determine whether action execution outputs expose enough semantic identity to match Prepared triggers.

—

# 80. Trigger Engine Research TODO

- [ ] Define generic Frame Helm game-event envelope.
- [ ] Define movement event.
- [ ] Define action event.
- [ ] Define reaction event.
- [ ] Include acting actor/token identity.
- [ ] Include ally/hostile relationship.
- [ ] Include action ID/type.
- [ ] Include origin/destination for movement.
- [ ] Include target where relevant.
- [ ] Define spatial predicates such as `moves adjacent`.
- [ ] Define trigger matcher.
- [ ] Support specific actor triggers.
- [ ] Support any ally / any hostile.
- [ ] Support manual/unautomated trigger acknowledgement.
- [ ] Preserve human-readable declaration.

—

# 81. Rules/Behavior TODO

- [ ] Confirm whether Free Actions are prohibited while holding Prepare.
- [ ] Confirm whether forced movement invalidates Prepare.
- [ ] Confirm whether being moved by an ally counts as “you move”.
- [ ] Confirm whether involuntary reactions can occur while holding Prepare.
- [ ] Confirm resource-consumption timing for Prepared item actions.
- [ ] Confirm target legality revalidation.
- [ ] Confirm whether declining a triggered action causes it to be lost.
- [ ] Confirm behavior when multiple trigger events occur simultaneously.
- [ ] Confirm behavior if trigger occurs while actor cannot legally execute child.
- [ ] Confirm whether Prepared Action can trigger during the preparing actor’s own turn after declaration.
- [ ] Confirm interaction with special multiple-Reaction abilities.

—

# 82. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add canonical Prepared Action state.
- [ ] Add Prepare execution strategy.
- [ ] Add Quick Action child selector.
- [ ] Filter to legal Quick Actions.
- [ ] Add structured trigger builder.
- [ ] Add human-readable trigger summary.
- [ ] Validate child as taken at Prepare time.
- [ ] Record child duplicate identity.
- [ ] Spend Quick Action exactly once.
- [ ] Add action lock.
- [ ] Add voluntary movement lock.
- [ ] Add Reaction lock.
- [ ] Add Drop Prepared Action control.
- [ ] Add start-of-next-turn expiration.
- [ ] Add generic trigger event architecture.
- [ ] Add Prepared trigger matching.
- [ ] Add Prepared Reaction opportunity UI.
- [ ] Bind trigger-defined target/context.
- [ ] Spend Reaction on accepted execution.
- [ ] Execute child without normal Quick Action cost.
- [ ] Reuse child action’s normal execution strategy.
- [ ] Clear Prepared state after execution.
- [ ] Release locks after trigger/drop/expiration.
- [ ] Preserve history.
- [ ] Refresh authoritative state/UI.
- [ ] Persist Prepared state outside UI-local memory.

—

# 83. Smoke Test TODO

Basic Prepare:

- [ ] Prepare valid Quick Action.
- [ ] Quick Action spent once.
- [ ] child action counted as taken.
- [ ] Prepared state visible.
- [ ] movement blocked.
- [ ] actions blocked.
- [ ] Reactions blocked.
- [ ] End Turn still possible.

Duplicates:

- [ ] Skirmish then Prepare Skirmish rejected.
- [ ] Prepare Skirmish then second Skirmish rejected.
- [ ] Prepare Ram correctly reserves Ram duplicate identity.
- [ ] different Quick Action remains legal before Prepare only if action budget/rules allow.

Trigger:

- [ ] hostile Move trigger.
- [ ] allied Move trigger.
- [ ] hostile Action trigger.
- [ ] allied Action trigger.
- [ ] hostile Reaction trigger.
- [ ] allied Reaction trigger.
- [ ] specific actor trigger.
- [ ] any-hostile trigger.
- [ ] spatial trigger such as moves adjacent.

Execution:

- [ ] prepared Ram uses BasicAttackFlow.
- [ ] prepared Grapple uses BasicAttackFlow.
- [ ] prepared Skirmish uses mount attack infrastructure.
- [ ] prepared Lock On applies native condition.
- [ ] prepared Scan uses ScanFlow.
- [ ] prepared Invade uses TechAttackFlow.
- [ ] prepared Activate resolves exact source item/action.
- [ ] child does not spend another Quick Action.
- [ ] accepted child spends Reaction exactly once.

Lifecycle:

- [ ] Drop clears Prepared state.
- [ ] Drop does not refund Quick Action.
- [ ] Drop restores Reaction access.
- [ ] trigger execution clears Prepared state.
- [ ] trigger execution restores ordinary Reaction legality afterward.
- [ ] start of next turn expires untriggered Prepare.
- [ ] expired Prepared Action is lost.
- [ ] locks clear correctly after expiration.

Restrictions:

- [ ] moved-before-Prepare Ordnance restriction enforced.
- [ ] destroyed weapon revalidation.
- [ ] target out-of-range handling.
- [ ] Shutdown while Prepared.
- [ ] forced movement interaction.
- [ ] multiple simultaneous trigger candidates.

—

# 84. Important Invariants

**Invariant 1**

Prepare is a Quick Action.

**Invariant 2**

Prepare selects another Quick Action.

**Invariant 3**

The preparation itself counts as taking the selected child action.

**Invariant 4**

The child action must obey ordinary duplicate and action-order restrictions at Prepare time.

**Invariant 5**

Prepare spends one Quick Action.

**Invariant 6**

The child does not spend another Quick Action when triggered.

**Invariant 7**

The child executes later as a Reaction.

**Invariant 8**

Prepared state lasts only until the start of the preparing character’s next turn unless triggered or dropped sooner.

**Invariant 9**

While holding Prepared Action state, the character cannot voluntarily move or take other actions or Reactions.

**Invariant 10**

The player may drop the Prepared Action to regain ordinary Reaction access.

**Invariant 11**

Dropping Prepare does not refund the Quick Action already spent.

**Invariant 12**

No dedicated native Prepare Flow or current Prepared Action runtime state was found.

—

# 85. Final Working Model

PREPARE
│
├── Quick Action
│
├── no native PrepareFlow found
│
├── legacy native evidence:
│   └── `prepare: boolean`
│
├── choose another Quick Action
│
├── validate child as if taken now
│   ├── duplicate restrictions
│   ├── Ordnance/order restrictions
│   ├── resources
│   └── other legality
│
├── spend one Quick Action
│
├── child counts as taken
│
├── define:
│   └── `When X, then Y`
│
├── create Prepared Action state
│
├── while held:
│   ├── cannot voluntarily move
│   ├── cannot take actions
│   └── cannot take other Reactions
│
├── TRIGGER OCCURS
│   │
│   ├── generate Prepared Reaction opportunity
│   ├── bind trigger context/target
│   ├── spend Reaction
│   ├── execute child mechanics
│   ├── do NOT spend Quick Action again
│   ├── clear Prepared state
│   └── restore normal Reaction legality
│
├── DROP
│   │
│   ├── clear Prepared state
│   ├── restore Reaction access
│   └── Quick Action remains spent
│
└── START OF NEXT TURN
    │
    ├── if still held:
    │   └── Prepared Action is lost
    ├── clear Prepared state
    └── clear Prepare locks

The critical architectural rule is:

**Prepare is delayed execution of an action that has already been taken.**

Frame Helm therefore needs to separate:

`action legality / action expenditure / duplicate identity`

from:

`mechanical execution`.

That separation should become a shared foundation for Prepare, Full Tech, Overwatch, and other compound or deferred actions.
EOF