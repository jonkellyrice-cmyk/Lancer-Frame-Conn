cat > docs/af-quick-tech.md <<‘EOF’
# Action Flow — Quick Tech

## Purpose

This document records the native Foundry Lancer execution architecture discovered for the four universal Quick Tech options:

- Bolster
- Lock On
- Invade
- Scan

The repository findings establish an important architectural distinction:

> Quick Tech is an action-economy category, not a single mechanical resolution type.

There is no evidence that all Quick Tech actions resolve through a common `QuickTechFlow`.

Instead, the individual universal Quick Tech actions use different execution architectures.

Frame Conn should therefore treat Quick Tech as a selection/dispatch category and delegate each selected option to its appropriate native or Frame Conn-owned execution strategy.

—

# 1. Architectural Finding

## Quick Tech Is Not Tech Attack

A Quick Tech action and a Tech Attack are not synonymous.

The four universal Quick Tech options demonstrate this clearly:

| Quick Tech | Tech Attack? | Dedicated Native Flow? | Frame Conn Strategy |
|—|—:|—:|—|
| Bolster | No | No flow found | Frame Conn implementation |
| Lock On | No | No application flow found | Frame Conn applies native condition |
| Scan | No | Yes — `ScanFlow` | Delegate to native flow |
| Invade | Yes | Yes — `TechAttackFlow` | Delegate to native flow |

Therefore Frame Conn should NOT implement a generic execution assumption such as:

Quick Tech
    ↓
TechAttackFlow

Nor should it invent a universal native `QuickTechFlow` that does not exist.

The appropriate architecture is:

Quick Tech
    ↓
Select Quick Tech option
    ↓
Resolve action identity
    ↓
Dispatch to option-specific execution strategy

Conceptually:

Quick Tech
│
├── Bolster
│   └── Frame Conn-owned implementation
│
├── Lock On
│   └── Frame Conn applies native Lancer condition
│
├── Scan
│   └── native ScanFlow
│
└── Invade
    └── native TechAttackFlow

This distinction should remain explicit in the Frame Conn action architecture.

—

# 2. Bolster

## Classification

Bolster is:

- a Quick Tech action
- NOT a Tech Attack

## Repository Search Result

A repository-wide search for:

Bolster
bolster

found no dedicated executable Bolster action flow.

No:

BolsterFlow

was found.

No native sheet/action execution path corresponding to:

Quick Tech: Bolster
    ↓
select target
    ↓
execute Bolster

was identified.

Occurrences of Bolster were found primarily in infrastructure such as:

CHANGELOG.md
public/lang/en.json
src/module/enums.ts
src/module/status-icons.ts

The repository therefore recognizes Bolster as a game/status concept, but does not appear to provide a complete native execution workflow for performing the universal Bolster action.

## Important Negative Finding

Bolster must NOT simply be routed through:

TechAttackFlow

`TechAttackFlow` represents an actual Tech Attack and contains attack-specific behavior such as:

AttackType.Tech

and resolution against E-Defense.

Bolster is not an attack.

## Frame Conn Integration

Bolster therefore requires a Frame Conn-owned action implementation.

High-level architecture:

Committed Quick Tech: Bolster
    ↓
Execute action
    ↓
Enter target-selection mode
    ↓
Select valid allied target
    ↓
Validate target/range/rules required by Bolster
    ↓
Apply Bolster’s mechanical effect
    ↓
Spend Quick Action
    ↓
Produce appropriate chat/UI feedback
    ↓
Refresh Frame Conn presentation

Where native Foundry/Lancer primitives exist for individual pieces of this process, Frame Conn should reuse them rather than recreating those lower-level systems.

## Integration Classification

NATIVE SUPPORT:
PARTIAL

NATIVE ACTION FLOW:
NONE FOUND

FRAME CONN EXECUTION:
REQUIRED

—

# 3. Lock On

## Classification

Lock On is:

- a Quick Tech action
- NOT a Tech Attack

## Repository Search Result

No dedicated:

LockOnFlow

was found.

No complete native action path corresponding to:

Quick Tech: Lock On
    ↓
select target
    ↓
apply Lock On

was identified.

However, unlike Bolster, the native Lancer system contains substantial infrastructure for the Lock On condition itself and for consuming it during attacks.

## Native Condition Representation

Lock On is represented in native actor status data through:

actor.system.statuses.lockon

Relevant infrastructure was found in areas including:

src/module/base-data.ts
src/module/system-template.ts
src/module/actor/lancer-actor.ts
src/module/status-icons.ts

