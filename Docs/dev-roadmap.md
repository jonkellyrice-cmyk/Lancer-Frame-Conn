# Frame Conn Development Roadmap

This document records the current development state of Frame Conn based on live Foundry playtesting. It is the working roadmap for universal actions, rules automation, maintenance controls, actor-owned content integration, and resource management.

## Status legend

- **DONE** — implemented and live-tested well enough to treat as complete for the current milestone.
- **FIX IMPLEMENTED / RETEST** — a concrete fix has been implemented, but the corrected behavior still needs live Foundry confirmation.
- **PARTIAL** — substantially implemented, but a known rules or state-management gap remains.
- **TODO** — an execution shell may exist, but the mechanic is not yet implemented correctly.
- **CONTENT-DEPENDENT** — requires actor-owned weapons, mounts, systems, traits, talents, core powers, core bonuses, or similar discovery/execution infrastructure.

---

# Phase 1 — Universal actions and core combat rules

## Done

### Quick Tech — Lock On — DONE

Live-tested successfully.

Current behavior:

- no attack roll;
- acquire exactly one valid target;
- target must be within Sensors;
- apply native Lancer `lockon` state;
- enemy/NPC mutation uses the appropriate Foundry authority path.

### Stabilize — DONE

Live-tested successfully through native Lancer Stabilize execution.

Native Lancer remains authoritative for cooling, repair, reload, Burn, Exposed clearing, and other Stabilize effects.

### Shut Down — DONE

Live-tested successfully.

Applies native Shutdown state.

### Boot Up — DONE

Live-tested successfully.

Removes native Shutdown state.

### Hide — DONE

Live-tested successfully for the current implementation scope.

Applies native Hidden state through Frame Conn status orchestration.

### Skill Check — DONE

The mech-skill check path is functioning through HULL / AGI / SYS / ENG selection and native roll execution.

### Search — DONE

Live-tested successfully.

A successful Search removes the target's native Hidden condition.

### Overcharge — DONE

Frame Conn now delegates Overcharge to native Lancer execution rather than maintaining an independent escalation model.

Native Lancer owns:

- the escalating Overcharge formula;
- `system.overcharge_sequence`;
- Heat rolling/application;
- native chat output;
- any system-specific Overcharge modifications.

Frame Conn owns only the turn-level availability/additional Quick Action semantics and presentation.

### Overheating rules — DONE

The native Lancer OverheatFlow remains authoritative for the overheating roll and table result. Frame Conn supplies the missing automatic consequences.

Implemented rules include:

- Danger Zone derived from Heat and Heat Cap;
- Emergency Shunt applying Impaired until the end of the mech's next turn;
- Destabilized Power Plant applying Exposed;
- Direct overheating-result Exposed handling;
- Engineering-check branch handling where required;
- reactor-meltdown countdown state;
- terminal reactor-meltdown resolution;
- red Burst 2 template;
- automatic Agility saves for affected characters;
- one shared 4d6 explosive damage roll;
- full damage on failed save and half damage on successful save;
- native damage application;
- removal of the annihilated mech token from the Scene;
- reactor-meltdown telemetry warning state.

### Structure damage — DONE EXCEPT MOUNT/SYSTEM TRAUMA SELECTION

Native Lancer StructureFlow remains authoritative for the structure damage check/table roll. Frame Conn supplies missing automatic consequences.

Implemented:

- Glancing Blow automatically applies Impaired until end of next turn;
- Direct Hit at 3+ Structure automatically applies Stunned until end of next turn;
- Direct Hit at 2 Structure automatically launches the native Hull check;
- successful Hull check applies Stunned until end of next turn;
- failed Hull check destroys the mech and removes its token;
- Direct Hit at 1 Structure destroys the mech;
- Crushing Hit destroys the mech;
- any direct transition to 0 Structure removes the destroyed mech token;
- Structure telemetry pulses by remaining Structure: 4 normal, 3 yellow, 2 orange, 1 red.

Still deferred:

- System Trauma choice between weapon mount and mounted system destruction;
- selecting exactly which eligible mount/system is destroyed.

This is intentionally deferred to Phase 2 because it depends on mount/system discovery.

### Self-Destruct — DONE

Self-Destruct is executable from the committed-plan panel.

Execution prompts for:

- **NOW**;
- **1 ROUND**;
- **2 ROUNDS**.

It reuses the authoritative reactor-meltdown countdown and terminal explosion resolver rather than maintaining duplicate explosion logic.

Terminal behavior therefore uses the same:

- red Burst 2 template;
- Agility saves;
- 4d6 explosive damage;
- full/half damage handling;
- native damage application;
- source-token annihilation.

### Quick Tech — Invade — Fragment Signal — DONE

Fragment Signal executes and applies its intended status consequences through the current status/lifecycle architecture.

Treat the current implementation as complete for Phase 1 unless further live play reveals an expiry defect.

### Movement policy — DONE

Frame Conn observes token movement but does not police it.

Current policy:

> Observe movement; do not police physical token movement.

Frame Conn does not automatically spend Boost, automatically Overcharge because a token moved farther than expected, reject token dragging, or warn that the player moved too far.

Movement measurement remains available for telemetry and rules that genuinely depend on distance traveled.

---

## Not done / current live defects

### Reactor meltdown prevention check — TODO

When a reactor meltdown countdown is active but the meltdown is not yet locked in as unavoidable, the affected mech should receive an automatic once-per-turn opportunity to halt it.

Required behavior:

- once per turn while a preventable reactor-meltdown countdown is active, automatically prompt the player to make the required **Engineering check**;
- use native Lancer's Engineering/HASE roll path so Accuracy, Difficulty, chat output, and other native modifiers remain authoritative;
- on a successful check, cancel/clear the pending meltdown countdown;
- on a failed check, leave the countdown unchanged and do not offer another attempt until the mech's next turn;
- do not offer this recovery check once the meltdown has reached a rules state where it is already locked in and can no longer be prevented;
- the prompt belongs to rules-side reactor-meltdown orchestration and must work even if the Frame Conn cockpit UI is not open.

### Brace — TODO

Current live failure:

> No prompt appears asking whether the character wants to Brace when the relevant attack/damage opportunity occurs.

Required work:

- trace the native attack/damage event where the Brace opportunity becomes known;
- prompt the player to **Brace / Do Not Brace**;
- explain the immediate consequence in the prompt;
- only consume the reaction and apply Brace effects if accepted;
- preserve native Lancer attack/damage execution rather than replacing it.

### Grapple — TODO

The attack portion exists, but Grapple needs dedicated post-hit handling instead of flowing into generic damage resolution.

Required work after a successful Grapple attack:

- establish the Grapple relationship;
- apply/update the correct relationship-driven rules state;
- integrate with Engaged derivation;
- do **not** treat Grapple as an ordinary damaging attack awaiting generic damage resolution.

### Ram — TODO

The attack portion exists, but Ram needs dedicated post-hit handling instead of generic damage resolution.

Required work after a successful Ram attack:

- apply the correct Prone result;
- support any required forced-movement interaction;
- do **not** route Ram through ordinary weapon damage resolution.

### Disengage — TODO / EXECUTION FAILURE

Current live error:

> Frame Conn canonical action execution did not succeed, fail

Required work:

- trace the canonical execution transaction and identify the exact failure boundary;
- preserve the intended Disengage reaction-suppression semantics once execution succeeds;
- verify duration/turn expiration through the rules-side status architecture.

### Quick Tech — Scan — FIX IMPLEMENTED / RETEST

Previous live failure:

> You must target a token to scan.

This occurred even while a Foundry token was visibly targeted.

The traced defect was that Frame Conn called native Lancer's `actor.beginScanFlow()` without passing the selected target token. The implementation has now been changed so Frame Conn resolves the existing Foundry target and calls the native Scan flow with that token.

Required next step:

- live-test the corrected path in Foundry;
- confirm an already-targeted token is accepted;
- confirm the fallback target-selection prompt works if no target exists;
- confirm native Scan output is otherwise unchanged.

### Quick Tech — Bolster — PARTIAL

Bolster executes, but the Accuracy it grants the target on the target's next skill check or save is not currently represented as durable/consumable state.

Required work:

- record the granted Accuracy on the target;
- make the next eligible skill check or save consume that Accuracy;
- make the state visible enough to diagnose during play;
- prefer native Lancer state if an appropriate representation exists;
- only add narrow Frame Conn-owned state if native Lancer has no usable representation.

### Mount / Dismount / Eject — TODO

The action currently exists and can be committed/executed, but it does not yet change pilot/mech state.

Desired relationship model:

#### If the pilot is inside the mech

Executing the command should offer:

- **Dismount**;
- **Eject**.

Dismount should:

- place/show the pilot's human token in the same map space as the mech;
- mark the mech as no longer occupied/piloted.

Eject should use its own Lancer-specific consequences rather than simply aliasing Dismount.

#### If the pilot is outside the mech

If the pilot token is in the mech's space and belongs to that mech's pilot, executing the command should allow **Mount**.

Mount should:

- remove/hide the human pilot token from the Scene;
- mark the mech as occupied/piloted.

Foundry Lancer does not currently appear to expose a complete native occupied/unoccupied mech relationship, so Frame Conn may need to own this narrow pilot↔mech relationship state while leaving Actor and Token documents native-authoritative.

This should be modeled as a relationship, not as a generic status icon.

---

# Maintenance / non-action controls

### Rest — TODO / NATIVE CAPABILITY AUDIT

Rest may or may not have a native Foundry Lancer workflow. It is not currently obvious on the standard character sheet.

Required work:

- trace whether native Lancer exposes Rest through an actor entry point, utility, macro, or flow;
- delegate to native behavior if it exists;
- otherwise implement Rest through authoritative Lancer rules in a dedicated maintenance boundary;
- do not pretend Rest is a combat Quick/Full action.

### Full Repair — TODO

Native Foundry Lancer exposes Full Repair through a character-sheet macro, so Frame Conn should wire that existing native capability into the UI.

Full Repair is not a combat action. It should appear as its own maintenance/control command rather than consume turn action economy.

---

# Phase 2 — Actor-owned content infrastructure

The next major phase is actor-owned content discovery and native execution integration.

Required domains:

1. **Mounted systems**
2. **Weapon mounts**
3. **Weapons**
4. **Pilot talents**
5. **Mech/frame traits**
6. **Core powers**
7. **Manufacturer core bonuses**

These should be discovered from the actual actor/item model rather than represented as hard-coded generic lists.

The System Bridge / actor-owned feature registry should remain the authoritative Frame Conn boundary for discovering and normalizing this content, while native Lancer remains the preferred execution authority.

---

# Dependent actions

These actions should not be considered complete until the Phase 2 content layer exists.

### Prepare — CONTENT-DEPENDENT / DELAYED-ACTION INFRASTRUCTURE

Prepare requires a real delayed-action/reaction model.

Required work:

- choose the action being prepared;
- store its trigger/condition;
- reserve and track the prepared action;
- expose the prepared action when its trigger occurs;
- execute the prepared action later as the relevant reaction;
- when finally executed, the prepared action may itself require a target, attack/check roll, weapon, system, or other actor-owned execution path.

### Activate — CONTENT-DEPENDENT

Activate must be aware of actor-owned executable content including:

- mounted systems;
- mech/frame traits;
- core powers;
- weapons;
- manufacturer core bonuses;
- pilot talents;
- other actor-owned features exposing activations.

Frame Conn should discover valid activations and present them; native/content-specific execution should remain authoritative where available.

### Protocol — CONTENT-DEPENDENT

Protocol execution must discover Protocol-timed abilities from actor-owned content including:

- mounted systems;
- mech/frame traits;
- core powers;
- weapons;
- manufacturer core bonuses;
- pilot talents;
- other actor-owned Protocol features.

