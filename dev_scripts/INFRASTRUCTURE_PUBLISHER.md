# Infrastructure Publisher

`dev_scripts/infrastructure-publisher.mjs` is the narrow privileged publication boundary for a demonstrated Toolchain Orchestrator `CAPABILITY_GAP`.

It is **not** a normal mutation carrier and is intentionally absent from the Mutation Carrier Router's ordinary FilePatcher / Path Mover / Domain Decomposer choices.

## Purpose

FilePatcher protects `.github/workflows/**` by design. When a bounded request genuinely requires publication of one of those files and the canonical carrier cannot publish it, the orchestrator must surface a capability gap and the user must explicitly authorize the smallest direct exception.

The Infrastructure Publisher turns that one authorized exception into a guarded GitHub Contents API publication.

## v1 scope

Version 1 permits exactly one changed path and only under:

```text
.github/workflows/
```

One authorization cannot publish multiple files.

## Required manifest

```json
{
  "schema_version": 1,
  "repository": "owner/repo",
  "branch": "main",
  "capability_gap_record": {
    "state": "CAPABILITY_GAP",
    "request": { "fingerprint": "..." },
    "capability_gap": {
      "affected_paths_or_refs": [".github/workflows/example.yml"]
    }
  },
  "authorization": {
    "explicit": true,
    "request_fingerprint": "...",
    "authorized_paths": [".github/workflows/example.yml"]
  },
  "changes": [{
    "path": ".github/workflows/example.yml",
    "content_file": "./reviewed-example.yml",
    "expected_current_sha256": "...",
    "expected_proposed_sha256": "..."
  }]
}
```

For creation, `expected_current_sha256` is `null`.

The publisher checks the current GitHub file content before publication. Drift invalidates the authorization instead of silently publishing against a changed file.

## Commands

Preflight only:

```bash
GITHUB_TOKEN=... npm run infrastructure:publish -- --manifest /tmp/infrastructure-publication.json
```

Publish the explicitly authorized exception:

```bash
GITHUB_TOKEN=... npm run infrastructure:publish -- --manifest /tmp/infrastructure-publication.json --publish --output /tmp/publication-receipt.json
```

Self-test:

```bash
npm run infrastructure:publish:self-test
```

## Authority boundary

The publisher is authoritative only for the smallest explicitly authorized protected-file publication after `CAPABILITY_GAP`.

It does not:

- discover a capability gap;
- infer user authorization;
- plan source changes;
- mutate ordinary application/tool files;
- replace FilePatcher;
- validate application semantics;
- promote unrelated changes;
- become a fourth normal mutation carrier.

After the publication receipt is produced, normal canonical toolchain authority resumes.
