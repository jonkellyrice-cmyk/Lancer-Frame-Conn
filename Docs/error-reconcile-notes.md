cat > frame-helm-app-errors-and-bridge-reconciliation.md <<‘EOF’
# Lancer Frame Helm — Application Errors and Bridge Reconciliation Report

Repository audited: Lancer-Frame-Helm-main.zip
Audit date: 2026-08-11
Scope: application/runtime source only. dev_scripts/ and backup content are excluded.

## Purpose

This document records app-level errors and reconciliation points that should be treated as authoritative before implementing system_bridge/.

Intended dependency direction:

    Foundry Lancer system
            ↓
    native_adapter
            ↓
    Frame Helm foundational services
            ↓
    system_bridge
            ↓
    existing feature/runtime presentation layers

The bridge must compose existing Frame Helm registry data, actor-owned/native feature data, and supplemental augmentation data.

The bridge must not become a second implementation of the Foundry Lancer rules engine.

—

## 1. Confirmed application errors

### 1.1 execution-transaction.js does not re-export hook constants expected by consumers

Consumers:

    action_economy/action-economy-hooks.js
    resource_service/resource-hooks.js
    semantic_event_bus/semantic-event-hooks.js
    targeting-spatial_service/targeting-spatial-hooks.js

Expected imports:

    EXECUTION_HOOK_PRIORITY
    EXECUTION_HOOK_SOURCE_KIND

Actual owner:

    execution_transaction/execution-transaction-hooks.js

Reconciliation:

    Preferred:
    execution-transaction.js re-exports both constants.

    Avoid:
    having every foundational consumer bypass the package façade.

Bridge rule:

    Consume verified public exports only.
    Do not duplicate execution hook vocabulary inside system_bridge.

—

### 1.2 resource-service.js does not re-export RESOURCE_OPERATION

Consumer:

    lifecycle_service/lifecycle-dispatcher.js

Expected import:

    RESOURCE_OPERATION

Actual owner:

    resource_service/resource-contract.js

Reconciliation:

    resource-service.js should re-export RESOURCE_OPERATION if it is the package public boundary.

Bridge rule:

    RESOURCE_OPERATION remains owned by resource_service.
    system_bridge may reference it but must not define a competing enum.

—

### 1.3 semantic-event-bus.js does not re-export semantic event constants expected by consumers

Consumers include:

    lifecycle_service/lifecycle-hooks.js
    targeting-spatial_service/targeting-spatial-hooks.js

Expected imports include:

    SEMANTIC_EVENT_KIND
    SEMANTIC_EVENT_LISTENER_PRIORITY
    SEMANTIC_EVENT_LISTENER_SOURCE_KIND

These values exist within the semantic event package but are not all exposed through the public semantic-event-bus.js façade expected by its consumers.

Reconciliation:

    semantic-event-bus.js should re-export the stable semantic event vocabulary required by downstream foundational services.

Bridge rule:

    Semantic event vocabulary remains owned by semantic_event_bus.
    system_bridge must reference that vocabulary rather than inventing parallel trigger/event strings.

—

### 1.4 Foundational façades are not yet consistently functioning as true package boundaries

Observed pattern:

    consumer
        ↓
    public façade
        ↓
    expected symbol missing

while the requested symbol exists in a sibling implementation or contract file.

Affected foundational package families include at least:

    execution_transaction
    resource_service
    semantic_event_bus

The existing code is generally written as though the intended package model is:

    outside consumer
        ↓
    package service/façade
        ↓
    package internals

rather than:

    outside consumer
        ↓
    arbitrary package implementation file

Reconciliation:

    Treat service/façade files as the preferred public package boundaries.

    Re-export stable contract vocabulary required by outside consumers through those façades.

    Internal files inside the same package may continue to import sibling implementation files where appropriate.

Bridge rule:

    system_bridge should consume foundational packages through their verified public façades wherever possible.

—

## 2. Audit findings that are not application defects

The repository audit reported more errors than the actual runtime application contains.

A substantial portion originated from:

    dev_scripts/
    dev_scripts/backups/

Those findings are excluded from this report.

Some audit findings also appear to result from repository-audit parsing or feature-ID interpretation rather than broken runtime application imports.

Therefore:

    Do not treat the raw audit error count as the number of Frame Helm runtime defects.

The bridge should be based on verified source relationships, not raw audit totals.

