# Activate
# Action Flow Notes — Activate

## Status

**Native flow located and traced.**

This document records the stock Foundry Lancer system’s execution architecture for item-based **Activate** actions and identifies the intended Frame Conn integration boundary.

The important discovery is that Activate is not merely a chat-card action.

The native Lancer system has a structured item-action execution pipeline built around:

- `LancerItem`
- `ActionData`
- an action dot-path
- `LancerItem.beginActivationFlow(path)`
- `ActivationFlow`
- native flow steps for validation, resource consumption, heat, and chat output
- delegation into other native flows such as `TechAttackFlow`

Frame Conn should preserve and reuse this native execution path wherever possible rather than reimplementing Lancer’s item activation logic.


—

# 1. Native Source Locations

The principal native files involved in the Activate flow are:

    src/module/actor/lancer-actor-sheet.ts
    src/module/helpers/item.ts
    src/module/item/lancer-item.ts
    src/module/flows/activation.ts
    src/module/flows/item-utils.ts

Additional related native systems include:

    TechAttackFlow
    CoreActiveFlow
    ActionData
    ActivationType
    activation-card.hbs


—

# 2. High-Level Native Flow

The stock Lancer execution path is:

    Player clicks an activation-flow UI element
            ↓
    Lancer actor sheet click handler
            ↓
    Read:
      data-uuid
      data-path
            ↓
    Resolve LancerItem
            ↓
    Determine type of activation
            ↓
    Normal item action?
            ↓
    item.beginActivationFlow(path)
            ↓
    ActivationFlow
            ↓
    Resolve ActionData
            ↓
    Run ordered native flow steps
            ↓
    Possibly delegate into another native flow
            ↓
    Mutate authoritative Foundry documents
            ↓
    Produce native Lancer chat output


—

# 3. Native UI Activation Chip

The stock Lancer UI constructs activation controls through:

    buildChipHTML(...)

located in:

    src/module/helpers/item.ts

The generated activation element contains two particularly important pieces of information:

    data-uuid=“...”
    data-path=“...”

These identify:

1. the Foundry/Lancer item being activated;
2. the specific action within that item.

This means the stock Lancer system does not need to infer an activation from its displayed name.

The action is structurally addressable.


—

# 4. Native Sheet Handler

The relevant sheet-side execution begins from an element using the:

    activation-flow

interaction.

The sheet handler reads the element’s:

    data-uuid
    data-path

It resolves the item using the Lancer item API, including:

    LancerItem.fromUuidSync(...)

For an ordinary item action, the sheet ultimately invokes:

    item.beginActivationFlow(path);

This is the important native execution entry point for Frame Conn.


—

# 5. Primary Native Entry Point

The preferred native boundary is:

    LancerItem.beginActivationFlow(path)

Frame Conn should prefer calling this entry point over reproducing the actor-sheet click handler.

Conceptually:

    Frame Conn
        ↓
    resolve authoritative LancerItem
        ↓
    item.beginActivationFlow(actionPath)
        ↓
    stock Lancer execution

This keeps Frame Conn as an alternate command/presentation layer over the existing Lancer system rather than creating a parallel implementation of Lancer’s item rules.


—

# 6. `beginActivationFlow(path)`

The native method is structurally equivalent to:

    async beginActivationFlow(path) {
      if (!path) {
        if (!this.system.actions || this.system.actions.length < 1) {
          ui.notifications.error(
            `Item ${this.id} has no actions, how did you even get here?`
          );
          return;
        }

        path = “system.actions.0”;
      }

      let flow;

      if (
        this.is_frame() &&
        path === “system.core_system”
      ) {
        this.beginCoreActiveFlow(path);
        return;
      } else {
        flow = new ActivationFlow(this, {
          action_path: path
        });
      }

      await flow.begin();

      console.log(“Finished activation flow”);
    }

This establishes two important behaviors.

First, ordinary item actions enter:

    ActivationFlow

