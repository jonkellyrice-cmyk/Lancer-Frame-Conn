/**
 * @file scripts/rules_features/status_conditions/overheating-status.js
 * @module overheating-status
 * @responsibility Apply the mechanical status consequences of the native Foundry Lancer OverheatFlow result without re-rolling or replacing the native overheating check.
 */

const OVERHEAT_FLOW = "OverheatFlow";
const CONSEQUENCE_STEP = "frameConnApplyNativeOverheatStatusConsequences";

export function createOverheatingStatusController({
  applyStatus,
  applyUntilEndOfNextTurn,
  installFlowStepBefore
} = {}) {
  for (const [name, value] of Object.entries({ applyStatus, applyUntilEndOfNextTurn, installFlowStepBefore })) {
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

    // Native Lancer treats 1-Stress NPC overheating as Destabilized Power Plant.
    // The Flow prints that result but does not persist Exposed itself.
    if (isNpc && Number(actor?.system?.stress?.max) === 1 && !data?.result?.roll) {
      await applyStatus(actor, "exposed");
      return true;
    }

    const remainingStress = Number(data?.remStress);
    if (!Number.isFinite(remainingStress) || remainingStress <= 0) return true;

    const roll = data?.result?.roll ?? null;
    const result = Number(roll?.total);
    if (!Number.isFinite(result)) return true;

    // Multiple 1s are Irreversible Meltdown and override the ordinary roll-1 result.
    if (result === 1 && nativeOverheatOneCount(roll) > 1) return true;

    // Emergency Shunt: Impaired until the end of the character's next turn.
    if (result >= 5) {
      await applyUntilEndOfNextTurn(actor, ["impaired"], {
        sourceActionId: "native-overheat-emergency-shunt"
      });
      return true;
    }

    // Destabilized Power Plant: Exposed until cleared.
    if (result >= 2) {
      await applyStatus(actor, "exposed");
      return true;
    }

    // Meltdown result with 3+ Stress remaining: Exposed.
    if (result === 1 && remainingStress >= 3) {
      await applyStatus(actor, "exposed");
      return true;
    }

    // At 2 Stress remaining, native Foundry Lancer inserts the Engineering
    // check button into the Overheat card. Its success/failure must resolve
    // before any further consequence can be known. At 1 Stress, the result is
    // a reactor meltdown rather than a status.
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
