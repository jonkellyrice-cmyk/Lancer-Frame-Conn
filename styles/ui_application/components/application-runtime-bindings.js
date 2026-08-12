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
   Exports
   ============================================================ */

export {
  configureFrameHelmApplicationRuntime,
  getFrameHelmApplicationRuntimeBindings,
  getFrameHelmApplicationActionRegistry,
  getFrameHelmApplicationTurnState,
  getFrameHelmApplicationTurnStateManager,
  executeFrameHelmApplicationActionRoll
};