—

## 3. Exact path reconciliation

### 3.1 Targeting/spatial directory naming

Current application path:

    targeting-spatial_service/

This differs from neighboring package naming:

    resource_service/
    lifecycle_service/
    semantic_event_bus/
    actor_owned_feature_registry/

Bridge rule:

    Use targeting-spatial_service/ exactly as it currently exists.

    Do not silently normalize it to targeting_spatial_service/ or targeting-spatial-service/ in imports.

—

### 3.2 Foundational package stack relevant to the bridge

The foundational stack currently includes:

    native_adapter/
    semantic_execution_context/
    execution_transaction/
    resource_service/
    action_economy/
    semantic_event_bus/
    lifecycle_service/
    targeting-spatial_service/
    actor_owned_feature_registry/

The composition layer is:

    system_bridge/

Dependency direction must remain:

    foundational packages
            ↓
       system_bridge

and never:

       system_bridge
            ↓
    foundational package
            ↓
       system_bridge

Lower foundational modules must not import upward into system_bridge.

—

## 4. Native adapter reconciliation

native_adapter is the authoritative Frame Helm boundary around actual Foundry Lancer system behavior.

It exists specifically so higher Frame Helm architecture does not invent or duplicate native Lancer APIs.

The native adapter package established support around areas including:

    native actor access
    native item access
    native resource behavior
    native status behavior
    native rolls
    native combat behavior
    native execution

The exact native Lancer source architecture remains authoritative beneath this layer.

Native behavior should continue to follow the established tracing rule:

    stock Lancer UI/button
        ↓
    native event handler
        ↓
    actor/item native entry point
        ↓
    native flow/workflow construction
        ↓
    ordered flow steps
        ↓
    Foundry document mutation and/or chat output

Bridge rule:

    system_bridge must not call guessed Foundry Lancer APIs directly.

    If native behavior is required, the bridge descriptor should ultimately route execution through the established native adapter/execution infrastructure.

—

## 5. Semantic execution context reconciliation

semantic_execution_context establishes the normalized execution context used by later runtime execution.

Package structure established during foundational work:

    execution-context-contract.js
    execution-context-builder.js
    execution-context.js

Responsibility:

    describe who is acting
    describe what feature/action is being executed
    preserve actor/token/target context
    preserve native references
    preserve execution metadata
    provide normalized execution-time context to downstream services

Bridge relationship:

    system_bridge produces or resolves runtime feature/action information.

    semantic_execution_context turns a selected runtime feature/action into execution context.

The bridge should not duplicate execution-context construction.

Preferred direction:

    registry sources
        ↓
    system_bridge
        ↓
    runtime feature/action descriptor
        ↓
    semantic_execution_context
        ↓
    execution_transaction

—

## 6. Execution transaction reconciliation

Package structure:

    execution-transaction-contract.js
    execution-transaction-runner.js
    execution-transaction-hooks.js
    execution-transaction.js

Responsibility:

    coordinate an execution attempt
    validate execution phases
    run ordered transaction stages
    expose hook points
    allow cancellation/blocking
    preserve execution result state
    coordinate downstream service participation

Important reconciliation:

    EXECUTION_HOOK_PRIORITY
    EXECUTION_HOOK_SOURCE_KIND

are owned within the execution transaction package and should be exposed consistently through its public façade if downstream foundational services import them there.

Bridge rule:

    system_bridge describes execution semantics.

    execution_transaction performs execution orchestration.

The bridge must not become another transaction runner.

—

## 7. Resource service reconciliation

Package structure:

    resource-contract.js
    resource-resolver.js
    resource-transaction.js
    resource-hooks.js
    resource-service.js

Responsibility:

    describe resources
    resolve current resource state
    validate resource availability
    consume resources
    restore/reset resources where appropriate
    integrate resource behavior into execution transactions

Important vocabulary includes:

    RESOURCE_OPERATION

Current reconciliation issue:

    lifecycle_service expects RESOURCE_OPERATION through resource-service.js, but the façade does not currently expose it even though the contract owns it.

Bridge relationship:

    system_bridge may attach resource requirements/descriptors to composed runtime features.

    resource_service remains authoritative for actual resource resolution and mutation.

Bridge must not:

    decrement Limited uses itself
    mutate Loaded state itself
    independently change charges
    create a second resource state model