### Skirmish — CONTENT-DEPENDENT

Skirmish must become weapon-mount and weapon aware.

Required direction:

- discover actual mounts and weapons;
- present legal weapon choices;
- respect mount/weapon state such as destroyed, Loading, Limited, etc.;
- delegate the attack to native Lancer weapon execution;
- preserve Frame Conn targeting and action-economy semantics.

### Barrage — CONTENT-DEPENDENT

Barrage must become mount- and weapon-aware and correctly support Barrage-specific multi-mount/multi-weapon selection rather than using a generic Basic Attack shell.

### Overwatch — CONTENT-DEPENDENT

Overwatch must become:

- weapon aware;
- mount aware;
- Threat aware;
- reaction-trigger aware.

It should consume the same future mount/weapon discovery layer used by Skirmish and Barrage.

---

# Resource management roadmap

Resource management must become aware of the actor's actual build.

Resource discovery must include, as applicable:

- mounted systems;
- weapons;
- mech/frame traits;
- core powers;
- pilot talents;
- manufacturer core bonuses;
- other actor-owned features exposing charges, Limited uses, counters, stacks, per-round/per-scene/per-mission resources, or similar state.

## Resources UI

Add a dedicated **Resources** tab/panel to Frame Conn.

It should let players inspect relevant current/max values such as:

- current / maximum uses;
- Limited charges;
- counters and stacks;
- scene/mission/rest-refresh resources;
- core-power availability;
- other actor-owned resource state exposed by native Lancer items/features.

## Resource execution

Some resources are consumed naturally by actions and should continue to update through native execution.

Other resources do not correspond cleanly to Quick, Full, Protocol, Reaction, or another normal action. Some behave effectively like undefined/free activations.

For those cases the Resources UI may expose an **Execute / Use** button directly beside the resource when appropriate.

Rules:

- prefer native Lancer resource state and execution whenever available;
- never create a duplicate Frame Conn counter when native Actor/Item data already owns the state;
- Frame Conn-owned resource state should exist only where native Lancer genuinely lacks a representation;
- resource execution must still use the canonical execution/rules boundary rather than UI code mutating documents directly.

---

# Rules-side status and condition architecture

Statuses and conditions use two distinct execution streams.

## Player-facing action consequences

Actions that explicitly apply or remove statuses continue through the normal action execution spine.

Examples:

- Lock On → Lock On;
- Hide → Hidden;
- Search → remove Hidden;
- Ram → Prone after successful Ram resolution;
- Fragment Signal → Impaired / Slowed;
- Shut Down / Boot Up → apply/remove Shutdown.

## Rules-driven consequences

Statuses or terminal consequences caused by rules state, geometry, timing, Heat, Structure, or native-flow results belong under `scripts/rules_features/`.

Current examples include:

- Engaged derived from hostile adjacency;
- Danger Zone derived from Heat;
- overheating-result Impaired/Exposed;
- reactor-meltdown countdown and terminal explosion;
- StructureFlow result consequences;
- timed status expiration.

Architectural rule:

```text
Player-facing command/presentation
        ↓
Action Execution
        ↓
shared rules/services/native adapter

Rules state / geometry / timing / native events
        ↓
rules_features
        ↓
shared services / native adapter
```

Native Lancer Actor/Item/status state remains authoritative wherever it already exists. Frame Conn rules features should automate missing orchestration, not create a parallel rules engine.

---

# Long-term feature tracks

These are larger product areas beyond the current combat-action and actor-owned-content milestones. They should be treated as first-class Frame Conn feature families rather than miscellaneous UI additions.

## GM Mission Toolkit — LONG-TERM

Build a GM-focused mission planning, organization, and live-session feature set around the major stages of **The Mission**. The same structure should help the GM both author a mission before play and run/track it during play.

### Stage 1 — Briefing

Organize and present:

- **the situation** — what is happening and why the pilots are being deployed;
- **the goal** — the concrete objective or objectives;
- **the stakes** — what happens if the mission succeeds, fails, stalls, or changes;
- relevant factions, people, locations, intelligence, known threats, and uncertainties;
- player-facing briefing material separated from GM-only notes.

### Stage 2 — Preparation

Support pre-deployment planning such as:

- choosing approach and insertion plan;
- gathering intelligence;
- selecting or reviewing loadouts and mission-relevant equipment;
- recording player plans, contingencies, and assumptions;
- tracking preparation actions or narrative advantages that should matter later in the mission.

### Stage 3 — Reserves

Provide a dedicated place to plan and track mission reserves and other expendable strategic support.

The toolkit should eventually integrate with whatever authoritative Lancer representation exists for reserves, while still providing GM organization for custom/non-mechanical support assets.

### Stage 4 — Boots on the Ground

Act as the live mission dashboard during play. Potential responsibilities include:

- current objectives and changing mission state;
- discovered information;
- active complications and consequences;
- important NPCs/factions/locations;
- scene and encounter organization;
- reserve use;
- notes generated during play;
- transitions between narrative play and mech combat.

This should complement the existing player-facing Frame Conn combat cockpit rather than merge GM mission control into it.

### Stage 5 — End of Mission and Debrief

Support closing the mission and carrying its consequences forward:

- objective success/failure/partial success;
- unresolved complications;
- rewards, reserves, reputation, or other mission consequences;
- damage/repair and downtime handoff;
- NPC/faction/world-state changes;
- debrief notes and hooks for the next mission.

### Mission Toolkit design goal

The toolkit should not merely store notes. It should provide a structured mission-building workflow in which information entered during planning naturally becomes useful runtime information during the session, and runtime developments naturally feed the debrief and future mission state.

---

## Narrative Play module — LONG-TERM

Build a dedicated narrative-play feature family implementing and supporting Lancer's non-mech-combat rules. It should be usable independently of the tactical combat cockpit while sharing actors, pilot data, rolls, chat, and other native Foundry/Lancer state where available.

### Core narrative skill-check flow

Support the complete narrative skill-check procedure:

1. player states the **goal**;
2. GM establishes the consequences of failure before the roll;
3. determine relevant **triggers** and whether the GM is invoking the pilot's background;
4. roll **1d20**, applying trigger bonuses plus Accuracy/Difficulty;
5. resolve the roll against the normal narrative threshold, with **10+** succeeding and **9 or less** failing;
6. preserve the rule that a player normally rolls only once to achieve a given goal unless circumstances meaningfully change or the character **pushes it**.

### Difficulty, Risky, and Heroic rolls

Represent the escalating narrative roll states:

- **Difficult** — add Difficulty because the task is unusually hard;
- **Risky** — consequences occur even on a normal success unless the character reaches the stronger result required by the rules;
- **Heroic** — extreme tasks where success requires the exceptional **20+** result and consequences still matter below that threshold.

The GM should be able to set these properties clearly before the roll so the stakes are visible to everyone.

### Teamwork

Support another character helping with a skill check, granting the appropriate Accuracy while preserving the rule that everyone helping shares the consequences/complications of failure.

### Trying again and pushing it

Track whether a failed attempt is being retried because circumstances changed or because the player is **pushing it**.

Pushing a failed ordinary check should escalate it to Risky; pushing an already-Risky situation should follow the appropriate higher-stakes handling, including Heroic escalation when the GM allows it.

### Consequences and complications

Provide GM-facing tools to establish and record consequences before the roll, using the major consequence families from the narrative rules:

- **Harm**;
- **Time**;
- **Resources**;
- **Collateral**;
- **Position**;
- **Effect**.

The module should help the GM state these clearly before a roll and record what actually happened afterward, without attempting to replace GM judgment with an automated consequence generator.

### Skill challenges

Support group and extended skill challenges:

- multiple characters may contribute relevant skill checks;
- track successes and failures;
- determine challenge success from the required proportion or count;
- support ties or special resolution rules where applicable;
- support **extended challenges** with several distinct stages and multiple rounds of rolls.

