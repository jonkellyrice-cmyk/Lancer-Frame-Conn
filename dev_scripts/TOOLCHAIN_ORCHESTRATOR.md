# Toolchain Orchestrator

## Purpose

`toolchain-orchestrator.mjs` is the policy and compact-state boundary around Frame Conn's established developer-tool pipeline.

It does not mutate target files, plan architecture, validate code, or promote commits. Those responsibilities remain with the existing tools and workflows.

Its job is to constrain interaction so the canonical path remains authoritative:

```text
audit
  -> symbol-family graph
  -> effect atlas
  -> certified patch corridor
  -> corridor context
  -> provider-first staging
  -> FilePatcher
  -> change propagation simulator
  -> validation / promotion
```

## Commands

```bash
npm run toolchain:status
npm run toolchain:execute
npm run toolchain:failure
npm run toolchain:self-test
```

`status` returns one compact machine-readable request state.

`execute` is the mandatory policy preflight for every normal mutation carrier. It either returns `READY`/`IDLE` and exits successfully so FilePatcher, Path Mover, or Domain Decomposer may continue, or it fails closed with a terminal/blocking state. It never performs mutation itself.

`failure` returns the compact terminal failure record when one exists.

## Request identity

The orchestrator fingerprints the semantic bounded request through Request Envelope, regardless of whether the routed carrier is FilePatcher, Path Mover, or Domain Decomposer. Transient labels, telemetry/runtime metadata, raw-operations justification text, and Path Mover completion timestamps do not affect the fingerprint. Actual operations, moves, decomposition structure, planning semantics, carrier choice, policy/scope locks, and other request semantics do.

This supports duplicate execution prevention, sticky terminal failure, terminal success closure, request supersession, and correlation from request authoring through completion telemetry.

## Progressive action-space closure

Assistant-facing states are `IDLE`, `READY`, `EXECUTING`, `VALIDATING`, `PROMOTING`, `SUCCEEDED`, `FAILED`, `BLOCKED_IDENTICAL_FAILURE`, `CAPABILITY_GAP`, `CONFLICT`, and `SUPERSEDED`.

Each state now carries an `assistant_capabilities` object that closes specific escape hatches rather than relying only on prose. Once a bounded request is `READY` or active, repository reading is `curated_context_only`, direct source reconstruction is disallowed, GitHub workflow/job/log reads are disallowed, generic direct GitHub writes are disallowed, and targeted source expansion is reserved for a canonical context-insufficiency case. Failure diagnostics come from Failure Evidence Extractor. `CAPABILITY_GAP` permits only requesting explicit authorization, and protected workflow publication is only through Infrastructure Publisher after that authorization.

A successful canonical completion is hard closure: `validation_closed=true`, `promotion_completed=true`, `permitted_next_action=none`, and `assistant_capabilities.permitted_actions=[]`. No reassurance validation, source reconstruction, workflow inspection, cleanup mutation, or generic GitHub write is permitted for the closed request.

## No polling loop

The orchestrator does not expose GitHub Actions as the primary transaction model. GitHub Telemetry projects `workflow_run: completed` into an orchestrator terminal record and commit status. On failure, telemetry performs one terminal lookup of the completed run's jobs so the failure record can name the failed stage without repeated assistant polling.

## Identical failure stickiness

Before FilePatcher mutation, `toolchain:execute` checks recent semantic request history and the canonical `frame-conn/orchestrator` terminal status. If the same request fingerprint already failed, execution is blocked as `BLOCKED_IDENTICAL_FAILURE`; the only permitted next action is to materially modify the canonical request according to the failure diagnostic. If the identical request already succeeded, it remains closed and is not re-executed.

A materially changed request receives a new fingerprint and may supersede a prior failed request.

## Single mutation authority and conflicts

The three normal mutation authorities are FilePatcher, Path Mover, and Domain Decomposer. The Mutation Carrier Router selects exactly one, and **each executor must call `toolchain-orchestrator.mjs execute --request <its canonical request>` before mutation**. Domain Decomposer additionally delegates its generated structural extraction patch to FilePatcher, so both the decomposition request and the generated FilePatcher transition are guarded.

At preflight the orchestrator performs one GitHub Actions ownership read for the canonical carrier set derived from Mutation Carrier Router. If ownership or sticky-history evidence cannot be read in GitHub Actions, preflight fails closed rather than silently assuming no conflict. If another known mutation owner is active on the same branch, it returns `CONFLICT / MULTIPLE_MUTATION_AUTHORITIES`. This is a one-time ownership check, not a polling loop.

The orchestrator does not create alternate workflows, helper patchers, marker files, or branch machinery to escape a conflict.

## Direct GitHub exceptions

The machine-readable contract always reports `direct_github_mutation_permitted=false` and `assistant_capabilities.generic_direct_github_write_permitted=false`. A bounded request that targets `.github/workflows/**` is automatically converted to `CAPABILITY_GAP` before the normal carrier can mutate it. The only protected-workflow exception path is:

```text
CAPABILITY_GAP
  -> explicit user authorization
  -> dev_scripts/infrastructure-publisher.mjs
  -> one authorized protected file
  -> normal canonical authority resumes
```

The orchestrator never treats a generic GitHub contents write as an equivalent fallback.

## Telemetry integration

`github-telemetry.mjs` carries the triggering request identity, declared scope, request path, and mutation authority for all three normal mutation workflows. It reconstructs identity from the triggering SHA rather than a potentially mutated request file, which preserves Path Mover identity even after the mover disables its applied plan. At terminal completion telemetry maps success/failure into the orchestrator state model, delegates failed-run compression to Failure Evidence Extractor, embeds the compact orchestrator record in `github-telemetry-report.json`, and publishes `frame-conn/orchestrator` status on both the triggering request commit and result commit.

## Boundaries

The orchestrator must not modify target repository files, implement FilePatcher operations, derive Patch Corridors, reproduce audits, invent validation, perform promotion, repair unrelated repository debt, create temporary escape infrastructure, or automatically authorize direct GitHub writes.

It constrains interaction; it does not replace engineering.
