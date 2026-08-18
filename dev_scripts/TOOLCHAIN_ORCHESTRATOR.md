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

`execute` is a policy preflight. It either returns `READY`/`IDLE` and exits successfully so the caller may continue into the existing FilePatcher path, or it fails closed with a terminal/blocking state. It never performs mutation itself.

`failure` returns the compact terminal failure record when one exists.

## Request identity

The orchestrator fingerprints the semantic FilePatcher request. Transient labels such as `id`, `description`, telemetry, and execution metadata do not affect the fingerprint. Operations, planning semantics, policy/scope locks, and other request semantics do.

This supports duplicate execution prevention, sticky terminal failure, terminal success closure, request supersession, and correlation from request authoring through completion telemetry.

## Progressive action-space closure

Assistant-facing states are `IDLE`, `READY`, `EXECUTING`, `VALIDATING`, `PROMOTING`, `SUCCEEDED`, `FAILED`, `BLOCKED_IDENTICAL_FAILURE`, `CAPABILITY_GAP`, `CONFLICT`, and `SUPERSEDED`.

While execution/validation/promotion is active, the intended assistant action is `none`. A successful canonical completion is terminal closure with `validation_closed=true`, `promotion_completed=true`, and `permitted_next_action=none`.

## No polling loop

The orchestrator does not expose GitHub Actions as the primary transaction model. GitHub Telemetry projects `workflow_run: completed` into an orchestrator terminal record and commit status. On failure, telemetry performs one terminal lookup of the completed run's jobs so the failure record can name the failed stage without repeated assistant polling.

## Identical failure stickiness

Before FilePatcher mutation, `toolchain:execute` checks recent semantic request history and the canonical `frame-conn/orchestrator` terminal status. If the same request fingerprint already failed, execution is blocked as `BLOCKED_IDENTICAL_FAILURE`; the only permitted next action is to materially modify the canonical request according to the failure diagnostic. If the identical request already succeeded, it remains closed and is not re-executed.

A materially changed request receives a new fingerprint and may supersede a prior failed request.

## Single mutation authority and conflicts

The normal mutation authority for bounded requests is FilePatcher. At preflight the orchestrator performs a single GitHub Actions carrier read for known mutation workflows. If another known mutation owner is active on the same branch, it fails closed with `CONFLICT / MULTIPLE_MUTATION_AUTHORITIES`. This is a one-time ownership check, not a polling loop.

The orchestrator does not create alternate workflows, helper patchers, marker files, or branch machinery to escape a conflict.

## Direct GitHub exceptions

The machine-readable contract always reports `direct_github_mutation_permitted=false`. When the canonical toolchain has a demonstrated capability gap, callers should use the exported `buildCapabilityGapRecord(...)` contract to surface the requested operation, canonical path, exact missing capability, blocking reason, smallest direct action, affected paths/refs, resumed authority, and explicit user-authorization requirement. The orchestrator never silently grants that exception.

## Telemetry integration

The existing `github-telemetry.mjs` receipt carries the request identity for GitHub FilePatcher runs. At terminal completion telemetry maps success/failure into the orchestrator state model, fetches terminal failed-step evidence once when needed, embeds the compact orchestrator record in `github-telemetry-report.json`, and publishes `frame-conn/orchestrator` status on the triggering request commit and result commit.

## Boundaries

The orchestrator must not modify target repository files, implement FilePatcher operations, derive Patch Corridors, reproduce audits, invent validation, perform promotion, repair unrelated repository debt, create temporary escape infrastructure, or automatically authorize direct GitHub writes.

It constrains interaction; it does not replace engineering.
