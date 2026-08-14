/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/runtime-orchestrator.js
 */


/**
 * ============================================================
 * FRAME HELM RUNTIME ORCHESTRATOR
 * ============================================================
 *
 * ROLE:
 *   Provides the authoritative Foundry startup, runtime
 *   composition, and cross-feature orchestration surface for
 *   Frame Helm.
 *
 * PURPOSE:
 *   Compose registered Frame Helm features while retaining only
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
 *   - Public game.lancerFrameHelm composition
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
 *   - FrameHelmApplication
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
  frameHelmFeatureRegistry
} from "./feature-registry.js";


/* ============================================================
   Module identity
   ============================================================ */

const MODULE_TITLE =
  "Lancer: Frame Helm";


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

const frameHelmActionsApi =
  frameHelmFeatureRegistry.getApi(
    "actions"
  );


if (
  !frameHelmActionsApi
) {
  throw new Error(
    "Frame Helm | The registered Actions feature API could not be resolved."
  );
}


const frameHelmActionRegistry =
  frameHelmActionsApi.registry;


const initializeFrameHelmActionRegistry =
  frameHelmActionsApi.initialize;


/* ------------------------------------------------------------
   Turn
   ------------------------------------------------------------ */

const frameHelmTurnApi =
  frameHelmFeatureRegistry.getApi(
    "turn"
  );


if (
  !frameHelmTurnApi
) {
  throw new Error(
    "Frame Helm | The registered Turn feature API could not be resolved."
  );
}


/**
 * Transitional accessor used by extracted features which still
 * consume the mutable Turn state model.
 *
 * Turn-state ownership belongs entirely to turn-feature.js.
 */
function getFrameHelmTurnState() {
  return (
    frameHelmTurnApi
      .getCurrent?.() ??
    frameHelmTurnApi
      .current ??
    null
  );
}


/**
 * Resolve the canonical Turn state manager when exposed by the
 * feature.
 */
function getFrameHelmTurnStateManager() {
  return (
    frameHelmTurnApi
      .getManager?.() ??
    frameHelmTurnApi
      .manager ??
    null
  );
}


/* ------------------------------------------------------------
   Movement
   ------------------------------------------------------------ */

const frameHelmMovementApi =
  frameHelmFeatureRegistry.getApi(
    "movement"
  );


