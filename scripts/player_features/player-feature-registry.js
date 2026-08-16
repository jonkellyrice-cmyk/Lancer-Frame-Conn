/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/player_features/player-feature-registry.js
 */

/**
 * ============================================================
 * FRAME CONN PLAYER FEATURE REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Declares the player-facing and player-initiated Frame Conn
 *   feature package.
 *
 * PURPOSE:
 *   Keep player-facing feature membership separate from reactive
 *   rules feature membership while sharing the application-wide
 *   registry machinery owned by scripts/feature-registry-core.js.
 *
 * OWNS:
 *   - Player feature imports.
 *   - Executable UI package inclusion.
 *   - FRAME_CONN_PLAYER_FEATURES package declaration.
 *
 * DOES NOT OWN:
 *   - Registry mechanics.
 *   - Application-wide registry construction.
 *   - Rules feature membership.
 *   - Cross-package dependency validation.
 *   - Foundry startup orchestration.
 *
 * COMPOSITION:
 *
 *   scripts/feature-registry-core.js
 *                 │
 *                 ├─────────────────────────┐
 *                 ▼                         ▼
 *   player-feature-registry.js   rules-feature-registry.js
 *                 └────────────┬────────────┘
 *                              ▼
 *                  scripts/runtime-orchestrator.js
 */

import {
  frameConnActionsFeature
} from "./feature_actions/actions-feature.js";

import {
  frameConnSensorsFeature
} from "./sensors-feature.js";

import {
  frameConnTurnFeature
} from "./feature_turn/turn-feature.js";

import {
  frameConnMovementFeature
} from "./feature_movement/movement-feature.js";

import {
  frameConnFoundryIntegrationFeature
} from "./foundry-integration-feature.js";

import {
  frameConnActionExecutionFeature
} from "./feature_actions/action-execution-feature.js";

import {
  frameConnLifecycleFeature
} from "./feature_lifecycle/lifecycle-feature.js";

import {
  frameConnTargetingSpatialFeature
} from "./feature_targeting_spatial/targeting-spatial-feature.js";

import {
  frameConnSystemBridgeFeature
} from "./feature_system_bridge/system-bridge-feature.js";

import {
  frameConnSemanticExecutionContextFeature
} from "./feature_semantic_execution_context/semantic-execution-context-feature.js";

import {
  frameConnExecutionTransactionFeature
} from "../../system_bridge/execution_transaction/execution-transaction-feature.js";

import {
  frameConnNativeAdapterFeature
} from "../../system_bridge/native_adapter/native-adapter-feature.js";

import {
  frameConnBraceFeature
} from "./feature_brace/brace-feature.js";

import {
  FRAME_CONN_UI_FEATURES
} from "../../styles/ui-registry.js";

/**
 * Canonical player-facing feature package.
 *
 * This package is intentionally declarative. The application-wide
 * FrameConnFeatureRegistry is created by runtime-orchestrator.js so
 * dependencies may cross freely between player and rules packages.
 */
export const FRAME_CONN_PLAYER_FEATURES =
  Object.freeze([
    frameConnActionsFeature,
    frameConnSensorsFeature,
    frameConnTurnFeature,
    frameConnMovementFeature,
    frameConnFoundryIntegrationFeature,
    frameConnActionExecutionFeature,
    frameConnLifecycleFeature,
    frameConnTargetingSpatialFeature,
    frameConnSystemBridgeFeature,
    frameConnSemanticExecutionContextFeature,
    frameConnExecutionTransactionFeature,
    frameConnNativeAdapterFeature,
    frameConnBraceFeature,
    ...FRAME_CONN_UI_FEATURES
  ]);
