/**
 * @file scripts/rules_features/status_conditions/engaged-status.js
 * @module engaged-status
 * @responsibility Own Frame Conn's derived Engaged status and Disengage suppression semantics.
 *
 * Engaged is a spatial relationship: hostile characters gain Engaged only while
 * their occupied Foundry grid spaces are adjacent. Native Lancer status
 * representation and mutation remain delegated to the caller-supplied native
 * status boundary.
 */

export function createEngagedStatusController({
  applyStatus,
  removeStatus,
  turnKey,
  actorUuid,
  tokens = () => globalThis.canvas?.tokens?.placeables ?? [],
  grid = () => globalThis.canvas?.grid ?? null,
  isGameMaster = () => Boolean(globalThis.game?.user?.isGM)
} = {}) {
  for (const [name, value] of Object.entries({
    applyStatus,
    removeStatus,
    turnKey,
    actorUuid
  })) {
    if (typeof value !== "function") {
      throw new TypeError(`Frame Conn Engaged status dependency ${name} must be a function.`);
    }
  }

  const disengagedActors = new Map();

  function hostilePair(leftToken, rightToken) {
    const left = Number(leftToken?.document?.disposition ?? leftToken?.disposition ?? 0);
    const right = Number(rightToken?.document?.disposition ?? rightToken?.disposition ?? 0);
    return left !== 0 && right !== 0 && Math.sign(left) !== Math.sign(right);
  }

  function occupiedGridOffsets(token) {
    const tokenDocument = token?.document ?? null;
    if (typeof tokenDocument?.getOccupiedGridSpaceOffsets !== "function") return [];

    const offsets = tokenDocument.getOccupiedGridSpaceOffsets();
    return Array.isArray(offsets) ? offsets : [];
  }

  /**
   * Foundry 13 exposes exact occupied grid spaces for a TokenDocument and an
   * exact grid adjacency test. Using those APIs avoids center-distance guesses
   * and correctly handles hex grids and Size 2+ token footprints.
   */
  function tokensAreAdjacent(leftToken, rightToken) {
    const activeGrid = grid();
    if (!activeGrid || typeof activeGrid.testAdjacency !== "function") return false;

    const leftOffsets = occupiedGridOffsets(leftToken);
    const rightOffsets = occupiedGridOffsets(rightToken);
    if (leftOffsets.length === 0 || rightOffsets.length === 0) return false;

    for (const leftOffset of leftOffsets) {
      for (const rightOffset of rightOffsets) {
        if (activeGrid.testAdjacency(leftOffset, rightOffset)) return true;
      }
    }

    return false;
  }

  async function applyDisengage(actor, combat = globalThis.game?.combat) {
    const uuid = actorUuid(actor);
    const activeTurnKey = turnKey(combat);
    if (!uuid || !activeTurnKey) {
      throw new Error("Disengage requires an active combat turn and authoritative actor.");
    }

    disengagedActors.set(uuid, { actorUuid: uuid, turnKey: activeTurnKey });
    await removeStatus(actor, "engaged");
    return Object.freeze({ actorUuid: uuid, turnKey: activeTurnKey });
  }

  function syncDisengage(combat = globalThis.game?.combat) {
    const currentTurnKey = turnKey(combat);
    for (const [uuid, record] of disengagedActors.entries()) {
      if (!currentTurnKey || record.turnKey !== currentTurnKey) {
        disengagedActors.delete(uuid);
      }
    }
    return true;
  }

  function isDisengaged(actor, combat = globalThis.game?.combat) {
    const record = disengagedActors.get(actorUuid(actor));
    return Boolean(record && record.turnKey === turnKey(combat));
  }

  /**
   * Reconcile the native Engaged status from actual hostile adjacency only.
   * GM-only mutation prevents multiple clients from racing to write statuses.
   */
  async function syncEngaged() {
    if (!isGameMaster()) return false;

    const sceneTokens = tokens();
    const expected = new Map();

    for (const token of sceneTokens) {
      if (token?.actor?.uuid) expected.set(token.actor.uuid, false);
    }

    for (let i = 0; i < sceneTokens.length; i += 1) {
      for (let j = i + 1; j < sceneTokens.length; j += 1) {
        const left = sceneTokens[i];
        const right = sceneTokens[j];
        if (!left?.actor || !right?.actor) continue;
        if (!hostilePair(left, right)) continue;
        if (!tokensAreAdjacent(left, right)) continue;

        expected.set(left.actor.uuid, true);
        expected.set(right.actor.uuid, true);
      }
    }

    for (const token of sceneTokens) {
      const actor = token?.actor;
      if (!actor?.uuid) continue;

      const shouldBeEngaged = expected.get(actor.uuid) === true && !isDisengaged(actor);
      const isEngaged = Boolean(actor.system?.statuses?.engaged);

      if (shouldBeEngaged && !isEngaged) await applyStatus(actor, "engaged");
      if (!shouldBeEngaged && isEngaged) await removeStatus(actor, "engaged");
    }

    return true;
  }

  function tokenUpdateChangesAdjacency(change = {}) {
    if (!change || typeof change !== "object") return false;
    return ["x", "y", "elevation", "width", "height"].some(key =>
      Object.prototype.hasOwnProperty.call(change, key)
    );
  }

  function diagnostics() {
    return Object.freeze({
      disengagedActors: [...disengagedActors.values()].map(record => ({ ...record }))
    });
  }

  return Object.freeze({
    applyDisengage,
    syncDisengage,
    isDisengaged,
    syncEngaged,
    tokenUpdateChangesAdjacency,
    tokensAreAdjacent,
    diagnostics
  });
}
