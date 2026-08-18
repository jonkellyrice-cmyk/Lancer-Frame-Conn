# Patch Authoring Compiler

`dev_scripts/patch-authoring-compiler.mjs` converts an **explicit semantic authoring intent** into ordinary GitHub FilePatcher schema-v2 operations.

It exists to remove repetitive low-level JSON authoring while preserving the existing authority model:

```text
Request Envelope
→ Assistant Context Broker
→ certified Patch Corridor
→ Corridor Context Pack
→ explicit authoring_intent
→ Patch Authoring Compiler
→ ordinary FilePatcher operations
→ existing mutation / validation / promotion path
```

The compiler is **not a planner** and does not decide what code should do. It only compiles explicit edit instructions already supplied by the assistant/user.

## Authority boundary

The compiler owns:

- translating explicit authoring primitives into supported FilePatcher operations;
- adding `expected_sha256` source guards to the first operation against each existing file;
- enforcing declared Request Envelope / policy scope;
- enforcing certified Patch Corridor scope when a corridor is supplied;
- detecting Assistant Context Broker snapshot drift;
- producing a deterministic compilation fingerprint.

It does **not** own:

- architectural ownership;
- Patch Corridor certification;
- invention of semantic edits;
- mutation execution;
- validation;
- promotion.

## Integrated request form

A normal `dev_scripts/github-filepatcher.json` may continue to contain ordinary `operations`.

Alternatively, it may contain `authoring_intent` plus an empty `operations` array:

```json
{
  "schema_version": 2,
  "id": "example",
  "planning_goal": "Change the example behavior.",
  "policy": {
    "max_files_changed": 1,
    "allowed_paths": ["scripts/example.js"]
  },
  "authoring_intent": {
    "edits": [
      {
        "kind": "replace_exact",
        "path": "scripts/example.js",
        "search": "export const VALUE = 1;",
        "replace": "export const VALUE = 2;"
      }
    ]
  },
  "operations": []
}
```

When `authoring_intent` is present, GitHub FilePatcher gathers the Request Envelope, Context Broker packet, Patch Corridor, and Corridor Context first. It then invokes the compiler and feeds the compiled ordinary patch into the unchanged FilePatcher mutation planner.

## Supported authoring primitives

### `replace_exact`

Compiles to `replace_text`.

```json
{
  "kind": "replace_exact",
  "path": "scripts/example.js",
  "search": "old",
  "replace": "new",
  "expected_occurrences": 1
}
```

### `insert_before_exact`

Compiles to a `replace_text` that preserves the anchor after inserted content.

### `insert_after_exact`

Compiles to a `replace_text` that preserves the anchor before inserted content.

### `delete_exact`

Compiles to `replace_text` with an empty replacement.

### `create_file`

Compiles directly to FilePatcher `create_file`.

### `replace_file`

Compiles directly to FilePatcher `replace_file`.

The compiler intentionally does not expose arbitrary shell commands, filesystem deletion, moves, or direct GitHub writes.

## Source guards

For the first compiled operation against each existing file, the compiler computes the current SHA-256 and writes it as:

```json
{
  "expected_sha256": "..."
}
```

If the Context Broker packet contains a hash for that file, the compiler first checks that the packet hash still matches the repository. Drift fails closed before a patch is emitted.

## Scope rules

If the Request Envelope or request policy declares paths, every authoring target must be inside that scope.

When a certified Patch Corridor is supplied, every target must also appear in the corridor. Standalone use can override this only with the explicit `--allow-outside-corridor` flag; the integrated canonical FilePatcher path does not use that escape hatch.

## Standalone use

```bash
npm run patch-authoring -- \
  --request dev_scripts/github-filepatcher.json \
  --envelope /tmp/request-envelope.json \
  --context /tmp/context.json \
  --corridor /tmp/corridor.json \
  --corridor-context /tmp/corridor-context.json \
  --output /tmp/compiled-patch.json
```

Self-test:

```bash
npm run patch-authoring:self-test
```

## Relationship to the Patch DSL

The existing Patch DSL remains useful when an author already knows the exact FilePatcher operation structure or wants pattern-aware structural shorthand.

The Patch Authoring Compiler sits one level earlier:

```text
explicit semantic edit intent
→ Patch Authoring Compiler
→ ordinary FilePatcher JSON

pattern-aware shorthand
→ Patch DSL compiler
→ ordinary FilePatcher JSON
```

Both converge on the same mutation authority. Neither replaces FilePatcher.
