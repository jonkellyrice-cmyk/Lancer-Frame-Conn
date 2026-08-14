# GitHub FilePatcher

`dev-scripts/github-filepatcher.mjs` is a small deterministic repository mutation tool designed for changes authored through GitHub rather than an interactive local checkout.

It exists because large direct source-file writes through API tooling can be fragile, difficult to review, or rejected by intermediary safety systems. Instead of asking a remote agent to rewrite arbitrary repository files directly, the agent writes a compact declarative patch to `dev-scripts/filepatcher.json`. GitHub Actions then checks out the repository, dry-runs the patch, applies it locally, validates the resulting diff, and commits the verified source change.

The separation is intentional:

```text
model proposes
      ↓
JSON constrains
      ↓
patcher decides
      ↓
runner executes
      ↓
validation proves
      ↓
Git records
```

## Relationship to the existing Python FilePatcher

Frame Conn already has the larger local FilePatcher under `dev_scripts/`:

```bash
npm run patch
```

That tool is unchanged. The GitHub-native patcher lives separately under the hyphenated `dev-scripts/` directory:

```bash
npm run github:patch
```

The Python tool is the richer local authoring/validation system. The GitHub FilePatcher is the compact remote-execution bridge used when only the JSON patch specification should be written through the GitHub API and the actual source mutation should happen inside GitHub Actions.

## Components

```text
dev-scripts/
  github-filepatcher.mjs   deterministic patch executor
  filepatcher.json         authoritative GitHub patch specification
  README.md                this document

.github/workflows/
  github-filepatcher.yml   automatic GitHub Actions runner

package.json
  github:patch             npm entry point
```

## Supported operations

### replace_text

Exact replacement in an existing file:

```json
{
  "type": "replace_text",
  "path": "some/file.js",
  "search": "const oldValue = true;",
  "replace": "const newValue = true;",
  "expected_occurrences": 1
}
```

Without `expected_occurrences`, the search text must occur exactly once. Ambiguous replacement fails.

### create_file

```json
{
  "type": "create_file",
  "path": "some/new-file.js",
  "content": "export const example = true;\n"
}
```

Existing files are protected unless `overwrite: true` is explicitly supplied.

### replace_file

```json
{
  "type": "replace_file",
  "path": "some/existing-file.js",
  "content": "export const replacement = true;\n"
}
```

`create_file` and `replace_file` accept `encoding: "utf8"` or `encoding: "base64"`.

## Patch document

```json
{
  "schema_version": 2,
  "id": "short-descriptive-patch-id",
  "description": "Describe the intended repository change.",
  "policy": {
    "max_files_changed": 1
  },
  "operations": [
    {
      "type": "replace_text",
      "path": "example.js",
      "search": "old text",
      "replace": "new text",
      "expected_occurrences": 1
    }
  ]
}
```

Schema versions 1 and 2 are accepted; version 2 is recommended. `policy.max_files_changed` defaults to 1, which makes one-file/one-commit work the default rather than a convention.

## Safety properties

The executor rejects paths that escape the repository root or target the repository root itself. `.git`, `.github/workflows`, and `node_modules` are protected by default; additional protected paths can be added with `policy.protected_paths`.

All operations are planned in memory before any file is written. Multiple operations against one file see the staged result of the previous operation. The executor computes the final set of changed files and rejects the patch if it exceeds `policy.max_files_changed`.

If the write phase fails partway through, the executor attempts to restore every file already written.

Operations may specify `expected_sha256`; a stale source file then causes the patch to fail instead of applying against unexpected content.

There is no arbitrary shell-command operation, delete operation, or move operation in the JSON DSL.

## Local use

Preview without changing files:

```bash
npm run github:patch -- --dry-run
```

Apply locally:

```bash
npm run github:patch
```

Dry-run and apply use the same planning logic; dry-run stops before the transaction writes to disk.

## GitHub Actions workflow

The workflow must live at:

```text
.github/workflows/github-filepatcher.yml
```

It triggers on pushes to `main` that change:

```text
dev-scripts/filepatcher.json
```

Execution order:

```text
push filepatcher.json
        ↓
checkout main
        ↓
validate patcher syntax
        ↓
dry-run
        ↓
apply
        ↓
detect tracked + untracked changes
        ↓
git diff --check
        ↓
stage
        ↓
commit as github-actions[bot]
        ↓
push verified patch
```

Change detection uses `git status --porcelain`, so `create_file` operations are detected even though newly created files are initially untracked.

The workflow is concurrency-serialized (`cancel-in-progress: false`) and requests `contents: write` because the verified result must be pushed back to the repository.

## Normal remote workflow

1. Inspect the current target source file.
2. Author a narrow `dev-scripts/filepatcher.json` against that exact source.
3. Keep `policy.max_files_changed` at 1 unless a broader atomic patch is intentionally required.
4. Push only the patch specification.
5. Wait for the `GitHub FilePatcher` Action.
6. Confirm dry-run, apply, diff validation, and bot commit succeeded.
7. Inspect the bot-created source commit before writing the next patch.

The remote agent therefore performs only a small API write; deterministic code on the runner performs the real source mutation.

## Neutral/no-op state

```json
{
  "schema_version": 2,
  "id": "ready",
  "description": "No-op placeholder. Replace operations with the next GitHub FilePatcher change.",
  "policy": {
    "max_files_changed": 1
  },
  "operations": []
}
```

## Repository-specific validation

This Frame Conn repo does not currently expose the same TypeScript typecheck and integration-test npm scripts as the agentic project where this workflow was first hardened. The generic workflow therefore validates the FilePatcher syntax and Git diff before committing. When deterministic Lancer-specific validation commands are added, put them before `Commit verified patch`; any failure will then prevent the source commit.
