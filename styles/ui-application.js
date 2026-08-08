/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-application.js
 */

/**
 * ============================================================
 * FRAME HELM UI FEATURE -- APPLICATION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's primary Foundry Application UI surface and
 *   application-window lifecycle.
 *
 * PURPOSE:
 *   Remove application presentation ownership from
 *   runtime-orchestrator.js while preserving the runtime
 *   orchestrator as the composition root for gameplay/runtime
 *   domains.
 *
 * RESPONSIBILITIES:
 *   - Own the FrameHelmApplication class.
 *   - Own the canonical Frame Helm application instance.
 *   - Lazily construct the Frame Helm application.
 *   - Open and close the Frame Helm application.
 *   - Re-render the application when requested.
 *   - Expose the currently-displayed/controlled token.
 *   - Own application-specific reactions to token-control changes.
 *   - Own application-specific reactions to token deletion.
 *   - Provide application state/diagnostic queries.
 *
 * DOES NOT OWN:
 *   - Action registry implementation.
 *   - Action declarations.
 *   - Turn-state implementation.
 *   - Turn legality.
 *   - Movement accounting.
 *   - Dragged-token movement tracking.
 *   - Elevation movement tracking.
 *   - Combat synchronization.
 *   - Universal action execution.
 *   - Actor telemetry synchronization.
 *   - Sensor-contact rendering.
 *   - Sensor calculations.
 *   - Module settings.
 *   - Scene-control registration.
 *   - Runtime stylesheet installation.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   feature-contract.js
 *        │
 *        ▼
 *   ui-application.js
 *        │
 *        ├── owns FrameHelmApplication
 *        ├── owns application instance
 *        ├── owns open/close/render
 *        ├── exposes displayed token
 *        └── reacts to application-specific Foundry UI hooks
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 * UI STYLING:
 *
 *   DOM presentation belonging specifically to this application
 *   feature belongs in:
 *
 *     styles/ui-application.css
 *
 *   Cross-feature/application-level stylesheet composition remains
 *   owned by:
 *
 *     styles/ui-orchestrator.css
 *
 * TRANSITIONAL COMPOSITION CONTRACT:
 *
 *   The existing FrameHelmApplication class currently reaches
 *   into several domains which have not yet been extracted.
 *
 *   To avoid moving those domains into the UI feature merely
 *   because the Application class needs them, this module exposes
 *   an explicit runtime-binding surface.
 *
 *   runtime-orchestrator.js may configure those bindings after
 *   resolving the appropriate feature APIs.
 *
 *   As Turn, Movement, Telemetry, Execution, and other domains are
 *   extracted, those bindings can progressively resolve through
 *   the feature registry instead.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - ui.application
 *     - ui.application.lifecycle
 *     - ui.application.rendering
 *     - ui.application.token
 *
 *   Required dependencies:
 *     - actions.registry
 *
 *   Optional dependencies:
 *     - sensors.refresh
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership and composition only.
 *
 *   Existing FrameHelmApplication behavior should remain unchanged.
 */


import {
  defineFrameHelmFeature
} from "../scripts/feature-contract.js";


/* ============================================================
   Application feature identity
   ============================================================ */

const MODULE_ID =
  "lancer-frame-helm";

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ============================================================
   Application runtime bindings
   ============================================================ */

/**
 * Explicit transitional bridge between the Application UI and
 * runtime domains which have not yet been independently extracted.
 *
 * IMPORTANT:
 *
 * These are dependencies OF the Application.
 *
 * Their implementations do not belong to this module.
 *
 * The runtime orchestrator should configure them during startup.
 */
const frameHelmApplicationRuntimeBindings = {
  getActionRegistry:
    null,

  getTurnState:
    null,

  getTurnStateManager:
    null,

  executeActionRoll:
    null,

  refreshTelemetry:
    null
};


/**
 * Replaces one or more transitional runtime bindings.
 *
 * Unknown keys are rejected so this object cannot silently become
 * an unstructured service container.
 */
function configureFrameHelmApplicationRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm application runtime bindings must be supplied as an object."
    );
  }

  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmApplicationRuntimeBindings
      )
    );

  for (
    const [
      key,
      value
    ]
    of Object.entries(
      bindings
    )
  ) {
    if (
      !allowedKeys.has(
        key
      )
    ) {
      throw new Error(
        `Frame Helm application received unknown runtime binding: ${key}`
      );
    }

    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm application runtime binding "${key}" must be a function or null.`
      );
    }

    frameHelmApplicationRuntimeBindings[
      key
    ] = value;
  }

  return (
    getFrameHelmApplicationRuntimeBindings()
  );
}


/**
 * Returns a read-only diagnostic snapshot of available bindings.
 *
 * Functions themselves remain private implementation details.
 */
function getFrameHelmApplicationRuntimeBindings() {
  return Object.freeze({
    actionRegistry:
      typeof frameHelmApplicationRuntimeBindings
        .getActionRegistry ===
        "function",

    turnState:
      typeof frameHelmApplicationRuntimeBindings
        .getTurnState ===
        "function",

    turnStateManager:
      typeof frameHelmApplicationRuntimeBindings
        .getTurnStateManager ===
        "function",

    actionExecution:
      typeof frameHelmApplicationRuntimeBindings
        .executeActionRoll ===
        "function",

    telemetryRefresh:
      typeof frameHelmApplicationRuntimeBindings
        .refreshTelemetry ===
        "function"
  });
}


/* ============================================================
   Application dependency accessors
   ============================================================ */

/**
 * Returns the canonical action registry supplied by the Actions
 * feature/runtime composition graph.
 */
function getFrameHelmApplicationActionRegistry() {
  const registry =
    frameHelmApplicationRuntimeBindings
      .getActionRegistry?.();

  if (!registry) {
    throw new Error(
      "Frame Helm application could not resolve the Actions registry."
    );
  }

  return registry;
}


/**
 * Returns the current turn-state object when one exists.
 */
function getFrameHelmApplicationTurnState() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnState?.() ??
    null
  );
}


/**
 * Returns the turn-state manager when configured.
 */
function getFrameHelmApplicationTurnStateManager() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnStateManager?.() ??
    null
  );
}


/**
 * Delegates an action roll/workflow to its owning runtime domain.
 */
async function executeFrameHelmApplicationActionRoll(
  actor,
  action
) {
  const executor =
    frameHelmApplicationRuntimeBindings
      .executeActionRoll;

  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Helm application action execution has not been configured."
    );
  }

  return executor(
    actor,
    action
  );
}


/* ============================================================
   Frame Helm Application
   ============================================================ */

/**
 * MOVE THE EXISTING FrameHelmApplication CLASS HERE VERBATIM.
 *
 * Do not rewrite its rendering behavior during this extraction.
 *
 * The only substitutions that should be made where necessary are
 * ownership-boundary substitutions:
 *
 *
 * OLD:
 *
 *   frameHelmActionRegistry
 *
 * NEW:
 *
 *   getFrameHelmApplicationActionRegistry()
 *
 *
 * OLD:
 *
 *   frameHelmTurnState.current
 *
 * NEW:
 *
 *   getFrameHelmApplicationTurnState()
 *
 *
 * OLD:
 *
 *   frameHelmTurnState
 *
 * NEW:
 *
 *   getFrameHelmApplicationTurnStateManager()
 *
 *
 * OLD:
 *
 *   frameHelmExecuteActionRoll(
 *     actor,
 *     action
 *   )
 *
 * NEW:
 *
 *   executeFrameHelmApplicationActionRoll(
 *     actor,
 *     action
 *   )
 *
 *
 * Apart from dependency access, preserve the existing class
 * implementation exactly during this pass.
 */


/*
export class FrameHelmApplication
  extends Application {

  [MOVE CURRENT CLASS BODY HERE]

}
*/


/* ============================================================
   Canonical application instance
   ============================================================ */

/**
 * The Frame Helm application is lazily constructed.
 *
 * This preserves the existing runtime behavior while moving
 * instance ownership out of runtime-orchestrator.js.
 */
let frameHelmApplication =
  null;


/* ============================================================
   Application construction
   ============================================================ */

/**
 * Returns the canonical Frame Helm Application instance,
 * constructing it on first access.
 */
function getFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    frameHelmApplication =
      new FrameHelmApplication();
  }

  return (
    frameHelmApplication
  );
}


/**
 * Returns the existing instance without constructing one.
 *
 * Useful for event handlers that should not create the interface
 * merely because Foundry emitted an unrelated hook.
 */
function peekFrameHelmApplication() {
  return (
    frameHelmApplication
  );
}


/* ============================================================
   Application visibility
   ============================================================ */

/**
 * Returns whether the Frame Helm application currently exists and
 * is rendered.
 */
function isFrameHelmApplicationRendered() {
  return Boolean(
    frameHelmApplication
      ?.rendered
  );
}


/* ============================================================
   Application rendering
   ============================================================ */

/**
 * Re-renders the application if it already exists and is visible.
 *
 * This intentionally does not create the application.
 */
function renderFrameHelmApplication(
  force = false
) {
  if (
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }

  frameHelmApplication.render(
    Boolean(
      force
    )
  );

  return true;
}


/**
 * Opens the Frame Helm application.
 *
 * Module-enabled policy is preserved here because opening the
 * application is part of its public UI lifecycle.
 */
function openFrameHelmApplication() {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    ui.notifications.warn(
      `${MODULE_TITLE} is currently disabled.`
    );

    return null;
  }

  const application =
    getFrameHelmApplication();

  application.render(
    true
  );

  return application;
}


/**
 * Closes the existing Frame Helm application.
 *
 * This does not instantiate an application solely to close it.
 */
function closeFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    return null;
  }

  return (
    frameHelmApplication.close()
  );
}


/* ============================================================
   Application token resolution
   ============================================================ */

/**
 * Returns the token currently represented by the Frame Helm
 * application.
 *
 * The actual selection policy remains implemented by
 * FrameHelmApplication.getControlledToken().
 */
function getDisplayedFrameHelmToken() {
  return (
    frameHelmApplication
      ?.getControlledToken?.() ??
    null
  );
}


/**
 * Returns whether the application currently represents the
 * supplied actor.
 *
 * This helper is retained here because it is fundamentally a
 * question about application display identity.
 *
 * Telemetry synchronization itself remains owned elsewhere.
 */
function frameHelmApplicationDisplaysActor(
  actor
) {
  if (
    !actor ||
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }

  const displayedActor =
    getDisplayedFrameHelmToken()
      ?.actor ??
    null;

  if (
    !displayedActor
  ) {
    return false;
  }

  return Boolean(
    displayedActor ===
      actor ||
    (
      displayedActor.uuid &&
      actor.uuid &&
      displayedActor.uuid ===
        actor.uuid
    ) ||
    (
      displayedActor.id &&
      actor.id &&
      displayedActor.id ===
        actor.id
    )
  );
}


/* ============================================================
   Application-specific Foundry hook handlers
   ============================================================ */

/**
 * Re-render when token control changes.
 *
 * Sensor refresh is independently owned by sensors-feature.js.
 */
function handleFrameHelmApplicationControlToken() {
  renderFrameHelmApplication(
    false
  );
}


/**
 * Re-render when a token is deleted.
 *
 * Sensor cleanup/refresh remains independently owned by the
 * Sensors feature.
 */
function handleFrameHelmApplicationDeleteToken() {
  renderFrameHelmApplication(
    false
  );
}


/* ============================================================
   Application feature definition
   ============================================================ */

/**
 * Canonical application UI feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * scripts/feature-registry.js remains the canonical JavaScript
 * feature-composition boundary.
 */
export const frameHelmApplicationUiFeature =
  defineFrameHelmFeature({
    id:
      "ui-application",

    domain:
      "ui.application",

    provides: [
      "ui.application",
      "ui.application.lifecycle",
      "ui.application.rendering",
      "ui.application.token"
    ],

    dependsOn: [
      "actions.registry"
    ],

    optionalDependsOn: [
      "sensors.refresh"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameHelmApplicationRuntime,

      open:
        openFrameHelmApplication,

      close:
        closeFrameHelmApplication,

      render:
        renderFrameHelmApplication
    },

    queries: {
      getApplication:
        getFrameHelmApplication,

      peekApplication:
        peekFrameHelmApplication,

      isRendered:
        isFrameHelmApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameHelmToken,

      displaysActor:
        frameHelmApplicationDisplaysActor,

      runtimeBindings:
        getFrameHelmApplicationRuntimeBindings
    },

    hooks: {
      controlToken:
        handleFrameHelmApplicationControlToken,

      deleteToken:
        handleFrameHelmApplicationDeleteToken
    },

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameHelmApplicationRuntime,

      getApplication:
        getFrameHelmApplication,

      peekApplication:
        peekFrameHelmApplication,

      open:
        openFrameHelmApplication,

      close:
        closeFrameHelmApplication,

      render:
        renderFrameHelmApplication,

      isRendered:
        isFrameHelmApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameHelmToken,

      displaysActor:
        frameHelmApplicationDisplaysActor,

      runtimeBindings:
        getFrameHelmApplicationRuntimeBindings
    },

    metadata: {
      label:
        "Frame Helm Application UI",

      description:
        "Owns the primary Frame Helm Foundry Application, its window lifecycle, rendering surface, and displayed-token identity.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      companionStylesheet:
        "styles/ui-application.css",

      compositionStylesheet:
        "styles/ui-orchestrator.css",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "application-ui-with-explicit-runtime-bindings"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

/**
 * Named exports permit a low-risk transition while the runtime
 * orchestrator is rewritten around feature-registry access.
 *
 * Once all consumers resolve this feature exclusively through the
 * registry, these exports may be narrowed if desired.
 */
export {
  configureFrameHelmApplicationRuntime,

  getFrameHelmApplicationRuntimeBindings,

  getFrameHelmApplicationActionRegistry,

  getFrameHelmApplicationTurnState,

  getFrameHelmApplicationTurnStateManager,

  executeFrameHelmApplicationActionRoll,

  getFrameHelmApplication,

  peekFrameHelmApplication,

  isFrameHelmApplicationRendered,

  renderFrameHelmApplication,

  openFrameHelmApplication,

  closeFrameHelmApplication,

  getDisplayedFrameHelmToken,

  frameHelmApplicationDisplaysActor
};