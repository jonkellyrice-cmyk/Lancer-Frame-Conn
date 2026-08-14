# Boost

# AF — Boost

## Status

**Native dedicated Boost execution flow:** Not found.

**Native semantic recognition of Boost:** Found.

**Frame Conn implementation status:** Frame Conn should own Boost execution using its existing Turn and Movement domains.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Boost** Quick Action and defines the intended Frame Conn implementation boundary.

The repository search did not reveal a dedicated executable Boost flow such as:

`BoostFlow`

or:

`beginBoostFlow()`

The native Lancer system does, however, recognize:

`boost`

as a semantic/synergy location.

This means native content can refer to Boost as an event or rules location even though the universal Boost action itself does not appear to have a dedicated native execution flow.

Therefore:

> Frame Conn should implement the universal Boost action itself.

while:

> Native Lancer semantic data referring to Boost should remain relevant for future systems, traits, talents, core powers, core bonuses, and other effects triggered by Boost.

—

# 1. Boost Rules Structure

Boost is a **Quick Action**.

When a character Boosts, they may move again up to their Speed.

Conceptually:

Standard movement allowance
→ Speed

Boost
→ spend one Quick Action
→ gain another Speed-sized movement allowance

Therefore Boost is fundamentally a combination of:

- Turn action expenditure;
- Movement allowance creation/reset;
- Movement tracking;
- event/trigger semantics.

It does not inherently require:

- an attack roll;
- a tech roll;
- a damage roll;
- a target.

—

# 2. Native Repository Finding

A repository search did not identify:

- `BoostFlow`
- `beginBoostFlow()`
- a dedicated Boost flow file
- a dedicated actor Boost execution method
- a dedicated native universal Boost action handler

Therefore there is no native high-level Boost execution flow for Frame Conn to delegate to.

—

# 3. Native Semantic Recognition

The repository does contain native recognition of:

`boost`

as a synergy/action location.

This is important.

It means native Lancer content can conceptually express mechanics associated with:

`when you Boost`

or:

`after you Boost`

or other Boost-related interactions.

Therefore Frame Conn should not treat Boost merely as:

`reset movement`

It should also preserve Boost as a meaningful action event for future rules integration.

—

# 4. Architectural Boundary

The intended ownership split is:

**FRAME CONN OWNS:**

- Boost action commitment;
- Quick Action expenditure;
- Boost execution;
- granting a new Speed-sized movement allowance;
- movement pool/accounting state;
- distinction between normal Boost and Overcharge-granted Boost;
- Boost execution history;
- Boost-trigger event semantics;
- presentation of Boost state.

**NATIVE LANCER PROVIDES:**

- actor Speed;
- native actor/item data;
- native content which may reference Boost;
- semantic/synergy identity associated with Boost;
- future rules data relevant to “when you Boost” effects.

—

# 5. Existing Frame Conn Movement Support

Frame Conn already contains movement-state behavior appropriate for Boost.

Relevant existing concepts include:

`refreshMovementFromBoost()`

and tracked movement state such as:

- `maximum`
- `spent`
- `remaining`
- `totalTracked`
- `standardUsed`
- `boostUsed`
- `overchargeBoostUsed`
- `excess`
- `segments`

The Turn state also records used actions, including:

`quick.boost`

Therefore Boost can integrate naturally into the existing Frame Conn Turn + Movement architecture rather than requiring a new standalone rules engine.

—

# 6. Existing Boost Tracking

Frame Conn already exposes concepts equivalent to:

`movementBoostEntries()`

and:

`movementBoostCount()`

These inspect committed/used actions whose action ID is:

`quick.boost`

This is useful because movement accounting can determine how many Speed-sized movement pools are currently legal.

Conceptually:

No Boost
→ legal movement = Speed

One normal Boost
→ legal movement = Speed × 2

Normal Boost + Overcharge Boost
→ legal movement = Speed × 3

The exact movement tracker already represents these categories separately.

—

# 7. Normal Boost

A normal Boost should consume:

**one Quick Action**

and grant:

**one additional movement allowance equal to Speed**

Conceptually:

Player commits Boost
→ Frame Conn validates Quick Action availability
→ commit `quick.boost`
→ Quick Action budget decreases
→ Movement feature opens/refills one Speed-sized movement allowance
→ movement tracking continues

No roll is required.

—

# 8. Boost Does Not Need a d20 Execution Control

Boost does not inherently require a roll.

Therefore the committed-plan execution UI should not necessarily use the attack-style d20 icon used for actions such as:

- Skirmish
- Barrage
- Improvised Attack
- Invade

Boost should instead use an appropriate non-roll execution control if committed actions require explicit execution.

