/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/ui-turn.js
 */

/**
 * ============================================================
 * FRAME CONN UI FEATURE -- TURN
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
  defineFrameConnFeature
} from "../../scripts/player_features/feature-contract.js";


/* ============================================================
   Imports -- Runtime bindings
   ============================================================ */

import {
  configureFrameConnTurnUiRuntime,
  getFrameConnTurnUiRuntimeBindings,
  getFrameConnTurnUiTurnApi,
  getFrameConnTurnUiActionRegistry,
  renderFrameConnTurnUiApplication
} from "./components/turn-runtime-bindings.js";


/* ============================================================
   Imports -- Turn state access
   ============================================================ */

import {
  getFrameConnTurnUiCurrentState,
  getFrameConnTurnUiSnapshot
} from "./components/turn-state-access.js";


/* ============================================================
   Imports -- Status presentation
   ============================================================ */

import {
  buildFrameConnTurnContextPresentation,
  buildFrameConnTurnBudgetPresentation,
  buildFrameConnTurnProtocolPresentation,
  buildFrameConnTurnReactionPresentation,
  buildFrameConnTurnOverchargePresentation
} from "./components/turn-status-presentation.js";


/* ============================================================
   Imports -- Committed plan presentation
   ============================================================ */

import {
  buildFrameConnTurnCommittedActionPresentation,
  buildFrameConnTurnCommittedPlanPresentation
} from "./components/turn-committed-plan-presentation.js";


/* ============================================================
   Imports -- Semantic DOM presentation
   ============================================================ */

import {
  buildFrameConnTurnUiClasses,
  buildFrameConnTurnUiDataAttributes
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
function buildFrameConnTurnUiModel() {
  const snapshot =
    getFrameConnTurnUiSnapshot();


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
      buildFrameConnTurnContextPresentation(
        snapshot
      ),

    budget:
      buildFrameConnTurnBudgetPresentation(
        snapshot
      ),

    protocol:
      buildFrameConnTurnProtocolPresentation(
        snapshot
      ),

    reaction:
      buildFrameConnTurnReactionPresentation(
        snapshot
      ),

    overcharge:
      buildFrameConnTurnOverchargePresentation(
        snapshot
      ),

    committedPlan:
      buildFrameConnTurnCommittedPlanPresentation(
        snapshot
      ),

    classes:
      buildFrameConnTurnUiClasses(
        snapshot
      ),

    attributes:
      buildFrameConnTurnUiDataAttributes(
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
function refreshFrameConnTurnUi() {
  return (
    renderFrameConnTurnUiApplication(
      false
    )
  );
}


/* ============================================================
   Turn UI feature definition
   ============================================================ */

export const frameConnTurnUiFeature =
  defineFrameConnFeature({
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
        configureFrameConnTurnUiRuntime,

      refresh:
        refreshFrameConnTurnUi
    },

    queries: {
      currentState:
        getFrameConnTurnUiCurrentState,

      snapshot:
        getFrameConnTurnUiSnapshot,

      model:
        buildFrameConnTurnUiModel,

      context:
        buildFrameConnTurnContextPresentation,

      budget:
        buildFrameConnTurnBudgetPresentation,

      protocol:
        buildFrameConnTurnProtocolPresentation,

      reaction:
        buildFrameConnTurnReactionPresentation,

      overcharge:
        buildFrameConnTurnOverchargePresentation,

      committedPlan:
        buildFrameConnTurnCommittedPlanPresentation,

      classes:
        buildFrameConnTurnUiClasses,

      attributes:
        buildFrameConnTurnUiDataAttributes,

      runtimeBindings:
        getFrameConnTurnUiRuntimeBindings
    },

    hooks: {},

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameConnTurnUiRuntime,

      refresh:
        refreshFrameConnTurnUi,

      getCurrentState:
        getFrameConnTurnUiCurrentState,

      getSnapshot:
        getFrameConnTurnUiSnapshot,

      getModel:
        buildFrameConnTurnUiModel,

      getContext:
        buildFrameConnTurnContextPresentation,

      getBudget:
        buildFrameConnTurnBudgetPresentation,

      getProtocol:
        buildFrameConnTurnProtocolPresentation,

      getReaction:
        buildFrameConnTurnReactionPresentation,

      getOvercharge:
        buildFrameConnTurnOverchargePresentation,

      getCommittedPlan:
        buildFrameConnTurnCommittedPlanPresentation,

      getClasses:
        buildFrameConnTurnUiClasses,

      getAttributes:
        buildFrameConnTurnUiDataAttributes,

      runtimeBindings:
        getFrameConnTurnUiRuntimeBindings
    },

    metadata: {
      label:
        "Frame Conn Turn UI",

      description:
        "Adapts authoritative Turn-domain state into presentation models consumed by the Frame Conn Application UI.",

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
  configureFrameConnTurnUiRuntime,

  getFrameConnTurnUiRuntimeBindings,

  getFrameConnTurnUiTurnApi,

  getFrameConnTurnUiActionRegistry,

  renderFrameConnTurnUiApplication,

  getFrameConnTurnUiCurrentState,

  getFrameConnTurnUiSnapshot,

  buildFrameConnTurnContextPresentation,

  buildFrameConnTurnBudgetPresentation,

  buildFrameConnTurnProtocolPresentation,

  buildFrameConnTurnReactionPresentation,

  buildFrameConnTurnOverchargePresentation,

  buildFrameConnTurnCommittedActionPresentation,

  buildFrameConnTurnCommittedPlanPresentation,

  buildFrameConnTurnUiClasses,

  buildFrameConnTurnUiDataAttributes,

  buildFrameConnTurnUiModel,

  refreshFrameConnTurnUi
};
