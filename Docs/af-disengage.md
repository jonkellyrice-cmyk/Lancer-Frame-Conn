# Disengage

# AF — Disengage

## Status

**Native dedicated Disengage execution flow:** Not found.

**Native Disengage semantic identity:** Found.

**Native Engaged status representation:** Found.

**Native Overwatch execution flow:** Not found.

**Native automatic movement-triggered Threat/Overwatch detection:** Not found.

**Native Reaction tracking primitive:** Found.

**Native weapon Threat data:** Found.

**Frame Conn implementation status:** Frame Conn should own Disengage as a temporary movement/reaction-suppression state, using its Movement and Turn domains to prevent Overwatch opportunity generation while preserving native engagement state and native weapon data.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Disengage** Full Action and defines the intended Frame Conn implementation boundary.

Repository investigation did not reveal a dedicated executable Disengage flow such as:

`DisengageFlow`

or:

`beginDisengageFlow()`

The native Lancer system does recognize Disengage semantically and separately recognizes the `engaged` status.

However, native Lancer does not appear to implement the actual universal Disengage action, nor does it appear to implement the movement-triggered Overwatch system that Disengage primarily interacts with.

Therefore:

> Frame Conn should implement Disengage as a temporary action state affecting movement-triggered reactions.

and:

> Disengage should not simply remove the native `engaged` status.

The critical integration point is Frame Conn’s own movement-trigger / Overwatch opportunity generation.

—

# 1. Disengage Classification

Disengage is a **Full Action**.

Its core architectural purpose is not to make an attack, perform a roll, or mutate a target.

It changes how the acting character’s movement interacts with hostile reactions for the relevant duration.

Therefore Disengage is primarily:

- a Turn-state action;
- a Movement-state modifier;
- a Reaction-trigger suppression mechanism;
- a semantic action event.

It is not naturally a native attack or damage flow.

—

# 2. Native Disengage Flow Search

Repository searching did not identify:

- `DisengageFlow`
- `beginDisengageFlow()`
- dedicated Disengage flow file
- dedicated Disengage actor method
- dedicated Disengage sheet handler
- dedicated universal Disengage executor
- dedicated Disengage ActiveEffect application logic

Therefore Frame Conn cannot delegate Disengage execution to a native action flow.

—

# 3. Native Disengage Semantic Identity

The repository contains:

`disengage`

as a native synergy/action location.

It appears in the same semantic family as actions such as:

- `move`
- `boost`
- `ram`
- `grapple`
- `overwatch`
- `skirmish`
- `barrage`
- `improvised_attack`
- `stabilize`
- `tech`
- `lock_on`
- `bolster`
- `brace`

This means actor-owned native content may be capable of referring to Disengage as a meaningful rules/action location.

Therefore Frame Conn should preserve:

`Disengage occurred`

as a semantic event.

Do not reduce the implementation to an anonymous boolean with no action identity.

—

# 4. Native Engaged Status

The native system separately represents:

`actor.system.statuses.engaged`

Relevant definitions exist in areas such as:

- `src/module/base-data.ts`
- `src/module/system-template.ts`
- `src/module/actor/lancer-actor.ts`
- `src/module/status-icons.ts`

The native system therefore understands whether an actor is currently:

`Engaged`

as a distinct status/mechanical state.

—

# 5. Native Use of Engaged

The repository uses the native `engaged` state in attack Accuracy/Difficulty processing.

In particular, ranged attack logic can detect whether the attacker is Engaged and apply the appropriate penalty for relevant weapon ranges.

Native attack handling distinguishes Threat/Thrown-type ranges from ordinary ranged attack ranges when processing the Engaged penalty.

Therefore:

`engaged`

is not merely cosmetic.

It participates in native attack mechanics.

—

# 6. Disengage Is Not the Same as Removing Engaged

Frame Conn should not implement Disengage as:

`remove engaged status`

unless the rules and native geometry model specifically require that state transition.

These are different concepts.

Native `engaged` means roughly:

`this character is currently in an engagement relationship / state`

Disengage means:

`this character’s movement does not provoke certain movement-triggered reactions for the relevant duration`

A character may still physically begin its movement while Engaged.

Therefore the preferred architecture is:

Native Engaged status
→ remains authoritative

Frame Conn Disengage state
→ suppresses movement-triggered Overwatch opportunities

This keeps the two concepts separate.

—

# 7. Why This Distinction Matters

If Frame Conn simply removed `engaged`, it could accidentally alter unrelated native behavior.

For example:

- ranged-attack Engaged penalties;
- UI presentation;
- actor condition state;
- other systems that inspect `actor.system.statuses.engaged`.

Disengage should modify the reaction consequences of movement, not rewrite every mechanic associated with Engaged.

—

# 8. Native Overwatch Search

Repository investigation did not identify a dedicated:

`OverwatchFlow`

or:

`beginOverwatchFlow()`

There is no obvious native execution engine responsible for:

token movement
→ leaving hostile Threat
→ generating Overwatch
→ spending Reaction
→ attacking mover

Therefore Disengage does not need to suppress a hidden native Overwatch engine.

Frame Conn will likely own both sides of the interaction.

—

# 9. Native Token-Movement Hook Finding

The native `updateToken` handling inspected during the Overwatch research explicitly ignores ordinary X/Y movement for its Action Manager update path.

Conceptually, the native hook does:

if token X/Y changed:
→ assume ordinary movement
→ return

It does not perform:

movement
→ inspect hostile Threat
→ detect Threat exit
→ offer Overwatch

Therefore no native movement-trigger engine was found for Disengage to intercept.

—

# 10. Native Threat Representation

The native system does understand weapon Threat.

Threat is represented through native weapon range data such as:

`RangeType.Threat`

Therefore Frame Conn does not need to invent Threat values.

The authoritative Threat for a weapon should come from native weapon data.

This will be important for Overwatch opportunity generation.

—

# 11. Native Reaction Tracking

The repository contains native actor action-tracker state including concepts equivalent to:

`actor.system.action_tracker.reaction`

and:

`actor.system.action_tracker.used_reactions`

The native action tracker can spend/refresh the generic Reaction availability boolean.

Conceptually:

Reaction available
→ spend Reaction
→ reaction = false

The exact integration strategy with Frame Conn’s own Turn reaction state should be deliberately designed to avoid maintaining conflicting authoritative reaction models.

—

# 12. Native Reaction Refresh

Native combat automation refreshes reactions at the beginning of each combatant’s turn.

The discovered behavior conceptually iterates combatants and refreshes their Reaction state when a new turn begins.

This is useful because Lancer Reaction availability is not merely a once-per-own-turn resource.

Frame Conn should preserve the correct reaction timing semantics and reconcile its Turn state with native actor state where appropriate.

—

# 13. Native `used_reactions`

The native action tracker also contains:

`used_reactions`

However, repository investigation has not yet established exactly how this field is intended to be used.

No Overwatch-specific runtime code was found populating it.

Therefore Frame Conn should not assume:

`used_reactions`

is the authoritative storage mechanism for Overwatch or Disengage interactions until its actual consumers are traced.

—

# 14. Native Overwatch Semantic Identity

The repository recognizes:

`overwatch`

as a native synergy/action location.

This is similar to:

`disengage`

and provides semantic support for future actor-owned content that references Overwatch.

However, semantic recognition does not equal executable Overwatch logic.

—

# 15. Overwatch as Frame Conn-Orchestrated Reaction

The current findings imply that Frame Conn will need to own the higher-order Overwatch reaction.

Conceptually:

token moves
→ Frame Conn Movement feature receives movement segment
→ compare origin and destination
→ inspect hostile actors
→ inspect eligible hostile mounted weapons
→ determine Threat ranges
→ determine whether mover exited Threat
→ check hostile Reaction availability
→ generate Overwatch opportunity
→ choose legal mount
→ triggering mover becomes target
→ execute Skirmish-like mount attack
→ spend Reaction

This is the exact machinery Disengage needs to suppress.

—

