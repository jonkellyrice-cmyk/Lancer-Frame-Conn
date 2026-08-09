/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-state-manager.js
 */


/**
 * ============================================================
 * FRAME HELM TURN -- STATE MANAGER
 * ============================================================
 *
 * ROLE:
 *   Owns the canonical Frame Helm Turn-state manager and the
 *   lifecycle of the currently-active FrameHelmTurnState.
 *
 * PURPOSE:
 *   Separate Turn-state instance ownership and lifecycle
 *   management from:
 *
 *     - the Turn-state model itself
 *     - public Turn commands
 *     - combat synchronization
 *     - feature declaration
 *
 * OWNS:
 *   - FrameHelmTurnStateManager.
 *   - Canonical current Turn-state ownership.
 *   - Turn-state construction.
 *   - Begin-turn lifecycle.
 *   - Ensure-turn lifecycle.
 *   - End-turn lifecycle.
 *   - Clear-turn lifecycle.
 *   - Turn snapshot delegation.
 *   - Application-render notification after manager-level state
 *     transitions.
 *
 * DOES NOT OWN:
 *   - FrameHelmTurnState implementation.
 *   - Action legality.
 *   - Action registry access.
 *   - Movement-state implementation.
 *   - Protocol logic.
 *   - Reaction logic.
 *   - Overcharge logic.
 *   - Combat-context resolution.
 *   - Combat synchronization.
 *   - Foundry combat hooks.
 *   - Public Turn command wrappers.
 *   - Application rendering implementation.
 *   - Turn feature declaration.
 *
 * DEPENDENCY FLOW:
 *
 *   turn-runtime-bindings.js
 *            │
 *            │ render notification
 *            ▼
 *   turn-state.js
 *            │
 *            ▼
 *   turn-state-manager.js
 *            │
 *            ▼
 *   turn-commands.js
 *            │
 *            ▼
 *   turn-feature.js
 *
 * IMPORTANT:
 *
 *   This file owns the SINGLE canonical manager instance:
 *
 *     frameHelmTurnState
 *
 *   Consumers must not create competing
 *   FrameHelmTurnStateManager instances.
 *
 * CURRENT API EXPECTATION:
 *
 *   turn-commands.js imports:
 *
 *     frameHelmTurnState
 *
 *   and expects it to expose:
 *
 *     .current
 *     .beginTurn()
 *     .ensureTurn()
 *     .endTurn()
 *     .clear()
 *     .snapshot()
 *     .renderApplication()
 */


/* ============================================================
   Imports -- Turn state model
   ============================================================ */

import {
  FrameHelmTurnState
} from "./turn-state.js";


/* ============================================================
   Imports -- Runtime rendering bridge
   ============================================================ */

import {
  renderFrameHelmTurnApplication
} from "./turn-runtime-bindings.js";


/* ============================================================
   Turn feature identity
   ============================================================ */

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ============================================================
   Frame Helm Turn-state manager
   ============================================================ */

export class FrameHelmTurnStateManager {
  constructor() {
    /**
     * The currently-active Frame Helm Turn state.
     *
     * null means no Frame Helm Turn plan currently exists.
     */
    this.current =
      null;
  }


  /* ==========================================================
     Turn manager -- Begin
     ========================================================== */

  /**
   * Creates a new canonical FrameHelmTurnState.
   *
   * Any previously-active state is replaced.
   */
  beginTurn(
    context = {}
  ) {
    this.current =
      new FrameHelmTurnState(
        context
      );


    console.log(
      `${MODULE_TITLE} | Began turn state.`,
      this.current.snapshot()
    );


    this.renderApplication();


    return (
      this.current
    );
  }


  /* ==========================================================
     Turn manager -- Ensure
     ========================================================== */

  /**
   * Returns the current active Turn state.
   *
   * If no state exists, or the previous state has ended, a new
   * state is created using the supplied context.
   */
  ensureTurn(
    context = {}
  ) {
    if (
      !this.current ||
      this.current.ended
    ) {
      return (
        this.beginTurn(
          context
        )
      );
    }


    return (
      this.current
    );
  }


  /* ==========================================================
     Turn manager -- End
     ========================================================== */

  /**
   * Ends the current Turn state.
   *
   * The ended state remains available through .current so its
   * final snapshot/history may still be inspected until the
   * manager is cleared or another Turn begins.
   */
  endTurn() {
    if (
      !this.current
    ) {
      return null;
    }


    this.current.endTurn();


    this.renderApplication();


    return (
      this.current.snapshot()
    );
  }


  /* ==========================================================
     Turn manager -- Clear
     ========================================================== */

  /**
   * Removes the canonical current Turn state entirely.
   */
  clear() {
    this.current =
      null;


    this.renderApplication();


    return null;
  }


  /* ==========================================================
     Turn manager -- Snapshot
     ========================================================== */

  /**
   * Returns a serializable snapshot of the active Turn state.
   *
   * Returns null when no Turn state exists.
   */
  snapshot() {
    return (
      this.current
        ?.snapshot() ??
      null
    );
  }


  /* ==========================================================
     Turn manager -- Rendering notification
     ========================================================== */

  /**
   * Turn-state management does not render UI directly.
   *
   * This delegates to the narrow runtime-binding bridge owned by
   * turn-runtime-bindings.js.
   */
  renderApplication() {
    return (
      renderFrameHelmTurnApplication()
    );
  }
}


/* ============================================================
   Canonical Turn-state manager
   ============================================================ */

/**
 * Single canonical Frame Helm Turn-state manager.
 *
 * This instance is imported by:
 *
 *   - turn-commands.js
 *   - turn-combat-sync.js
 *   - turn-feature.js where direct state exposure is required
 *
 * All Turn-state lifecycle must converge on this instance.
 */
export const frameHelmTurnState =
  new FrameHelmTurnStateManager();
