const fs = require(“fs”);

const content = String.raw`# Lancer Weapon Mounts — Native Repository Integration Notes

## Status

**Native MountType enum:** Found.

**Native weapon-size model:** Found.

**Native fitting-size model:** Found.

**Native mech loadout mount structure:** Found.

**Native mount slots:** Found.

**Native embedded weapon references:** Found.

**Native embedded weapon-mod references:** Found.

**Native Frame-derived mount generation:** Found.

**Native integrated Frame weapon mounts:** Found.

**Native Flex mount topology:** Found.

**Native fitting validation:** Found.

**Native invalid-loadout detection:** Found.

**Native hard rejection of invalid weapon drops:** Not consistently implemented.

**Native Superheavy bracing state:** Found.

**Native Superheavy bracing validation:** Found.

**Native explicit Superheavy ↔ bracing-mount pair identity:** Not found.

**Native COMP/CON bracing import:** Found.

**Native Improved Armament loadout support:** Found.

**Native Mount Retrofitting loadout support:** Found.

**Native Integrated Weapon mount support:** Found.

**Native COMP/CON Superheavy Mounting import:** Found.

**Native stable mount UUID:** Not found.

**Native stable weapon embedded-item identity:** Found.

**Native WeaponAttackFlow mount awareness:** Not found.

**Native Skirmish mount-selection flow:** Not found.

**Native Barrage mount-selection flow:** Not found.

**Native same-target-per-mount enforcement:** Not found.

**Frame Helm requirement:** Reuse native Lancer mount/loadout topology, validation, bracing, weapon/mod references, and Core Bonus loadout state. Add the missing combat-semantic layer that selects mounts for Skirmish/Barrage, preserves mount grouping, supplies mount context to downstream modifiers, and expands selected mounts into native weapon attack executions.

—

# 1. Purpose

This document records the native Foundry Lancer architecture for mech weapon mounts and defines the intended Frame Helm integration boundary.

Weapon mounts are not merely visual groupings on the character sheet.

They are real persistent nested mech-loadout structures containing:

- mount type;
- bracing state;
- fitting slots;
- installed weapon references;
- installed weapon-mod references.

Native Lancer already knows how to:

- construct mounts from the equipped Frame;
- apply several loadout-changing Core Bonuses;
- create Integrated mounts;
- validate weapon fitting;
- validate Flex configurations;
- represent Superheavy bracing;
- import mount/bracing state from COMP/CON.

However:

> Native weapon attack flows are essentially weapon-centric once execution begins.

They do not preserve the fact that:

- the weapon belongs to a particular mount;
- multiple weapons may share one mount;
- Skirmish selects one mount;
- Barrage selects two mounts;
- weapons sharing a mount must attack the same target;
- mount-specific Core Bonuses may modify the attack.

Therefore:

> Frame Helm should not rebuild the native loadout model. It should bridge native mount state into combat execution.

—

# 2. Native Mech Loadout Structure

The mech actor contains a native loadout structure conceptually equivalent to:

\`\`\`text
MECH
└── system.loadout
    ├── frame
    ├── weapon_mounts[]
    │   ├── type
    │   ├── bracing
    │   └── slots[]
    │       ├── weapon
    │       ├── mod
    │       └── size
    └── systems[]
\`\`\`

Weapon mounts are nested actor data.

They are not independent Foundry Item documents.

—

# 3. Native Weapon Mount Schema

Each native mount contains fields conceptually equivalent to:

\`\`\`ts
{
  slots: [
    {
      weapon: EmbeddedRef<Item>,
      mod: EmbeddedRef<Item>,
      size: FittingSize
    }
  ],
  type: MountType,
  bracing: boolean
}
\`\`\`

The weapon and mod references point to actual embedded Items.

The mount itself is ordinary nested loadout data.

—

# 4. Mounts Are Not Embedded Documents

A mount does not have a Foundry:

- UUID;
- Item ID;
- embedded-document identity.

Therefore mount identity cannot rely on:

\`mount.uuid\`.

Native mount identity is essentially positional within:

\`system.loadout.weapon_mounts[]\`.

This has important consequences for persistent Core Bonus mount selection.

—

# 5. Native MountType

The repository defines a real MountType enum conceptually equivalent to:

\`\`\`ts
enum MountType {
  Main = “Main”,
  Heavy = “Heavy”,
  AuxAux = “Aux/Aux”,
  Aux = “Aux”,
  MainAux = “Main/Aux”,
  Flex = “Flex”,
  Integrated = “Integrated”,
  Superheavy = “Superheavy”,
  Unknown = “Unknown”
}
\`\`\`

Frame Helm should preserve the native type values rather than maintain a second independent mount taxonomy.

—

# 6. Native Weapon Sizes

Weapon size is represented separately.

Conceptually:

\`\`\`ts
enum WeaponSize {
  Aux = “Auxiliary”,
  Main = “Main”,
  Heavy = “Heavy”,
  Superheavy = “Superheavy”
}
\`\`\`

Weapon size and mount type are different concepts.

—

# 7. Native Fitting Sizes

Individual mount slots also have a fitting size.

Conceptually:

\`\`\`ts
enum FittingSize {
  Auxiliary = “Auxiliary”,
  Main = “Main”,
  Flex = “Flex”,
  Heavy = “Heavy”,
  Superheavy = “Superheavy”,
  Integrated = “Integrated”
}
\`\`\`

Therefore Frame Helm should distinguish:

MOUNT TYPE
→ topology of the mount

FITTING SIZE
→ capability of an individual slot

WEAPON SIZE
→ size class of the installed weapon.

—

# 8. Do Not Collapse Mount/Fitting/Weapon Size

Wrong architecture:

\`size = “Main”\`

used for all three concepts.

Correct architecture preserves:

- \`mount.type\`;
- \`slot.size\`;
- \`weapon.system.size\`.

Different native rules depend on each.

—

# 9. Native Mount Slot Construction

Native Lancer uses a helper conceptually equivalent to:

\`fittingsForMount(mountType)\`

to determine the slots for a mount.

This means Frame Helm does not need to reconstruct slot topology from tabletop prose.

—

# 10. Native Main Mount

Main mount topology:

\`\`\`text
Main
└── Main fitting
\`\`\`

Native fitting hierarchy allows the slot to contain:

- Main;
- Auxiliary.

—

# 11. Native Heavy Mount

Heavy mount topology:

\`\`\`text
Heavy
└── Heavy fitting
\`\`\`

Native fitting hierarchy allows:

- Heavy;
- Main;
- Auxiliary.

Frame Helm should read the actual installed weapon rather than hardcode eligibility during attack selection.

—

# 12. Native Aux Mount

The repository includes an internal/simple:

\`Aux\`

mount type.

Topology:

\`\`\`text
Aux
└── Auxiliary fitting
\`\`\`

This may appear through internal/loadout transformations even though standard player-facing Frames more commonly use Aux/Aux.

—

# 13. Native Aux/Aux Mount

Topology:

\`\`\`text
Aux/Aux
├── Auxiliary fitting
└── Auxiliary fitting
\`\`\`

This naturally supports up to two Auxiliary weapons.

—

# 14. Native Main/Aux Mount

Topology:

\`\`\`text
Main/Aux
├── Main fitting
└── Auxiliary fitting
\`\`\`

This naturally supports:

- one Main + one Auxiliary;
- two Auxiliary weapons where fitting rules permit.

—

# 15. Native Flex Mount

Flex is modeled as:

\`\`\`text
Flex
├── Flex fitting
└── Auxiliary fitting
\`\`\`

The native UI/validation interprets this as:

either:
→ one Main

or:
→ up to two Auxiliary.

Frame Helm should preserve this native topology.

—

# 16. Flex Main Behavior

If the first Flex slot contains a Main weapon:

→ the second Auxiliary slot is not available for another weapon.

Native validation detects invalid:

Main
+
second weapon

configurations.

—

# 17. Flex Aux/Aux Behavior

If the first Flex slot contains an Auxiliary weapon:

→ the second Auxiliary fitting may also contain an Auxiliary weapon.

This implements the tabletop:

two Auxiliary

option.

—

# 18. Native Integrated Mount

Integrated mount topology:

\`\`\`text
Integrated
└── Integrated fitting
\`\`\`

Integrated fittings are intentionally permissive because Integrated weapons do not follow ordinary install-size restrictions.

—

# 19. Native Superheavy Internal Mount Type

The repository also contains:

\`MountType.Superheavy\`.

This is useful internally/import-wise, but ordinary Superheavy tabletop mounting is primarily represented through:

- one mount containing the Superheavy weapon;
- another mount marked bracing.

Frame Helm should therefore inspect actual loadout state rather than assume every Superheavy weapon lives on a MountType.Superheavy object.

—

# 20. Native Unknown Mount Type

A native:

\`Unknown\`

mount type exists.

It is also used by the sheet when a mount is converted into Superheavy bracing state.

Do not reject Unknown mount types blindly.

Inspect:

\`mount.bracing\`.

—

# 21. Native Fitting Hierarchy

Native validation assigns fitting/weapon capacities conceptually equivalent to:

\`\`\`text
Weapon:
Aux         = 1
Main        = 2
Heavy       = 3
Superheavy  = 3

Fitting:
Auxiliary   = 1
Main        = 2
Flex        = 2
Heavy       = 3
Superheavy  = 3
Integrated  = 4
\`\`\`

A weapon whose size exceeds the fitting capacity is invalid.

—

# 22. Main Mount Fitting Rule

Because Main fitting capacity is 2:

Aux
→ fits

Main
→ fits

Heavy
→ does not fit

Superheavy
→ does not fit.

This reproduces the ordinary Main mount rules natively.

—

# 23. Heavy Mount Fitting Rule

Because Heavy fitting capacity is 3:

Aux
→ fits

Main
→ fits

Heavy
→ fits.

Superheavy handling requires additional native bracing logic.

—

# 24. Integrated Fitting Rule

Integrated fitting has the highest permissive fitting capacity.

This supports native Integrated weapons without normal size restrictions.

Frame Helm should not apply ordinary fitting logic to Integrated slots independently.

—

# 25. Native Mount Validation

The loadout helper exposes mount validation conceptually through:

\`actor.loadoutHelper.validateMount(mount)\`.

Validation checks:

- weapon size vs fitting;
- Flex configuration;
- Superheavy bracing requirements;
- other mount-state errors.

Frame Helm should reuse this native validation before presenting mounts as mechanically executable.

—

# 26. Invalid Mount Detection

Native validation can produce errors such as:

\`Weapon of size X cannot fit on fitting of size Y.\`

This indicates Foundry treats invalid loadout state as detectable runtime data rather than silently normalizing it.

—

# 27. Flex Validation Error

Native validation explicitly rejects:

Flex
+
Main weapon
+
second occupied slot.

Conceptually:

\`Flex mounts can either have two Auxiliary or one Main weapon.\`

This rule is natively enforced at validation time.

—

# 28. Native Weapon Drop Is Permissive

The native mech-sheet weapon drop handler intentionally prioritizes placing a dropped weapon in the first open slot.

The source comment is conceptually:

\`Who cares if it fits\`

before later validation.

Therefore:

drop accepted
→ loadout may temporarily become invalid
→ mount validation reports the problem.

—

# 29. Frame Helm Must Not Assume Installed Means Legal

A weapon appearing inside a mount is not sufficient evidence that:

the mount is legal.

Before offering a mount for Skirmish/Barrage:

→ validate the mount.

This protects combat execution from invalid sheet states.

—

# 30. Native Frame Mount Definitions

The equipped Frame contains native:

\`frame.system.mounts[]\`

describing its base mount topology.

These are used to construct the mech’s actual loadout mount structures.

—

# 31. Native Mount Reset

The loadout helper provides:

\`actor.loadoutHelper.resetMounts()\`.

This rebuilds the mech’s weapon mounts from authoritative Frame/loadout/Core Bonus data.

Frame Helm should not duplicate this mount-generation logic.

—

# 32. Native Mount Reset Construction

Mount reset conceptually creates:

\`\`\`text
{
  bracing: false,
  type: frameMountType,
  slots: fittingsForMount(frameMountType)
}
\`\`\`

for each Frame mount.

This gives Frame Helm already-materialized native mount topology.

—

# 33. Frame Helm Should Consume Final Actor Loadout

The correct source for combat is:

\`actor.system.loadout.weapon_mounts\`

not:

- tabletop mount rules;
- raw Frame definition;
- Core Bonus description.

Native Lancer has already combined those into the final loadout.

—

# 34. Native Integrated Frame Weapons

Native mount reset inspects:

\`frame.system.core_system.integrated\`.

Owned integrated weapons associated with the Frame Core System can produce actual:

Integrated mount entries.

—

# 35. Integrated Frame Weapon Mount

Conceptually:

\`\`\`text
Integrated Mount
└── Integrated fitting
    └── native embedded mech weapon
\`\`\`

This means integrated Frame weapons can be discovered through the same mount array as ordinary weapons.

—

# 36. Integrated Superheavy Exception

Native Superheavy validation excludes a Superheavy weapon from normal bracing requirements when it is integrated through the Frame Core System.

Therefore Frame Helm should not independently require bracing for every Superheavy-sized weapon.

Reuse native validation.

—

# 37. Native Superheavy Bracing

Superheavy support uses a dedicated:

\`mount.bracing\`

boolean.

A non-integrated Superheavy requires at least one bracing mount somewhere in the loadout.

—

# 38. Bracing Mount Representation

The native mech sheet can convert a mount into:

\`\`\`text
type = Unknown
bracing = true
slots = []
\`\`\`

and displays it as:

\`LOCKED: BRACING\`.

Therefore a braced mount is explicit native loadout state.

—

# 39. Frame Helm Should Read Bracing Directly

Do not infer:

“this empty mount must be the Superheavy brace.”

Use:

\`mount.bracing === true\`.

—

# 40. Superheavy Validation

Native validation conceptually checks:

non-integrated Superheavy exists
+
any mount has bracing.

If no bracing mount exists:

→ mount/loadout validation error.

—

# 41. No Explicit Superheavy Pair Identity

The native loadout does not appear to preserve:

Superheavy weapon mount
↔ exact bracing mount

as a direct relation.

Validation only requires:

at least one bracing mount.

Therefore Frame Helm cannot rely on a native partner UUID.

—

# 42. Superheavy Combat Interpretation

For combat, Frame Helm should treat a valid Superheavy configuration as:

one Superheavy weapon execution
+
one sacrificed/bracing mount already represented in loadout.

The Barrage parent action should not ask the player to attack separately with the bracing mount.

—

# 43. Superheavy and Barrage

Officially a Superheavy weapon is fired through Barrage.

Frame Helm should:

- detect the Superheavy weapon;
- verify native mount/loadout validity;
- treat its bracing requirement as already satisfied by loadout state;
- consume the Barrage parent action;
- execute the Superheavy weapon once.

Do not require choosing two ordinary attacking mount groups in addition to the Superheavy.

—

# 44. Native COMP/CON Bracing Import

Packed COMP/CON mount data contains a bracing/lock concept.

Native import maps that to:

\`mount.bracing\`.

Therefore imported Superheavy loadouts preserve bracing.

—

# 45. Native COMP/CON Mount Normalization

COMP/CON may represent mount data using:

- slots[];
- extra[];
- special mount buckets.

Foundry import normalizes these into:

\`system.loadout.weapon_mounts[].slots[]\`.

Frame Helm should only consume the normalized Foundry loadout.

—

# 46. COMP/CON Extra Slots

The importer folds COMP/CON’s secondary/extra weapon slots into the ordinary native mount slot array.

Therefore Frame Helm does not need special handling for:

\`extra[]\`.

—

# 47. Weapon Slot References

Every native mount slot contains:

\`weapon\`

as an EmbeddedRef to a real Mech Weapon Item.

This gives installed weapons stable embedded-item identity.

—

# 48. Weapon Mod Slot References

Every native mount slot also contains:

\`mod\`

as an EmbeddedRef to a Weapon Mod Item.

Therefore attack context can preserve:

mount
→ slot
→ weapon
→ mod.

This will be important for weapon automation.

—

# 49. Weapon Identity Is Stable

Unlike mounts, installed weapons are real embedded Items.

Therefore persistent configuration targeting a weapon can use:

- Item ID;
- Item UUID.

This is much safer than mount-index-only storage.

—

# 50. Mount Identity Is Positional

Because native mounts lack IDs:

mount identity is approximately:

actor UUID
+
mount array index
+
current loadout shape.

This is not inherently stable across loadout rebuilds.

—

# 51. Mount-Targeting Core Bonuses Need Reconciliation

Core Bonuses such as:

Auto-Stabilizing Hardpoints
→ choose one mount

cannot safely be stored as:

\`mountIndex = 1\`

forever without reconciliation.

A robust Frame Helm configuration should preserve additional mount signature information.

—

# 52. Suggested Mount Reference

Conceptually:

\`\`\`text
MountReference
{
  actorUuid,
  mountIndex,
  mountType,
  installedWeaponUuids[],
  configurationVersion
}
\`\`\`

Exact schema is illustrative.

The purpose is to detect when the referenced mount has materially changed.

—

# 53. Mount Reference Revalidation

When loadout changes:

- re-resolve the stored mount index;
- compare expected mount signature;
- if mismatched, prompt/reconfigure rather than silently moving the effect to another mount.

This is especially important for persistent Core Bonus configuration.

—

# 54. Weapon-Targeting Core Bonuses Are Easier

Overpower Caliber-style effects can store the selected weapon’s embedded Item UUID.

If the weapon leaves the loadout:

→ configuration becomes invalid.

If the mount moves:

→ weapon identity remains stable.

—

# 55. Native listLoadout()

The loadout helper can enumerate equipped loadout content.

Conceptually:

weapon_mounts
→ slots
→ weapons
→ mods

plus systems and other equipment.

Frame Helm can use this native structure for actor-owned feature discovery.

—

# 56. Native Core Bonus Mount Topology Integration

The mount reset code explicitly handles several Core Bonuses.

This is a major correction to the broader assumption that Core Bonuses are always inert.

Some loadout-changing Core Bonuses already have native mechanical support.

—

# 57. Native Improved Armament Support

Mount reset checks for:

\`cb_improved_armament\`.

If applicable, native Lancer adds an additional mount to the final mount topology.

Therefore Frame Helm should use the resulting loadout rather than independently add a mount.

—

# 58. Improved Armament Source-Code Discrepancy

The current repository implementation adds:

\`MountType.Main\`

under its Improved Armament branch.

The tabletop rule shown in the rulebook says:

additional Flexible mount.

This is a real repo/tabletop discrepancy.

Frame Helm should not silently rewrite the actor loadout during combat.

The discrepancy should be handled deliberately in a future compatibility/rules-correction decision.

—

# 59. Native Mount Retrofitting Support

Mount reset checks for:

\`cb_mount_retrofitting\`.

Native logic converts an eligible existing mount into:

\`Main/Aux\`.

Therefore the resulting actor loadout already represents the Core Bonus.

—

# 60. Mount Retrofitting Selection Caveat

Native reset logic appears to select the first matching mount according to its own ordering rather than preserving a fully general player-selected mount configuration.

This may differ from ideal tabletop configuration semantics.

A dedicated Core Bonus/loadout trace should determine whether the player’s selected mount is preserved elsewhere.

—

# 61. Native Integrated Weapon Support

Mount reset checks for:

\`cb_integrated_weapon\`.

It inserts an:

\`Integrated\`

mount into the mech loadout.

Therefore Frame Helm should not independently create that mount.

—

# 62. Integrated Weapon Content

The Core Bonus creates the mount topology natively.

The exact installed Auxiliary weapon still belongs to loadout configuration.

Frame Helm should read the final installed weapon from the Integrated mount.

—

# 63. Native Superheavy Mounting Import

The COMP/CON importer supports:

\`superheavy_mounting\`

as a special mount/loadout bucket.

If it contains a weapon:

→ it is normalized into Foundry mount state.

—

# 64. Superheavy Mounting Reset Asymmetry

Native:

\`resetMounts()\`

does not appear to contain an equivalent explicit Core Bonus reconstruction branch for Superheavy Mounting.

Therefore:

COMP/CON import
→ supports it

while:

fresh native mount reset
→ may not fully reconstruct it.

This deserves focused follow-up before relying on resetMounts for that Core Bonus.

—

# 65. Native WeaponAttackFlow Is Weapon-Centric

The repository flow trace found no meaningful mount awareness inside normal WeaponAttackFlow.

Once a weapon enters the native attack flow:

→ attack logic knows the weapon;
→ attack logic knows targets/modifiers;
→ attack logic does not preserve mount grouping.

—

# 66. Native Attack Flow Does Not Know Mount Index

WeaponAttackFlow does not carry:

- mount index;
- mount type;
- sibling weapon list;
- bracing partner;
- mount-level configured Core Bonus target.

Therefore Frame Helm must add this contextual layer before invoking native weapon attacks.

—

# 67. Mount Context Must Survive Into Attack Events

Some mechanics depend on:

“weapon attached to this mount.”

Example:

Auto-Stabilizing Hardpoints.

Therefore Frame Helm’s attack execution context should preserve mount identity even if native WeaponAttackFlow itself does not.

—

# 68. Suggested Attack Source Context

Conceptually:

\`\`\`text
WeaponExecutionContext
{
  mechActor,
  mountReference,
  mountType,
  slotIndex,
  weaponItemUuid,
  weaponModItemUuid,
  parentAction,
  mountTarget
}
\`\`\`

Exact schema belongs to the shared attack framework.

—

# 69. Skirmish Is Mount-Oriented

Skirmish mechanically selects:

one mount.

Therefore Frame Helm should not present Skirmish as merely:

choose one weapon.

—

# 70. Native Skirmish Mount Flow Missing

No native dedicated flow was found that:

- enumerates eligible mounts;
- selects a mount;
- expands it into its weapons;
- enforces same-target grouping.

Frame Helm must own this parent orchestration.

—

# 71. Proposed Skirmish Mount Flow

SKIRMISH
→ resolve authoritative mech
→ enumerate native weapon mounts
→ remove bracing-only mounts
→ validate each mount
→ filter illegal Superheavy options
→ player selects one eligible mount
→ resolve weapons from occupied slots
→ choose one target
→ all weapons on selected mount attack that same target
→ invoke native weapon attack execution for each weapon
→ preserve mount context throughout.

—

# 72. Aux/Aux Skirmish

Example:

\`\`\`text
Aux/Aux Mount
├── Aux Weapon A
└── Aux Weapon B
\`\`\`

Skirmish:

→ select mount;
→ select one target;
→ attack with both Aux weapons against that target.

Separate attack rolls remain weapon-specific.

—

# 73. Main/Aux Skirmish

Example:

\`\`\`text
Main/Aux Mount
├── Main Weapon
└── Aux Weapon
\`\`\`

Skirmish:

→ one target;
→ both weapons attack the same target.

This same-target rule belongs to Frame Helm’s mount parent context.

—

# 74. Main Mount Skirmish

Main mount normally contains one installed weapon.

Skirmish simply executes that weapon against the chosen target.

Native attack flow handles the attack itself.

—

# 75. Flex Mount Skirmish

A valid Flex mount may contain:

one Main

or:

two Aux.

Frame Helm should read occupied slots rather than separately derive this from MountType.

—

# 76. Heavy Mount Skirmish

A Heavy mount may contain:

- Heavy;
- Main;
- Aux.

If valid and non-Superheavy:

Skirmish may use that mount normally.

—

# 77. Superheavy Cannot Skirmish

If the selected weapon is Superheavy:

the mount should not appear as a legal Skirmish mount.

This should be enforced by the Skirmish parent action even if the loadout itself is valid.

—

# 78. Barrage Is Also Mount-Oriented

Barrage normally selects:

two mounts

and attacks with the weapons on them.

Therefore Frame Helm needs a mount-aware Barrage parent execution model.

—

# 79. Native Barrage Mount Flow Missing

No native flow was found that:

- selects two mounts;
- preserves per-mount target grouping;
- expands mounts into their weapons;
- handles Superheavy replacement semantics.

Frame Helm must own this orchestration.

—

# 80. Proposed Normal Barrage Flow

BARRAGE
→ resolve authoritative mech
→ enumerate native valid mounts
→ select first mount
→ choose target for first mount
→ select second distinct eligible mount
→ choose target for second mount
→ expand each mount into occupied weapons
→ each mount’s weapons share that mount’s target
→ native attack execution resolves each weapon.

—

# 81. Barrage Mount Targets May Differ

Mount A may target:

Target A.

Mount B may target:

Target B.

Frame Helm should preserve target per mount.

Do not create one global Barrage target.

—

# 82. Same-Mount Weapons Must Share Target

If Mount A has:

two weapons

then both attack:

Mount A’s chosen target.

This rule is not enforced by native WeaponAttackFlow because mount identity has already been lost.

Frame Helm must enforce it before individual attacks begin.

—

# 83. Mount Grouping Model

A useful parent structure is conceptually:

\`\`\`text
MountAttackGroup
{
  mountReference,
  targetUuid,
  weapons[]
}
\`\`\`

Barrage contains one or two such groups.

Skirmish contains one.

—

# 84. Weapon Attack Roll Multiplicity

Each weapon still produces its own native attack roll.

Mount grouping determines:

- which weapons participate;
- which target they share.

It does not collapse multiple weapons into one attack roll.

—

# 85. AoE Weapon Inside a Mount

A weapon may itself be AoE.

The mount parent remains:

one selected mount.

The AoE weapon can then expand its own affected target set through:

\`aoe.md\`.

Do not replace mount grouping with AoE targeting.

—

# 86. AoE and Same-Mount Auxiliary Weapon

If a mount includes:

AoE Main weapon
+
Aux weapon

the exact tabletop interaction between the mount’s required same target and the AoE expansion should be preserved carefully.

Frame Helm should distinguish:

mount’s declared primary target/context

from:

AoE-expanded affected targets.

This deserves specific attack behavior tests.

—

# 87. Superheavy Barrage Flow

For a valid Superheavy weapon:

Barrage
→ identify Superheavy weapon
→ confirm native bracing/loadout validity
→ treat the Superheavy as the Barrage weapon execution
→ do not independently attack with the bracing mount.

—

# 88. Superheavy Parent Mount Count

Although the tabletop rule says the Superheavy occupies:

a Heavy mount
+
one other mount,

native Foundry represents the second mount as:

bracing.

Therefore Frame Helm should use native final loadout state rather than reconstruct the pairing from tabletop rules.

—

# 89. Integrated Mounts and Barrage/Skirmish

Integrated mounts are present in the same native loadout array.

Whether a specific Integrated weapon can be selected normally by Skirmish/Barrage depends on that weapon’s rules.

Frame Helm should inspect:

- weapon properties;
- integrated source;
- special action text;

rather than assuming every Integrated weapon behaves identically.

—

# 90. Mount Mods

Because mods are slot-associated:

weapon attack context should preserve the slot’s mod Item.

Native weapon calculations may already derive mod effects through item relations.

Frame Helm should not manually duplicate mod effects.

—

# 91. Mount-Specific Core Bonus Modifiers

Auto-Stabilizing Hardpoints and similar effects require knowing:

the weapon’s current mount.

Frame Helm should provide mount context to its modifier/event layer before native attack roll calculation.

—

# 92. Mount-Specific Modifier Injection

Conceptually:

weapon attack requested
→ resolve mount context
→ inspect configured mount-specific effects
→ add applicable modifier to attack context
→ invoke native attack HUD/flow.

Native attack flow remains responsible for normal target/status modifiers.

—

# 93. Structure Damage and Mount Destruction

Native mount schema has no:

\`destroyed\`

boolean.

The structure-damage rules may destroy all weapons on one mount instead.

Therefore a “destroyed mount” is likely represented mechanically by:

weapons on that mount becoming destroyed.

—

# 94. Weapon Destroyed State

Weapons themselves contain native destroyed state.

Frame Helm should inspect weapon validity when presenting executable mount weapons.

A mount with only destroyed weapons may be functionally unusable even though the mount structure remains.

—

# 95. Structure Damage Follow-Up Trace

Before automating Structure mount-destruction results:

trace:

- native StructureFlow selection;
- how all weapons on chosen mount are marked destroyed;
- whether mods are affected;
- whether mount UI changes.

Do not invent mount.destroyed.

—

# 96. Empty Mounts

An empty valid mount is not mechanically useful for Skirmish/Barrage.

Frame Helm should generally filter it from executable mount choices.

However, keep it visible in loadout/configuration contexts.

—

# 97. Bracing Mounts

Bracing mounts should never appear as independent attacking mount choices.

They have:

\`bracing = true\`

and no weapon slots.

—

# 98. Invalid Mounts

A mount failing native validation should not execute normally through Frame Helm.

The UI should surface:

- why it is invalid;
- how native Foundry currently sees it.

Do not silently “fix” the player’s loadout during combat.

—

# 99. Mount Validation Timing

Useful validation points:

- Frame Helm open/refresh;
- loadout change;
- before Skirmish;
- before Barrage;
- immediately before execution.

Execution-time validation protects against stale UI state.

—

# 100. Mount Selection UI

Frame Helm can present each mount as one tactical unit.

Conceptually:

\`\`\`text
MAIN/AUX
  Assault Rifle
  Pistol

HEAVY
  Heavy Machine Gun

AUX/AUX
  Missile Rack
  Missile Rack
\`\`\`

The player chooses the mount rather than individual weapons first.

—

# 101. Mount Validation UI

Invalid mount example:

\`\`\`text
FLEX
  Assault Rifle
  Pistol

INVALID:
Flex mounts may contain one Main
or up to two Auxiliary weapons.
\`\`\`

Execution should be disabled until resolved.

—

# 102. Bracing UI

Example:

\`\`\`text
MOUNT 2
LOCKED: BRACING
\`\`\`

Do not show it as an empty mount that can be selected.

—

# 103. Superheavy UI

The Superheavy weapon’s displayed mount can include:

\`\`\`text
SUPERHEAVY
  Siege Cannon
  Requires/uses Bracing Mount
\`\`\`

Frame Helm can derive this from:

weapon size
+
loadout bracing state.

—

# 104. Native Loadout Is Combat Authority

For combat:

prefer:

\`actor.system.loadout.weapon_mounts\`

over reconstructing mounts from:

- Frame data;
- Core Bonuses;
- COMP/CON source;
- tabletop baseline.

The actor loadout is the final native resolved configuration.

—

# 105. Frame Definition Is Configuration Authority

For resetting/rebuilding:

the native Frame mount list is authoritative.

Frame Helm should call/use native loadout helpers rather than performing its own rebuild.

—

# 106. Core Bonus Definition Is Not Final Mount State

A Core Bonus may describe:

extra mount
or:
mount replacement.

But combat should read the resulting actor loadout.

Do not reapply the Core Bonus every time Frame Helm renders.

—

# 107. Loadout Rebuild Can Reorder Mounts

Because mounts are array data:

a reset/rebuild may reorder or replace them.

This reinforces the need to revalidate any stored mount-reference configuration.

—

# 108. Suggested Mount Signature

A mount signature for reconciliation may include:

- current mount type;
- bracing state;
- weapon UUIDs;
- fitting sizes.

If the signature changes:

persistent mount-targeting configuration may require remapping.

—

# 109. Do Not Use Weapon Name as Mount Signature

Names are mutable and non-unique.

Use embedded Item identity.

—

# 110. Attack Context Should Preserve Parent Action

A weapon executed from:

Skirmish

vs:

Barrage

may matter to:

- Talents;
- Traits;
- Core Bonuses;
- weapon special effects.

Therefore mount/weapon execution context should preserve:

parent action type.

—

# 111. Attack Context Should Preserve Mount Type

Some future effects may depend on:

- Heavy mount;
- Integrated mount;
- specific mount configuration.

Preserve native:

\`mount.type\`

in semantic attack context.

—

# 112. Attack Context Should Preserve Slot Index

A mod or configuration may be slot-specific.

Preserve:

\`slotIndex\`

along with mount reference.

—

# 113. Attack Context Should Preserve Weapon Mod

If the weapon slot contains a mod:

include its native Item identity in the attack execution context.

—

# 114. Shared Actor-Owned Feature Runtime Integration

Weapon mounts intersect with several existing Frame Helm feature systems.

Examples:

Core Bonuses
→ selected mount / selected weapon.

Mech Traits
→ integrated weapon grants.

Talents
→ integrated weapon grants.

Core Powers
→ integrated active weapons.

Weapons
→ unique attack effects.

Mounted Systems
→ may modify mounts/weapons.

Therefore mount context should become a shared combat primitive.

—

# 115. Weapon Source Discovery

A mounted weapon’s source lineage may be:

- ordinary loadout;
- Frame integrated;
- Core Bonus integrated;
- Talent integrated;
- Core Power integrated.

Frame Helm should preserve source identity where available, but the attack itself should still use the native embedded weapon item.

—

# 116. Installed Weapon vs Granted Weapon

Regardless of source:

if a native weapon Item is installed in a mount slot:

attack execution should use that Item.

Do not create duplicate ephemeral weapon definitions from the granting feature.

—

# 117. Mount Target Snapshot

When a Skirmish/Barrage plan is committed:

Frame Helm may preserve:

- mount reference/signature;
- target UUID;
- weapon UUIDs.

At execution:

revalidate current loadout.

If changed materially:

prompt/reject rather than attacking with stale references.

—

# 118. Planned Mount Action Revalidation

Example:

planned:
Heavy Mount → Target A.

Then loadout changes before execution.

Execution should:

- re-resolve Heavy mount;
- confirm same weapon(s);
- confirm valid mount state;
- otherwise invalidate/reselect.

—

# 119. Mount Action Idempotence

Committed Skirmish/Barrage weapon executions should not be duplicated through double-click.

Each weapon child execution should track:

planned
→ executing
→ executed.

The mount parent should know when all child weapon attacks are complete.

—

# 120. Mount Parent Completion

Skirmish completes when:

all required weapon attacks from selected mount have resolved.

Barrage completes when:

all required weapon attacks from all selected mount groups have resolved.

Do not mark parent action complete after only the first weapon.

—

# 121. Native Weapon Attack Cancellation

If a child weapon attack is cancelled:

Frame Helm needs a clear parent-action policy.

Potential choices depend on when tabletop action cost is considered committed.

This should align with the broader committed-action execution model.

—

# 122. Mount Child Order

For mounts with multiple weapons:

Frame Helm may resolve child weapon attacks in slot order unless a rule requires player ordering.

This matters when the first attack creates a condition that affects the second.

Player ordering may therefore be strategically meaningful.

—

# 123. Recommended Multi-Weapon Mount UX

When selected mount has multiple weapons:

show:

\`\`\`text
MAIN/AUX — Target: Enemy A

1. Assault Rifle
2. Pistol
\`\`\`

Allow player to execute/order the weapons deliberately where needed.

—

# 124. Weapon Special Effects Need Mount Context

Some weapons may trigger:

secondary attacks;
status application;
resource use;
mount-specific interactions.

The upcoming Weapons subsystem should receive the full mount execution context.

—

# 125. AoE Weapon Mount Context

For an AoE weapon:

parent mount target/context
→ weapon AoE placement
→ affected target expansion
→ native multi-target attack.

The mount remains the source grouping.

—

# 126. Friendly Fire Remains Weapon/AoE Concern

Mount grouping does not change AoE friendly-fire rules.

AoE subsystem remains authoritative for affected characters.

—

# 127. Weapon Mod Automation

Weapon Mods may alter:

- tags;
- damage;
- Range;
- attacks;
- special effects.

Because native slot context contains the mod:

the Weapons subsystem should inspect the current native mod Item rather than a copied configuration.

—

# 128. Native Loadout Core Bonus Correction

The following Core Bonuses should be considered at least partially native-supported at loadout level:

- Improved Armament;
- Mount Retrofitting;
- Integrated Weapon.

This corrects the broader “Core Bonuses are mostly inert” model for these specific topology-changing effects.

—

# 129. Core Bonus Runtime Still Needed Around Mounts

Even where native topology exists, Core Bonuses such as:

Auto-Stabilizing Hardpoints

and:

Overpower Caliber

still need:

- persistent selection;
- attack-context modifier/trigger;
- frequency tracking.

The mount system provides the target object those bonuses need.

—

# 130. Native Improved Armament Compatibility Concern

Because the repo implementation currently adds a Main mount while tabletop text says Flexible:

Frame Helm should record this discrepancy.

Potential future policies:

- preserve native behavior;
- correct native behavior via module patch;
- make compatibility configurable.

Do not change it silently inside combat logic.

—

# 131. Mount Retrofitting Compatibility Concern

Native mount reset appears to choose an eligible mount programmatically.

If tabletop rules require explicit player choice:

Frame Helm may eventually need to preserve/configure that choice rather than accept whichever mount native reset selected.

This requires a focused loadout configuration trace.

—

# 132. Integrated Weapon Configuration

The native Integrated mount exists.

Frame Helm still needs to know which Auxiliary weapon the player selected for the bonus.

If the native loadout already contains it:

use that authoritative weapon.

Do not ask again during combat.

—

# 133. Superheavy Mounting Compatibility Concern

Because COMP/CON import and native reset behavior may differ:

Frame Helm should avoid calling resetMounts casually on actors using Superheavy Mounting until the behavior is fully traced.

—

# 134. Mount-State Mutation Should Use Native Helpers

For loadout configuration/editing:

prefer:

- native sheet/loadout APIs;
- LoadoutHelper;
- existing actor update structures.

Do not invent a second mount persistence format.

—

# 135. Mount Combat Layer Should Be Read-Mostly

Frame Helm’s combat mount subsystem should mostly:

- read mounts;
- validate mounts;
- select mounts;
- preserve grouping;
- derive weapon executions.

It should not routinely mutate mount topology during combat.

—

# 136. Suggested Native Mount Adapter

Conceptually:

\`\`\`text
native-lancer-mount-adapter

getWeaponMounts(actor)

validateMount(actor, mountIndex)

getMountWeapons(actor, mountIndex)

getMountSlots(actor, mountIndex)

getMountMod(actor, mountIndex, slotIndex)

isBracingMount(...)

findWeaponMount(actor, weaponUuid)

getMountSignature(...)

resetMounts(actor)
\`\`\`

Exact names are illustrative.

—

# 137. Suggested Frame Helm Mount Combat Layer

Conceptually:

\`\`\`text
frame-helm-mount-combat

getSkirmishEligibleMounts(actor)

getBarrageEligibleMounts(actor)

createMountAttackGroup(...)

validateSameMountTarget(...)

resolveSkirmishMount(...)

resolveBarrageMounts(...)

resolveSuperheavyBarrage(...)

attachMountContextToWeaponExecution(...)
\`\`\`

This keeps native data access separate from combat rules.

—

# 138. Skirmish Eligibility TODO

- [ ] Exclude bracing mounts.
- [ ] Exclude empty mounts.
- [ ] Validate native mount.
- [ ] Exclude Superheavy weapons.
- [ ] Exclude mounts with no usable weapons.
- [ ] Respect Jammed/Stunned/etc. through central legality.
- [ ] Preserve integrated-weapon exceptions.

—

# 139. Barrage Eligibility TODO

- [ ] Exclude bracing mounts as attack groups.
- [ ] Exclude empty mounts.
- [ ] Validate native mount.
- [ ] Allow normal two-mount selection.
- [ ] Detect Superheavy weapon.
- [ ] Resolve Superheavy as Barrage special case.
- [ ] Prevent accidental duplicate mount selection.
- [ ] Preserve same-target-per-mount rule.

—

# 140. Mount Targeting TODO

- [ ] Store target per selected mount group.
- [ ] Permit different targets across Barrage mount groups.
- [ ] Require same target for sibling weapons on one mount.
- [ ] Preserve target UUID snapshot.
- [ ] Revalidate target before each child attack.
- [ ] Integrate AoE expansion separately.

—

# 141. Mount Context TODO

- [ ] Preserve actor UUID.
- [ ] Preserve mount index.
- [ ] Preserve mount signature.
- [ ] Preserve mount type.
- [ ] Preserve bracing state.
- [ ] Preserve slot index.
- [ ] Preserve weapon UUID.
- [ ] Preserve mod UUID.
- [ ] Preserve parent action.
- [ ] Preserve mount target.

—

# 142. Persistent Mount Configuration TODO

- [ ] Define mount-reference serialization.
- [ ] Support Auto-Stabilizing Hardpoints.
- [ ] Detect loadout rebuild.
- [ ] Revalidate selected mount after rebuild.
- [ ] Prompt reconfiguration on mismatch.
- [ ] Do not silently shift effect to another mount.

—

# 143. Native Validation TODO

- [ ] Wrap LoadoutHelper.validateMount.
- [ ] Surface fitting errors.
- [ ] Surface Flex errors.
- [ ] Surface missing Superheavy bracing.
- [ ] Treat Integrated exceptions correctly.
- [ ] Revalidate immediately before attack execution.

—

# 144. Loadout Core Bonus TODO

- [ ] Document Improved Armament source discrepancy.
- [ ] Trace mount-choice persistence for Mount Retrofitting.
- [ ] Trace selected weapon state for Integrated Weapon.
- [ ] Trace Superheavy Mounting reset behavior.
- [ ] Avoid duplicate topology mutations.

—

# 145. Structure Damage TODO

- [ ] Trace native Structure damage mount-destruction flow.
- [ ] Determine how mount is chosen.
- [ ] Confirm weapons on chosen mount become destroyed.
- [ ] Confirm mods behavior.
- [ ] Refresh executable mount availability afterward.
- [ ] Do not create mount.destroyed unless native schema changes.

—

# 146. Smoke Test — Native Mount Topology

- [ ] Main mount has expected slots.
- [ ] Heavy mount has expected slots.
- [ ] Aux/Aux has two Aux slots.
- [ ] Main/Aux has expected slots.
- [ ] Flex supports one Main.
- [ ] Flex supports two Aux.
- [ ] Integrated mount works.
- [ ] bracing mount renders correctly.

—

# 147. Smoke Test — Mount Validation

- [ ] Aux fits Main.
- [ ] Aux fits Heavy.
- [ ] Main fits Main.
- [ ] Main fits Heavy.
- [ ] Heavy fits Heavy.
- [ ] invalid oversized weapon detected.
- [ ] Flex Main + second weapon detected invalid.
- [ ] valid two-Aux Flex accepted.
- [ ] non-integrated Superheavy without bracing invalid.
- [ ] Superheavy with bracing valid.
- [ ] integrated Superheavy exception valid.

—

# 148. Smoke Test — Skirmish

- [ ] eligible mount list derived from native loadout.
- [ ] invalid mount cannot execute.
- [ ] bracing mount not selectable.
- [ ] empty mount not selectable.
- [ ] Superheavy not selectable.
- [ ] Aux/Aux attacks both weapons.
- [ ] Main/Aux attacks both weapons.
- [ ] sibling weapons share target.
- [ ] native weapon attacks execute normally.

—

# 149. Smoke Test — Barrage

- [ ] choose two distinct normal mounts.
- [ ] each mount gets independent target.
- [ ] sibling weapons share their mount’s target.
- [ ] all child weapon attacks execute.
- [ ] parent Barrage completes only after all children.
- [ ] invalid mount cannot be selected.
- [ ] bracing mount not treated as attack group.

—

# 150. Smoke Test — Superheavy Barrage

- [ ] valid Superheavy loadout detected.
- [ ] bracing requirement read natively.
- [ ] Superheavy cannot Skirmish.
- [ ] Barrage executes Superheavy once.
- [ ] bracing mount does not make its own attack.
- [ ] integrated Superheavy exception preserved.
- [ ] no extra manual pairing required.

—

# 151. Smoke Test — Mount-Specific Core Bonus

- [ ] configured mount resolves correctly.
- [ ] selected-mount weapon attack carries mount context.
- [ ] modifier applies only to configured mount.
- [ ] moving a weapon between mounts changes eligibility.
- [ ] loadout rebuild triggers revalidation.
- [ ] stale mount reference does not silently target wrong mount.

—

# 152. Smoke Test — Weapon Mod Context

- [ ] mounted weapon resolves associated mod.
- [ ] mod identity preserved into attack context.
- [ ] native mod effects remain native.
- [ ] Frame Helm does not duplicate mod bonuses.

—

# 153. Smoke Test — Core Bonus Topology

- [ ] Improved Armament native mount appears.
- [ ] Mount Retrofitting native Main/Aux result appears.
- [ ] Integrated Weapon native Integrated mount appears.
- [ ] Frame Helm does not add duplicate mounts.
- [ ] COMP/CON imported bracing persists.
- [ ] imported special mounts normalize correctly.

—

# 154. Important Invariants

**Invariant 1**

Weapon mounts are native nested mech loadout data.

**Invariant 2**

Mounts themselves are not embedded Items and do not have stable native UUIDs.

**Invariant 3**

Weapons and mods inside mount slots are real embedded Items with stable identity.

**Invariant 4**

Mount type, fitting size, and weapon size are separate concepts.

**Invariant 5**

Native Lancer already constructs mount topology from the equipped Frame.

**Invariant 6**

Native Lancer already validates weapon fitting and Flex mount legality.

**Invariant 7**

Native weapon drops may temporarily create invalid mount state, so combat must revalidate.

**Invariant 8**

Superheavy bracing is represented natively through mount.bracing.

**Invariant 9**

Native Superheavy validation requires bracing but does not preserve an explicit paired-mount identity.

**Invariant 10**

Integrated Superheavy weapons can be exempt from ordinary bracing requirements.

**Invariant 11**

Improved Armament, Mount Retrofitting, and Integrated Weapon have native loadout-level support.

**Invariant 12**

The final actor loadout should be treated as combat authority.

**Invariant 13**

Native WeaponAttackFlow does not preserve mount identity.

**Invariant 14**

Frame Helm must own mount-aware Skirmish/Barrage parent orchestration.

**Invariant 15**

Weapons on the same mount must share that mount’s target.

**Invariant 16**

Different Barrage mounts may target different characters.

**Invariant 17**

Superheavy weapons cannot Skirmish and use Barrage as a special mount/bracing case.

**Invariant 18**

Mount context must survive into Frame Helm’s semantic attack event/modifier layer.

**Invariant 19**

Persistent selected-mount Core Bonus state requires revalidation because native mounts have no stable UUID.

**Invariant 20**

Frame Helm should not rebuild or routinely mutate native mount topology during combat.

—

# 155. Final Working Model

MECH
│
└── NATIVE LOADOUT
    │
    └── weapon_mounts[]
        │
        ├── MOUNT
        │   ├── type
        │   ├── bracing
        │   └── slots[]
        │       ├── fitting size
        │       ├── weapon → embedded Item
        │       └── mod → embedded Item
        │
        ├── NATIVE CONSTRUCTION
        │   ├── Frame mount definitions
        │   ├── Integrated Frame weapons
        │   ├── Improved Armament
        │   ├── Mount Retrofitting
        │   ├── Integrated Weapon
        │   └── COMP/CON special mount import
        │
        ├── NATIVE VALIDATION
        │   ├── fitting size
        │   ├── Flex rules
        │   ├── Superheavy bracing
        │   └── Integrated exceptions
        │
        └── FRAME HELM COMBAT BRIDGE
            │
            ├── SKIRMISH
            │   ├── choose one valid mount
            │   ├── one mount target
            │   ├── expand occupied weapon slots
            │   ├── sibling weapons share target
            │   └── execute native weapon attacks
            │
            ├── BARRAGE
            │   ├── choose two valid mounts
            │   ├── target per mount
            │   ├── expand each mount’s weapons
            │   ├── sibling weapons share mount target
            │   └── execute native weapon attacks
            │
            ├── SUPERHEAVY BARRAGE
            │   ├── detect Superheavy
            │   ├── trust native bracing validation
            │   ├── consume Barrage
            │   └── execute Superheavy once
            │
            └── ATTACK CONTEXT
                ├── mount reference/signature
                ├── mount type
                ├── slot index
                ├── weapon UUID
                ├── mod UUID
                ├── mount target
                └── parent action

The critical architectural rule is:

**Foundry Lancer already owns the mech’s weapon-mount topology, fitting rules, bracing state, installed weapons/mods, and several Core Bonus loadout transformations. Frame Helm should consume that native loadout as authoritative and add the missing tactical layer: select mounts as the units of Skirmish/Barrage, preserve same-mount target grouping, carry mount identity into attack context, and then delegate each actual weapon attack to the native weapon attack machinery.**
`;

fs.writeFileSync(“weapon-mounts.md”, content, “utf8”);

console.log(
  `Wrote weapon-mounts.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);