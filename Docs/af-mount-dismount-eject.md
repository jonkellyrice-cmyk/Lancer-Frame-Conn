# Mount / Dismount / Eject
cat > docs/af-Mount-Dismount-Eject.md <<‘EOF’
# AF — Mount / Dismount / Eject

## Status

**Native dedicated Mount execution flow:** Not found.

**Native dedicated Dismount execution flow:** Not found.

**Native dedicated Eject execution flow:** Not found.

**Native Dismount/Eject core macro:** Found.

**Native Mount core macro:** Not found.

**Native pilot ↔ mech relationship:** Found.

**Native pilot mounted state:** Found.

**Native current-runtime mech ejected state:** Not found.

**Legacy packed-data ejected state:** Found.

**Native pilot-token placement/spawn implementation:** Found.

**Native Mount semantic identity:** Found.

**Native action-economy handling:** Not found.

**Frame Helm implementation status:** Frame Helm should own Mount / Dismount / Eject rules orchestration, action economy, physical mounted-state mutation, legality, and lifecycle while reusing the native pilot↔mech relationship and the stock Dismount/Eject token-placement pattern.

## Purpose

This document records the native Foundry Lancer findings relevant to **Mount / Dismount / Eject** and defines the intended Frame Helm integration boundary.

Repository investigation did not reveal dedicated executable flows such as:

`MountFlow`

`DismountFlow`

`EjectFlow`

or corresponding:

`beginMountFlow()`

`beginDismountFlow()`

`beginEjectFlow()`

However, the stock Lancer system does include a core macro named:

`Dismount/Eject`

located at:

`src/packs/core_macros/Dismount_Eject_JEdudHJ1d7YR88sE.yml`

This macro provides a useful native execution primitive:

> Resolve the mech’s pilot, let the user choose a position, and create the pilot’s token at that position.

It does **not** implement the complete tabletop action.

Therefore:

> Frame Helm should reuse the native relationship and placement primitives while supplying the missing action/state orchestration.

—

# 1. Action Family

Mount, Dismount, and Eject are closely related because all three alter the pilot’s physical relationship to their mech.

Conceptually:

`MOUNT`
→ pilot outside mech
→ pilot enters mech

`DISMOUNT`
→ pilot inside mech
→ pilot exits normally

`EJECT`
→ pilot inside mech
→ pilot exits through Eject-specific rules

They should share infrastructure without being collapsed into one semantic action.

—

# 2. Native Flow Search

Repository searching did not identify:

- `MountFlow`
- `DismountFlow`
- `EjectFlow`
- `beginMountFlow()`
- `beginDismountFlow()`
- `beginEjectFlow()`
- dedicated Mount actor executor
- dedicated Dismount actor executor
- dedicated Eject actor executor

Therefore Frame Helm cannot delegate this action family to a native Flow.

—

# 3. Stock Dismount/Eject Macro

The native repository contains the core macro:

`Dismount/Eject`

at:

`src/packs/core_macros/Dismount_Eject_JEdudHJ1d7YR88sE.yml`

This is the closest thing in the repository to a native Dismount/Eject execution path.

The macro is therefore important integration evidence even though it is not a complete rules implementation.

—

# 4. Native Dismount/Eject Macro Entry

The macro first requires the acting actor to be a mech.

Conceptually:

current actor
→ `actor?.is_mech()`
→ otherwise stop

This establishes that the stock interaction is launched from the mech rather than from a separate pilot action controller.

Frame Helm’s mech-facing interface naturally fits this same entry context.

—

# 5. Native Pilot Resolution

The macro resolves the pilot through the mech’s native pilot relationship.

Conceptually:

mech
→ `actor.system.pilot`
→ resolve UUID
→ Pilot actor

The discovered implementation uses:

`fromUuid(...)`

to resolve the referenced pilot actor.

Therefore Frame Helm should not independently search actors by name or maintain a duplicate pilot lookup table.

Use the native mech↔pilot relationship.

—

# 6. Native Dismount/Eject Placement

After resolving the pilot, the macro creates a tiny Lancer weapon-range template:

`game.lancer.canvas.WeaponRangeTemplate.fromRange(...)`

with a conceptual range equivalent to:

`Blast 0.1`

It then calls:

`.placeTemplate()`

This template is not being used as an attack.

It is being used as a native Lancer/Foundry:

**click-to-place position selector.**

—

# 7. Placement Pipeline

The stock interaction is effectively:

Dismount/Eject invoked
→ create tiny placement template
→ user moves placement template
→ user chooses square
→ resolve template coordinates
→ snap coordinates to grid
→ create Pilot token
→ remove temporary template

