const fs = require(“fs”);

const content = String.raw`# Lancer Weapons — Native Repository Integration Guide

## Native Authority

Use native Mech Weapon Items and the currently selected profile.

Primary source:

\`\`\`text
weapon.system
├── destroyed
├── loaded
├── uses
├── selected_profile_index
├── actions[]
└── profiles[]
\`\`\`

Active profile contains:

\`\`\`text
type
damage[]
range[]
tags[]
effect
on_attack
on_hit
on_crit
actions[]
bonuses[]
synergies[]
counters[]
skirmishable
barrageable
\`\`\`

Prefer native structured data over description parsing.

—

# 1. Execution Entry Point

Normal weapon attacks use:

\`\`\`text
weapon.beginWeaponAttackFlow()
→ WeaponAttackFlow
\`\`\`

Native flow:

\`\`\`text
initAttackData
checkItemDestroyed
checkWeaponLoaded
checkItemLimited
checkItemCharged
setAttackTags
setAttackEffects
setAttackTargets
showAttackHUD
rollAttacks
applySelfHeat
updateItemAfterAction
printAttackCard
\`\`\`

Frame Conn should wrap this flow, not replace it.

—

# 2. Active Profile

Always resolve:

\`\`\`text
weapon.system.active_profile
\`\`\`

or equivalent current-profile accessor.

Do not flatten all profiles.

Profile switching may change:

- damage;
- range;
- tags;
- actions;
- special effects;
- Skirmish/Barrage eligibility.

—

# 3. Derived Native Weapon Values

Native preparation combines base weapon data with mods/bonuses.

Prefer derived values such as:

\`\`\`text
profile.all_damage
profile.all_range
profile.all_tags
\`\`\`

where available.

Do not manually reapply ordinary Weapon Mod additions.

—

# 4. Native Weapon Mod Context

Mount slot contains:

\`\`\`text
weapon
mod
\`\`\`

Native weapon preparation merges mod effects into the active profile.

Preserve mod Item identity in Frame Conn attack context.

—

# 5. Native Mechanics — Keep Native

The following are substantially implemented natively:

\`\`\`text
Destroyed weapon validation
Loading
Limited
Charged checks
Self Heat
Accurate
Inaccurate
Smart
Seeking: ignore Cover
Thrown attack classification
Armor Piercing
Overkill
Reliable
Critical damage
typed damage
Heat damage when represented as DamageData
Burn damage
AoE range data
Line / Cone / Blast / Burst templates
multi-target attacks
multi-target bonus-damage handling
weapon profile bonuses
\`\`\`

Do not duplicate these mechanics.

—

# 6. Loading

Loading weapon state uses:

\`\`\`text
weapon.system.loaded
\`\`\`

Native attack flow:

\`\`\`text
loaded == false
→ reject

successful Loading attack
→ loaded = false
\`\`\`

Reload behavior belongs to Stabilize/system effects.

—

# 7. Limited

Native Limited state uses:

\`\`\`text
weapon.system.uses.value
weapon.system.uses.max
\`\`\`

Native attack flow validates and consumes uses.

Do not create a Frame Conn Limited counter.

—

# 8. Self Heat

\`\`\`text
HEAT X (SELF)
\`\`\`

is handled natively by WeaponAttackFlow.

Frame Conn must only suppress it for special secondary attacks when the weapon rule explicitly says so.

—

# 9. Accurate / Inaccurate

Native attack HUD applies:

\`\`\`text
Accurate
→ +1 Accuracy

Inaccurate
→ +1 Difficulty
\`\`\`

Do not duplicate.

—

# 10. Smart

Native Smart attacks use:

\`\`\`text
E-Defense
\`\`\`

instead of:

\`\`\`text
Evasion
\`\`\`

Do not duplicate.

—

# 11. Seeking

Native support found:

\`\`\`text
Seeking
→ ignore Cover
\`\`\`

Missing/general Frame Conn responsibility:

\`\`\`text
ignore LOS
require physically possible path
\`\`\`

Targeting layer must handle this.

—

# 12. Arcing

Arcing targeting rules were not found as complete native runtime enforcement.

Frame Conn targeting layer must handle:

\`\`\`text
ignore LOS
preserve Cover
require possible projectile path
\`\`\`

—

# 13. Ordnance

Native tag recognition exists.

Runtime legality enforcement was not found.

Frame Conn must enforce:

\`\`\`text
must fire before moving/other non-Protocol actions
cannot attack Engaged targets unless allowed
cannot be used for Overwatch
\`\`\`

Use central action-legality state.

—

# 14. Knockback

Native tag data supports numeric Knockback and stacking.

No complete forced-movement consumer found.

On qualifying hit:

\`\`\`text
Knockback X
→ shared forced-movement resolver
\`\`\`

Do not implement movement inside weapon-specific code.

—

# 15. Range

Weapon Range is structured:

\`\`\`text
profile.range[]
\`\`\`

Relevant range types include:

\`\`\`text
Range
Threat
Thrown
Line
Cone
Blast
Burst
\`\`\`

Native WeaponAttackFlow does not fully enforce ordinary Range legality.

Frame Conn must validate Range before execution.

—

# 16. Line of Sight

No complete generic WeaponAttackFlow LOS rejection was found.

Frame Conn targeting layer must validate:

\`\`\`text
ordinary LOS
Arcing exceptions
Seeking exceptions
physical path where required
\`\`\`

—

# 17. Skirmish / Barrage Eligibility

Profiles contain:

\`\`\`text
skirmishable
barrageable
\`\`\`

Use these flags.

Do not infer legality solely from weapon size.

Default imported Superheavy behavior:

\`\`\`text
skirmishable = false
barrageable = true
\`\`\`

Mount selection is handled by \`weapon-mounts.md\`.

—

# 18. AoE

Reuse \`aoe.md\`.

Weapon profile structured range provides:

\`\`\`text
Line
Cone
Blast
Burst
\`\`\`

Frame Conn responsibilities:

\`\`\`text
placement legality
Range/LOS validation
source-specific exclusions
save/automatic-effect orchestration
\`\`\`

Do not recreate template geometry.

—

# 19. Native Damage

Use native DamageRollFlow and:

\`\`\`text
actor.damageCalc(...)
\`\`\`

Preserve native handling of:

\`\`\`text
Armor
Resistance
AP
Exposed
Shredded
Overshield
Heat
Burn
critical damage
Reliable
Overkill
bonus damage
multi-target bonus-damage halving
\`\`\`

—

# 20. Weapon Special-Effect Fields

Profiles structurally contain:

\`\`\`text
effect
on_attack
on_hit
on_crit
\`\`\`

WeaponAttackFlow copies these into attack state.

Generic native behavior:

\`\`\`text
display them in chat
\`\`\`

Generic mechanical execution:

\`\`\`text
NOT FOUND
\`\`\`

These fields are the primary Frame Conn weapon-automation gap.

—

# 21. Special Weapon Effects

Do not parse special-effect prose live.

Use stable weapon/profile identity plus a strategy registry.

Conceptually:

\`\`\`text
weapon LID
+ profile identity
→ weapon special strategy
\`\`\`

Unknown weapons must still work through native attack/damage flow.

—

# 22. Suggested Weapon Strategy Hooks

Shared semantic hooks:

\`\`\`text
onAttackDeclared
onAttackResolved
onHit
onCrit
onMiss
onDamageResolved
\`\`\`

Weapon-specific strategies should compose shared primitives.

Examples:

\`\`\`text
secondary attack
AoE
status
Heat
forced movement
counter mutation
temporary effect
damage modifier
\`\`\`

—

# 23. Annihilator

Native primary attack already covers:

\`\`\`text
Main
CQB
AP
Self Heat 2
Range 5
Threat 3
1d3+2 Energy
attack roll
damage
\`\`\`

Missing rule:

\`\`\`text
On Hit:
secondary attacks against all characters
within Burst 1 of primary target
\`\`\`

Required strategy:

\`\`\`text
primary native attack
→ if hit
→ Burst 1 centered on primary target
→ native AoE target acquisition
→ secondary attack against each affected character
\`\`\`

Secondary attack execution overrides:

\`\`\`text
no bonus damage
no Self Heat
no recursive Annihilator secondary attacks
\`\`\`

Suggested context flags:

\`\`\`text
secondaryAttack
suppressBonusDamage
suppressSelfHeat
suppressWeaponSpecialRecursion
\`\`\`

Exact names are implementation-specific.

—

# 24. Weapon Actions

Weapons may contain:

\`\`\`text
weapon.system.actions[]
profile.actions[]
\`\`\`

These are structured ActionData.

Expose them through the shared actor-owned action registry.

Where appropriate:

\`\`\`text
weapon.beginActivationFlow(actionPath)
\`\`\`

Do not confuse weapon actions with normal firing.

—

# 25. Weapon Counters

Profiles may contain:

\`\`\`text
counters[]
\`\`\`

No complete generic runtime consumer was found.

If used:

→ shared native CounterData adapter.

Do not create duplicate resources when a native counter exists.

—

# 26. Weapon Synergies

Profiles may contain:

\`\`\`text
synergies[]
\`\`\`

Preserve them for shared modifier/trigger processing.

Do not assume SynergyData is automatically executed natively.

—

# 27. Unique

Unique is recognized as tag/item metadata.

General loadout enforcement was not found.

Treat as loadout/configuration legality, not attack-flow logic.

—

# 28. Heat Target

If target Heat is encoded as native Heat DamageData:

→ native damage pipeline handles it.

If target Heat exists only in weapon special text:

→ weapon strategy must apply it.

Do not assume Self Heat handling also covers target Heat.

—

# 29. Attack Context

Frame Conn weapon execution context should preserve:

\`\`\`text
mech actor
weapon Item UUID
active profile
mount reference
slot index
weapon mod UUID
parent action
declared target
AoE template/targets if any
secondary/special attack flags
\`\`\`

See \`weapon-mounts.md\` for mount context.

—

# 30. Targeting Pipeline

Before native WeaponAttackFlow:

\`\`\`text
resolve active profile
→ validate weapon available
→ validate Skirmish/Barrage eligibility
→ validate Range
→ validate LOS/path
→ validate Ordnance
→ validate special targeting rules
→ establish target(s)
→ invoke native WeaponAttackFlow
\`\`\`

Native flow remains final validator for native item state.

—

# 31. Post-Attack Pipeline

After native attack result:

\`\`\`text
read hit/miss/crit
→ emit semantic weapon event
→ resolve standardized missing tags
→ resolve source-specific weapon strategy
→ launch native damage flow
→ resolve post-damage effects
\`\`\`

Exact ordering must follow each rule.

—

# 32. Native vs Frame Conn Ownership

## Native Lancer

\`\`\`text
weapon/profile data
selected profile
weapon mods
structured bonuses
attack HUD
attack rolls
destroyed validation
Loading
Limited
Self Heat
Accurate/Inaccurate
Smart
Seeking Cover behavior
AP
Overkill
Reliable
crit damage
typed damage
AoE geometry
native DamageRollFlow
damageCalc
\`\`\`

## Frame Conn

\`\`\`text
Range legality
LOS/path legality
Arcing
full Seeking targeting rule
Ordnance legality
Knockback movement
special effect execution
on_attack
on_hit
on_crit
weapon-specific secondary attacks
special statuses/movement/state
semantic attack events
\`\`\`

—

# 33. Weapon Strategy Fallback

If no weapon-specific strategy exists:

\`\`\`text
native attack still works
native damage still works
native implemented tags still work
special text remains visible in chat
\`\`\`

Never block unknown/custom LCP weapons solely because Frame Conn lacks bespoke automation.

—

# 34. Implementation TODO

- [ ] Native weapon adapter resolves active profile.
- [ ] Use derived all_damage/all_range/all_tags where appropriate.
- [ ] Preserve mounted mod context.
- [ ] Validate Range.
- [ ] Validate LOS/path.
- [ ] Implement Arcing targeting exception.
- [ ] Complete Seeking targeting exception.
- [ ] Enforce Ordnance.
- [ ] Apply Knockback via forced movement.
- [ ] Normalize weapon/profile actions.
- [ ] Support native profile counters.
- [ ] Add weapon-special strategy registry.
- [ ] Add semantic attack events.
- [ ] Add recursion/suppression flags for secondary attacks.
- [ ] Implement Annihilator strategy.
- [ ] Preserve unknown-weapon fallback.

—

# 35. Smoke Tests

- [ ] Destroyed weapon rejected.
- [ ] Loading weapon consumes loaded state.
- [ ] Limited weapon consumes native use.
- [ ] Self Heat applied once.
- [ ] Accurate/Inaccurate correct.
- [ ] Smart targets E-Defense.
- [ ] AP ignores Armor.
- [ ] Reliable works on miss.
- [ ] Overkill works.
- [ ] AoE uses native template/targeting.
- [ ] out-of-Range target rejected by Frame Conn.
- [ ] blocked LOS rejected.
- [ ] Arcing exception works.
- [ ] Seeking exception works.
- [ ] Ordnance restrictions enforced.
- [ ] Knockback moves target.
- [ ] special effect text still appears.
- [ ] unknown custom weapon still attacks normally.

—

# 36. Annihilator Smoke Test

- [ ] Primary attack uses native flow.
- [ ] Primary attack applies Self Heat 2 once.
- [ ] Primary hit creates Burst 1 around target.
- [ ] Friendly characters in Burst are included.
- [ ] Secondary attacks roll separately.
- [ ] Secondary attacks use no bonus damage.
- [ ] Secondary attacks apply no extra Self Heat.
- [ ] Secondary hits do not recursively trigger more secondary attacks.
- [ ] Native AP/damage behavior preserved.

—

# 37. Core Invariants

**Invariant 1**

Use the currently active native weapon profile.

**Invariant 2**

Do not duplicate native attack, damage, Limited, Loading, Self Heat, AP, Reliable, Overkill, Accurate, Inaccurate, Smart, or AoE mechanics.

**Invariant 3**

Range and LOS legality require Frame Conn orchestration.

**Invariant 4**

Arcing, full Seeking targeting, Ordnance, and Knockback require Frame Conn rules support.

**Invariant 5**

\`effect\`, \`on_attack\`, \`on_hit\`, and \`on_crit\` are structured native fields but are generically presentation-only.

**Invariant 6**

Weapon-specific rules should use registered semantic strategies, not runtime prose parsing.

**Invariant 7**

Unknown/custom weapons must degrade gracefully to native attack/damage behavior.

**Invariant 8**

Weapon execution must preserve mount and mod context.

—

# 38. Final Working Model

\`\`\`text
NATIVE WEAPON ITEM
│
├── active profile
│   ├── damage
│   ├── range
│   ├── tags
│   ├── bonuses
│   ├── actions
│   ├── counters
│   ├── synergies
│   ├── effect
│   ├── on_attack
│   ├── on_hit
│   └── on_crit
│
├── FRAME CONN PRE-ATTACK RULES
│   ├── mount context
│   ├── Range
│   ├── LOS/path
│   ├── Arcing
│   ├── Seeking
│   └── Ordnance
│
├── NATIVE WeaponAttackFlow
│   ├── attack modifiers
│   ├── attack rolls
│   ├── Limited/Loading
│   ├── Self Heat
│   └── chat result
│
├── FRAME CONN SPECIAL RULES
│   ├── on_attack strategy
│   ├── on_hit strategy
│   ├── on_crit strategy
│   ├── Knockback
│   └── special secondary effects
│
└── NATIVE DAMAGE
    ├── DamageRollFlow
    └── damageCalc
\`\`\`

Critical rule:

**Use native Lancer for standardized weapon combat. Frame Conn fills targeting-legality gaps and executes weapon-specific special rules that native Lancer only stores/displays as semantic weapon text.**
`;

fs.writeFileSync(“weapons.md”, content, “utf8”);

console.log(
  `Wrote weapons.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);