# Brace
cat > docs/af-brace.md <<‘EOF’
# AF — Brace

## Status

**Native dedicated Brace execution flow:** Not found.

**Native Brace semantic identity:** Found.

**Native packed-state concepts:** Found.

**Native damage mitigation primitive:** Found.

**Native authoritative damage application boundary:** Found.

**Frame Helm implementation status:** Frame Helm should own the Brace reaction state/timing and feed its defensive consequence into native Lancer damage resolution rather than reimplementing damage math.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Brace** Reaction and defines the intended Frame Helm integration boundary.

Repository investigation did not reveal a dedicated executable Brace flow such as:

`BraceFlow`

or:

`beginBraceFlow()`

However, the native system contains several important pieces that Frame Helm can reuse:

- Brace exists as a native semantic/synergy location.
- Legacy/packed mech state contains `braced` and `bracedCooldown`.
- Native damage resolution already supports half-damage handling.
- Native authoritative damage application is centralized in `LancerActor.damageCalc(...)`.
- Native damage processing already handles Armor, Resistance, Exposed, Overshield, Heat, HP, Burn, AP, and related defensive consequences.

Therefore:

> Frame Helm should implement Brace as a reaction-state and timing orchestration layer.

while:

> Native Lancer should remain authoritative for the actual downstream damage calculation.

—

# 1. Brace Classification

Brace is a **Reaction**.

Unlike normal turn actions, Brace is not simply selected and executed at arbitrary timing.

It is triggered in response to an incoming event.

Therefore Brace requires Frame Helm to understand:

- reaction availability;
- incoming attack/effect timing;
- which incoming event the Brace is attached to;
- Brace’s immediate defensive consequence;
- any later penalty/cooldown;
- when Brace state ends.

This makes Brace fundamentally more timing-sensitive than actions such as:

- Boost;
- Boot Up;
- Lock On;
- Scan.

—

# 2. Native Brace Flow Search

Repository searching did not identify:

- `BraceFlow`
- `beginBraceFlow()`
- dedicated Brace flow file
- dedicated Brace actor method
- dedicated Brace sheet handler
- dedicated Brace execution app
- dedicated universal Brace action workflow

Therefore Frame Helm cannot delegate Brace execution to a native Brace flow.

—

# 3. Native Brace Semantic Identity

The repository contains:

`brace`

as a native synergy/action location.

This exists alongside other semantic locations such as:

- `overwatch`
- `skirmish`
- `barrage`
- `stabilize`
- `boost`
- `lock_on`
- `bolster`

This means native content can conceptually reference Brace as a meaningful action/event location even though the universal Brace action itself lacks a dedicated execution flow.

Therefore Frame Helm should preserve Brace as a semantic event, not merely as an anonymous damage modifier.

—

# 4. Native Packed Brace State

The repository also contains packed mech-state concepts equivalent to:

`braced`

and:

`bracedCooldown`

within a packed/unpacking mech-state representation.

Conceptually:

`braced: boolean`

`bracedCooldown: boolean`

This suggests that some prior or external state model anticipated two Brace-related states:

- currently Braced;
- Brace cooldown / aftermath.

However, repository searching did not identify current runtime code that actively operates on these fields as part of Brace execution.

Therefore:

> These fields are evidence of intended state concepts.

They are **not** sufficient evidence to directly reproduce a runtime Brace state machine without confirming the actual Lancer rules and current runtime ownership.

—

# 5. Do Not Mutate Packed State Blindly

Frame Helm should not assume that:

`braced = true`

and:

`bracedCooldown = true`

are currently authoritative runtime fields simply because they exist in packed data structures.

Before implementation, determine:

- whether current mech actors still expose these fields;
- whether they are legacy/import-only;
- whether they are persisted;
- whether any native UI consumes them;
- whether another status/effect representation is preferred.

If no active native runtime state exists, Frame Helm may need to own Brace timing state internally while still using native damage primitives.

—

# 6. Native Damage Architecture

Repository research identified the native damage pipeline.

At a high level:

attack resolves
→ damage action/card
→ damage roll callback
→ `DamageRollFlow`
→ native damage configuration and rolling
→ native damage card
→ Apply Damage
→ target actor
→ `LancerActor.damageCalc(...)`
→ authoritative defensive calculations
→ actor document mutation

This is the critical native boundary for Brace.

—

# 7. Native `DamageRollFlow`

The native damage flow contains the ordered steps:

`initDamageData`
→ `setDamageTags`
→ `setDamageTargets`
→ `showDamageHUD`
→ `rollReliable`
→ `rollNormalDamage`
→ `rollCritDamage`
→ `applyOverkillHeat`
→ `printDamageCard`

