# Toolchain Compatibility Staging

`dev_scripts/toolchain-compatibility-staging.mjs` formalizes the safe transition sequence for changes to the developer toolchain itself.

It is **not** a bootstrapper, mutation engine, alternate validator, or self-hosting generation system. It inspects the exact staged before/after transition that FilePatcher already owns and determines whether the proposed toolchain state can safely replace the currently-installed state.

## Purpose

Toolchain changes are unusual because the code performing repository validation may itself be changing. The compatibility stage makes the transition explicit:

```text
current installed tool health
    ↓
proposed tool syntax in isolated overlay
    ↓
registered proposed self-tests in isolated overlay
    ↓
compatibility decision
    ↓
return control to FilePatcher
```

No repository target file is written by this tool.

## Automatic FilePatcher integration

GitHub FilePatcher invokes the compatibility stage after its exact mutation plan exists and before Change Propagation or mutation whenever the staged change touches executable toolchain files such as:

- `dev_scripts/*.mjs`, `.js`, `.cjs`, or `.py`;
- `dev_scripts/filepatcher.py`;
- `package.json`.

Ordinary gameplay/application changes are reported as non-applicable and continue without extra compatibility work.

## Checks

For changed existing JavaScript tools, the current installed version is syntax-checked and its registered `*:self-test` command is run when one exists.

The proposed `dev_scripts/` tree is then assembled in a temporary isolated overlay. Staged file contents replace the current copies only in that overlay. Proposed JavaScript tools receive `node --check`, and proposed package-registered self-tests are executed against the overlay.

A failure blocks the bounded request before mutation and returns:

```text
compatible=false
permitted_next_action=modify_request
```

## Command surface

```bash
npm run toolchain-compatibility -- --snapshot transition.json --output /tmp/toolchain-compatibility.json
npm run toolchain-compatibility:self-test
```

The snapshot uses the same exact before/after model already produced by FilePatcher:

```json
{
  "changes": [
    {
      "path": "dev_scripts/example.mjs",
      "beforeExists": true,
      "before": "...",
      "afterExists": true,
      "after": "..."
    }
  ]
}
```

## Authority boundary

The tool is authoritative only for the compatibility sequencing of a proposed developer-tool transition:

- current changed-tool health;
- proposed JavaScript syntax;
- registered proposed self-tests;
- whether FilePatcher may safely continue with that toolchain transition.

It is not authoritative for architecture, patch semantics, mutation, application correctness, promotion, or protected-infrastructure publication.

The FilePatcher remains the mutation authority. The Toolchain Orchestrator remains the interaction/state authority. Infrastructure Publisher remains the explicit protected-file exception boundary.
