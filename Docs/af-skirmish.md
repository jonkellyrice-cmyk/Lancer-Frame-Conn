# Skirmish

# AF — Skirmish

## Status

**Native Skirmish orchestration:** No dedicated `SkirmishFlow` found.

**Native individual weapon attack flow:** Found.

**Native attack entry point:** `weapon.beginWeaponAttackFlow()`

**Native execution object:** `WeaponAttackFlow`

**Frame Helm implementation status:** Requires Frame Helm-owned Skirmish mount selection and orchestration over native Lancer weapon attack execution.

## Purpose

This document records the native Foundry Lancer execution architecture relevant to the **Skirmish** Quick Action and defines the current plan for integrating Skirmish execution into Frame Helm.

The repository findings are substantially the same as those documented for Barrage.

The native Lancer system provides a robust individual weapon attack primitive through:

`weapon.beginWeaponAttackFlow()`

and:

`WeaponAttackFlow`

but does not appear to expose a dedicated higher-order `SkirmishFlow` responsible for selecting a mount and executing all weapons permitted by that mount.

Therefore:

> **Native Lancer owns execution of individual weapon attacks.**
>
> **Frame Helm must own the Skirmish-level mount selection and orchestration.**

The primary difference from Barrage is the action-level structure:

**Skirmish attacks with one eligible mount.**

That mount may contain:

- one weapon
- two Auxiliary weapons
- one Main weapon and one Auxiliary weapon

Therefore a normal Skirmish produces:

**1–2 individual weapon attacks against one target.**

Superheavy weapons cannot be used with Skirmish.

—

# 1. Skirmish Rules Structure

Skirmish is a **Quick Action**.

The player chooses one eligible weapon mount and attacks using that mount.

The important unit of selection is therefore:

**one mount**

not:

**one arbitrary weapon**

A selected mount may contain one or two weapons depending upon its type and current loadout.

Consequently:

`Skirmish -> select one mount -> attack with eligible weapon(s) on that mount`

A Skirmish therefore normally produces:

**minimum:** 1 weapon attack

**maximum:** 2 weapon attacks

Both attacks belong to the same Skirmish action.

—

# 2. Skirmish Targeting Rule

A Skirmish attacks **one target**.

If the selected mount contains more than one weapon, the weapons fired from that mount attack the **same target**.

For example:

Main/Aux mount:

`Main Weapon + Auxiliary Weapon -> Target A`

Aux/Aux mount:

`Auxiliary Weapon A + Auxiliary Weapon B -> Target A`

The second weapon does not independently select another target.

Therefore target ownership belongs naturally at the selected-mount / Skirmish level:

`Skirmish`
→ select mount
→ select one target
→ execute all participating weapons from that mount against that target

This is an important distinction from Barrage.

—

# 3. Skirmish vs Barrage Targeting

Barrage may select multiple mounts.

Each selected mount may attack a different target.

However, weapons belonging to the **same mount** attack the same target.

Conceptually:

Barrage:

`Mount A -> Weapon A + Aux Weapon B -> Target 1`

`Mount B -> Weapon C + Aux Weapon D -> Target 2`

The target boundary therefore belongs to the mount.

Skirmish selects only one mount.

Therefore:

`Skirmish -> Mount A -> all participating weapons -> Target 1`

There is only one target assignment for an ordinary Skirmish.

This suggests a reusable Frame Helm concept:

**Mount Attack Group**

A Mount Attack Group contains:

- one selected mount
- one target
- one or more participating weapons

Skirmish contains exactly:

`1 Mount Attack Group`

A normal Barrage contains:

`up to 2 Mount Attack Groups`

with the Superheavy case requiring special handling.

—

# 4. Native Skirmish Flow Search

Repository investigation associated with the Barrage research did **not** reveal a dedicated native execution structure such as:

`SkirmishFlow`

or:

`beginSkirmishFlow()`

The native system instead exposes weapon execution at the individual weapon level.

Therefore Frame Helm should construct Skirmish from the same lower-level native primitive used for Barrage.

—

# 5. Native Weapon Attack Entry Point

