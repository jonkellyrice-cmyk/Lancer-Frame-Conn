# SITREP Assimilation Plan

This plan integrates the transplanted legacy SITREP module into Frame Conn without ever activating its standalone runtime shell.

The legacy tracker has now undergone a behavior-preserving first-pass Domain Decomposer split. Assimilation should therefore proceed from the smaller modules under `legacy-sitrep-module/scripts/decomposed/`, not by reopening the original 2,725-line monolith as the primary implementation surface.

## Current migration baseline

Completed before Phase 1:

- the transplanted legacy module remains quarantined and unregistered;
- stale transplanted imports were repaired so the normal repository toolchain can analyze the tree;
- `lancer-sitrep-tracker.js` was structurally decomposed by the Domain Decomposer;
- the decomposition produced 17 focused child modules plus a retained legacy composition spine;
- decomposition validation reported no contract deltas, no dependency cycles, no missing providers, and no forbidden effects;
- the bare side-effect import for legacy Elevation/LOS remains on the retained legacy spine rather than being copied into extracted modules;
- no persisted namespace, runtime authority, or SITREP behavior was intentionally changed by decomposition.

Current legacy decomposition:

```text
legacy-sitrep-module/scripts/
  lancer-sitrep-tracker.js          # retained quarantined legacy composition spine
  sitrep-program.js                 # legacy standalone runtime shell; never activate
  sitrep-kernel.js                  # legacy shared kernel; source for selective assimilation
  sitrep-dsl.js
  sitrep-ui-boilerplate.js
  elevation-los.js

  decomposed/
    sitrep-configuration.js
    gauntlet-control-weight.js
    sitrep-state-composition.js
    sitrep-presentation-shared.js

    recon-presentation.js
    holdout-presentation.js
    extraction-presentation.js
    escort-presentation.js
    control-presentation.js
    sitrep-hud-rendering.js

    sitrep-encounter-resolution.js
    recon-resolution.js
    extraction-resolution.js
    escort-resolution.js

    sitrep-setup-presentation.js
    sitrep-setup-state.js
    sitrep-setup-dialog.js
```

These files are **migration sources**, not final architectural destinations.

## Architectural destination

```text
scripts/
  runtime-orchestrator.js

  dm_features/
    dm-feature-registry.js
    sitreps/
      sitreps-feature-package.js

      state/
        ... canonical persisted-state ownership ...

      shared/
        ... SITREP-specific domain primitives ...

      control/
      escort/
      extraction/
      gauntlet/
      holdout/
      recon/

      setup/
      orchestration/

  foundry_features/
    elevation_los/

styles/
  ui_dm/
    ... SITREP setup and live-mission presentation components ...
```

SITREPs are a DM feature family. Their rules/state logic belongs under `dm_features/sitreps`; their GM-facing presentation belongs to the separate DM application surface. Generic Foundry wall/light/vision behavior belongs under `foundry_features`, not under SITREPs.

## Non-negotiable invariants

1. `scripts/runtime-orchestrator.js` remains the only application runtime/startup authority.
2. `module.json` continues to load the runtime orchestrator rather than a SITREP entrypoint.
3. `legacy-sitrep-module/scripts/sitrep-program.js` is never wired into active code.
4. No active SITREP feature assigns `game.lancerSitrep` directly.
5. Generic adjacency/spatial behavior is delegated to existing Frame Conn targeting/spatial ownership.
6. SITREP state has one canonical service instead of scattered `getFlag`/`setFlag` calls.
7. Legacy persisted flags are not renamed or abandoned accidentally.
8. Elevation/LOS is extracted from SITREP ownership before activation.
9. Behavioral parity is tracked in `dev_scripts/legacy-parity.json` until every retained behavior is `VERIFIED` or explicitly `INTENTIONALLY_DROPPED`.
10. The decomposed legacy files remain migration evidence until their responsibilities have canonical owners.
11. Assimilation must not collapse the new domain seams back into another large multipurpose implementation file.
12. Structural decomposition and behavioral migration remain separate operations whenever possible.

