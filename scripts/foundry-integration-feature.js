/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/foundry-integration-feature.js
 */


/**
 * ============================================================
 * FRAME CONN FEATURE -- FOUNDRY INTEGRATION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Conn's direct integration with Foundry's module
 *   settings and scene-control surfaces.
 *
 * PURPOSE:
 *   Remove Foundry-specific application-shell integration from
 *   runtime-orchestrator.js while preserving Frame Conn startup
 *   behavior and public interaction exactly.
 *
 * RESPONSIBILITIES:
 *   - Register Frame Conn module settings.
 *   - Resolve whether Frame Conn is enabled.
 *   - React when the enabled setting changes.
 *   - Close the Frame Conn Application when disabled.
 *   - Add the Frame Conn launcher to Token scene controls.
 *   - Support Foundry scene-control collection shapes.
 *   - Prevent duplicate Frame Conn scene-control tools.
 *   - Declare the getSceneControlButtons Foundry hook.
 *   - Expose Foundry-integration diagnostics.
 *
 * DOES NOT OWN:
 *   - Foundry init/ready startup boundaries.
 *   - Canonical feature registration.
 *   - Feature dependency ordering.
 *   - Cross-feature runtime composition.
 *   - Public game.lancerFrameConn composition.
 *   - FrameConnApplication implementation.
 *   - Application instance ownership.
 *   - Application rendering implementation.
 *   - Action registry implementation.
 *   - Turn state.
 *   - Movement behavior.
 *   - Sensor behavior.
 *   - Action execution.
 *   - Gameplay rules.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   ui-application.js
 *        │
 *        │ open / close application surfaces
 *        ▼
 *   foundry-integration-feature.js
 *        │
 *        ├── module settings
 *        ├── enabled-state integration
 *        ├── Token scene-control launcher
 *        └── Foundry scene-control hook
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ▼
 *   runtime-orchestrator.js
 *
 * STARTUP RELATIONSHIP:
 *
 *   runtime-orchestrator.js
 *        │
 *        │ Foundry init
 *        ▼
 *   foundry-integration.registerSettings()
 *
 *
 *   feature-registry.installHooks()
 *        │
 *        ▼
 *   foundry-integration
 *        │
 *        ▼
 *   getSceneControlButtons
 *
 * TRANSITIONAL RUNTIME RELATIONSHIP:
 *
 *   This feature requires access to Application UI open/close
 *   behavior.
 *
 *   During the current decomposition those surfaces are supplied
 *   through an explicit runtime binding configured by
 *   runtime-orchestrator.js.
 *
 *   The feature does not import ui-application.js directly.
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - foundry.integration
 *     - foundry.settings
 *     - foundry.scene-controls
 *
 *   Required dependencies:
 *     - ui.application
 *
 *   Optional dependencies:
 *     - ui.application.lifecycle
 *
 * STABILITY CONTRACT:
 *
 *   This extraction changes ownership only.
 *
 *   Existing setting names, defaults, scopes, permissions,
 *   scene-control behavior, launcher appearance, and application
 *   open/close behavior are preserved.
 */


/* ============================================================
   Imports
   ============================================================ */

import {
  defineFrameConnFeature
} from "./feature-contract.js";


/* ============================================================
   Foundry integration identity
   ============================================================ */

const MODULE_ID =
  "lancer-frame-conn";


const MODULE_TITLE =
  "Frame Conn";


const FRAME_CONN_SCENE_CONTROL_NAME =
  "lancer-frame-conn";


/* ============================================================
   Foundry integration runtime bindings
   ============================================================ */

/**
 * Explicit dependency bridge for Application UI behavior.
 *
 * Foundry Integration knows that Frame Conn may be opened or
 * closed, but does not own the Application implementation.
 */
const frameConnFoundryIntegrationRuntimeBindings = {
  openApplication:
    null,

  closeApplication:
    null,

  applyApplicationPresentationMode:
    null,

  executeLockOnAuthorityRequest:
    null
};


/**
 * Configures Foundry Integration's external runtime surfaces.
 *
 * Unknown bindings are rejected deliberately so this remains a
 * narrow dependency boundary rather than becoming an application
 * service container.
 */
function configureFrameConnFoundryIntegrationRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Conn Foundry Integration runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameConnFoundryIntegrationRuntimeBindings
      )
    );


  for (
    const [
      key,
      value
    ]
    of Object.entries(
      bindings
    )
  ) {
    if (
      !allowedKeys.has(
        key
      )
    ) {
      throw new Error(
        `Frame Conn Foundry Integration received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Conn Foundry Integration runtime binding "${key}" must be a function or null.`
      );
    }


    frameConnFoundryIntegrationRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameConnFoundryIntegrationRuntimeBindings()
  );
}


/**
 * Returns runtime-binding availability without exposing the bound
 * functions themselves.
 */
function getFrameConnFoundryIntegrationRuntimeBindings() {
  return Object.freeze({
    applicationOpening:
      typeof frameConnFoundryIntegrationRuntimeBindings
        .openApplication ===
        "function",

    applicationClosing:
      typeof frameConnFoundryIntegrationRuntimeBindings
        .closeApplication ===
        "function",

    applicationPresentationMode:
      typeof frameConnFoundryIntegrationRuntimeBindings
        .applyApplicationPresentationMode ===
        "function",

    lockOnAuthorityExecution:
      typeof frameConnFoundryIntegrationRuntimeBindings
        .executeLockOnAuthorityRequest ===
        "function"
  });
}


/* ============================================================
   Application integration accessors
   ============================================================ */

/**
 * Requests that the primary Frame Conn Application open.
 *
 * Application ownership remains with ui-application.js.
 */
function openFrameConnFromFoundryIntegration(
  ...args
) {
  const openApplication =
    frameConnFoundryIntegrationRuntimeBindings
      .openApplication;


  if (
    typeof openApplication !==
    "function"
  ) {
    throw new Error(
      "Frame Conn Foundry Integration could not resolve the Application open surface."
    );
  }


  return (
    openApplication(
      ...args
    )
  );
}


/**
 * Requests that the primary Frame Conn Application close.
 *
 * Application ownership remains with ui-application.js.
 */
function closeFrameConnFromFoundryIntegration(
  ...args
) {
  const closeApplication =
    frameConnFoundryIntegrationRuntimeBindings
      .closeApplication;


  if (
    typeof closeApplication !==
    "function"
  ) {
    return null;
  }


  return (
    closeApplication(
      ...args
    )
  );
}


/* ============================================================
   Foundry settings -- Enabled state
   ============================================================ */

/**
 * Returns whether Frame Conn is currently enabled for this world.
 *
 * This query assumes settings registration has already occurred at
 * the Foundry init boundary.
 */
function isFrameConnEnabled() {
  return Boolean(
    game.settings.get(
      MODULE_ID,
      "enabled"
    )
  );
}


/* ============================================================
   Foundry settings -- Change handling
   ============================================================ */

/**
 * Handles changes to the Frame Conn enabled setting.
 *
 * Disabling the feature closes the currently-open Application.
 */
function handleFrameConnEnabledSettingChange(
  enabled
) {
  if (
    enabled
  ) {
    return null;
  }


  return (
    closeFrameConnFromFoundryIntegration()
  );
}


function getFrameConnPresentationModeSetting() {
  const value =
    game.settings.get(
      MODULE_ID,
      "presentationMode"
    );

  return value === "sidebar"
    ? "sidebar"
    : "window";
}


function setFrameConnPresentationModeSetting(
  mode
) {
  const normalizedMode =
    mode === "sidebar"
      ? "sidebar"
      : "window";

  return game.settings.set(
    MODULE_ID,
    "presentationMode",
    normalizedMode
  );
}


function handleFrameConnPresentationModeSettingChange(
  mode
) {
  const applyPresentationMode =
    frameConnFoundryIntegrationRuntimeBindings
      .applyApplicationPresentationMode;

  if (
    typeof applyPresentationMode !==
      "function"
  ) {
    return null;
  }

  return applyPresentationMode(
    mode
  );
}


/* ============================================================
   Foundry settings -- Registration
   ============================================================ */

