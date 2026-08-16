/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature_turn/turn-feature.js
 */


/**
 * ============================================================
 * FRAME CONN FEATURE -- TURN
 * ============================================================
 *
 * ROLE:
 *   Provides the primary composition and feature-declaration
 *   surface for the Frame Conn Turn domain.
 *
 * PURPOSE:
 *   Assemble the independently-owned Turn submodules into the
 *   canonical Turn feature consumed by Frame Conn's application-
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
 *   - FrameConnTurnState implementation.
 *   - FrameConnTurnStateManager implementation.
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
 *     Returns the currently-active FrameConnTurnState, or null.
 *
 *   getManager()
 *
 *     Returns the canonical FrameConnTurnStateManager.
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
  defineFrameConnFeature
} from "../../feature-contract.js";


/* ============================================================
   Imports -- Runtime bindings
   ============================================================ */

import {
  configureFrameConnTurnRuntime,
  getFrameConnTurnRuntimeBindings,
  getFrameConnTurnActionRegistry,
  renderFrameConnTurnApplication
} from "./turn-runtime-bindings.js";


/* ============================================================
   Imports -- Turn state
   ============================================================ */

import {
  FrameConnTurnState
} from "./turn-state.js";


/* ============================================================
   Imports -- Turn state manager
   ============================================================ */

import {
  FrameConnTurnStateManager,
  frameConnTurnState
} from "./turn-state-manager.js";


/* ============================================================
   Imports -- Turn commands and queries
   ============================================================ */

import {
  getCurrentFrameConnTurn,
  getFrameConnTurnStateManager,
  getFrameConnTurnSnapshot,

  beginFrameConnTurn,
  ensureFrameConnTurn,
  endFrameConnTurn,
  clearFrameConnTurn,

  canUseFrameConnTurnAction,
  useFrameConnTurnAction,

  canUseFrameConnTurnReactionForActor,
  useFrameConnTurnReactionForActor,
  releaseFrameConnTurnReactionForActor,
  setFrameConnTurnReactionLockForActor,
  applyFrameConnBraceTurnRestriction,

  spendFrameConnTurnMovement,
  setFrameConnTurnSpeed,

  useFrameConnTurnOvercharge
} from "./turn-commands.js";


/* ============================================================
   Imports -- Combat synchronization
   ============================================================ */

