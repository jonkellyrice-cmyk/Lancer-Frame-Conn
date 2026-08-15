# Hide

# AF — Hide

## Status

**Native dedicated Hide execution flow:** Not found.

**Native Hidden status representation:** Found.

**Native Invisible status representation:** Found.

**Native Cover status representation:** Found.

**Native cover attack-modifier integration:** Found.

**Native invisibility attack-modifier integration:** Found.

**Native LOS visualization infrastructure:** Found.

**Native automatic Hide legality / LOS / cover engine:** Not found.

**Native Hide semantic SynergyLocation:** Not found.

**Frame Conn implementation status:** **Native Hidden application is implemented; live validation pending.** `quick.hide` is now a canonical non-roll Execute action and applies native `hidden` through Status Orchestration. Execution currently rejects actors already Hidden or Engaged. Complete cover/invisibility/observer qualification and all Hidden-breaking lifecycle rules remain pending the dedicated visibility/cover rules work; this implementation should not be described as complete Hide legality yet.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Hide** Quick Action and defines the intended Frame Conn implementation boundary.

Repository investigation did not reveal a dedicated executable Hide flow such as:

`HideFlow`

or:

`beginHideFlow()`

The native system does, however, provide several important lower-level concepts:

- native Hidden status;
- native Invisible status;
- native Soft Cover status;
- native Hard Cover status;
- native attack modifiers for Cover;
- native attack modifiers for Invisible;
- optional line-of-sight visualization support.

What the native system does **not** appear to provide is the higher-order Hide rules engine that answers:

- whether a character is currently allowed to Hide;
- whether sufficient cover/obstruction exists;
- whether observers can see the character;
- when Hidden should be lost;
- what exact targeting consequences Hidden should create.

Therefore:

> Frame Conn should implement the universal Hide action and Hidden lifecycle.

while:

> Native Lancer should remain authoritative for the underlying status identities and the attack mechanics it already understands.

—

# 1. Hide Classification

Hide is a **Quick Action**.

It does not inherently require:

- an attack roll;
- a Tech Attack;
- a damage roll;
- a hostile target.

Its mechanical structure is primarily:

Hide legality
→ apply Hidden state
→ maintain Hidden state
→ monitor events that break Hidden

Therefore Hide belongs principally to:

- Actions;
- Turn state;
- visibility/observation logic;
- cover/LOS logic;
- status management;
- targeting legality.

—

# 2. Native Hide Flow Search

Repository searching did not identify:

- `HideFlow`
- `beginHideFlow()`
- dedicated Hide flow file
- dedicated Hide actor method
- dedicated Hide sheet execution handler
- dedicated Hide runtime app
- dedicated Hide action executor

Therefore Frame Conn cannot delegate Hide to a native Hide workflow.

—

# 3. Native Hidden Status

The native actor model contains:

`system.statuses.hidden`

The actor’s prepared/default status state includes:

`hidden: false`

and native status processing can mark:

`actor.system.statuses.hidden = true`

when the corresponding native Foundry/Lancer status is active.

Therefore the native system has a legitimate authoritative representation for:

`this actor is Hidden`

Frame Conn should use that status rather than creating a second independent Hidden flag.

—

# 4. Native Hidden Status Identity

The native status-icon registry includes:

`id: “hidden”`

with the native Hidden icon.

Therefore Frame Conn can rely on native Lancer/Foundry presentation for the underlying Hidden condition.

Conceptually:

Frame Conn performs Hide
→ native `hidden` status applied
→ actor native status state updates
→ native status icon/presentation updates

—

# 5. Generic Native Status Application

The native system converts status items/effects into actor status changes through generic Foundry ActiveEffect/status infrastructure.

Relevant native effect changes can target fields conceptually like:

`system.statuses.${status.system.lid}`

Therefore a native status whose LID is:

`hidden`

can drive:

`system.statuses.hidden`

Frame Conn should prefer native status/effect helpers rather than raw actor field mutation.

—

# 6. Hidden Runtime Rules Are Largely Missing

Although native Hidden state exists, repository searching did not reveal substantial runtime consumers of:

`actor.system.statuses.hidden`

No native attack, movement, targeting, LOS, or action engine was found that automatically enforces the complete Hidden rules.

Therefore:

> Applying native `hidden` is necessary, but not sufficient.

Frame Conn will need to own the rules behavior that makes Hidden mechanically meaningful.

—

# 7. Hidden vs Invisible

