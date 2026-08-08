/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/frame-helm/dsl.js
 */
/**
 * ============================================================
 * FRAME HELM DECLARATIVE DSL
 * ============================================================
 *
 * ROLE:
 *   Provides small, descriptive construction helpers for
 *   Frame Helm's declarative action and category definitions.
 *
 * PURPOSE:
 *   Reduce repeated object-shape boilerplate while keeping
 *   all gameplay behavior explicit in the owning domain.
 *
 * OWNS:
 *   - Category-definition construction
 *   - Universal-action definition construction
 *   - Cost-specific action construction
 *   - Parent/child action descriptors
 *   - Target-requirement descriptors
 *   - Action metadata descriptors
 *   - Mech-skill metadata descriptors
 *
 * DOES NOT OWN:
 *   - Action registration
 *   - Registry state
 *   - Turn-state mutation
 *   - Action legality
 *   - Action execution
 *   - Foundry hooks
 *   - Foundry APIs
 *   - Actor APIs
 *   - Rendering
 *   - Movement tracking
 *   - Sensor behavior
 *
 * DESIGN CONTRACT:
 *   Every helper in this file must remain a pure constructor.
 *
 *   Calling a DSL helper:
 *     - must not register anything
 *     - must not mutate external state
 *     - must not call Foundry
 *     - must not execute gameplay behavior
 *     - must return an ordinary JavaScript object
 *
 *   The returned objects must remain compatible with the
 *   existing FrameHelmActionRegistry input contracts.
 *
 * DEPENDENCY RULE:
 *   This file must remain dependency-free.
 */
/* ============================================================
   Shared declarative primitives
   ============================================================ */
/**
 * Creates a shallow copy of optional metadata.
 *
 * This exists primarily to make metadata construction
 * semantically explicit at call sites.
 */
export function defineFrameHelmActionMetadata(
  metadata = {}
) {
  return {
    ...metadata
  };
}
/**
 * Describes a targeting requirement for an action.
 *
 * The returned object is intended to be spread directly into
 * an action definition.
 *
 * Example:
 *
 *   {
 *     ...defineFrameHelmTargetRequirement(
 *       "adjacent-character"
 *     )
 *   }
 */
export function defineFrameHelmTargetRequirement(
  targetType
) {
  return {
    requiresTarget: true,
    targetType
  };
}
/**
 * Explicitly describes an action as not requiring a target.
 *
 * Usually unnecessary because the registry already defaults
 * requiresTarget to false, but useful where explicitness helps
 * document intent.
 */
export function defineFrameHelmNoTargetRequirement() {
  return {
    requiresTarget: false,
    targetType: null
  };
}
/**
 * Describes a parent-child relationship between actions.
 *
 * The returned object is intended to be spread into an action
 * definition when nesting is clearer than assigning parentId
 * directly.
 */
export function defineFrameHelmChildActionOf(
  parentId
) {
  return {
    parentId
  };
}
/**
 * Creates metadata for a mech-skill action.
 *
 * Existing Frame Helm execution logic recognizes statPath and
 * statLabel in action.metadata.
 */
export function defineFrameHelmMechSkillMetadata({
  statPath,
  statLabel
}) {
  return defineFrameHelmActionMetadata({
    statPath,
    statLabel
  });
}
/* ============================================================
   Category definitions
   ============================================================ */
/**
 * Constructs a Frame Helm action-category definition.
 *
 * This mirrors the existing FrameHelmActionRegistry
 * registerCategory input shape.
 */
export function defineFrameHelmActionCategory({
  id,
  label,
  description = "",
  order = 0,
  icon = "",
  visible = true
}) {
  return {
    id,
    label,
    description,
    order,
    icon,
    visible
  };
}
/* ============================================================
   Base universal-action definition
   ============================================================ */
/**
 * Constructs the complete declarative shape accepted by
 * FrameHelmActionRegistry.register().
 *
 * This is the lowest-level action constructor in the DSL.
 * More semantic action constructors below specialize it by
 * assigning category and cost.
 */
export function defineFrameHelmUniversalAction({
  id,
  label,
  shortDescription = "",
  description = "",
  category,
  parentId = null,
  cost = "none",
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  movementMode = null,
  visible = true,
  metadata = {}
}) {
  return {
    id,
    label,
    shortDescription,
    description,
    category,
    parentId,
    cost,
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey: duplicateKey ?? id,
    repeatRule,
    movementMode,
    visible,
    metadata: {
      ...metadata
    }
  };
}
/* ============================================================
   Movement action definitions
   ============================================================ */
