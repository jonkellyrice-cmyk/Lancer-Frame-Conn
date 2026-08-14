const fs = require(“fs”);

const content = String.raw`# Frame Conn Movement Pathfinder — Integration Guide

## Purpose

Provide automatic route planning from token position A to destination B using all currently legal movement modes.

The pathfinder does not define movement rules.

It consumes movement capabilities and legality/cost functions from the movement rules layer.

Primary output:

\`\`\`text
semantic movement route
→ movement executor
→ existing movement tracker
\`\`\`

—

# 1. Core Pipeline

\`\`\`text
destination selected
→ resolve actor movement capabilities
→ build candidate movement states
→ search legal transitions
→ score candidate routes
→ choose lowest-cost legal route
→ final revalidation
→ execute route
→ movement tracker records expenditure
\`\`\`

—

# 2. Pathfinder State

Minimum search node:

\`\`\`text
{
  position,
  elevation,
  movementMode,
  movementSpent,
  temporaryMovementState
}
\`\`\`

Position must represent the token’s full footprint, not only its center.

—

# 3. Movement Modes

Supported movement transitions may include:

\`\`\`text
standard
difficult-terrain movement
jump
climb-up
climb-down
drop
fly
hover
teleport
special traversal
forced source-specific movement modes
\`\`\`

Available modes come from current actor capabilities.

Do not hardcode feature-specific movement inside the search algorithm.

—

# 4. Movement Capability

Normalize movement-granting features into a shared capability shape.

Conceptually:

\`\`\`text
MovementCapability
{
  id,
  mode,
  source,
  maxDistance,
  movementCost,
  canTraverse,
  canEnter,
  canExit,
  activationRequirements,
  resourceRequirements,
  restrictions
}
\`\`\`

Exact schema is implementation-specific.

—

# 5. Capability Sources

Movement capabilities may originate from:

\`\`\`text
base mech movement
Frame Traits
Pilot Talents
Core Bonuses
Mounted Systems
Core Powers
statuses/effects
temporary feature state
custom LCP automation
\`\`\`

Pathfinder consumes normalized capabilities only.

—

# 6. Standard Movement

Standard edge:

\`\`\`text
adjacent traversable space
→ cost from movement rules
\`\`\`

Respect:

\`\`\`text
terrain
token footprint
occupied spaces
elevation/support
movement restrictions
\`\`\`

—

# 7. Difficult Terrain

Do not encode difficult-terrain cost directly in pathfinder.

Ask movement rules layer:

\`\`\`text
cost(from, to, mode=standard)
\`\`\`

The search should naturally prefer cheaper routes around difficult terrain when beneficial.

—

# 8. Climb Up

Candidate transition:

\`\`\`text
lower position
→ higher traversable position
→ mode = climb-up
\`\`\`

Legality and cost come from movement rules.

Use when climbing is cheaper/necessary compared with routing around.

—

# 9. Climb Down

Candidate transition:

\`\`\`text
higher position
→ lower traversable position
→ mode = climb-down
\`\`\`

Prefer over unsafe dropping when the drop would cause unwanted fall damage.

—

# 10. Drop

Candidate transition:

\`\`\`text
higher position
→ lower position
→ mode = drop
\`\`\`

Before scoring:

\`\`\`text
calculate fall distance
calculate fall consequence
\`\`\`

Safe drop:

\`\`\`text
fall damage = 0
→ normal candidate
\`\`\`

Unsafe drop:

\`\`\`text
fall damage > 0
→ legal if rules permit
→ apply strong risk penalty by default
\`\`\`

Do not universally forbid damaging falls.

—

# 11. Jump

Jump transitions may cross:

\`\`\`text
gaps
low obstacles
elevation differences
otherwise non-walkable spaces
\`\`\`

Legality/distance/cost come from the movement capability/rules layer.

Do not approximate Jump as ordinary walking.

—

# 12. Fly

Flying transition ignores ordinary ground-path obstacles where flight rules permit.

Search state must include:

\`\`\`text
elevation
mode = fly
\`\`\`

Candidate route may:

\`\`\`text
take off
fly over obstacle
land
\`\`\`

Use normal movement cost supplied by rules.

—

# 13. Hover

Hover is a separate capability where rules distinguish it from ordinary flight.

Preserve:

\`\`\`text
hover-specific fall behavior
hover persistence
other source restrictions
\`\`\`

Do not treat every Fly capability as Hover.

—

# 14. Teleport

Teleport is a non-traversal edge.

Conceptually:

\`\`\`text
source position
→ legal destination
\`\`\`

Intermediate terrain/obstacles are ignored.

Validate:

\`\`\`text
teleport range
destination legality
destination occupancy
source-specific restrictions
resource/action availability
\`\`\`

Teleport should usually produce a direct candidate route.

—

# 15. Special Traversal

Traits/systems may permit unusual movement such as:

\`\`\`text
pass through characters
ignore terrain
move through structures
special vertical movement
special Boost movement
\`\`\`

Represent these as capability predicates.

Example:

\`\`\`text
canTraverseOccupiedCharacter = true
canEndOccupied = false
\`\`\`

Do not special-case the source feature inside pathfinding.

—

# 16. Token Footprint

Pathfinding must evaluate the entire token footprint.

For each candidate state:

\`\`\`text
all occupied spaces must fit
all occupied spaces must be legal
no prohibited overlap
elevation/support valid
\`\`\`

Required for Size 2+ characters.

—

# 17. Narrow Passages

A route is invalid if the entire token footprint cannot occupy every required position.

Do not pathfind large tokens using center-point clearance only.

—

# 18. Other Characters

Other tokens affect traversability according to movement rules.

Default candidate evaluation may include:

\`\`\`text
ally occupancy
hostile occupancy
Engagement rules
pass-through permissions
end-space restrictions
\`\`\`

Source-specific capabilities may override traversal restrictions.

—

# 19. Route Cost

Primary route score should be based on effective movement expenditure.

Conceptually:

\`\`\`text
routeScore =
  movementSpent
  + unsafeFallPenalty
  + specialResourcePenalty
  + optionalModeTransitionPenalty
  + other explicit risk penalties
\`\`\`

Do not score by geometric distance alone.

—

# 20. Movement Budget

Pathfinder receives:

\`\`\`text
remaining movement budget
\`\`\`

A route must fit within the currently available budget unless specifically planning an over-budget preview.

Do not alter the movement budget during search.

—

# 21. Safe Default

Default scoring should strongly prefer:

\`\`\`text
no self-damage
no unnecessary limited resource expenditure
no unnecessary special-mode activation
\`\`\`

when a comparable legal route exists.

—

# 22. Aggressive / Override Routing

Unsafe or expensive special routes may remain candidates.

Examples:

\`\`\`text
damaging drop
consume limited teleport
consume temporary movement resource
\`\`\`

Player may override the default safe route if desired.

—

# 23. Example — Tower

Without flight:

\`\`\`text
direct climb route = 16 movement
walk around = 10 movement

→ choose around
\`\`\`

With flight:

\`\`\`text
fly over = 7 movement

→ choose fly
\`\`\`

With legal teleport:

\`\`\`text
teleport = 5 movement

→ choose teleport
\`\`\`

Search result should emerge from cost evaluation, not hardcoded preference.

—

# 24. Semantic Route Output

Do not return only canvas points.

Return semantic segments.

Example:

\`\`\`text
[
  {
    mode: “standard”,
    from,
    to,
    cost: 2
  },
  {
    mode: “climb-up”,
    elevationDelta: 1,
    cost: 2
  },
  {
    mode: “standard”,
    cost: 1
  },
  {
    mode: “drop”,
    elevationDelta: -1,
    fallDamage: 0,
    cost: 0
  }
]
\`\`\`

Exact schema is implementation-specific.

—

# 25. Route Segment Requirements

Each segment should preserve enough data for:

\`\`\`text
execution
movement tracking
animation
debugging
resource consumption
final legality validation
\`\`\`

Suggested fields:

\`\`\`text
mode
from
to
elevationBefore
elevationAfter
movementCost
capabilitySource
resourceUse
risk/consequence
\`\`\`

—

# 26. Planning vs Execution

Keep separate:

\`\`\`text
PLAN
→ search route

EXECUTE
→ revalidate route
→ mutate token
→ spend movement/resources
\`\`\`

The pathfinder itself should not mutate token position.

—

# 27. Final Revalidation

Immediately before execution:

\`\`\`text
re-read actor state
re-read remaining movement
re-read statuses
re-read terrain/obstacles
re-read token occupancy
re-read movement capabilities
revalidate route segments
\`\`\`

If stale:

\`\`\`text
replan or reject
\`\`\`

—

# 28. Movement Tracker Integration

Existing Frame Conn movement tracking remains authoritative for actual expenditure.

Execution should report:

\`\`\`text
horizontal movement
elevation change
movement mode
movement cost
teleport distance
special movement source
\`\`\`

Do not create a second spent-movement counter.

—

# 29. Elevation Tracking

Any route segment changing elevation must feed the same movement tracker used for manual elevation changes.

Examples:

\`\`\`text
climb up
climb down
fly ascent/descent
drop
jump elevation
\`\`\`

—

# 30. Resource Integration

Movement modes may require resources.

Use \`resource-tracker.md\`.

Examples:

\`\`\`text
limited teleport
1/scene trait movement
counter-powered movement
Core Power movement mode
\`\`\`

Pathfinder may score resource use.

Resource consumption occurs only during successful execution.

—

# 31. Action Economy Integration

Some movement capabilities may require:

\`\`\`text
Boost
Protocol
Quick Action
Free Action
\`\`\`

Pathfinder must know whether the capability is currently usable.

Do not consume action economy during route search.

—

# 32. Temporary Capabilities

Current-turn/scene effects may add or remove movement modes.

Examples:

\`\`\`text
temporary flight
temporary teleport
ignore terrain until turn end
pass through characters during Boost
\`\`\`

Resolve current capability set before every plan.

—

# 33. Search Algorithm

Use graph search capable of weighted state transitions.

Recommended baseline:

\`\`\`text
A*
or
Dijkstra
\`\`\`

State includes:

\`\`\`text
position
elevation
movement mode/state
relevant resource-mode state
\`\`\`

Heuristic must not overestimate effective remaining movement cost.

—

# 34. Graph Construction

Prefer lazy neighbor generation.

For current state:

\`\`\`text
ask each available MovementCapability
→ enumerate legal transitions
→ calculate transition cost
→ create candidate states
\`\`\`

Do not prebuild every possible movement graph for the scene.

—

# 35. Teleport Search Optimization

Teleport capabilities can generate long-range edges.

Avoid enumerating every intermediate space.

Treat teleport as direct legal destination edges where possible.

—

# 36. Flight Search Optimization

Flight can greatly expand the search graph.

Constrain candidate elevation/position states to:

\`\`\`text
relevant obstacle boundaries
destination elevation
legal landing/takeoff states
remaining movement budget
\`\`\`

Avoid arbitrary unnecessary altitude states.

—

# 37. Route Tie-Breaking

When route scores are equal, prefer deterministically:

\`\`\`text
less risk
fewer resource expenditures
fewer mode transitions
fewer segments
\`\`\`

Exact tie-break order may be configured.

—

# 38. User Override

Player should be able to reject/override an automatic route.

Pathfinder assists movement; it does not remove tactical choice.

Possible UX:

\`\`\`text
drag destination
→ preview recommended path
→ confirm
or
→ choose alternate valid path/mode
\`\`\`

—

# 39. Manual Movement Compatibility

Manual movement remains supported.

If player moves manually:

\`\`\`text
existing movement tracker
→ records actual movement/elevation
\`\`\`

Pathfinder is an optional planner/executor layer.

—

# 40. Foundry Terrain Adapter

Pathfinder needs a scene adapter providing:

\`\`\`text
grid coordinates
walls/obstacles
terrain cost
elevation
token footprints
occupied spaces
valid standing spaces
\`\`\`

Keep Foundry-specific scene inspection outside the core search algorithm.

—

# 41. Rules Adapter

Movement rules adapter should answer questions such as:

\`\`\`text
canTraverse(state, destination, capability)
transitionCost(...)
fallConsequence(...)
canEndAt(...)
canPassThroughToken(...)
canChangeElevation(...)
\`\`\`

Pathfinder should not contain Lancer rule constants directly where an adapter can supply them.

—

# 42. Capability Discovery

Build current capability set from:

\`\`\`text
base movement
active statuses
Frame Traits
Talents
Core Bonuses
Mounted Systems
Core Powers
temporary effects
other automated features
\`\`\`

Only currently legal/active capabilities should enter search.

—

# 43. Unknown Movement Feature Fallback

If an unknown/custom feature is not automated:

\`\`\`text
do not invent a movement capability
\`\`\`

Player may still move manually.

Known structured movement bonuses should be normalized where safely supported.

—

# 44. Failure Result

If no legal route fits current budget:

return:

\`\`\`text
no-route
\`\`\`

with useful metadata:

\`\`\`text
minimum known cost
blocking reason if identifiable
candidate special mode unavailable
\`\`\`

Do not partially move automatically unless explicitly requested.

—

# 45. Execution Transaction

Recommended:

\`\`\`text
route selected
→ final revalidation
→ validate resources/action economy
→ reserve execution state
→ execute ordered segments
→ movement tracker records each segment
→ commit required resources
→ complete
\`\`\`

If execution fails mid-route, preserve clear partial-resolution state.

—

# 46. Segment Execution

Execute route in order.

Examples:

\`\`\`text
walk segment
→ token movement

climb
→ movement + elevation

drop
→ elevation + fall resolution

fly
→ movement/elevation

teleport
→ direct reposition
\`\`\`

Use shared movement primitives.

—

# 47. Fall Damage

Use existing/native/shared fall-damage rules.

Pathfinder only asks:

\`\`\`text
what would this drop cause?
\`\`\`

Execution owns actual consequence.

—

# 48. Status Interaction

Movement restrictions from statuses must alter capability/transition legality.

Examples:

\`\`\`text
Immobilized
Slowed
Prone
Engaged
other movement-affecting states
\`\`\`

Use centralized status/rules layer.

—

# 49. Special Movement Source Identity

Every nonstandard route segment should preserve source.

Example:

\`\`\`text
mode = teleport
sourceItemUuid = ...
sourceActionPath = ...
\`\`\`

Required for:

\`\`\`text
resource consumption
frequency tracking
chat/debug output
lifecycle
\`\`\`

—

# 50. Implementation TODO

- [ ] Define MovementCapability.
- [ ] Define semantic Route/RouteSegment.
- [ ] Add Foundry scene/grid adapter.
- [ ] Add movement-rules adapter.
- [ ] Add token-footprint legality.
- [ ] Add weighted A*/Dijkstra search.
- [ ] Add Standard movement transitions.
- [ ] Add Difficult Terrain costs.
- [ ] Add Climb Up.
- [ ] Add Climb Down.
- [ ] Add Drop with fall-risk scoring.
- [ ] Add Jump.
- [ ] Add Fly.
- [ ] Add Hover.
- [ ] Add Teleport.
- [ ] Add special traversal capabilities.
- [ ] Add resource scoring/integration.
- [ ] Add final route revalidation.
- [ ] Add semantic execution.
- [ ] Feed all segments into existing movement tracker.
- [ ] Add route preview/override.

—

# 51. Smoke Tests — Ground Routing

- [ ] shortest clear route selected.
- [ ] difficult terrain avoided when cheaper route exists.
- [ ] difficult terrain used when still cheapest.
- [ ] blocked spaces rejected.
- [ ] Size 2+ footprint respected.
- [ ] narrow passage rejects oversized token.

—

# 52. Smoke Tests — Elevation

- [ ] low obstacle climbed when efficient.
- [ ] tall obstacle routed around when cheaper.
- [ ] safe drop chosen over unnecessary climb-down.
- [ ] damaging drop avoided by default.
- [ ] climb-down chosen when safer.
- [ ] damaging drop remains available as override.

—

# 53. Smoke Tests — Special Movement

- [ ] Fly route crosses ground obstacle.
- [ ] Hover rules preserved.
- [ ] Jump crosses legal gap.
- [ ] Teleport creates direct legal route.
- [ ] illegal teleport destination rejected.
- [ ] pass-through-character capability works.
- [ ] cannot end in prohibited occupied space.

—

# 54. Smoke Tests — Budget

- [ ] route within remaining movement accepted.
- [ ] over-budget route rejected.
- [ ] special mode reducing cost changes selected route.
- [ ] movement tracker records exact final cost.
- [ ] elevation movement contributes correctly.

—

# 55. Smoke Tests — Resources

- [ ] limited teleport considered only if available.
- [ ] unavailable movement resource removes route.
- [ ] route search does not consume resource.
- [ ] confirmed route consumes resource once.
- [ ] cancelled route consumes nothing.

—

# 56. Core Invariants

**Invariant 1**

Pathfinder plans movement; it does not define Lancer movement rules.

**Invariant 2**

Existing movement tracker remains authoritative for spent movement.

**Invariant 3**

Movement capabilities are normalized from current actor features.

**Invariant 4**

Search state includes position, elevation, mode, and relevant temporary state.

**Invariant 5**

Token footprint, not center point, determines occupancy legality.

**Invariant 6**

Route score uses effective movement cost, not geometric distance alone.

**Invariant 7**

Unsafe falls remain legal candidates where rules permit but receive default risk penalties.

**Invariant 8**

Teleport is modeled as a direct non-traversal edge.

**Invariant 9**

Path planning does not consume action/resource state.

**Invariant 10**

Every route is revalidated immediately before execution.

**Invariant 11**

Output is semantic movement segments, not only canvas coordinates.

**Invariant 12**

Unknown movement features degrade to manual movement rather than invented automation.

—

# 57. Final Working Model

\`\`\`text
PLAYER DESTINATION
        │
        ▼
CAPABILITY DISCOVERY
├── standard
├── jump
├── climb
├── drop
├── fly
├── hover
├── teleport
└── feature-granted movement
        │
        ▼
PATHFINDER
├── token footprint
├── terrain
├── obstacles
├── elevation
├── occupied spaces
├── movement costs
├── risk penalties
├── remaining budget
└── resource availability
        │
        ▼
SEMANTIC ROUTE
├── standard segments
├── elevation segments
├── mode transitions
└── special movement segments
        │
        ▼
FINAL REVALIDATION
        │
        ▼
MOVEMENT EXECUTOR
        │
        ▼
EXISTING FRAME CONN MOVEMENT TRACKER
\`\`\`

Critical rule:

**The pathfinder asks the movement rules layer which transitions are legal and what they cost, then finds the cheapest valid route using the actor’s currently available movement capabilities.**
`;

fs.writeFileSync(“pathfinder.md”, content, “utf8”);

console.log(
  `Wrote pathfinder.md (${content.split(“\n”).length} lines, ${Buffer.byteLength(content, “utf8”)} bytes)`
);