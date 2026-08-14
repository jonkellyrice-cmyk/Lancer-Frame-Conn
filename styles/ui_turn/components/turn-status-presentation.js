/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-status-presentation.js
 */

/**
 * ============================================================
 * FRAME CONN UI TURN -- STATUS PRESENTATION
 * ============================================================
 *
 * ROLE:
 *   Own the ordinary Turn presentation models consumed by the
 *   stable ui-turn.js feature surface.
 *
 * OWNS:
 *   - Turn context presentation.
 *   - Action-budget presentation.
 *   - Protocol presentation.
 *   - Reaction presentation.
 *   - Overcharge presentation.
 *
 * DOES NOT OWN:
 *   - Turn state mutation.
 *   - Runtime binding configuration.
 *   - Authoritative Turn state resolution.
 *   - Committed-plan presentation.
 *   - Application rendering.
 */


/* ============================================================
   Imports -- Turn presentation dependencies
   ============================================================ */

import {
  getFrameConnTurnUiSnapshot
} from "./turn-state-access.js";

import {
  frameConnTurnUiDisplayValue,
  frameConnTurnUiNumber
} from "./turn-presentation-utils.js";


/* ============================================================
   Turn UI context presentation
   ============================================================ */

/**
 * Presentation representation of the current combat-turn context.
 */
export function buildFrameConnTurnContextPresentation(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const context =
    snapshot?.context ??
    {};


  return Object.freeze({
    active:
      Boolean(
        snapshot &&
        !snapshot.ended
      ),

    combatId:
      context.combatId ??
      null,

    combatantId:
      context.combatantId ??
      null,

    tokenId:
      context.tokenId ??
      null,

    actorId:
      context.actorId ??
      null,

    sceneId:
      context.sceneId ??
      null,

    round:
      context.round ??
      null,

    turn:
      context.turn ??
      null,

    roundLabel:
      context.round ===
        null ||
      context.round ===
        undefined
        ? "--"
        : String(
            context.round
          ),

    turnLabel:
      context.turn ===
        null ||
      context.turn ===
        undefined
        ? "--"
        : String(
            context.turn
          )
  });
}


/* ============================================================
   Turn UI action-budget presentation
   ============================================================ */

/**
 * Converts action-budget state into a UI-oriented model.
 */
export function buildFrameConnTurnBudgetPresentation(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  if (
    !snapshot
  ) {
    return Object.freeze({
      active:
        false,

      actionMode:
        null,

      quickActionsRemaining:
        0,

      quickActionsMaximum:
        2,

      quickActionsSpent:
        0,

      fullActionAvailable:
        false,

      normalBudgetAvailable:
        false,

      state:
        "inactive"
    });
  }


  const quickRemaining =
    Math.max(
      0,
      frameConnTurnUiNumber(
        snapshot
          .quickActionsRemaining
      )
    );


  const quickMaximum =
    2;


  const quickSpent =
    Math.max(
      0,
      quickMaximum -
        quickRemaining
    );


  const fullAvailable =
    Boolean(
      snapshot
        .fullActionAvailable
    );


  const active =
    !snapshot.ended;


  let state =
    "available";


  if (
    !active
  ) {
    state =
      "ended";
  } else if (
    snapshot.actionMode ===
      "full"
  ) {
    state =
      "full-spent";
  } else if (
    snapshot.actionMode ===
      "quick"
  ) {
    state =
      quickRemaining > 0
        ? "quick-partial"
        : "quick-spent";
  }


  return Object.freeze({
    active,

    actionMode:
      snapshot.actionMode ??
      null,

    quickActionsRemaining:
      quickRemaining,

    quickActionsMaximum:
      quickMaximum,

    quickActionsSpent:
      quickSpent,

    fullActionAvailable:
      fullAvailable,

    normalBudgetAvailable:
      Boolean(
        active &&
        (
          fullAvailable ||
          quickRemaining > 0
        )
      ),

    state
  });
}


/* ============================================================
   Turn UI Protocol presentation
   ============================================================ */

export function buildFrameConnTurnProtocolPresentation(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const protocol =
    snapshot?.protocol ??
    {};


  const available =
    Boolean(
      snapshot &&
      !snapshot.ended &&
      protocol.available &&
      protocol.startOfTurnOpen &&
      !protocol.used
    );


  return Object.freeze({
    available,

    used:
      Boolean(
        protocol.used
      ),

    startOfTurnOpen:
      Boolean(
        protocol
          .startOfTurnOpen
      ),

    state:
      available
        ? "available"
        : protocol.used
          ? "used"
          : "closed",

    label:
      available
        ? "AVAILABLE"
        : protocol.used
          ? "USED"
          : "CLOSED"
  });
}


/* ============================================================
   Turn UI Reaction presentation
   ============================================================ */

export function buildFrameConnTurnReactionPresentation(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const reaction =
    snapshot?.reaction ??
    {};


  const available =
    Boolean(
      snapshot &&
      !snapshot.ended &&
      !reaction.usedThisTurn
    );


  return Object.freeze({
    available,

    used:
      Boolean(
        reaction
          .usedThisTurn
      ),

    actionId:
      reaction.actionId ??
      null,

    state:
      available
        ? "available"
        : "used",

    label:
      available
        ? "AVAILABLE"
        : "USED"
  });
}


/* ============================================================
   Turn UI Overcharge presentation
   ============================================================ */

export function buildFrameConnTurnOverchargePresentation(
  snapshot =
    getFrameConnTurnUiSnapshot()
) {
  const overcharge =
    snapshot?.overcharge ??
    {};


  const used =
    Boolean(
      overcharge.used
    );


  const grantedQuickRemaining =
    Math.max(
      0,
      frameConnTurnUiNumber(
        overcharge
          .quickActionRemaining
      )
    );


  return Object.freeze({
    available:
      Boolean(
        snapshot &&
        !snapshot.ended &&
        !used
      ),

    used,

    quickActionRemaining:
      grantedQuickRemaining,

    heatFormula:
      overcharge
        .heatFormula ??
      null,

    heatLabel:
      frameConnTurnUiDisplayValue(
        overcharge
          .heatFormula
      ),

    state:
      used
        ? (
            grantedQuickRemaining > 0
              ? "active"
              : "spent"
          )
        : "available"
  });
}
