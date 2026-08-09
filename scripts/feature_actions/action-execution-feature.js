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
 *   Owns Frame Helm's delegation of executable universal actions
 *   into Lancer actor-sheet workflows.
 *
 * PURPOSE:
 *   Remove action execution classification, mech-skill selection,
 *   and actor workflow delegation from runtime-orchestrator.js
 *   while preserving the existing execution behavior exactly.
 *
 * RESPONSIBILITIES:
 *   - Identify actions which do not require a roll or actor-sheet
 *     execution workflow.
 *   - Resolve the execution kind for a universal action.
 *   - Resolve stat-driven action execution.
 *   - Resolve basic attack execution.
 *   - Resolve basic tech attack execution.
 *   - Resolve Scan execution.
 *   - Resolve Stabilize execution.
 *   - Resolve Overcharge execution.
 *   - Prompt for HULL / AGI / SYS / ENG when an action requires a
 *     chosen mech skill.
 *   - Delegate execution into the corresponding Lancer actor
 *     workflow.
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
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   actions-feature.js
 *        │
 *        │ action declarations
 *        ▼
 *   turn-feature.js
 *        │
 *        │ committed/legal action state
 *        ▼
 *   action-execution-feature.js
 *        │
 *        ├── execution-kind resolution
 *        ├── mech-stat selection
 *        └── actor workflow delegation
 *        │
 *        ▼
 *   Lancer Actor
 *        │
 *        ├── beginStatFlow()
 *        ├── beginBasicAttackFlow()
 *        ├── beginBasicTechAttackFlow()
 *        ├── beginScanFlow()
 *        ├── beginStabilizeFlow()
 *        └── beginOverchargeFlow()
 *
 *
 * CURRENT APPLICATION RELATIONSHIP:
 *
 *   action-execution-feature.js
 *        │
 *        │ execute(actor, action)
 *        ▼
 *   runtime-orchestrator.js
 *        │
 *        │ runtime binding
 *        ▼
 *   ui-application.js
 *
 *   During the current migration, runtime-orchestrator.js remains
 *   responsible for supplying the registered Action Execution API
 *   to ui-application.js.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - action-execution
 *     - action-execution.classification
 *     - action-execution.mech-stat-selection
 *     - action-execution.actor-workflow
 *
 *   Required dependencies:
 *     - none
 *
 *   Optional dependencies:
 *     - actions.registry
 *     - turn.actions
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership and composition only.
 *
 *   Existing action classification, mech-stat selection, and actor
 *   workflow delegation are preserved.
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
   Action Execution -- No-roll actions
   ============================================================ */

/**
 * Actions which commit gameplay state but do not themselves
 * require a Lancer actor-sheet roll or execution workflow.
 *
 * These action ids preserve the exact classification previously
 * owned by runtime-orchestrator.js.
 */
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

/**
 * Canonical mech-skill choices exposed by the execution dialog.
 */
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

/**
 * Returns whether an action requires no actor-sheet execution
 * workflow.
 */
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


/**
 * Resolves the actor workflow required to execute one universal
 * action.
 *
 * Returns:
 *
 *   null
 *     No actor-sheet workflow is required.
 *
 *   "stat"
 *     Use action.metadata.statPath directly.
 *
 *   "basic-attack"
 *     Delegate to beginBasicAttackFlow().
 *
 *   "basic-tech-attack"
 *     Delegate to beginBasicTechAttackFlow().
 *
 *   "scan"
 *     Delegate to beginScanFlow().
 *
 *   "stabilize"
 *     Delegate to beginStabilizeFlow().
 *
 *   "overcharge"
 *     Delegate to beginOverchargeFlow().
 *
 *   "choose-stat"
 *     Prompt the user to choose HULL / AGI / SYS / ENG, then
 *     delegate to beginStatFlow().
 */
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


/**
 * Returns whether the supplied action has an executable
 * actor-sheet workflow.
 */
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

/**
 * Ensures execution received a usable actor object.
 *
 * Actor-specific method validation remains workflow-local so a
 * Lancer system error still identifies the missing integration
 * surface precisely.
 */
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


/**
 * Ensures execution received a usable action object.
 */
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

/**
 * Opens the existing Foundry Dialog allowing the user to select
 * the mech skill used to resolve an action.
 *
 * Resolves:
 *
 *   {
 *     path: "hull" | "agi" | "sys" | "eng",
 *     label: "HULL" | "AGI" | "SYS" | "ENG"
 *   }
 *
 * or null when cancelled.
 */
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
   Action Execution -- Stat workflow
   ============================================================ */

/**
 * Delegates directly to a known actor stat workflow.
 */
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


/* ============================================================
   Action Execution -- Basic attack workflow
   ============================================================ */

/**
 * Delegates to the Lancer basic attack workflow.
 */
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


/* ============================================================
   Action Execution -- Basic tech attack workflow
   ============================================================ */

/**
 * Delegates to the Lancer basic tech attack workflow.
 */
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


/* ============================================================
   Action Execution -- Scan workflow
   ============================================================ */

/**
 * Delegates to the Lancer Scan workflow.
 */
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


/* ============================================================
   Action Execution -- Stabilize workflow
   ============================================================ */

/**
 * Delegates to the Lancer Stabilize workflow.
 */
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


/* ============================================================
   Action Execution -- Overcharge workflow
   ============================================================ */

/**
 * Delegates to the Lancer Overcharge workflow.
 */
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


/* ============================================================
   Action Execution -- Chosen-stat workflow
   ============================================================ */

/**
 * Prompts for a mech skill, then delegates to beginStatFlow().
 */
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
   Action Execution -- Actor workflow delegation
   ============================================================ */

/**
 * Executes one action through the appropriate Lancer actor
 * workflow.
 *
 * This preserves the exact routing previously owned by
 * runtime-orchestrator.js.
 */
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

/**
 * Returns presentation-safe classification information for one
 * action.
 */
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

/**
 * Canonical Action Execution feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * Application-wide registration remains owned by:
 *
 *   scripts/feature-registry.js
 */
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
      "action-execution.actor-workflow"
    ],

    dependsOn: [],

    optionalDependsOn: [
      "actions.registry",
      "turn.actions"
    ],

    state: {},

    commands: {
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

      diagnostics:
        getFrameHelmActionExecutionDiagnostics
    },

    hooks: {},

    lifecycle: {},

    api: {
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
        "Owns Frame Helm universal-action execution classification, mech-skill selection, and delegation into Lancer actor-sheet workflows.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      actionDomain:
        "scripts/actions-feature.js",

      turnDomain:
        "scripts/turn-feature.js",

      applicationConsumer:
        "styles/ui-application.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "actor-workflow-delegation",

      targetSelectionOwnership:
        "future-or-separate-domain",

      mutationPolicy:
        "delegates-to-lancer-actor-workflows"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

/**
 * Named exports preserve a straightforward low-risk transition
 * while runtime-orchestrator.js and ui-application.js are moved
 * to registry-based Action Execution access.
 */
export {
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