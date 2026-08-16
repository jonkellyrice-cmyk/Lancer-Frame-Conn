/* ============================================================
   Imports -- Application turn-command dependencies
   ============================================================ */

import {
  getFrameConnApplicationActionRegistry,
  getFrameConnApplicationTurnState,
  getFrameConnApplicationTurnStateManager,
  executeFrameConnApplicationActionRoll
} from "./application-runtime-bindings.js";

import {
  getFrameConnApplicationCombatContext
} from "./application-combat-context.js";


/* ============================================================
   Application -- Turn-plan commands
   ============================================================ */

function ensureTurnPlan(
  application
) {
  const existingState =
    getFrameConnApplicationTurnState();

  if (
    existingState &&
    !existingState.ended
  ) {
    return existingState;
  }

  const token =
    application.getControlledToken();

  if (
    !token
  ) {
    ui.notifications.warn(
      "Select a mech or NPC token first."
    );
    return null;
  }

  const turnManager =
    getFrameConnApplicationTurnStateManager();

  if (
    !turnManager
  ) {
    ui.notifications.error(
      "Frame Conn could not resolve the Turn state manager."
    );
    return null;
  }

  const combat =
    game.combat;

  const combatContext =
    combat?.started
      ? getFrameConnApplicationCombatContext(
          combat
        )
      : {};

  return turnManager.ensureTurn({
    ...combatContext,
    tokenId:
      token.id ??
      token.document?.id ??
      combatContext.tokenId ??
      null,
    actorId:
      token.actor?.id ??
      combatContext.actorId ??
      null,
    sceneId:
      canvas?.scene?.id ??
      combatContext.sceneId ??
      null,
    speed:
      (() => {
        const numericSpeed =
          Number(
            token.actor?.system?.speed
          );
        return (
          Number.isFinite(numericSpeed) &&
          numericSpeed >= 0
            ? numericSpeed
            : null
        );
      })()
  });
}


function beginTurnPlan(
  application
) {
  const state =
    ensureTurnPlan(
      application
    );

  if (
    !state
  ) {
    return null;
  }

  application.selectedCategory = null;
  application.selectedMovementMode = null;
  application.selectedQuickActionId = null;
  application.selectedFullActionId = null;
  application.render(false);
  return state;
}


function resetTurnPlan(
  application
) {
  const token =
    application.getControlledToken();

  const previousState =
    getFrameConnApplicationTurnState();

  const turnManager =
    getFrameConnApplicationTurnStateManager();


  if (
    !turnManager
  ) {
    ui.notifications.error(
      "Frame Conn could not resolve the Turn state manager."
    );

    return;
  }


  turnManager.beginTurn({
    ...(
      previousState?.context ??
      {}
    ),

    tokenId:
      token?.id ??
      token?.document?.id ??
      previousState?.context?.tokenId ??
      null,

    actorId:
      token?.actor?.id ??
      previousState?.context?.actorId ??
      null,

    sceneId:
      canvas?.scene?.id ??
      previousState?.context?.sceneId ??
      null,

    speed:
      previousState?.speed ??
      null
  });


  application.selectedCategory =
    null;

  application.selectedMovementMode =
    null;

  application.selectedQuickActionId =
    null;

  application.selectedFullActionId =
    null;

  application.render(
    false
  );

  ui.notifications.info(
    "Frame Conn turn plan reset."
  );
}


/* ============================================================
   Application -- Movement commands
   ============================================================ */

function commitMovementAction(
  application,
  actionId
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  let state =
    getFrameConnApplicationTurnState();


  if (
    !action ||
    action.category !==
      "movement" ||
    action.cost !==
      "movement"
  ) {
    ui.notifications.error(
      "The selected entry is not a valid movement action."
    );

    return;
  }


  if (
    !state ||
    state.ended
  ) {
    state = ensureTurnPlan(application);
  }

  if (
    !state
  ) {
    return;
  }


  try {
    const committedDistance =
      state.commitMovement(
        action.id
      );

    application.selectedMovementMode =
      action.id;

    ui.notifications.info(
      `${action.label} committed for ${committedDistance} space(s).`
    );

    application.render(
      false
    );
  } catch (
    error
  ) {
    ui.notifications.warn(
      error.message
    );
  }
}


