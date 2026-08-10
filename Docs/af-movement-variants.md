# Movement Variants

# AF — Movement Variants

## Status

**Native dedicated Move flow:** Not found.

**Native dedicated Jump flow:** Not found.

**Native dedicated Fly flow:** Not found.

**Native dedicated Teleport flow:** Not found.

**Native dedicated Fall Damage flow:** Not found.

**Native standard movement path/segment handling:** Found.

**Native movement action configuration:** Found.

**Native Jump movement-cost handling:** Found.

**Native Climb movement-cost handling:** Found.

**Native Teleport movement semantics:** Found.

**Native Forced movement semantics:** Found.

**Native elevation-aware movement waypoints:** Found.

**Native Flying status:** Found.

**Native Flight System classification:** Found.

**Native fall-damage automation:** Not found.

**Frame Helm implementation status:** Frame Helm should own the per-turn movement ledger and higher-level movement-mode legality while consuming native Foundry/Lancer movement-path semantics and cost calculation wherever those already exist.

## Purpose

This document records the native Foundry Lancer findings relevant to movement variants including:

- standard movement;
- Jump;
- Climb;
- Fly;
- Teleport;
- Forced movement;
- elevation changes;
- falling and fall damage.

Repository investigation shows that movement is not implemented through a family of dedicated Lancer action Flows.

There is no discovered:

`MoveFlow`

`JumpFlow`

`FlyFlow`

`TeleportFlow`

or:

`FallDamageFlow`

Instead, Lancer extends Foundry’s native token movement-action and path-measurement systems.

This gives Frame Helm an important architectural rule:

> Movement variants should generally be treated as policies/methods layered over one shared movement pipeline rather than as completely separate action engines.

Frame Helm should therefore consume native movement interpretation where possible and add only the missing Lancer-specific action/rules orchestration.

—

# 1. Core Architectural Finding

Movement in native Lancer is primarily represented through:

`CONFIG.Token.movement.actions`

plus:

Foundry token movement paths
→ waypoints
→ movement segments
→ native movement-cost functions

rather than:

action
→ dedicated Lancer Flow class

This means Frame Helm should prefer:

Foundry/Lancer interpreted movement data

over:

recalculating movement from raw token X/Y changes.

—

# 2. Shared Movement Pipeline

The preferred conceptual architecture is:

Player moves token
→ Foundry/Lancer movement action identifies movement method
→ native movement path is constructed
→ native path/terrain/method cost is calculated
→ movement segment includes X/Y/elevation/method context
→ Frame Helm Movement feature receives interpreted segment
→ Frame Helm updates turn movement ledger
→ movement-trigger systems evaluate the segment

This pipeline should support all movement variants.

—

# 3. Native Standard Movement Flow Search

Repository searching did not identify:

- `MoveFlow`
- `beginMoveFlow()`
- dedicated standard movement flow
- dedicated standard movement actor method
- dedicated movement-roll flow

Standard movement is fundamentally token movement plus actor Speed/action-tracker data.

—

# 4. Native Speed

The authoritative actor movement stat is:

`actor.system.speed`

Native action-tracker initialization uses the actor’s Speed through logic conceptually equivalent to:

`getSpeed(actor)`

This confirms that Frame Helm should continue deriving the movement allowance from native actor Speed.

Do not duplicate a permanent Frame Helm Speed stat.

—

# 5. Native Action Tracker Movement

Native actor action tracking contains:

`actor.system.action_tracker.move`

This is initialized using actor Speed.

However, the native system does not appear to maintain the detailed physical movement ledger that Frame Helm needs.

The native code contains a TODO around movement-counting UI/behavior.

Therefore the stock system knows:

`movement allowance = Speed`

but does not appear to fully reconcile actual token-path distance against that allowance.

—

# 6. Frame Helm Standard Movement Ownership

Frame Helm should continue to own:

- movement spent;
- movement remaining;
- movement segment history;
- total tracked movement;
- movement completion;
- Boost movement pools;
- Overcharge Boost movement pools;
- movement-event deduplication;
- elevation-related movement accounting;
- movement-trigger integration.

Native Lancer should supply:

- Speed;
- Foundry path geometry;
- terrain/path cost;
- movement-method semantics.

—

# 7. Geometric Distance vs Movement Cost

This is an important distinction.

Frame Helm should eventually track at least conceptually:

`geometric distance`

and:

`movement cost`

because they are not always equal.

Examples:

Standard movement:
distance 3
→ cost may be 3

Jump:
distance 3
→ cost 6

Climb:
distance 3
→ cost 6

Teleport:
geometric relocation 6
→ ordinary movement cost 0

Therefore Frame Helm should not assume:

`distance moved == movement budget spent`

for every movement variant.

—

# 8. Native Movement Action Configuration

Lancer modifies:

`CONFIG.Token.movement.actions`

to add or customize movement modes.

This is the principal native movement-mode integration point.

Frame Helm should treat this configuration as authoritative for native-supported movement method semantics.

—

# 9. Native Jump

The repository configures a native token movement action:

`jump`

Jump is therefore represented structurally in the Foundry movement engine.

There is no dedicated `JumpFlow`.

—

# 10. Native Jump Cost

The Jump movement action uses a cost function equivalent to:

`cost = distance × 2`

This means the native movement path itself can represent:

geometric distance
→ doubled movement expenditure

Frame Helm should reuse this interpreted cost where practical.

—

# 11. Proposed Jump Integration

Preferred architecture:

player selects/uses Jump movement mode
→ Foundry/Lancer movement action = `jump`
→ native path calculation
→ native movement cost = 2 × distance
→ Frame Helm receives interpreted cost
→ Frame Helm movement ledger spends that cost

Frame Helm should not independently multiply Jump distance by two if the native movement path already supplies the correct cost.

Avoid double-counting.

—

# 12. Jump Additional Rules

Native movement-cost support does not necessarily implement every tabletop Jump rule.

Frame Helm may still need to own:

- whether Jump is currently legal;
- maximum vertical/horizontal movement;
- terrain/clearance restrictions;
- interaction with elevation;
- interaction with falling;
- actor-owned modifiers.

These should come from confirmed Lancer rules.

—

# 13. Native Climb

The repository configures a native:

`climb`

movement action.

Climb uses the same general doubled-cost pattern as Jump.

No dedicated `ClimbFlow` was found.

—

# 14. Native Climb Cost

Climb movement cost is conceptually:

`distance × 2`

Therefore Jump and Climb should likely share the same Frame Helm native-cost consumption architecture.

—

# 15. Shared Jump / Climb Pattern

Conceptually:

Movement method
→ native path cost function
→ doubled movement cost
→ Frame Helm ledger

Frame Helm should distinguish the method identity for:

- rules triggers;
- presentation;
- elevation behavior;

while reusing one cost-integration path.

—

# 16. Native Teleport

Teleport is substantially more represented in the native movement configuration.

Lancer defines a native token movement action:

`teleport`

with teleport-specific semantics.

No dedicated `TeleportFlow` was found.

—

# 17. Native Teleport Flag

The native Teleport movement action sets:

`teleport: true`

This semantic is carried into token movement/path segmentation.

Therefore Teleport is not merely identified by label text.

The native path system knows:

`this movement segment is teleportation`

This is extremely useful for Frame Helm trigger logic.

—

# 18. Native Teleport Cost

The native Teleport action uses:

`movement cost = 0`

for ordinary movement measurement.

Therefore teleport token relocation does not consume ordinary measured movement in the same manner as standard movement.

This is a physical movement semantic.

It does not by itself determine the action/resource cost of the ability that caused the Teleport.

—

# 19. Native Teleport Animation

Teleport uses an animation option equivalent to:

`duration: 0`

This avoids ordinary movement animation.

Frame Helm should preserve native token movement presentation where possible rather than manually animating teleportation.

—

# 20. Native Teleport Terrain Handling

Native Teleport movement effectively ignores ordinary terrain difficulty through a terrain difficulty value equivalent to:

`1`

Therefore native path-cost logic already treats Teleport differently from ordinary terrain traversal.

—

# 21. Teleport Ability vs Teleport Movement

This distinction is critical.

A system may grant:

`Teleport 5`

as an ability.

The ability itself owns:

- action cost;
- maximum teleport range;
- valid target/self;
- charges/resources;
- destination restrictions.

The physical token movement then uses:

`movement method = teleport`

which carries:

- teleport semantic;
- zero ordinary movement cost;
- no normal animation;
- terrain bypass.

Therefore Frame Helm should separate:

**ability execution**

from:

**movement method**

—

# 22. Native `blink`

The repository also defines a movement action:

`blink`

with localization corresponding to a concept similar to:

`Teleport (Move)`

while:

`teleport`

is localized more like:

`Teleport (Ability)`

This indicates the native movement model distinguishes at least two teleport-like movement contexts.

The exact tabletop intent should be researched before implementation.

Do not merge `blink` and `teleport` solely based on visual similarity.

—

# 23. Blink Research Need

Before using `blink`, determine:

- what code selects it;
- whether it consumes ordinary movement;
- whether it is intended for Blinkspace movement;
- how its cost function differs from Teleport;
- whether actor-owned systems explicitly select it.

This is a useful follow-up search.

—

# 24. Native Forced Movement

The repository also defines:

`forced`

as a token movement action.

This is highly relevant to:

- Ram;
- Knockback;
- Grapple movement;
- other forced repositioning effects.

—

# 25. Forced Movement Semantics

The native Forced movement action includes concepts equivalent to:

`teleport: true`

`measure: false`

`movement cost = 0`

This means native Foundry/Lancer already provides a movement classification suitable for:

`move this token without spending ordinary movement`

Frame Helm should strongly consider reusing this rather than inventing a parallel forced-movement token-path type.

—

# 26. Forced Movement Is Not Necessarily Teleportation

The native `teleport: true` flag used by Forced movement is likely an implementation semantic telling Foundry how to process the path.

It should not automatically be interpreted as:

`the character literally teleported`

for game rules.

Frame Helm should preserve the higher-level movement cause:

`forced`

while consuming the native path behavior.

—

# 27. Ram Integration

The Ram action should eventually be able to produce:

Ram succeeds
→ determine forced destination
→ invoke Movement feature with method/context = forced
→ native Foundry path does not spend ordinary movement
→ downstream movement-trigger logic receives forced-movement classification

This aligns well with the architecture documented in `af-grapple-ram.md`.

—

# 28. Grapple Integration

Grapple-related movement may also need:

`forced`

or another explicit movement context depending on the tabletop rule.

Do not treat movement caused by another character as ordinary self-spent movement.

—

# 29. Native Elevation Waypoints

The custom Lancer token movement handling carries elevation in each waypoint.

Conceptually:

waypoint:
- x
- y
- elevation

Therefore elevation is part of the native movement path model.

This strongly validates Frame Helm’s elevation-tracking work.

—

# 30. Elevation Is Movement Geometry

Frame Helm should continue to treat elevation change as part of Movement interpretation.

Do not model elevation as an unrelated UI-only number.

The token path already represents elevation together with X/Y position.

—

# 31. Elevation Segment Context

Conceptually:

movement segment
→ origin:
   x
   y
   elevation
→ destination:
   x
   y
   elevation
→ movement method
→ interpreted distance/cost

This should become the canonical input shape for higher-level movement rules wherever possible.

—

# 32. Elevation Cost

The repository findings prove elevation is carried in path data.

They do not by themselves prove that every elevation change is automatically costed exactly as Lancer requires.

Therefore Frame Helm should trace the native measurement result rather than simply assuming:

vertical delta
= movement cost.

Jump, Climb, Fly, Teleport, and falling may all treat vertical movement differently.

—

# 33. Native Fly Flow Search

Repository searching did not identify:

- `FlyFlow`
- `beginFlyFlow()`
- `CONFIG.Token.movement.actions.fly`
- dedicated Fly movement-cost function
- dedicated Fly path executor

Therefore Fly is less directly automated than Jump or Teleport.

—

# 34. Native Flying Status

The native status/icon infrastructure contains:

`flying`

Therefore Lancer has a first-class semantic/status identity for:

`this character is Flying`

Frame Helm should use this native state where appropriate.

—

# 35. Native Flying Integration Is Incomplete