/**
 * Registers all module settings owned by Foundry Integration.
 *
 * IMPORTANT:
 *
 * This command must run during Foundry's init phase.
 *
 * The authoritative startup boundary remains owned by
 * runtime-orchestrator.js.
 */
function registerFrameConnSettings() {
  game.settings.register(
    MODULE_ID,
    "enabled",
    {
      name:
        "Enable Frame Conn",

      hint:
        "Enables the Frame Conn action-selection interface.",

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
        handleFrameConnEnabledSettingChange
    }
  );

  game.settings.register(
    MODULE_ID,
    "presentationMode",
    {
      name:
        "Frame Helm Presentation",

      hint:
        "Choose whether Frame Helm opens as the existing floating window or as a vertical Foundry sidebar tab.",

      scope:
        "client",

      config:
        true,

      type:
        String,

      choices: {
        window:
          "Window",

        sidebar:
          "Sidebar"
      },

      default:
        "sidebar",

      restricted:
        false,

      onChange:
        handleFrameConnPresentationModeSettingChange
    }
  );


  return true;
}


/* ============================================================
   Scene controls -- Token control resolution
   ============================================================ */

/**
 * Resolves Foundry's Token scene-control group.
 *
 * Foundry versions may expose scene controls as either:
 *
 *   - an array of control groups
 *   - an object keyed by control id
 *
 * Both representations are preserved from the previous runtime
 * implementation.
 */
function getFrameConnTokenSceneControls(
  controls
) {
  if (
    Array.isArray(
      controls
    )
  ) {
    return (
      controls.find(
        control =>
          control.name ===
          "token"
      ) ??
      null
    );
  }


  return (
    controls?.tokens ??
    controls?.token ??
    null
  );
}


/* ============================================================
   Scene controls -- Tool declaration
   ============================================================ */

/**
 * Constructs the Frame Conn Token scene-control launcher.
 */
function createFrameConnSceneControlTool(
  tokenControls =
    null
) {
  const tools =
    tokenControls?.tools;


  const order =
    Array.isArray(
      tools
    )
      ? tools.length
      : Object.keys(
          tools ??
          {}
        ).length;


  return {
    name:
      FRAME_CONN_SCENE_CONTROL_NAME,

    title:
      MODULE_TITLE,

    icon:
      "fa-solid fa-robot",

    order,

    button:
      true,

    visible:
      true,

    onChange:
      () =>
        openFrameConnFromFoundryIntegration()
  };
}


/* ============================================================
   Scene controls -- Existing tool inspection
   ============================================================ */

/**
 * Returns whether the Token controls already contain the Frame
 * Helm launcher.
 */
function hasFrameConnSceneControlTool(
  tokenControls
) {
  const tools =
    tokenControls?.tools;


  if (
    Array.isArray(
      tools
    )
  ) {
    return (
      tools.some(
        existingTool =>
          existingTool
            ?.name ===
          FRAME_CONN_SCENE_CONTROL_NAME
      )
    );
  }


  if (
    tools &&
    typeof tools ===
      "object"
  ) {
    return Boolean(
      tools[
        FRAME_CONN_SCENE_CONTROL_NAME
      ]
    );
  }


  return false;
}


/* ============================================================
   Scene controls -- Tool insertion
   ============================================================ */

/**
 * Adds the Frame Conn launcher to a resolved Token scene-control
 * group.
 *
 * Supports both array- and object-based Foundry tool containers.
 */
function insertFrameConnSceneControlTool(
  tokenControls,
  tool =
    createFrameConnSceneControlTool(
      tokenControls
    )
) {
  if (
    !tokenControls
  ) {
    return false;
  }


  if (
    hasFrameConnSceneControlTool(
      tokenControls
    )
  ) {
    return false;
  }


  if (
    Array.isArray(
      tokenControls.tools
    )
  ) {
    tokenControls.tools.push(
      tool
    );


    return true;
  }


  tokenControls.tools ??=
    {};


  tokenControls.tools[
    FRAME_CONN_SCENE_CONTROL_NAME
  ] = tool;


  return true;
}


