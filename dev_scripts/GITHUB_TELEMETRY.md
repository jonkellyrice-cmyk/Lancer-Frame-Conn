# GitHub Completion Telemetry

`dev_scripts/github-telemetry.mjs` is the event-driven completion layer for Frame Conn's GitHub development workflows.

Its purpose is to replace repeated workflow-job polling with a durable terminal signal emitted automatically when a repository process finishes.

## Monitored workflows

The telemetry workflow currently observes:

- `GitHub FilePatcher`
- `Path Mover`
- `Domain Decomposer`

Each originating workflow emits a completion receipt in an `if: always()` step after its normal commit/apply work. The receipt is uploaded as:

```text
frame-conn-telemetry-<workflow-run-id>
```

The dedicated `.github/workflows/github-telemetry.yml` workflow is triggered by `workflow_run: completed`. It downloads the receipt, normalizes the final state, and publishes a terminal GitHub commit status.

## Why the receipt exists

For mutation workflows, `github.event.workflow_run.head_sha` is the commit that *triggered* the workflow. It is not necessarily the commit produced by the workflow.

For example:

```text
staging commit
  -> GitHub FilePatcher
  -> github-actions[bot] implementation commit
```

The receipt records both:

- `triggeringSha`
- `resultCommitSha`

`resultCommitSha` is captured from `git rev-parse HEAD` after the originating workflow's commit step, so completion telemetry can attach to the actual resulting implementation commit when one exists.

## Commands

Run the deterministic self-test:

```bash
npm run github:telemetry:self-test
```

Emit a completion receipt manually:

```bash
npm run github:telemetry -- emit --workflow "GitHub FilePatcher" --conclusion success --output github-telemetry-receipt.json
```

Normalize/publish a `workflow_run` event:

```bash
npm run github:telemetry -- publish \
  --event-file "$GITHUB_EVENT_PATH" \
  --receipt-dir .github-telemetry-input \
  --output github-telemetry-report.json
```

Use `--dry-run` with `publish` to build the normalized report without posting a commit status.

## Published state

The telemetry workflow publishes a GitHub commit status with context:

```text
frame-conn/telemetry/<workflow-slug>
```

The status is one of:

- `success`
- `failure`
- `error`

The description contains the workflow name and terminal conclusion, and the status target points to the originating Actions run.

A normalized JSON report is also uploaded as:

```text
frame-conn-telemetry-report-<workflow-run-id>
```

and retained for 30 days.

## Operator workflow

Before telemetry:

```text
trigger workflow
  -> poll workflow run
  -> poll jobs
  -> poll again
  -> discover commit
```

With telemetry:

```text
trigger workflow
  -> originating workflow automatically emits receipt
  -> GitHub automatically triggers telemetry on completion
  -> telemetry publishes terminal status on result commit
  -> consume the terminal telemetry state
```

The repository side is fully event-driven. A ChatGPT/GitHub connector session cannot receive unsolicited webhook callbacks into an already-running assistant turn, so the telemetry layer cannot itself inject a new chat message. Its role is to ensure that completion is already recorded as canonical GitHub state, eliminating the need to repeatedly poll the originating workflow's job state.

## Failure behavior

The receipt steps use `if: always()` so they still run after normal workflow-step failures whenever checkout and the runner remain available.

If a receipt cannot be downloaded, the telemetry publisher falls back to the `workflow_run.head_sha` and records `receiptAvailable: false`. This preserves a terminal completion signal even when the richer result-commit evidence is unavailable.

Telemetry never mutates source files and never commits its generated reports back to the repository, preventing completion-report loops.