Second, a frame’s:

    system.core_system

does **not** use the ordinary Activate flow.

It branches into:

    beginCoreActiveFlow(...)

Therefore Mech Core Powers must remain a separately researched execution category.


—

# 7. `ActivationFlow`

The native class is located in:

    src/module/flows/activation.ts

Its ordered steps are:

    static steps = [
      “initActivationData”,
      “checkItemDestroyed”,
      “checkItemLimited”,
      “checkItemCharged”,
      “applySelfHeat”,
      “updateItemAfterAction”,
      “printActionUseCard”,
    ];

Therefore the normal native pipeline is:

    initActivationData
            ↓
    checkItemDestroyed
            ↓
    checkItemLimited
            ↓
    checkItemCharged
            ↓
    applySelfHeat
            ↓
    updateItemAfterAction
            ↓
    printActionUseCard


—

# 8. Activation Data Initialization

`initActivationData` resolves the particular action from the item using the supplied action path.

The important behavior is equivalent to:

    state.data.action_path =
      options?.action_path ||
      state.data.action_path ||
      “system.actions.0”;

    state.data.action =
      resolveDotpath(
        state.item,
        state.data.action_path
      );

Therefore an executable item activation is effectively identified by:

    Item identity
    +
    Action path

For example:

    item UUID:
    Actor.<actor-id>.Item.<item-id>

    action path:
    system.actions.1

Frame Conn should preserve this information rather than attempting to reconstruct the action later from its display label.


—

# 9. Relevant `ActionData`

The native action representation contains structured mechanical information.

Relevant fields include:

    name
    activation
    cost
    frequency
    init
    trigger
    terse
    detail
    pilot
    mech
    tech_attack
    heat_cost
    synergy_locations
    damage
    range

This is extremely important for future Frame Conn automation.

An item action is not merely:

    name + rules text

A meaningful amount of its mechanical identity already exists as structured native data.


—

# 10. Native Activation Types

Native action data can describe activation categories including:

    None
    Passive
    Quick
    Quick Tech
    Invade
    Full
    Full Tech
    Other
    Reaction
    Protocol
    Free

Therefore generic item activation cannot safely be modeled as exclusively a Full Action.


—

# 11. Architectural Consequence for Frame Conn

Frame Conn currently conceptualizes an action such as:

    full.activate

as a Full Action.

That is useful as an interface category, but it should not become the fundamental execution model.

A mounted system, trait, talent, core bonus, or other actor-owned feature may expose an action whose native activation is:

    Quick
    Full
    Protocol
    Reaction
    Free
    Quick Tech
    Full Tech
    Invade
    Other

Therefore the eventual architecture should distinguish:

    ACTION DISCOVERY

from:

    ACTION CATEGORY PRESENTATION

The shared discovery system finds executable actor-owned actions.

The native `ActionData.activation` value determines where those actions belong in Frame Conn’s action interface.


—

# 12. Native Tech-Attack Delegation

`ActivationFlow` is not merely a terminal execution flow.

During initialization, it checks whether the resolved action represents a tech attack.

Relevant logic is structurally equivalent to:

    if (
      state.data.action.tech_attack ||
      state.data.action.activation == ActivationType.Invade
    ) {
      const tech_flow = new TechAttackFlow(
        state.item,
        {
          title: state.data.title,

          invade:
            state.data.action.activation ==
            ActivationType.Invade,

          attack_type:
            AttackType.Tech,

          action:
            state.data.action,

          effect:
            state.data.action.detail,

          tags: ...
        }
      );

      tech_flow.begin();

      return false;
    }

Therefore:

    beginActivationFlow
            ↓
    ActivationFlow
            ↓
    resolve ActionData
            ↓
    Tech Attack / Invade?
          ↙           ↘
        YES            NO
         ↓              ↓
    TechAttackFlow   Continue ordinary
                     ActivationFlow

Frame Conn should preserve this native delegation.


—

# 13. Destroyed-Item Validation

