import {
  defineFrameHelmActionCategory,
  defineFrameHelmMovementAction,
  defineFrameHelmQuickAction,
  defineFrameHelmFullAction,
  defineFrameHelmSpecialAction,
  defineFrameHelmReaction,
  defineFrameHelmTargetRequirement,
  defineFrameHelmMechSkillMetadata,
  defineFrameHelmRequiresFlightCapabilityMetadata,
  defineFrameHelmRequiresTeleportCapabilityMetadata,
  defineFrameHelmHideRequirementMetadata,
  defineFrameHelmRequiresFullActionSystemMetadata,
  defineFrameHelmMountDismountModesMetadata,
  defineFrameHelmOverchargeMetadata
} from "./frame-helm/dsl.js";

import {
  frameHelmFeatureRegistry
} from "./feature-registry.js";


const MODULE_ID = "lancer-frame-helm";
const MODULE_TITLE = "Lancer: Frame Helm";


/* ==========================================================
   Action registry
   ========================================================== */

class FrameHelmActionRegistry {
  constructor() {
    this.actions = new Map();
    this.categories = new Map();
  }

  registerCategory(category) {
    if (!category || typeof category !== "object") {
      throw new TypeError(
        "Frame Helm categories must be objects."
      );
    }

    const id = String(category.id ?? "").trim();

    if (!id) {
      throw new Error(
        "Frame Helm categories require a non-empty id."
      );
    }

    if (this.categories.has(id)) {
      throw new Error(
        `Frame Helm category already registered: ${id}`
      );
    }

    const normalizedCategory = Object.freeze({
      id,
      label: String(category.label ?? id),
      description: String(category.description ?? ""),
      order: Number.isFinite(category.order)
        ? category.order
        : 0,
      icon: String(category.icon ?? ""),
      visible: category.visible !== false
    });

    this.categories.set(id, normalizedCategory);

    return normalizedCategory;
  }

  register(action) {
    if (!action || typeof action !== "object") {
      throw new TypeError(
        "Frame Helm actions must be objects."
      );
    }

    const id = String(action.id ?? "").trim();
    const category = String(action.category ?? "").trim();

    if (!id) {
      throw new Error(
        "Frame Helm actions require a non-empty id."
      );
    }

    if (!category) {
      throw new Error(
        `Frame Helm action ${id} requires a category.`
      );
    }

    if (!this.categories.has(category)) {
      throw new Error(
        `Frame Helm action ${id} references unknown category: ${category}`
      );
    }

    if (this.actions.has(id)) {
      throw new Error(
        `Frame Helm action already registered: ${id}`
      );
    }

    const normalizedAction = Object.freeze({
      id,

      label:
        String(action.label ?? id),

      shortDescription:
        String(
          action.shortDescription ?? ""
        ),

      description:
        String(action.description ?? ""),

      category,

      parentId:
        action.parentId
          ? String(action.parentId)
          : null,

      cost:
        String(action.cost ?? "none"),

      order:
        Number.isFinite(action.order)
          ? action.order
          : 0,

      icon:
        String(action.icon ?? ""),

      tags:
        Object.freeze(
          Array.isArray(action.tags)
            ? [...action.tags].map(String)
            : []
        ),

      requiresTarget:
        Boolean(action.requiresTarget),

      targetType:
        action.targetType
          ? String(action.targetType)
          : null,

      duplicateKey:
        String(
          action.duplicateKey ?? id
        ),

      repeatRule:
        String(
          action.repeatRule ??
          "once-per-turn"
        ),

      movementMode:
        action.movementMode
          ? String(action.movementMode)
          : null,

      visible:
        action.visible !== false,

      metadata:
        Object.freeze({
          ...(action.metadata ?? {})
        })
    });

    this.actions.set(
      id,
      normalizedAction
    );

    return normalizedAction;
  }

  registerMany(actions) {
    if (!Array.isArray(actions)) {
      throw new TypeError(
        "Frame Helm registerMany requires an array."
      );
    }

    return actions.map(
      action => this.register(action)
    );
  }

  get(id) {
    return (
      this.actions.get(String(id)) ??
      null
    );
  }

  getCategory(id) {
    return (
      this.categories.get(String(id)) ??
      null
    );
  }

  has(id) {
    return this.actions.has(
      String(id)
    );
  }

  listCategories({
    includeHidden = false
  } = {}) {
    return [
      ...this.categories.values()
    ]
      .filter(category => {
        return (
          includeHidden ||
          category.visible
        );
      })
      .sort((left, right) => {
        return (
          left.order - right.order ||
          left.label.localeCompare(
            right.label
          )
        );
      });
  }

