/**
 * @file scripts/feature_brace/brace-feature.js
 * @module brace-feature
 * @responsibility Orchestrate Brace over native Lancer damage and attack boundaries.
 *
 * Frame Conn owns timing/state. Native Lancer remains authoritative for damageCalc
 * and attack Flow execution. Native packed braced/bracedCooldown fields are not used.
 */
import { defineFrameConnFeature } from "../../feature-contract.js";

const MODULE_ID = "lancer-frame-conn";
const FLAG = "brace";
const ACTION_ID = "reaction.brace";
const FLOW_STEP = "frameConnApplyBraceAttackDifficulty";
const ATTACK_FLOWS = Object.freeze(["WeaponAttackFlow", "BasicAttackFlow", "TechAttackFlow"]);

const runtime = {
  canUseReaction: null,
  useReaction: null,
  releaseReaction: null,
  setReactionLock: null,
  applyTurnRestriction: null,
  installNativeFlowStepBefore: null
};

function configureRuntime(bindings = {}) {
  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    throw new TypeError("Frame Conn Brace runtime bindings must be an object.");
  }
  for (const [key, value] of Object.entries(bindings)) {
    if (!(key in runtime)) throw new Error(`Frame Conn Brace received unknown runtime binding: ${key}`);
    if (value !== null && typeof value !== "function") {
      throw new TypeError(`Frame Conn Brace runtime binding \"${key}\" must be a function or null.`);
    }
    runtime[key] = value;
  }
  return runtimeBindings();
}

function runtimeBindings() {
  return Object.freeze({
    reactionAvailability: typeof runtime.canUseReaction === "function",
    reactionSpending: typeof runtime.useReaction === "function",
    reactionRollback: typeof runtime.releaseReaction === "function",
    reactionLocking: typeof runtime.setReactionLock === "function",
    turnRestriction: typeof runtime.applyTurnRestriction === "function",
    nativeFlowExtension: typeof runtime.installNativeFlowStepBefore === "function"
  });
}

function turnKey(combat = globalThis.game?.combat) {
  return combat?.id && combat.started && Number.isFinite(combat.round) && Number.isFinite(combat.turn)
    ? `${combat.id}:${combat.round}:${combat.turn}`
    : null;
}

function roundKey(combat = globalThis.game?.combat) {
  return combat?.id && combat.started && Number.isFinite(combat.round)
    ? `${combat.id}:${combat.round}`
    : null;
}

const actorKey = actor => actor?.uuid ?? actor?.id ?? null;
const isMech = actor => Boolean(actor && (typeof actor.is_mech === "function" ? actor.is_mech() : actor.type === "mech"));

function stateFor(actor) {
  const state = actor?.getFlag?.(MODULE_ID, FLAG);
  if (!state || typeof state !== "object") return null;
  return {
    actorKey: state.actorKey ?? actorKey(actor),
    combatId: state.combatId ?? null,
    usedRoundKey: state.usedRoundKey ?? null,
    declaredTurnKey: state.declaredTurnKey ?? null,
    restrictionTurnKey: state.restrictionTurnKey ?? null,
    aftermathActive: state.aftermathActive === true,
    triggeringMessageId: state.triggeringMessageId ?? null,
    triggeringTargetUuid: state.triggeringTargetUuid ?? null,
    declaredAt: Number.isFinite(state.declaredAt) ? state.declaredAt : null
  };
}

async function writeState(actor, state) {
  if (!actor?.isOwner || typeof actor.setFlag !== "function") {
    throw new Error("Frame Conn Brace state can only be written by an owner of the affected actor.");
  }
  await actor.setFlag(MODULE_ID, FLAG, state);
  return stateFor(actor);
}

async function clearState(actor) {
  if (!actor?.isOwner || typeof actor.unsetFlag !== "function") return false;
  await actor.unsetFlag(MODULE_ID, FLAG);
  return true;
}

function actorFromUuid(uuid) {
  if (!uuid || typeof fromUuidSync !== "function") return null;
  const resolved = fromUuidSync(uuid);
  return resolved?.actor ?? (resolved?.documentName === "Actor" ? resolved : null);
}

function aftermathActive(actor, combat = globalThis.game?.combat) {
  const state = stateFor(actor);
  return Boolean(state?.aftermathActive && combat?.id && state.combatId === combat.id);
}

function canUse(actor, { combat = globalThis.game?.combat } = {}) {
  if (!isMech(actor)) return { allowed: false, reason: "Brace requires a mech actor." };
  if (!actor.isOwner) return { allowed: false, reason: "You do not own this actor." };
  const currentTurn = turnKey(combat);
  const currentRound = roundKey(combat);
  if (!currentTurn || !currentRound) return { allowed: false, reason: "Brace requires an active combat turn." };
  const existing = stateFor(actor);
  if (existing?.aftermathActive && existing.combatId === combat.id) {
    return { allowed: false, reason: "Brace is already active until the end of this mech's next turn." };
  }
  if (existing?.usedRoundKey === currentRound) return { allowed: false, reason: "Brace has already been used this round." };
  if (typeof runtime.canUseReaction !== "function") {
    return { allowed: false, reason: "Frame Conn reaction availability is not configured." };
  }
  return runtime.canUseReaction(actor, ACTION_ID, { combat });
}

