/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-state-movement.js
 */


/**
 * ============================================================
 * FRAME CONN TURN -- MOVEMENT STATE BEHAVIOR
 * ============================================================
 *
 * ROLE:
 *   Owns movement-related behavior currently retained inside the
 *   Frame Conn Turn state model.
 *
 * PURPOSE:
 *   Remove the large transitional movement implementation from
 *   turn-state.js while preserving FrameConnTurnState as the
 *   authoritative owner of per-turn state.
 *
 * OWNS:
 *   - Turn Speed mutation.
 *   - Manual movement spending.
 *   - Movement completion.
 *   - Movement reopening.
 *   - Movement commitment.
 *   - Boost movement-pool refresh.
 *   - Boost-entry inspection.
 *   - Boost-count inspection.
 *   - Movement-event deduplication.
 *   - Automatic Boost commitment.
 *   - Automatic Overcharge + Boost commitment.
 *   - Tracked-movement recalculation.
 *   - Token-movement state accounting.
 *
 * DOES NOT OWN:
 *   - FrameConnTurnState construction.
 *   - FrameConnTurnStateManager.
 *   - Canonical Turn-manager construction.
 *   - Actions registry ownership.
 *   - Action definitions.
 *   - Token-path measurement.
 *   - Foundry moveToken interpretation.
 *   - Elevation interpretation.
 *   - Foundry combat synchronization.
 *   - Application rendering.
 *   - Turn feature declaration.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   turn-runtime-bindings.js
 *        │
 *        │ Actions-registry access
 *        ▼
 *   turn-state-movement.js
 *        │
 *        │ operates on FrameConnTurnState
 *        ▼
 *   turn-state.js
 *        │
 *        ▼
 *   turn-state-manager.js
 *        │
 *        ▼
 *   turn-commands.js
 *        │
 *        ▼
 *   turn-feature.js
 *
 * STATE OWNERSHIP CONTRACT:
 *
 *   This module does NOT create or retain a second movement-state
 *   object.
 *
 *   Every exported function receives the authoritative
 *   FrameConnTurnState instance as its first argument and mutates
 *   that state directly.
 *
 *   turn-state.js should preserve its existing public method
 *   surface by delegating methods such as:
 *
 *     setSpeed()
 *     spendMovement()
 *     completeMovement()
 *     reopenMovement()
 *     commitMovement()
 *     refreshMovementFromBoost()
 *     movementBoostEntries()
 *     movementBoostCount()
 *     hasProcessedMovementId()
 *     rememberMovementId()
 *     ensureAutomaticMovementBoost()
 *     recalculateTrackedMovement()
 *     trackTokenMovement()
 *
 *   to the functions exported here.
 *
 * TRANSITIONAL OWNERSHIP:
 *
 *   Movement accounting remains structurally part of Turn state
 *   during this decomposition stage because action expenditure,
 *   Boost, and Overcharge remain tightly coupled to the current
 *   turn budget.
 *
 *   The separate movement-feature.js continues to own Foundry
 *   movement interpretation and feeds interpreted movement into
 *   this state layer.
 */


/* ============================================================
   Imports -- Turn runtime dependencies
   ============================================================ */

import {
  getFrameConnTurnActionRegistry
} from "./turn-runtime-bindings.js";


/* ============================================================
   Movement state -- Speed
   ============================================================ */

/**
 * Updates the movement Speed stored by a FrameConnTurnState.
 *
 * Existing spent movement is clamped to the new maximum.
 */
function setFrameConnTurnStateSpeed(
  state,
  speed
) {
  const numericSpeed =
    Number(
      speed
    );


  if (
    !Number.isFinite(
      numericSpeed
    ) ||
    numericSpeed < 0
  ) {
    throw new TypeError(
      "Frame Conn speed must be a non-negative number."
    );
  }


  const previousMaximum =
    state.movement.maximum;


  const previousSpent =
    state.movement.spent;


  state.speed =
    numericSpeed;


  state.movement.maximum =
    numericSpeed;


  state.movement.spent =
    Math.min(
      previousSpent,
      numericSpeed
    );


  state.movement.remaining =
    Math.max(
      0,
      numericSpeed -
        state.movement.spent
    );


  if (
    previousMaximum ===
    null
  ) {
    state.recordHistory(
      "set-speed",
      {
        speed:
          numericSpeed
      }
    );
  }


  return (
    state.movement.remaining
  );
}