This is a useful native UX pattern that Frame Helm can reuse initially.

—

# 8. Grid Snapping

After placement, the macro uses the Foundry grid to resolve the selected location.

The discovered implementation calls conceptually:

`canvas.grid.getTopLeft(t.x, t.y)`

This provides the top-left grid position used for pilot-token creation.

Frame Helm should prefer native Foundry grid geometry rather than manually calculating pixel offsets.

—

# 9. Native Pilot Token Creation

The macro creates the pilot token through:

`TokenDocument.create(...)`

using:

`pilot.prototypeToken`

plus:

`actorId: pilot.id`

and the chosen:

`x`

`y`

coordinates.

Conceptually:

Pilot actor
→ prototypeToken
→ chosen scene coordinates
→ TokenDocument.create(...)
→ Pilot token appears

This is an important reusable native boundary.

—

# 10. Pilot Prototype Token Is Authoritative

The stock macro spreads:

`pilot.prototypeToken`

into the new TokenDocument.

Therefore the pilot token inherits the pilot actor’s configured token data.

Frame Helm should preserve this behavior.

Do not fabricate:

- pilot token image;
- token dimensions;
- token name;
- token display settings;
- vision configuration;

when the native prototype token already owns them.

—

# 11. Scene Ownership

The stock macro creates the token with:

`parent: canvas.scene`

Therefore Dismount/Eject creates the pilot token on the currently active scene.

Frame Helm should preserve explicit scene ownership when creating the pilot token.

—

# 12. Temporary Template Cleanup

After token creation, the stock macro deletes the temporary placement template.

Conceptually:

placement selected
→ Pilot token created
→ temporary template deleted

Any Frame Helm implementation reusing this mechanism must preserve cleanup even if later execution fails.

—

# 13. What the Native Macro Actually Owns

The native Dismount/Eject macro owns:

- verifying the current actor is a mech;
- resolving the mech’s pilot;
- providing placement interaction;
- grid snapping;
- creating the pilot token;
- deleting the temporary placement template.

That is its actual execution scope.

—

# 14. What the Native Macro Does Not Own

The macro does not appear to:

- spend an action;
- distinguish Dismount from Eject;
- validate complete tabletop legality;
- mutate `pilot.system.mounted`;
- create a current-runtime mech `ejected` state;
- clear `pilot.system.active_mech`;
- clear `mech.system.pilot`;
- add the pilot token to combat;
- transfer turn state;
- change control ownership;
- shut down the mech;
- create chat output;
- create a native Flow card;
- manage Frame Helm committed action state.

Therefore the macro is best understood as:

**a pilot-token deployment helper**

rather than:

**a complete Dismount/Eject action engine.**

—

# 15. Native Pilot ↔ Mech Relationship

The repository has a proper native relationship between Pilot and Mech actors.

Pilot side:

`pilot.system.active_mech`

Mech side:

`mech.system.pilot`

These are synchronized UUID-style actor references.

This relationship should remain authoritative.

—

# 16. Native Pilot Active Mech

The Pilot actor contains:

`pilot.system.active_mech`

This identifies the pilot’s active mech.

It should not automatically be interpreted as:

`the pilot is physically inside this mech`

Those are different concepts.

—

# 17. Native Mech Pilot

The Mech actor contains:

`mech.system.pilot`

This identifies the pilot associated with the mech.

Again, this represents actor relationship/assignment.

It does not by itself prove that the pilot is physically mounted at this exact moment.

—

# 18. Native Relationship Assignment

The native pilot sheet contains logic conceptually equivalent to:

activateMech(mech)
→ pilot.system.active_mech = mech.uuid
→ mech.system.pilot = pilot.uuid

This confirms the bidirectional actor relationship.

Frame Helm should consume this relationship rather than duplicate it.

—

# 19. Native Relationship Deactivation

The pilot sheet also exposes active-mech deactivation behavior that can clear:

`pilot.system.active_mech`

This further confirms that active-mech assignment is its own lifecycle.

Therefore:

Dismount
≠ deactivate mech

and:

Eject
≠ necessarily deactivate mech

unless confirmed tabletop rules require that relationship change.

—

# 20. Native Mounted State

The Pilot actor model contains:

`pilot.system.mounted`

This is a native Boolean field.

It is defined with an initial state equivalent to:

`false`

Therefore the native data model explicitly recognizes a concept corresponding to:

`pilot is physically mounted`

This is the most natural native field for Frame Helm to use for physical mount state.

—

# 21. Mounted State Import

The Comp/Con import path also imports:

`data.state?.mounted`

into:

`pilot.system.mounted`

