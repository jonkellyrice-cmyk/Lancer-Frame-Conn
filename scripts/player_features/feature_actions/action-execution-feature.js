/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/action-execution-feature.js
 */


/**
 * ============================================================
 * FRAME CONN FEATURE -- ACTION EXECUTION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Conn's universal-action execution classification
 *   and the application-facing execution boundary.
 *
 * PURPOSE:
 *   Keep action classification and legacy actor workflow support
 *   behind one registered feature while progressively routing
 *   actions into the canonical Frame Conn execution spine.
 *
 * RESPONSIBILITIES:
 *   - Identify actions which do not require a roll or execution
 *     workflow.
 *   - Resolve the execution kind for a universal action.
 *   - Resolve stat-driven action execution.
 *   - Resolve basic attack execution.
 *   - Resolve basic tech attack execution.
 *   - Resolve Scan execution.
 *   - Resolve Stabilize execution.
 *   - Resolve Overcharge execution.
 *   - Prompt for HULL / AGI / SYS / ENG when an action requires a
 *     chosen mech skill.
 *   - Route migrated actions into the canonical Frame Conn
 *     execution boundary supplied by runtime composition.
 *   - Preserve existing actor workflow delegation for actions not
 *     yet migrated to the canonical execution spine.
 *   - Expose execution-kind inspection for presentation and
 *     diagnostics.
 *
 * DOES NOT OWN:
 *   - Action registration.
 *   - Action definitions.
 *   - Action legality.
 *   - Turn action-budget mutation.
 *   - Committed-action state.
 *   - Target selection.
 *   - Target validation.
 *   - Execution transaction sequencing.
 *   - System-bridge composition.
 *   - Native Lancer adapter implementation.
 *   - Weapon selection.
 *   - Weapon attack implementation.
 *   - Lancer actor workflow implementation.
 *   - Chat-card implementation.
 *   - Dice-roll implementation.
 *   - Application rendering.
 *   - Application lifecycle.
 *   - Foundry startup boundaries.
 *   - Module settings.
 *   - Scene-control integration.
 *
 * CANONICAL EXECUTION MIGRATION:
 *
 *   The Application UI calls this feature's execute(actor, action)
 *   boundary. Actions migrated to the new execution architecture
 *   are then forwarded through executeCanonicalAction, which is
 *   supplied by runtime-orchestrator.js.
 *
 *   The feature intentionally does not import system_bridge,
 *   execution_transaction, targeting-spatial_service, or
 *   native_adapter directly.
 *
 *   First migrated action:
 *
 *     full.improvised-attack
 *
 *   INTENTIONAL TRANSITIONAL NATIVE DELEGATIONS:
 *
 *   Some actions already had explicit, proven actor-native delegation
 *   before the canonical execution spine was introduced. Stabilize is
 *   one such known-good compatibility path:
 *
 *     full.stabilize
 *       -> executionKind "stabilize"
 *       -> executeFrameConnStabilize(actor)
 *       -> actor.beginStabilizeFlow()
 *
 *   Preserve this behavior until Stabilize is deliberately migrated to
 *   the canonical System Bridge / Execution Transaction / Native Adapter
 *   spine. Do not mistake the direct native call for an accidental fallback.
 *
 * STABILITY CONTRACT:
 *
 *   Existing execution classification and non-migrated actor
 *   workflow delegation remain available while the canonical
 *   execution spine is introduced action-by-action.
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  defineFrameConnFeature
} from "../../feature-contract.js";


/* ============================================================
   Action Execution feature identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";


/* ============================================================
   Action Execution -- Runtime bindings
   ============================================================ */

const frameConnActionExecutionRuntimeBindings = {
  executeCanonicalAction:
    null
};


function configureFrameConnActionExecutionRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object" ||
    Array.isArray(
      bindings
    )
  ) {
    throw new TypeError(
      "Frame Conn Action Execution runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set([
      "executeCanonicalAction"
    ]);


  for (
    const [
      key,
      value
    ]
    of Object.entries(
      bindings
    )
  ) {
    if (
      !allowedKeys.has(
        key
      )
    ) {
      throw new Error(
        `Frame Conn Action Execution received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Conn Action Execution runtime binding "${key}" must be a function or null.`
      );
    }


    frameConnActionExecutionRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameConnActionExecutionRuntimeBindings()
  );
}


function getFrameConnActionExecutionRuntimeBindings() {
  return Object.freeze({
    executeCanonicalAction:
      typeof frameConnActionExecutionRuntimeBindings
        .executeCanonicalAction ===
        "function"
  });
}


async function executeFrameConnCanonicalAction(
  actor,
  action,
  executionKind
) {
  const executor =
    frameConnActionExecutionRuntimeBindings
      .executeCanonicalAction;


  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Conn canonical action execution has not been configured."
    );
  }


  return executor({
    actor,
    action,
    executionKind
  });
}


