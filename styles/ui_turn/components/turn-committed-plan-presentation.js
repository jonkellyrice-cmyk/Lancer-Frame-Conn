/* ============================================================
   Imports -- Turn UI component dependencies
   ============================================================ */

import {
  getFrameHelmTurnUiActionRegistry
} from "./turn-runtime-bindings.js";

import {
  getFrameHelmTurnUiSnapshot
} from "./turn-state-access.js";


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
   Exports
   ============================================================ */

export {
  getFrameHelmTurnUiAction,
  frameHelmTurnUiCommittedActionKind,
  buildFrameHelmTurnCommittedActionPresentation,
  buildFrameHelmTurnCommittedPlanPresentation
};