Conceptually:

`BOOST                                    [execute]`

rather than:

`BOOST                                    [d20]`

The exact icon belongs to the UI layer.

—

# 9. Commit vs Execute

Frame Conn should preserve the distinction between:

**committing Boost**

and:

**executing Boost**

if the committed-plan architecture continues to separate planning from mechanical execution.

Conceptually:

Commit:
→ spend/reserve Quick Action budget
→ add Boost to committed plan

Execute:
→ activate another Speed-sized movement allowance
→ emit Boost event
→ refresh movement presentation

If Frame Conn ultimately treats movement execution as immediate upon commitment, this distinction can be simplified.

But the Turn and committed-plan architecture should remain authoritative.

—

# 10. Proposed Initial Boost Flow

The initial Frame Conn flow should be:

Player commits Boost
→ Boost appears in Committed Plan
→ player executes Boost
→ Frame Conn confirms Boost has not already been executed
→ Frame Conn validates active Turn
→ Frame Conn records/uses `quick.boost`
→ Movement state opens/refills another Speed-sized movement allowance
→ Boost event/history recorded
→ Frame Conn movement UI refreshes
→ player continues movement

No native Lancer flow needs to be invoked.

—

# 11. Movement Pool Behavior

After Boost executes, Frame Conn should make another movement pool equal to the actor’s Speed available.

Conceptually:

Before Boost:

Speed = 4

Movement:
4 / 4 available

Player moves 4.

Remaining:
0

Boost executes.

New movement pool:

4 / 4 available

Player can now move up to 4 more.

The existing Frame Conn movement model already represents this kind of refill through:

`refreshMovementFromBoost()`

—

# 12. Automatic Movement Integration

Frame Conn already contains logic capable of detecting when token movement exceeds the current legal movement allowance.

Existing concepts include:

`ensureAutomaticMovementBoost()`

and:

`trackTokenMovement()`

This allows Frame Conn to infer:

the player moved beyond standard Speed
→ a Boost is required
→ commit/use Boost if legal

This behavior should remain compatible with explicit Boost execution.

The architecture should support both:

**Explicit Boost**

Player chooses Boost before moving further.

and:

**Movement-driven automatic Boost accounting**

Player physically moves past the standard allowance and Frame Conn automatically recognizes the required Boost.

—

# 13. Automatic Normal Boost

When tracked movement first exceeds:

`Speed`

Frame Conn may automatically attempt to commit:

`quick.boost`

using the normal Quick Action budget.

Conceptually:

Tracked movement > Speed
→ no existing Boost
→ test whether `quick.boost` is legal
→ if legal:
   commit Boost
→ legal movement ceiling becomes Speed × 2

This existing behavior should remain compatible with the committed-plan architecture.

—

# 14. Overcharge Boost

Boost may also be performed using the Quick Action granted by Overcharge.

Frame Conn already distinguishes this case.

Conceptually:

Normal Quick Action budget unavailable
or
explicit Overcharge Boost requested
→ activate Overcharge
→ gain Overcharge Quick Action
→ spend that Quick Action on `quick.boost`
→ grant another Speed-sized movement allowance

The movement state separately tracks:

`boostUsed`

and:

`overchargeBoostUsed`

This distinction should remain.

—

# 15. Normal Boost vs Overcharge Boost

These are mechanically both Boost actions, but they come from different action-budget sources.

Conceptually:

Normal Boost:

`source = normal`

Overcharge Boost:

`source = overcharge`

This matters for:

- Turn action economy;
- Overcharge usage;
- Heat;
- movement accounting;
- history;
- future triggered effects.

However both should still count as:

**a Boost occurred**

for effects that care about Boost generally.

—

# 16. Boost Event Semantics

Because native Lancer recognizes:

`boost`

as a semantic/synergy location, Frame Conn should eventually emit or expose a meaningful Boost execution event.

Conceptually:

Boost executed
→ notify action-trigger system
→ inspect actor-owned content for:
   “when you Boost”
   “after you Boost”
   “the first time you Boost”
   etc.

The exact event architecture should be determined later.

Do not invent native hooks that do not exist.

This is a Frame Conn integration concept.

—

# 17. Actor-Owned Effects Triggered by Boost

Future research may identify effects from:

- Mounted Systems
- Mech Traits
- Mech Core Powers
- Pilot Talents
- Manufacturer Core Bonuses

which reference Boost.

These may:

- grant movement;
- modify movement;
- trigger attacks;
- apply statuses;
- clear conditions;
- add effects;
- consume resources;
- grant additional actions.

Therefore Boost should remain a first-class semantic event in Frame Conn.

—