The native activation pipeline contains:

    checkItemDestroyed

This allows the Lancer system to prevent or otherwise handle activation of an item whose current state makes activation invalid.

Frame Conn should not independently duplicate this validation unless a presentation-level preflight check is useful.

The native flow remains authoritative.


—

# 14. Limited-System Validation

The native flow contains:

    checkItemLimited

The activation’s resource cost can come from the action itself.

The native logic establishes a default cost and then uses the action’s configured cost when available:

    state.data.cost = 1;

    if (state.data.action) {
      state.data.cost =
        state.data.action.cost ?? 1;
    }

The flow can then compare that cost against the item’s remaining Limited uses.

Conceptually:

    if (
      state.item.isLimited() &&
      state.item.system.uses.value <
        state.data.cost
    ) {
      // Native failure handling
    }

This means Frame Conn should **not** independently decrement Limited uses when native activation already owns that behavior.


—

# 15. Charged / Loading / Recharge Handling

The native item utility flow also participates in state associated with things such as:

    Loading
    Limited
    NPC Recharge
    consumable Reserves

The exact behavior depends upon the item’s native type and state.

The architectural rule for Frame Conn should be:

> If native Lancer execution already owns an item’s resource/state transition, Frame Conn delegates that transition to native Lancer rather than duplicating it.


—

# 16. Native Item Mutation

Successful activation can update the item’s authoritative Foundry document.

For Limited uses, the native behavior includes logic equivalent to:

    itemChanges.uses = {
      value: Math.max(
        state.item.system.uses.value -
          state.data.cost,
        0
      )
    };

This is another reason to invoke the native flow rather than merely imitate its visible chat output.


—

# 17. Self Heat

The native flow contains:

    applySelfHeat

An action’s:

    heat_cost

can therefore have actual mechanical consequences.

The native implementation can roll the heat expression and, depending on Lancer automation configuration, mutate the actor’s Heat directly.

Conceptually:

    await state.actor.update({
      “system.heat.value”:
        state.actor.system.heat.value +
        (state.data.overkill_heat ?? 0) +
        self_heat
    });

Therefore Frame Conn should not separately add self heat when native activation has already performed it.


—

# 18. Native Chat Output

Ordinary activation eventually reaches:

    printActionUseCard

The resulting native activation card can contain information such as:

    action title
    activation chip
    action description
    self-heat result
    tags
    actor identity
    system/item identity
    action identity

The stock system therefore retains useful structured identity even at the chat-output boundary.


—

# 19. Current Limits of Native Activate Automation

The native source itself contains TODOs indicating that generic item activation does not automate every possible mechanical consequence.

Examples include concepts such as:

    template placement for grenades
    damage rolling for grenades/mines
    parsing action details into save prompts

Therefore the native architecture is intentionally incomplete for arbitrary rules text.

This produces three broad categories for Frame Conn.


—

# 20. Category A — Fully Native Execution

Some actions may be executable almost entirely through existing native flows.

Frame Conn should:

    collect player intent
            ↓
    resolve target/choice if necessary
            ↓
    invoke native flow
            ↓
    allow native Lancer to finish execution

No Frame Conn mechanical implementation should be added where native Lancer already performs the complete operation.


—

# 21. Category B — Native Execution + Frame Conn Supplemental Automation

Some actions may use native activation for:

    availability validation
    Limited consumption
    Loading state
    Heat
    native action identity
    chat output

but still require additional deterministic mechanical consequences.

For these:

    Frame Conn command
            ↓
    native activation
            ↓
    native execution reaches its existing boundary
            ↓
    Frame Conn supplemental rule adapter
            ↓
    additional deterministic consequence

Examples may eventually include:

    damage
    status application
    status removal
    condition application
    condition removal
    target mutation
    movement consequence
    template placement

These must be researched individually before implementation.


—

# 22. Category C — Native Delegated Flow

Some apparent “Activate” actions actually become another native flow.

