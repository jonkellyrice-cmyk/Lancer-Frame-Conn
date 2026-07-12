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
      label: String(action.label ?? id),
      shortDescription: String(
        action.shortDescription ?? ""
      ),
      description: String(action.description ?? ""),
      category,
      parentId: action.parentId
        ? String(action.parentId)
        : null,
      cost: String(action.cost ?? "none"),
      order: Number.isFinite(action.order)
        ? action.order
        : 0,
      icon: String(action.icon ?? ""),
      tags: Object.freeze(
        Array.isArray(action.tags)
          ? [...action.tags].map(String)
          : []
      ),
      requiresTarget: Boolean(action.requiresTarget),
      targetType: action.targetType
        ? String(action.targetType)
        : null,
      duplicateKey: String(
        action.duplicateKey ?? id
      ),
      repeatRule: String(
        action.repeatRule ?? "once-per-turn"
      ),
      movementMode: action.movementMode
        ? String(action.movementMode)
        : null,
      visible: action.visible !== false,
      metadata: Object.freeze({
        ...(action.metadata ?? {})
      })
    });

    this.actions.set(id, normalizedAction);
    return normalizedAction;
  }

  registerMany(actions) {
    if (!Array.isArray(actions)) {
      throw new TypeError(
        "Frame Helm registerMany requires an array."
      );
    }

    return actions.map(action => this.register(action));
  }

  get(id) {
    return this.actions.get(String(id)) ?? null;
  }

  getCategory(id) {
    return this.categories.get(String(id)) ?? null;
  }

  has(id) {
    return this.actions.has(String(id));
  }

  listCategories({ includeHidden = false } = {}) {
    return [...this.categories.values()]
      .filter(category => includeHidden || category.visible)
      .sort((left, right) => {
        return (
          left.order - right.order ||
          left.label.localeCompare(right.label)
        );
      });
  }

  list({
    category = null,
    parentId = undefined,
    includeHidden = false
  } = {}) {
    return [...this.actions.values()]
      .filter(action => {
        if (!includeHidden && !action.visible) {
          return false;
        }

        if (category && action.category !== category) {
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
          left.label.localeCompare(right.label)
        );
      });
  }

  childrenOf(parentId, options = {}) {
    return this.list({
      ...options,
      parentId: String(parentId)
    });
  }

  roots(category = null, options = {}) {
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
      categories: this.listCategories({
        includeHidden: true
      }),
      actions: this.list({
        includeHidden: true
      })
    };
  }
}

const frameHelmActionRegistry =
  new FrameHelmActionRegistry();

function registerUniversalActionCategories() {
  frameHelmActionRegistry.registerCategory({
    id: "movement",
    label: "Movement",
    description: "Movement available to the active unit.",
    order: 10,
    icon: "fas fa-person-running"
  });

  frameHelmActionRegistry.registerCategory({
    id: "quick",
    label: "Quick Actions",
    description: "Spend one quick-action slot.",
    order: 20,
    icon: "fas fa-bolt"
  });

  frameHelmActionRegistry.registerCategory({
    id: "full",
    label: "Full Actions",
    description: "Spend the unit's full action.",
    order: 30,
    icon: "fas fa-hourglass"
  });

  frameHelmActionRegistry.registerCategory({
    id: "special",
    label: "Special Actions",
    description: "Actions outside the normal quick/full budget.",
    order: 40,
    icon: "fas fa-star"
  });

  frameHelmActionRegistry.registerCategory({
    id: "reaction",
    label: "Reactions",
    description: "Actions triggered during any character's turn.",
    order: 50,
    icon: "fas fa-reply"
  });

  frameHelmActionRegistry.registerCategory({
    id: "protocol",
    label: "Protocols",
    description: "Free actions usable only at the start of a turn.",
    order: 60,
    icon: "fas fa-microchip"
  });
}