This confirms that the field is intentional and not merely an unused schema accident.

—

# 22. Mounted State Runtime Limitation

Despite existing in the schema, repository searching found essentially no gameplay execution machinery that actively manages:

`pilot.system.mounted`

The stock Dismount/Eject macro does not update it.

Therefore Frame Helm will likely need to mutate this native field itself through the proper actor update/document API.

—

# 23. Relationship vs Physical State

Frame Helm should preserve the distinction:

`pilot.system.active_mech`
→ which mech is active/assigned to this pilot

`mech.system.pilot`
→ which pilot is assigned to this mech

`pilot.system.mounted`
→ whether the pilot is physically mounted

This distinction is critical.

—

# 24. Do Not Clear Active Mech on Ordinary Dismount

An ordinary Dismount should not automatically do:

`pilot.system.active_mech = null`

unless the confirmed Lancer rules/native architecture explicitly require it.

The pilot may exit their mech while the mech remains:

- their active mech;
- associated with them;
- available for remounting.

Therefore the likely Dismount state change is:

`pilot.system.mounted = false`

while preserving:

`pilot.system.active_mech`

and:

`mech.system.pilot`

—

# 25. Legacy Ejected State

The packed Comp/Con mech data contains:

`ejected: boolean`

This proves that an Ejected concept existed in imported/packed data.

However, this does not mean the current runtime Mech model supports the same field.

—

# 26. Current Runtime Ejected State

The current Mech runtime model does not appear to define:

`mech.system.ejected`

The import code even contains a comment equivalent to:

`Maybe handle ejected state? Who cares?`

Therefore native current-runtime Ejected state appears intentionally unimplemented.

Frame Helm should not invent writes to:

`mech.system.ejected`

when that is not an actual supported runtime field.

—

# 27. Frame Helm Eject Metadata

If Frame Helm needs to remember:

`this pilot Ejected rather than Dismounted`

that state should likely be Frame Helm-owned unless later repository research reveals a supported native representation.

Potential reasons to retain Eject identity include:

- Eject-specific consequences;
- remount restrictions;
- once-per-scene restrictions;
- mech state;
- trigger effects;
- UI history.

Exact storage should follow confirmed rules.

—

# 28. Native Mount Semantic Identity

The repository recognizes:

`mount`

as a native `SynergyLocation`.

Therefore native actor-owned content may be able to reference Mount semantically.

Frame Helm should preserve Mount action identity for future trigger integration.

—

# 29. Native Mount Executor

Despite the semantic identity, no stock Mount executor was found.

Repository searching did not reveal:

- Mount core macro;
- Mount Flow;
- `mountPilot()`;
- token absorption helper;
- mounted-state transition handler.

Therefore Frame Helm must own the Mount action.

—

# 30. Dismount and Eject Are Combined Natively

The stock macro is literally named:

`Dismount/Eject`

It does not receive or branch on a discovered mode such as:

`”dismount”`

versus:

`”eject”`

Both currently reduce to:

resolve pilot
→ choose location
→ create Pilot token

Therefore the native implementation does not model their tabletop distinction.

Frame Helm must.

—

# 31. Why Frame Helm Must Distinguish Them

Dismount and Eject may differ in:

- action type;
- timing;
- legality;
- placement;
- consequences;
- remount behavior;
- mech consequences;
- special triggers.

The exact differences must come from confirmed Lancer rules.

Shared placement infrastructure should not erase separate semantic identities.

—

# 32. Shared Exit-Pilot Primitive

Dismount and Eject should probably share a lower-level Frame Helm primitive.

Conceptually:

Exit Pilot From Mech
→ resolve mech
→ resolve pilot
→ validate pilot relationship
→ choose legal placement
→ create pilot token
→ set `pilot.system.mounted = false`
→ preserve actor relationship
→ return authoritative result

Then:

Dismount
→ rules/configuration for normal exit

Eject
→ rules/configuration for emergency exit

Exact API names are illustrative only.

—

# 33. Proposed Initial Dismount Flow

The likely initial Frame Helm Dismount flow is:

Player commits Dismount
→ execute
→ resolve authoritative mech
→ resolve `mech.system.pilot`
→ resolve Pilot actor
→ validate Dismount legality
→ verify pilot is currently mounted
→ begin native-style placement interaction
→ player selects legal destination
→ validate destination
→ snap destination using Foundry grid
→ create token from `pilot.prototypeToken`
→ set `pilot.system.mounted = false`
→ preserve `pilot.system.active_mech`
→ preserve `mech.system.pilot`
→ apply any confirmed Dismount consequences
→ mark action executed
→ refresh authoritative state
→ refresh Frame Helm presentation

