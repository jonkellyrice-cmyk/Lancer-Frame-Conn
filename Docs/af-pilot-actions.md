const fs = require(“fs”);

const content = String.raw`# Lancer Pilot Actions — Native Repository Integration Guide

## Scope

Pilot combat actions covered here:

- Fight
- Reload
- Jockey

Pilot actor/loadout/stat data already exists natively.

Frame Conn should reuse native Pilot actor state and only add the missing parent action orchestration.

—

# 1. Native Pilot Authority

Pilot actor provides:

\`\`\`text
GRIT
Triggers
HASE stats
Pilot Weapons
Pilot Gear
action_tracker
linked/active Mech relationship
\`\`\`

Do not duplicate Pilot stats or loadout state.

—

# 2. Pilot Action Economy

Pilot actors have native-shaped:

\`\`\`text
system.action_tracker
├── protocol
├── move
├── full
├── quick
├── reaction
├── free
└── used_reactions[]
\`\`\`

Existing flows do not provide complete action-cost enforcement.

Frame Conn owns Quick/Full/etc. expenditure.

—

# 3. Fight

No dedicated native:

\`\`\`text
FightFlow
FIGHT handler
\`\`\`

was found.

Fight should be a Frame Conn parent action over native Pilot attack machinery.

—

# 4. Native Pilot Weapon Attack

Pilot Weapon attack path:

\`\`\`text
Pilot Weapon
→ weapon.beginWeaponAttackFlow()
→ WeaponAttackFlow
\`\`\`

Native flow uses Pilot:

\`\`\`text
actor.system.grit
\`\`\`

for attack rolls.

Reuse this path.

—

# 5. Pilot Weapon Data

Pilot Weapons natively contain:

\`\`\`text
range[]
damage[]
tags[]
effect
loaded
uses
actions[]
bonuses[]
synergies[]
deployables[]
\`\`\`

Use native weapon data.

Do not create a separate Fight weapon model.

—

# 6. Fight Flow

Recommended:

\`\`\`text
FIGHT
→ require Pilot outside Mech
→ choose equipped Pilot Weapon
→ validate target
→ validate Range/LOS
→ invoke native WeaponAttackFlow
→ native damage flow
→ spend Full Action
\`\`\`

Use shared weapon targeting/damage infrastructure where applicable.

—

# 7. Basic Pilot Attack

Native actor entry point exists:

\`\`\`text
actor.beginBasicAttackFlow()
→ BasicAttackFlow
\`\`\`

For Pilot actors it uses GRIT.

Use only for generic/basic attacks where appropriate.

Pilot Weapon attacks should use WeaponAttackFlow.

—

# 8. Pilot Weapon Damage

Native DamageRollFlow supports Pilot Weapons.

Preserve native:

\`\`\`text
damage[]
tags[]
crit behavior
damageCalc(...)
\`\`\`

Do not implement a separate Pilot damage engine.

—

# 9. Pilot Weapon Loading

Pilot Weapons have native:

\`\`\`text
system.loaded
\`\`\`

WeaponAttackFlow checks Loading state.

If Loading weapon is unloaded:

\`\`\`text
attack rejected
\`\`\`

After firing:

\`\`\`text
system.loaded = false
\`\`\`

Do not duplicate this state.

—

# 10. Reload

No dedicated native Pilot:

\`\`\`text
ReloadFlow
RELOAD Quick Action
\`\`\`

was found.

Native loaded-state mutation exists.

Frame Conn only needs the Quick Action wrapper.

—

# 11. Reload Flow

Recommended:

\`\`\`text
RELOAD — Quick
→ require Pilot outside Mech
→ enumerate equipped Pilot Weapons
→ filter:
   Loading
   && loaded == false
→ select one
→ weapon.update({
    “system.loaded”: true
  })
→ spend Quick Action
→ refresh
\`\`\`

Optional chat output only.

—

# 12. Manual Native Reload State

Native sheet logic can manually toggle:

\`\`\`text
system.loaded
\`\`\`

This is state manipulation, not the official Reload action.

Frame Conn should enforce action economy when using Reload.

—

# 13. Jockey

No native:

\`\`\`text
JockeyFlow
JOCKEY handler
jockey state
jockey UI
\`\`\`

was found.

Jockey requires Frame Conn orchestration.

—

# 14. Jockey Preconditions

Official action:

\`\`\`text
JOCKEY — Full Action
\`\`\`

Require:

\`\`\`text
Pilot outside Mech
adjacent target Mech
valid hostile/eligible target
\`\`\`

Use shared adjacency/targeting logic.

—

# 15. Jockey Contest

Attacker uses:

\`\`\`text
GRIT
or
relevant Pilot Trigger
\`\`\`

Defender uses:

\`\`\`text
HULL
\`\`\`

Native roll primitives exist.

Frame Conn must coordinate the contested check.

—

# 16. Native Trigger Rolls

Pilot Trigger rolls use native StatRollFlow.

Trigger bonus derives from native Trigger rank.

Reuse native Trigger roll machinery.

—

# 17. Native HULL Roll

Target Mech HULL can use native stat-roll machinery.

Conceptually:

\`\`\`text
actor.beginStatFlow(“system.hull”)
\`\`\`

Use native roll result.

—

# 18. Contested Check Coordinator

Frame Conn must:

\`\`\`text
roll attacker
roll defender
compare totals
determine success
\`\`\`

No native generic Jockey contest coordinator was found.

—

# 19. Successful Jockey State

On successful initial Jockey:

\`\`\`text
Pilot shares target Mech space
Pilot becomes attached to target Mech movement
Jockey relationship becomes active
\`\`\`

No native persistent relationship field was found.

Frame Conn needs supplemental runtime state.

—

# 20. Suggested Jockey State

Conceptually:

\`\`\`text
{
  pilotUuid,
  targetMechUuid,
  active: true,
  startedRound,
  startedTurn
}
\`\`\`

Exact storage/schema is implementation-specific.

—

# 21. Jockey Movement Following

While Jockeying:

\`\`\`text
target Mech moves
→ Pilot moves with target
→ Pilot shares target space
\`\`\`

Use shared token movement hooks.

Do not create independent duplicate movement logic.

—

# 22. Jockey Options

After successful Jockey:

\`\`\`text
DISTRACT
SHRED
DAMAGE
\`\`\`

On later turns, Pilot may continue selecting these as Full Actions while Jockey remains active.

—

# 23. Distract

Effect:

\`\`\`text
target Mech:
Impaired
Slowed
until end of target’s next turn
\`\`\`

Use native status/effect infrastructure.

Use shared effect lifecycle.

—

# 24. Shred

Effect:

\`\`\`text
target Mech gains 2 Heat
\`\`\`

Use native Mech Heat state.

Do not treat as damage unless native Heat helper requires it.

—

# 25. Damage

Effect:

\`\`\`text
4 Kinetic damage
\`\`\`

Route through native:

\`\`\`text
damageCalc(...)
\`\`\`

where practical.

Preserve Armor/Resistance/etc.

—

# 26. Continuing Jockey

While Jockey relationship remains active:

\`\`\`text
subsequent Pilot turn
→ Full Action
→ choose Distract / Shred / Damage
\`\`\`

Do not repeat the initial mount contest unless rules require it.

—

# 27. Throw Off

Target Mech may use a Full Action to attempt to remove the Pilot.

Required:

\`\`\`text
contested check
→ success
→ end Jockey relationship
\`\`\`

No native flow found.

Frame Conn must coordinate it.

—

# 28. Voluntary Jump Off

Pilot may end Jockey relationship through movement according to the rules.

On exit:

\`\`\`text
clear Jockey state
stop movement-follow behavior
place Pilot in valid space
\`\`\`

Use shared movement/placement logic.

—

# 29. Jockey Cleanup

Clear Jockey relationship if:

\`\`\`text
Pilot jumps off
target throws Pilot off
Pilot/target leaves valid state
Pilot mounts another Mech
combat/entity state invalidates relationship
\`\`\`

Cleanup must remove movement-follow hooks.

—

# 30. Pilot Status Context

Pilot actions should use native Pilot/Mech statuses where applicable.

Reuse shared:

\`\`\`text
lancer-status-effects.md
\`\`\`

for Jockey Distract and other conditions.

—

# 31. Pilot Targeting

Frame Conn owns legality checks not fully enforced by native attack flows:

\`\`\`text
Range
LOS
adjacency
valid target type
Pilot outside Mech
\`\`\`

Fight should reuse weapon targeting rules.

Jockey requires adjacency.

—

# 32. Actor Context

Pilot action execution should preserve:

\`\`\`text
pilotActor
linkedMechActor if any
selected Pilot Weapon if any
targetActor
action type
Trigger/HASE source if any
\`\`\`

Do not confuse Pilot-owned action economy with Mech action economy.

—

# 33. Fight vs Mech Weapon Attack

Fight uses:

\`\`\`text
Pilot Weapon
Pilot GRIT
Pilot action economy
\`\`\`

Do not route Pilot Fight through Mech Skirmish/Barrage mount logic.

—

# 34. Reload vs Stabilize Reload

Pilot Reload:

\`\`\`text
Quick Action
reload one Loading Pilot Weapon
\`\`\`

Mech Stabilize Reload:

\`\`\`text
different Mech action/mechanics
\`\`\`

Keep them separate.

—

# 35. Native vs Frame Conn Ownership

## Native Lancer

\`\`\`text
Pilot actor
GRIT
Triggers
HASE
Pilot loadout
Pilot Weapons
WeaponAttackFlow
BasicAttackFlow
DamageRollFlow
loaded state
Loading enforcement
weapon unload after firing
status storage
Heat/damage primitives
\`\`\`

## Frame Conn

\`\`\`text
Fight parent action
Fight action economy
Fight target legality
Pilot Reload Quick Action wrapper
Jockey parent flow
Jockey contested check
Jockey persistent relationship
Jockey movement following
Distract/Shred/Damage choice
Throw Off
Jockey cleanup/lifecycle
\`\`\`

—

# 36. Implementation TODO

- [ ] Register Fight as Pilot Full Action.
- [ ] Discover equipped Pilot Weapons.
- [ ] Route Fight weapon attacks to native WeaponAttackFlow.
- [ ] Validate Pilot weapon Range/LOS.
- [ ] Register Reload as Pilot Quick Action.
- [ ] Filter unloaded Loading Pilot Weapons.
- [ ] Set selected weapon loaded=true.
- [ ] Register Jockey as Pilot Full Action.
- [ ] Implement adjacency validation.
- [ ] Implement GRIT/Trigger vs HULL contest.
- [ ] Persist Jockey relationship.
- [ ] Follow target movement.
- [ ] Implement Distract.
- [ ] Implement Shred.
- [ ] Implement Damage.
- [ ] Implement Throw Off.
- [ ] Implement voluntary Jump Off.
- [ ] Add lifecycle cleanup.

—

# 37. Smoke Tests — Fight

- [ ] Fight available only for Pilot context.
- [ ] equipped Pilot Weapon selectable.
- [ ] Pilot GRIT used.
- [ ] native WeaponAttackFlow opens.
- [ ] native weapon damage resolves.
- [ ] Loading weapon unloads after attack.
- [ ] Full Action spent exactly once.
- [ ] invalid Range/LOS rejected.

—

# 38. Smoke Tests — Reload

- [ ] only Loading Pilot Weapons shown.
- [ ] already-loaded weapon excluded.
- [ ] selected weapon becomes loaded.
- [ ] only one weapon reloaded.
- [ ] Quick Action spent exactly once.
- [ ] native loaded state persists.

—

# 39. Smoke Tests — Jockey

- [ ] requires adjacent Mech.
- [ ] attacker can choose GRIT or valid Trigger.
- [ ] defender rolls HULL.
- [ ] failed contest creates no Jockey state.
- [ ] successful contest creates relationship.
- [ ] Pilot follows Mech movement.
- [ ] Distract applies Impaired + Slowed.
- [ ] Distract expires correctly.
- [ ] Shred adds 2 Heat.
- [ ] Damage deals 4 Kinetic through native damage rules.
- [ ] subsequent turns allow Full Action option.
- [ ] Throw Off contest can end state.
- [ ] voluntary Jump Off ends state.
- [ ] cleanup removes movement-follow behavior.

—

# 40. Core Invariants

**Invariant 1**

Fight is a missing parent action over native Pilot attack machinery.

**Invariant 2**

Pilot Weapon attacks use native WeaponAttackFlow and Pilot GRIT.

**Invariant 3**

Pilot Loading state is native and must not be duplicated.

**Invariant 4**

Reload is only a missing Quick Action wrapper around native loaded state.

**Invariant 5**

Jockey has no native gameplay flow and requires Frame Conn orchestration.

**Invariant 6**

Jockey should reuse native Trigger/HASE rolls, statuses, Heat, damage, and movement primitives.

**Invariant 7**

Pilot and Mech action economies remain separate.

—

# 41. Final Working Model

\`\`\`text
PILOT ACTIONS
│
├── FIGHT — Full
│   ├── choose Pilot Weapon
│   ├── Frame Conn target legality
│   └── native WeaponAttackFlow
│       └── native DamageRollFlow
│
├── RELOAD — Quick
│   ├── choose unloaded Loading Pilot Weapon
│   └── native weapon.loaded = true
│
└── JOCKEY — Full
    ├── adjacent Mech
    ├── GRIT/Trigger vs HULL
    ├── Frame Conn Jockey state
    ├── movement following
    ├── DISTRACT
    │   └── native Impaired + Slowed
    ├── SHRED
    │   └── native Heat +2
    ├── DAMAGE
    │   └── native 4 Kinetic damage
    ├── Throw Off
    └── Jump Off / cleanup
\`\`\`

Critical rule:

**Reuse native Pilot actor, weapon, roll, status, Heat, and damage systems. Frame Conn only supplies the missing Fight/Reload parent actions and the Jockey gameplay state machine.**
`;

fs.writeFileSync(“pilot-actions.md”, content, “utf8”);

console.log(
  `Wrote pilot-actions.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);