/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature-registry-core.js
 */


/**
 * ============================================================
 * FRAME CONN FEATURE REGISTRY CORE
 * ============================================================
 *
 * ROLE:
 *   Provides the reusable implementation mechanics for the
 *   Frame Conn feature registry.
 *
 * PURPOSE:
 *   Define how Frame Conn feature definitions are registered,
 *   indexed, validated, ordered, executed, inspected, and
 *   integrated with Foundry hooks without knowing which concrete
 *   features belong to the application.
 *
 * OWNS:
 *   - FrameConnFeatureRegistry implementation.
 *   - Registry versioning.
 *   - Registry runtime-state constants.
 *   - Feature registration mechanics.
 *   - Feature identity lookup.
 *   - Capability ownership indexing.
 *   - Capability-provider lookup.
 *   - Public feature-surface lookup.
 *   - Required dependency validation.
 *   - Optional dependency inspection.
 *   - Dependency-safe feature ordering.
 *   - Feature execution-context construction.
 *   - Lifecycle execution.
 *   - Foundry hook installation.
 *   - Foundry hook teardown.
 *   - Per-feature runtime bookkeeping.
 *   - Registry diagnostics.
 *   - Registry reset behavior.
 *
 * DOES NOT OWN:
 *   - Which Frame Conn features are registered.
 *   - Runtime/domain feature imports.
 *   - Executable UI feature imports.
 *   - Application-wide feature declarations.
 *   - Canonical feature-package composition.
 *   - Canonical registry instance creation.
 *   - Immediate application graph validation.
 *   - Feature behavior.
 *   - Gameplay rules.
 *   - UI rendering.
 *   - Foundry hook handler behavior.
 *   - Runtime startup orchestration.
 *   - CSS registration.
 *   - Stylesheet composition.
 *
 * ARCHITECTURAL RELATIONSHIP:
 *
 *   feature-contract.js
 *        │
 *        │ defines valid feature shape
 *        ▼
 *   feature-registry-core.js
 *        │
 *        │ defines registry mechanics
 *        ▼
 *   feature-registry.js
 *        │
 *        │ declares application feature set
 *        ▼
 *   runtime-orchestrator.js
 *
 *
 * APPLICATION DECLARATION BOUNDARY:
 *
 *   Concrete feature imports and registration declarations belong
 *   in:
 *
 *     scripts/feature-registry.js
 *
 *   This file MUST NOT import:
 *
 *     - actions-feature.js
 *     - sensors-feature.js
 *     - turn-feature.js
 *     - movement-feature.js
 *     - future runtime feature modules
 *     - styles/ui-registry.js
 *
 *   Doing so would couple reusable registry mechanics back to the
 *   current application feature graph.
 *
 * DESIGN CONTRACT:
 *
 *   This module answers:
 *
 *     "How does the Frame Conn feature registry work?"
 *
 *   scripts/feature-registry.js answers:
 *
 *     "Which features are registered in Frame Conn?"
 *
 * STABILITY CONTRACT:
 *
 *   Moving registry mechanics into this module changes ownership
 *   and file organization only.
 *
 *   Registration semantics, capability validation, dependency
 *   ordering, lifecycle behavior, hook installation, diagnostics,
 *   and reset behavior are preserved.
 */


/* ============================================================
   Imports -- Feature contract
   ============================================================ */

import {
  FRAME_CONN_FEATURE_CONTRACT_VERSION,
  FRAME_CONN_FEATURE_LIFECYCLE_PHASES,
  assertFrameConnFeatureDefinition,
  summarizeFrameConnFeature
} from "./feature-contract.js";


/* ============================================================
   Registry constants
   ============================================================ */

/**
 * Registry implementation version.
 *
 * This is intentionally independent from the feature-contract
 * version so registry mechanics may evolve without changing the
 * shape of feature definitions.
 */
export const FRAME_CONN_FEATURE_REGISTRY_VERSION =
  1;


/**
 * Runtime states tracked for each registered feature.
 */
export const FRAME_CONN_FEATURE_RUNTIME_STATES =
  Object.freeze({
    REGISTERED:
      "registered",

    INITIALIZED:
      "initialized",

    READY:
      "ready",

    SHUT_DOWN:
      "shut-down"
  });


/* ============================================================
   Registry utilities -- Identifier normalization
   ============================================================ */

/**
 * Normalizes a required registry lookup identifier.
 *
 * Registry-facing feature ids, capability ids, and lifecycle
 * phases must resolve to non-empty strings.
 */