The changelog notes Flying was added to core icon sets for future integration with ruler/movement functionality.

This strongly suggests:

Flying status exists

but:

full native Fly movement automation is incomplete.

Therefore Frame Helm likely needs to own actual Fly movement semantics.

—

# 36. Native Flight System Classification

The native data model recognizes:

`SystemType.FlightSystem`

This is valuable for future Mounted System discovery.

It may allow Frame Helm to identify flight-capable systems structurally rather than by item name.

—

# 37. Flight System Does Not Automatically Mean Fly Rules Are Solved

The existence of:

`SystemType.FlightSystem`

does not prove the native runtime automatically determines:

- whether Fly is currently available;
- Flight speed;
- Heat cost;
- activation state;
- resource use;
- landing/fall behavior.

Those need further system-item research.

—

# 38. Proposed Fly Architecture

Conceptually:

actor has legal flight capability
→ Fly mode becomes available
→ Frame Helm marks movement method = fly
→ token moves with elevation-aware path
→ Frame Helm consumes movement cost according to confirmed Fly rules
→ native `flying` status maintained where appropriate
→ movement-trigger systems receive method = fly

Frame Helm should reuse native geometry while supplying missing Fly policy.

—

# 39. Fly and Elevation

Fly is one of the main reasons elevation context must remain first-class.

Conceptually:

Fly segment
→ horizontal delta
→ vertical delta
→ native/path distance
→ confirmed Fly cost rule
→ Frame Helm ledger

Do not separately mutate elevation outside the Movement pipeline.

—

# 40. Fly and Falling

A flying character decreasing elevation is not automatically falling.

Likewise, a Flying status ending while the token is above the ground may create a fall.

Therefore Frame Helm needs a distinction between:

controlled flight/descent

and:

uncontrolled fall.

—

# 41. Fall Flow Search

Repository searching did not identify:

- `FallFlow`
- `FallDamageFlow`
- `applyFallDamage()`
- `fallDamage()`
- elevation-drop damage hook
- automatic fall detector

Therefore native Lancer does not appear to automate falling damage.

—

# 42. Elevation Decrease Is Not Automatically a Fall

Frame Helm must not implement:

if destination.elevation < origin.elevation:
→ apply fall damage

because downward movement may be:

- Fly descent;
- Climb descent;
- Jump;
- Teleport;
- forced movement;
- deliberate controlled movement;
- actual falling.

Movement context matters.

—

# 43. Need for Fall Movement Classification

Frame Helm will likely need a movement/event classification corresponding conceptually to:

`fall`

Native Lancer did not expose a dedicated Fall movement action in the searched configuration.

Therefore Fall may become a Frame Helm-owned movement context.

—

# 44. Proposed Fall Detection Architecture

Conceptually:

some game event causes unsupported/uncontrolled vertical movement
→ classify movement as Fall
→ resolve starting elevation
→ resolve ending elevation/ground
→ calculate fall distance
→ apply Lancer fall-damage rules
→ update token position/elevation
→ feed damage through native damage engine

The exact trigger conditions require rules research.

—

# 45. Native Fall Damage Flow

No native fall-damage executor was found.

Therefore Frame Helm will need to calculate the raw consequence itself once the tabletop rule is confirmed.

—

# 46. Native Damage Endpoint

Our Brace research identified the preferred downstream damage boundary:

`LancerActor.damageCalc(...)`

Therefore fall damage should eventually use:

Fall
→ calculate raw fall damage
→ construct native-compatible damage/options
→ `targetActor.damageCalc(...)`
→ native defensive processing
→ authoritative actor mutation

Frame Helm should not manually reproduce Armor, Resistance, HP, etc.

—

# 47. Fall Damage Rules Must Be Confirmed

Before implementation, confirm:

- fall damage formula;
- distance thresholds;
- maximum damage;
- damage type;
- whether Armor applies;
- whether Resistance applies;
- whether AP applies;
- whether Prone occurs;
- whether falling onto another character matters;
- whether size affects consequence;
- interaction with flight.

Repository absence means the tabletop rules must supply this behavior.

—

# 48. Native Path Cost and Terrain

