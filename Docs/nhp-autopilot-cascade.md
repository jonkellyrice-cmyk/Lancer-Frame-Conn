const fs = require(“fs”);

const content = String.raw`# Lancer NHP Control and Cascade — Native Repository Integration Guide

## Native Authority

Native Lancer already provides:

\`\`\`text
AI tag
AI-capacity counting
AI-tagged installed item detection
system.cascading item field
CascadeFlow
Structure/Overheat cascade prompt hooks
1d20 cascade roll
cascade chat output
\`\`\`

Frame Conn must supply controller-state and cascade gameplay consequences.

—

# 1. AI Tag

Native AI detection uses:

\`\`\`text
tg_ai
item.isAI()
\`\`\`

AI-tagged installed items may include:

\`\`\`text
Mech Systems
Mech Weapons
Weapon Mods
\`\`\`

Use native item/tag state.

—

# 2. AI Capacity

Native mech loadout tracks AI capacity/count.

Conceptually:

\`\`\`text
system.loadout.ai_cap
\`\`\`

Do not create duplicate AI installation counting.

—

# 3. Cascade Trigger

Native StructureFlow and OverheatFlow can add a:

\`\`\`text
CASCADE CHECK
\`\`\`

chat control when eligible AI-tagged items are installed.

The control invokes:

\`\`\`text
beginCascadeFlow(actorUuid)
→ CascadeFlow
\`\`\`

—

# 4. Native CascadeFlow

Native flow:

\`\`\`text
initCascadeData
→ cascadeRoll
→ cascadeUpdateItems
→ printCascadeCards
\`\`\`

Cascade roll is:

\`\`\`text
1d20
\`\`\`

A result of:

\`\`\`text
1
\`\`\`

is recognized as cascade in chat output.

—

# 5. Native Cascading State

Mech equipment supports:

\`\`\`text
system.cascading: boolean
\`\`\`

This field exists on relevant AI-capable equipment.

Use native field for source NHP cascade state.

—

# 6. Native Cascade Bug

Current native CascadeFlow updates eligible AI items to:

\`\`\`text
system.cascading = true
\`\`\`

after the roll regardless of whether the result was 1.

Therefore:

\`\`\`text
DO NOT trust native CascadeFlow mutation unchanged.
\`\`\`

Correct behavior:

\`\`\`text
roll == 1
→ cascading = true

roll != 1
→ cascading remains false
\`\`\`

—

# 7. Cascade Eligibility

Native CascadeFlow scans AI-tagged:

\`\`\`text
Mech Systems
Mech Weapons
Weapon Mods
\`\`\`

Known hardcoded native exclusions include:

\`\`\`text
ms_comp_con_class_assistant_unit
wm_uncle_class_comp_con
\`\`\`

Native tag model also recognizes:

\`\`\`text
tg_no_cascade
\`\`\`

but CascadeFlow does not generically consume it.

Frame Conn should filter cascade-resistant sources correctly.

—

# 8. Cascade Consequences Missing

Native runtime does not implement:

\`\`\`text
NHP takes control
player loses mech control
GM gains control
Pilot action restrictions
controller state
cascade recovery
\`\`\`

Frame Conn owns these.

—

# 9. No Native Autopilot Flow

No native:

\`\`\`text
AutopilotFlow
HandOverControlFlow
TakeControlFlow
NHPControlFlow
\`\`\`

was found.

Voluntary AI control is a Frame Conn subsystem.

—

# 10. Controller State

Frame Conn needs explicit controller state.

Minimum model:

\`\`\`text
controllerMode:
  pilot
  ai
  cascade

activeAiItemUuid
\`\`\`

Optional lifecycle metadata:

\`\`\`text
controlChangedRound
controlChangedTurn
\`\`\`

Exact storage is implementation-specific.

—

# 11. Do Not Convert Mech Actor Type

Keep the native Mech actor unchanged.

Do not convert it into an NPC actor for AI/cascade control.

Use:

\`\`\`text
native Mech actor
+
Frame Conn controller state
\`\`\`

—

# 12. Hand Over Control

Official action:

\`\`\`text
HAND OVER CONTROL — Protocol
\`\`\`

Requirements:

\`\`\`text
Pilot physically inside Mech
eligible installed AI
controllerMode == pilot
\`\`\`

Execution:

\`\`\`text
choose AI if needed
→ controllerMode = ai
→ record active AI source
→ Pilot stops controlling Mech actions/reactions
→ AI receives its own Mech action/reaction budget
\`\`\`

—

# 13. Take Control Back

Official action:

\`\`\`text
TAKE CONTROL — Protocol
\`\`\`

Requirements:

\`\`\`text
controllerMode == ai
Pilot physically inside Mech
\`\`\`

Execution:

\`\`\`text
controllerMode = pilot
→ reconcile action budget
\`\`\`

—

# 14. Separate AI Action Budget

AI-controlled Mech gets:

\`\`\`text
its own actions
its own reactions
\`\`\`

Do not reuse the Pilot-controlled Mech’s spent budget.

Conceptually:

\`\`\`text
pilot-control budget
AI-control budget
\`\`\`

on the same combat turn.

—

# 15. Same-Turn Pilot + AI

While AI controls the Mech:

\`\`\`text
Mech actions
→ AI budget

Pilot-scale actions
→ Pilot actor budget
\`\`\`

The AI does not require a separate combatant.

—

# 16. Pilot Feature Suppression

AI-controlled Mech does not benefit from Pilot:

\`\`\`text
Talents
other Pilot features
\`\`\`

Frame Conn must suppress Pilot-derived feature contributions when:

\`\`\`text
controllerMode == ai
\`\`\`

Do not suppress native Mech/Frame/System/Weapon effects.

—

# 17. Pilot Feature Suppression Context

Prefer execution/modifier context:

\`\`\`text
controller = ai
→ exclude Pilot-derived Talent/Core-Bonus/etc. contributions as required
\`\`\`

Do not permanently remove Pilot Items or bonuses from actor documents.

—

# 18. Voluntary AI Control Lifecycle

Recommended:

\`\`\`text
Pilot Protocol
→ Hand Over Control
→ controllerMode = ai

AI uses Mech actions/reactions

subsequent Pilot turn
→ Take Control Protocol
→ controllerMode = pilot
\`\`\`

—

# 19. Cascade Check Automation

Frame Conn should hook successful completion of:

\`\`\`text
Structure check
Overheat check
\`\`\`

Then:

\`\`\`text
eligible cascade-capable AI installed?
→ roll corrected 1d20 cascade check
\`\`\`

Avoid native unconditional cascading mutation.

—

# 20. Correct Cascade Flow

Recommended:

\`\`\`text
Structure/Overheat resolves
→ collect eligible AI sources
→ roll 1d20
→ if result != 1:
   no state change
→ if result == 1:
   set relevant AI source(s) cascading = true
   controllerMode = cascade
   activeAiItemUuid = source
\`\`\`

—

# 21. Cascade Controller Mode

\`\`\`text
controllerMode = cascade
\`\`\`

is distinct from voluntary:

\`\`\`text
controllerMode = ai
\`\`\`

Cascade implies:

\`\`\`text
GM-controlled behavior
Pilot loses Mech control
special recovery/action restrictions
\`\`\`

—

# 22. Cascade GM Control

Do not permanently change actor ownership/type unless necessary.

Preferred:

\`\`\`text
controllerMode = cascade
→ player Frame Conn blocks Mech execution
→ GM retains execution access
\`\`\`

Use existing Foundry GM permissions.

—

# 23. Pilot Restriction During Cascade

While:

\`\`\`text
controllerMode == cascade
\`\`\`

the Pilot may only use:

\`\`\`text
SHUT DOWN
\`\`\`

to stabilize the NHP.

Frame Conn action registry must enforce this restriction.

—

# 24. Shutdown Recovery

On valid Shutdown during cascade:

\`\`\`text
native Shutdown mechanics
+
set cascading AI source(s) = false
+
controllerMode = pilot
+
clear activeAiItemUuid
\`\`\`

Then retain normal Shut Down state per \`af-shut-down.md\`.

—

# 25. Native Cascade Reset Missing

No runtime native path was found that sets:

\`\`\`text
system.cascading = false
\`\`\`

during normal gameplay.

Frame Conn must clear it on successful stabilization.

—

# 26. Cascade Item State

If multiple cascade-capable AI sources are installed:

preserve exact source identity.

Do not use one global boolean only.

Use native:

\`\`\`text
item.system.cascading
\`\`\`

plus controller state.

—

# 27. AI Source Selection

For voluntary control:

if multiple eligible AI items exist:

\`\`\`text
select active AI source
\`\`\`

For cascade:

use the source(s) implicated by the corrected cascade check strategy.

Preserve Item UUID.

—

# 28. Action Registry Integration

When:

\`\`\`text
controllerMode == pilot
\`\`\`

show normal Mech actions.

When:

\`\`\`text
controllerMode == ai
\`\`\`

show Mech actions under AI action budget and Pilot actions separately.

When:

\`\`\`text
controllerMode == cascade
\`\`\`

player Mech actions blocked;
Pilot stabilization option limited to Shutdown.

—

# 29. Reactions

AI control grants its own Reaction availability.

Keep separate:

\`\`\`text
Pilot-controlled Mech reactions
AI-controlled Mech reactions
Pilot personal reactions
\`\`\`

Do not share one consumed-reaction flag across controller budgets.

—

# 30. Protocol Timing

Both:

\`\`\`text
Hand Over Control
Take Control
\`\`\`

are Protocols.

Reuse shared Protocol timing.

Controller mutation happens only after valid Protocol execution.

—

# 31. Native AI State vs Controller State

Keep separate:

\`\`\`text
AI installed
→ native tag/loadout state

AI cascading
→ native item.cascading

who currently controls Mech
→ Frame Conn controllerMode
\`\`\`

Do not infer control directly from AI installation.

—

# 32. Cascade-Resistant AI

If source has:

\`\`\`text
tg_no_cascade
\`\`\`

exclude it from corrected cascade checks.

Preserve known native exceptions where required.

—

# 33. Controller State Cleanup

Clear/reconcile controller state when:

\`\`\`text
AI source removed
Mech actor changes
Pilot leaves invalid relationship
Full Repair/reset requires it
cascade stabilized
control returned to Pilot
\`\`\`

Do not leave stale AI Item UUIDs.

—

# 34. Native vs Frame Conn Ownership

## Native Lancer

\`\`\`text
AI tags
AI-capacity count
installed AI detection
item.cascading field
Structure/Overheat cascade hook
Cascade d20 roll primitives
chat output
Mech/Pilot actors
normal Mech actions
\`\`\`

## Frame Conn

\`\`\`text
correct cascade gating
cascade-resistant filtering
controllerMode
active AI source
Hand Over Control
Take Control
separate AI action/reaction budget
same-turn Pilot + AI handling
Pilot-feature suppression
cascade GM control
cascade action restriction
Shutdown stabilization
cascade reset
\`\`\`

—

# 35. Implementation TODO

- [ ] Detect installed AI-tagged sources.
- [ ] Filter cascade-resistant sources.
- [ ] Add controllerMode state.
- [ ] Preserve active AI Item UUID.
- [ ] Add Hand Over Control Protocol.
- [ ] Add Take Control Protocol.
- [ ] Add independent AI action budget.
- [ ] Add independent AI Reaction budget.
- [ ] Keep Pilot actor actions available during voluntary AI control.
- [ ] Suppress Pilot-derived Mech features while AI controls.
- [ ] Hook Structure completion.
- [ ] Hook Overheat completion.
- [ ] Implement corrected cascade roll.
- [ ] Set cascading only on natural 1.
- [ ] Enter cascade controller mode.
- [ ] Block player Mech actions during cascade.
- [ ] Permit only Shutdown recovery path.
- [ ] Clear cascading on stabilization.
- [ ] Reconcile stale/removed AI sources.

—

# 36. Smoke Tests — Voluntary AI Control

- [ ] AI tag required.
- [ ] Pilot must be inside Mech.
- [ ] Hand Over Control uses Protocol.
- [ ] controllerMode becomes ai.
- [ ] Pilot cannot use Mech action budget.
- [ ] AI receives fresh action budget.
- [ ] AI receives separate Reaction budget.
- [ ] Pilot personal actions remain available.
- [ ] Pilot Talent effects are suppressed for AI-controlled Mech.
- [ ] Take Control uses Protocol.
- [ ] controllerMode returns to pilot.

—

# 37. Smoke Tests — Cascade

- [ ] Structure check can trigger cascade check.
- [ ] Overheat check can trigger cascade check.
- [ ] cascade-resistant AI excluded.
- [ ] roll 2–20 leaves cascading false.
- [ ] roll 1 sets cascading true.
- [ ] roll 1 enters controllerMode=cascade.
- [ ] player Mech execution blocked.
- [ ] GM can operate Mech.
- [ ] Pilot action registry restricts to Shutdown.
- [ ] Shutdown clears native cascading state.
- [ ] Shutdown returns controllerMode to pilot.
- [ ] normal Shutdown effects remain.

—

# 38. Native Bug Regression Test

- [ ] invoke corrected cascade check.
- [ ] result != 1.
- [ ] confirm no AI item receives cascading=true.
- [ ] confirm controllerMode remains unchanged.

Never delegate authoritative cascade-state mutation to current native CascadeFlow without correction.

—

# 39. Core Invariants

**Invariant 1**

AI installation and AI control are separate concepts.

**Invariant 2**

Use native AI tags and AI-capacity state.

**Invariant 3**

Use native item.cascading as source cascade state.

**Invariant 4**

Current native CascadeFlow has incorrect unconditional cascading mutation.

**Invariant 5**

Only natural 1 should enter cascade.

**Invariant 6**

Voluntary AI control requires Frame Conn controller state.

**Invariant 7**

Cascade control and voluntary AI control are distinct modes.

**Invariant 8**

Do not convert the Mech into an NPC document.

**Invariant 9**

AI control gets a separate Mech action/reaction budget.

**Invariant 10**

Pilot-derived features must be suppressed while AI controls the Mech.

**Invariant 11**

Cascade blocks normal Pilot Mech control and is cleared through Shutdown.

—

# 40. Final Working Model

\`\`\`text
NATIVE MECH
│
├── AI-tagged Items
├── AI-capacity state
├── item.cascading
├── Structure/Overheat hooks
└── Cascade roll primitives
        │
        ▼
FRAME CONN NHP CONTROL
│
├── controllerMode
│   ├── pilot
│   ├── ai
│   └── cascade
│
├── VOLUNTARY AI
│   ├── Hand Over Control — Protocol
│   ├── separate AI action/reaction budget
│   ├── Pilot independent actions
│   ├── suppress Pilot-derived Mech features
│   └── Take Control — Protocol
│
└── CASCADE
    ├── corrected natural-1 check
    ├── native cascading=true
    ├── GM control mode
    ├── player Mech actions blocked
    ├── Pilot limited to Shutdown
    └── Shutdown
        ├── native Shut Down
        ├── cascading=false
        └── controllerMode=pilot
\`\`\`

Critical rule:

**Reuse native AI tags, capacity, cascade triggers, and item.cascading state. Frame Conn supplies the missing controller-state machine, corrects the native cascade bug, implements voluntary NHP control, separates AI action economy, suppresses Pilot features under AI control, and connects cascade recovery to Shutdown.**
`;

fs.writeFileSync(“nhp-control-cascade.md”, content, “utf8”);

console.log(
  `Wrote nhp-control-cascade.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);