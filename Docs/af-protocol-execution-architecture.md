# Protocol Execution Architecture
cat > docs/af-protocol.md <<‘EOF’
# AF — Protocol

## Status

**Native dedicated Protocol execution flow:** Not found.

**Native dedicated `beginProtocolFlow()`:** Not found.

**Native Protocol activation type:** Found.

**Native Protocol action-tracker state:** Found.

**Native Protocol start-of-turn lockout behavior:** Found.

**Native actor-owned Protocol actions:** Found.

**Native generic item activation executor:** Found.

**Native Protocol action-cost deduction inside ActivationFlow:** Not implemented.

**Native universal Protocol selector/orchestrator:** Not found.

**Frame Helm implementation status:** Frame Helm should own Protocol timing, discovery, legality, action-window closure, source selection, and execution orchestration while delegating actor-owned Protocol mechanics to native `ActivationFlow` where available.

## Purpose

This document records the native Foundry Lancer findings relevant to **Protocol** execution and defines the intended Frame Helm integration boundary.

Repository investigation did not reveal a dedicated executable Protocol flow such as:

`ProtocolFlow`

or:

`beginProtocolFlow()`

Instead, Protocol is represented natively as an **activation timing/type** for actor-owned actions.

Native Lancer already provides:

- `ActivationType.Protocol`;
- `actor.system.action_tracker.protocol`;
- Protocol availability at the start of a turn;
- automatic Protocol lockout when the native action tracker spends an action;
- structured item `ActionData`;
- `item.beginActivationFlow(actionPath)`;
- generic `ActivationFlow`.

Therefore:

> Frame Helm should treat Protocol as a start-of-turn action-selection/orchestration layer.

while:

> Native Lancer should remain authoritative for the actual item/system activation mechanics.

—

# 1. Protocol Is an Activation Category

Protocol is not one universal mechanical effect.

Instead, Protocol is an activation type that actor-owned content can declare.

Conceptually:

Mounted System
or
Core Power
or
other actor-owned action
→ ActionData
→ `activation = Protocol`

Therefore a Frame Helm Protocol surface should primarily answer:

`Which Protocol actions does this actor currently have available?`

and then:

`Execute the selected Protocol through its normal action machinery.`

—

# 2. Native Protocol Flow Search

Repository searching did not identify:

- `ProtocolFlow`
- `beginProtocolFlow()`
- dedicated Protocol flow file
- dedicated Protocol actor executor
- universal Protocol action implementation
- universal Protocol effects engine

Therefore Frame Helm should not invent a native Protocol flow.

—

# 3. Native ActivationType.Protocol

The native action model defines:

`ActivationType.Protocol`

alongside activation types such as:

- Quick;
- Quick Tech;
- Invade;
- Full;
- Full Tech;
- Reaction;
- Free.

Therefore Protocol is a first-class structured activation type.

This is much stronger than rules text parsing.

—

# 4. Structured Protocol Discovery

Where actor-owned content uses native `ActionData`, Frame Helm should discover Protocol actions through:

`action.activation === ActivationType.Protocol`

or the equivalent serialized value:

`”Protocol”`

Conceptually:

actor
→ owned items/features
→ structured actions
→ activation == Protocol
→ expose in Protocol selector

Do not scan descriptions for the word “Protocol” when structured activation metadata exists.

—

# 5. Native ActionData

The native action model contains structured fields including concepts such as:

- activation;
- cost;
- frequency;
- init;
- trigger;
- detail;
- pilot;
- mech;
- tech attack;
- Heat cost;
- synergy locations;
- damage;
- range.

This gives Frame Helm a useful discovery and execution contract.

Protocol actions should preserve the complete native action identity rather than being flattened into display text.

—

# 6. Exact Action Identity

A native item may contain multiple actions.

Therefore Frame Helm must preserve:

- source item;
- item UUID or equivalent identity;
- exact action path;
- action activation type;
- action metadata.

The display name alone is not sufficient.

Conceptually:

Protocol selection
→ source item
→ exact `actionPath`
→ `item.beginActivationFlow(actionPath)`

—

# 7. Native Protocol Action Tracker

The actor action tracker contains:

`actor.system.action_tracker.protocol`

This is a native Protocol-availability primitive.

At turn initialization, Protocol availability is conceptually:

`true`

Therefore the stock system already models:

`Protocol window currently open`

at least at the action-tracker level.

—

# 8. Protocol Starts Open

At the start of the actor’s turn:

`protocol = true`

This matches the tabletop timing concept that Protocol actions must occur before ordinary turn progression closes the opportunity.

Frame Helm’s existing start-of-turn Protocol state should remain aligned with this native concept.

—

# 9. Native Protocol Lockout

The generic native action tracker contains behavior equivalent to:

`when any action is spent`
→ `protocol = false`

This is one of the most important repository findings.

Conceptually:

start turn
→ Protocol available

take ordinary action
→ Protocol disabled

This gives Frame Helm a strong native model to preserve.

—

# 10. Native Lockout Limitation

The stock native action tracker does not automatically reconcile every physical token movement with action-state expenditure.

Therefore native Protocol lockout alone is not sufficient for Frame Helm.

Frame Helm must still close the Protocol window when actual movement occurs.

This is especially important because Frame Helm already tracks real token movement more accurately than the stock system.

—

# 11. Frame Helm Protocol Window

Frame Helm should maintain one canonical concept equivalent to:

`protocol.startOfTurnOpen`

This should become false when the character leaves Protocol timing through relevant turn activity.

Potential causes include:

- ordinary movement;
- Quick Action;
- Full Action;
- Overcharge;
- other action types that leave the start-of-turn Protocol window.

Exact rule timing should remain authoritative.

—

# 12. Native Item Protocol Execution

Actor-owned Protocol actions can be executed through the generic native item activation entry point:

`item.beginActivationFlow(actionPath)`

This constructs:

`ActivationFlow`

Therefore Protocol execution does not need a special native Flow class.

—

# 13. Native ActivationFlow

The generic ActivationFlow handles actor-owned item action execution.

The discovered native responsibilities include concepts such as:

- initialize action data;
- resolve exact action path;
- check item destroyed state;
- check Limited;
- check Charged;
- apply self Heat;
- mutate item/resource state;
- print native activation card.

Frame Helm should preserve this machinery.

—

# 14. Action Path Resolution

ActivationFlow resolves the exact action using a dotpath-style mechanism conceptually equivalent to:

`resolveDotpath(state.item, state.data.action_path)`

This confirms that the native execution contract is:

item
+
exact action path

not:

item name
+
action label.

Frame Helm should preserve that exact identity from discovery through execution.

—

# 15. Native Protocol Action-Cost Limitation

ActivationFlow contains a TODO equivalent to:

`deduct action from actor’s action tracker`

Therefore native ActivationFlow does **not** fully own Protocol action economy.

It performs the mechanical activation but does not reliably spend/close Protocol itself.

This is a critical ownership boundary.

—

# 16. Frame Helm Owns Protocol Expenditure

Frame Helm should therefore own:

- Protocol timing legality;
- Protocol use state;
- closing the Protocol window;
- committed/executed Protocol state.

Then native ActivationFlow owns:

- action-specific mechanical consequences.

Conceptually:

Frame Helm
→ validate Protocol
→ mark Protocol used / window closed

then:

Native
→ execute selected item action

—

# 17. Protocol vs Generic Activate

Protocol is related to generic Activate but differs in timing.

Generic Activate:

→ choose actor-owned action
→ execute according to activation type

Protocol:

→ choose only actions whose activation is Protocol
→ must occur during start-of-turn window
→ execute through the same native activation machinery

Therefore Protocol can reuse much of the generic Activate discovery/execution adapter.

—

# 18. Protocol Is Not a d20 Roll

Protocol itself does not inherently require a roll.

A selected Protocol action may have its own mechanics, but the Protocol selector itself is not an attack.

Therefore the universal Protocol UI should use a non-roll execution/select control.

Conceptually:

`PROTOCOL                                   [choose]`

then:

Protocol action
→ its own appropriate execution behavior

—

# 19. Protocol Selector

The Frame Helm Protocol entry should probably open a selector containing currently legal actor-owned Protocol actions.

Conceptually:

PROTOCOL
→ available Protocol actions:
   - System Action A
   - Core Power Action B
   - Trait Action C
→ choose one
→ execute

This is preferable to pretending Protocol itself is one fixed action.

—

