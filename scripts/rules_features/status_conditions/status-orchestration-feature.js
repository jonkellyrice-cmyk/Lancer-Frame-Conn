/**
 * @file scripts/feature_status_orchestration/status-orchestration-feature.js
 * @module status-orchestration-feature
 * @responsibility Own Frame Conn rules for when native Lancer statuses should be applied or removed.
 *
 * Native Adapter owns status representation/mutation. This feature owns only
 * action/lifecycle/spatial orchestration that native Lancer does not provide.
 */
import { defineFrameConnFeature } from "../../feature-contract.js";
import { createEngagedStatusController } from "./engaged-status.js";
import { createDangerZoneStatusController } from "./danger-zone-status.js";
import { createOverheatingStatusController } from "./overheating-status.js";
import { createReactorMeltdownStatusController } from "./reactor-meltdown-status.js";
import { createStructureDamageStatusController } from "./structure-damage-status.js";

const MODULE_ID = "lancer-frame-conn";
const TIMED_FLAG = "timed-statuses";
const GRAPPLE_FLAG = "grapple-relationships";

const runtime = { applyStatus: null, removeStatus: null, distance: null, installNativeFlowStepBefore: null };
const timedStatuses = new Map();
const grapples = new Map();

function configureRuntime(bindings = {}) {
  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    throw new TypeError("Frame Conn Status Orchestration runtime bindings must be an object.");
  }
  for (const [key, value] of Object.entries(bindings)) {
    if (!(key in runtime)) throw new Error(`Frame Conn Status Orchestration received unknown runtime binding: ${key}`);
    if (value !== null && typeof value !== "function") throw new TypeError(`Frame Conn Status Orchestration binding ${key} must be a function or null.`);
    runtime[key] = value;
  }
  return runtimeBindings();
}

function runtimeBindings() {
  return Object.freeze({
    statusApplication: typeof runtime.applyStatus === "function",
    statusRemoval: typeof runtime.removeStatus === "function",
    spatialDistance: typeof runtime.distance === "function",
    nativeFlowExtension: typeof runtime.installNativeFlowStepBefore === "function"
  });
}

const actorUuid = actor => actor?.uuid ?? null;

function turnKey(combat = globalThis.game?.combat) {
  return combat?.id && combat.started && Number.isFinite(combat.round) && Number.isFinite(combat.turn)
    ? `${combat.id}:${combat.round}:${combat.turn}`
    : null;
}

function actorFromUuid(uuid) {
  if (!uuid || typeof globalThis.fromUuidSync !== "function") return null;
  const resolved = globalThis.fromUuidSync(uuid);
  return resolved?.actor ?? (resolved?.documentName === "Actor" ? resolved : null);
}

function tokenForActor(actor) {
  if (!actor) return null;
  return globalThis.canvas?.tokens?.placeables?.find(token => token?.actor?.uuid === actor.uuid || token?.actor?.id === actor.id) ?? null;
}

function nativeSize(actor, token = tokenForActor(actor)) {
  for (const value of [actor?.system?.derived?.size, actor?.system?.size, token?.document?.width]) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 1;
}

async function applyNativeStatus(actor, statusId) {
  if (typeof runtime.applyStatus !== "function") throw new Error("Frame Conn Status Orchestration status application is not configured.");
  return runtime.applyStatus(actor, statusId);
}

async function removeNativeStatus(actor, statusId) {
  if (typeof runtime.removeStatus !== "function") throw new Error("Frame Conn Status Orchestration status removal is not configured.");
  return runtime.removeStatus(actor, statusId);
}

async function bestEffortSetFlag(actor, key, value) {
  if (!actor?.isOwner || typeof actor.setFlag !== "function") return false;
  await actor.setFlag(MODULE_ID, key, value);
  return true;
}

async function bestEffortUnsetFlag(actor, key) {
  if (!actor?.isOwner || typeof actor.unsetFlag !== "function") return false;
  await actor.unsetFlag(MODULE_ID, key);
  return true;
}

function nativeStatusConfigured(statusId) {
  return Array.isArray(globalThis.CONFIG?.statusEffects) &&
    globalThis.CONFIG.statusEffects.some(status => status?.id === statusId);
}

async function applyStatuses(actor, statusIds = []) {
  const results = [];
  for (const statusId of statusIds) results.push(await applyNativeStatus(actor, statusId));
  return Object.freeze(results);
}

async function removeStatuses(actor, statusIds = []) {
  const results = [];
  for (const statusId of statusIds) results.push(await removeNativeStatus(actor, statusId));
  return Object.freeze(results);
}

