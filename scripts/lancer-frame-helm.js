/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/lancer-frame-helm.js
 */

/**
 * ============================================================
 * FRAME HELM RUNTIME / ORCHESTRATION SURFACE
 * ============================================================
 *
 * ROLE:
 *   Provides the authoritative Frame Helm Foundry runtime and
 *   application-orchestration surface.
 *
 * PURPOSE:
 *   Compose registered Frame Helm feature domains with the
 *   remaining application, turn, movement, execution, telemetry,
 *   and Foundry integration behavior that has not yet been
 *   extracted into independent features.
 *
 * CURRENT EXTRACTED DOMAINS:
 *
 *   - actions
 *   - sensors
 *
 * FEATURE COMPOSITION:
 *
 *   feature-contract.js
 *        ↓
 *   feature-registry.js
 *        ├── actions-feature.js
 *        ├── sensors-feature.js
 *        └── future feature domains
 *        ↓
 *   lancer-frame-helm.js
 *
 * IMPORTANT:
 *
 *   This file no longer owns:
 *
 *   - action registry implementation
 *   - universal action category declarations
 *   - universal action declarations
 *   - action-catalog initialization
 *   - sensor-contact rendering
 *   - sensor-contact PIXI lifecycle
 *   - sensor-distance measurement
 *   - sensor-specific Foundry hooks
 *
 *   Those responsibilities are consumed through the canonical
 *   feature registry.
 */


import {
  frameHelmFeatureRegistry
} from "./feature-registry.js";


const MODULE_ID =
  "lancer-frame-helm";

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ==========================================================
   Extracted Actions feature surface
   ========================================================== */

/**
 * Resolve the Actions domain exclusively through the canonical
 * feature registry.
 *
 * lancer-frame-helm.js intentionally does NOT import
 * actions-feature.js directly.
 *
 * This preserves feature-registry.js as the composition boundary.
 */
const frameHelmActionsApi =
  frameHelmFeatureRegistry.getApi(
    "actions"
  );

if (!frameHelmActionsApi) {
  throw new Error(
    "Frame Helm | The registered Actions feature API could not be resolved."
  );
}


/**
 * Preserve the established local registry identifier so remaining
 * runtime consumers do not need to know that ownership has moved.
 */
const frameHelmActionRegistry =
  frameHelmActionsApi.registry;


/**
 * Preserve synchronous initialization during Foundry init.
 *
 * The Actions feature owns the implementation; this runtime owns
 * the startup boundary at which initialization occurs.
 */
const initializeFrameHelmActionRegistry =
  frameHelmActionsApi.initialize;


/* ==========================================================
   Turn state
   ========================================================== */

class FrameHelmTurnState {
  constructor(context = {}) {
    this.reset(context);
  }

