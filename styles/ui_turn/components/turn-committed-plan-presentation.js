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
   Turn UI committed-action execution presentation
   ============================================================ */

/**
 * Universal actions which currently commit Turn state without an
 * actor-sheet roll/workflow.
 *
 * This presentation-only mirror exists so the canonical committed
 * plan can decide whether to expose a d20 execution control without
 * importing the Action Execution feature directly across feature
 * boundaries.
 */
const FRAME_HELM_TURN_UI_NO_ROLL_ACTION_IDS =
  Object.freeze(
    new Set([
      "movement.standard",
      "movement.jump",
      "movement.climb",
      "movement.fly",
      "movement.teleport",

      "quick.boost",
      "quick.hide",
      "quick.prepare",
      "quick.shut-down",
      "quick.self-destruct",

      "full.disengage",
      "full.boot-up",
      "full.mount-dismount",

      "special.end-turn"
    ])
  );


/**
 * Determine whether a committed action has an actor-sheet roll or
 * execution workflow available through the current universal-action
 * execution surface.
 */
function frameHelmTurnUiCommittedActionCanRoll(
  action
) {
  if (
    !action?.id
  ) {
    return false;
  }


  return (
    !FRAME_HELM_TURN_UI_NO_ROLL_ACTION_IDS
      .has(
        action.id
      )
  );
}


/**
 * Build the presentation-only execution control contract consumed
 * by the Application UI.
 *
 * The control carries both the committed-entry id and action id so
 * execution can address the exact committed action rather than only
 * the underlying universal-action definition.
 */
function buildFrameHelmTurnCommittedActionExecutionPresentation(
  action,
  entry
) {
  const committedActionId =
    entry?.id ??
    null;

  const actionId =
    entry?.actionId ??
    action?.id ??
    null;

  const executed =
    Boolean(
      entry?.executed
    );

  const executable =
    Boolean(
      committedActionId &&
      actionId
    );

  const canRoll =
    frameHelmTurnUiCommittedActionCanRoll(
      action
    );

  const showExecuteControl =
    Boolean(
      executable &&
      canRoll &&
      !executed
    );


  return Object.freeze({
    committedActionId,

    actionId,

    executable,

    canRoll,

    showExecuteControl,

    requiresTarget:
      Boolean(
        action?.requiresTarget
      ),

    targetType:
      action?.targetType ??
      null,

    control:
      Object.freeze({
        visible:
          showExecuteControl,

        kind:
          "roll",

        icon:
          "fas fa-dice-d20",

        label:
          "Execute",

        committedActionId,

        actionId
      })
  });
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

  const execution =
    buildFrameHelmTurnCommittedActionExecutionPresentation(
      action,
      entry
    );


  return Object.freeze({
    id:
      entry?.id ??
      null,

    committedActionId:
      execution.committedActionId,

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
      execution.executable,

    canRoll:
      execution.canRoll,

    showExecuteControl:
      execution.showExecuteControl,

    requiresTarget:
      execution.requiresTarget,

    targetType:
      execution.targetType,

    executeControl:
      execution.control,

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

    committedActionId:
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

    canRoll:
      false,

    showExecuteControl:
      false,

    requiresTarget:
      false,

    targetType:
      null,

    executeControl:
      Object.freeze({
        visible:
          false,

        kind:
          "roll",

        icon:
          "fas fa-dice-d20",

        label:
          "Execute",

        committedActionId:
          null,

        actionId
      }),

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
  FRAME_HELM_TURN_UI_NO_ROLL_ACTION_IDS,
  getFrameHelmTurnUiAction,
  frameHelmTurnUiCommittedActionCanRoll,
  buildFrameHelmTurnCommittedActionExecutionPresentation,
  frameHelmTurnUiCommittedActionKind,
  frameHelmTurnUiCommittedActionDetail,
  buildFrameHelmTurnCommittedActionPresentation,
  buildFrameHelmTurnCommittedHistoryPresentation,
  frameHelmTurnUiIsCommittedPlanHistoryEvent,
  buildFrameHelmTurnCommittedPlanPresentation
};