# 20. Protocol Discovery Sources

Potential actor-owned sources may include:

- Mounted Systems;
- Mech Traits;
- Mech Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses;
- other native items/features.

Where those sources expose structured `ActionData`, discovery should filter:

`activation = Protocol`

The exact coverage of each source requires further research.

—

# 21. No Hardcoded Protocol Catalog

Frame Helm should not permanently hardcode a finite list of Protocol actions.

The available Protocol set should be derived from the controlled actor.

This allows arbitrary Lancer content and custom content to participate where it uses native structured action data.

—

# 22. Start-of-Turn Discovery

Protocol actions should only be presented as executable while the Protocol window remains open.

Conceptually:

start turn
→ discover Protocols
→ show available Protocols

window closes
→ disable/hide Protocol execution

The action definitions themselves may remain visible for inspection.

—

# 23. Protocol Legality

Before execution, Frame Helm should validate:

- active turn;
- correct acting actor;
- Protocol window still open;
- source item still exists;
- exact action still exists;
- action activation still equals Protocol;
- source item is not invalid/destroyed where relevant;
- Protocol has not already been consumed if the rules permit only one Protocol action.

The exact number-of-Protocols rule should come from confirmed tabletop rules.

—

# 24. Revalidation at Execution Time

Protocol discovery may occur earlier than execution.

Therefore execution should re-resolve:

- actor;
- item;
- action path;
- activation;
- current Protocol window.

Do not rely solely on stale UI selection state.

—

# 25. Commit vs Execute

If Frame Helm continues to separate committed plans from mechanical execution, Protocol needs special treatment because of start-of-turn timing.

Potential architecture:

select Protocol
→ commit immediately at start of turn
→ mark Protocol window closed
→ execute selected action

Because the Protocol timing window is narrow, allowing a Protocol to sit unexecuted while the actor moves or acts would create illegal state.

Therefore Protocol may need tighter commit/execution coupling than ordinary planned Quick/Full Actions.

—

# 26. Suggested Protocol Commitment Policy

A clean first implementation may be:

player selects Protocol action
→ Frame Helm validates
→ immediately commit/use Protocol
→ immediately launch native ActivationFlow

This avoids a stale committed Protocol surviving after start-of-turn timing is lost.

If Protocol is displayed in the Committed Plan, the card should represent an action already selected for immediate execution.

—

# 27. Movement Closes Protocol Window

Frame Helm Movement should close Protocol timing when the actor physically moves.

Conceptually:

turn starts
→ Protocol open

token begins ordinary voluntary movement
→ Protocol closes

This is required because native action tracker movement accounting does not fully observe all physical movement.

—

# 28. Jump / Climb / Fly Movement

Movement variants that count as movement should also close the Protocol window according to the tabletop rules.

Frame Helm should use the canonical Movement event stream rather than special-case every movement variant in the Protocol feature.

Conceptually:

movement event
→ voluntary movement?
→ close Protocol window

—

# 29. Teleport and Protocol

Whether a Teleport ability used at start of turn closes Protocol timing depends on what action/timing the Teleport uses.

The movement method itself should not decide Protocol legality in isolation.

The parent ability/action context matters.

Do not assume:

teleport movement cost 0
→ Protocol remains open.

—

# 30. Forced Movement and Protocol

Forced movement caused by another effect may not count as the actor voluntarily moving.

Therefore Frame Helm should distinguish voluntary and forced movement before closing the Protocol window.

The exact rules interaction should be confirmed.

—

# 31. Ordinary Actions Close Protocol Window

When the actor takes a normal Quick or Full Action:

→ Protocol window closes

Frame Helm’s central Turn/action legality should enforce this globally.

Protocol should not need to inspect every individual action implementation.

—

# 32. Overcharge and Protocol

Overcharge is a special turn action that likely leaves the start-of-turn Protocol timing.

Frame Helm should explicitly confirm the tabletop timing and then close Protocol appropriately.

The existing Turn state already models Overcharge separately.

—

# 33. Free Actions

Research is needed for whether every Free Action closes Protocol timing or whether some Free Actions are still legal before/alongside Protocol.

Do not infer merely from the native generic `modAction()` behavior if the tabletop rule is more nuanced.

The official Protocol rule should remain authoritative.

—

