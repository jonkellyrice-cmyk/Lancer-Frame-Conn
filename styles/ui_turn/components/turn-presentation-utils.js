/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui_turn/components/turn-presentation-utils.js
 */

/**
 * ============================================================
 * FRAME CONN UI TURN -- PRESENTATION UTILITIES
 * ============================================================
 *
 * ROLE:
 *   Own small, presentation-only normalization and formatting helpers
 *   used by Turn UI presentation modules.
 *
 * DOES NOT OWN:
 *   - Turn state access.
 *   - Turn mutation.
 *   - Action lookup.
 *   - Committed-plan construction.
 *   - Runtime bindings.
 *   - Application rendering.
 */


/* ============================================================
   Turn UI formatting utilities
   ============================================================ */

/**
 * Normalize a number for presentation.
 */
export function frameConnTurnUiNumber(
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
export function frameConnTurnUiDisplayValue(
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
export function frameConnTurnUiAvailability(
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
