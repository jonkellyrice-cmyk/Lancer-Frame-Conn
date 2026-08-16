/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-movement.js
 */


/**
 * ============================================================
 * FRAME CONN UI FEATURE -- MOVEMENT
 * ============================================================
 *
 * ROLE:
 *   Provides the executable presentation adapter between the
 *   Frame Conn Movement domain, authoritative Turn movement state,
 *   and the primary Application UI.
 *
 * PURPOSE:
 *   Give movement-feature.js a dedicated UI-facing representation
 *   without allowing presentation concerns to enter the Movement
 *   gameplay/integration feature.
 *
 *   This module converts authoritative movement state into stable
 *   presentation models which may be consumed by
 *   ui-application.js.
 *
 * RESPONSIBILITIES:
 *   - Resolve the registered Movement feature API.
 *   - Resolve authoritative movement accounting from Turn state.
 *   - Produce movement-budget presentation state.
 *   - Produce standard-movement presentation state.
 *   - Produce Boost-movement presentation state.
 *   - Produce Overcharge Boost presentation state.
 *   - Produce total tracked-movement presentation state.
 *   - Produce excess-movement presentation state.
 *   - Produce movement-ledger presentation state.
 *   - Produce movement-segment presentation entries.
 *   - Produce movement-mode presentation state.
 *   - Produce semantic UI classes for Movement surfaces.
 *   - Produce semantic Movement data attributes.
 *   - Expose Movement UI diagnostics.
 *
 * TRANSITIONAL STATE RELATIONSHIP:
 *
 *   movement-feature.js owns physical movement integration:
 *
 *     - Foundry moveToken interpretation
 *     - movement-path measurement
 *     - elevation interpretation
 *     - movement notifications
 *     - movement-specific Foundry hooks
 *
 *   But canonical movement accounting currently still resides
 *   inside:
 *
 *     scripts/turn-feature.js
 *
 *   Therefore ui-movement.js currently reads:
 *
 *     - Movement integration information through Movement
 *     - movement budget/accounting through Turn state
 *
 *   When movement accounting later migrates fully into
 *   movement-feature.js, this UI feature can change its internal
 *   dependency resolution without changing its public
 *   presentation contract.
 *
 * DOES NOT OWN:
 *   - Physical token movement interpretation.
 *   - Movement-path measurement.
 *   - Elevation movement interpretation.
 *   - Turn-state mutation.
 *   - Movement accounting mutation.
 *   - Automatic Boost rules.
 *   - Overcharge rules.
 *   - Action legality.
 *   - Movement notifications.
 *   - Foundry movement hooks.
 *   - Action registry implementation.
 *   - Application window construction.
 *   - Application instance ownership.
 *   - Application open/close lifecycle.
 *   - CSS declarations.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   turn-feature.js
 *        │
 *        │ transitional movement accounting
 *        │
 *        ├────────────────────┐
 *        │                    │
 *        ▼                    ▼
 *   movement-feature.js   authoritative
 *        │                Turn movement state
 *        │                    │
 *        └─────────┬──────────┘
 *                  ▼
 *           ui-movement.js
 *                  │
 *                  │ presentation models
 *                  ▼
 *           ui-application.js
 *                  │
 *                  │ DOM / Foundry Application rendering
 *                  ▼
 *          Frame Conn window
 *
 * STYLESHEET RELATIONSHIP:
 *
 *   ui-movement.js
 *       │
 *       │ semantic presentation state
 *       ▼
 *   application DOM/classes
 *       ▲
 *       │ selectors
 *       │
 *   ui-movement.css
 *
 *   JavaScript and CSS do not import one another.
 *
 *   They meet at the DOM contract:
 *
 *     - class names
 *     - data attributes
 *     - element structure
 *     - active/complete/excess states
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - ui.movement
 *     - ui.movement.presentation
 *     - ui.movement.budget
 *     - ui.movement.ledger
 *     - ui.movement.segments
 *     - ui.movement.status
 *
 *   Required dependencies:
 *     - movement
 *     - movement.tracking
 *     - turn.state
 *
 *   Optional dependencies:
 *     - movement.measurement
 *     - movement.elevation
 *     - turn.actions
 *     - ui.application
 *     - ui.application.rendering
 *
 * STABILITY CONTRACT:
 *
 *   This module derives presentation only.
 *
 *   It MUST NOT independently mutate Movement or Turn state.
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  defineFrameConnFeature
} from "../../scripts/feature-contract.js";


/* ============================================================
   Movement UI feature identity
   ============================================================ */

