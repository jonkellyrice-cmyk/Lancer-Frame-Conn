# Skill Check

# AF — Skill Check

## Status

**Native dedicated Skill Check execution flow:** Not found.

**Native dedicated `beginSkillCheckFlow()`:** Not found.

**Reusable native generic stat/check flow:** Found.

**Native actor stat-roll entry point:** Found.

**Native HASE stat paths:** Found.

**Native mech-sheet HASE buttons:** Found.

**Native Accuracy/Difficulty HUD:** Found.

**Native stat-roll chat card:** Found.

**Native `skill_check` semantic SynergyLocation:** Found.

**Native `hase` semantic SynergyLocation:** Found.

**Frame Helm implementation status:** Frame Helm should own the universal Skill Check Full Action, Full Action expenditure, HASE selection, committed-plan execution, and authoritative actor resolution while delegating the actual chosen HASE roll directly to native `actor.beginStatFlow(...)` / `StatRollFlow`.

## Purpose

This document records the native Foundry Lancer findings relevant to the universal **Skill Check** Full Action and defines the intended Frame Helm integration boundary.

Repository investigation did not reveal a dedicated executable Skill Check flow such as:

`SkillCheckFlow`

or:

`beginSkillCheckFlow()`

This is not actually a major missing feature.

The native system already provides a generic check/save flow:

`StatRollFlow`

and the native mech sheet uses that flow directly for:

- Hull;
- Agility;
- Systems;
- Engineering.

Therefore:

> Frame Helm should not create a custom Skill Check roller.

Instead:

> Frame Helm should provide the player-facing Skill Check action and delegate the selected HASE roll to the same native stat-roll entry point used by the character sheet.

—

# 1. Skill Check Classification

Skill Check is a **Full Action**.

For Frame Helm’s mech-facing universal action, the player should be able to choose one of the four mech HASE stats:

- Hull;
- Agility;
- Systems;
- Engineering.

The selected stat is then rolled through the native Lancer stat/check system.

—

# 2. Native SkillCheckFlow Search

Repository searching did not identify:

- `SkillCheckFlow`;
- `beginSkillCheckFlow()`;
- dedicated Skill Check flow file;
- dedicated universal Skill Check actor method;
- separate Skill Check application.

This is because the native system uses the more general:

`StatRollFlow`

for this purpose.

—

# 3. Native Actor Entry Point

The native actor exposes:

`actor.beginStatFlow(path, title?)`

Conceptually:

actor
→ stat path
→ `beginStatFlow(...)`
→ `StatRollFlow`
→ native check resolution

This is the correct native entry point for Frame Helm Skill Check execution.

—

# 4. Native `StatRollFlow`

The discovered native stat-roll sequence is:

`initStatRollData`
→ `showStatRollHUD`
→ `rollCheck`
→ `printStatRollCard`

This gives Frame Helm the complete lower-level check execution it needs.

Native Lancer already owns:

- stat resolution;
- Accuracy/Difficulty input;
- d20 construction;
- d6 Accuracy/Difficulty handling;
- roll evaluation;
- native chat-card output.

Frame Helm should preserve this.

—

# 5. Native HASE Paths

The actual native mech stat paths used by the sheet are:

Hull:

`system.hull`

Agility:

`system.agi`

Systems:

`system.sys`

Engineering:

`system.eng`

These should be treated as authoritative.

—

# 6. Do Not Use Alternate Property Names

Some unrelated code may contain alternate-looking names such as:

`system.agility`

or:

`system.systems`

However, the actual native mech sheet and `StatRollFlow` entry path use:

`system.agi`

and:

`system.sys`

Therefore Frame Helm should use:

`system.hull`

`system.agi`

`system.sys`

`system.eng`

and not invent or normalize to alternate paths.

—

# 7. Native Mech Sheet Behavior

The native mech sheet already exposes clickable HASE rolls.

Conceptually:

Hull button
→ `actor.beginStatFlow(“system.hull”)`

