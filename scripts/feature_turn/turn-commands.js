/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-commands.js
 */


/**
 * ============================================================
 * FRAME HELM TURN -- COMMAND SURFACE
 * ============================================================
 *
 * ROLE:
 *   Provides the public command and query surface for the
 *   canonical Frame Helm Turn state manager.
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
 *   - FrameHelmTurnState.
 *   - FrameHelmTurnStateManager.
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
 *     getCurrentFrameHelmTurn()
 *     getFrameHelmTurnStateManager()
 *     getFrameHelmTurnSnapshot()
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
  frameHelmTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Turn queries -- Current state
   ============================================================ */

/**
 * Returns the current Frame Helm Turn state.
 *
 * IMPORTANT:
 *
 * This does NOT create a Turn when no Turn currently exists.
 */
function getCurrentFrameHelmTurn() {
  return (
    frameHelmTurnState
      .current ??
    null
  );
}


/* ============================================================
   Turn queries -- Manager
   ============================================================ */

/**
 * Returns the canonical Frame Helm Turn-state manager.
 *
 * This is intentionally distinct from getCurrentFrameHelmTurn().
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
 * FrameHelmTurnState.
 */
function getFrameHelmTurnStateManager() {
  return frameHelmTurnState;
}


/* ============================================================
   Turn queries -- Snapshot
   ============================================================ */

/**
 * Returns the current serializable Turn-state snapshot.
 *
 * Returns null when no Turn state exists.
 */
function getFrameHelmTurnSnapshot() {
  return (
    frameHelmTurnState
      .snapshot()
  );
}


/* ============================================================
   Turn commands -- Begin
   ============================================================ */

/**
 * Begins a new Frame Helm Turn state using the supplied context.
 *
 * FrameHelmTurnStateManager.beginTurn() already notifies the
 * Application rendering surface after constructing the state.
 */
function beginFrameHelmTurn(
  context = {}
) {
  return (
    frameHelmTurnState
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
function ensureFrameHelmTurn(
  context = {}
) {
  return (
    frameHelmTurnState
      .ensureTurn(
        context
      )
  );
}


/* ============================================================
   Turn commands -- End
   ============================================================ */

/**
 * Ends the current Frame Helm Turn.
 *
 * FrameHelmTurnStateManager.endTurn() already requests an
 * Application render after mutation.
 */
function endFrameHelmTurn() {
  return (
    frameHelmTurnState
      .endTurn()
  );
}


/* ============================================================
   Turn commands -- Clear
   ============================================================ */

/**
 * Clears the canonical current Turn state.
 *
 * FrameHelmTurnStateManager.clear() already requests an
 * Application render after mutation.
 */
function clearFrameHelmTurn() {
  return (
    frameHelmTurnState
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
function canUseFrameHelmTurnAction(
  actionId,
  options
) {
  return (
    frameHelmTurnState
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
 * Unlike manager-level lifecycle commands, FrameHelmTurnState's
 * useAction() mutates the current state directly and therefore
 * requires an explicit application-render notification afterward.
 */
function useFrameHelmTurnAction(
  actionId,
  options
) {
  const state =
    frameHelmTurnState
      .ensureTurn();


  const result =
    state.useAction(
      actionId,
      options
    );


  frameHelmTurnState
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
 * FrameHelmTurnState.
 *
 * This command remains available from the Turn public surface
 * until movement ownership is fully migrated into the Movement
 * feature.
 */
function spendFrameHelmTurnMovement(
  distance
) {
  const state =
    frameHelmTurnState
      .ensureTurn();


  const result =
    state.spendMovement(
      distance
    );


  frameHelmTurnState
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
 * retained by FrameHelmTurnState.
 */
function setFrameHelmTurnSpeed(
  speed
) {
  const state =
    frameHelmTurnState
      .ensureTurn();


  const result =
    state.setSpeed(
      speed
    );


  frameHelmTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Turn commands -- Overcharge
   ============================================================ */

/**
 * Activates Overcharge against the active Turn state.
 */
function useFrameHelmTurnOvercharge(
  options
) {
  const state =
    frameHelmTurnState
      .ensureTurn();


  const result =
    state.useOvercharge(
      options
    );


  frameHelmTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  getCurrentFrameHelmTurn,

  getFrameHelmTurnStateManager,

  getFrameHelmTurnSnapshot,

  beginFrameHelmTurn,

  ensureFrameHelmTurn,

  endFrameHelmTurn,

  clearFrameHelmTurn,

  canUseFrameHelmTurnAction,

  useFrameHelmTurnAction,

  spendFrameHelmTurnMovement,

  setFrameHelmTurnSpeed,

  useFrameHelmTurnOvercharge
};