Hidden and Invisible are separate native states.

Native Lancer represents both:

`system.statuses.hidden`

and:

`system.statuses.invisible`

These must not be conflated.

The universal Hide action should produce:

`Hidden`

not:

`Invisible`

unless some separate rule explicitly grants Invisible.

—

# 8. Native Invisible Status

The repository contains:

`actor.system.statuses.invisible`

with native status identity:

`invisible`

The native attack Accuracy/Difficulty system actively consumes this status.

This is much more mechanically implemented than Hidden.

—

# 9. Native Invisibility Attack Behavior

The native Accuracy/Difficulty infrastructure contains explicit invisibility logic.

Conceptually:

target has `system.statuses.invisible`
→ target attack data recognizes Invisible
→ native attack roll incorporates invisibility mechanics

The implementation includes a dedicated invisibility plugin/module.

Therefore Frame Conn should preserve native attack handling for Invisible.

Do not recreate Invisible attack resolution inside Hide.

—

# 10. Foundry Core Invisible Behavior Is Disabled

The Lancer system explicitly disables Foundry Core’s special automatic invisibility behavior.

Conceptually:

`CONFIG.specialStatusEffects.INVISIBLE = null`

Therefore:

native Lancer `invisible`

does **not** simply mean:

`Foundry hides this token from vision automatically`

This is important.

Frame Conn sensors/targeting cannot assume the Lancer Invisible status will automatically remove a token from Foundry visibility.

—

# 11. Hidden Is Not Foundry Token Hidden

Frame Conn must also distinguish:

Lancer status:
`hidden`

from:

Foundry token/document:
`hidden`

These are different concepts.

Foundry token-hidden state typically controls whether a token is visible to players.

Lancer Hidden is a game-mechanical condition.

Therefore:

Hide action
→ native Lancer `hidden`

should not automatically mean:

set token document `hidden = true`

unless a specific visualization policy deliberately does so.

—

# 12. Native Cover States

The native actor model contains:

`system.statuses.cover_soft`

and:

`system.statuses.cover_hard`

These correspond to native Soft Cover and Hard Cover conditions.

Therefore the system already has first-class cover status concepts.

—

# 13. Native Cover Attack Integration

The native Accuracy/Difficulty system reads cover statuses from the target.

Conceptually:

target has `cover_hard`
→ Cover.Hard

else if target has `cover_soft`
→ Cover.Soft

else
→ Cover.None

These values are then incorporated into attack modifiers.

Therefore native Lancer already understands the combat effect of manually/structurally assigned cover status.

—

# 14. Native Soft Cover

Native Soft Cover contributes the appropriate attack penalty through Accuracy/Difficulty processing.

Conceptually:

Soft Cover
→ native attack modifier

Frame Conn should not duplicate that modifier.

If the target correctly possesses native `cover_soft`, native attacks should remain authoritative for the attack consequence.

—

# 15. Native Hard Cover

Likewise:

Hard Cover
→ native attack modifier

The native Accuracy/Difficulty system already interprets it.

Frame Conn should not pre-subtract or independently reproduce Hard Cover attack Difficulty.

—

# 16. Native Cover Exceptions

Native attack processing also knows that some attacks ignore cover.

The discovered logic includes exceptions for concepts such as:

- Seeking;
- Tech Attacks;
- applicable Melee attacks.

Therefore Frame Conn should not create a separate generic:

`if cover then -X`

calculation.

Native attack resolution already owns the detailed modifier logic.

—

# 17. Cover Assignment Is Not Automatically Geometric

Repository searching did not reveal a complete native geometry engine that automatically determines:

terrain/token arrangement
→ Soft Cover

or:

terrain/token arrangement
→ Hard Cover

for the Hide action.

The attack system consumes:

cover status

but does not appear to be the component that geometrically derives it.

Therefore the distinction is:

native system:
→ understands effects of Cover

Frame Conn / GM / other integration:
→ must determine whether Cover actually exists

This is directly relevant to Hide legality.

—

# 18. Hide Requires More Than Cover Status

A character possessing:

`cover_soft`

or:

`cover_hard`

does not automatically prove the character can Hide.

Hide legality may depend on:

- cover;
- obstruction;
- line of sight;
- observation;
- special rules;
- visibility effects.

Therefore Frame Conn should treat native Cover status as one useful input, not necessarily the entire Hide legality decision.

The exact rule text must remain authoritative.

—

# 19. Native LOS Infrastructure