/* ============================================================
   Movement state -- Manual spending
   ============================================================ */

/**
 * Spends movement from the currently-active movement allowance.
 */
function spendFrameConnTurnStateMovement(
  state,
  distance
) {
  state.assertTurnActive();


  const numericDistance =
    Number(
      distance
    );


  if (
    !Number.isFinite(
      numericDistance
    ) ||
    numericDistance < 0
  ) {
    throw new TypeError(
      "Movement distance must be a non-negative number."
    );
  }


  if (
    state.movement.maximum ===
    null
  ) {
    throw new Error(
      "Movement speed has not been assigned to this turn."
    );
  }


  if (
    numericDistance >
    state.movement.remaining
  ) {
    throw new Error(
      `Only ${state.movement.remaining} movement remains.`
    );
  }


  state.movement.spent +=
    numericDistance;


  state.movement.remaining -=
    numericDistance;


  if (
    state.movement.remaining ===
    0
  ) {
    state.movement.completed =
      true;
  }


  state.closeProtocolWindow();


  state.recordHistory(
    "spend-movement",
    {
      distance:
        numericDistance
    }
  );


  return (
    state.movement.remaining
  );
}


/* ============================================================
   Movement state -- Completion
   ============================================================ */

/**
 * Marks the current movement allowance complete.
 */
function completeFrameConnTurnStateMovement(
  state
) {
  state.assertTurnActive();


  state.movement.completed =
    true;


  state.recordHistory(
    "complete-movement",
    {
      remaining:
        state.movement.remaining
    }
  );
}


/* ============================================================
   Movement state -- Reopening
   ============================================================ */

/**
 * Reopens movement.
 *
 * Existing behavior is preserved:
 *
 * if the current allowance has been completely spent, reopening
 * restores a fresh allowance equal to Speed.
 */
function reopenFrameConnTurnStateMovement(
  state
) {
  state.assertTurnActive();


  if (
    state.movement.maximum !==
      null &&
    state.movement.remaining <=
      0
  ) {
    state.movement.spent =
      0;


    state.movement.remaining =
      state.movement.maximum;
  }


  state.movement.completed =
    false;


  state.recordHistory(
    "reopen-movement",
    {
      remaining:
        state.movement.remaining
    }
  );
}


/* ============================================================
   Movement state -- Commitment
   ============================================================ */

/**
 * Commits all currently-remaining movement using a selected
 * movement action.
 */
function commitFrameConnTurnStateMovement(
  state,
  actionId
) {
  state.assertTurnActive();


  if (
    state.movement.maximum ===
    null
  ) {
    throw new Error(
      "Movement speed has not been assigned to this turn."
    );
  }


  if (
    state.movement.completed
  ) {
    throw new Error(
      "Movement has already been committed."
    );
  }


  if (
    state.movement.remaining <=
    0
  ) {
    throw new Error(
      "No movement remains to commit."
    );
  }


  const committedDistance =
    state.movement.remaining;


  state.movement.spent +=
    committedDistance;


  state.movement.remaining =
    0;


  state.movement.completed =
    true;


  state.closeProtocolWindow();


  state.recordHistory(
    "movement-commit",
    {
      actionId,

      distance:
        committedDistance
    }
  );


  return committedDistance;
}


/* ============================================================
   Movement state -- Boost pool refresh
   ============================================================ */

/**
 * Restores the movement allowance after a manually-recorded Boost.
 */
function refreshFrameConnTurnStateMovementFromBoost(
  state
) {
  state.assertTurnActive();


  if (
    state.movement.maximum ===
    null
  ) {
    state.recordHistory(
      "boost-movement-refill",
      {
        distance:
          null
      }
    );


    return null;
  }


  state.movement.spent =
    0;


  state.movement.remaining =
    state.movement.maximum;


  state.movement.completed =
    false;


  state.recordHistory(
    "boost-movement-refill",
    {
      distance:
        state.movement.maximum
    }
  );


  return (
    state.movement.remaining
  );
}


/* ============================================================
   Movement state -- Boost inspection
   ============================================================ */

/**
 * Returns committed Quick Boost action entries.
 */
function getFrameConnTurnStateMovementBoostEntries(
  state
) {
  return (
    state.usedActions.filter(
      entry => {
        return (
          entry.actionId ===
          "quick.boost"
        );
      }
    )
  );
}