function registerUniversalActions() {
  frameHelmActionRegistry.registerMany([
    {
      id: "movement.standard",
      label: "Standard Move",
      shortDescription: "Move up to your Speed.",
      category: "movement",
      cost: "movement",
      order: 10,
      icon: "fas fa-person-walking",
      repeatRule: "once-per-turn",
      movementMode: "standard"
    },
    {
      id: "movement.jump",
      label: "Jump",
      shortDescription: "Jump instead of making a normal standard move.",
      category: "movement",
      parentId: "movement.standard",
      cost: "movement",
      order: 20,
      icon: "fas fa-arrow-up",
      duplicateKey: "movement.standard",
      repeatRule: "once-per-turn",
      movementMode: "jump"
    },
    {
      id: "movement.climb",
      label: "Climb",
      shortDescription: "Climb at half Speed.",
      category: "movement",
      parentId: "movement.standard",
      cost: "movement",
      order: 30,
      icon: "fas fa-mountain",
      duplicateKey: "movement.standard",
      repeatRule: "once-per-turn",
      movementMode: "climb"
    },
    {
      id: "movement.fly",
      label: "Fly",
      shortDescription: "Use available flight movement.",
      category: "movement",
      parentId: "movement.standard",
      cost: "movement",
      order: 40,
      icon: "fas fa-plane-up",
      duplicateKey: "movement.standard",
      repeatRule: "once-per-turn",
      movementMode: "flight",
      metadata: {
        requiresFlightCapability: true
      }
    },
    {
      id: "movement.teleport",
      label: "Teleport",
      shortDescription: "Use an available teleport movement effect.",
      category: "movement",
      parentId: "movement.standard",
      cost: "movement",
      order: 50,
      icon: "fas fa-wand-sparkles",
      duplicateKey: "movement.standard",
      repeatRule: "once-per-turn",
      movementMode: "teleport",
      metadata: {
        requiresTeleportCapability: true
      }
    },
    {
      id: "quick.skirmish",
      label: "Skirmish",
      shortDescription: "Attack with one weapon.",
      category: "quick",
      cost: "quick",
      order: 10,
      icon: "fas fa-crosshairs",
      requiresTarget: true,
      targetType: "attack"
    },
    {
      id: "quick.boost",
      label: "Boost",
      shortDescription: "Move again, up to your Speed.",
      category: "quick",
      cost: "quick",
      order: 20,
      icon: "fas fa-forward-fast",
      movementMode: "boost"
    },
    {
      id: "quick.grapple",
      label: "Grapple",
      shortDescription: "Make a melee attack to grapple an adjacent character.",
      category: "quick",
      cost: "quick",
      order: 30,
      icon: "fas fa-hand-fist",
      requiresTarget: true,
      targetType: "adjacent-character"
    },
    {
      id: "quick.hide",
      label: "Hide",
      shortDescription: "Become Hidden when the requirements are met.",
      category: "quick",
      cost: "quick",
      order: 40,
      icon: "fas fa-user-ninja",
      metadata: {
        requiresNotEngaged: true,
        requiresCoverOrInvisibility: true
      }
    },
    {
      id: "quick.quick-tech",
      label: "Quick Tech",
      shortDescription: "Choose one available quick-tech option.",
      category: "quick",
      cost: "quick",
      order: 50,
      icon: "fas fa-satellite-dish",
      repeatRule: "different-child-per-use"
    },
    {
      id: "quick.quick-tech.bolster",
      label: "Bolster",
      shortDescription: "Give another character Accuracy on a skill check or save.",
      category: "quick",
      parentId: "quick.quick-tech",
      cost: "quick",
      order: 10,
      icon: "fas fa-shield-plus",
      requiresTarget: true,
      targetType: "character-in-sensors",
      duplicateKey: "quick.quick-tech.bolster"
    },
    {
      id: "quick.quick-tech.scan",
      label: "Scan",
      shortDescription: "Learn information about a target within Sensors.",
      category: "quick",
      parentId: "quick.quick-tech",
      cost: "quick",
      order: 20,
      icon: "fas fa-radar",
      requiresTarget: true,
      targetType: "character-or-object-in-sensors",
      duplicateKey: "quick.quick-tech.scan"
    },
    {
      id: "quick.quick-tech.lock-on",
      label: "Lock On",
      shortDescription: "Give a target the Lock On condition.",
      category: "quick",
      parentId: "quick.quick-tech",
      cost: "quick",
      order: 30,
      icon: "fas fa-bullseye",
      requiresTarget: true,
      targetType: "character-in-sensors",
      duplicateKey: "quick.quick-tech.lock-on"
    },
    {
      id: "quick.quick-tech.invade",
      label: "Invade",
      shortDescription: "Make a tech attack against a character within Sensors.",
      category: "quick",
      parentId: "quick.quick-tech",
      cost: "quick",
      order: 40,
      icon: "fas fa-virus",
      requiresTarget: true,
      targetType: "character-in-sensors",
      duplicateKey: "quick.quick-tech.invade"
    },
    {
      id: "quick.quick-tech.invade.fragment-signal",
      label: "Fragment Signal",
      shortDescription: "On a successful Invade, the target becomes Impaired and Slowed.",
      category: "quick",
      parentId: "quick.quick-tech.invade",
      cost: "quick",
      order: 10,
      icon: "fas fa-signal",
      requiresTarget: true,
      targetType: "character-in-sensors",
      duplicateKey: "quick.quick-tech.invade"
    },
    {
      id: "quick.ram",
      label: "Ram",
      shortDescription: "Knock an adjacent target Prone and optionally push it.",
      category: "quick",
      cost: "quick",
      order: 60,
      icon: "fas fa-people-arrows-left-right",
      requiresTarget: true,
      targetType: "adjacent-character"
    },
    {
      id: "quick.search",
      label: "Search",
      shortDescription: "Attempt to reveal a Hidden character within Sensors.",
      category: "quick",
      cost: "quick",
      order: 70,
      icon: "fas fa-magnifying-glass",
      requiresTarget: true,
      targetType: "suspected-hidden-character"
    },
    {
      id: "quick.prepare",
      label: "Prepare",
      shortDescription: "Prepare another quick action with a specified trigger.",
      category: "quick",
      cost: "quick",
      order: 80,
      icon: "fas fa-clock"
    },
    {
      id: "quick.shut-down",
      label: "Shut Down",
      shortDescription: "Power the mech down and enter the Shut Down state.",
      category: "quick",
      cost: "quick",
      order: 90,
      icon: "fas fa-power-off"
    },
    {
      id: "quick.self-destruct",
      label: "Self-Destruct",
      shortDescription: "Begin a delayed reactor meltdown.",
      category: "quick",
      cost: "quick",
      order: 100,
      icon: "fas fa-radiation"
    },
    {
      id: "quick.eject",
      label: "Eject",
      shortDescription: "Eject from the mech as a single-use emergency action.",
      category: "quick",
      cost: "quick",
      order: 110,
      icon: "fas fa-person-falling-burst"
    },
    {
      id: "full.barrage",
      label: "Barrage",
      shortDescription: "Attack with two weapons or one Superheavy weapon.",
      category: "full",
      cost: "full",
      order: 10,
      icon: "fas fa-gun",
      requiresTarget: true,
      targetType: "attack"
    },
    {
      id: "full.disengage",
      label: "Disengage",
      shortDescription: "Ignore engagement and movement reactions for this turn.",
      category: "full",
      cost: "full",
      order: 20,
      icon: "fas fa-person-walking-arrow-right"
    },
    {
      id: "full.full-tech",
      label: "Full Tech",
      shortDescription: "Take two Quick Tech options or one Full Tech option.",
      category: "full",
      cost: "full",
      order: 30,
      icon: "fas fa-laptop-code",
      repeatRule: "full-tech-selection"
    },
    {
      id: "full.improvised-attack",
      label: "Improvised Attack",
      shortDescription: "Make an improvised melee attack against an adjacent target.",
      category: "full",
      cost: "full",
      order: 40,
      icon: "fas fa-hammer",
      requiresTarget: true,
      targetType: "adjacent-character"
    },
    {
      id: "full.stabilize",
      label: "Stabilize",
      shortDescription: "Clear heat or restore HP, then perform one additional stabilization option.",
      category: "full",
      cost: "full",
      order: 50,
      icon: "fas fa-screwdriver-wrench"
    },
    {
      id: "full.boot-up",
      label: "Boot Up",
      shortDescription: "Clear Shut Down and restore the mech to a powered state.",
      category: "full",
      cost: "full",
      order: 60,
      icon: "fas fa-toggle-on"
    },
    {
      id: "full.skill-check",
      label: "Skill Check",
      shortDescription: "Attempt a complex activity not covered by another action.",
      category: "full",
      cost: "full",
      order: 70,
      icon: "fas fa-dice-d20"
    },
    {
      id: "full.mount-dismount",
      label: "Mount or Dismount",
      shortDescription: "Mount or dismount a mech or willing vehicle.",
      category: "full",
      cost: "full",
      order: 80,
      icon: "fas fa-person-arrow-up-from-line"
    },
    {
      id: "special.overcharge",
      label: "Overcharge",
      shortDescription: "Take Heat to gain one additional quick action as a free action.",
      category: "special",
      cost: "overcharge",
      order: 10,
      icon: "fas fa-temperature-high",
      repeatRule: "once-per-turn",
      metadata: {
        grantsQuickAction: true,
        permitsDuplicateAction: true
      }
    },
    {
      id: "special.end-turn",
      label: "End Turn",
      shortDescription: "Declare that the active unit has finished its turn.",
      category: "special",
      cost: "none",
      order: 1000,
      icon: "fas fa-flag-checkered",
      repeatRule: "unrestricted"
    },
    {
      id: "reaction.brace",
      label: "Brace",
      shortDescription: "Gain Resistance to the triggering attack and hinder later attacks.",
      category: "reaction",
      cost: "reaction",
      order: 10,
      icon: "fas fa-shield-halved",
      repeatRule: "once-per-round"
    },
    {
      id: "reaction.overwatch",
      label: "Overwatch",
      shortDescription: "Skirmish when a hostile character begins movement within Threat.",
      category: "reaction",
      cost: "reaction",
      order: 20,
      icon: "fas fa-eye",
      requiresTarget: true,
      targetType: "hostile-in-threat",
      repeatRule: "once-per-round"
    }
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
      combatId: context.combatId ?? null,
      combatantId: context.combatantId ?? null,
      tokenId: context.tokenId ?? null,
      actorId: context.actorId ?? null,
      sceneId: context.sceneId ?? null,
      round: Number.isFinite(context.round)
        ? context.round
        : null,
      turn: Number.isFinite(context.turn)
        ? context.turn
        : null
    };

    const speed = Number(context.speed);

    this.speed = Number.isFinite(speed) && speed >= 0
      ? speed
      : null;

    this.movement = {
      maximum: this.speed,
      spent: 0,
      remaining: this.speed,
      completed: false
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
    const numericSpeed = Number(speed);

    if (!Number.isFinite(numericSpeed) || numericSpeed < 0) {
      throw new TypeError(
        "Frame Helm speed must be a non-negative number."
      );
    }

    const previousMaximum = this.movement.maximum;
    const previousSpent = this.movement.spent;

    this.speed = numericSpeed;
    this.movement.maximum = numericSpeed;
    this.movement.spent = Math.min(
      previousSpent,
      numericSpeed
    );
    this.movement.remaining = Math.max(
      0,
      numericSpeed - this.movement.spent
    );

    if (previousMaximum === null) {
      this.recordHistory("set-speed", {
        speed: numericSpeed
      });
    }

    return this.movement.remaining;
  }

  spendMovement(distance) {
    this.assertTurnActive();

    const numericDistance = Number(distance);

    if (
      !Number.isFinite(numericDistance) ||
      numericDistance < 0
    ) {
      throw new TypeError(
        "Movement distance must be a non-negative number."
      );
    }

    if (this.movement.maximum === null) {
      throw new Error(
        "Movement speed has not been assigned to this turn."
      );
    }

    if (numericDistance > this.movement.remaining) {
      throw new Error(
        `Only ${this.movement.remaining} movement remains.`
      );
    }

    this.movement.spent += numericDistance;
    this.movement.remaining -= numericDistance;

    if (this.movement.remaining === 0) {
      this.movement.completed = true;
    }

    this.closeProtocolWindow();

    this.recordHistory("spend-movement", {
      distance: numericDistance
    });

    return this.movement.remaining;
  }

  completeMovement() {
    this.assertTurnActive();
    this.movement.completed = true;

    this.recordHistory("complete-movement", {
      remaining: this.movement.remaining
    });
  }

  reopenMovement() {
    this.assertTurnActive();
    this.movement.completed = false;

    this.recordHistory("reopen-movement", {
      remaining: this.movement.remaining
    });
  }

  closeProtocolWindow() {
    if (!this.protocol.startOfTurnOpen) return;

    this.protocol.startOfTurnOpen = false;

    if (!this.protocol.used) {
      this.protocol.available = false;
    }
  }

  useProtocol(actionId = null) {
    this.assertTurnActive();

    if (!this.protocol.startOfTurnOpen) {
      throw new Error(
        "Protocols can only be activated at the start of a turn."
      );
    }

    if (this.protocol.used) {
      throw new Error(
        "A protocol has already been used this turn."
      );
    }

    this.protocol.used = true;
    this.protocol.available = false;

    this.recordHistory("use-protocol", {
      actionId
    });
  }

  overchargeHeatFormula(overchargeCount = 0) {
    if (overchargeCount <= 0) return "1";
    if (overchargeCount === 1) return "1d3";
    if (overchargeCount === 2) return "1d6";
    return "1d6+4";
  }

  useOvercharge({ previousOvercharges = 0 } = {}) {
    this.assertTurnActive();

    if (this.overcharge.used) {
      throw new Error(
        "This unit has already Overcharged this turn."
      );
    }

    this.overcharge.used = true;
    this.overcharge.quickActionRemaining = 1;
    this.overcharge.heatFormula =
      this.overchargeHeatFormula(previousOvercharges);

    this.closeProtocolWindow();

    this.recordHistory("overcharge", {
      heatFormula: this.overcharge.heatFormula,
      previousOvercharges
    });

    return this.overcharge.heatFormula;
  }

  actionDuplicateKey(action) {
    return String(
      action?.duplicateKey ?? action?.id ?? ""
    );
  }

  hasUsedDuplicateKey(duplicateKey) {
    return this.usedDuplicateKeys.includes(
      String(duplicateKey)
    );
  }

  canUseAction(
    actionOrId,
    {
      useOvercharge = false,
      ignoreDuplicate = false
    } = {}
  ) {
    const action = typeof actionOrId === "string"
      ? frameHelmActionRegistry.get(actionOrId)
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
        reason: "The turn has already ended."
      };
    }

    if (action.id === "special.end-turn") {
      return {
        allowed: true,
        reason: null
      };
    }

    if (action.cost === "movement") {
      if (this.movement.completed) {
        return {
          allowed: false,
          reason: "Movement has been marked complete."
        };
      }

      if (this.movement.remaining === 0) {
        return {
          allowed: false,
          reason: "No standard movement remains."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (action.cost === "overcharge") {
      if (this.overcharge.used) {
        return {
          allowed: false,
          reason: "Overcharge has already been used this turn."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (action.cost === "full") {
      if (!this.fullActionAvailable) {
        return {
          allowed: false,
          reason: "The normal action budget has already been spent."
        };
      }

      if (this.actionMode === "quick") {
        return {
          allowed: false,
          reason: "A quick action has already been taken."
        };
      }

      return {
        allowed: true,
        reason: null
      };
    }

    if (action.cost === "quick") {
      const duplicateKey = this.actionDuplicateKey(action);
      const duplicateUsed =
        this.hasUsedDuplicateKey(duplicateKey);

      if (useOvercharge) {
        if (!this.overcharge.used) {
          return {
            allowed: false,
            reason: "Overcharge has not been activated."
          };
        }

        if (this.overcharge.quickActionRemaining < 1) {
          return {
            allowed: false,
            reason: "The Overcharge quick action has been spent."
          };
        }

        return {
          allowed: true,
          reason: null,
          source: "overcharge"
        };
      }

      if (this.actionMode === "full") {
        return {
          allowed: false,
          reason: "A full action has already been taken."
        };
      }

      if (this.quickActionsRemaining < 1) {
        return {
          allowed: false,
          reason: "No normal quick actions remain."
        };
      }

      if (
        duplicateUsed &&
        !ignoreDuplicate &&
        action.repeatRule !== "unrestricted"
      ) {
        return {
          allowed: false,
          reason: "This action has already been taken this turn. Use Overcharge to repeat it."
        };
      }

      return {
        allowed: true,
        reason: null,
        source: "normal"
      };
    }

    if (action.cost === "reaction") {
      if (this.reaction.usedThisTurn) {
        return {
          allowed: false,
          reason: "A reaction has already been used during this turn."
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
    const action = typeof actionOrId === "string"
      ? frameHelmActionRegistry.get(actionOrId)
      : actionOrId;

    const permission = this.canUseAction(action, {
      useOvercharge,
      ignoreDuplicate
    });

    if (!permission.allowed) {
      throw new Error(permission.reason);
    }

    if (action.id === "special.end-turn") {
      this.endTurn();
      return this.snapshot();
    }

    if (action.cost === "overcharge") {
      this.useOvercharge(metadata);
      return this.snapshot();
    }

    if (action.cost === "quick") {
      if (useOvercharge) {
        this.overcharge.quickActionRemaining -= 1;
      } else {
        this.actionMode = "quick";
        this.quickActionsRemaining -= 1;
        this.fullActionAvailable = false;
      }
    }

    if (action.cost === "full") {
      this.actionMode = "full";
      this.fullActionAvailable = false;
      this.quickActionsRemaining = 0;
    }

    if (action.cost === "reaction") {
      this.reaction.usedThisTurn = true;
      this.reaction.actionId = action.id;
    }

    if (action.cost !== "none") {
      this.closeProtocolWindow();
    }

    const duplicateKey = this.actionDuplicateKey(action);

    this.usedActions.push({
      actionId: action.id,
      duplicateKey,
      source: useOvercharge
        ? "overcharge"
        : "normal",
      timestamp: Date.now(),
      metadata: {
        ...metadata
      }
    });

    if (
      duplicateKey &&
      !this.usedDuplicateKeys.includes(duplicateKey)
    ) {
      this.usedDuplicateKeys.push(duplicateKey);
    }

    this.recordHistory("use-action", {
      actionId: action.id,
      duplicateKey,
      source: useOvercharge
        ? "overcharge"
        : "normal"
    });

    return this.snapshot();
  }

  markReactionAvailable() {
    this.reaction.usedThisTurn = false;
    this.reaction.actionId = null;
  }

  endTurn() {
    if (this.ended) return;

    this.ended = true;
    this.endedAt = Date.now();
    this.protocol.available = false;
    this.protocol.startOfTurnOpen = false;

    this.recordHistory("end-turn", {});
  }

  assertTurnActive() {
    if (this.ended) {
      throw new Error(
        "The current Frame Helm turn has ended."
      );
    }
  }

  recordHistory(type, data = {}) {
    this.history.push({
      type,
      timestamp: Date.now(),
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
      speed: this.speed,
      movement: {
        ...this.movement
      },
      actionMode: this.actionMode,
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
      usedActions: this.usedActions.map(entry => ({
        ...entry,
        metadata: {
          ...entry.metadata
        }
      })),
      usedDuplicateKeys: [
        ...this.usedDuplicateKeys
      ],
      ended: this.ended,
      startedAt: this.startedAt,
      endedAt: this.endedAt
    };
  }
}

class FrameHelmTurnStateManager {
  constructor() {
    this.current = null;
  }

  beginTurn(context = {}) {
    this.current = new FrameHelmTurnState(context);

    console.log(
      `${MODULE_TITLE} | Began turn state.`,
      this.current.snapshot()
    );

    this.renderApplication();
    return this.current;
  }

  ensureTurn(context = {}) {
    if (!this.current || this.current.ended) {
      return this.beginTurn(context);
    }

    return this.current;
  }

  endTurn() {
    if (!this.current) return null;

    this.current.endTurn();
    this.renderApplication();
    return this.current.snapshot();
  }

  clear() {
    this.current = null;
    this.renderApplication();
  }

  snapshot() {
    return this.current?.snapshot() ?? null;
  }

  renderApplication() {
    if (frameHelmApplication?.rendered) {
      frameHelmApplication.render(false);
    }
  }
}

const frameHelmTurnState =
  new FrameHelmTurnStateManager();

function activeCombatTurnContext(combat = game.combat) {
  const combatant = combat?.combatant ?? null;
  const tokenDocument = combatant?.token ?? null;
  const actor = combatant?.actor ?? null;

  return {
    combatId: combat?.id ?? null,
    combatantId: combatant?.id ?? null,
    tokenId: tokenDocument?.id ?? null,
    actorId: actor?.id ?? null,
    sceneId:
      combat?.scene?.id ??
      canvas?.scene?.id ??
      null,
    round: Number.isFinite(combat?.round)
      ? combat.round
      : null,
    turn: Number.isFinite(combat?.turn)
      ? combat.turn
      : null,
    speed: null
  };
}

function syncTurnStateToCombat(combat = game.combat) {
  if (!combat?.started || !combat.combatant) {
    frameHelmTurnState.clear();
    return null;
  }

  const context = activeCombatTurnContext(combat);
  const currentContext =
    frameHelmTurnState.current?.context;

  const isSameTurn = Boolean(
    currentContext &&
    currentContext.combatId === context.combatId &&
    currentContext.combatantId === context.combatantId &&
    currentContext.round === context.round &&
    currentContext.turn === context.turn
  );

  if (isSameTurn) {
    return frameHelmTurnState.current;
  }

  return frameHelmTurnState.beginTurn(context);
}

/* ==========================================================
   Frame Helm application
   ========================================================== */

class FrameHelmApplication extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "lancer-frame-helm",
      title: MODULE_TITLE,
      classes: ["lancer-frame-helm"],
      width: 420,
      height: "auto",
      resizable: true,
      minimizable: true
    });
  }

  constructor(options = {}) {
    super(options);
    this.selectedCategory = null;
  }

  getControlledToken() {
    const controlledTokens =
      canvas?.tokens?.controlled ?? [];

    if (controlledTokens.length > 0) {
      return controlledTokens[0];
    }

    const combatantToken =
      game.combat?.combatant?.token?.object ?? null;

    return combatantToken;
  }

  getTurnStateForDisplay() {
    return frameHelmTurnState.current?.snapshot() ?? null;
  }

  actionAvailability(action, turnState) {
    if (!turnState) {
      return {
        allowed: false,
        reason: "Begin a turn plan first."
      };
    }

    return frameHelmTurnState.current.canUseAction(action);
  }

  actionViewModel(action, turnState) {
    const availability = this.actionAvailability(
      action,
      turnState
    );

    return {
      ...action,
      allowed: availability.allowed,
      unavailableReason:
        availability.reason ?? ""
    };
  }

  categoryViewModel(category, turnState) {
    const actions = frameHelmActionRegistry.roots(
      category.id
    );

    const actionModels = actions.map(action => {
      return this.actionViewModel(action, turnState);
    });

    return {
      ...category,
      actions: actionModels,
      hasActions: actionModels.length > 0,
      hasAvailableAction: actionModels.some(
        action => action.allowed
      )
    };
  }

  getData(options = {}) {
    const selectedToken = this.getControlledToken();
    const turnState = this.getTurnStateForDisplay();

    const allCategories =
      frameHelmActionRegistry.listCategories();

    const visibleCategoryIds = [
      "movement",
      "quick",
      "full",
      "special",
      "protocol",
      "reaction"
    ];

    const categories = allCategories
      .filter(category => {
        return visibleCategoryIds.includes(category.id);
      })
      .map(category => {
        return this.categoryViewModel(
          category,
          turnState
        );
      });

    const selectedCategory = categories.find(
      category => category.id === this.selectedCategory
    ) ?? null;

    return {
      moduleTitle: MODULE_TITLE,
      tokenName:
        selectedToken?.name ??
        selectedToken?.document?.name ??
        "No token selected",
      tokenImage:
        selectedToken?.document?.texture?.src ??
        selectedToken?.actor?.img ??
        null,
      hasSelectedToken: Boolean(selectedToken),
      hasTurnState: Boolean(turnState),
      turnState,
      categories,
      selectedCategory
    };
  }

  renderBudgetPanel(data) {
    if (!data.hasTurnState) {
      return `
        <section class="frame-helm-budget frame-helm-budget-empty">
          <div class="frame-helm-budget-message">
            <i class="fas fa-circle-play"></i>
            <div>
              <strong>No turn plan is active.</strong>
              <p>Begin a plan to track movement, actions, and Overcharge.</p>
            </div>
          </div>

          <button
            type="button"
            class="frame-helm-primary-button"
            data-frame-helm-command="begin-turn"
            ${data.hasSelectedToken ? "" : "disabled"}
          >
            <i class="fas fa-play"></i>
            Begin Turn Plan
          </button>
        </section>
      `;
    }

    const state = data.turnState;

    const movementValue = state.movement.maximum === null
      ? "Unrated"
      : `${state.movement.remaining} / ${state.movement.maximum}`;

    const normalActionLabel = state.actionMode === "full"
      ? "Full action used"
      : state.actionMode === "quick"
        ? `${state.quickActionsRemaining} quick remaining`
        : "2 quick or 1 full";

    const overchargeLabel = state.overcharge.used
      ? state.overcharge.quickActionRemaining > 0
        ? "Quick action ready"
        : "Used"
      : "Available";

    return `
      <section class="frame-helm-budget">
        <div class="frame-helm-budget-grid">
          <div class="frame-helm-budget-item">
            <span>Movement</span>
            <strong>${foundry.utils.escapeHTML(movementValue)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Actions</span>
            <strong>${foundry.utils.escapeHTML(normalActionLabel)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Overcharge</span>
            <strong>${foundry.utils.escapeHTML(overchargeLabel)}</strong>
          </div>

          <div class="frame-helm-budget-item">
            <span>Protocol Window</span>
            <strong>
              ${state.protocol.startOfTurnOpen ? "Open" : "Closed"}
            </strong>
          </div>
        </div>

        <div class="frame-helm-budget-controls">
          <button
            type="button"
            class="frame-helm-secondary-button"
            data-frame-helm-command="reset-turn"
          >
            <i class="fas fa-rotate-left"></i>
            Reset Plan
          </button>

          <button
            type="button"
            class="frame-helm-end-turn-button"
            data-frame-helm-command="end-turn"
          >
            <i class="fas fa-flag-checkered"></i>
            End Turn
          </button>
        </div>
      </section>
    `;
  }

  renderUnitPanel(data) {
    const portrait = data.tokenImage
      ? `
        <img
          class="frame-helm-unit-image"
          src="${foundry.utils.escapeHTML(data.tokenImage)}"
          alt=""
        >
      `
      : `
        <div class="frame-helm-unit-image frame-helm-unit-image-empty">
          <i class="fas fa-robot"></i>
        </div>
      `;

    const unitText = data.hasSelectedToken
      ? `
        <div class="frame-helm-unit-text">
          <span class="frame-helm-label">Controlled Unit</span>
          <strong>${foundry.utils.escapeHTML(data.tokenName)}</strong>
        </div>
      `
      : `
        <div class="frame-helm-unit-text">
          <span class="frame-helm-label">Controlled Unit</span>
          <strong>No token selected</strong>
          <small>Select a mech or NPC token on the canvas.</small>
        </div>
      `;

    return `
      <section class="frame-helm-unit-panel">
        ${portrait}
        ${unitText}
      </section>
    `;
  }

  renderCategoryMenu(data) {
    const buttons = data.categories.map(category => {
      const unavailableClass =
        data.hasTurnState && !category.hasAvailableAction
          ? " frame-helm-category-unavailable"
          : "";

      return `
        <button
          type="button"
          class="frame-helm-category-button${unavailableClass}"
          data-frame-helm-category="${foundry.utils.escapeHTML(category.id)}"
        >
          <i class="${foundry.utils.escapeHTML(category.icon)}"></i>

          <span class="frame-helm-category-copy">
            <strong>${foundry.utils.escapeHTML(category.label)}</strong>
            <small>${foundry.utils.escapeHTML(category.description)}</small>
          </span>

          <i class="fas fa-chevron-right frame-helm-category-arrow"></i>
        </button>
      `;
    }).join("");

    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading">
          <span>Choose an action type</span>
        </div>

        <div class="frame-helm-category-list">
          ${buttons}
        </div>
      </section>
    `;
  }

  renderActionList(data) {
    const category = data.selectedCategory;

    if (!category) {
      return this.renderCategoryMenu(data);
    }

    const actionButtons = category.actions.map(action => {
      const disabledAttribute = action.allowed
        ? ""
        : "disabled";

      const unavailableText = action.allowed
        ? ""
        : `
          <span class="frame-helm-action-reason">
            ${foundry.utils.escapeHTML(action.unavailableReason)}
          </span>
        `;

      return `
        <button
          type="button"
          class="frame-helm-action-button"
          data-frame-helm-action="${foundry.utils.escapeHTML(action.id)}"
          ${disabledAttribute}
        >
          <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

          <span class="frame-helm-action-copy">
            <strong>${foundry.utils.escapeHTML(action.label)}</strong>
            <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
            ${unavailableText}
          </span>
        </button>
      `;
    }).join("");

    const emptyMessage = category.hasActions
      ? ""
      : `
        <div class="frame-helm-no-actions">
          <i class="fas fa-circle-info"></i>
          <p>No universal actions are registered in this category yet.</p>
        </div>
      `;

    return `
      <section class="frame-helm-action-panel">
        <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
          <button
            type="button"
            class="frame-helm-back-button"
            data-frame-helm-command="back"
            aria-label="Back to action categories"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>${foundry.utils.escapeHTML(category.label)}</span>
            <small>${foundry.utils.escapeHTML(category.description)}</small>
          </div>
        </div>

        <div class="frame-helm-action-list">
          ${actionButtons}
          ${emptyMessage}
        </div>
      </section>
    `;
  }

  async _renderInner(data) {
    const html = `
      <section class="frame-helm-shell">
        <header class="frame-helm-header">
          <div>
            <p class="frame-helm-eyebrow">TURN ASSISTANT</p>
            <h2>${foundry.utils.escapeHTML(data.moduleTitle)}</h2>
          </div>

          <span
            class="frame-helm-window-hint"
            title="Drag this window by its Foundry title bar. Use the title-bar control to minimize it."
          >
            <i class="fas fa-up-down-left-right"></i>
          </span>
        </header>

        ${this.renderUnitPanel(data)}
        ${this.renderBudgetPanel(data)}
        ${this.renderActionList(data)}
      </section>
    `;

    return $(html);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-frame-helm-category]").on(
      "click",
      event => {
        this.selectedCategory =
          event.currentTarget.dataset.frameHelmCategory ?? null;

        this.render(false);
      }
    );

    html.find("[data-frame-helm-action]").on(
      "click",
      event => {
        const actionId =
          event.currentTarget.dataset.frameHelmAction;

        this.onActionSelected(actionId);
      }
    );

    html.find("[data-frame-helm-command]").on(
      "click",
      event => {
        const command =
          event.currentTarget.dataset.frameHelmCommand;

        this.onCommand(command);
      }
    );
  }

  beginTurnPlan() {
    const token = this.getControlledToken();

    if (!token) {
      ui.notifications.warn(
        "Select a mech or NPC token first."
      );
      return;
    }

    const combat = game.combat;
    const combatContext = combat?.started
      ? activeCombatTurnContext(combat)
      : {};

    frameHelmTurnState.beginTurn({
      ...combatContext,
      tokenId:
        token.id ??
        token.document?.id ??
        combatContext.tokenId ??
        null,
      actorId:
        token.actor?.id ??
        combatContext.actorId ??
        null,
      sceneId:
        canvas?.scene?.id ??
        combatContext.sceneId ??
        null,
      speed: null
    });

    this.selectedCategory = null;
    this.render(false);
  }

  resetTurnPlan() {
    const token = this.getControlledToken();
    const previousState = frameHelmTurnState.current;

    frameHelmTurnState.beginTurn({
      ...(previousState?.context ?? {}),
      tokenId:
        token?.id ??
        token?.document?.id ??
        previousState?.context?.tokenId ??
        null,
      actorId:
        token?.actor?.id ??
        previousState?.context?.actorId ??
        null,
      sceneId:
        canvas?.scene?.id ??
        previousState?.context?.sceneId ??
        null,
      speed: previousState?.speed ?? null
    });

    this.selectedCategory = null;
    this.render(false);

    ui.notifications.info(
      "Frame Helm turn plan reset."
    );
  }

  onCommand(command) {
    if (command === "back") {
      this.selectedCategory = null;
      this.render(false);
      return;
    }

    if (command === "begin-turn") {
      this.beginTurnPlan();
      return;
    }

    if (command === "reset-turn") {
      this.resetTurnPlan();
      return;
    }

    if (command === "end-turn") {
      frameHelmTurnState.endTurn();
      this.selectedCategory = null;
      this.render(false);

      ui.notifications.info(
        "Frame Helm turn plan ended."
      );
    }
  }

  onActionSelected(actionId) {
    const action = frameHelmActionRegistry.get(actionId);

    if (!action) {
      ui.notifications.error(
        `Unknown Frame Helm action: ${actionId}`
      );
      return;
    }

    if (action.id === "special.end-turn") {
      this.onCommand("end-turn");
      return;
    }

    if (action.id === "special.overcharge") {
      try {
        const heatFormula =
          frameHelmTurnState.current.useOvercharge();

        this.render(false);

        ui.notifications.info(
          `Overcharge selected. Apply ${heatFormula} Heat. One additional quick action is available.`
        );
      } catch (error) {
        ui.notifications.warn(error.message);
      }

      return;
    }

    ui.notifications.info(
      `${action.label} selected. Its guided workflow will be added in the next development steps.`
    );
  }
}

let frameHelmApplication = null;

function getFrameHelmApplication() {
  if (!frameHelmApplication) {
    frameHelmApplication = new FrameHelmApplication();
  }

  return frameHelmApplication;
}

function openFrameHelm() {
  if (!game.settings.get(MODULE_ID, "enabled")) {
    ui.notifications.warn(`${MODULE_TITLE} is currently disabled.`);
    return;
  }

  getFrameHelmApplication().render(true);
}

function closeFrameHelm() {
  frameHelmApplication?.close();
}

/* ==========================================================
   Settings
   ========================================================== */

function registerSettings() {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Enable Frame Helm",
    hint: "Enables the Frame Helm action-selection interface.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true,
    onChange: enabled => {
      if (!enabled) {
        closeFrameHelm();
      }
    }
  });
}

/* ==========================================================
   Scene control button
   ========================================================== */

function addFrameHelmControlButton(controls) {
  if (!game.settings.get(MODULE_ID, "enabled")) return;

  const tokenControls = controls.find(
    control => control.name === "token"
  );

  if (!tokenControls) return;

  const alreadyExists = tokenControls.tools.some(
    tool => tool.name === "lancer-frame-helm"
  );

  if (alreadyExists) return;

  tokenControls.tools.push({
    name: "lancer-frame-helm",
    title: MODULE_TITLE,
    icon: "fas fa-helmet-battle",
    button: true,
    visible: true,
    onClick: openFrameHelm
  });
}

/* ==========================================================
   Foundry lifecycle
   ========================================================== */

Hooks.once("init", () => {
  console.log(`${MODULE_TITLE} | Initializing.`);
  registerSettings();
  initializeActionRegistry();
});

Hooks.once("ready", () => {
  game.lancerFrameHelm = {
    open: openFrameHelm,
    close: closeFrameHelm,
    get application() {
      return getFrameHelmApplication();
    },
    registry: frameHelmActionRegistry,
    turn: {
      begin: context => {
        return frameHelmTurnState.beginTurn(context);
      },
      ensure: context => {
        return frameHelmTurnState.ensureTurn(context);
      },
      end: () => {
        return frameHelmTurnState.endTurn();
      },
      clear: () => {
        return frameHelmTurnState.clear();
      },
      sync: combat => {
        return syncTurnStateToCombat(combat);
      },
      get current() {
        return frameHelmTurnState.current;
      },
      get state() {
        return frameHelmTurnState.snapshot();
      },
      canUse: (actionId, options) => {
        return frameHelmTurnState
          .ensureTurn()
          .canUseAction(actionId, options);
      },
      use: (actionId, options) => {
        const result = frameHelmTurnState
          .ensureTurn()
          .useAction(actionId, options);

        frameHelmTurnState.renderApplication();
        return result;
      },
      move: distance => {
        const result = frameHelmTurnState
          .ensureTurn()
          .spendMovement(distance);

        frameHelmTurnState.renderApplication();
        return result;
      },
      setSpeed: speed => {
        const result = frameHelmTurnState
          .ensureTurn()
          .setSpeed(speed);

        frameHelmTurnState.renderApplication();
        return result;
      },
      overcharge: options => {
        const result = frameHelmTurnState
          .ensureTurn()
          .useOvercharge(options);

        frameHelmTurnState.renderApplication();
        return result;
      }
    },
    actions: {
      get: id => frameHelmActionRegistry.get(id),
      list: options => frameHelmActionRegistry.list(options),
      roots: (category, options) => {
        return frameHelmActionRegistry.roots(
          category,
          options
        );
      },
      childrenOf: (parentId, options) => {
        return frameHelmActionRegistry.childrenOf(
          parentId,
          options
        );
      },
      categories: options => {
        return frameHelmActionRegistry.listCategories(
          options
        );
      },
      register: action => {
        return frameHelmActionRegistry.register(action);
      }
    }
  };

  syncTurnStateToCombat(game.combat);

  console.log(`${MODULE_TITLE} | Ready.`);
});

Hooks.on(
  "getSceneControlButtons",
  addFrameHelmControlButton
);

Hooks.on("controlToken", () => {
  if (frameHelmApplication?.rendered) {
    frameHelmApplication.render(false);
  }
});

Hooks.on("deleteToken", () => {
  if (frameHelmApplication?.rendered) {
    frameHelmApplication.render(false);
  }
});

/* ==========================================================
   Combat turn synchronization
   ========================================================== */

Hooks.on("combatStart", combat => {
  syncTurnStateToCombat(combat);
});

Hooks.on("updateCombat", (combat, changes) => {
  const turnChanged =
    Object.prototype.hasOwnProperty.call(
      changes,
      "turn"
    );

  const roundChanged =
    Object.prototype.hasOwnProperty.call(
      changes,
      "round"
    );

  const activeChanged =
    Object.prototype.hasOwnProperty.call(
      changes,
      "active"
    );

  if (turnChanged || roundChanged || activeChanged) {
    syncTurnStateToCombat(combat);
  }
});

Hooks.on("deleteCombat", combat => {
  if (
    frameHelmTurnState.current?.context?.combatId ===
    combat.id
  ) {
    frameHelmTurnState.clear();
  }
});