  list({
    category = null,
    parentId = undefined,
    includeHidden = false
  } = {}) {
    return [
      ...this.actions.values()
    ]
      .filter(action => {
        if (
          !includeHidden &&
          !action.visible
        ) {
          return false;
        }

        if (
          category &&
          action.category !== category
        ) {
          return false;
        }

        if (
          parentId !== undefined &&
          action.parentId !== parentId
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        return (
          left.order - right.order ||
          left.label.localeCompare(
            right.label
          )
        );
      });
  }

  childrenOf(
    parentId,
    options = {}
  ) {
    return this.list({
      ...options,
      parentId: String(parentId)
    });
  }

  roots(
    category = null,
    options = {}
  ) {
    return this.list({
      ...options,
      category,
      parentId: null
    });
  }

  clear() {
    this.actions.clear();
    this.categories.clear();
  }

  toJSON() {
    return {
      categories:
        this.listCategories({
          includeHidden: true
        }),

      actions:
        this.list({
          includeHidden: true
        })
    };
  }
}


const frameHelmActionRegistry =
  new FrameHelmActionRegistry();


/* ==========================================================
   Universal action declarations
   ========================================================== */

function registerUniversalActionCategories() {
  [
    defineFrameHelmActionCategory({
      id: "movement",
      label: "Movement",
      description:
        "Movement available to the active unit.",
      order: 10,
      icon: "fas fa-person-running"
    }),

    defineFrameHelmActionCategory({
      id: "quick",
      label: "Quick Actions",
      description:
        "Spend one quick-action slot.",
      order: 20,
      icon: "fas fa-bolt"
    }),

    defineFrameHelmActionCategory({
      id: "full",
      label: "Full Actions",
      description:
        "Spend the unit's full action.",
      order: 30,
      icon: "fas fa-hourglass"
    }),

    defineFrameHelmActionCategory({
      id: "special",
      label: "Special Actions",
      description:
        "Actions outside the normal quick/full budget.",
      order: 40,
      icon: "fas fa-star"
    }),

    defineFrameHelmActionCategory({
      id: "reaction",
      label: "Reactions",
      description:
        "Actions triggered during any character's turn.",
      order: 50,
      icon: "fas fa-reply"
    }),

    defineFrameHelmActionCategory({
      id: "protocol",
      label: "Protocols",
      description:
        "Free actions usable only at the start of a turn.",
      order: 60,
      icon: "fas fa-microchip"
    })
  ].forEach(category => {
    frameHelmActionRegistry
      .registerCategory(category);
  });
}


function registerUniversalActions() {
  frameHelmActionRegistry.registerMany([
    /* ----------------------------------------------------------
       Movement
       ---------------------------------------------------------- */

    defineFrameHelmMovementAction({
      id: "movement.standard",
      label: "Standard Move",
      shortDescription:
        "Move up to your Speed.",
      order: 10,
      icon: "fas fa-person-walking",
      movementMode: "standard"
    }),

    defineFrameHelmMovementAction({
      id: "movement.jump",
      label: "Jump",
      shortDescription:
        "Jump instead of making a normal standard move.",
      parentId: "movement.standard",
      order: 20,
      icon: "fas fa-arrow-up",
      duplicateKey: "movement.standard",
      movementMode: "jump"
    }),

    defineFrameHelmMovementAction({
      id: "movement.climb",
      label: "Climb",
      shortDescription:
        "Climb at half Speed.",
      parentId: "movement.standard",
      order: 30,
      icon: "fas fa-mountain",
      duplicateKey: "movement.standard",
      movementMode: "climb"
    }),

    defineFrameHelmMovementAction({
      id: "movement.fly",
      label: "Fly",
      shortDescription:
        "Use available flight movement.",
      parentId: "movement.standard",
      order: 40,
      icon: "fas fa-plane-up",
      duplicateKey: "movement.standard",
      movementMode: "flight",

      metadata:
        defineFrameHelmRequiresFlightCapabilityMetadata()
    }),

    defineFrameHelmMovementAction({
      id: "movement.teleport",
      label: "Teleport",
      shortDescription:
        "Use an available teleport movement effect.",
      parentId: "movement.standard",
      order: 50,
      icon: "fas fa-wand-sparkles",
      duplicateKey: "movement.standard",
      movementMode: "teleport",

      metadata:
        defineFrameHelmRequiresTeleportCapabilityMetadata()
    }),

    /* ----------------------------------------------------------
       Quick actions
       ---------------------------------------------------------- */

    defineFrameHelmQuickAction({
      id: "quick.skirmish",
      label: "Skirmish",
      shortDescription:
        "Attack with one weapon.",
      order: 10,
      icon: "fas fa-crosshairs",

      ...defineFrameHelmTargetRequirement(
        "attack"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.boost",
      label: "Boost",
      shortDescription:
        "Move again, up to your Speed.",
      order: 20,
      icon: "fas fa-forward-fast",
      movementMode: "boost"
    }),

    defineFrameHelmQuickAction({
      id: "quick.grapple",
      label: "Grapple",
      shortDescription:
        "Make a melee attack to grapple an adjacent character.",
      order: 30,
      icon: "fas fa-hand-fist",

      ...defineFrameHelmTargetRequirement(
        "adjacent-character"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.hide",
      label: "Hide",
      shortDescription:
        "Become Hidden when the requirements are met.",
      order: 40,
      icon: "fas fa-user-ninja",

      metadata:
        defineFrameHelmHideRequirementMetadata()
    }),

    defineFrameHelmQuickAction({
      id: "quick.quick-tech",
      label: "Quick Tech",
      shortDescription:
        "Choose one available quick-tech option.",
      order: 50,
      icon: "fas fa-satellite-dish",
      repeatRule:
        "different-child-per-use"
    }),

    defineFrameHelmQuickAction({
      id: "quick.quick-tech.bolster",
      label: "Bolster",
      shortDescription:
        "Give another character Accuracy on a skill check or save.",
      parentId: "quick.quick-tech",
      order: 10,
      icon: "fas fa-shield-plus",

      ...defineFrameHelmTargetRequirement(
        "character-in-sensors"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.quick-tech.scan",
      label: "Scan",
      shortDescription:
        "Learn information about a target within Sensors.",
      parentId: "quick.quick-tech",
      order: 20,
      icon: "fas fa-radar",

      ...defineFrameHelmTargetRequirement(
        "character-or-object-in-sensors"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.quick-tech.lock-on",
      label: "Lock On",
      shortDescription:
        "Give a target the Lock On condition.",
      parentId: "quick.quick-tech",
      order: 30,
      icon: "fas fa-bullseye",

      ...defineFrameHelmTargetRequirement(
        "character-in-sensors"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.quick-tech.invade",
      label: "Invade",
      shortDescription:
        "Make a tech attack against a character within Sensors.",
      parentId: "quick.quick-tech",
      order: 40,
      icon: "fas fa-virus",

      ...defineFrameHelmTargetRequirement(
        "character-in-sensors"
      )
    }),

    defineFrameHelmQuickAction({
      id:
        "quick.quick-tech.invade.fragment-signal",

      label:
        "Fragment Signal",

      shortDescription:
        "On a successful Invade, the target becomes Impaired and Slowed.",

      parentId:
        "quick.quick-tech.invade",

      order: 10,
      icon: "fas fa-signal",

      ...defineFrameHelmTargetRequirement(
        "character-in-sensors"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.ram",
      label: "Ram",
      shortDescription:
        "Knock an adjacent target Prone and optionally push it.",
      order: 60,
      icon:
        "fas fa-people-arrows-left-right",

      ...defineFrameHelmTargetRequirement(
        "adjacent-character"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.search",
      label: "Search",
      shortDescription:
        "Attempt to reveal a Hidden character within Sensors.",
      order: 70,
      icon:
        "fas fa-magnifying-glass",

      ...defineFrameHelmTargetRequirement(
        "suspected-hidden-character"
      )
    }),

    defineFrameHelmQuickAction({
      id: "quick.prepare",
      label: "Prepare",
      shortDescription:
        "Prepare another quick action with a specified trigger.",
      order: 80,
      icon: "fas fa-clock"
    }),

    defineFrameHelmQuickAction({
      id: "quick.shut-down",
      label: "Shut Down",
      shortDescription:
        "Power the mech down and enter the Shut Down state.",
      order: 90,
      icon: "fas fa-power-off"
    }),

    defineFrameHelmQuickAction({
      id: "quick.self-destruct",
      label: "Self-Destruct",
      shortDescription:
        "Begin a delayed reactor meltdown.",
      order: 100,
      icon: "fas fa-radiation"
    }),

    /* ----------------------------------------------------------
       Full actions
       ---------------------------------------------------------- */

    defineFrameHelmFullAction({
      id: "full.barrage",
      label: "Barrage",
      shortDescription:
        "Attack with two weapons or one Superheavy weapon.",
      order: 10,
      icon: "fas fa-gun",

      ...defineFrameHelmTargetRequirement(
        "attack"
      )
    }),

    defineFrameHelmFullAction({
      id: "full.disengage",
      label: "Disengage",
      shortDescription:
        "Ignore engagement and movement reactions for this turn.",
      order: 20,
      icon:
        "fas fa-person-walking-arrow-right"
    }),

    defineFrameHelmFullAction({
      id: "full.full-tech",
      label: "Full Tech",
      shortDescription:
        "Take two Quick Tech options or one Full Tech option.",
      order: 30,
      icon: "fas fa-laptop-code",
      repeatRule:
        "full-tech-selection"
    }),

    defineFrameHelmFullAction({
      id: "full.improvised-attack",
      label: "Improvised Attack",
      shortDescription:
        "Make an improvised melee attack against an adjacent target.",
      order: 40,
      icon: "fas fa-hammer",

      ...defineFrameHelmTargetRequirement(
        "adjacent-character"
      )
    }),

    defineFrameHelmFullAction({
      id: "full.stabilize",
      label: "Stabilize",
      shortDescription:
        "Clear heat or restore HP, then perform one additional stabilization option.",
      order: 50,
      icon:
        "fas fa-screwdriver-wrench"
    }),

    defineFrameHelmFullAction({
      id: "full.activate",
      label: "Activate",
      shortDescription:
        "Activate a system or piece of equipment with a Full Action activation cost.",
      order: 60,
      icon: "fas fa-gears",

      metadata:
        defineFrameHelmRequiresFullActionSystemMetadata()
    }),

    defineFrameHelmFullAction({
      id: "full.boot-up",
      label: "Boot Up",
      shortDescription:
        "Clear Shut Down and restore the mech to a powered state.",
      order: 70,
      icon: "fas fa-toggle-on"
    }),

    defineFrameHelmFullAction({
      id: "full.mount-dismount",
      label: "Mount, Dismount, or Eject",
      shortDescription:
        "Mount or dismount a mech or vehicle, or eject from your mech.",
      order: 80,
      icon:
        "fas fa-person-arrow-up-from-line",

      metadata:
        defineFrameHelmMountDismountModesMetadata()
    }),

    defineFrameHelmFullAction({
      id: "full.skill-check",
      label: "Skill Check",
      shortDescription:
        "Attempt a complex activity not covered by another action.",
      order: 90,
      icon: "fas fa-dice-d20"
    }),

    defineFrameHelmFullAction({
      id: "full.skill-check.hull",
      label: "Hull Check",
      shortDescription:
        "Roll a mech skill check using HULL.",
      parentId: "full.skill-check",
      order: 10,
      icon: "fas fa-shield-halved",
      duplicateKey: "full.skill-check",

      metadata:
        defineFrameHelmMechSkillMetadata({
          statPath: "hull",
          statLabel: "HULL"
        })
    }),

    defineFrameHelmFullAction({
      id: "full.skill-check.agi",
      label: "Agility Check",
      shortDescription:
        "Roll a mech skill check using AGI.",
      parentId: "full.skill-check",
      order: 20,
      icon: "fas fa-person-running",
      duplicateKey: "full.skill-check",

      metadata:
        defineFrameHelmMechSkillMetadata({
          statPath: "agi",
          statLabel: "AGI"
        })
    }),

    defineFrameHelmFullAction({
      id: "full.skill-check.sys",
      label: "Systems Check",
      shortDescription:
        "Roll a mech skill check using SYS.",
      parentId: "full.skill-check",
      order: 30,
      icon: "fas fa-microchip",
      duplicateKey: "full.skill-check",

      metadata:
        defineFrameHelmMechSkillMetadata({
          statPath: "sys",
          statLabel: "SYS"
        })
    }),

    defineFrameHelmFullAction({
      id: "full.skill-check.eng",
      label: "Engineering Check",
      shortDescription:
        "Roll a mech skill check using ENG.",
      parentId: "full.skill-check",
      order: 40,
      icon:
        "fas fa-screwdriver-wrench",
      duplicateKey:
        "full.skill-check",

      metadata:
        defineFrameHelmMechSkillMetadata({
          statPath: "eng",
          statLabel: "ENG"
        })
    }),

    /* ----------------------------------------------------------
       Special actions
       ---------------------------------------------------------- */

    defineFrameHelmSpecialAction({
      id: "special.overcharge",
      label: "Overcharge",
      shortDescription:
        "Take Heat to gain one additional quick action as a free action.",
      cost: "overcharge",
      order: 10,
      icon:
        "fas fa-temperature-high",

      metadata:
        defineFrameHelmOverchargeMetadata()
    }),

    defineFrameHelmSpecialAction({
      id: "special.end-turn",
      label: "End Turn",
      shortDescription:
        "Declare that the active unit has finished its turn.",
      cost: "none",
      order: 1000,
      icon:
        "fas fa-flag-checkered",
      repeatRule:
        "unrestricted"
    }),

    /* ----------------------------------------------------------
       Reactions
       ---------------------------------------------------------- */

    defineFrameHelmReaction({
      id: "reaction.brace",
      label: "Brace",
      shortDescription:
        "Gain Resistance to the triggering attack and hinder later attacks.",
      order: 10,
      icon: "fas fa-shield-halved"
    }),

    defineFrameHelmReaction({
      id: "reaction.overwatch",
      label: "Overwatch",
      shortDescription:
        "Skirmish when a hostile character begins movement within Threat.",
      order: 20,
      icon: "fas fa-eye",

      ...defineFrameHelmTargetRequirement(
        "hostile-in-threat"
      )
    })
  ]);
}


function initializeActionRegistry() {
  frameHelmActionRegistry.clear();

  registerUniversalActionCategories();
  registerUniversalActions();

  console.log(
    `${MODULE_TITLE} | Registered ${frameHelmActionRegistry.actions.size} universal actions.`
  );
}


/* ==========================================================
   Turn state
   ========================================================== */

class FrameHelmTurnState {
  constructor(context = {}) {
    this.reset(context);
  }

  reset(context = {}) {
    this.context = {
      combatId:
        context.combatId ?? null,

      combatantId:
        context.combatantId ?? null,

      tokenId:
        context.tokenId ?? null,

      actorId:
        context.actorId ?? null,

      sceneId:
        context.sceneId ?? null,

      round:
        Number.isFinite(context.round)
          ? context.round
          : null,

      turn:
        Number.isFinite(context.turn)
          ? context.turn
          : null
    };

    const hasSpeedValue =
      context.speed !== null &&
      context.speed !== undefined &&
      context.speed !== "";

    const speed =
      hasSpeedValue
        ? Number(context.speed)
        : null;

    this.speed =
      speed !== null &&
      Number.isFinite(speed) &&
      speed >= 0
        ? speed
        : null;

    this.movement = {
      maximum:
        this.speed,

      spent:
        0,

      remaining:
        this.speed,

      completed:
        false,

      totalTracked:
        0,

      standardUsed:
        0,

      boostUsed:
        0,

      overchargeBoostUsed:
        0,

      excess:
        0,

      segments:
        [],

      processedMovementIds:
        []
    };

    this.actionMode = null;

    this.quickActionsRemaining = 2;

    this.fullActionAvailable = true;

    this.overcharge = {
      used: false,
      quickActionRemaining: 0,
      heatFormula: null
    };

    this.protocol = {
      available: true,
      used: false,
      startOfTurnOpen: true
    };

    this.reaction = {
      usedThisTurn: false,
      actionId: null
    };

    this.usedActions = [];
    this.usedDuplicateKeys = [];
    this.history = [];

    this.ended = false;
    this.startedAt = Date.now();
    this.endedAt = null;

    return this;
  }

  setSpeed(speed) {
    const numericSpeed =
      Number(speed);

    if (
      !Number.isFinite(numericSpeed) ||
      numericSpeed < 0
    ) {
      throw new TypeError(
        "Frame Helm speed must be a non-negative number."
      );
    }

    const previousMaximum =
      this.movement.maximum;

    const previousSpent =
      this.movement.spent;

    this.speed =
      numericSpeed;

    this.movement.maximum =
      numericSpeed;

    this.movement.spent =
      Math.min(
        previousSpent,
        numericSpeed
      );

    this.movement.remaining =
      Math.max(
        0,
        numericSpeed -
          this.movement.spent
      );

    if (
      previousMaximum === null
    ) {
      this.recordHistory(
        "set-speed",
        {
          speed:
            numericSpeed
        }
      );
    }

    return this.movement.remaining;
  }

  spendMovement(distance) {
    this.assertTurnActive();

    const numericDistance =
      Number(distance);

    if (
      !Number.isFinite(
        numericDistance
      ) ||
      numericDistance < 0
    ) {
      throw new TypeError(
        "Movement distance must be a non-negative number."
      );
    }

    if (
      this.movement.maximum === null
    ) {
      throw new Error(
        "Movement speed has not been assigned to this turn."
      );
    }

    if (
      numericDistance >
      this.movement.remaining
    ) {
      throw new Error(
        `Only ${this.movement.remaining} movement remains.`
      );
    }

    this.movement.spent +=
      numericDistance;

    this.movement.remaining -=
      numericDistance;

    if (
      this.movement.remaining === 0
    ) {
      this.movement.completed =
        true;
    }

    this.closeProtocolWindow();

    this.recordHistory(
      "spend-movement",
      {
        distance:
          numericDistance
      }
    );

    return this.movement.remaining;
  }

  completeMovement() {
    this.assertTurnActive();

    this.movement.completed =
      true;

    this.recordHistory(
      "complete-movement",
      {
        remaining:
          this.movement.remaining
      }
    );
  }

  reopenMovement() {
    this.assertTurnActive();

    if (
      this.movement.maximum !== null &&
      this.movement.remaining <= 0
    ) {
      this.movement.spent = 0;

      this.movement.remaining =
        this.movement.maximum;
    }

    this.movement.completed =
      false;

    this.recordHistory(
      "reopen-movement",
      {
        remaining:
          this.movement.remaining
      }
    );
  }

  commitMovement(actionId) {
    this.assertTurnActive();

    if (
      this.movement.maximum === null
    ) {
      throw new Error(
        "Movement speed has not been assigned to this turn."
      );
    }

    if (
      this.movement.completed
    ) {
      throw new Error(
        "Movement has already been committed."
      );
    }

    if (
      this.movement.remaining <= 0
    ) {
      throw new Error(
        "No movement remains to commit."
      );
    }

    const committedDistance =
      this.movement.remaining;

    this.movement.spent +=
      committedDistance;

    this.movement.remaining = 0;
    this.movement.completed = true;

    this.closeProtocolWindow();

    this.recordHistory(
      "movement-commit",
      {
        actionId,
        distance:
          committedDistance
      }
    );

    return committedDistance;
  }

  refreshMovementFromBoost() {
    this.assertTurnActive();

    if (
      this.movement.maximum === null
    ) {
      this.recordHistory(
        "boost-movement-refill",
        {
          distance: null
        }
      );

      return null;
    }

    this.movement.spent = 0;

    this.movement.remaining =
      this.movement.maximum;

    this.movement.completed =
      false;

    this.recordHistory(
      "boost-movement-refill",
      {
        distance:
          this.movement.maximum
      }
    );

    return this.movement.remaining;
  }

  movementBoostEntries() {
    return this.usedActions.filter(
      entry => {
        return (
          entry.actionId ===
          "quick.boost"
        );
      }
    );
  }

  movementBoostCount() {
    return (
      this.movementBoostEntries()
        .length
    );
  }

  hasProcessedMovementId(
    movementId
  ) {
    if (!movementId) {
      return false;
    }

    return (
      this.movement
        .processedMovementIds
        .includes(
          String(movementId)
        )
    );
  }

  rememberMovementId(
    movementId
  ) {
    if (!movementId) {
      return;
    }

    const normalizedId =
      String(movementId);

    if (
      !this.movement
        .processedMovementIds
        .includes(
          normalizedId
        )
    ) {
      this.movement
        .processedMovementIds
        .push(
          normalizedId
        );
    }

    if (
      this.movement
        .processedMovementIds
        .length > 100
    ) {
      this.movement
        .processedMovementIds
        .splice(
          0,
          this.movement
            .processedMovementIds
            .length - 100
        );
    }
  }

  ensureAutomaticMovementBoost({
    forceOvercharge = false
  } = {}) {
    this.assertTurnActive();

    const boostAction =
      frameHelmActionRegistry.get(
        "quick.boost"
      );

    if (!boostAction) {
      return {
        committed: false,
        reason:
          "Boost is not registered."
      };
    }

    if (!forceOvercharge) {
      const normalPermission =
        this.canUseAction(
          boostAction
        );

      if (
        normalPermission.allowed
      ) {
        this.useAction(
          boostAction,
          {
            metadata: {
              automatic: true,
              reason:
                "token-movement"
            }
          }
        );

        this.recordHistory(
          "automatic-movement-boost",
          {
            source: "normal"
          }
        );

        return {
          committed: true,
          source: "normal",
          heatFormula: null
        };
      }
    }

    let heatFormula = null;

    let triggeredOvercharge =
      false;

    if (
      !this.overcharge.used
    ) {
      heatFormula =
        this.useOvercharge();

      triggeredOvercharge =
        true;
    }

    const overchargePermission =
      this.canUseAction(
        boostAction,
        {
          useOvercharge: true
        }
      );

    if (
      !overchargePermission.allowed
    ) {
      return {
        committed: false,
        triggeredOvercharge,
        heatFormula,
        reason:
          overchargePermission.reason
      };
    }

    this.useAction(
      boostAction,
      {
        useOvercharge: true,

        metadata: {
          automatic: true,
          reason:
            "token-movement"
        }
      }
    );

    this.recordHistory(
      "automatic-movement-boost",
      {
        source:
          "overcharge",

        heatFormula
      }
    );

    return {
      committed: true,
      source: "overcharge",
      triggeredOvercharge,
      heatFormula
    };
  }

  recalculateTrackedMovement() {
    const speed =
      Number(
        this.movement.maximum
      );

    const total =
      Number(
        this.movement.totalTracked
      ) || 0;

    if (
      !Number.isFinite(speed) ||
      speed <= 0
    ) {
      this.movement.standardUsed =
        total;

      this.movement.boostUsed =
        0;

      this.movement
        .overchargeBoostUsed =
        0;

      this.movement.spent =
        total;

      this.movement.remaining =
        0;

      this.movement.excess =
        0;

      this.movement.completed =
        total > 0;

      return;
    }

    const boostEntries =
      this.movementBoostEntries();

    const normalBoostCount =
      boostEntries.filter(
        entry => {
          return (
            entry.source !==
            "overcharge"
          );
        }
      ).length;

    const overchargeBoostCount =
      boostEntries.filter(
        entry => {
          return (
            entry.source ===
            "overcharge"
          );
        }
      ).length;

    const standardUsed =
      Math.min(
        total,
        speed
      );

    const boostUsed =
      normalBoostCount > 0
        ? Math.min(
            Math.max(
              total - speed,
              0
            ),
            speed
          )
        : 0;

    const overchargeStart =
      speed *
      (
        1 +
        normalBoostCount
      );

    const overchargeBoostUsed =
      overchargeBoostCount > 0
        ? Math.min(
            Math.max(
              total -
                overchargeStart,
              0
            ),
            speed
          )
        : 0;

    const legalAllowanceCount =
      1 +
      normalBoostCount +
      overchargeBoostCount;

    const legalMaximum =
      speed *
      legalAllowanceCount;

    const excess =
      Math.max(
        total -
          legalMaximum,
        0
      );

    let currentPoolUsed =
      standardUsed;

    if (
      normalBoostCount > 0 &&
      total > speed
    ) {
      currentPoolUsed =
        boostUsed;
    }

    if (
      overchargeBoostCount > 0 &&
      total > overchargeStart
    ) {
      currentPoolUsed =
        overchargeBoostUsed;
    }

    if (
      excess > 0
    ) {
      currentPoolUsed =
        speed;
    }

    this.movement.standardUsed =
      standardUsed;

    this.movement.boostUsed =
      boostUsed;

    this.movement
      .overchargeBoostUsed =
      overchargeBoostUsed;

    this.movement.excess =
      excess;

    this.movement.spent =
      currentPoolUsed;

    this.movement.remaining =
      excess > 0
        ? 0
        : Math.max(
            speed -
              currentPoolUsed,
            0
          );

    this.movement.completed =
      this.movement.remaining <=
      0;
  }

  trackTokenMovement(
    distance,
    {
      movementId = null,
      method = null,
      origin = null,
      destination = null
    } = {}
  ) {
    this.assertTurnActive();

    const numericDistance =
      Number(distance);

    if (
      !Number.isFinite(
        numericDistance
      ) ||
      numericDistance <= 0
    ) {
      return {
        tracked: false,
        distance: 0,
        reason:
          "Movement distance was zero."
      };
    }

    if (
      this.hasProcessedMovementId(
        movementId
      )
    ) {
      return {
        tracked: false,
        distance: 0,
        reason:
          "Movement was already recorded."
      };
    }

    const speed =
      Number(
        this.movement.maximum
      );

    if (
      !Number.isFinite(speed) ||
      speed <= 0
    ) {
      throw new Error(
        "Frame Helm cannot track movement until the unit has a positive Speed."
      );
    }

    const previousTotal =
      this.movement.totalTracked;

    const newTotal =
      previousTotal +
      numericDistance;

    const previousBoostCount =
      this.movementBoostCount();

    const automaticActions =
      [];

    if (
      newTotal > speed &&
      this.movementBoostCount() <
        1
    ) {
      const result =
        this.ensureAutomaticMovementBoost({
          forceOvercharge: false
        });

      automaticActions.push({
        threshold: speed,
        ...result
      });
    }

    if (
      newTotal > speed * 2 &&
      this.movementBoostCount() <
        2
    ) {
      const result =
        this.ensureAutomaticMovementBoost({
          forceOvercharge: true
        });

      automaticActions.push({
        threshold:
          speed * 2,

        ...result
      });
    }

    this.movement.totalTracked =
      newTotal;

    this.movement.segments.push({
      distance:
        numericDistance,

      movementId:
        movementId
          ? String(movementId)
          : null,

      method:
        method
          ? String(method)
          : null,

      origin:
        origin
          ? { ...origin }
          : null,

      destination:
        destination
          ? { ...destination }
          : null,

      timestamp:
        Date.now()
    });

    this.rememberMovementId(
      movementId
    );

    this.closeProtocolWindow();

    this.recalculateTrackedMovement();

    this.recordHistory(
      "token-movement",
      {
        distance:
          numericDistance,

        totalDistance:
          newTotal,

        movementId,
        method,
        automaticActions,
        previousBoostCount,

        boostCount:
          this.movementBoostCount(),

        excess:
          this.movement.excess
      }
    );

    return {
      tracked: true,

      distance:
        numericDistance,

      totalDistance:
        newTotal,

      remaining:
        this.movement.remaining,

      standardUsed:
        this.movement.standardUsed,

      boostUsed:
        this.movement.boostUsed,

      overchargeBoostUsed:
        this.movement
          .overchargeBoostUsed,

      excess:
        this.movement.excess,

      automaticActions
    };
  }

  closeProtocolWindow() {
    if (
      !this.protocol
        .startOfTurnOpen
    ) {
      return;
    }

    this.protocol
      .startOfTurnOpen =
      false;

    if (
      !this.protocol.used
    ) {
      this.protocol.available =
        false;
    }
  }

  useProtocol(
    actionId = null
  ) {
    this.assertTurnActive();

    if (
      !this.protocol
        .startOfTurnOpen
    ) {
      throw new Error(
        "Protocols can only be activated at the start of a turn."
      );
    }

    if (
      this.protocol.used
    ) {
      throw new Error(
        "A protocol has already been used this turn."
      );
    }

    this.protocol.used =
      true;

    this.protocol.available =
      false;

    this.recordHistory(
      "use-protocol",
      {
        actionId
      }
    );
  }

  overchargeHeatFormula(
    overchargeCount = 0
  ) {
    if (
      overchargeCount <= 0
    ) {
      return "1";
    }

    if (
      overchargeCount === 1
    ) {
      return "1d3";
    }

    if (
      overchargeCount === 2
    ) {
      return "1d6";
    }

    return "1d6+4";
  }

  useOvercharge({
    previousOvercharges = 0
  } = {}) {
    this.assertTurnActive();

    if (
      this.overcharge.used
    ) {
      throw new Error(
        "This unit has already Overcharged this turn."
      );
    }

    this.overcharge.used =
      true;

    this.overcharge
      .quickActionRemaining =
      1;

    this.overcharge.heatFormula =
      this.overchargeHeatFormula(
        previousOvercharges
      );

    this.closeProtocolWindow();

    this.recordHistory(
      "overcharge",
      {
        heatFormula:
          this.overcharge
            .heatFormula,

        previousOvercharges
      }
    );

    return (
      this.overcharge
        .heatFormula
    );
  }

  actionDuplicateKey(action) {
    return String(
      action?.duplicateKey ??
      action?.id ??
      ""
    );
  }

  hasUsedDuplicateKey(
    duplicateKey
  ) {
    return (
      this.usedDuplicateKeys
        .includes(
          String(duplicateKey)
        )
    );
  }

  canUseAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false
    } = {}
  ) {
    const action =
      typeof actionOrId === "string"
        ? frameHelmActionRegistry.get(
            actionOrId
          )
        : actionOrId;

    if (!action) {
      return {
        allowed: false,
        reason: "Unknown action."
      };
    }

    if (this.ended) {
      return {
        allowed: false,
        reason:
          "The turn has already ended."
      };
    }

    if (
      action.id ===
      "special.end-turn"
    ) {
      return {
        allowed: true,
        reason: null
      };
    }

    if (
      action.cost === "movement"
    ) {
      if (
        this.movement.completed
      ) {
        return {
          allowed: false,
          reason:
            "Movement has been marked complete."
        };
      }

      if (
        this.movement.remaining ===
        0
      ) {
        return {
          allowed: false,
          reason:
            "No standard movement remains."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (
      action.cost === "overcharge"
    ) {
      if (
        this.overcharge.used
      ) {
        return {
          allowed: false,
          reason:
            "Overcharge has already been used this turn."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (
      action.cost === "full"
    ) {
      if (
        !this.fullActionAvailable
      ) {
        return {
          allowed: false,
          reason:
            "The normal action budget has already been spent."
        };
      }

      if (
        this.actionMode ===
        "quick"
      ) {
        return {
          allowed: false,
          reason:
            "A quick action has already been taken."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (
      action.cost === "quick"
    ) {
      const duplicateKey =
        this.actionDuplicateKey(
          action
        );

      const duplicateUsed =
        this.hasUsedDuplicateKey(
          duplicateKey
        );

      if (
        useOvercharge
      ) {
        if (
          !this.overcharge.used
        ) {
          return {
            allowed: false,
            reason:
              "Overcharge has not been activated."
          };
        }

        if (
          this.overcharge
            .quickActionRemaining <
          1
        ) {
          return {
            allowed: false,
            reason:
              "The Overcharge quick action has been spent."
          };
        }

        return {
          allowed: true,
          reason: null,
          source: "overcharge"
        };
      }

      if (
        this.actionMode ===
        "full"
      ) {
        return {
          allowed: false,
          reason:
            "A full action has already been taken."
        };
      }

      if (
        this.quickActionsRemaining <
        1
      ) {
        return {
          allowed: false,
          reason:
            "No normal quick actions remain."
        };
      }

      if (
        duplicateUsed &&
        !ignoreDuplicate &&
        action.repeatRule !==
          "unrestricted"
      ) {
        return {
          allowed: false,
          reason:
            "This action has already been taken this turn. Use Overcharge to repeat it."
        };
      }

      return {
        allowed: true,
        reason: null,
        source: "normal"
      };
    }

    if (
      action.cost ===
      "reaction"
    ) {
      if (
        this.reaction
          .usedThisTurn
      ) {
        return {
          allowed: false,
          reason:
            "A reaction has already been used during this turn."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    return {
      allowed: true,
      reason: null
    };
  }

  useAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false,
      metadata = {}
    } = {}
  ) {
    const action =
      typeof actionOrId === "string"
        ? frameHelmActionRegistry.get(
            actionOrId
          )
        : actionOrId;

    const permission =
      this.canUseAction(
        action,
        {
          useOvercharge,
          ignoreDuplicate
        }
      );

    if (
      !permission.allowed
    ) {
      throw new Error(
        permission.reason
      );
    }

    if (
      action.id ===
      "special.end-turn"
    ) {
      this.endTurn();

      return this.snapshot();
    }

    if (
      action.cost ===
      "overcharge"
    ) {
      this.useOvercharge(
        metadata
      );

      return this.snapshot();
    }

    if (
      action.cost === "quick"
    ) {
      if (
        useOvercharge
      ) {
        this.overcharge
          .quickActionRemaining -=
          1;
      } else {
        this.actionMode =
          "quick";

        this.quickActionsRemaining -=
          1;

        this.fullActionAvailable =
          false;
      }
    }

    if (
      action.cost === "full"
    ) {
      this.actionMode =
        "full";

      this.fullActionAvailable =
        false;

      this.quickActionsRemaining =
        0;
    }

    if (
      action.cost ===
      "reaction"
    ) {
      this.reaction.usedThisTurn =
        true;

      this.reaction.actionId =
        action.id;
    }

    if (
      action.cost !== "none"
    ) {
      this.closeProtocolWindow();
    }

    const duplicateKey =
      this.actionDuplicateKey(
        action
      );

    this.usedActions.push({
      id:
        foundry.utils.randomID(),

      actionId:
        action.id,

      duplicateKey,

      source:
        useOvercharge
          ? "overcharge"
          : "normal",

      timestamp:
        Date.now(),

      executed:
        false,

      executedAt:
        null,

      executionMetadata:
        {},

      metadata: {
        ...metadata
      }
    });

    if (
      duplicateKey &&
      !this.usedDuplicateKeys
        .includes(
          duplicateKey
        )
    ) {
      this.usedDuplicateKeys.push(
        duplicateKey
      );
    }

    this.recordHistory(
      "use-action",
      {
        actionId:
          action.id,

        duplicateKey,

        source:
          useOvercharge
            ? "overcharge"
            : "normal"
      }
    );

    return this.snapshot();
  }

  markCommittedActionExecuted(
    entryId,
    executionMetadata = {}
  ) {
    const entry =
      this.usedActions.find(
        candidate => {
          return (
            candidate.id ===
            entryId
          );
        }
      );

    if (!entry) {
      throw new Error(
        "The committed action could not be found."
      );
    }

    entry.executed =
      true;

    entry.executedAt =
      Date.now();

    entry.executionMetadata = {
      ...entry.executionMetadata,
      ...executionMetadata
    };

    this.recordHistory(
      "execute-action",
      {
        entryId,

        actionId:
          entry.actionId,

        executionMetadata: {
          ...executionMetadata
        }
      }
    );

    return entry;
  }

  markReactionAvailable() {
    this.reaction.usedThisTurn =
      false;

    this.reaction.actionId =
      null;
  }

  endTurn() {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.endedAt = Date.now();

    this.protocol.available =
      false;

    this.protocol
      .startOfTurnOpen =
      false;

    this.recordHistory(
      "end-turn",
      {}
    );
  }

  assertTurnActive() {
    if (this.ended) {
      throw new Error(
        "The current Frame Helm turn has ended."
      );
    }
  }

  recordHistory(
    type,
    data = {}
  ) {
    this.history.push({
      type,
      timestamp:
        Date.now(),

      data: {
        ...data
      }
    });
  }

  snapshot() {
    return {
      context: {
        ...this.context
      },

      speed:
        this.speed,

      movement: {
        ...this.movement
      },

      actionMode:
        this.actionMode,

      quickActionsRemaining:
        this.quickActionsRemaining,

      fullActionAvailable:
        this.fullActionAvailable,

      overcharge: {
        ...this.overcharge
      },

      protocol: {
        ...this.protocol
      },

      reaction: {
        ...this.reaction
      },

      usedActions:
        this.usedActions.map(
          entry => ({
            ...entry,

            metadata: {
              ...entry.metadata
            },

            executionMetadata: {
              ...entry.executionMetadata
            }
          })
        ),

      usedDuplicateKeys: [
        ...this.usedDuplicateKeys
      ],

      history:
        this.history.map(
          entry => ({
            ...entry,

            data: {
              ...entry.data
            }
          })
        ),

      ended:
        this.ended,

      startedAt:
        this.startedAt,

      endedAt:
        this.endedAt
    };
  }
}


class FrameHelmTurnStateManager {
  constructor() {
    this.current = null;
  }

  beginTurn(context = {}) {
    this.current =
      new FrameHelmTurnState(
        context
      );

    console.log(
      `${MODULE_TITLE} | Began turn state.`,
      this.current.snapshot()
    );

    this.renderApplication();

    return this.current;
  }

  ensureTurn(context = {}) {
    if (
      !this.current ||
      this.current.ended
    ) {
      return this.beginTurn(
        context
      );
    }

    return this.current;
  }

  endTurn() {
    if (!this.current) {
      return null;
    }

    this.current.endTurn();

    this.renderApplication();

    return this.current.snapshot();
  }

  clear() {
    this.current = null;

    this.renderApplication();
  }

  snapshot() {
    return (
      this.current?.snapshot() ??
      null
    );
  }

  renderApplication() {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
}


const frameHelmTurnState =
  new FrameHelmTurnStateManager();


function activeCombatTurnContext(
  combat = game.combat
) {
  const combatant =
    combat?.combatant ??
    null;

  const tokenDocument =
    combatant?.token ??
    null;

  const actor =
    combatant?.actor ??
    null;

  const numericSpeed =
    Number(
      actor?.system?.speed
    );

  return {
    combatId:
      combat?.id ??
      null,

    combatantId:
      combatant?.id ??
      null,

    tokenId:
      tokenDocument?.id ??
      null,

    actorId:
      actor?.id ??
      null,

    sceneId:
      combat?.scene?.id ??
      canvas?.scene?.id ??
      null,

    round:
      Number.isFinite(
        combat?.round
      )
        ? combat.round
        : null,

    turn:
      Number.isFinite(
        combat?.turn
      )
        ? combat.turn
        : null,

    speed:
      Number.isFinite(
        numericSpeed
      ) &&
      numericSpeed >= 0
        ? numericSpeed
        : null
  };
}


function syncTurnStateToCombat(
  combat = game.combat
) {
  if (
    !combat?.started ||
    !combat.combatant
  ) {
    frameHelmTurnState.clear();

    return null;
  }

  const context =
    activeCombatTurnContext(
      combat
    );

  const currentContext =
    frameHelmTurnState
      .current?.context;

  const isSameTurn =
    Boolean(
      currentContext &&
      currentContext.combatId ===
        context.combatId &&
      currentContext.combatantId ===
        context.combatantId &&
      currentContext.round ===
        context.round &&
      currentContext.turn ===
        context.turn
    );

  if (isSameTurn) {
    return (
      frameHelmTurnState.current
    );
  }

  return (
    frameHelmTurnState.beginTurn(
      context
    )
  );
}


/* ==========================================================
   Frame Helm application
   ========================================================== */

/*
 * FrameHelmApplication remains unchanged.
 *
 * Keep the complete FrameHelmApplication class from the current
 * file here exactly as-is.
 *
 * There is no sensor-domain implementation inside the class.
 */


/*
 * IMPORTANT:
 *
 * The complete existing FrameHelmApplication implementation from
 * your source remains here without alteration.
 *
 * This includes:
 *
 *   - telemetry rendering
 *   - action selection
 *   - movement controls
 *   - committed plan rendering
 *   - full/quick action selection
 *   - action execution controls
 *   - begin/reset/end turn controls
 *
 * No methods need to be removed because none of them own the
 * sensor overlay implementation.
 */


/*
 * [KEEP THE EXISTING FrameHelmApplication CLASS HERE VERBATIM]
 */


/* ==========================================================
   Frame Helm application instance
   ========================================================== */

let frameHelmApplication = null;


function getFrameHelmApplication() {
  if (!frameHelmApplication) {
    frameHelmApplication =
      new FrameHelmApplication();
  }

  return frameHelmApplication;
}


function openFrameHelm() {
  if (
    !game.settings.get(
      MODULE_ID,
      "enabled"
    )
  ) {
    ui.notifications.warn(
      `${MODULE_TITLE} is currently disabled.`
    );

    return;
  }

  getFrameHelmApplication()
    .render(true);
}


function closeFrameHelm() {
  frameHelmApplication?.close();
}


/* ==========================================================
   Settings
   ========================================================== */

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
          if (!enabled) {
            closeFrameHelm();
          }
        }
    }
  );
}


/* ==========================================================
   Scene control button
   ========================================================== */

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

  /*
   * Foundry v13 supplies Scene Controls as a keyed record.
   * Older Foundry versions supplied an array. Support both.
   */
  const tokenControls =
    Array.isArray(controls)
      ? controls.find(
          control =>
            control.name ===
            "token"
        )
      : controls?.tokens ??
        controls?.token ??
        null;

  if (!tokenControls) {
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

    if (!alreadyExists) {
      tokenControls.tools.push(
        tool
      );
    }

    return;
  }

  tokenControls.tools ??= {};

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


/* ==========================================================
   Foundry lifecycle
   ========================================================== */

Hooks.once(
  "init",
  () => {
    console.log(
      `${MODULE_TITLE} | Initializing.`
    );

    registerSettings();

    initializeActionRegistry();

    /*
     * Extracted feature domains have already been registered by
     * feature-registry.js.
     *
     * Validate their capability graph before installing their
     * Foundry hooks.
     */
    frameHelmFeatureRegistry
      .validateDependencies();

    /*
     * Install Foundry hooks declared by extracted features.
     *
     * sensors-feature.js now owns all sensor-contact hooks.
     */
    frameHelmFeatureRegistry
      .installHooks();

    installFrameHelmRuntimeStyles();
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

      get application() {
        return (
          getFrameHelmApplication()
        );
      },

      registry:
        frameHelmActionRegistry,

      /*
       * Expose the feature spine separately from the existing
       * action registry so the established public API is not
       * renamed or broken.
       */
      features:
        frameHelmFeatureRegistry,

      turn: {
        begin: context => {
          return (
            frameHelmTurnState
              .beginTurn(context)
          );
        },

        ensure: context => {
          return (
            frameHelmTurnState
              .ensureTurn(context)
          );
        },

        end: () => {
          return (
            frameHelmTurnState
              .endTurn()
          );
        },

        clear: () => {
          return (
            frameHelmTurnState
              .clear()
          );
        },

        sync: combat => {
          return (
            syncTurnStateToCombat(
              combat
            )
          );
        },

        get current() {
          return (
            frameHelmTurnState
              .current
          );
        },

        get state() {
          return (
            frameHelmTurnState
              .snapshot()
          );
        },

        canUse:
          (
            actionId,
            options
          ) => {
            return (
              frameHelmTurnState
                .ensureTurn()
                .canUseAction(
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
            const result =
              frameHelmTurnState
                .ensureTurn()
                .useAction(
                  actionId,
                  options
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          },

        move:
          distance => {
            const result =
              frameHelmTurnState
                .ensureTurn()
                .spendMovement(
                  distance
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          },

        setSpeed:
          speed => {
            const result =
              frameHelmTurnState
                .ensureTurn()
                .setSpeed(
                  speed
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          },

        overcharge:
          options => {
            const result =
              frameHelmTurnState
                .ensureTurn()
                .useOvercharge(
                  options
                );

            frameHelmTurnState
              .renderApplication();

            return result;
          }
      },

      actions: {
        get:
          id =>
            frameHelmActionRegistry
              .get(id),

        list:
          options =>
            frameHelmActionRegistry
              .list(options),

        roots:
          (
            category,
            options
          ) => {
            return (
              frameHelmActionRegistry
                .roots(
                  category,
                  options
                )
            );
          },

        childrenOf:
          (
            parentId,
            options
          ) => {
            return (
              frameHelmActionRegistry
                .childrenOf(
                  parentId,
                  options
                )
            );
          },

        categories:
          options => {
            return (
              frameHelmActionRegistry
                .listCategories(
                  options
                )
            );
          },

        register:
          action => {
            return (
              frameHelmActionRegistry
                .register(action)
            );
          }
      }
    };

    syncTurnStateToCombat(
      game.combat
    );

    console.log(
      `${MODULE_TITLE} | Ready.`
    );
  }
);


Hooks.on(
  "getSceneControlButtons",
  addFrameHelmControlButton
);


/*
 * Sensor refresh is no longer manually requested here.
 *
 * sensors-feature.js owns the controlToken sensor reaction through
 * its feature-contract hook declarations.
 */
Hooks.on(
  "controlToken",
  () => {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
);


Hooks.on(
  "deleteToken",
  () => {
    if (
      frameHelmApplication
        ?.rendered
    ) {
      frameHelmApplication.render(
        false
      );
    }
  }
);


/* ==========================================================
   Live Lancer actor synchronization
   ========================================================== */

function displayedFrameHelmToken() {
  return (
    frameHelmApplication
      ?.getControlledToken?.() ??
    null
  );
}


function frameHelmDisplaysActor(
  actor
) {
  if (
    !actor ||
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }

  const displayedActor =
    displayedFrameHelmToken()
      ?.actor ??
    null;

  if (!displayedActor) {
    return false;
  }

  return Boolean(
    displayedActor === actor ||
    (
      displayedActor.uuid &&
      actor.uuid &&
      displayedActor.uuid ===
        actor.uuid
    ) ||
    (
      displayedActor.id &&
      actor.id &&
      displayedActor.id ===
        actor.id
    )
  );
}


function refreshFrameHelmTelemetry() {
  if (
    !frameHelmApplication
      ?.rendered
  ) {
    return;
  }

  const token =
    displayedFrameHelmToken();

  frameHelmApplication
    .synchronizeTurnSpeed(
      token
    );

  frameHelmApplication.render(
    false
  );
}


Hooks.on(
  "updateActor",
  actor => {
    if (
      frameHelmDisplaysActor(
        actor
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateToken",
  tokenDocument => {
    if (
      !frameHelmApplication
        ?.rendered
    ) {
      return;
    }

    const displayedToken =
      displayedFrameHelmToken();

    const displayedTokenId =
      displayedToken?.id ??
      displayedToken
        ?.document?.id ??
      null;

    if (
      displayedTokenId ===
      tokenDocument.id
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateActorDelta",
  actorDelta => {
    if (
      !frameHelmApplication
        ?.rendered
    ) {
      return;
    }

    const displayedTokenDocument =
      displayedFrameHelmToken()
        ?.document ??
      null;

    const deltaParent =
      actorDelta?.parent ??
      null;

    if (
      displayedTokenDocument &&
      deltaParent &&
      displayedTokenDocument.id ===
        deltaParent.id
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "updateItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "createItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


Hooks.on(
  "deleteItem",
  item => {
    if (
      frameHelmDisplaysActor(
        item?.parent
      )
    ) {
      refreshFrameHelmTelemetry();
    }
  }
);


/* ==========================================================
   Combat turn synchronization
   ========================================================== */

Hooks.on(
  "combatStart",
  combat => {
    syncTurnStateToCombat(
      combat
    );
  }
);


Hooks.on(
  "updateCombat",
  (
    combat,
    changes
  ) => {
    const turnChanged =
      Object.prototype
        .hasOwnProperty.call(
          changes,
          "turn"
        );

    const roundChanged =
      Object.prototype
        .hasOwnProperty.call(
          changes,
          "round"
        );

    const activeChanged =
      Object.prototype
        .hasOwnProperty.call(
          changes,
          "active"
        );

    if (
      turnChanged ||
      roundChanged ||
      activeChanged
    ) {
      syncTurnStateToCombat(
        combat
      );
    }
  }
);


Hooks.on(
  "deleteCombat",
  combat => {
    if (
      frameHelmTurnState
        .current
        ?.context
        ?.combatId ===
      combat.id
    ) {
      frameHelmTurnState.clear();
    }
  }
);


/* ==========================================================
   Dragged token movement tracking
   ========================================================== */

function frameHelmMovementTokenMatches(
  tokenDocument,
  state =
    frameHelmTurnState.current
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


function frameHelmPoint(point) {
  if (!point) {
    return null;
  }

  const x =
    Number(point.x);

  const y =
    Number(point.y);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
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
  const points = [];

  const addPoint =
    point => {
      const normalized =
        frameHelmPoint(
          point
        );

      if (!normalized) {
        return;
      }

      const previous =
        points.at(-1);

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
      !Array.isArray(source)
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
      Number(candidate);

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
        sceneGridDistance > 0
      ) {
        return (
          distance /
          sceneGridDistance
        );
      }

      return distance;
    };

  if (
    directDistance !== null
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
    points.length < 2
  ) {
    return 0;
  }

  try {
    const measured =
      canvas?.grid
        ?.measurePath?.(
          points,
          {
            cost: true
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
      measuredDistance > 0
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

  let pixelDistance = 0;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previous =
      points[index - 1];

    const current =
      points[index];

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
    Number(distance);

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
      numeric * 100
    ) / 100
  );
}


Hooks.on(
  "moveToken",
  (
    tokenDocument,
    movement
  ) => {
    const state =
      frameHelmTurnState.current;

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

      if (
        result.excess > 0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance. The token was not stopped.`
        );
      }

      frameHelmTurnState
        .renderApplication();
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


/* ==========================================================
   Universal action execution
   ========================================================== */

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
      .has(action.id)
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
    ].includes(action.id)
  ) {
    return "basic-attack";
  }

  if (
    [
      "quick.quick-tech.invade",
      "quick.quick-tech.invade.fragment-signal"
    ].includes(action.id)
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
        ["hull", "HULL"],
        ["agi", "AGI"],
        ["sys", "SYS"],
        ["eng", "ENG"]
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
            resolve(null)
      }).render(true);
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

  if (!kind) {
    throw new Error(
      "This action does not require a dice or sheet workflow."
    );
  }

  if (
    kind === "stat"
  ) {
    return actor.beginStatFlow(
      action.metadata
        .statPath,

      action.metadata
        .statLabel ??
        action.label
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
    kind === "scan"
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

  if (!selectedStat) {
    throw new Error(
      "Mech skill selection was cancelled."
    );
  }

  return actor.beginStatFlow(
    selectedStat.path,

    `${action.label} -- ${selectedStat.label}`
  );
}


/* ==========================================================
   Elevation movement tracking
   ========================================================== */

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
      frameHelmTurnState.current;

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
      sceneDistance > 0
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

      if (
        result.excess > 0
      ) {
        ui.notifications.warn(
          `Frame Helm recorded ${result.excess} excess movement beyond the currently legal movement allowance.`
        );
      }

      frameHelmTurnState
        .renderApplication();
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


/* ==========================================================
   Extracted feature domains
   ========================================================== */

/**
 * Sensor contacts through darkness are no longer implemented
 * inside this file.
 *
 * Ownership now lives in:
 *
 *   scripts/sensors-feature.js
 *
 * sensors-feature.js is imported and canonically registered by:
 *
 *   scripts/feature-registry.js
 *
 * This runtime imports only the canonical feature registry.
 *
 * During init:
 *
 *   frameHelmFeatureRegistry.installHooks()
 *
 * installs the sensor feature's Foundry hook declarations.
 *
 * No sensor PIXI state, drawing utilities, distance calculations,
 * contact-refresh implementation, or sensor-specific Foundry hooks
 * remain duplicated in this orchestration file.
 */