/* ============================================================
   Action Execution -- No-roll actions
   ============================================================ */

export const FRAME_CONN_NO_ROLL_ACTIONS =
  Object.freeze(
    new Set([
      "movement.standard",
      "movement.jump",
      "movement.climb",
      "movement.fly",
      "movement.teleport",

      "quick.boost",
      "quick.quick-tech.bolster",
      "quick.prepare",
      "quick.self-destruct",

      "full.activate",
      "full.mount-dismount",

      "reaction.brace",

      "special.end-turn"
    ])
  );


/* ============================================================
   Action Execution -- Mech skill choices
   ============================================================ */

export const FRAME_CONN_MECH_STAT_CHOICES =
  Object.freeze([
    Object.freeze({
      path:
        "hull",

      label:
        "HULL"
    }),

    Object.freeze({
      path:
        "agi",

      label:
        "AGI"
    }),

    Object.freeze({
      path:
        "sys",

      label:
        "SYS"
    }),

    Object.freeze({
      path:
        "eng",

      label:
        "ENG"
    })
  ]);


/* ============================================================
   Action Execution -- Classification
   ============================================================ */

function frameConnActionRequiresNoRoll(
  actionOrId
) {
  const actionId =
    typeof actionOrId ===
      "string"
      ? actionOrId
      : actionOrId?.id;

  const actionCategory =
    typeof actionOrId ===
      "object"
      ? actionOrId?.category ?? null
      : null;


  if (
    !actionId
  ) {
    return false;
  }


  if (
    actionCategory ===
      "protocol" ||
    String(actionId)
      .startsWith(
        "protocol."
      )
  ) {
    return true;
  }


  return (
    FRAME_CONN_NO_ROLL_ACTIONS
      .has(
        actionId
      )
  );
}


function frameConnActionExecutionKind(
  action
) {
  if (
    !action ||
    frameConnActionRequiresNoRoll(
      action
    )
  ) {
    return null;
  }


  if (
    action.metadata
      ?.statPath
  ) {
    return "stat";
  }


  if (
    [
      "quick.skirmish",
      "full.barrage",
      "full.improvised-attack",
      "reaction.overwatch"
    ].includes(
      action.id
    )
  ) {
    return "basic-attack";
  }


  if (
    action.id ===
      "quick.quick-tech.invade"
  ) {
    return "basic-tech-attack";
  }


  if (
    action.id ===
      "quick.quick-tech.invade.fragment-signal"
  ) {
    return "fragment-signal";
  }


  if (
    action.id ===
      "quick.grapple"
  ) {
    return "grapple";
  }


  if (
    action.id ===
      "quick.end-grapple"
  ) {
    return "end-grapple";
  }


  if (
    action.id ===
      "quick.ram"
  ) {
    return "ram";
  }


  if (
    action.id ===
      "quick.hide"
  ) {
    return "hide";
  }


  if (
    action.id ===
      "full.disengage"
  ) {
    return "disengage";
  }


  if (
    action.id ===
      "quick.search"
  ) {
    return "search";
  }


  if (
    action.id ===
      "quick.quick-tech.lock-on"
  ) {
    return "lock-on";
  }


  if (
    action.id ===
      "quick.quick-tech.scan"
  ) {
    return "scan";
  }


  if (
    action.id ===
      "quick.shut-down"
  ) {
    return "shut-down";
  }


  if (
    action.id ===
      "full.boot-up"
  ) {
    return "boot-up";
  }


  if (
    action.id ===
      "full.stabilize"
  ) {
    return "stabilize";
  }


  if (
    action.id ===
      "special.overcharge"
  ) {
    return "overcharge";
  }


  return "choose-stat";
}


function canFrameConnExecuteAction(
  action
) {
  return (
    frameConnActionExecutionKind(
      action
    ) !==
    null
  );
}


/* ============================================================
   Action Execution -- Actor validation
   ============================================================ */

function assertFrameConnActionExecutionActor(
  actor
) {
  if (
    !actor ||
    typeof actor !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn action execution requires a Lancer actor."
    );
  }


  return actor;
}


function assertFrameConnExecutableAction(
  action
) {
  if (
    !action ||
    typeof action !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn action execution requires an action definition."
    );
  }


  if (
    !String(
      action.id ??
      ""
    ).trim()
  ) {
    throw new Error(
      "Frame Conn action execution requires an action with an id."
    );
  }


  return action;
}


/* ============================================================
   Action Execution -- Mech stat selection
   ============================================================ */

