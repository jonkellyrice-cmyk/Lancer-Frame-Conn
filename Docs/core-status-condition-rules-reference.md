# Core Lancer Status, Condition, and Overheating Rules Reference

## Purpose

This document records rules-facing reference notes from the supplied Lancer core-rulebook pages for use while implementing and validating Frame Conn status, condition, movement, attack, heat, and reactor behavior.

It complements:

- `Docs/status.md` — native Foundry Lancer status architecture and mutation boundaries;
- `Docs/status-orchestration.md` — current Frame Conn status lifecycle/orchestration implementation;
- `Docs/status-effect-action-and-state-notes.md` — action-specific status consequences.

This file is a rules reference, not a replacement for native Foundry/Lancer source authority. Where native source already implements a mechanic correctly, Frame Conn should delegate rather than duplicate it.

---

# 1. Statuses vs Conditions

Lancer distinguishes **statuses** from **conditions**.

Statuses are generally situational states that may require a specific action or circumstance to remove, while conditions are usually temporary effects caused by damage, electronic warfare, or other effects.

The duration of a status or condition is normally specified by the effect that caused it.

## "Until the end of the target's next turn"

When an effect lasts until the end of the target's next turn, that means the target's **next turn in initiative order**.

If the effect is applied during the target's own turn, it persists through that turn and through the target's following turn, ending only at the end of that following turn.

This timing rule is important for Frame Conn timed-condition orchestration such as Fragment Signal.

---

# 2. Statuses

## Danger Zone — mechs only

A mech is in the **Danger Zone** when its current Heat is at least half of its Heat Cap.

The status is derived from Heat rather than being an independently chosen state.

Some weapons, talents, and effects require or interact with Danger Zone.

### Frame Conn implication

Danger Zone should be treated as a derived Heat state. Do not maintain an unrelated Frame Conn boolean if the native actor already exposes authoritative Heat and Danger Zone state.

---

## Down and Out — pilots only

A pilot who is **Down and Out** is unconscious and Stunned.

If the pilot takes further damage while Down and Out, they die.

A Down and Out pilot regains consciousness and half of their HP when they rest.

---

## Engaged

When a character becomes adjacent to a hostile character, both become **Engaged** while they remain adjacent.

Ranged attacks made by an Engaged character receive **+1 Difficulty**.

If a character becomes Engaged by a target of equal or greater Size during the course of movement, that movement immediately stops and any remaining movement is lost.

### Frame Conn implications

Engaged has two distinct rules consequences:

1. native ranged-attack Difficulty while Engaged;
2. movement interruption when engagement is newly established by an equal-or-larger hostile character.

The first is already consumed by native attack code once native `engaged` exists.

The second belongs to movement/spatial orchestration and must not be forgotten when automatic Engaged derivation is expanded.

Hidden characters do not cause engagement; see Hidden below.

---

## Exposed — mechs only

An **Exposed** mech takes double Kinetic, Explosive, and Energy damage before reductions are applied.

Exposed can be cleared through Stabilize.

### Frame Conn implication

Native Lancer damage calculation already consumes Exposed. Frame Conn should not pre-double damage before calling native damage handling.

---

## Hidden

A **Hidden** character:

- cannot be targeted by hostile attacks or hostile actions;
- does not cause engagement;
- is known to enemies only by approximate location.

Hidden is removed after the relevant action/effect resolves if the Hidden character:

- attacks;
- forces a save;
- takes a reaction;
- uses Boost;
- loses the cover or concealment supporting the Hidden state.

Hidden characters can be found with **Search**.

### Frame Conn implications

Hide automation is not complete merely because native `hidden` is applied.

A complete Hidden lifecycle requires:

- hostile-target prohibition;
- no-engagement behavior;
- approximate-location presentation;
- automatic break on attack;
- automatic break on forced save;
- automatic break on reaction;
- automatic break on Boost;
- automatic break when qualifying cover/concealment is lost;
- Search interaction.

The current Frame Conn status orchestration already handles Hidden application and Search removal, but these additional lifecycle/legality rules remain important validation targets.

---

## Invisible

Attacks against an **Invisible** character have a flat 50% chance to miss outright before the attack roll is made, regardless of attack type.

Invisible characters may always Hide even when they do not otherwise have cover.

### Frame Conn implication

Native Lancer already owns the attack-side invisibility miss mechanic. Frame Conn should preserve it and only add missing Hide-legality and visibility orchestration where needed.

---

## Prone

Attacks against a **Prone** target receive **+1 Accuracy**.

A Prone character is also **Slowed** and counts as moving through difficult terrain.

A character normally removes Prone by standing instead of taking its standard move.

An Immobilized character cannot stand this way.

Standing does not count as movement and therefore does not itself trigger Overwatch or other movement-triggered effects.

### Frame Conn implications

Applying native `prone` is only the first half of the rules.

Movement/turn orchestration should eventually enforce:

- Slowed while Prone;
- difficult-terrain movement behavior;
- stand-up replacing standard movement;
- inability to stand while Immobilized;
- stand-up not producing movement-trigger reactions.

---

## Shut Down — mechs only

When a mech Shuts Down:

- all Heat is cleared;
- Exposed is removed;
- cascading NHPs are stabilized and stop cascading;
- statuses and conditions caused by tech actions, such as Lock On, immediately end;
- the mech becomes immune to all tech actions and tech attacks, including allied ones;
- the mech is Stunned indefinitely until it ceases to be Shut Down.

The Shutdown-caused Stunned condition cannot be prevented while Shutdown persists.

### Frame Conn implications

A correct Shut Down implementation is broader than merely toggling native `shutdown`.

The runtime should be validated against native Lancer behavior for:

- Heat reset;
- Exposed removal;
- tech-caused effect cleanup;
- NHP stabilization;
- tech-action immunity;
- persistent Stunned while Shutdown remains active.

If native Lancer already performs any of these transitions, Frame Conn should delegate rather than duplicate them.

---

# 3. Conditions

## Immobilized

An **Immobilized** character cannot make voluntary movement.

Involuntary movement still affects them normally.

### Frame Conn implication

Movement legality must distinguish voluntary movement from forced movement. Immobilized should block the former without blocking Ram push, knockback, pulls, or other involuntary displacement.

---

## Impaired

An **Impaired** character receives **+1 Difficulty** on:

- attacks;
- saves;
- skill checks.

### Frame Conn implication

Native Lancer already consumes Impaired in native attack and StatRoll flows. Frame Conn should not stack an additional duplicate Difficulty modifier.

---

## Jammed

A **Jammed** character cannot:

- use comms to talk to other characters;
- make attacks other than Improvised Attack, Grapple, and Ram;
- take reactions;
- take tech actions;
- benefit from tech actions.

### Frame Conn implications

Jammed is a broad action-legality condition, not merely an attack modifier.

A complete Frame Conn legality layer should enforce Jammed across:

- attack action availability;
- reaction availability;
- tech-action availability;
- receipt/benefit of tech actions;
- comms-related features if Frame Conn later exposes them.

The three permitted attacks while Jammed are explicitly:

- Improvised Attack;
- Grapple;
- Ram.

---

## Lock On

A hostile character may consume a target's **Lock On** status to gain **+1 Accuracy** on their next attack against that target.

Lock On is also a prerequisite for some talents and systems.

### Frame Conn implication

Frame Conn applies native Lock On; native attack flow should remain authoritative for optional consumption and the Accuracy benefit.

---

## Shredded

A **Shredded** character does not benefit from:

- Armor;
- Resistance.

### Frame Conn implication

Native damage calculation already handles this downstream. Do not duplicate Armor/Resistance bypass in Frame Conn damage preprocessing.

---

## Slowed

A **Slowed** character may only use their **standard move** on their own turn.

They cannot:

- Boost;
- use special movement granted by talents;
- use special movement granted by systems;
- use special movement granted by weapons.

### Frame Conn implication

Slowed must constrain the movement action catalog, not merely decorate the actor with a condition icon.

The standard move remains legal unless another effect, such as Immobilized or Stunned, also prevents it.

---

## Stunned

A **Stunned mech** cannot:

- Overcharge;
- move;
- take actions;
- take free actions;
- take reactions.

Pilots may still Mount, Dismount, or Eject from a Stunned mech and otherwise act normally as pilots.

A Stunned mech has a maximum Evasion of **5**.

A Stunned mech automatically fails all **Hull** and **Agility** checks and saves.

### Frame Conn implications

Stunned affects multiple subsystems simultaneously:

- action economy;
- movement;
- free actions;
- reactions;
- Overcharge;
- Evasion calculation;
- Hull/Agility check/save resolution.

Mount/Dismount/Eject is an explicit exception for the pilot and should not be suppressed merely because the mech is Stunned.

---

# 4. Heat, Stress, and Overheating

## Heat Cap and Stress

Heat Cap determines how much Heat a mech can hold before overheating.

Stress represents reactor durability. Most player mechs normally have 4 Stress, while NPCs typically have 1.

When current Heat exceeds Heat Cap:

1. the mech takes **1 Stress damage**;
2. it makes an **Overheating Check**;
3. all Heat is cleared;
4. any excess Heat that still remains beyond the first Heat Cap is then processed again, which can cause multiple overheating events from one large Heat gain.

When a mech reaches **0 Stress**, it suffers a reactor meltdown at the end of its next turn.

### Frame Conn implication

Overheating is not simply `heat = 0` plus a Stress decrement. It is a potentially repeated threshold-resolution loop with immediate Overheating Check consequences after each Stress loss.

Native actor/flow behavior should be preferred if it already implements this loop.

---

# 5. Overheating Check

To resolve an Overheating Check, roll **1d6 for each point of Stress damage currently marked, including the Stress just lost**, then use the **lowest die result**.

Multiple rolled 1s have their own catastrophic result.

