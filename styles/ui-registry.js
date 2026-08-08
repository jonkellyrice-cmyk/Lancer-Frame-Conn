/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-registry.js
 */


/**
 * ============================================================
 * FRAME HELM EXECUTABLE UI REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Provides the canonical declaration boundary for executable
 *   Frame Helm UI feature modules.
 *
 * PURPOSE:
 *   Collect independently-owned executable UI behavior into one
 *   stable feature package which is then registered through the
 *   canonical Frame Helm feature registry.
 *
 * OWNS:
 *   - Executable UI feature imports.
 *   - UI feature adapters where a presentation module does not
 *     itself declare a Frame Helm feature.
 *   - Canonical executable UI feature declaration order.
 *   - Executable UI feature-set export.
 *   - Lightweight UI package inspection.
 *
 * DOES NOT OWN:
 *   - Global feature registration.
 *   - Feature-contract validation policy.
 *   - Capability ownership enforcement.
 *   - Dependency validation.
 *   - Dependency ordering.
 *   - Feature lifecycle execution.
 *   - Foundry hook installation.
 *   - Application startup.
 *   - Runtime orchestration.
 *   - CSS loading.
 *   - CSS cascade ordering.
 *   - Stylesheet composition.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   Executable UI:
 *
 *     ui-sensors.js
 *     ui-application.js
 *     ui-turn.js
 *     ui-movement.js
 *     future ui-*.js
 *          │
 *          ▼
 *     ui-registry.js
 *          │
 *          ▼
 *     ../scripts/feature-registry.js
 *          │
 *          ▼
 *     ../scripts/runtime-orchestrator.js
 *
 *
 *   Stylesheets remain a parallel composition graph:
 *
 *     ui-sensors.css
 *     ui-application.css
 *     ui-turn.css
 *     ui-movement.css
 *     future ui-*.css
 *          │
 *          ▼
 *     ui-registry.css
 *          │
 *          ▼
 *     ui-orchestrator.css
 *
 * IMPORTANT:
 *
 *   ui-registry.js is NOT a second FrameHelmFeatureRegistry.
 *
 *   It is the registration/declaration boundary for the
 *   executable UI package.
 *
 *   The authoritative feature registry remains:
 *
 *     scripts/feature-registry.js
 *
 *   That registry imports FRAME_HELM_UI_FEATURES and performs the
 *   actual application-wide registration.
 *
 * UI FEATURE FORMS:
 *
 *   Executable UI modules may participate in one of two ways:
 *
 *   1. SELF-DECLARING FEATURE
 *
 *      The module exports a complete feature produced through:
 *
 *        defineFrameHelmFeature(...)
 *
 *      Examples:
 *
 *        ui-application.js
 *        ui-turn.js
 *        ui-movement.js
 *
 *
 *   2. PRESENTATION MODULE + REGISTRY ADAPTER
 *
 *      The module exports focused presentation functions and this
 *      registry wraps them in a Frame Helm feature declaration.
 *
 *      Example:
 *
 *        ui-sensors.js
 *
 *      This is appropriate when the implementation module should
 *      remain narrowly concerned with presentation mechanics.
 *
 * REGISTRATION CONTRACT:
 *
 *   Importing this file does NOT:
 *
 *     - install Foundry hooks
 *     - run lifecycle handlers
 *     - render UI
 *     - initialize gameplay state
 *
 *   It constructs and exports feature definitions only.
 *
 *   Actual registration occurs when:
 *
 *     scripts/feature-registry.js
 *
 *   passes FRAME_HELM_UI_FEATURES to:
 *
 *     frameHelmFeatureRegistry.registerMany(...)
 */


/* ============================================================
   Imports -- Feature contract
   ============================================================ */

import {
  defineFrameHelmFeature
} from "../scripts/feature-contract.js";


/* ============================================================
   Imports -- Sensor UI presentation
   ============================================================ */

import {
  renderFrameHelmSensorContacts,
  destroyFrameHelmSensorContacts,
  getFrameHelmSensorLayer,
  getFrameHelmSensorVisualConfiguration
} from "./ui-sensors.js";


/* ============================================================
   Imports -- Self-declaring UI features
   ============================================================ */

