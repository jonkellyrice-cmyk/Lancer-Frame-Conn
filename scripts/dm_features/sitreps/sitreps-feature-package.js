/** Canonical Frame Conn SITREP feature package. Phase 4 is real but deliberately unregistered; Phase 5 owns registry/runtime composition. */

import { defineFrameConnFeature } from "../../feature-contract.js";
import { configureSitrepOrchestrationRuntime, configureSitrep, endSitrep, evaluateSitrepCombatChange, getSitrepOperationalState, getSitrepOrchestrationDiagnostics, resolveExtractionOutcome, scanReconRegion, setSitrepResult, startSitrep, toggleSitrepPause, validateSitrepSetup } from "./orchestration/sitrep-orchestrator.js";

export const frameConnSitrepsFeature = defineFrameConnFeature({
  id: "sitreps", domain: "dm-sitreps",
  provides: ["dm.sitreps", "dm.sitreps.state", "dm.sitreps.commands", "dm.sitreps.orchestration"],
  dependsOn: [], optionalDependsOn: ["targeting-spatial"], state: {},
  commands: { configureRuntime: configureSitrepOrchestrationRuntime, configure: configureSitrep, start: startSitrep, togglePause: toggleSitrepPause, end: endSitrep, setResult: setSitrepResult, evaluateCombatChange: evaluateSitrepCombatChange, scanReconRegion, resolveExtractionOutcome },
  queries: { operationalState: getSitrepOperationalState, validateSetup: validateSitrepSetup, diagnostics: getSitrepOrchestrationDiagnostics },
  hooks: {}, lifecycle: {},
  api: { configureRuntime: configureSitrepOrchestrationRuntime, configure: configureSitrep, start: startSitrep, togglePause: toggleSitrepPause, end: endSitrep, setResult: setSitrepResult, evaluateCombatChange: evaluateSitrepCombatChange, scanReconRegion, resolveExtractionOutcome, operationalState: getSitrepOperationalState, validateSetup: validateSitrepSetup, diagnostics: getSitrepOrchestrationDiagnostics },
  metadata: { audience: "gm", phase: "sitrep-assimilation-phase-4", runtimeRegistration: "intentionally-deferred-to-phase-5" }
});

export const FRAME_CONN_SITREP_FEATURES = Object.freeze([frameConnSitrepsFeature]);