Known example:

    Tech Attack / Invade
            ↓
    TechAttackFlow

Frame Conn should allow native Lancer to perform this delegation rather than attempting to determine the entire downstream execution chain itself.


—

# 23. Frame Core Systems Are Separate

The following native path:

    system.core_system

is special.

It branches through:

    beginCoreActiveFlow(...)

and:

    CoreActiveFlow

rather than ordinary:

    ActivationFlow

Therefore:

    Mech Core Powers

remain a separate Action Flow research subject.

Do not implement Core Power execution by assuming it is equivalent to generic Activate.


—

# 24. Relationship to Frame Conn Turn State

A particularly important native TODO exists around action expenditure.

The native Activation flow contains an unresolved concept equivalent to:

    // TODO: deduct action from actor’s action tracker

This means native item activation does not currently own all player-turn economy bookkeeping.

That aligns well with Frame Conn’s architecture.

Frame Conn already owns player-facing Turn planning and expenditure.

Therefore responsibility should remain approximately:

    Frame Conn Turn feature
        owns:
          Quick Action budget
          Full Action budget
          Protocol state
          Reaction state
          Overcharge state
          committed-plan state

    Native Lancer activation
        owns:
          item validity
          item action identity
          item resources
          item state mutation
          self heat
          native delegated flows
          native chat output

The two systems should cooperate rather than duplicate one another.


—

# 25. Proposed Frame Conn Action Identity

A committed actor-owned action should eventually retain enough information to execute the exact native action later.

A conceptual identity might contain:

    {
      sourceType: “lancer-item-action”,

      itemUuid:
        “Actor.<actor>.Item.<item>”,

      actionPath:
        “system.actions.1”,

      actionName:
        “...”,

      activation:
        “Quick”
    }

This is conceptual only.

The exact Frame Conn data contract should be determined during implementation rather than copied blindly from this research document.


—

# 26. Proposed Frame Conn Discovery Flow

The eventual discovery architecture should approximately be:

    Frame Conn actor
            ↓
    inspect actor-owned executable sources
            ↓
    discover native ActionData
            ↓
    read ActionData.activation
            ↓
    classify action
            ↓
    Quick
    Full
    Protocol
    Reaction
    Free
    Quick Tech
    Full Tech
    Invade
    etc.
            ↓
    surface action in appropriate Frame Conn UI

This discovery mechanism may eventually be shared across:

    Mounted Systems
    Mech Traits
    Mech Core Powers
    Pilot Talents
    Manufacturer Core Bonuses

However each source type must first be researched because they may not all expose actions through identical native structures.


—

# 27. Proposed Committed-Plan Flow

Once an item action has been selected and committed:

    Player selects action
            ↓
    Frame Conn records exact native identity
            ↓
    Committed Plan card created
            ↓
    Card exposes execution control
            ↓
    Player clicks execution control
            ↓
    Frame Conn validates current committed-action state
            ↓
    Resolve authoritative actor/item
            ↓
    Resolve required target or choice
            ↓
    Invoke native execution
            ↓
    Native Lancer performs available automation
            ↓
    Frame Conn supplemental adapter runs only
    if required
            ↓
    Committed action marked executed
            ↓
    Turn presentation refreshes


—

# 28. Target Selection

Targeting should occur before execution when the selected action actually requires a target.

The intended Frame Conn interaction is:

    Click execution icon
            ↓
    Does action require target?
            ↓
    YES
            ↓
    Switch Foundry to target-selection interaction
            ↓
    Prompt player to select target
            ↓
    Player targets character
            ↓
    Target resolved
            ↓
    Continue execution

However Frame Conn must not assume every Activate action requires a target.

Target requirements must eventually come from:

    native structured data,
    known action-flow semantics,
    or a Frame Conn rule adapter

depending on what the native system exposes.


—

# 29. Native Adapter Boundary

Frame Conn should eventually expose a dedicated native-system adapter rather than allowing arbitrary UI modules to call Lancer internals directly.

