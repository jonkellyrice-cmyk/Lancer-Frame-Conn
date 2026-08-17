/** Canonical DM-facing feature package declaration. Startup remains owned by runtime-orchestrator.js. */

import { FRAME_CONN_SITREP_FEATURES } from "./sitreps/sitreps-feature-package.js";

export const FRAME_CONN_DM_FEATURES = Object.freeze([
  ...FRAME_CONN_SITREP_FEATURES
]);