—

# 34. Proposed Initial Eject Flow

The likely initial Frame Helm Eject flow is:

Player invokes/commits Eject
→ execute
→ resolve authoritative mech
→ resolve `mech.system.pilot`
→ resolve Pilot actor
→ validate Eject legality/timing
→ verify pilot is currently mounted
→ begin placement interaction
→ choose legal Eject destination
→ create token from `pilot.prototypeToken`
→ set `pilot.system.mounted = false`
→ preserve pilot/mech actor relationship unless rules require otherwise
→ record Frame Helm Eject-specific state if required
→ apply confirmed Eject consequences
→ mark execution complete
→ refresh authoritative state
→ refresh Frame Helm presentation

—

# 35. Proposed Initial Mount Flow

Mount is conceptually the inverse physical transition.

Likely flow:

Pilot invokes Mount
→ resolve authoritative Pilot actor/token
→ resolve `pilot.system.active_mech`
→ resolve active Mech actor/token
→ validate Mount legality
→ validate proximity/adjacency
→ validate mech/pilot relationship
→ validate mech is mountable
→ set `pilot.system.mounted = true`
→ remove Pilot token from scene
→ preserve `pilot.system.active_mech`
→ preserve `mech.system.pilot`
→ restore mech-facing presentation/control as appropriate
→ mark action executed
→ refresh authoritative state
→ refresh Frame Helm presentation

—

# 36. Mount Token Removal

If Dismount physically creates the Pilot token, Mount likely needs to remove the Pilot token when the pilot enters the mech.

Conceptually:

Pilot token outside mech
→ Mount succeeds
→ physical pilot represented inside mech
→ external Pilot token removed

This should use normal Foundry TokenDocument deletion.

Do not merely hide the token unless there is a deliberate reason to preserve it.

—

# 37. Multiple Pilot Tokens

Before deleting or spawning tokens, Frame Helm must guard against duplicate Pilot tokens.

Possible cases include:

- stock Dismount macro already used;
- accidental duplicate token;
- pilot token manually dragged onto scene;
- stale token from prior state.

Frame Helm should not blindly create another Pilot token every time.

—

# 38. Existing Pilot Token Check

Before Dismount/Eject token creation:

resolve scene
→ search for existing tokens representing Pilot actor
→ determine whether a valid outside-mech Pilot token already exists

If one already exists, Frame Helm should avoid duplicate creation and either:

- use the existing token;
- reject the inconsistent state;
- provide recovery behavior.

Exact UX should be designed deliberately.

—

# 39. Mech Token Resolution

Mount requires a physical mech token.

The active-mech actor relationship alone is insufficient for adjacency.

Frame Helm should resolve:

`pilot.system.active_mech`
→ Mech actor
→ token on current scene

Then validate the actual token relationship.

—

# 40. Cross-Scene State

Potential inconsistent state:

Pilot actor
→ active mech exists

but:

active mech token
→ not on current scene

Mount should not silently teleport the pilot between scenes.

Frame Helm should reject or explicitly handle this case.

—

# 41. Adjacency

Mount and normal Dismount placement likely have adjacency/range requirements.

Frame Helm should use Foundry/native grid measurement rather than visual estimation.

Before implementation, confirm exact tabletop requirements.

—

# 42. Placement Validation

The stock macro allows placement but does not appear to perform complete tabletop destination validation.

Frame Helm should eventually validate:

- scene bounds;
- legal grid position;
- required proximity to mech;
- occupied spaces;
- walls/terrain where relevant;
- token size;
- Eject-specific range if any.

The native placement template can remain the interaction layer while Frame Helm validates the result.

—

# 43. Placement Template Reuse

The stock macro demonstrates a known-good native interaction:

`WeaponRangeTemplate.fromRange(...)`
→ `.placeTemplate()`

Frame Helm can initially reuse this rather than inventing a custom canvas placement controller.

However, this should be wrapped behind the native-system adapter because:

- it is an implementation detail;
- the system may change;
- Frame Helm may later replace the UI.

—

# 44. Do Not Couple UI Directly to WeaponRangeTemplate

Preferred dependency direction:

Mount/Dismount/Eject execution
→ placement service
→ native-system adapter
→ Lancer WeaponRangeTemplate
→ Foundry canvas

The UI should request:

`choose pilot placement`

rather than directly knowing why a Blast 0.1 template is being created.

—

# 45. Action Economy

The stock macro does not spend any action resource.

Therefore Frame Helm must own action-economy enforcement.

The exact action classification for:

- Mount;
- Dismount;
- Eject;

must come from confirmed Lancer rules and the Frame Helm universal action registry.

