/**
 * @file scripts/rules_features/status_conditions/reactor-meltdown-status.js
 * @module reactor-meltdown-status
 * @responsibility Own imminent reactor-meltdown countdown state and the Engineering-check branch that can create or prevent that countdown.
 *
 * Foundry Lancer already reserves actor.system.meltdown_timer for this purpose
 * and clears it during Full Repair, but does not advance the countdown. Frame
 * Conn therefore uses that native field instead of inventing a duplicate timer.
 */

import { resolveReactorMeltdownExplosion } from "./reactor-meltdown-resolution.js";

const MODULE_ID = "lancer-frame-conn";
const MELTDOWN_FLAG = "reactor-meltdown-countdown";
const STAT_FLOW = "StatRollFlow";
const ENGINEERING_RESOLUTION_STEP = "frameConnResolveReactorMeltdownEngineeringCheck";

export function createReactorMeltdownStatusController({
  applyStatus,
  actorUuid,
  actorFromUuid,
  turnKey,
  installFlowStepBefore
} = {}) {
  for (const [name, value] of Object.entries({ applyStatus, actorUuid, actorFromUuid, turnKey, installFlowStepBefore })) {
    if (typeof value !== "function") {
      throw new TypeError(`Frame Conn Reactor Meltdown dependency ${name} must be a function.`);
    }
  }

  let observedCombatTurnKey = null;
  let observedCombatActorUuid = null;

  function canAdvanceCountdown(actor) {
    const users = [...(globalThis.game?.users ?? [])];
    const activeGmExists = users.some(user => user?.active && user?.isGM);
    if (activeGmExists) return Boolean(globalThis.game?.user?.isGM);
    return Boolean(actor?.isOwner);
  }

  function canMutateFromNativeFlow(actor) {
    return Boolean(globalThis.game?.user?.isGM || actor?.isOwner);
  }

  function timer(actor) {
    const value = actor?.system?.meltdown_timer;
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : null;
  }

  function record(actor) {
    return actor?.getFlag?.(MODULE_ID, MELTDOWN_FLAG) ?? null;
  }

  async function writeRecord(actor, value) {
    if (!actor?.isOwner || typeof actor.setFlag !== "function") return false;
    await actor.setFlag(MODULE_ID, MELTDOWN_FLAG, value);
    return true;
  }

  async function clearRecord(actor) {
    if (!actor?.isOwner || typeof actor.unsetFlag !== "function") return false;
    await actor.unsetFlag(MODULE_ID, MELTDOWN_FLAG);
    return true;
  }

  async function updateTimer(actor, value, { nativeFlowAuthority = false } = {}) {
    const authorized = nativeFlowAuthority
      ? canMutateFromNativeFlow(actor)
      : canAdvanceCountdown(actor);

    if (!authorized || typeof actor?.update !== "function") return false;
    await actor.update({ "system.meltdown_timer": value });
    return true;
  }

  async function schedule(actor, turns, { reason = "reactor-meltdown", combat = globalThis.game?.combat } = {}) {
    const countdown = Math.max(0, Math.floor(Number(turns)));
    if (!Number.isFinite(countdown)) throw new TypeError("Reactor meltdown countdown must be a finite number of turns.");

    const currentTurnKey = turnKey(combat);
    const currentActorUuid = combat?.combatant?.actor?.uuid ?? null;
    const uuid = actorUuid(actor);

    await updateTimer(actor, countdown, { nativeFlowAuthority: true });
    await writeRecord(actor, {
      actorUuid: uuid,
      stage: "countdown",
      reason,
      scheduledTurnKey: currentTurnKey,
      lastProcessedTurnKey: currentActorUuid === uuid ? currentTurnKey : null,
      scheduledAt: Date.now()
    });

    return Object.freeze({ actorUuid: uuid, timer: countdown, reason });
  }

  async function markEngineeringCheckPending(actor) {
    const existing = record(actor);
    await writeRecord(actor, {
      ...(existing && typeof existing === "object" ? existing : {}),
      actorUuid: actorUuid(actor),
      stage: "awaiting-engineering",
      awaitingEngineeringSince: Date.now()
    });
    return true;
  }

  async function clearCountdown(actor) {
    if (timer(actor) !== null) {
      await updateTimer(actor, null, { nativeFlowAuthority: true });
    }
    await clearRecord(actor);
    return true;
  }

  async function rollMeltdownDelay(actor) {
    const roll = await new Roll("1d6").evaluate();
    const total = Math.max(1, Math.floor(Number(roll.total) || 1));

    if (typeof roll.toMessage === "function") {
      await roll.toMessage({
        speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
        flavor: "REACTOR MELTDOWN // TURNS UNTIL DETONATION"
      });
    }

    return total;
  }

  async function resolveEngineeringCheck(state) {
    const actor = state?.actor ?? null;
    const data = state?.data ?? null;
    if (!actor || !data || data.path !== "system.eng") return true;

    const countdownRecord = record(actor);
    const activeTimer = timer(actor);
    const isInitialMeltdownCheck = countdownRecord?.stage === "awaiting-engineering";
    const isCountdownRetry = activeTimer !== null && countdownRecord?.stage === "countdown";
    if (!isInitialMeltdownCheck && !isCountdownRetry) return true;

    const total = Number(data?.result?.roll?.total);
    if (!Number.isFinite(total)) return true;

    if (total >= 10) {
      await applyStatus(actor, "exposed");
      await clearCountdown(actor);
      return true;
    }

    if (isInitialMeltdownCheck) {
      const delay = await rollMeltdownDelay(actor);
      await schedule(actor, delay, { reason: "failed-engineering-check" });
    }

    return true;
  }

  function installEngineeringResolution() {
    return installFlowStepBefore({
      stepName: ENGINEERING_RESOLUTION_STEP,
      beforeStep: "printStatRollCard",
      flowNames: [STAT_FLOW],
      step: resolveEngineeringCheck
    });
  }

  async function triggerMeltdown(actor) {
    if (!actor || !canAdvanceCountdown(actor)) return false;

    // Mark the native actor before resolving the terminal blast. The mech Actor
    // remains available for logs/history, while its scene Token is vaporized.
    await applyStatus(actor, "reactor_meltdown");

    const explosion = await resolveReactorMeltdownExplosion({ actor });

    await updateTimer(actor, null);
    await clearRecord(actor);

    return explosion;
  }

  async function beginActorTurn(actor, combat) {
    const currentTimer = timer(actor);
    if (currentTimer === null || currentTimer <= 0) return false;

    const currentTurnKey = turnKey(combat);
    const countdownRecord = record(actor) ?? {};
    if (!currentTurnKey) return false;
    if (countdownRecord.scheduledTurnKey === currentTurnKey) return false;
    if (countdownRecord.lastProcessedTurnKey === currentTurnKey) return false;

    await updateTimer(actor, currentTimer - 1);
    await writeRecord(actor, {
      ...countdownRecord,
      actorUuid: actorUuid(actor),
      stage: "countdown",
      lastProcessedTurnKey: currentTurnKey
    });
    return true;
  }

  async function finishActorTurn(actor) {
    if (!actor || timer(actor) !== 0) return false;
    return triggerMeltdown(actor);
  }

  function initializeCombat(combat = globalThis.game?.combat) {
    observedCombatTurnKey = turnKey(combat);
    observedCombatActorUuid = combat?.combatant?.actor?.uuid ?? null;
    return true;
  }

  async function syncCombat(combat = globalThis.game?.combat) {
    const currentTurnKey = turnKey(combat);
    if (!currentTurnKey) {
      observedCombatTurnKey = null;
      observedCombatActorUuid = null;
      return false;
    }

    const currentActorUuid = combat?.combatant?.actor?.uuid ?? null;
    if (observedCombatTurnKey === null) {
      observedCombatTurnKey = currentTurnKey;
      observedCombatActorUuid = currentActorUuid;
      return true;
    }

    if (currentTurnKey === observedCombatTurnKey) return false;

    const previousActor = actorFromUuid(observedCombatActorUuid);
    if (previousActor) await finishActorTurn(previousActor);

    const currentActor = actorFromUuid(currentActorUuid);
    if (currentActor) await beginActorTurn(currentActor, combat);

    observedCombatTurnKey = currentTurnKey;
    observedCombatActorUuid = currentActorUuid;
    return true;
  }

  async function reconcileActor(actor) {
    const countdownRecord = record(actor);
    if (timer(actor) === null && countdownRecord?.stage === "countdown") {
      await clearRecord(actor);
      return true;
    }
    return false;
  }

  return Object.freeze({
    timer,
    schedule,
    markEngineeringCheckPending,
    clearCountdown,
    resolveEngineeringCheck,
    installEngineeringResolution,
    initializeCombat,
    syncCombat,
    reconcileActor,
    triggerMeltdown
  });
}