/* ============================================================
   Scene controls -- Foundry integration
   ============================================================ */

/**
 * Adds the Frame Conn launcher to Foundry's Token controls when
 * the module is enabled.
 */
function addFrameConnControlButton(
  controls
) {
  if (
    !isFrameConnEnabled()
  ) {
    return false;
  }


  const tokenControls =
    getFrameConnTokenSceneControls(
      controls
    );


  if (
    !tokenControls
  ) {
    console.warn(
      `${MODULE_TITLE} | Token scene controls could not be located.`,
      controls
    );


    return false;
  }


  return insertFrameConnSceneControlTool(tokenControls);
}


/* ============================================================
   Foundry integration -- Target acquisition
   ============================================================ */

/**
 * Return the current user's Foundry token targets as Token objects.
 * Selection state only; legality belongs to Targeting / Spatial.
 */
function getFrameConnUserTargets() {
  return Array.from(
    game?.user?.targets ??
    []
  );
}


/**
 * Activate Foundry's Token layer with its built-in target tool.
 */
function activateFrameConnTargetTool() {
  const tokenLayer =
    canvas?.tokens ??
    null;

  if (
    !tokenLayer ||
    typeof tokenLayer.activate !==
      "function"
  ) {
    throw new Error(
      "Frame Conn could not activate Foundry's Token target tool."
    );
  }

  tokenLayer.activate({
    tool:
      "target"
  });

  return true;
}


/**
 * Prefer existing targets; otherwise switch to Foundry's target tool
 * and wait for this user to target a token. Escape cancels.
 */
async function promptFrameConnForTarget() {
  const existingTargets =
    getFrameConnUserTargets();

  if (
    existingTargets.length > 0
  ) {
    return existingTargets;
  }

  activateFrameConnTargetTool();

  ui.notifications.info(
    "Select a target for this action. Press Escape to cancel."
  );

  return new Promise(
    resolve => {
      let settled = false;
      let targetHookId = null;

      const cleanup = () => {
        if (targetHookId != null) {
          Hooks.off("targetToken", targetHookId);
        }

        window.removeEventListener(
          "keydown",
          handleKeyDown,
          true
        );
      };

      const finish = value => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        resolve(value);
      };

      const handleKeyDown = event => {
        if (event.key === "Escape") {
          finish(null);
        }
      };

      targetHookId = Hooks.on(
        "targetToken",
        (user, token, targeted) => {
          if (
            user?.id !== game?.user?.id ||
            !targeted ||
            !token
          ) {
            return;
          }

          finish(
            getFrameConnUserTargets()
          );
        }
      );

      window.addEventListener(
        "keydown",
        handleKeyDown,
        true
      );
    }
  );
}


/* ============================================================
   Foundry integration -- GM-authoritative Lock On relay
   ============================================================ */

const FRAME_CONN_SOCKET_CHANNEL =
  `module.${MODULE_ID}`;

const FRAME_CONN_SOCKET_KIND =
  Object.freeze({
    LOCK_ON_REQUEST:
      "lock-on-request",

    LOCK_ON_RESPONSE:
      "lock-on-response"
  });

const frameConnPendingSocketRequests =
  new Map();

let frameConnModuleSocketRegistered =
  false;


function getFrameConnLockOnAuthorityExecutor() {
  const executor =
    frameConnFoundryIntegrationRuntimeBindings
      .executeLockOnAuthorityRequest;

  if (
    typeof executor !==
    "function"
  ) {
    throw new Error(
      "Frame Conn Lock On authority execution has not been configured."
    );
  }

  return executor;
}


function buildFrameConnLockOnAuthorityPayload({
  actor,
  sourceToken,
  targetToken
} = {}) {
  const sourceDocument =
    sourceToken?.document ??
    sourceToken ??
    null;

  const targetDocument =
    targetToken?.document ??
    targetToken ??
    null;

  const sourceSceneId =
    sourceDocument?.parent?.id ??
    canvas?.scene?.id ??
    null;

  const targetSceneId =
    targetDocument?.parent?.id ??
    canvas?.scene?.id ??
    null;

  if (
    !sourceSceneId ||
    sourceSceneId !== targetSceneId ||
    !sourceDocument?.id ||
    !targetDocument?.id
  ) {
    throw new Error(
      "Frame Conn Lock On requires source and target tokens on the same active Scene."
    );
  }

  return Object.freeze({
    requesterUserId:
      game?.user?.id ??
      null,

    sceneId:
      sourceSceneId,

    sourceTokenId:
      sourceDocument.id,

    targetTokenId:
      targetDocument.id,

    actingActorUuid:
      actor?.uuid ??
      null
  });
}


