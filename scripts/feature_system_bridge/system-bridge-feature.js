/* ============================================================
   FILE PATH / NAME
   ============================================================ */
/**
 * scripts/feature_system_bridge/system-bridge-feature.js
 */

/**
 * @file
 * @path scripts/feature_system_bridge/system-bridge-feature.js
 * @module system-bridge-feature
 * @layer frame-conn-runtime-feature
 * @responsibility expose-system-bridge-through-the-canonical-frame-conn-feature-contract
 * @public-boundary true
 * @side-effects delegated-through-system-bridge-resolution-and-augmentation-registration
 *
 * ARCHITECTURAL ROLE:
 *
 * system_bridge/*
 *      ↓
 * system-bridge.js
 *      ↓
 * system-bridge-feature.js
 *      ↓
 * feature-registry.js
 *      ↓
 * runtime-orchestrator.js
 *
 * THIS FILE OWNS:
 * - canonical Frame Conn System Bridge feature definition
 * - System Bridge capability declaration
 * - narrow existing-registry resolver adapter configuration boundary
 * - registry-facing bridge resolution/composition API
 * - registry-facing bridge augmentation API
 * - feature-level diagnostics
 *
 * THIS FILE DOES NOT OWN:
 * - bridge contracts
 * - source-resolution implementation
 * - augmentation matching/merge implementation
 * - runtime descriptor composition implementation
 * - actor-owned feature discovery
 * - semantic execution context construction
 * - execution transaction sequencing
 * - targeting validation
 * - lifecycle progression
 * - native Lancer execution
 * - application startup orchestration
 *
 * EDIT CONTRACT:
 * - keep this file a thin feature wrapper
 * - do not duplicate system_bridge behavior here
 * - do not import sibling runtime features directly
 * - runtime-orchestrator supplies the existing Frame Conn registry adapter
 * - feature-registry.js remains the registration boundary
 */

/* ============================================================
   IMPORTS
   ============================================================ */

import {
  defineFrameConnFeature
} from "../feature-contract.js";

import * as systemBridgeRuntime from
  "../../system_bridge/system-bridge.js";

/* ============================================================
   RUNTIME CONFIGURATION
   ============================================================ */

/**
 * The bridge intentionally knows nothing about the concrete shape of the
 * existing Frame Conn registry. Runtime composition supplies exactly one
 * resolver adapter for that existing source.
 */
function configureFrameConnSystemBridgeRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !== "object" ||
    Array.isArray(bindings)
  ) {
    throw new TypeError(
      "Frame Conn System Bridge runtime bindings must be supplied as an object."
    );
  }

  const allowedKeys =
    new Set([
      "existingRegistryResolverAdapter"
    ]);

  for (const key of Object.keys(bindings)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `Frame Conn System Bridge received unknown runtime binding: ${key}`
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "existingRegistryResolverAdapter"
    )
  ) {
    systemBridgeRuntime
      .setSystemBridgeExistingRegistryResolverAdapter(
        bindings.existingRegistryResolverAdapter
      );
  }

  return getFrameConnSystemBridgeRuntimeBindings();
}

/**
 * Returns composition status without exposing the resolver adapter itself.
 */
function getFrameConnSystemBridgeRuntimeBindings() {
  return Object.freeze({
    existingRegistryResolverAdapter:
      systemBridgeRuntime
        .hasSystemBridgeExistingRegistryResolverAdapter()
  });
}

/* ============================================================
   FEATURE DIAGNOSTICS
   ============================================================ */

function getFrameConnSystemBridgeDiagnostics() {
  return Object.freeze({
    runtimeBindings:
      getFrameConnSystemBridgeRuntimeBindings(),

    serviceId:
      systemBridgeRuntime
        .SYSTEM_BRIDGE_MODULE_ID ??
      null,

    serviceVersion:
      systemBridgeRuntime
        .SYSTEM_BRIDGE_MODULE_VERSION ??
      null,

    augmentationRegistry:
      systemBridgeRuntime
        .getSystemBridgeAugmentationRegistrySnapshot()
  });
}

/* ============================================================
   FEATURE DEFINITION
   ============================================================ */

/**
 * Canonical System Bridge runtime feature declaration.
 *
 * This file defines the feature but does not register itself.
 * scripts/feature-registry.js remains the application-wide registration
 * boundary.
 */