import {
  frameHelmApplicationUiFeature
} from "./ui-application.js";


import {
  frameHelmTurnUiFeature
} from "./ui-turn.js";


import {
  frameHelmMovementUiFeature
} from "./ui-movement.js";


/* ============================================================
   Sensor UI feature adapter
   ============================================================ */

/**
 * ui-sensors.js deliberately owns only PIXI/canvas presentation.
 *
 * Its feature declaration lives here so the implementation module
 * does not also need to know about application-wide feature
 * composition.
 *
 * Runtime sensor qualification and contact generation remain
 * owned by:
 *
 *   scripts/sensors-feature.js
 */
export const frameHelmSensorsUiFeature =
  defineFrameHelmFeature({
    id:
      "ui-sensors",

    domain:
      "ui.sensors",

    provides: [
      "ui.sensors",
      "ui.sensors.rendering",
      "ui.sensors.layer",
      "ui.sensors.visual-configuration"
    ],

    /**
     * Sensor UI consumes already-qualified contacts.
     *
     * It does not calculate which tokens qualify as contacts.
     */
    dependsOn: [
      "sensors.contacts"
    ],

    optionalDependsOn: [],

    state: {},

    commands: {
      render:
        renderFrameHelmSensorContacts,

      destroy:
        destroyFrameHelmSensorContacts
    },

    queries: {
      getLayer:
        getFrameHelmSensorLayer,

      getVisualConfiguration:
        getFrameHelmSensorVisualConfiguration
    },

    /**
     * Foundry sensor refresh policy remains owned by the runtime
     * Sensors feature.
     *
     * ui-sensors.js therefore declares no Foundry hooks itself.
     */
    hooks: {},

    lifecycle: {},

    api: {
      render:
        renderFrameHelmSensorContacts,

      destroy:
        destroyFrameHelmSensorContacts,

      getLayer:
        getFrameHelmSensorLayer,

      getVisualConfiguration:
        getFrameHelmSensorVisualConfiguration
    },

    metadata: {
      label:
        "Sensor Canvas UI",

      description:
        "Owns executable PIXI/canvas presentation for qualified Frame Helm sensor contacts.",

      implementationModule:
        "styles/ui-sensors.js",

      companionStylesheet:
        "styles/ui-sensors.css",

      runtimeDomain:
        "scripts/sensors-feature.js",

      compositionRegistry:
        "styles/ui-registry.js",

      extractionModel:
        "presentation-module-with-ui-registry-adapter"
    }
  });


/* ============================================================
   Canonical executable UI feature set
   ============================================================ */

/**
 * Canonical declaration of executable Frame Helm UI features.
 *
 * This list answers:
 *
 *   "Which executable UI features are part of Frame Helm?"
 *
 * It does NOT answer:
 *
 *   "In what runtime order should they execute?"
 *
 * Dependency-safe execution order remains the responsibility of:
 *
 *   scripts/feature-registry.js
 *
 * through each feature's declared capabilities.
 *
 *
 * CURRENT UI FEATURE GRAPH:
 *
 *   UI Sensors
 *
 *     ui-sensors.js
 *          ↓
 *     ui-sensors feature adapter
 *
 *
 *   Application UI
 *
 *     ui-application.js
 *          ↓
 *     frameHelmApplicationUiFeature
 *
 *
 *   Turn UI
 *
 *     ui-turn.js
 *          ↓
 *     frameHelmTurnUiFeature
 *
 *
 *   Movement UI
 *
 *     ui-movement.js
 *          ↓
 *     frameHelmMovementUiFeature
 *
 *     required runtime capabilities:
 *
 *       - movement
 *       - movement.tracking
 *       - turn.state
 *
 *     The turn.state requirement is transitional because the
 *     authoritative movement-accounting object still currently
 *     resides on FrameHelmTurnState.
 *
 *
 * Future executable UI features should be added here.
 */
export const FRAME_HELM_UI_FEATURES =
  Object.freeze([
    frameHelmSensorsUiFeature,
    frameHelmApplicationUiFeature,
    frameHelmTurnUiFeature,
    frameHelmMovementUiFeature
  ]);


/* ============================================================
   UI feature identity index
   ============================================================ */

