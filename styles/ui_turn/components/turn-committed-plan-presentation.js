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
 * Produce the short detail line historically displayed by the
 * Application UI for a committed action.
 */
function frameHelmTurnUiCommittedActionDetail(
  action,
  entry
) {
  if (
    entry?.source ===
    "overcharge"
  ) {
    return "Overcharge quick action";
  }


  if (
    action?.cost ===
    "full"
  ) {
    return "Full action";
  }


  if (
    action?.cost ===
    "quick"
  ) {
    return "Quick action";
  }


  return (
    action?.cost ??
    ""
  );
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

    detail:
      frameHelmTurnUiCommittedActionDetail(
        action,
        entry
      ),

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

    timestamp:
      entry?.timestamp ??
      null,

    executable:
      Boolean(
        entry?.id &&
        entry?.actionId
      ),

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


/* ============================================================
   Turn UI committed-history presentation
   ============================================================ */

/**
 * Convert the history-only Turn records historically displayed in
 * the committed plan into the same canonical presentation shape.
 *
 * These rows describe already-recorded Turn events. They do not
 * receive synthetic committed-action identities and are therefore
 * explicitly non-executable.
 */
function buildFrameHelmTurnCommittedHistoryPresentation(
  event,
  index = 0
) {
  const eventType =
    event?.type ??
    null;


  const actionId =
    event?.data?.actionId ??
    null;


  const action =
    getFrameHelmTurnUiAction(
      actionId
    );


  let kind =
    "other";


  let label =
    action?.label ??
    "Turn Event";


  let description =
    action?.description ??
    "";


  let detail =
    "";


  let icon =
    action?.icon ??
    "fas fa-circle";


  let cost =
    action?.cost ??
    null;


  if (
    eventType ===
      "movement-segment" ||
    eventType ===
      "movement-commit"
  ) {
    kind =
      "movement";

    label =
      action?.label ??
      "Movement";

    detail =
      `${event?.data?.distance ?? 0} space(s) committed`;

    icon =
      action?.icon ??
      "fas fa-shoe-prints";

    cost =
      action?.cost ??
      "movement";
  } else if (
    eventType ===
    "use-protocol"
  ) {
    kind =
      "protocol";

    label =
      action?.label ??
      "Protocol";

    detail =
      "Start-of-turn protocol";

    icon =
      action?.icon ??
      "fas fa-microchip";

    cost =
      action?.cost ??
      "protocol";
  } else if (
    eventType ===
    "overcharge"
  ) {
    kind =
      "overcharge";

    label =
      "Overcharge";

    description =
      "";

    detail =
      `Heat ${event?.data?.heatFormula ?? "?"}`;

    icon =
      "fas fa-temperature-high";

    cost =
      "overcharge";
  }


  return Object.freeze({
    id:
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

    actionId,

    duplicateKey:
      null,

    label,

    description,

    detail,

    icon,

    cost,

    source:
      "history",

    kind,

    timestamp:
      event?.timestamp ??
      null,

    executable:
      false,

    executed:
      false,

    executedAt:
      null,

    executionMetadata: {},

    metadata: {
      eventType,

      ...(
        event?.data ??
        {}
      )
    },

    state:
      "recorded",

    classNames: [
      "frame-helm-plan-entry",
      `frame-helm-plan-${kind}`,
      "frame-helm-plan-recorded"
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
 * Identify history records which belong in the visible committed
 * plan. Other Turn-history entries remain domain telemetry and are
 * intentionally excluded from this presentation surface.
 */
function frameHelmTurnUiIsCommittedPlanHistoryEvent(
  event
) {
  return [
    "movement-segment",
    "movement-commit",
    "use-protocol",
    "overcharge"
  ].includes(
    event?.type
  );
}


/* ============================================================
   Turn UI committed-plan presentation
   ============================================================ */

/**
 * Produces the canonical committed-plan presentation model.
 *
 * The plan combines executable committed actions from usedActions
 * with the history-only movement, Protocol, and Overcharge rows
 * historically displayed by the Application UI, then restores
 * their chronological order before assigning presentation indices.
 */
function buildFrameHelmTurnCommittedPlanPresentation(
  snapshot =
    getFrameHelmTurnUiSnapshot()
) {
  const usedActions =
    Array.isArray(
      snapshot?.usedActions
    )
      ? snapshot.usedActions
      : [];


  const history =
    Array.isArray(
      snapshot?.history
    )
      ? snapshot.history
      : [];


  const orderedEntries = [
    ...usedActions.map(
      (
        entry,
        sequence
      ) => ({
        entryType:
          "action",

        value:
          entry,

        timestamp:
          Number(
            entry?.timestamp
          ) || 0,

        sequence
      })
    ),

    ...history
      .filter(
        frameHelmTurnUiIsCommittedPlanHistoryEvent
      )
      .map(
        (
          event,
          sequence
        ) => ({
          entryType:
            "history",

          value:
            event,

          timestamp:
            Number(
              event?.timestamp
            ) || 0,

          sequence:
            usedActions.length +
            sequence
        })
      )
  ].sort(
    (
      left,
      right
    ) => {
      const timestampDifference =
        left.timestamp -
        right.timestamp;


      if (
        timestampDifference !==
        0
      ) {
        return timestampDifference;
      }


      return (
        left.sequence -
        right.sequence
      );
    }
  );


  const presentationEntries =
    orderedEntries.map(
      (
        orderedEntry,
        index
      ) => {
        if (
          orderedEntry.entryType ===
          "history"
        ) {
          return (
            buildFrameHelmTurnCommittedHistoryPresentation(
              orderedEntry.value,
              index
            )
          );
        }


        return (
          buildFrameHelmTurnCommittedActionPresentation(
            orderedEntry.value,
            index
          )
        );
      }
    );


  const executableEntries =
    presentationEntries.filter(
      entry =>
        entry.executable
    );


  const pendingCount =
    executableEntries.filter(
      entry =>
        !entry.executed
    ).length;


  const executedCount =
    executableEntries.filter(
      entry =>
        entry.executed
    ).length;


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
  frameHelmTurnUiCommittedActionDetail,
  buildFrameHelmTurnCommittedActionPresentation,
  buildFrameHelmTurnCommittedHistoryPresentation,
  frameHelmTurnUiIsCommittedPlanHistoryEvent,
  buildFrameHelmTurnCommittedPlanPresentation
};