# 34. Native Action Tracker Synchronization

Frame Helm currently has richer Turn state than the native action tracker.

Therefore Protocol state may need synchronization.

Potential models include:

1. Frame Helm authoritative, native adapted;
2. native tracker authoritative, Frame Helm adapted;
3. explicit reconciliation.

Given physical movement tracking, Frame Helm will likely need to remain authoritative for the player-facing Protocol window.

—

# 35. Do Not Maintain Divergent Protocol States

Avoid this situation:

Frame Helm:
`protocol open = false`

native actor:
`action_tracker.protocol = true`

or the reverse indefinitely.

When practical, Frame Helm should update/reconcile the native tracker so character-sheet state and Frame Helm remain consistent.

The exact mutation strategy should be traced before implementation.

—

# 36. Protocol Resource/Item Mutation

Native ActivationFlow should remain authoritative for item-specific mechanical mutation such as:

- Limited use;
- Charged state;
- self Heat;
- item state;
- native chat output.

Frame Helm should not duplicate these.

—

# 37. Protocol Targeting

Some Protocol actions may:

- require no target;
- target self;
- affect allies;
- create areas;
- activate persistent modes.

Targeting should belong to the selected action’s execution strategy.

The parent Protocol selector should not impose one universal target model.

—

# 38. Protocol and Tech Attacks

A Protocol action could theoretically contain tech-related structured data, but Protocol itself is not automatically a Tech Attack.

Do not route all Protocols through:

`TechAttackFlow`

The selected action’s structured data and native activation behavior determine its mechanics.

—

# 39. Protocol and ActivationFlow Delegation

The preferred native route for ordinary item-owned Protocol actions is:

Frame Helm
→ source item
→ exact action path
→ `item.beginActivationFlow(actionPath)`
→ native `ActivationFlow`

If specific action sources use another native entry point, those should be traced and adapted separately.

—

# 40. Protocol ActionData Preservation

Frame Helm should preserve enough native action metadata for later automation.

Useful fields may include:

- activation;
- trigger;
- detail;
- heat cost;
- tech attack;
- damage;
- range;
- frequency;
- synergy locations.

This could eventually allow more automated Protocol execution while maintaining native source identity.

—

# 41. Protocol Presentation

A useful player-facing Protocol surface could show:

PROTOCOLS — START OF TURN

[ Protocol A ]
source: System X

[ Protocol B ]
source: Core Power Y

Once the Protocol window closes:

PROTOCOLS
`Start-of-turn window closed`

The exact visual design belongs to the UI layer.

—

# 42. Protocol Availability Reason

If a Protocol is no longer legal because the player has moved or acted, Frame Helm should provide a clear reason.

Example:

`Protocols can only be used at the start of your turn before moving or taking other actions.`

Exact wording can be refined later.

—

# 43. Protocol and End Turn

If the player declines to use a Protocol and begins ordinary play, the Protocol opportunity is simply lost for that turn.

Frame Helm should not carry unused Protocol availability into later turns.

Turn initialization resets it appropriately.

—

# 44. Protocol Lifecycle

Conceptually:

start of turn
→ Protocol window open

then one of:

A:
execute Protocol
→ Protocol used
→ window closed

B:
move
→ window closed

C:
take another action
→ window closed

D:
end turn without using Protocol
→ window gone

next turn:
→ Protocol window opens again

This should be represented explicitly in Turn state.

—

# 45. Multiple Protocol Actions Available

An actor may possess more than one Protocol-capable action.

The selector should show all currently legal options.

The rules determine whether:

- only one Protocol may be used;
- multiple may be used if granted;
- special effects override normal timing.

Frame Helm should not assume arbitrary multiple execution without rule support.

—

# 46. Actor-Owned Modifiers

Future content may modify Protocol timing or grant:

- additional Protocol actions;
- Free Protocols;
- special start-of-turn effects;
- actionless automatic Protocols;
- Protocol-triggered bonuses.

Relevant sources include:

- Mounted Systems;
- Mech Traits;
- Mech Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

Structured native action metadata should be preferred.

—

# 47. Protocol Semantic Identity

Protocol is already a native structured activation type.

Therefore Frame Helm does not need to invent a separate action-type vocabulary for ordinary Protocol actions.

Preserve:

`ActivationType.Protocol`

where practical.

—

# 48. Protocol vs Trigger Field

Native ActionData may also contain:

`trigger`

This is separate from:

`activation = Protocol`

A Protocol action may have explanatory/conditional trigger metadata of its own.

Frame Helm should not confuse:

action activation timing

with:

action-specific trigger text.

—

# 49. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- start-of-turn Protocol window;
- Protocol legality;
- movement/action lockout;
- Protocol discovery;
- source selection;
- exact item/action identity;
- Protocol expenditure;
- synchronization/reconciliation with Turn state;
- committed/executed state;
- player-facing selector;
- presentation.

**NATIVE LANCER OWNS:**

- `ActivationType.Protocol`;
- native `ActionData`;
- actor-owned item/action definitions;
- `actor.system.action_tracker.protocol` primitive;
- `item.beginActivationFlow(actionPath)`;
- `ActivationFlow`;
- destroyed/Limited/Charged checks;
- Heat;
- item/resource mutation;
- native activation chat output.

—

# 50. Do Not Invent `ProtocolFlow`

No native `ProtocolFlow` was found.

Frame Helm may implement a Protocol orchestration service, but it should not pretend to call a native Protocol workflow.

The reusable native boundary is:

`ActivationFlow`

for the selected actor-owned action.

—

# 51. Proposed Initial Protocol Flow

START OF TURN
→ Frame Helm opens Protocol window
→ discover actor-owned actions where:
  `activation === Protocol`
→ display legal Protocol choices

Player selects one
→ resolve authoritative actor
→ re-resolve source item
→ re-resolve action path
→ validate activation still Protocol
→ validate Protocol window open
→ mark Protocol consumed / close window
→ synchronize native action tracker if appropriate
→ call:
  `item.beginActivationFlow(actionPath)`
→ native ActivationFlow resolves action
→ await native mutations
→ refresh actor/item state
→ mark Protocol execution complete
→ refresh Frame Helm UI

If instead player moves/acts:
→ close Protocol window
→ Protocol actions become unavailable

—

# 52. Immediate Repository Research TODO

- [ ] Trace `ActivationType.Protocol` completely.
- [ ] Trace current actor `action_tracker.protocol`.
- [ ] Trace turn initialization of Protocol.
- [ ] Trace every native mutation of `action_tracker.protocol`.
- [ ] Trace `modAction(...)` Protocol lockout behavior.
- [ ] Confirm exactly which native action categories close Protocol.
- [ ] Trace `item.beginActivationFlow(actionPath)`.
- [ ] Trace ActivationFlow constructor.
- [ ] Trace exact action-path resolution.
- [ ] Trace full ActivationFlow step list.
- [ ] Confirm TODO around action deduction.
- [ ] Determine whether any Protocol-specific item subclasses bypass ActivationFlow.
- [ ] Search core content for real Protocol action examples.
- [ ] Search Mounted Systems for Protocol examples.
- [ ] Search Core Powers for Protocol examples.
- [ ] Search Traits/Talents/Core Bonuses for Protocol action data.
- [ ] Trace action discovery helpers already used by native sheets.

—

# 53. Rules Research TODO

Before final implementation:

- [ ] Confirm exact Protocol timing wording.
- [ ] Confirm whether movement closes Protocol.
- [ ] Confirm whether every Quick/Full Action closes Protocol.
- [ ] Confirm Overcharge interaction.
- [ ] Confirm Free Action interaction.
- [ ] Confirm Reaction interaction at start of turn.
- [ ] Confirm whether multiple Protocols can normally be used.
- [ ] Confirm whether special features can grant extra Protocols.
- [ ] Confirm interaction with Prepare.
- [ ] Confirm interaction with Start-of-Turn automatic effects.
- [ ] Confirm whether Protocol actions count as ordinary duplicate-action identities where relevant.

—

# 54. Discovery Architecture TODO

- [ ] Define canonical actor-owned action discovery.
- [ ] Preserve source item UUID.
- [ ] Preserve exact action path.
- [ ] Preserve activation type.
- [ ] Preserve action label/detail.
- [ ] Preserve resource/frequency metadata.
- [ ] Filter `activation === Protocol`.
- [ ] Support custom content using native ActionData.
- [ ] Avoid prose parsing where structured action data exists.

