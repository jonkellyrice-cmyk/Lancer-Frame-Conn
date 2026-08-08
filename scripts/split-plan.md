/**
 * ============================================================
 * REPEATABLE FEATURE-DOMAIN SPLIT PROCEDURE
 * ============================================================
 *
 * For each domain currently embedded in lancer-frame-helm.js:
 *
 * 1. IDENTIFY OWNERSHIP
 *    - Mark all state, classes, constants, helpers, commands,
 *      queries, Foundry hooks, and public API members owned by
 *      that domain.
 *    - Identify which other domains it consumes.
 *
 * 2. MOVE IMPLEMENTATION INTACT
 *    - Create <domain>-feature.js beside lancer-frame-helm.js.
 *    - Move the domain implementation without redesigning its
 *      gameplay behavior or changing names unnecessarily.
 *
 * 3. DEFINE THE FEATURE CONTRACT
 *    - Import defineFrameHelmFeature().
 *    - Wrap the domain with:
 *
 *      defineFrameHelmFeature({
 *        id,
 *        domain,
 *        provides,
 *        dependsOn,
 *        optionalDependsOn,
 *        state,
 *        commands,
 *        queries,
 *        hooks,
 *        lifecycle,
 *        api
 *      });
 *
 * 4. DECLARE CAPABILITIES
 *    - `provides` describes what this domain owns for other
 *      features.
 *    - `dependsOn` lists required capabilities.
 *    - `optionalDependsOn` lists integrations that may be absent.
 *    - Prefer capability names such as:
 *        actions.registry
 *        turn.state
 *        movement.tracking
 *        sensors.contacts
 *        telemetry.read
 *
 * 5. MOVE FOUNDRY HOOKS INTO THE FEATURE
 *    - Replace domain-owned Hooks.on(...) registrations with
 *      entries in the feature’s `hooks` record.
 *    - Do not leave duplicate manual hook registration in
 *      lancer-frame-helm.js.
 *
 * 6. DEFINE THE DOMAIN SURFACE
 *    - Mutable owned objects go under `state`.
 *    - State-changing operations go under `commands`.
 *    - Read-only lookups/calculations go under `queries`.
 *    - Intentionally consumable external surface goes under `api`.
 *    - Do not expose live mutable values through getters in the
 *      feature definition record; use functions when necessary.
 *
 * 7. REPLACE THE HOLE IN THE MAIN FILE
 *    - Import the new feature definition.
 *    - Register it with frameHelmFeatureRegistry.
 *    - Remove the implementation that was moved.
 *    - Leave only composition/root-level wiring behind.
 *
 * 8. VALIDATE DEPENDENCIES
 *    - Register all extracted features first.
 *    - Run frameHelmFeatureRegistry.validateDependencies().
 *    - Keep registration order readable even though the registry
 *      can dependency-order lifecycle execution.
 *
 * 9. PRESERVE STARTUP SEMANTICS
 *    - Do not move timing-sensitive Foundry init/ready behavior
 *      behind async lifecycle execution unless we explicitly
 *      verify that it is safe.
 *    - During migration, synchronous startup behavior may remain
 *      in lancer-frame-helm.js and call feature commands/APIs.
 *
 * 10. VERIFY PARITY
 *     - Compare the new feature against the removed block.
 *     - Confirm no functions, hooks, constants, state, public API,
 *       or behavior disappeared.
 *     - Only then move to the next domain.
 *
 * RESULT:
 *
 *   lancer-frame-helm.js becomes progressively smaller and acts
 *   only as the explicit composition root, while each extracted
 *   domain becomes independently owned, contracted, registered,
 *   and eventually lifecycle-managed.
 * ============================================================
 */