/* ============================================================
   FILE PATH / NAME
   ============================================================ */
/**
 * scripts/feature_semantic_execution_context/semantic-execution-context-feature.js
 */

/**
 * @file
 * @path scripts/feature_semantic_execution_context/semantic-execution-context-feature.js
 * @module semantic-execution-context-feature
 * @layer frame-conn-runtime-feature
 * @responsibility expose-semantic-execution-context-through-the-canonical-frame-conn-feature-contract
 * @public-boundary true
 * @side-effects delegated-native-resolution-during-context-building
 *
 * ARCHITECTURAL ROLE:
 *
 * semantic_execution_context/*
 *      ↓
 * execution-context.js
 *      ↓
 * semantic-execution-context-feature.js
 *      ↓
 * feature-registry.js
 *      ↓
 * runtime-orchestrator.js
 *
 * THIS FILE OWNS:
 * - canonical Frame Conn Semantic Execution Context feature definition
 * - execution-context capability declaration
 * - registry-facing context builder API
 * - registry-facing immutable context access helpers
 * - feature-level diagnostics
 *
 * THIS FILE DOES NOT OWN:
 * - execution-context contracts
 * - execution-context construction implementation
 * - native Actor or Item resolution implementation
 * - System Bridge resolution/composition
 * - execution transaction sequencing
 * - action economy
 * - resource orchestration
 * - targeting legality
 * - lifecycle progression
 * - native Flow execution
 * - application startup orchestration
 *
 * EDIT CONTRACT:
 * - keep this file a thin feature wrapper
 * - do not duplicate semantic_execution_context behavior here
 * - do not import sibling runtime features directly
 * - feature-registry.js remains the registration boundary
 */

/* ============================================================
   IMPORTS
   ============================================================ */

import {
  defineFrameConnFeature
} from "../feature-contract.js";

import * as executionContextRuntime from
  "../../system_bridge/semantic_execution_context/execution-context.js";

/* ============================================================
   FEATURE DIAGNOSTICS
   ============================================================ */

function getFrameConnSemanticExecutionContextDiagnostics() {
  return Object.freeze({
    serviceId:
      executionContextRuntime
        .EXECUTION_CONTEXT_MODULE_ID ??
      null,

    serviceVersion:
      executionContextRuntime
        .EXECUTION_CONTEXT_MODULE_VERSION ??
      null,

    module:
      executionContextRuntime
        .getExecutionContextModuleDiagnostics()
  });
}

/* ============================================================
   FEATURE DEFINITION
   ============================================================ */

/**
 * Canonical Semantic Execution Context runtime feature declaration.
 *
 * This file defines the feature but does not register itself.
 * scripts/feature-registry.js remains the application-wide registration
 * boundary.
 */