Foundry/Lancer movement actions can derive terrain difficulty during path measurement.

This means movement cost may already reflect:

- terrain;
- movement method;
- scene grid rules.

Frame Helm should prefer consuming this cost result instead of recalculating purely from coordinates.

—

# 49. Native Diagonal Measurement

The native system supports configurable diagonal movement rules.

Examples in native settings/localization include concepts like:

- 1-1-1;
- 1-2-1;
- Manhattan-like movement;
- Euclidean-style movement.

Therefore raw coordinate math inside Frame Helm risks disagreeing with the user’s native Foundry/Lancer movement configuration.

Use native path measurement wherever practical.

—

# 50. Movement Cost Should Be Canonical

The ideal Frame Helm movement ledger should eventually receive something like:

segment:
- geometric distance
- movement cost
- method
- origin
- destination
- elevation
- terrain/path metadata

Then:

Frame Helm Turn movement
→ spends `movement cost`

while:

UI/history
→ may still show geometric distance separately

This is especially important for Jump/Climb.

—

# 51. Current Frame Helm Tracking

Frame Helm currently tracks concepts such as:

- totalTracked;
- standardUsed;
- boostUsed;
- overchargeBoostUsed;
- excess;
- movement segments.

The movement refactor should preserve these while making the segment input richer.

—

# 52. Boost Interaction

Boost grants another Speed-sized movement allowance.

Movement variants determine how quickly that allowance is spent.

Example:

Speed 4
→ Boost grants 4 movement points

Jump:
2 spaces geometric distance
→ may cost 4 movement

Therefore Boost remains action-economy/movement-pool logic while Jump remains movement-cost policy.

—

# 53. Teleport and Boost

Teleport movement cost being zero does not mean Teleport grants a Boost or consumes Boost movement.

A Teleport ability may reposition the token without affecting the ordinary movement pool.

Its parent ability owns its own cost.

—

# 54. Forced Movement and Boost

Forced movement should not normally consume the acting character’s ordinary movement allowance unless a specific rule says otherwise.

The native Forced movement action already supports zero ordinary movement cost.

This should integrate cleanly with Frame Helm’s movement ledger.

—

# 55. Overwatch Interaction

Movement method/context must be preserved because Overwatch trigger legality may differ among:

- ordinary movement;
- Jump;
- Fly;
- Teleport;
- forced movement;
- falling.

The Overwatch evaluator should consume interpreted movement context rather than only coordinate changes.

—

# 56. Disengage Interaction

Disengage suppresses qualifying movement-triggered Overwatch opportunities.

It should operate after movement method/trigger qualification is understood.

Conceptually:

movement segment
→ does this movement normally trigger Overwatch?
→ is mover Disengaging?
→ suppress if appropriate

—

# 57. Hide Interaction

Movement may break Hidden depending on the actual Lancer rules.

Therefore Hidden lifecycle monitoring should receive movement method context.

Potentially:

ordinary movement

may differ from:

Teleport

or:

forced movement

for Hidden break conditions.

Do not hard-code this until rules are confirmed.

—

# 58. Grapple Interaction

Grapple relationships may affect whether and how:

- ordinary movement;
- forced movement;
- Teleport;
- Fly;
- falling

are legal.

Therefore movement method classification should be reusable by Grapple relationship logic.

—

# 59. Movement Semantic Identity

The Movement feature should preserve method identity even when multiple methods have the same numeric cost.

For example:

Jump and Climb

both may cost:

2 × distance

but they remain different semantic movement modes.

Actor-owned effects may care about the distinction.

—

# 60. Proposed Movement Method Model

Conceptually, a Frame Helm movement segment could eventually carry:

`method`

values such as:

- standard;
- jump;
- climb;
- fly;
- teleport;
- blink;
- forced;
- fall.

Exact internal names should align with native movement action IDs where possible.

Avoid gratuitous translation layers.

—

# 61. Native IDs Should Be Preserved

Where native movement action IDs already exist:

`jump`

`climb`

`teleport`

`forced`

`blink`

Frame Helm should preserve those exact IDs internally where practical.

This makes debugging and native adapter integration much easier.

—

# 62. Frame Helm-Owned IDs

