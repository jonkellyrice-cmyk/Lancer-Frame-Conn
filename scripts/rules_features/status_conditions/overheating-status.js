/**
 * @file scripts/rules_features/status_conditions/overheating-status.js
 * @module overheating-status
 * @responsibility Apply mechanical consequences of the already-resolved native Foundry Lancer OverheatFlow without replacing its Stress, Heat, roll, or chat authority.
 */

const OVERHEAT_FLOW = "OverheatFlow";
const CONSEQUENCE_STEP = "frameConnApplyNativeOverheatStatusConsequences";

export function createOverheatingStatusController({
  applyStatus,
  applyUntilEndOfNextTurn,
  installFlowStepBefore,
  scheduleReactorMeltdown,
  markReactorEngineeringCheckPending
} = {}) {
  for (const [name, value] of Object.entries({
    applyStatus,
    applyUntilEndOfNextTurn,
    installFlowStepBefore,
    scheduleReactorMeltdown,
    markReactorEngineeringCheckPending
  })) {
    if (typeof value !== "function") {
      throw new TypeError(`Frame Conn Overheating dependency ${name} must be a function.`);
    }
  }

  function selectedNativeOverheatRoll(roll) {
    const firstTerm = Array.isArray(roll?.terms) ? roll.terms[0] : null;
    if (!Array.isArray(firstTerm?.rolls) || firstTerm.rolls.length <= 1) return roll;

    const chosenIndex = Array.isArray(firstTerm?.results)
      ? firstTerm.results.findIndex(result => !result?.discarded)
      : -1;

    return chosenIndex >= 0
      ? firstTerm.rolls[chosenIndex] ?? roll
      : roll;
  }

  function nativeOverheatOneCount(roll) {
    const selectedRoll = selectedNativeOverheatRoll(roll);
    const dieTerm = Array.isArray(selectedRoll?.terms)
      ? selectedRoll.terms.find(term => Array.isArray(term?.results))
      : null;

    if (!dieTerm) return 0;
    return dieTerm.results.filter(result => Number(result?.result) === 1).length;
  }

  async function applyNativeOverheatStatusConsequences(state) {
    const actor = state?.actor ?? null;
    const data = state?.data ?? null;
    if (!actor || !data) return true;

    const isMech = typeof actor.is_mech === "function" ? actor.is_mech() : actor.type === "mech";
    const isNpc = typeof actor.is_npc === "function" ? actor.is_npc() : actor.type === "npc";
    if (!isMech && !isNpc) return true;

    // Native Lancer's one-Stress NPC branch prints Destabilized Power Plant
    // without rolling and without persisting Exposed.
    if (isNpc && Number(actor?.system?.stress?.max) === 1 && !data?.result?.roll) {
      await applyStatus(actor, "exposed");
      return true;
    }

    const remainingStress = Number(data?.remStress);

    // Reaching zero Stress is a reactor meltdown at the end of the next turn.
    if (remainingStress === 0) {
      await scheduleReactorMeltdown(actor, 1, { reason: "zero-stress" });
      return true;
    }

    const roll = data?.result?.roll ?? null;
    const result = Number(roll?.total);
    if (!Number.isFinite(result)) return true;

    // Multiple 1s are Irreversible Meltdown: end of next turn.
    if (result === 1 && nativeOverheatOneCount(roll) > 1) {
      await scheduleReactorMeltdown(actor, 1, { reason: "irreversible-meltdown" });
      return true;
    }

    // Emergency Shunt.
    if (result >= 5) {
      await applyUntilEndOfNextTurn(actor, ["impaired"], {
        sourceActionId: "native-overheat-emergency-shunt"
      });
      return true;
    }

    // Destabilized Power Plant.
    if (result >= 2) {
      await applyStatus(actor, "exposed");
      return true;
    }

    if (result !== 1) return true;

    // Meltdown table result varies with remaining Stress.
    if (remainingStress >= 3) {
      await applyStatus(actor, "exposed");
    } else if (remainingStress === 2) {
      // Native Foundry supplies the Engineering button. The reactor-meltdown
      // controller observes the resulting native StatRollFlow.
      await markReactorEngineeringCheckPending(actor);
    } else if (remainingStress === 1) {
      await scheduleReactorMeltdown(actor, 1, { reason: "one-stress-meltdown" });
    }

    return true;
  }

  function install() {
    return installFlowStepBefore({
      stepName: CONSEQUENCE_STEP,
      beforeStep: "noStressRemaining",
      flowNames: [OVERHEAT_FLOW],
      step: applyNativeOverheatStatusConsequences
    });
  }

  return Object.freeze({
    install,
    applyNativeOverheatStatusConsequences,
    nativeOverheatOneCount
  });
}
