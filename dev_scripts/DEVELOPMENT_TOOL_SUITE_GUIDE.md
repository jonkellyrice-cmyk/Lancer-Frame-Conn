# Frame Conn Development Tool Suite Guide

This document is the operator guide for the repository's development-tool stack. It explains what each tool owns, how the tools fit together, the normal remote workflow, the two DSL authoring levels, and the recovery path when GitHub Actions or the remote patch path is unavailable.

The guiding principle is: **author intent narrowly, execute deterministically, validate broadly, and fail closed rather than guess.**

---

## 1. The suite at a glance

There are two similarly named tool directories. They have different jobs:

```text
dev_scripts/
  filepatcher.py                  rich local FilePatcher / recovery executor
  filepatcher.json                local Python FilePatcher patch contract
  filepatcher-bootstrap.md        authoritative Python FilePatcher authoring contract
  PATCH_DSL.md                    Patch DSL syntax guide
  patch-dsl-compiler.mjs          DSL compiler for GitHub FilePatcher JSON
  patch-corridor-planner.mjs      goal -> likely patch corridor planner
  automatic-patch-staging.mjs     corridor -> dependency-ordered staged patch specs
  repo-audit.mjs                  repository integrity + dependency watershed
  symbol-family-audit.mjs         symbol-family topology / ownership audit
  effect-atlas.mjs                side-effect ownership audit
  dependency_graph.py             detailed static dependency graph diagnostic
  backups/                        local Python FilePatcher backups
  patch-history/                  local Python FilePatcher patch history

dev-scripts/
  github-filepatcher.mjs          narrow remote/GitHub patch executor
  filepatcher.json                authoritative GitHub patch specification
  README.md                       GitHub FilePatcher-specific documentation

.github/workflows/
  github-filepatcher.yml          automatic remote patch workflow
```

The package scripts are:

```bash
npm run patch
npm run github:patch
npm run audit
npm run symbol-family-audit
npm run effect-atlas
npm run dependency-graph
npm run patch-corridor
npm run patch-staging
npm run patch-staging:self-test
npm run patch:dsl
npm run patch:dsl:check
npm run patch:dsl:self-test
```

---

## 2. Mental model

The normal remote path is:

```text
behavioral goal
    ↓
Patch Corridor Planner
    ↓
Automatic Patch Staging
  dependency-safe phases + exact scope locks
    ↓
Corridor Context Pack + Native Contract Catalog
  exact local context + already-proven native facts
    ↓
Patch DSL authoring
    ↓
pattern-aware DSL shorthand when safe
    ↓
dev-scripts/filepatcher.json
    ↓
GitHub FilePatcher dry-run
    ↓
GitHub FilePatcher apply
    ↓
Patch DSL self-test + developer-tool syntax checks
    ↓
Repository Audit
    ↓
Symbol Family Audit
    ↓
Effect Atlas
    ↓
git diff validation
    ↓
github-actions[bot] commit
```

The detailed dependency graph is a deeper manual diagnostic. It is not part of the automatic blocking gate.

The local Python FilePatcher is the richer fallback/recovery path and maintains its own backup/history facilities.

---

# PART I — DIAGNOSTICS

## 3. Repository Audit — `repo-audit.mjs`

Run with:

```bash
npm run audit
```

This is the primary repository-integrity diagnostic. It checks structural correctness such as missing imports, case mismatches, missing named exports, duplicate feature IDs/providers, missing capabilities, registry membership, manifest entrypoints, circular JS dependencies, JSON validity, and related topology failures.

Its high-level view is the **dependency watershed**. Instead of dumping every import edge, it summarizes feature/domain streams, where they converge, and whether they reach the expected runtime outlets. Healthy topology is summarized; unhealthy topology is expanded.

Think of it as answering:

> Do the repository's major dependency streams connect to the correct composition rivers and runtime outlets?

A warning-only report can still pass. Errors are blocking.

---

## 4. Symbol Family Audit — `symbol-family-audit.mjs`

Run with:

```bash
npm run symbol-family-audit
```

This diagnostic groups large numbers of individual declarations/exports/imports/references into related **symbol families** so the codebase can be reasoned about in conceptual clusters rather than one symbol at a time.

It answers questions such as:

