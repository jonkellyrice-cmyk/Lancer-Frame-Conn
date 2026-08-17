/* Frame Helm sidebar presentation. */
import { activateFrameConnApplicationListeners } from "./application-listeners.js";
import { renderBudgetPanel } from "./application-budget-panel.js";
import { getFrameConnApplication } from "./application-lifecycle.js";

const FRAME_CONN_SIDEBAR_TAB_ID = "frame-conn";
const FRAME_CONN_SIDEBAR_BUTTON_CLASS = "frame-conn-sidebar-tab-button";
const FRAME_CONN_SIDEBAR_PANEL_CLASS = "frame-conn-sidebar-surface";

let frameConnPresentationMode = "window";
let frameConnSidebarRoot = null;
let frameConnSidebarActive = false;

function normalizePresentationMode(mode) {
  return mode === "sidebar" ? "sidebar" : "window";
}

function getFrameConnPresentationMode() {
  return frameConnPresentationMode;
}

function normalizeSidebarRoot(html = null) {
  return html?.[0] ?? html ?? document.querySelector("#sidebar") ?? null;
}

function findSidebarNavigation(root) {
  return root?.querySelector?.("#sidebar-tabs") ?? root?.querySelector?.(".sidebar-tabs") ?? root?.querySelector?.("nav.tabs") ?? null;
}

function findSidebarContent(root) {
  return root?.querySelector?.("#sidebar-content") ?? root?.querySelector?.(".sidebar-content") ?? null;
}

function findNativeSidebarTabButton(navigation) {
  return navigation?.querySelector?.('[data-tab="chat"]') ?? navigation?.querySelector?.("[data-tab]") ?? null;
}

function removeFrameConnSidebarChrome(root = frameConnSidebarRoot) {
  root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_BUTTON_CLASS}`)?.remove();
  root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_PANEL_CLASS}`)?.remove();
  frameConnSidebarActive = false;
}

function deactivateFrameConnSidebarPanel(root = frameConnSidebarRoot) {
  root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_PANEL_CLASS}`)?.classList?.remove("active");
  root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_BUTTON_CLASS}`)?.classList?.remove("active");
  frameConnSidebarActive = false;
}