Where native movement actions do not exist, such as the currently discovered lack of:

`fly`

or:

`fall`

Frame Helm may need its own semantic method IDs.

These should be clearly documented as Frame Helm-owned rather than presented as native Lancer movement actions.

—

# 63. Movement Feature Ownership

The Movement feature should own:

- physical token movement interpretation;
- movement-method classification;
- movement-cost ingestion;
- movement segment history;
- elevation changes;
- terrain/path cost;
- forced-movement context;
- movement-trigger publication.

The Turn feature should own:

- Speed-sized movement budget;
- Boost allowances;
- action expenditure;
- turn lifecycle.

This preserves the architecture already emerging from the refactor.

—

# 64. Native-System Adapter Boundary

Preferred dependency direction:

Foundry token movement
→ native Lancer/Foundry movement action
→ movement path/waypoints
→ Frame Helm native-system adapter
→ Frame Helm Movement feature
→ Turn movement accounting
→ trigger systems

The Actions/UI layers should not directly parse low-level Foundry movement segments.

—

# 65. Standard Movement Working Model

STANDARD MOVE
│
├── Native Lancer / Foundry
│   ├── actor Speed
│   ├── path geometry
│   ├── grid measurement
│   ├── terrain
│   ├── diagonals
│   └── elevation waypoints
│
└── Frame Helm
    ├── movement ledger
    ├── spent/remaining
    ├── movement history
    ├── Boost pools
    └── trigger integration

—

# 66. Jump Working Model

JUMP
│
├── native movement action:
│   └── `jump`
│
├── native movement cost:
│   └── 2 × distance
│
├── native elevation-aware path
│
└── Frame Helm
    ├── legality/rules
    ├── consume native interpreted cost
    ├── movement ledger
    └── trigger integration

—

# 67. Climb Working Model

CLIMB
│
├── native movement action:
│   └── `climb`
│
├── native movement cost:
│   └── 2 × distance
│
└── Frame Helm
    ├── legality/rules
    ├── consume native interpreted cost
    └── movement ledger

—

# 68. Fly Working Model

FLY
│
├── native Flying status:
│   └── yes
│
├── native FlightSystem type:
│   └── yes
│
├── native Fly movement action:
│   └── none found
│
└── Frame Helm
    ├── determine flight availability
    ├── own Fly movement semantics
    ├── consume native geometry
    ├── track elevation
    ├── maintain Flying state
    └── trigger integration

—

# 69. Teleport Working Model

TELEPORT
│
├── native movement action:
│   └── `teleport`
│
├── native semantic:
│   └── teleport = true
│
├── native cost:
│   └── 0 ordinary movement
│
├── native animation:
│   └── duration 0
│
├── native terrain behavior:
│   └── ordinary terrain ignored
│
└── Frame Helm
    ├── parent ability legality
    ├── range/destination restrictions
    ├── resources/action cost
    ├── movement classification
    └── trigger integration

—

# 70. Forced Movement Working Model

FORCED MOVEMENT
│
├── native movement action:
│   └── `forced`
│
├── native measure:
│   └── false
│
├── native movement cost:
│   └── 0
│
├── native path implementation:
│   └── teleport-like
│
└── Frame Helm
    ├── cause/source
    ├── destination
    ├── Ram/Grapple integration
    └── reaction/trigger rules

—

# 71. Fall Working Model

FALL
│
├── native elevation path:
│   └── yes
│
├── native Fall action:
│   └── none found
│
├── native fall-damage flow:
│   └── none found
│
├── Frame Helm
│   ├── identify uncontrolled fall
│   ├── calculate fall distance
│   ├── calculate raw consequence
│   └── classify fall movement
│
└── Native Lancer
    └── `LancerActor.damageCalc(...)`
        └── authoritative downstream damage handling

—

# 72. Immediate Repository Research TODO