- Which symbols belong to the same conceptual subsystem?
- Which files own that family?
- Which families feed or consume it?
- Are symbols crossing architecture boundaries unexpectedly?
- Are there malformed, disconnected, or suspiciously orphaned family members?

The analyzer is deliberately conservative around Foundry's dynamic hooks, callbacks, reflection, and runtime globals. Proven structural failures should be treated differently from heuristic or informational orphan signals.

Healthy families are summarized. Unhealthy families receive detail.

---

## 5. Effect Atlas — `effect-atlas.mjs`

Run with:

```bash
npm run effect-atlas
```

The Effect Atlas maps side-effect-producing code and its ownership. It identifies effect families such as native execution, Foundry document mutation, hooks, notifications, settings, and application lifecycle behavior.

It answers:

> Where does this repository actually cause things to happen, and do those effects occur in the architectural layers that are allowed to own them?

The important distinction is between expected/delegated effects and suspicious/forbidden effects. A clean atlas should have no suspicious or forbidden effect sites.

This tool is especially useful before moving execution code, introducing a new adapter, or letting UI code reach toward native Foundry/Lancer effects.

---

## 6. Dependency Graph — `dependency_graph.py`

Run with:

```bash
npm run dependency-graph
```

This is the deeper static graph diagnostic. It scans source/module/style/template dependencies and produces `dev_scripts/dependency-graph-report.json`.

Use it when the compact dependency watershed is not enough and you need more detailed graph information, for example:

- tracing unexpected fan-in/fan-out;
- locating a concrete import path through several files;
- investigating dependency concentration;
- comparing low-level graph reality with the higher-level feature watershed.

This tool is intentionally **not** part of the automatic GitHub FilePatcher blocking gate. The normal gate uses the repository audit, symbol-family audit, and effect atlas; the dependency graph is a deeper investigative instrument.

---

# PART II — PATCH PLANNING AND AUTHORING

## 7. Integration Surface Atlas — `integration-surface-atlas.mjs`

Run against an authoritative native Lancer checkout with:

```bash
npm run integration-atlas -- --native-root /path/to/foundryvtt-lancer --query "damage attack flow"
```

Run its synthetic extraction test with:

```bash
npm run integration-atlas:self-test
```

The Integration Surface Atlas is the native-system discovery layer. It indexes the places where Frame Conn can legitimately meet Foundry Lancer: registered Flows and their ordered steps, Flow-step registries, native/Foundry hooks, `game.lancer.*` surfaces, chat-message controls, LancerActor/LancerItem/LancerToken entry points, document mutation boundaries, damage application boundaries, and explicit registries.

It answers:

> Where does native Lancer already expose the integration surface needed for this behavior?

This tool is not another Frame Conn topology audit. It scans authoritative native source and emits source/line evidence plus a version and SHA-256 source fingerprint. A generated report may be queried repeatedly without rescanning, but it must be regenerated when the authoritative native Lancer version changes. Search hits are candidates, not permission to invent or bypass native ownership.

See `dev_scripts/INTEGRATION_SURFACE_ATLAS.md` for the full contract.

---

## Runtime Signal Map — `runtime-signal-map.mjs`

Run against Frame Conn plus an authoritative native Lancer checkout with:

```bash
npm run runtime-signal-map -- --native-root /path/to/foundryvtt-lancer --query "attack damage chat"
```

Ask for an explicit causal path with:

```bash
npm run runtime-signal-map -- --report dev_scripts/runtime-signal-map-report.json --from "click .lancer-damage-apply" --to damageCalc
```

The Runtime Signal Map complements the Integration Surface Atlas. The Atlas answers **what native surfaces exist**; the signal map answers **how statically evidenced runtime signals travel between them**. It maps UI events, named handlers, direct calls, Flow construction, ordered Flow steps, Flow-step implementations, hooks, chat creation, damage application, and document mutation boundaries.

The mapper fails conservative: ambiguous call targets are omitted instead of guessed. Generated reports record source version/fingerprints and must be regenerated when authoritative native source changes. It is a planning/diagnostic tool, not live Foundry runtime proof.

See `dev_scripts/RUNTIME_SIGNAL_MAP.md` for the full contract.

---