—

## 8. Action economy reconciliation

Package structure:

    action-economy-contract.js
    action-economy-state.js
    action-economy-transaction.js
    action-economy-hooks.js
    action-economy.js

Responsibility:

    represent turn action economy
    validate action availability
    spend action economy
    reset economy at appropriate turn boundaries
    enforce Protocol timing

Important established Lancer rule:

    A Protocol is a type of free action.

    It must be performed at the start of the character’s turn before any other action.

    It can only be taken once per turn.

The bridge may describe an action as:

    Quick
    Full
    Free
    Protocol
    Reaction
    Movement
    or another supported activation classification

But action_economy remains authoritative for whether the action can actually be spent at the current point in the turn.

Bridge must not duplicate Protocol timing logic.

—

## 9. Semantic event bus reconciliation

Package structure:

    semantic-event-contract.js
    semantic-event-registry.js
    semantic-event-dispatcher.js
    semantic-event-hooks.js
    semantic-event-bus.js

Responsibility:

    define semantic event vocabulary
    register listeners
    dispatch semantic events
    coordinate event-related execution hooks
    provide stable event transport between otherwise decoupled foundational systems

Important reconciliation:

    SEMANTIC_EVENT_KIND
    SEMANTIC_EVENT_LISTENER_PRIORITY
    SEMANTIC_EVENT_LISTENER_SOURCE_KIND

must have one authoritative ownership location and a consistent public export path.

Bridge relationship:

    system_bridge may compose feature trigger descriptors that reference semantic event kinds.

The bridge does not own event transport.

The bridge should not infer event triggers from arbitrary descriptive prose.

For example, prose containing words such as:

    when
    after
    before
    once per round
    whenever

must not automatically become executable event listeners.

Such semantics require explicit native structure or curated augmentation.

—

## 10. Lifecycle service reconciliation

Package structure:

    lifecycle-contract.js
    lifecycle-state.js
    lifecycle-dispatcher.js
    lifecycle-hooks.js
    lifecycle-service.js

Responsibility:

    represent lifecycle timing
    track lifecycle state
    dispatch lifecycle transitions
    connect lifecycle transitions to semantic events and resources
    manage expiration/reset behavior

Lifecycle semantics may include concepts such as:

    turn start
    turn end
    round start
    round end
    scene boundaries
    rest/reset boundaries
    duration expiration

Bridge relationship:

    system_bridge may attach explicit lifecycle descriptors to composed features.

lifecycle_service remains authoritative for actually advancing lifecycle state.

Bridge must not infer lifecycle semantics from prose.

—

## 11. Targeting/spatial service reconciliation

Package structure:

    targeting-spatial-contract.js
    targeting-spatial-query.js
    targeting-spatial-resolver.js
    targeting-spatial-validator.js
    targeting-spatial-hooks.js
    targeting-spatial-service.js

Responsibility:

    represent targeting requirements
    query candidate targets
    resolve target references
    validate spatial legality
    validate targeting legality
    integrate targeting with execution hooks

Actor-owned normalization may preserve structured native evidence such as:

    Range
    Threat
    Sensors

That evidence is not automatically equivalent to a complete targeting rule.

The bridge may supplement missing targeting semantics such as:

    target type
    ally/enemy restriction
    target count
    adjacency requirement
    LOS requirement
    range source
    self-targeting permission

when those semantics are explicitly supplied by trusted augmentation data.

targeting_spatial_service remains authoritative for actual runtime target validation.

Bridge must not implement its own geometry engine.

—

## 12. Actor-owned feature registry reconciliation

Package structure:

    actor-owned-feature-contract.js
    actor-owned-feature-discovery.js
    actor-owned-feature-normalizer.js
    actor-owned-feature-registry.js
    actor-owned-feature-service.js

Responsibility chain:

    native actor/item ownership
        ↓
    discovery candidate
        ↓
    normalized actor-owned feature descriptor
        ↓
    actor-scoped registry
        ↓
    public actor-owned feature service

The actor-owned registry exists to represent actual mechanics/features owned by the current pilot/mech family.

Examples include:

    mech weapons
    pilot weapons
    mech systems
    core systems
    talents
    frame traits
    core bonuses
    NHPs
    other supported actor-owned items/features

Pilot and mech ownership remain distinct even when presented through one linked registry scope.

