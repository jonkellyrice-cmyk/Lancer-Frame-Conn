/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-state-access.js
 */

/**
 * ============================================================
 * FRAME HELM UI TURN -- STATE ACCESS
 * ============================================================
 *
 * ROLE:
 *   Own the presentation-layer accessors used by ui-turn to read
 *   authoritative Turn state without reaching directly into Turn
 *   implementation details.
 *
 * OWNS:
 *   - Current Turn state resolution.
 *   - Presentation-safe Turn snapshot resolution.
 *
 * DOES NOT OWN:
 *   - Turn state mutation.
 *   - Runtime binding configuration.
 *   - Action registry access.
 *   - Application rendering.
 *   - Presentation-model construction.
 *
 * DEPENDENCY FLOW:
 *
 *   turn-runtime-bindings.js
 *        │
 *        ▼
 *   turn-state-access.js
 *        │
 *        ▼
 *   ui-turn presentation components
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  getFrameHelmTurnUiTurnApi
} from "./turn-runtime-bindings.js";


/* ============================================================
   Turn UI state resolution
   ============================================================ */

/**
 * Resolve the current authoritative Turn state.
 */
function getFrameHelmTurnUiCurrentState() {
  const turnApi =
    getFrameHelmTurnUiTurnApi();


  return (
    turnApi.current ??
    null
  );
}


/**
 * Resolve a presentation-safe Turn snapshot.
 *
 * Prefer the Turn feature's snapshot surface so callers never
 * depend directly on mutable domain state.
 */
function getFrameHelmTurnUiSnapshot() {
  const turnApi =
    getFrameHelmTurnUiTurnApi();


  if (
    turnApi.state !==
    undefined
  ) {
    return (
      turnApi.state ??
      null
    );
  }


  return (
    turnApi.current
      ?.snapshot?.() ??
    null
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  getFrameHelmTurnUiCurrentState,
  getFrameHelmTurnUiSnapshot
};
