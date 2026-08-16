/**
 * @file scripts/rules_features/status_conditions/structure-damage-status.js
 * @module structure-damage-status
 * @responsibility Apply missing mechanical consequences of the native Foundry Lancer StructureFlow and remove destroyed tokens when Structure reaches 0.
 *
 * Native Lancer remains authoritative for:
 * - detecting HP reaching 0 when native Structure automation is enabled;
 * - spending Structure and restoring HP;
 * - rolling the Structure table;
 * - multiple-1 detection;
 * - StructureFlow chat output.
 */

import { rollNativeStat } from "../../../system_bridge/native_adapter/native-adapter.js";

const STRUCTURE_FLOW = "StructureFlow";
const CONSEQUENCE_STEP = "frameConnApplyNativeStructureConsequences";

export function createStructureDamageStatusController({
  applyUntilEndOfNextTurn,
  installFlowStepBefore
} = {}) {
  for (const [name, value] of Object.entries({ applyUntilEndOfNextTurn, installFlowStepBefore })) {
    if (typeof value !== "function") {
      throw new TypeError(`Frame Conn Structure Damage dependency ${name} must be a function.`);
    }
  }

  const destructionInFlight = new Set();

  function canAuthoritativelyDestroy(actor) {
    const users = [...(globalThis.game?.users ?? [])];
    const activeGmExists = users.some(user => user?.active && user?.isGM);
    if (activeGmExists) return Boolean(globalThis.game?.user?.isGM);
    return Boolean(actor?.isOwner);
  }

  function selectedStructureRoll(roll) {
    const firstTerm = Array.isArray(roll?.terms) ? roll.terms[0] : null;
    if (!Array.isArray(firstTerm?.rolls) || firstTerm.rolls.length <= 1) return roll;

    const chosenIndex = Array.isArray(firstTerm?.results)
      ? firstTerm.results.findIndex(result => !result?.discarded)
      : -1;

    return chosenIndex >= 0
      ? firstTerm.rolls[chosenIndex] ?? roll
      : roll;
  }

  function structureOneCount(roll) {
    const selectedRoll = selectedStructureRoll(roll);
    const dieTerm = Array.isArray(selectedRoll?.terms)
      ? selectedRoll.terms.find(term => Array.isArray(term?.results))
      : null;

    if (!dieTerm) return 0;
    return dieTerm.results.filter(result => Number(result?.result) === 1).length;
  }

  function removeNativeHullButton(data) {
    if (!Array.isArray(data?.embedButtons)) return;
    data.embedButtons = data.embedButtons.filter(button =>
      !(typeof button === "string" && button.includes('data-check-type="hull"'))
    );
  }

  async function destroyActor(actor, { reason = "structure-zero" } = {}) {
    if (!actor || !canAuthoritativelyDestroy(actor)) return false;

    const structure = Number(actor?.system?.structure?.value);
    if (!Number.isFinite(structure) || structure > 0) return false;

    const uuid = actor?.uuid ?? actor?.id ?? null;
    if (!uuid || destructionInFlight.has(uuid)) return false;
    destructionInFlight.add(uuid);

    try {
      const activeTokens = (globalThis.canvas?.tokens?.placeables ?? [])
        .filter(token => token?.actor?.uuid === actor.uuid || token?.actor?.id === actor.id);

      const sceneGroups = new Map();
      for (const token of activeTokens) {
        const scene = token?.document?.parent ?? globalThis.canvas?.scene ?? null;
        const tokenId = token?.document?.id ?? null;
        if (!scene || !tokenId) continue;
        if (!sceneGroups.has(scene)) sceneGroups.set(scene, []);
        sceneGroups.get(scene).push(tokenId);
      }

      for (const [scene, tokenIds] of sceneGroups.entries()) {
        if (tokenIds.length > 0) {
          await scene.deleteEmbeddedDocuments("Token", tokenIds);
        }
      }

      console.info("Frame Conn | Destroyed actor token removed from scene.", {
        actorUuid: actor.uuid,
        reason,
        removedTokenCount: activeTokens.length
      });
      return activeTokens.length > 0;
    } finally {
      destructionInFlight.delete(uuid);
    }
  }

  async function resolveNativeStructureConsequences(state) {
    const actor = state?.actor ?? null;
    const data = state?.data ?? null;
    if (!actor || !data) return true;

    const isMech = typeof actor.is_mech === "function" ? actor.is_mech() : actor.type === "mech";
    const isNpc = typeof actor.is_npc === "function" ? actor.is_npc() : actor.type === "npc";
    if (!isMech && !isNpc) return true;

    const roll = data?.result?.roll ?? null;
    const result = Number(roll?.total);
    const remainingStructure = Number(data?.remStruct);
    if (!Number.isFinite(result) || !Number.isFinite(remainingStructure)) return true;

    // Native multiple-1 handling is Crushing Hit and already sets Structure to
    // 0. The updateActor destruction observer owns removing the Scene token.
    if (result === 1 && structureOneCount(roll) > 1) return true;

    // Glancing Blow: Impaired until the end of the mech's next turn.
    if (result >= 5) {
      await applyUntilEndOfNextTurn(actor, ["impaired"], {
        sourceActionId: "native-structure-glancing-blow"
      });
      return true;
    }

    if (result !== 1) return true;

    // Direct Hit with 3+ Structure remaining: Stunned until end of next turn.
    if (remainingStructure >= 3) {
      await applyUntilEndOfNextTurn(actor, ["stunned"], {
        sourceActionId: "native-structure-direct-hit"
      });
      return true;
    }

    // Direct Hit with exactly 2 Structure remaining: automatically launch the
    // native Hull check instead of making the user click the card button.
    if (remainingStructure === 2) {
      removeNativeHullButton(data);

      const execution = await rollNativeStat({
        actor,
        path: "system.hull",
        title: "STRUCTURE DAMAGE // DIRECT HIT // HULL CHECK"
      });

      const total = Number(execution?.result?.roll?.total);
      if (!Number.isFinite(total)) {
        console.warn("Frame Conn | Direct Hit Hull check did not resolve to a numeric total.", execution);
        return true;
      }

      if (total >= 10) {
        await applyUntilEndOfNextTurn(actor, ["stunned"], {
          sourceActionId: "native-structure-direct-hit-hull-success"
        });
      } else if (typeof actor.update === "function") {
        // A failed Hull check destroys the mech. Persist native Structure 0;
        // the authoritative updateActor observer removes its Scene token.
        await actor.update({ "system.structure.value": 0 });
      }

      return true;
    }

    // Direct Hit at 1 Structure is already converted to Structure 0 by native
    // StructureFlow. The destruction observer removes the Scene token.
    return true;
  }

  function install() {
    return installFlowStepBefore({
      stepName: CONSEQUENCE_STEP,
      beforeStep: "printStructureCard",
      flowNames: [STRUCTURE_FLOW],
      step: resolveNativeStructureConsequences
    });
  }

  async function reconcileActor(actor) {
    const structure = Number(actor?.system?.structure?.value);
    if (!Number.isFinite(structure) || structure > 0) return false;
    return destroyActor(actor, { reason: "structure-zero" });
  }

  return Object.freeze({
    install,
    reconcileActor,
    destroyActor,
    resolveNativeStructureConsequences,
    structureOneCount
  });
}
