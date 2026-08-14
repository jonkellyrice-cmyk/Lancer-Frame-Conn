cat > docs/aoe.md <<‘EOF’
# Lancer Area-of-Effect Templates and Resolution — Native Repository Integration Notes

## Status

**Native structured Line / Cone / Blast / Burst range data:** Found.

**Native AoE template implementation:** Found.

**Native `WeaponRangeTemplate.fromRange(...)`:** Found.

**Native drag/place/rotate template interaction:** Found.

**Native grid snapping:** Found.

**Native Burst token-centering behavior:** Found.

**Native large-token intersection logic:** Found.

**Native gridless AoE intersection logic:** Found.

**Native friendly-fire-inclusive target acquisition:** Found.

**Native ignored-token / ignored-disposition support:** Found.

**Native `targetsFromTemplate(...)`:** Found.

**Native AoE integration in attack HUD:** Found.

**Native multi-target attack resolution:** Found.

**Native separate attack rolls per AoE target:** Found.

**Native per-target Accuracy/Difficulty handling:** Found.

**Native attack-template cleanup:** Found.

**Native generic multi-target save resolver:** Not found.

**Native generic AoE consequence engine:** Not found.

**Native complete Blast placement Range/LOS legality:** Not found.

**Frame Conn implementation status:** Frame Conn should reuse native Lancer AoE geometry, placement, token intersection, targeting, and multi-target attack machinery. Frame Conn should add the missing placement-legality, save-resolution, source-specific exception, and non-attack consequence orchestration.

## Purpose

This document records the native Foundry Lancer architecture for area-of-effect mechanics including:

- Line;
- Cone;
- Blast;
- Burst.

AoE mechanics can appear on:

- Mech Weapons;
- Mounted Systems;
- Mech Traits;
- Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses;
- other actor-owned actions/effects.

The AoE geometry itself is largely implemented natively.

The key architectural rule is:

> Frame Conn should not recreate Line, Cone, Blast, or Burst geometry.

Instead:

> Frame Conn should reuse native Lancer template placement and target acquisition, then route the acquired targets into the correct attack, save, or automatic-resolution strategy.

—

# 1. Native AoE Architecture

The native weapon AoE architecture is conceptually:

weapon / action
→ structured range data
→ identify AoE range type
→ `WeaponRangeTemplate.fromRange(...)`
→ `placeTemplate()`
→ native Foundry MeasuredTemplate
→ `targetsFromTemplate(template.id)`
→ qualifying scene tokens become targets
→ parent action resolves those targets.

This gives Frame Conn a native geometry and target-acquisition subsystem.

—

# 2. Native Structured Range Data

Native Lancer represents weapon ranges structurally.

Conceptually:

`RangeData`

contains:

- range type;
- range value.

Relevant types include:

- Range;
- Threat;
- Thrown;
- Line;
- Cone;
- Blast;
- Burst.

Therefore Frame Conn should not parse strings such as:

`BLAST 2`

from description prose when structured native range data exists.

—

# 3. AoE Range Types

The relevant native AoE types are:

`Line`

`Cone`

`Blast`

`Burst`

Each carries a numeric size:

`Line 5`

`Cone 3`

`Blast 2`

`Burst 1`

The numeric value belongs to the area geometry.

—

# 4. Blast Has Separate Placement Range

Blast differs from ordinary centered area shapes.

A weapon may contain:

`Range 10`

and:

`Blast 2`

These mean different things.

Conceptually:

`Range 10`
→ legal distance from attacker to Blast center

`Blast 2`
→ radius/size of affected area around that center.

Frame Conn must preserve both pieces.

—

# 5. Native Weapon AoE Discovery

Native Mech Weapons can expose AoE entries through helpers conceptually equivalent to:

`item.rangesFor([...])`

with types including:

- Blast;
- Burst;
- Cone;
- Line.

The helper reads the currently active weapon profile.

Therefore alternate weapon profiles are naturally respected.

Frame Conn should query native weapon data rather than cache AoE size separately.

—

# 6. Native `WeaponRangeTemplate`

The repository provides:

`WeaponRangeTemplate`

in:

`src/module/canvas/weapon-range-template.ts`

This is the canonical native AoE template primitive.

Frame Conn should reuse it.

—

# 7. Native Shape Mapping

`WeaponRangeTemplate.fromRange(...)` maps Lancer ranges to Foundry templates.

Conceptually:

Cone
→ Foundry cone

Line
→ Foundry ray

Blast
→ Foundry circle

Burst
→ Foundry circle with Burst-specific centering behavior.

Frame Conn should not draw its own canvas shapes.

—

# 8. Native Template Construction

The native entry point is conceptually:

`WeaponRangeTemplate.fromRange(range, creatorToken?)`

Inputs include:

- AoE range data;
- optional creator token.

This produces a native Lancer template wrapper ready for placement.

—

# 9. Creator Token

The creator token identifies the source of the AoE.

This is important for:

- Line;
- Cone;
- Burst centering;
- self-ignore behavior;
- source metadata;
- later Range/LOS validation.

Frame Conn should provide the authoritative source token where available.

—

# 10. Native Template Placement

Calling:

`template.placeTemplate()`

starts the native Foundry canvas placement interaction.

The user can:

- move the template with the pointer;
- rotate it where appropriate;
- snap it to the grid;
- confirm with left click;
- cancel with right click.

This is already the desired user interaction for Frame Conn.

—

# 11. Frame Conn Should Not Build a Custom Drag Tool

The native placement UI already solves:

- cursor following;
- grid snapping;
- rotation;
- placement confirmation;
- placement cancellation;
- scene template creation.