/* ============================================================
   Application -- Full-action execution
   ============================================================ */

function executeFullAction(
  application,
  actionId
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  let state =
    getFrameConnApplicationTurnState();


  if (
    !action ||
    action.cost !==
      "full"
  ) {
    ui.notifications.error(
      "The selected entry is not a valid Full Action."
    );

    return;
  }


  if (
    !state ||
    state.ended
  ) {
    state = ensureTurnPlan(application);
  }

  if (
    !state
  ) {
    return;
  }


  try {
    state.useAction(
      action
    );

    ui.notifications.info(
      `${action.label} recorded as the unit's Full Action.`
    );

    application.selectedFullActionId =
      null;

    application.render(
      false
    );
  } catch (
    error
  ) {
    ui.notifications.warn(
      error.message
    );
  }
}


/* ============================================================
   Application -- Native Overcharge execution
   ============================================================ */

async function executeNativeFrameConnOvercharge(
  application,
  state,
  registry
) {
  const overchargeAction =
    registry.get(
      "special.overcharge"
    );


  if (
    !overchargeAction
  ) {
    throw new Error(
      "Frame Conn could not resolve the Overcharge action."
    );
  }


  const permission =
    state.canUseAction(
      overchargeAction
    );


  if (
    !permission.allowed
  ) {
    throw new Error(
      permission.reason ??
      "Overcharge is not available."
    );
  }


  const token =
    application.getControlledToken();

  const actor =
    token?.actor ??
    null;


  if (
    !actor
  ) {
    throw new Error(
      "Select the mech token that should Overcharge."
    );
  }


  const nativeHeatFormula =
    typeof actor
      .strussHelper
      ?.getOverchargeRoll ===
      "function"
      ? actor.strussHelper
          .getOverchargeRoll()
      : null;


  const nativeResult =
    await executeFrameConnApplicationActionRoll(
      actor,
      overchargeAction
    );


  if (
    nativeResult === false
  ) {
    throw new Error(
      "Native Lancer Overcharge did not complete."
    );
  }


  state.useOvercharge({
    heatFormula:
      nativeHeatFormula
  });


  return {
    actor,
    heatFormula:
      nativeHeatFormula,
    nativeResult
  };
}


/* ============================================================
   Application -- Quick-action execution
   ============================================================ */

async function executeQuickAction(
  application,
  actionId,
  useOvercharge = false
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  let state =
    getFrameConnApplicationTurnState();


  if (
    !action ||
    action.cost !==
      "quick"
  ) {
    ui.notifications.error(
      "The selected entry is not a valid quick action."
    );

    return;
  }


  if (
    !state ||
    state.ended
  ) {
    state = ensureTurnPlan(application);
  }

  if (
    !state
  ) {
    return;
  }


  try {
    let resolvedNativeOvercharge =
      false;


    if (
      useOvercharge &&
      !state.overcharge.used
    ) {
      await executeNativeFrameConnOvercharge(
        application,
        state,
        registry
      );

      resolvedNativeOvercharge =
        true;
    }


    state.useAction(
      action,
      {
        useOvercharge
      }
    );


    if (
      action.id ===
      "quick.boost"
    ) {
      const refreshedMovement =
        state.refreshMovementFromBoost();

      if (
        refreshedMovement ===
        null
      ) {
        ui.notifications.warn(
          "Boost was recorded, but Frame Conn cannot refresh movement until the unit's Speed is entered."
        );
      }
    }


    const sourceLabel =
      useOvercharge
        ? " using Overcharge"
        : "";


    if (
      resolvedNativeOvercharge
    ) {
      ui.notifications.info(
        `Overcharge resolved through native Lancer. ${action.label} was recorded using the granted Quick Action.`
      );
    } else {
      ui.notifications.info(
        `${action.label} recorded${sourceLabel}.`
      );
    }


    application.selectedQuickActionId =
      null;

    application.render(
      false
    );
  } catch (
    error
  ) {
    ui.notifications.warn(
      error.message
    );
  }
}