The registry preserves native provenance.

—

## 13. Actor-owned runtime status reconciliation

Important runtime classifications established by the actor-owned feature layer:

    EXECUTABLE_NATIVE
    PARTIAL_NATIVE
    SEMANTIC_ONLY
    UNKNOWN

Conceptual meaning:

    EXECUTABLE_NATIVE
        Native execution is confirmed and no known supplemental semantic remainder prevents native execution from representing the mechanic.

    PARTIAL_NATIVE
        Some native behavior is executable, but additional semantic behavior remains unimplemented or requires supplementation.

    SEMANTIC_ONLY
        Meaningful rule/effect text exists, but no confirmed executable runtime path exists.

    UNKNOWN
        Structured/native evidence is insufficient to safely classify execution.

A later supplemental/bridge-derived status may exist where Frame Helm itself supplies the missing implementation.

Bridge rule:

    PARTIAL_NATIVE is especially important.

The bridge should supplement the missing portion rather than replacing a valid native execution path.

—

## 14. Actor-owned normalization safety rule

The normalizer intentionally preserves descriptive text without treating it as executable code.

This is essential.

The normalizer may safely preserve structured facts such as:

    native identity
    item identity
    item type
    action activation
    native execution reference
    weapon profile
    Talent rank
    Range
    Threat
    Sensors
    Limited/Loaded/charge evidence

It should not infer complex game rules from descriptive prose.

The bridge’s augmentation system is the correct place to add known missing semantics.

—

## 15. Existing Frame Helm registry reconciliation

The existing Frame Helm registry and actor-owned feature registry are intentionally different sources.

Existing Frame Helm registry:

    declared/global Frame Helm actions
    universal actions
    registry-defined presentation/action information

Actor-owned feature registry:

    actual pilot/mech-owned features
    native item provenance
    actor-specific weapons
    actor-specific systems
    actor-specific talents
    actor-specific traits
    actor-specific NHPs

These should not be collapsed into one foundational registry.

Instead:

    existing Frame Helm registry
            +
    actor-owned feature registry
            +
    augmentation data
            ↓
       system_bridge

This preserves the existing module architecture while allowing missing runtime information to be injected later.

—

## 16. System bridge architectural purpose

The system bridge exists because the current Frame Helm registry does not necessarily contain every field required by the foundational runtime services.

Refactoring every existing registry entry to contain all runtime metadata would unnecessarily couple old presentation/action definitions to the new runtime architecture.

Instead, system_bridge should:

    read existing registry information
    read actor-owned feature information
    identify the selected feature/action
    locate matching augmentation data
    add only missing semantics
    normalize vocabulary where necessary
    compose one coherent runtime descriptor

The bridge therefore acts as:

    adapter
    translator
    supplementer
    composer

It should not act as:

    rules engine
    native execution engine
    resource manager
    targeting engine
    lifecycle engine
    event dispatcher
    action economy manager

—

## 17. Planned system_bridge package

Current/planned files:

    system_bridge/system-bridge-contract.js
    system_bridge/system-bridge-augmentation-registry.js
    system_bridge/system-bridge-resolver.js
    system_bridge/system-bridge-composer.js
    system_bridge/system-bridge.js

Recommended responsibility split:

### system-bridge-contract.js

Own:

    bridge descriptor shapes
    source-kind vocabulary
    augmentation shapes
    composed runtime feature/action shapes
    provenance representation
    merge/composition vocabulary
    bridge result shapes

Must not:

    inspect native Foundry documents
    execute actions
    mutate foundational state

### system-bridge-augmentation-registry.js

Own:

    supplemental runtime metadata registration
    augmentation lookup
    augmentation identity
    feature/action matching metadata
    explicit supplemental trigger/resource/lifecycle/targeting/economy declarations

Purpose:

    supply only information missing from existing registries/native normalization.

### system-bridge-resolver.js

Own:

    locating source registry entry
    locating actor-owned feature/action
    locating matching augmentation
    resolving provenance
    determining which source contributes which semantics

Must not:

    perform execution

### system-bridge-composer.js

Own:

    merging resolved sources
    preserving native authority
    filling missing fields from augmentation
    normalizing source vocabulary into runtime descriptor vocabulary
    producing coherent runtime feature/action descriptors

Must not:

    silently overwrite valid native information with supplemental information

### system-bridge.js

