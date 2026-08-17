/** Canonical GM SITREP presentation model. Consumes feature APIs only. */

const TYPE_LABELS = Object.freeze({
  gauntlet: "Gauntlet",
  control: "Control",
  holdout: "Holdout",
  escort: "Escort",
  extraction: "Extraction",
  recon: "Recon"
});

const TYPE_IDS = Object.freeze(Object.keys(TYPE_LABELS));

function optionsFrom(collection) {
  return Array.from(collection ?? []).map(document => Object.freeze({
    id: String(document?.id ?? ""),
    label: String(document?.name ?? document?.id ?? "Unnamed")
  }));
}

function missionStatusLabel(state, derived) {
  if (!state) return "NOT CONFIGURED";
  if (state.status === "victory") return "MISSION SUCCESS";
  if (state.status === "defeat") return "MISSION FAILED";
  if (state.status === "draw") return "NO VICTOR";
  if (state.status === "paused") return "SITREP PAUSED";
  if (Number(derived?.roundsRemaining) === 1) return "FINAL ROUND";
  return `${Math.max(Number(derived?.roundsRemaining ?? 0), 0)} ROUNDS REMAINING`;
}

export async function buildDmSitrepViewModel({ sitrepsApi, foundryApi } = {}) {
  if (!sitrepsApi || !foundryApi) {
    throw new Error("DM SITREP view model requires registered SITREP and Foundry APIs.");
  }

  const combat = foundryApi.getActiveCombat?.() ?? null;
  const record = sitrepsApi.operationalState?.(combat) ?? {
    combat,
    source: "none",
    state: null,
    canonicalPresent: false
  };
  const state = record.state ?? null;
  const derivedState = state
    ? await sitrepsApi.presentationState?.(combat)
    : null;
  const type = String(state?.type ?? "gauntlet").toLowerCase();

  return Object.freeze({
    combat,
    hasCombat: Boolean(combat),
    state,
    derivedState,
    configured: Boolean(state),
    source: record.source ?? "none",
    type,
    typeLabel: TYPE_LABELS[type] ?? type.toUpperCase(),
    statusLabel: missionStatusLabel(state, derivedState),
    combatRound: Math.max(Number(combat?.round ?? 1), 1),
    typeOptions: TYPE_IDS.map(id => ({ id, label: TYPE_LABELS[id] })),
    regions: optionsFrom(foundryApi.listCombatRegions?.(combat)),
    combatants: optionsFrom(foundryApi.listCombatants?.(combat)),
    selectedControlRegionIds: Array.isArray(state?.controlRegionIds) ? state.controlRegionIds : [],
    selectedReconRegionIds: Array.isArray(state?.reconRegionIds) ? state.reconRegionIds : [],
    canManage: Boolean(foundryApi.isPrimaryGM?.())
  });
}