The important native entry point remains:

`weapon.beginWeaponAttackFlow()`

which executes:

`WeaponAttackFlow`

Conceptually:

stock weapon attack control
→ resolve weapon `LancerItem`
→ `weapon.beginWeaponAttackFlow()`
→ `WeaponAttackFlow`
→ native weapon attack execution

Frame Helm should preserve this native boundary.

—

# 6. Native `WeaponAttackFlow`

The native individual weapon flow identified during attack research contains the sequence:

`initAttackData`
→ `checkItemDestroyed`
→ `checkWeaponLoaded`
→ `checkItemLimited`
→ `checkItemCharged`
→ `setAttackTags`
→ `setAttackEffects`
→ `setAttackTargets`
→ `showAttackHUD`
→ `rollAttacks`
→ `applySelfHeat`
→ `updateItemAfterAction`
→ `printAttackCard`

This means Frame Helm does not need to recreate the lower-level attack machinery simply to implement Skirmish.

Native Lancer can continue to own such concerns as:

- weapon identity
- destroyed-state validation
- Loading
- Limited uses
- charge state
- attack tags
- weapon effects
- attack modifiers
- Accuracy
- Difficulty
- attack rolling
- self Heat
- post-attack item mutation
- native attack chat output

Frame Helm’s missing responsibility is the higher-level Skirmish action.

—

# 7. Native Mount Data

The native mech actor contains weapon mount information under the loadout structure associated with:

`actor.system.loadout.weapon_mounts`

Conceptually:

Mech Actor
→ `system`
→ `loadout`
→ `weapon_mounts`
→ selected mount
→ slots
→ weapon references

Frame Helm should derive the Skirmish choices directly from this authoritative actor state.

It should not create a second independent inventory of equipped weapons.

—

# 8. Mount Types and Legal Contents

The relevant Lancer mount rules are:

## Main Mount

A Main mount may contain:

- one MAIN weapon

or:

- one AUXILIARY weapon

Therefore a Main mount normally produces at most:

`1 weapon attack`

during Skirmish.

—

## Heavy Mount

A Heavy mount may contain:

- one HEAVY weapon

or:

- one MAIN weapon

or:

- one AUXILIARY weapon

Therefore a Heavy mount normally produces at most:

`1 weapon attack`

during Skirmish.

A Heavy mount participating in a Superheavy mounting configuration is a special case because the Superheavy weapon itself cannot be fired with Skirmish.

—

## Aux/Aux Mount

An Aux/Aux mount may contain:

- up to two AUXILIARY weapons

Therefore Skirmish may produce:

`1 Auxiliary attack`

or:

`2 Auxiliary attacks`

from the selected mount.

If two Auxiliary weapons participate, both attack the **same target**.

—

## Main/Aux Mount

A Main/Aux mount may contain:

- one MAIN weapon and one AUXILIARY weapon

or:

- two AUXILIARY weapons

Therefore Skirmish may produce:

`1–2 weapon attacks`

from the selected mount.

If two weapons participate, both attack the **same target**.

—

## Flexible Mount

A Flexible mount may contain:

- one MAIN weapon

or:

- up to two AUXILIARY weapons

Therefore Skirmish may produce:

`1 Main attack`

or:

`1–2 Auxiliary attacks`

depending on the current loadout.

If two Auxiliary weapons participate, both attack the **same target**.

—

## Integrated Mount

Integrated mounts contain specific weapons built directly into a Frame.

Their weapons:

- are automatically included
- cannot be destroyed
- cannot be removed
- cannot be replaced
- cannot be modified

The exact native representation of Integrated mounts and whether/how a particular Integrated weapon participates in ordinary Skirmish must be determined from the native actor/loadout data and the weapon’s rules.

Frame Helm should not assume every Integrated weapon is automatically a legal Skirmish choice merely because it exists.

—

# 9. Superheavy Weapons

Superheavy weapons are especially important because they are explicitly **not legal Skirmish weapons**.

A Superheavy weapon requires:

- a HEAVY mount

and:

- one additional mount of any size

Superheavy weapons can only be fired as part of a **Barrage**.