# 18. Do Not Parse Rules Text Unless Necessary

If actor-owned native content exposes structured synergy information indicating:

`boost`

Frame Conn should prefer that structured native information.

Preferred hierarchy:

1. native structured synergy/action metadata;
2. native action data;
3. explicit Frame Conn adapter;
4. prose parsing only if unavoidable.

This is particularly important for future “when you Boost” automation.

—

# 19. Interaction With Protocol

Movement normally closes the start-of-turn Protocol window in the current Frame Conn Turn state.

Boost itself is also a non-Protocol action and should occur after the player has either:

- used a Protocol;
- or allowed the Protocol window to close.

The existing Turn logic already closes the Protocol window when action/movement state changes.

Boost should preserve that behavior.

—

# 20. Interaction With Action Duplicate Rules

Under ordinary Lancer action economy, a character cannot normally repeat the same Quick Action during the same turn using their two standard Quick Actions.

Therefore:

Normal Boost
→ uses one normal Quick Action

Attempting another normal Boost with the second normal Quick Action should ordinarily be prohibited by the duplicate-action rule.

However:

Boost through Overcharge

is allowed because Overcharge permits repeating an action.

The existing Frame Conn duplicate-action and Overcharge architecture already supports this distinction.

—

# 21. Full Tech Does Not Affect Boost

Boost is not a Quick Tech action.

Therefore Full Tech’s rule allowing duplicate Quick Tech options does not interact with Boost.

Boost remains an ordinary Quick Action.

—

# 22. Movement Execution vs Boost Execution

Boost does not itself move the token.

It grants the ability to move again up to Speed.

Therefore Frame Conn should distinguish:

Boost execution
→ movement allowance becomes available

from:

token movement
→ movement allowance is consumed

This keeps movement accounting correct.

—

# 23. Token Movement Tracking

The Movement feature should remain responsible for interpreting actual Foundry token movement.

Conceptually:

Boost
→ grants legal allowance

then:

Foundry token moves
→ Movement feature measures distance
→ Turn movement state records expenditure
→ allowance decreases

Boost should not directly fabricate movement segments.

—

# 24. Elevation Movement

Frame Conn already intends to treat vertical/elevation movement as movement expenditure where appropriate.

Boost simply grants another Speed-sized movement allowance.

It should not care whether that allowance is consumed through:

- horizontal movement;
- climbing;
- jumping;
- flying;
- elevation change;
- other legal movement modes.

The Movement feature interprets the actual movement method.

Boost only grants the pool.

—

# 25. Boost and Movement Variants

Boost does not itself define whether the resulting movement is:

- standard ground movement;
- jump;
- climb;
- fly;
- teleport.

Those movement modes belong to the Movement domain.

Boost merely creates another movement allowance.

Specific movement modes may have their own legality/effect rules.

—

# 26. Teleportation Caveat

If a movement mode such as Teleport has special rules concerning whether distance consumes normal movement or interacts differently with movement accounting, that belongs in:

`af-movement-variants.md`

Boost should not hard-code movement-mode behavior.

—

# 27. Committed Plan Presentation

Boost should remain one committed Quick Action.

Conceptually:

`BOOST                                      [execute]`
`Quick Action`

When executed:

- another movement pool becomes available;
- the committed action becomes executed;
- movement presentation updates.

There is no attack roll card required.

—

# 28. Execution State

Boost is simpler than compound actions such as Barrage or Full Tech.

Potential execution states are:

- committed
- executed
- cancelled

There is no multi-step attack sequence.

Once the movement allowance is granted, Boost can generally be considered executed.

—

# 29. Resource Mutation

Boost itself does not appear to require native item resource mutation.

The primary mutations are Frame Conn state:

- Quick Action expenditure;
- used-action record;
- movement allowance state;
- history;
- possible Overcharge state.

If actor-owned content triggered by Boost consumes a resource, that effect should own its own mutation.

—

# 30. Overcharge Heat

If Boost is performed via Overcharge:

Boost itself does not independently create Overcharge Heat.

The Overcharge action/mechanism owns:

- Overcharge use;
- Heat formula;
- Overcharge Quick Action.

Then the granted Quick Action is spent on Boost.

Therefore responsibility should remain:

Overcharge
→ Heat / Overcharge state

Boost
→ additional movement allowance

Do not duplicate Overcharge Heat in Boost execution.

—

# 31. Native-System Boundary

Because no dedicated native Boost flow was found, Frame Conn does not need to call into a nonexistent native execution function.

The preferred architecture is:

Frame Conn Turn feature
→ validate/use `quick.boost`
→ Frame Conn Movement state
→ grant/reset Speed-sized movement allowance
→ action-trigger integration
→ movement UI refresh

