/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/movement-feature.js
 */
/**
 * ============================================================
 * FRAME HELM FEATURE -- MOVEMENT
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's Foundry token-movement interpretation,
 *   movement-path measurement, elevation-movement interpretation,
 *   movement-triggered automatic action notifications, and
 *   movement-specific Foundry hooks.
 *
 * PURPOSE:
 *   Remove physical token-movement and elevation-movement
 *   integration from runtime-orchestrator.js while preserving
 *   existing Frame Helm movement behavior exactly.
 *
 * RESPONSIBILITIES:
 *   - Determine whether a moved token belongs to the active
 *     Frame Helm turn.
 *   - Normalize Foundry movement points.
 *   - Collect movement-path waypoints.
 *   - Resolve direct Foundry movement distance when available.
 *   - Measure token movement paths.
 *   - Normalize scene-distance units into movement spaces.
 *   - Round movement distances for Frame Helm accounting.
 *   - Submit measured movement into authoritative Turn state.
 *   - Notify users when movement automatically commits Boost.
 *   - Notify users when movement automatically spends
 *     Overcharge.
 *   - Notify users when movement exceeds the legal allowance.
 *   - Track token elevation origins.
 *   - Interpret elevation changes as movement.
 *   - Submit elevation movement into authoritative Turn state.
 *   - Declare moveToken, preUpdateToken, and updateToken hooks.
 *
 * TRANSITIONAL DOMAIN RELATIONSHIP:
 *
 *   The canonical movement budget/accounting state still resides
 *   temporarily inside:
 *
 *     scripts/turn-feature.js
 *
 *   Specifically, FrameHelmTurnState currently still owns:
 *
 *     - speed
 *     - movement.maximum
 *     - movement.spent
 *     - movement.remaining
 *     - movement.completed
 *     - movement.totalTracked
 *     - movement.standardUsed
 *     - movement.boostUsed
 *     - movement.overchargeBoostUsed
 *     - movement.excess
 *     - movement.segments
 *     - movement.processedMovementIds
 *
 *   And currently still implements:
 *
 *     - setSpeed()
 *     - spendMovement()
 *     - completeMovement()
 *     - reopenMovement()
 *     - commitMovement()
 *     - refreshMovementFromBoost()
 *     - movementBoostEntries()
 *     - movementBoostCount()
 *     - hasProcessedMovementId()
 *     - rememberMovementId()
 *     - ensureAutomaticMovementBoost()
 *     - recalculateTrackedMovement()
 *     - trackTokenMovement()
 *
 *   This Movement feature consumes those surfaces but does not yet
 *   relocate them.
 *
 *   A later migration may move that accounting/state ownership
 *   from Turn into Movement once the physical movement integration
 *   has been cleanly extracted.
 *
 * DOES NOT OWN:
 *   - Turn lifecycle.
 *   - Combat-turn synchronization.
 *   - Quick/full action budgeting.
 *   - Protocol state.
 *   - Reaction state.
 *   - General committed-action state.
 *   - Action registry implementation.
 *   - Universal action declarations.
 *   - General action execution.
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
 *        ▼
 *   turn-feature.js
 *        │
 *        │ authoritative current Turn state
 *        │ transitional movement accounting
 *        ▼
 *   movement-feature.js
 *        │
 *        ├── token identity matching
 *        ├── movement-path interpretation
 *        ├── movement measurement
 *        ├── elevation interpretation
 *        ├── movement notifications
 *        └── Foundry movement hooks
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 * UI RELATIONSHIP:
 *
 *   Movement-specific executable presentation may live in:
 *
 *     styles/ui-movement.js
 *
 *   Movement-specific presentation styling may live in:
 *
 *     styles/ui-movement.css
 *
 *   This runtime feature does not construct application DOM.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - movement
 *     - movement.tracking
 *     - movement.measurement
 *     - movement.token
 *     - movement.elevation
 *     - movement.notifications
 *
 *   Required dependencies:
 *     - turn.state
 *
 *   Optional dependencies:
 *     - turn.actions
 *     - ui.application.rendering
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership and composition only.
 *
 *   Existing dragged-token movement behavior, path measurement,
 *   automatic Boost handling, elevation accounting, notifications,
 *   and application refresh behavior are preserved.
 */