# 16. Core Disengage Integration Point

The cleanest Disengage integration point is:

movement segment occurs
→ check whether mover currently has active Disengage state
→ if YES:
   do not generate movement-triggered Overwatch opportunities
→ if NO:
   evaluate Threat exits normally

Therefore Disengage should intervene at:

`Overwatch opportunity generation`

not:

`weapon attack resolution`

and not:

`damage resolution`

and not:

`engaged status removal`

—

# 17. Proposed Initial Disengage Flow

The initial Frame Conn action should be:

Player commits Disengage
→ Disengage appears in Committed Plan
→ player executes Disengage
→ Frame Conn resolves authoritative acting mech
→ validate active Turn
→ validate Full Action
→ record Disengage active state for the acting character
→ preserve semantic `disengage` action identity
→ movement continues normally
→ for each movement segment:
   check Disengage state first
→ suppress Overwatch opportunity generation while Disengage is active
→ clear Disengage state at the correct lifecycle point
→ mark committed action executed
→ refresh Frame Conn presentation

No target is required.

No roll is required.

—

# 18. Disengage Does Not Need a d20 Roll

Disengage is not an attack or check.

Therefore the committed-plan UI should use a non-roll execution control.

Conceptually:

`DISENGAGE                                 [execute]`

rather than:

`DISENGAGE                                 [d20]`

The exact icon belongs to the UI layer.

—

# 19. Turn Economy Ownership

Disengage consumes:

**one Full Action**

Frame Conn’s Turn feature should remain authoritative for that action expenditure.

Conceptually:

Turn state
→ use Full Action
→ commit `full.disengage`

Then:

Disengage execution strategy
→ activate temporary Disengage state

The temporary state should not independently alter action budget.

—

# 20. Disengage Duration

The exact duration of Disengage must come from the confirmed Lancer rules.

Frame Conn needs a precise lifecycle boundary for clearing the state.

Possible lifecycle points might include:

- end of current turn;
- beginning of next turn;
- completion of current movement;
- another rules-defined timing point.

Do not infer duration solely from action naming.

Before implementation, confirm exact tabletop timing.

—

# 21. Likely Turn-State Ownership

Because Disengage is temporary and action-bound, Frame Conn’s Turn domain is a strong candidate to own the active Disengage flag/state.

Conceptually:

Turn State
→ disengage.active = true

This is illustrative only.

The exact state shape should be decided during implementation.

The important point is that Disengage should not require permanent actor mutation unless the rules/native architecture indicate otherwise.

—

# 22. Why Turn State Is Preferable to Actor Status

If Disengage lasts only for a short action/turn timing window, storing it in Frame Conn Turn state has advantages:

- automatically scoped to current turn;
- no stale persistent actor effect;
- easy cleanup;
- easy integration with movement tracking;
- easy integration with Overwatch trigger generation.

A native ActiveEffect may still be useful for presentation or synchronization, but it should not be introduced without need.

—

# 23. Movement Feature Integration

Frame Conn’s Movement feature already interprets token movement.

This includes movement segments and contextual information such as:

- origin;
- destination;
- distance;
- movement ID;
- movement method.

Therefore the Movement feature is the natural place to ask:

`should this movement generate hostile reaction opportunities?`

Disengage should be consulted before threat-exit calculation.

—

# 24. Preferred Movement Pipeline

Conceptually:

Foundry token moves
→ Movement feature interprets movement
→ resolve acting mover
→ resolve Turn state
→ is mover Disengaging?
   ├── YES
   │   → track movement normally
   │   → suppress Overwatch generation
   │
   └── NO
       → track movement normally
       → evaluate hostile Threat exits
       → generate Overwatch opportunities

This keeps Disengage narrowly scoped.

—

# 25. Disengage Does Not Grant Movement

Disengage does not itself inherently create a new movement allowance.

It modifies how the character’s movement interacts with reactions.

Therefore:

Disengage
≠ Boost

Boost:
→ grants additional Speed-sized movement

Disengage:
→ changes reaction consequences of movement