function frameConnChooseMechStat(
  action
) {
  assertFrameConnExecutableAction(
    action
  );


  return new Promise(
    resolve => {
      const buttons =
        Object.fromEntries(
          FRAME_CONN_MECH_STAT_CHOICES
            .map(
              choice => {
                return [
                  choice.path,

                  {
                    icon:
                      '<i class="fas fa-dice-d20"></i>',

                    label:
                      choice.label,

                    callback:
                      () =>
                        resolve({
                          path:
                            choice.path,

                          label:
                            choice.label
                        })
                  }
                ];
              }
            )
        );


      new Dialog({
        title:
          `${action.label} -- Choose Mech Skill`,

        content: `
          <p>
            Choose the mech skill used to resolve
            <strong>${foundry.utils.escapeHTML(action.label)}</strong>.
          </p>
        `,

        buttons,

        close:
          () =>
            resolve(
              null
            )
      }).render(
        true
      );
    }
  );
}


/* ============================================================
   Action Execution -- Legacy actor workflows
   ============================================================ */

function executeFrameConnStatAction(
  actor,
  action
) {
  if (
    typeof actor
      .beginStatFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginStatFlow()."
    );
  }


  return (
    actor.beginStatFlow(
      action.metadata
        .statPath,

      action.metadata
        .statLabel ??
        action.label
    )
  );
}


function executeFrameConnBasicAttack(
  actor,
  action
) {
  if (
    typeof actor
      .beginBasicAttackFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginBasicAttackFlow()."
    );
  }


  return (
    actor.beginBasicAttackFlow(
      action.label
    )
  );
}


function executeFrameConnBasicTechAttack(
  actor,
  action
) {
  if (
    typeof actor
      .beginBasicTechAttackFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginBasicTechAttackFlow()."
    );
  }


  return (
    actor.beginBasicTechAttackFlow(
      action.label
    )
  );
}


function executeFrameConnScan(
  actor
) {
  if (
    typeof actor
      .beginScanFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginScanFlow()."
    );
  }


  return (
    actor.beginScanFlow()
  );
}


/**
 * Intentional known-good transitional delegation.
 *
 * Runtime testing confirmed that committed Frame Conn Stabilize reaches
 * the stock Lancer Stabilize workflow correctly through this exact actor
 * entry point. This remains explicit until Stabilize is consciously moved
 * behind the canonical Native Adapter transaction spine.
 */
function executeFrameConnStabilize(
  actor
) {
  if (
    typeof actor
      .beginStabilizeFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginStabilizeFlow()."
    );
  }


  return (
    actor.beginStabilizeFlow()
  );
}


function executeFrameConnOvercharge(
  actor
) {
  if (
    typeof actor
      .beginOverchargeFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginOverchargeFlow()."
    );
  }


  return (
    actor.beginOverchargeFlow()
  );
}


async function executeFrameConnChosenStatAction(
  actor,
  action
) {
  const selectedStat =
    await frameConnChooseMechStat(
      action
    );


  if (
    !selectedStat
  ) {
    throw new Error(
      "Mech skill selection was cancelled."
    );
  }


  if (
    typeof actor
      .beginStatFlow !==
    "function"
  ) {
    throw new Error(
      "The selected Lancer actor does not expose beginStatFlow()."
    );
  }


  return (
    actor.beginStatFlow(
      selectedStat.path,

      `${action.label} -- ${selectedStat.label}`
    )
  );
}


/* ============================================================
   Action Execution -- Execution routing
   ============================================================ */

async function frameConnExecuteActionRoll(
  actor,
  action
) {
  assertFrameConnActionExecutionActor(
    actor
  );


  assertFrameConnExecutableAction(
    action
  );


  const kind =
    frameConnActionExecutionKind(
      action
    );


  if (
    !kind
  ) {
    throw new Error(
      "This action does not require a dice or sheet workflow."
    );
  }


  /**
   * Canonically migrated actions enter the runtime-composed
   * System Bridge / Semantic Context / Transaction / Native Adapter
   * spine here. Cross-cutting execution concerns remain outside
   * this feature.
   */
  if (
    [
      "full.improvised-attack",
      "quick.grapple",
      "quick.end-grapple",
      "quick.hide",
      "quick.quick-tech.invade.fragment-signal",
      "quick.quick-tech.lock-on",
      "quick.ram",
      "quick.search",
      "quick.shut-down",
      "full.boot-up",
      "full.disengage"
    ].includes(
      action.id
    )
  ) {
    return executeFrameConnCanonicalAction(
      actor,
      action,
      kind
    );
  }


  if (
    kind ===
      "stat"
  ) {
    return (
      executeFrameConnStatAction(
        actor,
        action
      )
    );
  }


  if (
    kind ===
      "basic-attack"
  ) {
    return (
      executeFrameConnBasicAttack(
        actor,
        action
      )
    );
  }


  if (
    kind ===
      "basic-tech-attack"
  ) {
    return (
      executeFrameConnBasicTechAttack(
        actor,
        action
      )
    );
  }


  if (
    kind ===
      "scan"
  ) {
    return (
      executeFrameConnScan(
        actor
      )
    );
  }


  if (
    kind ===
      "stabilize"
  ) {
    return (
      executeFrameConnStabilize(
        actor
      )
    );
  }


  if (
    kind ===
      "overcharge"
  ) {
    return (
      executeFrameConnOvercharge(
        actor
      )
    );
  }


  return (
    executeFrameConnChosenStatAction(
      actor,
      action
    )
  );
}


