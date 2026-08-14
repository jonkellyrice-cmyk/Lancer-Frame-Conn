# AF — Improvised Attack

## Status

- [x] Native Lancer action flow identified
- [x] Native Frame Conn execution route identified
- [x] Action-cost classification identified
- [x] Target requirement identified
- [x] Native attack flow identified
- [x] Initial Frame Conn integration strategy identified
- [ ] Automatic target acquisition implemented
- [ ] Automatic attack modifiers implemented
- [ ] Automatic hit determination implemented
- [ ] Automatic damage rolling implemented
- [ ] Automatic damage application implemented
- [ ] Automatic status / condition consequences implemented where applicable


# 1. Action Identity

## Lancer Action

Improvised Attack

## Action Type

Full Action

## Frame Conn Action ID

`full.improvised-attack`

## Frame Conn Execution Kind

`basic-attack`

## Requires Target

Yes.

Improvised Attack is useful as an early action-flow integration target because it is an attack, but unlike Skirmish and Barrage it does not require Frame Conn to first solve weapon-mount selection.

The acting mech’s equipped weapon mounts therefore do not need to be understood in order to invoke the native Improvised Attack flow.


# 2. Why This Flow Matters

Improvised Attack gives Frame Conn a relatively simple example of the general attack-execution pipeline.

The important architecture is:

Player
  ↓
Frame Conn committed plan
  ↓
Improvised Attack entry
  ↓
Execute button / d20 control
  ↓
Target acquisition
  ↓
Frame Conn action execution
  ↓
Native Lancer attack flow
  ↓
Attack configuration / resolution
  ↓
Chat roll
  ↓
Future automated resolution

This gives us a useful foundation before handling the substantially more complicated weapon-mount behavior required by Skirmish and Barrage.


# 3. Existing Frame Conn Action Mapping

Frame Conn currently maps:

`full.improvised-attack`

to the execution kind:

`basic-attack`

The same general execution category is currently associated with several attack-like actions, including:

- `quick.skirmish`
- `quick.grapple`
- `quick.ram`
- `full.barrage`
- `reaction.overwatch`

This does NOT mean all of those actions ultimately have identical execution requirements.

In particular, Skirmish and Barrage require weapon-mount selection and therefore need additional native-flow research before their final implementations can be designed.


# 4. Existing Frame Conn Execution Entry Point

The currently identified Frame Conn execution entry point is:

`frameConnExecuteActionRoll(actor, action)`

For an action whose execution kind is:

`basic-attack`

Frame Conn dispatches into the Lancer actor through:

`actor.beginBasicAttackFlow(action.label)`

Therefore the current Improvised Attack execution route is conceptually:

`full.improvised-attack`
  ↓
`basic-attack`
  ↓
`frameConnExecuteActionRoll(actor, action)`
  ↓
`actor.beginBasicAttackFlow(action.label)`
  ↓
native Lancer attack flow

This is important because Frame Conn should reuse the Lancer system’s existing execution machinery wherever that machinery already exists rather than reimplementing Lancer attack resolution from scratch.


# 5. Actor Resolution

Frame Conn already knows which mech the Helm belongs to.

The same actor association currently used for information such as:

- controlled unit identity
- token identity
- mech telemetry

should provide the actor used for action execution.

The intended execution call therefore operates on the authoritative Lancer actor belonging to the currently active Frame Conn unit.

Conceptually:

Frame Conn
  ↓
active / controlled unit
  ↓
Lancer Actor
  ↓
native actor action methods

This actor relationship should remain centralized rather than having individual action implementations independently search for their actor.


# 6. Committed Plan Representation

Committed plan entries already contain execution-related information including:

- `entryId`
- `actionId`
- `requiresTarget`
- `executionKind`
- `executable`
- `executed`

Executable committed actions can therefore expose an execution control directly on the committed-action card.

For Improvised Attack, that control should visually use the small d20 / dice icon associated with Lancer’s native rolling UI.

Conceptually:

┌─────────────────────────────────────────┐
│ IMPROVISED ATTACK                   d20 │
│ Full Action                              │
└─────────────────────────────────────────┘