/**
 * Statuses persist until the end of this target's next turn, not its current
 * turn. Cleanup owns only statuses that Frame Conn actually introduced.
 * Reapplying the same Frame Conn effect refreshes the duration of statuses
 * already owned by the existing timed record.
 */
async function applyUntilEndOfNextTurn(actor, statusIds, { combat = globalThis.game?.combat, sourceActionId = null } = {}) {
  const uuid = actorUuid(actor);
  if (!uuid) throw new Error("Timed native statuses require an authoritative target actor.");

  const existing = timedStatuses.get(uuid) ?? null;
  const ownedStatusIds = new Set(existing?.statusIds ?? []);

  for (const statusId of statusIds) {
    const result = await applyNativeStatus(actor, statusId);
    if (result?.changed && result?.active) {
      ownedStatusIds.add(statusId);
    }
  }

  if (ownedStatusIds.size === 0) {
    return Object.freeze({
      targetActorUuid: uuid,
      statusIds: [],
      combatId: combat?.id ?? null,
      appliedTurnKey: turnKey(combat),
      activeTargetTurnKey: null,
      sourceActionId,
      appliedAt: Date.now(),
      tracked: false
    });
  }

  const record = {
    targetActorUuid: uuid,
    statusIds: [...ownedStatusIds],
    combatId: combat?.id ?? existing?.combatId ?? null,
    appliedTurnKey: turnKey(combat),
    activeTargetTurnKey: null,
    sourceActionId,
    appliedAt: Date.now()
  };
  timedStatuses.set(uuid, record);
  await bestEffortSetFlag(actor, TIMED_FLAG, record);
  return Object.freeze({ ...record, tracked: true });
}

async function clearTimedRecord(record) {
  const actor = actorFromUuid(record?.targetActorUuid);
  if (actor) {
    await removeStatuses(actor, record.statusIds ?? []);
    await bestEffortUnsetFlag(actor, TIMED_FLAG);
  }
  timedStatuses.delete(record?.targetActorUuid);
}

async function syncTimedStatuses(combat = globalThis.game?.combat) {
  const currentTurn = turnKey(combat);
  if (!currentTurn) return false;
  const activeActorUuid = combat?.combatant?.actor?.uuid ?? null;
  for (const record of [...timedStatuses.values()]) {
    if (record.combatId && record.combatId !== combat.id) continue;
    if (record.activeTargetTurnKey) {
      if (record.activeTargetTurnKey !== currentTurn) await clearTimedRecord(record);
      continue;
    }
    if (activeActorUuid === record.targetActorUuid && currentTurn !== record.appliedTurnKey) {
      record.activeTargetTurnKey = currentTurn;
      timedStatuses.set(record.targetActorUuid, record);
      const actor = actorFromUuid(record.targetActorUuid);
      if (actor) await bestEffortSetFlag(actor, TIMED_FLAG, record);
    }
  }
  return true;
}

function grappleId(left, right) {
  return [actorUuid(left), actorUuid(right)].filter(Boolean).sort().join("::");
}

async function establishGrapple(attacker, target) {
  if (!attacker || !target) throw new Error("Grapple requires two authoritative actors.");
  const relationshipStatuses = nativeStatusConfigured("grappled")
    ? ["grappled"]
    : [];
  await applyStatuses(attacker, relationshipStatuses);
  await applyStatuses(target, relationshipStatuses);
  const attackerSize = nativeSize(attacker);
  const targetSize = nativeSize(target);
  let immobilizedActorUuid = null;
  if (attackerSize < targetSize) {
    await applyNativeStatus(attacker, "immobilized");
    immobilizedActorUuid = actorUuid(attacker);
  } else if (targetSize < attackerSize) {
    await applyNativeStatus(target, "immobilized");
    immobilizedActorUuid = actorUuid(target);
  }
  const id = grappleId(attacker, target);
  const record = { id, attackerActorUuid: actorUuid(attacker), targetActorUuid: actorUuid(target), immobilizedActorUuid, createdAt: Date.now() };
  grapples.set(id, record);
  await bestEffortSetFlag(attacker, GRAPPLE_FLAG, record);
  await bestEffortSetFlag(target, GRAPPLE_FLAG, record);
  await engagedStatus.syncEngaged();
  return Object.freeze({ ...record });
}

async function clearGrapple(record) {
  const attacker = actorFromUuid(record?.attackerActorUuid);
  const target = actorFromUuid(record?.targetActorUuid);
  for (const actor of [attacker, target].filter(Boolean)) {
    if (nativeStatusConfigured("grappled")) await removeNativeStatus(actor, "grappled");
    if (actor.uuid === record?.immobilizedActorUuid) await removeNativeStatus(actor, "immobilized");
    await bestEffortUnsetFlag(actor, GRAPPLE_FLAG);
  }
  grapples.delete(record?.id);
  await engagedStatus.syncEngaged();
  return true;
}

