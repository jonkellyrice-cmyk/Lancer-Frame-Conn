/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-turn.js
 */

/**
 * ============================================================
 * FRAME HELM UI FEATURE -- TURN
 * ============================================================
 *
 * ROLE:
 *   Provides the executable presentation adapter between the
 *   Frame Helm Turn domain and the primary Application UI.
 *
 * PURPOSE:
 *   Give turn-feature.js a dedicated UI-facing representation
 *   without allowing presentation concerns to enter the Turn
 *   gameplay/domain feature.
 *
 *   This module converts authoritative Turn state into stable
 *   presentation models which may be consumed by
 *   ui-application.js.
 *
 * RESPONSIBILITIES:
 *   - Resolve canonical Turn state through the feature graph.
 *   - Produce a presentation-safe Turn snapshot.
 *   - Produce turn-budget presentation state.
 *   - Produce Protocol presentation state.
 *   - Produce Reaction presentation state.
 *   - Produce Overcharge presentation state.
 *   - Produce committed-plan presentation entries.
 *   - Produce turn-context presentation data.
 *   - Produce semantic UI state/classes for Turn surfaces.
 *   - Expose Turn UI diagnostics.
 *
 * DOES NOT OWN:
 *   - Turn-state mutation.
 *   - Action legality.
 *   - Quick/full action accounting.
 *   - Protocol rules.
 *   - Reaction rules.
 *   - Overcharge rules.
 *   - Committed-action mutation.
 *   - Combat synchronization.
 *   - Movement accounting.
 *   - Action registry implementation.
 *   - Application window construction.
 *   - Application instance ownership.
 *   - Application open/close lifecycle.
 *   - DOM event ownership unrelated to Turn.
 *   - CSS declarations.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   actions-feature.js
 *        │
 *        ▼
 *   turn-feature.js
 *        │
 *        │ authoritative turn state
 *        ▼
 *   ui-turn.js
 *        │
 *        │ presentation models
 *        ▼
 *   ui-application.js
 *        │
 *        │ DOM / Foundry Application rendering
 *        ▼
 *   Frame Helm window
 *
 * STYLESHEET RELATIONSHIP:
 *
 *   ui-turn.js
 *       │
 *       │ semantic presentation state
 *       ▼
 *   application DOM/classes
 *       ▲
 *       │ selectors
 *       │
 *   ui-turn.css
 *
 *   JavaScript and CSS do not import one another.
 *
 *   They meet at the DOM contract:
 *
 *     - class names
 *     - data attributes
 *     - element structure
 *     - disabled/active states
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - ui.turn
 *     - ui.turn.presentation
 *     - ui.turn.budget
 *     - ui.turn.protocol
 *     - ui.turn.reaction
 *     - ui.turn.overcharge
 *     - ui.turn.committed-actions
 *
 *   Required dependencies:
 *     - turn.state
 *     - turn.actions
 *
 *   Optional dependencies:
 *     - actions.registry
 *     - ui.application
 *     - ui.application.rendering
 *
 * STABILITY CONTRACT:
 *
 *   This module derives presentation only.
 *
 *   It MUST NOT independently mutate Turn state.
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  defineFrameHelmFeature
} from "../scripts/feature-contract.js";


/* ============================================================
   UI Turn feature identity
   ============================================================ */

const TURN_UI_FEATURE_ID =
  "ui-turn";


/* ============================================================
   Turn UI runtime bindings
   ============================================================ */

/**
 * Transitional explicit bridge.
 *
 * ui-turn.js should ultimately resolve everything it needs through
 * the registered feature graph.
 *
 * The binding surface remains intentionally narrow while the
 * Application UI itself is still being decomposed.
 */
const frameHelmTurnUiRuntimeBindings = {
  getTurnApi:
    null,

  getActionRegistry:
    null,

  renderApplication:
    null
};


/**
 * Configure transitional Turn UI dependencies.
 */
function configureFrameHelmTurnUiRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm Turn UI runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmTurnUiRuntimeBindings
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
        `Frame Helm Turn UI received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Turn UI runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmTurnUiRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmTurnUiRuntimeBindings()
  );
}


/**
 * Returns binding availability without exposing bound functions.
 */
function getFrameHelmTurnUiRuntimeBindings() {
  return Object.freeze({
    turn:
      typeof frameHelmTurnUiRuntimeBindings
        .getTurnApi ===
        "function",

    actions:
      typeof frameHelmTurnUiRuntimeBindings
        .getActionRegistry ===
        "function",

    applicationRendering:
      typeof frameHelmTurnUiRuntimeBindings
        .renderApplication ===
        "function"
  });
}


/* ============================================================
   Turn UI dependency accessors
   ============================================================ */

/**
 * Resolve the authoritative Turn feature API.
 */
function getFrameHelmTurnUiTurnApi() {
  const turnApi =
    frameHelmTurnUiRuntimeBindings
      .getTurnApi?.();


  if (
    !turnApi
  ) {
    throw new Error(
      "Frame Helm Turn UI could not resolve the Turn feature API."
    );
  }


  return turnApi;
}


/**
 * Resolve the canonical action registry when available.
 *
 * Action metadata is useful for presentation labels/icons but is
 * not required for the underlying Turn state itself.
 */
function getFrameHelmTurnUiActionRegistry() {
  return (
    frameHelmTurnUiRuntimeBindings
      .getActionRegistry?.() ??
    null
  );
}


/**
 * Request an Application UI refresh.
 *
 * ui-turn.js does not own application rendering.
 */
function renderFrameHelmTurnUiApplication(
  force = false
) {
  return (
    frameHelmTurnUiRuntimeBindings
      .renderApplication?.(
        Boolean(
          force
        )
      ) ??
    null
  );
}


/* ============================================================
   Turn UI state resolution
   ============================================================ */

/**
 * Resolve the current authoritative Turn state.
 */
function getFrameHelmTurnUiCurrentState() {
  const turnApi =
    getFrameHelmTurnUiTurnApi();


  return (
    turnApi.current ??
    null
  );
}


/**
 * Resolve a presentation-safe Turn snapshot.
 *
 * Prefer the Turn feature's snapshot surface so callers never
 * depend directly on mutable domain state.
 */
function getFrameHelmTurnUiSnapshot() {
  const turnApi =
    getFrameHelmTurnUiTurnApi();


  if (
    turnApi.state !==
    undefined
  ) {
    return (
      turnApi.state ??
      null
    );
  }


  return (
    turnApi.current
      ?.snapshot?.() ??
    null
  );
}


/* ============================================================
   Turn UI formatting utilities
   ============================================================ */

/**
 * Normalize a number for presentation.
 */
function frameHelmTurnUiNumber(
  value,
  fallback = 0
) {
  const numeric =
    Number(
      value
    );


  return (
    Number.isFinite(
      numeric
    )
      ? numeric
      : fallback
  );
}


/**
 * Convert a nullable value into a stable display string.
 */
function frameHelmTurnUiDisplayValue(
  value,
  fallback = "--"
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }


  return String(
    value
  );
}


/**
 * Produces a semantic availability descriptor.
 */
function frameHelmTurnUiAvailability(
  available,
  {
    availableLabel =
      "AVAILABLE",

    unavailableLabel =
      "SPENT"
  } = {}
) {
  const isAvailable =
    Boolean(
      available
    );


  return Object.freeze({
    available:
      isAvailable,

    label:
      isAvailable
        ? availableLabel
        : unavailableLabel,

    state:
      isAvailable
        ? "available"
        : "spent"
  });
}


/* ============================================================
   Turn UI context presentation
   ============================================================ */

/**
 * Presentation representation of the current combat-turn context.
 */
function buildFrameHelmTurnContextPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const context =
    snapshot?.context ??
    {};


  return Object.freeze({
    active:
      Boolean(
        snapshot &&
        !snapshot.ended
      ),

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
      context.round ??
      null,

    turn:
      context.turn ??
      null,

    roundLabel:
      context.round ===
        null ||
      context.round ===
        undefined
        ? "--"
        : String(
            context.round
          ),

    turnLabel:
      context.turn ===
        null ||
      context.turn ===
        undefined
        ? "--"
        : String(
            context.turn
          )
  });
}


/* ============================================================
   Turn UI action-budget presentation
   ============================================================ */

/**
 * Converts action-budget state into a UI-oriented model.
 */
function buildFrameHelmTurnBudgetPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  if (
    !snapshot
  ) {
    return Object.freeze({
      active:
        false,

      actionMode:
        null,

      quickActionsRemaining:
        0,

      quickActionsMaximum:
        2,

      quickActionsSpent:
        0,

      fullActionAvailable:
        false,

      normalBudgetAvailable:
        false,

      state:
        "inactive"
    });
  }


  const quickRemaining =
    Math.max(
      0,
      frameHelmTurnUiNumber(
        snapshot
          .quickActionsRemaining
      )
    );


  const quickMaximum =
    2;


  const quickSpent =
    Math.max(
      0,
      quickMaximum -
        quickRemaining
    );


  const fullAvailable =
    Boolean(
      snapshot
        .fullActionAvailable
    );


  const active =
    !snapshot.ended;


  let state =
    "available";


  if (
    !active
  ) {
    state =
      "ended";
  } else if (
    snapshot.actionMode ===
      "full"
  ) {
    state =
      "full-spent";
  } else if (
    snapshot.actionMode ===
      "quick"
  ) {
    state =
      quickRemaining > 0
        ? "quick-partial"
        : "quick-spent";
  }


  return Object.freeze({
    active,

    actionMode:
      snapshot.actionMode ??
      null,

    quickActionsRemaining:
      quickRemaining,

    quickActionsMaximum:
      quickMaximum,

    quickActionsSpent:
      quickSpent,

    fullActionAvailable:
      fullAvailable,

    normalBudgetAvailable:
      Boolean(
        active &&
        (
          fullAvailable ||
          quickRemaining > 0
        )
      ),

    state
  });
}


/* ============================================================
   Turn UI Protocol presentation
   ============================================================ */

function buildFrameHelmTurnProtocolPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const protocol =
    snapshot?.protocol ??
    {};


  const available =
    Boolean(
      snapshot &&
      !snapshot.ended &&
      protocol.available &&
      protocol.startOfTurnOpen &&
      !protocol.used
    );


  return Object.freeze({
    available,

    used:
      Boolean(
        protocol.used
      ),

    startOfTurnOpen:
      Boolean(
        protocol
          .startOfTurnOpen
      ),

    state:
      available
        ? "available"
        : protocol.used
          ? "used"
          : "closed",

    label:
      available
        ? "AVAILABLE"
        : protocol.used
          ? "USED"
          : "CLOSED"
  });
}


/* ============================================================
   Turn UI Reaction presentation
   ============================================================ */

function buildFrameHelmTurnReactionPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const reaction =
    snapshot?.reaction ??
    {};


  const available =
    Boolean(
      snapshot &&
      !snapshot.ended &&
      !reaction.usedThisTurn
    );


  return Object.freeze({
    available,

    used:
      Boolean(
        reaction
          .usedThisTurn
      ),

    actionId:
      reaction.actionId ??
      null,

    state:
      available
        ? "available"
        : "used",

    label:
      available
        ? "AVAILABLE"
        : "USED"
  });
}


/* ============================================================
   Turn UI Overcharge presentation
   ============================================================ */

function buildFrameHelmTurnOverchargePresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const overcharge =
    snapshot?.overcharge ??
    {};


  const used =
    Boolean(
      overcharge.used
    );


  const grantedQuickRemaining =
    Math.max(
      0,
      frameHelmTurnUiNumber(
        overcharge
          .quickActionRemaining
      )
    );


  return Object.freeze({
    available:
      Boolean(
        snapshot &&
        !snapshot.ended &&
        !used
      ),

    used,

    quickActionRemaining:
      grantedQuickRemaining,

    heatFormula:
      overcharge
        .heatFormula ??
      null,

    heatLabel:
      frameHelmTurnUiDisplayValue(
        overcharge
          .heatFormula
      ),

    state:
      used
        ? (
            grantedQuickRemaining > 0
              ? "active"
              : "spent"
          )
        : "available"
  });
}


/* ============================================================
   Turn UI action lookup
   ============================================================ */

/**
 * Resolve action metadata for presentation.
 */
function getFrameHelmTurnUiAction(
  actionId
) {
  if (
    !actionId
  ) {
    return null;
  }


  const registry =
    getFrameHelmTurnUiActionRegistry();


  return (
    registry?.get?.(
      actionId
    ) ??
    null
  );
}


/* ============================================================
   Turn UI committed-action presentation
   ============================================================ */

/**
 * Determine the broad semantic kind used to style a committed
 * action.
 */
function frameHelmTurnUiCommittedActionKind(
  action,
  entry
) {
  if (
    entry?.source ===
    "overcharge"
  ) {
    return "overcharge";
  }


  if (
    action?.cost ===
    "movement"
  ) {
    return "movement";
  }


  if (
    action?.cost ===
    "full"
  ) {
    return "full";
  }


  if (
    action?.cost ===
    "quick"
  ) {
    return "quick";
  }


  if (
    action?.cost ===
    "reaction"
  ) {
    return "reaction";
  }


  if (
    action?.cost ===
    "overcharge"
  ) {
    return "overcharge";
  }


  return "other";
}


/**
 * Convert one committed Turn action into a presentation-safe row.
 */
function buildFrameHelmTurnCommittedActionPresentation(
  entry,
  index = 0
) {
  const action =
    getFrameHelmTurnUiAction(
      entry?.actionId
    );


  const kind =
    frameHelmTurnUiCommittedActionKind(
      action,
      entry
    );


  return Object.freeze({
    id:
      entry?.id ??
      null,

    index:
      index + 1,

    indexLabel:
      String(
        index + 1
      ).padStart(
        2,
        "0"
      ),

    actionId:
      entry?.actionId ??
      null,

    duplicateKey:
      entry?.duplicateKey ??
      null,

    label:
      action?.label ??
      entry?.actionId ??
      "Unknown Action",

    description:
      action?.description ??
      "",

    icon:
      action?.icon ??
      "fas fa-circle",

    cost:
      action?.cost ??
      null,

    source:
      entry?.source ??
      "normal",

    kind,

    executed:
      Boolean(
        entry?.executed
      ),

    executedAt:
      entry?.executedAt ??
      null,

    executionMetadata: {
      ...(
        entry
          ?.executionMetadata ??
        {}
      )
    },

    metadata: {
      ...(
        entry
          ?.metadata ??
        {}
      )
    },

    state:
      entry?.executed
        ? "executed"
        : "committed",

    classNames: [
      "frame-helm-plan-entry",

      `frame-helm-plan-${kind}`,

      entry?.executed
        ? "frame-helm-plan-executed"
        : "frame-helm-plan-pending"
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
  });
}


/**
 * Produces the committed-plan presentation model.
 */
function buildFrameHelmTurnCommittedPlanPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const entries =
    Array.isArray(
      snapshot?.usedActions
    )
      ? snapshot.usedActions
      : [];


  const presentationEntries =
    entries.map(
      (
        entry,
        index
      ) =>
        buildFrameHelmTurnCommittedActionPresentation(
          entry,
          index
        )
    );


  const pendingCount =
    presentationEntries.filter(
      entry =>
        !entry.executed
    ).length;


  const executedCount =
    presentationEntries.length -
    pendingCount;


  return Object.freeze({
    empty:
      presentationEntries.length ===
      0,

    count:
      presentationEntries.length,

    pendingCount,

    executedCount,

    entries:
      Object.freeze(
        presentationEntries
      )
  });
}


/* ============================================================
   Turn UI semantic classes
   ============================================================ */

/**
 * Produces stable semantic classes for a Turn root element.
 *
 * ui-turn.css may consume these classes without knowing anything
 * about the internal Turn state representation.
 */
function buildFrameHelmTurnUiClasses(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const budget =
    buildFrameHelmTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameHelmTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameHelmTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameHelmTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze([
    "frame-helm-turn",

    snapshot
      ? "frame-helm-turn-active"
      : "frame-helm-turn-inactive",

    snapshot?.ended
      ? "frame-helm-turn-ended"
      : null,

    `frame-helm-turn-budget-${budget.state}`,

    `frame-helm-turn-protocol-${protocol.state}`,

    `frame-helm-turn-reaction-${reaction.state}`,

    `frame-helm-turn-overcharge-${overcharge.state}`
  ]
    .filter(
      Boolean
    )
  );
}


/* ============================================================
   Turn UI data attributes
   ============================================================ */

/**
 * Produces semantic data attributes suitable for a Turn-owned DOM
 * root.
 *
 * These allow CSS to respond to Turn state without importing or
 * executing JavaScript.
 */
function buildFrameHelmTurnUiDataAttributes(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const budget =
    buildFrameHelmTurnBudgetPresentation(
      snapshot
    );


  const protocol =
    buildFrameHelmTurnProtocolPresentation(
      snapshot
    );


  const reaction =
    buildFrameHelmTurnReactionPresentation(
      snapshot
    );


  const overcharge =
    buildFrameHelmTurnOverchargePresentation(
      snapshot
    );


  return Object.freeze({
    "data-frame-helm-turn":
      snapshot
        ? "active"
        : "inactive",

    "data-turn-ended":
      snapshot?.ended
        ? "true"
        : "false",

    "data-action-mode":
      budget.actionMode ??
      "none",

    "data-budget-state":
      budget.state,

    "data-protocol-state":
      protocol.state,

    "data-reaction-state":
      reaction.state,

    "data-overcharge-state":
      overcharge.state
  });
}


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

/**
 * Canonical executable Turn UI feature.
 *
 * This file defines the feature but does not register itself.
 *
 * JavaScript feature registration remains owned by:
 *
 *   scripts/feature-registry.js
 *
 * Stylesheet registration remains independently owned by:
 *
 *   styles/ui-registry.css
 */
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