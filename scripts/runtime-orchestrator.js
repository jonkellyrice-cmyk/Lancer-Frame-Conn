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
  frameConnFeatureRegistry
} from "./feature-registry.js";


/* ============================================================
   Module identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";


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


if (
  !frameConnFoundryIntegrationApi
) {
  throw new Error(
    "Frame Conn | The registered Foundry Integration feature API could not be resolved."
  );
}


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
  executionKind = null
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
    case "basic-attack":
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
      "applicationClosing"
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


    /**
     * Foundry Integration owns module-setting definitions.
     *
     * The runtime retains responsibility only for choosing the
     * Foundry startup boundary at which they are registered.
     */
    frameConnFoundryIntegrationApi
      .registerSettings?.();


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
  () => {
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