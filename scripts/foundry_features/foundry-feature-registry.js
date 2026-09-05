/** Canonical package declaration for generic Foundry-wide Frame Conn features. */

// TEMPORARY ELEVATION / LOS SUSPENSION (2026-09-04): Frame Conn must not load its own
// Foundry-wide elevation/LOS implementation while another module owns that surface.
// RESTORE EXACTLY: uncomment the import below and the matching registry entry below.
// No elevation_los implementation files were deleted or changed.
// import { frameConnElevationLosFeature } from "./elevation_los/elevation-los-feature.js";

export const FRAME_CONN_FOUNDRY_FEATURES = Object.freeze([
  // TEMPORARILY SUSPENDED; RESTORE EXACTLY by uncommenting the next line.
  // frameConnElevationLosFeature
]);