Agility button
→ `actor.beginStatFlow(“system.agi”)`

Systems button
→ `actor.beginStatFlow(“system.sys”)`

Engineering button
→ `actor.beginStatFlow(“system.eng”)`

Frame Helm should deliberately mirror this native execution path.

—

# 8. Native Stat Resolution

When `StatRollFlow` is invoked without an item source, the flow resolves the requested stat directly from the actor.

Conceptually:

`resolveDotpath(actor, path)`

Therefore:

Frame Helm does not need to read the stat numerically and manually insert it into a roll formula.

The native flow should resolve the actor’s current value.

—

# 9. HASE Accuracy/Difficulty HUD

The native stat-roll flow opens the HASE Accuracy/Difficulty HUD.

This provides the same manual modifier input available from the native character sheet.

Therefore the first Frame Helm implementation can preserve the native popup exactly.

Conceptually:

Skill Check
→ choose HASE
→ native HASE HUD
→ player sets Accuracy/Difficulty
→ native roll

This is the safest first-stage integration.

—

# 10. Native Roll Construction

The native flow constructs the roll from:

- `1d20`;
- selected stat bonus;
- Accuracy/Difficulty.

When Accuracy exceeds Difficulty, the native system uses the usual highest-d6 Accuracy mechanism.

Conceptually:

`1d20 + stat + Nd6kh1`

with the appropriate sign/handling according to the native check engine.

Frame Helm should not reproduce this formula manually in the initial implementation.

—

# 11. Native Roll Evaluation

The native flow evaluates the Roll itself.

Frame Helm should treat the resulting native flow as the mechanical execution of the check.

Do not create a second Frame Helm dice roller and then print a duplicate result.

—

# 12. Native Chat Output

The flow prints a native stat-roll chat card using the native stat-roll template.

Therefore Skill Check can immediately behave like the character sheet.

This is exactly the desired integration principle for Frame Helm:

alternate player-facing presentation
→ native Lancer execution
→ native chat output.

—

# 13. Native Flow Documentation

Repository flow documentation describes `StatRollFlow` as the generic mechanism for checks or saves involving concepts such as:

- HASE;
- Grit;
- pilot skill triggers.

Therefore using `StatRollFlow` for the universal Skill Check action is consistent with the native architecture, not merely a convenient workaround.

—

# 14. Native `skill_check` Semantic Identity

The native semantic/synergy vocabulary includes:

`skill_check`

This means actor-owned structured content may be able to reference generic Skill Checks.

Frame Helm should preserve the universal Skill Check semantic identity for future trigger/modifier integration.

—

# 15. Native `hase` Semantic Identity

The native semantic vocabulary also includes:

`hase`

This is useful because Frame Helm’s mech Skill Check action specifically performs HASE checks.

Future actor-owned content may distinguish:

generic Skill Check

from:

HASE check.

Frame Helm should preserve enough semantic context to support this distinction.

—

# 16. Native Individual HASE Semantic Identities

Native structured content may also distinguish individual HASE stats.

Relevant semantic concepts include:

- Hull;
- Agility;
- Systems;
- Engineering.

Therefore Frame Helm’s execution context should preserve which specific HASE stat was chosen.

—

# 17. Frame Helm Skill Check Selector

The universal Full Action should likely present:

`SKILL CHECK`

Choose:

`[ HULL ]`

`[ AGILITY ]`

`[ SYSTEMS ]`

`[ ENGINEERING ]`

Each selection resolves the same parent Full Action but configures a different native stat path.

—

# 18. Skill Check Is One Parent Action

The four HASE choices are not four separate Full Actions in the turn budget.

They are options within:

`Skill Check`

Conceptually:

Skill Check
→ choose HASE
→ roll selected HASE

Turn expenditure:

→ one Full Action

not:

→ separate action budget per stat.

—

# 19. Committed Plan Integration

A clean Frame Helm approach is:

Player selects Skill Check
→ chooses HASE during commitment or execution
→ committed card preserves selected stat