function normalizeFrameConnRegistryIdentifier(
  value,
  description
) {
  const normalized =
    String(
      value ??
      ""
    ).trim();


  if (
    !normalized
  ) {
    throw new Error(
      `${description} requires a non-empty identifier.`
    );
  }


  return normalized;
}


/* ============================================================
   Registry utilities -- Runtime records
   ============================================================ */

/**
 * Creates mutable runtime bookkeeping for one registered feature.
 *
 * Feature definitions remain immutable contract objects.
 *
 * Lifecycle state and installed Foundry hook ids belong to the
 * registry runtime instead.
 */
function createFrameConnFeatureRuntimeRecord(
  feature
) {
  return {
    feature,

    state:
      FRAME_CONN_FEATURE_RUNTIME_STATES
        .REGISTERED,

    installedHooks:
      [],

    lifecycleRuns: {
      initialize:
        false,

      ready:
        false,

      shutdown:
        false
    }
  };
}


/* ============================================================
   Frame Conn feature registry
   ============================================================ */

/**
 * Canonical registry implementation used by Frame Conn.
 *
 * The registry knows how to compose normalized feature
 * definitions but has no knowledge of the concrete application
 * feature list.
 */
export class FrameConnFeatureRegistry {
  constructor() {
    /**
     * Registered feature definitions indexed by feature id.
     */
    this.features =
      new Map();


    /**
     * Mutable runtime bookkeeping indexed by feature id.
     */
    this.runtime =
      new Map();


    /**
     * Maps capability id to its canonical providing feature id.
     *
     * Capability ownership is exclusive.
     */
    this.capabilityProviders =
      new Map();


    /**
     * Tracks whether feature-declared Foundry hooks have been
     * installed through this registry instance.
     */
    this.hooksInstalled =
      false;
  }


  /* ==========================================================
     Registration
     ========================================================== */

  /**
   * Registers one normalized Frame Conn feature definition.
   *
   * Registration:
   *
   *   - validates the feature contract
   *   - validates contract-version compatibility
   *   - prevents duplicate feature ids
   *   - prevents duplicate capability ownership
   *   - creates registry runtime bookkeeping
   *   - indexes provided capabilities
   *
   * Registration does NOT:
   *
   *   - validate that dependencies currently exist
   *   - install Foundry hooks
   *   - execute lifecycle handlers
   */
  register(
    feature
  ) {
    assertFrameConnFeatureDefinition(
      feature
    );


    if (
      feature.contractVersion !==
      FRAME_CONN_FEATURE_CONTRACT_VERSION
    ) {
      throw new Error(
        `Frame Conn feature "${feature.id}" uses unsupported contract version ${feature.contractVersion}.`
      );
    }


    if (
      this.features.has(
        feature.id
      )
    ) {
      throw new Error(
        `Frame Conn feature already registered: ${feature.id}`
      );
    }


    for (
      const capability
      of feature.provides
    ) {
      const existingProvider =
        this.capabilityProviders.get(
          capability
        );


      if (
        existingProvider
      ) {
        throw new Error(
          `Frame Conn capability "${capability}" is already provided by feature "${existingProvider}". Feature "${feature.id}" cannot also provide it.`
        );
      }
    }


    this.features.set(
      feature.id,
      feature
    );


    this.runtime.set(
      feature.id,
      createFrameConnFeatureRuntimeRecord(
        feature
      )
    );


    for (
      const capability
      of feature.provides
    ) {
      this.capabilityProviders.set(
        capability,
        feature.id
      );
    }


    return feature;
  }


  /**
   * Registers several feature definitions in declaration order.
   */
  registerMany(
    features
  ) {
    if (
      !Array.isArray(
        features
      )
    ) {
      throw new TypeError(
        "Frame Conn registerMany requires an array of feature definitions."
      );
    }


    return (
      features.map(
        feature =>
          this.register(
            feature
          )
      )
    );
  }


  /* ==========================================================
     Feature lookup
     ========================================================== */

  /**
   * Retrieves one registered feature by id.
   */
  get(
    featureId
  ) {
    const id =
      normalizeFrameConnRegistryIdentifier(
        featureId,
        "Frame Conn feature lookup"
      );


    return (
      this.features.get(
        id
      ) ??
      null
    );
  }


  /**
   * Returns whether a feature id is registered.
   */
  has(
    featureId
  ) {
    const id =
      normalizeFrameConnRegistryIdentifier(
        featureId,
        "Frame Conn feature lookup"
      );


    return (
      this.features.has(
        id
      )
    );
  }