import {
  activeCombatTurnContext,
  syncTurnStateToCombat,

  handleFrameConnCombatStart,
  handleFrameConnCombatUpdate,
  handleFrameConnCombatDelete
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
export const frameConnTurnFeature =
  defineFrameConnFeature({
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
        frameConnTurnState
    },


    /* --------------------------------------------------------
       Commands
       -------------------------------------------------------- */

    commands: {
      configureRuntime:
        configureFrameConnTurnRuntime,

      begin:
        beginFrameConnTurn,

      ensure:
        ensureFrameConnTurn,

      end:
        endFrameConnTurn,

      clear:
        clearFrameConnTurn,

      sync:
        syncTurnStateToCombat,

      canUseAction:
        canUseFrameConnTurnAction,

      useAction:
        useFrameConnTurnAction,

      canUseReactionForActor:
        canUseFrameConnTurnReactionForActor,

      useReactionForActor:
        useFrameConnTurnReactionForActor,

      releaseReactionForActor:
        releaseFrameConnTurnReactionForActor,

      setReactionLockForActor:
        setFrameConnTurnReactionLockForActor,

      applyBraceRestriction:
        applyFrameConnBraceTurnRestriction,

      spendMovement:
        spendFrameConnTurnMovement,

      setSpeed:
        setFrameConnTurnSpeed,

      overcharge:
        useFrameConnTurnOvercharge
    },


    /* --------------------------------------------------------
       Queries
       -------------------------------------------------------- */

    queries: {
      current:
        getCurrentFrameConnTurn,

      manager:
        getFrameConnTurnStateManager,

      snapshot:
        getFrameConnTurnSnapshot,

      context:
        activeCombatTurnContext,

      runtimeBindings:
        getFrameConnTurnRuntimeBindings
    },


    /* --------------------------------------------------------
       Foundry hooks
       -------------------------------------------------------- */

    hooks: {
      combatStart:
        handleFrameConnCombatStart,

      updateCombat:
        handleFrameConnCombatUpdate,

      deleteCombat:
        handleFrameConnCombatDelete
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
        frameConnTurnState,

      configureRuntime:
        configureFrameConnTurnRuntime,


      /* ------------------------------------------------------
         Lifecycle
         ------------------------------------------------------ */

      begin:
        beginFrameConnTurn,

      ensure:
        ensureFrameConnTurn,

      end:
        endFrameConnTurn,

      clear:
        clearFrameConnTurn,


      /* ------------------------------------------------------
         Combat synchronization
         ------------------------------------------------------ */

      sync:
        syncTurnStateToCombat,


      /* ------------------------------------------------------
         Explicit state queries
         ------------------------------------------------------ */

      getCurrent:
        getCurrentFrameConnTurn,

      getManager:
        getFrameConnTurnStateManager,

      snapshot:
        getFrameConnTurnSnapshot,


      /* ------------------------------------------------------
         Compatibility state accessors
         ------------------------------------------------------ */

      get current() {
        return (
          getCurrentFrameConnTurn()
        );
      },

      get state() {
        return (
          getFrameConnTurnSnapshot()
        );
      },


      /* ------------------------------------------------------
         Action state
         ------------------------------------------------------ */

      canUse:
        canUseFrameConnTurnAction,

      use:
        useFrameConnTurnAction,

      canUseReactionForActor:
        canUseFrameConnTurnReactionForActor,

      useReactionForActor:
        useFrameConnTurnReactionForActor,

      releaseReactionForActor:
        releaseFrameConnTurnReactionForActor,

      setReactionLockForActor:
        setFrameConnTurnReactionLockForActor,

      applyBraceRestriction:
        applyFrameConnBraceTurnRestriction,


      /* ------------------------------------------------------
         Transitional movement state
         ------------------------------------------------------ */

      move:
        spendFrameConnTurnMovement,

      setSpeed:
        setFrameConnTurnSpeed,


      /* ------------------------------------------------------
         Overcharge
         ------------------------------------------------------ */

      overcharge:
        useFrameConnTurnOvercharge,


      /* ------------------------------------------------------
         Combat context
         ------------------------------------------------------ */

      activeCombatContext:
        activeCombatTurnContext,


      /* ------------------------------------------------------
         Runtime diagnostics
         ------------------------------------------------------ */

      runtimeBindings:
        getFrameConnTurnRuntimeBindings
    },


    /* --------------------------------------------------------
       Metadata
       -------------------------------------------------------- */

    metadata: {
      label:
        "Turn State",

      description:
        "Composes Frame Conn per-turn state, action budgets, protocol/reaction state, committed actions, transitional movement accounting, and Foundry combat-turn synchronization.",

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
  configureFrameConnTurnRuntime,

  getFrameConnTurnRuntimeBindings,

  getFrameConnTurnActionRegistry,

  renderFrameConnTurnApplication
};


/* ============================================================
   Transitional named exports -- State
   ============================================================ */

export {
  FrameConnTurnState,

  FrameConnTurnStateManager,

  frameConnTurnState
};


/* ============================================================
   Transitional named exports -- Queries
   ============================================================ */

export {
  getCurrentFrameConnTurn,

  getFrameConnTurnStateManager,

  getFrameConnTurnSnapshot
};


/* ============================================================
   Transitional named exports -- Commands
   ============================================================ */

export {
  beginFrameConnTurn,

  ensureFrameConnTurn,

  endFrameConnTurn,

  clearFrameConnTurn,

  canUseFrameConnTurnAction,

  useFrameConnTurnAction,

  canUseFrameConnTurnReactionForActor,

  useFrameConnTurnReactionForActor,

  releaseFrameConnTurnReactionForActor,

  setFrameConnTurnReactionLockForActor,

  applyFrameConnBraceTurnRestriction,

  spendFrameConnTurnMovement,

  setFrameConnTurnSpeed,

  useFrameConnTurnOvercharge
};


/* ============================================================
   Transitional named exports -- Combat synchronization
   ============================================================ */

export {
  activeCombatTurnContext,

  syncTurnStateToCombat,

  handleFrameConnCombatStart,

  handleFrameConnCombatUpdate,

  handleFrameConnCombatDelete
};
