/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-runtime-bindings.js
 */


/**
 * ============================================================
 * FRAME HELM TURN -- RUNTIME BINDINGS
 * ============================================================
 *
 * ROLE:
 *   Owns the narrow runtime dependency bridge consumed by the
 *   Frame Helm Turn domain.
 *
 * PURPOSE:
 *   Remove cross-feature runtime binding state and dependency
 *   accessors from turn-feature.js so that turn-feature.js can
 *   remain the primary composition and feature-declaration
 *   surface for the Turn domain.
 *
 * OWNS:
 *   - Turn runtime-binding storage.
 *   - Turn runtime-binding configuration.
 *   - Runtime-binding key validation.
 *   - Runtime-binding value validation.
 *   - Runtime-binding availability diagnostics.
 *   - Actions-registry dependency resolution.
 *   - Application-render notification delegation.
 *
 * DOES NOT OWN:
 *   - FrameHelmTurnState.
 *   - FrameHelmTurnStateManager.
 *   - Canonical Turn-manager construction.
 *   - Action registry implementation.
 *   - Action definitions.
 *   - Turn command delegation.
 *   - Combat-context resolution.
 *   - Combat synchronization.
 *   - Foundry combat hooks.
 *   - Application rendering implementation.
 *   - Feature registration.
 *   - Turn feature declaration.
 *
 * DEPENDENCY FLOW:
 *
 *   actions-feature.js
 *        │
 *        │ Actions registry supplied at runtime
 *        ▼
 *   turn-runtime-bindings.js
 *        │
 *        ├── getFrameHelmTurnActionRegistry()
 *        │
 *        └── renderFrameHelmTurnApplication()
 *        │
 *        ▼
 *   turn-state.js
 *   turn-state-manager.js
 *   turn-commands.js
 *   turn-combat-sync.js
 *        │
 *        ▼
 *   turn-feature.js
 *
 *
 * APPLICATION RENDERING FLOW:
 *
 *   ui-application
 *        │
 *        │ renderApplication binding
 *        ▼
 *   turn-runtime-bindings.js
 *        │
 *        ▼
 *   renderFrameHelmTurnApplication()
 *        │
 *        ▼
 *   Turn state manager / command surfaces
 *
 *
 * CONFIGURATION:
 *
 *   runtime-orchestrator.js resolves registered feature APIs and
 *   configures this module indirectly through:
 *
 *     frameHelmTurnApi.configureRuntime(...)
 *
 *   turn-feature.js exposes configureFrameHelmTurnRuntime() as
 *   part of the Turn feature API.
 *
 * IMPORTANT:
 *
 *   This module is intentionally NOT a general service container.
 *
 *   Only explicitly-declared Turn dependencies may be configured.
 *
 *   Unknown binding keys are rejected.
 *
 * CURRENT BINDINGS:
 *
 *   getActionRegistry
 *
 *     Returns the canonical Frame Helm Actions registry.
 *
 *
 *   renderApplication
 *
 *     Requests that the primary Frame Helm Application render
 *     updated Turn-visible state.
 *
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership only.
 *
 *   Runtime behavior should remain equivalent to the original
 *   runtime-binding implementation embedded in turn-feature.js.
 */


/* ============================================================
   Turn runtime-binding storage
   ============================================================ */

/**
 * Narrow dependency bridge used by the Turn domain.
 *
 * IMPORTANT:
 *
 * These implementations belong to other feature domains.
 *
 * Turn stores only the functions needed to access those
 * capabilities.
 */
const frameHelmTurnRuntimeBindings = {
  getActionRegistry:
    null,

  renderApplication:
    null
};


/* ============================================================
   Turn runtime-binding configuration
   ============================================================ */

/**
 * Configures one or more Turn runtime dependencies.
 *
 * Only known binding keys may be supplied.
 *
 * Each binding must be either:
 *
 *   - a function
 *   - null
 *
 * Null permits explicit clearing during development/testing.
 */
function configureFrameHelmTurnRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object" ||
    Array.isArray(
      bindings
    )
  ) {
    throw new TypeError(
      "Frame Helm turn runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmTurnRuntimeBindings
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
        `Frame Helm Turn received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Turn runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmTurnRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmTurnRuntimeBindings()
  );
}


/* ============================================================
   Turn runtime-binding diagnostics
   ============================================================ */

/**
 * Returns a read-only diagnostic snapshot describing which Turn
 * runtime dependencies are currently configured.
 *
 * The underlying functions themselves remain private.
 */
function getFrameHelmTurnRuntimeBindings() {
  return Object.freeze({
    actionRegistry:
      typeof frameHelmTurnRuntimeBindings
        .getActionRegistry ===
        "function",

    applicationRendering:
      typeof frameHelmTurnRuntimeBindings
        .renderApplication ===
        "function"
  });
}


/* ============================================================
   Turn dependency access -- Actions registry
   ============================================================ */

/**
 * Returns the canonical Frame Helm Actions registry supplied by
 * runtime composition.
 *
 * Turn state uses this registry to:
 *
 *   - resolve action IDs
 *   - inspect action costs
 *   - inspect duplicate keys
 *   - resolve Boost
 *   - validate action legality
 *
 * Failure to configure the Actions registry is considered a
 * composition error rather than an optional runtime condition.
 */
function getFrameHelmTurnActionRegistry() {
  const registry =
    frameHelmTurnRuntimeBindings
      .getActionRegistry?.();


  if (
    !registry
  ) {
    throw new Error(
      "Frame Helm Turn could not resolve the Actions registry."
    );
  }


  return registry;
}


/* ============================================================
   Turn dependency access -- Application rendering
   ============================================================ */

/**
 * Requests a Frame Helm Application re-render after Turn-visible
 * state changes.
 *
 * Rendering remains optional from the Turn domain's perspective.
 *
 * For example, Turn state may still operate during testing or
 * startup before an Application rendering surface has been
 * configured.
 *
 * The Turn domain therefore does not throw when this dependency
 * is absent.
 */
function renderFrameHelmTurnApplication(
  force = false
) {
  return (
    frameHelmTurnRuntimeBindings
      .renderApplication?.(
        Boolean(
          force
        )
      ) ??
    null
  );
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  configureFrameHelmTurnRuntime,

  getFrameHelmTurnRuntimeBindings,

  getFrameHelmTurnActionRegistry,

  renderFrameHelmTurnApplication
};