/**
 * Returns the number of committed Boost actions.
 */
function getFrameConnTurnStateMovementBoostCount(
  state
) {
  return (
    getFrameConnTurnStateMovementBoostEntries(
      state
    ).length
  );
}


/* ============================================================
   Movement state -- Movement-event identity
   ============================================================ */

/**
 * Returns whether a movement event has already been processed.
 *
 * Movement IDs prevent duplicate accounting when multiple Foundry
 * surfaces report the same token movement.
 */
function hasFrameConnTurnStateProcessedMovementId(
  state,
  movementId
) {
  if (
    !movementId
  ) {
    return false;
  }


  return (
    state.movement
      .processedMovementIds
      .includes(
        String(
          movementId
        )
      )
  );
}


/**
 * Remembers a processed movement event ID.
 *
 * The existing bounded history of 100 IDs is preserved.
 */
function rememberFrameConnTurnStateMovementId(
  state,
  movementId
) {
  if (
    !movementId
  ) {
    return;
  }


  const normalizedId =
    String(
      movementId
    );


  if (
    !state.movement
      .processedMovementIds
      .includes(
        normalizedId
      )
  ) {
    state.movement
      .processedMovementIds
      .push(
        normalizedId
      );
  }


  if (
    state.movement
      .processedMovementIds
      .length > 100
  ) {
    state.movement
      .processedMovementIds
      .splice(
        0,
        state.movement
          .processedMovementIds
          .length - 100
      );
  }
}


/* ============================================================
   Movement state -- Automatic Boost
   ============================================================ */

/**
 * Attempts to acquire another movement allowance by committing
 * Boost against the Turn action budget.
 *
 * Normal Boost is attempted first unless forceOvercharge is true.
 *
 * If necessary, Overcharge is activated and its granted Quick
 * Action is immediately spent on Boost.
 */
function ensureFrameConnTurnStateAutomaticMovementBoost(
  state,
  {
    forceOvercharge = false
  } = {}
) {
  state.assertTurnActive();


  if (
    forceOvercharge &&
    state.restrictions?.brace
  ) {
    return {
      committed:
        false,

      reason:
        "Brace prevents Overcharge until the end of this turn."
    };
  }


  const frameConnActionRegistry =
    getFrameConnTurnActionRegistry();


  const boostAction =
    frameConnActionRegistry.get(
      "quick.boost"
    );


  if (
    !boostAction
  ) {
    return {
      committed:
        false,

      reason:
        "Boost is not registered."
    };
  }


  /* ----------------------------------------------------------
     Attempt normal Boost
     ---------------------------------------------------------- */

  if (
    !forceOvercharge
  ) {
    const normalPermission =
      state.canUseAction(
        boostAction
      );


    if (
      normalPermission.allowed
    ) {
      state.useAction(
        boostAction,
        {
          metadata: {
            automatic:
              true,

            reason:
              "token-movement"
          }
        }
      );


      state.recordHistory(
        "automatic-movement-boost",
        {
          source:
            "normal"
        }
      );


      return {
        committed:
          true,

        source:
          "normal",

        heatFormula:
          null
      };
    }
  }


  /* ----------------------------------------------------------
     Attempt Overcharge Boost
     ---------------------------------------------------------- */

  let heatFormula =
    null;


  let triggeredOvercharge =
    false;


  if (
    !state.overcharge.used
  ) {
    heatFormula =
      state.useOvercharge();


    triggeredOvercharge =
      true;
  }


  const overchargePermission =
    state.canUseAction(
      boostAction,
      {
        useOvercharge:
          true
      }
    );


  if (
    !overchargePermission.allowed
  ) {
    return {
      committed:
        false,

      triggeredOvercharge,

      heatFormula,

      reason:
        overchargePermission.reason
    };
  }


  state.useAction(
    boostAction,
    {
      useOvercharge:
        true,

      metadata: {
        automatic:
          true,

        reason:
          "token-movement"
      }
    }
  );


  state.recordHistory(
    "automatic-movement-boost",
    {
      source:
        "overcharge",

      heatFormula
    }
  );


  return {
    committed:
      true,

    source:
      "overcharge",

    triggeredOvercharge,

    heatFormula
  };
}


/* ============================================================
   Movement state -- Tracked movement recalculation
   ============================================================ */

