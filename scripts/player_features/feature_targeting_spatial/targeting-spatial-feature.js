/* ============================================================
   FILE PATH / NAME
   ============================================================ */
/**
 * scripts/feature_targeting_spatial/targeting-spatial-feature.js
 */

/**
 * @file
 * @path scripts/feature_targeting_spatial/targeting-spatial-feature.js
 * @module targeting-spatial-feature
 * @layer frame-conn-runtime-feature
 * @responsibility expose-targeting-spatial-service-through-the-canonical-frame-conn-feature-contract
 * @public-boundary true
 * @side-effects execution-transaction-hook-registration-through-feature-lifecycle
 *
 * ARCHITECTURAL ROLE:
 *
 * targeting-spatial_service/*
 *      ↓
 * targeting-spatial-service.js
 *      ↓
 * targeting-spatial-feature.js
 *      ↓
 * feature-registry.js
 *      ↓
 * runtime-orchestrator.js
 *
 * THIS FILE OWNS:
 * - canonical Frame Conn Targeting/Spatial feature definition
 * - targeting/spatial capability declaration
 * - narrow runtime adapter configuration boundary
 * - feature-lifecycle activation/deactivation of execution transaction hooks
 * - public registry-facing targeting/spatial API
 *
 * THIS FILE DOES NOT OWN:
 * - targeting/spatial contracts
 * - Foundry/Lancer geometry implementation
 * - target acquisition implementation
 * - targeting legality rules
 * - execution transaction sequencing
 * - system bridge composition
 * - actor-owned feature discovery
 * - application startup orchestration
 *
 * EDIT CONTRACT:
 * - keep this file a thin feature wrapper
 * - do not duplicate targeting_spatial_service behavior here
 * - do not import sibling runtime features directly
 * - runtime-orchestrator supplies external adapters through configureRuntime
 * - feature-registry.js remains the registration boundary
 */

/* ============================================================
   IMPORTS
   ============================================================ */

import {
  defineFrameConnFeature
} from "../feature-contract.js";

import * as targetingSpatialRuntime from
  "../../../system_bridge/targeting-spatial_service/targeting-spatial-service.js";

/* ============================================================
   RUNTIME CONFIGURATION
   ============================================================ */

/**
 * Targeting/Spatial owns no Foundry/Lancer geometry or selection UI.
 * Those authorities are supplied at application composition time.
 */
function configureFrameConnTargetingSpatialRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !== "object" ||
    Array.isArray(bindings)
  ) {
    throw new TypeError(
      "Frame Conn Targeting/Spatial runtime bindings must be supplied as an object."
    );
  }

  const allowedKeys =
    new Set([
      "queryAdapter",
      "acquisitionAdapter",
      "augmentationResolver"
    ]);

  for (const key of Object.keys(bindings)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `Frame Conn Targeting/Spatial received unknown runtime binding: ${key}`
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "queryAdapter"
    )
  ) {
    targetingSpatialRuntime
      .setTargetingSpatialQueryAdapter(
        bindings.queryAdapter
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "acquisitionAdapter"
    )
  ) {
    targetingSpatialRuntime
      .setTargetingAcquisitionAdapter(
        bindings.acquisitionAdapter
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "augmentationResolver"
    )
  ) {
    targetingSpatialRuntime
      .setTargetingAugmentationResolver(
        bindings.augmentationResolver
      );
  }

  return getFrameConnTargetingSpatialRuntimeBindings();
}

/**
 * Returns composition status without exposing adapter implementations.
 */
function getFrameConnTargetingSpatialRuntimeBindings() {
  return Object.freeze({
    queryAdapter:
      targetingSpatialRuntime
        .hasTargetingSpatialQueryAdapter(),

    acquisitionAdapter:
      targetingSpatialRuntime
        .hasTargetingAcquisitionAdapter(),

    augmentationResolver:
      typeof targetingSpatialRuntime
        .getTargetingAugmentationResolver() ===
        "function",

    transactionHooks:
      targetingSpatialRuntime
        .areTargetingSpatialTransactionHooksRegistered()
  });
}

/* ============================================================
   FEATURE LIFECYCLE
   ============================================================ */

/**
 * Transaction integration is activated only when the canonical feature
 * registry initializes this feature.
 */
function initializeFrameConnTargetingSpatialFeature() {
  return targetingSpatialRuntime
    .registerTargetingSpatialTransactionHooks();
}

/**
 * Transaction hook teardown belongs to feature shutdown.
 */
function shutdownFrameConnTargetingSpatialFeature() {
  return targetingSpatialRuntime
    .unregisterTargetingSpatialTransactionHooks();
}

/* ============================================================
   FEATURE DIAGNOSTICS
   ============================================================ */

