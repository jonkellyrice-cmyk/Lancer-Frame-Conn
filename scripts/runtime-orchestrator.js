/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/runtime-orchestrator.js
 */


/**
 * ============================================================
 * FRAME CONN RUNTIME ORCHESTRATOR
 * ============================================================
 *
 * ROLE:
 *   Provides the authoritative Foundry startup, runtime
 *   composition, and cross-feature orchestration surface for
 *   Frame Conn.
 *
 * PURPOSE:
 *   Compose registered Frame Conn features while retaining only
 *   behavior that genuinely belongs to application-wide runtime
 *   orchestration.
 *
 * CURRENT EXTRACTED DOMAINS:
 *
 *   - Actions
 *       scripts/actions-feature.js
 *
 *   - Sensors
 *       scripts/sensors-feature.js
 *
 *   - Turn
 *       scripts/turn-feature.js
 *
 *   - Movement
 *       scripts/movement-feature.js
 *
 *   - Foundry Integration
 *       scripts/foundry-integration-feature.js
 *
 *   - Action Execution
 *       scripts/action-execution-feature.js
 *
 *   - Lifecycle
 *       scripts/feature_lifecycle/lifecycle-feature.js
 *
 *   - Targeting / Spatial
 *       scripts/feature_targeting_spatial/targeting-spatial-feature.js
 *
 *   - System Bridge
 *       scripts/feature_system_bridge/system-bridge-feature.js
 *
 *   - Semantic Execution Context
 *       scripts/feature_semantic_execution_context/semantic-execution-context-feature.js
 *
 *   - Execution Transaction
 *       execution_transaction/execution-transaction-feature.js
 *
 *   - Native Adapter
 *       native_adapter/native-adapter-feature.js
 *
 *   - Application UI
 *       styles/ui-application.js
 *
 * FEATURE COMPOSITION:
 *
 *   feature-contract.js
 *        ↓
 *   feature-registry-core.js
 *        ↓
 *   feature-registry.js
 *        ├── actions-feature.js
 *        ├── sensors-feature.js
 *        ├── turn-feature.js
 *        ├── movement-feature.js
 *        ├── foundry-integration-feature.js
 *        ├── action-execution-feature.js
 *        ├── lifecycle-feature.js
 *        ├── targeting-spatial-feature.js
 *        ├── executable UI package
 *        └── future feature domains
 *        ↓
 *   runtime-orchestrator.js
 *
 * CURRENTLY OWNS:
 *
 *   - Foundry startup boundaries
 *   - Cross-feature runtime binding
 *   - Public game.lancerFrameConn composition
 *
 * NO LONGER OWNS:
 *
 *   - Action registry implementation
 *   - Universal action declarations
 *   - Action execution classification
 *   - Action execution-kind resolution
 *   - Mech-stat selection
 *   - Actor action-workflow delegation
 *   - Sensor rendering
 *   - Sensor hook behavior
 *   - FrameConnApplication
 *   - Application singleton state
 *   - Application open/close behavior
 *   - Application rendering implementation
 *   - Controlled-token UI lookup
 *   - Turn-state implementation
 *   - Turn-state manager
 *   - Turn action legality
 *   - Protocol state
 *   - Reaction state
 *   - Committed-action state
 *   - Combat-turn context resolution
 *   - Combat-turn synchronization
 *   - Turn-specific Foundry combat hooks
 *   - Movement-token identity matching
 *   - Movement-path normalization
 *   - Movement-path measurement
 *   - Movement rounding
 *   - Movement-triggered Boost notifications
 *   - moveToken handling
 *   - Elevation-origin tracking
 *   - Elevation-change interpretation
 *   - Elevation movement handling
 *   - Movement-specific Foundry hooks
 *   - Module settings implementation
 *   - Scene-control integration implementation
 *   - getSceneControlButtons hook behavior
 *   - Lifecycle state, dispatch, and semantic-event behavior
 *   - Target acquisition, spatial queries, and target validation
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  FrameConnFeatureRegistry
} from "./feature-registry-core.js";

import {
  FRAME_CONN_PLAYER_FEATURES
} from "./player_features/player-feature-registry.js";

import {
  FRAME_CONN_RULES_FEATURES
} from "./rules_features/rules-feature-registry.js";

import {
  FRAME_CONN_FOUNDRY_FEATURES
} from "./foundry_features/foundry-feature-registry.js";

import {
  FRAME_CONN_DM_FEATURES
} from "./dm_features/dm-feature-registry.js";


/* ============================================================
   Module identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";


/* ============================================================
   Application-wide feature composition
   ============================================================ */

/**
 * Player-facing and rules-driven packages remain independently
 * declared, but they are registered into one shared graph here so
 * required capabilities may cross the package boundary safely.
 */
export const frameConnFeatureRegistry =
  new FrameConnFeatureRegistry();

frameConnFeatureRegistry.registerMany([
  ...FRAME_CONN_PLAYER_FEATURES,
  ...FRAME_CONN_RULES_FEATURES,
  ...FRAME_CONN_FOUNDRY_FEATURES,
  ...FRAME_CONN_DM_FEATURES
]);

frameConnFeatureRegistry
  .validateDependencies();


/* ============================================================
   Registered feature surfaces
   ============================================================ */

/**
 * The runtime consumes extracted domains only through the
 * canonical feature registry.
 */


/* ------------------------------------------------------------
   Actions
   ------------------------------------------------------------ */

const frameConnActionsApi =
  frameConnFeatureRegistry.getApi(
    "actions"
  );


if (
  !frameConnActionsApi
) {
  throw new Error(
    "Frame Conn | The registered Actions feature API could not be resolved."
  );
}


const frameConnActionRegistry =
  frameConnActionsApi.registry;


/* ------------------------------------------------------------
   Sensors
   ------------------------------------------------------------ */

const frameConnSensorsApi =
  frameConnFeatureRegistry.getApi(
    "sensors"
  );


if (
  !frameConnSensorsApi
) {
  throw new Error(
    "Frame Conn | The registered Sensors feature API could not be resolved."
  );
}


const frameConnStatusOrchestrationApi =
  frameConnFeatureRegistry.getApi(
    "status-orchestration"
  );


if (
  !frameConnStatusOrchestrationApi
) {
  throw new Error(
    "Frame Conn | The registered Status Orchestration feature API could not be resolved."
  );
}


const initializeFrameConnActionRegistry =
  frameConnActionsApi.initialize;


/* ------------------------------------------------------------
   Turn
   ------------------------------------------------------------ */

const frameConnTurnApi =
  frameConnFeatureRegistry.getApi(
    "turn"
  );


if (
  !frameConnTurnApi
) {
  throw new Error(
    "Frame Conn | The registered Turn feature API could not be resolved."
  );
}