Do not infer all three use the same action cost merely because the stock macro combines Dismount/Eject.

—

# 46. Committed Plan Integration

Where an action is normally committed during the acting character’s turn:

Mount / Dismount
→ committed action card
→ non-roll execute control

These actions do not inherently require a d20 attack/check.

Eject may have different timing and may not always belong to ordinary planned action execution.

That should be determined from the confirmed rules.

—

# 47. No d20 Roll

The native macro performs no roll.

Mount / Dismount / Eject should therefore use a non-roll execution control unless a specific actor-owned effect adds a check.

Conceptually:

`DISMOUNT                                  [execute]`

not:

`DISMOUNT                                  [d20]`

—

# 48. Combatant Handling

The native Dismount/Eject macro creates a TokenDocument but does not appear to create or modify a Combatant.

Therefore a pilot exiting during active combat may create a token that is not automatically represented in the combat tracker.

Frame Helm needs an explicit policy for this.

—

# 49. Pilot and Mech Turn Relationship

Before implementing automatic Combatant creation, confirm Lancer’s rules for:

- pilot initiative while dismounted;
- whether pilot and mech share a turn;
- whether both should be separate combatants;
- what happens to the mech’s existing combatant;
- how remounting affects combat.

Do not assume generic Foundry initiative behavior is correct.

—

# 50. Control Transfer

The stock macro does not transfer token control.

Frame Helm may eventually need to change its controlled-unit presentation from:

Mech

to:

Pilot

after Dismount/Eject.

Likewise Mount may return the primary Frame Helm presentation to the mech.

This is a Frame Helm UX concern separate from the underlying actor relationship.

—

# 51. Frame Helm Context After Dismount

Frame Helm is primarily a mech player interface.

When the pilot leaves the mech, possible UI strategies include:

- remain focused on mech with pilot substate;
- transition to pilot controls;
- allow switching between linked pilot/mech;
- close mech-only action surfaces.

This should be designed separately from the native action flow.

Do not bake UI assumptions into the token-state adapter.

—

# 52. Mech State After Dismount

The native macro does not alter the mech after the pilot exits.

Therefore any rules governing an unpiloted mech must be implemented separately.

Potential questions include:

- can it act?
- does it become inactive?
- does it retain statuses?
- can another pilot Mount it?
- does Shutdown apply?

These require rules research.

—

# 53. Mech State After Eject

Likewise, Eject may have stronger consequences than Dismount.

The stock macro does not implement them.

Frame Helm must not assume:

Eject
= Dismount with a different label

even though the native macro currently treats them identically.

—

# 54. Active Mech Relationship After Exit

The likely default architecture is:

Dismount/Eject
→ physical mounted state changes

but:

pilot.active_mech
↔ mech.pilot

remains intact.

This allows Frame Helm to know which mech the pilot exited and potentially remount it later.

Only clear the relationship if the rules or an explicit user operation actually changes active-mech assignment.

—

# 55. Mounting a Different Mech

If a Pilot attempts to Mount a mech that is not:

`pilot.system.active_mech`

Frame Helm needs an explicit rule/policy.

Potential possibilities include:

- reject;
- allow only through a separate active-mech reassignment;
- permit temporary Mount;
- change the native pilot/mech relationship.

Do not silently overwrite native actor relationships.

—

# 56. Mech Already Has Pilot

Before Mount:

target mech
→ inspect `mech.system.pilot`

If another pilot is assigned/mounted:

→ reject or apply the actual rules

Do not overwrite another pilot relationship without explicit legal behavior.

—

# 57. Pilot Already Mounted

Before Mount:

`pilot.system.mounted`

should be checked.

If already true:

→ Mount should not proceed.

Likewise Dismount/Eject should verify the pilot is in a state where exiting is legal.

—

# 58. Native State Mutation

Frame Helm should update:

`pilot.system.mounted`

through the native Foundry actor document update path.

Conceptually:

`await pilot.update({ “system.mounted”: false })`

or:

`await pilot.update({ “system.mounted”: true })`

Exact adapter code should be confirmed against the actual current system API.

—

# 59. Mutation Ordering — Dismount/Eject

Dismount/Eject involves both:

- token creation;
- actor-state mutation.

Ordering should be chosen carefully.

A safe conceptual transaction is:

validate everything
→ choose placement
→ create Pilot token
→ confirm creation
→ set mounted false
→ finalize action

If token creation fails:

→ do not leave actor falsely marked outside the mech.

—

# 60. Mutation Ordering — Mount

Mount involves:

- actor-state mutation;
- Pilot token deletion.

Potential safe ordering:

validate everything
→ set mounted true
→ delete Pilot token
→ verify final state

However, failure recovery must be considered.

If token deletion fails after state mutation:

→ Frame Helm should reconcile the inconsistent state.

The final transaction strategy should be explicit.

—

# 61. Transaction / Recovery

These actions mutate multiple Foundry documents.

Therefore they should be treated as small transactional workflows.

Possible failures:

- pilot resolution fails;
- placement cancelled;
- token creation fails;
- actor update fails;
- token deletion fails;
- scene changes;
- active mech disappears.

Frame Helm should not mark the committed action fully executed until the required mutations succeed.

—

# 62. Placement Cancellation

The stock `.placeTemplate()` interaction may return no template if cancelled.

The native macro simply stops.

Frame Helm should distinguish:

user cancelled placement

from:

action successfully executed.

Cancellation should not automatically consume/complete the committed action unless the action economy policy explicitly says otherwise.

—

# 63. No Native Chat Output

The stock Dismount/Eject macro does not create a native chat card.

Therefore Frame Helm may optionally provide concise execution feedback.

For example:

`Pilot dismounted from mech.`

or:

`Pilot ejected from mech.`

This should be Frame Helm output, not falsely presented as native Lancer Flow output.

—

# 64. Semantic Identity

Frame Helm should preserve distinct semantic events:

- Mount;
- Dismount;
- Eject.

Even if they share infrastructure, actor-owned effects may care about which occurred.

Native `mount` SynergyLocation should be preserved where applicable.

Research is still needed for structured native Dismount/Eject semantic metadata.

—

# 65. Mounted Systems / Traits / Talents / Core Bonuses

Future actor-owned content may alter:

- Mount action cost;
- Dismount placement;
- Eject distance;
- Eject consequences;
- remount legality;
- unpiloted mech behavior;
- pilot protection during Eject.

Relevant sources include:

- Mounted Systems;
- Mech Traits;
- Mech Core Powers;
- Pilot Talents;
- Manufacturer Core Bonuses.

Frame Helm’s action orchestration should leave extension points for these modifiers.

—

# 66. Do Not Parse Prose First

Preferred hierarchy:

1. native structured actor relationship;
2. native `pilot.system.mounted`;
3. native synergy/action metadata;
4. native structured system/talent effects;
5. Frame Helm explicit adapters;
6. prose parsing only where no structured representation exists.

—

# 67. Native-System Boundary

The intended ownership split is:

**FRAME HELM OWNS:**

- Mount action orchestration;
- Dismount action orchestration;
- Eject action orchestration;
- action economy;
- legality;
- Dismount vs Eject distinction;
- mounted-state transition;
- placement validation;
- duplicate-token prevention;
- token removal during Mount;
- Eject-specific metadata if required;
- combat/turn integration;
- execution state;
- semantic events;
- Frame Helm presentation.

**NATIVE LANCER / FOUNDRY OWNS:**

- `pilot.system.active_mech`;
- `mech.system.pilot`;
- `pilot.system.mounted`;
- Pilot actor;
- Mech actor;
- `pilot.prototypeToken`;
- TokenDocument creation/deletion;
- Foundry grid;
- canvas scene;
- native WeaponRangeTemplate placement primitive;
- native `mount` semantic location.

—

# 68. Shared Architecture

Conceptually:

Mount/Dismount/Eject Action
→ resolve Pilot/Mech relationship
→ validate physical state
→ validate action-specific rules
→ perform physical transition

For exit actions:

Physical Exit Service
→ placement service
→ native Lancer placement helper
→ TokenDocument.create(...)
→ update `pilot.system.mounted = false`

For Mount:

Physical Mount Service
→ validate Pilot and Mech tokens
→ update `pilot.system.mounted = true`
→ delete external Pilot token

Then:

→ authoritative refresh
→ semantic event
→ action completion

—

# 69. Suggested Adapter Boundary

A dedicated native-system adapter should expose capabilities conceptually like:

- resolve mech pilot;
- resolve pilot active mech;
- read/write mounted state;
- request scene placement;
- create Pilot token;
- find Pilot tokens;
- find Mech token;
- delete Pilot token.

Exact API names are illustrative only.

UI and action-domain code should not directly know:

- `fromUuid`;
- `WeaponRangeTemplate`;
- `TokenDocument.create`;
- grid coordinate internals.

—

# 70. Do Not Invent Native Flows

No native:

`MountFlow`

`DismountFlow`

or:

`EjectFlow`

was found.

Frame Helm may implement internal execution strategies, but documentation/code should clearly identify them as Frame Helm orchestration.

The native boundary is the actor/token infrastructure and stock macro pattern.

