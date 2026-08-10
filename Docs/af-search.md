# Search

# AF — Search

## Status

**Native dedicated Search execution flow:** Not found.

**Native dedicated `beginSearchFlow()`:** Not found.

**Native Search semantic SynergyLocation:** Not found.

**Reusable native stat/check flow:** Found.

**Native Systems stat:** Found.

**Native Agility stat:** Found.

**Native Sensors range:** Found.

**Native Hidden status:** Found.

**Native Invisible status:** Found.

**Native contested/opposed-check framework:** Not found.

**Official tabletop Search rules:** Confirmed.

**Frame Helm implementation status:** Frame Helm should own Search targeting, Sensors validation, contested Systems-vs-Agility orchestration, success/failure comparison, and Hidden removal while reusing native actor stats, stat-roll machinery, Sensors data, and native Hidden status infrastructure.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Search** Quick Action and combines them with the confirmed tabletop rules.

Repository investigation did not reveal a dedicated executable Search flow such as:

`SearchFlow`

or:

`beginSearchFlow()`

The native system does, however, provide the lower-level primitives required to construct Search correctly:

- native Systems;
- native Agility;
- native Sensors;
- native stat/check rolling through `StatRollFlow`;
- native Hidden status;
- generic status/effect mutation.

What it does not provide is the actual contested Search action.

Therefore:

> Frame Helm should own the higher-order Search action.

while:

> Native Lancer should remain authoritative for the underlying actor stats, stat rolls, Sensors value, and Hidden status representation.

—

# 1. Search Classification

Search is a **Quick Action**.

For a mech, Search:

- chooses a character within Sensors;
- targets a character the player suspects is Hidden;
- makes a contested Systems check against that character’s Agility;
- removes Hidden from the target if the searching character wins.

Search is therefore not:

- a weapon attack;
- a Tech Attack;
- a damage action.

It is a contested stat-check action with a deterministic status consequence on success.

—

# 2. Official Mech Search Rule

The confirmed tabletop rule is:

> To Search in a mech, choose a character within your Sensors that you suspect is Hidden and make a contested Systems check against their Agility.

If the Hidden character is found using Search:

> They immediately lose Hidden and can be located again by any character.

This gives us the complete mech-side rules contract.

—

# 3. Pilot Search Rule

The official rule also contains a pilot-on-foot version.

A pilot on foot:

- makes a contested skill check;
- adds bonuses from triggers as normal;
- can reveal characters within Range 5.

Frame Helm is primarily a mech-facing interface, so the pilot-on-foot branch can remain out of initial implementation scope unless pilot-mode support is expanded later.

This document focuses primarily on mech Search.

—

# 4. Native Search Flow Search

Repository searching did not identify:

- `SearchFlow`
- `beginSearchFlow()`
- dedicated Search flow file
- dedicated Search actor method
- dedicated Search application
- Search-specific sheet execution handler
- Search-specific contested-check service

Therefore Frame Helm cannot delegate complete Search execution to a native Search workflow.

—

# 5. Native Search Semantic Identity

The inspected native `SynergyLocation` list did not include:

`search`

Therefore Frame Helm should not expect the same structured Search semantic hook currently available for actions such as:

- Ram;
- Grapple;
- Overwatch;
- Skirmish;
- Barrage;
- Brace;
- Disengage.

Frame Helm should preserve Search as its own semantic action/event for future trigger integration.

—

# 6. Native Stat Roll Entry Point

The native actor exposes:

`actor.beginStatFlow(path, title?)`

This constructs:

`StatRollFlow`

and provides a reusable native stat/check execution path.

Conceptually:

actor
→ stat path
→ `beginStatFlow(...)`
→ native StatRollFlow

This is the principal native roll primitive relevant to Search.

—

# 7. Native StatRollFlow

The discovered native flow contains steps equivalent to:

`initStatRollData`
→ `showStatRollHUD`
→ `rollCheck`
→ `printStatRollCard`

This gives Frame Helm reusable support for:

- native stat modifier resolution;
- Accuracy/Difficulty adjustment;
- d20 roll;
- native result presentation;
- native chat card.

Frame Helm should reuse this machinery where practical.

—

# 8. Native Systems Stat

