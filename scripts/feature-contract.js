/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/frame-conn/feature-contract.js
 */

/**
 * ============================================================
 * FRAME CONN FEATURE CONTRACT
 * ============================================================
 *
 * ROLE:
 *   Defines the stable construction contract used by Frame Conn
 *   feature domains.
 *
 * PURPOSE:
 *   Give independently-owned Frame Conn domains a common schema
 *   for declaring:
 *
 *     - identity
 *     - provided capabilities
 *     - required capabilities
 *     - owned state
 *     - commands
 *     - queries
 *     - Foundry hooks
 *     - lifecycle handlers
 *     - intentionally public API
 *
 * DESIGN GOAL:
 *   Standardize feature construction without hiding behavior.
 *
 *   Domain files should still contain their actual state,
 *   calculations, commands, Foundry integrations, and behavior.
 *
 *   This contract only describes and normalizes those pieces so
 *   they can be registered and composed consistently.
 *
 * DOES NOT OWN:
 *   - Feature registration
 *   - Feature initialization order
 *   - Dependency resolution
 *   - Dependency injection
 *   - Foundry hook registration
 *   - Public API publication
 *   - Domain behavior
 *   - State mutation
 *   - UI composition
 *
 * ARCHITECTURAL CONTRACT:
 *
 *   feature-contract.js
 *        │
 *        │ defines / normalizes
 *        ▼
 *   FrameConnFeatureDefinition
 *        │
 *        ▼
 *   feature-registry.js
 *        │
 *        ├── actions
 *        ├── turn
 *        ├── movement
 *        ├── sensors
 *        ├── telemetry
 *        └── future domains
 */


/* ============================================================
   Feature-contract constants
   ============================================================ */

/**
 * Version of the current Frame Conn feature contract.
 *
 * This is intentionally independent of the Foundry module
 * version. It describes the shape expected by the construction
 * spine itself.
 */
export const FRAME_CONN_FEATURE_CONTRACT_VERSION = 1;


/**
 * Canonical feature-definition collection keys.
 *
 * These collections are deliberately shallow. Their members
 * remain ordinary functions, objects, classes, or values owned
 * by the feature domain.
 */
export const FRAME_CONN_FEATURE_COLLECTION_KEYS =
  Object.freeze([
    "state",
    "commands",
    "queries",
    "hooks",
    "lifecycle",
    "api"
  ]);


/**
 * Canonical lifecycle names recognized by the construction spine.
 *
 * The registry may eventually invoke these automatically, but the
 * contract itself only standardizes their names.
 */
export const FRAME_CONN_FEATURE_LIFECYCLE_PHASES =
  Object.freeze([
    "initialize",
    "ready",
    "shutdown"
  ]);


/* ============================================================
   Primitive normalization utilities
   ============================================================ */

/**
 * Converts a value into a trimmed non-empty identifier.
 */
function normalizeRequiredFrameConnIdentifier(
  value,
  description
) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(
      `${description} requires a non-empty identifier.`
    );
  }

  return normalized;
}


/**
 * Normalizes a possibly-empty identifier.
 */
function normalizeOptionalFrameConnIdentifier(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
}


/**
 * Creates a frozen shallow copy of a plain record.
 *
 * This deliberately does not recursively freeze nested domain
 * objects. The contract protects the declared feature surface
 * while allowing explicitly-owned mutable state objects to remain
 * mutable where required.
 */
function normalizeFrameConnFeatureRecord(
  value,
  fieldName
) {
  if (value === null || value === undefined) {
    return Object.freeze({});
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      `Frame Conn feature "${fieldName}" must be an object.`
    );
  }

  return Object.freeze({
    ...value
  });
}


/**
 * Normalizes capability lists such as `provides` and `dependsOn`.
 *
 * Duplicate capability names are removed while preserving the
 * author's declaration order.
 */
