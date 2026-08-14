# Frame Conn Integration Surface Atlas

The Integration Surface Atlas is a static discovery tool for the **authoritative native Foundry Lancer system**. It exists to answer a different question from the repository diagnostics:

> Where does native Lancer expose the Flow, hook, runtime API, chat control, document entry point, or mutation boundary needed for this behavior?

It does **not** execute native code, infer undocumented APIs, or decide that a surface is safe merely because it exists. It narrows native-system investigation to source-backed candidates with file/line evidence.

## Commands

Query the checked-in native snapshot:

```bash
npm run integration-atlas -- --query "damage attack flow"
```

Limit results:

```bash
npm run integration-atlas -- --query "target hook" --limit 20
```

Regenerate from an authoritative native Lancer checkout:

```bash
npm run integration-atlas -- --native-root /path/to/foundryvtt-lancer
```

Regenerate to a different report:

```bash
npm run integration-atlas -- --native-root /path/to/foundryvtt-lancer --output dev_scripts/native-integration-surface-atlas.json
```

Run the synthetic extraction test:

```bash
npm run integration-atlas:self-test
```

## What it indexes

The current atlas recognizes these integration-surface families:

- **Flow definitions** and their statically declared ordered `steps`.
- **Flow registrations** in the native Flow registry.
- **Flow-step registrations** such as `flowSteps.set(...)`.
- The public **`lancer.registerFlows` extension hook**.
- Native and Foundry **hook emitters/listeners**, including dynamic Flow lifecycle hook names.
- **`game.lancer.*` runtime surfaces** referenced by native code.
- Integration-relevant **LancerActor/LancerItem/LancerToken methods**.
- Integration-relevant **exported native functions**.
- **Chat-message controls/event handlers** involved in native interaction.
- **Foundry document mutation boundaries**.
- **Embedded-document mutation boundaries**.
- The authoritative **`damageCalc` damage application boundary**.
- Explicit **Map-based registries**.

Each surface records its kind, name, source file, source line, tags, and a short structural description. Flow definitions additionally record their ordered native steps when those steps can be statically resolved.

## Checked-in snapshot

`dev_scripts/native-integration-surface-atlas.json` is a portable snapshot generated from the native Lancer source used during development. Its header records:

- native version;
- number of scanned source files;
- a SHA-256 fingerprint of the scanned source set;
- atlas tool version.

The snapshot exists so Patch planning and source investigation can query known native surfaces without requiring the native repository to be present in every environment.

**The snapshot is evidence, not eternal truth.** If the installed/native Lancer version changes, regenerate it from that authoritative source before relying on it for a new integration.

## Safety posture

The atlas follows the same fail-safe philosophy as the rest of the suite:

1. It reports only surfaces statically present in the scanned source.
2. It does not fabricate missing hooks, Flows, methods, or registries.
3. A search hit is a **candidate integration surface**, not permission to bypass Frame Conn architecture.
4. Native ownership still wins: prefer the native entry point/Flow/mutation path that already owns the behavior.
5. If several candidates exist, inspect the relevant source before selecting one.
6. If the native version/fingerprint is stale, regenerate the atlas rather than assuming compatibility.

## Relationship to the other tools

```text
Integration Surface Atlas
  Where can Frame Conn meet native Lancer?

Dependency Watershed
  Where does Frame Conn code flow?

Symbol Family Tree
  What Frame Conn machinery exists?

Effect Atlas
  Where does Frame Conn change state?

Patch Corridor
  Which Frame Conn path probably needs modification?
```

The atlas is deliberately orthogonal to those diagnostics. Its job is to remove native-system discovery friction, especially around Flows, hooks, chat actions, actor/item entry points, and authoritative mutation boundaries.