Therefore:

`Superheavy -> Barrage only`

and:

`Superheavy -> NOT Skirmish`

Frame Helm’s Skirmish selector must exclude Superheavy weapons/configurations.

This should eventually be enforced by the action-domain legality layer rather than merely hidden by the UI.

—

# 10. Skirmish Mount Eligibility

The Skirmish selector should ultimately derive eligible choices from the actor’s authoritative loadout.

Conceptually:

`actor.system.loadout.weapon_mounts`
→ inspect mounts
→ inspect slots
→ resolve weapons
→ determine whether mount has a legal Skirmish attack
→ exclude Superheavy-only configurations
→ present eligible mounts

The UI should present mounts rather than presenting every weapon as an unrelated attack choice.

—

# 11. Proposed Frame Helm Skirmish Flow

The initial implementation should behave approximately as follows:

Player commits Skirmish
→ Skirmish appears in Committed Plan
→ player presses execution / d20 control
→ Frame Helm reads `actor.system.loadout.weapon_mounts`
→ Frame Helm determines legal Skirmish mounts
→ Frame Helm opens Skirmish mount selector
→ player selects one mount
→ Frame Helm determines participating weapon(s)
→ Frame Helm enters target-selection mode
→ player selects one target
→ Frame Helm binds that target to the selected mount attack group
→ execute first participating weapon through native attack flow
→ execute second participating weapon, if applicable, against the same target
→ Skirmish completes
→ committed Skirmish marked executed

—

# 12. Single-Weapon Skirmish

For a mount containing one participating weapon:

Skirmish
→ select mount
→ select target
→ resolve weapon
→ `weapon.beginWeaponAttackFlow()`
→ native `WeaponAttackFlow`
→ complete Skirmish

Examples include:

- Main mount with Main weapon
- Main mount with Auxiliary weapon
- Heavy mount with Heavy weapon
- Heavy mount with Main weapon
- Heavy mount with Auxiliary weapon
- Flexible mount with Main weapon

—

# 13. Two-Weapon Skirmish

For a mount containing two participating weapons:

Skirmish
→ select mount
→ select one target
→ resolve Weapon A
→ resolve Weapon B
→ Weapon A attacks selected target
→ Weapon B attacks the **same selected target**
→ complete Skirmish

Examples include:

Main/Aux:

`Main + Auxiliary -> same target`

Main/Aux:

`Auxiliary + Auxiliary -> same target`

Aux/Aux:

`Auxiliary + Auxiliary -> same target`

Flexible:

`Auxiliary + Auxiliary -> same target`

The target must remain bound to the mount attack group across both individual native weapon executions.

—

# 14. Mount Attack Group Abstraction

Skirmish reveals a useful abstraction that should probably be shared with Barrage.

Conceptually:

`MountAttackGroup`

could represent:

- selected mount identity
- participating weapon identities
- selected target
- execution state

For example:

`Mount A`
→ Weapon A
→ Weapon B
→ Target X

Skirmish consists of:

`1 MountAttackGroup`

Barrage generally consists of:

`2 MountAttackGroups`

For Barrage:

`MountAttackGroup A -> Target X`

`MountAttackGroup B -> Target Y`

Weapons inside Group A all attack Target X.

Weapons inside Group B all attack Target Y.

This prevents target handling from incorrectly being modeled either globally per action or independently per weapon.

—

# 15. Important Targeting Invariant

The following should be treated as an architectural invariant:

> **Target selection belongs to the mount attack group.**

Therefore:

**Skirmish:**

`1 selected mount = 1 target`

**Barrage:**

`selected Mount A = Target A`

`selected Mount B = Target B`

Within each selected mount:

`all participating weapons -> that mount’s target`

This rule should be preserved when Frame Helm eventually replaces the native attack HUD with automated targeting and attack resolution.

—

# 16. Native Target Handling During Initial Integration

There is one important implementation question.

The native `WeaponAttackFlow` contains:

`setAttackTargets`

and:

`showAttackHUD`

If Frame Helm executes two individual native weapon flows for a two-weapon mount, it must ensure the second flow retains or receives the **same target** as the first.