Therefore Frame Conn should use the native template layer rather than build a parallel drag-and-drop system.

—

# 12. Native Placement Result

Once confirmed, native placement creates a real Foundry:

`MeasuredTemplate`

on the current scene.

The native `placeTemplate()` promise resolves after the template has rendered.

Frame Conn can then immediately resolve affected targets.

—

# 13. Template Cancellation

If the player cancels placement:

→ no valid template is returned.

Frame Conn should treat this as:

`AoE placement cancelled`

not:

`attack/save successfully executed`.

The parent committed-action cancellation policy should determine whether the action remains available or already spent.

—

# 14. Native Template Flags

Native Lancer stores template metadata under Lancer flags.

Relevant concepts include:

- creator;
- ignored tokens;
- ignored dispositions;
- range;
- attack-template marker.

Frame Conn should preserve these flags rather than creating separate parallel metadata.

—

# 15. Attack Template Flag

Attack templates can be marked with:

`flags.lancer.isAttack = true`

or the equivalent system namespace.

This lets native combat cleanup recognize temporary attack templates.

Frame Conn should preserve this flag for AoE attacks.

—

# 16. Native Attack Template Cleanup

Native combat automation can remove attack templates on turn changes when the relevant automation setting is enabled.

Therefore Frame Conn should not necessarily manually delete every attack template immediately after resolution.

It should preserve native lifecycle where appropriate.

Temporary non-attack templates may need separate cleanup policy.

—

# 17. Native `targetsFromTemplate(...)`

The repository exposes a native helper:

`targetsFromTemplate(template.id)`

also reachable through:

`game.lancer.targetsFromTemplate(...)`

This is the canonical target-acquisition helper for placed templates.

Frame Conn should reuse it.

—

# 18. Native Grid Target Intersection

On gridded scenes, native target acquisition compares:

template-highlighted spaces

against:

token-occupied spaces.

If any occupied space intersects any affected space:

→ the token qualifies.

This correctly handles large characters.

—

# 19. Large Tokens

A Size 2+ character occupies multiple spaces.

Native AoE target acquisition tests occupied spaces rather than only token center.

Therefore:

any occupied space intersects AoE
→ token qualifies.

Frame Conn should not replace this with a token-center test.

—

# 20. Native Gridless Target Intersection

The repository also contains explicit geometry for gridless scenes.

Supported template shapes include concepts equivalent to:

- circle;
- cone;
- ray/line;
- rectangle.

Token radius/size is accounted for.

Therefore native AoE targeting is not limited to hex-grid play.

—

# 21. Friendly Fire Is Native Default Behavior

Native target acquisition does not filter targets by hostility by default.

Therefore:

hostile token in AoE
→ included

allied token in AoE
→ included

neutral token in AoE
→ included if otherwise valid.

This correctly preserves Lancer friendly fire.

—

# 22. Friendly Fire Must Remain the Default

Frame Conn should not implement:

AoE targets = hostiles only.

The correct default is:

all affected characters.

Exceptions belong to specific:

- systems;
- traits;
- core powers;
- talents;
- effects.

—

# 23. Native Ignore Lists

Native template flags support:

ignored token IDs

and:

ignored dispositions.

This gives Frame Conn a useful exception mechanism.

Example:

ability says allies are unaffected
→ ignore allied disposition

or:

specific target is exempt
→ ignore token ID.

—

# 24. Exception-Driven Friendly Fire Architecture

Preferred architecture:

default:
→ everyone affected

special source effect:
→ modify exclusion set

then:
→ native target acquisition.

This matches Lancer’s default-friendly-fire rules.

—

# 25. Cone Self-Exclusion

Native Cone templates automatically treat the creator appropriately so the source is not incorrectly included as a target.

Frame Conn should preserve creator-token metadata.

—

# 26. Line Self-Exclusion

Native Line templates similarly handle the creator token appropriately.

Do not manually remove the attacker afterward if native template flags already do so.

—

# 27. Blast Behavior

Blast is placed at a point.

Its center is not necessarily the attacker.

Conceptually:

attacker
→ legal center within source Range/LOS
→ Blast X around center.

Native template geometry handles the Blast area.

Frame Conn must still validate legal placement.

—

# 28. Burst Behavior

Burst is centered on a character or source location and includes the space occupied by the center character.

Native Lancer contains special Burst behavior beyond an ordinary circle.

This should be reused.

—

# 29. Native Burst Token Snapping

During Burst placement, the template can snap to a token.

The native implementation records the centered token and adjusts the area for token Size.

This is important for Lancer’s Burst geometry around large characters.

—

# 30. Native Burst Size Compensation

Native Burst radius calculation accounts for the centered character’s Size.

Conceptually:

Burst range
+
token size contribution
→ correct template radius.

Frame Conn should not calculate this manually.

—

# 31. Burst Center Token Ignore Behavior

The token at the center of a Burst can be placed in the template ignore set where appropriate.

This supports effects that originate on the user/target but do not affect the center character.

The parent action still determines whether the center should actually be affected.

Frame Conn should preserve source-specific semantics.

—

# 32. AoE Template Support Is Already in Native Attack HUD

The native Accuracy/Difficulty attack HUD already detects AoE ranges on weapons.

Relevant native types include:

- Blast;
- Burst;
- Cone;
- Line.

The stock attack UI can expose template buttons for these ranges.

This confirms the template subsystem is intended to integrate directly with attacks.

—

# 33. Native Attack HUD Placement Sequence

The stock attack HUD can conceptually perform:

weapon AoE button
→ `WeaponRangeTemplate.fromRange(...)`
→ set attack-template flag
→ `placeTemplate()`
→ `targetsFromTemplate(...)`