The mech’s authoritative Systems stat is native actor data.

Relevant path:

`system.sys`

Therefore the searching mech’s side of the contest should use native:

`actor.system.sys`

or the native stat-flow path resolving that value.

Do not duplicate Systems inside Frame Helm.

—

# 9. Native Agility Stat

The target’s authoritative Agility stat is native actor data.

Relevant path:

`system.agi`

Therefore the target’s side of the contest should use native:

`targetActor.system.agi`

or the native stat-flow path resolving that value.

Do not duplicate Agility inside Frame Helm.

—

# 10. Native Sensors

The actor model contains:

`actor.system.sensor_range`

This is the authoritative Sensors range.

Search eligibility should use this native value.

Conceptually:

searcher token
→ target token
→ native/Foundry distance
→ compare with `actor.system.sensor_range`

Do not create a second Frame Helm Sensors stat.

—

# 11. Sensors Is the Explicit Search Range Rule

The official mech Search rule explicitly says:

choose a character:

`within your Sensors`

Therefore Sensors is the primary range restriction.

This is important because the rule does **not** add an explicit LOS requirement.

—

# 12. Do Not Invent an LOS Requirement

The official Search wording does not require ordinary line of sight.

It says:

choose a character within your Sensors that you suspect is Hidden.

Therefore Frame Helm should not add:

`must have LOS`

as an extra legality condition unless another rule or effect specifically imposes it.

This is an important implementation invariant.

—

# 13. Search and Sensors Presentation

Frame Helm’s Sensors UI already knows the controlled mech’s Sensors range.

Search targeting should therefore be able to reuse:

- current controlled mech;
- token position;
- sensor radius;
- target token identity.

The same sensor-range calculation should be shared between UI presentation and Search legality.

Avoid separate distance logic.

—

# 14. Target Selection

Search requires a target.

The target is a character:

- within Sensors;
- suspected by the player to be Hidden.

The player does not need to prove Hidden state before choosing the target.

The rule deliberately allows suspicion.

Therefore Frame Helm should not require:

`target.system.statuses.hidden === true`

before allowing the attempt.

That would leak hidden information and violate the action’s intent.

—

# 15. Hidden-State Information Must Not Leak

Because the player chooses a character they **suspect** is Hidden, Search should not reveal whether the selected target is actually Hidden before the contested check resolves.

Wrong behavior:

select target
→ Frame Helm says “Target is not Hidden”

before roll

Potentially correct behavior:

select suspected target
→ resolve Search normally
→ only apply Hidden removal if relevant on success

Exact GM/visibility behavior should preserve hidden information.

—

# 16. Native Hidden Status

The native actor model contains:

`system.statuses.hidden`

with a corresponding native Hidden status identity and icon.

Therefore when Search succeeds against a Hidden target:

Frame Helm should remove the native Hidden condition through the preferred native status/effect API.

Do not create a separate Frame Helm-only revealed flag as a substitute.

—

# 17. Search Success Consequence

The official rule is explicit:

once a Hidden character has been found using Search:

→ they immediately lose Hidden

and:

→ can be located again by any character.

Therefore the primary mechanical mutation on Search success is:

remove native `hidden`.

—

# 18. Search Does Not Apply a Temporary Reveal Marker

The rule does not describe:

`revealed until end of turn`

or:

`detected only by the searcher`

Instead:

Hidden is lost entirely.

Therefore Frame Helm should not create a searcher-specific reveal relationship.

Successful Search removes the target’s Hidden state globally.

—

# 19. Native Invisible Status Is Separate

The native system also contains:

`system.statuses.invisible`

This is separate from Hidden.

Search should not automatically remove Invisible unless a specific rule says so.

Official Search says:

Hidden character found
→ loses Hidden

It does not say:

→ loses Invisible

Therefore preserve Invisible independently.

—

# 20. Native Invisibility Mechanics Remain Native

Native attack resolution already contains dedicated Invisible handling.

Search should not duplicate or alter that machinery.

If a target is both:

Hidden
+
Invisible

and Search succeeds:

→ remove Hidden
→ leave Invisible intact unless another rule says otherwise.

—

# 21. No Native Contested Check Framework

