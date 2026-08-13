/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/action-execution-feature.js
 */


/**
 * ============================================================
 * FRAME HELM FEATURE -- ACTION EXECUTION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's universal-action execution classification
 *   and the application-facing execution boundary.
 *
 * PURPOSE:
 *   Keep action classification and legacy actor workflow support
 *   behind one registered feature while progressively routing
 *   actions into the canonical Frame Helm execution spine.
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
 *   - Route migrated actions into the canonical Frame Helm
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
  defineFrameHelmFeature
} from "../feature-contract.js";


/* ============================================================
   Action Execution feature identity
   ============================================================ */

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ============================================================
   Action Execution -- Runtime bindings
   ============================================================ */

const frameHelmActionExecutionRuntimeBindings = {
  executeCanonicalAction:
    null
};


function configureFrameHelmActionExecutionRuntime(
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
      "Frame Helm Action Execution runtime bindings must be supplied as an object."
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
        `Frame Helm Action Execution received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Action Execution runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmActionExecutionRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmActionExecutionRuntimeBindings()
  );
}


function getFrameHelmActionExecutionRuntimeBindings() {
  return Object.freeze({
    executeCanonicalAction:
      typeof frameHelmActionExecutionRuntimeBindings
        .executeCanonicalAction ===
        "function"
  });
}


async function executeFrameHelmCanonicalAction(
  actor,
  action,
  executionKind
) {
  const executor =
    frameHelmActionExecutionRuntimeBindings
      .executeCanonicalAction;


  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Helm canonical action execution has not been configured."
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

export const FRAME_HELM_NO_ROLL_ACTIONS =
  Object.freeze(
    new Set([
      "movement.standard",
      "movement.jump",
      "movement.climb",
      "movement.fly",
      "movement.teleport",

      "quick.boost",
      "quick.hide",
      "quick.prepare",
      "quick.shut-down",
      "quick.self-destruct",

      "full.disengage",
      "full.boot-up",
      "full.mount-dismount",

      "special.end-turn"
    ])
  );


/* ============================================================
   Action Execution -- Mech skill choices
   ============================================================ */

export const FRAME_HELM_MECH_STAT_CHOICES =
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

function frameHelmActionRequiresNoRoll(
  actionOrId
) {
  const actionId =
    typeof actionOrId ===
      "string"
      ? actionOrId
      : actionOrId?.id;


  if (
    !actionId
  ) {
    return false;
  }


  return (
    FRAME_HELM_NO_ROLL_ACTIONS
      .has(
        actionId
      )
  );
}


function frameHelmActionExecutionKind(
  action
) {
  if (
    !action ||
    frameHelmActionRequiresNoRoll(
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
      "quick.grapple",
      "quick.ram",
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
    [
      "quick.quick-tech.invade",
      "quick.quick-tech.invade.fragment-signal"
    ].includes(
      action.id
    )
  ) {
    return "basic-tech-attack";
  }


  if (
    action.id ===
      "quick.quick-tech.scan"
  ) {
    return "scan";
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


function canFrameHelmExecuteAction(
  action
) {
  return (
    frameHelmActionExecutionKind(
      action
    ) !==
    null
  );
}


/* ============================================================
   Action Execution -- Actor validation
   ============================================================ */

function assertFrameHelmActionExecutionActor(
  actor
) {
  if (
    !actor ||
    typeof actor !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm action execution requires a Lancer actor."
    );
  }


  return actor;
}


function assertFrameHelmExecutableAction(
  action
) {
  if (
    !action ||
    typeof action !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm action execution requires an action definition."
    );
  }


  if (
    !String(
      action.id ??
      ""
    ).trim()
  ) {
    throw new Error(
      "Frame Helm action execution requires an action with an id."
    );
  }


  return action;
}


/* ============================================================
   Action Execution -- Mech stat selection
   ============================================================ */

function frameHelmChooseMechStat(
  action
) {
  assertFrameHelmExecutableAction(
    action
  );


  return new Promise(
    resolve => {
      const buttons =
        Object.fromEntries(
          FRAME_HELM_MECH_STAT_CHOICES
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

function executeFrameHelmStatAction(
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


function executeFrameHelmBasicAttack(
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


function executeFrameHelmBasicTechAttack(
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


function executeFrameHelmScan(
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


function executeFrameHelmStabilize(
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


function executeFrameHelmOvercharge(
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


async function executeFrameHelmChosenStatAction(
  actor,
  action
) {
  const selectedStat =
    await frameHelmChooseMechStat(
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

async function frameHelmExecuteActionRoll(
  actor,
  action
) {
  assertFrameHelmActionExecutionActor(
    actor
  );


  assertFrameHelmExecutableAction(
    action
  );


  const kind =
    frameHelmActionExecutionKind(
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
   * Improvised Attack is the first universal action migrated to
   * the canonical Frame Helm execution spine.
   *
   * All cross-cutting execution concerns remain outside this
   * feature and are supplied through runtime composition.
   */
  if (
    action.id ===
    "full.improvised-attack"
  ) {
    return executeFrameHelmCanonicalAction(
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
      executeFrameHelmStatAction(
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
      executeFrameHelmBasicAttack(
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
      executeFrameHelmBasicTechAttack(
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
      executeFrameHelmScan(
        actor
      )
    );
  }


  if (
    kind ===
      "stabilize"
  ) {
    return (
      executeFrameHelmStabilize(
        actor
      )
    );
  }


  if (
    kind ===
      "overcharge"
  ) {
    return (
      executeFrameHelmOvercharge(
        actor
      )
    );
  }


  return (
    executeFrameHelmChosenStatAction(
      actor,
      action
    )
  );
}


/* ============================================================
   Action Execution -- Diagnostics
   ============================================================ */

function getFrameHelmActionExecutionDiagnostics(
  action
) {
  const actionId =
    action?.id ??
    null;


  const kind =
    frameHelmActionExecutionKind(
      action
    );


  return Object.freeze({
    actionId,

    label:
      action?.label ??
      null,

    noRoll:
      frameHelmActionRequiresNoRoll(
        action
      ),

    executable:
      kind !==
      null,

    executionKind:
      kind,

    canonicalExecution:
      actionId ===
      "full.improvised-attack",

    runtimeBindings:
      getFrameHelmActionExecutionRuntimeBindings(),

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

export const frameHelmActionExecutionFeature =
  defineFrameHelmFeature({
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
        configureFrameHelmActionExecutionRuntime,

      execute:
        frameHelmExecuteActionRoll,

      chooseMechStat:
        frameHelmChooseMechStat
    },

    queries: {
      requiresNoRoll:
        frameHelmActionRequiresNoRoll,

      executionKind:
        frameHelmActionExecutionKind,

      canExecute:
        canFrameHelmExecuteAction,

      runtimeBindings:
        getFrameHelmActionExecutionRuntimeBindings,

      diagnostics:
        getFrameHelmActionExecutionDiagnostics
    },

    hooks: {},

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameHelmActionExecutionRuntime,

      execute:
        frameHelmExecuteActionRoll,

      executeActionRoll:
        frameHelmExecuteActionRoll,

      chooseMechStat:
        frameHelmChooseMechStat,

      requiresNoRoll:
        frameHelmActionRequiresNoRoll,

      executionKind:
        frameHelmActionExecutionKind,

      canExecute:
        canFrameHelmExecuteAction,

      runtimeBindings:
        getFrameHelmActionExecutionRuntimeBindings,

      diagnostics:
        getFrameHelmActionExecutionDiagnostics,

      noRollActions:
        FRAME_HELM_NO_ROLL_ACTIONS,

      mechStatChoices:
        FRAME_HELM_MECH_STAT_CHOICES
    },

    metadata: {
      label:
        "Action Execution",

      description:
        "Owns Frame Helm universal-action execution classification and routes migrated actions into the canonical execution spine while preserving legacy actor workflows during migration.",

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
  configureFrameHelmActionExecutionRuntime,

  getFrameHelmActionExecutionRuntimeBindings,

  executeFrameHelmCanonicalAction,

  frameHelmActionRequiresNoRoll,

  frameHelmActionExecutionKind,

  canFrameHelmExecuteAction,

  assertFrameHelmActionExecutionActor,

  assertFrameHelmExecutableAction,

  frameHelmChooseMechStat,

  executeFrameHelmStatAction,

  executeFrameHelmBasicAttack,

  executeFrameHelmBasicTechAttack,

  executeFrameHelmScan,

  executeFrameHelmStabilize,

  executeFrameHelmOvercharge,

  executeFrameHelmChosenStatAction,

  frameHelmExecuteActionRoll,

  getFrameHelmActionExecutionDiagnostics
};