This is nearly the exact behavior Frame Conn wants.

—

# 34. AoE Placement Should Move Earlier in Frame Conn UX

The native sheet currently exposes AoE template placement from inside the attack HUD.

Frame Conn may provide a cleaner sequence:

weapon selected
→ detect AoE
→ place template
→ acquire targets
→ launch attack HUD already populated with all targets.

This changes presentation/order without replacing native mechanics.

—

# 35. Native WeaponAttackFlow Supports Multiple Targets

Native `WeaponAttackFlow` does not assume a single target.

Its targeting data can contain multiple targets.

This is critical for AoE attacks.

—

# 36. Separate Attack Roll Per Target

Native attack machinery builds a separate targeted attack roll for each selected target.

Therefore AoE attack resolution correctly follows:

one attack roll per affected character.

Frame Conn should reuse this rather than loop custom attack formulas.

—

# 37. Per-Target Modifiers

Each native targeted roll can independently account for:

- Evasion;
- E-Defense;
- Cover;
- Prone;
- Lock On;
- Invisible;
- Accuracy/Difficulty;
- other target-specific state.

This is why using native multi-target WeaponAttackFlow is preferable to one shared attack roll.

—

# 38. Native Multi-Target Attack HUD

The native attack HUD can represent several selected targets at once.

Each target receives its own modifier section.

Then one Roll command resolves separate attacks.

This is likely preferable to opening one modal per target.

—

# 39. Preferred Initial AoE Attack UX

Conceptually:

Frame Conn weapon attack
→ detect AoE
→ native template placement
→ native target acquisition
→ launch native multi-target attack HUD
→ one target panel per affected character
→ Roll
→ separate native attack rolls
→ native hit/miss/critical resolution.

This is the safest first implementation.

—

# 40. Mature Automatic AoE Attack UX

Eventually:

Frame Conn
→ auto-compute all Accuracy/Difficulty
→ template placement
→ target acquisition
→ automatically roll every target
→ automatically roll shared/per-target damage according to Lancer rules
→ automatically apply damage.

But the first implementation should preserve native attack HUD behavior.

—

# 41. AoE Geometry and Resolution Mode Must Be Separate

The area shape does not tell us how targets resolve the effect.

A:

`Blast 2`

could represent:

- an attack against each target;
- a save from each target;
- an automatic effect.

Therefore AoE should be modeled as two dimensions:

geometry

and:

resolution mode.

—

# 42. Proposed AoE Resolution Model

Conceptually:

`AoEExecution`

contains:

geometry:
- type;
- size;
- placement constraints.

resolution:
- attack;
- save;
- automatic.

Then source-specific metadata determines consequences.

Exact internal type names are illustrative only.

—

# 43. Attack-Based AoE

Attack-based AoE:

template
→ target list
→ WeaponAttackFlow
→ one attack roll per target
→ hit/miss individually.

Native Lancer already provides most of this path.

—

# 44. Save-Based AoE

Save-based AoE:

template
→ target list
→ each target rolls specified save
→ success/failure individually
→ source-specific consequence.

This orchestration is not fully implemented natively.

Frame Conn must supply it.

—

# 45. Automatic AoE

Some effects may simply affect every valid character in the area without attack/save.

Conceptually:

template
→ target list
→ apply effect to every valid target.

This also requires Frame Conn/source-specific orchestration.

—

# 46. Native Generic Save AoE Is Missing

Native `SystemFlow` contains TODOs conceptually equivalent to:

`setSaveTargets`

and:

`rollSaves`

but these steps are not implemented as a general engine.

Therefore there is no reusable native equivalent to WeaponAttackFlow for arbitrary AoE saves.

—

# 47. Native ActivationFlow Save Support Is Incomplete

Generic item/system activation code also contains TODO-level handling around save prompting/parsing.

Therefore Frame Conn should not expect:

`item.beginActivationFlow(...)`

to automatically perform multi-target saves simply because the ActionData contains an AoE.

—

# 48. Frame Conn Save AoE Responsibility

Frame Conn must eventually own:

- target list from template;
- save type;
- source Save Target;
- one save per target;
- success/failure outcome;
- source-specific half/full/condition consequence.

Native stat/save primitives should still be reused where available.

—

# 49. Save Target

For save-based AoEs, Frame Conn must resolve the correct:

`Save Target`

from the source actor/effect according to Lancer rules.

Do not hard-code one universal target number.

—

# 50. Save Type

The action/system must identify the required save.

Examples may include:

- Agility;
- Hull;
- Systems;
- Engineering.

Frame Conn should preserve this structurally where native action data exposes it.

—

# 51. Separate Save Per Target

Each affected target resolves its own save independently.

Therefore:

Target A
→ success

Target B
→ failure

Target C
→ success

must be possible from one AoE.

Do not roll one shared save for the group.

—

# 52. AoE Damage Roll Convention

The rulebook states that for AoE weapon attacks:

separate attack rolls are made for each target

but:

damage is rolled once

and:

bonus damage is halved if multiple characters are affected.

Therefore Frame Conn should distinguish:

attack-roll multiplicity

from:

damage-roll multiplicity.

This must be preserved when later automating damage.

—

# 53. Shared Damage for AoE Weapon Attack

For an AoE weapon attack:

targets
→ individual attack rolls

then:

damage dice
→ roll once

successful targets
→ receive the shared damage result

subject to normal modifiers.

This should be confirmed against the exact attack source before final implementation.

—

# 54. Bonus Damage on Multi-Target Attacks

Lancer rules halve bonus damage for attacks targeting more than one character.

Therefore Frame Conn’s mature automatic damage resolver must know:

number of targets affected by the attack

and:

which damage components are bonus damage.