Conceptually:

`SKILL CHECK — SYSTEMS                      [d20]`

or:

`SKILL CHECK — HULL                         [d20]`

The exact UI belongs to the Actions/Turn presentation layers.

—

# 20. HASE Selection Timing

Two reasonable UI policies exist:

1. choose HASE when committing Skill Check;
2. choose HASE when executing the committed card.

For deterministic planning and clear action history, choosing at commitment time is likely preferable.

However, the architecture should not depend on display text alone.

Preserve the selected stat path structurally.

—

# 21. Selected Stat State

A committed Skill Check should preserve something conceptually equivalent to:

`statId: “systems”`

and:

`statPath: “system.sys”`

The exact internal shape should follow the Actions refactor.

The important rule is:

do not recover the chosen stat later by parsing the card label.

—

# 22. Skill Check Uses the d20 Execution Control

Skill Check requires a roll.

Therefore the committed action card should use the d20-style execution affordance.

Conceptually:

`SKILL CHECK — AGILITY                      [d20]`

Clicking the d20 control launches the selected native StatRollFlow.

—

# 23. No Target Required by Default

The universal Skill Check itself does not inherently require a target.

Therefore normal HASE Skill Check execution should not automatically:

- enter target-selection mode;
- require Sensors;
- resolve hostile actor;
- bind a target.

Specific rules that call for a targeted or contested HASE check should use their own higher-order action flow, such as Search.

—

# 24. Skill Check vs Search

Search uses:

Systems vs target Agility

and therefore requires:

- a target;
- Sensors validation;
- two rolls;
- contested comparison;
- Hidden removal.

Generic Skill Check does not.

Both may reuse:

`StatRollFlow`

but they are different parent actions.

—

# 25. Skill Check vs Save

`StatRollFlow` can support checks and saves, but the universal Skill Check action is specifically the action from the player’s action catalog.

Do not treat every HASE save in the game as spending the Skill Check Full Action.

The same native roll engine can have multiple parent contexts.

—

# 26. Parent Action Economy

Frame Helm owns:

**one Full Action expenditure**

for Skill Check.

The native StatRollFlow should not independently consume Frame Helm action budget.

Conceptually:

Skill Check parent
→ spend Full Action

Native stat roll
→ mechanical resolution only.

—

# 27. Native Action Tracker

If native actor action-tracker state is synchronized with Frame Helm, the Full Action expenditure may also need to be reflected there.

That should be handled through the central Turn/native-state reconciliation layer.

Do not add Skill Check-specific action-tracker mutation inside the stat-roll adapter.

—

# 28. Duplicate Action Rules

Skill Check should use the normal Frame Helm action identity for duplicate-action restrictions.

Conceptually:

`full.skill-check`

The chosen HASE stat should not turn each stat into a separate repeatable Full Action unless the tabletop rules explicitly say so.

—

# 29. Overcharge

If Overcharge permits a later Quick Action, that does not make Skill Check eligible because Skill Check is a Full Action.

The Skill Check executor itself should not know Overcharge rules.

Central Turn action legality should determine whether the action can be committed.

—

# 30. Prepare

Prepare can only prepare Quick Actions under the confirmed rules.

Therefore the universal Full Action Skill Check cannot ordinarily be Prepared.

No special handling belongs inside Skill Check itself.

—

# 31. HASE Modifier Sources

Future actor-owned content may modify:

- HASE checks generally;
- Skill Checks generally;
- one specific HASE stat;
- Accuracy/Difficulty;
- flat modifiers;
- rerolls.

Relevant source categories include:

- Mounted Systems;
- Mech Traits;
- Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

Where native structured effects feed the native stat/check machinery, Frame Helm should preserve that native behavior.

—

# 32. Do Not Parse Prose First

Because Frame Helm can delegate the actual roll to native StatRollFlow, many structured/native modifiers should already participate.

Preferred hierarchy:

1. native actor stat;
2. native structured effects;
3. native HASE/Skill Check semantic metadata;
4. explicit Frame Helm adapters;
5. prose interpretation only where unavoidable.