The result is cross-referenced against the mech's remaining Stress.

---

# 6. Overheating Table

## Lowest die 5–6 — Emergency Shunt

The cooling system contains the heat, but the mech becomes **Impaired until the end of its next turn**.

### Frame Conn implication

This is another timed Impaired source using the same next-turn timing convention as Fragment Signal, but with a different ownership/source identity.

Timed-condition cleanup must therefore be source-aware rather than blindly removing Impaired.

---

## Lowest die 2–4 — Destabilized Power Plant

The mech becomes **Exposed** and takes damage based on its current Stress damage / overheating-chart result.

The supplied table specifies a damage expression of **4d6** with the listed energy/explosive-style reactor damage notation.

### Implementation note

When wiring this result, native source should be consulted for the exact damage-type encoding and whether native Lancer already resolves the damage automatically.

---

## Lowest die 1 — Meltdown

The outcome depends on **remaining Stress**.

### 3+ Stress remaining

The mech becomes **Exposed**.

### 2 Stress remaining

The mech makes an **Engineering check**.

- On success: the mech becomes Exposed.
- On failure: reactor meltdown occurs after **1d6 of the mech's turns**, rolled by the GM.
- That delayed meltdown can be prevented by retrying the Engineering check as a **free action**.

### 1 Stress remaining

The mech suffers a **reactor meltdown at the end of its next turn**.

### Frame Conn implications

Delayed meltdown requires persistent combat/lifecycle state rather than a transient status icon.

If Frame Conn ever owns this orchestration, it needs to track:

- target mech;
- trigger turn count;
- Engineering recovery attempts;
- cancellation on successful recovery;
- immediate conversion to final meltdown when the countdown expires.

---

## Multiple 1s — Irreversible Meltdown

The reactor goes critical and the mech suffers a **reactor meltdown at the end of its next turn**.

---

# 7. Reactor Meltdown

A reactor meltdown may occur immediately or after a countdown.

For countdown meltdowns, the countdown updates at the **start of the affected mech's turn** and resolves when the specified count is reached.

When meltdown occurs:

- any pilot still inside the mech is immediately killed;
- the mech is vaporized in a catastrophic **Burst 2** explosion;
- the wreck is annihilated;
- all characters in the affected area make an **Agility save**;
- on a failed save they take the listed meltdown damage;
- on a successful save they take half damage.

The supplied rulebook page lists **4d6** damage for the reactor-meltdown blast.

### Frame Conn implication

Meltdown is a multi-actor area-resolution event with lifecycle timing, save resolution, pilot consequence, and destruction of the source mech. It should not be modeled as an ordinary status application.

---

# 8. Cooling

Marked Heat can be cleared by:

- Stabilize;
- certain systems;
- resting;
- Full Repair.

Frame Conn should continue delegating Stabilize cooling to native `StabilizeFlow` where available.

---

# 9. Danger Zone Derivation

A mech is in Danger Zone at **half Heat Cap or greater**.

This is a threshold-derived status and should update whenever Heat or Heat Cap changes.

Conceptually:

```text
heat / heat-cap mutation
        ↓
current heat >= 0.5 × heat cap ?
        │
        ├── yes → Danger Zone active
        └── no  → Danger Zone inactive
```

---

# 10. Cross-System Implementation Checklist

These supplied rules add or reinforce the following future Frame Conn validation targets:

- Hidden cannot be targeted by hostile attacks/actions;
- Hidden never causes engagement;
- Hidden breaks on attack, forced save, reaction, Boost, or loss of supporting cover/concealment;
- Invisible always permits Hide;
- newly becoming Engaged during movement can terminate movement against equal-or-larger hostile Size;
- Prone implies Slowed and difficult terrain and needs a stand-up transition;
- Immobilized blocks voluntary but not involuntary movement;
- Slowed permits only standard movement;
- Jammed sharply constrains attacks, reactions, and tech actions;
- Stunned shuts down virtually all mech turn economy and auto-fails Hull/Agility checks and saves;
- Shutdown has additional transitions beyond the `shutdown` marker;
- Overheating can generate timed Impaired, Exposed, damage, Engineering recovery checks, and delayed meltdown;
- 0 Stress and some Overheating results create end-of-next-turn lifecycle events;
- Danger Zone is derived from Heat threshold;
- timed effects with identical native statuses must remain source-aware so one effect cannot accidentally clear another source's condition.

---

# 11. Architectural Rule

Use the rulebook to determine **what the mechanic means** and native Foundry Lancer source to determine **what the system already implements and which runtime surface is authoritative**.

Preferred integration remains:

```text
core Lancer rule
        ↓
Frame Conn semantic/lifecycle owner where native behavior is missing
        ↓
Native Adapter / native actor or Flow entry point
        ↓
Foundry/Lancer ActiveEffects, rolls, damage, document mutations, and chat
```

Do not turn these rules into duplicate Frame Conn effects when native Lancer already consumes the corresponding status or condition correctly.