  reset(context = {}) {
    this.context = {
      combatId:
        context.combatId ?? null,

      combatantId:
        context.combatantId ?? null,

      tokenId:
        context.tokenId ?? null,

      actorId:
        context.actorId ?? null,

      sceneId:
        context.sceneId ?? null,

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


  setSpeed(speed) {
    const numericSpeed =
      Number(speed);

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
      previousMaximum === null
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


  spendMovement(distance) {
    this.assertTurnActive();

    const numericDistance =
      Number(distance);

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
    if (!movementId) {
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
    if (!movementId) {
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

    const boostAction =
      frameHelmActionRegistry.get(
        "quick.boost"
      );

    if (!boostAction) {
      return {
        committed:
          false,

        reason:
          "Boost is not registered."
      };
    }

    if (!forceOvercharge) {
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
      overchargeBoostCount >
        0 &&
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
    const action =
      typeof actionOrId ===
      "string"
        ? frameHelmActionRegistry
            .get(
              actionOrId
            )
        : actionOrId;

    if (!action) {
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


  useAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false,
      metadata = {}
    } = {}
  ) {
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

    if (!entry) {
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


  markReactionAvailable() {
    this.reaction.usedThisTurn =
      false;

    this.reaction.actionId =
      null;
  }


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


class FrameHelmTurnStateManager {
  constructor() {
    this.current =
      null;
  }


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


  clear() {
    this.current =
      null;

    this.renderApplication();
  }


  snapshot() {
    return (
      this.current
        ?.snapshot() ??
      null
    );
  }


  renderApplication() {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
}


const frameHelmTurnState =
  new FrameHelmTurnStateManager();


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


/* ==========================================================
   Frame Helm application
   ========================================================== */

/*
 * FrameHelmApplication remains unchanged.
 *
 * Keep the complete FrameHelmApplication class from the current
 * file here exactly as-is.
 *
 * The class may continue consuming:
 *
 *   frameHelmActionRegistry
 *
 * exactly as before.
 *
 * That local identifier now resolves to the Actions feature's
 * registered API rather than a registry implemented by this file.
 */


/*
 * [KEEP THE EXISTING FrameHelmApplication CLASS HERE VERBATIM]
 */


/* ==========================================================
   Frame Helm application instance
   ========================================================== */

let frameHelmApplication =
  null;


function getFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    frameHelmApplication =
      new FrameHelmApplication();
  }

  return (
    frameHelmApplication
  );
}


function openFrameHelm() {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    ui.notifications.warn(
      `${MODULE_TITLE} is currently disabled.`
    );

    return;
  }

  getFrameHelmApplication()
    .render(
      true
    );
}


function closeFrameHelm() {
  frameHelmApplication
    ?.close();
}


/* ==========================================================
   Settings
   ========================================================== */

function registerSettings() {
  game.settings.register(
    MODULE_ID,
    "enabled",
    {
      name:
        "Enable Frame Helm",

      hint:
        "Enables the Frame Helm action-selection interface.",

      scope:
        "world",

      config:
        true,

      type:
        Boolean,

      default:
        true,

      restricted:
        true,

      onChange:
        enabled => {
          if (
            !enabled
          ) {
            closeFrameHelm();
          }
        }
    }
  );
}


/* ==========================================================
   Scene control button
   ========================================================== */

function addFrameHelmControlButton(
  controls
) {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    return;
  }

  /*
   * Foundry v13 supplies Scene Controls as a keyed record.
   * Older Foundry versions supplied an array. Support both.
   */
  const tokenControls =
    Array.isArray(
      controls
    )
      ? controls.find(
          control =>
            control.name ===
            "token"
        )
      : controls?.tokens ??
        controls?.token ??
        null;

  if (
    !tokenControls
  ) {
    console.warn(
      `${MODULE_TITLE} | Token scene controls could not be located.`,
      controls
    );

    return;
  }

  const tool = {
    name:
      "lancer-frame-helm",

    title:
      MODULE_TITLE,

    icon:
      "fas fa-robot",

    button:
      true,

    visible:
      true,

    onClick:
      openFrameHelm
  };

  if (
    Array.isArray(
      tokenControls.tools
    )
  ) {
    const alreadyExists =
      tokenControls.tools.some(
        existingTool =>
          existingTool.name ===
          "lancer-frame-helm"
      );

    if (
      !alreadyExists
    ) {
      tokenControls.tools.push(
        tool
      );
    }

    return;
  }

  tokenControls.tools ??=
    {};

  if (
    !tokenControls.tools[
      "lancer-frame-helm"
    ]
  ) {
    tokenControls.tools[
      "lancer-frame-helm"
    ] = tool;
  }
}


/* ==========================================================
   Foundry lifecycle
   ========================================================== */

Hooks.once(
  "init",
  () => {
    console.log(
      `${MODULE_TITLE} | Initializing.`
    );

    registerSettings();

    /*
     * Action catalog implementation now belongs entirely to
     * actions-feature.js.
     *
     * The runtime keeps responsibility for choosing the Foundry
     * startup boundary at which that synchronous initialization
     * occurs.
     */
    initializeFrameHelmActionRegistry();

    /*
     * Extracted feature domains have already been registered by
     * feature-registry.js.
     */
    frameHelmFeatureRegistry
      .validateDependencies();

    /*
     * Install Foundry hooks declared by extracted features.
     */
    frameHelmFeatureRegistry
      .installHooks();

    installFrameHelmRuntimeStyles();
  }
);


Hooks.once(
  "ready",
  () => {
    game.lancerFrameHelm = {
      open:
        openFrameHelm,

      close:
        closeFrameHelm,

      get application() {
        return (
          getFrameHelmApplication()
        );
      },

      /*
       * Preserve the established action-registry public surface.
       *
       * Its implementation is now owned by actions-feature.js.
       */
      registry:
        frameHelmActionRegistry,

      /*
       * Expose the feature spine separately from the action
       * registry.
       */
      features:
        frameHelmFeatureRegistry,

      turn: {
        begin:
          context => {
            return (
              frameHelmTurnState
                .beginTurn(
                  context
                )
            );
          },

        ensure:
          context => {
            return (
              frameHelmTurnState
                .ensureTurn(
                  context
                )
            );
          },

        end:
          () => {
            return (
              frameHelmTurnState
                .endTurn()
            );
          },

        clear:
          () => {
            return (
              frameHelmTurnState
                .clear()
            );
          },

        sync:
          combat => {
            return (
              syncTurnStateToCombat(
                combat
              )
            );
          },

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
          (
            actionId,
            options
          ) => {
            return (
              frameHelmTurnState
                .ensureTurn()
                .canUseAction(
                  actionId,
                  options
                )
            );
          },

        use:
          (
            actionId,
            options
          ) => {
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
          },

        move:
          distance => {
            const result =
              frameHelmTurnState
                .ensureTurn()
                .spendMovement(
                  distance
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          },

        setSpeed:
          speed => {
            const result =
              frameHelmTurnState
                .ensureTurn()
                .setSpeed(
                  speed
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          },

        overcharge:
          options => {
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
      },

      /*
       * Preserve the existing convenience action API.
       *
       * These calls now delegate into the Actions feature-owned
       * registry.
       */
      actions: {
        get:
          id => {
            return (
              frameHelmActionRegistry
                .get(
                  id
                )
            );
          },

        list:
          options => {
            return (
              frameHelmActionRegistry
                .list(
                  options
                )
            );
          },

        roots:
          (
            category,
            options
          ) => {
            return (
              frameHelmActionRegistry
                .roots(
                  category,
                  options
                )
            );
          },

        childrenOf:
          (
            parentId,
            options
          ) => {
            return (
              frameHelmActionRegistry
                .childrenOf(
                  parentId,
                  options
                )
            );
          },

        categories:
          options => {
            return (
              frameHelmActionRegistry
                .listCategories(
                  options
                )
            );
          },

        register:
          action => {
            return (
              frameHelmActionRegistry
                .register(
                  action
                )
            );
          }
      }
    };

    syncTurnStateToCombat(
      game.combat
    );

    console.log(
      `${MODULE_TITLE} | Ready.`
    );
  }
);


Hooks.on(
  "getSceneControlButtons",
  addFrameHelmControlButton
);


Hooks.on(
  "controlToken",
  () => {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
);


Hooks.on(
  "deleteToken",
  () => {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
);


/* ==========================================================
   Live Lancer actor synchronization
   ========================================================== */

function displayedFrameHelmToken() {
  return (
    frameHelmApplication
      ?.getControlledToken?.() ??
    null
  );
}


function frameHelmDisplaysActor(
  actor
) {
  if (
    !actor ||
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }

  const displayedActor =
    displayedFrameHelmToken()
      ?.actor ??
    null;

  if (
    !displayedActor
  ) {
    return false;
  }

  return Boolean(
    displayedActor ===
      actor ||
    (
      displayedActor.uuid &&
      actor.uuid &&
      displayedActor.uuid ===
        actor.uuid
    ) ||
    (
      displayedActor.id &&
      actor.id &&
      displayedActor.id ===
        actor.id
    )
  );
}


function refreshFrameHelmTelemetry() {
  if (
    !frameHelmApplication
      ?.rendered
  ) {
    return;
  }

  const token =
    displayedFrameHelmToken();

  frameHelmApplication
    .synchronizeTurnSpeed(
      token
    );

  frameHelmApplication.render(
    false
  );
}


Hooks.on(
  "updateActor",
  actor => {
    if (
      frameHelmDisplaysActor(
        actor
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateToken",
  tokenDocument => {
    if (
      !frameHelmApplication
        ?.rendered
    ) {
      return;
    }

    const displayedToken =
      displayedFrameHelmToken();

    const displayedTokenId =
      displayedToken?.id ??
      displayedToken
        ?.document
        ?.id ??
      null;

    if (
      displayedTokenId ===
      tokenDocument.id
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateActorDelta",
  actorDelta => {
    if (
      !frameHelmApplication
        ?.rendered
    ) {
      return;
    }

    const displayedTokenDocument =
      displayedFrameHelmToken()
        ?.document ??
      null;

    const deltaParent =
      actorDelta?.parent ??
      null;

    if (
      displayedTokenDocument &&
      deltaParent &&
      displayedTokenDocument.id ===
        deltaParent.id
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "createItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "deleteItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


/* ==========================================================
   Combat turn synchronization
   ========================================================== */

Hooks.on(
  "combatStart",
  combat => {
    syncTurnStateToCombat(
      combat
    );
  }
);


Hooks.on(
  "updateCombat",
  (
    combat,
    changes
  ) => {
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
      turnChanged ||
      roundChanged ||
      activeChanged
    ) {
      syncTurnStateToCombat(
        combat
      );
    }
  }
);


Hooks.on(
  "deleteCombat",
  combat => {
    if (
      frameHelmTurnState
        .current
        ?.context
        ?.combatId ===
      combat.id
    ) {
      frameHelmTurnState.clear();
    }
  }
);


/* ==========================================================
   Dragged token movement tracking
   ========================================================== */

function frameHelmMovementTokenMatches(
  tokenDocument,
  state =
    frameHelmTurnState.current
) {
  if (
    !tokenDocument ||
    !state ||
    state.ended
  ) {
    return false;
  }

  const context =
    state.context ??
    {};

  const tokenMatches =
    Boolean(
      context.tokenId &&
      context.tokenId ===
        tokenDocument.id
    );

  const actorId =
    tokenDocument.actor?.id ??
    tokenDocument.actorId ??
    null;

  const actorMatches =
    Boolean(
      !context.tokenId &&
      context.actorId &&
      context.actorId ===
        actorId
    );

  return (
    tokenMatches ||
    actorMatches
  );
}


function frameHelmPoint(
  point
) {
  if (
    !point
  ) {
    return null;
  }

  const x =
    Number(
      point.x
    );

  const y =
    Number(
      point.y
    );

  if (
    !Number.isFinite(
      x
    ) ||
    !Number.isFinite(
      y
    )
  ) {
    return null;
  }

  return {
    x,
    y,

    elevation:
      Number.isFinite(
        Number(
          point.elevation
        )
      )
        ? Number(
            point.elevation
          )
        : undefined
  };
}


function frameHelmCollectMovementPoints(
  movement
) {
  const points =
    [];

  const addPoint =
    point => {
      const normalized =
        frameHelmPoint(
          point
        );

      if (
        !normalized
      ) {
        return;
      }

      const previous =
        points.at(
          -1
        );

      if (
        previous &&
        previous.x ===
          normalized.x &&
        previous.y ===
          normalized.y
      ) {
        return;
      }

      points.push(
        normalized
      );
    };

  addPoint(
    movement?.origin
  );

  const waypointSources = [
    movement?.passed
      ?.waypoints,

    movement?.pending
      ?.waypoints,

    movement?.history
      ?.waypoints,

    movement?.waypoints
  ];

  for (
    const source
    of waypointSources
  ) {
    if (
      !Array.isArray(
        source
      )
    ) {
      continue;
    }

    for (
      const waypoint
      of source
    ) {
      addPoint(
        waypoint
      );
    }
  }

  addPoint(
    movement?.destination
  );

  return points;
}


function frameHelmNumericMovementDistance(
  movement
) {
  const candidates = [
    movement?.pending
      ?.distance,

    movement?.passed
      ?.distance,

    movement?.history
      ?.distance,

    movement?.distance,

    movement?.pending
      ?.cost,

    movement?.passed
      ?.cost
  ];

  for (
    const candidate
    of candidates
  ) {
    const numeric =
      Number(
        candidate
      );

    if (
      Number.isFinite(
        numeric
      ) &&
      numeric > 0
    ) {
      return numeric;
    }
  }

  const measurementSources = [
    movement?.pending
      ?.measurements,

    movement?.passed
      ?.measurements,

    movement?.history
      ?.measurements
  ];

  for (
    const measurements
    of measurementSources
  ) {
    if (
      !Array.isArray(
        measurements
      )
    ) {
      continue;
    }

    const total =
      measurements.reduce(
        (
          sum,
          measurement
        ) => {
          const distance =
            Number(
              measurement
                ?.distance ??
              measurement
                ?.cost ??
              0
            );

          return (
            sum +
            (
              Number.isFinite(
                distance
              )
                ? distance
                : 0
            )
          );
        },
        0
      );

    if (
      total > 0
    ) {
      return total;
    }
  }

  return null;
}


function frameHelmMeasureMovementPath(
  tokenDocument,
  movement
) {
  const directDistance =
    frameHelmNumericMovementDistance(
      movement
    );

  const sceneGridDistance =
    Number(
      tokenDocument
        ?.parent
        ?.grid
        ?.distance ??
      canvas
        ?.dimensions
        ?.distance ??
      1
    );

  const normalizeSceneDistance =
    distance => {
      if (
        !Number.isFinite(
          distance
        )
      ) {
        return null;
      }

      if (
        Number.isFinite(
          sceneGridDistance
        ) &&
        sceneGridDistance >
          0
      ) {
        return (
          distance /
          sceneGridDistance
        );
      }

      return distance;
    };

  if (
    directDistance !==
    null
  ) {
    return (
      normalizeSceneDistance(
        directDistance
      )
    );
  }

  const points =
    frameHelmCollectMovementPoints(
      movement
    );

  if (
    points.length <
    2
  ) {
    return 0;
  }

  try {
    const measured =
      canvas
        ?.grid
        ?.measurePath?.(
          points,
          {
            cost:
              true
          }
        );

    const measuredDistance =
      Number(
        measured?.cost ??
        measured?.distance
      );

    if (
      Number.isFinite(
        measuredDistance
      ) &&
      measuredDistance >
        0
    ) {
      return (
        normalizeSceneDistance(
          measuredDistance
        )
      );
    }
  } catch (error) {
    console.warn(
      `${MODULE_TITLE} | Foundry path measurement failed; using geometric fallback.`,
      error
    );
  }

  const gridSize =
    Number(
      canvas
        ?.dimensions
        ?.size ??
      tokenDocument
        ?.parent
        ?.grid
        ?.size ??
      100
    );

  let pixelDistance =
    0;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previous =
      points[
        index - 1
      ];

    const current =
      points[
        index
      ];

    pixelDistance +=
      Math.hypot(
        current.x -
          previous.x,

        current.y -
          previous.y
      );
  }

  if (
    !Number.isFinite(
      gridSize
    ) ||
    gridSize <= 0
  ) {
    return 0;
  }

  return (
    pixelDistance /
    gridSize
  );
}


function frameHelmRoundMovementDistance(
  distance
) {
  const numeric =
    Number(
      distance
    );

  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric <= 0
  ) {
    return 0;
  }

  return (
    Math.round(
      numeric *
      100
    ) / 100
  );
}


Hooks.on(
  "moveToken",
  (
    tokenDocument,
    movement
  ) => {
    const state =
      frameHelmTurnState.current;

    if (
      !frameHelmMovementTokenMatches(
        tokenDocument,
        state
      )
    ) {
      return;
    }

    const distance =
      frameHelmRoundMovementDistance(
        frameHelmMeasureMovementPath(
          tokenDocument,
          movement
        )
      );

    if (
      distance <= 0
    ) {
      return;
    }

    try {
      const result =
        state.trackTokenMovement(
          distance,
          {
            movementId:
              movement?.id ??
              null,

            method:
              movement?.method ??
              null,

            origin:
              frameHelmPoint(
                movement?.origin
              ),

            destination:
              frameHelmPoint(
                movement
                  ?.destination
              )
          }
        );

      if (
        !result.tracked
      ) {
        return;
      }

      for (
        const automaticAction
        of (
          result
            .automaticActions ??
          []
        )
      ) {
        if (
          !automaticAction
            .committed
        ) {
          ui.notifications.warn(
            `Frame Helm tracked movement beyond the current allowance, but could not automatically commit Boost: ${automaticAction.reason ?? "no legal action budget remains"}.`
          );

          continue;
        }

        if (
          automaticAction
            .source ===
            "overcharge" &&
          automaticAction
            .triggeredOvercharge
        ) {
          ui.notifications.warn(
            `Movement triggered Overcharge Boost. Apply ${automaticAction.heatFormula ?? "the current Overcharge cost"} Heat.`
          );
        } else if (
          automaticAction
            .source ===
          "overcharge"
        ) {
          ui.notifications.info(
            "Movement automatically spent the available Overcharge action on Boost."
          );
        } else {
          ui.notifications.info(
            "Movement exceeded Speed. Boost was automatically committed."
          );
        }
      }

      if (
        result.excess >
        0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance. The token was not stopped.`
        );
      }

      frameHelmTurnState
        .renderApplication();
    } catch (error) {
      console.error(
        `${MODULE_TITLE} | Could not track token movement.`,
        error
      );

      ui.notifications.warn(
        `Frame Helm could not track this movement: ${error.message}`
      );
    }
  }
);


/* ==========================================================
   Universal action execution
   ========================================================== */

/**
 * Action definitions and the action registry have been extracted,
 * but execution against the Lancer actor API remains part of the
 * runtime for now.
 *
 * This is a separate future extraction candidate.
 */

const FRAME_HELM_NO_ROLL_ACTIONS =
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
  ]);


function frameHelmActionExecutionKind(
  action
) {
  if (
    !action ||
    FRAME_HELM_NO_ROLL_ACTIONS
      .has(
        action.id
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
    return (
      "basic-tech-attack"
    );
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


function frameHelmChooseMechStat(
  action
) {
  return new Promise(
    resolve => {
      const choices = [
        [
          "hull",
          "HULL"
        ],
        [
          "agi",
          "AGI"
        ],
        [
          "sys",
          "SYS"
        ],
        [
          "eng",
          "ENG"
        ]
      ];

      const buttons =
        Object.fromEntries(
          choices.map(
            (
              [
                path,
                label
              ]
            ) => {
              return [
                path,
                {
                  icon:
                    '<i class="fas fa-dice-d20"></i>',

                  label,

                  callback:
                    () =>
                      resolve({
                        path,
                        label
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


async function frameHelmExecuteActionRoll(
  actor,
  action
) {
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
      actor.beginStatFlow(
        action.metadata
          .statPath,

        action.metadata
          .statLabel ??
          action.label
      )
    );
  }

  if (
    kind ===
    "basic-attack"
  ) {
    return (
      actor.beginBasicAttackFlow(
        action.label
      )
    );
  }

  if (
    kind ===
    "basic-tech-attack"
  ) {
    return (
      actor.beginBasicTechAttackFlow(
        action.label
      )
    );
  }

  if (
    kind ===
    "scan"
  ) {
    return (
      actor.beginScanFlow()
    );
  }

  if (
    kind ===
    "stabilize"
  ) {
    return (
      actor.beginStabilizeFlow()
    );
  }

  if (
    kind ===
    "overcharge"
  ) {
    return (
      actor.beginOverchargeFlow()
    );
  }

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

  return (
    actor.beginStatFlow(
      selectedStat.path,

      `${action.label} -- ${selectedStat.label}`
    )
  );
}


/* ==========================================================
   Elevation movement tracking
   ========================================================== */

const frameHelmElevationOrigins =
  new Map();


function frameHelmElevationKey(
  tokenDocument
) {
  return String(
    tokenDocument?.uuid ??
    `${tokenDocument?.parent?.id ?? "scene"}:${tokenDocument?.id ?? "token"}`
  );
}


Hooks.on(
  "preUpdateToken",
  (
    tokenDocument,
    changes
  ) => {
    if (
      !Object.prototype
        .hasOwnProperty.call(
          changes,
          "elevation"
        )
    ) {
      return;
    }

    frameHelmElevationOrigins.set(
      frameHelmElevationKey(
        tokenDocument
      ),

      Number(
        tokenDocument.elevation
      ) || 0
    );
  }
);


Hooks.on(
  "updateToken",
  (
    tokenDocument,
    changes
  ) => {
    if (
      !Object.prototype
        .hasOwnProperty.call(
          changes,
          "elevation"
        )
    ) {
      return;
    }

    const state =
      frameHelmTurnState.current;

    if (
      !frameHelmMovementTokenMatches(
        tokenDocument,
        state
      )
    ) {
      return;
    }

    const key =
      frameHelmElevationKey(
        tokenDocument
      );

    const previousElevation =
      frameHelmElevationOrigins.get(
        key
      );

    frameHelmElevationOrigins.delete(
      key
    );

    const nextElevation =
      Number(
        changes.elevation
      );

    if (
      !Number.isFinite(
        previousElevation
      ) ||
      !Number.isFinite(
        nextElevation
      )
    ) {
      return;
    }

    const sceneDistance =
      Number(
        tokenDocument
          ?.parent
          ?.grid
          ?.distance ??
        canvas
          ?.dimensions
          ?.distance ??
        1
      );

    const elevationDistance =
      Math.abs(
        nextElevation -
          previousElevation
      );

    const movementSpaces =
      Number.isFinite(
        sceneDistance
      ) &&
      sceneDistance > 0
        ? elevationDistance /
          sceneDistance
        : elevationDistance;

    const distance =
      frameHelmRoundMovementDistance(
        movementSpaces
      );

    if (
      distance <= 0
    ) {
      return;
    }

    try {
      const result =
        state.trackTokenMovement(
          distance,
          {
            movementId:
              `elevation:${key}:${previousElevation}:${nextElevation}:${Date.now()}`,

            method:
              "elevation",

            origin: {
              x:
                Number(
                  tokenDocument.x
                ) || 0,

              y:
                Number(
                  tokenDocument.y
                ) || 0,

              elevation:
                previousElevation
            },

            destination: {
              x:
                Number(
                  tokenDocument.x
                ) || 0,

              y:
                Number(
                  tokenDocument.y
                ) || 0,

              elevation:
                nextElevation
            }
          }
        );

      if (
        !result.tracked
      ) {
        return;
      }

      ui.notifications.info(
        `Elevation changed by ${distance} space(s); Frame Helm recorded it as movement.`
      );

      if (
        result.excess >
        0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance.`
        );
      }

      frameHelmTurnState
        .renderApplication();
    } catch (error) {
      console.error(
        `${MODULE_TITLE} | Could not track elevation movement.`,
        error
      );

      ui.notifications.warn(
        `Frame Helm could not track the elevation change: ${error.message}`
      );
    }
  }
);


/* ==========================================================
   Extracted feature domains
   ========================================================== */

/**
 * The following feature domains no longer have implementations
 * inside this file:
 *
 *   ACTIONS
 *
 *     scripts/actions-feature.js
 *
 *     Owns:
 *       - FrameHelmActionRegistry
 *       - canonical action registry instance
 *       - universal action categories
 *       - universal action declarations
 *       - action-catalog initialization
 *
 *   SENSORS
 *
 *     scripts/sensors-feature.js
 *
 *     Owns:
 *       - sensor contacts
 *       - sensor-source resolution
 *       - sensor-distance measurement
 *       - sensor PIXI overlay lifecycle
 *       - sensor-specific Foundry hooks
 *
 * Both features are imported and canonically registered by:
 *
 *   scripts/feature-registry.js
 *
 * This runtime depends only on:
 *
 *   frameHelmFeatureRegistry
 *
 * and resolves extracted feature surfaces through that canonical
 * composition boundary.
 */