async function requestFrameConnLockOnApplication(
  options = {}
) {
  const payload =
    buildFrameConnLockOnAuthorityPayload(
      options
    );

  const executor =
    getFrameConnLockOnAuthorityExecutor();

  if (game?.user?.isGM) {
    return executor(
      payload
    );
  }

  const activeGM =
    game?.users?.activeGM ??
    null;

  if (!activeGM) {
    throw new Error(
      "Lock On requires an active GM client to apply the native status to an enemy actor."
    );
  }

  if (
    !game?.socket ||
    typeof game.socket.emit !==
      "function"
  ) {
    throw new Error(
      "Frame Conn module socket is unavailable for Lock On."
    );
  }

  registerFrameConnModuleSocket();

  const requestId =
    [
      game.user.id,
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2)
    ].join("-");

  return new Promise(
    (resolve, reject) => {
      const timeoutId =
        window.setTimeout(
          () => {
            frameConnPendingSocketRequests
              .delete(
                requestId
              );

            reject(
              new Error(
                "Frame Conn timed out waiting for the GM to apply Lock On."
              )
            );
          },
          10000
        );

      frameConnPendingSocketRequests
        .set(
          requestId,
          {
            resolve,
            reject,
            timeoutId
          }
        );

      game.socket.emit(
        FRAME_CONN_SOCKET_CHANNEL,
        {
          kind:
            FRAME_CONN_SOCKET_KIND
              .LOCK_ON_REQUEST,

          requestId,

          gmUserId:
            activeGM.id,

          payload
        }
      );
    }
  );
}


async function handleFrameConnModuleSocketMessage(
  message
) {
  if (
    !message ||
    typeof message !==
      "object"
  ) {
    return;
  }

  if (
    message.kind ===
      FRAME_CONN_SOCKET_KIND
        .LOCK_ON_RESPONSE
  ) {
    if (
      message.requesterUserId !==
        game?.user?.id
    ) {
      return;
    }

    const pending =
      frameConnPendingSocketRequests
        .get(
          message.requestId
        );

    if (!pending) {
      return;
    }

    frameConnPendingSocketRequests
      .delete(
        message.requestId
      );

    window.clearTimeout(
      pending.timeoutId
    );

    if (message.ok) {
      pending.resolve(
        message.result ??
        null
      );
    } else {
      pending.reject(
        new Error(
          message.error ??
          "The GM could not apply Lock On."
        )
      );
    }

    return;
  }

  if (
    message.kind !==
      FRAME_CONN_SOCKET_KIND
        .LOCK_ON_REQUEST ||
    !game?.user?.isGM ||
    game.user.id !==
      message.gmUserId
  ) {
    return;
  }

  let ok = false;
  let result = null;
  let error = null;

  try {
    result =
      await getFrameConnLockOnAuthorityExecutor()(
        message.payload ??
        {}
      );

    ok = true;
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : String(caught);
  }

  game.socket.emit(
    FRAME_CONN_SOCKET_CHANNEL,
    {
      kind:
        FRAME_CONN_SOCKET_KIND
          .LOCK_ON_RESPONSE,

      requestId:
        message.requestId,

      requesterUserId:
        message.payload
          ?.requesterUserId ??
        null,

      ok,
      result,
      error
    }
  );
}


function registerFrameConnModuleSocket() {
  if (frameConnModuleSocketRegistered) {
    return true;
  }

  if (
    !game?.socket ||
    typeof game.socket.on !==
      "function"
  ) {
    throw new Error(
      "Frame Conn module socket is unavailable."
    );
  }

  game.socket.on(
    FRAME_CONN_SOCKET_CHANNEL,
    handleFrameConnModuleSocketMessage
  );

  frameConnModuleSocketRegistered =
    true;

  return true;
}