## Phase 0 — Quarantine, repository health, and structural decomposition — COMPLETE

Goal: make the imported subsystem analyzable and small enough to migrate safely without enabling legacy behavior.

Completed work:

### Phase 0A — Quarantine and static health

- kept the entire imported module unregistered and unreachable from `module.json`/runtime composition;
- corrected stale transplanted internal import names:
  - `./program.js` → `./sitrep-program.js`
  - `./dsl.js` → `./sitrep-dsl.js`;
- restored the ordinary repository audit and Patch Corridor baseline;
- did not register `sitreps-feature-package.js`;
- did not activate the legacy tracker or runtime shell.

### Phase 0B — Domain decomposition

- ran the Domain Decomposer against `lancer-sitrep-tracker.js`;
- reviewed and refined the proposed seams before execution;
- hardened the executor so bare side-effect imports remain on the retained spine;
- extracted 17 focused implementation modules;
- retained `lancer-sitrep-tracker.js` as the quarantined composition spine;
- preserved runtime effects, public contracts, persistent state, and native/Foundry interaction semantics;
- passed repository, symbol-family, effect, dependency, and structural-scope validation.

Phase 0 exit criteria are satisfied.

## Phase 1 — Establish the canonical SITREP state boundary — COMPLETE

The canonical state service now exists **before any individual scenario rules move into active Frame Conn ownership**. Canonical persistence uses `flags.lancer-frame-conn.sitrep`; legacy `flags.lancer-sitrep-tracker.sitrep` is centralized as read-only compatibility fallback. Canonical writes use a versioned envelope, and an explicit canonical `state: null` tombstone prevents stale legacy state from resurrecting after clear. No SITREP runtime hooks, UI, or scenario rules were activated in this phase.

Primary migration evidence:

```text
legacy/decomposed/sitrep-configuration.js
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/sitrep-setup-state.js
legacy/sitrep-kernel.js
```

The important distinction after decomposition is:

- `sitrep-state-composition.js` describes how the legacy system *derives a current SITREP state/view*;
- `sitrep-setup-state.js` contains persisted setup/state mutation behavior;
- `sitrep-kernel.js` contains legacy state access and supporting predicates;
- the new canonical state boundary must separate **persistence**, **normalization**, and **derived scenario state** rather than simply moving these files wholesale.

Responsibilities of the canonical state boundary:

- resolve the active Combat through shared combat/context infrastructure where available;
- read current persisted SITREP configuration/runtime state;
- write/update/clear SITREP state;
- own the canonical persisted state shape;
- normalize data before scenario modules consume it;
- provide compatibility reads for `flags.lancer-sitrep-tracker.sitrep`;
- define the migration/write policy for old worlds;
- expose state operations without DOM, Hooks, or presentation ownership.

Recommended compatibility sequence:

```text
read new Frame Conn SITREP state
        ↓ if absent
read legacy flags.lancer-sitrep-tracker.sitrep
        ↓
normalize to canonical in-memory shape
        ↓
write only through canonical SITREP state service
```

Do not scatter legacy compatibility checks across scenario modules.

### Phase 1 decomposition checkpoint

Before implementing the state boundary, run the Domain Decomposer in **planning mode** on `sitrep-state-composition.js` if its internal per-SITREP branching still obscures the persistence/derivation seam.

Only execute a second-level decomposition if it reveals genuinely cohesive subdomains. Do not split merely because the function/file remains large.

Exit criteria:

- one canonical SITREP persistence API exists;
- legacy namespace compatibility is centralized;
- no canonical scenario module directly calls the old scattered flag helpers;
- persistence and derived scenario calculations are distinguishable architectural responsibilities;
- no runtime hooks or UI are activated.

## Phase 2 — Assimilate shared SITREP domain primitives — COMPLETE