The status icon infrastructure includes the native condition identity:

lockon

with the corresponding Lock On condition icon.

Therefore Frame Conn should use the native Lancer representation of Lock On rather than inventing a parallel Frame Conn-only status.

—

# 4. Native Lock On Consumption

The native attack system already understands Lock On.

The Accuracy/Difficulty system detects whether the selected target currently possesses Lock On.

Relevant state includes concepts equivalent to:

lockOnAvailable
consumeLockOn
usingLockOn

When Lock On is used, it contributes:

+1 Accuracy

to the attack.

The attack flow carries whether Lock On was consumed through the attack resolution process.

Native attack processing then removes the Lock On condition when appropriate.

Conceptually:

Target has native “lockon” condition
    ↓
Attack targets character
    ↓
Native Accuracy/Difficulty system detects Lock On
    ↓
Attacker elects to consume Lock On
    ↓
Attack gains +1 Accuracy
    ↓
Attack resolves
    ↓
Native system removes Lock On

Lock On consumption is also represented in Tech Attack processing.

Therefore Lock On is already integrated into native attack resolution.

—

# 5. Frame Conn Lock On Boundary

Frame Conn should implement only the missing application side of the universal Quick Tech action.

Desired architecture:

Committed Quick Tech: Lock On
    ↓
Execute
    ↓
Enter Frame Conn target-selection mode
    ↓
Select valid character within Sensors
    ↓
Validate target
    ↓
Apply native Lancer “lockon” condition
    ↓
Spend Quick Action
    ↓
Produce appropriate feedback
    ↓
Refresh Frame Conn

After the native Lock On condition has been applied:

FRAME CONN STOPS

The native Lancer system should remain authoritative for:

detecting Lock On during attacks
offering/performing Lock On consumption
granting +1 Accuracy
carrying consumption through attack resolution
removing Lock On after consumption

This gives us a clean integration boundary:

FRAME CONN
    ↓
performs universal Quick Tech: Lock On
    ↓
applies native lockon state
    ↓
NATIVE LANCER
    ↓
handles all subsequent attack interaction

## Integration Classification

NATIVE SUPPORT:
SUBSTANTIAL BUT INCOMPLETE

NATIVE APPLICATION FLOW:
NONE FOUND

NATIVE CONDITION:
YES

NATIVE ATTACK CONSUMPTION:
YES

FRAME CONN EXECUTION:
APPLICATION SIDE REQUIRED

—

# 6. Scan

## Classification

Scan is:

- a Quick Tech action
- NOT a Tech Attack

Unlike Bolster and Lock On, Scan has a dedicated native execution flow.

## Native Flow

The repository contains:

ScanFlow

The observed native Scan execution sequence includes:

ScanFlow
    ↓
initScanData
    ↓
printScanCard
    ↓
createScanJournal

This is significant because it demonstrates directly that universal Quick Tech actions do not all route through `TechAttackFlow`.

Scan has its own action-specific workflow.

—

# 7. Frame Conn Scan Integration

Frame Conn should preserve native Scan behavior rather than recreate it.

Desired architecture:

Committed Quick Tech: Scan
    ↓
Execute
    ↓
Acquire/validate required target
    ↓
Invoke native Scan entry point
    ↓
ScanFlow
    ↓
initScanData
    ↓
printScanCard
    ↓
createScanJournal
    ↓
native Scan output
    ↓
Frame Conn updates turn/action state

The exact public/native entry point should be preferred over directly invoking internal flow steps.

Frame Conn should follow the normal integration rule:

stock UI/button
    ↓
native handler
    ↓
actor/item native entry point
    ↓
flow construction
    ↓
ordered flow steps

and enter the native system at the highest stable execution boundary available.

## Integration Classification

NATIVE SUPPORT:
YES

NATIVE ACTION FLOW:
ScanFlow

FRAME CONN EXECUTION:
DELEGATE TO NATIVE ENTRY POINT

—

# 8. Invade

## Classification

Invade is:

- a Quick Tech action
- a Tech Attack

This distinguishes Invade from:

Bolster
Lock On
Scan

which are Quick Tech actions but are not Tech Attacks.

## Native Execution Architecture

Invade uses the native Tech Attack architecture.

The relevant flow is:

TechAttackFlow

with Invade-specific configuration/identity carried into the flow.

The native Tech Attack execution sequence observed during repository investigation includes steps such as:

TechAttackFlow
    ↓
