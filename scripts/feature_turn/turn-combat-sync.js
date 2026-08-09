/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-combat-sync.js
 */


/**
 * ============================================================
 * FRAME HELM TURN -- COMBAT SYNCHRONIZATION
 * ============================================================
 *
 * ROLE:
 *   Owns synchronization between the canonical Frame Helm Turn
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
 *   - Frame Helm Turn synchronization with active combat.
 *   - Combat-start handling.
 *   - Combat-update handling.
 *   - Combat-deletion handling.
 *
 * DOES NOT OWN:
 *   - FrameHelmTurnState.
 *   - FrameHelmTurnStateManager implementation.
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
 *        │ frameHelmTurnState
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
 *   FrameHelmFeatureRegistry.
 *
 *   turn-feature.js should expose these handlers through its
 *   feature definition:
 *
 *     hooks: {
 *       combatStart:
 *         handleFrameHelmCombatStart,
 *
 *       updateCombat:
 *         handleFrameHelmCombatUpdate,
 *
 *       deleteCombat:
 *         handleFrameHelmCombatDelete
 *     }
 *
 * SYNCHRONIZATION CONTRACT:
 *
 *   Frame Helm creates a new Turn state when any canonical combat
 *   identity field changes:
 *
 *     - combat id
 *     - combatant id
 *     - round
 *     - turn
 *
 *   If the active combat identity has not changed, the existing
 *   FrameHelmTurnState remains authoritative.
 *
 *   If combat is absent, stopped, or has no active combatant, the
 *   canonical Frame Helm Turn state is cleared.
 */


/* ============================================================
   Imports -- Canonical Turn manager
   ============================================================ */

import {
  frameHelmTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Combat context -- Active turn
   ============================================================ */

/**
 * Produces the canonical Frame Helm context for the currently
 * active Foundry combat turn.
 *
 * The returned object contains only the identity and initial state
 * required to construct/synchronize a FrameHelmTurnState.
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
 * Returns whether the current Frame Helm Turn state already
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
function frameHelmTurnMatchesCombatContext(
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
 * Synchronizes the canonical Frame Helm Turn manager with a
 * Foundry Combat.
 *
 * Behavior:
 *
 *   no active combat
 *       ↓
 *   clear Frame Helm Turn
 *
 *
 *   same combat turn
 *       ↓
 *   preserve current Frame Helm Turn
 *
 *
 *   new combat turn
 *       ↓
 *   begin a new Frame Helm Turn using combat context
 */
function syncTurnStateToCombat(
  combat = game.combat
) {
  if (
    !combat?.started ||
    !combat.combatant
  ) {
    frameHelmTurnState.clear();


    return null;
  }


  const context =
    activeCombatTurnContext(
      combat
    );


  if (
    frameHelmTurnMatchesCombatContext(
      frameHelmTurnState.current,
      context
    )
  ) {
    return (
      frameHelmTurnState.current
    );
  }


  return (
    frameHelmTurnState.beginTurn(
      context
    )
  );
}


/* ============================================================
   Combat hooks -- Combat start
   ============================================================ */

/**
 * Synchronizes Frame Helm immediately when Foundry starts combat.
 */
function handleFrameHelmCombatStart(
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
function handleFrameHelmCombatUpdate(
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
 * Clears the canonical Frame Helm Turn when the Foundry Combat
 * currently represented by that Turn is deleted.
 *
 * Deleting an unrelated Combat leaves the current Turn untouched.
 */
function handleFrameHelmCombatDelete(
  combat
) {
  if (
    frameHelmTurnState
      .current
      ?.context
      ?.combatId !==
    combat?.id
  ) {
    return null;
  }


  return (
    frameHelmTurnState.clear()
  );
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  activeCombatTurnContext,

  frameHelmTurnMatchesCombatContext,

  syncTurnStateToCombat,

  handleFrameHelmCombatStart,

  handleFrameHelmCombatUpdate,

  handleFrameHelmCombatDelete
};