We therefore need to determine exactly how native target state is supplied to `WeaponAttackFlow`.

Until that is understood, Frame Helm should not assume that simply calling:

`weaponA.beginWeaponAttackFlow()`

followed by:

`weaponB.beginWeaponAttackFlow()`

will automatically preserve the correct mount-level target.

—

# 17. Required Targeting Research

Before automated two-weapon Skirmish execution is implementation-ready:

- [ ] Trace `setAttackTargets`.
- [ ] Determine where `WeaponAttackFlow` reads current Foundry targets.
- [ ] Determine whether targets can be supplied directly to the flow.
- [ ] Determine whether current user targets remain stable after the first weapon attack.
- [ ] Determine whether the attack HUD changes target state.
- [ ] Determine whether a second native weapon flow can safely reuse the same selected target.
- [ ] Determine how multiple targets are represented for weapons capable of attacking more than one target.
- [ ] Determine whether native targeting can be pre-populated by Frame Helm.
- [ ] Determine how Frame Helm should force a mount’s second weapon to use the same target.

—

# 18. Required Mount Research

The same mount-topology research required for Barrage applies to Skirmish.

Before implementation:

- [ ] Trace `actor.system.loadout.weapon_mounts` completely.
- [ ] Document native mount object shape.
- [ ] Document native slot object shape.
- [ ] Determine how weapon references are stored.
- [ ] Determine stable mount identity.
- [ ] Determine Main mount representation.
- [ ] Determine Heavy mount representation.
- [ ] Determine Aux/Aux mount representation.
- [ ] Determine Main/Aux mount representation.
- [ ] Determine Flexible mount representation.
- [ ] Determine Integrated mount representation.
- [ ] Determine Superheavy occupancy representation.
- [ ] Determine empty-slot representation.
- [ ] Determine destroyed-weapon representation.
- [ ] Determine whether slot order has semantic meaning.
- [ ] Determine whether native helpers already enumerate weapons belonging to a mount.
- [ ] Determine whether native helpers already identify mount types.
- [ ] Determine whether native helpers already identify Superheavy weapons.
- [ ] Determine whether native helpers already expose Skirmish legality.

—

# 19. Superheavy Filtering Research

Frame Helm needs a reliable native-data method for determining:

`this weapon is Superheavy`

rather than relying on display-name matching or UI assumptions.

Research:

- [ ] Find the native weapon size/type field.
- [ ] Find the enum/value representing Superheavy.
- [ ] Determine whether Superheavy legality is already exposed by a native helper.
- [ ] Determine how Superheavy occupancy appears in mount slots.
- [ ] Determine whether a mount partially occupied by a Superheavy should disappear entirely from the Skirmish selector.
- [ ] Determine how special rules modifying Superheavy usage are represented, if any.

—

# 20. Action Budget Ownership

Skirmish consumes:

**one Quick Action**

The individual weapon flows produced by the selected mount must not independently consume additional Frame Helm action budget.

Therefore:

`Skirmish commitment = 1 Quick Action`

while:

`WeaponAttackFlow A`

and:

`WeaponAttackFlow B`

are consequences of executing that single committed action.

Frame Helm must keep action-budget accounting separate from native individual weapon execution.

—

# 21. Resource Ownership

Native weapon execution should remain authoritative for weapon-specific resources and state.

Examples include:

- Loading
- Limited
- charge state
- destroyed state
- self Heat
- native weapon item mutation

Frame Helm should not manually duplicate these mutations simply because it orchestrates the Skirmish.

—

# 22. Partial Execution

A two-weapon Skirmish introduces the possibility that:

Weapon A executes successfully

but:

Weapon B is cancelled or fails.

Frame Helm will eventually need a defined policy for this state.

Possible execution states include:

- not started
- target selected
- first weapon resolved
- second weapon pending
- completed
- cancelled
- failed

Because the Quick Action has already begun and native document mutations may already have occurred, Frame Helm should not assume it can simply roll back the first weapon.

A resumable execution sequence may eventually be useful.

—

# 23. Committed Plan Integration

