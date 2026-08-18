# Failure Evidence Extractor

`dev_scripts/failure-evidence-extractor.mjs` is the terminal-failure compression layer for the canonical development workflow.

It exists so a chat instance does not have to reconstruct a failed GitHub Actions transaction by repeatedly opening workflow runs, jobs, steps, and full logs.

It does **not** poll, retry, validate independently, repair code, broaden scope, or choose a mutation mechanism.

## Canonical placement

```text
canonical mutation workflow
    ↓
terminal failure
    ↓
Failure Evidence Extractor
  one jobs read
  one failed-job log read
  compact error neighborhoods
  request-scope comparison
  canonical baseline delta when available
    ↓
Toolchain Orchestrator FAILED record
    ↓
permitted_next_action = modify_request
```

GitHub Completion Telemetry invokes the extractor automatically only after an unsuccessful terminal `workflow_run`.

## Output contract

The compact record contains:

- failed stage;
- failure class;
- concise summary;
- request scope;
- regression classification;
- failed job/step identity;
- repository paths evidenced by the terminal log;
- a bounded set of nearby error lines;
- the failed job ID for targeted raw-log expansion when genuinely necessary;
- `permitted_next_action: "modify_request"`.

Full logs are not copied into assistant-facing state.

## Regression classification

The extractor is deliberately conservative.

When canonical before/after evidence is supplied, it can report:

```text
pre_existing_only
request_regression
introduced_outside_request_scope
```

Without a baseline, log/path evidence can only establish:

```text
request_scope_failure
outside_request_scope_unproven
undetermined
```

`outside_request_scope_unproven` is intentional. An error outside the bounded patch is not automatically proof that it existed before the request.

## Commands

Run the deterministic self-test:

```bash
npm run failure-evidence:self-test
```

Extract from an existing telemetry report:

```bash
npm run failure-evidence -- \
  --report github-telemetry-report.json \
  --output failure-evidence.json
```

Use an already-downloaded failed-job log:

```bash
npm run failure-evidence -- \
  --report github-telemetry-report.json \
  --log failed-job.log
```

Supply canonical before/after diagnostic documents when available:

```bash
npm run failure-evidence -- \
  --report github-telemetry-report.json \
  --baseline before-audit.json \
  --current after-audit.json
```

## Safety and scope

The extractor:

- reads GitHub job state only after terminal failure;
- reads at most the selected failed job log in the automatic path;
- redacts common token forms from excerpts;
- limits the number and length of log lines surfaced;
- does not execute shell commands from logs;
- does not infer that unrelated findings should be fixed;
- does not change the repository;
- never resubmits the failed request.

The orchestrator remains the authority for what the assistant may do next.