Repository searching did not identify a generic:

`ContestedCheckFlow`

`OpposedRollFlow`

or equivalent framework.

Therefore Frame Helm must own:

- launching/resolving the two sides;
- comparing results;
- determining winner;
- handling ties according to the actual contested-check rules.

The exact tie rule should be confirmed from Lancer’s general contested-check rules if not already known.

—

# 22. Search Is Not One Stat Roll

A complete mech Search is:

Systems
vs
Agility

Therefore simply calling:

`actor.beginStatFlow(“system.sys”, “SEARCH”)`

is not enough.

That only resolves the searcher’s side.

Frame Helm needs the opponent’s side as well.

—

# 23. Searcher Roll

The searcher’s side is:

`Systems`

Conceptually:

searcher
→ native stat path `system.sys`
→ StatRollFlow
→ Systems result

The initial implementation may preserve the native stat-roll HUD.

—

# 24. Target Roll

The target’s side is:

`Agility`

Conceptually:

target actor
→ native stat path `system.agi`
→ StatRollFlow
→ Agility result

Whether this second roll should visibly open a HUD for the target/GM or be rolled programmatically is a UX decision.

The mechanical stat source remains native.

—

# 25. Contested Resolution

Conceptually:

Search Systems total
vs
Target Agility total
→ compare
→ determine winner

If searcher wins:

→ Search succeeds

If searcher does not win:

→ Search fails

The exact tie behavior should use the general Lancer contested-check rule.

Do not invent tie handling inside Search if the core rules already define it.

—

# 26. Native Accuracy/Difficulty

StatRollFlow provides the native Accuracy/Difficulty check interface.

This allows situational Accuracy and Difficulty to affect the Systems and Agility rolls where appropriate.

Frame Helm should preserve this in the first implementation rather than building a custom check roller immediately.

—

# 27. Future Automatic Contest Resolution

Eventually the desired Frame Helm architecture may be:

Search clicked
→ target selected
→ derive searcher Systems
→ derive target Agility
→ derive all Accuracy/Difficulty modifiers
→ roll both automatically
→ compare
→ resolve success/failure
→ remove Hidden automatically on success
→ print concise result

This can come later.

The native stat flows provide a safer initial path.

—

# 28. Proposed Initial Search Flow

Committed Search
→ click d20 execution control
→ resolve authoritative searcher actor/token
→ if no target:
   switch Foundry to target-selection mode
→ player selects suspected character
→ validate target exists
→ validate target within Sensors
→ begin searcher’s native Systems check
→ obtain result
→ begin target’s native Agility check
→ obtain result
→ compare contested totals
→ determine winner
→ if searcher wins:
   remove native Hidden if target currently has Hidden
→ if searcher loses:
   no Hidden mutation
→ mark Search executed
→ refresh authoritative state
→ refresh Frame Helm presentation

—

# 29. Search Uses the d20 Execution Control

Search requires a check.

Therefore the committed-plan action card should use the d20-style execution affordance planned for roll-based actions.

Conceptually:

`SEARCH                                      [d20]`

Clicking it begins target acquisition and contested-check resolution.

—

# 30. Quick Action Expenditure

Search consumes:

**one Quick Action**

Frame Helm Turn state owns that expenditure.

The two native stat rolls are mechanical resolution only.

They should not independently spend additional actions.

Conceptually:

Search parent
→ spend Quick Action

Systems roll
→ no extra action cost

Agility roll
→ no action cost for target

—

# 31. Target Does Not Spend an Action

The target’s Agility roll is the opposing side of a contested check.

It is not:

- a Reaction;
- a Quick Action;
- a Free Action.

Therefore do not alter the target’s action budget simply because it rolls Agility.

—

# 32. Search and Committed Plan

Search should appear as one committed action.

Do not create separate committed cards for:

- Systems roll;
- Agility roll.

Those are child resolution steps.

Conceptually:

Committed Plan
→ Search

Execution
→ Systems vs Agility

—

# 33. Parent / Child Execution Architecture

Search reinforces the general pattern:

parent action
→ owns action economy and semantic identity

child rolls
→ own mechanical resolution only

This is similar to:

Prepare
→ delayed child action

Full Tech
→ two child Quick Tech executions

