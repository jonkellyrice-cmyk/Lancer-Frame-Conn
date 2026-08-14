/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-commands.js
 */


/**
 * ============================================================
 * FRAME CONN TURN -- COMMAND SURFACE
 * ============================================================
 *
 * ROLE:
 *   Provides the public command and query surface for the
 *   canonical Frame Conn Turn state manager.
 *
 * PURPOSE:
 *   Remove Turn command delegation from turn-feature.js so that
 *   turn-feature.js can remain the primary composition and
 *   feature-declaration surface for the Turn domain.
 *
 * OWNS:
 *   - Current Turn-state lookup.
 *   - Canonical Turn-manager lookup.
 *   - Turn snapshot lookup.
 *   - Begin-turn delegation.
 *   - Ensure-turn delegation.
 *   - End-turn delegation.
 *   - Clear-turn delegation.
 *   - Action-legality delegation.
 *   - Action-use delegation.
 *   - Transitional movement-spending delegation.
 *   - Turn Speed mutation delegation.
 *   - Overcharge delegation.
 *   - Application-render notification after mutations which do
 *     not already cause the manager to render.
 *
 * DOES NOT OWN:
 *   - FrameConnTurnState.
 *   - FrameConnTurnStateManager.
 *   - Canonical Turn-manager construction.
 *   - Turn runtime bindings.
 *   - Actions registry ownership.
 *   - Action definitions.
 *   - Combat-context resolution.
 *   - Combat synchronization.
 *   - Foundry combat hooks.
 *   - Movement-path interpretation.
 *   - Application rendering implementation.
 *   - Turn feature declaration.
 *
 * DEPENDENCY FLOW:
 *
 *   turn-state.js
 *        │
 *        ▼
 *   turn-state-manager.js
 *        │
 *        ▼
 *   turn-commands.js
 *        │
 *        ▼
 *   turn-feature.js
 *
 * IMPORTANT:
 *
 *   The canonical manager is imported from:
 *
 *     ./turn-state-manager.js
 *
 *   Consumers should not construct their own Turn managers.
 *
 * API COMPATIBILITY:
 *
 *   This module deliberately exposes explicit:
 *
 *     getCurrentFrameConnTurn()
 *     getFrameConnTurnStateManager()
 *     getFrameConnTurnSnapshot()
 *
 *   These allow turn-feature.js to expose:
 *
 *     api.getCurrent()
 *     api.getManager()
 *     api.snapshot()
 *
 *   without requiring consumers to infer the distinction between
 *   the current Turn state and the manager which owns it.
 */


/* ============================================================
   Imports -- Canonical Turn manager
   ============================================================ */