/* ============================================================
   Application -- Committed-action execution
   ============================================================ */

/**
 * Execute one exact committed Turn action through the configured
 * application execution boundary.
 *
 * The committed entry is marked executed only after the configured
 * execution boundary resolves successfully.
 */
async function executeCommittedAction(
  application,
  committedActionId,
  actionId = null
) {
  const state =
    getFrameConnApplicationTurnState();


  if (
    !state
  ) {
    ui.notifications.warn(
      "Begin a turn plan before executing committed actions."
    );

    return;
  }


  const committedEntry =
    Array.isArray(
      state.usedActions
    )
      ? state.usedActions.find(
          entry =>
            entry?.id ===
            committedActionId
        )
      : null;


  if (
    !committedEntry
  ) {
    ui.notifications.error(
      "The committed action could not be found."
    );

    application.render(
      false
    );

    return;
  }


  if (
    committedEntry.executed
  ) {
    ui.notifications.warn(
      "That committed action has already been executed."
    );

    application.render(
      false
    );

    return;
  }


  const committedActionIdValue =
    committedEntry.actionId ??
    null;


  if (
    actionId &&
    committedActionIdValue !==
      actionId
  ) {
    ui.notifications.error(
      "The committed action no longer matches the selected execution control."
    );

    application.render(
      false
    );

    return;
  }


  const registry =
    getFrameConnApplicationActionRegistry();

  const action =
    registry.get(
      committedActionIdValue
    );


  if (
    !action
  ) {
    ui.notifications.error(
      `Unknown Frame Conn action: ${committedActionIdValue}`
    );

    application.render(
      false
    );

    return;
  }


  const token =
    application.getControlledToken();

  const actor =
    token?.actor ??
    null;


  if (
    !actor
  ) {
    ui.notifications.warn(
      "Select the mech or NPC token that should execute this committed action."
    );

    return;
  }


  try {
    await executeFrameConnApplicationActionRoll(
      actor,
      action
    );


    state.markCommittedActionExecuted(
      committedEntry.id,
      {
        actionId:
          action.id,

        actorId:
          actor.id ??
          null,

        tokenId:
          token.id ??
          token.document?.id ??
          null,

        source:
          "committed-plan"
      }
    );


    application.render(
      false
    );
  } catch (
    error
  ) {
    ui.notifications.warn(
      error?.message ??
      "Frame Conn could not execute the committed action."
    );
  }
}


/* ============================================================
   Application -- General commands
   ============================================================ */