/* ============================================================
   Imports
   ============================================================ */
import {
  defineFrameHelmFeature
} from "./feature-contract.js";
/* ============================================================
   Movement feature identity
   ============================================================ */
const MODULE_TITLE =
  "Lancer: Frame Helm";
/* ============================================================
   Movement runtime bindings
   ============================================================ */
/**
 * Explicit transitional dependency bridge.
 *
 * Movement requires authoritative Turn state because movement
 * accounting still temporarily resides on FrameHelmTurnState.
 *
 * Movement may also request an Application UI refresh after
 * movement-visible state changes.
 *
 * Neither implementation belongs to this feature.
 */
const frameHelmMovementRuntimeBindings = {
  getTurnState:
    null,
  renderApplication:
    null
};
/**
 * Configures Movement's transitional external dependencies.
 *
 * Unknown keys are rejected so this bridge remains a deliberately
 * narrow composition surface rather than becoming an implicit
 * service container.
 */
function configureFrameHelmMovementRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm Movement runtime bindings must be supplied as an object."
    );
  }
  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmMovementRuntimeBindings
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
        `Frame Helm Movement received unknown runtime binding: ${key}`
      );
    }
    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Movement runtime binding "${key}" must be a function or null.`
      );
    }
    frameHelmMovementRuntimeBindings[
      key
    ] = value;
  }
  return (
    getFrameHelmMovementRuntimeBindings()
  );
}
/**
 * Returns binding availability without exposing bound functions.
 */
function getFrameHelmMovementRuntimeBindings() {
  return Object.freeze({
    turnState:
      typeof frameHelmMovementRuntimeBindings
        .getTurnState ===
        "function",
    applicationRendering:
      typeof frameHelmMovementRuntimeBindings
        .renderApplication ===
        "function"
  });
}
/* ============================================================
   Movement dependency accessors
   ============================================================ */
/**
 * Returns the authoritative current Turn state.
 *
 * Movement does not own that state during this transitional
 * extraction.
 */
function getFrameHelmMovementTurnState() {
  return (
    frameHelmMovementRuntimeBindings
      .getTurnState?.() ??
    null
  );
}
/**
 * Requests an Application UI refresh after visible movement state
 * changes.
 *
 * Movement does not own application rendering.
 */
function renderFrameHelmMovementApplication(
  force = false
) {
  return (
    frameHelmMovementRuntimeBindings
      .renderApplication?.(
        Boolean(
          force
        )
      ) ??
    null
  );
}
/* ============================================================
   Movement token identity
   ============================================================ */
/**
 * Returns whether a TokenDocument belongs to the currently active
 * Frame Helm Turn state.
 *
 * Token identity is preferred.
 *
 * Actor identity is retained as a fallback when the Turn context
 * does not contain a token id.
 */
function frameHelmMovementTokenMatches(
  tokenDocument,
  state =
    getFrameHelmMovementTurnState()
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
/* ============================================================
   Movement point normalization
   ============================================================ */
/**
 * Converts a Foundry movement coordinate into the stable point
 * representation used by Frame Helm movement measurement.
 */
function frameHelmMovementPoint(
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
/* ============================================================
   Movement path collection
   ============================================================ */
/**
 * Collects the useful points exposed by Foundry's movement object.
 *
 * Several possible movement representations are supported because
 * different Foundry movement paths may expose waypoint data under
 * different properties.
 */
function frameHelmCollectMovementPoints(
  movement
) {
  const points =
    [];
  const addPoint =
    point => {
      const normalized =
        frameHelmMovementPoint(
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
/* ============================================================
   Direct movement-distance resolution
   ============================================================ */
/**
 * Attempts to resolve an already-computed movement distance from
 * Foundry before performing our own path measurement.
 */
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
/* ============================================================
   Movement path measurement
   ============================================================ */
/**
 * Measures one Foundry token movement in Frame Helm movement
 * spaces.
 *
 * Resolution order:
 *
 *   1. Prefer an existing Foundry distance/cost value.
 *   2. Attempt canvas.grid.measurePath().
 *   3. Fall back to geometric pixel-distance measurement.
 *
 * Scene distance is normalized into Frame Helm spaces.
 */
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
/* ============================================================
   Movement distance normalization
   ============================================================ */
/**
 * Normalizes a movement distance to two decimal places.
 */
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
/* ============================================================
   Movement notifications
   ============================================================ */
/**
 * Presents notifications resulting from automatic movement action
 * accounting performed by Turn state.
 *
 * Movement owns these notifications because they describe the
 * consequences of physical movement interpretation.
 */
function notifyAutomaticMovementActions(
  result
) {
  for (
    const automaticAction
    of (
      result
        ?.automaticActions ??
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
}
/**
 * Presents an excess-movement warning.
 */
function notifyFrameHelmExcessMovement(
  result,
  {
    tokenWasStopped =
      false
  } = {}
) {
  const excess =
    Number(
      result?.excess
    );
  if (
    !Number.isFinite(
      excess
    ) ||
    excess <= 0
  ) {
    return false;
  }
  const suffix =
    tokenWasStopped
      ? ""
      : " The token was not stopped.";
  ui.notifications.warn(
    `Frame Helm recorded ${excess} excess movement beyond the currently legal movement allowance.${suffix}`
  );
  return true;
}
/* ============================================================
   Movement accounting submission
   ============================================================ */
/**
 * Submits measured movement into the authoritative current Turn
 * state.
 *
 * trackTokenMovement() still belongs to Turn during this
 * transitional extraction.
 */
function trackFrameHelmMeasuredMovement(
  distance,
  options = {}
) {
  const state =
    getFrameHelmMovementTurnState();
  if (
    !state
  ) {
    return {
      tracked:
        false,
      distance:
        0,
      reason:
        "No active Frame Helm turn exists."
    };
  }
  if (
    typeof state
      .trackTokenMovement !==
      "function"
  ) {
    throw new Error(
      "Frame Helm Movement could not resolve Turn movement accounting."
    );
  }
  return (
    state.trackTokenMovement(
      distance,
      options
    )
  );
}
/* ============================================================
   Dragged token movement handling
   ============================================================ */
/**
 * Handles a physical token movement supplied by Foundry.
 */
function handleFrameHelmMoveToken(
  tokenDocument,
  movement
) {
  const state =
    getFrameHelmMovementTurnState();
  if (
    !frameHelmMovementTokenMatches(
      tokenDocument,
      state
    )
  ) {
    return null;
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
    return null;
  }
  try {
    const result =
      trackFrameHelmMeasuredMovement(
        distance,
        {
          movementId:
            movement?.id ??
            null,
          method:
            movement?.method ??
            null,
          origin:
            frameHelmMovementPoint(
              movement?.origin
            ),
          destination:
            frameHelmMovementPoint(
              movement
                ?.destination
            )
        }
      );
    if (
      !result.tracked
    ) {
      return result;
    }
    notifyAutomaticMovementActions(
      result
    );
    notifyFrameHelmExcessMovement(
      result,
      {
        tokenWasStopped:
          false
      }
    );
    renderFrameHelmMovementApplication(
      false
    );
    return result;
  } catch (error) {
    console.error(
      `${MODULE_TITLE} | Could not track token movement.`,
      error
    );
    ui.notifications.warn(
      `Frame Helm could not track this movement: ${error.message}`
    );
    return null;
  }
}
/* ============================================================
   Elevation movement state
   ============================================================ */
/**
 * Stores the previous elevation for TokenDocuments currently
 * undergoing an elevation update.
 *
 * This state belongs to Movement because it exists only to
 * interpret Foundry elevation changes as physical movement.
 */
const frameHelmElevationOrigins =
  new Map();
/* ============================================================
   Elevation token identity
   ============================================================ */
/**
 * Produces a stable map key for elevation-origin tracking.
 */
function frameHelmElevationKey(
  tokenDocument
) {
  return String(
    tokenDocument?.uuid ??
    `${tokenDocument?.parent?.id ?? "scene"}:${tokenDocument?.id ?? "token"}`
  );
}
/* ============================================================
   Elevation origin tracking
   ============================================================ */
/**
 * Captures elevation before Foundry applies an elevation change.
 */
function handleFrameHelmPreUpdateTokenElevation(
  tokenDocument,
  changes
) {
  if (
    !Object.prototype
      .hasOwnProperty.call(
        changes,
        "elevation"
      )
  ) {
    return null;
  }
  frameHelmElevationOrigins.set(
    frameHelmElevationKey(
      tokenDocument
    ),
    Number(
      tokenDocument.elevation
    ) || 0
  );
  return (
    frameHelmElevationOrigins.get(
      frameHelmElevationKey(
        tokenDocument
      )
    )
  );
}
/* ============================================================
   Elevation movement measurement
   ============================================================ */
/**
 * Converts an elevation change from scene-distance units into
 * Frame Helm movement spaces.
 */
function frameHelmMeasureElevationMovement(
  tokenDocument,
  previousElevation,
  nextElevation
) {
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
    sceneDistance >
      0
      ? elevationDistance /
        sceneDistance
      : elevationDistance;
  return (
    frameHelmRoundMovementDistance(
      movementSpaces
    )
  );
}
/* ============================================================
   Elevation movement handling
   ============================================================ */
/**
 * Interprets an applied TokenDocument elevation change as movement
 * for the currently active Frame Helm turn.
 */
function handleFrameHelmUpdateTokenElevation(
  tokenDocument,
  changes
) {
  if (
    !Object.prototype
      .hasOwnProperty.call(
        changes,
        "elevation"
      )
  ) {
    return null;
  }
  const state =
    getFrameHelmMovementTurnState();
  if (
    !frameHelmMovementTokenMatches(
      tokenDocument,
      state
    )
  ) {
    return null;
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
    return null;
  }
  const distance =
    frameHelmMeasureElevationMovement(
      tokenDocument,
      previousElevation,
      nextElevation
    );
  if (
    distance <= 0
  ) {
    return null;
  }
  try {
    const result =
      trackFrameHelmMeasuredMovement(
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
      return result;
    }
    ui.notifications.info(
      `Elevation changed by ${distance} space(s); Frame Helm recorded it as movement.`
    );
    notifyAutomaticMovementActions(
      result
    );
    notifyFrameHelmExcessMovement(
      result,
      {
        tokenWasStopped:
          true
      }
    );
    renderFrameHelmMovementApplication(
      false
    );
    return result;
  } catch (error) {
    console.error(
      `${MODULE_TITLE} | Could not track elevation movement.`,
      error
    );
    ui.notifications.warn(
      `Frame Helm could not track the elevation change: ${error.message}`
    );
    return null;
  }
}
/* ============================================================
   Movement diagnostics
   ============================================================ */
/**
 * Returns a presentation-safe diagnostic representation of the
 * current Movement integration state.
 */
function getFrameHelmMovementDiagnostics() {
  const state =
    getFrameHelmMovementTurnState();
  return Object.freeze({
    runtimeBindings:
      getFrameHelmMovementRuntimeBindings(),
    hasActiveTurn:
      Boolean(
        state &&
        !state.ended
      ),
    activeTokenId:
      state
        ?.context
        ?.tokenId ??
      null,
    activeActorId:
      state
        ?.context
        ?.actorId ??
      null,
    speed:
      state?.speed ??
      null,
    movement:
      state?.movement
        ? {
            maximum:
              state.movement
                .maximum ??
              null,
            spent:
              state.movement
                .spent ??
              0,
            remaining:
              state.movement
                .remaining ??
              null,
            totalTracked:
              state.movement
                .totalTracked ??
              0,
            excess:
              state.movement
                .excess ??
              0
          }
        : null,
    trackedElevationOrigins:
      frameHelmElevationOrigins
        .size
  });
}
/* ============================================================
   Movement feature definition
   ============================================================ */
/**
 * Canonical Movement feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * scripts/feature-registry.js remains the canonical JavaScript
 * feature-composition boundary.
 */
export const frameHelmMovementFeature =
  defineFrameHelmFeature({
    id:
      "movement",
    domain:
      "movement",
    provides: [
      "movement",
      "movement.tracking",
      "movement.measurement",
      "movement.token",
      "movement.elevation",
      "movement.notifications"
    ],
    dependsOn: [
      "turn.state"
    ],
    optionalDependsOn: [
      "turn.actions",
      "ui.application.rendering"
    ],
    state: {
      elevationOrigins:
        frameHelmElevationOrigins
    },
    commands: {
      configureRuntime:
        configureFrameHelmMovementRuntime,
      track:
        trackFrameHelmMeasuredMovement,
      render:
        renderFrameHelmMovementApplication
    },
    queries: {
      tokenMatches:
        frameHelmMovementTokenMatches,
      point:
        frameHelmMovementPoint,
      collectPoints:
        frameHelmCollectMovementPoints,
      numericDistance:
        frameHelmNumericMovementDistance,
      measurePath:
        frameHelmMeasureMovementPath,
      roundDistance:
        frameHelmRoundMovementDistance,
      measureElevation:
        frameHelmMeasureElevationMovement,
      diagnostics:
        getFrameHelmMovementDiagnostics,
      runtimeBindings:
        getFrameHelmMovementRuntimeBindings
    },
    hooks: {
      moveToken:
        handleFrameHelmMoveToken,
      preUpdateToken:
        handleFrameHelmPreUpdateTokenElevation,
      updateToken:
        handleFrameHelmUpdateTokenElevation
    },
    lifecycle: {},
    api: {
      configureRuntime:
        configureFrameHelmMovementRuntime,
      getTurnState:
        getFrameHelmMovementTurnState,
      tokenMatches:
        frameHelmMovementTokenMatches,
      normalizePoint:
        frameHelmMovementPoint,
      collectPoints:
        frameHelmCollectMovementPoints,
      numericDistance:
        frameHelmNumericMovementDistance,
      measurePath:
        frameHelmMeasureMovementPath,
      roundDistance:
        frameHelmRoundMovementDistance,
      track:
        trackFrameHelmMeasuredMovement,
      measureElevation:
        frameHelmMeasureElevationMovement,
      notifyAutomaticActions:
        notifyAutomaticMovementActions,
      notifyExcess:
        notifyFrameHelmExcessMovement,
      render:
        renderFrameHelmMovementApplication,
      diagnostics:
        getFrameHelmMovementDiagnostics,
      runtimeBindings:
        getFrameHelmMovementRuntimeBindings
    },
    metadata: {
      label:
        "Movement",
      description:
        "Owns Frame Helm token-movement interpretation, path measurement, elevation movement, movement notifications, and movement-specific Foundry integration.",
      extractedFrom:
        "scripts/runtime-orchestrator.js",
      turnFeature:
        "scripts/turn-feature.js",
      companionUiModule:
        "styles/ui-movement.js",
      companionStylesheet:
        "styles/ui-movement.css",
      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",
      extractionModel:
        "movement-integration-with-transitional-turn-accounting",
      transitionalOwnership: [
        "movement accounting remains on FrameHelmTurnState",
        "automatic Boost accounting remains on FrameHelmTurnState"
      ],
      futureMigrationTargets: [
        "move movement state from turn-feature.js",
        "move movement accounting methods from FrameHelmTurnState"
      ]
    }
  });
/* ============================================================
   Transitional named exports
   ============================================================ */
/**
 * Named exports preserve a low-risk migration path while the
 * runtime orchestrator is converted to Movement registry access.
 *
 * New cross-feature consumers should preferably resolve Movement
 * through frameHelmFeatureRegistry.
 */
export {
  configureFrameHelmMovementRuntime,
  getFrameHelmMovementRuntimeBindings,
  getFrameHelmMovementTurnState,
  renderFrameHelmMovementApplication,
  frameHelmMovementTokenMatches,
  frameHelmMovementPoint,
  frameHelmCollectMovementPoints,
  frameHelmNumericMovementDistance,
  frameHelmMeasureMovementPath,
  frameHelmRoundMovementDistance,
  notifyAutomaticMovementActions,
  notifyFrameHelmExcessMovement,
  trackFrameHelmMeasuredMovement,
  frameHelmElevationKey,
  frameHelmMeasureElevationMovement,
  getFrameHelmMovementDiagnostics
};