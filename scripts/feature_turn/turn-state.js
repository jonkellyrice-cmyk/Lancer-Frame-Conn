/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-state.js
 */


/**
 * ============================================================
 * FRAME CONN TURN -- STATE MODEL
 * ============================================================
 *
 * ROLE:
 *   Owns the mutable state model for one Frame Conn Turn.
 *
 * PURPOSE:
 *   Separate per-turn state, legality, history, committed-action
 *   state, protocol/reaction state, Overcharge state, and the
 *   transitional movement state from Turn lifecycle management
 *   and feature composition.
 *
 * OWNS:
 *   - FrameConnTurnState.
 *   - Turn context.
 *   - Action-budget state.
 *   - Protocol state.
 *   - Reaction state.
 *   - Overcharge state.
 *   - Duplicate-action tracking.
 *   - Committed-action state.
 *   - Committed-action execution state.
 *   - Turn history.
 *   - Turn snapshots.
 *
 * TRANSITIONALLY OWNS:
 *   - Speed state.
 *   - Movement allowance state.
 *   - Movement completion state.
 *   - Automatic Boost accounting.
 *   - Automatic Overcharge-for-Boost accounting.
 *   - Tracked token-movement state.
 *   - Processed movement identity.
 *
 * DOES NOT OWN:
 *   - Canonical Turn-state manager.
 *   - Turn lifecycle orchestration.
 *   - Runtime bindings.
 *   - Application rendering.
 *   - Action registry ownership.
 *   - Action declarations.
 *   - Combat synchronization.
 *   - Foundry combat hooks.
 *   - Movement path measurement.
 *   - Foundry token-movement interpretation.
 *   - Turn feature declaration.
 *
 * DEPENDENCY FLOW:
 *
 *   actions feature
 *        │
 *        ▼
 *   turn-runtime-bindings.js
 *        │
 *        │ Actions registry accessor
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
 * IMPORTANT:
 *
 *   This module does not import the Actions feature directly.
 *
 *   Action resolution is performed through the narrow accessor
 *   exported by turn-runtime-bindings.js.
 */


/* ============================================================
   Imports -- Turn runtime dependencies
   ============================================================ */

import {
  getFrameConnTurnActionRegistry
} from "./turn-runtime-bindings.js";


/* ============================================================
   Imports -- Movement state behavior
   ============================================================ */

import {
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
} from "./turn-state-movement.js";


/* ============================================================
   Frame Conn Turn state
   ============================================================ */

export class FrameConnTurnState {
  constructor(
    context = {}
  ) {
    this.reset(
      context
    );
  }


  /* ==========================================================
     Turn state -- Reset
     ========================================================== */

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


    this.restrictions = {
      brace:
        false
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
    return setFrameConnTurnStateSpeed(
      this,
      speed
    );
  }


  /* ==========================================================
     Turn state -- Movement
     ========================================================== */

  spendMovement(
    distance
  ) {
    return spendFrameConnTurnStateMovement(
      this,
      distance
    );
  }


  completeMovement() {
    return completeFrameConnTurnStateMovement(
      this
    );
  }


  reopenMovement() {
    return reopenFrameConnTurnStateMovement(
      this
    );
  }


  commitMovement(
    actionId
  ) {
    return commitFrameConnTurnStateMovement(
      this,
      actionId
    );
  }


  refreshMovementFromBoost() {
    return refreshFrameConnTurnStateMovementFromBoost(
      this
    );
  }


  movementBoostEntries() {
    return getFrameConnTurnStateMovementBoostEntries(
      this
    );
  }


  movementBoostCount() {
    return getFrameConnTurnStateMovementBoostCount(
      this
    );
  }


  hasProcessedMovementId(
    movementId
  ) {
    return hasFrameConnTurnStateProcessedMovementId(
      this,
      movementId
    );
  }


  rememberMovementId(
    movementId
  ) {
    return rememberFrameConnTurnStateMovementId(
      this,
      movementId
    );
  }


  ensureAutomaticMovementBoost(
    options = {}
  ) {
    return ensureFrameConnTurnStateAutomaticMovementBoost(
      this,
      options
    );
  }


  recalculateTrackedMovement() {
    return recalculateFrameConnTurnStateTrackedMovement(
      this
    );
  }


  trackTokenMovement(
    distance,
    options = {}
  ) {
    return trackFrameConnTurnStateTokenMovement(
      this,
      distance,
      options
    );
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
      this.restrictions?.brace
    ) {
      throw new Error(
        "Brace prevents Overcharge until the end of this turn."
      );
    }


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
      ignoreDuplicate = false,
      contextualReaction = false
    } = {}
  ) {
    const frameConnActionRegistry =
      getFrameConnTurnActionRegistry();


    const action =
      typeof actionOrId ===
      "string"
        ? frameConnActionRegistry
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
      action.metadata?.contextualReaction ===
        true &&
      !contextualReaction
    ) {
      return {
        allowed:
          false,

        reason:
          "This reaction is only available when its trigger occurs."
      };
    }


    if (
      this.restrictions?.brace
    ) {
      if (
        action.cost === "movement" ||
        action.cost === "overcharge" ||
        action.cost === "full" ||
        action.cost === "reaction" ||
        action.cost === "none"
      ) {
        return {
          allowed:
            false,

          reason:
            "Brace limits this turn to one Quick Action and prevents normal movement, Full Actions, Free Actions, Overcharge, and reactions."
        };
      }
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
    const frameConnActionRegistry =
      getFrameConnTurnActionRegistry();


    const action =
      typeof actionOrId ===
      "string"
        ? frameConnActionRegistry
            .get(
              actionOrId
            )
        : actionOrId;


    const permission =
      this.canUseAction(
        action,
        {
          useOvercharge,
          ignoreDuplicate,
          contextualReaction:
            metadata.contextualReaction ===
            true
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


  /* ==========================================================
     Turn state -- Committed action execution
     ========================================================== */

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
     Turn state -- Brace restriction
     ========================================================== */

  applyBraceRestriction() {
    this.assertTurnActive();


    if (
      this.restrictions.brace
    ) {
      return this.snapshot();
    }


    this.restrictions.brace =
      true;


    this.quickActionsRemaining =
      Math.min(
        this.quickActionsRemaining,
        1
      );


    this.fullActionAvailable =
      false;


    this.movement.remaining =
      0;


    this.movement.completed =
      true;


    this.protocol.available =
      false;


    this.protocol.startOfTurnOpen =
      false;


    this.reaction.usedThisTurn =
      true;


    this.reaction.actionId =
      "reaction.brace";


    this.recordHistory(
      "brace-turn-restriction",
      {}
    );


    return this.snapshot();
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
        "The current Frame Conn turn has ended."
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
        ...this.movement,

        segments:
          this.movement.segments.map(
            segment => ({
              ...segment,

              origin:
                segment.origin
                  ? {
                      ...segment.origin
                    }
                  : null,

              destination:
                segment.destination
                  ? {
                      ...segment.destination
                    }
                  : null
            })
          ),

        processedMovementIds: [
          ...this.movement
            .processedMovementIds
        ]
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

      restrictions: {
        ...this.restrictions
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
