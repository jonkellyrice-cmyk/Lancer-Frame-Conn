/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-feature.js
 */


/**
 * ============================================================
 * FRAME HELM FEATURE -- TURN
 * ============================================================
 *
 * ROLE:
 *   Provides the primary composition and feature-declaration
 *   surface for the Frame Helm Turn domain.
 *
 * PURPOSE:
 *   Assemble the independently-owned Turn submodules into the
 *   canonical Turn feature consumed by Frame Helm's application-
 *   wide feature registry.
 *
 * OWNS:
 *   - Turn feature declaration.
 *   - Turn capability declaration.
 *   - Turn dependency declaration.
 *   - Turn command composition.
 *   - Turn query composition.
 *   - Turn Foundry-hook composition.
 *   - Turn public API composition.
 *   - Turn-domain metadata.
 *
 * DOES NOT OWN:
 *   - FrameHelmTurnState implementation.
 *   - FrameHelmTurnStateManager implementation.
 *   - Turn movement-state implementation.
 *   - Runtime-binding implementation.
 *   - Combat synchronization implementation.
 *   - Action registry implementation.
 *   - Application rendering implementation.
 *   - Action execution.
 *   - Telemetry synchronization.
 *
 * DOMAIN COMPOSITION:
 *
 *   turn-runtime-bindings.js
 *           │
 *           ▼
 *   turn-state.js
 *           │
 *           ├── turn-state-movement.js
 *           │
 *           ▼
 *   turn-state-manager.js
 *           │
 *           ├───────────────┐
 *           ▼               ▼
 *   turn-commands.js   turn-combat-sync.js
 *           │               │
 *           └───────┬───────┘
 *                   ▼
 *             turn-feature.js
 *                   │
 *                   ▼
 *          ../feature-registry.js
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *
 *     - turn.state
 *     - turn.lifecycle
 *     - turn.actions
 *     - turn.protocol
 *     - turn.reaction
 *     - turn.committed-actions
 *     - turn.combat-sync
 *
 *   Required dependencies:
 *
 *     - actions.registry
 *
 *   Optional dependencies:
 *
 *     - ui.application.rendering
 *
 * PUBLIC STATE CONTRACT:
 *
 *   getCurrent()
 *
 *     Returns the currently-active FrameHelmTurnState, or null.
 *
 *   getManager()
 *
 *     Returns the canonical FrameHelmTurnStateManager.
 *
 *   snapshot()
 *
 *     Returns the serializable current Turn snapshot, or null.
 *
 *   Compatibility getters .current and .state are retained for
 *   existing consumers.
 *
 * STABILITY CONTRACT:
 *
 *   This refactor changes ownership and composition only.
 *
 *   Existing Turn behavior, action legality, movement accounting,
 *   committed-action state, history, snapshots, and combat
 *   synchronization are preserved.
 */


/* ============================================================
   Imports -- Feature contract
   ============================================================ */

import {
  defineFrameHelmFeature
} from "../feature-contract.js";


/* ============================================================
   Imports -- Runtime bindings
   ============================================================ */

import {
  configureFrameHelmTurnRuntime,
  getFrameHelmTurnRuntimeBindings,
  getFrameHelmTurnActionRegistry,
  renderFrameHelmTurnApplication
} from "./turn-runtime-bindings.js";


/* ============================================================
   Imports -- Turn state
   ============================================================ */

import {
  FrameHelmTurnState
} from "./turn-state.js";


/* ============================================================
   Imports -- Turn state manager
   ============================================================ */

