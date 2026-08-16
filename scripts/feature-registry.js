/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature-registry.js
 */


/**
 * ============================================================
 * FRAME CONN FEATURE REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Declares the complete application-wide Frame Conn feature
 *   graph.
 *
 * PURPOSE:
 *   Assemble runtime/domain features and executable UI features
 *   into the single canonical Frame Conn feature registry.
 *
 * OWNS:
 *   - Runtime/domain feature imports.
 *   - Executable UI package import.
 *   - Canonical runtime/domain feature declaration.
 *   - Canonical FrameConnFeatureRegistry instance.
 *   - Application-wide feature registration.
 *   - Immediate feature-graph validation.
 *
 * DOES NOT OWN:
 *   - Registry implementation mechanics.
 *   - Feature-contract validation implementation.
 *   - Feature identity lookup implementation.
 *   - Capability lookup implementation.
 *   - Dependency validation implementation.
 *   - Dependency ordering implementation.
 *   - Lifecycle execution implementation.
 *   - Foundry hook installation implementation.
 *   - Registry diagnostics implementation.
 *   - Feature behavior.
 *   - Domain state.
 *   - Gameplay rules.
 *   - UI rendering.
 *   - Executable UI package composition.
 *   - CSS feature registration.
 *   - Stylesheet composition.
 *
 * REGISTRY CORE:
 *
 *   Registry mechanics are owned by:
 *
 *     scripts/feature-registry-core.js
 *
 *   That module answers:
 *
 *     "How does the Frame Conn feature registry work?"
 *
 *   This module answers:
 *
 *     "Which features are part of Frame Conn?"
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   feature-contract.js
 *        │
 *        ▼
 *   feature-registry-core.js
 *        │
 *        │ FrameConnFeatureRegistry
 *        ▼
 *   feature-registry.js
 *        │
 *        ├── runtime/domain feature package
 *        │
 *        └── executable UI feature package
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 *
 * RUNTIME / DOMAIN PACKAGE:
 *
 *   actions-feature.js
 *   sensors-feature.js
 *   turn-feature.js
 *   movement-feature.js
 *   foundry-integration-feature.js
 *   action-execution-feature.js
 *   lifecycle-feature.js
 *   targeting-spatial-feature.js
 *   future *-feature.js
 *        │
 *        ▼
 *   FRAME_CONN_RUNTIME_FEATURES
 *
 *
 * EXECUTABLE UI PACKAGE:
 *
 *   ui-sensors.js
 *   ui-application.js
 *   ui-turn.js
 *   ui-movement.js
 *   future ui-*.js
 *        │
 *        ▼
 *   styles/ui-registry.js
 *        │
 *        ▼
 *   FRAME_CONN_UI_FEATURES
 *
 *
 * APPLICATION-WIDE FEATURE GRAPH:
 *
 *   FRAME_CONN_RUNTIME_FEATURES
 *              │
 *              ├──────────────┐
 *              │              │
 *              ▼              │
 *                             │
 *   FRAME_CONN_UI_FEATURES    │
 *              │              │
 *              └──────┬───────┘
 *                     ▼
 *          frameConnFeatureRegistry
 *                     │
 *                     ▼
 *          runtime-orchestrator.js
 *
 *
 * PARALLEL CSS COMPOSITION:
 *
 *   ui-sensors.css
 *   ui-actions.css
 *   ui-turn.css
 *   ui-movement.css
 *   ui-application.css
 *   future ui-*.css
 *        │
 *        ▼
 *   ui-registry.css
 *        │
 *        ▼
 *   ui-orchestrator.css
 *
 * IMPORTANT:
 *
 *   This file intentionally contains very little registry logic.
 *
 *   Adding a new runtime/domain feature should normally require:
 *
 *     1. Importing the feature definition.
 *     2. Adding it to FRAME_CONN_RUNTIME_FEATURES.
 *
 *   Adding a new executable UI feature should normally require:
 *
 *     1. Registering it in styles/ui-registry.js.
 *
 *   No additional application-wide registry logic should normally
 *   be required.
 *
 * STARTUP CONTRACT:
 *
 *   Registration does NOT:
 *
 *     - install Foundry hooks
 *     - run lifecycle handlers
 *     - initialize the Actions catalog
 *     - register Foundry settings
 *     - configure transitional runtime bindings
 *
 *   scripts/runtime-orchestrator.js remains responsible for those
 *   runtime startup operations.
 *
 * FOUNDRY INTEGRATION CONTRACT:
 *
 *   foundry-integration-feature.js owns:
 *
 *     - Frame Conn module settings
 *     - Frame Conn enabled-state integration
 *     - Token scene-control integration
 *     - getSceneControlButtons hook declaration
 *
 *   It does NOT own the Foundry init or ready startup boundaries.
 *
 *   runtime-orchestrator.js remains responsible for invoking the
 *   feature's registerSettings command during Foundry init and for
 *   installing all registered feature hooks.
 *
 * ACTION EXECUTION CONTRACT:
 *
 *   action-execution-feature.js owns:
 *
 *     - no-roll action classification
 *     - execution-kind resolution
 *     - mech-stat selection
 *     - actor workflow delegation
 *
 *   It does NOT own:
 *
 *     - action registration
 *     - action legality
 *     - Turn action-budget mutation
 *     - Lancer actor workflow implementation
 *     - Application rendering
 *
 *   The Application UI may consume its execution API through
 *   explicit runtime composition.
 */


/* ============================================================
   Imports -- Registry core
   ============================================================ */

import {
  FrameConnFeatureRegistry
} from "./feature-registry-core.js";


