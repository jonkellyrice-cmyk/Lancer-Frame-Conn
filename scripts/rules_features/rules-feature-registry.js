/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/rules_features/rules-feature-registry.js
 */

/**
 * ============================================================
 * FRAME CONN RULES FEATURE REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Declares reactive, non-player-facing Frame Conn rules features.
 *
 * PURPOSE:
 *   Give rules-driven behavior its own package boundary without
 *   duplicating feature registry mechanics or application startup.
 *
 * OWNS:
 *   - Rules feature imports.
 *   - FRAME_CONN_RULES_FEATURES package declaration.
 *
 * DOES NOT OWN:
 *   - Registry mechanics.
 *   - Application-wide registry construction.
 *   - Player feature membership.
 *   - Cross-package dependency validation.
 *   - Foundry startup orchestration.
 *
 * RULE:
 *   Player actions that directly apply or remove a status/condition
 *   remain player features. Shared or reactive status/condition
 *   semantics belong under status_conditions/.
 */

import {
  frameConnStatusOrchestrationFeature
} from "./status_conditions/status-orchestration-feature.js";

/**
 * Canonical rules-driven feature package.
 *
 * Runtime orchestration combines this package with
 * FRAME_CONN_PLAYER_FEATURES in one shared FrameConnFeatureRegistry,
 * allowing required capabilities to cross the player/rules boundary.
 */
export const FRAME_CONN_RULES_FEATURES =
  Object.freeze([
    frameConnStatusOrchestrationFeature
  ]);