initTechAttackData
    ↓
checkItemDestroyed
    ↓
checkItemLimited
    ↓
checkItemCharged
    ↓
setAttackTags
    ↓
setAttackEffects
    ↓
setAttackTargets
    ↓
showAttackHUD
    ↓
rollAttacks
    ↓
applySelfHeat / related attack consequences
    ↓
updateItemAfterAction
    ↓
printTechAttackCard

Exact steps may vary according to the particular Tech Attack/item/configuration being executed.

The important architectural fact is:

Invade
    ↓
TechAttackFlow

rather than:

Quick Tech
    ↓
TechAttackFlow

Invade uses the attack flow because Invade is actually a Tech Attack.

—

# 9. Native Invade Targeting and Roll Resolution

Because Invade is a Tech Attack, native attack machinery should remain authoritative for the actual attack roll.

That includes relevant systems such as:

target selection
E-Defense interaction
Accuracy/Difficulty
attack modifiers
attack roll
Lock On interaction
attack output
Tech Attack effects

Frame Conn should not duplicate those systems when the native Lancer execution path already provides them.

—

# 10. Frame Conn Invade Integration

Desired architecture:

Committed Quick Tech: Invade
    ↓
Execute
    ↓
Acquire required target
    ↓
Invoke native Invade/Tech Attack entry point
    ↓
TechAttackFlow
    ↓
native attack preparation
    ↓
native attack resolution
    ↓
native effects/output
    ↓
Frame Conn updates action state

As Frame Conn becomes more automated, the presentation layer may eventually bypass native popups while continuing to use native mechanics underneath where practical.

The eventual desired Frame Conn experience is:

Click execute
    ↓
select target if necessary
    ↓
Frame Conn derives known modifiers
    ↓
native-compatible attack resolution
    ↓
effects applied
    ↓
turn state updated

But the first implementation should preserve the known-good native execution architecture.

## Integration Classification

NATIVE SUPPORT:
YES

NATIVE ACTION FLOW:
TechAttackFlow

FRAME CONN EXECUTION:
DELEGATE TO NATIVE ENTRY POINT

—

# 11. Combined Quick Tech Dispatch Architecture

Frame Conn should represent Quick Tech as an action category whose selected action determines execution behavior.

Recommended conceptual dispatch:

QUICK TECH
    ↓
selected option
    ↓
┌───────────────────────────────────────────────┐
│                                               │
│  BOLSTER                                      │
│      Frame Conn-owned implementation          │
│                                               │
│  LOCK ON                                      │
│      Frame Conn target selection              │
│      + native lockon condition application    │
│                                               │
│  SCAN                                         │
│      native Scan entry point                  │
│      → ScanFlow                               │
│                                               │
│  INVADE                                       │
│      native Tech Attack/Invade entry point    │
│      → TechAttackFlow                         │
│                                               │
└───────────────────────────────────────────────┘

This means the Frame Conn action registry may classify all four under:

Quick Tech

while the execution layer dispatches them according to separate execution strategies.

—

# 12. Recommended Execution Strategy Model

Conceptually, Quick Tech definitions should be able to identify their execution strategy independently of their action-economy classification.

For example:

action category:
    quick-tech

action:
    bolster

execution strategy:
    frame-conn

—

action category:
    quick-tech

action:
    lock-on

execution strategy:
    native-condition

—

action category:
    quick-tech

action:
    scan

execution strategy:
    native-flow

—

action category:
    quick-tech

action:
    invade

execution strategy:
    native-tech-attack

The precise implementation should conform to the existing Frame Conn feature/action registry architecture rather than introducing these exact names merely for convenience.

—

# 13. Important Architectural Rule

Do not confuse:

ACTION ECONOMY

with:

RESOLUTION MECHANISM

For example:

Quick Tech

answers:

What kind of action does this cost?

Whereas:

Tech Attack
ScanFlow
native condition application
Frame Conn-owned effect

answer:

How does this particular action resolve?

Those are separate dimensions.

Frame Conn should model them separately.

—

# 14. Targeting Implications

All four Quick Tech actions should eventually participate in Frame Conn’s player-first targeting architecture where targeting is required.

General desired pattern:

Committed action
    ↓
click execute/d20 control
    ↓
action requires target?
    │
    ├── NO
    │     ↓
    │   execute
    │
    └── YES
          ↓
        existing valid target?
          │
          ├── YES
          │     ↓
          │   validate and continue
          │
          └── NO
                ↓
              switch Foundry to target-selection tool
                ↓
              player selects target
                ↓
              validate target
                ↓
              execute appropriate action strategy