/**
 * Recalculates movement-pool consumption from total token movement
 * and the number/source of committed Boost actions.
 *
 * The movement model supports:
 *
 *   Speed
 *       │
 *       ▼
 *   Standard movement allowance
 *       │
 *       ▼
 *   normal Boost allowance
 *       │
 *       ▼
 *   Overcharge Boost allowance
 *       │
 *       ▼
 *   excess movement
 */
function recalculateFrameConnTurnStateTrackedMovement(
  state
) {
  const speed =
    Number(
      state.movement.maximum
    );


  const total =
    Number(
      state.movement.totalTracked
    ) || 0;


  /* ----------------------------------------------------------
     Unrated movement fallback
     ---------------------------------------------------------- */

  if (
    !Number.isFinite(
      speed
    ) ||
    speed <= 0
  ) {
    state.movement.standardUsed =
      total;


    state.movement.boostUsed =
      0;


    state.movement
      .overchargeBoostUsed =
      0;


    state.movement.spent =
      total;


    state.movement.remaining =
      0;


    state.movement.excess =
      0;


    state.movement.completed =
      total > 0;


    return;
  }


  /* ----------------------------------------------------------
     Resolve committed Boost pools
     ---------------------------------------------------------- */

  const boostEntries =
    getFrameConnTurnStateMovementBoostEntries(
      state
    );


  const normalBoostCount =
    boostEntries.filter(
      entry => {
        return (
          entry.source !==
          "overcharge"
        );
      }
    ).length;


  const overchargeBoostCount =
    boostEntries.filter(
      entry => {
        return (
          entry.source ===
          "overcharge"
        );
      }
    ).length;


  /* ----------------------------------------------------------
     Standard movement consumption
     ---------------------------------------------------------- */

  const standardAllowance =
    state.restrictions?.brace
      ? 0
      : speed;


  const standardUsed =
    Math.min(
      total,
      standardAllowance
    );


  /* ----------------------------------------------------------
     Normal Boost consumption
     ---------------------------------------------------------- */

  const boostUsed =
    normalBoostCount > 0
      ? Math.min(
          Math.max(
            total -
              standardAllowance,
            0
          ),
          speed
        )
      : 0;


  /* ----------------------------------------------------------
     Overcharge Boost consumption
     ---------------------------------------------------------- */

  const overchargeStart =
    standardAllowance +
    speed *
      normalBoostCount;


  const overchargeBoostUsed =
    overchargeBoostCount > 0
      ? Math.min(
          Math.max(
            total -
              overchargeStart,
            0
          ),
          speed
        )
      : 0;


  /* ----------------------------------------------------------
     Legal movement ceiling
     ---------------------------------------------------------- */

  const legalMaximum =
    standardAllowance +
    speed *
      (
        normalBoostCount +
        overchargeBoostCount
      );


  const excess =
    Math.max(
      total -
        legalMaximum,
      0
    );


  /* ----------------------------------------------------------
     Current allowance consumption
     ---------------------------------------------------------- */

  let currentPoolUsed =
    standardUsed;


  if (
    normalBoostCount > 0 &&
    total > standardAllowance
  ) {
    currentPoolUsed =
      boostUsed;
  }


  if (
    overchargeBoostCount > 0 &&
    total >
      overchargeStart
  ) {
    currentPoolUsed =
      overchargeBoostUsed;
  }


  if (
    excess > 0
  ) {
    currentPoolUsed =
      speed;
  }


  /* ----------------------------------------------------------
     Commit recalculated movement state
     ---------------------------------------------------------- */

  state.movement.standardUsed =
    standardUsed;


  state.movement.boostUsed =
    boostUsed;


  state.movement
    .overchargeBoostUsed =
    overchargeBoostUsed;


  state.movement.excess =
    excess;


  state.movement.spent =
    currentPoolUsed;


  state.movement.remaining =
    excess > 0
      ? 0
      : Math.max(
          speed -
            currentPoolUsed,
          0
        );


  state.movement.completed =
    state.movement.remaining <=
    0;
}


/* ============================================================
   Movement state -- Token movement tracking
   ============================================================ */

/**
 * Records an interpreted token-movement segment against the
 * current Turn state.
 *
 * Foundry movement interpretation itself remains outside this
 * module.
 *
 * This function receives an already-resolved distance plus
 * optional movement metadata.
 */