export const frameConnSystemBridgeFeature =
  defineFrameConnFeature({
    id:
      "system-bridge",

    domain:
      "system-bridge",

    provides: [
      "system-bridge",
      "system-bridge.resolution",
      "system-bridge.composition",
      "system-bridge.runtime-descriptor",
      "system-bridge.augmentation"
    ],

    dependsOn: [],

    optionalDependsOn: [
      "actions.registry"
    ],

    state: {
      service:
        systemBridgeRuntime.systemBridge
    },

    commands: {
      configureRuntime:
        configureFrameConnSystemBridgeRuntime,

      registerAugmentation:
        systemBridgeRuntime.registerSystemBridgeAugmentation,

      registerValidatedAugmentation:
        systemBridgeRuntime.registerValidatedSystemBridgeAugmentation,

      registerAugmentations:
        systemBridgeRuntime.registerSystemBridgeAugmentations,

      replaceAugmentation:
        systemBridgeRuntime.replaceSystemBridgeAugmentation,

      unregisterAugmentation:
        systemBridgeRuntime.unregisterSystemBridgeAugmentation,

      clearAugmentations:
        systemBridgeRuntime.clearSystemBridgeAugmentations,

      setAugmentationEnabled:
        systemBridgeRuntime.setSystemBridgeAugmentationEnabled
    },

    queries: {
      resolveSources:
        systemBridgeRuntime.resolveSystemBridgeSources,

      resolveAndCompose:
        systemBridgeRuntime.resolveAndComposeSystemBridge,

      resolveRuntimeDescriptor:
        systemBridgeRuntime.resolveSystemBridgeRuntimeDescriptor,

      getAugmentation:
        systemBridgeRuntime.getSystemBridgeAugmentation,

      getAugmentations:
        systemBridgeRuntime.getSystemBridgeAugmentations,

      queryAugmentations:
        systemBridgeRuntime.querySystemBridgeAugmentations,

      runtimeBindings:
        getFrameConnSystemBridgeRuntimeBindings,

      diagnostics:
        getFrameConnSystemBridgeDiagnostics
    },

    hooks: {},

    lifecycle: {},

    api: {
      service:
        systemBridgeRuntime.systemBridge,

      configureRuntime:
        configureFrameConnSystemBridgeRuntime,

      runtimeBindings:
        getFrameConnSystemBridgeRuntimeBindings,

      diagnostics:
        getFrameConnSystemBridgeDiagnostics,

      createIdentity:
        systemBridgeRuntime.createSystemBridgeIdentity,

      createSourceReference:
        systemBridgeRuntime.createSystemBridgeSourceReference,

      createResolutionRequest:
        systemBridgeRuntime.createSystemBridgeResolutionRequest,

      createResolutionResult:
        systemBridgeRuntime.createSystemBridgeResolutionResult,

      createRuntimePresentation:
        systemBridgeRuntime.createSystemBridgeRuntimePresentation,

      createRuntimeExecution:
        systemBridgeRuntime.createSystemBridgeRuntimeExecution,

      createRuntimeAction:
        systemBridgeRuntime.createSystemBridgeRuntimeAction,

      createRuntimeFeature:
        systemBridgeRuntime.createSystemBridgeRuntimeFeature,

      createCompositionResult:
        systemBridgeRuntime.createSystemBridgeCompositionResult,

      normalizeResolutionRequest:
        systemBridgeRuntime.normalizeSystemBridgeResolutionRequest,

      resolveSources:
        systemBridgeRuntime.resolveSystemBridgeSources,

      resolveExistingRegistrySource:
        systemBridgeRuntime.resolveSystemBridgeExistingRegistrySource,

      resolveActorOwnedSource:
        systemBridgeRuntime.resolveSystemBridgeActorOwnedSource,

      resolveAugmentations:
        systemBridgeRuntime.resolveSystemBridgeAugmentations,

      resolveAndCompose:
        systemBridgeRuntime.resolveAndComposeSystemBridge,

      resolveRuntimeDescriptor:
        systemBridgeRuntime.resolveSystemBridgeRuntimeDescriptor,

      composeRuntimeAction:
        systemBridgeRuntime.composeSystemBridgeRuntimeAction,

      composeRuntimeFeature:
        systemBridgeRuntime.composeSystemBridgeRuntimeFeature,

      composeResolvedSubject:
        systemBridgeRuntime.composeResolvedSystemBridgeSubject,

      composeResolution:
        systemBridgeRuntime.composeSystemBridgeResolution,

      getComposedFeature:
        systemBridgeRuntime.getComposedSystemBridgeFeature,

      getComposedAction:
        systemBridgeRuntime.getComposedSystemBridgeAction,

      getComposedRuntimeDescriptor:
        systemBridgeRuntime.getComposedSystemBridgeRuntimeDescriptor,

      resolutionSucceeded:
        systemBridgeRuntime.systemBridgeResolutionSucceeded,

      compositionSucceeded:
        systemBridgeRuntime.systemBridgeCompositionSucceeded,

      compositionHasBlockingConflict:
        systemBridgeRuntime.systemBridgeCompositionHasBlockingConflict,

      didResolutionResolve:
        systemBridgeRuntime.didSystemBridgeResolutionResolve,

      wasResolutionAmbiguous:
        systemBridgeRuntime.wasSystemBridgeResolutionAmbiguous,

      didResolutionFail:
        systemBridgeRuntime.didSystemBridgeResolutionFail,

      wasResolutionNotFound:
        systemBridgeRuntime.wasSystemBridgeResolutionNotFound,

      didCompositionComplete:
        systemBridgeRuntime.didSystemBridgeCompositionComplete,

      isCompositionPartial:
        systemBridgeRuntime.isSystemBridgeCompositionPartial,

      isCompositionConflicted:
        systemBridgeRuntime.isSystemBridgeCompositionConflicted,

      isCompositionUnresolved:
        systemBridgeRuntime.isSystemBridgeCompositionUnresolved,

      didCompositionFail:
        systemBridgeRuntime.didSystemBridgeCompositionFail,

      registerAugmentation:
        systemBridgeRuntime.registerSystemBridgeAugmentation,

      registerValidatedAugmentation:
        systemBridgeRuntime.registerValidatedSystemBridgeAugmentation,

      registerAugmentations:
        systemBridgeRuntime.registerSystemBridgeAugmentations,

      replaceAugmentation:
        systemBridgeRuntime.replaceSystemBridgeAugmentation,

      unregisterAugmentation:
        systemBridgeRuntime.unregisterSystemBridgeAugmentation,

      clearAugmentations:
        systemBridgeRuntime.clearSystemBridgeAugmentations,

      getAugmentation:
        systemBridgeRuntime.getSystemBridgeAugmentation,

      hasAugmentation:
        systemBridgeRuntime.hasSystemBridgeAugmentation,

      getAugmentations:
        systemBridgeRuntime.getSystemBridgeAugmentations,

      queryAugmentations:
        systemBridgeRuntime.querySystemBridgeAugmentations,

      getAugmentationsForActionId:
        systemBridgeRuntime.getSystemBridgeAugmentationsForActionId,

      getAugmentationsForFeatureId:
        systemBridgeRuntime.getSystemBridgeAugmentationsForFeatureId,

      getAugmentationsForItemUuid:
        systemBridgeRuntime.getSystemBridgeAugmentationsForItemUuid,

      getAugmentationsForItemLid:
        systemBridgeRuntime.getSystemBridgeAugmentationsForItemLid,

      getAugmentationsForRegistryId:
        systemBridgeRuntime.getSystemBridgeAugmentationsForRegistryId,

      setAugmentationEnabled:
        systemBridgeRuntime.setSystemBridgeAugmentationEnabled,

      augmentationRegistrySnapshot:
        systemBridgeRuntime.getSystemBridgeAugmentationRegistrySnapshot,

      serializableAugmentationRegistry:
        systemBridgeRuntime.getSerializableSystemBridgeAugmentationRegistry
    },

    metadata: {
      label:
        "System Bridge",

      description:
        "Resolves and composes existing Frame Conn, actor-owned, and augmentation sources into canonical runtime descriptors for downstream semantic execution.",

      serviceBoundary:
        "system_bridge/system-bridge.js",

      authoritativeRegistry:
        "scripts/feature-registry.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      integrationState:
        "feature-wrapper-created-awaiting-registry-and-runtime-composition",

      mutationPolicy:
        "bridge-composition-only-no-mechanic-execution"
    }
  });

/* ============================================================
   TRANSITIONAL NAMED EXPORTS
   ============================================================ */

export {
  configureFrameConnSystemBridgeRuntime,
  getFrameConnSystemBridgeRuntimeBindings,
  getFrameConnSystemBridgeDiagnostics
};
