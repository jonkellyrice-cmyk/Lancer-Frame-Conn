/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-ui-semantics.js
 */

/**
 * ============================================================
 * FRAME CONN UI TURN -- SEMANTIC DOM PRESENTATION
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
  getFrameConnTurnUiSnapshot
} from "./turn-state-access.js";

import {
  buildFrameConnTurnBudgetPresentation,
  buildFrameConnTurnProtocolPresentation,
  buildFrameConnTurnReactionPresentation,
  buildFrameConnTurnOverchargePresentation
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
function buildFrameConnTurnUiClasses(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const budget =
    buildFrameConnTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameConnTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameConnTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameConnTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze([
    "frame-conn-turn",

    snapshot
      ? "frame-conn-turn-active"
      : "frame-conn-turn-inactive",

    snapshot?.ended
      ? "frame-conn-turn-ended"
      : null,

    `frame-conn-turn-budget-${budget.state}`,

    `frame-conn-turn-protocol-${protocol.state}`,

    `frame-conn-turn-reaction-${reaction.state}`,

    `frame-conn-turn-overcharge-${overcharge.state}`
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
function buildFrameConnTurnUiDataAttributes(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const budget =
    buildFrameConnTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameConnTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameConnTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameConnTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze({
    "data-frame-conn-turn":
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
  buildFrameConnTurnUiClasses,
  buildFrameConnTurnUiDataAttributes
};
