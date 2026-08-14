# Action Flow Notes

## Purpose

This document records the native Lancer system action flows that Frame Conn needs to understand well enough to invoke, automate, or adapt them from the Frame Conn interface.

The long-term goal is for Frame Conn to:

1. Link every action to the currently controlled actor/mech whose data is already being consumed for telemetry, name, and token identity.
2. Add actions to the committed turn plan.
3. Show an execution control on each committed-action card.
4. Resolve required targets when the action is executed.
5. Invoke the correct native Lancer flow.
6. Eventually bypass manual native dialogs where Frame Conn can determine all required modifiers and choices itself.
7. Ultimately automate attack rolls, damage rolls, and damage application where enough system information is available.

The immediate research task is to identify and document the native Lancer flow entry points for every standard action category below.

---

# Known Flow

## Full Action — Improvised Attack

**Status:** Logged / initial native entry point identified.

### Frame Conn execution intent

After **Improvised Attack** is selected and committed to the turn plan, the committed-action card should include a small d20-style execute button on its right side.

Clicking that button should **execute the already-committed action**. It must not spend the Full Action again.

### Desired initial execution sequence

Committed Plan
┌───────────────────────────────────────┐
│ 01   Improvised Attack          [d20] │
│      Full Action                      │
└───────────────────────────────────────┘
                              │
                              ▼
                   click committed roll
                              │
                              ▼
                    Does action need target?
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   YES                  NO
                    │                   │
                    ▼                   │
          Is a valid target selected?   │
                    │                   │
                 NO │                   │
                    ▼                   │
        switch Foundry to target tool   │
                    │                   │
        prompt user to select target    │
                    │                   │
         wait for target selection      │
                    │                   │
                    └─────────┬─────────┘
                              ▼
                     execute native flow
                              │
                              ▼
                native Lancer attack flow
                              │
                              ▼
                  native modifier / roll UI
                              │
                              ▼
                         normal roll
                              │
                              ▼
                  mark committed step
                       executed

### Known actor-side native entry point

From the Lancer actor source:

await actor.beginBasicAttackFlow(
  "IMPROVISED ATTACK"
);

The native actor method constructs and begins a BasicAttackFlow.

Conceptually:

async beginBasicAttackFlow(title) {
  const flow =
    new BasicAttackFlow(
      this,
      title
        ? { title }
        : undefined
    );

  return await flow.begin();
}

### Near-term Frame Conn behavior

Committed Improvised Attack
        ↓
click d20
        ↓
acquire/select target
        ↓
actor.beginBasicAttackFlow(...)
        ↓
native Lancer attack HUD
        ↓
user resolves native flow normally
        ↓
mark committed action executed

### Long-term automation target

Eventually Frame Conn should replace the manual attack HUD for actions it fully understands:

Committed action [d20]
        ↓
Acquire target
        ↓
Build attack context
        ↓
Resolve Accuracy / Difficulty
        ↓
Resolve flat modifiers
        ↓
Roll attack
        ↓
Compare against defense
        ↓
       MISS ─────────────→ print result
        │
       HIT
        ↓
Resolve damage expression
        ↓
Roll normal / critical damage
        ↓
Resolve armor / AP / resistance / immunity
        ↓
Apply damage
        ↓
Apply heat / burn / statuses / effects
        ↓
Trigger secondary effects
        ↓
Print native-style chat result
        ↓
Mark committed action executed

### Architectural note

Target selection should occur **when the committed action is executed**, not when it is merely added to the plan.

The committed-plan card should therefore retain execution metadata such as:

{
  id,
  actionId,
  duplicateKey,
  source,
  timestamp,
  executed,
  executedAt,
  executionMetadata,
  metadata
}

The execute control should operate on the **committed entry ID**, not just the underlying action ID.

---

# Native Flow Logging TODO

The following actions still need their native Lancer system flow traced from the downloaded/zipped repository.

For every action below, record at minimum:

- Actor method or native entry point.
- Flow class or workflow class instantiated.
- File path.
- Required parameters.
- Whether a target is required.
- Whether target selection is handled by the flow or must be supplied beforehand.
- Which actor/mech statistics are read.
- Which item, weapon, mount, system, or effect data are read.
- Any important intermediate flow steps.
- Whether a dialog/HUD is shown.
- What the flow returns.
- What chat cards it produces.
- Whether the flow mutates the actor, target, combat state, statuses, heat, structure, stress, repairs, etc.
- Whether Frame Conn can initially delegate to the native flow unchanged.
- What information would later be needed to automate the flow without its native dialog.

---

# Full Actions

## TODO — Barrage

**Priority:** Very high.

Barrage and Skirmish need special attention because Lancer attacks with **weapon mounts**, not merely individual weapons.

Important mount rules to capture while tracing the flow:

- Barrage normally attacks with two different mounts.
- A mount may contain more than one weapon.
- A Barrage may therefore involve multiple weapon attacks across those mounts.
- Two mounts may jointly support one Superheavy weapon.
- A Superheavy weapon requires Barrage rather than Skirmish.
- A Barrage might therefore represent:
  - one Superheavy weapon spanning two mounts;
  - two single-weapon mounts;
  - mixed mounts;
  - potentially as many as four weapon attacks if both selected mounts each contain two weapons.