async function activate(actor, { combat = globalThis.game?.combat, messageId = null, targetUuid = null } = {}) {
  const permission = canUse(actor, { combat });
  if (!permission.allowed) throw new Error(permission.reason);
  if (typeof runtime.useReaction !== "function" || typeof runtime.setReactionLock !== "function") {
    throw new Error("Frame Conn Brace reaction runtime is incomplete.");
  }
  runtime.useReaction(actor, ACTION_ID, { combat });
  runtime.setReactionLock(actor, true, { combat, reason: "Brace prevents reactions until the end of the mech's next turn." });
  const next = {
    actorKey: actorKey(actor), combatId: combat.id, usedRoundKey: roundKey(combat),
    declaredTurnKey: turnKey(combat), restrictionTurnKey: null, aftermathActive: true,
    triggeringMessageId: messageId, triggeringTargetUuid: targetUuid, declaredAt: Date.now()
  };
  try {
    return await writeState(actor, next);
  } catch (error) {
    runtime.setReactionLock?.(actor, false, { combat });
    runtime.releaseReaction?.(actor, ACTION_ID, { combat });
    throw error;
  }
}

function chatRoot(html) {
  return html?.querySelectorAll ? html : html?.[0]?.querySelectorAll ? html[0] : null;
}

function selectResistance(group) {
  let select = group.querySelector(".lancer-damage-apply-select");
  if (!select) {
    select = document.createElement("select");
    select.className = "lancer-damage-apply-select fc-brace-native-multiplier";
    select.hidden = true;
    group.prepend(select);
  }
  let option = [...select.options].find(candidate => Number(candidate.value) === 0.5);
  if (!option) {
    option = document.createElement("option");
    option.value = "0.5";
    option.textContent = "Resist";
    select.append(option);
  }
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function presentButton(button, { active = false, permission = null } = {}) {
  button.innerHTML = active ? '<i class="fas fa-shield-halved"></i> Braced' : '<i class="fas fa-shield-halved"></i> Brace';
  button.disabled = active || permission?.allowed === false;
  button.title = active ? "Brace is applied to this damage event." : permission?.reason ?? "Brace against this hit.";
}

const promptedBraceDamageEvents = new Set();

function braceDamageEventKey(message, targetUuid) {
  if (!message?.id || !targetUuid) return null;
  return `${message.id}:${targetUuid}`;
}

function promptBraceReaction(button, { message, targetUuid, permission } = {}) {
  if (!button || permission?.allowed !== true) return false;
  const eventKey = braceDamageEventKey(message, targetUuid);
  if (!eventKey || promptedBraceDamageEvents.has(eventKey)) return false;
  const DialogClass = globalThis.Dialog;
  if (typeof DialogClass !== "function") return false;
  promptedBraceDamageEvents.add(eventKey);
  try {
    new DialogClass({
      title: "Frame Conn | Brace",
      content: "<p>You were hit. Use Brace against this damage event?</p>",
      buttons: {
        brace: {
          icon: '<i class="fas fa-shield-halved"></i>',
          label: "Brace",
          callback: () => button.click()
        },
        decline: {
          icon: '<i class="fas fa-xmark"></i>',
          label: "Not Now"
        }
      },
      default: "brace"
    }).render(true);
    return true;
  } catch (error) {
    promptedBraceDamageEvents.delete(eventKey);
    console.warn("Frame Conn | Could not present Brace reaction prompt.", error);
    return false;
  }
}

function handleDamageMessage(message, html) {
  if (!message?.flags?.lancer?.damageData) return false;
  const root = chatRoot(html);
  if (!root) return false;
  for (const group of root.querySelectorAll(".lancer-damage-button-group[data-target]")) {
    if (group.dataset.hit !== "true") continue;
    const targetUuid = group.dataset.target;
    const actor = actorFromUuid(targetUuid);
    if (!isMech(actor) || !actor.isOwner) continue;
    const existing = stateFor(actor);
    const active = existing?.triggeringMessageId === message.id && existing?.triggeringTargetUuid === targetUuid;
    if (active) selectResistance(group);
    let button = group.querySelector(".fc-brace-reaction");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "lancer-button fc-brace-reaction";
      group.insertBefore(button, group.querySelector(".lancer-damage-apply"));
    }
    const permission = active ? null : canUse(actor);
    presentButton(button, { active, permission });
    if (button.dataset.fcBraceBound !== "true") {
      button.dataset.fcBraceBound = "true";
      button.addEventListener("click", async event => {
        event.preventDefault(); event.stopPropagation(); button.disabled = true;
        try {
          await activate(actor, { messageId: message.id, targetUuid });
          selectResistance(group); presentButton(button, { active: true });
          ui.notifications?.info("Frame Conn | Brace armed. Apply damage normally.");
        } catch (error) {
          presentButton(button, { permission: canUse(actor) });
          ui.notifications?.error(error instanceof Error ? error.message : String(error));
        }
      });
    }
    if (!active) promptBraceReaction(button, { message, targetUuid, permission });
  }
  return true;
}

