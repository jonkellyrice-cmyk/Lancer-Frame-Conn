/* ============================================================
   FILE PATH / NAME
   ============================================================ */
/**
 * scripts/feature_lifecycle/lifecycle-feature.js
 */

/**
 * @file
 * @path scripts/feature_lifecycle/lifecycle-feature.js
 * @module lifecycle-feature
 * @layer frame-conn-runtime-feature
 * @responsibility expose-lifecycle-service-through-the-canonical-frame-conn-feature-contract
 * @public-boundary true
 * @side-effects lifecycle-hook-registration-through-feature-lifecycle
 *
 * ARCHITECTURAL ROLE:
 *
 * lifecycle_service/*
 *      ↓
 * lifecycle-service.js
 *      ↓
 * lifecycle-feature.js
 *      ↓
 * feature-registry.js
 *      ↓
 * runtime-orchestrator.js
 *
 * THIS FILE OWNS:
 * - canonical Frame Conn Lifecycle feature definition
 * - Lifecycle capability declaration
 * - narrow runtime adapter configuration boundary
 * - feature-lifecycle activation/deactivation of semantic lifecycle hooks
 * - public registry-facing Lifecycle API
 *
 * THIS FILE DOES NOT OWN:
 * - lifecycle contracts
 * - lifecycle state persistence
 * - lifecycle due-entry resolution
 * - lifecycle operation routing
 * - semantic event transport
 * - resource mutation
 * - action-economy mutation
 * - Foundry/Lancer native mutation
 * - application startup orchestration
 *
 * EDIT CONTRACT:
 * - keep this file a thin feature wrapper
 * - do not duplicate lifecycle_service behavior here
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

import * as lifecycleRuntime from
  "../../../system_bridge/lifecycle_service/lifecycle-service.js";

/* ============================================================
   RUNTIME CONFIGURATION
   ============================================================ */

/**
 * Lifecycle owns no Foundry/Lancer persistence or mutation implementation.
 * Those authorities are supplied at application composition time.
 */
function configureFrameConnLifecycleRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !== "object" ||
    Array.isArray(bindings)
  ) {
    throw new TypeError(
      "Frame Conn Lifecycle runtime bindings must be supplied as an object."
    );
  }

  const allowedKeys =
    new Set([
      "stateAdapter",
      "operationAdapters"
    ]);

  for (const key of Object.keys(bindings)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `Frame Conn Lifecycle received unknown runtime binding: ${key}`
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "stateAdapter"
    )
  ) {
    lifecycleRuntime.setLifecycleStateAdapter(
      bindings.stateAdapter
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      bindings,
      "operationAdapters"
    )
  ) {
    lifecycleRuntime.setLifecycleOperationAdapters(
      bindings.operationAdapters
    );
  }

  return getFrameConnLifecycleRuntimeBindings();
}

/**
 * Returns composition status without exposing adapter implementation details.
 */
function getFrameConnLifecycleRuntimeBindings() {
  return Object.freeze({
    stateAdapter:
      lifecycleRuntime.hasLifecycleStateAdapter(),

    operationAdapters:
      Boolean(
        lifecycleRuntime.getLifecycleOperationAdapters()
      ),

    semanticHooks:
      lifecycleRuntime.areLifecycleSemanticHooksRegistered()
  });
}

/* ============================================================
   FEATURE LIFECYCLE
   ============================================================ */

/**
 * Semantic lifecycle listeners are activated only when the canonical feature
 * registry initializes this feature.
 */
function initializeFrameConnLifecycleFeature() {
  return lifecycleRuntime
    .registerLifecycleSemanticHooks();
}

/**
 * Lifecycle listener teardown belongs to feature shutdown.
 */
function shutdownFrameConnLifecycleFeature() {
  return lifecycleRuntime
    .unregisterLifecycleSemanticHooks();
}

/* ============================================================
   FEATURE DIAGNOSTICS
   ============================================================ */

function getFrameConnLifecycleDiagnostics() {
  return Object.freeze({
    runtimeBindings:
      getFrameConnLifecycleRuntimeBindings(),

    serviceId:
      lifecycleRuntime
        .LIFECYCLE_SERVICE_MODULE_ID ??
      null,

    serviceVersion:
      lifecycleRuntime
        .LIFECYCLE_SERVICE_MODULE_VERSION ??
      null
  });
}

/* ============================================================
   FEATURE DEFINITION
   ============================================================ */

/**
 * Canonical Lifecycle runtime feature declaration.
 *
 * This file defines the feature but does not register itself.
 * scripts/feature-registry.js remains the application-wide registration
 * boundary.
 *
 * Required registry-level dependencies are intentionally empty for the
 * current migration state because semantic_event_bus, resource_service, and
 * action_economy are not yet represented as Frame Conn feature definitions.
 * Their implementation relationships remain explicit in lifecycle_service.
 */
