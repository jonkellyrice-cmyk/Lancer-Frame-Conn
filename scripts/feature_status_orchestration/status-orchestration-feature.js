/**
 * @file scripts/feature_status_orchestration/status-orchestration-feature.js
 * @module status-orchestration-feature
 * @responsibility Own Frame Conn rules for when native Lancer statuses should be applied or removed.
 *
 * Native Adapter owns status representation/mutation. This feature owns only
 * action/lifecycle/spatial orchestration that native Lancer does not provide.
 */
import { defineFrameConnFeature } from "../feature-contract.js";

const MODULE_ID = "lancer-frame-conn";
const TIMED_FLAG = "timed-statuses";
const GRAPPLE_FLAG = "grapple-relationships";

const runtime = { applyStatus: null, removeStatus: null, distance: null };
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
    spatialDistance: typeof runtime.distance === "function"
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

/** Statuses persist until the end of this target's next turn, not its current turn. */
async function applyUntilEndOfNextTurn(actor, statusIds, { combat = globalThis.game?.combat, sourceActionId = null } = {}) {
  const uuid = actorUuid(actor);
  if (!uuid) throw new Error("Timed native statuses require an authoritative target actor.");
  await applyStatuses(actor, statusIds);
  const record = {
    targetActorUuid: uuid,
    statusIds: [...statusIds],
    combatId: combat?.id ?? null,
    appliedTurnKey: turnKey(combat),
    activeTargetTurnKey: null,
    sourceActionId,
    appliedAt: Date.now()
  };
  timedStatuses.set(uuid, record);
  await bestEffortSetFlag(actor, TIMED_FLAG, record);
  return Object.freeze({ ...record });
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
  await applyStatuses(attacker, ["grappled", "engaged"]);
  await applyStatuses(target, ["grappled", "engaged"]);
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
  return Object.freeze({ ...record });
}

async function clearGrapple(record) {
  const attacker = actorFromUuid(record?.attackerActorUuid);
  const target = actorFromUuid(record?.targetActorUuid);
  for (const actor of [attacker, target].filter(Boolean)) {
    await removeNativeStatus(actor, "grappled");
    if (actor.uuid === record?.immobilizedActorUuid) await removeNativeStatus(actor, "immobilized");
    await bestEffortUnsetFlag(actor, GRAPPLE_FLAG);
  }
  grapples.delete(record?.id);
  await syncEngaged();
  return true;
}

async function endGrappleForActor(actor) {
  const uuid = actorUuid(actor);
  const matches = [...grapples.values()].filter(record => record.attackerActorUuid === uuid || record.targetActorUuid === uuid);
  for (const record of matches) await clearGrapple(record);
  return matches.length;
}

function hostilePair(leftToken, rightToken) {
  const left = Number(leftToken?.document?.disposition ?? leftToken?.disposition ?? 0);
  const right = Number(rightToken?.document?.disposition ?? rightToken?.disposition ?? 0);
  return left !== 0 && right !== 0 && Math.sign(left) !== Math.sign(right);
}

const hiddenActor = actor => Boolean(actor?.system?.statuses?.hidden);
const grappleForcesPair = (leftActor, rightActor) => grapples.has(grappleId(leftActor, rightActor));

/** Engaged is continuously derived from hostile adjacency. GM-only mutation avoids client write races. */
async function syncEngaged() {
  if (!globalThis.game?.user?.isGM || typeof runtime.distance !== "function") return false;
  const tokens = globalThis.canvas?.tokens?.placeables ?? [];
  const expected = new Map();
  for (const token of tokens) if (token?.actor?.uuid) expected.set(token.actor.uuid, false);
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) {
      const left = tokens[i];
      const right = tokens[j];
      if (!left?.actor || !right?.actor) continue;
      const forced = grappleForcesPair(left.actor, right.actor);
      if (!hostilePair(left, right) && !forced) continue;
      if (!forced && (hiddenActor(left.actor) || hiddenActor(right.actor))) continue;
      const distance = runtime.distance(left, right);
      if (!Number.isFinite(distance) || distance > 1) continue;
      expected.set(left.actor.uuid, true);
      expected.set(right.actor.uuid, true);
    }
  }
  for (const token of tokens) {
    const actor = token?.actor;
    if (!actor?.uuid) continue;
    const shouldBeEngaged = expected.get(actor.uuid) === true;
    const isEngaged = Boolean(actor.system?.statuses?.engaged);
    if (shouldBeEngaged && !isEngaged) await applyNativeStatus(actor, "engaged");
    if (!shouldBeEngaged && isEngaged) await removeNativeStatus(actor, "engaged");
  }
  return true;
}

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

async function handleCombatUpdate(combat) {
  await syncTimedStatuses(combat);
  await syncGrapples();
  await syncEngaged();
  return true;
}
async function handleTokenUpdate() { await syncGrapples(); await syncEngaged(); return true; }
async function handleCombatDelete(combat) {
  for (const record of [...timedStatuses.values()]) if (!record.combatId || record.combatId === combat?.id) await clearTimedRecord(record);
  for (const record of [...grapples.values()]) await clearGrapple(record);
  await syncEngaged();
  return true;
}
function diagnostics() { return Object.freeze({ runtimeBindings: runtimeBindings(), timedStatuses: [...timedStatuses.values()].map(record => ({ ...record })), grapples: [...grapples.values()].map(record => ({ ...record })) }); }

export const frameConnStatusOrchestrationFeature = defineFrameConnFeature({
  id: "status-orchestration",
  domain: "status.orchestration",
  provides: ["status.orchestration", "status.timed", "status.grapple", "status.engaged.derived"],
  dependsOn: ["native-adapter.status", "sensors.measurement"],
  optionalDependsOn: [],
  state: {},
  commands: { configureRuntime, applyStatuses, removeStatuses, applyUntilEndOfNextTurn, establishGrapple, endGrappleForActor, syncTimedStatuses, syncGrapples, syncEngaged },
  queries: { diagnostics, runtimeBindings },
  hooks: { updateCombat: handleCombatUpdate, updateToken: handleTokenUpdate, deleteCombat: handleCombatDelete, canvasReady: syncEngaged },
  lifecycle: {},
  api: { configureRuntime, applyStatuses, removeStatuses, applyUntilEndOfNextTurn, establishGrapple, endGrappleForActor, syncTimedStatuses, syncGrapples, syncEngaged, diagnostics, runtimeBindings },
  metadata: { label: "Status Orchestration", nativeStatusAuthority: "native-adapter.status", coverPolicy: "Cover remains attacker-relative and is not represented as one global persistent status." }
});
