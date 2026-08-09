/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/foundry-integration-feature.js
 */


/**
 * ============================================================
 * FRAME HELM FEATURE -- FOUNDRY INTEGRATION
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Helm's direct integration with Foundry's module
 *   settings and scene-control surfaces.
 *
 * PURPOSE:
 *   Remove Foundry-specific application-shell integration from
 *   runtime-orchestrator.js while preserving Frame Helm startup
 *   behavior and public interaction exactly.
 *
 * RESPONSIBILITIES:
 *   - Register Frame Helm module settings.
 *   - Resolve whether Frame Helm is enabled.
 *   - React when the enabled setting changes.
 *   - Close the Frame Helm Application when disabled.
 *   - Add the Frame Helm launcher to Token scene controls.
 *   - Support Foundry scene-control collection shapes.
 *   - Prevent duplicate Frame Helm scene-control tools.
 *   - Declare the getSceneControlButtons Foundry hook.
 *   - Expose Foundry-integration diagnostics.
 *
 * DOES NOT OWN:
 *   - Foundry init/ready startup boundaries.
 *   - Canonical feature registration.
 *   - Feature dependency ordering.
 *   - Cross-feature runtime composition.
 *   - Public game.lancerFrameHelm composition.
 *   - FrameHelmApplication implementation.
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
  defineFrameHelmFeature
} from "./feature-contract.js";


/* ============================================================
   Foundry integration identity
   ============================================================ */

const MODULE_ID =
  "lancer-frame-helm";


const MODULE_TITLE =
  "Lancer: Frame Helm";


const FRAME_HELM_SCENE_CONTROL_NAME =
  "lancer-frame-helm";


/* ============================================================
   Foundry integration runtime bindings
   ============================================================ */

/**
 * Explicit dependency bridge for Application UI behavior.
 *
 * Foundry Integration knows that Frame Helm may be opened or
 * closed, but does not own the Application implementation.
 */
const frameHelmFoundryIntegrationRuntimeBindings = {
  openApplication:
    null,

  closeApplication:
    null
};


/**
 * Configures Foundry Integration's external runtime surfaces.
 *
 * Unknown bindings are rejected deliberately so this remains a
 * narrow dependency boundary rather than becoming an application
 * service container.
 */
function configureFrameHelmFoundryIntegrationRuntime(
  bindings = {}
) {
  if (
    !bindings ||
    typeof bindings !==
      "object"
  ) {
    throw new TypeError(
      "Frame Helm Foundry Integration runtime bindings must be supplied as an object."
    );
  }


  const allowedKeys =
    new Set(
      Object.keys(
        frameHelmFoundryIntegrationRuntimeBindings
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
        `Frame Helm Foundry Integration received unknown runtime binding: ${key}`
      );
    }


    if (
      value !== null &&
      typeof value !==
        "function"
    ) {
      throw new TypeError(
        `Frame Helm Foundry Integration runtime binding "${key}" must be a function or null.`
      );
    }


    frameHelmFoundryIntegrationRuntimeBindings[
      key
    ] = value;
  }


  return (
    getFrameHelmFoundryIntegrationRuntimeBindings()
  );
}


/**
 * Returns runtime-binding availability without exposing the bound
 * functions themselves.
 */
function getFrameHelmFoundryIntegrationRuntimeBindings() {
  return Object.freeze({
    applicationOpening:
      typeof frameHelmFoundryIntegrationRuntimeBindings
        .openApplication ===
        "function",

    applicationClosing:
      typeof frameHelmFoundryIntegrationRuntimeBindings
        .closeApplication ===
        "function"
  });
}


/* ============================================================
   Application integration accessors
   ============================================================ */

/**
 * Requests that the primary Frame Helm Application open.
 *
 * Application ownership remains with ui-application.js.
 */
function openFrameHelmFromFoundryIntegration(
  ...args
) {
  const openApplication =
    frameHelmFoundryIntegrationRuntimeBindings
      .openApplication;


  if (
    typeof openApplication !==
    "function"
  ) {
    throw new Error(
      "Frame Helm Foundry Integration could not resolve the Application open surface."
    );
  }


  return (
    openApplication(
      ...args
    )
  );
}


/**
 * Requests that the primary Frame Helm Application close.
 *
 * Application ownership remains with ui-application.js.
 */