function normalizeFrameConnCapabilityList(
  value,
  fieldName
) {
  if (value === null || value === undefined) {
    return Object.freeze([]);
  }

  if (!Array.isArray(value)) {
    throw new TypeError(
      `Frame Conn feature "${fieldName}" must be an array.`
    );
  }

  const normalized = [];

  for (const capability of value) {
    const capabilityId =
      normalizeRequiredFrameConnIdentifier(
        capability,
        `Frame Conn feature ${fieldName} entry`
      );

    if (!normalized.includes(capabilityId)) {
      normalized.push(capabilityId);
    }
  }

  return Object.freeze(normalized);
}


/**
 * Normalizes optional descriptive metadata.
 */
function normalizeFrameConnFeatureMetadata(
  metadata
) {
  if (metadata === null || metadata === undefined) {
    return Object.freeze({});
  }

  if (
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new TypeError(
      'Frame Conn feature "metadata" must be an object.'
    );
  }

  return Object.freeze({
    ...metadata
  });
}


/* ============================================================
   Contract validation
   ============================================================ */

/**
 * Validates lifecycle handler values.
 *
 * Lifecycle handlers are optional, but when supplied they must
 * be functions.
 */
function validateFrameConnLifecycleHandlers(
  lifecycle,
  featureId
) {
  for (
    const [phase, handler]
    of Object.entries(lifecycle)
  ) {
    if (
      !FRAME_CONN_FEATURE_LIFECYCLE_PHASES.includes(
        phase
      )
    ) {
      throw new Error(
        `Frame Conn feature "${featureId}" declares unknown lifecycle phase "${phase}".`
      );
    }

    if (typeof handler !== "function") {
      throw new TypeError(
        `Frame Conn feature "${featureId}" lifecycle handler "${phase}" must be a function.`
      );
    }
  }
}


/**
 * Validates hook declarations.
 *
 * Hook values may be:
 *
 *   - a function
 *   - an array of functions
 *
 * Multiple handlers are useful when one domain needs several
 * independent reactions to the same Foundry hook.
 */
function validateFrameConnHookHandlers(
  hooks,
  featureId
) {
  for (
    const [hookName, handler]
    of Object.entries(hooks)
  ) {
    const normalizedHookName =
      normalizeOptionalFrameConnIdentifier(
        hookName
      );

    if (!normalizedHookName) {
      throw new Error(
        `Frame Conn feature "${featureId}" contains an empty hook name.`
      );
    }

    if (typeof handler === "function") {
      continue;
    }

    if (
      Array.isArray(handler) &&
      handler.length > 0 &&
      handler.every(
        candidate =>
          typeof candidate === "function"
      )
    ) {
      continue;
    }

    throw new TypeError(
      `Frame Conn feature "${featureId}" hook "${hookName}" must be a function or a non-empty array of functions.`
    );
  }
}


/**
 * Validates commands and queries.
 *
 * These collections represent callable feature operations, so all
 * declared members must be functions.
 */
function validateFrameConnCallableRecord(
  record,
  fieldName,
  featureId
) {
  for (
    const [name, callable]
    of Object.entries(record)
  ) {
    if (typeof callable !== "function") {
      throw new TypeError(
        `Frame Conn feature "${featureId}" ${fieldName} member "${name}" must be a function.`
      );
    }
  }
}


/**
 * Public API members are intentionally less constrained.
 *
 * A public API may expose:
 *
 *   - functions
 *   - objects
 *   - constructors
 *   - getters represented through adapter functions
 *   - immutable values
 *
 * Therefore only its containing record is validated here.
 */


/* ============================================================
   Feature definition normalization
   ============================================================ */

