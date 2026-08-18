# Mutation Carrier Router

`dev_scripts/mutation-carrier-router.mjs` maps one bounded request to the existing canonical mutation authority.

It does **not** edit files, move paths, decompose domains, trigger GitHub workflows, invent a patch, or validate results.

## Canonical carriers

```text
filepatcher        -> GitHub FilePatcher
path_mover         -> Path Mover
domain_decomposer  -> Domain Decomposer
```

## Usage

```bash
npm run mutation-route -- --request dev_scripts/github-filepatcher.json
npm run mutation-route:self-test
```

The machine-readable result contains the selected `mutation_authority`, canonical workflow/executor/config paths, evidence for the classification, and whether the carrier-specific request is currently executable.

## Routing rules

Structural request shape is authoritative evidence:

```text
operations / authoring_intent
  -> filepatcher

moves / request_kind=relocation
  -> path_mover

candidates / decomposition_plan / request_kind=decomposition
  -> domain_decomposer
```

A request may declare `mutation_carrier` explicitly. The explicit value may disambiguate a request with no structural signature, but it may not contradict a detected structural signature.

Multiple structural signatures fail closed as `CONFLICT`.

No recognized signature fails closed as `UNROUTABLE`.

## Authority boundary

The router is authoritative only for:

- canonical carrier classification;
- carrier metadata lookup;
- ambiguous-carrier detection;
- carrier-specific execution readiness.

It is not authoritative for:

- architectural ownership;
- semantic request identity;
- patch planning;
- mutation semantics;
- execution;
- validation;
- promotion.

The Toolchain Orchestrator consumes the route and applies interaction policy. The selected carrier still owns the repository mutation.

## Canonical placement

```text
Request Envelope
    ↓
Mutation Carrier Router
    ↓
Toolchain Orchestrator
  one active authority / sticky terminal state
    ↓
selected existing carrier
  FilePatcher | Path Mover | Domain Decomposer
```

For ordinary GitHub FilePatcher requests this produces `mutation_authority=filepatcher`; there is no behavioral change to the patch executor.
