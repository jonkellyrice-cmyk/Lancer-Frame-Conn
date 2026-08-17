/** Canonical GM-facing Frame Conn // Mission Foundry Application. */

import { defineFrameConnFeature } from "../../scripts/feature-contract.js";
import { buildDmSitrepViewModel } from "./components/dm-sitrep-view-model.js";
import { renderDmSitrepApplication } from "./components/dm-sitrep-presentation.js";
import { activateDmSitrepListeners } from "./components/dm-sitrep-listeners.js";

const runtime = { sitrepsApi: null, foundryApi: null };
let dmApplication = null;

function configureRuntime({ sitrepsApi, foundryApi } = {}) {
  if (sitrepsApi !== undefined) runtime.sitrepsApi = sitrepsApi;
  if (foundryApi !== undefined) runtime.foundryApi = foundryApi;
  return runtimeBindings();
}

function runtimeBindings() {
  return Object.freeze({ sitreps: Boolean(runtime.sitrepsApi), foundry: Boolean(runtime.foundryApi) });
}

function assertRuntime() {
  if (!runtime.sitrepsApi || !runtime.foundryApi) {
    throw new Error("Frame Conn DM Application runtime has not been configured.");
  }
}

export class FrameConnDmApplication extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "lancer-frame-conn-dm",
      title: "Frame Conn // Mission",
      classes: ["lancer-frame-conn-dm"],
      width: 760,
      height: 720,
      resizable: true,
      minimizable: true
    });
  }

  constructor(options = {}) {
    super(options);
    this.showSetup = false;
  }

  async getData() {
    assertRuntime();
    const model = await buildDmSitrepViewModel({ sitrepsApi: runtime.sitrepsApi, foundryApi: runtime.foundryApi });
    if (!model.configured) this.showSetup = true;
    return { model };
  }

  async _renderInner(data) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderDmSitrepApplication(data.model, { showSetup: this.showSetup });
    return $(wrapper.firstElementChild);
  }

  activateListeners(html) {
    super.activateListeners(html);
    activateDmSitrepListeners(this, html, { sitrepsApi: runtime.sitrepsApi, foundryApi: runtime.foundryApi });
  }
}

export function getFrameConnDmApplication() {
  dmApplication ??= new FrameConnDmApplication();
  return dmApplication;
}

export function openFrameConnDmApplication() {
  assertRuntime();
  if (!runtime.foundryApi.isPrimaryGM?.()) {
    ui.notifications.warn("Frame Conn // Mission is available to the active GM.");
    return null;
  }
  const application = getFrameConnDmApplication();
  application.render(true);
  return application;
}

export async function closeFrameConnDmApplication() {
  return dmApplication ? dmApplication.close() : null;
}

export function renderFrameConnDmApplication(force = true) {
  return dmApplication?.rendered ? dmApplication.render(force) : null;
}

function handleCombatChange() {
  return renderFrameConnDmApplication(true);
}

function normalizeCombatTrackerRoot(html) {
  return html?.[0] ?? html ?? null;
}

function handleCombatTrackerRender(_application, html) {
  if (!game?.user?.isGM) return false;

  const root = normalizeCombatTrackerRoot(html);
  if (!root?.querySelector) return false;

  if (root.querySelector(".lancer-frame-conn-dm-open-button")) {
    return false;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "lancer-frame-conn-dm-open-button";
  button.innerHTML = '<i class="fas fa-bullseye"></i> Sitrep';
  button.addEventListener("click", event => {
    event.preventDefault();
    openFrameConnDmApplication();
  });

  const target =
    root.querySelector(".combat-tracker-header") ??
    root.querySelector("header") ??
    root;

  target.prepend(button);
  return true;
}

export const frameConnDmApplicationUiFeature = defineFrameConnFeature({
  id: "ui-dm-application",
  domain: "ui.dm",
  provides: ["ui.dm", "ui.dm.application", "ui.dm.sitrep-presentation"],
  dependsOn: ["dm.sitreps", "foundry.integration"],
  optionalDependsOn: [],
  state: {},
  commands: {
    configureRuntime,
    open: openFrameConnDmApplication,
    close: closeFrameConnDmApplication,
    render: renderFrameConnDmApplication
  },
  queries: { getApplication: getFrameConnDmApplication, runtimeBindings },
  hooks: {
    renderCombatTracker: handleCombatTrackerRender,
    updateCombat: handleCombatChange,
    createCombat: handleCombatChange,
    deleteCombat: handleCombatChange
  },
  lifecycle: {},
  api: {
    configureRuntime,
    open: openFrameConnDmApplication,
    close: closeFrameConnDmApplication,
    render: renderFrameConnDmApplication,
    getApplication: getFrameConnDmApplication,
    runtimeBindings
  },
  metadata: {
    audience: "gm",
    label: "Frame Conn // Mission",
    companionStylesheet: "styles/ui_dm/ui-dm-application.css",
    phase: "sitrep-assimilation-phase-6"
  }
});