/* ============================================================
   Foundry integration diagnostics
   ============================================================ */

/**
 * Produces a lightweight diagnostic representation of Foundry
 * Integration state.
 */
function getFrameConnFoundryIntegrationDiagnostics() {
  let enabled =
    null;


  try {
    enabled =
      isFrameConnEnabled();
  } catch (_error) {
    /**
     * Settings may not yet be registered if diagnostics are
     * requested before Foundry init.
     */
    enabled =
      null;
  }


  return Object.freeze({
    moduleId:
      MODULE_ID,

    moduleTitle:
      MODULE_TITLE,

    enabled,

    sceneControlName:
      FRAME_CONN_SCENE_CONTROL_NAME,

    runtimeBindings:
      getFrameConnFoundryIntegrationRuntimeBindings()
  });
}


/* ============================================================
   Foundry integration -- DM SITREP adapters and semantic output
   ============================================================ */

function isFrameConnPrimaryGM() {
  if (!game?.user?.isGM) return false;
  const activeGM = game?.users?.activeGM ?? null;
  return !activeGM || activeGM.id === game.user.id;
}

function resolveFrameConnTokenDocument(value) {
  const direct = value?.document ?? value?.metadata?.tokenDocument ?? value ?? null;
  if (direct && (direct.documentName === "Token" || direct.constructor?.metadata?.name === "Token")) return direct;
  const tokenUuid = value?.tokenUuid ?? value?.uuid ?? (typeof value === "string" ? value : null);
  if (tokenUuid && typeof globalThis.fromUuidSync === "function") {
    const resolved = globalThis.fromUuidSync(tokenUuid);
    return resolved?.document ?? resolved ?? null;
  }
  return null;
}

function createFrameConnTargetingSpatialQueryAdapter() {
  return Object.freeze({
    async resolveEntity(reference) {
      const tokenDocument = resolveFrameConnTokenDocument(reference);
      if (!tokenDocument) return null;
      return { kind: "token", actorUuid: tokenDocument.actor?.uuid ?? null, tokenUuid: tokenDocument.uuid ?? null, sceneId: tokenDocument.parent?.id ?? null, name: tokenDocument.name ?? null, size: Number(tokenDocument.width ?? tokenDocument.actor?.system?.size ?? 1), disposition: tokenDocument.disposition ?? null, metadata: { tokenDocument } };
    },
    async measureDistance(source, target) {
      const sourceDocument = resolveFrameConnTokenDocument(source);
      const targetDocument = resolveFrameConnTokenDocument(target);
      if (!sourceDocument || !targetDocument || typeof sourceDocument.computeRange !== "function") return { distance: null, valid: false, metadata: { reason: "native-compute-range-unavailable" } };
      try {
        const distance = Number(sourceDocument.computeRange(targetDocument));
        return { distance: Number.isFinite(distance) ? distance : null, valid: Number.isFinite(distance), metadata: { source: "lancer-token-document.computeRange" } };
      } catch (error) {
        console.warn("Frame Conn | Native spatial distance query failed.", error);
        return { distance: null, valid: false, metadata: { reason: "native-compute-range-failed" } };
      }
    }
  });
}

function resolveFrameConnSceneRegion({ combat, regionId } = {}) {
  if (!regionId) return null;
  const scene = combat?.scene ?? canvas?.scene ?? null;
  return scene?.regions?.get?.(regionId) ?? null;
}

function frameConnTokenInsideRegion(tokenLike, region) {
  const tokenDocument = resolveFrameConnTokenDocument(tokenLike);
  if (!tokenDocument || !region) return false;
  try { if (typeof tokenDocument.testInsideRegion === "function") return Boolean(tokenDocument.testInsideRegion(region)); }
  catch (error) { console.warn("Frame Conn | Native Region membership query failed.", error); }
  return Boolean(tokenDocument.regions?.has?.(region.id));
}