Native weapon damage infrastructure may already contain relevant support and should be traced before duplicating this rule.

—

# 55. Valid AoE Targets

Native `targetsFromTemplate(...)` returns tokens based on geometry and ignore settings.

The parent action must still enforce valid-target rules.

Potential targets include:

- characters;
- objects;
- environmental spaces;

depending on the source effect.

A weapon attack may not use exactly the same target-validity filter as every system/core power.

—

# 56. Line of Sight

The rulebook requires attack targets to generally be within line of sight unless a source says otherwise.

AoE placement therefore does not eliminate LOS rules.

Frame Conn must validate source-specific LOS requirements.

—

# 57. Seeking Exception

Seeking weapons can ignore cover and line of sight if a physical path exists.

Native attack resolution already handles Cover exceptions.

Frame Conn placement legality may need to respect Seeking when deciding whether a Blast center or target area is legally reachable.

—

# 58. Arcing Exception

Arcing weapons can attack targets without line of sight but still require a physically possible trajectory and remain affected by Cover.

This means AoE placement legality cannot reduce to:

`LOS yes/no`

for every attack.

Weapon tags matter.

—

# 59. Placement Legality Is Separate From Geometry

Native `placeTemplate()` handles canvas placement.

It does not itself represent the complete tabletop legality of where the template may be placed.

Therefore Frame Conn needs:

placement UI

plus:

placement validation.

—

# 60. Blast Placement Validation

For a:

`Range Y + Blast X`

weapon/effect:

Frame Conn should validate the Blast center against:

- maximum Range Y;
- LOS where required;
- source-specific tags;
- legal scene location;
- any special effect restrictions.

The native template then determines targets inside Blast X.

—

# 61. Cone Placement Validation

Cone normally originates from the attacker.

Frame Conn should ensure the native template remains correctly anchored/oriented relative to the source.

Source-specific range or tag restrictions should still be enforced.

—

# 62. Line Placement Validation

Line similarly originates from the attacker and extends outward.

Frame Conn should preserve native source anchoring and validate source-specific legality.

—

# 63. Burst Placement Validation

Burst usually centers on:

- user;
- target;
- source-defined character/location.

The parent action should determine the valid center.

If center is fixed:

Frame Conn may not need arbitrary free placement at all.

—

# 64. Burst on Self

For:

`Burst X centered on self`

Frame Conn can conceptually:

resolve source token
→ construct native Burst
→ anchor directly to source
→ target acquisition

without requiring the player to drag the template.

This is a useful future automation.

—

# 65. Burst on Target

For target-centered Burst:

select target
→ native Burst centered on target
→ acquire affected characters.

Again, the source effect determines valid center.

—

# 66. Template Target Snapshot

After placement and acquisition, Frame Conn should preserve the target set for that specific execution.

Conceptually:

template confirmed
→ acquire target UUIDs
→ snapshot target UUIDs
→ resolve attack/save against snapshot.

This avoids ambiguity if token positions change during resolution.

—

# 67. Do Not Depend Only on Current Foundry User Targets

Native target acquisition may update the user’s target set.

For robust execution, Frame Conn should capture the acquired target UUIDs rather than relying indefinitely on mutable `game.user.targets`.

The target snapshot belongs to the action execution context.

—

# 68. Barrage Integration

Barrage attacks with multiple mounts.

Each selected weapon may independently be:

- single-target;
- AoE.

Therefore Barrage orchestration should treat each weapon/mount attack separately.

—

# 69. Skirmish Integration

Skirmish attacks using one mount.

A weapon in that mount may be AoE.

The selected weapon attack can expand from:

one weapon execution

to:

many affected targets

without changing the fact that the parent action is one Skirmish.

—

# 70. Mount Targeting vs AoE Expansion

These should remain separate concepts.

Mount targeting determines:

which target/context the mount is being used against.

AoE expansion determines:

which characters are affected by the chosen weapon’s area.

Do not collapse mount selection into AoE target discovery.

—

# 71. Multi-Weapon Mounts

A mount may contain more than one weapon.

If one weapon is AoE and another is not:

each weapon retains its own attack characteristics.

The mount’s shared-target restrictions still need to be reconciled with AoE expansion under the tabletop rules.

This deserves explicit Skirmish/Barrage test coverage.

—

# 72. Superheavy Weapons

Superheavy weapons use Barrage and occupy two mounts.

If a Superheavy weapon has AoE:

its single weapon attack may affect multiple characters through the same template architecture.

The parent action remains Barrage.

—

# 73. Mounted Systems Integration

Mounted Systems may grant actions with:

- Line;
- Cone;
- Blast;
- Burst.

The native weapon `rangesFor(...)` helper does not necessarily cover arbitrary systems.

Therefore system action data must be researched separately.

—

# 74. ActionData Range

Native system/item actions may expose structured:

`ActionData.range`

or equivalent range metadata.

Frame Conn should inspect this before falling back to prose parsing.

—

# 75. Mech Traits Integration

Traits can grant:

- automatic AoE effects;
- attack-like AoEs;
- save-based AoEs;
- triggered Bursts/Blasts.

Trait source identity and resolution mode must be preserved.

AoE geometry can still reuse the shared native adapter.

—

# 76. Core Power Integration

Core Powers may contain AoE actions or triggered areas.

These should use the same shared AoE geometry service.

Do not create Core Power-specific template code.

—

# 77. Pilot Talent Integration

Talents can modify:

- affected area;
- valid targets;
- friendly fire;
- attack/save behavior;
- AoE damage.

The source-specific rules layer should apply these exceptions before/after native target acquisition as appropriate.

—

# 78. Manufacturer Core Bonus Integration