/**
 * Transitional accessor used by extracted features which still
 * consume the mutable Turn state model.
 *
 * Turn-state ownership belongs entirely to turn-feature.js.
 */
function getFrameConnTurnState() {
  return (
    frameConnTurnApi
      .getCurrent?.() ??
    frameConnTurnApi
      .current ??
    null
  );
}


/**
 * Resolve the canonical Turn state manager when exposed by the
 * feature.
 */
function getFrameConnTurnStateManager() {
  return (
    frameConnTurnApi
      .getManager?.() ??
    frameConnTurnApi
      .manager ??
    null
  );
}


/* ------------------------------------------------------------
   Movement
   ------------------------------------------------------------ */

const frameConnMovementApi =
  frameConnFeatureRegistry.getApi(
    "movement"
  );


if (
  !frameConnMovementApi
) {
  throw new Error(
    "Frame Conn | The registered Movement feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Foundry integration
   ------------------------------------------------------------ */

const frameConnFoundryIntegrationApi =
  frameConnFeatureRegistry.getApi(
    "foundry-integration"
  );

const frameConnElevationLosApi = frameConnFeatureRegistry.getApi("elevation-los");
if (!frameConnElevationLosApi) {
  throw new Error("Frame Conn | The registered Elevation / LOS feature API could not be resolved.");
}


if (
  !frameConnFoundryIntegrationApi
) {
  throw new Error(
    "Frame Conn | The registered Foundry Integration feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   DM SITREPs
   ------------------------------------------------------------ */

const frameConnSitrepsApi = frameConnFeatureRegistry.getApi("sitreps");
if (!frameConnSitrepsApi) throw new Error("Frame Conn | The registered SITREPs feature API could not be resolved.");

const frameConnDmApplicationApi = frameConnFeatureRegistry.getApi("ui-dm-application");
if (!frameConnDmApplicationApi) throw new Error("Frame Conn | The registered DM Application feature API could not be resolved.");


/* ------------------------------------------------------------
   Action execution
   ------------------------------------------------------------ */

const frameConnActionExecutionApi =
  frameConnFeatureRegistry.getApi(
    "action-execution"
  );


if (
  !frameConnActionExecutionApi
) {
  throw new Error(
    "Frame Conn | The registered Action Execution feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Lifecycle
   ------------------------------------------------------------ */

const frameConnLifecycleApi =
  frameConnFeatureRegistry.getApi(
    "lifecycle"
  );


if (
  !frameConnLifecycleApi
) {
  throw new Error(
    "Frame Conn | The registered Lifecycle feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Targeting / spatial
   ------------------------------------------------------------ */

const frameConnTargetingSpatialApi =
  frameConnFeatureRegistry.getApi(
    "targeting-spatial"
  );


if (
  !frameConnTargetingSpatialApi
) {
  throw new Error(
    "Frame Conn | The registered Targeting / Spatial feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   System Bridge
   ------------------------------------------------------------ */

const frameConnSystemBridgeApi =
  frameConnFeatureRegistry.getApi(
    "system-bridge"
  );


if (
  !frameConnSystemBridgeApi
) {
  throw new Error(
    "Frame Conn | The registered System Bridge feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Semantic Execution Context
   ------------------------------------------------------------ */

const frameConnSemanticExecutionContextApi =
  frameConnFeatureRegistry.getApi(
    "semantic-execution-context"
  );


if (
  !frameConnSemanticExecutionContextApi
) {
  throw new Error(
    "Frame Conn | The registered Semantic Execution Context feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Execution Transaction
   ------------------------------------------------------------ */

const frameConnExecutionTransactionApi =
  frameConnFeatureRegistry.getApi(
    "execution-transaction"
  );


if (
  !frameConnExecutionTransactionApi
) {
  throw new Error(
    "Frame Conn | The registered Execution Transaction feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Native Adapter
   ------------------------------------------------------------ */

const frameConnNativeAdapterApi =
  frameConnFeatureRegistry.getApi(
    "native-adapter"
  );


if (
  !frameConnNativeAdapterApi
) {
  throw new Error(
    "Frame Conn | The registered Native Adapter feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Brace
   ------------------------------------------------------------ */

const frameConnBraceApi =
  frameConnFeatureRegistry.getApi(
    "brace"
  );


if (
  !frameConnBraceApi
) {
  throw new Error(
    "Frame Conn | The registered Brace feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Turn UI
   ------------------------------------------------------------ */

const frameConnTurnUiApi =
  frameConnFeatureRegistry.getApi(
    "ui-turn"
  );


if (
  !frameConnTurnUiApi
) {
  throw new Error(
    "Frame Conn | The registered Turn UI feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Movement UI
   ------------------------------------------------------------ */

const frameConnMovementUiApi =
  frameConnFeatureRegistry.getApi(
    "ui-movement"
  );


if (
  !frameConnMovementUiApi
) {
  throw new Error(
    "Frame Conn | The registered Movement UI feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Application UI
   ------------------------------------------------------------ */

const frameConnApplicationApi =
  frameConnFeatureRegistry.getApi(
    "ui-application"
  );


if (
  !frameConnApplicationApi
) {
  throw new Error(
    "Frame Conn | The registered Application UI feature API could not be resolved."
  );
}


const openFrameConn =
  (...args) =>
    frameConnApplicationApi
      .open(
        ...args
      );


const closeFrameConn =
  (...args) =>
    frameConnApplicationApi
      .close(
        ...args
      );


function renderFrameConnApplication(
  force = false
) {
  return (
    frameConnApplicationApi
      .render?.(
        force
      ) ??
    null
  );
}


/* ============================================================
   Canonical target acquisition helpers
   ============================================================ */

/**
 * Resolve exactly one Foundry target for an action which requires one.
 * Existing user targets are preferred; otherwise Foundry Integration
 * switches to the native Token target tool and waits for selection.
 */
async function resolveFrameConnRequiredTarget(
  action
) {
  if (!action?.requiresTarget) {
    return null;
  }

  let targets =
    frameConnFoundryIntegrationApi
      .getSelectedTargets?.() ??
    [];

  if (targets.length === 0) {
    targets =
      await frameConnFoundryIntegrationApi
        .promptForTarget?.();
  }

  if (targets == null) {
    throw new Error(
      `Target selection cancelled for ${action.label ?? action.id}.`
    );
  }

  if (targets.length !== 1) {
    throw new Error(
      `${action.label ?? action.id} requires exactly one target.`
    );
  }

  return targets[0];
}


/**
 * Resolve the canvas token representing the acting actor.
 */
function resolveFrameConnActorToken(
  actor
) {
  return (
    canvas?.tokens?.placeables
      ?.find(
        token =>
          token?.actor?.uuid === actor?.uuid ||
          token?.actor?.id === actor?.id
      ) ??
    frameConnSensorsApi
      .getSourceToken?.() ??
    null
  );
}


/**
 * Validate a selected target against the acting mech's Sensors.
 */
function assertFrameConnAdjacentTarget(
  actor,
  targetToken
) {
  const sourceToken =
    resolveFrameConnActorToken(
      actor
    );

  if (!sourceToken || !targetToken) {
    throw new Error(
      "Frame Conn could not resolve adjacency targeting geometry."
    );
  }

  const distance =
    frameConnSensorsApi.distance(
      sourceToken,
      targetToken
    );

  if (!Number.isFinite(distance) || distance > 1) {
    throw new Error(
      `${targetToken.name ?? "Selected target"} is not adjacent.`
    );
  }

  return Object.freeze({ sourceToken, targetToken, distance });
}


function nativeExecutionHitTarget(
  execution,
  targetActor
) {
  const targetUuid =
    targetActor?.uuid ??
    null;

  return (
    execution?.status === "succeeded" &&
    Array.isArray(execution?.result?.targets) &&
    execution.result.targets.some(result =>
      result?.hit === true &&
      (
        !targetUuid ||
        result?.target?.actorUuid === targetUuid
      )
    )
  );
}


function assertFrameConnNativeExecutionSucceeded(
  execution,
  label
) {
  if (execution?.status !== "succeeded") {
    const error = new Error(
      `${label} native execution did not succeed: ${execution?.status ?? "unknown"}`
    );
    error.nativeExecution = execution;
    throw error;
  }
  return execution;
}


function assertFrameConnTargetWithinSensors(
  actor,
  targetToken
) {
  const sourceToken =
    resolveFrameConnActorToken(
      actor
    );

  const sensorRange =
    Number(
      actor?.system?.sensor_range
    );

  if (
    !sourceToken ||
    !targetToken ||
    !Number.isFinite(sensorRange)
  ) {
    throw new Error(
      "Frame Conn could not resolve Sensors targeting geometry."
    );
  }

  const distance =
    frameConnSensorsApi.distance(
      sourceToken,
      targetToken
    );

  if (
    !Number.isFinite(distance) ||
    distance > sensorRange
  ) {
    throw new Error(
      `${targetToken.name ?? "Selected target"} is outside Sensors ${sensorRange}.`
    );
  }

  return Object.freeze({
    sourceToken,
    targetToken,
    sensorRange,
    distance
  });
}


async function executeFrameConnAuthoritativeLockOnRequest({
  requesterUserId = null,
  sceneId = null,
  sourceTokenId = null,
  targetTokenId = null,
  actingActorUuid = null
} = {}) {
  if (!game?.user?.isGM) {
    throw new Error(
      "Only a GM client may execute an authoritative Lock On mutation."
    );
  }

  const requester =
    game?.users?.get(
      requesterUserId
    ) ??
    null;

  if (!requester) {
    throw new Error(
      "Lock On authority request came from an unknown user."
    );
  }

  const scene =
    game?.scenes?.get(
      sceneId
    ) ??
    null;

  const sourceTokenDocument =
    scene?.tokens?.get(
      sourceTokenId
    ) ??
    null;

  const targetTokenDocument =
    scene?.tokens?.get(
      targetTokenId
    ) ??
    null;

  const sourceToken =
    sourceTokenDocument?.object ??
    null;

  const targetToken =
    targetTokenDocument?.object ??
    null;

  const sourceActor =
    sourceTokenDocument?.actor ??
    sourceToken?.actor ??
    null;

  const targetActor =
    targetTokenDocument?.actor ??
    targetToken?.actor ??
    null;

  if (
    !sourceActor ||
    !targetActor ||
    !sourceToken ||
    !targetToken
  ) {
    throw new Error(
      "The GM could not resolve the Lock On source and target tokens on the requested Scene."
    );
  }

  if (
    actingActorUuid &&
    sourceActor.uuid !== actingActorUuid
  ) {
    throw new Error(
      "Lock On authority request did not match the acting actor."
    );
  }

  if (
    typeof sourceActor.testUserPermission !==
      "function" ||
    !sourceActor.testUserPermission(
      requester,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    )
  ) {
    throw new Error(
      "The requesting user does not own the acting mech for Lock On."
    );
  }

  assertFrameConnTargetWithinSensors(
    sourceActor,
    targetToken
  );

  const statusResult =
    await frameConnNativeAdapterApi
      .applyStatus(
        targetActor,
        "lockon"
      );

  if (!statusResult?.active) {
    throw new Error(
      "Native Lock On application failed on the GM client."
    );
  }

  return statusResult;
}


/* ============================================================
   Canonical action execution composition
   ============================================================ */

/**
 * Runtime-level convergence point for actions migrated to the canonical
 * Frame Conn execution spine.
 *
 * Feature implementations provide semantic intent. This orchestrator only
 * composes registered feature APIs and does not import their implementation
 * modules directly.
 */
async function executeFrameConnCanonicalAction({
  actor = null,
  action = null,
  executionKind = null,
  executionOptions = null
} = {}) {
  if (!actor) {
    throw new TypeError(
      "Frame Conn canonical action execution requires an actor."
    );
  }

  if (!action?.id) {
    throw new TypeError(
      "Frame Conn canonical action execution requires an action with an id."
    );
  }

  const bridgeComposition =
    await frameConnSystemBridgeApi
      .resolveAndCompose({
        actorScopeId:
          actor.uuid ??
          actor.id ??
          null,

        actionId:
          action.id,

        registryId:
          action.id,

        name:
          action.label ??
          action.id,

        existingRegistryEntry:
          action,

        metadata: {
          executionKind
        }
      });

  if (
    !frameConnSystemBridgeApi
      .compositionSucceeded(
        bridgeComposition
      )
  ) {
    throw new Error(
      `Frame Conn System Bridge could not compose action: ${action.id}`
    );
  }

  if (
    frameConnSystemBridgeApi
      .compositionHasBlockingConflict(
        bridgeComposition
      )
  ) {
    throw new Error(
      `Frame Conn System Bridge found a blocking conflict for action: ${action.id}`
    );
  }

  const executionContext =
    await frameConnSemanticExecutionContextApi
      .buildExecutionContext({
        actor,

        semanticActionDefinition:
          action,

        semanticActionId:
          action.id,

        metadata: {
          executionKind,

          systemBridge: {
            status:
              bridgeComposition.status,

            runtimeDescriptor:
              frameConnSystemBridgeApi
                .getComposedRuntimeDescriptor(
                  bridgeComposition
                )
          }
        }
      });

  let transaction =
    null;

  switch (executionKind) {
    case "self-destruct": {
      const chosenRounds = Number(executionOptions?.rounds);
      if (!Number.isInteger(chosenRounds) || chosenRounds < 0 || chosenRounds > 2) {
        throw new Error("Self-Destruct requires a detonation timing of NOW, 1 ROUND, or 2 ROUNDS.");
      }

      if (chosenRounds > 0 && !globalThis.game?.combat?.started) {
        throw new Error("Delayed Self-Destruct requires an active combat so future activations can be tracked.");
      }

      transaction = await frameConnExecutionTransactionApi
        .runNativeExecutionTransactionWithGlobalHooks({
          context: executionContext,
          execute: async () => {
            if (chosenRounds === 0) {
              const result = await frameConnStatusOrchestrationApi.triggerReactorMeltdown(actor);
              if (!result) throw new Error("Immediate Self-Destruct failed to resolve the reactor explosion.");
              return result;
            }

            return frameConnStatusOrchestrationApi.scheduleReactorMeltdown(
              actor,
              chosenRounds - 1,
              { reason: "self-destruct", combat: globalThis.game?.combat }
            );
          },
          metadata: {
            actionId: action.id,
            executionKind,
            source: "action-execution",
            selfDestructRounds: chosenRounds,
            terminalResolution: "reactor-meltdown"
          }
        });
      break;
    }

    case "basic-attack": {
      if (action.requiresTarget) {
        await resolveFrameConnRequiredTarget(
          action
        );
      }

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context:
              executionContext,

            execute:
              ({
                context
              }) =>
                frameConnNativeAdapterApi
                  .executeBasicAttack({
                    actor:
                      frameConnSemanticExecutionContextApi
                        .getExecutionActor(
                          context
                        ) ??
                      actor,

                    title:
                      action.label ??
                      null
                  }),

            metadata: {
              actionId:
                action.id,

              executionKind,

              source:
                "action-execution"
            }
          });
      break;
    }

    case "hide": {
      if (actor?.system?.statuses?.hidden) {
        throw new Error(
          "Hide requires the acting mech to not already be Hidden."
        );
      }

      if (actor?.system?.statuses?.engaged) {
        throw new Error(
          "Hide cannot be taken while Engaged."
        );
      }

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const results =
                await frameConnStatusOrchestrationApi
                  .applyStatuses(actor, ["hidden"]);
              const applied = results?.[0];
              if (!applied?.active) {
                throw new Error("Native Hidden application failed.");
              }
              return applied;
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", nativeStatusId: "hidden" }
          });
      break;
    }

    case "ram": {
      const targetToken = await resolveFrameConnRequiredTarget(action);
      assertFrameConnAdjacentTarget(actor, targetToken);
      const targetActor = targetToken?.actor ?? null;
      if (!targetActor) throw new Error("Ram requires an authoritative target actor.");

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const execution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.executeBasicAttack({ actor, title: action.label ?? "Ram" }),
                "Ram"
              );
              if (nativeExecutionHitTarget(execution, targetActor)) {
                await frameConnStatusOrchestrationApi.applyStatuses(targetActor, ["prone"]);
              }
              return execution;
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", targetActorUuid: targetActor.uuid ?? null, postHitStatusId: "prone" }
          });
      break;
    }

    case "end-grapple": {
      const targetToken = await resolveFrameConnRequiredTarget(action);
      const targetActor = targetToken?.actor ?? null;
      if (!targetActor) throw new Error("End Grapple requires an authoritative grapple opponent.");
      if (!frameConnStatusOrchestrationApi.getGrappleBetween(actor, targetActor)) {
        throw new Error("The selected character is not in a tracked Grapple relationship with the acting mech.");
      }

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const escapeExecution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.rollStat({ actor, path: "hull", title: "End Grapple — HULL" }),
                "End Grapple HULL check"
              );
              const opposingExecution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.rollStat({ actor: targetActor, path: "hull", title: "Grapple Opposition — HULL" }),
                "Grapple opposing HULL check"
              );
              const escapeTotal = Number(escapeExecution?.result?.roll?.total);
              const opposingTotal = Number(opposingExecution?.result?.roll?.total);
              if (!Number.isFinite(escapeTotal) || !Number.isFinite(opposingTotal)) {
                throw new Error("End Grapple contested check did not produce native roll totals.");
              }
              const escaped = escapeTotal >= opposingTotal;
              if (escaped) {
                await frameConnStatusOrchestrationApi.endGrappleBetween(actor, targetActor);
              }
              return Object.freeze({ escapeExecution, opposingExecution, escaped, escapeTotal, opposingTotal });
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", targetActorUuid: targetActor.uuid ?? null, contestedCheck: "hull-vs-hull", successRemovesRelationship: "grapple" }
          });
      break;
    }

    case "grapple": {
      const targetToken = await resolveFrameConnRequiredTarget(action);
      assertFrameConnAdjacentTarget(actor, targetToken);
      const targetActor = targetToken?.actor ?? null;
      if (!targetActor) throw new Error("Grapple requires an authoritative target actor.");

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const execution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.executeBasicAttack({ actor, title: action.label ?? "Grapple" }),
                "Grapple"
              );
              if (nativeExecutionHitTarget(execution, targetActor)) {
                await frameConnStatusOrchestrationApi.establishGrapple(actor, targetActor);
              }
              return execution;
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", targetActorUuid: targetActor.uuid ?? null, statusRelationship: "grapple" }
          });
      break;
    }

    case "fragment-signal": {
      const targetToken = await resolveFrameConnRequiredTarget(action);
      assertFrameConnTargetWithinSensors(actor, targetToken);
      const targetActor = targetToken?.actor ?? null;
      if (!targetActor) throw new Error("Fragment Signal requires an authoritative target actor.");

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const execution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.executeBasicTechAttack({ actor, title: action.label ?? "Fragment Signal" }),
                "Fragment Signal"
              );
              if (nativeExecutionHitTarget(execution, targetActor)) {
                await frameConnStatusOrchestrationApi.applyUntilEndOfNextTurn(
                  targetActor,
                  ["impaired", "slow"],
                  { sourceActionId: action.id }
                );
              }
              return execution;
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", targetActorUuid: targetActor.uuid ?? null, postHitStatusIds: ["impaired", "slow"] }
          });
      break;
    }

    case "search": {
      const targetToken = await resolveFrameConnRequiredTarget(action);
      assertFrameConnTargetWithinSensors(actor, targetToken);
      const targetActor = targetToken?.actor ?? null;
      if (!targetActor) throw new Error("Search requires an authoritative target actor.");

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () => {
              const searchExecution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.rollStat({ actor, path: "sys", title: "Search — Systems" }),
                "Search Systems check"
              );
              const defenseExecution = assertFrameConnNativeExecutionSucceeded(
                await frameConnNativeAdapterApi.rollStat({ actor: targetActor, path: "agi", title: "Search Defense — Agility" }),
                "Search Agility defense"
              );
              const searchTotal = Number(searchExecution?.result?.roll?.total);
              const defenseTotal = Number(defenseExecution?.result?.roll?.total);
              if (!Number.isFinite(searchTotal) || !Number.isFinite(defenseTotal)) {
                throw new Error("Search contested check did not produce native roll totals.");
              }
              if (searchTotal >= defenseTotal) {
                await frameConnStatusOrchestrationApi.removeStatuses(targetActor, ["hidden"]);
              }
              return Object.freeze({ searchExecution, defenseExecution, succeeded: searchTotal >= defenseTotal, searchTotal, defenseTotal });
            },
            metadata: { actionId: action.id, executionKind, source: "action-execution", targetActorUuid: targetActor.uuid ?? null, contestedCheck: "sys-vs-agi", successRemovesStatusId: "hidden" }
          });
      break;
    }

    case "disengage": {
      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context: executionContext,
            execute: async () =>
              frameConnStatusOrchestrationApi.applyDisengage(actor),
            metadata: {
              actionId: action.id,
              executionKind,
              source: "action-execution",
              removesStatusId: "engaged",
              suppression: "through-end-of-current-turn"
            }
          });
      break;
    }

    case "lock-on": {
      const targetToken =
        await resolveFrameConnRequiredTarget(
          action
        );

      const targeting =
        assertFrameConnTargetWithinSensors(
          actor,
          targetToken
        );

      const targetActor =
        targetToken?.actor ??
        null;

      if (!targetActor) {
        throw new Error(
          "Lock On requires a target with an authoritative actor."
        );
      }

      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context:
              executionContext,

            execute:
              async () => {
                const statusResult =
                  await frameConnFoundryIntegrationApi
                    .requestLockOnApplication({
                      actor,
                      sourceToken:
                        targeting.sourceToken,
                      targetToken
                    });

                if (!statusResult?.active) {
                  throw new Error(
                    "Native Lock On application failed."
                  );
                }

                return statusResult;
              },

            metadata: {
              actionId:
                action.id,

              executionKind,

              source:
                "action-execution",

              targetActorUuid:
                targetActor.uuid ??
                null,

              targetTokenUuid:
                targetToken.document?.uuid ??
                targetToken.uuid ??
                null,

              targetDistance:
                targeting.distance,

              sensorRange:
                targeting.sensorRange,

              nativeStatusId:
                "lockon"
            }
          });
      break;
    }

    case "shut-down":
      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context:
              executionContext,

            execute:
              async ({
                context
              }) => {
                const executionActor =
                  frameConnSemanticExecutionContextApi
                    .getExecutionActor(
                      context
                    ) ??
                  actor;

                const statusResult =
                  await frameConnNativeAdapterApi
                    .applyStatus(
                      executionActor,
                      "shutdown"
                    );

                if (
                  !statusResult?.changed ||
                  !statusResult?.active
                ) {
                  throw new Error(
                    "Shut Down requires the acting mech to not already be Shut Down."
                  );
                }

                return statusResult;
              },

            metadata: {
              actionId:
                action.id,

              executionKind,

              source:
                "action-execution",

              nativeStatusId:
                "shutdown"
            }
          });
      break;

    case "boot-up":
      transaction =
        await frameConnExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context:
              executionContext,

            execute:
              async ({
                context
              }) => {
                const executionActor =
                  frameConnSemanticExecutionContextApi
                    .getExecutionActor(
                      context
                    ) ??
                  actor;

                const statusResult =
                  await frameConnNativeAdapterApi
                    .removeStatus(
                      executionActor,
                      "shutdown"
                    );

                if (
                  !statusResult?.changed ||
                  statusResult?.active
                ) {
                  throw new Error(
                    "Boot Up requires the acting mech to be Shut Down."
                  );
                }

                return statusResult;
              },

            metadata: {
              actionId:
                action.id,

              executionKind,

              source:
                "action-execution",

              nativeStatusId:
                "shutdown"
            }
          });
      break;

    default:
      throw new Error(
        `Frame Conn canonical execution kind is not implemented: ${String(executionKind)}`
      );
  }

  if (
    transaction?.status !==
    "succeeded"
  ) {
    const error =
      new Error(
        `Frame Conn canonical action execution did not succeed: ${transaction?.status ?? "unknown"}`
      );

    error.executionTransaction =
      transaction;

    throw error;
  }

  return transaction;
}


