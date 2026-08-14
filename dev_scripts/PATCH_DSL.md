# Frame Conn Patch DSL

`patch-dsl-compiler.mjs` is a small authoring shorthand for GitHub FilePatcher patches. It does **not** patch source code itself. It compiles `dev-scripts/filepatcher.dsl` into the normal schema-v2 `dev-scripts/filepatcher.json`, which remains the only executable patch contract.

## Commands

```bash
npm run patch:dsl:check   # parse/validate only
npm run patch:dsl         # compile DSL -> dev-scripts/filepatcher.json
npm run patch:dsl:self-test
npm run github:patch -- --dry-run
npm run github:patch
```

## Core syntax

```text
patch my-patch-id
description "Optional description"
goal "Optional Patch Corridor planning goal"
max-files 3

file scripts/example.js
within someTopLevelFunction
replace once
<<<
old expression
>>>
with
<<<
new expression
>>>

global
after once
<<<
anchor text
>>>
add
<<<

inserted text
>>>
```

`within <symbol>` scopes subsequent text edits to one top-level function, class, or simple binding. The compiler expands the whole symbol into an exact `replace_text` operation, so FilePatcher still executes a deterministic exact-text patch.

Use `global` to leave symbol scope.

## Edit primitives

- `replace once|all|optional` + block + `with` block
- `before once|all|optional` + block + `add` block
- `after once|all|optional` + block + `add` block
- `delete once|all|optional` + block
- `create <path>` + block
- `rewrite <path>` + block
- `raw` + block containing one native FilePatcher operation object

`once` is the default. `all` compiles the exact current occurrence count into `expected_occurrences`. `optional` emits no operation when the search is absent; otherwise it emits the exact count.

Blocks use `<<<` and `>>>` and preserve their contents exactly. For `before`/`after`, include a leading or trailing blank line in the `add` block when a newline is desired.

## Escape hatch

```text
raw
<<<
{
  "type": "replace_text",
  "path": "scripts/example.js",
  "search": "A",
  "replace": "B",
  "expected_occurrences": 2
}
>>>
```

The DSL intentionally has no loops, variables, functions, conditions, or hidden architectural macros. It compresses repetitive FilePatcher authoring; it does not replace FilePatcher semantics.