export const frameConnSemanticExecutionContextFeature =
  defineFrameConnFeature({
    id:
      "semantic-execution-context",

    domain:
      "semantic-execution-context",

    provides: [
      "semantic-execution-context",
      "semantic-execution-context.builder",
      "semantic-execution-context.identity",
      "semantic-execution-context.targets",
      "semantic-execution-context.access"
    ],

    dependsOn: [
      "native-adapter"
    ],

    optionalDependsOn: [
      "system-bridge",
      "actions.registry",
      "turn.state"
    ],

    state: {
      service:
        executionContextRuntime.executionContext
    },

    commands: {
      build:
        executionContextRuntime.buildExecutionContext,

      buildChild:
        executionContextRuntime.buildChildExecutionContext,

      buildWeapon:
        executionContextRuntime.buildWeaponExecutionContext,

      buildNativeAction:
        executionContextRuntime.buildNativeActionExecutionContext,

      buildGrantedAction:
        executionContextRuntime.buildGrantedActionExecutionContext,

      buildPreparedAction:
        executionContextRuntime.buildPreparedActionExecutionContext,

      buildSecondaryAttack:
        executionContextRuntime.buildSecondaryAttackExecutionContext,

      buildReaction:
        executionContextRuntime.buildReactionExecutionContext,

      buildMovement:
        executionContextRuntime.buildMovementExecutionContext,

      rebuild:
        executionContextRuntime.rebuildExecutionContext
    },

    queries: {
      assertContext:
        executionContextRuntime.assertExecutionContext,

      executionId:
        executionContextRuntime.getExecutionId,

      semanticActionId:
        executionContextRuntime.getSemanticActionId,

      actor:
        executionContextRuntime.getExecutionActor,

      targets:
        executionContextRuntime.getExecutionTargets,

      hasTargets:
        executionContextRuntime.hasExecutionTargets,

      diagnostics:
        getFrameConnSemanticExecutionContextDiagnostics
    },

    hooks: {},

    lifecycle: {},

    api: {
      service:
        executionContextRuntime.executionContext,

      diagnostics:
        getFrameConnSemanticExecutionContextDiagnostics,

      buildExecutionContext:
        executionContextRuntime.buildExecutionContext,

      buildChildExecutionContext:
        executionContextRuntime.buildChildExecutionContext,

      buildWeaponExecutionContext:
        executionContextRuntime.buildWeaponExecutionContext,

      buildNativeActionExecutionContext:
        executionContextRuntime.buildNativeActionExecutionContext,

      buildGrantedActionExecutionContext:
        executionContextRuntime.buildGrantedActionExecutionContext,

      buildPreparedActionExecutionContext:
        executionContextRuntime.buildPreparedActionExecutionContext,

      buildSecondaryAttackExecutionContext:
        executionContextRuntime.buildSecondaryAttackExecutionContext,

      buildReactionExecutionContext:
        executionContextRuntime.buildReactionExecutionContext,

      buildMovementExecutionContext:
        executionContextRuntime.buildMovementExecutionContext,

      rebuildExecutionContext:
        executionContextRuntime.rebuildExecutionContext,

      assertExecutionContext:
        executionContextRuntime.assertExecutionContext,

      setExecutionContextPhase:
        executionContextRuntime.setExecutionContextPhase,

      patchExecutionContext:
        executionContextRuntime.patchExecutionContext,

      setExecutionTargets:
        executionContextRuntime.setExecutionTargets,

      addExecutionTarget:
        executionContextRuntime.addExecutionTarget,

      patchExecutionFlags:
        executionContextRuntime.patchExecutionFlags,

      getExecutionId:
        executionContextRuntime.getExecutionId,

      getParentExecutionId:
        executionContextRuntime.getParentExecutionId,

      getRootExecutionId:
        executionContextRuntime.getRootExecutionId,

      getExecutionDepth:
        executionContextRuntime.getExecutionDepth,

      getExecutionActor:
        executionContextRuntime.getExecutionActor,

      getExecutionPilot:
        executionContextRuntime.getExecutionPilot,

      getExecutionMech:
        executionContextRuntime.getExecutionMech,

      getExecutionControllerMode:
        executionContextRuntime.getExecutionControllerMode,

      getSemanticActionId:
        executionContextRuntime.getSemanticActionId,

      getSemanticActionDefinition:
        executionContextRuntime.getSemanticActionDefinition,

      getExecutionActivationType:
        executionContextRuntime.getExecutionActivationType,

      getExecutionSourceKind:
        executionContextRuntime.getExecutionSourceKind,

      getExecutionSourceItemUuid:
        executionContextRuntime.getExecutionSourceItemUuid,

      getExecutionSourceItemLid:
        executionContextRuntime.getExecutionSourceItemLid,

      getExecutionSourceActionPath:
        executionContextRuntime.getExecutionSourceActionPath,

      getExecutionSourceFeatureId:
        executionContextRuntime.getExecutionSourceFeatureId,

      getExecutionSourceIdentity:
        executionContextRuntime.getExecutionSourceIdentity,

      getExecutionWeapon:
        executionContextRuntime.getExecutionWeapon,

      getExecutionWeaponUuid:
        executionContextRuntime.getExecutionWeaponUuid,

      getExecutionTargets:
        executionContextRuntime.getExecutionTargets,

      getExecutionTargetCount:
        executionContextRuntime.getExecutionTargetCount,

      getExecutionTargetActorUuids:
        executionContextRuntime.getExecutionTargetActorUuids,

      getExecutionTargetTokenUuids:
        executionContextRuntime.getExecutionTargetTokenUuids,

      hasExecutionTargets:
        executionContextRuntime.hasExecutionTargets,

      getExecutionTemplate:
        executionContextRuntime.getExecutionTemplate,

      hasExecutionTemplate:
        executionContextRuntime.hasExecutionTemplate,

      getExecutionMovement:
        executionContextRuntime.getExecutionMovement,

      getExecutionMovementMode:
        executionContextRuntime.getExecutionMovementMode,

      getExecutionResourceContext:
        executionContextRuntime.getExecutionResourceContext,

      getExecutionEconomyContext:
        executionContextRuntime.getExecutionEconomyContext,

      isChildExecution:
        executionContextRuntime.isChildExecution,

      isSecondaryAttackExecution:
        executionContextRuntime.isSecondaryAttackExecution,

      isGrantedActionExecution:
        executionContextRuntime.isGrantedActionExecution,

      isPreparedActionExecution:
        executionContextRuntime.isPreparedActionExecution,

      isReactionExecution:
        executionContextRuntime.isReactionExecution,

      isMovementExecution:
        executionContextRuntime.isMovementExecution,

      isWeaponExecution:
        executionContextRuntime.isWeaponExecution,

      hasExecutionFlag:
        executionContextRuntime.hasExecutionFlag,

      createExecutionStrategyIdentity:
        executionContextRuntime.createExecutionStrategyIdentity,

      getExecutionContextDiagnostics:
        executionContextRuntime.getExecutionContextDiagnostics
    },

    metadata: {
      label:
        "Semantic Execution Context",

      description:
        "Exposes canonical immutable Frame Conn execution-context construction and access through the feature registry.",

      serviceBoundary:
        "semantic_execution_context/execution-context.js",

      authoritativeRegistry:
        "scripts/feature-registry.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      nativeDependency:
        "native-adapter",

      upstreamRuntimeDescriptor:
        "system-bridge",

      downstreamExecutionAuthority:
        "execution-transaction"
    }
  });

/* ============================================================
   TRANSITIONAL NAMED EXPORTS
   ============================================================ */

export {
  getFrameConnSemanticExecutionContextDiagnostics
};