—

# 55. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add canonical Protocol window state.
- [ ] Open Protocol window at start of turn.
- [ ] Close Protocol window on legal timing-ending events.
- [ ] Integrate Movement events.
- [ ] Integrate Quick/Full action events.
- [ ] Confirm Overcharge handling.
- [ ] Add actor-owned Protocol discovery.
- [ ] Build Protocol selector.
- [ ] Preserve exact source item/action path.
- [ ] Revalidate at execution.
- [ ] Mark Protocol used exactly once.
- [ ] Synchronize native action tracker where appropriate.
- [ ] Delegate selected action to native ActivationFlow.
- [ ] Await native mutations.
- [ ] Refresh authoritative state.
- [ ] Mark execution complete.
- [ ] Disable Protocol after window closes.
- [ ] Preserve native item/resource handling.
- [ ] Add clear legality reasons.
- [ ] Emit Protocol semantic execution event if useful for Frame Helm trigger architecture.

—

# 56. Smoke Test TODO

- [ ] Protocol window opens at start of turn.
- [ ] actor-owned Protocols discovered.
- [ ] only Protocol activation types displayed.
- [ ] source item/action identity preserved.
- [ ] native ActivationFlow launches.
- [ ] Limited resource consumed correctly.
- [ ] Charged state respected.
- [ ] self Heat applied natively.
- [ ] native chat card prints.
- [ ] Protocol window closes after use.
- [ ] Protocol window closes after standard movement.
- [ ] Protocol window closes after Jump.
- [ ] Protocol window closes after Climb.
- [ ] Protocol window closes after Fly movement.
- [ ] Protocol timing with Teleport verified.
- [ ] forced movement interaction verified.
- [ ] Protocol window closes after Quick Action.
- [ ] Protocol window closes after Full Action.
- [ ] Overcharge interaction verified.
- [ ] Frame Helm/native action tracker stay synchronized.
- [ ] stale item/action selection fails cleanly.
- [ ] custom native ActionData Protocol works.
- [ ] multiple available Protocols display correctly.

—

# 57. Important Invariants

**Invariant 1**

Protocol is a native activation type, not one universal mechanical effect.

**Invariant 2**

No dedicated native `ProtocolFlow` was found.

**Invariant 3**

Native `ActivationType.Protocol` should remain authoritative for structured Protocol discovery.

**Invariant 4**

Native actor state contains `action_tracker.protocol`.

**Invariant 5**

Native action tracking closes Protocol availability when ordinary action state is spent.

**Invariant 6**

Frame Helm must additionally close Protocol timing from actual movement events.

**Invariant 7**

Actor-owned Protocol actions should preserve exact item + action-path identity.

**Invariant 8**

Native `ActivationFlow` should execute ordinary actor-owned Protocol mechanics where available.

**Invariant 9**

ActivationFlow does not currently own complete Protocol action-budget deduction.

**Invariant 10**

Frame Helm owns Protocol timing/action economy; native Lancer owns item-specific mechanical activation.

—

# 58. Final Working Model

PROTOCOL
│
├── native activation type
│   └── `ActivationType.Protocol`
│
├── native availability primitive
│   └── `actor.system.action_tracker.protocol`
│
├── Frame Helm start-of-turn window
│   │
│   ├── opens at turn start
│   ├── closes after Protocol use
│   ├── closes after voluntary movement
│   └── closes after ordinary timing-ending actions
│
├── discovery
│   │
│   └── actor-owned `ActionData`
│       └── `activation === Protocol`
│
├── Frame Helm selection
│   ├── source item
│   ├── exact action path
│   └── legality
│
├── Frame Helm action economy
│   ├── mark Protocol used
│   └── close Protocol window
│
└── Native Lancer execution
    │
    ├── `item.beginActivationFlow(actionPath)`
    └── `ActivationFlow`
        ├── resolve exact action
        ├── destroyed checks
        ├── Limited
        ├── Charged
        ├── self Heat
        ├── item/resource mutation
        └── native chat output

The critical architectural rule is:

**Protocol is a timing-and-selection layer over actor-owned native actions.**

Frame Helm should own the start-of-turn Protocol window and execution orchestration.

Native Lancer should continue to own the selected item’s actual mechanical activation.
EOF