/* ============================================================
   Cross-feature runtime bindings
   ============================================================ */

/**
 * Extracted domains still consume a small number of capabilities
 * belonging to other domains.
 *
 * Keep those relationships explicit here rather than allowing
 * feature implementations to import one another directly.
 */
function configureFrameConnRuntimeBindings() {
  /* ----------------------------------------------------------
     Turn bindings
     ---------------------------------------------------------- */

  /**
   * Turn consumes the canonical Actions registry and requests
   * Application rendering when turn-visible state changes.
   */
  frameConnTurnApi
    .configureRuntime?.({
      getActionRegistry:
        () =>
          frameConnActionRegistry,

      renderApplication:
        force =>
          renderFrameConnApplication(
            force
          )
    });


  /* ----------------------------------------------------------
     Movement bindings
     ---------------------------------------------------------- */

  /**
   * Movement interprets Foundry token movement and elevation
   * changes against the authoritative Turn state.
   *
   * Movement accounting remains transitional inside
   * FrameConnTurnState.
   */
  frameConnMovementApi
    .configureRuntime?.({
      getTurnState:
        () =>
          getFrameConnTurnState(),

      renderApplication:
        force =>
          renderFrameConnApplication(
            force
          )
    });


  /* ----------------------------------------------------------
     Foundry Integration bindings
     ---------------------------------------------------------- */

  /**
   * Foundry Integration owns the settings and scene-control
   * surfaces which open and close the primary Frame Conn
   * application.
   *
   * Application ownership itself remains with ui-application.
   */
  frameConnFoundryIntegrationApi
    .configureRuntime?.({
      openApplication:
        (...args) =>
          openFrameConn(
            ...args
          ),

      closeApplication:
        (...args) =>
          closeFrameConn(
            ...args
          ),

      applyApplicationPresentationMode:
        mode =>
          frameConnApplicationApi
            .setPresentationMode?.(
              mode
            ),

      executeLockOnAuthorityRequest:
        request =>
          executeFrameConnAuthoritativeLockOnRequest(
            request
          )
    });


  /* ----------------------------------------------------------
     System Bridge bindings
     ---------------------------------------------------------- */

  /**
   * System Bridge resolves the existing universal Actions catalog through
   * an injected adapter so the bridge remains independent of the concrete
   * registry implementation.
   */
  frameConnSystemBridgeApi
    .configureRuntime?.({
      existingRegistryResolverAdapter:
        Object.freeze({
          getById:
            registryId =>
              frameConnActionRegistry
                .get(
                  registryId
                ),

          findByActionId:
            actionId =>
              frameConnActionRegistry
                .get(
                  actionId
                ),

          findByName:
            name =>
              frameConnActionRegistry
                .list({
                  includeHidden:
                    true
                })
                .find(
                  action =>
                    action.label ===
                    name
                ) ??
              null
        })
    });


  /* ----------------------------------------------------------
     Status Orchestration bindings
     ---------------------------------------------------------- */

  frameConnStatusOrchestrationApi
    .configureRuntime?.({
      applyStatus:
        (actor, statusId) =>
          frameConnNativeAdapterApi.applyStatus(actor, statusId),

      removeStatus:
        (actor, statusId) =>
          frameConnNativeAdapterApi.removeStatus(actor, statusId),

      distance:
        (sourceToken, targetToken) =>
          frameConnSensorsApi.distance(sourceToken, targetToken),

      installNativeFlowStepBefore:
        options =>
          frameConnNativeAdapterApi
            .installFlowStepBefore(
              options
            )
    });


  /* ----------------------------------------------------------
     Action Execution bindings
     ---------------------------------------------------------- */

  /**
   * Migrated actions enter the canonical execution spine through this one
   * runtime-composed command. Action Execution itself remains unaware of
   * System Bridge, Execution Context, Transaction, and Native Adapter
   * implementation modules.
   */
  frameConnActionExecutionApi
    .configureRuntime?.({
      executeCanonicalAction:
        options =>
          executeFrameConnCanonicalAction(
            options
          ),

      resolveRequiredTarget:
        action =>
          resolveFrameConnRequiredTarget(
            action
          )
    });


  /* ----------------------------------------------------------
     Brace bindings
     ---------------------------------------------------------- */

  frameConnBraceApi
    .configureRuntime?.({
      canUseReaction:
        (...args) =>
          frameConnTurnApi
            .canUseReactionForActor(
              ...args
            ),

      useReaction:
        (...args) =>
          frameConnTurnApi
            .useReactionForActor(
              ...args
            ),

      releaseReaction:
        (...args) =>
          frameConnTurnApi
            .releaseReactionForActor(
              ...args
            ),

      setReactionLock:
        (...args) =>
          frameConnTurnApi
            .setReactionLockForActor(
              ...args
            ),

      applyTurnRestriction:
        actor =>
          frameConnTurnApi
            .applyBraceRestriction(
              actor
            ),

      installNativeFlowStepBefore:
        options =>
          frameConnNativeAdapterApi
            .installFlowStepBefore(
              options
            )
    });


  /* ----------------------------------------------------------
     Turn UI bindings
     ---------------------------------------------------------- */

  /**
   * Turn UI consumes authoritative Turn state, canonical Actions
   * metadata, and Application rendering through explicit runtime
   * composition. The Application's canonical committed-plan
   * presentation depends on these bindings during getData().
   */
  frameConnTurnUiApi
    .configureRuntime?.({
      getTurnApi:
        () =>
          frameConnTurnApi,

      getActionRegistry:
        () =>
          frameConnActionRegistry,

      renderApplication:
        force =>
          renderFrameConnApplication(
            force
          )
    });


  /* ----------------------------------------------------------
     Movement UI bindings
     ---------------------------------------------------------- */

  /**
   * Movement UI consumes the registered Movement feature,
   * authoritative Turn state, and Application rendering through
   * explicit runtime composition.
   */
  frameConnMovementUiApi
    .configureRuntime?.({
      getMovementApi:
        () =>
          frameConnMovementApi,

      getTurnApi:
        () =>
          frameConnTurnApi,

      renderApplication:
        force =>
          renderFrameConnApplication(
            force
          )
    });


  /* ----------------------------------------------------------
     Application UI bindings
     ---------------------------------------------------------- */

  /**
   * Application UI consumes:
   *
   *   - the canonical Actions registry
   *   - authoritative Turn state
   *   - the Turn state manager
   *   - Action Execution
   *
   * Action workflow implementation now belongs entirely to:
   *
   *   scripts/action-execution-feature.js
   */
  frameConnApplicationApi
    .configureRuntime?.({
      getActionRegistry:
        () =>
          frameConnActionRegistry,

      getTurnState:
        () =>
          getFrameConnTurnState(),

      getTurnStateManager:
        () =>
          getFrameConnTurnStateManager(),

      executeAction:
        (
          actor,
          action
        ) =>
          frameConnActionExecutionApi
            .execute(
              actor,
              action
            )
    });


  frameConnTargetingSpatialApi.configureRuntime?.({
    queryAdapter: frameConnFoundryIntegrationApi.createTargetingSpatialQueryAdapter()
  });

  frameConnSitrepsApi.configureRuntime?.({
    spatialOperations: Object.freeze({
      resolveRegion: options => frameConnFoundryIntegrationApi.resolveSceneRegion(options),
      tokenInsideRegion: (tokenDocument, region) => frameConnFoundryIntegrationApi.tokenInsideRegion(tokenDocument, region),
      tokensAreAdjacent: async (firstToken, secondToken) => Boolean((await frameConnTargetingSpatialApi.queryAdjacency(firstToken, secondToken))?.adjacent)
    }),
    publishOutputIntent: intent => frameConnFoundryIntegrationApi.publishSemanticOutputIntent(intent),
    canManageSitreps: () => frameConnFoundryIntegrationApi.isPrimaryGM()
  });

  frameConnDmApplicationApi.configureRuntime?.({
    sitrepsApi: frameConnSitrepsApi,
    foundryApi: frameConnFoundryIntegrationApi
  });



  /**
   * Lifecycle and Targeting / Spatial are now canonical registered
   * features and are resolved here through the registry like every
   * other runtime domain.
   *
   * Their external adapters are intentionally not invented here.
   * They remain inactive until the native/system execution layers
   * that own those adapters are themselves composed into the
   * registered runtime graph.
   */
}


