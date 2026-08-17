/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_application/ui-application.js
 */

/**
 * ============================================================
 * FRAME CONN UI FEATURE -- APPLICATION
 * ============================================================
 *
 * ROLE:
 *   Stable public composition surface for Frame Conn's primary
 *   Foundry Application UI and application-window lifecycle.
 *
 * PURPOSE:
 *   Keep the application feature's public surface stable while
 *   delegating implementation responsibilities to focused
 *   component modules under styles/ui_application/components/.
 *
 * STABILITY CONTRACT:
 *   - Preserve the ui-application feature id.
 *   - Preserve existing provided capabilities.
 *   - Preserve existing public API names.
 *   - Preserve transitional named exports.
 *   - Preserve FrameConnApplication as the stable Application class.
 */


/* ============================================================
   Imports -- Feature definition
   ============================================================ */

import {
  defineFrameConnFeature
} from "../../scripts/feature-contract.js";


/* ============================================================
   Imports -- Runtime bindings
   ============================================================ */

import {
  configureFrameConnApplicationRuntime,
  getFrameConnApplicationRuntimeBindings,
  getFrameConnApplicationActionRegistry,
  getFrameConnApplicationTurnState,
  getFrameConnApplicationTurnStateManager,
  executeFrameConnApplicationActionRoll
} from "./components/application-runtime-bindings.js";


/* ============================================================
   Imports -- Combat context
   ============================================================ */

import {
  getFrameConnApplicationCombatContext
} from "./components/application-combat-context.js";


/* ============================================================
   Imports -- Telemetry
   ============================================================ */

import {
  defaultManualStats,
  manualStatsKey,
  getManualStats,
  updateManualStat,
  synchronizeTurnSpeed,
  renderMechStatsBar
} from "./components/application-telemetry.js";


/* ============================================================
   Imports -- View model
   ============================================================ */

import {
  getControlledToken,
  getTurnStateForDisplay,
  actionAvailability,
  actionViewModel,
  categoryViewModel,
  getApplicationViewData
} from "./components/application-view-model.js";


/* ============================================================
   Imports -- Canonical committed-plan presentation
   ============================================================ */

import {
  buildFrameConnTurnCommittedPlanPresentation
} from "../ui_turn/ui-turn.js";


/* ============================================================
   Imports -- Presentation components
   ============================================================ */

import {
  renderCommittedPlan
} from "./components/application-committed-plan.js";

import {
  renderBudgetPanel
} from "./components/application-budget-panel.js";

import {
  renderUnitPanel
} from "./components/application-unit-panel.js";

import {
  renderCategoryMenu,
  renderGenericCategoryPanel
} from "./components/application-category-panel.js";

import {
  quickActionChildren,
  quickActionBreadcrumb,
  renderQuickActionBudget,
  canAutomaticallyOvercharge,
  renderQuickActionChoice,
  renderQuickActionExecution,
  renderQuickActionPanel
} from "./components/application-quick-actions.js";

import {
  renderFullActionBudget,
  renderFullActionChoice,
  renderFullActionRequirements,
  renderFullActionExecution,
  renderFullActionPanel
} from "./components/application-full-actions.js";

import {
  renderMovementPanel
} from "./components/application-movement.js";

import {
  renderActionList,
  renderApplicationInnerElement
} from "./components/application-action-surface.js";


/* ============================================================
   Imports -- Interaction components
   ============================================================ */

import {
  activateFrameConnApplicationListeners
} from "./components/application-listeners.js";

import {
  getFrameConnPresentationMode,
  setFrameConnPresentationModeValue,
  renderFrameConnSidebarPresentation,
  closeFrameConnSidebarPresentation,
  isFrameConnSidebarPresentationActive,
  handleFrameConnSidebarRender
} from "./components/application-sidebar-presentation.js";

import {
  ensureTurnPlan,
  beginTurnPlan,
  resetTurnPlan,
  commitMovementAction,
  executeFullAction,
  executeQuickAction,
  executeCommittedAction,
  onCommand,
  onActionSelected
} from "./components/application-turn-commands.js";


/* ============================================================
   Imports -- Application lifecycle
   ============================================================ */

import {
  configureFrameConnApplicationLifecycle,
  getFrameConnApplication,
  peekFrameConnApplication,
  isFrameConnApplicationRendered,
  renderFrameConnApplication,
  openFrameConnApplication,
  closeFrameConnApplication,
  getDisplayedFrameConnToken,
  frameConnApplicationDisplaysActor,
  handleFrameConnApplicationControlToken,
  handleFrameConnApplicationDeleteToken,
  handleFrameConnApplicationUpdateActor
} from "./components/application-lifecycle.js";


/* ============================================================
   Application feature identity
   ============================================================ */

const MODULE_ID =
  "lancer-frame-conn";

const MODULE_TITLE =
  "Frame Conn";


