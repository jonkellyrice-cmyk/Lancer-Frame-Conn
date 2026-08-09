/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/turn-feature.js
 */

/**
 * ============================================================
 * FRAME HELM FEATURE -- TURN
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's per-turn state model, action-budget state,
 *   protocol/reaction state, committed-action state, turn
 *   lifecycle, and synchronization with Foundry combat turns.
 *
 * PURPOSE:
 *   Remove turn-state ownership and combat-turn synchronization
 *   from runtime-orchestrator.js while preserving the existing
 *   Frame Helm turn behavior exactly.
 *
 * RESPONSIBILITIES:
 *   - Own FrameHelmTurnState.
 *   - Own FrameHelmTurnStateManager.
 *   - Own the canonical current turn-state manager.
 *   - Begin, ensure, end, and clear Frame Helm turns.
 *   - Track normal quick/full action availability.
 *   - Track Overcharge availability and granted quick actions.
 *   - Track Protocol availability.
 *   - Track Reaction availability.
 *   - Track committed actions and execution state.
 *   - Track duplicate-action keys.
 *   - Own turn history and turn snapshots.
 *   - Resolve active Foundry combat-turn context.
 *   - Synchronize Frame Helm turn state with Foundry combat.
 *   - Declare combat synchronization hooks.
 *
 * TRANSITIONAL RESPONSIBILITIES:
 *
 *   The existing FrameHelmTurnState currently contains movement
 *   budget/accounting behavior.
 *
 *   That behavior remains here temporarily so this extraction
 *   preserves the existing state model without simultaneously
 *   introducing a second ownership migration.
 *
 *   The following methods are expected to move into the future
 *   Movement feature:
 *
 *     - setSpeed
 *     - spendMovement
 *     - completeMovement
 *     - reopenMovement
 *     - commitMovement
 *     - refreshMovementFromBoost
 *     - movementBoostEntries
 *     - movementBoostCount
 *     - hasProcessedMovementId
 *     - rememberMovementId
 *     - ensureAutomaticMovementBoost
 *     - recalculateTrackedMovement
 *     - trackTokenMovement
 *
 * DOES NOT OWN:
 *   - Action registry implementation.
 *   - Universal action declarations.
 *   - Action execution against Lancer actor workflows.
 *   - Token-path measurement.
 *   - Foundry moveToken interpretation.
 *   - Elevation-change interpretation.
 *   - Application rendering implementation.
 *   - Sensor calculations.
 *   - Sensor rendering.
 *   - Actor telemetry synchronization.
 *   - Module settings.
 *   - Scene-control registration.
 *   - Public game.lancerFrameHelm composition.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   actions-feature.js
 *        │
 *        │ actions.registry
 *        ▼
 *   turn-feature.js
 *        │
 *        ├── turn state
 *        ├── action-budget state
 *        ├── protocol/reaction state
 *        ├── committed-plan state
 *        ├── combat synchronization
 *        └── transitional movement state
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 * UI RELATIONSHIP:
 *
 *   Turn-specific executable presentation may later live in:
 *
 *     styles/ui-turn.js
 *
 *   Turn-specific presentation styling may later live in:
 *
 *     styles/ui-turn.css
 *
 *   This feature does not render UI directly.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - turn.state
 *     - turn.lifecycle
 *     - turn.actions
 *     - turn.protocol
 *     - turn.reaction
 *     - turn.committed-actions
 *     - turn.combat-sync
 *
 *   Required dependencies:
 *     - actions.registry
 *
 *   Optional dependencies:
 *     - ui.application.rendering
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership and composition only.
 *
 *   Existing turn-state behavior, action legality, movement state,
 *   history, snapshots, and combat synchronization are preserved.
 */


import {
  defineFrameHelmFeature
} from "./feature-contract.js";


/* ============================================================
   Turn feature identity
   ============================================================ */

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ============================================================
   Turn runtime bindings
   ============================================================ */

/**
 * Narrow transitional dependency bridge.
 *
 * Turn logic requires access to the canonical Actions registry and
 * may request an application re-render after state mutation.
 *
 * Neither implementation belongs to the Turn feature.
 */
const frameHelmTurnRuntimeBindings = {
  getActionRegistry:
    null,

  renderApplication:
    null
};


/**
 * Configures Turn dependencies which currently cannot be resolved
 * through lifecycle injection because Frame Helm startup still
 * preserves its existing synchronous orchestration model.
 */
function configureFrameHelmTurnRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm turn runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmTurnRuntimeBindings
      )
    );


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
        `Frame Helm Turn received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Turn runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmTurnRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmTurnRuntimeBindings()
  );
}


/**
 * Returns binding availability without exposing the bound
 * functions themselves.
 */
function getFrameHelmTurnRuntimeBindings() {
  return Object.freeze({
    actionRegistry:
      typeof frameHelmTurnRuntimeBindings
        .getActionRegistry ===
        "function",

    applicationRendering:
      typeof frameHelmTurnRuntimeBindings
        .renderApplication ===
        "function"
  });
}


/* ============================================================
   Turn dependency accessors
   ============================================================ */

/**
 * Returns the canonical Actions registry supplied by runtime
 * composition.
 */
function getFrameHelmTurnActionRegistry() {
  const registry =
    frameHelmTurnRuntimeBindings
      .getActionRegistry?.();


  if (
    !registry
  ) {
    throw new Error(
      "Frame Helm Turn could not resolve the Actions registry."
    );
  }


  return registry;
}


/**
 * Requests a re-render from the Application UI feature if its
 * rendering surface has been configured.
 *
 * Turn state does not own rendering.
 */
function renderFrameHelmTurnApplication() {
  return (
    frameHelmTurnRuntimeBindings
      .renderApplication?.(
        false
      ) ??
    null
  );
}


/* ============================================================
   Turn state
   ============================================================ */

export class FrameHelmTurnState {
  constructor(
    context = {}
  ) {
    this.reset(
      context
    );
  }


  reset(
    context = {}
  ) {
    this.context = {
      combatId:
        context.combatId ??
        null,

      combatantId:
        context.combatantId ??
        null,

      tokenId:
        context.tokenId ??
        null,

      actorId:
        context.actorId ??
        null,

      sceneId:
        context.sceneId ??
        null,

      round:
        Number.isFinite(
          context.round
        )
          ? context.round
          : null,

      turn:
        Number.isFinite(
          context.turn
        )
          ? context.turn
          : null
    };


    const hasSpeedValue =
      context.speed !== null &&
      context.speed !== undefined &&
      context.speed !== "";


    const speed =
      hasSpeedValue
        ? Number(
            context.speed
          )
        : null;


    this.speed =
      speed !== null &&
      Number.isFinite(
        speed
      ) &&
      speed >= 0
        ? speed
        : null;


    this.movement = {
      maximum:
        this.speed,

      spent:
        0,

      remaining:
        this.speed,

      completed:
        false,

      totalTracked:
        0,

      standardUsed:
        0,

      boostUsed:
        0,

      overchargeBoostUsed:
        0,

      excess:
        0,

      segments:
        [],

      processedMovementIds:
        []
    };


    this.actionMode =
      null;


    this.quickActionsRemaining =
      2;


    this.fullActionAvailable =
      true;


    this.overcharge = {
      used:
        false,

      quickActionRemaining:
        0,

      heatFormula:
        null
    };


    this.protocol = {
      available:
        true,

      used:
        false,

      startOfTurnOpen:
        true
    };


    this.reaction = {
      usedThisTurn:
        false,

      actionId:
        null
    };


    this.usedActions =
      [];


    this.usedDuplicateKeys =
      [];


    this.history =
      [];


    this.ended =
      false;


    this.startedAt =
      Date.now();


    this.endedAt =
      null;


    return this;
  }


  /* ==========================================================
     Turn state -- Speed
     ========================================================== */

  setSpeed(
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
        "Frame Helm speed must be a non-negative number."
      );
    }


    const previousMaximum =
      this.movement.maximum;


    const previousSpent =
      this.movement.spent;


    this.speed =
      numericSpeed;


    this.movement.maximum =
      numericSpeed;


    this.movement.spent =
      Math.min(
        previousSpent,
        numericSpeed
      );


    this.movement.remaining =
      Math.max(
        0,
        numericSpeed -
          this.movement.spent
      );


    if (
      previousMaximum ===
      null
    ) {
      this.recordHistory(
        "set-speed",
        {
          speed:
            numericSpeed
        }
      );
    }


    return (
      this.movement.remaining
    );
  }


  /* ==========================================================
     Turn state -- Movement
     ========================================================== */

  /**
   * TRANSITIONAL:
   *
   * Movement accounting remains part of the Turn state model until
   * movement-feature.js is extracted.
   */

  spendMovement(
    distance
  ) {
    this.assertTurnActive();


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
      this.movement.maximum ===
      null
    ) {
      throw new Error(
        "Movement speed has not been assigned to this turn."
      );
    }


    if (
      numericDistance >
      this.movement.remaining
    ) {
      throw new Error(
        `Only ${this.movement.remaining} movement remains.`
      );
    }


    this.movement.spent +=
      numericDistance;


    this.movement.remaining -=
      numericDistance;


    if (
      this.movement.remaining ===
      0
    ) {
      this.movement.completed =
        true;
    }


    this.closeProtocolWindow();


    this.recordHistory(
      "spend-movement",
      {
        distance:
          numericDistance
      }
    );


    return (
      this.movement.remaining
    );
  }


  completeMovement() {
    this.assertTurnActive();


    this.movement.completed =
      true;


    this.recordHistory(
      "complete-movement",
      {
        remaining:
          this.movement.remaining
      }
    );
  }


  reopenMovement() {
    this.assertTurnActive();


    if (
      this.movement.maximum !==
        null &&
      this.movement.remaining <=
        0
    ) {
      this.movement.spent =
        0;


      this.movement.remaining =
        this.movement.maximum;
    }


    this.movement.completed =
      false;


    this.recordHistory(
      "reopen-movement",
      {
        remaining:
          this.movement.remaining
      }
    );
  }


  commitMovement(
    actionId
  ) {
    this.assertTurnActive();


    if (
      this.movement.maximum ===
      null
    ) {
      throw new Error(
        "Movement speed has not been assigned to this turn."
      );
    }


    if (
      this.movement.completed
    ) {
      throw new Error(
        "Movement has already been committed."
      );
    }


    if (
      this.movement.remaining <=
        0
    ) {
      throw new Error(
        "No movement remains to commit."
      );
    }


    const committedDistance =
      this.movement.remaining;


    this.movement.spent +=
      committedDistance;


    this.movement.remaining =
      0;


    this.movement.completed =
      true;


    this.closeProtocolWindow();


    this.recordHistory(
      "movement-commit",
      {
        actionId,

        distance:
          committedDistance
      }
    );


    return committedDistance;
  }


  refreshMovementFromBoost() {
    this.assertTurnActive();


    if (
      this.movement.maximum ===
      null
    ) {
      this.recordHistory(
        "boost-movement-refill",
        {
          distance:
            null
        }
      );


      return null;
    }


    this.movement.spent =
      0;


    this.movement.remaining =
      this.movement.maximum;


    this.movement.completed =
      false;


    this.recordHistory(
      "boost-movement-refill",
      {
        distance:
          this.movement.maximum
      }
    );


    return (
      this.movement.remaining
    );
  }


  movementBoostEntries() {
    return (
      this.usedActions.filter(
        entry => {
          return (
            entry.actionId ===
            "quick.boost"
          );
        }
      )
    );
  }


  movementBoostCount() {
    return (
      this.movementBoostEntries()
        .length
    );
  }


  hasProcessedMovementId(
    movementId
  ) {
    if (
      !movementId
    ) {
      return false;
    }


    return (
      this.movement
        .processedMovementIds
        .includes(
          String(
            movementId
          )
        )
    );
  }


  rememberMovementId(
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
      !this.movement
        .processedMovementIds
        .includes(
          normalizedId
        )
    ) {
      this.movement
        .processedMovementIds
        .push(
          normalizedId
        );
    }


    if (
      this.movement
        .processedMovementIds
        .length > 100
    ) {
      this.movement
        .processedMovementIds
        .splice(
          0,
          this.movement
            .processedMovementIds
            .length - 100
        );
    }
  }


  ensureAutomaticMovementBoost({
    forceOvercharge = false
  } = {}) {
    this.assertTurnActive();


    const frameHelmActionRegistry =
      getFrameHelmTurnActionRegistry();


    const boostAction =
      frameHelmActionRegistry.get(
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


    if (
      !forceOvercharge
    ) {
      const normalPermission =
        this.canUseAction(
          boostAction
        );


      if (
        normalPermission.allowed
      ) {
        this.useAction(
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


        this.recordHistory(
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


    let heatFormula =
      null;


    let triggeredOvercharge =
      false;


    if (
      !this.overcharge.used
    ) {
      heatFormula =
        this.useOvercharge();


      triggeredOvercharge =
        true;
    }


    const overchargePermission =
      this.canUseAction(
        boostAction,
        {
          useOvercharge:
            true
        }
      );


    if (
      !overchargePermission
        .allowed
    ) {
      return {
        committed:
          false,

        triggeredOvercharge,
        heatFormula,

        reason:
          overchargePermission
            .reason
      };
    }


    this.useAction(
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


    this.recordHistory(
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


  recalculateTrackedMovement() {
    const speed =
      Number(
        this.movement.maximum
      );


    const total =
      Number(
        this.movement.totalTracked
      ) || 0;


    if (
      !Number.isFinite(
        speed
      ) ||
      speed <= 0
    ) {
      this.movement.standardUsed =
        total;


      this.movement.boostUsed =
        0;


      this.movement
        .overchargeBoostUsed =
        0;


      this.movement.spent =
        total;


      this.movement.remaining =
        0;


      this.movement.excess =
        0;


      this.movement.completed =
        total > 0;


      return;
    }


    const boostEntries =
      this.movementBoostEntries();


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


    const standardUsed =
      Math.min(
        total,
        speed
      );


    const boostUsed =
      normalBoostCount > 0
        ? Math.min(
            Math.max(
              total -
                speed,
              0
            ),
            speed
          )
        : 0;


    const overchargeStart =
      speed *
      (
        1 +
        normalBoostCount
      );


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


    const legalAllowanceCount =
      1 +
      normalBoostCount +
      overchargeBoostCount;


    const legalMaximum =
      speed *
      legalAllowanceCount;


    const excess =
      Math.max(
        total -
          legalMaximum,
        0
      );


    let currentPoolUsed =
      standardUsed;


    if (
      normalBoostCount > 0 &&
      total > speed
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


    this.movement.standardUsed =
      standardUsed;


    this.movement.boostUsed =
      boostUsed;


    this.movement
      .overchargeBoostUsed =
      overchargeBoostUsed;


    this.movement.excess =
      excess;


    this.movement.spent =
      currentPoolUsed;


    this.movement.remaining =
      excess > 0
        ? 0
        : Math.max(
            speed -
              currentPoolUsed,
            0
          );


    this.movement.completed =
      this.movement.remaining <=
      0;
  }


  trackTokenMovement(
    distance,
    {
      movementId = null,
      method = null,
      origin = null,
      destination = null
    } = {}
  ) {
    this.assertTurnActive();


    const numericDistance =
      Number(
        distance
      );


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


    if (
      this.hasProcessedMovementId(
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


    const speed =
      Number(
        this.movement.maximum
      );


    if (
      !Number.isFinite(
        speed
      ) ||
      speed <= 0
    ) {
      throw new Error(
        "Frame Helm cannot track movement until the unit has a positive Speed."
      );
    }


    const previousTotal =
      this.movement.totalTracked;


    const newTotal =
      previousTotal +
      numericDistance;


    const previousBoostCount =
      this.movementBoostCount();


    const automaticActions =
      [];


    if (
      newTotal > speed &&
      this.movementBoostCount() <
        1
    ) {
      const result =
        this.ensureAutomaticMovementBoost({
          forceOvercharge:
            false
        });


      automaticActions.push({
        threshold:
          speed,

        ...result
      });
    }


    if (
      newTotal >
        speed * 2 &&
      this.movementBoostCount() <
        2
    ) {
      const result =
        this.ensureAutomaticMovementBoost({
          forceOvercharge:
            true
        });


      automaticActions.push({
        threshold:
          speed * 2,

        ...result
      });
    }


    this.movement.totalTracked =
      newTotal;


    this.movement.segments.push({
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


    this.rememberMovementId(
      movementId
    );


    this.closeProtocolWindow();


    this.recalculateTrackedMovement();


    this.recordHistory(
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
          this.movementBoostCount(),

        excess:
          this.movement.excess
      }
    );


    return {
      tracked:
        true,

      distance:
        numericDistance,

      totalDistance:
        newTotal,

      remaining:
        this.movement.remaining,

      standardUsed:
        this.movement.standardUsed,

      boostUsed:
        this.movement.boostUsed,

      overchargeBoostUsed:
        this.movement
          .overchargeBoostUsed,

      excess:
        this.movement.excess,

      automaticActions
    };
  }


  /* ==========================================================
     Turn state -- Protocol
     ========================================================== */

  closeProtocolWindow() {
    if (
      !this.protocol
        .startOfTurnOpen
    ) {
      return;
    }


    this.protocol
      .startOfTurnOpen =
      false;


    if (
      !this.protocol.used
    ) {
      this.protocol.available =
        false;
    }
  }


  useProtocol(
    actionId = null
  ) {
    this.assertTurnActive();


    if (
      !this.protocol
        .startOfTurnOpen
    ) {
      throw new Error(
        "Protocols can only be activated at the start of a turn."
      );
    }


    if (
      this.protocol.used
    ) {
      throw new Error(
        "A protocol has already been used this turn."
      );
    }


    this.protocol.used =
      true;


    this.protocol.available =
      false;


    this.recordHistory(
      "use-protocol",
      {
        actionId
      }
    );
  }


  /* ==========================================================
     Turn state -- Overcharge
     ========================================================== */

  overchargeHeatFormula(
    overchargeCount = 0
  ) {
    if (
      overchargeCount <= 0
    ) {
      return "1";
    }


    if (
      overchargeCount === 1
    ) {
      return "1d3";
    }


    if (
      overchargeCount === 2
    ) {
      return "1d6";
    }


    return "1d6+4";
  }


  useOvercharge({
    previousOvercharges = 0
  } = {}) {
    this.assertTurnActive();


    if (
      this.overcharge.used
    ) {
      throw new Error(
        "This unit has already Overcharged this turn."
      );
    }


    this.overcharge.used =
      true;


    this.overcharge
      .quickActionRemaining =
      1;


    this.overcharge.heatFormula =
      this.overchargeHeatFormula(
        previousOvercharges
      );


    this.closeProtocolWindow();


    this.recordHistory(
      "overcharge",
      {
        heatFormula:
          this.overcharge
            .heatFormula,

        previousOvercharges
      }
    );


    return (
      this.overcharge
        .heatFormula
    );
  }


  /* ==========================================================
     Turn state -- Action legality
     ========================================================== */

  actionDuplicateKey(
    action
  ) {
    return String(
      action?.duplicateKey ??
      action?.id ??
      ""
    );
  }


  hasUsedDuplicateKey(
    duplicateKey
  ) {
    return (
      this.usedDuplicateKeys
        .includes(
          String(
            duplicateKey
          )
        )
    );
  }


  canUseAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false
    } = {}
  ) {
    const frameHelmActionRegistry =
      getFrameHelmTurnActionRegistry();


    const action =
      typeof actionOrId ===
      "string"
        ? frameHelmActionRegistry
            .get(
              actionOrId
            )
        : actionOrId;


    if (
      !action
    ) {
      return {
        allowed:
          false,

        reason:
          "Unknown action."
      };
    }


    if (
      this.ended
    ) {
      return {
        allowed:
          false,

        reason:
          "The turn has already ended."
      };
    }


    if (
      action.id ===
      "special.end-turn"
    ) {
      return {
        allowed:
          true,

        reason:
          null
      };
    }


    if (
      action.cost ===
      "movement"
    ) {
      if (
        this.movement.completed
      ) {
        return {
          allowed:
            false,

          reason:
            "Movement has been marked complete."
        };
      }


      if (
        this.movement.remaining ===
        0
      ) {
        return {
          allowed:
            false,

          reason:
            "No standard movement remains."
        };
      }


      return {
        allowed:
          true,

        reason:
          null
      };
    }


    if (
      action.cost ===
      "overcharge"
    ) {
      if (
        this.overcharge.used
      ) {
        return {
          allowed:
            false,

          reason:
            "Overcharge has already been used this turn."
        };
      }


      return {
        allowed:
          true,

        reason:
          null
      };
    }


    if (
      action.cost ===
      "full"
    ) {
      if (
        !this.fullActionAvailable
      ) {
        return {
          allowed:
            false,

          reason:
            "The normal action budget has already been spent."
        };
      }


      if (
        this.actionMode ===
        "quick"
      ) {
        return {
          allowed:
            false,

          reason:
            "A quick action has already been taken."
        };
      }


      return {
        allowed:
          true,

        reason:
          null
      };
    }


    if (
      action.cost ===
      "quick"
    ) {
      const duplicateKey =
        this.actionDuplicateKey(
          action
        );


      const duplicateUsed =
        this.hasUsedDuplicateKey(
          duplicateKey
        );


      if (
        useOvercharge
      ) {
        if (
          !this.overcharge.used
        ) {
          return {
            allowed:
              false,

            reason:
              "Overcharge has not been activated."
          };
        }


        if (
          this.overcharge
            .quickActionRemaining <
          1
        ) {
          return {
            allowed:
              false,

            reason:
              "The Overcharge quick action has been spent."
          };
        }


        return {
          allowed:
            true,

          reason:
            null,

          source:
            "overcharge"
        };
      }


      if (
        this.actionMode ===
        "full"
      ) {
        return {
          allowed:
            false,

          reason:
            "A full action has already been taken."
        };
      }


      if (
        this.quickActionsRemaining <
        1
      ) {
        return {
          allowed:
            false,

          reason:
            "No normal quick actions remain."
        };
      }


      if (
        duplicateUsed &&
        !ignoreDuplicate &&
        action.repeatRule !==
          "unrestricted"
      ) {
        return {
          allowed:
            false,

        reason:
          "This action has already been taken this turn. Use Overcharge to repeat it."
        };
      }


      return {
        allowed:
          true,

        reason:
          null,

        source:
          "normal"
      };
    }


    if (
      action.cost ===
      "reaction"
    ) {
      if (
        this.reaction
          .usedThisTurn
      ) {
        return {
          allowed:
            false,

          reason:
            "A reaction has already been used during this turn."
        };
      }


      return {
        allowed:
          true,

        reason:
          null
      };
    }


    return {
      allowed:
        true,

      reason:
        null
    };
  }


  /* ==========================================================
     Turn state -- Action commitment
     ========================================================== */

  useAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false,
      metadata = {}
    } = {}
  ) {
    const frameHelmActionRegistry =
      getFrameHelmTurnActionRegistry();


    const action =
      typeof actionOrId ===
      "string"
        ? frameHelmActionRegistry
            .get(
              actionOrId
            )
        : actionOrId;


    const permission =
      this.canUseAction(
        action,
        {
          useOvercharge,
          ignoreDuplicate
        }
      );


    if (
      !permission.allowed
    ) {
      throw new Error(
        permission.reason
      );
    }


    if (
      action.id ===
      "special.end-turn"
    ) {
      this.endTurn();


      return (
        this.snapshot()
      );
    }


    if (
      action.cost ===
      "overcharge"
    ) {
      this.useOvercharge(
        metadata
      );


      return (
        this.snapshot()
      );
    }


    if (
      action.cost ===
      "quick"
    ) {
      if (
        useOvercharge
      ) {
        this.overcharge
          .quickActionRemaining -=
          1;
      } else {
        this.actionMode =
          "quick";


        this.quickActionsRemaining -=
          1;


        this.fullActionAvailable =
          false;
      }
    }


    if (
      action.cost ===
      "full"
    ) {
      this.actionMode =
        "full";


      this.fullActionAvailable =
        false;


      this.quickActionsRemaining =
        0;
    }


    if (
      action.cost ===
      "reaction"
    ) {
      this.reaction.usedThisTurn =
        true;


      this.reaction.actionId =
        action.id;
    }


    if (
      action.cost !==
      "none"
    ) {
      this.closeProtocolWindow();
    }


    const duplicateKey =
      this.actionDuplicateKey(
        action
      );


    this.usedActions.push({
      id:
        foundry.utils.randomID(),

      actionId:
        action.id,

      duplicateKey,

      source:
        useOvercharge
          ? "overcharge"
          : "normal",

      timestamp:
        Date.now(),

      executed:
        false,

      executedAt:
        null,

      executionMetadata:
        {},

      metadata: {
        ...metadata
      }
    });


    if (
      duplicateKey &&
      !this.usedDuplicateKeys
        .includes(
          duplicateKey
        )
    ) {
      this.usedDuplicateKeys.push(
        duplicateKey
      );
    }


    this.recordHistory(
      "use-action",
      {
        actionId:
          action.id,

        duplicateKey,

        source:
          useOvercharge
            ? "overcharge"
            : "normal"
      }
    );


    return (
      this.snapshot()
    );
  }


  markCommittedActionExecuted(
    entryId,
    executionMetadata = {}
  ) {
    const entry =
      this.usedActions.find(
        candidate => {
          return (
            candidate.id ===
            entryId
          );
        }
      );


    if (
      !entry
    ) {
      throw new Error(
        "The committed action could not be found."
      );
    }


    entry.executed =
      true;


    entry.executedAt =
      Date.now();


    entry.executionMetadata = {
      ...entry.executionMetadata,
      ...executionMetadata
    };


    this.recordHistory(
      "execute-action",
      {
        entryId,

        actionId:
          entry.actionId,

        executionMetadata: {
          ...executionMetadata
        }
      }
    );


    return entry;
  }


  /* ==========================================================
     Turn state -- Reaction
     ========================================================== */

  markReactionAvailable() {
    this.reaction.usedThisTurn =
      false;


    this.reaction.actionId =
      null;
  }


  /* ==========================================================
     Turn state -- Lifecycle
     ========================================================== */

  endTurn() {
    if (
      this.ended
    ) {
      return;
    }


    this.ended =
      true;


    this.endedAt =
      Date.now();


    this.protocol.available =
      false;


    this.protocol
      .startOfTurnOpen =
      false;


    this.recordHistory(
      "end-turn",
      {}
    );
  }


  assertTurnActive() {
    if (
      this.ended
    ) {
      throw new Error(
        "The current Frame Helm turn has ended."
      );
    }
  }


  /* ==========================================================
     Turn state -- History
     ========================================================== */

  recordHistory(
    type,
    data = {}
  ) {
    this.history.push({
      type,

      timestamp:
        Date.now(),

      data: {
        ...data
      }
    });
  }


  /* ==========================================================
     Turn state -- Snapshot
     ========================================================== */

  snapshot() {
    return {
      context: {
        ...this.context
      },

      speed:
        this.speed,

      movement: {
        ...this.movement
      },

      actionMode:
        this.actionMode,

      quickActionsRemaining:
        this.quickActionsRemaining,

      fullActionAvailable:
        this.fullActionAvailable,

      overcharge: {
        ...this.overcharge
      },

      protocol: {
        ...this.protocol
      },

      reaction: {
        ...this.reaction
      },

      usedActions:
        this.usedActions.map(
          entry => ({
            ...entry,

            metadata: {
              ...entry.metadata
            },

            executionMetadata: {
              ...entry.executionMetadata
            }
          })
        ),

      usedDuplicateKeys: [
        ...this.usedDuplicateKeys
      ],

      history:
        this.history.map(
          entry => ({
            ...entry,

            data: {
              ...entry.data
            }
          })
        ),

      ended:
        this.ended,

      startedAt:
        this.startedAt,

      endedAt:
        this.endedAt
    };
  }
}


/* ============================================================
   Turn state manager
   ============================================================ */

export class FrameHelmTurnStateManager {
  constructor() {
    this.current =
      null;
  }


  /* ==========================================================
     Turn manager -- Begin
     ========================================================== */

  beginTurn(
    context = {}
  ) {
    this.current =
      new FrameHelmTurnState(
        context
      );


    console.log(
      `${MODULE_TITLE} | Began turn state.`,
      this.current.snapshot()
    );


    this.renderApplication();


    return (
      this.current
    );
  }


  /* ==========================================================
     Turn manager -- Ensure
     ========================================================== */

  ensureTurn(
    context = {}
  ) {
    if (
      !this.current ||
      this.current.ended
    ) {
      return (
        this.beginTurn(
          context
        )
      );
    }


    return (
      this.current
    );
  }


  /* ==========================================================
     Turn manager -- End
     ========================================================== */

  endTurn() {
    if (
      !this.current
    ) {
      return null;
    }


    this.current.endTurn();


    this.renderApplication();


    return (
      this.current.snapshot()
    );
  }


  /* ==========================================================
     Turn manager -- Clear
     ========================================================== */

  clear() {
    this.current =
      null;


    this.renderApplication();
  }


  /* ==========================================================
     Turn manager -- Snapshot
     ========================================================== */

  snapshot() {
    return (
      this.current
        ?.snapshot() ??
      null
    );
  }


  /* ==========================================================
     Turn manager -- Rendering notification
     ========================================================== */

  /**
   * Turn state does not render UI.
   *
   * It merely informs the configured application presentation
   * surface that turn-visible state has changed.
   */
  renderApplication() {
    return (
      renderFrameHelmTurnApplication()
    );
  }
}


/* ============================================================
   Canonical turn-state manager
   ============================================================ */

/**
 * Single canonical Frame Helm turn-state manager.
 */
export const frameHelmTurnState =
  new FrameHelmTurnStateManager();


/* ============================================================
   Combat turn context
   ============================================================ */

/**
 * Produces the canonical Frame Helm context for the currently
 * active Foundry combat turn.
 */
function activeCombatTurnContext(
  combat = game.combat
) {
  const combatant =
    combat?.combatant ??
    null;


  const tokenDocument =
    combatant?.token ??
    null;


  const actor =
    combatant?.actor ??
    null;


  const numericSpeed =
    Number(
      actor?.system?.speed
    );


  return {
    combatId:
      combat?.id ??
      null,

    combatantId:
      combatant?.id ??
      null,

    tokenId:
      tokenDocument?.id ??
      null,

    actorId:
      actor?.id ??
      null,

    sceneId:
      combat?.scene?.id ??
      canvas?.scene?.id ??
      null,

    round:
      Number.isFinite(
        combat?.round
      )
        ? combat.round
        : null,

    turn:
      Number.isFinite(
        combat?.turn
      )
        ? combat.turn
        : null,

    speed:
      Number.isFinite(
        numericSpeed
      ) &&
      numericSpeed >= 0
        ? numericSpeed
        : null
  };
}


/* ============================================================
   Combat turn synchronization
   ============================================================ */

/**
 * Synchronizes canonical Frame Helm state with a Foundry combat.
 *
 * A new state is created only when combat identity, active
 * combatant, round, or turn changes.
 */
function syncTurnStateToCombat(
  combat = game.combat
) {
  if (
    !combat?.started ||
    !combat.combatant
  ) {
    frameHelmTurnState.clear();


    return null;
  }


  const context =
    activeCombatTurnContext(
      combat
    );


  const currentContext =
    frameHelmTurnState
      .current
      ?.context;


  const isSameTurn =
    Boolean(
      currentContext &&
      currentContext.combatId ===
        context.combatId &&
      currentContext.combatantId ===
        context.combatantId &&
      currentContext.round ===
        context.round &&
      currentContext.turn ===
        context.turn
    );


  if (
    isSameTurn
  ) {
    return (
      frameHelmTurnState.current
    );
  }


  return (
    frameHelmTurnState.beginTurn(
      context
    )
  );
}


/* ============================================================
   Turn mutation commands
   ============================================================ */

/**
 * Public command wrappers centralize the render-after-mutation
 * behavior currently expected by consumers.
 */

function beginFrameHelmTurn(
  context = {}
) {
  return (
    frameHelmTurnState.beginTurn(
      context
    )
  );
}


function ensureFrameHelmTurn(
  context = {}
) {
  return (
    frameHelmTurnState.ensureTurn(
      context
    )
  );
}


function endFrameHelmTurn() {
  return (
    frameHelmTurnState.endTurn()
  );
}


function clearFrameHelmTurn() {
  return (
    frameHelmTurnState.clear()
  );
}


function canUseFrameHelmTurnAction(
  actionId,
  options
) {
  return (
    frameHelmTurnState
      .ensureTurn()
      .canUseAction(
        actionId,
        options
      )
  );
}


function useFrameHelmTurnAction(
  actionId,
  options
) {
  const result =
    frameHelmTurnState
      .ensureTurn()
      .useAction(
        actionId,
        options
      );


  frameHelmTurnState
    .renderApplication();


  return result;
}


function spendFrameHelmTurnMovement(
  distance
) {
  const result =
    frameHelmTurnState
      .ensureTurn()
      .spendMovement(
        distance
      );


  frameHelmTurnState
    .renderApplication();


  return result;
}


function setFrameHelmTurnSpeed(
  speed
) {
  const result =
    frameHelmTurnState
      .ensureTurn()
      .setSpeed(
        speed
      );


  frameHelmTurnState
    .renderApplication();


  return result;
}


function useFrameHelmTurnOvercharge(
  options
) {
  const result =
    frameHelmTurnState
      .ensureTurn()
      .useOvercharge(
        options
      );


  frameHelmTurnState
    .renderApplication();


  return result;
}


/* ============================================================
   Turn feature hooks
   ============================================================ */

function handleFrameHelmCombatStart(
  combat
) {
  return (
    syncTurnStateToCombat(
      combat
    )
  );
}


function handleFrameHelmCombatUpdate(
  combat,
  changes
) {
  const turnChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "turn"
      );


  const roundChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "round"
      );


  const activeChanged =
    Object.prototype
      .hasOwnProperty.call(
        changes,
        "active"
      );


  if (
    !turnChanged &&
    !roundChanged &&
    !activeChanged
  ) {
    return null;
  }


  return (
    syncTurnStateToCombat(
      combat
    )
  );
}


function handleFrameHelmCombatDelete(
  combat
) {
  if (
    frameHelmTurnState
      .current
      ?.context
      ?.combatId !==
    combat.id
  ) {
    return null;
  }


  return (
    frameHelmTurnState.clear()
  );
}


/* ============================================================
   Turn feature definition
   ============================================================ */

/**
 * Canonical Turn feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * scripts/feature-registry.js remains the canonical feature
 * composition boundary.
 */
export const frameHelmTurnFeature =
  defineFrameHelmFeature({
    id:
      "turn",

    domain:
      "turn",

    provides: [
      "turn.state",
      "turn.lifecycle",
      "turn.actions",
      "turn.protocol",
      "turn.reaction",
      "turn.committed-actions",
      "turn.combat-sync"
    ],

    dependsOn: [
      "actions.registry"
    ],

    optionalDependsOn: [
      "ui.application.rendering"
    ],

    state: {
      manager:
        frameHelmTurnState
    },

    commands: {
      configureRuntime:
        configureFrameHelmTurnRuntime,

      begin:
        beginFrameHelmTurn,

      ensure:
        ensureFrameHelmTurn,

      end:
        endFrameHelmTurn,

      clear:
        clearFrameHelmTurn,

      sync:
        syncTurnStateToCombat,

      canUseAction:
        canUseFrameHelmTurnAction,

      useAction:
        useFrameHelmTurnAction,

      spendMovement:
        spendFrameHelmTurnMovement,

      setSpeed:
        setFrameHelmTurnSpeed,

      overcharge:
        useFrameHelmTurnOvercharge
    },

    queries: {
      current:
        () =>
          frameHelmTurnState
            .current,

      snapshot:
        () =>
          frameHelmTurnState
            .snapshot(),

      context:
        combat =>
          activeCombatTurnContext(
            combat
          ),

      runtimeBindings:
        getFrameHelmTurnRuntimeBindings
    },

    hooks: {
      combatStart:
        handleFrameHelmCombatStart,

      updateCombat:
        handleFrameHelmCombatUpdate,

      deleteCombat:
        handleFrameHelmCombatDelete
    },

    lifecycle: {},

    api: {
      manager:
        frameHelmTurnState,

      configureRuntime:
        configureFrameHelmTurnRuntime,

      begin:
        beginFrameHelmTurn,

      ensure:
        ensureFrameHelmTurn,

      end:
        endFrameHelmTurn,

      clear:
        clearFrameHelmTurn,

      sync:
        syncTurnStateToCombat,

      get current() {
        return (
          frameHelmTurnState
            .current
        );
      },

      get state() {
        return (
          frameHelmTurnState
            .snapshot()
        );
      },

      canUse:
        canUseFrameHelmTurnAction,

      use:
        useFrameHelmTurnAction,

      move:
        spendFrameHelmTurnMovement,

      setSpeed:
        setFrameHelmTurnSpeed,

      overcharge:
        useFrameHelmTurnOvercharge,

      activeCombatContext:
        activeCombatTurnContext,

      runtimeBindings:
        getFrameHelmTurnRuntimeBindings
    },

    metadata: {
      label:
        "Turn State",

      description:
        "Owns Frame Helm per-turn state, action budgets, protocol/reaction state, committed actions, and Foundry combat-turn synchronization.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      companionUiModule:
        "styles/ui-turn.js",

      companionStylesheet:
        "styles/ui-turn.css",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "turn-domain-with-transitional-movement-state",

      futureExtractionTargets: [
        "movement-feature.js"
      ]
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

/**
 * Named exports preserve a low-risk migration path while
 * runtime-orchestrator.js is converted to registry access.
 *
 * New cross-feature consumers should preferably resolve Turn
 * through frameHelmFeatureRegistry.
 */
export {
  configureFrameHelmTurnRuntime,

  getFrameHelmTurnRuntimeBindings,

  getFrameHelmTurnActionRegistry,

  renderFrameHelmTurnApplication,

  activeCombatTurnContext,

  syncTurnStateToCombat,

  beginFrameHelmTurn,

  ensureFrameHelmTurn,

  endFrameHelmTurn,

  clearFrameHelmTurn,

  canUseFrameHelmTurnAction,

  useFrameHelmTurnAction,

  spendFrameHelmTurnMovement,

  setFrameHelmTurnSpeed,

  useFrameHelmTurnOvercharge
};