Native Lancer actor data remains authoritative for:

`Speed`

and native content metadata.

—

# 32. Shared Action Execution Architecture

Boost should still participate in the general Frame Conn action execution framework.

Conceptually:

Committed Action
→ execution request
→ execution strategy lookup
→ Boost strategy
→ Turn mutation
→ Movement mutation
→ trigger/synergy dispatch
→ presentation refresh

This keeps Boost consistent with other actions even though it does not call a native Flow.

—

# 33. Suggested Execution Strategy

Conceptually, Boost may be classified as:

action:
`quick.boost`

action category:
`quick`

execution strategy:
`frame-conn-movement`

This name is illustrative only.

The exact execution-strategy vocabulary should align with the final Actions feature decomposition.

—

# 34. Do Not Invent a Native Boost Flow

The repository search did not reveal a native:

`BoostFlow`

Therefore Frame Conn should not create code which pretends to delegate to one.

Instead, Frame Conn should explicitly own the missing universal Boost behavior while preserving native semantic data.

—

# 35. Immediate Research TODO

- [ ] Locate the exact native enum/type containing the `boost` synergy location.
- [ ] Determine how actor-owned actions/effects expose synergy locations.
- [ ] Determine how mounted systems reference Boost synergies.
- [ ] Determine how traits reference Boost synergies.
- [ ] Determine how talents reference Boost synergies.
- [ ] Determine how core powers reference Boost synergies.
- [ ] Determine how manufacturer core bonuses reference Boost synergies.
- [ ] Determine whether native structured data distinguishes “when you Boost” from other Boost-related timing.
- [ ] Determine whether any native helper already queries synergy locations.
- [ ] Determine whether Boost-triggered content is merely presentation metadata or supports structured execution data.
- [ ] Confirm actor Speed access used by Movement feature.
- [ ] Confirm explicit Boost execution and automatic movement-triggered Boost use the same canonical Turn mutation path.

—

# 36. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add/confirm Boost execution strategy.
- [ ] Keep Boost execution in the appropriate Actions/Movement boundaries.
- [ ] Validate active Turn.
- [ ] Validate Quick Action availability.
- [ ] Respect duplicate-action legality.
- [ ] Allow Overcharge repeat.
- [ ] Record `quick.boost`.
- [ ] Open/refill a Speed-sized movement allowance.
- [ ] Preserve normal vs Overcharge Boost source.
- [ ] Mark committed Boost executed.
- [ ] Refresh Movement UI.
- [ ] Emit/expose Boost semantic event for future trigger integration.
- [ ] Ensure automatic token-movement Boost accounting uses the same canonical action semantics.
- [ ] Prevent duplicate Boost bookkeeping when explicit and automatic paths overlap.
- [ ] Smoke-test standard Boost.
- [ ] Smoke-test Overcharge Boost.
- [ ] Smoke-test movement beyond Speed.
- [ ] Smoke-test movement beyond Speed × 2.
- [ ] Smoke-test interaction with Protocol window.
- [ ] Smoke-test movement tracking after Boost.

—

# 37. Important Invariants

**Invariant 1**

Boost is a Quick Action.

**Invariant 2**

Boost does not inherently require a roll.

**Invariant 3**

Boost does not inherently require a target.

**Invariant 4**

Boost grants another movement allowance equal to Speed.

**Invariant 5**

Boost does not itself move the token.

**Invariant 6**

Actual token movement remains owned by the Movement feature.

**Invariant 7**

Normal Boost consumes one normal Quick Action.

**Invariant 8**

A repeated Boost may be performed through Overcharge where legal.

**Invariant 9**

Overcharge owns its own Heat and granted Quick Action.

**Invariant 10**

Boost should remain a meaningful semantic event for “when you Boost” content.

—

# 38. Final Working Model

BOOST
│
├── Quick Action
│
├── no target
│
├── no roll
│
├── no native BoostFlow found
│
├── Frame Conn-owned execution
│
├── uses actor Speed
│
├── grants another Speed-sized movement allowance
│
├── normal source
│   └── spends normal Quick Action
│
├── Overcharge source
│   └── spends Overcharge-granted Quick Action
│
├── Movement feature tracks actual movement
│
└── emits/preserves Boost semantic identity
    └── future “when you Boost” effects

This is the current working architecture for Boost in Frame Conn.

The critical ownership boundary is:

FRAME CONN
→ executes the universal Boost action
→ manages Turn expenditure
→ grants movement allowance
→ tracks Boost state

NATIVE LANCER
→ supplies authoritative Speed
→ supplies actor/item data
→ supplies structured Boost-related synergy semantics where available