Move only SITREP-specific concepts out of the legacy kernel and decomposed shared helpers.

Primary migration evidence:

```text
legacy/sitrep-kernel.js
legacy/decomposed/gauntlet-control-weight.js
legacy/decomposed/sitrep-configuration.js
legacy/decomposed/sitrep-state-composition.js
```

Preserve/decompose where genuinely SITREP-owned:

- faction interpretation required by SITREPs;
- defeated-combatant filtering;
- controller-from-counts semantics;
- Gauntlet control weighting;
- combatant/objective lookup semantics specific to SITREP resolution;
- common round/final-round state helpers;
- SITREP type/configuration definitions that are not presentation-only.

Delegate instead of copying:

- token adjacency → existing targeting/spatial capability;
- token footprint handling → existing shared spatial capability;
- Scene Region access/membership → shared Foundry/spatial service;
- generic combat lookup → existing Foundry/combat-context boundary where practical.

Exit criteria:

- no new SITREP module implements its own generic adjacency algorithm;
- shared primitives are presentation-free and hook-free;
- scenario modules can depend on canonical state + shared primitives without importing the legacy kernel.

## Phase 3 — Assimilate scenario rules one SITREP at a time

The decomposition now lets each scenario migration use narrow source modules rather than mining the old tracker repeatedly.

Recommended order:

### 3A — Gauntlet

Primary source:

```text
legacy/decomposed/gauntlet-control-weight.js
legacy/decomposed/sitrep-state-composition.js      # Gauntlet branch only
legacy/decomposed/sitrep-encounter-resolution.js  # Gauntlet branch only
```

### 3B — Control

Primary source:

```text
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/control-presentation.js          # semantics/evidence only
legacy/decomposed/sitrep-encounter-resolution.js
```

### 3C — Holdout

Primary source:

```text
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/holdout-presentation.js          # semantics/evidence only
legacy/decomposed/sitrep-encounter-resolution.js
```

### 3D — Escort

Primary source:

```text
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/escort-resolution.js
legacy/decomposed/escort-presentation.js           # semantics/evidence only
legacy/decomposed/sitrep-encounter-resolution.js
```

### 3E — Extraction

Primary source:

```text
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/extraction-resolution.js
legacy/decomposed/extraction-presentation.js       # semantics/evidence only
legacy/decomposed/sitrep-encounter-resolution.js
```

### 3F — Recon

Primary source:

```text
legacy/decomposed/sitrep-state-composition.js
legacy/decomposed/recon-resolution.js
legacy/decomposed/recon-presentation.js            # hidden/revealed semantics evidence
legacy/decomposed/sitrep-encounter-resolution.js
```

For each scenario:

1. extract/assimilate domain calculation first;
2. route all mutation through the canonical SITREP state service;
3. depend on shared spatial/combat capabilities instead of copying legacy generic helpers;
4. represent downstream presentation needs as state/output intents rather than DOM ownership;
5. update the corresponding `dev_scripts/legacy-parity.json` entries to `MIGRATED_UNVERIFIED`;
6. use Runtime Contract Probes/live Foundry testing before marking `VERIFIED`.

### Phase 3 recursive decomposition rule

If `sitrep-state-composition.js` or `sitrep-encounter-resolution.js` remains difficult to reason about because several independently cohesive scenario branches still coexist, use the Domain Decomposer on that specific child file before migrating those branches.

The preferred eventual shape is one scenario domain per canonical folder, not one new cross-scenario mega-module.

## Phase 4 — Build canonical SITREP setup and orchestration

After canonical state and scenario domains exist, replace the retained legacy composition responsibilities with proper Frame Conn feature orchestration.

Primary migration evidence:

```text
legacy/lancer-sitrep-tracker.js                    # retained composition spine
legacy/sitrep-program.js                           # evidence of runtime responsibilities to eliminate
legacy/decomposed/sitrep-setup-presentation.js     # setup semantics only
legacy/decomposed/sitrep-setup-state.js            # setup mutation evidence
legacy/decomposed/sitrep-setup-dialog.js            # interaction semantics only
legacy/decomposed/sitrep-encounter-resolution.js   # command/evaluation evidence
legacy/decomposed/recon-resolution.js
legacy/decomposed/extraction-resolution.js
legacy/decomposed/escort-resolution.js
```

Build canonical capabilities such as:

- configure/start SITREP;
- read current SITREP operational state;
- pause/resume/end;
- evaluate relevant combat changes;
- resolve GM-declared victory/defeat;
- perform scenario-specific GM commands such as Recon scan or objective extraction;
- expose command/state APIs suitable for the DM UI without owning that UI.

Lifecycle ownership:

```text
Foundry hooks/events
      ↓
shared Foundry integration / lifecycle feature
      ↓
SITREP feature API
      ↓
canonical state + scenario domain modules
```

The new feature package must not recreate `installProgram(...)`, call `Hooks.once("init")` / `Hooks.once("ready")` as a second shell, or publish a parallel `game.lancerSitrep` runtime authority.

Exit criteria:

- retained legacy tracker is no longer needed for active orchestration;
- no canonical SITREP module imports `sitrep-program.js`;
- runtime-authority audit identifies only Frame Conn's normal runtime authority in active code.

## Phase 5 — Register the DM SITREP feature package

Only once Phase 4 is self-contained and runtime-safe:

- make `sitreps-feature-package.js` export real feature definitions;
- add SITREPs to `dm-feature-registry.js`;
- add the DM package to the single application-wide feature graph in `runtime-orchestrator.js`;
- preserve dependency validation before startup;
- keep presentation registration separate from domain/runtime ownership.

At this point `runtime-authority-audit --strict` should show no active competing SITREP runtime authority.

## Phase 6 — Rebuild SITREP presentation inside the DM UI

The decomposition gives us isolated legacy presentation modules that can now be used as behavioral/presentation evidence without preserving the old HUD framework.

Primary migration evidence:

```text
legacy/decomposed/sitrep-presentation-shared.js
legacy/decomposed/recon-presentation.js
legacy/decomposed/holdout-presentation.js
legacy/decomposed/extraction-presentation.js
legacy/decomposed/escort-presentation.js
legacy/decomposed/control-presentation.js
legacy/decomposed/sitrep-hud-rendering.js
legacy/decomposed/sitrep-setup-presentation.js
legacy/decomposed/sitrep-setup-dialog.js
legacy/sitrep-ui-boilerplate.js
```

Do **not** port `sitrep-ui-boilerplate.js` as an application framework.

Build SITREP presentation inside `styles/ui_dm/`:

- setup/configuration;
- active objective/status;
- round/score/progress;
- GM-only controls;
- player-visible objective information where appropriate;
- pause/end/manual-result controls;
- Recon scan controls and hidden true-zone handling;
- Escort/Extraction objective controls.

Presentation modules should consume canonical SITREP view/state models rather than reading legacy flags or Combat state independently.

The old `localStorage` HUD position key may be intentionally dropped because this is a new application surface.

Exit criteria:

- no canonical DM UI imports the old HUD boilerplate or DSL;
- the legacy presentation modules are no longer runtime dependencies;
- parity ledger covers the meaningful information/actions formerly exposed by the HUD.

## Phase 7 — Extract Elevation/LOS into `foundry_features` — COMPLETE EARLY

This independent phase was deliberately pulled forward immediately after SITREP Phase 1 so later SITREP assimilation no longer carries unrelated Foundry platform behavior.

Canonical structure now exists at:

```text
scripts/foundry_features/elevation_los/
  elevation-los-contract.js
  wall-elevation-state.js
  elevation-vision-service.js
  elevated-light-service.js
  elevation-document-commands.js
  elevation-config-presentation.js
  elevation-los-feature.js
```

