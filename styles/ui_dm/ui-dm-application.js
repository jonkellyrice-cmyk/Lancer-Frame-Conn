/** Canonical GM-facing Frame Conn // Mission panel embedded in Foundry's Combat Tracker. */

import { defineFrameConnFeature } from "../../scripts/feature-contract.js";
import { buildDmSitrepViewModel } from "./components/dm-sitrep-view-model.js";
import { renderDmSitrepApplication } from "./components/dm-sitrep-presentation.js";
import { activateDmSitrepListeners } from "./components/dm-sitrep-listeners.js";

const runtime = { sitrepsApi: null, foundryApi: null };
let combatTrackerRoot = null;
let embeddedPanelVisible = false;

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
    throw new Error("Frame Conn DM panel runtime has not been configured.");
  }
}

function normalizeCombatTrackerRoot(html) {
  return html?.[0] ?? html ?? null;
}

const embeddedPanelController = {
  showSetup: false,

  get element() {
    const panel = combatTrackerRoot?.querySelector?.(".lancer-frame-conn-dm-embedded") ?? null;
    return panel ? [panel] : [];
  },

  async render() {
    if (!combatTrackerRoot || !embeddedPanelVisible) return null;
    return renderEmbeddedMissionPanel(combatTrackerRoot);
  }
};

function findEmbeddedPanelHost(root) {
  return root ?? null;
}

async function renderEmbeddedMissionPanel(root = combatTrackerRoot) {
  assertRuntime();
  if (!root?.querySelector) return null;

  combatTrackerRoot = root;
  root.classList?.toggle("lancer-frame-conn-dm-host", embeddedPanelVisible);

  root.querySelector(".lancer-frame-conn-dm-embedded")?.remove();
  if (!embeddedPanelVisible) return null;

  const model = await buildDmSitrepViewModel({
    sitrepsApi: runtime.sitrepsApi,
    foundryApi: runtime.foundryApi
  });

  if (!model.configured) embeddedPanelController.showSetup = true;

  const panel = document.createElement("section");
  panel.className = "lancer-frame-conn-dm-embedded";
  panel.dataset.frameConnSitrepPanel = "true";
  panel.innerHTML = renderDmSitrepApplication(model, {
    showSetup: embeddedPanelController.showSetup
  });

  const host = findEmbeddedPanelHost(root);
  host?.appendChild(panel);

  activateDmSitrepListeners(embeddedPanelController, panel, {
    sitrepsApi: runtime.sitrepsApi,
    foundryApi: runtime.foundryApi
  });

  return panel;
}

export function getFrameConnDmApplication() {
  return embeddedPanelController;
}

export async function openFrameConnDmApplication() {
  assertRuntime();
  embeddedPanelVisible = true;
  if (combatTrackerRoot) await renderEmbeddedMissionPanel(combatTrackerRoot);
  return embeddedPanelController;
}

export async function closeFrameConnDmApplication() {
  embeddedPanelVisible = false;
  combatTrackerRoot?.classList?.remove("lancer-frame-conn-dm-host");
  combatTrackerRoot?.querySelector?.(".lancer-frame-conn-dm-embedded")?.remove();
  return null;
}

export function renderFrameConnDmApplication() {
  return embeddedPanelVisible && combatTrackerRoot
    ? renderEmbeddedMissionPanel(combatTrackerRoot)
    : null;
}

function handleCombatChange() {
  return renderFrameConnDmApplication();
}

const SPATIAL_TOKEN_CHANGE_KEYS = Object.freeze(["x", "y", "elevation", "width", "height"]);

function tokenSpatialStateChanged(changes = {}) {
  return SPATIAL_TOKEN_CHANGE_KEYS.some(key => Object.prototype.hasOwnProperty.call(changes ?? {}, key));
}

function handleTokenSpatialUpdate(_tokenDocument, changes = {}) {
  if (!tokenSpatialStateChanged(changes)) return null;
  return renderFrameConnDmApplication();
}

function handleSpatialDocumentChange() {
  return renderFrameConnDmApplication();
}

async function handleCombatTrackerRender(_application, html) {
  const root = normalizeCombatTrackerRoot(html);
  if (!root?.querySelector) return false;
  combatTrackerRoot = root;

  let button = root.querySelector(".lancer-frame-conn-dm-open-button");

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "lancer-frame-conn-dm-open-button";
    button.innerHTML = '<i class="fas fa-bullseye"></i> Sitrep';

    const target =
      root.querySelector(".combat-tracker-header") ??
      root.querySelector("header") ??
      root;

    target.prepend(button);
  }

  button.classList.toggle("active", embeddedPanelVisible);
  button.onclick = async event => {
    event.preventDefault();
    embeddedPanelVisible = !embeddedPanelVisible;
    button.classList.toggle("active", embeddedPanelVisible);
    await renderEmbeddedMissionPanel(root);
  };

  await renderEmbeddedMissionPanel(root);
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
    deleteCombat: handleCombatChange,
    updateToken: handleTokenSpatialUpdate,
    createToken: handleSpatialDocumentChange,
    deleteToken: handleSpatialDocumentChange,
    createRegion: handleSpatialDocumentChange,
    updateRegion: handleSpatialDocumentChange,
    deleteRegion: handleSpatialDocumentChange
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
    audience: "all",
    label: "Frame Conn // Mission",
    presentationSurface: "combat-tracker-embedded-panel",
    companionStylesheet: "styles/ui_dm/ui-dm-application.css",
    phase: "sitrep-assimilation-phase-6"
  }
});