const MOVEMENT_UI_FEATURE_ID =
  "ui-movement";


/* ============================================================
   Movement UI runtime bindings
   ============================================================ */

/**
 * Transitional explicit dependency bridge.
 *
 * ui-movement.js should ultimately be able to resolve its required
 * surfaces entirely through the registered feature graph.
 *
 * These bindings remain deliberately narrow while
 * ui-application.js and movement accounting are still being
 * decomposed.
 */
const frameConnMovementUiRuntimeBindings = {
  getMovementApi:
    null,

  getTurnApi:
    null,

  renderApplication:
    null
};


/**
 * Configure transitional Movement UI dependencies.
 */
function configureFrameConnMovementUiRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn Movement UI runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameConnMovementUiRuntimeBindings
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
        `Frame Conn Movement UI received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Conn Movement UI runtime binding "${key}" must be a function or null.`
      );
    }


    frameConnMovementUiRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameConnMovementUiRuntimeBindings()
  );
}


/**
 * Returns binding availability without exposing bound functions.
 */
function getFrameConnMovementUiRuntimeBindings() {
  return Object.freeze({
    movement:
      typeof frameConnMovementUiRuntimeBindings
        .getMovementApi ===
        "function",

    turn:
      typeof frameConnMovementUiRuntimeBindings
        .getTurnApi ===
        "function",

    applicationRendering:
      typeof frameConnMovementUiRuntimeBindings
        .renderApplication ===
        "function"
  });
}


/* ============================================================
   Movement UI dependency accessors
   ============================================================ */

/**
 * Resolve the authoritative Movement feature API.
 */
function getFrameConnMovementUiMovementApi() {
  const movementApi =
    frameConnMovementUiRuntimeBindings
      .getMovementApi?.();


  if (
    !movementApi
  ) {
    throw new Error(
      "Frame Conn Movement UI could not resolve the Movement feature API."
    );
  }


  return movementApi;
}


/**
 * Resolve the authoritative Turn feature API.
 *
 * Movement accounting remains there during the current
 * transitional extraction.
 */
function getFrameConnMovementUiTurnApi() {
  const turnApi =
    frameConnMovementUiRuntimeBindings
      .getTurnApi?.();


  if (
    !turnApi
  ) {
    throw new Error(
      "Frame Conn Movement UI could not resolve the Turn feature API."
    );
  }


  return turnApi;
}


/**
 * Request an Application UI refresh.
 *
 * ui-movement.js does not own application rendering.
 */
function renderFrameConnMovementUiApplication(
  force = false
) {
  return (
    frameConnMovementUiRuntimeBindings
      .renderApplication?.(
        Boolean(
          force
        )
      ) ??
    null
  );
}


/* ============================================================
   Movement UI state resolution
   ============================================================ */

/**
 * Resolve the authoritative current Turn state.
 */
function getFrameConnMovementUiCurrentTurnState() {
  const turnApi =
    getFrameConnMovementUiTurnApi();


  return (
    turnApi.current ??
    turnApi.getCurrent?.() ??
    null
  );
}


/**
 * Resolve a presentation-safe Turn snapshot.
 */