The two actions should remain separate in both Turn and Movement logic.

—

# 26. Disengage and Standard Movement

If the player Disengages and then uses ordinary movement:

movement expenditure should proceed normally.

The character still spends movement distance.

Only the movement-triggered reaction handling changes.

—

# 27. Disengage and Boost

If the rules permit a character to move under Disengage state through multiple movement allowances, the same Disengage suppression should follow the character across those movements for the action’s actual duration.

For example, if legal:

Disengage
→ movement
→ some additional movement source

Frame Conn should not hard-code suppression to only the first movement segment.

The exact duration rules should determine scope.

—

# 28. Disengage and Movement Variants

The Movement feature may recognize:

- standard movement;
- jump;
- climb;
- fly;
- teleport;
- other movement modes.

Whether each movement mode can trigger Overwatch is a rules question.

Disengage should suppress only reaction opportunities that would otherwise legally occur.

Therefore:

movement-mode legality
→ determine whether Overwatch could trigger

then:

Disengage
→ suppress if applicable

Do not treat every coordinate change as automatically Overwatch-relevant.

—

# 29. Teleportation

Teleportation may have special interaction with engagement/Overwatch.

That belongs primarily in:

`af-movement-variants.md`

The Disengage layer should consume the Movement feature’s determination of whether a movement segment is threat-triggering rather than encoding every movement mode itself.

—

# 30. Threat Exit Detection

Frame Conn will need a geometry service for Overwatch.

Conceptually, for each hostile threatening mount/weapon:

origin position
→ was mover within Threat?

destination/path
→ did mover leave Threat?

If YES:
→ potential Overwatch

Disengage should suppress the resulting opportunity.

The exact geometry must account for Foundry grid measurement and potentially token size.

—

# 31. Path vs Endpoint

Overwatch/Threat detection may need to consider the movement path, not only the final token position.

For example:

character moves through a Threat area

versus:

character begins inside Threat and exits it.

The exact Lancer rule should determine the trigger.

Frame Conn should use the actual interpreted movement path where available.

Disengage does not need to solve the geometry itself; it simply suppresses qualifying reaction opportunities.

—

# 32. Hostile Actor Discovery

Overwatch generation will require discovering hostile actors relative to the mover.

Potential considerations include:

- token disposition;
- actor ownership;
- scene presence;
- defeated/dead state;
- Shutdown state;
- Reaction availability;
- equipped weapons;
- Threat.

This belongs primarily to the Overwatch implementation.

Disengage merely provides an early suppression condition.

—

# 33. Shared Skirmish Infrastructure

The Overwatch findings indicate that Overwatch is mechanically similar to a reaction-triggered Skirmish.

Conceptually:

Overwatch
→ choose one eligible mount
→ target fixed to triggering mover
→ resolve 1–2 weapons
→ all weapons on selected mount attack same target
→ native `WeaponAttackFlow` for each weapon

Therefore the shared mount-resolution infrastructure planned for:

`af-skirmish.md`

should also support Overwatch.

Disengage suppresses creation of that Overwatch opportunity.

—

# 34. Shared Mount Attack Group

The useful shared abstraction remains:

Mount Attack Group
→ one mount
→ one target
→ one or two participating weapons

For Skirmish:

target is player-selected.

For Overwatch:

target is the triggering mover.

For Disengage:

the relevant effect is preventing the Overwatch Mount Attack Group from being created.

—

# 35. Reaction Availability

Before generating or presenting an Overwatch opportunity, Frame Conn should check whether the hostile actor has an available Reaction.

If no Reaction is available:

→ no actionable Overwatch opportunity

Disengage should ideally be checked even earlier to avoid unnecessary computation/UI.

Preferred conceptual order:

movement occurs
→ mover Disengaging?
   YES → stop Overwatch evaluation
   NO → continue
→ find hostile Threat exits
→ check Reaction availability
→ offer Overwatch

—

# 36. Reaction Refresh

Because native combat automation refreshes Reactions at each new combatant turn, Frame Conn must ensure its own reaction model does not drift from native actor state.