Core Bonuses may:

- modify Range;
- modify AoE size;
- alter targeting;
- exempt allies;
- add effects to affected targets.

Structured native bonuses should be preferred over prose parsing.

—

# 79. AoE Range Modification

Some traits/systems may increase:

Range

without increasing:

Line/Cone/Burst/Blast size.

The rulebook explicitly distinguishes these.

Therefore Frame Conn must not automatically scale AoE size whenever ordinary Range increases.

—

# 80. Area Size Modification

If a specific effect modifies:

Burst size

or:

Blast size

that should modify the AoE geometry itself.

This is separate from ordinary weapon Range.

—

# 81. Native Friendly Fire Exception Inputs

A source-specific ability that excludes allies can conceptually supply:

ignored disposition

or:

specific ignored token IDs

before target acquisition.

This should be handled as source configuration rather than hardcoded inside the template adapter.

—

# 82. Specific-Target Exemption

Some AoEs may say:

`all characters except you`

or:

`all hostile characters`

or:

`all characters except chosen ally`.

The shared AoE resolver should support exclusion sets before consequence resolution.

—

# 83. Post-Acquisition Filtering

If native template acquisition returns all intersecting tokens:

Frame Conn may apply source-specific filtering afterward.

However, geometry should remain native.

Conceptually:

native geometric targets
→ source-rule filter
→ final mechanical targets.

—

# 84. Prefer Explicit Native Ignore Metadata Where Practical

If the template UI itself should visually exclude certain token categories:

use native ignore flags before acquisition where possible.

If exclusions are complex:

post-filtering is acceptable.

The effect’s rules remain authoritative.

—

# 85. Template Visualization Is Not Resolution

Placing the template does not itself:

- roll attacks;
- roll saves;
- apply damage;
- apply statuses.

It only determines affected geometry.

Frame Conn must treat template placement as one stage of the action execution pipeline.

—

# 86. Proposed Shared AoE Native Adapter

Conceptually:

`native-lancer-aoe-adapter`

should expose capabilities such as:

`getWeaponAoERanges(item)`

`createTemplate(range, creatorToken)`

`placeTemplate(template)`

`targetsFromTemplate(template)`

`markAttackTemplate(template)`

`setIgnoredTokens(template, tokenIds)`

`setIgnoredDispositions(template, dispositions)`

`removeTemplate(template)`

Exact names are illustrative only.

—

# 87. Proposed Frame Conn AoE Rules Layer

Above the native adapter:

`frame-conn-aoe-resolution`

may own:

`validatePlacement(...)`

`resolveAttackAoE(...)`

`resolveSaveAoE(...)`

`resolveAutomaticAoE(...)`

`applyFriendlyFireExceptions(...)`

`resolveSourceRangeModifiers(...)`

`resolveValidTargets(...)`

This prevents the native adapter from becoming a rules engine.

—

# 88. Attack AoE Resolution Architecture

Conceptually:

source attack
→ determine AoE
→ create native template
→ validate placement
→ place template
→ native target acquisition
→ apply source-specific exclusions
→ snapshot targets
→ launch native WeaponAttackFlow
→ native per-target attack modifiers
→ separate attacks
→ shared/native damage handling
→ apply damage.

—

# 89. Save AoE Resolution Architecture

Conceptually:

source action/effect
→ determine AoE
→ create native template
→ validate placement
→ place template
→ native target acquisition
→ apply source-specific exclusions
→ snapshot targets
→ determine save type
→ determine Save Target
→ for each target:
   roll native-compatible save
→ resolve each result
→ apply source-specific consequence.

—

# 90. Automatic AoE Resolution Architecture

Conceptually:

source effect
→ AoE template
→ target acquisition
→ source-specific exclusions
→ snapshot targets
→ apply deterministic effect to each target
→ status/damage/native mutation.

No attack or save is needed unless the source says otherwise.

—

# 91. Attack AoE Target HUD

The initial implementation should preserve the native multi-target Accuracy/Difficulty HUD.

This gives the player:

- target-by-target visibility;
- target-specific Cover;
- target-specific Prone;
- target-specific Lock On;
- target-specific Invisible;
- manual adjustment.

This is particularly valuable while modifier automation remains incomplete.

—

# 92. Future Fully Automated Attack AoE

Eventually:

template placed
→ targets acquired
→ all target-specific Accuracy/Difficulty derived automatically
→ attacks rolled automatically
→ hits identified
→ damage rolled once where appropriate
→ damage automatically applied.

The native multi-target attack model should remain the mechanical foundation.

—

# 93. Future Fully Automated Save AoE

Eventually:

template placed
→ targets acquired
→ save type + target number derived
→ every target saves automatically
→ success/failure determined
→ half/full/status consequences applied
→ one consolidated result presented.

This functionality will be primarily Frame Conn-owned because native generic save AoE is incomplete.

—

# 94. Native Attack Template Macros

The repository also contains stock macros for common AoE templates.

Examples include:

- Cone templates;
- Line templates;
- Blast templates;
- Burst templates.

These use the same native pattern:

`WeaponRangeTemplate.fromRange(...)`
→ `placeTemplate()`
→ `targetsFromTemplate(...)`

This further confirms the AoE API is an intentional native integration surface.

—

# 95. Do Not Hardcode Template Sizes

Even though stock macros exist for common sizes:

Frame Conn should use the item’s/action’s actual structured range value.

This supports:

- custom weapons;
- LCP content;
- modified profiles;
- systems;
- future content.

—

# 96. Template Rotation

Cone and Line placement can be rotated through the native Foundry template UI.

Frame Conn should preserve this native behavior.

Do not implement custom angle controls unless a future UI replaces native placement entirely.