The repository contains substantial line-of-sight type definitions associated with optional:

`terrain-height-tools`

integration.

Relevant capabilities include concepts such as:

`calculateLineOfSight(...)`

`calculateLineOfSightByShape(...)`

`calculateLineOfSightRaysBetweenTokens(...)`

`drawLineOfSightRaysBetweenTokens(...)`

This provides useful native/optional geometry infrastructure.

—

# 20. LOS Visualization in Attack UI

The native Accuracy/Difficulty target UI can use terrain-height-tools to draw LOS rays between attacker and target.

Conceptually:

hover target
→ if terrain-height-tools available
→ draw LOS rays

If unavailable:

→ fall back to ordinary token hover behavior

Therefore the repository does have optional native-aware LOS visualization.

—

# 21. LOS Is Not a Native Hide Flow

No repository path was found connecting:

Hide
→ terrain-height-tools LOS
→ automatic Hide legality

Likewise, no generic native action layer was found automatically preventing attacks or target selection because of the same LOS calculation.

Therefore terrain-height-tools should currently be understood as:

useful geometry/visualization infrastructure

not:

a discovered complete Hide legality engine.

—

# 22. Frame Conn Hide Eligibility Layer

Frame Conn will therefore need a dedicated Hide eligibility function/service.

Conceptually:

Can actor Hide?
→ resolve authoritative token/actor
→ inspect current visibility state
→ inspect relevant cover/obstruction
→ inspect LOS from potential observers as required
→ inspect special rule modifiers
→ return legal / illegal with reason

The exact algorithm should come from confirmed Lancer Hide rules.

—

# 23. Observation vs Pure LOS

Hide may depend on whether the character is actually observed rather than only whether one geometric LOS line exists.

Therefore Frame Conn should avoid prematurely reducing Hide legality to:

`no LOS from one selected enemy`

The eventual visibility model may need to consider:

- all hostile observers;
- Sensors;
- cover;
- Invisible;
- special detection;
- line of sight;
- scene geometry.

This requires explicit rules research.

—

# 24. Frame Conn Sensors Relationship

Frame Conn already has a player-facing Sensors system.

Hide should eventually integrate with that broader perception architecture.

Potential conceptual relationship:

visibility engine
→ actor/token
→ LOS
→ Sensors
→ statuses
→ cover
→ special detection
→ observable / not observable

Then Hide eligibility and Hidden targeting behavior can consume that result.

This is preferable to putting duplicate LOS logic directly inside the Hide action.

—

# 25. Native Hidden Status Application

The initial Hide implementation should use the native Hidden status.

Conceptually:

Hide action succeeds
→ apply native `hidden`
→ await authoritative actor mutation
→ verify `actor.system.statuses.hidden`
→ refresh Frame Conn

This provides native status identity and presentation while Frame Conn supplies the missing lifecycle mechanics.

—

# 26. Proposed Initial Hide Flow

The initial Frame Conn flow should be:

Player commits Hide
→ Hide appears in Committed Plan
→ player executes Hide
→ resolve authoritative actor/token
→ validate active Turn
→ validate Quick Action
→ evaluate Hide eligibility
→ if illegal:
   reject with clear reason
→ if legal:
   apply native `hidden` status
   record Hide execution
   register Hidden lifecycle monitoring
→ refresh authoritative actor state
→ refresh Frame Conn presentation

No attack roll is required.

No target is inherently required.

—

# 27. Hide Does Not Need a d20 Roll

Hide is not an attack or check by default.

Therefore the committed-plan UI should use a non-roll execution control.

Conceptually:

`HIDE                                       [execute]`

rather than:

`HIDE                                       [d20]`

The exact icon belongs to the UI layer.

—

# 28. Turn Economy Ownership

Hide consumes:

**one Quick Action**

Frame Conn’s Turn feature should remain authoritative for this expenditure.

The native `hidden` status application should not independently consume action budget.

Conceptually:

Turn
→ commit/use Quick Action

then:

Hide execution strategy
→ evaluate legality
→ apply native Hidden

—

# 29. Commit vs Execute

If Frame Conn retains the committed-plan distinction:

Commit Hide:
→ spend/reserve Quick Action
→ add Hide to plan

Execute Hide:
→ revalidate Hide eligibility
→ apply native Hidden
→ mark action executed

This is especially important because visibility conditions may change between planning and execution.

—

# 30. Revalidate at Execution Time