  /**
   * Returns all feature definitions in registration order.
   */
  list() {
    return [
      ...this.features.values()
    ];
  }


  /**
   * Returns all registered feature ids.
   */
  ids() {
    return [
      ...this.features.keys()
    ];
  }


  /**
   * Number of currently registered features.
   */
  get size() {
    return (
      this.features.size
    );
  }


  /* ==========================================================
     Capability lookup
     ========================================================== */

  /**
   * Returns whether any registered feature provides the supplied
   * capability.
   */
  hasCapability(
    capability
  ) {
    const capabilityId =
      normalizeFrameConnRegistryIdentifier(
        capability,
        "Frame Conn capability lookup"
      );


    return (
      this.capabilityProviders.has(
        capabilityId
      )
    );
  }


  /**
   * Returns the registered feature providing a capability.
   */
  featureProviding(
    capability
  ) {
    const capabilityId =
      normalizeFrameConnRegistryIdentifier(
        capability,
        "Frame Conn capability lookup"
      );


    const providerId =
      this.capabilityProviders.get(
        capabilityId
      );


    if (
      !providerId
    ) {
      return null;
    }


    return (
      this.features.get(
        providerId
      ) ??
      null
    );
  }


  /**
   * Returns the feature id providing a capability.
   */
  providerIdFor(
    capability
  ) {
    const capabilityId =
      normalizeFrameConnRegistryIdentifier(
        capability,
        "Frame Conn capability lookup"
      );


    return (
      this.capabilityProviders.get(
        capabilityId
      ) ??
      null
    );
  }


  /* ==========================================================
     Public feature-surface lookup
     ========================================================== */

  /**
   * Retrieves one command exposed by a registered feature.
   */
  getCommand(
    featureId,
    commandName
  ) {
    const feature =
      this.get(
        featureId
      );


    if (
      !feature
    ) {
      return null;
    }


    return (
      feature.commands[
        String(
          commandName
        )
      ] ??
      null
    );
  }


  /**
   * Retrieves one query exposed by a registered feature.
   */
  getQuery(
    featureId,
    queryName
  ) {
    const feature =
      this.get(
        featureId
      );


    if (
      !feature
    ) {
      return null;
    }


    return (
      feature.queries[
        String(
          queryName
        )
      ] ??
      null
    );
  }


  /**
   * Retrieves one member from a feature's public API surface.
   */
  getApiMember(
    featureId,
    memberName
  ) {
    const feature =
      this.get(
        featureId
      );


    if (
      !feature
    ) {
      return null;
    }


    return (
      feature.api[
        String(
          memberName
        )
      ] ??
      null
    );
  }


  /**
   * Returns the complete public API for one feature.
   */
  getApi(
    featureId
  ) {
    const feature =
      this.get(
        featureId
      );


    return (
      feature?.api ??
      null
    );
  }


  /**
   * Resolves a capability directly to the providing feature's
   * public API.
   *
   * This allows capability-oriented composition without
   * introducing a hidden dependency/service container.
   */
  getCapabilityApi(
    capability
  ) {
    const provider =
      this.featureProviding(
        capability
      );


    return (
      provider?.api ??
      null
    );
  }


  /* ==========================================================
     Dependency inspection
     ========================================================== */

  /**
   * Returns required capabilities which are currently unavailable
   * for the supplied feature.
   */
  missingDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId ===
      "string"
        ? this.get(
            featureOrId
          )
        : featureOrId;


    if (
      !feature
    ) {
      throw new Error(
        "Cannot inspect dependencies for an unknown Frame Conn feature."
      );
    }


    assertFrameConnFeatureDefinition(
      feature
    );


