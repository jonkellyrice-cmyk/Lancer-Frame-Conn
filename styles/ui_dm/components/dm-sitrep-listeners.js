/** Translate GM DOM intent into canonical SITREP commands. */

const FIELD_TYPES = Object.freeze({
  "single-region": new Set(["gauntlet", "holdout"]),
  "control-regions": new Set(["control"]),
  "holdout-score": new Set(["holdout"]),
  "escort-objective": new Set(["escort"]),
  "escort-region": new Set(["escort"]),
  "extraction-objective": new Set(["extraction"]),
  "extraction-region": new Set(["extraction"]),
  "recon-regions": new Set(["recon"]),
  "recon-true": new Set(["recon"])
});

function values(select) {
  return Array.from(select?.selectedOptions ?? []).map(option => option.value);
}

function setupRequest(form) {
  const e = form?.elements;
  return {
    type: e?.type?.value ?? "gauntlet",
    title: e?.title?.value ?? "",
    objective: e?.objective?.value ?? "",
    roundLimit: Number(e?.roundLimit?.value ?? 8),
    regionId: e?.regionId?.value ?? "",
    controlRegionIds: values(e?.controlRegionIds),
    holdoutBaseScore: Number(e?.holdoutBaseScore?.value ?? 4),
    escortObjectiveCombatantId: e?.escortObjectiveCombatantId?.value ?? "",
    escortExtractionRegionId: e?.escortExtractionRegionId?.value ?? "",
    extractionObjectiveCombatantId: e?.extractionObjectiveCombatantId?.value ?? "",
    extractionZoneRegionId: e?.extractionZoneRegionId?.value ?? "",
    reconRegionIds: values(e?.reconRegionIds),
    reconTrueRegionId: e?.reconTrueRegionId?.value ?? "",
    rules: {
      finalZoneControl: Boolean(e?.finalZoneControl?.checked),
      enemyElimination: Boolean(e?.enemyElimination?.checked),
      unassailableControl: Boolean(e?.unassailableControl?.checked)
    }
  };
}

function synchronizeFields(root) {
  const type = root.querySelector("[data-dm-sitrep-type]")?.value ?? "gauntlet";
  for (const field of root.querySelectorAll("[data-sitrep-field]")) {
    field.hidden = !FIELD_TYPES[field.dataset.sitrepField]?.has(type);
  }
  root.dataset.sitrepType = type;
}

function setupFormFrom(application) {
  return application.element?.[0]?.querySelector?.("[data-dm-sitrep-form]") ??
    application.element?.find?.("[data-dm-sitrep-form]")?.[0] ?? null;
}

async function execute(application, command, control, sitrepsApi, foundryApi) {
  const combat = foundryApi.getActiveCombat?.() ?? null;
  if (!combat) throw new Error("No active Combat is available.");

  if (command === "configure" || command === "start") {
    const form = setupFormFrom(application);
    const request = setupRequest(form);
    const validation = sitrepsApi.validateSetup(request);
    if (!validation.valid) {
      const target = form?.querySelector("[data-dm-sitrep-validation]");
      if (target) target.textContent = validation.errors.join(" ");
      return false;
    }
    if (command === "configure") await sitrepsApi.configure(request, combat);
    else await sitrepsApi.start(request, combat);
    application.showSetup = false;
    return true;
  }

  if (command === "edit") { application.showSetup = true; return true; }
  if (command === "toggle-pause") await sitrepsApi.togglePause(combat);
  else if (command === "victory") await sitrepsApi.setResult("victory", "Victory declared by the GM.", combat);
  else if (command === "defeat") await sitrepsApi.setResult("defeat", "Defeat declared by the GM.", combat);
  else if (command === "end") { await sitrepsApi.end(combat); application.showSetup = true; }
  else if (command === "recon-scan") await sitrepsApi.scanReconRegion(combat, control.dataset.regionId);
  else if (command === "escort-extract") await sitrepsApi.resolveEscortOutcome(combat, "extracted");
  else if (command === "escort-destroy") await sitrepsApi.resolveEscortOutcome(combat, "destroyed");
  else if (command === "extraction-extract") await sitrepsApi.resolveExtractionOutcome(combat, "extracted");
  else if (command === "extraction-destroy") await sitrepsApi.resolveExtractionOutcome(combat, "destroyed");
  return true;
}

export function activateDmSitrepListeners(application, html, { sitrepsApi, foundryApi } = {}) {
  const root = html?.[0] ?? html;
  if (!root) return;
  synchronizeFields(root);
  root.querySelector("[data-dm-sitrep-type]")?.addEventListener("change", () => synchronizeFields(root));

  for (const control of root.querySelectorAll("[data-dm-sitrep-command]")) {
    control.addEventListener("click", async event => {
      event.preventDefault();
      control.disabled = true;
      try {
        const changed = await execute(application, control.dataset.dmSitrepCommand, control, sitrepsApi, foundryApi);
        if (changed) await application.render(true);
      } catch (error) {
        console.error("Frame Conn | DM SITREP command failed.", error);
        ui.notifications.error(error?.message ?? "SITREP command failed.");
      } finally {
        control.disabled = false;
      }
    });
  }
}