Potential strategies include:

- make Frame Conn Turn reaction state authoritative and synchronize native state;
- make native actor reaction state authoritative and adapt it;
- maintain explicit reconciliation.

The exact architecture should be decided globally for reactions, not inside Disengage alone.

—

# 37. Disengage and Brace

Disengage and Brace both interact with the Reaction system, but in opposite directions.

Brace:
→ acting character spends its Reaction

Disengage:
→ suppresses certain hostile Reaction opportunities

Therefore they should share a reaction-domain understanding without sharing mechanical execution logic.

—

# 38. Disengage and Overwatch Semantic Events

Native content recognizes both:

`disengage`

and:

`overwatch`

as semantic locations.

Future actor-owned content may therefore include effects such as:

- when you Disengage;
- after you Disengage;
- when you Overwatch;
- when an enemy Disengages;
- bonuses to Overwatch;
- effects preventing Disengage.

Frame Conn should preserve both event identities for future trigger integration.

—

# 39. Do Not Parse Text First

If native structured synergy data identifies:

`disengage`

or:

`overwatch`

Frame Conn should prefer that structured metadata.

Preferred hierarchy:

1. native structured synergy/action data;
2. native weapon/action data;
3. explicit Frame Conn adapter;
4. prose parsing only when unavoidable.

—

# 40. Native-System Boundary

The intended ownership split is:

**FRAME CONN OWNS:**

- Disengage action commitment;
- Full Action expenditure;
- temporary Disengage state;
- Disengage duration/lifecycle;
- movement-trigger suppression;
- Overwatch opportunity generation;
- Threat-exit orchestration;
- reaction opportunity presentation;
- semantic Disengage event;
- presentation state.

**NATIVE LANCER OWNS:**

- actor Speed and movement-related actor data;
- `engaged` status;
- weapon Threat values;
- weapon range types;
- individual weapon attack execution;
- native attack Accuracy/Difficulty;
- weapon resource handling;
- native semantic `disengage` and `overwatch` locations;
- generic reaction tracker primitives where reused.

—

# 41. Do Not Invent `DisengageFlow`

No native `DisengageFlow` was found.

Frame Conn may have an internal Disengage execution service, but it should not pretend to delegate to a nonexistent native workflow.

The actual integration boundary is:

Turn state
+
Movement interpretation
+
Overwatch trigger generation
+
native Threat data

—

# 42. Immediate Repository Research TODO

- [ ] Trace the exact enum/type for `SynergyLocation.disengage`.
- [ ] Trace the exact enum/type for `SynergyLocation.overwatch`.
- [ ] Trace native `RangeType.Threat`.
- [ ] Trace how weapon Threat ranges are stored.
- [ ] Trace how Threat values resolve from weapon items.
- [ ] Trace actor action-tracker Reaction state completely.
- [ ] Trace `used_reactions`.
- [ ] Determine current consumers of `used_reactions`.
- [ ] Determine whether native Reaction state should be synchronized with Frame Conn Turn reaction state.
- [ ] Trace the native combat Reaction refresh hook completely.
- [ ] Determine whether native movement helpers already expose path data useful for Threat-exit detection.
- [ ] Determine whether token size/radius helpers already exist.
- [ ] Determine whether native hostility/disposition helpers exist.
- [ ] Determine whether native attack/mount helpers can identify Overwatch-eligible mounts.

—

# 43. Rules Research TODO

Before final Disengage implementation:

- [ ] Confirm exact Disengage duration.
- [ ] Confirm exactly which reactions Disengage prevents.
- [ ] Confirm whether Disengage prevents only Overwatch or other movement-triggered reactions too.
- [ ] Confirm whether Disengage affects reactions triggered by special systems/talents.
- [ ] Confirm interaction with Teleport.
- [ ] Confirm interaction with involuntary movement.
- [ ] Confirm interaction with Knockback.
- [ ] Confirm interaction with Grapple movement.
- [ ] Confirm whether Disengage applies to all movement for its duration.
- [ ] Confirm whether movement begun before Disengage is relevant.
- [ ] Confirm when Disengage state clears.