Hide legality should be checked when the action actually executes.

Do not rely solely on eligibility at commit time.

Between commit and execution:

- actor may move;
- enemy may move;
- cover may change;
- visibility may change;
- status may change;
- scene objects may change.

Therefore:

execute
→ re-resolve current state
→ validate again.

—

# 31. Hidden Lifecycle

The largest missing native component is the lifecycle of Hidden.

Frame Conn must eventually know:

- what events immediately end Hidden;
- what actions preserve Hidden;
- whether movement ends Hidden;
- whether attacks end Hidden;
- whether hostile observation ends Hidden;
- whether proximity/Sensors affects Hidden;
- whether becoming uncovered ends Hidden.

These should come directly from confirmed Lancer rules.

—

# 32. Hidden Break Events

The eventual action/event architecture should allow Frame Conn to listen for relevant events.

Conceptually:

actor Hidden
→ action executed?
→ movement?
→ attack?
→ Tech action?
→ status change?
→ cover lost?
→ observer gains valid detection?
→ rules determine whether Hidden breaks

If break condition met:

→ remove native `hidden`
→ update Frame Conn state/presentation

Exact trigger names are conceptual only.

—

# 33. Do Not Hard-Code Break Rules Yet

The repository does not provide a working Hidden rules engine.

Therefore do not infer full break behavior merely from general stealth expectations.

Before implementation, confirm the exact Lancer Hide/Hidden rule text.

—

# 34. Native Status Removal

When Hidden ends, Frame Conn should remove the native:

`hidden`

status through the preferred native Foundry/Lancer status helper.

Conceptually:

Hidden break event
→ native effect/status removal
→ authoritative actor update
→ UI refresh

Do not merely set a Frame Conn boolean to false.

—

# 35. Hidden Persistence State

Frame Conn may need supplemental runtime metadata beyond the native Hidden boolean.

Potential information includes:

- how Hidden was acquired;
- when it was acquired;
- current source action;
- observer state;
- relevant cover/LOS state;
- break-trigger monitoring.

This metadata should not replace native Hidden state.

It supplements it.

—

# 36. Invisible and Hidden Can Coexist

Because Hidden and Invisible are distinct native statuses, a character may potentially possess both if rules grant both.

Frame Conn should not make them mutually exclusive without rule support.

Conceptually:

Hidden
+
Invisible

may produce combined behavior.

Native Invisible attack mechanics should remain native.

Frame Conn Hidden targeting/lifecycle rules should be layered separately.

—

# 37. Cover and Hidden Can Coexist

Likewise, a Hidden character may possess:

- Soft Cover;
- Hard Cover;
- no cover status but some other qualifying obstruction/rule.

Do not model Hidden as merely another name for Hard Cover.

—

# 38. Hidden Targeting Consequences

Because native runtime code does not appear to use:

`statuses.hidden`

for target legality, Frame Conn will likely need to own Hidden’s player-facing targeting consequences.

Potential areas include:

- whether hostile characters can select the Hidden actor;
- whether sensors should reveal identity;
- whether attacks can be initiated;
- what happens when a Hidden actor becomes detectable.

Exact rules must be confirmed.

—

# 39. Do Not Automatically Hide the Token

A tempting implementation would be:

Hidden
→ set Foundry token hidden

This is risky and likely incorrect as the default approach.

Foundry token hidden state is primarily a visibility/GM presentation mechanism.

Lancer Hidden is a mechanical condition.

Frame Conn should instead implement the actual game rules and only alter token presentation if a deliberate UX layer requires it.

—

# 40. Frame Conn Sensors Presentation

Frame Conn’s Sensors view may need to visually distinguish:

- visible enemy;
- detected but Hidden enemy;
- Invisible enemy;
- undetected character;
- token inside Sensors but blocked by LOS.

The exact presentation belongs to Sensors/UI architecture, not to the Hide action implementation itself.

Hide should expose authoritative semantic state for those layers to consume.

—

# 41. Native Weapon Range Template Hidden Tokens

A separate native canvas helper associated with weapon range templates skips Foundry-hidden tokens.

This should not be mistaken for Lancer Hidden support.

Conceptually:

Foundry token.hidden
→ range helper may skip token

This does not prove:

Lancer `statuses.hidden`
→ native targeting ignores token

They are different states.

—

# 42. Cover Detection Architecture

Frame Conn may eventually need a reusable Cover service.

Conceptually:

attacker/observer
→ target
→ scene geometry
→ token geometry
→ obstruction
→ native/Frame Conn rules
→ None / Soft / Hard

Such a service could support:

- Hide legality;
- attack presentation;
- automatic cover assignment;
- tactical overlay.

However, automatic cover geometry should not be implemented until the native scene/terrain APIs are understood.

—

# 43. LOS Detection Architecture

Likewise, LOS should probably be a reusable service rather than Hide-specific code.

Conceptually:

canObserve(observer, target, context)

Potential inputs:

- Foundry visibility;
- terrain-height-tools if available;
- token elevation;
- token size;
- walls;
- Sensors;
- Invisible;
- Hidden;
- special rules.

Hide should consume this service.

—

# 44. Optional terrain-height-tools Dependency

Because LOS functionality discovered in the repo is associated with optional terrain-height-tools integration, Frame Conn should not make Hide fundamentally depend on that module unless it becomes an explicit dependency.

Preferred architecture:

if terrain-height-tools available:
→ use its richer LOS calculation

else:
→ use Foundry/native fallback geometry

The Hide action should remain functional without requiring an unrelated optional module unless project requirements explicitly change.

—

# 45. Hard vs Soft Cover for Hide

Before implementation, confirm whether:

Soft Cover

and:

Hard Cover

are equally valid for Hide.

Do not infer that either cover status automatically qualifies.

The native attack system’s distinction between cover strengths does not answer Hide eligibility.

—

# 46. Invisible as Hide Enabler

Likewise, confirm whether being Invisible changes the requirements for Hiding.

Because Invisible is a separate condition with its own mechanics, it may alter observation or Hide eligibility.

Frame Conn’s visibility service should be capable of considering this without merging the statuses.

—

# 47. Sensors and Hide

Confirm how Sensors interacts with:

- Hidden;
- Invisible;
- LOS;
- cover.

Frame Conn should not assume:

inside Sensors
→ automatically detectable

or:

outside LOS
→ automatically Hidden

without the actual rules.

This is especially relevant because Frame Conn already presents sensor-range information.

—

# 48. Action Identity and Trigger Architecture

Unlike Boost, Brace, Disengage, Overwatch, Grapple, and Ram, repository search did not find:

`hide`

as a native `SynergyLocation`.

Therefore Frame Conn should not assume native structured synergy metadata can discover:

`when you Hide`

through the same mechanism.

Some actor-owned content may still reference Hide through:

- action data;
- effect text;
- other structured fields.

This needs separate research.

—

# 49. No Native Hide SynergyLocation

This is a useful negative finding.

Native:

`hidden`

status exists.

But native:

`hide`

semantic action location

was not found in the SynergyLocation list inspected during the search.

Therefore future trigger support may require a Frame Conn semantic Hide event even if native structured synergy data does not provide one.

—

# 50. Frame Conn Semantic Hide Event

Conceptually, Frame Conn should preserve:

Hide executed

and potentially:

Hidden acquired

as distinct events.

For example:

Hide action executed
→ eligibility passed
→ Hidden acquired

These may matter differently for future talents/systems.

Exact event names are conceptual only.

Do not invent native hooks.

—

# 51. Status Ownership Boundary

The intended state split is:

**NATIVE LANCER OWNS:**

- `hidden`;
- `invisible`;
- `cover_soft`;
- `cover_hard`;
- actor status representation;
- status icons;
- generic status/effect infrastructure.

**FRAME CONN OWNS:**

- why Hidden is applied;
- when Hidden is legal;
- how Hidden affects player-facing targeting/observation;
- when Hidden ends;
- supplemental Hidden lifecycle metadata.

—

# 52. Attack Modifier Ownership Boundary

Native Lancer already owns:

Invisible attack behavior

and:

Cover attack modifiers.

Therefore Frame Conn should not implement those inside Hide.

If an attack targets an Invisible character:

→ native attack system handles Invisible.

If an attack targets a character with Cover:

→ native attack system handles Cover.

Hidden’s unique behavior should be implemented separately.

—

# 53. Native-System Boundary

Preferred dependency direction:

Committed Hide
→ Hide execution service
→ visibility/cover eligibility service
→ native Lancer status adapter
→ apply `hidden`
→ authoritative actor mutation
→ Hidden lifecycle monitor
→ targeting/Sensors presentation

Related attack later occurs
→ native attack system
→ native Cover/Invisible handling

This keeps responsibility clean.

—