—

# 71. Immediate Repository Research TODO

- [ ] Trace `pilot.system.active_mech` schema completely.
- [ ] Trace `mech.system.pilot` schema completely.
- [ ] Trace relationship synchronization behavior.
- [ ] Trace `pilot.system.mounted` completely.
- [ ] Confirm all runtime consumers of `mounted`.
- [ ] Trace native `activateMech(...)`.
- [ ] Trace native `deactivateMech(...)`.
- [ ] Trace the Dismount/Eject macro completely.
- [ ] Confirm `WeaponRangeTemplate.fromRange(...)` API.
- [ ] Confirm `.placeTemplate()` cancellation behavior.
- [ ] Confirm grid-snapping behavior.
- [ ] Confirm `TokenDocument.create(...)` permissions.
- [ ] Confirm token deletion API.
- [ ] Find best native helper for actor tokens on current scene.
- [ ] Trace `SynergyLocation.mount`.
- [ ] Search for Dismount/Eject semantic metadata under alternate names.
- [ ] Confirm current runtime absence of `mech.system.ejected`.
- [ ] Trace legacy packed `ejected` only as historical context.
- [ ] Search for pilot/mech combatant synchronization helpers.
- [ ] Search for native token-control transfer helpers.

—

# 72. Rules Research TODO

Before final implementation:

- [ ] Confirm exact action cost for Mount.
- [ ] Confirm exact action cost for Dismount.
- [ ] Confirm exact timing/action cost for Eject.
- [ ] Confirm whether Eject can occur outside normal turn actions.
- [ ] Confirm normal Dismount placement distance.
- [ ] Confirm Eject placement distance.
- [ ] Confirm adjacency requirements for Mount.
- [ ] Confirm occupied-space restrictions.
- [ ] Confirm terrain restrictions.
- [ ] Confirm what happens to an unpiloted mech.
- [ ] Confirm whether Eject changes mech state.
- [ ] Confirm whether Eject prevents remounting.
- [ ] Confirm whether Dismount preserves active-mech assignment.
- [ ] Confirm whether Eject preserves active-mech assignment.
- [ ] Confirm pilot/mech combat-turn behavior after exit.
- [ ] Confirm whether Pilot token should become separate Combatant.
- [ ] Confirm whether Mount removes Pilot Combatant.
- [ ] Confirm whether another pilot can Mount an unpiloted mech.
- [ ] Confirm interactions with Shutdown.
- [ ] Confirm interactions with destroyed mechs.
- [ ] Confirm interactions with Grapple.
- [ ] Confirm interactions with forced movement.

—

# 73. Implementation TODO

Implementation should occur after the current organizational refactor is complete.

Relevant decomposition targets include:

- `feature_actions`
- `feature_movement`
- `UI_application`
- `UI_movement`
- `UI_turn`

Afterward:

- [ ] Add shared Pilot/Mech physical-transition service.
- [ ] Add native-system adapter for pilot/mech relationship.
- [ ] Add mounted-state read/write adapter.
- [ ] Add placement adapter based on native Dismount/Eject pattern.
- [ ] Add Pilot-token creation adapter.
- [ ] Add Pilot-token discovery.
- [ ] Add Pilot-token deletion.
- [ ] Add Mount execution strategy.
- [ ] Add Dismount execution strategy.
- [ ] Add Eject execution strategy.
- [ ] Keep three semantic action identities distinct.
- [ ] Validate action economy.
- [ ] Validate physical mounted state.
- [ ] Validate pilot↔mech relationship.
- [ ] Validate scene/token presence.
- [ ] Validate placement.
- [ ] Prevent duplicate Pilot tokens.
- [ ] Preserve active-mech relationship where appropriate.
- [ ] Do not write nonexistent runtime `mech.system.ejected`.
- [ ] Add Frame Helm Eject metadata only if rules require it.
- [ ] Reconcile Combatant behavior.
- [ ] Reconcile Frame Helm controlled-unit presentation.
- [ ] Await all document mutations.
- [ ] Re-read authoritative state.
- [ ] Mark committed action executed only after success.
- [ ] Emit Mount/Dismount/Eject semantic events.
- [ ] Refresh Frame Helm presentation.

—

# 74. Smoke Test TODO

Dismount:

- [ ] Mech has valid Pilot relationship.
- [ ] Pilot is mounted.
- [ ] placement interaction opens.
- [ ] placement cancellation does not falsely complete action.
- [ ] legal placement creates Pilot token.
- [ ] Pilot token uses `prototypeToken`.
- [ ] Pilot token is created on current scene.
- [ ] Pilot mounted state becomes false.
- [ ] active-mech relationship remains intact.
- [ ] mech pilot relationship remains intact.
- [ ] duplicate Pilot token is not created.
- [ ] action budget spent exactly once.

