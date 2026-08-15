# Universal Action Testing Inventory

## Purpose

This document is the working Frame Conn inventory for universal-action implementation and live testing.

It records which actions:

- should execute without a roll;
- require a basic melee attack;
- require weapon-aware execution;
- require tech-attack execution;
- require a contested check;
- require an ordinary mech skill check;
- are already known to work or have been tested.

This is a testing/coverage ledger, not the authoritative rules implementation document for any individual action. Detailed action architecture belongs in the corresponding `af-*.md` document.

---

# 1. Universal actions that do not inherently require a check

These actions should **not** be routed through the generic HULL / AGI / SYS / ENG skill-check chooser merely because they have an Execute control.

- Shut Down
- Boot Up
- Hide — **status application implemented; complete Hide legality still pending; live validation pending**
- Quick Tech — Bolster
- Quick Tech — Scan
- Quick Tech — Lock On — **implemented; live group validation pending**
- Disengage — **Engaged removal/current-turn suppression implemented; live validation pending**
- Stabilize — **done / working; native condition-selection branches remain manual**
- Activate
  - The system being activated may itself require checks, but the act of activating it does not inherently require a mech skill check.
- Mount / Dismount / Eject
- Prepare
  - The action being prepared may require a check later when the prepared action/reaction is actually taken, but Prepare itself does not inherently require a check.
- Self Destruct
- Overcharge
- Brace — **implemented; not yet live-tested**
- Protocol
  - A protocol's effects may themselves request or cause a check, but activating the protocol does not inherently require one.

---

# 2. Basic melee attack actions

These should use the appropriate native/basic melee attack path rather than the generic mech-skill-check route.

- Grapple — **native attack + relationship/status consequences implemented; live validation pending**
- End Grapple — **native HULL-vs-HULL contest + relationship cleanup implemented; live validation pending**
- Ram — **native attack + Prone application implemented; optional push remains movement work**

---

# 3. Weapon-attack-dependent actions

These require Frame Conn to become mount-aware and weapon-aware before their full end-to-end implementation should be considered complete.

- Overwatch
- Skirmish
- Barrage

---

# 4. Tech attack actions

These require the appropriate native tech-attack execution path rather than an ordinary mech skill check.

- Fragment Signal — **native Tech Attack + Impaired/Slow application and next-turn cleanup implemented; live grouped lifecycle validation pending**
- Various mounted systems that invoke tech attacks

---

# 5. Contested checks

These are not ordinary GM-set skill checks because another character supplies the opposing result.

- Search — **implemented; live validation pending**
  - Contested **Systems** check against the target's **Agility**; success removes native Hidden.

---

# 6. Ordinary skill checks

Ordinary mech skill checks are **not contested**.

The GM sets the difficulty, and the acting mech rolls the appropriate mech skill:

- HULL
- AGI
- SYS
- ENG

Actions in this category should use the normal skill-check route only when the action's rules actually call for such a check.

---

# 7. Current implementation/testing notes

## Confirmed working

- Stabilize
- Fragment Signal

## Implemented but awaiting grouped live validation

- Brace
- Boot Up
- Shut Down

## Known routing rule

A committed action having an Execute control does **not** imply that it rolls a d20 or chooses a mech skill.

Execution presentation and execution semantics must remain distinct:

```text
no-check action
→ plain Execute
→ semantic/native action execution
→ no mech skill chooser

skill-check action
→ roll/check execution
→ choose or resolve HULL / AGI / SYS / ENG as required

attack action
→ native attack workflow
→ attack-specific targeting/modifiers/roll
```

This distinction should be preserved as additional universal actions are brought end to end.
