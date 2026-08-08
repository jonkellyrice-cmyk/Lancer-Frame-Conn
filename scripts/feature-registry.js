/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature-registry.js
 */


/**
 * ============================================================
 * FRAME HELM FEATURE REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Declares the complete application-wide Frame Helm feature
 *   graph.
 *
 * PURPOSE:
 *   Assemble runtime/domain features and executable UI features
 *   into the single canonical Frame Helm feature registry.
 *
 * OWNS:
 *   - Runtime/domain feature imports.
 *   - Executable UI package import.
 *   - Canonical runtime/domain feature declaration.
 *   - Canonical FrameHelmFeatureRegistry instance.
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
 *     "How does the Frame Helm feature registry work?"
 *
 *   This module answers:
 *
 *     "Which features are part of Frame Helm?"
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   feature-contract.js
 *        │
 *        ▼
 *   feature-registry-core.js
 *        │
 *        │ FrameHelmFeatureRegistry
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
 *   future *-feature.js
 *        │
 *        ▼
 *   FRAME_HELM_RUNTIME_FEATURES
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
 *   FRAME_HELM_UI_FEATURES
 *
 *
 * APPLICATION-WIDE FEATURE GRAPH:
 *
 *   FRAME_HELM_RUNTIME_FEATURES
 *              │
 *              ├──────────────┐
 *              │              │
 *              ▼              │
 *                             │
 *   FRAME_HELM_UI_FEATURES    │
 *              │              │
 *              └──────┬───────┘
 *                     ▼
 *          frameHelmFeatureRegistry
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
 *     2. Adding it to FRAME_HELM_RUNTIME_FEATURES.
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
 *     - configure transitional runtime bindings
 *
 *   scripts/runtime-orchestrator.js remains responsible for those
 *   runtime startup operations.
 */


/* ============================================================
   Imports -- Registry core
   ============================================================ */

import {
  FrameHelmFeatureRegistry
} from "./feature-registry-core.js";


/* ============================================================
   Imports -- Runtime/domain features
   ============================================================ */

import {
  frameHelmActionsFeature
} from "./actions-feature.js";


import {
  frameHelmSensorsFeature
} from "./sensors-feature.js";


import {
  frameHelmTurnFeature
} from "./turn-feature.js";


import {
  frameHelmMovementFeature
} from "./movement-feature.js";


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
  FRAME_HELM_UI_FEATURES
} from "../styles/ui-registry.js";


/* ============================================================
   Runtime/domain feature package
   ============================================================ */

/**
 * Canonical runtime/domain feature declaration.
 *
 * This is the primary table which should be updated when a new
 * gameplay/runtime feature is extracted.
 *
 * Dependency-safe runtime ordering does not depend on this array
 * order.
 *
 * FrameHelmFeatureRegistry.orderedFeatures() resolves actual
 * dependency order from declared required capabilities.
 */
export const FRAME_HELM_RUNTIME_FEATURES =
  Object.freeze([
    frameHelmActionsFeature,
    frameHelmSensorsFeature,
    frameHelmTurnFeature,
    frameHelmMovementFeature
  ]);


/* ============================================================
   Canonical Frame Helm feature registry
   ============================================================ */

/**
 * Single application-wide Frame Helm feature registry.
 *
 * Registry behavior itself is implemented by:
 *
 *   feature-registry-core.js
 */
export const frameHelmFeatureRegistry =
  new FrameHelmFeatureRegistry();


/* ============================================================
   Application-wide feature registration
   ============================================================ */

/**
 * Register the complete Frame Helm JavaScript feature graph.
 *
 * Runtime/domain features originate from:
 *
 *   FRAME_HELM_RUNTIME_FEATURES
 *
 * Executable UI features originate from:
 *
 *   FRAME_HELM_UI_FEATURES
 *
 * Required dependencies may cross either package boundary.
 */
frameHelmFeatureRegistry.registerMany([
  ...FRAME_HELM_RUNTIME_FEATURES,
  ...FRAME_HELM_UI_FEATURES
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
 *
 * It does NOT:
 *
 *   - initialize the Actions catalog
 *   - configure runtime bindings
 *   - install hooks
 *   - execute lifecycle phases
 *   - render application UI
 *
 * Those operations remain runtime-orchestrator responsibilities.
 */
frameHelmFeatureRegistry
  .validateDependencies();