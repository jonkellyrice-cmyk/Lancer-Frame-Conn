/**
 * @file scripts/rules_features/status_conditions/danger-zone-status.js
 * @module danger-zone-status
 * @responsibility Derive Lancer Danger Zone from current Heat and Heat Cap when the native Foundry Lancer system does not persist the status automatically.
 */

export function createDangerZoneStatusController({
  applyStatus,
  removeStatus,
  actorUuid,
  actors = () => globalThis.game?.actors?.contents ?? []
} = {}) {
  for (const [name, value] of Object.entries({ applyStatus, removeStatus, actorUuid })) {
    if (typeof value !== "function") {
      throw new TypeError(`Frame Conn Danger Zone dependency ${name} must be a function.`);
    }
  }

  function canAuthoritativelyMutateActor(actor) {
    const users = [...(globalThis.game?.users ?? [])];
    const activeGmExists = users.some(user => user?.active && user?.isGM);
    if (activeGmExists) return Boolean(globalThis.game?.user?.isGM);
    return Boolean(actor?.isOwner);
  }

  function threshold(actor) {
    const heatCap = Number(actor?.system?.heat?.max);
    if (!Number.isFinite(heatCap) || heatCap <= 0) return null;
    return Math.ceil(heatCap / 2);
  }

  async function syncActor(actor) {
    if (!actor || actor.type !== "mech") return false;

    const heat = Number(actor?.system?.heat?.value);
    const heatCap = Number(actor?.system?.heat?.max);
    const dangerThreshold = threshold(actor);
    if (!Number.isFinite(heat) || dangerThreshold === null) return false;

    const shouldBeActive = heat >= dangerThreshold;
    const isActive = Boolean(actor?.system?.statuses?.dangerzone);

    if (shouldBeActive === isActive) {
      return Object.freeze({
        actorUuid: actorUuid(actor),
        heat,
        heatCap,
        threshold: dangerThreshold,
        active: isActive,
        changed: false
      });
    }

    if (!canAuthoritativelyMutateActor(actor)) return false;

    const result = shouldBeActive
      ? await applyStatus(actor, "dangerzone")
      : await removeStatus(actor, "dangerzone");

    return Object.freeze({
      actorUuid: actorUuid(actor),
      heat,
      heatCap,
      threshold: dangerThreshold,
      active: shouldBeActive,
      changed: Boolean(result?.changed)
    });
  }

  async function syncAll() {
    const results = [];
    for (const actor of [...actors()]) {
      if (actor?.type !== "mech") continue;
      results.push(await syncActor(actor));
    }
    return Object.freeze(results);
  }

  return Object.freeze({ threshold, syncActor, syncAll });
}
