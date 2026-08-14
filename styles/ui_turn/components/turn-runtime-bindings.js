/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-runtime-bindings.js
 */

/**
 * ============================================================
 * FRAME CONN UI TURN -- RUNTIME BINDINGS
 * ============================================================
 *
 * ROLE:
 *   Own the narrow transitional runtime-binding surface used by
 *   the Turn UI presentation tree.
 *
 * PURPOSE:
 *   Preserve the existing ui-turn.js runtime dependency contract
 *   while allowing the stable ui-turn.js surface to delegate this
 *   responsibility to a focused child module.
 *
 * OWNS:
 *   - Turn UI runtime binding storage.
 *   - Runtime binding configuration.
 *   - Runtime binding availability diagnostics.
 *   - Turn feature API resolution.
 *   - Action registry resolution.
 *   - Application render delegation.
 *
 * DOES NOT OWN:
 *   - Turn state mutation.
 *   - Turn state presentation.
 *   - Action registry implementation.
 *   - Application rendering implementation.
 *   - Feature registration.
 */


/* ============================================================
   Turn UI runtime bindings
   ============================================================ */

/**
 * Transitional explicit bridge.
 *
 * The Turn UI should ultimately resolve everything it needs through
 * the registered feature graph.
 *
 * The binding surface remains intentionally narrow while the
 * Application UI itself is still being decomposed.
 */
const frameConnTurnUiRuntimeBindings = {
  getTurnApi:
    null,

  getActionRegistry:
    null,

  renderApplication:
    null
};


/**
 * Configure transitional Turn UI dependencies.
 */
function configureFrameConnTurnUiRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn Turn UI runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameConnTurnUiRuntimeBindings
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
        `Frame Conn Turn UI received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Conn Turn UI runtime binding "${key}" must be a function or null.`
      );
    }


    frameConnTurnUiRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameConnTurnUiRuntimeBindings()
  );
}


/**
 * Returns binding availability without exposing bound functions.
 */
function getFrameConnTurnUiRuntimeBindings() {
  return Object.freeze({
    turn:
      typeof frameConnTurnUiRuntimeBindings
        .getTurnApi ===
        "function",

    actions:
      typeof frameConnTurnUiRuntimeBindings
        .getActionRegistry ===
        "function",

    applicationRendering:
      typeof frameConnTurnUiRuntimeBindings
        .renderApplication ===
        "function"
  });
}


/* ============================================================
   Turn UI dependency accessors
   ============================================================ */

/**
 * Resolve the authoritative Turn feature API.
 */
function getFrameConnTurnUiTurnApi() {
  const turnApi =
    frameConnTurnUiRuntimeBindings
      .getTurnApi?.();


  if (
    !turnApi
  ) {
    throw new Error(
      "Frame Conn Turn UI could not resolve the Turn feature API."
    );
  }


  return turnApi;
}


/**
 * Resolve the canonical action registry when available.
 *
 * Action metadata is useful for presentation labels/icons but is
 * not required for the underlying Turn state itself.
 */
function getFrameConnTurnUiActionRegistry() {
  return (
    frameConnTurnUiRuntimeBindings
      .getActionRegistry?.() ??
    null
  );
}


/**
 * Request an Application UI refresh.
 *
 * Turn UI runtime bindings do not own application rendering.
 */
function renderFrameConnTurnUiApplication(
  force = false
) {
  return (
    frameConnTurnUiRuntimeBindings
      .renderApplication?.(
        Boolean(
          force
        )
      ) ??
    null
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  configureFrameConnTurnUiRuntime,

  getFrameConnTurnUiRuntimeBindings,

  getFrameConnTurnUiTurnApi,

  getFrameConnTurnUiActionRegistry,

  renderFrameConnTurnUiApplication
};
