/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-application.js
 */

/**
 * ============================================================
 * FRAME HELM UI FEATURE -- APPLICATION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's primary Foundry Application UI surface and
 *   application-window lifecycle.
 *
 * PURPOSE:
 *   Remove application presentation ownership from
 *   runtime-orchestrator.js while preserving the runtime
 *   orchestrator as the composition root for gameplay/runtime
 *   domains.
 *
 * RESPONSIBILITIES:
 *   - Own the FrameHelmApplication class.
 *   - Own the canonical Frame Helm application instance.
 *   - Lazily construct the Frame Helm application.
 *   - Open and close the Frame Helm application.
 *   - Re-render the application when requested.
 *   - Expose the currently-displayed/controlled token.
 *   - Own application-specific reactions to token-control changes.
 *   - Own application-specific reactions to token deletion.
 *   - Provide application state/diagnostic queries.
 *
 * DOES NOT OWN:
 *   - Action registry implementation.
 *   - Action declarations.
 *   - Turn-state implementation.
 *   - Turn legality.
 *   - Movement accounting.
 *   - Dragged-token movement tracking.
 *   - Elevation movement tracking.
 *   - Combat synchronization.
 *   - Universal action execution.
 *   - Actor telemetry synchronization.
 *   - Sensor-contact rendering.
 *   - Sensor calculations.
 *   - Module settings.
 *   - Scene-control registration.
 *   - Runtime stylesheet installation.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   feature-contract.js
 *        │
 *        ▼
 *   ui-application.js
 *        │
 *        ├── owns FrameHelmApplication
 *        ├── owns application instance
 *        ├── owns open/close/render
 *        ├── exposes displayed token
 *        └── reacts to application-specific Foundry UI hooks
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 * UI STYLING:
 *
 *   DOM presentation belonging specifically to this application
 *   feature belongs in:
 *
 *     styles/ui-application.css
 *
 *   Cross-feature/application-level stylesheet composition remains
 *   owned by:
 *
 *     styles/ui-orchestrator.css
 *
 * TRANSITIONAL COMPOSITION CONTRACT:
 *
 *   The existing FrameHelmApplication class currently reaches
 *   into several domains which have not yet been extracted.
 *
 *   To avoid moving those domains into the UI feature merely
 *   because the Application class needs them, this module exposes
 *   an explicit runtime-binding surface.
 *
 *   runtime-orchestrator.js may configure those bindings after
 *   resolving the appropriate feature APIs.
 *
 *   As Turn, Movement, Telemetry, Execution, and other domains are
 *   extracted, those bindings can progressively resolve through
 *   the feature registry instead.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - ui.application
 *     - ui.application.lifecycle
 *     - ui.application.rendering
 *     - ui.application.token
 *
 *   Required dependencies:
 *     - actions.registry
 *
 *   Optional dependencies:
 *     - sensors.refresh
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership and composition only.
 *
 *   Existing FrameHelmApplication behavior should remain unchanged.
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  defineFrameHelmFeature
} from "../scripts/feature-contract.js";


/* ============================================================
   Application feature identity
   ============================================================ */

const MODULE_ID =
  "lancer-frame-helm";

const MODULE_TITLE =
  "Lancer: Frame Helm";


/* ============================================================
   Application runtime bindings
   ============================================================ */

const frameHelmApplicationRuntimeBindings = {
  getActionRegistry:
    null,

  getTurnState:
    null,

  getTurnStateManager:
    null,

  executeActionRoll:
    null,

  refreshTelemetry:
    null
};


/* ============================================================
   Application runtime binding configuration
   ============================================================ */

function configureFrameHelmApplicationRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm application runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmApplicationRuntimeBindings
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
        `Frame Helm application received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm application runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmApplicationRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmApplicationRuntimeBindings()
  );
}


/* ============================================================
   Application runtime binding diagnostics
   ============================================================ */

function getFrameHelmApplicationRuntimeBindings() {
  return Object.freeze({
    actionRegistry:
      typeof frameHelmApplicationRuntimeBindings
        .getActionRegistry ===
        "function",

    turnState:
      typeof frameHelmApplicationRuntimeBindings
        .getTurnState ===
        "function",

    turnStateManager:
      typeof frameHelmApplicationRuntimeBindings
        .getTurnStateManager ===
        "function",

    actionExecution:
      typeof frameHelmApplicationRuntimeBindings
        .executeActionRoll ===
        "function",

    telemetryRefresh:
      typeof frameHelmApplicationRuntimeBindings
        .refreshTelemetry ===
        "function"
  });
}


/* ============================================================
   Application dependency accessors
   ============================================================ */

function getFrameHelmApplicationActionRegistry() {
  const registry =
    frameHelmApplicationRuntimeBindings
      .getActionRegistry?.();


  if (
    !registry
  ) {
    throw new Error(
      "Frame Helm application could not resolve the Actions registry."
    );
  }


  return registry;
}


function getFrameHelmApplicationTurnState() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnState?.() ??
    null
  );
}


function getFrameHelmApplicationTurnStateManager() {
  return (
    frameHelmApplicationRuntimeBindings
      .getTurnStateManager?.() ??
    null
  );
}


async function executeFrameHelmApplicationActionRoll(
  actor,
  action
) {
  const executor =
    frameHelmApplicationRuntimeBindings
      .executeActionRoll;


  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Helm application action execution has not been configured."
    );
  }


  return executor(
    actor,
    action
  );
}


/* ============================================================
   Application transitional combat-context resolution
   ============================================================ */

/**
 * Temporary preservation of the combat-context data previously
 * supplied by activeCombatTurnContext().
 *
 * Turn owns authoritative combat synchronization. This helper
 * exists only so manual Begin Turn Plan behavior remains intact
 * without referencing the removed monolithic runtime symbol.
 */
function getFrameHelmApplicationCombatContext(
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
   Frame Helm Application
   ============================================================ */

export class FrameHelmApplication
  extends Application {

  static get defaultOptions() {
    return foundry.utils.mergeObject(
      super.defaultOptions,
      {
        id:
          "lancer-frame-helm",

        title:
          MODULE_TITLE,

        classes: [
          "lancer-frame-helm"
        ],

        width:
          920,

        height:
          460,

        left:
          20,

        top:
          Math.max(
            20,
            window.innerHeight - 500
          ),

        resizable:
          true,

        minimizable:
          true
      }
    );
  }


  constructor(
    options = {}
  ) {
    super(
      options
    );


    this.selectedCategory =
      null;

    this.selectedMovementMode =
      null;

    this.selectedQuickActionId =
      null;

    this.selectedFullActionId =
      null;

    this.manualStatsByUnit =
      new Map();
  }


  /* ==========================================================
     Application -- Header controls
     ========================================================== */

  _getHeaderButtons() {
    const buttons =
      super._getHeaderButtons();


    const hasMinimizeButton =
      buttons.some(
        button =>
          button.class ===
          "frame-helm-minimize"
      );


    if (
      !hasMinimizeButton
    ) {
      buttons.unshift({
        label:
          "Minimize",

        class:
          "frame-helm-minimize",

        icon:
          "fas fa-minus",

        onclick:
          () =>
            this.minimize()
      });
    }


    return buttons;
  }


  /* ==========================================================
     Application -- Telemetry data
     ========================================================== */

  defaultManualStats() {
    return {
      hpCurrent:
        0,

      hpMax:
        0,

      heatCurrent:
        0,

      heatMax:
        0,

      armor:
        0,

      overshield:
        0,

      burn:
        0,

      structureCurrent:
        0,

      structureMax:
        0,

      stressCurrent:
        0,

      stressMax:
        0,

      repairsCurrent:
        0,

      repairsMax:
        0
    };
  }


  manualStatsKey(
    token
  ) {
    return String(
      token?.actor?.id ??
      token?.document?.actorId ??
      token?.id ??
      token?.document?.id ??
      "unselected"
    );
  }


  getManualStats(
    token
  ) {
    const key =
      this.manualStatsKey(
        token
      );


    if (
      !this.manualStatsByUnit.has(
        key
      )
    ) {
      this.manualStatsByUnit.set(
        key,
        this.defaultManualStats()
      );
    }


    const fallback =
      this.manualStatsByUnit.get(
        key
      );

    const actor =
      token?.actor ??
      null;

    const system =
      actor?.system ??
      null;


    if (
      !system
    ) {
      return {
        ...fallback,

        speed:
          null,

        live:
          false,

        actorType:
          null,

        repairsAvailable:
          true
      };
    }


    const finiteOr =
      (
        value,
        fallbackValue = 0
      ) => {
        const numericValue =
          Number(
            value
          );


        return (
          Number.isFinite(
            numericValue
          )
            ? numericValue
            : fallbackValue
        );
      };


    const rangeValue =
      (
        range,
        property,
        fallbackValue = 0
      ) => {
        return finiteOr(
          range?.[
            property
          ],
          fallbackValue
        );
      };


    const repairsAvailable =
      Boolean(
        system.repairs &&
        typeof system.repairs ===
          "object"
      );


    return {
      hpCurrent:
        rangeValue(
          system.hp,
          "value",
          fallback.hpCurrent
        ),

      hpMax:
        rangeValue(
          system.hp,
          "max",
          fallback.hpMax
        ),

      heatCurrent:
        rangeValue(
          system.heat,
          "value",
          fallback.heatCurrent
        ),

      heatMax:
        rangeValue(
          system.heat,
          "max",
          fallback.heatMax
        ),

      armor:
        finiteOr(
          system.armor,
          fallback.armor
        ),

      overshield:
        rangeValue(
          system.overshield,
          "value",
          fallback.overshield
        ),

      burn:
        finiteOr(
          system.burn,
          fallback.burn
        ),

      structureCurrent:
        rangeValue(
          system.structure,
          "value",
          fallback.structureCurrent
        ),

      structureMax:
        rangeValue(
          system.structure,
          "max",
          fallback.structureMax
        ),

      stressCurrent:
        rangeValue(
          system.stress,
          "value",
          fallback.stressCurrent
        ),

      stressMax:
        rangeValue(
          system.stress,
          "max",
          fallback.stressMax
        ),

      repairsCurrent:
        repairsAvailable
          ? rangeValue(
              system.repairs,
              "value",
              fallback.repairsCurrent
            )
          : fallback.repairsCurrent,

      repairsMax:
        repairsAvailable
          ? rangeValue(
              system.repairs,
              "max",
              fallback.repairsMax
            )
          : fallback.repairsMax,

      speed:
        finiteOr(
          system.speed,
          null
        ),

      live:
        true,

      actorType:
        actor.type ??
        null,

      repairsAvailable
    };
  }


  updateManualStat(
    token,
    statName,
    value
  ) {
    const key =
      this.manualStatsKey(
        token
      );


    if (
      !this.manualStatsByUnit.has(
        key
      )
    ) {
      this.manualStatsByUnit.set(
        key,
        this.defaultManualStats()
      );
    }


    const stats =
      this.manualStatsByUnit.get(
        key
      );


    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          stats,
          statName
        )
    ) {
      return;
    }


    const numericValue =
      Number(
        value
      );


    stats[
      statName
    ] =
      Number.isFinite(
        numericValue
      ) &&
      numericValue >= 0
        ? numericValue
        : 0;
  }


  synchronizeTurnSpeed(
    token =
      this.getControlledToken()
  ) {
    const state =
      getFrameHelmApplicationTurnState();


    const numericSpeed =
      Number(
        token?.actor?.system?.speed
      );


    if (
      !state ||
      !Number.isFinite(
        numericSpeed
      ) ||
      numericSpeed < 0
    ) {
      return;
    }


    const tokenId =
      token?.id ??
      token?.document?.id ??
      null;

    const actorId =
      token?.actor?.id ??
      null;

    const stateTokenId =
      state.context?.tokenId ??
      null;

    const stateActorId =
      state.context?.actorId ??
      null;


    const belongsToCurrentPlan =
      Boolean(
        (
          !stateTokenId &&
          !stateActorId
        ) ||
        (
          stateTokenId &&
          stateTokenId ===
            tokenId
        ) ||
        (
          stateActorId &&
          stateActorId ===
            actorId
        )
      );


    if (
      !belongsToCurrentPlan
    ) {
      return;
    }


    if (
      state.speed !==
      numericSpeed
    ) {
      state.setSpeed(
        numericSpeed
      );
    }
  }


  /* ==========================================================
     Application -- Telemetry rendering
     ========================================================== */

  renderPairedStat({
    label,
    currentName,
    maximumName,
    currentValue,
    maximumValue
  }) {
    return `
      <div class="frame-helm-stat-cell frame-helm-stat-paired">
        <span class="frame-helm-stat-label">
          ${foundry.utils.escapeHTML(label)}
        </span>

        <div class="frame-helm-stat-value-group">
          <input
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            value="${currentValue}"
            data-frame-helm-stat="${foundry.utils.escapeHTML(currentName)}"
            aria-label="${foundry.utils.escapeHTML(label)} current"
            readonly
          >

          <span class="frame-helm-stat-divider">/</span>

          <input
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            value="${maximumValue}"
            data-frame-helm-stat="${foundry.utils.escapeHTML(maximumName)}"
            aria-label="${foundry.utils.escapeHTML(label)} maximum"
            readonly
          >
        </div>
      </div>
    `;
  }


  renderSingleStat({
    label,
    statName,
    value
  }) {
    return `
      <div class="frame-helm-stat-cell frame-helm-stat-single">
        <span class="frame-helm-stat-label">
          ${foundry.utils.escapeHTML(label)}
        </span>

        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          value="${value}"
          data-frame-helm-stat="${foundry.utils.escapeHTML(statName)}"
          aria-label="${foundry.utils.escapeHTML(label)}"
          readonly
        >
      </div>
    `;
  }


  renderMechStatsBar(
    data
  ) {
    const stats =
      data.manualStats;


    const telemetryLabel =
      stats.live
        ? `LIVE ${String(
            stats.actorType ??
            "ACTOR"
          ).toUpperCase()} TELEMETRY`
        : "MANUAL FALLBACK TELEMETRY";


    return `
      <section class="frame-helm-mech-stats-bar">
        <header class="frame-helm-mech-stats-heading">
          <span>&lt;MECH//STATS&gt;</span>
          <small>${foundry.utils.escapeHTML(telemetryLabel)}</small>
        </header>

        <div class="frame-helm-mech-stats-grid">
          ${this.renderPairedStat({
            label:
              "HP",

            currentName:
              "hpCurrent",

            maximumName:
              "hpMax",

            currentValue:
              stats.hpCurrent,

            maximumValue:
              stats.hpMax
          })}

          ${this.renderPairedStat({
            label:
              "HEAT",

            currentName:
              "heatCurrent",

            maximumName:
              "heatMax",

            currentValue:
              stats.heatCurrent,

            maximumValue:
              stats.heatMax
          })}

          ${this.renderSingleStat({
            label:
              "ARM",

            statName:
              "armor",

            value:
              stats.armor
          })}

          ${this.renderSingleStat({
            label:
              "O.SHLD",

            statName:
              "overshield",

            value:
              stats.overshield
          })}

          ${this.renderSingleStat({
            label:
              "BURN",

            statName:
              "burn",

            value:
              stats.burn
          })}

          ${this.renderPairedStat({
            label:
              "STRUCT",

            currentName:
              "structureCurrent",

            maximumName:
              "structureMax",

            currentValue:
              stats.structureCurrent,

            maximumValue:
              stats.structureMax
          })}

          ${this.renderPairedStat({
            label:
              "STRESS",

            currentName:
              "stressCurrent",

            maximumName:
              "stressMax",

            currentValue:
              stats.stressCurrent,

            maximumValue:
              stats.stressMax
          })}

          ${
            stats.repairsAvailable
              ? this.renderPairedStat({
                  label:
                    "REP",

                  currentName:
                    "repairsCurrent",

                  maximumName:
                    "repairsMax",

                  currentValue:
                    stats.repairsCurrent,

                  maximumValue:
                    stats.repairsMax
                })
              : `
                <div class="frame-helm-stat-cell frame-helm-stat-unavailable">
                  <span class="frame-helm-stat-label">
                    REP
                  </span>

                  <strong>
                    N/A
                  </strong>
                </div>
              `
          }
        </div>
      </section>
    `;
  }


  /* ==========================================================
     Application -- Controlled token
     ========================================================== */

  getControlledToken() {
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


  /* ==========================================================
     Application -- Turn-state presentation
     ========================================================== */

  getTurnStateForDisplay() {
    return (
      getFrameHelmApplicationTurnState()
        ?.snapshot?.() ??
      null
    );
  }


  actionAvailability(
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
      getFrameHelmApplicationTurnState();


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


  actionViewModel(
    action,
    turnState
  ) {
    const availability =
      this.actionAvailability(
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


  categoryViewModel(
    category,
    turnState
  ) {
    const registry =
      getFrameHelmApplicationActionRegistry();


    const actions =
      registry.roots(
        category.id
      );


    const actionModels =
      actions.map(
        action => {
          return (
            this.actionViewModel(
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


  /* ==========================================================
     Application -- View data
     ========================================================== */

  getData(
    options = {}
  ) {
    const selectedToken =
      this.getControlledToken();


    this.synchronizeTurnSpeed(
      selectedToken
    );


    const turnState =
      this.getTurnStateForDisplay();

    const manualStats =
      this.getManualStats(
        selectedToken
      );

    const registry =
      getFrameHelmApplicationActionRegistry();


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
              this.categoryViewModel(
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
          this.selectedCategory
      ) ??
      null;


    return {
      moduleTitle:
        MODULE_TITLE,

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


  /* ==========================================================
     Application -- Committed plan
     ========================================================== */

  committedPlanEntries(
    state
  ) {
    if (
      !state
    ) {
      return [];
    }


    const registry =
      getFrameHelmApplicationActionRegistry();

    const entries =
      [];


    for (
      const event
      of state.history ??
        []
    ) {
      if (
        event.type ===
          "movement-segment" ||
        event.type ===
          "movement-commit"
      ) {
        const action =
          registry.get(
            event.data?.actionId
          );


        entries.push({
          type:
            "movement",

          icon:
            action?.icon ??
            "fas fa-shoe-prints",

          label:
            action?.label ??
            "Movement",

          detail:
            `${event.data?.distance ?? 0} space(s) committed`,

          timestamp:
            event.timestamp
        });
      }


      if (
        event.type ===
        "overcharge"
      ) {
        entries.push({
          type:
            "overcharge",

          icon:
            "fas fa-temperature-high",

          label:
            "Overcharge",

          detail:
            `Heat ${event.data?.heatFormula ?? "?"}`,

          timestamp:
            event.timestamp
        });
      }


      if (
        event.type ===
        "use-protocol"
      ) {
        const action =
          registry.get(
            event.data?.actionId
          );


        entries.push({
          type:
            "protocol",

          icon:
            action?.icon ??
            "fas fa-microchip",

          label:
            action?.label ??
            "Protocol",

          detail:
            "Start-of-turn protocol",

          timestamp:
            event.timestamp
        });
      }
    }


    for (
      const usedAction
      of state.usedActions ??
        []
    ) {
      const action =
        registry.get(
          usedAction.actionId
        );


      if (
        !action
      ) {
        continue;
      }


      entries.push({
        type:
          action.category,

        icon:
          action.icon ||
          "fas fa-bolt",

        label:
          action.label,

        detail:
          usedAction.source ===
          "overcharge"
            ? "Overcharge quick action"
            : action.cost ===
                "full"
              ? "Full action"
              : action.cost ===
                  "quick"
                ? "Quick action"
                : action.cost,

        timestamp:
          usedAction.timestamp
      });
    }


    return (
      entries.sort(
        (
          left,
          right
        ) => {
          return (
            left.timestamp -
            right.timestamp
          );
        }
      )
    );
  }


  renderCommittedPlan(
    state
  ) {
    const entries =
      this.committedPlanEntries(
        state
      );


    const entryMarkup =
      entries.length
        ? entries
            .map(
              (
                entry,
                index
              ) => {
                return `
                  <li class="frame-helm-plan-entry frame-helm-plan-${foundry.utils.escapeHTML(entry.type)}">
                    <span class="frame-helm-plan-index">
                      ${String(index + 1).padStart(2, "0")}
                    </span>

                    <i class="${foundry.utils.escapeHTML(entry.icon)}"></i>

                    <span class="frame-helm-plan-copy">
                      <strong>
                        ${foundry.utils.escapeHTML(entry.label)}
                      </strong>

                      <small>
                        ${foundry.utils.escapeHTML(entry.detail)}
                      </small>
                    </span>
                  </li>
                `;
              }
            )
            .join(
              ""
            )
        : `
          <li class="frame-helm-plan-empty">
            <i class="fas fa-wave-square"></i>
            <span>No actions committed yet.</span>
          </li>
        `;


    return `
      <section class="frame-helm-plan-panel">
        <header class="frame-helm-plan-header">
          <div>
            <span>
              Committed Plan
            </span>

            <small>
              ${
                entries.length
                  ? `${entries.length} declared step${entries.length === 1 ? "" : "s"}`
                  : "No declared steps"
              }
            </small>
          </div>

          <i
            class="fas fa-list-check frame-helm-plan-header-icon"
            aria-hidden="true"
          ></i>
        </header>

        <ol class="frame-helm-plan-list">
          ${entryMarkup}
        </ol>
      </section>
    `;
  }


  /* ==========================================================
     Application -- Turn budget
     ========================================================== */

  renderBudgetPanel(
    data
  ) {
    if (
      !data.hasTurnState
    ) {
      return `
        <section class="frame-helm-budget frame-helm-budget-empty">
          <div class="frame-helm-budget-message">
            <i class="fas fa-circle-play"></i>

            <div>
              <strong>
                No turn plan is active.
              </strong>

              <p>
                Begin a plan to track movement, actions, and Overcharge.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="frame-helm-primary-button"
            data-frame-helm-command="begin-turn"
            ${data.hasSelectedToken ? "" : "disabled"}
          >
            <i class="fas fa-play"></i>
            Begin Turn Plan
          </button>
        </section>
      `;
    }


    const state =
      data.turnState;


    const movementValue =
      state.movement.maximum ===
      null
        ? "Unrated"
        : `${state.movement.remaining} / ${state.movement.maximum}`;


    const normalActionLabel =
      state.actionMode ===
      "full"
        ? "Full action used"
        : state.actionMode ===
            "quick"
          ? `${state.quickActionsRemaining} quick remaining`
          : "2 quick or 1 full";


    const overchargeLabel =
      state.overcharge.used
        ? state.overcharge
            .quickActionRemaining >
          0
          ? "Quick action ready"
          : "Used"
        : "Available";


    return `
      <section class="frame-helm-budget">
        <div class="frame-helm-budget-grid">
          <div class="frame-helm-budget-item">
            <span>Movement</span>
            <strong>${foundry.utils.escapeHTML(movementValue)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Actions</span>
            <strong>${foundry.utils.escapeHTML(normalActionLabel)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Overcharge</span>
            <strong>${foundry.utils.escapeHTML(overchargeLabel)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Protocol Window</span>

            <strong>
              ${
                state.protocol.startOfTurnOpen
                  ? "Open"
                  : "Closed"
              }
            </strong>
          </div>
        </div>

        <div class="frame-helm-budget-controls">
          <button
            type="button"
            class="frame-helm-secondary-button"
            data-frame-helm-command="reset-turn"
          >
            <i class="fas fa-rotate-left"></i>
            Reset Plan
          </button>

          <button
            type="button"
            class="frame-helm-end-turn-button"
            data-frame-helm-command="end-turn"
          >
            <i class="fas fa-flag-checkered"></i>
            End Turn
          </button>
        </div>
      </section>

      ${this.renderCommittedPlan(state)}
    `;
  }


  /* ==========================================================
     Application -- Unit panel
     ========================================================== */

  renderUnitPanel(
    data
  ) {
    const portrait =
      data.tokenImage
        ? `
          <img
            class="frame-helm-unit-image"
            src="${foundry.utils.escapeHTML(data.tokenImage)}"
            alt=""
          >
        `
        : `
          <div class="frame-helm-unit-image frame-helm-unit-image-empty">
            <i class="fas fa-robot"></i>
          </div>
        `;


    const unitText =
      data.hasSelectedToken
        ? `
          <div class="frame-helm-unit-text">
            <span class="frame-helm-label">
              Controlled Unit
            </span>

            <strong>
              ${foundry.utils.escapeHTML(data.tokenName)}
            </strong>
          </div>
        `
        : `
          <div class="frame-helm-unit-text">
            <span class="frame-helm-label">
              Controlled Unit
            </span>

            <strong>
              No token selected
            </strong>

            <small>
              Select a mech or NPC token on the canvas.
            </small>
          </div>
        `;


    return `
      <section class="frame-helm-unit-panel">
        ${portrait}
        ${unitText}
      </section>
    `;
  }


  /* ==========================================================
     Application -- Action categories
     ========================================================== */

  renderCategoryMenu(
    data
  ) {
    const buttons =
      data.categories
        .map(
          category => {
            const unavailableClass =
              data.hasTurnState &&
              !category.hasAvailableAction
                ? " frame-helm-category-unavailable"
                : "";


            return `
              <button
                type="button"
                class="frame-helm-category-button${unavailableClass}"
                data-frame-helm-category="${foundry.utils.escapeHTML(category.id)}"
              >
                <i class="${foundry.utils.escapeHTML(category.icon)}"></i>

                <span class="frame-helm-category-copy">
                  <strong>
                    ${foundry.utils.escapeHTML(category.label)}
                  </strong>

                  <small>
                    ${foundry.utils.escapeHTML(category.description)}
                  </small>
                </span>

                <i class="fas fa-chevron-right frame-helm-category-arrow"></i>
              </button>
            `;
          }
        )
        .join(
          ""
        );


    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading">
          <span>
            Choose an action type
          </span>
        </div>

        <div class="frame-helm-category-list">
          ${buttons}
        </div>
      </section>
    `;
  }


  /* ==========================================================
     Application -- Quick actions
     ========================================================== */

  quickActionChildren(
    actionId
  ) {
    return (
      getFrameHelmApplicationActionRegistry()
        .childrenOf(
          actionId
        )
    );
  }


  quickActionBreadcrumb(
    action
  ) {
    const registry =
      getFrameHelmApplicationActionRegistry();

    const breadcrumb =
      [];

    let current =
      action;


    while (
      current
    ) {
      breadcrumb.unshift(
        current
      );


      current =
        current.parentId
          ? registry.get(
              current.parentId
            )
          : null;
    }


    return breadcrumb;
  }


  renderQuickActionBudget(
    state
  ) {
    const normalRemaining =
      state?.quickActionsRemaining ??
      0;

    const overchargeRemaining =
      state?.overcharge
        ?.quickActionRemaining ??
      0;


    const overchargeStatus =
      !state?.overcharge?.used
        ? "Available"
        : overchargeRemaining >
            0
          ? "Quick action ready"
          : "Spent";


    return `
      <section class="frame-helm-quick-budget">
        <div>
          <span>Normal Quick Actions</span>
          <strong>${normalRemaining}</strong>
        </div>

        <div>
          <span>Overcharge</span>
          <strong>${foundry.utils.escapeHTML(overchargeStatus)}</strong>
        </div>
      </section>
    `;
  }


  canAutomaticallyOvercharge(
    action,
    state
  ) {
    if (
      !state ||
      !action ||
      action.cost !==
        "quick"
    ) {
      return false;
    }


    if (
      state.ended
    ) {
      return false;
    }


    if (
      state.overcharge.used
    ) {
      return (
        state.overcharge
          .quickActionRemaining >
        0
      );
    }


    return true;
  }


  renderQuickActionChoice(
    action,
    state
  ) {
    const children =
      this.quickActionChildren(
        action.id
      );

    const hasChildren =
      children.length >
      0;


    let availability;

    let requiresOvercharge =
      false;


    if (
      hasChildren
    ) {
      availability = {
        allowed:
          true,

        reason:
          null
      };
    } else if (
      state
    ) {
      const currentState =
        getFrameHelmApplicationTurnState();


      const normalPermission =
        currentState
          ?.canUseAction(
            action
          ) ?? {
          allowed:
            false,

          reason:
            "No active turn state."
        };


      const activeOverchargePermission =
        currentState
          ?.canUseAction(
            action,
            {
              useOvercharge:
                true
            }
          ) ?? {
          allowed:
            false,

          reason:
            "No active turn state."
        };


      const automaticOverchargeAvailable =
        this.canAutomaticallyOvercharge(
          action,
          state
        );


      requiresOvercharge =
        !normalPermission.allowed &&
        (
          activeOverchargePermission.allowed ||
          automaticOverchargeAvailable
        );


      availability = {
        allowed:
          normalPermission.allowed ||
          activeOverchargePermission.allowed ||
          automaticOverchargeAvailable,

        reason:
          normalPermission.reason ??
          activeOverchargePermission.reason
      };
    } else {
      availability = {
        allowed:
          false,

        reason:
          "Begin a turn plan first."
      };
    }


    const disabled =
      availability.allowed
        ? ""
        : "disabled";


    const arrow =
      hasChildren
        ? `<i class="fas fa-chevron-right frame-helm-category-arrow"></i>`
        : "";


    const status =
      requiresOvercharge
        ? `
          <span class="frame-helm-action-overcharge-warning">
            <i class="fas fa-temperature-high"></i>
            Requires Overcharge
          </span>
        `
        : availability.allowed
          ? ""
          : `
            <span class="frame-helm-action-reason">
              ${foundry.utils.escapeHTML(
                availability.reason ??
                "Unavailable"
              )}
            </span>
          `;


    const overchargeClass =
      requiresOvercharge
        ? " frame-helm-quick-choice-overcharge"
        : "";


    return `
      <button
        type="button"
        class="frame-helm-action-button frame-helm-quick-choice${overchargeClass}"
        data-frame-helm-quick-action="${foundry.utils.escapeHTML(action.id)}"
        ${disabled}
      >
        <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

        <span class="frame-helm-action-copy">
          <strong>${foundry.utils.escapeHTML(action.label)}</strong>
          <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
          ${status}
        </span>

        ${arrow}
      </button>
    `;
  }


  renderQuickActionExecution(
    action,
    state
  ) {
    const currentState =
      getFrameHelmApplicationTurnState();


    const normalPermission =
      state &&
      currentState
        ? currentState.canUseAction(
            action
          )
        : {
            allowed:
              false,

            reason:
              "Begin a turn plan first."
          };


    const activeOverchargePermission =
      state &&
      currentState
        ? currentState.canUseAction(
            action,
            {
              useOvercharge:
                true
            }
          )
        : {
            allowed:
              false,

            reason:
              "Begin a turn plan first."
          };


    const automaticOverchargeAvailable =
      this.canAutomaticallyOvercharge(
        action,
        state
      );


    const overchargeAllowed =
      activeOverchargePermission.allowed ||
      automaticOverchargeAvailable;


    const willTriggerOvercharge =
      Boolean(
        state &&
        !state.overcharge.used &&
        automaticOverchargeAvailable
      );


    const normalReason =
      normalPermission.allowed
        ? "Spend one of your normal Quick Actions."
        : normalPermission.reason;


    let overchargeTitle =
      "Use Overcharge Action";

    let overchargeReason =
      activeOverchargePermission.reason ??
      "Overcharge is unavailable.";


    if (
      willTriggerOvercharge
    ) {
      overchargeTitle =
        "Overcharge and Use Action";

      overchargeReason =
        "Warning: this will trigger Overcharge, apply the current Overcharge Heat cost, and immediately spend the granted Quick Action.";
    } else if (
      activeOverchargePermission.allowed
    ) {
      overchargeReason =
        "Spend the additional Quick Action already granted by Overcharge.";
    }


    const targetNotice =
      action.requiresTarget
        ? `
          <div class="frame-helm-quick-requirement">
            <i class="fas fa-crosshairs"></i>

            <span>
              This action requires a target. Guided targeting will be added in a later patch.
            </span>
          </div>
        `
        : "";


    return `
      <section class="frame-helm-quick-detail">
        <div class="frame-helm-quick-detail-header">
          <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

          <div>
            <h3>${foundry.utils.escapeHTML(action.label)}</h3>
            <p>${foundry.utils.escapeHTML(action.shortDescription)}</p>
          </div>
        </div>

        ${targetNotice}

        <div class="frame-helm-quick-execution-options">
          <button
            type="button"
            class="frame-helm-quick-execute-button"
            data-frame-helm-quick-execute="normal"
            data-frame-helm-action-id="${foundry.utils.escapeHTML(action.id)}"
            ${normalPermission.allowed ? "" : "disabled"}
          >
            <i class="fas fa-bolt"></i>

            <span>
              <strong>Use Quick Action</strong>
              <small>${foundry.utils.escapeHTML(normalReason ?? "Unavailable")}</small>
            </span>
          </button>

          <button
            type="button"
            class="frame-helm-quick-execute-button frame-helm-overcharge-execute${willTriggerOvercharge ? " frame-helm-auto-overcharge-execute" : ""}"
            data-frame-helm-quick-execute="overcharge"
            data-frame-helm-action-id="${foundry.utils.escapeHTML(action.id)}"
            ${overchargeAllowed ? "" : "disabled"}
          >
            <i class="fas fa-temperature-high"></i>

            <span>
              <strong>${foundry.utils.escapeHTML(overchargeTitle)}</strong>
              <small>${foundry.utils.escapeHTML(overchargeReason)}</small>
            </span>
          </button>
        </div>

        <p class="frame-helm-quick-placeholder-note">
          This records the selected action in the turn planner. The action's attack, tech, targeting, and dice workflow will be connected in later patches.
        </p>
      </section>
    `;
  }


  renderQuickActionPanel(
    data
  ) {
    const state =
      data.turnState;

    const registry =
      getFrameHelmApplicationActionRegistry();


    const selectedAction =
      this.selectedQuickActionId
        ? registry.get(
            this.selectedQuickActionId
          )
        : null;


    const availableActions =
      selectedAction
        ? this.quickActionChildren(
            selectedAction.id
          )
        : registry.roots(
            "quick"
          );


    const breadcrumb =
      selectedAction
        ? this.quickActionBreadcrumb(
            selectedAction
          )
        : [];


    const breadcrumbText =
      breadcrumb.length
        ? breadcrumb
            .map(
              action =>
                action.label
            )
            .join(
              " › "
            )
        : "Quick Actions";


    const hasChildren =
      availableActions.length >
      0;


    const actionChoices =
      availableActions
        .map(
          action => {
            return (
              this.renderQuickActionChoice(
                action,
                state
              )
            );
          }
        )
        .join(
          ""
        );


    const content =
      selectedAction &&
      !hasChildren
        ? this.renderQuickActionExecution(
            selectedAction,
            state
          )
        : `
          <div class="frame-helm-action-list">
            ${actionChoices}
          </div>
        `;


    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
          <button
            type="button"
            class="frame-helm-back-button"
            data-frame-helm-command="quick-back"
            aria-label="Go back"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>${foundry.utils.escapeHTML(breadcrumbText)}</span>

            <small>
              Choose one universal quick action. Normally, the same action cannot be taken twice in one turn.
            </small>
          </div>
        </div>

        ${this.renderQuickActionBudget(state)}
        ${content}
      </section>
    `;
  }


  /* ==========================================================
     Application -- Full actions
     ========================================================== */

  renderFullActionBudget(
    state
  ) {
    let status =
      "Unavailable";


    if (
      state
    ) {
      if (
        state.actionMode ===
        "full"
      ) {
        status =
          "Full action used";
      } else if (
        state.actionMode ===
        "quick"
      ) {
        status =
          "Quick action already used";
      } else if (
        state.fullActionAvailable
      ) {
        status =
          "Available";
      }
    }


    return `
      <section class="frame-helm-full-budget">
        <div>
          <span>Full Action</span>
          <strong>${foundry.utils.escapeHTML(status)}</strong>
        </div>

        <div>
          <span>Normal Quick Actions</span>
          <strong>${state?.quickActionsRemaining ?? 0}</strong>
        </div>
      </section>
    `;
  }


  renderFullActionChoice(
    action,
    state
  ) {
    const currentState =
      getFrameHelmApplicationTurnState();


    const permission =
      state &&
      currentState
        ? currentState.canUseAction(
            action
          )
        : {
            allowed:
              false,

            reason:
              "Begin a turn plan first."
          };


    const reason =
      permission.allowed
        ? ""
        : `
          <span class="frame-helm-action-reason">
            ${foundry.utils.escapeHTML(permission.reason ?? "Unavailable")}
          </span>
        `;


    return `
      <button
        type="button"
        class="frame-helm-action-button frame-helm-full-choice"
        data-frame-helm-full-action="${foundry.utils.escapeHTML(action.id)}"
        ${permission.allowed ? "" : "disabled"}
      >
        <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

        <span class="frame-helm-action-copy">
          <strong>${foundry.utils.escapeHTML(action.label)}</strong>
          <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
          ${reason}
        </span>

        <i class="fas fa-chevron-right frame-helm-category-arrow"></i>
      </button>
    `;
  }


  renderFullActionRequirements(
    action
  ) {
    const notices =
      [];


    if (
      action.requiresTarget
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-crosshairs"></i>
          <span>
            This action requires one or more targets. Guided targeting will be connected in a later patch.
          </span>
        </div>
      `);
    }


    if (
      action.id ===
      "full.barrage"
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-gun"></i>
          <span>
            Choose two eligible weapons, or one eligible Superheavy weapon. Weapon-mount selection will be added later.
          </span>
        </div>
      `);
    }


    if (
      action.id ===
      "full.full-tech"
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-laptop-code"></i>
          <span>
            Full Tech allows two different Quick Tech options, or one available Full Tech option. Its nested selector will be added during tech integration.
          </span>
        </div>
      `);
    }


    if (
      action.id ===
      "full.stabilize"
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-screwdriver-wrench"></i>
          <span>
            Choose the applicable Stabilize options after selecting this action. The detailed Stabilize workflow will be added later.
          </span>
        </div>
      `);
    }


    if (
      action.id ===
      "full.activate"
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-gears"></i>
          <span>
            This branch will list installed systems with an Activate (Full) action once actor-system integration is added.
          </span>
        </div>
      `);
    }


    if (
      action.id ===
      "full.mount-dismount"
    ) {
      notices.push(`
        <div class="frame-helm-full-requirement">
          <i class="fas fa-person-arrow-up-from-line"></i>
          <span>
            Choose Mount, Dismount, or Eject. The selected mode will be resolved manually for now.
          </span>
        </div>
      `);
    }


    return (
      notices.join(
        ""
      )
    );
  }


  renderFullActionExecution(
    action,
    state
  ) {
    const currentState =
      getFrameHelmApplicationTurnState();


    const permission =
      state &&
      currentState
        ? currentState.canUseAction(
            action
          )
        : {
            allowed:
              false,

            reason:
              "Begin a turn plan first."
          };


    const confirmationText =
      permission.allowed
        ? "Spend your normal action budget as one Full Action."
        : permission.reason ??
          "This Full Action is unavailable.";


    return `
      <section class="frame-helm-full-detail">
        <div class="frame-helm-full-detail-header">
          <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

          <div>
            <h3>${foundry.utils.escapeHTML(action.label)}</h3>
            <p>${foundry.utils.escapeHTML(action.shortDescription)}</p>
          </div>
        </div>

        ${this.renderFullActionRequirements(action)}

        <button
          type="button"
          class="frame-helm-full-execute-button"
          data-frame-helm-full-execute="${foundry.utils.escapeHTML(action.id)}"
          ${permission.allowed ? "" : "disabled"}
        >
          <i class="fas fa-hourglass"></i>

          <span>
            <strong>Use Full Action</strong>
            <small>${foundry.utils.escapeHTML(confirmationText)}</small>
          </span>
        </button>

        <p class="frame-helm-full-placeholder-note">
          Frame Helm will record the action and spend the normal action budget. Dice rolls, targeting, weapon selection, and system effects remain manual until their dedicated workflows are added.
        </p>
      </section>
    `;
  }


  renderFullActionPanel(
    data
  ) {
    const state =
      data.turnState;

    const registry =
      getFrameHelmApplicationActionRegistry();


    const selectedAction =
      this.selectedFullActionId
        ? registry.get(
            this.selectedFullActionId
          )
        : null;


    const content =
      selectedAction
        ? this.renderFullActionExecution(
            selectedAction,
            state
          )
        : `
          <div class="frame-helm-action-list">
            ${registry
              .roots(
                "full"
              )
              .map(
                action => {
                  return (
                    this.renderFullActionChoice(
                      action,
                      state
                    )
                  );
                }
              )
              .join(
                ""
              )}
          </div>
        `;


    const heading =
      selectedAction
        ? selectedAction.label
        : "Full Actions";


    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
          <button
            type="button"
            class="frame-helm-back-button"
            data-frame-helm-command="full-back"
            aria-label="Go back"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>${foundry.utils.escapeHTML(heading)}</span>

            <small>
              A Full Action spends both normal Quick Action slots. Overcharge remains separate.
            </small>
          </div>
        </div>

        ${this.renderFullActionBudget(state)}
        ${content}
      </section>
    `;
  }


  /* ==========================================================
     Application -- Movement
     ========================================================== */

  renderMovementPanel(
    data
  ) {
    const state =
      data.turnState;


    if (
      !state
    ) {
      return `
        <section class="frame-helm-action-panel">
          <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
            <button
              type="button"
              class="frame-helm-back-button"
              data-frame-helm-command="back"
              aria-label="Back to action categories"
            >
              <i class="fas fa-arrow-left"></i>
            </button>

            <div>
              <span>Movement</span>
              <small>
                Begin a turn plan before tracking movement.
              </small>
            </div>
          </div>

          <div class="frame-helm-no-actions">
            <i class="fas fa-circle-play"></i>
            <p>
              Begin a turn plan to configure and track movement.
            </p>
          </div>
        </section>
      `;
    }


    const registry =
      getFrameHelmApplicationActionRegistry();

    const movement =
      state.movement;

    const hasRatedSpeed =
      movement.maximum !==
      null;


    const speedConfiguration =
      hasRatedSpeed
        ? ""
        : `
          <section class="frame-helm-movement-speed-setup">
            <label for="frame-helm-speed-input">
              Mech Speed
            </label>

            <div class="frame-helm-movement-input-row">
              <input
                id="frame-helm-speed-input"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="Enter Speed"
                data-frame-helm-speed-input
              >

              <button
                type="button"
                data-frame-helm-command="set-speed"
              >
                <i class="fas fa-gauge-high"></i>
                Set Speed
              </button>
            </div>

            <p class="frame-helm-movement-note">
              Automatic Speed detection will be added during Lancer-system integration.
            </p>
          </section>
        `;


    const movementModes =
      registry
        .childrenOf(
          "movement.standard"
        )
        .filter(
          action =>
            action.movementMode
        )
        .map(
          action => {
            const selected =
              this.selectedMovementMode ===
              action.id;


            const selectedClass =
              selected
                ? " frame-helm-movement-mode-selected"
                : "";


            const restrictedNote =
              action.metadata
                ?.requiresFlightCapability
                ? "Requires flight capability."
                : action.metadata
                    ?.requiresTeleportCapability
                  ? "Requires a teleport effect."
                  : "";


            return `
              <button
                type="button"
                class="frame-helm-movement-mode${selectedClass}"
                data-frame-helm-movement-mode="${foundry.utils.escapeHTML(action.id)}"
                ${movement.completed ? "disabled" : ""}
              >
                <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

                <span>
                  <strong>${foundry.utils.escapeHTML(action.label)}</strong>
                  <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>

                  ${
                    restrictedNote
                      ? `<em>${foundry.utils.escapeHTML(restrictedNote)}</em>`
                      : ""
                  }
                </span>
              </button>
            `;
          }
        )
        .join(
          ""
        );


    const standardMoveSelected =
      this.selectedMovementMode ===
      "movement.standard";


    const standardMoveClass =
      standardMoveSelected
        ? " frame-helm-movement-mode-selected"
        : "";


    const selectedAction =
      this.selectedMovementMode
        ? registry.get(
            this.selectedMovementMode
          )
        : null;


    const selectedMovementLabel =
      selectedAction
        ? selectedAction.label
        : "No movement mode selected";


    const tracker =
      hasRatedSpeed
        ? `
          <section class="frame-helm-movement-tracker">
            <div class="frame-helm-movement-summary">
              <div>
                <span>Speed</span>
                <strong>${movement.maximum}</strong>
              </div>

              <div>
                <span>Spent</span>
                <strong>${movement.spent}</strong>
              </div>

              <div>
                <span>Remaining</span>
                <strong>${movement.remaining}</strong>
              </div>
            </div>

            <div class="frame-helm-movement-current-mode">
              <span>
                Selected Mode
              </span>

              <strong>
                ${foundry.utils.escapeHTML(selectedMovementLabel)}
              </strong>
            </div>

            <p class="frame-helm-movement-note frame-helm-movement-commit-note">
              Selecting a movement mode commits the unit's entire currently available movement allowance. Frame Helm tracks the action budget; the token may still be moved normally on the canvas.
            </p>

            <div class="frame-helm-movement-controls">
              <button
                type="button"
                class="frame-helm-secondary-button"
                data-frame-helm-command="reset-movement"
              >
                <i class="fas fa-rotate-left"></i>
                Reset Movement
              </button>

              <button
                type="button"
                class="frame-helm-primary-button"
                data-frame-helm-command="${movement.completed ? "reopen-movement" : "complete-movement"}"
              >
                <i class="fas ${movement.completed ? "fa-lock-open" : "fa-check"}"></i>
                ${movement.completed ? "Reopen Movement" : "Movement Complete"}
              </button>
            </div>
          </section>
        `
        : "";


    return `
      <section class="frame-helm-action-panel frame-helm-movement-panel">
        <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
          <button
            type="button"
            class="frame-helm-back-button"
            data-frame-helm-command="back"
            aria-label="Back to action categories"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>
              Movement
            </span>

            <small>
              Move up to the unit's rated Speed during its turn.
            </small>
          </div>
        </div>

        ${speedConfiguration}

        <section class="frame-helm-movement-modes">
          <div class="frame-helm-movement-subheading">
            Choose Movement Mode
          </div>

          <button
            type="button"
            class="frame-helm-movement-mode${standardMoveClass}"
            data-frame-helm-movement-mode="movement.standard"
            ${movement.completed ? "disabled" : ""}
          >
            <i class="fas fa-person-walking"></i>

            <span>
              <strong>
                Standard Move
              </strong>

              <small>
                Move normally up to your remaining Speed.
              </small>
            </span>
          </button>

          ${movementModes}
        </section>

        ${tracker}
      </section>
    `;
  }


  /* ==========================================================
     Application -- Action surface
     ========================================================== */

  renderActionList(
    data
  ) {
    const category =
      data.selectedCategory;


    if (
      category?.id ===
      "movement"
    ) {
      return (
        this.renderMovementPanel(
          data
        )
      );
    }


    if (
      category?.id ===
      "quick"
    ) {
      return (
        this.renderQuickActionPanel(
          data
        )
      );
    }


    if (
      category?.id ===
      "full"
    ) {
      return (
        this.renderFullActionPanel(
          data
        )
      );
    }


    if (
      !category
    ) {
      return (
        this.renderCategoryMenu(
          data
        )
      );
    }


    const actionButtons =
      category.actions
        .map(
          action => {
            const disabledAttribute =
              action.allowed
                ? ""
                : "disabled";


            const unavailableText =
              action.allowed
                ? ""
                : `
                  <span class="frame-helm-action-reason">
                    ${foundry.utils.escapeHTML(action.unavailableReason)}
                  </span>
                `;


            return `
              <button
                type="button"
                class="frame-helm-action-button"
                data-frame-helm-action="${foundry.utils.escapeHTML(action.id)}"
                ${disabledAttribute}
              >
                <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

                <span class="frame-helm-action-copy">
                  <strong>${foundry.utils.escapeHTML(action.label)}</strong>
                  <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
                  ${unavailableText}
                </span>
              </button>
            `;
          }
        )
        .join(
          ""
        );


    const emptyMessage =
      category.hasActions
        ? ""
        : `
          <div class="frame-helm-no-actions">
            <i class="fas fa-circle-info"></i>

            <p>
              No universal actions are registered in this category yet.
            </p>
          </div>
        `;


    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
          <button
            type="button"
            class="frame-helm-back-button"
            data-frame-helm-command="back"
            aria-label="Back to action categories"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>
              ${foundry.utils.escapeHTML(category.label)}
            </span>

            <small>
              ${foundry.utils.escapeHTML(category.description)}
            </small>
          </div>
        </div>

        <div class="frame-helm-action-list">
          ${actionButtons}
          ${emptyMessage}
        </div>
      </section>
    `;
  }


  /* ==========================================================
     Application -- Inner rendering
     ========================================================== */

  async _renderInner(
    data
  ) {
    const html = `
      <section class="frame-helm-shell">
        ${this.renderMechStatsBar(data)}

        <div class="frame-helm-horizontal-layout">
          <aside class="frame-helm-overview-column">
            ${this.renderUnitPanel(data)}
            ${this.renderBudgetPanel(data)}
          </aside>

          <main class="frame-helm-action-column">
            ${this.renderActionList(data)}
          </main>
        </div>
      </section>
    `;


    return $(
      html
    );
  }


  /* ==========================================================
     Application -- Listener activation
     ========================================================== */

  activateListeners(
    html
  ) {
    super.activateListeners(
      html
    );


    html.find(
      "[data-frame-helm-category]"
    ).on(
      "click",
      event => {
        this.selectedCategory =
          event.currentTarget
            .dataset
            .frameHelmCategory ??
          null;


        this.render(
          false
        );
      }
    );


    html.find(
      "[data-frame-helm-action]"
    ).on(
      "click",
      event => {
        const actionId =
          event.currentTarget
            .dataset
            .frameHelmAction;


        this.onActionSelected(
          actionId
        );
      }
    );


    html.find(
      "[data-frame-helm-movement-mode]"
    ).on(
      "click",
      event => {
        const actionId =
          event.currentTarget
            .dataset
            .frameHelmMovementMode ??
          null;


        this.commitMovementAction(
          actionId
        );
      }
    );


    html.find(
      "[data-frame-helm-quick-action]"
    ).on(
      "click",
      event => {
        this.selectedQuickActionId =
          event.currentTarget
            .dataset
            .frameHelmQuickAction ??
          null;


        this.render(
          false
        );
      }
    );


    html.find(
      "[data-frame-helm-quick-execute]"
    ).on(
      "click",
      event => {
        const actionId =
          event.currentTarget
            .dataset
            .frameHelmActionId;


        const source =
          event.currentTarget
            .dataset
            .frameHelmQuickExecute;


        this.executeQuickAction(
          actionId,
          source ===
            "overcharge"
        );
      }
    );


    html.find(
      "[data-frame-helm-full-action]"
    ).on(
      "click",
      event => {
        this.selectedFullActionId =
          event.currentTarget
            .dataset
            .frameHelmFullAction ??
          null;


        this.render(
          false
        );
      }
    );


    html.find(
      "[data-frame-helm-full-execute]"
    ).on(
      "click",
      event => {
        const actionId =
          event.currentTarget
            .dataset
            .frameHelmFullExecute;


        this.executeFullAction(
          actionId
        );
      }
    );


    html.find(
      "[data-frame-helm-command]"
    ).on(
      "click",
      event => {
        const command =
          event.currentTarget
            .dataset
            .frameHelmCommand;


        this.onCommand(
          command
        );
      }
    );
  }


  /* ==========================================================
     Application -- Turn-plan commands
     ========================================================== */

  beginTurnPlan() {
    const token =
      this.getControlledToken();


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
              token.actor
                ?.system
                ?.speed
            );


          return (
            Number.isFinite(
              numericSpeed
            ) &&
            numericSpeed >=
              0
              ? numericSpeed
              : null
          );
        })()
    });


    this.selectedCategory =
      null;

    this.selectedMovementMode =
      null;

    this.selectedQuickActionId =
      null;

    this.selectedFullActionId =
      null;


    this.render(
      false
    );
  }


  resetTurnPlan() {
    const token =
      this.getControlledToken();

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
        previousState
          ?.context ??
        {}
      ),

      tokenId:
        token?.id ??
        token?.document?.id ??
        previousState
          ?.context
          ?.tokenId ??
        null,

      actorId:
        token?.actor?.id ??
        previousState
          ?.context
          ?.actorId ??
        null,

      sceneId:
        canvas?.scene?.id ??
        previousState
          ?.context
          ?.sceneId ??
        null,

      speed:
        previousState
          ?.speed ??
        null
    });


    this.selectedCategory =
      null;

    this.selectedMovementMode =
      null;

    this.selectedQuickActionId =
      null;

    this.selectedFullActionId =
      null;


    this.render(
      false
    );


    ui.notifications.info(
      "Frame Helm turn plan reset."
    );
  }


  /* ==========================================================
     Application -- Movement commands
     ========================================================== */

  commitMovementAction(
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


      this.selectedMovementMode =
        action.id;


      ui.notifications.info(
        `${action.label} committed for ${committedDistance} space(s).`
      );


      this.render(
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


  /* ==========================================================
     Application -- Full-action execution
     ========================================================== */

  executeFullAction(
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


      this.selectedFullActionId =
        null;


      this.render(
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


  /* ==========================================================
     Application -- Quick-action execution
     ========================================================== */

  executeQuickAction(
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


      this.selectedQuickActionId =
        null;


      this.render(
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


  /* ==========================================================
     Application -- General commands
     ========================================================== */

  onCommand(
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
      this.selectedCategory =
        null;

      this.selectedMovementMode =
        null;

      this.selectedQuickActionId =
        null;

      this.selectedFullActionId =
        null;


      this.render(
        false
      );


      return;
    }


    if (
      command ===
      "quick-back"
    ) {
      if (
        !this.selectedQuickActionId
      ) {
        this.selectedCategory =
          null;


        this.render(
          false
        );


        return;
      }


      const selectedAction =
        registry.get(
          this.selectedQuickActionId
        );


      const parentAction =
        selectedAction?.parentId
          ? registry.get(
              selectedAction.parentId
            )
          : null;


      this.selectedQuickActionId =
        parentAction?.category ===
        "quick"
          ? parentAction.id
          : null;


      this.render(
        false
      );


      return;
    }


    if (
      command ===
      "full-back"
    ) {
      if (
        this.selectedFullActionId
      ) {
        this.selectedFullActionId =
          null;
      } else {
        this.selectedCategory =
          null;
      }


      this.render(
        false
      );


      return;
    }


    if (
      command ===
      "set-speed"
    ) {
      const input =
        this.element.find(
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


        this.render(
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


        this.render(
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
      "reopen-movement"
    ) {
      if (
        !state
      ) {
        return;
      }


      try {
        state.reopenMovement();


        this.render(
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


      this.selectedMovementMode =
        null;


      this.render(
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
      this.beginTurnPlan();


      return;
    }


    if (
      command ===
      "reset-turn"
    ) {
      this.resetTurnPlan();


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


      this.selectedCategory =
        null;

      this.selectedMovementMode =
        null;

      this.selectedQuickActionId =
        null;

      this.selectedFullActionId =
        null;


      this.render(
        false
      );


      ui.notifications.info(
        "Frame Helm turn plan ended."
      );
    }
  }


  /* ==========================================================
     Application -- Generic action selection
     ========================================================== */

  onActionSelected(
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
      this.selectedCategory =
        "quick";

      this.selectedQuickActionId =
        action.id;


      this.render(
        false
      );


      return;
    }


    if (
      action.category ===
      "full"
    ) {
      this.selectedCategory =
        "full";

      this.selectedFullActionId =
        action.id;


      this.render(
        false
      );


      return;
    }


    if (
      action.id ===
      "special.end-turn"
    ) {
      this.onCommand(
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


        this.render(
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
}


/* ============================================================
   Canonical application instance
   ============================================================ */

let frameHelmApplication =
  null;


/* ============================================================
   Application construction
   ============================================================ */

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


function peekFrameHelmApplication() {
  return (
    frameHelmApplication
  );
}


/* ============================================================
   Application visibility
   ============================================================ */

function isFrameHelmApplicationRendered() {
  return Boolean(
    frameHelmApplication
      ?.rendered
  );
}


/* ============================================================
   Application rendering
   ============================================================ */

function renderFrameHelmApplication(
  force = false
) {
  if (
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }


  frameHelmApplication.render(
    Boolean(
      force
    )
  );


  return true;
}


function openFrameHelmApplication() {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    ui.notifications.warn(
      `${MODULE_TITLE} is currently disabled.`
    );


    return null;
  }


  const application =
    getFrameHelmApplication();


  application.render(
    true
  );


  return application;
}


function closeFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    return null;
  }


  return (
    frameHelmApplication.close()
  );
}


/* ============================================================
   Application token resolution
   ============================================================ */

function getDisplayedFrameHelmToken() {
  return (
    frameHelmApplication
      ?.getControlledToken?.() ??
    null
  );
}


function frameHelmApplicationDisplaysActor(
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
    getDisplayedFrameHelmToken()
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


/* ============================================================
   Application-specific Foundry hook handlers
   ============================================================ */

function handleFrameHelmApplicationControlToken() {
  renderFrameHelmApplication(
    false
  );
}


function handleFrameHelmApplicationDeleteToken() {
  renderFrameHelmApplication(
    false
  );
}


/* ============================================================
   Application feature definition
   ============================================================ */

export const frameHelmApplicationUiFeature =
  defineFrameHelmFeature({
    id:
      "ui-application",

    domain:
      "ui.application",

    provides: [
      "ui.application",
      "ui.application.lifecycle",
      "ui.application.rendering",
      "ui.application.token"
    ],

    dependsOn: [
      "actions.registry"
    ],

    optionalDependsOn: [
      "sensors.refresh"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameHelmApplicationRuntime,

      open:
        openFrameHelmApplication,

      close:
        closeFrameHelmApplication,

      render:
        renderFrameHelmApplication
    },

    queries: {
      getApplication:
        getFrameHelmApplication,

      peekApplication:
        peekFrameHelmApplication,

      isRendered:
        isFrameHelmApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameHelmToken,

      displaysActor:
        frameHelmApplicationDisplaysActor,

      runtimeBindings:
        getFrameHelmApplicationRuntimeBindings
    },

    hooks: {
      controlToken:
        handleFrameHelmApplicationControlToken,

      deleteToken:
        handleFrameHelmApplicationDeleteToken
    },

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameHelmApplicationRuntime,

      getApplication:
        getFrameHelmApplication,

      peekApplication:
        peekFrameHelmApplication,

      open:
        openFrameHelmApplication,

      close:
        closeFrameHelmApplication,

      render:
        renderFrameHelmApplication,

      isRendered:
        isFrameHelmApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameHelmToken,

      displaysActor:
        frameHelmApplicationDisplaysActor,

      runtimeBindings:
        getFrameHelmApplicationRuntimeBindings
    },

    metadata: {
      label:
        "Frame Helm Application UI",

      description:
        "Owns the primary Frame Helm Foundry Application, its window lifecycle, rendering surface, and displayed-token identity.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      companionStylesheet:
        "styles/ui-application.css",

      compositionStylesheet:
        "styles/ui-orchestrator.css",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "application-ui-with-explicit-runtime-bindings"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

export {
  configureFrameHelmApplicationRuntime,

  getFrameHelmApplicationRuntimeBindings,

  getFrameHelmApplicationActionRegistry,

  getFrameHelmApplicationTurnState,

  getFrameHelmApplicationTurnStateManager,

  executeFrameHelmApplicationActionRoll,

  getFrameHelmApplicationCombatContext,

  getFrameHelmApplication,

  peekFrameHelmApplication,

  isFrameHelmApplicationRendered,

  renderFrameHelmApplication,

  openFrameHelmApplication,

  closeFrameHelmApplication,

  getDisplayedFrameHelmToken,

  frameHelmApplicationDisplaysActor
};
