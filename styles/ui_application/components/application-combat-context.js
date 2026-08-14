/* ============================================================
   Application transitional combat-context resolution
   ============================================================ */

/**
 * Temporary preservation of the combat-context data previously
 * supplied by activeCombatTurnContext().
 *
 * Turn owns authoritative combat synchronization. This helper
 * exists only so manual Begin Turn Plan behavior remains intact
 * without referencing the removed monolithic runtime symbol.
 */
function getFrameConnApplicationCombatContext(
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
   Exports
   ============================================================ */

export {
  getFrameConnApplicationCombatContext
};
