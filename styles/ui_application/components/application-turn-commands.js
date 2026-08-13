/* ============================================================
   Imports -- Application turn-command dependencies
   ============================================================ */

import {
  getFrameHelmApplicationActionRegistry,
  getFrameHelmApplicationTurnState,
  getFrameHelmApplicationTurnStateManager,
  executeFrameHelmApplicationActionRoll
} from "./application-runtime-bindings.js";

import {
  getFrameHelmApplicationCombatContext
} from "./application-combat-context.js";


/* ============================================================
   Application -- Turn-plan commands
   ============================================================ */

function beginTurnPlan(
  application
) {
  const token =
    application.getControlledToken();


  if (
    !token
  ) {
    ui.notifications.warn(
      "Select a mech or NPC token first."
    );

    return;
  }


  const turnManager =
    getFrameHelmApplicationTurnStateManager();


  if (
    !turnManager
  ) {
    ui.notifications.error(
      "Frame Helm could not resolve the Turn state manager."
    );

    return;
  }


  const combat =
    game.combat;

  const combatContext =
    combat?.started
      ? getFrameHelmApplicationCombatContext(
          combat
        )
      : {};


  turnManager.beginTurn({
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
          Number.isFinite(
            numericSpeed
          ) &&
          numericSpeed >= 0
            ? numericSpeed
            : null
        );
      })()
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
}


function resetTurnPlan(
  application
) {
  const token =
    application.getControlledToken();

  const previousState =
    getFrameHelmApplicationTurnState();

  const turnManager =
    getFrameHelmApplicationTurnStateManager();


  if (
    !turnManager
  ) {
    ui.notifications.error(
      "Frame Helm could not resolve the Turn state manager."
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
    "Frame Helm turn plan reset."
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
    getFrameHelmApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  const state =
    getFrameHelmApplicationTurnState();


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
    !state
  ) {
    ui.notifications.warn(
      "Begin a turn plan before committing movement."
    );

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
    getFrameHelmApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  const state =
    getFrameHelmApplicationTurnState();


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
    !state
  ) {
    ui.notifications.warn(
      "Begin a turn plan before selecting actions."
    );

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
   Application -- Quick-action execution
   ============================================================ */

function executeQuickAction(
  application,
  actionId,
  useOvercharge = false
) {
  const registry =
    getFrameHelmApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );

  const state =
    getFrameHelmApplicationTurnState();


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
    !state
  ) {
    ui.notifications.warn(
      "Begin a turn plan before selecting actions."
    );

    return;
  }


  try {
    let automaticallyTriggeredOvercharge =
      false;

    let overchargeHeatFormula =
      null;


    if (
      useOvercharge &&
      !state.overcharge.used
    ) {
      overchargeHeatFormula =
        state.useOvercharge();

      automaticallyTriggeredOvercharge =
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
          "Boost was recorded, but Frame Helm cannot refresh movement until the unit's Speed is entered."
        );
      }
    }


    const sourceLabel =
      useOvercharge
        ? " using Overcharge"
        : "";


    if (
      automaticallyTriggeredOvercharge
    ) {
      ui.notifications.warn(
        `Overcharge triggered. Apply ${overchargeHeatFormula} Heat. ${action.label} was recorded using the granted Quick Action.`
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
    getFrameHelmApplicationTurnState();


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
    getFrameHelmApplicationActionRegistry();

  const action =
    registry.get(
      committedActionIdValue
    );


  if (
    !action
  ) {
    ui.notifications.error(
      `Unknown Frame Helm action: ${committedActionIdValue}`
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
    await executeFrameHelmApplicationActionRoll(
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
      "Frame Helm could not execute the committed action."
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
    getFrameHelmApplicationActionRegistry();

  const state =
    getFrameHelmApplicationTurnState();

  const turnManager =
    getFrameHelmApplicationTurnStateManager();


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
        "[data-frame-helm-speed-input]"
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
      "Frame Helm turn plan ended."
    );
  }
}


/* ============================================================
   Application -- Generic action selection
   ============================================================ */

function onActionSelected(
  application,
  actionId
) {
  const registry =
    getFrameHelmApplicationActionRegistry();

  const action =
    registry.get(
      actionId
    );


  if (
    !action
  ) {
    ui.notifications.error(
      `Unknown Frame Helm action: ${actionId}`
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
      getFrameHelmApplicationTurnState();

    if (
      !state
    ) {
      ui.notifications.warn(
        "Begin a turn plan before using Overcharge."
      );

      return;
    }

    try {
      const heatFormula =
        state.useOvercharge();

      application.render(
        false
      );

      ui.notifications.info(
        `Overcharge selected. Apply ${heatFormula} Heat. One additional quick action is available.`
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
  beginTurnPlan,
  resetTurnPlan,
  commitMovementAction,
  executeFullAction,
  executeQuickAction,
  executeCommittedAction,
  onCommand,
  onActionSelected
};