### Research checklist

- [ ] Find native Barrage actor entry point.
- [ ] Find Barrage flow class.
- [ ] Determine how eligible mounts are enumerated.
- [ ] Determine how paired Superheavy mounts are represented.
- [ ] Determine how weapon selection inside each mount works.
- [ ] Determine whether auxiliary weapons automatically trigger or are individually selected.
- [ ] Determine how targets are selected per weapon.
- [ ] Determine whether multiple targets may be used.
- [ ] Determine how accuracy/difficulty is calculated per attack.
- [ ] Determine how attack rolls are sequenced.
- [ ] Determine how damage rolls are sequenced.
- [ ] Determine how self-heat, loading, limited, ordnance, and other weapon tags are applied.
- [ ] Determine how a Barrage produces chat cards.
- [ ] Determine how the flow handles a Superheavy weapon differently.
- [ ] Identify the minimum Frame Conn metadata required to invoke the native Barrage flow.

---

## TODO — Full Tech

- [ ] Find native Full Tech entry point.
- [ ] Find Full Tech flow class.
- [ ] Determine whether it internally delegates to Quick Tech choices.
- [ ] Determine how two Quick Tech options are selected and sequenced.
- [ ] Determine whether repeated Quick Tech options are legal.
- [ ] Determine target-selection behavior.
- [ ] Determine which systems/talents affect Full Tech.
- [ ] Determine how tech attack vs non-attack tech options are distinguished.
- [ ] Determine which actor stats are used.
- [ ] Determine what data would be needed for future automation.

---

## TODO — Stabilize

- [ ] Confirm native actor method.
- [ ] Find Stabilize flow class.
- [ ] Trace all flow steps.
- [ ] Record heat-clearing behavior.
- [ ] Record exposed-state clearing behavior.
- [ ] Record reload behavior.
- [ ] Record repair choice behavior.
- [ ] Record any selectable Stabilize options.
- [ ] Record relevant actor resource mutations.
- [ ] Determine whether Frame Conn can directly invoke the native flow.
- [ ] Determine what would be needed to automate its choices.

---

## TODO — Boot Up

- [ ] Find native Boot Up entry point.
- [ ] Find related flow/workflow class.
- [ ] Determine which shutdown/status fields it mutates.
- [ ] Determine whether it displays a dialog.
- [ ] Determine relevant actor status checks.
- [ ] Determine combat/action restrictions.
- [ ] Determine chat output.
- [ ] Determine minimum data Frame Conn must provide.

---

## TODO — Skill Check

- [ ] Find native mech Skill Check entry point.
- [ ] Determine how HULL / AGI / SYS / ENG are selected.
- [ ] Determine whether GRIT is included and where.
- [ ] Find native stat-roll flow.
- [ ] Record accuracy/difficulty support.
- [ ] Record target requirements, if any.
- [ ] Record chat-card output.
- [ ] Determine how Frame Conn can expose all four mech-skill rolls directly.

---

## TODO — Disengage

- [ ] Find native Disengage entry point.
- [ ] Determine whether a native flow exists or whether it is mostly status/action-state handling.
- [ ] Determine what status/effect is applied.
- [ ] Determine duration.
- [ ] Determine how engagement/reaction suppression is represented.
- [ ] Determine chat output.
- [ ] Determine whether movement subsystem needs to know Disengage is active.

---

## DONE — Improvised Attack

See **Known Flow — Full Action — Improvised Attack** above.

---

## TODO — Activate

- [ ] Determine what the generic Activate action means in the Lancer system implementation.
- [ ] Identify actor entry point.
- [ ] Determine whether Activate delegates to an item/system activation flow.
- [ ] Determine how eligible systems/gear are enumerated.
- [ ] Determine whether the selected item itself owns the flow.
- [ ] Determine target requirements.
- [ ] Determine limited/charge/resource mutations.
- [ ] Determine action cost enforcement performed natively versus by Frame Conn.

---

## TODO — Mount / Dismount / Eject

- [ ] Find native mount/dismount/eject actions.
- [ ] Determine whether these are one flow or separate flows.
- [ ] Determine actor/token relationships involved.
- [ ] Determine pilot/mech state mutations.
- [ ] Determine token spawning/movement behavior.
- [ ] Determine whether a target or adjacent token is required.
- [ ] Determine whether any dialogs are used.
- [ ] Determine chat output.
- [ ] Determine Foundry token APIs touched by the native flow.

---

# Movement

## TODO — Standard Movement

- [ ] Identify any native movement action entry point.
- [ ] Determine whether the Lancer system itself tracks standard movement or relies entirely on Foundry token movement.
- [ ] Determine whether action-state metadata exists for Movement.
- [ ] Determine interaction with reactions/engagement.

## TODO — Jump