function closeFrameHelmFromFoundryIntegration(
  ...args
) {
  const closeApplication =
    frameHelmFoundryIntegrationRuntimeBindings
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
 * Returns whether Frame Helm is currently enabled for this world.
 *
 * This query assumes settings registration has already occurred at
 * the Foundry init boundary.
 */
function isFrameHelmEnabled() {
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
 * Handles changes to the Frame Helm enabled setting.
 *
 * Disabling the feature closes the currently-open Application.
 */
function handleFrameHelmEnabledSettingChange(
  enabled
) {
  if (
    enabled
  ) {
    return null;
  }


  return (
    closeFrameHelmFromFoundryIntegration()
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
function registerFrameHelmSettings() {
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
        handleFrameHelmEnabledSettingChange
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
function getFrameHelmTokenSceneControls(
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
 * Constructs the Frame Helm Token scene-control launcher.
 */
function createFrameHelmSceneControlTool() {
  return {
    name:
      FRAME_HELM_SCENE_CONTROL_NAME,

    title:
      MODULE_TITLE,

    icon:
      "fas fa-robot",

    button:
      true,

    visible:
      true,

    onClick:
      openFrameHelmFromFoundryIntegration
  };
}


/* ============================================================
   Scene controls -- Existing tool inspection
   ============================================================ */

/**
 * Returns whether the Token controls already contain the Frame
 * Helm launcher.
 */
function hasFrameHelmSceneControlTool(
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
          FRAME_HELM_SCENE_CONTROL_NAME
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
        FRAME_HELM_SCENE_CONTROL_NAME
      ]
    );
  }


  return false;
}


/* ============================================================
   Scene controls -- Tool insertion
   ============================================================ */

/**
 * Adds the Frame Helm launcher to a resolved Token scene-control
 * group.
 *
 * Supports both array- and object-based Foundry tool containers.
 */
function insertFrameHelmSceneControlTool(
  tokenControls,
  tool =
    createFrameHelmSceneControlTool()
) {
  if (
    !tokenControls
  ) {
    return false;
  }


  if (
    hasFrameHelmSceneControlTool(
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
    FRAME_HELM_SCENE_CONTROL_NAME
  ] = tool;


  return true;
}


/* ============================================================
   Scene controls -- Foundry integration
   ============================================================ */

/**
 * Adds the Frame Helm launcher to Foundry's Token controls when
 * the module is enabled.
 */
function addFrameHelmControlButton(
  controls
) {
  if (
    !isFrameHelmEnabled()
  ) {
    return false;
  }


  const tokenControls =
    getFrameHelmTokenSceneControls(
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


  return (
    insertFrameHelmSceneControlTool(
      tokenControls
    )
  );
}


/* ============================================================
   Foundry integration diagnostics
   ============================================================ */

/**
 * Produces a lightweight diagnostic representation of Foundry
 * Integration state.
 */
function getFrameHelmFoundryIntegrationDiagnostics() {
  let enabled =
    null;


  try {
    enabled =
      isFrameHelmEnabled();
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
      FRAME_HELM_SCENE_CONTROL_NAME,

    runtimeBindings:
      getFrameHelmFoundryIntegrationRuntimeBindings()
  });
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
export const frameHelmFoundryIntegrationFeature =
  defineFrameHelmFeature({
    id:
      "foundry-integration",

    domain:
      "foundry.integration",

    provides: [
      "foundry.integration",
      "foundry.settings",
      "foundry.scene-controls"
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
        configureFrameHelmFoundryIntegrationRuntime,

      registerSettings:
        registerFrameHelmSettings,

      openApplication:
        openFrameHelmFromFoundryIntegration,

      closeApplication:
        closeFrameHelmFromFoundryIntegration,

      addSceneControl:
        addFrameHelmControlButton
    },

    queries: {
      enabled:
        isFrameHelmEnabled,

      tokenControls:
        getFrameHelmTokenSceneControls,

      hasSceneControl:
        hasFrameHelmSceneControlTool,

      diagnostics:
        getFrameHelmFoundryIntegrationDiagnostics,

      runtimeBindings:
        getFrameHelmFoundryIntegrationRuntimeBindings
    },

    hooks: {
      getSceneControlButtons:
        addFrameHelmControlButton
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
        configureFrameHelmFoundryIntegrationRuntime,

      registerSettings:
        registerFrameHelmSettings,

      isEnabled:
        isFrameHelmEnabled,

      open:
        openFrameHelmFromFoundryIntegration,

      close:
        closeFrameHelmFromFoundryIntegration,

      addSceneControl:
        addFrameHelmControlButton,

      getTokenControls:
        getFrameHelmTokenSceneControls,

      createSceneControlTool:
        createFrameHelmSceneControlTool,

      hasSceneControl:
        hasFrameHelmSceneControlTool,

      insertSceneControl:
        insertFrameHelmSceneControlTool,

      diagnostics:
        getFrameHelmFoundryIntegrationDiagnostics,

      runtimeBindings:
        getFrameHelmFoundryIntegrationRuntimeBindings
    },

    metadata: {
      label:
        "Foundry Integration",

      description:
        "Owns Frame Helm module settings and Foundry Token scene-control integration.",

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
 * feature through frameHelmFeatureRegistry.
 */
export {
  configureFrameHelmFoundryIntegrationRuntime,

  getFrameHelmFoundryIntegrationRuntimeBindings,

  openFrameHelmFromFoundryIntegration,

  closeFrameHelmFromFoundryIntegration,

  isFrameHelmEnabled,

  handleFrameHelmEnabledSettingChange,

  registerFrameHelmSettings,

  getFrameHelmTokenSceneControls,

  createFrameHelmSceneControlTool,

  hasFrameHelmSceneControlTool,

  insertFrameHelmSceneControlTool,

  addFrameHelmControlButton,

  getFrameHelmFoundryIntegrationDiagnostics
};