import {
  frameConnTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Turn queries -- Current state
   ============================================================ */

/**
 * Returns the current Frame Conn Turn state.
 *
 * IMPORTANT:
 *
 * This does NOT create a Turn when no Turn currently exists.
 */
function getCurrentFrameConnTurn() {
  return (
    frameConnTurnState
      .current ??
    null
  );
}


/* ============================================================
   Turn queries -- Manager
   ============================================================ */

/**
 * Returns the canonical Frame Conn Turn-state manager.
 *
 * This is intentionally distinct from getCurrentFrameConnTurn().
 *
 * The manager owns:
 *
 *   - beginTurn()
 *   - ensureTurn()
 *   - endTurn()
 *   - clear()
 *   - snapshot()
 *   - renderApplication()
 *
 * while its .current property contains the active
 * FrameConnTurnState.
 */
function getFrameConnTurnStateManager() {
  return frameConnTurnState;
}


/* ============================================================
   Turn queries -- Snapshot
   ============================================================ */

/**
 * Returns the current serializable Turn-state snapshot.
 *
 * Returns null when no Turn state exists.
 */
function getFrameConnTurnSnapshot() {
  return (
    frameConnTurnState
      .snapshot()
  );
}


/* ============================================================
   Turn commands -- Begin
   ============================================================ */

/**
 * Begins a new Frame Conn Turn state using the supplied context.
 *
 * FrameConnTurnStateManager.beginTurn() already notifies the
 * Application rendering surface after constructing the state.
 */
function beginFrameConnTurn(
  context = {}
) {
  return (
    frameConnTurnState
      .beginTurn(
        context
      )
  );
}


/* ============================================================
   Turn commands -- Ensure
   ============================================================ */

/**
 * Returns the existing active Turn state, or begins one when no
 * active state exists.
 */
function ensureFrameConnTurn(
  context = {}
) {
  return (
    frameConnTurnState
      .ensureTurn(
        context
      )
  );
}


/* ============================================================
   Turn commands -- End
   ============================================================ */

/**
 * Ends the current Frame Conn Turn.
 *
 * FrameConnTurnStateManager.endTurn() already requests an
 * Application render after mutation.
 */
function endFrameConnTurn() {
  return (
    frameConnTurnState
      .endTurn()
  );
}


/* ============================================================
   Turn commands -- Clear
   ============================================================ */

/**
 * Clears the canonical current Turn state.
 *
 * FrameConnTurnStateManager.clear() already requests an
 * Application render after mutation.
 */
function clearFrameConnTurn() {
  return (
    frameConnTurnState
      .clear()
  );
}


/* ============================================================
   Turn commands -- Action legality
   ============================================================ */

/**
 * Tests whether an action can be used against the active Turn
 * state.
 *
 * This preserves the existing behavior of ensuring a Turn first
 * when invoked through the public command surface.
 */
function canUseFrameConnTurnAction(
  actionId,
  options
) {
  return (
    frameConnTurnState
      .ensureTurn()
      .canUseAction(
        actionId,
        options
      )
  );
}


/* ============================================================
   Turn commands -- Action use
   ============================================================ */

/**
 * Commits an action against the active Turn state.
 *
 * Unlike manager-level lifecycle commands, FrameConnTurnState's
 * useAction() mutates the current state directly and therefore
 * requires an explicit application-render notification afterward.
 */
function useFrameConnTurnAction(
  actionId,
  options
) {
  const state =
    frameConnTurnState
      .ensureTurn();


  const result =
    state.useAction(
      actionId,
      options
    );


  frameConnTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Turn commands -- Actor-keyed reactions
   ============================================================ */

function canUseFrameConnTurnReactionForActor(
  actorReference,
  actionId = null,
  options = {}
) {
  return frameConnTurnState
    .canUseReactionForActor(
      actorReference,
      actionId,
      options
    );
}

function useFrameConnTurnReactionForActor(
  actorReference,
  actionId = null,
  options = {}
) {
  return frameConnTurnState
    .useReactionForActor(
      actorReference,
      actionId,
      options
    );
}

function releaseFrameConnTurnReactionForActor(
  actorReference,
  actionId = null,
  options = {}
) {
  return frameConnTurnState
    .releaseReactionForActor(
      actorReference,
      actionId,
      options
    );
}

function setFrameConnTurnReactionLockForActor(
  actorReference,
  locked,
  options = {}
) {
  return frameConnTurnState
    .setReactionLockForActor(
      actorReference,
      locked,
      options
    );
}

function applyFrameConnBraceTurnRestriction(
  actorReference
) {
  const state =
    frameConnTurnState.current;

  if (!state) {
    return null;
  }

  const actorId =
    typeof actorReference ===
      "string"
      ? actorReference
      : actorReference?.id ??
        null;

  const actorUuid =
    typeof actorReference ===
      "object"
      ? actorReference?.uuid ??
        null
      : null;

  if (
    state.context.actorId !==
      actorId &&
    state.context.actorId !==
      actorUuid
  ) {
    return null;
  }

  const result =
    state.applyBraceRestriction();

  frameConnTurnState
    .renderApplication();

  return result;
}


/* ============================================================
   Turn commands -- Movement
   ============================================================ */

/**
 * TRANSITIONAL:
 *
 * Movement accounting still resides partly inside
 * FrameConnTurnState.
 *
 * This command remains available from the Turn public surface
 * until movement ownership is fully migrated into the Movement
 * feature.
 */
function spendFrameConnTurnMovement(
  distance
) {
  const state =
    frameConnTurnState
      .ensureTurn();


  const result =
    state.spendMovement(
      distance
    );


  frameConnTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Turn commands -- Speed
   ============================================================ */

/**
 * Updates the active Turn state's movement Speed.
 *
 * Speed currently remains part of the transitional movement state
 * retained by FrameConnTurnState.
 */
function setFrameConnTurnSpeed(
  speed
) {
  const state =
    frameConnTurnState
      .ensureTurn();


  const result =
    state.setSpeed(
      speed
    );


  frameConnTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Turn commands -- Overcharge
   ============================================================ */

/**
 * Activates Overcharge against the active Turn state.
 */
function useFrameConnTurnOvercharge(
  options
) {
  const state =
    frameConnTurnState
      .ensureTurn();


  const result =
    state.useOvercharge(
      options
    );


  frameConnTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  getCurrentFrameConnTurn,

  getFrameConnTurnStateManager,

  getFrameConnTurnSnapshot,

  beginFrameConnTurn,

  ensureFrameConnTurn,

  endFrameConnTurn,

  clearFrameConnTurn,

  canUseFrameConnTurnAction,

  useFrameConnTurnAction,

  canUseFrameConnTurnReactionForActor,

  useFrameConnTurnReactionForActor,

  releaseFrameConnTurnReactionForActor,

  setFrameConnTurnReactionLockForActor,

  applyFrameConnBraceTurnRestriction,

  spendFrameConnTurnMovement,

  setFrameConnTurnSpeed,

  useFrameConnTurnOvercharge
};