/**
 * Package-local feature-id index.
 *
 * This is an inspection convenience only.
 *
 * Canonical application-wide feature lookup remains owned by:
 *
 *   frameHelmFeatureRegistry
 */
const FRAME_HELM_UI_FEATURES_BY_ID =
  new Map(
    FRAME_HELM_UI_FEATURES.map(
      feature => [
        feature.id,
        feature
      ]
    )
  );


/* ============================================================
   UI registry queries -- List
   ============================================================ */

/**
 * Returns all declared executable UI features.
 *
 * Returns a new array so callers cannot mutate the canonical
 * declaration.
 */
export function listFrameHelmUiFeatures() {
  return [
    ...FRAME_HELM_UI_FEATURES
  ];
}


/* ============================================================
   UI registry queries -- IDs
   ============================================================ */

/**
 * Returns all declared executable UI feature ids.
 */
export function listFrameHelmUiFeatureIds() {
  return (
    FRAME_HELM_UI_FEATURES.map(
      feature =>
        feature.id
    )
  );
}


/* ============================================================
   UI registry queries -- Presence
   ============================================================ */

/**
 * Returns whether the executable UI package declares the supplied
 * feature id.
 */
export function hasFrameHelmUiFeature(
  featureId
) {
  const normalizedId =
    String(
      featureId ??
      ""
    ).trim();


  if (
    !normalizedId
  ) {
    return false;
  }


  return (
    FRAME_HELM_UI_FEATURES_BY_ID.has(
      normalizedId
    )
  );
}


/* ============================================================
   UI registry queries -- Feature lookup
   ============================================================ */

/**
 * Returns one executable UI feature definition.
 *
 * Runtime consumers should normally use:
 *
 *   frameHelmFeatureRegistry.get(...)
 *
 * instead.
 *
 * This lookup exists primarily for package inspection,
 * diagnostics, and development tooling.
 */
export function getFrameHelmUiFeature(
  featureId
) {
  const normalizedId =
    String(
      featureId ??
      ""
    ).trim();


  if (
    !normalizedId
  ) {
    return null;
  }


  return (
    FRAME_HELM_UI_FEATURES_BY_ID.get(
      normalizedId
    ) ??
    null
  );
}


/* ============================================================
   UI registry diagnostics
   ============================================================ */

/**
 * Returns a serializable description of the executable UI package.
 *
 * Runtime lifecycle state is intentionally omitted because it
 * belongs to scripts/feature-registry.js.
 */
export function snapshotFrameHelmUiRegistry() {
  return {
    featureCount:
      FRAME_HELM_UI_FEATURES.length,

    featureIds:
      listFrameHelmUiFeatureIds(),

    features:
      FRAME_HELM_UI_FEATURES.map(
        feature => {
          return {
            id:
              feature.id,

            domain:
              feature.domain,

            provides: [
              ...feature.provides
            ],

            dependsOn: [
              ...feature.dependsOn
            ],

            optionalDependsOn: [
              ...feature
                .optionalDependsOn
            ],

            label:
              feature.metadata
                ?.label ??
              feature.id,

            implementationModule:
              feature.metadata
                ?.implementationModule ??
              null,

            domainFeature:
              feature.metadata
                ?.domainFeature ??
              null,

            transitionalStateFeature:
              feature.metadata
                ?.transitionalStateFeature ??
              null,

            companionStylesheet:
              feature.metadata
                ?.companionStylesheet ??
              null
          };
        }
      )
  };
}


/* ============================================================
   Canonical UI registry surface
   ============================================================ */

/**
 * Compact public surface for executable UI-package inspection.
 *
 * IMPORTANT:
 *
 * This is intentionally not mutable and intentionally does not
 * contain registration/lifecycle methods.
 *
 * Those operations belong to:
 *
 *   scripts/feature-registry.js
 */
export const frameHelmUiRegistry =
  Object.freeze({
    features:
      FRAME_HELM_UI_FEATURES,

    list:
      listFrameHelmUiFeatures,

    ids:
      listFrameHelmUiFeatureIds,

    has:
      hasFrameHelmUiFeature,

    get:
      getFrameHelmUiFeature,

    snapshot:
      snapshotFrameHelmUiRegistry
  });