async function setFrameConnApplicationPresentationMode(
  mode
) {
  const application =
    peekFrameConnApplication();

  const wasOpen =
    Boolean(
      application
        ?.isFrameConnPresentationRendered?.()
    );

  if (wasOpen) {
    await application.close();
  }

  const normalizedMode =
    setFrameConnPresentationModeValue(
      mode
    );

  if (wasOpen) {
    application.render(
      true
    );
  }

  return normalizedMode;
}


/* ============================================================
   Frame Conn Application
   ============================================================ */

export class FrameConnApplication
  extends Application {

  static get defaultOptions() {
    return foundry.utils.mergeObject(
      super.defaultOptions,
      {
        id:
          "lancer-frame-conn",

        title:
          MODULE_TITLE,

        classes: [
          "lancer-frame-conn"
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

    this.frameConnPresentationElement =
      null;
  }


  render(
    force = false,
    options = {}
  ) {
    if (
      getFrameConnPresentationMode() ===
      "sidebar"
    ) {
      void renderFrameConnSidebarPresentation(
        this,
        {
          activate:
            Boolean(force) ||
            isFrameConnSidebarPresentationActive()
        }
      );

      return this;
    }

    return super.render(
      force,
      options
    );
  }


  close(
    options = {}
  ) {
    if (
      getFrameConnPresentationMode() ===
      "sidebar"
    ) {
      return closeFrameConnSidebarPresentation(
        this
      );
    }

    return super.close(
      options
    );
  }


  isFrameConnPresentationRendered() {
    return Boolean(
      this.rendered ||
      isFrameConnSidebarPresentationActive()
    );
  }


  getFrameConnInteractionElement() {
    return (
      this.frameConnPresentationElement ??
      this.element
    );
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
          "frame-conn-minimize"
      );

    if (
      !hasMinimizeButton
    ) {
      buttons.unshift({
        label:
          "Minimize",

        class:
          "frame-conn-minimize",

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
     Application -- Telemetry delegation
     ========================================================== */

  defaultManualStats() {
    return defaultManualStats();
  }


  manualStatsKey(
    token
  ) {
    return manualStatsKey(
      token
    );
  }


  getManualStats(
    token
  ) {
    return getManualStats(
      this,
      token
    );
  }


  updateManualStat(
    token,
    statName,
    value
  ) {
    return updateManualStat(
      this,
      token,
      statName,
      value
    );
  }


  synchronizeTurnSpeed(
    token =
      this.getControlledToken()
  ) {
    return synchronizeTurnSpeed(
      this,
      token
    );
  }


  /* ==========================================================
     Application -- View-model delegation
     ========================================================== */

  getControlledToken() {
    return getControlledToken();
  }


  getTurnStateForDisplay() {
    return getTurnStateForDisplay();
  }


  actionAvailability(
    action,
    turnState
  ) {
    return actionAvailability(
      action,
      turnState
    );
  }


  actionViewModel(
    action,
    turnState
  ) {
    return actionViewModel(
      action,
      turnState
    );
  }


  categoryViewModel(
    category,
    turnState
  ) {
    return categoryViewModel(
      category,
      turnState
    );
  }


  async getData() {
    const data =
      getApplicationViewData(
        this,
        MODULE_TITLE
      );

    return {
      ...data,

      committedPlan:
        buildFrameConnTurnCommittedPlanPresentation()
    };
  }


  /* ==========================================================
     Application -- Presentation delegation
     ========================================================== */

  renderMechStatsBar(
    data
  ) {
    return renderMechStatsBar(
      data
    );
  }


  renderUnitPanel(
    data
  ) {
    return renderUnitPanel(
      data
    );
  }


  renderCommittedPlan(
    committedPlan
  ) {
    return renderCommittedPlan(
      committedPlan
    );
  }


  renderBudgetPanel(
    data
  ) {
    return renderBudgetPanel(
      data,
      data?.committedPlan
    );
  }


  renderCategoryMenu(
    data
  ) {
    return renderCategoryMenu(
      data
    );
  }


  renderGenericCategoryPanel(
    category
  ) {
    return renderGenericCategoryPanel(
      category
    );
  }


  quickActionChildren(
    actionId
  ) {
    return quickActionChildren(
      actionId
    );
  }


  quickActionBreadcrumb(
    action
  ) {
    return quickActionBreadcrumb(
      action
    );
  }


  renderQuickActionBudget(
    state
  ) {
    return renderQuickActionBudget(
      state
    );
  }


  canAutomaticallyOvercharge(
    action,
    state
  ) {
    return canAutomaticallyOvercharge(
      action,
      state
    );
  }


  renderQuickActionChoice(
    action,
    state
  ) {
    return renderQuickActionChoice(
      action,
      state
    );
  }


  renderQuickActionExecution(
    action,
    state
  ) {
    return renderQuickActionExecution(
      action,
      state
    );
  }


  renderQuickActionPanel(
    data
  ) {
    return renderQuickActionPanel(
      this,
      data
    );
  }


  renderFullActionBudget(
    state
  ) {
    return renderFullActionBudget(
      state
    );
  }


  renderFullActionChoice(
    action,
    state
  ) {
    return renderFullActionChoice(
      action,
      state
    );
  }


  renderFullActionRequirements(
    action
  ) {
    return renderFullActionRequirements(
      action
    );
  }


  renderFullActionExecution(
    action,
    state
  ) {
    return renderFullActionExecution(
      action,
      state
    );
  }


  renderFullActionPanel(
    data
  ) {
    return renderFullActionPanel(
      this,
      data
    );
  }


  renderMovementPanel(
    data
  ) {
    return renderMovementPanel(
      this,
      data
    );
  }


  renderActionList(
    data
  ) {
    return renderActionList(
      this,
      data
    );
  }


  async _renderInner(
    data
  ) {
    return renderApplicationInnerElement(
      this,
      data
    );
  }


  /* ==========================================================
     Application -- Listener delegation
     ========================================================== */

  activateListeners(
    html
  ) {
    super.activateListeners(
      html
    );

    activateFrameConnApplicationListeners(
      this,
      html
    );
  }


  /* ==========================================================
     Application -- Turn command delegation
     ========================================================== */

  ensureTurnPlan() {
    return ensureTurnPlan(
      this
    );
  }


  beginTurnPlan() {
    return beginTurnPlan(
      this
    );
  }


  resetTurnPlan() {
    return resetTurnPlan(
      this
    );
  }


  commitMovementAction(
    actionId
  ) {
    return commitMovementAction(
      this,
      actionId
    );
  }


  executeFullAction(
    actionId
  ) {
    return executeFullAction(
      this,
      actionId
    );
  }


  executeQuickAction(
    actionId,
    useOvercharge = false
  ) {
    return executeQuickAction(
      this,
      actionId,
      useOvercharge
    );
  }


  executeCommittedAction(
    committedActionId,
    actionId = null
  ) {
    return executeCommittedAction(
      this,
      committedActionId,
      actionId
    );
  }


  onCommand(
    command
  ) {
    return onCommand(
      this,
      command
    );
  }


  onActionSelected(
    actionId
  ) {
    return onActionSelected(
      this,
      actionId
    );
  }
}


/* ============================================================
   Application lifecycle composition
   ============================================================ */

configureFrameConnApplicationLifecycle({
  createApplication:
    () =>
      new FrameConnApplication(),

  moduleId:
    MODULE_ID,

  moduleTitle:
    MODULE_TITLE
});


/* ============================================================
   Application feature definition
   ============================================================ */

export const frameConnApplicationUiFeature =
  defineFrameConnFeature({
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
        configureFrameConnApplicationRuntime,

      open:
        openFrameConnApplication,

      close:
        closeFrameConnApplication,

      render:
        renderFrameConnApplication
    },

    queries: {
      getApplication:
        getFrameConnApplication,

      peekApplication:
        peekFrameConnApplication,

      isRendered:
        isFrameConnApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameConnToken,

      displaysActor:
        frameConnApplicationDisplaysActor,

      presentationMode:
        getFrameConnPresentationMode,

      runtimeBindings:
        getFrameConnApplicationRuntimeBindings
    },

    hooks: {
      controlToken:
        handleFrameConnApplicationControlToken,

      deleteToken:
        handleFrameConnApplicationDeleteToken,

      updateActor:
        handleFrameConnApplicationUpdateActor,

      renderApplicationV2:
        handleFrameConnSidebarRender
    },

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameConnApplicationRuntime,

      getApplication:
        getFrameConnApplication,

      peekApplication:
        peekFrameConnApplication,

      open:
        openFrameConnApplication,

      close:
        closeFrameConnApplication,

      render:
        renderFrameConnApplication,

      isRendered:
        isFrameConnApplicationRendered,

      getDisplayedToken:
        getDisplayedFrameConnToken,

      displaysActor:
        frameConnApplicationDisplaysActor,

      setPresentationMode:
        setFrameConnApplicationPresentationMode,

      getPresentationMode:
        getFrameConnPresentationMode,

      runtimeBindings:
        getFrameConnApplicationRuntimeBindings
    },

    metadata: {
      label:
        "Frame Conn Application UI",

      description:
        "Owns the primary Frame Conn Foundry Application, its window lifecycle, rendering surface, and displayed-token identity.",

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
  configureFrameConnApplicationRuntime,

  getFrameConnApplicationRuntimeBindings,

  getFrameConnApplicationActionRegistry,

  getFrameConnApplicationTurnState,

  getFrameConnApplicationTurnStateManager,

  executeFrameConnApplicationActionRoll,

  getFrameConnApplicationCombatContext,

  getFrameConnApplication,

  peekFrameConnApplication,

  isFrameConnApplicationRendered,

  renderFrameConnApplication,

  openFrameConnApplication,

  closeFrameConnApplication,

  getDisplayedFrameConnToken,

  frameConnApplicationDisplaysActor
};
