/* ============================================================
   Imports -- Application view-model dependencies
   ============================================================ */

import {
  getFrameConnApplicationActionRegistry,
  getFrameConnApplicationTurnState
} from "./application-runtime-bindings.js";

import {
  getManualStats,
  synchronizeTurnSpeed
} from "./application-telemetry.js";


/* ============================================================
   Application -- Controlled token
   ============================================================ */

function getControlledToken() {
  const controlledTokens =
    canvas?.tokens?.controlled ??
    [];


  if (
    controlledTokens.length >
    0
  ) {
    return (
      controlledTokens[
        0
      ]
    );
  }


  return (
    game.combat
      ?.combatant
      ?.token
      ?.object ??
    null
  );
}


/* ============================================================
   Application -- Turn-state presentation
   ============================================================ */

function getTurnStateForDisplay() {
  const turnState =
    getFrameConnApplicationTurnState();


  if (
    !turnState
  ) {
    return null;
  }


  if (
    typeof turnState.snapshot ===
    "function"
  ) {
    return (
      turnState.snapshot()
    );
  }


  return turnState;
}


function actionAvailability(
  action,
  turnState
) {
  if (
    !turnState
  ) {
    return {
      allowed:
        false,

      reason:
        "Begin a turn plan first."
    };
  }


  const state =
    getFrameConnApplicationTurnState();


  if (
    !state
  ) {
    return {
      allowed:
        false,

      reason:
        "No active turn state could be resolved."
    };
  }


  return (
    state.canUseAction(
      action
    )
  );
}


function actionViewModel(
  action,
  turnState
) {
  const availability =
    actionAvailability(
      action,
      turnState
    );


  return {
    ...action,

    allowed:
      availability.allowed,

    unavailableReason:
      availability.reason ??
      ""
  };
}


function categoryViewModel(
  category,
  turnState
) {
  const registry =
    getFrameConnApplicationActionRegistry();


  const actions =
    registry.roots(
      category.id
    );


  const actionModels =
    actions.map(
      action => {
        return (
          actionViewModel(
            action,
            turnState
          )
        );
      }
    );


  return {
    ...category,

    actions:
      actionModels,

    hasActions:
      actionModels.length >
      0,

    hasAvailableAction:
      actionModels.some(
        action =>
          action.allowed
      )
  };
}


/* ============================================================
   Application -- View data
   ============================================================ */

function getApplicationViewData(
  application,
  moduleTitle
) {
  const selectedToken =
    getControlledToken();


  synchronizeTurnSpeed(
    application,
    selectedToken
  );


  const turnState =
    getTurnStateForDisplay();

  const manualStats =
    getManualStats(
      application,
      selectedToken
    );

  const registry =
    getFrameConnApplicationActionRegistry();


  const allCategories =
    registry.listCategories();


  const visibleCategoryIds = [
    "movement",
    "quick",
    "full",
    "special",
    "protocol",
    "reaction"
  ];


  const categories =
    allCategories
      .filter(
        category => {
          return (
            visibleCategoryIds.includes(
              category.id
            )
          );
        }
      )
      .map(
        category => {
          return (
            categoryViewModel(
              category,
              turnState
            )
          );
        }
      );


  const selectedCategory =
    categories.find(
      category =>
        category.id ===
        application.selectedCategory
    ) ??
    null;


  return {
    moduleTitle,

    tokenName:
      selectedToken?.name ??
      selectedToken?.document?.name ??
      "No token selected",

    tokenImage:
      selectedToken
        ?.document
        ?.texture
        ?.src ??
      selectedToken
        ?.actor
        ?.img ??
      null,

    hasSelectedToken:
      Boolean(
        selectedToken
      ),

    hasTurnState:
      Boolean(
        turnState
      ),

    controlledToken:
      selectedToken,

    manualStats,

    turnState,

    categories,

    selectedCategory
  };
}


/* ============================================================
   Exports
   ============================================================ */

export {
  getControlledToken,
  getTurnStateForDisplay,
  actionAvailability,
  actionViewModel,
  categoryViewModel,
  getApplicationViewData
};