- [ ] Trace full `CONFIG.Token.movement.actions` modifications in `src/lancer.ts`.
- [ ] Record exact configuration of standard/walk movement.
- [ ] Record exact Jump cost function.
- [ ] Record exact Climb cost function.
- [ ] Trace `crawl` while movement configuration is open.
- [ ] Trace exact Teleport configuration.
- [ ] Trace exact Forced configuration.
- [ ] Trace exact Blink configuration.
- [ ] Determine why Blink and Teleport are separate.
- [ ] Trace custom `LancerTokenDocument` movement segmentation.
- [ ] Record exact movement-segment output shape.
- [ ] Determine how movement action/method ID appears in segment data.
- [ ] Determine how native movement cost is exposed after path measurement.
- [ ] Determine whether geometric distance is exposed separately.
- [ ] Trace elevation path-cost behavior.
- [ ] Trace terrain-difficulty calculation.
- [ ] Trace diagonal measurement configuration.
- [ ] Trace native `flying` status.
- [ ] Trace `SystemType.FlightSystem`.
- [ ] Search for ruler integration involving Flying.
- [ ] Search for native flight speed/cost helpers under alternate terminology.
- [ ] Search for forced-movement helpers used by macros/tools.
- [ ] Search for fall-related rules under alternate terms such as descent/drop.

—

# 73. Movement Rules Research TODO

Standard:

- [ ] Confirm standard movement rules.
- [ ] Confirm terrain interaction.
- [ ] Confirm elevation cost.
- [ ] Confirm diagonal interpretation.

Jump:

- [ ] Confirm exact Jump movement cost.
- [ ] Confirm vertical limits.
- [ ] Confirm horizontal/vertical combination.
- [ ] Confirm whether Jump can intentionally descend without falling.

Climb:

- [ ] Confirm exact Climb movement cost.
- [ ] Confirm terrain/structure requirements.
- [ ] Confirm descent rules.

Fly:

- [ ] Confirm exact Fly movement cost.
- [ ] Confirm whether all movement may be vertical.
- [ ] Confirm hover/landing requirements.
- [ ] Confirm what happens when Fly ends at elevation.
- [ ] Confirm interaction with Heat-producing flight systems.
- [ ] Confirm interaction with shutdown/stun.

Teleport:

- [ ] Confirm universal Teleport movement semantics.
- [ ] Confirm whether Teleport provokes reactions.
- [ ] Confirm destination occupancy rules.
- [ ] Confirm LOS requirements where applicable.
- [ ] Confirm elevation destination behavior.
- [ ] Confirm interaction with Grapple.

Forced:

- [ ] Confirm which reactions forced movement triggers.
- [ ] Confirm terrain collision behavior.
- [ ] Confirm elevation behavior.
- [ ] Confirm Grapple interaction.

Fall:

- [ ] Confirm what constitutes a fall.
- [ ] Confirm fall-distance measurement.
- [ ] Confirm damage formula.
- [ ] Confirm damage type.
- [ ] Confirm Armor/Resistance interaction.
- [ ] Confirm Prone or other consequences.
- [ ] Confirm falling onto characters/objects.
- [ ] Confirm maximum fall damage if any.

—

# 74. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Define canonical movement segment contract.
- [ ] Preserve native movement method/action ID.
- [ ] Preserve origin/destination X/Y/elevation.
- [ ] Preserve geometric distance.
- [ ] Preserve native movement cost.
- [ ] Refactor movement ledger to spend movement cost rather than assuming raw distance.
- [ ] Keep standard movement behavior unchanged.
- [ ] Integrate native Jump cost.
- [ ] Integrate native Climb cost.
- [ ] Add Fly method policy.
- [ ] Maintain native Flying status where appropriate.
- [ ] Integrate native Teleport path semantics.
- [ ] Integrate native Forced path semantics.
- [ ] Investigate/use Blink correctly.
- [ ] Route Ram forced movement through native/Frame Helm forced method.
- [ ] Route Grapple movement through correct method/context.
- [ ] Preserve elevation movement.
- [ ] Add explicit fall classification.
- [ ] Add fall-distance calculation.
- [ ] Add fall-damage rule adapter.
- [ ] Route fall damage through native `damageCalc(...)`.
- [ ] Feed movement method into Overwatch evaluation.
- [ ] Feed movement method into Disengage suppression.
- [ ] Feed movement method into Hidden lifecycle.
- [ ] Feed movement method into Grapple relationship logic.
- [ ] Refresh Movement UI from canonical movement state.