if (
  !frameHelmMovementApi
) {
  throw new Error(
    "Frame Helm | The registered Movement feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Foundry integration
   ------------------------------------------------------------ */

const frameHelmFoundryIntegrationApi =
  frameHelmFeatureRegistry.getApi(
    "foundry-integration"
  );


if (
  !frameHelmFoundryIntegrationApi
) {
  throw new Error(
    "Frame Helm | The registered Foundry Integration feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Action execution
   ------------------------------------------------------------ */

const frameHelmActionExecutionApi =
  frameHelmFeatureRegistry.getApi(
    "action-execution"
  );


if (
  !frameHelmActionExecutionApi
) {
  throw new Error(
    "Frame Helm | The registered Action Execution feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Lifecycle
   ------------------------------------------------------------ */

const frameHelmLifecycleApi =
  frameHelmFeatureRegistry.getApi(
    "lifecycle"
  );


if (
  !frameHelmLifecycleApi
) {
  throw new Error(
    "Frame Helm | The registered Lifecycle feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Targeting / spatial
   ------------------------------------------------------------ */

const frameHelmTargetingSpatialApi =
  frameHelmFeatureRegistry.getApi(
    "targeting-spatial"
  );


if (
  !frameHelmTargetingSpatialApi
) {
  throw new Error(
    "Frame Helm | The registered Targeting / Spatial feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   System Bridge
   ------------------------------------------------------------ */

const frameHelmSystemBridgeApi =
  frameHelmFeatureRegistry.getApi(
    "system-bridge"
  );


if (
  !frameHelmSystemBridgeApi
) {
  throw new Error(
    "Frame Helm | The registered System Bridge feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Semantic Execution Context
   ------------------------------------------------------------ */

const frameHelmSemanticExecutionContextApi =
  frameHelmFeatureRegistry.getApi(
    "semantic-execution-context"
  );


if (
  !frameHelmSemanticExecutionContextApi
) {
  throw new Error(
    "Frame Helm | The registered Semantic Execution Context feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Execution Transaction
   ------------------------------------------------------------ */

const frameHelmExecutionTransactionApi =
  frameHelmFeatureRegistry.getApi(
    "execution-transaction"
  );


if (
  !frameHelmExecutionTransactionApi
) {
  throw new Error(
    "Frame Helm | The registered Execution Transaction feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Native Adapter
   ------------------------------------------------------------ */

const frameHelmNativeAdapterApi =
  frameHelmFeatureRegistry.getApi(
    "native-adapter"
  );


if (
  !frameHelmNativeAdapterApi
) {
  throw new Error(
    "Frame Helm | The registered Native Adapter feature API could not be resolved."
  );
}


/* ------------------------------------------------------------
   Application UI
   ------------------------------------------------------------ */

const frameHelmApplicationApi =
  frameHelmFeatureRegistry.getApi(
    "ui-application"
  );


if (
  !frameHelmApplicationApi
) {
  throw new Error(
    "Frame Helm | The registered Application UI feature API could not be resolved."
  );
}


const openFrameHelm =
  (...args) =>
    frameHelmApplicationApi
      .open(
        ...args
      );


const closeFrameHelm =
  (...args) =>
    frameHelmApplicationApi
      .close(
        ...args
      );


function renderFrameHelmApplication(
  force = false
) {
  return (
    frameHelmApplicationApi
      .render?.(
        force
      ) ??
    null
  );
}


/* ============================================================
   Canonical action execution composition
   ============================================================ */

/**
 * Runtime-level convergence point for actions migrated to the canonical
 * Frame Helm execution spine.
 *
 * Feature implementations provide semantic intent. This orchestrator only
 * composes registered feature APIs and does not import their implementation
 * modules directly.
 */
async function executeFrameHelmCanonicalAction({
  actor = null,
  action = null,
  executionKind = null
} = {}) {
  if (!actor) {
    throw new TypeError(
      "Frame Helm canonical action execution requires an actor."
    );
  }

  if (!action?.id) {
    throw new TypeError(
      "Frame Helm canonical action execution requires an action with an id."
    );
  }

  const bridgeComposition =
    await frameHelmSystemBridgeApi
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
    !frameHelmSystemBridgeApi
      .compositionSucceeded(
        bridgeComposition
      )
  ) {
    throw new Error(
      `Frame Helm System Bridge could not compose action: ${action.id}`
    );
  }

  if (
    frameHelmSystemBridgeApi
      .compositionHasBlockingConflict(
        bridgeComposition
      )
  ) {
    throw new Error(
      `Frame Helm System Bridge found a blocking conflict for action: ${action.id}`
    );
  }

  const executionContext =
    await frameHelmSemanticExecutionContextApi
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
              frameHelmSystemBridgeApi
                .getComposedRuntimeDescriptor(
                  bridgeComposition
                )
          }
        }
      });

  let transaction =
    null;

  switch (executionKind) {
    case "basic-attack":
      transaction =
        await frameHelmExecutionTransactionApi
          .runNativeExecutionTransactionWithGlobalHooks({
            context:
              executionContext,

            execute:
              ({
                context
              }) =>
                frameHelmNativeAdapterApi
                  .executeBasicAttack({
                    actor:
                      frameHelmSemanticExecutionContextApi
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

    default:
      throw new Error(
        `Frame Helm canonical execution kind is not implemented: ${String(executionKind)}`
      );
  }

  if (
    transaction?.status !==
    "succeeded"
  ) {
    const error =
      new Error(
        `Frame Helm canonical action execution did not succeed: ${transaction?.status ?? "unknown"}`
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
function configureFrameHelmRuntimeBindings() {
  /* ----------------------------------------------------------
     Turn bindings
     ---------------------------------------------------------- */

  /**
   * Turn consumes the canonical Actions registry and requests
   * Application rendering when turn-visible state changes.
   */
  frameHelmTurnApi
    .configureRuntime?.({
      getActionRegistry:
        () =>
          frameHelmActionRegistry,

      renderApplication:
        force =>
          renderFrameHelmApplication(
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
   * FrameHelmTurnState.
   */
  frameHelmMovementApi
    .configureRuntime?.({
      getTurnState:
        () =>
          getFrameHelmTurnState(),

      renderApplication:
        force =>
          renderFrameHelmApplication(
            force
          )
    });


  /* ----------------------------------------------------------
     Foundry Integration bindings
     ---------------------------------------------------------- */

  /**
   * Foundry Integration owns the settings and scene-control
   * surfaces which open and close the primary Frame Helm
   * application.
   *
   * Application ownership itself remains with ui-application.
   */
  frameHelmFoundryIntegrationApi
    .configureRuntime?.({
      openApplication:
        (...args) =>
          openFrameHelm(
            ...args
          ),

      closeApplication:
        (...args) =>
          closeFrameHelm(
            ...args
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
  frameHelmSystemBridgeApi
    .configureRuntime?.({
      existingRegistryResolverAdapter:
        Object.freeze({
          getById:
            registryId =>
              frameHelmActionRegistry
                .get(
                  registryId
                ),

          findByActionId:
            actionId =>
              frameHelmActionRegistry
                .get(
                  actionId
                ),

          findByName:
            name =>
              frameHelmActionRegistry
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
     Action Execution bindings
     ---------------------------------------------------------- */

  /**
   * Migrated actions enter the canonical execution spine through this one
   * runtime-composed command. Action Execution itself remains unaware of
   * System Bridge, Execution Context, Transaction, and Native Adapter
   * implementation modules.
   */
  frameHelmActionExecutionApi
    .configureRuntime?.({
      executeCanonicalAction:
        options =>
          executeFrameHelmCanonicalAction(
            options
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
  frameHelmApplicationApi
    .configureRuntime?.({
      getActionRegistry:
        () =>
          frameHelmActionRegistry,

      getTurnState:
        () =>
          getFrameHelmTurnState(),

      getTurnStateManager:
        () =>
          getFrameHelmTurnStateManager(),

      executeAction:
        (
          actor,
          action
        ) =>
          frameHelmActionExecutionApi
            .execute(
              actor,
              action
            )
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
    configureFrameHelmRuntimeBindings();


    /**
     * Foundry Integration owns module-setting definitions.
     *
     * The runtime retains responsibility only for choosing the
     * Foundry startup boundary at which they are registered.
     */
    frameHelmFoundryIntegrationApi
      .registerSettings?.();


    /**
     * Actions retain synchronous catalog initialization during
     * the current migration.
     */
    initializeFrameHelmActionRegistry();


    /**
     * All extracted domains have already been registered by
     * feature-registry.js.
     */
    frameHelmFeatureRegistry
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
    frameHelmFeatureRegistry
      .installHooks();

  }
);


Hooks.once(
  "ready",
  () => {
    game.lancerFrameHelm = {
      open:
        openFrameHelm,

      close:
        closeFrameHelm,


      /* --------------------------------------------------------
         Application
         -------------------------------------------------------- */

      get application() {
        return (
          frameHelmApplicationApi
            .getApplication?.() ??
          null
        );
      },


      /* --------------------------------------------------------
         Feature graph
         -------------------------------------------------------- */

      registry:
        frameHelmActionRegistry,

      features:
        frameHelmFeatureRegistry,


      /* --------------------------------------------------------
         Foundry integration
         -------------------------------------------------------- */

      foundry:
        frameHelmFoundryIntegrationApi,


      /* --------------------------------------------------------
         Action execution
         -------------------------------------------------------- */

      actionExecution:
        frameHelmActionExecutionApi,


      /* --------------------------------------------------------
         Canonical execution spine
         -------------------------------------------------------- */

      systemBridge:
        frameHelmSystemBridgeApi,

      semanticExecutionContext:
        frameHelmSemanticExecutionContextApi,

      executionTransaction:
        frameHelmExecutionTransactionApi,

      nativeAdapter:
        frameHelmNativeAdapterApi,


      /* --------------------------------------------------------
         Lifecycle
         -------------------------------------------------------- */

      lifecycle:
        frameHelmLifecycleApi,


      /* --------------------------------------------------------
         Targeting / spatial
         -------------------------------------------------------- */

      targetingSpatial:
        frameHelmTargetingSpatialApi,


      /* --------------------------------------------------------
         Turn
         -------------------------------------------------------- */

      turn: {
        begin:
          context => {
            return (
              frameHelmTurnApi
                .begin(
                  context
                )
            );
          },


        ensure:
          context => {
            return (
              frameHelmTurnApi
                .ensure(
                  context
                )
            );
          },


        end:
          () => {
            return (
              frameHelmTurnApi
                .end()
            );
          },


        clear:
          () => {
            return (
              frameHelmTurnApi
                .clear()
            );
          },


        sync:
          combat => {
            return (
              frameHelmTurnApi
                .sync(
                  combat
                )
            );
          },


        get current() {
          return (
            getFrameHelmTurnState()
          );
        },


        get state() {
          return (
            frameHelmTurnApi
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
              frameHelmTurnApi
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
              frameHelmTurnApi
                .use(
                  actionId,
                  options
                )
            );
          },


        move:
          distance => {
            return (
              frameHelmTurnApi
                .move(
                  distance
                )
            );
          },


        setSpeed:
          speed => {
            return (
              frameHelmTurnApi
                .setSpeed(
                  speed
                )
            );
          },


        overcharge:
          options => {
            return (
              frameHelmTurnApi
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
        frameHelmMovementApi,


      /* --------------------------------------------------------
         Actions
         -------------------------------------------------------- */

      actions: {
        get:
          id =>
            frameHelmActionRegistry
              .get(
                id
              ),


        list:
          options =>
            frameHelmActionRegistry
              .list(
                options
              ),


        roots:
          (
            category,
            options
          ) =>
            frameHelmActionRegistry
              .roots(
                category,
                options
              ),


        childrenOf:
          (
            parentId,
            options
          ) =>
            frameHelmActionRegistry
              .childrenOf(
                parentId,
                options
              ),


        categories:
          options =>
            frameHelmActionRegistry
              .listCategories(
                options
              ),


        register:
          action =>
            frameHelmActionRegistry
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
    frameHelmTurnApi
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
 *   - FrameHelmTurnState
 *   - FrameHelmTurnStateManager
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
 *   FrameHelmTurnState still contains the authoritative movement
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
 *   - Frame Helm scene-control tool declaration
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
 *   - FrameHelmApplication
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
 *   FRAME_HELM_RUNTIME_FEATURES
 *
 * Executable UI features are supplied through:
 *
 *   styles/ui-registry.js
 *
 * runtime-orchestrator.js imports only:
 *
 *   frameHelmFeatureRegistry
 *
 * and resolves extracted behavior through registered APIs.
 */