/* ============================================================
   Action Execution -- Diagnostics
   ============================================================ */

function getFrameConnActionExecutionDiagnostics(
  action
) {
  const actionId =
    action?.id ??
    null;


  const kind =
    frameConnActionExecutionKind(
      action
    );


  return Object.freeze({
    actionId,

    label:
      action?.label ??
      null,

    noRoll:
      frameConnActionRequiresNoRoll(
        action
      ),

    executable:
      kind !==
      null,

    executionKind:
      kind,

    canonicalExecution:
      [
        "full.improvised-attack",
        "quick.grapple",
        "quick.end-grapple",
        "quick.hide",
        "quick.quick-tech.invade.fragment-signal",
        "quick.quick-tech.lock-on",
        "quick.ram",
        "quick.search",
        "quick.shut-down",
        "full.boot-up",
        "full.disengage"
      ].includes(
        actionId
      ),

    runtimeBindings:
      getFrameConnActionExecutionRuntimeBindings(),

    statPath:
      action?.metadata
        ?.statPath ??
      null,

    statLabel:
      action?.metadata
        ?.statLabel ??
      null
  });
}


/* ============================================================
   Action Execution feature definition
   ============================================================ */

export const frameConnActionExecutionFeature =
  defineFrameConnFeature({
    id:
      "action-execution",

    domain:
      "action-execution",

    provides: [
      "action-execution",
      "action-execution.classification",
      "action-execution.mech-stat-selection",
      "action-execution.actor-workflow",
      "action-execution.canonical-routing"
    ],

    dependsOn: [],

    optionalDependsOn: [
      "actions.registry",
      "turn.actions"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameConnActionExecutionRuntime,

      execute:
        frameConnExecuteActionRoll,

      chooseMechStat:
        frameConnChooseMechStat
    },

    queries: {
      requiresNoRoll:
        frameConnActionRequiresNoRoll,

      executionKind:
        frameConnActionExecutionKind,

      canExecute:
        canFrameConnExecuteAction,

      runtimeBindings:
        getFrameConnActionExecutionRuntimeBindings,

      diagnostics:
        getFrameConnActionExecutionDiagnostics
    },

    hooks: {},

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameConnActionExecutionRuntime,

      execute:
        frameConnExecuteActionRoll,

      executeActionRoll:
        frameConnExecuteActionRoll,

      chooseMechStat:
        frameConnChooseMechStat,

      requiresNoRoll:
        frameConnActionRequiresNoRoll,

      executionKind:
        frameConnActionExecutionKind,

      canExecute:
        canFrameConnExecuteAction,

      runtimeBindings:
        getFrameConnActionExecutionRuntimeBindings,

      diagnostics:
        getFrameConnActionExecutionDiagnostics,

      noRollActions:
        FRAME_CONN_NO_ROLL_ACTIONS,

      mechStatChoices:
        FRAME_CONN_MECH_STAT_CHOICES
    },

    metadata: {
      label:
        "Action Execution",

      description:
        "Owns Frame Conn universal-action execution classification and routes migrated actions into the canonical execution spine while preserving legacy actor workflows during migration.",

      applicationConsumer:
        "styles/ui_application/ui-application.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "canonical-execution-routing-with-legacy-workflow-fallback",

      firstCanonicalAction:
        "full.improvised-attack",

      targetSelectionOwnership:
        "targeting-spatial",

      mutationPolicy:
        "canonical-execution-spine-for-migrated-actions"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

export {
  configureFrameConnActionExecutionRuntime,

  getFrameConnActionExecutionRuntimeBindings,

  executeFrameConnCanonicalAction,

  frameConnActionRequiresNoRoll,

  frameConnActionExecutionKind,

  canFrameConnExecuteAction,

  assertFrameConnActionExecutionActor,

  assertFrameConnExecutableAction,

  frameConnChooseMechStat,

  executeFrameConnStatAction,

  executeFrameConnBasicAttack,

  executeFrameConnBasicTechAttack,

  executeFrameConnScan,

  executeFrameConnStabilize,

  executeFrameConnOvercharge,

  executeFrameConnChosenStatAction,

  frameConnExecuteActionRoll,

  getFrameConnActionExecutionDiagnostics
};