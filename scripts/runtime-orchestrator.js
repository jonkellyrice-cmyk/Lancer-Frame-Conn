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
 *   - Application UI
 *       styles/ui-application.js
 *
 * FEATURE COMPOSITION:
 *
 *   feature-contract.js
 *        ↓
 *   feature-registry.js
 *        ├── actions-feature.js
 *        ├── sensors-feature.js
 *        ├── turn-feature.js
 *        ├── ui-application.js
 *        └── future feature domains
 *        ↓
 *   runtime-orchestrator.js
 *
 * CURRENTLY OWNS:
 *
 *   - Foundry startup boundaries
 *   - Module settings registration
 *   - Scene-control integration
 *   - Cross-feature runtime binding
 *   - Movement tracking, pending extraction
 *   - Elevation movement tracking, pending extraction
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

const MODULE_ID =
  "lancer-frame-helm";

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

if (!frameHelmActionsApi) {
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

if (!frameHelmTurnApi) {
  throw new Error(
    "Frame Helm | The registered Turn feature API could not be resolved."
  );
}


/**
 * Transitional accessor used by Movement and other domains which
 * have not yet been extracted.
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
   Application UI
   ------------------------------------------------------------ */

/**
 * NOTE:
 *
 * ui-application.js declares:
 *
 *   id: "ui-application"
 *
 * Therefore that exact identifier is used here.
 */
const frameHelmApplicationApi =
  frameHelmFeatureRegistry.getApi(
    "ui-application"
  );

if (!frameHelmApplicationApi) {
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
   Cross-feature runtime bindings
   ============================================================ */

/**
 * Several extracted domains still consume capabilities belonging
 * to domains which have not yet been independently extracted.
 *
 * Keep those relationships explicit here rather than allowing
 * features to import one another directly.
 */
function configureFrameHelmRuntimeBindings() {
  /**
   * Turn depends on the Actions registry and requests Application
   * rendering when turn state changes.
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


  /**
   * Application UI consumes Turn state and the still-local Action
   * Execution implementation.
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
   Settings
   ============================================================ */

function registerSettings() {
  game.settings.register(
    MODULE_ID,
    "enabled",
    {
      name:
        "Enable Frame Helm",

      hint:
        "Enables the Frame Helm action-selection interface.",

      scope:
        "world",

      config:
        true,

      type:
        Boolean,

      default:
        true,

      restricted:
        true,

      onChange:
        enabled => {
          if (
            !enabled
          ) {
            closeFrameHelm();
          }
        }
    }
  );
}


/* ============================================================
   Scene control integration
   ============================================================ */

function addFrameHelmControlButton(
  controls
) {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    return;
  }


  const tokenControls =
    Array.isArray(
      controls
    )
      ? controls.find(
          control =>
            control.name ===
            "token"
        )
      : controls?.tokens ??
        controls?.token ??
        null;


  if (
    !tokenControls
  ) {
    console.warn(
      `${MODULE_TITLE} | Token scene controls could not be located.`,
      controls
    );

    return;
  }


  const tool = {
    name:
      "lancer-frame-helm",

    title:
      MODULE_TITLE,

    icon:
      "fas fa-robot",

    button:
      true,

    visible:
      true,

    onClick:
      openFrameHelm
  };


  if (
    Array.isArray(
      tokenControls.tools
    )
  ) {
    const alreadyExists =
      tokenControls.tools.some(
        existingTool =>
          existingTool.name ===
          "lancer-frame-helm"
      );


    if (
      !alreadyExists
    ) {
      tokenControls.tools.push(
        tool
      );
    }

    return;
  }


  tokenControls.tools ??=
    {};


  if (
    !tokenControls.tools[
      "lancer-frame-helm"
    ]
  ) {
    tokenControls.tools[
      "lancer-frame-helm"
    ] = tool;
  }
}


/* ============================================================
   Foundry lifecycle
   ============================================================ */

Hooks.once(
  "init",
  () => {
    console.log(
      `${MODULE_TITLE} | Initializing.`
    );


    registerSettings();


    /**
     * Actions retain synchronous catalog initialization during
     * the current migration.
     */
    initializeFrameHelmActionRegistry();


    /**
     * Establish explicit cross-feature runtime dependencies before
     * feature-owned hooks begin consuming those surfaces.
     */
    configureFrameHelmRuntimeBindings();


    /**
     * All extracted domains have already been registered by
     * feature-registry.js.
     */
    frameHelmFeatureRegistry
      .validateDependencies();


    /**
     * Install all feature-owned Foundry hooks.
     *
     * This now includes:
     *
     *   - Sensors hooks
     *   - Application UI hooks
     *   - Turn/combat synchronization hooks
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
   Foundry scene-control hooks
   ============================================================ */

/**
 * Scene-control integration remains application-wide runtime
 * composition rather than a gameplay feature.
 */
Hooks.on(
  "getSceneControlButtons",
  addFrameHelmControlButton
);


/* ============================================================
   Dragged token movement tracking
   ============================================================ */

/**
 * CURRENT EXTRACTION TARGET:
 *
 * This complete section should move next into:
 *
 *   scripts/movement-feature.js
 *
 * Turn-state ownership has already moved into turn-feature.js.
 * Movement now consumes that state through the Turn feature.
 */


function frameHelmMovementTokenMatches(
  tokenDocument,
  state =
    getFrameHelmTurnState()
) {
  if (
    !tokenDocument ||
    !state ||
    state.ended
  ) {
    return false;
  }


  const context =
    state.context ??
    {};


  const tokenMatches =
    Boolean(
      context.tokenId &&
      context.tokenId ===
        tokenDocument.id
    );


  const actorId =
    tokenDocument.actor?.id ??
    tokenDocument.actorId ??
    null;


  const actorMatches =
    Boolean(
      !context.tokenId &&
      context.actorId &&
      context.actorId ===
        actorId
    );


  return (
    tokenMatches ||
    actorMatches
  );
}


function frameHelmPoint(
  point
) {
  if (
    !point
  ) {
    return null;
  }


  const x =
    Number(
      point.x
    );


  const y =
    Number(
      point.y
    );


  if (
    !Number.isFinite(
      x
    ) ||
    !Number.isFinite(
      y
    )
  ) {
    return null;
  }


  return {
    x,
    y,

    elevation:
      Number.isFinite(
        Number(
          point.elevation
        )
      )
        ? Number(
            point.elevation
          )
        : undefined
  };
}


function frameHelmCollectMovementPoints(
  movement
) {
  const points =
    [];


  const addPoint =
    point => {
      const normalized =
        frameHelmPoint(
          point
        );


      if (
        !normalized
      ) {
        return;
      }


      const previous =
        points.at(
          -1
        );


      if (
        previous &&
        previous.x ===
          normalized.x &&
        previous.y ===
          normalized.y
      ) {
        return;
      }


      points.push(
        normalized
      );
    };


  addPoint(
    movement?.origin
  );


  const waypointSources = [
    movement?.passed
      ?.waypoints,

    movement?.pending
      ?.waypoints,

    movement?.history
      ?.waypoints,

    movement?.waypoints
  ];


  for (
    const source
    of waypointSources
  ) {
    if (
      !Array.isArray(
        source
      )
    ) {
      continue;
    }


    for (
      const waypoint
      of source
    ) {
      addPoint(
        waypoint
      );
    }
  }


  addPoint(
    movement?.destination
  );


  return points;
}


function frameHelmNumericMovementDistance(
  movement
) {
  const candidates = [
    movement?.pending
      ?.distance,

    movement?.passed
      ?.distance,

    movement?.history
      ?.distance,

    movement?.distance,

    movement?.pending
      ?.cost,

    movement?.passed
      ?.cost
  ];


  for (
    const candidate
    of candidates
  ) {
    const numeric =
      Number(
        candidate
      );


    if (
      Number.isFinite(
        numeric
      ) &&
      numeric > 0
    ) {
      return numeric;
    }
  }


  const measurementSources = [
    movement?.pending
      ?.measurements,

    movement?.passed
      ?.measurements,

    movement?.history
      ?.measurements
  ];


  for (
    const measurements
    of measurementSources
  ) {
    if (
      !Array.isArray(
        measurements
      )
    ) {
      continue;
    }


    const total =
      measurements.reduce(
        (
          sum,
          measurement
        ) => {
          const distance =
            Number(
              measurement
                ?.distance ??
              measurement
                ?.cost ??
              0
            );


          return (
            sum +
            (
              Number.isFinite(
                distance
              )
                ? distance
                : 0
            )
          );
        },
        0
      );


    if (
      total > 0
    ) {
      return total;
    }
  }


  return null;
}


function frameHelmMeasureMovementPath(
  tokenDocument,
  movement
) {
  const directDistance =
    frameHelmNumericMovementDistance(
      movement
    );


  const sceneGridDistance =
    Number(
      tokenDocument
        ?.parent
        ?.grid
        ?.distance ??
      canvas
        ?.dimensions
        ?.distance ??
      1
    );


  const normalizeSceneDistance =
    distance => {
      if (
        !Number.isFinite(
          distance
        )
      ) {
        return null;
      }


      if (
        Number.isFinite(
          sceneGridDistance
        ) &&
        sceneGridDistance >
          0
      ) {
        return (
          distance /
          sceneGridDistance
        );
      }


      return distance;
    };


  if (
    directDistance !==
    null
  ) {
    return (
      normalizeSceneDistance(
        directDistance
      )
    );
  }


  const points =
    frameHelmCollectMovementPoints(
      movement
    );


  if (
    points.length <
    2
  ) {
    return 0;
  }


  try {
    const measured =
      canvas
        ?.grid
        ?.measurePath?.(
          points,
          {
            cost:
              true
          }
        );


    const measuredDistance =
      Number(
        measured?.cost ??
        measured?.distance
      );


    if (
      Number.isFinite(
        measuredDistance
      ) &&
      measuredDistance >
        0
    ) {
      return (
        normalizeSceneDistance(
          measuredDistance
        )
      );
    }
  } catch (error) {
    console.warn(
      `${MODULE_TITLE} | Foundry path measurement failed; using geometric fallback.`,
      error
    );
  }


  const gridSize =
    Number(
      canvas
        ?.dimensions
        ?.size ??
      tokenDocument
        ?.parent
        ?.grid
        ?.size ??
      100
    );


  let pixelDistance =
    0;


  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previous =
      points[
        index - 1
      ];


    const current =
      points[
        index
      ];


    pixelDistance +=
      Math.hypot(
        current.x -
          previous.x,

        current.y -
          previous.y
      );
  }


  if (
    !Number.isFinite(
      gridSize
    ) ||
    gridSize <= 0
  ) {
    return 0;
  }


  return (
    pixelDistance /
    gridSize
  );
}


function frameHelmRoundMovementDistance(
  distance
) {
  const numeric =
    Number(
      distance
    );


  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric <= 0
  ) {
    return 0;
  }


  return (
    Math.round(
      numeric *
      100
    ) / 100
  );
}


function notifyAutomaticMovementActions(
  result
) {
  for (
    const automaticAction
    of (
      result
        .automaticActions ??
      []
    )
  ) {
    if (
      !automaticAction
        .committed
    ) {
      ui.notifications.warn(
        `Frame Helm tracked movement beyond the current allowance, but could not automatically commit Boost: ${automaticAction.reason ?? "no legal action budget remains"}.`
      );

      continue;
    }


    if (
      automaticAction
        .source ===
        "overcharge" &&
      automaticAction
        .triggeredOvercharge
    ) {
      ui.notifications.warn(
        `Movement triggered Overcharge Boost. Apply ${automaticAction.heatFormula ?? "the current Overcharge cost"} Heat.`
      );
    } else if (
      automaticAction
        .source ===
        "overcharge"
    ) {
      ui.notifications.info(
        "Movement automatically spent the available Overcharge action on Boost."
      );
    } else {
      ui.notifications.info(
        "Movement exceeded Speed. Boost was automatically committed."
      );
    }
  }
}


Hooks.on(
  "moveToken",
  (
    tokenDocument,
    movement
  ) => {
    const state =
      getFrameHelmTurnState();


    if (
      !frameHelmMovementTokenMatches(
        tokenDocument,
        state
      )
    ) {
      return;
    }


    const distance =
      frameHelmRoundMovementDistance(
        frameHelmMeasureMovementPath(
          tokenDocument,
          movement
        )
      );


    if (
      distance <= 0
    ) {
      return;
    }


    try {
      const result =
        state.trackTokenMovement(
          distance,
          {
            movementId:
              movement?.id ??
              null,

            method:
              movement?.method ??
              null,

            origin:
              frameHelmPoint(
                movement?.origin
              ),

            destination:
              frameHelmPoint(
                movement
                  ?.destination
              )
          }
        );


      if (
        !result.tracked
      ) {
        return;
      }


      notifyAutomaticMovementActions(
        result
      );


      if (
        result.excess >
        0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance. The token was not stopped.`
        );
      }


      renderFrameHelmApplication(
        false
      );
    } catch (error) {
      console.error(
        `${MODULE_TITLE} | Could not track token movement.`,
        error
      );


      ui.notifications.warn(
        `Frame Helm could not track this movement: ${error.message}`
      );
    }
  }
);


/* ============================================================
   Universal action execution
   ============================================================ */

/**
 * CURRENT EXTRACTION TARGET:
 *
 * After Movement, this section should move into:
 *
 *   scripts/action-execution-feature.js
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
   Elevation movement tracking
   ============================================================ */

/**
 * This belongs with Movement and should leave this file when
 * movement-feature.js is extracted.
 */

const frameHelmElevationOrigins =
  new Map();


function frameHelmElevationKey(
  tokenDocument
) {
  return String(
    tokenDocument?.uuid ??
    `${tokenDocument?.parent?.id ?? "scene"}:${tokenDocument?.id ?? "token"}`
  );
}


Hooks.on(
  "preUpdateToken",
  (
    tokenDocument,
    changes
  ) => {
    if (
      !Object.prototype
        .hasOwnProperty.call(
          changes,
          "elevation"
        )
    ) {
      return;
    }


    frameHelmElevationOrigins.set(
      frameHelmElevationKey(
        tokenDocument
      ),

      Number(
        tokenDocument.elevation
      ) || 0
    );
  }
);


Hooks.on(
  "updateToken",
  (
    tokenDocument,
    changes
  ) => {
    if (
      !Object.prototype
        .hasOwnProperty.call(
          changes,
          "elevation"
        )
    ) {
      return;
    }


    const state =
      getFrameHelmTurnState();


    if (
      !frameHelmMovementTokenMatches(
        tokenDocument,
        state
      )
    ) {
      return;
    }


    const key =
      frameHelmElevationKey(
        tokenDocument
      );


    const previousElevation =
      frameHelmElevationOrigins.get(
        key
      );


    frameHelmElevationOrigins.delete(
      key
    );


    const nextElevation =
      Number(
        changes.elevation
      );


    if (
      !Number.isFinite(
        previousElevation
      ) ||
      !Number.isFinite(
        nextElevation
      )
    ) {
      return;
    }


    const sceneDistance =
      Number(
        tokenDocument
          ?.parent
          ?.grid
          ?.distance ??
        canvas
          ?.dimensions
          ?.distance ??
        1
      );


    const elevationDistance =
      Math.abs(
        nextElevation -
          previousElevation
      );


    const movementSpaces =
      Number.isFinite(
        sceneDistance
      ) &&
      sceneDistance >
        0
        ? elevationDistance /
          sceneDistance
        : elevationDistance;


    const distance =
      frameHelmRoundMovementDistance(
        movementSpaces
      );


    if (
      distance <= 0
    ) {
      return;
    }


    try {
      const result =
        state.trackTokenMovement(
          distance,
          {
            movementId:
              `elevation:${key}:${previousElevation}:${nextElevation}:${Date.now()}`,

            method:
              "elevation",

            origin: {
              x:
                Number(
                  tokenDocument.x
                ) || 0,

              y:
                Number(
                  tokenDocument.y
                ) || 0,

              elevation:
                previousElevation
            },

            destination: {
              x:
                Number(
                  tokenDocument.x
                ) || 0,

              y:
                Number(
                  tokenDocument.y
                ) || 0,

              elevation:
                nextElevation
            }
          }
        );


      if (
        !result.tracked
      ) {
        return;
      }


      ui.notifications.info(
        `Elevation changed by ${distance} space(s); Frame Helm recorded it as movement.`
      );


      notifyAutomaticMovementActions(
        result
      );


      if (
        result.excess >
        0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance.`
        );
      }


      renderFrameHelmApplication(
        false
      );
    } catch (error) {
      console.error(
        `${MODULE_TITLE} | Could not track elevation movement.`,
        error
      );


      ui.notifications.warn(
        `Frame Helm could not track the elevation change: ${error.message}`
      );
    }
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
 *   scripts/movement-feature.js
 *
 * Should absorb:
 *   - movement-token identity matching
 *   - movement-path normalization
 *   - movement-path measurement
 *   - movement rounding
 *   - automatic Boost notifications
 *   - moveToken hook
 *   - elevation-origin tracking
 *   - elevation movement accounting
 *   - elevation hooks
 *
 *
 * All executable feature domains are imported and registered by:
 *
 *   scripts/feature-registry.js
 *
 * runtime-orchestrator.js imports only:
 *
 *   frameHelmFeatureRegistry
 *
 * and resolves feature behavior through registered APIs.
 */