Own:

    public façade
    stable bridge API
    orchestration of resolver + composer + augmentation registry
    bridge diagnostics

Higher runtime layers should prefer importing this façade.

—

## 18. Bridge precedence rules

Recommended authority precedence:

    1. confirmed native execution truth
    2. structured actor-owned/native data
    3. explicit existing Frame Helm registry data
    4. explicit curated augmentation
    5. unknown

However, precedence should be field-specific rather than replacing entire descriptors wholesale.

Example:

    Native weapon attack execution exists.

    Existing registry supplies presentation label/category.

    Actor-owned normalization supplies Range 10.

    Augmentation supplies “enemy target only” and a semantic trigger.

Correct composition:

    native execution        ← native
    presentation            ← existing registry
    range                   ← actor-owned structured data
    target restriction      ← augmentation
    trigger                 ← augmentation

Incorrect composition:

    augmentation replaces the entire weapon descriptor and discards native execution.

—

## 19. Missing-information-only augmentation rule

The bridge’s central invariant should be:

    AUGMENT; DO NOT REIMPLEMENT.

If a source already contains authoritative information, augmentation should normally leave it untouched.

Examples:

    Native execution exists
        → preserve it.

    Native Range exists
        → preserve it.

    Existing registry already declares Quick
        → do not invent another activation.

    Actor-owned resource evidence exists
        → preserve it and let resource_service resolve actual state.

    No explicit lifecycle exists
        → augmentation may provide lifecycle metadata.

This directly supports the original architectural goal:

    avoid refactoring every existing module merely to satisfy the new foundational runtime contracts.

—

## 20. Provenance requirement

Every composed bridge value should ideally retain enough provenance to answer:

    Where did this information come from?

Possible provenance source kinds:

    native
    actor-owned
    existing-registry
    augmentation
    derived

This is valuable for:

    debugging
    diagnostics
    conflict detection
    future migration
    preventing supplemental metadata from accidentally overriding native truth

The bridge contract should therefore preserve source/provenance metadata explicitly.

—

## 21. Conflict handling

If two sources provide contradictory authoritative values, the bridge should not silently guess.

Example:

    existing registry says Quick
    actor-owned structured native action says Full

Possible handling:

    choose higher-authority structured/native value
    record a bridge conflict diagnostic

Do not silently erase evidence of the disagreement.

Bridge result shapes should therefore support:

    warnings
    conflicts
    unresolved fields
    source provenance

—

## 22. Result-shape reconciliation

Across the foundational stack, a consistent architectural pattern has emerged:

    immutable/frozen descriptors
    explicit status/result objects
    stable IDs
    metadata/provenance
    diagnostics rather than silent guessing

system_bridge should continue this pattern.

A composed result should conceptually distinguish:

    resolution success/failure
    resolved source references
    composed runtime descriptor
    augmentation applied
    warnings/conflicts
    unresolved requirements

Do not return a bare untraceable object when composition can partially fail.

—

## 23. Stable identity reconciliation

Bridge matching should prefer stable identifiers.

Preferred matching information includes:

    actor UUID
    item UUID
    item ID
    Lancer LID
    feature ID
    action ID
    profile index
    Talent rank
    explicit registry ID

Avoid relying primarily on:

    display name
    rendered label
    descriptive prose

Names may be used as fallback diagnostics or carefully controlled fallback matching, but should not be the primary identity mechanism when native IDs exist.

—

## 24. Weapon profile reconciliation

Lancer weapons may expose multiple profiles.

The actor-owned layer preserves profile identity/index information.

The bridge must therefore avoid assuming:

    one item = one executable action

Instead, identity may be:

    actor
      + item
      + profile
      + action

Augmentation targeting a weapon profile should be capable of matching the profile specifically rather than augmenting every profile indiscriminately.

—

## 25. Talent rank reconciliation

Talents may contain rank-specific behavior.

The actor-owned layer preserves Talent rank information.

The bridge should allow augmentation to target:

    entire Talent
    specific Talent rank
    specific action within a Talent rank

Do not flatten all Talent rank semantics into one undifferentiated feature when the source provides rank identity.

—

## 26. NHP reconciliation

NHP ownership may be represented by actor-owned feature discovery.

Do not infer:

    cascade
    autopilot
    AI control transfer
    special NHP lifecycle

merely because an owned item is classified as an NHP.