/**
 * Defines and normalizes one Frame Conn feature.
 *
 * This is the canonical construction entry point for all future
 * domain modules.
 *
 * Example:
 *
 *   export const frameConnMovementFeature =
 *     defineFrameConnFeature({
 *       id: "movement",
 *       domain: "movement",
 *
 *       provides: [
 *         "movement.state",
 *         "movement.tracking"
 *       ],
 *
 *       dependsOn: [
 *         "turn.state",
 *         "actions.registry"
 *       ],
 *
 *       state: {
 *         manager: frameConnMovementState
 *       },
 *
 *       commands: {
 *         track: trackTokenMovement,
 *         reset: resetMovement
 *       },
 *
 *       queries: {
 *         tokenMatches: frameConnMovementTokenMatches
 *       },
 *
 *       hooks: {
 *         moveToken: handleMoveToken
 *       },
 *
 *       lifecycle: {
 *         initialize: initializeMovementDomain
 *       },
 *
 *       api: {
 *         track: trackTokenMovement
 *       }
 *     });
 */
export function defineFrameConnFeature(
  definition
) {
  if (
    !definition ||
    typeof definition !== "object" ||
    Array.isArray(definition)
  ) {
    throw new TypeError(
      "Frame Conn feature definitions must be objects."
    );
  }

  const id = normalizeRequiredFrameConnIdentifier(
    definition.id,
    "Frame Conn feature"
  );

  const domain =
    normalizeOptionalFrameConnIdentifier(
      definition.domain
    ) ?? id;

  const provides =
    normalizeFrameConnCapabilityList(
      definition.provides,
      "provides"
    );

  const dependsOn =
    normalizeFrameConnCapabilityList(
      definition.dependsOn,
      "dependsOn"
    );

  const optionalDependsOn =
    normalizeFrameConnCapabilityList(
      definition.optionalDependsOn,
      "optionalDependsOn"
    );

  const state =
    normalizeFrameConnFeatureRecord(
      definition.state,
      "state"
    );

  const commands =
    normalizeFrameConnFeatureRecord(
      definition.commands,
      "commands"
    );

  const queries =
    normalizeFrameConnFeatureRecord(
      definition.queries,
      "queries"
    );

  const hooks =
    normalizeFrameConnFeatureRecord(
      definition.hooks,
      "hooks"
    );

  const lifecycle =
    normalizeFrameConnFeatureRecord(
      definition.lifecycle,
      "lifecycle"
    );

  const api =
    normalizeFrameConnFeatureRecord(
      definition.api,
      "api"
    );

  const metadata =
    normalizeFrameConnFeatureMetadata(
      definition.metadata
    );

  validateFrameConnCallableRecord(
    commands,
    "commands",
    id
  );

  validateFrameConnCallableRecord(
    queries,
    "queries",
    id
  );

  validateFrameConnHookHandlers(
    hooks,
    id
  );

  validateFrameConnLifecycleHandlers(
    lifecycle,
    id
  );

  const normalizedFeature = {
    contractVersion:
      FRAME_CONN_FEATURE_CONTRACT_VERSION,

    id,
    domain,

    provides,
    dependsOn,
    optionalDependsOn,

    state,
    commands,
    queries,
    hooks,
    lifecycle,
    api,

    metadata
  };

  return Object.freeze(
    normalizedFeature
  );
}


/* ============================================================
   Feature-definition inspection
   ============================================================ */

/**
 * Returns whether a value appears to be a normalized Frame Conn
 * feature definition.
 *
 * This is intentionally a structural check rather than an
 * instanceof relationship so feature declarations remain simple
 * data records.
 */
export function isFrameConnFeatureDefinition(
  candidate
) {
  return Boolean(
    candidate &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    candidate.contractVersion ===
      FRAME_CONN_FEATURE_CONTRACT_VERSION &&
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.domain === "string" &&
    candidate.domain.length > 0 &&
    Array.isArray(candidate.provides) &&
    Array.isArray(candidate.dependsOn) &&
    candidate.state &&
    typeof candidate.state === "object" &&
    candidate.commands &&
    typeof candidate.commands === "object" &&
    candidate.queries &&
    typeof candidate.queries === "object" &&
    candidate.hooks &&
    typeof candidate.hooks === "object" &&
    candidate.lifecycle &&
    typeof candidate.lifecycle === "object" &&
    candidate.api &&
    typeof candidate.api === "object"
  );
}