—

# 33. Future Automated Skill Check

Eventually Frame Helm may bypass the native HASE popup.

Desired mature flow:

Skill Check committed
→ chosen HASE known
→ Frame Helm derives all Accuracy/Difficulty/flat modifiers
→ automatically rolls
→ prints result
→ applies any deterministic downstream consequence if the specific action requires one.

For the generic universal Skill Check, there usually may be no automatic consequence beyond the roll.

Until modifier automation is complete, preserve native HUD behavior.

—

# 34. Initial Native Integration

The initial Frame Helm integration should be almost direct.

Hull:

`actor.beginStatFlow(“system.hull”, “HULL”)`

Agility:

`actor.beginStatFlow(“system.agi”, “AGILITY”)`

Systems:

`actor.beginStatFlow(“system.sys”, “SYSTEMS”)`

Engineering:

`actor.beginStatFlow(“system.eng”, “ENGINEERING”)`

Exact capitalization/title text is presentation-level.

The stat paths are the important native contract.

—

# 35. Native Adapter Boundary

UI code should not directly invoke actor methods.

Preferred dependency direction:

Committed Skill Check
→ Actions execution service
→ native-system adapter
→ authoritative actor
→ `actor.beginStatFlow(...)`

This keeps native Lancer API knowledge isolated.

—

# 36. Suggested Native Adapter Capability

Conceptually, the native-system adapter may expose something like:

`rollHaseCheck(actor, statId, options)`

which internally maps:

Hull
→ `system.hull`

Agility
→ `system.agi`

Systems
→ `system.sys`

Engineering
→ `system.eng`

Exact API names are illustrative only.

The point is to keep path strings out of UI/presentation code.

—

# 37. Revalidation at Execution

When the d20 button is clicked:

Frame Helm should re-resolve the authoritative actor.

Do not assume the actor reference stored at commitment time remains current.

Potential issues include:

- actor deleted;
- controlled token changed;
- Frame Helm rebound;
- stat changed.

The native flow should use current actor data.

—

# 38. Current Stat Value

Because `StatRollFlow` resolves the stat when it runs, changes between commitment and execution are naturally reflected.

Example:

Systems was +2 at commitment
→ effect changes Systems to +3
→ execute Skill Check
→ native flow should resolve +3

This is desirable.

Do not snapshot the raw numeric stat at commitment time.

—

# 39. Accuracy/Difficulty Timing

Likewise, situational Accuracy/Difficulty is determined at execution time through the native HUD.

This is appropriate because circumstances may change after commitment.

—

# 40. Cancellation

If the player launches the native HASE HUD and cancels, Frame Helm needs a policy for committed-action execution state.

The action may already have been committed/spent in the plan.

Therefore cancellation should distinguish:

- mechanical roll not completed;
- action commitment already exists.

The general committed-action execution policy should handle this rather than Skill Check inventing its own refund system.

—

# 41. Flow Result Capture

For future automation and action history, Frame Helm should research whether `StatRollFlow.begin()` returns enough data to inspect:

- roll total;
- formula;
- Accuracy/Difficulty;
- success against a target number if applicable.

Initial integration may simply delegate and rely on native chat output.

Later features such as contested checks benefit from programmatic result access.

—

# 42. Skill Check Has No Automatic Success Threshold by Itself

The universal Skill Check action does not inherently define one universal target number in the repo findings.

The surrounding GM/rule context determines what the check means.

Therefore Frame Helm should not invent:

`10+ = success`

or another universal threshold for every Skill Check.

The generic action’s responsibility is primarily:

perform selected HASE check.

—

# 43. Chat Output

The native stat-roll chat card should remain the initial authoritative visible result.

Frame Helm may additionally annotate committed-plan state as:

Executed

but should not duplicate the entire roll in a second custom chat card unless needed.

—

# 44. Semantic Execution Event

Frame Helm may eventually emit semantic context equivalent to:

Skill Check executed

with:

selected HASE = Systems

This can support:

- telemetry;
- trigger systems;
- actor-owned effects;
- history.

Exact event names are conceptual only.

—

# 45. Native `skill_check` and `hase`

When future structured actor-owned effects are integrated, both native semantic concepts may be relevant.

Conceptually:

action event:
`skill_check`

subtype:
`hase`

specific stat:
`systems`

This gives a useful hierarchy for trigger/modifier matching.

—

# 46. Skill Check and Manufacturer/Core Content

Future bonuses may say things equivalent to:

- gain Accuracy on HASE checks;
- gain Accuracy on Systems checks;
- gain a bonus when making a Skill Check.

Frame Helm should preserve enough semantic context for these to be applied through native structured data or explicit adapters.

—

# 47. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- universal Skill Check Full Action;
- Full Action expenditure;
- HASE selector;
- committed-plan state;
- selected HASE identity;
- authoritative actor resolution;
- execution button;
- Frame Helm presentation/history.

**NATIVE LANCER OWNS:**

- `system.hull`;
- `system.agi`;
- `system.sys`;
- `system.eng`;
- `actor.beginStatFlow(...)`;
- `StatRollFlow`;
- native stat resolution;
- native Accuracy/Difficulty HUD;
- roll construction;
- d20 execution;
- native stat-roll chat card;
- structured HASE/Skill Check modifier behavior already connected to the flow.

—

# 48. Do Not Invent `SkillCheckFlow`

No native SkillCheckFlow was found.

Frame Helm should not wrap `StatRollFlow` in terminology suggesting the native system has a dedicated Skill Check workflow when it does not.

The correct native boundary is:

`StatRollFlow`.

—

# 49. Proposed Initial Skill Check Flow

SKILL CHECK
→ player chooses HASE

HULL
→ stat path `system.hull`

AGILITY
→ stat path `system.agi`

SYSTEMS
→ stat path `system.sys`

ENGINEERING
→ stat path `system.eng`

Then:

→ commit one Full Action
→ committed card shows chosen HASE
→ player clicks d20
→ Frame Helm resolves authoritative actor
→ native-system adapter calls `actor.beginStatFlow(path, title)`
→ native `StatRollFlow`
→ native HASE Accuracy/Difficulty HUD
→ native roll
→ native chat card
→ Frame Helm marks committed Skill Check executed
→ refresh Turn/UI state

—

# 50. Immediate Repository Research TODO

- [ ] Trace `actor.beginStatFlow(...)` completely.
- [ ] Trace `StatRollFlow` constructor.
- [ ] Trace `initStatRollData`.
- [ ] Confirm exact native stat paths.
- [ ] Trace native mech-sheet HASE click handler.
- [ ] Trace `showStatRollHUD`.
- [ ] Trace `rollCheck`.
- [ ] Trace stat-roll card rendering.
- [ ] Determine what `StatRollFlow.begin()` returns.
- [ ] Determine whether total can be captured programmatically.
- [ ] Trace native HASE modifier application.
- [ ] Trace `skill_check` SynergyLocation.
- [ ] Trace `hase` SynergyLocation.
- [ ] Trace individual Hull/Agility/Systems/Engineering synergy locations.
- [ ] Confirm whether native actor action tracker is modified by sheet HASE rolls.
- [ ] Confirm cancellation behavior of the HASE HUD.

—

# 51. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Keep Skill Check in universal Full Action catalog.
- [ ] Add HASE selector.
- [ ] Preserve selected HASE structurally.
- [ ] Map HASE IDs to native stat paths.
- [ ] Spend Full Action exactly once.
- [ ] Add d20 execution control.
- [ ] Resolve authoritative actor at execution.
- [ ] Delegate through native-system adapter.
- [ ] Call native `beginStatFlow(...)`.
- [ ] Preserve native Accuracy/Difficulty HUD.
- [ ] Preserve native chat output.
- [ ] Mark committed action executed after flow resolution.
- [ ] Refresh Frame Helm Turn/action state.
- [ ] Preserve semantic `skill_check`.
- [ ] Preserve semantic `hase`.
- [ ] Preserve selected HASE subtype.
- [ ] Avoid duplicate numeric stat storage.
- [ ] Avoid duplicate roll formulas.