function getFrameConnMovementUiTurnSnapshot() {
  const turnApi =
    getFrameConnMovementUiTurnApi();


  if (
    turnApi.state !==
    undefined
  ) {
    return (
      turnApi.state ??
      null
    );
  }


  if (
    typeof turnApi.snapshot ===
    "function"
  ) {
    return (
      turnApi.snapshot() ??
      null
    );
  }


  return (
    turnApi.current
      ?.snapshot?.() ??
    null
  );
}


/**
 * Resolve the movement state from the authoritative Turn
 * snapshot.
 */
function getFrameConnMovementUiState() {
  const snapshot =
    getFrameConnMovementUiTurnSnapshot();


  return (
    snapshot?.movement ??
    null
  );
}


/* ============================================================
   Movement UI formatting utilities
   ============================================================ */

/**
 * Normalize a numeric value for presentation.
 */
function frameConnMovementUiNumber(
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
 * Normalize a non-negative numeric movement value.
 */
function frameConnMovementUiNonNegativeNumber(
  value,
  fallback = 0
) {
  return (
    Math.max(
      0,
      frameConnMovementUiNumber(
        value,
        fallback
      )
    )
  );
}


/**
 * Convert a nullable value into a stable display string.
 */
function frameConnMovementUiDisplayValue(
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
 * Formats movement-distance values without introducing needless
 * trailing decimal zeroes.
 */
function frameConnMovementUiDistanceLabel(
  value,
  fallback = "--"
) {
  const numeric =
    Number(
      value
    );


  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return fallback;
  }


  if (
    Number.isInteger(
      numeric
    )
  ) {
    return String(
      numeric
    );
  }


  return (
    String(
      Math.round(
        numeric *
        100
      ) / 100
    )
  );
}


/* ============================================================
   Movement UI budget presentation
   ============================================================ */

/**
 * Converts authoritative movement-accounting state into the
 * primary Movement budget presentation model.
 */
function buildFrameConnMovementBudgetPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const movement =
    snapshot?.movement ??
    null;


  if (
    !snapshot ||
    !movement
  ) {
    return Object.freeze({
      active:
        false,

      configured:
        false,

      maximum:
        null,

      spent:
        0,

      remaining:
        null,

      completed:
        false,

      maximumLabel:
        "--",

      spentLabel:
        "0",

      remainingLabel:
        "--",

      state:
        "inactive"
    });
  }


  const maximum =
    movement.maximum ===
      null ||
    movement.maximum ===
      undefined
      ? null
      : frameConnMovementUiNonNegativeNumber(
          movement.maximum
        );


  const spent =
    frameConnMovementUiNonNegativeNumber(
      movement.spent
    );


  const remaining =
    movement.remaining ===
      null ||
    movement.remaining ===
      undefined
      ? null
      : frameConnMovementUiNonNegativeNumber(
          movement.remaining
        );


  const configured =
    maximum !==
    null;


  const active =
    Boolean(
      !snapshot.ended
    );


  const completed =
    Boolean(
      movement.completed
    );


  let state =
    "available";


  if (
    !active
  ) {
    state =
      "ended";
  } else if (
    !configured
  ) {
    state =
      "unconfigured";
  } else if (
    completed ||
    remaining <= 0
  ) {
    state =
      "spent";
  } else if (
    spent > 0
  ) {
    state =
      "partial";
  }


  return Object.freeze({
    active,

    configured,

    maximum,

    spent,

    remaining,

    completed,

    maximumLabel:
      frameConnMovementUiDistanceLabel(
        maximum
      ),

    spentLabel:
      frameConnMovementUiDistanceLabel(
        spent,
        "0"
      ),

    remainingLabel:
      frameConnMovementUiDistanceLabel(
        remaining
      ),

    state
  });
}


/* ============================================================
   Movement UI tracked-pool presentation
   ============================================================ */

/**
 * Builds the accounting representation of standard movement,
 * normal Boost movement, and Overcharge Boost movement.
 */
function buildFrameConnMovementPoolsPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const movement =
    snapshot?.movement ??
    {};


  const maximum =
    movement.maximum ===
      null ||
    movement.maximum ===
      undefined
      ? null
      : frameConnMovementUiNonNegativeNumber(
          movement.maximum
        );


  const standardUsed =
    frameConnMovementUiNonNegativeNumber(
      movement.standardUsed
    );


  const boostUsed =
    frameConnMovementUiNonNegativeNumber(
      movement.boostUsed
    );


  const overchargeBoostUsed =
    frameConnMovementUiNonNegativeNumber(
      movement
        .overchargeBoostUsed
    );


  return Object.freeze({
    maximum,

    standard: Object.freeze({
      used:
        standardUsed,

      maximum,

      usedLabel:
        frameConnMovementUiDistanceLabel(
          standardUsed,
          "0"
        ),

      maximumLabel:
        frameConnMovementUiDistanceLabel(
          maximum
        ),

      active:
        standardUsed > 0,

      full:
        Boolean(
          maximum !==
            null &&
          standardUsed >=
            maximum
        )
    }),

    boost: Object.freeze({
      used:
        boostUsed,

      maximum,

      usedLabel:
        frameConnMovementUiDistanceLabel(
          boostUsed,
          "0"
        ),

      maximumLabel:
        frameConnMovementUiDistanceLabel(
          maximum
        ),

      active:
        boostUsed > 0,

      full:
        Boolean(
          maximum !==
            null &&
          boostUsed >=
            maximum
        )
    }),

    overchargeBoost:
      Object.freeze({
        used:
          overchargeBoostUsed,

        maximum,

        usedLabel:
          frameConnMovementUiDistanceLabel(
            overchargeBoostUsed,
            "0"
          ),

        maximumLabel:
          frameConnMovementUiDistanceLabel(
            maximum
          ),

        active:
          overchargeBoostUsed >
          0,

        full:
          Boolean(
            maximum !==
              null &&
            overchargeBoostUsed >=
              maximum
          )
      })
  });
}


/* ============================================================
   Movement UI tracked-distance presentation
   ============================================================ */

/**
 * Produces total tracked and excess movement presentation state.
 */
function buildFrameConnMovementTrackingPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const movement =
    snapshot?.movement ??
    {};


  const totalTracked =
    frameConnMovementUiNonNegativeNumber(
      movement.totalTracked
    );


  const excess =
    frameConnMovementUiNonNegativeNumber(
      movement.excess
    );


  return Object.freeze({
    totalTracked,

    totalTrackedLabel:
      frameConnMovementUiDistanceLabel(
        totalTracked,
        "0"
      ),

    excess,

    excessLabel:
      frameConnMovementUiDistanceLabel(
        excess,
        "0"
      ),

    hasTrackedMovement:
      totalTracked > 0,

    hasExcess:
      excess > 0,

    state:
      excess > 0
        ? "excess"
        : totalTracked > 0
          ? "tracked"
          : "empty"
  });
}


/* ============================================================
   Movement UI segment presentation
   ============================================================ */

/**
 * Convert one authoritative movement segment into a stable
 * presentation row.
 */