Barrage
→ multiple weapon attacks

Search
→ two contested stat rolls

—

# 34. Search Target Legality

At execution time, validate:

- target token exists;
- target actor exists;
- target is a character;
- target is within Sensors;
- target is not the searcher unless rules somehow allow self-targeting;
- scene/token context valid.

Do not require target Hidden state to be visible to the searching player.

—

# 35. Sensor Distance

Use the native/Foundry grid measurement system for the distance between searcher and target.

This should account for the same scene/grid configuration used elsewhere in Frame Helm.

Do not measure raw pixels.

—

# 36. Elevation and Sensors

If Foundry/Lancer Sensors range measurement accounts for elevation, Search should reuse the same range helper.

If current Frame Helm Sensors presentation is 2D-only, this should be researched before claiming full 3D correctness.

Search and Sensors display should share one canonical range calculation.

—

# 37. Search Does Not Require Cover

Unlike Hide, Search has no explicit cover prerequisite.

Cover may influence whether someone became Hidden, but Search itself asks only whether the suspected character is within Sensors.

Therefore do not require Soft or Hard Cover checks as part of Search legality.

—

# 38. Search and LOS Service

The visibility/LOS service planned for Hide may still be useful for broader Sensors presentation.

However, Search’s core legality should not depend on it unless another relevant rule requires it.

This is a case where sharing infrastructure must not accidentally add extra rules.

—

# 39. Search and Hidden Lifecycle

Hide applies/maintains Hidden.

Search removes Hidden on successful discovery.

Therefore these two action flows should share the same native status adapter.

Conceptually:

Hide
→ native status adapter
→ apply `hidden`

Search success
→ same adapter
→ remove `hidden`

This keeps state ownership consistent.

—

# 40. Search and Sensors UI

Once Search succeeds and Hidden is removed:

Frame Helm Sensors presentation should refresh from authoritative actor/token state.

Because the target can now be located normally by any character, any player-facing concealment behavior tied to native Hidden should be removed accordingly.

Do not maintain stale local concealment state.

—

# 41. Failure

On Search failure:

- the target remains Hidden if they were Hidden;
- no native status is removed;
- the Search Quick Action remains spent;
- the committed action is marked executed.

Search is not refunded because the contested check failed.

—

# 42. Searching a Non-Hidden Target

Because the rules permit choosing someone the player merely suspects is Hidden, the target may not actually be Hidden.

Frame Helm should avoid leaking this fact before the check.

After resolution:

if target was not Hidden:
→ there is no Hidden status to remove.

The exact chat/result wording should avoid exposing more secret information than appropriate.

—

# 43. Information Visibility

Search involves hidden-information adjudication.

Potentially the GM may know:

- whether the target is Hidden;
- whether the selected token is the correct hidden character;
- whether the player’s suspicion is correct.

Frame Helm should not automatically expose GM-only state to players through legality messages.

This should be considered when designing errors/result messaging.

—

# 44. Hidden Target Selection Problem

A fully Hidden character may not always be represented as a normally clickable token for the searching player.

Frame Helm may therefore eventually need a Search targeting mode that works with its Sensors presentation rather than relying only on ordinary visible token selection.

Potential approaches include:

- sensor contact selector;
- known/suspected contact marker;
- GM-mediated target;
- token selection where Foundry still exposes the token.

The exact UI depends on how Frame Helm represents Hidden contacts.

—

# 45. Current First Implementation

The simplest initial implementation can assume the suspected target can be selected through Foundry target state.

If no selected target exists:

→ switch to target-selection mode.

Later, Sensors-specific hidden-contact targeting can replace or augment this.

—

# 46. Native Stat Bonus Categories

Repository searching did not find a Search-specific flat bonus field comparable to:

`system.bonuses.flat.ram`

or:

`system.bonuses.flat.grapple`

However, native structured bonuses exist for broader categories such as:

- Systems;
- HASE;
- skill checks.

Therefore Search modifiers should come through the normal Systems/stat-check machinery unless a specific feature has custom Search logic.

—

# 47. Actor-Owned Search Modifiers

Mounted Systems, Traits, Talents, Core Powers, and Core Bonuses may alter Search.

