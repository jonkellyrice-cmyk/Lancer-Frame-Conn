/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/feature-registry.js
 */

/**
 * ============================================================
 * FRAME HELM FEATURE REGISTRY
 * ============================================================
 *
 * ROLE:
 *   Provides the central registration and composition spine for
 *   Frame Helm feature domains.
 *
 * PURPOSE:
 *   Allow independently-owned Frame Helm features to plug into a
 *   single standardized registry using feature-contract.js.
 *
 * OWNS:
 *   - Feature registration
 *   - Feature identity lookup
 *   - Capability ownership lookup
 *   - Dependency validation
 *   - Optional-dependency inspection
 *   - Lifecycle execution
 *   - Foundry hook installation
 *   - Public feature-surface lookup
 *   - Registry diagnostics
 *
 * DOES NOT OWN:
 *   - Feature behavior
 *   - Domain state
 *   - Gameplay rules
 *   - UI rendering
 *   - Foundry hook handler behavior
 *   - Action legality
 *   - Movement calculations
 *   - Sensor calculations
 *   - Actor integration
 *
 * ARCHITECTURAL CONTRACT:
 *
 *   feature-contract.js
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ├── register feature definitions
 *        ├── validate capabilities
 *        ├── validate dependencies
 *        ├── install declared hooks
 *        ├── run lifecycle handlers
 *        └── expose domain surfaces
 *
 * CURRENT EXTRACTED FEATURES:
 *
 *   - actions-feature.js
 *   - sensors-feature.js
 *
 * FUTURE FEATURE FILES:
 *
 *   - turn-feature.js
 *   - movement-feature.js
 *   - action-execution-feature.js
 *   - telemetry-feature.js
 *   - application-feature.js
 *   - ...
 *
 * IMPORTANT:
 *   Extracted feature domains are imported and registered below
 *   against the canonical Frame Helm feature registry.
 *
 *   Registration alone does NOT:
 *
 *     - install Foundry hooks
 *     - run lifecycle handlers
 *     - replace lancer-frame-helm.js as runtime orchestrator
 *
 *   scripts/lancer-frame-helm.js remains the authoritative
 *   runtime/orchestration surface and is responsible for invoking
 *   registry hook installation and lifecycle operations at the
 *   appropriate Foundry startup boundaries.
 *
 * SYNCHRONOUS STARTUP CONTRACT:
 *
 *   actions-feature.js intentionally does NOT initialize its
 *   action catalog through the asynchronous feature lifecycle.
 *
 *   lancer-frame-helm.js must continue invoking:
 *
 *     initializeFrameHelmActionRegistry()
 *
 *   synchronously from the Foundry init hook until startup
 *   orchestration is deliberately migrated.
 */


import {
  FRAME_HELM_FEATURE_CONTRACT_VERSION,
  FRAME_HELM_FEATURE_LIFECYCLE_PHASES,
  assertFrameHelmFeatureDefinition,
  summarizeFrameHelmFeature
} from "./feature-contract.js";

import {
  frameHelmActionsFeature
} from "./actions-feature.js";

import {
  frameHelmSensorsFeature
} from "./sensors-feature.js";


/* ============================================================
   Registry constants
   ============================================================ */

/**
 * Registry version.
 *
 * This is separate from the feature-contract version so the
 * registry implementation may evolve independently.
 */
export const FRAME_HELM_FEATURE_REGISTRY_VERSION = 1;


/**
 * Lifecycle states tracked per registered feature.
 */
export const FRAME_HELM_FEATURE_RUNTIME_STATES =
  Object.freeze({
    REGISTERED: "registered",
    INITIALIZED: "initialized",
    READY: "ready",
    SHUT_DOWN: "shut-down"
  });


/* ============================================================
   Registry-local utilities
   ============================================================ */

/**
 * Normalizes a required registry lookup identifier.
 */
function normalizeFrameHelmRegistryIdentifier(
  value,
  description
) {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw new Error(
      `${description} requires a non-empty identifier.`
    );
  }

  return normalized;
}


/**
 * Creates a stable runtime record for one registered feature.
 *
 * The feature definition itself remains frozen. Runtime state
 * belongs to the registry.
 */