function getFrameConnActiveCombat() { return game?.combat ?? game?.combats?.active ?? null; }
function listFrameConnCombatRegions(combat = getFrameConnActiveCombat()) { const scene = combat?.scene ?? canvas?.scene ?? null; return Array.from(scene?.regions ?? []); }
function listFrameConnCombatants(combat = getFrameConnActiveCombat()) { return Array.from(combat?.combatants ?? []); }

function escapeFrameConnSemanticOutputText(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('\"', "&quot;").replaceAll("'", "&#039;");
}

function frameConnSitrepResultLabel(status) {
  if (status === "victory") return "MISSION SUCCESS";
  if (status === "defeat") return "MISSION FAILED";
  if (status === "draw") return "NO VICTOR";
  return "MISSION UPDATE";
}

async function publishFrameConnSemanticOutputIntent(intent) {
  if (!intent || typeof intent !== "object" || !isFrameConnPrimaryGM()) return null;
  let content = null;
  if (intent.kind === "sitrep-started") content = `<div class="frame-conn-sitrep-chat"><strong>${escapeFrameConnSemanticOutputText(intent.title || "SITREP STARTED")}</strong><br>Final round: ${escapeFrameConnSemanticOutputText(intent.finalRound)}</div>`;
  else if (intent.kind === "sitrep-ended") content = `<div class="frame-conn-sitrep-chat"><strong>MISSION ENDED</strong></div>`;
  else if (intent.kind === "sitrep-result" || intent.kind === "sitrep-objective-result") content = `<div class="frame-conn-sitrep-chat"><strong>${frameConnSitrepResultLabel(intent.status)}</strong><br>${escapeFrameConnSemanticOutputText(intent.reason)}</div>`;
  else if (intent.kind === "sitrep-round-scored") content = `<div class="frame-conn-sitrep-chat"><strong>CONTROL ROUND ${escapeFrameConnSemanticOutputText(intent.round)} SCORED</strong><br>Allies +${escapeFrameConnSemanticOutputText(intent.friendlyPoints)} / Hostiles +${escapeFrameConnSemanticOutputText(intent.hostilePoints)}<br>Total: ${escapeFrameConnSemanticOutputText(intent.scores?.friendly)} - ${escapeFrameConnSemanticOutputText(intent.scores?.hostile)}</div>`;
  else if (intent.kind === "sitrep-recon-scan") content = `<div class="frame-conn-sitrep-chat"><strong>${escapeFrameConnSemanticOutputText(intent.regionName || "Control Zone")} SCANNED</strong><br>${intent.isTrueZone ? "TRUE CONTROL ZONE" : "FALSE CONTROL ZONE"}</div>`;
  if (!content) return null;
  return ChatMessage.create({ speaker: { alias: "MISSION CONTROL" }, content });
}

/* ============================================================
   Foundry integration feature definition
   ============================================================ */

/**
 * Canonical Foundry Integration feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * Application-wide feature registration remains owned by:
 *
 *   scripts/feature-registry.js
 *
 * Foundry startup sequencing remains owned by:
 *
 *   scripts/runtime-orchestrator.js
 */