Potential modifiers include:

- Accuracy on Search;
- expanded Search range;
- automatic discovery;
- Search against different stat;
- additional effects on success.

Where structured effect data exists, Frame Helm should consume it.

Do not create a generic prose parser first.

—

# 48. Search Semantic Event

Because native `SynergyLocation.search` was not found, Frame Helm should preserve its own semantic Search event.

Potential future triggers may care about:

- when you Search;
- when you succeed on Search;
- when you reveal a Hidden target.

Exact internal event names are conceptual only.

—

# 49. Search Success Event

It may be useful to distinguish:

Search executed

from:

Search succeeded

and:

Hidden removed

These are not identical events.

Example:

Search a non-Hidden target
→ Search executes
→ contested result may succeed
→ no Hidden status exists to remove

Future content could care about different stages.

—

# 50. Native Status Mutation

When removing Hidden, Frame Helm should use the preferred native Foundry/Lancer status/effect helper.

Avoid direct raw mutation of:

`system.statuses.hidden`

unless repository research shows that is the canonical method.

The actor’s derived status field may be produced from ActiveEffects/statuses rather than intended as direct storage.

—

# 51. Authoritative Refresh

After Search success:

→ await Hidden-status removal
→ re-read target actor state
→ confirm Hidden absent
→ refresh Frame Helm Sensors/UI

Do not assume mutation succeeded from local intent alone.

—

# 52. Contested Roll Presentation

The initial UI should make the contest understandable.

Conceptually:

SEARCH

Searcher:
Systems result = X

Target:
Agility result = Y

Outcome:
Success / Failure

The exact display may be native chat cards plus Frame Helm summary.

Do not obscure that this is a contested roll.

—

# 53. Native Chat Output

Each StatRollFlow may print its own native stat-roll card.

That means the first implementation may produce:

Systems roll card

plus:

Agility roll card

plus optionally:

Search result summary

This is acceptable initially.

Later automation may consolidate the presentation.

—

# 54. Target Roll Ownership / Permissions

Rolling the target’s Agility may encounter Foundry ownership/permission issues if the target belongs to another player or GM-controlled NPC.

Frame Helm should trace whether:

- the searching player can invoke target actor StatRollFlow;
- the GM must execute it;
- the roll can be created programmatically without ownership;
- a socket/GM authority path is needed.

This is a high-value implementation research item.

—

# 55. NPC Agility

Search may target NPCs.

Frame Helm must confirm that native NPC actors expose the appropriate Agility-equivalent stat at the expected path or whether NPC stat representation differs.

Do not assume every actor type stores:

`system.agi`

identically without tracing.

If NPCs differ, the native-system adapter should normalize the opposing Search stat.

—

# 56. Mech vs Mech Search

For PC mech targets:

target Agility should come from the normal mech HASE data.

This is the simplest contested Search case.

—

# 57. Search Against Non-Mech Characters

The rule says choose a character.

Potential targets may include:

- mechs;
- NPCs;
- other character types.

The adapter should resolve the correct opposing Agility value according to native actor type.

This should be researched before generalizing the implementation.

—

# 58. Tie Handling

Search depends on the general contested-check rule.

Before final implementation:

- confirm who wins ties;
- whether attacker/initiator wins;
- whether higher raw modifier matters;
- whether rerolls apply.

Frame Helm should centralize contested-check resolution so future opposed actions can reuse it.

—

# 59. Shared Contested Check Service

Search is a good candidate for a generic Frame Helm contested-check abstraction.

Conceptually:

ContestedCheck
→ initiator stat/check
→ defender stat/check
→ roll both
→ compare under Lancer contested rules
→ return outcome

Search then configures:

initiator:
Systems

defender:
Agility

This could be reusable for other rules later.

—

# 60. Do Not Invent Native `SearchFlow`

No native SearchFlow was found.

Frame Helm may implement:

SearchExecutionService

or a similar internal strategy, but it should be clearly Frame Helm-owned.

The native reusable primitive is:

`StatRollFlow`

not:

`SearchFlow`.

—

