const MODULE_ID = "lancer-frame-helm";
const MODULE_TITLE = "Lancer: Frame Helm";

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
});

Hooks.once("ready", () => {
  game.lancerFrameHelm = {
    open: openFrameHelm,
    close: closeFrameHelm,
    get application() {
      return getFrameHelmApplication();
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