/**
 * Constructs a universal Movement action.
 *
 * Automatically supplies:
 *   category: "movement"
 *   cost: "movement"
 */
export function defineFrameHelmMovementAction({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  movementMode = null,
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "movement",
    parentId,
    cost: "movement",
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    movementMode,
    visible,
    metadata
  });
}
/* ============================================================
   Quick action definitions
   ============================================================ */
/**
 * Constructs a universal Quick Action.
 *
 * Automatically supplies:
 *   category: "quick"
 *   cost: "quick"
 */
export function defineFrameHelmQuickAction({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  movementMode = null,
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "quick",
    parentId,
    cost: "quick",
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    movementMode,
    visible,
    metadata
  });
}
/* ============================================================
   Full action definitions
   ============================================================ */
/**
 * Constructs a universal Full Action.
 *
 * Automatically supplies:
 *   category: "full"
 *   cost: "full"
 */
export function defineFrameHelmFullAction({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  movementMode = null,
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "full",
    parentId,
    cost: "full",
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    movementMode,
    visible,
    metadata
  });
}
/* ============================================================
   Special action definitions
   ============================================================ */
/**
 * Constructs a universal Special Action.
 *
 * The caller supplies the actual special cost because Frame
 * Helm currently distinguishes values such as:
 *
 *   "overcharge"
 *   "none"
 */
export function defineFrameHelmSpecialAction({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  cost = "none",
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "special",
    parentId,
    cost,
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    visible,
    metadata
  });
}
/* ============================================================
   Reaction definitions
   ============================================================ */
/**
 * Constructs a universal Reaction.
 *
 * Automatically supplies:
 *   category: "reaction"
 *   cost: "reaction"
 */
export function defineFrameHelmReaction({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-round",
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "reaction",
    parentId,
    cost: "reaction",
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    visible,
    metadata
  });
}
/* ============================================================
   Protocol definitions
   ============================================================ */
/**
 * Constructs a universal Protocol definition.
 *
 * Protocol execution behavior remains owned by turn state.
 *
 * The existing registry supports the protocol category even
 * though no universal protocol actions are currently declared.
 *
 * Automatically supplies:
 *   category: "protocol"
 *   cost: "none"
 */
export function defineFrameHelmProtocol({
  id,
  label,
  shortDescription = "",
  description = "",
  parentId = null,
  order = 0,
  icon = "",
  tags = [],
  requiresTarget = false,
  targetType = null,
  duplicateKey,
  repeatRule = "once-per-turn",
  visible = true,
  metadata = {}
}) {
  return defineFrameHelmUniversalAction({
    id,
    label,
    shortDescription,
    description,
    category: "protocol",
    parentId,
    cost: "none",
    order,
    icon,
    tags,
    requiresTarget,
    targetType,
    duplicateKey,
    repeatRule,
    visible,
    metadata
  });
}
/* ============================================================
   Frequently used semantic metadata descriptors
   ============================================================ */
/**
 * Marks an action as requiring flight capability.
 *
 * This remains purely declarative. Capability checking belongs
 * to whichever behavior domain eventually implements it.
 */
export function defineFrameHelmRequiresFlightCapabilityMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    requiresFlightCapability: true
  });
}
/**
 * Marks an action as requiring teleport capability.
 */
export function defineFrameHelmRequiresTeleportCapabilityMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    requiresTeleportCapability: true
  });
}
/**
 * Describes the current Hide prerequisites represented in the
 * existing action definitions.
 */
export function defineFrameHelmHideRequirementMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    requiresNotEngaged: true,
    requiresCoverOrInvisibility: true
  });
}
/**
 * Marks a Full Action as requiring a compatible Full Action
 * system or equipment entry.
 */
export function defineFrameHelmRequiresFullActionSystemMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    requiresFullActionSystem: true
  });
}
/**
 * Describes the available modes for Mount / Dismount / Eject.
 */
export function defineFrameHelmMountDismountModesMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    modes: [
      "mount",
      "dismount",
      "eject"
    ]
  });
}
/**
 * Describes the existing Overcharge action semantics.
 *
 * This does not implement Overcharge behavior.
 */
export function defineFrameHelmOverchargeMetadata(
  metadata = {}
) {
  return defineFrameHelmActionMetadata({
    ...metadata,
    grantsQuickAction: true,
    permitsDuplicateAction: true
  });
}