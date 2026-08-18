# Assistant Context Broker

## Purpose

`assistant-context-broker.mjs` is the bounded repository-discovery boundary for assistant-driven development work. It reduces repeated GitHub search/fetch reconstruction by turning one behavioral goal or symbol into one compact repository context packet.

It is deliberately **pre-corridor**. It does not decide architectural ownership, mutation order, native-system authority, or correctness. Those responsibilities remain with Patch Corridor, Corridor Context, the Native Contract Catalog/runtime evidence tools, FilePatcher, Change Propagation, and validation.

## Commands

```bash
npm run context-broker -- --goal "wire committed Scan through native execution" --output /tmp/context.json
npm run context-broker -- --symbol renderCommittedPlan --output /tmp/context.json
npm run context-broker:self-test
```

Useful bounds:

```bash
--max-files 12
--max-slices 18
--context-lines 8
--print
```

Without `--output`, the full packet is printed to stdout. With an output path, normal output is a compact summary unless `--print` is also supplied.

## Packet contents

The packet contains:

- the behavioral goal and normalized search tokens;
- current repository `HEAD`, branch, dirty-state signal, and a snapshot fingerprint;
- SHA-256 and byte size for every selected file;
- bounded file ranking with evidence for why each file matched;
- bounded source slices around matching lines;
- direct resolved local imports from selected files;
- direct importers of selected files;
- bounded exact symbol references when `--symbol` is supplied;
- explicit authority/non-authority boundaries.

The snapshot fingerprint binds the packet to the repository state it was derived from. It is evidence of authoring context, not a mutation lock; future request/snapshot tooling may use it for stronger drift handling.

## Canonical placement

The canonical flow is now:

```text
behavioral request
  -> Assistant Context Broker
  -> native-contract reuse / native discovery as required
  -> repository audit + symbol-family graph + effect atlas
  -> certified Patch Corridor
  -> Corridor Context
  -> provider-first staging
  -> FilePatcher
  -> Change Propagation Simulator
  -> validation / promotion
  -> terminal telemetry/orchestrator closure
```

GitHub FilePatcher automatically invokes the broker in report-only mode whenever `planning_goal` is present, before Patch Corridor. Planning-only FilePatcher requests therefore receive the same broad discovery/snapshot evidence before architectural certification.

## Boundary with Corridor Context

The two tools intentionally answer different questions.

**Assistant Context Broker:** What repository material is plausibly relevant to this goal, and what exact repository snapshot produced that evidence?

**Patch Corridor + Corridor Context:** Which architectural owners are certified for the requested clauses, and what exact source slices/imports/callers/exemplars should patch authoring use inside that certified corridor?

The broker may find material that Patch Corridor later rejects as non-authoritative. That is expected. The broker cannot broaden a certified corridor.

## Design constraints

- Read-only with respect to repository target files.
- Uses Git-tracked repository files as its search substrate.
- Bounded output by file count, slice count, and context radius.
- Does not replace GitHub-specific reads for PR identity or other external carrier state.
- Does not replace native Lancer source discovery when native contracts are required.
- Does not invent semantic call graphs from ambiguous lexical references.
- Direct import/importer edges are reported only when relative module resolution succeeds against tracked files.