import {
  FrameHelmTurnStateManager,
  frameHelmTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Imports -- Turn commands and queries
   ============================================================ */

import {
  getCurrentFrameHelmTurn,
  getFrameHelmTurnStateManager,
  getFrameHelmTurnSnapshot,

  beginFrameHelmTurn,
  ensureFrameHelmTurn,
  endFrameHelmTurn,
  clearFrameHelmTurn,

  canUseFrameHelmTurnAction,
  useFrameHelmTurnAction,

  spendFrameHelmTurnMovement,
  setFrameHelmTurnSpeed,

  useFrameHelmTurnOvercharge
} from "./turn-commands.js";


/* ============================================================
   Imports -- Combat synchronization
   ============================================================ */

import {
  activeCombatTurnContext,
  syncTurnStateToCombat,

  handleFrameHelmCombatStart,
  handleFrameHelmCombatUpdate,
  handleFrameHelmCombatDelete
} from "./turn-combat-sync.js";


/* ============================================================
   Turn feature definition
   ============================================================ */

/**
 * Canonical Turn feature declaration.
 *
 * This file defines the feature but does not register itself.
 *
 * Application-wide feature registration remains owned by:
 *
 *   scripts/feature-registry.js
 */
export const frameHelmTurnFeature =
  defineFrameHelmFeature({
    id:
      "turn",

    domain:
      "turn",


    /* --------------------------------------------------------
       Provided capabilities
       -------------------------------------------------------- */

    provides: [
      "turn.state",
      "turn.lifecycle",
      "turn.actions",
      "turn.protocol",
      "turn.reaction",
      "turn.committed-actions",
      "turn.combat-sync"
    ],


    /* --------------------------------------------------------
       Required dependencies
       -------------------------------------------------------- */

    dependsOn: [
      "actions.registry"
    ],


    /* --------------------------------------------------------
       Optional dependencies
       -------------------------------------------------------- */

    optionalDependsOn: [
      "ui.application.rendering"
    ],


    /* --------------------------------------------------------
       State
       -------------------------------------------------------- */

    state: {
      manager:
        frameHelmTurnState
    },


    /* --------------------------------------------------------
       Commands
       -------------------------------------------------------- */

    commands: {
      configureRuntime:
        configureFrameHelmTurnRuntime,

      begin:
        beginFrameHelmTurn,

      ensure:
        ensureFrameHelmTurn,

      end:
        endFrameHelmTurn,

      clear:
        clearFrameHelmTurn,

      sync:
        syncTurnStateToCombat,

      canUseAction:
        canUseFrameHelmTurnAction,

      useAction:
        useFrameHelmTurnAction,

      spendMovement:
        spendFrameHelmTurnMovement,

      setSpeed:
        setFrameHelmTurnSpeed,

      overcharge:
        useFrameHelmTurnOvercharge
    },


    /* --------------------------------------------------------
       Queries
       -------------------------------------------------------- */

    queries: {
      current:
        getCurrentFrameHelmTurn,

      manager:
        getFrameHelmTurnStateManager,

      snapshot:
        getFrameHelmTurnSnapshot,

      context:
        activeCombatTurnContext,

      runtimeBindings:
        getFrameHelmTurnRuntimeBindings
    },


    /* --------------------------------------------------------
       Foundry hooks
       -------------------------------------------------------- */

    hooks: {
      combatStart:
        handleFrameHelmCombatStart,

      updateCombat:
        handleFrameHelmCombatUpdate,

      deleteCombat:
        handleFrameHelmCombatDelete
    },


    /* --------------------------------------------------------
       Lifecycle
       -------------------------------------------------------- */

    lifecycle: {},


    /* --------------------------------------------------------
       Public API
       -------------------------------------------------------- */

    api: {
      manager:
        frameHelmTurnState,

      configureRuntime:
        configureFrameHelmTurnRuntime,


      /* ------------------------------------------------------
         Lifecycle
         ------------------------------------------------------ */

      begin:
        beginFrameHelmTurn,

      ensure:
        ensureFrameHelmTurn,

      end:
        endFrameHelmTurn,

      clear:
        clearFrameHelmTurn,


      /* ------------------------------------------------------
         Combat synchronization
         ------------------------------------------------------ */

      sync:
        syncTurnStateToCombat,


      /* ------------------------------------------------------
         Explicit state queries
         ------------------------------------------------------ */

      getCurrent:
        getCurrentFrameHelmTurn,

      getManager:
        getFrameHelmTurnStateManager,

      snapshot:
        getFrameHelmTurnSnapshot,


      /* ------------------------------------------------------
         Compatibility state accessors
         ------------------------------------------------------ */

      get current() {
        return (
          getCurrentFrameHelmTurn()
        );
      },

      get state() {
        return (
          getFrameHelmTurnSnapshot()
        );
      },


      /* ------------------------------------------------------
         Action state
         ------------------------------------------------------ */

      canUse:
        canUseFrameHelmTurnAction,

      use:
        useFrameHelmTurnAction,


      /* ------------------------------------------------------
         Transitional movement state
         ------------------------------------------------------ */

      move:
        spendFrameHelmTurnMovement,

      setSpeed:
        setFrameHelmTurnSpeed,


      /* ------------------------------------------------------
         Overcharge
         ------------------------------------------------------ */

      overcharge:
        useFrameHelmTurnOvercharge,


      /* ------------------------------------------------------
         Combat context
         ------------------------------------------------------ */

      activeCombatContext:
        activeCombatTurnContext,


      /* ------------------------------------------------------
         Runtime diagnostics
         ------------------------------------------------------ */

      runtimeBindings:
        getFrameHelmTurnRuntimeBindings
    },


    /* --------------------------------------------------------
       Metadata
       -------------------------------------------------------- */

    metadata: {
      label:
        "Turn State",

      description:
        "Composes Frame Helm per-turn state, action budgets, protocol/reaction state, committed actions, transitional movement accounting, and Foundry combat-turn synchronization.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      featureDirectory:
        "scripts/feature_turn",

      stateModule:
        "scripts/feature_turn/turn-state.js",

      movementStateModule:
        "scripts/feature_turn/turn-state-movement.js",

      stateManagerModule:
        "scripts/feature_turn/turn-state-manager.js",

      runtimeBindingsModule:
        "scripts/feature_turn/turn-runtime-bindings.js",

      commandsModule:
        "scripts/feature_turn/turn-commands.js",

      combatSyncModule:
        "scripts/feature_turn/turn-combat-sync.js",

      companionUiModule:
        "styles/ui-turn.js",

      companionStylesheet:
        "styles/ui-turn.css",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js",

      extractionModel:
        "feature-composition-surface-with-domain-submodules",

      futureExtractionTargets: [
        "movement-feature.js"
      ]
    }
  });


/* ============================================================
   Transitional named exports -- Runtime bindings
   ============================================================ */

export {
  configureFrameHelmTurnRuntime,

  getFrameHelmTurnRuntimeBindings,

  getFrameHelmTurnActionRegistry,

  renderFrameHelmTurnApplication
};


/* ============================================================
   Transitional named exports -- State
   ============================================================ */

export {
  FrameHelmTurnState,

  FrameHelmTurnStateManager,

  frameHelmTurnState
};


/* ============================================================
   Transitional named exports -- Queries
   ============================================================ */

export {
  getCurrentFrameHelmTurn,

  getFrameHelmTurnStateManager,

  getFrameHelmTurnSnapshot
};


/* ============================================================
   Transitional named exports -- Commands
   ============================================================ */

export {
  beginFrameHelmTurn,

  ensureFrameHelmTurn,

  endFrameHelmTurn,

  clearFrameHelmTurn,

  canUseFrameHelmTurnAction,

  useFrameHelmTurnAction,

  spendFrameHelmTurnMovement,

  setFrameHelmTurnSpeed,

  useFrameHelmTurnOvercharge
};


/* ============================================================
   Transitional named exports -- Combat synchronization
   ============================================================ */

export {
  activeCombatTurnContext,

  syncTurnStateToCombat,

  handleFrameHelmCombatStart,

  handleFrameHelmCombatUpdate,

  handleFrameHelmCombatDelete
};