The specific target rules differ between Bolster, Lock On, Scan, and Invade and should remain owned by the corresponding action execution adapter rather than by a generic Quick Tech assumption.

—

# 15. Native-System Boundary

Frame Conn is an alternate player-facing command and presentation layer over the native Foundry Lancer system.

Therefore:

USE NATIVE EXECUTION WHERE IT EXISTS.

SUPPLEMENT NATIVE EXECUTION WHERE IT IS INCOMPLETE.

IMPLEMENT FRAME CONN BEHAVIOR ONLY WHERE THE NATIVE SYSTEM
DOES NOT PROVIDE THE REQUIRED PLAYER-FACING MECHANICAL ACTION.

Applied to universal Quick Tech:

Bolster
    → supplement/implement

Lock On
    → supplement application
    → reuse native condition and consumption

Scan
    → native execution

Invade
    → native execution

—

# 16. Current Confidence

## High Confidence

- Quick Tech is not synonymous with Tech Attack.
- Invade is the Tech Attack member of the universal Quick Tech actions.
- Scan has a dedicated `ScanFlow`.
- Lock On has native status/condition infrastructure.
- Native attack resolution understands and consumes Lock On.
- No dedicated `LockOnFlow` was found.
- No dedicated `BolsterFlow` was found.
- Bolster should not be routed through `TechAttackFlow`.

## Requires Additional Investigation

- Exact highest-level native entry point used by stock UI for Scan.
- Exact highest-level native entry point used by stock UI for Invade.
- Exact native helper best suited for applying the Lock On condition.
- Whether the stock system exposes a reusable lower-level Bolster effect helper despite lacking a complete Bolster action flow.
- Exact range and target validation helpers reusable for each universal Quick Tech.
- Exact chat-card behavior appropriate for Frame Conn-owned Bolster and Lock On execution.
- Whether native action-cost bookkeeping exists independently of the specific flows or should remain entirely under Frame Conn’s Turn feature.

—

# 17. Next Repository Searches

- [ ] Trace Scan from stock character-sheet control to `ScanFlow`.
- [ ] Identify the native actor/item entry point that constructs `ScanFlow`.
- [ ] Trace Invade from stock character-sheet control to `TechAttackFlow`.
- [ ] Identify the exact Invade configuration passed into `TechAttackFlow`.
- [ ] Locate the preferred native helper for adding the `lockon` condition.
- [ ] Locate the preferred native helper for removing/toggling statuses generally.
- [ ] Inspect condition/status mutation APIs for permission and GM-ownership implications.
- [ ] Search for reusable Bolster-related effect/status infrastructure beyond the missing action flow.
- [ ] Determine native range-validation utilities applicable to Quick Tech.
- [ ] Determine native Sensors-range utilities applicable to Quick Tech.
- [ ] Determine how Scan selects/validates its target.
- [ ] Determine how Invade selects/validates its target.
- [ ] Determine whether Lock On and Bolster should use the same Frame Conn target-selection adapter.
- [ ] Determine appropriate native chat output primitives for Frame Conn-owned Quick Tech execution.
- [ ] Record all discovered native entry points before implementing the Frame Conn Quick Tech dispatcher.

—

# 18. Final Working Model

UNIVERSAL QUICK TECH
│
├── BOLSTER
│   │
│   ├── Quick Tech
│   ├── not a Tech Attack
│   ├── no dedicated native flow found
│   └── Frame Conn implementation required
│
├── LOCK ON
│   │
│   ├── Quick Tech
│   ├── not a Tech Attack
│   ├── no native application flow found
│   ├── native “lockon” condition exists
│   ├── native attacks detect it
│   ├── native attacks grant +1 Accuracy from it
│   └── native attacks consume/remove it
│
├── SCAN
│   │
│   ├── Quick Tech
│   ├── not a Tech Attack
│   └── ScanFlow
│       ├── initScanData
│       ├── printScanCard
│       └── createScanJournal
│
└── INVADE
    │
    ├── Quick Tech
    ├── Tech Attack
    └── TechAttackFlow
        ├── initialize attack data
        ├── establish effects/tags
        ├── establish targets
        ├── Accuracy/Difficulty processing
        ├── roll Tech Attack
        ├── process consequences
        ├── update action/item state
        └── print native Tech Attack output

This is the current authoritative working model for universal Quick Tech integration into Frame Conn.
EOF