    return (
      feature.dependsOn.filter(
        capability =>
          !this.hasCapability(
            capability
          )
      )
    );
  }


  /**
   * Returns optional dependencies currently available for the
   * supplied feature.
   */
  availableOptionalDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId ===
      "string"
        ? this.get(
            featureOrId
          )
        : featureOrId;


    if (
      !feature
    ) {
      throw new Error(
        "Cannot inspect optional dependencies for an unknown Frame Conn feature."
      );
    }


    assertFrameConnFeatureDefinition(
      feature
    );


    return (
      feature.optionalDependsOn.filter(
        capability =>
          this.hasCapability(
            capability
          )
      )
    );
  }


  /**
   * Returns optional dependencies currently unavailable for the
   * supplied feature.
   */
  unavailableOptionalDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId ===
      "string"
        ? this.get(
            featureOrId
          )
        : featureOrId;


    if (
      !feature
    ) {
      throw new Error(
        "Cannot inspect optional dependencies for an unknown Frame Conn feature."
      );
    }


    assertFrameConnFeatureDefinition(
      feature
    );


    return (
      feature.optionalDependsOn.filter(
        capability =>
          !this.hasCapability(
            capability
          )
      )
    );
  }


  /**
   * Validates all required capabilities for every registered
   * feature.
   *
   * This is normally invoked after the application declaration
   * layer has registered its complete feature set.
   */
  validateDependencies() {
    const failures =
      [];


    for (
      const feature
      of this.features.values()
    ) {
      const missing =
        this.missingDependenciesFor(
          feature
        );


      if (
        missing.length >
        0
      ) {
        failures.push({
          featureId:
            feature.id,

          missing
        });
      }
    }


    if (
      failures.length >
      0
    ) {
      const description =
        failures
          .map(
            failure => {
              return (
                `${failure.featureId}: ` +
                failure.missing.join(
                  ", "
                )
              );
            }
          )
          .join(
            "; "
          );


      throw new Error(
        `Frame Conn feature dependency validation failed. ${description}`
      );
    }


    return true;
  }


  /* ==========================================================
     Dependency ordering
     ========================================================== */

  /**
   * Produces a dependency-safe feature order.
   *
   * Required capabilities participate in ordering.
   *
   * Optional capabilities intentionally do not.
   */
  orderedFeatures() {
    const ordered =
      [];


    const visiting =
      new Set();


    const visited =
      new Set();


    const visitFeature =
      feature => {
        if (
          visited.has(
            feature.id
          )
        ) {
          return;
        }


        if (
          visiting.has(
            feature.id
          )
        ) {
          throw new Error(
            `Frame Conn feature dependency cycle detected at "${feature.id}".`
          );
        }


        visiting.add(
          feature.id
        );


        for (
          const capability
          of feature.dependsOn
        ) {
          const provider =
            this.featureProviding(
              capability
            );


          if (
            !provider
          ) {
            throw new Error(
              `Frame Conn feature "${feature.id}" requires missing capability "${capability}".`
            );
          }


          if (
            provider.id ===
            feature.id
          ) {
            continue;
          }


          visitFeature(
            provider
          );
        }


        visiting.delete(
          feature.id
        );


        visited.add(
          feature.id
        );


        ordered.push(
          feature
        );
      };


    for (
      const feature
      of this.features.values()
    ) {
      visitFeature(
        feature
      );
    }


    return ordered;
  }


  /* ==========================================================
     Feature execution context
     ========================================================== */

  /**
   * Constructs the explicit context passed to feature lifecycle
   * and Foundry-hook handlers.
   *
   * The context exposes registry lookup surfaces while keeping
   * cross-feature access visible and inspectable.
   */
  createFeatureContext(
    featureOrId
  ) {
    const feature =
      typeof featureOrId ===
      "string"
        ? this.get(
            featureOrId
          )
        : featureOrId;


    if (
      !feature
    ) {
      throw new Error(
        "Cannot create context for an unknown Frame Conn feature."
      );
    }


    const registry =
      this;


    return Object.freeze({
      feature,

      registry,


      hasFeature(
        featureId
      ) {
        return (
          registry.has(
            featureId
          )
        );
      },


      getFeature(
        featureId
      ) {
        return (
          registry.get(
            featureId
          )
        );
      },


      hasCapability(
        capability
      ) {
        return (
          registry.hasCapability(
            capability
          )
        );
      },


      getCapabilityProvider(
        capability
      ) {
        return (
          registry.featureProviding(
            capability
          )
        );
      },


      getCapabilityApi(
        capability
      ) {
        return (
          registry.getCapabilityApi(
            capability
          )
        );
      },


      getApi(
        featureId
      ) {
        return (
          registry.getApi(
            featureId
          )
        );
      },


      getCommand(
        featureId,
        commandName
      ) {
        return (
          registry.getCommand(
            featureId,
            commandName
          )
        );
      },


      getQuery(
        featureId,
        queryName
      ) {
        return (
          registry.getQuery(
            featureId,
            queryName
          )
        );
      }
    });
  }


  /* ==========================================================
     Lifecycle execution -- Individual feature
     ========================================================== */

  /**
   * Runs one lifecycle phase for one registered feature.
   */
  async runFeatureLifecycle(
    featureOrId,
    phase
  ) {
    const feature =
      typeof featureOrId ===
      "string"
        ? this.get(
            featureOrId
          )
        : featureOrId;


    if (
      !feature
    ) {
      throw new Error(
        "Cannot run lifecycle for an unknown Frame Conn feature."
      );
    }


    const normalizedPhase =
      normalizeFrameConnRegistryIdentifier(
        phase,
        "Frame Conn lifecycle phase"
      );


    if (
      !FRAME_CONN_FEATURE_LIFECYCLE_PHASES.includes(
        normalizedPhase
      )
    ) {
      throw new Error(
        `Unknown Frame Conn lifecycle phase: ${normalizedPhase}`
      );
    }


    const runtime =
      this.runtime.get(
        feature.id
      );


    if (
      !runtime
    ) {
      throw new Error(
        `Frame Conn feature "${feature.id}" has no runtime record.`
      );
    }


    const handler =
      feature.lifecycle[
        normalizedPhase
      ];


    if (
      !handler
    ) {
      runtime.lifecycleRuns[
        normalizedPhase
      ] = true;


      this.updateRuntimeStateAfterLifecycle(
        runtime,
        normalizedPhase
      );


      return null;
    }


    const context =
      this.createFeatureContext(
        feature
      );


    const result =
      await handler(
        context
      );


    runtime.lifecycleRuns[
      normalizedPhase
    ] = true;


    this.updateRuntimeStateAfterLifecycle(
      runtime,
      normalizedPhase
    );


    return result;
  }


  /* ==========================================================
     Lifecycle execution -- Runtime state
     ========================================================== */

  /**
   * Updates registry runtime state after completion of a lifecycle
   * phase.
   */
  updateRuntimeStateAfterLifecycle(
    runtime,
    phase
  ) {
    if (
      phase ===
      "initialize"
    ) {
      runtime.state =
        FRAME_CONN_FEATURE_RUNTIME_STATES
          .INITIALIZED;


      return;
    }


    if (
      phase ===
      "ready"
    ) {
      runtime.state =
        FRAME_CONN_FEATURE_RUNTIME_STATES
          .READY;


      return;
    }


    if (
      phase ===
      "shutdown"
    ) {
      runtime.state =
        FRAME_CONN_FEATURE_RUNTIME_STATES
          .SHUT_DOWN;
    }
  }


  /* ==========================================================
     Lifecycle execution -- Registry-wide
     ========================================================== */

  /**
   * Runs one lifecycle phase across all registered features in
   * dependency-safe order.
   *
   * Shutdown intentionally runs in reverse dependency order.
   */
  async runLifecycle(
    phase
  ) {
    const normalizedPhase =
      normalizeFrameConnRegistryIdentifier(
        phase,
        "Frame Conn lifecycle phase"
      );


    if (
      !FRAME_CONN_FEATURE_LIFECYCLE_PHASES.includes(
        normalizedPhase
      )
    ) {
      throw new Error(
        `Unknown Frame Conn lifecycle phase: ${normalizedPhase}`
      );
    }


    this.validateDependencies();


    let features =
      this.orderedFeatures();


    if (
      normalizedPhase ===
      "shutdown"
    ) {
      features = [
        ...features
      ].reverse();
    }


    const results =
      [];


    for (
      const feature
      of features
    ) {
      results.push(
        await this.runFeatureLifecycle(
          feature,
          normalizedPhase
        )
      );
    }


    return results;
  }


  /**
   * Convenience lifecycle alias.
   */
  initialize() {
    return (
      this.runLifecycle(
        "initialize"
      )
    );
  }


  /**
   * Convenience lifecycle alias.
   */
  ready() {
    return (
      this.runLifecycle(
        "ready"
      )
    );
  }


  /**
   * Convenience lifecycle alias.
   */
  shutdown() {
    return (
      this.runLifecycle(
        "shutdown"
      )
    );
  }


  /* ==========================================================
     Foundry hook installation
     ========================================================== */

  /**
   * Installs all Foundry hooks declared by registered features.
   *
   * Each feature handler receives the normal Foundry hook
   * arguments followed by its feature context.
   *
   * This operation is explicit.
   *
   * Registration alone never installs hooks.
   */
  installHooks() {
    if (
      this.hooksInstalled
    ) {
      return;
    }


    for (
      const feature
      of this.orderedFeatures()
    ) {
      const runtime =
        this.runtime.get(
          feature.id
        );


      const context =
        this.createFeatureContext(
          feature
        );


      for (
        const [
          hookName,
          declaration
        ]
        of Object.entries(
          feature.hooks
        )
      ) {
        const handlers =
          Array.isArray(
            declaration
          )
            ? declaration
            : [
                declaration
              ];


        for (
          const handler
          of handlers
        ) {
          const hookId =
            Hooks.on(
              hookName,
              (...args) => {
                return (
                  handler(
                    ...args,
                    context
                  )
                );
              }
            );


          runtime.installedHooks.push({
            hookName,

            hookId
          });
        }
      }
    }


    this.hooksInstalled =
      true;
  }


  /* ==========================================================
     Foundry hook teardown
     ========================================================== */

  /**
   * Removes all Foundry hooks installed through this registry
   * instance.
   *
   * Useful for development reloads and explicit teardown.
   */
  uninstallHooks() {
    for (
      const runtime
      of this.runtime.values()
    ) {
      for (
        const installed
        of runtime.installedHooks
      ) {
        try {
          Hooks.off(
            installed.hookName,
            installed.hookId
          );
        } catch (
          error
        ) {
          console.warn(
            `Frame Conn | Could not remove hook "${installed.hookName}".`,
            error
          );
        }
      }


      runtime.installedHooks =
        [];
    }


    this.hooksInstalled =
      false;
  }


  /* ==========================================================
     Runtime inspection
     ========================================================== */

  /**
   * Returns the current registry runtime state for one feature.
   */
  runtimeState(
    featureId
  ) {
    const id =
      normalizeFrameConnRegistryIdentifier(
        featureId,
        "Frame Conn feature lookup"
      );


    return (
      this.runtime.get(
        id
      )
        ?.state ??
      null
    );
  }


  /**
   * Returns whether a lifecycle phase has completed for one
   * feature.
   */
  hasRunLifecycle(
    featureId,
    phase
  ) {
    const id =
      normalizeFrameConnRegistryIdentifier(
        featureId,
        "Frame Conn feature lookup"
      );


    const normalizedPhase =
      normalizeFrameConnRegistryIdentifier(
        phase,
        "Frame Conn lifecycle phase"
      );


    return Boolean(
      this.runtime
        .get(
          id
        )
        ?.lifecycleRuns
        ?.[
          normalizedPhase
        ]
    );
  }


  /* ==========================================================
     Registry diagnostics
     ========================================================== */

  /**
   * Returns a serializable snapshot of registry structure and
   * runtime state.
   *
   * Functions and mutable feature-domain state are intentionally
   * omitted.
   */
  snapshot() {
    return {
      registryVersion:
        FRAME_CONN_FEATURE_REGISTRY_VERSION,

      contractVersion:
        FRAME_CONN_FEATURE_CONTRACT_VERSION,

      featureCount:
        this.features.size,

      hooksInstalled:
        this.hooksInstalled,

      features:
        this.list().map(
          feature => {
            const runtime =
              this.runtime.get(
                feature.id
              );


            return {
              ...summarizeFrameConnFeature(
                feature
              ),

              runtimeState:
                runtime?.state ??
                null,

              lifecycleRuns: {
                ...(
                  runtime
                    ?.lifecycleRuns ??
                  {}
                )
              },

              installedHooks:
                runtime
                  ?.installedHooks
                  .map(
                    entry =>
                      entry.hookName
                  ) ??
                [],

              missingDependencies:
                this.missingDependenciesFor(
                  feature
                ),

              availableOptionalDependencies:
                this.availableOptionalDependenciesFor(
                  feature
                ),

              unavailableOptionalDependencies:
                this.unavailableOptionalDependenciesFor(
                  feature
                )
            };
          }
        ),

      capabilities:
        Object.fromEntries(
          this.capabilityProviders
        )
    };
  }


  /* ==========================================================
     Registry reset
     ========================================================== */

  /**
   * Clears all registrations and runtime bookkeeping.
   *
   * Installed Foundry hooks are removed first.
   *
   * This operation is intended primarily for development and
   * testing.
   *
   * Concrete application features are NOT automatically restored
   * because this core implementation does not know which features
   * belong to Frame Conn.
   */
  clear() {
    this.uninstallHooks();


    this.features.clear();


    this.runtime.clear();


    this.capabilityProviders.clear();
  }
}


/* ============================================================
   Registry core exports
   ============================================================ */

/**
 * Utility exports are retained primarily for focused testing and
 * diagnostics.
 *
 * Application composition should normally interact through
 * FrameConnFeatureRegistry rather than invoking these helpers
 * directly.
 */
export {
  normalizeFrameConnRegistryIdentifier,

  createFrameConnFeatureRuntimeRecord
};