—

# 97. Grid Snapping

Native placement uses Foundry grid snapping.

Frame Conn should not manually round canvas coordinates for attack templates.

This preserves consistency across:

- hex;
- square;
- gridless scenes.

—

# 98. Elevation

The repo’s AoE template system is primarily 2D scene-template geometry.

If Frame Conn needs full elevation-aware AoE resolution:

this requires separate investigation.

Do not assume Burst/Blast automatically include/exclude tokens based on 3D elevation correctly.

—

# 99. Terrain and Walls

Template geometry and line-of-effect/LOS are separate concerns.

A token intersecting a template does not necessarily prove:

the effect can legally reach that token through terrain/walls.

Source-specific rules must determine whether:

- walls block;
- Arcing bypasses LOS;
- Seeking ignores LOS;
- effects propagate around obstacles.

This belongs to the rules/visibility layer.

—

# 100. Line of Effect vs Line of Sight

Lancer distinguishes visibility from physical path in some weapon tags.

Therefore mature AoE legality may need concepts such as:

- LOS;
- physical path;
- cover;
- Arcing;
- Seeking.

Do not reduce all AoE legality to one binary LOS function.

—

# 101. Cover and AoE Attacks

The rulebook specifies that for Blast:

Cover and line of sight are calculated based on:

the center of the Blast

rather than:

the attacker.

This is extremely important for automated target-specific attack modifiers.

Frame Conn’s cover evaluator must accept an attack origin distinct from the attacker’s token.

—

# 102. Blast Attack Origin

For a Blast attack:

attack origin for target Cover/LOS
→ Blast center.

Therefore:

Attacker A
→ places Blast at point B
→ Target C

Cover calculation:
B → C

not:
A → C.

This must be preserved in the attack context.

—

# 103. Cone / Line / Burst Attack Origin

For Cone, Line, and Burst:

Cover and LOS are generally calculated from the character/source according to the rules.

The attack context should carry the correct origin for each pattern.

—

# 104. AoE Attack Context

A mature attack context should preserve something conceptually like:

source actor/token

source weapon/action

AoE type

template ID

attack origin

target UUIDs

friendly-fire exclusions

Range/LOS rules

resolution mode.

This prevents later stages from reconstructing information from UI state.

—

# 105. Template IDs

Preserving the template document ID during execution is useful for:

- target acquisition;
- cleanup;
- debugging;
- chat links;
- visual state.

The execution context should retain it until the action resolves.

—

# 106. Template Cleanup on Cancellation

If an action is cancelled after template placement but before resolution:

Frame Conn should determine whether the template should be removed immediately.

Attack templates should not remain as stale battlefield artifacts accidentally.

—

# 107. Template Cleanup After Save AoE

Native automatic attack-template cleanup may not apply to non-attack save templates.

Frame Conn may need explicit cleanup after save/automatic AoE resolution.

This should be source/context aware.

—

# 108. Multiple AoEs in Barrage

A Barrage could theoretically include:

weapon A
→ AoE

weapon B
→ another AoE.

Each weapon should receive its own template/execution context.

Do not reuse one global AoE target list for the entire Barrage.

—

# 109. Multiple AoEs in One Mount

If multiple weapons on one mount each have AoE properties:

their mount targeting relationship and individual AoE expansion need explicit tabletop-rule validation.

Frame Conn should preserve each weapon’s own range/profile data.

—

# 110. AoE and Lock On

Each AoE attack target may independently have Lock On.

Native multi-target attack handling already supports per-target consumption.

Therefore:

Target A Lock On
→ native +1 Accuracy/consume

Target B no Lock On
→ no bonus.

Frame Conn should not attempt one global Lock On state for the AoE.

—

# 111. AoE and Cover

Each target may independently have:

- no Cover;
- Soft Cover;
- Hard Cover.

Native attack HUD supports per-target values.

Frame Conn’s mature automated cover evaluator should populate these individually.

—

# 112. AoE and Invisible

Each target may independently be Invisible.

Native attack rolls already apply per-target invisibility plugins.

This reinforces use of native multi-target attack flow.

—

# 113. AoE and Prone

Each target may independently be Prone.

Native attack target modifiers handle this independently.

—

# 114. AoE and Friendly Allies

Allies are valid affected characters by default.

Their defenses/statuses must be resolved normally.

Do not silently skip allied tokens during target acquisition.

—

# 115. AoE and Hidden

Whether a Hidden target can be included in an AoE depends on target/area rules.

Because area templates can affect spaces rather than requiring direct target selection in some cases, Hidden may interact differently with AoE attacks.

This should be handled by the targeting/rules layer, not geometry.

—

# 116. AoE and Invisible

Invisible characters may still be inside an area and targeted/affected.

If the effect uses attacks:

native individual attack miss chance applies.

If the effect uses saves/automatic effects:

Invisible should not automatically protect them unless the source rule says so.

—

# 117. AoE and Tech Attacks

Tech attacks may theoretically have patterns/ranges from systems.

Native tech attacks ignore Cover.

If an AoE Tech Attack exists:

target acquisition can reuse AoE geometry

while:

native TechAttackFlow or equivalent should own per-target E-Defense resolution.

This needs source-specific tracing.

—

# 118. AoE and Core Powers

Core Powers may create large area effects that are:

- attack;
- save;
- automatic.

The same geometry/resolution split applies.

This is one reason AoE should be its own shared subsystem rather than embedded only in weapon attack code.

—

# 119. AoE and Traits

Triggered Trait AoEs may occur outside normal action execution.

The AoE resolver therefore should not assume every area effect belongs to a committed Quick/Full Action.

It should accept a generic source execution context.

—