## 8. Patch Corridor Planner — `patch-corridor-planner.mjs`

Run with:

```bash
npm run patch-corridor -- --goal "wire committed Scan through native execution"
```

The planner takes a behavioral goal and uses the current repository diagnostics to identify a likely **patch corridor**: the feature families, files, and symbols most likely to participate in the change.

It is now **clause-aware**. Before certifying a corridor it splits a behavioral goal into independently checkable clauses, detects the architectural concerns in each clause, resolves candidate owner families, and requires a statically known family path for every required obligation. The JSON report records each clause, its concern obligations, candidate owners, selected owner, path, and coverage status.

It helps answer both:

> Where should this change probably travel through the architecture?

and:

> Did the proposed corridor account for every distinct behavior the request actually requires?

A corridor cannot receive high confidence unless clause coverage is complete. If any clause has no deterministic owner/path, the planner writes the incomplete report and exits nonzero rather than silently certifying a partial implementation.

The planner consumes the repository audit, symbol-family audit, and effect atlas. It refuses to plan against unhealthy diagnostics. It also intentionally keeps dormant architecture out of the corridor unless the goal explicitly calls for it.

A corridor is guidance, not magical proof. If implementation discovers a real dependency outside the predicted corridor, expand the scope deliberately and explain why.

Run the deterministic clause-decomposition self-test with `npm run patch-corridor:self-test`. When `planning_goal` is present in `dev-scripts/filepatcher.json`, the GitHub FilePatcher runs this clause-aware planner before mutation and reports how many changed files are inside or outside the certified corridor.

---

## Automatic Patch Staging — `automatic-patch-staging.mjs`

Run directly from a behavioral goal with:

```bash
npm run patch-staging -- --goal "wire committed Scan through native execution and show the Scan choice in the UI"
```

Automatic Patch Staging takes a clause-complete Patch Corridor and the Symbol Family dependency graph and answers:

> In what dependency-safe phases should a large cross-cutting implementation be attempted?

The stager treats a family's `outgoingFamilies` as dependencies, reverses those edges into provider-before-consumer implementation order, condenses strongly connected components, and topologically layers the certified corridor. Dependency cycles are emitted as atomic groups instead of being given an invented internal order.

Its safe default is one generated FilePatcher spec per file. Skeleton specs contain no invented operations and use both `max_files_changed` and the new exact `policy.allowed_paths` lock. GitHub FilePatcher enforces `allowed_paths` before mutation. If an already-authored multi-file patch is supplied with `--patch`, the stager partitions its existing operations without changing them. Operations outside the certified corridor and ambiguous multi-file operations such as `replace_tree_text` are rejected.

When `planning_goal` is present, GitHub FilePatcher automatically runs the stager in report-only mode and reports whether the current patch crosses several dependency phases. The recommendation is advisory; the existing corridor certification and post-apply audits remain the blocking gates.

Run the deterministic topology/safety test with `npm run patch-staging:self-test`. See `dev_scripts/AUTOMATIC_PATCH_STAGING.md` for the complete contract and operator workflow.

---

## Corridor Context Pack — `corridor-context-pack.mjs`

Generate a compact authoring packet directly from a certified behavioral goal with:

```bash
npm run corridor-context -- --goal "show Brace after damage, spend the reaction, apply native Resistance, and restrict the next turn"
```

Or consume an existing Patch Corridor report with:

```bash
npm run corridor-context -- --corridor patch-corridor-report.json
```

The Context Pack is downstream of the clause-aware planner and cannot broaden its scope. For each planner-selected symbol it returns the exact source slice and line range, only imports actually referenced by that slice, lexical callers/consumers with source evidence, the clause/concern ownership reason that selected the family, and a nearby structural exemplar only when one candidate wins unambiguously. Missing or ambiguous symbol boundaries and exemplar ties are reported as omissions rather than guessed.

It answers:

> What exact source context do I need to author this certified patch without reopening whole files?

Run its deterministic self-test with `npm run corridor-context:self-test`. See `dev_scripts/CORRIDOR_CONTEXT_PACK.md` for the full contract.

---

## Native Contract Catalog — `native-contract-catalog.mjs`