Skirmish should appear as one committed Quick Action.

Conceptually:

`SKIRMISH                                      [d20]`
`Quick Action`

The d20 execution control begins the Skirmish orchestration.

If the mount contains two participating weapons, those are internal execution steps.

They are not two separately committed Quick Actions.

—

# 24. Initial Native-First Architecture

The first implementation should retain as much native execution as possible.

Stage 1:

Committed Skirmish
→ choose mount
→ choose target
→ resolve weapon(s)
→ execute native `WeaponAttackFlow`
→ preserve same target for second weapon if present
→ complete Skirmish

The native attack HUD may still be used at this stage.

This allows Frame Helm to gain functional Skirmish execution without first solving every modifier and damage automation problem.

—

# 25. Future Automated Architecture

The eventual Frame Helm Skirmish flow should become:

Committed Skirmish
→ press d20
→ choose legal mount
→ Frame Helm enters Foundry target-selection mode
→ player selects one target
→ target locked to mount attack group
→ Frame Helm derives Accuracy
→ Frame Helm derives Difficulty
→ Frame Helm derives flat modifiers
→ Weapon A attack automatically rolled
→ hit/miss determined
→ Weapon A damage automatically rolled
→ damage automatically applied
→ deterministic effects applied
→ Weapon B attack automatically rolled if present
→ same target used
→ hit/miss determined
→ Weapon B damage automatically rolled
→ damage automatically applied
→ deterministic effects applied
→ weapon resources updated
→ Skirmish completed

—

# 26. Interaction With Other Player Features

Future Skirmish automation must eventually account for player-owned rules that modify or trigger from Skirmish.

Potential sources include:

- Mounted Systems
- Mech Traits
- Mech Core Powers
- Pilot Talents
- Manufacturer Core Bonuses

These may:

- modify an attack
- add Accuracy
- add Difficulty
- modify damage
- modify targeting
- grant additional effects
- trigger “when you Skirmish”
- grant an additional action
- alter weapon eligibility
- apply statuses or conditions
- consume resources

These should be integrated through the appropriate feature/action architecture rather than hard-coded directly into the Skirmish UI.

—

# 27. Deterministic Status and Condition Handling

As Frame Helm automation deepens, Skirmish must participate in the wider requirement that player actions automatically apply or remove deterministic statuses and conditions where appropriate.

The preferred order remains:

native Lancer mechanism if one exists
→ Frame Helm adapter if native execution exposes the necessary primitive
→ Frame Helm supplemental implementation only where the native system lacks the required behavior

Frame Helm should not replace native state mutation unnecessarily.

—

# 28. Relationship to Barrage

Skirmish and Barrage should share substantial infrastructure.

Shared concepts likely include:

- actor loadout resolution
- mount enumeration
- slot resolution
- weapon resolution
- mount attack groups
- native weapon execution adapter
- target binding
- execution progress
- attack result handling
- future automatic modifier derivation
- future damage automation
- future status/condition automation

Their primary orchestration difference is:

**Skirmish:**

`1 mount`
→ `1 target`
→ `1–2 weapons`

**Barrage:**

`up to 2 mount attack groups`
→ `each mount may have its own target`
→ `weapons within each mount share that mount’s target`

plus:

**Superheavy:**

`Barrage only`

—

# 29. Suggested Shared Architecture

Rather than implementing unrelated Skirmish and Barrage engines, Frame Helm should eventually share lower-level attack orchestration primitives.

Conceptually:

`resolveActorWeaponMounts(actor)`

`resolveMountWeapons(mount)`

`isMountSkirmishEligible(mount)`

`buildMountAttackGroup(mount, target)`

`executeNativeWeaponAttack(weapon, target)`

Then:

`executeSkirmish()`

can construct:

`1 MountAttackGroup`

while:

`executeBarrage()`

can construct:

`1–2 Barrage attack groups`

according to Barrage and Superheavy rules.

Exact names are illustrative only.

They should be aligned with the final feature decomposition before implementation.

—

# 30. Native Adapter Boundary

Native weapon execution should eventually pass through a dedicated Frame Helm native-system adapter.

