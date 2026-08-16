/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-combat-sync.js
 */


/**
 * ============================================================
 * FRAME CONN TURN -- COMBAT SYNCHRONIZATION
 * ============================================================
 *
 * ROLE:
 *   Owns synchronization between the canonical Frame Conn Turn
 *   state and Foundry's active Combat state.
 *
 * PURPOSE:
 *   Remove Foundry combat-context resolution and combat hook
 *   behavior from turn-feature.js so that turn-feature.js can
 *   remain the primary Turn composition and feature-declaration
 *   surface.
 *
 * OWNS:
 *   - Active Foundry combat-turn context resolution.
 *   - Combat/Turn identity comparison.
 *   - Frame Conn Turn synchronization with active combat.
 *   - Combat-start handling.
 *   - Combat-update handling.
 *   - Combat-deletion handling.
 *
 * DOES NOT OWN:
 *   - FrameConnTurnState.
 *   - FrameConnTurnStateManager implementation.
 *   - Canonical Turn-manager construction.
 *   - Turn runtime bindings.
 *   - Action registry ownership.
 *   - Action-budget rules.
 *   - Movement accounting.
 *   - Application rendering.
 *   - Foundry hook installation.
 *   - Turn feature declaration.
 *
 * DEPENDENCY FLOW:
 *
 *   turn-state.js
 *        │
 *        ▼
 *   turn-state-manager.js
 *        │
 *        │ frameConnTurnState
 *        ▼
 *   turn-combat-sync.js
 *        │
 *        ├── activeCombatTurnContext()
 *        ├── syncTurnStateToCombat()
 *        └── combat hook handlers
 *        │
 *        ▼
 *   turn-feature.js
 *
 * FOUNDRY HOOK CONTRACT:
 *
 *   This module defines hook handlers.
 *
 *   It does NOT call:
 *
 *     Hooks.on(...)
 *
 *   Hook installation remains owned by the canonical
 *   FrameConnFeatureRegistry.
 *
 *   turn-feature.js should expose these handlers through its
 *   feature definition:
 *
 *     hooks: {
 *       combatStart:
 *         handleFrameConnCombatStart,
 *
 *       updateCombat:
 *         handleFrameConnCombatUpdate,
 *
 *       deleteCombat:
 *         handleFrameConnCombatDelete
 *     }
 *
 * SYNCHRONIZATION CONTRACT:
 *
 *   Frame Conn creates a new Turn state when any canonical combat
 *   identity field changes:
 *
 *     - combat id
 *     - combatant id
 *     - round
 *     - turn
 *
 *   If the active combat identity has not changed, the existing
 *   FrameConnTurnState remains authoritative.
 *
 *   If combat is absent, stopped, or has no active combatant, the
 *   canonical Frame Conn Turn state is cleared.
 */


/* ============================================================
   Imports -- Canonical Turn manager
   ============================================================ */

import {
  frameConnTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Combat context -- Active turn
   ============================================================ */

/**
 * Produces the canonical Frame Conn context for the currently
 * active Foundry combat turn.
 *
 * The returned object contains only the identity and initial state
 * required to construct/synchronize a FrameConnTurnState.
 */
function activeCombatTurnContext(
  combat = game.combat
) {
  const combatant =
    combat?.combatant ??
    null;


  const tokenDocument =
    combatant?.token ??
    null;


  const actor =
    combatant?.actor ??
    null;


  const numericSpeed =
    Number(
      actor?.system?.speed
    );


  return {
    combatId:
      combat?.id ??
      null,

    combatantId:
      combatant?.id ??
      null,

    tokenId:
      tokenDocument?.id ??
      null,

    actorId:
      actor?.id ??
      null,

    sceneId:
      combat?.scene?.id ??
      canvas?.scene?.id ??
      null,

    round:
      Number.isFinite(
        combat?.round
      )
        ? combat.round
        : null,

    turn:
      Number.isFinite(
        combat?.turn
      )
        ? combat.turn
        : null,

    speed:
      Number.isFinite(
        numericSpeed
      ) &&
      numericSpeed >= 0
        ? numericSpeed
        : null
  };
}


/* ============================================================
   Combat synchronization -- Identity comparison
   ============================================================ */

/**
 * Returns whether the current Frame Conn Turn state already
 * represents the supplied Foundry combat-turn context.
 *
 * Token and actor identity are intentionally not required for the
 * equality check because combat identity is canonically defined by:
 *
 *   - combat
 *   - combatant
 *   - round
 *   - turn
 *
 * This preserves the existing turn-feature.js behavior.
 */
function frameConnTurnMatchesCombatContext(
  currentState,
  context
) {
  const currentContext =
    currentState
      ?.context ??
    null;


  return Boolean(
    currentContext &&
    currentContext.combatId ===
      context.combatId &&
    currentContext.combatantId ===
      context.combatantId &&
    currentContext.round ===
      context.round &&
    currentContext.turn ===
      context.turn
  );
}


/* ============================================================
   Combat synchronization -- Canonical synchronization
   ============================================================ */

/**
 * Synchronizes the canonical Frame Conn Turn manager with a
 * Foundry Combat.
 *
 * Behavior:
 *
 *   no active combat
 *       ↓
 *   clear Frame Conn Turn
 *
 *
 *   same combat turn
 *       ↓
 *   preserve current Frame Conn Turn
 *
 *
 *   new combat turn
 *       ↓
 *   begin a new Frame Conn Turn using combat context
 */
function syncTurnStateToCombat(
  combat = game.combat
) {
  if (
    !combat?.started ||
    !combat.combatant
  ) {
    frameConnTurnState.clear();


    return null;
  }


  const context =
    activeCombatTurnContext(
      combat
    );


  if (
    frameConnTurnMatchesCombatContext(
      frameConnTurnState.current,
      context
    )
  ) {
    return (
      frameConnTurnState.current
    );
  }


  return (
    frameConnTurnState.beginTurn(
      context
    )
  );
}


/* ============================================================
   Combat hooks -- Combat start
   ============================================================ */

/**
 * Synchronizes Frame Conn immediately when Foundry starts combat.
 */
function handleFrameConnCombatStart(
  combat
) {
  return (
    syncTurnStateToCombat(
      combat
    )
  );
}


/* ============================================================
   Combat hooks -- Combat update
   ============================================================ */

/**
 * Responds only to Foundry Combat updates capable of changing the
 * canonical active-turn identity.
 *
 * Unrelated Combat document updates do not trigger Turn
 * synchronization.
 */
function handleFrameConnCombatUpdate(
  combat,
  changes
) {
  const turnChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "turn"
      );


  const roundChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "round"
      );


  const activeChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "active"
      );


  if (
    !turnChanged &&
    !roundChanged &&
    !activeChanged
  ) {
    return null;
  }


  return (
    syncTurnStateToCombat(
      combat
    )
  );
}


/* ============================================================
   Combat hooks -- Combat deletion
   ============================================================ */

/**
 * Clears the canonical Frame Conn Turn when the Foundry Combat
 * currently represented by that Turn is deleted.
 *
 * Deleting an unrelated Combat leaves the current Turn untouched.
 */
function handleFrameConnCombatDelete(
  combat
) {
  if (
    frameConnTurnState
      .current
      ?.context
      ?.combatId !==
    combat?.id
  ) {
    return null;
  }


  return (
    frameConnTurnState.clear()
  );
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  activeCombatTurnContext,

  frameConnTurnMatchesCombatContext,

  syncTurnStateToCombat,

  handleFrameConnCombatStart,

  handleFrameConnCombatUpdate,

  handleFrameConnCombatDelete
};