function getGrapplesForActor(actor) {
  const uuid = actorUuid(actor);
  return Object.freeze(
    [...grapples.values()]
      .filter(record => record.attackerActorUuid === uuid || record.targetActorUuid === uuid)
      .map(record => Object.freeze({ ...record }))
  );
}

function getGrappleBetween(leftActor, rightActor) {
  return grapples.get(grappleId(leftActor, rightActor)) ?? null;
}

async function endGrappleBetween(leftActor, rightActor) {
  const record = getGrappleBetween(leftActor, rightActor);
  if (!record) return false;
  await clearGrapple(record);
  return true;
}

async function endGrappleForActor(actor) {
  const matches = getGrapplesForActor(actor);
  for (const record of matches) await clearGrapple(record);
  return matches.length;
}

const engagedStatus = createEngagedStatusController({
  applyStatus: applyNativeStatus,
  removeStatus: removeNativeStatus,
  turnKey,
  actorUuid
});

const dangerZoneStatus = createDangerZoneStatusController({
  applyStatus: applyNativeStatus,
  removeStatus: removeNativeStatus,
  actorUuid
});

const installStatusOrchestrationFlowStepBefore = options => {
  if (typeof runtime.installNativeFlowStepBefore !== "function") {
    throw new Error("Frame Conn Status Orchestration native Flow extension is not configured.");
  }
  return runtime.installNativeFlowStepBefore(options);
};

const reactorMeltdownStatus = createReactorMeltdownStatusController({
  applyStatus: applyNativeStatus,
  actorUuid,
  actorFromUuid,
  turnKey,
  installFlowStepBefore: installStatusOrchestrationFlowStepBefore
});

const overheatingStatus = createOverheatingStatusController({
  applyStatus: applyNativeStatus,
  applyUntilEndOfNextTurn,
  installFlowStepBefore: installStatusOrchestrationFlowStepBefore,
  scheduleReactorMeltdown: reactorMeltdownStatus.schedule,
  markReactorEngineeringCheckPending: reactorMeltdownStatus.markEngineeringCheckPending
});

const structureDamageStatus = createStructureDamageStatusController({
  applyUntilEndOfNextTurn,
  installFlowStepBefore: installStatusOrchestrationFlowStepBefore
});

async function syncGrapples() {
  if (typeof runtime.distance !== "function") return false;
  for (const record of [...grapples.values()]) {
    const attacker = actorFromUuid(record.attackerActorUuid);
    const target = actorFromUuid(record.targetActorUuid);
    const attackerToken = tokenForActor(attacker);
    const targetToken = tokenForActor(target);
    if (!attackerToken || !targetToken) continue;
    const distance = runtime.distance(attackerToken, targetToken);
    if (Number.isFinite(distance) && distance > 1) await clearGrapple(record);
  }
  return true;
}

function validTimedRecord(record) {
  return Boolean(
    record?.targetActorUuid &&
    Array.isArray(record?.statusIds)
  );
}

function validGrappleRecord(record) {
  return Boolean(
    record?.id &&
    record?.attackerActorUuid &&
    record?.targetActorUuid
  );
}

function hydrateStatusOrchestrationState() {
  const tokens = globalThis.canvas?.tokens?.placeables ?? [];

  for (const token of tokens) {
    const actor = token?.actor ?? null;
    if (!actor || typeof actor.getFlag !== "function") continue;

    const timedRecord = actor.getFlag(MODULE_ID, TIMED_FLAG);
    if (validTimedRecord(timedRecord)) {
      timedStatuses.set(timedRecord.targetActorUuid, { ...timedRecord });
    }

    const grappleRecord = actor.getFlag(MODULE_ID, GRAPPLE_FLAG);
    if (validGrappleRecord(grappleRecord)) {
      grapples.set(grappleRecord.id, { ...grappleRecord });
    }
  }

  return Object.freeze({
    timedStatuses: timedStatuses.size,
    grapples: grapples.size
  });
}