Conceptually:

Frame Helm Actions feature
→ attack orchestration
→ native Lancer adapter
→ authoritative `LancerItem`
→ `weapon.beginWeaponAttackFlow()`
→ native `WeaponAttackFlow`
→ Foundry document mutation / chat output

UI code should not become responsible for understanding the internals of `WeaponAttackFlow`.

—

# 31. Preferred Dependency Flow

The intended dependency direction is:

UI Skirmish selector
→ Frame Helm Skirmish execution service
→ mount/loadout resolver
→ mount attack group
→ native-system adapter
→ `LancerItem.beginWeaponAttackFlow()`
→ `WeaponAttackFlow`
→ native flow steps
→ Foundry document mutations / chat output

This keeps the UI as presentation and interaction rather than turning it into the rules/execution layer.

—

# 32. Important Implementation Invariants

The implementation should preserve the following invariants.

**Invariant 1**

Skirmish consumes one Quick Action.

**Invariant 2**

Skirmish selects one eligible mount.

**Invariant 3**

A normal Skirmish executes one or two weapons depending on the selected mount’s contents.

**Invariant 4**

All weapons participating from the selected mount attack the same target.

**Invariant 5**

Superheavy weapons cannot be selected for Skirmish.

**Invariant 6**

Individual weapon attacks should reuse native `WeaponAttackFlow` wherever practical.

**Invariant 7**

Frame Helm should read authoritative mount/loadout state from the mech actor.

**Invariant 8**

Frame Helm should not maintain a duplicate authoritative equipment inventory.

**Invariant 9**

Individual native weapon attacks do not consume additional Frame Helm Quick Actions.

**Invariant 10**

Weapon-specific resource mutation remains native wherever native support exists.

—

# 33. Implementation TODO

Implementation should occur after the current Frame Helm organizational refactor is complete.

Relevant decomposition targets include:

`feature_actions`

`feature_movement`

`UI_application`

`UI_movement`

`UI_turn`

Afterward:

- [ ] Add shared mount/loadout resolver.
- [ ] Add Skirmish legality resolver.
- [ ] Exclude Superheavy attacks.
- [ ] Add Skirmish mount-selection presentation model.
- [ ] Add Skirmish mount selector.
- [ ] Resolve selected mount to participating weapon(s).
- [ ] Add one-target acquisition.
- [ ] Bind selected target to the entire mount attack group.
- [ ] Execute first weapon through native-system adapter.
- [ ] Execute second weapon if present.
- [ ] Guarantee second weapon uses the same target.
- [ ] Preserve native weapon resource handling.
- [ ] Preserve single Quick Action expenditure.
- [ ] Track execution progress.
- [ ] Handle cancellation/failure.
- [ ] Refresh Frame Helm from authoritative actor/item state.
- [ ] Compare execution against stock character-sheet weapon attacks.

—

# 34. Current Working Conclusion

The repository findings indicate that Skirmish should use the same native individual weapon execution primitive identified for Barrage:

`weapon.beginWeaponAttackFlow()`

→

`WeaponAttackFlow`

No dedicated native `SkirmishFlow` has been identified.

Therefore Frame Helm should implement the missing higher-level action orchestration.

The essential Skirmish structure is:

`Skirmish`
→ select one legal mount
→ select one target
→ resolve 1–2 participating weapons
→ execute those weapon attacks against the same target
→ complete one Quick Action

Superheavy weapons are excluded because they require Barrage.

—

# 35. Core Principle

Do not implement a replacement Lancer weapon attack engine merely to support Skirmish.

Implement:

**Skirmish mount orchestration**

over:

**native individual weapon attack execution**

The core Frame Helm abstraction should recognize that the meaningful targeting unit is not necessarily the individual weapon.

It is the:

**Mount Attack Group**

For Skirmish:

`one mount`
→ `one target`
→ `one or two weapons`

For Barrage:

`each selected mount`
→ `its own target`
→ `all weapons participating from that mount`

That distinction should remain central as Frame Helm moves from native-flow sequencing toward fully automated player-facing combat execution.