# 120. AoE and Reactions

A Reaction may potentially create an AoE attack/effect.

The geometry subsystem should remain independent of action type.

Reaction economy belongs to the parent action.

—

# 121. AoE and Protocols

A Protocol may activate an area effect.

Again:

Protocol timing/action source
→ parent action

AoE template/target acquisition
→ shared subsystem.

—

# 122. AoE and Prepare

A Prepared Quick Action may later resolve an AoE.

When triggered:

Prepared child action
→ AoE placement
→ targets
→ normal attack/save resolution.

Prepare should not need its own AoE code.

—

# 123. AoE and Self Destruct

Self Destruct produces:

Burst 2

with:

Agility saves.

This is a direct consumer of the shared save-AoE architecture.

Conceptually:

Self Destruct detonation
→ fixed Burst 2 centered on mech
→ native Burst geometry
→ targetsFromTemplate
→ save loop
→ full/half 4d6 Explosive
→ native damageCalc.

—

# 124. Self Destruct Should Not Need Manual Burst Geometry

Once the shared AoE adapter exists:

Self Destruct can reuse native Burst geometry rather than implementing a custom radius search.

This is an important consolidation opportunity.

—

# 125. AoE Source Discovery TODO

- [ ] Trace weapon `rangesFor(...)` completely.
- [ ] Trace alternate weapon profiles.
- [ ] Trace ActionData `range`.
- [ ] Trace Mech System range storage.
- [ ] Trace Core Power range storage.
- [ ] Trace Trait action range storage.
- [ ] Trace Talent action range storage.
- [ ] Trace Core Bonus action range storage.
- [ ] Define fallback only where structured data is absent.

—

# 126. Native Template Adapter TODO

- [ ] Wrap `WeaponRangeTemplate.fromRange(...)`.
- [ ] Wrap `.placeTemplate()`.
- [ ] Wrap `targetsFromTemplate(...)`.
- [ ] Preserve creator token.
- [ ] Preserve range metadata.
- [ ] Preserve attack-template flag.
- [ ] Support ignored token IDs.
- [ ] Support ignored dispositions.
- [ ] Return placed template document ID.
- [ ] Return acquired target UUID snapshot.
- [ ] Handle placement cancellation.

—

# 127. Placement Legality TODO

- [ ] Validate Blast center Range.
- [ ] Validate Blast center LOS.
- [ ] Handle Arcing.
- [ ] Handle Seeking.
- [ ] Validate Line origin.
- [ ] Validate Cone origin.
- [ ] Validate Burst center.
- [ ] Validate source-specific target/center restrictions.
- [ ] Validate scene bounds.
- [ ] Preserve native snapping.

—

# 128. Attack AoE TODO

- [ ] Detect AoE from weapon profile.
- [ ] Place native template before attack HUD.
- [ ] Acquire all qualifying targets.
- [ ] Preserve friendly fire.
- [ ] Apply source-specific exclusions.
- [ ] Snapshot target UUIDs.
- [ ] Launch native multi-target WeaponAttackFlow.
- [ ] Preserve per-target modifiers.
- [ ] Preserve native Lock On consumption.
- [ ] Preserve native Invisible.
- [ ] Preserve Cover exceptions.
- [ ] Determine shared damage roll behavior.
- [ ] Determine bonus-damage halving behavior.
- [ ] Apply damage through native damage pipeline.

—

# 129. Save AoE TODO

- [ ] Define reusable multi-target save resolver.
- [ ] Resolve save type.
- [ ] Resolve Save Target.
- [ ] Roll one save per target.
- [ ] Preserve native stat/save modifiers.
- [ ] Handle Stunned auto-fail Hull/Agility.
- [ ] Resolve success/failure independently.
- [ ] Apply half/full damage where relevant.
- [ ] Apply statuses/effects on fail/success as source requires.
- [ ] Consolidate output in chat/UI.

—

# 130. Automatic AoE TODO

- [ ] Support no-roll AoE effects.
- [ ] Apply effect to every qualifying target.
- [ ] Preserve friendly fire unless source excludes it.
- [ ] Use native status adapter.
- [ ] Use native damageCalc for damage.
- [ ] Preserve source duration/origin metadata.

—

# 131. Friendly Fire TODO

- [ ] Keep friendly fire enabled by default.
- [ ] Do not filter by disposition globally.
- [ ] Support ignored dispositions for explicit exceptions.
- [ ] Support ignored token IDs.
- [ ] Support post-acquisition rule filtering.
- [ ] Preserve manually adjudicated targets.

—

# 132. Cover / LOS TODO

- [ ] Build reusable attack-origin concept.
- [ ] Blast uses Blast center as Cover/LOS origin.
- [ ] Cone/Line/Burst use correct source origin.
- [ ] Feed per-target cover into native attack context.
- [ ] Respect Seeking.
- [ ] Respect Arcing.
- [ ] Reuse spatial/visibility service.
- [ ] Do not persist attacker-relative Cover globally.

—

# 133. Template Lifecycle TODO

- [ ] Mark attack templates as native attack templates.
- [ ] Reuse native turn cleanup where enabled.
- [ ] Remove cancelled stale templates.
- [ ] Define save-AoE template cleanup.
- [ ] Define automatic-effect template cleanup.
- [ ] Avoid leaving orphan templates after failed execution.

—

# 134. Smoke Test — Geometry

- [ ] Line template size correct.
- [ ] Cone template size correct.
- [ ] Blast template size correct.
- [ ] Burst template size correct.
- [ ] Line rotates correctly.
- [ ] Cone rotates correctly.
- [ ] Blast snaps correctly.
- [ ] Burst centers on token correctly.
- [ ] Burst Size compensation correct.
- [ ] gridless intersection works.
- [ ] large-token intersection works.

