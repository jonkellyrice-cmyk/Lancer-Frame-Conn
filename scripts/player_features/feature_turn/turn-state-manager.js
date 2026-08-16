/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-state-manager.js
 */


/**
 * ============================================================
 * FRAME CONN TURN -- STATE MANAGER
 * ============================================================
 *
 * ROLE:
 *   Owns the canonical Frame Conn Turn-state manager and the
 *   lifecycle of the currently-active FrameConnTurnState.
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
 *   - FrameConnTurnStateManager.
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
 *   - FrameConnTurnState implementation.
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
 *     frameConnTurnState
 *
 *   Consumers must not create competing
 *   FrameConnTurnStateManager instances.
 *
 * CURRENT API EXPECTATION:
 *
 *   turn-commands.js imports:
 *
 *     frameConnTurnState
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
  FrameConnTurnState
} from "./turn-state.js";


/* ============================================================
   Imports -- Runtime rendering bridge
   ============================================================ */

import {
  renderFrameConnTurnApplication
} from "./turn-runtime-bindings.js";


/* ============================================================
   Turn feature identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";


/* ============================================================
   Frame Conn Turn-state manager
   ============================================================ */

export class FrameConnTurnStateManager {
  constructor() {
    /**
     * The currently-active Frame Conn Turn state.
     *
     * null means no Frame Conn Turn plan currently exists.
     */
    this.current =
      null;


    /**
     * Actor-keyed reaction usage survives active-combatant changes so
     * out-of-turn reactions can be tracked against the actual reactor.
     */
    this.actorReactionUsage =
      new Map();


    /**
     * Reaction locks are actor keyed and combat scoped. Brace uses this
     * to suppress all Frame Conn reactions until its aftermath expires.
     */
    this.actorReactionLocks =
      new Map();
  }


  normalizeReactionActorKey(
    actorReference
  ) {
    const actorKey =
      typeof actorReference ===
        "string"
        ? actorReference
        : actorReference?.uuid ??
          actorReference?.id ??
          null;


    if (!actorKey) {
      throw new TypeError(
        "Frame Conn reaction tracking requires an actor reference."
      );
    }


    return String(actorKey);
  }


  reactionCombatContext(
    combat =
      globalThis.game?.combat
  ) {
    if (
      !combat?.id ||
      !combat.started ||
      !Number.isFinite(combat.round) ||
      !Number.isFinite(combat.turn)
    ) {
      return null;
    }


    return {
      combatId:
        combat.id,

      turnKey:
        `${combat.id}:${combat.round}:${combat.turn}`
    };
  }


  canUseReactionForActor(
    actorReference,
    actionId = null,
    {
      combat =
        globalThis.game?.combat
    } = {}
  ) {
    const actorKey =
      this.normalizeReactionActorKey(
        actorReference
      );


    const combatContext =
      this.reactionCombatContext(
        combat
      );


    if (!combatContext) {
      return {
        allowed:
          false,

        reason:
          "A reaction requires an active combat turn."
      };
    }


    const lock =
      this.actorReactionLocks.get(
        actorKey
      );


    if (
      lock?.combatId ===
      combatContext.combatId
    ) {
      return {
        allowed:
          false,

        reason:
          lock.reason ??
          "Reactions are currently unavailable for this actor."
      };
    }


    const usage =
      this.actorReactionUsage.get(
        actorKey
      );


    if (
      usage?.turnKey ===
      combatContext.turnKey
    ) {
      return {
        allowed:
          false,

        reason:
          "This actor has already taken a reaction during the current turn."
      };
    }


    return {
      allowed:
        true,

      reason:
        null,

      actorKey,

      actionId,

      ...combatContext
    };
  }


  useReactionForActor(
    actorReference,
    actionId = null,
    options = {}
  ) {
    const permission =
      this.canUseReactionForActor(
        actorReference,
        actionId,
        options
      );


    if (!permission.allowed) {
      throw new Error(
        permission.reason
      );
    }


    this.actorReactionUsage.set(
      permission.actorKey,
      {
        combatId:
          permission.combatId,

        turnKey:
          permission.turnKey,

        actionId:
          actionId ??
          null,

        usedAt:
          Date.now()
      }
    );


    return {
      ...this.actorReactionUsage.get(
        permission.actorKey
      )
    };
  }


  releaseReactionForActor(
    actorReference,
    actionId = null,
    {
      combat =
        globalThis.game?.combat
    } = {}
  ) {
    const actorKey =
      this.normalizeReactionActorKey(
        actorReference
      );


    const combatContext =
      this.reactionCombatContext(
        combat
      );


    const usage =
      this.actorReactionUsage.get(
        actorKey
      );


    if (
      !usage ||
      usage.turnKey !==
        combatContext?.turnKey ||
      (
        actionId &&
        usage.actionId !==
          actionId
      )
    ) {
      return false;
    }


    this.actorReactionUsage.delete(
      actorKey
    );


    return true;
  }


  setReactionLockForActor(
    actorReference,
    locked,
    {
      combat =
        globalThis.game?.combat,
      reason = null
    } = {}
  ) {
    const actorKey =
      this.normalizeReactionActorKey(
        actorReference
      );


    if (!locked) {
      this.actorReactionLocks.delete(
        actorKey
      );


      return false;
    }


    const combatId =
      combat?.id ??
      null;


    if (!combatId) {
      throw new Error(
        "Frame Conn cannot lock reactions without an active combat."
      );
    }


    this.actorReactionLocks.set(
      actorKey,
      {
        combatId,
        reason
      }
    );


    return true;
  }


  /* ==========================================================
     Turn manager -- Begin
     ========================================================== */

  /**
   * Creates a new canonical FrameConnTurnState.
   *
   * Any previously-active state is replaced.
   */
  beginTurn(
    context = {}
  ) {
    this.current =
      new FrameConnTurnState(
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


    this.actorReactionUsage.clear();


    this.actorReactionLocks.clear();


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
      renderFrameConnTurnApplication()
    );
  }
}


/* ============================================================
   Canonical Turn-state manager
   ============================================================ */

/**
 * Single canonical Frame Conn Turn-state manager.
 *
 * This instance is imported by:
 *
 *   - turn-commands.js
 *   - turn-combat-sync.js
 *   - turn-feature.js where direct state exposure is required
 *
 * All Turn-state lifecycle must converge on this instance.
 */
export const frameConnTurnState =
  new FrameConnTurnStateManager();