Completed ownership migration:

- generic elevation behavior is owned by `foundry_features`, not SITREPs;
- `FRAME_CONN_FOUNDRY_FEATURES` is now a real package registered into the single application feature graph;
- Foundry hooks are declared by `elevation-los-feature.js` and installed through the existing feature registry;
- wrapper initialization remains under the authoritative runtime `init` boundary and perception refresh under `ready`;
- canonical wall writes use `flags.lancer-frame-conn.elevationLOS`;
- existing `flags.lancer-sitrep-tracker.elevationLOS` wall data remains readable through centralized compatibility fallback;
- the former `game.lancerElevationLOS` parallel public global is gone; the feature API is exposed through `game.lancerFrameConn.elevationLOS`;
- the legacy SITREP-side elevation module is inert and stale side-effect imports are being removed from quarantined migration sources.

Behavioral parity remains `MIGRATED_UNVERIFIED` until live Foundry verification confirms wall ranges, movement/vision blocking, elevated light radii, configuration controls, and single wrapper installation.

## Phase 8 — Compatibility cleanup and legacy deletion

Only after behavioral parity verification:

- remove `legacy-sitrep-module/scripts/sitrep-program.js`;
- remove the retained `lancer-sitrep-tracker.js` composition spine;
- remove decomposed migration-source modules once every responsibility has a canonical owner;
- remove legacy standalone UI boilerplate/DSL/CSS when no longer referenced;
- remove `.bak` artifacts;
- remove duplicate kernel/spatial code;
- preserve only deliberate migration readers for legacy persisted data, with a documented removal policy if desired.

Deletion should be parity-ledger driven rather than file-age driven: a legacy source survives until every behavior for which it is evidence is `VERIFIED` or `INTENTIONALLY_DROPPED`.

## Toolchain sequence from Phase 1 onward

For each migration slice:

```text
Legacy Assimilation Atlas / parity ledger
        ↓
Runtime Authority Audit
        ↓
State Namespace Atlas
        ↓
Domain Decomposer --plan
  only when the current source still has a genuine multi-domain seam
        ↓
Integration Surface Atlas where native/Foundry proof is needed
        ↓
Runtime Signal Map
        ↓
Patch Corridor
        ↓
Automatic Patch Staging
        ↓
Corridor Context Pack
        ↓
Change Propagation Simulator
        ↓
FilePatcher / Path Mover as appropriate
        ↓
Repo Audit
Symbol Family Audit
Effect Atlas
Runtime Authority Audit --strict when the slice should be runtime-clean
        ↓
Runtime Contract Probes / live Foundry verification
        ↓
legacy-parity.json status advancement
```

### Decomposition rule during assimilation

The Domain Decomposer is no longer a mandatory step for every migration slice. Use it when one of the decomposed source modules still exhibits:

- high size pressure **and** low cohesion;
- multiple independently cohesive scenario/domain families;
- mixed state/effect/presentation ownership;
- a clean secondary seam whose extraction improves reasoning without changing behavior.

Do not decompose composition roots, registries, facades, or already-cohesive modules merely to reduce LOC.

## Immediate next implementation slice

The next code change is now **Phase 1: establish the canonical SITREP state boundary**.

Start from the isolated state/configuration sources produced by decomposition rather than from the old tracker as a whole:

```text
sitrep-configuration.js
sitrep-state-composition.js
sitrep-setup-state.js
sitrep-kernel.js
```

Before mutation:

1. run the state/namespace and runtime-authority diagnostics against these sources;
2. use the Domain Decomposer in planning mode on `sitrep-state-composition.js` only if its internal scenario branches obstruct the persistence-vs-derived-state boundary;
3. certify the target ownership/path through the normal Patch Corridor;
4. implement only the canonical state boundary in this slice—do not migrate scenario rules or register SITREPs in the same patch.