This flow prepares and rolls damage.

The final authoritative target mutation occurs later through:

`LancerActor.damageCalc(...)`

—

# 8. Weapon Attack to Damage Boundary

The native weapon attack flow currently ends with:

`printAttackCard`

and the source contains a TODO indicating damage flow is not automatically chained directly from attack resolution.

Conceptually:

WeaponAttackFlow
→ attack resolves
→ attack card
→ player initiates damage
→ DamageRollFlow
→ damage application

This matters because Brace timing may need to span the boundary between:

incoming attack

and:

incoming damage application.

Frame Helm’s eventual automation may remove some of this manual separation, but the native architecture currently treats them as distinct phases.

—

# 9. Native Authoritative Damage Entry Point

The most important discovered damage boundary is:

`LancerActor.damageCalc(...)`

Conceptually:

`targetActor.damageCalc(damage, options)`

with options including concepts such as:

- `multiple`
- `addBurn`
- `ap`
- `paracausal`

This method is the authoritative native location where incoming damage is processed against the target.

Frame Helm should strongly prefer feeding prepared damage into this method rather than reproducing downstream defensive rules itself.

—

# 10. Native Damage Processing

The native damage calculation already handles a broad set of rules.

The discovered sequence includes:

Step 0:
damage multiplier

Step 1:
Exposed

Step 2:
Armor

Step 3:
Resistance

followed by handling for:

- Heat
- Overshield
- HP
- Burn
- authoritative actor updates
- native damage chat output

The native system therefore already understands much of the defensive math that Brace interacts with.

—

# 11. Native Half-Damage Primitive

The repository contains a native half-damage mechanism.

`damageCalc(...)` accepts a multiplier concept through:

`multiple`

with values including:

`0.5`

`1`

`2`

When:

`multiple === 0.5`

the native code recognizes the damage as being halved.

This gives Frame Helm a reusable primitive for any Brace consequence that is mechanically represented as half damage.

—

# 12. Native Damage HUD Half-Damage State

The native damage UI also exposes a concept equivalent to:

`halfDamage`

This exists in target/global damage configuration.

Therefore half damage is not an accidental internal numeric trick.

It is a first-class concept in the native damage-resolution architecture.

This strongly suggests Frame Helm should use this native mechanism where Brace requires halving incoming damage.

—

# 13. Brace Damage Integration

Assuming the confirmed Brace rules require halving the relevant incoming damage, the intended architecture should be:

incoming attack/effect
→ Brace reaction declared
→ Frame Helm validates reaction availability
→ Frame Helm records Brace against that incoming event
→ damage resolution begins
→ Frame Helm/native adapter marks relevant damage as half damage
→ native damage application calls:
  `damageCalc(..., { multiple: 0.5 })`
→ native system handles downstream defenses
→ Brace event resolves

The exact point where Frame Helm supplies `multiple: 0.5` must be determined from the final execution architecture.

—

# 14. Do Not Reimplement Damage Halving

Frame Helm should not implement:

raw damage / 2

and then separately reproduce:

- Exposed;
- Armor;
- Resistance;
- Overshield;
- Heat;
- Burn;
- HP.

Native Lancer already provides the appropriate centralized damage path.

The preferred model is:

Brace
→ configure native damage multiplier
→ native `damageCalc(...)`

not:

Brace
→ custom Frame Helm damage engine.

—

# 15. Brace and Resistance

The native implementation treats:

`multiple === 0.5`

as a special resistance-like damage modifier.

This is useful technically, but the exact interaction with Brace must still be checked against the tabletop rules.

Before implementation, confirm:

- whether Brace halves all relevant damage;
- whether it stacks with ordinary Resistance;
- whether it affects Heat;
- whether it affects Burn;
- whether it affects Paracausal damage;
- whether AP changes anything;
- whether it affects secondary/non-damage consequences.

Do not infer all rule interactions solely from the existence of the native half-damage primitive.

—

# 16. Frame Helm Reaction Ownership

Frame Helm’s Turn state already owns Reaction availability.

Relevant current concepts include:

`reaction.usedThisTurn`

and:

`reaction.actionId`

Therefore Brace should integrate naturally with Frame Helm’s Turn domain.

Conceptually:

Brace declared
→ validate Reaction available
→ consume Reaction
→ record action ID
→ begin Brace defensive state

The native damage system does not need to know how Frame Helm tracks Reaction expenditure.

—

# 17. Proposed Initial Brace Flow

The initial Frame Helm flow should be:

incoming qualifying event occurs
→ Frame Helm exposes Brace opportunity
→ player chooses Brace
→ Frame Helm resolves authoritative acting mech
→ validate reaction availability
→ validate Brace is legal for this incoming event
→ consume Frame Helm Reaction
→ record Brace reaction state
→ apply Brace defensive modifier to the bound incoming event
→ allow native damage resolution to proceed
→ enforce any confirmed post-Brace penalty/cooldown
→ update Frame Helm state/presentation

No attack roll is made by Brace itself.

—

# 18. Brace Requires an Incoming Event

Brace should not behave like a normal action button that can be executed freely with no context.

The reaction should be bound to a qualifying incoming event.

Conceptually:

Incoming attack/effect event ID
→ Brace reaction
→ Brace state references that event
→ modifier applies only to that event

This prevents Brace from incorrectly becoming a persistent generic half-damage toggle.

—

# 19. Event-Bound State

A future Frame Helm Brace execution record may need information such as:

- source attacker;
- source attack/effect;
- target actor;
- triggering event identity;
- timestamp;
- Brace active state;
- damage modifier applied;
- post-Brace penalty state.

This is conceptual only.

The exact state contract should be designed during implementation.

—

# 20. Reaction Timing

Brace timing must be researched precisely from the Lancer rules.

Frame Helm needs to know:

- when Brace may be declared;
- whether declaration occurs after hit confirmation;
- whether it occurs before damage is rolled;
- whether it can respond to non-attack damage;
- whether it can respond to tech effects;
- whether it can respond to saves;
- whether it can respond to area attacks;
- whether it can respond to multiple simultaneous attacks.

The native repository does not supply a Brace action workflow that answers these questions.

The tabletop rules must therefore be authoritative for reaction timing.

—

# 21. Non-Damage Effects

Brace may affect more than raw damage.

Before implementation, determine whether Brace also modifies or prevents:

- conditions;
- statuses;
- forced movement;
- knockback;
- prone;
- secondary attack effects;
- Heat;
- Burn;
- save-triggered consequences;
- other non-damage outcomes.

If so, those consequences need their own integration path.

Do not assume that supplying:

`multiple: 0.5`

fully implements Brace.

—

# 22. Brace Aftermath / Cooldown

The packed-state field:

`bracedCooldown`

suggests a post-Brace restriction or cooldown concept existed in the data model.

Frame Helm must confirm the actual rule timing.

Questions include:

- what penalty applies after Brace;
- whether it affects the rest of the current turn;
- whether it affects the next turn;
- when the cooldown begins;
- when it ends;
- what actions are prohibited or modified;
- whether Reaction refresh interacts with it.

Only after confirming these rules should Frame Helm implement a post-Brace state machine.

—

# 23. Possible State Machine

Conceptually, Brace may eventually require a state model resembling:

Brace available
→ qualifying event
→ Brace declared
→ Reaction spent
→ immediate Brace effect active
→ triggering event resolves
→ immediate Brace effect ends
→ post-Brace restriction active
→ later lifecycle point
→ restriction clears

This is conceptual only.

Do not implement these exact transitions until rule timing is confirmed.

—

# 24. Relationship to `braced`

If current runtime actor state does not use the packed `braced` field, Frame Helm should not create a fake native state merely to match the old schema.

Possible implementation choices include:

- Frame Helm Turn state;
- Frame Helm reaction execution state;
- temporary ActiveEffect if appropriate;
- another native actor state mechanism discovered later.

The selected approach should be based on actual runtime needs.

—

# 25. Relationship to `bracedCooldown`

Likewise, `bracedCooldown` should not be mutated blindly.

It is useful evidence that the concept existed, but not proof that current Foundry Lancer runtime consumes it.

Before using it:

- search current actor models;
- search sheets;
- search templates;
- search hooks;
- search update handlers;
- search effect/status helpers.

If no current consumer exists, Frame Helm should own the restriction explicitly.

—

# 26. Brace and Damage Automation

The Brace search revealed an important general Frame Helm architecture beyond Brace itself.

For future automated attacks:

Frame Helm determines hit
→ raw damage rolled
→ Frame Helm prepares native damage options
→ target actor receives:
  `damageCalc(...)`
→ native Lancer handles defenses
→ authoritative actor mutation occurs

This is likely the preferred endpoint for:

- Skirmish;
- Barrage;
- Improvised Attack;
- weapon attacks;
- certain tech effects;
- other damaging player actions.

—

# 27. Native Damage Options

The discovered `damageCalc(...)` options include concepts such as:

`multiple`

`addBurn`

`ap`

`paracausal`

These should be preserved rather than flattened into precomputed damage when possible.

Conceptually:

Frame Helm should pass:

raw damage
+
mechanical flags/options

