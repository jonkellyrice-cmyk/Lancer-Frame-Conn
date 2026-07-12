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

  getData(options = {}) {
    const controlledTokens = canvas?.tokens?.controlled ?? [];
    const selectedToken = controlledTokens[0] ?? null;

    return {
      moduleTitle: MODULE_TITLE,
      tokenName: selectedToken?.name ?? "No token selected",
      hasSelectedToken: Boolean(selectedToken)
    };
  }

  async _renderInner(data) {
    const tokenNotice = data.hasSelectedToken
      ? `<p class="frame-helm-token-name">${foundry.utils.escapeHTML(data.tokenName)}</p>`
      : `<p class="frame-helm-empty-state">Select a mech or NPC token to begin.</p>`;

    const html = `
      <section class="frame-helm-shell">
        <header class="frame-helm-header">
          <div>
            <p class="frame-helm-eyebrow">TURN ASSISTANT</p>
            <h2>${foundry.utils.escapeHTML(data.moduleTitle)}</h2>
          </div>
        </header>

        <div class="frame-helm-selected-actor">
          <span class="frame-helm-label">Controlled Unit</span>
          ${tokenNotice}
        </div>

        <div class="frame-helm-placeholder">
          <i class="fas fa-helmet-battle"></i>
          <p>The action tree will be added in the next development steps.</p>
        </div>
      </section>
    `;

    return $(html);
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