function buildFrameConnMovementSegmentPresentation(
  segment,
  index = 0
) {
  const distance =
    frameConnMovementUiNonNegativeNumber(
      segment?.distance
    );


  const method =
    segment?.method
      ? String(
          segment.method
        )
      : "movement";


  const originElevation =
    segment
      ?.origin
      ?.elevation;


  const destinationElevation =
    segment
      ?.destination
      ?.elevation;


  const hasElevationChange =
    Number.isFinite(
      Number(
        originElevation
      )
    ) &&
    Number.isFinite(
      Number(
        destinationElevation
      )
    ) &&
    Number(
      originElevation
    ) !==
      Number(
        destinationElevation
      );


  const kind =
    method ===
      "elevation" ||
    hasElevationChange
      ? "elevation"
      : "translation";


  return Object.freeze({
    index:
      index + 1,

    indexLabel:
      String(
        index + 1
      ).padStart(
        2,
        "0"
      ),

    distance,

    distanceLabel:
      frameConnMovementUiDistanceLabel(
        distance,
        "0"
      ),

    movementId:
      segment?.movementId ??
      null,

    method,

    kind,

    origin:
      segment?.origin
        ? Object.freeze({
            ...segment.origin
          })
        : null,

    destination:
      segment?.destination
        ? Object.freeze({
            ...segment.destination
          })
        : null,

    timestamp:
      segment?.timestamp ??
      null,

    hasElevationChange,

    classNames: [
      "frame-conn-movement-segment",

      `frame-conn-movement-segment-${kind}`,

      `frame-conn-movement-method-${method}`
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
 * Produces the complete Movement segment presentation list.
 */
function buildFrameConnMovementSegmentsPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const segments =
    Array.isArray(
      snapshot
        ?.movement
        ?.segments
    )
      ? snapshot
          .movement
          .segments
      : [];


  const entries =
    segments.map(
      (
        segment,
        index
      ) =>
        buildFrameConnMovementSegmentPresentation(
          segment,
          index
        )
    );


  const elevationCount =
    entries.filter(
      entry =>
        entry.kind ===
        "elevation"
    ).length;


  return Object.freeze({
    empty:
      entries.length ===
      0,

    count:
      entries.length,

    elevationCount,

    translationCount:
      entries.length -
      elevationCount,

    entries:
      Object.freeze(
        entries
      )
  });
}


/* ============================================================
   Movement UI ledger presentation
   ============================================================ */

/**
 * Produces the movement ledger currently shown by the primary
 * Frame Conn UI.
 */
function buildFrameConnMovementLedgerPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const pools =
    buildFrameConnMovementPoolsPresentation(
      snapshot
    );


  const tracking =
    buildFrameConnMovementTrackingPresentation(
      snapshot
    );


  return Object.freeze({
    standard:
      pools.standard,

    boost:
      pools.boost,

    overchargeBoost:
      pools.overchargeBoost,

    excess:
      Object.freeze({
        value:
          tracking.excess,

        label:
          tracking.excessLabel,

        active:
          tracking.hasExcess,

        state:
          tracking.hasExcess
            ? "excess"
            : "clear"
      }),

    totalTracked:
      Object.freeze({
        value:
          tracking.totalTracked,

        label:
          tracking
            .totalTrackedLabel
      })
  });
}


/* ============================================================
   Movement UI movement-mode presentation
   ============================================================ */

/**
 * Resolve a coarse Movement mode from the most recent movement
 * segment.
 *
 * This is presentation metadata only.
 *
 * Gameplay movement mode selection continues to belong elsewhere.
 */
function buildFrameConnMovementModePresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const segments =
    Array.isArray(
      snapshot
        ?.movement
        ?.segments
    )
      ? snapshot
          .movement
          .segments
      : [];


  const latest =
    segments.at(
      -1
    ) ??
    null;


  const method =
    latest?.method ??
    null;


  let kind =
    "none";


  if (
    method ===
    "elevation"
  ) {
    kind =
      "elevation";
  } else if (
    latest
  ) {
    kind =
      "movement";
  }


  return Object.freeze({
    active:
      Boolean(
        latest
      ),

    method,

    kind,

    label:
      method
        ? String(
            method
          )
        : "NONE"
  });
}


/* ============================================================
   Movement UI status presentation
   ============================================================ */

/**
 * Produces the overall semantic Movement presentation state.
 */
function buildFrameConnMovementStatusPresentation(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const budget =
    buildFrameConnMovementBudgetPresentation(
      snapshot
    );


  const tracking =
    buildFrameConnMovementTrackingPresentation(
      snapshot
    );


  let state =
    budget.state;


  if (
    tracking.hasExcess
  ) {
    state =
      "excess";
  }


  return Object.freeze({
    active:
      Boolean(
        snapshot &&
        !snapshot.ended
      ),

    configured:
      budget.configured,

    completed:
      budget.completed,

    hasTrackedMovement:
      tracking
        .hasTrackedMovement,

    hasExcess:
      tracking.hasExcess,

    state,

    label:
      state
        .replaceAll(
          "-",
          " "
        )
        .toUpperCase()
  });
}


/* ============================================================
   Movement UI semantic classes
   ============================================================ */

/**
 * Produces stable semantic classes for a Movement-owned root
 * element.
 *
 * ui-movement.css may consume these classes without knowing about
 * the underlying Turn state representation.
 */
function buildFrameConnMovementUiClasses(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const budget =
    buildFrameConnMovementBudgetPresentation(
      snapshot
    );


  const tracking =
    buildFrameConnMovementTrackingPresentation(
      snapshot
    );


  const mode =
    buildFrameConnMovementModePresentation(
      snapshot
    );


  return Object.freeze([
    "frame-conn-movement",

    snapshot &&
    !snapshot.ended
      ? "frame-conn-movement-active"
      : "frame-conn-movement-inactive",

    `frame-conn-movement-budget-${budget.state}`,

    `frame-conn-movement-tracking-${tracking.state}`,

    `frame-conn-movement-mode-${mode.kind}`,

    budget.completed
      ? "frame-conn-movement-completed"
      : null,

    tracking.hasExcess
      ? "frame-conn-movement-excess-active"
      : null
  ]
    .filter(
      Boolean
    )
  );
}


/* ============================================================
   Movement UI data attributes
   ============================================================ */

/**
 * Produces semantic data attributes suitable for a Movement-owned
 * DOM root.
 */
function buildFrameConnMovementUiDataAttributes(
  snapshot =
    getFrameConnMovementUiTurnSnapshot()
) {
  const budget =
    buildFrameConnMovementBudgetPresentation(
      snapshot
    );


  const tracking =
    buildFrameConnMovementTrackingPresentation(
      snapshot
    );


  const mode =
    buildFrameConnMovementModePresentation(
      snapshot
    );


  return Object.freeze({
    "data-frame-conn-movement":
      snapshot &&
      !snapshot.ended
        ? "active"
        : "inactive",

    "data-movement-configured":
      budget.configured
        ? "true"
        : "false",

    "data-movement-completed":
      budget.completed
        ? "true"
        : "false",

    "data-movement-budget-state":
      budget.state,

    "data-movement-tracking-state":
      tracking.state,

    "data-movement-excess":
      tracking.hasExcess
        ? "true"
        : "false",

    "data-movement-mode":
      mode.kind,

    "data-movement-method":
      mode.method ??
      "none"
  });
}


/* ============================================================
   Movement UI domain diagnostics
   ============================================================ */

/**
 * Resolve Movement feature diagnostics when available.
 */
function getFrameConnMovementUiDomainDiagnostics() {
  const movementApi =
    getFrameConnMovementUiMovementApi();


  return (
    movementApi
      .diagnostics?.() ??
    null
  );
}


/**
 * Provides presentation-focused diagnostics.
 */
function getFrameConnMovementUiDiagnostics() {
  const snapshot =
    getFrameConnMovementUiTurnSnapshot();


  return Object.freeze({
    runtimeBindings:
      getFrameConnMovementUiRuntimeBindings(),

    movementDomain:
      getFrameConnMovementUiDomainDiagnostics(),

    status:
      buildFrameConnMovementStatusPresentation(
        snapshot
      ),

    budget:
      buildFrameConnMovementBudgetPresentation(
        snapshot
      ),

    tracking:
      buildFrameConnMovementTrackingPresentation(
        snapshot
      ),

    segmentCount:
      Array.isArray(
        snapshot
          ?.movement
          ?.segments
      )
        ? snapshot
            .movement
            .segments
            .length
        : 0
  });
}


/* ============================================================
   Complete Movement UI presentation model
   ============================================================ */

/**
 * Canonical Movement presentation model consumed by application
 * rendering.
 */
function buildFrameConnMovementUiModel() {
  const snapshot =
    getFrameConnMovementUiTurnSnapshot();


  return Object.freeze({
    active:
      Boolean(
        snapshot &&
        !snapshot.ended
      ),

    speed:
      snapshot?.speed ??
      null,

    speedLabel:
      frameConnMovementUiDisplayValue(
        snapshot?.speed
      ),

    budget:
      buildFrameConnMovementBudgetPresentation(
        snapshot
      ),

    pools:
      buildFrameConnMovementPoolsPresentation(
        snapshot
      ),

    tracking:
      buildFrameConnMovementTrackingPresentation(
        snapshot
      ),

    ledger:
      buildFrameConnMovementLedgerPresentation(
        snapshot
      ),

    segments:
      buildFrameConnMovementSegmentsPresentation(
        snapshot
      ),

    mode:
      buildFrameConnMovementModePresentation(
        snapshot
      ),

    status:
      buildFrameConnMovementStatusPresentation(
        snapshot
      ),

    classes:
      buildFrameConnMovementUiClasses(
        snapshot
      ),

    attributes:
      buildFrameConnMovementUiDataAttributes(
        snapshot
      )
  });
}


/* ============================================================
   Movement UI commands
   ============================================================ */

/**
 * Movement UI does not mutate gameplay state.
 *
 * Its only command beyond runtime configuration is an explicit
 * request for the Application UI to re-render.
 */
function refreshFrameConnMovementUi() {
  return (
    renderFrameConnMovementUiApplication(
      false
    )
  );
}


/* ============================================================
   Movement UI feature definition
   ============================================================ */

/**
 * Canonical executable Movement UI feature.
 *
 * This file defines the feature but does not register itself.
 *
 * Executable JavaScript UI package registration remains owned by:
 *
 *   styles/ui-registry.js
 *
 * Application-wide JavaScript feature registration remains owned
 * by:
 *
 *   scripts/feature-registry.js
 *
 * Stylesheet registration remains independently owned by:
 *
 *   styles/ui-registry.css
 */
export const frameConnMovementUiFeature =
  defineFrameConnFeature({
    id:
      MOVEMENT_UI_FEATURE_ID,

    domain:
      "ui.movement",

    provides: [
      "ui.movement",
      "ui.movement.presentation",
      "ui.movement.budget",
      "ui.movement.ledger",
      "ui.movement.segments",
      "ui.movement.status"
    ],

    dependsOn: [
      "movement",
      "movement.tracking",
      "turn.state"
    ],

    optionalDependsOn: [
      "movement.measurement",
      "movement.elevation",
      "turn.actions",
      "ui.application",
      "ui.application.rendering"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameConnMovementUiRuntime,

      refresh:
        refreshFrameConnMovementUi
    },

    queries: {
      currentTurnState:
        getFrameConnMovementUiCurrentTurnState,

      turnSnapshot:
        getFrameConnMovementUiTurnSnapshot,

      movementState:
        getFrameConnMovementUiState,

      model:
        buildFrameConnMovementUiModel,

      budget:
        buildFrameConnMovementBudgetPresentation,

      pools:
        buildFrameConnMovementPoolsPresentation,

      tracking:
        buildFrameConnMovementTrackingPresentation,

      ledger:
        buildFrameConnMovementLedgerPresentation,

      segments:
        buildFrameConnMovementSegmentsPresentation,

      mode:
        buildFrameConnMovementModePresentation,

      status:
        buildFrameConnMovementStatusPresentation,

      classes:
        buildFrameConnMovementUiClasses,

      attributes:
        buildFrameConnMovementUiDataAttributes,

      diagnostics:
        getFrameConnMovementUiDiagnostics,

      runtimeBindings:
        getFrameConnMovementUiRuntimeBindings
    },

    hooks: {},

    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameConnMovementUiRuntime,

      refresh:
        refreshFrameConnMovementUi,

      getCurrentTurnState:
        getFrameConnMovementUiCurrentTurnState,

      getTurnSnapshot:
        getFrameConnMovementUiTurnSnapshot,

      getMovementState:
        getFrameConnMovementUiState,

      getModel:
        buildFrameConnMovementUiModel,

      getBudget:
        buildFrameConnMovementBudgetPresentation,

      getPools:
        buildFrameConnMovementPoolsPresentation,

      getTracking:
        buildFrameConnMovementTrackingPresentation,

      getLedger:
        buildFrameConnMovementLedgerPresentation,

      getSegments:
        buildFrameConnMovementSegmentsPresentation,

      getMode:
        buildFrameConnMovementModePresentation,

      getStatus:
        buildFrameConnMovementStatusPresentation,

      getClasses:
        buildFrameConnMovementUiClasses,

      getAttributes:
        buildFrameConnMovementUiDataAttributes,

      diagnostics:
        getFrameConnMovementUiDiagnostics,

      runtimeBindings:
        getFrameConnMovementUiRuntimeBindings
    },

    metadata: {
      label:
        "Frame Conn Movement UI",

      description:
        "Adapts Movement integration and authoritative Turn movement accounting into presentation models consumed by the Frame Conn Application UI.",

      domainFeature:
        "scripts/movement-feature.js",

      transitionalStateFeature:
        "scripts/turn-feature.js",

      companionStylesheet:
        "styles/ui-movement.css",

      applicationFeature:
        "styles/ui-application.js",

      executableUiRegistry:
        "styles/ui-registry.js",

      javascriptRegistry:
        "scripts/feature-registry.js",

      stylesheetRegistry:
        "styles/ui-registry.css",

      extractionModel:
        "movement-domain-presentation-adapter-with-transitional-turn-accounting",

      mutationPolicy:
        "presentation-only",

      futureMigrationTargets: [
        "resolve movement accounting directly from movement-feature.js after state migration",
        "remove Turn-state dependency when Movement becomes authoritative for movement accounting"
      ]
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

/**
 * Named exports preserve straightforward composition while
 * ui-application.js is progressively converted to consume
 * registered UI feature APIs.
 *
 * New cross-feature consumers should preferably resolve this
 * feature through frameConnFeatureRegistry.
 */
export {
  configureFrameConnMovementUiRuntime,

  getFrameConnMovementUiRuntimeBindings,

  getFrameConnMovementUiMovementApi,

  getFrameConnMovementUiTurnApi,

  renderFrameConnMovementUiApplication,

  getFrameConnMovementUiCurrentTurnState,

  getFrameConnMovementUiTurnSnapshot,

  getFrameConnMovementUiState,

  frameConnMovementUiNumber,

  frameConnMovementUiNonNegativeNumber,

  frameConnMovementUiDisplayValue,

  frameConnMovementUiDistanceLabel,

  buildFrameConnMovementBudgetPresentation,

  buildFrameConnMovementPoolsPresentation,

  buildFrameConnMovementTrackingPresentation,

  buildFrameConnMovementSegmentPresentation,

  buildFrameConnMovementSegmentsPresentation,

  buildFrameConnMovementLedgerPresentation,

  buildFrameConnMovementModePresentation,

  buildFrameConnMovementStatusPresentation,

  buildFrameConnMovementUiClasses,

  buildFrameConnMovementUiDataAttributes,

  getFrameConnMovementUiDomainDiagnostics,

  getFrameConnMovementUiDiagnostics,

  buildFrameConnMovementUiModel,

  refreshFrameConnMovementUi
};