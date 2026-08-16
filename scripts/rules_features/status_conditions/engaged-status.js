/**
 * @file scripts/rules_features/status_conditions/engaged-status.js
 * @module engaged-status
 * @responsibility Own Frame Conn's derived Engaged status and Disengage suppression semantics.
 *
 * Engaged is continuously derived from hostile adjacency, with Grapple able to
 * force the relationship and Disengage suppressing it for the actor's current
 * turn. Native Lancer status representation and mutation remain delegated to
 * the caller-supplied native status boundary.
 */

export function createEngagedStatusController({
  applyStatus,
  removeStatus,
  distance,
  distanceConfigured,
  forcedPair,
  turnKey,
  actorUuid,
  tokens = () => globalThis.canvas?.tokens?.placeables ?? [],
  isGameMaster = () => Boolean(globalThis.game?.user?.isGM)
} = {}) {
  for (const [name, value] of Object.entries({
    applyStatus,
    removeStatus,
    distance,
    distanceConfigured,
    forcedPair,
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

  const hiddenActor = actor => Boolean(actor?.system?.statuses?.hidden);

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
   * Engaged is continuously derived from hostile adjacency. GM-only mutation
   * prevents multiple clients from racing to write the same native status.
   */
  async function syncEngaged() {
    if (!isGameMaster() || !distanceConfigured()) return false;

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

        const isForcedPair = Boolean(forcedPair(left.actor, right.actor));
        if (!hostilePair(left, right) && !isForcedPair) continue;
        if (!isForcedPair && (hiddenActor(left.actor) || hiddenActor(right.actor))) continue;

        const measuredDistance = distance(left, right);
        if (!Number.isFinite(measuredDistance) || measuredDistance > 1) continue;

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
    diagnostics
  });
}