async function applyAttackDifficulty(state) {
  const targets = state?.data?.acc_diff?.targets;
  if (!Array.isArray(targets)) return true;
  for (const target of targets) {
    const actor = actorFromUuid(target?.targetUuid);
    if (!aftermathActive(actor)) continue;
    target.difficulty = (Number.isFinite(Number(target.difficulty)) ? Number(target.difficulty) : 0) + 1;
  }
  return true;
}

function installNativeExtension() {
  if (typeof runtime.installNativeFlowStepBefore !== "function") {
    throw new Error("Frame Conn Brace native Flow extension is not configured.");
  }
  return runtime.installNativeFlowStepBefore({
    stepName: FLOW_STEP,
    beforeStep: "showAttackHUD",
    flowNames: ATTACK_FLOWS,
    step: applyAttackDifficulty
  });
}

function braceActors() {
  const actors = new Map();
  for (const actor of globalThis.game?.actors ?? []) if (actor?.uuid) actors.set(actor.uuid, actor);
  for (const token of globalThis.canvas?.tokens?.placeables ?? []) if (token?.actor?.uuid) actors.set(token.actor.uuid, token.actor);
  return [...actors.values()];
}

async function syncCombat(combat = globalThis.game?.combat) {
  const currentTurn = turnKey(combat);
  if (!combat?.started || !combat.id || !currentTurn) return null;
  const activeActor = combat.combatant?.actor ?? null;
  for (const actor of braceActors()) {
    const state = stateFor(actor);
    if (!state || state.combatId !== combat.id) continue;
    if (state.aftermathActive) runtime.setReactionLock?.(actor, true, { combat, reason: "Brace aftermath." });
    if (state.restrictionTurnKey) {
      if (state.restrictionTurnKey === currentTurn) {
        if (activeActor?.id === actor.id) runtime.applyTurnRestriction?.(actor);
        continue;
      }
      runtime.setReactionLock?.(actor, false, { combat });
      if (actor.isOwner) await clearState(actor);
      continue;
    }
    if (state.aftermathActive && activeActor?.id === actor.id && state.declaredTurnKey !== currentTurn) {
      if (actor.isOwner) await writeState(actor, { ...state, restrictionTurnKey: currentTurn });
      runtime.applyTurnRestriction?.(actor);
    }
  }
  return true;
}

async function handleCombatDelete(combat) {
  for (const actor of braceActors()) {
    const state = stateFor(actor);
    if (state?.combatId !== combat?.id) continue;
    runtime.setReactionLock?.(actor, false, { combat });
    if (actor.isOwner) await clearState(actor);
  }
  return true;
}

async function initializeRuntime() {
  const extension = installNativeExtension();
  await syncCombat(globalThis.game?.combat);
  return extension;
}

function diagnostics() {
  return Object.freeze({
    actionId: ACTION_ID,
    nativeStep: FLOW_STEP,
    nativeFlows: [...ATTACK_FLOWS],
    runtimeBindings: runtimeBindings(),
    activeStates: braceActors().map(actor => ({ actorUuid: actor.uuid ?? null, state: stateFor(actor) })).filter(entry => entry.state)
  });
}

export const frameConnBraceFeature = defineFrameConnFeature({
  id: "brace",
  domain: "brace",
  provides: ["brace", "brace.reaction", "brace.damage-resistance", "brace.attack-difficulty", "brace.turn-restriction"],
  dependsOn: ["turn.reaction", "native-adapter.flow-extension"],
  optionalDependsOn: [],
  state: {},
  commands: { configureRuntime, initializeRuntime, activate, syncCombat },
  queries: { canUse, stateForActor: stateFor, aftermathActive, diagnostics, runtimeBindings },
  hooks: { renderChatMessage: handleDamageMessage, combatStart: syncCombat, updateCombat: syncCombat, deleteCombat: handleCombatDelete },
  lifecycle: {},
  api: { configureRuntime, initializeRuntime, activate, canUse, syncCombat, stateForActor: stateFor, isAftermathActive: aftermathActive, diagnostics, runtimeBindings },
  metadata: {
    label: "Brace",
    actionId: ACTION_ID,
    nativeDamageAuthority: "Lancer damage-card multiplier -> LancerActor.damageCalc",
    nativeAttackAuthority: "registered Lancer attack Flows",
    stateAuthority: "flags.lancer-frame-conn.brace",
    timingPolicy: "contextual-reaction-after-hit-and-damage-roll"
  }
});