function onCommand(
  application,
  command
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const state =
    getFrameConnApplicationTurnState();

  const turnManager =
    getFrameConnApplicationTurnStateManager();


  if (
    command ===
    "back"
  ) {
    application.selectedCategory =
      null;

    application.selectedMovementMode =
      null;

    application.selectedQuickActionId =
      null;

    application.selectedFullActionId =
      null;

    application.render(
      false
    );

    return;
  }


  if (
    command ===
    "quick-back"
  ) {
    if (
      !application.selectedQuickActionId
    ) {
      application.selectedCategory =
        null;

      application.render(
        false
      );

      return;
    }


    const selectedAction =
      registry.get(
        application.selectedQuickActionId
      );

    const parentAction =
      selectedAction?.parentId
        ? registry.get(
            selectedAction.parentId
          )
        : null;

    application.selectedQuickActionId =
      parentAction?.category ===
      "quick"
        ? parentAction.id
        : null;

    application.render(
      false
    );

    return;
  }


  if (
    command ===
    "full-back"
  ) {
    if (
      application.selectedFullActionId
    ) {
      application.selectedFullActionId =
        null;
    } else {
      application.selectedCategory =
        null;
    }

    application.render(
      false
    );

    return;
  }


  if (
    command ===
    "set-speed"
  ) {
    const input =
      application.element.find(
        "[data-frame-conn-speed-input]"
      )[
        0
      ];

    const speed =
      Number(
        input?.value
      );


    if (
      !Number.isFinite(
        speed
      ) ||
      speed < 0
    ) {
      ui.notifications.warn(
        "Enter a valid non-negative Speed value."
      );

      return;
    }


    if (
      !state
    ) {
      ui.notifications.warn(
        "No turn plan is active."
      );

      return;
    }


    try {
      state.setSpeed(
        speed
      );

      application.render(
        false
      );
    } catch (
      error
    ) {
      ui.notifications.warn(
        error.message
      );
    }

    return;
  }


  if (
    command ===
    "complete-movement"
  ) {
    if (
      !state
    ) {
      return;
    }

    try {
      state.completeMovement();
      application.render(false);
    } catch (
      error
    ) {
      ui.notifications.warn(
        error.message
      );
    }

    return;
  }


  if (
    command ===
    "reopen-movement"
  ) {
    if (
      !state
    ) {
      return;
    }

    try {
      state.reopenMovement();
      application.render(false);
    } catch (
      error
    ) {
      ui.notifications.warn(
        error.message
      );
    }

    return;
  }


  if (
    command ===
    "reset-movement"
  ) {
    if (
      !state
    ) {
      return;
    }

    state.movement.spent =
      0;

    state.movement.remaining =
      state.movement.maximum;

    state.movement.completed =
      false;

    state.recordHistory(
      "reset-movement",
      {
        maximum:
          state.movement.maximum
      }
    );

    application.selectedMovementMode =
      null;

    application.render(
      false
    );

    ui.notifications.info(
      "Movement tracking reset."
    );

    return;
  }


  if (
    command ===
    "begin-turn"
  ) {
    beginTurnPlan(
      application
    );

    return;
  }


  if (
    command ===
    "reset-turn"
  ) {
    resetTurnPlan(
      application
    );

    return;
  }


  if (
    command ===
    "end-turn"
  ) {
    if (
      turnManager
    ) {
      turnManager.endTurn();
    }

    application.selectedCategory =
      null;

    application.selectedMovementMode =
      null;

    application.selectedQuickActionId =
      null;

    application.selectedFullActionId =
      null;

    application.render(
      false
    );

    ui.notifications.info(
      "Frame Conn turn plan ended."
    );
  }
}


/* ============================================================
   Application -- Generic action selection
   ============================================================ */

async function onActionSelected(
  application,
  actionId
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );


  if (
    !action
  ) {
    ui.notifications.error(
      `Unknown Frame Conn action: ${actionId}`
    );

    return;
  }


  if (
    action.category ===
    "quick"
  ) {
    application.selectedCategory =
      "quick";

    application.selectedQuickActionId =
      action.id;

    application.render(
      false
    );

    return;
  }


  if (
    action.category ===
    "full"
  ) {
    application.selectedCategory =
      "full";

    application.selectedFullActionId =
      action.id;

    application.render(
      false
    );

    return;
  }


  if (
    action.id ===
    "special.end-turn"
  ) {
    onCommand(
      application,
      "end-turn"
    );

    return;
  }


  if (
    action.id ===
    "special.overcharge"
  ) {
    const state =
      ensureTurnPlan(
        application
      );

    if (
      !state
    ) {
      return;
    }

    try {
      await executeNativeFrameConnOvercharge(
        application,
        state,
        registry
      );

      application.render(
        false
      );

      ui.notifications.info(
        "Overcharge resolved through native Lancer. One additional quick action is available."
      );
    } catch (
      error
    ) {
      ui.notifications.warn(
        error.message
      );
    }

    return;
  }


  ui.notifications.info(
    `${action.label} selected. Its guided workflow will be added in the next development steps.`
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  ensureTurnPlan,
  beginTurnPlan,
  resetTurnPlan,
  commitMovementAction,
  executeFullAction,
  executeQuickAction,
  executeCommittedAction,
  onCommand,
  onActionSelected
};
