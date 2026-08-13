/* ============================================================
   Application runtime bindings
   ============================================================ */

const frameHelmApplicationRuntimeBindings = {
  getActionRegistry:
    null,

  getTurnState:
    null,

  getTurnStateManager:
    null,

  /**
   * Canonical Application execution boundary.
   *
   * The Application UI supplies actor/action intent only. Runtime
   * composition owns whatever execution architecture sits behind
   * this function.
   */
  executeAction:
    null,

  /**
   * Transitional compatibility binding retained while existing
   * runtime composition migrates from executeActionRoll.
   */
  executeActionRoll:
    null,

  refreshTelemetry:
    null
};


/* ============================================================
   Application runtime binding configuration
   ============================================================ */

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


/* ============================================================
   Application runtime binding diagnostics
   ============================================================ */

function getFrameHelmApplicationRuntimeBindings() {
  const canonicalActionExecution =
    typeof frameHelmApplicationRuntimeBindings
      .executeAction ===
      "function";

  const legacyActionExecution =
    typeof frameHelmApplicationRuntimeBindings
      .executeActionRoll ===
      "function";


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
      canonicalActionExecution ||
      legacyActionExecution,

    canonicalActionExecution,

    legacyActionExecution,

    telemetryRefresh:
      typeof frameHelmApplicationRuntimeBindings
        .refreshTelemetry ===
        "function"
  });
}


/* ============================================================
   Application dependency accessors
   ============================================================ */

function getFrameHelmApplicationActionRegistry() {
  const registry =
    frameHelmApplicationRuntimeBindings
      .getActionRegistry?.();


  if (
    !registry
  ) {
    throw new Error(
      "Frame Helm application could not resolve the Actions registry."
    );
  }


  return registry;
}


function getFrameHelmApplicationTurnState() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnState?.() ??
    null
  );
}


function getFrameHelmApplicationTurnStateManager() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnStateManager?.() ??
    null
  );
}


/**
 * Canonical UI-facing execution command.
 *
 * This component deliberately knows nothing about System Bridge,
 * execution transactions, targeting, native adapters, or Foundry
 * Lancer workflow internals. Those remain behind runtime
 * composition.
 */
async function executeFrameHelmApplicationAction(
  actor,
  action
) {
  const executor =
    frameHelmApplicationRuntimeBindings
      .executeAction ??
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


/**
 * Transitional compatibility alias.
 *
 * Existing Application components may continue calling the old
 * roll-named boundary until their next scoped migration. Both paths
 * terminate at the same canonical runtime execution command.
 */
async function executeFrameHelmApplicationActionRoll(
  actor,
  action
) {
  return executeFrameHelmApplicationAction(
    actor,
    action
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  configureFrameHelmApplicationRuntime,
  getFrameHelmApplicationRuntimeBindings,
  getFrameHelmApplicationActionRegistry,
  getFrameHelmApplicationTurnState,
  getFrameHelmApplicationTurnStateManager,
  executeFrameHelmApplicationAction,
  executeFrameHelmApplicationActionRoll
};