/* ============================================================
   Imports -- Runtime/domain features
   ============================================================ */

import {
  frameConnActionsFeature
} from "./feature_actions/actions-feature.js";


import {
  frameConnSensorsFeature
} from "./sensors-feature.js";


import {
  frameConnTurnFeature
} from "./feature_turn/turn-feature.js";


import {
  frameConnMovementFeature
} from "./feature_movement/movement-feature.js";


import {
  frameConnFoundryIntegrationFeature
} from "./foundry-integration-feature.js";


import {
  frameConnActionExecutionFeature
} from "./feature_actions/action-execution-feature.js";


import {
  frameConnLifecycleFeature
} from "./feature_lifecycle/lifecycle-feature.js";


import {
  frameConnTargetingSpatialFeature
} from "./feature_targeting_spatial/targeting-spatial-feature.js";


import {
  frameConnSystemBridgeFeature
} from "./feature_system_bridge/system-bridge-feature.js";


import {
  frameConnSemanticExecutionContextFeature
} from "./feature_semantic_execution_context/semantic-execution-context-feature.js";


import {
  frameConnExecutionTransactionFeature
} from "../system_bridge/execution_transaction/execution-transaction-feature.js";


import {
  frameConnNativeAdapterFeature
} from "../system_bridge/native_adapter/native-adapter-feature.js";


import {
  frameConnBraceFeature
} from "./feature_brace/brace-feature.js";


import {
  frameConnStatusOrchestrationFeature
} from "./feature_status_orchestration/status-orchestration-feature.js";


/* ============================================================
   Imports -- Executable UI package
   ============================================================ */

/**
 * Individual executable UI features remain hidden behind the
 * dedicated executable UI package registry.
 *
 * This file therefore does not directly import:
 *
 *   - ui-sensors.js
 *   - ui-application.js
 *   - ui-turn.js
 *   - ui-movement.js
 *
 * styles/ui-registry.js owns that package declaration.
 */
import {
  FRAME_CONN_UI_FEATURES
} from "../styles/ui-registry.js";


/* ============================================================
   Runtime/domain feature package
   ============================================================ */

/**
 * Canonical runtime/domain feature declaration.
 *
 * This is the primary table which should be updated when a new
 * gameplay/runtime/integration feature is extracted.
 *
 * Dependency-safe runtime ordering does not depend on this array
 * order.
 *
 * FrameConnFeatureRegistry.orderedFeatures() resolves actual
 * dependency order from declared required capabilities.
 */
export const FRAME_CONN_RUNTIME_FEATURES =
  Object.freeze([
    frameConnActionsFeature,
    frameConnSensorsFeature,
    frameConnTurnFeature,
    frameConnMovementFeature,
    frameConnFoundryIntegrationFeature,
    frameConnActionExecutionFeature,
    frameConnLifecycleFeature,
    frameConnTargetingSpatialFeature,
    frameConnSystemBridgeFeature,
    frameConnSemanticExecutionContextFeature,
    frameConnExecutionTransactionFeature,
    frameConnNativeAdapterFeature,
    frameConnBraceFeature,
    frameConnStatusOrchestrationFeature
  ]);


/* ============================================================
   Canonical Frame Conn feature registry
   ============================================================ */

/**
 * Single application-wide Frame Conn feature registry.
 *
 * Registry behavior itself is implemented by:
 *
 *   feature-registry-core.js
 */
export const frameConnFeatureRegistry =
  new FrameConnFeatureRegistry();


/* ============================================================
   Application-wide feature registration
   ============================================================ */

/**
 * Register the complete Frame Conn JavaScript feature graph.
 *
 * Runtime/domain and integration features originate from:
 *
 *   FRAME_CONN_RUNTIME_FEATURES
 *
 * Executable UI features originate from:
 *
 *   FRAME_CONN_UI_FEATURES
 *
 * Required dependencies may cross either package boundary.
 *
 * Current examples include:
 *
 *   turn
 *      │
 *      │ turn.state
 *      ▼
 *   movement
 *
 *
 *   ui-application
 *      │
 *      │ ui.application
 *      ▼
 *   foundry-integration
 *
 *
 *   movement + turn
 *      │
 *      ▼
 *   ui-movement
 *
 *
 *   action-execution
 *
 *     provides:
 *       - action-execution
 *       - action-execution.classification
 *       - action-execution.mech-stat-selection
 *       - action-execution.actor-workflow
 *
 *     optionally consumes:
 *       - actions.registry
 *       - turn.actions
 *
 *     current consumer:
 *       - ui-application through runtime composition
 */
frameConnFeatureRegistry.registerMany([
  ...FRAME_CONN_RUNTIME_FEATURES,
  ...FRAME_CONN_UI_FEATURES
]);


/* ============================================================
   Application-wide feature graph validation
   ============================================================ */

/**
 * Validate the complete declared graph immediately after
 * registration.
 *
 * This verifies:
 *
 *   - feature-contract compliance
 *   - unique feature ids
 *   - unique capability providers
 *   - required dependency availability
 *   - runtime/UI cross-package dependencies
 *   - Movement's turn.state dependency
 *   - Foundry Integration's ui.application dependency
 *   - Action Execution feature registration
 *
 * It does NOT:
 *
 *   - initialize the Actions catalog
 *   - register Foundry settings
 *   - configure runtime bindings
 *   - execute Action Execution workflows
 *   - install hooks
 *   - execute lifecycle phases
 *   - render application UI
 *
 * Those operations remain runtime-orchestrator responsibilities.
 */
frameConnFeatureRegistry
  .validateDependencies();