# 61. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- Search Quick Action;
- Quick Action expenditure;
- target selection;
- target secrecy-safe legality;
- Sensors range validation;
- contested-check orchestration;
- Systems-vs-Agility comparison;
- tie resolution through confirmed rules;
- Search success/failure;
- native Hidden removal command;
- Search semantic events;
- committed-plan execution state;
- Sensors/UI refresh.

**NATIVE LANCER OWNS:**

- actor Systems;
- actor Agility;
- actor Sensors;
- StatRollFlow;
- native stat-roll HUD;
- native stat-roll chat cards;
- native Hidden status identity;
- native Invisible status identity;
- generic status/effect infrastructure.

—

# 62. Proposed Initial Native Integration

SEARCH
→ Frame Helm resolves searcher
→ Frame Helm resolves target
→ Frame Helm validates Sensors
→ Native:
   `searcher.beginStatFlow(“system.sys”, “SEARCH”)`
→ capture Systems result
→ Native:
   target Agility stat flow or normalized equivalent
→ capture Agility result
→ Frame Helm contested comparison
→ if Search succeeds:
   Frame Helm native-status adapter removes `hidden`
→ await mutation
→ refresh target/searcher/UI
→ mark Search executed

Exact native calls should be wrapped through the dedicated native-system adapter rather than invoked directly from UI code.

—

# 63. Future Automated Search Flow

Eventually:

Committed Search
→ click d20
→ select suspected target
→ automatic Sensors validation
→ derive searcher Systems
→ derive target Agility
→ derive Accuracy/Difficulty for both
→ roll both automatically
→ compare
→ remove Hidden automatically on success
→ print one consolidated Search result
→ refresh Sensors contacts

This is the desired mature player-facing workflow.

—

# 64. Immediate Repository Research TODO

- [ ] Trace `actor.beginStatFlow(...)` completely.
- [ ] Trace StatRollFlow constructor and state.
- [ ] Trace `initStatRollData`.
- [ ] Determine exact returned/result data from StatRollFlow.
- [ ] Determine whether Flow completion exposes final total programmatically.
- [ ] Determine whether two StatRollFlows can be orchestrated sequentially without scraping chat output.
- [ ] Trace native Systems actor path across actor types.
- [ ] Trace native Agility actor path across actor types.
- [ ] Confirm NPC Agility representation.
- [ ] Trace `actor.system.sensor_range`.
- [ ] Locate canonical native/Foundry token distance helper.
- [ ] Trace native Hidden status application/removal helper.
- [ ] Confirm no Search-specific bonus field exists.
- [ ] Search actor-owned data for structured Search modifiers.
- [ ] Trace ownership/permission behavior for rolling another actor’s stat.
- [ ] Determine whether GM/socket delegation is required.

—

# 65. Contested Check Research TODO

- [ ] Confirm general Lancer contested-check rule.
- [ ] Confirm tie behavior.
- [ ] Confirm Accuracy/Difficulty handling on both sides.
- [ ] Confirm whether both sides roll d20 independently.
- [ ] Confirm critical results have any special relevance.
- [ ] Define reusable contested-check result contract.
- [ ] Preserve individual roll results.
- [ ] Preserve winning side.
- [ ] Preserve tie state if relevant.
- [ ] Support future opposed actions.

—

# 66. Search Rules/Behavior TODO

- [ ] Confirm whether any character within Sensors can be selected regardless of LOS.
- [ ] Confirm no additional cover requirement.
- [ ] Confirm Search failure has no extra consequence.
- [ ] Confirm successful Search removes Hidden immediately.
- [ ] Confirm successful Search does not remove Invisible.
- [ ] Confirm whether a non-Hidden suspected target causes any special information result.
- [ ] Confirm how Search targets are represented when Hidden tokens are not normally selectable.
- [ ] Confirm NPC opposing Agility rules.
- [ ] Confirm interactions with special Sensors modifiers.
- [ ] Confirm interactions with Scan.
- [ ] Confirm interactions with Invisible.
- [ ] Confirm interactions with Lock On.

—