to native Lancer.

This lets the native system apply its own defensive ordering.

—

# 28. Armor and AP

Native damage resolution already knows about Armor and AP.

Therefore Brace should not introduce its own Armor interaction.

If the incoming damage is AP:

Frame Helm passes AP information

and:

native `damageCalc(...)`

handles the resulting interaction.

—

# 29. Paracausal Damage

Native damage calculation accepts a paracausal concept.

Brace interaction with Paracausal damage must be checked against the actual rules.

Frame Helm should not assume that half-damage Brace applies or does not apply.

The damage engine provides the primitive; the Brace adapter must decide the legal configuration.

—

# 30. Burn

Native damage handling already supports Burn-related behavior.

Brace interaction with Burn should be confirmed explicitly.

Questions include:

- Does Brace halve initial Burn?
- Does Brace affect existing Burn?
- Does Brace affect Burn application but not future Burn ticks?

These are rules questions, not repository implementation questions.

—

# 31. Heat

Native damage handling includes Heat.

Brace interaction with Heat should also be confirmed.

Do not assume:

half physical damage
=
half Heat

unless the rules say so.

The native damage pipeline provides the mechanism, but Frame Helm must supply correct Brace semantics.

—

# 32. Overshield

Overshield is already downstream of the native damage calculation.

Therefore Frame Helm should not separately subtract Overshield when Brace is active.

The native damage call should remain authoritative.

—

# 33. Exposed

Exposed is already part of the native damage ordering.

This is especially important because damage doubling and Brace halving may interact.

Frame Helm should not decide the final numeric result itself if native `damageCalc(...)` can correctly apply the relevant multipliers and defenses.

The exact stacking/order should remain native whenever possible.

—

# 34. Brace Presentation

Brace should appear as a reaction-capable action in Frame Helm.

However, its execution control should normally become available in response to a qualifying event rather than existing only as a static committed-plan action.

Conceptually:

INCOMING ATTACK

`BRACE AVAILABLE                       [React]`

The exact UI belongs to the reaction/presentation layer.

—

# 35. Reaction Availability

Frame Helm already tracks whether a Reaction has been used during the turn.

Brace execution should consult that authoritative Turn state.

If Reaction is unavailable:

Brace should be disabled or rejected with a clear legality reason.

No native damage mutation should occur.

—

# 36. Brace and Other Reactions

Brace shares the Reaction budget with actions such as:

Overwatch

and actor-owned reactions.

Therefore the Reaction system should remain generic.

Brace should not create its own parallel “Brace available” budget independent of Turn reaction state.

—

# 37. Future Trigger Architecture

Because native content recognizes:

`brace`

as a synergy location, future actor-owned content may trigger from:

- when you Brace;
- after you Brace;
- while Braced;
- after Brace resolves.

Frame Helm should preserve Brace action identity so these effects can eventually be integrated.

—

# 38. Do Not Parse Text First

If native actor-owned content exposes structured synergy information for:

`brace`

Frame Helm should prefer that structured data over scanning descriptive text.

Preferred hierarchy:

1. native structured synergy/action metadata;
2. native action/effect data;
3. explicit Frame Helm adapter;
4. prose parsing only when unavoidable.

—

# 39. Native-System Boundary

The intended execution boundary is:

Frame Helm reaction/timing layer
→ Brace legality
→ Reaction expenditure
→ incoming-event binding
→ Brace modifier preparation
→ native damage adapter
→ `LancerActor.damageCalc(...)`
→ native defense processing
→ authoritative actor mutation
→ Frame Helm aftermath/cooldown state

This keeps responsibility clean.

—

# 40. Do Not Invent `BraceFlow`

No native `BraceFlow` was found.

Frame Helm may have an internal Brace execution service, but it should not pretend to delegate to a nonexistent native workflow.

The native reusable primitive is:

`damageCalc(...)`

not:

`BraceFlow`.

—

# 41. Immediate Repository Research TODO

- [ ] Trace every current runtime reference to `braced`.
- [ ] Trace every current runtime reference to `bracedCooldown`.
- [ ] Determine whether either field exists on live mech actor state.
- [ ] Determine whether either field is legacy/import-only.
- [ ] Trace `DamageRollFlow` target data in full.
- [ ] Trace the exact `halfDamage` property path.
- [ ] Trace how `halfDamage` becomes `multiple: 0.5`.
- [ ] Determine whether half damage can be assigned per target.
- [ ] Determine whether half damage can be injected before the HUD.
- [ ] Determine whether Frame Helm can bypass the HUD while preserving native calculations.
- [ ] Trace `applyDamage(...)`.
- [ ] Trace the complete signature of `LancerActor.damageCalc(...)`.
- [ ] Record all relevant options passed into `damageCalc(...)`.
- [ ] Determine how permission/GM ownership affects damage application.
- [ ] Determine how `damageCalc(...)` reports success/failure.