/* ============================================================
   Runtime composition validation
   ============================================================ */

function assertFrameConnRuntimeBindings(
  label,
  runtimeBindings,
  requiredKeys
) {
  const state =
    typeof runtimeBindings ===
      "function"
      ? runtimeBindings()
      : null;


  for (
    const key
    of requiredKeys
  ) {
    if (
      !state?.[
        key
      ]
    ) {
      throw new Error(
        `Frame Conn | Runtime composition incomplete: ${label}.${key}`
      );
    }
  }


  return state;
}


function validateFrameConnRuntimeComposition() {
  assertFrameConnRuntimeBindings(
    "Turn",
    frameConnTurnApi.runtimeBindings,
    [
      "actionRegistry",
      "applicationRendering"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Movement",
    frameConnMovementApi.runtimeBindings,
    [
      "turnState",
      "applicationRendering"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Foundry Integration",
    frameConnFoundryIntegrationApi.runtimeBindings,
    [
      "applicationOpening",
      "applicationClosing",
      "applicationPresentationMode",
      "lockOnAuthorityExecution"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Action Execution",
    frameConnActionExecutionApi.runtimeBindings,
    [
      "executeCanonicalAction"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Status Orchestration",
    frameConnStatusOrchestrationApi.runtimeBindings,
    [
      "statusApplication",
      "statusRemoval",
      "spatialDistance",
      "nativeFlowExtension"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Brace",
    frameConnBraceApi.runtimeBindings,
    [
      "reactionAvailability",
      "reactionSpending",
      "reactionRollback",
      "reactionLocking",
      "turnRestriction",
      "nativeFlowExtension"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Turn UI",
    frameConnTurnUiApi.runtimeBindings,
    [
      "turn",
      "actions",
      "applicationRendering"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Movement UI",
    frameConnMovementUiApi.runtimeBindings,
    [
      "movement",
      "turn",
      "applicationRendering"
    ]
  );

  assertFrameConnRuntimeBindings(
    "Application UI",
    frameConnApplicationApi.runtimeBindings,
    [
      "actionRegistry",
      "turnState",
      "turnStateManager",
      "canonicalActionExecution"
    ]
  );

  assertFrameConnRuntimeBindings("Targeting / Spatial", frameConnTargetingSpatialApi.runtimeBindings, ["queryAdapter"]);
  assertFrameConnRuntimeBindings("DM SITREPs", frameConnSitrepsApi.diagnostics, ["spatialConfigured", "outputPublisherConfigured", "authorizationConfigured"]);
  assertFrameConnRuntimeBindings("DM Application", frameConnDmApplicationApi.runtimeBindings, ["sitreps", "foundry"]);

  return true;
}


/* ============================================================
   Foundry lifecycle
   ============================================================ */

/**
 * Startup boundaries remain orchestration concerns.
 *
 * Feature-owned implementation is invoked through registered
 * feature APIs rather than being implemented here.
 */

Hooks.once(
  "init",
  () => {
    console.log(
      `${MODULE_TITLE} | Initializing.`
    );


    /**
     * Establish explicit cross-feature runtime dependencies before
     * feature-owned startup work or hooks consume those surfaces.
     *
     * This currently configures:
     *
     *   - Turn
     *   - Movement
     *   - Foundry Integration
     *   - Application UI
     *
     * System Bridge now receives the existing Actions-registry resolver.
     * Action Execution now receives the canonical execution command, and
     * Application UI receives Action Execution through its canonical
     * executeAction binding.
     *
     * Lifecycle and Targeting / Spatial remain registry-resolved but await
     * their authoritative external adapters before feature lifecycle
     * activation.
     */
    configureFrameConnRuntimeBindings();

    validateFrameConnRuntimeComposition();

    frameConnElevationLosApi.initialize?.();


    /**
     * Foundry Integration owns module-setting definitions.
     *
     * The runtime retains responsibility only for choosing the
     * Foundry startup boundary at which they are registered.
     */
    frameConnFoundryIntegrationApi
      .registerSettings?.();

    void frameConnApplicationApi
      .setPresentationMode?.(
        frameConnFoundryIntegrationApi
          .getPresentationMode?.() ??
        "window"
      );


    /**
     * Actions retain synchronous catalog initialization during
     * the current migration.
     */
    initializeFrameConnActionRegistry();


    /**
     * All extracted domains have already been registered by
     * feature-registry.js.
     */
    frameConnFeatureRegistry
      .validateDependencies();


    /**
     * Install feature-owned Foundry hooks only after runtime bindings,
     * settings registration, Actions initialization, and dependency
     * validation have completed.
     *
     * This restores the known-good startup ordering used by the working
     * d0cd008 runtime and prevents Foundry Integration hooks from reading
     * module settings before those settings exist.
     */
    frameConnFeatureRegistry
      .installHooks();

  }
);


Hooks.once(
  "ready",
  async () => {
    frameConnElevationLosApi.ready?.();

    frameConnFoundryIntegrationApi
      .registerSocket?.();

    await frameConnBraceApi
      .initializeRuntime?.();


    game.lancerFrameConn = {
      open:
        openFrameConn,

      close:
        closeFrameConn,


      /* --------------------------------------------------------
         Application
         -------------------------------------------------------- */

      get application() {
        return (
          frameConnApplicationApi
            .getApplication?.() ??
          null
        );
      },


      /* --------------------------------------------------------
         Feature graph
         -------------------------------------------------------- */

      registry:
        frameConnActionRegistry,

      features:
        frameConnFeatureRegistry,


      /* --------------------------------------------------------
         Foundry integration
         -------------------------------------------------------- */

      foundry:
        frameConnFoundryIntegrationApi,

      elevationLOS:
        frameConnElevationLosApi,


      /* --------------------------------------------------------
         Action execution
         -------------------------------------------------------- */

      actionExecution:
        frameConnActionExecutionApi,


      /* --------------------------------------------------------
         Canonical execution spine
         -------------------------------------------------------- */

      systemBridge:
        frameConnSystemBridgeApi,

      semanticExecutionContext:
        frameConnSemanticExecutionContextApi,

      executionTransaction:
        frameConnExecutionTransactionApi,

      nativeAdapter:
        frameConnNativeAdapterApi,

      brace:
        frameConnBraceApi,


      /* --------------------------------------------------------
         Lifecycle
         -------------------------------------------------------- */

      lifecycle:
        frameConnLifecycleApi,


      /* --------------------------------------------------------
         Targeting / spatial
         -------------------------------------------------------- */

      targetingSpatial:
        frameConnTargetingSpatialApi,

      sitreps:
        frameConnSitrepsApi,

      dm: Object.freeze({
        application: frameConnDmApplicationApi,
        open: (...args) => frameConnDmApplicationApi.open(...args),
        close: (...args) => frameConnDmApplicationApi.close(...args)
      }),


      /* --------------------------------------------------------
         Turn
         -------------------------------------------------------- */

      turn: {
        begin:
          context => {
            return (
              frameConnTurnApi
                .begin(
                  context
                )
            );
          },


        ensure:
          context => {
            return (
              frameConnTurnApi
                .ensure(
                  context
                )
            );
          },


        end:
          () => {
            return (
              frameConnTurnApi
                .end()
            );
          },


        clear:
          () => {
            return (
              frameConnTurnApi
                .clear()
            );
          },


        sync:
          combat => {
            return (
              frameConnTurnApi
                .sync(
                  combat
                )
            );
          },


        get current() {
          return (
            getFrameConnTurnState()
          );
        },


        get state() {
          return (
            frameConnTurnApi
              .snapshot?.() ??
            null
          );
        },


        canUse:
          (
            actionId,
            options
          ) => {
            return (
              frameConnTurnApi
                .canUse(
                  actionId,
                  options
                )
            );
          },


        use:
          (
            actionId,
            options
          ) => {
            return (
              frameConnTurnApi
                .use(
                  actionId,
                  options
                )
            );
          },


        move:
          distance => {
            return (
              frameConnTurnApi
                .move(
                  distance
                )
            );
          },


        setSpeed:
          speed => {
            return (
              frameConnTurnApi
                .setSpeed(
                  speed
                )
            );
          },


        overcharge:
          options => {
            return (
              frameConnTurnApi
                .overcharge(
                  options
                )
            );
          }
      },


      /* --------------------------------------------------------
         Movement
         -------------------------------------------------------- */

      /**
       * Movement's main behavior is automatic and hook-driven.
       *
       * Its API remains exposed for measurement, diagnostics, and
       * development inspection.
       */
      movement:
        frameConnMovementApi,


      /* --------------------------------------------------------
         Actions
         -------------------------------------------------------- */

      actions: {
        get:
          id =>
            frameConnActionRegistry
              .get(
                id
              ),


        list:
          options =>
            frameConnActionRegistry
              .list(
                options
              ),


        roots:
          (
            category,
            options
          ) =>
            frameConnActionRegistry
              .roots(
                category,
                options
              ),


        childrenOf:
          (
            parentId,
            options
          ) =>
            frameConnActionRegistry
              .childrenOf(
                parentId,
                options
              ),


        categories:
          options =>
            frameConnActionRegistry
              .listCategories(
                options
              ),


        register:
          action =>
            frameConnActionRegistry
              .register(
                action
              )
      }
    };


    /**
     * Synchronize immediately with an already-running combat.
     *
     * Subsequent combat changes are owned by turn-feature.js.
     */
    frameConnTurnApi
      .sync?.(
        game.combat
      );


    console.log(
      `${MODULE_TITLE} | Ready.`
    );
  }
);


/* ============================================================
   Extracted feature domains
   ============================================================ */

/**
 * ACTIONS
 *
 *   scripts/actions-feature.js
 *
 * Owns:
 *   - Action registry implementation
 *   - Action categories
 *   - Universal actions
 *   - Catalog initialization
 *
 *
 * SENSORS
 *
 *   scripts/sensors-feature.js
 *
 * Owns:
 *   - Sensor contacts
 *   - Sensor-source resolution
 *   - Sensor measurement
 *   - Sensor overlay behavior
 *   - Sensor hooks
 *
 *
 * TURN
 *
 *   scripts/turn-feature.js
 *
 * Owns:
 *   - FrameConnTurnState
 *   - FrameConnTurnStateManager
 *   - Canonical turn-state instance
 *   - Action-budget legality
 *   - Protocol state
 *   - Reaction state
 *   - Overcharge turn state
 *   - Committed-action state
 *   - Turn history
 *   - Turn snapshots
 *   - Combat-turn context resolution
 *   - Combat synchronization
 *   - Combat-specific Foundry hooks
 *
 *
 * MOVEMENT
 *
 *   scripts/movement-feature.js
 *
 * Owns:
 *   - Movement-token identity matching
 *   - Foundry movement-point normalization
 *   - Movement-path collection
 *   - Foundry movement-distance extraction
 *   - Movement-path measurement
 *   - Movement-distance rounding
 *   - Automatic Boost notifications
 *   - moveToken handling
 *   - Elevation-origin tracking
 *   - Elevation-change interpretation
 *   - Elevation movement handling
 *   - Movement-specific Foundry hooks
 *
 * Transitional relationship:
 *
 *   FrameConnTurnState still contains the authoritative movement
 *   accounting methods consumed by Movement.
 *
 *
 * FOUNDRY INTEGRATION
 *
 *   scripts/foundry-integration-feature.js
 *
 * Owns:
 *   - Module settings registration
 *   - Enabled-state integration
 *   - Token scene-control integration
 *   - Frame Conn scene-control tool declaration
 *   - getSceneControlButtons hook behavior
 *
 * Does not own:
 *   - Foundry init boundary
 *   - Foundry ready boundary
 *   - Global feature-hook installation
 *
 *
 * ACTION EXECUTION
 *
 *   scripts/action-execution-feature.js
 *
 * Owns:
 *   - No-roll action classification
 *   - Action execution-kind resolution
 *   - Mech-stat selection dialog
 *   - Actor workflow delegation
 *   - Universal action-roll execution
 *
 * Does not own:
 *   - Action registration
 *   - Action legality
 *   - Turn action-budget mutation
 *   - Actor workflow implementation
 *   - Application rendering
 *
 *
 * LIFECYCLE
 *
 *   scripts/feature_lifecycle/lifecycle-feature.js
 *
 * Owns through lifecycle_service:
 *   - Lifecycle descriptor/state access façade
 *   - Lifecycle registration and dispatch façade
 *   - Semantic lifecycle integration boundary
 *
 * Runtime adapter implementation remains externally composed.
 *
 *
 * TARGETING / SPATIAL
 *
 *   scripts/feature_targeting_spatial/targeting-spatial-feature.js
 *
 * Owns through targeting-spatial_service:
 *   - Spatial query façade
 *   - Target acquisition façade
 *   - Target validation façade
 *   - Execution-transaction targeting hook façade
 *
 * Native query/acquisition and bridge augmentation adapters remain
 * externally composed.
 *
 *
 * APPLICATION UI
 *
 *   styles/ui-application.js
 *
 * Owns:
 *   - FrameConnApplication
 *   - Application singleton
 *   - Application open/close behavior
 *   - Main UI rendering
 *   - Controlled-token UI access
 *   - Application refresh behavior
 *   - Application-owned Foundry hooks
 *
 *
 * All executable feature domains are declared through:
 *
 *   scripts/feature-registry.js
 *
 * Registry mechanics themselves are owned by:
 *
 *   scripts/feature-registry-core.js
 *
 * Runtime/domain features are registered through:
 *
 *   FRAME_CONN_RUNTIME_FEATURES
 *
 * Executable UI features are supplied through:
 *
 *   styles/ui-registry.js
 *
 * runtime-orchestrator.js imports only:
 *
 *   frameConnFeatureRegistry
 *
 * and resolves extracted behavior through registered APIs.
 */