- [ ] Determine whether Jump has a native flow.
- [ ] Determine relevant movement/elevation rules represented in code.
- [ ] Determine whether the system differentiates jumping from ordinary movement programmatically.

## TODO — Climb

- [ ] Determine whether Climb has a native flow.
- [ ] Determine how half-Speed is represented, if at all.
- [ ] Determine whether elevation is explicitly handled.

## TODO — Fly

- [ ] Determine how flight capability is identified.
- [ ] Determine whether flight movement has a native execution flow.
- [ ] Determine how elevation is represented.
- [ ] Determine how falling or loss of flight is represented.

## TODO — Teleport

- [ ] Find native Teleport-related movement logic.
- [ ] Determine whether teleport distance enters ordinary movement accounting.
- [ ] Determine token-movement hooks involved.
- [ ] Determine whether path/intervening spaces are ignored.
- [ ] Determine how teleport is marked distinctly from ordinary movement.

---

# Protocol

Protocol is a special action category:

- It is effectively a free action.
- It is only legal at the **start of the turn**.
- Once the unit performs ordinary movement or another action, the Protocol window closes.

## TODO — Protocol Flow

- [ ] Determine how Protocol actions are represented in Lancer data.
- [ ] Determine whether there is a generic Protocol actor flow.
- [ ] Determine whether individual systems own their own activation flows.
- [ ] Determine how start-of-turn legality is enforced natively.
- [ ] Determine whether Protocol actions consume resources.
- [ ] Determine target-selection behavior.
- [ ] Determine chat output.
- [ ] Determine whether Frame Conn should invoke a native generic Protocol flow or dispatch directly to a selected system/action.

---

# Reactions

## TODO — Brace

- [ ] Find native Brace entry point.
- [ ] Find flow/workflow class.
- [ ] Determine what defensive effects are applied.
- [ ] Determine duration.
- [ ] Determine next-turn/action penalties.
- [ ] Determine whether incoming damage context is required.
- [ ] Determine whether Brace is normally initiated from chat/damage flow rather than actor sheet.
- [ ] Determine how the reaction is marked as spent.
- [ ] Determine chat output.

---

## TODO — Overwatch

- [ ] Find native Overwatch entry point.
- [ ] Determine relationship to weapon threat.
- [ ] Determine how an eligible weapon/mount is selected.
- [ ] Determine whether Overwatch delegates to Skirmish or another attack flow.
- [ ] Determine target-selection behavior.
- [ ] Determine reaction-state mutation.
- [ ] Determine how movement-triggered Overwatch is represented.
- [ ] Determine whether Frame Conn can invoke native Overwatch against a chosen target.

---

# Quick Actions

## TODO — Skirmish

**Priority:** Very high.

Skirmish attacks using **one weapon mount**, not simply one arbitrary weapon.

A selected mount may contain:

- one weapon;
- two weapons;
- special mount arrangements depending on frame/loadout rules.

Superheavy weapons are not normally fired with Skirmish because they span two mounts and require Barrage.

### Research checklist

- [ ] Find native Skirmish entry point.
- [ ] Find Skirmish flow class.
- [ ] Determine how eligible mounts are enumerated.
- [ ] Determine how weapons inside the chosen mount are selected.
- [ ] Determine whether auxiliary weapons both attack automatically.
- [ ] Determine target-selection behavior.
- [ ] Determine multiple-target behavior where applicable.
- [ ] Determine how weapon tags affect flow.
- [ ] Determine how attack/damage chat cards are produced.
- [ ] Determine minimum Frame Conn metadata needed to invoke native Skirmish.
- [ ] Compare directly with Barrage implementation.

---

## TODO — Boost

- [ ] Find native Boost entry point, if one exists.
- [ ] Determine whether Boost is represented as an action-state choice only.
- [ ] Determine whether native code changes movement allowance.
- [ ] Determine whether Frame Conn's current movement accounting already replaces most native handling.
- [ ] Determine interaction with movement tracking and Overcharge.

---

## TODO — Grapple

- [ ] Find native Grapple entry point.
- [ ] Find Grapple attack/check flow.
- [ ] Determine required target.
- [ ] Determine adjacency/range validation.
- [ ] Determine which attacker and defender stats are compared.
- [ ] Determine how size affects legality/results.
- [ ] Determine Grappled status/effect representation.
- [ ] Determine how grapple relationships are stored.
- [ ] Determine chat output.

---

## TODO — Hide

- [ ] Find native Hide entry point.
- [ ] Determine eligibility checks.
- [ ] Determine how Hidden is represented.
- [ ] Determine status/effect application.
- [ ] Determine how Hidden breaks.
- [ ] Determine whether cover/LOS conditions are checked automatically.
- [ ] Determine chat output.

---

## TODO — Ram

- [ ] Find native Ram entry point.
- [ ] Find attack/check flow.
- [ ] Determine target requirement.
- [ ] Determine adjacency validation.
- [ ] Determine size restrictions.
- [ ] Determine attack stat/defense used.
- [ ] Determine Prone application.
- [ ] Determine knockback or movement behavior if any.
- [ ] Determine chat output.

---