The dice control belongs to the individual committed action rather than to the committed plan as a whole.


# 7. Immediate Execution Goal

The first implementation stage should preserve as much of the native Lancer attack workflow as possible.

The desired initial flow is:

1. Player commits Improvised Attack.

2. Frame Conn creates the committed-action entry.

3. The entry displays its d20 execution button.

4. Player clicks the d20 button.

5. Frame Conn verifies that the action requires a target.

6. If no valid target is currently selected, Frame Conn enters target-selection mode.

7. The player selects the intended target in Foundry.

8. Frame Conn resolves the acting Lancer actor.

9. Frame Conn invokes:

   `frameConnExecuteActionRoll(actor, action)`

10. The execution layer identifies the action as:

    `basic-attack`

11. Frame Conn invokes:

    `actor.beginBasicAttackFlow(action.label)`

12. The native Lancer attack interface opens.

13. The player completes the native attack flow normally.

14. Lancer performs its normal roll / chat behavior.

15. Frame Conn marks the committed action as executed.


# 8. Target Acquisition

Improvised Attack requires a target.

The intended Frame Conn behavior is NOT simply to fail with a message saying that no target was selected.

Instead:

Click d20
  ↓
Does action require target?
  ↓
YES
  ↓
Is a valid target already selected?
  ├── YES → continue
  └── NO
       ↓
       activate Foundry target-selection tool
       ↓
       wait for player to select target
       ↓
       acquire selected target
       ↓
       continue execution

The player should therefore experience target selection as part of executing the committed action.

The long-term goal is:

**click action → click target → resolution**

rather than:

**manually select target → return to Helm → click action**.


# 9. Native Lancer UI

The currently desired first-stage implementation deliberately retains Lancer’s native attack popup.

That popup already represents system-native attack resolution behavior and allows the player to configure the attack using Lancer’s existing mechanisms.

This is preferable during the first integration stage because it allows Frame Conn to delegate rules behavior to the existing Lancer system while we continue researching the underlying execution APIs.


# 10. Transitional Architecture

The native popup is transitional.

It is NOT the desired final Frame Conn user experience.

The progression should be:

## Stage 1 — Native delegation

Committed action
  ↓
d20
  ↓
target
  ↓
native Lancer attack flow
  ↓
native popup
  ↓
native roll

## Stage 2 — Frame Conn supplies attack context

Committed action
  ↓
d20
  ↓
target
  ↓
Frame Conn derives known modifiers
  ↓
native Lancer roll machinery
  ↓
attack result

## Stage 3 — Automated attack resolution

Committed action
  ↓
d20
  ↓
target
  ↓
derive Accuracy / Difficulty
  ↓
derive flat modifiers
  ↓
roll attack
  ↓
determine hit
  ↓
roll damage
  ↓
apply damage
  ↓
apply deterministic secondary effects
  ↓
mark action executed


# 11. Final Desired Improvised Attack Flow

The eventual user-facing flow should be extremely small.

Player commits:

`Improvised Attack`

The committed plan displays:

`Improvised Attack                         [d20]`

The player clicks:

`[d20]`

Frame Conn switches Foundry into target-selection mode.

The player clicks the target.

From that point onward Frame Conn should perform everything it can determine automatically.

Conceptually:

d20 click
  ↓
select target
  ↓
resolve actor
  ↓
resolve target
  ↓
construct attack context
  ↓
calculate Accuracy / Difficulty
  ↓
calculate flat attack modifiers
  ↓
roll attack
  ↓
compare against target defenses
  ↓
if hit
  ↓
roll Improvised Attack damage
  ↓
apply damage through Lancer-native mechanisms
  ↓
apply deterministic effects
  ↓
post appropriate roll information to chat
  ↓
mark committed action executed


# 12. Native-System-First Rule

Frame Conn should not recreate functionality already correctly implemented by the Lancer system.

Where possible:

Frame Conn
  ↓
orchestrates
  ↓
Lancer system
  ↓
executes canonical mechanics

This is particularly important for:

- actor data
- attack rolls
- damage rolls
- defenses
- statuses
- conditions
- resource mutations
- chat-card behavior
- system-specific roll semantics