Conceptually:

    UI
     ↓
    Frame Conn action execution
     ↓
    Frame Conn native Lancer adapter
     ↓
    LancerItem.beginActivationFlow(...)
     ↓
    ActivationFlow

This gives us one integration boundary if the Lancer system changes later.

For example:

    executeNativeItemAction({
      actor,
      itemUuid,
      actionPath
    });

could internally resolve the native item and call:

    item.beginActivationFlow(actionPath);

The public Frame Conn feature should depend upon our adapter contract rather than scattering direct native-system calls throughout the UI.


—

# 30. Important Architectural Rule

Frame Conn is an alternate **player-facing command and presentation layer** over the native Lancer system.

Therefore the preferred integration order is:

    Frame Conn UI/button
            ↓
    Frame Conn event handler
            ↓
    Frame Conn action execution service
            ↓
    Frame Conn native-system adapter
            ↓
    native Lancer actor/item entry point
            ↓
    native Lancer Flow
            ↓
    ordered native Flow steps
            ↓
    Foundry document mutations / chat

Do not replace a lower layer merely because Frame Conn presents a different upper layer.


—

# 31. Do Not Reimplement These Without Cause

Based on the traced Activate flow, Frame Conn should not independently recreate:

    LancerItem action resolution
    Destroyed-item checks
    Limited-use checks
    Limited-use consumption
    Loading/charged state handling
    native item mutations
    self-heat rolling
    self-heat application
    native activation chat cards
    TechAttackFlow delegation
    CoreActiveFlow delegation

If supplemental automation becomes necessary, it should be added after identifying exactly where native execution stops.


—

# 32. Do Not Treat Rules Text as Authoritative When Structured Data Exists

Because native `ActionData` already contains fields such as:

    activation
    cost
    tech_attack
    heat_cost
    damage
    range

Frame Conn should prefer native structured information over parsing prose.

Rules-text parsing should be a last resort.

Preferred hierarchy:

    1. Native Lancer structured data

    2. Native Lancer execution flow

    3. Explicit Frame Conn rule adapter

    4. Rules-text interpretation only where unavoidable


—

# 33. Activate and the Wider Action-Flow Project

This research provides an important clue for several other Action Flow investigations.

When researching another action, look for the same architectural chain:

    stock UI control
            ↓
    sheet/event handler
            ↓
    actor/item native method
            ↓
    Flow construction
            ↓
    ordered Flow steps
            ↓
    delegated Flow
            ↓
    Foundry mutations
            ↓
    chat output

In particular, `TechAttackFlow` discovered here should be investigated when researching:

    Generic Quick Tech / Invade
    Lock On
    Scan
    Bolster
    Full Tech

where applicable.


—

# 34. Remaining Activate Research

Before implementation, investigate the following.

- [ ] Determine every native item/source type that can expose `ActionData`.

- [ ] Determine how Mounted Systems expose their actions.

- [ ] Determine how Mech Traits expose actions.

- [ ] Determine how Pilot Talents expose actions.

- [ ] Determine how Manufacturer Core Bonuses expose actions.

- [ ] Determine whether each source uses `beginActivationFlow()` directly.

- [ ] Determine how native Free actions are presented/executed.

- [ ] Determine how native Protocol actions are presented/executed.

- [ ] Determine how native Reaction item actions are presented/executed.

- [ ] Determine how Quick item actions are distinguished from generic Quick Actions.

- [ ] Determine how Full item actions are distinguished from universal Full Actions.

- [ ] Determine how Quick Tech item actions interact with `TechAttackFlow`.

- [ ] Determine how Full Tech item actions interact with native tech flows.

- [ ] Determine exactly how target requirements can be detected before beginning the native flow.

- [ ] Determine whether native flow state exposes targets in a reusable form.

- [ ] Determine whether `damage` and `range` in `ActionData` are sufficient for supplemental Frame Conn automation.