## TODO — Search

- [ ] Find native Search entry point.
- [ ] Determine whether Search is a stat check flow.
- [ ] Determine required target/area.
- [ ] Determine which stat is used.
- [ ] Determine interaction with Hidden characters.
- [ ] Determine whether sensors/LOS are checked.
- [ ] Determine chat output.

---

## TODO — Prepare

- [ ] Find native Prepare action handling.
- [ ] Determine whether it has a dedicated flow.
- [ ] Determine how prepared action/reaction state is stored.
- [ ] Determine how trigger conditions are recorded.
- [ ] Determine whether a selected action is embedded.
- [ ] Determine expiry timing.
- [ ] Determine how prepared execution is later invoked.
- [ ] Determine whether chat cards expose execution controls.

---

## TODO — Shut Down

- [ ] Find native Shut Down entry point.
- [ ] Determine status/effect mutations.
- [ ] Determine heat behavior.
- [ ] Determine E-defense/evasion/other state changes.
- [ ] Determine what actions become unavailable.
- [ ] Determine how Boot Up reverses the state.
- [ ] Determine chat output.

---

## TODO — Self Destruct

- [ ] Find native Self Destruct entry point.
- [ ] Find countdown/state logic.
- [ ] Determine timing and round tracking.
- [ ] Determine cancellation possibilities.
- [ ] Determine explosion attack/damage flow.
- [ ] Determine area targeting.
- [ ] Determine damage application.
- [ ] Determine actor destruction behavior.
- [ ] Determine chat output.

---

# Quick Tech

## TODO — Generic Quick Tech Architecture

- [ ] Find native Quick Tech entry point.
- [ ] Determine whether a common TechAttackFlow is used.
- [ ] Determine how target E-Defense is read.
- [ ] Determine how tech attack bonus is calculated.
- [ ] Determine how Accuracy/Difficulty is applied.
- [ ] Determine how non-attack Quick Tech actions are represented.
- [ ] Determine whether systems/talents inject additional Quick Tech options.
- [ ] Determine target-selection behavior.
- [ ] Determine chat-card behavior.

---

## TODO — Bolster

- [ ] Find Bolster entry point.
- [ ] Determine whether Bolster makes a tech attack or automatically applies.
- [ ] Determine valid targets.
- [ ] Determine applied bonuses/effects.
- [ ] Determine duration.
- [ ] Determine status/effect representation.
- [ ] Determine chat output.

---

## TODO — Scan

- [ ] Confirm native beginScanFlow(...) entry point.
- [ ] Find ScanFlow.
- [ ] Determine required target object type.
- [ ] Determine range/sensors validation.
- [ ] Determine what information is revealed.
- [ ] Determine how Scan journals/cards are created.
- [ ] Determine whether the scan result is persisted anywhere.
- [ ] Determine how Frame Conn can invoke it using the selected target.

Known actor-side shape observed during source inspection:

async beginScanFlow(target) {
  const flow =
    new ScanFlow(
      this,
      { target }
    );

  return await flow.begin();
}

---

## TODO — Lock On

- [ ] Find native Lock On entry point.
- [ ] Find flow/workflow class.
- [ ] Determine target requirement.
- [ ] Determine sensors/range validation.
- [ ] Determine Lock On status/effect representation.
- [ ] Determine duration.
- [ ] Determine how Lock On is consumed.
- [ ] Determine chat output.

---

## TODO — Invade

- [ ] Confirm relationship to native Tech Attack flow.
- [ ] Find Invade-specific flow or parameters.
- [ ] Determine valid targets.
- [ ] Determine E-Defense attack resolution.
- [ ] Determine default Invade effects.
- [ ] Determine how additional Invade options from systems are selected.
- [ ] Determine how heat/status effects are applied.
- [ ] Determine chat output.

Observed actor-side native tech attack pattern:

const params = {
  title,
  invade: true
};

const flow =
  new TechAttackFlow(
    this,
    params
  );

return await flow.begin();

---

# Shared Actor / Character Sheet Integration

Almost every action above should ultimately resolve from the same actor whose information Frame Conn already uses for:

- controlled-unit identity;
- token image;
- actor name;
- mech telemetry;
- Speed;
- structure/stress;
- HP/Heat;
- repairs;
- and other displayed statistics.

Therefore the execution architecture should prefer a single canonical actor-resolution path rather than each action independently searching for its actor.

### TODO

- [ ] Identify the single canonical Frame Conn controlled-actor accessor.
- [ ] Ensure action execution uses that same accessor.
- [ ] Ensure native actor methods are invoked on that actor.
- [ ] Ensure action execution refuses or prompts cleanly when no valid mech actor is available.
- [ ] Ensure actor/token identity remains correct if token control changes while Frame Conn is open.

---

# Shared Target Acquisition

Many actions require one or more targets.

The desired Frame Conn interaction is:

click committed-action execute button
        ↓
action requires target?
        ↓
if necessary switch Foundry to target-selection tool
        ↓
prompt user to select target
        ↓
wait for valid target selection
        ↓
continue native or automated action flow