The Native Contract Catalog persists already-proven native Lancer integration facts with upstream version, git commit, exact source paths/symbols/line ranges, complete-file SHA-256 hashes, exact evidence-slice hashes, and explicit Frame Conn ownership rules. It exists so a native API or boundary that has already been authoritatively traced does not need to be rediscovered on every future patch.

Query it with `npm run native-contracts -- --query "basic attack"`, inspect one entry with `--show <contract-id>`, and re-hash all persisted evidence against an authoritative native checkout with `npm run native-contracts:verify -- --native-root /path/to/foundryvtt-lancer`. `source-drift`, `contract-drift`, missing source, and native-version mismatch are verification failures rather than silent cache hits.

When FilePatcher receives a `planning_goal`, it now prints matching proven contracts after the Corridor Context Pack. The intended rule is **catalog first; rediscover only when no proven contract exists or the stored evidence has drifted**. Post-apply developer-tool validation also syntax-checks and self-tests the catalog tool and validates the committed catalog schema.

Run `npm run native-contracts:self-test` for the deterministic drift-detection test. See `dev_scripts/NATIVE_CONTRACT_CATALOG.md` for the complete contract and update discipline.

---

## 8. DSL Level 1 — Structural Patch DSL

Compiler:

```text
dev_scripts/patch-dsl-compiler.mjs
```

Guide:

```text
dev_scripts/PATCH_DSL.md
```

Commands:

```bash
npm run patch:dsl:check
npm run patch:dsl
npm run patch:dsl:self-test
```

The Patch DSL is an authoring shorthand. It does **not** mutate source files. It compiles a concise textual patch description into ordinary schema-v2 `dev-scripts/filepatcher.json`, which remains the executable contract.

Core primitives include:

- `file <path>`
- `within <symbol>`
- `global`
- `replace`
- `before`
- `after`
- `delete`
- `create`
- `rewrite`
- `raw`

`within <symbol>` is particularly important: it narrows edits to a resolved top-level function, class, or simple binding and then emits an exact deterministic replacement for that symbol.

Use this level when you know **what exact code change** you want but do not want to hand-author verbose JSON.

---

## 9. DSL Level 2 — Pattern-aware shorthand

Pattern-aware shorthand sits inside the Patch DSL. It is the higher abstraction level for repetitive local shapes.

Current supported forms are:

- `clone-pattern ui-control`
- `clone-pattern object-entry`
- `clone-pattern switch-case`

Example:

```text
file styles/ui_application/components/application-committed-plan.js
within renderCommittedPlan

clone-pattern ui-control after containing frame-conn-plan-execute
map
<<<
{
  "frame-conn-plan-execute": "frame-conn-plan-scan",
  "executeLabel": "scanLabel",
  "executeIcon": "scanIcon"
}
>>>
```

The rule is **exemplar-driven, never invention-driven**. The compiler copies a real structure that already exists inside the exact target symbol and applies only explicit substitutions.

Safety rules:

1. Pattern expansion is local to `within <symbol>`.
2. The exemplar must resolve unambiguously.
3. If several candidates exist, `containing <needle>` must reduce them to exactly one.
4. Every mapped source token must actually exist in the exemplar.
5. Unsupported or ambiguous shapes fail compilation.
6. When the compiler cannot prove a pattern, fall back to explicit Level-1 DSL or `raw`.

This level exists to save tokens and reduce duplicated boilerplate without turning the tool into a speculative code generator.

---

# PART III — PATCH EXECUTORS

## 10. GitHub FilePatcher — `dev-scripts/github-filepatcher.mjs`

Run manually with:

```bash
npm run github:patch -- --dry-run
npm run github:patch
```

Its authoritative patch document is:

```text
dev-scripts/filepatcher.json
```

This is the preferred remote execution bridge. It supports a deliberately small operation surface, including exact text replacement, file creation/replacement, and controlled tree-wide text migration. It does not provide arbitrary shell execution.

Important safety behavior:

- all changes are planned before writing;
- exact occurrence counts prevent ambiguous replacements;
- optional SHA-256 preconditions reject stale source;
- protected paths are enforced;
- `max_files_changed` limits scope;
- partial write failure triggers rollback attempts;
- post-apply diagnostic failure triggers rollback before the patch is accepted.

After a real apply, the current gate performs:

```text
Patch DSL self-test / developer-tool syntax
Repository Audit
Symbol Family Audit
Effect Atlas
```

If any blocking diagnostic fails, the source mutation is rolled back and the workflow fails.

---

## 11. Local Python FilePatcher — `dev_scripts/filepatcher.py`

Run with:

```bash
npm run patch -- --dry-run
npm run patch
```

Useful options include:

```bash
npm run patch -- --patch dev_scripts/another-patch.json
npm run patch -- --allow-dirty
npm run patch -- --reapply
```

Its authoritative authoring contract is `dev_scripts/filepatcher-bootstrap.md`. Do not infer features that are not documented there.

This is the richer local patcher and the preferred fallback when GitHub Actions or remote API writes are unavailable. It has broader preconditions/postconditions, richer validation, file move/remove support with explicit risk acceptance, and local backup/history facilities.

Its state directories are:

```text
dev_scripts/backups/
dev_scripts/patch-history/
```

Treat this tool as the controlled local recovery executor, not as a reason to bypass review. Dry-run first, inspect the intended scope, apply, then inspect Git state and diagnostics before committing.

---

# PART IV — NORMAL GITHUB WORKFLOW

## 12. Automatic workflow — `.github/workflows/github-filepatcher.yml`

The workflow triggers on a push to `main` that changes:

```text
dev-scripts/filepatcher.json
```

The current sequence is:

```text
1. Checkout repository
2. Setup Node 22
3. Read patch metadata / sanitize patch ID
4. Syntax-check GitHub FilePatcher
5. Dry-run GitHub FilePatcher
6. Apply GitHub FilePatcher
7. Detect whether files changed
8. git diff --check
9. Stage the patch result
10. Commit as github-actions[bot]
11. Push to main
```

The deeper diagnostic gate is owned by `github-filepatcher.mjs` itself during the apply step. This is intentional: running `npm run github:patch` locally should receive the same post-apply diagnostic protection instead of relying on GitHub Actions to provide it.

The workflow is serialized with `cancel-in-progress: false`, so one patch run is allowed to finish before another takes over.

### Preferred remote operating procedure

1. Inspect the current source and diagnostics.
2. Run or reason from a patch corridor when the change crosses architecture boundaries.
3. Author the smallest useful Patch DSL or JSON patch.
4. Keep `max_files_changed` narrow; one file/one commit is the default when practical.
5. Update only `dev-scripts/filepatcher.json`.
6. Wait for the GitHub FilePatcher workflow.
7. Confirm dry-run succeeded.
8. Confirm apply + diagnostics succeeded.
9. Confirm the bot-created source commit exists.
10. Inspect that commit before authoring the next patch.

Do not assume that a successful patch-spec commit means the source change happened. The source change is the later `github-actions[bot]` commit.

---

# PART V — FAILURE AND RECOVERY

## 13. If a patch itself fails

A failed dry-run is usually the best failure: no source was written. Typical causes are stale exact anchors, ambiguous occurrence counts, changed source, unsupported pattern inference, or scope-policy violations.

Procedure:

1. Read the failing step/log.
2. Re-fetch the exact current target file.
3. Repair the patch specification rather than weakening the safety rule.
4. Push a corrected patch spec.

If apply writes source and a post-apply diagnostic fails, GitHub FilePatcher attempts to restore the original mutation plan before exiting. Verify the failed run and repository state before proceeding.

---

## 14. If GitHub Actions does not cooperate

Examples include an Actions outage, a stuck runner, permissions problems, GitHub refusing a push, or remote tooling becoming unavailable. Do **not** respond by repeatedly force-writing source through random API calls. Move to the local recovery path.

### Safe local recovery procedure

1. Obtain a current local checkout of the repository.
2. Before editing, confirm the branch and repository state:

```bash
git status
git log -1 --oneline
```

3. Prefer a temporary recovery branch when practical:

```bash
git switch -c recovery/<short-purpose>
```

4. Preserve an external copy/ZIP of the checkout before any unusually risky repair if the repository state itself is in doubt. Git history is the primary recovery mechanism, but an out-of-repo copy protects against local mistakes.
5. Author a local Python FilePatcher patch using `dev_scripts/filepatcher-bootstrap.md`.
6. Dry-run it:

```bash
npm run patch -- --dry-run
```

7. Apply only after the dry-run is correct:

```bash
npm run patch
```

8. Inspect:

```bash
git status
git diff --check
git diff
```

9. Run the relevant diagnostics manually:

```bash
npm run audit
npm run symbol-family-audit
npm run effect-atlas
```

Use `npm run dependency-graph` when deeper dependency investigation is warranted.

10. Inspect `dev_scripts/backups/` and `dev_scripts/patch-history/` as additional recovery records when the local Python FilePatcher generated them.
11. Commit only after the diff and diagnostics are acceptable.
12. Push the recovery branch or commit when GitHub connectivity/permissions permit.

---

## 15. If the repository is already in a bad state

First determine whether the problem is committed history, uncommitted local state, or a failed patch attempt. Do not overwrite evidence before identifying which one it is.

Useful commands:

```bash
git status
git diff
git diff --cached
git log --oneline -10
```

Then choose the least destructive recovery source:

1. Git history / last known good commit.
2. Python FilePatcher backup artifacts.
3. Python FilePatcher patch-history records.
4. External pre-repair checkout/ZIP copy.

Avoid destructive Git commands such as forced resets unless the exact state being discarded is understood and intentionally preserved elsewhere.

If a source file was manually repaired, rerun all three blocking architectural diagnostics before treating the repository as healthy.

---

## 16. If the development tools themselves are broken

Tooling repairs deserve extra care because the patcher and diagnostics are part of the trust boundary.

Preferred order:

1. Use `node --check` / Python syntax checks on the affected tool.
2. Make one narrow repair at a time.
3. Run `npm run patch:dsl:self-test` if the DSL compiler changed.
4. Run the repository, symbol-family, and effect diagnostics.
5. Run a no-op GitHub FilePatcher patch after repair to prove the committed toolchain can execute independently.

Do not weaken or remove a failing self-test merely to make the patch pipeline green. Fix the reason the test is failing or explicitly revise the contract if the intended behavior truly changed.

---

# PART VI — CHOOSING THE RIGHT TOOL

## 17. Decision guide

Use the **Patch Corridor Planner** when the main uncertainty is *where the change belongs*.

Use **Pattern-aware DSL** when the location is known and the desired change is a repeated local structural shape that already has a trustworthy exemplar.

Use **Structural Patch DSL** when the location is known but the change needs explicit text-level control.

Use **raw GitHub FilePatcher JSON** when the DSL cannot express the required supported operation cleanly.

Use the **GitHub FilePatcher** for normal remote execution.

Use the **Python FilePatcher** for richer local work, local backup/history, and recovery when GitHub cannot execute the normal path.

Use **Repository Audit** for high-level structural/dependency integrity.

Use **Symbol Family Audit** for symbol ownership/family topology.

Use **Effect Atlas** for side-effect ownership and architectural effect boundaries.

Use **Dependency Graph** when you need the lower-level dependency graph rather than the watershed summary.

---

## 18. Safety hierarchy

When there is uncertainty, prefer this order:

```text
prove exact local structure
    ↓
use narrow deterministic patch
    ↓
fail on ambiguity
    ↓
inspect current source again
    ↓
expand scope deliberately only when architecture requires it
```

Do not trade away determinism merely to avoid writing a few more explicit lines. The DSL exists to compress **known structure**, not to hide uncertainty.

Likewise, diagnostics are not substitutes for runtime testing inside Foundry. They protect the static architecture and known repository contracts; actual Lancer/Foundry behavior still needs runtime validation when a change touches execution semantics or UI behavior.

---

## 19. Quick reference

```bash
# Planning
npm run patch-corridor -- --goal "<behavioral goal>"

# DSL
npm run patch:dsl:check
npm run patch:dsl
npm run patch:dsl:self-test

# GitHub patch executor
npm run github:patch -- --dry-run
npm run github:patch

# Rich local/recovery patch executor
npm run patch -- --dry-run
npm run patch

# Diagnostics
npm run audit
npm run symbol-family-audit
npm run effect-atlas
npm run dependency-graph
```

The normal standard is simple: **small patch, deterministic executor, diagnostics pass, inspect the resulting commit, then continue.**