# 67. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Search execution strategy.
- [ ] Keep Search in universal Quick Action catalog.
- [ ] Add d20 execution control.
- [ ] Reuse general target-selection mode.
- [ ] Preserve suspected-target secrecy.
- [ ] Resolve authoritative searcher actor/token.
- [ ] Resolve authoritative target actor/token.
- [ ] Validate Sensors range.
- [ ] Do not impose LOS requirement.
- [ ] Add reusable contested-check service.
- [ ] Configure initiator stat = Systems.
- [ ] Configure defender stat = Agility.
- [ ] Reuse StatRollFlow initially.
- [ ] Capture both roll totals.
- [ ] Apply confirmed tie rules.
- [ ] Determine Search outcome.
- [ ] On success, remove native Hidden.
- [ ] Preserve native Invisible.
- [ ] Await status mutation.
- [ ] Re-read authoritative target state.
- [ ] Mark committed Search executed.
- [ ] Refresh Sensors/UI.
- [ ] Emit Search semantic event.
- [ ] Emit Search-success/Hidden-revealed event where useful.
- [ ] Preserve Quick Action expenditure exactly once.

—

# 68. Smoke Test TODO

Targeting:

- [ ] target within Sensors accepted.
- [ ] target outside Sensors rejected.
- [ ] no target enters target-selection mode.
- [ ] selected target does not need visible Hidden flag.
- [ ] target secrecy not leaked before roll.
- [ ] no LOS requirement accidentally imposed.

Contest:

- [ ] correct searcher Systems used.
- [ ] correct target Agility used.
- [ ] Accuracy/Difficulty applied correctly.
- [ ] target roll does not spend target action.
- [ ] tie resolves according to Lancer rules.
- [ ] searcher success detected.
- [ ] searcher failure detected.

Hidden:

- [ ] success against Hidden target removes native Hidden.
- [ ] failure leaves Hidden intact.
- [ ] Invisible remains intact.
- [ ] Sensors presentation refreshes.
- [ ] target becomes normally locatable after Hidden removal.

Other:

- [ ] Quick Action spent exactly once.
- [ ] both native stat rolls produce expected output.
- [ ] NPC target works.
- [ ] PC mech target works.
- [ ] permission/GM-controlled target works.
- [ ] stale/deleted target fails cleanly.

—

# 69. Important Invariants

**Invariant 1**

Search is a Quick Action.

**Invariant 2**

No dedicated native SearchFlow was found.

**Invariant 3**

Mech Search chooses a suspected Hidden character within Sensors.

**Invariant 4**

Search does not require an explicit LOS check under the confirmed rule.

**Invariant 5**

Search is a contested Systems check against target Agility.

**Invariant 6**

Frame Helm must orchestrate the contest because no native opposed-check flow was found.

**Invariant 7**

Native actor Systems, Agility, and Sensors remain authoritative.

**Invariant 8**

Search success immediately removes native Hidden.

**Invariant 9**

Search does not automatically remove Invisible.

**Invariant 10**

Search target selection must not leak whether the target is actually Hidden.

**Invariant 11**

The target’s opposing roll does not spend an action or Reaction.

**Invariant 12**

Frame Helm owns Search action economy and outcome; native Lancer owns the underlying stats, stat-roll machinery, and Hidden status representation.

—

# 70. Final Working Model

SEARCH
│
├── Quick Action
│
├── no native SearchFlow
│
├── target:
│   └── character within searcher’s SENSORS
│       └── player suspects target is HIDDEN
│
├── no explicit LOS requirement
│
├── Frame Helm target handling
│   ├── select suspected character
│   ├── preserve hidden information
│   └── validate Sensors
│
├── CONTESTED CHECK
│   │
│   ├── Searcher
│   │   └── SYSTEMS
│   │       └── native StatRollFlow
│   │
│   └── Target
│       └── AGILITY
│           └── native StatRollFlow / normalized native check
│
├── Frame Helm comparison
│   └── apply official contested-check rules
│
├── FAILURE
│   └── no Hidden mutation
│
└── SUCCESS
    │
    ├── target immediately loses HIDDEN
    ├── remove native `hidden` status
    ├── preserve `invisible`
    ├── target becomes normally locatable
    └── refresh Sensors / authoritative state

The critical architectural rule is:

**Search is a Frame Helm-owned contested-action orchestration over native Systems, Agility, Sensors, StatRollFlow, and Hidden state.**

The native system provides the pieces.

Frame Helm supplies the contest.