### TODO

- [ ] Identify Foundry's reliable target-selection tool API.
- [ ] Record the user's previously active tool.
- [ ] Switch to target-selection mode.
- [ ] Wait for game.user.targets or equivalent target state to change.
- [ ] Validate target count.
- [ ] Validate target type.
- [ ] Restore previous tool afterward.
- [ ] Handle cancellation.
- [ ] Handle target deletion while waiting.
- [ ] Handle actions allowing multiple targets.
- [ ] Handle actions where each weapon/attack may choose a different target.

---

# Shared Committed-Action Execution

Each committed-plan card should eventually expose an execution control.

### TODO

- [ ] Add execute/d20 button to individual committed-action cards.
- [ ] Bind the button to committed **entry ID** rather than action ID alone.
- [ ] Resolve the committed entry.
- [ ] Resolve its action definition.
- [ ] Resolve controlled actor.
- [ ] Acquire required target(s).
- [ ] Dispatch to the appropriate action executor.
- [ ] Mark the committed entry executed only after successful execution.
- [ ] Record executedAt.
- [ ] Record useful executionMetadata.
- [ ] Re-render the committed-plan card to show execution state.
- [ ] Prevent accidental duplicate execution unless explicitly allowed.

---

# Research Order for Tomorrow

1. Skirmish
2. Barrage
3. Generic Quick Tech / Invade
4. Lock On
5. Scan
6. Bolster
7. Grapple
8. Ram
9. Stabilize
10. Full Tech
11. Skill Check
12. Overwatch
13. Brace
14. Prepare
15. Hide
16. Search
17. Disengage
18. Boost
19. Shut Down
20. Boot Up
21. Self Destruct
22. Activate
23. Mount / Dismount / Eject
24. Movement variants
25. Protocol execution architecture

The first few are the highest-value because they reveal the shared attack, targeting, weapon-mount, and tech-flow architecture that many later actions are likely to reuse.
# Addendum — Actor-Specific Action Sources

The standard universal action flows are only part of the execution surface Frame Conn eventually needs to understand.

A mech or pilot can gain additional executable actions, reactions, protocols, special actions, triggered abilities, or modifiers from several actor-specific sources:

- Mounted Systems
- Mech Traits
- Mech Core Powers
- Pilot Talents
- Manufacturer Core Bonuses

These therefore need their own native-flow research in addition to the universal actions already listed.


# Why These Need Separate Research

These features do not all behave like ordinary universal actions.

A system, trait, core power, talent, or manufacturer core bonus may:

- provide a Free Action;
- provide a Quick Action;
- provide a Full Action;
- provide a Reaction;
- provide a Protocol;
- provide a Special Action;
- grant an additional action belonging to one of those categories;
- modify an existing universal action;
- modify another granted action;
- grant a passive bonus to an action;
- grant Accuracy or Difficulty;
- modify damage;
- modify range or Threat;
- modify movement;
- alter action costs;
- alter targeting;
- alter action legality;
- alter weapon behavior;
- alter tech-action behavior;
- alter reactions;
- alter Overcharge;
- alter Heat generation;
- alter resource expenditure;
- trigger when another action is performed;
- trigger before another action;
- trigger after another action;
- trigger when another character performs an action;
- trigger when a particular game event occurs.

Examples of trigger structures include:

- "When you Barrage..."
- "When you Skirmish..."
- "When you Boost..."
- "When you Stabilize..."
- "When you make an attack..."
- "When you make a tech attack..."
- "When you hit..."
- "When you miss..."
- "When you deal damage..."
- "When you take damage..."
- "When you take Heat..."
- "When you move..."
- "When you become Engaged..."
- "When an allied character..."
- "When a hostile character..."
- "At the start of your turn..."
- "At the end of your turn..."
- "Once per round..."
- "1/round..."
- "1/scene..."
- "1/mission..."

This means Frame Conn cannot ultimately treat the universal action registry as the complete list of things a character can do.

The character sheet and the character's installed/acquired features are additional sources of available actions and action modifiers.


# Required Architectural Question

We need to determine how the native Lancer system represents these actor-specific abilities.

Conceptually:

Controlled Actor
      |
      +-- Universal Actions
      |
      +-- Mounted Systems
      |
      +-- Mech Traits
      |
      +-- Core Powers
      |
      +-- Pilot Talents
      |
      +-- Manufacturer Core Bonuses
              |
              v
      Executable Abilities
      Modifiers
      Triggers
              |
              +-- Protocol
              +-- Free Action
              +-- Quick Action
              +-- Full Action
              +-- Reaction
              +-- Special
              |
              +-- Triggered Ability
                      |
                      +-- Barrage
                      +-- Skirmish
                      +-- Boost
                      +-- Attack
                      +-- Tech Attack
                      +-- Hit
                      +-- Damage
                      +-- Movement
                      +-- Turn Start
                      +-- Turn End
                      +-- etc.

The most important question is whether the Lancer system already exposes this information in a structured, machine-readable form.

If it does, Frame Conn should consume that structure rather than attempting to recreate Lancer rules independently.