—

# 52. Future Automation TODO

- [ ] Determine programmatic StatRollFlow result access.
- [ ] Derive Accuracy automatically.
- [ ] Derive Difficulty automatically.
- [ ] Derive structured flat modifiers automatically.
- [ ] Support automatic roll without HASE popup.
- [ ] Preserve native chat/result presentation.
- [ ] Support target-number checks where context supplies one.
- [ ] Reuse same low-level check adapter for Search.
- [ ] Reuse same low-level check adapter for saves where appropriate.
- [ ] Keep parent action economy separate from roll execution.

—

# 53. Smoke Test TODO

HASE selection:

- [ ] Hull selected correctly.
- [ ] Agility selected correctly.
- [ ] Systems selected correctly.
- [ ] Engineering selected correctly.
- [ ] selected stat survives committed-plan render.
- [ ] correct stat label shown.

Native execution:

- [ ] Hull uses `system.hull`.
- [ ] Agility uses `system.agi`.
- [ ] Systems uses `system.sys`.
- [ ] Engineering uses `system.eng`.
- [ ] native HASE HUD opens.
- [ ] Accuracy works.
- [ ] Difficulty works.
- [ ] native stat bonus included.
- [ ] roll appears in native chat card.

Turn state:

- [ ] Full Action spent exactly once.
- [ ] roll itself does not spend another action.
- [ ] committed card marked executed.
- [ ] stale actor reference re-resolved.
- [ ] current stat value used at execution time.

Failure/cancellation:

- [ ] actor missing fails cleanly.
- [ ] native flow cancellation handled.
- [ ] no duplicate chat output.
- [ ] no incorrect refund/double-spend.

—

# 54. Important Invariants

**Invariant 1**

Skill Check is a Full Action.

**Invariant 2**

No dedicated native SkillCheckFlow was found.

**Invariant 3**

Native `StatRollFlow` is the correct generic native check/save engine.

**Invariant 4**

The native actor entry point is `actor.beginStatFlow(path, title?)`.

**Invariant 5**

The authoritative mech HASE paths are:

`system.hull`

`system.agi`

`system.sys`

`system.eng`

**Invariant 6**

Frame Helm should not duplicate numeric HASE values.

**Invariant 7**

Frame Helm owns Full Action expenditure.

**Invariant 8**

Native StatRollFlow owns the actual check roll.

**Invariant 9**

The universal Skill Check does not inherently require a target.

**Invariant 10**

The universal Skill Check does not inherently define one automatic success threshold.

**Invariant 11**

Native `skill_check` and `hase` semantic identities should be preserved for future structured modifier/trigger integration.

—

# 55. Final Working Model

SKILL CHECK
│
├── Full Action
│
├── Frame Helm selector
│   │
│   ├── HULL
│   │   └── `system.hull`
│   │
│   ├── AGILITY
│   │   └── `system.agi`
│   │
│   ├── SYSTEMS
│   │   └── `system.sys`
│   │
│   └── ENGINEERING
│       └── `system.eng`
│
├── Frame Helm
│   ├── spend Full Action
│   ├── preserve chosen HASE
│   ├── committed-plan execution
│   └── resolve authoritative actor
│
└── Native Lancer
    │
    ├── `actor.beginStatFlow(...)`
    └── `StatRollFlow`
        ├── resolve native stat
        ├── HASE Accuracy/Difficulty HUD
        ├── build d20 roll
        ├── evaluate roll
        └── native stat-roll chat card

The critical architectural rule is:

**Skill Check is already mechanically native through StatRollFlow.**

Frame Helm only needs to supply the Full Action wrapper, HASE selection, and player-facing execution path.
