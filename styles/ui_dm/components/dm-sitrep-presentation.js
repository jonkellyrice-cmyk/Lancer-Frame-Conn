/** Pure Frame Conn // Mission HTML presentation. */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionList(options, selectedValue = "", selectedValues = null) {
  const many = selectedValues ? new Set(selectedValues.map(String)) : null;
  return options.map(option => {
    const selected = many
      ? many.has(String(option.id))
      : String(option.id) === String(selectedValue);
    return `<option value="${esc(option.id)}" ${selected ? "selected" : ""}>${esc(option.label)}</option>`;
  }).join("");
}

function stat(label, value, tone = "") {
  return `<div class="fc-dm-stat ${esc(tone)}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function controllerLabel(value) {
  if (value === "friendly") return "ALLIED CONTROL";
  if (value === "hostile") return "HOSTILE CONTROL";
  if (value === "contested") return "CONTESTED";
  return "UNCONTROLLED";
}

function zoneCards(zones = [], recon = false) {
  return `<div class="fc-dm-zone-grid">${zones.map(zone => `
    <article class="fc-dm-zone-card" data-controller="${esc(zone.controller)}">
      <strong>${esc(zone.name)}</strong>
      <span>${recon
        ? zone.scanned ? (zone.isTrueZone ? "TRUE CONTROL ZONE" : "FALSE CONTROL ZONE") : "UNSCANNED"
        : esc(controllerLabel(zone.controller))}</span>
      <small>Allies ${esc(zone.friendly)} / Hostiles ${esc(zone.hostile)}</small>
      ${recon ? `<button type="button" data-dm-sitrep-command="recon-scan" data-region-id="${esc(zone.id)}" ${zone.scanned ? "disabled" : ""}>Scan Zone</button>` : ""}
    </article>`).join("")}</div>`;
}

function scenarioState(model) {
  const state = model.derivedState ?? {};
  switch (model.type) {
    case "control":
      return `<div class="fc-dm-stat-grid">
        ${stat("ALLIED SCORE", state.friendlyScore ?? 0, "allied")}
        ${stat("HOSTILE SCORE", state.hostileScore ?? 0, "hostile")}
        ${stat("ALLIED ZONES", state.friendlyZones ?? 0, "allied")}
        ${stat("HOSTILE ZONES", state.hostileZones ?? 0, "hostile")}
      </div>${zoneCards(state.controlZones)}`;
    case "holdout":
      return `<div class="fc-dm-zone-banner">${esc(state.regionName ?? "Control Zone")}</div>
        <div class="fc-dm-control-banner">${esc(controllerLabel(state.controller))}</div>
        <div class="fc-dm-stat-grid">
          ${stat("ALLIES IN ZONE", state.friendlyInZone ?? 0, "allied")}
          ${stat("HOSTILES IN ZONE", state.hostileInZone ?? 0, "hostile")}
          ${stat("HOLDOUT SCORE", state.holdoutScore ?? 0)}
          ${stat("BASE SCORE", state.holdoutBaseScore ?? 0)}
        </div>`;
    case "escort":
      return `<div class="fc-dm-objective-card"><span>ESCORT OBJECTIVE</span><strong>${esc(state.objectiveName ?? "Objective")}</strong><small>${state.objectiveInExtraction ? "In extraction zone" : "Not in extraction zone"}</small></div>
        <div class="fc-dm-stat-grid">${stat("ALLIED ADJACENT", state.friendlyAdjacent ?? 0, "allied")}${stat("HOSTILE ADJACENT", state.hostileAdjacent ?? 0, "hostile")}</div>
        <div class="fc-dm-command-row"><button type="button" data-dm-sitrep-command="escort-extract" ${state.objectiveDestroyed || state.objectiveExtracted ? "disabled" : ""}>Extract Objective</button><button type="button" data-dm-sitrep-command="escort-destroy" ${state.objectiveDestroyed || state.objectiveExtracted ? "disabled" : ""}>Destroy Objective</button></div>`;
    case "extraction":
      return `<div class="fc-dm-objective-card"><span>EXTRACTION OBJECTIVE</span><strong>${esc(state.objectiveName ?? "Objective")}</strong><small>${state.objectiveInExtraction ? "In extraction zone" : "Not in extraction zone"}</small></div>
        <div class="fc-dm-stat-grid">${stat("ALLIED ADJACENT", state.friendlyAdjacent ?? 0, "allied")}${stat("HOSTILE ADJACENT", state.hostileAdjacent ?? 0, "hostile")}${stat("ALLIES IN EXTRACTION", state.friendlyInExtractionZone ?? 0, "allied")}</div>
        <div class="fc-dm-command-row"><button type="button" data-dm-sitrep-command="extraction-extract" ${!state.canExtractObjective || state.objectiveDestroyed || state.objectiveExtracted ? "disabled" : ""}>Extract Objective</button><button type="button" data-dm-sitrep-command="extraction-destroy" ${state.objectiveDestroyed || state.objectiveExtracted ? "disabled" : ""}>Destroy Objective</button></div>`;
    case "recon":
      return zoneCards(state.reconZones, true);
    default:
      return `<div class="fc-dm-zone-banner">${esc(state.regionName ?? "Control Zone")}</div>
        <div class="fc-dm-control-banner">${esc(controllerLabel(state.controller))}</div>
        <div class="fc-dm-stat-grid">
          ${stat("ALLIES IN ZONE", state.friendlyInZone ?? 0, "allied")}
          ${stat("HOSTILES IN ZONE", state.hostileInZone ?? 0, "hostile")}
          ${stat("ALLIES STANDING", state.friendlyStanding ?? 0, "allied")}
          ${stat("HOSTILES STANDING", state.hostileStanding ?? 0, "hostile")}
        </div>`;
  }
}

function setupForm(model) {
  const state = model.state ?? { type: "gauntlet", title: "OPERATION: GRAYSPACE", objective: "", roundLimit: 8, holdoutBaseScore: 4, rules: {} };
  return `<form class="fc-dm-setup-form" data-dm-sitrep-form>
    <div class="fc-dm-form-grid">
      <label><span>SITREP TYPE</span><select name="type" data-dm-sitrep-type>${optionList(model.typeOptions, state.type)}</select></label>
      <label><span>ROUND LIMIT</span><input type="number" min="1" max="99" name="roundLimit" value="${esc(state.roundLimit ?? 8)}"></label>
      <label class="wide"><span>MISSION TITLE</span><input name="title" value="${esc(state.title ?? "")}"></label>
      <label class="wide"><span>OBJECTIVE</span><textarea name="objective" rows="3">${esc(state.objective ?? "")}</textarea></label>
      <label data-sitrep-field="single-region"><span>CONTROL REGION</span><select name="regionId"><option value="">— Select Region —</option>${optionList(model.regions, state.regionId)}</select></label>
      <label data-sitrep-field="control-regions"><span>CONTROL ZONES — EXACTLY FOUR</span><select name="controlRegionIds" multiple size="5">${optionList(model.regions, "", model.selectedControlRegionIds)}</select></label>
      <label data-sitrep-field="holdout-score"><span>HOLDOUT BASE SCORE</span><input type="number" min="0" name="holdoutBaseScore" value="${esc(state.holdoutBaseScore ?? 4)}"></label>
      <label data-sitrep-field="escort-objective"><span>ESCORT OBJECTIVE</span><select name="escortObjectiveCombatantId"><option value="">— Select Combatant —</option>${optionList(model.combatants, state.escortObjectiveCombatantId)}</select></label>
      <label data-sitrep-field="escort-region"><span>ESCORT EXTRACTION ZONE</span><select name="escortExtractionRegionId"><option value="">— Select Region —</option>${optionList(model.regions, state.escortExtractionRegionId)}</select></label>
      <label data-sitrep-field="extraction-objective"><span>EXTRACTION OBJECTIVE</span><select name="extractionObjectiveCombatantId"><option value="">— Select Combatant —</option>${optionList(model.combatants, state.extractionObjectiveCombatantId)}</select></label>
      <label data-sitrep-field="extraction-region"><span>EXTRACTION ZONE</span><select name="extractionZoneRegionId"><option value="">— Select Region —</option>${optionList(model.regions, state.extractionZoneRegionId)}</select></label>
      <label data-sitrep-field="recon-regions"><span>RECON ZONES — EXACTLY FOUR</span><select name="reconRegionIds" multiple size="5">${optionList(model.regions, "", model.selectedReconRegionIds)}</select></label>
      <label data-sitrep-field="recon-true"><span>TRUE CONTROL ZONE — GM SECRET</span><select name="reconTrueRegionId"><option value="">— Select True Zone —</option>${optionList(model.regions, state.reconTrueRegionId)}</select></label>
    </div>
    <fieldset class="fc-dm-rules"><legend>GAUNTLET VICTORY RULES</legend>
      <label><input type="checkbox" name="finalZoneControl" ${state.rules?.finalZoneControl !== false ? "checked" : ""}> Final-round zone control</label>
      <label><input type="checkbox" name="enemyElimination" ${state.rules?.enemyElimination !== false ? "checked" : ""}> Enemy elimination</label>
      <label><input type="checkbox" name="unassailableControl" ${state.rules?.unassailableControl !== false ? "checked" : ""}> Unassailable control</label>
    </fieldset>
    <div class="fc-dm-command-row"><button type="button" data-dm-sitrep-command="configure">Save Configuration</button><button type="button" class="primary" data-dm-sitrep-command="start">Start SITREP</button></div>
    <div class="fc-dm-validation" data-dm-sitrep-validation></div>
  </form>`;
}

function missionPanel(model) {
  const state = model.state;
  const derived = model.derivedState ?? {};
  return `<section class="fc-dm-mission-panel">
    <header class="fc-dm-mission-header"><div><span>FRAME CONN // MISSION</span><h2>${esc(state.title)}</h2></div><strong>${esc(model.statusLabel)}</strong></header>
    <div class="fc-dm-objective">${esc(state.objective)}</div>
    <div class="fc-dm-round-strip"><span>${esc(model.typeLabel)}</span><strong>ROUND ${esc(derived.currentRound ?? model.combatRound)} / ${esc(state.finalRound)}</strong></div>
    ${derived.valid === false ? `<div class="fc-dm-error">Configured battlefield references are incomplete or unavailable.</div>` : scenarioState(model)}
    ${state.resultReason ? `<div class="fc-dm-result-reason">${esc(state.resultReason)}</div>` : ""}
    <div class="fc-dm-command-row mission-controls"><button type="button" data-dm-sitrep-command="toggle-pause">${state.status === "paused" ? "Resume" : "Pause"}</button><button type="button" data-dm-sitrep-command="victory">Declare Victory</button><button type="button" data-dm-sitrep-command="defeat">Declare Defeat</button><button type="button" data-dm-sitrep-command="edit">Configure</button><button type="button" class="danger" data-dm-sitrep-command="end">End SITREP</button></div>
  </section>`;
}

export function renderDmSitrepApplication(model, { showSetup = false } = {}) {
  if (!model.hasCombat) {
    return `<div class="fc-dm-shell"><header class="fc-dm-app-header"><span>FRAME CONN // MISSION</span><strong>SITREP CONTROL</strong></header><div class="fc-dm-empty">Start or select a Combat encounter to configure a SITREP.</div></div>`;
  }
  return `<div class="fc-dm-shell" data-sitrep-type="${esc(model.type)}">
    <header class="fc-dm-app-header"><div><span>FRAME CONN // MISSION</span><strong>SITREP CONTROL</strong></div><small>${esc(model.source.toUpperCase())} STATE</small></header>
    ${model.configured && !showSetup ? missionPanel(model) : setupForm(model)}
  </div>`;
}