The UI should make the current challenge goal, stages, participants, successes, failures, and consequences easy to understand at a glance.

### Player initiative and NPC action

Narrative play should reflect Lancer's player-initiative structure:

- players generally have the opportunity to act first;
- the GM asks what they do rather than running a tactical initiative order;
- NPC behavior is normally determined as a consequence of player action and established fictional positioning rather than independent tactical turns.

The module may offer a lightweight scene/action tracker, but it should not force narrative play into the mech-combat initiative model.

### Narrative combat

Support resolving pilot-scale or otherwise narrative combat through skill checks rather than tactical attack rolls when appropriate.

The GM must still be able to declare a check ordinary, Difficult, Risky, Heroic, or some combination as allowed by the rules based on the fictional approach and opposition. The module should also support structured multi-step narrative fights through skill challenges.

### Pilot HP, harm, armor, and Down and Out

Support the pilot-scale harm rules used in narrative play, including:

- pilot HP and damage;
- Armor reducing applicable damage;
- armor-piercing or otherwise armor-ignoring harm where appropriate;
- narrative harm guidance for minor, major, and lethal injury;
- the **Down and Out** roll when a pilot reaches 0 HP;
- recovery to 1 HP on the appropriate result;
- Down and Out / Stunned consequences on intermediate results;
- death on the terminal result or when the player chooses death where the rules allow it.

Where native Foundry Lancer already owns pilot HP, armor, damage, or status state, the Narrative Play module should use that native state instead of duplicating it.

### Narrative rest and recovery

Support the narrative recovery rule where an hour of safe rest can restore a conscious pilot to full HP, while Down and Out recovery and Full Repair follow their separate rules.

This should eventually share maintenance/recovery primitives with the existing Rest / Full Repair roadmap rather than creating incompatible parallel recovery implementations.

### Narrative Play design goal

The goal is a second major Frame Conn interaction mode:

```text
TACTICAL / MECH PLAY
Frame Conn combat cockpit

NARRATIVE PLAY
Goals → stakes/consequences → trigger/background selection → roll → consequence tracking

GM MISSION TOOLKIT
Mission planning → mission state → scenes/challenges → debrief
```

These modes should share the same actors, native Lancer data, rules services, and Foundry integration while remaining distinct presentation experiences optimized for their different styles of play.

---

# Recommended next implementation order

Close the remaining Phase 1 live defects before deep actor-owned content work:

1. Live-retest Scan target propagation.
2. Reactor-meltdown once-per-turn Engineering recovery prompt.
3. Disengage execution failure.
3. Brace reaction prompt/runtime trigger.
4. Grapple dedicated post-hit handling.
5. Ram dedicated post-hit handling.
6. Bolster durable/consumable Accuracy state.
7. Mount/Dismount/Eject pilot↔mech relationship model.
8. Rest native-capability audit.
9. Full Repair maintenance control.

Then begin Phase 2:

1. mounted-system discovery;
2. weapon-mount discovery;
3. weapon discovery;
4. Skirmish;
5. Barrage;
6. Overwatch;
7. mech/frame trait discovery;
8. core-power discovery;
9. pilot-talent discovery;
10. manufacturer core-bonus discovery;
11. Activate / Protocol actor-owned action discovery;
12. shared resource discovery/service;
13. Resources UI;
14. Prepare delayed-action integration over the resulting execution layer.

---

# Guiding architectural boundary

Frame Conn should continue converging on this division of responsibility:

```text
PLAYER-FACING FRAME CONN
command selection
planning
presentation
target acquisition
semantic intent
        ↓
SHARED APPLICATION / EXECUTION ARCHITECTURE
action economy
execution transactions
system bridge
native adapter
        ↓
RULES FEATURES
reactive rules
derived statuses
lifecycle
terminal consequences
        ↓
FOUNDRY LANCER
Actors / Items / Flows / statuses / rolls / chat / document mutation
```

The player-facing cockpit should not become the rules engine, and rules automation should not depend on the cockpit being open in order to function.