—

# 42. Rules Research TODO

Before final Brace implementation:

- [ ] Confirm exact Brace trigger timing.
- [ ] Confirm exact Brace damage reduction.
- [ ] Confirm whether Brace affects all damage or only specific damage.
- [ ] Confirm interaction with Heat.
- [ ] Confirm interaction with Burn.
- [ ] Confirm interaction with AP.
- [ ] Confirm interaction with Paracausal damage.
- [ ] Confirm interaction with Exposed.
- [ ] Confirm interaction with Resistance.
- [ ] Confirm interaction with Overshield.
- [ ] Confirm non-damage effects modified by Brace.
- [ ] Confirm post-Brace penalty.
- [ ] Confirm duration of post-Brace penalty.
- [ ] Confirm when Brace can be used again.
- [ ] Confirm interaction with Reaction refresh timing.

—

# 43. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add Brace reaction execution strategy.
- [ ] Integrate Brace with Frame Helm Reaction availability.
- [ ] Define qualifying incoming-event representation.
- [ ] Bind Brace to one incoming event.
- [ ] Spend Reaction once.
- [ ] Track Brace immediate state.
- [ ] Feed Brace’s confirmed damage modifier into native damage resolution.
- [ ] Prefer native `damageCalc(...)` for authoritative damage mutation.
- [ ] Preserve native Armor/Resistance/Overshield/etc. behavior.
- [ ] Apply confirmed non-damage Brace consequences.
- [ ] Track post-Brace restriction/cooldown.
- [ ] Clear Brace state at correct lifecycle points.
- [ ] Refresh Frame Helm UI.
- [ ] Preserve Brace semantic event for future triggers.
- [ ] Smoke-test Brace against weapon damage.
- [ ] Smoke-test Brace with Armor.
- [ ] Smoke-test Brace with Resistance.
- [ ] Smoke-test Brace while Exposed.
- [ ] Smoke-test Brace against AP damage.
- [ ] Smoke-test Brace with Overshield.
- [ ] Smoke-test Brace with Heat/Burn as applicable.
- [ ] Smoke-test Reaction already spent.
- [ ] Smoke-test Brace aftermath/cooldown.

—

# 44. Important Invariants

**Invariant 1**

Brace is a Reaction.

**Invariant 2**

No dedicated native `BraceFlow` was found.

**Invariant 3**

Frame Helm owns Brace reaction timing and state.

**Invariant 4**

Reaction expenditure remains owned by Frame Helm Turn state.

**Invariant 5**

Brace should be bound to a qualifying incoming event.

**Invariant 6**

Native Lancer already provides a first-class half-damage primitive.

**Invariant 7**

Native Lancer’s authoritative damage boundary is `LancerActor.damageCalc(...)`.

**Invariant 8**

Frame Helm should not recreate Armor, Resistance, Exposed, Overshield, HP, Burn, or Heat processing when native damage resolution can handle them.

**Invariant 9**

Packed `braced` and `bracedCooldown` fields should not be treated as authoritative runtime state until confirmed.

**Invariant 10**

Brace’s exact timing and aftermath must come from confirmed Lancer rules.

—

# 45. Final Working Model

BRACE
│
├── Reaction
│
├── no dedicated native BraceFlow found
│
├── native semantic identity:
│   └── `brace`
│
├── packed/legacy state concepts:
│   ├── `braced`
│   └── `bracedCooldown`
│
├── Frame Helm owns:
│   ├── reaction legality
│   ├── trigger timing
│   ├── incoming-event binding
│   ├── Reaction expenditure
│   ├── immediate Brace state
│   ├── post-Brace state/cooldown
│   └── presentation
│
└── Native Lancer owns:
    │
    ├── DamageRollFlow
    ├── halfDamage concept
    ├── damage multiplier
    ├── `multiple: 0.5`
    ├── `LancerActor.damageCalc(...)`
    ├── Exposed
    ├── Armor
    ├── Resistance
    ├── Heat
    ├── Overshield
    ├── HP
    ├── Burn
    └── authoritative actor mutation

The critical integration boundary is:

Brace reaction state
→ native damage multiplier
→ native `damageCalc(...)`

rather than:

Brace
→ custom Frame Helm damage engine.

The remaining hard problem is not damage arithmetic.

It is:

**reaction timing + event binding + non-damage Brace consequences + aftermath/cooldown.**
EOF