function trackFrameConnTurnStateTokenMovement(
  state,
  distance,
  {
    movementId = null,
    method = null,
    origin = null,
    destination = null
  } = {}
) {
  state.assertTurnActive();


  const numericDistance =
    Number(
      distance
    );


  /* ----------------------------------------------------------
     Ignore empty movement
     ---------------------------------------------------------- */

  if (
    !Number.isFinite(
      numericDistance
    ) ||
    numericDistance <= 0
  ) {
    return {
      tracked:
        false,

      distance:
        0,

      reason:
        "Movement distance was zero."
    };
  }


  /* ----------------------------------------------------------
     Ignore duplicate Foundry movement events
     ---------------------------------------------------------- */

  if (
    hasFrameConnTurnStateProcessedMovementId(
      state,
      movementId
    )
  ) {
    return {
      tracked:
        false,

      distance:
        0,

      reason:
        "Movement was already recorded."
    };
  }


  /* ----------------------------------------------------------
     Validate Speed
     ---------------------------------------------------------- */

  const speed =
    Number(
      state.movement.maximum
    );


  if (
    !Number.isFinite(
      speed
    ) ||
    speed <= 0
  ) {
    throw new Error(
      "Frame Conn cannot track movement until the unit has a positive Speed."
    );
  }


  /* ----------------------------------------------------------
     Determine resulting total
     ---------------------------------------------------------- */

  const previousTotal =
    state.movement.totalTracked;


  const newTotal =
    previousTotal +
    numericDistance;


  const previousBoostCount =
    getFrameConnTurnStateMovementBoostCount(
      state
    );


  const standardAllowance =
    state.restrictions?.brace
      ? 0
      : speed;


  const automaticActions =
    [];


  /* ----------------------------------------------------------
     Observe movement without policing it
     ---------------------------------------------------------- */

  // Physical token movement is observational only. Crossing Speed
  // thresholds does not commit Boost, spend actions, or trigger
  // Overcharge. Manual Boost remains authoritative for action use.


  /* ----------------------------------------------------------
     Store tracked movement
     ---------------------------------------------------------- */

  state.movement.totalTracked =
    newTotal;


  state.movement.segments.push({
    distance:
      numericDistance,

    movementId:
      movementId
        ? String(
            movementId
          )
        : null,

    method:
      method
        ? String(
            method
          )
        : null,

    origin:
      origin
        ? {
            ...origin
          }
        : null,

    destination:
      destination
        ? {
            ...destination
          }
        : null,

    timestamp:
      Date.now()
  });


  rememberFrameConnTurnStateMovementId(
    state,
    movementId
  );


  state.closeProtocolWindow();


  recalculateFrameConnTurnStateTrackedMovement(
    state
  );


  /* ----------------------------------------------------------
     History
     ---------------------------------------------------------- */

  state.recordHistory(
    "token-movement",
    {
      distance:
        numericDistance,

      totalDistance:
        newTotal,

      movementId,

      method,

      automaticActions,

      previousBoostCount,

      boostCount:
        getFrameConnTurnStateMovementBoostCount(
          state
        ),

      excess:
        state.movement.excess
    }
  );


  /* ----------------------------------------------------------
     Result
     ---------------------------------------------------------- */

  return {
    tracked:
      true,

    distance:
      numericDistance,

    totalDistance:
      newTotal,

    remaining:
      state.movement.remaining,

    standardUsed:
      state.movement.standardUsed,

    boostUsed:
      state.movement.boostUsed,

    overchargeBoostUsed:
      state.movement
        .overchargeBoostUsed,

    excess:
      state.movement.excess,

    automaticActions
  };
}


/* ============================================================
   Public exports
   ============================================================ */

export {
  setFrameConnTurnStateSpeed,

  spendFrameConnTurnStateMovement,

  completeFrameConnTurnStateMovement,

  reopenFrameConnTurnStateMovement,

  commitFrameConnTurnStateMovement,

  refreshFrameConnTurnStateMovementFromBoost,

  getFrameConnTurnStateMovementBoostEntries,

  getFrameConnTurnStateMovementBoostCount,

  hasFrameConnTurnStateProcessedMovementId,

  rememberFrameConnTurnStateMovementId,

  ensureFrameConnTurnStateAutomaticMovementBoost,

  recalculateFrameConnTurnStateTrackedMovement,

  trackFrameConnTurnStateTokenMovement
};
