# Request Envelope

`dev_scripts/request-envelope.mjs` owns the durable semantic identity for a bounded repository request.

It does **not** plan architecture, choose a mutation carrier, edit repository target files, validate code, or promote changes. It normalizes the request that those tools operate on.

## Command surface

```bash
npm run request-envelope -- --request dev_scripts/github-filepatcher.json --output /tmp/request-envelope.json
npm run request-envelope -- show --request dev_scripts/github-filepatcher.json
npm run request-envelope:self-test
```

## Envelope contract

The envelope records:

- semantic request identity and SHA-256 fingerprint;
- goal / `planning_goal`;
- explicit acceptance criteria;
- non-goals;
- declared scope, `policy.allowed_paths`, FilePatcher operation/authoring paths, Path Mover `from`/`to` paths, and Domain Decomposer source/extraction targets;
- supplied evidence;
- a manifest slot for downstream artifact/result references;
- the source request path and human-facing metadata.

Human labels such as `id` and `description`, runtime metadata, telemetry, downstream artifact/result references, low-level raw-operations justification text, and Path Mover completion timestamps are excluded from the **semantic request fingerprint**. Changing actual requested semantics, carrier structure, scope, operations/moves/decomposition, policy, acceptance criteria, or non-goals changes the fingerprint. This prevents explanatory or post-execution metadata from manufacturing a new request identity after a terminal result.

## Authority boundary

The Request Envelope is authoritative for:

```text
semantic request identity
goal
acceptance criteria
non-goals
declared scope
request artifact index
```

It is not authoritative for:

```text
architectural ownership
Patch Corridor certification
mutation semantics
validation
promotion
```

The Toolchain Orchestrator consumes the Request Envelope identity instead of maintaining a competing fingerprint implementation.

## Canonical placement

```text
bounded request
    ↓
Request Envelope
  normalize intent/scope/evidence + derive semantic identity
    ↓
Toolchain Orchestrator preflight
    ↓
Assistant Context Broker
    ↓
Native Contract / discovery tools
    ↓
Patch Corridor
    ↓
Corridor Context + staging
    ↓
FilePatcher
    ↓
Change Propagation
    ↓
validation / promotion
    ↓
telemetry / terminal closure
```

The envelope may expose downstream artifact references as a manifest, but those artifacts remain owned by their producing tools.