Those semantics require:

    confirmed native behavior
    or explicit augmentation

—

## 27. Protocol reconciliation

Protocol is a semantic activation category that must integrate with action_economy.

The bridge may identify an action as Protocol.

The bridge must not independently decide whether the Protocol is currently legal.

Runtime flow should be:

    bridge descriptor says Protocol
        ↓
    execution context
        ↓
    action_economy validates:
        - start of turn
        - no prior action
        - Protocol not already used
        ↓
    transaction proceeds or blocks

—

## 28. Resource/lifecycle interaction reconciliation

Some resources reset according to lifecycle events.

The foundational packages intentionally separate:

    resource state
    lifecycle timing
    semantic event transport

The bridge may describe the relationship.

It should not collapse these systems together.

Conceptually:

    bridge descriptor
        ↓
    resource declaration
        +
    lifecycle declaration
        ↓
    resource_service + lifecycle_service
        ↓
    semantic_event_bus coordination

This separation should remain intact.

—

## 29. Targeting/execution interaction reconciliation

An action may require a target but have none selected.

Frame Helm’s intended behavior includes prompting for target selection when required.

The bridge should describe target requirements.

targeting_spatial_service should resolve/validate targets.

execution_transaction should coordinate whether execution may proceed.

native_adapter should execute the actual Lancer action once valid context exists.

Preferred flow:

    selected action
        ↓
    bridge runtime descriptor
        ↓
    ExecutionContext
        ↓
    targeting requirement detected
        ↓
    targeting_spatial_service
        ↓
    valid target context
        ↓
    execution_transaction
        ↓
    native_adapter

—

## 30. Native chat/roll preservation

A major Frame Helm requirement is that actions executed from the Helm behave like actions executed from the native character sheet.

Therefore:

    attacks
    rolls
    native actions
    chat cards
    native document mutations

should route through the native execution paths already identified in native_adapter whenever those paths exist.

The bridge should carry the native execution reference forward.

It must not replace native execution with a homemade d20 roll simply because the bridge knows an action is an attack.

—

## 31. Circular dependency reconciliation

The bridge must be architecturally downstream of all foundational services.

Allowed direction:

    native_adapter
        ↓
    foundational packages
        ↓
    actor_owned_feature_registry
        ↓
    system_bridge
        ↓
    higher runtime/presentation composition

Foundational packages should not import:

    system_bridge

system_bridge may import their public façades/contracts as needed.

The actor-owned feature package should not need system_bridge in order to discover or normalize features.

This keeps actor-owned discovery reusable and prevents a registry ↔ bridge cycle.

—

## 32. Existing registry circularity rule

The existing Frame Helm registry should remain independently constructible.

It must not require system_bridge merely to register its existing action definitions.

Instead:

    existing registry builds normally
        ↓
    system_bridge reads it

not:

    existing registry
        ↓
    system_bridge
        ↓
    existing registry

—

## 33. Foundry hook ownership reconciliation

Foundational services contain hook integration modules.

The bridge should not become a dumping ground for Foundry Hooks registrations.

Hook ownership should remain with:

    execution transaction hooks
    resource hooks
    action economy hooks
    semantic event hooks
    lifecycle hooks
    targeting/spatial hooks
    dedicated runtime composition where appropriate

The bridge is primarily composition/resolution, not global event wiring.

—

## 34. Public façade reconciliation before bridge integration

Before final bridge integration, reconcile the public façade export mismatches.

Minimum known façade corrections:

    execution_transaction/execution-transaction.js
        expose EXECUTION_HOOK_PRIORITY
        expose EXECUTION_HOOK_SOURCE_KIND

    resource_service/resource-service.js
        expose RESOURCE_OPERATION

    semantic_event_bus/semantic-event-bus.js
        expose SEMANTIC_EVENT_KIND
        expose SEMANTIC_EVENT_LISTENER_PRIORITY
        expose SEMANTIC_EVENT_LISTENER_SOURCE_KIND

After corrections, rerun repository import/export validation against application files only.

Do not use dev_scripts/backups as runtime dependency evidence.

—

## 35. Bridge implementation checklist