—

# 44. Overwatch Dependency TODO

Because Disengage’s primary implementation value is suppression of Overwatch opportunities:

- [ ] Complete `af-overwatch.md`.
- [ ] Build/define hostile Threat discovery.
- [ ] Build/define Threat-exit detection.
- [ ] Define Overwatch opportunity object/state.
- [ ] Define triggering mover target binding.
- [ ] Reuse Skirmish mount-selection infrastructure.
- [ ] Reuse native WeaponAttackFlow for actual Overwatch attacks.
- [ ] Spend Reaction through the canonical reaction state.
- [ ] Ensure Disengage suppresses opportunity creation before UI presentation.

—

# 45. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Disengage execution strategy.
- [ ] Keep Disengage in the universal Full Action catalog.
- [ ] Validate active Turn.
- [ ] Validate Full Action commitment.
- [ ] Resolve authoritative acting actor/token.
- [ ] Activate temporary Disengage state.
- [ ] Preserve native `engaged` status unchanged.
- [ ] Integrate Disengage state into Movement processing.
- [ ] Check Disengage before Overwatch opportunity generation.
- [ ] Suppress qualifying hostile movement-triggered reactions while active.
- [ ] Preserve ordinary movement accounting.
- [ ] Preserve Boost/movement-pool behavior.
- [ ] Clear Disengage state at correct lifecycle point.
- [ ] Emit/preserve semantic Disengage event.
- [ ] Mark committed Disengage executed.
- [ ] Refresh Frame Conn presentation.
- [ ] Smoke-test Disengage while Engaged.
- [ ] Smoke-test ranged Engaged penalty remains intact where appropriate.
- [ ] Smoke-test movement out of Threat while Disengaging.
- [ ] Smoke-test same movement without Disengage generates Overwatch opportunity.
- [ ] Smoke-test multiple hostile Threat zones.
- [ ] Smoke-test hostile actor with Reaction already spent.
- [ ] Smoke-test movement variants.
- [ ] Smoke-test Disengage state cleanup.

—

# 46. Important Invariants

**Invariant 1**

Disengage is a Full Action.

**Invariant 2**

Disengage does not inherently require a roll.

**Invariant 3**

Disengage does not require a target.

**Invariant 4**

No dedicated native `DisengageFlow` was found.

**Invariant 5**

Native Lancer separately owns the `engaged` status.

**Invariant 6**

Disengage should not simply remove `engaged`.

**Invariant 7**

Frame Conn should represent Disengage as temporary action state.

**Invariant 8**

Disengage should suppress movement-triggered Overwatch opportunity generation at the Movement/Reaction boundary.

**Invariant 9**

Native weapon Threat data should remain authoritative.

**Invariant 10**

The exact Disengage duration and reaction scope must come from confirmed Lancer rules.

—

# 47. Final Working Model

DISENGAGE
│
├── Full Action
│
├── no target
│
├── no roll
│
├── no native DisengageFlow found
│
├── native semantic identity:
│   └── `disengage`
│
├── native Engaged state:
│   └── `actor.system.statuses.engaged`
│       └── remains separate
│
├── Frame Conn owns:
│   ├── Full Action expenditure
│   ├── temporary Disengage state
│   ├── state duration
│   ├── movement integration
│   ├── Overwatch suppression
│   └── semantic action event
│
└── Overwatch interaction
    │
    ├── movement segment occurs
    ├── is mover Disengaging?
    │   │
    │   ├── YES
    │   │   └── suppress movement-triggered Overwatch generation
    │   │
    │   └── NO
    │       └── evaluate hostile Threat exits
    │
    ├── native Threat data
    ├── Reaction availability
    ├── choose Overwatch mount
    ├── triggering mover is target
    └── native WeaponAttackFlow(s)

The critical ownership boundary is:

Disengage
→ temporary Frame Conn movement/reaction state

not:

Disengage
→ remove native Engaged status.

The critical integration point is:

movement interpretation
→ before hostile Overwatch opportunity generation.