Frame Conn should become an automation and orchestration layer over Lancer rather than a parallel implementation of Lancer.


# 13. Player-First Automation Boundary

Frame Conn is not intended to become the universal arbiter of every Lancer rule.

However, when Frame Conn executes an action and the resulting game-state consequence is deterministic, Frame Conn should eventually carry that consequence through.

For example:

attack resolved
  ↓
deterministic damage
  ↓
apply damage

or:

action resolved
  ↓
target receives known status / condition
  ↓
apply status / condition

or:

action resolved
  ↓
acting mech removes a known condition
  ↓
remove condition

The general rule is:

**Frame Conn may defer judgment, but it should not defer deterministic consequences of an action it has already resolved.**


# 14. State Mutations

Improvised Attack research should ultimately document every state mutation produced by the native flow.

Potential categories include:

- attack-roll result
- target-defense comparison
- damage roll
- HP damage
- Armor interaction
- Resistance interaction
- Overshield interaction
- status application
- condition application
- status removal
- condition removal
- actor resource changes
- target resource changes
- action expenditure
- committed-action execution state
- chat output

Not every category necessarily applies to Improvised Attack itself.

The purpose of recording them is to ensure that the action-flow investigation follows resolution all the way to authoritative game-state mutation rather than stopping after a dice roll appears in chat.


# 15. Separation From Action Commitment

Committing an action and executing an action are separate operations.

Commit:

`Improvised Attack`
  ↓
spend Full Action budget
  ↓
create committed-plan entry

Execute:

committed-plan entry
  ↓
click d20
  ↓
target
  ↓
perform native action
  ↓
mark execution state

This distinction is important because Frame Conn’s planning interface intentionally allows the player to establish their turn plan before performing its individual mechanical operations.


# 16. Relationship to Future Attack Flows

Improvised Attack should establish reusable infrastructure for later attack actions.

Reusable pieces should include:

- committed-action execution button
- target requirement metadata
- target-selection orchestration
- actor resolution
- target resolution
- native execution dispatch
- execution-state tracking
- error handling
- chat / roll integration
- eventual automatic damage application

Skirmish and Barrage can then extend that infrastructure with weapon-mount resolution rather than rebuilding the entire execution pipeline.


# 17. Important Difference From Skirmish

Improvised Attack does not require selecting an equipped weapon mount.

Skirmish does.

Therefore:

Improvised Attack
  ↓
actor
  ↓
target
  ↓
attack flow

whereas Skirmish will eventually require something closer to:

Skirmish
  ↓
actor
  ↓
eligible weapon mounts
  ↓
selected mount
  ↓
weapon(s) fired from mount
  ↓
target
  ↓
attack flow

This distinction is one reason Improvised Attack is an excellent reference implementation for the common attack infrastructure.


# 18. Important Difference From Barrage

Barrage introduces substantially more mount logic.

A Barrage can involve multiple mounts, while a Superheavy weapon can occupy two mounts and requires Barrage to fire.

Consequently, Barrage cannot simply be treated as “perform basic attack twice.”

Its dedicated action-flow research must identify how the native Lancer system represents:

- weapon mounts
- multiple weapons within mounts
- mount selection
- Superheavy weapons
- weapons occupying multiple mounts
- sequential attacks
- target selection for individual attacks
- attack modifiers
- damage resolution

That work belongs in:

`docs/af-barrage.md`


# 19. Implementation Dependency

Do NOT begin the deep Improvised Attack automation implementation until the current organizational refactor is complete.

The remaining decomposition targets are:

- `feature_actions`
- `feature_movement`
- `ui_application`
- `ui_movement`
- `ui_turn`

The purpose is to establish smaller ownership boundaries before adding the considerably more complicated action-execution infrastructure.

Current Frame Conn behavior after the recent refactor and smoke test should be treated as the behavioral baseline.


# 20. Implementation Checklist

## Existing foundation

- [x] Improvised Attack exists in Frame Conn.
- [x] Improvised Attack is represented as a Full Action.
- [x] Frame Conn action ID is known.
- [x] Execution kind is known.
- [x] Actor-native basic attack entry route is known.
- [x] Committed actions support execution metadata.
- [x] Executable committed actions can expose an execution control.

