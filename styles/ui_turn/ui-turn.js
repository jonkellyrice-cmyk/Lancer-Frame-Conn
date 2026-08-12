/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/ui-turn.js
 */

/**
 * ============================================================
 * FRAME HELM UI FEATURE -- TURN
 * ============================================================
 *
 * ROLE:
 *   Stable public composition surface for Turn UI presentation.
 *
 * PURPOSE:
 *   Compose the Turn UI component tree, expose the canonical Turn
 *   presentation model, and define the registered ui-turn feature
 *   without retaining implementation details in this file.
 *
 * STABILITY CONTRACT:
 *   - Preserve the ui-turn feature id.
 *   - Preserve existing provided capabilities.
 *   - Preserve existing public API names.
 *   - Preserve transitional named exports.
 *   - Keep Turn-state mutation outside the presentation layer.
 */


/* ============================================================
   Imports -- Feature definition
   ============================================================ */

import {
  defineFrameHelmFeature
} from "../../scripts/feature-contract.js";


/* ============================================================
   Imports -- Runtime bindings
   ============================================================ */

import {
  configureFrameHelmTurnUiRuntime,
  getFrameHelmTurnUiRuntimeBindings,
  getFrameHelmTurnUiTurnApi,
  getFrameHelmTurnUiActionRegistry,
  renderFrameHelmTurnUiApplication
} from "./components/turn-runtime-bindings.js";


/* ============================================================
   Imports -- Turn state access
   ============================================================ */

import {
  getFrameHelmTurnUiCurrentState,
  getFrameHelmTurnUiSnapshot
} from "./components/turn-state-access.js";


/* ============================================================
   Imports -- Status presentation
   ============================================================ */

import {
  buildFrameHelmTurnContextPresentation,
  buildFrameHelmTurnBudgetPresentation,
  buildFrameHelmTurnProtocolPresentation,
  buildFrameHelmTurnReactionPresentation,
  buildFrameHelmTurnOverchargePresentation
} from "./components/turn-status-presentation.js";


/* ============================================================
   Imports -- Committed plan presentation
   ============================================================ */

import {
  buildFrameHelmTurnCommittedActionPresentation,
  buildFrameHelmTurnCommittedPlanPresentation
} from "./components/turn-committed-plan-presentation.js";


/* ============================================================
   Imports -- Semantic DOM presentation
   ============================================================ */

import {
  buildFrameHelmTurnUiClasses,
  buildFrameHelmTurnUiDataAttributes
} from "./components/turn-ui-semantics.js";


/* ============================================================
   UI Turn feature identity
   ============================================================ */

const TURN_UI_FEATURE_ID =
  "ui-turn";


/* ============================================================
   Complete Turn UI presentation model
   ============================================================ */

/**
 * Canonical presentation model consumed by application rendering.
 */
function buildFrameHelmTurnUiModel() {
  const snapshot =
    getFrameHelmTurnUiSnapshot();


  return Object.freeze({
    active:
      Boolean(
        snapshot
      ),

    ended:
      Boolean(
        snapshot?.ended
      ),

    context:
      buildFrameHelmTurnContextPresentation(
        snapshot
      ),

    budget:
      buildFrameHelmTurnBudgetPresentation(
        snapshot
      ),

    protocol:
      buildFrameHelmTurnProtocolPresentation(
        snapshot
      ),

    reaction:
      buildFrameHelmTurnReactionPresentation(
        snapshot
      ),

    overcharge:
      buildFrameHelmTurnOverchargePresentation(
        snapshot
      ),

    committedPlan:
      buildFrameHelmTurnCommittedPlanPresentation(
        snapshot
      ),

    classes:
      buildFrameHelmTurnUiClasses(
        snapshot
      ),

    attributes:
      buildFrameHelmTurnUiDataAttributes(
        snapshot
      )
  });
}


/* ============================================================
   Turn UI commands
   ============================================================ */

/**
 * Turn UI does not mutate gameplay state.
 *
 * Its only command beyond runtime configuration is an explicit
 * presentation refresh request.
 */
function refreshFrameHelmTurnUi() {
  return (
    renderFrameHelmTurnUiApplication(
      false
    )
  );
}


