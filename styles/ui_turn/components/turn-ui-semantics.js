/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-ui-semantics.js
 */

/**
 * ============================================================
 * FRAME HELM UI TURN -- SEMANTIC DOM PRESENTATION
 * ============================================================
 *
 * ROLE:
 *   Own the semantic class-name and data-attribute presentation
 *   derived from authoritative Turn UI state.
 *
 * PURPOSE:
 *   Keep the DOM/CSS semantic contract separate from Turn-domain
 *   state and from the stable ui-turn.js feature surface.
 *
 * OWNS:
 *   - Turn root semantic class derivation.
 *   - Turn root semantic data-attribute derivation.
 *
 * DOES NOT OWN:
 *   - Turn-state mutation.
 *   - Turn-state access implementation.
 *   - Status presentation rules.
 *   - Committed-plan presentation.
 *   - Application rendering.
 *   - CSS declarations.
 */


/* ============================================================
   Imports -- Turn presentation dependencies
   ============================================================ */

import {
  getFrameHelmTurnUiSnapshot
} from "./turn-state-access.js";

import {
  buildFrameHelmTurnBudgetPresentation,
  buildFrameHelmTurnProtocolPresentation,
  buildFrameHelmTurnReactionPresentation,
  buildFrameHelmTurnOverchargePresentation
} from "./turn-status-presentation.js";


/* ============================================================
   Turn UI semantic classes
   ============================================================ */

/**
 * Produces stable semantic classes for a Turn root element.
 *
 * ui-turn.css may consume these classes without knowing anything
 * about the internal Turn state representation.
 */
function buildFrameHelmTurnUiClasses(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const budget =
    buildFrameHelmTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameHelmTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameHelmTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameHelmTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze([
    "frame-helm-turn",

    snapshot
      ? "frame-helm-turn-active"
      : "frame-helm-turn-inactive",

    snapshot?.ended
      ? "frame-helm-turn-ended"
      : null,

    `frame-helm-turn-budget-${budget.state}`,

    `frame-helm-turn-protocol-${protocol.state}`,

    `frame-helm-turn-reaction-${reaction.state}`,

    `frame-helm-turn-overcharge-${overcharge.state}`
  ]
    .filter(
      Boolean
    )
  );
}


/* ============================================================
   Turn UI data attributes
   ============================================================ */

/**
 * Produces semantic data attributes suitable for a Turn-owned DOM
 * root.
 *
 * These allow CSS to respond to Turn state without importing or
 * executing JavaScript.
 */
function buildFrameHelmTurnUiDataAttributes(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const budget =
    buildFrameHelmTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameHelmTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameHelmTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameHelmTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze({
    "data-frame-helm-turn":
      snapshot
        ? "active"
        : "inactive",

    "data-turn-ended":
      snapshot?.ended
        ? "true"
        : "false",

    "data-action-mode":
      budget.actionMode ??
      "none",

    "data-budget-state":
      budget.state,

    "data-protocol-state":
      protocol.state,

    "data-reaction-state":
      reaction.state,

    "data-overcharge-state":
      overcharge.state
  });
}


/* ============================================================
   Exports
   ============================================================ */

export {
  buildFrameHelmTurnUiClasses,
  buildFrameHelmTurnUiDataAttributes
};