If some abilities exist primarily as descriptive text, we need to identify where the boundary lies between structured native behavior and rules text that would require explicit Frame Conn integration.


# TODO — Mounted Systems

Mounted mech systems may provide their own actions or alter existing actions.

Research checklist:

- [ ] Determine how installed/mounted systems are retrieved from the mech actor.
- [ ] Identify the underlying Item/Document type for a mech system.
- [ ] Determine where a system's actions are stored.
- [ ] Determine whether action type is structured data.
- [ ] Determine supported action categories.
- [ ] Determine how Protocol systems are represented.
- [ ] Determine how Reaction systems are represented.
- [ ] Determine how Free Actions are represented.
- [ ] Determine how Quick Actions are represented.
- [ ] Determine how Full Actions are represented.
- [ ] Determine how Special Actions are represented.
- [ ] Determine how systems granting multiple actions are represented.
- [ ] Determine how systems modifying universal actions are represented.
- [ ] Determine how triggered system abilities are represented.
- [ ] Determine whether triggers are structured data or descriptive text.
- [ ] Determine how Limited charges are represented.
- [ ] Determine how Limited charges are consumed.
- [ ] Determine how other system resources are represented.
- [ ] Determine how system activation is executed from the native character sheet.
- [ ] Find the click handler used by the character sheet.
- [ ] Trace that handler to its native execution entry point.
- [ ] Determine whether system actions invoke native dialogs.
- [ ] Determine how targets are passed into system actions.
- [ ] Determine how rolls generated by systems reach chat.
- [ ] Determine whether system actions expose a reusable callable function.
- [ ] Determine whether Frame Conn can invoke that function directly.


# TODO — Mech Traits

Frame traits may contain passive rules, triggered abilities, actions, reactions, or modifications to other actions.

Research checklist:

- [ ] Determine where frame traits live on the mech actor.
- [ ] Determine their native document/data representation.
- [ ] Determine whether traits are separate Items or embedded frame data.
- [ ] Determine whether executable trait abilities have structured action definitions.
- [ ] Determine whether action type is encoded.
- [ ] Determine whether trigger timing is encoded.
- [ ] Determine whether frequency restrictions are encoded.
- [ ] Determine how 1/round trait abilities are represented.
- [ ] Determine how 1/scene trait abilities are represented.
- [ ] Determine how 1/mission trait abilities are represented.
- [ ] Determine how traits modifying attacks are represented.
- [ ] Determine how traits modifying movement are represented.
- [ ] Determine how traits modifying tech actions are represented.
- [ ] Determine how traits modifying reactions are represented.
- [ ] Determine how traits modifying Heat are represented.
- [ ] Determine how traits granting Accuracy/Difficulty are represented.
- [ ] Determine whether passive modifiers are actually consumed by native roll logic.
- [ ] Determine whether trait activation is clickable on the character sheet.
- [ ] Trace any clickable trait action to its native handler.
- [ ] Determine whether a common trait-action execution function exists.
- [ ] Determine how trait usage is recorded or consumed.


# TODO — Mech Core Powers

Core Powers are especially important because they may introduce powerful scene-level or mission-level state changes.

Research checklist:

- [ ] Determine how the frame's Core Power is represented.
- [ ] Determine whether Core Power and Core System are separate native concepts.
- [ ] Determine where the Core Power is retrieved from the mech actor.
- [ ] Determine how Core Power activation is represented.
- [ ] Determine its action type.
- [ ] Determine whether activation is Protocol, Quick, Full, Free, Special, etc.
- [ ] Determine how Core Power availability is represented.
- [ ] Determine how Core Power expenditure is recorded.
- [ ] Determine whether Core Power state persists on the actor.
- [ ] Determine whether Core Power state persists through combat/scene transitions.
- [ ] Determine how active Core Power effects are represented.
- [ ] Determine whether the native system creates Active Effects or another state representation.
- [ ] Determine how Core Powers modify later actions.
- [ ] Determine how Core Powers modify weapons.
- [ ] Determine how Core Powers modify movement.
- [ ] Determine how Core Powers modify defenses/statistics.
- [ ] Determine how Core Powers grant new actions.
- [ ] Determine how Core Powers grant reactions.
- [ ] Determine how Core Powers grant protocols.
- [ ] Determine whether Core Power activation has a native dialog.
- [ ] Trace the character-sheet Core Power button.
- [ ] Find its native execution entry point.
- [ ] Determine whether Frame Conn can invoke that entry point directly.


# TODO — Pilot Talents

Talents are potentially one of the most complicated sources because ranks may introduce passive modifiers, triggered effects, actions, reactions, and modifications to existing action flows.

Research checklist:

- [ ] Determine how pilot talents are stored on the actor.
- [ ] Determine how talent rank is represented.
- [ ] Determine whether each rank is separately structured.
- [ ] Determine how talent-granted actions are represented.
- [ ] Determine how talent-granted reactions are represented.
- [ ] Determine how talent-granted protocols are represented.
- [ ] Determine how talent-granted Free Actions are represented.
- [ ] Determine how talent-granted Full/Quick Actions are represented.
- [ ] Determine how talent triggers are represented.
- [ ] Determine how "when you Barrage" effects are represented.
- [ ] Determine how "when you Skirmish" effects are represented.
- [ ] Determine how "when you Boost" effects are represented.
- [ ] Determine how "when you hit" effects are represented.
- [ ] Determine how "when you crit" effects are represented.
- [ ] Determine how "when you take damage" effects are represented.
- [ ] Determine whether these triggers are machine-readable.
- [ ] Determine whether native attack rolls inspect talents automatically.
- [ ] Determine whether native damage rolls inspect talents automatically.
- [ ] Determine whether native movement logic inspects talents automatically.
- [ ] Determine whether talent effects appear as selectable roll modifiers.
- [ ] Determine whether talent actions have native character-sheet buttons.
- [ ] Trace those buttons to their handlers.
- [ ] Determine whether talent usage limits are tracked.
- [ ] Determine how per-round/per-scene talent state is stored.
- [ ] Determine whether Frame Conn can discover available talent actions dynamically.


# TODO — Manufacturer Core Bonuses

Manufacturer Core Bonuses must also be treated as part of the actor's action/modifier surface.

A Core Bonus may be entirely passive, may modify existing actions or equipment, or may potentially grant new capabilities that Frame Conn needs to understand.

Research checklist:

- [ ] Determine how acquired manufacturer Core Bonuses are stored on the pilot/mech actor.
- [ ] Identify their native Item/Document type.
- [ ] Determine whether Core Bonus effects are structured or primarily descriptive.
- [ ] Determine whether Core Bonuses can contain executable actions.
- [ ] Determine whether Core Bonuses can grant Quick Actions.
- [ ] Determine whether Core Bonuses can grant Full Actions.
- [ ] Determine whether Core Bonuses can grant Free Actions.
- [ ] Determine whether Core Bonuses can grant Protocols.
- [ ] Determine whether Core Bonuses can grant Reactions.
- [ ] Determine whether Core Bonuses can grant Special Actions.
- [ ] Determine whether Core Bonuses modify Barrage.
- [ ] Determine whether Core Bonuses modify Skirmish.
- [ ] Determine whether Core Bonuses modify weapon attacks.
- [ ] Determine whether Core Bonuses modify tech attacks.
- [ ] Determine whether Core Bonuses modify movement.
- [ ] Determine whether Core Bonuses modify weapon mounts.
- [ ] Determine whether Core Bonuses modify weapon properties.
- [ ] Determine whether Core Bonuses modify Accuracy/Difficulty.
- [ ] Determine whether Core Bonuses modify damage.
- [ ] Determine whether Core Bonuses modify Heat.
- [ ] Determine whether Core Bonuses modify resources.
- [ ] Determine whether Core Bonus effects are incorporated automatically by native Lancer roll calculations.
- [ ] Determine whether any Core Bonus has a clickable character-sheet action.
- [ ] Trace any such action to its native execution handler.
- [ ] Determine whether Frame Conn can discover these effects dynamically.


# TODO — Cross-Cutting Native Action Representation

After investigating individual sources, determine whether they converge on a common Lancer representation.

Search the repository for concepts such as:

- action
- actions
- activation
- activate
- action_type
- actionType
- activation_type
- activationType
- trigger
- reaction
- protocol
- quick
- full
- free
- special
- limited
- uses
- frequency
- effect
- talent
- trait
- core_bonus
- coreBonus
- core_power
- corePower
- system
- deployable

The goal is to discover whether Lancer internally has something equivalent to:

LancerAction {
    name
    activationType
    trigger
    frequency
    target
    attack
    damage
    effect
    resourceCost
}

We should NOT assume such an object exists.

The repo research should determine what the real native representation actually is.


# TODO — Character Sheet Discovery

For each of the five actor-specific sources, trace the character-sheet rendering and click flow.

The basic research pattern should be:

1. Find where the feature appears on the character sheet.

2. Find the template/component responsible for rendering it.

3. Find the button or clickable element.

4. Find its data-action, data-id, class, event binding, or equivalent identifier.

5. Find the event listener.

6. Find the handler invoked by that listener.

7. Follow the handler until reaching the actual gameplay operation.

8. Record every important intermediate function.

9. Identify where actor data is retrieved.

10. Identify where targets are retrieved.

11. Identify where modifiers are calculated.

12. Identify where dialogs are created.

13. Identify where rolls are created.

14. Identify where chat messages are created.

15. Identify where resources/uses are consumed.

16. Identify where actor state is updated.

17. Determine the narrowest native function Frame Conn could safely call.


# TODO — Modifier Pipeline

This research is important not merely for discovering additional buttons.

The eventual Frame Conn execution pipeline needs to understand everything that can modify an action.

Conceptually:

Committed Action
      |
      v
Resolve Controlled Actor
      |
      v
Resolve Base Action
      |
      +-- Universal Action
      +-- Weapon Action
      +-- Tech Action
      +-- System Action
      +-- Trait Action
      +-- Core Power
      +-- Talent Action
      +-- Core Bonus Action
      |
      v