function activateFrameConnSidebarPanel(root = frameConnSidebarRoot) {
  const navigation = findSidebarNavigation(root);
  const content = findSidebarContent(root);
  const panel = root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_PANEL_CLASS}`) ?? null;
  const button = root?.querySelector?.(`.${FRAME_CONN_SIDEBAR_BUTTON_CLASS}`) ?? null;
  if (!navigation || !content || !panel || !button) return false;

  for (const tabButton of navigation.querySelectorAll("[data-tab]")) {
    tabButton.classList.toggle("active", tabButton === button);
  }
  for (const tab of content.querySelectorAll(":scope > [data-tab], :scope > .tab")) {
    tab.classList.toggle("active", tab === panel);
  }

  panel.classList.add("active");
  button.classList.add("active");
  frameConnSidebarActive = true;
  return true;
}

function ensureFrameConnSidebarChrome(root) {
  if (!root?.querySelector) return null;
  frameConnSidebarRoot = root;

  if (frameConnPresentationMode !== "sidebar") {
    removeFrameConnSidebarChrome(root);
    return null;
  }

  const navigation = findSidebarNavigation(root);
  const content = findSidebarContent(root);
  const nativeButton = findNativeSidebarTabButton(navigation);
  if (!navigation || !content || !nativeButton) return null;

  let button = root.querySelector(`.${FRAME_CONN_SIDEBAR_BUTTON_CLASS}`);
  if (!button) {
    button = nativeButton.cloneNode(false);
    button.removeAttribute("id");
    button.classList.remove("active");
    button.classList.add(FRAME_CONN_SIDEBAR_BUTTON_CLASS);
    button.dataset.tab = FRAME_CONN_SIDEBAR_TAB_ID;
    button.title = "Frame Helm";
    button.setAttribute("aria-label", "Frame Helm");
    button.innerHTML = '<i class="fas fa-robot"></i>';
    navigation.appendChild(button);

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void openFrameConnSidebarPresentation();
    }, true);
  }

  for (const nativeTabButton of navigation.querySelectorAll("[data-tab]")) {
    if (nativeTabButton === button || nativeTabButton.dataset.frameConnSidebarNativeListener === "true") continue;
    nativeTabButton.dataset.frameConnSidebarNativeListener = "true";
    nativeTabButton.addEventListener("click", () => deactivateFrameConnSidebarPanel(root), true);
  }

  let panel = root.querySelector(`.${FRAME_CONN_SIDEBAR_PANEL_CLASS}`);
  if (!panel) {
    panel = document.createElement("section");
    panel.className = `tab sidebar-tab ${FRAME_CONN_SIDEBAR_PANEL_CLASS}`;
    panel.dataset.tab = FRAME_CONN_SIDEBAR_TAB_ID;
    panel.setAttribute("aria-label", "Frame Helm");
    content.appendChild(panel);
  }

  return panel;
}

function renderFrameConnSidebarShell(application, data) {
  return `
    <div class="frame-conn-sidebar-scroll">
      <section class="frame-conn-shell frame-conn-sidebar-shell">
        ${application.renderMechStatsBar(data)}
        <section class="frame-conn-sidebar-unit">${application.renderUnitPanel(data)}</section>
        <section class="frame-conn-sidebar-budget">${renderBudgetPanel(data, data?.committedPlan, { includeCommittedPlan: false })}</section>
        <main class="frame-conn-sidebar-actions">${application.renderActionList(data)}</main>
        <section class="frame-conn-sidebar-plan">${application.renderCommittedPlan(data?.committedPlan)}</section>
      </section>
    </div>
  `;
}

async function renderFrameConnSidebarPresentation(application, { activate = frameConnSidebarActive } = {}) {
  if (frameConnPresentationMode !== "sidebar") return false;

  const root = frameConnSidebarRoot ?? document.querySelector("#sidebar");
  const panel = ensureFrameConnSidebarChrome(root);
  if (!panel) return false;

  const data = await application.getData();
  panel.innerHTML = renderFrameConnSidebarShell(application, data);
  application.frameConnPresentationElement = $(panel);
  activateFrameConnApplicationListeners(application, $(panel));

  if (activate) activateFrameConnSidebarPanel(root);
  return true;
}

async function openFrameConnSidebarPresentation(application = null) {
  frameConnSidebarActive = true;
  const targetApplication = application ?? getFrameConnApplication();
  if (!targetApplication) return false;

  const rendered = await renderFrameConnSidebarPresentation(targetApplication, { activate: true });
  if (!rendered) ui.notifications.warn("Frame Conn could not locate Foundry's sidebar surface.");
  return rendered;
}

async function closeFrameConnSidebarPresentation(application = null) {
  if (application) application.frameConnPresentationElement = null;
  deactivateFrameConnSidebarPanel();
  return true;
}

function isFrameConnSidebarPresentationActive() {
  return Boolean(
    frameConnPresentationMode === "sidebar" &&
    frameConnSidebarActive &&
    frameConnSidebarRoot?.querySelector?.(`.${FRAME_CONN_SIDEBAR_PANEL_CLASS}.active`)
  );
}

function synchronizeFrameConnSidebarChrome() {
  const root = frameConnSidebarRoot ?? document.querySelector("#sidebar");
  if (!root) return false;

  if (frameConnPresentationMode === "sidebar") ensureFrameConnSidebarChrome(root);
  else removeFrameConnSidebarChrome(root);
  return true;
}

function setFrameConnPresentationModeValue(mode) {
  frameConnPresentationMode = normalizePresentationMode(mode);
  synchronizeFrameConnSidebarChrome();
  return frameConnPresentationMode;
}

function handleFrameConnSidebarRender(_sidebarApplication, html) {
  const root = normalizeSidebarRoot(html);
  if (!root) return false;

  frameConnSidebarRoot = root;
  synchronizeFrameConnSidebarChrome();
  return true;
}

export {
  getFrameConnPresentationMode,
  setFrameConnPresentationModeValue,
  renderFrameConnSidebarPresentation,
  openFrameConnSidebarPresentation,
  closeFrameConnSidebarPresentation,
  isFrameConnSidebarPresentationActive,
  handleFrameConnSidebarRender
};