Before system-bridge-contract.js:

    [ ] Preserve exact current repository paths.
    [ ] Treat native_adapter as native Lancer authority.
    [ ] Treat foundational service contracts as runtime authority.
    [ ] Preserve existing Frame Helm registry.
    [ ] Preserve actor-owned feature registry separately.
    [ ] Define explicit augmentation provenance.
    [ ] Define missing-information-only augmentation behavior.
    [ ] Define conflict/warning representation.
    [ ] Preserve native execution references.
    [ ] Preserve actor/item/profile/Talent-rank identity.
    [ ] Avoid prose-derived runtime automation.
    [ ] Avoid upward imports from foundational packages into bridge.

Before system-bridge-augmentation-registry.js:

    [ ] Define stable augmentation IDs.
    [ ] Define feature matching keys.
    [ ] Define action matching keys.
    [ ] Support profile-specific matching.
    [ ] Support Talent-rank-specific matching.
    [ ] Allow targeting supplements.
    [ ] Allow resource supplements.
    [ ] Allow lifecycle supplements.
    [ ] Allow semantic trigger supplements.
    [ ] Allow action-economy supplements.
    [ ] Never overwrite confirmed native execution by default.

Before system-bridge-resolver.js:

    [ ] Resolve existing registry source.
    [ ] Resolve actor-owned source.
    [ ] Resolve augmentation source.
    [ ] Preserve provenance.
    [ ] Detect conflicts.
    [ ] Report unresolved identity.
    [ ] Avoid direct native actor/item inspection.

Before system-bridge-composer.js:

    [ ] Merge field-by-field.
    [ ] Preserve authoritative native fields.
    [ ] Fill absent fields only.
    [ ] Normalize vocabulary into runtime contract.
    [ ] Preserve warnings/conflicts.
    [ ] Produce immutable/frozen output.
    [ ] Preserve native execution routing.

Before system-bridge.js:

    [ ] Expose stable public bridge façade.
    [ ] Hide internal resolver/composer details where appropriate.
    [ ] Provide diagnostics.
    [ ] Provide bridge resolution/composition entry point.
    [ ] Do not execute mechanics directly.
    [ ] Do not install unrelated Foundry hooks.

—

## 36. Reconciliation pass after bridge implementation

After the five bridge files are written:

    1. Run application-only import/export audit.

    2. Verify every bridge import against actual public exports.

    3. Verify no foundational package imports system_bridge.

    4. Verify actor_owned_feature_registry remains independent of system_bridge.

    5. Verify existing Frame Helm registry remains independently constructible.

    6. Verify native execution references survive bridge composition.

    7. Verify augmentation cannot silently replace native execution.

    8. Verify Protocol descriptors route through action_economy.

    9. Verify resource descriptors route through resource_service.

    10. Verify lifecycle descriptors route through lifecycle_service.

    11. Verify trigger descriptors route through semantic_event_bus.

    12. Verify target requirements route through targeting_spatial_service.

    13. Verify actual execution routes through execution_transaction.

    14. Verify native Lancer execution routes through native_adapter.

    15. Verify no descriptive prose is automatically converted into executable behavior.

—

## 37. Architectural summary

The foundational architecture now has a clear separation of concerns:

    native_adapter
        Native Foundry Lancer truth.

    semantic_execution_context
        Runtime execution context.

    execution_transaction
        Ordered execution orchestration.

    resource_service
        Resource authority.

    action_economy
        Turn economy authority.

    semantic_event_bus
        Semantic event transport.

    lifecycle_service
        Duration/reset authority.

    targeting-spatial_service
        Target/spatial legality authority.

    actor_owned_feature_registry
        Actual actor-owned feature discovery and normalized indexing.

    existing Frame Helm registry
        Existing declared/global Helm action information.

    system_bridge
        Composition and supplementation boundary.

The bridge should make these systems coherent without erasing their ownership boundaries.

The central design principle remains:

    Preserve what already exists.
    Preserve native Lancer authority.
    Supplement only what is missing.
    Compose at the bridge.
    Execute through the foundational runtime.

—

## 38. Final bridge invariant

The system bridge exists to answer:

    “Given this Frame Helm action or actor-owned feature, what complete runtime
    description do the foundational services need in order to execute it
    correctly?”

It does not answer:

    “How should Lancer itself implement this rule?”

Native Lancer remains authoritative wherever native execution exists.

Frame Helm augmentation exists only to provide the semantic/runtime information that the native system or existing Frame Helm registry does not already expose in the form required by the new foundational architecture.

EOF