function getFrameConnTargetingSpatialDiagnostics() {
  return Object.freeze({
    runtimeBindings:
      getFrameConnTargetingSpatialRuntimeBindings(),

    service:
      targetingSpatialRuntime
        .getTargetingSpatialServiceDiagnostics()
  });
}

/* ============================================================
   FEATURE DEFINITION
   ============================================================ */

/**
 * Canonical Targeting/Spatial runtime feature declaration.
 *
 * This file defines the feature but does not register itself.
 * scripts/feature-registry.js remains the application-wide registration
 * boundary.
 *
 * Required registry-level dependencies are intentionally empty for the
 * current migration state because execution_transaction, system_bridge,
 * native_adapter, and actor_owned_feature_registry are not yet represented
 * as Frame Conn feature definitions.
 */
export const frameConnTargetingSpatialFeature =
  defineFrameConnFeature({
    id:
      "targeting-spatial",

    domain:
      "targeting-spatial",

    provides: [
      "targeting-spatial",
      "targeting-spatial.query",
      "targeting-spatial.resolution",
      "targeting-spatial.validation",
      "targeting-spatial.execution-hooks",
      "targeting-spatial.runtime-augmentation"
    ],

    dependsOn: [],

    optionalDependsOn: [],

    state: {
      service:
        targetingSpatialRuntime
          .targetingSpatialService
    },

    commands: {
      configureRuntime:
        configureFrameConnTargetingSpatialRuntime,

      resolveTargets:
        targetingSpatialRuntime
          .resolveExecutionTargets,

      validateTargets:
        targetingSpatialRuntime
          .validateExecutionTargets,

      registerValidator:
        targetingSpatialRuntime
          .registerCustomTargetingValidator,

      unregisterValidator:
        targetingSpatialRuntime
          .unregisterCustomTargetingValidator,

      clearExecutionState:
        targetingSpatialRuntime
          .clearExecutionTargetingSpatialState,

      clearAllExecutionState:
        targetingSpatialRuntime
          .clearAllExecutionTargetingSpatialState
    },

    queries: {
      resolveEntity:
        targetingSpatialRuntime
          .resolveSpatialEntity,

      distance:
        targetingSpatialRuntime
          .querySpatialDistance,

      range:
        targetingSpatialRuntime
          .queryRange,

      threat:
        targetingSpatialRuntime
          .queryThreat,

      sensors:
        targetingSpatialRuntime
          .querySensors,

      adjacency:
        targetingSpatialRuntime
          .queryAdjacency,

      lineOfSight:
        targetingSpatialRuntime
          .queryLineOfSight,

      cover:
        targetingSpatialRuntime
          .queryCover,

      occupancy:
        targetingSpatialRuntime
          .queryOccupancy,

      area:
        targetingSpatialRuntime
          .queryArea,

      spatialFacts:
        targetingSpatialRuntime
          .querySpatialFacts,

      executionState:
        targetingSpatialRuntime
          .getExecutionTargetingSpatialState,

      runtimeBindings:
        getFrameConnTargetingSpatialRuntimeBindings,

      diagnostics:
        getFrameConnTargetingSpatialDiagnostics
    },

    hooks: {},

    lifecycle: {
      initialize:
        initializeFrameConnTargetingSpatialFeature,

      shutdown:
        shutdownFrameConnTargetingSpatialFeature
    },

    api: {
      service:
        targetingSpatialRuntime
          .targetingSpatialService,

      configureRuntime:
        configureFrameConnTargetingSpatialRuntime,

      runtimeBindings:
        getFrameConnTargetingSpatialRuntimeBindings,

      diagnostics:
        getFrameConnTargetingSpatialDiagnostics,

      capabilities:
        targetingSpatialRuntime
          .getTargetingSpatialServiceCapabilities,

      createSpatialPoint:
        targetingSpatialRuntime
          .createSpatialPoint,

      createSpatialFootprint:
        targetingSpatialRuntime
          .createSpatialFootprint,

      createSpatialEntityReference:
        targetingSpatialRuntime
          .createSpatialEntityReference,

      createTargetReference:
        targetingSpatialRuntime
          .createTargetReference,

      createAreaDescriptor:
        targetingSpatialRuntime
          .createAreaDescriptor,

      createTargetingRequirement:
        targetingSpatialRuntime
          .createTargetingRequirement,

      createSingleTargetRequirement:
        targetingSpatialRuntime
          .createSingleTargetRequirement,

      createMultipleTargetRequirement:
        targetingSpatialRuntime
          .createMultipleTargetRequirement,

      createSelfTargetRequirement:
        targetingSpatialRuntime
          .createSelfTargetRequirement,

      createAdjacentTargetRequirement:
        targetingSpatialRuntime
          .createAdjacentTargetRequirement,

      createThreatTargetRequirement:
        targetingSpatialRuntime
          .createThreatTargetRequirement,

      createSensorTargetRequirement:
        targetingSpatialRuntime
          .createSensorTargetRequirement,

      createAreaTargetRequirement:
        targetingSpatialRuntime
          .createAreaTargetRequirement,

      resolveEntity:
        targetingSpatialRuntime
          .resolveSpatialEntity,

      resolveEntities:
        targetingSpatialRuntime
          .resolveSpatialEntities,

      queryDistance:
        targetingSpatialRuntime
          .querySpatialDistance,

      queryRange:
        targetingSpatialRuntime
          .queryRange,

      queryThreat:
        targetingSpatialRuntime
          .queryThreat,

      querySensors:
        targetingSpatialRuntime
          .querySensors,

      queryAdjacency:
        targetingSpatialRuntime
          .queryAdjacency,

      queryLineOfSight:
        targetingSpatialRuntime
          .queryLineOfSight,

      queryCover:
        targetingSpatialRuntime
          .queryCover,

      queryOccupancy:
        targetingSpatialRuntime
          .queryOccupancy,

      queryArea:
        targetingSpatialRuntime
          .queryArea,

      querySceneEntities:
        targetingSpatialRuntime
          .querySceneSpatialEntities,

      queryEntitiesWithinSensors:
        targetingSpatialRuntime
          .queryEntitiesWithinSensors,

      querySpatialFacts:
        targetingSpatialRuntime
          .querySpatialFacts,

      buildRequest:
        targetingSpatialRuntime
          .buildTargetingRequest,

      resolveRequest:
        targetingSpatialRuntime
          .resolveTargetingRequest,

      resolveExecutionTargets:
        targetingSpatialRuntime
          .resolveExecutionTargets,

      resolveExistingExecutionTargets:
        targetingSpatialRuntime
          .resolveExistingExecutionTargets,

      validateSingleTarget:
        targetingSpatialRuntime
          .validateSingleTarget,

      validateResolution:
        targetingSpatialRuntime
          .validateTargetResolution,

      validateExecutionTargets:
        targetingSpatialRuntime
          .validateExecutionTargets,

      toExecutionValidationResult:
        targetingSpatialRuntime
          .toExecutionTargetValidationResult,

      registerCustomValidator:
        targetingSpatialRuntime
          .registerCustomTargetingValidator,

      unregisterCustomValidator:
        targetingSpatialRuntime
          .unregisterCustomTargetingValidator,

      getCustomValidator:
        targetingSpatialRuntime
          .getCustomTargetingValidator,

      clearCustomValidators:
        targetingSpatialRuntime
          .clearCustomTargetingValidators,

      setAugmentationResolver:
        targetingSpatialRuntime
          .setTargetingAugmentationResolver,

      getAugmentationResolver:
        targetingSpatialRuntime
          .getTargetingAugmentationResolver,

      getExecutionState:
        targetingSpatialRuntime
          .getExecutionTargetingSpatialState,

      getExecutionRequest:
        targetingSpatialRuntime
          .getExecutionTargetingRequest,

      getExecutionResolution:
        targetingSpatialRuntime
          .getExecutionTargetResolution,

      getExecutionValidation:
        targetingSpatialRuntime
          .getExecutionTargetValidation,

      clearExecutionState:
        targetingSpatialRuntime
          .clearExecutionTargetingSpatialState,

      clearAllExecutionState:
        targetingSpatialRuntime
          .clearAllExecutionTargetingSpatialState,

      registerTransactionHooks:
        targetingSpatialRuntime
          .registerTargetingSpatialTransactionHooks,

      unregisterTransactionHooks:
        targetingSpatialRuntime
          .unregisterTargetingSpatialTransactionHooks,

      transactionHooksRegistered:
        targetingSpatialRuntime
          .areTargetingSpatialTransactionHooksRegistered
    },

    metadata: {
      label:
        "Targeting / Spatial",

      description:
        "Exposes Frame Conn spatial queries, target acquisition, target validation, and execution-transaction targeting integration through the canonical feature registry.",

      serviceBoundary:
        "targeting-spatial_service/targeting-spatial-service.js",

      authoritativeRegistry:
        "scripts/feature-registry.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      integrationState:
        "feature-wrapper-created-awaiting-registry-and-runtime-composition",

      deferredFeatureDependencies: [
        "execution_transaction",
        "system_bridge",
        "native_adapter",
        "actor_owned_feature_registry"
      ]
    }
  });

/* ============================================================
   TRANSITIONAL NAMED EXPORTS
   ============================================================ */

export {
  configureFrameConnTargetingSpatialRuntime,
  getFrameConnTargetingSpatialRuntimeBindings,
  initializeFrameConnTargetingSpatialFeature,
  shutdownFrameConnTargetingSpatialFeature,
  getFrameConnTargetingSpatialDiagnostics
};