function createFrameHelmFeatureRuntimeRecord(
  feature
) {
  return {
    feature,

    state:
      FRAME_HELM_FEATURE_RUNTIME_STATES
        .REGISTERED,

    installedHooks: [],

    lifecycleRuns: {
      initialize: false,
      ready: false,
      shutdown: false
    }
  };
}


/* ============================================================
   Frame Helm feature registry
   ============================================================ */

export class FrameHelmFeatureRegistry {
  constructor() {
    /**
     * Registered feature definitions indexed by feature id.
     */
    this.features =
      new Map();

    /**
     * Runtime bookkeeping indexed by feature id.
     */
    this.runtime =
      new Map();

    /**
     * Maps capability id -> owning feature id.
     *
     * One capability has one canonical provider.
     */
    this.capabilityProviders =
      new Map();

    /**
     * Tracks whether Foundry hooks declared by registered
     * features have been installed.
     */
    this.hooksInstalled =
      false;
  }


  /* ==========================================================
     Registration
     ========================================================== */

  /**
   * Registers one normalized Frame Helm feature.
   *
   * Registration:
   *
   *   - validates the feature contract
   *   - prevents duplicate feature ids
   *   - prevents duplicate capability ownership
   *   - records feature runtime state
   *
   * It does NOT:
   *
   *   - execute lifecycle handlers
   *   - install Foundry hooks
   *   - validate that every dependency is currently present
   *
   * Dependency validation happens explicitly after all desired
   * features have been registered.
   */
  register(feature) {
    assertFrameHelmFeatureDefinition(
      feature
    );

    if (
      feature.contractVersion !==
      FRAME_HELM_FEATURE_CONTRACT_VERSION
    ) {
      throw new Error(
        `Frame Helm feature "${feature.id}" uses unsupported contract version ${feature.contractVersion}.`
      );
    }

    if (
      this.features.has(
        feature.id
      )
    ) {
      throw new Error(
        `Frame Helm feature already registered: ${feature.id}`
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

      if (existingProvider) {
        throw new Error(
          `Frame Helm capability "${capability}" is already provided by feature "${existingProvider}". Feature "${feature.id}" cannot also provide it.`
        );
      }
    }

    this.features.set(
      feature.id,
      feature
    );

    this.runtime.set(
      feature.id,
      createFrameHelmFeatureRuntimeRecord(
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
   * Registers several features in declaration order.
   */
  registerMany(features) {
    if (!Array.isArray(features)) {
      throw new TypeError(
        "Frame Helm registerMany requires an array of feature definitions."
      );
    }

    return features.map(
      feature =>
        this.register(feature)
    );
  }


  /* ==========================================================
     Feature lookup
     ========================================================== */

  /**
   * Retrieves one feature by id.
   */
  get(featureId) {
    const id =
      normalizeFrameHelmRegistryIdentifier(
        featureId,
        "Frame Helm feature lookup"
      );

    return (
      this.features.get(id) ??
      null
    );
  }


  /**
   * Returns whether a feature is registered.
   */
  has(featureId) {
    const id =
      normalizeFrameHelmRegistryIdentifier(
        featureId,
        "Frame Helm feature lookup"
      );

    return this.features.has(
      id
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
   * Returns the number of registered features.
   */
  get size() {
    return this.features.size;
  }


  /* ==========================================================
     Capability lookup
     ========================================================== */

  /**
   * Returns whether any registered feature provides the named
   * capability.
   */
  hasCapability(capability) {
    const capabilityId =
      normalizeFrameHelmRegistryIdentifier(
        capability,
        "Frame Helm capability lookup"
      );

    return (
      this.capabilityProviders.has(
        capabilityId
      )
    );
  }


  /**
   * Returns the feature that provides the named capability.
   */
  featureProviding(capability) {
    const capabilityId =
      normalizeFrameHelmRegistryIdentifier(
        capability,
        "Frame Helm capability lookup"
      );

    const providerId =
      this.capabilityProviders.get(
        capabilityId
      );

    if (!providerId) {
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
   * Returns the id of the feature providing a capability.
   */
  providerIdFor(capability) {
    const capabilityId =
      normalizeFrameHelmRegistryIdentifier(
        capability,
        "Frame Helm capability lookup"
      );

    return (
      this.capabilityProviders.get(
        capabilityId
      ) ??
      null
    );
  }


  /* ==========================================================
     Surface lookup
     ========================================================== */

  /**
   * Retrieves one feature command.
   */
  getCommand(
    featureId,
    commandName
  ) {
    const feature =
      this.get(featureId);

    if (!feature) {
      return null;
    }

    return (
      feature.commands[
        String(commandName)
      ] ??
      null
    );
  }


  /**
   * Retrieves one feature query.
   */
  getQuery(
    featureId,
    queryName
  ) {
    const feature =
      this.get(featureId);

    if (!feature) {
      return null;
    }

    return (
      feature.queries[
        String(queryName)
      ] ??
      null
    );
  }


  /**
   * Retrieves one public API member from a feature.
   */
  getApiMember(
    featureId,
    memberName
  ) {
    const feature =
      this.get(featureId);

    if (!feature) {
      return null;
    }

    return (
      feature.api[
        String(memberName)
      ] ??
      null
    );
  }


  /**
   * Returns the public API object for one feature.
   */
  getApi(featureId) {
    const feature =
      this.get(featureId);

    return (
      feature?.api ??
      null
    );
  }


  /**
   * Resolves a provided capability directly to the providing
   * feature's public API.
   *
   * This gives dependent feature composition code a stable
   * capability-oriented lookup without creating a hidden service
   * container.
   */
  getCapabilityApi(capability) {
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
   * Returns all missing required capabilities for one feature.
   */
  missingDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId === "string"
        ? this.get(featureOrId)
        : featureOrId;

    if (!feature) {
      throw new Error(
        "Cannot inspect dependencies for an unknown Frame Helm feature."
      );
    }

    assertFrameHelmFeatureDefinition(
      feature
    );

    return feature.dependsOn.filter(
      capability =>
        !this.hasCapability(
          capability
        )
    );
  }


  /**
   * Returns all optional dependencies that are currently available.
   */
  availableOptionalDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId === "string"
        ? this.get(featureOrId)
        : featureOrId;

    if (!feature) {
      throw new Error(
        "Cannot inspect optional dependencies for an unknown Frame Helm feature."
      );
    }

    assertFrameHelmFeatureDefinition(
      feature
    );

    return feature.optionalDependsOn.filter(
      capability =>
        this.hasCapability(
          capability
        )
    );
  }


  /**
   * Returns all optional dependencies that are currently absent.
   */
  unavailableOptionalDependenciesFor(
    featureOrId
  ) {
    const feature =
      typeof featureOrId === "string"
        ? this.get(featureOrId)
        : featureOrId;

    if (!feature) {
      throw new Error(
        "Cannot inspect optional dependencies for an unknown Frame Helm feature."
      );
    }

    assertFrameHelmFeatureDefinition(
      feature
    );

    return feature.optionalDependsOn.filter(
      capability =>
        !this.hasCapability(
          capability
        )
    );
  }


  /**
   * Validates every registered feature's required capabilities.
   *
   * This should normally run after all extracted feature domains
   * have been registered.
   */
  validateDependencies() {
    const failures = [];

    for (
      const feature
      of this.features.values()
    ) {
      const missing =
        this.missingDependenciesFor(
          feature
        );

      if (
        missing.length > 0
      ) {
        failures.push({
          featureId:
            feature.id,

          missing
        });
      }
    }

    if (
      failures.length > 0
    ) {
      const description =
        failures
          .map(failure => {
            return (
              `${failure.featureId}: ` +
              failure.missing.join(", ")
            );
          })
          .join("; ");

      throw new Error(
        `Frame Helm feature dependency validation failed. ${description}`
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
   * Required capabilities determine ordering.
   *
   * Optional dependencies do not affect order.
   */
  orderedFeatures() {
    const ordered = [];
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
            `Frame Helm feature dependency cycle detected at "${feature.id}".`
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

          if (!provider) {
            throw new Error(
              `Frame Helm feature "${feature.id}" requires missing capability "${capability}".`
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
   * Constructs the explicit context supplied to lifecycle and hook
   * handlers.
   *
   * This keeps feature access standardized while remaining visible
   * and inspectable.
   */
  createFeatureContext(
    featureOrId
  ) {
    const feature =
      typeof featureOrId === "string"
        ? this.get(featureOrId)
        : featureOrId;

    if (!feature) {
      throw new Error(
        "Cannot create context for an unknown Frame Helm feature."
      );
    }

    const registry =
      this;

    return Object.freeze({
      feature,
      registry,

      hasFeature(featureId) {
        return registry.has(
          featureId
        );
      },

      getFeature(featureId) {
        return registry.get(
          featureId
        );
      },

      hasCapability(capability) {
        return registry.hasCapability(
          capability
        );
      },

      getCapabilityProvider(
        capability
      ) {
        return registry.featureProviding(
          capability
        );
      },

      getCapabilityApi(
        capability
      ) {
        return registry.getCapabilityApi(
          capability
        );
      },

      getApi(featureId) {
        return registry.getApi(
          featureId
        );
      },

      getCommand(
        featureId,
        commandName
      ) {
        return registry.getCommand(
          featureId,
          commandName
        );
      },

      getQuery(
        featureId,
        queryName
      ) {
        return registry.getQuery(
          featureId,
          queryName
        );
      }
    });
  }


  /* ==========================================================
     Lifecycle execution
     ========================================================== */

  /**
   * Runs one lifecycle phase for one feature.
   */
  async runFeatureLifecycle(
    featureOrId,
    phase
  ) {
    const feature =
      typeof featureOrId === "string"
        ? this.get(featureOrId)
        : featureOrId;

    if (!feature) {
      throw new Error(
        "Cannot run lifecycle for an unknown Frame Helm feature."
      );
    }

    const normalizedPhase =
      normalizeFrameHelmRegistryIdentifier(
        phase,
        "Frame Helm lifecycle phase"
      );

    if (
      !FRAME_HELM_FEATURE_LIFECYCLE_PHASES.includes(
        normalizedPhase
      )
    ) {
      throw new Error(
        `Unknown Frame Helm lifecycle phase: ${normalizedPhase}`
      );
    }

    const runtime =
      this.runtime.get(
        feature.id
      );

    if (!runtime) {
      throw new Error(
        `Frame Helm feature "${feature.id}" has no runtime record.`
      );
    }

    const handler =
      feature.lifecycle[
        normalizedPhase
      ];

    if (!handler) {
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


  /**
   * Updates runtime state after lifecycle completion.
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
        FRAME_HELM_FEATURE_RUNTIME_STATES
          .INITIALIZED;

      return;
    }

    if (
      phase ===
      "ready"
    ) {
      runtime.state =
        FRAME_HELM_FEATURE_RUNTIME_STATES
          .READY;

      return;
    }

    if (
      phase ===
      "shutdown"
    ) {
      runtime.state =
        FRAME_HELM_FEATURE_RUNTIME_STATES
          .SHUT_DOWN;
    }
  }


  /**
   * Runs one lifecycle phase across all features in dependency-safe
   * order.
   *
   * Shutdown runs in reverse dependency order.
   */
  async runLifecycle(
    phase
  ) {
    const normalizedPhase =
      normalizeFrameHelmRegistryIdentifier(
        phase,
        "Frame Helm lifecycle phase"
      );

    if (
      !FRAME_HELM_FEATURE_LIFECYCLE_PHASES.includes(
        normalizedPhase
      )
    ) {
      throw new Error(
        `Unknown Frame Helm lifecycle phase: ${normalizedPhase}`
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

    const results = [];

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
   * Convenience lifecycle aliases.
   */
  initialize() {
    return this.runLifecycle(
      "initialize"
    );
  }


  ready() {
    return this.runLifecycle(
      "ready"
    );
  }


  shutdown() {
    return this.runLifecycle(
      "shutdown"
    );
  }


  /* ==========================================================
     Foundry hook installation
     ========================================================== */

  /**
   * Installs all Foundry hooks declared by all registered features.
   *
   * Each feature handler receives normal Foundry hook arguments,
   * followed by the feature construction context as the final
   * argument.
   *
   * IMPORTANT:
   *   The registry does not install hooks merely because a feature
   *   has been registered.
   *
   *   The authoritative runtime must explicitly call:
   *
   *     frameHelmFeatureRegistry.installHooks()
   *
   *   at the appropriate startup boundary.
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
                return handler(
                  ...args,
                  context
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


  /**
   * Removes hooks installed through this registry.
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
        } catch (error) {
          console.warn(
            `Frame Helm | Could not remove hook "${installed.hookName}".`,
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
   * Returns runtime state for one feature.
   */
  runtimeState(featureId) {
    const id =
      normalizeFrameHelmRegistryIdentifier(
        featureId,
        "Frame Helm feature lookup"
      );

    return (
      this.runtime.get(id)
        ?.state ??
      null
    );
  }


  /**
   * Returns whether a particular lifecycle phase has completed for
   * one feature.
   */
  hasRunLifecycle(
    featureId,
    phase
  ) {
    const id =
      normalizeFrameHelmRegistryIdentifier(
        featureId,
        "Frame Helm feature lookup"
      );

    const normalizedPhase =
      normalizeFrameHelmRegistryIdentifier(
        phase,
        "Frame Helm lifecycle phase"
      );

    return Boolean(
      this.runtime
        .get(id)
        ?.lifecycleRuns
        ?.[normalizedPhase]
    );
  }


  /* ==========================================================
     Registry diagnostics
     ========================================================== */

  /**
   * Returns a serializable registry snapshot.
   *
   * Functions and mutable feature state are intentionally omitted.
   */
  snapshot() {
    return {
      registryVersion:
        FRAME_HELM_FEATURE_REGISTRY_VERSION,

      contractVersion:
        FRAME_HELM_FEATURE_CONTRACT_VERSION,

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
              ...summarizeFrameHelmFeature(
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
   * Clears the registry.
   *
   * Intended primarily for development and testing.
   *
   * Installed Foundry hooks are removed first.
   *
   * IMPORTANT:
   *   clear() also removes canonical feature registrations.
   *   A caller using this during development must explicitly
   *   register required features again afterward.
   */
  clear() {
    this.uninstallHooks();

    this.features.clear();
    this.runtime.clear();
    this.capabilityProviders.clear();
  }
}


/* ============================================================
   Canonical Frame Helm feature registry
   ============================================================ */

/**
 * Single Frame Helm feature registry instance.
 *
 * Extracted domain definitions are registered immediately below.
 *
 * Registration is intentionally separate from runtime startup:
 *
 *   - no hooks are installed here
 *   - no lifecycle handlers are run here
 *   - no Foundry startup work occurs here
 *
 * lancer-frame-helm.js remains responsible for runtime
 * orchestration.
 */
export const frameHelmFeatureRegistry =
  new FrameHelmFeatureRegistry();


/* ============================================================
   Canonical extracted feature registration
   ============================================================ */

/**
 * Register currently-extracted Frame Helm feature domains.
 *
 * Current feature graph:
 *
 *   actions
 *     ├── actions.registry
 *     ├── actions.catalog
 *     └── actions.registration
 *
 *   sensors
 *     ├── sensors.contacts
 *     ├── sensors.refresh
 *     └── sensors.measurement
 *
 * Neither feature currently declares required dependencies on the
 * other.
 *
 * As additional domains leave lancer-frame-helm.js, import their
 * definitions above and add them to this declaration-order list.
 *
 * Required dependency ordering does not need to be maintained
 * manually here because orderedFeatures() resolves runtime order
 * from declared capabilities.
 */
frameHelmFeatureRegistry.registerMany([
  frameHelmActionsFeature,
  frameHelmSensorsFeature
]);


/* ============================================================
   Canonical feature graph validation
   ============================================================ */

/**
 * Validate the currently-known feature graph immediately after
 * canonical registration.
 *
 * This validates feature capability ownership and required
 * dependencies only.
 *
 * It does NOT initialize the Actions feature's action catalog.
 *
 * initializeFrameHelmActionRegistry() intentionally remains a
 * synchronous operation invoked by lancer-frame-helm.js during
 * Foundry init.
 */
frameHelmFeatureRegistry
  .validateDependencies();