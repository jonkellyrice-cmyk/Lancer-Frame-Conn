/**
 * Extracted by Frame Conn Domain Decomposer from scripts/dm_features/sitreps/legacy-sitrep-module/scripts/elevation-los.js.
 * Structural decomposition only; behavior and public contracts must remain unchanged.
 */

import {
  FEATURE_KEY,
  MODULE_ID,
  finiteNumberOr
} from "./elevation-los-contract.js";

export function wallElevationRange(wallDocument) {
  const data = wallDocument?.getFlag?.(
    MODULE_ID,
    FEATURE_KEY
  ) ?? {};

  return {
    bottom: finiteNumberOr(
      data.bottom,
      Number.NEGATIVE_INFINITY
    ),

    top: finiteNumberOr(
      data.top,
      Number.POSITIVE_INFINITY
    )
  };
}

export function wallHasFiniteElevation(wallDocument) {
  const range = wallElevationRange(wallDocument);

  return (
    Number.isFinite(range.bottom) ||
    Number.isFinite(range.top)
  );
}

export function wallDocumentFromEdge(edge) {
  const candidates = [
    edge?.object?.document,
    edge?.object,
    edge?.wall?.document,
    edge?.wall,
    edge?.document,
    edge
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const documentName =
      candidate.documentName ??
      candidate.constructor?.documentName;

    if (documentName === "Wall") {
      return candidate;
    }
  }

  return null;
}

export function wallBlocksElevation(wallDocument, elevation) {
  if (!wallDocument) return true;

  const { bottom, top } =
    wallElevationRange(wallDocument);

  /*
   * Unconfigured walls remain infinitely tall and behave exactly
   * like ordinary Foundry walls.
   *
   * A wall blocks sight and movement while the token's elevation
   * lies inside its vertical span. The upper boundary is exclusive,
   * so a token at elevation 3 can see and move over a wall whose
   * top is elevation 3.
   */
  return elevation >= bottom && elevation < top;
}
