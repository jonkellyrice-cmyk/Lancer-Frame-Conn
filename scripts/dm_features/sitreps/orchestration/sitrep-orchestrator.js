/** Canonical SITREP application orchestration. Unregistered until DM composition Phase 5. */

import { clearSitrepState, readSitrepState, readSitrepStateRecord, updateSitrepState, writeSitrepState } from "../state/sitrep-state-service.js";
import { resolveGauntletEncounterUpdate } from "../gauntlet/gauntlet-resolution.js";
import { resolveControlEncounterUpdate } from "../control/control-resolution.js";
import { resolveHoldoutEncounterUpdate } from "../holdout/holdout-resolution.js";
import { resolveEscortEncounterUpdate } from "../escort/escort-resolution.js";
import { resolveExtractionEncounterUpdate, resolveExtractionObjective } from "../extraction/extraction-resolution.js";
import { recordReconScan, resolveReconEncounterUpdate } from "../recon/recon-resolution.js";
import { buildConfiguredSitrepState, validateSitrepSetup } from "./sitrep-setup.js";

const runtime = { spatialOperations: null, publishOutputIntent: async () => {}, canManageSitreps: () => Boolean(globalThis.game?.user?.isGM) };

export function configureSitrepOrchestrationRuntime({ spatialOperations, publishOutputIntent, canManageSitreps } = {}) {
  if (spatialOperations !== undefined) runtime.spatialOperations = spatialOperations;
  if (publishOutputIntent !== undefined) { if (typeof publishOutputIntent !== "function") throw new TypeError("SITREP output publisher must be a function."); runtime.publishOutputIntent = publishOutputIntent; }
  if (canManageSitreps !== undefined) { if (typeof canManageSitreps !== "function") throw new TypeError("SITREP authorization binding must be a function."); runtime.canManageSitreps = canManageSitreps; }
  return getSitrepOrchestrationDiagnostics();
}

function assertManagePermission() { if (!runtime.canManageSitreps()) throw new Error("Only an authorized GM may manage SITREPs."); }
function requireSpatialOperations() { if (!runtime.spatialOperations) throw new Error("SITREP spatial operations have not been configured."); return runtime.spatialOperations; }
async function publishResultIntents(result) { if (!result) return result; const intents = Array.isArray(result.outputIntents) ? result.outputIntents : result.outputIntent ? [result.outputIntent] : []; for (const intent of intents) await runtime.publishOutputIntent(intent); return result; }

export function getSitrepOperationalState(combat = null) { return readSitrepStateRecord(combat); }
export function getSitrepOrchestrationDiagnostics() { return Object.freeze({ spatialConfigured: Boolean(runtime.spatialOperations), outputPublisherConfigured: typeof runtime.publishOutputIntent === "function", authorizationConfigured: typeof runtime.canManageSitreps === "function" }); }

export async function configureSitrep(request, combat = null) { assertManagePermission(); const existing = readSitrepState(combat); return writeSitrepState(buildConfiguredSitrepState(request, combat, existing, { resetProgress: false }), combat); }
export async function startSitrep(request, combat = null) { assertManagePermission(); const existing = readSitrepState(combat); const state = await writeSitrepState(buildConfiguredSitrepState(request, combat, existing, { resetProgress: true }), combat); await runtime.publishOutputIntent(Object.freeze({ kind: "sitrep-started", sitrepType: state.type, title: state.title, finalRound: state.finalRound })); return state; }
export async function toggleSitrepPause(combat = null) { assertManagePermission(); const sitrep = readSitrepState(combat); if (!sitrep) throw new Error("Cannot pause or resume because no SITREP is configured."); return updateSitrepState({ status: sitrep.status === "paused" ? "active" : "paused" }, combat); }
export async function endSitrep(combat = null) { assertManagePermission(); await clearSitrepState(combat); await runtime.publishOutputIntent(Object.freeze({ kind: "sitrep-ended" })); return null; }
export async function setSitrepResult(status, reason, combat = null) { assertManagePermission(); const normalizedStatus = String(status ?? "").trim().toLowerCase(); if (!["victory", "defeat", "draw"].includes(normalizedStatus)) throw new Error(`Unsupported SITREP result status: ${normalizedStatus}.`); const resultReason = String(reason ?? "").trim(); const state = await updateSitrepState({ status: normalizedStatus, resultReason }, combat); const outputIntent = Object.freeze({ kind: "sitrep-result", sitrepType: state.type, status: normalizedStatus, reason: resultReason }); await runtime.publishOutputIntent(outputIntent); return Object.freeze({ changed: true, state, outputIntent }); }

const encounterResolvers = Object.freeze({ gauntlet: resolveGauntletEncounterUpdate, control: resolveControlEncounterUpdate, holdout: resolveHoldoutEncounterUpdate, escort: resolveEscortEncounterUpdate, extraction: resolveExtractionEncounterUpdate, recon: resolveReconEncounterUpdate });

export async function evaluateSitrepCombatChange(combat, changes = {}) { const sitrep = readSitrepState(combat); if (!sitrep?.active || sitrep.status !== "active") return Object.freeze({ changed: false, state: sitrep, outputIntent: null }); const resolver = encounterResolvers[sitrep.type]; if (!resolver) return Object.freeze({ changed: false, state: sitrep, outputIntent: null }); return publishResultIntents(await resolver(combat, changes, requireSpatialOperations())); }
export async function scanReconRegion(combat, regionId) { assertManagePermission(); return publishResultIntents(await recordReconScan(combat, regionId, requireSpatialOperations())); }
export async function resolveExtractionOutcome(combat, outcome) { assertManagePermission(); return publishResultIntents(await resolveExtractionObjective(combat, outcome, requireSpatialOperations())); }
export { validateSitrepSetup };