## First implementation stage

- [ ] Finish organizational refactor.
- [ ] Preserve existing Frame Conn behavior.
- [ ] Verify Improvised Attack action declaration.
- [ ] Verify `requiresTarget`.
- [ ] Verify `executionKind`.
- [ ] Add / preserve d20 control on committed-action card.
- [ ] Resolve active Frame Conn actor.
- [ ] Detect currently selected target.
- [ ] Enter Foundry target-selection mode when necessary.
- [ ] Resume action after target selection.
- [ ] Invoke Frame Conn action-execution boundary.
- [ ] Delegate to native Lancer basic attack flow.
- [ ] Allow native Lancer popup to perform configuration.
- [ ] Allow native Lancer roll / chat flow to complete.
- [ ] Mark committed action executed only after successful invocation.
- [ ] Handle cancellation without falsely marking the action executed.

## Native-flow research

- [ ] Locate implementation of `beginBasicAttackFlow`.
- [ ] Trace every method called by `beginBasicAttackFlow`.
- [ ] Identify attack-dialog class / function.
- [ ] Identify attack-dialog input model.
- [ ] Identify Accuracy representation.
- [ ] Identify Difficulty representation.
- [ ] Identify flat attack modifier representation.
- [ ] Identify target-defense lookup.
- [ ] Identify attack-roll construction.
- [ ] Identify native roll evaluation.
- [ ] Identify chat-message construction.
- [ ] Identify damage-roll entry point.
- [ ] Identify native damage application entry point.
- [ ] Identify Armor handling.
- [ ] Identify Resistance handling.
- [ ] Identify Overshield handling.
- [ ] Identify status / condition mutation APIs.
- [ ] Identify cancellation / failure behavior.

## Final automation stage

- [ ] Remove dependency on manual native attack configuration popup.
- [ ] Construct attack context automatically.
- [ ] Resolve target defense automatically.
- [ ] Resolve Accuracy automatically.
- [ ] Resolve Difficulty automatically.
- [ ] Resolve flat modifiers automatically.
- [ ] Roll attack automatically.
- [ ] Determine hit automatically.
- [ ] Roll damage automatically on hit.
- [ ] Apply damage through native Lancer mechanisms.
- [ ] Apply deterministic statuses / conditions.
- [ ] Apply other deterministic state mutations.
- [ ] Preserve appropriate Lancer chat output.
- [ ] Mark committed action executed.
- [ ] Refresh Frame Conn presentation from authoritative state.


# 21. Research Questions

The next repository pass should answer:

1. What exactly does `actor.beginBasicAttackFlow()` call?

2. Where is the native attack popup constructed?

3. What object represents the attack being configured?

4. How does Lancer represent Accuracy and Difficulty internally?

5. How are flat attack modifiers supplied?

6. How is the target actor/token supplied to the attack?

7. Which defense does the attack resolve against?

8. What native function actually rolls the attack?

9. What native function constructs the resulting chat card?

10. Is attack success determined before or after chat-card creation?

11. What native function rolls Improvised Attack damage?

12. What native function applies that damage to the target?

13. Can damage application be invoked programmatically without reproducing Lancer’s damage rules?

14. How does the system handle Armor, Resistance, and Overshield?

15. Which APIs apply and remove Lancer statuses and conditions?

16. What does the native flow return when the player cancels the attack popup?

17. Can Frame Conn provide the attack configuration directly and bypass the popup while still using native Lancer resolution?

Those answers should determine how much of the final automated pipeline can be composed from existing Lancer functionality rather than recreated inside Frame Conn.


# 22. Architectural Goal

Improvised Attack should become the first clean reference implementation of:

**Frame Conn action declaration**
  ↓
**Turn commitment**
  ↓
**Committed-plan presentation**
  ↓
**Execution request**
  ↓
**Target acquisition**
  ↓
**Actor / target resolution**
  ↓
**Lancer-native mechanics**
  ↓
**Deterministic state mutation**
  ↓
**Frame Conn state synchronization**

Once that pipeline is stable, other actions should plug into the same execution architecture and provide only the action-specific information and intermediate steps they actually require.