—

# 75. Smoke Test TODO

Standard:

- [ ] Move exactly Speed.
- [ ] Move less than Speed.
- [ ] Move beyond Speed and trigger Boost behavior.
- [ ] Terrain movement cost.
- [ ] diagonal movement configuration.
- [ ] elevation-only movement.
- [ ] mixed horizontal/elevation movement.

Jump:

- [ ] Jump cost equals native path cost.
- [ ] doubled cost not applied twice.
- [ ] elevation preserved.
- [ ] Boost threshold uses movement cost.

Climb:

- [ ] Climb cost equals native path cost.
- [ ] doubled cost not applied twice.
- [ ] elevation preserved.

Fly:

- [ ] Fly method available only when legal.
- [ ] Flying status maintained correctly.
- [ ] controlled descent does not cause fall damage.
- [ ] elevation movement tracked correctly.

Teleport:

- [ ] method recognized as Teleport.
- [ ] ordinary movement cost remains zero.
- [ ] parent ability range still enforced.
- [ ] terrain does not add ordinary movement cost.
- [ ] movement triggers obey Teleport rules.

Forced:

- [ ] method recognized as Forced.
- [ ] ordinary movement budget unaffected.
- [ ] Ram movement uses Forced.
- [ ] reaction triggers obey forced-movement rules.

Fall:

- [ ] controlled descent does not count as fall.
- [ ] actual fall classification works.
- [ ] fall distance correct.
- [ ] fall damage calculated once.
- [ ] native damage application used.
- [ ] landing elevation correct.

—

# 76. Important Invariants

**Invariant 1**

Movement variants are primarily movement methods/policies, not separate native Flow engines.

**Invariant 2**

Actor Speed remains native authoritative data.

**Invariant 3**

Frame Helm owns the detailed per-turn movement ledger.

**Invariant 4**

Native Foundry/Lancer path measurement should be preferred over raw coordinate arithmetic.

**Invariant 5**

Geometric distance and movement cost are separate concepts.

**Invariant 6**

Jump and Climb use native doubled movement-cost functions.

**Invariant 7**

Teleport is a native movement semantic with zero ordinary movement cost.

**Invariant 8**

Forced movement has a native zero-cost/non-measured movement classification.

**Invariant 9**

Elevation is part of native movement waypoint geometry.

**Invariant 10**

Flying status exists natively, but a complete native Fly movement action was not found.

**Invariant 11**

A reduction in elevation is not automatically a Fall.

**Invariant 12**

No native fall-damage flow was found.

**Invariant 13**

Fall damage should eventually use native `LancerActor.damageCalc(...)` rather than a custom Frame Helm damage engine.

—

# 77. Final Working Model

MOVEMENT
│
├── shared native geometry
│   ├── X
│   ├── Y
│   ├── elevation
│   ├── path
│   ├── terrain
│   └── grid measurement
│
├── STANDARD
│   ├── native Speed
│   └── Frame Helm movement ledger
│
├── JUMP
│   ├── native action `jump`
│   └── native cost = 2 × distance
│
├── CLIMB
│   ├── native action `climb`
│   └── native cost = 2 × distance
│
├── FLY
│   ├── native `flying` status
│   ├── native FlightSystem classification
│   └── Frame Helm movement policy
│
├── TELEPORT
│   ├── native action `teleport`
│   ├── teleport semantic
│   ├── ordinary movement cost = 0
│   └── ability rules remain outside movement path
│
├── BLINK
│   ├── native movement action exists
│   └── exact distinction requires further research
│
├── FORCED
│   ├── native action `forced`
│   ├── measure = false
│   ├── ordinary movement cost = 0
│   └── useful for Ram / forced repositioning
│
└── FALL
    ├── no native Fall action
    ├── no native fall-damage flow
    ├── Frame Helm classifies actual fall
    ├── Frame Helm calculates raw fall consequence
    └── native `damageCalc(...)` applies downstream damage

The critical implementation rule is:

**Frame Helm should own the movement ledger and Lancer-specific movement legality, while native Foundry/Lancer movement-path semantics should remain the preferred source for distance, cost, terrain, method, and elevation whenever available.**
