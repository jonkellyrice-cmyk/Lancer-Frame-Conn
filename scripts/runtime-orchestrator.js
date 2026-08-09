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
 *        ├── executable UI package
 *        └── future feature domains
 *        ↓
 *   runtime-orchestrator.js
 *
 * CURRENTLY OWNS:
 *
 *   - Foundry startup boundaries
 *   - Cross-feature runtime binding
 *   - Action execution, pending extraction
 *   - Public game.lancerFrameHelm composition
 *
 * NO LONGER OWNS:
 *
 *   - Action registry implementation
 *   - Universal action declarations
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
     Application UI bindings
     ---------------------------------------------------------- */

  /**
   * Application UI consumes Turn state and the still-local Action
   * Execution implementation.
   *
   * Action Execution will leave this binding when
   * action-execution-feature.js is extracted.
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

      executeActionRoll:
        (
          actor,
          action
        ) =>
          frameHelmExecuteActionRoll(
            actor,
            action
          )
    });
}


/* ============================================================
   Foundry lifecycle
   ============================================================ */

/**
 * Startup boundaries remain orchestration concerns.
 *
 * Feature-owned implementation is invoked through the registered
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
     * This configures:
     *
     *   - Turn
     *   - Movement
     *   - Foundry Integration
     *   - Application UI
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
     * Install all feature-owned Foundry hooks.
     *
     * This includes:
     *
     *   - Sensors hooks
     *   - Application UI hooks
     *   - Turn/combat synchronization hooks
     *   - Movement hooks
     *   - Elevation movement hooks
     *   - Foundry Integration scene-control hooks
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
   Universal action execution
   ============================================================ */

/**
 * NEXT EXTRACTION TARGET:
 *
 * This complete section should move into:
 *
 *   scripts/action-execution-feature.js
 *
 * It remains here temporarily because Application UI still calls
 * this runtime-owned implementation through its explicit
 * executeActionRoll binding.
 */

const FRAME_HELM_NO_ROLL_ACTIONS =
  new Set([
    "movement.standard",
    "movement.jump",
    "movement.climb",
    "movement.fly",
    "movement.teleport",
    "quick.boost",
    "quick.hide",
    "quick.prepare",
    "quick.shut-down",
    "quick.self-destruct",
    "full.disengage",
    "full.boot-up",
    "full.mount-dismount",
    "special.end-turn"
  ]);


/* ============================================================
   Action execution -- Kind resolution
   ============================================================ */

function frameHelmActionExecutionKind(
  action
) {
  if (
    !action ||
    FRAME_HELM_NO_ROLL_ACTIONS
      .has(
        action.id
      )
  ) {
    return null;
  }


  if (
    action.metadata
      ?.statPath
  ) {
    return "stat";
  }


  if (
    [
      "quick.skirmish",
      "quick.grapple",
      "quick.ram",
      "full.barrage",
      "full.improvised-attack",
      "reaction.overwatch"
    ].includes(
      action.id
    )
  ) {
    return "basic-attack";
  }


  if (
    [
      "quick.quick-tech.invade",
      "quick.quick-tech.invade.fragment-signal"
    ].includes(
      action.id
    )
  ) {
    return "basic-tech-attack";
  }


  if (
    action.id ===
    "quick.quick-tech.scan"
  ) {
    return "scan";
  }


  if (
    action.id ===
    "full.stabilize"
  ) {
    return "stabilize";
  }


  if (
    action.id ===
    "special.overcharge"
  ) {
    return "overcharge";
  }


  return "choose-stat";
}


/* ============================================================
   Action execution -- Mech stat selection
   ============================================================ */

function frameHelmChooseMechStat(
  action
) {
  return new Promise(
    resolve => {
      const choices = [
        [
          "hull",
          "HULL"
        ],

        [
          "agi",
          "AGI"
        ],

        [
          "sys",
          "SYS"
        ],

        [
          "eng",
          "ENG"
        ]
      ];


      const buttons =
        Object.fromEntries(
          choices.map(
            (
              [
                path,
                label
              ]
            ) => {
              return [
                path,
                {
                  icon:
                    '<i class="fas fa-dice-d20"></i>',

                  label,

                  callback:
                    () =>
                      resolve({
                        path,
                        label
                      })
                }
              ];
            }
          )
        );


      new Dialog({
        title:
          `${action.label} -- Choose Mech Skill`,

        content: `
          <p>
            Choose the mech skill used to resolve
            <strong>${foundry.utils.escapeHTML(action.label)}</strong>.
          </p>
        `,

        buttons,

        close:
          () =>
            resolve(
              null
            )
      }).render(
        true
      );
    }
  );
}


/* ============================================================
   Action execution -- Actor workflow delegation
   ============================================================ */

async function frameHelmExecuteActionRoll(
  actor,
  action
) {
  const kind =
    frameHelmActionExecutionKind(
      action
    );


  if (
    !kind
  ) {
    throw new Error(
      "This action does not require a dice or sheet workflow."
    );
  }


  if (
    kind ===
    "stat"
  ) {
    return (
      actor.beginStatFlow(
        action.metadata
          .statPath,

        action.metadata
          .statLabel ??
          action.label
      )
    );
  }


  if (
    kind ===
    "basic-attack"
  ) {
    return (
      actor.beginBasicAttackFlow(
        action.label
      )
    );
  }


  if (
    kind ===
    "basic-tech-attack"
  ) {
    return (
      actor.beginBasicTechAttackFlow(
        action.label
      )
    );
  }


  if (
    kind ===
    "scan"
  ) {
    return (
      actor.beginScanFlow()
    );
  }


  if (
    kind ===
    "stabilize"
  ) {
    return (
      actor.beginStabilizeFlow()
    );
  }


  if (
    kind ===
    "overcharge"
  ) {
    return (
      actor.beginOverchargeFlow()
    );
  }


  const selectedStat =
    await frameHelmChooseMechStat(
      action
    );


  if (
    !selectedStat
  ) {
    throw new Error(
      "Mech skill selection was cancelled."
    );
  }


  return (
    actor.beginStatFlow(
      selectedStat.path,

      `${action.label} -- ${selectedStat.label}`
    )
  );
}


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
 * NEXT EXTRACTION:
 *
 *   scripts/action-execution-feature.js
 *
 * Should absorb:
 *   - no-roll action classification
 *   - action execution-kind resolution
 *   - mech-stat selection dialog
 *   - actor workflow delegation
 *   - frameHelmExecuteActionRoll()
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