Eject:

- [ ] valid Eject from mounted state.
- [ ] Dismount/Eject semantic identities remain distinct.
- [ ] Pilot token created correctly.
- [ ] mounted state becomes false.
- [ ] Eject-specific consequences applied.
- [ ] nonexistent native `mech.system.ejected` is not mutated.
- [ ] Frame Helm Eject metadata behaves correctly if required.
- [ ] action/reaction timing behaves according to rules.

Mount:

- [ ] Pilot token exists.
- [ ] active Mech token exists.
- [ ] correct mech resolved.
- [ ] adjacency validated.
- [ ] wrong mech rejected where appropriate.
- [ ] mech with another pilot rejected.
- [ ] already-mounted pilot rejected.
- [ ] mounted state becomes true.
- [ ] external Pilot token removed.
- [ ] active-mech relationship remains intact.
- [ ] mech pilot relationship remains intact.
- [ ] Frame Helm returns to correct mech presentation.

Failure/recovery:

- [ ] missing Pilot actor.
- [ ] missing Mech actor.
- [ ] missing Pilot token.
- [ ] missing Mech token.
- [ ] different scene.
- [ ] token creation failure.
- [ ] actor update failure.
- [ ] token deletion failure.
- [ ] scene changes during placement.
- [ ] duplicate token state.
- [ ] inconsistent mounted state.

—

# 75. Important Invariants

**Invariant 1**

No dedicated native Mount, Dismount, or Eject Flow was found.

**Invariant 2**

The native repository does contain a stock Dismount/Eject macro.

**Invariant 3**

The stock Dismount/Eject macro is primarily a Pilot-token placement/spawn helper, not a complete rules engine.

**Invariant 4**

Pilot↔Mech assignment is represented natively through `pilot.system.active_mech` and `mech.system.pilot`.

**Invariant 5**

Physical mounted state is separately represented through `pilot.system.mounted`.

**Invariant 6**

Ordinary Dismount should not automatically clear active-mech assignment unless confirmed rules require it.

**Invariant 7**

The current runtime Mech model does not expose a supported `mech.system.ejected` field.

**Invariant 8**

Do not write legacy packed-data `ejected` state into a nonexistent runtime field.

**Invariant 9**

Dismount and Eject may share physical-exit infrastructure but must remain separate semantic actions.

**Invariant 10**

Mount is the inverse physical transition and requires Frame Helm-owned execution.

**Invariant 11**

Pilot token creation should reuse `pilot.prototypeToken`.

**Invariant 12**

All multi-document mutations must be awaited and authoritative state re-read before Frame Helm considers execution complete.

—

# 76. Final Working Model

MOUNT / DISMOUNT / EJECT
│
├── no dedicated native Flow
│
├── native actor relationship
│   ├── Pilot
│   │   └── `system.active_mech`
│   └── Mech
│       └── `system.pilot`
│
├── native physical state
│   └── Pilot
│       └── `system.mounted`
│
├── native Dismount/Eject macro
│   │
│   ├── resolve Mech
│   ├── resolve Pilot
│   ├── tiny WeaponRangeTemplate
│   ├── `.placeTemplate()`
│   ├── grid snap
│   ├── `pilot.prototypeToken`
│   ├── `TokenDocument.create(...)`
│   └── delete template
│
├── DISMOUNT
│   │
│   ├── Frame Helm legality/action economy
│   ├── native-style placement
│   ├── create Pilot token
│   ├── `pilot.system.mounted = false`
│   └── preserve Pilot↔Mech assignment
│
├── EJECT
│   │
│   ├── Frame Helm legality/timing
│   ├── native-style placement
│   ├── create Pilot token
│   ├── `pilot.system.mounted = false`
│   ├── preserve assignment unless rules say otherwise
│   └── Frame Helm Eject-specific state/consequences
│
└── MOUNT
    │
    ├── resolve Pilot token
    ├── resolve active Mech token
    ├── validate proximity/legality
    ├── `pilot.system.mounted = true`
    ├── delete external Pilot token
    └── preserve Pilot↔Mech assignment

The critical architectural distinction is:

`active_mech / mech.pilot`
= actor relationship

while:

`pilot.system.mounted`
= physical mounted state.

The stock Lancer system already gives Frame Helm a useful native Dismount/Eject placement pattern.

Frame Helm should reuse that pattern while supplying the missing action economy, legality, state transitions, Mount behavior, Eject distinction, and player-facing orchestration.
EOF