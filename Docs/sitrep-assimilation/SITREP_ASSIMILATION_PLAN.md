# SITREP Assimilation Plan

This plan integrates the transplanted legacy SITREP module into Frame Conn without ever activating its standalone runtime shell.

## Architectural destination

```text
scripts/
  runtime-orchestrator.js
  dm_features/
    dm-feature-registry.js
    sitreps/
      sitreps-feature-package.js
      state/
      shared/
      control/
      escort/
      extraction/
      gauntlet/
      holdout/
      recon/
      presentation/
  foundry_features/
    elevation_los/

styles/
  ui_dm/
    ... SITREP presentation components ...
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

## Phase 0 — Quarantine and restore repository health

Goal: make the repository analyzable by the normal toolchain without enabling any legacy behavior.

- Keep the entire imported module unregistered and unreachable from `module.json`/runtime composition.
- Correct only transplanted stale internal import names that make static repo audit fail (`./program.js` → `./sitrep-program.js`, `./dsl.js` → `./sitrep-dsl.js`) or otherwise teach the repo audit to treat the explicitly quarantined legacy subtree as migration input.
- Prefer the smallest approach that restores the ordinary audit while preserving the imported source as evidence.
- Do **not** register `sitreps-feature-package.js` yet.
- Do **not** import legacy tracker/elevation code for side effects.

Exit criteria:
- `npm run audit` passes or the legacy quarantine is explicitly supported by the audit contract.
- normal Patch Corridor can run again.
- runtime-authority audit still reports the legacy shell only because it exists in quarantine, not because it is active.

## Phase 1 — Establish canonical SITREP state boundary

Create a narrow SITREP state service before migrating any individual scenario logic.

Responsibilities:
- resolve active combat through shared combat/context infrastructure where available;
- read current SITREP state;
- write/update/clear SITREP state;
- own the persisted state shape;
- provide compatibility reads for `flags.lancer-sitrep-tracker.sitrep`;
- define the migration/write policy for old worlds.

Recommended compatibility sequence:

```text
read new Frame Conn SITREP state
        ↓ if absent
read legacy lancer-sitrep-tracker.sitrep
        ↓
normalize to canonical in-memory shape
        ↓
write only through canonical SITREP state service
```

Do not scatter legacy compatibility checks across scenario modules.

## Phase 2 — Extract shared SITREP domain primitives

Move only SITREP-specific concepts out of the legacy kernel.

Preserve/decompose:
- faction interpretation required by SITREPs;
- defeated-combatant filtering;
- controller-from-counts semantics;
- combatant/objective lookup semantics;
- common round/final-round state helpers.

Delegate instead of copying:
- token adjacency → existing targeting/spatial capability;
- token footprint handling → existing shared spatial capability;
- Scene Region access/membership → shared Foundry/spatial service;
- generic combat lookup → existing Foundry/combat-context boundary where practical.

Exit criteria:
- no new SITREP module implements its own generic adjacency algorithm;
- shared primitives are presentation-free and hook-free.

## Phase 3 — Migrate scenario rules one SITREP at a time

Each SITREP becomes a focused domain module with no startup code and no DOM code.

Recommended order:

1. Gauntlet — smallest useful control/counting foundation.
2. Control — scoring/round transition semantics.
3. Holdout — round-bound score state.
4. Escort — objective + extraction spatial rules.
5. Extraction — objective + adjacency/contested extraction rules.
6. Recon — hidden true-zone state + scan/reveal behavior.

For each scenario:
- migrate domain calculation first;
- add state mutation through canonical SITREP state service;
- add output intents/events rather than direct UI ownership;
- update corresponding entries in `dev_scripts/legacy-parity.json` to `MIGRATED_UNVERIFIED`;
- use Runtime Contract Probes/live Foundry testing before marking `VERIFIED`.

## Phase 4 — Build SITREP orchestration feature

Replace `installProgram(...)` with a real Frame Conn feature package.

The SITREP package should expose capabilities such as:
- configure/start SITREP;
- read current SITREP presentation state;
- pause/resume/end;
- evaluate relevant combat changes;
- resolve GM-declared victory/defeat;
- perform scenario-specific GM commands such as Recon scan or objective extraction.

Lifecycle ownership:

```text
Foundry hooks/events
      ↓
shared Foundry integration / lifecycle feature
      ↓
SITREP feature API
      ↓
scenario state/domain modules
```

The feature package itself must not call `Hooks.once("init")` or `Hooks.once("ready")` as a second application shell.

## Phase 5 — Register DM feature package

Once the SITREP package is self-contained and runtime-safe:

- make `sitreps-feature-package.js` export its real feature definitions;
- add SITREPs to `dm-feature-registry.js`;
- add the DM package to the single application-wide feature graph in `runtime-orchestrator.js`;
- preserve dependency validation before runtime startup.

At this point `runtime-authority-audit --strict` should show no active competing SITREP runtime authority.

## Phase 6 — Replace legacy SITREP HUD with DM UI

Do not port `sitrep-ui-boilerplate.js` as an application framework.

Build SITREP presentation inside the existing/future `styles/ui_dm/` application:
- setup/configuration;
- active objective/status;
- round/score/progress;
- GM-only controls;
- player-visible objective information where appropriate;
- pause/end/manual result controls;
- Recon scan controls and hidden true-zone handling;
- Escort/Extraction objective controls.

The old localStorage HUD position key may be intentionally dropped because this is a new application surface.

## Phase 7 — Extract elevation/LOS into foundry_features

Move the useful behavior from legacy `elevation-los.js` into a dedicated Foundry feature family.

Potential structure:

```text
scripts/foundry_features/elevation_los/
  elevation-los-feature.js
  wall-elevation-service.js
  elevated-light-service.js
  elevation-los-runtime-adapter.js
```

Requirements:
- no SITREP dependency;
- lifecycle registration through the Foundry feature package/authoritative runtime;
- prototype wrapping installed exactly once;
- legacy `flags.lancer-sitrep-tracker.elevationLOS` compatibility handled centrally;
- public API exposed through Frame Conn composition only if actually needed.

This phase can be performed independently of scenario migration once the repo baseline is healthy.

## Phase 8 — Compatibility cleanup and legacy deletion

Only after parity verification:
- remove `legacy-sitrep-module/scripts/sitrep-program.js`;
- remove legacy standalone UI boilerplate/DSL/CSS when no longer referenced;
- remove `.bak` artifacts;
- remove duplicate kernel/spatial code;
- remove the legacy tracker once all retained behaviors have canonical owners;
- preserve only deliberate migration readers for legacy persisted data, with a documented removal policy if desired.

## Toolchain sequence after Phase 0

For each migration slice:

```text
Legacy Assimilation Atlas / parity ledger
        ↓
Runtime Authority Audit
        ↓
State Namespace Atlas
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
FilePatcher
        ↓
Repo Audit
Symbol Family Audit
Effect Atlas
Runtime Authority Audit --strict (when slice should be runtime-clean)
        ↓
Runtime Contract Probes / live Foundry verification
        ↓
legacy-parity.json status advancement
```

## Immediate next implementation slice

The first code change should be **Phase 0 only**: restore a healthy static baseline while keeping the legacy module quarantined. Do not begin scenario migration in the same patch. Once the ordinary planning toolchain works again, use it to design Phase 1's canonical SITREP state boundary.