async function handleCombatUpdate(combat) {
  hydrateStatusOrchestrationState();
  engagedStatus.syncDisengage(combat);
  await reactorMeltdownStatus.syncCombat(combat);
  await syncTimedStatuses(combat);
  await syncGrapples();
  await dangerZoneStatus.syncAll();
  return true;
}
async function handleTokenUpdate(tokenDocument, change = {}) {
  if (!engagedStatus.tokenUpdateChangesAdjacency(change)) return false;
  hydrateStatusOrchestrationState();
  await syncGrapples();
  await engagedStatus.syncEngaged({
    updatedTokenDocument: tokenDocument,
    updateChange: change
  });
  return true;
}
async function handleActorUpdate(actor) {
  await reactorMeltdownStatus.reconcileActor(actor);
  await structureDamageStatus.reconcileActor(actor);
  return dangerZoneStatus.syncActor(actor);
}
async function handleCombatDelete(combat) {
  for (const record of [...timedStatuses.values()]) if (!record.combatId || record.combatId === combat?.id) await clearTimedRecord(record);
  for (const record of [...grapples.values()]) await clearGrapple(record);
  return true;
}
function diagnostics() { return Object.freeze({ runtimeBindings: runtimeBindings(), timedStatuses: [...timedStatuses.values()].map(record => ({ ...record })), grapples: [...grapples.values()].map(record => ({ ...record })), engaged: engagedStatus.diagnostics() }); }

export const frameConnStatusOrchestrationFeature = defineFrameConnFeature({
  id: "status-orchestration",
  domain: "status.orchestration",
  provides: ["status.orchestration", "status.timed", "status.grapple", "status.engaged.derived", "status.danger-zone.derived", "status.overheat-consequences", "status.reactor-meltdown-countdown", "status.structure-damage-consequences"],
  dependsOn: ["native-adapter.status", "native-adapter.rolls", "native-adapter.flow-extension", "sensors.measurement"],
  optionalDependsOn: [],
  state: {},
  commands: { configureRuntime, applyStatuses, removeStatuses, applyUntilEndOfNextTurn, establishGrapple, endGrappleBetween, endGrappleForActor, applyDisengage: engagedStatus.applyDisengage, syncTimedStatuses, syncGrapples, syncEngaged: engagedStatus.syncEngaged, syncDangerZone: dangerZoneStatus.syncActor, syncDangerZones: dangerZoneStatus.syncAll, installOverheatingConsequences: overheatingStatus.install, installReactorMeltdownEngineeringResolution: reactorMeltdownStatus.installEngineeringResolution, installStructureDamageConsequences: structureDamageStatus.install, syncReactorMeltdownCountdown: reactorMeltdownStatus.syncCombat },
  queries: { diagnostics, runtimeBindings, isDisengaged: engagedStatus.isDisengaged, getGrapplesForActor, getGrappleBetween, hydrateStatusOrchestrationState, dangerZoneThreshold: dangerZoneStatus.threshold, reactorMeltdownTimer: reactorMeltdownStatus.timer },
  hooks: { updateCombat: handleCombatUpdate, updateToken: handleTokenUpdate, updateActor: handleActorUpdate, deleteCombat: handleCombatDelete, canvasReady: async () => { overheatingStatus.install(); reactorMeltdownStatus.installEngineeringResolution(); structureDamageStatus.install(); reactorMeltdownStatus.initializeCombat(); hydrateStatusOrchestrationState(); await syncGrapples(); await engagedStatus.syncEngaged(); return dangerZoneStatus.syncAll(); } },
  lifecycle: {},
  api: { configureRuntime, applyStatuses, removeStatuses, applyUntilEndOfNextTurn, establishGrapple, getGrapplesForActor, getGrappleBetween, endGrappleBetween, endGrappleForActor, applyDisengage: engagedStatus.applyDisengage, isDisengaged: engagedStatus.isDisengaged, hydrateStatusOrchestrationState, syncTimedStatuses, syncGrapples, syncEngaged: engagedStatus.syncEngaged, dangerZoneThreshold: dangerZoneStatus.threshold, syncDangerZone: dangerZoneStatus.syncActor, syncDangerZones: dangerZoneStatus.syncAll, installOverheatingConsequences: overheatingStatus.install, installReactorMeltdownEngineeringResolution: reactorMeltdownStatus.installEngineeringResolution, installStructureDamageConsequences: structureDamageStatus.install, reactorMeltdownTimer: reactorMeltdownStatus.timer, scheduleReactorMeltdown: reactorMeltdownStatus.schedule, clearReactorMeltdown: reactorMeltdownStatus.clearCountdown, syncReactorMeltdownCountdown: reactorMeltdownStatus.syncCombat, diagnostics, runtimeBindings },
  metadata: { label: "Status Orchestration", nativeStatusAuthority: "native-adapter.status", coverPolicy: "Cover remains attacker-relative and is not represented as one global persistent status." }
});