/* ============================================================
   Turn UI feature definition
   ============================================================ */

export const frameHelmTurnUiFeature =
  defineFrameHelmFeature({
    id:
      TURN_UI_FEATURE_ID,

    domain:
      "ui.turn",

    provides: [
      "ui.turn",
      "ui.turn.presentation",
      "ui.turn.budget",
      "ui.turn.protocol",
      "ui.turn.reaction",
      "ui.turn.overcharge",
      "ui.turn.committed-actions"
    ],

    dependsOn: [
      "turn.state",
      "turn.actions"
    ],

    optionalDependsOn: [
      "actions.registry",
      "ui.application",
      "ui.application.rendering"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameHelmTurnUiRuntime,

      refresh:
        refreshFrameHelmTurnUi
    },

    queries: {
      currentState:
        getFrameHelmTurnUiCurrentState,

      snapshot:
        getFrameHelmTurnUiSnapshot,

      model:
        buildFrameHelmTurnUiModel,

      context:
        buildFrameHelmTurnContextPresentation,

      budget:
        buildFrameHelmTurnBudgetPresentation,

      protocol:
        buildFrameHelmTurnProtocolPresentation,

      reaction:
        buildFrameHelmTurnReactionPresentation,

      overcharge:
        buildFrameHelmTurnOverchargePresentation,

      committedPlan:
        buildFrameHelmTurnCommittedPlanPresentation,

      classes:
        buildFrameHelmTurnUiClasses,

      attributes:
        buildFrameHelmTurnUiDataAttributes,

      runtimeBindings:
        getFrameHelmTurnUiRuntimeBindings
    },

    hooks: {},

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameHelmTurnUiRuntime,

      refresh:
        refreshFrameHelmTurnUi,

      getCurrentState:
        getFrameHelmTurnUiCurrentState,

      getSnapshot:
        getFrameHelmTurnUiSnapshot,

      getModel:
        buildFrameHelmTurnUiModel,

      getContext:
        buildFrameHelmTurnContextPresentation,

      getBudget:
        buildFrameHelmTurnBudgetPresentation,

      getProtocol:
        buildFrameHelmTurnProtocolPresentation,

      getReaction:
        buildFrameHelmTurnReactionPresentation,

      getOvercharge:
        buildFrameHelmTurnOverchargePresentation,

      getCommittedPlan:
        buildFrameHelmTurnCommittedPlanPresentation,

      getClasses:
        buildFrameHelmTurnUiClasses,

      getAttributes:
        buildFrameHelmTurnUiDataAttributes,

      runtimeBindings:
        getFrameHelmTurnUiRuntimeBindings
    },

    metadata: {
      label:
        "Frame Helm Turn UI",

      description:
        "Adapts authoritative Turn-domain state into presentation models consumed by the Frame Helm Application UI.",

      domainFeature:
        "scripts/turn-feature.js",

      companionStylesheet:
        "styles/ui-turn.css",

      applicationFeature:
        "styles/ui-application.js",

      javascriptRegistry:
        "scripts/feature-registry.js",

      stylesheetRegistry:
        "styles/ui-registry.css",

      extractionModel:
        "turn-domain-presentation-adapter",

      mutationPolicy:
        "presentation-only"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

export {
  configureFrameHelmTurnUiRuntime,

  getFrameHelmTurnUiRuntimeBindings,

  getFrameHelmTurnUiTurnApi,

  getFrameHelmTurnUiActionRegistry,

  renderFrameHelmTurnUiApplication,

  getFrameHelmTurnUiCurrentState,

  getFrameHelmTurnUiSnapshot,

  buildFrameHelmTurnContextPresentation,

  buildFrameHelmTurnBudgetPresentation,

  buildFrameHelmTurnProtocolPresentation,

  buildFrameHelmTurnReactionPresentation,

  buildFrameHelmTurnOverchargePresentation,

  buildFrameHelmTurnCommittedActionPresentation,

  buildFrameHelmTurnCommittedPlanPresentation,

  buildFrameHelmTurnUiClasses,

  buildFrameHelmTurnUiDataAttributes,

  buildFrameHelmTurnUiModel,

  refreshFrameHelmTurnUi
};