# 54. Do Not Invent `HideFlow`

No native `HideFlow` was found.

Frame Conn may implement an internal Hide execution service, but it should not pretend to delegate to a nonexistent native workflow.

The reusable native boundary is:

status/effect infrastructure

not:

HideFlow.

—

# 55. Initial Implementation Strategy

The safest first-stage implementation is:

1. Use confirmed Lancer Hide rules for legality.
2. Resolve relevant cover/visibility state.
3. Apply native `hidden`.
4. Display Hidden through native/Frame Conn UI.
5. Implement explicit known break conditions.
6. Do not automatically recreate every stealth interaction at once.
7. Expand targeting/Sensors automation incrementally.

This provides useful Hide behavior without overbuilding an unverified stealth engine.

—

# 56. Future Automation Strategy

The mature Frame Conn flow may eventually become:

Hide execution requested
→ resolve all hostile observers
→ evaluate LOS / cover / detection
→ determine legality
→ apply native Hidden
→ register observation state
→ suppress invalid target selection
→ update Sensors presentation
→ monitor movement/action/status events
→ recompute observation when needed
→ remove Hidden when break condition occurs

This is substantially more complex than simply applying a status.

Therefore the visibility subsystem should remain modular.

—

# 57. Immediate Repository Research TODO

- [ ] Trace native Hidden status definition completely.
- [ ] Trace native Invisible status definition completely.
- [ ] Trace native Soft Cover status definition completely.
- [ ] Trace native Hard Cover status definition completely.
- [ ] Trace the preferred generic status application helper.
- [ ] Trace the preferred generic status removal helper.
- [ ] Trace every runtime consumer of `statuses.hidden`.
- [ ] Confirm that no current native Hidden targeting logic exists.
- [ ] Trace every runtime consumer of `statuses.invisible`.
- [ ] Trace the invisibility Accuracy/Difficulty plugin completely.
- [ ] Trace every runtime consumer of `cover_soft`.
- [ ] Trace every runtime consumer of `cover_hard`.
- [ ] Trace native Cover enum/calculation logic.
- [ ] Trace Seeking interaction with Cover.
- [ ] Trace Tech Attack interaction with Cover.
- [ ] Trace Melee interaction with Cover.
- [ ] Trace terrain-height-tools integration.
- [ ] Determine whether terrain-height-tools is optional or bundled.
- [ ] Determine what fallback LOS utilities Foundry itself exposes.
- [ ] Search for native cover geometry helpers under alternate terminology.
- [ ] Search for native visibility/observer helpers under alternate terminology.

—

# 58. Hide Rules Research TODO

Before final implementation:

- [ ] Confirm exact Hide prerequisites.
- [ ] Confirm exact cover requirement.
- [ ] Confirm whether Soft Cover is sufficient.
- [ ] Confirm whether Hard Cover is sufficient.
- [ ] Confirm whether Invisible alters Hide prerequisites.
- [ ] Confirm how LOS affects Hide.
- [ ] Confirm how Sensors affects Hide.
- [ ] Confirm whether all hostile observers matter.
- [ ] Confirm what Hidden does to targeting.
- [ ] Confirm what Hidden does to attacks.
- [ ] Confirm what Hidden does to detection.
- [ ] Confirm all events that break Hidden.
- [ ] Confirm whether movement breaks Hidden.
- [ ] Confirm whether Boost breaks Hidden.
- [ ] Confirm whether attacking breaks Hidden.
- [ ] Confirm whether tech actions break Hidden.
- [ ] Confirm whether reactions break Hidden.
- [ ] Confirm whether losing cover breaks Hidden.
- [ ] Confirm whether being approached/revealed breaks Hidden.
- [ ] Confirm interaction with Invisible.
- [ ] Confirm interaction with Search.
- [ ] Confirm interaction with Scan.
- [ ] Confirm interaction with Lock On.

—

# 59. Visibility Service TODO

Frame Conn will probably need a reusable visibility/observation service.

Research/design tasks:

- [ ] Define observer-to-target visibility query.
- [ ] Determine Foundry LOS primitive.
- [ ] Add optional terrain-height-tools adapter.
- [ ] Account for elevation.
- [ ] Account for token size.
- [ ] Account for walls/terrain.
- [ ] Account for Sensors.
- [ ] Account for Invisible.
- [ ] Account for Hidden.
- [ ] Account for Cover.
- [ ] Account for special detection effects.
- [ ] Keep UI presentation separate from rules determination.