Resolve Actor-Specific Modifiers
      |
      +-- Systems
      +-- Traits
      +-- Core Power State
      +-- Talents
      +-- Core Bonuses
      +-- Weapon Properties
      +-- Conditions
      +-- Statuses
      +-- Target State
      +-- Other Native Lancer Sources
      |
      v
Resolve Target
      |
      v
Calculate Accuracy / Difficulty
      |
      v
Calculate Flat Modifier
      |
      v
Roll Attack / Check
      |
      v
Determine Hit
      |
      v
Roll Damage / Resolve Effect
      |
      v
Apply Native Consequences


# Important Design Constraint

Frame Conn should NOT become a second implementation of the Lancer rules engine.

Whenever possible:

Frame Conn
    |
    v
discovers intent
    |
    v
collects target/context
    |
    v
calls native Lancer execution
    |
    v
Lancer resolves rules

rather than:

Frame Conn
    |
    v
reimplements every Lancer rule

The latter would create an enormous maintenance problem and would inevitably drift away from the actual Lancer system.


# Long-Term Desired Frame Conn Flow

The eventual committed-plan card should be capable of representing both universal actions and actor-specific actions.

Example:

COMMITTED PLAN

[ Barrage                         d20 ]
[ Boost                           d20 ]
[ Hunter Talent Ability           d20 ]
[ Active Mech System              d20 ]
[ Frame Trait Ability             d20 ]
[ Core Power                      d20 ]

The d20 icon is conceptually an EXECUTE control.

It does not necessarily mean every action literally rolls a d20.

Its meaning is:

    Execute this committed action using the appropriate
    native Lancer flow.

For an attack:

Click Execute
    |
    v
Need Target?
    |
    YES
    |
    v
Switch Foundry to Target Tool
    |
    v
Player Selects Target
    |
    v
Resolve Native Attack Context
    |
    v
Apply Actor/Target Modifiers
    |
    v
Roll Attack
    |
    v
Determine Hit
    |
    v
Roll Damage
    |
    v
Apply Damage

For Boost:

Click Execute
    |
    v
Resolve Boost
    |
    v
Enable/refresh movement allowance
    |
    v
Apply Boost-triggered abilities

For a Protocol:

Click Execute
    |
    v
Validate Start-of-Turn Window
    |
    v
Invoke Protocol
    |
    v
Apply Native Effects

For a Reaction:

Trigger occurs
    |
    v
Determine Available Reactions
    |
    v
Select Reaction
    |
    v
Validate Reaction Legality
    |
    v
Execute Native Reaction Flow

For an actor-specific system/talent/trait/core ability:

Click Execute
    |
    v
Resolve Source Item/Feature
    |
    v
Resolve Native Action Definition
    |
    v
Determine Target Requirements
    |
    v
Resolve Native Modifiers
    |
    v
Invoke Native Lancer Execution
    |
    v
Consume Uses / Apply Effects


# Ultimate Research Goal

Once all universal action flows AND these actor-specific sources have been mapped, we should be able to answer:

1. What can this mech currently do?

2. Which of those things are actions?

3. What type of action is each one?

4. Which actions require targets?

5. Which actions require rolls?

6. Which actions require weapon or mount selection?

7. Which actions require system selection?

8. Which actions require additional user choices?

9. Which actions consume Limited charges or another resource?

10. Which actions have usage restrictions?

11. Which actions are reactions?

12. Which actions are Protocols?

13. Which abilities trigger from other actions?

14. Which abilities modify other actions?

15. Which modifiers apply automatically?

16. Which modifiers require player choice?

17. What native Lancer function actually performs each operation?

18. What is the narrowest stable native entry point Frame Conn can call?

19. What state must Frame Conn provide to that entry point?

20. What state should Frame Conn leave entirely under native Lancer ownership?


# Research Order

After completing the universal action-flow research, investigate these in approximately this order:

- [ ] Mounted Systems
- [ ] Mech Traits
- [ ] Mech Core Powers
- [ ] Pilot Talents
- [ ] Manufacturer Core Bonuses

Then:

- [ ] Compare their internal data structures.
- [ ] Identify common action representations.
- [ ] Identify common execution handlers.
- [ ] Identify common roll infrastructure.
- [ ] Identify common targeting infrastructure.
- [ ] Identify common resource-consumption infrastructure.
- [ ] Identify common trigger infrastructure.
- [ ] Identify native modifier aggregation.
- [ ] Identify the safest reusable native execution boundaries.


# End State

The ideal architecture is not:

    Frame Conn knows every Lancer ability.

It is:

    Frame Conn knows how to ASK the Lancer actor what it can do,
    present those capabilities through the Frame Conn interface,
    and hand execution back to the native Lancer machinery
    whenever that machinery already exists.

That distinction will be critical if Frame Conn is going to support arbitrary frames, systems, talents, traits, Core Powers, and manufacturer Core Bonuses without hardcoding the entire game into the module.
