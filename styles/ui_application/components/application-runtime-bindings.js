/* ============================================================
   Application runtime bindings
   ============================================================ */

const frameConnApplicationRuntimeBindings = {
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

function configureFrameConnApplicationRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn application runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameConnApplicationRuntimeBindings
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
        `Frame Conn application received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Conn application runtime binding "${key}" must be a function or null.`
      );
    }


    frameConnApplicationRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameConnApplicationRuntimeBindings()
  );
}


/* ============================================================
   Application runtime binding diagnostics
   ============================================================ */

function getFrameConnApplicationRuntimeBindings() {
  const canonicalActionExecution =
    typeof frameConnApplicationRuntimeBindings
      .executeAction ===
      "function";

  const legacyActionExecution =
    typeof frameConnApplicationRuntimeBindings
      .executeActionRoll ===
      "function";


  return Object.freeze({
    actionRegistry:
      typeof frameConnApplicationRuntimeBindings
        .getActionRegistry ===
        "function",

    turnState:
      typeof frameConnApplicationRuntimeBindings
        .getTurnState ===
        "function",

    turnStateManager:
      typeof frameConnApplicationRuntimeBindings
        .getTurnStateManager ===
        "function",

    actionExecution:
      canonicalActionExecution ||
      legacyActionExecution,

    canonicalActionExecution,

    legacyActionExecution,

    telemetryRefresh:
      typeof frameConnApplicationRuntimeBindings
        .refreshTelemetry ===
        "function"
  });
}


/* ============================================================
   Application dependency accessors
   ============================================================ */

function getFrameConnApplicationActionRegistry() {
  const registry =
    frameConnApplicationRuntimeBindings
      .getActionRegistry?.();


  if (
    !registry
  ) {
    throw new Error(
      "Frame Conn application could not resolve the Actions registry."
    );
  }


  return registry;
}


function getFrameConnApplicationTurnState() {
  return (
    frameConnApplicationRuntimeBindings
      .getTurnState?.() ??
    null
  );
}


function getFrameConnApplicationTurnStateManager() {
  return (
    frameConnApplicationRuntimeBindings
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
async function executeFrameConnApplicationAction(
  actor,
  action
) {
  const executor =
    frameConnApplicationRuntimeBindings
      .executeAction ??
    frameConnApplicationRuntimeBindings
      .executeActionRoll;


  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Conn application action execution has not been configured."
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
async function executeFrameConnApplicationActionRoll(
  actor,
  action
) {
  return executeFrameConnApplicationAction(
    actor,
    action
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  configureFrameConnApplicationRuntime,
  getFrameConnApplicationRuntimeBindings,
  getFrameConnApplicationActionRegistry,
  getFrameConnApplicationTurnState,
  getFrameConnApplicationTurnStateManager,
  executeFrameConnApplicationAction,
  executeFrameConnApplicationActionRoll
};