—

# 135. Smoke Test — Target Acquisition

- [ ] hostile token included.
- [ ] allied token included.
- [ ] neutral valid token included where appropriate.
- [ ] ignored token excluded.
- [ ] ignored disposition excluded.
- [ ] source excluded where native pattern requires.
- [ ] target UUID snapshot preserved.
- [ ] target list stable after placement.

—

# 136. Smoke Test — AoE Attack

- [ ] AoE weapon detected from active profile.
- [ ] native template appears automatically.
- [ ] placement cancellation handled.
- [ ] targets acquired automatically.
- [ ] native attack HUD opens with all targets.
- [ ] separate roll per target.
- [ ] target-specific Cover works.
- [ ] target-specific Prone works.
- [ ] target-specific Lock On works.
- [ ] target-specific Invisible works.
- [ ] friendly fire preserved.
- [ ] hit/miss independent per target.

—

# 137. Smoke Test — AoE Save

- [ ] template placed.
- [ ] all valid characters acquired.
- [ ] one save per target.
- [ ] correct save stat used.
- [ ] correct Save Target used.
- [ ] independent success/failure.
- [ ] half/full consequence correct.
- [ ] Stunned auto-fail integrated.
- [ ] allies save normally.
- [ ] output clear and consolidated.

—

# 138. Smoke Test — Blast

- [ ] Blast center cannot exceed legal Range.
- [ ] Blast center LOS handled correctly.
- [ ] Arcing exception works.
- [ ] Seeking exception works.
- [ ] Cover calculated from Blast center.
- [ ] targets inside radius acquired correctly.
- [ ] friendly fire preserved.

—

# 139. Smoke Test — Burst

- [ ] self-centered Burst anchors correctly.
- [ ] target-centered Burst anchors correctly.
- [ ] Size compensation correct.
- [ ] center token inclusion/exclusion follows source rules.
- [ ] Burst targets acquired correctly.
- [ ] Self Destruct Burst 2 can reuse shared resolver.

—

# 140. Smoke Test — Multiple Weapons

- [ ] Barrage weapon A AoE resolves independently.
- [ ] Barrage weapon B AoE resolves independently.
- [ ] Skirmish multi-weapon mount behaves correctly.
- [ ] superheavy AoE behaves correctly.
- [ ] one weapon’s target list does not leak into another.
- [ ] each template retains its own source context.

—

# 141. Important Invariants

**Invariant 1**

Line, Cone, Blast, and Burst are structured native range types.

**Invariant 2**

Frame Conn should not recreate AoE geometry.

**Invariant 3**

Native `WeaponRangeTemplate.fromRange(...)` is the preferred template primitive.

**Invariant 4**

Native `placeTemplate()` should remain the initial drag/place/rotate UI.

**Invariant 5**

Native `targetsFromTemplate(...)` should remain the preferred token-intersection engine.

**Invariant 6**

Friendly fire is the default.

**Invariant 7**

Allies should only be excluded when a specific rule says so.

**Invariant 8**

Native attack flow supports multiple targets and separate attacks per target.

**Invariant 9**

Per-target modifiers should remain native whenever possible.

**Invariant 10**

AoE geometry and resolution mode are separate concepts.

**Invariant 11**

Generic multi-target save orchestration is not currently implemented natively.

**Invariant 12**

Frame Conn must supply save-AoE orchestration.

**Invariant 13**

Template placement does not by itself validate all Range/LOS rules.

**Invariant 14**

Blast Cover/LOS attack origin is the Blast center, not necessarily the attacker.

**Invariant 15**

Attack target sets should be snapshotted after template placement.

**Invariant 16**

Systems, Traits, Core Powers, Talents, and Core Bonuses should reuse the same AoE subsystem.

—

# 142. Final Working Model

AREA OF EFFECT
│
├── SOURCE
│   ├── Weapon
│   ├── Mounted System
│   ├── Trait
│   ├── Core Power
│   ├── Talent
│   └── Core Bonus
│
├── STRUCTURED GEOMETRY
│   ├── LINE
│   ├── CONE
│   ├── BLAST
│   └── BURST
│
├── Native Lancer AoE Adapter
│   │
│   ├── `WeaponRangeTemplate.fromRange(...)`
│   ├── creator token
│   ├── ignore tokens/dispositions
│   ├── `.placeTemplate()`
│   ├── native grid snapping
│   ├── native rotation
│   ├── native Burst token centering
│   └── `targetsFromTemplate(...)`
│
├── Frame Conn Rules Layer
│   │
│   ├── validate Range
│   ├── validate LOS / physical path
│   ├── apply Arcing / Seeking exceptions
│   ├── preserve friendly fire
│   ├── apply explicit target exemptions
│   └── snapshot target UUIDs
│
└── RESOLUTION
    │
    ├── ATTACK
    │   │
    │   └── Native WeaponAttackFlow
    │       ├── one target panel per target
    │       ├── target-specific modifiers
    │       ├── separate attack roll per target
    │       └── native attack results
    │
    ├── SAVE
    │   │
    │   └── Frame Conn multi-target save resolver
    │       ├── save type
    │       ├── Save Target
    │       ├── one save per target
    │       └── source-specific consequence
    │
    └── AUTOMATIC
        │
        └── Frame Conn source-specific resolver
            ├── damage
            ├── status
            └── other native mutation

The critical architectural rule is:

**Native Lancer already knows how to draw the area and identify who is inside it. Frame Conn should decide whether those characters are attacked, make saves, or are affected automatically, then delegate the downstream mechanics to the appropriate native subsystem wherever possible.**
EOF