export const frameConnFoundryIntegrationFeature =
  defineFrameConnFeature({
    id:
      "foundry-integration",

    domain:
      "foundry.integration",

    provides: [
      "foundry.integration",
      "foundry.settings",
      "foundry.scene-controls",
      "foundry.socket",
      "foundry.lock-on-authority",
      "foundry.spatial-query-adapter",
      "foundry.regions",
      "foundry.gm-authority",
      "foundry.semantic-output"
    ],

    dependsOn: [
      "ui.application"
    ],

    optionalDependsOn: [
      "ui.application.lifecycle"
    ],

    state: {},

    commands: {
      configureRuntime:
        configureFrameConnFoundryIntegrationRuntime,

      registerSettings:
        registerFrameConnSettings,

      openApplication:
        openFrameConnFromFoundryIntegration,

      closeApplication:
        closeFrameConnFromFoundryIntegration,

      addSceneControl:
        addFrameConnControlButton,

      activateTargetTool:
        activateFrameConnTargetTool,

      promptForTarget:
        promptFrameConnForTarget,

      registerSocket:
        registerFrameConnModuleSocket,

      requestLockOnApplication:
        requestFrameConnLockOnApplication
    },

    queries: {
      enabled:
        isFrameConnEnabled,

      presentationMode:
        getFrameConnPresentationModeSetting,

      tokenControls:
        getFrameConnTokenSceneControls,

      hasSceneControl:
        hasFrameConnSceneControlTool,

      selectedTargets:
        getFrameConnUserTargets,

      diagnostics:
        getFrameConnFoundryIntegrationDiagnostics,

      runtimeBindings:
        getFrameConnFoundryIntegrationRuntimeBindings
    },

    hooks: {
      getSceneControlButtons:
        addFrameConnControlButton
    },

    /**
     * Foundry init/ready sequencing deliberately remains outside
     * this feature.
     *
     * Settings registration is therefore an explicit command
     * invoked by runtime-orchestrator.js during Hooks.once("init").
     */
    lifecycle: {},

    api: {
      configureRuntime:
        configureFrameConnFoundryIntegrationRuntime,

      registerSettings:
        registerFrameConnSettings,

      isEnabled:
        isFrameConnEnabled,

      getPresentationMode:
        getFrameConnPresentationModeSetting,

      setPresentationMode:
        setFrameConnPresentationModeSetting,

      open:
        openFrameConnFromFoundryIntegration,

      close:
        closeFrameConnFromFoundryIntegration,

      addSceneControl:
        addFrameConnControlButton,

      getTokenControls:
        getFrameConnTokenSceneControls,

      createSceneControlTool:
        createFrameConnSceneControlTool,

      hasSceneControl:
        hasFrameConnSceneControlTool,

      insertSceneControl:
        insertFrameConnSceneControlTool,

      getSelectedTargets:
        getFrameConnUserTargets,

      activateTargetTool:
        activateFrameConnTargetTool,

      promptForTarget:
        promptFrameConnForTarget,

      registerSocket:
        registerFrameConnModuleSocket,

      requestLockOnApplication:
        requestFrameConnLockOnApplication,

      createTargetingSpatialQueryAdapter:
        createFrameConnTargetingSpatialQueryAdapter,

      resolveSceneRegion:
        resolveFrameConnSceneRegion,

      tokenInsideRegion:
        frameConnTokenInsideRegion,

      isPrimaryGM:
        isFrameConnPrimaryGM,

      publishSemanticOutputIntent:
        publishFrameConnSemanticOutputIntent,

      getActiveCombat:
        getFrameConnActiveCombat,

      listCombatRegions:
        listFrameConnCombatRegions,

      listCombatants:
        listFrameConnCombatants,

      diagnostics:
        getFrameConnFoundryIntegrationDiagnostics,

      runtimeBindings:
        getFrameConnFoundryIntegrationRuntimeBindings
    },

    metadata: {
      label:
        "Foundry Integration",

      description:
        "Owns Frame Conn module settings and Foundry Token scene-control integration.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      applicationFeature:
        "styles/ui-application.js",

      registry:
        "scripts/feature-registry.js",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "foundry-shell-integration",

      startupPolicy:
        "runtime-orchestrator-retains-foundry-startup-boundaries",

      ownedFoundrySurfaces: [
        "module settings",
        "getSceneControlButtons"
      ]
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

/**
 * Named exports preserve straightforward migration while the
 * runtime orchestrator is converted to registry access.
 *
 * New cross-feature consumers should preferably resolve this
 * feature through frameConnFeatureRegistry.
 */
export {
  configureFrameConnFoundryIntegrationRuntime,

  getFrameConnFoundryIntegrationRuntimeBindings,

  openFrameConnFromFoundryIntegration,

  closeFrameConnFromFoundryIntegration,

  isFrameConnEnabled,

  handleFrameConnEnabledSettingChange,

  registerFrameConnSettings,

  getFrameConnTokenSceneControls,

  createFrameConnSceneControlTool,

  hasFrameConnSceneControlTool,

  insertFrameConnSceneControlTool,

  addFrameConnControlButton,

  getFrameConnFoundryIntegrationDiagnostics
};