export const frameConnLifecycleFeature =
  defineFrameConnFeature({
    id:
      "lifecycle",

    domain:
      "lifecycle",

    provides: [
      "lifecycle",
      "lifecycle.state",
      "lifecycle.registration",
      "lifecycle.dispatch",
      "lifecycle.semantic-events"
    ],

    dependsOn: [],

    optionalDependsOn: [],

    state: {
      service:
        lifecycleRuntime.lifecycleService
    },

    commands: {
      configureRuntime:
        configureFrameConnLifecycleRuntime,

      registerEntry:
        lifecycleRuntime.registerLifecycleEntry,

      registerEntries:
        lifecycleRuntime.registerLifecycleEntries,

      registerExpiration:
        lifecycleRuntime.registerLifecycleExpiration,

      registerReset:
        lifecycleRuntime.registerLifecycleReset,

      registerEffect:
        lifecycleRuntime.registerLifecycleEffect,

      dispatch:
        lifecycleRuntime.dispatchLifecycleContext,

      dispatchBoundary:
        lifecycleRuntime.dispatchLifecycleBoundary,

      clearState:
        lifecycleRuntime.clearLifecycleState,

      pruneInactive:
        lifecycleRuntime.pruneInactiveLifecycleEntries
    },

    queries: {
      getEntry:
        lifecycleRuntime.getLifecycleEntry,

      getActiveEntries:
        lifecycleRuntime.getActiveLifecycleEntries,

      getEntriesBySubject:
        lifecycleRuntime.getLifecycleEntriesBySubject,

      getEntriesByActor:
        lifecycleRuntime.getLifecycleEntriesByActor,

      getEntriesByScope:
        lifecycleRuntime.getLifecycleEntriesByScope,

      getEntriesByBoundary:
        lifecycleRuntime.getLifecycleEntriesByBoundary,

      getDueEntries:
        lifecycleRuntime.getDueLifecycleEntries,

      isEntryDue:
        lifecycleRuntime.isLifecycleEntryDue,

      runtimeBindings:
        getFrameConnLifecycleRuntimeBindings,

      diagnostics:
        getFrameConnLifecycleDiagnostics
    },

    hooks: {},

    lifecycle: {
      initialize:
        initializeFrameConnLifecycleFeature,

      shutdown:
        shutdownFrameConnLifecycleFeature
    },

    api: {
      service:
        lifecycleRuntime.lifecycleService,

      configureRuntime:
        configureFrameConnLifecycleRuntime,

      runtimeBindings:
        getFrameConnLifecycleRuntimeBindings,

      diagnostics:
        getFrameConnLifecycleDiagnostics,

      createIdentity:
        lifecycleRuntime.createLifecycleIdentity,

      createContext:
        lifecycleRuntime.createLifecycleContext,

      createMatch:
        lifecycleRuntime.createLifecycleMatch,

      createExpirationDescriptor:
        lifecycleRuntime.createLifecycleExpirationDescriptor,

      createResetDescriptor:
        lifecycleRuntime.createLifecycleResetDescriptor,

      createEffectDescriptor:
        lifecycleRuntime.createLifecycleEffectDescriptor,

      registerEntry:
        lifecycleRuntime.registerLifecycleEntry,

      registerEntries:
        lifecycleRuntime.registerLifecycleEntries,

      registerExpiration:
        lifecycleRuntime.registerLifecycleExpiration,

      registerReset:
        lifecycleRuntime.registerLifecycleReset,

      registerEffect:
        lifecycleRuntime.registerLifecycleEffect,

      getEntry:
        lifecycleRuntime.getLifecycleEntry,

      getActiveEntries:
        lifecycleRuntime.getActiveLifecycleEntries,

      getEntriesBySubject:
        lifecycleRuntime.getLifecycleEntriesBySubject,

      getEntriesByActor:
        lifecycleRuntime.getLifecycleEntriesByActor,

      getEntriesByScope:
        lifecycleRuntime.getLifecycleEntriesByScope,

      getEntriesByBoundary:
        lifecycleRuntime.getLifecycleEntriesByBoundary,

      getDueEntries:
        lifecycleRuntime.getDueLifecycleEntries,

      setEntryStatus:
        lifecycleRuntime.setLifecycleEntryStatus,

      markExpired:
        lifecycleRuntime.markLifecycleEntryExpired,

      markReset:
        lifecycleRuntime.markLifecycleEntryReset,

      disableEntry:
        lifecycleRuntime.disableLifecycleEntry,

      enableEntry:
        lifecycleRuntime.enableLifecycleEntry,

      removeEntry:
        lifecycleRuntime.removeLifecycleEntry,

      pruneInactive:
        lifecycleRuntime.pruneInactiveLifecycleEntries,

      isEntryDue:
        lifecycleRuntime.isLifecycleEntryDue,

      resolveDueEntries:
        lifecycleRuntime.resolveDueLifecycleEntries,

      executeEntryOperation:
        lifecycleRuntime.executeLifecycleEntryOperation,

      dispatch:
        lifecycleRuntime.dispatchLifecycleContext,

      dispatchBoundary:
        lifecycleRuntime.dispatchLifecycleBoundary,

      createContextFromSemanticEvent:
        lifecycleRuntime.createLifecycleContextFromSemanticEvent,

      dispatchSemanticEvent:
        lifecycleRuntime.dispatchSemanticEventAsLifecycle,

      registerSemanticHooks:
        lifecycleRuntime.registerLifecycleSemanticHooks,

      unregisterSemanticHooks:
        lifecycleRuntime.unregisterLifecycleSemanticHooks,

      semanticHooksRegistered:
        lifecycleRuntime.areLifecycleSemanticHooksRegistered
    },

    metadata: {
      label:
        "Lifecycle",

      description:
        "Exposes Frame Conn lifecycle timing, registration, dispatch, and semantic lifecycle integration through the canonical feature registry.",

      serviceBoundary:
        "lifecycle_service/lifecycle-service.js",

      authoritativeRegistry:
        "scripts/feature-registry.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      integrationState:
        "feature-wrapper-created-awaiting-registry-and-runtime-composition",

      deferredFeatureDependencies: [
        "semantic_event_bus",
        "resource_service",
        "action_economy"
      ]
    }
  });

/* ============================================================
   TRANSITIONAL NAMED EXPORTS
   ============================================================ */

export {
  configureFrameConnLifecycleRuntime,
  getFrameConnLifecycleRuntimeBindings,
  initializeFrameConnLifecycleFeature,
  shutdownFrameConnLifecycleFeature,
  getFrameConnLifecycleDiagnostics
};