- [ ] Determine how Saves associated with item actions are represented.

- [ ] Determine how status/condition application from item actions is represented.

- [ ] Determine whether any native item activation already mutates target statuses or conditions.

- [ ] Determine how deployables branch from the sheet’s activation handler.

- [ ] Trace `CoreActiveFlow` separately under Mech Core Powers.

- [ ] Trace `TechAttackFlow` fully under the relevant Tech action-flow documents.


—

# 35. Implementation TODO

Implementation should begin only after the current Frame Conn organizational refactor is complete.

The relevant large feature/UI domains should first be decomposed into smaller internal components while preserving their existing authoritative public-facing feature boundaries.

Relevant refactor targets include:

    feature_actions
    feature_movement
    UI_application
    UI_movement
    UI_turn

After that refactor:

- [ ] Add native item-action discovery to the appropriate Frame Conn feature boundary.

- [ ] Keep action discovery independent from UI rendering.

- [ ] Preserve exact native item UUID.

- [ ] Preserve exact native action path.

- [ ] Preserve native activation type.

- [ ] Route discovered actions into the appropriate Frame Conn action category.

- [ ] Add committed-plan execution identity.

- [ ] Add execution control to committed action cards.

- [ ] Resolve the authoritative actor/item at execution time rather than trusting stale cached objects.

- [ ] Add target acquisition when required.

- [ ] Route native execution through a dedicated Frame Conn Lancer-system adapter.

- [ ] Invoke `LancerItem.beginActivationFlow(actionPath)` for ordinary native item actions.

- [ ] Allow native Lancer to delegate into `TechAttackFlow` where appropriate.

- [ ] Do not intercept Core Power execution as generic Activate.

- [ ] Allow native resource/state mutation to complete before supplemental automation.

- [ ] Add supplemental Frame Conn mechanical adapters only where native execution demonstrably stops short of a deterministic mechanical consequence.

- [ ] Automatically apply or remove statuses/conditions when a researched action deterministically requires that consequence and native Lancer does not already do so.

- [ ] Keep Frame Conn’s Turn feature authoritative for Frame Conn’s player-facing action-budget and committed-plan state.

- [ ] Avoid duplicating native Lancer resource consumption.

- [ ] Avoid duplicating native Lancer heat application.

- [ ] Avoid duplicating native Lancer validation.

- [ ] Avoid parsing prose where native structured data provides the required information.

- [ ] Smoke-test native execution from Frame Conn against execution from the stock Lancer character sheet.

- [ ] Verify that identical native actions produce equivalent authoritative document mutations regardless of whether they were initiated from the stock sheet or Frame Conn.


—

# 36. Intended Final Architecture

The long-term target is:

    PLAYER
      ↓
    FRAME CONN
      ↓
    Action discovery
      ↓
    Action planning
      ↓
    Committed Plan
      ↓
    Execute
      ↓
    Target / choice acquisition when required
      ↓
    Native-system adapter
      ↓
    STOCK LANCER ENTRY POINT
      ↓
    STOCK LANCER FLOW
      ↓
    STOCK LANCER FLOW STEPS
      ↓
    Authoritative Foundry mutations
      ↓
    Supplemental Frame Conn automation
    only where necessary
      ↓
    Frame Conn Turn-state reconciliation
      ↓
    Updated player-facing presentation


—

# 37. Core Principle

Frame Conn should not become a second implementation of Lancer.

It should become a better player-facing way to operate the existing implementation.

For Activate specifically, the critical native boundary discovered is:

    LancerItem.beginActivationFlow(actionPath)

and the native execution architecture beneath it is:

    LancerItem.beginActivationFlow(...)
            ↓
    ActivationFlow
            ↓
    initActivationData
            ↓
    native validation
            ↓
    native resource handling
            ↓
    native heat handling
            ↓
    native item mutation
            ↓
    delegated native flow where appropriate
            ↓
    native chat output

Frame Conn should build above and around that execution path rather than replacing it.