—

# 60. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Hide execution strategy.
- [ ] Keep Hide in universal Quick Action catalog.
- [ ] Validate active Turn.
- [ ] Validate Quick Action expenditure.
- [ ] Resolve authoritative actor/token.
- [ ] Revalidate Hide legality at execution time.
- [ ] Add visibility/cover query boundary.
- [ ] Apply native `hidden` status.
- [ ] Await authoritative actor mutation.
- [ ] Confirm native Hidden state active.
- [ ] Mark committed Hide executed.
- [ ] Refresh Frame Conn state/presentation.
- [ ] Add Hidden lifecycle monitoring.
- [ ] Remove native Hidden on confirmed break conditions.
- [ ] Integrate Hidden with Sensors presentation.
- [ ] Integrate Hidden with targeting legality where required.
- [ ] Preserve native Cover modifiers.
- [ ] Preserve native Invisible attack behavior.
- [ ] Avoid manipulating Foundry token-hidden state unless explicitly needed.
- [ ] Emit Frame Conn Hide/Hidden semantic events for future trigger support.

—

# 61. Smoke Test TODO

- [ ] Hide with valid conditions.
- [ ] Hide with invalid conditions.
- [ ] Native Hidden icon appears.
- [ ] Actor `system.statuses.hidden` updates.
- [ ] Hidden survives Frame Conn rerender.
- [ ] Hidden removal updates native status correctly.
- [ ] Invisible remains distinct from Hidden.
- [ ] Soft Cover remains distinct from Hidden.
- [ ] Hard Cover remains distinct from Hidden.
- [ ] Native Cover attack modifier still works.
- [ ] Native Invisible attack behavior still works.
- [ ] Foundry token visibility is not accidentally changed.
- [ ] Sensors presentation updates correctly.
- [ ] Hidden break event removes status exactly once.
- [ ] Action budget is spent exactly once.
- [ ] Overcharge repeat behaves according to action rules if relevant.

—

# 62. Important Invariants

**Invariant 1**

Hide is a Quick Action.

**Invariant 2**

Hide does not inherently require a roll.

**Invariant 3**

No dedicated native `HideFlow` was found.

**Invariant 4**

Native Lancer already owns a `hidden` status.

**Invariant 5**

Applying native Hidden alone does not appear to implement the complete Hidden rules.

**Invariant 6**

Hidden and Invisible are distinct conditions.

**Invariant 7**

Lancer Invisible does not automatically use Foundry Core token invisibility.

**Invariant 8**

Lancer Hidden is not the same as Foundry token-hidden state.

**Invariant 9**

Native Lancer already owns Soft/Hard Cover attack modifiers.

**Invariant 10**

Frame Conn should determine Hide legality without duplicating native Cover attack math.

**Invariant 11**

Optional LOS infrastructure exists, but no native Hide legality engine using it was found.

**Invariant 12**

Hidden lifecycle and break conditions must come from confirmed Lancer rules.

—

# 63. Final Working Model

HIDE
│
├── Quick Action
│
├── no attack roll
│
├── no dedicated native HideFlow
│
├── Frame Conn owns:
│   ├── Hide legality
│   ├── cover / visibility evaluation
│   ├── LOS / observation integration
│   ├── application request
│   ├── Hidden lifecycle
│   ├── Hidden break conditions
│   ├── targeting consequences
│   └── Sensors presentation integration
│
├── Native Lancer Hidden:
│   ├── `system.statuses.hidden`
│   ├── native status identity
│   ├── native icon
│   └── generic ActiveEffect/status machinery
│
├── Native Lancer Invisible:
│   ├── `system.statuses.invisible`
│   ├── distinct from Hidden
│   └── native attack-roll behavior
│
├── Native Lancer Cover:
│   ├── `cover_soft`
│   ├── `cover_hard`
│   └── native Accuracy/Difficulty handling
│
└── LOS infrastructure:
    ├── optional terrain-height-tools integration
    ├── LOS ray calculation/visualization
    └── no discovered automatic Hide legality flow

The critical architectural rule is:

**Hide should apply and maintain native Hidden state, but Frame Conn must supply the missing stealth rules around that state.**

Do not implement Hide as:

`Invisible`

and do not implement it as:

`Foundry token.hidden`

and do not implement Cover attack modifiers again.

The missing system is:

visibility / observation / Hide eligibility
→ native Hidden status
→ Hidden lifecycle.