/**
 * Asserts that a value is a normalized Frame Conn feature.
 *
 * Registry code can use this at its boundary rather than repeating
 * structural checks.
 */
export function assertFrameConnFeatureDefinition(
  candidate
) {
  if (!isFrameConnFeatureDefinition(candidate)) {
    throw new TypeError(
      "Expected a normalized Frame Conn feature definition."
    );
  }

  return candidate;
}


/* ============================================================
   Capability inspection
   ============================================================ */

/**
 * Returns whether a feature explicitly provides a capability.
 */
export function frameConnFeatureProvidesCapability(
  feature,
  capability
) {
  assertFrameConnFeatureDefinition(feature);

  const capabilityId =
    normalizeRequiredFrameConnIdentifier(
      capability,
      "Frame Conn capability"
    );

  return feature.provides.includes(
    capabilityId
  );
}


/**
 * Returns whether a feature explicitly requires a capability.
 */
export function frameConnFeatureDependsOnCapability(
  feature,
  capability
) {
  assertFrameConnFeatureDefinition(feature);

  const capabilityId =
    normalizeRequiredFrameConnIdentifier(
      capability,
      "Frame Conn capability"
    );

  return feature.dependsOn.includes(
    capabilityId
  );
}


/**
 * Returns whether a feature optionally consumes a capability.
 */
export function frameConnFeatureOptionallyDependsOnCapability(
  feature,
  capability
) {
  assertFrameConnFeatureDefinition(feature);

  const capabilityId =
    normalizeRequiredFrameConnIdentifier(
      capability,
      "Frame Conn capability"
    );

  return feature.optionalDependsOn.includes(
    capabilityId
  );
}


/* ============================================================
   Collection access helpers
   ============================================================ */

/**
 * Retrieves a named command from a feature.
 */
export function getFrameConnFeatureCommand(
  feature,
  commandName
) {
  assertFrameConnFeatureDefinition(feature);

  return feature.commands[
    String(commandName)
  ] ?? null;
}


/**
 * Retrieves a named query from a feature.
 */
export function getFrameConnFeatureQuery(
  feature,
  queryName
) {
  assertFrameConnFeatureDefinition(feature);

  return feature.queries[
    String(queryName)
  ] ?? null;
}


/**
 * Retrieves a named public API member from a feature.
 */
export function getFrameConnFeatureApiMember(
  feature,
  memberName
) {
  assertFrameConnFeatureDefinition(feature);

  return feature.api[
    String(memberName)
  ] ?? null;
}


/**
 * Retrieves one lifecycle handler.
 */
export function getFrameConnFeatureLifecycleHandler(
  feature,
  phase
) {
  assertFrameConnFeatureDefinition(feature);

  const normalizedPhase =
    String(phase ?? "").trim();

  if (
    !FRAME_CONN_FEATURE_LIFECYCLE_PHASES.includes(
      normalizedPhase
    )
  ) {
    return null;
  }

  return feature.lifecycle[
    normalizedPhase
  ] ?? null;
}


/* ============================================================
   Contract summary
   ============================================================ */

/**
 * Produces a small serializable description of a feature.
 *
 * Useful for debugging, diagnostics, and future registry
 * inspection without serializing functions or mutable state.
 */
export function summarizeFrameConnFeature(
  feature
) {
  assertFrameConnFeatureDefinition(feature);

  return Object.freeze({
    contractVersion:
      feature.contractVersion,

    id:
      feature.id,

    domain:
      feature.domain,

    provides:
      [...feature.provides],

    dependsOn:
      [...feature.dependsOn],

    optionalDependsOn:
      [...feature.optionalDependsOn],

    stateMembers:
      Object.keys(feature.state),

    commands:
      Object.keys(feature.commands),

    queries:
      Object.keys(feature.queries),

    hooks:
      Object.keys(feature.hooks),

    lifecycle:
      Object.keys(feature.lifecycle),

    api:
      Object.keys(feature.api)
  });
}